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
    },
    /**
     * 调用提醒端api 生成内容
     */
    generateMessage: function (traget,type,from) {
        var _t = this;
        var JTar = $(traget);
        var editorTool = _t.parent.editorTool,
            utils = _t.parent.utils;
        if(editorTool && editorTool.callCommand('isOpen')){
            return;
        }
        //有未处理的结果
        if(JTar.find('.r-model-gen-text').length){
            return;
        }
        
        // 批量处理模式下，不检查全局任务状态
        if(from != 'generateDocument' && (_t.progressFlag==1 || _t.parent.hasTask)){//有进行中的任务
            return;
        }
        
        _t.target = traget;
        _t.fillIndex=0;//回填索引
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
            if(flag!=5){//flag 1:进行中，2:成功，3：失败,4:中断, 5该结点不支持
                // if(type==1){
                // if(from!='generateDocument'){
                    _t.popupProgress(JTar);
                // }
                // }
                _t.fillText(message,JTar,uuId,function(){
                    if(flag!=1){
                        _t.manageProgress(2);
                        if(from=='generateDocument'){
                            // 批量处理模式下，重置处理状态以便继续处理下一个节点
                            _t.batchProcessing = false;
                            if (flag==2) {
                                _t.accpetAiResult(JTar,'r-model-gen-text','generateDocument');
                            }else if(flag==3 || flag==4){
                                _t.ignoreAiResult(JTar,'r-model-gen-text');
                            }
                            _t.closePopup();
                            // 批量处理模式下，处理下一个节点
                            if(_t.batchQueue && _t.batchQueue.length > 0) {
                                _t.processNextBatchNode();
                            }
                        }
                       
                    }
                });
            } else {
                // 该节点不支持，继续处理下一个
                if(from=='generateDocument' && _t.batchQueue && _t.batchQueue.length > 0) {
                    _t.processNextBatchNode();
                }
            }

        })
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
     * 重置弹框位置
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
     * 回填内容
     * @param {*} message
     */
    fillText: function (message,JTar,uuid,cbk) {
        var _t = this;
        if (message) {
            JTar.find('.r-model-gen-remark').remove();
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
                   _t.insertAiResult(JTar,{className:'r-model-gen-text',text:currText,uuid:uuid});
                } else {
                    if (_t.fillInervalId) {
                        clearInterval(_t.fillInervalId);
                        _t.fillInervalId = null;
                    }
                    cbk && cbk();
                }
            }, 30);
        }else{
            cbk && cbk();
        }
    },
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
     * 重新打开待处理弹窗
     * @param {*} relDom
     * @returns
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
            _t.popupProgress(jTar[0],2);
        }
    },
    /**
     * 弹出进度条
     * @param {*} relDom
     */
    popupProgress:function(relDom,flag){
        var _t = this,editor = this.parent.editor;
        if( _t.popup){
            return;
        }
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
         _t.manageProgress(flag||1);
         _t.popup.container.on('click','.btn-stop',function(){
            _t.stopGenerate();
        }).on('click','.btn-confirm',function(){ 
            _t.accpetAiResult(_t.popup.relEl[0],'r-model-gen-text');
            _t.closePopup();
        }).on('click','.btn-cancel',function(){
            _t.ignoreAiResult(_t.popup.relEl[0]);
            _t.closePopup();
        }).on('click',function(){
            return false;
        });

    },
    /**
     * 停止生成
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
     * 弃用ai结果
     */
     ignoreAiResult:function(target,uucode){
        var _t = this;
        $(target).find('.r-model-gen-text').remove();
        _t.restoreBlankContent(target);
    },
    /**
     * 使用ai结果
     */
    accpetAiResult:function(target,className,from){
        var _t = this;
        var editor = this.parent.editor;
        var aiResult = $(target).find('.'+className);
        if (!aiResult.length) return;
        aiResult.contents().unwrap();
        if(from=='generateDocument'){
            return;
        }
        // 设置光标到末尾
        var range = editor.createRange();
        var element = new CKEDITOR.dom.element(target);
        range.selectNodeContents(element);
        range.collapse(false); // 折叠到末尾

        editor.getSelection().selectRanges([range]);
        editor.focus();
    },
    /**
     * 插入ai 临时结果
     * @param {*} JTar
     * @param {*} options{className:临时结果class,text:临时结果内容,uuid:临时结果uuid}
     */
    insertAiResult:function(JTar,options){
        var _t = this;
        var autoLabel = JTar.find('.'+options.className);
        if(autoLabel.length){
            autoLabel.html(options.text);
        }else{
            autoLabel = $('<span>').html(options.text).attr({
                'class':options.className,
                'uucode':options.uuid
            })

            JTar.removeAttr('_placeholdertext').append(autoLabel);
        }
    },
    /**
     * 管理进度 按钮 flag:1:进行中，2：完成
     */
    manageProgress:function(flag){
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
            popupContainer.find('.doc-composer-title').text('生成完成');
            popupContainer.find('.btn-confirm').addClass('popu-active');
            popupContainer.find('.btn-cancel').addClass('popu-active');
            popupContainer.find('.btn-stop').removeClass('popu-active');
            // _t.popup.relEl.find('.r-model-gen-text').append($($recordDoc_tpl['recordDoc/tpl/accept']));
            _t.parent.hasTask = false;
        }
    },
    /**
     * 恢复空白备注
     */
    restoreBlankContent: function (inputDom) {
        var _t = this;
        var content = $.trim(inputDom.innerText || inputDom.textContent).replace(zeroWidthChar, "");
        var Jm = $(inputDom);
        if (!content) {
            if(Jm.attr('generate')==1){
                _t.generateRemark(Jm);
            }else{
                Jm.append(Jm.closest('.new-textbox').attr('_placeholder'));
            }
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
            if($node.find('.r-model-gen-text').length === 0) {
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
});
