/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The revise（修订） plugin.
 */
var reviseIconConfig = {
    "显示修订":{
        "title":"隐藏修订","img":"revise_hide.png"
    },
    "隐藏修订":{
        "title":"显示修订","img":"revise.png"
        // "title":"隐藏修订","img":"revise_hide.png"
    }
};
var className = '';
var conParent = '';
(function () {
    var execCmd = {
        exec: function (editor, cmdData) {
            if(cmdData.reviseState == '显示修订'){
                editor.reviseModelOpened = false;
            }
            var $body = $(editor.document.getBody().$);
            if(editor.reviseModelOpened){
                editor.reviseModelOpened = false;
                hideReviseModel($body);
            }else {
                editor.reviseModelOpened = true;
                showReviseModel($body);
            }
            var className = 'cke_button__'+this.uiItems[0].name;
            updateIcon(editor, className);

        },
        readOnly: 1
    };


    var pluginName = 'revise';

    // Register a plugin named "revise".
    CKEDITOR.plugins.add(pluginName, {
        // jscs:disable maximumLineLength
        lang: 'zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        icons: 'revise', // %REMOVE_LINE_CORE%
        // hidpi: true, // %REMOVE_LINE_CORE%
        init: function (editor) {
            editor.reviseShow = true;
            var command = editor.addCommand(pluginName, execCmd);
            editor.ui.addButton && editor.ui.addButton('Revise', {
                label: editor.lang.revise.toolbar,
                command: pluginName,
                toolbar: 'document',
                group: 'hm',
            });
        }
    });
})();

function updateIcon(editor, className) {
    var reviseState = editor.reviseModelOpened ? '显示修订': '隐藏修订';
    var icon = CKEDITOR.plugins.get('revise').path + 'icons/'+ reviseIconConfig[reviseState]['img'];
    $('.'+className).attr('title',reviseIconConfig[reviseState]['title']);
    $('.'+className+' .cke_button__revise_icon')[0].setAttribute('style','background:url('+icon+') no-repeat 0 0 / cover !important;');
}
