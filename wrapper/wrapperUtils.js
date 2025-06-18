
var wrapperUtils = {};

/**
 * 判断是否是谷歌
 */
 wrapperUtils.isChrome = function(){
    var browser = {
        versions: function() {
            var u = navigator.userAgent, app = navigator.appVersion;
            return {
                trident: u.indexOf('Trident') > -1, //IE内核
                presto: u.indexOf('Presto') > -1, //opera内核
                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
                mobile: !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/), //是否为移动终端
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
                iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                iPad: u.indexOf('iPad') > -1, //是否iPad
                webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
            };
        }(),
        language: (navigator.browserLanguage || navigator.language).toLowerCase()
    }

    if(browser.versions.webKit){
        return true;
    }
    return false;
}

wrapperUtils.formatDateToStr = function(fmt,date) {
 var o = {
    "M+" : date.getMonth()+1,     //月份
    "d+" : date.getDate(),     //日
    "h+" : date.getHours(),     //小时
    "m+" : date.getMinutes(),     //分
    "s+" : date.getSeconds(),     //秒
    "q+" : Math.floor((date.getMonth()+3)/3), //季度
    "S" : date.getMilliseconds()    //毫秒
 };
 if(/(y+)/.test(fmt)) {
    fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
 }
 for(var k in o) {
    if(new RegExp("("+ k +")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    }
 }
 return fmt;
};

/**
 * 生成GUID
 */
wrapperUtils.getGUID = function(){
    function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
}

/**
 * 数字控件校验
 */
wrapperUtils.numCheck = function(val,precision,type) {
    var warningStr = '';
    var reg = /^[0-9]+\.?[0-9]*$/;
    if (reg.test(val)) {
        if (precision == 'all') {
            return warningStr;
        }
        var decimalNum = val.split('.')[1];
        if (precision == '0' && decimalNum != undefined) {
            warningStr = '请输入整数';
        }
        if (!decimalNum && precision != '0') {
            warningStr = '请输入数字，格式如 '+precision;
        }
        if (decimalNum) {
            if ((precision == '0.0' && decimalNum.length>1) ||
                (precision == '0.00' && decimalNum.length>2) ||
                (precision == '0.000' && decimalNum.length>3) ||
                (precision == '0.0000' && decimalNum.length>4)) {
                warningStr = '请输入数字，格式如 '+precision;
            }
        }else{
            if (precision != '0'&&type=='input') {
                warningStr = '';
            }
        }
    }else{
        if (precision == 'all') {
            warningStr = '请输入数字';
        } else if (precision == '0') {
            warningStr = '请输入整数';
        } else {
            warningStr = '请输入数字，格式如 '+precision;
        }
    }
    return warningStr;
} 


// 格式话时间文本数据元数据
wrapperUtils.formatTimeTextVal = function (time,format) {
    if (!time || !format) {
        return time;
    }
    try {
        var date;
        if (time instanceof Date) {
            date = time;
        } else {
            if (time instanceof String && time.indexOf('年') > -1) {
                time = time.replace('年', '-').replace('月', '-').replace('日', ' ').replace('时', ':').replace('分', '');
            }
            date = new Date(time);
            if (!date || 'Invalid Date' == date || 'undefined' == date || 'null' == date) {
                return time;
            }
        }
        return wrapperUtils.formatDateToStr(format, date);
    } catch (e) {
        console.error(e);
        return time;
    }
}
