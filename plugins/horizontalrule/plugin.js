/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Horizontal Rule plugin.
 */

(function () {
    var horizontalruleCmd = {
        canUndo: false, // The undo snapshot will be handled by 'insertElement'.
        exec: function (editor, hrStyle) {
            var hr = editor.document.createElement('hr');
            hr.setStyles(hrStyle);
            editor.insertElement(hr);
        },

        allowedContent: 'hr',
        requiredContent: 'hr'
    };

    var pluginName = 'horizontalrule';

    // Register a plugin named "horizontalrule".
    CKEDITOR.plugins.add(pluginName, {
        // jscs:disable maximumLineLength
        lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        icons: 'horizontalrule', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        init: function (editor) {
            if (editor.blockless)
                return;

            editor.addCommand(pluginName, horizontalruleCmd);

            var items = {};
            items['水平线细'] = {
                label: '细线',
                icon: '/emr-editor/vendor/images/line/regular_line.png',
                group: pluginName,
                onClick: function () {
                    editor.execCommand(pluginName, {border: 0, 'border-top': '1px solid #000'});
                }
            };
            items['水平线中'] = {
                label: '中线',
                icon: '/emr-editor/vendor/images/line/medium_line.png',
                group: pluginName,
                onClick: function () {
                    editor.execCommand(pluginName, {border: 0, 'border-top': '2px solid #000'});
                }
            };
            items['水平线粗'] = {
                icon: '/emr-editor/vendor/images/line/semibold_line.png',
                label: '粗线',
                group: pluginName,
                onClick: function () {
                    editor.execCommand(pluginName, {border: 0, 'border-top': '3px solid #000'});
                }
            };
            items['虚线'] = {
                label: '虚线',
                icon: '/emr-editor/vendor/images/line/dotted_line.png',
                group: pluginName,
                onClick: function () {
                    editor.execCommand(pluginName, {border: 0, 'border-top': '1px dashed #000'});
                }
            };
            items['点画线'] = {
                label: '点画线',
                icon: '/emr-editor/vendor/images/line/dot_line.png',
                group: pluginName,
                onClick: function () {
                    editor.execCommand(pluginName, {border: 0, 'border-top': '1px dotted #000'});
                }
            };

            editor.ui.add('HorizontalRule', CKEDITOR.UI_MENUBUTTON, {
                //editor.ui.addButton && editor.ui.addButton('HorizontalRule', {
                label: editor.lang.horizontalrule.toolbar,
                command: pluginName,
                toolbar: 'insert,40',
                onMenu: function () {
                    var activeItems = {};
                    for (var prop in items)
                        activeItems[prop] = CKEDITOR.TRISTATE_OFF;
                    return activeItems;
                }
            });

            editor.addMenuGroup(pluginName);
            editor.addMenuItems(items);
        }
    });
})();
