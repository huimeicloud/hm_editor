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
    var host = editorConfig.sdkHost || '';
    // 如果末尾是斜杠，则去掉
    if (host.endsWith('/')) {
        host = host.slice(0, -1);
    }
    return host;
}
function getConfig(editor){
    var editorConfig = editor?editor.HMConfig:window.HMConfig||{};
    return editorConfig;
}
function getPdfPath(path, params, syncType, download, callback, downloadPdfCallback) {
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
                // 在 iframe 环境中，直接使用 URL 和 download 属性可能无法触发下载，而是打开新窗口
                // 因此先通过 AJAX 获取 blob，然后使用 blob URL 来强制下载
                $.ajax({
                    url: url,
                    type: 'GET',
                    data: {},
                    xhrFields: {
                        responseType: 'blob'
                    },
                    success: function(blob) {
                        // 如果存在回调函数，先调用回调返回PDF流
                        if (downloadPdfCallback && typeof downloadPdfCallback === 'function') {
                            try {
                                // 创建一个新的Blob副本传递给回调，避免后续操作影响
                                var blobCopy = new Blob([blob], { type: 'application/pdf' });
                                downloadPdfCallback(blobCopy);
                            } catch (e) {
                                console.error('调用PDF回调失败:', e);
                            }
                               // 释放Blob URL 并删除服务器文件
                            setTimeout(function() {
                                deletepdf(res.path);
                            }, 3000);
                            if (layer) {
                                layer.remove();
                            }
                            return;
                        }
                        
                        // 创建Blob URL
                        var blobUrl = URL.createObjectURL(blob);
                        
                        // 创建一个临时的a标签来强制下载
                        var downloadLink = document.createElement('a');
                        downloadLink.href = blobUrl;
                        downloadLink.download = '文档_' + new Date().getTime() + '.pdf'; // 指定下载文件名
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        
                        // 释放Blob URL 并删除服务器文件
                        setTimeout(function() {
                            URL.revokeObjectURL(blobUrl);
                            deletepdf(res.path);
                        }, 3000);
                        
                        if (layer) {
                            layer.remove();
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('下载PDF失败:', error);
                        if (layer) {
                            layer.remove();
                        }
                        // 如果获取blob失败，回退到直接下载方式
                        var downloadLink = document.createElement('a');
                        downloadLink.href = url;
                        downloadLink.download = '文档_' + new Date().getTime() + '.pdf';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        
                        setTimeout(function() {
                            deletepdf(res.path);
                        }, 3000);
                    }
                });
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
        // 删除续打标识，包括表格中的续打标识行
        if (breakLineEleStart.length > 0) {
            breakLineEleStart.closest('tr[data-hm-continuation-row="true"]').remove();
            breakLineEleStart.remove();
        }
        if (breakLineEleEnd.length > 0) {
            breakLineEleEnd.closest('tr[data-hm-continuation-row="true"]').remove();
            breakLineEleEnd.remove();
        }
        breakLineEleNew.remove();
        return true;
    }
    var parentsObj;
    var iterator;
    var idx;
    // 老续打
    if (breakLineEleStart.length > 0) {
        if (breakLineEleStart.length > 0) {
            // 检查续打标识是否在表格中
            var $continuationRow = breakLineEleStart.closest('tr[data-hm-continuation-row="true"]');
            if ($continuationRow.length > 0) {
                // 续打标识在表格中：需要隐藏表格中续打标识所在行之前的所有行
                var $table = $continuationRow.closest('table');
                if ($table.length > 0) {
                    // 隐藏表格中续打标识所在行之前的所有行（包括表头、thead、tbody等）
                    var $allRows = $table.find('tr');
                    var continuationRowIndex = $allRows.index($continuationRow);
                    $allRows.each(function(index) {
                        if (index < continuationRowIndex) {
                            $(this).css("opacity", "0").css('border-color', 'transparent')
                                .find('*').css("opacity", "0").css('border-color', 'transparent');
                        }
                    });
                    // 隐藏续打标识后续行的上边框，避免与上一页的下边框重叠
                    $allRows.each(function(index) {
                        if (index > continuationRowIndex) {
                            $(this).css("border-top", "none");
                            $(this).find('td, th').css("border-top", "none");
                        }
                    });
                    // 如果续打标识在第一行，还需要隐藏表格的上边框
                    if (continuationRowIndex === 0) {
                        $table.css("border-top", "none");
                    }
                    // 隐藏表格之前的所有内容
                    $table.prevAll().css("opacity", "0").css('border-color', 'transparent')
                        .find('*').css("opacity", "0").css('border-color', 'transparent');
                }
            } else {
                // 续打标识不在表格中：使用原有逻辑
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
            }
            breakLineEleStart.css("display", "none");
        }
        if (breakLineEleEnd.length > 0) {
            // 检查续打结束标识是否在表格中
            var $continuationEndRow = breakLineEleEnd.closest('tr[data-hm-continuation-row="true"]');
            if ($continuationEndRow.length > 0) {
                // 续打结束标识在表格中：需要删除表格中续打结束标识所在行之后的所有行
                var $table = $continuationEndRow.closest('table');
                if ($table.length > 0) {
                    // 删除表格中续打结束标识所在行之后的所有行
                    var $allRows = $table.find('tr');
                    var continuationEndRowIndex = $allRows.index($continuationEndRow);
                    $allRows.each(function(index) {
                        if (index > continuationEndRowIndex) {
                            $(this).remove();
                        }
                    });
                    // 删除表格之后的所有内容
                    $table.nextAll().remove();
                }
            } else {
                // 续打结束标识不在表格中：使用原有逻辑
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
    
    var breakLineEleNewStart = $body.parent().find('>.breakLineEleNewStart');
    var breakLineEleNewEnd = $body.parent().find('>.breakLineEleNewEnd');
    
    // 新续打 - 处理开始标识
    if (breakLineEleNewStart.length > 0) {
        var startHeight = parseFloat(breakLineEleNewStart.css('height'));
        // 第一页
        var firstPage = $body.find('>').filter(function () {
            return $(this).offset().top + this.offsetHeight > startHeight;
        }).first();
        // 删除第一页的页脚
        firstPage.find('>>.hm-page-footer-group').css("opacity", "0").css('border-color', 'transparent');
        // 删除第一页的页眉和部分内容
        firstPage.find('*').filter(function () {
            return $(this).offset().top + this.offsetHeight < 1 + startHeight;
        }).css("opacity", "0").css('border-color', 'transparent');

        // 删除前面的页
        firstPage.prevAll().remove();
    }
    
    // 新续打 - 处理结束标识
    if (breakLineEleNewEnd.length > 0) {
        // 结束标识遮罩的 top 值就是结束标识的位置
        var endHeight = parseFloat(breakLineEleNewEnd.css('top')) || parseFloat(breakLineEleNewEnd.css('height'));
        // 找到结束标识所在的页面
        var endPage = $body.find('>').filter(function () {
            return $(this).offset().top + this.offsetHeight > endHeight;
        }).first();
        
        if (endPage.length > 0) {
            // 删除结束标识所在页面之后的所有页面
            endPage.nextAll().remove();
            // 删除结束标识所在页面中结束标识之后的内容
            var hiddenElements = endPage.find('*').filter(function () {
                return $(this).offset().top > endHeight;
            });
            hiddenElements.css("opacity", "0").css('border-color', 'transparent')
                .find('*').css("opacity", "0").css('border-color', 'transparent');
        } else {
            // 如果结束标识在最后一页，删除结束标识之后的所有内容
            var hiddenElements = $body.find('*').filter(function () {
                return $(this).offset().top > endHeight;
            });
            hiddenElements.css("opacity", "0").css('border-color', 'transparent')
                .find('*').css("opacity", "0").css('border-color', 'transparent');
        }
    }
    
    // 如果只有结束标识，提示需要设置开始标识
    if (breakLineEleNewStart.length === 0 && breakLineEleNewEnd.length === 0) {
        editor.showNotification("请先设置续打开始标识！");
        return false;
    }
    
    return true;
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

function doPrintChrome(editor, syncType, timeout, download, callback, downloadPdfCallback) {
    // 使用http打印
    var head = editor.document.getHead().clone(true);
    var body = editor.document.getBody();
    var config = getConfig(editor);
    var shouldShowReviseInPrint = editor.reviseStateBeforePrint === 'show'; // 打印前修订模式状态
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
    prepareHmLinedCellsForPrint($(body.$));
    dealPrintGroupTable($(body.$));
    $(body.$).find('span[diag]').css('display','none');
    $(body.$).find('span[operation]').css('display','none');
    removeDocReminder(body); 
    
    // 如果不保存 pdf 的话可以直接在用户电脑上打印
    // 分页模式打印是否生成pdf
    if (!printConfig.pageBreakPrintPdf && !download) {
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

    // 根据打印前的修订模式状态处理打印内容
    var _class = shouldShowReviseInPrint?'hm-revise-show':'hm-revise-hide';
    $(body.$).addClass(_class);
    addReviseStyle(body, shouldShowReviseInPrint);

    // checkDaiwenFont(body, papareHeaderStr, papareFooterStr);
    var bodyContent = body.getOuterHtml();

    // 使用已有的 dynamicHeader 函数来传输 html
    var htmlToken = $.ajax({
        url: editorHref + '/emr-editor/dynamicHtml',
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
    
    // 恢复修订模式状态（如果之前修改了）
    if (!shouldShowReviseInPrint && editor.reviseStateBeforePrint === 'hide') {
        $(body.$).removeClass('hm-revise-hide').addClass('hm-revise-show');
    }
    
    var timeIndex = setTimeout(function () {
        getPdfPath('/emr-print/getChromeHtml2PdfPath', optionsParams, syncType, download, callback, downloadPdfCallback);
        clearTimeout(timeIndex);
    }, timeout);
}

function hmCellHasContent($cell) {
    return hmCellPlainText($cell).length > 0 || $cell.find('img,svg,canvas,table,[data-hm-node]').length > 0;
}

function hmCellPlainText($cell) {
    var text = $cell.text() || '';
    text = text.split('\u00a0').join('').split('\u200B').join('');
    text = text.split(' ').join('').split('\n').join('').split('\r').join('').split('\t').join('');
    return text;
}

function getHmCellLineHeightPx($cell) {
    var el = $cell[0];
    if (el && el.style && el.style.lineHeight) {
        var explicitPx = parseFloat($cell.css('line-height'));
        if (explicitPx && !isNaN(explicitPx)) {
            return Math.round(explicitPx * 100) / 100;
        }
    }

    var $styled = $cell.find('[style*="line-height"]').first();
    if ($styled.length) {
        var innerPx = parseFloat($styled.css('line-height'));
        if (innerPx && !isNaN(innerPx)) {
            return Math.round(innerPx * 100) / 100;
        }
    }

    var lineHeight = parseFloat($cell.css('line-height'));
    if (!lineHeight || isNaN(lineHeight)) {
        lineHeight = (parseFloat($cell.css('font-size')) || 16) * 1.5;
    }
    return Math.round(lineHeight * 100) / 100;
}

function syncHmCellLineHeightToWrapper($cell, $content) {
    var cellEl = $cell[0];
    var contentEl = $content[0];
    if (!cellEl || !contentEl || !contentEl.style) {
        return;
    }

    if (cellEl.style.lineHeight) {
        contentEl.style.lineHeight = cellEl.style.lineHeight;
        return;
    }

    var styledChild = $cell.find('[style*="line-height"]').first()[0];
    if (styledChild && styledChild.style && styledChild.style.lineHeight) {
        contentEl.style.lineHeight = styledChild.style.lineHeight;
        return;
    }

    $content.css('line-height', $cell.css('line-height'));
}

function hmLinedCellLineCount(cell) {
    var $cell = $(cell);
    if (!hmCellHasContent($cell)) {
        return 1;
    }

    var step = getHmCellLineHeightPx($cell);

    var range = cell.ownerDocument.createRange();
    range.selectNodeContents(cell);
    var rects = range.getClientRects();
    var lineTops = [];
    var mergeThreshold = Math.max(step * 0.45, 4);

    for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        if (rect.width <= 2 || rect.height <= 2) {
            continue;
        }
        var top = rect.top;
        var merged = false;
        for (var j = 0; j < lineTops.length; j++) {
            if (Math.abs(lineTops[j] - top) < mergeThreshold) {
                merged = true;
                break;
            }
        }
        if (!merged) {
            lineTops.push(top);
        }
    }

    return lineTops.length > 0 ? lineTops.length : 1;
}

/** 打印前为 hm-lined-cell 按行插入分隔线（DOM），wk 下比 CSS 渐变更稳定。 */
function prepareHmLinedCellsForPrint($root) {
    $root.find('table.hm-lined-cell td, table.hm-lined-cell th').each(function () {
        var $cell = $(this);
        var $wrapper = $cell.children('.hm-lined-content');

        $cell.find('.hm-line-sep').remove();
        if ($wrapper.length) {
            $wrapper.first().replaceWith($wrapper.first().contents());
        }
        if (!hmCellHasContent($cell)) {
            return;
        }

        var lineCount = hmLinedCellLineCount(this);
        if (lineCount <= 1) {
            return;
        }

        $cell.wrapInner('<div class="hm-lined-content"></div>');
        var $content = $cell.children('.hm-lined-content').first();
        syncHmCellLineHeightToWrapper($cell, $content);
        var lineHeight = getHmCellLineHeightPx($cell);

        for (var i = 1; i < lineCount; i++) {
            $('<div class="hm-line-sep" contenteditable="false"></div>')
                .css('top', (i * lineHeight) + 'px')
                .appendTo($content);
        }
    });
}

function doPrint(editor, syncType, timeout, download, callback, downloadPdfCallback) {
    // 使用http打印
    var p;
    var config = getConfig(editor);
    var printConfig = config.printConfig||{};
    var shouldShowReviseInPrint = editor.reviseStateBeforePrint === 'show'; // 打印前修订模式状态
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
            // 把style 位置放到最前面，确保样式优先级最高
            var _style = '<style>p{margin:0!important;}table td, table th{padding:0!important;}'+
            '.hm-revise-hide .hm_revise_del {display: none;}'+
            '.hm-revise-show .hm_revise_ins {color:#000;background-color:#dcf0dd;border-top:2px solid rgba(30,174,49,.35);border-bottom:2px solid rgba(30,174,49,.35);}'+
            '.hm-revise-show .hm_revise_del {display:inline;color:#000;background-color:#fce4ec;border-top:2px solid #e091a2;border-bottom:2px solid #e091a2;text-decoration:line-through!important;text-decoration-color:rgba(87,15,33,.5)!important;}'+
            '.hm-revise-show .hm_self_ins {color: initial;}'+'</style>';
            var _class = shouldShowReviseInPrint?'hm-revise-show':'hm-revise-hide';

            papareHeaderStr = _style + '<div style="font-family:SimSun;line-height:1.5;margin-left:' + paperMargin.left +
                ';'+headerOpacity+'margin-right:' + paperMargin.right +'" class="'+ _class +'" >' + 
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
    aloneTempaltes = printConfig.pageAloneTpls||[],
    pageAnotherCodes = printConfig.pageAnotherCodes||[],
    pageAloneCodes = printConfig.pageAloneCodes||[];
    if (aloneTempaltes.length > 0 || anotherTempaltes.length > 0 || pageAloneCodes.length > 0 || pageAnotherCodes.length > 0) {
        var widgets = body.find('.emrWidget-content');
        var tempIndex = -1;
        for (var i = 0, len = widgets.count(); i < len; i++) {
            var widget = widgets.getItem(i);
            var templateName = widget.getAttribute('data-hm-widgetname');
            var docCode = widget.getAttribute('data-hm-widgetid');
            var aloneFlag = aloneTempaltes.includes(templateName) || (docCode && pageAloneCodes.includes(docCode));
            var anotherFlag = anotherTempaltes.includes(templateName) || (docCode && pageAnotherCodes.includes(docCode));
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
    prepareHmLinedCellsForPrint($(body.$));
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
    // 移除质控提醒 及  ai 提醒
    removeDocReminder(body);
    // 清除 FA 图标 span 内的零宽空格文本节点，防止 wkhtmltopdf 将其渲染成多余方框
    $(body.$).find('span.fa[data-hm-node="checkbox"], span.fa[data-hm-node="radiobox"]').each(function() {
        for (var i = this.childNodes.length - 1; i >= 0; i--) {
            if (this.childNodes[i].nodeType === 3) {
                this.removeChild(this.childNodes[i]);
            }
        }
    });

    addReviseStyle(body, shouldShowReviseInPrint);

    var headHtml = head.getOuterHtml();
    timeout = isNaN(timeout) ? 100 : timeout;
    // var _simPageList = $(body.$).find('div[_simPage]');
    checkDaiwenFont(body, papareHeaderStr, papareFooterStr); 
    
    var bodyContent = body.getOuterHtml();
    optionsParams['html'] = '<!DOCTYPE html><html style="padding-top: 0;">' + headHtml + bodyContent + '</html>'; 
    
    $(body.find('.emrWidget-content').$).css('display', 'block');
    var timeIndex = setTimeout(function () {
        getPdfPath('/emr-print/getPdfPath', optionsParams, syncType, download, callback, downloadPdfCallback);
        clearTimeout(timeIndex);
    }, timeout);
}
/**
 * 添加修订样式
 * @param {Object} body - 文档对象
 * @param {boolean} shouldShowReviseInPrint - 是否显示修订
 */
function addReviseStyle(body, shouldShowReviseInPrint){
    if(shouldShowReviseInPrint){
        $(body.$).find('.hm_revise_ins').each(function() {
            $(this).attr('style', 'color:#000!important;background-color:#dcf0dd!important;border-top:2px solid rgba(30,174,49,.35)!important;border-bottom:2px solid rgba(30,174,49,.35)!important;');
        });
        $(body.$).find('.hm_revise_del').each(function() {
            $(this).attr('style', 'display:inline!important;color:#000!important;background-color:#fce4ec!important;border-top:2px solid #e091a2!important;border-bottom:2px solid #e091a2!important;text-decoration:line-through!important;text-decoration-color:rgba(87,15,33,.5)!important;');
        });
    }
}
// 移除质控提醒 及  ai 提醒
function removeDocReminder(body){
    // 移除doc-reminder元素
    if($(body.$).find('.doc-reminder').length > 0){
        $(body.$).find('.doc-reminder').remove();
    }
    // 移除doc-warn-level 类
    $(body.$).find('.doc-warn-txt').removeClass('doc-warn-txt');
    $(body.$).find('.doc-warn-level-1').removeClass('doc-warn-level-1');
    $(body.$).find('.doc-warn-level-2').removeClass('doc-warn-level-2');
    $(body.$).find('.doc-warn-level-3').removeClass('doc-warn-level-3');
    // 移除doc-warn-p 元素
    if($(body.$).find('.doc-warn-p').length > 0){
        $(body.$).find('.doc-warn-p').remove();
    }
    $(body.$).find('.r-model-gen-remark').remove();
    $(body.$).find('.sk-popup').remove();
    // 移除 AI 生成未保留内容（.r-model-gen）及 data-attach-ai 标记
    $(body.$).find('.r-model-gen').remove();
    $(body.$).find('[data-attach-ai]').removeAttr('data-attach-ai');

    // 移除日期导航相关元素
    $(body.$).find('.date-navigation').remove();
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
        exec: function (editor, data, timeout) {
            // 处理data参数：可能是字符串（旧方式）或对象（新方式，包含回调）
            var syncType, downloadPdfCallback;
            var download = false;
            
            if (typeof data === 'string') {
                // 兼容旧方式：直接传递字符串
                syncType = data;
            } else if (data && typeof data === 'object') {
                // 新方式：传递对象，包含type和callback
                syncType = data.type || data;
                downloadPdfCallback = data.callback;
            } else {
                syncType = data;
            }
            
            var savePrintFunction = function () {
               editor.fire('toolbarCommandComplete',{command:'print',type:syncType,data:{}});
            };
            var editorSize = window.hmEditor.editorSize||{};
            if (editorSize.size != 1) {
                editorSize.enlargeOrShrink('恢复原始宽度');
            }
            if(syncType=='下载'){
                syncType = '打印';
                download = true;
            }
            if (!getConfig(editor).realtimePageBreak) {
                doPrint(editor, syncType, timeout, download, savePrintFunction, downloadPdfCallback);
            } else {
                doPrintChrome(editor, syncType, timeout, download, savePrintFunction, downloadPdfCallback);
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
                    // 打印前把AI弹窗移除 不移除 恢复快照后，按钮点击事件会失效
                    // var $body = $(editor.document.getBody().$);
                    // $body.find('.doc-composer').parents('.sk-popup').remove();
                    window.hmEditor.hmAi.generator.closePopup();
                    window.hmEditor.hmAi.composer.removePopup();
                    // 滚动高度
                    var documentElement = editor.document.$.documentElement;
                    if (documentElement) {
                        editor.scroollBeforePrint = {
                            top: documentElement.scrollTop,
                            left: documentElement.scrollLeft
                        };
                    }
                    // 记录打印前的修订模式状态
                    var $body = $(editor.document.getBody().$);
                    if ($body.hasClass('hm-revise-hide')) {
                        editor.reviseStateBeforePrint = 'hide';
                        // 不在这里临时显示修订，而是在打印内容处理时根据状态决定
                    } else if ($body.hasClass('hm-revise-show')) {
                        editor.reviseStateBeforePrint = 'show';
                    } else {
                        editor.reviseStateBeforePrint = 'unknown';
                    }
                    // 记录打印前所有 data-hm-widgetid div 的 contenteditable 值
                    editor.widgetContenteditableBeforePrint = {};
                    var $widgets = $body.find('[data-hm-widgetid]');
                    $widgets.each(function() {
                        var widgetId = $(this).attr('data-hm-widgetid');
                        var contenteditable = $(this).prop('contenteditable');
                        if (widgetId) {
                            editor.widgetContenteditableBeforePrint[widgetId] = contenteditable;
                        }
                    });
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
                            // 恢复打印前 data-hm-widgetid div 的 contenteditable 值
                            if (editor.widgetContenteditableBeforePrint) {
                                var $body = $(editor.document.getBody().$);
                                for (var widgetId in editor.widgetContenteditableBeforePrint) {
                                    var $widget = $body.find('[data-hm-widgetid="' + widgetId + '"]');
                                    if ($widget.length > 0) {
                                        $widget.prop('contenteditable', editor.widgetContenteditableBeforePrint[widgetId]);
                                    }
                                }
                                delete editor.widgetContenteditableBeforePrint;
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
                                // 恢复打印前 data-hm-widgetid div 的 contenteditable 值
                                if (editor.widgetContenteditableBeforePrint) {
                                    var $body = $(editor.document.getBody().$);
                                    for (var widgetId in editor.widgetContenteditableBeforePrint) {
                                        var $widget = $body.find('[data-hm-widgetid="' + widgetId + '"]');
                                        if ($widget.length > 0) {
                                            $widget.prop('contenteditable', editor.widgetContenteditableBeforePrint[widgetId]);
                                        }
                                    }
                                    delete editor.widgetContenteditableBeforePrint;
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
                        // 恢复打印前的修订模式状态
                        var $body = $(editor.document.getBody().$);
                        if (editor.reviseStateBeforePrint === 'hide') {
                            // 如果打印前是隐藏状态，恢复隐藏
                            hideReviseModel($body);
                        } else if (editor.reviseStateBeforePrint === 'show') {
                            // 如果打印前是显示状态，恢复显示
                            showReviseModel($body);
                        }


                            // initEditPermissions(editor, 'print');

                        var editable = editor.editable();
                        editable.fire('togglePlaceHolder', {'showAllPlaceholder': true});
                        // 打印后聚合病历切换时不能定位左侧定标----影响打印/续打后左侧列表定位及展示
                        // initDocumentFireEvt(editorIns, $(editor.document.getBody().$));
                    }
                }
            }, null, null, 100);
        }
    });

})();
