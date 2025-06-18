HMEditor.fnSub("imageEditor",{
    init:function(){
        var _t = this;
        _t.imgId = ''; // 当前正在编辑图片id
        _t.imageEditorWin = document.image_editor_iframe;
    },
    
    getCanvasObj: function() {
        return this.imageEditorWin && this.imageEditorWin.canvas ? this.imageEditorWin.canvas : null
    },
    getFileFormUrl: function(fileId, callback) { // 通过fileId获取文件流
        if(!fileId){
            return null;
        }
        $.ajax({
            type:'POST',
            url: '/emr-server/template-service/getByteContent?fid=' + fileId,
            data:{
                fid: fileId
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', createAuthorizationTokenHeader());
            },
            success: function(data){
                callback('data:image/png;base64,' + data.data);
            },
            error: function(err){
                console.log('上传失败');
            }
        });
    },
    saveImageFromCanvas: function() {
        var canvas = this.getCanvasObj();
        if(canvas){
            var dataURL = canvas.toDataURL();
            this.updateCurrentImg(dataURL);
            $('#imageEditorModal').modal('hide');
        }
    },
    loadImageFromUrlToCanvas: function(imgUrl, imgId) {
        var _this = this;
        this.imgId = imgId;
        if(!imgUrl){
            return;
        }
        if(this.imageEditorWin && this.imageEditorWin.eventLister){
            var timeIndex = setTimeout(function(){
                _this.imageEditorWin.eventLister.addImageObject(imgUrl);
                clearTimeout(timeIndex);
            }, 500);
            $('#imageEditorModal').modal('show');
        }
    },
    clearCanvasObj: function() {
        this.imgId = '';
        if(this.imageEditorWin && this.imageEditorWin.eventLister){
            this.imageEditorWin.eventLister.clearObjects(); //清空画布对象
            // this.imageEditorWin.location.reload(); //刷新重置编辑器相关对象
        }
    },
    updateCurrentImg: function(dataURL) {
        var editor = this.parent.editor;
        var imgSource = editor.document.getBody().find('#'+ this.imgId);
        if(imgSource && imgSource.count() > 0){
            for(var i=0;i<imgSource.count();i++) {
                var _imgSource = imgSource.getItem(i);
                if(_imgSource.getAttribute('height')){
                    _imgSource.removeAttribute('height');
                }
                _imgSource.setAttribute('src', dataURL);
                _imgSource.setAttribute('data-cke-saved-src', dataURL);
            }
        }
    }
})