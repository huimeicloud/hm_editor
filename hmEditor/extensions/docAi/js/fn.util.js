commonHM.component['hmAi'].fnSub("utils", {
    init: function () {
        var _t = this;
    },
    // 查找并加粗
    findAndStyle: function ($progreeContent, keycode, searchText, attrs) {
        if (!searchText) return;
        var editor = this.parent.editor;
        var doc = editor.document;
        var ranges = [];
        var selrange = editor.createRange();
        var item = $progreeContent.find('span[data-hm-code="' + keycode + '"]');
        if (!item.length) {
            return;
        }
        // selrange.selectNodeContents(editor.editable());
        selrange.selectNodeContents(new CKEDITOR.dom.element(item[0]));

        // 3. 遍历所有匹配的文本
        var walker = new CKEDITOR.dom.walker(selrange);
        // 遍历所有文本节点
        walker.evaluator = function (node) {
            return node.type === CKEDITOR.NODE_TEXT;
        };
        var node;
        while ((node = walker.next())) {
            // 检查父节点是否已有doc-warn-txt类
            var parent = node.getParent();
            if (parent && parent.hasClass && parent.hasClass('doc-warn-txt')) {
                continue; // 跳过已经有doc-warn-txt类的节点
            }

            var text = node.getText();
            var startIdx = 0;
            while (startIdx <= text.length) {
                var index = text.indexOf(searchText, startIdx);
                if (index === -1) break;

                var endIdx = index + searchText.length;
                var range = new CKEDITOR.dom.range(doc);
                range.setStart(node, index);
                range.setEnd(node, endIdx);
                ranges.push(range);

                startIdx = endIdx;
            }
        }
        // 定义样式：加粗和红色
        var style = new CKEDITOR.style({
            attributes: attrs || {
                'class': 'doc-warn-txt'
            },
            element: 'span',
            // 覆盖现有样式避免冲突
            overrides: [{
                element: 'span',
                attributes: {
                    'style': null
                }
            }]
        });

        // 应用样式到所有匹配范围
        ranges.forEach(function (range, index) {
            // style._.definition.attributes.uucode=index;
            style.applyToRange(range);
        });

        // 通知编辑器内容已变更
        // editor.fire('change');
    },
    // 移除高亮
    removeHighlights: function (el, keepContent) {
        // var editor = this.parent.editor;
        // var spans = editor.document.getElementsByTag('span');
        // var elements = spans.count() ? spans.getItems() : [];

        // for (var i = 0; i < elements.length; i++) {
        //     var element = elements[i];
        //     if (element.hasClass('search-highlight')) {
        //         element.remove(true); // true 表示保留内容
        //     }
        // }
        if (!el) {
            return;
        }
        new CKEDITOR.dom.element(el).remove(keepContent);
    },
    // 替换高亮
    replaceHighlighted: function (replaceText, style, uucode) {
        var editor = this.parent.editor;
        var spans = editor.document.getElementsByTag('span');
        var elements = spans.$;
        var count = 0;

        editor.fire('saveSnapshot');

        for (var i = elements.length - 1; i >= 0; i--) {
            var element = new CKEDITOR.dom.element(elements[i]);
            if (element.hasClass('doc-warn-txt') && element.getAttribute('uucode') == uucode) {
                // 创建新的带样式的 span 元素
                var newElement = new CKEDITOR.dom.element('span');
                // 设置文本内容
                newElement.setText(replaceText);
                // 设置样式，可以是 class 或者 inline style
                if (style.class) {
                    newElement.addClass(style.class);
                }
                if (style.style) {
                    newElement.setStyles(style.style);
                }
                // 替换原有元素
                element.insertBeforeMe(newElement);
                element.remove();
                count++;
            }
        }

        // editor.fire('saveSnapshot');
        return count;
    },
    /**
     * http请求
     * @param {*} opts
     */
    request: function (opts) {
        var _t = this;
        var headers = {
            Huimei_id: 'D7928B9182ABF6E0A6A6EBB71B353585'
        };
        headers = Object.assign(headers, opts.heders || {});
        $.ajax({
            type: opts.type || "POST",
            url: opts.url,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(opts.data || {}),
            headers: headers,
            success: function (res) {
                res.head = res.head || {};
                if (res.code == 200 || res.head.error == 0) {
                    opts.success && opts.success(res.body || res.data);
                }
            }

        });
    },
    /**
     * 生成uuid
     * @param {*} i
     * @returns
     */
    getUUId: function (i) {
        var d = new Date(),
            rand = parseInt(Math.random() * 1000);
        return d.getTime().toString(36) + rand.toString(36) + (i || '');
    },
    /**
     * 判断元素是否存在或包含某个class
     * @param {*} ele
     * @param {*} cls
     * @returns
     */
    hasClass: function (ele, cls) {
        return $(ele.$).hasClass(cls) || $(ele.$).find('.' + cls).length > 0;
    },
    //ajx 大模型轮询
    fetchData: function (opts) {
        var _t = this;
        _t.clearFetchData();
        var index = _t.index = 0;
        this.fetchIntervalId = setInterval(function () {
            var data = JSON.parse(JSON.stringify(opts.data || {}));
            data.index = index++;
            console.log('beginRequest:' + data.index);
            _t.request({
                url: 'http://172.16.3.51/hmgpt/cdss_stream_chat',
                heders: {
                    Huimei_id: 'D7928B9182ABF6E0A6A6EBB71B353585'
                },
                data: data,
                success: function (result) {
                    console.log('idx:' + data.index);
                    if (data.index > _t.index) {
                        _t.index = data.index;
                        opts.onmessage && opts.onmessage(result.content, result.dialogue_end_flag);
                    }
                    if (result.dialogue_end_flag || result.dialogue_error_flag) {
                        console.log('轮询结束' + data.index);
                        _t.clearFetchData();
                    }

                }
            });
            if (index > 30) {
                _t.clearFetchData();
            }
        }, 2000);
    },
    clearFetchData: function () {
        if (this.fetchIntervalId) {
            clearInterval(this.fetchIntervalId);
            this.fetchIntervalId = null;
        }
    },

    /**
     * 格式化日期
     * @param {Date|String} date 日期对象或日期字符串
     * @param {String} fmt 格式化模板,如 'yyyy-MM-dd HH:mm:ss'
     * @returns {String} 格式化后的日期字符串
     */
    formatDate: function (date, fmt) {
        if (!date) return '';
        if (typeof date === 'string') {
            date = new Date(date.replace(/-/g, '/'));
        }
        if (typeof date === 'number') {
            date = new Date(date);
        }
        var o = {
            'M+': date.getMonth() + 1, // 月份
            'd+': date.getDate(), // 日
            'H+': date.getHours(), // 小时
            'm+': date.getMinutes(), // 分
            's+': date.getSeconds(), // 秒
            'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
            'S': date.getMilliseconds() // 毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
            }
        }
        return fmt;
    },
    parseAIMarker: function (content, tag) {
        if (!content) return {
            content: '',
            isComplete: false
        };
        tag = tag || 'script';

        var startTag = '<' + tag + '>';
        var endTag = '</' + tag + '>';

        var startIndex = content.indexOf(startTag);
        if (startIndex === -1) {
            return {
                content: '',
                isComplete: false
            };
        }

        var contentStart = startIndex + startTag.length;
        var endIndex = content.indexOf(endTag, contentStart);

        if (endIndex === -1) {
            // 找到开始标记但没有结束标记
            return {
                content: content.substring(contentStart).trim(),
                isComplete: false
            };
        }

        // 找到完整的标记
        return {
            content: content.substring(contentStart, endIndex).trim(),
            isComplete: true
        };
    },
    /**
     * 解析结果标签
     * @param {*} content
     * @param {*} tag
     * @returns
     */
    wrapMarkedContent: function (content, tag) {
        if (!content) return content;
        tag = tag || 'script';

        var startTag = '```' + tag;
        var endTag = '```';

        var startIndex = content.indexOf(startTag);
        if (startIndex === -1) {
            return content;
        }

        var contentStart = startIndex + startTag.length;
        var beforeContent = content.substring(0, startIndex);
        var endIndex = content.indexOf(endTag, contentStart);

        if (endIndex === -1) {
            // 未完成的标记内容
            var markedContent = content.substring(contentStart);
            return beforeContent + startTag +
                '<span class="ai-marked-content">' +
                markedContent + '</span>';
        }

        // 完整的标记内容
        var markedContent = content.substring(contentStart, endIndex);
        var afterContent = content.substring(endIndex);

        return beforeContent + startTag +
            '<span class="ai-marked-content">' +
            markedContent + '</span>' +
            afterContent;
    },
    /**
     * 获取SDK窗口
     * @returns
     */
    getSDKWindow: function () {
        var sdkWindow = null;
        try {
            sdkWindow = parent.window;
            // // 从当前窗口开始
            // var currentWindow = window;
            // if (currentWindow.HM && currentWindow.HM.config) {
            //     sdkWindow = currentWindow;
            // } else {
            //     // 向上遍历父窗口直到顶层窗口
            //     while (currentWindow !== currentWindow.parent) {
            //         currentWindow = currentWindow.parent;
            //         if (currentWindow.HM && currentWindow.HM.config) {
            //             sdkWindow = currentWindow;
            //             break;
            //         }
            //     }
            // }
        } catch (e) {}
        return sdkWindow || window;
    },
    /**
     * 获取数据元内容
     * @param {*} $el
     * @returns
     */
    getContent: function ($el) {
        if ($el.attr('_placeholdertext')) {
            return '';
        } else {
            var JTar = $el.clone();
            JTar.find('.r-model-gen-remark').remove();
            return $.trim(JTar.text().replace(/\u200B/g, ""));
        }
    },
    /**
     * 光标定位到起始
     * @param {*} target
     */
    focusInputFirst: function (target) {
        var editor = this.parent.editor;
        var targetElement = new CKEDITOR.dom.element(target);
        var parentSpan = targetElement.getParent();
        var prevNode = targetElement.getPrevious();
        var range = editor.createRange();
        var selection = editor.getSelection();

        if (prevNode && prevNode.type === CKEDITOR.NODE_TEXT) {
            range.setStartAt(prevNode, CKEDITOR.POSITION_AFTER_END);
        } else if (!prevNode || !zeroWidthChar.test(prevNode.getText())) {
            var zeroWidthNode = new CKEDITOR.dom.text('\u200B');
            zeroWidthNode.insertBefore(targetElement);
            range.setStartAt(parentSpan, CKEDITOR.POSITION_AFTER_START);
        }

        // 将光标定位到span的起始位置
        range.collapse(true);
        selection.removeAllRanges();
        selection.selectRanges([range]);

        // 聚焦到span
        parentSpan.focus();
    },
    /**
     * 获取元素位置 编辑器上层窗口
     * @param {*} el
     * @returns
     */
    getPosition: function (el) {
        var $body = this.parent.editor.document.$.documentElement;
        return {
            left: el.offsetLeft,
            top: el.offsetTop + el.offsetHeight + $('#cke_1_top').height() - $body.scrollTop
        }
    },
   
    //替换内容
    // function replaceHighlighted(editor, replaceText) {
    //     var spans = editor.document.getElementsByTag('span');
    //     var elements = spans.$; // 使用 $ 属性获取原生 DOM 元素集合
    //     var count = 0;

    //     editor.fire('saveSnapshot');

    //     for (var i = elements.length - 1; i >= 0; i--) {
    //         var element = new CKEDITOR.dom.element(elements[i]); // 转换为 CKEditor 元素
    //         if (element.hasClass('doc-warn-txt')) {
    //             var textNode = new CKEDITOR.dom.text(replaceText);
    //             element.insertBeforeMe(textNode);
    //             element.remove();
    //             count++;
    //         }
    //     }

    //     editor.fire('saveSnapshot');
    //     return count;
    // }

})