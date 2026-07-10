/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

(function () {
    var defaultToPixel = CKEDITOR.tools.cssLength;

    var commitValue = function (data) {
        var id = this.id;
        if (!data.info)
            data.info = {};
        data.info[id] = this.getValue();
    };

    function tableColumns(table) {
        var cols = 0,
            maxCols = 0;
        for (var i = 0, row, rows = table.$.rows.length; i < rows; i++) {
            row = table.$.rows[i], cols = 0;
            for (var j = 0, cell, cells = row.cells.length; j < cells; j++) {
                cell = row.cells[j];
                cols += cell.colSpan;
            }

            cols > maxCols && (maxCols = cols);
        }

        return maxCols;
    }

    function syncHmLineBorderCheckbox(dialog) {
        var whiteSpaceEl = dialog.getContentElement('info', 'white-space');
        var lineBorderEl = dialog.getContentElement('info', 'hm-line-border');
        if (!whiteSpaceEl || !lineBorderEl) {
            return;
        }
        if (whiteSpaceEl.getValue() == '1') {
            lineBorderEl.enable();
        } else {
            lineBorderEl.disable();
            lineBorderEl.setValue(false);
        }
    }

    function cleanHmLinedCellDom($table) {
        $table.find('td, th').each(function () {
            var $cell = $(this);
            $cell.find('.hm-line-sep').remove();
            var $wrapper = $cell.children('.hm-lined-content');
            if ($wrapper.length) {
                $wrapper.first().replaceWith($wrapper.first().contents());
            }
            $cell.removeClass('hm-lined-wrap');
            if (typeof applyHmLinedCellLineStyle === 'function') {
                applyHmLinedCellLineStyle($cell, 1);
            }
        });
    }

    function refreshHmLinedCellFromDialog(dialog, selectedTable, editor) {
        var whiteSpaceEl = dialog.getContentElement('info', 'white-space');
        var lineBorderEl = dialog.getContentElement('info', 'hm-line-border');
        var wrapMode = whiteSpaceEl && whiteSpaceEl.getValue() == '1';
        var enabled = wrapMode && lineBorderEl && lineBorderEl.getValue();

        if (enabled) {
            selectedTable.addClass('hm-lined-cell');
            if (editor && typeof updateHmLinedCellWrap === 'function') {
                updateHmLinedCellWrap($(editor.document.getBody().$));
            }
        } else {
            selectedTable.removeClass('hm-lined-cell');
            cleanHmLinedCellDom($(selectedTable.$));
        }
    }

    // Whole-positive-integer validator.
    function validatorNum(msg) {
        return function () {
            var value = this.getValue(),
                pass = !!(CKEDITOR.dialog.validate.integer()(value) && value > 0);

            if (!pass) {
                alert(msg); // jshint ignore:line
                this.select();
            }

            return pass;
        };
    }

    // Table name required validator.
    function validatorTableName(msg) {
        return function () {
            var value = this.getValue();
            
            // 获取对话框和表格类型，添加安全检查
            var dialog = this.getDialog ? this.getDialog() : null;
            var tableType = '';
            
            if (dialog && dialog.getContentElement) {
                var tableTypeElement = dialog.getContentElement('info', 'hm-table-type');
                if (tableTypeElement && tableTypeElement.getValue) {
                    try {
                        tableType = tableTypeElement.getValue() || '';
                    } catch (e) {
                        tableType = '';
                    }
                }
            }
            
            // 如果是非列表表格（row），则不需要验证表格名称
            if (tableType === 'row') {
                return true;
            }
            
            // 只有列表类表格（list）才进行必填验证
            if (tableType === 'list') {
                var pass = !!(value && value.trim().length > 0);
                if (!pass) {
                    alert(msg); // jshint ignore:line
                    this.select();
                    return false;
                }
                return true;
            }
            
            // 其他情况（未选择表格类型等）不强制要求必填
            return true;
        };
    }

    function tableDialog(editor, command) {
        //var groupOptions = [['',''],['aaaaaac','aaaaaaan']];
        var makeElement = function (name) {
            return new CKEDITOR.dom.element(name, editor.document);
        };

        var editable = editor.editable();

        var dialogadvtab = editor.plugins.dialogadvtab;

        return {
            title: editor.lang.table.title,
            minWidth: 600,
            minHeight: CKEDITOR.env.ie ? 310 : 280,

            onLoad: function () {
                var dialog = this;

                var styles = dialog.getContentElement('advanced', 'advStyles');

                if (styles) {
                    styles.on('change', function () {
                        // Synchronize width value.
                        var width = this.getStyle('width', ''),
                            txtWidth = dialog.getContentElement('info', 'txtWidth');

                        txtWidth && txtWidth.setValue(width, true);

                        // Synchronize height value.
                        var height = this.getStyle('height', ''),
                            txtHeight = dialog.getContentElement('info', 'txtHeight');

                        txtHeight && txtHeight.setValue(height, true);
                    });
                }

                editor.on('setCopyTableHeader', function (evt) {
                    if (evt.data.value) {
                        evt.data.table.setAttribute('_hm_copy_table_header', evt.data.value);
                    } else {
                        evt.data.table.removeAttribute('_hm_copy_table_header');
                    }
                });

                // 默认隐藏表格方向和表格标题行容器
                setTimeout(function() {
                    var container = dialog.getContentElement('info', 'table-direction-headers-container');
                    if (container) {
                        container.getElement().getParent().setStyle('display', 'none');
                    }
                }, 0);
            },

            onShow: function () {
                // Detect if there's a selected table.
                var selection = editor.getSelection(),
                    ranges = selection.getRanges(),
                    table;

                var rowsInput = this.getContentElement('info', 'txtRows'),
                    colsInput = this.getContentElement('info', 'txtCols'),
                    widthInput = this.getContentElement('info', 'txtWidth'),
                    heightInput = this.getContentElement('info', 'txtHeight');

                if (command == 'tableProperties') {
                    var selected = selection.getSelectedElement();
                    if (selected && selected.is('table'))
                        table = selected;
                    else if (ranges.length > 0) {
                        // Webkit could report the following range on cell selection (http://dev.ckeditor.com/ticket/4948):
                        // <table><tr><td>[&nbsp;</td></tr></table>]
                        if (CKEDITOR.env.webkit)
                            ranges[0].shrink(CKEDITOR.NODE_ELEMENT);

                        table = editor.elementPath(ranges[0].getCommonAncestor(true)).contains('table', 1);
                    }

                    // Save a reference to the selected table, and push a new set of default values.
                    this._.selectedElement = table;
                }

                // Enable or disable the row, cols, width fields.
                if (table) {
                    this.setupContent(table);
                    rowsInput && rowsInput.disable();
                    colsInput && colsInput.disable();
                } else {
                    rowsInput && rowsInput.enable();
                    colsInput && colsInput.enable();
                }

                // Call the onChange method for the widht and height fields so
                // they get reflected into the Advanced tab.
                widthInput && widthInput.onChange();
                heightInput && heightInput.onChange();

                // 确保表格类型字段的onChange事件被触发，以正确控制字段显示
                var tableTypeElement = this.getContentElement('info', 'hm-table-type');
                if (tableTypeElement) {
                    setTimeout(function() {
                        tableTypeElement.onChange();
                    }, 10);
                }

                var whiteSpaceElement = this.getContentElement('info', 'white-space');
                if (whiteSpaceElement) {
                    setTimeout(function () {
                        syncHmLineBorderCheckbox(whiteSpaceElement.getDialog());
                    }, 10);
                }
                
                // 在修改已有表格属性时禁用表格方向选择
                if (command == 'tableProperties' && table) {
                    var evaluateTypeSelect = this.getContentElement('info', 'evaluate-type');
                    if (evaluateTypeSelect) {
                        evaluateTypeSelect.disable();
                    }
                    var dataHeadersSelect = this.getContentElement('info', 'dataHeaders');
                    if (dataHeadersSelect) {
                        dataHeadersSelect.disable();
                    }
                }
            },
            onOk: function () {
                var selection = editor.getSelection(),
                    bms = this._.selectedElement && selection.createBookmarks();

                var table = this._.selectedElement || makeElement('table'),
                    data = {};

                this.commitContent(data, table);

                var row;
                if (data.info) {
                    var info = data.info;

                    // Generate the rows and cols.
                    if (!this._.selectedElement) {
                        var tbody = table.append(makeElement('tbody')),
                            rows = parseInt(info.txtRows, 10) || 0,
                            cols = parseInt(info.txtCols, 10) || 0,
                            evaluateType = info['evaluate-type'] || 'col';

                        for (var i = 0; i < rows; i++) {
                            row = tbody.append(makeElement('tr'));
                            for (var j = 0; j < cols; j++) {
                                var cell = row.append(makeElement('td'));
                                // 强制插入 <br>，避免 needsBrFiller 被全局关闭时（如在 span 内回车后）单元格高度为 0
                                cell.appendBogus(true);
                            }
                        }
                    }

                    // Modify the table headers. Depends on having rows and cols generated
                    // correctly so it can't be done in commit functions.
                    var headers = info.dataHeaders;
                    var evaluateType = info['evaluate-type'] || 'col'; 
                    // 修改表格标题行 竖向表格存在标题行
                    if (evaluateType === 'col' && (headers == '' || (headers != '' && parseInt(headers) + 1 <= table.$.rows.length))) {
                        var $table = $(table.$);
                        var $tbody = $table.find('tbody');
                        var $thead = $table.find('thead');
                        
                        // 先将 thead 中的所有 th 转换为 td，避免多余的 th 留在 tbody 中
                        if ($thead.length > 0) {
                            $thead.find('th').each(function () {
                                $(this).replaceWith($(this).prop('outerHTML').replace(/th/g, 'td'));
                            });
                        }
                        
                        $tbody.prepend($thead.children());
                        $thead.remove();

                        if (headers != '') {
                            var $trs = $table.find('tbody').children();
                            var $newHeader = $('<thead></thead>');
                            for (var h = 0; h < headers; h++) {
                                $newHeader.append($trs[h]);
                            }
                            $table.prepend($newHeader);

                            $table.find('thead td').each(function () {
                                $(this).replaceWith($(this).prop('outerHTML').replace(/td/g, 'th'))
                            });
                        }
                    }else if(evaluateType === 'row' && (headers == '' || (headers != '' && parseInt(headers) + 1 <= table.$.rows[0].cells.length))) {
                        // 横向表格存在标题行
                        var $table = $(table.$);
                        var $trs = $table.find('tbody').children();
                        
                        // 先移除所有行的 hm-table-horizontal-header 类，避免从多行减少到少行时残留多余的类
                        $trs.each(function(){
                            $(this).children().removeClass('hm-table-horizontal-header');
                        });
                        
                        // 如果 headers 不为空，给前 headers 列添加 hm-table-horizontal-header 类
                        if(headers != ''){
                            $trs.each(function(){
                                for(var h = 0; h < headers; h++){
                                    $(this).children().eq(h).addClass('hm-table-horizontal-header');
                                }
                            });
                        }
                    }
                    // Should we make all first cells in a row TH?
                    if (!this.hasColumnHeaders && (headers == 'col' || headers == 'both')) {
                        for (row = 0; row < table.$.rows.length; row++) {
                            newCell = new CKEDITOR.dom.element(table.$.rows[row].cells[0]);
                            newCell.renameNode('th');
                            newCell.setAttribute('scope', 'row');
                        }
                    }

                    // Should we make all first TH-cells in a row make TD? If 'yes' we do it the other way round :-)
                    if ((this.hasColumnHeaders) && !(headers == 'col' || headers == 'both')) {
                        for (i = 0; i < table.$.rows.length; i++) {
                            row = new CKEDITOR.dom.element(table.$.rows[i]);
                            if (row.getParent().getName() == 'tbody') {
                                newCell = new CKEDITOR.dom.element(row.$.cells[0]);
                                newCell.renameNode('td');
                                newCell.removeAttribute('scope');
                            }
                        }
                    }

                    // Set the width and height.
                    info.txtHeight ? table.setStyle('height', info.txtHeight) : table.removeStyle('height');
                    info.txtWidth ? table.setStyle('width', info.txtWidth) : table.removeStyle('width');

                    if (!table.getAttribute('style'))
                        table.removeAttribute('style');
                }

                // Insert the table element if we're creating one.
                if (!this._.selectedElement) {
                    table.setAttribute('data-hm-table', 'true');
                    // 表格ID, 用于被分页之后识别表格
                    table.setAttribute('hm-table-id', CKEDITOR.tools.getUniqueId());
                    //表格设置单行溢出截断的，表格设置为非自适应
                    if (table.hasClass('table3')) {
                        table.setStyle('table-layout', 'fixed');
                    } else {
                        table.setStyle('table-layout', 'auto');
                    }
                    editor.insertElement(table);

                    // 表格格子宽度 - colgroup
                    var colWidth = 100 / cols + '%';
                    var colgroup = makeElement('colgroup');
                    for (j = 0; j < cols; j++) {
                        var col = makeElement('col');
                        col.setStyle('width', colWidth);
                        colgroup.$.appendChild(col.$);
                    }
                    colgroup.insertBefore(table.getFirst());

                    // (wk 打印时) ie 不认 colgroup, 故在加 colgroup 的同时把表格宽度也加进来
                    if(evaluateType === 'col'){ // 竖向表格
                        for (i = 0; i < tbody.$.rows.length; i++) {
                            row = tbody.$.rows[i];
                            for (j = 0; j < cols; j++) {
                                row.cells[j].style.width = colWidth;
                            }
                        }
                    }else{ // 横向表格
                        
                    }

                    // Override the default cursor position after insertElement to place
                    // cursor inside the first cell (http://dev.ckeditor.com/ticket/7959), IE needs a while.
                    setTimeout(function () {
                        var firstCell = new CKEDITOR.dom.element(table.$.rows[0].cells[0]);
                        var range = editor.createRange();
                        range.moveToPosition(firstCell, CKEDITOR.POSITION_AFTER_START);
                        range.select();
                    }, 0);
                }
                // Properly restore the selection, (http://dev.ckeditor.com/ticket/4822) but don't break
                // because of this, e.g. updated table caption.
                else {
                    try {
                        selection.selectBookmarks(bms);
                    } catch (er) {}
                }
                editor.fire('group-table-op', {
                    type: 'wrap',
                    table: table.$,
                    name: data['group-table-name']
                });
            },
            contents: [{
                id: 'info',
                label: editor.lang.table.title,
                elements: [{
                        type: 'html',
                        html: '<style>' +
                            '.cke_dialog_contents_body { padding:0 20px !important; }' +
                            '.cke_dialog_ui_labeled_label {float:left;min-width:62px;text-align:right;line-height:28px;margin-right:5px;}' +
                            '.cke_dialog_ui_input_select { width: 200px !important; min-width: 200px !important; }' +
                            '.cke_dialog_ui_input_select select { width: 200px  !important; box-sizing: border-box !important; }' +
                            '.cke_dialog_ui_input_select select:focus { width: 200px !important;  }' +
                            '.select-narrow .cke_dialog_ui_input_select { width: 200px !important; }' +
                            '.select-wide .cke_dialog_ui_input_select { width: 200px !important; }' +
                            '.cke_dialog_ui_checkbox { margin-left:0px; }' + 
                            '</style>'
                    },
                    {
                        type: 'hbox',
                        children: [{
                                type: 'text',
                                id: 'txtRows',
                                'default': 3,
                                label: '表格' + editor.lang.table.rows,
                                required: true,
                                controlStyle: 'width:200px',
                                validate: validatorNum(editor.lang.table.invalidRows),
                                setup: function (selectedElement) {
                                    this.setValue(selectedElement.$.rows.length);
                                },
                                commit: commitValue
                            },
                            {
                                type: 'text',
                                id: 'txtCols',
                                'default': 2,
                                label: '表格' + editor.lang.table.columns,
                                required: true,
                                controlStyle: 'width:200px',
                                validate: validatorNum(editor.lang.table.invalidCols),
                                setup: function (selectedTable) {
                                    this.setValue(tableColumns(selectedTable));
                                },
                                commit: commitValue
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        children: [                            {
                                id: 'cmbAlign',
                                type: 'select',
                                requiredContent: 'table',
                                'default': '',
                                label: '表格位置',
                                className: 'select-narrow',
                                items: [
                                    [editor.lang.common.notSet, ''],
                                    [editor.lang.common.alignLeft, 'left'],
                                    [editor.lang.common.alignCenter, 'center'],
                                    [editor.lang.common.alignRight, 'right']
                                ],
                                setup: function (selectedTable) {
                                    // 检查CSS类来确定当前对齐方式
                                    var currentAlign = '';
                                    if (selectedTable.hasClass('hm-table-align-left')) {
                                        currentAlign = 'left';
                                    } else if (selectedTable.hasClass('hm-table-align-center')) {
                                        currentAlign = 'center';
                                    } else if (selectedTable.hasClass('hm-table-align-right')) {
                                        currentAlign = 'right';
                                    } else {
                                        // 兼容旧的align属性
                                        currentAlign = selectedTable.getAttribute('align') || '';
                                    }
                                    this.setValue(currentAlign);
                                },
                                commit: function (data, selectedTable) {
                                    // 移除旧的align属性和所有对齐CSS类
                                    selectedTable.removeAttribute('align');
                                    selectedTable.removeClass('hm-table-align-left');
                                    selectedTable.removeClass('hm-table-align-center');
                                    selectedTable.removeClass('hm-table-align-right');
                                    
                                    // 根据选择添加对应的CSS类
                                    var alignValue = this.getValue();
                                    if (alignValue) {
                                        selectedTable.addClass('hm-table-align-' + alignValue);
                                    }
                                }
                            },
                            {
                                type: 'text',
                                id: 'txtWidth',
                                requiredContent: 'table{width}',
                                controlStyle: 'width:200px',
                                label: '表格' + editor.lang.common.width,
                                title: editor.lang.common.cssLengthTooltip,
                                // Smarter default table width. (http://dev.ckeditor.com/ticket/9600)
                                'default': '100%',
                                getValue: defaultToPixel,
                                validate: CKEDITOR.dialog.validate.cssLength(editor.lang.common.invalidCssLength.replace('%1', editor.lang.common.width)),
                                onChange: function () {
                                    var styles = this.getDialog().getContentElement('advanced', 'advStyles');
                                    styles && styles.updateStyle('width', this.getValue());
                                },
                                setup: function (selectedTable) {
                                    var val = selectedTable.getStyle('width');
                                    this.setValue(val);
                                },
                                commit: commitValue
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        children: [{
                                id: 'hm-table-type',
                                type: 'select',
                                label: '表格类型', // 评估单表格类型
                                className: 'select-narrow',
                                'default': 'row',
                                items: [
                                    ['非列表表格', 'row'],
                                    ['列表类表格', 'list']
                                ],
                                setup: function (selectedTable) {
                                    var t = $(selectedTable).attr('data-hm-table-type') || '';
                                    this.setValue(t);
                                    // 延迟执行onChange，确保对话框完全加载后再控制字段显示
                                    var self = this;
                                    setTimeout(function() {
                                        self.onChange();
                                    }, 10);
                                },
                                onChange: function() {
                                    var dialog = this.getDialog();
                                    var tableType = this.getValue();
                                    var container = dialog.getContentElement('info', 'table-direction-headers-container');
                                    var dataHeadersSelect = dialog.getContentElement('info', 'dataHeaders');
                                    var evaluateTypeSelect = dialog.getContentElement('info', 'evaluate-type');
                                    
                                    if (tableType === 'row') {
                                        // 非列表表格：隐藏表格方向和表格标题行
                                        if (container) {
                                            container.getElement().getParent().setStyle('display', 'none');
                                        }
                                    } else if (tableType === 'list') {
                                        // 列表类表格：显示表格方向和表格标题行
                                        if (container) {
                                            container.getElement().getParent().setStyle('display', '');
                                        }
                                        // 根据表格方向控制表格标题行的启用/禁用状态
                                        if (evaluateTypeSelect && dataHeadersSelect) {
                                            // 创建表格时，无论竖向还是横向，标题行都可以修改
                                            dataHeadersSelect.enable();
                                        }
                                    } else {
                                        // 未选择：隐藏表格方向和表格标题行
                                        if (container) {
                                            container.getElement().getParent().setStyle('display', 'none');
                                        }
                                    }
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        $(selectedTable.$).attr('data-hm-table-type', this.getValue());
                                    } else {
                                        $(selectedTable.$).removeAttr('data-hm-table-type');
                                    }
                                }
                            },{
                                id: 'table-dataTable',
                                type: 'text',
                                controlStyle: 'width:200px',
                                requiredContent: 'table[align]',
                                label: '表格名称', // 数据表单_名称
                                required: false,
                                validate: validatorTableName('表格名称不能为空，请输入表格名称。'),
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.getAttribute('data-hm-dataTable') || '');
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        selectedTable.setAttribute('data-hm-dataTable', this.getValue());
                                        selectedTable.setAttribute('data-hm-table-code', 'TABLE' + '_' + this.getValue()); 
                                    } else {
                                        selectedTable.removeAttribute('data-hm-dataTable');
                                        selectedTable.removeAttribute('data-hm-table-code');
                                    }
                                }
                            }
                            // {
                            // 	id: 'table-cascade',
                            // 	type: 'text',
                            // 	controlStyle: 'width:200px',
                            // 	requiredContent: 'table[align]',
                            // 	label: '级联选项', // 级联(数据元_选项)
                            // 	setup: function( selectedTable ) {
                            // 		this.setValue( selectedTable.getAttribute( '_cascade' ) || '' );
                            // 	},
                            // 	commit: function( data, selectedTable ) {
                            // 		if ( this.getValue() )
                            // 			selectedTable.setAttribute( '_cascade',this.getValue() );
                            // 		else
                            // 			selectedTable.removeAttribute( '_cascade');
                            // 	}
                            // }
                        ]
                    },
                    {
                        type: 'hbox',
                        id: 'table-direction-headers-container',
                        children: [{
                                id: 'evaluate-type',
                                type: 'select',
                                label: '表格方向', // 评估单表格类型
                                className: 'select-narrow',
                                'default': 'col',
                                items: [
                                    ['竖向', 'col'],
                                    ['横向', 'row']
                                ],
                                setup: function (selectedTable) {
                                    var t = $(selectedTable).attr('evaluate-type') || '';
                                    this.setValue(t);
                                },
                                onChange: function() {
                                    var dialog = this.getDialog();
                                    var tableTypeSelect = dialog.getContentElement('info', 'hm-table-type');
                                    var dataHeadersSelect = dialog.getContentElement('info', 'dataHeaders');
                                    
                                    // 只有当表格类型为列表类表格时，才控制标题行的启用/禁用
                                    if (tableTypeSelect && dataHeadersSelect) {
                                        var tableType = tableTypeSelect.getValue();
                                        if (tableType === 'list') {
                                            // 创建表格时，无论竖向还是横向，标题行都可以修改
                                            dataHeadersSelect.enable();
                                        }
                                    }
                                },
                                commit: function (data, selectedTable) {
                                    var value = this.getValue();
                                    if (value) {
                                        $(selectedTable.$).attr('evaluate-type', value);
                                    } else {
                                        $(selectedTable.$).removeAttr('evaluate-type');
                                    }
                                    // 同时提交到data.info中，供表格创建时使用
                                    if (!data.info) data.info = {};
                                    data.info['evaluate-type'] = value;
                                }
                            },{
                                type: 'select',
                                id: 'dataHeaders',
                                requiredContent: 'th',
                                'default': '',
                                label: '表格标题行', //数据表单_标题行
                                items: [
                                    ['无', ''],
                                    ['第一行', '1'],
                                    ['前两行', '2'],
                                    ['前三行', '3'],
                                    ['前四行', '4']
                                ],
                                setup: function (selectedTable) {
                                    // Fill in the headers field.
                                    var dialog = this.getDialog();

                                    var $table = $(selectedTable.$);
                                    var thCount = 0;
                                    
                                    // 获取表格方向
                                    var evaluateType = $(selectedTable.$).attr('evaluate-type') || 'col';
                                    
                                    if (evaluateType === 'col') {
                                        // 竖向表格：计算thead中tr的数量
                                        thCount = $table.find('thead tr').length;
                                    } else if (evaluateType === 'row') {
                                        // 横向表格：计算前几列有hm-table-horizontal-header类
                                        var $firstRow = $table.find('tbody tr').first();
                                        if ($firstRow.length > 0) {
                                            var cols = $firstRow.children().length;
                                            for (var i = 0; i < cols; i++) {
                                                var $cell = $firstRow.children().eq(i);
                                                // 如果是th标签或有hm-table-horizontal-header类，则计入标题列
                                                if ($cell.is('th') || $cell.hasClass('hm-table-horizontal-header')) {
                                                    thCount++;
                                                } else {
                                                    // 遇到第一个非标题单元格就停止计数
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    this.setValue(thCount == 0 ? '' : thCount);
                                },
                                commit: commitValue
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        widths: ['58%', '42%'],
                        children: [{
                                id: 'white-space',
                                type: 'select',
                                requiredContent: 'table[align]',
                                'default': '1',
                                label: '单元格样式', // 单元格显示样式
                                className: 'select-wide',
                                items: [
                                    ['可换行', '1'],
                                    ['单行显示', '2'],
                                    ['单行溢出截断...', '3'],
                                    ['单行溢出截断不显示', '4']
                                ],
                                onChange: function () {
                                    syncHmLineBorderCheckbox(this.getDialog());
                                },
                                setup: function (selectedTable) {
                                    if (selectedTable.hasClass('table2')) {
                                        this.setValue('2');
                                    } else if (selectedTable.hasClass('table3')) {
                                        this.setValue('3');
                                    } else {
                                        this.setValue('1');
                                    }
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue() == '2') {
                                        selectedTable.appendHtml('<style>.table2 tr td{white-space:nowrap;}</style>');
                                        selectedTable.removeClass('table3');
                                        selectedTable.addClass('table2');
                                    } else if (this.getValue() == '3') {
                                        selectedTable.appendHtml('<style>.table3 tr td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>');
                                        selectedTable.removeClass('table2');
                                        selectedTable.addClass('table3');
                                    } else if (this.getValue() == '4') {
                                        selectedTable.appendHtml('<style>.table3 tr td{white-space:nowrap;overflow:hidden}</style>');
                                        selectedTable.removeClass('table2');
                                        selectedTable.addClass('table3');
                                    } else {
                                        selectedTable.removeClass('table2');
                                        selectedTable.removeClass('table3');
                                    }
                                    refreshHmLinedCellFromDialog(this.getDialog(), selectedTable, this.getDialog().getParentEditor());
                                }
                            },
                            {
                                id: 'hm-line-border',
                                type: 'checkbox',
                                label: '换行显示边框',
                                'default': false,
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.hasClass('hm-lined-cell'));
                                },
                                commit: function (data, selectedTable) {
                                    refreshHmLinedCellFromDialog(this.getDialog(), selectedTable, this.getDialog().getParentEditor());
                                }
                            }
                            // {
                            // 	id: 'evaluate-col-num',
                            // 	type: 'text',
                            // 	controlStyle: 'width:200px',
                            // 	requiredContent: 'table[align]',
                            // 	label: '竖向列数',// 竖向评估单列数
                            // 	setup: function( selectedTable ) {
                            // 		var defaultVal = '';
                            // 		if($(selectedTable.$).attr('evaluate-type') == 'col'){
                            // 			defaultVal = '7';
                            // 		}
                            // 		this.setValue( selectedTable.getAttribute( '_col_num' ) || defaultVal );
                            // 	},
                            // 	commit: function( data, selectedTable ) {
                            // 		if($(selectedTable.$).attr('evaluate-type') != 'col'){
                            // 			selectedTable.removeAttribute( '_col_num');
                            // 			return;
                            // 		}
                            // 		var num = this.getValue();
                            // 		try{
                            // 			num = parseInt(num);
                            // 		}catch(e){
                            // 			num = 7;
                            // 		}
                            // 		if(isNaN(num) || num < 1){
                            // 			num = 7;
                            // 		}
                            // 		selectedTable.setAttribute( '_col_num',num );
                            // 	}
                            // }
                        ]
                    },
                    {
                        type: 'hbox',
                        widths: ['65px', '18%', '18%', '18%', '18%', '18%'],
                        style: 'margin: 4px 0;width:400px;',
                        children: [{
                                type: 'html',
                                html: '<div style="width:62px;float:left;text-align:right;line-height:28px;font-weight:600;color:#495057;">表格控制</div>'
                            },
                            {
                                id: 'table-add-row',
                                type: 'checkbox',
                                label: '新增行',
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.getAttribute('table_add_row'));
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        selectedTable.setAttribute('table_add_row', this.getValue());
                                    } else {
                                        selectedTable.removeAttribute('table_add_row');
                                    }
                                }
                            },
                            {
                                id: 'table-add-col',
                                type: 'checkbox',
                                label: '新增列',
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.getAttribute('table_add_col'));
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        selectedTable.setAttribute('table_add_col', this.getValue());
                                    } else {
                                        selectedTable.removeAttribute('table_add_col');
                                    }
                                }
                            },
                            {
                                id: 'table-delete-row',
                                type: 'checkbox',
                                label: '删除行',
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.getAttribute('table_delete_row'));
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        selectedTable.setAttribute('table_delete_row', this.getValue());
                                    } else {
                                        selectedTable.removeAttribute('table_delete_row');
                                    }
                                }
                            },
                            {
                                id: 'table-delete-col',
                                type: 'checkbox',
                                label: '删除列',
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.getAttribute('table_delete_col'));
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        selectedTable.setAttribute('table_delete_col', this.getValue());
                                    } else {
                                        selectedTable.removeAttribute('table_delete_col');
                                    }
                                }
                            },
                            {
                                id: 'table-delete-table',
                                type: 'checkbox',
                                label: '删除表格',
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.getAttribute('table_delete_table'));
                                },
                                commit: function (data, selectedTable) {
                                    if (this.getValue()) {
                                        selectedTable.setAttribute('table_delete_table', this.getValue());
                                    } else {
                                        selectedTable.removeAttribute('table_delete_table');
                                    }
                                }
                            }
                        ]
                    }, {
                        type: 'hbox',
                        style: 'margin-left: 12px;width:596px;',
                        widths: ['54%','46%'],
                        children: [{
                                id: 'table-border',
                                type: 'checkbox',
                                requiredContent: 'table[align]',
                                label: '显示边框',
                                'default': true,
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.hasClass('solid-border') || '');
                                },
                                commit: function (data, selectedTable) {
                                    selectedTable.removeClass('solid-border');
                                    selectedTable.removeClass('dashed-border');
                                    if (this.getValue())
                                        selectedTable.addClass('solid-border');
                                    else
                                        selectedTable.addClass('dashed-border');
                                }
                            },
                            {
                                id: 'font-weight',
                                type: 'checkbox',
                                requiredContent: 'table[right]',
                                label: '文字加粗',
                                setup: function (selectedTable) {
                                    this.setValue(selectedTable.hasClass('font-weight') || '');
                                },
                                commit: function (data, selectedTable) {
                                    selectedTable.removeClass('font-weight');
                                    selectedTable.removeClass('font-normal');
                                    if (this.getValue())
                                        selectedTable.addClass('font-weight');
                                    else
                                        selectedTable.addClass('font-normal');
                                }
                            } 
                        ]
                    }, { 
                        type: 'hbox',
                        style: 'margin-left: 12px;width:596px;',
                        widths: ['54%','46%'],
                        children: [
                        // {
                        //     id: 'pagebreakinside-tr-avoid',
                        //     type: 'checkbox',
                        //     requiredContent: 'table[right]',
                        //     label: '打印时禁止单元格跨页断开',
                        //     setup: function (selectedTable) {
                        //         this.setValue(selectedTable.getAttribute('pagebreakinside-tr-avoid'));
                        //     },
                        //     commit: function (data, selectedTable) {
                        //         if (this.getValue()) {
                        //             selectedTable.setAttribute('pagebreakinside-tr-avoid', this.getValue());
                        //         } else {
                        //             selectedTable.removeAttribute('pagebreakinside-tr-avoid');
                        //         }
                        //     }
                        // },
                        {
                            id: '_hm_copy_table_header',
                            type: 'checkbox',
                            requiredContent: 'table[right]',
                            label: '打印时每页重复标题行',
                            setup: function (selectedTable) {
                                this.setValue(selectedTable.getAttribute('_hm_copy_table_header'));
                            },
                            commit: function (data, selectedTable) {
                                if ((selectedTable.getAttribute('_hm_copy_table_header') == null && this.getValue()) || (selectedTable.getAttribute('_hm_copy_table_header') == 'true' && !this.getValue())) {
                                    editor.fire('setCopyTableHeader', {
                                        value: this.getValue(),
                                        table: selectedTable,
                                        _hm_copy_table_header: this.getValue()
                                    });
                                }
                            }
                        },
                    // ]
                    // }, {
                    //     type: 'hbox',
                    //     style: 'margin-left: 12px;width:596px;',
                    //     widths: ['54%','46%'],
                    //     children: [
                            {
                            id: '_hm_table_disable_drag',
                            type: 'checkbox',
                            requiredContent: 'table[right]',
                            label: '是否禁止表格拖拽',
                            setup: function (selectedTable) {
                                this.setValue(selectedTable.getAttribute('_hm_table_disable_drag'));
                            },
                            commit: function (data, selectedTable) {
                                if (this.getValue()) {
                                    selectedTable.setAttribute('_hm_table_disable_drag', this.getValue());
                                } else {
                                    selectedTable.removeAttribute('_hm_table_disable_drag');
                                }
                            }
                        // },{
                        //     id: 'is_nursing_form',
                        //     type: 'checkbox',
                        //     requiredContent: 'table[right]',
                        //     label: '是否为护理表单',
                        //     setup: function (selectedTable) {
                        //         this.setValue(selectedTable.getAttribute('is_nursing_form'));
                        //     },
                        //     commit: function (data, selectedTable) {
                        //         if (this.getValue()) {
                        //             selectedTable.setAttribute('is_nursing_form', this.getValue());
                        //         } else {
                        //             selectedTable.removeAttribute('is_nursing_form');
                        //         }
                        //     }
                        }]
                    } 
                ]
            }]
        };
    }

    CKEDITOR.dialog.add('table', function (editor) {
        return tableDialog(editor, 'table');
    });
    CKEDITOR.dialog.add('tableProperties', function (editor) {
        return tableDialog(editor, 'tableProperties');
    });
})();