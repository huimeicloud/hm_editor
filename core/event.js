/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Defines the {@link CKEDITOR.event} class, which serves as the
 *		base for classes and objects that require event handling features.
 */

if ( !CKEDITOR.event ) {
	/**
	 * Creates an event class instance. This constructor is rarely used, being
	 * the {@link #implementOn} function used in class prototypes directly
	 * instead.
	 *
	 * This is a base class for classes and objects that require event
	 * handling features.
	 *
	 * Do not confuse this class with {@link CKEDITOR.dom.event} which is
	 * instead used for DOM events. The CKEDITOR.event class implements the
	 * internal event system used by the CKEditor to fire API related events.
	 *
	 * @class
	 * @constructor Creates an event class instance.
	 */
	CKEDITOR.event = function() {};

	/**
	 * Implements the {@link CKEDITOR.event} features in an object.
	 *
	 *		var myObject = { message: 'Example' };
	 *		CKEDITOR.event.implementOn( myObject );
	 *
	 *		myObject.on( 'testEvent', function() {
	 *			alert( this.message );
	 *		} );
	 *		myObject.fire( 'testEvent' ); // 'Example'
	 *
	 * @static
	 * @param {Object} targetObject The object into which implement the features.
	 */
	CKEDITOR.event.implementOn = function( targetObject ) {
		var eventProto = CKEDITOR.event.prototype;

		for ( var prop in eventProto ) {
			if ( targetObject[ prop ] == null )
				targetObject[ prop ] = eventProto[ prop ];
		}
	};

	CKEDITOR.event.prototype = ( function() {
		// Returns the private events object for a given object.
		var getPrivate = function( obj ) {
				var _ = ( obj.getPrivate && obj.getPrivate() ) || obj._ || ( obj._ = {} );
				return _.events || ( _.events = {} );
			};

		var eventEntry = function( eventName ) {
				this.name = eventName;
				this.listeners = [];
			};

		eventEntry.prototype = {
			// Get the listener index for a specified function.
			// Returns -1 if not found.
			getListenerIndex: function( listenerFunction ) {
				for ( var i = 0, listeners = this.listeners; i < listeners.length; i++ ) {
					if ( listeners[ i ].fn == listenerFunction )
						return i;
				}
				return -1;
			}
		};

		// Retrieve the event entry on the event host (create it if needed).
		function getEntry( name ) {
			// Get the event entry (create it if needed).
			var events = getPrivate( this );
			return events[ name ] || ( events[ name ] = new eventEntry( name ) );
		}

		return {
			/**
			 * Predefine some intrinsic properties on a specific event name.
			 *
			 * @param {String} name The event name
			 * @param meta
			 * @param [meta.errorProof=false] Whether the event firing should catch error thrown from a per listener call.
			 */
			define: function( name, meta ) {
				var entry = getEntry.call( this, name );
				CKEDITOR.tools.extend( entry, meta, true );
			},

			/**
			 * Registers a listener to a specific event in the current object.
			 *
			 *		someObject.on( 'someEvent', function() {
			 *			alert( this == someObject );		// true
			 *		} );
			 *
			 *		someObject.on( 'someEvent', function() {
			 *			alert( this == anotherObject );		// true
			 *		}, anotherObject );
			 *
			 *		someObject.on( 'someEvent', function( event ) {
			 *			alert( event.listenerData );		// 'Example'
			 *		}, null, 'Example' );
			 *
			 *		someObject.on( 'someEvent', function() { ... } );						// 2nd called
			 *		someObject.on( 'someEvent', function() { ... }, null, null, 100 );		// 3rd called
			 *		someObject.on( 'someEvent', function() { ... }, null, null, 1 );		// 1st called
			 *
			 * @param {String} eventName The event name to which listen.
			 * @param {Function} listenerFunction The function listening to the
			 * event. A single {@link CKEDITOR.eventInfo} object instanced
			 * is passed to this function containing all the event data.
			 * @param {Object} [scopeObj] The object used to scope the listener
			 * call (the `this` object). If omitted, the current object is used.
			 * @param {Object} [listenerData] Data to be sent as the
			 * {@link CKEDITOR.eventInfo#listenerData} when calling the
			 * listener.
			 * @param {Number} [priority=10] The listener priority. Lower priority
			 * listeners are called first. Listeners with the same priority
			 * value are called in registration order.
			 * @returns {Object} An object containing the `removeListener`
			 * function, which can be used to remove the listener at any time.
			 */
			on: function( eventName, listenerFunction, scopeObj, listenerData, priority ) {
				function log4FocusChange(pretext,g){
					//compositionObj:解决输入中文光标乱跳的封装类
					CKEDITOR.plugins.compositionObj = CKEDITOR.plugins.compositionObj || {
						//当前选择,在输入中文开始时赋值
						sel:null,
						//最后的keydown
						lastKeyDown:null,
						lastFocus:null,
						//键盘标点符号及特殊字符
						cKeyCode:['，','。','、','：','；','（','）','？','！','"','"','【','】',"'","'",'《','》','……',48,49,50,51,52,53,54,55,56,57,58,96,97,98,99,100,101,102,103,104,
							105,106,107,108,109,110,111,186,187,188,189,190,191,192,219,220,221,222,13,8,46],
						//设置打印日志的事件
						LOG_EVENTS_INCLUDES:'',//''
						//'keydown compositionstart beforeinput keypress input keyup compositionend saveSnapshot change togglePlaceHolder',
						//'keydown compositionstart input compositionend',
						LOG_EVENTS_EXCLUDES:'mouseenter getSnapshot lockSnapshot unlockSnapshot pasteState',
						LOG_LEVEL:3,//0:打印所有;1:打印DEBUG;2:打印INFO;3:打印ERROR;4:都不打印

						getSelection: function(){return this.sel;},
						setSelection: function(obj){this.sel = obj;},
						clearSelection: function(){this.sel = null;},
						selected:function(){
							return !!this.sel;
						},
						cleared:function(contentLength){
							//如果输入中文过程中键入回退或ESC，内容回到原始状态
							return (this.lastKeyDown == 'Backspace' && contentLength==1) || (this.lastKeyDown == 'Escape');
						},
						hasRange: function(editor){
							return !!(editor.getSelection) && !!(editor.getSelection()) && !!(editor.getSelection().getRanges) && !!(editor.getSelection().getRanges()) && !!(editor.getSelection().getRanges()[0]);
						},
						setLastKeyDown: function(obj){this.lastKeyDown=obj;},
						trace: function(msg){if(this.LOG_LEVEL<1){
							console.trace(msg);
						}},
						debug: function(msg){if(this.LOG_LEVEL<2){
							console.log(msg);
						}},
						info: function(msg){if(this.LOG_LEVEL<3){
							console.log(msg);
						}},
						error:function(msg){if(this.LOG_LEVEL<4){
							console.error(msg);
						}},
						needLog:function(envName){
							return (this.LOG_EVENTS_INCLUDES == 'ALL' || this.LOG_EVENTS_INCLUDES.split(' ').includes(envName))
								&& !this.LOG_EVENTS_EXCLUDES.split(' ').includes(envName);
						}
					};

					//获取编辑器，只有拿到编辑器时才做处理
					var currEditor = g.sender.editor || g.editor;
					if(!(currEditor)){
						return;
					}

					//事件名
					var envName = g.name;
					var envData = '';
					var envKeyCode='';

					//事件数据，keydown时取值为keycode，input时为输入内容，中文输入时为输入中的字符串
					if(!!(g.data) && !!(g.data.$)){
						envData = g.data.$.code || g.data.$.data || '';
						envKeyCode = g.data.$.keyCode || '';
					}

					if(envName=='keydown'){
						CKEDITOR.plugins.compositionObj.setLastKeyDown(envData);
					}

					try {
						//focus:光标位置; input:输入点
						var focusRangeText = null,focusIndex = null,focusStr=null;
						var inputRangeText = null,inputIndex = null,inputStr=null;

						//编辑器中有选区时拦截输入点和光标位置不同的情况，并强制修正
						if(CKEDITOR.plugins.compositionObj.hasRange(currEditor)){
							//获取当前光标选区
							focusRangeText = currEditor.getSelection().getRanges()[0].startContainer.$.data;
							focusIndex = currEditor.getSelection().getRanges()[0].startOffset;
							focusStr = (!!focusRangeText && focusIndex<focusRangeText.length-1)?focusRangeText.substring(focusIndex,focusIndex+1):'';
							//当选区有内容且被聚焦时才做处理
							if(focusIndex<=0 || !focusRangeText){
								return;
							}

							// if(focusIndex>0 && !focusRangeText){
							// 	//console.error('选区有位移但没内容！！');
							// }

							//从compositionstart时记录的选区中获取原光标位置,即输入点位置
							if(CKEDITOR.plugins.compositionObj.selected()){
								inputRangeText = CKEDITOR.plugins.compositionObj.getSelection().getRanges()[0].startContainer.$.data;
								inputIndex = CKEDITOR.plugins.compositionObj.getSelection().getRanges()[0].startOffset;
								inputStr = (!!inputRangeText && inputIndex<inputRangeText.length-1)?inputRangeText.substring(inputIndex,inputIndex+1):'';
							}

							//计算输入长度
							var contentLength = 0;
							if(envName=='input' || envName=='beforeinput' ){
								contentLength = envData.length;
							}

							//打印各事件触发时光标的位置，生产环境应设置为不打印
							if(CKEDITOR.plugins.compositionObj.needLog(envName)){
								if(envName=='input'){
									CKEDITOR.plugins.compositionObj.debug(pretext+'光标测试 '+envName+' ('+(envData)+')(dataLength:'+contentLength+')(lastKeydown:'+(CKEDITOR.plugins.compositionObj.lastKeyDown)+')\n原始输入点：{('+inputIndex +':'+inputStr+')' + inputRangeText+ '}\n当前光标点：{('+focusIndex +':'+focusStr+')' + focusRangeText+ '}');
								}else{
									CKEDITOR.plugins.compositionObj.trace(pretext+'光标测试 '+envName+' ('+(envData)+'):\n原始输入点：{('+inputIndex +':'+inputStr+')' + inputRangeText+ '}\n当前光标点：{('+focusIndex +':'+focusStr+')' + focusRangeText+ '}');
								}
							}

							//中文输入开始时记录当前位置
							if(envName=='compositionstart' && !CKEDITOR.plugins.compositionObj.selected()){
								if(focusRangeText.replace(zeroWidthChar, '').length > 0){
									CKEDITOR.plugins.compositionObj.setSelection(currEditor.getSelection());
									CKEDITOR.plugins.compositionObj.debug('记录中文输入位置：{('+focusIndex +':'+focusStr+')' + focusRangeText+ '}');
								}
							}

							//中文输入结束时删除记录的选区
							if(envName=='compositionend'){
								CKEDITOR.plugins.compositionObj.clearSelection();
								inputRangeText=null;
								inputIndex=null;
								inputStr=null;
								focusRangeText = null;
								focusIndex = null;
								focusStr=null;
							}
							if(envName=='beforeinput'&& ( CKEDITOR.plugins.compositionObj.cKeyCode.indexOf(envKeyCode)>=0|| CKEDITOR.plugins.compositionObj.cKeyCode.indexOf(inputStr)>=0|| CKEDITOR.plugins.compositionObj.cKeyCode.indexOf(envData)>=0)){
								if(focusRangeText.replace(zeroWidthChar, '').length > 0){
									CKEDITOR.plugins.compositionObj.setSelection(currEditor.getSelection());
									CKEDITOR.plugins.compositionObj.debug('记录标点符号及特殊字符输入位置：{('+focusIndex +':'+focusStr+')' + focusRangeText+ '}');
									inputRangeText = CKEDITOR.plugins.compositionObj.getSelection().getRanges()[0].startContainer.$.data;
									inputIndex = CKEDITOR.plugins.compositionObj.getSelection().getRanges()[0].startOffset;
									inputStr = (!!inputRangeText && inputIndex<inputRangeText.length-1)?inputRangeText.substring(inputIndex,inputIndex+1):'';
								}

							}
							//输入标点符号及特殊字符结束时删除记录的选区
							if(envName=='keyup' && (CKEDITOR.plugins.compositionObj.cKeyCode.indexOf(envKeyCode)>=0|| CKEDITOR.plugins.compositionObj.cKeyCode.indexOf(inputStr)>=0|| CKEDITOR.plugins.compositionObj.cKeyCode.indexOf(envData)>=0)){
								CKEDITOR.plugins.compositionObj.clearSelection();
								inputRangeText=null;
								inputIndex=null;
								inputStr=null;
								focusRangeText = null;
								focusIndex = null;
								focusStr=null;
							}

							var missed = false;
							if(envName=='input'){
								missed = !!focusRangeText && !!inputRangeText && inputRangeText.length > 0;
								// 选区不一致、选区一致但光标位置不同
								missed = missed && (focusRangeText != inputRangeText|| ((inputIndex+contentLength) != focusIndex))
								;
							}

							//在input事件中判断选区是否一致，如果选区一致判断选区内光标是否一致
							if (CKEDITOR.plugins.compositionObj.selected() && missed) {
								// 排除敲入ESC或回退键到输入初始状态时选区一致但光标位置不同的情况
								if(focusRangeText == inputRangeText && inputIndex==focusIndex && CKEDITOR.plugins.compositionObj.cleared(contentLength)){
									CKEDITOR.plugins.compositionObj.debug(pretext+'光标测试 '+'键入回退键删除输入中的汉字或键入ESC后，不需要重置光标');
									return;
								}

								//当前事件已经检查或重置过选区;
								if(!!g.checkFocusAndResetRange){
									CKEDITOR.plugins.compositionObj.debug(pretext+'光标测试 '+'当前事件已经检查或重置过选区,不需要再次重置光标！');
									return;
								}

								//解决光标跳，不论选区是否一致，都通过setStart、setEnd重置光标位置
								try{
									var inputRange = CKEDITOR.plugins.compositionObj.getSelection().getRanges()[0];
									var focusSelection = currEditor.getSelection();
									var focusRange = focusSelection.getRanges()[0];

									var isRootAscendantOrSelf = focusRange.root.equals( inputRange.startContainer ) || focusRange.root.contains( inputRange.startContainer );
									//错误类型
									var errorType = '选区变化';
									if(focusRangeText == inputRangeText){
										errorType = '同选区光标跳';
									}else if(!isRootAscendantOrSelf){
										errorType = '异常选区（不可修正）';
									}else{
										errorType = '选区变化';
									}

									if(isRootAscendantOrSelf){
										CKEDITOR.plugins.compositionObj.info(pretext+'光标测试 '+errorType+'！！'+envName+' ('+(envData)+')(dataLength:'+contentLength+')(lastKeydown:'+(CKEDITOR.plugins.compositionObj.lastKeyDown)+')\n预计输入点：{('+ (inputIndex+contentLength) +')' + inputRangeText + '}\n当前光标点：{('+focusIndex +')' + focusRangeText+ '}');

										//计算新的光标位置
										var toOffset = inputIndex + contentLength;
										if(!!inputRange.startContainer && toOffset > (inputRange.startContainer.getLength())){
											throw '调整目标位置('+toOffset+')超出选区范围('+inputRange.startContainer.getLength()+')!';
										}

										//调整光标或选区
										if(focusRangeText != inputRangeText){
											//移动到原选区对应位置
											focusRange.setStart( inputRange.startContainer, toOffset);
											focusRange.setEnd( inputRange.endContainer, toOffset);
										}else{
											//移动到当前选区对应位置
											focusRange.setStart(focusRange.startContainer, toOffset);
											focusRange.setEnd(focusRange.endContainer, toOffset);
										}
										focusRange.collapse( true );
										focusSelection.selectRanges([focusRange], true);

										//重新设置当前光标
										//不改变compositionObj中sel的值
										focusRangeText = currEditor.getSelection().getRanges()[0].startContainer.$.data;
										focusIndex = currEditor.getSelection().getRanges()[0].startOffset;
										focusStr = focusIndex<focusRangeText.length-1?'':focusRangeText.substring(focusIndex,focusIndex+1);

									}
									CKEDITOR.plugins.compositionObj.debug(pretext+'光标测试 调整选区结束！');
								}catch(e){
									CKEDITOR.plugins.compositionObj.error(pretext+'光标测试 调整选区失败:'+e);
								}
							}
						}
						CKEDITOR.plugins.compositionObj.lastFocus='{('+focusIndex +':'+focusStr+')' + focusRangeText+ '}';
					} catch (e) {
						CKEDITOR.plugins.compositionObj.error(pretext+'光标测试'+envName+' ('+(envData)+'):'+e);
					} finally {
						g.checkFocusAndResetRange = true;
					}

				}
				// Create the function to be fired for this listener.
				function listenerFirer( editor, publisherData, stopFn, cancelFn ) {
					var ev = {
						name: eventName,
						sender: this,
						editor: editor,
						data: publisherData,
						listenerData: listenerData,
						stop: stopFn,
						cancel: cancelFn,
						removeListener: removeListener
					};
					log4FocusChange('开始',ev);
					var ret = listenerFunction.call( scopeObj, ev );

					return ret === false ? false : ev.data;
				}

				function removeListener() {
					me.removeListener( eventName, listenerFunction );
				}

				var event = getEntry.call( this, eventName );

				if ( event.getListenerIndex( listenerFunction ) < 0 ) {
					// Get the listeners.
					var listeners = event.listeners;

					// Fill the scope.
					if ( !scopeObj )
						scopeObj = this;

					// Default the priority, if needed.
					if ( isNaN( priority ) )
						priority = 10;

					var me = this;

					listenerFirer.fn = listenerFunction;
					listenerFirer.priority = priority;

					// Search for the right position for this new listener, based on its
					// priority.
					for ( var i = listeners.length - 1; i >= 0; i-- ) {
						// Find the item which should be before the new one.
						if ( listeners[ i ].priority <= priority ) {
							// Insert the listener in the array.
							listeners.splice( i + 1, 0, listenerFirer );
							return { removeListener: removeListener };
						}
					}

					// If no position has been found (or zero length), put it in
					// the front of list.
					listeners.unshift( listenerFirer );
				}

				return { removeListener: removeListener };
			},

			/**
			 * Similiar with {@link #on} but the listener will be called only once upon the next event firing.
			 *
			 * @see CKEDITOR.event#on
			 */
			once: function() {
				var args = Array.prototype.slice.call( arguments ),
					fn = args[ 1 ];

				args[ 1 ] = function( evt ) {
					evt.removeListener();
					return fn.apply( this, arguments );
				};

				return this.on.apply( this, args );
			},

			/**
			 * @static
			 * @property {Boolean} useCapture
			 * @todo
			 */

			/**
			 * Register event handler under the capturing stage on supported target.
			 */
			capture: function() {
				CKEDITOR.event.useCapture = 1;
				var retval = this.on.apply( this, arguments );
				CKEDITOR.event.useCapture = 0;
				return retval;
			},

			/**
			 * Fires an specific event in the object. All registered listeners are
			 * called at this point.
			 *
			 *		someObject.on( 'someEvent', function() { ... } );
			 *		someObject.on( 'someEvent', function() { ... } );
			 *		someObject.fire( 'someEvent' );				// Both listeners are called.
			 *
			 *		someObject.on( 'someEvent', function( event ) {
			 *			alert( event.data );					// 'Example'
			 *		} );
			 *		someObject.fire( 'someEvent', 'Example' );
			 *
			 * @method
			 * @param {String} eventName The event name to fire.
			 * @param {Object} [data] Data to be sent as the
			 * {@link CKEDITOR.eventInfo#data} when calling the listeners.
			 * @param {CKEDITOR.editor} [editor] The editor instance to send as the
			 * {@link CKEDITOR.eventInfo#editor} when calling the listener.
			 * @returns {Boolean/Object} A boolean indicating that the event is to be
			 * canceled, or data returned by one of the listeners.
			 */
			fire: ( function() {
				// Create the function that marks the event as stopped.
				var stopped = 0;
				var stopEvent = function() {
						stopped = 1;
					};

				// Create the function that marks the event as canceled.
				var canceled = 0;
				var cancelEvent = function() {
						canceled = 1;
					};

				return function( eventName, data, editor ) {
					// Get the event entry.
					var event = getPrivate( this )[ eventName ];

					// Save the previous stopped and cancelled states. We may
					// be nesting fire() calls.
					var previousStopped = stopped,
						previousCancelled = canceled;

					// Reset the stopped and canceled flags.
					stopped = canceled = 0;

					if ( event ) {
						var listeners = event.listeners;

						/**
						 * DEBUG 条件断点预设置 - 直接提取所有 listeners 中被包一层的函数到控制台 (不暂停);
						 * 也可以将下面这行代码加入 chrome 的监视, 这样从调用堆栈点到这里就可以看到所有的监听函数, 减少鼠标的点击次数, 加快写 bug 的效率.
                         * (_unWarpFn_=function(){_unWrappedFns_=[];for(_=0;_<listeners.length;_++){_unWrappedFns_.push(listeners[_].fn)};return _unWrappedFns_}) & console.log(_unWarpFn_()) & (_unWarpFn_=null)
                        */

						/**
						 * DEBUG 条件断点预设置 - 筛选触发器后, 提取所有listeners中被包一层的函数 (不暂停)
						 * 添加条件断点的步骤:
						 * 1.	将所需跟踪的事件放到 _targetEvents_ 中 (用空格分割), 即可只关注在 _targetEvents_ 中的事件.
						 * 		(_targetEvents_ = 'keydown beforeinput'.split(' '))   &&false
						 * 2.	事件的前后事件; 貌似通过 editor.execCommand 触发的事件才有前后事件, 通过 editor.fire 触发的事件只会执行该事件?
						 * 		(_beforeAndAfterEvent_ = 'beforeCommandExec afterCommandExec'.split(' ')) && false
						 * 3.	筛选触发器 (屏蔽带有 'mouse, Snapshot' 的事件)
						 * 		((trueEventName=('beforeCommandExec afterCommandExec'.split(' ').indexOf(eventName)===-1)?eventName:data.name) && (trueEventName.indexOf('mouse')===-1&&trueEventName.indexOf('Snapshot')===-1) && (_targetEvents_.length===1&&_targetEvents_[0].length===0||_targetEvents_.indexOf(trueEventName)!==-1)&&(console.log(eventName+' - '+trueEventName)|true)) && ((_unWarpFn_=function(){_unWrappedFns_=[];for(_=0;_<listeners.length;_++){_unWrappedFns_.push(listeners[_].fn)};return _unWrappedFns_}) & console.log(_unWarpFn_()) & (_unWarpFn_=null))
						 * ps:	一些事件名
						 * 		(_allEvents_ = 'DOMFocusIn afterCommandExec afterSetData beforeCommandExec beforeFocus beforeGetData beforeinput blur change checkSelection click compositionend compositionstart contentDom contentDomUnload contextmenu customConfigLoaded data dataReady dblclick doubleclick focus getSnapshot instanceCreated instanceLoaded instanceReady keydown keypress keyup loaded lockSnapshot log menuShow mode mousedown mousemove mouseout mouseup panelShow paper pasteState pluginsLoaded readOnly refresh resize saveSnapshot scroll selectionChange selectionCheck selectionchange setData state toDataFormat toHtml togglePlaceHolder uiReady uiSpace unlockSnapshot'.split(' ')) && false
						 */
						if ( listeners.length ) {
							// As some listeners may remove themselves from the
							// event, the original array length is dinamic. So,
							// let's make a copy of all listeners, so we are
							// sure we'll call all of them.
							listeners = listeners.slice( 0 );

							var retData;

							// Loop through all listeners.
							for ( var i = 0; i < listeners.length; i++ ) {
								// Call the listener, passing the event data.
								if ( event.errorProof ) {
									try {
										retData = listeners[ i ].call( this, editor, data, stopEvent, cancelEvent );
									} catch ( er ) {}
								} else {
									retData = listeners[ i ].call( this, editor, data, stopEvent, cancelEvent );
								}

								if ( retData === false )
									canceled = 1;
								else if ( typeof retData != 'undefined' )
									data = retData;

								// No further calls is stopped or canceled.
								if ( stopped || canceled )
									break;
							}
						}
					}

					var ret = canceled ? false : ( typeof data == 'undefined' ? true : data );

					// Restore the previous stopped and canceled states.
					stopped = previousStopped;
					canceled = previousCancelled;

					return ret;
				};
			} )(),

			/**
			 * Fires an specific event in the object, releasing all listeners
			 * registered to that event. The same listeners are not called again on
			 * successive calls of it or of {@link #fire}.
			 *
			 *		someObject.on( 'someEvent', function() { ... } );
			 *		someObject.fire( 'someEvent' );			// Above listener called.
			 *		someObject.fireOnce( 'someEvent' );		// Above listener called.
			 *		someObject.fire( 'someEvent' );			// No listeners called.
			 *
			 * @param {String} eventName The event name to fire.
			 * @param {Object} [data] Data to be sent as the
			 * {@link CKEDITOR.eventInfo#data} when calling the listeners.
			 * @param {CKEDITOR.editor} [editor] The editor instance to send as the
			 * {@link CKEDITOR.eventInfo#editor} when calling the listener.
			 * @returns {Boolean/Object} A booloan indicating that the event is to be
			 * canceled, or data returned by one of the listeners.
			 */
			fireOnce: function( eventName, data, editor ) {
				var ret = this.fire( eventName, data, editor );
				delete getPrivate( this )[ eventName ];
				return ret;
			},

			/**
			 * Unregisters a listener function from being called at the specified
			 * event. No errors are thrown if the listener has not been registered previously.
			 *
			 *		var myListener = function() { ... };
			 *		someObject.on( 'someEvent', myListener );
			 *		someObject.fire( 'someEvent' );					// myListener called.
			 *		someObject.removeListener( 'someEvent', myListener );
			 *		someObject.fire( 'someEvent' );					// myListener not called.
			 *
			 * @param {String} eventName The event name.
			 * @param {Function} listenerFunction The listener function to unregister.
			 */
			removeListener: function( eventName, listenerFunction ) {
				// Get the event entry.
				var event = getPrivate( this )[ eventName ];

				if ( event ) {
					var index = event.getListenerIndex( listenerFunction );
					if ( index >= 0 )
						event.listeners.splice( index, 1 );
				}
			},

			/**
			 * Remove all existing listeners on this object, for cleanup purpose.
			 */
			removeAllListeners: function() {
				var events = getPrivate( this );
				for ( var i in events )
					delete events[ i ];
			},

			/**
			 * Checks if there is any listener registered to a given event.
			 *
			 *		var myListener = function() { ... };
			 *		someObject.on( 'someEvent', myListener );
			 *		alert( someObject.hasListeners( 'someEvent' ) );	// true
			 *		alert( someObject.hasListeners( 'noEvent' ) );		// false
			 *
			 * @param {String} eventName The event name.
			 * @returns {Boolean}
			 */
			hasListeners: function( eventName ) {
				var event = getPrivate( this )[ eventName ];
				return ( event && event.listeners.length > 0 );
			}
		};
	} )();
}
