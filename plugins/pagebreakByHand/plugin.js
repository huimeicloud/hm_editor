/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Save plugin.
 */

(function () {

    var pluginName = 'pagebreakByHand';
    CKEDITOR.plugins.add(pluginName, {
        lang: 'zh,zh-cn',
        icons: 'pagebreakByHand',
        // hidpi: true,
        init: function (editor) {
            var command = editor.addCommand(pluginName, cmd);
            var label = '手动分页';
            if (editor.HMConfig.realtimePageBreak) {
                label = '取消手动分页';
            } else {
                label = '手动分页';
            }

            editor.ui.addButton && editor.ui.addButton('PagebreakByHand', {
                label: label,
                command: pluginName,
                toolbar: 'pagebreakByHand'
            });
        }
    });
    var cmd = {
        readOnly: 1,
        exec: function (editor, data) {
            var className = 'cke_button__' + this.uiItems[0].name;
            var $el = $('.' + className);
            var title = $el.attr('title');
            if (title == '手动分页') {
                $el.attr('title', '取消手动分页');
                editor.HMConfig.realtimePageBreak = true;
                realtimePageBreak = true;
            } else {
                $el.attr('title', '手动分页');
                editor.HMConfig.realtimePageBreak = false;
                realtimePageBreak = false;
                // 取消新续打标记
                var mask = editor.document.getBody().getPrevious();
                mask && mask.hasClass('breakLineEleNew') && mask.remove();
                var body = editor.document.getBody();
                // 判断 如果存在hm质控，移动到主体中
                if($(body.$).find('.doc-reminder').length > 0){
                    $(body.$).find('.hm-logic-page').first().find('.hm-page-content').prepend($(body.$).find('.doc-reminder'));
                }
            }
            editor.fire( 'realtimePageBreak' );
            console.log('realtimePageBreak = ' + realtimePageBreak);

            if (editor.HMConfig.watermark && editor.HMConfig.watermark.watermarkType) {
                var _$body = $(editor.document.getBody().$);
                _$body.find('.mask_box').remove(); 
                if (!editor.HMConfig.realtimePageBreak) {
                    window.hmEditor.setDocWatermark(editor.HMConfig.watermark);
                }
            }
        }
    };
})();
function setPageBreakByHandLabel(flag) {
    if (flag) {
        label = '取消手动分页';
        editor.HMConfig.realtimePageBreak = true;
    } else {
        label = '手动分页';
        editor.HMConfig.realtimePageBreak = false;
    }
    var $el = $('.cke_button__pagebreakByHand');
    $el.attr('title', label);
}
