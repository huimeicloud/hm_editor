//# sourceURL=plugins/datasource/dialogs/datasourceConfig.js
CKEDITOR.dialog.add('datasourceConfig', function (editor) {
    var sdkHost = editor.HMConfig.sdkHost||'';
    return {
        title: '数据元',
        minWidth: 600,
        minHeight: 400,
        contents: [
            {
                id: 'config',
                label: '',
                elements: [
                    {
                        type: 'html',
                        html: '<iframe id="dsConfig" style="width:100%;height:390px"></iframe>',
                        setup: function (ele) {
                            //$('#dsConfig').attr('src', $('#dsConfig').attr('src'));

                            $('#dsConfig').hide();
                            document.getElementById('dsConfig').contentWindow.location.reload(true);

                            var init = function () {
                                $('#dsConfig').show();
                                window.editDs && ele && window.editDs(ele.$);
                            }
                            var iframe = $('#dsConfig')[0];
                            // 获取iframe body 加载
                            $.getTplHtml(sdkHost + '/plugins/datasource/dialogs/config/index.html',{
                                sdkHost: sdkHost
                            },function(bodyHtml){
                                var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                iframeDoc.open();
                                iframeDoc.write(bodyHtml);
                                iframeDoc.close();

                                if (iframe.attachEvent) {
                                iframe.attachEvent("onload", function () {
                                    init();
                                });
                            } else {
                                iframe.onload = function () {
                                    init();
                                };
                            }
                            });
                            //init();
                        },
                        commit: function (data) {
                            Object.assign(data, window.config())
                            //data = window.config();
                        }
                    }
                ]
            }],
        onOk: function () {
            var editor = editorIns;
            var d = {};
            this.commitContent(d);

            if (!d['data-hm-name']) {
                editor.showNotification("数据元不能为空");
                return false;
            }
            if (d['data-hm-node'] != 'labelbox' && !d['data-hm-code']) {
                editor.showNotification("请先选择数据元");
                return false;
            }
            if(d['data-hm-node'] == 'searchbox' && !d['_searchpair']){
                editor.showNotification("搜索类型数据元对应名称/编码不能为空");
                return false;
            }
            if (d['data-hm-items']) {
                d['items'] = d['data-hm-items'].split('#');
            }

            if (!this.insertMode) {
                _handleEdit(editor, d);
                return;
            }

            _handleCreate(editor, d);
        },
        onShow: function () {

            var _element = editor.contextTargetElement;
            var td;
            if (editor.elementPath()) {
                var td = editor.elementPath().contains('td');
            } else {
                editor.focus();
            }
            if (td && td.hasAttribute('data-hm-node')) {
                _element = td;
            } else if (_element && !_element.getAttribute('data-hm-node') && !_element.is('button')) {
                _element = _element.getParent();
            }

            if (editorIns.invoker == 'nodeproperties' && _element) {
                this.insertMode = false;
                this.setupContent(_element);
            } else {
                this.insertMode = true;
                this.setupContent(null);
            }


        },
        onCancel: function () {
            console.log('onCancel');
        },
        onLoad: function () {

        }
    }
})
function _handleEdit(editor, sourceData) {
    var element = editor.contextTargetElement;
    if (!element.hasAttribute('data-hm-node') && !element.is('button')) {
        element = element.getParent('data-hm-node');
    }
    var td = editor.elementPath().contains('td');
    if (td && td.hasAttribute('data-hm-node')) element = td;

    if(!sourceData['data-hm-items']){
        element.removeAttribute('data-hm-items');
    }

    removeDefineAttr(element.$);

    var attrs = Object.keys(sourceData);
    for (var i = 0; i < attrs.length; i++) {
        var attrKey = attrs[i];
        var attrVal = sourceData[attrKey];
        if (attrVal && attrKey.indexOf('_') == 0 && attrKey != 'items') {
            element.setAttribute(attrKey, attrVal);
        }
    }


    if(sourceData._timewidth){
        element.setAttribute('_timeWidth', sourceData._timewidth);
        element.setStyle('width',sourceData._timewidth+'px');
        element.setStyle('min-width',sourceData._timewidth+'px');
    }else {
        element.removeStyle('width');
        element.removeStyle('min-width');
    }

    if(sourceData['data-hm-items']){
        element.setAttribute('data-hm-items',sourceData['data-hm-items'] || '');
    }else{
        element.removeAttribute('data-hm-items');
    }


    switch (sourceData['data-hm-node']) {
        case 'labelbox':
            element.setText(sourceData['data-hm-name']);
            break;
        case 'timebox':
            break;
        case 'radiobox':
        case 'checkbox':
            element.$.innerHTML = '';

            for (var i = 0; i < sourceData.items.length; i++) {
                var itemNode = new CKEDITOR.dom.element('span');
                itemNode.setText('\u200B');
                itemNode.addClass('fa');
                itemNode.addClass(sourceData['data-hm-node'] === 'checkbox' ? 'fa-square-o' : 'fa-circle-o');
                itemNode.setAttribute('data-hm-node', sourceData['data-hm-node']);
                itemNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                $(itemNode.$).on('click', function () {
                    _handleCascade(this);
                });
                element.append(itemNode);

                var descNode = new CKEDITOR.dom.element('span');
                descNode.setText('\u200B');
                descNode.setAttribute('data-hm-node', 'labelbox');
                descNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                descNode.setText(sourceData.items[i]);
                element.append(descNode);
                element.appendText('\u00a0');
            }
            break;
        case 'dropbox':
            break;
        case 'cellbox':

            break;
        case 'textboxwidget':

            break;
        case 'newtextbox':
            var defaultPlaceholder = '_';
            if(!sourceData['_placeholder']){
               sourceData['_placeholder'] = defaultPlaceholder;
            }
            element.setAttribute('_placeholder',sourceData['_placeholder']);
            var childrenSpan = element.$.children;
            if (childrenSpan) {
                if ($(childrenSpan).attr('_placeholdertext')) {
                    $(childrenSpan).text(sourceData._placeholder);
                }
            }
            var newtextPlaceholder = $(element.$).find('.new-textbox-content');

            removeDefineAttr(newtextPlaceholder[0]);

            var _texttype = $(element).attr('_texttype');
            newtextPlaceholder.attr('_texttype', sourceData._texttype);
            newtextPlaceholder.attr('_placeholdertext', "true");
            if (_texttype == '纯文本') {
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.removeAttr('_timetype');
                newtextPlaceholder.removeAttr('data-hm-items');
                newtextPlaceholder.removeAttr('_selecttype');
                newtextPlaceholder.removeAttr('_jointsymbol');
            } else if (_texttype == '时间文本') {
                newtextPlaceholder.removeAttr('data-hm-items');
                newtextPlaceholder.removeAttr('_selecttype');
                newtextPlaceholder.removeAttr('_jointsymbol');
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.attr('_timetype', sourceData._timetype);
            } else if (_texttype == '数字文本') {
                newtextPlaceholder.removeAttr('data-hm-items');
                newtextPlaceholder.removeAttr('_selecttype');
                newtextPlaceholder.removeAttr('_jointsymbol');
                newtextPlaceholder.removeAttr('_timetype');
                newtextPlaceholder.attr('_precision', sourceData._precision);
            } else if (_texttype == '下拉') {
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.removeAttr('_timetype');


                sourceData['data-hm-items'] && newtextPlaceholder.attr('data-hm-items', sourceData['data-hm-items']);
                sourceData._selecttype && newtextPlaceholder.attr('_selecttype', sourceData._selecttype);
                sourceData._jointsymbol && newtextPlaceholder.attr('_jointsymbol', sourceData._jointsymbol);

            }




            for (var i = 0; i < attrs.length; i++) {
                var attrKey = attrs[i];
                var attrVal = sourceData[attrKey];
                if (attrKey.indexOf('_') > -1 && attrVal && attrKey != 'items') {
                    newtextPlaceholder.attr(attrKey, attrVal);
                }
            }



            break;
        case 'searchbox':
            // 添加对data-hm-search-url属性的处理
            if (sourceData['data-hm-search-url']) {
                element.setAttribute('data-hm-search-url', sourceData['data-hm-search-url']);
            } else {
                element.removeAttribute('data-hm-search-url');
            }
            if (sourceData['data-hm-search-params']) {
                element.setAttribute('data-hm-search-params', sourceData['data-hm-search-params']);
            } else {
                element.removeAttribute('data-hm-search-params');
            }
            break;
    }

    element.setAttribute('data-hm-name', sourceData['data-hm-name']);

}
function removeDefineAttr(element){
    if(!element){
        return;
    }
    var names = element.getAttributeNames();
    var len = names.length;
    for(var i=0;i<len;i++){
        var cn = names[i] || '';
        if(cn.indexOf('_') == 0){
            element.removeAttribute(cn);
        }
    }
}
function _handleCreate(editor, sourceData) {
    var ranges = editor.getSelection().getRanges();
    var legalRange = true;
    if (ranges.length == 1 && ranges[0].collapsed) {
        var eles = ranges[0].startPath().elements;
        for (var r = 0; r < eles.length; r++) {
            if (eles[r].is(CKEDITOR.dtd.$inline)) {
                legalRange = false;
                break;
            }
        }
    } else {
        legalRange = false;
    }
    if (editor.elementPath().contains('span') && editor.elementPath().contains('span').hasClass('new-textbox-content')) {
        legalRange = true;
    }
    var td = editor.elementPath().contains('td');
    if (td && td.hasAttribute('data-hm-node')) legalRange = false;
    if (!legalRange) {
        editor.showNotification('无法插入数据元到[格式化文本]或[选中文本]或[非嵌套类型数据元内]');
    } else {
        var node = new CKEDITOR.dom.element('span');
        node.setText('\u200B');
        //node.setAttribute('data-hm-node', sourceData['data-hm-node']);
        //node.setAttribute('data-hm-name', sourceData['data-hm-name']);
        //node.setAttribute('data-hm-code', sourceData['data-hm-code']);
        node.setAttribute('contentEditable', 'false');

        if (sourceData.type != 'labelbox') {
            node.setAttribute('data-hm-id', wrapperUtils.getGUID());
        }
        var attrs = Object.keys(sourceData);
        for (var i = 0; i < attrs.length; i++) {
            var attrKey = attrs[i];
            var attrVal = sourceData[attrKey];
            if (attrVal && attrKey != 'items') {
                node.setAttribute(attrKey, attrVal);
            }
        }




        editor.fire('lockSnapshot');
        editor.editable().insertText('\u200B');


        switch (sourceData['data-hm-node']) {
            case 'labelbox':
                node.setText(sourceData['data-hm-name']);
                editor.editable().insertElement(node);
                break;
            case 'newtextbox':
                var defaultPlaceholder = '_';
                if(!sourceData['_placeholder']){
                    sourceData['_placeholder'] = defaultPlaceholder;
                }
                var newtextbox = node.clone(true);
                newtextbox.addClass('new-textbox');
                newtextbox.setAttribute('_placeholder', sourceData['_placeholder']);
                var newtextPlaceholder = new CKEDITOR.dom.element('span');
                newtextPlaceholder.addClass('new-textbox-content');
                newtextPlaceholder.setAttribute('_placeholderText', true);
                newtextPlaceholder.setAttribute('contentEditable', 'true');
                newtextPlaceholder.setText( sourceData['_placeholder']);


                for (var i = 0; i < attrs.length; i++) {
                    var attrKey = attrs[i];
                    var attrVal = sourceData[attrKey];
                    if (attrKey.indexOf('_') > -1 && attrVal && attrKey != 'items') {
                        newtextPlaceholder.setAttribute(attrKey, attrVal);
                    }
                }


                if (sourceData._texttype == '下拉') {
                    sourceData['data-hm-items'] && newtextPlaceholder.setAttribute('data-hm-items', sourceData['data-hm-items']);


                }

                newtextbox.append(newtextPlaceholder);
                editor.editable().insertElement(newtextbox);

                break;
            case 'timebox':

                //node.setAttribute('_timeoption', sourceData.timeOption);
                if (sourceData._timewidth) {
                    node.setAttribute('_timewidth', sourceData._timewidth);
                    node.setStyle('width', sourceData._timewidth + 'px');
                    node.setStyle('min-width', sourceData._timewidth + 'px');
                }
                // if(sourceData.timePrintFormat){
                //     node.setAttribute('_time_print_format', sourceData.timePrintFormat);
                // }
                editor.editable().insertElement(node);
                break;
            case 'radiobox':
                for (var i = 0; i < sourceData.items.length; i++) {
                    var itemNode = new CKEDITOR.dom.element('span');
                    itemNode.setText('\u200B');
                    itemNode.addClass('fa');
                    itemNode.addClass('fa-circle-o');
                    itemNode.setAttribute('data-hm-node', sourceData['data-hm-node']);
                    itemNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    $(itemNode.$).on('click', function () {
                        _handleCascade(this);
                    });
                    node.append(itemNode);

                    var descNode = new CKEDITOR.dom.element('span');
                    descNode.setText('\u200B');
                    descNode.setAttribute('data-hm-node', 'labelbox');
                    descNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    descNode.setText(sourceData.items[i]);
                    node.append(descNode);

                    node.appendText('\u00a0');
                }

                //node.setAttribute('data-hm-items', sourceData.datasourceItem);
                //sourceData.radioStyle && node.setAttribute('_radioStyle', sourceData.radioStyle);
                //sourceData.radioSelectType && node.setAttribute('_radio_select_type', sourceData.radioSelectType);
                editor.editable().insertElement(node);
                break;
            case 'checkbox':
                for (var i = 0; i < sourceData.items.length; i++) {
                    var itemNode = new CKEDITOR.dom.element('span');
                    itemNode.setText('\u200B');
                    itemNode.addClass('fa');
                    itemNode.addClass('fa-square-o');
                    itemNode.setAttribute('data-hm-node', sourceData['data-hm-node']);
                    itemNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    $(itemNode.$).on('click', function () {
                        _handleCascade(this);
                    });
                    node.append(itemNode);

                    var descNode = new CKEDITOR.dom.element('span');
                    descNode.setText('\u200B');
                    descNode.setAttribute('data-hm-node', 'labelbox');
                    descNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    descNode.setText(sourceData.items[i]);
                    node.append(descNode);
                    node.appendText('\u00a0');
                }

                //node.setAttribute('data-hm-items', sourceData.datasourceItem);
                editor.editable().insertElement(node);
                break;
            case 'dropbox':
                //node.setAttribute('data-hm-items', sourceData.datasourceItem);
                //sourceData.selectType && node.setAttribute('_selectType', sourceData.selectType);
                //sourceData.jointSymbol && node.setAttribute('_jointSymbol', sourceData.jointSymbol);
                editor.editable().insertElement(node);
                break;
            case 'cellbox':
                var td = editor.elementPath().contains('td');
                var th = editor.elementPath().contains('th');
                if (!td && th) {
                    td = th;
                }
                if (td) {
                    td.setAttribute('data-hm-node', 'cellbox');
                    td.setAttribute('data-hm-name', sourceData['data-hm-name']);
                    td.setAttribute('data-hm-id', node.getAttribute('data-hm-id'));
                    td.setAttribute('data-hm-code', node.getAttribute('data-hm-code'));
                    sourceData['_association_name'] && td.setAttribute('_association_name', sourceData['_association_name']);
                } else {
                    editor.showNotification('单元类型仅限于插入表格中');
                }
                break;
            case 'searchbox':
                // 添加对data-hm-search-url属性的处理
                if (sourceData['data-hm-search-url']) {
                    node.setAttribute('data-hm-search-url', sourceData['data-hm-search-url']);
                }
                if (sourceData['data-hm-search-params']) {
                    node.setAttribute('data-hm-search-params', sourceData['data-hm-search-params']);
                }
                editor.editable().insertElement(node);
                break;
            case 'textboxwidget':
                node.addClass('textboxWidget-content');
                var wrapNode = new CKEDITOR.dom.element('span');
                wrapNode.addClass('textboxWidget');
                wrapNode.append(node);

                editor.insertElement(wrapNode);
                var widget = editor.widgets.initOn(wrapNode, 'textboxWidget');
                //editor.execCommand( 'textboxWidget' );
                break;
            // case 'button':
            //     editor.editable().insertElement(node);
            //     break;
            default:
                editor.showNotification('请选择一种数据元类型');
                break;
        }

        // 模板制作时, 在最后一行 (无 br 的 p) 末尾添加数据元时如果没有零宽字符就没法聚焦到后面
        editor.editable().insertText('\u200B');
        editor.fire('unlockSnapshot');
    }

}

function _handleCascade(node, target) {
    var i;
    var otherNodes = $(editorIns.document.$)
        .find('[data-hm-name="' + node.getAttribute("data-hm-name") +
            '"][data-hm-node="' + node.getAttribute("data-hm-node") +
            '"][data-hm-itemName!="' + node.getAttribute("data-hm-itemName") + '"]');

    if (node.getAttribute("data-hm-node") === "radiobox") {

        // 非选中的单选节点，隐藏所级联的内容
        for (i = 0; i < otherNodes.length; i++) {
            _cascade(otherNodes[i].getAttribute("data-hm-name"), otherNodes[i].getAttribute("data-hm-itemName"), "true");
        }

        // 选中的单选节点，显示内容
        _cascade(node.getAttribute("data-hm-name"), node.getAttribute("data-hm-itemName"), "false");

    }

    if (node.getAttribute("data-hm-node") === "checkbox") {

        // 非选中的多选节点，保持原状态
        for (i = 0; i < otherNodes.length; i++) {
            _cascade(otherNodes[i].getAttribute("data-hm-name"), otherNodes[i].getAttribute("data-hm-itemName"),
                otherNodes[i].getAttribute("_selected") === "true" ? "false" : "true");
        }

        // 选中的多选节点，改变状态
        _cascade(node.getAttribute("data-hm-name"), node.getAttribute("data-hm-itemName"), node.getAttribute("_selected"));

    }

    if (node.getAttribute("data-hm-node") === "dropbox") {

        if (node.getAttribute("data-hm-items") && node.getAttribute("data-hm-items").length > 0) {

            // 非选中的下拉选项，隐藏所级联的内容
            var items = node.getAttribute("data-hm-items").split("#");
            for (i = 0; i < items.length; i++) {
                if (items[i] !== target) {
                    _cascade(node.getAttribute("data-hm-name"), items[i], "true");
                }
            }

            // 选中的下拉选项，显示内容
            _cascade(node.getAttribute("data-hm-name"), target, "false");
        }

    }

    function _cascade(nodeName, nodeItem, nodeSelected) {
        var _cascades = $(editorIns.document.$).find('[_cascade="' + nodeName + "_" + nodeItem + '"]');
        if (_cascades.length > 0) {
            for (var i = 0; i < _cascades.length; i++) {
                if (_cascades[i].getAttribute("_placeholdertext") !== "true") {
                    if (nodeSelected === "true") {
                        $(_cascades[i]).hide();
                    } else {
                        $(_cascades[i]).show();
                    }
                }

            }
        }
    }
}
// 级联数据元处理
function _handleRelevance(node){
    if(node.hasClass('new-textbox-content')){
        node = $(node.parent()[0]);
    }
    if (!node.attr('_relevance')) {
        return;
    }
    var relevanceArr = JSON.parse(node.attr('_relevance'));
    var val = getVal(node).replace(zeroWidthChar, '');
    console.log('值------------'+val)
    var valArr = [];
    var nodeType = node.attr('data-hm-node');
    switch (nodeType) {
        case 'newtextbox':
            var _texttype = node.attr('_texttype');
            if (_texttype == '下拉') {
                var jointsymbol = node.attr('_jointSymbol') || ',';
                valArr = val.split(jointsymbol);
            }else{
                valArr = [val];
            }
            break;
        case 'radiobox':
            valArr = [val];
            break;
        case 'checkbox':
            valArr = val;
            break;
        default:
            valArr = [val];
            break;
    }
    var $body = $(editorIns.document.getBody().$);
    for (var i = 0; i < relevanceArr.length; i++) {
        var 当前数据元值 = relevanceArr[i]['当前数据元值'];
        var 关联数据元名称 = relevanceArr[i]['关联数据元名称'];
        var 关联数据元值 = relevanceArr[i]['关联数据元值'];
        var 关联数据元显示隐藏 = relevanceArr[i]['关联数据元显示隐藏'];
        var ele = $body.find('[data-hm-name="' + 关联数据元名称 + '"]:not([data-hm-node="labelbox"])');
        if (关联数据元值) {
            var eleType = ele.attr('data-hm-node');
            if (valArr.includes(当前数据元值)) {
                switch (eleType) {
                    case 'newtextbox':
                        var _placeholder = ele.attr('_placeholder') || '';
                        var newtextboxcontent = ele.find("span.new-textbox-content");
                        newtextboxcontent.removeAttr('_placeholdertext');
                        if (关联数据元值 == '置空') {
                            newtextboxcontent.html('');
                        } else {
                            newtextboxcontent.html(关联数据元值);
                        }
                        break;
                    case 'radiobox':
                        ele.find('span[data-hm-node="radiobox"]').removeClass('fa-dot-circle-o').addClass('fa-circle-o').removeAttr('_selected');
                        if (关联数据元值 != '置空') {
                            ele.find('span[data-hm-node="radiobox"][data-hm-itemname="'+关联数据元值+'"]').removeClass('fa-circle-o').addClass('fa-dot-circle-o').attr('_selected','true');
                        }
                    case 'checkbox':
                        if (关联数据元值 == '置空') {
                            ele.find('span[data-hm-node="checkbox"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').removeAttr('_selected');
                        } else {
                            ele.find('[data-hm-itemname='+关联数据元值+']:not([data-hm-node="labelbox"])').removeClass('fa-square-o').addClass('fa-check-square-o').attr('_selected', 'true');
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        if(关联数据元显示隐藏){
            if (关联数据元显示隐藏 == '显示') {
                if (valArr.includes(当前数据元值)) {
                    ele.show();
                } else {
                    ele.hide();
                }
            } else if (关联数据元显示隐藏 == '隐藏') {
                if (valArr.includes(当前数据元值)) {
                    ele.hide();
                } else {
                    ele.show();
                }
            }
        }
    }
}

function getVal(el) {
    var spanObj = {};
    var type = $(el).attr('data-hm-node'); // 数据元类型
    var keyValue = '';
    spanObj.keyValue = keyValue;
    var _t = window.hmEditor.documentModel;
    var $emrWidget = $(el).closest("[data-hm-widgetid]");
    switch (type) {
        case 'newtextbox':
            spanObj = _t.handleNewTextbox(el, spanObj);
            break;
        case 'dropbox':
            spanObj = _t.handleDropbox(el, spanObj);
            break;
        case 'cellbox':
        case 'timebox':
            spanObj = _t.handleTimeBox(el, spanObj);
            break;
        case 'textboxwidget':
            var value = $(el).text();
            spanObj.keyValue = value ? value.replace(/\u200B/g, '') : '';
            break;
        case 'expressionbox':
            var value = $(el).attr('_expressionvalue');
            spanObj.keyValue = value;
            break;
        case 'searchbox':
            spanObj = _t.handleSearchbox(el, spanObj);
            break;
        case 'radiobox':
            spanObj = _t.handleRadiobox(el, spanObj, $emrWidget);
            break;
        case 'checkbox':
            spanObj = _t.handleCheckbox(el, spanObj, $emrWidget);
            break;
        default:
            spanObj = null;
    }
    return spanObj.keyValue;
}

