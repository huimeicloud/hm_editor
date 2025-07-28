/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/* exported CKBUILDER_CONFIG */

var CKBUILDER_CONFIG = {
	skin: 'moono-lisa',
	ignore: [
		'bender.js',
		'bender.ci.js',
		'.bender',
		'bender-err.log',
		'bender-out.log',
		'.travis.yml',
		'dev',
		'docs',
		'.DS_Store',
		'.editorconfig',
		'.gitignore',
		'.gitattributes',
		'gruntfile.js',
		'.idea',
		'.jscsrc',
		'.jshintignore',
		'.jshintrc',
		'less',
		'.mailmap',
		'node_modules',
		'README.md',
		'tests',
		'index.js',
		'Dockerfile',
		'download',
		'editorDist',
		'hmEditor',
		'src',
		'.cursor',
		'.vscode',
		'docker',
		'tmp'

	],
	plugins: {
		basicstyles: 1,
		clipboard: 1,
		colorbutton: 1,
		colordialog: 1,
		// copyformatting: 1,
		contextmenu: 1,
		enterkey: 1,
		entities: 1,
		floatingspace: 1,
		font: 1,
		horizontalrule: 1,
		htmlwriter: 1,
		image: 1,
		image2:1,
		justify: 1,
		pastefromword: 1,
		pastetext: 1,
		removeformat: 1,
		specialchar: 1,
		table: 1,
		tableselection: 1,
		tabletools: 1,
		toolbar: 1,
		undo: 1,
		widget:1,
		wysiwygarea: 1,
		list: 1,
		liststyle: 1,
		indent: 1,
		indentblock: 1,
		indentlist: 1
	}
};
