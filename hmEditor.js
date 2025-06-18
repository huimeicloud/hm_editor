var zeroWidthChar = /[\u200B-\u200D\uFEFF]/g;
var zeroWidthCharStarted = /^[\u200B-\u200D\uFEFF]+/g;
var zeroWidthCharEnded = /[\u200B-\u200D\uFEFF]+$/g;


function getRootPath() {
    var curWwwPath = window.document.location.href;
    var pathName = window.document.location.pathname;
    var pos = curWwwPath.indexOf(pathName);
    var localhostPaht = curWwwPath.substring(0, pos);
    var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
    return (localhostPaht + projectName);
}



Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
function addLayer(type){
    var css = 'position: absolute;width:100%;height:100%;top: 0px;left: 0px;z-index: 10000;background: rgba(211,211,211,0.5)';
    var id = 'layer_'+(Math.floor(Math.random()*(9999-1000))+1000);
    var btnCss = "position:absolute;right:1em;top:1em;width:30px;height:30px;line-height:30px;text-align:center;cursor:pointer;color:lightgray;"
    var tip = '';
    if (type) {
        tip = '<div style="position: absolute;top: 0;bottom: 0;left: 0;right: 0;margin: auto;width: 200px;height: 50px;background: white;border-radius: 5px;text-align:center;line-height: 50px;font-size:16px;">正在' + type + '，请稍后...</div>';
    }
    var html = '<div id="'+id+'" style="'+css+'">' + tip + '<div onclick="$(\'#'+id+'\').remove();" style="'+btnCss+'">X</div></div>';
    $('body').append(html);
    return $('#'+id);
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function filterHtml(orginHtml){
    if(!orginHtml) {
        return '';
    }
    $orginHtml = $('<div>' + orginHtml + '</div>');
    $orginHtml.find("del").remove();
    var datasourceplaceholder= $orginHtml.find("[_placeholdertext]");
    if(datasourceplaceholder.length > 0){
        $(datasourceplaceholder.$).remove();
    }
    $orginHtml.find('[data-hm-node]').each(function(){
        $(this).contents().unwrap();
    });
    $orginHtml.find('[_placeholdertext]').each(function(){
        $(this).remove();
    });
    $orginHtml.find('table').each(function(){
        $(this).replaceWith($(this).text());
    });
    $orginHtml.find('div').each(function(){
        $(this).contents().unwrap();
    });
    $orginHtml.find('font').each(function(){
        $(this).replaceWith($(this).text());
    });
    $orginHtml.find('span').each(function(){
        $(this).replaceWith($(this).text());
    });
    $orginHtml.find('ins').each(function(){
        $(this).replaceWith($(this).text());
    });
    $orginHtml.find('*').removeAttr('lang');
    $orginHtml.find('*').removeAttr('class');
    $orginHtml.find('*').removeAttr('style');

    return $orginHtml.html();
}

var notifyCount = 0;
var lastNotifyTime = new Date(0).getTime();



function base64Data(param){
    if(!window['_base64']){
        window['_base64'] = function(param){
            if(typeof param == 'string'){
                return btoa(unescape(encodeURIComponent(param))) + '-DECODEBYBASE64-';
            }else{
                return btoa(unescape(encodeURIComponent(JSON.stringify(param)))) + '-DECODEBYBASE64-';
            }
        }

    }
    return window['_base64'](param);
}

/**
 * 检查当前获焦区域是否为只读模式
 */
function checkCurDomReadOnly(editor) {
    var isReadOnly = false;
    if(editor.readOnly){ // 整个文档为只读模式
        isReadOnly = true;
        return isReadOnly;
    }
    // 处理病程记录的无权限编辑模式病历
    var selection = editor.getSelection();
    var ranges = selection.getRanges();
    var range0 = ranges[0];
    var parentNodes = range0 ? range0.startContainer.getParents() : [];
    for(var len = parentNodes.length , i = len-1; i >= 0 ; i--){
        var _curNode = parentNodes[i];
        if(_curNode.type == 1 && _curNode.hasAttribute('data-hm-createuserid') && _curNode.getAttribute('contenteditable') == 'false'){
            isReadOnly = true;
            break;
        }
    }
    return isReadOnly;
}


// function hideReviseShowState(editor) {
//     if(editor.commands["revise"] && !editor.readOnly){
//         editor.execCommand("revise", {
//             reviseState: '隐藏修订'
//         });
//     }
// }

// 去除零宽占位
function removeZeroWidth(val){
    if(val === undefined && val === null){
        return val;
    }
    if(typeof(val) != 'string'){
        return val;
    }
    return val.replace(zeroWidthChar,'');
}

// 获取函数执行时间. 可以把这段代码挪到公共的地方.
var getFunExecTime = (function () {

    // 装饰器，在当前函数执行前先执行另一个函数
    function decoratorBefore(fn, beforeFn) {
        return function () {
            var ret = beforeFn.apply(this, arguments);

            // 在前一个函数中判断，不需要执行当前函数
            if (ret !== false) {
                fn.apply(this, arguments);
            }
        };
    }

    // 装饰器，在当前函数执行后执行另一个函数
    function decoratorAfter(fn, afterFn) {
        return function () {
            fn.apply(this, arguments);
            afterFn.apply(this, arguments);
        };
    }

    // 给fun添加装饰器，fun执行前后计时
    return function (funName, logLevel, fun) {
        return decoratorAfter(decoratorBefore(fun, function () {
            // 执行前
            timeLogger(funName, logLevel);
        }), function () {
            // 执行后
            timeEndLogger(funName, logLevel);
        });
    };
})();

// region 记录时间, 类似于 console.log(label), 可以自定义日志等级, 但是只能精确到毫秒.
var timeLoggerStarts = {};
var timeLoggerStages = {};
var logLevels = {0: 'debug', 1: 'log', 2: 'warn', 3: 'error'};

/**
 * 记录开始时间, 并保存到 {@link timeLoggerStarts} 中
 * @param {string} label 开始时间标签
 * @param {int} logLevel 见 {@link logLevels}
 */
function timeLogger(label, logLevel) {
    if (isNaN(Number(logLevel))) {
        logLevel = 1;
    }
    if (logLevel === 1) {
        // 当输出 log 级别时, 可以输出更精确的值.
        console.time(label);
        return;
    }
    timeLoggerStarts[label] = {
        logLevel: logLevel,
        time: new Date().getTime()
    };
}

/**
 * 记录结束时间
 * @param {string} label 结束时间标签
 * @param {boolean} toStage if true, 记录到 {@link timeLoggerStages} 中; 否则输出到控制台.
 */
function timeEndLogger(label, toStage) {
    if (!timeLoggerStarts[label]) {
        console.timeEnd(label);
        return;
    }
    var logLevel = timeLoggerStarts[label].logLevel;
    if (toStage) {
        if (!timeLoggerStages[label]) {
            timeLoggerStages[label] = 0;
        }
        timeLoggerStages[label] += new Date().getTime() - timeLoggerStarts[label].time;
    } else {
        console[logLevels[logLevel]](label + '：' + (new Date().getTime() - timeLoggerStarts[label].time) + 'ms');
    }
    delete timeLoggerStarts[label];
}

/**
 * 获取 {@link timeLoggerStages} 中的累计时间, 并清除累计的时间
 * @param {string} label 标签
 * @param {int} logLevel 见 {@link logLevels}
 */
function timeLoggerPop(label, logLevel) {
    if (timeLoggerStages[label]) {
        console[logLevels[logLevel]](label + '：' + timeLoggerStages[label] + 'ms');
        delete timeLoggerStages[label];
        // } else {
        //     console.warn('时间记录不存在: ' + label);
    }
}
