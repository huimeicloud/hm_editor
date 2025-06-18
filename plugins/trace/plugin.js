/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Save plugin.
 */

(function () {
    var traceShowCmd = {
        readOnly: 1,
        exec: function (editor) {
            if (editor.traceShow) {
                editor.traceShow = false;
                editor.commands["trace"].setState(CKEDITOR.TRISTATE_OFF);
                editor.editable().removeClass('HM-Trace').addClass('HM-Trace-Hide');
            } else {
                editor.traceShow = true;
                editor.commands["trace"].setState(CKEDITOR.TRISTATE_ON);
                editor.editable().removeClass('HM-Trace-Hide').addClass('HM-Trace');
            }
        }
    };

    CKEDITOR.plugins.add('trace', {
        icons: 'trace',
        hidpi: true,
        init: function (editor) {

            editor.addCommand('trace', traceShowCmd);
            editor.ui.addButton && editor.ui.addButton('Trace', {
                label: '是否显示留痕',
                command: 'trace',
                toolbar: 'document'
            });


            var trace = null;
            editor.traceShow = false;

            editor.on('contentDom', function () {
                if (trace) {
                    trace.setEditor(editor);
                } else {
                    trace = new window.TrackFun(editor);
                }
            });
        }
    });
})();


(function () {
    window.TrackFun = function (editor, user) {
        this.editor = editor;
        this.$editable = $(this.editor.editable().$);
        this.$tracePreview = null;
        this.init();
    };

    $.extend(window.TrackFun.prototype, {
        init: function () {
            this._initDom();
            this._initListeners()
        },
        setEditor: function (editor) {
            this.editor = editor;
            this.$editable = $(this.editor.editable().$);
            this._initListeners();
        },
        _initDom: function () {
            this.$tracePreview = $('<div class="hm-trace-preview" style=""><div class="hm-trace-toolbar-preview"></div></div>').appendTo(window.document.body);
            this.$tracePreview.show();

        },
        _initListeners: function () {
            var _this = this;
            _this.$editable.off('mouseover.trace').on('mouseover.trace', function (evt) {
                if (!_this.editor.traceShow) {
                    return;
                }
                if(evt && evt.target && $(evt.target).hasClass('hm-mark')){
                    _this.showPreview(evt);
                    $(evt.target).one('mouseout.trace', function () {
                        _this.$tracePreview.css('top', '-100px');
                    });
                }
            });
        },
        showPreview: function (evt) {
            var $trace = $(evt.target);
            var editDate = parseInt($trace.attr('hm-modify-time'), 10);
            var modifiedType = $trace.attr('hm-modify-type');
            var text = new Date(editDate).Format('yyyy-MM-dd hh:mm:ss') + '&nbsp;&nbsp;' + $trace.attr('hm-modifier') + '&nbsp;&nbsp;' + modifiedType;
            this.$tracePreview.find('.hm-trace-toolbar-preview').html(text);
            var traceClass = '';
            if(modifiedType == '增加'){
                traceClass = 'hm-trace-ins';
            }else if(modifiedType == '删除'){
                traceClass = 'hm-trace-del';
            }else {
                traceClass = 'hm-trace-mark';
            }
            this.$tracePreview.removeClass('hm-trace-ins').removeClass('hm-trace-del').removeClass('hm-trace-mark');
            this.$tracePreview.addClass(traceClass);
            this.positionPreview(evt);
        },
        positionPreview: function (evt) {
            var element = evt.target;
            var containerWidth = window.innerWidth,
                buttonHeight = this.$tracePreview[0].offsetHeight,
                boundary = element.getBoundingClientRect(),
                diffLeft = 0,
                diffTop = -10,
                elementsContainer = this.$editable[0],
                elementsContainerAbsolute = ['absolute', 'fixed'].indexOf(window.getComputedStyle(elementsContainer).getPropertyValue('position')) > -1,
                relativeBoundary = {},
                halfOffsetWidth, defaultLeft, middleBoundary, elementsContainerBoundary, top;

            halfOffsetWidth = this.$tracePreview[0].offsetWidth / 2;
            defaultLeft = diffLeft - halfOffsetWidth;

            if (elementsContainerAbsolute) {
                elementsContainerBoundary = elementsContainer.getBoundingClientRect();
                ['top', 'left'].forEach(function (key) {
                    relativeBoundary[key] = boundary[key] - elementsContainerBoundary[key];
                });
                relativeBoundary.width = boundary.width;
                relativeBoundary.height = boundary.height;
                boundary = relativeBoundary;
                containerWidth = elementsContainerBoundary.width;
                top = elementsContainer.scrollTop;
            } else {
                top = window.pageYOffset;
            }

            middleBoundary = boundary.left + boundary.width / 2;
            if(boundary.height > 200){
                top = evt.clientY + 75 + buttonHeight;
            }else {
                top += buttonHeight + boundary.top + boundary.height - diffTop - this.$tracePreview[0].offsetHeight + 75;
            }

            this.$tracePreview.css('top', Math.round(top) + 'px');
            this.$tracePreview.css('right', 'initial');
            if (middleBoundary < halfOffsetWidth) {
                this.$tracePreview.css('left', defaultLeft + halfOffsetWidth + 'px');
                this.$tracePreview.css('right', 'initial');
            } else if ((containerWidth - middleBoundary) < halfOffsetWidth) {
                this.$tracePreview.css('left', 'auto');
                this.$tracePreview.css('right', 0);
            } else {
                this.$tracePreview.css('left', defaultLeft + middleBoundary + 'px');
                this.$tracePreview.css('.right', 'initial');
            }
        }
    });
})();

(function () {
    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
})();
