/**
 * 文档生成  mayson 大模型文档结点内容生成
 */
commonHM.component['hmAi'].fnSub("generator", {
    init:function(){
        var _t = this;
        _t.Url = _t.parent.Url;
        _t.converter = new showdown.Converter({
            tables: true,
            tasklists: true,
            strikethrough: true,
            ghCodeBlocks: true,
            smartIndentationFix: true,
            parseImgDimensions: true,
            simplifiedAutoLink: true,
            literalMidWordUnderscores: true,
            emoji: true
          });
        _t.winHeight = $('body').height();
        
        // 初始化批量处理相关属性
        _t.batchQueue = [];
        _t.batchProcessedCount = 0;
        _t.batchTotalCount = 0;
        _t.batchProcessing = false;
        /** 随手病历：点击正文时的外部回调（由 showAiDraft 注册） */
        _t._casualDraftTextClick = null;
        /** 当前保留/弃用弹窗关联的草稿根节点（.r-model-gen），用于区分 AI / 随手 */
        _t._popupActiveDraftEl = null;
        $(window).resize(function () {
            _t.setPosition();
        });
    },
    /**
     * 调用提醒端 API 生成内容（可能多次回调：flag=1 进行中，2 成功，3 失败，4 中断，5 不支持）
     * @param {*} traget - 目标 DOM 节点（输入框容器）
     * @param {*} type - 生成类型
     * @param {*} from - 来源，如 'generateDocument' 表示批量生成
     */
    generateMessage: function (traget,type,from) {
        var _t = this;
        var JTar = $(traget);
        var editorTool = _t.parent.editorTool,
            utils = _t.parent.utils;
        if(editorTool && editorTool.callCommand('isOpen')){
            return;
        }
        // 已有未处理的生成结果时不再发起新请求
        if(JTar.find('.r-model-gen').length){
            return;
        }
        // 非批量时：若有进行中的任务则不再发起
        if(from != 'generateDocument' && (_t.progressFlag==1 || _t.parent.hasTask)){
            return;
        }
        _t.target = traget;
        _t.fillIndex = 0; // 打字效果回填索引，每次生成重置
        var content = utils.getContent(JTar);
        var uuId = utils.getUUId(); 
        var position = utils.getPosition(JTar.closest('p')[0]);
        var keyTar = JTar.closest('span[data-hm-code]');
        editorTool.callCommand('openGenRecord',{
            position:position,
            data:{
                nodeName: keyTar.attr('data-hm-name'),
                nodeCode:keyTar.attr('data-hm-code'),
                content:content
            },
            type:type
        }, function (message, flag) {
            if(flag!=1){
                console.log('flag------------------------------:',flag);
            }
            if(flag!=5){
                _t.popupProgress(JTar);
                // 回填并播放打字效果；回调在「本轮打字结束」时执行（此时轮询可能尚未结束）
                _t.fillText(message,JTar,uuId,function(){
                    // 仅当轮询结束(flag!=1)时：显示「AI内容，请确认」按钮并更新弹框/批量逻辑
                    if(flag!=1){
                        // 显示「AI内容，请确认」按钮
                        JTar.find('.r-model-gen-btn').removeClass('r-model-gen-btn-hidden');
                        // 更新进度弹框状态（flag===4 且非批量时提示中断）
                        _t.manageProgress(2, flag===4 && from!=='generateDocument');
                        // 批量生成场景：当前节点结束后处理结果并驱动下一节点
                        if(from=='generateDocument'){
                            _t.batchProcessing = false;
                            if (flag==2) {
                                // 生成成功：自动采纳 AI 结果写入文档
                                _t.accpetAiResult(JTar,'r-model-gen','generateDocument');
                            }else if(flag==3 || flag==4){
                                // 失败或中断：弃用当前草稿
                                _t.ignoreAiResult(JTar,'r-model-gen');
                            }
                            _t.closePopup();
                            if(_t.batchQueue && _t.batchQueue.length > 0) {
                                _t.processNextBatchNode();
                            }
                        }
                       
                    }
                });
            } else {
                // flag===5：该节点不支持，批量时继续下一个
                if(from=='generateDocument' && _t.batchQueue && _t.batchQueue.length > 0) {
                    _t.processNextBatchNode();
                }
            }
           
        });
        //直接生成
        // if(type==2){
        //     _t.popupProgress(JTar);
        // }
        //  var message = '切除术前行胸部CT检查示左肺上叶尖后段见不规则结节影，周围见毛刺，内部见小空腔影，大小约为18*17mm。诊断为左肺上叶尖后段结节，肿瘤性病变不能除外。之后入住胸外科，并于2020.07.23行胸腔镜左肺上叶切除术，术顺，术后予以抗炎、化痰等治疗。';
        //  _t.popupProgress(JTar);
        // _t.fillText(message,JTar,uuId,function(){
        //     _t.manageProgress(2);
        // });
    },
    /**
     * 重置弹框位置（Composer 等外部定位）
     */
    setPosition:function(){
        var _t = this;
        var editorTool = _t.parent.editorTool,
            utils = _t.parent.utils;
        if(editorTool && editorTool.callCommand('isOpen')){
            var position = utils.getPosition($(_t.target).closest('p')[0]); 
            editorTool.callCommand('setPosition',position);
        }
    },

    /**
     * 回填内容：将 message 以打字机效果逐字写入编辑区，结束后执行回调
     * 每次有新内容回填时会先隐藏「AI内容，请确认」按钮，避免轮询未结束时误展示
     * @param {string} message - 待回填的全文（可能随轮询多次增长）
     * @param {jQuery} JTar - 目标输入框容器
     * @param {string} uuid - 本次生成唯一标识
     * @param {Function} cbk - 打字效果结束后的回调（由调用方根据 flag 决定是否显示按钮等）
     */
    fillText: function (message,JTar,uuid,cbk) {
        var _t = this;
        if (message) {
            JTar.find('.r-model-gen-remark').remove();
            // 每次开始回填都先隐藏按钮，避免中途轮询返回新内容前按钮已露出
            JTar.find('.r-model-gen-btn').addClass('r-model-gen-btn-hidden');
            if (_t.fillInervalId) {
                clearInterval(_t.fillInervalId);
                _t.fillInervalId = null;
            }
            _t.fillInervalId = setInterval(function () {
                if (message && _t.fillIndex <= message.length) {
                    var currMessage = message.slice(0, _t.fillIndex++);
                    var html = _t.converter.makeHtml(currMessage);
                    var jDom = $('<div>').html(html);
                    var currText = jDom.text().replace(/\n+/g,'\n');
                    if(currText.length%10==0 && _t.popup){
                        _t.popup.setPostion(2,-80);
                    }
                    _t.insertAiResult(JTar, {
                        className: 'r-model-gen',
                        text: currText,
                        uuid: uuid,
                        casualDraft: false
                    });
                } else {
                    if (_t.fillInervalId) {
                        clearInterval(_t.fillInervalId);
                        _t.fillInervalId = null;
                    }
                    if (_t.popup) {
                        _t.popup.setPostion(2,-80);
                    }
                    cbk && cbk();
                }
            }, 30);
        } else {
            cbk && cbk();
        }
    },
    /** 滚动文档使 Composer 区域可见 */
    documentScroll:function(){
        var _t = this;
        var $body =this.parent.editor.document.$.documentElement;
        var $container = _t.popupComposer.container;
        var pos =$container.offset(),containerHeight = $container.height();
        if(pos.top+containerHeight-$body.scrollTop+150>_t.winHeight){
            $body.scrollTop = pos.top+containerHeight-_t.winHeight+150;
        }
    },
    /**
     * 重新打开待处理弹窗（点击生成块时）：无进行中任务且非当前弹窗则关闭旧弹窗并打开进度弹框
     * @param {*} relDom - 被点击的 DOM（如 .r-model-gen）
     * @returns {boolean} - 是否已处理（有进行中任务或已是当前弹窗时返回 false）
     */
    reOpenPopupProgress:function(relDom){
        var _t = this;
        var utils = _t.parent.utils;
        utils.focusInputFirst(relDom);
        if(_t.progressFlag==1||_t.parent.hasTask){  //有进行中的任务
            return false;
        }
        var jTar = $(relDom).closest('.new-textbox-content');
        if(_t.popup && _t.popup.relEl[0] == jTar[0]){
            return false;
        }else{
            _t.closePopup();
            _t.popupProgress(jTar[0],2, relDom);
        }
    },
    /**
     * 弹出进度条（保留/弃用）
     * @param {*} relDom - 关联的输入区域 DOM
     * @param {number} [flag] - 1=进行中，2=已完成，用于初始标题与按钮状态
     * @param {HTMLElement} [activeDraftEl] - 当前操作的草稿根节点（.r-model-gen），用于区分 AI / 随手
     */
    popupProgress:function(relDom,flag,activeDraftEl){
        var _t = this,editor = this.parent.editor;
        if( _t.popup){
            return;
        }
        _t._popupActiveDraftEl = activeDraftEl != null ? activeDraftEl : null;
        var $body =_t.$body= $(editor.document.getBody().$);
        _t.popup=$(relDom).popupMessage({
            message: '',
            // inside:true,
            type:2,
            theam:1,
            width:"350px",
            container:$(relDom).parents(".cke_widget_wrapper_emrWidget")
         });
         _t.popup.container.attr('contenteditable',false).find('.sk-popup-container').renderTpl($docAi_tpl['docAi/tpl/generate'],{});
         _t.popup.setPostion(2,-80);
         if(activeDraftEl){
            _t.resetPopupPosition(activeDraftEl,$body );
         } 
         _t.manageProgress(flag||1);
         _t.popup.container.on('click','.btn-stop',function(){
            _t.stopGenerate();
        }).on('click','.btn-confirm',function(){ 
            _t.accpetAiResult(_t.popup.relEl[0],'r-model-gen', undefined, _t._popupActiveDraftEl);
            _t.closePopup();
        }).on('click','.btn-cancel',function(){
            _t.ignoreAiResult(_t.popup.relEl[0], 'r-model-gen', _t._popupActiveDraftEl);
            _t.closePopup();
        }).on('click',function(){
            return false;
        });

    },
    /**
     * 停止生成：通知端停止并清除打字定时器，弹框切为「完成」状态
     */
    stopGenerate:function(){
        var _t = this; 
        _t.parent.editorTool && _t.parent.editorTool.callCommand('stopGenerate');
        if (_t.fillInervalId) {
            clearInterval(_t.fillInervalId);
            _t.fillInervalId = null;
        }
        _t.manageProgress(2);
    //    _t.closePopup();
    },
    /**
     * 解析当前要操作的单个草稿根节点（优先 activeDraftEl / 弹窗关联节点）
     * @param {jQuery} $target - .new-textbox-content
     * @param {String} className
     * @param {*} [activeDraftEl]
     * @returns {jQuery}
     */
    _resolveDraftBlock: function ($target, className, activeDraftEl) {
        var _t = this;
        var containerEl = $target[0];
        if (!containerEl) return $();
        var resolved = activeDraftEl != null ? activeDraftEl : _t._popupActiveDraftEl;
        var $el = $();
        if (resolved && $.contains(containerEl, resolved)) {
            $el = $(resolved).closest('.' + className);
            if (!$el.length) {
                $el = $(resolved).filter('.' + className);
            }
        }
        if (!$el.length) {
            $el = $target.find('.' + className).not('.r-model-gen-casual').first();
        }
        if (!$el.length) {
            $el = $target.find('.' + className + '.r-model-gen-casual').first();
        }
        return $el;
    },
    /**
     * 弃用 AI 结果：移除对应草稿块；未指定时按 AI → 随手 顺序取首个
     */
    ignoreAiResult:function(target,uucode,activeDraftEl){
        var _t = this;
        var $target = $(target);
        var containerEl = $target[0];
        if (!containerEl) return;
        var $block = _t._resolveDraftBlock($target, 'r-model-gen', activeDraftEl);
        if ($block.length) {
            $block.remove();
        }
        _t._popupActiveDraftEl = null;
        _t.restoreBlankContent(containerEl);
    },
    /**
     * 使用 AI 结果：用 r-model-gen-text 的正文替换整块 r-model-gen，保留/弃用按钮不再展示
     * @param {*} from - 'generateDocument' 时仅替换内容不移动光标，用于批量生成
     * @param {HTMLElement} [activeDraftEl] - 指定草稿根节点（与 confirmAiDraft 逐条传入一致）
     */
    accpetAiResult:function(target,className,from,activeDraftEl){
        var _t = this;
        var editor = this.parent.editor;
        var $target = $(target);
        var containerEl = $target[0];
        if (!containerEl) return;
        var aiResult = _t._resolveDraftBlock($target, className, activeDraftEl);
        if (!aiResult.length) return;
        var isCasual = aiResult.hasClass('r-model-gen-casual');
        if (from === 'generateDocument') {
            var textContentGd = aiResult.find('.r-model-gen-text').contents();
            if (aiResult.hasClass('r-model-gen-casual')) {
                aiResult.replaceWith($('<span>').addClass('r-model-casual-text').append(textContentGd));
            } else {
                aiResult.replaceWith(textContentGd);
            }
            _t._popupActiveDraftEl = null;
            return;
        }
        if (isCasual) {
            var textCasual = aiResult.find('.r-model-gen-text').contents();
            aiResult.replaceWith($('<span>').addClass('r-model-casual-text').append(textCasual));
        } else {
            // AI 草稿：清空正文并写入采纳的 AI；已采纳随手（.r-model-casual-text）按相对 AI 块的前后顺序保留；未确认随手块保留在末尾
            var $cloned = aiResult.find('.r-model-gen-text').contents().clone(true);
            var aiEl = aiResult[0];
            var $beforeCasualText = $();
            var $afterCasualText = $();
            var prec = typeof Node !== 'undefined' ? Node.DOCUMENT_POSITION_PRECEDING : 2;
            var foll = typeof Node !== 'undefined' ? Node.DOCUMENT_POSITION_FOLLOWING : 4;
            $target.find('.r-model-casual-text').each(function () {
                var el = this;
                if (!aiEl || el === aiEl || ($.contains && $.contains(aiEl, el))) return;
                var pos = aiEl.compareDocumentPosition(el);
                if (pos & prec) {
                    $beforeCasualText = $beforeCasualText.add(el);
                } else if (pos & foll) {
                    $afterCasualText = $afterCasualText.add(el);
                }
            });
            $beforeCasualText.detach();
            $afterCasualText.detach();
            var $casuals = $target.find('.r-model-gen-casual').detach();
            $target.empty();
            $target.append($beforeCasualText);
            $target.append($cloned);
            $target.append($afterCasualText);
            $target.append($casuals);
            if ($.trim($target.text() || '')) {
                $target.removeAttr('_placeholdertext');
            }
        }
        _t._popupActiveDraftEl = null;
        // 非批量时：将光标移到该节点末尾
        var range = editor.createRange();
        var element = new CKEDITOR.dom.element($target[0]);
        range.selectNodeContents(element);
        range.collapse(false); // 折叠到末尾

        editor.getSelection().selectRanges([range]);
        editor.focus();
    },
    /**
     * 插入 AI 临时结果到目标容器
     * 结构：r-model-gen + r-model-gen-normal|r-model-gen-casual > r-model-gen-text + r-model-gen-btn
     * @param {jQuery} JTar - 目标输入框容器
     * @param {Object} options - className, text, uuid, showBtn, casualDraft, sourceId（随手时为当前 data 项的 sourceId）
     * @param {String} [options.draftBtnText] 自定义草稿确认按钮文案；非空时 AI 草稿与随手病历均使用该文案，否则沿用各模式默认
     *
     * 实现要点：
     * - 草稿根节点类名：r-model-gen + r-model-gen-normal | r-model-gen-casual
     * - 子结构：r-model-gen-text（正文）、r-model-gen-btn（按钮，含隐藏态 class）
     * - 新建与更新分支同步 class、按钮文案（随手「随手记录，请确认」）、扩展字段
     * - 随手模式：写入 data-hm-casual-source-id；同一容器内相同 sourceId 复用并更新该块，不同 sourceId 追加
     * - AI 模式：移除随手扩展字段
     *
     * 验收要点：
     * - 方案 §3.4；打印/导出仍可统一按 .r-model-gen 处理（§3.6）
     */
    insertAiResult:function(JTar,options){
        // 兼容唤醒态占位：checkDataSource 会写入 .r-model-gen-remark（ctrl+/ 唤醒AI）
        // 追加/覆盖草稿前统一移除，避免占位文案与草稿正文并存
        JTar.find('.r-model-gen-remark').remove();
        // 占位态：追加草稿/随手前须清空占位内容并去掉 _placeholdertext，避免与真实草稿并存
        if (JTar.attr('_placeholdertext') === 'true') {
            JTar.empty();
            JTar.removeAttr('_placeholdertext');
        }
        // 判断是否为随手模式
        var casual = !!options.casualDraft;
        // 根据随手模式确定类名和按钮文案（draftBtnText 非空时草稿/随手均使用该文案）
        var typeClass = casual ? 'r-model-gen-casual' : 'r-model-gen-normal';
        var draftBtnTrim = options.draftBtnText != null && String(options.draftBtnText).trim() !== ''
            ? String(options.draftBtnText).trim()
            : '';
        var btnLabel = draftBtnTrim || (casual ? '随手记录，请确认' : 'AI内容，请确认');
        var syncCasualSource = function ($c) {
            if (casual && options.sourceId !== undefined && options.sourceId !== null && options.sourceId !== '') {
                $c.attr('data-hm-casual-source-id', String(options.sourceId));
                $c.data('hmCasualSourceId', options.sourceId);
            } else {
                $c.removeAttr('data-hm-casual-source-id');
                $c.removeData('hmCasualSourceId');
            }
        };
        var updateGenBlock = function ($block) {
            $block.find('.r-model-gen-text').html(options.text);
            if (!$block.hasClass(typeClass)) {
                $block.removeClass('r-model-gen-normal r-model-gen-casual').addClass(typeClass);
            }
            syncCasualSource($block);
            var $btn = $block.find('.r-model-gen-btn');
            if ($btn.length && $btn.text() !== btnLabel) {
                $btn.text(btnLabel);
            }
        };
        // 随手：相同 sourceId 替换（更新）已有块；不同 sourceId 在下方分支追加
        if (casual && !options.forceNew) {
            var sidRaw = options.sourceId;
            if (sidRaw !== undefined && sidRaw !== null && sidRaw !== '') {
                var sidKey = String(sidRaw);
                var $sameSource = JTar.find('.' + options.className + '.r-model-gen-casual').filter(function () {
                    var $el = $(this);
                    var attr = $el.attr('data-hm-casual-source-id'); 
                    if (attr !== undefined && attr !== null && String(attr) === sidKey) {
                        return true;
                    }
                    var dj = $el.data('hmCasualSourceId');
                    return dj !== undefined && dj !== null && String(dj) === sidKey;
                });
                if ($sameSource.length) {
                    var $keep = $sameSource.first();
                    if ($sameSource.length > 1) {
                        $sameSource.slice(1).remove();
                    }
                    updateGenBlock($keep);
                    return;
                }
            }
        }
        // AI 草稿与随手草稿共用 .r-model-gen，匹配时需区分，避免更新到错误的块
        var container = JTar.find('.' + options.className).not('.r-model-gen-casual');
        // forceNew=true 时强制新建节点，不复用已有 AI 草稿
        if(container.length && !options.forceNew && !casual){
            // 已存在 AI 草稿时仅保留首条并更新，避免重复追加多条
            var $first = container.first();
            if (container.length > 1) {
                container.slice(1).remove();
            }
            updateGenBlock($first);
        }else{
            var btnClass = 'r-model-gen-btn' + (options.showBtn ? '' : ' r-model-gen-btn-hidden');
            var fullClass = options.className + ' ' + typeClass;
            var spanAttrs = {
                'class': fullClass,
                'uucode': options.uuid
            };
            if (casual && options.sourceId !== undefined && options.sourceId !== null && options.sourceId !== '') {
                spanAttrs['data-hm-casual-source-id'] = String(options.sourceId);
            }
            container = $('<span>').attr(spanAttrs).append(
                $('<span>').addClass('r-model-gen-text').html(options.text),
                $('<span>').addClass(btnClass).text(btnLabel)
            );
            if (casual && options.sourceId !== undefined && options.sourceId !== null && options.sourceId !== '') {
                container.data('hmCasualSourceId', options.sourceId);
            }
            JTar.removeAttr('_placeholdertext').append(container);
        }
    },
    /**
     * 管理进度弹框状态与按钮：进行中显示停止，完成后显示保留/弃用
     * @param {number} flag - 1=进行中，2=完成
     * @param {boolean} [isInterrupted] - 为 true 时标题显示「生成中断」
     */
    manageProgress:function(flag, isInterrupted){
        var _t = this;
        if(!_t.popup){
            return;
        }
        _t.progressFlag = flag;
        var popupContainer = _t.popup.container;
        if(flag==1){
            popupContainer.find('.btn-stop').addClass('popu-active');
            _t.parent.hasTask = true;
        }else{
            popupContainer.find('.doc-composer-title').text(isInterrupted ? '生成中断' : '生成完成');
            popupContainer.find('.btn-confirm').addClass('popu-active');
            popupContainer.find('.btn-cancel').addClass('popu-active');
            popupContainer.find('.btn-stop').removeClass('popu-active');
            _t.parent.hasTask = false;
        }
    },
    /**
     * 恢复空白备注：内容为空时根据 generate 属性写占位或生成备注，并设置 _placeholdertext 以应用 placeholder 样式
     * @param {*} inputDom - 输入框容器节点
     */
    restoreBlankContent: function (inputDom) {
        var _t = this;
        var content = $.trim(inputDom.innerText || inputDom.textContent).replace(zeroWidthChar, "");
        var Jm = $(inputDom);
        if (!content) {
            if(Jm.attr('generate')==1){
                _t.generateRemark(Jm);
            }else{
                var placeholder = Jm.closest('.new-textbox').attr('_placeholder') || '';
                Jm.text("\u200B" + placeholder);
            }
            Jm.attr('_placeholdertext', 'true');
        }
    },
    /**
     * 自动生成备注
     */
    generateRemark: function (JTar) {
        var _t = this;
        var newNode = $('<span class="r-model-gen-remark">');
        newNode.html('ctrl+/ 唤醒AI');
        JTar.html(newNode);
    },
    closePopup:function(){
        var _t = this;
        if(_t.popup){
            _t.popup.remove();
            _t.popup = null;
        }
        _t._popupActiveDraftEl = null;
    },
    /**
     * 病历生成 - 获取当前widget中可AI生成的数据元节点并进行批量生成
     */
    generateDocument: function() {
        var _t = this;
        var editorTool = _t.parent.editorTool;
        if(editorTool && editorTool.callCommand('isOpen')){
            return;
        }
        var editor = this.parent.editor;
        
        // 检查是否有进行中的任务
        if(_t.progressFlag==1 || _t.parent.hasTask){
            console.warn('有进行中的任务，请等待完成');
            return;
        }
        
        // 获取所有可AI生成的数据元节点
        var generateNodes;
        if(_t.parent.$widget && _t.parent.$widget.length > 0) {
            generateNodes = _t.parent.$widget.find('.new-textbox-content[generate="1"]');
        } else {
            console.warn('未找到可AI生成的病历');
            return;
        }
        
        if(generateNodes.length === 0) {
            console.warn('未找到可AI生成的数据元节点');
            return;
        }
        
        console.log('找到可AI生成的数据元节点数量:', generateNodes.length);
        
        // 初始化批量处理队列
        _t.batchQueue = [];
        _t.batchProcessedCount = 0;
        _t.batchTotalCount = generateNodes.length;
        _t.batchProcessing = false;
        
        // 将需要处理的节点添加到队列
        generateNodes.each(function(index, node) {
            var $node = $(node);
            
            // 检查节点是否已经有生成结果
            if($node.find('.r-model-gen').length === 0) {
                _t.batchQueue.push({
                    node: node,
                    index: index
                });
            } else {
                console.log('节点已有生成结果，跳过:', index);
            }
        });
        
        if(_t.batchQueue.length === 0) {
            console.warn('所有节点都已有生成结果或无需处理');
            return;
        }
        
        console.log('病历生成已启动，将处理', _t.batchQueue.length, '个数据元节点');
        
        // 开始处理第一个节点
        _t.processNextBatchNode();
    },
    
    /**
     * 处理批量队列中的下一个节点
     */
    processNextBatchNode: function() {
        var _t = this;
        
        if(_t.batchProcessing) {
            return; // 正在处理中，避免重复调用
        }
        
        if(_t.batchQueue.length === 0) {
            // 所有节点处理完成
            _t.batchProcessing = false;
            console.log('批量处理完成，共处理', _t.batchProcessedCount, '个节点');
            return;
        }
        
        _t.batchProcessing = true;
        var nextNode = _t.batchQueue.shift();
        
        console.log('开始处理节点:', nextNode.index, '剩余:', _t.batchQueue.length);
        
        try {
            _t.generateMessage(nextNode.node, 2, 'generateDocument');
            _t.batchProcessedCount++;
        } catch(e) {
            console.error('处理节点失败:', e);
            // 即使失败也要继续处理下一个
            _t.batchProcessing = false;
            setTimeout(function() {
                _t.processNextBatchNode();
            }, 100);
        }
    },

    /**
     * 在容器内根据 keyCode/keyName 解析目标输入框 .new-textbox-content，找不到返回 null
     * @param {jQuery} $container 文档节点容器
     * @param {Object} dataItem 数据元项 { keyCode, keyName }
     * @returns {jQuery|null}
     */
    _getAiDraftContentBox: function ($container, dataItem) {
        var $node = null;
        if (dataItem.keyCode) {
            $node = $container.find('[data-hm-code="' + dataItem.keyCode + '"]:not([data-hm-node="labelbox"])');
        }
        if (!$node || $node.length === 0) {
            if (dataItem.keyName) {
                $node = $container.find('[data-hm-name="' + dataItem.keyName + '"]:not([data-hm-node="labelbox"])');
            }
        }
        if (!$node || $node.length === 0) {
            if ($container.attr('data-hm-code') === dataItem.keyCode || $container.attr('data-hm-name') === dataItem.keyName) {
                $node = $container;
            }
        }
        if (!$node || $node.length === 0) return null;
        var $target = $node.first();
        var $content = $target.hasClass('new-textbox-content') ? $target : $target.find('.new-textbox-content').first();
        return $content.length ? $content : null;
    },

    /**
     * 规范化数据元 keyValue：数组转拼接字符串，其它转 String，空值转 ''
     * @param {*} val
     * @returns {String}
     */
    _normalizeKeyValue: function (val) {
        if (Array.isArray(val)) return val.join('');
        return val !== undefined && val !== null ? String(val) : '';
    },

    /**
     * 随手病历：data 数组单项是否包含有效 sourceId（与 showAiDraft 的 dataList 参考结构一致）
     * @param {*} dataItem
     * @returns {boolean}
     */
    _isValidCasualSourceId: function (dataItem) {
        if (!dataItem || !Object.prototype.hasOwnProperty.call(dataItem, 'sourceId')) return false;
        var sid = dataItem.sourceId;
        if (sid === null || sid === undefined) return false;
        if (typeof sid === 'number') return !isNaN(sid);
        if (typeof sid === 'string') return $.trim(sid) !== '';
        return true;
    },

    /**
     * 显示AI草稿内容（支持多份病历）
     * 与单节点生成保持一致：在对应数据元的 .new-textbox-content 内插入 r-model-gen 结构（正文 +「AI内容，请确认」），点击后复用单节点弹框与保留/弃用逻辑
     * @param {Object} opts
     * @param {Array} opts.dataList 内容列表，每项格式同 setDocData（已由 openApi 规范为数组）
     * @param {Number} [opts.displayType] 展示方式：0-覆盖（先清空原内容再展示），1-追加（默认）
     * @param {Boolean} [opts.casualDraft] 是否为随手病历：true 时增加随手样式与文案，正文点击走 onCasualTextClick，按钮点击打开保留/弃用弹框
     * @param {String} [opts.draftBtnText] 自定义草稿确认按钮文案；传值且非空时 AI 草稿与随手病历均使用该文案，否则沿用各模式默认
     * @param {Function} [opts.onCasualTextClick] 随手病历正文点击回调 function (nativeEvent, $rModelGen, sourceId)；sourceId 来自该块对应 data 项
     *
     * 实现要点：
     * - displayType === 0 时覆盖「原文」与 AI 草稿（.r-model-gen-normal），已追加的随手块 .r-model-gen-casual 保留（同次插入的 sourceId 会从保留集中剔除以免重复）；追加时 AI 草稿复用首条并更新，随手同 sourceId 替换块、不同 sourceId 追加
     * - casualDraft / onCasualTextClick 注册 _casualDraftTextClick（单例，最后一次为准）
     * - 跳过 TABLE_ 前缀 keyCode（表格数据元不处理）
     * - 随手模式下校验 sourceId 有效性（_isValidCasualSourceId），无效项 warn 并跳过
     *
     * 验收要点：
     * - 方案 §3.3、§5.1；与需求 §3.2、§3.3 对齐
     */
    showAiDraft: function (opts) {
        var _t = this;
        var utils = _t.parent.utils;

        // 关闭已有弹框
        _t.closePopup();

        // 校验 opts 对象
        if (!opts || typeof opts !== 'object') return;
        var dataList = opts.dataList;
        // 校验 dataList 数组
        if (!dataList || !Array.isArray(dataList) || dataList.length === 0) return;
        // 解析参数：displayType、casualDraft、onCasualTextClick
        var displayType = opts.displayType === 0 ? 0 : 1;
        var isCasual = !!opts.casualDraft;
        var onCasualTextClick = opts.onCasualTextClick;
        // 注册随手回调（单例，最后一次为准）
        _t._casualDraftTextClick = isCasual && typeof onCasualTextClick === 'function' ? onCasualTextClick : null;

        var editor = _t.parent.editor;
        if (!editor || !editor.document || !editor.document.$) {
            console.warn('showAiDraft: 编辑器或文档未就绪');
            return;
        }
        var $doc = $(editor.document.$);

        dataList.forEach(function (item) {
            if (!item.code) return;
            var $nodes = $doc.find('[doc_code="' + item.code + '"]');
            if ($nodes.length === 0) return;

            (item.data || []).forEach(function (dataItem) {
                if (!dataItem.keyCode && !dataItem.keyName) return;
                if (dataItem.keyCode && dataItem.keyCode.indexOf('TABLE_') === 0) return;

                if (isCasual && !_t._isValidCasualSourceId(dataItem)) {
                    console.warn(
                        'showAiDraft: 随手病历下每条 data 须含有效 sourceId（见 dataList 结构参考），已跳过：',
                        dataItem.keyCode || dataItem.keyName || dataItem
                    );
                    return;
                }

                var text = _t._normalizeKeyValue(dataItem.keyValue);

                $nodes.each(function () {
                    var $content = _t._getAiDraftContentBox($(this), dataItem);
                    if (!$content) return;

                    var $preservedCasual = $();
                    if (displayType === 0) {
                        // 覆盖模式：只清原文与 AI 草稿，保留已追加的随手块
                        $preservedCasual = $content.find('.r-model-gen-casual').detach();
                        $content.removeAttr('_placeholdertext').empty();
                    }
                    _t.insertAiResult($content, {
                        className: 'r-model-gen',
                        text: text,
                        uuid: utils.getUUId(),
                        showBtn: true,
                        casualDraft: isCasual,
                        sourceId: isCasual ? dataItem.sourceId : undefined,
                        draftBtnText: opts.draftBtnText
                    });
                    if (displayType === 0 && $preservedCasual.length) {
                        var $toAppend = $preservedCasual;
                        if (isCasual && _t._isValidCasualSourceId(dataItem)) {
                            var keepSid = String(dataItem.sourceId);
                            $toAppend = $preservedCasual.filter(function () {
                                var $el = $(this);
                                var a = $el.attr('data-hm-casual-source-id');
                                if (a !== undefined && a !== null && String(a) === keepSid) {
                                    return false;
                                }
                                var dj = $el.data('hmCasualSourceId');
                                if (dj !== undefined && dj !== null && String(dj) === keepSid) {
                                    return false;
                                }
                                return true;
                            });
                        }
                        if ($toAppend.length) {
                            $content.append($toAppend);
                        }
                    }
                });
            });
        });
    },
    /**
     * 获取待处理的 AI 草稿块列表（.r-model-gen 节点，支持按 keyList 筛选）
     * @param {Array|String} [keyList] - 数据元编码数组或单个编码（可选），不传返回全部
     * @returns {jQuery} 匹配的 .r-model-gen 元素集合
     */
    _getAiDraftFileds: function (keyList) {
        var _t = this;
        // 获取编辑器实例
        var editor = _t.parent.editor;
        // 若无编辑器或文档对象，则返回空集合
        if (!editor || !editor.document) return $();
        // 获取文档 body
        var $body = $(editor.document.getBody().$);
        // 查找所有 .r-model-gen 元素（AI 草稿块）
        var $all = $body.find('.r-model-gen');
        // 若不传 keyList，返回全部草稿节点
        if (!keyList) return $all;
        // 标准化 keyList 为数组
        var list = Array.isArray(keyList) ? keyList : [keyList];
        // 若筛选列表为空，返回全部草稿节点
        if (list.length === 0) return $all;
        // 根据数据元编码筛选相应的草稿节点
        return $all.filter(function () {
            var code = $(this).closest('span[data-hm-code]').attr('data-hm-code');
            return code && list.indexOf(code) !== -1;
        });
    },
    /**
     * AI 草稿确认（采纳）：支持全部或按 keyList 批量确认，与单节点一致用 accpetAiResult 替换内容
     * 步骤：关闭进度弹框 → 按 keyList 获取待确认的 .r-model-gen 草稿节点（不传则全部）→ 逐条采纳（用 r-model-gen-text 正文替换整块 r-model-gen）
     * @param {Array|String} [keyList] 数据元编码数组，不传则确认全部 AI 草稿
     */
    confirmAiDraft: function (keyList) {
        var _t = this;
        // 关闭已有弹框
        _t.closePopup(); // 关闭进度弹框
        var $fileds = _t._getAiDraftFileds(keyList); // 按 keyList 获取待确认的 .r-model-gen 草稿节点（不传则全部）
        $fileds.each(function () {
            var target = $(this).closest('.new-textbox-content')[0];
            if (target) _t.accpetAiResult(target, 'r-model-gen', undefined, this);
        });
    },
    /**
     * AI 草稿弃用（取消）：支持全部或按 keyList 批量弃用，与单节点一致用 ignoreAiResult
     * @param {Array|String} [keyList] 数据元编码数组，不传则弃用全部 AI 草稿
     */
    cancelAiDraft: function (keyList) {
        var _t = this;
        // 关闭已有弹框
        _t.closePopup();
        var $fileds = _t._getAiDraftFileds(keyList);
        $fileds.each(function () {
            var target = $(this).closest('.new-textbox-content')[0];
            if (target) _t.ignoreAiResult(target, 'r-model-gen', this);
        });
    },
     /**
     * 重置弹窗位置
     */
    resetPopupPosition: function (activeDraftEl,$body ) {
        var _t = this;
        if (!_t.popup) {
            return;
        }
        var container = _t.popup.container;
        var relEl = activeDraftEl;
        var relElBtn = $(relEl).find('.r-model-gen-btn');
        var pos={
            left: relEl.offsetLeft,
            top: relEl.offsetTop
        };
        var btnPos = {
            left: relElBtn[0].offsetLeft,
            top: relElBtn[0].offsetTop
        }; // 获取btnPos 的位置
        var bodyW = $body.width();

        var h = parseFloat($(relEl).outerHeight()),
            cw = parseFloat(container.outerWidth());

        var icon = container.find('.sk-popup-icon').addClass('sk-popup-icon-' + _t.popup.type);
        var icw = icon.outerWidth();
        var basWMar = cw / 2;

        var itemPos, iconPos;  
        var _left =  parseFloat(btnPos.left);
        // 先判断按钮位置
        // 如果按钮在body的右侧或者在body的左侧且在弹窗的右侧
        if(btnPos.left > bodyW/2 || (btnPos.left < bodyW/2 && btnPos.left > cw/2)){
            _left = _left - cw/2;
            if(btnPos.left > bodyW/2){
                _left= bodyW - btnPos.left > cw/2 ? _left : bodyW - cw;
            } 
        }else if(btnPos.left + relElBtn.width() < cw/2 ){ // 按钮在弹框左侧且在body的左侧
            var diffLeft = cw/2 - (btnPos.left + relElBtn.width()); // 计算按钮与弹框左侧的距离
            _left = 0; // 如果按钮与弹框左侧的距离大于body的宽度，则将按钮位置设置为0
            if($body.offset().left > diffLeft){
                _left = - diffLeft; // 如果按钮与弹框左侧的距离小于body的宽度，则将按钮位置设置为负的距离
            }
        }

        itemPos = {
            left: _left ,
            top: parseFloat(pos.top) + h + 6
        };
        iconPos = {
            left: basWMar - icw / 2,
            top: -9
        };
        container.css(itemPos);

        icon.css(iconPos);
    },
});
