/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * Represents a list of {@link CKEDITOR.dom.node} objects.
 * It's a wrapper for native nodes list.
 *
 *		var nodeList = CKEDITOR.document.getBody().getChildren();
 *		alert( nodeList.count() ); // number [0;N]
 *
 * @class
 * @constructor Creates a document class instance.
 * @param {Object} nativeList
 */
CKEDITOR.dom.nodeList = function( nativeList ) {
	this.$ = nativeList;
};

CKEDITOR.dom.nodeList.prototype = {
	/**
	 * Get count of nodes in this list.
	 *
	 * @returns {Number}
	 */
	count: function() {
		return this.$.length;
	},

	/**
	 * Get node from the list.
	 *
	 * @returns {CKEDITOR.dom.node}
	 */
	getItem: function( index ) {
		if ( index < 0 || index >= this.$.length )
			return null;

		var $node = this.$[ index ];
		return $node ? new CKEDITOR.dom.node( $node ) : null;
	},
	/**
	 * 删除所有已选择节点
	 */
	remove: function () {
		for (var index = this.$.length - 1; index >= 0; index--) {
			this.$[index].remove && this.$[index].remove();
		}
	}
};
