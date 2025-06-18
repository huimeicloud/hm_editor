/**
 * HMEditor - 惠每电子病历编辑器封装类
 * 封装基于CKEditor 4.0的编辑器，提供统一的API接口
 */
(function (window) {
    var LoaderClass = function (propty) {
        var func = function () {
            this.init.apply(this, arguments);
        };
        func.prototype = propty;
        return func;
    }
    var editorLoader = LoaderClass({
        init: function () {
            this.loaders = {}; // 存储编辑器实例
        },

        /**
         * 创建编辑器iframe
         * @param {Object} options 配置项
         * @param {String} options.container 容器选择器或DOM元素
         * @param {String} options.id 创建编辑器唯一标识  创建多个编辑器时，id不能相同
         * @param {Boolean} options.designMode 设计模式开关，true开启设计模式，默认false
         * @param {Boolean} options.reviseMode 修订模式开关，true开启修订模式，默认false
         * @param {Boolean} options.readOnly 只读模式开关，true开启只读模式，默认false
         * @param {Object} options.style iframe样式
         * @param {String} options.sdkHost 加载sdk地址
         * @param {Object} options.editorConfig 编辑器配置
         * @param {Object} options.customParams 自定义参数 动态数据源接口入参 例：{departmentCode:'0001',doctorCode:'0001'}
         * @param {Array} options.customToolbar 自定义工具栏 例：[{name:'customButton',label:'自定义按钮',icon:'/path/to/icon.png',toolbarGroup:'insert',onExec:function(editor){},onRefresh:function(editor,path){}}
         * @param {Object} options.printConfig 打印配置
         * @param {Boolean} options.printConfig.pageBreakPrintPdf 分页模式打印是否生成pdf
         * @param {Array} options.printConfig.pageAnotherTpls 另页打印模板名称
         * @param {Array} options.printConfig.pageAloneTpls 单独一页打印模板名称
         * @param {Function} options.callback 加载完成回调
         */
        createEditor: function (options) {
            var _this = this;

            if (!options || !options.container) {
                console.error("容器不能为空");
                return null;
            }

            var container = typeof options.container === 'string' ?
                document.querySelector(options.container) : options.container;

            if (!container) {
                console.error("找不到容器元素");
                return null;
            }
            _this.options = options;
            var id = options.id || "hmEditor_" + new Date().getTime();
            var iframe = document.createElement("iframe");

            // 设置iframe属性
            iframe.id = id;
            iframe.name = id;
            iframe.allowtransparency = true;
            iframe.frameBorder = "0";
            iframe.scrolling = "auto";

            // 设置样式
            if (options.style) {
                for (var key in options.style) {
                    iframe.style[key] = options.style[key];
                }
            } else {
                // 默认样式
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
            }

            // 添加到容器
            container.appendChild(iframe);

            // 存储iframe引用
            this.loaders[id] = {
                iframe: iframe,
                hmEditor: null
            };

            // 加载HTML内容
            this._loadIframeContent(id, function () {
                // 初始化编辑器
                var iframeWin = iframe.contentWindow;
                var hmEditor = iframeWin.hmEditor = new iframeWin.HMEditor(options, function (hmEditor) {
                    if (_this.loaders[id]) {
                        _this.loaders[id].hmEditor = hmEditor;
                        options.onReady && options.onReady(hmEditor);
                    }
                });
                hmEditor.frameId = id;
            });

        },

        /**
         * 创建编辑器iframe (Promise方式)
         * @param {Object} options 配置项
         * @param {String} options.container 容器选择器或DOM元素
         * @param {String} options.id iframe唯一标识
         * @param {Object} options.style iframe样式
         * @param {Object} options.editorConfig 编辑器配置
         * @param {Boolean} options.designMode 设计模式开关，true开启设计模式，默认false
         * @param {Boolean} options.reviseMode 修订模式开关，true开启修订模式，默认false
         * @param {Boolean} options.readOnly 只读模式开关，true开启只读模式，默认false
         * @param {Object} options.customParams 自定义参数 动态数据源接口入参 例：{departmentCode:'0001',doctorCode:'0001'}
         * @param {Array} options.sdkHost 加载sdk地址
         * @param {Array} options.customToolbar 自定义工具栏 例：[{name:'customButton',label:'自定义按钮',icon:'/path/to/icon.png',toolbarGroup:'insert',onExec:function(editor){},onRefresh:function(editor,path){}}
         * @param {Object} options.printConfig 打印配置
         * @param {Boolean} options.printConfig.pageBreakPrintPdf 分页模式打印是否生成pdf
         * @param {Array} options.printConfig.pageAnotherTpls 另页打印模板名称
         * @param {Array} options.printConfig.pageAloneTpls 单独一页打印模板名称
         * @returns {Promise} 返回Promise对象，resolve时返回编辑器ID和实例
         */
        createEditorAsync: function (options) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                if (!options || !options.container) {
                    reject(new Error("容器不能为空"));
                    return;
                }

                var container = typeof options.container === 'string' ?
                    document.querySelector(options.container) : options.container;

                if (!container) {
                    reject(new Error("找不到容器元素"));
                    return;
                }

                _this.options = options;
                var id = options.id || "hmEditor_" + new Date().getTime();
                var iframe = document.createElement("iframe");

                // 设置iframe属性
                iframe.id = id;
                iframe.name = id;
                iframe.allowtransparency = true;
                iframe.frameBorder = "0";
                iframe.scrolling = "auto";

                // 设置样式
                if (options.style) {
                    for (var key in options.style) {
                        iframe.style[key] = options.style[key];
                    }
                } else {
                    // 默认样式
                    iframe.style.width = "100%";
                    iframe.style.height = "100%";
                    iframe.style.border = "none";
                }

                // 添加到容器
                container.appendChild(iframe);

                // 存储iframe引用
                _this.loaders[id] = {
                    iframe: iframe,
                    hmEditor: null
                };

                // 异步加载HTML内容
                _this._loadIframeContent(id, function () {
                    // 初始化编辑器
                    var iframeWin = iframe.contentWindow;
                    var hmEditor = iframeWin.hmEditor = new iframeWin.HMEditor(options, function (hmEditor) {
                        if (_this.loaders[id]) {
                            _this.loaders[id].hmEditor = hmEditor;

                            // 使用Promise解析编辑器对象
                            resolve(hmEditor);

                            // 同时兼容旧的回调方式
                            options.onReady && options.onReady(hmEditor);
                        }
                    });

                    hmEditor.frameId = id;
                });
            });
        },

        /**
         * 获取编辑器实例
         * @param {String} id iframe ID
         * @returns {Object} 编辑器和业务组件实例
         */
        getInstance: function (id) {
            if (this.loaders[id] && this.loaders[id].hmEditor) {
                return this.loaders[id].hmEditor;
            }
            return null;
        },

        /**
         * 异步获取编辑器实例（Promise方式）
         * @param {String} id iframe ID
         * @param {Number} timeout 超时时间(毫秒)，默认10000ms
         * @returns {Promise} 返回Promise对象
         */
        getEditorInstanceAsync: function (id, timeout) {
            var _this = this;
            timeout = timeout || 10000; // 默认超时时间10秒

            return new Promise(function (resolve, reject) {
                // 如果已经加载完成，直接返回
                var editor = _this.getInstance(id);
                if (editor) {
                    resolve(editor);
                    return;
                }
                if (!_this.loaders[id]) {
                    resolve(null);
                    return;
                }
                var startTime = new Date().getTime();
                var checkInterval = 100; // 每100ms检查一次

                // 定时检查编辑器是否已加载
                var timer = setInterval(function () {
                    // 检查编辑器是否已加载
                    var editor = _this.getInstance(id);
                    if (editor) {
                        clearInterval(timer);
                        resolve(editor);
                        return;
                    }

                    // 检查是否超时
                    if (new Date().getTime() - startTime > timeout) {
                        clearInterval(timer);
                        reject(new Error("获取编辑器实例超时，请确认编辑器是否正确初始化"));
                    }
                }, checkInterval);
            });
        },

        /**
         * 获取编辑器实例（带重试功能）
         * @param {String} id iframe ID
         * @param {Function} callback 回调函数
         */
        getEditorInstance: function (id, callback) {
            var _this = this;
            options = options || {};
            var maxRetries = 20; // 默认最大重试20次
            var retryInterval = 200; // 默认重试间隔200ms

            if (!callback || typeof callback !== 'function') {
                console.error("回调函数不能为空");
                return;
            }
            if (!_this.loaders[id]) {
                callback(null, new Error("此实例不存在"));
                return;
            }
            var currentRetry = 0;

            function tryGetEditor() {
                // 检查是否已加载
                var editor = _this.getInstance(id);
                if (editor) {
                    callback(editor);
                    return;
                }

                // 检查是否达到最大重试次数
                if (currentRetry >= maxRetries) {
                    callback(null, new Error("获取编辑器实例失败"));
                    return;
                }

                // 继续重试
                currentRetry++;
                setTimeout(tryGetEditor, retryInterval);
            }

            // 开始尝试获取
            tryGetEditor();
        },

        /**
         * 销毁编辑器实例
         * @param {String} id iframe ID
         */
        destroyEditor: function (id) {
            if (this.loaders[id]) {
                try {
                    // 销毁编辑器
                    // this.editors[id].destroy();

                    // 移除iframe
                    var iframe = this.loaders[id].iframe;
                    if (iframe && iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }

                    // 清理引用
                    delete this.loaders[id];
                } catch (e) {
                    console.error("销毁编辑器失败:", e);
                }
            }
        },

        /**
         * 加载iframe内容
         * @private
         * @param {String} id iframe ID
         * @param {Function} callback 加载完成回调
         */
        _loadIframeContent: function (id, callback) {
            var iframe = this.loaders[id].iframe;
            var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // 基本HTML结构
            var htmlContent = this.getIframeHtml();
            // 写入内容
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            // 监听iframe加载完成
            var onLoadHandler = function () {
                if (typeof callback === 'function') {
                    callback();
                }

                // 移除事件监听
                if (iframe.removeEventListener) {
                    iframe.removeEventListener('load', onLoadHandler);
                } else if (iframe.detachEvent) {
                    iframe.detachEvent('onload', onLoadHandler);
                }
            };

            // 添加加载事件
            if (iframe.addEventListener) {
                iframe.addEventListener('load', onLoadHandler);
            } else if (iframe.attachEvent) {
                iframe.attachEvent('onload', onLoadHandler);
            }
        },
        getIframeHtml: function (com) {
            var _this = this;
            var webHost = _this.options.sdkHost;
            // css 资源集合地址
            var links = [
                '/vendor/bootstrap.css',
                '/vendor/jquery-editable-select.css',
                '/vendor/jquery-ui.css',
                '/vendor/jquery.datetimepicker.css',
                '/vendor/iconfont/iconfont.css',
                '/wrapper/hmgrowl/hmgrowl.css',
                '/all.min.css'
            ];

            // js 资源集合地址
            var scripts = [
                '/vendor/jquery.min.js',
                '/vendor/template-native.js',
                '/vendor/hm-sdk.min.js',
                '/vendor/jquery.mask.min.js',
                '/vendor/jquery.datetimepicker.full.min.js',
                '/vendor/jquery-editable-select.js',
                '/vendor/jquery-ui.min.js',
                '/vendor/showdown.min.js',
                '/vendor/konva.min.js',
                '/vendor/bootstrap.min.js',
                '/vendor/underscore-min.js',
                '/wrapper/wrapperUtils.js',
                '/wrapper/hmgrowl/index.js',
                '/ckeditor.js',
                '/hmEditor.js',
                '/base.min.js',
                '/all.min.js'
            ];

            // 存放引用列表集合
            var linklist = [],
                scriptlist = [];
            // 遍历样式集合
            for (var i = 0; i < links.length; i++) {
                var link = webHost + links[i];
                linklist.push('<link rel="stylesheet" type="text/css" href="' + link + '"/>');
            }
            // 遍历脚本集合
            for (var i = 0; i < scripts.length; i++) {
                var script = webHost + scripts[i];
                scriptlist.push('<script type="text/javascript"  charset="utf-8" src="' + script + '"></script>');
            }

            // 模板（注：模板里不能有单引号）
            var htmlText = '<!DOCTYPE html><html><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"/><title>Dr.Mayson</title>' +
                linklist.join('') +
                scriptlist.join('') +
                '</head><body style="margin:0px;">' +
                '</body></html>';
            return htmlText;
        },
        /**
         * 初始化认证信息，并加载jssdk，返回Promise对象
         * @param {*} autherEntity 认证信息
         * @param {*} autherEntity.autherKey 认证key
         * @param {*} autherEntity.userGuid 患者ID
         * @param {*} autherEntity.userName 患者姓名
         * @param {*} autherEntity.doctorGuid 医生ID
         * @param {*} autherEntity.serialNumber 住院号
         * @param {*} autherEntity.department 科室名称
         * @param {*} autherEntity.doctorName 医生姓名
         * @param {*} autherEntity.hospitalGuid 医院ID 非必要字段
         * @param {*} autherEntity.hospitalName 医院名称 非必要字段
         * @param {*} autherEntity.customEnv  
         * @param {*} autherEntity.flag m 住院 c 门诊
         * @returns 
         */
        initAutherEntity: function (autherEntity) {
            var _t = this;
            _t.autherEntity = autherEntity; 
            return new Promise(function (resolve, reject) {
                _t.loadJs(autherEntity.aiServer + '/cdss/jssdk?v=4.0&ak='+ _t.autherEntity.autherKey, function (err) {
                    if (err) {
                        console.error('加载CDSS SDK失败:', err);
                        reject(err);
                        return;
                    }
                    HM.maysonLoader(autherEntity, function (mayson) {
                        //加载编辑器助手 
                        resolve(mayson);
                    });
                });
            });
        },
        loadJs: function (src, cbk) {
            var script = document.createElement('script')
            script.src = src;
            // 添加错误处理
            script.onerror = function () {
                console.error('脚本加载失败:', src);
                cbk && cbk(new Error('脚本加载失败'));
            };
            if (script.readyState) {
                script.onreadystatechange = function () {
                    var r = script.readyState;
                    if (r === 'loaded' || r === 'complete') {
                        script.onreadystatechange = null;
                        cbk && cbk();
                    }
                };
            } else {
                script.onload = function () {
                    cbk && cbk();
                }
            }
            // 设置超时处理
            var timeout = setTimeout(function () {
                if (script.parentNode) {
                    script.onerror(new Error('脚本加载超时'));
                }
            }, 10000); // 10秒超时
            // 成功加载后清除超时
            var originalCallback = cbk;
            cbk = function (err) {
                clearTimeout(timeout);
                originalCallback && originalCallback(err);
            };
            var head = document.getElementsByTagName("head")[0];
            head.appendChild(script);
        }
    });

    // 导出HMEditor对象
    window.HMEditorLoader = new editorLoader();

})(window);