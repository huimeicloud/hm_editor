/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.plugins.add( 'album', {
	requires: 'dialog',
	icons: 'album', // %REMOVE_LINE_CORE%
	hidpi: false, // %REMOVE_LINE_CORE%
	init: function( editor ) {
		var command = editor.addCommand( 'album', new CKEDITOR.dialogCommand( 'album' ) );
		command.modes = { wysiwyg: 1, source: 1 };
		command.canUndo = false;
		command.readOnly = 0;

		editor.ui.addButton && editor.ui.addButton( 'Album', {
			label: '插入人体示意图',
			command: 'album',
			toolbar: 'document'
		} );

		CKEDITOR.dialog.add('album', this.path + 'dialogs/body-map.js');
	}
} );
