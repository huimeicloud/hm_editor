/**
 * HM Editor 标签页 Demo
 * 该脚本实现标签页和多编辑器的创建和管理
 */
class TabEditorManager {
    constructor(options) {
        this.options = options || {};
        this.container = $(options.container);
        this.editors = {}; // 存储编辑器实例
        this.currentTabId = null; // 当前激活的标签页ID
        this.tabCounter = 0; // 标签计数器

        this.init();
    }

    /**
     * 初始化标签页容器
     */
    init() {
        // 创建标签容器
        this.container.html(`
            <div class="tab-header"></div>
            <div class="tab-contents"></div>
        `);

        this.tabHeader = this.container.find('.tab-header');
        this.tabContents = this.container.find('.tab-contents');

        // 绑定事件委托
        this.tabHeader.on('click', '.tab-item', (e) => {
            const tabId = $(e.currentTarget).data('id');
            this.activateTab(tabId);
        });

        this.tabHeader.on('click', '.tab-close-btn', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            const tabId = $(e.currentTarget).parent().data('id');
            this.closeTab(tabId);
        });
    }
    /**
     * 创建新标签页
     * @param {String} title 标签页标题
     * @param {Object} editorOptions 编辑器配置项
     * @param {Object} content 文档内容
     * @returns {Promise} 返回Promise对象
     */
    async createTab(title, editorOptions = {}, content = null) {
        this.tabCounter++;
        const tabId = 'tab_' + this.tabCounter;
        const editorId = 'editor_' + this.tabCounter;

        // 创建标签和内容容器
        const tabItem = $(`<div class="tab-item" data-id="${tabId}">${title}<span class="tab-close-btn">×</span></div>`);
        const tabContent = $(`<div class="tab-content" data-id="${tabId}"><div id="${editorId}" class="editor-container"></div></div>`);

        // 添加标签和内容
        this.tabHeader.append(tabItem);
        this.tabContents.append(tabContent);

        // 显示新标签
        this.activateTab(tabId);
        var sdkHost;
        var protocol = window.location.protocol;
        if (/locale|127.0.0.1/.test(window.location.host)) {
            sdkHost = protocol + '//127.0.0.1:3071';
        } else {
            sdkHost = protocol + '//' + window.location.host + '/hmEditor';
        }
        // 创建编辑器
        try {
            const mergedOptions = Object.assign({}, {
                container: `#${editorId}`,
                id: editorId,
                sdkHost: sdkHost,
                // sdkHost: "http://172.16.8.32:9090/hmEditor",
                style: {
                    width: '100%',
                    height: '100%',
                    border: '1px solid #ddd'
                },
                customToolbar: [{
                    name: 'customButton',
                    label: '自定义按钮',
                    icon: 'http://127.0.0.1:3071/plugins/save/icons/save.png',
                    toolbarGroup: 'insert',
                    onExec: function (editor) {
                        // 点击按钮时执行的代码
                        console.log('自定义按钮被点击了');
                    }

                }]
            }, editorOptions);
            // 存储编辑器实例
            this.editors[tabId] = {
                tabId: tabId,
                editorId: editorId
            };

            // 创建编辑器
            const editorInstance = await HMEditorLoader.createEditorAsync(mergedOptions);
            if (content) {
                // 如果有内容，则设置文档内容
                editorInstance.setDocContent(content);
            } else {
                // 否则设置默认内容
                editorInstance.editor.setData(`<p style='height:300px;position:relative;'>这是${title}的内容</p>`);
            }
            editorInstance.onToolbarCommandComplete = function (command, type, data) {
                // 保存按钮点击事件回调
                console.log('onToolbarCommandComplete', command, type, data);
            }
            // 存储编辑器实例
            this.editors[tabId].editor = editorInstance;

            return {
                tabId: tabId,
                editorId: editorId,
                editor: editorInstance
            };
        } catch (error) {
            console.error('创建编辑器失败:', error);
            this.closeTab(tabId);
            throw error;
        }
    }

    /**
     * 激活标签页
     * @param {String} tabId 标签页ID
     */
    activateTab(tabId) {
        // 移除所有活动状态
        this.tabHeader.find('.tab-item').removeClass('active');
        this.tabContents.find('.tab-content').removeClass('active');

        // 激活当前标签
        this.tabHeader.find(`.tab-item[data-id="${tabId}"]`).addClass('active');
        this.tabContents.find(`.tab-content[data-id="${tabId}"]`).addClass('active');

        // 更新当前标签ID
        this.currentTabId = tabId;
    }

    /**
     * 获取当前激活的编辑器实例
     * @returns {Object} 编辑器实例
     */
    async getCurrentEditor() {
        let tabObj = this.editors[this.currentTabId];
        if (tabObj.editor) {
            return tabObj.editor;
        } else {
            return await HMEditorLoader.getEditorInstanceAsync(tabObj.editorId);
        }
    }

    /**
     * 关闭标签页
     * @param {String} tabId 标签页ID
     */
    closeTab(tabId) {
        if (!this.editors[tabId]) {
            return;
        }

        // 销毁编辑器
        try {
            HMEditorLoader.destroyEditor(this.editors[tabId].editorId);
        } catch (e) {
            console.error('销毁编辑器失败:', e);
        }

        // 移除标签和内容
        this.tabHeader.find(`.tab-item[data-id="${tabId}"]`).remove();
        this.tabContents.find(`.tab-content[data-id="${tabId}"]`).remove();

        // 从编辑器集合中移除
        delete this.editors[tabId];

        // 如果关闭的是当前标签，激活其他标签
        if (this.currentTabId === tabId) {
            const otherTab = this.tabHeader.find('.tab-item').first();
            if (otherTab.length > 0) {
                this.activateTab(otherTab.data('id'));
            } else {
                this.currentTabId = null;
            }
        }
    }

    /**
     * 关闭所有标签页
     */
    closeAllTabs() {
        const tabIds = Object.keys(this.editors);
        tabIds.forEach(tabId => {
            this.closeTab(tabId);
        });
    }
}

// 文档树结构数据从独立文件加载 (document-tree-data.js)

// 文档树管理类
class DocumentTreeManager {
    constructor(containerId, data) {
        this.container = $(containerId);
        this.data = data;
        this.selectedNode = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.empty();
        this.data.forEach(node => {
            this.container.append(this.createTreeNode(node, 0));
        });
    }

    createTreeNode(node, level) {
        const hasChildren = node.children && node.children.length > 0;
        const isFolder = node.type === 'folder';

        // 父节点使用id标识，子节点使用docCode，都没有则使用docName
        const nodeId = node.id || node.docCode || node.docName;
        const nodePath = node.docPath || node.docName;

        const nodeHtml = `
            <div class="tree-node tree-level-${level}" data-doc-code="${nodeId}">
                <div class="tree-node-content">
                    <span class="expand-icon ${hasChildren ? '' : 'empty'}" data-action="toggle"></span>
                    <span class="doc-icon ${node.type}"></span>
                    <span class="doc-name ${isFolder ? 'folder' : ''}" title="${nodePath}">
                        ${node.docName}
                    </span>
                </div>
                ${hasChildren ? `<div class="tree-children">${node.children.map(child => this.createTreeNode(child, level + 1)).join('')}</div>` : ''}
            </div>
        `;

        return nodeHtml;
    }

    bindEvents() {
        this.container.on('click', '.expand-icon[data-action="toggle"]', (e) => {
            e.stopPropagation();
            const $icon = $(e.target);
            const $children = $icon.closest('.tree-node').find('> .tree-children');

            if ($children.length > 0) {
                $children.toggleClass('expanded');
                $icon.toggleClass('expanded');
            }
        });

        // 添加双击事件处理 - 针对树形标题头部
        this.container.parent().on('dblclick', '.tree-header', (e) => {
            e.stopPropagation();
            const $treeContainer = this.container;
            const $allChildren = $treeContainer.find('.tree-children');
            const $allExpandIcons = $treeContainer.find('.expand-icon');

            // 检查当前状态：如果所有节点都展开了，则全部收缩；否则全部展开
            const expandedCount = $allChildren.filter('.expanded').length;
            const totalCount = $allChildren.length;

            if (expandedCount === totalCount) {
                // 全部收缩
                $allChildren.removeClass('expanded');
                $allExpandIcons.removeClass('expanded');
                console.log('双击收缩所有节点');
            } else {
                // 全部展开
                $allChildren.addClass('expanded');
                $allExpandIcons.addClass('expanded');
                console.log('双击展开所有节点');
            }
        });

        this.container.on('click', '.tree-node-content', (e) => {
            const $nodeContent = $(e.currentTarget);
            const $node = $nodeContent.closest('.tree-node');
            const docCode = $node.data('doc-code');

            // 检查是否为文件夹类型的节点
            const isFolder = $nodeContent.find('.doc-icon.folder').length > 0;

            if (isFolder) {
                // 如果是文件夹，只触发展开/收起功能
                const $children = $node.find('> .tree-children');
                const $expandIcon = $nodeContent.find('.expand-icon');

                if ($children.length > 0) {
                    $children.toggleClass('expanded');
                    $expandIcon.toggleClass('expanded');
                }
                return; // 不执行选中逻辑
            }

            // 移除之前的选中状态
            this.container.find('.tree-node-content.active').removeClass('active');
            // 添加新的选中状态
            $nodeContent.addClass('active');

            this.selectedNode = docCode;
            this.onNodeClick(docCode, $node);
        });
    }

    onNodeClick(docCode, $node) {
        const docPath = $node.find('.doc-name').attr('title');
        const docName = $node.find('.doc-name').text();

        console.log('选中文档节点:', {
            docCode: docCode,
            docPath: docPath,
            docName: docName
        });

        const docParams = [{
            "code": docCode,
            "docTplName": docName,
            "docContent": ""
        }];

        // 如果有docPath，则读取对应的HTML文件内容
        if (docPath && docPath !== docName) {
            // 显示加载状态
            console.log('正在加载文档内容:', docPath);

            // 使用jQuery的get方法读取HTML文件
            $.get(docPath)
                .done((htmlContent) => {
                    // 读取成功，将内容赋值到docParams
                    docParams[0].docContent = htmlContent;
                    console.log('文档内容加载成功:', {
                        code: docParams[0].code,
                        docTplName: docParams[0].docTplName,
                        contentLength: htmlContent.length
                    });

                    // 在这里可以添加后续处理逻辑，比如自动加载到编辑器
                    this.onDocumentLoaded(docParams);
                })
                .fail((jqXHR, textStatus, errorThrown) => {
                    // 读取失败的处理
                    console.error('加载文档内容失败:', {
                        path: docPath,
                        status: textStatus,
                        error: errorThrown
                    });
                    alert(`加载文档内容失败: ${docPath}\n错误: ${textStatus}`);
                });
        } else {
            console.log('节点没有有效的文档路径');
        }
    }

    // 文档加载完成后的处理方法
    async onDocumentLoaded(docParam) {
        console.log('文档加载完成:', docParam);
        const title = docParam[0].docTplName;
        await window.tabManager.createTab(title, {}, docParam);
    }

    expandAll() {
        this.container.find('.tree-children').addClass('expanded');
        this.container.find('.expand-icon').addClass('expanded');
    }

    collapseAll() {
        this.container.find('.tree-children').removeClass('expanded');
        this.container.find('.expand-icon').removeClass('expanded');
    }

    selectNode(docCode) {
        const $targetNode = this.container.find(`[data-doc-code="${docCode}"]`);
        if ($targetNode.length > 0) {
            $targetNode.find('.tree-node-content').click();
        }
    }
}

// 使用jQuery的DOM加载完成事件
$(document).ready(function () {
    // 获取URL中的isTest参数
    const urlParams = new URLSearchParams(window.location.search);
    var isTest = urlParams.get('isTest') === '1';
    console.log('浏览器传入的测试参数:', isTest);
    if(isTest){
        $('#btnHmAiQc').removeAttr('disabled');
        $('#btnHmAiQc').removeClass('next-feature-btn');
    }
    // 初始化标签页管理器
    window.tabManager = new TabEditorManager({
        container: '#tabContainer'
    });

    // 初始化文档树
    window.documentTree = new DocumentTreeManager('#documentTree', documentTreeData);

    // 默认展开所有节点
    window.documentTree.expandAll();
    async function initHMAuth() {
        var aiServer;
        var protocol = window.location.protocol;
        if (/locale|127.0.0.1/.test(window.location.host)) {
            aiServer = protocol + '//172.16.3.51';
        } else {
            aiServer = protocol + '//' + window.location.host;
        }
        // 定义认证信息
        var autherEntity = {
            aiServer: aiServer,
            autherKey: 'D7928B9182ABF6E0A6A6EBB71B353585',
            userGuid: '',
            userName: '',
            doctorGuid: 'hmpm',
            serialNumber: '',
            department: '', //科室（如"妇产科"，"儿科"）
            doctorName: '', //医生名字
            hospitalGuid: '', //自定义非必要字段
            hospitalName: '', //自定义非必要字段
            customEnv: '1',
            flag: 'm'
        };

        // 使用Promise处理认证初始化
        const mayson = await HMEditorLoader.initAutherEntity(autherEntity);
        window.mayson = mayson;
    };
    initHMAuth(); // 初始化认证
    // 绑定按钮事件
    $('#btnAddTab').on('click', function () {
        // 显示文档信息输入对话框
        $('.documentInfo').show();

        // 如果当前没有标签页，自动选中"在新标签中打开"选项
        if (!window.tabManager.currentTabId) {
            $('#openInNewTab').prop('checked', true);
        } else {
            $('#openInNewTab').prop('checked', false);
        }
    });

    // 确认文档信息
    $('#btnConfirmDoc').on('click', async function () {
        const textContent = $('.documentInfo textarea').val();
        let content = null;

        if (textContent) {
            try {
                content = JSON.parse(textContent);
            } catch (e) {
                alert('输入的内容不是有效的JSON格式！');
                return;
            }
        }

        // 检查是否需要在新标签中打开
        const openInNewTab = $('#openInNewTab').is(':checked');

        // 如果已经有打开的标签页且不需要在新标签中打开，则直接设置内容
        if (window.tabManager.currentTabId && !openInNewTab && content) {
            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocContent(content);
        } else {
            // 否则创建新标签页
            const title = '文档 ' + (window.tabManager.tabCounter + 1);
            await window.tabManager.createTab(title, {}, content);
        }

        // 隐藏对话框并清空输入
        $('.documentInfo').hide();
        $('.documentInfo textarea').val('');
        $('#openInNewTab').prop('checked', false); // 重置复选框状态
    });

    // 取消文档信息
    $('#btnCancelDoc').on('click', function () {
        $('.documentInfo').hide();
        $('.documentInfo textarea').val('');
        $('#openInNewTab').prop('checked', false); // 重置复选框状态

        // 如果还没有标签页，则创建一个空白标签页
        if (!window.tabManager.currentTabId) {
            const title = '文档 ' + (window.tabManager.tabCounter + 1);
            window.tabManager.createTab(title);
        }
    });

    // 快速输入链接点击事件
    $('.quick-links .quick-link-loadDoc').on('click', function () {
        const filePath = $(this).data('file');

        // 显示加载中状态
        const $textarea = $('.documentInfo textarea');
        console.debug('加载中...');

        // 如果当前没有标签页，自动选中"在新标签中打开"选项
        if (!window.tabManager.currentTabId) {
            $('#openInNewTab').prop('checked', true);
        }

        // 加载JSON文件
        $.getJSON(filePath)
            .done(function (data) {
                // 将JSON内容格式化显示在文本框中
                $textarea.val(JSON.stringify(data, null, 2));
            })
            .fail(function (jqxhr, textStatus, error) {
                // 加载失败
                console.error('加载JSON文件失败:', error);
            });
    });

    // 打开模板文件点击事件
    $('#loadTemplateFile').on('click', function (e) {
        e.preventDefault();
        // 触发文件选择框
        $('#templateFileInput').click();
    });

    // 文件选择变更事件
    $('#templateFileInput').on('change', function (e) {
        const file = e.target.files[0];
        if (!file) {
            // 用户取消了文件选择，清空文件选择框
            $('#templateFileInput').val('');
            return;
        }

        // 显示加载中状态
        const $textarea = $('.documentInfo textarea');
        const originalText = $textarea.val(); // 保存原始文本
        $textarea.val('加载中...');

        // 如果当前没有标签页，自动选中"在新标签中打开"选项
        if (!window.tabManager.currentTabId) {
            $('#openInNewTab').prop('checked', true);
        }

        // 读取文件内容
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const fileContent = event.target.result;

                // 构建JSON对象
                const templateJson = [{
                    "code": "template" + new Date().getTime(),
                    "docContent": fileContent,
                    "data": []
                }];

                // 将构建的JSON显示在文本框中
                $textarea.val(JSON.stringify(templateJson, null, 2));
            } catch (error) {
                // 处理失败时恢复原始文本
                $textarea.val(originalText);
                console.error('文件处理失败:', error);
                alert('文件处理失败: ' + error.message);
            }

            // 清空文件选择，以便下次选择同一文件时能够触发change事件
            $('#templateFileInput').val('');
        };

        reader.onerror = function (error) {
            // 读取失败时恢复原始文本
            $textarea.val(originalText);
            $('#templateFileInput').val('');
            console.error('文件读取失败:', error);
            alert('文件读取失败');
        };

        // 以文本方式读取文件
        try {
            reader.readAsText(file);
        } catch (error) {
            // 读取失败时恢复原始文本
            $textarea.val(originalText);
            $('#templateFileInput').val('');
            console.error('文件读取失败:', error);
            alert('文件读取失败');
        }
    });

    //自定义菜单
    $('#btnMenu').on('click', async function () {
        $('.customMenuDialog #customMenuJson').val(
`[
    {
        "name": "customMenu",
        "label": "自定义菜单1",
        "onExec": function () {
            showAlertDialog('自定义菜单1被执行了!');
            return;
        }
    }
]`
        );
        $('.customMenuDialog').show();
    });
    //只读模式
    $('#btnReadOnly').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('只读模式');
            return;
        }
        // 重置弹窗状态
        $('#readOnlyCode').val('');
        $('#readOnlyFlag').prop('checked', true);
        $('.readOnlyDialog').show();
    });
    //修订模式
    $('#btnRevise').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('修订模式');
            return;
        }
        // 显示修订模式弹框
        $('.reviseDialog').show();
    });

    // 开关按钮样式变化
    $('.switch-flag').on('change', function () {
        const slider = $(this).siblings('.slider');
        const sliderCircle = slider.find('.slider-circle');
        const labelText = $(this).closest('label').find('.switch-label-text');
        if (this.checked) {
            slider.css('background-color', '#4CAF50');
            sliderCircle.css('transform', 'translateX(26px)');
            labelText.text('启用');
        } else {
            slider.css('background-color', '#ccc');
            sliderCircle.css('transform', 'translateX(0)');
            labelText.text('关闭');
        }
    });

    // 确认设置修订模式
    $('#btnConfirmRevise').on('click', async function () {
        try {
            const isReviseMode = $('#reviseFlag').is(':checked');
            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocReviseMode(isReviseMode);

            // 隐藏对话框
            $('.reviseDialog').hide();

            // 显示操作结果
            // alert(isReviseMode ? '已开启修订模式' : '已关闭修订模式');
        } catch (e) {
            console.error('设置修订模式失败:', e);
            alert('设置修订模式失败: ' + e.message);
        }
    });

    // 取消设置修订模式
    $('#btnCancelRevise').on('click', function () {
        $('.reviseDialog').hide();
    });

    $('#btnCloseTab').on('click', function () {
        if (window.tabManager.currentTabId) {
            window.tabManager.closeTab(window.tabManager.currentTabId);
        } else {
            alert('没有激活的标签页');
        }
    });

    // 设置数据按钮
    $('#btnSetData').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('设置数据');
            return;
        }
        // 设置数据元示例数据
        $('.dataInputDialog textarea').val(JSON.stringify([{
            code: 'DOC001',
            data: [{
                    keyCode: '',
                    keyValue: ''
                },
                {
                    keyCode: '',
                    keyValue: ['诊断1']
                }
            ]
        }], null, 2));
        $('.dataInputDialog').show();
    });

    // 确认设置数据
    $('#btnConfirmData').on('click', async function () {
        const textContent = $('.dataInputDialog textarea').val();
        if (!textContent) {
            alert('请输入数据');
            return;
        }

        try {
            const dataJson = JSON.parse(textContent);
            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocData(dataJson);
            $('.dataInputDialog').hide();
            $('.dataInputDialog textarea').val('');
        } catch (e) {
            alert('JSON格式错误: ' + e.message);
        }
    });

    // 取消设置数据
    $('#btnCancelData').on('click', function () {
        $('.dataInputDialog').hide();
        $('.dataInputDialog textarea').val('');
    });

    // ==================== 光标处插入数据相关代码 ====================
    // 光标处插入数据按钮点击事件
    $('#btnInsertDataAtCursor').click(function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('光标处插入数据');
            return;
        }
        $('.insertDataAtCursorDialog').show();
    });

    // 确认插入数据
    $('#btnConfirmInsertData').on('click', async function () {
        const textContent = $('.insertDataAtCursorDialog textarea').val();
        if (!textContent) {
            alert('请输入要插入的内容');
            return;
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            editor.insertDataAtCursor(textContent);
            $('.insertDataAtCursorDialog').hide();
            $('.insertDataAtCursorDialog textarea').val('');
        } catch (e) {
            alert('插入数据失败: ' + e.message);
        }
    });

    // 取消插入数据
    $('#btnCancelInsertData').click(function () {
        $('.insertDataAtCursorDialog').hide();
        $('.insertDataAtCursorDialog textarea').val('');
    });

    async function getHtml() {
        const code = $('.getDataDialog textarea').val();
        try {
            const editor = await window.tabManager.getCurrentEditor();
            const htmlContent = await editor.getDocHtml(code);
            // 显示内容
            $('#contentTitle').text('HTML内容');
            $('#contentDisplay').val(JSON.stringify(htmlContent));
            // 显示"保存HTML原文"按钮
            $('#btnSaveHtmlRaw').removeClass('hidden');
            $('.contentDisplayDialog').show();
            closeGetDataDialog();
        } catch (e) {
            console.error('获取HTML失败:', e);
            alert('获取HTML失败: ' + e.message);
        }
    }
    async function getText() {
        const code = $('.getDataDialog textarea').val();
        try {
            const editor = await window.tabManager.getCurrentEditor();
            const textContent = await editor.getDocText(code);

            // 显示内容
            $('#contentTitle').text('Text内容');
            $('#contentDisplay').val(JSON.stringify(textContent));
            // 隐藏"保存HTML原文"按钮
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
            closeGetDataDialog();
        } catch (e) {
            console.error('获取Text失败:', e);
            alert('获取Text失败: ' + e.message);
        }
    }
    async function getData() {
        var _val = $('.getDataDialog textarea').val();
        try {
            var params = {};
            if (_val) {
                try {
                    params = JSON.parse(_val);
                } catch (e) {
                    alert('输入的JSON格式不正确，请检查格式！');
                    return;
                }
            }
            var code = params.code || '';
            var keyList = params.keyList || [];
            const editor = await window.tabManager.getCurrentEditor();
            const dataContent = await editor.getDocData(code, keyList);

            // 显示内容
            $('#contentTitle').text('Data内容');
            $('#contentDisplay').val(JSON.stringify(dataContent));
            // 隐藏"保存HTML原文"按钮
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
            closeGetDataDialog();
        } catch (e) {
            console.error('获取Data失败:', e);
            alert('获取Data失败: ' + e.message);
        }
    }

    function closeGetDataDialog() {
        $('.getDataDialog').hide();
        $('.getDataDialog textarea').val('');
    }
    var flag;
    // 获取HTML文本
    $('#btnGetHtml').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('获取HTML文本');
            return;
        }
        $('.getHtmlDialog').show();
    });

    // 确认获取HTML文本
    $('#btnConfirmGetHtml').on('click', async function () {
        const code = $('.getHtmlDialog textarea').val();
        try {
            const editor = await window.tabManager.getCurrentEditor();
            const htmlContent = await editor.getDocHtml(code);
            // 显示内容
            $('#contentTitle').text('HTML内容');
            $('#contentDisplay').val(JSON.stringify(htmlContent));
            // 显示"保存HTML原文"按钮
            $('#btnSaveHtmlRaw').removeClass('hidden');
            $('.contentDisplayDialog').show();
            $('.getHtmlDialog').hide();
            $('.getHtmlDialog textarea').val('');
        } catch (e) {
            console.error('获取HTML失败:', e);
            alert('获取HTML失败: ' + e.message);
        }
    });

    // 取消获取HTML文本
    $('#btnCancelGetHtml').on('click', function () {
        $('.getHtmlDialog').hide();
        $('.getHtmlDialog textarea').val('');
    });

    $('#btnAddParamsText').on('click', function () {
        $('.getDataDialog textarea').val(JSON.stringify({
            code: "",
            keyList: [""]
        }, null, 2));
    });
    // 根据不同按钮，调用不同方法获取数据
    $('#btnGetDataByParams').on('click', function () {
        if (flag == 2) {
            getText();
        } else if (flag == 3) {
            getData();
        }
    });

    // 关闭获取数据对话框
    $('#btnGetDataClose').on('click', function () {
        closeGetDataDialog();
    });

    // 获取TEXT文本
    $('#btnGetText').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('获取TEXT文本');
            return;
        }
        var _placeholder = '请输入文档唯一编号';
        $('.getDataDialog textarea').attr('placeholder', _placeholder);
        flag = 2;
        $('#btnAddParamsText').hide(); //隐藏添加参数按钮
        $('.getDataDialog').show();
    });

    // 获取数据元Data
    $('#btnGetMetaData').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('获取数据元Data');
            return;
        }
        var _placeholder = JSON.stringify({
            code: '', // 文档唯一编号
            keyList: [] //指定数据元编码列表
        });
        $('.getDataDialog textarea').attr('placeholder', _placeholder);
        flag = 3;
        $('#btnAddParamsText').show();
        $('.getDataDialog').show();
    });
    // 复制内容
    $('#btnCopyContent').on('click', function () {
        const content = $('#contentDisplay').val();

        // 检查内容是否为空
        if (!content) {
            alert('没有内容可复制');
            return;
        }

        // 复制到剪贴板的函数
        function copyToClipboard(text) {
            return new Promise((resolve, reject) => {
                // 方法1：使用现代 Clipboard API（需要HTTPS环境）
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text)
                        .then(() => resolve('现代API复制成功'))
                        .catch(err => {
                            console.warn('现代API复制失败，尝试备用方法:', err);
                            // 如果现代API失败，尝试备用方法
                            fallbackCopyTextToClipboard(text, resolve, reject);
                        });
                } else {
                    // 如果不支持现代API，直接使用备用方法
                    fallbackCopyTextToClipboard(text, resolve, reject);
                }
            });
        }

        // 备用复制方法
        function fallbackCopyTextToClipboard(text, resolve, reject) {
            // 创建临时的textarea元素
            const textArea = document.createElement('textarea');
            textArea.value = text;

            // 设置样式使其不可见
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.style.opacity = '0';

            // 添加到DOM
            document.body.appendChild(textArea);

            try {
                // 选中文本
                textArea.focus();
                textArea.select();

                // 尝试使用execCommand复制
                const successful = document.execCommand('copy');

                if (successful) {
                    resolve('备用方法复制成功');
                } else {
                    reject(new Error('execCommand复制失败'));
                }
            } catch (err) {
                reject(err);
            } finally {
                // 清理临时元素
                document.body.removeChild(textArea);
            }
        }

        // 执行复制操作
        copyToClipboard(content)
            .then((message) => {
                console.log(message);
                alert('已复制到剪贴板');
            })
            .catch((err) => {
                console.error('复制失败:', err);
                alert('复制失败，请手动选择文本复制');

                // 复制失败时，选中文本框内容让用户手动复制
                const textarea = document.getElementById('contentDisplay');
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            });
    });



    // 保存文件
    $('#btnSaveContent').on('click', function () {
        let content = $('#contentDisplay').val();

        const contentType = 'text/plain'; // 始终使用text/plain
        const fileName = 'content_' + new Date().getTime() + '.txt'; // 使用.txt后缀

        // 创建Blob对象
        const blob = new Blob([content], {
            type: contentType
        });
        const url = URL.createObjectURL(blob);

        // 创建临时下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });

    // 保存HTML原文
    $('#btnSaveHtmlRaw').on('click', function () {
        try {
            // 获取展示的内容(JSON格式)
            const jsonContent = $('#contentDisplay').val();
            // 解析JSON
            const parsedContent = JSON.parse(jsonContent);

            // 提取HTML内容
            let htmlRaw = '';
            if (Array.isArray(parsedContent)) {
                // 处理数组格式，提取每个对象中的html字段
                for (const item of parsedContent) {
                    if (item && item.html) {
                        htmlRaw += item.html;
                    }
                }
            } else if (parsedContent && parsedContent.html) {
                // 处理单个对象格式
                htmlRaw = parsedContent.html;
            }

            if (!htmlRaw) {
                alert('未找到HTML内容');
                return;
            }

            // 创建文件名
            const fileName = 'html_raw_' + new Date().getTime() + '.html';

            // 创建Blob对象
            const blob = new Blob([htmlRaw], {
                type: 'text/html'
            });
            const url = URL.createObjectURL(blob);

            // 创建临时下载链接
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

        } catch (e) {
            console.error('保存HTML原文失败:', e);
            alert('保存HTML原文失败: ' + e.message);
        }
    });

    // 关闭内容显示
    $('#btnCloseContent').on('click', function () {
        $('.contentDisplayDialog').hide();
        $('#contentDisplay').val('');
        // 隐藏"保存HTML原文"按钮
        $('#btnSaveHtmlRaw').addClass('hidden');
    });


    // 绑定制作模板按钮事件
    $('#btnCreateTemplate').on('click', function () {
        // 显示模板参数设置对话框
        $('.templateParamDialog').show();
    });

    // 快速输入链接点击事件
    $('.quick-link-template').on('click', function () {
        const filePath = $(this).data('file');

        // 显示加载中状态
        const $textarea = $('.templateParamDialog textarea');

        // 加载JSON文件
        $.getJSON(filePath)
            .done(function (data) {
                // 将JSON内容格式化显示在文本框中
                $textarea.val(JSON.stringify(data, null, 2));
            })
            .fail(function (jqxhr, textStatus, error) {
                // 加载失败
                console.error('加载JSON文件失败:', error);
            });
    });
    // 确认模板参数设置
    $('#btnConfirmTemplateParam').on('click', async function () {
        try {
            const textContent = $('.templateParamDialog textarea').val();
            let datasources = null;

            if (textContent) {
                try {
                    datasources = JSON.parse(textContent);
                    // 检查是否包含data属性
                    if (datasources.data) {
                        console.log('从JSON中提取data属性，数据元数量:', datasources.data.length);
                        datasources = datasources.data;
                    } else {
                        console.log('JSON中不包含data属性，使用整个JSON对象作为数据元');
                    }
                    console.log('解析后的数据元数量:', (datasources || []).length);
                } catch (e) {
                    console.error('JSON解析失败:', e);
                    alert('输入的内容不是有效的JSON格式！');
                    return;
                }
            } else {
                console.log('未提供数据元内容');
            }

            // 创建新模板编辑器
            await createNewTemplate(datasources);

            // 隐藏对话框
            $('.templateParamDialog').hide();

        } catch (error) {
            console.error('创建模板失败:', error);
        }
    });

    // 取消模板参数设置
    $('#btnCancelTemplateParam').on('click', function () {
        $('.templateParamDialog').hide();
    });

    // 插入文档相关
    $('#btnInsertDoc').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('插入文档');
            return;
        }
        $('.insertDocDialog textarea').val(JSON.stringify([
            { code: '新插入文档_1', docContent: "<body><p>新插入文档_1</p></body>" },
            { code: '新插入文档_2', docContent: "<body><p>新插入文档_2</p></body>" }
        ], null, 2));
        $('.insertDocDialog').show();
    });

    $('#btnCancelInsert').on('click', function () {
        $('.insertDocDialog').hide();
    });

    $('#btnConfirmInsert').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('插入文档');
            return;
        }
        var jsonContent = $('.insertDocDialog textarea').val();
        var insertPosition = $('.insertDocDialog input').val();
        try {
            var docData = JSON.parse(jsonContent);
            const editor = await window.tabManager.getCurrentEditor();
            editor.insertDocContent(Number(insertPosition), docData);
            $('.insertDocDialog').hide();
            $('.insertDocDialog textarea').val('');
        } catch (e) {
            alert('JSON格式错误，请检查输入');
        }
    });


    /**
     * 创建新模板
     */
    async function createNewTemplate(datasources) {
        try {
            console.log('开始创建模板，数据元数量:', (datasources || []).length);

            let content = {
                "code": "template_file",
                "docContent": ""
            };

            // 创建新标签页，启用设计模式
            const result = await window.tabManager.createTab('新模板', {
                designMode: true
            }, content);

            if (datasources) {
                console.log('获取当前编辑器实例');
                const editor = await window.tabManager.getCurrentEditor();

                // 先确保编辑器实例已被日志记录器监控
                if (window.apiLogger && !editor.__hm_logged) {
                    console.log('确保编辑器实例被API日志记录器监控');
                    window.apiLogger.hookEditorInstance(editor);
                }

                // 如果编辑器有setTemplateDatasource方法则调用
                if (typeof editor.setTemplateDatasource === 'function') {
                    console.log('调用编辑器的setTemplateDatasource方法');
                    // 确保异步调用以便被日志记录器捕获
                    setTimeout(() => {
                        editor.setTemplateDatasource(datasources);
                    }, 100);
                } else {
                    console.error('编辑器实例上不存在setTemplateDatasource方法');
                }
            }

            return result;
        } catch (error) {
            console.error('创建模板失败:', error);
            throw error;
        }
    }


    $('#btnExportPdf').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('下载PDF');
            return;
        }
        const editor = await window.tabManager.getCurrentEditor();
        editor && editor.downloadPdf();
    });

    // 设置水印按钮点击事件
    $('#btnWatermark').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('设置水印');
            return;
        }
        // 重置表单状态
        $('#watermarkType').val('1');
        $('#watermarkText').val('');
        $('#watermarkImageFile').val('').removeData('base64');
        $('#watermarkFontSize').val('16');
        $('#watermarkOpacity').val('0.3');
        $('#watermarkColor').val('#cccccc');
        $('#watermarkRotation').val('-45');
        $('#watermarkHeight').val('100');
        $('#watermarkColumns').val('3');
        $('#watermarkShowInPrint').prop('checked', true);
        $('#watermarkImagePreview').hide();
        $('#watermarkImagePlaceholder').show();
        toggleWatermarkInputs('1');
        $('.setWatermarkDialog').show();
    });

    // 水印类型切换事件
    $('#watermarkType').on('change', function () {
        const watermarkType = $(this).val();
        toggleWatermarkInputs(watermarkType);
    });

    // 切换水印输入控件显示/隐藏
    function toggleWatermarkInputs(type) {
        if (type === '1') {
            // 文本水印
            $('.watermark-text-group').show();
            $('.watermark-image-group').hide();
            $('#watermarkText').val('文字水印');
        } else if (type === '2') {
            // 图片水印
            $('.watermark-text-group').hide();
            $('.watermark-image-group').show();
        }
    }

    // 图片文件选择事件
    $('#watermarkImageFile').on('change', function (e) {
        const file = e.target.files[0];
        if (!file) {
            // 清空预览
            $('#watermarkImagePreview').hide();
            $('#watermarkImagePlaceholder').show();
            return;
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            $(this).val('');
            return;
        }

        // 验证文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片文件大小不能超过2MB');
            $(this).val('');
            return;
        }

        // 读取文件并转换为base64
        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Data = event.target.result;

            // 显示预览
            $('#watermarkImagePreview').attr('src', base64Data).show();
            $('#watermarkImagePlaceholder').hide();

            // 存储base64数据到隐藏属性
            $('#watermarkImageFile').data('base64', base64Data);
        };

        reader.onerror = function () {
            alert('图片读取失败');
            $(this).val('');
        };

        reader.readAsDataURL(file);
    });

    // 确认设置水印
    $('#btnConfirmWatermark').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('确认设置水印');
            return;
        }
        const watermarkType = $('#watermarkType').val();
        const fontSize = $('#watermarkFontSize').val();
        const opacity = $('#watermarkOpacity').val();
        const color = $('#watermarkColor').val();
        const rotation = $('#watermarkRotation').val();
        const height = $('#watermarkHeight').val();
        const columns = $('#watermarkColumns').val();
        const showInPrint = $('#watermarkShowInPrint').is(':checked');

        let watermarkConfig = {
            watermarkType: watermarkType,
            watermarkImg: '',
            watermarkText: '',
            watermarkFontColor: color ? color : '#000000',
            watermarkFontSize: fontSize ? parseInt(fontSize) : 14,
            watermarkAlpha: opacity ? parseFloat(opacity) : 0.3,
            watermarkAngle: rotation ? parseInt(rotation) : 15,
            watermarkHeight: height ? parseInt(height) : 100,
            watermarkColumn: columns ? parseInt(columns) : 3,
            watermarkPrint: showInPrint
        };

        if (watermarkType === '1') {
            // 文本水印
            const watermarkText = $('#watermarkText').val();
            if (!watermarkText) {
                alert('请输入水印文本');
                return;
            }
            watermarkConfig.watermarkText = watermarkText;
            watermarkConfig.color = color || '#cccccc';
        } else if (watermarkType === '2') {
            // 图片水印
            const base64Data = $('#watermarkImageFile').data('base64');
            if (!base64Data) {
                alert('请选择水印图片');
                return;
            }
            watermarkConfig.watermarkImg = base64Data;
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            // 调用编辑器的设置水印方法
            if (typeof editor.setDocWatermark === 'function') {
                editor.setDocWatermark(watermarkConfig);
            } else {
                console.warn('编辑器不支持setWatermark方法');
            }
            // 隐藏对话框并清空输入
            resetWatermarkDialog();
        } catch (e) {
            console.error('设置水印失败:', e);
            alert('设置水印失败: ' + e.message);
        }
    });

    // 取消设置水印
    $('#btnCancelWatermark').on('click', function () {
        resetWatermarkDialog();
    });

    // 重置水印对话框
    function resetWatermarkDialog() {
        $('.setWatermarkDialog').hide();
        $('#watermarkType').val('1');
        $('#watermarkText').val('文字水印');
        $('#watermarkImageFile').val('').removeData('base64');
        $('#watermarkFontSize').val('16');
        $('#watermarkOpacity').val('0.3');
        $('#watermarkColor').val('#cccccc');
        $('#watermarkRotation').val('-45');
        $('#watermarkHeight').val('100');
        $('#watermarkColumns').val('3');
        $('#watermarkShowInPrint').prop('checked', true);
        $('#watermarkImagePreview').hide();
        $('#watermarkImagePlaceholder').show();
        toggleWatermarkInputs('1');
    }

    // 光标处插入图片按钮点击事件
    $('#btnInsertImageAtCursor').click(function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('光标处插入图片');
            return;
        }
        $('.insertImageAtCursorDialog').show();
    });

    // 取消插入图片
    $('#btnCancelInsertImage').click(function () {
        $('.insertImageAtCursorDialog').hide();
    });

    // 确认插入图片
    $('#btnConfirmInsertImage').click(async function () {
        const imageUrl = $('#imageUrl').val();
        const imageWidth = $('#imageWidth').val();
        const imageHeight = $('#imageHeight').val();

        if (!imageUrl || imageUrl.indexOf('data:image/') != 0) {
            alert('请输入图片的base64数据');
            return;
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();

            // 调用新的插入图片方法
            editor.insertImageAtCursor({
                src: imageUrl,
                width: imageWidth ? parseInt(imageWidth) : '',
                height: imageHeight ? parseInt(imageHeight) : ''
            });

            // 清空输入框并隐藏对话框
            $('#imageUrl').val('');
            $('#imageWidth').val('');
            $('#imageHeight').val('');
            $('.insertImageAtCursorDialog').hide();
        } catch (e) {
            alert('插入数据失败: ' + e.message);
        }
    });

    //自定义菜单演示弹框
    $('#customMenuCancelBtn').on('click', function() {
        $('.customMenuDialog').hide();
    });
    $('#customMenuOkBtn').on('click', async function() {
        try {
            const val = $('#customMenuJson').val();
            // 加括号，兼容多行 function
            let menuArr = eval('(' + val + ')');
            const editor = await window.tabManager.getCurrentEditor();
            editor.addCustomMenu(menuArr);
            showAlertDialog('自定义菜单已注册，可右键编辑区查看。');
            $('.customMenuDialog').hide();
        } catch (e) {
            showAlertDialog('JSON/JS格式错误或onExec函数有误！');
        }
    });

    // ==================== 只读模式弹窗相关代码 ====================
    // 确认设置只读模式
    $('#btnConfirmReadOnly').on('click', async function () {
        try {
            const code = $('#readOnlyCode').val().trim();
            const isReadOnly = $('#readOnlyFlag').is(':checked');

            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocReadOnly(code, isReadOnly);

            // 隐藏对话框并清空输入
            $('.readOnlyDialog').hide();
            $('#readOnlyCode').val('');
            $('#readOnlyFlag').prop('checked', true);

            // // 显示操作结果
            // const codeText = code ? `病历编码: ${code}` : '所有文档';
            // const statusText = isReadOnly ? '已设置为只读模式' : '已取消只读模式';
            // alert(`${codeText} ${statusText}`);

        } catch (e) {
            console.error('设置只读模式失败:', e);
            alert('设置只读模式失败: ' + e.message);
        }
    });

    // 取消设置只读模式
    $('#btnCancelReadOnly').on('click', function () {
        $('.readOnlyDialog').hide();
        $('#readOnlyCode').val('');
        $('#readOnlyFlag').prop('checked', true);
    });

    // ==================== 质控提醒相关代码 ====================
    // 质控提醒按钮点击事件
    $('#btnHmAiQc').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('质控提醒');
            return;
        }
        // 重置弹窗状态
        $('.hmAiQcDialog textarea').val('');
        $('.hmAiQcDialog').show();
    });

    // 快速载入质控参数链接点击事件
    $('.quick-link-hmAi').on('click', function () {
        const params = {
            "userGuid": "201787",
            "serialNumber": "100003001",
            "caseNo": "100003",
            "currentBedCode": "+002",
            "patientName": "朱**",
            "doctorGuid": "362851",
            "doctorName": "李**",
            "admissionTime": "2024-01-03 16:30:11",
            "inpatientDepartment": "综合内科组",
            "inpatientArea": "内科病区",
            "inpatientDepartmentId": "18",
            "divisionId": "250302",
            "pageSource": "2",
            "openInterdict": 0,
            "triggerSource": 1,
            "patientInfo": {
                "gender": "女",
                "birthDate": "1996-11-02",
                "age": "27",
                "ageType": "岁",
                "maritalStatus": 1,
                "pregnancyStatus": 0
            },
            "progressNoteList": [{
                "progressGuid": "036a56f67e704e68bc44cc2c93b07353",
                "progressType": 10,
                "progressTypeName": "出院记录",
                "progressTitleName": "base.guangdong_jy.250302-250302.出院记录@V102",
                "recordTime": 1741146266109,
                "doctorGuid": "15648",
                "doctorName": "蒋**",
                "msgType": 0,
                "progressMessage": "​​********人民医院​出院记录姓名：​​朱** ​科室：​​内科病区​(​​综合内科组​)床位号：​​+002​住院号：​​100003001​姓名：​​朱** ​入院日期：​2024-01-03 16:30​性别：​​女​出院日期：​​​年龄：​​27岁​住院天数：​​​住院天数​天​　　入院情况：患者因​​​主诉​入院，​​现病史情况：​​患者于1996年起，每年春季 出现 咳嗽咳痰。给予抗感染、止咳祛痰治疗后好转。每年冬季转冷后，间断出现咳嗽，气急伴胸闷。给予沙丁胺醇气雾剂病情好转。每年发作1-2次，严重时于外院门诊输液治疗（具体用药不详）。于2014年起，每次发作时病情时间延长，并伴有心悸、胸闷、下肢浮肿。自行复用氨茶碱片2片，3次/天。患者自发病以来，神清，精神可，睡眠可，二便正常，体重无明显下降。​​，入院后查体：​​T：​​36​​℃，P：​​80​​次/分，R：​​20​​次/分，BP：​​130​​/​​80​​​mmHg，体重：​​60​​kg，指脉氧：​​98​​%​​，辅助检查​​WBC：5.99*10^9/L​​：​​​。　　入院诊断：​​支气管哮喘，睡眠障碍、支气管哮喘急性发作（中度）​　　诊断依据：​​​诊断依据​　　诊疗经过：​​患者入院后行抗炎、平喘、止咳等治疗，后患者病情较前明显好转。​　　出院诊断：​​​支气管哮喘，睡眠障碍​​　　手术名称：​​​手术名称​　　出院情况：​​​​​​　　出院医嘱：​​门诊定期复查。​　　主要治疗措施：​​​治疗方案​　　出院医嘱：​​门诊定期复查。​　　复诊时间：时间地点复诊目的科室　上级医师：​​上级医师签名​　医师：​​蒋** 记录时间：​​2025-03-05​​第 页 "
            }]
        };

        // 将参数格式化显示在文本框中
        $('.hmAiQcDialog textarea').val(JSON.stringify(params, null, 2));
    });

    // 确认执行质控提醒
    $('#btnConfirmHmAi').on('click', async function () {
        const textContent = $('.hmAiQcDialog textarea').val();
        let params = {};
        if (textContent) {
            try {
                params = JSON.parse(textContent);
            } catch (e) {
                alert('输入的JSON格式不正确，请检查格式！');
                return;
            }
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            // 调用hmAi.qc方法
            editor.hmAi.qc(params);

            // 隐藏对话框并清空输入
            $('.hmAiQcDialog').hide();
            $('.hmAiQcDialog textarea').val('');

            alert('质控提醒已启动');
        } catch (e) {
            console.error('质控提醒失败:', e);
            alert('质控提醒失败: ' + e.message);
        }
    });

    // 取消质控提醒
    $('#btnCancelHmAi').on('click', function () {
        $('.hmAiQcDialog').hide();
        $('.hmAiQcDialog textarea').val('');
    });

    updateDestroyEditorBtnState();
    // 标签切换时也更新
    const origActivateTab = window.tabManager.activateTab.bind(window.tabManager);
    window.tabManager.activateTab = function(tabId) {
        origActivateTab(tabId);
        updateDestroyEditorBtnState();
    };
    // 关闭标签页后也更新
    const origCloseTab = window.tabManager.closeTab.bind(window.tabManager);
    window.tabManager.closeTab = function(tabId) {
        origCloseTab(tabId);
        updateDestroyEditorBtnState();
    };
    // 新建标签页后也更新
    const origCreateTab = window.tabManager.createTab.bind(window.tabManager);
    window.tabManager.createTab = async function(...args) {
        const result = await origCreateTab(...args);
        updateDestroyEditorBtnState();
        return result;
    };

    // 树收起/展开切换图标
    $('.tree-header').on('click', function() {
        var $icon = $(this).find('.tree-icon');
        if ($(this).hasClass('collapsed')) {
            $(this).removeClass('collapsed');
            $icon.removeClass('fa-folder').addClass('fa-folder-open');
        } else {
            $(this).addClass('collapsed');
            $icon.removeClass('fa-folder-open').addClass('fa-folder');
        }
    });
});

/**
 * 通用弹框：编辑器未打开时的友好提示
 * @param {string} btnName 触发按钮名称
 * @param {function} onLoadDoc 点击"去加载文档"回调，可选
 */
function showEditorNotOpenDialog(btnName, onLoadDoc) {
    $('#editorNotOpenDialog').remove();
    var html = `
    <div id="editorNotOpenDialog" style="position:fixed;z-index:9999;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:10px;box-shadow:0 2px 16px rgba(0,0,0,0.15);padding:32px 36px;min-width:340px;max-width:90vw;">
        <div style="font-size:18px;font-weight:600;margin-bottom:12px;color:#333;">温馨提示</div>
        <div style="font-size:15px;color:#555;line-height:1.7;margin-bottom:24px;">
          您选择的接口 <span style='color:#1976d2;font-weight:500;'>"${btnName}"</span> 需要在编辑器打开时才能使用。<br>
          请通过点击左侧病历文档列表或上方加载文档按钮来打开编辑器。
        </div>
        <div style="text-align:right;">
          <button id="goLoadDocBtn" style="background:#1976d2;color:#fff;border:none;border-radius:4px;padding:6px 18px;font-size:15px;margin-right:12px;cursor:pointer;">去加载文档</button>
          <button id="cancelEditorNotOpenBtn" style="background:#f5f5f5;color:#333;border:none;border-radius:4px;padding:6px 18px;font-size:15px;cursor:pointer;">取消</button>
        </div>
      </div>
    </div>`;
    $(document.body).append(html);
    $('#goLoadDocBtn').on('click', function() {
        $('#editorNotOpenDialog').remove();
        if (typeof onLoadDoc === 'function') {
            onLoadDoc();
        } else {
            // 自动触发"加载文档"按钮点击
            var $btn = $('#btnAddTab');
            if ($btn.length) $btn[0].click();
        }
    });
    $('#cancelEditorNotOpenBtn').on('click', function() {
        $('#editorNotOpenDialog').remove();
    });
}

function updateDestroyEditorBtnState() {
    var $btn = $('#btnCloseTab');
    if (!window.tabManager || !window.tabManager.currentTabId) {
        $btn.prop('disabled', true).css({
            'background': '#ccc',
            'color': '#888',
            'border-color': '#ccc',
            'cursor': 'not-allowed'
        });
    } else {
        $btn.prop('disabled', false).css({
            'background': '',
            'color': '',
            'border-color': '',
            'cursor': ''
        });
    }
}

// 通用alert弹框，只有一个确认按钮
function showAlertDialog(msg, onOk) {
    $('#customAlertMsg').text(msg);
    $('#customAlertDialog').css('display', 'flex');
    $('#alertOkBtn').off('click').on('click', function() {
        $('#customAlertDialog').hide();
        if (typeof onOk === 'function') onOk();
    });
}
