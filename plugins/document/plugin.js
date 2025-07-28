/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */


/**
 * 初始化将带有不可编辑属性数据元状态置为不可编辑状态
 * @param {*} $body
 */
function initDisabledDatasourceState($body) {
    initDisabled($body);
    initWriteAble($body);
}
// 只读
function initDisabled($body) {
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
}
// 可自由录入
function initWriteAble($body){
    var disableDataSource = $body.find('span[data-hm-node=newtextbox]');
    for (var i = 0; i < disableDataSource.length; i++) {
        var _dataSource = $(disableDataSource[i]);
        var type = _dataSource.attr("_texttype");
        if(type == '诊断' || type == '手术' || type == '下拉'){
            if(_dataSource.attr("_writeable") != 'true'){
                _dataSource.find('.new-textbox-content').attr('contenteditable', 'false');
                _dataSource.attr('notallowwrite',"true");
            }
        }

    }
}
/**
 * 设置更新文档中的事件相应编辑状态
 * @param {*} bodyContents
 * @param {*} evtState
 */
function setEmrDocumentEditState(bodyContents, evtState) {
    //timebox/dropbox/checkbox/radiobox/ textbox/searchbox
    bodyContents.find('span[data-hm-node="timebox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
    bodyContents.find('span[data-hm-node="dropbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
    bodyContents.find('span[data-hm-node="checkbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
    bodyContents.find('span[data-hm-node="radiobox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
    bodyContents.find('span[data-hm-node="searchbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
    bodyContents.find('button[data-hm-id]').css('pointer-events', evtState);
}

function setEmrNewTextBoxEditable($docs, editStr) {
    var _newTextBox = $docs.find('span[data-hm-node="newtextbox"]:not([_isdisabled="true"]):not([notallowwrite="true"])');
    var _textboxwidget = $docs.find('span[data-hm-node="textboxwidget"]');
    var _addMarkList = $docs.find('ins[class*="hm"]');
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

    // 搜索、日期、下拉、单选、多选  contenteditable  处理
    // var otherDatasource = $docs.find('span[data-hm-node="searchbox"]:not([_isdisabled="true"]),span[data-hm-node="timebox"]:not([_isdisabled="true"]),span[data-hm-node="dropbox"]:not([_isdisabled="true"]),span[data-hm-node="radiobox"]:not([_isdisabled="true"]),span[data-hm-node="checkbox"]:not([_isdisabled="true"])');
    // otherDatasource.attr("contenteditable", editStr);
}
/**
 * 更新对应修改以留痕显示
 */
function setMarkContent(editor, newData) {
    var nodeType = newData['类型'] || '';
    var $datasource = editor.document.find('[data-hm-name = "' + (newData['name'] || "") + '"][data-hm-node= "' + nodeType + '"]');
    if (newData['id']) {
        $datasource = editor.document.find('[data-hm-node= "' + nodeType + '"][data-hm-id= "' + newData['id'] + '"]');
    }
    var datasource = null;
    if ($datasource.count() > 0) {
        datasource = $datasource.getItem(0);
    }
    var modifier = newData.modifier;
    var modifiedTime = newData.modifiedTime;
    if (!newData.value) {
        return;
    }
    var newElement = CKEDITOR.dom.element.createFromHtml('<span>' + newData.value.replace(/↵/g, '<br/>').replace(/&para;/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>') + '</span>');
    var markEleList = newElement.find('[class*="hm-mark"]');
    if (!markEleList || markEleList.count() == 0) {
        return;
    }
    for (var i = 0; i < markEleList.count(); i++) {
        var tmpEle = markEleList.getItem(i);
        tmpEle.setAttribute('hm-modifier', modifier);
        tmpEle.setAttribute('hm-modify-time', modifiedTime);
    }
    markEle = markEleList.getItem(0);
    var modifiedType = markEle.getAttribute('hm-modify-type');
    var newText = newElement.getHtml().replace('', '\u200B');
    switch (nodeType) {
        case 'newtextbox':
        case 'dropbox':
        case 'cellbox':
        case 'timebox':
        case 'textboxwidget':
        case 'labelbox':
        case 'searchbox':
            datasource.setHtml(newText);
            break;
        case 'expressionbox':
            var _$datasource = editor.document.find('[data-hm-node="expressionbox"][_expressionoption_name="' + newData['name'] + '"]');
            if (_$datasource && _$datasource.count() > 0) {
                var _datasource = _$datasource.getItem(0);
                _datasource.setAttribute('_expressionvalue', markEle.getText());
                _datasource.setAttribute('hm-modifier', modifier);
                _datasource.setAttribute('hm-modify-time', modifiedTime);
                _datasource.setAttribute('class', markEle.getAttribute('class'));
                _datasource.setAttribute('hm-modify-type', modifiedType);
            }
            break;
        case 'radiobox':
            var checkedVal = markEle.getText().replace(/\s+/g, '');
            if (!checkedVal) {
                return;
            }
            var _$datasource = datasource.find('[data-hm-itemname="' + checkedVal + '"][data-hm-node="labelbox"]');
            if (_$datasource && _$datasource.count() > 0) {
                var _datasource = _$datasource.getItem(0);
                var markHtmlEle = CKEDITOR.dom.element.createFromHtml('<mark class="hm-mark hm-modify-mark" hm-modify-time="' + modifiedTime + '" hm-modify-type="修改" hm-modifier="' + modifier + '">' + checkedVal + '</mark>');
                markHtmlEle.insertAfter(_datasource);
                _datasource.remove();
            }
            var _$datasourceBox = datasource.find('[data-hm-itemname="' + checkedVal + '"][data-hm-node="radiobox"]');
            if (_$datasourceBox && _$datasourceBox.count() > 0) {
                var _datasourceBox = _$datasourceBox.getItem(0);
                _datasourceBox.addClass('hm-modify-mark');
            }
            break;
        case 'checkbox':
            var checkedVal = markEle.getText().replace(/\s+/g, '');
            if (!checkedVal) {
                return;
            }
            checkedVal = checkedVal.slice(1, checkedVal.length - 1);
            var checkValList = checkedVal.split(',');
            for (var i = 0; i < checkValList.length; i++) {
                var _$datasource = datasource.find('[data-hm-itemname="' + checkValList[i] + '"][data-hm-node="labelbox"]');
                if (_$datasource && _$datasource.count() > 0) {
                    var _datasource = _$datasource.getItem(0);
                    var markHtmlEle = CKEDITOR.dom.element.createFromHtml('<mark class="hm-mark hm-modify-mark" hm-modify-time="' + modifiedTime + '" hm-modify-type="修改" hm-modifier="' + modifier + '">' + checkValList[i] + '</mark>');
                    markHtmlEle.insertAfter(_datasource);
                    _datasource.remove();
                }
                var _$datasourceBox = datasource.find('[data-hm-itemname="' + checkValList[i] + '"][data-hm-node="checkbox"]');
                if (_$datasourceBox && _$datasourceBox.count() > 0) {
                    var _datasourceBox = _$datasourceBox.getItem(0);
                    _datasourceBox.addClass('hm-modify-mark');
                }
            }
            break;
    }
}


/**
 * 更新编辑器的高度
 *
 * @param {editor} editor
 * @param {jsonObject} evtTrace 用于(广播等)事件溯源
 * @example
 *  setContent(editor, {name:'护理表单渲染'});
 */
function updateEditSpaceContainerStyle(editor, evtTrace) {
    if (editor.readOnly || $('.editor_footer .footer_btn .edit_btn').length == 0) {
        $(".cke_editor_editorSpace").removeClass("emr-reset-height");
        $(".editor_footer").css('display', 'none');
        // 只读病历分页
        if (CKEDITOR.plugins.pagebreakCmd) {
            CKEDITOR.plugins.pagebreakCmd.currentOperations.setContent = false;
            CKEDITOR.plugins.pagebreakCmd.performAutoPaging(editor, { name: '只读病历分页', data: evtTrace });
        }
    } else {
        $(".cke_editor_editorSpace").addClass("emr-reset-height");
        $(".editor_footer").css('display', 'flex');
    }
    // 使用新样式时，只读样式设置
    var $body = $(editor.document.getBody().$);
    if ($body.attr('newStyle')) {
        if (editor.readOnly) {
            $body.addClass('readOnlyClass');
        } else {
            $body.removeClass('readOnlyClass');
        }
    }
}



// 获取包含指定样式的元素
function selectStyle(parentNode, styleName, style) {
    var result = [];
    if (parentNode.style[styleName] === style) {
        result.push(parentNode);
    }
    if (parentNode.children.length > 0) {
        for (var i = 0; i < parentNode.children.length; i++) {
            result = result.concat(selectStyle(parentNode.children[i], styleName, style));
        }
    }
    return result;
}

// 将内联样式为粗体的串改为 <strong>
function convertBoldToStrong(parentNode) {
    var boldNodes = selectStyle(parentNode, 'fontWeight', 'bold');
    for (var i = 0, boldNode; i < boldNodes.length; i++) {
        boldNode = boldNodes[i];
        var strong = document.createElement('strong');
        while (boldNode.childNodes.length > 0) {
            strong.append(boldNode.firstChild);
        }
        boldNode.appendChild(strong);
        boldNode.style.removeProperty('font-weight');
    }
}


function setReadOnlyBgColor($node, flag) {
    if (flag) {
        if ($node.find('.hm-page-content').length) {
            $node.find('.hm-page-content').children().addClass('hm-readonly-bgcolor');
        } else {
            $node.children().addClass('hm-readonly-bgcolor');
        }
    } else {
        if ($node.find('.hm-page-content').length) {
            $node.find('.hm-page-content').children().removeClass('hm-readonly-bgcolor');
        } else {
            $node.children().removeClass('hm-readonly-bgcolor');
        }
    }
}

/**
 * 病程中单病历只读模式
 * @param {*} $widgetNode
 */
function setAggSingleEmrReadOnly($widgetNodes, flag) {
    var editStr = flag ? 'false' : 'true';
    setReadOnlyBgColor($widgetNodes, flag);
    switchCssConciseModel($widgetNodes, flag);
    $widgetNodes.attr("contenteditable", editStr);
    //timebox/dropbox/checkbox/radiobox/ textbox
    setEmrDocumentEditState($widgetNodes, flag ? 'none' : 'auto');
    setEmrNewTextBoxEditable($widgetNodes, editStr);

}

function getExpressionoption(valObj) {
    if (valObj['_expressionoption']) {
        return valObj['_expressionoption'];
    }
    if (!valObj['值'] || valObj['值'].indexOf('-') > -1) {
        return '月经';
    }
    if ((/^[a-zA-Z\d]+$/).test(valObj['值'])) {
        return '胎心';
    }
    return '牙位';
}

function getContentStrByType(bindVal) {
    if (bindVal.length) {
        return bindVal.join("");
    }
    var valStr = '';
    switch (bindVal['类型']) {
        case 'expressionbox':
            var _expressionoption = getExpressionoption(bindVal);
            var datasourceEle = $('<span contenteditable="false" data-hm-node="' + bindVal['类型'] + '" _expressionvalue="' + bindVal['值'] + '" >\u200B</span>');
            datasourceEle.attr("style", bindVal['_style'] || "");
            datasourceEle.attr("_expressionoption", _expressionoption);
            valStr = datasourceEle.prop('outerHTML');
            break;
        case 'img':
            var datasourceEle = $('<img id="' + bindVal['id'] + '"/>');
            datasourceEle.attr("src", bindVal['src'] || bindVal['值']);
            datasourceEle.attr("style", bindVal['style'] || "");
            valStr = datasourceEle.prop('outerHTML');
            break;
        case 'searchbox':
            var datasourceEle = $('<span contenteditable="false" data-hm-node="' + bindVal['类型'] + '"  _code="' + bindVal['编码'] + '" _name="' + bindVal['编码名称'] + '">&#8203;</span>');
            if (bindVal['id']) {
                datasourceEle.attr("data-hm-id", bindVal['id']);
            }
            if (bindVal['名称']) {
                datasourceEle.attr("data-hm-name", bindVal['名称']);
            }
            if (bindVal['_searchoption']) {
                datasourceEle.attr("_searchoption", bindVal['_searchoption']);
            }
            var val = bindVal['值'];
            if (typeof (val) == 'object') {
                val = getContentStrByType(val);
            }
            datasourceEle.html(val + '&#8203;');
            valStr = datasourceEle.prop('outerHTML');
            break;
        case 'dropbox':
            var datasourceEle = $('<span contenteditable="false" data-hm-node="' + bindVal['类型'] + '">&#8203;</span>');
            if (bindVal['id']) {
                datasourceEle.attr("data-hm-id", bindVal['id']);
            }
            if (bindVal['名称']) {
                datasourceEle.attr("data-hm-name", bindVal['名称']);
            }
            datasourceEle.attr("data-hm-items", bindVal['值域']);
            if (bindVal['编码']) {
                datasourceEle.html(bindVal['编码']);
            } else {
                datasourceEle.html(bindVal['值']);
            }
            valStr = datasourceEle.prop('outerHTML');
            break;
    }
    return valStr;
}


// 单数据元设置值 item数据元 $$body body体
function setDataSourceVal($$body, item, val) {
    var nodeType = item.getAttribute("data-hm-node");
    switch (nodeType) {
        case 'newtextbox':
            var newtextboxcontent = $(item).find("span.new-textbox-content");
            if (newtextboxcontent.length > 0) {
                newtextboxcontent.removeAttr('_placeholdertext');
                newtextboxcontent.html(val);
            }
            break;
    }
}


//yyyy-MM-dd hh:mm
function dateStringToDate(dateString, hhmm) {

    if (dateString.trim() === "" || !dateString) {
        return null;
    }
    if (dateString.indexOf('年') > -1) {
        dateString = dateString.replace('年', '-').replace('月', '-').replace('日', ' ').replace('时', ':').replace('分', '');
    }

    try {
        var dates = dateString.split(" ")[0];
        var year = dates.split("-")[0];
        var month = Number(dates.split("-")[1]) - 1;
        var day = dates.split("-")[2];

        var times = dateString.split(" ")[1] || hhmm;
        var hour = times.split(":")[0];
        var min = times.split(":")[1];
        return new Date(year, month, day, hour, min, 0);
    } catch (e) {

        console.log(e);
        return null;
    }

}

//去除页眉
function removeHeader($h) {

    $h.find("table[_paperheader]").each(function () {
        $(this).css('display', 'none');
    });
    return $h;
}

//去除页脚
function removeFooter($h) {

    $h.find("table[_paperfooter]").each(function () {
        $(this).css('display', 'none');
    });
    return $h;
}

//从html文件中获取body的属性
function getAttributeFromBodyStr(str, attribute) {
    if (!str || !attribute) {
        return null;
    }
    var bodyDiv = str.replace('<body', '<div').replace('</body>', '</div>');
    var attribute = $(bodyDiv)[0].attributes[attribute];

    return attribute && attribute.value != "null" ? attribute.value : null;
}


// CKEDITOR.plugins.documentCmd = {
//     //成功执行同步的次数
//     syncCompletedCount: 0
// }
CKEDITOR.plugins.add('document', {
    icons: 'document',
    init: function (editor) {

        var currentUserInfo={}; // 暂时处理报错
        var command = editor.addCommand('documentinfo', new CKEDITOR.dialogCommand('document', { readOnly: 0 }));
        command.modes = { wysiwyg: 1, source: 1 };
        command.canUndo = false;
        command.readOnly = 0;

        editor.ui.addButton && editor.ui.addButton('Document', {
            label: '文档信息',
            command: 'documentinfo',
            toolbar: 'hm'
        });

        function toggleParagraph(toggler) {
            var _element = editor.contextTargetElement;
            var td = editor.elementPath().contains('td');
            if (td && td.hasAttribute('data-hm-node')) {
                _element = td;
            }
            ;
            var section = editor.getSelection();
            var selectedEle = section.getSelectedElement();
            var range = section.getRanges()[0];
            var selectedEndEle = range.endContainer;
            var selectedHtml = editor.getSelectedHtml(1);

            switch (toggler) {
                case 'paragraphHide':
                    if (selectedHtml && !selectedEle && range.startOffset != range.endOffset) {
                        if (selectedHtml.indexOf('hide_container') > -1) {
                            break;
                        }
                        editor.insertHtml('<span class="hide_container _paragraphHide hide_class">' + selectedHtml + '</span>');
                    } else if (_element.type == CKEDITOR.NODE_ELEMENT) {
                        if (selectedEndEle.type == CKEDITOR.NODE_ELEMENT && selectedEndEle.getName() == 'tr') {
                            _element = selectedEndEle;
                        }
                        var labelName = _element.getName();
                        if (labelName == 'body' || labelName == 'br') {
                            break;
                        }
                        var nodeType = _element.getAttribute('data-hm-node');
                        var hrhtml = '<span class="hr-del-cls"></span>';
                        var tableLabel = ['table', 'tbody', 'tr'];
                        if (tableLabel.indexOf(labelName) > -1) {
                            _element.addClass('_paragraphHide');
                            var tds = _element.find('td');
                            for (var i = 0; i < tds.count(); i++) {
                                var _td = tds.getItem(i);
                                _td.setStyle("position", "relative");
                                _td.appendHtml(hrhtml);
                            }
                        } else if (labelName == 'p' || (labelName = 'td' && !nodeType) || nodeType == "labelbox") {
                            _element.addClass('_paragraphHide');
                            _element.addClass('hide_class');
                        } else {
                            _element.addClass('_paragraphHide');
                            _element.setStyle("position", "relative");
                            _element.appendHtml(hrhtml);
                        }

                    } else if (_element.type == CKEDITOR.NODE_TEXT && _element.getParent()) {
                        var parentEle = _element.getParent();
                        parentEle.addClass('_paragraphHide');
                        parentEle.addClass('hide_class');
                    }
                    break;
                case 'paragraphShow':
                    if (selectedHtml && !selectedEle) {
                        if (selectedEndEle && selectedEndEle.getParent()) {
                            var parents = selectedEndEle.getParents();
                            var $parentEle = null;
                            for (var i = parents.length - 1; i > -1; i--) {
                                if (parents[i].type == CKEDITOR.NODE_ELEMENT && parents[i].hasClass('hide_container')) {
                                    $parentEle = $(parents[i].$);
                                    break;
                                }
                                if (parents[i].type == CKEDITOR.NODE_ELEMENT && parents[i].hasClass('_paragraphHide')) {
                                    parents[i].removeClass('_paragraphHide');
                                    parents[i].removeClass('hide_class');
                                    return;
                                }
                            }
                            var contents = $parentEle.contents();
                            for (var i = contents.length; i > -1; i--) {
                                var $child = $(contents[i]).clone();
                                $child.insertAfter($parentEle);
                            }
                            $parentEle.remove();
                        }
                    } else if (_element.type == CKEDITOR.NODE_ELEMENT) {
                        if (selectedEndEle.type == CKEDITOR.NODE_ELEMENT && selectedEndEle.getName() == 'tr') {
                            _element = selectedEndEle;
                        }
                        var nodeType = _element.getAttribute('data-hm-node');
                        var labelName = _element.getName();
                        var tableLabel = ['table', 'tbody', 'tr', 'td'];
                        if (tableLabel.indexOf(labelName) > -1) {
                            _element.removeClass('_paragraphHide');
                            _element.removeClass('hide_class');
                            var hrEles = _element.find('.hr-del-cls');
                            for (var i = 0; i < hrEles.count(); i++) {
                                var _hrEle = hrEles.getItem(i);
                                _hrEle.remove();
                            }
                        } else if (labelName == 'p' || nodeType == "labelbox") {
                            _element.removeClass('_paragraphHide');
                            _element.removeClass('hide_class');
                        } else if (labelName == 'span' && _element.hasClass('hr-del-cls')) {
                            var hideParent = _element.$.closest('._paragraphHide');
                            if (hideParent) {
                                hideParent.classList.remove('_paragraphHide');
                                hideParent.classList.remove('hide_class');
                            }
                            _element.remove();
                        } else if (labelName != 'br') {
                            _element.removeClass('_paragraphHide');
                            _element.removeClass('hide_class');
                            var hrEle = _element.find(".hr-del-cls");
                            hrEle.count() > 0 && hrEle.getItem(0).remove();
                        }
                    } else if (_element.type == CKEDITOR.NODE_TEXT && _element.getParent()) {
                        var parentEle = _element.getParent();
                        parentEle.removeClass('_paragraphHide');
                        parentEle.removeClass('hide_class');
                        var hrEle = parentEle.find(".hr-del-cls");
                        hrEle.count() > 0 && hrEle.getItem(0).remove();
                    }
                    break;
            }
        }

        editor.addCommand('paragraphShow', {
            exec: function (editor) {
                toggleParagraph('paragraphShow');
            }
        });

        editor.addCommand('paragraphHide', {
            exec: function (editor) {
                toggleParagraph('paragraphHide');
            }
        });


        if (editor.contextMenu) {
            editor.addMenuGroup('hm');

            editor.addMenuItem('paragraph', {
                label: '内容设置',
                group: 'hm',
                getItems: function () {
                    return {
                        '显示内容': CKEDITOR.TRISTATE_OFF,
                        '隐藏内容': CKEDITOR.TRISTATE_OFF,
                    };
                },
                order: 3
            });

            editor.addMenuItem('显示内容', {
                label: '显示内容',
                command: 'paragraphShow',
                group: 'hm',
                order: 1
            });

            editor.addMenuItem('隐藏内容', {
                label: '隐藏内容',
                command: 'paragraphHide',
                group: 'hm',
                order: 1
            });
        }

        /* ====  续打标识设置功能实现 start  ====== */

        function settingUpLabel(toggler) {
            var body = editor.document.getBody();
            // 分页时用新的续打遮罩
            if (body.find('.' + CKEDITOR.plugins.pagebreakCmd.LOGIC_PAGE_CLASS).count()) {
                settingUpLabelNew(toggler);
                return;
            }

            // 取消标志
            if (toggler === 'cancelSettingUp') {
                $(body.$).find(".continuation-identifier").remove();
                return;
            }

            // 设置标志
            var settingUpLabel = editor.elementPath().contains('table', true, true);
            if (!settingUpLabel) {
                settingUpLabel = editor.elementPath().contains('p');
            }
            if (!settingUpLabel) {
                return;
            }
            settingUpLabel = settingUpLabel.$;

            var startLabel = $(body.$).find("[data-hm-node='continuation-identifier-start']");
            var endLabel = $(body.$).find("[data-hm-node='continuation-identifier-end']");
            var hrLabel;
            var findClosestCompleteTableRow = editor.plugins.tabletools.tableArchitectureTools.findClosestCompleteTableRow;

            if (toggler === 'settingUpStart') {
                startLabel && startLabel.length > 0 && startLabel.remove();
                var startPlaceholder = '-------------------------------------------------------续----打----开----始----------------------------------------------------------------';
                hrLabel = '<div data-hm-node="continuation-identifier-start" class="continuation-identifier" title="续打开始"><input readonly placeholder="' + startPlaceholder + '"/><input></div>';

                $(settingUpLabel).before(hrLabel);

                startLabel = $(body.$).find("[data-hm-node='continuation-identifier-start']");
                if (endLabel && endLabel.length > 0 && endLabel.offset().top <= startLabel.offset().top) {
                    endLabel.remove();
                }
            } else if (toggler === 'settingUpEnd') {
                endLabel && endLabel.length > 0 && endLabel.remove();
                var endPlaceholder = '----------------------------------------------------------续----打----结----束----------------------------------------------------------------';
                hrLabel = '<div data-hm-node="continuation-identifier-end" class="continuation-identifier" title="续打结束"><input readonly placeholder="' + endPlaceholder + '"/><input></div>';

                $(settingUpLabel).after(hrLabel);

                endLabel = $(body.$).find("[data-hm-node='continuation-identifier-end']");
                if (startLabel && startLabel.length > 0 && startLabel.offset().top >= endLabel.offset().top) {
                    startLabel.remove();
                }
            }
        }

        /**
         * 分页下的续打
         */
        function settingUpLabelNew(toggler) {
            // 取消标志
            if (toggler === 'cancelSettingUp') {
                editor.document.find('.breakLineEleNew').remove();
                return;
            }

            // 设置标志
            var element = editor.elementPath();
            // 创建遮罩
            var mask = new CKEDITOR.dom.element('div');
            mask.setStyle('height', $(element.lastElement.$).offset().top + 'px');
            mask.addClass('breakLineEleNew');
            editor.document.find('.breakLineEleNew').remove();
            editor.document.getBody().getParent().append(mask);
        }

        editor.addCommand('settingUpNew', {
            exec: function (editor) {
                settingUpLabel('settingUpNew');
            }
        });
        editor.addCommand('settingUpStart', {
            exec: function (editor) {
                settingUpLabel('settingUpStart');
            }
        });

        editor.addCommand('settingUpEnd', {
            exec: function (editor) {
                settingUpLabel('settingUpEnd');
            }
        });
        editor.addCommand('cancelSettingUp', {
            exec: function (editor) {
                settingUpLabel('cancelSettingUp');
            }
        });

        if (editor.contextMenu) {
            editor.addMenuGroup('hm');

            editor.addMenuItem('settingUp', { // 续打设标记置
                label: '续打设置',
                group: 'hm',
                getItems: function () {
                    if (editor.document.getBody().find('.' + CKEDITOR.plugins.pagebreakCmd.LOGIC_PAGE_CLASS).count()) {
                        return {
                            '续打标识(新)': CKEDITOR.TRISTATE_OFF,
                            '取消标识': CKEDITOR.TRISTATE_OFF,
                        };
                    } else {
                        return {
                            '起始标识': CKEDITOR.TRISTATE_OFF,
                            '结束标识': CKEDITOR.TRISTATE_OFF,
                            '取消标识': CKEDITOR.TRISTATE_OFF,
                        };
                    }
                },
                order: 3
            });

            editor.addMenuItem('续打标识(新)', {
                label: '续打标识(新)',
                command: 'settingUpNew',
                group: 'hm',
                order: 1
            });
            editor.addMenuItem('起始标识', {
                label: '起始标识',
                command: 'settingUpStart',
                group: 'hm',
                order: 1
            });

            editor.addMenuItem('结束标识', {
                label: '结束标识',
                command: 'settingUpEnd',
                group: 'hm',
                order: 1
            });

            editor.addMenuItem('取消标识', {
                label: '取消标识',
                command: 'cancelSettingUp',
                group: 'hm',
                order: 1
            });

        }

        /* ====  续打标识设置功能实现 end  ====== */

        editor.contextMenu.addListener(function (element, selection, path) {
            //右键时如果存在未关闭的日期框，将其隐藏掉
            var $div = $('#interactDiv');
            if ($div) {
                $div.hide();
            }

            var contextItems = {};
            var onlyreadFlag = checkCurDomReadOnly(editor);


            if (onlyreadFlag) {
                    contextItems['settingUp'] = CKEDITOR.TRISTATE_OFF;
                    editor.commands['settingUpNew'].enable();
                    editor.commands['settingUpStart'].enable();
                    editor.commands['settingUpEnd'].enable();
                    editor.commands['cancelSettingUp'].enable();
                return contextItems;
            }


            contextItems['settingUp'] = CKEDITOR.TRISTATE_OFF;

            contextItems['paragraph'] = CKEDITOR.TRISTATE_OFF;
            return contextItems;
        });

        CKEDITOR.dialog.add('document', this.path + 'dialogs/document.js');

        editor.widgets.add('emrWidget', {
            template:
            '<div class="emrWidget">' +
            '<div class="emrWidget-content"><p><br></p></div>' +
            '</div>',

            editables: {
                content: {
                    selector: '.emrWidget-content',
                }
            },

            upcast: function (element) {
                return element.name == 'div' && element.hasClass('emrWidget');
            },
            draggable: false

        });

        editor.widgets.add('textboxWidget', {
            template:
            '<span  class="textboxWidget">' +
            '<span data-hm-node="textboxwidget" class="textboxWidget-content">\u200B</span>' +
            '</span>',

            editables: {
                content: {
                    selector: '.textboxWidget-content',
                }
            },

            upcast: function (element) {
                return element.name == 'span' && element.hasClass('textboxWidget');
            },
            draggable: false

        });

        editor.initToolsDisabled = function () {
            // editor.commands["trace"].disable();

            if (editor.HMConfig.designMode) {
                editor.commands["documentinfo"].frozen = false;
                editor.commands["documentinfo"].enable();
                editor.commands["datasource"].frozen = false;
                editor.commands["datasource"].enable();
                // 模板维护编辑模板禁用修订功能
                if (editor.commands["revise"]) {
                    editor.commands["revise"].frozen = true;
                    editor.commands["revise"].disable();
                }
                editor.commands["pagebreak"].frozen = false;
                editor.commands["pagebreak"].enable();
            }else{
                editor.commands["datasource"].frozen = true;
                editor.commands["datasource"].disable();
                // editor.commands["table"].frozen = true;
                // editor.commands["table"].disable();
                
                editor.commands["documentinfo"].frozen = true;
                editor.commands["documentinfo"].disable();
                
                if (editor.HMConfig.reviseMode) {
                    editor.commands["revise"].frozen = false;
                    editor.commands["revise"].enable();
                    editor.execCommand('revise', {reviseState: '显示修订'});
                }else{
                    editor.commands["revise"].frozen = true;
                    editor.commands["revise"].disable();
                }
                editor.commands["horizontalrule"].frozen = true;
                editor.commands["horizontalrule"].disable();
                editor.commands["pagebreak"].frozen = true;
                editor.commands["pagebreak"].disable();
            }
        }

        editor.setDocumentReadOnly = function (flag) {
            if (flag == null || flag == undefined) {
                flag = true;
            }
            editor.setReadOnly(flag);
            var $body = $(editor.document.getBody().$);
            setReadOnlyBgColor($body, flag);
            var widgetNodes = $body.find('div[data-hm-createuserid]');
            if (widgetNodes.length > 0) { //病程记录的新文本在病程设置编辑权限的地方单独处理
                return;
            }
            var flagStr = (!flag).toString();
            setEmrDocumentEditState($body, (flag ? 'none' : 'auto'));
            setEmrNewTextBoxEditable($body, flagStr);
        }


        editor.on('instanceReady', function () {
            editor.initToolsDisabled();
        });

        editor.checkedIsCreator = function (selection) { //判断当前登录用户是否是病历的创建者
            return true;
        }

        editor.getUserSelectContent = function (selection) {
            // return '';
            var selectedDocumentFragmentClone = $(editor.getSelectedHtml().$).clone(true);
            // if (selectedDocumentFragmentClone.children().length > 0) {
            //     var selfModify = selectedDocumentFragmentClone.find('ins[_userid="' + currentUserInfo.userId + '"]');
            //     if (selfModify.length > 0) {
            //         selectedDocumentFragmentClone.find('ins[_userid="' + currentUserInfo.userId + '"]').text('');
            //     }
            //     var range0 = selection.getRanges()[0];
            //     var boundaryNodes = range0.getBoundaryNodes();
            //     if (boundaryNodes.startNode !== boundaryNodes.endNode) {
            //         if (boundaryNodes.startNode.getParent().getAttribute("_userid") == currentUserInfo.userId) {
            //             selectedDocumentFragmentClone[0].firstChild.data = "";
            //         }
            //         if (boundaryNodes.endNode.getParent().getAttribute("_userid") == currentUserInfo.userId) {
            //             selectedDocumentFragmentClone[0].lastChild.data = "";
            //         }
            //     }
            // }
            return selectedDocumentFragmentClone.text().replace(/\u200B/g, "") || "";
        };

        editor.insertCusContent = function (text) {
            // parent.copyInfo['复制内容']  = text;
            if (editor.commands["revise"] && editor.reviseModelOpened) {
                var selection = editor.getSelection();
                // if (editor.checkedIsCreator(selection)) {
                //     editor.setAddMark(selection, text, 'hm_self_ins');
                // } else {
                    editor.setAddMark(selection, text, 'hm_revise_ins');
                // }
            } else {
                editor.fire('paste', {
                    dataValue: text,
                    pasteType: 'pasteWithFormat',
                    dontFilter: true
                });
            }
        };

        editor.setAddMark = function (selection, text, className) { //新增文本适用于自定义插入文本例如：检验检查、特殊字符、诊断
            var ranges = selection.getRanges();
            var range0 = ranges[0];
            var insNode = range0.endPath().contains("ins");
            var selectedDom = editor.getSelectedHtml();
            var disabledNode = $(selectedDom.$).find('[contenteditable="false"]');
            if (disabledNode.length > 0) {
                return;
            }
            if ('hm_self_ins' == className && !insNode) {
                editor.fire('paste', {
                    dataValue: text,
                    pasteType: 'pasteWithFormat',
                    dontFilter: true
                });
                return;
            }
            var selectedContent = editor.getUserSelectContent(selection);
            if (text && text.trim()) {
                var dateStr = wrapperUtils.formatDateToStr('yyyy-MM-dd hh:mm:ss', new Date());
                var insMark = new CKEDITOR.dom.element('ins');
                insMark.setAttributes({
                    "contenteditable": "true",
                    "class": className ? className : "hm_revise_ins",
                    // "title": className == 'hm_self_ins' ? '' : (currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr),
                    // "_userid": currentUserInfo.userId,
                    "trace_id": 'trace_' + wrapperUtils.getGUID(),
                    // "modifier": currentUserInfo.userName,
                    "modifyTime": dateStr,
                    "modifyType": "新增"
                });
                insMark.setHtml(text);
                if (selectedContent) {
                    var delMark = new CKEDITOR.dom.element('del');
                    delMark.setAttributes({
                        "contenteditable": "false",
                        // "title": currentUserInfo.userName + "  " + dateStr,
                        "class": "hm_revise_del",
                        // "_userid": currentUserInfo.userId,
                        "trace_id": 'trace_' + wrapperUtils.getGUID(),
                        // "modifier": currentUserInfo.userName,
                        "modifyTime": dateStr,
                        "modifyType": "删除"
                    });
                    delMark.setText(selectedContent);
                    editor.fire('paste', {
                        dataValue: delMark.getOuterHtml() + insMark.getOuterHtml(),
                        pasteType: 'pasteWithFormat',
                        dontFilter: true
                    });
                } else {
                    editor.fire('paste', {
                        dataValue: insMark.getOuterHtml(),
                        pasteType: 'pasteWithFormat',
                        dontFilter: true
                    });
                }

            }
        };

        //书写界面判断表格是否有设置不可编辑，若设置不可编辑，则不允许删除
        function tableEditfalse() {
            if (!editor.HMConfig.designMode) {
                var tableNode = ['td', 'tr', 'th', 'thead', 'tbody'];
                var elements = editor.elementPath().elements;
                if (elements && elements.length > 0) {
                    var parentNode = elements.find(function (item) {
                        return tableNode.indexOf(item.getName()) > -1 && item.getAttribute('contenteditable') === 'false' && $(item.$).attr('_emrstyle').indexOf('_if(disable)') > -1
                    });
                    if (parentNode) {
                        return false
                    }
                }
            }
        }

        //书写界面判断病历是否是表单模式，是表单模式且非数据元内元素，则不可选中删除
        function switchModelDelete() {
            if (!editor.HMConfig.designMode) {
                var parentNode = editorIns.document.find('div.switchModel');
                if (parentNode.$.length) {
                    var elements = editor.elementPath().elements;
                    for (var i = 0; i < elements.length; i++) {
                        var item = elements[i];
                        if (item.getAttribute('data-hm-node')) {
                            return true;
                        } else if (item.hasClass('switchModel')) {
                            return false;
                        }
                    }
                }
            }
        }

        //自定义表格svg内text元素删除时加入零宽字符，避免彻底删除后无法聚焦
        function deleteText() {
            var selection = editor.getSelection();
            var ranges = selection.getRanges();
            var range0 = ranges[0];
            if (!range0) return;
            var lastElement = range0.endPath().lastElement;
            if (lastElement.$.tagName === 'text' && lastElement.getParent().getAttribute('customline') == 'true') {
                if (lastElement.$.textContent.length == 1) {
                    lastElement.$.textContent = '\u200b';
                    return false;
                }
            }
        }

        //获取表格实际布局下的单元格列值
        function getTableIndex(tbody, node) {
            var trIndex = node.getParent().getIndex();
            var tfMap = CKEDITOR.tools.buildTableMap(tbody)[trIndex];
            for (var i = 0; i < tfMap.length; i++) {
                if (node.$ === tfMap[i]) {
                    return i;
                }
            }
        }

        function keydown1(evt) {
            var selection = editor.getSelection();
            if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                evt.stop();
                evt.data.preventDefault();
                return false;
            }
            var ranges = selection.getRanges();
            var range0 = ranges[0];

            var arrowKey = false;
            switch (evt.data.$.code) {
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ControlLeft':
                    arrowKey = true;
                    break;
                case 'KeyC':
                    if (evt.data.$.ctrlKey = true)
                        arrowKey = true;
                    break;
                case 'Delete':
                    editor.deleteSelectionPart(range0, 'del', evt); // 模板制作系统删除
                    if(tableEditfalse()===false||switchModelDelete()===false||deleteText()===false){
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    break;
                case 'Backspace':
                    editor.deleteSelectionPart(range0, 'back', evt); // 模板制作系统删除
                    if(tableEditfalse()===false||switchModelDelete()===false||deleteText()===false){
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    break;
            }

            var fixNode = editor.getFixNodeWalker(range0).lastForward();
            // var preNode = range0.getPreviousEditableNode()
            //
            // if (!fixNode && ranges.length >= 1 && ranges[0].startContainer.is && ranges[0].startContainer.is('tr')) {
            //     for (var i = ranges.length - 1; i >= 0; i--) {
            //         var container = ranges[i].startContainer;
            //         var nodes = container.find('[data-hm-node]');
            //         if (nodes.count() >= 1) {
            //             fixNode = nodes.getItem(0);
            //             break;
            //         }
            //     }
            // }
            //
            //
            var contenteditable = evt.data.getTarget().$.getAttribute('contenteditable');
            if ($.ui.keyCode.SPACE === evt.data.getKey() && !fixNode && contenteditable != 'false') {

                var space = new CKEDITOR.dom.text('\u3000');
                if (evt.data.$.altKey) {
                    space = new CKEDITOR.dom.text('\u2002');
                }
                var editable = editor.editable();
                var element = editable.editor.getSelection().getRanges()[0].startContainer;
                if (element.type == CKEDITOR.NODE_TEXT) {
                    element = element.getParent();
                }
                //直接数据元内敲空格，去除placeholder
                if (element.getAttribute('_placeholdertext') === 'true') {
                    if (element.hasClass("new-textbox-content")) {
                        //新文本
                        editable.fire('togglePlaceHolder', evt);
                    }
                }
                range0.insertNode(space);
                range0.moveToPosition(space, CKEDITOR.POSITION_BEFORE_END);
                range0.select();
                evt.stop();
                evt.data.preventDefault();
                editor.fire('saveSnapShot', { name: 'spaceInserted' });
                // // 输入空格之后需要重新计算分页
                // CKEDITOR.plugins.pagebreakCmd.performAutoPaging(editor, {name: 'spaceInserted'}); // 输入空格
                return false;
            }


            //editable=false的后面无字符时，容易造成无法输入IME；故，在每次输入时加入零宽字符;

            // 键盘移动光标
            switch (evt.data.$.keyCode) {
                case 8:
                    // 退格且没有选择多个字符时, 能够回删到上一页
                    CKEDITOR.plugins.pagebreakCmd.selectionMoveLeft(selection, evt);
                    if (evt.data.$.ctrlKey || evt.data.$.shiftKey || evt.data.$.altKey) {
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    break;
                case 46:
                    // 删除且没有选择多个字符时, 能够回删到下一页
                    CKEDITOR.plugins.pagebreakCmd.selectionMoveRight(selection, evt);
                    if (evt.data.$.ctrlKey || evt.data.$.shiftKey || evt.data.$.altKey) {
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    break;
                case 38:
                case 40:
                    var element = evt.data.getTarget();
                    var td = editor.elementPath().contains('td');
                    if (td) {
                        var tbody = td.getAscendant('tbody');
                        var _index = getTableIndex(tbody, td);
                        var _tr = null;
                        var rowSpan = 1;
                        if (td.getAttribute('rowspan')) {
                            rowSpan = Number(td.getAttribute('rowspan'));
                        }
                        if (evt.data.$.keyCode === 38) {
                            _tr = td.getParent('tr');
                            for (var i = 0; i < rowSpan; i++) {
                                _tr = _tr.getPrevious();
                            }
                        } else {
                            _tr = td.getParent('tr');
                            for (var i = 0; i < rowSpan; i++) {
                                _tr = _tr.getNext();
                            }
                        }
                        if (_tr) {
                            var trIndex = _tr.getIndex();
                            var tfMap = CKEDITOR.tools.buildTableMap(tbody)[trIndex];
                            var td = tfMap[_index];
                            if (td) {
                                var datasourceNodes = $(td).find('span[data-hm-node]');
                                if (datasourceNodes.length) {
                                    //新文本，老文本，时间文本，文本控件，数字控件(点击上下按钮聚焦到数据元内);
                                    var type = datasourceNodes[0].getAttribute('data-hm-node');
                                    var _texttype = datasourceNodes[0].getAttribute('_texttype');
                                    var datasourceNode = datasourceNodes[0];
                                    var shouldRemove = true;
                                    var node;
                                    switch (type) {
                                        case 'newtextbox':
                                            node = $(datasourceNode).children('.new-textbox-content')[0];
                                            break;
                                        case 'textboxwidget':
                                            node = datasourceNode;
                                            break;
                                    }
                                    if (shouldRemove) {
                                        node = new CKEDITOR.dom.element(node);
                                        range0.moveToElementEditEnd(node);
                                    }
                                } else {
                                    var node = new CKEDITOR.dom.element(td);
                                    range0.moveToPosition(node, CKEDITOR.POSITION_BEFORE_END);
                                }
                                range0.select();
                                editor.focus();
                                evt.stop();
                                evt.data.preventDefault();
                                if (_texttype === '时间文本' && node) {
                                    //时间文本触发click事件，校验时间格式
                                    node.$.click();
                                }
                                return false;
                            }
                        }
                    }
                    break;
                case 37:
                    CKEDITOR.plugins.pagebreakCmd.selectionMoveLeft(selection, evt);
                    break;
                case 39:
                    CKEDITOR.plugins.pagebreakCmd.selectionMoveRight(selection, evt);
                    break;
            }


            // 防止键盘删除数据元和页眉页脚
            if (!arrowKey) {
                var preNode = range0.getPreviousEditableNode();
                var nextNode = range0.getNextEditableNode();
                var cursorNode;

                // 页眉页脚 (处理不当的话有可能导致页眉后面多一行...)
                if (evt.data.$.code === 'Delete' && range0.collapsed && nextNode && nextNode.type === CKEDITOR.NODE_ELEMENT &&
                    (nextNode.hasClass('hm-page-header-group') || nextNode.hasClass('hm-page-footer-group') ||
                        nextNode.hasAttribute('data-hm-node') || nextNode.hasAttribute('data-cke-widget-wrapper'))) {
                    cursorNode = new CKEDITOR.dom.text('\u200B');

                    cursorNode.insertBefore(nextNode);
                    range0.moveToPosition(cursorNode, CKEDITOR.POSITION_AFTER_START);
                    range0.select();
                } else if (evt.data.$.code === 'Backspace' && range0.collapsed && preNode && preNode.type === CKEDITOR.NODE_ELEMENT &&
                    (preNode.hasClass('hm-page-header-group') || preNode.hasClass('hm-page-footer-group') ||
                        preNode.hasAttribute('data-hm-node') || preNode.hasAttribute('data-cke-widget-wrapper'))) {
                    cursorNode = new CKEDITOR.dom.text('\u200B');

                    cursorNode.insertAfter(preNode);
                    range0.moveToPosition(cursorNode, CKEDITOR.POSITION_BEFORE_END);
                    range0.select();
                }

                // 数据元
                else if (preNode && preNode.type !== CKEDITOR.NODE_TEXT && (preNode.hasAttribute('data-hm-node') || preNode.hasAttribute('data-cke-widget-wrapper'))) {
                    cursorNode = new CKEDITOR.dom.text('\u200B');

                    cursorNode.insertAfter(preNode);
                    range0.moveToPosition(cursorNode, CKEDITOR.POSITION_BEFORE_END);
                }
            }
        }

        function keydown2(evt) {
            if (editor.readOnly) {
                return;
            }
            var selection = editor.getSelection();
            if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                evt.stop();
                evt.data.preventDefault();
                return false;
            }
            if (!editor.commands["revise"] || !editor.reviseModelOpened) {
                return;
            }
            var ranges = selection.getRanges();
            var range0 = ranges[0];
            var fixNode = editor.getFixNodeWalker(range0).lastForward();
            var preNode = range0.getPreviousEditableNode();
            var nextNode = range0.getNextEditableNode();
            if (fixNode || range0.startPath().contains('del') || range0.endPath().contains('del')) {
                evt.stop();
                evt.data.preventDefault();
                return false;
            }
            var _selectedText = (editor.getUserSelectContent(selection) || '').replace(/\u200B/g, "");
            switch (evt.data.$.code) {
                case 'Backspace':
                    if (!_selectedText && preNode && preNode.type == CKEDITOR.NODE_ELEMENT && preNode.getName() == 'del') {
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    editor.setDelMark(selection, _selectedText, evt.data.$.code);
                    break;
                case 'Delete':
                    if (!_selectedText && nextNode && nextNode.type == CKEDITOR.NODE_ELEMENT && nextNode.getName() == 'del') {
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    var flag = editor.setDelMark(selection, _selectedText, evt.data.$.code);
                    if (!flag) {
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                    break;
            }
        }

        editor.on('contentDom', function () {
            var selTextBeforeInsert = '';
            var editable = editor.editable();
            var selectedText = '';
            var beforeInputText = '';// 输入前选中文本
            var beforeCHInputText = '';
            var inputEvent = { // input事件执行顺序索引
                input: 0,
                compositionstart: 0,
                beforeinput: 0,
                compositionend: 0
            };
            var isCompositioning = false; // 兼容中文输入法是否正在输入
            var clearInputEventIndex = function () { // 每执行一次后重置事件索引
                inputEvent.input = 0;
                inputEvent.compositionstart = 0;
                inputEvent.beforeinput = 0;
                inputEvent.compositionend = 0;
            }
            editable.attachListener(editable, 'input', function afterInput1(evt) {
                if (editor.readOnly) {
                    return;
                }
                inputEvent.input++;
                if (isCompositioning) {
                    return;
                }
                var selection = editor.getSelection();
                if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                beforeInputText = '';
                if (evt.data.$.inputType && evt.data.$.inputType.indexOf('insert') > -1) {
                    selTextBeforeInsert = '';
                }
                if ((!editor.commands["revise"] || !editor.reviseModelOpened)) {
                    if (evt.data.$.inputType.indexOf('insert') > -1) { //创建者不留痕
                        selectedText = '';
                        editor.setInsMark(selection, evt.data.$.data, 'hm_self_ins');
                    }
                    return;
                }
                editor.setInsMark(selection, evt.data.$.data, 'hm_revise_ins');
            });
            editable.attachListener(editable, 'compositionstart', function (evt) {
                if (editor.readOnly) {
                    return;
                }
                var $emrWidget = $(evt.data.getTarget().$).closest("[data-hm-widgetid]");
                if (checkSubEmrLock(editor, $emrWidget)) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                inputEvent.compositionstart++;
                isCompositioning = true;

                var selection = editor.getSelection();
                if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                if (selection.getSelectedText().trim()) {
                    selectedText = editor.getUserSelectContent(selection);
                    selTextBeforeInsert = selectedText;
                } else {
                    selTextBeforeInsert = '';
                }
                beforeCHInputText = selTextBeforeInsert;
                if ((!editor.commands["revise"] || !editor.reviseModelOpened)) {
                    return;
                }

            });
            editable.attachListener(editable, 'compositionend', function (evt) {
                console.log('compositionend:', evt);
                if (editor.readOnly) {
                    return;
                }

                isCompositioning = false;
                inputEvent.compositionstart++;

                var selection = editor.getSelection();
                if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                console.log('isChrome', wrapperUtils.isChrome());
                beforeCHInputText = '';
                if (evt.data.$.inputType && evt.data.$.inputType.indexOf('insert') > -1) {
                    selTextBeforeInsert = '';
                }
                if (!isCompositioning && wrapperUtils.isChrome()) {
                    if ((!editor.commands["revise"] || !editor.reviseModelOpened)) {
                        if (evt.data.$.inputType && evt.data.$.inputType.indexOf('insert') > -1) { //创建者不留痕
                            selectedText = '';
                            editor.setInsMark(selection, evt.data.$.data, 'hm_self_ins');
                        }
                        // return;
                    } else {
                        editor.setInsMark(selection, evt.data.$.data, 'hm_revise_ins');
                    }
                }
                //由于中文输入法按enter键输入字母时不会触发分页，故需在中文输入完成时主动调用分页
                // var pageBreak = CKEDITOR.plugins.pagebreakCmd;
                // if (pageBreak) {
                //     pageBreak.performAutoPaging(editor, evt);
                // }
                //文本输入及联设置
                _handleRelevance($(evt.data.getTarget().$).parent());
            });
            editable.attachListener(editable, 'beforeinput', function 键盘输入前的业务逻辑(evt) {
                if (editor.readOnly) {
                    return; 
                }
                var $emrWidget = $(evt.data.getTarget().$).closest("[data-hm-widgetid]");
                if (checkSubEmrLock(editor, $emrWidget)) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                if (inputEvent.compositionstart > 0) { //走compositionstart，无需以下逻辑并且该方法在compositionend之前执行
                    return;
                }
                // 不走compositionstart时，处理选中文本
                inputEvent.beforeinput++;
                var selection = editor.getSelection();
                if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                if (selection.getSelectedText().trim()) {
                    beforeInputText = editor.getUserSelectContent(selection);
                }
                if ((!editor.commands["revise"] || !editor.reviseModelOpened)) {
                    return;
                }
                if (evt.data.$.inputType.indexOf('insert') > -1 && (!isCompositioning)) {
                    if (selection.getSelectedText().trim()) {
                        selectedText = beforeInputText;
                    }
                }
            });
            editable.on('beforecut', function (evt) {
                if (editor.readOnly) {
                    return;
                }
                var selection = editor.getSelection();
                if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }
                var ele = selection.getStartElement();
                if (ele) {
                    var $emrWidget = $(ele.$).closest("[data-hm-widgetid]");
                    if (checkSubEmrLock(editor, $emrWidget)) {
                        evt.stop();
                        evt.data.preventDefault();
                        return false;
                    }
                }
                var text = editor.getUserSelectContent(selection);
                if ((!editor.commands["revise"] || !editor.reviseModelOpened)) {
                    return;
                }
                if (text) {
                    editor.setDelMark(selection, text, null);
                }
            });
            editor.on('paste', function 编辑留痕1(evt) {
                if (editor.readOnly) {
                    return;
                }
                var selection = editor.getSelection();
                if (!selection || !selection.getRanges() || !selection.getRanges()[0]) {
                    evt.stop();
                    return false;
                }
                var ele = selection.getStartElement();
                if (ele) {
                    var $emrWidget = $(ele.$).closest("[data-hm-widgetid]");
                    if (checkSubEmrLock(editor, $emrWidget)) {
                        evt.stop();
                        return false;
                    }
                }
                var text = editor.getUserSelectContent(selection);
                if ((!editor.commands["revise"] || !editor.reviseModelOpened)) {
                    return;
                }
                if (text) {
                    editor.setDelMark(selection, text, null);
                }
            });

            editable.attachListener(editable, 'keydown', function checkKeyDownLogic(evt) {
                if (false === keydown1(evt)) {
                    return;
                }
                if (false === editor.plugins.datasource.onKeyDownFunc(evt, editor)) {
                    return;
                }
                keydown2(evt);
            }, null, null, -10);

            editor.setInsMark = function (selection, text, className) { //新增文本

                clearInputEventIndex();
                var ranges = selection.getRanges();
                var range0 = ranges[0];
                var insNode = range0.endPath().contains("ins");
                if (('hm_self_ins' == className && !insNode)) {
                    return;
                }
                if (text && text.trim()) {
                    var dateStr = wrapperUtils.formatDateToStr('yyyy-MM-dd hh:mm:ss', new Date());
                    var newText = new CKEDITOR.dom.text(text);
                    var insMark = new CKEDITOR.dom.element('ins');
                    insMark.setAttributes({
                        "contenteditable": "true",
                        "class": className ? className : "hm_revise_ins",
                        // "title": className == 'hm_self_ins' ? '' : (currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr),
                        // "_userid": currentUserInfo.userId,
                        "trace_id": 'trace_' + wrapperUtils.getGUID(),
                        // "modifier": currentUserInfo.userName,
                        "modifyTime": dateStr,
                        "modifyType": "新增"
                    });
                    var startContainer = range0.startContainer;
                    insMark.append(newText);
                    // range0.insertNode(insMark);
                    if (selectedText) {
                        var delMark = new CKEDITOR.dom.element('del');
                        delMark.setAttributes({
                            "contenteditable": "false",
                            // "title": currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr,
                            "class": "hm_revise_del",
                            // "_userid": currentUserInfo.userId,
                            "trace_id": 'trace_' + wrapperUtils.getGUID(),
                            // "modifier": currentUserInfo.userName,
                            "modifyTime": dateStr,
                            "modifyType": "删除"
                        });
                        delMark.setText(selectedText);
                        // range0.insertNode(delMark);
                        // parent.copyInfo['复制内容']  = delMark.getOuterHtml() + insMark.getOuterHtml();
                        editor.fire('paste', {
                            dataValue: delMark.getOuterHtml() + insMark.getOuterHtml(),
                            pasteType: 'pasteWithFormat',
                            dontFilter: true
                        });
                        selectedText = '';
                    } else {
                        // parent.copyInfo['复制内容']  = insMark.getOuterHtml();
                        editor.fire('paste', {
                            dataValue: insMark.getOuterHtml(),
                            pasteType: 'pasteWithFormat',
                            dontFilter: true
                        });
                    }
                    // range0.moveToPosition(newText, CKEDITOR.POSITION_BEFORE_END);
                    // range0.select();
                    startContainer.setText(startContainer.getText().replace(text, ''));
                }
            };

            editor.setDelMark = function (selection, text, curKeyCode) { //删除文本
                var ranges = selection.getRanges();
                var range0 = ranges[0];
                var disabledParent = range0.startPath().lastElement ? range0.startPath().lastElement.getAttribute("contenteditable") == 'false' : false;
                if (disabledParent) {
                    return;
                }
                var delNode = range0.startPath().contains("del");
                if (delNode) {
                    range0.moveToElementEditEnd(delNode);
                    range0.select();
                }
                var startInsNode = range0.startPath().contains("ins");
                var endInsNode = range0.endPath().contains("ins");
                if (startInsNode && endInsNode) { // 修改自己编辑不留痕
                    return;
                }

                var curStartNode = range0.startContainer;//获取或焦点的起始节点
                var curEndNode = range0.endContainer; //获取或焦点的结尾节点
                var startOffset = range0.startOffset;
                var focusText = "";
                var dateStr = wrapperUtils.formatDateToStr('yyyy-MM-dd hh:mm:ss', new Date());
                var delText = '';
                if (curKeyCode == 'Delete') {
                    if (text) {
                        delText = text;
                    } else {
                        if (curStartNode.type == CKEDITOR.NODE_ELEMENT && curStartNode.getChild(range0.startOffset) && curStartNode.getChild(range0.startOffset).type == CKEDITOR.NODE_ELEMENT) {
                            return;
                        }
                        focusText = (curStartNode.$.wholeText || curStartNode.$.textContent || "");
                        if (curStartNode.type == CKEDITOR.NODE_ELEMENT) {
                            curStartNode = curStartNode.getChild(range0.startOffset);
                            var nodeText = (curStartNode.$.textContent || curStartNode.$.wholeText || "");
                            var tmpText = nodeText.replace(/\u200B/g, "");
                            if (!tmpText) {
                                return;
                            }
                            var firstChar = tmpText.charAt(0);
                            var spaceChar = nodeText.substring(0, nodeText.indexOf(firstChar));
                            if (spaceChar.length < 9) {
                                focusText = tmpText;
                            } else {
                                focusText = nodeText;
                            }
                            startOffset = 0;
                        }
                        delText = focusText.substr(startOffset, 1);
                    }
                    if (!delText.replace(/\u200B/g, "")) {
                        var selfParent = curEndNode.getParent();
                        var idx = curEndNode.getIndex();
                        var nextBrNode = selfParent.getChild(idx + 1);
                        var nextDelNode = selfParent.getChild(idx + 2);
                        if (nextBrNode && nextDelNode && nextBrNode.type == CKEDITOR.NODE_ELEMENT && nextDelNode.type == CKEDITOR.NODE_ELEMENT && nextBrNode.getName() == "br" && nextDelNode.getName() == "del") {
                            return false;
                        }
                        return true;
                    }
                    var prevText = focusText.substr(0, startOffset).replace(/\u200B/g, "");
                    var prevNode = curStartNode.getPrevious();
                    if (!prevText && prevNode && prevNode.type == CKEDITOR.NODE_ELEMENT && prevNode.getName() == 'del') {
                        prevNode.setHtml(prevNode.getText() + delText);
                        // prevNode.setAttribute("title", currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr);
                    } else {
                        var newText = new CKEDITOR.dom.text(delText);
                        var delMark = new CKEDITOR.dom.element('del');
                        delMark.setAttributes({
                            "contenteditable": "false",
                            // "title": currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr,
                            "class": "hm_revise_del",
                            // "_userid": currentUserInfo.userId,
                            "trace_id": 'trace_' + wrapperUtils.getGUID(),
                            // "modifier": currentUserInfo.userName,
                            "modifyTime": dateStr,
                            "modifyType": "删除"
                        });
                        delMark.append(newText);
                        range0.insertNode(delMark);
                        range0.setStartAfter(delMark);
                        selection.selectRanges([range0]);
                        range0.select();
                    }
                } else { // Backspace
                    if (text) {
                        delText = text;
                    } else {
                        if (range0.startOffset == 0 || (curEndNode.type == CKEDITOR.NODE_ELEMENT && range0.startOffset == 2)) {
                            return true;
                        }
                        if (curEndNode.type == CKEDITOR.NODE_ELEMENT && curEndNode.getChild(range0.endOffset - 1) && curEndNode.getChild(range0.endOffset - 1).type == CKEDITOR.NODE_ELEMENT) {
                            return true;
                        }
                        focusText = (curStartNode.$.textContent || curStartNode.$.wholeText || "");
                        if (curEndNode.type == CKEDITOR.NODE_ELEMENT) {
                            curEndNode = curEndNode.getChild(range0.endOffset - 1);
                            // var nodeText = (curEndNode.$.wholeText || curEndNode.$.textContent || "");
                            var nodeText = (curEndNode.$.textContent || curEndNode.$.wholeText || "");
                            var tmpText = nodeText.replace(/\u200B/g, "");
                            if (!tmpText) {
                                return true;
                            }
                            var lastChar = tmpText.charAt(tmpText.length - 1);
                            var spaceChar = nodeText.substring(nodeText.lastIndexOf(lastChar) + 1);
                            if (spaceChar.length < 8) {
                                focusText = tmpText;
                            } else {
                                focusText = nodeText;
                            }
                            startOffset = focusText.length;
                        }
                        delText = focusText.substr(startOffset - 1, 1);
                    }
                    if (!delText.replace(/\u200B/g, "")) {
                        var prevElement = range0.startContainer.$.previousElementSibling;
                        if (prevElement && prevElement.tagName == 'BR') {
                            var prevNode = range0.startContainer.getPrevious();
                            var prevTmpText = '';
                            while (prevNode && prevNode.type == CKEDITOR.NODE_TEXT) {
                                prevTmpText += prevNode.getText();
                                prevNode = prevNode.getPrevious();
                            }
                            if (!prevTmpText.replace(/\u200B/g, "")) {
                                prevElement.remove();
                            }
                        }
                        return true;
                    }
                    var nextText = focusText.substr(startOffset).replace(/\u200B/g, "");
                    var nextNode = curEndNode.getNext();
                    if (!nextText && nextNode && nextNode.type == CKEDITOR.NODE_ELEMENT && nextNode.getName() == 'del') {
                        var spaceText = new CKEDITOR.dom.text('\u200B');
                        nextNode.setHtml(delText + nextNode.getText());
                        spaceText.insertBefore(curStartNode);
                        // nextNode.setAttribute("title", currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr);
                    } else {
                        var newText = new CKEDITOR.dom.text(delText);
                        var delMark = new CKEDITOR.dom.element('del');
                        delMark.setAttributes({
                            "contenteditable": "false",
                            // "title": currentUserInfo.userName + "(" + currentUserInfo.登录IP + ")  " + dateStr,
                            "class": "hm_revise_del",
                            // "_userid": currentUserInfo.userId,
                            "trace_id": 'trace_' + wrapperUtils.getGUID(),
                            // "modifier": currentUserInfo.userName,
                            "modifyTime": dateStr,
                            "modifyType": "删除"
                        });
                        delMark.append(newText);
                        if (text) {
                            range0.insertNode(delMark);
                            range0.setStartAfter(delMark);
                            selection.selectRanges([range0]);
                            range0.select();
                        } else {
                            range0.insertNode(delMark);
                        }

                    }
                }
                return true;
            };

        });

        editor.deleteSelectionPart = function (range0, type, evt) {
            if (!editor.HMConfig.designMode) {
                return;
            }
            if (type == 'del' && range0.endOffset == range0.startOffset) {
                return;
            }
            var startEle = range0.startContainer;
            var noDelTag = ['tr', 'td', 'th', 'tbody', 'thead', 'table'];
            if (startEle && startEle.type == 1 && noDelTag.indexOf(startEle.getName()) > -1) {
                return;
            }

            var selectionHtml = editor.getSelectedHtml(1);
            if (selectionHtml) { //选中部分删除逻辑
                range0.deleteContents(true);
                return;
            }

            if (range0.endOffset == range0.startOffset && startEle && startEle.type == 1) { //不选中直接删除逻辑
                if (startEle && startEle.getAttribute && startEle.getAttribute('data-hm-name')) {
                    startEle.remove();
                } else if (startEle && startEle.type == 1 && startEle.getChildren().count() > 0) {
                    var curChild = startEle.getChildren().getItem(range0.startOffset - 1);
                    if (curChild) {
                        curChild.remove();
                    }
                }
                return;
            }
        }

        // 自动分页
        editor.on('change', function pageBreakListener(event) {
            var pageBreak = CKEDITOR.plugins.pagebreakCmd;
            if (pageBreak) {
                event = event.data;
                try {
                    //  事件名
                    switch (event.name) {
                        case 'beforeCommandExec':
                            // 上级事件名
                            switch (event.data.name) {
                                // 设置大小之前不分页 (undo里面写过)
                                // 设置页面之后会执行 paperSizedefault
                                // case 'paperSize':

                                // 同步之前不分页
                                case 'sync':
                                // 续打
                                case 'settingUpNew':
                                case 'settingUpStart':
                                case 'settingUpEnd':
                                // 插入删除列
                                case 'columnInsertBefore':
                                case 'columnDelete':
                                    return;
                                case 'enter':
                                case 'pagebreakByHand':
                                // 在此病历后分页
                                case 'splitAfterDoc':
                                case 'cancelSplitAfterDoc':
                                case 'cancelPageNumberOfDoc':
                                    break;
                                default:
                                    // debugger;
                                    break;
                            }
                            break;
                        case 'afterCommandExec':
                            // 上级事件名
                            switch (event.data.name) {
                                // 续打
                                case 'settingUpNew':
                                case 'settingUpStart':
                                case 'settingUpEnd':
                                    return;
                            }
                            break;
                    }
                } catch (e) {
                    console.warn('Onchange - 事件溯源失败: ', e);
                    debugger;
                }
                pageBreak.performAutoPaging(this, event); // editor.on('change')
            }
        });
    }
});

/**
 * 显示修订
 * @param {*} editor
 */
function showReviseModel($body) {
    $body.removeClass('hm-revise-hide').addClass('hm-revise-show');
}

/**
 * 隐藏修订
 * @param {*} editor
 */
function hideReviseModel($body) {
    $body.removeClass('hm-revise-show').addClass('hm-revise-hide');
}


/**
 * 检查当前聚合病历子病历锁定状态
 * @param {*} editor
 */
function checkSubEmrLock(editor, $emrWidget) {
    if ($emrWidget.length == 0) {
        return false;
    }
}

function setDataToEle($ele, data, editor, bindstyle, texttype) {
    var colRownum = {};

    if (data.length == 0) {
        $ele.attr('_placeholdertext', 'true');
        var val = $ele.parent('.new-textbox').attr('_placeholder') || '';
        $ele.html(val);
        $ele.attr('binddata', '');
        $ele.attr('bindstyle', '');
        return;
    }
    $ele.attr('binddata', JSON.stringify(data));
    $ele.attr('bindstyle', bindstyle);
    var str = '';
    var separator = ';';
    if (bindstyle == '横向') {
        separator = ';';
    } else if (bindstyle == '纵向') {
        separator = '<br/>';
    }
    var key = '';
    if (texttype == '诊断') {
        key = 'name';
        var index = 0;
        for (var i = 0; i < data.length; i++) {
            var curStr = '';
            var _pid = data[i]['pid'] || '';
            var trueName = data[i]['name'] + (data[i]['remark']?'('+data[i]['remark']+')':'')+(data[i]['checked']?'':'?');
            if(_pid == ''){
                index++;
                curStr += index+'、';
            }else{
                curStr += '<span style="visibility:hidden;">'+index + '、</span>'
            }
            curStr += trueName;
            if(i + 1 != data.length){
                curStr += separator;
            }
            str += curStr;
        }
    } else {
        key = '手术名称';
        for (var i = 0; i < data.length; i++) {
            if (i + 1 == data.length) {
                str += (i + 1) + '、' + data[i][key];
            } else {
                str += (i + 1) + '、' + data[i][key] + separator;
            }
        }
    }


    $ele.removeAttr('_placeholdertext');
    $ele.html(str);
}

// 简洁模式样式
function switchCssConciseModel(node, flag) {
    if (flag) {
        var features = '._printHide,._paragraphHide,.hide_class,' +
            '.new-textbox,[data-hm-node],[_placeholderText],ins,.cke_page_split_mark,.continuation-identifier';
        node.find(features).addClass('concise-model');
    } else {
        node.find('.concise-model').removeClass('concise-model');
    }
}



// 是否时间类型数据元
function isDateDS(name) {
    if (!name) {
        return false;
    }
    return true;
    //return name.indexOf('[') > -1 && name.indexOf(']') > -1;
}

function setDSVal(ds, bindVal, syncType) {
    var datasourceNode = new CKEDITOR.dom.element(ds);

    var nodeType = datasourceNode.getAttribute('data-hm-node');
    var name = datasourceNode.getAttribute('data-hm-name');

    if(bindVal['用户ID']){
        datasourceNode.setAttribute('signUserId',bindVal['用户ID']);
        datasourceNode.setAttribute('signUserName',bindVal['用户名']);
        bindVal = bindVal['值'];
    }

    switch (nodeType) {
        case 'newtextbox':
            var _placeholder = datasourceNode.getAttribute('_placeholder') || '';
            var newtextboxcontent = $(datasourceNode.$).find("span.new-textbox-content");
            if (newtextboxcontent.length > 0) {
                bindVal = wrapperUtils.formatTimeTextVal(bindVal, newtextboxcontent.attr('_timetype'));
                if (bindVal) {
                    newtextboxcontent.removeAttr('_placeholdertext');
                } else {
                    newtextboxcontent.attr('_placeholdertext', 'true');
                }
                switch (syncType) {
                    case '全量同步':
                        newtextboxcontent.html(bindVal || _placeholder);
                        break;
                    default:
                        if (newtextboxcontent.text().replace(/\u200B/g, '').replace(_placeholder, '').replace(/\s+/, '') == '') {
                            newtextboxcontent.html(bindVal);
                        }
                        break;
                }
            }
            break;
        case 'dropbox':
            switch (syncType) {
                case '全量同步':
                    datasourceNode.setText(bindVal);
                    break;
                default:
                    if (datasourceNode.getText().replace(/\u200B/g, '') == '') {
                        datasourceNode.setText(bindVal);
                    }
                    break;
            }
            break;
        case 'timebox':

            try {
                var _timeoption = datasourceNode.getAttribute('_timeoption');
                bindVal = formatStringDate(bindVal, _timeoption);
            } catch (e) {
                console.log(bindVal);
                console.log(e);
            }

            switch (syncType) {
                case '全量同步':
                    datasourceNode.setText(bindVal);
                    break;
                default:
                    if (datasourceNode.getText().replace(/\u200B/g, '') == '') {
                        datasourceNode.setText(bindVal);
                    }
                    break;
            }

            break;
        case 'searchbox':
            var searchOption = datasourceNode.getAttribute('_searchoption');
            var searchpair = (datasourceNode.getAttribute('_searchpair') || '').replace(/\u200B/g, '');
            var searchpairVal = genericDataConvert(bindVal, searchpair);

            function setupSearchbox() {
                datasourceNode.setText(bindVal);
                if((searchOption == "医生名称" || searchOption == "护士名称" || searchOption == "医护名称") && searchpair == ""){
                    datasourceNode.attr('_name', bindVal);
                    if(name.indexOf('姓名') >=0){
                        var newname1  =  name.replaceAll("姓名","编码");
                        var newname2  =  name.replaceAll("姓名","ID");
                        var code  =  data[newname1] == null? data[newname2]:data[newname1];
                        datasourceNode.attr('_code', code);
                    }else if(name.indexOf('名称') >=0){
                        var newname1  =  name.replaceAll("名称","编码");
                        var newname2  =  name.replaceAll("名称","ID");
                        var code  =  data[newname1] == null? data[newname2]:data[newname1];
                        datasourceNode.attr('_code', code);
                    }
                }else {
                    if (searchOption.indexOf('码') >= 0) {
                        datasourceNode.setAttribute('_code', bindVal);
                    } else {
                        datasourceNode.setAttribute('_name', bindVal);
                    }
                    if (searchpair && searchpair.indexOf('码') >= 0) {
                        datasourceNode.setAttribute('_code', searchpairVal);
                    }
                    if (searchpair && searchpair.indexOf('码') < 0) {
                        datasourceNode.setAttribute('_name', searchpairVal);
                    }
                    if (searchpair && searchpair.indexOf('ID') >= 0) {
                        datasourceNode.setAttribute('_code', searchpairVal);
                    }
                }
            }

            switch (syncType) {
                case '全量同步':
                    setupSearchbox();
                    break;
                default:
                    if (datasourceNode.getText().replace(/\u200B/g, '') == '') {
                        setupSearchbox();
                    }
                    break;
            }
            break;
        case 'labelbox':
            var bindable = datasourceNode.getAttribute('_bindable');
            if (bindable) {
                datasourceNode.setText(bindVal);
            }
            break;
        case 'cellbox':
            datasourceNode.setText(bindVal);
            break;
    }
}
