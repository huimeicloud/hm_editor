(function($) {
    if(HmGrowl !== undefined) {
        return HmGrowl;
    }

    var HmGrowl = {
        version: 'v1.0.0',
        wrapper: $('body'),
        sortId: 0
    };

    HmGrowl._init = function() {
        $('<div id="hmGrowl"></div>').appendTo(HmGrowl.wrapper);
    }

    /**
     * 弹出提示框
     * @param {*} message 信息
     * @param {*} type 提示类型
     */
    HmGrowl._showPopup = function(message, type, autoClose, timeout) {
        function removeItem() {
            growlItem.remove();
        }
        var title = '提示';

        if(type === 'info') {
            title = '提示';
        }
        else if(type === 'success') {
            title = '成功';
        }
        else if(type === 'error') {
            title = '错误';
        }else if(type === 'warn'){
            title = '警告';
        }
        timeout = Number(timeout);
        if (!timeout) {
            timeout = type === 'error' ? 5000 : 1000;
        }
        if(type === 'warn'){
            type = 'error';
        }
        var id = HmGrowl.sortId++;
        var xml = [
            '<div id="growl' + id + '" class="growl ' + type + '">',
                '<i class="iconfont icon-' + type + '"></i>',
                '<div class="growl-content">',
                    '<div class="title">提示</div>',
                    '<div class="desc">初始模版当前账户需申请开通权限</div>',
                ' </div>',
                ' <span class="iconfont icon-close"></span>',
            '</div>'
        ].join('');

        var growlItem = $(xml);



        growlItem.find('.title').html(title);
        growlItem.find('.desc').html(message);
        growlItem.find('.icon-close').on('click', function() {
            removeItem();
        });

        $('#hmGrowl').append(growlItem);

        if(!autoClose){
            return growlItem;
        }else{
        setTimeout(function() {
            removeItem();
        }, timeout);
    }
    }

    /**
     * 设置提示框容器，默认为当前页body
     * @param {*} wrapper 提示框容器
     */
    HmGrowl.setHmGrowlWrapper = function(wrapper) {
        HmGrowl.wrapper.find('#hmGrowl').remove();
        $('<div id="hmGrowl"></div>').appendTo(wrapper);
        HmGrowl.wrapper = wrapper;
    }

    /**
     * 提示
     * @param {string} message 提示信息
     */
    HmGrowl.info = function(message, timeout) {
        HmGrowl._showPopup(message,'info',!!timeout, timeout);
    };

    /**
     * 成功提示
     * @param {string} message 成功信息
     */
    HmGrowl.success = function(message, timeout) {
        HmGrowl._showPopup(message, 'success',!!timeout, timeout);
    };

    /**
     * 错误提示
     * @param {string} message 错误信息
     */
    HmGrowl.error = function(message, timeout) {
        HmGrowl._showPopup(message, 'error',!!timeout, timeout);
    };

    HmGrowl.show = function(message, timeout) {
        return HmGrowl._showPopup(message, 'info',!!timeout, timeout);
    };

    HmGrowl.warn = function(message, timeout) {
        HmGrowl._showPopup(message, 'warn',!!timeout, timeout);
    };

    $(function() {
        HmGrowl._init();
    });

    window['HmGrowl'] = {
        setHmGrowlWrapper: HmGrowl.setHmGrowlWrapper,
        info: HmGrowl.info,
        success: HmGrowl.success,
        error: HmGrowl.error,
        show: HmGrowl.show,
        warn: HmGrowl.warn
    };

    return HmGrowl;
})(jQuery);
