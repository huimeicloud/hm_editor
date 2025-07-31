commonHM.component['documentModel'].fn({
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
        if (designMode != 'true') {
            var $div = $(content
                .replace(/<(body)(.*?)>/, "<div$2>")
                .replace('</body>', '</div>')
                .replace(/↵/, '<br/>')
                .replace(/(<span[^>]+_timeoption=[^>]*>)(<\/span>)/g, '$1\u200B$2'));
            var $body = $(_t.editor.document.getBody().$);
            $body.html($div.html());

            // 初始化不可用数据源状态
            _t.initDisabledDatasourceState($body);

            if (!_t.editor.reviseModelOpened) {
                _t.hideReviseModel($body);
            }
        } else {
            var $div = $(content.replace(/<(body)(.*?)>/, "<div$2>").replace('</body>', '</div>').replace(/↵/, '<br/>').replace(/(<span[^>]+_timeoption=[^>]*>)(<\/span>)/g, '$1\u200B$2'));
            var $body = $(_t.editor.document.getBody().$);
            $body.html($div.html());
            if ($body.find('.switchModel').length == 1) {
                CKEDITOR.plugins.switchmodelCmd.currentModel = '表单模式';
            } else {
                CKEDITOR.plugins.switchmodelCmd.currentModel = '编辑模式';
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
    },
    /**
     * 渲染数据
     * @param {*} data
     */
    renderData: function (data) {
        var _t = this;
        // 遍历数据数组
        data.forEach(function (item) {
            if (item.code && item.data) {
                // 查找具有相同 doc_code 属性的节点
                var $nodes = $(_t.editor.document.$).find('[doc_code="' + item.code + '"]');
                // 如果找到节点，更新其内容
                if ($nodes.length > 0) {
                    $nodes.each(function () {
                        var $node = $(this);
                        // 遍历 data 数组，查找匹配的节点
                        item.data.forEach(function (dataItem) {
                            if (dataItem.keyCode || dataItem.keyName) {
                                var datasourceNode;
                                // 优先通过 keyCode 查找 data-hm-code 属性
                                datasourceNode = $node.find('[data-hm-code="' + dataItem.keyCode + '"]:not([data-hm-node="labelbox"])');
                                // 如果通过 keyCode 没找到，则通过 keyName 查找 data-hm-name 属性
                                if ((!datasourceNode || datasourceNode.length === 0) && dataItem.keyName) {
                                    datasourceNode = $node.find('[data-hm-name="' + dataItem.keyName + '"]:not([data-hm-node="labelbox"])');
                                }
                                // 获取节点类型
                                var nodeType = datasourceNode.attr('data-hm-node');
                                var bindVal = dataItem.keyValue;
                                var imgFlag = false;
                                if (Array.isArray(bindVal)) {
                                    bindVal = bindVal.map(function (item) {
                                        if (typeof item === 'string' && item.indexOf('data:image/png;base64,') === 0) {
                                            imgFlag = true;
                                            return '<img src="' + item + '" style="width: 50px; height: 25px; vertical-align: middle" uname="" />';
                                        } else if (typeof item === 'string') {
                                            return item.replace(/↵/g, '<br/>');
                                        } else {
                                            return String(item);
                                        }
                                    });
                                } else if (typeof (bindVal) == 'string') {
                                    bindVal = bindVal.replace(/↵/g, '<br/>');
                                    if (bindVal && bindVal.indexOf('data:image/png;base64,') == 0) {
                                        bindVal = '<img  src=' + bindVal + ' style="width: 50px; height: 25px; vertical-align: middle" uname="" />';
                                        imgFlag = true;
                                    }
                                }
                                if (datasourceNode.length > 0) {
                                    _t.bindDatasource(datasourceNode, nodeType, bindVal, imgFlag);
                                }
                            }
                        });
                    });
                }
            }
        });
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

                    if (_texttype == '下拉' && bindVal) {
                        var selectType = newtextboxcontent.attr('_selectType');
                        var jointsymbol = newtextboxcontent.attr('_jointSymbol') || ',';
                        var items = newtextboxcontent.attr('data-hm-items').split('#');
                        var nodeText = bindVal.split(jointsymbol || ',');
                        // 判断是否是带编码选项
                        var items0 = items[0].match(/(.+)\((.*?)\)\s*$/);
                        var codeArr = [];
                        if (items0 && items0.length == 3) {
                            for (var x = 0; x < items.length; x++) {
                                var itemsArr = items[x].match(/(.+)\((.*?)\)\s*$/);
                                if (selectType == '单选') {
                                    if (bindVal == itemsArr[1]) {
                                        codeArr.push(itemsArr[2]);
                                        break;
                                    }
                                } else {
                                    if (nodeText.includes(itemsArr[1])) {
                                        codeArr.push(itemsArr[2]);
                                    }
                                }
                            }
                            if (codeArr.length > 0) {
                                newtextboxcontent.attr('code', codeArr.join(jointsymbol));
                            }
                        }
                    }
                    newtextboxcontent.html(bindVal || _placeholder);
                    _handleRelevance(datasourceNode);
                }
                break;
            case 'dropbox':
                datasourceNode.text(bindVal);
                break;
            case 'timebox':
                try {
                    var _timeoption = datasourceNode.attr('_timeoption');
                    bindVal = _t.formatStringDate(bindVal, _timeoption);
                } catch (e) {
                    console.log(bindVal);
                    console.log(e);
                }
                datasourceNode.text(bindVal);
                break;
            case 'searchbox':
                var searchOption = datasourceNode.attr('_searchoption') || '';
                var searchpair = (datasourceNode.attr('_searchpair') || '').replace(/\u200B/g, '');
                var searchpairVal = _t.genericDataConvert(data, searchpair);

                function setupSearchbox() {
                    datasourceNode.text(bindVal);
                    var searchPairIsCode = true;
                    if (searchOption.indexOf('码') > 0) {
                        // 当前搜索数据元为编码类数据元
                        searchPairIsCode = false;
                    }
                    if (searchPairIsCode) {
                        datasourceNode.attr('_code', searchpairVal);
                        datasourceNode.attr('_name', bindVal);
                    } else {
                        datasourceNode.attr('_code', bindVal);
                        datasourceNode.attr('_name', searchpairVal);
                    }
                }
                setupSearchbox();
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
                var valArr = bindVal;
                var $ds = datasourceNode;
                $ds.find('span[data-hm-node="checkbox"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').attr('_selected', 'false');
                for (var j = 0; j < valArr.length; j++) {
                    // 对值进行转义处理
                    var escapedVal = valArr[j].replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
                    $ds.find('[data-hm-itemname="' + escapedVal + '"]:not([data-hm-node="labelbox"])').removeClass('fa-square-o').addClass('fa-check-square-o').attr('_selected', 'true');
                }
                break;
            case 'radiobox':
                var $ds = datasourceNode;
                $ds.find('span[data-hm-node="radiobox"]:not([data-hm-node="labelbox"])').removeClass('fa-dot-circle-o').addClass('fa-circle-o');
                $ds.find('span[data-hm-node="radiobox"][data-hm-itemname="' + bindVal + '"]:not([data-hm-node="labelbox"])').addClass('fa-dot-circle-o');
                break;
            case 'textboxwidget':
                var $ds = datasourceNode;
                $ds.text(bindVal);
                break;
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

        // 单选 & 多选初始添加级联事件
        $body.find("[data-hm-node=radiobox]").each(function () {
            $(this).on('click', function () {
                _handleCascade(this);
            });
        });
        $body.find("[data-hm-node=checkbox]").each(function () {
            $(this).on('click', function () {
                _handleCascade(this);
            });
        });
        $body.find("div[data-hm-widgetid]").each(function () {
            $(this).on('click', function () {
                if ($(this).attr('contenteditable') == 'false') {
                    return;
                }
                if (!window.hmEditor.hmAi.awekenAiWidget[$(this).attr('data-hm-widgetid')]) {
                    console.log('点击了widget');
                    _t._handleEditorTool(this);
                }
            });
        });
        $body.find('table[data-hm-datatable][is_nursing_form="true"]').on('mouseleave','tbody tr',function(){
            $body.find('.table-row-actions').remove();
        }).on('mouseenter.tableActions', 'tbody tr', function (event) {
            // 使用 event.target 来获取实际触发的元素
            var $tr = $(event.target).closest('tr');
            _t._handleTrMouseEnter($tr[0], $tr.index());
        }).on('click.tableActions', '.add-row-icon', function (e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('=====增加行=====');
            _t._addTableRow($(this).closest('tr'));
        }).on('click.tableActions', '.delete-row-icon', function (e) {
            e.stopPropagation();
            e.preventDefault(); 
            console.log('=====删除行=====');
            _t._deleteTableRow($(this).closest('tr'));
        });
    },
  
    _handleTrMouseEnter: function (tr, index) {
        var _t = this;
        try {
            var $tr = $(tr);
            if (!$tr.length) {
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

            // 添加删除行图标（只有当行数大于1时才显示）
            var $deleteIcon = $('<span class="delete-row-icon" title="删除行" contenteditable="false"><i class="fa fa-minus-square"></i></span>');
            if (totalRows == 1) {
                $deleteIcon.addClass('disabled').attr('title', '至少保留一行');
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
    _handleEditorTool: function (widget) {
        var _t = this;
        var widgetId = $(widget).attr('data-hm-widgetid').trim();
        var widgetName = $(widget).attr('data-hm-widgetname').trim();
        var recordType = _t.getRecordType(widgetName);
        const params = {
            recordType: recordType,
            progressGuid: widgetId
        };
        window.hmEditor.hmAi.setContainer(params);
    },
    /**
     * 根据病历文书名称，获取文书类型
     * @param {*} widgetName 文书名称
     * @returns 文书类型
     */
    getRecordType: function (widgetName) {
        var _t = this;
        var _pWindow = parent.window;;
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
            var style = $node.getAttribute('data-hm-substyle');
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
     * 在光标处插入内容
     * @param {String} content 要插入的内容
     */
    insertContentAtCursor: function (content) {
        var _t = this;
        var selection = _t.editor.getSelection().getRanges()[0];
        if (!selection) {
            console.error('未找到光标位置');
            return;
        }
        _t.editor.insertHtml(content);
        _t.editor.editable().fire('togglePlaceHolder', {});
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
            
            var $newRow = $currentRow.clone();
            $newRow.find('.table-row-actions').remove();
            
            // 清空新行中的内容
            $newRow.find('td').each(function() {
                var $td = $(this);
                
                // 清空文本框内容
                var $textbox = $td.find('.new-textbox-content');
                if ($textbox.attr('_placeholder') && $textbox.attr('_placeholder') != '') {
                    $textbox.text($textbox.attr('_placeholder'));
                    $textbox.attr('_placeholdertext', 'true');
                }
                
                // 清空单选框选中状态
                $td.find('[data-hm-node=radiobox]').prop('checked', false);
                
                // 清空复选框选中状态  
                $td.find('[data-hm-node=checkbox]').prop('checked', false);

                // 清空时间选中状态
                $td.find('[data-hm-node=timebox]').html('&nbsp;');
                
                // 清空下拉框选中值
                $td.find('select').prop('selectedIndex', 0);
                
                // 清空普通文本内容
                if(!$td.find('[data-hm-node]').length) {
                    $td.text('');
                }
            });
            
            // 将新行插入到当前行后面
            $currentRow.after($newRow);
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
});