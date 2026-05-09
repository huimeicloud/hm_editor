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
        // 加载完文档，关闭editorTool
        var editorTool = _t.$parent.hmAi.editorTool;
        if (editorTool && editorTool.callCommand('isOpen')) {
            editorTool.callCommand('destoryGenPopup');
        }
        // 根据初始化参数 设置文档只读
        _t.editor.HMConfig.readOnly && _t.setDocReadOnly('', _t.editor.HMConfig.readOnly);
        // 加载完文档后重置撤销栈，防止撤销时回到空白状态
        _t.editor.resetUndo();
    },
    /**
     * 在指定文档后插入新文档
     */
    insertDocContent: function(insertPosition, docs) {
        var _t = this;
        _t.insertContent(insertPosition, docs);
    },
    /**
     * 删除文档内容
     * @param {String|Array} docCode 文档唯一编号，可以是单个值或数组
     * @returns {Boolean} 是否成功删除
     */
    deleteDocContent: function(docCode) {
        var _t = this;
        return _t.deleteContent(docCode);
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
        // console.log(content); 
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
        // 将 width/height 设置到 style 中，而非 img 的 HTML 属性，确保获取数据元内容时 style 中包含宽高 (AIED-342)
        var styleParts = [];
        if (imageData.width) {
            styleParts.push('width:' + (typeof imageData.width === 'number' ? imageData.width + 'px' : imageData.width));
        }
        if (imageData.height) {
            styleParts.push('height:' + (typeof imageData.height === 'number' ? imageData.height + 'px' : imageData.height));
        }
        if (imageData.style) {
            styleParts.push(imageData.style);
        }
        var styleStr = styleParts.length ? ' style="' + styleParts.join(';') + '"' : '';
        var imageHtml = '<span><img src="' + imageData.src + '"' + styleStr + ' /></span>';
        _t.insertContentAtCursor(imageHtml);
    },
    /**
     * 设置修订模式
     * @param {Boolean} reviseMode 是否启用修订模式
     */
    setDocReviseMode: function (reviseMode,retainModify) {
        var _t = this;
        _t.setReviseMode(reviseMode,retainModify);
    },
    /**
     * 设置表格行只读
     * @param {String} tableCode 表格唯一编号
     * @param {Number|Array} rowIndex 行索引或行索引数组
     * @param {Boolean} flag 是否只读，true:只读 false:可编辑
     */
    setTableRowReadonly: function(tableCode, rowIndex, flag) {
        var _t = this;
        _t.tableRowReadonly(tableCode, rowIndex, flag);
    },
    /**
     * 设置表格行删除权限
     * @param {String} tableCode 表格唯一编号
     * @param {Number|Array} rowIndex 行索引或行索引数组
     * @param {Boolean} flag 是否可删除，true:可删除 false:不可删除
     */
    setTableRowDeletable: function(tableCode, rowIndex, flag) {
        var _t = this;
        _t.tableRowDeletable(tableCode, rowIndex, flag);
    },
    /**
     * 设置表格行新增权限
     * @param {String} tableCode 表格唯一编号
     * @param {Number|Array} rowIndex 行索引或行索引数组
     * @param {Boolean} flag 是否可新增，true:可新增 false:不可新增
     */
    setTableRowAddable: function(tableCode, rowIndex, flag) {
        var _t = this;
        _t.tableRowAddable(tableCode, rowIndex, flag);
    },
     /* 定位到病历或元素
     * @param {String} docCode 病历ID（必填）
     * @param {String} eleCode 元素ID（可选）
     * @param {String} eleContent 元素内容或 trace_id（可选）。文本时按内容定位；trace_id 时按 [trace_id="xxx"] 定位节点
     * @returns {Boolean} 是否成功定位
     * 
     * 使用说明：
     * 1. 只有病历ID：滚动条定位到病历
     * 2. 病历+元素：滚动条定位到元素，如果是文本则光标定位到元素内容的开头
     * 3. 病历+元素+eleContent：支持 trace_id 或文本内容定位
     * 4. 病历+eleContent（无 eleCode）：支持通过 trace_id 在病历内定位
     */
    focusElement: function (docCode, eleCode, eleContent) {
        var _t = this;
        return _t.focusDocElement(docCode, eleCode, eleContent);
    },
    /**
     * 插入HTML内容
     * @param {String} htmlContent 要插入的HTML内容
     * @param {String} posTag 定位标记（可选），如果提供，将通过 data-hm-code=posTag 或 data-hm-name=posTag 查找元素，在元素后插入HTML，完成后光标定位到插入HTML之前
     * @returns {Boolean} 是否成功插入
     */
    insertHtml: function (htmlContent, posTag) {
        var _t = this;
        return _t.insertHtmlAtPosition(htmlContent, posTag);
    }
});