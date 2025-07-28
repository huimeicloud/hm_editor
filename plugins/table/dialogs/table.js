/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	var defaultToPixel = CKEDITOR.tools.cssLength;

	var commitValue = function( data ) {
			var id = this.id;
			if ( !data.info )
				data.info = {};
			data.info[ id ] = this.getValue();
		};

	function tableColumns( table ) {
		var cols = 0,
			maxCols = 0;
		for ( var i = 0, row, rows = table.$.rows.length; i < rows; i++ ) {
			row = table.$.rows[ i ], cols = 0;
			for ( var j = 0, cell, cells = row.cells.length; j < cells; j++ ) {
				cell = row.cells[ j ];
				cols += cell.colSpan;
			}

			cols > maxCols && ( maxCols = cols );
		}

		return maxCols;
	}


	// Whole-positive-integer validator.
	function validatorNum( msg ) {
		return function() {
			var value = this.getValue(),
				pass = !!( CKEDITOR.dialog.validate.integer()( value ) && value > 0 );

			if ( !pass ) {
				alert( msg ); // jshint ignore:line
				this.select();
			}

			return pass;
		};
	}

	function tableDialog( editor, command ) {
		//var groupOptions = [['',''],['aaaaaac','aaaaaaan']];
		var makeElement = function( name ) {
				return new CKEDITOR.dom.element( name, editor.document );
			};

		var editable = editor.editable();

		var dialogadvtab = editor.plugins.dialogadvtab;

		return {
			title: editor.lang.table.title,
			minWidth: 310,
			minHeight: CKEDITOR.env.ie ? 310 : 280,

			onLoad: function() {
				var dialog = this;

				var styles = dialog.getContentElement( 'advanced', 'advStyles' );

				if ( styles ) {
					styles.on( 'change', function() {
						// Synchronize width value.
						var width = this.getStyle( 'width', '' ),
							txtWidth = dialog.getContentElement( 'info', 'txtWidth' );

						txtWidth && txtWidth.setValue( width, true );

						// Synchronize height value.
						var height = this.getStyle( 'height', '' ),
							txtHeight = dialog.getContentElement( 'info', 'txtHeight' );

						txtHeight && txtHeight.setValue( height, true );
					} );
				}

				editor.on('setCopyTableHeader',function(evt){
					if(evt.data.value){
						evt.data.table.setAttribute('_hm_copy_table_header', evt.data.value);
					}else {
						evt.data.table.removeAttribute('_hm_copy_table_header');
					}
				});
			},

			onShow: function() {
				// Detect if there's a selected table.
				var selection = editor.getSelection(),
					ranges = selection.getRanges(),
					table;

				var rowsInput = this.getContentElement( 'info', 'txtRows' ),
					colsInput = this.getContentElement( 'info', 'txtCols' ),
					widthInput = this.getContentElement( 'info', 'txtWidth' ),
					heightInput = this.getContentElement( 'info', 'txtHeight' );

				if ( command == 'tableProperties' ) {
					var selected = selection.getSelectedElement();
					if ( selected && selected.is( 'table' ) )
						table = selected;
					else if ( ranges.length > 0 ) {
						// Webkit could report the following range on cell selection (http://dev.ckeditor.com/ticket/4948):
						// <table><tr><td>[&nbsp;</td></tr></table>]
						if ( CKEDITOR.env.webkit )
							ranges[ 0 ].shrink( CKEDITOR.NODE_ELEMENT );

						table = editor.elementPath( ranges[ 0 ].getCommonAncestor( true ) ).contains( 'table', 1 );
					}

					// Save a reference to the selected table, and push a new set of default values.
					this._.selectedElement = table;
				}

				// Enable or disable the row, cols, width fields.
				if ( table ) {
					this.setupContent( table );
					rowsInput && rowsInput.disable();
					colsInput && colsInput.disable();
				} else {
					rowsInput && rowsInput.enable();
					colsInput && colsInput.enable();
				}

				// Call the onChange method for the widht and height fields so
				// they get reflected into the Advanced tab.
				widthInput && widthInput.onChange();
				heightInput && heightInput.onChange();
			},
			onOk: function() {
				var selection = editor.getSelection(),
					bms = this._.selectedElement && selection.createBookmarks();

				var table = this._.selectedElement || makeElement( 'table' ),
					data = {};

				this.commitContent( data, table );

				var row;
				if ( data.info ) {
					var info = data.info;

					// Generate the rows and cols.
					if ( !this._.selectedElement ) {
						var tbody = table.append( makeElement( 'tbody' ) ),
							rows = parseInt( info.txtRows, 10 ) || 0,
							cols = parseInt( info.txtCols, 10 ) || 0;

						for ( var i = 0; i < rows; i++ ) {
							row = tbody.append(makeElement('tr'));
							for ( var j = 0; j < cols; j++ ) {
								var cell = row.append( makeElement( 'td' ) );
								cell.appendBogus();
							}
						}
					}

					// Modify the table headers. Depends on having rows and cols generated
					// correctly so it can't be done in commit functions.
					var headers = info.dataHeaders;
					if( headers == '' || ( headers != '' && parseInt(headers) + 1 <=  table.$.rows.length) ){
						var $table = $(table.$);
						var $tbody = $table.find('tbody');
						var $thead = $table.find('thead');
						$tbody.prepend( $thead.children() );
						$thead.remove();


						if ( headers != ''  ) {
							var $trs = $table.find('tbody').children();
							var $newHeader = $('<thead></thead>');
							for(var h = 0 ; h < headers; h ++){
								$newHeader.append( $trs[h] );
							}
							$table.prepend( $newHeader );

							$table.find('thead td').each(function(){
								$(this).replaceWith( $(this).prop('outerHTML').replace(/td/g,'th') )
							});
						}
					}




					// Should we make all first cells in a row TH?
					if ( !this.hasColumnHeaders && ( headers == 'col' || headers == 'both' ) ) {
						for ( row = 0; row < table.$.rows.length; row++ ) {
							newCell = new CKEDITOR.dom.element( table.$.rows[ row ].cells[ 0 ] );
							newCell.renameNode( 'th' );
							newCell.setAttribute( 'scope', 'row' );
						}
					}

					// Should we make all first TH-cells in a row make TD? If 'yes' we do it the other way round :-)
					if ( ( this.hasColumnHeaders ) && !( headers == 'col' || headers == 'both' ) ) {
						for ( i = 0; i < table.$.rows.length; i++ ) {
							row = new CKEDITOR.dom.element( table.$.rows[ i ] );
							if ( row.getParent().getName() == 'tbody' ) {
								newCell = new CKEDITOR.dom.element( row.$.cells[ 0 ] );
								newCell.renameNode( 'td' );
								newCell.removeAttribute( 'scope' );
							}
						}
					}

					// Set the width and height.
					info.txtHeight ? table.setStyle( 'height', info.txtHeight ) : table.removeStyle( 'height' );
					info.txtWidth ? table.setStyle( 'width', info.txtWidth ) : table.removeStyle( 'width' );

					if ( !table.getAttribute( 'style' ) )
						table.removeAttribute( 'style' );
				}

				// Insert the table element if we're creating one.
				if ( !this._.selectedElement ) {
					table.setAttribute('data-hm-table','true');
					// 表格ID, 用于被分页之后识别表格
					table.setAttribute('hm-table-id',CKEDITOR.tools.getUniqueId());
					//表格设置单行溢出截断的，表格设置为非自适应
					if (table.hasClass('table3')) {
						table.setStyle('table-layout', 'fixed');
					} else {
						table.setStyle( 'table-layout', 'auto');
					}
					editor.insertElement( table );

					// 表格格子宽度 - colgroup
					var colWidth = 100 / cols + '%';
					var colgroup = makeElement('colgroup');
					for (j = 0; j < cols; j++) {
						var col = makeElement('col');
						col.setStyle('width', colWidth);
						colgroup.$.appendChild(col.$);
					}
					colgroup.insertBefore(table.getFirst());

					// (wk 打印时) ie 不认 colgroup, 故在加 colgroup 的同时把表格宽度也加进来
					for (i = 0; i < rows; i++) {
						row = tbody.$.rows[i];
						for (j = 0; j < cols; j++) {
							row.cells[j].style.width = colWidth;
						}
					}

					// Override the default cursor position after insertElement to place
					// cursor inside the first cell (http://dev.ckeditor.com/ticket/7959), IE needs a while.
					setTimeout( function() {
						var firstCell = new CKEDITOR.dom.element( table.$.rows[ 0 ].cells[ 0 ] );
						var range = editor.createRange();
						range.moveToPosition( firstCell, CKEDITOR.POSITION_AFTER_START );
						range.select();
					}, 0 );
				}
				// Properly restore the selection, (http://dev.ckeditor.com/ticket/4822) but don't break
				// because of this, e.g. updated table caption.
				else {
					try {
						selection.selectBookmarks( bms );
					} catch ( er ) {
					}
				}
				editor.fire('group-table-op',{type:'wrap',table:table.$,name:data['group-table-name']});
			},
			contents: [ {
				id: 'info',
				label: editor.lang.table.title,
				elements: [
					{
                        type: 'hbox',
                        children: [
                           {
								type: 'text',
								id: 'txtRows',
								'default': 3,
								label: editor.lang.table.rows,
								required: true,
								controlStyle: 'width:5em',
								validate: validatorNum( editor.lang.table.invalidRows ),
								setup: function( selectedElement ) {
									this.setValue( selectedElement.$.rows.length );
								},
								commit: commitValue
							},
							{
								type: 'text',
								id: 'txtCols',
								'default': 2,
								label: editor.lang.table.columns,
								required: true,
								controlStyle: 'width:5em',
								validate: validatorNum( editor.lang.table.invalidCols ),
								setup: function( selectedTable ) {
									this.setValue( tableColumns( selectedTable ) );
								},
								commit: commitValue
							}
                        ]
                    },
					{
                        type: 'hbox',
                        children: [
                            {
								id: 'cmbAlign',
								type: 'select',
								requiredContent: 'table[align]',
								'default': '',
								label: '表格位置',
								items: [
									[ editor.lang.common.notSet, '' ],
									[ editor.lang.common.alignLeft, 'left' ],
									[ editor.lang.common.alignCenter, 'center' ],
									[ editor.lang.common.alignRight, 'right' ]
								],
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute( 'align' ) || '' );
								},
								commit: function( data, selectedTable ) {
									if ( this.getValue() )
										selectedTable.setAttribute( 'align', this.getValue() );
									else
										selectedTable.removeAttribute( 'align' );
								}
							},
							{
								type: 'text',
								id: 'txtWidth',
								requiredContent: 'table{width}',
								controlStyle: 'width:5em',
								label: editor.lang.common.width,
								title: editor.lang.common.cssLengthTooltip,
								// Smarter default table width. (http://dev.ckeditor.com/ticket/9600)
								'default': '100%',
								getValue: defaultToPixel,
								validate: CKEDITOR.dialog.validate.cssLength( editor.lang.common.invalidCssLength.replace( '%1', editor.lang.common.width ) ),
								onChange: function() {
									var styles = this.getDialog().getContentElement( 'advanced', 'advStyles' );
									styles && styles.updateStyle( 'width', this.getValue() );
								},
								setup: function( selectedTable ) {
									var val = selectedTable.getStyle( 'width' );
									this.setValue( val );
								},
								commit: commitValue
							}
                        ]
                    },
                    {
                        type: 'hbox',
                        children: [
                        {
							type: 'select',
							id: 'dataHeaders',
							width: '100px',
							requiredContent: 'th',
							'default': '',
							label: '数据表单_标题行',
							items: [
								[ '无', '' ],
								[ '第一行', '1' ],
								[ '前两行', '2' ],
								[ '前三行', '3' ],
								[ '前四行', '4' ]
							],
							setup: function( selectedTable ) {
								// Fill in the headers field.
								var dialog = this.getDialog();

								var thCount = $(selectedTable.$).find('thead tr').length;

								this.setValue( thCount == 0 ? '' : thCount );
							},
							commit: commitValue
						},
						{
							id: 'table-cascade',
							type: 'text',
							width: '100px',
							requiredContent: 'table[align]',
							label: '级联(数据元_选项)',
							setup: function( selectedTable ) {
								this.setValue( selectedTable.getAttribute( '_cascade' ) || '' );
							},
							commit: function( data, selectedTable ) {
								if ( this.getValue() )
									selectedTable.setAttribute( '_cascade',this.getValue() );
								else
									selectedTable.removeAttribute( '_cascade');
							}
						}
                    	]
                	},
                    {
                        type: 'hbox',
                        children: [
                            {
                                id: 'table-dataTable',
                                type: 'text',
                                width: '100px',
                                requiredContent: 'table[align]',
                                label: '数据表单_名称',
                                setup: function( selectedTable ) {
                                    this.setValue( selectedTable.getAttribute( 'data-hm-dataTable' ) || '' );
                                },
                                commit: function( data, selectedTable ) {
                                    if ( this.getValue() ){
										selectedTable.setAttribute( 'data-hm-dataTable',this.getValue() );
									}else{
                                        selectedTable.removeAttribute( 'data-hm-dataTable');
									}
                                }
							},
							{
								id: 'white-space',
								type: 'select',
								requiredContent: 'table[align]',
								'default': '1',
								label: '单元格显示样式',
								items: [
									[ '可换行', '1' ],
									[ '单行显示', '2' ],
									[ '单行溢出截断...', '3' ],
									[ '单行溢出截断不显示', '4' ]
								],
								setup: function( selectedTable ) {
									if ( selectedTable.hasClass('table2') ){
										this.setValue('2');
									}else if(selectedTable.hasClass('table3') ){
										this.setValue('3');
									}else{
										this.setValue('1');
									}
								},
								commit: function( data, selectedTable ) {
									if ( this.getValue() == '2' ){
										selectedTable.appendHtml('<style>.table2 tr td{white-space:nowrap;}</style>');
										selectedTable.removeClass('table3');
										selectedTable.addClass('table2');
									}else if(this.getValue() == '3' ){
											selectedTable.appendHtml('<style>.table3 tr td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>');
										selectedTable.removeClass('table2');
										selectedTable.addClass('table3');
									}else if(this.getValue() == '4' ){
										selectedTable.appendHtml('<style>.table3 tr td{white-space:nowrap;overflow:hidden}</style>');
										selectedTable.removeClass('table2');
										selectedTable.addClass('table3');
									}
									else{
										selectedTable.removeClass('table2');
										selectedTable.removeClass('table3');
									}

								}
							}
						]
				},
				{
						type: 'hbox',
						children: [
							{
								id: 'evaluate-type',
								type: 'select',
								label: '评估单表格类型',
								items: [
									[ '', '' ],
									[ '竖向', 'col' ],
									[ '横向', 'row' ]
								],
								setup: function( selectedTable ) {
									var t = $(selectedTable).attr('evaluate-type') || '';
									this.setValue(t);

								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										$(selectedTable.$).attr('evaluate-type',this.getValue());
									}else{
										$(selectedTable.$).removeAttr('evaluate-type');
									}
								}
							},
						{
							id: 'evaluate-col-num',
							type: 'text',
							width: '100px',
							requiredContent: 'table[align]',
							label: '竖向评估单列数',
							setup: function( selectedTable ) {
								var defaultVal = '';
								if($(selectedTable.$).attr('evaluate-type') == 'col'){
									defaultVal = '7';
								}
								this.setValue( selectedTable.getAttribute( '_col_num' ) || defaultVal );
							},
							commit: function( data, selectedTable ) {
								if($(selectedTable.$).attr('evaluate-type') != 'col'){
									selectedTable.removeAttribute( '_col_num');
									return;
								}
								var num = this.getValue();
								try{
									num = parseInt(num);
								}catch(e){
									num = 7;
								}
								if(isNaN(num) || num < 1){
									num = 7;
								}
								selectedTable.setAttribute( '_col_num',num );
							}
						}
                    	]
                	},
                    {
                        type: 'hbox',
                        children: [
							{
								id: 'table-border',
								type: 'checkbox',
								requiredContent: 'table[align]',
								label: '显示边框',
								'default': true,
								setup: function( selectedTable ) {
									this.setValue( selectedTable.hasClass( 'solid-border' ) || '' );
								},
								commit: function( data, selectedTable ) {
									selectedTable.removeClass( 'solid-border' );
									selectedTable.removeClass( 'dashed-border' );
									if ( this.getValue() )
										selectedTable.addClass( 'solid-border' );
									else
										selectedTable.addClass( 'dashed-border' );
								}
							},
							{
								id: 'font-weight',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '文字加粗',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.hasClass( 'font-weight' ) || '' );
								},
								commit: function( data, selectedTable ) {
									selectedTable.removeClass( 'font-weight' );
									selectedTable.removeClass( 'font-normal' );
									if ( this.getValue() )
										selectedTable.addClass( 'font-weight' );
									else
										selectedTable.addClass( 'font-normal' );
								}
							},
							{
								id: 'hx-curve',
								type: 'checkbox',
								requiredContent: 'table[align]',
								label: '是否绘制呼吸曲线',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('data-hm-breathe'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('data-hm-breathe', this.getValue());
									}else {
										selectedTable.removeAttribute('data-hm-breathe');
									}
								}
							}
						]
                    },{
                        type: 'hbox',
                        children: [
							{
								id: 'txy-curve',
								type: 'checkbox',
								requiredContent: 'table[align]',
								label: '是否绘制胎心率曲线',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('data-hm-cardiacSound'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('data-hm-cardiacSound', this.getValue());
									}else {
										selectedTable.removeAttribute('data-hm-cardiacSound');
									}
								}
							}
                        ]
                    },{
                        type: 'hbox',
                        children: [
							{
								id: 'breakline_tr_merge',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '文本溢出隔间换行时,单元格是否行合并',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('breakline-tr-merge'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('breakline-tr-merge', this.getValue());
									}else {
										selectedTable.removeAttribute('breakline-tr-merge');
									}
								}
							}
                        ]
					},{
						type: 'hbox',
						children: [
							{
								id: 'breakInline',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '护理表单不分页',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('breakInline'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('breakInline', this.getValue());
									}else {
										selectedTable.removeAttribute('breakInline');
									}
								}
							}
						]
					},{
                        type: 'hbox',
                        children: [
							{
								id: 'pageBreakInside-tr-avoid',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '避免在表格行内插入分页符',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('pageBreakInside-tr-avoid'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('pageBreakInside-tr-avoid', this.getValue());
									}else {
										selectedTable.removeAttribute('pageBreakInside-tr-avoid');
									}
								}
							}
                        ]
					},{
                        type: 'hbox',
                        children: [
							{
								id: '_hm_copy_table_header',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '分页时是否复制表头',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('_hm_copy_table_header'));
								},
								commit: function( data, selectedTable ) {
									if ((selectedTable.getAttribute('_hm_copy_table_header')==null && this.getValue()) || (selectedTable.getAttribute('_hm_copy_table_header')=='true' && !this.getValue())) {
										editor.fire('setCopyTableHeader', {
											value: this.getValue(),
											table: selectedTable,
											_hm_copy_table_header: this.getValue()
										});
									}
								}
							}
                        ]
					},{
                        type: 'hbox',
                        children: [
							{
								id: '_hm_table_disable_drag',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '是否禁止表格拖拽',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('_hm_table_disable_drag'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('_hm_table_disable_drag', this.getValue());
									}else {
										selectedTable.removeAttribute('_hm_table_disable_drag');
									}
								}
							}
                        ]
					},{
                        type: 'hbox',
                        children: [
							{
								id: 'form_landscape',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '横向护理表单',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('form_landscape'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('form_landscape', this.getValue());
									}else {
										selectedTable.removeAttribute('form_landscape');
									}
								}
							}
                        ]
					},{
                        type: 'hbox',
                        children: [
							{
								id: 'is_nursing_form',
								type: 'checkbox',
								requiredContent: 'table[right]',
								label: '是否为护理表单',
								setup: function( selectedTable ) {
									this.setValue( selectedTable.getAttribute('is_nursing_form'));
								},
								commit: function( data, selectedTable ) {
									if(this.getValue()){
										selectedTable.setAttribute('is_nursing_form', this.getValue());
									}else {
										selectedTable.removeAttribute('is_nursing_form');
									}
								}
							}
                        ]
					}
				]
			} ]
		};
	}

	CKEDITOR.dialog.add( 'table', function( editor ) {
		return tableDialog( editor, 'table' );
	} );
	CKEDITOR.dialog.add( 'tableProperties', function( editor ) {
		return tableDialog( editor, 'tableProperties' );
	} );
} )();
