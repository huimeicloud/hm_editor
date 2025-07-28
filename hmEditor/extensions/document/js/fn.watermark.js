commonHM.component['documentModel'].fn({
    /**
     * 设置文档水印
     * 判断 当前是否分页
     */
    setWatermark: function () {
        var _t = this;
        var _body = $(_t.editor.document.getBody().$);
        var realtimePageBreak = _t.editor.HMConfig.realtimePageBreak;
        var isLogicPage = _body.find('.hm-logic-page').length > 0;
        if (realtimePageBreak && isLogicPage) {
            // 分页
            _body.find('.hm-logic-page').each(function(){
                _t.watermark($(this));
            });
        }else{
            // 不分页
            _t.watermark(_body);
        }
    },
    /**
     * 设置文档水印
     * @param {Object} $body 文档对象
     */
    watermark: function ($body) {
        var _t = this;
        var settings = _t.editor.HMConfig.watermark;
        var paperOptMm = {
            'A4_portrait': {
                'width': '210mm',
                'height': '297mm'
            },
            'A4_landscape': {
                'width': '297mm',
                'height': '210mm'
            },
            'A3_portrait': {
                'width': '297mm',
                'height': '420mm'
            },
            'A3_landscape': {
                'width': '420mm',
                'height': '297mm'
            },
            'A5_portrait': {
                'width': '148mm',
                'height': '210mm'
            },
            'A5_landscape': {
                'width': '210mm',
                'height': '148mm'
            },
            'B5_portrait': {
                'width': '176mm',
                'height': '250mm'
            },
            'B5_landscape': {
                'width': '250mm',
                'height': '176mm'
            }
        };
        var _body = $(_t.editor.document.getBody().$);
        if ($body) {
            _body = $body;
        }
        if (settings && settings.watermarkType) {
            _body.css('position', 'relative');
            var paperSizeStr = _body.attr('data-hm-paperSize');
            var paperSize = paperSizeStr && paperSizeStr.split('$');

            var body_w_px = _body.outerWidth();
            var body_h_px = _body.outerHeight();
            if (_t.editor.HMConfig.realtimePageBreak && paperSize) {
                var body_w_mm = parseInt(paperOptMm[paperSize[0]]['width']);
                var body_h_mm = parseInt(paperOptMm[paperSize[0]]['height']);
                body_h_px = body_w_px / body_w_mm * body_h_mm;
            }
            var watermark_rows = Math.floor(body_h_px / Number(settings.watermarkHeight || 50)); //水印行数
            var watermark_cols = Number(settings.watermarkColumn) || (settings.watermarkType = 1 ?3:1); //水印列数

            //默认设置
            var defaultSettings = {
                watermark_img: settings.watermarkImg || "",
                watermark_angle: settings.watermarkAngle || 15, //水印倾斜度数
                watermark_alpha: settings.watermarkAlpha || 0.3, //水印透明度
                watermark_width: body_w_px / watermark_cols, //水印宽度
                watermark_height: Number(settings.watermarkHeight) || 50, //水印高度
                watermark_txt: settings.watermarkText || "",
                watermark_color: settings.watermarkFontColor || '#000000', //水印字体颜色
                watermark_fontsize: settings.watermarkFontSize + 'px', //水印字体大小

            };
            if (settings.watermarkType == '2') {
                defaultSettings.watermark_txt = '';
            } else {
                defaultSettings.watermark_img = '';
            }
            $body.find('.mask_box').remove();

            var box = document.createElement('div');
            box.className = 'mask_box';
            box.style.position = "absolute";
            box.style.top = "0";
            box.style.left = "0";
            box.style.width = body_w_px + 'px';
            box.style.height = body_h_px + 'px';
            box.style.overflow = "hidden";
            box.setAttribute('contenteditable', 'false');

            var x;
            var y;
            for (var i = 0; i < watermark_rows; i++) {
                y = (defaultSettings.watermark_height) * i;
                for (var j = 0; j < watermark_cols; j++) {
                    x = (defaultSettings.watermark_width) * j;
                    var mask_div = document.createElement('div');
                    mask_div.id = 'mask_div' + i + j;
                    mask_div.className = 'mask_div';
                    mask_div.innerHTML = defaultSettings.watermark_txt;
                    if (settings.watermarkType == '2') {
                        var mask_img = document.createElement('img');
                        mask_img.className = 'mask_img';
                        mask_img.src = defaultSettings.watermark_img;
                        mask_img.style.width = "100%";
                        mask_img.style.height = "100%";
                        mask_div.append(mask_img);
                    }
                    //设置水印div倾斜显示
                    mask_div.style['-webkit-transform'] = "rotate(" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style['-moz-transform'] = "rotate(" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style['-os-transform'] = "rotate(" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style['transform'] = "rotate(" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style['-ms-transform'] = "rotate(" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style['-ms-filter'] = "progid:DXImageTransform.Microsoft.BasicImage(rotation=2)";

                    // mask_div.style.transform = "skew(0," + defaultSettings.watermark_angle + "deg)";
                    mask_div.style.visibility = "";
                    mask_div.style.position = "absolute";
                    mask_div.style.left = x + 'px';
                    mask_div.style.top = y + 'px';
                    mask_div.style.overflow = "hidden";
                    // mask_div.style.zIndex = "9999";
                    mask_div.style.pointerEvents = 'none'; //pointer-events:none  让水印不遮挡页面的点击事件
                    mask_div.style.opacity = defaultSettings.watermark_alpha;
                    mask_div.style.fontSize = defaultSettings.watermark_fontsize;
                    mask_div.style.color = defaultSettings.watermark_color;
                    mask_div.style.textAlign = "center";
                    mask_div.style.width = defaultSettings.watermark_width + 'px';
                    mask_div.style.height = defaultSettings.watermark_height + 'px';
                    if (j % 2 != 0) {
                        mask_div.style.lineHeight = defaultSettings.watermark_height + 'px';
                        mask_div.style.textAlign = 'center';
                    }
                    mask_div.style.display = "block";
                    mask_div.contenteditable = "true";
                    box.appendChild(mask_div);
                }
            }
            $body.prepend(box);
        } else {
            $body.find('.mask_box').remove();
        }
    }
});