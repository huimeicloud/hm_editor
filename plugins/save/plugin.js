/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Save plugin.
 */

(function () {
    var saveCmd = {
        exec: function (editor, cmdData) {
            if (window.WinDocModelObj) {
                window.WinDocModelObj.cleanMark(window.WinDocModelObj.currQcEmrId);
                // window.WinDocModelObj.initWarnInfo(window.WinDocModelObj.currQcEmrId);
                // return;
            }
            cmdData = cmdData || {};
            // 给事件溯源套娃
            if (cmdData.name && !cmdData.data) {
                cmdData.data = {
                    name: cmdData.name
                };
            }
            cmdData.name = '保存病历';

            if (!cmdData['from']) {
                cmdData['from'] = '工具栏保存';
            } 
            cmdData = cmdData || {};
            cmdData['removePage'] = function () {
                // 如果有分页的话先去掉分页符
                editor.document.$.body = CKEDITOR.plugins.pagebreakCmd.removeAllSplitters(editor);
            }
            cmdData['recovePage'] = function () {
                // 恢复分页
                if (CKEDITOR.plugins.pagebreakCmd) {
                    console.log('save completed, perform auto paging');
                    CKEDITOR.plugins.pagebreakCmd.currentOperations.saveCompleted = true;
                    CKEDITOR.plugins.pagebreakCmd.performAutoPaging(editor, {
                        name: 'saveCompleted',
                        data: cmdData
                    }); // 保存完成
                }
            } 
            editor.commands["save"].disable();
            setTimeout(function () {
                editor.commands["save"].enable();
            }, 2000);
            editor.fire('toolbarCommandComplete', {
                command: 'save',
                type: '保存',
                data: cmdData
             })
        } 
    };

    var pluginName = 'save';

    // Register a plugin named "save".
    CKEDITOR.plugins.add(pluginName, {
        // jscs:disable maximumLineLength
        lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        icons: 'save', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        init: function (editor) {
            var command = editor.addCommand(pluginName, saveCmd);
            editor.ui.addButton && editor.ui.addButton('Save', {
                label: editor.lang.save.toolbar,
                command: pluginName,
                toolbar: 'document'
            });
        }
    });
})();