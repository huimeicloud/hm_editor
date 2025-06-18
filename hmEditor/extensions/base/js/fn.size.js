/**
 * 编辑器大小 控件
*/
HMEditor.fnSub("editorSize", {
    init:function(){
        var _t = this;
        _t.size = 1;
    },
   //默认放大
    defaultZoomIn:function(defaultSize){
        var _t = this;
        _t.size=defaultSize;
        _t.set();
    },
    // 放大
    zoomOut:function(){
        var _t = this;
        _t.size = Math.round(_t.size * 8) / 8 + 1 / 8;
        _t.set();
    },
    // 缩小
    zoomIn:function(){
        var _t = this;
        _t.size = Math.round(_t.size * 8) / 8 - 1 / 8;
        _t.set();
    },
    // 适合窗口宽度、恢复原始宽度
    enlargeOrShrink:function(title){
        var _t = this;
        var editor = _t.parent.editor;
        var tit = title || $("#enlargeOrShrink").attr("title");
        if (tit === '适合窗口宽度') {
            $("#enlargeOrShrink").attr("title","恢复原始宽度");
            $("#enlargeOrShrink img").attr("src",editor.HMConfig.sdkHost + "/img/shrink.jpg");
            _t.size = Math.floor($("#cke_editorSpace").outerWidth() / $(editor.document.getBody().$).outerWidth() * 32) / 32;
        } else {
            _t.size = 1;
        }
        _t.set();
    },
    // 以 1/32 为最小单位改变缩放比例 (不能被2整除(二进制)的缩放比例, 页面元素的大小都会被近似)
    set:function(){
        var _t = this;
        var editor = _t.parent.editor;
        // 标准化缩放比例
        _t.size = Math.round(_t.size * 32) / 32;
        if(_t.size===1){
            $("#enlargeOrShrink").attr("title","适合窗口宽度");
            $("#enlargeOrShrink img").attr("src",editor.HMConfig.sdkHost + "/img/enlarge.jpg");
        }

        //设置体温单图片同步放大缩小
        if(editor.document.findOne("#chartDivCopy")){
            var chartDivCopy = editor.document.findOne("#chartDivCopy").$;
            $(chartDivCopy).css('width','100%');
            $(chartDivCopy).find('div').css('width','100%');
            $(chartDivCopy).find('canvas').css('width','100%');
        }
        if(editor.document.findOne("[data-hm-div='chart']")){
            var chartDiv = editor.document.findOne("[data-hm-div='chart']").$;
            $(chartDiv).css("width", '100%');
            $(chartDiv).find('img').css('width','100%');
        }
        if(editor.document.findOne("[data-hm-chart='pain-curve']")){
            var chartDiv1 = editor.document.findOne("[data-hm-chart='pain-curve']").$;
            $(chartDiv1).css("width", '100%');
            $(chartDiv1).find('img').css('width','100%');
        }
        editor.document.getBody().setStyle('zoom',_t.size);
    }
})