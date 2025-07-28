/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	config.language = 'zh-cn';
	// config.uiColor = '#AADC6E';
	// %REMOVE_START%
	config.plugins =
		'basicstyles,' +
		// 'clipboard,' +
		'colorbutton,' +
		'colordialog,' +
		'contextmenu,' +
		'enterkey,' +
		'entities,' +
		'floatingspace,' +
		'font,' +
		'horizontalrule,' +
		'htmlwriter,' +
		'justify,' +
		'pastefromword,' +
		'pastetext,' +
		'removeformat,' +
		'specialchar,' +
		'table,' +
		'tableselection,' +
		'tabletools,' +
		'toolbar,' +
		'undo,' +
		'image,' +
		'image2,' +
		'widget,' +
		'wysiwygarea,'+
		'list,'+
		'liststyle,'+
		'indent,'+
		'indentblock,'+
		'indentlist,'+
		'sourcearea';

	// %REMOVE_END%

	// config.extraPlugins = 'tableresize,paper,pagebreak,datasource,sync,print,favor,document,save,trace,album,clear,revise,signature,switchmodel,pagebreakByHand,find';
	config.extraPlugins = 'tableresize,paper,pagebreak,datasource,document,print,save,album,clear,revise,switchmodel,pagebreakByHand,find';


	config.toolbar = [
		{ name: 'document', items: [ 'Save', '-', 'Print','PagebreakByHand','-','Sync','Paper','Datasource','Document','-','Revise','-','Album','Image'] },
		{ name: 'clipboard', items: [  'Copy',  '-', 'Undo', 'Redo' ] },
		{ name: 'indent', items: ['Outdent', 'Indent']},
		{ name: 'paragraph', items: [ 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
		{ name: 'list', items: [ 'NumberedList', 'BulletedList']},
		{ name: 'insert', items: [ 'Table', 'HorizontalRule', 'SpecialChar' ] },
		{ name: 'styles', items: ['Containerstyle', 'Font', 'FontSize' ] },
		{ name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-',  'RemoveFormat' ] },
        { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
		{ name: 'clear', items: ['Clear'] },
		{ name: 'pagebreak', items: ['PageBreak'] },
		{ name: 'switchmodel', items: ['SwitchModel'] },
		{name:'find',items: ['Find','Replace']}

	];

	//config.extraAllowedContent='div(emr*,_*){height,position,left,top}[data-hm-*];table(_*,widget*)[data-hm-*,_*]{display,font-*,letter-*};tbody[data-hm-*]{line-*};th[data-hm-*]{color};td(_*)[data-hm-*,_*]{font-*,color};tr[data-hm-*,_*];span(page,topage,icon*,_*,textboxWidget*){font-*,text-*,width,display,background*,top,left,bottom,right,position}[_*];img[src]{width,height};p(_*){font-*};ins(hm*)[data*];del(hm*)[data*];hr{border*}';

	config.allowedContent = true;//容许一切标签属性

	//config.height = '800px';


	// config.contentsCss = ['vendor/font-awesome.min.css','http://172.16.3.51:3052/hmsdk/hm-sdk.min.css','contents.css'];
    config.contentsCss = ['vendor/font-awesome.min.css','vendor/hm-sdk.min.css','css/docAi.min.css','css/document.min.css','contents.css'];

	config.keystrokes = [
		[CKEDITOR.CTRL + 83, 'save'],
		// 打印前还需要处理一些东西, 故不直接打印
		[CKEDITOR.CTRL + 80, 'keyboard-print'],
		// 打印前还需要处理一些东西, 故不直接打印
		[CKEDITOR.CTRL + CKEDITOR.SHIFT + 80, 'keyboard-continued-print']
	];

	//工具栏是否可以被收缩
	config.toolbarCanCollapse = true;
	//工具栏的位置
	config.toolbarLocation = 'top';//可选：bottom
	//工具栏默认是否展开
	config.toolbarStartupExpanded = true;
};

// %LEAVE_UNMINIFIED% %REMOVE_LINE%
