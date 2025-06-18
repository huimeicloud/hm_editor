/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.dialog.add( 'album', function( editor ) {
	
	return {
		title: '图片库',
		minWidth: 600,
		minHeight: 600,
		contents: [ {
			id: 'tab1',
			label: '',
			title: '',
			expand: true,
			padding: 0,
			elements: [
				{
					type: 'html',
					html: '<iframe style="height:600px" src="/emr-editor/album/"></iframe>'
				}
			]
		} ],
	};

} );
