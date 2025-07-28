/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Horizontal Page Break
 */

'use strict';

// region debugger
// var debugHandler = false; // 调试处理表格时的死循环
var removeSplitterDebugger = false; // 调试保存使用, 去除所有分页符
// endregion

(function () {
    ///////////////////////////////////////////////////////////////////////////
    // Public
    ///////////////////////////////////////////////////////////////////////////
    // todo CKEDITOR.xxx 是 static 函数, 后期可以将部分函数改成与 editor 类绑定.
    var thisCmd = CKEDITOR.plugins.pagebreakCmd = {
        // 是否调试: 调试模式中, 取消最后一页的占位符 / 前后缀随机数采用自增长 等
        AUTO_PAGING_DEBUG: false,
        // 最大循环长度限制
        MAX_CYCLE_COUNT: 10000,
        // region 在处理分页时不分割

        // 不做分割的元素
        NOT_DIVIDE:
            'img,th,' +
            '[data-hm-name="签名位"],[data-hm-name="审签签名位"],' +
            '.do-not-divide',

        // // 不做分割的 tag
        // TAGS_NOT_DIVIDE: ['IMG', 'TH'],
        // // 不做分割的 class
        // CLASS_NOT_DIVIDE: ['do-not-divide'],

        // 不能在行首的标点 todo英文的单双引号怎么判断
        LINE_END_PUNCTUATION: /[~！￥%…）—}：”》？·】、；’，。):>?`\];,.]/,
        // 不能在行末的标点
        LINE_START_PUNCTUATION: /[￥（{“《【‘(<\[]/,
        // endregion

        // 逻辑页
        LOGIC_PAGE_CLASS: 'hm-logic-page',
        // 逻辑一页的内容
        PAGE_CONTENT_CLASS: 'hm-page-content',
        // 页眉
        PAGE_HEADER_CLASS: 'hm-page-header-group',
        // 页脚
        PAGE_FOOTER_CLASS: 'hm-page-footer-group',
        // 打印偏移量
        PAGE_OFFSET_CLASS: 'hm-page-offset',
        // 为打印预留的高度
        PAGE_PRINT_OFFSET: 'print_offset',
        // 放在正文最后一位的标记, 用于标记是否分页
        PAGE_SPLIT_MARK: 'cke_page_split_mark',

        // 断页的一些标识; logic-page 上的这些标志只作为分页时简化判断逻辑, 并不作为打印的 style.
        // 分页前先判断是否有病历具有以下属性, 如果有就先处理这些属性, 并把这些属性提到 logic-page 中, 以加快分页速度.
        // 在此页前分页 (不保存)
        SPLIT_BEFORE_DOC_TEMP: 'split-before-doc-temp',
        // 在此页后分页(不保存)
        SPLIT_AFTER_DOC_TEMP: 'split-after-doc-temp',
        // 在此页后分页
        SPLIT_AFTER_DOC: 'split-after-doc',
        // 修改此病历的页码
        CHANGE_PAGE_NUMBER_OF_DOC: 'change-page-number-of-doc',
        // 页码
        PAGE_NUM_CLASS: 'page',
        // 复制表头的标志
        COPY_TABLE_HEADER: '_hm_copy_table_header',
        // 此标志表示 span(或者其他) 之后带了一个换行符, 但是处于一页的末尾不能显示该换行符
        HAS_BR: 'has-br',

        // 连接符
        CONNECTOR_CLASS_NAME: 'hm-conn-',
        CONNECTOR_PREFIX_CLASS: 'hm-conn-prefix',
        CONNECTOR_SUFFIX_CLASS: 'hm-conn-suffix',
        CONNECTOR_PREFIX: 'hm-conn-prefix-',
        CONNECTOR_SUFFIX: 'hm-conn-suffix-',
        // 含有 rowspan 的表格被分割时, 需要在格子处添加一个标志, 用于加速合并
        HAS_ROWSPAN: 'hm-rowspan',

        // 资源文件路径
        sourcePath: null,

        // 页脚占位符
        FAKE_PAGE_FOOTER: 'hm-fake-page-footer',

        //强制分页 class
        FORCE_BREAK: 'force-break',

        ////////////////////////////////////////////////////////////

        // 记录当前已经触发的事件
        currentOperations: {
            hoverId: null,
            afterSync: false, // 同步之后需要更新页眉页脚, 不能漏
            setContent: false,
            saveCompleted: false,
            deleteEmrRecord: false
        },
        resetCurrentOperations: function () {
            thisCmd.currentOperations = {};
        },
        logicPageWidth: 0,
        logicPageHeight: 0,
        pageHeaderGroup: undefined,
        pageFooterGroup: undefined,
        // 是否正在分页
        autoPaging: false,
        // 添加打印分页符
        exec: function (editor) {
            // var div = editor.document.createElement('div');
            // // 插入分页符
            // editor.insertElement(div);
            // // 把分页符调至顶层
            // moveToTop(editor, div.$);
            // thisCmd.packPageContents(editor);
            // div.remove(); 
            if(editor.document.findOne("[title='分页符']")){
                var pageBreakH= editor.document.find("[title='分页符']").$;
                //移除分页符
                $(pageBreakH).remove();
            }else {
                var div = editor.document.createElement('div');
                div.addClass("hm-page-break");
                div.setAttribute("title","分页符");
                div.setHtml('<input readonly="readonly" style="width: 100%;border: none;text-align: center;" >');
                // 插入分页符
                editor.insertElement(div);
            }
        },
        context: 'div',
        allowedContent: {
            div: {
                styles: '!page-break-after'
            },
            span: {
                match: function (element) {
                    var parent = element.parent;
                    return parent && parent.name === 'div' && parent.styles && parent.styles['page-break-after'];
                },
                styles: 'display'
            }
        },
        requiredContent: 'div{page-break-after}',
        // Returns an object representing all the attributes
        // of the "internal form" of the pagebreak element.
        attributesSet: function attributesSet(label, additionalAttributes) {
            var returns = {
                'aria-label': label,
                'class': 'cke_pagebreak',
                contenteditable: 'false',
                'data-cke-display-name': 'pagebreak',
                'data-cke-pagebreak': 1,
                // style: 'page-break-after: always',
                title: label
            };
            for (var key in additionalAttributes) {
                returns[key] = additionalAttributes[key];
            }
            return returns;
        },
        getLogicPageWidth: function getLogicPageWidth() {
            return (thisCmd.logicPageWidth > 0) ? thisCmd.logicPageWidth : CKEDITOR.plugins.paperCmd.logicPaperSize.width;
        },
        setLogicPageWidth: function setLogicPageWidth() {
            thisCmd.logicPageWidth = CKEDITOR.plugins.paperCmd.logicPaperSize.width;
        },
        getPageNetHeight: function getPageNetHeight() {
            // 只读病历更新页高
            if (!thisCmd.pageNetHeight) {
                thisCmd.setPageNetHeight();
            }
            return thisCmd.pageNetHeight;
        },
        setPageNetHeight: function setPageNetHeight() {
            thisCmd.pageNetHeight = Math.floor(-1 + CKEDITOR.plugins.paperCmd.logicPaperSize.height);
        },

        switchCssPreview: function switchCssPreview($body) {
            // return; // bbbbbbbbbb
            var features = '._printHide,._paragraphHide,.hide_class,' +
                '.new-textbox,[data-hm-node],[_placeholderText],.cke_page_split_mark,.continuation-identifier';
            features+=',del';
            $body.find(features).addClass('print-preview');


            // region 处理打印时数据元的最小宽度
            var minWidthBox = $body.find('[_minWidth]');

            minWidthBox.filter('[data-hm-node="newtextbox"]')
                .attr('min-width-for-edit', function () {
                    return this.style.minWidth;
                })
                .css('min-width', function () {
                    var value = this.getAttribute('_minWidth');
                    // return (value.indexOf('px') >= 0) ? value : parseInt(value) + 'em';
                    return (value.indexOf('px') >= 0) ? value : '';
                });


            minWidthBox.not('[data-hm-node="newtextbox"]')
                .attr('min-width-for-edit', function () {
                    return this.style.minWidth;
                })
                .css('min-width', function () {
                    var value = this.getAttribute('_minWidth');
                    // return (value.indexOf('px') >= 0) ? value : parseInt(value) + 'em';
                    return (value.indexOf('px') >= 0) ? value : '';
                });
            // .css('display', 'inline-block');

            // endregion
        },

        // 切换为打印的 css
        switchCssPrint: function switchCssPrint(editor, initSignature) {
            var body = editor.document.$.body;
            // 切换样式1
            thisCmd.switchCssPreview($(body), initSignature);

            // 添加页面高度
            for (var i = 0; i < body.children.length; i++) {
                var child = body.children[i];
                if (hasClass(child, thisCmd.LOGIC_PAGE_CLASS)) {
                    child.style.height = thisCmd.getPageNetHeight() + 'px';
                    child.style.minHeight = '';
                }
            }
        },
        // 切换为分页的 css
        switchCssPaging: function switchCssPaging(body) {
            // 切换样式1
            thisCmd.switchCssPreview($(body));
            // 删除续打标志以免影响分页
            var continuationIdf = body.getElementsByClassName('continuation-identifier');
            for (var i = continuationIdf.length - 1; i >= 0; i--) {
                continuationIdf[i].remove();
            }

            // 取消页面高度
            for (i = 0; i < body.children.length; i++) {
                var child = body.children[i];
                if (hasClass(child, thisCmd.LOGIC_PAGE_CLASS)) {
                    child.style.height = '';
                    child.style.minHeight = '';
                }
            }
        },
        // 切换为编辑的 css
        switchCssEdit: function switchCssEdit(body) {
            // return; // bbbbbbbbbb
            var $body = $(body);
            $body.find('.print-preview').removeClass('print-preview');

            // 取消高度, 并添加最小页面高度
            for (var i = 0; i < body.children.length; i++) {
                var child = body.children[i];
                if (hasClass(child, thisCmd.LOGIC_PAGE_CLASS)) {
                    child.style.height = '';
                    // minHeight
                    if (child.offsetHeight < thisCmd.getPageNetHeight()) {
                        child.style.height = thisCmd.getPageNetHeight() + 'px';
                    }
                }
            }


            // region 处理打印时数据元的最小宽度
            var minWidthBox = $body.find('[min-width-for-edit]');

            minWidthBox.filter('[data-hm-node="newtextbox"]')
                .attr('_minWidth', function () {
                    return this.style.minWidth;
                })
                .css('min-width', function () {
                    return this.getAttribute('min-width-for-edit');
                });

            minWidthBox.not('[data-hm-node="newtextbox"]')
                .attr('_minWidth', function () {
                    return this.style.minWidth;
                })
                .css('min-width', function () {
                    return this.getAttribute('min-width-for-edit');
                });
            // endregion
        },
        // endregion

        // 生成分页标志(将保存在文件中)
        genPageSplitMarker: function genPageSplitMarker(editor, force) {
            force = !!force;
            var p = editor.document.createElement('label', {
                attributes: {
                    force: force
                }
            }).$;
            p.className = thisCmd.PAGE_SPLIT_MARK + ' print-preview';
            return p;
        },
        // 查看是否为分页标志
        isPageSplitMarker: function isPageSplitMark(node) {
            return node.nodeName === 'P' && hasClass(node, thisCmd.PAGE_SPLIT_MARK);
        },
        // 生成空分页符
        genPageSplitter: function genPageSplitter(editor, additionalAttributes, pageHeaderString, pageFooterString) {
            return editor.document.createElement('div');
            // var paperMargin = CKEDITOR.plugins.paperCmd.paperMargin;
            // var document1 = editor.document.$;
            // var pageSplitter = editor.document.createElement('div', {attributes: {contenteditable: false}});
            // pageSplitter.$.className = thisCmd.PAGE_SPLIT_CLASS;
            // pageSplitter.$.innerHTML = pageFooterString;
            //
            // // 页脚
            // var paperbottomStyles = {'height': paperMargin.bottom + 'px'};
            // if (thisCmd.AUTO_PAGING_DEBUG) {
            //     paperbottomStyles.background = '#9b7676';
            // }
            // var _paperbottom = editor.document.createElement('div', {
            //     styles: paperbottomStyles
            // });
            // _paperbottom.$.className = '_paperbottom';
            // pageSplitter.$.appendChild(_paperbottom.$);
            //
            // // 分页符
            // var pageBreaker = editor.document.createElement('div', {
            //     attributes: this.attributesSet(editor.lang.pagebreak.alt, additionalAttributes)
            // }).$;
            // // 分页标志
            // var pageBreakAfter = document1.createElement('div');
            // // debugger
            // pageBreakAfter.style.pageBreakBefore = 'always';
            // pageBreaker.appendChild(pageBreakAfter);
            //
            // // region 分页符图片
            // var pageBreakerIcon = document1.createElement('div');
            // pageBreakerIcon.className = 'pagebreak_icon _printHide';
            // pageBreaker.appendChild(pageBreakerIcon);
            // // endregion
            // // region 页面边框
            // var leftBottom = document1.createElement('div');
            // leftBottom.appendChild(document1.createElement('div'));
            // var rightBottom = leftBottom.cloneNode(true);
            // var leftTop = leftBottom.cloneNode(true);
            // var rightTop = leftBottom.cloneNode(true);
            //
            // leftBottom.className = 'pageborder left-bottom';
            // rightBottom.className = 'pageborder right-bottom';
            // leftTop.className = 'pageborder left-top';
            // rightTop.className = 'pageborder right-top';
            //
            // pageBreaker.appendChild(leftBottom);
            // pageBreaker.appendChild(rightBottom);
            // pageBreaker.appendChild(leftTop);
            // pageBreaker.appendChild(rightTop);
            //
            // leftBottom.style.margin = -paperMargin.bottom + 'px 0 0 -26px';
            // rightBottom.style.margin = -paperMargin.bottom + 'px -26px 0 0';
            // leftTop.style.margin = paperMargin.top - 25 + 'px 0 0 -26px';
            // rightTop.style.margin = paperMargin.top - 25 + 'px -26px 0 0';
            //
            // leftBottom.firstChild.style.clip = 'rect(0, ' + paperMargin.bottom + 'px, ' + paperMargin.left + 'px, 0)';
            // rightBottom.firstChild.style.clip = 'rect(0, ' + paperMargin.right + 'px, ' + paperMargin.bottom + 'px, 0)';
            // leftTop.firstChild.style.clip = 'rect(0, ' + paperMargin.left + 'px, ' + paperMargin.top + 'px, 0)';
            // rightTop.firstChild.style.clip = 'rect(0, ' + paperMargin.top + 'px, ' + paperMargin.right + 'px, 0)';
            //
            // // endregion
            // pageSplitter.$.appendChild(pageBreaker);
            //
            // // 页眉
            // var papertopStyles = {'height': paperMargin.top + 'px'};
            // if (thisCmd.AUTO_PAGING_DEBUG) {
            //     papertopStyles.background = '#7094b3';
            // }
            // var _papertop = editor.document.createElement('div', {
            //     attributes: {_papertop: true},
            //     styles: papertopStyles
            // });
            // _papertop.$.className = '_papertop';
            // pageSplitter.$.appendChild(_papertop.$);
            //
            // pageSplitter.$.innerHTML += pageHeaderString;
            // return pageSplitter;
        },
        // 将分页符前后的内容包上一层 div
        packPageContents: function packPageContents(editor) {
            var logicPageClass = thisCmd.LOGIC_PAGE_CLASS;
            var pageContentClass = thisCmd.PAGE_CONTENT_CLASS;
            // var needAddConnectorsflag = true;
            var document = editor.document.$;
            var body = document.body;
            var logicPage, pageContent, iterator = body.firstChild;
            // 正在修补某一页
            var fixing = false;
            while (iterator) {
                if (iterator.nodeType === CKEDITOR.NODE_ELEMENT && hasClass(iterator, logicPageClass)) {
                    iterator = iterator.nextSibling;
                    fixing = false;
                } else {
                    // 如果未正在修补, 则添加页面
                    if (!fixing) {
                        logicPage = thisCmd.genLogicPage(editor, thisCmd.pageHeaderGroup, thisCmd.pageFooterGroup);
                        body.insertBefore(logicPage, iterator);
                        pageContent = logicPage.getElementsByClassName(pageContentClass)[0];
                        fixing = true;
                    }
                    pageContent.append(iterator);
                    iterator = logicPage.nextSibling;
                }
            }
        },
        /** 在页面顶层元素 (等价于被 moveToTop() 的元素) 之后对正文进行拆分, 拆分为逻辑页的两页; 拆分的过程为新建逻辑页.
         *
         * @param {CKEDITOR.editor} editor
         * @param {html.dom} thisPage 此逻辑页
         * @param {html.dom} node 需要在之后拆分的节点.
         *
         * @return {html.dom} logicPage 新生成的逻辑页
         */
        splitLogicPagesAfter: function (editor, thisPage, node) {
            if (!node || !node.nextElementSibling || !hasClass(node.parentNode, thisCmd.PAGE_CONTENT_CLASS)) {
                return null;
            }
            var newPage = thisCmd.genLogicPage(editor, thisCmd.pageHeaderGroup, thisCmd.pageFooterGroup);
            insertAfter(editor.document.$.body, newPage, thisPage);
            var pageContent = newPage.getElementsByClassName(thisCmd.PAGE_CONTENT_CLASS)[0];
            while (node.nextSibling) {
                pageContent.append(node.nextSibling);
            }
            return newPage;
        },
        genLogicPage: function genLogicPage(editor, paperHeader, paperFooter) {
            var paperMarginPx = CKEDITOR.plugins.paperCmd.paperMarginPx;
            var document = editor.document.$;
            // 页面
            var logicPage = document.createElement('div');
            // logicPage.setAttribute('contenteditable', false);
            logicPage.className = thisCmd.LOGIC_PAGE_CLASS;
            // logicPage.style.width = thisCmd.getLogicPageWidth() + 'px';
            logicPage.style.paddingTop = paperMarginPx.top + 'px';
            logicPage.style.paddingLeft = paperMarginPx.left + 'px';
            logicPage.style.paddingRight = paperMarginPx.right + 'px';
            logicPage.style.paddingBottom = paperMarginPx.bottom + 'px';
            // 页面里面再包一层, 方便页脚置底
            var middleLayer = document.createElement('div');
            middleLayer.className = 'hm-page-middleLayer';
            logicPage.appendChild(middleLayer);
            // 页眉
            middleLayer.appendChild(paperHeader.cloneNode(true));
            // 页脚
            middleLayer.appendChild(paperFooter.cloneNode(true));
            // 页面元素
            var pageContent = document.createElement('div');
            // pageContent.setAttribute('contenteditable', true);
            pageContent.className = thisCmd.PAGE_CONTENT_CLASS;
            middleLayer.appendChild(pageContent);
            // 打印偏移量
            var pageOffsetContainer = document.createElement('div');
            pageOffsetContainer.className = thisCmd.PAGE_OFFSET_CLASS;
            if (thisCmd.AUTO_PAGING_DEBUG) {
                pageOffsetContainer.style.background = '#ccaaff';
            }
            middleLayer.appendChild(pageOffsetContainer);
            // 相邻两页的中间不来一层吗
            var splitter = document.createElement('div');
            splitter.className = 'hm-page-splitter';
            logicPage.appendChild(splitter);
            return logicPage;
        },
        // 重新计算页码
        // 计算页码有两个地方: 分页时和此处
        organizePageNumbers: function organizePageNumbers(editor) {
            var document = editor.document.$;
            // todo 默认文本包在一个div中
            var body = document.body;
            var logicPages = body.getElementsByClassName(thisCmd.LOGIC_PAGE_CLASS);
            var pageNumArgs = {
                theLastOrganizedWidgetId: null,
                pageNum: 1
            };
            for (var i = 0; i < logicPages.length; i++) {
                pageNumArgs.page = logicPages[i];
                thisCmd.setPageNum(pageNumArgs);
            }
        },
        // 获取单页的页码, 运行过程中 pageNum 和 theLastOrganizedWidgetId 会改变
        // args:
        // page
        // pageNum
        // theLastOrganizedWidgetId
        getPageNum: function getPageNum(pageNumArgs) {
            var pageNumOverrided = false;

            var pageNumSpan = pageNumArgs.page
                .getElementsByClassName(thisCmd.PAGE_FOOTER_CLASS)[0]
                .getElementsByClassName('page')[0];
            var page = pageNumArgs.page;
            if (pageNumSpan) {
                var widgets = $(page).find('[' + thisCmd.CHANGE_PAGE_NUMBER_OF_DOC + ']');
                // 如果是聚合病历则看是否在病历后分页
                if (widgets.length > 0) {
                    var widget = widgets[0];
                    var widgetId = widget.getAttribute('data-hm-widgetid');
                    // 记录在此病历后分页
                    if (widgetId) {
                        // 得到页数
                        var _pageNum = Number(widget.getAttribute(thisCmd.CHANGE_PAGE_NUMBER_OF_DOC));
                        if (!isNaN((_pageNum))) {
                            pageNumArgs.pageNum = _pageNum;
                            pageNumArgs.theLastOrganizedWidgetId = widgetId;
                            pageNumOverrided = true;
                        }
                    }
                }
                // 看分页符内部的标签
                if (pageNumSpan.attributes.page_num) {
                    pageNumArgs.pageNum = Number(pageNumSpan.attributes.page_num.value);
                    pageNumOverrided = true;
                }
                // 获取页码
                if (pageNumSpan && !pageNumOverrided) {
                    pageNumArgs.pageNum = Number(pageNumSpan.innerText) || 1;
                }
            }
        },
        // 设置单页的页码, 运行过程中 pageNum 和 theLastOrganizedWidgetId 会改变
        // args:
        // page
        // pageNum
        // theLastOrganizedWidgetId
        setPageNum: function setPageNum(pageNumArgs) {
            var pageNumOverrided = false;

            var pageNumSpan = pageNumArgs.page
                .getElementsByClassName(thisCmd.PAGE_FOOTER_CLASS)[0]
                .getElementsByClassName('page')[0];
            var page = pageNumArgs.page;
            if (pageNumSpan) {
                var widgets = $(page).find('[' + thisCmd.CHANGE_PAGE_NUMBER_OF_DOC + ']');
                // 如果是聚合病历则看是否在病历后分页
                if (widgets.length > 0) {
                    var widget = widgets[0];
                    var widgetId = widget.getAttribute('data-hm-widgetid');
                    // 如果这个病历在上一页已经进行了页数处理就跳过
                    if (widgetId && (widgetId !== pageNumArgs.theLastOrganizedWidgetId)) {
                        // 得到页数 分配页码
                        var _pageNum = Number(widget.getAttribute(thisCmd.CHANGE_PAGE_NUMBER_OF_DOC));
                        if (!isNaN((_pageNum))) {
                            pageNumArgs.pageNum = _pageNum;
                            pageNumArgs.theLastOrganizedWidgetId = widgetId;
                            pageNumSpan.innerText = pageNumArgs.pageNum;
                            pageNumSpan.setAttribute('curpage',pageNumArgs.pageNum);
                            pageNumArgs.pageNum++;
                            pageNumOverrided = true;
                        }
                    }
                }
                // 看分页符内部的标签, 如果有就不改变它的分页
                if (pageNumSpan.attributes.page_num) {
                    pageNumArgs.pageNum = Number(pageNumSpan.attributes.page_num.value) + 1;
                    pageNumOverrided = true;
                }
                // 分配页码
                if (pageNumSpan && !pageNumOverrided) {
                    pageNumSpan.innerText = pageNumArgs.pageNum;
                    pageNumSpan.setAttribute('curpage',pageNumArgs.pageNum);
                    pageNumArgs.pageNum++;
                }
            }
        },
        // 页面更改之后需要重新画页面边框
        setPaperBorder: function setPaperBorder(body) {
            thisCmd.setLogicPageWidth();
            thisCmd.setPageNetHeight();

            body = $(body);
            var paperMarginPx = CKEDITOR.plugins.paperCmd.paperMarginPx;

            body.find('.' + thisCmd.LOGIC_PAGE_CLASS)
                // .css('width', thisCmd.getLogicPageWidth() + 'px')
                .css('height', thisCmd.getPageNetHeight() + 'px')
                .css('padding-top', paperMarginPx.top + 'px')
                .css('padding-left', paperMarginPx.left + 'px')
                .css('padding-right', paperMarginPx.right + 'px')
                .css('padding-bottom', paperMarginPx.bottom + 'px');

            body.find('.pageborder.left-bottom').css('margin', -paperMarginPx.bottom + 'px 0 0 -26px')
                .find('div').css('clip', 'rect(0, ' + paperMarginPx.bottom + 'px, ' + paperMarginPx.left + 'px, 0)');
            body.find('.pageborder.right-bottom').css('margin', -paperMarginPx.bottom + 'px -26px 0 0')
                .find('div').css('clip', 'rect(0, ' + paperMarginPx.right + 'px, ' + paperMarginPx.bottom + 'px, 0)');
            body.find('.pageborder.left-top').css('margin', paperMarginPx.top - 25 + 'px 0 0 -26px')
                .find('div').css('clip', 'rect(0, ' + paperMarginPx.left + 'px, ' + paperMarginPx.top + 'px, 0)');
            body.find('.pageborder.right-top').css('margin', paperMarginPx.top - 25 + 'px -26px 0 0')
                .find('div').css('clip', 'rect(0, ' + paperMarginPx.top + 'px, ' + paperMarginPx.right + 'px, 0)');
        },
        // 光标左移
        selectionMoveLeft: function selectionMoveLeft(selection, evt) {
            var range0 = selection.getRanges()[0];
            if (!range0.collapsed) {
                return;
            }
            // var substr = '';
            // // 先复制一份 startOffset 用于日后比较大小
            // var startOffset = range0.startOffset;
            //
            // var container = range0.startContainer.$;
            // // 把左边的字节点合并, 并删除左边为空的字符
            // if (container.nodeType === CKEDITOR.NODE_ELEMENT) {
            //     var childIndex;
            //     // 如果是元素节点, 只需要合并子节点 (好像不合并也行)
            //     for (childIndex = 0; container.childNodes.length > 0; childIndex++) {
            //         var child = container.firstChild;
            //         if (child.nodeType !== CKEDITOR.NODE_TEXT) {
            //             break;
            //         }
            //         substr = child.data.replace(zeroWidthCharStarted, '');
            //         // 如果字符非空则中断循环, 否则删除字符
            //         if (substr.length) {
            //             break;
            //         } else {
            //             child.remove();
            //             // 非字符节点的 startOffset 还能大于1?
            //             if (startOffset > 1) {
            //                 debugger
            //                 if (startOffset > childIndex) {
            //                     range0.startOffset--;
            //                     range0.endOffset--;
            //                     selection.selectRanges([range0]);
            //                 }
            //             }
            //         }
            //     }
            //     // 如果无字符且光标在 container 的前面, 加一个零宽字符
            //     if (!substr.length && startOffset === 0) {
            //         substr = '\u200B';
            //     }
            //     if (container.firstChild && container.firstChild.nodeType === CKEDITOR.NODE_TEXT) {
            //         // 不要删除零宽字符
            //         if (substr.length) {
            //             container.firstChild.data = substr;
            //         }
            //     }
            // } else if (container.nodeType === CKEDITOR.NODE_TEXT) {
            //     // 如果是字符节点, 需要处理前面的兄弟节点的零宽字符
            //     while (container.previousSibling && container.previousSibling.nodeType === CKEDITOR.NODE_TEXT) {
            //         substr = container.previousSibling.data.replace(zeroWidthCharStarted, '');
            //         // 如果字符非空则中断循环, 否则删除字符
            //         if (substr.length) {
            //             break;
            //         } else {
            //             container.previousSibling.remove();
            //         }
            //     }
            //     // 处理本节点的零宽字符
            //     var notNullIndex = 0;
            //     while (notNullIndex < startOffset && notNullIndex < container.data.length && zeroWidthChar.test(container.data[notNullIndex])) {
            //         notNullIndex++;
            //     }
            //     container.data = container.data.substr(notNullIndex);
            //     range0.startOffset = Math.max(0, range0.startOffset - notNullIndex);
            //     range0.endOffset = range0.startOffset;
            //     selection.selectRanges([range0]);
            // }

            // 当在后一页的第一个字符前按退格时, 挪到上一页的最后一个字符. 默认编辑时没有多重光标.
            if (range0.startOffset === 0) {
                if (!isFirstNotEmptyChild(range0.startContainer)) {
                    return;
                }

                var parent = range0.startContainer.getParent();
                // 父元素的位置: -1代表首尾元素, 其他代表在表格行中的位置
                var indexes = [-1];
                // 查看顶层父元素前面是不是分页符 / 表格
                while (parent.$.tagName !== 'BODY' && !hasClass(parent.$, thisCmd.PAGE_CONTENT_CLASS)) {
                    var parent1 = parent.getParent();
                    if (parent.$.tagName === 'TD') {
                        indexes.push(parent.$.cellIndex);
                    } else {
                        var parentPrev = parent.getPrevious();
                        while (parentPrev && parentPrev.type === CKEDITOR.NODE_COMMENT) {
                            parentPrev.remove();
                            parentPrev = parent.getPrevious();
                        }
                        if (parentPrev && parentPrev.$.tagName !== 'COLGROUP' && !isFirstNotEmptyChild(parent)) {
                            return;
                        }
                        indexes.push(-1);
                    }
                    parent = parent1;
                }
                if (parent.$.tagName === 'BODY') {
                    return;
                }
                // 如果是, 就挪光标
                if (parent && parent.hasClass(thisCmd.PAGE_CONTENT_CLASS)) {
                    var previous = parent.getParent().getParent().getPrevious(function (a) {
                        return a.type === CKEDITOR.NODE_ELEMENT;
                    });
                    if (!previous) {
                        return;
                    }
                    previous = previous.find('>div>div.hm-page-content').getItem(0);
                    if (previous) {
                        // 向上依次获取父元素的 index, 如果不是 td 也不是 0 则 return
                        while (indexes.length > 0) {
                            var index = indexes.pop();
                            // 非td
                            if (index === -1 && previous.getLast) {
                                var last = previous.getLast();
                                if (indexes.length > 1) {
                                    last = previous.getLast(function (a) {
                                        return a.type === CKEDITOR.NODE_ELEMENT
                                    });
                                }
                                if (last) {
                                    previous = last;
                                } else {
                                    break;
                                }
                            }
                            // td
                            else if (index >= 0) {
                                var td = previous.$.cells[index];
                                if (td) {
                                    previous = new CKEDITOR.dom.element(td);
                                } else {
                                    break;
                                }
                            }
                        }

                        if (previous.type === CKEDITOR.NODE_TEXT) {
                            previous = previous.getParent();
                        }
                        // 删除分页标记的回车符号
                        if (evt.data.$.keyCode === 8 && previous.hasClass(thisCmd.HAS_BR)) {
                            previous.removeClass(thisCmd.HAS_BR);
                            previous.append(new CKEDITOR.dom.text('\u200B'));
                            range0.moveToPosition(previous, CKEDITOR.POSITION_BEFORE_END);
                            try {
                                selection.selectRanges([range0]);
                            } catch (e) {
                                console.error(e);
                                debugger;
                            }
                            // 如果删除导致 'has-br' 被删除, 需要重新分页.
                            evt.sender.editor.fire('saveSnapshot', {name: 'selectionMoveLeft'});
                            return false;
                        }
                        // 回删时: 如果分页前后的两行都是 p (无分页连接符), 在后一页的 p 中敲退格时也需要
                        if (evt.data.$.keyCode === 8) {
                            if (range0.startContainer.$.nodeType === CKEDITOR.NODE_TEXT) {
                                if (range0.startContainer.getParent().$.nodeName === 'P' && previous.getParent().$.nodeName === 'P') {
                                    // 把这俩 p 联系起来
                                    addConnectorsWhenSplitting(previous.getParent().$, range0.startContainer.getParent().$);
                                    // 若前一页最后的字是 br, 需要删除
                                    if (previous.$.nodeName === 'BR') {
                                        // 在 br 后面加零宽字符
                                        previous.getParent().append(new CKEDITOR.dom.text('\u200b'));
                                        // 删除 br
                                        previous = previous.getNext();
                                        previous.getPrevious().remove();
                                    }
                                }
                            } else {
                                debugger;
                            }
                        }
                        range0.moveToPosition(previous, CKEDITOR.POSITION_BEFORE_END);
                        try {
                            selection.selectRanges([range0]);
                        } catch (e) {
                            console.error(e);
                            debugger;
                        }
                    }
                }
            }
        },
        // 光标右移
        selectionMoveRight: function selectionMoveRight(selection, evt) {
            var range0 = selection.getRanges()[0];
            if (!range0.collapsed) {
                return;
            }
            // var substr = '';
            // // 先复制一份 endOffset 用于日后比较大小
            // var endOffset = range0.endOffset;
            //
            // // 把右边的字节点合并, 并删除右边为空的字符
            var container = range0.endContainer.$;
            // if (container.nodeType === CKEDITOR.NODE_ELEMENT) {
            //     var childIndex;
            //     // 如果是元素节点, 只需要合并子节点 (好像不合并也行)
            //     for (childIndex = range0.startOffset; childIndex < container.childNodes.length; childIndex++) {
            //         var child = container.childNodes[childIndex];
            //         if (child.nodeType !== CKEDITOR.NODE_TEXT) {
            //             break;
            //         }
            //         substr = child.data.replace(zeroWidthCharEnded, '');
            //         // 如果字符非空则中断循环, 否则删除字符
            //         if (substr.length) {
            //             break;
            //         } else {
            //             child.remove();
            //             // 老文本的 endOffset 可能大于1
            //             range0.startOffset++;
            //             range0.endOffset++;
            //         }
            //     }
            //     selection.selectRanges([range0]);
            //     // // 如果无字符且光标在 container 的后面, 加一个零宽字符
            //     // if (!substr.length && endOffset === 1) {
            //     //     substr = '\u200B';
            //     // }
            //     // if (container.lastChild && container.lastChild.nodeType === CKEDITOR.NODE_TEXT) {
            //     //     // 不要删除零宽字符
            //     //     if (substr.length) {
            //     //         container.lastChild.data = substr;
            //     //     }
            //     // }
            // } else if (container.nodeType === CKEDITOR.NODE_TEXT) {
            //     // 如果是字符节点, 需要处理后面的兄弟节点的零宽字符
            //     while (container.nextSibling && container.nextSibling.nodeType === CKEDITOR.NODE_TEXT) {
            //         substr = container.nextSibling.data.replace(zeroWidthCharEnded, '');
            //         // 如果字符非空则中断循环, 否则删除字符
            //         if (substr.length) {
            //             break;
            //         } else {
            //             container.nextSibling.remove();
            //         }
            //     }
            //     // 处理本节点的零宽字符
            //     var notNullIndex = container.data.length - 1;
            //     while (notNullIndex > endOffset && notNullIndex > 0 && zeroWidthChar.test(container.data[notNullIndex])) {
            //         notNullIndex--;
            //     }
            //     container.data = container.data.substr(0, 1 + notNullIndex);
            //     range0.startOffset = Math.min(range0.startOffset, 1 + notNullIndex);
            //     range0.endOffset = range0.startOffset;
            //     selection.selectRanges([range0]);
            // }

            // 如果(!range0.startContainer.getLength)就代表光标位置不在文本上
            // 当在前一页的第最后字符前按右箭头时, 挪到后一页的第一个字符. 默认编辑时没有多重光标.
            var isEnd = (range0.endContainer.getLength) ?
                (range0.endOffset === range0.endContainer.getLength()) :
                (range0.endOffset === 1);
            if (isEnd && 1 + range0.endContainer.getIndex() === range0.endContainer.getParent().getChildCount()) {
                var parent = range0.endContainer.getParent();
                // 父元素的位置: -1代表首尾元素, 其他代表在表格行中的位置
                var indexes = [-1];
                // 查看顶层父元素前面是不是分页符 / 表格
                while (parent.$.tagName !== 'BODY' && !hasClass(parent.$, thisCmd.PAGE_CONTENT_CLASS)) {
                    var parent1 = parent.getParent();
                    if (parent.$.tagName === 'TD') {
                        indexes.push(parent.$.cellIndex);
                    } else {
                        var parentNext = parent.getNext();
                        while (parentNext && parentNext.type === CKEDITOR.NODE_COMMENT) {
                            parentNext.remove();
                            parentNext = parent.getNext();
                        }
                        if (parentNext) {
                            return;
                        }
                        indexes.push(-1);
                    }
                    parent = parent1;
                }
                if (parent.$.tagName === 'BODY') {
                    return;
                }

                container = range0.endContainer;
                if (container.type === CKEDITOR.NODE_TEXT) {
                    container = container.getParent();
                }
                // 如果是, 先删除分页标记的回车符号
                if (evt.data.$.keyCode === 46 && container.hasClass(thisCmd.HAS_BR)) {
                    container.removeClass(thisCmd.HAS_BR);
                    container.append(new CKEDITOR.dom.text('\u200B'));
                    return;
                }

                // 如果是, 就挪光标
                if (parent && parent.hasClass(thisCmd.PAGE_CONTENT_CLASS)) {
                    var next = parent.getParent().getParent().getNext(function (a) {
                        return a.type === CKEDITOR.NODE_ELEMENT;
                    });
                    if (!next) {
                        return;
                    }
                    next = next.find('>div>div.hm-page-content').getItem(0);
                    if (next) {
                        // 向上依次获取父元素的 index, 如果不是 td 也不是 最后一个 则 return
                        while (indexes.length > 0) {
                            var index = indexes.pop();
                            // 表格
                            if (next.$.nodeName === 'TABLE') {
                                var tbody = next.$.tBodies[0];
                                if (tbody) {
                                    next = new CKEDITOR.dom.element(next.$.tBodies[0]);
                                } else {
                                    break;
                                }
                            }
                            // 非td
                            else if (index === -1 && next.getFirst) {
                                var first = next.getFirst();
                                if (indexes.length > 1) {
                                    first = next.getFirst(function (a) {
                                        return a.type === CKEDITOR.NODE_ELEMENT
                                    });
                                }
                                if (first) {
                                    next = first;
                                } else {
                                    break;
                                }
                            }
                            // td
                            else if (index >= 0) {
                                var td = next.$.cells[index];
                                if (td) {
                                    next = new CKEDITOR.dom.element(td);
                                } else {
                                    break;
                                }
                            }
                        }
                        range0.setStart(next, 0);
                        range0.setEnd(next, 0);
                        try {
                            selection.selectRanges([range0]);
                        } catch (e) {
                            console.error(e);
                            debugger;
                        }
                    }
                }
            }
        },
        // 设置滚动条位置 (动画)
        setScrollTop: function setScrollTop(node, top, time) {
            if (!time) {
                node.scrollTop = top;
                // document.body.scrollTop = top;
                // document.documentElement.scrollTop = top;
                return top;
            }
            var spacingTime = 20; // 设置循环的间隔时间  值越小消耗性能越高
            var spacingInex = time / spacingTime; // 计算循环的次数
            var nowTop = node.scrollTop; // 获取当前滚动条位置
            var scrollTimer = setInterval(function () {
                if (spacingInex > 0) {
                    // 计算每次滑动的距离
                    nowTop += 6 * (top - nowTop) / spacingInex;
                    // 滑动
                    thisCmd.setScrollTop(node, nowTop);
                    spacingInex--;
                } else {
                    clearInterval(scrollTimer); // 清除计时器
                }
            }, spacingTime);
        },
        /** 去除分页的函数
         *
         * @param {CKEDITOR.editor} editor
         * @param {boolean} useCopy 如果为 true 则产生副本, 否则在原有 dom 上进行操作.
         *                  useCopy == true 时, 只产生副本, 否则还会记录当前编辑的位置以便下次恢复.
         *
         * @return {html.dom} 去除分页之后的文本
         */
        removeAllSplitters: function removeAllSplitters(editor, useCopy) {
            var _;
            var docTmp;
            var document = editor.document.$;
            // todo 默认文本包在一个div中
            var body = document.body;

            // 没有分页参数时不取消分页, localhost 除外
            var loc = window.location.href;
            if (!(loc.indexOf('http') >= 0 || loc.indexOf('localhost') >= 0 || loc.indexOf('127.0.0.1') >= 0) &&
                !editor.HMConfig.designMode &&
                (!editor.HMConfig.realtimePageBreak)) {
                return body;
            }

            console.log('[自动分页] 合并页面');
            var splittersRemoved;
            if (useCopy) {
                // 复制HTML
                splittersRemoved = body.cloneNode(true);
            } else {
                splittersRemoved = body;
            }
            var $splittersRemoved = $(splittersRemoved);

            // 合并内容, 一个逻辑页中只有一个页面内容板块
            var logicPages = $splittersRemoved.find('>div.' + thisCmd.LOGIC_PAGE_CLASS);
            var pageContents = $(logicPages).find('>>div.' + thisCmd.PAGE_CONTENT_CLASS);
            // 为了避免进行过多的保存书签操作, 此处仅在页面开启分页时保存书签.
            if (logicPages.length) {
                // 当前病历中的滚动位置
                var documentElement = editor.document.$.documentElement;
                lastScrollTop = documentElement && documentElement.scrollTop; // 滚动位置
                lastScrollLeft = documentElement && documentElement.scrollLeft; // 滚动位置

                // 老书签
                var oldBookmark = $(body).find('span[data-cke-bookmark="1"]').remove();

                // 保存编辑位置
                var bookmarks = editor.getSelection().createBookmarks(); // 当前光标
                // 获取书签的路径
                var bookmarkParents = (bookmarks && bookmarks.length > 0) ? bookmarks[0].startNode.getParents() : [];
                // 如果书签路径不合法, 则删除此书签.
                if (
                    // 书签游离于页面之外
                    bookmarkParents.length < 4 ||
                    // 书签在第一个页面的第0位
                    (bookmarkParents.length === 4 && bookmarkParents[2].getIndex() === 0 && bookmarkParents[3].getIndex() === 0)) {
                    // 删除书签
                    if (bookmarks) {
                        for (_ = 0; _ < bookmarks.length; _++) {
                            bookmarks[_].startNode.remove();
                            if (bookmarks[_].endNode) {
                                bookmarks[_].endNode.remove();
                            }
                        }
                    }
                } else {
                    // 如果新书签合法则删除老书签.
                    oldBookmark.remove();
                }
                bookmarks = null;
            }

            // 合并逻辑页
            for (var i = 0; i < logicPages.length; i++) {
                var pageContent = pageContents[i];
                // 添加分页标志
                if (i < logicPages.length - 1) {
                    // putSplitMarker(pageContent.lastChild, thisCmd.genPageSplitMarker(editor, false));
                }
                // 这里可以处理一些业务逻辑, 比如页码等

                // 合并前后页的元素
                if (i > 0) {
                    var firstChild = pageContent.firstChild;
                    if (firstChild) {
                        splittersRemoved.appendChild(firstChild);
                        combineFormat(editor, firstChild, true);
                    } else {
                        console.log('有页面未包含任何内容?');
                        debugger;
                    }
                }
                // 把内容放到 body 里面
                while (pageContent.childNodes.length > 0) {
                    splittersRemoved.appendChild(pageContent.firstChild);
                }
            }
            logicPages.remove();

            // 去除分页时添加的 'has-br' 属性, 并添加 <br>
            $splittersRemoved.find('.has-br').removeClass('has-br').append('<br>');

            // 如果部分聚合病历未完成合并, 需要采取补救措施
            // todo 如果非病历的元素节点也有 [data-hm-widgetid] 属性, 这边就会乱掉...
            var recordWidgets = editor.document.find("[data-hm-widgetid]");
            var mergedRecordWidgets = [];
            if (recordWidgets.count() > 0) {
                mergedRecordWidgets.push(recordWidgets.getItem(0));
                for (var i = 1; i < recordWidgets.count(); i++) {
                    var idOld = mergedRecordWidgets[mergedRecordWidgets.length - 1].getAttribute('data-hm-widgetid');
                    var $nodeNew = recordWidgets.getItem(i);
                    // 如果 id 相同则合并病历 (默认这种情况出现的很少, 故前面的 idOld 采用直接算的策略)
                    if (idOld === $nodeNew.getAttribute('data-hm-widgetid')) {
                        console.warn('部分聚合病历的自动分页项未成功合并');
                        // debugger
                        var $nodeOld = mergedRecordWidgets[mergedRecordWidgets.length - 1];

                        // 合并病历
                        var theLastNode = $nodeOld.getLast().$;
                        while ($nodeNew.getChildCount() > 0) {
                            $nodeOld.append($nodeNew.getFirst());
                        }
                        combineFormat(editor, theLastNode, false);
                        // 把 nodeNew 的父元素一起删除
                        var parentNodeNew = $nodeNew.getParent();
                        while (!parentNodeNew.getAttribute('tabindex')) {
                            parentNodeNew = parentNodeNew.getParent();
                        }
                        parentNodeNew.remove();
                    } else {
                        mergedRecordWidgets.push($nodeNew);
                    }
                }

                // 恢复页眉页脚的显示状态
                var emrWidgets = splittersRemoved.getElementsByClassName('emrWidget-content');
                if (emrWidgets.length > 0) {
                    $(emrWidgets[0]).find('table[_paperheader="true"]').css('display', '');
                    $(emrWidgets[emrWidgets.length - 1]).find('table[_paperfooter="true"]').css('display', '');
                }
            }
            // 恢复非聚合病历的页眉页脚的显示状态
            else {
                $splittersRemoved.find('table[_paperheader="true"],table[_paperfooter="true"]').css('display', '');
            }

            // region 恢复丢失的首页页眉和末页页脚, 考虑到空行故需要合并完成再处理
            // 页眉
            docTmp = (mergedRecordWidgets.length) ? mergedRecordWidgets[0].$ : body;
            if (thisCmd.pageHeaderGroup && !$(docTmp).find('[_paperheader="true"]').length) {
                for (_ = thisCmd.pageHeaderGroup.childNodes.length - 1; _ >= 0; _--) {
                    docTmp.insertBefore(thisCmd.pageHeaderGroup.childNodes[_].cloneNode(true), docTmp.firstChild);
                }
            }

            // 页脚
            docTmp = mergedRecordWidgets.length ? mergedRecordWidgets[mergedRecordWidgets.length - 1].$ : body;
            if (thisCmd.pageFooterGroup && !$(docTmp).find('[_paperfooter="true"]').length) {
                for (_ = 0; _ < thisCmd.pageFooterGroup.childNodes.length; _++) {
                    docTmp.appendChild(thisCmd.pageFooterGroup.childNodes[_].cloneNode(true));
                }
            }
            // endregion

            // // 去除每页的页面高度
            // var _bodyChildren = splittersRemoved.children;
            // for (var _ = 0; _ < _bodyChildren.length; _++) {
            //     if (hasClass(_bodyChildren[_], thisCmd.LOGIC_PAGE_CLASS)) {
            //         _bodyChildren[_].style.height = '';
            //     }
            // }

            // 恢复 body 的形状
            var paperMarginPx = CKEDITOR.plugins.paperCmd.paperMarginPx;
            splittersRemoved.style.paddingTop = 0;
            splittersRemoved.style.paddingLeft = paperMarginPx.left + 'px';
            splittersRemoved.style.paddingRight = paperMarginPx.right + 'px';
            splittersRemoved.style.paddingBottom = 0;
            splittersRemoved.style.width = CKEDITOR.plugins.paperCmd.logicPaperSize.width + 'px';

            splittersRemoved.style.background = 'white';
            // splittersRemoved.style.cursor = 'text';

            console.log('[自动分页] 合并页面已完成.');
            return splittersRemoved;
        },
        // 自动分页函数
        performAutoPaging: function performAutoPaging(editor, event) {
            // return; // aaaaaaaaa
            // todo debug 用于在控制台强制取消分页符的变量 (delete)
            removeSplitterDebugger = false;

            if (!editor.HMConfig.realtimePageBreak) {
                console.log('不进行实时分页');
                return;
            }

            var document = editor.document.$;
            var body = document.body;
            var $body = $(body);


            // region 事件溯源 + 预处理
            var events = [];
            var parentEvent = event;
            while (parentEvent) {
                parentEvent.name && events.push(parentEvent.name);

                // 预处理
                switch (parentEvent.name) {
                    case 'enterBlock':
                        var prevLine;
                        var nextLine;
                        if (parentEvent.splitInfo && parentEvent.splitInfo.previousBlock) {
                            prevLine = parentEvent.splitInfo.previousBlock.$;
                            nextLine = prevLine.nextSibling;
                        } else {
                            nextLine = editor.elementPath(parentEvent.range.startContainer).block.$;
                            prevLine = nextLine.previousElementSibling;
                        }
                        if (prevLine && nextLine) {
                            var prefix = getConnectorName(prevLine, thisCmd.CONNECTOR_PREFIX);
                            var suffix = getConnectorName(prevLine, thisCmd.CONNECTOR_SUFFIX);
                            removeClass(prevLine, prefix);
                            removeClass(nextLine, suffix);
                        } else {
                            console.warn('输入换行之后并未找到换行符前后对应的两行');
                        }
                        break;
                    case 'enterBr':
                    case '输入换行符':
                        console.log(parentEvent);
                        break;
                    case 'paperSize':
                        thisCmd.setPaperBorder(body);
                        break;

                    // 不分页的情况
                    case '打印前':
                    case '打印结束':
                    case 'afterPaging':// 禁止重复分页
                        return;
                    // case '护理表单渲染':
                    //     console.log('护理表单渲染数据前不分页');
                    //     return;
                    case 'undo':
                        console.log('正在撤销, 取消分页');
                        thisCmd.resetCurrentOperations();
                        return;
                    case 'redo':
                    case 'beforeRedo':
                        console.log('正在重做, 取消分页');
                        thisCmd.resetCurrentOperations();
                        return;
                }

                parentEvent = parentEvent.commandData || parentEvent.data;
            }
            console.log('[自动分页 - 事件溯源] ' + events.join(' - '));

            // 记录部分事件
            (events.indexOf('afterSync') !== -1) && (thisCmd.currentOperations.afterSync = true);
            // endregion


            // 未设置页面大小时禁止排序
            if (!CKEDITOR.plugins.paperCmd.inited) {
                console.log('未设置页面大小, 取消分页');
                return;
            }
            // 在设置内容时禁止排序
            if (thisCmd.currentOperations.setContent) {
                console.log('正在设置内容, 取消分页');
                return;
            }

            // endregion


            // 独立页面的保存调试; 需要配合控制台中的条件断点才能触发.
            if (removeSplitterDebugger) {
                thisCmd.removeAllSplitters(editor);
                return;
            }

            // region 保证每一次输入只执行一次函数
            if (thisCmd.autoPaging) {
                console.log('autoPaging, abort paging');
                return;
            }
            // 先设置正在分页标志再设置分页次数标志
            thisCmd.autoPaging = true;
            editor.autoPagebreakCounter++;
            // endregion


            // 执行分页
            setTimeout(function () {
                console.log('-------------');
                getFunExecTime('分页完成, 耗时', 1, function performAutoPaging1() {
                    var tabIndex_1, page, newPage, i, _, pageSplitMarks,
                        prevPage, nextPage, prevPageContent, nextPageContent;
                    try {
                        console.log('自动分页计数: ' + editor.autoPagebreakCounter);

                        timeLogger('分页前处理', 0);
                        var paperMarginPx = CKEDITOR.plugins.paperCmd.paperMarginPx;
                        thisCmd.setLogicPageWidth();
                        thisCmd.setPageNetHeight();
                        // 每一页的高度，减一以消除误差
                        var logicPageHeight = thisCmd.getPageNetHeight() + paperMarginPx.top + paperMarginPx.bottom;
                        body.style.padding = '';
                        body.style.width = thisCmd.getLogicPageWidth() + paperMarginPx.left + paperMarginPx.right + 'px';
                        body.style.background = '#E9EBEE';

                        forceStopPaging = false;
                        var LOGIC_PAGE_CLASS = thisCmd.LOGIC_PAGE_CLASS;
                        var PAGE_CONTENT_CLASS = thisCmd.PAGE_CONTENT_CLASS;

                        // region 预处理: 变更粗体的内联 style 为 strong 标签
                        if (editor.autoPagebreakCounter < 1) {
                            convertBoldToStrong(body);
                        }
                        // endregion

                        var logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);

                        // region 预处理: 保存当前光标位置
                        var selection = editor.getSelection(); // 当前选中区域
                        var bookmarks = null, scrollTop = 0, scrollLeft = 0;

                        // 保存当前滚动位置
                        var documentElement = editor.document.$.documentElement;
                        scrollTop = documentElement && documentElement.scrollTop; // 滚动位置
                        scrollLeft = documentElement && documentElement.scrollLeft; // 滚动位置
                        // 如果在取消分页时保存了滚动位置, 则参考之.
                        if (scrollTop < lastScrollTop) {
                            scrollTop = lastScrollTop;
                            scrollLeft = lastScrollLeft;
                        }
                        // 清空滚动条
                        lastScrollTop = 0;
                        lastScrollLeft = 0;

                        // 恢复上一次保存的编辑位置
                        var lastTimeSelectSpans = $body.find('span[data-cke-bookmark="1"]');
                        if (lastTimeSelectSpans.length) {
                            var lastSelectSpan = new CKEDITOR.dom.element(lastTimeSelectSpans[lastTimeSelectSpans.length - 1]);
                            try {
                                var range = new CKEDITOR.dom.range(editor.document);
                                range.setStartBefore(lastSelectSpan);
                                range.setEndBefore(lastSelectSpan);
                                selection.selectRanges([range]);
                                bookmarks = selection.createBookmarks(); // 建立书签
                            } catch (e) {
                                console.error('书签创建错误');
                                console.error(e);
                                debugger;
                            }
                            lastTimeSelectSpans.remove();
                        }

                        // 创建书签
                        if (editor.autoPagebreakCounter > 1) {
                            if (!bookmarks) {
                                bookmarks = selection.createBookmarks(); // 当前光标
                            }
                        }
                        // 获取书签的路径
                        var bookmarkParents = (bookmarks && bookmarks.length > 0) ? bookmarks[0].startNode.getParents() : [];
                        // 如果书签路径不合法, 则删除此书签.
                        if (
                            // 书签游离于页面之外
                            bookmarkParents.length < 4 ||
                            // 书签在第一个页面的第0位
                            (bookmarkParents.length === 4 && bookmarkParents[2].getIndex() === 0 && bookmarkParents[3].getIndex() === 0)) {
                            // 删除书签
                            if (bookmarks) {
                                for (_ = 0; _ < bookmarks.length; _++) {
                                    bookmarks[_].startNode.remove();
                                    if (bookmarks[_].endNode) {
                                        bookmarks[_].endNode.remove();
                                    }
                                }
                            }
                            bookmarks = null;
                        }
                        // endregion

                        // 预处理: 隐藏不打印的内容, 去除页面的高度设置
                        thisCmd.switchCssPaging(body);

                        var SPLIT_BEFORE_DOC_TEMP = thisCmd.SPLIT_BEFORE_DOC_TEMP;
                        var SPLIT_AFTER_DOC_TEMP = thisCmd.SPLIT_AFTER_DOC_TEMP;
                        var SPLIT_AFTER_DOC = thisCmd.SPLIT_AFTER_DOC;

                        // region 获取页眉页脚
                        // 临时的
                        var _pageHeader, _pageFooter;
                        // 原页面中的
                        var pageHeaders = [], pageFooters = [];
                        // 页面中的
                        var pageHeaderGroup, pageFooterGroup;

                        // 首次分页, 数据同步, 或者聚合病历未看到逻辑页时获取页眉页脚
                        // 判断是否为聚合病历. 如果是聚合病历则只取首个病历的页眉和最后一个病历的页脚.
                        // 2022-08-08 如果有多个页脚则只取一个
                        var emrWidgets = body.getElementsByClassName('emrWidget-content');
                        if (!thisCmd.pageHeaderGroup ||
                            thisCmd.currentOperations.afterSync ||
                            (emrWidgets.length && logicPages.length === 0)) {

                            pageHeaderGroup = document.createElement('div');
                            pageFooterGroup = document.createElement('div');
                            pageHeaderGroup.className = thisCmd.PAGE_HEADER_CLASS;
                            pageFooterGroup.className = thisCmd.PAGE_FOOTER_CLASS;
                            pageHeaderGroup.setAttribute("contenteditable", false);
                            pageFooterGroup.setAttribute("contenteditable", false);

                            if (emrWidgets.length) {
                                for (_ = 0; _ < emrWidgets.length && pageHeaders.length === 0; _++) {
                                    pageHeaders = $(emrWidgets[_]).find('table[_paperheader="true"]');
                                }
                                for (_ = emrWidgets.length - 1; _ >= 0 && pageFooters.length === 0; _--) {
                                    pageFooters = $(emrWidgets[_]).find('table[_paperfooter="true"]').filter(function (i, item) {
                                        return item.getElementsByClassName('page').length
                                    }).first();
                                }
                            } else if (!logicPages.length) {
                                pageHeaders = $body.find('table[_paperheader="true"]');
                                pageFooters = $body.find('table[_paperfooter="true"]').filter(function (i, item) {
                                    return item.getElementsByClassName('page').length
                                }).first();
                            } else {
                                pageHeaders = $body.find('.' + PAGE_CONTENT_CLASS + ' table[_paperheader="true"]');
                                pageFooters = $body.find('.' + PAGE_CONTENT_CLASS + ' table[_paperfooter="true"]').filter(function (i, item) {
                                    return item.getElementsByClassName('page').length
                                }).first();
                            }

                            // 如果页脚中没有页码则放宽限制
                            if (!pageFooters.length) {
                                pageFooters = $body.find('table[_paperfooter="true"]').last();
                            }

                            for (_ = 0; _ < pageHeaders.length; _++) {
                                _pageHeader = pageHeaders[_].cloneNode(true);
                                _pageHeader.style.display = '';
                                pageHeaders[_].style.display = 'none';
                                pageHeaderGroup.append(_pageHeader);
                            }
                            for (_ = pageFooters.length - 1; _ >= 0; _--) {
                                _pageFooter = pageFooters[_].cloneNode(true);
                                _pageFooter.style.display = '';
                                pageFooters[_].style.display = 'none';
                                pageFooterGroup.append(_pageFooter);
                            }

                            // 复制一份避免被更改
                            thisCmd.pageHeaderGroup = pageHeaderGroup.cloneNode(true);
                            thisCmd.pageFooterGroup = pageFooterGroup.cloneNode(true);
                        } else {
                            pageHeaderGroup = thisCmd.pageHeaderGroup;
                            pageFooterGroup = thisCmd.pageFooterGroup;
                        }
                        // endregion

                        // 如果是初次打开文件(没有当前操作节点) 则 currentNode = null
                        var currentNode = editor.elementPath() && editor.elementPath().lastElement.$;


                        // region 预处理: 没有页面时, 根据分页标志添加分页符, 并且删除页眉页脚
                        var logicPagesLength = logicPages.length;
                        if (!logicPagesLength) {
                            var additionalAttributes;
                            // 删除页眉页脚
                            $body.find('table[_paperheader="true"],table[_paperfooter="true"]').css('display', 'none');
                            // 首先添加一个逻辑页, 避免后续 moveToTop 的时候发生问题
                            thisCmd.packPageContents(editor);

                            pageSplitMarks = $body.find('.' + thisCmd.PAGE_SPLIT_MARK);
                            // 记录前一页的高度, 如果相邻两页撞车就不添加分页符了 (此时遇到强制分页符时就删除前一个分页符)
                            var lastSplitterTop = -Infinity;
                            // 遍历每一个标记符
                            for (var mark, markIndex = 0; markIndex < pageSplitMarks.length; markIndex++) {
                                mark = pageSplitMarks[markIndex];
                                // 此处可以计算父节点的 offsetBottom
                                var parentNode = mark;
                                if (parentNode.parentNode.nodeName !== 'BODY') {
                                    do {
                                        parentNode = parentNode.parentNode;
                                    }
                                    while (parentNode.parentNode.nodeName !== 'BODY');
                                }
                                var offsetBottom = parentNode.offsetTop + parentNode.offsetHeight;
                                // 如果间距过小先跳过, 否则插入分页符
                                // 但是如果分页标记没有父节点, 而分页标记又是隐藏的, 此时必须插入分页符.
                                if (offsetBottom === 0 || offsetBottom - lastSplitterTop >= logicPageHeight) {
                                    additionalAttributes = {};
                                    if ('true' === mark.getAttribute('force')) {
                                        additionalAttributes[thisCmd.FORCE_BREAK] = true;
                                    }
                                    var splitter = document.createElement('div');
                                    insertAfter(mark.parentNode, splitter, mark);
                                    moveToTop(editor, splitter);
                                    thisCmd.packPageContents(editor);
                                    lastSplitterTop = splitter.offsetTop;
                                    splitter.remove();
                                    splitter = null;
                                } else {
                                    debugger;
                                }
                            }

                            // // body 的形状
                            // body.style.padding = 0;
                            // body.style.width = thisCmd.getLogicPageWidth() +
                            //     paperMargin.left + paperMargin.right + 'px';
                            // body.style.cursor = 'url(' + CKEDITOR.getUrl(thisCmd.sourcePath + 'images/pagebreak.gif') + ')';
                            // body.style.cursor = 'vertical-text';

                        }
                        // 删除非强制的分页标志; 删除之前要先合并
                        pageSplitMarks = $body.find('.' + thisCmd.PAGE_SPLIT_MARK + '[force=false]');
                        pageSplitMarks.remove();

                        // endregion

                        // region 预处理: 添加至少一个页面
                        if (logicPages.length === 0) {
                            var div = document.createElement('div');
                            body.appendChild(div);
                            thisCmd.packPageContents(editor);
                            div.remove();
                            div = null;
                        }
                        // endregion

                        // region 预处理: 寻找 成组病历单个打印 + 另起一页 + 单独一页 + 在此病历后分页 标志并添加分页符

                        if (!logicPagesLength || events.indexOf('cancelSplitAfterDoc') !== -1) {
                            page = logicPages[0];
                            var widgets;

                            // if (continuousGroupRecord) {
                            //     if (queryHospitalParams()['成组病历设置']['成组病历合并打印'] != 'Y') {
                            //         // 成组病历单个打印
                            //         widgets = $body.find('.emrWidget-content').attr(SPLIT_AFTER_DOC_TEMP, true);
                            //         for (_ = 0; _ < widgets.length; _++) {
                            //             tabIndex_1 = widgets[_].parentNode.parentNode;
                            //             page.setAttribute(SPLIT_AFTER_DOC_TEMP, true);
                            //             page = thisCmd.splitLogicPagesAfter(editor, page, tabIndex_1);
                            //         }
                            //     }
                            // } else {
                                // 另起一页 + 单独一页

                                // todo 这里并没有添加分页标志.
                                // var splitPageParams = queryHospitalParams()['另页打印设置'] || {}; // 增加该参数替换另页打印的参数
                                var splitPageParams = editor.HMConfig.printConfig;

                                widgets = $body.find('.emrWidget-content').removeAttr(SPLIT_BEFORE_DOC_TEMP).removeAttr(SPLIT_AFTER_DOC_TEMP);
                                // if (splitPageParams.checkedType && (splitPageParams.checkedType.includes('another') || splitPageParams.checkedType.includes('alone'))) {
                                if (splitPageParams.pageAnotherTpls || splitPageParams.pageAloneTpls ) {
                                    // // 另起一页
                                    // var anotherTempaltes = splitPageParams.anotherTemplates || [];
                                    // // 单独分页
                                    // var aloneTempaltes = splitPageParams.aloneTemplates || [];
                                    // 另起一页
                                    var anotherTempaltes = splitPageParams.pageAnotherTpls || [];
                                    // 单独分页
                                    var aloneTempaltes = splitPageParams.pageAloneTpls || [];
                                    var len = widgets.length;
                                    for (i = 0; i < len; i++) {
                                        var widget = widgets[i];
                                        tabIndex_1 = widget.parentNode.parentNode;

                                        // 病历名称
                                        var templateName = widget.getAttribute('data-hm-widgetname');
                                        // 是否包含某一参数
                                        var aloneFlag = aloneTempaltes.includes(templateName);
                                        var anotherFlag = anotherTempaltes.includes(templateName);

                                        if (aloneFlag) {
                                            // 独立一页
                                            widget.setAttribute(SPLIT_BEFORE_DOC_TEMP, true);
                                            widget.setAttribute(SPLIT_AFTER_DOC_TEMP, true);

                                            nextPage = thisCmd.splitLogicPagesAfter(editor, page, tabIndex_1);
                                            if (tabIndex_1.previousElementSibling) {
                                                page = thisCmd.splitLogicPagesAfter(editor, page, tabIndex_1.previousElementSibling);
                                            }
                                            page.setAttribute(SPLIT_BEFORE_DOC_TEMP, true);
                                            page.setAttribute(SPLIT_AFTER_DOC_TEMP, true);
                                            page = nextPage; // 等于 null 也没关系
                                        } else if (anotherFlag) {
                                            // 另起一页
                                            widget.setAttribute(SPLIT_BEFORE_DOC_TEMP, true);

                                            if (tabIndex_1.previousElementSibling) {
                                                page = thisCmd.splitLogicPagesAfter(editor, page, tabIndex_1.previousElementSibling);
                                            }
                                            page.setAttribute(SPLIT_BEFORE_DOC_TEMP, true);
                                        }
                                    }
                                }
                            // }
                        }

                        // 在此病历后分页
                        if (!logicPagesLength || events.indexOf('splitAfterDoc') !== -1) {
                            var oldWidgetId = null, widgetId;
                            var splitAfterDocWidgets = $body.find('[' + SPLIT_AFTER_DOC + ']');
                            for (i = splitAfterDocWidgets.length - 1; i >= 0; i--) {
                                widgetId = splitAfterDocWidgets[i].getAttribute('data-hm-widgetid');
                                if (!widgetId) {
                                    continue;
                                }
                                tabIndex_1 = splitAfterDocWidgets[i]; // 最接近 pageContent 的那一层
                                while (tabIndex_1.parentNode && !hasClass(tabIndex_1.parentNode, thisCmd.PAGE_CONTENT_CLASS)) {
                                    tabIndex_1 = tabIndex_1.parentNode;
                                }
                                if (!tabIndex_1) {
                                    continue;
                                }
                                // 查看是否在该元素后面有分页标志, 如果没有就加分页符 或者修改分页符标志
                                page = $(tabIndex_1).parents('div').last()[0];

                                // // 自定义分页符, 两种自定义分页符不可混淆
                                // var isForceBreak = (prevPage.getAttribute(thisCmd.FORCE_BREAK) === 'true');
                                // // 聚合病例中某一病历之后的分页符
                                // var doNotMoveUp = (prevPage.getAttribute(SPLIT_AFTER_DOC) === 'true');

                                // 只在当前病历的最后一块的逻辑页加上 '在此病历后分页'
                                if (widgetId !== oldWidgetId) {
                                    newPage = thisCmd.splitLogicPagesAfter(editor, page, tabIndex_1);
                                    if (newPage && page.getAttribute(SPLIT_AFTER_DOC_TEMP) === 'true') {
                                        newPage.setAttribute(SPLIT_AFTER_DOC_TEMP, 'true');
                                    } else {
                                        page.setAttribute(SPLIT_AFTER_DOC_TEMP, 'true');
                                    }
                                }
                                oldWidgetId = widgetId;
                            }
                        }
                        // endregion

                        // region 预处理: 去除最后一行两端对齐的 class
                        $body.find('.justify-last').removeClass('justify-last');
                        // endregion

                        // region  --- 对每个页面进行处理 ---
                        var pageNumArgs = {
                            // 病历聚合中, 最后一个要求设置页码的病历ID
                            theLastOrganizedWidgetId: null,
                            pageNum: 1
                        };

                        // 优化: 仅对当前页面之后的页面进行处理
                        var logicPageIndex = 0;
                        if (events.indexOf('type') !== -1) {
                            var currentParents = $(currentNode).parents();
                            prevPage = currentParents.filter('.' + thisCmd.PAGE_CONTENT_CLASS);
                            if (prevPage.length) {
                                prevPage = currentParents.filter('.' + thisCmd.LOGIC_PAGE_CLASS);
                                var index = prevPage.index();
                                if (index > 0) {
                                    logicPageIndex = index;
                                }
                            }
                            if (logicPageIndex > 0) {
                                pageNumArgs.page = logicPages[logicPageIndex - 1];
                                thisCmd.getPageNum(pageNumArgs);
                                pageNumArgs.pageNum++;
                            }
                        }

                        timeEndLogger('分页前处理', 0);

                        // --- 对每个分页符进行处理 ---
                        for (; !forceStopPaging && logicPageIndex < logicPages.length; logicPageIndex++) {
                            console.debug('处理第' + (1 + logicPageIndex) + '/' + logicPages.length + '页');

                            timeLogger('页耗时', 0);
                            prevPage = logicPages[logicPageIndex];
                            prevPageContent = prevPage.getElementsByClassName(PAGE_CONTENT_CLASS)[0];
                            nextPage = prevPage.nextSibling;
                            // 判断是否为逻辑页 (如果是 data-cke-hidden-sel, 直接跳到加页码处)
                            if (nextPage && nextPage.getAttribute('data-cke-hidden-sel') === '1') {
                                nextPage = null;
                            }

                            nextPageContent = nextPage && nextPage.getElementsByClassName(PAGE_CONTENT_CLASS)[0];

                            timeLogger('预处理', 0);
                            // 预处理1: 重新计算前一页的表格冗余量
                            // 在 chrome 中, 表格渲染时是精确渲染; 然而在打印时是向上取整. 故要对每个表格行的误差进行统计. (什么? 两个表并排的情况? 啊哈哈哈哈哈哈)
                            setPageOffset(prevPage, calcPageOffset(prevPage, false));

                            // 预处理2: 添加与页脚同高的占位符
                            setPageFooterPlaceHolder(prevPage);

                            // 预处理3: 如果前一页的最后一个元素含有换行符, 需要恢复此换行符.
                            // 这句去掉之后每次输入会引起分页变化?
                            var lastChar = prevPageContent.lastChild;
                            while (lastChar && lastChar.nodeType === CKEDITOR.NODE_ELEMENT) {
                                if (hasClass(lastChar, thisCmd.HAS_BR)) {
                                    lastChar.appendChild(document.createElement('BR'));
                                    removeClass(lastChar, thisCmd.HAS_BR);
                                    break;
                                }
                                lastChar = lastChar.lastChild;
                            }

                            timeEndLogger('预处理', 0);

                            timeLogger('往前挪', 0);
                            // region 2. 将后一页字符往前挪 -- if 当前分页符非强制 且 (删除字符导致分页符上移, 或者在前一页进行操作导致内容缩减)
                            try {
                                // 自定义分页符, 两种自定义分页符不可混淆
                                var isForceBreak = (prevPage.getAttribute(thisCmd.FORCE_BREAK) === 'true');
                                // 聚合病例中某一病历之后的分页符
                                var doNotMoveUp = (prevPage.getAttribute(SPLIT_AFTER_DOC_TEMP) === 'true' || nextPage && nextPage.getAttribute(SPLIT_BEFORE_DOC_TEMP) === 'true');

                                // 把下面的元素移到上面来, 考虑页眉
                                if (!isForceBreak && nextPage && !doNotMoveUp &&
                                    (logicPageHeight > prevPage.offsetHeight ||
                                        currentNode && currentNode.className && hasClassPrefix(currentNode, thisCmd.CONNECTOR_PREFIX))) {
                                    // 如果后面的元素不是逻辑页
                                    if (nextPage.nodeType !== CKEDITOR.NODE_ELEMENT || !hasClass(nextPage, LOGIC_PAGE_CLASS)) {
                                        thisCmd.packPageContents(editor);
                                        nextPage = prevPage.nextSibling;
                                        nextPageContent = nextPage.getElementsByClassName(PAGE_CONTENT_CLASS)[0];
                                    }
                                    // nextPageContent 找不到对象
                                    nextPageContent = nextPageContent || nextPage && nextPage.getElementsByClassName(PAGE_CONTENT_CLASS)[0];

                                    // 下一页的字符往前挪, 有可能全挪完: 因为有margin的存在
                                    var lastTableInPrevPage = null;
                                    var cycleCount = 0;
                                    while (!forceStopPaging && !isForceBreak && !doNotMoveUp &&
                                    nextPageContent.childNodes.length > 0 &&
                                    prevPage.offsetHeight <= logicPageHeight) {
                                        if (cycleCount++ > thisCmd.MAX_CYCLE_COUNT) {
                                            autoPageError(editor, '超时: 下一页的字符往前挪');
                                            forceStopPaging = true;
                                            setPageBreakByHandLabel(false);
                                        }
                                        if (cycleCount > 5000) {
                                            debugger
                                        }
                                        lastTableInPrevPage = getTableInOnePage(prevPageContent, false);

                                        var theFirstChar = getFirstChar(editor, nextPageContent.firstChild, {
                                            body: body,
                                            logicPageHeight: logicPageHeight,
                                            prevPage: prevPage,
                                            prevPageContent: prevPageContent,
                                            // nextPage: nextPage,
                                            // nextPageContent: nextPageContent,
                                            forceDivide: false,
                                            lastTableInPrevPage: lastTableInPrevPage
                                        });
                                        if (!theFirstChar.node) {
                                            // debugger;
                                            continue;
                                        }
                                        if (theFirstChar.node.length === 0) break;
                                        if (theFirstChar.node.nodeType === CKEDITOR.NODE_ELEMENT ||
                                            theFirstChar.node.nodeType === CKEDITOR.NODE_TEXT) {
                                            prevPageContent.append(theFirstChar.node);
                                            combineFormat(editor, theFirstChar.node, true);
                                            if (theFirstChar.hasTable) {
                                                setPageOffset(prevPage, calcPageOffset(prevPage, !!theFirstChar.tableHasConnector));
                                            }
                                        } else {
                                            debugger;
                                            prevPageContent.appendChild(theFirstChar);
                                        }
                                        // 如果后面一页无内容了就删除页
                                        if (nextPageContent.childNodes.length === 0) {
                                            combineFormat(editor, nextPage, true);
                                            logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);
                                            nextPage = prevPage.nextSibling;
                                            nextPageContent = nextPage.getElementsByClassName(PAGE_CONTENT_CLASS)[0];
                                            if (!nextPage) {
                                                // 需要处理末页高度的问题
                                                debugger;
                                                break;
                                            }
                                        }

                                        // (聚合病历专用) 如果前一个病历有强制分页标志, 且前后病历 id 不一致, 则添加强制分页标志
                                        var prevContents = $(prevPageContent.lastChild).find('.emrWidget-content');
                                        if (prevContents.length > 0 && prevContents[prevContents.length - 1].getAttribute(SPLIT_AFTER_DOC) === 'true') {
                                            // 前页的最后一个病历 id
                                            var prevId = prevContents[prevContents.length - 1].getAttribute('data-hm-widgetid');
                                            var nextContent = $(nextPageContent).find('.emrWidget-content');
                                            // 如果后一页没有对应病历, 则在前一页上面放置一个临时分页标志用于快速识别分页信息
                                            if (nextContent.length === 0 || nextContent[0].getAttribute('data-hm-widgetid') !== prevId) {
                                                prevPage.setAttribute(SPLIT_AFTER_DOC_TEMP, 'true');
                                                doNotMoveUp = true;
                                                break;
                                            }
                                        }
                                    }
                                    var asd = 0;
                                }
                                // 检查分页符前面是否有占位符,有的话先去掉
                            } catch (e) {
                                console.error(e);
                                forceStopPaging = true;
                                setPageBreakByHandLabel(false);
                                autoPageError(editor);
                                debugger
                                throw(e);
                            }
                            // endregion
                            ////////////////////////////////////////////////////////////////////////////////////////
                            timeEndLogger('往前挪', 0);

                            timeLogger('往后挪', 0);
                            // region 3. 将前一页字符往后挪 -- if 输入字符导致分页符下沉
                            try {
                                if (nextPage) {
                                    // 前一页的字符往后挪
                                    // 有可能全挪完: 因为有margin的存在
                                    var firstTableInNextPage = null;
                                    cycleCount = 0;
                                    while (!forceStopPaging && prevPage.offsetHeight > logicPageHeight) {
                                        if (cycleCount++ > thisCmd.MAX_CYCLE_COUNT) {
                                            autoPageError(editor, '超时: 前一页的字符往后挪');
                                            forceStopPaging = true;
                                            setPageBreakByHandLabel(false);
                                        }
                                        if (cycleCount > 5000) {
                                            debugger
                                        }

                                        // 如果仍然过高就往后面挪
                                        // 把上面的元素移到下面来, 考虑页眉
                                        if (nextPageContent) {
                                            firstTableInNextPage = getTableInOnePage(nextPageContent, true);
                                        }
                                        var theLastChar = getLastChar(editor, prevPageContent.lastChild, {
                                            body: body,
                                            logicPageHeight: logicPageHeight,
                                            prevPage: prevPage,
                                            prevPageContent: prevPageContent,
                                            // nextPage: nextPage,
                                            nextPageContent: nextPageContent,
                                            forceDivide: false,
                                            firstTableInNextPage: firstTableInNextPage,
                                            // 父级元素的 offsetTop
                                            parentTop: prevPageContent.offsetTop
                                        });
                                        if (!theLastChar.node) {
                                            // debugger;
                                            continue;
                                        }
                                        // 更新 在此页前后分页 的标记
                                        if (prevPage.getAttribute(SPLIT_AFTER_DOC_TEMP)) {
                                            // 在此页之后添加页
                                            nextPage = thisCmd.genLogicPage(editor, thisCmd.pageHeaderGroup, thisCmd.pageFooterGroup);
                                            nextPageContent = nextPage.getElementsByClassName(thisCmd.PAGE_CONTENT_CLASS)[0];

                                            nextPageContent.appendChild(theLastChar.node);
                                            insertAfter(body, nextPage, prevPage);
                                            logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);

                                            nextPage.setAttribute(SPLIT_AFTER_DOC_TEMP, true);
                                            prevPage.removeAttribute(SPLIT_AFTER_DOC_TEMP);

                                            continue;
                                        } else if (nextPage.getAttribute(SPLIT_BEFORE_DOC_TEMP)) {
                                            // 在下一页之前插入一个新页
                                            nextPage = thisCmd.genLogicPage(editor, thisCmd.pageHeaderGroup, thisCmd.pageFooterGroup);
                                            nextPageContent = nextPage.getElementsByClassName(thisCmd.PAGE_CONTENT_CLASS)[0];

                                            nextPageContent.appendChild(theLastChar.node);
                                            insertAfter(body, nextPage, prevPage);
                                            logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);

                                            continue;
                                        }

                                        // 插入节点
                                        if (theLastChar.node.nodeType === CKEDITOR.NODE_ELEMENT ||
                                            theLastChar.node.nodeType === CKEDITOR.NODE_TEXT) {
                                            nextPageContent.insertBefore(theLastChar.node, nextPageContent.firstChild);
                                            combineFormat(editor, theLastChar.node, false);
                                            if (theLastChar.hasTable) {
                                                setPageOffset(prevPage, calcPageOffset(prevPage, !!theLastChar.tableHasConnector));
                                            }
                                        } else {
                                            debugger
                                            nextPageContent.insertBefore(theLastChar.node, nextPageContent.firstChild);
                                        }
                                        if (prevPageContent.childNodes.length === 0) {
                                            // 聚合病历的模板不能开启分页, 否则就会报这个错
                                            console.error('分页失败, 原因可能是有超出页面长度的元素');
                                            debugger
                                            // prevPage.remove();
                                            // logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);
                                            // logicPageIndex--;
                                            // break;

                                            throw new Error('分页失败, 原因可能是有超出页面长度的元素');
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                                forceStopPaging = true;
                                setPageBreakByHandLabel(false);
                                autoPageError(editor);
                                debugger
                                throw(e);
                            }
                            // endregion
                            timeEndLogger('往后挪', 0);

                            timeLogger('后处理', 0);
                            // 4. 设置两端对齐
                            if (!prevPage.getAttribute(thisCmd.FORCE_BREAK)) {
                                setJustify(editor,prevPageContent);
                            }

                            // 6. 删除多余页
                            if (nextPageContent && !nextPageContent.childNodes.length) {
                                nextPage.remove();
                                // 更新在此页前后分页的标记
                                if (nextPage.getAttribute(SPLIT_AFTER_DOC_TEMP)) {
                                    prevPage.setAttribute(SPLIT_AFTER_DOC_TEMP, true);
                                }
                                logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);
                            }

                            // 7. 设置页码 / 增加分页符: 如果这是最后一页, 或者后一页高度大于1.5页, 则添加页.
                            if ((!nextPage && prevPage.offsetHeight > logicPageHeight)) {
                                // 如果这是最后一页, 则添加页.
                                console.debug('增加页面1');
                                newPage = thisCmd.genLogicPage(editor, pageHeaderGroup, pageFooterGroup);
                                if (prevPage.getAttribute(SPLIT_AFTER_DOC_TEMP)) {
                                    prevPage.removeAttribute(SPLIT_AFTER_DOC_TEMP);
                                    newPage.setAttribute(SPLIT_AFTER_DOC_TEMP, true);
                                }

                                // data-cke-hidden-sel 固定为 body 的最后一个元素, 所以不能直接 append
                                insertAfter(body, newPage, prevPage);
                                logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);
                                logicPageIndex--;
                            } else {
                                // 设置页码
                                pageNumArgs.page = prevPage;
                                thisCmd.setPageNum(pageNumArgs);

                                if (nextPage) {
                                    // 如果后一页高度大于2.5页, 则在下一页之前添加页.
                                    if (nextPage.offsetHeight > 2 * logicPageHeight) {
                                        console.debug('增加页面2');
                                        newPage = thisCmd.genLogicPage(editor, pageHeaderGroup, pageFooterGroup);
                                        if (nextPage.getAttribute(SPLIT_BEFORE_DOC_TEMP)) {
                                            nextPage.removeAttribute(SPLIT_BEFORE_DOC_TEMP);
                                            newPage.setAttribute(SPLIT_BEFORE_DOC_TEMP, true);
                                        }

                                        body.insertBefore(newPage, nextPage);
                                        logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);
                                    }
                                    // 如果后一页高度大于1.5页, 则在下一页之后添加页.
                                    else if (nextPage.offsetHeight > 1.5 * logicPageHeight) {
                                        console.debug('增加页面3');
                                        newPage = thisCmd.genLogicPage(editor, pageHeaderGroup, pageFooterGroup);
                                        if (nextPage.getAttribute(SPLIT_AFTER_DOC_TEMP)) {
                                            nextPage.removeAttribute(SPLIT_AFTER_DOC_TEMP);
                                            newPage.setAttribute(SPLIT_AFTER_DOC_TEMP, true);
                                        }

                                        insertAfter(body, newPage, nextPage);
                                        logicPages = body.getElementsByClassName(LOGIC_PAGE_CLASS);
                                    }
                                }
                            }
                            timeEndLogger('后处理', 0);

                            timeEndLogger('页耗时', 0);
                            console.debug('\n');
                        }
                        // 当回车导致书签在页末, 且书签父级子节点只有书签 (书签父节点是p), 而且书签父级有分页连接符时, 需要把 p 挪到下一页.
                        if (bookmarks && bookmarks[0] && bookmarks[0].startNode) {
                            var bookmarkParent = bookmarks[0].startNode.$.parentNode;
                            var prefix = getConnectorName(bookmarkParent, thisCmd.CONNECTOR_PREFIX);
                            if (bookmarkParent.nodeName === 'P' && bookmarkParent.childNodes.length === 1 && prefix) {
                                // 取到上一页的逻辑页
                                var parent1 = bookmarkParent;
                                while (parent1.parentNode.nodeName !== 'BODY') {
                                    parent1 = parent1.parentNode;
                                }
                                // 如果下一页中有对应元素, 则挪 p.
                                if (parent1.nextElementSibling && hasClass(parent1.nextElementSibling, thisCmd.LOGIC_PAGE_CLASS)) {
                                    var suffixInPrefixConnectors = prefix.substr(thisCmd.CONNECTOR_PREFIX.length);
                                    var next = parent1.nextElementSibling.getElementsByClassName(thisCmd.CONNECTOR_SUFFIX + suffixInPrefixConnectors);
                                    if (next.length) {
                                        next[0].parentNode.insertBefore(bookmarkParent, next[0]);
                                        combineFormat(editor, bookmarkParent, false);
                                    }
                                }
                            }
                        }

                        // endregion
                        // endregion
                        // // region 后处理: 最后一页的页面
                        // var pages = $(document).find('body>.' + LOGIC_PAGE_CLASS);
                        // if (pages.length > 0) {
                        //     prevPage = pages[pages.length - 1];
                        // }
                        // // 如果压根没有页面就建一个(?)
                        // else {
                        //     prevPage = editor.document.$.createElement('div');
                        //     prevPage.className = LOGIC_PAGE_CLASS;
                        //     while (body.childNodes.length > 0) {
                        //         prevPage.appendChild(body.firstChild);
                        //     }
                        //     body.appendChild(prevPage);
                        // }
                        // // endregion

                        // region 后处理: 恢复当前光标位置

                        // console.log('分页完成.');
                    } catch (e) {
                        console.error(e);
                        forceStopPaging = true;
                        setPageBreakByHandLabel(false);
                        autoPageError(editor);
                        debugger
                        throw(e);
                    } finally {
                        timeLogger('分页后处理', 0);
                        thisCmd.autoPaging = false;
                        // 收尾: 取消隐藏删除内容
                        thisCmd.switchCssEdit(body);
                        var editorMerge = true;

                        // region 收尾: 根据书签恢复选区
                        if (!bookmarks) {
                            try {
                                console.log('首次设置书签或非法书签, 重设书签');

                                // 首次分页时, 将光标移动至首个可编辑的非空元素前
                                var child = findFirstEditableChild(body, 'false' !== body.contentEditable);
                                if (child) {
                                    child.parentNode.focus();// 此句只对新文本标签有用
                                    var _sel = document.getSelection();
                                    if (_sel.rangeCount > 0) {
                                        var range0 = _sel.getRangeAt(0);
                                        range0.setStart(child, 0);
                                        range0.setEnd(child, 0);
                                        // child.parentNode.style.background = 'red';
                                    }
                                }
                            } catch (e) {
                                console.warn(e);
                                debugger;
                            }
                        } else {
                            // 还原光标位置
                            try {
                                // 滚动到前一次的位置
                                if (scrollTop) {
                                    editor.document.$.defaultView.scrollTo(scrollLeft, scrollTop);
                                } else if (100 + $(bookmarks[bookmarks.length - 1].startNode.$).offset().top > $(window).height()) {
                                    bookmarks[bookmarks.length - 1].startNode.$.style.display = 'unset';
                                    bookmarks[bookmarks.length - 1].startNode.$.scrollIntoView();
                                    bookmarks[bookmarks.length - 1].startNode.$.style.display = 'none';
                                }
                                // bookmarks 的前面一个元素为零宽字符, 若恢复书签之后丢失选区, 可以选到他上面
                                var prev = bookmarks[0].startNode.getPrevious();
                                var next = bookmarks[0].startNode.getNext();
                                if (!prev && !next) {
                                    // 书签前后没东西了?
                                    next = new CKEDITOR.dom.text('\u200b');
                                    next.appendTo(bookmarks[0].startNode.getParent());
                                    debugger
                                }
                                selection.selectBookmarks(bookmarks, true);

                                // 恢复书签之后, 可能造成选区的改变 (比如从文字节点内挪到文字节点前面). 此时需要挪进去.
                                selection = editor.getSelection();
                                range0 = selection.getRanges()[0];
                                if (!range0 || range0.startContainer.type === CKEDITOR.NODE_ELEMENT) {
                                    if (prev && (prev.type === CKEDITOR.NODE_TEXT)) {
                                        // 如果左边是字就选进去
                                        range0 = new CKEDITOR.dom.range(editor.document);
                                        range0.moveToPosition(prev, CKEDITOR.POSITION_BEFORE_END);
                                        selection.selectRanges([range0], true);
                                        // 光标在末尾输入，刚好输入到分页处时，没有零宽空格（补充一个零宽字符进去，解决360光标在after伪元素之前与实际差半个字符的问题）
                                        if (range0.endPath().elements) {
                                            var currentNode = range0.endPath().elements.find(function (item) {
                                                return item.$.hasAttribute('data-hm-node');
                                            })
                                            if (currentNode && currentNode.$.getAttribute('data-hm-node') === "newtextbox") {
                                                if (!range0.endContainer.getNext()) {
                                                    if (range0.endContainer.type === CKEDITOR.NODE_TEXT && range0.endOffset === range0.endContainer.getLength()) {
                                                        range0.endContainer.$.appendData('\u200b');
                                                    }
                                                }
                                            }
                                        }
                                    } else if (next && next.type === CKEDITOR.NODE_TEXT) {
                                        // 如果右边是字就选进去
                                        range0 = new CKEDITOR.dom.range(editor.document);
                                        range0.moveToPosition(next, CKEDITOR.POSITION_AFTER_START);
                                        selection.selectRanges([range0], true);
                                        // } else if (prev && prev.getName() === 'br') {
                                        //     // 如果左边是 br, 右边不是字就在右边加字
                                        // } else if (next && next.getName() === 'br') {
                                        //     // 如果右边是 br, 左边不是字就在左边加字
                                    } else if (prev) {
                                        // 如果前面有节点但不是字节点, 在后面添加一个元素并选取其前可选择的元素.
                                        range0 = new CKEDITOR.dom.range(editor.document);
                                        var tmpNext = new CKEDITOR.dom.text('\u200b');
                                        tmpNext.insertAfter(prev);
                                        range0.moveToPosition(tmpNext, CKEDITOR.POSITION_AFTER_START);
                                        next = range0.getPreviousEditableNode();
                                        if (!next) {
                                            next = range0.getNextEditableNode();
                                        }
                                        tmpNext.remove();
                                        range0.moveToPosition(next, CKEDITOR.POSITION_BEFORE_END);
                                        selection.selectRanges([range0], true);
                                    } else if (!range0) {
                                        // 此时一定有 next;
                                        // 如果仍然没有 range, 或者
                                        // 如果后面有节点但不是字节点, 在前面添加一个元素并选取其后可选择的元素.
                                        range0 = new CKEDITOR.dom.range(editor.document);
                                        var tmpPrev = new CKEDITOR.dom.text('\u200b');
                                        tmpPrev.insertBefore(next);
                                        range0.moveToPosition(tmpPrev, CKEDITOR.POSITION_BEFORE_END);
                                        prev = range0.getNextEditableNode();
                                        if (!prev) {
                                            prev = range0.getPreviousEditableNode();
                                        }
                                        tmpPrev.remove();
                                        range0.moveToPosition(prev, CKEDITOR.POSITION_AFTER_START);
                                        selection.selectRanges([range0], true);
                                    }
                                }
                            } catch (e) {
                                console.error('书签恢复错误');
                                console.error(e);
                                debugger
                            }
                        }
                        // 聚合病历打开/新建时需要定位
                        if (editorMerge &&
                            (editor.autoPagebreakCounter <= 2 && (events.indexOf('paperSize') !== -1 || events.indexOf('afterSync') !== -1)) ||
                            '新建' === events[events.length - 1] ||'新建申请编辑' === events[events.length - 1] ||
                            '删除' === events[events.length - 1]) {
                            // 删除书签
                            if (bookmarks) {
                                for (_ = 0; _ < bookmarks.length; _++) {
                                    bookmarks[_].startNode.remove();
                                    if (bookmarks[_].endNode) {
                                        bookmarks[_].endNode.remove();
                                    }
                                }
                            }

                            // 的结果只在首次打开病历时更新.
                            var recordWidgets;
                            // if (editor.hashParameter) {
                            //     recordWidgets = editor.document.find("[data-hm-widgetid='" + JSON.parse(editor.hashParameter['chooseEmrRecordString']).病历ID + "']");
                            // } else {
                            //     recordWidgets = editor.document.find("[data-hm-widgetid=" + "\'" + getQueryString('recordViewId') + "\'" + "]");
                            // }

                            // outline
                            if (editor.autoPagebreakCounter === 1) {
                                for (_ = 0; _ < recordWidgets.count(); _++) {
                                    recordWidgets.getItem(_).setStyle('outline', "2px solid #4297FE");
                                }
                            }

                            // 滚动
                            recordWidgets && recordWidgets.getItem(0) && recordWidgets.getItem(0).scrollIntoView(true);

                            //5秒后 去除选中的样式
                            if (editor.autoPagebreakCounter === 1) {
                                var timeIdx = setTimeout(function () {
                                    for (var i = 0; i < recordWidgets.count(); i++) {
                                        recordWidgets.getItem(i).setStyle('outline', "0px");
                                    }
                                    clearTimeout(timeIdx);
                                }, 5000);
                            }
                        }
                        // 删除书签
                        if (bookmarks) {
                            for (_ = 0; _ < bookmarks.length; _++) {
                                bookmarks[_].startNode.remove();
                                if (bookmarks[_].endNode) {
                                    bookmarks[_].endNode.remove();
                                }
                            }
                        }
                        // endregion

                        if (!editor.HMConfig.realtimePageBreak) {
                            editor.undoManager.restoreImage(editor.undoManager.currentImage, {name: 'afterPaging'});
                            thisCmd.removeAllSplitters(editor);
                        }

                        var cke_widget_wrapper, emrWidget;
                        // 病程聚合: 取消鼠标滑到病历上面时的黑框; 取消病历点击事件.
                        if (editorMerge) {
                            // 取消鼠标滑到病历上面时的黑框
                            cke_widget_wrapper = $body.find('.cke_widget_wrapper');
                            cke_widget_wrapper.unbind('mouseenter');
                            cke_widget_wrapper.unbind('mouseleave');

                            // 取消病历点击事件
                            emrWidget = $body.find('.emrWidget');
                            emrWidget.unbind('click');
                        }

                        // 首次分页与保存之后更新 MD5值
                        if (editor.autoPagebreakCounter <= 2 || thisCmd.currentOperations.saveCompleted) {
                            thisCmd.currentOperations.saveCompleted = false;
                        }

                        // 获取快照用于判断撤销
                        editor.fire('saveSnapshot', {name: 'afterPaging', tagName: 'afterPaging'});

                        // 病程聚合: 鼠标滑到病历上面时添加黑框; 添加病历点击事件.
                        if (editorMerge) {
                            // 鼠标滑到病历上面时添加黑框
                            cke_widget_wrapper.on('mouseenter', '.cke_widget_element', function mouseEnter() {
                                if (this.children.length > 0) {
                                    var id = this.firstChild.getAttribute('data-hm-widgetid');
                                    $body.find('[data-hm-widgetid=' + id + ']').parent().parent().addClass('hover');
                                }
                            });
                            cke_widget_wrapper.on('mouseleave', '.cke_widget_element', function mouseLeave() {
                                if (this.children.length > 0) {
                                    var id = this.firstChild.getAttribute('data-hm-widgetid');
                                    $body.find('[data-hm-widgetid=' + id + ']').parent().parent().removeClass('hover');
                                }
                            });

                            // 添加病历点击事件
                            // emrWidget.on('click', locateDocumentTree);
                        }

                        timeEndLogger('分页后处理', 0);
                        timeLoggerPop('计算页偏移量', 1);
                        timeLoggerPop('combineFormat', 1);
                        var resetPageNum = function(){
                            var pages = $body.find('.'+thisCmd.PAGE_NUM_CLASS);
                            var l = pages.length;
                            if(l == 0){
                                return;
                            }
                            var fp = null;
                            var totalPage = $body.find('.'+thisCmd.LOGIC_PAGE_CLASS).length;
                            for(var i=0;i<l;i++){
                                if(fp == null){
                                    // 页码格式
                                    fp = $(pages[i]);
                                    if((fp.attr('type') || 'page') == 'page'){
                                        return;
                                    }
                                }
                                var $cp = $(pages[i]);
                                var pagenum = $cp.attr('curpage');
                                if(pagenum){
                                    // 目前只支持 （1/N ）格式，其他格式扩展此处拼接
                                    $cp.text(pagenum+'/'+totalPage);
                                }
                            }

                        }
                        resetPageNum();
                        // 分页完成后，判断是否重新加载水印
                        if (editor.HMConfig.watermark && editor.HMConfig.watermark.watermarkType) {
                            window.hmEditor.setDocWatermark(editor.HMConfig.watermark);
                        }
                        // 分页完成后，判断是否存在hm质控，如果存在，提取后放置到文档最顶部
                        if($body.find('.doc-reminder').length > 0 && editor.HMConfig.realtimePageBreak){
                            var hmReminder = $body.find('.doc-reminder');
                            hmReminder.detach();
                            hmReminder.prependTo($body.find('.hm-logic-page').first());
                        } 
                    }


                })();
                console.log('-------------');
                // 重新设置页码


            }, 0);
            // }, thisCmd.AUTO_PAGING_DEBUG ? 1000 : 10);


            // 分页前可以清空一下这些缓存
            editor.plugins.tabletools.tableArchitectureTools.allTableArchitectures = [];
            allTableHeightOffsets = [];
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    // Private
    ///////////////////////////////////////////////////////////////////////////

    // Register a plugin named "pagebreak".
    CKEDITOR.plugins.add('pagebreak', {
        requires: 'fakeobjects',
        // jscs:disable maximumLineLength
        lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        icons: 'pagebreak,pagebreak-rtl', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        onLoad: function () {
            // 页面边框, 默认大小25px, 默认边距10mm
            var pageBorderCssStyles = '@media print{.pageborder{display:none}}' +
                '.pageborder{width:25px;height:25px;}' +
                '.pageborder div{width:25px;height:25px;position:absolute; background:url(' + CKEDITOR.getUrl(this.path + 'images/pageborder.png') + ')round;}' +
                '.pageborder.left-bottom{transform: rotate(90deg);position:absolute;}' +
                '.pageborder.right-bottom{float:right}' +
                '.pageborder.left-top{transform:rotate(180deg);position:absolute;}' +
                '.pageborder.right-top{transform:rotate(-90deg);float:right}';
            CKEDITOR.addCss(pageBorderCssStyles);
            thisCmd.sourcePath = this.path;
        },

        init: function (editor) { 
            if (thisCmd.AUTO_PAGING_DEBUG) {
                console.debug('调试环境...');
            }

            if (editor.blockless)
                return;

            // 分页次数计数
            editor.autoPagebreakCounter = 0;

            // Register the command.
            editor.addCommand('pagebreak', thisCmd);

            // Register the toolbar button.
            editor.ui.addButton && editor.ui.addButton('PageBreak', {
                label: editor.lang.pagebreak.toolbar,
                command: 'pagebreak',
                toolbar: 'insert,70'
            });

            // Webkit based browsers needs help to select the page-break.
            CKEDITOR.env.webkit && editor.on('contentDom', function () {
                editor.document.on('click', function (evt) {
                    var target = evt.data.getTarget();
                    if (target.is('div') && target.hasClass('cke_pagebreak'))
                        editor.getSelection().selectElement(target);
                });
            });

            // 加载触发器
            editor.on('contentDom', function () {
                var editable = editor.editable();
                // 移除 hover 类以避免过多的保存快照
                editable.attachListener(editor, 'saveSnapshot', function removeHoverClass() {
                    var hovered = $(editor.document.$).find('.hover');
                    if (hovered.length > 0) {
                        thisCmd.currentOperations.hoverId = hovered[0].firstChild.getAttribute('data-hm-widgetid');
                    }
                    hovered.removeClass('hover');
                }, null, null, -999);
                // 恢复 hover 类
                editable.attachListener(editor, 'saveSnapshot', function addHoverClass() {
                    if (thisCmd.currentOperations.hoverId) {
                        $(editor.document.$).find('[data-hm-widgetid=' + thisCmd.currentOperations.hoverId + ']').parent().addClass('hover');
                        thisCmd.currentOperations.hoverId = null;
                    }
                }, null, null, 999);

                // 删除病历之前
                editor.on('beforeDeleteEmrRecord', function beforeDeleteEmrRecord1(evt) {
                    thisCmd.removeAllSplitters(evt.editor);
                    thisCmd.currentOperations.deleteEmrRecord = true;
                });
                // 删除病历之后
                editable.attachListener(editor, 'saveSnapshot', function pageBreakAfterDeleteEmrRecord(evt) {
                    if (thisCmd.currentOperations.deleteEmrRecord) {
                        thisCmd.currentOperations.deleteEmrRecord = false;
                        thisCmd.performAutoPaging(editor, evt);
                    }
                }, null, null, 998);

                // 表单模式
                editable.attachListener(editor, 'switchModel', function beforeSwitchModel() {
                    thisCmd.removeAllSplitters(editor);
                }, null, null, -999);
                editable.attachListener(editor, 'switchModel', function beforeSwitchModel(evt) {
                    thisCmd.performAutoPaging(editor, evt);
                }, null, null, 999);

                // 复制表头
                editable.attachListener(editor, 'setCopyTableHeader', function beforeSwitchModel() {
                    thisCmd.removeAllSplitters(editor);
                }, null, null, -999);
                editable.attachListener(editor, 'setCopyTableHeader', function beforeSwitchModel(evt) {
                    thisCmd.performAutoPaging(editor, evt);
                }, null, null, 999);

                editable.attachListener(editor, 'realtimePageBreak', function switchRealtimePageBreak(evt) {
                    if (editor.HMConfig.realtimePageBreak) {
                        thisCmd.performAutoPaging(editor, evt);
                    } else {
                        thisCmd.removeAllSplitters(editor);
                    }
                }, null, null, 10);


            });

            // region 右键菜单

            // region 添加右键
            if (editor.addMenuItem) {

                editor.addMenuGroup("hm");

                // 在此病历后分页 聚合病历
                editor.addMenuItem('splitAfterDoc', {
                    label: "在此病历后分页(聚合病历分页)",
                    command: 'splitAfterDoc',
                    group: "hm"
                });
                editor.addMenuItem('cancelSplitAfterDoc', {
                    label: "取消: 在此病历后分页(聚合病历分页)",
                    command: "cancelSplitAfterDoc",
                    group: "hm"
                });
                // 修改病历起始页码 聚合病历
                editor.addMenuItem('changePageNumberOfDoc', {
                    label: "修改病历起始页码(聚合病历分页)",
                    command: 'changePageNumberOfDoc',
                    group: "hm"
                });
                editor.addMenuItem('cancelPageNumberOfDoc', {
                    label: "取消: 修改病历起始页码(聚合病历分页)",
                    command: "cancelPageNumberOfDoc",
                    group: "hm"
                });

                // 修改页码
                editor.addMenuItem("changePageNumber", {
                    label: "修改页码(自动分页)",
                    command: "changePageNumber",
                    group: "hm"
                });
                editor.addMenuItem("cancelPageNumber", {
                    label: "取消页码(自动分页)",
                    command: "cancelPageNumber",
                    group: "hm"
                });

            }
            // endregion

            // 添加触发器
            if (editor.contextMenu) {
                // 监听右键菜单事件
                editor.contextMenu.addListener(function (element) {
                    if (editor.HMConfig.realtimePageBreak) {
                        var items = {};
                        // 单独分页
                        var parents = $(element.$).parents();
                        for (var i = 0; i < parents.length; i++) {
                            if (parents[i].attributes['data-hm-widgetid'] && parents[i].getAttribute('contenteditable') !== 'false') {
                                // 在此病历后分页: 需要检测默认的在此病历后分页
                                if (!parents[i].getAttribute(thisCmd.SPLIT_AFTER_DOC_TEMP)) {
                                    if (parents[i].getAttribute(thisCmd.SPLIT_AFTER_DOC)) {
                                        items.cancelSplitAfterDoc = CKEDITOR.TRISTATE_OFF;
                                    } else {
                                        items.splitAfterDoc = CKEDITOR.TRISTATE_OFF;
                                    }
                                }
                                // 修改页码
                                if (parents[i].getAttribute(thisCmd.CHANGE_PAGE_NUMBER_OF_DOC)) {
                                    items.cancelPageNumberOfDoc = CKEDITOR.TRISTATE_OFF;
                                } else {
                                    items.changePageNumberOfDoc = CKEDITOR.TRISTATE_OFF;
                                }
                                break;
                            }
                        }
                        // 修改页码
                        var pages = (element.hasClass('page')) ? ([element.$]) : (element.find('.page').$);
                        // 如果是在图片上右键，才在右键菜单中显示图片裁剪功能
                        if (!editor.readOnly && pages.length > 0) {
                            items.changePageNumber = CKEDITOR.TRISTATE_OFF;
                            if (pages[0].getAttribute('page_num')) {
                                items.cancelPageNumber = CKEDITOR.TRISTATE_OFF;
                            }
                        }
                        return items;
                    }
                });
            }

            // region 添加命令
            editor.addCommand('splitAfterDoc', {
                exec: function (editor) {
                    var widget = $(editor.contextTargetElement.$).parents('div[data-hm-widgetid]')[0];
                    if (!widget) {
                        return;
                    }
                    // 寻找最后一个 ID
                    var hmId = widget.getAttribute('data-hm-widgetid');
                    // 全页面查找id, 并添加病历分页标志; 添加分页标志之后需要在分页时分割后续病历.
                    hmId && $(editor.document.$.body).find('div[data-hm-widgetid=' + hmId + ']')
                        .attr(thisCmd.SPLIT_AFTER_DOC, true);
                }
            });
            editor.addCommand('cancelSplitAfterDoc', {
                exec: function (editor) {
                    var widget = $(editor.contextTargetElement.$).parents('div[data-hm-widgetid]')[0];
                    if (!widget) {
                        return;
                    }
                    // 寻找最后一个 ID
                    var hmId = widget.getAttribute('data-hm-widgetid');
                    if (!hmId) {
                        return;
                    }
                    // 全页面查找id, 并删除病历分页标志
                    var docs = $(editor.document.$.body)
                        .find('div[data-hm-widgetid=' + hmId + ']')
                        .removeAttr(thisCmd.SPLIT_AFTER_DOC);
                    // 删除逻辑页中的分页标志是和其他情况公用的, 故删除分页标志之后需要在分页时处理其他受影响的逻辑页.
                    $(docs[docs.length - 1])
                        .parents('div').last()
                        .removeAttr(thisCmd.SPLIT_AFTER_DOC_TEMP);
                }
            });

            editor.addCommand('changePageNumberOfDoc', {
                exec: function (editor) {
                    var parents = $(editor.contextTargetElement.$).parents();
                    // 寻找第一个 ID
                    for (var i = 0; i < parents.length; i++) {
                        var hmId = parents[i].getAttribute('data-hm-widgetid');
                        if (hmId) {
                            var changePageDialog = $("#changePage-dialog");
                            if (changePageDialog.length == 0) {
                                changePageDialog = $('<div id="changePage-dialog">请输入页数：<input id="changePage" type="text"></div>');
                                $("body").append(changePageDialog);
                            }
                            changePageDialog.dialog({
                                resizable: false,
                                title: '修改聚合病历起始页码 (自动分页)',
                                modal: true,
                                buttons: {
                                    "确认": function () {
                                        var num = Number($(this).find('input').val() || '1');
                                        if (!isNaN((num))) {
                                            // 全页面查找id, 并添加页码
                                            var docs = $(parents[parents.length - 1]).find('div[data-hm-widgetid=' + hmId + ']');
                                            docs.attr(thisCmd.CHANGE_PAGE_NUMBER_OF_DOC, num);
                                        }

                                        // 重新分页
                                        thisCmd.organizePageNumbers(editor);
                                        $(this).dialog("close");
                                    },
                                    "取消": function () {
                                        $(this).dialog("close");
                                    }
                                }
                            });
                            break;
                        }
                    }
                }
            });
            editor.addCommand('cancelPageNumberOfDoc', {
                exec: function (editor) {
                    var parents = $(editor.contextTargetElement.$).parents();
                    var hmId = null;
                    // 寻找第一个 ID
                    for (var i = 0; i < parents.length; i++) {
                        hmId = parents[i].getAttribute('data-hm-widgetid');
                        if (hmId) {
                            // 全页面查找id, 并取消页码
                            var docs = $(parents[parents.length - 1]).find('div[data-hm-widgetid=' + hmId + ']');
                            docs.removeAttr(thisCmd.CHANGE_PAGE_NUMBER_OF_DOC);

                            // 重新分页
                            thisCmd.organizePageNumbers(editor);
                            break;
                        }
                    }
                    if (!hmId) {
                        editor.showNotification('未找到病历ID', 'error', editor.config.clipboard_notificationDuration);
                    }
                }
            });


            editor.addCommand('changePageNumber', {
                exec: function (editor) {
                    // 如果是聚合病历, 则提示在聚合病历中修改页码.
                    if (editor.document.getBody().find('.emrWidget-content').count() > 0) {
                        editor.showNotification('请将鼠标放在聚合病历上，再右键修改页码！', 'info', editor.config.clipboard_notificationDuration);
                        return;
                    }

                    var element = editor.contextTargetElement.$;
                    var page;
                    if (hasClass(element, 'page')) {
                        page = element;
                    } else {
                        var _pages = $(element).find('.page');
                        // 已经判断过length大于0了
                        if (_pages.length > 1) {
                            editor.showNotification('页码标志大于1, 请重新选取要修改的页码位置或者修改改模板!', 'error', editor.config.clipboard_notificationDuration);
                            return;
                        }
                        page = _pages[0];
                    }

                    // 弹窗
                    var changePageDialog = $("#changePage-dialog");
                    if (changePageDialog.length == 0) {
                        changePageDialog = $('<div id="changePage-dialog">请输入页数：<input id="changePage" type="text"></div>');
                        $("body").append(changePageDialog);
                    }
                    changePageDialog.dialog({
                        title: '修改页码 (自动分页)',
                        resizable: false,
                        modal: true,
                        buttons: {
                            "确认": function () {
                                var num = Number($(this).find('input').val() || '1');
                                // var num = Number(prompt("请输入页数:", "1"));
                                if (!isNaN((num))) {
                                    page.innerText = num;
                                    page.setAttribute('page_num', num);
                                }
                            },
                            "取消": function () {
                                $(this).dialog("close");
                            }
                        }
                    });
                }
            });
            editor.addCommand('cancelPageNumber', {
                exec: function (editor) {
                    var element = editor.contextTargetElement.$;
                    var page;
                    if (hasClass(element, 'page')) {
                        page = element;
                    } else {
                        var _pages = $(element).find('.page');
                        // 已经判断过length大于0了
                        if (_pages.length > 1) {
                            editor.showNotification('页码标志大于1, 请重新选取要修改的页码位置或者修改改模板!', 'error', editor.config.clipboard_notificationDuration);
                            return;
                        }
                        page = _pages[0];
                    }
                    page.removeAttribute('page_num');
                }
            });
            // endregion
            // endregion
        },

        // afterInit: function (editor) {
        //     // Register a filter to displaying placeholders after mode change.
        //     var dataProcessor = editor.dataProcessor,
        //         dataFilter = dataProcessor && dataProcessor.dataFilter,
        //         htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        //         styleRegex = /page-break-after\s*:\s*always/i,
        //         childStyleRegex = /display\s*:\s*none/i;
        //
        //     function upcastPageBreak(element) {
        //         CKEDITOR.tools.extend(element.attributes, attributesSet(editor.lang.pagebreak.alt), true);
        //
        //         element.children.length = 0;
        //     }
        //
        //     if (htmlFilter) {
        //         htmlFilter.addRules({
        //             attributes: {
        //                 'class': function (value, element) {
        //                     var className = value.replace('cke_pagebreak', '');
        //                     if (className != value) {
        //                         var span = CKEDITOR.htmlParser.fragment.fromHtml('<span style="display: none;">&nbsp;</span>').children[0];
        //                         element.children.length = 0;
        //                         element.add(span);
        //                         var attrs = element.attributes;
        //                         delete attrs['aria-label'];
        //                         delete attrs.contenteditable;
        //                         delete attrs.title;
        //                     }
        //                     return className;
        //                 }
        //             }
        //         }, {applyToAll: true, priority: 5});
        //     }
        //
        //     if (dataFilter) {
        //         dataFilter.addRules({
        //             elements: {
        //                 div: function (element) {
        //                     // The "internal form" of a pagebreak is pasted from clipboard.
        //                     // ACF may have distorted the HTML because "internal form" is
        //                     // different than "data form". Make sure that element remains valid
        //                     // by re-upcasting it (http://dev.ckeditor.com/ticket/11133).
        //                     if (element.attributes['data-cke-pagebreak'])
        //                         upcastPageBreak(element);
        //
        //                         // Check for "data form" of the pagebreak. If both element and
        //                     // descendants match, convert them to internal form.
        //                     else if (styleRegex.test(element.attributes.style)) {
        //                         var child = element.children[0];
        //
        //                         if (child && child.name == 'span' && childStyleRegex.test(child.attributes.style))
        //                             upcastPageBreak(element);
        //                     }
        //                 }
        //             }
        //         });
        //     }
        // }
    });

    ///////////////////////////////////////////////////////////////////////////


    // region args

    // 半角字母/数字/标点
    var halfWidthChar = /[\x21-\x7E]/g;
    // 空格
    var rclass = /[\t\r\n]/g;

    // 强制停止正在进行中的分页(由于bug等原因)
    var forceStopPaging = false;

    // 存储表格的高度误差, 因为打印时表格每一行都有误差
    // 目前只会存储当前页的表格
    // 存在 bug 导致特定条件下前一页的字被多移动了一些, 故暂时禁用之.
    var allTableHeightOffsets = [];

    // 因为保存前后会丢失窗口滚动值, 故需要保存窗口滚动值.
    var lastScrollTop = 0;
    var lastScrollLeft = 0;
    // endregion
    ///////////////////////////////////////////////////////////////////////////

    // region 私有函数

    // region 公共函数1

    // 获取随机数, 测试环境采用递增代替随机数
    var rannodeStrCount = 0; // 随机计数
    var thisEditorTag = Math.random().toString(16).substr(2, 6); // 每次打开编辑器时的标志

    function rannodeStr() {
        if (true || thisCmd.AUTO_PAGING_DEBUG) {
            rannodeStrCount++;
            return (rannodeStrCount).toString(10) + '-' + thisEditorTag;
        } else {
            return Math.rannode().toString(16).substr(2, 12);
        }
    }

    // 查看某一个 "元素节点" 是否含有某个 class, 非元素节点会报错
    function hasClass(node, clazz) {
        return (' ' + node.className + ' ').replace(zeroWidthChar, '').replace(rclass, ' ').indexOf(' ' + clazz + ' ') !== -1;
        // return node.nodeType === 1 && (" " + node.className + " ").replace(rclass, " ").indexOf(" " + clazz + " ") !== -1;
    }

    // 查看某一个 "元素节点" 是否含有某个 class 的前缀, 非元素节点会报错
    function hasClassPrefix(node, prefix) {
        return (' ' + node.className).replace(zeroWidthChar, '').replace(rclass, ' ').indexOf(' ' + prefix) !== -1;
    }

    // 向元素节点中添加一个 class, 非元素节点会报错
    function addOneClass(node, clazz) {
        if (node.className.length === 0) {
            node.className = clazz;
        } else if (!hasClass(node, clazz)) {
            node.className += ' ' + clazz;
        }
    }

    // 移除某个类
    function removeClass(node, toRemove) {
        node.className = (' ' + node.className).replace(' ' + toRemove, '').trimLeft();
    }

    // 在指定元素节点的位置插入子元素
    function insertChildAt(parent, child, nodeIndex) {
        if (parent.children.length <= nodeIndex) {
            parent.appendChild(child);
        } else {
            parent.insertBefore(child, parent.children[nodeIndex]);
        }
    }

    // endregion

    // region 连接符

    // 插入分割前后缀; 每个元素的前后缀个数不大于1
    // 暂时仅用于 getFirstChar 与 getLastChar
    // isNewPrev: 判断 prev 和 next 中哪个是新创建的
    // 返回: 前后缀中的公共后缀
    function addConnectors(prev, next, isNewPrev) {
        // 查找 prev 和 next 里面是否包含前后缀; prev 和 next 的前后缀是一样的, 故只用获取 prev 中的就行
        var prevCon = getConnectorName(prev, thisCmd.CONNECTOR_PREFIX);
        var suffCon = getConnectorName(prev, thisCmd.CONNECTOR_SUFFIX);
        var suffixInConnectors = null;

        // 如果 prev 是新加入的元素
        if (isNewPrev === true) {
            // 需要将 prev 的 prefix 删除
            if (prevCon) {
                removeClass(prev, prevCon);
            }

            // 如果有 suffix 则表示往回复制.
            if (suffCon) {
                var suffixInPrev = getConnectorName(prev, thisCmd.CONNECTOR_SUFFIX);
                removeClass(prev, suffixInPrev);
                suffixInConnectors = suffCon.substr(thisCmd.CONNECTOR_SUFFIX.length);
                addOneClass(prev, thisCmd.CONNECTOR_PREFIX + suffixInConnectors);
            }
            // 如果没有 suffix 表示上一页没有对应内容, 需要加上新的 prefix
            else {
                suffixInConnectors = rannodeStr();
                addOneClass(prev, thisCmd.CONNECTOR_PREFIX + suffixInConnectors);
                addOneClass(next, thisCmd.CONNECTOR_SUFFIX + suffixInConnectors);
            }
        }
        // 如果 next 是新加入的元素
        else if (isNewPrev === false) {
            // 需要将 next 的 suffix 删除
            if (suffCon) {
                removeClass(next, suffCon);
            }

            // 如果有 prefix 则表示往回复制, 暂时不用管. (后续也可以换prefix)
            if (prevCon) {
                var prefixInNext = getConnectorName(next, thisCmd.CONNECTOR_PREFIX);
                removeClass(next, prefixInNext);
                suffixInConnectors = prevCon.substr(thisCmd.CONNECTOR_PREFIX.length);
                addOneClass(next, thisCmd.CONNECTOR_SUFFIX + suffixInConnectors);
            }
            // 如果没有 prefix 表示后一页没有对应内容, 需要加上新的 suffix
            else {
                suffixInConnectors = rannodeStr();
                addOneClass(prev, thisCmd.CONNECTOR_PREFIX + suffixInConnectors);
                addOneClass(next, thisCmd.CONNECTOR_SUFFIX + suffixInConnectors);
            }
        } else {
            throw new Error('isNewPrev does not exist.');
        }
        return suffixInConnectors;
    }

    function addConnectorsWhenSplitting(prev, next) {
        // 因为 prev 和 next 是复制体, 故需去除 prev 中的前缀 和 next 中的后缀
        var prevCon = getConnectorName(prev, thisCmd.CONNECTOR_PREFIX);
        removeClass(prev, prevCon);
        var nextCon = getConnectorName(next, thisCmd.CONNECTOR_SUFFIX);
        removeClass(next, nextCon);

        var suffixInConnectors = rannodeStr();
        addOneClass(prev, thisCmd.CONNECTOR_PREFIX + suffixInConnectors);
        addOneClass(next, thisCmd.CONNECTOR_SUFFIX + suffixInConnectors);
    }

    // // 为最外层元素添加连接符号并合并 (删除 prev)
    // function combinePages(prev, next) {
    //     // 这里优先保存前一个元素的后缀和后一个元素的前缀, 剩下的前后缀挨个保存
    //     var logicPageClass = thisCmd.LOGIC_PAGE_CLASS;
    //     var conn = getConnectorName(prev, thisCmd.CONNECTOR_SUFFIX);
    //     if (conn) {
    //         logicPageClass += ' ' + conn;
    //     } else {
    //         conn = getConnectorName(next, thisCmd.CONNECTOR_SUFFIX);
    //         if (conn) {
    //             logicPageClass += ' ' + conn;
    //         }
    //     }
    //     conn = getConnectorName(next, thisCmd.CONNECTOR_PREFIX);
    //     if (conn) {
    //         logicPageClass += ' ' + conn;
    //     } else {
    //         conn = getConnectorName(prev, thisCmd.CONNECTOR_PREFIX);
    //         if (conn) {
    //             logicPageClass += ' ' + conn;
    //         }
    //     }
    //     var lastChildOfPrev = prev.lastChild;
    //     while (next.childNodes.length > 0) {
    //         prev.append(next.firstChild);
    //     }
    //     next.className = logicPageClass;
    //     combineFormat(editor, lastChildOfPrev, false);
    //     prev.remove();
    // }

    // 寻找共同的连接符
    function getCommonConnector(clazzPrefix, clazzSuffix) {
        var classNamePref = clazzPrefix.split(' ');
        for (var i = 0; i < classNamePref.length; i++) {
            if (classNamePref[i].indexOf(thisCmd.CONNECTOR_CLASS_NAME) !== -1) {
                var index2 = clazzSuffix.indexOf(classNamePref[i].replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX));
                if (index2 !== -1) {
                    return classNamePref[i];
                }
            }
        }
        return null;
    }

    // // 处理分页前缀丢失的情况
    // function addMissingPrefix(prev, next) {
    //     try {
    //         // 获取名字
    //         var prevClazz = getConnectorName(prev, thisCmd.CONNECTOR_PREFIX);
    //         var nextClazz = getConnectorName(next, thisCmd.CONNECTOR_SUFFIX);
    //         if (!nextClazz) return;
    //         var toReplace = nextClazz.replace(thisCmd.CONNECTOR_SUFFIX, thisCmd.CONNECTOR_PREFIX);
    //         var isTheSameClazz = prevClazz === toReplace;
    //         if (prevClazz) {
    //             // 如果前后缀相同就跳过
    //             if (!isTheSameClazz) {
    //                 prev.className = prev.className.replace(prevClazz, toReplace);
    //             }
    //         } else {
    //             addOneClass(prev, toReplace);
    //         }
    //     } catch (e) {
    //         console.error(e);
    //         forceStopPaging = true;
    //         setPageBreakByHandLabel(false);
    //         debugger
    //         throw(e);
    //     }
    // }


    // 检查两个元素类型是否相同. 如果相同则返回 a 的 class 和 是否互补的标志
    function getAttributesEqualOrComplemented(a, b) {
        var returns = null;
        if (a && b && a.tagName === b.tagName && a.className && b.className) {
            var classA = a.className.split(' ');
            for (var i = 0; i < classA.length; i++) {
                if (classA[i].indexOf(thisCmd.CONNECTOR_PREFIX) !== -1 || classA[i].indexOf(thisCmd.CONNECTOR_SUFFIX) !== -1) {
                    if (hasClass(b, classA[i])) {
                        returns = {prevClass: classA[i], classComplemented: false};
                        break;
                    } else if (hasClass(b, classA[i].replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX))) {
                        returns = {prevClass: classA[i], classComplemented: true};
                        break;
                    }
                }
            }
        }
        // // 这个判定太严格了, 页面可能实时刷新自定义其他class
        // else if (!a.attributes || !b.attributes ||
        //     a.attributes.length !== b.attributes.length) {
        //     returns = false;
        // }
        // else {
        // for (var i = 0; i < a.attributes.length; i++) {
        //     if (a.attributes[i].name === 'class' && b.attributes[i].name === 'class') {
        //
        //         if (a.attributes[i].value.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX) !==
        //             b.attributes[i].value.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX)) {
        //             returns = false;
        //             break;
        //         }
        //     } else if (a.attributes[i].name !== b.attributes[i].name ||
        //         a.attributes[i].value !== b.attributes[i].value) {
        //         returns = false;
        //         break;
        //     }
        // }
        // }
        return returns;
    }

    // 检查两个元素类型是否互补 (a先b后)
    function getAttributesComplement(prev, next) {
        var returns = null;
        if (!prev || !next || prev.tagName !== next.tagName || !prev.className || !next.className) {
            returns = null;
        } else {
            var classA = prev.className.split(' ');
            for (var i = 0; i < classA.length; i++) {
                if (classA[i].indexOf(thisCmd.CONNECTOR_PREFIX) !== -1 &&
                    hasClass(next, classA[i].replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX))) {
                    returns = classA[i];
                    break;
                }
            }
        }
        return returns;
    }

    /**
     * 合并相邻node的格式, 如果前后缀完全一样 (或者互补) 则合并
     * node建议比较短
     * todo 此函数的递归方式仅适用于单'字'合并的情况
     * todo 效率较慢, 需要分前后的情况
     * @param editor
     * @param {html.dom} node 需要合并的节点
     * @param {boolean} scanUp 是否向上扫描格式合并情况
     * @param [recursive] 是否为递归 (计时用)
     */
    var combineFormat = thisCmd.combineFormat = function combineFormat(editor, node, scanUp, recursive) {
        if (!node) return;
        recursive || timeLogger('combineFormat', 0);
        var prev = scanUp ? node.previousSibling : node;
        var next = scanUp ? node : node.nextSibling;
        if (!prev || !next) {
            return;
        }
        // 该元素字符节点, 直接合并
        if (node.nodeType === CKEDITOR.NODE_TEXT) {
            if (prev.nodeType !== CKEDITOR.NODE_TEXT || next.nodeType !== CKEDITOR.NODE_TEXT) {
                return;
            }
            prev.data += next.data;
            next.remove();
            // 一开始调用此函数时, node 不会是字符节点, 故 recursive === true.
            // recursive || timeEndLogger('combineFormat', 1);
            return;
        }

        // 排除掉不规范的 html 在 colgroup, tbody, tr 和 td 附近加制表符/回车符等东西的情况
        if (node.nodeName === 'COLGROUP' || node.nodeName === 'TBODY' || node.nodeName === 'TR' || node.nodeName === 'TD') {
            if (!prev || !next) return;
            if (prev.nodeType !== CKEDITOR.NODE_ELEMENT) {
                prev = next.previousElementSibling;
            }
            if (next.nodeType !== CKEDITOR.NODE_ELEMENT) {
                next = prev.nextElementSibling;
            }
        }

        // 该元素不是字符节点, 分情况循环判断注释节点/字符节点/书签节点
        while (true) {
            if (!prev || !next) {
                return;
            }
            // 零宽字符, 挪开; 不能挪到最后一个 br 的后面!
            if (prev.nodeType === CKEDITOR.NODE_TEXT) {
                if (prev.data.replace(zeroWidthChar, '').length || !prev.previousSibling) {
                    return;
                }
                if (prev.previousSibling.nodeType === CKEDITOR.NODE_TEXT) {
                    // 如果左边还是字符, 则丢弃此零宽字符
                    prev.remove();
                    prev = next.previousSibling;
                } else {
                    // 否则挪到左边元素的左边
                    prev.parentNode.insertBefore(prev, prev.previousSibling);
                    prev = next.previousSibling;
                }
                continue;
            }
            if (next.nodeType === CKEDITOR.NODE_TEXT) {
                if (next.data.replace(zeroWidthChar, '').length || !next.nextSibling) {
                    return;
                }
                if (next.nextSibling.nodeType === CKEDITOR.NODE_TEXT || next.nextSibling.nodeName === 'BR') {
                    // 如果右边还是字符, 则丢弃此零宽字符; br 除外
                    next.remove();
                    next = prev.nextSibling;
                } else {
                    // 否则挪到右边元素的右边
                    next.parentNode.insertBefore(next.nextSibling, next);
                    prev = next.nextSibling;
                }
                continue;
            }

            // 注释节点, 删除之
            if (prev.nodeType === CKEDITOR.NODE_COMMENT) {
                prev.remove();
                prev = next.previousSibling;
                continue;
            }
            if (next.nodeType === CKEDITOR.NODE_COMMENT) {
                next.remove();
                next = prev.previousSibling;
                continue;
            }

            // 遇到书签的话, 把书签塞到 next 的第一个元素中, 下级 dom 则递归操作.
            if (next.getAttribute('data-cke-bookmark') === '1') {
                var next1 = next.nextSibling;
                if (!next1 || next1.nodeType !== CKEDITOR.NODE_ELEMENT || next1.nodeName === 'BR') {
                    return;
                }
                next1.insertBefore(next, next1.firstChild);
                next = next1;
                node = scanUp ? next : prev;
                continue;
            }
            if (prev.getAttribute('data-cke-bookmark') === '1') {
                if (next.nodeType !== CKEDITOR.NODE_ELEMENT || next.nodeName === 'BR') {
                    return;
                }
                next.insertBefore(prev, next.firstChild);
                prev = next.previousSibling;
                if (!prev || prev.nodeType !== CKEDITOR.NODE_ELEMENT) {
                    return;
                }
                continue;
            }

            // 其他情况, 结束循环
            break;
        }
        // 非字符节点和注释节点
        if (prev.nodeType !== CKEDITOR.NODE_ELEMENT || next.nodeType !== CKEDITOR.NODE_ELEMENT) {
            return;
        }

        // region 合并单元格
        var commons;
        // 如果是tr而且没有分隔符, 先识别 td 是否有 rowspan. 如果有就合并然后返回
        // 注意: 如果有分隔符的话代表此格子跟另外一个格子能够合并, 就不用合并含有 rowspan 的格子
        // todo 可能有bug
        // 无论 node 的位置前后, 如果前后两行中存在 rowspan>1 的格子, 后面第一行的元素一定有此格子.
        // 如果由于 bug 导致前面的元素没有对应格子, 则添加到第一行.
        // 表格只能从下往上合并.
        if (node.nodeName === 'TR') {
            // 表格只能从下往上合并.
            if (!scanUp) {
                node = next;
            }
            var commonRowClass = getAttributesEqualOrComplemented(prev, next);

            var tbody = node.parentNode;
            var table = tbody;
            while (table.tagName !== 'TABLE') {
                table = table.parentElement;
            }
            // 为了保险起见, 先删除已存的表格结构
            editor.plugins.tabletools.tableArchitectureTools.clearTableArchitecture(table);
            var tableArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(table);
            // var prevRowArchitecture = tableArchitecture[prev.rowIndex];
            var nextRowArchitecture = tableArchitecture[next.rowIndex];

            var lastMatchedCell = null;
            // 合并表格td
            // 如果有连接符: 每执行一次循环, next 会减少一个 td
            // 如果没有连接符: 只合并合并有 rowspan 的
            // trueCellIndex 指代的是(有连接符时) nextRow 中的 index.
            for (var prevCellIndex = 0, nextCellIndex = 0, trueCellIndex = 0;
                 next.cells.length > 0;
                 prevCellIndex++, nextCellIndex++, trueCellIndex++) {
                // 跳过重复格子 (colspan)
                if (lastMatchedCell === nextRowArchitecture[trueCellIndex]) {
                    // 如果前后两行是同一行, 则前一行需要--; 如果不是, 前一行-- 并无影响.
                    prevCellIndex--;
                    nextCellIndex--;
                    continue;
                }
                var prevCell;
                // 当不全是合并单元格时, nextCellIndex 不全为0.
                var nextCell = next.cells[nextCellIndex];
                if (!nextCell) break;

                // 如果有 rowspan
                if (hasClass(nextCell, thisCmd.HAS_ROWSPAN)) {
                    // 首先将 nextCell拿出去以免干扰查找 prevCell
                    nextCell.remove();
                    // 找到连接符之后查找 tbody 中其他的连接符, 不一定一样
                    var index = nextCell.className.indexOf(thisCmd.CONNECTOR_CLASS_NAME);
                    var connector = '';
                    if (index !== -1) {
                        connector = nextCell.className.substr(index) + ' ';
                        connector = connector.substr(0, connector.indexOf(' '));
                        prevCell = tbody.getElementsByClassName(connector);
                    }
                    // 如果没找到就换一个前缀找
                    if (!prevCell || prevCell.length === 0) {
                        if (connector.indexOf(thisCmd.CONNECTOR_PREFIX) !== -1) {
                            prevCell = tbody.getElementsByClassName(connector.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX));
                        } else {
                            prevCell = tbody.getElementsByClassName(connector.replace(thisCmd.CONNECTOR_SUFFIX, thisCmd.CONNECTOR_PREFIX));
                        }
                    }
                    // 如果找到了对应元素就合并
                    if (prevCell.length > 0) {
                        prevCell = prevCell[0];
                        insertChildAt(prevCell.parentNode, nextCell, 1 + prevCell.cellIndex);
                        // 如果两人的父元素的 connector 相同, 则需要将 rowspan-1
                        if (getCommonConnector(prev.className, next.className)) {
                            prevCell.rowSpan += nextCell.rowSpan - 1;
                        }
                        // 否则不用-1 (有时候把整行复制过去了, 没有 connector 也就不用-1)
                        else {
                            prevCell.rowSpan += nextCell.rowSpan;
                        }
                        combineFormat(editor, nextCell, true, true);
                        nextCellIndex--;
                        // 如果前一个元素不在前一行, 则需要操作index
                        if (prevCell.parentNode !== prev) {
                            prevCellIndex--;
                        }
                        continue;
                    }
                    // 如果没找到对应元素就放回去
                    else {
                        insertChildAt(next, nextCell, nextCellIndex);
                    }
                }
                if (commonRowClass) {
                    var next0 = next.cells[0];
                    // 如果前一行的长度过短就不用识别 rowspan 了, 直接 append
                    if (prev.cells.length <= prevCellIndex) {
                        prev.appendChild(next0);
                    } else {
                        var prevCell = prev.cells[prevCellIndex];
                        var lastChildOfPrev;

                        // 识别 rowspan: prev 可能没有 rowspan, 但是 next 肯定有
                        if (hasClass(next0, thisCmd.HAS_ROWSPAN)) {
                            debugger
                            // 如果上一行对应位置有 rowspan 且 前后缀相同, 直接合并, 不用重新设置rowspan
                            if (hasClass(prevCell, thisCmd.HAS_ROWSPAN) &&
                                getAttributesEqualOrComplemented(prev, next)) {

                                // 如果前后缀相同则不用管, 如果互补则需要消除前后缀
                                commons = getAttributesEqualOrComplemented(prevCell, next0);
                                if (commons && commons.classComplemented) {
                                    removeClass(prevCell, commons.prevClass);
                                }
                                lastChildOfPrev = prevCell.lastChild;
                                mergeChilNodesBackward(prevCell, next0);
                                if (lastChildOfPrev && lastChildOfPrev.nextSibling) {
                                    combineFormat(editor, lastChildOfPrev.nextSibling, true, true);
                                }
                            }
                            // 否则在整个表格中查找 (不一定是对应的列数, 但一定会查到两个), 需要重新设置 rowspan
                            else {
                                var suffix = next.className.substr(thisCmd.CONNECTOR_SUFFIX.length + next.className.indexOf(thisCmd.CONNECTOR_SUFFIX)) + ' ';
                                suffix = suffix.substr(0, suffix.indexOf(' '));
                                var prevCells = node.parentElement.getElementsByClassName(suffix);
                                if (prevCells.length > 1) {
                                    // 找到最后一个不是 node 的元素
                                    prevCell = prevCells[prevCells.length - 2];
                                    // 合并单元格
                                    prevCell.rowSpan += next0.rowSpan - 1;

                                    // 如果前后缀相同则不用管, 如果互补则需要消除前后缀
                                    commons = getAttributesEqualOrComplemented(prevCell, next0);
                                    if (commons && commons.classComplemented) {
                                        removeClass(prevCell, commons.prevClass);
                                        // var nextClass = commons.prevClass.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX);
                                        // removeClass( next0, nextClass);
                                    }
                                    lastChildOfPrev = prevCell.lastChild;
                                    mergeChilNodesBackward(prevCell, next0);
                                    if (lastChildOfPrev && lastChildOfPrev.nextSibling) {
                                        combineFormat(editor, lastChildOfPrev.nextSibling, true, true);
                                    }
                                } else {
                                    console.log('有分割的表格但是未找到对应匹配项');
                                    debugger;
                                }
                            }
                        } else {
                            nextCellIndex--;
                        }
                        // 如果前后缀相同则不用管, 如果互补则需要消除前后缀
                        commons = getAttributesEqualOrComplemented(prevCell, next0);
                        if (commons && commons.classComplemented) {
                            removeClass(prevCell, commons.prevClass);
                        }
                        lastChildOfPrev = prevCell.lastChild;
                        // 因为这个函数会删除后一个节点, 所以是 next0
                        mergeChilNodesBackward(prevCell, next0);
                        if (lastChildOfPrev && lastChildOfPrev.nextSibling) {
                            combineFormat(editor, lastChildOfPrev.nextSibling, true, true);
                        }
                    }
                }
            }


            // if (!hasClassPrefix(node, thisCmd.CONNECTOR_CLASS_NAME)) {
            if (commonRowClass) {
                mergeClassBackward(prev, next);
                next.remove();
            }
            recursive || timeEndLogger('combineFormat', 1);
            return;
        }
        // endregion

        try {
            commons = getAttributesEqualOrComplemented(prev, next);
            if (commons) {
                // 合并表格时, 先删除后一个表格中的 colgroup
                if (next.tagName === 'TABLE') {
                    // 查找下一级子元素中的 colgroup
                    var prevColGroup = $(prev).find('>colgroup');
                    var nextColGroup = $(next).find('>colgroup');
                    // prev 有 colgroup, 就把 next 的删除
                    if (prevColGroup.length) {
                        nextColGroup.remove();
                    }
                    // prev 没有 colgroup 就把 next 的相同表的的项挪到 prev 中
                    else if (nextColGroup.length > 0) {
                        prev.insertBefore(nextColGroup[0], prev.firstChild);
                    }
                }

                // 补上被删除的br
                if (hasClass(prev, thisCmd.HAS_BR)) {
                    removeClass(prev, thisCmd.HAS_BR);
                    prev.appendChild(document.createElement('BR'));
                }

                // 查找前一个元素
                if (scanUp && node.previousElementSibling) {
                    // 判断是否为合并表头
                    // todo checkIsTheSameTable 的算法暂时是 getAttributesComplement 所以暂时没用该函数
                    if (next.tagName === 'TABLE' && checkCopyTableHeader(next)) {
                        next.tHead.remove();
                    }
                    // 如果前后缀相同则不用管, 如果互补则需要消除前后缀
                    if (commons.classComplemented) {
                        removeClass(prev, commons.prevClass);
                        // var nextClass = commons.prevClass.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX);
                        // removeClass( next, nextClass);
                    }
                    // 合并前提取最后一个子元素以方便合并子元素
                    var lastChildOfPrev = prev.lastChild;
                    // 执行合并, 如果不是表格行则直接合并
                    if (next.tagName !== 'TR') {
                        // 合并表格之后需要重新计算表格的高度偏差, 故合并前先去除
                        if (next.tagName === 'TABLE') {
                            clearTableHeightOffset(prev);
                            clearTableHeightOffset(next);
                        }
                        mergeChilNodesBackward(prev, next);
                        if (lastChildOfPrev && lastChildOfPrev.nextSibling) {
                            combineFormat(editor, lastChildOfPrev.nextSibling, true, true);
                        }
                    }
                }
                // 查找后一个元素
                if (!scanUp && node.nextElementSibling) {
                    // 判断是否为合并表头
                    // todo checkIsTheSameTable 的算法暂时是 getAttributesComplement 所以暂时没用该函数
                    if (next.tagName === 'TABLE') {
                        // 合并表格之后需要重新计算表格的高度偏差, 故合并前先去除
                        clearTableHeightOffset(prev);
                        clearTableHeightOffset(next);

                        if (checkCopyTableHeader(next)) {
                            next.tHead.remove();
                        }
                    }
                    // 如果前后缀相同则不用管, 如果互补则需要消除前后缀
                    if (commons.classComplemented) {
                        // removeClass( prev, commons.prevClass);
                        var nextClass = commons.prevClass.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX);
                        removeClass(next, nextClass);
                    }

                    // 合并前提取第一个子元素以方便合并子元素
                    var firstChildOfNext = next.firstChild;
                    // 执行合并
                    mergeChilNodesForward(prev, next);
                    if (firstChildOfNext && firstChildOfNext.previousSibling) {
                        combineFormat(editor, firstChildOfNext.previousSibling, false, true);
                    }
                }
            }
            recursive || timeEndLogger('combineFormat', 1);
        } catch (e) {
            console.error(e);
            forceStopPaging = true;
            setPageBreakByHandLabel(false);
            debugger
            throw(e);
        }
    }


    // 聚合两个节点的内容(向前合并、删除prev)
    function mergeChilNodesForward(prev, next) {
        while (prev.childNodes.length > 0) {
            if (next.firstChild &&
                next.firstChild.nodeType === CKEDITOR.NODE_TEXT &&
                prev.lastChild.nodeType === CKEDITOR.NODE_TEXT) {
                next.firstChild.data = prev.lastChild.data + next.firstChild.data;
                prev.lastChild.remove();
            } else {
                next.insertBefore(prev.lastChild, next.firstChild);
            }
        }
        mergeClassForward(prev, next);
        prev.remove();
    }

    // 聚合两个节点的内容(向后合并、删除next)
    function mergeChilNodesBackward(prev, next) {
        while (next.childNodes.length > 0) {
            if (prev.lastChild &&
                prev.lastChild.nodeType === CKEDITOR.NODE_TEXT &&
                next.firstChild.nodeType === CKEDITOR.NODE_TEXT) {
                prev.lastChild.data += next.firstChild.data;
                next.firstChild.remove();
            } else {
                prev.appendChild(next.firstChild);
            }
        }
        mergeClassBackward(prev, next);
        next.remove();
    }

    // 合并前后缀(向前合并)
    function mergeClassForward(prev, next) {
        if (!prev || !next) {
            return;
        }
        // 去除 next 中原有的后缀
        var suffixIndex = next.className.indexOf(thisCmd.CONNECTOR_SUFFIX);
        var suffix;
        if (suffixIndex !== -1) {
            suffix = next.className.substr(suffixIndex) + ' ';
            suffix = suffix.substr(0, suffix.indexOf(' '));
            removeClass(next, suffix);
        }

        // 把 prev 中的后缀复制到 next 中
        suffixIndex = prev.className.indexOf(thisCmd.CONNECTOR_SUFFIX);
        if (suffixIndex !== -1) {
            suffix = prev.className.substr(suffixIndex) + ' ';
            suffix = suffix.substr(0, suffix.indexOf(' '));
            // 把此后缀复制到 next 中
            addOneClass(next, suffix);
        }
    }

    // 合并前后缀(向后合并)
    function mergeClassBackward(prev, next) {
        if (!prev || !next) {
            return;
        }
        // 去除 prev 中原有的前缀
        var prefixIndex = prev.className.indexOf(thisCmd.CONNECTOR_PREFIX);
        var prefix;
        if (prefixIndex !== -1) {
            prefix = prev.className.substr(prefixIndex) + ' ';
            prefix = prefix.substr(0, prefix.indexOf(' '));
            removeClass(prev, prefix);
        }

        // 把 next 中的前缀复制到 prev 中
        prefixIndex = next.className.indexOf(thisCmd.CONNECTOR_PREFIX);
        if (prefixIndex !== -1) {
            prefix = next.className.substr(prefixIndex) + ' ';
            prefix = prefix.substr(0, prefix.indexOf(' '));
            // 把此前缀复制到 prev 中
            addOneClass(prev, prefix);
        }
    }

    // 把元素挪到顶层, 并在挪动过程中向相邻元素添加分页连接符. 默认顶层是 body
    function moveToTop(editor, node) {
        if (!node || !node.parentNode || node.parentNode.tagName === 'BODY') {
            return true;
        }
        // 当挪到页面内容这一层时添, 加一个页面并返回 true
        if (hasClass(node.parentNode, thisCmd.PAGE_CONTENT_CLASS)) {
            var thisPage = node.parentNode.parentNode.parentNode;
            var nextPage = thisCmd.genLogicPage(editor, thisCmd.pageHeaderGroup, thisCmd.pageFooterGroup);
            insertAfter(thisPage.parentNode, nextPage, thisPage);
            var nextPageContent = $(nextPage).find('>>div.' + thisCmd.PAGE_CONTENT_CLASS)[0];
            while (node.nextSibling) {
                nextPageContent.appendChild(node.nextSibling);
            }
            return true;
        }
        var parentOfParent = node.parentNode.parentNode;
        if (!parentOfParent) {
            return true;
        }
        var parentClone = node.parentNode.cloneNode();
        // 处理 td
        if (parentClone.tagName === 'TD') {
            // 取得这个表格
            var thisTable = parentOfParent;
            while (thisTable && thisTable.nodeName !== 'TABLE') {
                thisTable = thisTable.parentNode;
            }
            // 获取表格结构, 生成 "spans 阵列"
            editor.plugins.tabletools.tableArchitectureTools.clearTableArchitecture(thisTable);
            var tableArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(thisTable);
            var rowArchitecture = tableArchitecture[parentOfParent.rowIndex];

            // 复制表格行
            var trClone = parentOfParent.cloneNode();
            // 如果该行没有被分割过, 就返回一个空行, 记得看是否有rowspan
            var lastMatchedCell = null;
            for (var cellIndex = 0, trueCellIndex = 0;
                 trueCellIndex < rowArchitecture.length;
                 cellIndex++, trueCellIndex++) {
                // colspan 的情况. 如果这个格子和上一个格子其实是同一个格子就继续循环
                if (lastMatchedCell && rowArchitecture[trueCellIndex] === lastMatchedCell) {
                    cellIndex--;
                    continue;
                }
                lastMatchedCell = rowArchitecture[trueCellIndex];
                var nodeClone;

                // 如果上一页有 rowspan 则要复制含有 rowspan 的格子
                //todo 检测运行时间; 可能把前后缀也复制进来了从而导致bug
                if (lastMatchedCell && lastMatchedCell.rowSpan !== 1) {
                    if (lastMatchedCell.rowSpan > 1) {
                        cellIndex--;
                        if (!hasClass(lastMatchedCell, thisCmd.HAS_ROWSPAN)) {
                            addOneClass(lastMatchedCell, thisCmd.HAS_ROWSPAN);
                        }
                    }
                    nodeClone = lastMatchedCell.cloneNode();
                    nodeClone.rowSpan = lastMatchedCell.rowSpan + lastMatchedCell.parentNode.rowIndex - parentOfParent.rowIndex;
                    lastMatchedCell.rowSpan = 1 + parentOfParent.rowIndex - lastMatchedCell.parentNode.rowIndex;
                    trClone.appendChild(nodeClone);
                    addConnectorsWhenSplitting(lastMatchedCell, nodeClone);
                }
                // 如果是 colspan 或者(无 rowspan 与 colspan) 则复制节点
                else {
                    if (!parentOfParent.cells[cellIndex] || !parentOfParent.cells[cellIndex].cloneNode) {
                        debugger
                    }
                    nodeClone = parentOfParent.cells[cellIndex].cloneNode();
                    trClone.appendChild(nodeClone);
                    addConnectorsWhenSplitting(parentOfParent.cells[cellIndex], nodeClone);
                }

                // 复制文本
                if (node.parentNode === nodeClone) {
                    while (node.nextSibling) {
                        parentOfParent.appendChild(node.nextSibling);
                    }
                }
            }
            // 添加前后缀
            addConnectorsWhenSplitting(parentOfParent, trClone);

            var tbody = parentOfParent.parentNode;
            tbody.insertBefore(trClone, parentOfParent);
            tbody.insertBefore(parentOfParent, trClone);
            tbody.insertBefore(node, trClone);
        } else {
            addConnectorsWhenSplitting(node.parentNode, parentClone);
            while (node.nextSibling) {
                parentClone.appendChild(node.nextSibling);
            }
            // 复制表头
            if (parentClone.tagName === 'TABLE') {
                if (checkCopyTableHeader(node.parentNode)) {
                    insertChildAt(parentClone, node.parentNode.tHead.cloneNode(true), 0);
                }
            }

            parentOfParent.insertBefore(parentClone, node.parentNode);
            parentOfParent.insertBefore(node.parentNode, parentClone);
            parentOfParent.insertBefore(node, parentClone);

        }
        return moveToTop(editor, node);
    }

    // endregion

    /**
     * 删除左边的注释, 以及判断是否在最左边 (可以通过光标左移到达上一页)
     * @param {CKEDITOR.dom.element} node
     * @return {boolean} 是否可以通过光标左移到达上一页
     */
    function isFirstNotEmptyChild(node) {
        node = node.getPrevious();
        while (node) {
            // 删除注释
            if (node.type === CKEDITOR.NODE_COMMENT) {
                node = node.getPrevious();
                node.getNext().remove();
            }
            // 如果前面有字符则不移动光标
            else if (node.getText().replace(zeroWidthChar, '').length) {
                return false;
            }
            node = node.getPrevious();
        }
        return true;
    }

    // 因为页脚的位置是absolute, 故需要加一个页面高度补正
    function setPageFooterPlaceHolder(page) {
        var middleLayer = page.firstChild;
        var placeHolder, pageFooter;
        placeHolder = $(middleLayer).find('>div.' + thisCmd.FAKE_PAGE_FOOTER)[0];
        pageFooter = $(middleLayer).find('>div.' + thisCmd.PAGE_FOOTER_CLASS)[0];

        // 肯定有页脚, 不一定有占位符
        if (!placeHolder) {
            placeHolder = document.createElement('div');
            placeHolder.className = thisCmd.FAKE_PAGE_FOOTER;
            middleLayer.append(placeHolder);
            if (thisCmd.AUTO_PAGING_DEBUG) {
                placeHolder.style.background = '#ddaadd';
            }
        }
        if (pageFooter) {
            placeHolder.style.height = pageFooter.offsetHeight + 'px';
        } else {
            console.error('我页脚呢?');
        }
    }

    // 从标签上看不能分割的东西(表格的一行等)
    function couldDivide(node) {
        // var returns = true;
        // if (node.nodeType === CKEDITOR.NODE_ELEMENT) {
        //     // tags
        //     if (thisCmd.TAGS_NOT_DIVIDE.indexOf(node.tagName) !== -1) {
        //         returns = false;
        //     }
        //     // classes
        //     else if (node.className) {
        //         for (var i = 0; i < thisCmd.CLASS_NOT_DIVIDE.length; i++) {
        //             if (hasClass(node, thisCmd.CLASS_NOT_DIVIDE[i])) {
        //                 returns = false;
        //                 break;
        //             }
        //         }
        //     }
        // }
        // return returns;

        return $(node).filter(thisCmd.NOT_DIVIDE).length === 0;
    }

    // 判断前后两个表格是否一样
    function checkIsTheSameTable(prev, next) {
        if (!prev || !next) {
            return false;
        }
        var id = prev.getAttribute('hm-table-id');
        return id && id === next.getAttribute('hm-table-id');
        // return getAttributesComplement(prev, next) !== null;
    }

    // 获取子元素中的第一个/最后一个元素, 如果他是需要拆分表头的表格.
    // node: 页面
    // findFirst: 如果为true, 则递归查找第一个子元素; 否则递归查找最后一个子元素.
    function getTableInOnePage(node, findFirst) {
        if (!node || !node.childNodes) {
            return null;
        }
        if (node.tagName === 'TABLE') {
            return node;
        } else {
            return findFirst ? getTableInOnePage(node.firstChild, findFirst) : getTableInOnePage(node.lastChild, findFirst);
        }
    }

    function checkCopyTableHeader(table) {
        // if (debugHandler) {
        //     debugger;
        // }
        return table.tHead && table.getAttribute(thisCmd.COPY_TABLE_HEADER);
    }


    // 获取 node 中的第一个字并将其移出 node

    // args:
    // body: body,
    // logicPageHeight: logicPageHeight,
    // prevPage: prevPage,
    // prevPageContent: prevPageContent,
    // // nextPage: nextPage,
    // // nextPageContent: prevPageContent,
    // forceDivide: false,
    // lastTableInPrevPage: lastTableInPrevPage
    //
    // 返回:
    // node,
    // hasTable,                        是否含有表格
    // tableHasConnector,               表格是否具有连接符 (有连接符就需要在合并之后重新计算这一页所有表的打印误差, 否则只用算新加的表的误差)
    // nodeRemoved                      是否移除此元素
    function getFirstChar(editor, node, args) {
        if (!node) {
            // 这里不应该为空
            debugger
            return {node: null};
        }
        try {
            // 注释直接挪
            if (node.nodeType === CKEDITOR.NODE_COMMENT) {
                return {node: node, hasTable: false};
            }

            // // todo? 如果 node 的后一个节点不达标就把 node 整个往前挪; 需要管 rowspan
            // if (args.parentTop + node.offsetTop + node.offsetHeight < args.heightHypothesis) {
            // 果 node 不达标就把 node 整个往前挪; 需要管 rowspan
            if (args.prevPage.offsetHeight + node.offsetHeight <= args.logicPageHeight) {
                switch (node.nodeName) {
                    case 'TABLE':
                        return {
                            node: node,
                            hasTable: true,
                            tableHasConnector: hasClassPrefix(node, thisCmd.CONNECTOR_CLASS_NAME),
                            nodeRemoved: true
                        };
                    // 如果是 tr 则看有无 rowspan
                    case 'TR':
                        var next = node.nextElementSibling;
                        if (next && next.nodeName === 'TR') {
                            var cells = node.cells;
                            // 排除由于 colspan 重复计数的格子
                            var lastMatchedCell = null;
                            for (var cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                                if (cells[cellIndex].rowSpan > 1 && lastMatchedCell !== cells[cellIndex]) {
                                    lastMatchedCell = cells[cellIndex];
                                    if (!hasClass(lastMatchedCell, thisCmd.HAS_ROWSPAN)) {
                                        addOneClass(lastMatchedCell, thisCmd.HAS_ROWSPAN);
                                    }
                                    var nodeClone = lastMatchedCell.cloneNode();
                                    nodeClone.rowSpan = lastMatchedCell.rowSpan - 1;
                                    lastMatchedCell.rowSpan = 1;
                                    addConnectors(lastMatchedCell, nodeClone, true);
                                    insertChildAt(next, nodeClone, cellIndex);
                                }
                            }
                        }
                        // 这里不用考虑表格套表格的情况, 因为都到这一步了, 父级表格一定有分页连接符了
                        return {node: node, hasTable: false, nodeRemoved: true};
                    default:
                        return {node: node, hasTable: node.getElementsByTagName('TABLE').length, nodeRemoved: true};
                }
            }

            // 处理字符节点, 粗略地估计多出的行数
            if (node.nodeType === CKEDITOR.NODE_TEXT) {
                var data = node.data;
                var parentNode = $(node.parentNode);
                var fontSize = parseFloat(parentNode.css('font-size'));
                var lineHeight = parseFloat(parentNode.css('line-height'));
                // todo margin 和 padding 算不算
                var width = parseFloat(parentNode.css('width'));
                // 在宋体中: 中文宽度为字符宽度, 英文宽度为字符宽度的一半.
                // 故可以把字符全部看做为中文字符, 粗略地计算需要往前挪多少个整行.
                var line = -1 + Math.ceil((args.logicPageHeight - args.prevPage.offsetHeight + (lineHeight - fontSize)) / lineHeight);
                // 这一次需要移动多少个字符
                var strCount = (line > 0 && width >= fontSize) ? line * (Math.floor(width / fontSize)) : 1;
                for (var i = 0; i < strCount && strCount < data.length; i++) {
                    if (zeroWidthChar.test(data[i])) {
                        strCount++;
                    } else if (halfWidthChar.test(data[i])) {
                        strCount += 0.5;
                    }
                }
                strCount = Math.floor(strCount);
                // 如果行首标点在行末
                if (data.length > strCount &&
                    thisCmd.LINE_START_PUNCTUATION.test(data[strCount]) ||
                    thisCmd.LINE_END_PUNCTUATION.test(data[1 + strCount])) {
                    strCount++;
                }

                var returnData;
                if (data.length > strCount) {
                    returnData = editor.document.$.createTextNode(data.substr(0, strCount));
                    node.data = data.substr(strCount);
                } else {
                    returnData = node;
                }
                return {node: returnData, hasTable: false};
            }

            // couldDivide 暂时未包含表格, 故此处暂时把表格置空
            if (!couldDivide(node)) {
                return {node: node, hasTable: false};
            }
            // 不存在需要判别是否不能分割的情况

            // 如果第一个字是 text 而且长度为 0 则丢弃之
            while (node.childNodes.length > 0 &&
            node.childNodes[0].nodeType === CKEDITOR.NODE_TEXT &&
            node.childNodes[0].data.length === 0) {
                node.childNodes[0].remove();
            }

            // 比如 <span></span>
            if (node.childNodes.length === 0) {
                return {node: node, hasTable: false};
            }
            // 高度为0的节点
            else if (node.offsetHeight === 0) {
                return {node: node, hasTable: false};
            }
            // 多级 node
            else {
                var returns = {node: null, hasTable: false};
                var firstChild = node.firstChild;
                var firstChar = node.cloneNode();
                // 如果是表的话需要删除此表的结构
                // todo 不用在这删除, 可以等某一行被删没了再删除此表结构
                if (node.tagName === 'TABLE') {
                    // 如果没有前后缀和 ID 就添加 ID
                    // 因为目前保存时都已经去掉分页, 故可以放心添加 tableId
                    var tableId = node.getAttribute('hm-table-id');
                    if (!tableId) {
                        tableId = CKEDITOR.tools.getUniqueId();
                        node.setAttribute('hm-table-id', tableId);
                    }

                    // 如果没有 colgroup 就添加 colgroup
                    var colgroup = CKEDITOR.tools.getOrCreateColgroup(node, true);

                    editor.plugins.tabletools.tableArchitectureTools.clearTableArchitecture(node);
                    returns.hasTable = true;
                    returns.tableHasConnector = true;

                    // todo 有一种做法是对所有情况都复制表头, 但是那样会产生过多的开销. 目前的做法是: 先看之前的文本是否已经带表头 且 列数是否一致 且 是否含有连接符
                    // colgroup 的处理也一样.
                    firstChild = node.tBodies[0];
                    // 如果不是同一个表则需要重新复制表头
                    if (!checkIsTheSameTable(args.lastTableInPrevPage, node)) {
                        firstChar = node.cloneNode();
                        // 复制表头
                        if (firstChild) {
                            firstChar.append(colgroup.cloneNode(true));
                            if (checkCopyTableHeader(node)) {
                                firstChar.append(node.tHead.cloneNode(true));
                            }
                        }
                        // 如果没有 tbody, 则直接挪
                        else {
                            firstChar.append(colgroup);
                            if (checkCopyTableHeader(node)) {
                                firstChar.append(node.tHead);
                            }
                        }
                    }
                    // 如果是同一个表 而且后一个表只有表头, 则直接丢弃后一个表
                    else {
                        firstChar = node.cloneNode();
                        if (!firstChild && checkCopyTableHeader(node)) {
                            node.remove();
                        }
                    }
                }
                // 如果是表格行, 需要同时处理所有的td
                else if (node.tagName === 'TR' &&
                    node.childNodes.length > 0 &&
                    node.cells[0].tagName !== 'TH') {
                    // 如果该行被分割过, 就直接挪字去上一页
                    var suffixIndex = node.className.indexOf(thisCmd.CONNECTOR_SUFFIX);
                    var suffix, prevClass, prevRow = [], prevTbody;

                    // 如果上一页有这一行则取到这一行
                    if (suffixIndex !== -1) {
                        suffix = node.className.substr(suffixIndex) + ' ';
                        suffix = suffix.substr(0, suffix.indexOf(' '));

                        // 查找匹配前后缀的字符
                        prevClass = suffix.replace(thisCmd.CONNECTOR_SUFFIX, thisCmd.CONNECTOR_PREFIX);
                        prevRow = args.prevPage.getElementsByClassName(prevClass);
                    }
                    // 如果上一页没有这一行则在上一页中添加新行. 在添加新行之后记得更新前一页的 tableArchitecture 数组.
                    if (prevRow.length === 0) {
                        prevRow = node.cloneNode();
                        // 如果该行没有被分割过, 就在上一页克隆一个空行, 要管 rowspan
                        for (var cellIndex = 0; cellIndex < node.cells.length; cellIndex++) {
                            var _ = node.cells[cellIndex].cloneNode();
                            _.rowSpan = 1;
                            prevRow.appendChild(_);
                            addConnectorsWhenSplitting(prevRow.cells[cellIndex], node.cells[cellIndex]);
                        }
                        addConnectorsWhenSplitting(prevRow, node);
                        // 找到后面的表并在第一行将其插入
                        var nextTbody = node.parentNode;
                        suffix = nextTbody.className.substr(nextTbody.className.indexOf(thisCmd.CONNECTOR_SUFFIX)) + ' ';
                        suffix = suffix.substr(0, suffix.indexOf(' '));
                        // 查找匹配前后缀的字符
                        prevClass = suffix.replace(thisCmd.CONNECTOR_SUFFIX, thisCmd.CONNECTOR_PREFIX);
                        prevTbody = args.prevPage.getElementsByClassName(prevClass);
                        if (prevTbody.length > 0) {
                            prevTbody = prevTbody[0];
                            prevTbody.appendChild(prevRow);
                            combineFormat(editor, prevRow, true);

                            // 取得前一页的表然后从 tableArchitecture 数组中删除表. todo 如果能放在 combineFormat 中就更快了
                            var prevTable = prevTbody;
                            while (prevTable && prevTable.nodeName !== 'TABLE') {
                                prevTable = prevTable.parentNode;
                            }
                            editor.plugins.tabletools.tableArchitectureTools.clearTableArchitecture(prevTable);
                        }
                        // 如果没有前面的表就返回 nextRow, 交给上级处理. 因为在访问 tr 时会创建, 故此时没必要创建 tableArchitecture 数组.
                        else {
                            returns.node = prevRow;
                            return returns;
                        }
                    } else {
                        prevRow = prevRow[0];
                    }

                    // region 开始挪字
                    var initialPageOffset = getPageOffset(args.prevPage);
                    prevTbody = prevRow.parentNode;
                    var prevTable = prevTbody;
                    while (prevTable && prevTable.nodeName !== 'TABLE') {
                        prevTable = prevTable.parentNode;
                    }
                    // 获取表格结构, 生成 "spans 阵列"
                    var theLastTableArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(prevTable);
                    var theLastRowArchitecture = theLastTableArchitecture[theLastTableArchitecture.length - 1];
                    var cellsCount = node.cells.length;

                    // todo 需要备份前一页的格子已免干扰对下一个格子的操作. 考虑到合并单元格, 需要同时记录原来格子的地方.
                    // 排除 colspan 的影响
                    lastMatchedCell = null;
                    var prevRowCells = [], prevRowCellsClone = [];
                    for (var prevCellIndex = 0, trueCellIndex = 0;
                         trueCellIndex < theLastRowArchitecture.length;
                         prevCellIndex++, trueCellIndex++) {
                        // 取上一页的对应格子. 先从表格结构处取.
                        var prevCell = theLastRowArchitecture[trueCellIndex];
                        // 如果跟前面取的格子相同则代表有 colspan, 排除之
                        if (prevCell !== false) {
                            // colspan 导致只需要 truCellIndex++
                            if (lastMatchedCell === prevCell) {
                                prevCellIndex--;
                                continue;
                            } else {
                                lastMatchedCell = prevCell;
                                // 如果有 rowspan
                                if (prevCell.rowSpan > 1) {
                                    prevCellIndex--;
                                }
                            }
                        }
                        // 如果为 FALSE 则表示该单元格没有被合并, 就从对应位置 (prevCellIndex) 取
                        else {
                            lastMatchedCell = null;
                            prevCell = prevRow.cells[prevCellIndex];

                        }
                        // 取得 prevCell 之后, 复制表格, 存到数组中
                        prevRowCells.push(prevCell);
                        var prevCellClone = prevCell.cloneNode();
                        prevRowCellsClone.push(prevCellClone);
                        // 设置宽度(实际宽度)
                        // $(prevCellClone).css('width', $(prevCell).css('width'));
                        // 替换表格为空表格
                        switchNodes(prevCell, prevCellClone);
                    }
                    // 遍历每个格子
                    lastMatchedCell = null;
                    var skippedCount = 0;
                    // prevCellIndex: 前一页格式上的 index, nextCellIndex: 后一页格式上的 index, trueCellIndex: 视觉上的 index
                    // 由于 rowspan 故需要区分 prevCellIndex 与 trueCellIndex, 由于 colspan 故需要区分 nextCellIndex 与 trueCellIndex.
                    for (var prevCellIndex = 0, nextCellIndex = 0, trueCellIndex = 0;
                         trueCellIndex < theLastRowArchitecture.length;
                         prevCellIndex++, nextCellIndex++, trueCellIndex++) {
                        // 取上一页的对应格子. 先从表格结构处取.
                        var prevCell = theLastRowArchitecture[trueCellIndex];
                        // 如果跟前面取的格子相同则代表有 colspan, 排除之
                        if (prevCell !== false) {
                            // colspan 导致只需要 truCellIndex++
                            if (lastMatchedCell === prevCell) {
                                prevCellIndex--;
                                nextCellIndex--;
                                continue;
                            } else {
                                lastMatchedCell = prevCell;
                                // 如果有 rowspan
                                if (prevCell.rowSpan > 1) {
                                    prevCellIndex--;
                                }
                                // 注意: 因为这里是指针引用, 所以换回来的顺序无所谓
                                switchNodes(prevRowCellsClone[nextCellIndex], prevRowCells[nextCellIndex]);
                            }
                        }
                        // 如果为 FALSE 则表示该单元格没有被合并, 就从对应位置 (prevCellIndex) 取
                        else {
                            // 注意: 由于我们把原来的格子事先拿出去了, 所以需要先换回来
                            switchNodes(prevRowCellsClone[nextCellIndex], prevRowCells[nextCellIndex]);

                            prevCell = prevRow.cells[prevCellIndex];
                            lastMatchedCell = null;
                        }
                        var nextCell = node.cells[nextCellIndex];
                        if (!nextCell) {
                            console.error('找不到nextCell???');
                            switchNodes(prevRowCells[nextCellIndex], prevRowCellsClone[nextCellIndex]);
                            debugger;
                            continue;
                        }


                        // 复制 className
                        var prevCellClassName = prevCell.className;

                        // 为了防止整个td被移除, 需要复制td结构
                        var nextCellClone = nextCell.cloneNode();

                        var cycleCount = 0;
                        // 内层循环: 逐个挪字
                        !nextCell.childNodes.length && skippedCount++;
                        while (!forceStopPaging && nextCell.childNodes.length > 0 && args.prevPage.offsetHeight <= args.logicPageHeight) {
                            if (cycleCount++ > thisCmd.MAX_CYCLE_COUNT) {
                                autoPageError(editor, '超时: getFirstChar td 内层');
                                forceStopPaging = true;
                                setPageBreakByHandLabel(false);
                            }
                            if (cycleCount > 5000) {
                                debugger
                            }
                            var cell = getFirstChar(editor, nextCell, {
                                body: args.body,
                                logicPageHeight: args.logicPageHeight,
                                prevPage: args.prevPage,
                                prevPageContent: args.prevPageContent,
                                forceDivide: false,
                            });

                            if (cell.node) {
                                if (theLastRowArchitecture[trueCellIndex] === false) {
                                    insertChildAt(prevRow, cell.node, 1 + prevCellIndex);
                                } else {
                                    insertChildAt(theLastRowArchitecture[trueCellIndex].parentNode, cell.node, 1 + theLastRowArchitecture[trueCellIndex].cellIndex);
                                }
                                combineFormat(editor, cell.node, true);
                            }

                            clearTableHeightOffset(prevTable);
                            // todo 胖罐子胖摔, 禁止在这里减少偏移量而导致死循环
                            setPageOffset(args.prevPage,
                                Math.max(initialPageOffset, calcPageOffset(args.prevPage, true)));
                        }
                        // 如果本cell被移除就把td结构加回去
                        if (node.childNodes.length < cellsCount) {
                            insertChildAt(node, nextCellClone, nextCellIndex);
                            // 还需要加上连接符用于下次编辑之后的分页
                            prevRow.cells[prevCellIndex].className = prevCellClassName;
                        }

                        // 处理完成之后再换回去
                        switchNodes(prevRowCells[nextCellIndex], prevRowCellsClone[nextCellIndex]);
                    }
                    // 把整行放回去
                    for (var _ = 0; _ < prevRowCells.length; _++) {
                        switchNodes(prevRowCellsClone[_], prevRowCells[_]);
                    }
                    // 如果全跳过就返回整行
                    if (skippedCount === cellsCount) {
                        returns.node = node;
                    }
                    // endregion
                    return returns;
                }

                // 其他情况
                if (firstChild) {
                    var theFirstCharOfFirstChar = getFirstChar(editor, firstChild, {
                        body: args.body,
                        logicPageHeight: args.logicPageHeight,
                        prevPage: args.prevPage,
                        prevPageContent: args.prevPageContent,
                        forceDivide: args.forceDivide,
                    });
                    if (!theFirstCharOfFirstChar.node) {
                        return returns;
                    }

                    // 如果 theFirstCharOfFirstChar 为 span 且被移除, span 里面有个 br, 且把 br 移除之后 span 高度和父元素高度变为相同 (比如新文本最后一个br)
                    // 且 node 有效子元素个数为0

                    if (theFirstCharOfFirstChar.nodeRemoved && theFirstCharOfFirstChar.node.tagName === 'SPAN' && firstChild.tagName === 'SPAN') {
                        var brs = $(theFirstCharOfFirstChar.node).children('br');
                        if (brs.length === 1) {
                            brs.css('display', 'none');
                            if (theFirstCharOfFirstChar.node.offsetHeight === node.offsetHeight ||
                                theFirstCharOfFirstChar.node.offsetHeight === 0) {
                                brs.css('display', '');
                                theFirstCharOfFirstChar.node = node;
                                return theFirstCharOfFirstChar;
                            } else {
                                brs.css('display', '');
                            }
                        }
                    }

                    firstChar.append(theFirstCharOfFirstChar.node);
                    returns.hasTable = returns.hasTable || theFirstCharOfFirstChar.hasTable;
                    returns.tableHasConnector = returns.tableHasConnector || theFirstCharOfFirstChar.tableHasConnector;
                }
                // 如果 firstChar 中含有后缀, 则要单独处理
                if (hasClassPrefix(firstChar, thisCmd.CONNECTOR_SUFFIX)) {
                    // todo 应该避免重复计算随机数
                    addConnectorsWhenSplitting(firstChar, node);
                } else {
                    addConnectors(firstChar, node, true);
                }
                returns.node = firstChar;
                return returns;
            }
        } catch (e) {
            console.error(e);
            forceStopPaging = true;
            setPageBreakByHandLabel(false);
            debugger
            throw(e);
        }
    }

    // 获取 node 中的最后一个字并将其移出 node
    // todo 处理图片的时候会有bug
    // 识别最后一个 字/结构, 如果有分割则在被分割元素上添加分割的前后缀

    // args:
    // body: body,
    // logicPageHeight: logicPageHeight,
    // prevPage: prevPage,
    // // prevPageContent: prevPageContent,
    // // nextPage: nextPage,
    // nextPageContent: nextPageContent,
    // forceDivide: false,
    // firstTableInNextPage: firstTableInNextPage,
    // parentTop: prevPageContent.offsetTop // 父级元素的 offsetTop
    //
    // 返回:
    // node,
    // hasTable,                        是否含有表格
    // tableHasConnector,               表格是否具有连接符 (有连接符就需要在合并之后重新计算这一页所有表的打印误差, 否则只用算新加的表的误差)
    function getLastChar(editor, node, args) {
        if (!node) {
            // 这里不应该为空
            debugger
            return {node: null};
        }
        try {
            // 注释直接挪
            if (node.nodeType === CKEDITOR.NODE_COMMENT) {
                return {node: node, hasTable: false, nodeRemoved: true};
            }
            var nodeClone;

            // 如果 前一页高度-node高度>A4高度， 就把 node 整个往后挪
            // 如果是 tr 则需要额外考虑是否有 rowspan
            // var _prev = node.previousElementSibling;
            if (args.prevPage.offsetHeight - node.offsetHeight > args.logicPageHeight) {
                switch (node.nodeName) {
                    case 'SPAN':
                        var last = node.lastChild;
                        if (last && last.nodeName === 'BR') {
                            // span 的最后一个字如果是 br 的话, br 是不算入 span 的高度的.
                            last.remove();
                            if (args.prevPage.offsetHeight - node.offsetHeight > args.logicPageHeight) {
                                node.append(last);
                                return {
                                    node: node,
                                    hasTable: node.getElementsByTagName('TABLE').length,
                                    nodeRemoved: true
                                };
                            } else if (hasClass(node, thisCmd.HAS_BR)) {
                                nodeClone = node.cloneNode();
                                addConnectorsWhenSplitting(node, nodeClone);
                                nodeClone.appendChild(last);
                                return {node: nodeClone, hasTable: false, nodeRemoved: true};
                            } else {
                                addOneClass(node, thisCmd.HAS_BR);
                                return {node: null};
                            }
                        } else if (last && last.nodeType === CKEDITOR.NODE_ELEMENT && last.offsetHeight === 0) {
                            // 如果最后一个字是 书签/无内容的新文本 就会这样, 然后如果前一个字符还是 br, 就需要先把书签挪到后一页去
                            debugger
                            nodeClone = node.cloneNode();
                            addConnectorsWhenSplitting(node, nodeClone);
                            nodeClone.appendChild(last);
                            return {
                                node: nodeClone,
                                hasTable: node.getElementsByTagName('TABLE').length,
                                nodeRemoved: true
                            };
                        }
                        return {node: node, hasTable: node.getElementsByTagName('TABLE').length, nodeRemoved: true};
                    case 'TABLE':
                        return {
                            node: node,
                            hasTable: true,
                            tableHasConnector: hasClassPrefix(node, thisCmd.CONNECTOR_CLASS_NAME),
                            nodeRemoved: true
                        };
                    case 'TR':
                        // 如果该行没有被分割过, 就返回一个空行, 记得看上一页是否有 rowspan
                        var rowIndex = node.rowIndex;
                        // 表结构
                        var table = node;
                        while (table && table.nodeName !== 'TABLE') {
                            table = table.parentNode;
                        }
                        // 表格这一行的结构
                        var rowArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(table)[rowIndex];
                        // 每个格子检查一遍, 排除有 colspan 的重复计算的格子
                        var lastMatchedCell = null;
                        for (var trueCellIndex = 0; trueCellIndex < rowArchitecture.length; trueCellIndex++) {
                            // 获取到影响这一行的格子
                            var spanedTd = rowArchitecture[trueCellIndex];
                            // 如果这一行对应位置的格子被之前行影响, 则要复制含有 rowspan 的格子
                            if (spanedTd && spanedTd !== lastMatchedCell && spanedTd.rowSpan > 1) {
                                lastMatchedCell = spanedTd;
                                if (!hasClass(spanedTd, thisCmd.HAS_ROWSPAN)) {
                                    addOneClass(spanedTd, thisCmd.HAS_ROWSPAN);
                                }
                                nodeClone = spanedTd.cloneNode();
                                spanedTd.rowSpan--;
                                nodeClone.rowSpan = 1;
                                insertChildAt(node, nodeClone, trueCellIndex);
                                addConnectors(spanedTd, nodeClone, false);
                            }
                        }
                        // 由于 tableArchitectures 的数组特性, 在减少行的时候不需要变动 tableArchitectures. 直接返回就行.
                        return {node: node, hasTable: false, nodeRemoved: true};
                    default:
                        return {node: node, hasTable: node.getElementsByTagName('TABLE').length, nodeRemoved: true};
                }
            }

            // 处理字符节点, 粗略地估计多出的行数
            // todo 需要识别非宋体(非等宽字符)
            if (node.nodeType === CKEDITOR.NODE_TEXT) {
                var data = node.data;
                var parentNode = $(node.parentNode);
                var fontSize = parseFloat(parentNode.css('font-size'));
                var lineHeight = parseFloat(parentNode.css('line-height'));
                // todo margin 和 padding 算不算
                var width = parseFloat(parentNode.css('width'));
                // todo 删除合并单元格的内容会导致其他列的高度发生变化.
                //  如果此格子的 rowspan == x, 则删除一行之后可能导致其他列的 x 行都发生高度的变化,
                //  此时至多会使页面打印最终高度的偏差增加x. (所以少移一行?)
                //  另外一个bug: 把最后一行挪出去之后, 其他行的高度(高度不够, 平均分摊高度时)也可能会变.......不好处理
                // 在宋体中: 中文宽度为字符宽度, 英文宽度为字符宽度的一半.
                // 故可以把字符全部看做为中文字符, 粗略地计算需要往前挪多少个整行.
                // 因为挪字可能引起行高的变化, 所以需要少挪一行.
                var line = -2 + Math.floor((args.prevPage.offsetHeight - args.logicPageHeight + (lineHeight - fontSize)) / lineHeight);
                // 这一次需要移动多少个字符
                var strCount = (line > 0 && width >= fontSize) ? line * (Math.floor(width / fontSize)) : 1;
                for (var i = data.length - 1; i >= 0 && i >= data.length - strCount; i--) {
                    if (zeroWidthChar.test(data[i])) {
                        strCount++;
                    } else if (halfWidthChar.test(data[i])) {
                        strCount += 0.5;
                    }
                }
                // 从后面切割, 所以需要减去总长度
                strCount = data.length - Math.floor(strCount);

                // 如果行首标点在行末
                if (strCount > 0 &&
                    thisCmd.LINE_START_PUNCTUATION.test(data[strCount - 1]) ||
                    thisCmd.LINE_END_PUNCTUATION.test(data[strCount])) {
                    strCount--;
                }

                var returnData, nodeRemoved = false;
                if (strCount > 0) {
                    returnData = editor.document.$.createTextNode(data.substr(strCount));
                    node.data = data.substr(0, strCount);
                } else {
                    returnData = node;
                    nodeRemoved = true;
                }
                return {node: returnData, hasTable: false, nodeRemoved: nodeRemoved};
            }

            // 换行符/图片之类的 没有内标签的字
            if (node.nodeType === CKEDITOR.NODE_ELEMENT && node.childNodes.length === 0) {
                //todo 删除图片
                return {node: node, hasTable: false, nodeRemoved: true};
            }
            // 如果从标签上看不能分割: couldDivide 暂时未包含表格, 故此处暂时把表格置空
            if (!couldDivide(node)) {
                if (node.offsetHeight + (args.prevPage.offsetHeight - args.prevPageContent.offsetHeight) <= args.logicPageHeight) {
                    return {node: node, hasTable: false, nodeRemoved: true};
                }
                // 如果不能分割 且 元素超长
                else {
                    args.forceDivide = true;
                }
            }
            // 如果从标签上看不能分割 但是 由于长度限制必须分割
            // 在处理下级元素时需要复位此标志
            if (args.forceDivide && node.nodeType === CKEDITOR.NODE_ELEMENT) {
                // 取消高度设置
                node.style.height = '';
                node.style.minHeight = '';
                // 如果是图片则缩小
                if (node.tagName === 'IMG') {
                    node.style.objectFit = "contain";
                    node.style.maxHeight = args.netPageHeight + 'px';
                    console.log('图片过大, 改变大小:');
                    console.log(node);
                    return {node: node, hasTable: false, nodeRemoved: true};
                }
                // 如果此元素有背景图则提示
                else if (node.style.backgroundImage.length > 0) {
                    editor.showNotification('存在包含背景图片且无法分割的目标, 请按f12查看错误日志', 'error', editor.config.clipboard_notificationDuration);
                    console.log('存在包含背景图片且无法分割的目标:');
                    console.log(node);
                }
                // 如果是表头则报错
                else if (node.tagName === 'TR' && node.firstChild.tagName === 'TH') {
                    editor.showNotification('表头过长, 请按f12查看错误日志', 'error', editor.config.clipboard_notificationDuration);
                    console.log('表头过长:');
                    console.log(node);
                    forceStopPaging = true;
                    return {node: node, hasTable: false, nodeRemoved: true};
                }
            }

            // 如果最后一个字是 text 而且长度为 0 则丢弃之
            while (node.childNodes.length > 0 &&
            node.childNodes[node.childNodes.length - 1].nodeType === CKEDITOR.NODE_TEXT &&
            node.childNodes[node.childNodes.length - 1].data.length === 0) {
                node.childNodes[node.childNodes.length - 1].remove();
            }
            // 高度为0的节点
            if (node.offsetHeight === 0) {
                return {node: node, hasTable: false, nodeRemoved: true};
            }


            // 如果有 has-br, 去除之.
            if (hasClass(node, thisCmd.HAS_BR)) {
                removeClass(node, thisCmd.HAS_BR);
                nodeClone = node.cloneNode();
                addConnectorsWhenSplitting(node, nodeClone);
                nodeClone.appendChild(document.createElement('br'));
                return {node: nodeClone, hasTable: false, nodeRemoved: false};
            }

            // region 最后一个字带格式: 多级 node
            var returns = {node: null, hasTable: false, nodeRemoved: false};
            var lastChild = node.lastChild;
            var lastChar;
            var positionCss = $(node).css('position');
            // 如果是表格
            if (node.tagName === 'TABLE') {
                // 如果没有前后缀和 ID 就添加 ID
                // 因为目前保存时都已经去掉分页, 故可以放心添加 tableId
                var tableId = node.getAttribute('hm-table-id');
                if (!tableId) {
                    tableId = CKEDITOR.tools.getUniqueId();
                    node.setAttribute('hm-table-id', tableId);
                }

                // 如果没有 colgroup 就添加 colgroup
                var colgroup = CKEDITOR.tools.getOrCreateColgroup(node, true);

                // 如果是表的话需要删除此表的结构
                // todo 不用在这删除, 可以等某一行被删没了再删除此表结构
                editor.plugins.tabletools.tableArchitectureTools.clearTableArchitecture(node);
                returns.hasTable = true;
                returns.tableHasConnector = true;

                // todo 有一种做法是对所有情况都复制表头, 但是那样会产生过多的开销. 目前的做法是: 先看之前的文本是否已经带表头 且 列数是否一致 且 是否含有连接符
                // colgroup 的处理也一样.
                lastChild = node.tBodies[0];
                // // 如果不是同一个表则需要重新复制表头
                // if (!checkIsTheSameTable(args.firstTableInNextPage, node)) {
                    lastChar = node.cloneNode();
                    // 复制表头
                    if (lastChild) {
                        if (checkCopyTableHeader(node)) {
                            lastChar.append(node.tHead.cloneNode(true));
                        }
                        lastChar.append(colgroup.cloneNode(true));
                    }
                    // 如果没有 tbody, 则直接挪
                    else {
                        if (checkCopyTableHeader(node)) {
                            lastChar.append(node.tHead);
                        }
                        lastChar.append(colgroup);
                    }
                // }
                // // 如果是同一个表 而且后一个表只有表头, 则直接丢弃后一个表
                // else {
                //     lastChar = node.cloneNode();
                //     if (!lastChild && checkCopyTableHeader(node)) {
                //         node.remove();
                //     }
                // }
            }
            // 如果是表格行, 需要同时处理所有的td;如果能够分别对插入和删除做处理就更好了  todo 表格需要强制拆分时需要考虑是否复制表头
            else if (node.tagName === 'TR' &&
                node.childNodes.length > 0 &&
                node.cells[0].tagName !== 'TH') {
                var prevTbody = node.parentNode;
                var prevTable = prevTbody;
                while (prevTable && prevTable.nodeName !== 'TABLE') {
                    prevTable = prevTable.parentNode;
                }
                var tableArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(prevTable);

                var rowIndex = node.rowIndex;
                var rowArchitecture = tableArchitecture[rowIndex]; // 表格这一行的结构 (是否有格子被 rowspan 影响)
                var prefixIndex = node.className.indexOf(thisCmd.CONNECTOR_PREFIX);
                var prefix, nextClass, nextRow = [];

                // 如果下一页有这一行则取到这一行, 置为 nextRow
                if (prefixIndex !== -1) {
                    prefix = node.className.substr(prefixIndex) + ' ';
                    prefix = prefix.substr(0, prefix.indexOf(' '));
                    // 查找匹配前后缀的字符
                    nextClass = prefix.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX);
                    if (args.nextPageContent) {
                        nextRow = args.nextPageContent.getElementsByClassName(nextClass);
                    }
                }
                // 如果下一页没有这一行则在下一页中添加新行
                if (nextRow.length === 0) {
                    nextRow = node.cloneNode();
                    // 如果该行没有被分割过, 就返回一个空行, 记得看上一页是否有rowspan
                    var lastMatchedCell = null;
                    for (var cellIndex = 0, trueCellIndex = 0;
                         trueCellIndex < rowArchitecture.length;
                         cellIndex++, trueCellIndex++) {
                        // colspan 的情况. 如果这个格子和上一个格子其实是同一个格子就继续循环
                        if (lastMatchedCell && rowArchitecture[trueCellIndex] === lastMatchedCell) {
                            cellIndex--;
                            continue;
                        }
                        lastMatchedCell = rowArchitecture[trueCellIndex];

                        // 如果上一页有 rowspan 则要复制含有 rowspan 的格子
                        //todo 检测运行时间; 可能把前后缀也复制进来了从而导致bug
                        if (lastMatchedCell && lastMatchedCell.rowSpan !== 1) {
                            if (lastMatchedCell.rowSpan > 1) {
                                cellIndex--;
                                if (!hasClass(lastMatchedCell, thisCmd.HAS_ROWSPAN)) {
                                    addOneClass(lastMatchedCell, thisCmd.HAS_ROWSPAN);
                                }
                            }
                            nodeClone = lastMatchedCell.cloneNode();
                            nodeClone.rowSpan = 1;
                            nextRow.appendChild(nodeClone);
                            addConnectorsWhenSplitting(lastMatchedCell, nodeClone);
                        }
                        // 如果是 colspan 或者(无 rowspan 与 colspan) 则复制节点
                        else {
                            if (!node.cells[cellIndex] || !node.cells[cellIndex].cloneNode) {
                                debugger
                            }
                            nodeClone = node.cells[cellIndex].cloneNode();
                            nextRow.appendChild(nodeClone);
                            addConnectorsWhenSplitting(node.cells[cellIndex], nodeClone);
                        }
                    }
                    // 添加前后缀
                    addConnectorsWhenSplitting(node, nextRow);
                    // 找到后面的表并在第一行将其插入
                    prefix = prevTbody.className.substr(prevTbody.className.indexOf(thisCmd.CONNECTOR_PREFIX)) + ' ';
                    prefix = prefix.substr(0, prefix.indexOf(' '));
                    // 查找匹配前后缀的字符
                    nextClass = prefix.replace(thisCmd.CONNECTOR_PREFIX, thisCmd.CONNECTOR_SUFFIX);
                    var nextTbody = [];
                    if (args.nextPageContent) {
                        nextTbody = args.nextPageContent.getElementsByClassName(nextClass);
                    }
                    if (nextTbody.length > 0) {
                        nextTbody = nextTbody[0];
                        nextTbody.insertBefore(nextRow, nextTbody.firstChild);
                        combineFormat(editor, nextRow, false);

                        // 取得后一页的表然后从 tableArchitecture 数组中删除表. todo 如果能放在 combineFormat 中就更快了
                        var nextTable = nextRow;
                        while (nextTable && nextTable.nodeName !== 'TABLE') {
                            nextTable = nextTable.parentNode;
                        }
                        editor.plugins.tabletools.tableArchitectureTools.clearTableArchitecture(nextTable);
                    }
                    // 如果没有后面的表就返回 nextRow, 交给上级处理
                    else {
                        returns.node = nextRow;
                        return returns;
                    }
                } else {
                    nextRow = nextRow[0];
                }


                // region 开始挪字
                var initialPageOffset = getPageOffset(args.prevPage);
                var prevRow = node;
                // region 如果这一行为空, 则直接删除此行并返回 null
                var isNull = true;
                for (var cellIndex = 0; cellIndex < prevRow.cells.length; cellIndex++) {
                    var cell = prevRow.cells[cellIndex];
                    // 排除从excel中粘贴过来的 空span的情况
                    while ((cell.nodeName === 'SPAN' || cell.nodeName === 'DIV') &&
                    cell.childNodes.length === 1) {
                        cell = cell.childNodes[0];
                        if (cell.nodeType !== 1) {
                            isNull = false;
                            break;
                        }
                    }
                    if (cell.childNodes.length > 0) {
                        isNull = false;
                        break;
                    }
                }
                if (isNull) {
                    // 前一页的表格结构需要处理一下
                    tableArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(prevTable);
                    rowArchitecture = tableArchitecture[prevRow.rowIndex];
                    var lastMatchedCell = null;
                    for (var _ = 0; _ < rowArchitecture.length; _++) {
                        if (lastMatchedCell !== rowArchitecture[_] && rowArchitecture[_] !== false) {
                            rowArchitecture[_].rowSpan--;
                            lastMatchedCell = rowArchitecture[_];
                        }
                    }
                    // tableArchitecture.pop(); // 这一句如果没bug的话就不用写
                    prevRow.remove();
                    returns.nodeRemoved = true;
                    return returns;
                }
                // endregion

                // 克隆一行用于计算高度: 把每个格子放到这个克隆行里面计算高度
                // todo 如果 td 是自适应宽度, 而不是固定宽度 则会报错; 如果此行设置了 height 也可能报错
                var prevRowClone = prevRow.cloneNode();
                if (thisCmd.AUTO_PAGING_DEBUG) {
                    addOneClass(prevRowClone, 'debug-row-clone');
                }
                for (var _ = 0; _ < prevRow.cells.length; _++) {
                    prevRowClone.appendChild(prevRow.cells[_].cloneNode());
                }
                // prevTbody.appendChild(prevRowClone);
                if (thisCmd.AUTO_PAGING_DEBUG) {
                    $(prevRowClone).css('background', 'yellow');
                }
                // var heightBefore = args.prevPage.offsetHeight;

                // 查看表结构, 把受 rowspan 影响的格子都先移除
                var spanedTds = [], spanedTdsClone = [], lastMathedCell = null;
                for (var trueCellIndex = 0; trueCellIndex < rowArchitecture.length; trueCellIndex++) {
                    if (rowArchitecture[trueCellIndex] !== false && lastMathedCell !== rowArchitecture[trueCellIndex]) {
                        lastMathedCell = rowArchitecture[trueCellIndex];
                        if (rowArchitecture[trueCellIndex].rowSpan > 1) {
                            var clone = rowArchitecture[trueCellIndex].cloneNode();
                            if (thisCmd.AUTO_PAGING_DEBUG) {
                                clone.style.background = 'yellow';
                            }
                            spanedTds[trueCellIndex] = rowArchitecture[trueCellIndex];
                            spanedTdsClone[trueCellIndex] = clone;
                            switchNodes(spanedTds[trueCellIndex], spanedTdsClone[trueCellIndex]);
                        }
                    }
                }
                // 把整行拿出来, 把行结构放进去
                switchNodes(prevRow, prevRowClone);


                function putBackCell() {
                    insertChildAt(prevRowClone, prevCellClone, prevCellIndex);
                    insertChildAt(prevRow, prevCell, prevCellIndex);
                }

                function putBackRow() {
                    prevRowClone.remove();
                    prevTbody.appendChild(prevRow);
                }

                // 遍历每个格子
                // 循环次数: 在特定情况下 (比如表格列宽度为百分比与px混合时等), 会出现单独一个格子宽度正常但是所有格子放上去就多一行的情况.
                // 这时候就要把这一行整个往下挪.
                var skippedCount = 0;
                // 这里如果是 null, 就表明当前格子不是 spanedTd
                var lastMatchedCell = null;
                var trueCellCount = 0;
                // prevCellIndex: 前一页格式上的 index, nextCellIndex: 后一页格式上的 index, trueCellIndex: 视觉上的 index
                // 由于 rowspan 故需要区分 prevCellIndex 与 trueCellIndex, 由于 colspan 故需要区分 nextCellIndex 与 trueCellIndex.
                for (var prevCellIndex = 0, nextCellIndex = 0, trueCellIndex = 0;
                     trueCellIndex < rowArchitecture.length;
                     prevCellIndex++, nextCellIndex++, trueCellIndex++) {

                    // region 取格子
                    // 取上一页的对应格子. 先从表格结构处取.
                    var prevCell = rowArchitecture[trueCellIndex];
                    // 如果跟前面取的格子相同则代表有 colspan, 排除之
                    if (prevCell !== false) {
                        // colspan 导致只需要 truCellIndex++
                        if (lastMatchedCell === prevCell) {
                            prevCellIndex--;
                            nextCellIndex--;
                            continue;
                        } else {
                            lastMatchedCell = prevCell;
                            // 如果有 rowspan
                            if (prevCell.rowSpan > 1) {
                                prevCellIndex--;
                            }
                        }
                    }
                    // 如果为 FALSE 则表示该单元格没有被合并, 就从对应位置 (prevCellIndex) 取
                    else {
                        lastMatchedCell = null;
                        prevCell = node.cells[prevCellIndex];
                    }
                    // endregion

                    trueCellCount++;

                    if (nextRow.cells.length <= nextCellIndex) {
                        nextRow.insertCell();
                    }
                    // var nextTbody = nextRow.parentNode;
                    var nextClass = nextRow.cells[nextCellIndex].className;


                    // // 获取样式中的宽度
                    // var tdWidth = prevCell.style.width;
                    // // 设置宽度(实际宽度)
                    // $(prevCell).css('width', $(prevCell).css('width'));

                    var cellsCount = node.cells.length;

                    // 为了防止整个td被移除, 需要复制td结构
                    var prevCellClone;

                    // region 判断单元格影响的高度
                    // 如果当前格子不在当前行中(rowspan), 则要替换为去掉当前行之后的高度差
                    if (prevCell.rowSpan > 1) {
                        prevCellClone = spanedTdsClone[trueCellIndex];
                        var heightAfter = args.prevPage.offsetHeight;
                        // 放回去
                        switchNodes(prevCellClone, prevCell);
                        // 如果影响过小, 则继续看下一个格子:
                        // 整行高度 heightBefore 一定大于逻辑高度 logicPageHeight, 不用管;
                        // 只算上这个格子的高度 heightAfter 一定小于整行高度//, 但是不一定小于逻辑高度 (当前面一行高度判断错误的情况下);
                        // 只算上这个格子的高度和不算这个格子的高度相同;
                        if (//heightAfter < heightBefore &&
                            heightAfter > args.logicPageHeight &&
                            heightAfter === args.prevPage.offsetHeight) {
                            // putBackRow();
                            skippedCount++;
                            continue;
                        }
                    } else {
                        prevCellClone = prevRowClone.childNodes[prevCellIndex];
                        // 放回去
                        switchNodes(prevCellClone, prevCell);
                        // 如果影响过小, 则继续看下一个格子

                        if (args.prevPage.offsetHeight < args.logicPageHeight) {
                            putBackCell();
                            skippedCount++;
                            continue;
                        }
                    }
                    // endregion

                    var cellRemoved = false;
                    var truePrevRow = prevCell.parentNode;
                    var truePrevCellIndex = prevCell.cellIndex;

                    var cycleCount = 0;
                    while (!forceStopPaging && prevCell.childNodes.length > 0 &&
                    args.prevPage.offsetHeight > args.logicPageHeight) {
                        if (cycleCount++ > thisCmd.MAX_CYCLE_COUNT) {
                            autoPageError(editor, '超时: getLastChar内层');
                            forceStopPaging = true;
                            setPageBreakByHandLabel(false);
                        }
                        if (cycleCount > 5000) {
                            debugger
                        }
                        var cell = getLastChar(editor, prevCell, {
                            body: args.body,
                            logicPageHeight: args.logicPageHeight,
                            prevPage: args.prevPage,
                            prevPageContent: args.prevPageContent,
                            // nextPage: nextPage,
                            nextPageContent: args.nextPageContent,
                            forceDivide: false,
                            firstTableInNextPage : args.firstTableInNextPage ? getTableInOnePage(args.firstTableInNextPage.firstElementChild, true):null,
                            // 父级元素的 offsetTop
                            parentTop: args.parentTop
                        });

                        // 如果前一个格子的换行符被删了, 而且前一个格子只有一个换行符, 就得加回去
                        if (!cell.node && hasClass(prevCell, thisCmd.HAS_BR)) {
                            removeClass(prevCell, thisCmd.HAS_BR);
                            cell.node = prevCell.cloneNode();
                            cell.node.appendChild(document.createElement('br'));
                        }
                        if (cell.node) {
                            insertChildAt(nextRow, cell.node, nextCellIndex);
                            combineFormat(editor, cell.node, false);
                            cellRemoved = cellRemoved || cell.nodeRemoved;
                        }

                        // 如果没有子元素了就删除
                        if (prevCell.childNodes.length === 0) {
                            if (prevCell.rowSpan > 1) {
                                break;
                            } else {
                                prevCell.remove();
                                cellRemoved = true;
                            }
                        }

                        // todo todelete
                        clearTableHeightOffset(prevTable);

                        // todo 胖罐子胖摔, 禁止在这里增加偏移量而导致死循环
                        setPageOffset(args.prevPage,
                            Math.min(initialPageOffset, calcPageOffset(args.prevPage, true)));
                    }

                    // 放回去
                    if (prevCell.rowSpan <= 1) {
                        putBackCell();
                    }
                    // 如果本cell被移除就把td结构加回去
                    // todo 要考虑合并单元格
                    if (node.childNodes.length < cellsCount) {
                        insertChildAt(node, prevCellClone, prevCellIndex);
                        // 还需要加上连接符用于下次编辑之后的分页
                        nextRow.cells[nextCellIndex].className = nextClass;
                    } else if (cellRemoved) {
                        insertChildAt(truePrevRow, prevCellClone, truePrevCellIndex);
                        // 还需要加上连接符用于下次编辑之后的分页
                        nextRow.cells[nextCellIndex].className = nextClass;
                    }
                    // // 还原宽度
                    // if (tdWidth.length === 0) {
                    // $(prevCell).css('width', '');
                    // }


                    // 如果程序把 prevCell 整个挪到下一页, 导致 node 为空时直接返回之
                    if (node.cells.length === 0) {
                        // 这里需要处理被拿出去的合并单元格
                        debugger
                        returns.node = node;
                        returns.nodeRemoved = true;
                        return returns;
                    }
                }
                // 把整行放回去
                putBackRow();

                // 这一行为空的情况, 要处理合并单元格(行)
                if (skippedCount === trueCellCount) {
                    lastMatchedCell = null;
                    for (prevCellIndex = 0, trueCellIndex = 0; trueCellIndex < rowArchitecture.length; trueCellIndex++) {
                        var cell = rowArchitecture[trueCellIndex];
                        if (cell === lastMatchedCell) {
                            continue;
                        }
                        prevCellIndex++;
                        if (cell === false) {
                            continue;
                        }
                        lastMatchedCell = cell;

                        // 处理合并单元格(行)
                        if (cell !== prevRow.cells[prevCellIndex]) {
                            if (!hasClass(cell, thisCmd.HAS_ROWSPAN)) {
                                addOneClass(cell, thisCmd.HAS_ROWSPAN);
                            }
                            nodeClone = cell.cloneNode();
                            addConnectorsWhenSplitting(cell, nodeClone);
                            cell.rowSpan--;
                            nodeClone.rowSpan = 1;
                            insertChildAt(prevRow, nodeClone, prevCellIndex - 1);
                        }
                    }

                    returns.node = prevRow;
                    returns.nodeRemoved = true;

                    return returns;
                }

                // region 如果这行没内容了就删除这行
                // 因为是先往前挪再往后挪, 故估计只在getLastChar中才会用到这个逻辑
                var isNull = true;
                for (var cellIndex = 0; cellIndex < prevRow.cells.length; cellIndex++) {
                    var cell = prevRow.cells[cellIndex];
                    // 排除从excel中粘贴过来的 空span的情况
                    while ((cell.nodeName === 'SPAN' || cell.nodeName === 'DIV') &&
                    cell.childNodes.length === 1) {
                        cell = cell.childNodes[0];
                    }
                    if (cell.childNodes.length > 0) {
                        isNull = false;
                        break;
                    }
                }
                if (isNull) {
                    // 前一页的表格结构需要处理一下
                    tableArchitecture = editor.plugins.tabletools.tableArchitectureTools.getTableArchitecture(prevTable);
                    rowArchitecture = tableArchitecture[prevRow.rowIndex];
                    var lastMatchedCell = null;
                    // 处理合并行的 rowspan、删除后一页的对应后缀
                    for (var _trueIndex = 0, _prevIndex = 0, _nextIndex = 0;
                         _trueIndex < rowArchitecture.length;
                         _trueIndex++, _prevIndex++, _nextIndex++) {
                        // 先判断是否有重复的格子 (colspan)
                        // 如果不重复
                        if (lastMatchedCell !== rowArchitecture[_trueIndex]) {
                            // 如果这个格子有 span
                            if (rowArchitecture[_trueIndex] !== false) {
                                lastMatchedCell = rowArchitecture[_trueIndex];
                                // 如果是 rowspan
                                if (rowArchitecture[_trueIndex].rowSpan > 1) {
                                    rowArchitecture[_trueIndex].rowSpan--;
                                    _prevIndex--;
                                }
                            }
                            // 如果前一页无 rowspan 就合并这个格子的前后缀
                            else if (prevRow.cells[_prevIndex].rowSpan <= 1) {
                                mergeClassForward(prevRow.cells[_prevIndex], nextRow.cells[_nextIndex]);
                            }
                        }
                        // 重复的格子不处理
                        else {
                            _prevIndex--;
                            _nextIndex--;
                        }
                    }
                    // tableArchitecture.pop(); // 这一句如果没bug的话就不用写

                    // 移除前先合并前后缀
                    mergeClassForward(prevRow, nextRow);

                    prevRow.remove();
                    returns.nodeRemoved = true;
                }
                // endregion

                // endregion
                return returns;
            }

            // 其他情况
            if (!lastChar) {
                lastChar = node.cloneNode();
            }
            var theLastCharOfLastChar = getLastChar(editor, lastChild, {
                body: args.body,
                logicPageHeight: args.logicPageHeight,
                prevPage: args.prevPage,
                prevPageContent: args.prevPageContent,
                // nextPage: nextPage,
                nextPageContent: args.nextPageContent,
                forceDivide: args.forceDivide,
                firstTableInNextPage: args.firstTableInNextPage,
                // 父级元素的 offsetTop
                parentTop: (/*node.tagName === 'TABLE' || */positionCss === 'relative' || positionCss === 'absolute') ? (args.parentTop + node.offsetTop) : args.parentTop
            });

            if (!theLastCharOfLastChar.node) {
                // nodeRemoved 仍然为 false
                return theLastCharOfLastChar;
            }
            // 需要注意的是, 如果是换行符BR, 则需要考虑删除 BR 是否影响上一页的高度. 如果影响上一页的高度, 则需要把 BR 删除, 并将上一页的最后一个元素添加一个换行标志.
            if (theLastCharOfLastChar.node.nodeName === 'BR') {
                // 把br先拿出来
                theLastCharOfLastChar.node.remove();
                // 判断高度是否合适
                if (args.prevPage.offsetHeight <= args.logicPageHeight) {
                    // 合并的时候记得处理这个标志
                    addOneClass(node, thisCmd.HAS_BR);

                    // nodeRemoved 仍然为 false
                    return returns;
                }
            }
            lastChar.append(theLastCharOfLastChar.node);
            returns.hasTable = returns.hasTable || theLastCharOfLastChar.hasTable;
            returns.tableHasConnector = returns.tableHasConnector || theLastCharOfLastChar.tableHasConnector;


            // 如果没有子元素了就删除, 且不再添加前后缀.
            if (node.childNodes.length === 0) {
                node.remove();
                returns.nodeRemoved = true;
            } else if (hasClassPrefix(lastChar, thisCmd.CONNECTOR_PREFIX)) {
                // 如果 lastChar 中含有前缀, 则要单独处理
                // todo 应该避免重复计算随机数
                addConnectorsWhenSplitting(node, lastChar);
            } else {
                addConnectors(node, lastChar, false);
            }

            returns.node = lastChar;
            return returns;
            // endregion
        } catch (e) {
            console.error(e);
            forceStopPaging = true;
            setPageBreakByHandLabel(false);
            debugger
            throw(e);
        }
    }


    // 扫描表格的打印误差
    function getTableHeightOffset(table/*, useCache*/) {
        timeLogger('计算页偏移量', 0);
        var useCache = false;
        // 看看这个表在此次排序中是否被检查过, 有就返回
        if (useCache) {
            for (var i = 0; i < allTableHeightOffsets.length; i++) {
                if (allTableHeightOffsets[i][0] === table) {
                    return allTableHeightOffsets[i][1];
                }
            }
        }
        var offset = 0;
        // 逐行计算误差
        for (var _ = 0; _ < table.rows.length; _++) {
            var height = parseFloat(getComputedStyle(table.rows[_], null).height);
            if (!isNaN(height)) {
                offset += Math.ceil(height) - height;
            }
        }
        // // 存下这个表的信息
        // allTableHeightOffsets.push([table, offset]);
        timeEndLogger('计算页偏移量', true);
        return offset;
    }


    // 移除指定的 table
    function clearTableHeightOffset(table) {
        return;
        for (var i = 0; i < allTableHeightOffsets.length; i++) {
            if (allTableHeightOffsets[i][0] === table) {
                allTableHeightOffsets.splice(i, 1);
                return;
            }
        }
    }

    // 计算页面内的打印误差
    function calcPageOffset(page/*, useCache*/) {
        var tables = page.getElementsByTagName('TABLE');
        var offset = 0;
        for (var _ = 0; _ < tables.length; _++) {
            offset += getTableHeightOffset(tables[_]/*, useCache*/);
        }
        return offset;
    }

    // 获取页面内的打印误差
    function getPageOffset(page) {
        var pageOffset = $(page).find('>>div.' + thisCmd.PAGE_OFFSET_CLASS)[0];
        return (pageOffset.style.height.length > 0) ? parseFloat(pageOffset.style.height) : calcPageOffset(page, true);
    }

    function setPageOffset(page, offset) {
        $(page).find('>>div.' + thisCmd.PAGE_OFFSET_CLASS).css('height', offset + 'px');
        // page.setAttribute(thisCmd.PAGE_PRINT_OFFSET, offset);
    }

    // // 去除最后一页的占位符
    // // todo 从后往前查找可以节省时间
    // function removeTheLastPlaceholder(node) {
    //     var theLastPlaceholders = node.getElementsByClassName(thisCmd.THE_LAST_PLACEHOLDER_CLASS);
    //     // 为了减少bug还是直接删掉吧
    //     while (theLastPlaceholders.length > 0)
    //         theLastPlaceholders[0].remove();
    // }


    // 寻找第一个可供编辑的非 "​" 区域
    function findFirstEditableChild(node, contentEditable) {
        switch (node.nodeType) {
            // 元素节点
            case CKEDITOR.NODE_ELEMENT:
                // 排除高度为0的节点
                if (node.offsetHeight === 0) {
                    return null;
                }
                var editable = node.getAttribute('contenteditable');
                if (editable === null) {
                    editable = contentEditable;
                } else {
                    editable = editable === 'true';
                }
                // 遍历子节点
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = findFirstEditableChild(node.childNodes[i], editable);
                    if (child) {
                        return child;
                    }
                }
                break;
            // 字节点
            case CKEDITOR.NODE_TEXT:
                // 不能编辑则返回 null
                if (!contentEditable) {
                    return null;
                }
                // // 如果是p则返回 yes
                // if ('P' === node.parentNode.tagName) {
                //     return node;
                // }
                // 否则看是否为0宽字符
                return node.data.replace(zeroWidthChar, '').replace(rclass, '').length > 0 ? node : null;
        }
        return null;
    }

    function putSplitMarker(node, pageSplitMarker) {
        if (!node) {
            debugger;
            return;
        }
        if (node.nodeType !== 1 || !hasClassPrefix(node, thisCmd.CONNECTOR_PREFIX)) {
            node.parentNode.insertBefore(pageSplitMarker, node);
            node.parentNode.insertBefore(node, pageSplitMarker);
            return;
        }
        if (false && node.tagName === 'TR') {
            for (var i = 0; i < node.cells.length; i++) {
                // 手动添加的分页符不会被这个函数处理, 故直接复制即可.
                putSplitMarker(node.cells[i], pageSplitMarker.cloneNode());
            }
        } else if (node.childNodes.length > 0) {
            putSplitMarker(node.lastChild, pageSplitMarker);
        } else {
            var asd = 1;
        }
        // else if (node.tagName !== 'TD') {
        //     debugger
        // }
    }

    // 将 newNode 放到 oldNode 的位置并替换之.
    function switchNodes(oldNode, newNode) {
        oldNode.parentNode.insertBefore(newNode, oldNode);
        oldNode.remove();
    }

    // 检查最后一个字是否满足两端对齐要求, 如果是则加上 class
    function setJustify(editor,lastOfPrevious) {
        // 递归查找最后一个子元素
        while (lastOfPrevious) {
            var lastChild = lastOfPrevious.lastChild;
            if (!lastChild) {
                return;
            }
            // 如果是文字就在最近的 p 或 td 加类型
            if (lastChild.nodeType === CKEDITOR.NODE_TEXT) {
                var matchNodeNames = ['P', 'PRE', 'TD'];
                var parentNode = lastChild.parentNode;
                while (parentNode && matchNodeNames.indexOf(parentNode.nodeName) === -1) {
                    parentNode = parentNode.parentNode;
                }



                if (parentNode) {
                    var nextpageNode = boundedNodeByPagebreak(editor,lastOfPrevious);
                    for(var i=0;i<nextpageNode.length;i++){
                        if(!nextpageNode[i].nodeIsPrev){
                            addOneClass(parentNode, 'justify-last');
                            break;
                        };
                    }

                }
                return;
            }
            // 如果是其他带#的节点, 或者自带换行的节点 就跳过
            else if (!lastChild.className || hasClass(lastChild, thisCmd.HAS_BR)) {
                return;
            }
            // 如果是表格行, 需要对每个格子进行处理
            else if (lastChild.nodeName === 'TR') {
                for (var i = 0; i < lastChild.cells.length; i++) {
                    setJustify(editor,lastChild.cells[i]);
                }
            }
            // 其他情况, 如果没有前后缀标志就跳过
            else if (!hasClassPrefix(lastChild, thisCmd.CONNECTOR_PREFIX)) {
                return;
            }
            lastOfPrevious = lastChild;
        }
    }

    // todo 在表格中输入过多的回车(大于一页)可能导致表格合并失败(应该没人会这么无聊吧)

    // 在 targetelement 后插入元素 对表格无效
    function insertAfter(parentElement, newelement, targetelement) {
        // if (parentElement.lastChild === targetelement) {
        //     parentElement.appendChild(newelement);
        // } else {
        //     parentElement.insertBefore(newelement, targetelement.nextSibling);
        // }
        parentElement.insertBefore(newelement, targetelement.nextSibling);
    }

    function autoPageError(editor, str) {
        console.error(str);
        editor.showNotification('分页程序错误, 回退至分页前的数据\n' + ((thisCmd.AUTO_PAGING_DEBUG && str) ? str : ''), 'error', editor.config.clipboard_notificationDuration);
    }

    function backup(editor) {
        return editor.document.getBody().$.innerHTML;
    }

    // endregion

})();

/** 是否被分页隔开, 如果是则返回对应的元素; 如果被分成多页, 则只会返回临近页的元素
 *
 * @param editor
 * @param node
 * @return {*[]} -
 * node: 对应的元素;
 * nodeIsPrev: 此(对应的)元素是否在前一页.
 */
function boundedNodeByPagebreak(editor, node) {
    var _body = $(editor.document.$.body);
    var connector;
    var suffixInConnectors;
    var returns = [];

    connector = getConnectorName(node, CKEDITOR.plugins.pagebreakCmd.CONNECTOR_PREFIX);
    if (connector) {
        suffixInConnectors = connector.substr(CKEDITOR.plugins.pagebreakCmd.CONNECTOR_PREFIX.length);
       var newNode= _body.find('.' + CKEDITOR.plugins.pagebreakCmd.CONNECTOR_SUFFIX + suffixInConnectors);
       if(newNode.length >0){
           returns.push({
               node: newNode,
               nodeIsPrev: false
           });
       }
    }

    connector = getConnectorName(node, CKEDITOR.plugins.pagebreakCmd.CONNECTOR_SUFFIX);
    if (connector) {
        suffixInConnectors = connector.substr(CKEDITOR.plugins.pagebreakCmd.CONNECTOR_SUFFIX.length);
        var otherNode=_body.find('.' + CKEDITOR.plugins.pagebreakCmd.CONNECTOR_PREFIX + suffixInConnectors);
        if(otherNode.length>0){
            returns.push({
                node: otherNode,
                nodeIsPrev: true
            });
        }
    }

    return returns;
}

// 获取前后缀名字
function getConnectorName(node, connectorName) {
    if (!node || !node.className) return null;
    var index = (' ' + node.className).indexOf(' ' + connectorName);
    if (index !== -1) {
        var toTheRight = node.className.substr(index) + ' ';
        return toTheRight.substr(0, toTheRight.indexOf(' '));
    }
    return null;
}

/**
 * 将其他页被拆分开的元素整合进此页, $node 为 jquery 元素.
 * @param editor
 * @param $node
 */
function combine$Nodes(editor, $node) {
    var node = $node[0];
    var boundedNode = boundedNodeByPagebreak(editor, node);
    for (var i = 0; i < boundedNode.length; i++) {
        var otherNode = boundedNode[i].node[0];
        if (boundedNode[i].nodeIsPrev) {
            node.parentNode.insertBefore(otherNode, node);
        } else {
            node.parentNode.insertBefore(otherNode, node.nextSibling);
        }
        CKEDITOR.plugins.pagebreakCmd.combineFormat(editor, otherNode, !boundedNode[i].nodeIsPrev);
    }
}
