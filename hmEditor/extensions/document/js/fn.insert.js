commonHM.component['documentModel'].fn({
    /**
     * 在光标处插入内容
     * @param {String} content 要插入的内容
     */
    insertContentAtCursor: function (content) {
        var _t = this;
        var selection = _t.editor.getSelection().getRanges()[0];
        if (!selection) {
            console.warn('未找到光标位置');
            return;
        }
        _t.editor.insertHtml(content);
        _t.editor.editable().fire('togglePlaceHolder', {});
    },

    /**
     * 检查光标是否在数据元内部
     * @param {CKEDITOR.editor} editor 编辑器实例
     * @returns {Boolean} 如果在数据元内部返回 true
     */
    _isCursorInsideDatasource: function (editor) {
        try {
            var selection = editor.getSelection();
            if (!selection) {
                return false;
            }
            
            var startElement = selection.getStartElement();
            if (!startElement) {
                return false;
            }
            
            // 使用 getAscendant 查找数据元元素（更高效）
            // 检查是否有 data-hm-node 属性的祖先元素（包括 newtextbox 等所有数据元类型）
            var datasourceElement = startElement.getAscendant(function(el) {
                var nodeType = el.getAttribute && el.getAttribute('data-hm-node');
                return nodeType;
            }, true); // includeSelf = true，也检查当前元素
            
            if (datasourceElement) {
                return true;
            }
            
            return false;
        } catch (e) {
            console.warn('_isCursorInsideDatasource: 检查失败', e);
            return false;
        }
    },

    /**
     * 将HTML内容转换为纯文本
     * @param {String} htmlContent HTML内容
     * @returns {String} 纯文本内容
     */
    _htmlToText: function (htmlContent) {
        try {
            // 创建一个临时div来提取文本
            var $temp = $('<div>').html(htmlContent);
            return $temp.text();
        } catch (e) {
            console.warn('_htmlToText: 转换失败', e);
            // 如果转换失败，尝试简单的替换
            return htmlContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }
    },

    /**
     * 插入HTML内容
     * @param {String} htmlContent 要插入的HTML内容
     * @param {String} posTag 定位标记（可选），如果提供，将通过 data-hm-code=posTag 或 data-hm-name=posTag 查找元素，在元素后插入HTML，完成后光标定位到插入HTML之前
     * @returns {Boolean} 是否成功插入
     */
    insertHtmlAtPosition: function (htmlContent, posTag) {
        var _t = this;
        
        if (!htmlContent) {
            console.warn('insertHtml: HTML内容不能为空');
            return false;
        }
        
        try {
            var editor = _t.editor;
            if (!editor) {
                console.error('insertHtml: 编辑器实例未初始化');
                return false;
            }
            
            // 如果没有 posTag，在光标处插入
            if (!posTag) {
                var selection = editor.getSelection().getRanges()[0];
                if (!selection) {
                    console.warn('insertHtml: 未找到光标位置');
                    return false;
                }
                
                // 检查光标是否在数据元内部
                if (_t._isCursorInsideDatasource(editor)) {
                    // 在数据元内部，转换为文本插入
                    var textContent = _t._htmlToText(htmlContent);
                    editor.insertText(textContent);
                } else {
                    // 在数据元外部，正常插入HTML
                    editor.insertHtml(htmlContent);
                }
                editor.editable().fire('togglePlaceHolder', {});
                return true;
            }
            
            // 如果有 posTag，查找元素并在元素后插入
            var editorBody = editor.document.getBody();
            var $body = $(editorBody.$);
            
            // 先通过 data-hm-code 查找
            var $element = $body.find('[data-hm-code="' + posTag + '"]');
            
            // 如果没找到，通过 data-hm-name 查找
            if ($element.length === 0) {
                $element = $body.find('[data-hm-name="' + posTag + '"]');
            }
            
            if ($element.length === 0) {
                console.warn('insertHtml: 未找到定位元素，posTag=' + posTag);
                return false;
            }
            
            // 获取第一个匹配的元素
            var targetElement = $element.first()[0];
            var ckElement = new CKEDITOR.dom.element(targetElement);
            
            // 创建 range，定位到元素后
            var range = editor.createRange();
            range.setStartAfter(ckElement);
            range.collapse(true);
            
            // 在元素后插入HTML内容
            editor.insertHtml(htmlContent, 'html', range);
            
            // 光标定位到插入HTML之前
            // 插入后，CKEditor默认会将光标放在插入内容的末尾
            // 我们需要将光标移到插入内容的起始位置（即元素后）
            // 注意：ckElement 引用仍然有效，因为插入是在元素后进行的，元素本身没有被删除或移动
            setTimeout(function() {
                try {
                    // 直接使用之前找到的元素引用，定位到元素后（即插入HTML之前）
                    var cursorRange = editor.createRange();
                    cursorRange.setStartAfter(ckElement);
                    cursorRange.collapse(true);
                    var selection = editor.getSelection();
                    selection.removeAllRanges();
                    selection.selectRanges([cursorRange]);
                } catch (e) {
                    console.warn('insertHtml: 设置光标位置失败', e);
                }
            }, 10);
            
            editor.editable().fire('togglePlaceHolder', {});
            return true;
        } catch (error) {
            console.error('insertHtml: 执行失败', error);
            return false;
        }
    }
});
