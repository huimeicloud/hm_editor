/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Print Plugin
 */

// 删除PDF文件
function deletepdf(filePath) {
    if (!filePath) {
        return;
    }
    $.ajax({
        url: getHost() + '/emr-print/deletepdf',
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({filePath: filePath}),
        success: function (res) {
            console.log(res);
            editorIns.filePath = '';
        },
        error: function (err) {
            console.log(err);
        }
    });
}

editorIns.filePath = '';
function getHost() {
    var editorConfig = getConfig();
    return editorConfig.sdkHost||'';
}
function getConfig(editor){
    var editorConfig = editor?editor.HMConfig:window.HMConfig||{};
    return editorConfig;
}
function getPdfPath(path, params, syncType, download,callback) {
    // wk button 无法显示
    if (params.html) {
        params.html = params.html.replace(/<button/g, '<span type="button" ').replace(/<\/button>/g, '</span>');
    }
    var type = download?'下载':(syncType == '预览' ? '预览' : '打印');
    var layer = addLayer(type);
    $.ajax({
        url: getHost() + path,
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(params),
        success: function (res) {
            var url = getHost() + '/' + res.path+'#toolbar=0';
            if(download){

                // 创建一个临时的a标签来强制下载
                var downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = '文档_' + new Date().getTime() + '.pdf'; // 指定下载文件名
                downloadLink.target = '_blank'; // 打开新窗口
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                // 延迟删除服务器上的PDF文件
                setTimeout(function() {
                    deletepdf(res.path);
                }, 3000);
                if (layer) {
                    layer.remove();
                }
                return;
            }
            $.ajax({
                url: url ,
                type: 'GET',
                data: {},
                xhrFields: {
                    responseType: 'blob'
                },
                success: function(blob) {
                    // 创建Blob URL
                    var blobUrl = URL.createObjectURL(blob);

                    // 创建一个隐藏的iframe用于打印
                    $("#printIframe").attr("src",blobUrl)

                    $("#printIframe").off('load').on('load', function() {
                        try {
                            if (layer) {
                                layer.remove();
                            }
                            // 尝试调用iframe的打印功能
                            $("#printIframe")[0].contentWindow.print();

                             //iframe加载完成后你需要进行的操作
                             if (syncType == '预览') {
                                $("#printIframe").css({
                                    'position': 'absolute',
                                    'top': '0',
                                    'left': '0',
                                    'width': '100%',
                                    'height': '100%',
                                    'padding-top': '75px'
                                });
                            } else {
                                $("#printIframe")[0].contentWindow.print();
                                callback && callback();
                            }
                             // 打印完成后移除iframe并释放Blob URL
                             setTimeout(function() {
                                URL.revokeObjectURL(blobUrl);
                                deletepdf(res.path);
                            }, 3000);
                        } catch(e) {
                            // 如果失败，在新窗口中打开
                            var printWindow = window.open(blobUrl);
                            printWindow.onload = function() {
                                printWindow.print();
                            };
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error('加载PDF失败:', error);
                    if (layer) {
                        layer.remove();
                    }
                }
            });
        },
        error: function (err) {
            if (layer) {
                layer.remove();
            }
            editorIns.showNotification('生成PDF文件失败，请重试', 'warning');
            console.log(err);
        }
    });
}

/**
 * 处理未分页的续打标识
 */
function dealPrintLabel(editor, syncType) {
    var $body = $(editor.document.$.body);
    var breakLineEleStart = $body.find("[data-hm-node='continuation-identifier-start']");
    var breakLineEleEnd = $body.find("[data-hm-node='continuation-identifier-end']");
    var breakLineEleNew = $body.parent().find('>.breakLineEleNew');
    if (syncType === "打印") {
        breakLineEleStart.remove();
        breakLineEleEnd.remove();
        breakLineEleNew.remove();
        return true;
    }
    var parentsObj;
    var iterator;
    var idx;
    // 老续打
    if (breakLineEleStart.length > 0) {
        if (breakLineEleStart.length > 0) {
            breakLineEleStart.prevAll().css("opacity", "0").css('border-color', 'transparent')
                .find('*').css("opacity", "0").css('border-color', 'transparent');
            parentsObj = breakLineEleStart.parents();
            if (parentsObj && parentsObj.length > 0) {
                for (idx = 0; idx < parentsObj.length; idx++) {
                    iterator = $(parentsObj[idx]);
                    // 遇到 body 或者分页页面时 break
                    if (iterator[0].tagName === 'BODY'/* || iterator.hasClass('hm-logic-page')*/) {
                        break;
                    }
                    iterator.prevAll().css("opacity", "0").css('border-color', 'transparent');
                }
            }
            breakLineEleStart.css("display", "none");
        }
        if (breakLineEleEnd.length > 0) {
            breakLineEleEnd.nextAll().remove();
            parentsObj = breakLineEleEnd.parents();
            if (parentsObj && parentsObj.length > 0) {
                for (idx = 0; idx < parentsObj.length; idx++) {
                    iterator = $(parentsObj[idx]);
                    // 遇到 body 或者分页页面时 break
                    if (iterator[0].tagName === 'BODY'/* || iterator.hasClass('hm-logic-page')*/) {
                        break;
                    }
                    iterator.nextAll().remove();
                }
            }
            breakLineEleEnd.css("display", "none");
        }
        $body.find("[data-hm-page-break-before='always']").attr("style", function (i, val) {
            if (val.indexOf('page-break-before:always') !== -1) {
                return val;
            } else {
                return 'page-break-before:always;' + val;
            }
        });
        return true;
    }
    editor.showNotification("请先设置续打开始标识！");
    return false;
}
/**
 * 处理分页续打标识
 */
function dealPrintLabelNew(editor, syncType) {
    var $body = $(editor.document.$.body);
    var breakLineEleNew = $body.parent().find('>.breakLineEleNew');
    if (syncType === "打印") {
        breakLineEleNew.remove();
        return true;
    }
    // 新续打
    if (breakLineEleNew.length > 0) {
        var height = parseFloat(breakLineEleNew.css('height'));
        // 第一页
        var firstPage = $body.find('>').filter(function () {
            return $(this).offset().top + this.offsetHeight > height;
        }).first();
        // 删除第一页的页脚
        firstPage.find('>>.hm-page-footer-group').css("opacity", "0").css('border-color', 'transparent');
        // 删除第一页的页眉和部分内容
        firstPage.find('*').filter(function () {
            return $(this).offset().top + this.offsetHeight < 1 + height;
        }).css("opacity", "0").css('border-color', 'transparent');
        // 删除前面的页
        firstPage.prevAll().remove();
        return true;
    }
    editor.showNotification("请先设置续打开始标识！");
    return false;
}

function setPrintPageHFooterStyle(doc) {
    doc.body.style.width = 'auto';
    var style = doc.head.getElementsByClassName('page_head_footer');
    if (!style || style.length == 0) {
        var stylee = document.createElement('style');
        var _style = '@page { size: auto; margin: 5mm;} \
					html { padding: 0; margin: auto; background: #fff;} \
					body { padding: 0; margin: auto; margin-bottom: 0;  background-color: #fff;  box-shadow: none; } \
		';
        stylee.setAttribute('media', 'print');
        stylee.setAttribute('class', 'page_head_footer');
        stylee.innerHTML = _style;
        doc.head.appendChild(stylee);
    }
}


function setPrintPageHFooterStyle(doc) {
    doc.body.style.width = 'auto';
    var style = doc.head.getElementsByClassName('page_head_footer');
    if (!style || style.length == 0) {
        var stylee = document.createElement('style');
        var _style = '@page { size: auto; margin: 5mm;} \
					html { padding: 0; margin: auto; background: #fff;} \
					body { padding: 0; margin: auto; margin-bottom: 0;  background-color: #fff;  box-shadow: none; } \
		';
        stylee.setAttribute('media', 'print');
        stylee.setAttribute('class', 'page_head_footer');
        stylee.innerHTML = _style;
        doc.head.appendChild(stylee);
    }
}

function doPrintChrome(editor, syncType, timeout,download, callback) {
    // 使用http打印

    var head = editor.document.getHead().clone(true);
    var body = editor.document.getBody();
    var config = getConfig(editor);
    var printConfig = config.printConfig||{};
    if (config.watermark && config.watermark.watermarkType) {
        if (!config.watermark.watermarkPrint ) {
            body.find('.mask_box').remove();
        }
    }
    CKEDITOR.plugins.pagebreakCmd.switchCssPrint(editor);
    // 处理粗体
    convertBoldToStrong(body.$);

    // region 处理页末新数据元两端对齐的问题. 如果是以下的情况, 则需要把 span 里面的 br 拆分至多个 p 标签中.
    //  <p>
    //      <span>...</span>
    //      <span>
    //          ...<br>
    //          ...<br>
    //          ...
    //      </span>
    //  <p>

    // 找到后先移除 .justify-last
    var justifyLasts = $(body.$).find('.justify-last').removeClass('justify-last');
    var justifyLast;

    for (var justifyLastIndex = 0; justifyLastIndex < justifyLasts.length; justifyLastIndex++) {
        justifyLast = justifyLasts[justifyLastIndex];

        // 如果是 td 就套一个 p: 在分页的逻辑中, 只会对 p, pre 和 td 加该类型.
        if (justifyLast.tagName === 'TD') {
            var p = document.createElement('p');
            while (justifyLast.childNodes.length > 0) {
                p.append(justifyLast.firstChild);
            }
            justifyLast.appendChild(p);
            justifyLast = p;
        }

        // 查看里面是否有 br, 有的话就要拆分到另外的 p/pre 里面. 这里要处理所有的 br, 因为 .justify-last 时不存在 <p><br><p> 的情况.
        var brs = justifyLast.getElementsByTagName('BR');
        // 在循环过程中, brs 的长度会变. 所以要先拿出来.
        var brsLen_1 = brs.length - 1;
        // 分离每个 br
        for (var bri = brsLen_1; bri > 0; bri--) {
            var br = brs[bri];
            var brParent;
            var split;
            // 逐级分离单个 br
            do {
                brParent = br.parentNode;
                split = brParent.cloneNode();
                while (br.nextSibling) {
                    split.appendChild(br.nextSibling);
                }
                brParent.parentNode.insertBefore(split, brParent.nextSibling);

                // 如果是最外层的话就不用 p 套 br 了
                if (brParent === justifyLast) {
                    // br.remove();
                    if (bri === brsLen_1) {
                        split.className += ' justify-last';
                    }
                    break;
                }
                // 否则 br 需要递归挪上去
                brParent.parentNode.insertBefore(br, split);
            } while (brParent);
        }
    }
    // endregion


    var paperOptPx = editor.plugins.paper.paperOptPx;
    var paperSizeStr = body.getAttribute('data-hm-paperSize');
    var paperSize = paperSizeStr && paperSizeStr.split('$');
    if (!paperSize || paperSize.length != 2 || !paperOptPx[paperSize[0]]) {
        editor.showNotification('请设置纸张(齿轮状图标)后再执行打印');
        return;
    }


    var pageSize = paperSize[0].split('_')[0];
    var paperOrientation = paperSize[0].split('_')[1];

    var title = head.findOne('title');
    title.remove();

    var links = head.find('link');
    for (var i = 0, len = links.count(); i < len; i++) {
        var link = links.getItem(i);
        link.remove();
    }

    var editorHref = getHost();

    var link = new CKEDITOR.dom.element('link');
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');
    var contentLink = link.clone();
    contentLink.setAttribute('href', editorHref + '/contents.css');
    head.append(contentLink);

    var fontLink = link.clone();
    fontLink.setAttribute('href', editorHref + '/vendor/font-awesome.min.css');
    head.append(fontLink);

    var printLink = link.clone();
    printLink.setAttribute('href', editorHref + '/print.css');
    //printLink.setAttribute('media','print');//dosen't take effect? why?
    head.append(printLink);


    var styles = head.find('style');
    for (var i = 0, len = styles.count(); i < len; i++) {
        var style = styles.getItem(i);
        if (style.$.textContent.indexOf('_emr') < 0) {
            style.remove();
        }
    }
    var meta = new CKEDITOR.dom.element('meta');
    meta.setAttribute('charset', 'utf-8');
    head.append(meta, true);

    var imgs = body.find('img');
    for (var i = 0, len = imgs.count(); i < len; i++) {
        var img = imgs.getItem(i);
        var src = img.$.src.match('emr-editor(.*)');
        if (src && src.length == 2) {
            src = src[1];
            img.setAttribute('src', editorHref + src);

        }
    }

    //背景无法被打印支持？
    var nodeWithImgs = body.find('[data-hm-node="expressionbox"]');
    for (var i = 0, len = nodeWithImgs.count(); i < len; i++) {
        var nodeWithImg = nodeWithImgs.getItem(i);
        var imgSrc = nodeWithImg.getStyle('background-image')
        if (imgSrc) {
            var imgEle = new CKEDITOR.dom.element('img');
            imgEle.setStyle('width', '100%');
            imgEle.setStyle('height', '100%');
            var base64 = imgSrc.match('"(.*)"');
            if (base64 && base64.length == 2) {
                imgEle.setAttribute('src', base64[1]);
                nodeWithImg.setStyle('background-image', 'none');
                nodeWithImg.append(imgEle);
            }

        }
    }
    $(body.$).find('span[data-hm-node="newtextbox"][_border]').css('border','1px solid black').css('min-width','12px').css('height','12px')
        .css("font-size","12px").css('display','inline-block').css('text-align','center').css("line-height","12px");
    dealPrintGroupTable($(body.$));
    $(body.$).find('span[diag]').css('display','none');
    $(body.$).find('span[operation]').css('display','none');
    // 如果不保存 pdf 的话可以直接在用户电脑上打印
    // 分页模式打印是否生成pdf
    if (!printConfig.pageBreakPrintPdf && !download) { 
        if($(body.$).find('.doc-reminder').length > 0){
            $(body.$).find('.doc-reminder').remove();
        }
        document.getElementById('cke_1_contents').getElementsByTagName('iframe')[0].contentWindow.print();
        callback && callback();
        return;
    }


    var optionsParams = {
        "options": {
            "disableSmartShrinking": true,
            "pageSize": pageSize,
            "encoding": 'UTF-8',
            "orientation": paperOrientation,
            "marginTop": '0px',
            "marginBottom": '0px',
            "marginLeft": '0px',
            "marginRight": '0px',
            "headerHtml": '',
            "footerHtml": '',
        }
    };
    if (syncType == "续打") { // 续打增加续打标志
        optionsParams['isPrintcontinued'] = '1';
        // var currentUserInfo = JSON.parse(sessionStorage.getItem('emr_currentUserInfo')) || {};
        optionsParams['hospitalParams'] = {

        };
    }

    var headHtml = head.getOuterHtml();
    timeout = isNaN(timeout) ? 100 : timeout;

    // checkDaiwenFont(body, papareHeaderStr, papareFooterStr);
    var bodyContent = body.getOuterHtml();

    // 使用已有的 dynamicHeader 函数来传输 html
    var htmlToken = $.ajax({
        url: '/emr-editor/dynamicHtml',
        type: 'post',
        async: false,
        timeout: 2000,
        data: {html: '<!DOCTYPE html><html style="padding-top: 0;">' + headHtml + bodyContent + '</html>'}
    });
    optionsParams.htmlToken = editorHref + '/emr-editor/dynamicHeaderFooter?uuid=' + htmlToken.responseText;

    $(body.find('.emrWidget-content').$).css('display', 'block');
    // 保存病历: id, 如果不保存 pdf 的话可以直接在用户电脑上打印
    var recordWidgets = body.find("[data-hm-widgetid]");
    var recordIds = [];
    if (recordWidgets.count()) {
        for (var _ = 0; _ < recordWidgets.count(); _++) {
            recordIds.push(recordWidgets.getItem(_).getAttribute('data-hm-widgetid'));
        }
    }
    optionsParams.recordIds = recordIds;
    var timeIndex = setTimeout(function () {
        getPdfPath('/emr-print/getChromeHtml2PdfPath', optionsParams, syncType, download, callback);
        clearTimeout(timeIndex);
    }, timeout);
}
function doPrint(editor, syncType, timeout, download,callback) {
    // 使用http打印
    var p;
    var config = getConfig(editor);
    var printConfig = config.printConfig||{};
    var head = editor.document.getHead().clone(true);
    var body = editor.document.getBody();

    var paperOptPx = editor.plugins.paper.paperOptPx;
    var paperSizeStr = body.getAttribute('data-hm-paperSize');
    var paperSize = paperSizeStr && paperSizeStr.split('$');
    if (!paperSize || paperSize.length != 2 || !paperOptPx[paperSize[0]]) {
        editor.showNotification('请设置纸张(齿轮状图标)后再执行打印');
        return;
    }
    var startPage=0;
    if(editorIns.startPage){
        startPage=parseInt(editorIns.startPage)-1;
    }
    var pageSize = paperSize[0].split('_')[0];
    var paperOrientation = paperSize[0].split('_')[1];

    var paperMarginPx = CKEDITOR.plugins.paperCmd.paperMarginPx;
    var topVal = paperMarginPx.top;
    var rightVal =  paperMarginPx.right;
    var bottomVal =  paperMarginPx.bottom;
    var leftVal = paperMarginPx.left;
    var paperMargin = {
        top: topVal + 'px',
        right: rightVal + 'px',
        bottom: bottomVal + 'px',
        left: leftVal + 'px'
    };

    // continuePrintParam 是续打的参数
    var continuePrintParam = {"start": -1, "header": -1, "footer": -1};
    try {
        continuePrintParam.start = paperOptPx[paperSize[0]].height;
    } catch (err) {
        console.error(err);
        console.log(paperOptPx);
        console.log(paperSize[0]);
        console.error('----end---');
    }
    var title = head.findOne('title');
    title.remove();

    var links = head.find('link');
    for (var i = 0, len = links.count(); i < len; i++) {
        var link = links.getItem(i);
        link.remove();
    }

    var editorHref = getHost();

    var link = new CKEDITOR.dom.element('link');
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');
    var contentLink = link.clone();
    contentLink.setAttribute('href', editorHref + '/contents.css');
    head.append(contentLink);

    var fontLink = link.clone();
    fontLink.setAttribute('href', editorHref + '/vendor/font-awesome.min.css');
    head.append(fontLink);

    var printLink = link.clone();
    printLink.setAttribute('href', editorHref + '/print.css');
    //printLink.setAttribute('media','print');//dosen't take effect? why?
    head.append(printLink);


    var styles = head.find('style');
    for (var i = 0, len = styles.count(); i < len; i++) {
        var style = styles.getItem(i);
        if (style.$.textContent.indexOf('_emr') < 0) {
            style.remove();
        }
    }
    var meta = new CKEDITOR.dom.element('meta');
    meta.setAttribute('charset', 'utf-8');
    head.append(meta, true);

    var papareHeaders = body.find('[_paperheader]');
    var papareFooters = body.find('[_paperfooter]');
    var headLen = papareHeaders.count();
    var footerLen = papareFooters.count();
    // var body_px = $(body.$).outerWidth();
    // var body_mm = parseInt(paperOpt[paperSize[0]].width);
    var papareHeaderStr = "";
    var paperHeaderHeight = topVal;
    if (headLen > 0) {
        for (p = 0; p < headLen; p++) {
            var papareHeader = papareHeaders.getItem(p);

            if ($(papareHeader.$).is(':hidden')) continue;

            papareHeader.setStyle('table-layout', 'fixed');
            papareHeader.setStyle('border-collapse', 'collapse');

            papareHeaderStr += papareHeader.getOuterHtml();

            paperHeaderHeight += $(papareHeader.$).height();

            papareHeader.remove();
        }
        // 打印时预留的页眉 + 页边距
        continuePrintParam.header = paperHeaderHeight;
        continuePrintParam.start -= paperHeaderHeight;

        if (papareHeaderStr) {
            var headerOpacity = '';
            if(syncType === "续打"){
                headerOpacity = 'opacity:0;';
            }
            // css 写在 print.css 里面没用?
            papareHeaderStr = '<div style="font-family:SimSun;line-height:1.5;margin-left:' + paperMargin.left +
                ';'+headerOpacity+'margin-right:' + paperMargin.right + '">' +
                '<style>p{margin:0!important;}table td, table th{padding:0!important;}</style>' +
                papareHeaderStr + '</div>';
        }

        var paperHeaderToken = $.ajax({
            url: editorHref+'/emr-editor/dynamicHeader',
            type: 'post',
            async: false,
            timeout: 2000,
            data: {html: papareHeaderStr}
        });

    }

    var papareFooterStr = "";
    var paperFooterHeight = bottomVal;
    if (footerLen > 0) {

        for (p = 0; p < footerLen; p++) {
            var papareFooter = papareFooters.getItem(p);

            if ($(papareFooter.$).is(':hidden')) continue;

            papareFooter.setStyle('table-layout', 'fixed');
            papareFooter.setStyle('border-collapse', 'collapse');

            papareFooterStr += papareFooter.getOuterHtml();

            paperFooterHeight += $(papareFooter.$).height();

            papareFooter.remove();
        }
        // 打印时预留的页脚 + 页边距
        continuePrintParam.footer = paperFooterHeight;


        if (papareFooterStr) {
            if (startPage === 0) {
				if (papareFooterStr.search('第') != -1 && papareFooterStr.search('页') != -1) {
					var before = papareFooterStr.split('第')[0];
					var center = papareFooterStr.split('第')[1];
					var after = center.split('页')[1];
					center = center.split('页')[0];
					var num = center.replace(/[^0-9]/ig,"");

					if (num && num !== '' && num > 0) {
						startPage = parseInt(num) - 1;
						papareFooterStr = before + "第<span contenteditable=\"false\" class=\"page\"> </span>页" + after;
					}
				}

			}
            // css 写在 print.css 里面没用?
            papareFooterStr = '<div style="font-family:SimSun;line-height:1.5;margin-left:' + paperMargin.left +
                ';margin-right:' + paperMargin.right + '">' +
                '<style>p{margin:0!important;}table td, table th{padding:0!important;}</style>' +
                papareFooterStr + '</div>';
        }

        var paperFooterToken = $.ajax({
            url: editorHref+'/emr-editor/dynamicFooter',
            type: 'post',
            async: false,
            timeout: 2000,
            data: {html: papareFooterStr}
        })
    }

    //默认另页打印时，不会另起一页，也不会单独一页，是连续的
    var anotherTempaltes = printConfig.pageAnotherTpls||[],
    aloneTempaltes = printConfig.pageAloneTpls||[];
    if (aloneTempaltes.length > 0 || aloneTempaltes.length > 0) {
        var widgets = body.find('.emrWidget-content');
        var tempIndex = -1;
        for (var i = 0, len = widgets.count(); i < len; i++) {
            var widget = widgets.getItem(i);
            var templateName = widget.getAttribute('data-hm-widgetname');
            var aloneFlag = aloneTempaltes.includes(templateName);
            var anotherFlag = anotherTempaltes.includes(templateName);
            if (i == tempIndex) { // 单独一页处理，将需要单独一页的病历的下一个病历设置该属性
                $(widget.$).parents('div').last().attr('style', 'page-break-before:always');
                tempIndex = -1;
            }
            if (aloneFlag && i == 0) { // 第一个病历不需要设置前一个分页打印
                tempIndex = i + 1;
            }
            if (aloneFlag && i > 0) {
                $(widget.$).parents('div').last().attr('style', 'page-break-before:always');
                tempIndex = i + 1;
            }
            if (anotherFlag) {
                $(widget.$).parents('div').last().attr('style', 'page-break-before:always');
                //设置"data-hm-page-break-before"属性，以便dealPrintLabel方法（该方法里面opacity:0会移除分页样式）里面添加分页样式
                $(widget.$).parents('div').last().attr('data-hm-page-break-before', 'always');
            }
        }
    }
    var imgs = body.find('img');
    for (var i = 0, len = imgs.count(); i < len; i++) {
        var img = imgs.getItem(i);
        var src = img.$.src.match('emr-editor(.*)');
        if (src && src.length == 2) {
            src = src[1];
            img.setAttribute('src', editorHref + src);

        }
    }

    //背景无法被打印支持？
    var nodeWithImgs = body.find('[data-hm-node="expressionbox"]');
    for (var i = 0, len = nodeWithImgs.count(); i < len; i++) {
        var nodeWithImg = nodeWithImgs.getItem(i);
        var imgSrc = nodeWithImg.getStyle('background-image')
        if (imgSrc) {
            var imgEle = new CKEDITOR.dom.element('img');
            imgEle.setStyle('width', '100%');
            imgEle.setStyle('height', '100%');
            var base64 = imgSrc.match('"(.*)"');
            if (base64 && base64.length == 2) {
                imgEle.setAttribute('src', base64[1]);
                nodeWithImg.setStyle('background-image', 'none');
                nodeWithImg.append(imgEle);
            }

        }
    }
    // 边框
    $(body.$).find('span[data-hm-node="newtextbox"][_border]').css('border','1px solid black').css('min-width','12px').css('height','14px').css("font-size","10px")
        .css('display','inline-block').css('text-align','left').css("line-height","14px");
        //.css("line-height","12px").css("vertical-align","text-bottom");
    dealPrintGroupTable($(body.$));
    // 处理续打
    if ((syncType === "打印" || syncType === "续打") && !dealPrintLabel(editor, syncType)) {  //处理打印标识
        return;
    }

    var optionsParams = {
        "options": {
            "pageOffset":startPage,
            "disableSmartShrinking": true,
            "pageSize": pageSize,
            "encoding": 'UTF-8',
            "orientation": paperOrientation,
            "marginTop": paperHeaderHeight + 'px',
            "marginBottom": paperFooterHeight + 'px',
            "marginLeft": '0px',
            "marginRight": '0px',
            "headerHtml": paperHeaderToken ? editorHref + '/emr-editor/dynamicHeaderFooter?uuid=' + paperHeaderToken.responseText : '',
            "footerHtml": paperFooterToken ? editorHref + '/emr-editor/dynamicHeaderFooter?uuid=' + paperFooterToken.responseText : ''
        }
    };
    if (syncType == "续打") { // 续打增加续打标志
        optionsParams['isPrintcontinued'] = '1';
        // var currentUserInfo = JSON.parse(sessionStorage.getItem('emr_currentUserInfo')) || {};
        optionsParams['hospitalParams'] = {
        };
        optionsParams.printParam = continuePrintParam;
    }
    if (config.watermark && config.watermark.watermarkType) {
        if (!config.watermark.watermarkPrint ) {
            body.find('.mask_box').remove();
        }
    }
    $(body.$).find('span[diag]').css('display','none');
    $(body.$).find('span[operation]').css('display','none');
    var headHtml = head.getOuterHtml();
    timeout = isNaN(timeout) ? 100 : timeout;
    // var _simPageList = $(body.$).find('div[_simPage]');
    checkDaiwenFont(body, papareHeaderStr, papareFooterStr);
    var bodyContent = body.getOuterHtml();
    optionsParams['html'] = '<!DOCTYPE html><html style="padding-top: 0;">' + headHtml + bodyContent + '</html>';
    $(body.find('.emrWidget-content').$).css('display', 'block');
    var timeIndex = setTimeout(function () {
        getPdfPath('/emr-print/getPdfPath', optionsParams, syncType,download, callback);
        clearTimeout(timeIndex);
    }, timeout);
}

function dealPrintGroupTable($body){

    $body.find('.group-table-btn').css('display','none');
    $body.find('.group-table-all').css('border','unset');
    $body.find('.group-table-all').css('border','none');
    $body.find('.group-table-all').css('border-color','#fff');
}
// 判断页眉页脚是否有傣文
function checkDaiwenFont(body, papareHeaderStr, papareFooterStr) {
    if ((papareHeaderStr && papareHeaderStr.indexOf('Xidai') > -1) || (papareHeaderStr && papareHeaderStr.indexOf('Xidai') > -1)) {
        $(body.$).append('<div style="font-family:Xidai;position:absolute;top:0;">&nbsp;</div>');
    }
}

(function () {
    var syncCmd = {
        exec: function (editor, syncType, timeout) {
            var savePrintFunction = function () {
               editor.fire('toolbarCommandComplete',{command:'print',type:syncType,data:{}});
            };
            var editorSize = window.hmEditor.editorSize||{};
            if (editorSize.size != 1) {
                editorSize.enlargeOrShrink('恢复原始宽度');
            }
            var download = false;
            if(syncType=='下载'){
                syncType = '打印';
                download = true;
            }
            if (!getConfig(editor).realtimePageBreak) {
                doPrint(editor, syncType, timeout, download,savePrintFunction);
            } else {
                doPrintChrome(editor, syncType, timeout, download,savePrintFunction);
            }
        },
        canUndo: false,
        readOnly: 1,
        modes: {wysiwyg: 1}
    };

    var pluginName = 'print';

    // 打印之前需要等待分页完成
    function execPrintCommand(editor, var1, var2) {
        // 如果加载了分页插件且不使用wk打印就等待分页完成
        if (CKEDITOR.plugins.pagebreakCmd && getConfig(editor).realtimePageBreak) {
            var waitPaging = setInterval(function () {
                if (editor.autoPagebreakCounter >= 0  && !CKEDITOR.plugins.pagebreakCmd.autoPaging) {
                    window.clearInterval(waitPaging);
                    editor.execCommand(var1, var2);
                }
            }, 50);
        } else {
            editor.execCommand(var1, var2);
        }
    }

    CKEDITOR.plugins.add(pluginName, {
        requires: 'menubutton',
        lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        icons: 'print', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        init: function (editor) {
            if (editor.elementMode == CKEDITOR.ELEMENT_MODE_INLINE) { // Print plugin isn't available in inline mode yet.
                return;
            }
            var ctrlKeyDisplay = CKEDITOR.tools.keystrokeToString(editor.lang.common.keyboard, CKEDITOR.CTRL).display;
            var shiftKeyDisplay = CKEDITOR.tools.keystrokeToString(editor.lang.common.keyboard, CKEDITOR.SHIFT).display;
            var items = {};
            editor.addCommand(pluginName, syncCmd);
            items['打印'] = {
                label: '打印' + '<span class=\'hm-shortcut-label\'>' + ctrlKeyDisplay + '+P</span>',
                group: pluginName,
                onClick: function () {
                    execPrintCommand(editor, pluginName, '打印');
                }
            };
            items['续打'] = {
                label: '续打' + '<span class=\'hm-shortcut-label\'>' + ctrlKeyDisplay + '+' + shiftKeyDisplay + '+P</span>',
                group: pluginName,
                onClick: function () {
                    execPrintCommand(editor, pluginName, '续打');
                }
            };

            editor.ui.add('Print', CKEDITOR.UI_MENUBUTTON, {
                label: '打印',
                command: pluginName,
                toolbar: 'document,50',
                onMenu: function () {
                    var activeItems = {};
                    for (var prop in items)
                        activeItems[prop] = CKEDITOR.TRISTATE_OFF;
                    return activeItems;
                }
            });

            editor.addMenuGroup(pluginName);
            editor.addMenuItems(items);

            // 键盘打印事件
            editor.addCommand('keyboard-print', {
                exec: function (editor) {
                    execPrintCommand(editor, 'print', '打印');
                    return true; // 停止事件冒泡
                }
            });
            // 键盘续打事件
            editor.addCommand('keyboard-continued-print', {
                exec: function (editor) {
                    execPrintCommand(editor, 'print', '续打');
                    return true; // 停止事件冒泡
                }
            });

            editor.on('beforeCommandExec', function 打印前保存(evt) {
                if ('print' === evt.data.command.name) {
                    // 滚动高度
                    var documentElement = editor.document.$.documentElement;
                    if (documentElement) {
                        editor.scroollBeforePrint = {
                            top: documentElement.scrollTop,
                            left: documentElement.scrollLeft
                        };
                    }
                    // 只读的情况下不会产生镜像. 另外如果 第二个参数中的 'forceUpdate' 设置为 true 时也不会产生镜像, 会影响后续判断. 所以不要设置为 true.
                    editor.imageBeforePrint = editor.fire('lockSnapshot', {tags: ['beforePrint']}).image;
                    if(!editor.imageBeforePrint){
                        editor.printSnapshot = editor.getSnapshot();
                    }


                }
            }, null, null, -101);
            // 因为新续打是按照高度来算的, 所以必须先设置续打
            editor.on('beforeCommandExec', function 设置续打(evt) {
                if ('print' === evt.data.command.name) {
                    var syncType = evt.data.commandData;
                    if ($(editor.document.$.body).children().filter('.' + CKEDITOR.plugins.pagebreakCmd.LOGIC_PAGE_CLASS).length &&
                        (syncType === "打印" || syncType === "续打") && !dealPrintLabelNew(editor, syncType)) {  //处理打印标识
                        //由于未设置续打印标识，故由于打印前保存时已生成快照，需清除快照，否则影响后续打印导致还原快照内容不一致
                        // 只读的情况下不会产生镜像
                        try {
                            if (editor.imageBeforePrint) {
                                editor.undoManager.restoreImage(editor.imageBeforePrint, {name: '打印结束'});
                            } else {
                                editor.loadSnapshot(editor.printSnapshot);
                            }
                            // 恢复滚动高度
                            if (editor.scroollBeforePrint) {
                                if (editor.document.$.defaultView) {
                                    editor.document.$.defaultView.scrollTo(editor.scroollBeforePrint.left, editor.scroollBeforePrint.top);
                                }
                                delete editor.scroollBeforePrint;
                            }
                        } catch (e) {
                            console.error(e)
                            editor.showNotification('打印后恢复编辑状态失败, 请联系运维人员.', 'error');
                            debugger
                        }
                        editor.fire('unlockSnapshot');
                        return false;
                    }
                }
            }, null, null, -100);

            editor.on('afterCommandExec', function 打印后操作(evt) {
                {
                    if ('print' === evt.data.command.name) {
                        // 恢复快照 (旧版体温单除外)
                        if (!editor.isPrintAll) {
                            // 只读的情况下不会产生镜像
                            try {
                                if (editor.imageBeforePrint) {
                                    editor.undoManager.restoreImage(editor.imageBeforePrint, {name: '打印结束'});
                                } else {
                                    editor.loadSnapshot(editor.printSnapshot);
                                }
                                // 恢复滚动高度
                                if (editor.scroollBeforePrint) {
                                    if (editor.document.$.defaultView) {
                                        editor.document.$.defaultView.scrollTo(editor.scroollBeforePrint.left, editor.scroollBeforePrint.top);
                                    }
                                    delete editor.scroollBeforePrint;
                                }
                            } catch (e) {
                                console.error(e)
                                editor.showNotification('打印后恢复编辑状态失败, 请联系运维人员.', 'error');
                                debugger
                            }
                            editor.fire('unlockSnapshot');
                        }
                        if (!editor.traceShow) { //  打印前隐藏留痕
                            editor.execCommand('trace');
                        }
                        var $body = $(editor.document.getBody().$);
                        if ($body.hasClass('hm-revise-hide')) {
                            showReviseModel($(editor.document.getBody().$));
                        }


                            // initEditPermissions(editor, 'print');

                        var editable = editor.editable();
                        editable.fire('togglePlaceHolder', {'showAllPlaceholder': true});
                        // 打印后聚合病历切换时不能定位左侧定标----影响打印/续打后左侧列表定位及展示
                        //initDocumentFireEvt(editorIns, $(editor.document.getBody().$));
                    }
                }
            }, null, null, 100);
        }
    });

})();
