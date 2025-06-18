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
                // 设置是否可编辑
                $widgetNodes.prop("contenteditable", flag);
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
        $widgetNodes.find('span[data-kyee-node="timebox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-kyee-node="dropbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-kyee-node="checkbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-kyee-node="radiobox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-kyee-node="searchbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('span[data-kyee-node="newtextbox"]:not([_isdisabled="true"])').css('pointer-events', evtState);
        $widgetNodes.find('button[data-kyee-id]').css('pointer-events', evtState);
    },
    // 设置新文本框可编辑
    setEmrNewTextBoxEditable: function ($widgetNodes, flag) {
        var _t = this;
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
    }
});