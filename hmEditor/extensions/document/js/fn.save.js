commonHM.component['documentModel'].fn({
    getDocumentText: function (widget) {
        var copyWidget = $(widget).clone(true);
        copyWidget.find('[_placeholdertext="true"]').each(function () {
            $(this).text('');
        });
        copyWidget.find('.r-model-gen-remark').each(function () {
            $(this).remove();
        });
        copyWidget.find('style').each(function () {
            $(this).remove();
        });
        // 移除 AI 生成未保留内容（.r-model-gen），获取的 text 不包含未确认的草稿
        copyWidget.find('.r-model-gen').remove();
        copyWidget.find('[data-attach-ai]').removeAttr('data-attach-ai');
        return copyWidget.text();
    },
    /**
     * 获取文档的 HTML 内容（用于保存/导出）
     * 对当前编辑区域做清洗后，输出带 body 标签的完整 HTML 字符串。
     * 流程：① 清除 AI 生成备注与占位 ② 清除质控提示 ③ 从 body/widget 提取纸张、元数据、样式 ④ 恢复页眉页脚显示 ⑤ 拼接 body 属性与内容。
     * @param {jQuery|Element} widget 文档内容所在容器（编辑区域节点）
     * @returns {string} 带 <body> 标签的 HTML 字符串，含 data-hm-papersize、meta_json、style、class 等属性
     */
    getDocumentHtml: function (widget) {
        var _t = this;
        var $body = _t.editor.document.getBody();

        // 清除 AI 助手生成备注：对 generate=1 且含 .r-model-gen-remark 的文本框，去掉备注并改为占位展示
        $(widget).find('.new-textbox-content').each(function (i, ele) {
            if ($(ele).attr('generate') == '1' && $(ele).find('.r-model-gen-remark').length > 0) {
                $(ele).find('.r-model-gen-remark').remove();
                var _placeholder = $(ele).parent().attr('_placeholder');
                $(ele).attr('_placeholder', _placeholder);
                $(ele).attr('_placeholdertext', true);
                if (_placeholder) {
                    $(ele).html(_placeholder);
                }
            }
        });

        // 清除质控相关节点：删除质控段落与质控内联标记
        $(widget).find('.doc-warn-p').each(function () {
            $(this).remove();
        });
        $(widget).find('.doc-warn-txt').each(function (i, ele) {
            new CKEDITOR.dom.element(ele).remove(true);
        });

        // 从编辑区 body 或 widget 上提取文档属性（纸张、元数据、样式）
        var paperSize = $body.getAttribute('data-hm-papersize');
        var meta_json = $body.getAttribute('meta_json');
        var papersize = paperSize || $(widget).attr('data-hm-subpapersize');
        var meta_json = meta_json || $(widget).attr('meta_json');
        // data-hm-substyle：子文档纸张等；style：容器样式对话框写在 .emrWidget-content 上的内联样式（仅用 innerHTML 会丢失外层 style，需并入 body）
        var subStyle = $(widget).attr('data-hm-substyle') || '';
        var containerInlineStyle = $(widget).attr('style') || '';
        var style = [subStyle, containerInlineStyle].filter(function (s) {
            return s && String(s).trim();
        }).join(';');

        // 用克隆构建 HTML，并移除 AI 生成未保留内容（.r-model-gen），获取的 html 不包含未确认的草稿
        var $widgetForHtml = $(widget).clone(true);
        $widgetForHtml.find('.r-model-gen').remove();
        $widgetForHtml.find('[data-attach-ai]').removeAttr('data-attach-ai');
        var $recordContent = $('<body></body>').append($widgetForHtml.html());

        // 将隐藏的页眉、页脚表格恢复显示（去掉 display 隐藏）
        $recordContent.find("table[_paperheader]").each(function () {
            $(this).css("display", "");
        });
        $recordContent.find("table[_paperfooter]").each(function () {
            $(this).css("display", "");
        });

        // 若存在切换模式或不可编辑块，则 body 增加 class switchModel
        var _class = '';
        if ($($body.$).find('.switchModel').length > 0 || $($body.$).find('[_contenteditable="false"]').length > 0) {
            _class = 'switchModel';
        }

        var widgetContent = '<body data-hm-papersize="' + (papersize || "") + '" meta_json="' + (meta_json || "") + '" style="' + (style || "") + '" class="' + (_class || "") + '">' + $recordContent[0].innerHTML + '</body>';

        // 病程若使用新样式，在 body 上增加 newstyle 属性
        var newstyle = $(widget).attr('data-hm-subnewstyle');
        if (newstyle) {
            widgetContent = '<body data-hm-papersize="' + (papersize || "") + '" meta_json="' + (meta_json || "") + '" style="' + (style || "") + '" newstyle="' + (newstyle || "") + '" >' + $recordContent[0].innerHTML + '</body>';
        }

        return widgetContent;
    },
    /**
     * 移除含带cke属性
     * @param {Element} ele 元素
     */
    removeWildCardAttr: function (ele) {
        var attributes = $.map(ele.attributes, function (item) {
            return item.name;
        });
        $.each(attributes, function (i, item) {
            if (item.indexOf('cke') >= 0) {
                $(ele).removeAttr(item);
            }
        });
    },
    /**
     * 获取文档内容数据
     * @param {*} widget 内容所在容器对象
     * @returns
     */
    getContentData: function (widget) {
        var _t = this;
        var $body = $(widget).clone(true); // 克隆当前文档内容
        $body.find('del.hm_revise_del').remove(); // 删除修订痕迹
        // 移除 AI 草稿节点后再获取数据元，使返回内容不包含未确认的 AI 生成内容
        $body.find('.r-model-gen').remove();
        $body.find('[data-attach-ai]').removeAttr('data-attach-ai');
        //只查找有名称的数据元，无名称的只能作为内嵌类型
        var sourceObj = _t.getSourceData($body);
        return sourceObj;
    },
    /**
     * 获取数据源对象
     * @param {*} dataSourceList
     * @returns
     */
    getSourceData: function ($body) {
        var _t = this;
        var sourceObj = {
            data: [] // 非护理表单数据 
        };
        // 处理普通数据元
        _t.handleNormalDataElements($body, sourceObj);

        // 处理列表类表格数据
        _t.handleTableListData($body, sourceObj);

        return sourceObj;
    },

    /**
     * 处理普通数据元
     * @param {*} $body 文档内容
     * @param {*} sourceObj 数据源对象
     */
    handleNormalDataElements: function ($body, sourceObj) {
        var _t = this;
        var $copyBody = $body.clone(true);
        $copyBody.find('.r-model-gen-remark').remove();
        var dataSourceList = $copyBody.find('[data-hm-name]:not([data-hm-node="labelbox"])');

        for (var i = 0; i < dataSourceList.length; i++) {
            var ele = dataSourceList[i];
            if ($(ele).parents('[data-hm-table-type="list"]').length > 0) {
                continue;
            }

            var spanObj = _t.getDataElementObject(ele);
            if (spanObj) {
                sourceObj.data.push(spanObj);
            }
        }
    },

    /**
     * 处理列表类表格数据（护理表单等 list 型表格）
     * 遍历文档中所有 data-hm-table-type="list" 的表格，将每张表转为 { keyCode, keyName, keyId, keyValue }，
     * keyValue 为二维数组：每行一个数组，每格一个数据元对象。
     * @param {jQuery} $body 文档内容（body 的 jQuery 对象）
     * @param {Object} sourceObj 数据源对象，结果会 push 到 sourceObj.data
     */
    handleTableListData: function ($body, sourceObj) {
        var _t = this;
        // 仅处理列表型表格
        var $tablelist = $body.find('table[data-hm-table-type="list"]');

        if (!$tablelist.length) return;

        $tablelist.each(function () {
            // 单张表：表编码、表名、表 id、行数据数组
            var tableData = {
                keyCode: $(this).attr('data-hm-table-code') || '',
                keyName: $(this).attr('data-hm-datatable') || '',
                keyId: $(this).attr('hm-table-id') || '',
                keyValue: []
            };
            var $rows = $(this).find('tbody tr');

            $rows.each(function () {
                // 当前行：收集该行内所有带 data-hm-node 的单元格
                var rowData = [];
                var $tds = $(this).find('[data-hm-node]');

                $tds.each(function () {
                    var cellObj = _t.getDataElementObject($(this));
                    if (cellObj) {
                        rowData.push(cellObj);
                    }
                });

                // 仅当该行至少有一个有效数据元时才加入表数据
                if (rowData.length) {
                    tableData.keyValue.push(rowData);
                }
            });
            sourceObj.data.push(tableData);
        });
    },
    /**
     * 根据表格编码、列列表、行索引获取表格数据
     * @param {string} tableCode 表格编码
     * @param {Array} keyList 获取列列表（数据元编码数组），为空时获取全部列
     * @param {number} rowIndex 获取行索引，为空时获取全部行
     * @returns {Object} 表格数据对象
     */
    getTableListData: function (tableCode, keyList, rowIndex) {
        var _t = this;
        var $body = $(_t.editor.document.getBody().$);
        var $table = $body.find('table[data-hm-table-code="' + tableCode + '"]');

        if (!$table.length) {
            return null;
        }

        // 构建表格数据对象
        var tableData = {
            keyCode: tableCode,
            keyName: $table.attr('data-hm-datatable') || '',
            keyId: $table.attr('hm-table-id') || '',
            keyValue: []
        };
        // 增加逻辑，判断表格时横向还是竖向
        var tableDirection = $table.attr('evaluate-type') || 'col'; // 默认为竖向
        var $rows = $table.find('tbody tr');

        // 根据表格方向选择不同的数据处理方式
        if (tableDirection === 'row') {
            // 横向表格：除标题外，一列为一组数据
            var colCount = _t.getTableColumnCount($table);
            if (typeof rowIndex === 'number' && rowIndex >= 0) {
                // 处理指定列
                if (rowIndex < colCount) {
                    var colData = _t.getColumnData($table, rowIndex, keyList);
                    if (colData.length) {
                        tableData.keyValue.push(colData);
                    }
                } else {
                    console.warn('列索引 ' + rowIndex + ' 超出表格列数范围');
                }
            } else {
                // 处理所有列
                for (var i = 0; i < colCount; i++) {
                    var colData = _t.getColumnData($table, i, keyList);
                    if (colData.length) {
                        tableData.keyValue.push(colData);
                    }
                }
            }
        } else {
            // 竖向表格：沿用现有逻辑
            if (typeof rowIndex === 'number' && rowIndex >= 0) {
                if (rowIndex < $rows.length) {
                    var $targetRow = $rows.eq(rowIndex);
                    var rowData = _t.getRowData($targetRow, keyList);
                    if (rowData.length) {
                        tableData.keyValue.push(rowData);
                    }
                } else {
                    console.warn('行索引 ' + rowIndex + ' 超出表格行数范围');
                }
            } else {
                // 处理所有行
                $rows.each(function () {
                    var rowData = _t.getRowData($(this), keyList);
                    if (rowData.length) {
                        tableData.keyValue.push(rowData);
                    }
                });
            }
        }

        return tableData;
    },


    /**
     * 获取表格列数
     * @param {jQuery} $table 表格元素
     * @returns {number} 列数
     */
    getTableColumnCount: function ($table) {
        var $rows = $table.find('tbody tr');
        if ($rows.length === 0) {
            return 0;
        }
        // 获取第一行的列数
        var $firstRow = $rows.first();
        return $firstRow.find('td').length;
    },

    /**
     * 获取列数据（用于横向表格）
     * @param {jQuery} $table 表格元素
     * @param {number} colIndex 列索引
     * @param {Array} keyList 列编码列表，为空时获取全部列
     * @returns {Array} 列数据数组
     */
    getColumnData: function ($table, colIndex, keyList) {
        var _t = this;
        var colData = [];
        var $rows = $table.find('tbody tr');

        // 遍历每一行，获取对应列的数据
        $rows.each(function () {
            var $row = $(this);
            var $cells = $row.find('[data-hm-node]');
            var $targetCell = $cells.eq(colIndex);

            if ($targetCell.length > 0) {
                // 排除标题行：检查目标单元格是否包含 hm-table-horizontal-header 类
                if ($targetCell.hasClass('hm-table-horizontal-header')) {
                    return; // 跳过标题行
                }
                var cellObj = _t.getDataElementObject($targetCell[0]);
                if (cellObj) {
                    // 如果指定了列编码列表，只返回匹配的列
                    if (keyList && keyList.length > 0) {
                        if (keyList.indexOf(cellObj.keyCode) !== -1) {
                            colData.push(cellObj);
                        }
                    } else {
                        // 未指定列编码列表，返回所有列
                        colData.push(cellObj);
                    }
                }
            }
        });

        return colData;
    },
    /**
     * 获取表格行数据
     * @param {jQuery} $row 行元素
     * @param {Array} keyList 列编码列表，为空时获取全部列
     * @returns {Array} 行数据数组
     */
    getRowData: function ($row, keyList) {
        var _t = this;
        var rowData = [];
        var $tds = $row.find('[data-hm-node]');

        $tds.each(function () {
            var cellObj = _t.getDataElementObject($(this));
            if (cellObj) {
                // 如果指定了列编码列表，只返回匹配的列
                if (keyList && keyList.length > 0) {
                    if (keyList.indexOf(cellObj.keyCode) !== -1) {
                        rowData.push(cellObj);
                    }
                } else {
                    // 未指定列编码列表，返回所有列
                    rowData.push(cellObj);
                }
            }
        });

        return rowData;
    },
    /**
     * 获取数据元对象
     * @param {*} ele 数据元元素
     * @returns 数据元对象
     */
    getDataElementObject: function (ele) {
        var _t = this;
        var $ele = $(ele);
        var type = $ele.attr('data-hm-node');
        var spanObj = {
            keyCode: $ele.attr('data-hm-code') || '',
            keyId: $ele.attr('data-hm-id') || '',
            keyName: $ele.attr('data-hm-name') || '',
            keyValue: ''
        };
        // 按数据元节点类型分别取值，填充 spanObj.keyValue
        switch (type) {
            case 'newtextbox':
                // 文本框：有嵌套数据元则走嵌套逻辑，否则走普通文本框取值
                if ($ele.find('[data-hm-name]').length > 0) {
                    spanObj = _t.handleNestingTextbox(ele, spanObj);
                } else {
                    spanObj = _t.handleNewTextbox(ele, spanObj);
                }
                break;
            case 'dropbox':
                // 下拉框：由 handleDropbox 取选中项值
                spanObj = _t.handleDropbox(ele, spanObj);
                break;
            case 'cellbox':
                // 单元格：非占位时取文本，并去除零宽字符
                var value = !$ele.attr('_placeholdertext') ? $ele.text() : '';
                spanObj.keyValue = value ? value.replace(/\u200B/g, '') : '';
                break;
            case 'textboxwidget':
                // 文本控件：同单元格，非占位时取文本并去零宽字符
                var value = !$ele.attr('_placeholdertext') ? $ele.text() : '';
                spanObj.keyValue = value ? value.replace(/\u200B/g, '') : '';
                break;
            case 'timebox':
                // 时间框：由 handleTimeBox 取时间值
                spanObj = _t.handleTimeBox(ele, spanObj);
                break;
            case 'expressionbox':
                // 表达式框：非占位时取 _expressionvalue 属性值
                spanObj.keyValue = !$ele.attr('_placeholdertext') ? $ele.attr('_expressionvalue') : '';
                break;
            case 'searchbox':
                // 搜索框：由 handleSearchbox 取选中/输入值
                spanObj = _t.handleSearchbox(ele, spanObj);
                break;
            case 'radiobox':
                // 单选：由 handleRadiobox 取选中项，需传入 body 做上下文
                spanObj = _t.handleRadiobox(ele, spanObj, $ele.closest('body'));
                break;
            case 'checkbox':
                // 复选：由 handleCheckbox 取勾选项，需传入 body 做上下文
                spanObj = _t.handleCheckbox(ele, spanObj, $ele.closest('body'));
                break;
            default:
                // 未知节点类型，不参与保存
                return null;
        }

        return spanObj;
    },
    /**
     * 处理文本取值
     * @param {*} ele 当前数据元元素
     * @param {*} spanObj 当前数据元对象
     * @returns 获取到数据元值域后的数据元对象
     */
    handleNewTextbox: function (ele, spanObj) {
        var _con = $(ele).find('span.new-textbox-content');
        var _type = _con.attr('_texttype');
        if (_type == '数字') {
            // 如果当前数据元元素包含图片，则获取图片地址和文本内容
            if (_con && _con.find('img').length) {
                var _img = _con.find('img');
                var _imgSrc = _img.attr('src');
                spanObj.keyValue = _imgSrc || '';
            } else {
                // 如果当前数据元元素不包含图片，直接获取文本内容
                if (!_con.attr('_placeholdertext')) {
                    spanObj.keyValue = _con.text();
                }
            }
        } else if (_type == '下拉') {
            var selectType = _con.attr('_selecttype'); // 下拉框类型
            var code = _con.attr('code') || ""; // 下拉框编码 
            var text = '';
            if (!_con.attr('_placeholdertext')) {
                text = _con.text(); // 下拉框文本
            }
            spanObj.keyValue = {
                code: code,
                value: text
            };
            if (selectType == '多选') {
                spanObj.keyValue = {
                    code: code && code.split(','),
                    value: text && text.split(',')
                };
            }
        } else if (_type == '二维码') {
            // 对于二维码类型，只取原始的bindVal值，不保存生成的HTML结构
            if (!_con.attr('_placeholdertext')) {
                var bindVal = _con.attr('_bindvalue') || _con.text();
                spanObj.keyValue = bindVal.replace(/\u200B/g, '').replace(/\uFEFF/g, '').trim();
                console.log('二维码保存处理，提取bindVal:', bindVal);
            }
        } else if (_type == '条形码') {
            // 对于条形码类型，只取原始的bindVal值，不保存生成的HTML结构
            if (!_con.attr('_placeholdertext')) {
                var bindVal = _con.attr('_bindvalue') || _con.text();
                spanObj.keyValue = bindVal.replace(/\u200B/g, '').replace(/\uFEFF/g, '').trim();
                console.log('条形码保存处理，提取bindVal:', bindVal);
            }
        } else {
            if (!_con.attr('_placeholdertext')) {
                // 优化文本获取逻辑，处理包含expressionbox等复杂内容的情况
                var contentArray = [];
                //console.log(_con.contents());
                // 遍历所有子节点，按顺序获取内容
                _con.contents().each(function () {
                    if (this.nodeType === 3) { // 文本节点
                        var text = $(this).text();
                        // if (text && text.trim()) {
                        if (text) {
                            // 清理文本内容，移除零宽空格等特殊字符
                            text = text.replace(/\u200B/g, '').replace(/\uFEFF/g, ''); //.trim();
                            if (text) {
                                contentArray.push(text);
                            }
                        }
                    } else if (this.nodeType === 1) { // 元素节点
                        var $element = $(this);

                        // 如果是expressionbox，创建对象结构
                        if ($element.attr('data-hm-node') === 'expressionbox') {
                            var expressionObj = {
                                "类型": "expressionbox",
                                "值": $element.attr('_expressionvalue') || '',
                                "_style": $element.attr('style') || '',
                                "_expressionoption": $element.attr('_expressionoption') || '',
                                "id": $element.attr('data-hm-id') || ''
                            };
                            contentArray.push(expressionObj);
                        } else if ($element.is('img')) {
                            // 如果是图片元素，创建图片对象结构
                            var imgObj = {
                                "名称": "img",
                                "类型": "img",
                                "值": $element.attr('src') || '',
                                "src": $element.attr('src') || '',
                                "id": $element.attr('id') || '',
                                "style": $element.attr('style') || ''
                            };
                            contentArray.push(imgObj);
                        } else if ($element.is('br')) {
                            contentArray.push('<br/>');
                        } else {
                            // 检查元素内部是否包含img
                            var $img = $element.find('img');
                            if ($img.length > 0) {
                                // 如果找到img元素，创建图片对象结构
                                var imgObj = {
                                    "名称": "img",
                                    "类型": "img",
                                    "值": $img.attr('src') || '',
                                    "src": $img.attr('src') || '',
                                    "id": $img.attr('id') || '',
                                    "style": $img.attr('style') || ''
                                };
                                contentArray.push(imgObj);
                            } else {
                                // 其他元素，获取其文本内容
                                var elementText = $element.text();
                                if (elementText && elementText.trim()) {
                                    elementText = elementText.replace(/\u200B/g, '').replace(/\uFEFF/g, ''); //.trim();
                                    if (elementText) {
                                        contentArray.push(elementText);
                                    }
                                }
                            }
                        }
                    }
                });

                // 如果只有一个元素且是字符串，直接返回该元素；否则返回数组
                if (contentArray.length === 1) {
                    var firstElement = contentArray[0];
                    // 如果是字符串，直接返回；如果是对象，仍然返回数组
                    if (typeof firstElement === 'string') {
                        spanObj.keyValue = firstElement;
                    } else {
                        spanObj.keyValue = contentArray;
                    }
                } else if (contentArray.length > 1) {
                    spanObj.keyValue = contentArray;
                } else {
                    spanObj.keyValue = '';
                }
            }
        }
        return spanObj;
    },
    /**
     * 处理嵌套节点 
     */
    handleNestingTextbox: function (ele, spanObj) {
        var _con = $(ele).find('.new-textbox-content'); 
        
        if (!_con.attr('_placeholdertext')) {
            var contentArray = [];
            // 使用 DOM 原生的 childNodes 获取一级子节点，更精确控制
            var childNodes = _con[0].childNodes;
            
            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes[i];
                
                if (child.nodeType === 3) { // 文本节点
                    // 文本节点如果是 _con 的直接子节点，说明它是独立的文本，应该保留
                    // 数据元元素内部的文本节点不会出现在这里，因为它们是数据元元素的子节点
                    var text = child.textContent || child.nodeValue;
                    if (text) {
                        // 清理文本内容，移除零宽空格等特殊字符
                        text = text.replace(/\u200B/g, '').replace(/\uFEFF/g, ''); 
                        if (text) {
                            contentArray.push(text);
                        }
                    }
                } else if (child.nodeType === 1) { // 元素节点
                    var $element = $(child);
                    
                    // 检查当前元素本身是否是数据元元素（有 data-hm-code 属性）
                    // 只检查一级元素，不递归查找嵌套元素
                    var keyCode = $element.attr('data-hm-code');
                    if (keyCode) {
                        // 遇到数据元元素，直接返回包含 keyCode 的对象，不再深入处理
                        contentArray.push({
                            keyCode: keyCode
                        });
                    } else if ($element.is('br')) {
                        contentArray.push('<br/>');
                    } else {
                        // 其他元素，只获取其文本内容，但排除有 data-hm-code 的子元素
                        var elementText = '';
                        // 使用 childNodes 遍历元素的直接子节点，排除有 data-hm-code 的元素
                        var elementChildNodes = child.childNodes;
                        for (var j = 0; j < elementChildNodes.length; j++) {
                            var elementChild = elementChildNodes[j];
                            if (elementChild.nodeType === 3) { // 文本节点
                                elementText += (elementChild.textContent || elementChild.nodeValue);
                            } else if (elementChild.nodeType === 1) { // 元素节点
                                var $child = $(elementChild);
                                // 如果子元素没有 data-hm-code，才获取其文本
                                if (!$child.attr('data-hm-code')) {
                                    elementText += $child.text();
                                }
                            }
                        }
                        if (elementText && elementText.trim()) {
                            elementText = elementText.replace(/\u200B/g, '').replace(/\uFEFF/g, '');
                            if (elementText) {
                                contentArray.push(elementText);
                            }
                        }
                    }
                }
            }
            // 返回数组
            spanObj.keyValue = contentArray;
        }
        return spanObj;
    },
    /**
     * 处理下拉框取值
     * @param {*} ele 当前数据元元素
     * @param {*} spanObj 当前数据元对象
     * @returns 获取到数据元值域后的数据元对象
     */
    handleDropbox: function (ele, spanObj) {
        var $datasource = $(ele);
        // 选项列表，格式：显示名(编码)#显示名(编码)，如 "男(1)#女(2)"
        var items = $datasource.attr('data-hm-items');
        var code = "";
        // 当前展示文案：非占位时取节点文本，并去掉零宽字符、全角空格
        var value = !$datasource.attr('_placeholdertext') ? $datasource.text() : '';
        value = value ? value.replace(/\u200B/g, '').replace(/\u3000/g, '') : '';
        if (items != null && items.trim() != '') {
            var itemList = items.split("#");
            var selectType = $datasource.attr('_selectType');
            var jointsymbol = $datasource.attr('_jointsymbol'); // 多选时的拼接符，如顿号、逗号
            if (selectType == '多选') {
                value = (value || '').replace(/\s*/, '');
                var arr = value.split(jointsymbol); // 按拼接符拆成多个展示项
                var codeArr = [];
                var valueArr = [];
                // 逐项与 data-hm-items 中「显示名(编码)」匹配，得到 code 与 value 数组
                for (var k = 0; k < arr.length; k++) {
                    var element = arr[k];
                    for (var i = 0; i < itemList.length; i++) {
                        var item = itemList[i];
                        var matches = item.match(/\s*(.+)\((.*?)\)\s*$/); // 解析 "显示名(编码)"
                        if (matches && matches.length == 3 && element == matches[1]) {
                            code = matches[1];
                            value = matches[2];
                            codeArr.push(code);
                            valueArr.push(value);
                        } else if (matches == null) {
                            valueArr.push(element);
                            break;
                        }
                    }

                }
                code = codeArr.join(jointsymbol);
                value = valueArr.join(jointsymbol);
            } else {
                // 单选：在 itemList 中找到展示文案对应的「显示名(编码)」，取出 code 与 value
                for (var j = 0; j < itemList.length; j++) {
                    var item = itemList[j];
                    var matches = item.match(/\s*(.+)\((.*?)\)\s*$/);
                    value = (value || '').replace(/^\s*/, '');
                    if (matches && matches.length == 3 && value == matches[1]) {
                        code = matches[1];
                        value = matches[2];
                    }
                }
            }

        }
        spanObj.keyValue = {
            code: code,
            value: value
        };
        return spanObj;
    },
    // 处理时间取值
    handleTimeBox: function (ele, spanObj) {
        var _val = $(ele).text();
        _val = _val ? _val.replace(/\u200B/g, '').replace(/\u3000/g, '') : '';
        spanObj.keyValue = _val;
        return spanObj;
    },
    // 处理搜索下拉取值
    handleSearchbox: function (ele, spanObj) {
        var keyCode = $(ele).attr('data-hm-code');
        var code = $(ele).attr('_code');
        var name = $(ele).attr('_name');
        spanObj.keyCode = keyCode;
        spanObj.keyValue = {
            code: code,
            value: name
        };
        return spanObj;
    },
    // 处理单选框取值
    handleRadiobox: function (ele, spanObj, $body) {
        var $datasource = $(ele);
        var checksources = $datasource.find('[data-hm-node="radiobox"]');
        var value = [];
        var code = '';
        for (var i = 0; i < checksources.length; i++) {
            var checksource = checksources[i];
            var nameValue = checksource.getAttribute('data-hm-itemname');
            nameValue = nameValue ? nameValue.replace(/\u200B/g, '') : '';
            if (checksource.getAttribute('_selected') == 'true') {
                var matches = nameValue.match(/(.*?)\((.*?)\)/);
                if (matches && matches.length == 3) {
                    value = matches[1];
                    code = matches[2];
                } else {
                    value = nameValue;
                }
            }
        }
        spanObj.keyValue = {
            code: code,
            value: value
        };
        // spanObj.keyCode = code;
        //老结构
        if (checksources.length == 0) {
            var name = spanObj.keyName;
            checksources = $body.find('[data-hm-node="radiobox"][data-hm-name="' + name + '"]');
            for (var j = 0; j < checksources.length; j++) {
                var checksource = checksources[j];
                var nameValue = checksource.getAttribute('data-hm-itemname');
                nameValue = nameValue ? nameValue.replace(/\u200B/g, '') : '';
                if (checksource.getAttribute('_selected')) {
                    value.push(nameValue);
                }
            }
            // spanObj.keyCode = code;
            spanObj.keyValue = {
                code: code,
                value: value
            };
        }
        return spanObj;
    },
    // 处理多选框取值
    handleCheckbox: function (ele, spanObj, $body) {
        var $datasource = $(ele);
        var name = spanObj.keyName;
        // 获取data-hm-name等于该值的所有span，然后处理，并吧i+=length处理
        var checksources = $datasource.find('[data-hm-node="checkbox"]');
        var checkList = new Array();
        var codeList = new Array();
        for (var i = 0; i < checksources.length; i++) {
            var checksource = checksources[i];
            var nameValue = checksource.getAttribute('data-hm-itemname');
            nameValue = nameValue ? nameValue.replace(/\u200B/g, '') : '';
            if (checksource.getAttribute('_selected') == 'true') {
                var matches = nameValue.match(/(.*?)\((.*?)\)/);
                if (matches && matches.length == 3) {
                    codeList.push(matches[2]);
                    checkList.push(matches[1]);
                } else {
                    checkList.push(nameValue);
                }
            }
        }
        // spanObj.keyCode = codeList.length > 0 ? codeList : "";
        // spanObj.keyValue = checkList.length > 0 ? checkList : "";
        spanObj.keyValue = {
            code: codeList.length > 0 ? codeList : "",
            value: checkList.length > 0 ? checkList : ""
        };
        
        return spanObj;
    },
    /**
     * 根据指定数据元编码列表，过滤数据源对象
     * @param {*} keyList
     * @param {*} dataList
     * @returns
     */
    getFilterData: function (keyList, dataList) {
        var result = [];
        if (keyList.length) {
            if (dataList.length > 0) {
                dataList.forEach(item => {
                    if (keyList.indexOf(item.keyCode) != -1) {
                        result.push(item);
                    }
                });
            }
        } else {
            result = dataList;
        }
        return result;
    },
    /**
     * 获取所有文档列表
     * @param {*} code 文档唯一编号，为空则获取所有
     * @returns 文档列表集合
     */
    getWidgetList: function (code) {
        var _t = this;
        var widgetList = [];
        var _config = _t.editor.HMConfig || {};
        var realtimePageBreak = _config.realtimePageBreak || false;
        // 开启分页时需要先去除分页.
        var $cloneBody = realtimePageBreak ? $(CKEDITOR.plugins.pagebreakCmd.removeAllSplitters(_t.editor, true)) : $(_t.editor.document.getBody().$).clone(true);
        if (code) { // 如果存在code，则获取指定文档内容
            widgetList = $cloneBody.find("[data-hm-widgetid=" + "\'" + code + "\'" + "]");
        } else {
            // 获取所有文档内容
            widgetList = $cloneBody.find('[data-hm-widgetid]');
        }
        return widgetList;
    },
    /**
     * 获取文档内容数据
     * code 为空时，获取所有文档内容
     * @param {Object} params 获取文档内容参数
     * {
     *   code: '文档唯一编号',
     *   flag: 1, // 1:获取html文本 2:获取text文本 3:获取数据元Data
     *   keyList: ['数据元编码1','数据元编码2'] // 指定数据元编码列表，为空时：
     *                                           // - 如果code不为空，获取该文档的所有数据元
     *                                           // - 如果code为空，获取所有文档的所有数据元
     * }
     * @returns {Array} 文档内容列表，格式如下：
     * [{
     *   code: '文档唯一编号',
     *   data: [{keyCode: '数据元编码', keyValue: '数据元内容'}], // 数据元数据
     *   html: '文档html文本',
     *   text: '文档text纯文本'
     * }]
     */
    getContent: function (params) {
        var _t = this;
        var result = []; // 汇总各文档的 html / text / data，按 params.flag 填充
        var widgetList = _t.getWidgetList(params.code); // 根据 code 取文档区域列表，code 为空则全部
        if (widgetList.length) {
            for (var i = 0; i < widgetList.length; i++) {
                var widget = widgetList[i];
                _t.getOneContentResult(widget, params, result); // 单个文档的 html/text/data 追加到 result
            }
        } else {
            alert('没有找到有效的文档内容');
        }
        return result;
    },
    /**
     * 获取单个文档内容
     * @param {*} widget 文档内容所在容器对象
     * @param {*} params 获取文档内容参数
     * @param {*} result 获取文档内容结果
     * @returns 获取文档内容结果
     */
    getOneContentResult: function (widget, params, result) {
        var _t = this;
        var _html = _t.getDocumentHtml(widget);
        var _text = _t.getDocumentText(widget);
        var _sourceData = _t.getContentData(widget); // 当前文档的全部数据元（含普通数据元与列表型表格）

        // 按 keyList 决定数据元范围：code 有值且 keyList 为空时取该文档全部数据元，否则按 keyList 过滤
        var _data;
        var isEmptyKeyList = !params.keyList || params.keyList.length === 0 ||
            (params.keyList.length === 1 && params.keyList[0] === '');

        if (params.code && isEmptyKeyList) {
            _data = _sourceData.data;
        } else {
            _data = _t.getFilterData(params.keyList || [], _sourceData.data);
        }

        var _id = $(widget).attr('data-hm-widgetid') || ''; // 文档区域 id，无 code 时用此作为标识
        // 未传 code 且未传 flag 时返回完整内容（data + html + text），否则按 flag 只返回对应类型 
        if (!params.code && !params.flag) {
            result.push({
                code: params.code || _id,
                data: _data,
                html: _html,
                text: _text
            });
        } else {
            // 按 flag 只返回对应类型：1=仅 html，2=仅 text，3=仅 data，其他=全部
            if (params.flag == 1) {
                result.push({ code: params.code || _id, html: _html });
            } else if (params.flag == 2) {
                result.push({ code: params.code || _id, text: _text });
            } else if (params.flag == 3) {
                result.push({ code: params.code || _id, data: _data });
            } else {
                result.push({
                    code: params.code || _id,
                    data: _data,
                    html: _html,
                    text: _text
                });
            }
        }
        // 若当前文档包含护理表单（list 型表格），将护理数据挂到本次 push 的项上
        if ($(widget).find('[data-hm-table-type="list"]').length > 0) {
            result[result.length - 1].nursingData = _sourceData.nursingData;
        }
        return result;
    }
});