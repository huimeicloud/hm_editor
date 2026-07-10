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
    setDocContent: function (contentlist) {
        // 如果传入的是对象，则包装成数组
        if (contentlist && typeof contentlist === 'object' && !Array.isArray(contentlist)) {
            contentlist = [contentlist];
        }
        this.documentModel.setContent(contentlist);
        // 加载完文档，清空一下editorTool 对象
        // this.hmAi.editorTool = null;
    },

    /**
     * 在指定文档后插入新文档
     * @param {Number} insertPosition 目标位置，新文档将插入到该文档之后
     * @param {Array} docs 要插入的文档数组
     * @param {String} docs[].code 要插入的文档的唯一编号
     * @param {String} docs[].docTplName 文档模板名称
     * @param {String} docs[].docContent 要插入的文档内容
     */
    insertDocContent: function (insertPosition, docs) {
        // 直接调用documentModel的insertDoc方法
        this.documentModel.insertDocContent(insertPosition, docs);
    },
    /**
     * 删除聚合病历中部分病历
     * @param {String|Array} docCode 文档唯一编号，可以是单个值或数组
     * @returns {Boolean} 是否成功删除
     * 
     * 使用示例：
     * // 删除单个病历
     * HMEditor.deleteDocContent('DOC_001');
     * 
     * // 删除多个病历
     * HMEditor.deleteDocContent(['DOC_001', 'DOC_002', 'DOC_003']);
     */
    deleteDocContent: function (docCode) {
        return this.documentModel.deleteDocContent(docCode);
    },

    /**
     * 设置文档数据元数据
     * @param {Array|Object} dataList 内容列表或单个内容对象
     * @param {String} dataList[].code 文档唯一编号(必传)
     * @param {Array} dataList[].data 初始化数据(必传)
     * @param {String} dataList[].data[].keyCode 数据元编码(必传)
     * @param {String} dataList[].data[].keyName 数据元名称
     * @param {String|String[]} dataList[].data[].keyValue 数据元内容，可以是字符串或字符串数组(必传)
     * @param {Array} dataList[].nursingData 护理表单数据(可选，二维数组，每一行代表一条护理记录)
     * @param {String} dataList[].nursingData[][].keyCode 护理数据数据元编码
     * @param {String} dataList[].nursingData[][].keyId 护理数据数据元ID
     * @param {String} dataList[].nursingData[][].keyName 护理数据数据元名称
     * @param {String} dataList[].nursingData[][].keyValue 护理数据数据元值
     * @param {Object} [options] 渲染选项
     * @param {Boolean} [options.fullRender] 为 true 时强制完整去分页/重分页（默认已分页文档走增量赋值）
     */
    setDocData: function (dataList, options) {
        // 如果传入的是对象，则包装成数组
        if (dataList && typeof dataList === 'object' && !Array.isArray(dataList)) {
            dataList = [dataList];
        }
        this.documentModel.setDocData(dataList, options);
    },
    /**
     * 显示AI草稿内容（支持多份病历）
     * 必须传入包含 `dataList` 的 **options 对象**（不再支持位置参数）。
     *
     * @param {Object} options
     * @param {Array|Object} options.dataList 内容列表或单个内容对象，结构同 setDocData
     * @param {Number} [options.displayType] 展示方式：0-覆盖（先清空原内容再展示），1-追加（默认）
     * @param {Boolean} [options.casualDraft] 是否为随手病历：true 时使用随手样式与「随手记录，请确认」；正文点击触发 onCasualTextClick；按钮点击打开保留/弃用弹框
     * @param {String} [options.draftBtnText] 自定义草稿确认按钮文案；传值且去首尾空白后非空时，AI 草稿与随手病历均使用该文案，否则沿用各模式默认（「AI内容，请确认」/「随手记录，请确认」）
     * @param {Function} [options.onCasualTextClick] 随手病历下点击正文时回调 function (event, $rModelGen, sourceId)；与对应 data 项一致
     *
     * 使用示例：
     * // 单份病历（推荐写法）
     * HMEditor.showAiDraft({
     *   dataList: { code: 'DOC_001', data: [{ keyCode: 'KEY_01', keyValue: '内容' }] },
     *   displayType: 1,
     *   casualDraft: false
     * });
     *
     * // 多份病历
     * HMEditor.showAiDraft({
     *   dataList: [
     *     { code: 'DOC_001', data: [...] },
     *     { code: 'DOC_002', data: [...] }
     *   ],
     *   displayType: 0,
     *   casualDraft: true,
     *   onCasualTextClick: function (event, $rModelGen, sourceId) {
     *     console.log('点击随手病历正文', sourceId);
     *   }
     * });
     *
     * 验收要点：
     * - G1：仅接受 options 对象，不支持位置参数
     * - G4：openApi 层校验并数组化，委托给 hmAi.generator.showAiDraft
     * - G5：非法入参时 console.error 并 return，不插入草稿
     */
    showAiDraft: function (options) {
        // G5：校验 options 必须为普通对象且非数组
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            console.error('showAiDraft: 请传入 options 对象（非数组）');
            return;
        }
        // G5：校验 options 必须包含 dataList 自有属性
        if (!Object.prototype.hasOwnProperty.call(options, 'dataList')) {
            console.error('showAiDraft: options 必须包含 dataList，例如 showAiDraft({ dataList: [...] })');
            return;
        }
        // G5：校验 dataList 不能为空
        if (options.dataList == null) {
            console.error('showAiDraft: dataList 不能为空');
            return;
        }
        // G4：将单文档对象规范为数组
        var dl = options.dataList;
        if (dl && typeof dl === 'object' && !Array.isArray(dl)) {
            dl = [dl];
        }
        // G4：委托给 hmAi.generator.showAiDraft，仅传递归一后的 opts
        this.hmAi.generator.showAiDraft({
            dataList: dl,
            displayType: options.displayType,
            casualDraft: options.casualDraft,
            draftBtnText: options.draftBtnText,
            onCasualTextClick: options.onCasualTextClick
        });
    },
    /**
     * AI 草稿确认全部或按数据元编码批量确认
     * @param {Array|String} [keyList] 数据元编码数组或单个编码，不传则确认全部
     *
     * 使用示例：
     * HMEditor.confirmAiDraft();                    // 确认全部
     * HMEditor.confirmAiDraft(['KEY_01', 'KEY_02']); // 批量确认指定数据元
     */
    confirmAiDraft: function (keyList) {
        this.hmAi.generator.confirmAiDraft(keyList);
    },
    /**
     * AI 草稿弃用全部或按数据元编码批量弃用
     * @param {Array|String} [keyList] 数据元编码数组或单个编码，不传则弃用全部
     *
     * 使用示例：
     * HMEditor.cancelAiDraft();                    // 弃用全部
     * HMEditor.cancelAiDraft(['KEY_01', 'KEY_02']); // 批量弃用指定数据元
     */
    cancelAiDraft: function (keyList) {
        this.hmAi.generator.cancelAiDraft(keyList);
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
    getDocContent: function (code) {
        //code 编号
        return this.documentModel.getData({
            code: code
        });
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
    getDocHtml: function (code) {
        //flag 1:获取html文本 2:获取text文本,3:获取数据元Data
        return this.documentModel.getData({
            code: code,
            flag: 1
        });
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
    getDocText: function (code) {
        //flag 1:获取html文本 2:获取text文本 3:获取数据元Data
        return this.documentModel.getData({
            code: code,
            flag: 2
        });
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
    getDocData: function (code, keyList) {
        //flag 1:获取html文本 2:获取text文本 3:获取数据元Data
        return this.documentModel.getData({
            code: code,
            flag: 3,
            keyList: keyList
        });
    },

    /**
     * 质控提醒参数示例
     * @param {Object} params 质控提醒参数
     * @param {String} params.userGuid 用户唯一标识
     * @param {String} params.serialNumber 序列号
     * @param {String} params.caseNo 病历号
     * @param {String} params.currentBedCode 床位号
     * @param {String} params.patientName 患者姓名
     * @param {String} params.doctorGuid 医生唯一标识
     * @param {String} params.doctorName 医生姓名
     * @param {String} params.admissionTime 入院时间
     * @param {String} params.inpatientDepartment 住院科室
     * @param {String} params.inpatientArea 病区
     * @param {String} params.inpatientDepartmentId 科室ID
     * @param {String} params.divisionId 病区ID
     * @param {String} params.pageSource 页面来源
     * @param {Number} params.openInterdict 是否开启拦截
     * @param {Number} params.triggerSource 触发来源
     * @param {Object} params.patientInfo 患者信息
     * @param {Number} params.patientInfo.gender 性别(0:男,1:女)
     * @param {String} params.patientInfo.birthDate 出生日期
     * @param {String} params.patientInfo.age 年龄
     * @param {String} params.patientInfo.ageType 年龄单位
     * @param {Number} params.patientInfo.maritalStatus 婚姻状况
     * @param {Number} params.patientInfo.pregnancyStatus 妊娠状态
     * @param {Array} params.progressNoteList 病历列表
     * @param {String} params.progressNoteList[].progressGuid 病历唯一标识
     * @param {String} params.progressNoteList[].progressTypeName 病历类型名称
     * @param {Number} params.progressNoteList[].progressType 病历类型
     * @param {String} params.progressNoteList[].doctorGuid 医生唯一标识
     * @param {String} params.progressNoteList[].doctorName 医生姓名
     * @param {String} params.progressNoteList[].progressMessage 病历内容
     * @param {Number} params.progressNoteList[].msgType 消息类型
     */
    qc: function (data) {
        this.hmAi.qc(data);
    },
    /**
     * 调用ai助手
     * @param {String} recordType 病历类型
     * @param {String} progressGuid 病历唯一编号
     */
    aiActive: function (data) {
        this.hmAi.ai(data);
    },
    /**
     * 原生editor通用方法，用于调用 CKEditor 实例对象的方法
     * @param {String} methodName 方法名称
     * @param {Array} args 方法参数数组（可选）
     * @returns {*} 方法调用的返回值
     */
    execEditorMethod: function (methodName, args) {
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
    execCommand: function (commandName, data) {
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
    addCustomMenu: function (menuList) {
        this.registerCustomMenu(menuList);
    },
    /**
     * 设置文档只读
     * @param {String} code 文档唯一编号
     * @param {Boolean} readOnly 是否只读
     */
    setDocReadOnly: function (code, flag) {
        var flag = (flag === true || flag === false) ? flag : this.editor.HMConfig.readOnly;
        this.documentModel.setDocReadOnly(code, flag);
    },
    /**
     * 设置单个/多个元素的只读接口
     * @param {*} code  文档唯一编号
     * @param {*} elementList 元素列表(数据元code 数组)
     * @param {Boolean} flag 是否只读
     */
    setElementReadOnly: function (code, elementList, flag) {
        this.documentModel.setElementReadOnly(code, elementList, flag);
    },
    /**
     * 设置文档修订模式
     * @param {Boolean} reviseMode 是否修订模式
     */
    setDocReviseMode: function (reviseMode, retainModify) {
        this.documentModel.setDocReviseMode(reviseMode, retainModify);
    },
    /**
     * 设置编辑器工具栏显示或隐藏（运行时控制，不依赖初始化参数 showTools）
     * @param {Boolean} show 是否显示工具栏，true 显示，false 隐藏
     * @returns {Boolean} 设置是否成功，参数非法时返回 false
     *
     * 使用示例：
     * editorInstance.setShowTools(false);  // 隐藏工具栏
     * editorInstance.setShowTools(true);   // 显示工具栏
     */
    setShowTools: function (show) {
        if (show !== true && show !== false) {
            console.error('setShowTools: 参数 show 必须为 Boolean');
            return false;
        }
        this.editor.showTools = !!show;
        var top = this.editor.ui.space('top');
        if (top) {
            if (show) {
                top.removeStyle('display');
                top.setStyle('height', 'auto');
            } else {
                top.setStyle('height', '0%');
                top.setStyle('overflow', 'hidden');
                top.setStyle('display', 'none');
            }
        }
        return true;
    },
    /**
     * 获取当前工具栏是否显示
     * @returns {Boolean} 当前工具栏是否显示
     */
    getShowTools: function () {
        return !!this.editor.showTools;
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
     * @param {String} settings.watermarkColumn 水印列数 默认3
     */
    setDocWatermark: function (settings) {
        var _t = this;
        this.editor.HMConfig.watermark = settings || {};
        _t.documentModel.setDocWatermark();
    },
    /**
     * 设置文档分段页眉
     * @param {Object} settings 分段页眉设置
     * @param {String} settings.controlElementName 控制元素名称，数据元名称，比如 记录时间
     * @param {Array} settings.headerList 页眉列表
     * @param {String} settings.headerList[].startTime 开始时间
     * @param {String} settings.headerList[].endTime 结束时间
     * @param {Object} settings.headerList[].headerData 页眉数据对象，包含页眉显示的信息
     */
    setDocMultiPartHeader: function (settings) {
        this.editor.HMConfig.multiPartHeader = settings || {};
    },
    /**
     * 设置打印另页/单独一页配置（支持按模板名称或文档编码）
     * @param {Object} options 打印分页配置，仅合并传入的键，不传的键保留原值
     * @param {Array} [options.pageAnotherTpls] 另页打印模板名称数组
     * @param {Array} [options.pageAloneTpls] 单独一页打印模板名称数组
     * @param {Array} [options.pageAnotherCodes] 另页打印文档编码（doc_code，对应 data-hm-widgetid）数组
     * @param {Array} [options.pageAloneCodes] 单独一页打印文档编码（doc_code）数组
     */
    setPrintPageBreakConfig: function (options) {
        if (!this.editor || !this.editor.HMConfig) {
            return;
        }
        if (!this.editor.HMConfig.printConfig) {
            this.editor.HMConfig.printConfig = {};
        }
        var printConfig = this.editor.HMConfig.printConfig;
        if (options && typeof options === 'object') {
            if (options.hasOwnProperty('pageAnotherTpls')) {
                printConfig.pageAnotherTpls = options.pageAnotherTpls;
            }
            if (options.hasOwnProperty('pageAloneTpls')) {
                printConfig.pageAloneTpls = options.pageAloneTpls;
            }
            if (options.hasOwnProperty('pageAnotherCodes')) {
                printConfig.pageAnotherCodes = options.pageAnotherCodes;
            }
            if (options.hasOwnProperty('pageAloneCodes')) {
                printConfig.pageAloneCodes = options.pageAloneCodes;
            }
        }
    },
    /**
     * 下载pdf
     * @param {Function} callback 回调函数，接收生成的PDF Blob对象
     * @param {Blob} callback.pdfBlob PDF文件的Blob对象
     */
    downloadPdf: function (callback) {
        // 将回调函数作为execCommand的第二个参数传递
        var commandData = {
            type: '下载',
            callback: callback
        };
        this.editor.execCommand('print', commandData);
    },
    /**
     * 在光标处插入内容
     * @param {String} 内容，可以是字符串或带标签的字符串
     */
    insertDataAtCursor: function (content) {
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
    insertImageAtCursor: function (imageData) {
        var _t = this;
        _t.documentModel.insertImageAtCursor(imageData);
    },
    /**
     * 请求大模型直接生成整份病历并以 AI 草稿形式回填
     * @param {Object} params 生成参数对象
     * @param {String} params.agent_code 智能体编码(必传)
     * @param {String} params.docCode 病历文书编码(必传)
     * @param {String} [params.agent_name] 智能体名称
     * @param {String} [params.agent_id] 智能体 ID
     * @param {String} [params.agent_query] 用户补充问题或上下文
     * @param {String|Number} [params.agent_type] 智能体类型
     * @param {String|Number} [params.progress_type] 诊疗阶段或进度类型
     */
    generateDocumentDirect: function (params) {
        if (!params || Object.prototype.toString.call(params) !== '[object Object]') {
            console.log('generateDocumentDirect: 请传入生成参数对象');
            return;
        }
        if (!params.agent_code || (typeof params.agent_code === 'string' && !params.agent_code.replace(/\s/g, ''))) {
            console.log('generateDocumentDirect: 请传入智能体编码 agent_code');
            return;
        }
        if (!params.docCode || (typeof params.docCode === 'string' && !params.docCode.replace(/\s/g, ''))) {
            console.log('generateDocumentDirect: 请传入病历文书编码 docCode');
            return;
        }
        if (!this.documentModel || typeof this.documentModel.generateDocumentLLM !== 'function') {
            console.log('generateDocumentDirect: 编辑器未就绪，暂时无法生成病历');
            return;
        }
        this.documentModel.generateDocumentLLM(params);
    },
    /**
     * 病历生成 - 获取当前widget中可AI生成的数据元节点并进行批量生成
     */
    generateDocument: function () {
        this.hmAi.generator.generateDocument();
    },
    /**
     * 病历段落生成 - 根据目标节点生成病历段落
     * @param {*} targetNode 目标节点
     */
    generateSection: function (targetNode) {
        this.hmAi.generator.generateMessage(targetNode, 2);
    },
    /**
     * 插入数据元
     * @param {*} datasource 数据元对象
     * @param {String} code 数据元code
     * @param {String} format 格式化
     * @param {String} length 长度
     * @param {String} name 名称
     * @param {String} nodeName 节点类型 时间，纯文本，数字，下拉，搜索，单元
     * @param {String} type
     * @param {Boolean} autoLable 是否自动加标题
     */
    insertDataSource: function (datasource) {
        this.editor._datasourceDialogApp.insertDataSource(datasource);
    },
    /**
     * AI辅助修正
     * @param {*} ruleId
     */
    aiAssistCorrect: function (ruleId) {
        this.hmAi.composer.ruleComposer(ruleId);
    },
    /**
     * 设置自定义属性
     * @param {*} params
     * @param {String} params.code 病历唯一编码
     * @param {String} params.section 节点标识（病历ID、表格ID或数据元CODE）
     * @param {Array} params.customProperty 自定义属性数组
     */
    setCustomProperties: function (params) {
        this.documentModel.setCustomProperties(params.code, params.section, params.customProperty);
    },
    /**
     * 删除自定义属性
     * @param {*} params
     * @param {String} params.code 病历唯一编码
     * @param {String} params.section 节点标识（病历ID、表格ID或数据元CODE）
     * @param {String} params.propertyName 属性名
     */
    deleteCustomProperties: function (params) {
        this.documentModel.deleteCustomProperties(params.code, params.section, params.propertyNames);
    },
    /**
     * 获取自定义属性
     * @param {*} params
     * @param {String} params.code 病历唯一编码
     * @param {String} params.section 节点标识（病历ID、表格ID或数据元CODE）
     * @param {Array} params.propertyNames 属性名数组
     * @returns {Object} 属性名值对对象，格式：{属性名: 属性值}
     */
    getCustomProperties: function (params) {
        return this.documentModel.getCustomProperties(params.code, params.section, params.propertyNames);
    },

    /**
     * 获取文档修订记录
     * @param {String} code 病历唯一编码
     * @returns {Array} 修订记录
     * @returns {Array} data[].traceId 修订记录ID
     * @returns {Array} data[].modifier 修订记录修改者
     * @returns {Array} data[].modifyTime 修订记录修改时间
     * @returns {Array} data[].modifyType 修订记录修改类型
     * @returns {Array} data[].content 修订记录内容
     * @returns {Array} data[].docCode 修订病历编码
     * @returns {Array} data[].eleCode 修订数据元编码
     * @returns {Array} data[].eleName 修订数据元名称
     */
    getDocRevisionHistory: function (code) {
        return this.documentModel.getRevisionHistory(code);
    },
    /**
     * 设置文档修改用户
     * @param {Object} userInfo 用户信息对象
     * @param {String} userInfo.userId 用户ID
     * @param {String} userInfo.userName 用户名称
     */
    setDocModifyUser: function (userInfo) {
        if (!userInfo || typeof userInfo !== "object") {
            console.error("用户信息必须是对象格式");
            return false;
        }

        if (!userInfo.userId || !userInfo.userName) {
            console.error("用户信息必须包含 userId 和 userName 属性");
            return false;
        }

        // 将用户信息存储到编辑器配置中
        if (!this.editor.HMConfig) {
            this.editor.HMConfig = {};
        }
        this.editor.HMConfig.currentUserInfo = userInfo;
        return true;
    },
    /**
     * 设置文档创建用户
     * @param {Object} userInfo 用户信息对象
     * @param {String} userInfo.userId 用户ID
     * @param {String} userInfo.userName 用户名称
     */
    setDocCreateUser: function (userInfo) {
        this.setDocModifyUser(userInfo);
        var _t = this;
        //_t.documentModel.setDocCreateUser(userInfo);
    },
    /**
     * 设置文档创建用户
     * @returns {Object} userInfo 用户信息对象
     * @returns {String} userInfo.userId 用户ID
     * @returns {String} userInfo.userName 用户名称
     */
    getDocCreateUser: function () {
        var _t = this;
        //return _t.documentModel.getDocCreateUser();
    },
    /**
     * 根据表格编码、列列表、行索引获取表格数据
     * @param {*} params
     * @param {*} params.tableCode 表格编码
     * @param {*} params.keyList 获取列列表
     * @param {*} params.rowIndex 获取行索引或列索引
     */
    getTableData: function (params) {
        return this.documentModel.getTableListData(params.tableCode, params.keyList, params.rowIndex);
    },
    /**
     * 设置表格行只读
     * @param {String} tableCode 表格唯一编号
     * @param {Number|Array} rowIndex 行索引或行索引数组
     * @param {Boolean} flag 是否只读，true:只读 false:可编辑
     */
    setTableRowReadonly: function (tableCode, rowIndex, flag) {
        this.documentModel.setTableRowReadonly(tableCode, rowIndex, flag);
    },
    /**
     * 设置表格行删除权限
     * @param {*} tableCode 
     * @param {Number|Array} rowIndex 行索引或行索引数组
     * @param {Boolean} flag 是否可删除，true:可删除 false:不可删除
     */
    setTableRowDeletable: function (tableCode, rowIndex, flag) { 
        this.documentModel.setTableRowDeletable(tableCode, rowIndex, flag);
    },
    /**
     * 设置表格行新增权限
     * @param {*} tableCode 
     * @param {Number|Array} rowIndex 行索引或行索引数组
     * @param {Boolean} flag 是否可新增，true:可新增 false:不可新增 
     */
    setTableRowAddable: function (tableCode, rowIndex, flag) {
        this.documentModel.setTableRowAddable(tableCode, rowIndex, flag); 
    },
    /**
     * 注册列表表格点击「+」新增行后的行数据（推荐集成方式）
     * @param {String|Function|Object|null} tableCodeOrCallback 表格编码；或自定义回调；或 { tableCode, rowData }；null 取消注册
     * @param {Array} [rowData] 与 tableCode 搭配：新增行要绑定的数据元数组
     * @returns {Boolean} 是否注册成功
     *
     * 使用示例（推荐，仅传参）：
     * editor.setOnTableRowAdd('TABLE_一般护理记录单', [
     *   { keyCode: 'DE09.00.053.00', keyValue: '2025-10-24 10:00' },
     *   { keyCode: 'DE04.10.186.00', keyValue: '36.8' }
     * ]);
     *
     * 自定义逻辑时可传函数（return 数据元数组自动绑定到新行）：
     * editor.setOnTableRowAdd(function (ctx, editor) { return [...]; });
     */
    setOnTableRowAdd: function (tableCodeOrCallback, rowData) {
        var callback = null;

        if (tableCodeOrCallback == null) {
            callback = null;
        } else if (typeof tableCodeOrCallback === 'function') {
            callback = tableCodeOrCallback;
        } else if (typeof tableCodeOrCallback === 'string') {
            if (!rowData || !Array.isArray(rowData)) {
                console.error('setOnTableRowAdd: rowData 必须为数组');
                return false;
            }
            var tableCode = tableCodeOrCallback;
            callback = function (ctx) {
                if (ctx.tableCode !== tableCode) {
                    return;
                }
                return rowData;
            };
        } else if (typeof tableCodeOrCallback === 'object') {
            var opts = tableCodeOrCallback;
            if (!opts.tableCode) {
                console.error('setOnTableRowAdd: tableCode 不能为空');
                return false;
            }
            if (!opts.rowData || !Array.isArray(opts.rowData)) {
                console.error('setOnTableRowAdd: rowData 必须为数组');
                return false;
            }
            var code = opts.tableCode;
            var data = opts.rowData;
            callback = function (ctx) {
                if (ctx.tableCode !== code) {
                    return;
                }
                return data;
            };
        } else {
            console.error('setOnTableRowAdd: 参数无效');
            return false;
        }

        this.editor.HMConfig.onTableRowAdd = callback;
        this.onTableRowAdd = callback;
        return true;
    },
    /**
     * 给列表类表格指定行/列设置数据元值（程序化赋值，非「+」点击场景）
     * @param {String} tableCode 表格编码（data-hm-table-code 或 data-hm-datatable）
     * @param {Number} rowIndex 竖向表格为 tbody 行索引；横向表格为数据列索引
     * @param {Array} rowData 数据元数组 [{ keyCode, keyValue, keyName? }, ...]
     * @returns {Boolean} 是否成功
     */
    setTableRowData: function (tableCode, rowIndex, rowData) {
        return this.documentModel.setTableRowData(tableCode, rowIndex, rowData);
    },
    /**
     * 给指定 tr 行设置数据元值（onTableRowAdd 内可用 ctx.$row 调用）
     * @param {HTMLElement} row 表格行 tr 元素
     * @param {Array} rowData 数据元数组
     * @returns {Boolean} 是否成功
     */
    setTableRowDataOnRow: function (row, rowData) {
        return this.documentModel.setTableRowDataOnRow(row, rowData);
    },
    /**
     * 定位到病历或元素
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
        return this.documentModel.focusElement(docCode, eleCode, eleContent);
    },
    /**
     * 插入HTML内容
     * @param {String} htmlContent 要插入的HTML内容
     * @param {String} posTag 定位标记（可选），如果提供，将通过 data-hm-code=posTag 或 data-hm-name=posTag 查找元素，在元素后插入HTML，完成后光标定位到插入HTML之前
     * @returns {Boolean} 是否成功插入
     * 
     * 使用说明：
     * 1. insertHtml(htmlContent) - 在光标处插入HTML
     * 2. insertHtml(htmlContent, posTag) - 在指定元素后插入HTML，光标定位到插入HTML之前
     */
    insertHtml: function (htmlContent, posTag) {
        return this.documentModel.insertHtml(htmlContent, posTag);
    },
    /**
     * 获取光标所在（或选区范围内）的数据元
     * 从选区起点向上查找最近的带 data-hm-code 的数据元节点（不含 labelbox），取值规则与文档保存一致
     * @returns {Object|null} 数据元对象；无编辑器、无选区或未落在数据元上时返回 null
     * @returns {String} keyCode 数据元编码
     * @returns {String} keyId 数据元 ID
     * @returns {String} keyName 数据元名称
     * @returns {String} keyValue 数据元值
     * 
     * 使用示例：
     * const meta = editor.getSelectedElement();
     * if (meta) {
     *   console.log('数据元编码:', meta.keyCode);
     *   console.log('数据元名称:', meta.keyName);
     *   console.log('数据元值:', meta.keyValue);
     * }
     */
    getSelectedElement: function () {
        if (!this.editor) return null;
        var selection = this.editor.getSelection();
        if (!selection) return null;
        var startElement = selection.getStartElement();
        if (!startElement) return null;
        // 向上查找最近的 data-hm-code 节点（排除 labelbox）
        var dataMetaNode = startElement.getAscendant(function (node) {
            if (!node.data || typeof node.data !== 'function') return false;
            var hmCode = node.data('hm-code');
            var hmNode = node.data('hm-node');
            return hmCode && hmNode !== 'labelbox';
        }, true);
        if (!dataMetaNode) return null;
        // getDataElementObject 内使用 jQuery($(ele))，须传原生 DOM；CKEDITOR.dom.element 不能直接传入
        var domEl = dataMetaNode.$ != null ? dataMetaNode.$ : dataMetaNode;
        var meta = null;
        if (this.documentModel && typeof this.documentModel.getDataElementObject === 'function') {
            meta = this.documentModel.getDataElementObject(domEl);
        }
        // 有效对象：含至少一个可序列化字段；null、undefined、{} 则走 data-* 兜底
        if (meta != null && typeof meta === 'object' && Object.keys(meta).length > 0) {
            return meta;
        }
        return {
            keyCode: dataMetaNode.data('hm-code') || '',
            keyId: dataMetaNode.data('hm-id') || '',
            keyName: dataMetaNode.data('hm-name') || '',
            keyValue: dataMetaNode.data('hm-value') || ''
        };
    },
    /**
     * 获取光标选中内容
     * @param {String} [type='html'] 返回类型：'html' 或 'text'
     * @returns {String} 选中的内容；无选区时返回空字符串
     * 
     * 使用示例：
     * // 获取 HTML 格式
     * const html = editor.getSelectedContent('html');
     * // 获取纯文本
     * const text = editor.getSelectedContent('text');
     */
    getSelectedContent: function (type) {
        if (!this.editor) return '';
        var _type = (type || 'html').toLowerCase();
        if (_type === 'text') {
            // 纯文本模式
            var sel = this.editor.getSelection();
            return sel ? sel.getSelectedText() : '';
        } else {
            // HTML 模式（默认）
            return this.editor.getSelectedHtml(true);
        }
    },
    /**
     * 设置数据元元素的 CSS 样式（合并进元素现有内联样式，同名属性覆盖）
     * @param {String} eleCode 数据元编码（data-hm-code）
     * @param {Object} styles 样式对象，使用 jQuery.css 设置
     * @returns {Boolean} 是否找到并设置成功
     * 
     * 使用示例：
     * editor.setElementStyle('DE08.10.013.00.012', { color: 'red', fontWeight: 'bold' });
     */
    setElementStyle: function (eleCode, styles) {
        return this.documentModel.setElementStyle(eleCode, styles);
    }
});
