commonHM.component['documentModel'].fn({
    getDocumentText: function (widget) {
        var copyWidget = $(widget).clone(true);
        copyWidget.find('[_placeholdertext="true"]').each(function () {
            $(this).text('');
        });
        copyWidget.find('.r-model-gen-remark').each(function () {
            $(this).remove();
        });
        return copyWidget.text();
    },
    /**
     * 获取html内容
     */
    getDocumentHtml: function (widget) {
        var _t = this;
        var $body = _t.editor.document.getBody();
        var paperSize = $body.getAttribute('data-hm-papersize');
        var meta_json = $body.getAttribute('meta_json');
        //提取widget中的文档属性
        var papersize = paperSize || $(widget).attr('data-hm-subpapersize');
        var meta_json = meta_json || $(widget).attr('meta_json');
        var style = $(widget).attr('data-hm-substyle');
        var $recordContent = $('<body></body>').append($(widget).html());
        //将隐藏的页眉、页脚恢复
        $recordContent.find("table[_paperheader]").each(function () {
            $(this).css("display", "");
        });
        $recordContent.find("table[_paperfooter]").each(function () {
            $(this).css("display", "");
        });
        var _class = '';
        if ($($body.$).find('.switchModel').length > 0) {
            _class = 'switchModel';
        }
        var widgetContent = '<body data-hm-papersize="' + (papersize || "") + '" meta_json="' + (meta_json || "") + '" style="' + (style || "") + '" class="' + (_class || "") + '">' + $recordContent[0].innerHTML + '</body>';
        //病程是否使用新样式
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
        var sourceObj = [];
        var dataSourceList = $body.find('[data-hm-name]:not([data-hm-node="labelbox"])');
        for (var i = 0; i < dataSourceList.length; i++) {
            var spanObj = {};
            var ele = dataSourceList[i];
            var type = $(ele).attr('data-hm-node'); // 数据元类型
            var keyCode = $(ele).attr('data-hm-code');
            var keyId = $(ele).attr('data-hm-id');
            var keyName = $(ele).attr('data-hm-name');
            var keyValue = '';
            spanObj.keyCode = keyCode || '';
            spanObj.keyId = keyId || '';
            spanObj.keyName = keyName || '';
            spanObj.keyValue = keyValue;
            // 处理不同类型的值
            switch (type) {
                case 'newtextbox':
                    spanObj = _t.handleNewTextbox(ele, spanObj);
                    break;
                case 'dropbox':
                    spanObj = _t.handleDropbox(ele, spanObj);
                    break;
                case 'cellbox':
                    var value =  !$(ele).attr('_placeholdertext') ? $(ele).text() : '';
                    spanObj.keyValue = value ? value.replace(/\u200B/g, '') : '';
                    break;
                case 'timebox':
                    spanObj = _t.handleTimeBox(ele, spanObj);
                    break;
                case 'textboxwidget':
                    var value =  !$(ele).attr('_placeholdertext') ? $(ele).text() : '';
                    spanObj.keyValue = value ? value.replace(/\u200B/g, '') : '';
                    break;
                case 'expressionbox':
                    var value =  !$(ele).attr('_placeholdertext') ? $(ele).attr('_expressionvalue') : '';
                    spanObj.keyValue = value;
                    break;
                case 'searchbox':
                    spanObj = _t.handleSearchbox(ele, spanObj);
                    break;
                case 'radiobox':
                    spanObj = _t.handleRadiobox(ele, spanObj, $body);
                    break;
                case 'checkbox':
                    spanObj = _t.handleCheckbox(ele, spanObj, $body);
                    break;
                default:
                    spanObj = null;
            }
            // 如果spanObj不为空，则将spanObj添加到sourceObj中
            if (spanObj) {
                sourceObj.push(spanObj);
            }
        }
        // 返回数据源对象
        return sourceObj;
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
            var code = _con.attr('code'); // 下拉框编码
            var text = '';
            if(!_con.attr('_placeholdertext')){
                text = _con.text(); // 下拉框文本
            } 
            spanObj.keyValue = text && selectType == '多选' ? text.split(',') : text;
            if (selectType == '多选') {
                spanObj.keyName = code && code.split(',');
            }
        } else { 
            if (!_con.attr('_placeholdertext')) {
                spanObj.keyValue = _con.text();
            }
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
        var items = $datasource.attr('data-hm-items');
        var code = "";
        var value = !$datasource.attr('_placeholdertext') ? $datasource.text() : '';
        value = value ? value.replace(/\u200B/g, '').replace(/\u3000/g, '') : '';
        if (items != null && items.trim() != '') {
            var itemList = items.split("#");
            var selectType = $datasource.attr('_selectType');
            var jointsymbol = $datasource.attr('_jointsymbol');
            if (selectType == '多选') {
                value = (value || '').replace(/\s*/, '');
                var arr = value.split(jointsymbol);
                var codeArr = [];
                var valueArr = [];
                for (var k = 0; k < arr.length; k++) {
                    var element = arr[k];
                    for (var j = 0; j < itemList.length; j++) {
                        var item = itemList[j];
                        var matches = item.match(/\s*(.+)\((.*?)\)\s*$/);
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
        spanObj.keyValue = value;
        spanObj.keyCode = code;
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
        var code = $(ele).attr('_code');
        var name = $(ele).attr('_name');
        spanObj.keyCode = code;
        spanObj.keyValue = name;
        return spanObj;
    },
    // 处理单选框取值
    handleRadiobox: function (ele, spanObj, $body) {
        var $datasource = $(ele);
        var checksources = $datasource.find('[data-hm-node="radiobox"]');
        var value = [];
        var code = '';
        for (var j = 0; j < checksources.length; j++) {
            var checksource = checksources[j];
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
        spanObj.keyValue = value;
        spanObj.keyCode = code;
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
            spanObj.keyCode = code;
            spanObj.keyValue = value;
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
        for (var j = 0; j < checksources.length; j++) {
            var checksource = checksources[j];
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
        spanObj.keyCode = codeList.length > 0 ? codeList : "";
        spanObj.keyValue = checkList.length > 0 ? checkList : "";
        //老结构
        if (checksources.length == 0) {
            checksources = $body.find('[data-hm-node="checkbox"][data-hm-name="' + name + '"]');
            for (var j = 0; j < checksources.length; j++) {
                var checksource = checksources[j];
                var nameValue = checksource.getAttribute('data-hm-itemname');
                nameValue = nameValue ? nameValue.replace(/\u200B/g, '') : '';
                if (checksource.getAttribute('_selected')) {
                    checkList.push(nameValue);
                }
            }
            spanObj.keyCode = code;
            spanObj.keyValue = checkList;
        }
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
        var $cloneBody = realtimePageBreak ? CKEDITOR.plugins.pagebreakCmd.removeAllSplitters(_t.editor, true) : $(_t.editor.document.getBody().$).clone(true);
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
     * @param {Object} code 文档唯一编号
     * {
     *   code: '文档唯一编号',
     *   flag: 1, // 1:获取html文本 2:获取text文本 3:获取数据元Data
     *   keyList: ['数据元编码1','数据元编码2'] // 指定数据元编码列表
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
        var result = [];
        var widgetList = _t.getWidgetList(params.code);
        if (widgetList.length) {
            for (var i = 0; i < widgetList.length; i++) {
                var widget = widgetList[i];
                _t.getOneContentResult(widget, params, result);
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
        var _data = _t.getFilterData(params.keyList || [], _t.getContentData(widget))
        var _id = $(widget).attr('data-hm-widgetid') || '';
        if (!params.code && !params.flag) {
            result.push({
                code: params.code || _id,
                data: _data,
                html: _html,
                text: _text
            });
        } else {
            if (params.flag == 1) {
                result.push({
                    code: params.code || _id,
                    html: _html
                });
            } else if (params.flag == 2) {
                result.push({
                    code: params.code || _id,
                    text: _text
                });
            } else if (params.flag == 3) {
                result.push({
                    code: params.code || _id,
                    data: _data
                });
            } else {
                result.push({
                    code: params.code || _id,
                    data: _data,
                    html: _html,
                    text: _text
                });
            }
        }
        return result;
    }
});