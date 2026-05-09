/**
 * @license Copyright (c) 2024, HM Editor - Document Tree Plugin. All rights reserved.
 */

CKEDITOR.plugins.add('documenttree', {
	requires: 'dialog',
	lang: 'zh-cn',
	icons: 'documenttree',
	init: function(editor) {
		// 添加文档树命令
		var documentTreeCommand = editor.addCommand('documenttree', new CKEDITOR.dialogCommand('documenttree'));
		documentTreeCommand.canUndo = false;
		documentTreeCommand.readOnly = 1;

		// 添加工具栏按钮
		if (editor.ui.addButton) {
			editor.ui.addButton('DocumentTree', {
				label: editor.lang.documenttree.title,
				command: 'documenttree',
				toolbar: 'tools,20'
			});
		}

		// 注册对话框
		CKEDITOR.dialog.add('documenttree', this.path + 'dialogs/documenttree.js');
	}
});
