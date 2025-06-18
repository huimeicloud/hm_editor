CKEDITOR.dialog.add( 'paper', function( editor ) {
    var paperSetData = { // 默认值
        paperSize: 'A4_portrait',
        paperMargin: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5
        }
    };
    return {
        title: '纸张设置',
        minWidth: 350,
        minHeight: 150,
        contents: [
            {
                id: 'info',
                label: 'Basic info',
                elements: [
                    {
                        type: 'select',
						id: 'selPaperSize',
						requiredContent: 'th',
						'default': paperSetData.paperSize,
                        label: '纸张大小：',
                        style: 'display: flex;align-items: center;',
						items: [
							[ 'A4', 'A4_portrait' ],
							[ 'A4(横)', 'A4_landscape' ],
                            [ 'A3', 'A3_portrait' ],
                            [ 'A3(横)', 'A3_landscape' ],
                            [ 'A5', 'A5_portrait' ],
                            [ 'A5(横)', 'A5_landscape' ],
                            [ 'B5', 'B5_portrait' ],
                            [ 'B5(横)', 'B5_landscape' ]
						],
						setup: function( ) {
                            if(paperSetData.paperSize){
                                this.setValue(paperSetData.paperSize);
                            }
						},

                        commit: function( data ) {
                            data[this.id] = this.getValue();
                        }
                    }, {
                        type: 'hbox',
                        children: [{
                            type: 'text',
                            width: '80px',
                            style: 'display: flex;align-items: center;',
                            id: 'topMargin',
                            label: '上边距(mm)：',
                            default: paperSetData.paperMargin.top,
                            setup: function (element) {
                                if(paperSetData.paperMargin.top){
                                    this.setValue(paperSetData.paperMargin.top);
                                }
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }
                        }, {
                            type: 'text',
                            width: '80px',
                            style: 'display: flex;align-items: center;',
                            id: 'leftMargin',
                            label: '左边距(mm)：',
                            default: paperSetData.paperMargin.left,
                            setup: function (element) {
                                if(paperSetData.paperMargin.left){
                                    this.setValue(paperSetData.paperMargin.left);
                                }
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }
                        }]
                    }, {
                        type: 'hbox',
                        children: [{
                            type: 'text',
                            width: '80px',
                            style: 'display: flex;align-items: center;',
                            id: 'bottomMargin',
                            label: '下边距(mm)：',
                            default: paperSetData.paperMargin.bottom,
                            setup: function (element) {
                               if(paperSetData.paperMargin.bottom){
                                    this.setValue(paperSetData.paperMargin.bottom);
                               }
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }
                        }, {
                            type: 'text',
                            width: '80px',
                            style: 'display: flex;align-items: center;',
                            id: 'rightMargin',
                            label: '右边距(mm)：',
                            default: paperSetData.paperMargin.right,
                            setup: function (element) {
                                if(paperSetData.paperMargin.right){
                                    this.setValue(paperSetData.paperMargin.right);
                                }
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }
                        }]
                    }
                ]
            }

        ],

        onLoad:function(){
        },

        onShow: function() {
            var body =  editorIns.document.getBody( );
            var paperSizeStr = body.getAttribute('data-hm-paperSize');
            paperSizeStr = paperSizeStr && paperSizeStr.split('$');
            if(paperSizeStr && paperSizeStr.length == 2){
                paperSetData.paperSize = paperSizeStr[0];
                var paperMargin = paperSizeStr[1];
                if(paperMargin.indexOf('undefined') > -1 || paperMargin.indexOf('null') > -1){
                    paperMargin = paperMargin.replace(new RegExp('undefined','g'), '5').replace(new RegExp('null','g'), '5');
                }
                var margins = paperMargin.split('#');
                paperSetData.paperMargin.top = margins && margins[0] && margins[0].split(':')[1] ? parseFloat(margins[0].split(':')[1]) || 5 : 5;
                paperSetData.paperMargin.right = margins && margins[1] && margins[1].split(':')[1] ? parseFloat(margins[1].split(':')[1]) || 5 : 5;
                paperSetData.paperMargin.bottom = margins && margins[2] && margins[2].split(':')[1] ? parseFloat(margins[2].split(':')[1]) || 5 : 5;
                paperSetData.paperMargin.left = margins && margins[3] && margins[3].split(':')[1] ? parseFloat(margins[3].split(':')[1]) || 5 : 5;
            }
            this.setupContent( );
        },

        onOk: function() {
            var data = {};
            this.commitContent(data);
            if(!data['bottomMargin'] || !data['leftMargin'] || !data['rightMargin'] || !data['topMargin']){
                editorIns.showNotification("纸张边距不能为空！");
                return false;
            }
            var reg = /^\d+(\.\d+)?$/;
            if(!reg.test(data['bottomMargin']) || !reg.test(data['leftMargin']) || !reg.test(data['rightMargin']) || !reg.test(data['topMargin'])){
                editorIns.showNotification("请正确设置纸张边距格式，纸张边距为数字格式");
                return false;
            }
            if(!data['selPaperSize']){
                editorIns.showNotification("请设置纸张后再确认，纸张不能为空");
                return false;
            }
            paperSetData.paperSize = data['selPaperSize'];
            paperSetData.paperMargin = {
                top: data['topMargin'] + 'mm',
                right: data['rightMargin'] + 'mm',
                bottom: data['bottomMargin'] + 'mm',
                left: data['leftMargin'] + 'mm'
            };
            editor.execCommand('paperSize',{"paperSize":paperSetData.paperSize,"paperMargin":paperSetData.paperMargin});
            return true;
        }
    };
});