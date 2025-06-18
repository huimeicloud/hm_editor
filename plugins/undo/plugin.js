/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Undo/Redo system for saving a shapshot for document modification
 *		and other recordable changes.
 */

'use strict';

( function() {
	var keystrokes = [
			CKEDITOR.CTRL + 90 /*Z*/,
			CKEDITOR.CTRL + 89 /*Y*/,
			CKEDITOR.CTRL + CKEDITOR.SHIFT + 90 /*Z*/
		],
		backspaceOrDelete = { 8: 1, 46: 1 };

	CKEDITOR.plugins.add( 'undo', {
		// jscs:disable maximumLineLength
		lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
		// jscs:enable maximumLineLength
		icons: 'redo,redo-rtl,undo,undo-rtl', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var undoManager = editor.undoManager = new UndoManager( editor ),
				editingHandler = undoManager.editingHandler = new NativeEditingHandler( undoManager );

			var undoCommand = editor.addCommand( 'undo', {
				exec: function() {
					if ( undoManager.undo() ) {
						editor.selectionChange();
						this.fire( 'afterUndo' );
					}
				},
				startDisabled: true,
				canUndo: false
			} );

			var redoCommand = editor.addCommand( 'redo', {
				exec: function() {
					if ( undoManager.redo() ) {
						editor.selectionChange();
						this.fire( 'afterRedo' );
					}
				},
				startDisabled: true,
				canUndo: false
			} );

			editor.setKeystroke( [
				[ keystrokes[ 0 ], 'undo' ],
				[ keystrokes[ 1 ], 'redo' ],
				[ keystrokes[ 2 ], 'redo' ]
			] );

			undoManager.onChange = function() {
				undoCommand.setState( undoManager.undoable() ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );
				redoCommand.setState( undoManager.redoable() ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );
			};

			function recordCommand( event ) {
				// If the command hasn't been marked to not support undo.
				// 禁止保存操作触发onchange
				if (undoManager.enabled && event.data.name !== 'save' && event.data.command.canUndo !== false)
					undoManager.save(undefined, undefined, undefined, event);
			}

			// We'll save snapshots before and after executing a command.
			editor.on( 'beforeCommandExec', recordCommand );
			editor.on( 'afterCommandExec', recordCommand );

			// Save snapshots before doing custom changes.
			editor.on( 'saveSnapshot', function( evt ) {
				undoManager.save(
					evt.data && evt.data.contentOnly,
					undefined,
					undefined,
					evt,
					evt.data && evt.data.tagName);
			} );

			// Event manager listeners should be attached on contentDom.
			editor.on( 'contentDom', editingHandler.attachListeners, editingHandler );

			editor.on( 'instanceReady', function(e) {
				// Saves initial snapshot.
				editor.fire( 'saveSnapshot', e );
			} );

			// Always save an undo snapshot - the previous mode might have
			// changed editor contents.
			editor.on( 'beforeModeUnload', function() {
				editor.mode == 'wysiwyg' && undoManager.save( true );
			} );

			function toggleUndoManager() {
				undoManager.enabled = editor.readOnly ? false : editor.mode == 'wysiwyg';
				undoManager.onChange();
			}

			// Make the undo manager available only in wysiwyg mode.
			editor.on( 'mode', toggleUndoManager );

			// Disable undo manager when in read-only mode.
			editor.on( 'readOnly', toggleUndoManager );

			if ( editor.ui.addButton ) {
				editor.ui.addButton( 'Undo', {
					label: editor.lang.undo.undo,
					command: 'undo',
					toolbar: 'undo,10'
				} );

				editor.ui.addButton( 'Redo', {
					label: editor.lang.undo.redo,
					command: 'redo',
					toolbar: 'undo,20'
				} );
			}

			/**
			 * Resets the undo stack.
			 *
			 * @member CKEDITOR.editor
			 */
			editor.resetUndo = function() {
				// Reset the undo stack.
				undoManager.reset();

				// Create the first image.
				editor.fire( 'saveSnapshot' );
			};

			/**
			 * Amends the top of the undo stack (last undo image) with the current DOM changes.
			 *
			 *		function() {
			 *			editor.fire( 'saveSnapshot' );
			 *			editor.document.body.append(...);
			 *			// Makes new changes following the last undo snapshot a part of it.
			 *			editor.fire( 'updateSnapshot' );
			 *			..
			 *		}
			 *
			 * @event updateSnapshot
			 * @member CKEDITOR.editor
			 * @param {CKEDITOR.editor} editor This editor instance.
			 */
			editor.on( 'updateSnapshot', function() {
				if ( undoManager.currentImage )
					undoManager.update();
			} );

			/**
			 * Locks the undo manager to prevent any save/update operations.
			 *
			 * It is convenient to lock the undo manager before performing DOM operations
			 * that should not be recored (e.g. auto paragraphing).
			 *
			 * See {@link CKEDITOR.plugins.undo.UndoManager#lock} for more details.
			 *
			 * **Note:** In order to unlock the undo manager, {@link #unlockSnapshot} has to be fired
			 * the same number of times that `lockSnapshot` has been fired.
			 *
			 * @since 4.0
			 * @event lockSnapshot
			 * @member CKEDITOR.editor
			 * @param {CKEDITOR.editor} editor This editor instance.
			 * @param data
			 * @param {Boolean} [data.dontUpdate] When set to `true`, the last snapshot will not be updated
			 * with the current content and selection. Read more in the {@link CKEDITOR.plugins.undo.UndoManager#lock} method.
			 * @param {Boolean} [data.forceUpdate] When set to `true`, the last snapshot will always be updated
			 * with the current content and selection. Read more in the {@link CKEDITOR.plugins.undo.UndoManager#lock} method.
			 */
			editor.on('lockSnapshot', function (evt) {
				var data = evt.data;
				if (data) {
					undoManager.lock(data.dontUpdate, data.forceUpdate, data);
				} else {
					undoManager.lock();
				}
			});

			/**
			 * Unlocks the undo manager and updates the latest snapshot.
			 *
			 * @since 4.0
			 * @event unlockSnapshot
			 * @member CKEDITOR.editor
			 * @param {CKEDITOR.editor} editor This editor instance.
			 */
			editor.on( 'unlockSnapshot', undoManager.unlock, undoManager );
		}
	} );

	CKEDITOR.plugins.undo = {};

	/**
	 * Main logic for the Redo/Undo feature.
	 *
	 * @private
	 * @class CKEDITOR.plugins.undo.UndoManager
	 * @constructor Creates an UndoManager class instance.
	 * @param {CKEDITOR.editor} editor
	 */
	var UndoManager = CKEDITOR.plugins.undo.UndoManager = function( editor ) {
		/**
		 * An array storing the number of key presses, count in a row. Use {@link #keyGroups} members as index.
		 *
		 * **Note:** The keystroke count will be reset after reaching the limit of characters per snapshot.
		 *
		 * @since 4.4.4
		 */
		this.strokesRecorded = [ 0, 0 ];

		/**
		 * When the `locked` property is not `null`, the undo manager is locked, so
		 * operations like `save` or `update` are forbidden.
		 *
		 * The manager can be locked and unlocked by the {@link #lock} and {@link #unlock}
		 * methods, respectively.
		 *
		 * @readonly
		 * @property {Object} [locked=null]
		 */
		this.locked = null;

		/**
		 * Contains the previously processed key group, based on {@link #keyGroups}.
		 * `-1` means an unknown group.
		 *
		 * @since 4.4.4
		 * @readonly
		 * @property {Number} [previousKeyGroup=-1]
		 */
		this.previousKeyGroup = -1;

		/**
		 * The maximum number of snapshots in the stack. Configurable via {@link CKEDITOR.config#undoStackSize}.
		 *
		 * @readonly
		 * @property {Number} [limit]
		 */
		this.limit = editor.config.undoStackSize || 20;

		/**
		 * The maximum number of characters typed/deleted in one undo step.
		 *
		 * @since 4.4.5
		 * @readonly
		 */
		this.strokesLimit = 25;

		this.editor = editor;

		// Reset the undo stack.
		this.reset();
	};

	UndoManager.prototype = {
		/**
		 * Handles keystroke support for the undo manager. It is called on `keyup` event for
		 * keystrokes that can change the editor content.
		 *
		 * @param {Number} keyCode The key code.
		 * @param {Boolean} [strokesPerSnapshotExceeded] When set to `true`, the method will
		 * behave as if the strokes limit was exceeded regardless of the {@link #strokesRecorded} value.
		 */
		type: function (keyCode, strokesPerSnapshotExceeded, evt) {
			// region 处理数据元的 placeholder
			var $boundaryPair = this.editor.plugins.datasource.getRangeBoundaryNewtextbox();
			if ($boundaryPair) {
				this.editor.editable().fire('togglePlaceHolder', {
					name: 'type',
					data: evt,
					strokesPerSnapshotExceeded: strokesPerSnapshotExceeded,
					keyCode: keyCode,
					container: new CKEDITOR.dom.element($boundaryPair[0]).getAscendant({td: 1, p: 1})
				});
			}
			// endregion



			var keyGroup = UndoManager.getKeyGroup( keyCode ),
				// Count of keystrokes in current a row.
				// Note if strokesPerSnapshotExceeded will be exceeded, it'll be restarted.
				strokesRecorded = this.strokesRecorded[ keyGroup ] + 1;

			strokesPerSnapshotExceeded =
				( strokesPerSnapshotExceeded || strokesRecorded >= this.strokesLimit );

			if ( !this.typing )
				onTypingStart( this );

			if ( strokesPerSnapshotExceeded ) {
				// Reset the count of strokes, so it'll be later assigned to this.strokesRecorded.
				strokesRecorded = 0;
				this.editor.fire('saveSnapshot', {name: 'type', keyCode: keyCode});
			} else {
				// Fire change event.
				this.editor.fire('change', {name: 'type', keyCode: keyCode});
			}

			// Store recorded strokes count.
			this.strokesRecorded[ keyGroup ] = strokesRecorded;
			// This prop will tell in next itaration what kind of group was processed previously.
			this.previousKeyGroup = keyGroup;
		},

		/**
		 * Whether the new `keyCode` belongs to a different group than the previous one ({@link #previousKeyGroup}).
		 *
		 * @since 4.4.5
		 * @param {Number} keyCode
		 * @returns {Boolean}
		 */
		keyGroupChanged: function( keyCode ) {
			return UndoManager.getKeyGroup( keyCode ) != this.previousKeyGroup;
		},

		/**
		 * Resets the undo stack.
		 */
		reset: function() {
			// Stack for all the undo and redo snapshots, they're always created/removed
			// in consistency.
			this.snapshots = [];

			// Current snapshot history index.
			this.index = -1;

			this.currentImage = null;

			this.hasUndo = false;
			this.hasRedo = false;
			this.locked = null;

			this.resetType();
		},

		/**
		 * Resets all typing variables.
		 *
		 * @see #type
		 */
		resetType: function() {
			this.strokesRecorded = [ 0, 0 ];
			this.typing = false;
			this.previousKeyGroup = -1;
		},

		/**
		 * Refreshes the state of the {@link CKEDITOR.plugins.undo.UndoManager undo manager}
		 * as well as the state of the `undo` and `redo` commands.
		 */
		refreshState: function() {
			// These lines can be handled within onChange() too.
			this.hasUndo = !!this.getNextImage(true, this.editor.HMConfig.realtimePageBreak ? 'afterPaging' : '-afterPaging');
			this.hasRedo = !!this.getNextImage(false, this.editor.HMConfig.realtimePageBreak ? 'afterPaging' : '-afterPaging');
			// Reset typing
			this.resetType();
			this.onChange();
		},

		/**
		 * Saves a snapshot of the document image for later retrieval.
		 *
		 * @param {Boolean} onContentOnly If set to `true`, the snapshot will be saved only if the content has changed.
		 * @param {CKEDITOR.plugins.undo.Image} image An optional image to save. If skipped, current editor will be used.
		 * @param {Boolean} [autoFireChange=true] If set to `false`, will not trigger the {@link CKEDITOR.editor#change} event to editor.
		 * @param {object} [event] YanJunwei - 调用此函数的事件名, 用于 editor.fire( 'change' )
		 * @param {string[]} [tags] YanJunwei - 镜像的标签
		 */
		save: function( onContentOnly, image, autoFireChange, event, tags ) {
			// YanJunwei - 纸张大小设置前不触发保存, 应该在设置纸张大小之后再进行保存.
			if (event && event.name === 'beforeCommandExec' && event.data.name === 'paperSize') {
				return;
			}
			var editor = this.editor;
			// Do not change snapshots stack when locked, editor is not ready,
			// editable is not ready or when editor is in mode difference than 'wysiwyg'.
			if ( this.locked || editor.status != 'ready' || editor.mode != 'wysiwyg' )
				return false;

			var editable = editor.editable();
			if ( !editable || editable.status != 'ready' )
				return false;

			var snapshots = this.snapshots;

			// Get a content image.
			if ( !image )
				image = new Image( editor, false, tags );

			// Do nothing if it was not possible to retrieve an image.
			if ( image.contents === false )
				return false;

			// Check if this is a duplicate. In such case, do nothing.
			if ( this.currentImage ) {
				if ( image.equalsContent( this.currentImage ) ) {
					if (onContentOnly || image.equalsSelection(this.currentImage)) {
						// 更新tags
						this.currentImage.updateTagsFrom(image);
						return false;
					}
				} else if ( autoFireChange !== false ) {
					editor.fire('change', event);
				}
			}

			// Drop future snapshots.
			snapshots.splice( this.index + 1, snapshots.length - this.index - 1 );

			// If we have reached the limit, remove the oldest one.
			if ( snapshots.length >= this.limit )
				snapshots.shift();

			// Add the new image, updating the current index.
			this.index = snapshots.push( image ) - 1;

			this.currentImage = image;

			if ( autoFireChange !== false )
				this.refreshState();
			return true;
		},

		/**
		 * Sets editor content/selection to the one stored in `image`.
		 *
		 * @param {CKEDITOR.plugins.undo.Image} image
		 */
		restoreImage: function (image, evt) {
			var that=this;
			function callback4RestoreImage(){

				// Bring editor focused to restore selection.
				var editor = that.editor,
					sel;

				if ( image.bookmarks ) {
					editor.focus();
					// Retrieve the selection beforehand. (http://dev.ckeditor.com/ticket/8324)
					sel = editor.getSelection();
				}

				// 老的锁定状态
				var oldLocked = that.locked;
				// Start transaction - do not allow any mutations to the
				// snapshots stack done when selecting bookmarks (much probably
				// by selectionChange listener).
				that.locked = { level: 999 };

				that.editor.loadSnapshot( image.contents );

				// body 样式
				var body = that.editor.document.getBody();
				for (var _ in image.bodyStyle) {
					body.setStyle(_, image.bodyStyle[_]);
				}

				// initEditPermissions(editor, 'undo');

				try {
					if (image.bookmarks)
						sel.selectBookmarks(image.bookmarks);
					else if (CKEDITOR.env.ie) {
						// IE BUG: If I don't set the selection to *somewhere* after setting
						// document contents, then IE would create an empty paragraph at the bottom
						// the next time the document is modified.
						var $range = that.editor.document.getBody().$.createTextRange();
						$range.collapse(true);
						$range.select();
					}
				} catch (e) {
					console.error(e);
					debugger;
				}

				// 恢复锁定状态
				that.locked = oldLocked;

				that.index = image.index;
				that.currentImage = that.snapshots[ that.index ];

				// Update current image with the actual editor
				// content, since actualy content may differ from
				// the original snapshot due to dom change. (http://dev.ckeditor.com/ticket/4622)
				// ↑ 翻译过来就是 data-cke-widget-id 会变... 所以我们需要保留 tags, data-cke-widget-id 变了就变了
				that.update();
				that.refreshState();

				editor.fire('change', {name: 'restoreImage', data: evt});
			}

			if (!CKEDITOR.plugins.pagebreakCmd.autoPaging) {
				callback4RestoreImage();
			} else {
				var restoreImageWaitPagingComplete = setInterval(function () {
					if (!CKEDITOR.plugins.pagebreakCmd.autoPaging) {
						window.clearInterval(restoreImageWaitPagingComplete);
						callback4RestoreImage();
					}
				}, 10);
			}
		},

		/**
		 * Gets the closest available image.
		 *
		 * @param {Boolean} isUndo If `true`, it will return the previous image.
		 * @param {string} tagName 如果设置了 tagName, 就会在之前的镜像中查找带有该标志的镜像, 如果未找到就返回 null.
		 * 							支持反选: tagName 前面加 "-" 则表示不选择包含此 tagName 的镜像.
		 *
		 * @returns {CKEDITOR.plugins.undo.Image} Next image or `null`.
		 */
		getNextImage: function(isUndo, tagName) {
			var snapshots = this.snapshots,
				currentImage = this.currentImage,
				image, i,
			reverseSelect, tagMatched;

			//deal with &#8203;
			var firstDom = this.editor.document.getBody().getChildren().getItem(0);
			if(firstDom.type === CKEDITOR.NODE_TEXT){
				firstDom.remove();
			}
			if ( currentImage ) {
				if ( isUndo ) {
					for ( i = this.index - 1; i >= 0; i-- ) {
						image = snapshots[ i ];

						// 查找指定 tag.
						if (typeof tagName === 'string') {
							// 反选
							reverseSelect = tagName.startsWith('-');
							if (reverseSelect) {
								tagName = tagName.substr(1);
							}
							tagMatched = image.tags.includes(tagName);

							// (tagMatched && reverseSelect) || (!tagMatched && !reverseSelect)
							if (!(tagMatched ^ reverseSelect)) {
								continue;
							}
						}

						//泰安
						if(image.contents.startsWith("<p><br></p>") || image.contents.startsWith('<div class="emrWidget">')){
							image.index = 0;
							return null;
						}
						if ( !currentImage.equalsContent( image ) ) {
							image.index = i;
							//泰安
							if (i === 2 && snapshots[i - 1].contents.startsWith('<div class="emrWidget">')) {
								return null;
							}
							return image;
						}
					}
				} else {
					for ( i = this.index + 1; i < snapshots.length; i++ ) {
						image = snapshots[ i ];

						// 查找指定 tag.
						if (typeof tagName === 'string') {
							// 反选
							reverseSelect = tagName.startsWith('-');
							if (reverseSelect) {
								tagName = tagName.substr(1);
							}
							tagMatched = image.tags.includes(tagName);
							if (!(tagMatched ^ reverseSelect)) {
								continue;
							}
						}

						if ( !currentImage.equalsContent( image ) ) {
							image.index = i;
							return image;
						}
					}
				}
			}

			return null;
		},

		/**
		 * Checks the current redo state.
		 *
		 * @returns {Boolean} Whether the document has a previous state to retrieve.
		 */
		redoable: function() {
			return this.enabled && this.hasRedo;
		},

		/**
		 * Checks the current undo state.
		 *
		 * @returns {Boolean} Whether the document has a future state to restore.
		 */
		undoable: function() {
			return this.enabled && this.hasUndo;
		},

		/**
		 * Performs an undo operation on current index.
		 */
		undo: function() {
			if ( this.undoable() ) {
				var that = this;
				var undoWaitPagingComplete = setInterval(function () {
					if (!CKEDITOR.plugins.pagebreakCmd.autoPaging) {
						window.clearInterval(undoWaitPagingComplete);
						that.save(true, undefined, undefined, {name: 'undo'});

						var image = that.getNextImage(true, that.editor.HMConfig.realtimePageBreak ? 'afterPaging' :  '-afterPaging');
						if (image)
							return that.restoreImage(image, {name: 'undo'}), true;
					}
				},10);
			}

			return false;
		},

		/**
		 * Performs a redo operation on current index.
		 */
		redo: function() {
			if ( this.redoable() ) {
				// Try to save. If no changes have been made, the redo stack
				// will not change, so it will still be redoable.
				this.save(true, null, null, {name: 'beforeRedo'});

				// If instead we had changes, we can't redo anymore.
				if ( this.redoable() ) {
					var image = this.getNextImage(false, this.editor.HMConfig.realtimePageBreak ? 'afterPaging' :  '-afterPaging');
					if ( image ){}
						return this.restoreImage(image, {name: 'redo'}), true;
				}
			}

			return false;
		},

		/**
		 * Updates the last snapshot of the undo stack with the current editor content.
		 *
		 * @param {CKEDITOR.plugins.undo.Image} [newImage] The image which will replace the current one.
		 * If it is not set, it defaults to the image taken from the editor.
		 * @param {string[]} [tags] 创建镜像时添加标签
		 */
		update: function( newImage, tags ) {
			// Do not change snapshots stack is locked.
			if ( this.locked )
				return;

			if ( !newImage )
				newImage = new Image(this.editor, false, tags);

			var i = this.index,
				snapshots = this.snapshots;

			// Find all previous snapshots made for the same content (which differ
			// only by selection) and replace all of them with the current image.
			while ( i > 0 && this.currentImage.equalsContent( snapshots[ i - 1 ] ) )
				i -= 1;

			snapshots.splice( i, this.index - i + 1, newImage );
			this.index = i;
			newImage.updateTagsFrom(this.currentImage);
			this.currentImage = newImage;
		},

		/**
		 * Amends the last snapshot and changes its selection (only in case when content
		 * is equal between these two).
		 *
		 * @since 4.4.4
		 * @param {CKEDITOR.plugins.undo.Image} newSnapshot New snapshot with new selection.
		 * @returns {Boolean} Returns `true` if selection was amended.
		 */
		updateSelection: function( newSnapshot ) {
			if ( !this.snapshots.length )
				return false;

			var snapshots = this.snapshots,
				lastImage = snapshots[ snapshots.length - 1 ];

			if ( lastImage.equalsContent( newSnapshot ) ) {
				if ( !lastImage.equalsSelection( newSnapshot ) ) {
					snapshots[ snapshots.length - 1 ] = newSnapshot;
					this.currentImage = newSnapshot;
					return true;
				}
			}

			return false;
		},

		/**
		 * Locks the snapshot stack to prevent any save/update operations and when necessary,
		 * updates the tip of the snapshot stack with the DOM changes introduced during the
		 * locked period, after the {@link #unlock} method is called.
		 *
		 * It is mainly used to ensure any DOM operations that should not be recorded
		 * (e.g. auto paragraphing) are not added to the stack.
		 *
		 * **Note:** For every `lock` call you must call {@link #unlock} once to unlock the undo manager.
		 *
		 * @since 4.0
		 * @param {Boolean} [dontUpdate] When set to `true`, the last snapshot will not be updated
		 * with current content and selection. By default, if undo manager was up to date when the lock started,
		 * the last snapshot will be updated to the current state when unlocking. This means that all changes
		 * done during the lock will be merged into the previous snapshot or the next one. Use this option to gain
		 * more control over this behavior. For example, it is possible to group changes done during the lock into
		 * a separate snapshot.
		 * @param {Boolean} [forceUpdate] When set to `true`, the last snapshot will always be updated with the
		 * current content and selection regardless of the current state of the undo manager.
		 * When not set, the last snapshot will be updated only if the undo manager was up to date when locking.
		 * Additionally, this option makes it possible to lock the snapshot when the editor is not in the `wysiwyg` mode,
		 * because when it is passed, the snapshots will not need to be compared.
		 * @param {object} [data] YanJunwei - json 格式数据, 用于传递标签和返回值:
		 * 					data.tags @param {string[]}: 创建镜像时添加标签
		 * 					data.image @return {CKEDITOR.plugin.undo.Image}: 创建的镜像(如有)
		 */
		lock: function( dontUpdate, forceUpdate , data) {
			if (!data) {
				data = {};
			}
			var imageBefore = null;
			if ( !this.locked ) {
				if ( dontUpdate )
					this.locked = { level: 1 };
				else {
					var update = null;

					if ( forceUpdate )
						update = true;
					else {
						// Make a contents image. Don't include bookmarks, because:
						// * we don't compare them,
						// * there's a chance that DOM has been changed since
						// locked (e.g. fake) selection was made, so createBookmark2 could fail.
						// http://dev.ckeditor.com/ticket/11027#comment:3
						imageBefore = new Image(this.editor, true, data.tags);

						// If current editor content matches the tip of snapshot stack,
						// the stack tip must be updated by unlock, to include any changes made
						// during this period.
						if (this.currentImage && this.currentImage.equalsContent(imageBefore)) {
							// 更新 tags
							this.currentImage.updateTagsFrom(imageBefore);
							imageBefore = this.currentImage;
							update = imageBefore;
						}
					}

					this.locked = {update: update, level: 1, tags: data.tags};
				}

			// Increase the level of lock.
			} else {
				this.locked.level++;
			}
			data.image = imageBefore;
		},

		/**
		 * Unlocks the snapshot stack and checks to amend the last snapshot.
		 *
		 * See {@link #lock} for more details.
		 *
		 * @since 4.0
		 */
		unlock: function() {
			if ( this.locked ) {
				// Decrease level of lock and check if equals 0, what means that undoM is completely unlocked.
				if ( !--this.locked.level ) {
					var update = this.locked.update;
					var tags = this.locked.tags;

					this.locked = null;

					// forceUpdate was passed to lock().
					if ( update === true )
						this.update(null, tags);
					// update is instance of Image.
					else if ( update ) {
						var newImage = new Image( this.editor, true, tags );

						if ( !update.equalsContent( newImage ) )
							this.update(null, tags);
					}
				}
			}
		}
	};

	/**
	 * Codes for navigation keys like *Arrows*, *Page Up/Down*, etc.
	 * Used by the {@link #isNavigationKey} method.
	 *
	 * @since 4.4.5
	 * @readonly
	 * @static
	 */
	UndoManager.navigationKeyCodes = {
		37: 1, 38: 1, 39: 1, 40: 1, // Arrows.
		36: 1, 35: 1, // Home, End.
		33: 1, 34: 1 // PgUp, PgDn.
	};

	/**
	 * Key groups identifier mapping. Used for accessing members in
	 * {@link #strokesRecorded}.
	 *
	 * * `FUNCTIONAL` &ndash; identifier for the *Backspace* / *Delete* key.
	 * * `PRINTABLE` &ndash; identifier for printable keys.
	 *
	 * Example usage:
	 *
	 *		undoManager.strokesRecorded[ undoManager.keyGroups.FUNCTIONAL ];
	 *
	 * @since 4.4.5
	 * @readonly
	 * @static
	 */
	UndoManager.keyGroups = {
		PRINTABLE: 0,
		FUNCTIONAL: 1
	};

	// YanJunwei - 被输入法识别为输入状态, 但是没有输入结束状态 (直接写在页面上) 的标点符号
	UndoManager.punctuationCodes =
		['Backquote',
		'Digit1',
		'Digit2',
		'Digit3',
		'Digit4',
		'Digit5',
		'Digit6',
		'Digit7',
		'Digit8',
		'Digit9',
		'Digit0',
		'Minus',
		'Equal',
		'BracketLeft',
		'BracketRight',
		'Backslash',
		'Semicolon',
		'Quote',
		'Comma',
		'Period',
		'Slash'];

	/**
	 * Checks whether a key is one of navigation keys (*Arrows*, *Page Up/Down*, etc.).
	 * See also the {@link #navigationKeyCodes} property.
	 *
	 * @since 4.4.5
	 * @static
	 * @param {Number} keyCode
	 * @returns {Boolean}
	 */
	UndoManager.isNavigationKey = function( keyCode ) {
		return !!UndoManager.navigationKeyCodes[ keyCode ];
	};

	/**
	 * Returns the group to which the passed `keyCode` belongs.
	 *
	 * @since 4.4.5
	 * @static
	 * @param {Number} keyCode
	 * @returns {Number}
	 */
	UndoManager.getKeyGroup = function( keyCode ) {
		var keyGroups = UndoManager.keyGroups;

		return backspaceOrDelete[ keyCode ] ? keyGroups.FUNCTIONAL : keyGroups.PRINTABLE;
	};

	/**
	 * @since 4.4.5
	 * @static
	 * @param {Number} keyGroup
	 * @returns {Number}
	 */
	UndoManager.getOppositeKeyGroup = function( keyGroup ) {
		var keyGroups = UndoManager.keyGroups;
		return ( keyGroup == keyGroups.FUNCTIONAL ? keyGroups.PRINTABLE : keyGroups.FUNCTIONAL );
	};

	/**
	 * Whether we need to use a workaround for functional (*Backspace*, *Delete*) keys not firing
	 * the `keypress` event in Internet Explorer in this environment and for the specified `keyCode`.
	 *
	 * @since 4.4.5
	 * @static
	 * @param {Number} keyCode
	 * @returns {Boolean}
	 */
	UndoManager.ieFunctionalKeysBug = function( keyCode ) {
		return CKEDITOR.env.ie && UndoManager.getKeyGroup( keyCode ) == UndoManager.keyGroups.FUNCTIONAL;
	};

	// Helper method called when undoManager.typing val was changed to true.
	function onTypingStart( undoManager ) {
		// It's safe to now indicate typing state.
		undoManager.typing = true;

		// Manually mark snapshot as available.
		undoManager.hasUndo = true;
		undoManager.hasRedo = false;

		undoManager.onChange();
	}

	/**
	 * Contains a snapshot of the editor content and selection at a given point in time.
	 *
	 * @private
	 * @class CKEDITOR.plugins.undo.Image
	 * @constructor Creates an Image class instance.
	 * @param {CKEDITOR.editor} editor The editor instance on which the image is created.
	 * @param {Boolean} [contentsOnly] If set to `true`, the image will only contain content without the selection.
	 * @param {string[]} [tags] 创建镜像时添加标签
	 */
	var Image = CKEDITOR.plugins.undo.Image = function( editor, contentsOnly, tags ) {
		editor.fire( 'beforeUndoImage' );
		var body = editor.document.getBody();

		// Image 的参数
		this.editor = editor;
		this.contents;
		this.bodyStyle; // YanJunwei - body 的样式: 自动分页会改变 body 的宽/padding/背景色.
		this.paperSize = body.getAttribute('data-hm-papersize'); // YanJunwei - 需要保存纸张大小设置
		this.bookmarks;
		this.tags = []; // YanJunwei - 镜像的标签


		var contents = editor.getSnapshot();
		// In IE, we need to remove the expando attributes.
		if ( CKEDITOR.env.ie && contents )
			contents = contents.replace( /\s+data-cke-expando=".*?"/g, '' );
		this.contents = contents;

		this.bodyStyle={
			width: body.getStyle('width'),
			paddingLeft: body.getStyle('padding-left'),
			paddingRight: body.getStyle('padding-right'),
			background: body.getStyle('background')
		};

		if ( !contentsOnly ) {
			var selection = contents && editor.getSelection();
			try{
			this.bookmarks = selection && selection.createBookmarks2( true );
		}catch(e){
			console.log('创建书签出错',e)}
		}
		if (tags && tags.length) {
			if (typeof tags === 'string') {
				this.tags = [tags];
			} else if (typeof tags === 'object') {// tags 去重
				for (var tagIndex = 0; tagIndex < tags.length; tagIndex++) {
					if (typeof tags[tagIndex] !== 'string') {
						// throw new Error('tags 数组内的元素必须是字符串');
						console.warn('tags 数组内的元素必须是字符串');
					}
					this.tags.push(tags[tagIndex]);
				}
				// this.tags.sort();
			}
		}

		editor.fire( 'afterUndoImage' );
	};

	// Attributes that browser may changing them when setting via innerHTML.
	var protectedAttrs = /\b(?:href|src|name)="[^"]*?"/gi;

	Image.prototype = {
		/**
		 * @param {CKEDITOR.plugins.undo.Image} otherImage Image to compare to.
		 * @returns {Boolean} Returns `true` if content in `otherImage` has the same body style.
		 */
		equalsBodyStyle: function( otherImage ) {
			var thisStyle = this.bodyStyle,
				otherStyle = otherImage.bodyStyle;
			for (var i in thisStyle) {
				if (otherStyle[i] !== thisStyle[i]) {
					return false;
				}
			}
			return true;
		},

		/**
		 * @param {CKEDITOR.plugins.undo.Image} otherImage Image to compare to.
		 * @returns {Boolean} Returns `true` if content in `otherImage` is the same.
		 */
		equalsContent: function( otherImage ) {
			var thisContents = this.contents,
				otherContents = otherImage.contents;

			// For IE7 and IE QM: Comparing only the protected attribute values but not the original ones.(http://dev.ckeditor.com/ticket/4522)
			if ( CKEDITOR.env.ie && ( CKEDITOR.env.ie7Compat || CKEDITOR.env.quirks ) ) {
				thisContents = thisContents.replace( protectedAttrs, '' );
				otherContents = otherContents.replace( protectedAttrs, '' );
			}
			// 去掉零宽字符!!!
			thisContents = thisContents.replace( zeroWidthChar, '' );
			otherContents = otherContents.replace( zeroWidthChar, '' );

			// Yanjunwei - 增加纸张大小判断
			return (thisContents === otherContents) && (this.paperSize === otherImage.paperSize) && (this.equalsBodyStyle(otherImage));
		},

		/**
		 * @param {CKEDITOR.plugins.undo.Image} otherImage Image to compare to.
		 * @returns {Boolean} Returns `true` if selection in `otherImage` is the same.
		 */
		equalsSelection: function( otherImage ) {
			var bookmarksA = this.bookmarks,
				bookmarksB = otherImage.bookmarks;

			if ( bookmarksA || bookmarksB ) {
				if ( !bookmarksA || !bookmarksB || bookmarksA.length != bookmarksB.length )
					return false;

				for ( var i = 0; i < bookmarksA.length; i++ ) {
					var bookmarkA = bookmarksA[ i ],
						bookmarkB = bookmarksB[ i ];

					if ( bookmarkA.startOffset != bookmarkB.startOffset || bookmarkA.endOffset != bookmarkB.endOffset ||
						!CKEDITOR.tools.arrayCompare( bookmarkA.start, bookmarkB.start ) ||
						!CKEDITOR.tools.arrayCompare( bookmarkA.end, bookmarkB.end ) ) {
						return false;
					}
				}
			}

			return true;
		},


		/**
		 * 对 image 赋值的同时更新 tag, 注意: 该行为目前除了 tag 和 paperSize 之外, 均为引用赋值而不是直接赋值.
		 *
		 * @param {CKEDITOR.plugins.undo.Image} otherImage Image to compare to.
		 */
		setImageFrom: function( otherImage ) {
			this.editor = otherImage.editor;
			this.contents = otherImage.contents;
			this.bodyStyle = otherImage.bodyStyle;
			this.paperSize = otherImage.paperSize;
			this.bookmarks = otherImage.bookmarks;
			this.updateTagsFrom(otherImage);
		},

		/**
		 * 对 tags 进行赋值
		 *
		 * @param {CKEDITOR.plugins.undo.Image} otherImage Image to compare to.
		 */
		updateTagsFrom: function(otherImage ) {
			if(!otherImage){
				return;
			}
			// 合并 tags
			for (var otherTagIndex = 0; otherTagIndex < otherImage.tags.length; otherTagIndex++) {
				this.tags.push(otherImage.tags[otherTagIndex]);
			}
			// this.tags.sort();
		},


		/**
		 * 添加一个 tag
		 * @param {string} tag
		 */
		addTag: function (tag) {
			if (typeof tag !== 'string') {
				// throw new Error('tags 数组内的元素必须是字符串');
				console.warn('tags 数组内的元素必须是字符串')
			}
			this.tags.push(tag);
			// this.tags.sort();
		}

		/**
		 * Editor content.
		 *
		 * @readonly
		 * @property {String} contents
		 */

		/**
		 * Bookmarks representing the selection in an image.
		 *
		 * @readonly
		 * @property {Object[]} bookmarks Array of bookmark2 objects, see {@link CKEDITOR.dom.range#createBookmark2} for definition.
		 */
	};

	/**
	 * A class encapsulating all native event listeners which have to be used in
	 * order to handle undo manager integration for native editing actions (excluding drag and drop and paste support
	 * handled by the Clipboard plugin).
	 *
	 * @since 4.4.4
	 * @private
	 * @class CKEDITOR.plugins.undo.NativeEditingHandler
	 * @member CKEDITOR.plugins.undo Undo manager owning the handler.
	 * @constructor
	 * @param {CKEDITOR.plugins.undo.UndoManager} undoManager
	 */
	var NativeEditingHandler = CKEDITOR.plugins.undo.NativeEditingHandler = function( undoManager ) {
		// We'll use keyboard + input events to determine if snapshot should be created.
		// Since `input` event is fired before `keyup`. We can tell in `keyup` event if input occured.
		// That will tell us if any printable data was inserted.
		// On `input` event we'll increase input fired counter for proper key code.
		// Eventually it might be canceled by paste/drop using `ignoreInputEvent` flag.
		// Order of events can be found in http://www.w3.org/TR/DOM-Level-3-Events/

		/**
		 * An undo manager instance owning the editing handler.
		 *
		 * @property {CKEDITOR.plugins.undo.UndoManager} undoManager
		 */
		this.undoManager = undoManager;

		/**
		 * See {@link #ignoreInputEventListener}.
		 *
		 * @since 4.4.5
		 * @private
		 */
		this.ignoreInputEvent = false;

		/**
		 * A stack of pressed keys.
		 *
		 * @since 4.4.5
		 * @property {CKEDITOR.plugins.undo.KeyEventsStack} keyEventsStack
		 */
		this.keyEventsStack = new KeyEventsStack();

		/**
		 * An image of the editor during the `keydown` event (therefore without DOM modification).
		 *
		 * @property {CKEDITOR.plugins.undo.Image} lastKeydownImage
		 */
		this.lastKeydownImage = null;
	};

	NativeEditingHandler.prototype = {
		/**
		 * The `keydown` event listener.
		 *
		 * @param {CKEDITOR.dom.event} evt
		 */
		// 输入之前的选区是否选中多个字符
		rangeCollapsed: false,
		// composing 为输入法编辑状态
		composing: false,
		// IMEinput 为当前键是否为输入法的键
		IMEinput : false,
		IMEChar : '',
		onKeydown: function HandleNativeEdit1( evt ) {
			var keyCode = evt.data.getKey();
			var keyName = evt.data.$.code;

			// 输入前的选区是否为选中状态
			var ranges = evt.sender.editor.getSelection().getRanges();
			if (ranges.length > 1 || (ranges.length && !ranges[0].collapsed)) {
				this.rangeCollapsed = true;
			}

			// The composition is in progress - ignore the key. (http://dev.ckeditor.com/ticket/12597)
			// Yanjunwei - 非输入法编辑状态且输入标点符号则不能忽略此键 (输入法误判成编辑状态); 否则需要 转换成输入法编辑状态 并且 取消后续操作.
			// 229 代表输入法的编辑状态; 搜狗输入法中, 连续两次输入英文方括号时 keyName 会为空.
			if (keyCode === 229 && keyName && (this.IMEinput || UndoManager.punctuationCodes.indexOf(keyName) === -1)) {
				this.composing = true;
				this.IMEinput = true;
				this.IMECode = keyName;
				return;
			}

			// Block undo/redo keystrokes when at the bottom/top of the undo stack (http://dev.ckeditor.com/ticket/11126 and http://dev.ckeditor.com/ticket/11677).
			if ( CKEDITOR.tools.indexOf( keystrokes, evt.data.getKeystroke() ) > -1 ) {
				evt.data.preventDefault();
				return;
			}

			// Cleaning tab functional keys.
			this.keyEventsStack.cleanUp( evt );

			var undoManager = this.undoManager;

			// Gets last record for provided keyCode. If not found will create one.
			var last = this.keyEventsStack.getLast( keyCode );
			if ( !last ) {
				this.keyEventsStack.push( keyCode );
			}

			// We need to store an image which will be used in case of key group
			// change.
			this.lastKeydownImage = new Image( undoManager.editor );

			if ( UndoManager.isNavigationKey( keyCode ) || this.undoManager.keyGroupChanged( keyCode ) ) {
				if ( undoManager.strokesRecorded[ 0 ] || undoManager.strokesRecorded[ 1 ] ) {
					// We already have image, so we'd like to reuse it.

					// http://dev.ckeditor.com/ticket/12300
					undoManager.save( false, this.lastKeydownImage, false );
					undoManager.resetType();
				}
			}
		},

		onCompositionend:function HandleNativeEdit2(){
			this.composing = false;

			// 输入法输入时点击其他地方
			this.rangeCollapsed && this.undoManager.save(null, null, null, {name: '输入法输入意外中断'});
			this.rangeCollapsed = false;
		},

		/**
		 * The `input` event listener.
		 */
		onInput: function HandleNativeEdit3() {
			// YanJunwei - 标点符号会被搜狗输入法判定为输入法, 但是只输入标点符号时不会触发 compositionend 事件.
			if(this.IMEinput){
				switch (this.IMECode) {
					case 'Space':
						this.undoManager.type(0, null, {name: 'onInput', data: this});
						this.rangeCollapsed = false;
						break;
					case 'Escape':
						// esc 是先触发 input 再触发 compositionEnd
						this.rangeCollapsed && this.undoManager.save(null, null, null, {name: '输入法esc'});
						this.rangeCollapsed = false;
						break;
				}
				return;
			}
			// Input event is ignored if paste/drop event were fired before.
			if ( this.ignoreInputEvent ) {
				// Reset flag - ignore only once.
				this.ignoreInputEvent = false;
				this.rangeCollapsed = false;
				return;
			}

			var lastInput = this.keyEventsStack.getLast();
			// Nothing in key events stack, but input event called. Interesting...
			// That's because on Android order of events is buggy and also keyCode is set to 0.
			if ( !lastInput ) {
				lastInput = this.keyEventsStack.push( 0 );
			}

			// Increment inputs counter for provided key code.
			this.keyEventsStack.increment( lastInput.keyCode );

			// Exceeded limit.
			if ( this.keyEventsStack.getTotalInputs() >= this.undoManager.strokesLimit ) {
				this.rangeCollapsed = false;
				this.undoManager.type(lastInput.keyCode, true, {name: 'onInput', data: this});
				this.keyEventsStack.resetInputs();
			}
		},

		/**
		 * The `keyup` event listener.
		 *
		 * @param {CKEDITOR.dom.event} evt
		 */
		onKeyup: function HandleNativeEdit4( evt ) {

			var undoManager = this.undoManager,
				keyCode = evt.data.getKey(),
				totalInputs = this.keyEventsStack.getTotalInputs();

			// chrome 68 打开输入法之后快速敲几个字母 (未完成输入) 时, this.IMEinput 会等于 false, 但是 evt.data.$.isComposing 为 true.
			if (this.IMEinput || evt.data.$.isComposing) {
				this.IMEinput = false;
				this.IMECode = '';
				return;
			}
			// Remove record from stack for provided key code.
			this.keyEventsStack.remove( keyCode );

			// Second part of the workaround for IEs functional keys bug. We need to check whether something has really
			// changed because we blindly mocked the keypress event.
			// Also we need to be aware that lastKeydownImage might not be available (http://dev.ckeditor.com/ticket/12327).
			if ( UndoManager.ieFunctionalKeysBug( keyCode ) && this.lastKeydownImage &&
				this.lastKeydownImage.equalsContent( new Image( undoManager.editor, true ) ) ) {
				return;
			}

			// 这个 totalInputs 判断的有问题, 存在一些情况 (粘贴等) 使其等于0. 如果没有问题的话 togglePlaceholder 就不再需要在 keydown 的时候执行了.
			if (totalInputs > 0 || keyCode === $.ui.keyCode.DELETE || keyCode === $.ui.keyCode.BACKSPACE) {
				undoManager.type(keyCode, null, evt);
				this.rangeCollapsed = false;
				// 360极速浏览器上搜狗输入中文选择对应的数字内容输入时会存在多次keycode为0历史栈信息，故在键入后清除
				this.keyEventsStack.removeall();
			} else if ( UndoManager.isNavigationKey( keyCode ) ) {
				// Note content snapshot has been checked in keydown.
				this.onNavigationKey( true );
			}
		},

		/**
		 * Method called for navigation change. At first it will check if current content does not differ
		 * from the last saved snapshot.
		 *
		 * * If the content is different, the method creates a standard, extra snapshot.
		 * * If the content is not different, the method will compare the selection, and will
		 * amend the last snapshot selection if it changed.
		 *
		 * @param {Boolean} skipContentCompare If set to `true`, it will not compare content, and only do a selection check.
		 */
		onNavigationKey: function HandleNativeEdit5( skipContentCompare ) {
			var undoManager = this.undoManager;

			// We attempt to save content snapshot, if content didn't change, we'll
			// only amend selection.
			if ( skipContentCompare || !undoManager.save( true, null, false ) )
				undoManager.updateSelection( new Image( undoManager.editor ) );

			undoManager.resetType();
			this.rangeCollapsed = false;
		},

		/**
		 * Makes the next `input` event to be ignored.
		 */
		ignoreInputEventListener: function HandleNativeEdit6() {
			this.ignoreInputEvent = true;
			this.rangeCollapsed = false;
		},

		/**
		 * Attaches editable listeners required to provide the undo functionality.
		 */
		attachListeners: function() {
			var editor = this.undoManager.editor,
				editable = editor.editable(),
				that = this;

			// We'll create a snapshot here (before DOM modification), because we'll
			// need unmodified content when we got keygroup toggled in keyup.
			editable.attachListener( editable, 'keydown', function prepareTakeSnapShot( evt ) {
				that.onKeydown( evt );

				// On IE keypress isn't fired for functional (backspace/delete) keys.
				// Let's pretend that something's changed.
				if ( UndoManager.ieFunctionalKeysBug( evt.data.getKey() ) ) {
					that.onInput();
				}
			}, null, null, 999 );

			// Yanjunwei - 输入法输入完成时需要取消输入状态标志.
			editable.attachListener(editable, 'compositionend', function clearComposeState() {
				that.onCompositionend();
			}, null, null, null );

			// Only IE can't use input event, because it's not fired in contenteditable.
			editable.attachListener( editable, ( CKEDITOR.env.ie ? 'keypress' : 'input' ), that.onInput, that, null, 999 );

			// Keyup executes main snapshot logic.
			editable.attachListener( editable, 'keyup', that.onKeyup, that, null, 999 );

			// On paste and drop we need to ignore input event.
			// It would result with calling undoManager.type() on any following key.
			editable.attachListener( editable, 'paste', that.ignoreInputEventListener, that, null, 999 );
			editable.attachListener( editable, 'drop', that.ignoreInputEventListener, that, null, 999 );

			// Click should create a snapshot if needed, but shouldn't cause change event.
			// Don't pass onNavigationKey directly as a listener because it accepts one argument which
			// will conflict with evt passed to listener.
			// http://dev.ckeditor.com/ticket/12324 comment:4
			editable.attachListener( editable.isInline() ? editable : editor.document.getDocumentElement(), 'click', function() {
				that.onNavigationKey();
			}, null, null, 999 );

			// When pressing `Tab` key while editable is focused, `keyup` event is not fired.
			// Which means that record for `tab` key stays in key events stack.
			// We assume that when editor is blurred `tab` key is already up.
			// 如果连续输入过程中鼠标点击其他窗口 (或者弹出其他窗口) 也会 blur 并且在之后按功能键也会触发 onchange... 要不要把 keyEventsStack 全移掉?
			editable.attachListener( this.undoManager.editor, 'blur', function() {
				that.keyEventsStack.remove( 9 /*Tab*/ );
				this.rangeCollapsed && this.undoManager.save(null, null, null, {name: '选中选区然后blur'});
				this.rangeCollapsed = false;
			}, null, null, 999 );
		}
	};

	/**
	 * This class represents a stack of pressed keys and stores information
	 * about how many `input` events each key press has caused.
	 *
	 * @since 4.4.5
	 * @private
	 * @class CKEDITOR.plugins.undo.KeyEventsStack
	 * @constructor
	 */
	var KeyEventsStack = CKEDITOR.plugins.undo.KeyEventsStack = function() {
		/**
		 * @readonly
		 */
		this.stack = [];
	};

	KeyEventsStack.prototype = {
		/**
		 * Pushes a literal object with two keys: `keyCode` and `inputs` (whose initial value is set to `0`) to stack.
		 * It is intended to be called on the `keydown` event.
		 *
		 * @param {Number} keyCode
		 */
		push: function( keyCode ) {
			var length = this.stack.push( { keyCode: keyCode, inputs: 0 } );
			return this.stack[ length - 1 ];
		},

		/**
		 * Returns the index of the last registered `keyCode` in the stack.
		 * If no `keyCode` is provided, then the function will return the index of the last item.
		 * If an item is not found, it will return `-1`.
		 *
		 * @param {Number} [keyCode]
		 * @returns {Number}
		 */
		getLastIndex: function( keyCode ) {
			if ( typeof keyCode != 'number' ) {
				return this.stack.length - 1; // Last index or -1.
			} else {
				var i = this.stack.length;
				while ( i-- ) {
					if ( this.stack[ i ].keyCode == keyCode ) {
						return i;
					}
				}
				return -1;
			}
		},

		/**
		 * Returns the last key recorded in the stack. If `keyCode` is provided, then it will return
		 * the  last record for this `keyCode`.
		 *
		 * @param {Number} [keyCode]
		 * @returns {Object} Last matching record or `null`.
		 */
		getLast: function( keyCode ) {
			var index = this.getLastIndex( keyCode );
			if ( index != -1 ) {
				return this.stack[ index ];
			} else {
				return null;
			}
		},

		/**
		 * Increments registered input events for stack record for a given `keyCode`.
		 *
		 * @param {Number} keyCode
		 */
		increment: function( keyCode ) {
			var found = this.getLast( keyCode );
			if ( !found ) { // %REMOVE_LINE%
				throw new Error( 'Trying to increment, but could not found by keyCode: ' + keyCode + '.' ); // %REMOVE_LINE%
			} // %REMOVE_LINE%

			found.inputs++;
		},

		/**
		 * Removes the last record from the stack for the provided `keyCode`.
		 *
		 * @param {Number} keyCode
		 */
		remove: function( keyCode ) {
			var index = this.getLastIndex( keyCode );

			if ( index != -1 ) {
				this.stack.splice( index, 1 );
			}
		},
		/**
		 * Removes all the  record from the stack for the provided `keyCode`. by liujian
		 *
		 */
		removeall: function() {

			this.stack.splice( 0, this.stack.length);
		},

		/**
		 * Resets the `inputs` value to `0` for a given `keyCode` or in entire stack if a
		 * `keyCode` is not specified.
		 *
		 * @param {Number} [keyCode]
		 */
		resetInputs: function( keyCode ) {
			if ( typeof keyCode == 'number' ) {
				var last = this.getLast( keyCode );

				if ( !last ) { // %REMOVE_LINE%
					throw new Error( 'Trying to reset inputs count, but could not found by keyCode: ' + keyCode + '.' ); // %REMOVE_LINE%
				} // %REMOVE_LINE%

				last.inputs = 0;
			} else {
				var i = this.stack.length;
				while ( i-- ) {
					this.stack[ i ].inputs = 0;
				}
			}
		},

		/**
		 * Sums up inputs number for each key code and returns it.
		 *
		 * @returns {Number}
		 */
		getTotalInputs: function() {
			var i = this.stack.length,
				total = 0;

			while ( i-- ) {
				total += this.stack[ i ].inputs;
			}
			return total;
		},

		/**
		 * Cleans the stack based on a provided `keydown` event object. The rationale behind this method
		 * is that some keystrokes cause the `keydown` event to be fired in the editor, but not the `keyup` event.
		 * For instance, *Alt+Tab* will fire `keydown`, but since the editor is blurred by it, then there is
		 * no `keyup`, so the keystroke is not removed from the stack.
		 *
		 * @param {CKEDITOR.dom.event} event
		 */
		cleanUp: function( event ) {
			var nativeEvent = event.data.$;

			if ( !( nativeEvent.ctrlKey || nativeEvent.metaKey ) ) {
				this.remove( 17 );
			}
			if ( !nativeEvent.shiftKey ) {
				this.remove( 16 );
			}
			if ( !nativeEvent.altKey ) {
				this.remove( 18 );
			}
		}
	};
} )();

/**
 * The number of undo steps to be saved. The higher value is set, the more
 * memory is used for it.
 *
 *		config.undoStackSize = 50;
 *
 * @cfg {Number} [undoStackSize=20]
 * @member CKEDITOR.config
 */

/**
 * Fired when the editor is about to save an undo snapshot. This event can be
 * fired by plugins and customizations to make the editor save undo snapshots.
 *
 * @event saveSnapshot
 * @member CKEDITOR.editor
 * @param {CKEDITOR.editor} editor This editor instance.
 */

/**
 * Fired before an undo image is to be created. An *undo image* represents the
 * editor state at some point. It is saved into the undo store, so the editor is
 * able to recover the editor state on undo and redo operations.
 *
 * @since 3.5.3
 * @event beforeUndoImage
 * @member CKEDITOR.editor
 * @param {CKEDITOR.editor} editor This editor instance.
 * @see CKEDITOR.editor#afterUndoImage
 */

/**
 * Fired after an undo image is created. An *undo image* represents the
 * editor state at some point. It is saved into the undo store, so the editor is
 * able to recover the editor state on undo and redo operations.
 *
 * @since 3.5.3
 * @event afterUndoImage
 * @member CKEDITOR.editor
 * @param {CKEDITOR.editor} editor This editor instance.
 * @see CKEDITOR.editor#beforeUndoImage
 */

/**
 * Fired when the content of the editor is changed.
 *
 * Due to performance reasons, it is not verified if the content really changed.
 * The editor instead watches several editing actions that usually result in
 * changes. This event may thus in some cases be fired when no changes happen
 * or may even get fired twice.
 *
 * If it is important not to get the `change` event fired too often, you should compare the
 * previous and the current editor content inside the event listener. It is
 * not recommended to do that on every `change` event.
 *
 * Please note that the `change` event is only fired in the {@link #property-mode wysiwyg mode}.
 * In order to implement similar functionality in the source mode, you can listen for example to the {@link #key}
 * event or the native [`input`](https://developer.mozilla.org/en-US/docs/Web/Reference/Events/input)
 * event (not supported by Internet Explorer 8).
 *
 *		editor.on( 'mode', function() {
 *			if ( this.mode == 'source' ) {
 *				var editable = editor.editable();
 *				editable.attachListener( editable, 'input', function() {
 *					// Handle changes made in the source mode.
 *				} );
 *			}
 *		} );
 *
 * @since 4.2
 * @event change
 * @member CKEDITOR.editor
 * @param {CKEDITOR.editor} editor This editor instance.
 */
