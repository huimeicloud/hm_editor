/*
 * 对外开放的接口
 */
HMEditor.fn({
    /**
     * 设置文档内容及初始化数据
     * @param {Array|Object} contentlist 内容列表或单个内容对象
     * @param {String} contentlist[].code 文档唯一编号(必传)
     * @param {String} contentlist[].docTplName 文档模板名称(必传)
     * @param {String} contentlist[].docContent 文档内容(必传)
     * @param {Array} contentlist[].data 初始化数据
     * @param {String} contentlist[].data[].keyCode 数据元编码
     * @param {String|String[]} contentlist[].data[].keyValue 数据元内容，可以是字符串或字符串数组
     */
    setDocContent:function(contentlist){
        // 如果传入的是对象，则包装成数组
        if(contentlist && typeof contentlist === 'object' && !Array.isArray(contentlist)){
            contentlist = [contentlist];
        }
        this.documentModel.setContent(contentlist);
    },

    /**
     * 在指定文档后插入新文档
     * @param {Number} insertPosition 目标位置，新文档将插入到该文档之后
     * @param {Array} docs 要插入的文档数组
     * @param {String} docs[].code 要插入的文档的唯一编号
     * @param {String} docs[].docTplName 文档模板名称
     * @param {String} docs[].docContent 要插入的文档内容
     */
    insertDocContent: function(insertPosition, docs) {
        // 直接调用documentModel的insertDoc方法
        this.documentModel.insertDocContent(insertPosition, docs);
    },

    /**
     * 设置文档数据元数据
     * @param {Array|Object} dataList 内容列表或单个内容对象
     * @param {String} dataList[].code 文档唯一编号(必传)
     * @param {Array} dataList[].data 初始化数据(必传)
     * @param {String} dataList[].data[].keyCode 数据元编码(必传)
     * @param {String|String[]} dataList[].data[].keyValue 数据元内容，可以是字符串或字符串数组(必传)
     */
    setDocData:function(dataList){
        // 如果传入的是对象，则包装成数组
        if(dataList && typeof dataList === 'object' && !Array.isArray(dataList)){
            dataList = [dataList];
        }
        this.documentModel.setDocData(dataList);
    },
    /**
     * 获取文档所有内容
     * code 为空时，获取所有文档内容
     * @param {String} code 文档唯一编号
     * @returns {Array} 文档内容列表，格式如下：
     * [{
     *   code: '文档唯一编号',
     *   data: [{keyCode: '数据元编码', keyValue: '数据元内容或数据元内容数组'}], // 数据元数据
     *   html: '文档html文本',
     *   text: '文档text纯文本'
     * }]
     */
    getDocContent:function(code){
        //code 编号
        return this.documentModel.getData({code:code});
    },
    /**
     * 获取文档html文本
     * @param {String} code 指定文档编号  为空时，获取当前文档html文本
     * @returns {Array} 文档内容列表，格式如下：
     * [{
     *   code: '文档唯一编号',
     *   html: '文档html文本'
     * }]
     */
    getDocHtml:function(code){
        //flag 1:获取html文本 2:获取text文本,3:获取数据元Data
        return this.documentModel.getData({code:code,flag:1});
    },
    /**
     * 获取文档text文本
     * @param {String} code 指定文档编号  为空时，获取当前文档text文本
     * @returns {Array} 文档内容列表，格式如下：
     * [{
     *   code: '文档唯一编号',
     *   text: '文档text纯文本'
     * }]
     */
    getDocText:function(code){
        //flag 1:获取html文本 2:获取text文本 3:获取数据元Data
        return this.documentModel.getData({code:code,flag:2});
    },
    /**
     * 获取文档数据元数据
     * @param {String} code 文档唯一编号
     * @param {Array} keyList 指定数据元编码列表
     * @returns {Array} 文档内容列表，格式如下：
     * [{
     *   code: '文档唯一编号',
     *   data: [{keyCode: '数据元编码', keyValue: '数据元内容或数据元内容数组',keyId: '数据元id',keyName: '数据元名称'}], // 数据元数据
     * }]
     */
    getDocData:function(code,keyList){
        //flag 1:获取html文本 2:获取text文本 3:获取数据元Data
        return this.documentModel.getData({code:code,flag:3,keyList:keyList});
    },

    /**
     * 显示质控警告信息
     */
    qc:function(data){
        this.hmAi.qc(data);
    },

    /**
     * 原生editor通用方法，用于调用 CKEditor 实例对象的方法
     * @param {String} methodName 方法名称
     * @param {Array} args 方法参数数组（可选）
     * @returns {*} 方法调用的返回值
     */
    execEditorMethod: function(methodName, args) {
        if (!this.editor) {
            console.error('Editor 实例未初始化');
            return null;
        }

        if (!methodName || typeof methodName !== 'string') {
            console.error('方法名称必须是字符串');
            return null;
        }

        if (typeof this.editor[methodName] !== 'function') {
            console.error('Editor 实例不存在方法: ' + methodName);
            return null;
        }

        try {
            if (Array.isArray(args)) {
                return this.editor[methodName].apply(this.editor, args);
            } else {
                return this.editor[methodName]();
            }
        } catch (error) {
            console.error('调用 Editor 方法失败: ' + methodName, error);
            return null;
        }
    },

    /**
     * 执行 CKEditor 命令
     * @param {String} commandName 命令名称
     * @param {*} data 命令参数（可选）
     * @returns {Boolean} 命令执行状态
     */
    execCommand: function(commandName, data) {
        if (!this.editor) {
            console.error('Editor 实例未初始化');
            return false;
        }

        if (!commandName || typeof commandName !== 'string') {
            console.error('命令名称必须是字符串');
            return false;
        }

        try {
            return this.editor.execCommand(commandName, data);
        } catch (error) {
            console.error('执行 Editor 命令失败: ' + commandName, error);
            return false;
        }
    },
    /**
     * 添加自定义菜单
     * @param {Array} menuList 菜单列表
     * @param {String} menuList[].name 菜单名称
     * @param {String} menuList[].label 菜单标签
     * @param {String} menuList[].icon 菜单图标
     * @param {Function} menuList[].show 菜单显示逻辑 返回true显示，返回false不显示
     * @param {Function} menuList[].onExec 菜单执行逻辑
     */
    addCustomMenu:function(menuList){
        this.registerCustomMenu(menuList);
    },
    /**
     * 设置文档只读
     * @param {Boolean} readOnly 是否只读
     */
    setDocReadOnly:function(code,flag){
        var flag = (flag === true || flag === false) ? flag: this.editor.HMConfig.readOnly ;
        this.documentModel.setDocReadOnly(code,flag);
    },
    /**
     * 设置文档修订模式
     * @param {Boolean} reviseMode 是否修订模式
     */
    setDocReviseMode:function(reviseMode){
        this.documentModel.setDocReviseMode(reviseMode);
    },
    /**
     * 设置模板制作时需要的数据元
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
     *       url: '动态值域url'
     *   }
     *   ] // 指定动态值域，用于搜索类下拉框
     * }
    */
    setTemplateDatasource: function (params) {
        var _t = this;
        _t.documentModel.setTemplateDatasource(params);
    },
    /**
     * 设置文档水印
     * @param {*} settings 水印设置
     * @param {String} settings.watermarkType 水印类型 1 文字水印 2 图片水印
     * @param {String} settings.watermarkImg 水印图片 当水印类型为图片水印时，必传
     * @param {String} settings.watermarkText 水印文字 当水印类型为文字水印时，必传
     * @param {String} settings.watermarkFontColor 水印字体颜色 默认黑色
     * @param {String} settings.watermarkFontSize 水印字体大小 默认12px
     * @param {String} settings.watermarkAlpha 水印透明度 默认0.5
     * @param {String} settings.watermarkAngle 水印倾斜度数 默认15度
     * @param {String} settings.watermarkHeight 水印高度 默认50px
     */
    setDocWatermark:function(settings){
        var _t = this;
        this.editor.HMConfig.watermark = settings||{};
        _t.documentModel.setDocWatermark();
    },
    /**
     * 下载pdf
     *
     */
    downloadPdf:function(){
        this.editor.execCommand('print', '下载');
    },
    /**
     * 在光标处插入内容
     * @param {String} 内容，可以是字符串或带标签的字符串
     */
    insertDataAtCursor: function(content) {
        var _t = this;
        _t.documentModel.insertDataAtCursor(content);
    },
    /**
     * 在光标处插入图片
     * @param {Object} imageData 图片数据
     * @param {String} imageData.src 图片URL
     * @param {Number} imageData.width 图片宽度
     * @param {Number} imageData.height 图片高度
     */
    insertImageAtCursor: function(imageData) {
        var _t = this;
        _t.documentModel.insertImageAtCursor(imageData);
    }
});
