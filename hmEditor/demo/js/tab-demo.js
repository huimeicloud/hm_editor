/**
 * HM Editor 标签页 Demo
 * 该脚本实现标签页和多编辑器的创建和管理
 */

// 全局变量：存储最后点击的文档信息
window.lastClickedDocCode = '';

/** 创建编辑器后注册：列表表格点「+」自动绑定行数据 */
function registerDemoOnTableRowAdd(editor) {
    if (!editor || typeof editor.setOnTableRowAdd !== 'function') {
        return;
    }
    editor.setOnTableRowAdd('TABLE_一般护理记录单', [
        { keyCode: 'DE09.00.053.00', keyValue: '2025-10-24 10:00' },
        { keyCode: 'DE04.10.186.00', keyValue: '36.8' },
        { keyCode: 'DE04.10.265.00', keyValue: '良好' },
        { keyCode: 'DE06.00.183.00', keyValue: 'Demo 新增行赋值' },
        { keyCode: 'DE02.01.039.00.178', keyValue: '演示签名' }
    ]);
}

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
     * @param {String} serialNumber 序列号
     * @returns {Promise} 返回Promise对象
     */
    async createTab(title, editorOptions = {}, content = null, docParam = {}) {
        // console.log('docParam', docParam)
        this.tabCounter++;
        const tabId = 'tab_' + this.tabCounter;
        const editorId = 'editor_' + this.tabCounter;

        // 创建标签和内容容器
        const tabItem = $(`<div class="tab-item" data-id="${tabId}" data-serial-number="${docParam.serialNumber || ''}">${title}<span class="tab-close-btn">×</span></div>`);
        const tabContent = $(`<div class="tab-content" data-id="${tabId}" data-name="${title.trim()}" data-record-name="${docParam.recordName || ''}" data-serial-number="${docParam.serialNumber || ''}"><div id="${editorId}" class="editor-container"></div></div>`);

        // 添加标签和内容
        this.tabHeader.append(tabItem);
        this.tabContents.append(tabContent);

        // 创建编辑器
        try {
            const mergedOptions = Object.assign({}, {
                container: `#${editorId}`,
                id: editorId,
                style: {
                    width: '100%',
                    height: '100%',
                    border: '1px solid #ddd'
                },
                readOnly: false,
                editorConfig: {
                    contentsCss: [],
                    // enableContextMenu:false
                },
                editShowPaddingTopBottom: true,
                // customToolbar: [ // 自定义工具栏按钮
                //     {
                //         name: 'customButton',
                //         label: '自定义按钮名称',
                //         icon: '/path/to/icon.png',
                //         position: { groupIndex: 1, itemIndex: 5, createNewGroup: false },
                //         onExec: function (editor) {
                //             // 点击按钮时执行的代码
                //             console.log('自定义按钮被点击了');
                //         }
                //     }
                // ]
            }, editorOptions);
            // 存储编辑器实例
            this.editors[tabId] = {
                tabId: tabId,
                editorId: editorId,
                designMode: editorOptions.designMode || false
            };

            // 创建编辑器
            const editorInstance = await HMEditorLoader.createEditorAsync(mergedOptions);
            if ($('#enableOnTableRowAdd').is(':checked')) {
                registerDemoOnTableRowAdd(editorInstance);
            }
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

            // 显示新标签
            this.activateTab(tabId);

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

        // 获取当前标签页的serialNumber
        const $currentTab = this.tabHeader.find(`.tab-item[data-id="${tabId}"]`);
        const serialNumber = $currentTab.data('serial-number') || '';

        // 根据serialNumber状态控制AI相关按钮
        controlAiButtons(serialNumber != '001');

        // 检查当前tab是否为设计模式，控制插入数据元按钮
        updateInsertDataElementBtnState();

        // 自动滚动tab-header，使新tab可见
        setTimeout(() => {
            this.scrollTabIntoView(tabId);
        }, 0);

        // 切换tab时，更新window.lastClickedDocCode为当前页签中第一个widget的code
        this.updateLastClickedDocCodeFromCurrentTab(tabId);
    }
    scrollTabIntoView(tabId) {
        const $tabHeader = this.tabHeader;
        const $newTab = $tabHeader.find(`.tab-item[data-id="${tabId}"]`);
        if ($newTab.length) {
            // 计算新tab相对tab-header的偏移
            const tabLeft = $newTab.position().left;
            const tabWidth = $newTab.outerWidth(true);
            const headerScroll = $tabHeader.scrollLeft();
            const headerWidth = $tabHeader.width();

            // 如果新tab超出右侧，则滚动到新tab
            if (tabLeft + tabWidth > headerWidth) {
                $tabHeader.animate({
                    scrollLeft: headerScroll + (tabLeft + tabWidth - headerWidth)
                }, 200);
            }
            // 如果新tab超出左侧，则滚动到新tab
            else if (tabLeft < 0) {
                // 让tab正好贴到左侧
                const absoluteLeft = $newTab.offset().left - $tabHeader.offset().left + headerScroll - 50;
                $tabHeader.animate({
                    scrollLeft: absoluteLeft
                }, 200);
            }
        }
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
     * 从当前tab中获取第一个widget的code并更新window.lastClickedDocCode
     * @param {String} tabId 标签页ID
     */
    async updateLastClickedDocCodeFromCurrentTab(tabId) {
        try {
            // 获取当前tab的编辑器实例
            const tabObj = this.editors[tabId];
            if (!tabObj || !tabObj.editor) {
                console.log('Tab切换：未找到编辑器实例');
                return;
            }

            const editor = tabObj.editor;
            if (!editor.editor || !editor.editor.document) {
                console.log('Tab切换：编辑器文档未准备好');
                return;
            }

            // 获取编辑器body
            const $body = $(editor.editor.document.getBody().$);

            // 查找第一个widget
            const $firstWidget = $body.find('div[data-hm-widgetid]').first();

            if ($firstWidget.length > 0) {
                const widgetId = $firstWidget.attr('data-hm-widgetid').trim();

                // 更新全局变量
                window.lastClickedDocCode = widgetId;

                console.log('Tab切换：更新lastClickedDocCode为第一个widget的code:', widgetId);
            } else {
                console.log('Tab切换：未找到widget元素');
            }
        } catch (error) {
            console.error('Tab切换：更新lastClickedDocCode失败:', error);
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
                // 没有标签时，禁用插入数据元按钮
                updateInsertDataElementBtnState();
            }
        }
        if (this.tabHeader.find('.tab-item').length == 0) {
            window.mayson && window.mayson.closeIntellPanel();
            $('.smart-remind-content').show();
            $('#btnExpand').click();
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
        window.lastClickedDocCode = docCode;
        const docPath = $node.find('.doc-name').attr('title');
        const docName = $node.find('.doc-name').text();

        console.log('选中文档节点:', {
            docCode: docCode,
            docPath: docPath,
            docName: docName
        });

        // 通过docCode查找节点获取serialNumber，同时在两个数据源中查找
        let node = findNodeByDocCode(docCode, window.documentTreeData);
        if (!node) {
            node = findNodeByDocCode(docCode, window.aiDocumentTreeData);
        }
        const serialNumber = node ? node.serialNumber : '';

        const docParams = [{
            "code": docCode,
            "docTplName": docName,
            "docContent": "",
            "serialNumber": serialNumber,
            "recordName": node.recordName || ''
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
                    showAlertDialog(`加载文档内容失败: ${docPath}\n错误: ${textStatus}`);
                });
        } else {
            console.log('节点没有有效的文档路径');
        }
    }

    // 文档加载完成后的处理方法
    async onDocumentLoaded(docParam) {
        // console.log('文档加载完成:', docParam);
        const title = docParam[0].docTplName;
        // const serialNumber = docParam[0].serialNumber || '';
        await window.tabManager.createTab(title, {}, docParam, docParam[0]);
        console.log('文档打开完成:=======', title);
        if (this.container.attr('id') == 'aiDocumentTree') {
            // 如果是AI病历列表，则AI认证
            // 显示加载遮罩
            const loadingMask = $('<div class="loading-mask" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:9999;display:flex;justify-content:center;align-items:center;"><div style="background:#fff;padding:20px;border-radius:4px;font-size:16px;">加载中...</div></div>');
            // $('body').append(loadingMask);

            // 创建tab后移除遮罩
            const removeMask = function () {
                loadingMask.remove()
            };
            // console.log('调用initAiAuth，docCode:', docParam[0].code);
            await initAiAuth(docParam[0].code);
            // console.log('initAiAuth执行完成');
            removeMask();
        }

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
    const inAuthSerialNumber = ['S2VPWB3391943', 'S2VT794334788', 'S2VTOMT739144', 'S2W0MMZ611031', 'S2W30YS290548', 'S2W6JMO856722', 'S2WBSDM981989', 'S2WDU6T614595', 'S2WE36F582881']; // AI病历序列号列表
    // 页面加载完成，自动计算assistant-panel高度，自动生成时需要高度
    function autoAssistantPanelHeight() {
        var headerHeight = $('.assistant-header').outerHeight() || 0;
        var panelHeight = $('.assistant-block').height() || 0;
        $('.assistant-panel').height(panelHeight - headerHeight);
    }
    autoAssistantPanelHeight();
    // 窗口大小变化时重新计算
    $(window).on('resize', function () {
        autoAssistantPanelHeight();
    });
    // 获取URL中的ai参数
    const urlParams = new URLSearchParams(window.location.search);
    const ai = urlParams.get('ai');
    if (ai == 1) {
        $('.assistant-float-tab-btn[data-tab="smart"]').show();
    }
    if (ai == 99) {
        $('.assistant-float-tab-btn[data-tab="ai"]').show();
    }
    // 初始化标签页管理器
    window.tabManager = new TabEditorManager({
        container: '#tabContainer'
    });

    // 初始化文档树
    window.documentTree = new DocumentTreeManager('#documentTree', documentTreeData);
    window.aiDocumentTree = new DocumentTreeManager('#aiDocumentTree', aiDocumentTreeData);

    // 默认展开所有节点
    window.documentTree.expandAll();
    window.aiDocumentTree.expandAll();

    // 自动打开当前激活tab的第一份文档
    autoOpenFirstDocument();

    // 初始化工具栏快捷键控制
    initToolbarShortcuts();

    // 页面加载时默认隐藏工具栏（因为默认选中AI病历演示tab）
    hideBtnPanel();
    // 显示工具栏切换按钮
    $('#toolbarToggleBtn').show();
    // 设置切换按钮图标为向下（表示可以展开）
    $('#toolbarToggleBtn i').removeClass('fa-caret-up').addClass('fa-caret-down');
    // 页面加载时默认启用AI按钮（因为默认选中AI病历演示tab）
    controlAiButtons(true);

    // 添加tab切换逻辑
    $('.tree-tab').on('click', function () {
        const tabType = $(this).data('tab');

        // 关闭所有已打开的标签页
        if (window.tabManager) {
            window.tabManager.closeAllTabs();
        }

        // 移除所有活动状态
        $('.tree-tab').removeClass('active');
        $('.tree-tab-content').removeClass('active');

        // 激活当前tab
        $(this).addClass('active');
        if (tabType === 'normal') {
            $('#normalDocumentTree').addClass('active');
            // 选中"常用病历模板"时显示工具栏，显示切换按钮，禁用AI按钮
            showBtnPanel();
            $('#toolbarToggleBtn').show();
            // 设置切换按钮图标为向上（表示可以收起）
            $('#toolbarToggleBtn i').removeClass('fa-caret-down').addClass('fa-caret-up');
            controlAiButtons(false);
        } else if (tabType === 'ai') {
            $('#aiDocumentTree').addClass('active');
            // 选中"AI病历演示"时隐藏工具栏，显示切换按钮，启用AI按钮
            hideBtnPanel();
            $('#toolbarToggleBtn').show();
            // 设置切换按钮图标为向下（表示可以展开）
            $('#toolbarToggleBtn i').removeClass('fa-caret-up').addClass('fa-caret-down');
            controlAiButtons(true);
        }

        console.log('切换到', tabType === 'normal' ? '普通病历' : 'AI病历', '文档列表');

        // 切换tab后自动打开对应类列表的第一份文档
        setTimeout(() => {
            autoOpenFirstDocument();
        }, 500); // 延迟500ms确保DOM更新完成
    });

    // 工具栏切换按钮点击事件
    $('#toolbarToggleBtn').on('click', function () {
        const $btnPanel = $('#btnPanel');
        const $toggleBtn = $(this);
        const $icon = $toggleBtn.find('i');

        if ($btnPanel.is(':visible')) {
            // 隐藏工具栏
            hideBtnPanel();
            $icon.removeClass('fa-caret-up').addClass('fa-caret-down');
        } else {
            // 显示工具栏
            showBtnPanel();
            $icon.removeClass('fa-caret-down').addClass('fa-caret-up');
        }
    });

    // 根据URL参数判断AI服务器地址
    const serverParam = urlParams.get('aiServer');
    if (serverParam === 'http://172.16.8.150' || window.location.host == '127.0.0.1:3071') {
        window.aiServer = 'http://172.16.8.150';
    } else {
        window.aiServer = 'https://editor.huimei.com';
    }
    window.aiServer = 'https://editor.huimei.com';
    console.log('AI Server:', window.aiServer);

    // 绑定按钮事件
    $('#btnAddTab').on('click', function () {
        // 显示文档信息输入对话框
        $('.documentInfo').show();

        // 默认总是选中"在新标签中打开"选项
        $('#openInNewTab').prop('checked', true);
    });

    // 插入数据元按钮事件
    $('#btnInsMetaData').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('插入数据元');
            return;
        }

        // 检查当前tab是否为设计模式
        const currentTabEditor = window.tabManager.editors[window.tabManager.currentTabId];
        if (!currentTabEditor || currentTabEditor.designMode !== true) {
            showAlertDialog('只有在制作模板模式下才能插入数据元');
            return;
        }

        // 显示插入数据元信息输入对话框
        $('.insertMetaDataInfo').show();
    });

    // 定位元素按钮事件
    $('#btnFocusElement').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('定位元素');
            return;
        }

        // 显示定位元素对话框
        $('.focusElementDialog').show();
        // 默认填入当前病历编码
        try {
            const {
                docCode
            } = await getCurrentDocumentInfo();
            $('#focusDocCode').val(docCode || '');
        } catch (e) {
            $('#focusDocCode').val('');
        }
        $('#focusEleCode').val('');
        $('#focusEleContent').val('');
    });

    // 确认文档信息
    $('#btnConfirmDoc').on('click', async function () {
        const textContent = $('.documentInfo textarea').val();
        let content = null;

        if (textContent) {
            try {
                content = JSON.parse(textContent);
            } catch (e) {
                showAlertDialog('输入的内容不是有效的JSON格式！');
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

    // 确认插入数据元
    $('#btnConfirmMetaData').on('click', async function () {
        const textContent = $('.insertMetaDataInfo textarea').val();
        const autoLablebox = $('#autoLablebox').is(':checked');

        if (!textContent) {
            showAlertDialog('请输入数据元配置！');
            return;
        }

        let datasource = null;
        try {
            datasource = JSON.parse(textContent);
        } catch (e) {
            showAlertDialog('输入的内容不是有效的JSON格式！');
            return;
        }

        try {
            // 获取编辑器实例并插入数据元
            const editor = await window.tabManager.getCurrentEditor();
            if (editor && editor.insertDataSource) {
                datasource.autoLable = autoLablebox;
                editor.insertDataSource(datasource);

                // 隐藏对话框并清空输入
                $('.insertMetaDataInfo').hide();
                $('.insertMetaDataInfo textarea').val('');
            } else {
                showAlertDialog('编辑器不支持插入数据元功能');
            }
        } catch (e) {
            console.error('插入数据元失败:', e);
            showAlertDialog('插入数据元失败: ' + e.message);
        }
    });

    // 取消插入数据元
    $('#btnCancelMetaData').on('click', function () {
        $('.insertMetaDataInfo').hide();
        $('.insertMetaDataInfo textarea').val('');
    });

    // 确认定位元素
    $('#btnConfirmFocusElement').on('click', async function () {
        const docCode = $('#focusDocCode').val().trim();
        const eleCode = $('#focusEleCode').val().trim();
        const eleContent = $('#focusEleContent').val().trim();

        if (!docCode) {
            showAlertDialog('病历ID不能为空');
            return;
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            if (!editor || !editor.focusElement) {
                showAlertDialog('编辑器不支持定位元素功能');
                return;
            }
            // 隐藏对话框并清空输入
            $('.focusElementDialog').hide();
            $('#focusDocCode').val('');
            $('#focusEleCode').val('');
            $('#focusEleContent').val('');
            // 调用 focusElement 方法
            const result = editor.focusElement(docCode, eleCode || undefined, eleContent || undefined);
            if (!result) {
                showAlertDialog('定位元素失败，未找到指定文档/元素/文本内容');
            }


        } catch (e) {
            console.error('定位元素失败:', e);
            showAlertDialog('定位元素失败: ' + e.message);
        }
    });

    // 取消定位元素
    $('#btnCancelFocusElement').on('click', function () {
        $('.focusElementDialog').hide();
        $('#focusDocCode').val('');
        $('#focusEleCode').val('');
        $('#focusEleContent').val('');
    });

    // 获取光标所在数据元（getSelectedElement）
    $('#btnGetSelectedElement').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('获取选中数据元');
            return;
        }
        try {
            const editor = await window.tabManager.getCurrentEditor();
            if (!editor || typeof editor.getSelectedElement !== 'function') {
                showAlertDialog('编辑器不支持 getSelectedElement');
                return;
            }
            const meta = editor.getSelectedElement();
            $('#contentTitle').text('getSelectedElement 结果');
            $('#contentDisplay').val(
                meta === null ?
                'null（光标未落在带 data-hm-code 的数据元上，或无法解析）' :
                JSON.stringify(meta, null, 2)
            );
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
        } catch (e) {
            console.error('getSelectedElement 失败:', e);
            showAlertDialog('getSelectedElement 失败: ' + e.message);
        }
    });

    // 获取选区内容 HTML / 文本（getSelectedContent）
    $('#btnGetSelectedContent').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('获取选中内容');
            return;
        }
        try {
            const editor = await window.tabManager.getCurrentEditor();
            if (!editor || typeof editor.getSelectedContent !== 'function') {
                showAlertDialog('编辑器不支持 getSelectedContent');
                return;
            }
            const html = editor.getSelectedContent('html');
            const text = editor.getSelectedContent('text');
            $('#contentTitle').text('getSelectedContent 结果（html / text）');
            $('#contentDisplay').val(
                JSON.stringify({
                    html: html,
                    text: text
                }, null, 2)
            );
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
        } catch (e) {
            console.error('getSelectedContent 失败:', e);
            showAlertDialog('getSelectedContent 失败: ' + e.message);
        }
    });

    // 快速输入链接点击事件
    $('.quick-links .quick-link-loadDoc').on('click', function () {
        const filePath = $(this).data('file');

        // 显示加载中状态
        const $textarea = $('.documentInfo textarea');
        console.debug('加载中...');

        // 默认总是选中"在新标签中打开"选项
        $('#openInNewTab').prop('checked', true);

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

    // 快速插入数据元链接点击事件
    $('.quick-links .quick-link-metadata').on('click', function () {
        const filePath = $(this).data('file');

        // 显示加载中状态
        const $textarea = $('.insertMetaDataInfo textarea');
        console.debug('加载数据元示例中...');

        // 如果有文件路径，尝试加载JSON文件
        if (filePath) {
            $.getJSON(filePath)
                .done(function (data) {
                    // 将JSON内容格式化显示在文本框中
                    $textarea.val(JSON.stringify(data, null, 2));
                })
                .fail(function (jqxhr, textStatus, error) {
                    // 加载失败，使用内置示例
                    console.warn('加载JSON文件失败，使用内置示例:', error);
                    loadBuiltinMetadataExample($(this));
                });
        } else {
            // 没有文件路径，使用内置示例
            loadBuiltinMetadataExample($(this));
        }
    });

    // 加载内置数据元示例
    function loadBuiltinMetadataExample($link) {
        const $textarea = $('.insertMetaDataInfo textarea');
        const linkText = $link.text();

        let exampleData = {};

        if (linkText.includes('患者姓名')) {
            exampleData = {
                code: 'PATIENT_NAME',
                name: '患者姓名',
                nodeName: '纯文本'
            };
        } else if (linkText.includes('诊断信息')) {
            exampleData = {
                code: 'DIAGNOSIS',
                name: '诊断',
                nodeName: '搜索',
                searchOption: '诊断名称'
            };
        } else if (linkText.includes('下拉选项')) {
            exampleData = {
                code: 'TREATMENT_TYPE',
                name: '治疗方式',
                nodeName: '下拉',
                dictList: [{
                        description: '手术治疗',
                        val: '1'
                    },
                    {
                        description: '药物治疗',
                        val: '2'
                    },
                    {
                        description: '康复治疗',
                        val: '3'
                    },
                    {
                        description: '保守治疗',
                        val: '4'
                    }
                ]
            };
        }

        $textarea.val(JSON.stringify(exampleData, null, 2));
    }

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

        // 默认总是选中"在新标签中打开"选项
        $('#openInNewTab').prop('checked', true);

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
                showAlertDialog('文件处理失败: ' + error.message);
            }

            // 清空文件选择，以便下次选择同一文件时能够触发change事件
            $('#templateFileInput').val('');
        };

        reader.onerror = function (error) {
            // 读取失败时恢复原始文本
            $textarea.val(originalText);
            $('#templateFileInput').val('');
            console.error('文件读取失败:', error);
            showAlertDialog('文件读取失败');
        };

        // 以文本方式读取文件
        try {
            reader.readAsText(file);
        } catch (error) {
            // 读取失败时恢复原始文本
            $textarea.val(originalText);
            $('#templateFileInput').val('');
            console.error('文件读取失败:', error);
            showAlertDialog('文件读取失败');
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

    //设置分段页眉
    $('#btnMultiPartHeader').on('click', async function () {
        $('.multiPartHeaderDialog #multiPartHeaderJson').val(
            `{
    "controlElementName": "记录时间",
    "headerList": [
        {
            "startTime": "2025-08-24", 
            "endTime": "2025-08-25", 
            "headerData": {
                "科室名称": "内科",
                "病区名称": "内科病区",
                "床位号": "001"
            }
        },
        {
            "startTime": "2025-08-25", 
            "endTime": "2025-08-26", 
            "headerData": {
                "科室名称": "外科",
                "病区名称": "外科病区",
                "床位号": "002"
            }
        }
    ]
}`
        );
        $('.multiPartHeaderDialog').show();
    });

    //分段页眉设置弹框
    $('#multiPartHeaderCancelBtn').on('click', function () {
        $('.multiPartHeaderDialog').hide();
    });
    $('#multiPartHeaderOkBtn').on('click', async function () {
        try {
            const val = $('#multiPartHeaderJson').val();
            const multiPartHeaderData = JSON.parse(val);

            const editor = await window.tabManager.getCurrentEditor();
            // 这里可以调用编辑器的设置分段页眉方法
            editor.setDocMultiPartHeader(multiPartHeaderData);

            // 暂时显示收集到的数据，供调试使用
            console.log('分段页眉数据:', multiPartHeaderData);
            showAlertDialog('分段页眉设置已保存！');
            $('.multiPartHeaderDialog').hide();
        } catch (e) {
            console.error('设置分段页眉失败:', e);
            showAlertDialog('JSON格式错误或设置失败！');
        }
    });

    // ==================== 设置表格权限相关代码 ====================
    // 设置表格权限按钮点击事件
    $('#btnSetTablePerssion').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('设置表格权限');
            return;
        }

        // 初始化开关状态为开启
        $('#tablePermissionFlag').prop('checked', true);
        const slider = $('#tablePermissionFlag').siblings('.slider');
        const sliderCircle = slider.find('.slider-circle');
        const labelText = $('#tablePermissionFlag').closest('label').find('.switch-label-text');
        slider.css('background-color', '#4CAF50');
        sliderCircle.css('transform', 'translateX(26px)');
        labelText.text('开启');

        // 默认选中第一个radio
        $('input[name="tablePermissionType"][value="readonly"]').prop('checked', true);
        updateTablePermissionHelpText('readonly');

        // 清空输入框
        $('#tablePermissionCode').val('');
        $('#tablePermissionRowIndex').val('');

        $('.tablePermissionDialog').show();
    });

    // 表格权限类型radio切换时更新帮助文本
    $('input[name="tablePermissionType"]').on('change', function () {
        updateTablePermissionHelpText($(this).val());
    });

    // 更新表格权限帮助文本
    function updateTablePermissionHelpText(type) {
        const helpTexts = {
            'readonly': '设置指定行为只读状态（开启=只读，关闭=可编辑）',
            'deletable': '设置指定行是否可删除（开启=可删除，关闭=不可删除）',
            'addable': '设置指定行是否可新增（开启=可新增，关闭=不可新增）'
        };
        $('#tablePermissionHelpText').text(helpTexts[type] || '设置指定表格行的权限');
    }

    // 表格权限开关变化处理
    $('#tablePermissionFlag').on('change', function () {
        const isChecked = $(this).is(':checked');
        const slider = $(this).siblings('.slider');
        const sliderCircle = slider.find('.slider-circle');
        const labelText = $(this).closest('label').find('.switch-label-text');

        if (isChecked) {
            slider.css('background-color', '#4CAF50');
            sliderCircle.css('transform', 'translateX(26px)');
            labelText.text('开启');
        } else {
            slider.css('background-color', '#ccc');
            sliderCircle.css('transform', 'translateX(0)');
            labelText.text('关闭');
        }
    });

    // 确认设置表格权限
    $('#btnConfirmTablePermission').on('click', async function () {
        try {
            const tableCode = $('#tablePermissionCode').val().trim();
            const rowIndexText = $('#tablePermissionRowIndex').val().trim();
            const permissionType = $('input[name="tablePermissionType"]:checked').val();
            const flag = $('#tablePermissionFlag').is(':checked');

            // 参数校验
            if (!tableCode) {
                showAlertDialog('请输入表格编码');
                return;
            }

            if (!rowIndexText) {
                showAlertDialog('请输入行号');
                return;
            }

            const editor = await window.tabManager.getCurrentEditor();

            // 获取表格真实行数（通过DOM获取，不依赖数据元）
            const $body = $(editor.editor.document.getBody().$);
            let $table = $body.find('table[data-hm-table-code="' + tableCode + '"][data-hm-table-type="list"]');
            if ($table.length === 0) {
                $table = $body.find('table[data-hm-datatable="' + tableCode + '"][data-hm-table-type="list"]');
            }
            if ($table.length === 0) {
                showAlertDialog('未找到表格编码为 ' + tableCode + ' 的列表类表格');
                return;
            }

            const $tbody = $table.find('tbody');
            if ($tbody.length === 0) {
                showAlertDialog('表格中未找到tbody');
                return;
            }

            const evaluateType = $table.attr('evaluate-type') || 'col';
            let totalRows = 0;

            if (evaluateType === 'row') {
                // 横向表格：获取第一行中非表头的数据单元格数量
                const $firstRow = $tbody.find('tr').first();
                totalRows = $firstRow.find('td:not(.hm-table-horizontal-header)').length;
            } else {
                // 竖向表格（col模式）：直接获取tr数量
                totalRows = $tbody.find('tr').length;
            }

            if (totalRows === 0) {
                showAlertDialog('表格中没有数据行');
                return;
            }

            // 解析行号（支持区间格式，如"1-5,8,10-12"）
            let rowIndexArray = [];
            const parts = rowIndexText.split(',');
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].trim();
                if (part === '') continue;

                // 检查是否是区间格式（如 "1-5"）
                if (part.indexOf('-') > 0) {
                    const range = part.split('-');
                    if (range.length === 2) {
                        const start = parseInt(range[0].trim(), 10);
                        const end = parseInt(range[1].trim(), 10);
                        if (!isNaN(start) && !isNaN(end) && start <= end) {
                            for (let j = start; j <= end; j++) {
                                if (rowIndexArray.indexOf(j) === -1) {
                                    rowIndexArray.push(j);
                                }
                            }
                        }
                    }
                } else {
                    // 单个数字
                    const num = parseInt(part, 10);
                    if (!isNaN(num) && rowIndexArray.indexOf(num) === -1) {
                        rowIndexArray.push(num);
                    }
                }
            }

            if (rowIndexArray.length === 0) {
                showAlertDialog('行号格式错误，请输入有效的行号');
                return;
            }

            // 校验行号是否有效：检查是否至少有一个行号在有效范围内
            const validRows = rowIndexArray.filter(idx => idx >= 0 && idx < totalRows);
            const invalidRows = rowIndexArray.filter(idx => idx < 0 || idx >= totalRows);

            if (validRows.length === 0) {
                showAlertDialog('设置失败！\n输入的行号都不存在\n有效范围：0-' + (totalRows - 1) + '\n输入的行号：' + rowIndexArray.join(','));
                return;
            }

            // 根据权限类型调用对应的方法（使用原始输入，让API自行处理）
            let permissionName;
            switch (permissionType) {
                case 'readonly':
                    permissionName = '只读';
                    editor.setTableRowReadonly(tableCode, rowIndexText, flag);
                    break;
                case 'deletable':
                    permissionName = '删除';
                    editor.setTableRowDeletable(tableCode, rowIndexText, flag);
                    break;
                case 'addable':
                    permissionName = '新增';
                    editor.setTableRowAddable(tableCode, rowIndexText, flag);
                    break;
                default:
                    showAlertDialog('未知的权限类型');
                    return;
            }

            // 构建提示消息
            let message = '设置' + permissionName + '权限成功！\n表格编码：' + tableCode + '\n成功行号：' + validRows.join(',');
            if (invalidRows.length > 0) {
                message += '\n无效行号（已忽略）：' + invalidRows.join(',');
            }
            showAlertDialog(message);

            // 隐藏对话框
            $('.tablePermissionDialog').hide();

        } catch (e) {
            console.error('设置表格权限失败:', e);
            showAlertDialog('设置表格权限失败: ' + e.message);
        }
    });

    // 取消设置表格权限
    $('#btnCancelTablePermission').on('click', function () {
        $('.tablePermissionDialog').hide();
        $('#tablePermissionCode').val('');
        $('#tablePermissionRowIndex').val('');
    });

    // ==================== setTableRowData 手动测试（onTableRowAdd 由弹窗配置项控制是否在 createTab 注册） ====================
    var DEMO_TABLE_ROW_DATA_JSON = [
        { keyCode: 'DE09.00.053.00', keyValue: '2025-10-24 10:00' },
        { keyCode: 'DE04.10.186.00', keyValue: '36.8' },
        { keyCode: 'DE04.10.265.00', keyValue: '良好' },
        { keyCode: 'DE06.00.183.00', keyValue: 'Demo 新增行赋值' },
        { keyCode: 'DE02.01.039.00.178', keyValue: '演示签名' }
    ];

    $('#btnSetTableRowData').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('表格行赋值');
            return;
        }
        if (!$('#tableRowDataCode').val()) {
            $('#tableRowDataCode').val('TABLE_一般护理记录单');
        }
        $('#tableRowDataJson').val(JSON.stringify(DEMO_TABLE_ROW_DATA_JSON, null, 2));
        $('.tableRowDataDialog').show();
    });

    $('#btnConfirmTableRowData').on('click', async function () {
        try {
            var tableCode = $('#tableRowDataCode').val().trim();
            var jsonText = $('#tableRowDataJson').val().trim();
            if (!tableCode) {
                showAlertDialog('请输入表格编码');
                return;
            }
            if (!jsonText) {
                showAlertDialog('请输入行数据 JSON');
                return;
            }
            var rowData = JSON.parse(jsonText);
            if (!Array.isArray(rowData)) {
                showAlertDialog('行数据必须是 JSON 数组');
                return;
            }
            var editor = await window.tabManager.getCurrentEditor();
            var rowIndex = parseInt($('#tableRowDataRowIndex').val(), 10);
            if (isNaN(rowIndex) || rowIndex < 0) {
                showAlertDialog('行索引必须为非负整数');
                return;
            }
            var ok = editor.setTableRowData(tableCode, rowIndex, rowData);
            if (!ok) {
                showAlertDialog('setTableRowData 调用失败，请检查表格编码与行索引');
                return;
            }
            var verifyData = editor.getTableData({ tableCode: tableCode, rowIndex: rowIndex });
            $('#contentTitle').text('setTableRowData 结果（第 ' + rowIndex + ' 行）');
            $('#contentDisplay').val(JSON.stringify(verifyData, null, 2));
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
            $('.tableRowDataDialog').hide();
        } catch (e) {
            console.error('setTableRowData 演示失败:', e);
            showAlertDialog('操作失败: ' + e.message);
        }
    });

    $('#btnCancelTableRowData').on('click', function () {
        $('.tableRowDataDialog').hide();
    });

    //只读模式
    $('#btnReadOnly').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('只读模式');
            return;
        }

        try {
            // 获取当前编辑器实例
            const editor = await window.tabManager.getCurrentEditor();
            const docCode = window.lastClickedDocCode || '';

            // 根据最后点击的文档的doc_code设置编码值
            $('#readOnlyCode').val(docCode);

            // 检查指定文档的只读状态
            const isDocReadOnly = checkDocumentReadOnlyStatus(editor, docCode);

            // 根据当前选中病历的只读状态设置开关按钮的样式状态
            $('#readOnlyFlag').prop('checked', isDocReadOnly);
            // 同步开关按钮的样式状态
            const slider = $('#readOnlyFlag').siblings('.slider');
            const sliderCircle = slider.find('.slider-circle');
            const labelText = $('#readOnlyFlag').closest('label').find('.switch-label-text');

            if (isDocReadOnly) {
                // 当前为只读状态，设置开关为开启状态
                slider.css('background-color', '#4CAF50');
                sliderCircle.css('transform', 'translateX(26px)');
                labelText.text('启用');
            } else {
                // 当前为可编辑状态，设置开关为关闭状态
                slider.css('background-color', '#ccc');
                sliderCircle.css('transform', 'translateX(0)');
                labelText.text('关闭');
            }
            $('.readOnlyDialog').show();
        } catch (error) {
            console.error('获取当前病历信息失败:', error);
            // 如果获取编辑器失败，仍然尝试显示最后点击的docCode
            $('#readOnlyCode').val(window.lastClickedDocCode || '');
            $('#readOnlyFlag').prop('checked', false);
            const slider = $('#readOnlyFlag').siblings('.slider');
            const sliderCircle = slider.find('.slider-circle');
            const labelText = $('#readOnlyFlag').closest('label').find('.switch-label-text');
            slider.css('background-color', '#ccc');
            sliderCircle.css('transform', 'translateX(0)');
            labelText.text('关闭');
            $('.readOnlyDialog').show();
        }
    });

    // 处理只读模式开关变化的函数
    function handleReadOnlyFlagChange() {
        const slider = $(this).siblings('.slider');
        const sliderCircle = slider.find('.slider-circle');
        const labelText = $(this).closest('label').find('.switch-label-text');
        if (this.checked) {
            // 开关打开时，启用只读模式
            slider.css('background-color', '#4CAF50');
            sliderCircle.css('transform', 'translateX(26px)');
            labelText.text('启用');
        } else {
            // 开关关闭时，关闭只读模式
            slider.css('background-color', '#ccc');
            sliderCircle.css('transform', 'translateX(0)');
            labelText.text('关闭');
        }
    }

    // 绑定只读模式开关的change事件
    $('#readOnlyFlag').on('change', handleReadOnlyFlagChange);

    // 处理修订模式开关变化的函数
    async function handleReviseFlagChange() {
        const slider = $(this).siblings('.slider');
        const sliderCircle = slider.find('.slider-circle');
        const labelText = $(this).closest('label').find('.switch-label-text');
        if (this.checked) {
            // 开关打开时，启用修订模式
            slider.css('background-color', '#4CAF50');
            sliderCircle.css('transform', 'translateX(26px)');
            labelText.text('启用');
            // 隐藏修订选项
            $('#reviseOptions').hide();
        } else {
            // 开关关闭时，关闭修订模式
            slider.css('background-color', '#ccc');
            sliderCircle.css('transform', 'translateX(0)');
            labelText.text('关闭');

            // 检查是否有修订记录
            try {
                const editor = await window.tabManager.getCurrentEditor();
                if (!editor || !editor.editor || !editor.editor.document) {
                    console.error('编辑器文档未准备好');
                    $('#reviseOptions').hide();
                    return;
                }
                const $body = $(editor.editor.document.getBody().$);
                const hasRevisions = $body.find('.hm_revise_ins, .hm_revise_del').length > 0;

                if (hasRevisions) {
                    // 有修订记录，显示选项
                    $('#reviseOptions').show();
                    // 默认选择保留修订内容
                    $('#reviseAction').val('retain');
                } else {
                    // 没有修订记录，隐藏选项
                    $('#reviseOptions').hide();
                }
            } catch (error) {
                console.error('检查修订记录失败:', error);
                // 如果检查失败，隐藏选项
                $('#reviseOptions').hide();
            }
        }
    }

    //修订模式
    $('#btnRevise').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('修订模式');
            return;
        }
        try {
            // 获取当前编辑器实例
            const editor = await window.tabManager.getCurrentEditor();

            // 检查编辑器是否支持获取修订模式状态
            if (!editor || !editor.editor.HMConfig) {
                showAlertDialog('编辑器不支持获取修订模式状态');
                return;
            }

            // 获取当前文档的修订模式状态
            const currentReviseMode = editor.editor.HMConfig.reviseMode === true;

            // 先解绑change事件，设置开关状态（避免触发change事件）
            $('#reviseFlag').off('change.revise').prop('checked', currentReviseMode);

            // 同步开关按钮的样式状态
            const slider = $('#reviseFlag').siblings('.slider');
            const sliderCircle = slider.find('.slider-circle');
            const labelText = $('#reviseFlag').closest('label').find('.switch-label-text');

            if (currentReviseMode) {
                slider.css('background-color', '#4CAF50');
                sliderCircle.css('transform', 'translateX(26px)');
                labelText.text('启用');
                // 隐藏修订选项
                $('#reviseOptions').hide();
            } else {
                slider.css('background-color', '#ccc');
                sliderCircle.css('transform', 'translateX(0)');
                labelText.text('关闭');

                // 检查是否有修订记录
                if (!editor || !editor.editor || !editor.editor.document) {
                    console.error('编辑器文档未准备好');
                    $('#reviseOptions').hide();
                } else {
                    const $body = $(editor.editor.document.getBody().$);
                    const hasRevisions = $body.find('.hm_revise_ins, .hm_revise_del').length > 0;

                    if (hasRevisions) {
                        // 有修订记录，显示选项
                        $('#reviseOptions').show();
                        // 默认选择保留修订内容
                        $('#reviseAction').val('retain');
                    } else {
                        // 没有修订记录，隐藏选项
                        $('#reviseOptions').hide();
                    }
                }
            }

            // 重新绑定change事件（使用命名空间避免重复绑定）
            $('#reviseFlag').off('change.revise').on('change.revise', handleReviseFlagChange);

            // 显示修订模式弹框
            $('.reviseDialog').show();
        } catch (error) {
            console.error('获取当前修订模式状态失败:', error);
            // 如果获取失败，仍然显示弹框，但使用默认状态
            $('#reviseFlag').off('change.revise').prop('checked', false);
            $('#reviseOptions').hide();
            $('#reviseFlag').off('change.revise').on('change.revise', handleReviseFlagChange);
            $('.reviseDialog').show();
        }
    });

    // 显示/隐藏工具栏（演示 setShowTools / getShowTools 接口）
    $('#btnShowTools').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('显示/隐藏工具栏');
            return;
        }
        try {
            const editor = await window.tabManager.getCurrentEditor();
            if (!editor || typeof editor.getShowTools !== 'function' || typeof editor.setShowTools !== 'function') {
                showAlertDialog('当前编辑器不支持工具栏显示/隐藏接口');
                return;
            }
            var visible = editor.getShowTools();
            editor.setShowTools(!visible);
            var $btn = $('#btnShowTools');
            $btn.text(visible ? '显示工具栏' : '隐藏工具栏');
        } catch (e) {
            console.error('切换工具栏显示失败:', e);
            showAlertDialog('切换工具栏显示失败: ' + (e.message || e));
        }
    });

    // 开关按钮样式变化（使用统一的处理函数，使用命名空间）
    $('#reviseFlag').off('change.revise').on('change.revise', handleReviseFlagChange);

    // 确认设置修订模式
    $('#btnConfirmRevise').on('click', async function () {
        try {
            const isReviseMode = $('#reviseFlag').is(':checked');
            const editor = await window.tabManager.getCurrentEditor();

            let retainModify = undefined;

            // 如果关闭修订模式，且显示了修订选项，则根据用户选择设置 retainModify
            if (!isReviseMode && $('#reviseOptions').is(':visible')) {
                const selectedAction = $('#reviseAction').val();
                retainModify = selectedAction === 'retain';
            }

            // 如果 retainModify 有值，则传入参数，否则不传（会弹框）
            if (retainModify !== undefined) {
                editor.setDocReviseMode(isReviseMode, retainModify);
            } else {
                editor.setDocReviseMode(isReviseMode);
            }

            // 隐藏对话框
            $('.reviseDialog').hide();

        } catch (e) {
            console.error('设置修订模式失败:', e);
            showAlertDialog('设置修订模式失败: ' + e.message);
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
            showAlertDialog('请先打开并选中一个文档！');
        }
    });

    // 设置数据按钮
    $('#btnSetData').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('设置数据');
            return;
        }

        // 获取当前编辑器的病历编码
        let docCode = 'DOC001'; // 默认值
        try {
            const editor = await window.tabManager.getCurrentEditor();
            if (editor && editor.editor) {
                const $body = $(editor.editor.document.getBody().$);
                // 查找第一个具有data-hm-widgetid的元素
                const $firstWidget = $body.find('div[data-hm-widgetid]').first();
                if ($firstWidget.length > 0) {
                    const widgetId = $firstWidget.attr('data-hm-widgetid');
                    if (widgetId && widgetId.trim()) {
                        docCode = widgetId.trim();
                    }
                }
            }
        } catch (error) {
            console.log('获取当前编辑器病历编码失败:', error);
            // 如果获取失败，使用默认值
        }

        // 设置数据元示例数据
        $('.dataInputDialog textarea').val(JSON.stringify([{
            code: docCode,
            data: [{
                    keyCode: '',
                    keyName: '',
                    keyValue: ''
                },
                {
                    keyCode: '',
                    keyName: '',
                    keyValue: ['诊断1']
                }
            ]
        }], null, 2));
        $('.dataInputDialog').show();
    });

    // 删除文档按钮
    $('#btnDeleteDoc').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('删除文档');
            return;
        }
        // 清空输入框
        $('#deleteDocCode').val('');
        // 显示删除文档对话框
        $('.deleteDocDialog').show();
    });

    // 确认删除文档
    $('#btnConfirmDeleteDoc').on('click', async function () {
        try {
            const docCodeText = $('#deleteDocCode').val().trim();

            if (!docCodeText) {
                showAlertDialog('请输入要删除的文档编号');
                return;
            }

            const editor = await window.tabManager.getCurrentEditor();
            if (!editor || !editor.deleteDocContent) {
                showAlertDialog('编辑器不支持删除文档功能');
                return;
            }

            // 解析输入：可能是单个值或JSON数组
            let docCode = null;
            try {
                // 先尝试解析为JSON
                docCode = JSON.parse(docCodeText);
            } catch (e) {
                // 如果不是JSON，则当作单个字符串处理
                docCode = docCodeText;
            }

            // 调用删除方法
            const result = editor.deleteDocContent(docCode);

            if (result) {
                showAlertDialog('删除文档成功！');
            } else {
                showAlertDialog('删除文档失败，请检查文档编号是否正确');
            }

            // 隐藏对话框并清空输入
            $('.deleteDocDialog').hide();
            $('#deleteDocCode').val('');

        } catch (e) {
            console.error('删除文档失败:', e);
            showAlertDialog('删除文档失败: ' + e.message);
        }
    });

    // 取消删除文档
    $('#btnCancelDeleteDoc').on('click', function () {
        $('.deleteDocDialog').hide();
        $('#deleteDocCode').val('');
    });

    // 确认设置数据
    $('#btnConfirmData').on('click', async function () {
        const textContent = $('.dataInputDialog textarea').val();
        if (!textContent) {
            showAlertDialog('请输入数据');
            return;
        }

        try {
            const dataJson = JSON.parse(textContent);
            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocData(dataJson);
            $('.dataInputDialog').hide();
            $('.dataInputDialog textarea').val('');
        } catch (e) {
            showAlertDialog('JSON格式错误: ' + e.message);
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
            showAlertDialog('请输入要插入的内容');
            return;
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            editor.insertDataAtCursor(textContent);
            $('.insertDataAtCursorDialog').hide();
            $('.insertDataAtCursorDialog textarea').val('');
        } catch (e) {
            showAlertDialog('插入数据失败: ' + e.message);
        }
    });

    // 取消插入数据
    $('#btnCancelInsertData').click(function () {
        $('.insertDataAtCursorDialog').hide();
        $('.insertDataAtCursorDialog textarea').val('');
    });

    // ==================== 插入HTML相关代码 ====================
    // 插入HTML按钮点击事件
    $('#btnInsertHtml').click(function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('插入HTML');
            return;
        }
        $('.insertHtmlDialog').show();
    });

    // 确认插入HTML
    $('#btnConfirmInsertHtml').on('click', async function () {
        const htmlContent = $('#insertHtmlContent').val();
        const posTag = $('#insertHtmlPosTag').val();

        if (!htmlContent) {
            showAlertDialog('请输入要插入的HTML内容');
            return;
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            const result = editor.insertHtml(htmlContent, posTag || undefined);
            if (result === false) {
                showAlertDialog('插入HTML失败，请检查定位标记是否正确');
            } else {
                $('.insertHtmlDialog').hide();
                $('#insertHtmlContent').val('');
                $('#insertHtmlPosTag').val('');
            }
        } catch (e) {
            showAlertDialog('插入HTML失败: ' + e.message);
        }
    });

    // 取消插入HTML
    $('#btnCancelInsertHtml').click(function () {
        $('.insertHtmlDialog').hide();
        $('#insertHtmlContent').val('');
        $('#insertHtmlPosTag').val('');
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
            showAlertDialog('获取HTML失败: ' + e.message);
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
            showAlertDialog('获取Text失败: ' + e.message);
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
                    showAlertDialog('输入的JSON格式不正确，请检查格式！');
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
            showAlertDialog('获取Data失败: ' + e.message);
        }
    }

    async function getTableData() {
        var _val = $('.getDataDialog textarea').val();
        try {
            var params = {};
            if (_val) {
                try {
                    params = JSON.parse(_val);
                } catch (e) {
                    showAlertDialog('输入的JSON格式不正确，请检查格式！');
                    return;
                }
            }

            var code = params.tableCode || '';
            if (!code) {
                showAlertDialog('表格编码不能为空！');
                return;
            }

            const editor = await window.tabManager.getCurrentEditor();

            // 调用编辑器的获取表格数据方法
            const tableData = await editor.getTableData(params);

            // 显示内容
            $('#contentTitle').text('表格数据内容');
            $('#contentDisplay').val(JSON.stringify(tableData));
            // 隐藏"保存HTML原文"按钮
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
            closeGetDataDialog();
        } catch (e) {
            console.error('获取表格数据失败:', e);
            showAlertDialog('获取表格数据失败: ' + e.message);
        }
    }

    function closeGetDataDialog() {
        $('.getDataDialog').hide();
        $('.getDataDialog textarea').val('');
        // 隐藏数据类型选择选项
        $('#dataTypeSelection').hide();
    }

    // 根据数据类型更新弹窗界面
    function updateDataDialogByType(dataType) {
        $('.getDataDialog textarea').val('');
        if (dataType === 'metadata') {
            // 数据元模式
            var _placeholder = JSON.stringify({
                code: '', // 文档唯一编号
                keyList: [] //指定数据元编码列表
            });
            $('#getDataDialogTitle').text('演示用 - 输入获取数据元参数');
            $('.getDataDialog textarea').attr('placeholder', _placeholder);
            $('.getDataDialog .help-text').text('参数为空，获取所有数据');
            flag = 3;
        } else if (dataType === 'tabledata') {
            // 表格数据模式
            var _placeholder = JSON.stringify({
                tableCode: '', // 表格编码，必填
                colKeyList: [], //指定数据元编码列表，可选
                rowIndex: 0 // 可选，指定行索引
            });
            $('#getDataDialogTitle').text('演示用 - 输入获取表格数据参数');
            $('.getDataDialog textarea').attr('placeholder', _placeholder);
            $('.getDataDialog .help-text').text('*表格编码必填,指定列编码列表可选,指定行索引可选');
            flag = 4;
        }
        $('#btnAddParamsText').show();
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
            showAlertDialog('获取HTML失败: ' + e.message);
        }
    });

    // 取消获取HTML文本
    $('#btnCancelGetHtml').on('click', function () {
        $('.getHtmlDialog').hide();
        $('.getHtmlDialog textarea').val('');
    });

    $('#btnAddParamsText').on('click', function () {
        let quickData = {};
        if (flag == 3) {
            // 获取数据元Data的快速录入格式
            quickData = {
                code: "",
                keyList: [""]
            };
        } else if (flag == 4) {
            // 获取表格数据的快速录入格式
            quickData = {
                tableCode: "TABLE_001", // 表格编码，必填
                colKeyList: [], // 可选，指定列编码
                rowIndex: null // 可选，指定行索引
            };
        }
        $('.getDataDialog textarea').val(JSON.stringify(quickData, null, 2));
    });
    // 根据不同按钮，调用不同方法获取数据
    $('#btnGetDataByParams').on('click', function () {
        if (flag == 2) {
            getText();
        } else if (flag == 3) {
            getData();
        } else if (flag == 4) {
            getTableData();
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

        // 隐藏数据类型选择选项
        $('#dataTypeSelection').hide();

        var _placeholder = '请输入文档唯一编号';
        $('#getDataDialogTitle').text('演示用 - 输入获取TEXT参数');
        $('.getDataDialog textarea').attr('placeholder', _placeholder);
        $('.getDataDialog .help-text').text('参数为空，获取所有TEXT内容');
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

        // 显示数据类型选择选项
        $('#dataTypeSelection').show();

        // 设置默认选择为数据元
        $('input[name="dataTypeMode"][value="metadata"]').prop('checked', true);

        // 根据默认选择设置界面
        updateDataDialogByType('metadata');

        $('.getDataDialog').show();
    });

    // 复制内容
    $('#btnCopyContent').on('click', function () {
        const content = $('#contentDisplay').val();

        // 检查内容是否为空
        if (!content) {
            showAlertDialog('没有内容可复制');
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
                showAlertDialog('已复制到剪贴板');
            })
            .catch((err) => {
                console.error('复制失败:', err);

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
                showAlertDialog('未找到HTML内容');
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
            showAlertDialog('保存HTML原文失败: ' + e.message);
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
                    showAlertDialog('输入的内容不是有效的JSON格式！');
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
        $('.insertDocDialog textarea').val(JSON.stringify([{
                code: '新插入文档_1',
                docContent: "<body><p>新插入文档_1</p></body>"
            },
            {
                code: '新插入文档_2',
                docContent: "<body><p>新插入文档_2</p></body>"
            }
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
            console.log('getSelectedHtml', editor.editor.getSelectedText());

        } catch (e) {
            showAlertDialog('JSON格式错误，请检查输入');
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
                designMode: true,
                allowModifyDatasource: true
            }, content);

            if (datasources) {
                console.log('获取当前编辑器实例');
                const editor = await window.tabManager.getCurrentEditor();

                // 设置 A4 纸张
                if (editor && typeof editor.execCommand === 'function') {
                    console.log('设置 A4 纸张');
                    editor.execCommand('paperSize', {
                        paperSize: 'A4_portrait',
                        paperMargin: {
                            top: '5mm',
                            right: '5mm',
                            bottom: '5mm',
                            left: '5mm'
                        }
                    });
                }

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
            showAlertDialog('请选择图片文件');
            $(this).val('');
            return;
        }

        // 验证文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
            showAlertDialog('图片文件大小不能超过2MB');
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
            showAlertDialog('图片读取失败');
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
                showAlertDialog('请输入水印文本');
                return;
            }
            watermarkConfig.watermarkText = watermarkText;
            watermarkConfig.color = color || '#cccccc';
        } else if (watermarkType === '2') {
            // 图片水印
            const base64Data = $('#watermarkImageFile').data('base64');
            if (!base64Data) {
                showAlertDialog('请选择水印图片');
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
            showAlertDialog('设置水印失败: ' + e.message);
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
            showAlertDialog('请输入图片的base64数据');
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
            showAlertDialog('插入数据失败: ' + e.message);
        }
    });

    //自定义菜单演示弹框
    $('#customMenuCancelBtn').on('click', function () {
        $('.customMenuDialog').hide();
    });
    $('#customMenuOkBtn').on('click', async function () {
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
            const elementListText = $('#readOnlyElementList').val().trim();
            const isReadOnly = $('#readOnlyFlag').is(':checked');

            const editor = await window.tabManager.getCurrentEditor();

            // 如果输入了元素集合，则调用setElementReadOnly方法
            if (elementListText) {
                let elementList = null;
                try {
                    elementList = JSON.parse(elementListText);
                    // 验证是否为数组
                    if (!Array.isArray(elementList)) {
                        showAlertDialog('指定元素集合必须是数组格式！');
                        return;
                    }
                } catch (e) {
                    showAlertDialog('指定元素集合的JSON格式错误，请检查格式！');
                    return;
                }
                // 调用setElementReadOnly方法
                editor.setElementReadOnly(code || '', elementList, isReadOnly);
            } else {
                // 如果没有输入元素集合，则使用原来的setDocReadOnly方法
                editor.setDocReadOnly(code, isReadOnly);
            }
            // 隐藏对话框并清空输入
            $('.readOnlyDialog').hide();
            $('#readOnlyCode').val('');
            $('#readOnlyElementList').val('');

        } catch (e) {
            console.error('设置只读模式失败:', e);
            showAlertDialog('设置只读模式失败: ' + e.message);
        }
    });

    // 取消设置只读模式
    $('#btnCancelReadOnly').on('click', function () {
        $('.readOnlyDialog').hide();
        $('#readOnlyCode').val('');
        $('#readOnlyElementList').val('');
    });

    // ==================== 质控提醒相关代码 ====================
    // 质控提醒按钮点击事件
    $('#btnHmAiQc').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('质控提醒');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        // 重置弹窗状态
        const editor = await window.tabManager.getCurrentEditor();
        const {
            docCode
        } = await getCurrentDocumentInfo();
        // 使用公共方法更新params
        let params = window.aiParams[docCode];
        params = await updateProgressMessage(editor, docCode, params);
        $('.hmAiQcDialog textarea').val(JSON.stringify(params, null, 2));
        $('.hmAiQcDialog').show();
    });

    // 快速载入质控参数链接点击事件
    $('.quick-link-hmAi').on('click', async function () {
        const editor = await window.tabManager.getCurrentEditor();
        const recordName = $('#' + editor.frameId).parent().attr('data-record-name');
        const serialNumber = $('#' + editor.frameId).parent().attr('data-serial-number');
        let progressNoteList = [];
        // 检查recordName是否存在于recordMapData中
        if (recordMapData.some(item => {
                if (Array.isArray(item.recordName)) {
                    return item.recordName.includes(recordName);
                }
                return item.recordName === recordName;
            })) {
            const recordInfo = getRecordInfo(recordName); // 根据当前tab的名称获取病历类型
            const textContent = await editor.getDocText('');
            if (textContent.length > 0) {
                // 循环处理
                for (let i = 0; i < textContent.length; i++) {
                    const item = textContent[i];
                    const obj = {
                        progressGuid: item.code,
                        progressTypeName: recordName,
                        progressType: recordInfo.recordType,
                        doctorGuid: "privateTesting",
                        doctorName: "privateTesting",
                        progressMessage: item.text,
                        msgType: 0
                    }
                    progressNoteList.push(obj);
                }
            }
        }
        const params = {
            "userGuid": "P2813DG68623",
            "serialNumber": serialNumber,
            "caseNo": "M-2VPWB302031",
            "currentBedCode": "+002",
            "patientName": "张*三",
            "doctorGuid": "privateTesting",
            "doctorName": "privateTesting",
            "admissionTime": "2024-01-03 16:30:11",
            "inpatientDepartment": "心脏科",
            "inpatientArea": "",
            "inpatientDepartmentId": "心脏科",
            "divisionId": null,
            "pageSource": "2",
            "openInterdict": 0,
            "triggerSource": 1,
            "patientInfo": {
                "gender": 0,
                "birthDate": "1980-07-09",
                "age": "45",
                "ageType": "岁",
                "maritalStatus": 2,
                "pregnancyStatus": 0
            },
            "progressNoteList": progressNoteList
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
                showAlertDialog('输入的JSON格式不正确，请检查格式！');
                return;
            }
        }

        try {
            const editor = await window.tabManager.getCurrentEditor();
            // 调用qc方法
            editor.hmAi.awekenAiWidget = {}; // 重置指尖ai唤醒widget
            editor.qc(params);
            const bean = formatQualityRemindParams(params);
            console.log(bean)
            // mayson 内嵌展示，先不发布
            if (ai == 1) {
                window.mayson && window.mayson.ai(bean);
                // 默认打开智能提醒tab栏
                $('.assistant-float-tab-btn[data-tab="smart"]').click();
                // 隐藏对话框并清空输入
            }

            $('.hmAiQcDialog').hide();
            $('.hmAiQcDialog textarea').val('');

            showAlertDialog('质控提醒已启动');
        } catch (e) {
            console.error('质控提醒失败:', e);
            showAlertDialog('质控提醒失败: ' + e.message);
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
    window.tabManager.activateTab = function (tabId) {
        origActivateTab(tabId);
        updateDestroyEditorBtnState();
    };
    // 关闭标签页后也更新
    const origCloseTab = window.tabManager.closeTab.bind(window.tabManager);
    window.tabManager.closeTab = function (tabId) {
        origCloseTab(tabId);
        updateDestroyEditorBtnState();
    };
    // 新建标签页后也更新
    const origCreateTab = window.tabManager.createTab.bind(window.tabManager);
    window.tabManager.createTab = async function (...args) {
        const result = await origCreateTab(...args);
        updateDestroyEditorBtnState();
        return result;
    };

    // 树收起/展开切换图标
    $('.tree-header').on('click', function () {
        var $icon = $(this).find('.tree-icon');
        if ($(this).hasClass('collapsed')) {
            $(this).removeClass('collapsed');
            $icon.removeClass('fa-folder').addClass('fa-folder-open');
        } else {
            $(this).addClass('collapsed');
            $icon.removeClass('fa-folder-open').addClass('fa-folder');
        }
    });

    // ==================== AI认证相关代码 ====================
    // AI认证按钮点击事件
    $('#btnHmAiAuth').on('click', async function () {
        // 检查AI令牌
        const token = localStorage.getItem('HMAccessToken');
        if (!token) {
            showAlertDialog('请先设置AI令牌', function () {
                // 点击确定后直接打开AI令牌设置对话框
                $('.aiTokenDialog').show();
            });
            return;
        }

        // 获取当前选中的文档信息
        const {
            docCode,
            serialNumber
        } = await getCurrentDocumentInfo();
        let aiParam = null;
        // 如果有docCode，尝试获取对应的aiParam
        if (docCode && window.aiParams && window.aiParams[docCode]) {
            aiParam = window.aiParams[docCode];
        }
        // 构建参考initAiAuth的params参数
        const params = {
            "aiServer": window.aiServer,
            "authToken": localStorage.getItem('HMAccessToken'),
            "userGuid": aiParam.userGuid || '',
            "userName": '演示用户',
            "doctorGuid": 'hmpm',
            "serialNumber": serialNumber,
            "department": "演示科室",
            "doctorName": "pm",
            "hospitalGuid": "1001",
            "hospitalName": "惠每医生团队",
            "customEnv": "1",
            "flag": "m"
        };

        // 填充对话框
        $('.hmAiAuthDialog textarea').val(JSON.stringify(params, null, 2));
        $('.hmAiAuthDialog').show();
    });
    window.isInitHMAuth = false;
    // 快速载入AI认证参数链接点击事件
    $('.quick-link-hmAiAuth').on('click', function () {
        const params = {
            aiServer: window.aiServer,
            authToken: localStorage.getItem('HMAccessToken') || '',
            userGuid: 'P2813DG68623',
            userName: '张*三',
            doctorGuid: 'privateTesting',
            serialNumber: 'S2VPWB3391943',
            department: '心脏科',
            doctorName: 'privateTesting',
            hospitalGuid: 'demohospital',
            hospitalName: '演示医院',
            customEnv: '1',
            flag: 'm'
        };
        $('.hmAiAuthDialog textarea').val(JSON.stringify(params, null, 2));
    });

    // 确认执行AI认证
    $('#btnConfirmHmAiAuth').on('click', async function () {
        const textContent = $('.hmAiAuthDialog textarea').val();
        let params = {};
        if (textContent) {
            try {
                params = JSON.parse(textContent);
            } catch (e) {
                showAlertDialog('输入的JSON格式不正确，请检查格式！');
                return;
            }
        }
        try {
            if (!inAuthSerialNumber.includes(params.serialNumber)) {
                showAlertDialog('请使用左侧病历树中的病历进行功能演示！');
                return;
            }
            // 使用Promise处理认证初始化
            await HMEditorLoader.aiAuth(params, params.recordMap || recordMapData, false, ai);
            ai == 1 && maysonListenWindowSize(); // mayson 内嵌展示，先不发布
            window.isInitHMAuth = true;
            // 隐藏对话框并清空输入
            $('.hmAiAuthDialog').hide();
            $('.hmAiAuthDialog textarea').val('');

            showAlertDialog('AI认证成功');
        } catch (e) {
            console.error('AI认证失败:', e);
            showAlertDialog('AI认证失败: ' + e.message);
        }
    });

    // 取消AI认证
    $('#btnCancelHmAiAuth').on('click', function () {
        $('.hmAiAuthDialog').hide();
        $('.hmAiAuthDialog textarea').val('');
    });

    // ==================== 唤醒AI相关代码 ====================
    // 唤醒AI按钮点击事件
    $('#btnHmAiGen').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('唤醒AI');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        // 重置弹窗状态
        const {
            recordName,
            docCode
        } = await getCurrentDocumentInfo();
        const recordInfo = getRecordInfo(recordName);
        const params = {
            recordType: recordInfo.recordType,
            progressGuid: docCode
        };
        $('.hmAiGenDialog textarea').val(JSON.stringify(params, null, 2));
        $('.hmAiGenDialog').show();
    });

    // 快速载入AI参数链接点击事件
    $('.quick-link-hmAiGen').on('click', function () {
        const params = {
            recordType: 10,
            progressGuid: 'discharge_record'
        };
        $('.hmAiGenDialog textarea').val(JSON.stringify(params, null, 2));
    });

    // 确认执行唤醒AI
    $('#btnConfirmHmAiGen').on('click', async function () {
        const textContent = $('.hmAiGenDialog textarea').val();
        let params = {};
        if (textContent) {
            try {
                params = JSON.parse(textContent);
            } catch (e) {
                showAlertDialog('输入的JSON格式不正确，请检查格式！');
                return;
            }
        }

        try {

            const editor = await window.tabManager.getCurrentEditor();
            // 调用hmAi.ai方法
            editor.aiActive(params);

            // 新增：如果有progress_guid，修改聚焦或第一个病历div的属性
            if (params.progress_guid) {
                const $body = $(editor.editor.document.getBody().$);
                // 先找聚焦的病历div（TODO:识别聚焦），否则取第一个
                let $targetDiv = $body.find('div[data-hm-widgetid].focused').first();
                if ($targetDiv.length === 0) {
                    $targetDiv = $body.find('div[data-hm-widgetid]').first();
                }
                if ($targetDiv.length > 0) {
                    $targetDiv.attr('data-hm-widgetid', params.progress_guid);
                    $targetDiv.attr('doc_code', params.progress_guid);
                }
            }

            // 隐藏对话框并清空输入
            $('.hmAiGenDialog').hide();
            $('.hmAiGenDialog textarea').val('');

            showAlertDialog('指尖AI已启动');
        } catch (e) {
            console.error('指尖AI启动失败:', e);
            showAlertDialog('指尖AI启动失败: ' + e.message);
        }
    });

    // 取消唤醒AI
    $('#btnCancelHmAiGen').on('click', function () {
        $('.hmAiGenDialog').hide();
        $('.hmAiGenDialog textarea').val('');
    });
    // ==================== 节点生成相关代码 ====================
    // 节点生成按钮点击事件
    $('#btnNodeGen').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('节点生成');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        try {
            const editor = await window.tabManager.getCurrentEditor();
            var selection = editor.editor.getSelection().getRanges()[0];
            if (!selection) {
                console.error('未找到光标位置');
                return;
            }
            var target = selection.startContainer.$;
            editor.generateSection(target);

            showAlertDialog('节点生成已启动');
        } catch (e) {
            console.error('段落生成失败:', e);
            showAlertDialog('段落生成失败: ' + e.message);
        }
    });

    // ==================== 病历生成相关代码 ====================
    // 病历生成按钮点击事件
    $('#btnDocGen').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('病历生成');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        try {
            const editor = await window.tabManager.getCurrentEditor();
            // 调用generateDocument方法进行病历生成
            editor.generateDocument();

            showAlertDialog('病历生成已启动');
        } catch (e) {
            console.error('病历生成失败:', e);
            showAlertDialog('病历生成失败: ' + e.message);
        }
    });

    function getGenerateDocumentDirectDefaultParams(docCode) {
        return {
            record_id: 2999900472,
            new_chat: 1,
            btnType: 3,
            record_date: '',
            agent_type: '1',
            agent_code: 'P5M8CQKRRL3RE',
            agent_name: '生成首次病程记录',
            agent_id: '100299',
            agent_query: '1',
            docCode: docCode,
            user_code: 'hmpm',
            department_name: '外科'
        };
    }

    function getGenerateDocumentDirectDefaultParamsText(docCode) {
        return JSON.stringify(getGenerateDocumentDirectDefaultParams(docCode), null, 2);
    }

    // AI 整份病历直连生成（generateDocumentDirect，支持弹框录入参数）
    $('#btnGenerateDocumentDirect').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('AI病历生成');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        try {
            const {
                docCode
            } = await getCurrentDocumentInfo();
            var defaultParamsText = getGenerateDocumentDirectDefaultParamsText(docCode || '');
            $('#generateDocumentDirectTextarea').val('');
            $('#generateDocumentDirectTextarea').attr('placeholder', defaultParamsText);
            $('#generateDocumentDirectFillSample').data('sampleText', defaultParamsText);
            $('#generateDocumentDirectDialog').addClass('show');
        } catch (e) {
            console.error('AI病历生成失败:', e);
            showAlertDialog('AI病历生成失败: ' + (e && e.message ? e.message : String(e)));
        }
    });

    $('#btnConfirmGenerateDocumentDirect').on('click', async function () {
        var textContent = $('#generateDocumentDirectTextarea').val();
        var generateDocumentDirectParams = {};
        var isEmptyGenerateDocumentDirectField = function (value) {
            return !value || (typeof value === 'string' && !value.replace(/\s/g, ''));
        };

        if (!textContent || !$.trim(textContent)) {
            showAlertDialog('请输入JSON格式的AI病历生成参数，或点击“填充示例”后再提交！');
            return;
        }

        try {
            generateDocumentDirectParams = JSON.parse(textContent);
        } catch (e) {
            showAlertDialog('输入的JSON格式不正确，请检查格式！');
            return;
        }

        if (Object.prototype.toString.call(generateDocumentDirectParams) !== '[object Object]') {
            showAlertDialog('AI病历生成参数必须为 JSON 对象格式！');
            return;
        }

        if (isEmptyGenerateDocumentDirectField(generateDocumentDirectParams.agent_code)) {
            showAlertDialog('请传入智能体编码 agent_code！');
            return;
        }

        try {
            var editor = await window.tabManager.getCurrentEditor();
            if (isEmptyGenerateDocumentDirectField(generateDocumentDirectParams.docCode)) {
                const {
                    docCode
                } = await getCurrentDocumentInfo();
                if (isEmptyGenerateDocumentDirectField(docCode)) {
                    showAlertDialog('未获取到当前病历 docCode，请补充 docCode 后重试。');
                    return;
                }
                generateDocumentDirectParams.docCode = docCode;
            }
            $('#generateDocumentDirectDialog').removeClass('show');
            $('#generateDocumentDirectTextarea').val('');
            editor.generateDocumentDirect(generateDocumentDirectParams);

        } catch (e) {
            console.error('AI病历生成失败:', e);
            showAlertDialog('AI病历生成失败: ' + (e && e.message ? e.message : String(e)));
        }
    });

    $('#generateDocumentDirectFillSample').on('click', function () {
        $('#generateDocumentDirectTextarea').val($(this).data('sampleText') || $('#generateDocumentDirectTextarea').attr('placeholder') || '');
    });

    $('#btnCancelGenerateDocumentDirect').on('click', function () {
        $('#generateDocumentDirectDialog').removeClass('show');
        $('#generateDocumentDirectTextarea').val('');
    });

    $('#generateDocumentDirectDialog .gen-doc-param-dialog-mask').on('click', function () {
        $('#generateDocumentDirectDialog').removeClass('show');
        $('#generateDocumentDirectTextarea').val('');
    });

    // ==================== AI对话设置弹窗关闭事件 ====================
    $('#closeAiSettingsBtn').on('click', function () {
        $('#chatSettingsModal').hide();
    });


    // 智能提醒弹框关闭按钮
    $('#btnSmartClose').on('click', function () {
        $('.assistant-smart-block').hide();
    });

    // tab切换逻辑
    $('.assistant-float-tab-btn').on('click', function () {
        var tab = $(this).data('tab');
        // 激活tab按钮
        $('.assistant-float-tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.assistant-panel').hide();
        // 标题和按钮
        if (tab === 'log') {
            $('#assistantTitle').text('API日志');
            $('#btnClear').show();
            $('#assistantLogPanel').show();
            // 恢复侧边栏宽度
        } else if (tab === 'ai') {
            $('#assistantTitle').text('AI对话');
            $('#btnClear').hide();
            $('#assistantAiPanel').show();
            // 恢复侧边栏宽度
        } else if (tab === 'smart') {
            $('#assistantTitle').text('智能提醒');
            $('#btnClear').hide();
            $('#assistantSmartPanel').show();
            // 检查是否存在hm-mayson-iframe-part元素
            const $maysonIframe = $('#assistantSmartPanel').find('#hm-mayson-iframe-part');
            if ($maysonIframe.length > 0 && $maysonIframe.width() > 0) {
                // 获取iframe宽度并调用autoRightPanel
                const width = $maysonIframe.width();
                $('.assistant-block').css({
                    'width': width + 'px'
                });
            }
            $('.assistant-smart-block').show();
        }
        // 显示侧边弹窗
        $('.assistant-block').show();
        $('.main-page').css('padding-right', "0");
        // 初始化和窗口变化时判断
        setTimeout(function () {
            updateCenterBtnToolbar();
        }, 100)
    });
    // 关闭按钮，隐藏整个弹窗
    $('#btnExpand').on('click', function () {
        $('.assistant-block').hide();
        $('.assistant-float-tab-btn').removeClass('active');
        $('.tab-container').removeAttr('style')
        // 移除这行代码，避免影响工具栏的隐藏状态
        // $('.btn-panel').removeAttr('style');
        $('.assistant-block').removeAttr('style');
        $('.main-page').css('padding-right', "20px")
        setTimeout(function () {
            updateCenterBtnToolbar();
        }, 100)
    });
    window.isClickCollapse = false;
    $('#toggleLeftPanel').on('click', function () {
        $('.left-panel').toggleClass('collapsed');
        if ($('.left-panel').hasClass('collapsed')) {
            window.isClickCollapse = true; // 如果主动点击收起，则不自动展开
        } else {
            window.isClickCollapse = false;
        }
        // 可选：切换按钮图标方向
        toggleLeftPanelIcon();
        setTimeout(function () {
            updateCenterBtnToolbar();
        }, 150)
    });

    // 「更多 / AI」下拉（与文件末尾 closeDemoToolbarDropdowns / updateCenterBtnToolbar 配合）
    $('#btnToolbarMore').on('click', function (e) {
        e.stopPropagation();
        if ($('#toolbarMorePanel').find('button').length === 0) {
            return;
        }
        var $dd = $(this).closest('.demo-toolbar-dd');
        if ($dd.hasClass('is-open')) {
            closeDemoToolbarDropdowns();
        } else {
            closeDemoToolbarDropdowns();
            $dd.addClass('is-open');
            $('#toolbarMorePanel').show();
            $(this).attr('aria-expanded', 'true');
        }
    });
    $('#btnToolbarAi').on('click', function (e) {
        e.stopPropagation();
        var $dd = $(this).closest('.demo-toolbar-dd');
        if ($dd.hasClass('is-open')) {
            closeDemoToolbarDropdowns();
        } else {
            closeDemoToolbarDropdowns();
            $dd.addClass('is-open');
            $('#toolbarAiPanel').show();
            $(this).attr('aria-expanded', 'true');
        }
    });
    // 点工具栏外关闭下拉；不得在下拉面板的按钮上冒泡到 document，否则先于 async 里第一个 await 执行 hide，易表现为「点了没反应」
    $(document).on('click', function (e) {
        var $t = $(e.target);
        if ($t.closest('#toolbarMorePanel').length && $('#toolbarMorePanel').is(':visible')) {
            return;
        }
        if ($t.closest('#toolbarAiPanel').length && $('#toolbarAiPanel').is(':visible')) {
            return;
        }
        if ($t.closest('#btnToolbarMore, #btnToolbarAi').length) {
            return;
        }
        closeDemoToolbarDropdowns();
    });
    $('#toolbarMorePanel, #toolbarAiPanel').on('click', 'button', function (e) {
        e.stopPropagation();
        setTimeout(function () {
            closeDemoToolbarDropdowns();
        }, 0);
    });

    // 初始化和窗口变化时主区最多两行，溢出入「更多」
    updateCenterBtnToolbar();
    $(window).on('resize', function () {
        updateCenterBtnToolbar();
    });

    // ==================== AI令牌弹窗相关代码 ====================
    // AI令牌按钮点击事件
    $('#btnHmAiToken').on('click', function () {
        $('.aiTokenDialog').show();
    });
    // 复制AI令牌
    $('#btnSetAiToken').on('click', function () {
        const token = $('#aiTokenTextarea').val();
        if (!token) {
            showAlertDialog('没有输入有效AI令牌');
            return;
        }
        console.log('验证AI令牌...');
        var valid = checkAiToken(token);
        if (!valid) {
            showAlertDialog('AI令牌无效,请确认令牌是否正确！');
            return;
        }
        console.log('AI令牌验证成功，设置令牌');
        // 获取编辑器实例并设置AI令牌
        HMEditorLoader.setAiToken(token);
        showAlertDialog('AI令牌已设置');
        $('.aiTokenDialog').hide();

        console.log('触发aiTokenSet事件');
        // 触发自定义事件，通知令牌设置完成
        $(document).trigger('aiTokenSet');
    });
    // 关闭AI令牌弹窗
    $('#btnCloseAiToken').on('click', function () {
        $('.aiTokenDialog').hide();
        $('#aiTokenTextarea').val('');
    });

    // 无令牌尝试按钮点击事件
    $('#btnNoTokenTry').on('click', function () {
        // 关闭AI令牌弹窗
        $('.aiTokenDialog').hide();
        $('#aiTokenTextarea').val('');

        // 切换到"常用病历模板"tab
        $('.tree-tab[data-tab="normal"]').click();

        // 显示提示信息
        showAlertDialog('已切换到"常用病历模板"，您可以体验普通编辑功能而无需AI令牌。');
    });

    // ==================== 修订记录相关代码 ====================
    // 修订记录按钮点击事件
    $('#btnRevisionHistory').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('修订记录');
            return;
        }
        $('.getRevisionHistoryDialog').show();
    });

    // 确认获取修订记录
    $('#btnConfirmGetRevisionHistory').on('click', async function () {
        const code = $('.getRevisionHistoryDialog textarea').val();
        try {
            // 获取当前编辑器实例
            const editor = await window.tabManager.getCurrentEditor();

            // 检查编辑器是否支持getDocRevisionHistory方法
            if (!editor || typeof editor.getDocRevisionHistory !== 'function') {
                showAlertDialog('编辑器不支持获取修订记录功能');
                return;
            }

            // 调用获取修订记录方法
            const revisionHistory = await editor.getDocRevisionHistory(code);

            // 显示修订记录内容
            $('#contentTitle').text('修订记录');
            $('#contentDisplay').val(JSON.stringify(revisionHistory, null, 2));
            // 隐藏"保存HTML原文"按钮
            $('#btnSaveHtmlRaw').addClass('hidden');
            $('.contentDisplayDialog').show();
            $('.getRevisionHistoryDialog').hide();
            $('.getRevisionHistoryDialog textarea').val('');
        } catch (error) {
            console.error('获取修订记录失败:', error);
            showAlertDialog('获取修订记录失败: ' + error.message);
        }
    });

    // 取消获取修订记录
    $('#btnCancelGetRevisionHistory').on('click', function () {
        $('.getRevisionHistoryDialog').hide();
        $('.getRevisionHistoryDialog textarea').val('');
    });

    // ==================== 设置自定义属性相关代码 ====================
    // 设置自定义属性按钮点击事件
    $('#btnCustomProperties').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('设置自定义属性');
            return;
        }

        try {
            // 获取当前编辑器实例和文档信息
            const editor = await window.tabManager.getCurrentEditor();
            const {
                docCode
            } = await getCurrentDocumentInfo();

            // 重置对话框状态
            resetCustomPropertiesDialog();

            // 预填充病历编码
            $('#customPropsDocCode').val(docCode || '');

            // 显示对话框
            $('.customPropertiesDialog').show();
        } catch (error) {
            console.error('获取当前文档信息失败:', error);
            // 如果获取失败，仍然显示对话框
            resetCustomPropertiesDialog();
            $('.customPropertiesDialog').show();
        }
    });

    // 自定义属性模式切换
    $('input[name="customPropsMode"]').on('change', function () {
        const selectedMode = $(this).val();
        toggleCustomPropsMode(selectedMode);
    });

    // 数据类型切换事件
    $('input[name="dataTypeMode"]').on('change', function () {
        const selectedType = $(this).val();
        updateDataDialogByType(selectedType);
    });

    // 快速载入自定义属性示例
    $('.quick-link-customProps').on('click', function () {
        const type = $(this).data('type');
        const selectedMode = $('input[name="customPropsMode"]:checked').val();

        let exampleData = [];
        let $targetTextarea;

        if (selectedMode === 'add') {
            // 添加模式
            $targetTextarea = $('#customPropsData');

            if (type === 'example1') {
                exampleData = [{
                        "name": "patientId",
                        "value": "P123456789",
                    },
                    {
                        "name": "department",
                        "value": "心内科",
                    },
                    {
                        "name": "doctorId",
                        "value": "D001",
                    }
                ];
            } else if (type === 'example2') {
                exampleData = [{
                        "name": "templateVersion",
                        "value": "v2.1.0",
                    },
                    {
                        "name": "printMode",
                        "value": "landscape",
                    },
                    {
                        "name": "watermarkEnabled",
                        "value": true,
                    }
                ];
            }

            $targetTextarea.val(JSON.stringify(exampleData, null, 2));
        } else if (selectedMode === 'delete') {
            // 删除模式
            $targetTextarea = $('#customPropsDeleteNames');

            if (type === 'delete1') {
                exampleData = ["patientId", "department", "doctorId"];
            } else if (type === 'delete2') {
                exampleData = ["templateVersion", "printMode", "watermarkEnabled"];
            }

            $targetTextarea.val(JSON.stringify(exampleData, null, 2));
        } else if (selectedMode === 'get') {
            // 获取数据模式
            $targetTextarea = $('#customPropsGetParams');

            if (type === 'get1') {
                exampleData = ["patientId", "department", "doctorId"];
            } else if (type === 'get2') {
                exampleData = ["templateVersion", "printMode", "watermarkEnabled"];
            }

            $targetTextarea.val(JSON.stringify(exampleData, null, 2));
        }
    });

    // 确认设置自定义属性
    $('#btnConfirmCustomProps').on('click', async function () {
        const docCode = $('#customPropsDocCode').val().trim();
        const nodeId = $('#customPropsNodeId').val().trim();
        const selectedMode = $('input[name="customPropsMode"]:checked').val();

        let inputData = null;
        let inputText = '';

        if (selectedMode === 'add') {
            // 添加模式
            inputText = $('#customPropsData').val().trim();
            if (!inputText) {
                showAlertDialog('请输入自定义属性数据！');
                return;
            }

            try {
                inputData = JSON.parse(inputText);

                // 验证数据格式：应该是数组
                if (!Array.isArray(inputData)) {
                    showAlertDialog('自定义属性数据应该是数组格式！');
                    return;
                }
            } catch (e) {
                showAlertDialog('输入的内容不是有效的JSON格式！');
                return;
            }
        } else if (selectedMode === 'delete') {
            // 删除模式
            inputText = $('#customPropsDeleteNames').val().trim();
            if (!inputText) {
                showAlertDialog('请输入要删除的属性名称！');
                return;
            }

            try {
                inputData = JSON.parse(inputText);

                // 验证数据格式：应该是数组
                if (!Array.isArray(inputData)) {
                    showAlertDialog('要删除的属性名称应该是数组格式！');
                    return;
                }

                // 验证数组元素都是字符串
                if (!inputData.every(item => typeof item === 'string')) {
                    showAlertDialog('属性名称数组中的每个元素都应该是字符串！');
                    return;
                }
            } catch (e) {
                showAlertDialog('输入的内容不是有效的JSON格式！');
                return;
            }
        } else if (selectedMode === 'get') {
            // 获取数据模式
            inputText = $('#customPropsGetParams').val().trim();

            try {
                inputData = inputText ? JSON.parse(inputText) : [];

                // 验证数据格式：应该是对象
                if (!Array.isArray(inputData)) {
                    showAlertDialog('要获取的属性名称应该是数组格式！');
                    return;
                }
            } catch (e) {
                showAlertDialog('输入的内容不是有效的JSON格式！');
                return;
            }
        }

        try {
            // 获取编辑器实例
            const editor = await window.tabManager.getCurrentEditor();

            if (selectedMode === 'add') {
                // 添加模式：调用setCustomProperties方法
                if (editor && typeof editor.setCustomProperties === 'function') {
                    const params = {
                        code: docCode || '',
                        section: nodeId || '',
                        customProperty: inputData
                    };

                    editor.setCustomProperties(params);
                    showAlertDialog('自定义属性添加成功！');
                } else {
                    showAlertDialog('编辑器不支持setCustomProperties方法');
                }
            } else if (selectedMode === 'delete') {
                // 删除模式：调用deleteCustomProperties方法
                if (editor && typeof editor.deleteCustomProperties === 'function') {
                    const params = {
                        code: docCode || '',
                        section: nodeId || '',
                        propertyNames: inputData
                    };

                    editor.deleteCustomProperties(params);
                    showAlertDialog('自定义属性删除成功！');
                } else {
                    showAlertDialog('编辑器不支持deleteCustomProperties方法');
                }
            } else if (selectedMode === 'get') {
                // 获取数据模式：调用getCustomProperties方法
                if (editor && typeof editor.getCustomProperties === 'function') {
                    const params = {
                        code: inputData.code || docCode || '',
                        section: inputData.section || nodeId || '',
                        propertyNames: inputData
                    };

                    const result = await editor.getCustomProperties(params);

                    // 显示获取结果
                    $('#contentTitle').text('自定义属性数据');
                    $('#contentDisplay').val(JSON.stringify(result, null, 2));
                    // 隐藏"保存HTML原文"按钮
                    $('#btnSaveHtmlRaw').addClass('hidden');
                    $('.contentDisplayDialog').show();

                    showAlertDialog('自定义属性获取成功！');
                } else {
                    showAlertDialog('编辑器不支持getCustomProperties方法，该方法后续将实现');
                }
            }

            // 隐藏对话框并清空输入
            $('.customPropertiesDialog').hide();
            resetCustomPropertiesDialog();

        } catch (e) {
            console.error('操作自定义属性失败:', e);
            showAlertDialog('操作自定义属性失败: ' + e.message);
        }
    });

    // 取消设置自定义属性
    $('#btnCancelCustomProps').on('click', function () {
        $('.customPropertiesDialog').hide();
        resetCustomPropertiesDialog();
    });

    // 重置自定义属性对话框
    function resetCustomPropertiesDialog() {
        $('#customPropsDocCode').val('');
        $('#customPropsNodeId').val('');
        $('#customPropsData').val('');
        $('#customPropsDeleteNames').val('');
        $('#customPropsGetParams').val('');
        // 重置为添加模式
        $('input[name="customPropsMode"][value="add"]').prop('checked', true);
        toggleCustomPropsMode('add');
    }

    // 切换自定义属性操作模式
    function toggleCustomPropsMode(selectedMode) {
        const $title = $('#customPropsTitle');
        const $helpText = $('#customPropsHelpText');
        const $addGroup = $('#customPropsAddGroup');
        const $deleteGroup = $('#customPropsDeleteGroup');
        const $getGroup = $('#customPropsGetGroup');
        const $addLinks = $('.quick-link-customProps[data-type="example1"], .quick-link-customProps[data-type="example2"]');
        const $deleteLinks = $('.quick-link-customProps[data-type="delete1"], .quick-link-customProps[data-type="delete2"]');
        const $getLinks = $('.quick-link-customProps[data-type="get1"], .quick-link-customProps[data-type="get2"]');

        // 隐藏所有输入组和链接
        $addGroup.hide();
        $deleteGroup.hide();
        $getGroup.hide();
        $addLinks.hide();
        $deleteLinks.hide();
        $getLinks.hide();

        if (selectedMode === 'add') {
            // 添加模式
            $title.text('演示用 - 添加自定义属性');
            $helpText.text('添加文档的自定义属性信息');
            $addGroup.show();
            $addLinks.show();
        } else if (selectedMode === 'delete') {
            // 删除模式
            $title.text('演示用 - 删除自定义属性');
            $helpText.text('删除文档的指定自定义属性');
            $deleteGroup.show();
            $deleteLinks.show();
        } else if (selectedMode === 'get') {
            // 获取数据模式
            $title.text('演示用 - 获取自定义属性');
            $helpText.text('获取文档的自定义属性数据');
            $getGroup.show();
            $getLinks.show();
        }
    }
});

// 根据病历名称获取病历类型
function getRecordInfo(recordName) {
    return recordInfo = recordMapData.find(item => {
        if (Array.isArray(recordName)) {
            return item.recordName.includes(recordName);
        }
        return item.recordName === recordName;
    });
}

// 控制AI相关按钮状态
function controlAiButtons(enabled) {
    const aiButtons = ['#btnHmAiAuth', '#btnHmAiGen', '#btnNodeGen', '#btnDocGen', '#btnGenerateDocumentDirect', '#btnHmAiQc', '#btnHmAiToken'];
    aiButtons.forEach(btnId => {
        if (enabled) {
            $(btnId).prop('disabled', false).removeClass('next-feature-btn');
        } else {
            $(btnId).prop('disabled', true).addClass('next-feature-btn');
        }
    });
}
// 格式化质控提醒参数
function formatQualityRemindParams(params) {
    // 格式化病历列表
    const progressNoteList = params.progressNoteList.map(item => {
        return {
            progressGuid: item.progressGuid, // 病历唯一标识
            progressTypeName: item.progressTypeName, // 病历类型名称
            progressType: item.progressType, // 病历类型编码
            doctorGuid: item.doctorGuid, // 医生ID
            doctorName: item.doctorName, // 医生姓名
            progressMessage: item.progressMessage, // 病历内容
            msgType: item.msgType // 消息类型
        };
    });

    // 返回格式化后的参数对象
    return {
        userGuid: params.userGuid, // 用户ID
        serialNumber: params.serialNumber, // 就诊流水号
        caseNo: params.caseNo, // 病案号
        currentBedCode: params.currentBedCode, // 当前床号
        patientName: params.patientName, // 患者姓名
        doctorGuid: params.doctorGuid, // 医生ID
        doctorName: params.doctorName, // 医生姓名
        admissionTime: params.admissionTime, // 入院时间
        inpatientDepartment: params.inpatientDepartment, // 住院科室
        inpatientArea: params.inpatientArea, // 病区
        inpatientDepartmentId: params.inpatientDepartmentId, // 科室ID
        divisionId: params.divisionId, // 病区ID
        pageSource: params.pageSource, // 页面来源
        openInterdict: params.openInterdict, // 是否开启拦截
        triggerSource: params.triggerSource, // 触发来源
        patientInfo: {
            gender: params.patientInfo.gender, // 性别
            birthDate: params.patientInfo.birthDate, // 出生日期
            age: params.patientInfo.age, // 年龄
            ageType: params.patientInfo.ageType, // 年龄单位
            maritalStatus: params.patientInfo.maritalStatus, // 婚姻状况
            pregnancyStatus: params.patientInfo.pregnancyStatus // 妊娠状态
        },
        progressNoteList: progressNoteList // 病历列表
    };
}

/** 演示主工具栏中「普通」按钮 id 顺序（与 index.html 一致，不含 AI 区） */
var TOOLBAR_REGULAR_BUTTON_IDS = [
    'btnInsertDoc', 'btnDeleteDoc', 'btnSetData', 'btnInsertDataAtCursor', 'btnInsertImageAtCursor',
    'btnInsertHtml', 'btnMenu', 'btnReadOnly', 'btnRevise', 'btnShowTools', 'btnWatermark',
    'btnGetHtml', 'btnGetText', 'btnGetMetaData', 'btnExportPdf', 'btnCustomProperties',
    'btnRevisionHistory', 'btnMultiPartHeader', 'btnSetTablePerssion', 'btnSetTableRowData', 'btnInsMetaData',
    'btnFocusElement', 'btnGetSelectedElement', 'btnGetSelectedContent'
];

function closeDemoToolbarDropdowns() {
    $('#toolbarMorePanel, #toolbarAiPanel').hide();
    $('.demo-toolbar-dd.is-open').removeClass('is-open');
    $('#btnToolbarMore, #btnToolbarAi').attr('aria-expanded', 'false');
}

/** 测量按钮在工具栏样式下的 outerWidth（含 margin） */
function measureToolbarButtonWidths(nodes, $measureHost) {
    var widths = [];
    var i;
    // 用 detach 保留按钮已有的 jQuery 事件，避免「更多」中按钮失效
    $measureHost.children().detach();
    for (i = 0; i < nodes.length; i++) {
        $measureHost.append(nodes[i]);
        widths.push($(nodes[i]).outerWidth(true));
    }
    $measureHost.children().detach();
    return widths;
}

/** 从 startIdx 起在 maxW 内能放下几个按钮（宽度数组与 nodes 对齐） */
function countToolbarWidthsFit(widths, startIdx, maxW, gap) {
    var used = 0;
    var n = 0;
    var i;
    for (i = startIdx; i < widths.length; i++) {
        var w = widths[i];
        var next = used + (n > 0 ? gap : 0) + w;
        if (next > maxW) {
            break;
        }
        used = next;
        n++;
    }
    return n;
}

/**
 * 固定两行：第一行 #centerBtnRow1；第二行 #centerBtnRow2 + 「更多」「AI方法」。
 * 用宽度预算分配，避免 offsetTop 误判第三行；「更多」展开后宽度变化会经溢出修正收敛。
 */
function updateCenterBtnToolbar() {
    var $row1 = $('#centerBtnRow1');
    var $row2 = $('#centerBtnRow2');
    var $more = $('#toolbarMorePanel');
    var $moreWrap = $('#toolbarMoreWrap');
    var $cluster = $('.center-toolbar-dd-cluster');
    var $wrap = $('.center-btn-wrapper');
    if (!$row1.length || !$row2.length || !$more.length || !$moreWrap.length || !$wrap.length || !$cluster.length) {
        return;
    }
    closeDemoToolbarDropdowns();

    var gap = 8;
    var nodes = [];
    var j;
    for (j = 0; j < TOOLBAR_REGULAR_BUTTON_IDS.length; j++) {
        var el = document.getElementById(TOOLBAR_REGULAR_BUTTON_IDS[j]);
        if (el) {
            nodes.push(el);
        }
    }
    if (!nodes.length) {
        return;
    }

    var widths = measureToolbarButtonWidths(nodes, $row1);
    // 不能用 empty()，否则会清理按钮 click 事件
    $row1.children().detach();
    $row2.children().detach();
    $more.children().detach();

    var W = $wrap[0].clientWidth - 4;
    if (W < 80) {
        W = 600;
    }

    function readClusterWidth(morePanelHasItems) {
        if (morePanelHasItems) {
            $moreWrap.removeClass('is-empty');
        } else {
            $moreWrap.addClass('is-empty');
        }
        return $cluster.outerWidth(true) || (morePanelHasItems ? 200 : 110);
    }

    var cwNoMore = readClusterWidth(false);
    var n1a = countToolbarWidthsFit(widths, 0, W, gap);
    var n2a = countToolbarWidthsFit(widths, n1a, Math.max(48, W - cwNoMore - gap), gap);
    var needMore = n1a + n2a < nodes.length;
    var cw = readClusterWidth(needMore);
    var n1 = countToolbarWidthsFit(widths, 0, W, gap);
    var n2 = countToolbarWidthsFit(widths, n1, Math.max(48, W - cw - gap), gap);
    if (n1 + n2 < nodes.length) {
        cw = readClusterWidth(true);
        n1 = countToolbarWidthsFit(widths, 0, W, gap);
        n2 = countToolbarWidthsFit(widths, n1, Math.max(48, W - cw - gap), gap);
    }

    for (j = 0; j < n1; j++) {
        $row1.append(nodes[j]);
    }
    for (j = n1; j < n1 + n2; j++) {
        $row2.append(nodes[j]);
    }
    for (j = n1 + n2; j < nodes.length; j++) {
        $more.append(nodes[j]);
    }

    if ($more.children().length) {
        $moreWrap.removeClass('is-empty');
    } else {
        $moreWrap.addClass('is-empty');
    }

    var safety = 60;
    while (safety-- > 0) {
        var fixed = false;
        var r1 = $row1[0];
        var r2 = $row2[0];
        if (r2 && r2.scrollWidth > r2.clientWidth + 1 && $row2.children().length) {
            $more.prepend($row2.children().last());
            $moreWrap.removeClass('is-empty');
            fixed = true;
        }
        if (r1 && r1.scrollWidth > r1.clientWidth + 1 && $row1.children().length) {
            var $last1 = $row1.children().last();
            if ($row2.children().length) {
                $row2.prepend($last1);
            } else {
                $more.prepend($last1);
                if ($more.children().length) {
                    $moreWrap.removeClass('is-empty');
                }
            }
            fixed = true;
        }
        if (!fixed) {
            break;
        }
    }

    if ($more.children().length === 0) {
        $moreWrap.addClass('is-empty');
    }
}

function toggleLeftPanelIcon() {
    // 可选：切换按钮图标方向
    if ($('.left-panel').hasClass('collapsed')) {
        $('.left-panel').find('.toggle-left-panel-btn i').removeClass('fa-toggle-left').addClass('fa-toggle-right');
    } else {
        $('.left-panel').find('.toggle-left-panel-btn i').removeClass('fa-toggle-right').addClass('fa-toggle-left');
    }
}

function maysonAutoHeight(bean) {
    if (window.mayson && window.mayson.currAction.state > 1) {
        window.mayson.$maysonSize.middle.height = $("#assistantSmartPanel").height();
        MaysonWindow = document.getElementById('hm-mayson-iframe-part').contentWindow
        if (window.mayson.setAutoHeight2) {
            window.mayson.setAutoHeight2()
        } else {
            try {
                window.mayson.setAutoHeight2 = function () {
                    var _tm = this;
                    _tm.el = $(MaysonWindow.document).find("#hm_base_home");
                    _tm.el.find('#hm_intell_popup_content').css({
                        height: _tm.$maysonSize.middle.height
                    });
                    var headerHeight = _tm.el.find("#hm_intell_popup_header").height(),
                        footerHeight = _tm.el.find("#hm_popup_footer").height();
                    var conHeight = _tm.$maysonSize.middle.height - headerHeight - 2;
                    _tm.rightCom.css({
                        width: _tm.$maysonSize.middle.width - 5,
                        height: conHeight
                    });
                    _tm.rightComScorllPanel.css({
                        height: conHeight
                    })
                    _tm.el.find('#hm_intell_popup_body').css({
                        height: conHeight
                    });
                    _tm.conHeight = conHeight - footerHeight
                    _tm.el.find('#hm_popup_body').css({
                        height: _tm.conHeight
                    });
                    _tm.el.find('#hm_popup_body_right').css({ // 设置内容区最小高度，使版本信息位置保持在最底部
                        'min-height': conHeight - 36 + 'px',
                        'height': 'auto'
                    });
                    window.mayson.MaysonQuality.calculationHomeHeight();
                }
                window.mayson.setAutoHeight2();
            } catch (e) {}
        }
        $('#hm-mayson-iframe-part').height($("#assistantSmartPanel").height());
    }
}

function maysonListenWindowSize() {
    window.mayson.listenWindowSize = function (bean) {
        if (bean.state > 1) {
            $("#hm-mayson-iframe-part").css({
                position: 'static',
            })
            $('.smart-remind-content').hide();
            if (bean.state == 3) {
                $('.left-panel').addClass('collapsed');
            }
            toggleLeftPanelIcon();
            maysonAutoHeight();
        } else {
            $('.smart-remind-content').show();
            $("#hm-mayson-iframe-part").css({
                position: 'absolute',
                right: '0',
                bottom: '6px'
            })
        }
        autoRightPanel(bean);
    };
    window.mayson.listenViewData = function (data) {
        const temp = data[0] || {};

        // 处理外部链接类型
        if (['11', '12', '18'].includes(temp.type)) {
            if (temp.items && temp.items[0] && temp.items[0].text) {
                window.open(temp.items[0].text);
            }
            return;
        }

        // 处理AI质控推荐规则类型
        if (temp.type === '39') {
            const ruleId = temp.items && temp.items[0] && temp.items[0].id;
            if (!ruleId) {
                console.warn('AI质控规则ID为空');
                return;
            }
            window.tabManager.getCurrentEditor().then(function (editor) {
                // 调用ai辅助修正方法
                editor.aiAssistCorrect(ruleId);
            });
        }
        if (temp.type == '40') {
            // 处理大模型生成的报表图片
            var imgSrc = temp.items && temp.items[0] && temp.items[0].src;
            // 回写到光标位置
            window.tabManager.getCurrentEditor().then(function (editor) {
                // 调用新的插入图片方法
                editor.insertImageAtCursor({
                    src: imgSrc,
                    width: '514',
                    height: 'auto'
                });
            });
        }
    }
}

function autoRightPanel(bean) {
    if (bean) {
        // 直接生成时，默认打开右侧面板
        $('.assistant-float-tab-btn[data-tab="smart"]').click();
        $('.assistant-block').css({
            'width': bean.width + 'px'
        });
    }
}
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
    $('#goLoadDocBtn').on('click', function () {
        $('#editorNotOpenDialog').remove();
        if (typeof onLoadDoc === 'function') {
            onLoadDoc();
        } else {
            // 自动触发"加载文档"按钮点击
            var $btn = $('#btnAddTab');
            if ($btn.length) $btn[0].click();
        }
    });
    $('#cancelEditorNotOpenBtn').on('click', function () {
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

/**
 * 更新插入数据元按钮状态
 * 只有在制作模板模式(designMode=true)时才启用
 */
function updateInsertDataElementBtnState() {
    const $btnInsMetaData = $('#btnInsMetaData');

    // 检查是否有活动的tab
    if (!window.tabManager || !window.tabManager.currentTabId) {
        $btnInsMetaData.prop('disabled', true).addClass('disabled');
        return;
    }

    // 获取当前tab的编辑器信息
    const currentTabEditor = window.tabManager.editors[window.tabManager.currentTabId];

    // 检查是否为设计模式
    if (currentTabEditor && currentTabEditor.designMode === true) {
        $btnInsMetaData.prop('disabled', false).removeClass('disabled next-feature-btn');
    } else {
        $btnInsMetaData.prop('disabled', true).addClass('disabled next-feature-btn');
    }
}

// 通用alert弹框，只有一个确认按钮
function showAlertDialog(msg, onOk) {
    $('#customAlertMsg').text(msg);
    $('#customAlertDialog').css('display', 'flex');
    $('#alertOkBtn').off('click').on('click', function () {
        $('#customAlertDialog').hide();
        if (typeof onOk === 'function') onOk();
    });
}

// AI认证初始化方法
async function initAiAuth(docCode) {
    // 检查并等待AI令牌设置完成
    // console.log('准备调用waitForValidAiToken...');
    const tokenValid = await waitForValidAiToken();
    // console.log('waitForValidAiToken执行完成，结果:', tokenValid);

    // 如果用户取消了令牌设置，直接返回
    if (tokenValid === false) {
        console.log('用户取消了AI令牌设置');
        return;
    }

    // console.log('AI令牌验证完成，开始执行认证流程');

    const node = findNodeByDocCode(docCode, window.aiDocumentTreeData);
    const serialNumber = node ? node.serialNumber : '';
    const aiParam = window.aiParams[docCode];
    const urlParams = new URLSearchParams(window.location.search);
    const ai = urlParams.get('ai');
    const params = {
        "aiServer": window.aiServer,
        "authToken": localStorage.getItem('HMAccessToken'),
        "userGuid": aiParam['userGuid'],
        "userName": '演示用户',
        "doctorGuid": 'hmpm',
        "serialNumber": serialNumber,
        "department": "演示科室",
        "doctorName": "pm",
        "hospitalGuid": "1001",
        "hospitalName": "惠每医生团队",
        "customEnv": "1",
        "flag": "m"
    };
    // 使用Promise处理认证初始化
    await HMEditorLoader.aiAuth(params, params.recordMap || recordMapData, false, ai);
    window.isInitHMAuth = true;
    ai == 1 && maysonListenWindowSize(); // mayson 内嵌展示，先不发布
    showQualityRemindSet(docCode, node);
}

// 等待AI令牌设置完成的函数
function waitForValidAiToken() {
    return new Promise((resolve) => {
        // console.log('开始等待AI令牌设置...');

        const checkToken = () => {
            const token = localStorage.getItem('HMAccessToken');
            // console.log('检查AI令牌:', token ? '存在' : '不存在');

            let valid = true;

            if (!token) {
                valid = false;
                // console.log('AI令牌不存在，设置为无效');
            } else {
                // console.log('AI令牌存在，开始验证...');
                // 验证AI令牌
                valid = checkAiToken(token);
                // console.log('checkAiToken返回结果:', valid);
            }

            // console.log('AI令牌验证最终结果:', valid);

            if (!valid) {
                // console.log('AI令牌无效，显示设置对话框');
                // 显示设置AI令牌的对话框
                showAlertDialog('请先设置AI令牌', function () {
                    // console.log('用户点击确定，打开AI令牌设置对话框');
                    // 点击确定后直接打开AI令牌设置对话框
                    $('.aiTokenDialog').show();

                    // 监听AI令牌设置完成事件
                    const handleTokenSet = () => {
                        // console.log('检测到AI令牌设置完成事件');
                        // 移除事件监听器
                        $(document).off('aiTokenSet.tokenSet');
                        $('#btnCloseAiToken').off('click.tokenSet');

                        // 直接继续执行，因为设置按钮已经验证过令牌了
                        // console.log('AI令牌设置完成，直接继续执行');
                        resolve(true); // 令牌有效，继续执行
                    };

                    // console.log('绑定aiTokenSet事件监听器');
                    // 绑定设置完成事件
                    $(document).on('aiTokenSet.tokenSet', handleTokenSet);
                    $('#btnCloseAiToken').on('click.tokenSet', () => {
                        // console.log('用户取消AI令牌设置');
                        // 移除事件监听器
                        $(document).off('aiTokenSet.tokenSet');
                        $('#btnCloseAiToken').off('click.tokenSet');
                        // 用户取消设置，直接拒绝Promise
                        resolve(false);
                    });
                });
            } else {
                // console.log('AI令牌有效，直接继续执行');
                resolve(true); // 令牌有效，继续执行
            }
        };

        checkToken();
    });
}

function checkAiToken(token) {
    // console.log('开始验证AI令牌:', token ? token.substring(0, 10) + '...' : 'null');

    // 验证AI令牌
    var valid = false;
    $.ajax({
        url: window.aiServer + "/aigc/recommend/cdss_stream_chat",
        type: "POST",
        headers: {
            "Authorization": "Bearer " + token
        },
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({}),
        async: false, // 设置为同步请求
        success: function (result) {
            // console.log('AI认证检查结果:', result);
            if (result.code == 200) {
                valid = true;
                // console.log('AI令牌验证成功');
            } else {
                valid = false;
                console.log('AI令牌验证失败，code:', result.code);
            }
        },
        error: function (error) {
            // console.error('AI令牌验证请求失败:', error);        
            valid = false;
        }
    });

    // console.log('AI令牌验证最终结果:', valid);
    return valid;
}

// 通过docCode查找node节点的辅助函数
function findNodeByDocCode(docCode, treeData) {
    function searchInTree(nodes) {
        for (const node of nodes) {
            if (node.docCode === docCode) {
                return node;
            }
            if (node.children && node.children.length > 0) {
                const result = searchInTree(node.children);
                if (result !== undefined) {
                    return result;
                }
            }
        }
        return undefined;
    }

    return searchInTree(treeData || []);
}

// 质控提醒设置
/**
 * 更新病历文本内容到params中
 * @param {Object} editor - 编辑器实例
 * @param {string} docCode - 文档代码
 * @param {Object} params - 参数对象
 * @returns {Object} 更新后的params对象
 */
async function updateProgressMessage(editor, docCode, params) {
    // 动态获取当前病历的文本内容
    try {
        const textContent = await editor.getDocText(docCode);

        // 更新 progressNoteList 中的 progressMessage
        if (params && params.progressNoteList && params.progressNoteList.length > 0) {
            // 提取文本内容，如果返回的是对象数组，则获取第一个对象的text字段
            let progressMessage = '';
            if (Array.isArray(textContent) && textContent.length > 0) {
                progressMessage = textContent[0].text || '';
            } else if (typeof textContent === 'string') {
                progressMessage = textContent;
            } else if (textContent && textContent.text) {
                progressMessage = textContent.text;
            }

            // 更新第一个病历记录的progressMessage
            params.progressNoteList[0].progressMessage = progressMessage;
            console.log('已动态获取病历文本内容，长度:', progressMessage.length);
        }
    } catch (error) {
        console.error('动态获取病历文本失败:', error);
        // 如果获取失败，继续使用原有的progressMessage
    }

    return params;
}

async function showQualityRemindSet(docCode, node) {
    let params = window.aiParams[docCode];
    const editor = await window.tabManager.getCurrentEditor();
    const recordType = node ? node.recordType : 1;

    // 使用公共方法更新params
    params = await updateProgressMessage(editor, docCode, params);

    const params1 = {
        recordType: recordType,
        progressGuid: docCode
    };
    await editor.aiActive(params1);

    // 调用hmAi.qc方法
    await editor.qc(params);
    const bean = formatQualityRemindParams(params);
    const urlParams = new URLSearchParams(window.location.search);
    const ai = urlParams.get('ai');
    if (ai == 1) {
        window.mayson && window.mayson.ai(bean);
        // 默认打开智能提醒tab栏
        $('.assistant-float-tab-btn[data-tab="smart"]').click();
    }
    // console.log(bean);
    // mayson 内嵌展示，先不发布
    // window.mayson && window.mayson.ai(bean);
    // 默认打开智能提醒tab栏
    // $('.assistant-float-tab-btn[data-tab="smart"]').click();
}
// 格式化质控提醒参数
function formatQualityRemindParams(params) {
    return {
        userGuid: params.userGuid || '',
        serialNumber: params.serialNumber || '',
        caseNo: params.caseNo || '',
        currentBedCode: params.currentBedCode || '',
        patientName: params.patientName,
        doctorGuid: params.doctorGuid || '',
        doctorName: params.doctorName || '',
        admissionTime: params.admissionTime || '',
        inpatientDepartment: params.inpatientDepartment || '',
        inpatientArea: params.inpatientArea || '',
        inpatientDepartmentId: params.inpatientDepartmentId || '',
        pageSource: params.pageSource || '',
        openInterdict: params.openInterdict,
        triggerSource: params.triggerSource,
        patientInfo: {
            gender: params.patientInfo.gender,
            birthDate: params.patientInfo.birthDate,
            age: params.patientInfo.age,
            ageType: params.patientInfo.ageType,
            maritalStatus: params.patientInfo.maritalStatus || 2,
            pregnancyStatus: params.patientInfo.pregnancyStatus
        },
        progressNoteList: params.progressNoteList
    };
}

// ==================== 工具栏快捷键控制脚本 ====================
// 工具栏显示状态
let btnPanelVisible = true;

// 键盘事件监听器
document.addEventListener('keydown', function (event) {
    // Ctrl + Shift + -> 切换工具栏显示/隐藏
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'ArrowRight') {
        event.preventDefault(); // 阻止默认行为
        toggleBtnPanel();
    }

    // ESC 键隐藏工具栏
    if (event.key === 'Escape' && btnPanelVisible) {
        hideBtnPanel();
    }
});

// 切换工具栏显示/隐藏
function toggleBtnPanel() {
    const btnPanel = document.getElementById('btnPanel');
    if (btnPanelVisible) {
        hideBtnPanel();
    } else {
        showBtnPanel();
    }
}

// 显示工具栏
function showBtnPanel() {
    const btnPanel = document.getElementById('btnPanel');
    btnPanel.style.display = 'flex'; // 使用flex而不是block，保持原有布局
    btnPanelVisible = true;
    setTimeout(function () {
        if (typeof updateCenterBtnToolbar === 'function') {
            updateCenterBtnToolbar();
        }
    }, 0);
    console.log('工具栏已显示 - 快捷键: Ctrl+Shift+-> 切换, ESC 隐藏');
}

// 隐藏工具栏
function hideBtnPanel() {
    const btnPanel = document.getElementById('btnPanel');
    btnPanel.style.display = 'none';
    btnPanelVisible = false;
    console.log('工具栏已隐藏 - 快捷键: Ctrl+Shift+-> 显示');
}

// 监听DOM变化，确保工具栏状态不被其他代码影响
const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const btnPanel = document.getElementById('btnPanel');
            if (btnPanel && !btnPanelVisible && btnPanel.style.display !== 'none') {
                // 如果工具栏应该是隐藏的，但被其他代码修改了样式，重新隐藏
                setTimeout(() => {
                    if (!btnPanelVisible) {
                        btnPanel.style.display = 'none';
                    }
                }, 0);
            }
        }
    });
});

// 初始化工具栏快捷键控制
function initToolbarShortcuts() {
    // 开始观察DOM变化
    const btnPanel = document.getElementById('btnPanel');
    if (btnPanel) {
        observer.observe(btnPanel, {
            attributes: true,
            attributeFilter: ['style']
        });
    }

    console.log('工具栏默认显示 - 使用快捷键 Ctrl+Shift+-> 切换显示/隐藏');
    // 可选：显示一个临时的提示信息
    setTimeout(function () {
        console.log('💡 提示: 工具栏默认显示，按 Ctrl+Shift+-> 可以切换显示/隐藏，按 ESC 可以隐藏工具栏');
    }, 1000);
}

// ==================== 获取当前文档信息的公共方法 ====================
/**
 * 获取当前文档信息
 * @returns {Promise<{docCode: string, serialNumber: string}>} 返回包含docCode和serialNumber的对象
 */
async function getCurrentDocumentInfo() {
    let docCode = '';
    let serialNumber = '';
    let recordName = '';

    // 尝试从当前激活的tab获取文档信息
    if (window.tabManager && window.tabManager.currentTabId) {
        const $currentTab = window.tabManager.tabHeader.find(`.tab-item[data-id="${window.tabManager.currentTabId}"]`);
        serialNumber = $currentTab.data('serial-number') || '';

        // 尝试从当前编辑器内容中获取doc_code
        try {
            const editor = await window.tabManager.getCurrentEditor();
            if (editor && editor.editor) {
                const $body = $(editor.editor.document.getBody().$);
                let $docElement = $body.find('div[data-hm-widgetid].focused').first();
                if ($docElement.length === 0 && window.lastClickedDocCode) {
                    $docElement = $body.find(`div[data-hm-widgetid="${window.lastClickedDocCode}"]`).first();
                }
                if ($docElement.length === 0) {
                    $docElement = $body.find('div[data-hm-widgetid]').first();
                }
                if ($docElement.length === 0) {
                    $docElement = $body.find('[doc_code]').first();
                }
                if ($docElement.length > 0) {
                    docCode = $docElement.attr('data-hm-widgetid') || $docElement.attr('doc_code') || '';
                    recordName = $docElement.attr('data-hm-widgetname') || '';
                    console.log('从编辑器内容获取到docCode:', docCode);
                }
                if (!docCode) {
                    docCode = $body.attr('doc_code') || window.lastClickedDocCode || '';
                }
            }
        } catch (error) {
            console.log('从编辑器获取docCode失败:', error);
        }
    }
    return {
        docCode: docCode,
        serialNumber: serialNumber,
        recordName: recordName
    };
}

/**
 * 检查指定文档的只读状态
 * @param {Object} editor 编辑器实例
 * @param {String} docCode 文档唯一编号
 * @returns {Boolean} 如果文档为只读状态返回true，否则返回false
 */
function checkDocumentReadOnlyStatus(editor, docCode) {
    try {
        if (!editor || !editor.editor || !docCode) {
            return false;
        }

        const $body = $(editor.editor.document.getBody().$);

        // 查找指定docCode的文档元素
        const $docElement = $body.find(`[data-hm-widgetid="${docCode}"]`);

        if ($docElement.length === 0) {
            console.warn(`未找到docCode为 ${docCode} 的文档元素`);
            return false;
        }

        // 检查文档是否设置了只读状态
        // 1. 检查contenteditable属性是否为false
        const isContentEditableFalse = $docElement.prop('contenteditable') === false;

        // 2. 检查是否有只读背景色类
        const hasReadOnlyBgColor = $docElement.find('.hm-readonly-bgcolor').length > 0 ||
            $docElement.hasClass('hm-readonly-bgcolor');

        // 3. 检查文档内容是否可编辑
        const isEditable = $docElement.find('[contenteditable="true"]').length > 0;

        // 如果文档设置了contenteditable为false或有只读背景色，且没有可编辑内容，则认为文档为只读状态
        const isReadOnly = (isContentEditableFalse || hasReadOnlyBgColor) && !isEditable;
        return isReadOnly;

    } catch (error) {
        console.error('检查文档只读状态失败:', error);
        return false;
    }
}

// 页面初始化时设置插入数据元按钮状态
$(document).ready(function () {
    // 初始化时禁用插入数据元按钮，因为没有打开任何标签页
    updateInsertDataElementBtnState();
});

/**
 * 自动打开当前激活tab的第一份文档
 */
function autoOpenFirstDocument() {
    // 延迟执行，确保DOM和组件都已初始化完成
    setTimeout(() => {
        try {
            // 获取当前激活的tab类型
            const activeTab = $('.tree-tab.active').data('tab');

            if (activeTab === 'ai') {
                // AI病历演示tab
                openFirstDocumentFromTree(window.aiDocumentTreeData, window.aiDocumentTree);
            } else if (activeTab === 'normal') {
                // 常用病历模板tab
                openFirstDocumentFromTree(window.documentTreeData, window.documentTree);
            }
        } catch (error) {
            console.error('自动打开第一份文档失败:', error);
        }
    }, 1000); // 延迟1秒执行，确保所有组件都已初始化
}

/**
 * 从指定文档树中打开第一份文档
 * @param {Array} treeData - 文档树数据
 * @param {Object} treeInstance - 文档树实例
 */
function openFirstDocumentFromTree(treeData, treeInstance) {
    if (!treeData || !treeData.length > 0) {
        console.warn('文档树数据为空');
        return;
    }

    let firstDocument = null;
    let categoryName = '';

    // 判断数据结构类型
    const firstItem = treeData[0];

    // 通过serialNumber字段区分数据结构：aiDocumentTreeData的顶层有serialNumber，documentTreeData的顶层没有
    if (firstItem.serialNumber) {
        // AI病历演示结构：病人 -> 病历分类文件夹 -> 文档
        const firstPatient = firstItem;
        const firstRecordCategory = firstPatient.children[0];

        if (firstRecordCategory && firstRecordCategory.children && firstRecordCategory.children.length > 0) {
            const firstDoc = firstRecordCategory.children[0];

            if (firstDoc && firstDoc.type === 'file-edit' && firstDoc.docCode) {
                firstDocument = firstDoc;
                categoryName = `${firstPatient.docName} - ${firstRecordCategory.docName}`;
            }
        }
    } else if (firstItem.type === 'folder' && firstItem.children && firstItem.children.length > 0) {
        // 普通病历模板结构：直接是分类文件夹
        const firstCategory = firstItem;
        const firstDoc = firstCategory.children[0];

        if (firstDoc && firstDoc.type === 'file-edit' && firstDoc.docCode) {
            firstDocument = firstDoc;
            categoryName = firstCategory.docName;
        }
    }

    if (firstDocument && firstDocument.docCode) {
        console.log('自动打开第一份文档:', {
            categoryName: categoryName,
            documentName: firstDocument.docName,
            docCode: firstDocument.docCode
        });

        // 模拟点击第一个文档节点
        const $firstNode = treeInstance.container.find(`[data-doc-code="${firstDocument.docCode}"]`);
        if ($firstNode.length > 0) {
            $firstNode.find('.tree-node-content').click();
        } else {
            console.warn('未找到对应的DOM节点，尝试通过程序方式打开');
            // 如果找不到DOM节点，直接调用文档加载方法
            const docParams = [{
                "code": firstDocument.docCode,
                "docTplName": firstDocument.docName,
                "docContent": "",
                "serialNumber": firstDocument.serialNumber || '',
                "recordName": firstDocument.recordName || ''
            }];

            // 如果有文档路径，先加载内容
            if (firstDocument.docPath) {
                $.get(firstDocument.docPath)
                    .done((htmlContent) => {
                        docParams[0].docContent = htmlContent;
                        treeInstance.onDocumentLoaded(docParams);
                    })
                    .fail((jqXHR, textStatus, errorThrown) => {
                        console.error('自动加载文档内容失败:', errorThrown);
                        // 即使加载失败，也尝试打开文档
                        treeInstance.onDocumentLoaded(docParams);
                    });
            } else {
                treeInstance.onDocumentLoaded(docParams);
            }
        }
    } else {
        console.warn('未找到可打开的文档');
    }
}