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
     * @param {String} serialNumber 序列号
     * @returns {Promise} 返回Promise对象
     */
    async createTab(title, editorOptions = {}, content = null, docParam = {}) {
        console.log('docParam', docParam)
        this.tabCounter++;
        const tabId = 'tab_' + this.tabCounter;
        const editorId = 'editor_' + this.tabCounter;

        // 创建标签和内容容器
        const tabItem = $(`<div class="tab-item" data-id="${tabId}" data-serial-number="${docParam.serialNumber||''}">${title}<span class="tab-close-btn">×</span></div>`);
        const tabContent = $(`<div class="tab-content" data-id="${tabId}" data-name="${title.trim()}" data-record-name="${docParam.recordName||''}" data-serial-number="${docParam.serialNumber||''}"><div id="${editorId}" class="editor-container"></div></div>`);

        // 添加标签和内容
        this.tabHeader.append(tabItem);
        this.tabContents.append(tabContent);

        // 显示新标签
        this.activateTab(tabId);
        // 创建编辑器
        try {
            const mergedOptions = Object.assign({}, {
                container: `#${editorId}`,
                id: editorId,
                style: {
                    width: '100%',
                    height: '100%',
                    border: '1px solid #ddd'
                }
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

        // 获取当前标签页的serialNumber
        const $currentTab = this.tabHeader.find(`.tab-item[data-id="${tabId}"]`);
        const serialNumber = $currentTab.data('serial-number') || '';

        // 根据serialNumber状态控制AI相关按钮
        controlAiButtons(!!serialNumber);

        // 自动滚动tab-header，使新tab可见
        setTimeout(() => {
            this.scrollTabIntoView(tabId);
        }, 0);
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
        console.log('文档加载完成:', docParam);
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
            console.log('调用initAiAuth，docCode:', docParam[0].code);
            await initAiAuth(docParam[0].code);
            console.log('initAiAuth执行完成');
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

    // 初始化工具栏快捷键控制
    initToolbarShortcuts();

    // 页面加载时默认隐藏工具栏（因为默认选中AI病历演示）
    hideBtnPanel();

    // 添加tab切换逻辑
    $('.tree-tab').on('click', function () {
        const tabType = $(this).data('tab');

        // 移除所有活动状态
        $('.tree-tab').removeClass('active');
        $('.tree-tab-content').removeClass('active');

        // 激活当前tab
        $(this).addClass('active');
        if (tabType === 'normal') {
            $('#normalDocumentTree').addClass('active');
            // 选中"常用病历模板"时显示工具栏
            showBtnPanel();
        } else if (tabType === 'ai') {
            $('#aiDocumentTree').addClass('active');
            // 选中"AI病历演示"时隐藏工具栏
            hideBtnPanel();
        }

        console.log('切换到', tabType === 'normal' ? '普通病历' : 'AI病历', '文档列表');
    });

    window.aiServer = (window.location.host.includes('editor.huimei.com')) ?
        'https://editor.huimei.com' :
        'http://172.16.8.150';

    console.log('AI Server:', window.aiServer);

    // 绑定按钮事件
    $('#btnAddTab').on('click', function () {
        // 显示文档信息输入对话框
        $('.documentInfo').show();

        // 默认总是选中"在新标签中打开"选项
        $('#openInNewTab').prop('checked', true);
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
    //只读模式
    $('#btnReadOnly').on('click', async function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('只读模式');
            return;
        }
        // 重置弹窗状态
        $('#readOnlyCode').val('');
        $('#readOnlyFlag').prop('checked', false);
        // 同步开关按钮的样式状态
        const slider = $('#readOnlyFlag').siblings('.slider');
        const sliderCircle = slider.find('.slider-circle');
        const labelText = $('#readOnlyFlag').closest('label').find('.switch-label-text');
        slider.css('background-color', '#ccc');
        sliderCircle.css('transform', 'translateX(0)');
        labelText.text('关闭');
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
    });

    // 确认设置修订模式
    $('#btnConfirmRevise').on('click', async function () {
        try {
            const isReviseMode = $('#reviseFlag').is(':checked');
            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocReviseMode(isReviseMode);

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
            showAlertDialog('获取HTML失败: ' + e.message);
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
            const isReadOnly = $('#readOnlyFlag').is(':checked');

            const editor = await window.tabManager.getCurrentEditor();
            editor.setDocReadOnly(code, isReadOnly);

            // 隐藏对话框并清空输入
            $('.readOnlyDialog').hide();
            $('#readOnlyCode').val('');

        } catch (e) {
            console.error('设置只读模式失败:', e);
            showAlertDialog('设置只读模式失败: ' + e.message);
        }
    });

    // 取消设置只读模式
    $('#btnCancelReadOnly').on('click', function () {
        $('.readOnlyDialog').hide();
        $('#readOnlyCode').val(''); 
    });

    // ==================== 质控提醒相关代码 ====================
    // 质控提醒按钮点击事件
    $('#btnHmAiQc').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('质控提醒');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        // 重置弹窗状态
        $('.hmAiQcDialog textarea').val('');
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
    $('#btnHmAiAuth').on('click', function () {
        // 检查AI令牌
        const token = localStorage.getItem('HMAccessToken');
        if (!token) {
            showAlertDialog('请先设置AI令牌', function () {
                // 点击确定后直接打开AI令牌设置对话框
                $('.aiTokenDialog').show();
            });
            return;
        }
        // 重置弹窗状态
        $('.hmAiAuthDialog textarea').val('');
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
            const mayson = await HMEditorLoader.aiAuth(params, params.recordMap || recordMapData, ai);
            window.mayson = mayson;
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
    $('#btnHmAiGen').on('click', function () {
        if (!window.tabManager.currentTabId) {
            showEditorNotOpenDialog('唤醒AI');
            return;
        }
        if (!window.isInitHMAuth) {
            showAlertDialog('请先进行AI认证！');
            return;
        }
        // 重置弹窗状态
        $('.hmAiGenDialog textarea').val('');
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
            alshowAlertDialogert('病历生成失败: ' + e.message);
        }
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
            updateCenterBtnToggle();
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
            updateCenterBtnToggle();
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
            updateCenterBtnToggle();
        }, 150)
    });

    // 展开/收起按钮事件
    $('.center-btn-toggle').on('click', function () {
        var $container = $(this).siblings('.center-btn-container');
        if ($container.hasClass('expanded')) {
            $container.removeClass('expanded');
            $(this).find('i').removeClass('fa-caret-up').addClass('fa-caret-down');
        } else {
            $container.addClass('expanded');
            $(this).find('i').removeClass('fa-caret-down').addClass('fa-caret-up');
        }
    });
    // 初始化和窗口变化时判断
    updateCenterBtnToggle();
    $(window).on('resize', updateCenterBtnToggle);

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
    const aiButtons = ['#btnHmAiAuth', '#btnHmAiGen', '#btnNodeGen', '#btnDocGen', '#btnHmAiQc', '#btnHmAiToken'];
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

function updateCenterBtnToggle() {
    var $container = $('.center-btn-container');
    var $wrapper = $container.closest('.center-btn-wrapper');
    // 先重置
    $container.removeClass('expanded');
    // 判断是否超出2行
    var container = $container[0];
    var lineHeight = parseInt($container.css('line-height')) || 44;
    var maxHeight = lineHeight * 2 + 8; // 2行+gap
    if (container.scrollHeight > maxHeight + 2) {
        $wrapper.addClass('show-toggle');
        $container.removeClass('expanded');
        $wrapper.find('i').removeClass('fa-caret-up').addClass('fa-caret-down');
    } else {
        $wrapper.removeClass('show-toggle');
        $container.addClass('expanded');
        $wrapper.find('i').removeClass('fa-caret-down').addClass('fa-caret-up');
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
        var temp = data[0] || {};

        if (['11', '12', '18'].includes(temp.type)) {
            window.open(temp.items[0].text);
            return;
        }
        if (temp.type == '39') {
            var ruleId = temp.items && temp.items[0] && temp.items[0].id;
            if (!ruleId) return;

            window.tabManager.getCurrentEditor().then(function (editor) {
                var $span;
                var $body = $(editor.editor.document.getBody().$);
                $span = $body.find('span[rule-code="' + ruleId + '"]:not(.doc-warn-lack-ignore)');
                if ($body.find('.doc-composer').length > 0) {
                    return;
                }
                if ($span && $span.length > 0) {
                    $span[0].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    setTimeout(function () {
                        $span[0].click();
                        // 质控AI推荐调用
                        if ($span.hasClass('doc-warn-lack-title') || $span.hasClass('doc-warn-txt') && $body.find('.d-btt-ai').length > 0) {
                            if ($span.hasClass('doc-warn-lack-title')) {
                                $span.parent().addClass('doc-ai-correct-active');
                            }
                            if ($span.hasClass('doc-warn-txt')) {
                                $span.addClass('doc-ai-correct-active');
                            }
                            editor.hmAi.composer.manageLableShow(1)
                        }
                    }, 300);
                } else {
                    console.warn('未找到对应的AI推荐规则span:', ruleId);
                }
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
    console.log('准备调用waitForValidAiToken...');
    await waitForValidAiToken();
    console.log('waitForValidAiToken执行完成');
    console.log('AI令牌验证完成，开始执行认证流程');
    
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
    const mayson = await HMEditorLoader.aiAuth(params, params.recordMap || recordMapData, ai);
    window.mayson = mayson;
    window.isInitHMAuth = true;
    ai == 1 && maysonListenWindowSize(); // mayson 内嵌展示，先不发布
    showQualityRemindSet(docCode, node);
}

// 等待AI令牌设置完成的函数
function waitForValidAiToken() {
    return new Promise((resolve) => {
        console.log('开始等待AI令牌设置...');
        
        const checkToken = () => {
            const token = localStorage.getItem('HMAccessToken');
            console.log('检查AI令牌:', token ? '存在' : '不存在');
            
            let valid = true;
            
            if (!token) {
                valid = false;
                console.log('AI令牌不存在，设置为无效');
            } else {
                console.log('AI令牌存在，开始验证...');
                // 验证AI令牌
                valid = checkAiToken(token);
                console.log('checkAiToken返回结果:', valid);
            }
            
            console.log('AI令牌验证最终结果:', valid);
            
            if (!valid) {
                console.log('AI令牌无效，显示设置对话框');
                // 显示设置AI令牌的对话框
                showAlertDialog('请先设置AI令牌', function () {
                    console.log('用户点击确定，打开AI令牌设置对话框');
                    // 点击确定后直接打开AI令牌设置对话框
                    $('.aiTokenDialog').show();
                    
                    // 监听AI令牌设置完成事件
                    const handleTokenSet = () => {
                        console.log('检测到AI令牌设置完成事件');
                        // 移除事件监听器
                        $(document).off('aiTokenSet.tokenSet');
                        $('#btnCloseAiToken').off('click.tokenSet');
                        
                        // 直接继续执行，因为设置按钮已经验证过令牌了
                        console.log('AI令牌设置完成，直接继续执行');
                        resolve(); // 令牌有效，继续执行
                    };
                    
                    console.log('绑定aiTokenSet事件监听器');
                    // 绑定设置完成事件
                    $(document).on('aiTokenSet.tokenSet', handleTokenSet);
                    $('#btnCloseAiToken').on('click.tokenSet', () => {
                        console.log('用户取消AI令牌设置');
                        // 用户取消设置，重新检查
                        setTimeout(checkToken, 100);
                    });
                });
            } else {
                console.log('AI令牌有效，直接继续执行');
                resolve(); // 令牌有效，继续执行
            }
        };
        
        checkToken();
    });
}

function checkAiToken(token) {
    console.log('开始验证AI令牌:', token ? token.substring(0, 10) + '...' : 'null');
    
    // 验证AI令牌
    var valid = false;
    $.ajax({
        url: window.aiServer + "/aigc/recommend/cdss_stream_chat",
        type: "POST",
        headers: {
            'Huimei_id': 'D7928B9182ABF6E0A6A6EBB71B353585',
            "Authorization": "Bearer " + token
        },
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({}),
        async: false, // 设置为同步请求
        success: function (result) {
            console.log('AI认证检查结果:', result);
            if (result.code == 200) {
                valid = true;
                console.log('AI令牌验证成功');
            } else {
                valid = false;
                console.log('AI令牌验证失败，code:', result.code);
            }
        },
        error: function (error) {
            console.error('AI令牌验证请求失败:', error);
            valid = false;
        }
    });
    
    console.log('AI令牌验证最终结果:', valid);
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
async function showQualityRemindSet(docCode, node) {
    const params = window.aiParams[docCode];
    const editor = await window.tabManager.getCurrentEditor();
    const recordType = node ? node.recordType : 1;

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
let btnPanelVisible = false;

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

    console.log('工具栏已隐藏 - 选中"常用病历模板"显示工具栏，或使用快捷键 Ctrl+Shift+-> 显示');
    // 可选：显示一个临时的提示信息
    setTimeout(function () {
        console.log('💡 提示: 选中"常用病历模板"显示工具栏，或按 Ctrl+Shift+-> 可以显示/隐藏工具栏');
    }, 1000);
}