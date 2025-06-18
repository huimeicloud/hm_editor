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
        var $body = $(_t.editor.document.getBody().$);
        var syncType = '全量同步';
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
                            if (dataItem.keyCode) {
                                // 在当前节点内查找具有对应 data-hm-code 的元素
                                var datasourceNode = $node.find('[data-hm-code="' + dataItem.keyCode + '"]:not([data-hm-node="labelbox"])');
                                // 获取节点类型
                                var nodeType = datasourceNode.attr('data-hm-node');
                                var bindVal = dataItem.keyValue;
                                var imgFlag = false;
                                if (Array.isArray(bindVal)) {
                                    bindVal = bindVal.map(function(item) {
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
                                    if(bindVal && bindVal.indexOf('data:image/png;base64,') == 0){
                                        bindVal = '<img  src='+bindVal+' style="width: 50px; height: 25px; vertical-align: middle" uname="" />';
                                        imgFlag = true;
                                    }
                                }
                                if (datasourceNode.length > 0) {
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
                                                switch (syncType) {
                                                    case '全量同步':
                                                        newtextboxcontent.html(bindVal || _placeholder);
                                                        _handleRelevance(datasourceNode);
                                                        break;
                                                    default:
                                                        if (newtextboxcontent.text().replace(/\u200B/g, '').replace(_placeholder, '').replace(/\s+/, '') == '') {
                                                            newtextboxcontent.html(bindVal);
                                                            _handleRelevance(datasourceNode);
                                                        }
                                                        break;
                                                }
                                            }
                                            break;
                                        case 'dropbox':
                                            switch (syncType) {
                                                case '全量同步':
                                                    datasourceNode.text(bindVal);
                                                    break;
                                                default:
                                                    if (datasourceNode.text().replace(/\u200B/g, '') == '') {
                                                        datasourceNode.text(bindVal);
                                                    }
                                                    break;
                                            }
                                            break;
                                        case 'timebox':

                                            try {
                                                var _timeoption = datasourceNode.attr('_timeoption');
                                                bindVal = _t.formatStringDate(bindVal, _timeoption);
                                            } catch (e) {
                                                console.log(bindVal);
                                                console.log(e);
                                            }

                                            switch (syncType) {
                                                case '全量同步':
                                                    datasourceNode.text(bindVal);
                                                    break;
                                                default:
                                                    if (datasourceNode.text().replace(/\u200B/g, '') == '') {
                                                        datasourceNode.text(bindVal);
                                                    }
                                                    break;
                                            }

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
                                            switch (syncType) {
                                                case '全量同步':
                                                    setupSearchbox();
                                                    break;
                                                default:
                                                    if (datasourceNode.text().replace(/\u200B/g, '') == '') {
                                                        setupSearchbox();
                                                    }
                                                    break;
                                            }
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
                                            // var connector = '´';
                                            // var valArr = bindVal.split(connector);
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
                                }
                            }
                        });
                    });
                }
            }
        });

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
        editable.fire('togglePlaceHolder', { 'showAllPlaceholder': true });

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
                CKEDITOR.plugins.pagebreakCmd.performAutoPaging(_t.editor, { name: '只读病历分页', data: evtTrace });
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

            // // 成组病历打印时页码问题（现场模板页脚数据元导致）
            // if (continuousGroupRecord) {
            //     var _$section = $('<section></section)');
            //     _$section.append(病历文档);
            //     _$section.find("table[_paperfooter]").remove();
            //     _$section.find("span[data-hm-name='页数']").closest("table").remove();
            //     病历文档 = _$section.html() + '<table class="solid-border" style="width: 100%;" data-hm-table="true" _paperfooter="true"><tbody><tr><td style="text-align: center; border-width: 1px; border-style: none;">第<span contenteditable="false" class="page"> </span>页</td></tr></tbody></table>';
            // }
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

            var record_widget = '<div class="emrWidget">' +
                '<div class="' + contentClass + '" ' +
                'data-hm-widgetid="' + 病历ID + '" ' +
                'data-hm-widgetname="' + 病历名称 + '" ' +
                'doc_code="' + 病历ID + '" ' +
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

        contents = contents.replace(/<body.*?>/g, '').replace(/<\/body>/g, '');//去除所有body标签

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
    insertContent: function(insertPosition, docs) {
        var _t = this;
        if (!Array.isArray(docs) || docs.length === 0) {
            console.error('要插入的文档必须是数组类型且不能为空');
            return;
        }
        var recordWidgetList = _t.getRecordWidgetList();//拿到各个widget里面的内容

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
        // return newRecordWidgetList;
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
            var meta_json = $node.getAttribute('data-hm-submeta_json');
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
                widgetContent = '<body data-hm-papersize="' + papersize + '" meta_json="' + meta_json + '" style="' + style + '" newstyle="' +newstyle+ '" >' + $recordContent[0].innerHTML + '</body>';
            }
            var doc_code = $node.getAttribute('data-hm-widgetid');


            var recordFile = {
                "code": doc_code,
                "docContent":widgetContent
            };
            recordList.push(recordFile);
        }

        return recordList;
    },
    /**
     * 在光标处插入内容
     * @param {String} content 要插入的内容
     */
    insertContentAtCursor: function(content) {
        var _t = this;
        var selection = _t.editor.getSelection().getRanges()[0];
        if (!selection) {
            console.error('未找到光标位置');
            return;
        }

        _t.editor.insertHtml(content);
        _t.editor.editable().fire('togglePlaceHolder', {});
    }
});