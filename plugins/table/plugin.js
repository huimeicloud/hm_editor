/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.plugins.add( 'table', {
	requires: 'dialog',
	// jscs:disable maximumLineLength
	lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
	// jscs:enable maximumLineLength
	icons: 'table', // %REMOVE_LINE_CORE%
	hidpi: true, // %REMOVE_LINE_CORE%
	init: function( editor ) {
		if ( editor.blockless )
			return;

		var lang = editor.lang.table;

		editor.addCommand( 'table', new CKEDITOR.dialogCommand( 'table', {
			context: 'table',
			allowedContent: 'table{width,height,white-space}[align,border,cellpadding,cellspacing,summary](solid-border,dashed-border);' +
				'caption tbody thead tfoot;' +
				'th td tr[scope];' +
				( editor.plugins.dialogadvtab ? 'table' + editor.plugins.dialogadvtab.allowedContent() : '' ),
			requiredContent: 'table',
			contentTransformations: [
				[ 'table{width}: sizeToStyle', 'table[width]: sizeToAttribute' ],
				[ 'td: splitBorderShorthand' ],
				[ {
					element: 'table',
					right: function( element ) {
						if ( element.styles ) {
							if ( element.styles.border && element.styles.border.match( /solid/ ) ) {
								element.attributes.border = 1;
							}
							if ( element.styles[ 'border-collapse' ] == 'collapse' ) {
								element.attributes.cellspacing = 0;
							}
						}
					}
				} ]
			]
		} ) );

		function createDef( def ) {
			return CKEDITOR.tools.extend( def || {}, {
				contextSensitive: 1,
				refresh: function( editor, path ) {
					this.setState( path.contains( 'table', 1 ) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );
				}
			} );
		}

		editor.addCommand( 'tableProperties', new CKEDITOR.dialogCommand( 'tableProperties', createDef() ) );
		editor.addCommand( 'tableLine', new CKEDITOR.dialogCommand( 'tableLine', createDef() ) );
		editor.addCommand( 'tableDelete', createDef( {
			exec: function( editor ) {
				var path = editor.elementPath(),
					table = path.contains( 'table', 1 );

				if ( !table )
					return;

				// If the table's parent has only one child remove it as well (unless it's a table cell, or the editable element) (http://dev.ckeditor.com/ticket/5416, http://dev.ckeditor.com/ticket/6289, http://dev.ckeditor.com/ticket/12110)
				var parent = table.getParent(),
					editable = editor.editable();

				if ( parent.getChildCount() == 1 && !parent.is( 'td', 'th' ) && !parent.equals( editable ) )
					table = parent;

				var range = editor.createRange();
				range.moveToPosition( table, CKEDITOR.POSITION_BEFORE_START );
				editor.fire('group-table-op',{type:'delete',table:table.$});
				table.remove();
				range.select();
			}
		} ) );
		editor.addCommand('removeLine', createDef({
			exec: function (editor) {
				var path = editor.elementPath(),
					svg = path.contains('svg', 1);
				if (!svg)
					return;
				var isCustom = svg.getAttribute('customline');
				if(isCustom){
					svg.getParent().setHtml("<br/>");
				}

			}
		}));

		editor.ui.addButton && editor.ui.addButton( 'Table', {
			label: lang.toolbar,
			command: 'table',
			toolbar: 'insert,30'
		} );

		CKEDITOR.dialog.add( 'table', this.path + 'dialogs/table.js' );
		CKEDITOR.dialog.add( 'tableProperties', this.path + 'dialogs/table.js' );
		CKEDITOR.dialog.add( 'tableLine', this.path + 'dialogs/tableline.js' );

		// If the "menu" plugin is loaded, register the menu items.
		if ( editor.addMenuItems ) {
			editor.addMenuItems( {
				table: {
					label: lang.menu,
					command: 'tableProperties',
					group: 'table',
					order: 5
				},

				tabledelete: {
					label: lang.deleteTable,
					command: 'tableDelete',
					group: 'table',
					order: 1
				},

				tableline:{
					label: lang.drawLine,
					command: 'tableLine',
					group: 'table',
					order: 6
				},
				romoveline:{
					label: lang.removeLine,
					command: 'removeLine',
					group: 'table',
					order: 7
				}
			} );
		}

		editor.on( 'doubleclick', function( evt ) {
			var element = evt.data.element;

			if ( element.is( 'table' ) )
				evt.data.dialog = 'tableProperties';
		} );

		editor.on( 'paste', function( evt ) {
			var orginText = evt.data.dataTransfer.getData('text/html') ;
			if( orginText.indexOf('data-hm-table') >= 0 && editor.HMConfig.designMode){
				evt.data.dataValue =  orginText;
			}
		},null,null,31);

		editor.on('contentDom', function () {
			var editable = editor.editable();
			editable.attachListener(editable, 'mouseenter', function () {
				if (!editor.HMConfig.designMode) {
					var elements = editor.document.find("[_emrstyle*='_if(disable)']");
					for (var i = 0; i < elements.count(); i++) {
						elements.getItem(i).setAttribute("contenteditable", false);
					}
				}
			});
		});

		// If the "contextmenu" plugin is loaded, register the listeners.
		if ( editor.contextMenu ) {
			editor.contextMenu.addListener( function( element, selection, path ) {
				// menu item state is resolved on commands.
				if (editor.HMConfig.designMode) {
					var obj = {
						tabledelete: CKEDITOR.TRISTATE_OFF,
						table: CKEDITOR.TRISTATE_OFF,
					}
					var td = path.contains({ 'td': 1 }, 1);
					var svg = path.contains({ 'svg': 1 }, 1);
					if (td && !td.isReadOnly()) {
						obj.tableline = CKEDITOR.TRISTATE_OFF;
					}
					if (svg && !svg.isReadOnly()) {
						obj.romoveline = CKEDITOR.TRISTATE_OFF;
					}
					return obj;
				}
				return {};
			} );
		}
		editor.on("group-table-op", function (d) {

			var rootClass = 'group-table-all',parentClass = 'group-table',attrName = 'group-table-name',btnClass='group-table-btn',uniqueAttr = 'unique-id';


			var data = d.data;

			var del = function (table) {
			  var $table = $(table);
			  if ($table.attr(attrName)) {
				var p1 = $table.parent()[0];
				var pr = null;
				if (p1 && $(p1).hasClass(parentClass)) {
				  pr = $(p1).parent()[0];
				  $(p1).remove();
				}
				if (
				  pr &&
				  $(pr).hasClass(rootClass) &&
				  $(pr).find('.'+parentClass).length == 0
				) {
				  $(pr).remove();
				}
			  }
			  $table.remove();
			};
			var _wrap = function(table,name){
				var $table = $(table);
				$table.attr(attrName,name);
				var p = $table.parent()[0];
				if(!p || !($(p).hasClass(parentClass))){
					_wrapTable(table);
					$($table.parent()[0]).wrap($('<div class="'+rootClass+'"></div>'));
				}
				$table.parents('.'+rootClass).attr(attrName,name);
				resize(table);
			}
			var _wrapTable = function(table){
				var uid = wrapperUtils.getGUID();
				$table = $(table);
				$table.attr(uniqueAttr,uid);
				$table.wrap($('<div class="'+parentClass+'"  '+uniqueAttr+'="'+uid+'"></div>'));
				$($table.parent()[0]).append('<span class="'+btnClass+'" type="delete" contenteditable="false" '+uniqueAttr+'="'+uid+'">-</span><span class="'+btnClass+'" type="add" contenteditable="false" '+uniqueAttr+'="'+uid+'">+</span>');
			}
			var _unwrap = function(table){
				var $table = $(table);
				$table.removeAttr(attrName);
				var p = $table.parent()[0];
				if(p && $(p).hasClass(parentClass)){
					$(p).find('.'+btnClass).remove();
					$table.unwrap();
					p = $table.parent()[0];
					if(p && $(p).hasClass(rootClass)){
						$table.unwrap();
					}
				}

			}
			var wrap = function(table,groupName){
				if(groupName){
					_wrap(table,groupName);
				}else{
					_unwrap(table);
				}
			}
			var add = function(table){
				$copyTable = $(table).clone(true);
				clearData($copyTable[0]);
				_wrapTable($copyTable[0]);
				$($(table).parent()[0]).after($($copyTable.parent()[0]));

			}

			var findTable = function(table){
				var uid = table.getAttribute(uniqueAttr);
				if(uid){
					var findTrueTable = $(editor.document.getBody().$).find('table['+uniqueAttr+'='+uid+']')[0];
					if(findTrueTable){
						table = findTrueTable;
					}
				}
				return table;
			}
			var clearData = function(table){
				resetAllDataSource($(table));
			}
			var getData = function(table,globalData){

			}
			var rander = function(data){
				var $body = data.body;
				var sourceObj = data.data || [];
				var names = Object.keys(sourceObj);

				for(var ni =0;ni<names.length;ni++){
					var name = names[ni];
					var ge = $body.find('.'+rootClass+'['+attrName+'='+name+']')[0];
					if(!ge){
						continue;
					}
					var tableFirst = $(ge).find('.'+parentClass)[0];
					if(!tableFirst){
						continue;
					}
					$(ge).empty();

					var tableDataArr = sourceObj[name]['值'] || [];
					var l = tableDataArr.length;
					if(l == 0){
						$(ge).append($(tableFirst));
						continue;
					}

					for(var i=0;i<l;i++){
						var oneData = tableDataArr[i];
						var $oneTable = $(tableFirst).clone(true);
						$(ge).append(randerEmrRecord($oneTable,oneData,true));
					}
				}
			}
			var resize = function(table){
				var p1 = $(table).parent()[0];
				if(p1 && $(p1).hasClass(parentClass)){
					p1 = $(p1).parent()[0];
					if(p1 && $(p1).hasClass(rootClass)){
						$(p1).css('width',$(table).css('width'));
					}

				}
			}
			var removePage = function(){
				editor.document.$.body = CKEDITOR.plugins.pagebreakCmd.removeAllSplitters(editor);
			}
			var recoverPage = function(){
				if(CKEDITOR.plugins.pagebreakCmd) {
					CKEDITOR.plugins.pagebreakCmd.currentOperations.saveCompleted = true;
					CKEDITOR.plugins.pagebreakCmd.performAutoPaging(editor, {name: 'addGrouptable', data: {}}); // 保存完成
				}
			}
			if (data.type == "delete") {
				var documentElement = editor.document.$.documentElement;
                scrollTop = documentElement && documentElement.scrollTop; // 滚动位置
                scrollLeft = documentElement && documentElement.scrollLeft; // 滚动位置
                removePage();
                // 删除
                del(findTable(data.table));
                recoverPage();
                setTimeout(function () {
                   editor.document.$.defaultView.scrollTo(scrollLeft, scrollTop);
                }, 300);
			}
			if (data.type == "wrap") {
				removePage();
				// 表格切换分组
				wrap(findTable(data.table),data.name);
				recoverPage();
			}
			if (data.type == "resize") {
				// 重置分组表格
				resize(data.table);
			}
			if(data.type == 'add'){
				removePage();
				// 添加表格
				add(findTable(data.table));
				recoverPage();
			}
			if(data.type == 'rander'){
				rander(data);
			}

		  });

	}
} );

function resetDataSource($body,filterNameFun){
	var allDs = getDataSourceList($body);
	var resetDs = [];
	for(var i=0;i<allDs.length;i++){
		var name = $(allDs[i]).attr('data-hm-name') || '';
		if(!name){
			continue;
		}
		if(!filterNameFun || filterNameFun(name)){
			resetDs.push(allDs[i]);
		}
	}
	clearDSVal(resetDs);
}
function resetAllDataSource($body){
	resetDataSource($body,null);
}
function getDataSourceValues($body){
	var datasources = getDataSourceList();
    return getSourceObject(datasources, $body, '', '');
}
function randerDataSourceValue($body,data){
	var allDs = getDataSourceList($body);
	for(var i=0;i<allDs.length;i++){
		var name = $(allDs[i].attr('data-hm-name')) || '';
		setDSVal(allDs[i],data[name] || '','全量同步');
	}
}
function getDataSourceList($body){
	return $body.find('[data-hm-name]:not([data-hm-node="labelbox"])');
}
