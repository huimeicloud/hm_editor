commonHM.component['documentModel'].fn({
    init:function(editor){
        var _t = this;
        _t.editor = editor;
    },
    //业务方法
    method1:function(){
        var _t = this;
        alert(' document method1');
    }
});