commonHM.component['hmAi'].fn({
    /**
     * 显示质控警告信息
     */
    qc: function (data) {
        var _t = this;
        _t.initWarnInfo(data);
    },
    /**
     * 调用ai助手
     * @param {*} data 
     */
    ai: function (data) {
        var _t = this;
        _t.emrId = data.progressGuid; 
        if (!_t.editorTool) {
            _t.initEditorTool(data);
        }
        _t.checkDataSource();
    },
    /**
     * 初始化编辑器工具
     * @param {*} data 
     * @returns 
     */
    initEditorTool: function (data) {
        var _t = this;
        var maysonWindow = _t.utils.getSDKWindow();
        if (!maysonWindow || !maysonWindow.mayson) {
            console.error('无法获取SDK窗口或mayson对象不存在');
            return;
        }
        _t.editorTool = maysonWindow.mayson.getHMEditorTool({
            container: document.body, //助手容器dom   默认当前body
            recordType: data.recordType,
            progressGuid: data.progressGuid,
            sessionId:window.hmEditor.sessionId
        });
    },
    /**
     * 根据病历信息，设置ai 助手容器
     * @param {*} data 
     */
    setContainer: function (data) {
        var _t = this;
        _t.emrId = data.progressGuid;
        _t.clearGenerateRemark(); // 清除生成标记
        if (!_t.editorTool) {
            _t.ai(data);
        } else {
            _t.editorTool.callCommand('configDocRecord', {
                progressGuid: data.progressGuid,
                recordType: data.recordType
            });
            _t.checkDataSource();
        } 
    }
})