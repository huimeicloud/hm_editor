var ds_list = [];
var parentWin = window.parent;
var dsObj = {};
var globalSearchOptions = []; // 存储全局搜索选项数据
var editFlag = false;
$(document).ready(function () {
    editFlag = false;
    init();

});
// 初始化页面
function init() {
    parentWin['config'] = config;
    parentWin['editDs'] = editDsInit;
    ds_list = parentWin['global_ds_list'] || [];
    dsObj = {};
    var dsLen = ds_list.length;
    for (var i = 0; i < dsLen; i++) {
        dsObj[ds_list[i].name] = ds_list[i];
    }
    changeTypeInit('newtextbox','');
    // 初始化数据元
    dsSelect.init();
    // 加载搜索选项
    loadSearchOptions();
    // 类型切换监听
    $('.row.type input[type=radio]').change(function () {
        var tt = '';
        if(this.value == 'newtextbox'){
            tt = $('select[_type="_texttype"]').val() || '';
        }
        changeTypeInit(this.value,tt);
    })
    $('.row.searchbox select.type').change(function () {
        var t = $(this).val() || '';
        var l = '对应名称';
        if (t.indexOf('名称') > -1) {
            l = '对应编码';
        }
        // if (t.indexOf('手术') == -1) {
        //     $('.row.searchbox.operation').hide();
        // } else {
        //     $('.row.searchbox.operation').show();
        // }
        $('.row .relabel').text(l + '：');
    })
    $('.row.text select').change(function () {
        var t = $(this).val() || '';
        if (t == '下拉') {
            $('.reg').hide();
            $('.check').show();
            $('.row.dropdown').show();
            $('.row.option').show();
            $('.row .check').show();
            $('.row .radio').hide();
        } else {
            $('.reg').show();
            $('.check').hide();
            $('.row.dropdown').hide();
            $('.row.option').hide();
        }
        textTypeChange(t);
        changeTypeInit('newtextbox',t);
    })
    // 添加搜索返回复选框的控制逻辑
    $('input[_type="_searchreturn"]').change(function() {
        if($(this).prop('checked')) {
            // 如果当前复选框被选中，取消其他复选框的选中状态
            $('input[_type="_searchreturn"]').not(this).prop('checked', false);
        }
    });
}
function textTypeChange(t){
    if(t == '下拉'){
        $('input[_type="_doubleclick"]').prop('checked',false);
        $('input[_type="_click"]').prop('checked',true);
    }else if(t == '诊断' || t == '手术'){
        $('input[_type="_click"]').prop('checked',false);
        $('input[_type="_doubleclick"]').prop('checked',true);
    }
}
function editDsInit(ele) {
    // if(!ele && !isLoad){
    //     location.reload();
    //     return;
    // }

    if(ele){
        editFlag = true;
    }
    var d = {};
    $(ele).each(function () {
        $.each(this.attributes, function () {
            if (this.specified) {
                d[this.name] = this.value;
            }
        });
    });

    setConfig(d);
}
// 切换类型重置页面
function changeTypeInit(val,texttype) {
    initDateSel(val);
    initDsType(val);
    $('.row.text,.row.searchbox,.row.dropdown,.row.option').hide();
    $('.row .ds-code').hide();
    $('.row .templatename').hide();


    /**
     * 标题：只读、可删除
     * 文本：只读、自由录入、可删除、必须双击（诊断、手术、下拉）、默认当前时间(时间)
     * 时间：只读、可删除、默认当前时间
     * 单选：只读、可删除
     * 多选：只读、可删除
     * 搜索：只读、可删除、不显示图标、可编辑
     * 文本控件、单元:只读、可删除
     **/
    //
    $('.row .c2,.row .c4,.row .c5,.row .c6,.row .c7,.row .c8,.row .c9').hide();

    // 只读 可自由录入 可删除 必须双击 不显示图标 默认当前时间 可编辑
    if(!editFlag){
        textTypeChange(texttype);
    }

    if(val == 'labelbox'){
        $('.row .templatename').show();
    }else if(val == 'newtextbox'){

        if(texttype == '诊断' || texttype == '手术' || texttype == '下拉'){
            $('.row .c2').show();
            $('.row .c4,.row .c8').show();
        }
        if(texttype == '时间文本'){
            $('.row .c6').show();
            $('.row .c9').show();
            if(!editFlag){
                $('input[_type="_dateflag"').prop('checked',true);
            }
        }
    }else if(val == 'timebox'){
        $('.row .c5,.row .c6,.row .c9').show();
    }else if(val == 'searchbox'){
        $('.row .c5,.row .c7').show();
    }
    // 数据校验隐藏
    $('.valid').hide();
    $('.valid .t1,.valid .t2,.valid .t3').hide();
    // 文本
    if (val == 'newtextbox') {
        $('.valid').show();
        if(texttype == '时间文本'){
            $('.valid .t3').show();
            $('.row .time-width').hide();
        }else if(texttype == '数字文本'){
            $('.valid .t2').show();
        }else{
            $('.valid .t1').show();
        }
    }

    // 日期打印格式
    $('.timePrintFormat').hide();
    // 时间
    if (val == 'timebox') {
        $('.valid').show();
        $('.valid .t3').show();
        $('.timePrintFormat').show();
        $('.row .time-width').show();
    }
    // 搜索
    if (val == 'searchbox') {
        $('.valid').show();
    }

    if (val != 'labelbox'){
        $('.row .ds-code').show();
    }
    if (val == 'cellbox') {
        $('.timePrintFormat').show();
    }
    if (val == 'labelbox' || val == 'cellbox' || val == 'textboxwidget') {
        // 标题
        return;
    }
    if (val == 'newtextbox') {
        $('.row.text,.row .reg').show();
        $(".row.text select option[value='"+texttype?texttype:'纯文本'+"']").prop("selected", true);
        //$('.valid').show();
        if(texttype == '下拉'){
            $('.row.option').show();
            $('.row .check').show();
            $('.row .radio').hide();

            $('.row.dropdown').show();
        }
        return;
    }
    if (val == 'searchbox') {
        $('.row.searchbox').show();
        //$('.valid').show();
        return;
    }
    if (val == 'radiobox' || val == 'checkbox') {
        $('.row.option').show();
        $('.row .check').show();
        if (val == 'radiobox') {
            $('.row .radio').show();
        }else{
            $('.row .radio').hide();
        }
        return;
    }
    if (val == 'timebox') {
        //$('.valid').show();
    }
}
function initDsType(val) {
    if (val == 'labelbox') {
        $('#dsSel').hide();
        $('#dsInput').show();
    } else {
        $('#dsSel').show();
        $('#dsInput').hide();
    }
}
// 切换数据元
function changeDsInit(ds) {

    var textFlag = $(".type input[type='radio']:checked").val() == 'newtextbox';
    var itemsStr = '';
    if (ds['dictList'] && ds['dictList'].length > 0) {
        var items = [];
        for (i = 0; i < ds['dictList'].length; i++) {
            items.push(ds['dictList'][i]['description'] + '(' + ds['dictList'][i]['val'] + ')');
        }
        itemsStr = items.join('#');
    } else if (ds['type'] == 'L') {
        itemsStr = "是#否";
    }


    if (itemsStr) {
        $('input.check').val(itemsStr);
        $('select[_type="_texttype"]').find('option[value="下拉"]').prop("selected", true);

        if (textFlag) {
            $('.reg').hide();
            $('.check').show();
            $('.row.dropdown').show();
            $('.row.option').show();
            $('.row .check').show();
            $('.row .radio').hide();
            textTypeChange('下拉');
        }

    } else {
        $('input.check').val('');
        $('select[_type="_texttype"]').find('option[value="纯文本"]').prop("selected", true);
        if (textFlag) {
            $('.reg').show();
            $('.check').hide();
            $('.row.dropdown').hide();
        }
    }

    $('#text_max').val(ds['length'] || '');
    changeTypeInit($(".type input[type='radio']:checked").val(),$('select[_type="_texttype"]').val());
}
var dsSelect = {
    init: function () {
        function initDsSel(index) {

            $('#dsSel' + index).html('<div id="interact-searchDiv' + index + '" class="panel-body"><select id="interact-search' + index + '" style="width: 100%;"></select></div>');
            var $div = $('#interact-searchDiv' + index);
            var selectable = $div.find('select').editableSelect({
                filter: false,
                onInput: function (self, that) {
                    initDsOptopns(that);
                }
            });

            function initDsOptopns(that){
                var datas = ds_list;
                    if (datas && datas.length > 0) {
                        // if (datas.length > 100) datas = datas.slice(0, 100);
                        var li = "";
                        var fk = $('#interact-search' + index).val().replace(/\s*/g, '');
                        $.each(datas, function (index, obj) {
                            var n = obj['name'];
                            var c = obj['code'];
                            var dc = obj['dictCode'] || '';

                            if (!fk || n.indexOf(fk) > -1 || c.indexOf(fk) > -1) {
                                li += "<li class=es-visible code='" + c + "' name='" + n + "'>" + n + "</li>";
                            }

                        })
                        $div.find('ul').html(li);
                        //that.highlight(0);
                    } else {
                        $div.find('ul').html('<li class="no-result-tit">暂未搜索到对应结果!</li>');
                    }
            }
            initDsOptopns(this);
            if (!index) {
                selectable.on('select.editable-select', function (e, li) {
                    var code = li.attr("code");
                    var name = li.attr("name");
                    $("#interact-search").attr('code', code);
                    $(".row input.ds-code").val(code);
                    $(".row input[_type=_placeholder]").val(name);
                    changeDsInit(dsObj[name]);
                })
            }
        }
        initDsSel('');
        initDsSel('1');
        // initDsSel('2');
        // initDsSel('3');
    },
    set: function (val) {
        $("#interact-search").val(val);
        $("#interact-search").attr('code', this.getCode(val));
    },
    get: function () {
        return { 'data-hm-name': $("#interact-search").val() || '', 'data-hm-code': $("#interact-search").attr('code') || '' }
    },
    getCode: function (name) {
        return (dsObj[name] || {})['code'] || '';
    }
};

function setConfig(data) {
    initDateSel(data['data-hm-node']);
    // 类型不允许修改
    $(".type input[type='radio'][value=" + data['data-hm-node'] + "]").attr('checked', true);
    $(".type input[type='radio']").attr('disabled', true);
    // 数据元不允许修改


    if(data['data-hm-node'] == 'labelbox'){
        $("#dsInput").val(data['data-hm-name'] || '');
    }else{
        dsSelect.set(data['data-hm-name']);
        $("#interact-search").attr('disabled', true);
    }
    //$("#dsInput").attr('disabled', true);

    if(data['data-hm-node'] == 'searchbox'){
        $("#interact-search1").val(data['_searchpair'] || '');
    }
    // $("#interact-search1").val(data['_searchPair']);
    // $("#interact-search2").val(data['_gradePair']);
    // $("#interact-search3").val(data['_diagway_pair']);

    changeTypeInit(data['data-hm-node'],data['_texttype']);
    setInputText();
    setInputCheck();
    setSelect();
    setInputDate();
    setInputNum();
    setRelevance();
    setSearchreturn();
    function setInputText() {
        var els = $('.row>input[type=text]');
        els.each(function () {
            var _t;
            if ((_t = $(this).attr('_type'))) {
                $(this).val(data[_t] || '');
            }
        })
    }
    function setInputDate() {
        var els = $('.row>input[type=datetime-local]');
        els.each(function () {
            var _t;
            if ((_t = $(this).attr('_type'))) {
                $(this).val(data[_t] || '');
            }
        })
    }
    function setInputNum() {
        var els = $('.row>input[type=number]');
        els.each(function () {
            var _t;
            if ((_t = $(this).attr('_type'))) {
                $(this).val(data[_t] || '');
            }
        })
    }
    function setInputCheck() {
        var els = $('.row>div>input[type=checkbox]');
        els.each(function () {
            var _t;
            if ((_t = $(this).attr('_type')) && $(this).val() == data[_t]) {
                $(this).attr('checked', true);
            }
        })
    }
    function setSelect() {
        var els = $('.row>select');
        els.each(function () {
            var _t;
            if ((_t = $(this).attr('_type'))) {
                $(this).find('option[value="' + data[_t] + '"]').prop("selected", true);
            }
        })
    }
    function setRelevance() {
        $(".relevanceItems").empty();
        if (!data['_relevance']) {
            return;
        }
        var relevanceArr = JSON.parse(data['_relevance']);
        var _tr = '';
        for (var i = 0; i < relevanceArr.length; i++) {
            _tr = '<tr index='+i+'>' +
            '<td><input type="text" name="当前数据元值" value="'+relevanceArr[i]['当前数据元值']+'"></td>' +
            '<td><div id='+('relevanceDsSelect'+i)+' class="dsSel" style="width:100%;"></div></td>' +
            '<td><input type="text" name="关联数据元值" value="'+relevanceArr[i]['关联数据元值']+'"></td>' +
            '<td><input type="checkbox" name="关联数据元显示隐藏" value="显示" ' + (relevanceArr[i]["关联数据元显示隐藏"]=="显示" ? 'checked' : '') + '>显示<input type="checkbox" name="关联数据元显示隐藏" value="隐藏" ' + (relevanceArr[i]["关联数据元显示隐藏"]=="隐藏" ? 'checked' : '') + '>隐藏</td>' +
            '<td><button type="button" onclick="deleteTr(this)">删除</button></td>' +
            '</tr>';
            $(".relevanceItems").append(_tr);
            initDsSelect(i,relevanceArr[i]['关联数据元名称']);
        }
    }
    function setSearchreturn(){
        // 先取消所有复选框的选中状态
        $('input[_type="_searchreturn"]').prop('checked', false);
        // 根据data['_searchreturn']的值设置对应的复选框选中
        if(data['_searchreturn']) {
            $('input[_type="_searchreturn"][value="' + data['_searchreturn'] + '"]').prop('checked', true);
        }
    }
}
function config() {
    var d = {};
    // 类型
    var nodeType = $(".type input[type='radio']:checked").val();
    d['data-hm-node'] = nodeType;

    // 数据元

    var _dsObj = { 'data-hm-name': '', 'data-hm-code': '' };
    if (nodeType == 'labelbox') {
        _dsObj['data-hm-name'] = $('#dsInput').val() || '';
        _dsObj['_templatename'] = $('#templatename').val() || '';
        Object.assign(d, _dsObj);
        return d;
    }
    _dsObj = dsSelect.get();
    // 校验数据元
    var dsName = _dsObj['data-hm-name'] || '';

    if(!dsObj[dsName]){
        d['data-hm-code'] = '';
        d['data-hm-name'] = dsName;
        return d;
    }
    console.log(111111111111);
    // 输入
    var inputObj = parseEles($('.row>input[type=text]'));

    // 多选
    var checkboxObj = parseEles($('.row>div>input[type=checkbox]:checked'));

    // 下拉
    var selObj = parseEles($('.row>select'));

    // 输入
    var dateObj = parseEles($('.row>input[type=datetime-local]'));
    // 输入
    var numObj = parseEles($('.row>input[type=number]'));

    // 级联设置
    var relevanceArr = relevanceFun($('.relevanceItems'));
    var relevanceObj = {};
    if (relevanceArr.length>0) {
        relevanceObj = {'_relevance': JSON.stringify(relevanceArr)};
    }

    // 对应数据元
    if (nodeType == 'searchbox') {
        var ds1 = $("#interact-search1").val() || '';
        // var ds2 = $("#interact-search2").val() || '';
        // var ds3 = $("#interact-search3").val() || '';

        if (ds1 && dsObj[ds1]) {
            _dsObj['_searchpair'] = ds1;
        }
        // if (ds2) {
        //     dsObj['_gradePair'] = ds2;
        // }
        // if (ds3) {
        //     dsObj['_diagway_pair'] = ds3;
        // }
        // 获取选中的搜索返回复选框的值
        var searchReturnValue = $('input[_type="_searchreturn"]:checked').val() || '';
        _dsObj['_searchreturn'] = searchReturnValue;
    }
    // 手术级别、诊疗方式

    function parseEles(els) {
        var obj = {};
        els.each(function () {
            if ($(this).attr('_type') && isVisible(this)) {
                obj[$(this).attr('_type')] = $(this).val();
            }
            function isVisible(e){
                // $(this).is(':visible')
                var flag = true;
                if(!e){
                    return flag;
                }
                if($(e).css('display') == 'none'){
                    return false;
                }
                if($(e).hasClass('row')){
                    return flag;
                }
                return isVisible($(e).parent()[0]);
            }
        })
        return obj;
    }

    function relevanceFun(ele){
        var trs = ele.find('tr');
        var o = {};
        var arr = [];
        for (var i = 0; i < trs.length; i++) {
            var _tr = $(trs[i]);
            o = {
                '当前数据元值': _tr.find('[name="当前数据元值"]').val(),
                '关联数据元名称': _tr.find('[name="关联数据元名称"]').val(),
                '关联数据元值': _tr.find('[name="关联数据元值"]').val(),
                '关联数据元显示隐藏': _tr.find('[name="关联数据元显示隐藏"]:checked').val()||''
            }
            arr.push(o);
        }
        return arr;
    }

    Object.assign(d, inputObj, checkboxObj, selObj,dateObj,numObj, _dsObj, relevanceObj);
    eatUnvalid(d);
    return d;

    function eatUnvalid(d) {
        var nodeType = d['data-hm-node'];

        var texttype = d['_texttype'];
        if (nodeType != 'searchbox') {
            remove(['_searchoption', '_searchpair', '_gradepair', 'data-hm-search-url', 'data-hm-search-params', '_searchreturn']);
        }
        if (nodeType != 'newtextbox' || texttype != '下拉') {
            remove(['_selecttype', '_jointsymbol']);
        }

        if (nodeType != 'checkbox' && nodeType != 'radiobox' && (nodeType == 'newtextbox' && texttype != '下拉')) {
            remove(['data-hm-items']);
        }
        if (nodeType != 'radiobox') {
            remove(['_radiostyle']);
        }
        if (nodeType != 'newtextbox') {
            remove(['_placeholder']);
        }

        if (texttype != '数字文本') {
            remove(['_precision']);
        }
        if (nodeType != 'timebox') {
            remove(['_timeoption']);
            if(texttype != '时间文本'){
                remove([ '_timewidth']);
            }
            if (nodeType != 'cellbox') {
                remove(['_time_print_format']);
            }
        }
        if (texttype != '时间文本') {
            remove(['_timetype']);
            if (nodeType != 'timebox') {
                remove([ '_timewidth']);
            }
        }
        function remove(keys) {
            for (var i = 0; i < keys.length; i++) {
                delete d[keys[i]];
            }
        }
    }
}

function initDateSel(type) {
    var timebox = '<option value="date">yyyy-MM-dd</option>' +
        '<option value="time">hh:mm</option>' +
        '<option value="fullTime">hh:mm:ss</option>' +
        '<option value="month_day">MM-dd</option>' +
        '<option value="year_month">yyyy-MM</option>' +
        '<option value="datetime">yyyy-MM-dd hh:mm</option>' +
        '<option value="fullDateTime">yyyy-MM-dd hh:mm:ss</option>' +
        '<option value="date_han">yyyy年MM月dd日</option>' +
        '<option value="datetime_han">yyyy年MM月dd日HH时mm分</option>';

    var timetext = '<option value="yyyy-MM-dd">yyyy-MM-dd</option>' +
        '<option value="yyyy-MM-dd hh:mm">yyyy-MM-dd hh:mm</option>' +
        '<option value="yyyy-MM">yyyy-MM</option>' +
        '<option value="hh:mm">hh:mm</option>'+
        '<option value="yyyy年MM月dd日">yyyy年MM月dd日</option>'+
        '<option value="yyyy-MM-dd hh:mm:ss">yyyy-MM-dd hh:mm:ss</option>'+
        '<option value="yyyy年MM月dd日hh时mm分">yyyy年MM月dd日hh时mm分</option>';

        $('.timePrintFormat').hide();
    if (type == 'timebox') {
        $('#dateFormat').html(timebox);
        $('#dateFormat').attr('_type', '_timeoption');
        $('#timePrintFormat').html('<option value=""></option>'+timebox);
        $('.timePrintFormat').show();
    } else {
        $('#dateFormat').html(timetext);
        $('#dateFormat').attr('_type', '_timetype');
    }
    if (type == 'cellbox') {
        timebox = '<option value=""></option>' +
        '<option value="noYear">MM-dd hh:mm</option>';
        $('#timePrintFormat').html(timebox);
        $('.timePrintFormat').show();
    }
}
function revertItems(){
    var items = $('[_type=data-hm-items]').val() || '';
    if(items.indexOf('(') == -1 || items.indexOf(')') == -1){
        return;
    }
    var itemArr = items.split(/#/g);

    var _itemarr = [];
    for(var i=0;i<itemArr.length;i++){

        var cs = itemArr[i];
        if(!cs){
            continue;
        }
        if(cs.indexOf("(") > 0 && cs[cs.length - 1] == ")"){
            _itemarr.push(revert(cs));

        }else{
            _itemarr.push(cs);
        }

    }
    $('[_type=data-hm-items]').val(_itemarr.join('#'));
    function revert(str){
        var sl = str.length;
        var codeLeft = -1;
        var codeRight =  -1;

        var index = 0;
        for(var i=sl - 1;i > -1;i--){
            if(str[i] == ')'){
                index++;
                if(codeRight == -1){
                    codeRight = i;
                }
                continue;
            }

            if(str[i] == '('){
                index--;
                if(index == 0){
                    codeLeft = i;
                    break;
                }
            }
        }

        if(codeLeft != -1 && codeRight != -1 && codeLeft < codeRight){
            return str.substring(codeLeft+1,codeRight)+'('+str.substring(0,codeLeft)+')';
        }
        return str;
    }
}

function addTr(){
    var trs = $(".relevanceItems").find('tr');
    var index = 0;
    if (trs.length==0) {
        index = 0;
    }else{
        index = parseInt(trs[trs.length-1].getAttribute('index'))+1;
    }
    $(".relevanceItems").append(
        '<tr index='+index+'>' +
        '<td><input type="text" name="当前数据元值" value=""></td>' +
        '<td><div id='+('relevanceDsSelect'+index)+' class="dsSel" style="width:100%;"></div></td>' +
        '<td><input type="text" name="关联数据元值" value=""></td>' +
        '<td><input type="checkbox" name="关联数据元显示隐藏" value="显示" onClick="checkboxClick(this)">显示 <input type="checkbox" name="关联数据元显示隐藏" value="隐藏" >隐藏</td>' +
        '<td><button type="button" onclick="deleteTr(this)">删除</button></td>' +
        '</tr>'
    );
    initDsSelect(index);
}
function initDsSelect(index,val) {

    $('#relevanceDsSelect' + index).html('<div id="selectDiv' + index + '" class="panel-body"><select name="关联数据元名称" id="selectDom' + index + '" style="width: 100%;"></select></div>');
    var $div = $('#selectDiv' + index);
    var selectable = $div.find('select').editableSelect({
        filter: false,
        onInput: function (self, that) {
            initDsOptopns(that);
        }
    });

    if (val) {
        $('#selectDom' + index).val(val);
    }
    function initDsOptopns(that){
        var datas = ds_list;
            if (datas && datas.length > 0) {
                var li = "";
                var fk = $('#selectDom' + index).val().replace(/\s*/g, '');
                $.each(datas, function (index, obj) {
                    var n = obj['name'];
                    var c = obj['code'];
                    var dc = obj['dictCode'] || '';

                    if (!fk || n.indexOf(fk) > -1 || c.indexOf(fk) > -1) {
                        li += "<li class=es-visible code='" + c + "' name='" + n + "'>" + n + "</li>";
                    }

                })
                $div.find('ul').html(li);
            } else {
                $div.find('ul').html('<li class="no-result-tit">暂未搜索到对应结果!</li>');
            }
    }
    initDsOptopns(this);
    $(".relevanceItems input[type='checkbox']").on("change", function() {
        $(this).siblings().removeAttr('checked');
    })
}
function deleteTr(btn){
    $(btn).closest('tr').remove();
}

function loadSearchOptions() {
    var searchOptions = window.parent['global_searchOption_list'] || [];
    var $select = $('#searchTypeSelect');

    // 存储全局变量以供后续使用
    globalSearchOptions = searchOptions;

    // 清空选择框，但保留"请选择"选项
    $select.find('option:not(:first)').remove();

    // 添加动态选项
    if (searchOptions && searchOptions.length > 0) {
        // 添加新选项
        for (var i = 0; i < searchOptions.length; i++) {
            var option = searchOptions[i];
            var optionText = option.name || option.code;
            var optionValue = option.code;

            if (optionText && optionValue) {
                $select.append('<option value="' + optionValue + '">' + optionText + '</option>');
            }
        }
    }

    // 添加搜索类型变更事件，自动设置搜索URL
    $select.off('change.searchurl').on('change.searchurl', function() {
        var selectedValue = $(this).val();
        var searchUrl = '';

        // 查找对应的URL
        if (selectedValue && globalSearchOptions && globalSearchOptions.length > 0) {
            for (var i = 0; i < globalSearchOptions.length; i++) {
                if (globalSearchOptions[i].code === selectedValue) {
                    searchUrl = globalSearchOptions[i].url || '';
                    break;
                }
            }
        }

        // 设置URL到输入框
        $('input[_type="data-hm-search-url"]').val(searchUrl);
        $('input[_type="data-hm-search-params"]').val('');
        $('input[_type="_searchreturn"]').prop('checked', false);

    });
}