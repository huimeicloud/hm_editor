//# sourceURL=dynamicScript.js

CKEDITOR.dialog.add( 'document', function( editor ) {
	var sdkHost = editor.HMConfig.sdkHost||'';
	
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
					html: '<iframe id="documentInfo" class="documentHtml" style="height:100%;width: 100%;"></iframe>',
					setup: function () {
						// 隐藏iframe直到内容加载完成
						$('#documentInfo').hide();
						
						var init = function () {
							$('#documentInfo').show();
							// 初始化文档信息
							window.initDocumentInfo && window.initDocumentInfo(editor.document.getBody(), '');
						}
						
						var iframe = $('#documentInfo')[0];
						// 使用getTplHtml加载模板内容
						$.getTplHtml(sdkHost + '/plugins/document/dialogs/document.html', {
							sdkHost: sdkHost
						}, function(bodyHtml) {
							var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
							iframeDoc.open();
							iframeDoc.write(bodyHtml);
							iframeDoc.close();
							
							// 设置onload事件
							if (iframe.attachEvent) {
								iframe.attachEvent("onload", function () {
									init();
								});
							} else {
								iframe.onload = function () {
									init();
								};
							}
						});
					}
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
			this.setupContent();
		}
	};
} );
