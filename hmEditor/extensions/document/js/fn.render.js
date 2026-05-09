commonHM.component['documentModel'].fn({
    /**
     * 生成二维码的通用方法
     * @param {Object} options - 二维码配置选项
     * @param {string} options.text - 二维码内容文本
     * @param {string} options.width - 二维码宽度 (默认100)
     * @param {string} options.height - 二维码高度 (默认100) 
     * @param {string} options.errorLevel - 纠错等级 L/M/Q/H (默认M)
     * @param {string} options.textPosition - 文本位置 top/bottom/none (默认bottom)
     * @param {jQuery} options.container - 容器元素
     * @returns {Promise} 返回Promise，成功时resolve容器HTML
     */
    generateQrcode: function (options) {
        return new Promise(function (resolve, reject) {
            var text = options.text || '';
            var width = options.width || '100';
            var height = options.height || '100';
            var errorLevel = options.errorLevel || 'M';
            var textPosition = options.textPosition || 'bottom';
            var container = options.container;

            if (!text) {
                reject(new Error('二维码内容不能为空'));
                return;
            }

            if (!container || !container.length) {
                reject(new Error('容器元素不能为空'));
                return;
            }

            try {
                // 创建二维码容器
                var qrcodeId = 'qrcode_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                // 创建行内上下布局的容器样式
                // 使用inline-block替代inline-flex，提高wkhtmltopdf兼容性
                // 通过text-align:center实现内容居中，而不是依赖flex布局
                var containerStyle = 'display:inline-block;text-align:center;vertical-align:bottom;';
                var textStyle = 'display:block;margin:2px 0;font-size:12px;line-height:1.2;white-space:nowrap;text-align:center;';
                var qrcodeStyle = 'display:block;margin:2px auto;width:' + width + 'px;height:' + height + 'px;';

                var qrcodeHtml = '';
                if (textPosition === 'top') {
                    qrcodeHtml = '<span class="hm-qrcode-container" style="' + containerStyle + '">' +
                        '<span style="' + textStyle + '">' + text + '</span>' +
                        '<span id="' + qrcodeId + '" style="' + qrcodeStyle + '"></span>' +
                        '</span>';
                } else if (textPosition === 'bottom') {
                    qrcodeHtml = '<span class="hm-qrcode-container" style="' + containerStyle + '">' +
                        '<span id="' + qrcodeId + '" style="' + qrcodeStyle + '"></span>' +
                        '<span style="' + textStyle + '">' + text + '</span>' +
                        '</span>';
                } else {
                    qrcodeHtml = '<span class="hm-qrcode-container" style="' + containerStyle + '">' +
                        '<span id="' + qrcodeId + '" style="' + qrcodeStyle + '"></span>' +
                        '</span>';
                }

                container.html(qrcodeHtml);

                // 保存原始bindVal到属性中，用于保存时提取
                container.attr('_bindvalue', text);
                console.log('二维码渲染时设置_bindvalue属性:', text);

                // 确保DOM更新后再生成二维码
                setTimeout(function () {
                    try {
                        // 在CKEditor的document上下文中查找元素
                        var editorDoc = container[0].ownerDocument || document;
                        var qrcodeElement = editorDoc.getElementById(qrcodeId);

                        if (qrcodeElement && typeof QRCode !== 'undefined') {
                            new QRCode(qrcodeElement, {
                                text: text,
                                width: parseInt(width) || 100,
                                height: parseInt(height) || 100,
                                colorDark: "#000000",
                                colorLight: "#ffffff",
                                correctLevel: QRCode.CorrectLevel[errorLevel] || QRCode.CorrectLevel.M
                            });

                            console.log('二维码生成成功:', text);
                            resolve(qrcodeHtml);
                        } else if (!qrcodeElement) {
                            console.error('二维码容器元素未找到:', qrcodeId);
                            container.html('二维码生成失败 - 容器未找到');
                            reject(new Error('二维码容器元素未找到'));
                        } else {
                            // 如果没有QRCode库，显示文本
                            container.html(text + ' (需要QRCode库)');
                            reject(new Error('QRCode库未加载'));
                        }
                    } catch (e) {
                        console.error('二维码生成失败:', e);
                        container.html('二维码: ' + text);
                        reject(e);
                    }
                }, 50);
            } catch (e) {
                console.error('二维码生成失败:', e);
                container.html(text);
                reject(e);
            }
        });
    },

    /**
     * 同步生成条形码的方法
     * @param {Object} options - 条形码配置选项
     * @param {string} options.text - 条形码内容文本
     * @param {string} options.width - 条形码宽度 (默认200)
     * @param {string} options.height - 条形码高度 (默认50)
     * @param {string} options.barWidth - 条形码条的宽度 (默认2)
     * @param {string} options.textPosition - 文本位置 top/bottom/none (默认bottom)
     * @returns {string} 返回包含IMG元素的HTML字符串
     */
    generateBarcodeSync: function (options) {
        var text = options.text || '';
        var width = options.width || '200';
        var height = options.height || '50';
        var barWidth = options.barWidth || '2';
        var textPosition = options.textPosition || 'bottom';

        if (!text) {
            return '<span>条形码内容不能为空</span>';
        }

        if (typeof JsBarcode === 'undefined') {
            return '<span>' + text + ' (需要JsBarcode库)</span>';
        }

        try {
            // 创建临时Canvas元素
            var tempCanvas = document.createElement('canvas');
            tempCanvas.style.display = 'none';
            document.body.appendChild(tempCanvas);

            var actualHeight = parseInt(height) || 50;
            var actualBarWidth = parseInt(barWidth) || 2;
            var targetWidth = parseInt(width) || 200;

            console.log('条形码生成参数:', {
                text: text,
                width: options.width,
                height: options.height,
                actualHeight: actualHeight,
                barWidth: options.barWidth,
                actualBarWidth: actualBarWidth,
                targetWidth: targetWidth,
                textPosition: textPosition
            });

            // 预设Canvas尺寸，确保有足够空间容纳条形码
            // JsBarcode会自动调整Canvas尺寸，但预设一个合理的初始值
            tempCanvas.width = Math.max(targetWidth, text.length * actualBarWidth * 10);
            tempCanvas.height = actualHeight; // 额外增加一些边距空间

            // 生成条形码到Canvas
            JsBarcode(tempCanvas, text, {
                format: "CODE128",
                width: actualBarWidth,
                height: actualHeight,
                displayValue: false,
                textPosition: textPosition,
                background: "transparent",
                lineColor: "#000000",
                margin: 0
            });

            console.log('Canvas最终尺寸:', {
                width: tempCanvas.width,
                height: tempCanvas.height
            });

            // 同步转换为Base64
            var dataURL = tempCanvas.toDataURL('image/png');

            // 清理临时Canvas
            document.body.removeChild(tempCanvas);

            // 构建最终HTML
            // 使用inline-block替代inline-flex，提高wkhtmltopdf兼容性
            // 通过text-align:center实现内容居中，而不是依赖flex布局
            var containerStyle = 'display:inline-block;text-align:center;vertical-align:bottom;';
            var textStyle = 'display:block;margin:2px 0;font-size:12px;line-height:1.2;white-space:nowrap;text-align:center;';
            var imgStyle = 'display:block;margin:2px auto;';

            // 只设置宽度，让高度保持条形码的自然比例，避免变形
            if (targetWidth && targetWidth > 0) {
                imgStyle += 'width:' + targetWidth + 'px;';
            }
            if (actualHeight) {
                imgStyle += 'height:' + actualHeight + 'px;';
            }


            var imgElement = '<img src="' + dataURL + '" style="' + imgStyle + '" />';

            var barcodeHtml = '';
            if (textPosition === 'top') {
                barcodeHtml = '<span class="hm-barcode-container" style="' + containerStyle + '">' +
                    '<span style="' + textStyle + '">' + text + '</span>' +
                    imgElement +
                    '</span>';
            } else if (textPosition === 'bottom') {
                barcodeHtml = '<span class="hm-barcode-container" style="' + containerStyle + '">' +
                    imgElement +
                    '<span style="' + textStyle + '">' + text + '</span>' +
                    '</span>';
            } else {
                barcodeHtml = '<span class="hm-barcode-container" style="' + containerStyle + '">' +
                    imgElement +
                    '</span>';
            }

            console.log('条形码同步生成成功:', text);
            return barcodeHtml;

        } catch (error) {
            console.error('条形码同步生成失败:', error);
            return '<span>条形码: ' + text + '</span>';
        }
    },


    /**
     * 渲染文档内容
     * @param {*} content
     */
    renderContent: function (content) {
        var _t = this;
        var designMode = _t.editor.HMConfig.designMode;
        // _t.editor.setData(content);
        // return;
        // 当设置内容之后不能马上分页, 得等待病程排序完成
        // 首次打开病历除外
        if (CKEDITOR.plugins.pagebreakCmd) {
            CKEDITOR.plugins.pagebreakCmd.currentOperations.setContent = true;
        }
        // 处理之前由于 bug 导致创建的 colgroup 产生了错误 (比如有些列的 col 无宽度) 的问题;
        // 护理表单和体温单不用 colgroup (模板制作除外)
        content = CKEDITOR.tools.removeErrorCol(content);
        // 处理之前由于 bug 导致病案首页中一些空行的 <br> 被删除然后被加上了 'has-br' 属性, 去除之并添加 <br>
        if (content.indexOf('has-br') > 0) {
            content = content.replace(/^<body/, '<notbody').replace(/<\/body>$/, '</notbody>');
            content = $('<div>' + content + '</div>');
            content.find('.has-br').removeClass('has-br').append('<br>');
            content = content.html().replace(/^<notbody/, '<body').replace(/<\/notbody>$/, '</body>');
        }
        var $div = $(content
            .replace(/<(body)(.*?)>/, "<div$2>")
            .replace('</body>', '</div>')
            .replace(/↵/, '<br/>')
            .replace(/(<span[^>]+_timeoption=[^>]*>)(<\/span>)/g, '$1\u200B$2'));
        var $body = $(_t.editor.document.getBody().$);
        $body.html($div.html());
        if (!designMode) {
            // 初始化不可用数据源状态
            _t.initDisabledDatasourceState($body);

            if (!_t.editor.reviseModelOpened) {
                _t.hideReviseModel($body);
            }
        } else {
            if ($body.find('[_contenteditable="false"]').length == 1) {
                CKEDITOR.plugins.switchmodelCmd.currentModel = '表单模式';
            } else {
                CKEDITOR.plugins.switchmodelCmd.currentModel = '编辑模式';
            }
            // 获取组件实例并设置值
            var switchModelCombo = _t.editor.ui.get('SwitchModel');
            if (switchModelCombo) {
                // 设置组件显示值
                switchModelCombo.setValue(CKEDITOR.plugins.switchmodelCmd.currentModel);
            }
        }

        var paperSize;
        if ($div.length == 1) {
            paperSize = $div.attr("data-hm-papersize");
            var meta_json = $div.attr("meta_json");
            meta_json && $body.attr('meta_json', meta_json);
            var styles = $div.attr("style");
            if (styles) {
                $body.attr('style', styles);
            }
            $body.removeAttr('doc_code');
            var doc_code = $div.attr("doc_code");
            if (doc_code) {
                $body.attr('doc_code', doc_code);
            }
            var newStyle = $div.attr("newStyle");
            //是否使用新样式
            if (newStyle) {
                $body.attr('newStyle', 'true');
                $body.prev('head').append('<link id="newStyleId" type="text/css" rel="stylesheet" href="contents_new.css">');
            }
            // 加载文档信息配置的meta_js
            try {
                if (meta_json && meta_json != 'null') {
                    if (JSON.parse(decodeURIComponent(meta_json)).meta_js) {
                        var meta_js = '<script>' + JSON.parse(decodeURIComponent(meta_json)).meta_js + '</script>';
                        $body.prev('head').append(meta_js);
                        scriptFlag = true;
                    }
                }
            } catch (error) {
                _t.editor.showNotification('js脚本语法有误，请修改', 'error');
            }
        }

        // 设置完页面之后会触发快照
        if (paperSize && paperSize !== $body[0].getAttribute('data-hm-papersize')) {
            _t.editor.execCommand('paperSize', paperSize);
        }
        _t.initDocumentFireEvt($body);

        // 添加表格行操作图标的CSS样式
        if (!$('head').find('#table-row-actions-style').length) {
            $('head').append(`
                <style id="table-row-actions-style">
                    .table-row-actions {
                        position: absolute !important;
                        left: -60px !important;
                        top: 0 !important;
                        z-index: 1000 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 2px !important;
                        background: rgba(255, 255, 255, 0.9) !important;
                        padding: 2px !important;
                        border-radius: 4px !important;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
                    }
                    .add-row-icon, .delete-row-icon {
                        cursor: pointer !important;
                        padding: 2px !important;
                        border-radius: 3px !important;
                        font-size: 12px !important;
                        text-align: center !important;
                        width: 20px !important;
                        height: 20px !important;
                        line-height: 16px !important;
                        font-weight: bold !important;
                        transition: all 0.2s ease !important;
                    }
                    .add-row-icon {
                        background: #4CAF50 !important;
                        color: white !important;
                    }
                    .add-row-icon:hover {
                        background: #45a049 !important;
                        transform: scale(1.1) !important;
                    }
                    .delete-row-icon {
                        background: #f44336 !important;
                        color: white !important;
                    }
                    .delete-row-icon:hover {
                        background: #da190b !important;
                        transform: scale(1.1) !important;
                    }
                    .delete-row-icon.disabled {
                        opacity: 0.5 !important;
                        cursor: not-allowed !important;
                    }
                    .delete-row-icon.disabled:hover {
                        background: #f44336 !important;
                        transform: none !important;
                    }
                </style>
            `);
        }



        $body.find('.emrWidget-content[_contenteditable="false"]').attr('contenteditable', 'false');

        _t.updateEditSpaceContainerStyle();

        // 当设置内容之后不能马上分页, 得等待病程排序完成
        if (CKEDITOR.plugins.pagebreakCmd) {
            CKEDITOR.plugins.pagebreakCmd.currentOperations.setContent = false;
        }
        // 设置只有一个 emrWidget 时，禁用 hover 效果
        if ($body.find('.emrWidget').length == 1) {
            $body.addClass('only-one-widget');
        } else {
            $body.removeClass('only-one-widget');
        }
        // 将滚动条置顶
        _t.editor.document.$.documentElement.scrollTop = 0;
    },
    /**
     * 渲染数据
     * @param {*} data
     */
    renderData: function (data) {
        var _t = this;

        // 如果开启了实时分页,先移除所有分页
        if (_t.editor.HMConfig.realtimePageBreak) {
            // 保存当前快照
            _t.editor.fire('saveSnapshot', {
                name: 'beforeRenderData',
                tagName: 'beforeRenderData'
            });

            // 移除所有分页
            CKEDITOR.plugins.pagebreakCmd.removeAllSplitters(_t.editor);
        }

        // 遍历数据数组
        data.forEach(function (item) {
            if (item.code) {
                // 查找具有相同 doc_code 属性的节点
                var $nodes = $(_t.editor.document.$).find('[doc_code="' + item.code + '"]');
                // 如果找到节点，更新其内容
                if ($nodes.length > 0) {
                    $nodes.each(function () {
                        var $node = $(this);
                        // 处理普通数据元
                        if (item.data) {
                            item.data.forEach(function (dataItem) {
                                // 检查是否是表格类型数据
                                if (dataItem.keyCode && dataItem.keyCode.indexOf('TABLE_') === 0) {
                                    // 如果是表格数据，使用_renderTableData处理
                                    // 从keyCode中提取表格名称（去掉TABLE_前缀）
                                    var tableName = dataItem.keyCode.substring(6);
                                    _t._renderTableData($node, dataItem.keyValue, tableName);
                                    return;
                                } else {
                                    _t._bindDataItem($node, dataItem);
                                }
                            });
                        }
                        // 勾选「默认当前时间」(_autoshowcurtime) 的 timebox：无业务值时补当前时间（含未出现在 data 中的项）
                        _t._applyTimeboxAutoshowCurtime($node);
                    });
                }
            }
        });

        // 如果开启了实时分页,渲染完成后重新进行分页
        if (_t.editor.HMConfig.realtimePageBreak) {
            // 执行分页
            CKEDITOR.plugins.pagebreakCmd.performAutoPaging(_t.editor, {
                name: '渲染数据后分页',
                data: {
                    source: 'renderData'
                }
            });

            // 保存分页后的快照
            _t.editor.fire('saveSnapshot', {
                name: 'afterRenderData',
                tagName: 'afterRenderData'
            });
        }

        // 数据渲染完成后，检查是否有新的图片需要初始化
        console.log('数据渲染完成，检查图片元素:', $(_t.editor.document.$).find('[data-hm-image-resizable="true"]').length);

        // 为现有的图片widget添加拖拽功能（如果还没有的话）
        _t.initExistingImageResizers($(_t.editor.document.getBody().$));
        // 调用文档加载完成回调
        if (typeof window.onDocumentLoad === 'function') {
            try {
                window.onDocumentLoad();
            } catch (error) {
                console.error('onDocumentLoad 执行失败:', error);
            }
        }
    },

    /**
     * 渲染列表类表格
     * @param {jQuery} $node 包列表类表格的节点
     * @param {Array} tableData 表格数据二维数组
     * @param {String} tableName 表格名称
     */
    _renderTableData: function ($node, tableData, tableName) {
        var _t = this;
        console.log('开始处理表格数据，数据行数:', tableData.length, '表格名称:', tableName);

        try {
            // 根据表格名称查找列表类表格
            var $table = $node.find('table[data-hm-datatable="' + tableName + '"][data-hm-table-type="list"]');
            if ($table.length === 0) {
                console.warn('未找到表格名称为 ' + tableName + ' 的列表类表格');
                return;
            }
            var $tbody = $table.find('tbody');
            if ($tbody.length === 0) {
                console.warn('列表类表格中未找到tbody');
                return;
            }
            // 获取表格的evaluate-type属性
            var evaluateType = $table.attr('evaluate-type');
            console.log('表格evaluate-type:', evaluateType);

            if (evaluateType === 'row') {
                // 新的行模式逻辑（按列处理）
                _t._renderTableDataByColumn($table, $tbody, tableData);
            } else {
                // 使用列模式 
                _t._renderTableDataByRow($table, $tbody, tableData);
            }
            console.log('列表类表格数据渲染完成');
        } catch (error) {
            console.error('渲染列表类表格数据时发生错误:', error);
        }
    },

    /**
     * 按行渲染表格数据（原有的列模式逻辑）
     * @param {jQuery} $table 表格元素
     * @param {jQuery} $tbody 表格体元素
     * @param {Array} tableData 表格数据
     */
    _renderTableDataByRow: function ($table, $tbody, tableData) {
        var _t = this;
        // 获取现有行数和需要的行数
        var $existingRows = $tbody.find('tr');
        var existingRowCount = $existingRows.length;
        var requiredRowCount = tableData.length;

        console.log('现有行数:', existingRowCount, '需要行数:', requiredRowCount);

        // 如果需要更多行，则添加新行
        if (requiredRowCount > existingRowCount) {
            var rowsToAdd = requiredRowCount - existingRowCount;
            console.log('需要添加', rowsToAdd, '行');

            for (var i = 0; i < rowsToAdd; i++) {
                _t._addTableRow($tbody.find('tr').last());
            }
        }

        // 重新获取所有行（包括新添加的）
        var $allRows = $tbody.find('tr');

        // 按行渲染护理数据
        tableData.forEach(function (rowData, rowIndex) {
            if (rowIndex < $allRows.length) {
                var $currentRow = $allRows.eq(rowIndex);
                console.log('渲染第' + rowIndex + '行表格数据，数据项数量:', rowData.length);

                // 渲染当前行的所有数据项
                rowData.forEach(function (dataItem) {
                    _t._bindTableDataToRow($currentRow, dataItem);
                });
            }
        });
    },

    /**
     * 按列渲染表格数据（新的行模式逻辑）
     * @param {jQuery} $table 表格元素
     * @param {jQuery} $tbody 表格体元素
     * @param {Array} tableData 表格数据
     */
    _renderTableDataByColumn: function ($table, $tbody, tableData) {
        var _t = this;

        // 获取现有行（第一行作为模板）
        var $firstRow = $tbody.find('tr:first');
        if ($firstRow.length === 0) {
            console.warn('表格中没有行，无法处理');
            return;
        }
        // 需要验证表格中是否存在数据列
        // 如果第一行的td数量小于等于1（仅有标题列），则无需渲染
        var $existingDataCells = $firstRow.find('td:not(.hm-table-horizontal-header)');
        if ($existingDataCells.length < 1) {
            console.warn('表格中没有可渲染的数据列，仅有标题列');
            return;
        }
        // 获取除标题列之外的列数（假设第一列是标题列）
        var $existingCells = $firstRow.find('td:not(.hm-table-horizontal-header)');
        var existingColumnCount = $existingCells.length;
        var requiredColumnCount = tableData.length;

        console.log('现有列数（除标题列）:', existingColumnCount, '需要列数:', requiredColumnCount);

        // 如果需要更多列，则添加新列
        if (requiredColumnCount > existingColumnCount) {
            var columnsToAdd = requiredColumnCount - existingColumnCount;
            console.log('需要添加', columnsToAdd, '列');
            // 需要添加的列数
            for (var i = 0; i < columnsToAdd; i++) {
                _t._addTableColumn($table);
            }
        }

        // 重新获取所有行
        var $allRows = $tbody.find('tr');
        var headerCellsCount = $firstRow.find('td.hm-table-horizontal-header').length;

        // 按列渲染数据
        tableData.forEach(function (columnData, columnIndex) {
            // 跳过标题列，所以列索引需要+1
            var actualColumnIndex = headerCellsCount; // 从标题行数开始计算列索引

            console.log('渲染第' + actualColumnIndex + '列表格数据，数据项数量:', columnData.length);

            // 遍历所有行，渲染对应列的数据
            $allRows.each(function (rowIndex) {
                var $currentRow = $(this);
                // 获取当前行对应列的单元格
                var $currentCell = $currentRow.find('td:not(.hm-table-horizontal-header)').eq(columnIndex);

                if ($currentCell.length > 0 && rowIndex < columnData.length) {
                    var dataItem = columnData[rowIndex];
                    if (dataItem) {
                        _t._bindDataItem($currentCell, dataItem);
                    }
                }
            });
        });
    },

    /**
     * 添加表格列（用于evaluate-type="row"模式）
     * @param {jQuery} $table 表格元素
     * @param {jQuery} $templateCell 模板单元格元素
     */
    _addTableColumn: function ($table) {
        var _t = this;
        try {
            var $tbody = $table.find('tbody');
            if (!$tbody.length) {
                console.warn('无法找到表格体元素');
                return;
            }
            // 遍历所有行，在模板单元格后插入新的td
            $tbody.find('tr').each(function () {
                var $tr = $(this);
                var $templateCell = $tr.find('td:not(.hm-table-horizontal-header)').last();

                // 创建新的td元素，复制模板td的结构
                var $newTd = $templateCell.clone();

                // 清空新td中的内容，参考_addTableCell的清空逻辑
                $newTd.find('.new-textbox-content').each(function () {
                    var $textbox = $(this);
                    if ($textbox.attr('_placeholder') && $textbox.attr('_placeholder') != '') {
                        $textbox.text($textbox.attr('_placeholder'));
                        $textbox.attr('_placeholdertext', 'true');
                    } else {
                        $textbox.text('');
                        $textbox.removeAttr('_placeholdertext');
                    }
                });

                // 清空单选/复选：仅处理 _selected="true" 的选项节点，避免误改外层容器
                $newTd.find('span[data-hm-node="radiobox"][_selected="true"]:not([data-hm-node="labelbox"])').removeClass('fa-dot-circle-o').addClass('fa-circle-o').removeAttr('_selected');
                $newTd.find('span[data-hm-node="checkbox"][_selected="true"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').removeAttr('_selected');

                // 清空时间选中状态
                $newTd.find('[data-hm-node=timebox]').html('&nbsp;');

                // 清空下拉框选中值
                $newTd.find('select').prop('selectedIndex', 0);

                // 清空普通文本内容
                if (!$newTd.find('[data-hm-node]').length) {
                    $newTd.empty();
                    // 添加<br>标签，避免单元格无高度
                    $newTd.append('<br>');
                }

                // 移除操作图标
                $newTd.find('.table-row-actions, .table-cell-actions').remove();

                // 在模板单元格后插入新的td
                $templateCell.after($newTd);
            });

            // 重新计算colgroup的宽度
            _t._updateTableColgroup($table);

        } catch (error) {
            console.warn('添加表格列时发生错误:', error);
        }
    },

    /**
     * 通用数据元绑定方法
     * @param {jQuery} $container 搜索容器（可以是$node或$row）
     * @param {Object} dataItem 数据项
     */
    _bindDataItem: function ($container, dataItem) {
        var _t = this;

        if (!dataItem.keyCode && !dataItem.keyName) return;

        try {
            var datasourceNode;
            // 优先通过 keyCode 查找 data-hm-code 属性
            datasourceNode = $container.find('[data-hm-code="' + dataItem.keyCode + '"]:not([data-hm-node="labelbox"])');
            // 如果通过 keyCode 没找到，则通过 keyName 查找 data-hm-name 属性
            if ((!datasourceNode || datasourceNode.length === 0) && dataItem.keyName) {
                datasourceNode = $container.find('[data-hm-name="' + dataItem.keyName + '"]:not([data-hm-node="labelbox"])');
            }
            // 如果通过 keyCode、keyName 都没找到，则验证本身是否是数据元节点 cellbox类型，在表格中绑定在td本身了
            if (!datasourceNode || datasourceNode.length === 0) {
                if ($container.attr('data-hm-code') == dataItem.keyCode || $container.attr('data-hm-name') == dataItem.keyName) {
                    datasourceNode = $container;
                }
            }

            if (datasourceNode.length > 0) {
                // 获取节点类型
                var nodeType = datasourceNode.attr('data-hm-node');
                var bindVal = dataItem.keyValue;
                // 当 keyValue 是数字 0 或 false 时，先转为字符串再参与后续判断，避免被当作 falsy 忽略
                if (bindVal === 0 || bindVal === false) {
                    bindVal = String(bindVal);
                }
                var imgFlag = false;
                var contentArray = [];

                // 处理不同类型的bindVal数据
                if (Array.isArray(bindVal)) {
                    // 处理数组类型数据（普通数据元可能有此情况）
                    bindVal.forEach(function (item) {
                        if (typeof item === 'string') {
                            // 处理字符串
                            item = item.replace(/↵/g, '<br/>');
                            var stringResult = _t.processStringImage(item);
                            contentArray.push(stringResult.value);
                            if (stringResult.imgFlag) {
                                imgFlag = true;
                            }
                        } else if (typeof item === 'object' && item !== null) {
                            // 处理对象（图片对象、expressionbox对象等）
                            var objectResult = _t.processObjectItem(item,$container);
                            if (objectResult.imgFlag) {
                                imgFlag = true;
                            }
                            if (objectResult.html) {
                                contentArray.push(objectResult.html);
                            }
                        } else {
                            contentArray.push(String(item));
                        }
                    });
                    bindVal = contentArray.join('');
                } else if (typeof bindVal === 'string') {
                    // 处理单个字符串
                    bindVal = bindVal.replace(/↵/g, '<br/>');
                    var stringResult = _t.processStringImage(bindVal);
                    bindVal = stringResult.value;
                    if (stringResult.imgFlag) {
                        imgFlag = true;
                    }
                }

                // 绑定数据到数据源节点
                _t.bindDatasource(datasourceNode, nodeType, bindVal, imgFlag);
            } else {
                console.warn('未找到匹配的数据元:', dataItem.keyCode, dataItem.keyName);
            }

        } catch (error) {
            console.error('绑定数据时发生错误:', error);
        }
    },

    /**
     * 将表格数据绑定到指定行
     * @param {jQuery} $row 表格行元素
     * @param {Object} dataItem 数据项
     */
    _bindTableDataToRow: function ($row, dataItem) {
        var _t = this;
        _t._bindDataItem($row, dataItem);
    },
    // 设置数据元的值
    bindDatasource: function (datasourceNode, nodeType, bindVal, imgFlag) {
        var _t = this;
        switch (nodeType) {
            case 'newtextbox':
                var _placeholder = datasourceNode.attr('_placeholder') || '';
                var newtextboxcontent = datasourceNode.find("span.new-textbox-content");
                if (newtextboxcontent.length > 0) {
                    if (!imgFlag) {
                        bindVal = wrapperUtils.formatTimeTextVal(bindVal, newtextboxcontent.attr('_timetype'));
                    }
                    if (bindVal) {
                        newtextboxcontent.removeAttr('_placeholdertext');
                    } else {
                        newtextboxcontent.attr('_placeholdertext', 'true');
                    }
                    var _texttype = newtextboxcontent.attr('_texttype');


                    // 处理二维码生成
                    if (_texttype == '二维码' && bindVal && !imgFlag) {
                        var qrcodeWidth = newtextboxcontent.attr('_qrcode_width') || '100';
                        var qrcodeHeight = newtextboxcontent.attr('_qrcode_height') || '100';
                        var errorLevel = newtextboxcontent.attr('_qrcode_error_level') || 'M';
                        var textPosition = newtextboxcontent.attr('_qrcode_text_position') || 'bottom';

                        // 使用通用二维码生成方法
                        _t.generateQrcode({
                            text: bindVal,
                            width: qrcodeWidth,
                            height: qrcodeHeight,
                            errorLevel: errorLevel,
                            textPosition: textPosition,
                            container: newtextboxcontent
                        }).catch(function (error) {
                            console.error('二维码生成失败:', error);
                            // 保持原有的容错处理
                            newtextboxcontent.html(bindVal);
                        });
                    }
                    // 处理条形码生成  
                    else if (_texttype == '条形码' && bindVal && !imgFlag) {
                        var barcodeWidth = newtextboxcontent.attr('_barcode_width') || '200';
                        var barcodeHeight = newtextboxcontent.attr('_barcode_height') || '50';
                        var barWidth = newtextboxcontent.attr('_barcode_bar_width') || '2';
                        var textPosition = newtextboxcontent.attr('_barcode_text_position') || 'bottom';

                        // 使用同步条形码生成方法
                        try {
                            if (_t.generateBarcodeSync) {
                                var barcodeHTML = _t.generateBarcodeSync({
                                    text: bindVal,
                                    width: barcodeWidth,
                                    height: barcodeHeight,
                                    barWidth: barWidth,
                                    textPosition: textPosition
                                });
                                newtextboxcontent.html(barcodeHTML);
                                console.log('数据绑定条形码生成成功:', bindVal);
                            } else {
                                console.warn('同步条形码生成方法不可用，使用文本显示');
                                newtextboxcontent.html(bindVal);
                            }
                        } catch (error) {
                            console.error('条形码生成失败:', error);
                            // 保持原有的容错处理
                            newtextboxcontent.html(bindVal);
                        }
                    } else {
                        if (_texttype == '下拉' && bindVal) {
                            var selectType = newtextboxcontent.attr('_selectType');
                            var jointsymbol = newtextboxcontent.attr('_jointSymbol') || ',';
                            var items = newtextboxcontent.attr('data-hm-items').split('#');
                            // 判断是否是带编码选项
                            var items0 = items[0].match(/(.+)\((.*?)\)\s*$/);
                            if (items0 && items0.length == 3) {
                                // 带编码选项，绑定code和value值 （移除之前根据value查找code 逻辑）
                                if (selectType == '单选') {
                                    newtextboxcontent.attr('code', bindVal.code);
                                    newtextboxcontent.html(bindVal.value);
                                } else {
                                    newtextboxcontent.attr('code', bindVal.code && bindVal.code.join(jointsymbol));
                                    newtextboxcontent.html(bindVal.value && bindVal.value.join(jointsymbol));
                                }
                            } else { // 不带编码选项
                                newtextboxcontent.html(bindVal.value || bindVal.code); // 直接绑定bindVal的value或code值
                            }
                        } else { // 除下拉以外的类型，直接绑定bindVal值
                            newtextboxcontent.html(bindVal || _placeholder);
                        }
                    }
                    _handleRelevance(datasourceNode);
                }
                break;
            case 'dropbox':
                datasourceNode.text(bindVal.value || bindVal);
                break;
            case 'timebox':
                try {
                    var _timeoption = datasourceNode.attr('_timeoption');
                    if (datasourceNode.attr('_autoshowcurtime') === 'true' && _t._isTimeboxBindValEmpty(bindVal)) {
                        bindVal = new Date();
                    }
                    bindVal = _t.formatStringDate(bindVal, _timeoption);
                } catch (e) {
                    console.log(bindVal);
                    console.log(e);
                }
                datasourceNode.text(bindVal);
                break;
            case 'searchbox':
                // var searchOption = datasourceNode.attr('_searchoption') || '';
                // var searchpair = (datasourceNode.attr('_searchpair') || '').replace(/\u200B/g, '');
                // var searchpairVal = _t.genericDataConvert(bindVal, searchpair);

                // function setupSearchbox() {
                //     datasourceNode.text(bindVal.value);
                //     var searchPairIsCode = true;
                //     if (searchOption.indexOf('码') > 0) {
                //         // 当前搜索数据元为编码类数据元
                //         searchPairIsCode = false;
                //     }
                //     if (searchPairIsCode) {
                //         datasourceNode.attr('_code', searchpairVal);
                //         datasourceNode.attr('_name', bindVal.value);
                //     } else {
                //         datasourceNode.attr('_code', bindVal.value);
                //         datasourceNode.attr('_name', searchpairVal);
                //     }
                // }
                // setupSearchbox();
                datasourceNode.text(bindVal.value);
                datasourceNode.attr('_code', bindVal.code);
                datasourceNode.attr('_name', bindVal.value);
                break;
            case 'labelbox':
                var bindable = datasourceNode.attr('_bindable');
                if (bindable) {
                    datasourceNode.text(bindVal);
                }
                break;
            case 'cellbox':
                datasourceNode.text(bindVal);
                break;
            case 'checkbox':
                // 多选 bindVal 是数组 
                var codeArr = bindVal.code;
                var valArr = bindVal.value;
                var newArr = [];
                for (var i = 0; i < valArr.length; i++) {
                    var codeItem = codeArr && codeArr[i];
                    newArr.push(codeItem ? valArr[i] + '(' + codeItem + ')' : valArr[i]);
                }
                var $ds = datasourceNode;
                $ds.find('span[data-hm-node="checkbox"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').removeAttr('_selected');
                for (var j = 0; j < newArr.length; j++) {
                    // 对值进行转义处理
                    var escapedVal = newArr[j].replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
                    $ds.find('[data-hm-itemname="' + escapedVal + '"]:not([data-hm-node="labelbox"])').removeClass('fa-square-o').addClass('fa-check-square-o').attr('_selected', 'true');
                }
                break;
            case 'radiobox':
                var $ds = datasourceNode;
                var val = bindVal.code ? bindVal.value + '(' + bindVal.code + ')' : bindVal.value;
                $ds.find('span[data-hm-node="radiobox"]:not([data-hm-node="labelbox"])').removeClass('fa-dot-circle-o').addClass('fa-circle-o').removeAttr('_selected');
                var escapedVal = val.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
                $ds.find('span[data-hm-node="radiobox"][data-hm-itemname="' + escapedVal + '"]:not([data-hm-node="labelbox"])').addClass('fa-dot-circle-o').attr('_selected', 'true');
                break;
            case 'textboxwidget':
                var $ds = datasourceNode;
                $ds.text(bindVal);
                break;
        }

        // 数据绑定完成后，调用元素变化回调
        if (typeof window.onElementChange === 'function') {
            try {
                // 将 jQuery 对象转换为原生 DOM 元素
                var element = datasourceNode.length > 0 ? datasourceNode[0] : datasourceNode;
                window.onElementChange(element);
            } catch (error) {
                console.error('onElementChange 执行失败:', error);
            }
        }
    },

    genericDataConvert: function (data, name) {
        if (!data) return "";
        if (!name) return '';
        var syntaxNames = "";
        if (name) {
            syntaxNames = name.split(/\.|(\[.*?\])/g);
        }
        var retObj = data;


        function extraVal(currentData, currentSyntaxName) {
            if (currentSyntaxName && currentSyntaxName != "") {
                var syntaxName = currentSyntaxName.replace(/\[|\]|"/g, '');
                if (currentData[syntaxName]) {
                    var retVal = currentData[syntaxName];
                    if (!retVal || retVal == "null") {
                        retVal = "";
                    }
                    retObj = retVal;
                } else {
                    retObj = "";
                }
            }
        }

        for (var i = 0; i < syntaxNames.length; i++) {
            extraVal(retObj, syntaxNames[i]);
        }

        return retObj;

    },
    formatStringDate: function (date, _timeoption) {
        if (!date) {
            return date;
        }
        if (typeof (date) == 'string' && date.indexOf('年') > -1) {
            date = date.replace('年', '-').replace('月', '-').replace('日', ' ').replace('时', ':').replace('分', '');
        }

        if (!date || !this.checkDate(date)) {
            return date;
        }
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = '' + d.getFullYear(),
            hour = '' + d.getHours(),
            minute = '' + d.getMinutes(),
            second = '' + d.getSeconds();
        var resultDate = "";
        switch (_timeoption) {
            case 'datetime':
                var timeleft = this.spliceTime([year, month, day], "-");
                var timeRight = this.spliceTime([hour, minute], ":");
                resultDate = timeleft + " " + timeRight;
                break;
            case 'time':
                resultDate = this.spliceTime([hour, minute], ":");
                break;
            case 'month_day':
                resultDate = this.spliceTime([month, day], "-");
                break;
            case 'date':
                resultDate = this.spliceTime([year, month, day], '-');
                break;
            case 'date_han':
                if (month.length < 2) {
                    month = '0' + month;
                }
                if (day.length < 2) {
                    day = '0' + day;
                }
                resultDate = year + '年' + month + '月' + day + '日';
                break;
            case 'datetime_han':
                if (month.length < 2) {
                    month = '0' + month;
                }
                if (day.length < 2) {
                    day = '0' + day;
                }
                if (hour.length < 2) {
                    hour = '0' + hour;
                }
                if (minute.length < 2) {
                    minute = '0' + minute;
                }
                resultDate = year + '年' + month + '月' + day + '日' + hour + '时' + minute + '分';
                break;
            case 'fullDateTime':
                if (month.length < 2) {
                    month = '0' + month;
                }
                if (day.length < 2) {
                    day = '0' + day;
                }
                if (hour.length < 2) {
                    hour = '0' + hour;
                }
                if (minute.length < 2) {
                    minute = '0' + minute;
                }
                if (second.length < 2) {
                    second = '0' + second;
                }
                resultDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
                break;
            case 'fullTime':
                if (hour.length < 2) {
                    hour = '0' + hour;
                }
                if (minute.length < 2) {
                    minute = '0' + minute;
                }
                if (second.length < 2) {
                    second = '0' + second;
                }
                resultDate = hour + ':' + minute + ':' + second;
                break;
            case 'year_month':
                resultDate = this.spliceTime([year, month], "-");
                break;
        }
        return resultDate ? resultDate : "";
    },
    spliceTime: function (date, sperator) {
        for (var index = 0; index < date.length; index++) {
            var element = date[index];
            if (element.length < 2) {
                element = '0' + element;
            }
            date[index] = element;
        }
        return date.join(sperator);
    },
    checkDate: function (dateStr) {
        var date = new Date(dateStr);

        if (!date || 'Invalid Date' == date || 'undefined' == date || 'null' == date) {
            return false;
        } else {
            return true;
        }
    },
    /**
     * 时间框展示是否视为「无值」（与 handleTimeBox 取值的空白处理一致）
     * @param {string} text
     * @returns {boolean}
     */
    _isTimeboxDisplayEmpty: function (text) {
        if (text === undefined || text === null) {
            return true;
        }
        var v = String(text).replace(/\u200B/g, '').replace(/\u3000/g, '');
        v = v.replace(/\u00a0/g, ' ').trim();
        return v.length === 0;
    },
    /**
     * setDocData 绑定的 keyValue 是否视为空（需补默认当前时间）
     * @param {*} bindVal
     * @returns {boolean}
     */
    _isTimeboxBindValEmpty: function (bindVal) {
        if (bindVal === undefined || bindVal === null) {
            return true;
        }
        if (typeof bindVal === 'string') {
            return this._isTimeboxDisplayEmpty(bindVal);
        }
        return false;
    },
    /**
     * 文档加载后：对勾选 _autoshowcurtime 且仍无展示值的时间框填入当前时间（按 _timeoption 格式化）
     * @param {jQuery} $root 单个文档片段（doc_code 对应节点）
     */
    _applyTimeboxAutoshowCurtime: function ($root) {
        var _t = this;
        $root.find('span[data-hm-node="timebox"][_autoshowcurtime="true"]').each(function () {
            var $el = $(this);
            if (_t._isTimeboxDisplayEmpty($el.text())) {
                var opt = $el.attr('_timeoption');
                var formatted = _t.formatStringDate(new Date(), opt);
                if (formatted) {
                    $el.text(formatted);
                }
            }
        });
    },
    /**
     * 初始化将带有不可编辑属性数据元状态置为不可编辑状态
     * @param {jQuery} $body 编辑器body元素
     */
    initDisabledDatasourceState: function ($body) {
        var _t = this;
        _t.initDisabled($body);
        _t.initWriteAble($body);
    },
    /**
     * 初始化禁用状态
     * @param {jQuery} $body 编辑器body元素
     */
    initDisabled: function ($body) {
        var disableDataSource = $body.find('[_isdisabled="true"]');
        if (disableDataSource.length == 0) {
            return;
        }
        for (var i = 0; i < disableDataSource.length; i++) {
            var _dataSource = $(disableDataSource[i]);
            var nodeType = _dataSource.attr("data-hm-node");
            if ('newtextbox' == nodeType) {
                _dataSource.find('.new-textbox-content').attr('contenteditable', 'false');
            } else {
                _dataSource.css('pointer-events', 'none');
            }
        }
    },
    /**
     * 初始化可写状态
     * @param {jQuery} $body 编辑器body元素
     */
    initWriteAble: function ($body) {
        var disableDataSource = $body.find('span[data-hm-node=newtextbox]');
        for (var i = 0; i < disableDataSource.length; i++) {
            var _dataSource = $(disableDataSource[i]);
            var type = _dataSource.attr("_texttype");
            if (type == '诊断' || type == '手术' || type == '下拉') {
                if (_dataSource.attr("_writeable") != 'true') {
                    _dataSource.find('.new-textbox-content').attr('contenteditable', 'false');
                    _dataSource.attr('notallowwrite', "true");
                }
            }
        }
    },
    /**
     * 初始化文档事件
     * @param {jQuery} $body 编辑器body元素
     */
    initDocumentFireEvt: function ($body) {
        var _t = this;

        //显示所有的placehlder
        var editable = _t.editor.editable();
        editable.fire('togglePlaceHolder', {
            'showAllPlaceholder': true
        });

        //初始化所有textbox-widget
        $body.find('.textboxWidget').each(function () {
            _t.editor.widgets.initOn(new CKEDITOR.dom.element(this), 'textboxWidget');
        });
        $body.find('.emrWidget').each(function () {
            _t.editor.widgets.initOn(new CKEDITOR.dom.element(this), 'emrWidget');
        });

        // 为现有的图片添加拖拽功能
        _t.initExistingImageResizers($body);

        // 阻止图片的默认拖拽行为
        $body.on('dragstart', '[data-hm-image-resizable="true"] img', function (evt) {
            evt.preventDefault();
            return false;
        });

        // 使用事件委托方式绑定图片拖拽改变尺寸功能
        $body.on('mousedown', '[data-hm-image-resizable="true"] .cke_image_resizer', function (evt) {
            console.log('图片拖拽事件触发'); // 调试信息
            evt.preventDefault();
            evt.stopPropagation();

            var $resizer = $(this);
            var $imageWrapper = $resizer.closest('[data-hm-image-resizable="true"]');
            var $image = $imageWrapper.find('img');

            if ($image.length === 0) {
                console.log('未找到图片元素'); // 调试信息
                return;
            }

            console.log('开始拖拽，图片尺寸:', $image[0].clientWidth, 'x', $image[0].clientHeight); // 调试信息

            var image = $image[0];
            var startX = evt.originalEvent.screenX;
            var startY = evt.originalEvent.screenY;
            var startWidth = image.clientWidth;
            var startHeight = image.clientHeight;
            var ratio = startWidth / startHeight;

            // 添加拖拽样式类
            $body.addClass('cke_image_resizing');
            $resizer.addClass('cke_image_resizing');

            var newWidth, newHeight, updateData;
            var listeners = [];

            // 鼠标移动处理
            function onMouseMove(e) {
                console.log('鼠标移动事件触发'); // 调试信息
                var nativeEvt = e.data.$;
                var moveDiffX = nativeEvt.screenX - startX;
                var moveDiffY = startY - nativeEvt.screenY;

                // 计算新尺寸，优先基于宽度计算
                newWidth = startWidth + moveDiffX;
                newHeight = Math.round(newWidth / ratio);

                console.log('计算新尺寸:', newWidth, 'x', newHeight); // 调试信息

                // 限制最小尺寸
                if (newWidth >= 15 && newHeight >= 15) {
                    $image.attr({
                        'width': newWidth,
                        'height': newHeight
                    });
                    $image.css({
                        'width': newWidth + 'px',
                        'height': newHeight + 'px'
                    });
                    updateData = true;
                } else {
                    updateData = false;
                }
            }

            // 鼠标释放处理
            function onMouseUp(e) {
                console.log('拖拽结束，最终尺寸:', newWidth, 'x', newHeight); // 调试信息

                // 移除事件监听器
                var l;
                while ((l = listeners.pop())) {
                    l.removeListener();
                }

                // 移除拖拽样式类
                $body.removeClass('cke_image_resizing');
                $resizer.removeClass('cke_image_resizing');

                // 如果尺寸有效，保存最终尺寸
                if (updateData && newWidth && newHeight) {
                    // 触发编辑器变化事件
                    if (_t.editor && _t.editor.fire) {
                        _t.editor.fire('change');
                    }
                }

                updateData = false;
            }

            // 参考plugin.js的attachToDocuments实现
            function attachToDocuments(name, callback, collection) {
                var globalDoc = CKEDITOR.document,
                    doc = _t.editor.document,
                    listeners = [];

                if (!doc.equals(globalDoc)) {
                    listeners.push(globalDoc.on(name, callback));
                }
                listeners.push(doc.on(name, callback));

                if (collection) {
                    for (var i = listeners.length; i--;) {
                        collection.push(listeners.pop());
                    }
                }
            }

            // 绑定鼠标事件
            attachToDocuments('mousemove', onMouseMove, listeners);
            attachToDocuments('mouseup', onMouseUp, listeners);

            // 触发保存快照
            if (_t.editor && _t.editor.fire) {
                // _t.editor.fire('saveSnapshot');
            }
        });

        // 单选 & 多选初始添加级联事件
        $body.find("[data-hm-node=radiobox]").each(function () {
            $(this).on('click', function () {
                console.log('******单选事件触发*******');
                _handleCascade(this);
                // 调用元素变化回调
                if (typeof window.onElementChange === 'function') {
                    try {
                        // 找到对应的数据元素节点
                        var $datasourceNode = $(this).closest('[data-hm-node="radiobox"]');
                        if ($datasourceNode.length === 0) {
                            $datasourceNode = $(this).closest('[data-hm-code], [data-hm-name]');
                        }
                        var element = $datasourceNode.length > 0 ? $datasourceNode[0] : this;
                        window.onElementChange(element);
                    } catch (error) {
                        console.error('onElementChange 执行失败:', error);
                    }
                }
            });
        });
        $body.find("[data-hm-node=checkbox]").each(function () {
            $(this).on('click', function () {
                _handleCascade(this);
                // 调用元素变化回调
                if (typeof window.onElementChange === 'function') {
                    try {
                        // 找到对应的数据元素节点
                        var $datasourceNode = $(this).closest('[data-hm-node="checkbox"]');
                        if ($datasourceNode.length === 0) {
                            $datasourceNode = $(this).closest('[data-hm-code], [data-hm-name]');
                        }
                        var element = $datasourceNode.length > 0 ? $datasourceNode[0] : this;
                        window.onElementChange(element);
                    } catch (error) {
                        console.error('onElementChange 执行失败:', error);
                    }
                }
            });
        });
        $body.on('click', 'div[data-hm-widgetid]', function () {
            // 获取父窗口的window对象
            var parentWindow = window.parent || window.top;
            var widgetId = $(this).attr('data-hm-widgetid').trim();
            parentWindow.lastClickedDocCode = widgetId;
            if (_t.editor.HMConfig.designMode) { // 设计模式下不触发
                return;
            }
            if ($(this).attr('contenteditable') == 'false') {
                return;
            }
            if (!window.hmEditor.hmAi.awekenAiWidget[$(this).attr('data-hm-widgetid')]) {
                console.log('点击了widget');
                _t._handleEditorTool(this);
            }
        });
        // $body.find('table[data-hm-datatable][data-hm-table-type="list"]').on('mouseleave','tbody tr',function(){
        var colTable = 'table[data-hm-datatable][data-hm-table-type="list"][evaluate-type="col"]';
        var rowTable = 'table[data-hm-datatable][data-hm-table-type="list"][evaluate-type="row"]';
        $body.on('mouseleave', colTable + ' tbody tr', function () {
                $body.find('.table-row-actions').remove();
            }).on('mouseenter.tableActions', colTable + ' tbody tr', function (event) {
                // 使用 event.target 来获取实际触发的元素
                var $tr = $(event.target).closest('tr');
                _t._handleTrMouseEnter($tr[0], $tr.index());
            }).off('click.tableActions', colTable + ' .add-row-icon')
            .on('click.tableActions', colTable + ' .add-row-icon', function (e) {
                e.stopPropagation();
                e.preventDefault();
                _t._addTableRow($(this).closest('tr'));
            }).on('click.tableActions', colTable + ' .delete-row-icon', function (e) {
                e.stopPropagation();
                e.preventDefault();
                _t._deleteTableRow($(this).closest('tr'));
            }).on('mouseenter.tableActions', rowTable + ' td:not(.hm-table-horizontal-header)', function (event) {
                var index = $(this).index();
                _t._handleTdMouseEnter($(this)[0], index);
            }).off('click.tableActions', rowTable + ' .add-row-icon').on('click.tableActions', rowTable + ' .add-row-icon', function (e) {
                e.stopPropagation();
                e.preventDefault();
                _t._addTableCell($(this).parents('td'));
            }).on('click.tableActions', rowTable + ' .delete-row-icon', function (e) {
                e.stopPropagation();
                e.preventDefault();
                _t._deleteTableCell($(this).parents('td'));
            }).on('mouseleave', rowTable + ' tbody td', function () {
                $body.find('.table-cell-actions').remove();
            });

        // 修订悬停：hm_revise_del / hm_revise_ins 悬停时在下方显示修改人及修改内容
        _t._initReviseHoverTooltip($body);

        // 检查是否存在护理表单表格，如果存在则初始化日期导航功能
        var nursingFormTables = $body.find('table[data-hm-datatable][data-hm-table-type="list"][evaluate-type="col"]');
        if (nursingFormTables.length > 0) {
            console.log('检测到护理表单表格，初始化日期导航功能');
            _t._initDateNavigation($body);
        } else {
            console.log('未检测到护理表单表格，跳过日期导航功能初始化');
        } 

        // 监听可编辑内容的自定义事件（input/click/dblclick -> onElementChange/onElementClick/onElementDbclick）
        _t._initContentEditableElementEvents($body);
    },

    /**
     * 为 contenteditable 元素绑定自定义事件监听（onElementChange / onElementClick / onElementDbclick）
     * @param {jQuery} $body 编辑器 body 元素
     */
    _initContentEditableElementEvents: function ($body) {
        var editableSelector = '[data-hm-node="newtextbox"] [contenteditable="true"], [data-hm-code][contenteditable="true"], [data-hm-name][contenteditable="true"]';
        // 用于存储每个元素的 click 延迟定时器，避免双击时触发单击事件
        var clickTimerMap = {};

        // 监听可编辑内容的变化（适用于 contenteditable 元素）
        // input：用户编辑内容时触发，通知外部 onElementChange（使用 input 而非 change，以便实时捕获 contenteditable 变更）
        $body.on('input', editableSelector, function () {
            // 检查全局 window 对象上是否存在 onElementChange 回调函数（用于处理内容变更）
            if (typeof window.onElementChange === 'function') {
                try {
                    // 获取当前触发 input 事件的元素（通常是最里层的可编辑内容）
                    var $element = $(this);
                    // 向上查找最近的 data-hm-code、data-hm-name 或 data-hm-node 容器节点
                    var $datasourceNode = $element.closest('[data-hm-code], [data-hm-name], [data-hm-node]');
                    // 如果找到了容器节点，则将该节点作为回调参数，否则用当前元素
                    var element = $datasourceNode.length > 0 ? $datasourceNode[0] : this;
                    // 调用全局变更回调，通知外部该元素内容发生变化
                    window.onElementChange(element);
                } catch (error) {
                    // 捕获并打印回调执行异常，避免影响后续逻辑
                    console.error('onElementChange 执行失败:', error);
                }
            }
        });

        // dblclick：双击时触发 onElementDbclick，并取消该元素上待执行的单击定时器，避免单击、双击同时触发
        $body.on('dblclick', editableSelector, function () {
            // 获取当前被双击的元素
            var $element = $(this);
            // 向上查找最近的 data-hm-code、data-hm-name 或 data-hm-node 容器节点
            var $datasourceNode = $element.closest('[data-hm-code], [data-hm-name], [data-hm-node]');
            // 若存在数据节点，则将其 DOM 元素作为事件参数，否则使用当前被双击元素
            var element = $datasourceNode.length > 0 ? $datasourceNode[0] : this;
            // 基于 data-hm-id 属性生成唯一 key，用于管理该元素的点击延时定时器
            var elementKey = 'id_' + $datasourceNode.attr('data-hm-id');

            // 如果存在针对该元素的 click 延时定时器（单击），则双击时需清除，避免单、双击同时触发
            if (clickTimerMap[elementKey]) {
                clearTimeout(clickTimerMap[elementKey]); // 清除单击定时器
                delete clickTimerMap[elementKey];
            }

            // 如果全局 window 对象中声明了 onElementDbclick 方法，则触发双击回调
            if (typeof window.onElementDbclick === 'function') {
                try {
                    window.onElementDbclick(element);
                } catch (error) {
                    // 捕获并打印回调异常，避免影响其他逻辑
                    console.error('onElementDbclick 执行失败:', error);
                }
            }
        });

        // click：单击时延迟 300ms 再触发 onElementClick；若在此时间内发生双击，则由 dblclick 清除定时器，只触发双击回调
        $body.on('click', editableSelector, function () {
            // 判断全局 window 对象中是否声明了 onElementClick 方法（用于处理单击回调）
            if (typeof window.onElementClick === 'function') {
                try {
                    // 获取当前被点击的内容元素
                    var $element = $(this);
                    // 向上查找最近的 data-hm-code、data-hm-name 或 data-hm-node 容器节点
                    var $datasourceNode = $element.closest('[data-hm-code], [data-hm-name], [data-hm-node]');
                    // 若存在数据节点，则将其作为事件回调参数；否则使用当前被点击元素
                    var element = $datasourceNode.length > 0 ? $datasourceNode[0] : this;
                    // 构建唯一 key，便于管理定时器（基于 data-hm-id 属性做区分）
                    var elementKey = 'id_' + $datasourceNode.attr('data-hm-id');

                    // 如果当前元素已存在定时器，先清理，保证只触发一次单击逻辑
                    if (clickTimerMap[elementKey]) {
                        clearTimeout(clickTimerMap[elementKey]);
                    }

                    // 延迟 300ms 后触发单击回调，若双击则会提前清除，不触发单击逻辑
                    clickTimerMap[elementKey] = setTimeout(function () {
                        delete clickTimerMap[elementKey]; // 触发后移除定时器引用
                        window.onElementClick(element);   // 触发外部回调
                    }, 300);
                } catch (error) {
                    // 捕获并输出 onElementClick 回调中的异常，避免影响主逻辑
                    console.error('onElementClick 执行失败:', error);
                }
            }
        });
    },

    _handleTrMouseEnter: function (tr, index) {
        var _t = this;
        try {
            var $tr = $(tr);
            if (!$tr.length) {
                return;
            }
            // 根据所属文档的_readonly属性判断是否显示操作按钮
            var $widget = $tr.closest('[data-hm-widgetid]');
            if ($widget.length && $widget.attr('_readonly') === 'true') {
                return;
            }

            var $tbody = $tr.closest('tbody');
            if (!$tbody.length) {
                return;
            }

            // 移除其他行的操作图标
            $tbody.find('.table-row-actions').remove();

            // 创建操作图标容器
            var $actionsContainerAdd = $('<div class="table-row-actions table-row-actions-add"></div>');
            var $actionsContainerDel = $('<div class="table-row-actions table-row-actions-del"></div>');

            // 获取当前行的总行数
            var totalRows = $tbody.find('tr').length;

            // 添加增加行图标
            var $addIcon = $('<span class="add-row-icon" title="增加行" contenteditable="false"><i class="fa fa-plus-square"></i></span>');

            // 检查当前行是否允许新增，如果不允许则禁用新增按钮
            if ($tr.attr('_row_addable') === 'false') {
                $addIcon.addClass('disabled').attr('title', '该行不允许新增');
            }

            // 添加删除行图标（只有当行数大于1时才显示）
            var $deleteIcon = $('<span class="delete-row-icon" title="删除行" contenteditable="false"><i class="fa fa-minus-square"></i></span>');
            if (totalRows == 1) {
                $deleteIcon.addClass('disabled').attr('title', '至少保留一行');
            }

            // 检查当前行是否允许删除，如果不允许则禁用删除按钮（只读状态不影响删除权限）
            if ($tr.attr('_row_deletable') === 'false') {
                $deleteIcon.addClass('disabled').attr('title', '该行不允许删除');
            }

            $actionsContainerAdd.append($addIcon);
            $actionsContainerDel.append($deleteIcon);

            // 将操作图标添加到当前行
            var $firstTd = $tr.find('td').first();
            var $lastTd = $tr.find('td').last();

            if ($firstTd.length) {
                if ($firstTd.children().length === 0) {
                    $firstTd.append('<span></span>');
                }
                $firstTd.css('position', 'relative').prepend($actionsContainerAdd);
            }
            if ($lastTd.length) {
                if ($lastTd.children().length === 0) {
                    $lastTd.append('<span>\u200B</span>');
                }
                $lastTd.css('position', 'relative').prepend($actionsContainerDel);
            }
        } catch (error) {
            console.warn('处理表格行鼠标进入事件时发生错误:', error);
        }
    },
    _handleTdMouseEnter: function (tr, index) {
        var _t = this;
        try {
            var $tr = $(tr);
            if (!$tr.length) {
                return;
            }
            // 根据所属文档的_readonly属性判断是否显示操作按钮
            var $widget = $tr.closest('[data-hm-widgetid]');
            if ($widget.length && $widget.attr('_readonly') === 'true') {
                return;
            }

            var $tbody = $tr.closest('tbody');
            if (!$tbody.length) {
                return;
            }

            // 移除其他行的操作图标
            $tbody.find('.table-cell-actions').remove();

            // 创建操作图标容器
            var $actionsContainerAdd = $('<div class="table-cell-actions table-cell-actions-add"></div>');
            var $actionsContainerDel = $('<div class="table-cell-actions table-cell-actions-del"></div>');

            // 获取第一行中不包含hm-table-horizontal-header类的td元素数量
            var totalColumns = $tbody.find('tr:first').find('td:not(.hm-table-horizontal-header)').length;

            // 添加增加行图标
            var $addIcon = $('<span class="add-row-icon" title="增加列" contenteditable="false"><i class="fa fa-plus-square"></i></span>');

            // 检查当前位置是否允许新增
            if ($tr.attr('_cell_addable') === 'false') {
                $addIcon.addClass('disabled').attr('title', '该位置不允许新增列');
            }

            // 添加删除行图标（只有当行数大于1时才显示）
            var $deleteIcon = $('<span class="delete-row-icon" title="删除列" contenteditable="false"><i class="fa fa-minus-square"></i></span>');
            if (totalColumns == 1) {
                $deleteIcon.addClass('disabled').attr('title', '至少保留一列');
            }

            // 检查当前位置是否允许删除（只读状态不影响删除权限）
            if ($tr.attr('_cell_deletable') === 'false') {
                $deleteIcon.addClass('disabled').attr('title', '该位置不允许删除列');
            }

            $actionsContainerAdd.append($addIcon);
            $actionsContainerDel.append($deleteIcon);

            // 将操作图标添加到当前行
            var rowsCount = $tbody.find('tr').length;
            var $firstTr = $tbody.find('tr:first').find('td').eq(index);
            var $lastTr = $tbody.find('tr:last').find('td').eq(index);

            if ($firstTr.length) {
                if ($firstTr.children().length === 0) {
                    $firstTr.append('<span></span>');
                }
                $firstTr.css('position', 'relative').prepend($actionsContainerAdd);
            }
            if ($lastTr.length) {
                if ($lastTr.children().length === 0) {
                    $lastTr.append('<span>\u200B</span>');
                }
                $lastTr.css('position', 'relative').prepend($actionsContainerDel);
            }
        } catch (error) {
            console.warn('处理表格行鼠标进入事件时发生错误:', error);
        }
    },
    _handleEditorTool: function (widget) {
        var _t = this;
        var widgetId = $(widget).attr('data-hm-widgetid').trim();
        var widgetName = $(widget).attr('data-hm-widgetname').trim();
        var recordType = _t.getRecordType(widgetName);
        if (!recordType) {
            return;
        }
        const params = {
            recordType: recordType,
            progressGuid: widgetId
        };
        window.hmEditor.aiActive(params);
    },
    /**
     * 根据病历文书名称，获取文书类型
     * @param {*} widgetName 文书名称
     * @returns 文书类型
     */
    getRecordType: function (widgetName) {
        var _t = this;
        var _pWindow = parent.window;
        var recordMap = _pWindow.HMEditorLoader && _pWindow.HMEditorLoader.recordMap;
        if (!recordMap) {
            console.warn('recordMap is not available on HMEditorLoader.');
            return null;
        }
        var recordInfo = recordMap.find(item => {
            if (Array.isArray(item.recordName)) {
                return item.recordName.includes(widgetName);
            }
            return item.recordName === widgetName;
        });
        return recordInfo ? recordInfo.recordType : null;
    },
    /**
     * 更新编辑器的高度
     * @param {jsonObject} evtTrace 用于(广播等)事件溯源
     */
    updateEditSpaceContainerStyle: function (evtTrace) {
        var _t = this;
        if (_t.editor.readOnly || $('.editor_footer .footer_btn .edit_btn').length == 0) {
            $(".cke_editor_editorSpace").removeClass("emr-reset-height");
            $(".editor_footer").css('display', 'none');
            // 只读病历分页
            if (CKEDITOR.plugins.pagebreakCmd) {
                CKEDITOR.plugins.pagebreakCmd.currentOperations.setContent = false;
                CKEDITOR.plugins.pagebreakCmd.performAutoPaging(_t.editor, {
                    name: '只读病历分页',
                    data: evtTrace
                });
            }
        } else {
            $(".cke_editor_editorSpace").addClass("emr-reset-height");
            $(".editor_footer").css('display', 'flex');
        }
        // 使用新样式时，只读样式设置
        var $body = $(_t.editor.document.getBody().$);
        if ($body.attr('newStyle')) {
            if (_t.editor.readOnly) {
                $body.addClass('readOnlyClass');
            } else {
                $body.removeClass('readOnlyClass');
            }
        }
    },
    /**
     * 显示修订
     * @param {jQuery} $body 编辑器body元素
     */
    showReviseModel: function ($body) {
        $body.removeClass('hm-revise-hide').addClass('hm-revise-show');
    },
    /**
     * 隐藏修订
     * @param {jQuery} $body 编辑器body元素
     */
    hideReviseModel: function ($body) {
        $body.removeClass('hm-revise-show').addClass('hm-revise-hide');
    },
    /**
     * 聚合多条病历记录
     * @param {Array} contentlist 病历记录列表
     */
    aggregateRecord: function (recordFileList) {
        var _t = this;
        var htmlFileList = recordFileList;
        var oldBody = _t.editor.document.getBody();
        //获取首个文档的信息
        var papersize = _t.getAttributeFromBodyStr(htmlFileList[0]["docContent"], 'data-hm-papersize') || '';
        var meta_json = _t.getAttributeFromBodyStr(htmlFileList[0]["docContent"], 'meta_json') || '';
        var style = _t.getAttributeFromBodyStr(htmlFileList[0]["docContent"], 'style') || '';
        var contents = '';
        for (var i = 0; i < htmlFileList.length; i++) {
            var 病历ID = htmlFileList[i]["code"] || "";
            var 病历名称 = htmlFileList[i]["docTplName"] || "";
            var 病历文档 = htmlFileList[i]["docContent"] || "";
            var contentClass = 'emrWidget-content';
            var body = '<body></body>';
            var oldWidget = oldBody.find('[data-hm-widgetid="' + 病历ID + '"]');
            // 是否在此病历后分页: 因为这个值是附加在 widget 上的, 故需要从书写中的病历上提出来
            var splitAfterDocStr;
            var splitAfterDocClass = CKEDITOR.plugins.pagebreakCmd.SPLIT_AFTER_DOC;
            splitAfterDocStr = oldWidget.count() > 0 ?
                oldWidget.getItem(0).getAttribute(splitAfterDocClass) :
                _t.getAttributeFromBodyStr(病历文档, splitAfterDocClass);
            splitAfterDocStr = splitAfterDocStr ? (splitAfterDocClass + '="true" ') : '';

            // 是否更新病历页码
            var changePageNumberOfDocClass = CKEDITOR.plugins.pagebreakCmd.CHANGE_PAGE_NUMBER_OF_DOC;
            var pageNumOfThisDoc = _t.getAttributeFromBodyStr(病历文档, changePageNumberOfDocClass);
            var changePageNumberOfDocStr = pageNumOfThisDoc ? (changePageNumberOfDocClass + '=' + Number(pageNumOfThisDoc) + ' ') : '';

            var contenteditable = '';
            var _class = _t.getAttributeFromBodyStr(病历文档, 'class') || '';
            if (_class.includes('switchModel')) {
                contenteditable = 'false';
            }
            var record_widget = '<div class="emrWidget">' +
                '<div class="' + contentClass + '" ' +
                'data-hm-widgetid="' + 病历ID + '" ' +
                'data-hm-widgetname="' + 病历名称.trim() + '" ' +
                'doc_code="' + 病历ID + '" ' +
                '_contenteditable="' + contenteditable + '" ' +
                splitAfterDocStr +
                changePageNumberOfDocStr +
                '>' + 病历文档 + '</div>' +
                '</div>';
            var $body = $(body).append(record_widget);
            var lastIndex = htmlFileList.length - 1;
            //只有一个病程时，页眉页脚全部保留
            if (htmlFileList.length == 1) {
                contents = contents + record_widget;
            } else {
                //第一个病程保留页眉,最后一个病程保留页脚
                if (i === 0) {
                    var tempFile = _t.removeFooter($body); //第一个去除页脚
                    contents = contents + tempFile[0].innerHTML;
                }
                if (i === lastIndex) {
                    var tempFile = _t.removeHeader($body); //最后一个去除页眉
                    contents = contents + tempFile[0].innerHTML;
                }
                //非第一个和最后一个，去除页眉页脚
                if (0 < i && i < lastIndex) {
                    var tempFile_removeHeader = _t.removeHeader($body); //去除页眉信息
                    var tempFile_removeFooter = _t.removeFooter(tempFile_removeHeader);
                    contents = contents + tempFile_removeFooter[0].innerHTML;
                }
            }
        }
        contents = contents.replace(/<body.*?>/g, '').replace(/<\/body>/g, ''); //去除所有body标签
        var editorContent = '<body data-hm-papersize="' + papersize + '" meta_json ="' + meta_json + '" style ="' + style + '" >' + contents + '</body>';
        //病程是否使用新样式
        var newstyle = _t.getAttributeFromBodyStr(htmlFileList[0]["docContent"], 'newstyle');
        if (newstyle) {
            editorContent = '<body data-hm-papersize="' + papersize + '" meta_json ="' + meta_json + '" style ="' + style + '" newstyle="' + newstyle + '" >' + contents + '</body>';
        }
        return editorContent;
    },
    /**
     * 从文档内容字符串中提取指定属性的值
     * @param {String} str 文档内容字符串
     * @param {String} attribute 要提取的属性名
     * @returns {String} 属性值，如果不存在则返回空字符串
     */
    getAttributeFromBodyStr: function (str, attribute) {
        if (!str || !attribute) {
            return null;
        }
        var bodyDiv = str.replace('<body', '<div').replace('</body>', '</div>');
        var attribute = $(bodyDiv)[0].attributes[attribute];

        return attribute && attribute.value != "null" ? attribute.value : null;
    },
    /**
     * 移除文档的页眉
     */
    removeHeader: function ($h) {
        $h.find("table[_paperheader]").each(function () {
            $(this).css('display', 'none');
        });
        return $h;
    },

    /**
     * 移除文档的页脚
     */
    removeFooter: function ($h) {
        $h.find("table[_paperfooter]").each(function () {
            $(this).css('display', 'none');
        });
        return $h;
    },

    /**
     * 插入文档
     * @param {Number} insertPosition 目标位置，新文档将插入到该文档之后
     * @param {Array} docs 要插入的文档数组
     * @param {String} docs[].code 要插入的文档的唯一编号
     * @param {String} docs[].docContent 要插入的文档内容
     */
    insertContent: function (insertPosition, docs) {
        var _t = this;
        if (!Array.isArray(docs) || docs.length === 0) {
            console.error('要插入的文档必须是数组类型且不能为空');
            return;
        }
        var recordWidgetList = _t.getRecordWidgetList(); //拿到各个widget里面的内容
        // 创建新数组，将docs插入到指定位置
        var newRecordWidgetList = [];
        for (var i = 0; i < recordWidgetList.length; i++) {
            if (i === insertPosition) {
                // 在指定位置插入docs数组
                newRecordWidgetList = newRecordWidgetList.concat(docs);
            }
            newRecordWidgetList.push(recordWidgetList[i]);
        }

        // 如果插入位置在数组末尾，需要单独处理
        if (insertPosition >= recordWidgetList.length) {
            newRecordWidgetList = newRecordWidgetList.concat(docs);
        }
        _t.setContent(newRecordWidgetList);
    },
    getRecordWidgetList: function (anotherDom) {
        var _t = this;
        var $body = anotherDom ? new CKEDITOR.dom.node(anotherDom) : _t.editor.document.getBody();
        var recordWidgets = $body.find("[data-hm-widgetid]");
        var recordList = [];
        var paperSize = $body.getAttribute('data-hm-papersize');
        for (var i = 0; i < recordWidgets.count(); i++) {
            var $node = recordWidgets.getItem(i);
            //提取widget 中的文档属性
            var papersize = paperSize || $node.getAttribute('data-hm-subpapersize');
            var meta_json = $node.getAttribute('meta_json');
            var subStyle = $node.getAttribute('data-hm-substyle') || '';
            var containerInlineStyle = $node.getAttribute('style') || '';
            var style = [subStyle, containerInlineStyle].filter(function (s) {
                return s && String(s).trim();
            }).join(';');
            var $recordContent = $('<body></body>').append($node.getHtml());

            //将隐藏的页眉、页脚恢复
            $recordContent.find("table[_paperheader]").each(function () {
                $(this).css("display", "");
            });

            $recordContent.find("table[_paperfooter]").each(function () {
                $(this).css("display", "");
            });

            // setEmrDocumentEditState($recordContent, 'auto');
            // setEmrNewTextBoxEditable($recordContent, 'true');

            var widgetContent = '<body data-hm-papersize="' + papersize + '" meta_json="' + meta_json + '" style="' + style + '">' + $recordContent[0].innerHTML + '</body>';
            //病程是否使用新样式
            var newstyle = $node.getAttribute('data-hm-subnewstyle');
            if (newstyle) {
                widgetContent = '<body data-hm-papersize="' + papersize + '" meta_json="' + meta_json + '" style="' + style + '" newstyle="' + newstyle + '" >' + $recordContent[0].innerHTML + '</body>';
            }
            var doc_code = $node.getAttribute('data-hm-widgetid');
            var recordFile = {
                "code": doc_code,
                "docContent": widgetContent
            };
            recordList.push(recordFile);
        }
        return recordList;
    },

    /**
     * 增加表格行
     * @param {jQuery} $currentRow 当前行元素
     */
    _addTableRow: function ($currentRow) {
        var _t = this;
        try {
            if (!$currentRow || !$currentRow.length) {
                console.warn('无效的表格行元素');
                return;
            }

            // 检查当前行是否允许新增
            if ($currentRow.attr('_row_addable') === 'false') {
                console.warn('该行不允许新增行');
                return;
            }

            var $newRow = $currentRow.clone();
            $newRow.find('.table-row-actions').remove();

            // 清除新行的只读和权限相关属性，确保新行可编辑
            $newRow.removeAttr('_row_readonly');
            $newRow.removeAttr('_row_deletable');
            $newRow.removeAttr('_row_addable');

            // 清空新行中的内容
            $newRow.find('td').each(function () {
                var $td = $(this);

                // 移除单元格的contenteditable属性，让其继承父级状态
                $td.removeAttr('contenteditable');

                // 清空文本框内容并确保可编辑
                var $textbox = $td.find('.new-textbox-content');
                if ($textbox.length > 0) {
                    if ($textbox.attr('_placeholder') && $textbox.attr('_placeholder') != '') {
                        $textbox.text($textbox.attr('_placeholder'));
                        $textbox.attr('_placeholdertext', 'true');
                    } else {
                        $textbox.text('');
                        $textbox.removeAttr('_placeholdertext');
                    }
                    // 显式设置文本框的contenteditable为true，确保可编辑
                    $textbox.attr('contenteditable', 'true');
                    // 同时设置内部元素的contenteditable为true（参考_setCellContentReadonly的逻辑）
                    $textbox.find('span:not([data-hm-node="expressionbox"]), font').attr('contenteditable', 'true');
                }

                // 确保数据元可交互
                $td.find('span[data-hm-node="timebox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $td.find('span[data-hm-node="dropbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $td.find('span[data-hm-node="checkbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $td.find('span[data-hm-node="radiobox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $td.find('span[data-hm-node="searchbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $td.find('span[data-hm-node="newtextbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $td.find('button[data-hm-id]').css('pointer-events', 'auto');

                // 移除简洁模式样式
                $td.find('.concise-model').removeClass('concise-model');

                // 清空单选/复选：仅处理 _selected="true" 的选项节点，避免误改外层容器
                $td.find('span[data-hm-node="radiobox"][_selected="true"]:not([data-hm-node="labelbox"])').removeClass('fa-dot-circle-o').addClass('fa-circle-o').removeAttr('_selected');
                $td.find('span[data-hm-node="checkbox"][_selected="true"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').removeAttr('_selected');

                // 清空时间选中状态（先清空，后续统一补默认当前时间）
                $td.find('[data-hm-node=timebox]').html('&nbsp;');

                // 清空下拉框选中值
                $td.find('select').prop('selectedIndex', 0);

                // 清空普通文本内容
                if (!$td.find('[data-hm-node]').length) {
                    $td.empty();
                    // 添加<br>标签，避免单元格无高度
                    $td.append('<br>');
                }
            });

            // 将新行插入到当前行后面
            $currentRow.after($newRow);

            // 新增行后：对勾选了【默认当前时间】的日期数据元填入当前时间 (AIED-337)
            _t._applyTimeboxAutoshowCurtime($newRow);
        } catch (error) {
            console.warn('增加表格行时发生错误:', error);
        }
    },

    /**
     * 删除表格行
     * @param {jQuery} $currentRow 当前行元素
     */
    _deleteTableRow: function ($currentRow) {
        var _t = this;
        try {
            if (!$currentRow || !$currentRow.length) {
                console.warn('无效的表格行元素');
                return;
            }

            // 检查当前行是否允许删除（只读状态不影响删除权限）
            if ($currentRow.attr('_row_deletable') === 'false') {
                console.warn('该行不允许删除');
                return;
            }

            var $tbody = $currentRow.closest('tbody');
            if (!$tbody.length) {
                console.warn('无法找到表格体元素');
                return;
            }

            var totalRows = $tbody.find('tr').length;

            // 确保至少保留一行
            if (totalRows <= 1) {
                console.warn('表格至少需要保留一行');
                return;
            }

            // 删除当前行
            $currentRow.remove();
        } catch (error) {
            console.warn('删除表格行时发生错误:', error);
        }
    },
    /**
     * 横向表格增加行，其实对应增加一列
     * @param {} $currentCell 
     * @returns 
     */
    _addTableCell: function ($currentCell) {
        var _t = this;
        try {
            if (!$currentCell || !$currentCell.length) {
                console.warn('无效的表格单元格元素');
                return;
            }

            // 检查当前单元格是否允许新增
            if ($currentCell.attr('_cell_addable') === 'false') {
                console.warn('该位置不允许新增列');
                return;
            }

            var $table = $currentCell.closest('table');
            if (!$table.length) {
                console.warn('无法找到表格元素');
                return;
            }

            var $tbody = $table.find('tbody');
            if (!$tbody.length) {
                console.warn('无法找到表格体元素');
                return;
            }

            // 获取当前单元格在行中的索引
            var currentCellIndex = $currentCell.index();

            // 遍历所有行，在指定索引后插入新的td
            $tbody.find('tr').each(function () {
                var $tr = $(this);
                var $tds = $tr.find('td');

                // 如果索引超出范围，在最后添加
                var insertIndex = Math.min(currentCellIndex + 1, $tds.length);

                // 创建新的td元素，复制目标td的结构
                var $newTd = $tr.find('td:eq(' + currentCellIndex + ')').clone();

                // 清除新单元格的只读和权限相关属性
                $newTd.removeAttr('_cell_readonly');
                $newTd.removeAttr('_cell_deletable');
                $newTd.removeAttr('_cell_addable');
                // 移除contenteditable属性，让其继承父级状态
                $newTd.removeAttr('contenteditable');

                // 清空新td中的内容，参考_addTableRow的清空逻辑
                $newTd.find('.new-textbox-content').each(function () {
                    var $textbox = $(this);
                    if ($textbox.attr('_placeholder') && $textbox.attr('_placeholder') != '') {
                        $textbox.text($textbox.attr('_placeholder'));
                        $textbox.attr('_placeholdertext', 'true');
                    } else {
                        $textbox.text('');
                        $textbox.removeAttr('_placeholdertext');
                    }
                    // 显式设置文本框的contenteditable为true，确保可编辑
                    $textbox.attr('contenteditable', 'true');
                    // 同时设置内部元素的contenteditable为true（参考_setCellContentReadonly的逻辑）
                    $textbox.find('span:not([data-hm-node="expressionbox"]), font').attr('contenteditable', 'true');
                });

                // 确保数据元可交互
                $newTd.find('span[data-hm-node="timebox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $newTd.find('span[data-hm-node="dropbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $newTd.find('span[data-hm-node="checkbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $newTd.find('span[data-hm-node="radiobox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $newTd.find('span[data-hm-node="searchbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $newTd.find('span[data-hm-node="newtextbox"]:not([_isdisabled="true"])').css('pointer-events', 'auto');
                $newTd.find('button[data-hm-id]').css('pointer-events', 'auto');

                // 移除简洁模式样式
                $newTd.find('.concise-model').removeClass('concise-model');

                // 清空单选/复选：仅处理 _selected="true" 的选项节点，避免误改外层容器
                $newTd.find('span[data-hm-node="radiobox"][_selected="true"]:not([data-hm-node="labelbox"])').removeClass('fa-dot-circle-o').addClass('fa-circle-o').removeAttr('_selected');
                $newTd.find('span[data-hm-node="checkbox"][_selected="true"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').removeAttr('_selected');

                // 清空时间选中状态
                $newTd.find('[data-hm-node=timebox]').html('&nbsp;');

                // 清空下拉框选中值
                $newTd.find('select').prop('selectedIndex', 0);

                // 清空普通文本内容
                if (!$newTd.find('[data-hm-node]').length) {
                    $newTd.empty();
                    // 添加<br>标签，避免单元格无高度
                    $newTd.append('<br>');
                }

                // 移除操作图标
                $newTd.find('.table-row-actions, .table-cell-actions').remove();

                // 在指定位置插入新的td
                if (insertIndex >= $tds.length) {
                    $tr.append($newTd);
                } else {
                    $tds.eq(insertIndex).before($newTd);
                }
            });

            // 重新计算colgroup的宽度
            _t._updateTableColgroup($table);

        } catch (error) {
            console.warn('增加表格单元格时发生错误:', error);
        }
    },
    /**
     * 横向表格删减行，其实对应删减一列
     * @param {*} $currentCell 
     * @returns 
     */
    _deleteTableCell: function ($currentCell) {
        var _t = this;
        try {
            if (!$currentCell || !$currentCell.length) {
                console.warn('无效的表格单元格元素');
                return;
            }

            // 检查当前单元格是否允许删除（只读状态不影响删除权限）
            if ($currentCell.attr('_cell_deletable') === 'false') {
                console.warn('该位置不允许删除列');
                return;
            }

            var $table = $currentCell.closest('table');
            if (!$table.length) {
                console.warn('无法找到表格元素');
                return;
            }

            var $tbody = $table.find('tbody');
            if (!$tbody.length) {
                console.warn('无法找到表格体元素');
                return;
            }

            // 获取当前单元格在行中的索引
            var currentCellIndex = $currentCell.index();

            // 检查是否至少保留一列
            var $firstRow = $tbody.find('tr:first');
            if (!$firstRow.length) {
                console.warn('表格没有行');
                return;
            }

            var totalColumns = $firstRow.find('td').length;
            if (totalColumns <= 1) {
                console.warn('表格至少需要保留一列');
                return;
            }

            // 遍历所有行，删除指定索引的td
            $tbody.find('tr').each(function () {
                var $tr = $(this);
                var $tds = $tr.find('td');

                // 确保索引在有效范围内
                if (currentCellIndex >= 0 && currentCellIndex < $tds.length) {
                    $tds.eq(currentCellIndex).remove();
                }
            });

            // 重新计算colgroup的宽度
            _t._updateTableColgroup($table);

        } catch (error) {
            console.warn('删除表格单元格时发生错误:', error);
        }
    },

    /**
     * 更新表格colgroup的宽度
     * @param {jQuery} $table 表格元素
     */
    _updateTableColgroup: function ($table) {
        var _t = this;
        try {
            if (!$table || !$table.length) {
                console.warn('无效的表格元素');
                return;
            }

            var $tbody = $table.find('tbody');
            if (!$tbody.length) {
                console.warn('无法找到表格体元素');
                return;
            }

            // 获取第一行的td数量来确定列数
            var $firstRow = $tbody.find('tr:first');
            if (!$firstRow.length) {
                console.warn('表格没有行');
                return;
            }

            var columnCount = $firstRow.find('td').length;

            // 获取或创建colgroup
            var $colgroup = $table.find('colgroup');
            if (!$colgroup.length) {
                // 如果没有colgroup，创建一个
                $colgroup = $('<colgroup></colgroup>');
                $table.prepend($colgroup);
            }

            // 清空现有的col元素
            $colgroup.empty();

            // 计算每列的宽度（平均分配）
            var tableWidth = 100; // 使用百分比
            var columnWidth = tableWidth / columnCount;

            // 添加新的col元素
            for (var i = 0; i < columnCount; i++) {
                var $col = $('<col>');
                $col.attr('style', 'width: ' + columnWidth + '%;');
                $colgroup.append($col);
            }

        } catch (error) {
            console.warn('更新表格colgroup时发生错误:', error);
        }
    },

    /**
     * 初始化修订悬停提示：hm_revise_del / hm_revise_ins 悬停时在下方显示修改人及修改内容
     * @param {jQuery} $body 编辑器body元素
     */
    /**
     * 初始化修订悬停提示功能。
     * 当用户悬停在带有 hm_revise_ins 或 hm_revise_del 类的元素上时，
     * 在元素下方显示一个悬浮提示，展示修改人、修改时间和变更内容。
     * @param {jQuery} $body 编辑器 body 元素
     */
    _initReviseHoverTooltip: function ($body) {
        var _t = this;

        // --- 常量 ---
        var REVISE_SELECTOR = '.hm_revise_ins, .hm_revise_del';
        var TOOLTIP_CLASS = 'hm-revise-tooltip';
        var GAP = 6;                    // tooltip 与修订元素垂直间距（px）
        var SHOW_DELAY = 400;           // 悬停多久后才显示 tooltip（ms），避免误触
        var NODE_TYPE_TEXT = 3;
        var NODE_TYPE_ELEMENT = 1;

        // --- 清理：解绑旧事件、移除旧监听（setContent 会再次调用本方法，须避免重复绑定）---
        $body.off('mouseenter.reviseTooltip mouseleave.reviseTooltip input.reviseTooltip');
        if (_t._reviseTooltipChangeListener) {
            _t._reviseTooltipChangeListener.removeListener();
            _t._reviseTooltipChangeListener = null;
        }
        if (_t._reviseTooltipSelectionListener) {
            _t._reviseTooltipSelectionListener.removeListener();
            _t._reviseTooltipSelectionListener = null;
        }

        // --- 创建或复用 tooltip 节点（支持多编辑器实例）---
        var tooltipId = 'hm-revise-tooltip-' + (_t.editor.name || '');
        var $tooltip = $body.find('#' + tooltipId);
        if (!$tooltip.length) {
            $tooltip = $('<div id="' + tooltipId + '" class="' + TOOLTIP_CLASS + '" style="display:none;" contenteditable="false"></div>');
            $body.append($tooltip);
        }
        $tooltip.off('mouseenter mouseleave').attr('contenteditable', 'false');

        // --- 状态：定时器与当前展示的修订元素（闭包内共享）---
        var hideTimer = null;           // 隐藏 tooltip 的延迟（未使用延迟隐藏，仅用于 cancelHide 清理）
        var showTooltipTimer = null;    // 延迟显示 tooltip，达到 SHOW_DELAY 后才真正 show
        var currentRevEl = null;        // 当前正在显示 tooltip 的修订 DOM 元素，用于 refresh/判断光标
        var refreshTooltipTimer = null; // 防抖：change 后延迟一帧刷新内容与位置

        /**
         * 获取元素的直接文本内容（不包含嵌套修订标签的子内容）
         */
        function getDirectText($el) {
            var text = '';
            $el.contents().each(function () {
                if (this.nodeType === NODE_TYPE_TEXT) {
                    text += this.nodeValue;
                } else if (this.nodeType === NODE_TYPE_ELEMENT) {
                    var $child = $(this);
                    // 跳过嵌套的修订标签，只取本层“直接”文本，避免重复展示同一段修订内容
                    if (!$child.hasClass('hm_revise_ins') && !$child.hasClass('hm_revise_del')) {
                        text += $child.text();
                    }
                }
            });
            return text;
        }

        /**
         * 对字符串进行 HTML 转义，避免 XSS
         */
        function escapeHtml(s) {
            if (!s) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        /**
         * 格式化时间字符串 (YYYY-MM-DD HH:mm)
         * @param {string} timeStr 
         * @returns {string}
         */
        function formatTime(timeStr) {
            if (!timeStr) return '';
            var d = new Date(timeStr);
            if (isNaN(d.getTime())) return timeStr;
            var pad = function (n) { return n < 10 ? '0' + n : n; };
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        }

        /**
         * 构建 tooltip 内部 HTML
         * @param {jQuery} $rev 
         * @returns {string}
         */
        function buildTooltipContent($rev) {
            var userName = $rev.attr('hm-modify-userName') || '';
            var timeStr = $rev.attr('hm-modify-time') || '';
            var timeDisplay = formatTime(timeStr);
            var content = getDirectText($rev).trim();
            var isIns = $rev.hasClass('hm_revise_ins');
            var contentHtml = isIns
                ? '<strong>新增:</strong> "' + escapeHtml(content) + '"'
                : '<strong>删除:</strong> "' + escapeHtml(content) + '"';
            return '<div class="hm-revise-tooltip-head">' +
                '<span class="hm-revise-tooltip-name">' + escapeHtml(userName) + '</span>' +
                '<span class="hm-revise-tooltip-time">' + escapeHtml(timeDisplay) + '</span>' +
                '</div>' +
                '<div class="hm-revise-tooltip-body">' + contentHtml + '</div>';
        }

        /**
         * 为 tooltip 添加对应的样式类（区分新增/删除）
         */
        function setTooltipBorderClass($rev) {
            $tooltip.removeClass('hm-revise-tooltip-ins hm-revise-tooltip-del')
                .addClass($rev.hasClass('hm_revise_del') ? 'hm-revise-tooltip-del' : 'hm-revise-tooltip-ins');
        }

        /**
         * 根据修订元素位置设置 tooltip 的 fixed 定位（在元素下方、左侧对齐）
         * @param {HTMLElement} domEl 修订元素的 DOM 节点
         */
        function positionTooltip(domEl) {
            var rect = domEl.getBoundingClientRect();
            $tooltip.css({
                position: 'fixed',
                top: (rect.bottom + GAP) + 'px',
                left: rect.left + 'px'
            });
        }

        /**
         * 判断当前选区/光标是否在指定元素内。
         * 用于：光标在修订标签内时不展示 tooltip，避免遮挡；选区变化时若光标进入当前修订则隐藏。
         * @param {HTMLElement} domEl 修订标签的 DOM 元素
         * @returns {boolean}
         */
        function isCursorInElement(domEl) {
            try {
                var selection = _t.editor.getSelection();
                if (!selection) return false;
                var startEl = selection.getStartElement();
                if (!startEl) return false;
                var node = startEl.$;
                return domEl === node || domEl.contains(node);
            } catch (e) {
                return false;
            }
        }

        /**
         * 显示 tooltip
         * @param {jQuery} $rev 触发的修订元素
         */
        function showTooltip($rev) {
            if (!$rev || !$rev[0] || !$body[0].contains($rev[0])) return;
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            currentRevEl = $rev[0];                                      // 记录当前修订元素，供 refresh/selectionChange 使用
            $tooltip.html(buildTooltipContent($rev)).show();
            setTooltipBorderClass($rev);                                 // 新增/删除对应不同边框样式
            positionTooltip($rev[0]);
        }

        /**
         * 如果 tooltip 仍在显示，则刷新其内容及位置
         */
        function refreshTooltipIfShowing() {
            if (!currentRevEl || !$tooltip.is(':visible')) return;
            if (!$body[0].contains(currentRevEl)) {                     // 修订节点已被删除，直接隐藏
                currentRevEl = null;
                $tooltip.hide();
                return;
            }
            var $rev = $(currentRevEl);
            $tooltip.html(buildTooltipContent($rev));                    // 内容或位置可能已变，重新渲染并定位
            setTooltipBorderClass($rev);
            positionTooltip(currentRevEl);
        }

        /**
         * 隐藏 tooltip（立即隐藏，无延迟）
         */
        function hideTooltip() {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
            currentRevEl = null;
            $tooltip.hide();
        }

        /**
         * 取消隐藏 tooltip 的定时器
         */
        function cancelHide() {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        }

        /**
         * 取消延迟显示 tooltip 的定时器
         */
        function cancelShowTooltip() {
            if (showTooltipTimer) {
                clearTimeout(showTooltipTimer);
                showTooltipTimer = null;
            }
        }

        /**
         * 延迟刷新 tooltip（内容变更或文档变动时调用）。
         * 使用 setTimeout(..., 0) 防抖，确保 DOM/选区稳定后再刷新内容与位置。
         */
        function scheduleRefresh() {
            if (!currentRevEl || !$tooltip.is(':visible')) return;
            if (refreshTooltipTimer) clearTimeout(refreshTooltipTimer);
            refreshTooltipTimer = setTimeout(function () {
                refreshTooltipTimer = null;
                refreshTooltipIfShowing();
            }, 0);
        }

        // --- 事件绑定 ---

        // 鼠标移入修订：先取消即将发生的隐藏/显示，再设延迟显示；到点后若光标不在该标签内才 show
        $body.on('mouseenter.reviseTooltip', REVISE_SELECTOR, function () {
            cancelHide();
            cancelShowTooltip();
            var $rev = $(this);
            showTooltipTimer = setTimeout(function () {
                showTooltipTimer = null;
                if (!$rev[0] || !$body[0].contains($rev[0])) return;
                if (!isCursorInElement($rev[0])) {
                    showTooltip($rev);
                } else {
                    hideTooltip();   // 光标在修订内时不展示，避免遮挡编辑区
                }
            }, SHOW_DELAY);
        });

        // 鼠标离开修订：仅当“真正离开”（未移入另一修订或 tooltip）时才隐藏，否则可继续查看
        $body.on('mouseleave.reviseTooltip', REVISE_SELECTOR, function (e) {
            cancelShowTooltip();
            var related = e.relatedTarget;
            var leftReviseElement = !related || !this.contains(related);
            if (!leftReviseElement) return;
            var $related = related ? $(related) : null;
            var movedToReviseOrTooltip = $related && ($related.closest(REVISE_SELECTOR).length || $related.closest('.' + TOOLTIP_CLASS).length);
            if (!movedToReviseOrTooltip) {
                hideTooltip();
            }
        });

        // tooltip 自身：移入时取消隐藏，移出时隐藏（便于用户从修订移到 tooltip 阅读）
        $tooltip.on('mouseenter', cancelHide);
        $tooltip.on('mouseleave', hideTooltip);

        // 正在输入时不再显示/保持 tooltip，避免干扰编辑
        $body.on('input.reviseTooltip', function () {
            cancelShowTooltip();
            hideTooltip();
        });

        // 文档内容变更（增删改）：若 tooltip 正在显示，防抖刷新其内容与位置
        _t._reviseTooltipChangeListener = _t.editor.on('change', function () {
            scheduleRefresh();
        });

        // 选区变化：光标进入当前展示的修订标签内时隐藏 tooltip（与 mouseenter 里 isCursorInElement 逻辑一致）
        _t._reviseTooltipSelectionListener = _t.editor.on('selectionChange', function () {
            if (currentRevEl && isCursorInElement(currentRevEl)) {
                hideTooltip();
            }
        });
    },

    /**
     * 初始化日期导航功能
     * @param {jQuery} $body 编辑器body元素
     */
    _initDateNavigation: function ($body) {
        var _t = this;

        // 创建日期导航面板
        _t._createDateNavigationPanel($body);
    },

    /**
     * 创建日期导航面板
     */
    _createDateNavigationPanel: function ($body) {

        var _t = this;

        // 检查是否已经存在快速定位按钮
        var editorDocument = _t.editor.document.$;
        var $editorDoc = $(editorDocument);
        if ($editorDoc.find('.quick-location-btn').length > 0) {
            return;
        }

        // 再次检查是否存在护理表单表格
        var nursingFormTables = $body.find('table[data-hm-datatable][data-hm-table-type="list"]');
        if (nursingFormTables.length === 0) {
            console.log('未检测到护理表单表格，不创建日期导航面板');
            return;
        }



        // 创建快速定位按钮HTML
        var quickLocationHTML = `
            <div class="date-navigation quick-location-btn" contenteditable="false" style="cursor: pointer;">
                <div class="unfold-icon"></div>
            </div>
        `;

        // 创建日期导航面板HTML - 基于Figma设计规范
        var dateNavigationHTML = `
            <div class="date-navigation date-navigation-container" contenteditable="false" style="display: none;">
                <div class="date-navigation-bar">
                    <button class="date-nav-button date-nav-first-day">
                        <span class="button-icon"><i class="fa fa-angle-double-left"></i></span>
                        <span class="button-text">第一天</span>
                    </button>
                    <div class="date-nav-button-wrapper date-nav-previous-day-wrapper">
                        <button class="date-nav-button date-nav-previous-day">
                            <span class="button-icon"><i class="fa fa-angle-left"></i></span>
                        </button>
                    </div>
                    <div class="date-display date-nav-date-select">
                        <input type="text" class="date-picker-input" style="width: 72px; border: none; font-size: 14px; text-align: center; cursor: pointer;" placeholder="请选择日期">
                    </div>
                    <div class="date-nav-button-wrapper date-nav-next-day-wrapper">
                        <button class="date-nav-button date-nav-next-day">
                            <span class="button-icon"><i class="fa fa-angle-right"></i></span>
                        </button>
                    </div>
                    <button class="date-nav-button date-nav-last-day">
                        <span class="button-text">最后一天</span>
                        <span class="button-icon"><i class="fa fa-angle-double-right"></i></span>
                    </button>
                    <div class="date-nav-separator"></div>
                   <div class="collapse-icon-wrapper">
                       <div class="collapse-icon"></div>
                   </div>
                    
                </div>
            </div>
        `;

        // 将快速定位按钮和日期导航面板添加到页面
        $body.append(quickLocationHTML);
        $body.append(dateNavigationHTML);

        // 预初始化日期选择器
        var $datePickerInput = $body.find('.date-picker-input');
        if ($datePickerInput.length > 0) {
            // 先设置全局语言
            $.datetimepicker.setLocale('ch');

            $datePickerInput.datetimepicker({
                value: new Date(),
                timepicker: false,
                datepicker: true,
                format: 'Y-m-d',
                inline: false,
                scrollMonth: false,
                scrollYear: false,
                // yearStart: 2020,
                // yearEnd: 2030,
                dayOfWeekStart: 1,
                closeOnDateSelect: true,
                closeOnWithoutClick: true,
                defaultSelect: true,
                onGenerate: function (ct) {
                    $datePickerInput.css('display', 'block');
                },
                onSelectDate: function (dateText, inst) {
                    // 将日期格式转换为中文格式
                    var date = new Date(dateText);
                    var year = date.getFullYear();
                    var month = (date.getMonth() + 1).toString().padStart(2, '0');
                    var day = date.getDate().toString().padStart(2, '0');
                    var chineseDate = year + '-' + month + '-' + day;

                    $datePickerInput.val(chineseDate);
                    console.log('选择的日期:', chineseDate);

                    // 查找表格中匹配的日期时间数据元
                    _t._findAndScrollToDate($body, chineseDate);

                },
                onShow: function (ct) {
                    // 重新定位日期选择框到输入框下方
                    var $picker = $('.xdsoft_datetimepicker');
                    if ($picker.length > 0) {
                        var $dateNavigationContainer = $body.find('.date-navigation-container');
                        var containerTop = parseInt($dateNavigationContainer.css('top')) || 20;

                        // 使用setTimeout确保picker已经渲染完成
                        setTimeout(function () {
                            $picker.css({
                                position: 'fixed',
                                top: '100px',
                                bottom: 'auto',
                                zIndex: 9999
                            });
                        }, 10);
                    }
                }
            });
        }

        // 绑定事件
        _t._bindDateNavigationEvents($body);

        console.log('快速定位按钮和日期导航面板已创建（检测到护理表单表格）');
    },

    /**
     * 绑定日期导航事件
     */
    _bindDateNavigationEvents: function ($body) {
        var _t = this;

        // 绑定快速定位按钮点击事件
        $body.on('click', '.quick-location-btn', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了快速定位按钮');
            _t._handleQuickLocationClick($body);
        });

        // 绑定收起按钮点击事件
        $body.on('click', '.collapse-icon-wrapper', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了收起按钮');
            _t._handleCollapseClick($body);
        });

        // 绑定其他日期导航按钮事件
        $body.on('click', '.date-nav-first-day', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了【<<第一天】按钮');
            _t._handleFirstDayClick($body);
        });

        $body.on('click', '.date-nav-previous-day', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了【<前一天】按钮');
            _t._handlePreviousDayClick($body);
        });

        $body.on('click', '.date-nav-date-select, .date-picker-input', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('点击了日期显示区域或输入框');
            _t._handleDateSelectClick($body);
        });

        $body.on('click', '.date-nav-next-day', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了【后一天>】按钮');
            _t._handleNextDayClick($body);
        });

        $body.on('click', '.date-nav-last-day', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了【最后一天>>】按钮');
            _t._handleLastDayClick($body);
        });

        console.log('事件绑定完成，使用$body对象');
    },

    /**
     * 处理快速定位按钮点击事件
     */
    _handleQuickLocationClick: function ($body) {
        var _t = this;
        console.log('执行快速定位操作');

        var $panel = $body.find('.date-navigation-container');
        var $btn = $body.find('.quick-location-btn');
        // 如果日期输入框没有值，设置为当前日期
        var $dateInput = $panel.find('.date-picker-input');
        if (!$dateInput.val()) {
            var now = new Date();
            var year = now.getFullYear();
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var day = String(now.getDate()).padStart(2, '0');
            $dateInput.val(year + '-' + month + '-' + day);
            console.log('设置默认日期:', year + '-' + month + '-' + day);
        }

        if ($panel.length > 0 && $btn.length > 0) {
            $panel.show();
            $btn.hide();
            console.log('操作完成 - 面板显示，按钮隐藏');
        } else {
            console.log('错误：找不到面板或按钮元素');
            console.log('面板数量:', $panel.length);
            console.log('按钮数量:', $btn.length);
        }
    },

    /**
     * 处理收起按钮点击事件
     */
    _handleCollapseClick: function ($body) {
        var _t = this;
        console.log('执行收起操作');

        var $panel = $body.find('.date-navigation-container');
        var $btn = $body.find('.quick-location-btn');

        if ($panel.length > 0 && $btn.length > 0) {
            $panel.hide();
            $btn.show();
            console.log('操作完成 - 面板隐藏，按钮显示');
        } else {
            console.log('错误：找不到面板或按钮元素');
            console.log('面板数量:', $panel.length);
            console.log('按钮数量:', $btn.length);
        }
    },

    /**
     * 处理第一天按钮点击事件
     */
    _handleFirstDayClick: function ($body) {
        var _t = this;
        console.log('执行第一天导航操作');

        // 查找护理表单表格
        var $tables = $body.find('table[data-hm-datatable][data-hm-table-type="list"]');
        if ($tables.length === 0) {
            console.log('未找到护理表单表格');
            return;
        }

        // 获取最后一个表格的第一行
        var $lastTable = $tables.first();
        var $firstRow = $lastTable.find('tbody tr').first();

        if ($firstRow.length > 0) {
            console.log('跳转到表格第一行');

            // 滚动到第一行
            $firstRow[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // 高亮显示第一行
            $firstRow.addClass('highlighted-row');
            setTimeout(function () {
                $firstRow.removeClass('highlighted-row');
            }, 3000);
        } else {
            console.log('未找到表格行');
        }
    },

    /**
     * 处理前一天按钮点击事件
     */
    _handlePreviousDayClick: function ($body) {
        var _t = this;
        console.log('执行前一天导航操作');

        // 获取当前选中的日期
        var $datePickerInput = $body.find('.date-picker-input');
        var currentDateText = $datePickerInput.val();

        if (!currentDateText) {
            console.log('未选择当前日期，无法计算前一天');
            return;
        }

        // 解析当前日期
        var currentDate = new Date(currentDateText);
        if (isNaN(currentDate.getTime())) {
            console.log('当前日期格式无效');
            return;
        }

        // 计算前一天
        var previousDate = new Date(currentDate);
        previousDate.setDate(currentDate.getDate() - 1);

        // 格式化为中文格式
        var year = previousDate.getFullYear();
        var month = (previousDate.getMonth() + 1).toString().padStart(2, '0');
        var day = previousDate.getDate().toString().padStart(2, '0');
        var previousDateText = year + '-' + month + '-' + day;

        console.log('查找前一天:', previousDateText);

        // 使用_findAndScrollToDate函数查找前一天
        _t._findAndScrollToDate($body, previousDateText);

        // 更新日期输入框显示
        var chineseDate = year + '-' + month + '-' + day;
        $datePickerInput.val(chineseDate);
    },

    /**
     * 处理日期选择按钮点击事件
     */
    _handleDateSelectClick: function ($body) {
        var _t = this;
        console.log('执行日期选择操作');

        var $dateDisplay = $body.find('.date-nav-date-select');
        var $datePickerInput = $dateDisplay.find('.date-picker-input');

        // 直接触发日期选择器
        if ($datePickerInput.length > 0) {
            $datePickerInput.focus();
        }
    },

    /**
     * 处理后一天按钮点击事件
     */
    _handleNextDayClick: function ($body) {
        var _t = this;
        console.log('执行后一天导航操作');

        // 获取当前选中的日期
        var $datePickerInput = $body.find('.date-picker-input');
        var currentDateText = $datePickerInput.val();

        if (!currentDateText) {
            console.log('未选择当前日期，无法计算后一天');
            return;
        }

        // 解析当前日期
        var currentDate = new Date(currentDateText);
        if (isNaN(currentDate.getTime())) {
            console.log('当前日期格式无效');
            return;
        }

        // 计算后一天
        var nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);

        // 格式化为中文格式
        var year = nextDate.getFullYear();
        var month = (nextDate.getMonth() + 1).toString().padStart(2, '0');
        var day = nextDate.getDate().toString().padStart(2, '0');
        var nextDateText = year + '-' + month + '-' + day;

        console.log('查找后一天:', nextDateText);

        // 使用_findAndScrollToDate函数查找后一天
        _t._findAndScrollToDate($body, nextDateText);

        // 更新日期输入框显示
        var chineseDate = year + '-' + month + '-' + day;
        $datePickerInput.val(chineseDate);
    },

    /**
     * 处理最后一天按钮点击事件
     */
    _handleLastDayClick: function ($body) {
        var _t = this;
        console.log('执行最后一天导航操作');

        // 查找护理表单表格
        var $tables = $body.find('table[data-hm-datatable][data-hm-table-type="list"]');
        if ($tables.length === 0) {
            console.log('未找到护理表单表格');
            return;
        }

        // 获取最后一个表格的最后一行
        var $lastTable = $tables.last();
        var $lastRow = $lastTable.find('tbody tr').last();

        if ($lastRow.length > 0) {
            console.log('跳转到表格最后一行');

            // 滚动到最后一行
            $lastRow[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // 高亮显示最后一行
            $lastRow.addClass('highlighted-row');
            setTimeout(function () {
                $lastRow.removeClass('highlighted-row');
            }, 3000);
        } else {
            console.log('未找到表格行');
        }
    },

    /**
     * 查找并滚动到指定日期的表格行
     */
    _findAndScrollToDate: function ($body, targetDate) {
        var _t = this;
        console.log('开始查找日期:', targetDate);

        // 查找护理表单表格
        var $tables = $body.find('table[data-hm-datatable][data-hm-table-type="list"]');
        if ($tables.length === 0) {
            console.log('未找到护理表单表格');
            return;
        }

        var found = false;
        $tables.each(function () {
            var $table = $(this);
            var $rows = $table.find('tbody tr');
            // 如果已经找到匹配行,跳出循环
            if (found) {
                return false;
            }
            $rows.each(function () {
                var $row = $(this);
                // 查找第一列的单元格（日期时间数据元）
                var $firstCell = $row.find('td:first-child');

                if ($firstCell.length > 0) {
                    var $cell = $firstCell.first();
                    var cellText = $cell.text().trim();

                    console.log('检查第一列单元格:', cellText);

                    // 检查单元格内容是否包含目标日期
                    if (cellText && cellText.indexOf(targetDate) !== -1) {
                        console.log('找到匹配的日期行:', cellText);

                        // 滚动到该行
                        $row[0].scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });

                        // 高亮显示找到的行
                        $row.addClass('highlighted-row');
                        setTimeout(function () {
                            $row.removeClass('highlighted-row');
                        }, 3000);

                        found = true;
                        return false; // 跳出外层循环
                    }
                }
            });
        });

        if (!found) {
            console.log('未找到匹配的日期:', targetDate);
        }
    },

    /**
     * 处理对象项（图片对象、expressionbox对象等）
     * @param {Object} item - 要处理的对象
     * @returns {Object} - 包含html和imgFlag的结果对象
     */
    processObjectItem: function (item,$container) {
        var result = {
            html: null,
            imgFlag: false
        };

        // 如果item里面有keyCode字段，则通过keycode获取对应的dom节点的html
        if (item.keyCode) {
            try {
                var $body = $container;
                var $node = $body.find('[data-hm-code="' + item.keyCode + '"]:not([data-hm-node="labelbox"])');
                if ($node.length > 0) {
                    result.html = $node.first()[0].outerHTML;
                } else {
                    result.html = '';
                }
            } catch (e) {
                console.error('通过keycode获取DOM节点失败:', e);
                result.html = '';
            }
        } else if (item.类型 === 'img' && item.值) {
            // 处理图片对象
            result.html = this.createImageWidget(item);
            result.imgFlag = true;
        } else if (item.类型 === 'expressionbox' && item.值) {
            // 处理expressionbox对象
            result.html = this.createExpressionBoxWidget(item);
        } else {
            // 其他对象转为字符串
            result.html = String(item);
        }

        return result;
    },

    /**
     * 生成图片widget HTML（通用方法）
     * @param {String} imageSrc - 图片源
     * @param {String} style - 图片样式 
     * @returns {String} - 图片widget HTML
     */
    _generateImageWidgetHtml: function (imageSrc, style) {
        style = style || 'max-width:755px;max-height:320px;';
        var widgetId = Math.floor(Math.random() * 10000);
        var imgId = 'cms' + Math.random().toString(36).substr(2, 8) + '-' +
            Math.random().toString(36).substr(2, 4) + '-' +
            Math.random().toString(36).substr(2, 4) + '-' +
            Math.random().toString(36).substr(2, 4) + '-' +
            Math.random().toString(36).substr(2, 12);

        // 使用与原始CKEditor完全一致的结构，添加resizable标识
        var imgHtml = '<span>';
        imgHtml += '<span tabindex="-1" contenteditable="false" ';
        imgHtml += 'data-cke-widget-wrapper="1" data-cke-filter="off" ';
        imgHtml += 'data-hm-image-resizable="true" '; // 使用data属性而不是class
        imgHtml += 'class="cke_widget_wrapper cke_widget_inline cke_widget_image cke_image_nocaption" ';
        imgHtml += 'data-cke-display-name="图像" data-cke-widget-id="' + widgetId + '" ';
        imgHtml += 'role="region" aria-label=" 图像 小部件">';
        imgHtml += '<img style="' + style + '" ';
        imgHtml += 'id="' + imgId + '" ';
        imgHtml += 'src="' + imageSrc + '" ';
        imgHtml += 'data-cke-widget-upcasted="1" ';
        imgHtml += 'data-cke-widget-keep-attr="0" ';
        imgHtml += 'data-widget="image" ';
        imgHtml += 'class="cke_widget_element" alt="">';
        imgHtml += '<span class="cke_image_resizer" title="点击并拖拽以改变尺寸">&ZeroWidthSpace;</span>';
        imgHtml += '</span>';
        imgHtml += '</span>';

        return imgHtml;
    },

    /**
     * 创建图片widget HTML
     * @param {Object} item - 图片对象
     * @returns {String} - 图片widget HTML
     */
    createImageWidget: function (item) {
        return this._generateImageWidgetHtml(item.值, item.style);
    },

    /**
     * 创建expressionbox widget HTML
     * @param {Object} item - expressionbox对象
     * @returns {String} - expressionbox widget HTML
     */
    createExpressionBoxWidget: function (item) {
        var style = item._style || 'display: inline-table; vertical-align: middle;';
        // 转义HTML属性中的引号
        var safeStyle = style.replace(/"/g, '&quot;');
        var safeExpressionOption = (item._expressionoption || '').replace(/"/g, '&quot;');
        var safeExpressionValue = (item.值 || '').replace(/"/g, '&quot;');
        var safeId = (item.id || '').replace(/"/g, '&quot;');

        var expressionHtml = '<span contenteditable="false" data-hm-node="expressionbox" ';
        expressionHtml += '_expressionoption="' + safeExpressionOption + '" ';
        expressionHtml += 'data-hm-id="' + safeId + '" ';
        expressionHtml += '_expressionvalue="' + safeExpressionValue + '" ';
        expressionHtml += 'style="' + safeStyle + '">&ZeroWidthSpace;</span>';

        return expressionHtml;
    },

    /**
     * 处理单个字符串中的图片
     * @param {String} bindVal - 要处理的字符串
     * @returns {Object} - 包含处理后的值和imgFlag的结果对象
     */
    processStringImage: function (bindVal) {
        var result = {
            value: bindVal,
            imgFlag: false
        };

        if (bindVal && bindVal.indexOf('data:image/') === 0) {
            result.value = this._generateImageWidgetHtml(bindVal);
            result.imgFlag = true;
        }

        return result;
    },



    /**
     * 为现有的图片widget添加拖拽改变尺寸功能
     * @param {jQuery} $body 编辑器body元素
     */
    initExistingImageResizers: function ($body) {
        var _t = this;

        // 查找所有CKEditor图片widget但没有拖拽标识的
        $body.find('.cke_widget_image:not([data-hm-image-resizable])').each(function () {
            var $widget = $(this);

            // 检查是否已经有resizer元素
            if ($widget.find('.cke_image_resizer').length === 0) {
                // 添加resizer元素
                var $img = $widget.find('img');
                if ($img.length > 0) {
                    $img.after('<span class="cke_image_resizer" title="点击并拖拽以改变尺寸">&ZeroWidthSpace;</span>');
                }
            }

            // 添加拖拽标识
            $widget.attr('data-hm-image-resizable', 'true');

            console.log('为现有图片添加拖拽功能');
        });
    },
    /**
     * 自定义属性对象结构
     * @property {string} widget - 病历唯一编码
     * @property {string} section - 节点标识（病历ID、表格ID或数据元CODE）
     * @property {Array} customProperty - 自定义属性数组
     * @property {string} customProperty[].name - 属性名（如：data-custom-status）
     * @property {string} customProperty[].value - 属性值
     */
    setCustomProperties: function (widget, section, customProperty) {
        var _t = this;

        // 验证参数
        if (!widget || !section || !customProperty || !Array.isArray(customProperty) || customProperty.length === 0) {
            console.warn('setCustomProperties: 缺少必要参数或customProperty不是有效的数组');
            return;
        }

        // 验证数组中的每个属性对象
        for (var i = 0; i < customProperty.length; i++) {
            if (!customProperty[i] || !customProperty[i].name) {
                console.warn('setCustomProperties: customProperty数组中第' + i + '个元素缺少name属性');
                return;
            }
        }

        try {
            // 1. 根据widget获取编辑器中对应的病历
            var $body = $(_t.editor.document.getBody().$);
            var $widgetElement = $body.find('[data-hm-widgetid="' + widget + '"]');

            if ($widgetElement.length === 0) {
                console.warn('setCustomProperties: 未找到对应的病历widget, widgetId=' + widget);
                return;
            }

            console.log('找到病历widget:', widget);

            // 2. 根据section获取编辑器中对应的<hm-custom-properties>标签
            var $customPropertiesElement = $widgetElement.find('hm-custom-properties[section="' + section + '"]');

            if ($customPropertiesElement.length > 0) {
                // 如果找到了，则将customProperty数组中的每个name和value设置到<hm-custom-properties>标签属性中
                console.log('找到现有的hm-custom-properties标签，更新属性');

                for (var j = 0; j < customProperty.length; j++) {
                    var property = customProperty[j];
                    $customPropertiesElement.attr('data-custom-' + property.name, property.value || '');
                    console.log('更新属性:', property.name + '=' + (property.value || ''));
                }
            } else {
                // 如果获取不到，则创建一个<hm-custom-properties>标签
                console.log('未找到hm-custom-properties标签，创建新标签');

                var $newCustomPropertiesElement = $('<hm-custom-properties></hm-custom-properties>');
                $newCustomPropertiesElement.attr('section', section);

                // 设置customProperty数组中的所有属性
                for (var k = 0; k < customProperty.length; k++) {
                    var property = customProperty[k];
                    $newCustomPropertiesElement.attr('data-custom-' + property.name, property.value || '');
                    console.log('设置属性:', property.name + '=' + (property.value || ''));
                }

                // 追加到widget下
                $widgetElement.append($newCustomPropertiesElement);

                console.log('已创建并追加新的hm-custom-properties标签到widget');
            }

            console.log('setCustomProperties执行成功:', {
                widget: widget,
                section: section,
                propertiesCount: customProperty.length,
                properties: customProperty.map(function (prop) {
                    return prop.name + '=' + (prop.value || '');
                }).join(', ')
            });

        } catch (error) {
            console.error('setCustomProperties执行失败:', error);
        }
    },
    deleteCustomProperties: function (widget, section, propertyNames) {
        var _t = this;

        // 验证参数
        if (!widget || !section) {
            console.warn('removeCustomProperties: 缺少必要参数widget或section');
            return;
        }

        try {
            // 1. 根据widget获取编辑器中对应的病历
            var $body = $(_t.editor.document.getBody().$);
            var $widgetElement = $body.find('[data-hm-widgetid="' + widget + '"]');

            if ($widgetElement.length === 0) {
                console.warn('removeCustomProperties: 未找到对应的病历widget, widgetId=' + widget);
                return;
            }

            console.log('找到病历widget:', widget);

            // 2. 根据section获取编辑器中对应的<hm-custom-properties>标签
            var $customPropertiesElement = $widgetElement.find('hm-custom-properties[section="' + section + '"]');

            if ($customPropertiesElement.length === 0) {
                console.warn('removeCustomProperties: 未找到对应的hm-custom-properties标签, section=' + section);
                return;
            }

            console.log('找到hm-custom-properties标签:', section);

            // 3. 如果存在propertyNames数组则移除指定属性
            if (propertyNames && Array.isArray(propertyNames) && propertyNames.length > 0) {
                // 遍历数组，移除每个指定的属性
                var removedProperties = [];
                var notFoundProperties = [];

                for (var i = 0; i < propertyNames.length; i++) {
                    var propertyName = propertyNames[i];
                    if ($customPropertiesElement.attr('data-custom-' + propertyName) !== undefined) {
                        $customPropertiesElement.removeAttr('data-custom-' + propertyName);
                        removedProperties.push(propertyName);
                        console.log('已移除属性:', propertyName);
                    } else {
                        notFoundProperties.push(propertyName);
                        console.warn('removeCustomProperties: 属性不存在, propertyName=' + propertyName);
                    }
                }

                // 判断当前标签剩余属性个数，如果除section外属性个数为0，则移除当前标签
                var attributes = $customPropertiesElement[0].attributes;
                var remainingAttributesCount = 0;

                // 统计除section外的属性个数
                for (var j = 0; j < attributes.length; j++) {
                    var attrName = attributes[j].name;
                    if (attrName !== 'section') {
                        remainingAttributesCount++;
                    }
                }

                console.log('剩余属性个数（除section外）:', remainingAttributesCount);

                if (remainingAttributesCount === 0) {
                    $customPropertiesElement.remove();
                    console.log('除section外无其他属性，已移除整个hm-custom-properties标签');
                }

                console.log('removeCustomProperties执行成功:', {
                    widget: widget,
                    section: section,
                    removedProperties: removedProperties,
                    notFoundProperties: notFoundProperties
                });

            } else {
                // 如果没有指定propertyNames数组，则移除整个hm-custom-properties标签
                $customPropertiesElement.remove();
                console.log('已移除整个hm-custom-properties标签');

                console.log('removeCustomProperties执行成功:', {
                    widget: widget,
                    section: section,
                    action: '移除整个标签'
                });
            }

        } catch (error) {
            console.error('removeCustomProperties执行失败:', error);
        }
    },
    /**
     * 获取自定义属性值
     * @param {string} widget - 病历唯一编码
     * @param {string} section - 节点标识（病历ID、表格ID或数据元CODE）
     * @param {Array} propertyNames - 要获取的属性名数组（可选，如果不传则返回所有自定义属性）
     * @returns {Object} 属性名值对对象，格式：{属性名: 属性值}
     */
    getCustomProperties: function (widget, section, propertyNames) {
        var _t = this;

        // 验证参数
        if (!widget || !section) {
            console.warn('getCustomProperties: 缺少必要参数widget或section');
            return {};
        }

        try {
            // 1. 根据widget获取编辑器中对应的病历
            var $body = $(_t.editor.document.getBody().$);
            var $widgetElement = $body.find('[data-hm-widgetid="' + widget + '"]');

            if ($widgetElement.length === 0) {
                console.warn('getCustomProperties: 未找到对应的病历widget, widgetId=' + widget);
                return {};
            }

            console.log('找到病历widget:', widget);

            // 2. 根据section获取编辑器中对应的<hm-custom-properties>标签
            var $customPropertiesElement = $widgetElement.find('hm-custom-properties[section="' + section + '"]');

            if ($customPropertiesElement.length === 0) {
                console.warn('getCustomProperties: 未找到对应的hm-custom-properties标签, section=' + section);
                return {};
            }

            console.log('找到hm-custom-properties标签:', section);

            var result = {};
            var attributes = $customPropertiesElement[0].attributes;

            // 3. 如果指定了propertyNames数组，则只获取指定的属性
            if (propertyNames && Array.isArray(propertyNames) && propertyNames.length > 0) {
                console.log('获取指定属性:', propertyNames);

                for (var i = 0; i < propertyNames.length; i++) {
                    var propertyName = propertyNames[i];
                    var attrValue = $customPropertiesElement.attr('data-custom-' + propertyName);

                    if (attrValue !== undefined) {
                        result[propertyName] = attrValue;
                        console.log('获取到属性:', propertyName + '=' + attrValue);
                    } else {
                        console.warn('getCustomProperties: 属性不存在, propertyName=' + propertyName);
                        // 对于不存在的属性，可以选择不添加到结果中，或者添加为null
                        // result[propertyName] = null;
                    }
                }
            } else {
                // 4. 如果没有指定propertyNames，则获取所有自定义属性（除section外）
                console.log('获取所有自定义属性');

                for (var j = 0; j < attributes.length; j++) {
                    var attrName = attributes[j].name;
                    var attrValue = attributes[j].value;

                    // 只获取data-custom-开头的属性，排除section属性
                    if (attrName.indexOf('data-custom-') === 0) {
                        // 提取属性名（去掉data-custom-前缀）
                        var propertyName = attrName.substring('data-custom-'.length);
                        result[propertyName] = attrValue;
                        console.log('获取到属性:', propertyName + '=' + attrValue);
                    }
                }
            }

            console.log('getCustomProperties执行成功:', {
                widget: widget,
                section: section,
                requestedProperties: propertyNames || '所有属性',
                resultCount: Object.keys(result).length,
                result: result
            });

            return result;

        } catch (error) {
            console.error('getCustomProperties执行失败:', error);
            return {};
        }
    }
});