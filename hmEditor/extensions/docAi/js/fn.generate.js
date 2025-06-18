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
    },
    /**
     * 调用提醒端api 生成内容
     */
    generateMessage: function (traget,type) {
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
        if(_t.progressFlag==1 || _t.parent.hasTask){//有进行中的任务
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
                    _t.popupProgress(JTar);
                // }
                _t.fillText(message,JTar,uuId,function(){
                    if(flag!=1){
                        _t.manageProgress(2);
                    }
                });
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
            container:$body
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
        _t.editorTool && _t.editorTool.callCommand('stopGenerate');
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
    accpetAiResult:function(target,className){
        var _t = this;
        var editor = this.parent.editor;
        var aiResult = $(target).find('.'+className);
        if (!aiResult.length) return;
        aiResult.contents().unwrap();
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
});
