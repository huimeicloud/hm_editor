/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	var cellNodeRegex = /^(?:td|th)$/,
		isArray = CKEDITOR.tools.isArray;

	function getSelectedCells( selection, table ) {
		if ( !selection ) {
			return;
		}

		var ranges = selection.getRanges();
		var retval = [];
		var database = {};

		function isInTable( cell ) {
			if ( !table ) {
				return true;
			}

			return table.contains( cell ) && cell.getAscendant( 'table', true ).equals( table );
		}

		function moveOutOfCellGuard( node ) {
			// Apply to the first cell only.
			if ( retval.length > 0 )
				return;

			// If we are exiting from the first </td>, then the td should definitely be
			// included.
			if ( node.type == CKEDITOR.NODE_ELEMENT && cellNodeRegex.test( node.getName() ) && !node.getCustomData( 'selected_cell' ) ) {
				CKEDITOR.dom.element.setMarker( database, node, 'selected_cell', true );
				retval.push( node );
			}
		}

		for ( var i = 0; i < ranges.length; i++ ) {
			var range = ranges[ i ];

			if ( range.collapsed ) {
				// Walker does not handle collapsed ranges yet - fall back to old API.
				var startNode = range.getCommonAncestor();
				var nearestCell = startNode.getAscendant( { td: 1, th: 1 }, true );
				if ( nearestCell && isInTable( nearestCell ) ) {
					retval.push( nearestCell );
				}
			} else {
				var walker = new CKEDITOR.dom.walker( range );
				var node;
				walker.guard = moveOutOfCellGuard;

				while ( ( node = walker.next() ) ) {
					// If may be possible for us to have a range like this:
					// <td>^1</td><td>^2</td>
					// The 2nd td shouldn't be included.
					//
					// So we have to take care to include a td we've entered only when we've
					// walked into its children.

					if ( node.type != CKEDITOR.NODE_ELEMENT || !node.is( CKEDITOR.dtd.table ) ) {
						var parent = node.getAscendant( { td: 1, th: 1 }, true );
						if ( parent && !parent.getCustomData( 'selected_cell' ) && isInTable( parent ) ) {
							CKEDITOR.dom.element.setMarker( database, parent, 'selected_cell', true );
							retval.push( parent );
						}
					}
				}
			}
		}

		CKEDITOR.dom.element.clearAllMarkers( database );

		return retval;
	}

	function getFocusElementAfterDelCells( cellsToDelete ) {
		var i = 0,
			last = cellsToDelete.length - 1,
			database = {},
			cell, focusedCell, tr;

		while ( ( cell = cellsToDelete[ i++ ] ) )
			CKEDITOR.dom.element.setMarker( database, cell, 'delete_cell', true );

		// 1.first we check left or right side focusable cell row by row;
		i = 0;
		while ( ( cell = cellsToDelete[ i++ ] ) ) {
			if ( ( focusedCell = cell.getPrevious() ) && !focusedCell.getCustomData( 'delete_cell' ) || ( focusedCell = cell.getNext() ) && !focusedCell.getCustomData( 'delete_cell' ) ) {
				CKEDITOR.dom.element.clearAllMarkers( database );
				return focusedCell;
			}
		}

		CKEDITOR.dom.element.clearAllMarkers( database );

		// 2. then we check the toppest row (outside the selection area square) focusable cell
		tr = cellsToDelete[ 0 ].getParent();
		if ( ( tr = tr.getPrevious() ) )
			return tr.getLast();

		// 3. last we check the lowerest  row focusable cell
		tr = cellsToDelete[ last ].getParent();
		if ( ( tr = tr.getNext() ) )
			return tr.getChild( 0 );

		return null;
	}

	//插入行时，连同数据元一并插入
	function dataSourceCopy(editor,cloneNewRow,copyDatasourceNodes){
		cloneNewRow.$.childNodes.forEach(function(item,index){
			if(copyDatasourceNodes[index]){
				for(var i=0;i<copyDatasourceNodes[index].length;i++){
					var dataSourceName;
					var copyNode = copyDatasourceNodes[index][i];
					if($(copyNode).attr('copy-datasource')){
						dataSourceName = $(copyNode).attr('copy-data-hm-name');
					}else{
						dataSourceName = $(copyNode).attr('data-hm-name');
					}
					//给插入的行添加数据元(把复制的数据元的值去掉)
					var node;
					var newId = wrapperUtils.getGUID();
					var type = $(copyNode).attr('data-hm-node');
					switch(type){
						case 'newtextbox':
							node = new CKEDITOR.dom.element(copyNode).clone(true);
							var textContent = node.find('.new-textbox-content').$[0];
							$(textContent).attr('_placeholdertext',true);
							var placeholdertext = node.getAttribute('_placeholder');
							$(textContent).text(placeholdertext);
							break;
						case 'searchbox':
							node = new CKEDITOR.dom.element(copyNode).clone();
							$(node).attr('_searchpair',dataSourceName+'_'+newId);
							$(node.$).removeAttr('_code _name');
							$(node.$).css("display","inline-block");
							break;
						case 'radiobox':
						case 'checkbox':
							node = new CKEDITOR.dom.element(copyNode).clone(true);
							var selectedNodes = $(node.$).find('span[_selected]');
							selectedNodes.removeAttr('_selected');
							if(type==='radiobox'){
								selectedNodes.removeClass('fa-dot-circle-o').addClass('fa-circle-o');
							}else{
								selectedNodes.removeClass('fa-check-square-o').addClass('fa-square-o');
							}
							break;
						case 'textboxwidget':
							node = new CKEDITOR.dom.element(copyNode).clone();
							var wrapNode = new CKEDITOR.dom.element('span');
							wrapNode.addClass('textboxWidget');
							wrapNode.append(node);
							editor.widgets.initOn(wrapNode, 'textboxWidget');
							item.append(wrapNode.$);
							break;
						case 'labelbox':
							node = new CKEDITOR.dom.element(copyNode).clone(true);
							break;
						default:
							node = new CKEDITOR.dom.element(copyNode).clone();
							break;
					}
					$(node).attr('copy-datasource',true);
					$(node).attr('copy-data-hm-name',dataSourceName);
					var table = $(copyNode).parents('table')[0];
					var tableType = '';

					$(node).attr('data-hm-name',dataSourceName+(tableType == 'row'?'':'_'+newId));
					$(node).attr('data-hm-id',newId);
					if(type==='textboxwidget'||type==='searchbox'||type==='timebox'||type==='dropbox'){
						$(node.$).css("min-height","24px");
					}
					if (type !== 'textboxwidget') {
						item.append(node.$);
					}
				}
			}
		})
	}

	function insertRow(editor, selectionOrCells, insertBefore, insertNum, insertWithDataSource) {
		if (!insertNum) {
			insertNum = 1;
		}
		var cells = isArray( selectionOrCells ) ? selectionOrCells : getSelectedCells( selectionOrCells ),
			firstCell = cells[ 0 ],
			table = firstCell.getAscendant( 'table' ),
			doc = firstCell.getDocument(),
			startRow = cells[ 0 ].getParent(),
			startRowIndex = startRow.$.rowIndex,
			lastCell = cells[ cells.length - 1 ],
			endRowIndex = lastCell.getParent().$.rowIndex + lastCell.$.rowSpan - 1,
			endRow = new CKEDITOR.dom.element( table.$.rows[ endRowIndex ] ),
			rowIndex = insertBefore ? startRowIndex : endRowIndex,
			row = insertBefore ? startRow : endRow;

		var map = CKEDITOR.tools.buildTableMap( table ),
			cloneRow = map[ rowIndex ],
			nextRow = insertBefore ? map[ rowIndex - 1 ] : map[ rowIndex + 1 ],
			width = map[ 0 ].length;

		var newRow = doc.createElement( 'tr' );
		var copyDatasourceNodes = {};
		for ( var i = 0; cloneRow[ i ] && i < width; i++ ) {
			var cell;
			// Check whether there's a spanning row here, do not break it.
			if ( cloneRow[ i ].rowSpan > 1 && nextRow && cloneRow[ i ] == nextRow[ i ] ) {
				cell = cloneRow[ i ];
				cell.rowSpan += insertNum;
			} else {
				cell = new CKEDITOR.dom.element( cloneRow[ i ] ).clone();
				if(insertWithDataSource){
					var dataSourceNodes = $(cloneRow[ i ]).find('span[data-hm-name]');
					if(dataSourceNodes.length){
						//复制行内所有数据元
						copyDatasourceNodes[newRow.$.childNodes.length] = dataSourceNodes;
					}else{
						//单元格内没有数据元的情况下，添加<br>，避免单元格无高度
						cell.appendBogus();
					}
				}else{
					cell.appendBogus();
				}
				cell.removeAttribute( 'rowSpan' );
				newRow.append( cell );
				cell = cell.$;
			}

			i += cell.colSpan - 1;
		}
		if (insertNum === 1) {
			if(insertWithDataSource){
				dataSourceCopy(editor,newRow,copyDatasourceNodes);
			}
			insertBefore ? newRow.insertBefore(row) : newRow.insertAfter(row);
		} else {
			for (var j = 0; j < insertNum; j++) {
				if (j < insertNum - 1) {
					cloneNewRow = newRow.clone(true);
				}else{
					cloneNewRow = newRow;
				}
				if(insertWithDataSource){
					dataSourceCopy(editor,cloneNewRow,copyDatasourceNodes);
				}
				insertBefore ? cloneNewRow.insertBefore(row) : cloneNewRow.insertAfter(row);
			}
		}
	}

	function deleteRows( selectionOrRow ) {
		if ( selectionOrRow instanceof CKEDITOR.dom.selection ) {
			var ranges = selectionOrRow.getRanges(),
				cells = getSelectedCells( selectionOrRow ),
				firstCell = cells[ 0 ],
				table = firstCell.getAscendant( 'table' ),
				map = CKEDITOR.tools.buildTableMap( table ),
				startRow = cells[ 0 ].getParent(),
				startRowIndex = startRow.$.rowIndex,
				lastCell = cells[ cells.length - 1 ],
				endRowIndex = lastCell.getParent().$.rowIndex + lastCell.$.rowSpan - 1,
				rowsToDelete = [];

			selectionOrRow.reset();

			// Delete cell or reduce cell spans by checking through the table map.
			for ( var i = startRowIndex; i <= endRowIndex; i++ ) {
				var mapRow = map[ i ],
					row = new CKEDITOR.dom.element( table.$.rows[ i ] );

				for ( var j = 0; j < mapRow.length; j++ ) {
					var cell = new CKEDITOR.dom.element( mapRow[ j ] ),
						cellRowIndex = cell.getParent().$.rowIndex;

					if ( cell.$.rowSpan == 1 )
						cell.remove();
					// Row spanned cell.
					else {
						// Span row of the cell, reduce spanning.
						cell.$.rowSpan -= 1;
						// Root row of the cell, root cell to next row.
						if ( cellRowIndex == i ) {
							var nextMapRow = map[ i + 1 ];
							nextMapRow[ j - 1 ] ? cell.insertAfter( new CKEDITOR.dom.element( nextMapRow[ j - 1 ] ) ) : new CKEDITOR.dom.element( table.$.rows[ i + 1 ] ).append( cell, 1 );
						}
					}

					j += cell.$.colSpan - 1;
				}

				rowsToDelete.push( row );
			}

			var rows = table.$.rows;

			// After deleting whole table, the selection would be broken,
			// therefore it's safer to move it outside the table first.
			ranges[ 0 ].moveToPosition( table, CKEDITOR.POSITION_BEFORE_START );

			// Where to put the cursor after rows been deleted?
			// 1. Into next sibling row if any;
			// 2. Into previous sibling row if any;
			// 3. Into table's parent element if it's the very last row.
			var cursorPosition = new CKEDITOR.dom.element( rows[ endRowIndex + 1 ] || ( startRowIndex > 0 ? rows[ startRowIndex - 1 ] : null ) || table.$.parentNode );

			for ( i = rowsToDelete.length; i >= 0; i-- ) {
				deleteRows( rowsToDelete[ i ] );
			}

			// If all the rows were removed, table gets removed too.
			if ( !table.$.parentNode ) {
				ranges[ 0 ].select();
				return null;
			}

			return cursorPosition;
		} else if ( selectionOrRow instanceof CKEDITOR.dom.element ) {
			table = selectionOrRow.getAscendant( 'table' );

			if ( table.$.rows.length == 1 ) {
				table.remove();
			} else {
				selectionOrRow.remove();
			}
		}

		return null;
	}

	function getValues(tr,index,count) {
		var values = [];
		var hmNodes = [];
		function getNames(node,from) {

			node.childNodes.forEach(function (item,i){
				if (item.nodeType === 1 && item.getAttribute('data-hm-node')!= 'labelbox') {
					if (from) {
						if (count) {
							if (index<(count/2)) {
								if (i>=(count/2)) {
									return;
								}
							} else {
								if (i<(count/2)) {
									return;
								}
							}
						}
					}
					if (item.getAttribute('data-hm-name')) {
						if (item.getAttribute('data-hm-node') === 'searchbox') {
							values.push({
								 _code: item.getAttribute('_code')?item.getAttribute('_code'):'',
								 _name: item.getAttribute('_name')?item.getAttribute('_name'):'',
								 style: item.getAttribute('style')?item.getAttribute('style'):'',
								 value: item.innerHTML });
						} else {
							values.push(item.innerHTML);
						}
						hmNodes.push(item);
					} else {
						getNames(item);
					}
				}
			});
		}
		getNames(tr,'tr');
		return { values: values, hmNodes: hmNodes };
	}

	function setValues(values,nodes){
		nodes.forEach(function (item,index){
			if(typeof values[index]==='object'){
				item.setAttribute('_code',values[index]['_code']);
				item.setAttribute('_name',values[index]['_name']);
				item.setAttribute('style',values[index]['style'])
				item.innerHTML=values[index]['value'];
			}else{
				item.innerHTML=values[index];
			}
		})
	}

	/**
	 * 行移动顺序 addBy liwenjuan 2020/12/22
	 * @param {*} cells
	 * @param {*} direction
	 */
	function rowOrderMove(editor, direction) {
		var selection = editor.getSelection(),
		cells = getSelectedCells( selection );
		var firstCell = cells[ 0 ];
		if(!firstCell){
			//右键调用菜单时存储当前滚动条位置，若当前行未获焦则将滚动条滚动至之前存储的位置
			editor.document.$.documentElement.scrollTop=editor.scrollTop;
			editor.showNotification("请获焦当前行再移动属性！", "info");
			return;
		}
		table = firstCell.getAscendant( 'table' ),
		map = CKEDITOR.tools.buildTableMap( table ),
		startRow = cells[ 0 ].getParent(),
		startRowIndex = startRow.$.rowIndex,
		lastCell = map[startRowIndex][map[startRowIndex].length -1];
		allTrs = table.$.rows;
		var newRow = null;
		switch(direction) {
			case 'up':
				if(startRowIndex == 0){
					editor.showNotification(editor.lang.table.invalidRowMoveUp, 'warn');
					break;
				}
				var prevRow_lastCol = map[startRowIndex - 1][map[startRowIndex - 1].length -1];
				if(prevRow_lastCol.rowSpan > 1 || lastCell.rowSpan > 1){
					editor.showNotification("当前行或上一行有单元格合并，不能调整顺序！", "warn");
					break;
				}
                //病案首页手术移动时只交换内容，不移动数据元
                var operation = $(startRow.$).find('span[data-hm-name^=手术及操作编码]')[0];
                var diagnose = $(startRow.$).find('span[data-hm-name^=出院诊断_其他诊断]')[0]
                || $(startRow.$).find('span[data-hm-name^=出院西医诊断_]')[0]
                || $(startRow.$).find('span[data-hm-name^=出院中医诊断_]')[0];
                if(operation||diagnose){
                    lastRow=allTrs[startRowIndex - 1];
                    var index = diagnose ? firstCell.getIndex() : null;
                    var count = diagnose ? startRow.getChildCount() : null;
                    var startRowInfo=getValues(startRow.$,index,count);
                    var lastRowInfo=getValues(lastRow,index,count);
                    setValues(startRowInfo.values,lastRowInfo.hmNodes);
                    setValues(lastRowInfo.values,startRowInfo.hmNodes);
                    break;
                }
				newRow = startRow.clone(true);
				newRow.insertBefore(new CKEDITOR.dom.element(allTrs[startRowIndex - 1]));
				startRow.remove();
				break;
			case 'down':
				if(startRowIndex == map.length - 1){
					editor.showNotification(editor.lang.table.invalidRowMoveDown, 'warn');
					break;
				}
				var nextRow_lastCol = map[startRowIndex + 1][map[startRowIndex + 1].length -1];
				if(nextRow_lastCol.rowSpan > 1 || lastCell.rowSpan > 1){
					editor.showNotification("当前行或下一行有单元格合并，不能调整顺序！", "warn");
					break;
				}
				//病案首页手术移动时只交换内容，不移动数据元
				var operation = $(startRow.$).find('span[data-hm-name^=手术及操作编码]')[0];
                var diagnose = $(startRow.$).find('span[data-hm-name^=出院诊断_其他诊断]')[0]
                || $(startRow.$).find('span[data-hm-name^=出院西医诊断_]')[0]
                || $(startRow.$).find('span[data-hm-name^=出院中医诊断_]')[0];
                if(operation||diagnose){
                    nextRow=allTrs[startRowIndex + 1];
                    var index = diagnose ? firstCell.getIndex() : null;
                    var count = diagnose ? startRow.getChildCount() : null;
                    var startRowInfo=getValues(startRow.$,index,count);
                    var nextRowInfo=getValues(nextRow,index,count);
                    setValues(startRowInfo.values,nextRowInfo.hmNodes);
                    setValues(nextRowInfo.values,startRowInfo.hmNodes);
                    break;
                }
				newRow = startRow.clone(true);
				newRow.insertAfter(new CKEDITOR.dom.element(allTrs[startRowIndex + 1]));
				startRow.remove();
				break;
		}
		if(newRow && selection.getRanges()[0]){
			var range = selection.getRanges()[0];
			range.moveToElementEditStart(newRow.getChild(firstCell.$.cellIndex));
			range.select();
		}
	}

	// 这个函数不得行, 没考虑之前行的合并单元格
	function getCellColIndex( cell, isStart ) {
		var row = cell.getParent(),
			rowCells = row.$.cells;

		var colIndex = 0;
		for ( var i = 0; i < rowCells.length; i++ ) {
			var mapCell = rowCells[ i ];
			colIndex += isStart ? 1 : mapCell.colSpan;
			if ( mapCell == cell.$ )
				break;
		}

		return colIndex - 1;
	}

	// 考虑之前行的合并单元格后的函数
	function getMappedCellColIndex(tableMap, cell, isStart) {
		var row = cell.getParent(),
			rowIndex = row.getIndex(),
			mappedRow = tableMap[rowIndex];

		var colIndex = 0;
		while (colIndex < mappedRow.length && mappedRow[colIndex] !== cell.$) {
			colIndex++;
		}
		if (!isStart) {
			colIndex += mappedRow[colIndex].colSpan - 1;
		}
		return colIndex;
	}

	function getColumnsIndices(tableMap, cells, isStart) {
		var retval = isStart ? Infinity : 0;
		for (var i = 0; i < cells.length; i++) {
			var colIndex = getMappedCellColIndex(tableMap, cells[i], isStart);
			retval = isStart ? Math.min(colIndex, retval) : Math.max(colIndex, retval);
		}
		return retval;
	}

	function insertColumn(selectionOrCells, insertBefore, insertNum) {
		if (!insertNum) {
			insertNum = 1;
		}
		var cells = isArray( selectionOrCells ) ? selectionOrCells : getSelectedCells( selectionOrCells ),
			firstCell = cells[0],
			table = firstCell.getAscendant('table'),
			map = CKEDITOR.tools.buildTableMap(table),
			colIndex = getColumnsIndices(map, cells, insertBefore),
			originalCell;

		var cloneCol = [],
			nextCol = [],
			height = map.length;

		for ( var i = 0; i < height; i++ ) {
			cloneCol.push( map[ i ][ colIndex ] );
			var nextCell = insertBefore ? map[ i ][ colIndex - 1 ] : map[ i ][ colIndex + 1 ];
			nextCol.push( nextCell );
		}
		for (var insertIndex = 0; insertIndex < insertNum; insertIndex++) {
			for ( i = 0; i < height; i++ ) {
				var cell;
				if ( !cloneCol[ i ] )
					continue;
				var cloneColWidth = cloneCol[i].style.width;
				var cloneColWidthNum = parseFloat(cloneColWidth);
				// Check whether there's a spanning column here, do not break it.
				if ( cloneCol[ i ].colSpan > 1 && nextCol[ i ] == cloneCol[ i ] ) {
					cell = cloneCol[ i ];
					cell.colSpan += 1;
				} else {
					originalCell = new CKEDITOR.dom.element( cloneCol[ i ] );
					cell = originalCell.clone();
					cell.removeAttribute( 'colSpan' );
					cell.appendBogus();
					if (cloneColWidthNum) {
						var unit = /[a-z,%]/.exec(cloneColWidth);
						unit = unit ? cloneColWidth.substr(unit.index) : '';
						cell.setStyle('width', (cloneColWidthNum / (insertNum + 1)) + unit);
						if (insertIndex === insertNum - 1) {
							cloneCol[i].style.width = (cloneColWidthNum / (insertNum + 1)) + unit;
						}
					}
					cell[ insertBefore ? 'insertBefore' : 'insertAfter' ].call( cell, originalCell );
					cell = cell.$;
				}
				i += cell.rowSpan - 1;
			}
		}

		// 更新 colgroup
		var colgroup = table.find('colgroup').getItem(0);
		if (colgroup) {
			var oldCol = colgroup.getChildren().getItem(colIndex);
			var newCols = [];
			// col 的话, 随便往哪一边加无所谓
			for (var j = 0; j < insertNum; j++) {
				var newCol = new CKEDITOR.dom.element('col');
				newCols.push(newCol);
				newCol.insertBefore(oldCol);
			}
			var colWidth = oldCol.getStyle('width');
			var colWidthNum = parseFloat(colWidth);
			// 宽度数值 / 2, 加上宽度单位
			if (colWidthNum) {
				var unit = /[a-z,%]/.exec(colWidth);
				unit = unit ? colWidth.substr(unit.index) : '';
				for (var colIndex = 0; colIndex < newCols.length; colIndex++) {
					newCols[colIndex].setStyle('width', (colWidthNum / (insertNum + 1)) + unit);
				}
				oldCol.setStyle('width', (colWidthNum / (insertNum + 1)) + unit);
			}
		}
	}

	function deleteColumns( selection ) {
		var ranges = selection.getRanges(),
			cells = getSelectedCells( selection ),
			firstCell = cells[ 0 ],
			lastCell = cells[ cells.length - 1 ],
			table = firstCell.getAscendant( 'table' ),
			map = CKEDITOR.tools.buildTableMap( table ),
			startColIndex, endColIndex,
			rowsToDelete = [],
			colgroup = table.find('colgroup').getItem(0);

		selection.reset();

		// Figure out selected cells' column indices.
		for ( var i = 0, rows = map.length; i < rows; i++ ) {
			for ( var j = 0, cols = map[ i ].length; j < cols; j++ ) {
				if ( map[ i ][ j ] == firstCell.$ )
					startColIndex = j;
				if ( map[ i ][ j ] == lastCell.$ )
					endColIndex = j;
			}
		}

		// Delete cell or reduce cell spans by checking through the table map.
		for ( i = startColIndex; i <= endColIndex; i++ ) {
			if (colgroup) {
				colgroup.getChildren().getItem(startColIndex).remove();
			}
			for ( j = 0; j < map.length; j++ ) {
				var mapRow = map[ j ],
					row = new CKEDITOR.dom.element( table.$.rows[ j ] ),
					cell = new CKEDITOR.dom.element( mapRow[ i ] );

				if ( cell.$ ) {
					if ( cell.$.colSpan == 1 )
						cell.remove();
					// Reduce the col spans.
					else
						cell.$.colSpan -= 1;

					j += cell.$.rowSpan - 1;

					if ( !row.$.cells.length )
						rowsToDelete.push( row );
				}
			}
		}

		// Where to put the cursor after columns been deleted?
		// 1. Into next cell of the first row if any;
		// 2. Into previous cell of the first row if any;
		// 3. Into table's parent element;
		var cursorPosition = map[0][startColIndex + 1];
		if (!cursorPosition || !cursorPosition.parentNode) {
			cursorPosition = map[0][startColIndex];
		}
		if (!cursorPosition.parentNode) {
			cursorPosition = table.$.parentNode;
		}

		// Delete table rows only if all columns are gone (do not remove empty row).
		if ( rowsToDelete.length == rows ) {
			// After deleting whole table, the selection would be broken,
			// therefore it's safer to move it outside the table first.
			ranges[ 0 ].moveToPosition( table, CKEDITOR.POSITION_AFTER_END );
			ranges[ 0 ].select();

			table.remove();
		}

		return new CKEDITOR.dom.element(cursorPosition);
	}

	function insertCell( selection, insertBefore ) {
		var startElement = selection.getStartElement(),
			cell = startElement.getAscendant( { td: 1, th: 1 }, true );

		if ( !cell )
			return;

		// Create the new cell element to be added.
		var newCell = cell.clone();
		newCell.appendBogus();

		if ( insertBefore )
			newCell.insertBefore( cell );
		else
			newCell.insertAfter( cell );
	}

	function deleteCells( selectionOrCell ) {
		if ( selectionOrCell instanceof CKEDITOR.dom.selection ) {
			var ranges = selectionOrCell.getRanges(),
				cellsToDelete = getSelectedCells( selectionOrCell ),
				table = cellsToDelete[ 0 ] && cellsToDelete[ 0 ].getAscendant( 'table' ),
				cellToFocus = getFocusElementAfterDelCells( cellsToDelete );

			selectionOrCell.reset();

			for ( var i = cellsToDelete.length - 1; i >= 0; i-- ) {
				deleteCells( cellsToDelete[ i ] );
			}

			if ( cellToFocus ) {
				placeCursorInCell( cellToFocus, true );
			} else if ( table ) {
				// After deleting whole table, the selection would be broken,
				// therefore it's safer to move it outside the table first.
				ranges[ 0 ].moveToPosition( table, CKEDITOR.POSITION_BEFORE_START );
				ranges[ 0 ].select();

				table.remove();
			}
		} else if ( selectionOrCell instanceof CKEDITOR.dom.element ) {
			var tr = selectionOrCell.getParent();
			if ( tr.getChildCount() == 1 ) {
				tr.remove();
			} else {
				selectionOrCell.remove();
			}
		}
	}

	// Remove filler at end and empty spaces around the cell content.
	function trimCell( cell ) {
		var bogus = cell.getBogus();
		bogus && bogus.remove();
		cell.trim();
	}

	function placeCursorInCell( cell, placeAtEnd ) {
		var docInner = cell.getDocument(),
			docOuter = CKEDITOR.document;

		// Fixing "Unspecified error" thrown in IE10 by resetting
		// selection the dirty and shameful way (http://dev.ckeditor.com/ticket/10308).
		// We can not apply this hack to IE8 because
		// it causes error (http://dev.ckeditor.com/ticket/11058).
		if ( CKEDITOR.env.ie && CKEDITOR.env.version == 10 ) {
			docOuter.focus();
			docInner.focus();
		}

		var range = new CKEDITOR.dom.range( docInner );
		if ( !range[ 'moveToElementEdit' + ( placeAtEnd ? 'End' : 'Start' ) ]( cell ) ) {
			range.selectNodeContents( cell );
			range.collapse( placeAtEnd ? false : true );
		}
		range.select( true );
	}

	function cellBottomLine(editor, type) {
		var selection = editor.getSelection();
		var cells = getSelectedCells(selection);
		for (var i = cells.length - 1; i >= 0; i--) {
			var cell = cells[i];
			if (type == 'add') {
				cell.addClass('cell-bottom-line');
			} else {
				cell.removeClass('cell-bottom-line');
			}
		}
	}

	function cellInRow( tableMap, rowIndex, cell ) {
		var oRow = tableMap[ rowIndex ];
		if ( typeof cell == 'undefined' )
			return oRow;

		for ( var c = 0; oRow && c < oRow.length; c++ ) {
			if ( cell.is && oRow[ c ] == cell.$ )
				return c;
			else if ( c == cell )
				return new CKEDITOR.dom.element( oRow[ c ] );
		}
		return cell.is ? -1 : null;
	}

	function cellInCol( tableMap, colIndex ) {
		var oCol = [];
		for ( var r = 0; r < tableMap.length; r++ ) {
			var row = tableMap[ r ];
			oCol.push( row[ colIndex ] );

			// Avoid adding duplicate cells.
			if ( row[ colIndex ].rowSpan > 1 )
				r += row[ colIndex ].rowSpan - 1;
		}
		return oCol;
	}

	function mergeCells( selection, mergeDirection, isDetect ) {
		var cells = getSelectedCells( selection );

		// Invalid merge request if:
		// 1. In batch mode despite that less than two selected.
		// 2. In solo mode while not exactly only one selected.
		// 3. Cells distributed in different table groups (e.g. from both thead and tbody).
		var commonAncestor;
		if ( ( mergeDirection ? cells.length != 1 : cells.length < 2 ) || ( commonAncestor = selection.getCommonAncestor() ) && commonAncestor.type == CKEDITOR.NODE_ELEMENT && commonAncestor.is( 'table' ) )
			return false;

		var cell,
			firstCell = cells[ 0 ],
			table = firstCell.getAscendant( 'table' ),
			map = CKEDITOR.tools.buildTableMap( table ),
			mapHeight = map.length,
			mapWidth = map[ 0 ].length,
			startRow = firstCell.getParent().$.rowIndex,
			startColumn = cellInRow( map, startRow, firstCell );

		if ( mergeDirection ) {
			var targetCell;
			try {
				var rowspan = parseInt( firstCell.getAttribute( 'rowspan' ), 10 ) || 1;
				var colspan = parseInt( firstCell.getAttribute( 'colspan' ), 10 ) || 1;

				targetCell = map[ mergeDirection == 'up' ? ( startRow - rowspan ) : mergeDirection == 'down' ? ( startRow + rowspan ) : startRow ][
					mergeDirection == 'left' ?
						( startColumn - colspan ) :
					mergeDirection == 'right' ? ( startColumn + colspan ) : startColumn ];

			} catch ( er ) {
				return false;
			}

			// 1. No cell could be merged.
			// 2. Same cell actually.
			if ( !targetCell || firstCell.$ == targetCell )
				return false;

			// Sort in map order regardless of the DOM sequence.
			cells[ ( mergeDirection == 'up' || mergeDirection == 'left' ) ? 'unshift' : 'push' ]( new CKEDITOR.dom.element( targetCell ) );
		}

		// Start from here are merging way ignorance (merge up/right, batch merge).
		var doc = firstCell.getDocument(),
			lastRowIndex = startRow,
			totalRowSpan = 0,
			totalColSpan = 0,
			totalWidth = 0; //合并单元格时重置表格宽度
			// Use a documentFragment as buffer when appending cell contents.
			frag = !isDetect && new CKEDITOR.dom.documentFragment( doc ),
			dimension = 0;

		var _row = null;//上下合并单元格时只用合并第一行的宽度
		for ( var i = 0; i < cells.length; i++ ) {
			cell = cells[ i ];

			var tr = cell.getParent(),
				cellFirstChild = cell.getFirst(),
				colSpan = cell.$.colSpan,
				rowSpan = cell.$.rowSpan,
				rowIndex = tr.$.rowIndex,
				_usePercent = cell.$.style.width.indexOf('%') > 0;
			    _colWidth = parseFloat(cell.$.style.width),
				colIndex = cellInRow( map, rowIndex, cell );
			if (i === 0) {
				_row = rowIndex;
			}

			// Accumulated the actual places taken by all selected cells.
			dimension += colSpan * rowSpan;
			// Accumulated the maximum virtual spans from column and row.
			totalColSpan = Math.max( totalColSpan, colIndex - startColumn + colSpan );
			totalRowSpan = Math.max( totalRowSpan, rowIndex - startRow + rowSpan );
			if (rowIndex == _row) {
				totalWidth = totalWidth + _colWidth;
			}

			if ( !isDetect ) {
				// Trim all cell fillers and check to remove empty cells.
				if ( trimCell( cell ), cell.getChildren().count() ) {
					// Merge vertically cells as two separated paragraphs.
					if ( rowIndex != lastRowIndex && cellFirstChild && !( cellFirstChild.isBlockBoundary && cellFirstChild.isBlockBoundary( { br: 1 } ) ) ) {
						var last = frag.getLast( CKEDITOR.dom.walker.whitespaces( true ) );
						if ( last && !( last.is && last.is( 'br' ) ) )
							frag.append( 'br' );
					}

					cell.moveChildren( frag );
				}
				i ? cell.remove() : cell.setHtml( '' );
			}
			lastRowIndex = rowIndex;
		}

		if ( !isDetect ) {
			frag.moveChildren( firstCell );

			firstCell.appendBogus();

			if ( totalColSpan >= mapWidth )
				firstCell.removeAttribute( 'rowSpan' );
			else
				firstCell.$.rowSpan = totalRowSpan;

			if ( totalRowSpan >= mapHeight )
				firstCell.removeAttribute( 'colSpan' );
			else {
				firstCell.$.colSpan = totalColSpan;
				if (_usePercent) {
					firstCell.$.style.width = totalWidth+'%';
				} else {
					firstCell.$.style.width = totalWidth+'px';
				}
			}

			// Swip empty <tr> left at the end of table due to the merging.
			var trs = new CKEDITOR.dom.nodeList( table.$.rows ),
				count = trs.count();

			for ( i = count - 1; i >= 0; i-- ) {
				var tailTr = trs.getItem( i );
				if ( !tailTr.$.cells.length ) {
					tailTr.remove();
					count++;
					continue;
				}
			}

			return firstCell;
		}
		// Be able to merge cells only if actual dimension of selected
		// cells equals to the caculated rectangle.
		else {
			return ( totalRowSpan * totalColSpan ) == dimension;
		}
	}

	function horizontalSplitCell( selection, isDetect ) {
		var cells = getSelectedCells( selection );
		if ( cells.length > 1 )
			return false;
		else if ( isDetect ){
			var currentCell = cells[0];
			var rowSpan = parseInt( currentCell.getAttribute('rowspan') );
			if(rowSpan > 1)
				return true;
			else
				return false;
		}

		var cell = cells[ 0 ],
			tr = cell.getParent(),
			table = tr.getAscendant( 'table' ),
			map = CKEDITOR.tools.buildTableMap( table ),
			rowIndex = tr.$.rowIndex,
			colIndex = cellInRow( map, rowIndex, cell ),
			rowSpan = cell.$.rowSpan,
			newCell, newRowSpan, newCellRowSpan, newRowIndex;

		if ( rowSpan > 1 ) {
			newRowSpan = Math.ceil( rowSpan / 2 );
			newCellRowSpan = Math.floor( rowSpan / 2 );
			newRowIndex = rowIndex + newRowSpan;
			var newCellTr = new CKEDITOR.dom.element( table.$.rows[ newRowIndex ] ),
				newCellRow = cellInRow( map, newRowIndex ),
				candidateCell;

			newCell = cell.clone();

			// Figure out where to insert the new cell by checking the vitual row.
			for ( var c = 0; c < newCellRow.length; c++ ) {
				candidateCell = newCellRow[ c ];
				// Catch first cell actually following the column.
				if ( candidateCell.parentNode == newCellTr.$ && c > colIndex ) {
					newCell.insertBefore( new CKEDITOR.dom.element( candidateCell ) );
					break;
				} else {
					candidateCell = null;
				}
			}

			// The destination row is empty, append at will.
			if ( !candidateCell )
				newCellTr.append( newCell );
		} else {
			newCellRowSpan = newRowSpan = 1;

			newCellTr = tr.clone();
			newCellTr.insertAfter( tr );
			newCellTr.append( newCell = cell.clone() );

			var cellsInSameRow = cellInRow( map, rowIndex );
			for ( var i = 0; i < cellsInSameRow.length; i++ )
				cellsInSameRow[ i ].rowSpan++;
		}

		newCell.appendBogus();

		cell.$.rowSpan = newRowSpan;
		newCell.$.rowSpan = newCellRowSpan;
		if ( newRowSpan == 1 )
			cell.removeAttribute( 'rowSpan' );
		if ( newCellRowSpan == 1 )
			newCell.removeAttribute( 'rowSpan' );

		return newCell;
	}

	function verticalSplitCell( selection, isDetect ) {
		var cells = getSelectedCells( selection );
		if ( cells.length > 1 )
			return false;
		else if ( isDetect ){
			var currentCell = cells[0];
			var rowCols = parseInt( currentCell.getAttribute('colspan') );
			if(rowCols > 1)
				return true;
			else
				return false;
		}
		var cell = cells[ 0 ],
			tr = cell.getParent(),
			table = tr.getAscendant( 'table' ),
			map = CKEDITOR.tools.buildTableMap( table ),
			rowIndex = tr.$.rowIndex,
			colIndex = cellInRow( map, rowIndex, cell ),
			colSpan = cell.$.colSpan,
			newCell, newColSpan, newCellColSpan;

		if ( colSpan > 1 ) {
			newColSpan = Math.ceil( colSpan / 2 );
			newCellColSpan = Math.floor( colSpan / 2 );
		} else {
			newCellColSpan = newColSpan = 1;
			var cellsInSameCol = cellInCol( map, colIndex );
			for ( var i = 0; i < cellsInSameCol.length; i++ )
				cellsInSameCol[ i ].colSpan++;
		}
		newCell = cell.clone();
		newCell.insertAfter( cell );
		newCell.appendBogus();

		cell.$.colSpan = newColSpan;
		newCell.$.colSpan = newCellColSpan;
		if ( newColSpan == 1 )
			cell.removeAttribute( 'colSpan' );
		if ( newCellColSpan == 1 )
			newCell.removeAttribute( 'colSpan' );

		return newCell;
	}

	function hasBottomLine(selection) {
		var cells = getSelectedCells(selection);
		for (var i = cells.length - 1; i >= 0; i--) {
			var cell = cells[i];
			if (cell.hasClass('cell-bottom-line')) {
				return true;
			}
		}
	}

	//////////////////////////////////////////////////////////////
	// region YanJunwei - 临时放这
	// getTableArchitecture 和 后面那个函数(CKEDITOR.tools.buildTableMap) 的功能有些重复....,可以合并, 但是有细微的差别, 以后再合并吧
	var _tableArchitectureTools = function () {
		// 存储页面内所有表格的结构 (代表表格中哪些格子是被其他合并单元格占用的)
		// 因为无法判断用户的操作故每次分页都需要重新初始化
		// 格式: [[table对象, table结构]]
		// table结构: 一个二维数组, 其中每一个元素对应着表格真实位置(看上去的位置); 元素里面的值代表那个位置是被谁占用了
		// 因为每次分页中, 每个表只获取一次结构, 故每次对表操作(拆分/合并)的时候需要更新此结构
		this.allTableArchitectures = [];
	};
	_tableArchitectureTools.prototype = {
		// todo 拆成两个函数可以省去一部分调用中的遍历缓存的时间
		// 扫描表格中所有含有 rowspan/colspan 的格子
		// 因为一个单元格只被一个格子影响, 故用一个二维数组来表示
		getTableArchitecture: function getTableArchitecture(table) {
			// 看看这个表在此次排序中是否被检查过, 有就返回
			for (var i = 0; i < this.allTableArchitectures.length; i++) {
				if (this.allTableArchitectures[i][0] === table) {
					return this.allTableArchitectures[i][1];
				}
			}
			// 因为一个单元格只被一个格子影响, 故用一个二维数组来表示
			var affectedCells = [];
			var rowCount = table.rows.length;
			for (var i = 0; i < rowCount; i++) {
				affectedCells.push([]);
			}

			// 按行扫描 rowIndex, 如果大于1就输出
			for (var rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
				var row = table.rows[rowIndex];

				// 真实列数(视觉上的列数)
				var trueCol = -1;
				// 遍历虚假列数(代码中的列数)
				for (var cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
					var cell = row.cells[cellIndex];

					// 得到真实列数
					trueCol++;
					while (affectedCells[rowIndex][trueCol]) {
						trueCol++;
					}
					var rowSpan = cell.rowSpan;
					var colSpan = cell.colSpan;
					// 预处理: 修正超界的 rowspan
					if (rowSpan + rowIndex > rowCount) {
						rowSpan = rowCount - rowIndex;
						cell.rowSpan = rowSpan;
					}

					// // 如果该格子不影响下一行则直接忽略, 简化之后的计算
					// if (rowSpan === 1) {
					//     affectedCells[rowIndex][trueCol] = false;
					// }
					// // 如果影响下一行
					// else {

					// 将 rowspan 和 colspan 写到 affectedCells 内
					for (var _r = 0; _r < rowSpan; _r++) {
						for (var _c = 0; _c < colSpan; _c++) {
							affectedCells[_r + rowIndex][_c + trueCol] = cell;
						}
					}
					if (rowSpan === 1 && colSpan === 1) {
						affectedCells[rowIndex][trueCol] = false;
					}
					// }
				}
			}
			// 存下这个表的信息
			this.allTableArchitectures.push([table, affectedCells]);
			return affectedCells;
		},

		// 移除指定的 table
		clearTableArchitecture: function clearTableArchitecture(table) {
			for (var i = 0; i < this.allTableArchitectures.length; i++) {
				if (this.allTableArchitectures[i][0] === table) {
					this.allTableArchitectures.splice(i, 1);
					return;
				}
			}
		},

		// 查找最近的独立行 (在 scanUp 方向上未被合并单元格影响的行, 也就是说在那一行的那个方向上画一条线对表格完整性不影响的行)
		// scanUp: 向上/向下查找.
		findClosestCompleteTableRow: function findClosestCompleteTableRow(table, tr, scanUp) {
			var tableArchitecture;

			// 按理来说 this.getTableArchitecture 是存在的, 但是之前出现过找不到这个函数的现象.... 再看看吧
			if (this.getTableArchitecture) {
				tableArchitecture = this.getTableArchitecture(table);
			} else {
				console.warn("this.getTableArchitecture 不存在, 重定向函数位置.");
				tableArchitecture = tabletools.tableArchitectureTools.getTableArchitecture(table);
			}

			var targetRowIndex = tr.rowIndex;// 需要找的行 的行数
			var nowRowIndex = targetRowIndex;
			var cellTmp;
			// 逐层往上找不存在合并行单元格的行
			while (true) {
				var rowArchitecture = tableArchitecture[nowRowIndex];
				for (var cellIndex = 0; cellIndex < rowArchitecture.length; cellIndex++) {
					cellTmp = rowArchitecture[cellIndex];
					// 如果存在合并单元格的格子, 就读取出他的列
					if (cellTmp !== false && cellTmp.rowSpan > 1) {
						targetRowIndex = scanUp ?
							Math.min(targetRowIndex, cellTmp.parentNode.rowIndex) :
							Math.max(targetRowIndex, cellTmp.parentNode.rowIndex + cellTmp.rowSpan - 1);
					}
				}
				if (targetRowIndex === nowRowIndex) {
					break;
				}
				nowRowIndex = targetRowIndex;
			}
			return table.rows[nowRowIndex];
		}
	};
	// endregion

	var tabletools = CKEDITOR.plugins.tabletools = {
		requires: 'table,dialog,contextmenu',

		init: function( editor ) {
			var lang = editor.lang.table,
				styleParse = CKEDITOR.tools.style.parse;

			function createDef( def ) {
				return CKEDITOR.tools.extend( def || {}, {
					contextSensitive: 1,
					refresh: function( editor, path ) {
						this.setState( path.contains( { td: 1, th: 1 }, 1 ) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );
					}
				} );
			}
			function addCmd( name, def ) {
				var cmd = editor.addCommand( name, def );
				editor.addFeature( cmd );
			}

			addCmd( 'cellProperties', new CKEDITOR.dialogCommand( 'cellProperties', createDef( {
				allowedContent: 'td th{width,height,border-color,background-color,white-space,vertical-align,text-align,border-*}[colspan,rowspan]',
				requiredContent: 'table',
				contentTransformations: [ [ {
						element: 'td',
						left: function( element ) {
							return element.styles.background && styleParse.background( element.styles.background ).color;
						},
						right: function( element ) {
							element.styles[ 'background-color' ] = styleParse.background( element.styles.background ).color;
						}
					}, {
						element: 'td',
						check: 'td{vertical-align}',
						left: function( element ) {
							return element.attributes && element.attributes.valign;
						},
						right: function( element ) {
							element.styles[ 'vertical-align' ] = element.attributes.valign;
							delete element.attributes.valign;
						}
					}
					], [
						{
							// (http://dev.ckeditor.com/ticket/16818)
							element: 'tr',
							check: 'td{height}',
							left: function( element ) {
								return element.styles && element.styles.height;
							},
							right: function( element ) {
								CKEDITOR.tools.array.forEach( element.children, function( node ) {
									if ( node.name in { td: 1, th: 1 } ) {
										node.attributes[ 'cke-row-height' ] = element.styles.height;
									}
								} );

								delete element.styles.height;
							}
						}
					], [
						{
							// (http://dev.ckeditor.com/ticket/16818)
							element: 'td',
							check: 'td{height}',
							left: function( element ) {
								var attributes = element.attributes;
								return attributes && attributes[ 'cke-row-height' ];
							},
							right: function( element ) {
								element.styles.height = element.attributes[ 'cke-row-height' ];
								delete element.attributes[ 'cke-row-height' ];
							}
						}
					] ]
			} ) ) );
			CKEDITOR.dialog.add( 'cellProperties', this.path + 'dialogs/tableCell.js' );
			CKEDITOR.dialog.add( 'customInsertRow', this.path + 'dialogs/customInsert.js' );
			CKEDITOR.dialog.add( 'customInsertColumn', this.path + 'dialogs/customInsert.js' );
			addCmd( 'rowDelete', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection(),
						cursorPosition = deleteRows( selection );

					if ( cursorPosition ) {
						placeCursorInCell( cursorPosition );
					}
				}
			} ) );

			addCmd( 'rowInsertBefore', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection(),
						cells = getSelectedCells( selection );

					insertRow( editor,cells, true );
				}
			} ) );

			addCmd( 'rowInsertAfter', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection(),
						cells = getSelectedCells( selection );

					insertRow( editor,cells );
				}
			} ) );

			addCmd( 'customInsertRow', new CKEDITOR.dialogCommand('customInsertRow',createDef( {
				requiredContent: 'table',
			} )));

			addCmd( 'rowMoveUp', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					rowOrderMove(editor, 'up');
				}
			} ) );

			addCmd( 'rowMoveDown', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					rowOrderMove(editor, 'down');
				}
			} ) );

			addCmd( 'columnDelete', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection();
					var element = deleteColumns( selection );

					if ( element ) {
						placeCursorInCell( element, true );
					}
				}
			} ) );

			addCmd( 'columnInsertBefore', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection(),
						cells = getSelectedCells( selection );

					insertColumn( cells, true );
				}
			} ) );

			addCmd( 'columnInsertAfter', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection(),
						cells = getSelectedCells( selection );

					insertColumn( cells );
				}
			} ) );

			addCmd( 'customInsertColumn', new CKEDITOR.dialogCommand('customInsertColumn',createDef( {
				requiredContent: 'table',
			} )));

			addCmd( 'cellDelete', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection();

					deleteCells( selection );
				}
			} ) );

			addCmd( 'cellMerge', createDef( {
				allowedContent: 'td[colspan,rowspan]',
				requiredContent: 'td[colspan,rowspan]',
				exec: function( editor, data ) {
					data.cell = mergeCells( editor.getSelection() );

					placeCursorInCell( data.cell, true );
				}
			} ) );

			addCmd( 'cellMergeRight', createDef( {
				allowedContent: 'td[colspan]',
				requiredContent: 'td[colspan]',
				exec: function( editor, data ) {
					data.cell = mergeCells( editor.getSelection(), 'right' );

					placeCursorInCell( data.cell, true );
				}
			} ) );

			addCmd( 'cellMergeDown', createDef( {
				allowedContent: 'td[rowspan]',
				requiredContent: 'td[rowspan]',
				exec: function( editor, data ) {
					data.cell = mergeCells( editor.getSelection(), 'down' );

					placeCursorInCell( data.cell, true );
				}
			} ) );

			addCmd( 'cellVerticalSplit', createDef( {
				allowedContent: 'td[rowspan]',
				requiredContent: 'td[rowspan]',
				exec: function( editor ) {
					placeCursorInCell( verticalSplitCell( editor.getSelection() ) );
				}
			} ) );

			addCmd( 'cellHorizontalSplit', createDef( {
				allowedContent: 'td[colspan]',
				requiredContent: 'td[colspan]',
				exec: function( editor ) {
					placeCursorInCell( horizontalSplitCell( editor.getSelection() ) );
				}
			} ) );

			addCmd('cellBottomLine', createDef({
				allowedContent: 'td',
				requiredContent: 'td',
				exec: function (editor) {
					cellBottomLine(editor,'add');
				}
			}));

			addCmd('removeCellBottomLine', createDef({
				allowedContent: 'td',
				requiredContent: 'td',
				exec: function (editor) {
					cellBottomLine(editor,'remove');
				}
			}));

			addCmd( 'cellInsertBefore', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection();

					insertCell( selection, true );
				}
			} ) );

			addCmd( 'cellInsertAfter', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					var selection = editor.getSelection();

					insertCell( selection );
				}
			} ) );

			function cellborder_toggle(direction,thick, style){
				var selection = editor.getSelection();
				var cells = getSelectedCells( selection );
				for (var i = cells.length - 1; i >= 0; i--) {
					var cell = cells[i];
					cell.setStyle('border-' + direction + '-width' , thick );
					cell.setStyle('border-' + direction + '-style' , style );
				}
			}

			addCmd( 'cellborder_all_show', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("left","1px",'solid');
					cellborder_toggle("right","1px",'solid');
					cellborder_toggle("top","1px",'solid');
					cellborder_toggle("bottom","1px",'solid');
				}
			} ) );
			addCmd( 'cellborder_all_hide', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("left","1px",'none');
					cellborder_toggle("right","1px",'none');
					cellborder_toggle("top","1px",'none');
					cellborder_toggle("bottom","1px",'none');
				}
			} ) );
			addCmd( 'cellborder_left_show', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("left","1px",'solid');
				}
			} ) );
			addCmd( 'cellborder_left_hide', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("left","0px",'none');
				}
			} ) );
			addCmd( 'cellborder_right_show', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("right","1px",'solid');
				}
			} ) );
			addCmd( 'cellborder_right_hide', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("right","0px",'none');
				}
			} ) );
			addCmd( 'cellborder_top_show', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("top","1px",'solid');
				}
			} ) );
			addCmd( 'cellborder_top_hide', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("top","0px",'none');
				}
			} ) );
			addCmd( 'cellborder_bottom_show', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("bottom","1px",'solid');
				}
			} ) );
			addCmd( 'cellborder_bottom_hide', createDef( {
				requiredContent: 'table',
				exec: function( editor ) {
					cellborder_toggle("bottom","0px",'none');
				}
			} ) );


			// If the "menu" plugin is loaded, register the menu items.
			if ( editor.addMenuItems ) {
				editor.addMenuItems( {
					tablecell: {
						label: lang.cell.menu,
						group: 'tablecell',
						order: 1,
						getItems: function() {
							var selection = editor.getSelection(),
								cells = getSelectedCells( selection );
							var obj = {
								tablecell_merge: mergeCells(selection, null, true) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
								tablecell_split_vertical: verticalSplitCell(selection, true) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
								tablecell_split_horizontal: horizontalSplitCell(selection, true) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
								cellborder: cells.length > 0 ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
							}
							if (hasBottomLine(selection)) {
								obj['tablecell_removeBottomLine'] = CKEDITOR.TRISTATE_OFF;
							} else {
								obj['tablecell_bottomLine'] = cells.length > 0 ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED
							}
							return obj;
						}
					},

					tablecell_insertBefore: {
						label: lang.cell.insertBefore,
						group: 'tablecell',
						command: 'cellInsertBefore',
						order: 5
					},

					tablecell_insertAfter: {
						label: lang.cell.insertAfter,
						group: 'tablecell',
						command: 'cellInsertAfter',
						order: 10
					},

					tablecell_delete: {
						label: lang.cell.deleteCell,
						group: 'tablecell',
						command: 'cellDelete',
						order: 15
					},

					tablecell_merge: {
						label: lang.cell.merge,
						group: 'tablecell',
						command: 'cellMerge',
						order: 16
					},

					tablecell_merge_right: {
						label: lang.cell.mergeRight,
						group: 'tablecell',
						command: 'cellMergeRight',
						order: 17
					},

					tablecell_merge_down: {
						label: lang.cell.mergeDown,
						group: 'tablecell',
						command: 'cellMergeDown',
						order: 18
					},

					tablecell_split_horizontal: {
						label: lang.cell.splitHorizontal,
						group: 'tablecell',
						command: 'cellHorizontalSplit',
						order: 19
					},

					tablecell_split_vertical: {
						label: lang.cell.splitVertical,
						group: 'tablecell',
						command: 'cellVerticalSplit',
						order: 20
					},

					tablecell_properties: {
						label: lang.cell.title,
						group: 'tablecellproperties',
						command: 'cellProperties',
						order: 21
					},

					tablecell_bottomLine: {
						label: lang.cell.bottomLine,
						group: 'tablecell',
						command: 'cellBottomLine',
						order: 22
					},

					tablecell_removeBottomLine: {
						label: lang.cell.removeBottomLine,
						group: 'tablecell',
						command: 'removeCellBottomLine',
						order: 23
					},

					tablerow: {
						label: lang.row.menu,
						group: 'tablerow',
						order: 1,
						getItems: function() {
							return {
								tablerow_insertBefore: CKEDITOR.TRISTATE_OFF,
								tablerow_insertAfter: CKEDITOR.TRISTATE_OFF,
								tablerow_customInsert: CKEDITOR.TRISTATE_OFF,
								tablerow_moveUp:CKEDITOR.TRISTATE_OFF,
								tablerow_moveDown: CKEDITOR.TRISTATE_OFF,
								tablerow_delete: CKEDITOR.TRISTATE_OFF
							};
						}
					},

					tablerow_insertBefore: {
						label: lang.row.insertBefore,
						group: 'tablerow',
						command: 'rowInsertBefore',
						order: 5
					},

					tablerow_insertAfter: {
						label: lang.row.insertAfter,
						group: 'tablerow',
						command: 'rowInsertAfter',
						order: 10
					},

					tablerow_customInsert:{
						label: lang.row.customInsert,
						group: 'tablerow',
						command: 'customInsertRow',
						order: 15
					},

					tablerow_moveUp: {
						label: lang.row.moveUp,
						group: 'tablerow',
						command: 'rowMoveUp',
						order: 20
					},

					tablerow_moveDown: {
						label: lang.row.moveDown,
						group: 'tablerow',
						command: 'rowMoveDown',
						order: 25
					},

					tablerow_delete: {
						label: lang.row.deleteRow,
						group: 'tablerow',
						command: 'rowDelete',
						order: 30
					},

					tablecolumn: {
						label: lang.column.menu,
						group: 'tablecolumn',
						order: 1,
						getItems: function() {
							return {
								tablecolumn_insertBefore: CKEDITOR.TRISTATE_OFF,
								tablecolumn_insertAfter: CKEDITOR.TRISTATE_OFF,
								tablecolumn_customInsert: CKEDITOR.TRISTATE_OFF,
								tablecolumn_delete: CKEDITOR.TRISTATE_OFF
							};
						}
					},

					tablecolumn_insertBefore: {
						label: lang.column.insertBefore,
						group: 'tablecolumn',
						command: 'columnInsertBefore',
						order: 5
					},

					tablecolumn_insertAfter: {
						label: lang.column.insertAfter,
						group: 'tablecolumn',
						command: 'columnInsertAfter',
						order: 10
					},

					tablecolumn_customInsert: {
						label: lang.column.customInsert,
						group: 'tablecolumn',
						command: 'customInsertColumn',
						order: 15
					},

					tablecolumn_delete: {
						label: lang.column.deleteColumn,
						group: 'tablecolumn',
						command: 'columnDelete',
						order: 20
					},

					cellborder: {
						label: '表格边框',
						group: 'tablecell',
						order: 99,
						getItems: function() {
							return {
								cellborder_all_show: CKEDITOR.TRISTATE_OFF,
								cellborder_all_hide: CKEDITOR.TRISTATE_OFF,
								cellborder_left_show: CKEDITOR.TRISTATE_OFF,
								cellborder_left_hide: CKEDITOR.TRISTATE_OFF,
								cellborder_right_show: CKEDITOR.TRISTATE_OFF,
								cellborder_right_hide: CKEDITOR.TRISTATE_OFF,
								cellborder_top_show: CKEDITOR.TRISTATE_OFF,
								cellborder_top_hide: CKEDITOR.TRISTATE_OFF,
								cellborder_bottom_show: CKEDITOR.TRISTATE_OFF,
								cellborder_bottom_hide: CKEDITOR.TRISTATE_OFF,
							};
						}
					},
					cellborder_all_show: {
						label: '显示全边框',
						group: 'tablecell',
						command: 'cellborder_all_show',
						order: 1
					},
					cellborder_all_hide: {
						label: '隐藏全边框',
						group: 'tablecell',
						command: 'cellborder_all_hide',
						order: 2
					},
					cellborder_left_show: {
						label: '显示左边框',
						group: 'tablecell',
						command: 'cellborder_left_show',
						order: 3
					},
					cellborder_left_hide: {
						label: '隐藏左边框',
						group: 'tablecell',
						command: 'cellborder_left_hide',
						order: 4
					},
					cellborder_right_show: {
						label: '显示右边框',
						group: 'tablecell',
						command: 'cellborder_right_show',
						order: 5
					},
					cellborder_right_hide: {
						label: '隐藏右边框',
						group: 'tablecell',
						command: 'cellborder_right_hide',
						order: 6
					},
					cellborder_top_show: {
						label: '显示上边框',
						group: 'tablecell',
						command: 'cellborder_top_show',
						order: 7
					},
					cellborder_top_hide: {
						label: '隐藏上边框',
						group: 'tablecell',
						command: 'cellborder_top_hide',
						order: 8
					},
					cellborder_bottom_show: {
						label: '显示下边框',
						group: 'tablecell',
						command: 'cellborder_bottom_show',
						order: 9
					},
					cellborder_bottom_hide: {
						label: '隐藏下边框',
						group: 'tablecell',
						command: 'cellborder_bottom_hide',
						order: 10
					}
				} );
			}

			// If the "contextmenu" plugin is laoded, register the listeners.
			if ( editor.contextMenu ) {
				editor.contextMenu.addListener( function( element, selection, path ) {
					var cell = path.contains( { 'td': 1, 'th': 1 }, 1 );
					if ( cell && (!cell.isReadOnly()  || !editor.readOnly)) {
						editor.scrollTop =editor.document.$.documentElement.scrollTop;
						if(editor.HMConfig.designMode) {
							return {
								tablecell: CKEDITOR.TRISTATE_OFF,
								tablerow: CKEDITOR.TRISTATE_OFF,
								tablecolumn: CKEDITOR.TRISTATE_OFF
							};
						}
						return {
							tablerow: CKEDITOR.TRISTATE_OFF,
						};
					}

					return null;
				} );
			}

			tabletools.tableArchitectureTools = new _tableArchitectureTools();
		},

		tableArchitectureTools: null,

		// These methods are needed by tableselection plugin, so we must expose them.
		getCellColIndex: getCellColIndex,
		insertRow: insertRow,
		insertColumn: insertColumn,

		getSelectedCells: getSelectedCells
	};
	CKEDITOR.plugins.add( 'tabletools', CKEDITOR.plugins.tabletools );
} )();

/**
 * Creates a two-dimension array that reflects the actual layout of table cells,
 * with cell spans, with mappings to the original `td` elements.
 *
 * It could also create a map for the specified fragment of the table.
 *
 * @param {CKEDITOR.dom.element} table
 * @param {Number} startRow Row index from which the map should be created.
 * @param {Number} startCell Cell index from which the map should be created.
 * @param {Number} endRow Row index to which the map should be created.
 * @param {Number} endCell Cell index to which the map should be created.
 *
 * @member CKEDITOR.tools
 */
CKEDITOR.tools.buildTableMap = function( table, startRow, startCell, endRow, endCell ) {
	var aRows = table.$.rows;

	startRow = startRow || 0;
	startCell = startCell || 0;
	endRow = typeof endRow === 'number' ? endRow : aRows.length - 1;
	endCell = typeof endCell === 'number' ? endCell : -1;

	// Row and Column counters.
	var r = -1;

	var aMap = [];

	for ( var i = startRow; i <= endRow; i++ ) {
		r++;
		!aMap[ r ] && ( aMap[ r ] = [] );

		var c = -1;

		for ( var j = startCell; j <= ( endCell === -1 ? ( aRows[ i ].cells.length - 1 ) : endCell ); j++ ) {
			var oCell = aRows[ i ].cells[ j ];

			if ( !oCell ) {
				break;
			}

			c++;
			while ( aMap[ r ][ c ] )
				c++;

			var iColSpan = isNaN( oCell.colSpan ) ? 1 : oCell.colSpan;
			var iRowSpan = isNaN( oCell.rowSpan ) ? 1 : oCell.rowSpan;

			for ( var rs = 0; rs < iRowSpan; rs++ ) {
				if ( i + rs > endRow ) {
					break;
				}

				if ( !aMap[ r + rs ] )
					aMap[ r + rs ] = [];

				for ( var cs = 0; cs < iColSpan; cs++ ) {
					aMap[ r + rs ][ c + cs ] = aRows[ i ].cells[ j ];
				}
			}

			c += iColSpan - 1;

			if ( endCell !== -1 && c >= endCell ) {
				break;
			}
		}
	}
	return aMap;
};

/**
 * 获取单元格的宽度
 * @param node
 * @return 无格式宽度 (px)
 */
function getTableCellWidth(node){
	var computedStyle = getComputedStyle(node, null);
	return parseFloat(computedStyle.width) + Math.max(parseFloat(computedStyle.borderLeftWidth), parseFloat(computedStyle.borderLeftWidth));
}

/**
 * 根据表格结构来建立 colgroup 标签.
 *
 * @param {node} table
 * @param {boolean} usePercent
 *
 * @return {node} colgroup
 *
 * @member CKEDITOR.tools
 */
CKEDITOR.tools.addColgroup = function (table,usePercent) {
	// 当使用百分比计数时, 如果表格的css宽度小于渲染宽度, 则 把css宽度拉到和渲染宽度一样. (体温记录单)
	if(usePercent){
		var cssStyle=table.style.width;
		// 变为以px为单位
		if (!cssStyle) {
			cssStyle = parseFloat(getComputedStyle(table.parentNode, null).width);
		} else if (cssStyle.indexOf('%') > 0) {
			var percent = parseFloat(cssStyle);
			cssStyle = percent * parseFloat(getComputedStyle(table.parentNode, null).width);
		} else if (cssStyle.indexOf('px') > 0) {
			cssStyle = parseFloat(cssStyle);
		}
		// 如果是像素单位, 则按照以上原则处理宽度
		var trueWidth = getComputedStyle(table, null).width;
		if (typeof cssStyle === 'number' && cssStyle < parseFloat(trueWidth)) {
			table.style.width = trueWidth;
		}
	}


	// 创建 colgroup
	var colgroup = document.createElement('colgroup');
	var tableWidth = parseFloat(getComputedStyle(table, null).width);

	var map = CKEDITOR.tools.buildTableMap(new CKEDITOR.dom.element(table));

	var cell;
	var rowIndex;
	// 当前格子左边的位置
	var trueCellIndex;
	// 当前格子右边的位置
	var scannedColIndex;
	// 下一个要设置宽度的列, 即此数值之前的列均已计算完宽度 (用于计算含有 colspan 的格子中, 表示需要计算的 colspan 的个数)
	var nextColToSet = 0;
	for (scannedColIndex = 0; scannedColIndex < map[0].length; scannedColIndex++) {
		// 看看哪个格子可以计算此列的宽度
		for (rowIndex = 0; rowIndex < map.length; rowIndex++) {
			cell = map[rowIndex][scannedColIndex];
			cell.colSpan = Math.max(1, cell.colSpan);
			// 挑出宽为1的格子
			if (cell.colSpan === 1) {
				trueCellIndex = scannedColIndex;
				break;
			}
			// 挑出其他可以作为参考的格子
			trueCellIndex = scannedColIndex - cell.colSpan + 1;
			if (map[rowIndex][trueCellIndex] === cell) {
				break;
			}
		}

		// 如果没有格子可以计算此列的宽度
		if (rowIndex === map.length) {
			continue;
		}

		// 计算宽度
		var colWidth;
		var indentCol;
		if (usePercent) {
			colWidth = 100 * getTableCellWidth(cell) / tableWidth;
			// 减去已经计算出宽度的列的宽度
			for (indentCol = trueCellIndex; indentCol < nextColToSet; indentCol++) {
				colWidth -= parseFloat(colgroup.childNodes[indentCol].style.width);
			}
			// 单列宽度
			colWidth = colWidth / (1 + scannedColIndex - nextColToSet) + '%';
		} else {
			colWidth = getTableCellWidth(cell);
			// 减去已经计算出宽度的列的宽度
			for (indentCol = trueCellIndex; indentCol < nextColToSet; indentCol++) {
				colWidth -= parseFloat(colgroup.childNodes[indentCol].style.width);
			}
			// 单列宽度
			colWidth = colWidth / (1 + scannedColIndex - nextColToSet) + 'px';
		}

		// 添加 col
		for (indentCol = nextColToSet; indentCol <= scannedColIndex; indentCol++) {
			var col = document.createElement('col');
			col.style.width = colWidth;
			colgroup.appendChild(col);
		}

		// 设置完宽度之后, 重新设置值: 下一个要设置宽度的列
		nextColToSet = 1 + scannedColIndex;
	}
	// 插入 colgroup
	if (table.childNodes.length > 0) {
		table.insertBefore(colgroup, table.firstChild);
	} else {
		table.appendChild(colgroup);
	}
	return colgroup;
};

/**
 * 获取表格的 colgroup 标签. 如果没有就创建一个.
 *
 * @param {node} table
 * @param {boolean} usePercent 采用百分比还是px来表示列宽
 *
 * @return {node} colgroup
 *
 * @member CKEDITOR.tools
 */
CKEDITOR.tools.getOrCreateColgroup = function (table, usePercent) {
	// 如果表格没有 colgroup, 则创建一个 colgroup
	var colgroup = null;
	for (var i = 0; i < table.children.length; i++) {
		if (table.children[i].nodeName === 'COLGROUP') {
			colgroup = table.children[i];
		}
	}
	if (!colgroup) {
		colgroup = CKEDITOR.tools.addColgroup(table, usePercent);
	}
	return colgroup;
};

/**
 * 处理之前由于 col 宽度计算错误 bug 导致的有些列的 col 无宽度的问题
 * 仅限于处理这类问题, 因为没有对 <col> 中的属性进行验证, 只判断了是否有空 <col>.
 *
 * @param {string} html: innerHtml
 *
 * @return {string} 修改后的 html
 *
 * @member CKEDITOR.tools
 */
CKEDITOR.tools.removeErrorCol = function (html) {

	// 如果无 <col> 则跳过.
	if(html.indexOf('<col>') === -1){
		return html;
	}

	var colGroupBegin = html.indexOf('<colgroup>');
	var colGroupEnd = html.indexOf('</colgroup>');
	var bias = '</colgroup>'.length;
	var newHtml = '';

	// 依次扫描所有的 colgroup, 如果发现 '<col>' 就将其删除. (没有宽度的 col)
	while (colGroupBegin !== -1 && colGroupEnd !== -1) {
		var tmpHtml = html.substr(colGroupBegin, colGroupEnd);
		if (tmpHtml.indexOf('<col>') === -1) {
			// 没有 <col> 时
			newHtml += html.substr(0, bias + colGroupEnd);
		} else {
			// 有 <col> 时
			newHtml += html.substr(0, colGroupBegin);
		}
		html = html.substr(bias + colGroupEnd);
		colGroupBegin = html.indexOf('<colgroup>');
		colGroupEnd = html.indexOf('</colgroup>');
	}
	newHtml += html;
	return newHtml;
};
