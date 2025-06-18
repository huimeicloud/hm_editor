//# sourceURL=dynamicScript.js

CKEDITOR.dialog.add( 'document', function( editor ) {

	return {
		title: '文档信息',
		resizable:  CKEDITOR.DIALOG_RESIZE_BOTH,
		width: 900,
		height: 500,
		contents: [ {
			id: 'hm-document-dialog',
			label: '',
			title: '',
			expand: true,
			padding: 0,
			elements: [
				{
					type: 'html',
					html: '<iframe class="documentHtml" style="height:100%;width: 100%;" src="./plugins/document/dialogs/document.html"></iframe>',
				}
			]
		} ],
		onOk:function(){
			this.commitContent(  );
			var result = window.commitDocumentInfo(editor.document.getBody(),'');
			if (result) {
				editor.showNotification(result, 'warning');
				return false;
			}
		},
		onShow:function(){
			this.setupContent(  );
			var _this = this;
            var initDocumentInfoFun = function(){
				window.initDocumentInfo && window.initDocumentInfo( editor.document.getBody(),'');

            }
            // 防止iframe未加载完成时window.initNodeStyle为undefined
            var iframe = $('.documentHtml')[0];
            if (iframe.attachEvent){
                iframe.attachEvent("onload", function(){
                    initDocumentInfoFun();
                });
            } else {
                iframe.onload = function(){
                    initDocumentInfoFun();
                };
            }
            initDocumentInfoFun();
		}
	};
} );
