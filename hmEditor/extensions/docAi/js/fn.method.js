commonHM.component['hmAi'].fn({
    /**
     * 显示质控警告信息
     */
    qc:function(data){
        var _t = this;
        if(!_t.editorTool){
            _t.initEditorTool(data);
        }
        _t.initWarnInfo(data); 
    },
    /**
     * 初始化编辑器工具
     * @param {*} data 
     * @returns 
     */
    initEditorTool:function(data){
        var _t = this;
        var maysonWindow = _t.utils.getSDKWindow(); 
        if (!maysonWindow || !maysonWindow.mayson) {
            console.error('无法获取SDK窗口或mayson对象不存在');
            return;
        }
        _t.editorTool = maysonWindow.mayson.getHMEditorTool({
            container:  document.body,    //助手容器dom   默认当前body
            recodName: data.recordName,
            recordType: data.recordType,
            progressGuid:data.progressGuid
        });
    },

})