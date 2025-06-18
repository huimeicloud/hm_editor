
/**
 * insert local picture dialog
 * author: sph
 */
CKEDITOR.dialog.add( 'image2', function( editor ) {
	var isLimit=false;
	var designMode = editor.HMConfig.designMode;
	return {
		title: '选择图片',
		minWidth: 600,
		minHeight: 350,
		contents: [ {
			id: 'tab1',
			label: '',
			title: '',
			expand: true,
			padding: 0,
			elements: [
				{
					type: 'html',
					html: '<div style="text-align: center;">'+
					'<img id="image" style="max-width:480px;max-height:320px;" src=""/><br/>'+
					'<span id="fileinput" style="position: relative;display: inline-block;overflow: hidden;margin-top: 25%;">'+
					'<button style="font-size: 14px;border-radius: 5px;border: 1px solid #4297FE;background: #4297FE;color: #fff;padding: 5px 10px;outline: none;">选择文件</button>'+
					'<input id="inputid" type="file" style="position: absolute;left: 0px;top: 0px;opacity: 0;height: 35px;">'+
					'<span id="picName" style="margin-left: 10px;font-size: 14px;">未选择任何文件</span>'+
					'</span>'+
					'</div>'
				}
			]
		} ],
		buttons: [ CKEDITOR.dialog.cancelButton, CKEDITOR.dialog.okButton ],
		onOk: function(evt) {
			var imageData = $('#image')[0].src;

			if(!imageData.startsWith('data:image')){
				alert('请先选择上传图片');
				return;
			}
			if(isLimit && designMode=="true"){
				isLimit=false;
				//初始化
				$('#image')[0].src = '';
				$("#inputid")[0].value='';
				$('#picName')[0].innerText = '未选择任何文件';
				$('#fileinput').css('margin-top','25%');
				alert('上传的图片文件不能大于50KB！');
				return ;
			}
			var uuid = "cms"+guid();
			// 往新文本插入图片
			if ($(editor.clickTargetElement.$).hasClass('new-textbox-content')||$(editor.clickTargetElement.$).hasClass('new-textbox')) {
				// editor.inserImgUuid = uuid;
				editor.insertHtml('<span class="' + uuid + '"><img style="max-width:755px;max-height:320px;" id="' + uuid + '" src="' + imageData + '"></span>');
            } else {
				editor.insertHtml('<span><img style="max-width:755px;max-height:320px;" id="' + uuid + '" src="' + imageData + '"></span>');
			}
			editor.editable().fire('togglePlaceHolder', evt);
			CKEDITOR.dialog.getCurrent().hide();
			//初始化
			$('#image')[0].src = '';
			$("#inputid")[0].value='';
			$('#picName')[0].innerText = '未选择任何文件';
			$('#fileinput').css('margin-top','25%');
		},
		onCancel:function(){
			$('#image')[0].src = '';
			$("#inputid")[0].value='';
			$('#picName')[0].innerText = '未选择任何文件';
			$('#fileinput').css('margin-top','25%');
		},
		onLoad:function(){
			$("#inputid").on("change",function(){
				if(!this.files || !this.files[0]){
					return;
				}
				var reader = new FileReader();
				var maxSize = 51200; //限制最大图片为50kb
				reader.onload = function(evt){
					$('#image')[0].src = evt.target.result;
					if(evt.total && evt.total > maxSize && designMode=="true"){
						isLimit=true;
					}
					$('#fileinput')[0].style.marginTop='10px';
					var len = $('#inputid')[0].value.split('\\').length;
					if(len>0){
						$('#picName')[0].innerText = $('#inputid')[0].value.split('\\')[len-1];
					}
				}
				reader.readAsDataURL(this.files[0]);
			});
		}

	};
});

// Generate four random hex digits.
function S4() {
	return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  // Generate a pseudo-GUID by concatenating random hexadecimal.
  function guid() {
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  };


