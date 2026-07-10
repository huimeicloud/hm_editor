HMEditor.fn({
    init: function (options, onReady) {
        var _t = this;
        _t.options = options || {};
        _t.onReady = onReady;
        _t.customMenuList = []; //自定义菜单列表
        _t.initEditorPanel();
        _t.bindBaseEvent();
    },
    /**
     * 初始化组件
     */
    initComponent: function () {
        var _t = this;
        for (var i in commonHM.component) {
            try {
                var component = commonHM.component[i];
                var config = component.config || {};
                _t[i] = new commonHM.component[i](_t.editor);
                _t[i].$parent = _t;
                _t[i].description = config.description;

            } catch (e) {
                throw e;
            }
        }
    },
    /**
     * 初始化面板
     */
    initEditorPanel: function () {
        var _t = this;
        var _sdkHost = _t.options.sdkHost;
        $('body').renderTpl($base_tpl['base/tpl/home'], {
            sdkHost: _sdkHost
        });
        //src="<%=sdkHost%>/drawingboard/index.html"
        var editorConfig = _t.initDefaultConfig();
        window.editorIns = _t.editor = CKEDITOR.replace('editorSpace', editorConfig);
        // _t.registerToolbar(_t.options.customToolbar);
        //配置
        _t.initEditorConfig();
        _t.initIframe(_sdkHost);
        _t.editor.on('instanceReady', function (evt) {
            _t.initComponent();
            _t.initContextMenuListener();
            _t.onReady && _t.onReady(_t);
        });
        // 工具栏命令完成事件
        _t.editor.on('toolbarCommandComplete', function (evt) {
            var commandData = evt.data;
            _t.onToolbarCommandComplete && _t.onToolbarCommandComplete(commandData.command, commandData.type, commandData.data);
        });
        HmGrowl.setHmGrowlWrapper($('#editor-container'));

    },
    initIframe: function (_sdkHost) {
        var _t = this;
        // $.ajax({
        //     url: _sdkHost + '/drawingboard/index.html',
        //     type: 'GET',
        //     data: {},
        //     success: function (htmlText) {
        //         try {
        //             var data={
        //                  sdkHost: _sdkHost
        //             }
        //             template.config && template.config("escape", true);
        //             var render = template.compile(htmlText);
        //             escapeScript(data);
        //             html = render(data || {});
        //             var iframe = $('.image_editor_iframe')[0];
        //             var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        //             iframeDoc.open();
        //             iframeDoc.write(html);
        //             iframeDoc.close();
        //         } catch (error) {
        //             // alert("art-template template.render() error!");
        //         }

        //     },
        //     error: function (xhr, status, error) {
        //         console.error('加载image_editor_iframe出错:', error);
        //     }
        // });
        $.getTplHtml(_sdkHost + '/drawingboard/index.html',{
            sdkHost: _sdkHost
        },function(bodyHtml){
            var iframe = $('.image_editor_iframe')[0];
            var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(bodyHtml);
            iframeDoc.close();
        });
    },
    /**
     * 绑定基础事件
     */
    bindBaseEvent: function () {
        var _t = this;
        //放大缩小
        $('#enlargeOrShrink').on('click', function () {
            _t.editorSize.enlargeOrShrink();
        });
        $('.zoomout').on('click', function () {
            _t.editorSize.zoomOut();
        });
        $('.zoomin').on('click', function () {
            _t.editorSize.zoomIn();
        });
        _t.editor.on('doubleclick', function (evt) {
            if (evt.data.element && evt.data.element.is('img') && evt.data.element.getAttribute('src')) {
                var imgUrl = evt.data.element.getAttribute('src');
                var imgId = evt.data.element.getAttribute('id');
                // window.imgUrl = imgUrl;
                // var imgName = imgUrl.slice(imgUrl.lastIndexOf('/') + 1, imgUrl.lastIndexOf('.'));
                _t.imageEditor.loadImageFromUrlToCanvas(imgUrl, imgId);
            }
        });
        $('#imageEditorModal').on('hide.bs.modal', function () {
            _t.imageEditor.clearCanvasObj();
        });
        $('.image-editor-save-btn').on('click', function () {
            _t.imageEditor.saveImageFromCanvas();
        });
    },
    /**
     * 初始化编辑器配置
     */
    initEditorConfig: function () {
        var _t = this;
        _t.editor.options = _t.options;
        var rowAddOpt = _t.options.onTableRowAdd;
        var rowAddHandler = null;
        if (typeof rowAddOpt === 'function') {
            rowAddHandler = rowAddOpt;
        } else if (rowAddOpt && rowAddOpt.tableCode && Array.isArray(rowAddOpt.rowData)) {
            (function (code, data) {
                rowAddHandler = function (ctx) {
                    if (ctx.tableCode !== code) {
                        return;
                    }
                    return data;
                };
            })(rowAddOpt.tableCode, rowAddOpt.rowData);
        }
        _t.editor.HMConfig = window.HMConfig = {
            designMode: _t.options.designMode || false,
            reviseMode: _t.options.reviseMode || false,
            readOnly: _t.options.readOnly || false,
            sdkHost: _t.options.sdkHost || '',
            realtimePageBreak: _t.options.realtimePageBreak || false, // 实时分页
            // 零宽字符, Zero Width No-Break Space:  ​ , \ufeff(U+FEFF). (http://dev.ckeditor.com/ticket/1359)
            zeroWidthChar: /[\u200B-\u200D\uFEFF]/g,
            zeroWidthCharStarted: /^[\u200B-\u200D\uFEFF]+/g,
            zeroWidthCharEnded: /[\u200B-\u200D\uFEFF]+$/g,
            watermark: {}, // 文档水印
            printConfig: _t.options.printConfig || {},
            customParams: _t.options.customParams || {}, // 自定义参数 动态数据源接口入参
            editShowPaddingTopBottom: _t.options.editShowPaddingTopBottom || false, // 编辑时纸张设置里面的上下边距是否有效，默认为false
            multiPartHeader: _t.options.multiPartHeader || [], // 聚合病程实时分页时，页眉上转科换床信息
            allowModifyDatasource: _t.options.allowModifyDatasource || false, // 允许修改数据元名称和编码
            onTableRowAdd: rowAddHandler // 列表表格点击「+」新增行后回调或行数据
        }
        _t.onTableRowAdd = _t.editor.HMConfig.onTableRowAdd;
        _t.editor.showTools = _t.options.hasOwnProperty('showTools') ? _t.options.showTools : true;
        delete _t.options.designMode;
        delete _t.options.reviseMode;
        delete _t.options.readOnly;
        delete _t.options.sdkHost;
        delete _t.options.showTools;
    },
    /**
     * 初始化右键菜单监听
     */
    initContextMenuListener: function () {
        var _t = this;
        _t.editor.contextMenu.addListener(function (element, selection, path) {
            var menuItems = {};
            for (var i = 0; i < _t.customMenuList.length; i++) {
                var menu = _t.customMenuList[i];
                if (!menu.show || menu.show(element.$, selection, path)) {
                    menuItems[menu.commandName] = CKEDITOR.TRISTATE_OFF;
                }
            }
            return menuItems;
        });
    },
    /**
     * 初始化默认配置
     * @returns
     */
    initDefaultConfig: function () {
        var _t = this;
        var editorConfig = _t.options.editorConfig || {};
        // 获取基础CSS配置
        var baseCss = [CKEDITOR.getUrl('vendor/font-awesome.min.css'),CKEDITOR.getUrl('vendor/hm-sdk.min.css'),CKEDITOR.getUrl('css/docAi.min.css'),CKEDITOR.getUrl('css/document.min.css'),CKEDITOR.getUrl('contents.css')];
        editorConfig.contentsCss = baseCss.concat(editorConfig.contentsCss || []);
        var removePlugins = (editorConfig.removePlugins || '').replace(/,\s*$/, '');
        if (!_t.options.designMode) {
            editorConfig.removePlugins = removePlugins + ',switchmodel,clear,removeformat';
        }
        return editorConfig;
    },
    /**
     * 注册自定义菜单
     * @param {Array} menuList 菜单列表
     */
    registerCustomMenu: function (menuList) {
        var _t = this;
        if (!(Array.isArray(menuList) && menuList.length > 0)) {
            return;
        }
        if (!_t.editor) {
            return;
        }
        _t.editor.addMenuGroup('hm');
        for (var i = 0; i < menuList.length; i++) {
            (function (menu) {
                var commandName = menu.commandName = menu.name + $.getUUId(i);
                _t.editor.addCommand(commandName, {
                    exec: function (editor) {
                        menu.onExec && menu.onExec();
                    }
                });
                _t.editor.addMenuItem(commandName, {
                    label: menu.label,
                    command: commandName,
                    group: 'hm',
                    order: i + 1
                });
            })(menuList[i])


        }
        _t.customMenuList = _t.customMenuList.concat(menuList);
    },
    /**
     * 注册自定义工具栏按钮
     * @param {Object} options 配置选项
     * @param {Array} options.customToolbar 自定义工具栏按钮数组，每个按钮可包含：
     *   - name: 按钮名称（必需）
     *   - label: 按钮标签（必需）
     *   - icon: 按钮图标（可选）
     *   - onExec: 点击执行函数（必需）
     *   - position: 按钮位置配置（可选）
     *     - groupIndex: 插入到第几个工具栏组（从0开始，默认添加到末尾）
     *     - itemIndex: 在组内的位置（从0开始，默认添加到组末尾）
     *     - createNewGroup: 是否创建新组（默认true）
     * @returns {Boolean}
     * 
     * @example
     * // 添加到第一个工具栏组的第2个位置
     * position: { groupIndex: 0, itemIndex: 1 }
     * 
     * // 创建新组并插入到第3个位置
     * position: { groupIndex: 2, createNewGroup: true }
     */
    registerToolbar: function (options) {
        var _t = this;
        if (!_t.editor) {
            return false;
        }
        
        // 兼容旧方式：直接读取 _t.options.customToolbar
        var customToolbar = (options && options.customToolbar) || _t.options.customToolbar || [];
        
        customToolbar.forEach(function (btn) {
            var name = btn.name + $.getUUId();
            var position = btn.position || {};
            var groupIndex = position.groupIndex;
            var itemIndex = position.itemIndex;
            var createNewGroup = position.createNewGroup !== false;
            
            // 创建命令
            _t.editor.addCommand(name, {
                exec: function (editor) {
                    try {
                        btn.onExec && btn.onExec(editor);
                    } catch (e) {
                        console.error(e);
                    }
                }
            });

            // 注册按钮
            _t.editor.ui.addButton(name, {
                label: btn.label,
                command: name,
                icon: btn.icon || '',
                toolbar: name
            });
            
            // 根据 position 配置决定按钮位置
            var toolbar = _t.editor.config.toolbar;
            
            if (createNewGroup && typeof groupIndex === 'number') {
                // 在指定位置创建新组
                var newGroup = {
                    name: name,
                    items: [name]
                };
                
                if (groupIndex >= 0 && groupIndex < toolbar.length) {
                    toolbar.splice(groupIndex, 0, newGroup);
                } else {
                    toolbar.push(newGroup);
                }
            } else if (!createNewGroup && typeof groupIndex === 'number') {
                // 插入到现有组的指定位置
                if (groupIndex >= 0 && groupIndex < toolbar.length) {
                    var group = toolbar[groupIndex];
                    if (group && Array.isArray(group.items)) {
                        if (typeof itemIndex === 'number' && itemIndex >= 0 && itemIndex <= group.items.length) {
                            group.items.splice(itemIndex, 0, name);
                        } else {
                            group.items.push(name);
                        }
                    } else if (Array.isArray(group)) {
                        // 兼容 toolbar 是数组的格式
                        if (typeof itemIndex === 'number' && itemIndex >= 0 && itemIndex <= group.length) {
                            group.splice(itemIndex, 0, name);
                        } else {
                            group.push(name);
                        }
                    }
                } else {
                    // 组索引无效，添加到末尾
                    toolbar.push({
                        name: name,
                        items: [name]
                    });
                }
            } else {
                // 无位置配置，默认添加到末尾
                toolbar.push({
                    name: name,
                    items: [name]
                });
            }
        });

        return true;
    }

});