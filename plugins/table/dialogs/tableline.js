(function () {
    function tableLineDialog(editor) {
        var type = 'leftTop-rightBottom';
        return {
            title: editor.lang.table.customTable,
            minWidth: 400,
            minHeight: 350,
            contents: [{
                id: 'info',
                label: editor.lang.table.customTable,
                elements: [
                    {
                        type: 'html',
                        html: '<style type="text/css">' +
                            '.left-area::-webkit-scrollbar {' +
                            'width: 6px;' +
                            'height: 6px;' +
                            'border-radius:8px;' +
                            '}' +
                            '.left-area::-webkit-scrollbar-thumb{' +
                            'background: #cdcdcd;' +
                            'border-radius:8px;' +
                            '}' +
                            '.left-area::-webkit-scrollbar-thumb:hover {' +
                            'background: #bebebe;' +
                            '}' +
                            '.main{' +
                            'display: flex;' +
                            'height: 200px;' +
                            '}' +
                            '.left-area{' +
                            'flex: 2;' +
                            'height: 345px;' +
                            'overflow-y: scroll;' +
                            'text-align: center;' +
                            '}' +
                            '.left-area>div{' +
                            'width:180px;' +
                            'height:100px;' +
                            'border:1px solid #000;' +
                            'margin:20px 40px;' +
                            '}' +
                            '.center-area{' +
                            'flex: 1;' +
                            'height: 330px;' +
                            'padding-left: 10px;' +
                            'border-left: 2px solid #f4f4f4;' +
                            '}' +
                            '#active{' +
                            'background-color: #d9e9fc;' +
                            '}' +
                            '.center-area input{' +
                            'width:120px !important;' +
                            'height:24px !important;' +
                            'border:1px solid #E6E6E6 !important;' +
                            'outline:none;' +
                            '}' +
                            '.showCenterText{' +
                            'transform: translate(-50%,-50%);' +
                            'white-space: nowrap;' +
                            'position: absolute;' +
                            'top: 50%;' +
                            'left: 50%;' +
                            'font-size: 20px;' +
                            '}' +
                            '</style>' +
                            '<div class="main">' +
                            '<div class="left-area">' +
                            '<div class="leftTop-rightBottom" style="position:relative;margin-top:0">' +
                            '<div class="showLeftText" style="white-space: nowrap;position: absolute;left:10px;bottom:30px;font-size:20px"></div>' +
                            '<div class="showRightText" style="white-space: nowrap;position: absolute;top:30px;right:10px;font-size:20px"></div>' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><line x1="0" y1="0" x2="180" y2="100" stroke="#000" stroke-width="1"/></svg>' +
                            '</div>' +
                            '<div class="leftTop-twoLine" style="position:relative">' +
                            '<div class="showLeftText" style="white-space: nowrap;position: absolute;left:10px;bottom:10px;font-size:20px"></div>' +
                            '<div class="showRightText" style="white-space: nowrap;position: absolute;top:10px;right:10px;font-size:20px"></div>' +
                            '<div class="showCenterText"></div>' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><line x1="0" y1="0" x2="90" y2="100" stroke="#000" stroke-width="1"/><line x1="0" y1="0" x2="180" y2="50" stroke="#000" stroke-width="1"/></svg>' +
                            '</div>' +
                            '<div class="leftBottom-rightTop" style="position:relative">' +
                            '<div class="showLeftText" style="white-space: nowrap;position: absolute;top:30px;left:10px;font-size:20px"></div>' +
                            '<div class="showRightText" style="white-space: nowrap;position: absolute;bottom:30px;right:10px;font-size:20px"></div>' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><line x1="0" y1="100" x2="180" y2="0" stroke="#000" stroke-width="1"/></svg>' +
                            '</div>' +
                            '<div class="leftBottom-twoLine" style="position:relative">' +
                            '<div class="showLeftText" style="white-space: nowrap;position: absolute;top:10px;left:10px;font-size:20px"></div>' +
                            '<div class="showRightText" style="white-space: nowrap;position: absolute;bottom:10px;right:10px;font-size:20px"></div>' +
                            '<div class="showCenterText"></div>' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><line x1="0" y1="100" x2="90" y2="0" stroke="#000" stroke-width="1"/><line x1="0" y1="100" x2="180" y2="50" stroke="#000" stroke-width="1"/></svg>' +
                            '</div>' +
                            '<div class="rightTop-twoLine" style="position:relative">' +
                            '<div class="showLeftText" style="white-space: nowrap;position: absolute;left:10px;top:10px;font-size:20px"></div>' +
                            '<div class="showRightText" style="white-space: nowrap;position: absolute;bottom:10px;right:10px;font-size:20px"></div>' +
                            '<div class="showCenterText"></div>' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><line x1="180" y1="0" x2="0" y2="50" stroke="#000" stroke-width="1"/><line x1="180" y1="0" x2="90" y2="100" stroke="#000" stroke-width="1"/></svg>' +
                            '</div>' +
                            '<div class="rightBottom-twoLine" style="position:relative">' +
                            '<div class="showLeftText" style="white-space: nowrap;position: absolute;bottom:10px;left:10px;font-size:20px"></div>' +
                            '<div class="showRightText" style="white-space: nowrap;position: absolute;top:10px;right:10px;font-size:20px"></div>' +
                            '<div class="showCenterText"></div>' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><line x1="180" y1="100" x2="90" y2="0" stroke="#000" stroke-width="1"/><line x1="180" y1="100" x2="0" y2="50" stroke="#000" stroke-width="1"/></svg>' +
                            '</div>' +
                            '</div>' +
                            '<div class="center-area">' +
                            '<div style="margin:0px 10px 10px 0"><label>左侧文字：</lebel><input class="leftText"></input></div>' +
                            '<div class="centerText-box" style="margin:10px 10px 10px 0"><label>中间文字：</lebel><input class="centerText"></input></div>' +
                            '<div style="margin:10px 10px 10px 0"><label>右侧文字：</lebel><input class="rightText"></input></div>' +
                            '</div>' +
                            '</div>'
                    }
                ]
            }],
            onLoad: function () {
                $(".left-area>div").on("click", function () {
                    $('.left-area>div').removeAttr("id");
                    $(this).attr("id", "active");
                    var _class = $(this).attr('class');
                    if (_class.indexOf('twoLine') > -1) {
                        $('.centerText-box').show();
                    } else {
                        $('.centerText-box').hide();
                    }
                    type = _class;
                    $('.showLeftText').text('');
                    $('.showCenterText').text('');
                    $('.showRightText').text('');
                    var _leftText = $('.leftText').val();
                    var _centerText = $('.centerText').val();
                    var _rightText = $('.rightText').val();
                    $('.' + type + ' .showLeftText').text(_leftText);
                    $('.' + type + ' .showCenterText').text(_centerText);
                    $('.' + type + ' .showRightText').text(_rightText);
                });


                $(".center-area input").on("input", function () {
                    var _class = $(this).attr('class');
                    var text = $(this).val();
                    if (_class == "leftText") {
                        $('.' + type + ' .showLeftText').text(text);
                    } else if (_class == "rightText") {
                        $('.' + type + ' .showRightText').text(text);
                    } else {
                        $('.' + type + ' .showCenterText').text(text);
                    }
                });
            },

            onShow: function () {
                $('.left-area>div').removeAttr("id");
                $('.left-area .leftTop-rightBottom').attr("id", "active");
                $('.center-area input').val('');
                $('.centerText-box').hide();
                $('.showLeftText').text('');
                $('.showCenterText').text('');
                $('.showRightText').text('');
                type = 'leftTop-rightBottom';
            },
            onOk: function () {
                var path = editor.elementPath(),
                    td = path.contains('td', 1);
                var width = "100%";
                var height = td.$.clientHeight;
                var xCenter = "50%";
                var yCenter = height / 2;
                var insert = '';
                var text = '';
                var line = '';
                //未填写文字的情况下，默认空格，让鼠标可以聚焦（可以移除斜线）
                var leftText = $('.leftText').val() || '\u200b';
                var centerText = $('.centerText').val() || '\u200b';
                var rightText = $('.rightText').val() || '\u200b';
                var textTransform = height > 150 ? 10 : 2;
                switch (type) {
                    case 'leftTop-rightBottom':
                        text = '<text x="0" y="' + (height - textTransform) + '">' + leftText + '</text><text x="' + width + '" y="' + textTransform + '" text-anchor="end" dominant-baseline="hanging">' + rightText + '</text>';
                        line = '<line x1="0" y1="0" x2="' + width + '"y2="' + height + '"stroke="#000" stroke-width="1"/>';
                        break;
                    case 'leftTop-twoLine':
                        text = '<text x="0" y="' + (height - textTransform) + '">' + leftText + '</text>' +
                            '<text x="' + xCenter + '" y="' + yCenter + '" text-anchor="middle" dominant-baseline="middle">' + centerText + '</text>' +
                            '<text x="' + width + '" y="' + textTransform + '" text-anchor="end" dominant-baseline="hanging">' + rightText + '</text>';
                        line = '<line x1="0" y1="0" x2="' + xCenter + '"y2="' + height + '"stroke="#000" stroke-width="1"/>' +
                            '<line x1="0" y1="0" x2="' + width + '"y2="' + yCenter + '"stroke="#000" stroke-width="1"/>';
                        break;
                    case 'leftBottom-twoLine':
                        text = '<text x="0" y="' + textTransform + '"dominant-baseline="hanging">' + leftText + '</text>' +
                            '<text x="' + xCenter + '" y="' + yCenter + '" text-anchor="middle" dominant-baseline="middle">' + centerText + '</text>' +
                            '<text x="' + width + '" y="' + (height - textTransform) + '" text-anchor="end">' + rightText + '</text>';
                        line = '<line x1="0" y1="' + height + '" x2="' + xCenter + '"y2="0" stroke="#000" stroke-width="1"/>' +
                            '<line x1="0" y1="' + height + '" x2="' + width + '"y2="' + yCenter + '"stroke="#000" stroke-width="1"/>';
                        break;
                    case 'leftBottom-rightTop':
                        text = '<text x="0" y="' + textTransform + '" dominant-baseline="hanging">' + leftText + '</text><text x="' + width + '" y="' + (height - textTransform) + '" text-anchor="end">' + rightText + '</text>';
                        line = '<line x1="0" y1="' + height + '" x2="' + width + '"y2="0" stroke="#000" stroke-width="1"/>';
                        break;
                    case 'rightTop-twoLine':
                        text = '<text x="0" y="' + textTransform + '"dominant-baseline="hanging">' + leftText + '</text>' +
                            '<text x="' + xCenter + '" y="' + yCenter + '" text-anchor="middle" dominant-baseline="middle">' + centerText + '</text>' +
                            '<text x="' + width + '" y="' + (height - textTransform) + '" text-anchor="end">' + rightText + '</text>';
                        line = '<line x1="' + width + '" y1="0" x2="0" y2="' + yCenter + '" stroke="#000" stroke-width="1"/>' +
                            '<line x1="' + width + '" y1="0" x2="' + xCenter + '"y2="' + height + '"stroke="#000" stroke-width="1"/>';
                        break;
                    case 'rightBottom-twoLine':
                        text = '<text x="0" y="' + (height - textTransform) + '">' + leftText + '</text>' +
                            '<text x="' + xCenter + '" y="' + yCenter + '" text-anchor="middle" dominant-baseline="middle">' + centerText + '</text>' +
                            '<text x="' + width + '" y="' + textTransform + '" text-anchor="end" dominant-baseline="hanging">' + rightText + '</text>';
                        line = '<line x1="' + width + '" y1="' + height + '" x2="' + xCenter + '"y2="0" stroke="#000" stroke-width="1"/>' +
                            '<line x1="' + width + '" y1="' + height + '" x2="0" y2="' + yCenter + '"stroke="#000" stroke-width="1"/>';
                        break;
                }
                insert = '<svg customline = true xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" display="block">' + text + line + '</svg>';
                td.$.innerHTML = insert;
            },
        };
    }
    CKEDITOR.dialog.add('tableLine', function (editor) {
        return tableLineDialog(editor);
    })
})()