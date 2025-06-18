/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Image plugin based on Widgets API
 */

'use strict';

CKEDITOR.dialog.add( 'image2', function( editor ) {

	// RegExp: 123, 123px, empty string ""
	var regexGetSizeOrEmpty = /(^\s*(\d+)(px)?\s*$)|^$/i,

		lockButtonId = CKEDITOR.tools.getNextId(),
		resetButtonId = CKEDITOR.tools.getNextId(),

		lang = editor.lang.image2,
		commonLang = editor.lang.common,

		lockResetStyle = 'margin-top:18px;width:40px;height:20px;',
		lockResetHtml = new CKEDITOR.template(
			'<div>' +
				'<a href="javascript:void(0)" tabindex="-1" title="' + lang.lockRatio + '" class="cke_btn_locked" id="{lockButtonId}" role="checkbox">' +
					'<span class="cke_icon"></span>' +
					'<span class="cke_label">' + lang.lockRatio + '</span>' +
				'</a>' +

				'<a href="javascript:void(0)" tabindex="-1" title="' + lang.resetSize + '" class="cke_btn_reset" id="{resetButtonId}" role="button">' +
					'<span class="cke_label">' + lang.resetSize + '</span>' +
				'</a>' +
			'</div>' ).output( {
				lockButtonId: lockButtonId,
				resetButtonId: resetButtonId
			} ),

		helpers = CKEDITOR.plugins.image2,

		// Editor instance configuration.
		config = editor.config,

		hasFileBrowser = !!( config.filebrowserImageBrowseUrl || config.filebrowserBrowseUrl ),

		// Content restrictions defined by the widget which
		// impact on dialog structure and presence of fields.
		features = editor.widgets.registered.image.features,

		// Functions inherited from image2 plugin.
		getNatural = helpers.getNatural,

		// Global variables referring to the dialog's context.
		doc, widget, image,

		// Global variable referring to this dialog's image pre-loader.
		preLoader,

		// Global variables holding the original size of the image.
		domWidth, domHeight,

		// Global variables related to image pre-loading.
		preLoadedWidth, preLoadedHeight, srcChanged,

		// Global variables related to size locking.
		lockRatio, userDefinedLock,

		// Global variables referring to dialog fields and elements.
		lockButton, resetButton, widthField, heightField,

		natural;

	// Validates dimension. Allowed values are:
	// "123px", "123", "" (empty string)
	function validateDimension() {
		var match = this.getValue().match( regexGetSizeOrEmpty ),
			isValid = !!( match && parseInt( match[ 1 ], 10 ) !== 0 );

		if ( !isValid )
			alert( commonLang[ 'invalid' + CKEDITOR.tools.capitalize( this.id ) ] ); // jshint ignore:line

		return isValid;
	}

	// Creates a function that pre-loads images. The callback function passes
	// [image, width, height] or null if loading failed.
	//
	// @returns {Function}
	function createPreLoader() {
		var image = doc.createElement( 'img' ),
			listeners = [];

		function addListener( event, callback ) {
			listeners.push( image.once( event, function( evt ) {
				removeListeners();
				callback( evt );
			} ) );
		}

		function removeListeners() {
			var l;

			while ( ( l = listeners.pop() ) )
				l.removeListener();
		}

		// @param {String} src.
		// @param {Function} callback.
		return function( src, callback, scope ) {
			addListener( 'load', function() {
				// Don't use image.$.(width|height) since it's buggy in IE9-10 (http://dev.ckeditor.com/ticket/11159)
				var dimensions = getNatural( image );

				callback.call( scope, image, dimensions.width, dimensions.height );
			} );

			addListener( 'error', function() {
				callback( null );
			} );

			addListener( 'abort', function() {
				callback( null );
			} );

			image.setAttribute( 'src',
				( config.baseHref || '' ) + src + '?' + Math.random().toString( 16 ).substring( 2 ) );
		};
	}

	// This function updates width and height fields once the
	// "src" field is altered. Along with dimensions, also the
	// dimensions lock is adjusted.
	function onChangeSrc() {
		var value = this.getValue();

		toggleDimensions( false );

		// Remember that src is different than default.
		if ( value !== widget.data.src ) {
			// Update dimensions of the image once it's preloaded.
			preLoader( value, function( image, width, height ) {
				// Re-enable width and height fields.
				toggleDimensions( true );

				// There was problem loading the image. Unlock ratio.
				if ( !image )
					return toggleLockRatio( false );

				// Fill width field with the width of the new image.
				widthField.setValue( editor.config.image2_prefillDimensions === false ? 0 : width );

				// Fill height field with the height of the new image.
				heightField.setValue( editor.config.image2_prefillDimensions === false ? 0 : height );

				// Cache the new width.
				preLoadedWidth = width;

				// Cache the new height.
				preLoadedHeight = height;

				// Check for new lock value if image exist.
				toggleLockRatio( helpers.checkHasNaturalRatio( image ) );
			} );

			srcChanged = true;
		}

		// Value is the same as in widget data but is was
		// modified back in time. Roll back dimensions when restoring
		// default src.
		else if ( srcChanged ) {
			// Re-enable width and height fields.
			toggleDimensions( true );

			// Restore width field with cached width.
			widthField.setValue( domWidth );

			// Restore height field with cached height.
			heightField.setValue( domHeight );

			// Src equals default one back again.
			srcChanged = false;
		}

		// Value is the same as in widget data and it hadn't
		// been modified.
		else {
			// Re-enable width and height fields.
			toggleDimensions( true );
		}
	}

	function onChangeDimension() {
		// If ratio is un-locked, then we don't care what's next.
		if ( !lockRatio )
			return;

		var value = this.getValue();

		// No reason to auto-scale or unlock if the field is empty.
		if ( !value )
			return;

		// If the value of the field is invalid (e.g. with %), unlock ratio.
		if ( !value.match( regexGetSizeOrEmpty ) )
			toggleLockRatio( false );

		// No automatic re-scale when dimension is '0'.
		if ( value === '0' )
			return;

		var isWidth = this.id == 'width',
			// If dialog opened for the new image, domWidth and domHeight
			// will be empty. Use dimensions from pre-loader in such case instead.
			width = domWidth || preLoadedWidth,
			height = domHeight || preLoadedHeight;

		// If changing width, then auto-scale height.
		if ( isWidth )
			value = Math.round( height * ( value / width ) );

		// If changing height, then auto-scale width.
		else
			value = Math.round( width * ( value / height ) );

		// If the value is a number, apply it to the other field.
		if ( !isNaN( value ) )
			( isWidth ? heightField : widthField ).setValue( value );
	}

	// Set-up function for lock and reset buttons:
	// 	* Adds lock and reset buttons to focusables. Check if button exist first
	// 	  because it may be disabled e.g. due to ACF restrictions.
	// 	* Register mouseover and mouseout event listeners for UI manipulations.
	// 	* Register click event listeners for buttons.
	function onLoadLockReset() {
		var dialog = this.getDialog();

		function setupMouseClasses( el ) {
			el.on( 'mouseover', function() {
				this.addClass( 'cke_btn_over' );
			}, el );

			el.on( 'mouseout', function() {
				this.removeClass( 'cke_btn_over' );
			}, el );
		}

		// Create references to lock and reset buttons for this dialog instance.
		lockButton = doc.getById( lockButtonId );
		resetButton = doc.getById( resetButtonId );

		// Activate (Un)LockRatio button
		if ( lockButton ) {
			// Consider that there's an additional focusable field
			// in the dialog when the "browse" button is visible.
			dialog.addFocusable( lockButton, 4 + hasFileBrowser );

			lockButton.on( 'click', function( evt ) {
				toggleLockRatio();
				evt.data && evt.data.preventDefault();
			}, this.getDialog() );

			setupMouseClasses( lockButton );
		}

		// Activate the reset size button.
		if ( resetButton ) {
			// Consider that there's an additional focusable field
			// in the dialog when the "browse" button is visible.
			dialog.addFocusable( resetButton, 5 + hasFileBrowser );

			// Fills width and height fields with the original dimensions of the
			// image (stored in widget#data since widget#init).
			resetButton.on( 'click', function( evt ) {
				// If there's a new image loaded, reset button should revert
				// cached dimensions of pre-loaded DOM element.
				if ( srcChanged ) {
					widthField.setValue( preLoadedWidth );
					heightField.setValue( preLoadedHeight );
				}

				// If the old image remains, reset button should revert
				// dimensions as loaded when the dialog was first shown.
				else {
					widthField.setValue( domWidth );
					heightField.setValue( domHeight );
				}

				evt.data && evt.data.preventDefault();
			}, this );

			setupMouseClasses( resetButton );
		}
	}

	function toggleLockRatio( enable ) {
		// No locking if there's no radio (i.e. due to ACF).
		if ( !lockButton )
			return;

		if ( typeof enable == 'boolean' ) {
			// If user explicitly wants to decide whether
			// to lock or not, don't do anything.
			if ( userDefinedLock )
				return;

			lockRatio = enable;
		}

		// Undefined. User changed lock value.
		else {
			var width = widthField.getValue(),
				height;

			userDefinedLock = true;
			lockRatio = !lockRatio;

			// Automatically adjust height to width to match
			// the original ratio (based on dom- dimensions).
			if ( lockRatio && width ) {
				height = domHeight / domWidth * width;

				if ( !isNaN( height ) )
					heightField.setValue( Math.round( height ) );
			}
		}

		lockButton[ lockRatio ? 'removeClass' : 'addClass' ]( 'cke_btn_unlocked' );
		lockButton.setAttribute( 'aria-checked', lockRatio );

		// Ratio button hc presentation - WHITE SQUARE / BLACK SQUARE
		if ( CKEDITOR.env.hc ) {
			var icon = lockButton.getChild( 0 );
			icon.setHtml( lockRatio ? CKEDITOR.env.ie ? '\u25A0' : '\u25A3' : CKEDITOR.env.ie ? '\u25A1' : '\u25A2' );
		}
	}

	function toggleDimensions( enable ) {
		var method = enable ? 'enable' : 'disable';

		widthField[ method ]();
		heightField[ method ]();
	}

	var srcBoxChildren = [
			{
				id: 'src',
				type: 'text',
				label: commonLang.url,
				onKeyup: onChangeSrc,
				onChange: onChangeSrc,
				setup: function( widget ) {
					this.setValue( widget.data.src );
				},
				commit: function( widget ) {
					widget.setData( 'src', this.getValue() );
				},
				validate: CKEDITOR.dialog.validate.notEmpty( lang.urlMissing )
			}
		];

	// Render the "Browse" button on demand to avoid an "empty" (hidden child)
	// space in dialog layout that distorts the UI.
	if ( hasFileBrowser ) {
		srcBoxChildren.push( {
			type: 'button',
			id: 'browse',
			// v-align with the 'txtUrl' field.
			// TODO: We need something better than a fixed size here.
			style: 'display:inline-block;margin-top:14px;',
			align: 'center',
			label: editor.lang.common.browseServer,
			hidden: true,
			filebrowser: 'info:src'
		} );
	}

	return {
		title: lang.title,
		maxWidth: 600,
		maxHeight: 600,
		onLoad: function() {
			// Create a "global" reference to the document for this dialog instance.
			doc = this._.element.getDocument();

			// Create a pre-loader used for determining dimensions of new images.
			preLoader = createPreLoader();
		},
		onShow: function() {
			// Create a "global" reference to edited widget.
			widget = this.widget;

			// Create a "global" reference to widget's image.
			image = widget.parts.image;

			// Reset global variables.
			srcChanged = userDefinedLock = lockRatio = false;

			// Natural dimensions of the image.
			natural = getNatural( image );

			// Get the natural width of the image.
			preLoadedWidth = domWidth = natural.width;

			// Get the natural height of the image.
			preLoadedHeight = domHeight = natural.height;

			//konva
			if(natural.height == 0 || natural.width == 0){
				return;
			}
			
			var $image = $(image.$);
			var $imageWrapper = $image.parent();

			$('.cke_dialog_tab').removeClass('cke_dialog_tab_disabled');

			var width = natural.width;
		    var height = natural.height;

		    // first we need Konva core things: stage and layer
		    var stage = new Konva.Stage({
		      container: 'konvaContainer',
		      width: width,
		      height: height
		    });

		    var bgLayer = new Konva.Layer();
		    stage.add(bgLayer);

		    var bgImage = new Konva.Image({
		        x: 0,
		        y: 0,
		        image: image.$,
		        width: width,
		        height: height
		    });
		    bgLayer.add(bgImage);

		    var uiLayer = new Konva.Layer();
		    stage.add(uiLayer);

		    // then we are going to draw into special canvas element
		    var canvas = document.createElement('canvas');
		    canvas.width = stage.width();
		    canvas.height = stage.height();
		    var $imageUI = $imageWrapper.find('#konvaUI');
		    if($imageUI.length == 1){
		    	var ctx=canvas.getContext("2d");
    			ctx.drawImage($imageUI[0],0,0);
		    }

		    // created canvas we can add to layer as "Konva.Image" element
		    var uiImage = new Konva.Image({
		        image: canvas,
		        x : 0,
		        y : 0
		    });
		    uiLayer.add(uiImage);

		    stage.draw();

		    // Good. Now we need to get access to context element
		    var context = canvas.getContext('2d');
		    context.strokeStyle = "#df4b26";
		    context.lineJoin = "round";
		    context.lineWidth = 5;


		    var isPaint = false;
		    var lastPointerPosition;
		    var mode = 'brush';


		    // now we need to bind some events
		    // we need to start drawing on mousedown
		    // and stop drawing on mouseup
		    stage.on('contentMousedown.proto', function() {
		      isPaint = true;
		      lastPointerPosition = stage.getPointerPosition();

		    });

		    stage.on('contentMouseup.proto', function() {
		        isPaint = false;
		    });

		    // and core function - drawing
		    stage.on('contentMousemove.proto', function() {

		      if (!isPaint) {
		        return;
		      }

		      if (mode === 'brush') {
		        context.globalCompositeOperation = 'source-over';
		      }
		      if (mode === 'eraser') {
		        context.globalCompositeOperation = 'destination-out';
		      }
		      context.beginPath();

		      var localPos = {
		        x: lastPointerPosition.x - uiImage.x(),
		        y: lastPointerPosition.y - uiImage.y()
		      };
		      context.moveTo(localPos.x, localPos.y);
		      var pos = stage.getPointerPosition();
		      localPos = {
		        x: pos.x - uiImage.x(),
		        y: pos.y - uiImage.y()
		      };
		      context.lineTo(localPos.x, localPos.y);
		      context.closePath();
		      context.stroke();


		      lastPointerPosition = pos;
		      uiLayer.draw();
		    });



		    var select = document.getElementById('konvaBrush');
		    select.addEventListener('change', function() {
		      mode = select.value;
		    });


		},
		contents: [
			{
				id: 'edit',
				label: '编辑',
				elements: [
					{
						id:'konva',
						type: 'html',
						html: '<div id=konvaController>\
						<span>笔刷类型:</span>\
						<select id="konvaBrush">\
						    <option value="brush">书写</option>\
						    <option value="eraser">擦出</option>\
						</select>\
						</div>\
						<div id=konvaContainer></div>',
						setup: function( widget ) {

						},
						commit: function( widget ) {
							if($('canvas').length == 2){
								var $image = $(widget.parts.image.$);
								var $imageWrapper = $image.parent();
								var dataURL = $('canvas')[1].toDataURL();
								$imageWrapper.find('#konvaUI').remove();
								$imageWrapper.append('<img id=konvaUI style="position:absolute;left:0;top:0"  src="' + dataURL + '">');
							}
							
						}
					}
				]
			},
			{
				id: 'info',
				label: '属性',
				elements: [
					{
						type: 'vbox',
						padding: 0,
						children: [
							{
								type: 'hbox',
								widths: [ '100%' ],
								className: 'cke_dialog_image_url',
								children: srcBoxChildren
							}
						]
					},
					{
						id: 'alt',
						type: 'text',
						label: lang.alt,
						setup: function( widget ) {
							this.setValue( widget.data.alt );
						},
						commit: function( widget ) {
							widget.setData( 'alt', this.getValue() );
						},
						validate: editor.config.image2_altRequired === true ? CKEDITOR.dialog.validate.notEmpty( lang.altMissing ) : null
					},
					{
						type: 'hbox',
						widths: [ '25%', '25%', '50%' ],
						requiredContent: features.dimension.requiredContent,
						children: [
							{
								type: 'text',
								width: '45px',
								id: 'width',
								label: commonLang.width,
								validate: validateDimension,
								onKeyUp: onChangeDimension,
								onLoad: function() {
									widthField = this;
								},
								setup: function( widget ) {
									this.setValue( widget.data.width );
								},
								commit: function( widget ) {
									widget.setData( 'width', this.getValue() );
								}
							},
							{
								type: 'text',
								id: 'height',
								width: '45px',
								label: commonLang.height,
								validate: validateDimension,
								onKeyUp: onChangeDimension,
								onLoad: function() {
									heightField = this;
								},
								setup: function( widget ) {
									this.setValue( widget.data.height );
								},
								commit: function( widget ) {
									widget.setData( 'height', this.getValue() );
								}
							},
							{
								id: 'lock',
								type: 'html',
								style: lockResetStyle,
								onLoad: onLoadLockReset,
								setup: function( widget ) {
									toggleLockRatio( widget.data.lock );
								},
								commit: function( widget ) {
									widget.setData( 'lock', lockRatio );
								},
								html: lockResetHtml
							}
						]
					},
					{
						type: 'hbox',
						id: 'alignment',
						requiredContent: features.align.requiredContent,
						children: [
							{
								id: 'align',
								type: 'radio',
								items: [
									[ commonLang.alignNone, 'none' ],
									[ commonLang.alignLeft, 'left' ],
									[ commonLang.alignCenter, 'center' ],
									[ commonLang.alignRight, 'right' ]
								],
								label: commonLang.align,
								setup: function( widget ) {
									this.setValue( widget.data.align );
								},
								commit: function( widget ) {
									widget.setData( 'align', this.getValue() );
								}
							}
						]
					},
					{
						id: 'hasCaption',
						type: 'checkbox',
						label: lang.captioned,
						requiredContent: features.caption.requiredContent,
						setup: function( widget ) {
							this.setValue( widget.data.hasCaption );
						},
						commit: function( widget ) {
							widget.setData( 'hasCaption', this.getValue() );
						}
					}
				]
			}
		]
	};
} );
