/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Save plugin.
 */

(function() {

    var pluginName = 'clear';

    CKEDITOR.plugins.add(pluginName, {
        // jscs:disable maximumLineLength
        lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        icons: 'clear', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        init: function(editor) {
            var command = editor.addCommand(pluginName, clearCmd);

            editor.ui.addButton && editor.ui.addButton('Clear', {
                label: '一键清除',
                command: pluginName,
                toolbar: 'clear'
            });
        }
    });
    var clearCmd = {
        exec: function(editor, data) {
            var clearDialog = $("#clear-dialog");
            if (clearDialog.length == 0) {
                clearDialog = $('<div id="clear-dialog"><p>该操作会清除页面全部内容，是否继续？</p></div>');
                $("body").append(clearDialog);
            }
            clearDialog.dialog({
                resizable: false,
                title: "提示",
                height: 200,
                width: 300,
                modal: true,
                buttons: {
                    "确认": function() {
                        $(this).dialog("close");
                        var $body = $(editor.document.getBody().$);
                        $body.html('<p><br></p>');
                    },
                    "取消": function() {
                        $(this).dialog("close");
                    }
                }
            });
        },
    };
})();