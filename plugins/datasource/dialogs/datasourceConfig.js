//# sourceURL=plugins/datasource/dialogs/datasourceConfig.js
CKEDITOR.dialog.add('datasourceConfig', function (editor) {
    var sdkHost = editor.HMConfig.sdkHost || '';
    return {
        title: '数据元',
        minWidth: 600,
        minHeight: 400,
        contents: [{
            id: 'config',
            label: '',
            elements: [{
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
                    $.getTplHtml(sdkHost + '/plugins/datasource/dialogs/config/index.html', {
                        sdkHost: sdkHost
                    }, function (bodyHtml) {
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
            }]
        }],
        onOk: function () {
            var editor = editorIns;
            var d = {};
            this.commitContent(d);

            if (!d['data-hm-name']) {
                editor.showNotification("数据元不能为空");
                return false;
            }
            if (d['data-hm-node'] != 'labelbox' && d['data-hm-node'] != 'positionnode' && !d['data-hm-code']) {
                editor.showNotification("名称或者编码不正确");
                return false;
            }
            // 检查是否存在相同 data-hm-code 的数据元
            if (d['data-hm-code']) {
                var $doc = $(editor.document.$);
                var $headerTables = $doc.find('table[_paperheader="true"]');
                var existingElements = $doc.find('[data-hm-code="' + d['data-hm-code'] + '"]').not($headerTables.find('[data-hm-code="' + d['data-hm-code'] + '"]'));
                
                // 如果是编辑模式，排除当前正在编辑的元素
                if (!this.insertMode) {
                    var currentElement = editor.contextTargetElement;
                    if (currentElement && !currentElement.hasAttribute('data-hm-node') && !currentElement.is('button')) {
                        var $currentElement = $(currentElement.$).closest('[data-hm-node]');
                        if ($currentElement.length) {
                            currentElement = new CKEDITOR.dom.element($currentElement[0]);
                        }
                    }
                    var td = editor.elementPath().contains('td');
                    if (td && td.hasAttribute('data-hm-node')) {
                        currentElement = td;
                    }
                    
                    // 排除当前元素
                    if (currentElement && currentElement.$) {
                        existingElements = existingElements.filter(function() {
                            return this !== currentElement.$;
                        });
                    }
                }
                
                // 如果找到相同编码的数据元，提示并阻止保存
                if (existingElements.length > 0) {
                    editor.showNotification("已存在相同编码的数据元，编码不能重复");
                    return false;
                }
            }
            // if (d['data-hm-node'] == 'searchbox' && !d['_searchpair']) {
            //     editor.showNotification("搜索类型数据元对应名称/编码不能为空");
            //     return false;
            // }
            if(d['data-hm-node'] == 'searchbox' && !d['_searchoption']){
                editor.showNotification("搜索类型不能为空");
                return false;
            }
            if(d['data-hm-node'] == 'radiobox' || d['data-hm-node'] == 'checkbox' || d['_texttype'] == '下拉'){
                if (d['data-hm-items']) {
                    d['items'] = d['data-hm-items'].split('#');
                } else {
                    editor.showNotification("选项不能为空");
                    return false;
                }
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
    };
});

function _handleEdit(editor, sourceData) {
    // 保存当前滚动位置，防止修改元素内容后滚动到顶部
    var editorWindow = editor.document.$.defaultView || editor.document.$.parentWindow;
    var scrollTop = editorWindow ? editorWindow.scrollY || editorWindow.pageYOffset || 0 : 0;
    var scrollLeft = editorWindow ? editorWindow.scrollX || editorWindow.pageXOffset || 0 : 0;

    var element = editor.contextTargetElement;
    if (!element.hasAttribute('data-hm-node') && !element.is('button')) {
        var $element = $(element.$).closest('[data-hm-node]');
        
        // 如果找到了带data-hm-node的元素
        if ($element.length) {
            element = new CKEDITOR.dom.element($element[0]);
            
        } 
    }
    var td = editor.elementPath().contains('td');
    if (td && td.hasAttribute('data-hm-node')) element = td;

    // 更新节点类型
    var oldType = element.getAttribute('data-hm-node');
    var newType = sourceData['data-hm-node'];
    
    // 如果类型发生变化，需要重新创建节点
    if (oldType !== newType) {
        // 保存原节点的基本属性
        var oldId = element.getAttribute('data-hm-id');
        sourceData['data-hm-id'] = oldId; // 保持原有ID
        
        // 使用_handleCreate创建新节点，传入isEdit=true表示编辑模式
        var newNode = _handleCreate(editor, sourceData, true);
        
        if (newNode) {
            // 如果原节点是单元类型，需要特殊处理
            if (oldType === 'cellbox') {
                // 移除td上的数据元相关属性
                element.removeAttribute('data-hm-node');
                element.removeAttribute('data-hm-name');
                element.removeAttribute('data-hm-id');
                element.removeAttribute('data-hm-code');
                element.removeAttribute('data-hm-remark');
                // 清空td内容，包括br标签
                element.setHtml('');
                // 将新节点插入到td中
                element.append(newNode);
            } else {
                // 其他类型正常替换
                try {
                    if (element.$ && element.$.parentNode) {
                        element.$.parentNode.replaceChild(newNode.$, element.$);
                    } else if (element.getParent()) {
                        // 使用 CKEditor 的方法获取父节点
                        newNode.insertBefore(element);
                        element.remove();
                    } else {
                        // 如果都失败了，直接在光标位置插入
                        editor.insertElement(newNode);
                        if (element.$) {
                            element.remove();
                        }
                    }
                } catch (e) {
                    // 捕获异常，使用备用方案
                    console.warn('节点替换失败，使用备用方案:', e);
                    editor.insertElement(newNode);
                    try {
                        element.remove();
                    } catch (ex) {}
                }
                element = newNode;
            }
        }
        // 恢复滚动位置
        if (editorWindow) {
            setTimeout(function() {
                editorWindow.scrollTo(scrollLeft, scrollTop);
            }, 0);
        }
        return;
    }

    if (!sourceData['data-hm-items']) {
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


    if (sourceData._timewidth) {
        element.setAttribute('_timeWidth', sourceData._timewidth);
        element.setStyle('width', sourceData._timewidth + 'px');
        element.setStyle('min-width', sourceData._timewidth + 'px');
    } else {
        element.removeStyle('width');
        element.removeStyle('min-width');
    }

    if (sourceData['data-hm-items']) {
        element.setAttribute('data-hm-items', sourceData['data-hm-items'] || '');
    } else {
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
            // 获取分割符，默认为 &nbsp;
            var separatorValue = sourceData['_separator_value'] || '&nbsp;';
            var hideLabelCode = sourceData['_hidelabelcode'] === 'true';

            for (var i = 0; i < sourceData.items.length; i++) {
                var itemRaw = sourceData.items[i];
                var itemDisplay = _getItemDisplayLabel(itemRaw, hideLabelCode);
                var itemNode = new CKEDITOR.dom.element('span');
                itemNode.setText('\u200B');
                itemNode.addClass('fa');
                itemNode.addClass(sourceData['data-hm-node'] === 'checkbox' ? 'fa-square-o' : 'fa-circle-o');
                itemNode.setAttribute('data-hm-node', sourceData['data-hm-node']);
                itemNode.setAttribute('data-hm-itemName', itemRaw);
                $(itemNode.$).on('click', function () {
                    _handleCascade(this);
                });
                element.append(itemNode);

                var descNode = new CKEDITOR.dom.element('span');
                descNode.setText('\u200B');
                descNode.setAttribute('data-hm-node', 'labelbox');
                descNode.setAttribute('data-hm-itemName', itemRaw);
                descNode.setText(itemDisplay);
                element.append(descNode);
                // 使用配置的分割符，最后一个选项不添加分隔符
                _appendSeparator(element, separatorValue, i, sourceData.items.length);
            }
            if (!sourceData['_hidelabelcode']) {
                element.removeAttribute('_hidelabelcode');
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
            if (!sourceData['_placeholder']) {
                sourceData['_placeholder'] = defaultPlaceholder;
            }
            element.setAttribute('_placeholder', sourceData['_placeholder']);
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

            } else if (_texttype == '二维码') {
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.removeAttr('_timetype');
                newtextPlaceholder.removeAttr('data-hm-items');
                newtextPlaceholder.removeAttr('_selecttype');
                newtextPlaceholder.removeAttr('_jointsymbol');
            } else if (_texttype == '条形码') {
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.removeAttr('_timetype');
                newtextPlaceholder.removeAttr('data-hm-items');
                newtextPlaceholder.removeAttr('_selecttype');
                newtextPlaceholder.removeAttr('_jointsymbol');
            }




            for (var i = 0; i < attrs.length; i++) {
                var attrKey = attrs[i];
                var attrVal = sourceData[attrKey];
                if (attrKey.indexOf('_') > -1 && attrVal && attrKey != 'items') {
                    newtextPlaceholder.attr(attrKey, attrVal);
                }
            }

            // 如果是二维码类型，更新二维码预览
            if (sourceData._texttype == '二维码') {
                // 获取二维码配置参数
                var qrcodeWidth = sourceData._qrcode_width || '100';
                var qrcodeHeight = sourceData._qrcode_height || '100';
                var errorLevel = sourceData._qrcode_error_level || 'M';
                var textPosition = sourceData._qrcode_text_position || 'bottom';
                var previewText = '123456';
                
                // 尝试获取编辑器的二维码生成方法并更新预览
                try {
                    var _t = window.hmEditor.documentModel;
                    if (_t.generateQrcode) {
                        newtextPlaceholder.removeAttr('_placeholdertext');

                        // 使用通用二维码生成方法更新预览
                        _t.generateQrcode({
                            text: previewText,
                            width: qrcodeWidth,
                            height: qrcodeHeight,
                            errorLevel: errorLevel,
                            textPosition: textPosition,
                            container: newtextPlaceholder
                        }).catch(function(error) {
                            console.log('二维码预览更新失败，保持原有显示:', error);
                        });
                    } else {
                        console.log('二维码生成方法不可用，保持原有显示');
                    }
                } catch (error) {
                    console.log('二维码预览更新出错:', error);
                }
            } else if (sourceData._texttype == '条形码') {
                // 获取条形码配置参数
                var barcodeWidth = sourceData._barcode_width || '200';
                var barcodeHeight = sourceData._barcode_height || '50';
                var barWidth = sourceData._barcode_bar_width || '2';
                var textPosition = sourceData._barcode_text_position || 'bottom';
                var previewText = '123456';
                
                // 尝试获取编辑器的条形码生成方法并更新预览
                try {
                    var _t = window.hmEditor.documentModel;
                    if (_t.generateBarcodeSync) {
                        newtextPlaceholder.removeAttr('_placeholdertext');
                        // 使用同步条形码生成方法更新预览
                        var barcodeHTML = _t.generateBarcodeSync({
                            text: previewText,
                            width: barcodeWidth,
                            height: barcodeHeight,
                            barWidth: barWidth,
                            textPosition: textPosition
                        });
                        newtextPlaceholder.html(barcodeHTML);
                        console.log('条形码预览更新成功');
                    } else {
                        console.log('条形码生成方法不可用，保持原有显示');
                    }
                } catch (error) {
                    console.log('条形码预览更新出错:', error);
                }
            } else {
                if (newtextPlaceholder.find('.hm-qrcode-container').length > 0) {
                    newtextPlaceholder.find('.hm-qrcode-container').remove();
                    newtextPlaceholder.text(sourceData['_placeholder']);
                }
                if (newtextPlaceholder.find('.hm-barcode-container').length > 0) {
                    newtextPlaceholder.find('.hm-barcode-container').remove();
                    newtextPlaceholder.text(sourceData['_placeholder']);
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
    // 更新 data-hm-code
    if (sourceData['data-hm-code']) {
        element.setAttribute('data-hm-code', sourceData['data-hm-code']);
    } else {
        element.removeAttribute('data-hm-code');
    }
    // 更新 data-hm-remark（备注，绑定到数据元 DOM 属性）
    if (sourceData['data-hm-remark']) {
        element.setAttribute('data-hm-remark', sourceData['data-hm-remark']);
    } else {
        element.removeAttribute('data-hm-remark');
    }

    // 恢复滚动位置
    if (editorWindow) {
        setTimeout(function() {
            editorWindow.scrollTo(scrollLeft, scrollTop);
        }, 0);
    }
}

function removeDefineAttr(element) {
    if (!element) {
        return;
    }
    var names = element.getAttributeNames();
    var len = names.length;
    for (var i = 0; i < len; i++) {
        var cn = names[i] || '';
        if (cn.indexOf('_') == 0) {
            element.removeAttribute(cn);
        }
    }
}

function _handleCreate(editor, sourceData, isEdit) {
    // sourceData.autoLable = true; 

    // 如果不是编辑模式，才检查插入位置的合法性
    if (!isEdit) {
        var ranges = editor.getSelection().getRanges();
        if (!(ranges.length == 1 && ranges[0].collapsed)) {
            editor.showNotification('无法插入数据元到[选中文本]');
            return;
        }
        var td = editor.elementPath().contains('td');
        if (td && td.hasAttribute('data-hm-node')){ 
            editor.showNotification('无法插入数据元到[非嵌套类型数据元内]');
            return;
        }
        
        // 定位标识不能嵌套在数据元内部
        if (sourceData['data-hm-node'] === 'positionnode') {
            var selection = editor.getSelection();
            if (selection) {
                var startElement = selection.getStartElement();
                if (startElement) {
                    var datasourceElement = startElement.getAscendant(function(el) {
                        return el.getAttribute && el.getAttribute('data-hm-node');
                    }, true);
                    if (datasourceElement) {
                        editor.showNotification('定位标识不能嵌套在数据元内部');
                        return;
                    }
                }
            }
        }
    }
  
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

        // 自动插入labelbox标题
        if (sourceData['autoLable'] && sourceData['data-hm-node'] != 'labelbox') { 
            var labelboxNode = new CKEDITOR.dom.element('span');
            labelboxNode.setText('\u200B');
            labelboxNode.setAttribute('contentEditable', 'false');
            labelboxNode.setAttribute('data-hm-id', wrapperUtils.getGUID());
            labelboxNode.setAttribute('data-hm-node', 'labelbox');
            labelboxNode.setAttribute('data-hm-name', sourceData['data-hm-name'] + ':');
            labelboxNode.setText(sourceData['data-hm-name'] + ':');
            editor.editable().insertElement(labelboxNode);
        }
        var resultNode;
        switch (sourceData['data-hm-node']) {
            case 'positionnode':
                // 创建定位标识节点
                var positionNode = new CKEDITOR.dom.element('span');
                positionNode.setText('\u200B');
                positionNode.setAttribute('contentEditable', 'false');
                positionNode.setAttribute('data-hm-node', 'positionnode');
                positionNode.setAttribute('data-hm-name', sourceData['data-hm-name']);
                positionNode.setAttribute('data-hm-id', wrapperUtils.getGUID());
                
                if (!isEdit) {
                    editor.editable().insertElement(positionNode);
                    editor.editable().insertText('\u200B');
                    editor.fire('unlockSnapshot');
                    return; // 已经处理了插入，直接返回
                } else {
                    // 编辑模式下，设置 resultNode 并 break，让函数正常返回
                    resultNode = positionNode; 
                }
                break;
            case 'labelbox':
                node.setText(sourceData['data-hm-name']);
                resultNode = node;
                break;
            case 'newtextbox':
                var defaultPlaceholder = '_';
                if (!sourceData['_placeholder']) {
                    sourceData['_placeholder'] = defaultPlaceholder;
                }
                var newtextbox = node.clone(true);
                newtextbox.addClass('new-textbox');
                newtextbox.setAttribute('_placeholder', sourceData['_placeholder']);
                var newtextPlaceholder = new CKEDITOR.dom.element('span');
                newtextPlaceholder.addClass('new-textbox-content');
                newtextPlaceholder.setAttribute('_placeholderText', true);
                newtextPlaceholder.setAttribute('contentEditable', 'true');
                newtextPlaceholder.setText(sourceData['_placeholder']);


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
                
                // 如果是二维码类型，创建预览二维码
                if (sourceData._texttype == '二维码') {
                    // 获取二维码配置参数
                    var qrcodeWidth = sourceData._qrcode_width || '100';
                    var qrcodeHeight = sourceData._qrcode_height || '100';
                    var errorLevel = sourceData._qrcode_error_level || 'M';
                    var textPosition = sourceData._qrcode_text_position || 'bottom';
                    var previewText = '123456';
                    
                    // 尝试获取编辑器的二维码生成方法并生成预览
                    try {
                        var _t = window.hmEditor.documentModel;
                        if (_t.generateQrcode) {
                            $(newtextPlaceholder.$).removeAttr('_placeholdertext');
                            // 使用通用二维码生成方法创建预览
                            _t.generateQrcode({
                                text: previewText,
                                width: qrcodeWidth,
                                height: qrcodeHeight,
                                errorLevel: errorLevel,
                                textPosition: textPosition,
                                container: $(newtextPlaceholder.$)
                            }).catch(function(error) {
                                console.log('二维码预览生成失败，使用默认占位符:', error);
                                // 如果生成失败，保持原有的占位符
                            });
                        } else {
                            console.log('二维码生成方法不可用，使用默认占位符');
                        }
                    } catch (error) {
                        console.log('二维码预览生成出错:', error);
                    }
                } else if (sourceData._texttype == '条形码') {
                    // 获取条形码配置参数
                    var barcodeWidth = sourceData._barcode_width || '200';
                    var barcodeHeight = sourceData._barcode_height || '50';
                    var barWidth = sourceData._barcode_bar_width || '2';
                    var textPosition = sourceData._barcode_text_position || 'bottom';
                    var previewText = '123456';
                    
                    // 尝试获取编辑器的条形码生成方法并生成预览
                    try {
                        var _t = window.hmEditor.documentModel;
                        if (_t.generateBarcodeSync) {
                            $(newtextPlaceholder.$).removeAttr('_placeholdertext');
                            // 使用同步条形码生成方法创建预览
                            var barcodeHTML = _t.generateBarcodeSync({
                                text: previewText,
                                width: barcodeWidth,
                                height: barcodeHeight,
                                barWidth: barWidth,
                                textPosition: textPosition
                            });
                            $(newtextPlaceholder.$).html(barcodeHTML);
                            console.log('条形码预览生成成功');
                        } else {
                            console.log('条形码生成方法不可用，使用默认占位符');
                        }
                    } catch (error) {
                        console.log('条形码预览生成出错:', error);
                    }
                }

                newtextbox.append(newtextPlaceholder);
                resultNode = newtextbox;
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
                resultNode = node;
                break;
            case 'radiobox':
                // 获取分割符，默认为 &nbsp;
                var radioSeparatorValue = sourceData['_separator_value'] || '&nbsp;';
                var radioHideLabelCode = sourceData['_hidelabelcode'] === 'true';
                for (var i = 0; i < sourceData.items.length; i++) {
                    var radioItemRaw = sourceData.items[i];
                    var radioItemDisplay = _getItemDisplayLabel(radioItemRaw, radioHideLabelCode);
                    var itemNode = new CKEDITOR.dom.element('span');
                    itemNode.setText('\u200B');
                    itemNode.addClass('fa');
                    itemNode.addClass('fa-circle-o');
                    itemNode.setAttribute('data-hm-node', sourceData['data-hm-node']);
                    itemNode.setAttribute('data-hm-itemName', radioItemRaw);
                    $(itemNode.$).on('click', function () {
                        _handleCascade(this);
                    });
                    node.append(itemNode);

                    var descNode = new CKEDITOR.dom.element('span');
                    descNode.setText('\u200B');
                    descNode.setAttribute('data-hm-node', 'labelbox');
                    descNode.setAttribute('data-hm-itemName', radioItemRaw);
                    descNode.setText(radioItemDisplay);
                    node.append(descNode);
                    // 使用配置的分割符，最后一个选项不添加分隔符
                    _appendSeparator(node, radioSeparatorValue, i, sourceData.items.length);
                }

                //node.setAttribute('data-hm-items', sourceData.datasourceItem);
                //sourceData.radioStyle && node.setAttribute('_radioStyle', sourceData.radioStyle);
                //sourceData.radioSelectType && node.setAttribute('_radio_select_type', sourceData.radioSelectType);
                resultNode = node;
                break;
            case 'checkbox':
                // 获取分割符，默认为 &nbsp;
                var checkSeparatorValue = sourceData['_separator_value'] || '&nbsp;';
                var checkHideLabelCode = sourceData['_hidelabelcode'] === 'true';
                for (var i = 0; i < sourceData.items.length; i++) {
                    var checkItemRaw = sourceData.items[i];
                    var checkItemDisplay = _getItemDisplayLabel(checkItemRaw, checkHideLabelCode);
                    var itemNode = new CKEDITOR.dom.element('span');
                    itemNode.setText('\u200B');
                    itemNode.addClass('fa');
                    itemNode.addClass('fa-square-o');
                    itemNode.setAttribute('data-hm-node', sourceData['data-hm-node']);
                    itemNode.setAttribute('data-hm-itemName', checkItemRaw);
                    $(itemNode.$).on('click', function () {
                        _handleCascade(this);
                    });
                    node.append(itemNode);

                    var descNode = new CKEDITOR.dom.element('span');
                    descNode.setText('\u200B');
                    descNode.setAttribute('data-hm-node', 'labelbox');
                    descNode.setAttribute('data-hm-itemName', checkItemRaw);
                    descNode.setText(checkItemDisplay);
                    node.append(descNode);
                    // 使用配置的分割符，最后一个选项不添加分隔符
                    _appendSeparator(node, checkSeparatorValue, i, sourceData.items.length);
                }

                //node.setAttribute('data-hm-items', sourceData.datasourceItem);
                resultNode = node;
                break;
            case 'dropbox':
                //node.setAttribute('data-hm-items', sourceData.datasourceItem);
                //sourceData.selectType && node.setAttribute('_selectType', sourceData.selectType);
                //sourceData.jointSymbol && node.setAttribute('_jointSymbol', sourceData.jointSymbol);
                resultNode = node;
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
                    if (sourceData['data-hm-remark']) {
                        td.setAttribute('data-hm-remark', sourceData['data-hm-remark']);
                    }
                    resultNode = td;
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
                resultNode = node;
                break;
            case 'textboxwidget':
                node.addClass('textboxWidget-content');
                var wrapNode = new CKEDITOR.dom.element('span');
                wrapNode.addClass('textboxWidget');
                wrapNode.append(node);
                //editor.execCommand( 'textboxWidget' );
                resultNode = wrapNode;
                break;
                // case 'button':
                //     editor.editable().insertElement(node);
                //     break;
            default:
                editor.showNotification('请选择一种数据元类型');
                break;
        }
        
        // 如果不是编辑模式，插入节点
        if (!isEdit && resultNode) {
            if (sourceData['data-hm-node'] !== 'cellbox') {
                editor.editable().insertElement(resultNode);
            }
            // 模板制作时, 在最后一行 (无 br 的 p) 末尾添加数据元时如果没有零宽字符就没法聚焦到后面
            editor.editable().insertText('\u200B');
            editor.fire('unlockSnapshot');
        }
         // 如果是编辑模式，返回对应类型的节点
        if (isEdit) {
            return resultNode;
        }
    

}

/**
 * 根据「不显示编码」配置获取选项展示文案（仅显示值或 值(编码)）
 * @param {string} item 选项字符串，如 "值1(编码1)"
 * @param {boolean} hideCode 是否不显示括号及编码
 * @returns {string}
 */
function _getItemDisplayLabel(item, hideCode) {
    if (!hideCode || !item) return item;
    var m = (item || '').match(/^\s*(.+?)\s*\((.*?)\)\s*$/);
    return m ? m[1].trim() : item;
}

/**
 * 添加分隔符节点（最后一个选项不添加）
 * @param {Element} parentNode 父节点
 * @param {string} separatorValue 分隔符值
 * @param {number} index 当前索引
 * @param {number} total 总数量
 */
function _appendSeparator(parentNode, separatorValue, index, total) {
    if (index < total - 1) {
        var separatorNode = new CKEDITOR.dom.element('span');
        separatorNode.setAttribute('class', 'hm-separator');
        separatorNode.setHtml(separatorValue);
        parentNode.append(separatorNode);
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
function _handleRelevance(node) {
    if (node.hasClass('new-textbox-content')) {
        node = $(node.parent()[0]);
    }
    if (!node.attr('_relevance')) {
        return;
    }
    var relevanceArr = JSON.parse(node.attr('_relevance'));
    var nodeVal = getVal(node);
    var val="";
    if(nodeVal.value){
        val = nodeVal.value.replace(zeroWidthChar, '');
    }else{
        val = nodeVal.replace(zeroWidthChar, '');
    } 
    // console.log('值------------' + val)
    var valArr = [];
    var nodeType = node.attr('data-hm-node');
    switch (nodeType) {
        case 'newtextbox':
            var _texttype = node.attr('_texttype');
            if (_texttype == '下拉') {
                var jointsymbol = node.attr('_jointSymbol') || ',';
                valArr = val.split(jointsymbol);
            } else {
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
        // 赋值目标排除标题；显示/隐藏可作用于标题（labelbox）
        var ele = $body.find('[data-hm-name="' + 关联数据元名称 + '"]:not([data-hm-node="labelbox"])');
        var $showHideTargets = $body.find('[data-hm-name="' + 关联数据元名称 + '"]');
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
                            ele.find('span[data-hm-node="radiobox"][data-hm-itemname="' + 关联数据元值 + '"]').removeClass('fa-circle-o').addClass('fa-dot-circle-o').attr('_selected', 'true');
                        }
                        case 'checkbox':
                            if (关联数据元值 == '置空') {
                                ele.find('span[data-hm-node="checkbox"]:not([data-hm-node="labelbox"])').removeClass('fa-check-square-o').addClass('fa-square-o').removeAttr('_selected');
                            } else {
                                ele.find('[data-hm-itemname=' + 关联数据元值 + ']:not([data-hm-node="labelbox"])').removeClass('fa-square-o').addClass('fa-check-square-o').attr('_selected', 'true');
                            }
                            break;
                        default:
                            break;
                }
            }
        }
        if (关联数据元显示隐藏) {
            if (关联数据元显示隐藏 == '显示') {
                if (valArr.includes(当前数据元值)) {
                    $showHideTargets.show();
                } else {
                    $showHideTargets.hide();
                }
            } else if (关联数据元显示隐藏 == '隐藏') {
                if (valArr.includes(当前数据元值)) {
                    $showHideTargets.hide();
                } else {
                    $showHideTargets.show();
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