commonHM.component['documentModel'].fn({
    /**
     * 设置文档只读
     * @param {*} code  文档唯一编号
     * @param {*} flag  true:只读 false:可编辑
     */
    setReadOnly: function (code, flag) {
        var _t = this;
        var widgetList = [];
        var $body = $(_t.editor.document.getBody().$);
        if (code) { // 如果存在code，则获取指定文档内容
            widgetList = $body.find('[data-hm-widgetid="' + code + '"]');
        } else {
            // 获取所有文档内容
            widgetList = $body.find('[data-hm-widgetid]');
        }
        if (widgetList.length) {
            for (var i = 0; i < widgetList.length; i++) {
                var $widgetNodes = $(widgetList[i]);
                // 在病历壳子上标记当前只读状态 用于分页状态下判断是否需要设置页眉页脚只读
                $widgetNodes.attr('_readonly', flag ? 'true' : 'false');
                // 设置是否可编辑
                $widgetNodes.prop("contenteditable", !flag);
                if ($widgetNodes.attr("_contenteditable")=='false') {
                    $widgetNodes.prop("contenteditable", false);
                }
                // 设置背景颜色
                _t.setReadOnlyBgColor($widgetNodes, flag);
                // 设置简洁模式
                _t.switchCssConciseModel($widgetNodes, flag);
                // 设置编辑状态（下拉框、时间组件等）
                _t.setEmrDocumentEditState($widgetNodes, flag);
                // 设置新文本框可编辑
                _t.setEmrNewTextBoxEditable($widgetNodes, flag); 
            }
        } else {
            alert('没有找到有效的文档内容');
        }
        if (flag) {
            $body.find('.cke_widget_wrapper .cke_image_resizer').addClass('cke_image_resizer_hide');
        } else {
            $body.find('.cke_widget_wrapper .cke_image_resizer').removeClass('cke_image_resizer_hide');
        }
        // 分页情况下，根据当前页第一份病历的只读状态设置页眉页脚的只读状态
        _t.setPageHeaderFooterReadOnly($body);
    },
    /**
     * 分页情况下，根据当前页第一份病历的只读状态设置页眉页脚的只读状态
     * @param {jQuery} $body 编辑器body元素
     */
    setPageHeaderFooterReadOnly: function ($body) {
        var _t = this;
        var $logicPages = $body.find('.hm-logic-page');
        if ($logicPages.length > 0) {
            $logicPages.each(function() {
                var $logicPage = $(this);
                // 找到当前页的第一份病历（在hm-page-content中查找）
                var $pageContent = $logicPage.find('.hm-page-content');
                var $firstWidget = $pageContent.find('[data-hm-widgetid]').first();
                if ($firstWidget.length > 0) {
                    // 获取第一份病历的只读状态
                    var firstWidgetReadonly = $firstWidget.attr('_readonly');
                    var isReadonly = firstWidgetReadonly === 'true';
                    
                    // 设置当前页页眉页脚的只读状态（在逻辑页范围内查找）
                    var $pageHeaders = $logicPage.find('.hm-page-header-group table[_paperheader="true"]');
                    var $pageFooters = $logicPage.find('.hm-page-footer-group table[_paperfooter="true"]');
                    
                    // 设置页眉只读状态
                    $pageHeaders.each(function() {
                        var $header = $(this);
                        $header.prop("contenteditable", !isReadonly);
                        // 设置简洁模式
                        _t.switchCssConciseModel($header, isReadonly);
                        _t.setEmrDocumentEditState($header, isReadonly);
                        _t.setEmrNewTextBoxEditable($header, isReadonly);
                    });
                    
                    // 设置页脚只读状态
                    $pageFooters.each(function() {
                        var $footer = $(this);
                        $footer.prop("contenteditable", !isReadonly);
                        // 设置简洁模式
                        _t.switchCssConciseModel($footer, isReadonly);
                        _t.setEmrDocumentEditState($footer, isReadonly);
                        _t.setEmrNewTextBoxEditable($footer, isReadonly);
                    });
                }
            });
        }
    },
    // 设置背景颜色
    setReadOnlyBgColor: function ($widgetNodes, flag) {
        if (flag) {
            // 分页状态下设置背景颜色
            if ($widgetNodes.find('.hm-page-content').length) {
                $widgetNodes.find('.hm-page-content').children().addClass('hm-readonly-bgcolor');
            } else {
                $widgetNodes.children().addClass('hm-readonly-bgcolor');
            }
        } else {
            // 非分页状态下取消背景颜色
            if ($widgetNodes.find('.hm-page-content').length) {
                $widgetNodes.find('.hm-page-content').children().removeClass('hm-readonly-bgcolor');
            } else {
                $widgetNodes.children().removeClass('hm-readonly-bgcolor');
            }
        }
    },
    // 设置简洁模式
    switchCssConciseModel: function ($widgetNodes, flag) {
        if (flag) {
            var features = '._printHide,._paragraphHide,.hide_class,' +
                '.new-textbox,[data-hm-node],[_placeholderText],ins,.cke_page_split_mark,.continuation-identifier';
            $widgetNodes.find(features).addClass('concise-model');
        } else {
            $widgetNodes.find('.concise-model').removeClass('concise-model');
        }
    },
    // 设置编辑状态
    setEmrDocumentEditState: function ($widgetNodes, flag) {
        var evtState = flag ? 'none' : 'auto';
        $widgetNodes.find('span[data-hm-node="timebox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-hm-node="dropbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-hm-node="checkbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-hm-node="radiobox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-hm-node="searchbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-hm-node="newtextbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('button[data-hm-id]').css('pointer-events', evtState);
    },
    // 设置新文本框可编辑
    setEmrNewTextBoxEditable: function ($widgetNodes, flag) {
        var editStr = flag ? 'false' : 'true';
        var _newTextBox = $widgetNodes.find('span[data-hm-node="newtextbox"]:not([_isdisabled="true"]):not([notallowwrite="true"])');
        var _textboxwidget = $widgetNodes.find('span[data-hm-node="textboxwidget"]');
        var _addMarkList = $widgetNodes.find('ins[class*="hm"]');
        if (_newTextBox.length > 0) {
            _newTextBox.find(".new-textbox-content").attr("contenteditable", editStr);
            //嵌套数据元会把内部所有外层新文本设置为可编辑导致聚焦，placeholder等都有问题
            //处理新数据元内部元素(span(除医学表达式外),font)contenteditable与外层不一致的情况
            var spans = _newTextBox.find(".new-textbox-content").find('span:not([data-hm-node="expressionbox"])');
            var fonts = _newTextBox.find(".new-textbox-content").find('font');
            if (spans.length > 0) {
                spans.attr("contenteditable", editStr);
            }
            if (fonts.length > 0) {
                fonts.attr("contenteditable", editStr);
            }
            //处理历史嵌套数据元外层contenteditable已被设置ture的病历
            var otherDatasource = _newTextBox.find('span[data-hm-node="newtextbox"]:not([contenteditable="false"])');
            otherDatasource.attr("contenteditable", false);
        }
        if (_addMarkList.length > 0) {
            _addMarkList.attr("contenteditable", editStr);
        }
        if (_textboxwidget.length > 0) {
            _textboxwidget.attr("contenteditable", editStr);
        }
    },
    /**
     * 设置数据元只读
     * @param {String} code 文档唯一编号
     * @param {Array} elementList 数据元code数组集合
     * @param {Boolean} flag  true:只读 false:可编辑
     */
    setElementReadOnly: function (code, elementList, flag) {
        var _t = this;
        var $body = $(_t.editor.document.getBody().$);
        var $widgetNodes = null;

        // 参数校验
        if (!Array.isArray(elementList) || elementList.length === 0) {
            console.warn('elementList 参数无效，必须是包含数据元code的数组');
            return;
        }

        // 根据code获取指定文档
        if (code) {
            $widgetNodes = $body.find('[data-hm-widgetid="' + code + '"]');
        } else {
            // 如果没有传入code，则对所有文档进行处理
            $widgetNodes = $body.find('[data-hm-widgetid]');
        }

        if (!$widgetNodes || $widgetNodes.length === 0) {
            console.warn('没有找到有效的文档内容');
            return;
        }

        // 遍历所有文档widget
        for (var i = 0; i < $widgetNodes.length; i++) {
            var $widget = $($widgetNodes[i]);

            // 遍历 elementList 中的每个数据元 code
            for (var j = 0; j < elementList.length; j++) {
                var elementCode = elementList[j];

                // 在文档中查找对应的数据元节点（通过data-hm-code属性，排除labelbox）
                var $elements = $widget.find('[data-hm-code="' + elementCode + '"]:not([data-hm-node="labelbox"])');

                // 如果找到了数据元节点，设置其只读状态
                if ($elements.length > 0) {
                    $elements.each(function () {
                        var $element = $(this);
                        _t.setElementReadOnlyState($element, flag);
                    });
                }
            }
        }
    },
    /**
     * 按数据元编码设置数据元 DOM 的内联样式（遍历所有病历内匹配节点，排除 labelbox）
     * @param {String} eleCode 数据元编码（与 data-hm-code 一致）
     * @param {Object} styles 样式对象，如 { color: 'red', fontWeight: 'bold' }，经 jQuery.fn.css 写入，合并进现有内联样式、同名覆盖
     * @returns {Boolean} 是否至少更新了一个节点
     */
    setElementStyle: function (eleCode, styles) {
        var _t = this;
        if (!eleCode || typeof eleCode !== 'string') {
            console.error('setElementStyle: eleCode 必须为非空字符串');
            return false;
        }
        if (styles === null || typeof styles !== 'object' || Array.isArray(styles)) {
            console.error('setElementStyle: styles 须为普通对象');
            return false;
        }
        if (!_t.editor || !_t.editor.document) {
            console.error('setElementStyle: 编辑器未就绪');
            return false;
        }
        var $body = $(_t.editor.document.getBody().$);
        var $widgetNodes = $body.find('[data-hm-widgetid]');
        if (!$widgetNodes.length) {
            console.warn('setElementStyle: 未找到病历文档节点');
            return false;
        }
        var found = false;
        for (var i = 0; i < $widgetNodes.length; i++) {
            var $widget = $($widgetNodes[i]);
            var $elements = $widget.find('[data-hm-code="' + eleCode + '"]:not([data-hm-node="labelbox"])');
            if ($elements.length) {
                found = true;
                $elements.each(function () {
                    $(this).css(styles);
                });
            }
        }
        if (!found) {
            console.warn('setElementStyle: 未找到 data-hm-code 为 "' + eleCode + '" 的数据元节点');
        }
        return found;
    },
    /**
     * 设置单个数据元元素的只读/可编辑状态
     * 流程：① 被禁用元素直接跳过 ② 根据 flag 增删简洁模式 class ③ 按 data-hm-node 类型设置 pointer-events 或 contenteditable。
     * 只读时用 pointer-events:none 或 contenteditable:false 禁止交互；可编辑时恢复为 auto/true。
     * @param {jQuery} $element 数据元元素（带 data-hm-node 的节点）
     * @param {Boolean} flag true=只读，false=可编辑
     */
    setElementReadOnlyState: function ($element, flag) {
        var nodeType = $element.attr('data-hm-node');
        var evtState = flag ? 'none' : 'auto';   // pointer-events：只读禁点击，可编辑恢复
        var editStr = flag ? 'false' : 'true';  // contenteditable：只读不可编辑，可编辑可输入

        // 被禁用（_isdisabled=true）的元素不改变只读状态，直接返回
        if ($element.attr('_isdisabled') === 'true') {
            return;
        }

        // 只读时进入简洁模式：当前元素及指定特征子节点加 concise-model；可编辑时移除该类
        if (flag) {
            var features = '._printHide,._paragraphHide,.hide_class,' +
                '.new-textbox,[data-hm-node],[_placeholderText],ins,.cke_page_split_mark,.continuation-identifier';
            $element.addClass('concise-model');
            $element.find(features).addClass('concise-model');
        } else {
            $element.removeClass('concise-model');
            $element.find('.concise-model').removeClass('concise-model');
        }

        // 按 data-hm-node 类型分别设置：控件类用 pointer-events，文本类用 contenteditable
        switch (nodeType) {
            case 'timebox':
            case 'dropbox':
            case 'checkbox':
            case 'radiobox':
            case 'searchbox':
                // 时间/下拉/复选/单选/搜索：仅用 pointer-events 控制点击，不改 contenteditable
                $element.css('pointer-events', evtState);
                break;
            case 'newtextbox':
                // 新文本框：设置自身 pointer-events，并对 .new-textbox-content 及内部 span/font 设置 contenteditable（排除 expressionbox）
                $element.css('pointer-events', evtState);
                var $content = $element.find(".new-textbox-content");
                if ($content.length > 0) {
                    $content.attr("contenteditable", editStr);
                    var spans = $content.find('span:not([data-hm-node="expressionbox"])');
                    var fonts = $content.find('font');
                    if (spans.length > 0) {
                        spans.attr("contenteditable", editStr);
                    }
                    if (fonts.length > 0) {
                        fonts.attr("contenteditable", editStr);
                    }
                }
                break;
            case 'textboxwidget':
                // 文本控件：直接设置 contenteditable
                $element.attr("contenteditable", editStr);
                break;
            case 'cellbox':
                // 表格单元格：直接设置 contenteditable
                $element.attr("contenteditable", editStr);
                break;
            case 'expressionbox':
                // 医学表达式框：仅用 pointer-events，不改为 contenteditable
                $element.css('pointer-events', evtState);
                break;
            default:
                // 其他类型：若已有 contenteditable 属性则改之，否则用 pointer-events
                if ($element.attr('contenteditable') !== undefined) {
                    $element.attr("contenteditable", editStr);
                } else {
                    $element.css('pointer-events', evtState);
                }
                break;
        }
    },

    /**
     * 解析行号参数，支持多种格式：
     * - 单个数字：5
     * - 数字数组：[1, 2, 3]
     * - 区间字符串："1-5" 表示 1,2,3,4,5
     * - 混合字符串："1-5,8,10-12" 表示 1,2,3,4,5,8,10,11,12
     * @param {Number|Array|String} rowIndex 行索引参数
     * @returns {Array} 解析后的行索引数组
     */
    _parseRowIndex: function (rowIndex) {
        var result = [];

        // 如果是数字，直接返回数组
        if (typeof rowIndex === 'number') {
            return [rowIndex];
        }

        // 如果是数组，直接返回
        if (Array.isArray(rowIndex)) {
            return rowIndex;
        }

        // 如果是字符串，解析区间格式
        if (typeof rowIndex === 'string') {
            var parts = rowIndex.split(',');
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i].trim();
                if (part === '') continue;

                // 检查是否是区间格式（如 "1-5"）
                if (part.indexOf('-') > 0) {
                    var range = part.split('-');
                    if (range.length === 2) {
                        var start = parseInt(range[0].trim(), 10);
                        var end = parseInt(range[1].trim(), 10);
                        if (!isNaN(start) && !isNaN(end) && start <= end) {
                            for (var j = start; j <= end; j++) {
                                if (result.indexOf(j) === -1) {
                                    result.push(j);
                                }
                            }
                        }
                    }
                } else {
                    // 单个数字
                    var num = parseInt(part, 10);
                    if (!isNaN(num) && result.indexOf(num) === -1) {
                        result.push(num);
                    }
                }
            }
        }

        return result;
    },

    /**
     * 设置列表类表格指定行的只读状态
     * @param {String} tableCode 表格编码（data-hm-table-code属性值）
     * @param {Number|Array|String} rowIndex 行索引，支持：数字、数组、区间字符串如"1-5,8,10-12"
     * @param {Boolean} flag true:只读 false:可编辑
     */
    tableRowReadonly: function (tableCode, rowIndex, flag) {
        this._setTableRowPermission(tableCode, rowIndex, 'readonly', flag);
    },

    /**
     * 设置列表类表格指定行的删除权限
     * @param {String} tableCode 表格编码（data-hm-table-code属性值）
     * @param {Number|Array|String} rowIndex 行索引，支持：数字、数组、区间字符串如"1-5,8,10-12"
     * @param {Boolean} flag true:可删除 false:不可删除
     */
    tableRowDeletable: function (tableCode, rowIndex, flag) {
        this._setTableRowPermission(tableCode, rowIndex, 'deletable', flag);
    },

    /**
     * 设置列表类表格指定行的新增权限
     * @param {String} tableCode 表格编码（data-hm-table-code属性值）
     * @param {Number|Array|String} rowIndex 行索引，支持：数字、数组、区间字符串如"1-5,8,10-12"
     * @param {Boolean} flag true:可新增 false:不可新增
     */
    tableRowAddable: function (tableCode, rowIndex, flag) {
        this._setTableRowPermission(tableCode, rowIndex, 'addable', flag);
    },

    /**
     * 通用的表格行权限设置方法
     * @param {String} tableCode 表格编码
     * @param {Number|Array|String} rowIndex 行索引，支持：数字、数组、区间字符串
     * @param {String} permissionType 权限类型：'readonly'|'deletable'|'addable'
     * @param {Boolean} flag 权限值
     */
    _setTableRowPermission: function (tableCode, rowIndex, permissionType, flag) {
        var _t = this;
        var $body = $(_t.editor.document.getBody().$);

        if (!tableCode) {
            console.warn('tableRow' + permissionType + ': tableCode 参数不能为空');
            return;
        }

        // 查找列表类表格：优先按 data-hm-table-code，其次按 data-hm-datatable
        var $table = $body.find('table[data-hm-table-code="' + tableCode + '"][data-hm-table-type="list"]');
        if ($table.length === 0) {
            $table = $body.find('table[data-hm-datatable="' + tableCode + '"][data-hm-table-type="list"]');
        }

        if ($table.length === 0) {
            console.warn('tableRow' + permissionType + ': 未找到表格编码为 ' + tableCode + ' 的列表类表格');
            return;
        }

        var $tbody = $table.find('tbody');
        if ($tbody.length === 0) {
            console.warn('tableRow' + permissionType + ': 表格中未找到tbody');
            return;
        }

        // evaluate-type：col=竖向（一行一条记录），row=横向（一列一条记录）；解析行索引后按类型分发
        var evaluateType = $table.attr('evaluate-type') || 'col';
        var rowIndexArray = _t._parseRowIndex(rowIndex);

        if (evaluateType === 'col') {
            _t._setColTableRowsPermission($tbody, rowIndexArray, permissionType, flag);
        } else if (evaluateType === 'row') {
            _t._setRowTableColumnsPermission($tbody, rowIndexArray, permissionType, flag);
        }
    },

    /**
     * 设置竖向表格（col模式）指定行的权限
     * @param {jQuery} $tbody 表格体元素
     * @param {Array} rowIndexArray 行索引数组
     * @param {String} permissionType 权限类型
     * @param {Boolean} flag 权限值
     */
    _setColTableRowsPermission: function ($tbody, rowIndexArray, permissionType, flag) {
        var _t = this;
        var $rows = $tbody.find('tr');

        rowIndexArray.forEach(function (rowIdx) {
            if (rowIdx < 0 || rowIdx >= $rows.length) {
                console.warn('tableRow' + permissionType + ': 行索引 ' + rowIdx + ' 超出范围');
                return;
            }

            var $row = $rows.eq(rowIdx);
            $row.attr('_row_' + permissionType, flag ? 'true' : 'false');

            // 只读权限需要额外处理单元格编辑状态和简洁模式
            if (permissionType === 'readonly') {
                $row.find('td').each(function () {
                    var $cell = $(this);
                    if (flag) {
                        $cell.attr('contenteditable', 'false');
                    } else {
                        $cell.removeAttr('contenteditable');
                    }
                    _t._setCellContentReadonly($cell, flag);
                });
                _t._setConciseModel($row, flag);
            }
        });
    },

    /**
     * 设置横向表格（row模式）指定列的权限
     * @param {jQuery} $tbody 表格体元素
     * @param {Array} columnIndexArray 列索引数组
     * @param {String} permissionType 权限类型
     * @param {Boolean} flag 权限值
     */
    _setRowTableColumnsPermission: function ($tbody, columnIndexArray, permissionType, flag) {
        var _t = this;
        var $rows = $tbody.find('tr');

        columnIndexArray.forEach(function (colIdx) {
            $rows.each(function () {
                var $row = $(this);
                var $dataCells = $row.find('td:not(.hm-table-horizontal-header)');
                
                if (colIdx < 0 || colIdx >= $dataCells.length) {
                    return;
                }

                var $cell = $dataCells.eq(colIdx);
                $cell.attr('_cell_' + permissionType, flag ? 'true' : 'false');

                // 只读权限需要额外处理单元格编辑状态和简洁模式
                if (permissionType === 'readonly') {
                    if (flag) {
                        $cell.attr('contenteditable', 'false');
                    } else {
                        $cell.removeAttr('contenteditable');
                    }
                    _t._setCellContentReadonly($cell, flag);
                    _t._setConciseModel($cell, flag);
                }
            });
        });
    },

    /**
     * 设置简洁模式
     * @param {jQuery} $element 目标元素（行或单元格）
     * @param {Boolean} flag true:启用简洁模式 false:关闭简洁模式
     */
    _setConciseModel: function ($element, flag) {
        if (flag) {
            var features = '._printHide,._paragraphHide,.hide_class,' +
                '.new-textbox,[data-hm-node],[_placeholderText],ins,.cke_page_split_mark,.continuation-identifier';
            $element.find(features).addClass('concise-model');
        } else {
            $element.find('.concise-model').removeClass('concise-model');
        }
    },

    /**
     * 设置单元格内容的只读状态
     * @param {jQuery} $cell 单元格元素
     * @param {Boolean} flag true:只读 false:可编辑
     */
    _setCellContentReadonly: function ($cell, flag) {
        var evtState = flag ? 'none' : 'auto';
        var editStr = flag ? 'false' : 'true';

        // 设置各类数据元的编辑状态
        var nodeTypes = ['timebox', 'dropbox', 'checkbox', 'radiobox', 'searchbox', 'newtextbox'];
        nodeTypes.forEach(function(nodeType) {
            $cell.find('span[data-hm-node="' + nodeType + '"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        });
        $cell.find('button[data-hm-id]').css('pointer-events', evtState);

        // 设置新文本框的编辑状态
        var _newTextBox = $cell.find('span[data-hm-node="newtextbox"]:not([_isdisabled="true"]):not([notallowwrite="true"])');
        if (_newTextBox.length > 0) {
            _newTextBox.find(".new-textbox-content").attr("contenteditable", editStr);
            _newTextBox.find(".new-textbox-content").find('span:not([data-hm-node="expressionbox"]), font').attr("contenteditable", editStr);
        }

        // 设置文本框组件的编辑状态
        $cell.find('span[data-hm-node="textboxwidget"]').attr("contenteditable", editStr);
    },

    /**
     * 检查表格行是否为只读状态
     * @param {jQuery} $row 表格行元素
     * @returns {Boolean} true:只读 false:可编辑
     */
    isTableRowReadonly: function ($row) {
        return $row && $row.length && $row.attr('_row_readonly') === 'true';
    },

    /**
     * 检查表格单元格是否为只读状态（用于横向表格）
     * @param {jQuery} $cell 表格单元格元素
     * @returns {Boolean} true:只读 false:可编辑
     */
    isTableCellReadonly: function ($cell) {
        return $cell && $cell.length && $cell.attr('_cell_readonly') === 'true';
    },

    /**
     * 检查表格行是否可删除
     * @param {jQuery} $row 表格行元素
     * @returns {Boolean} true:可删除 false:不可删除
     */
    isTableRowDeletable: function ($row) {
        return !$row || !$row.length || $row.attr('_row_deletable') !== 'false';
    },

    /**
     * 检查表格行是否可新增
     * @param {jQuery} $row 表格行元素
     * @returns {Boolean} true:可新增 false:不可新增
     */
    isTableRowAddable: function ($row) {
        return !$row || !$row.length || $row.attr('_row_addable') !== 'false';
    }
});