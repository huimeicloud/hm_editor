/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	var pxUnit = CKEDITOR.tools.cssLength,
		needsIEHacks = CKEDITOR.env.ie && ( CKEDITOR.env.ie7Compat || CKEDITOR.env.quirks );

	function getWidth( el ) {
		return CKEDITOR.env.ie ? el.$.clientWidth : parseFloat( el.getComputedStyle( 'width' ), 10 );
	}

	function getBorderWidth( element, side ) {
		var computed = element.getComputedStyle( 'border-' + side + '-width' ),
			borderMap = {
				thin: '0px',
				medium: '1px',
				thick: '2px'
			};

		if ( computed.indexOf( 'px' ) < 0 ) {
			// look up keywords
			if ( computed in borderMap && element.getComputedStyle( 'border-style' ) != 'none' )
				computed = borderMap[ computed ];
			else
				computed = 0;
		}

		return parseInt( computed, 10 );
	}

	// 创建所有 调整列宽的元素pillar 的集合
	function buildTableColumnPillars(table) {
		var colgroup = new CKEDITOR.dom.element(CKEDITOR.tools.getOrCreateColgroup(table.$, true));

		var pillars = [],
			pillarIndex = -1,
			pillarHeight = 0,
			pillarPosition = null,
			rtl = ( table.getComputedStyle( 'direction' ) == 'rtl' );

		// 取得表格结构
		var map =CKEDITOR.tools.buildTableMap( table );

		// Sets pillar height and position based on given table element (head, body, footer).
		function setPillarDimensions( nativeTableElement ) {
			if ( nativeTableElement ) {
				var tableElement = new CKEDITOR.dom.element( nativeTableElement );
				pillarHeight += tableElement.$.offsetHeight;

				if ( !pillarPosition ) {
					pillarPosition = tableElement.getDocumentPosition();
				}
			}
		}

		// Table may contain only one of thead, tbody or tfoot elements so its existence should be checked (#417).
		setPillarDimensions( table.$.tHead );
		setPillarDimensions( table.$.tBodies[ 0 ] );
		setPillarDimensions( table.$.tFoot );

		{
			// Loop thorugh all cells, building pillars after each one of them.
			// 看看第一行的格子的x轴都在哪, 如果第一行是合并行单元格, 就往后面的行看
			var colIndex, len;
			for (colIndex = 0, len = map[0].length; colIndex < len; colIndex++) {
				// Both the current cell and the successive one will be used in the
				// pillar size calculation.
				var rowIndex;
				// 如果这一行的对应格子和后一个格子是同一个格子, 则往下看一行
				for (rowIndex = 0; rowIndex < map.length && map[rowIndex][colIndex] === map[rowIndex][colIndex + 1]; rowIndex++) {
				}
				pillarIndex++;
				// 不符合要求就跳过
				if (rowIndex === map.length) {
					continue;
				}

				var td = map[rowIndex][colIndex];
				var nextTd = map[rowIndex][colIndex + 1];

				td = new CKEDITOR.dom.element(td);
				nextTd = nextTd && new CKEDITOR.dom.element(nextTd);


				// Calculate the pillar boundary positions.
				// 需要根据 td 的 border 宽度来判断 pillar 的宽度.
				var pillarLeft, pillarRight, pillarWidth;

				var tdWidth = 0;
				var nextTdWidth = 0;

				// Calculate positions based on the current cell.
				var x = td.getDocumentPosition().x;
				tdWidth = td.$.offsetWidth;
				rtl ? pillarRight = x + getBorderWidth( td, 'left' ) : pillarLeft = x + tdWidth - getBorderWidth( td, 'right' );

				// Calculate positions based on the next cell, if available.
				if ( nextTd ) {
					x = nextTd.getDocumentPosition().x;
					nextTdWidth = nextTd.$.offsetWidth;
					rtl ? pillarLeft = x + nextTdWidth - getBorderWidth( nextTd, 'right' ) : pillarRight = x + getBorderWidth( nextTd, 'left' );
				}
				// Otherwise calculate positions based on the table (for last cell).
				else {
					x = table.getDocumentPosition().x;

					rtl ? pillarLeft = x : pillarRight = x + table.$.offsetWidth;
				}

				// // pillar 宽度默认不小于6, 但是不能大于两边任一格子的宽度的1/3, 但两边单元格宽度太小时使 pillar 宽度设为2.
				// pillarWidth = (!nextTd) ? 6 : Math.max(Math.min(tdWidth / 3, nextTdWidth / 3, Math.max(pillarRight - pillarLeft, 6)), 2);
				pillarWidth = (!nextTd) ? 2 : Math.max(Math.min(tdWidth / 3, nextTdWidth / 3, Math.max(pillarRight - pillarLeft, 2)), 2.0);

				// The pillar should reflects exactly the shape of the hovered
				// column border line.
				pillars.push( {
					table: table,
					colgroup: colgroup,
					index: pillarIndex,
					x: pillarLeft - pillarWidth / 2,
					y: pillarPosition.y,
					boundedTd: td,
					width: pillarWidth,
					height: pillarHeight,
					rtl: rtl
				} );
			}
			for (colIndex = 0; colIndex < pillars.length - 1; colIndex++) {
				pillars[colIndex].nextBoundedTd = pillars[colIndex + 1].boundedTd;
			}
		}

		return pillars;
	}

	function getPillarAtPosition( pillars, positionX ) {
		for ( var i = 0, len = pillars.length; i < len; i++ ) {
			var pillar = pillars[ i ];

			if ( positionX >= pillar.x && positionX <= ( pillar.x + pillar.width ) )
				return pillar;
		}

		return null;
	}

	function cancel( evt ) {
		( evt.data || evt ).preventDefault();
	}

	function columnResizer( editor ) {
		var pillar, document, resizer, isResizing, startOffset, currentShift, move;

		var leftSideCol, rightSideCol, leftSideTd, rightSideTd, leftShiftBoundary, rightShiftBoundary;

		function detach() {
			pillar = null;
			currentShift = 0;
			isResizing = 0;

			document.removeListener( 'mouseup', onMouseUp );
			resizer.removeListener( 'mousedown', onMouseDown );
			resizer.removeListener( 'mousemove', onMouseMove );

			document.getBody().setStyle( 'cursor', 'auto' );

			// Hide the resizer (remove it on IE7 - http://dev.ckeditor.com/ticket/5890).
			needsIEHacks ? resizer.remove() : resizer.hide();
		}

		function resizeStart() {
			// Before starting to resize, figure out which cells to change
			// and the boundaries of this resizing shift.

			var columnIndex = pillar.index,
				colgroup = pillar.colgroup.getChildren(),
				rtl = pillar.rtl;

			// Cache the list of cells to be resized.
			leftSideCol = colgroup.getItem(columnIndex + (rtl ? 1 : 0));
			rightSideCol = colgroup.getItem(columnIndex + (rtl ? 0 : 1));
			leftSideTd = rtl ? pillar.nextBoundedTd : pillar.boundedTd;
			rightSideTd = rtl ? pillar.boundedTd : pillar.nextBoundedTd;

			// Cache the resize limit boundaries.
			leftShiftBoundary = pillar.x - (rightSideCol ? leftSideCol.$.offsetWidth : pillar.table.$.offsetWidth);
			rightShiftBoundary = pillar.x + (rightSideCol ? rightSideCol.$.offsetWidth : 1000);

			resizer.setOpacity( 0.5 );
			startOffset = parseInt( resizer.getStyle( 'left' ), 10 );
			currentShift = 0;
			isResizing = 1;

			resizer.on( 'mousemove', onMouseMove );

			// Prevent the native drag behavior otherwise 'mousemove' won't fire.
			document.on( 'dragstart', cancel );
		}

		function resizeEnd() {
			isResizing = 0;

			resizer.setOpacity( 0 );

			currentShift && resizeColumn();

			var table = pillar.table;
			setTimeout( function() {
				table.removeCustomData( '_cke_table_pillars' );
			}, 0 );

			document.removeListener( 'dragstart', cancel );
			editor.fire('group-table-op',{type:'resize',table:table.$});
		}

		function setTableWidth(pillar, index, mapTable, i, usePercent) {
			var cols = pillar.colgroup.find('col').$;
			var colWidthArr = [];
			for (var _colIndex = 0; _colIndex < cols.length; _colIndex++) {
				colWidthArr.push(parseFloat(cols[_colIndex].style.width));
			}
			var realWidth = 0;
			if (mapTable[i][index].colSpan > 1) {
				var realWidth = 0;
				mapTable[i].forEach(function(item, _index){
					if (item == mapTable[i][index]) {
						realWidth += colWidthArr[_index];
					}
				})
			} else {
				realWidth = colWidthArr[index];
			}
			if (usePercent) {
				realWidth = realWidth + '%';
			} else {
				realWidth = pxUnit(realWidth);
			}
			mapTable[i][index].setAttribute('style', 'width:' + realWidth);
		}

		function resizeColumn() {
			var rtl = pillar.rtl;

			// Perform the actual resize to table cells, only for those by side of the pillar.
			{
				var table = pillar.table;
				var tableWidth = getWidth(table);
				var usePercent = pillar.colgroup.getFirst().$.style.width.indexOf('%') > 0;
				var leftOldWidth = leftSideCol && parseFloat(leftSideCol.$.style.width);
				var rightOldWidth = rightSideCol && parseFloat(rightSideCol.$.style.width);
				var tableNewWidth = (!rightSideCol) && currentShift + (tableWidth + getBorderWidth(table, 'left') + getBorderWidth(table, 'right'));
				// 鼠标移动的量, 区分百分比和像素.
				var sizeShift = (usePercent) ? (100 * currentShift / tableWidth) : (currentShift);

				// Defer the resizing to avoid any interference among cells.
				// CKEDITOR.tools.setTimeout(function () {

					// 1px is the minimum valid width (http://dev.ckeditor.com/ticket/11626).
					if (rightSideCol && pillar) {
						var rwidth;
						if (usePercent) {
							rwidth = Math.max(rightOldWidth - sizeShift, 100 / tableWidth) + '%';
						} else {
							rwidth = pxUnit(Math.max(rightOldWidth - sizeShift, 1));
						}
						//rightSideTd.setStyle('width', width);
						rightSideCol.setStyle('width', rwidth);

						// 如果鼠标处于表格右侧边缘, 则仅更改最右边一列
						if (leftSideCol) {
							var lwidth;
							if (usePercent) {
								lwidth = Math.max(leftOldWidth + sizeShift, 100 / tableWidth) + '%';
							} else {
								lwidth = pxUnit(Math.max(leftOldWidth + sizeShift, 1));
							}
							//leftSideTd.setStyle('width', width);
							leftSideCol.setStyle('width', lwidth);
						}
						//循环设置拖拽表格每行相应的前后td宽度
						var tbody=table.$.tBodies[0];//获取表格tbody
						var rows= !tbody? []: tbody.rows;
						var mapTable = CKEDITOR.tools.buildTableMap(table);
						//更改表格宽度时需考虑合并单元格的情况,将合并的几列的宽度相加
						for (var i = 0; i < rows.length; i++) {
							if (mapTable[i][pillar.index + 1]) {
								setTableWidth(pillar, pillar.index + 1, mapTable, i, usePercent);
							}
							if (mapTable[i][pillar.index]) {
								setTableWidth(pillar, pillar.index, mapTable, i, usePercent);
							}
						}
					}
					// 没有 rightSideCol 时才会有 tableNewWidth
					// If we're in the last cell, we need to resize the table as well
					else if ( tableNewWidth )
						table.setStyle( 'width', pxUnit( tableNewWidth + sizeShift * ( rtl ? -1 : 1 ) ) );

					// Cells resizing is asynchronous-y, so we have to use syncing
					// to save snapshot only after all cells are resized. (http://dev.ckeditor.com/ticket/13388)
					editor.fire('saveSnapshot', {
						name: 'resizeColumn',
						leftSideCol: leftSideCol,
						rightSideCol: rightSideCol,
						leftShiftBoundary: leftShiftBoundary,
						rightShiftBoundary: rightShiftBoundary
					});
				// }, 0, this);
			}
		}

		function onMouseDown( evt ) {
			cancel( evt );

			// Save editor's state before we do any magic with cells. (http://dev.ckeditor.com/ticket/13388)
			editor.fire( 'saveSnapshot',{name:'beforeTableResize'} );
			resizeStart();

			document.on( 'mouseup', onMouseUp, this );
		}

		function onMouseUp( evt ) {
			evt.removeListener();

			resizeEnd();
		}

		function onMouseMove( evt ) {
			move( evt.data.getPageOffset().x );
		}

		document = editor.document;

		resizer = CKEDITOR.dom.element.createFromHtml( '<div data-cke-temp=1 contenteditable=false unselectable=on ' +
			'style="position:absolute;cursor:col-resize;filter:alpha(opacity=0);opacity:0;' +
				'padding:0;background-image:none;z-index:10;width:0"></div>', document );

		// Clean DOM when editor is destroyed.
		editor.on( 'destroy', function() {
			resizer.remove();
		} );

		// Except on IE6/7 (http://dev.ckeditor.com/ticket/5890), place the resizer after body to prevent it
		// from being editable.
		if ( !needsIEHacks )
			document.getDocumentElement().append( resizer );

		this.attachTo = function( targetPillar ) {
			// Accept only one pillar at a time.
			if ( isResizing )
				return;

			// On IE6/7, we append the resizer everytime we need it. (http://dev.ckeditor.com/ticket/5890)
			if ( needsIEHacks ) {
				document.getBody().append( resizer );
				currentShift = 0;
			}

			pillar = targetPillar;
			var bodyHeight = editor.document.$.body.offsetHeight;
			resizer.setStyles( {
				borderLeft:pxUnit( targetPillar.width )+' dashed #000',
				height: pxUnit(bodyHeight + 40),
				left: pxUnit( targetPillar.x ),
				top: pxUnit(0)
			} );

			// In IE6/7, it's not possible to have custom cursors for floating
			// elements in an editable document. Show the resizer in that case,
			// to give the user a visual clue.
			needsIEHacks && resizer.setOpacity( 0.25 );

			resizer.on( 'mousedown', onMouseDown, this );

			document.getBody().setStyle( 'cursor', 'col-resize' );

			// Display the resizer to receive events but don't show it,
			// only change the cursor to resizable shape.
			resizer.show();
		};

		move = this.move = function( posX ) {
				if ( !pillar )
					return 0;

				if ( !isResizing && ( posX < pillar.x || posX > ( pillar.x + pillar.width ) ) ) {
					detach();
					return 0;
				}

				var resizerNewPosition = posX - Math.round( resizer.$.offsetWidth / 2 );

				if ( isResizing ) {
					if ( resizerNewPosition == leftShiftBoundary || resizerNewPosition == rightShiftBoundary )
						return 1;
					//360浏览器中leftShiftBoundary,leftShiftBoundary相同，宽度无变化，导致拖拽失效 by liujian
					if(leftShiftBoundary !==rightShiftBoundary){
						resizerNewPosition = Math.max( resizerNewPosition, leftShiftBoundary );
						resizerNewPosition = Math.min( resizerNewPosition, rightShiftBoundary );
					}

					currentShift = resizerNewPosition - startOffset;
				}

				resizer.setStyle( 'left', pxUnit( resizerNewPosition ) );

				return 1;
			};
	}

	function clearPillarsCache( evt ) {
		var target = evt.data.getTarget();

		if ( evt.name == 'mouseout' ) {
			// Bypass interal mouse move.
			if ( !target.is( 'table' ) )
				return;

			var dest = new CKEDITOR.dom.element( evt.data.$.relatedTarget || evt.data.$.toElement );
			while ( dest && dest.$ && !dest.equals( target ) && !dest.is( 'body' ) )
				dest = dest.getParent();
			if ( !dest || dest.equals( target ) )
				return;
		}

		target.getAscendant( 'table', 1 ).removeCustomData( '_cke_table_pillars' );
		evt.removeListener();
	}

	function getTable(node){
		if(node.getParent()){
			if(node.getParent().getName()!=='table'){
				return getTable(node.getParent())
			}else{
				return node.getParent();
			}
		}else{
			return null;
		}
	}

	CKEDITOR.plugins.add( 'tableresize', {
		requires: 'tabletools',

		init: function( editor ) {
			// 不处理的目录 (模板制作除外)
			if (!editor.HMConfig.designMode) {
				return;
			}
			editor.on( 'contentDom', function() {
				var resizer,
					editable = editor.editable();

				// In Classic editor it is better to use document
				// instead of editable so event will work below body.
				editable.attachListener( editable.isInline() ? editable : editor.document, 'mousemove', function( evt ) {

					// 未设置纸张大小时不进行表格列宽的相关操作
					var paperOptPx = editor.plugins.paper.paperOptPx;
					var paperSizeStr = editor.document.$.body.getAttribute('data-hm-paperSize');
					var paperSize = paperSizeStr && paperSizeStr.split('$');
					if (!paperSize || paperSize.length != 2 || !paperOptPx[paperSize[0]]) {
						// editor.showNotification('请设置纸张(齿轮状图标)后再执行打印');
						return;
					}

					evt = evt.data;

					var target = evt.getTarget();

					// FF may return document and IE8 some UFO (object with no nodeType property...)
					// instead of an element (http://dev.ckeditor.com/ticket/11823).
					if ( target.type != CKEDITOR.NODE_ELEMENT )
						return;

					var pageX = evt.getPageOffset().x;
					var pageY = evt.getPageOffset().y;

					// If we're already attached to a pillar, simply move the
					// resizer.
					if ( resizer && resizer.move( pageX ) ) {
						cancel( evt );
						return;
					}

					// Considering table, tr, td, tbody, thead, tfoot but nothing else.
					var table, pillars;

					if ( !target.is( 'table' ) && !target.getAscendant( { thead: 1, tbody: 1, tfoot: 1 }, 1 ) ) {
						return;
					}

					table = target.getAscendant( 'table', 1 );

					// Make sure the table we found is inside the container
					// (eg. we should not use tables the editor is embedded within)
					if ( !editor.editable().contains( table ) ) {
						return;
					}

					var currentTable=getTable(target);
					var tableDisableDrag=false;
					if(currentTable){
						tableDisableDrag = currentTable.getAttribute("_hm_table_disable_drag") == "true";
					}

					if(tableDisableDrag){
						return;
					}

					if ( !( pillars = table.getCustomData( '_cke_table_pillars' ) ) ) {
						// Cache table pillars calculation result.
						table.setCustomData( '_cke_table_pillars', ( pillars = buildTableColumnPillars( table ) ) );
						table.on( 'mouseout', clearPillarsCache );
						table.on( 'mousedown', clearPillarsCache );
					}

					var pillar = getPillarAtPosition( pillars, pageX );
					if ( pillar ) {
						// 获取鼠标所在行数
						pillar.indexY = -1;
						var rows = pillar.table.$.rows;
						for (var i = 0; i < rows.length; i++) {
							if ($(rows[i]).offset().top > pageY) {
								pillar.indexY = i;
								break;
							}
						}
						if (pillar.indexY === -1) {
							pillar.indexY = rows.length - 1;
						}
						!resizer && ( resizer = new columnResizer( editor ) );
						resizer.attachTo( pillar );
					}
				} );
			} );
		}
	} );

} )();
