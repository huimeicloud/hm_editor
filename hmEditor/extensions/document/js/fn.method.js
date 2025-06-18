//对外暴露的方法 editor addCommand 等
commonHM.component['documentModel'].fn({
    registerCommand: function () {
        var _t = this;
        _t.editor.addCommand('document', {
            exec: function () {
                _t.method1();
            }
        });
        // _t.setContent();
    },
    /**
     * 加载文档
     * @param {*} contentlist
     */
    setContent: function (contentlist) {
        var _t = this;
        var _html = '';
        // if (contentlist.length > 1) { // 聚合病历
            _html = _t.aggregateRecord(contentlist);

        // } else {
        //     _html = contentlist[0].docContent;
        //     _html = _html.replace(/<body/g, '<body doc_code="' + contentlist[0].code + '"');
        // }
        _t.renderContent(_html);
        _t.setDocData(contentlist);

    },
    /**
     * 在指定文档后插入新文档
     */
    insertDocContent: function(insertPosition, docs) {
        var _t = this;
        _t.insertContent(insertPosition, docs);
    },
    /**
     * 设置文档数据元内容
     * @param {Array} dataList
     */
    setDocData: function (dataList) {
        var _t = this;
        _t.renderData(dataList);
    },
     /**
     * 获取文档内容数据
     * code 为空时，获取所有文档内容
     * @param {Object} code 文档唯一编号
     * {
     *   code: '文档唯一编号',
     *   flag: 1, // 1:获取html文本 2:获取text文本 3:获取数据元Data
     *   keyList: ['数据元编码1','数据元编码2'] // 指定数据元编码列表
     * }
     * @returns {Array} 文档内容列表，格式如下：
     * [{
     *   code: '文档唯一编号',
     *   data: [{keyCode: '数据元编码', keyValue: '数据元内容'}], // 数据元数据
     *   html: '文档html文本',
     *   text: '文档text纯文本'
     * }]
     */
     getData: function (params) {
        var _t = this;
        //    var content = _t.editor.document.getBody().$;
        var content = _t.getContent(params);
        console.log(content); 
        return content;
    },
    /**
    * 设置模板数据元
    * @param {Object}
    * {
    *   doc_type: '文档类型', // 可以为空
    *   datasource: [{
    *       code: '数据元编码',
    *       dictCode: '字典编码',
    *       name: '数据元名称',
    *       description: '数据元描述',
    *       format: '数据元格式',
    *       type: '数据元类型',
    *       dictList: [{
    *           code: '字典编码',
    *           val: '字典值',
    *           remark: '字典备注',
    *           description: '字典描述',
    *           order: '字典排序'
    *       }]
    *     }
    *   ], // 数据元
    *   dynamicDict: [
    *   {
    *       code: '动态值域编码',
    *       name: '动态值域名称',
    *       url: '动态值域url',
    *       returnCode: '动态值域返回code',
    *       returnName: '动态值域返回name'
    *   }
    *   ] // 指定动态值域，用于搜索类下拉框
    * }
    */
    setTemplateDatasource: function (params) {
        var _t = this;
        _t.setTemplateDatasource(params);
    },
    /**
     * 设置文档只读
     * @param {String} code 文档唯一编号
     * @param {Boolean} flag 是否只读
     */
    setDocReadOnly: function (code,flag) {
        var _t = this;
       console.log(flag);
        _t.setReadOnly(code,flag);
    },
    /**
     * 设置文档水印
     */
    setDocWatermark: function () {
        var _t = this;
        _t.setWatermark();
    },
    /**
     * 在光标处插入内容
     * @param {String} 内容，可以是字符串或带标签的字符串
     */
    insertDataAtCursor: function(content) {
        var _t = this;
        _t.insertContentAtCursor(content);
    },
    /**
     * 在光标位置插入图片
     * @param {Object} imageData 图片数据
     * @param {String} imageData.src 图片URL
     * @param {Number} imageData.width 图片宽度
     * @param {Number} imageData.height 图片高度
     */
    insertImageAtCursor: function(imageData) {
        var _t = this;
        const imageHtml = `<img src="${imageData.src}" ${imageData.width ? `width="${imageData.width}"` : ''} ${imageData.height ? `height="${imageData.height}"` : ''} />`;
        _t.insertContentAtCursor(imageHtml);
    },
    /**
     * 设置修订模式
     * @param {Boolean} reviseMode 是否启用修订模式
     */
    setDocReviseMode: function (reviseMode) {
        var _t = this;
        _t.setReviseMode(reviseMode);
    },
});