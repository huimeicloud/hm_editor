/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Save plugin.
 */

(function () {
    CKEDITOR.plugins.switchmodelCmd = {
        currentModel: ''
    };
    var pluginName = 'switchmodel';
    CKEDITOR.plugins.add(pluginName, {
        lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        requires: 'richcombo',
        init: function (editor) {

            if (editor.blockless)
                return;

            var config = editor.config;
            var that = this;
            editor.on('switchModel', function (evt) {
                CKEDITOR.plugins.switchmodelCmd.currentModel = evt.data.currentModel;
                var $body = $(editor.document.getBody().$);
                if (CKEDITOR.plugins.switchmodelCmd.currentModel == '表单模式') {
                    // 表单模式 除了数据元其他内容禁用编辑
                    if ($body.find('.switchModel').length == 0) {
                        $body.html("<div contenteditable='false' class='switchModel'>" + $body.html() + "</div>");
                        $body.find('.emrWidget-content').attr('contenteditable', 'false');
                    }
                } else {
                    if ($body.find('.switchModel').length > 0) {
                        $body.html($body.find('.switchModel').html());
                    }
                    // 编辑模式 其他内容也可以编辑
                    $body.find('.emrWidget-content').attr('contenteditable', 'true');
                }
            });
            editor.ui.addRichCombo('SwitchModel', {
                label: '模式',
                title: '模式',
                toolbar: 'styles,20',

                panel: {
                    css: [CKEDITOR.skin.getPath('editor')].concat(config.contentsCss),
                    multiSelect: false,
                    attributes: { 'aria-label': '模式' }
                },

                init: function () {
                    this.startGroup('模式');
                    this.add('表单模式', '表单模式');
                    this.add('编辑模式', '编辑模式');
                },

                onClick: function (value) {
                    // editor.focus();
                    // editor.fire( 'saveSnapshot' );

                    this.setValue(value);
                    editor.fire('switchModel', { 'currentModel': value });

                    // editor.fire( 'saveSnapshot' );
                },

                onRender: function () {
                    editor.on('selectionChange', function (ev) {
                        this.setValue(CKEDITOR.plugins.switchmodelCmd.currentModel);
                    }, this);
                },

                onOpen: function () {
                    this._.panel.element.addClass('style_panel');
                }
            });
        }
    });

})();