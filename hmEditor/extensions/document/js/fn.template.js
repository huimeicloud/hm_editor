commonHM.component['documentModel'].fn({
    /**
    * 设置模板数据元
    * @param params {Object}
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
        _t.editor.plugins.datasource.setTemplateDatasource(params);
    }
});