/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	'use strict';

	var fakeSelectedClass = 'cke_table-faked-selection',
		fakeSelectedTableClass = fakeSelectedClass + '-table',
		fakeSelectedEditorClass = fakeSelectedClass + '-editor',
		fakeSelection = { active: false },
		tabletools,
		getSelectedCells,
		getCellColIndex,
		insertRow,
		insertColumn;

	function getCellsBetween( first, last ) {
		var firstTable = first.getAscendant( 'table' ),
			lastTable = last.getAscendant( 'table' ),
			map = CKEDITOR.tools.buildTableMap( firstTable ),
			startRow = getRowIndex( first ),
			endRow = getRowIndex( last ),
			cells = [],
			markers = {},
			start,
			end,
			i,
			j,
			cell;

		function getRowIndex( rowOrCell ) {
			return rowOrCell.getAscendant( 'tr', true ).$.rowIndex;
		}

		// Support selection that began in outer's table, but ends in nested one.
		if ( firstTable.contains( lastTable ) ) {
			last = last.getAscendant( { td: 1, th: 1 } );
			endRow = getRowIndex( last );
		}

		// First fetch start and end offset.
		if ( startRow > endRow ) {
			i = startRow;
			startRow = endRow;
			endRow = i;

			i = first;
			first = last;
			last = i;
		}

		for ( i = 0; i < map[ startRow ].length; i++ ) {
			if ( first.$ === map[ startRow ][ i ] ) {
				start = i;
				break;
			}
		}

		for ( i = 0; i < map[ endRow ].length; i++ ) {
			if ( last.$ === map[ endRow ][ i ] ) {
				end = i;
				break;
			}
		}

		if ( start > end ) {
			i = start;
			start = end;
			end = i;
		}

		for ( i = startRow; i <= endRow; i++ ) {
			for ( j = start; j <= end; j++ ) {
				// Table maps treat cells with colspan/rowspan as a separate cells, e.g.
				// td[colspan=2] produces two adjacent cells in map. Therefore we mark
				// all cells to know which were already processed.
				cell = new CKEDITOR.dom.element( map[ i ][ j ] );

				if ( cell.$ && !cell.getCustomData( 'selected_cell' ) ) {
					cells.push( cell );
					CKEDITOR.dom.element.setMarker( markers, cell, 'selected_cell', true );
				}
			}
		}

		CKEDITOR.dom.element.clearAllMarkers( markers );

		return cells;
	}

	// Detects if the left mouse button was pressed:
	// * In all browsers and IE 9+ we use event.button property with standard compliant values.
	// * In IE 8- we use event.button with IE's proprietary values.
	function detectLeftMouseButton( evt ) {
		var domEvent = evt.data.$;

		if ( CKEDITOR.env.ie && CKEDITOR.env.version < 9 ) {
			return domEvent.button === 1;
		}

		return domEvent.button === 0;
	}

	function getFakeSelectedTable( editor ) {
		var selectedCell = editor.editable().findOne( '.' + fakeSelectedClass );

		return selectedCell && selectedCell.getAscendant( 'table' );
	}

	function clearFakeCellSelection( editor, reset ) {
		var selectedCells = editor.editable().find( '.' + fakeSelectedClass ),
			i;

		editor.fire( 'lockSnapshot' );

		editor.editable().removeClass( fakeSelectedEditorClass );

		for ( i = 0; i < selectedCells.count(); i++ ) {
			selectedCells.getItem( i ).removeClass( fakeSelectedClass );
		}

		if ( selectedCells.count() > 0 ) {
			selectedCells.getItem( 0 ).getAscendant( 'table' ).removeClass( fakeSelectedTableClass );
		}

		editor.fire( 'unlockSnapshot' );

		if ( reset ) {
			fakeSelection = { active: false };

			// Reset fake selection only if it's really a table one.
			// Otherwise we'll make widget selection unusable.
			if ( editor.getSelection().isInTable() ) {
				editor.getSelection().reset();
			}
		}
	}

	function fakeSelectCells( editor, cells ) {
		var ranges = [],
			range,
			i;

		for ( i = 0; i < cells.length; i++ ) {
			range = editor.createRange();

			range.setStartBefore( cells[ i ] );
			range.setEndAfter( cells[ i ] );

			ranges.push( range );
		}

		editor.getSelection().selectRanges( ranges );
	}

	function restoreFakeSelection( editor ) {
		var cells = editor.editable().find( '.' + fakeSelectedClass );

		if ( cells.count() < 1 ) {
			return;
		}

		cells = getCellsBetween( cells.getItem( 0 ), cells.getItem( cells.count() - 1 ) );

		fakeSelectCells( editor, cells );
	}

	function fakeSelectByMouse( editor, cellOrTable, evt ) {
		var selectedCells = getSelectedCells( editor.getSelection( true ) ),
			cell = !cellOrTable.is( 'table' ) ? cellOrTable : null,
			cells;

		// getSelectedCells treats cells with cursor in them as also selected.
		// We don't.
		function areCellsReallySelected( selection, selectedCells ) {
			var ranges = selection.getRanges();

			if ( selectedCells.length > 1 || ( ranges[ 0 ] && !ranges[ 0 ].collapsed ) ) {
				return true;
			}

			return false;
		}

		// Only start selecting when the fakeSelection.active is true (left mouse button is pressed)
		// and there are some cells selected or the click was done in the table cell.
		if ( fakeSelection.active && !fakeSelection.first &&
			( cell || areCellsReallySelected( editor.getSelection(), selectedCells ) ) ) {
			fakeSelection.first = cell || selectedCells[ 0 ];
			fakeSelection.dirty = cell ? false : ( selectedCells.length !== 1 );

			return;
		}

		if ( !fakeSelection.active ) {
			return;
		}

		// We should check if the newly selected cell is still inside the same table (http://dev.ckeditor.com/ticket/17052, #493).
		if ( cell && fakeSelection.first.getAscendant( 'table' ).equals( cell.getAscendant( 'table' ) ) ) {
			cells = getCellsBetween( fakeSelection.first, cell );

			// The selection is inside one cell, so we should allow native selection,
			// but only in case if no other cell between mousedown and mouseup
			// was selected.
			if ( !fakeSelection.dirty && cells.length === 1 ) {
				return clearFakeCellSelection( editor, evt.name === 'mouseup' );
			}

			fakeSelection.dirty = true;
			fakeSelection.last = cell;

			fakeSelectCells( editor, cells );
		}
	}

	function fakeSelectionChangeHandler( evt ) {
		var editor = evt.editor || evt.sender.editor,
			selection = editor && editor.getSelection(),
			ranges = selection && selection.getRanges() || [],
			cells,
			table,
			i;

		if ( !selection ) {
			return;
		}

		clearFakeCellSelection( editor );

		if ( !selection.isInTable() || !selection.isFake ) {
			return;
		}

		// In case of whole nested table selection, getSelectedCells returns also
		// cell which contains the table. We should filter it.
		if ( ranges.length === 1 && ranges[ 0 ]._getTableElement() &&
			ranges[ 0 ]._getTableElement().is( 'table' ) ) {
			table = ranges[ 0 ]._getTableElement();
		}

		cells = getSelectedCells( selection, table );

		editor.fire( 'lockSnapshot' );

		for ( i = 0; i < cells.length; i++ ) {
			cells[ i ].addClass( fakeSelectedClass );
		}

		if ( cells.length > 0 ) {
			editor.editable().addClass( fakeSelectedEditorClass );
			cells[ 0 ].getAscendant( 'table' ).addClass( fakeSelectedTableClass );
		}

		editor.fire( 'unlockSnapshot' );
	}

	function fakeSelectionMouseHandler( evt ) {
		// Prevent of throwing error in console if target is undefined (#515).
		if ( !evt.data.getTarget().getName ) {
			return;
		}

		var editor = evt.editor || evt.listenerData.editor,
			selection = editor.getSelection( 1 ),
			selectedTable = getFakeSelectedTable( editor ),
			target = evt.data.getTarget(),
			cell = target && target.getAscendant( { td: 1, th: 1 }, true ),
			table = target && target.getAscendant( 'table', true ),
			tableElements = { table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, td: 1, th: 1 },
			canClear;

		// Nested tables should be treated as the same one (e.g. user starts dragging from outer table
		// and ends in inner one).
		function isSameTable( selectedTable, table ) {
			if ( !selectedTable || !table ) {
				return false;
			}

			return selectedTable.equals( table ) || selectedTable.contains( table ) || table.contains( selectedTable ) ||
				selectedTable.getCommonAncestor( table ).is( tableElements );
		}

		function isOutsideTable( node ) {
			return !node.getAscendant( 'table', true ) && node.getDocument().equals( editor.document );
		}

		function canClearSelection( evt, selection, selectedTable, table ) {
			// User starts click outside the table or not in the same table as in the previous selection.
			if ( evt.name === 'mousedown' && ( detectLeftMouseButton( evt ) || !table ) ) {
				return true;
			}

			// Covers a case when:
			// 1. User releases mouse button outside the table.
			// 2. User opens context menu not in the selected table.
			if ( evt.name === 'mouseup' && !isOutsideTable( evt.data.getTarget() ) && !isSameTable( selectedTable, table ) ) {
				return true;
			}

			return false;
		}

		if ( canClear = canClearSelection( evt, selection, selectedTable, table ) ) {
			clearFakeCellSelection( editor, true );
		}

		// Start fake selection only if the left mouse button is really pressed inside the table.
		if ( !fakeSelection.active && evt.name === 'mousedown' && detectLeftMouseButton( evt ) && table ) {
			fakeSelection = { active: true };

			// This listener covers case when mouse button is released outside the editor.
			CKEDITOR.document.on( 'mouseup', fakeSelectionMouseHandler, null, { editor: editor } );
		}

		// The separate condition for table handles cases when user starts/stop dragging from/in
		// spacing between cells.
		if ( cell || table ) {
			fakeSelectByMouse( editor, cell || table, evt );
		}

		if ( evt.name === 'mouseup' ) {
			// If the selection ended outside of the table, there's a chance that selection was messed,
			// e.g. by including text after the table. We should also cover selection inside nested tables
			// that ends in outer table. In these cases, we just reselect cells.
			if ( detectLeftMouseButton( evt ) &&
				( isOutsideTable( evt.data.getTarget() ) || isSameTable( selectedTable, table ) ) ) {
				restoreFakeSelection( editor );
			}

			fakeSelection = { active: false };

			CKEDITOR.document.removeListener( 'mouseup', fakeSelectionMouseHandler );
		}
	}

	function fakeSelectionDragHandler( evt ) {
		var cell = evt.data.getTarget().getAscendant( { td: 1, th: 1 }, true );

		if ( !cell || cell.hasClass( fakeSelectedClass ) ) {
			return;
		}

		// We're not supporting dragging in our table selection for the time being.
		evt.cancel();
		evt.data.preventDefault();
	}

	function copyTable( editor, isCut ) {
		var selection = editor.getSelection(),
			bookmarks = selection.createBookmarks(),
			doc = editor.document,
			range = editor.createRange(),
			docElement = doc.getDocumentElement().$,
			needsScrollHack = CKEDITOR.env.ie && CKEDITOR.env.version < 9,
			// [IE] Use span for copybin and its container to avoid bug with expanding editable height by
			// absolutely positioned element.
			copybinName = ( editor.blockless || CKEDITOR.env.ie ) ? 'span' : 'div',
			copybin,
			copybinContainer,
			scrollTop,
			listener;

		function cancel( evt ) {
			evt.cancel();
		}

		// We're still handling previous copy/cut.
		// When keystroke is used to copy/cut this will also prevent
		// conflict with copyTable called again for native copy/cut event.
		if ( doc.getById( 'cke_table_copybin' ) ) {
			return;
		}


		copybin = doc.createElement( copybinName );
		copybinContainer = doc.createElement( copybinName );

		copybinContainer.setAttributes( {
			id: 'cke_table_copybin',
			'data-cke-temp': '1'
		} );

		// Position copybin element outside current viewport.
		copybin.setStyles( {
			position: 'absolute',
			width: '1px',
			height: '1px',
			overflow: 'hidden'
		} );

		copybin.setStyle( editor.config.contentsLangDirection == 'ltr' ? 'left' : 'right', '-5000px' );

		copybin.setHtml( editor.getSelectedHtml( true ) );

		// Ignore copybin.
		editor.fire( 'lockSnapshot' );

		copybinContainer.append( copybin );
		editor.editable().append( copybinContainer );

		// 复制表格时屏蔽选区
		listener = editor.on( 'selectionChange', cancel, null, null, 0 );

		if ( needsScrollHack ) {
			scrollTop = docElement.scrollTop;
		}

		// Once the clone of the table is inside of copybin, select
		// the entire contents. This selection will be copied by the
		// native browser's clipboard system.
		range.selectNodeContents( copybin );
		range.select();

		if ( needsScrollHack ) {
			docElement.scrollTop = scrollTop;
		}

		setTimeout( function() {
			copybinContainer.remove();

			selection.selectBookmarks( bookmarks );
			listener.removeListener();

			editor.fire( 'unlockSnapshot' );

			if ( isCut ) {
				editor.extractSelectedHtml();
				editor.fire( 'saveSnapshot' );
			}
		}, 100 );
	}

	function fakeSelectionCopyCutHandler( evt ) {
		var editor = evt.editor || evt.sender.editor,
		selection = editor.getSelection();

		if ( !selection.isInTable() ) {
			return;
		}

		copyTable( editor, evt.name === 'cut' );
	}

	function fakeSelectionPasteHandler( evt ) {
		var editor = evt.editor,
			dataProcessor = editor.dataProcessor,
			selection = editor.getSelection(),
			tmpContainer = new CKEDITOR.dom.element( 'body' ),
			newRowsCount = 0,
			newColsCount = 0,
			pastedTableColCount = 0,
			selectedTableColCount = 0,
			markers = {},
			boundarySelection,
			selectedTable,
			selectedTableMap,
			selectedCells,
			pastedTable,
			pastedTableMap,
			firstCell,
			startIndex,
			firstRow,
			lastCell,
			endIndex,
			lastRow,
			currentRow,
			prevCell,
			cellToPaste,
			cellToReplace,
			i,
			j;

		// Check if the selection is collapsed on the beginning of the row (1) or at the end (2).
		function isBoundarySelection( selection ) {
			var ranges = selection.getRanges(),
				range = ranges[ 0 ],
				row = range.endContainer.getAscendant( 'tr', true );

			if ( row && range.collapsed ) {
				if ( range.checkBoundaryOfElement( row, CKEDITOR.START ) ) {
					return 1;
				} else if ( range.checkBoundaryOfElement( row, CKEDITOR.END ) ) {
					return 2;
				}
			}

			return 0;
		}

		function getLongestRowLength( map ) {
			var longest = 0,
				i;

			for ( i = 0; i < map.length; i++ ) {
				if ( map[ i ].length > longest ) {
					longest = map[ i ].length;
				}
			}

			return longest;
		}

		function getRealCellPosition( cell ) {
			var table = cell.getAscendant( 'table' ),
				rowIndex = cell.getParent().$.rowIndex,
				map = CKEDITOR.tools.buildTableMap( table ),
				i;

			for ( i = 0; i < map[ rowIndex ].length; i++ ) {
				if ( new CKEDITOR.dom.element( map[ rowIndex ][ i ] ).equals( cell ) ) {
					return i;
				}
			}
		}
		
		// 公共函数：获取目标单元格（从选区中提取）
		function getTargetCellFromSelection( selection, fallbackCell ) {
			var ranges = selection.getRanges();
			var targetCell = null;
			
			if ( ranges.length > 0 ) {
				var range = ranges[ 0 ];
				// 获取光标所在的单元格，优先使用startContainer
				targetCell = range.startContainer.getAscendant( { td: 1, th: 1 }, true );
				// 如果找不到，尝试使用endContainer
				if ( !targetCell ) {
					targetCell = range.endContainer.getAscendant( { td: 1, th: 1 }, true );
				}
				// 如果还是找不到，尝试使用commonAncestorContainer
				if ( !targetCell && range.getCommonAncestor ) {
					var commonAncestor = range.getCommonAncestor();
					if ( commonAncestor ) {
						targetCell = commonAncestor.getAscendant( { td: 1, th: 1 }, true );
					}
				}
			}
			
			// 如果还是找不到单元格，使用回退单元格
			return targetCell || fallbackCell;
		}
		
		// 公共函数：获取粘贴表格的所有行
		function getPastedTableRows( pastedTable ) {
			var pastedRows = [];
			var tableBody = pastedTable.findOne( 'tbody' ) || pastedTable.findOne( 'thead' ) || pastedTable.findOne( 'tfoot' );
			var allRows;
			var rowIdx;
			
			if ( tableBody ) {
				allRows = tableBody.find( 'tr' );
				for ( rowIdx = 0; rowIdx < allRows.count(); rowIdx++ ) {
					pastedRows.push( allRows.getItem( rowIdx ) );
				}
			} else {
				// 如果没有tbody/thead/tfoot，直接从table获取
				allRows = pastedTable.find( 'tr' );
				for ( rowIdx = 0; rowIdx < allRows.count(); rowIdx++ ) {
					pastedRows.push( allRows.getItem( rowIdx ) );
				}
			}
			
			return pastedRows;
		}
		
		// 公共函数：克隆单元格并保持目标单元格的属性
		function cloneCellWithAttributes( sourceCell, targetCell ) {
			var clonedCell;
			
			// 使用原生 DOM 节点的 cloneNode 方法，然后包装成 CKEDITOR.dom.element
			if ( sourceCell.$ && sourceCell.$.cloneNode ) {
				var clonedNode = sourceCell.$.cloneNode( true );
				clonedCell = new CKEDITOR.dom.element( clonedNode );
			} else if ( sourceCell.clone ) {
				clonedCell = sourceCell.clone( true );
			} else {
				return null;
			}
			
			// 保持目标单元格的colspan和rowspan属性
			if ( targetCell && targetCell.$ ) {
				if ( targetCell.$.colSpan > 1 ) {
					clonedCell.$.colSpan = targetCell.$.colSpan;
				}
				if ( targetCell.$.rowSpan > 1 ) {
					clonedCell.$.rowSpan = targetCell.$.rowSpan;
				}
			}
			
			return clonedCell;
		}
		
		// 处理普通表格粘贴（部分单元格粘贴）
		function handleNormalTablePaste( editor, selection, pastedTable, selectedTable, selectedCells, firstCell, pastedTableColCount ) {
			var pastedRowsNormal = getPastedTableRows( pastedTable );
			var pastedRowCountNormal = pastedRowsNormal.length;
			var firstPastedCellNormal = null;
			var lastPastedCellNormal = null;
			var i, j;
			
			// 获取目标单元格（从选区中提取）
			var targetCellNormal = getTargetCellFromSelection( selection, firstCell );
			if ( !targetCellNormal ) {
				return false; // 无法找到目标单元格，退出
			}
			
			// 获取目标表格的映射
			var targetTableMapNormal = CKEDITOR.tools.buildTableMap( selectedTable );
			var targetRowIndexNormal = targetCellNormal.getParent().$.rowIndex;
			var targetColIndexNormal = getRealCellPosition( targetCellNormal );
			
			// 如果选中了多个单元格，使用选中的单元格区域
			if ( selectedCells.length > 1 ) {
				// 获取选中单元格区域的边界
				var selectedCellsMapNormal = {};
				var minRowNormal = targetRowIndexNormal;
				var maxRowNormal = targetRowIndexNormal;
				var minColNormal = targetColIndexNormal;
				var maxColNormal = targetColIndexNormal;
				
				// 计算选中区域的边界
				for ( i = 0; i < selectedCells.length; i++ ) {
					var cellNormal = selectedCells[ i ];
					if ( !cellNormal ) {
						continue;
					}
					var rowIdxNormal = cellNormal.getParent().$.rowIndex;
					var colIdxNormal = getRealCellPosition( cellNormal );
					
					if ( rowIdxNormal < minRowNormal ) minRowNormal = rowIdxNormal;
					if ( rowIdxNormal > maxRowNormal ) maxRowNormal = rowIdxNormal;
					if ( colIdxNormal < minColNormal ) minColNormal = colIdxNormal;
					if ( colIdxNormal > maxColNormal ) maxColNormal = colIdxNormal;
					
					selectedCellsMapNormal[ rowIdxNormal + ',' + colIdxNormal ] = cellNormal;
				}
				
				// 计算实际可以粘贴的行数和列数（不超过选中区域和粘贴内容）
				var actualPasteRowCount = Math.min( pastedRowCountNormal, maxRowNormal - minRowNormal + 1 );
				var actualPasteColCount = Math.min( pastedTableColCount, maxColNormal - minColNormal + 1 );
				
				// 将粘贴内容填充到选中的单元格区域
				for ( i = 0; i < actualPasteRowCount; i++ ) {
					var pastedRowNormal = pastedRowsNormal[ i ];
					if ( !pastedRowNormal ) {
						continue;
					}
					var pastedRowCellsNormal = pastedRowNormal.getChildren();
					var pastedCellCountNormal = pastedRowCellsNormal.count();
					var targetRowIdxNormal = minRowNormal + i;
					
					// 确保不超过表格边界
					if ( !targetTableMapNormal[ targetRowIdxNormal ] ) {
						continue;
					}
					
					for ( j = 0; j < actualPasteColCount && j < pastedCellCountNormal; j++ ) {
						var targetColIdxNormal = minColNormal + j;
						var cellKeyNormal = targetRowIdxNormal + ',' + targetColIdxNormal;
						var targetCellToReplaceNormal = selectedCellsMapNormal[ cellKeyNormal ];
						
						if ( !targetCellToReplaceNormal ) {
							// 如果选中的单元格映射中没有，尝试从表格映射中获取
							if ( targetTableMapNormal[ targetRowIdxNormal ] && 
								 targetTableMapNormal[ targetRowIdxNormal ][ targetColIdxNormal ] ) {
								targetCellToReplaceNormal = new CKEDITOR.dom.element( targetTableMapNormal[ targetRowIdxNormal ][ targetColIdxNormal ] );
							} else {
								continue;
							}
						}
						
						var pastedCellItemNormal = pastedRowCellsNormal.getItem( j );
						if ( !pastedCellItemNormal ) {
							continue;
						}
						
						// 使用公共函数克隆单元格
						var pastedCellCloneNormal = cloneCellWithAttributes( pastedCellItemNormal, targetCellToReplaceNormal );
						if ( !pastedCellCloneNormal ) {
							continue;
						}
						
						pastedCellCloneNormal.replace( targetCellToReplaceNormal );
						
						// 记录第一个和最后一个单元格，用于选中
						if ( i === 0 && j === 0 ) {
							firstPastedCellNormal = pastedCellCloneNormal;
						}
						if ( i === actualPasteRowCount - 1 && j === actualPasteColCount - 1 ) {
							lastPastedCellNormal = pastedCellCloneNormal;
						}
					}
				}
			} else {
				// 如果只选中了1个单元格，需要检查右侧和下侧是否有单元格
				var hasRightCellNormal = false;
				var hasBottomCellNormal = false;
				
				// 检查右侧是否有单元格（需要考虑粘贴内容的列数）
				if ( pastedTableColCount > 1 ) {
					// 如果粘贴内容有多列，检查右侧是否有足够的单元格
					var rightColIndex = targetColIndexNormal + 1;
					if ( targetTableMapNormal[ targetRowIndexNormal ] && 
						 targetTableMapNormal[ targetRowIndexNormal ][ rightColIndex ] ) {
						hasRightCellNormal = true;
					}
				}
				
				// 检查下侧是否有单元格（需要考虑粘贴内容的行数）
				if ( pastedRowCountNormal > 1 ) {
					// 如果粘贴内容有多行，检查下侧是否有足够的单元格
					var bottomRowIndex = targetRowIndexNormal + 1;
					if ( targetTableMapNormal[ bottomRowIndex ] && 
						 targetTableMapNormal[ bottomRowIndex ][ targetColIndexNormal ] ) {
						hasBottomCellNormal = true;
					}
				}
				
				// 如果右侧和下侧都没有单元格，或者粘贴内容只有1个单元格，只粘贴当前单元格内容
				if ( ( !hasRightCellNormal && !hasBottomCellNormal ) || 
					 ( pastedRowCountNormal === 1 && pastedTableColCount === 1 ) ) {
					var pastedRowSingle = pastedRowsNormal[ 0 ];
					if ( !pastedRowSingle ) {
						return false;
					}
					var pastedRowCellsSingle = pastedRowSingle.getChildren();
					var pastedCellItemSingle = pastedRowCellsSingle.getItem( 0 );
					
					if ( pastedCellItemSingle ) {
						var pastedCellCloneSingle = cloneCellWithAttributes( pastedCellItemSingle, targetCellNormal );
						if ( pastedCellCloneSingle ) {
							pastedCellCloneSingle.replace( targetCellNormal );
							firstPastedCellNormal = lastPastedCellNormal = pastedCellCloneSingle;
						}
					}
				} else {
					// 向右粘贴其余内容（可能还有向下）
					// 计算实际可以粘贴的最大行数和列数
					var maxRowToPasteNormal = targetRowIndexNormal + pastedRowCountNormal - 1;
					var maxColToPasteNormal = targetColIndexNormal + pastedTableColCount - 1;
					
					// 确保不超过表格边界
					var actualMaxRowNormal = Math.min( maxRowToPasteNormal, targetTableMapNormal.length - 1 );
					
					for ( i = 0; i < pastedRowCountNormal && ( targetRowIndexNormal + i ) <= actualMaxRowNormal; i++ ) {
						var pastedRowExpand = pastedRowsNormal[ i ];
						if ( !pastedRowExpand ) {
							continue;
						}
						var pastedRowCellsExpand = pastedRowExpand.getChildren();
						var pastedCellCountExpand = pastedRowCellsExpand.count();
						var currentRowIdxNormal = targetRowIndexNormal + i;
						
						// 确保不超过当前行的列数
						var actualMaxColNormal = targetTableMapNormal[ currentRowIdxNormal ] ? 
							Math.min( maxColToPasteNormal, targetTableMapNormal[ currentRowIdxNormal ].length - 1 ) : -1;
						
						// 如果实际最大列数小于目标列索引，说明没有足够的列可以粘贴
						if ( actualMaxColNormal < targetColIndexNormal ) {
							continue;
						}
						
						for ( j = 0; j < pastedCellCountExpand && ( targetColIndexNormal + j ) <= actualMaxColNormal; j++ ) {
							var currentColIdxNormal = targetColIndexNormal + j;
							
							// 获取目标单元格
							if ( !targetTableMapNormal[ currentRowIdxNormal ] || 
								 !targetTableMapNormal[ currentRowIdxNormal ][ currentColIdxNormal ] ) {
								continue;
							}
							
							var targetCellToReplaceExpand = new CKEDITOR.dom.element( targetTableMapNormal[ currentRowIdxNormal ][ currentColIdxNormal ] );
							var pastedCellItemExpand = pastedRowCellsExpand.getItem( j );
							
							if ( !pastedCellItemExpand ) {
								continue;
							}
							
							// 使用公共函数克隆单元格
							var pastedCellCloneExpand = cloneCellWithAttributes( pastedCellItemExpand, targetCellToReplaceExpand );
							if ( !pastedCellCloneExpand ) {
								continue;
							}
							
							pastedCellCloneExpand.replace( targetCellToReplaceExpand );
							
							// 记录第一个和最后一个单元格，用于选中
							if ( i === 0 && j === 0 ) {
								firstPastedCellNormal = pastedCellCloneExpand;
							}
							if ( i === pastedRowCountNormal - 1 && j === pastedCellCountExpand - 1 ) {
								lastPastedCellNormal = pastedCellCloneExpand;
							}
						}
					}
				}
			}
			
			// 选中粘贴的单元格
			if ( firstPastedCellNormal && lastPastedCellNormal ) {
				fakeSelectCells( editor, getCellsBetween( firstPastedCellNormal, lastPastedCellNormal ) );
			}
			
			editor.fire( 'saveSnapshot' );
			
			// Manually fire afterPaste event as we stop pasting to handle everything via our custom handler.
			setTimeout( function() {
				editor.fire( 'afterPaste' );
			}, 0 );
			
			return true;
		} 

		if ( !dataProcessor ) {
			dataProcessor = new CKEDITOR.htmlDataProcessor( editor );
		}

		// 优先从 dataTransfer 获取完整的 HTML，因为在非首尾位置 dataValue 可能只包含文本值
		var pasteHtml = null;
		if ( evt.data.dataTransfer ) {
			try {
				pasteHtml = evt.data.dataTransfer.getData( 'text/html' );
			} catch ( e ) {
				// 如果获取失败，忽略错误
			}
		}
		
		// 如果没有从 dataTransfer 获取到 HTML，使用 dataValue
		if ( !pasteHtml && evt.data.dataValue ) {
			pasteHtml = evt.data.dataValue;
		}
		
		// Pasted value must be filtered using dataProcessor to strip all unsafe code
		// before inserting it into temporary container.
		if ( pasteHtml ) {
			tmpContainer.setHtml( dataProcessor.toHtml( pasteHtml ), {
				fixForBody: false
			} );
			pastedTable = tmpContainer.findOne( 'table' );
		}
		
		// 如果没有粘贴的表格，不处理
		if ( !pastedTable ) {
			return;
		}

		// 提前检测是否是单整行或多整行粘贴
		var isSingleRowPaste = false;
		var isMultiRowPaste = false;
		
		// 提前获取目标表格，用于判断是否是整行粘贴
		var targetTableForCheck = null;
		var targetTableColCountForCheck = 0;
		var tempSelectedCells = getSelectedCells( selection );
		if ( tempSelectedCells && tempSelectedCells.length > 0 ) {
			targetTableForCheck = tempSelectedCells[ 0 ].getAscendant( 'table' );
			if ( targetTableForCheck ) {
				var targetTableMapForCheck = CKEDITOR.tools.buildTableMap( targetTableForCheck );
				targetTableColCountForCheck = targetTableMapForCheck[ 0 ] ? targetTableMapForCheck[ 0 ].length : 0;
			}
		}
		
		// 辅助函数：检查粘贴表格是否是整行（基于目标表格的列数）
		function checkIfFullRowPaste( pastedTableMap, targetColCount ) {
			if ( !pastedTableMap || pastedTableMap.length === 0 ) {
				return false;
			}
			
			// 如果没有目标表格或目标表格列数为0，无法判断
			if ( !targetColCount || targetColCount === 0 ) {
				return false;
			}
			
			var pastedRowColCount, i;
			
			// 单行：检查粘贴表格的列数是否等于目标表格的列数
			if ( pastedTableMap.length === 1 ) {
				pastedRowColCount = pastedTableMap[ 0 ] ? pastedTableMap[ 0 ].length : 0;
				return pastedRowColCount > 0 && pastedRowColCount === targetColCount;
			}
			
			// 多行：检查粘贴表格的每一行的列数是否都等于目标表格的列数
			if ( pastedTableMap.length > 1 ) {
				for ( i = 0; i < pastedTableMap.length; i++ ) {
					pastedRowColCount = pastedTableMap[ i ] ? pastedTableMap[ i ].length : 0;
					if ( pastedRowColCount !== targetColCount ) {
						return false; // 列数不匹配，不是整行
					}
				}
				return true; // 所有行的列数都匹配目标表格，是整行
			}
			
			return false;
		}
		
		// 判断粘贴的是否为整行，单整行或者多整行
		if ( pastedTable && targetTableColCountForCheck > 0 ) {
			var pastedTableMapTemp = CKEDITOR.tools.buildTableMap( pastedTable );
			if ( pastedTableMapTemp.length === 1 ) {
				// 检查是否是整行（列数必须等于目标表格的列数）
				if ( checkIfFullRowPaste( pastedTableMapTemp, targetTableColCountForCheck ) ) {
					isSingleRowPaste = true;
				}
			} else if ( pastedTableMapTemp.length > 1 ) {
				// 检查是否是整行（所有行的列数必须都等于目标表格的列数）
				if ( checkIfFullRowPaste( pastedTableMapTemp, targetTableColCountForCheck ) ) {
					isMultiRowPaste = true;
				}
			}
		}
		

		// 计算边界选择（用于后续判断）
		boundarySelection = isBoundarySelection( selection );
		
		// 辅助函数：更可靠地检查光标/选区是否在表格中
		// isInTable() 在折叠选区（光标）时可能返回 false，所以需要手动检查
		function isSelectionInTable( selection ) {
			var ranges = selection.getRanges();
			if ( !ranges || ranges.length === 0 ) {
				return false;
			}
			
			// 检查每个范围是否在表格中
			for ( var i = 0; i < ranges.length; i++ ) {
				var range = ranges[ i ];
				// 检查起始和结束容器是否在表格中
				var startTable = range.startContainer.getAscendant( 'table', true );
				var endTable = range.endContainer.getAscendant( 'table', true );
				
				// 如果起始或结束容器在表格中，认为在表格中
				if ( startTable || endTable ) {
					return true;
				}
			}
			
			return false;
		}
		
		// 判断是否应该处理粘贴：
		// 1. 如果没有选区范围，不处理
		// 2. 如果不在表格中，需要满足以下任一条件才处理：
		//    - 是边界选择（行首/行尾）
		//    - 是单整行粘贴
		//    - 是多整行粘贴
		// 3. 如果在表格中，无论是否边界选择都可以处理（允许任意单元格粘贴）
		if ( !selection.getRanges().length ) {
			return;
		}
		
		// 使用更可靠的判断方法检查是否在表格中
		var isInTable = isSelectionInTable( selection ) || selection.isInTable();
		
		// 如果不在表格中，需要是边界选择或者是单/多整行粘贴才能继续
		if ( !isInTable && !boundarySelection && !isSingleRowPaste && !isMultiRowPaste ) {
			return;
		}

		selectedCells = getSelectedCells( selection );

		//0或1个cell不执行表格复制
		if ( selectedCells.length == 0 ) {
			return;
		}
		
		if ( selectedCells.length == 1 ) {
			var selectedContent = pasteHtml || ( evt.data.dataTransfer ? evt.data.dataTransfer.getData('text/html') : null ) || evt.data.dataValue || '';
			var isTable=/^<table[^>]*>[\s\S]*?<\/[^>]*table>$/gi;
			// 如果是单整行或多整行粘贴，不在这里返回，继续执行
			if( !isSingleRowPaste && !isMultiRowPaste && selectedContent.indexOf('cke_table-faked-selection-table') < 0 && !isTable.test(selectedContent))
				return;
		}

		evt.stop();

		selectedTable = selectedCells[ 0 ].getAscendant( 'table' );
		selectedCells = getSelectedCells( selection, selectedTable );
		firstCell = selectedCells[ 0 ];
		firstRow = firstCell.getParent();
		lastCell = selectedCells[ selectedCells.length - 1 ];
		lastRow = lastCell.getParent();
		
		// 提前检测是否是单整行或多整行粘贴，如果是则直接处理，避免被混合内容检查拦截和清空单元格
		// isSingleRowPaste 和 isMultiRowPaste 已经在前面通过 checkIfFullRowPaste 函数判断了是否为整行
		if ( isSingleRowPaste && pastedTable ) {
			var newRow, newRowCells;
			var targetCell, targetRow, targetRowIndex;
			
			// 获取当前光标所在的单元格
			if ( boundarySelection ) {
				// 如果boundarySelection存在，先处理boundarySelection插入新行
				endIndex = firstRow.getChildCount();
				firstRow = lastRow = new CKEDITOR.dom.element( 'tr' );
				firstRow[ 'insert' + ( boundarySelection === 1 ? 'Before' : 'After' ) ]( firstCell.getParent() );

				for ( i = 0; i < endIndex; i++ ) {
					firstCell = new CKEDITOR.dom.element( 'td' );
					firstCell.appendTo( firstRow );
				}

				firstCell = firstRow.getFirst();
				lastCell = firstRow.getLast();

				selection.selectElement( firstRow );
				selectedCells = getSelectedCells( selection );
				
				// 使用新插入的行
				newRow = firstRow;
				newRowCells = newRow.getChildren();
			} else {
				// 获取当前光标所在的单元格
				targetCell = getTargetCellFromSelection( selection, firstCell );
				
				// 获取当前单元格所在的行
				targetRow = targetCell.getParent();
				targetRowIndex = targetRow.$.rowIndex;
				
				// 创建包含目标单元格的数组用于插入行
				var cellsForInsert = [ targetCell ];
				
				// 在当前行后面插入新行
				insertRow( editor, cellsForInsert, false, 1, false );
				
				// 获取新插入的行
				newRow = new CKEDITOR.dom.element( selectedTable.$.rows[ targetRowIndex + 1 ] );
				newRowCells = newRow.getChildren();
			}
			
			// 获取粘贴的表格行（可能包含在tbody、thead或tfoot中）
			var pastedRow = pastedTable.findOne( 'tr' );
			if ( !pastedRow ) {
				// 如果没有找到tr，尝试从table直接获取
				var tableBody = pastedTable.findOne( 'tbody' ) || pastedTable.findOne( 'thead' ) || pastedTable.findOne( 'tfoot' );
				if ( tableBody ) {
					pastedRow = tableBody.findOne( 'tr' );
				}
			}
			
			if ( pastedRow ) {
				var pastedRowCells = pastedRow.getChildren();
				
				// 将粘贴的行内容填充到新行中
				var cellCount = Math.min( newRowCells.count(), pastedRowCells.count() );
				var newRowCellsArray = [];
				for ( i = 0; i < cellCount; i++ ) {
					var newCell = newRowCells.getItem( i );
					var pastedCellItem = pastedRowCells.getItem( i );
					
					// 确保 pastedCellItem 是有效的元素
					if ( !pastedCellItem ) {
						continue;
					}
					
					// 使用公共函数克隆单元格
					var pastedCell = cloneCellWithAttributes( pastedCellItem, newCell );
					if ( !pastedCell ) {
						continue;
					}
					
					pastedCell.replace( newCell );
					newRowCellsArray.push( pastedCell );
				}
				
				// 选中新插入的行
				if ( newRowCellsArray.length > 0 ) {
					fakeSelectCells( editor, getCellsBetween( newRowCellsArray[ 0 ], 
						newRowCellsArray[ newRowCellsArray.length - 1 ] ) );
				}
			}
			
			editor.fire( 'saveSnapshot' );
			
			// Manually fire afterPaste event as we stop pasting to handle everything via our custom handler.
			setTimeout( function() {
				editor.fire( 'afterPaste' );
			}, 0 );
			
			return;
		}
		
		// 处理多整行粘贴
		if ( isMultiRowPaste && pastedTable && selectedTable ) {
			var targetCellMulti, targetRowMulti, targetRowIndexMulti;
			var newRowsMulti = [];
			var pastedTableMapForInsert = CKEDITOR.tools.buildTableMap( pastedTable );
			var pastedRowCount = pastedTableMapForInsert.length;
			var newRowMulti, newCellMulti, insertIdx;
			
			// 获取粘贴的所有行（可能包含在tbody、thead或tfoot中）
			var pastedRows = getPastedTableRows( pastedTable );
			
			// 获取当前光标所在的单元格
			if ( boundarySelection ) {
				// 如果boundarySelection存在，先处理boundarySelection插入新行
				endIndex = firstRow.getChildCount();
				var referenceRow = firstCell.getParent();
				
				// 插入多行
				for ( insertIdx = 0; insertIdx < pastedRowCount; insertIdx++ ) {
					newRowMulti = new CKEDITOR.dom.element( 'tr' );
					// 第一行插入到参考位置，后续行插入到前一行后面
					if ( insertIdx === 0 ) {
						newRowMulti[ 'insert' + ( boundarySelection === 1 ? 'Before' : 'After' ) ]( referenceRow );
					} else {
						newRowMulti.insertAfter( newRowsMulti[ insertIdx - 1 ] );
					}
					
					// 为新行创建单元格
					for ( i = 0; i < endIndex; i++ ) {
						newCellMulti = new CKEDITOR.dom.element( 'td' );
						newCellMulti.appendTo( newRowMulti );
					}
					
					newRowsMulti.push( newRowMulti );
				}
				
				// 更新firstRow和lastRow为新插入的第一行和最后一行
				firstRow = newRowsMulti[ 0 ];
				lastRow = newRowsMulti[ pastedRowCount - 1 ];
				firstCell = firstRow.getFirst();
				lastCell = lastRow.getLast();
				
				// 选中新插入的行
				selection.selectElement( firstRow );
				selectedCells = getSelectedCells( selection );
				
				targetRowIndexMulti = firstRow.$.rowIndex;
			} else {
				// 获取当前光标所在的单元格
				targetCellMulti = getTargetCellFromSelection( selection, firstCell );
				
				// 获取当前单元格所在的行
				targetRowMulti = targetCellMulti.getParent();
				targetRowIndexMulti = targetRowMulti.$.rowIndex;
				
				// 获取参考行的列数
				var referenceRowColCount = targetRowMulti.getChildCount();
				
				// 手动创建多行并插入到当前行后面
				for ( insertIdx = 0; insertIdx < pastedRowCount; insertIdx++ ) {
					newRowMulti = new CKEDITOR.dom.element( 'tr' );
					// 第一行插入到目标行后面，后续行插入到前一行后面
					if ( insertIdx === 0 ) {
						newRowMulti.insertAfter( targetRowMulti );
					} else {
						newRowMulti.insertAfter( newRowsMulti[ insertIdx - 1 ] );
					}
					
					// 为新行创建单元格
					for ( i = 0; i < referenceRowColCount; i++ ) {
						newCellMulti = new CKEDITOR.dom.element( 'td' );
						newCellMulti.appendTo( newRowMulti );
					}
					
					newRowsMulti.push( newRowMulti );
				}
				
				// 更新targetRowIndexMulti为第一行新插入行的索引
				targetRowIndexMulti = newRowsMulti[ 0 ].$.rowIndex;
			}
			
			// 将粘贴的多行内容填充到新插入的行中
			var firstPastedCell = null;
			var lastPastedCell = null;
			for ( var rowIdxMulti = 0; rowIdxMulti < pastedRowCount && rowIdxMulti < pastedRows.length; rowIdxMulti++ ) {
				// 使用之前创建的行（无论是boundarySelection还是非boundarySelection，都已经手动创建了行）
				newRowMulti = newRowsMulti[ rowIdxMulti ];
				var newRowCellsMulti = newRowMulti.getChildren();
				var pastedRowMulti = pastedRows[ rowIdxMulti ];
				var pastedRowCellsMulti = pastedRowMulti.getChildren();
				
				// 将粘贴的行内容填充到新行中
				var cellCountMulti = Math.min( newRowCellsMulti.count(), pastedRowCellsMulti.count() );
				for ( i = 0; i < cellCountMulti; i++ ) {
					newCellMulti = newRowCellsMulti.getItem( i );
					var pastedCellItemMulti = pastedRowCellsMulti.getItem( i );
					
					// 确保 pastedCellItem 是有效的元素
					if ( !pastedCellItemMulti ) {
						continue;
					}
					
					// 使用公共函数克隆单元格
					var pastedCellMulti = cloneCellWithAttributes( pastedCellItemMulti, newCellMulti );
					if ( !pastedCellMulti ) {
						continue;
					}
					
					pastedCellMulti.replace( newCellMulti );
					
					// 记录第一行第一个单元格和最后一行最后一个单元格，用于选中
					if ( rowIdxMulti === 0 && i === 0 ) {
						firstPastedCell = pastedCellMulti;
					}
					if ( rowIdxMulti === pastedRowCount - 1 && i === cellCountMulti - 1 ) {
						lastPastedCell = pastedCellMulti;
					}
				}
			}
			
			// 选中新插入的所有行
			if ( firstPastedCell && lastPastedCell ) {
				fakeSelectCells( editor, getCellsBetween( firstPastedCell, lastPastedCell ) );
			}
			
			editor.fire( 'saveSnapshot' );
			
			// Manually fire afterPaste event as we stop pasting to handle everything via our custom handler.
			setTimeout( function() {
				editor.fire( 'afterPaste' );
			}, 0 );
			
			return;
		}

        // 构建粘贴表格的表格映射
		pastedTableMap = CKEDITOR.tools.buildTableMap( pastedTable ); 
        // 获取粘贴表格的最长行长度
        pastedTableColCount = getLongestRowLength( pastedTableMap );
        
        // 获取目标表格的完整映射
        var targetTableFullMap = CKEDITOR.tools.buildTableMap( selectedTable );
        var targetTableRowCount = targetTableFullMap.length;
        var targetTableFullColCount = targetTableFullMap[ 0 ] ? targetTableFullMap[ 0 ].length : 0;

        // 辅助函数：检查是否是整列粘贴（单整列或多整列）
        function checkIsFullColumnPaste( pastedTableMap, targetTableRowCount, targetTableFullColCount ) {
            // 整列粘贴的条件：粘贴表格的行数必须等于目标表格的行数
            if ( pastedTableMap.length !== targetTableRowCount ) {
                return false;
            }
            
            // 检查粘贴表格的每一行的列数是否一致（整列粘贴时，每行的列数应该相同）
            var firstRowColCount = pastedTableMap[ 0 ] ? pastedTableMap[ 0 ].length : 0;
            if ( firstRowColCount === 0 ) {
                return false;
            }
            
            // 检查所有行的列数是否一致
            for ( var i = 1; i < pastedTableMap.length; i++ ) {
                var rowColCount = pastedTableMap[ i ] ? pastedTableMap[ i ].length : 0;
                if ( rowColCount !== firstRowColCount ) {
                    return false;
                }
            }
            
            // 单整列：只有1列
            // 多整列：有多列，且列数小于等于目标表格的列数
            return firstRowColCount > 0 && firstRowColCount <= targetTableFullColCount;
        }
        
        // 判断是否是整列粘贴（单整列或多整列）
        var isFullColumnPaste = checkIsFullColumnPaste( pastedTableMap, targetTableRowCount, targetTableFullColCount );
        var isSingleColumnPaste = isFullColumnPaste && pastedTableColCount === 1;
        var isMultiColumnPaste = isFullColumnPaste && pastedTableColCount > 1;
        
        // 如果不是整列粘贴，则处理普通表格粘贴（部分单元格粘贴）
        if ( !isFullColumnPaste ) {
            // 处理普通表格粘贴：将粘贴的表格内容填充到选中的单元格区域
            if ( handleNormalTablePaste( editor, selection, pastedTable, selectedTable, selectedCells, firstCell, pastedTableColCount ) ) {
                return;
            }
        }
        
        // 处理单整列粘贴
        if ( isSingleColumnPaste && pastedTable && selectedTable ) {
            var targetCellCol, targetColIndex;
            var firstPastedCellCol = null;
            var lastPastedCellCol = null;
            
            // 获取当前光标所在的单元格
            targetCellCol = getTargetCellFromSelection( selection, selectedCells[ 0 ] );
            
            if ( !targetCellCol ) {
                return; // 无法找到目标单元格，退出
            }
            
            // 获取目标单元格的列索引
            targetColIndex = getCellColIndex( targetCellCol, true );
            
            // 在当前列位置插入一列
            insertColumn( [ targetCellCol ], false, 1 );
            
            // 获取粘贴的表格列（所有行的第一列）
            var pastedRowsCol = getPastedTableRows( pastedTable );
            
            // 重新构建表格映射以获取新插入的列
            var updatedTableMap = CKEDITOR.tools.buildTableMap( selectedTable );
            var insertedColIndex = targetColIndex + 1; // 插入在目标列后面
            
            // 将粘贴的列内容填充到新插入的列中
            for ( i = 0; i < pastedRowsCol.length && i < updatedTableMap.length; i++ ) {
                var pastedRowCol = pastedRowsCol[ i ];
                var pastedCellCol = pastedRowCol.getFirst();
                
                if ( !pastedCellCol || !pastedCellCol.is( 'td', 'th' ) ) {
                    continue;
                }
                
                // 获取目标表格中对应行的新插入列的单元格
                if ( updatedTableMap[ i ] && updatedTableMap[ i ][ insertedColIndex ] ) {
                    var targetCellInCol = new CKEDITOR.dom.element( updatedTableMap[ i ][ insertedColIndex ] );
                    
                    // 使用公共函数克隆单元格
                    var pastedCellClone = cloneCellWithAttributes( pastedCellCol, targetCellInCol );
                    if ( !pastedCellClone ) {
                        continue;
                    }
                    
                    pastedCellClone.replace( targetCellInCol );
                    
                    // 记录第一个和最后一个单元格，用于选中
                    if ( i === 0 ) {
                        firstPastedCellCol = pastedCellClone;
                    }
                    if ( i === pastedRowsCol.length - 1 ) {
                        lastPastedCellCol = pastedCellClone;
                    }
                }
            }
            
            // 选中新插入的列
            if ( firstPastedCellCol && lastPastedCellCol ) {
                fakeSelectCells( editor, getCellsBetween( firstPastedCellCol, lastPastedCellCol ) );
            }
            
            editor.fire( 'saveSnapshot' );
            
            // Manually fire afterPaste event as we stop pasting to handle everything via our custom handler.
            setTimeout( function() {
                editor.fire( 'afterPaste' );
            }, 0 );
            
            return;
        }
        
        // 处理多整列粘贴
        if ( isMultiColumnPaste && pastedTable && selectedTable ) {
            var targetCellMultiCol, targetColIndexMulti;
            var firstPastedCellMultiCol = null;
            var lastPastedCellMultiCol = null;
            
            // 获取当前光标所在的单元格
            targetCellMultiCol = getTargetCellFromSelection( selection, selectedCells[ 0 ] );
            
            if ( !targetCellMultiCol ) {
                return; // 无法找到目标单元格，退出
            }
            
            // 获取目标单元格的列索引
            targetColIndexMulti = getCellColIndex( targetCellMultiCol, true );
            
            // 在当前列位置插入多列
            insertColumn( [ targetCellMultiCol ], false, pastedTableColCount );
            
            // 获取粘贴的表格列（所有行的所有列）
            var pastedRowsMultiCol = getPastedTableRows( pastedTable );
            
            // 重新构建表格映射以获取新插入的列
            var updatedTableMapMulti = CKEDITOR.tools.buildTableMap( selectedTable );
            var insertedColStartIndex = targetColIndexMulti + 1; // 插入在目标列后面
            
            // 将粘贴的多列内容填充到新插入的列中
            for ( i = 0; i < pastedRowsMultiCol.length && i < updatedTableMapMulti.length; i++ ) {
                var pastedRowMultiCol = pastedRowsMultiCol[ i ];
                var pastedRowCellsMultiCol = pastedRowMultiCol.getChildren();
                
                // 遍历粘贴行的每一列
                for ( j = 0; j < pastedTableColCount && j < pastedRowCellsMultiCol.count(); j++ ) {
                    var pastedCellMultiCol = pastedRowCellsMultiCol.getItem( j );
                    
                    if ( !pastedCellMultiCol || !pastedCellMultiCol.is( 'td', 'th' ) ) {
                        continue;
                    }
                    
                    // 获取目标表格中对应行的新插入列的单元格
                    var targetColIndexInMap = insertedColStartIndex + j;
                    if ( updatedTableMapMulti[ i ] && updatedTableMapMulti[ i ][ targetColIndexInMap ] ) {
                        var targetCellInMultiCol = new CKEDITOR.dom.element( updatedTableMapMulti[ i ][ targetColIndexInMap ] );
                        
                        // 使用公共函数克隆单元格
                        var pastedCellCloneMulti = cloneCellWithAttributes( pastedCellMultiCol, targetCellInMultiCol );
                        if ( !pastedCellCloneMulti ) {
                            continue;
                        }
                        
                        pastedCellCloneMulti.replace( targetCellInMultiCol );
                        
                        // 记录第一个和最后一个单元格，用于选中
                        if ( i === 0 && j === 0 ) {
                            firstPastedCellMultiCol = pastedCellCloneMulti;
                        }
                        if ( i === pastedRowsMultiCol.length - 1 && j === pastedTableColCount - 1 ) {
                            lastPastedCellMultiCol = pastedCellCloneMulti;
                        }
                    }
                }
            }
            
            // 选中新插入的所有列
            if ( firstPastedCellMultiCol && lastPastedCellMultiCol ) {
                fakeSelectCells( editor, getCellsBetween( firstPastedCellMultiCol, lastPastedCellMultiCol ) );
            }
            
            editor.fire( 'saveSnapshot' );
            
            // Manually fire afterPaste event as we stop pasting to handle everything via our custom handler.
            setTimeout( function() {
                editor.fire( 'afterPaste' );
            }, 0 );
            
            return;
        }
	}

	function customizeTableCommand( editor, cmds, callback ) {
		editor.on( 'beforeCommandExec', function getSelectedCells1( evt ) {
			if ( CKEDITOR.tools.array.indexOf( cmds, evt.data.name ) !== -1 ) {
				evt.data.selectedCells = getSelectedCells( editor.getSelection() );
			}
		} );

		editor.on( 'afterCommandExec', function getSelectedCells2( evt ) {
			if ( CKEDITOR.tools.array.indexOf( cmds, evt.data.name ) !== -1 ) {
				callback( editor, evt.data );
			}
		} );
	}

	/**
	 * Namespace providing a set of helper functions for working with tables, exposed by
	 * [Table Selection](http://ckeditor.com/addon/tableselection) plugin.
	 *
	 * @since 4.7.0
	 * @singleton
	 * @class CKEDITOR.plugins.tableselection
	 */
	CKEDITOR.plugins.tableselection = {
		/**
		 * Fetches all cells between cells passed as parameters, including these cells.
		 *
		 * @param {CKEDITOR.dom.element} first The first cell to fetch.
		 * @param {CKEDITOR.dom.element} last The last cell to fetch.
		 * @return {CKEDITOR.dom.element[]} Array of fetched cells.
		 */
		getCellsBetween: getCellsBetween,

		/**
		 * Adds keyboard integration for table selection in a given editor.
		 *
		 * @param {CKEDITOR.editor} editor
		 * @private
		 */
		keyboardIntegration: function( editor ) {
			// Handle left, up, right, down, delete and backspace keystrokes inside table fake selection.
			function getTableOnKeyDownListener( editor ) {
				var keystrokes = {
						37: 1, // Left Arrow
						38: 1, // Up Arrow
						39: 1, // Right Arrow,
						40: 1, // Down Arrow
						8: 1, // Backspace
						46: 1 // Delete
					},
					tags = CKEDITOR.tools.extend( { table: 1 }, CKEDITOR.dtd.$tableContent );

				delete tags.td;
				delete tags.th;

				// Called when removing empty subseleciton of the table.
				// It should not allow for removing part of table, e.g. when user attempts to remove 2 cells
				// out of 4 in row. It should however remove whole row or table, if it was fully selected.
				function deleteEmptyTablePart( node, ranges ) {
					if ( !ranges.length ) {
						return null;
					}

					var rng = editor.createRange(),
						mergedRanges = CKEDITOR.dom.range.mergeRanges( ranges );

					// Enlarge each range, so that it wraps over tr.
					CKEDITOR.tools.array.forEach( mergedRanges, function( mergedRange ) {
						mergedRange.enlarge( CKEDITOR.ENLARGE_ELEMENT );
					} );

					var boundaryNodes = mergedRanges[ 0 ].getBoundaryNodes(),
						startNode = boundaryNodes.startNode,
						endNode = boundaryNodes.endNode;

					if ( startNode && startNode.is && startNode.is( tags ) ) {
						// A node that will receive selection after the firstRangeContainedNode is removed.
						var boundaryTable = startNode.getAscendant( 'table', true ),
							targetNode = startNode.getPreviousSourceNode( false, CKEDITOR.NODE_ELEMENT, boundaryTable ),
							selectBeginning = false,
							matchingElement = function( elem ) {
								// We're interested in matching only td/th but not contained by the startNode since it will be removed.
								// Technically none of startNode children should be visited but it will due to http://dev.ckeditor.com/ticket/12191.
								return !startNode.contains( elem ) && elem.is && elem.is( 'td', 'th' );
							};

						while ( targetNode && !matchingElement( targetNode ) ) {
							targetNode = targetNode.getPreviousSourceNode( false, CKEDITOR.NODE_ELEMENT, boundaryTable );
						}

						if ( !targetNode && endNode && endNode.is && !endNode.is( 'table' ) && endNode.getNext() ) {
							// Special case: say we were removing the first row, so there are no more tds before, check if there's a cell after removed row.
							targetNode = endNode.getNext().findOne( 'td, th' );
							// In that particular case we want to select beginning.
							selectBeginning = true;
						}

						if ( !targetNode ) {
							// As a last resort of defence we'll put the selection before (about to be) removed table.
							rng.setStartBefore( startNode.getAscendant( 'table', true ) );
							rng.collapse( true );
						} else {
							rng[ 'moveToElementEdit' + ( selectBeginning ? 'Start' : 'End' ) ]( targetNode );
						}

						mergedRanges[ 0 ].deleteContents();

						return [ rng ];
					}

					// By default return a collapsed selection in a first cell.
					if ( startNode ) {
						rng.moveToElementEditablePosition( startNode );
						return [ rng ];
					}
				}

				return function tableKeyDownListener( evt ) {
					// Use getKey directly in order to ignore modifiers.
					// Justification: http://dev.ckeditor.com/ticket/11861#comment:13
					var keystroke = evt.data.getKey(),
						selection,
						toStart = keystroke === 37 || keystroke == 38,
						ranges,
						firstCell,
						lastCell,
						i;

					// Handle only left/right/del/bspace keys.
					if ( !keystrokes[ keystroke ] ) {
						return;
					}

					selection = editor.getSelection();

					if ( !selection || !selection.isInTable() || !selection.isFake ) {
						return;
					}

					ranges = selection.getRanges();
					firstCell = ranges[ 0 ]._getTableElement();
					lastCell = ranges[ ranges.length - 1 ]._getTableElement();

					evt.data.preventDefault();
					evt.cancel();

					if ( keystroke > 8 && keystroke < 46 ) {
						// Arrows.
						ranges[ 0 ].moveToElementEditablePosition( toStart ? firstCell : lastCell, !toStart );
						selection.selectRanges( [ ranges[ 0 ] ] );
					} else {
						// Delete. 只读模式下不执行删除
						if ( editor.readOnly || ( ranges[ 0 ] && ranges[ 0 ].checkReadOnly && ranges[ 0 ].checkReadOnly() ) ) {
							evt.data.preventDefault();
							evt.cancel();
							return;
						}
						for ( i = 0; i < ranges.length; i++ ) {
							clearCellInRange( ranges[ i ] );
						}

						var newRanges = deleteEmptyTablePart( firstCell, ranges );

						if ( newRanges ) {
							ranges = newRanges;
						} else {
							// If no new range was returned fallback to selecting first cell.
							ranges[ 0 ].moveToElementEditablePosition( firstCell );
						}

						selection.selectRanges( ranges );
						editor.fire( 'saveSnapshot' );
					}
				};
			}

			function tableKeyPressListener( evt ) {
				var selection = editor.getSelection(),
					// Enter key also produces character, but Firefox doesn't think so (gh#415).
					isCharKey = evt.data.$.charCode || ( evt.data.getKey() === 13 ),
					ranges,
					firstCell,
					i;

				// We must check if the event really did not produce any character as it's fired for all keys in Gecko.
				if ( !selection || !selection.isInTable() || !selection.isFake || !isCharKey ||
					evt.data.getKeystroke() & CKEDITOR.CTRL ) {
					return;
				}

				ranges = selection.getRanges();
				// 只读模式下不执行清除/输入
				if ( editor.readOnly || ( ranges[ 0 ] && ranges[ 0 ].checkReadOnly && ranges[ 0 ].checkReadOnly() ) ) {
					evt.data.preventDefault();
					evt.cancel();
					return;
				}
				firstCell = ranges[ 0 ].getEnclosedNode().getAscendant( { td: 1, th: 1 }, true );

				for ( i = 0; i < ranges.length; i++ ) {
					clearCellInRange( ranges[ i ] );
				}

				ranges[ 0 ].moveToElementEditablePosition( firstCell );
				selection.selectRanges( [ ranges[ 0 ] ] );
			}

			function clearCellInRange( range ) {
				var enclosedNode = range.getEnclosedNode();
				// 仅当 range 完全包裹一个 td/th 单元格时，才整体清空文本；
				// 单元格内部分内容选择应走 deleteContents，避免误删整个单元格内容 (AIED-365)
				if ( enclosedNode && enclosedNode.is && enclosedNode.is( 'td', 'th' ) ) {
					enclosedNode.setText( '' );
				} else {
					range.deleteContents();
				}

				CKEDITOR.tools.array.forEach( range._find( 'td' ), function( cell ) {
					// Cells that were not removed, need to contain bogus BR (if needed), otherwise row might
					// collapse. (tp#2270)
					cell.appendBogus();
				} );
			}

			// Automatically select non-editable element when navigating into
			// it by left/right or backspace/del keys.
			var editable = editor.editable();
			editable.attachListener( editable, 'keydown', getTableOnKeyDownListener( editor ), null, null, -1 );
			editable.attachListener( editable, 'keypress', tableKeyPressListener, null, null, -1 );
		},

		/*
		 * Determines whether table selection is supported in the current environment.
		 *
		 * @property {Boolean}
		 * @private
		 */
		isSupportedEnvironment: !( CKEDITOR.env.ie && CKEDITOR.env.version < 11 )
	};

	CKEDITOR.plugins.add( 'tableselection', {
		requires: 'clipboard,tabletools',

		onLoad: function() {
			// We can't alias these features earlier, as they could be still not loaded.
			tabletools = CKEDITOR.plugins.tabletools;
			getSelectedCells = tabletools.getSelectedCells;
			getCellColIndex = tabletools.getCellColIndex;
			insertRow = tabletools.insertRow;
			insertColumn = tabletools.insertColumn;

			CKEDITOR.document.appendStyleSheet( this.path + '/styles/tableselection.css' );
		},

		init: function( editor ) {
			// Disable unsupported browsers.
			if ( !CKEDITOR.plugins.tableselection.isSupportedEnvironment ) {
				return;
			}

			// Add styles for fake visual selection.
			if ( editor.addContentsCss ) {
				editor.addContentsCss( this.path + '/styles/tableselection.css' );
			}

			editor.on( 'contentDom', function() {
				var editable = editor.editable(),
					mouseHost = editable.isInline() ? editable : editor.document,
					evtInfo = { editor: editor };

				// Explicitly set editor as DOM events generated on document does not convey information about it.
				editable.attachListener( mouseHost, 'mousedown', fakeSelectionMouseHandler, null, evtInfo );
				editable.attachListener( mouseHost, 'mousemove', fakeSelectionMouseHandler, null, evtInfo );
				editable.attachListener( mouseHost, 'mouseup', fakeSelectionMouseHandler, null, evtInfo );

				editable.attachListener( editable, 'dragstart', fakeSelectionDragHandler );
				editable.attachListener( editor, 'selectionCheck', fakeSelectionChangeHandler );

				CKEDITOR.plugins.tableselection.keyboardIntegration( editor );

				// Setup copybin.
				if ( CKEDITOR.plugins.clipboard && !CKEDITOR.plugins.clipboard.isCustomCopyCutSupported ) {
					editable.attachListener( editable, 'cut', fakeSelectionCopyCutHandler );
					editable.attachListener( editable, 'copy', fakeSelectionCopyCutHandler );
				}
			} );

			editor.on( 'paste', fakeSelectionPasteHandler );

			customizeTableCommand( editor, [
				'rowInsertBefore',
				'rowInsertAfter',
				'columnInsertBefore',
				'columnInsertAfter',
				'cellInsertBefore',
				'cellInsertAfter'
			], function( editor, data ) {
				fakeSelectCells( editor, data.selectedCells );
			} );

			customizeTableCommand( editor, [
				'cellMerge',
				'cellMergeRight',
				'cellMergeDown'
			], function( editor, data ) {
				fakeSelectCells( editor, [ data.commandData.cell ] );
			} );

			customizeTableCommand( editor, [
				'cellDelete'
			], function( editor ) {
				clearFakeCellSelection( editor, true );
			} );
		}
	} );
}() );
