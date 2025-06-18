CKEDITOR.plugins.add('datasource', {

    requires: 'dialog',
    icons: 'datasource', // %REMOVE_LINE_CORE%

    getRangeBoundaryNewtextbox: function () {
        var selection = editorIns.getSelection();
        var ranges = selection.getRanges();
        var range0 = ranges[0];
        if (!range0 || !range0.getBoundaryNodes()) return null;
        var parentNodes = editorIns.elementPath().elements;
        for (var i = 0; i < parentNodes.length; i++) {
            var node = parentNodes[i];
            if (node.getName() === 'span' && node.hasClass('new-textbox-content')) {
                return $(node.getParent().$);
            }
        }
        return null;
    },

    setTemplateDatasource: function(params){
        delete window['global_ds_list'];
        // 接收数据元
        window['global_ds_list'] = params.datasource || [];
        window['global_searchOption_list'] = params.dynamicDict || [];

        // 直接触发数据元对话框更新
        try {
            console.log('设置数据元完成，数据元数量:', (params.datasource || []).length);

            // 通过编辑器实例访问对话框应用
            if (window.editorIns && window.editorIns._datasourceDialogApp) {
                console.log('触发数据元对话框更新');
                window.editorIns._datasourceDialogApp.searchDataSourceListByParams();
            }
        } catch (e) {
            console.error('触发数据元对话框更新失败:', e);
        }
    },

    init: function (editor) {
        var transmit = null

        editor.on('instanceReady', function () {
            var $div = $('#interactDiv');
            var $document = $(editor.document.$);

        });

        function interactOnTimebox($node) {
            var timeOption = $node.attr('_timeOption');

            var timeFlag = false;
            var inputWidth = '90px';
            if(timeOption == 'datetime_han' || timeOption == 'fullDateTime' || timeOption == 'datetime'){
                inputWidth = '140px';
            }else if(timeOption == 'time' || timeOption == 'fullTime'){
                inputWidth = '74px';
                timeFlag = true;
            }
            var txt = $node.text().replace(/\u200B/g, '');
            var currentDate = new Date();

            var $div = $('#interactDiv');
            if(timeFlag){
                $div.css('min-width','230px');
            }
            var $form = $('<form><input data-interactbox style="width: '+inputWidth+';margin: 2px;height:25px" type=text/></form>');
            var $interactTimebox = $form.find('input');
            $div.append('<a type="button" id="currentTime" style="position:absolute;right:70px;margin:5px" class="btn btn-primary">当前时间</a>');
            $div.append('<a type="button" id="timeConfirm" style="position:absolute;right:35px;margin:5px" class="btn btn-primary">确认</a>');
            $div.append('<a type="button" id="timeClear" style="position:absolute;right:0;margin:5px" class="btn btn-primary">清空</a>');
            $div.append($form);

            var inline = true;

            var onSelectDate = function(dateText, inst){
                $div.find('#timeConfirm')[0].click();
            }
            var onSelectTime = function(dateText, inst){
                $div.find('#timeConfirm')[0].click();
            }

            switch (timeOption) {
                case 'month_day':
                    $interactTimebox.attr('placeholder', '__-__');
                    //$interactTimebox.mask('00-00');//影响所有的input框
                    currentDate = txt ? new Date(currentDate.getFullYear() + '-' + txt) : currentDate;

                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        timepicker: false,
                        format: 'm-d',
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        },
                        onSelectDate:onSelectDate,
                        onSelectTime:onSelectTime
                    });
                    break;
                case 'date':
                    $interactTimebox.attr('placeholder', '____-__-__');
                    //$interactTimebox.mask('0000-00-00');
                    currentDate = txt ? new Date(txt) : currentDate;

                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        timepicker: false,
                        format: 'Y-m-d',
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        },
                        onSelectDate:onSelectDate,
                        onSelectTime:onSelectTime
                    });
                    break;
                case 'time':
                    $interactTimebox.attr('placeholder', '__:__');
                    //$interactTimebox.mask('00:00');
                    currentDate = txt ? new Date(currentDate.toLocaleDateString() + " " + txt) : currentDate;

                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        datepicker: false,
                        format: 'H:i',
                        step: 5,
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        },
                        onSelectDate:onSelectDate,
                        onSelectTime:onSelectTime
                    });
                    break;
                case 'date_han':
                    $interactTimebox.attr('placeholder', ' ____年__月__日');
                    //$interactTimebox.mask('0000年00月00日00时00分');
                    if (txt) {
                        currentDate = txt.replace('年', '-').replace('月', '-').replace('日', '');
                    }

                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        timepicker: false,
                        format: 'Y-m-d',
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        },
                        onSelectDate:onSelectDate,
                        onSelectTime:onSelectTime
                    });
                    break;
                case 'datetime_han':
                    $interactTimebox.attr('placeholder', ' ____年__月__日__时__分');
                    //$interactTimebox.mask('0000年00月00日00时00分');
                    if (txt) {
                        currentDate = txt.replace('年', '-').replace('月', '-').replace('日', ' ').replace('时', ':').replace('分', '');
                    }

                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        format: 'Y-m-d H:i',
                        step: 5,
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        }
                    });
                    break;
                case 'fullDateTime':
                    $interactTimebox.attr('placeholder', ' ____-__-__ __:__:__');
                    currentDate = txt ? new Date(txt) : currentDate;
                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        format: 'Y-m-d H:i:s',
                        step: 5,
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        }
                    });
                    break;
                case 'fullTime':
                    $interactTimebox.attr('placeholder', '__:__:__');
                    currentDate = txt ? new Date(txt) : currentDate;
                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        format: 'H:i:s',
                        step: 5,
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        },
                        onSelectDate:onSelectDate,
                        onSelectTime:onSelectTime
                    });
                    break;
                case 'year_month':
                        $interactTimebox.attr('placeholder', '__-__');
                        currentDate = txt ? new Date(txt) : currentDate;
                        $interactTimebox.datetimepicker({
                            value: currentDate,
                            timepicker: false,
                            format: 'Y-m',
                            inline: inline,
                            onGenerate: function (ct) {
                                $interactTimebox.css('display', 'block');
                            },
                            onSelectDate:onSelectDate,
                            onSelectTime:onSelectTime
                        });
                        break;
                default:
                    $interactTimebox.attr('placeholder', ' ____-__-__ __:__');
                    //$interactTimebox.mask('0000-00-00 00:00');

                    currentDate = txt ? new Date(txt) : currentDate;
                    $interactTimebox.datetimepicker({
                        value: currentDate,
                        format: 'Y-m-d H:i',
                        step: 5,
                        inline: inline,
                        onGenerate: function (ct) {
                            $interactTimebox.css('display', 'block');
                        }
                    });
                    break;
            }
            $.datetimepicker.setLocale('ch');

            $div.find('#currentTime').on('click', function () {
                var curTimeStr = '';
                switch (timeOption) {
                    case 'month_day':
                        curTimeStr = wrapperUtils.formatDateToStr('MM-dd', new Date());
                        break;
                    case 'date':
                        curTimeStr = wrapperUtils.formatDateToStr('yyyy-MM-dd', new Date());
                        break;
                    case 'time':
                        curTimeStr = wrapperUtils.formatDateToStr('hh:mm', new Date());
                        break;
                    case 'date_han':
                        curTimeStr = wrapperUtils.formatDateToStr('yyyy-MM-dd', new Date());
                        break;
                    case 'datetime_han':
                        curTimeStr = wrapperUtils.formatDateToStr('yyyy-MM-dd hh:mm', new Date());
                        break;
                    case 'fullDateTime':
                        curTimeStr = wrapperUtils.formatDateToStr('yyyy-MM-dd hh:mm:ss', new Date());
                        break;
                    case 'fullTime':
                        curTimeStr = wrapperUtils.formatDateToStr('hh:mm:ss', new Date());
                        break;
                    case 'year_month':
                        curTimeStr = wrapperUtils.formatDateToStr('yyyy-MM', new Date());
                        break;
                    default:
                        curTimeStr = wrapperUtils.formatDateToStr('yyyy-MM-dd hh:mm', new Date());
                        break;
                }
                if (curTimeStr) {
                    $interactTimebox.val(curTimeStr);
                }
                onSelectDate();
            })

            $div.find('#timeConfirm').on('click', function () {
                var val = $interactTimebox.val();
                if (val == '') {
                    $node.text('\u200B');
                } else {
                    if (timeOption == 'date_han' && val.indexOf("-")>=0) {
                        val = val.replace('-', '年').replace('-', '月') + '日';
                    } else if (timeOption == 'datetime_han' && val.indexOf("-")>=0) {
                        val = val.replace('-', '年').replace('-', '月').replace(' ', '日').replace(':', '时') + '分';
                    }
                    $node.text(val);
                }
                $div.hide();
                var trueDate = $interactTimebox.datetimepicker('getValue');
                if (trueDate) {
                    $node.attr('evt-data-time', trueDate.getTime());
                    if (!$node.attr('evt-data-id')) {
                        $node.attr('evt-data-id', trueDate.getTime() + '_' + Math.floor(Math.random() * 10000));
                    }
                }

                checkContent($node[0],val);
                //resetDSNameByDate($node,val);
                $node.removeClass('bgred');
            })
            $div.find('#timeClear').on('click', function () {

                $node.text('\u200B');
                $div.hide();

                checkContent($node[0],'');
                //resetDSNameByDate($node,val);
            })
        }

        function interactOnDropbox($node) {
            var txt = $node.text().replace(/\u200B/g, '');
            var items = $node.attr('data-hm-items').split('#');


            var $div = $('#interactDiv');

            var $interactDropbox = $('<div class="dropdown open"><ul style="max-height:200px;overflow-y:auto" class="dropdown-menu" role="menu"></ul></div>');

            $interactDropbox.find('ul').append('<li style="position:relative" role="presentation">\
                <a role="menuitem" tabindex="-1" href="#">' + '\u200B' + '</a>\
                <span style="position:absolute;top:0;right:10px;color:darkgrey">(未填写)</span>\
                </li>');

            $interactDropbox.find('ul').append('<li style="position:relative" role="presentation">\
                <a role="menuitem" tabindex="-1" href="#">' + '\u3000' + '</a>\
                <span style="position:absolute;top:0;right:10px;color:darkgrey">(无)</span>\
                </li>');

            var name = $node.attr('data-hm-name');
            var selectType = $node.attr('_selectType');
            var jointsymbol = $node.attr('_jointSymbol');

            if (selectType == '多选') {
                for (var i = 0; i < items.length; i++) {
                    $interactDropbox.find('ul').append('<li role="presentation"><a role="menuitem" tabindex="-1" href="#"><input style="vertical-align: middle;margin:0 5px 0 0;" type="checkbox" name=' + name + ' value=' + items[i] + ' />' + items[i] + '</a></li>');
                }
            } else {
                for (var i = 0; i < items.length; i++) {
                    $interactDropbox.find('ul').append('<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + items[i] + '</a></li>');
                }
            }
            $div.append($interactDropbox);

            if (selectType == '多选') {
                //下拉多选增加确定按钮
                $div.append('<div style="text-align:center;"><button id="multiSelectConfirm" style="height:28px;margin:6px 5px;padding:0 5px;" class="btn btn-primary">确定</button></div>');
                //设置选中项
                var nodeText = $(editor.document.$.body).find('span[data-hm-id=' + $node.attr('data-hm-id') + ']').text().split(jointsymbol);
                // 判断是否是带编码选项
                var items0 = items[0].match(/(.+)\((.*?)\)\s*$/);
                if (items0 && items0.length == 3) {
                    // var itemArr = [];
                    for (var i = 0; i < items.length; i++) {
                        itemsArr = items[i].match(/(.+)\((.*?)\)\s*$/);
                        if (nodeText.indexOf(itemsArr[1]) >= 0) {
                            $('input[name="' + name + '"][value="' + itemsArr[0] + '"]').prop('checked', true);
                        }
                    }
                } else {
                    $('input[name="' + name + '"]').each(function () {
                        if (nodeText.indexOf($(this).val()) >= 0) {
                            $(this).prop('checked', true);
                        }
                    });
                }
            }

            // 取消所有选项与单选的确定
            $interactDropbox.on('click', function (evt) {
                var $target = $(evt.target);
                if (selectType === '多选') {
                    if ($target.is('a')) {
                        var str = $target.text().replace(/\u200B/g, '').replace(/\u3000/g, '');
                        if (!str.length) { //选中 ‘无'、'未填写'
                            combine$Nodes(editor, $node);
                            $node.css({ 'display': '' });
                            editor.fire('saveSnapshot', { name: 'interactDropbox' });
                            $node.text($target.text());
                            _handleCascade($node.context, $target[0].text);
                            $div.hide();
                            return;
                        }
                        if ($target.children('input').is(":checked")) {
                            $target.children('input').prop('checked', false);
                        } else {
                            $target.children('input').prop('checked', true);
                        }
                    }
                } else {
                    if ($target.is('a')) {
                        combine$Nodes(editor, $node);
                        var matches = $target.text().match(/(.+)\((.*?)\)\s*$/);
                        if (matches && matches.length === 3) {
                            var code = matches[1];
                            // var val = matches[2];
                            $node.text(code);
                        } else {
                            var strv = $target.text();
                            if (!strv || strv.length < 2 || 'hidden' === $node.css("overflow")) {
                                $node.css({ 'display': '' });
                            } else {
                                $node.css({ 'display': 'initial' });
                            }
                            $node.text(strv);
                        }
                        editor.fire('saveSnapshot', { name: 'interactDropbox' });

                        _handleCascade($node.context, $target[0].text);

                        $div.hide();
                    }
                }
            });

            // 多选的确定
            $('#multiSelectConfirm').on('click', function (evt) {
                var valStr = '';
                var valArr = [];
                $('input[name="' + name + '"]:checked').each(function () {
                    valArr.push($(this).val());
                });
                console.log(valStr);
                combine$Nodes(editor, $node);
                for (var i = 0; i < valArr.length; i++) {
                    var item = valArr[i];
                    var matches = item.match(/\s*(.+)\((.*?)\)\s*$/);
                    var str = '';
                    if (matches && matches.length == 3) {
                        var code = matches[1];
                        // var val = matches[2];
                        str = code;
                    } else {
                        str = item;
                    }
                    if (!valStr) {
                        valStr = str;
                    } else {
                        valStr += jointsymbol + str;
                    }
                }
                console.log(valStr);
                $node.text(valStr);
                if (!valStr || 'hidden' === $node.css("overflow")) {
                    $node.css({ 'display': '' });
                } else {
                    $node.css({ 'display': 'initial' });
                }
                editor.fire('saveSnapshot', { name: 'multiSelectConfirm' });
                _handleCascade($node.context, valStr);
                $div.hide();
            });
        }

        function interactOnSearchbox($node) {
            // 可编辑
            var _isEdit = $node.attr('_isedit');
            var readonly = ( _isEdit == '是') ? '' : 'readonly';
            var freedomValFlag = _isEdit == '是';
            var $div = $('#interactDiv');

            var $selectablebox = $('<div id="interact-searchDiv" class="panel-body" style="width:260px;height:120px;display:inline-block;" ><select id="interact-search" style="width: 100%;"></select></div><div id="btns" style="display:inline-block;"><button id="confirm" style="height:28px;margin:6px 5px;padding:0 5px;" class="btn btn-primary">确定</button><button id="clear" style="height:28px;margin:6px 5px;padding:0 5px;" class="btn btn-primary">清除</button></div>');
            var $resultbox = $('<div id=interact-resultDiv class="panel-footer">' +
                '<input id="freedom" type=text style="width:230px;margin:5px;height:30px;"' + readonly + '/>' +
                '</div>');
        
            $div.append($selectablebox);
            $div.append($resultbox);
            var resultInput = $resultbox.find('input');
            var tt = $node.text() || '';
            resultInput.val(tt);
            resultInput.attr("name", $node.attr("_name") || "");
            resultInput.attr("code", $node.attr("_code") || "");
            resultInput.attr("order", $node.attr("_order") || "");
            resultInput.attr("remark", $node.attr("_remark") || "");
            resultInput.attr("grade", $node.attr("_grade") || "");
            var mainDiagnosis = $node.attr('data-hm-name') || '';
            var isMain = mainDiagnosis.indexOf('主要诊断') > -1;

            var searchOption = $node.attr('_searchoption');
            var showClear = tt.replace('\u200B', '') != '';

            if(!showClear){
                $selectablebox.find('#clear').remove();
            }

            if(!freedomValFlag){
                $selectablebox.find('#confirm').hide();
                $resultbox.hide();
            }

            $selectablebox.find('button').on('click', function (evt) {
                var clear = evt.target.id == 'clear';
                //获取对应编码/编码名称
                var $body = $(editorIns.document.getBody().$);
                var $pairNode = $();
                var $gradeNode = $(); // 手术级别
                combine$Nodes(editor, $node);
                if ($node.attr('_searchpair')) {
                    $pairNode = $body.find('[data-hm-name=' + $node.attr('_searchpair') + ']');
                }

                var curEl = $node[0];
                if(($node.attr('data-hm-name') || '').indexOf('编码') > -1){
                    curEl = $pairNode[0];
                }
                if(($node.attr('data-hm-name') || '').indexOf('手术及操作名称') > -1 || ($node.attr('data-hm-name') || '').indexOf('手术及操作编码') > -1){
                    var index = $node.attr('data-hm-name').split('_')[1];
                    $gradeNode = $body.find('[data-hm-name="手术级别代码_' + index + '"]')[0];
                }

                if (clear) {
                    resultInput.val('');
                    resultInput.attr("code", '未填写');
                    resultInput.attr("name", '未填写');
                    resultInput.attr("userid", '');
                    resultInput.attr("grade", '');
                }

                var code = resultInput.attr("code") || "";
                var name = resultInput.attr("name") || "";
                var remark = resultInput.attr("remark") || '';
                var userId = resultInput.attr('userid') || '';
                var grade = resultInput.attr('grade') || '';
                if (code == '未填写' && name == '未填写') {
                    $pairNode.removeAttr('_code').removeAttr('_name').removeAttr('_order').removeAttr('_remark').removeAttr('userid').removeAttr('_grade');
                    $node.removeAttr('_code').removeAttr('_name').removeAttr('_order').removeAttr('_remark').removeAttr('userid').removeAttr('_grade');
                } else {

                    if (!code && !name && _isEdit === '是' && resultInput.val()) {
                        name = resultInput.val();
                        code = '-';
                    }

                    if (code) {
                        $pairNode.attr('_code', code);
                        $node.attr('_code', code);
                        if ($pairNode.length == 1 && $pairNode.attr('_searchreturn').indexOf('编码') >= 0) {
                            if ("null" != code) {
                                $pairNode.text(code);
                            } else {
                                $pairNode.text("");
                            }

                        }
                    } else {
                        $pairNode.attr('_code', '');
                        $node.attr('_code', '');
                        if ($pairNode.length == 1 && $pairNode.attr('_searchreturn').indexOf('编码') >= 0) {
                            $pairNode.text("");
                        }
                    }

                    if (name) {
                        $pairNode.attr('_name', name);
                        $node.attr('_name', name);
                        if ($pairNode.length == 1 && $pairNode.attr('_searchreturn').indexOf('名称') >= 0) {
                            if ("null" != name) {
                                $pairNode.text(name);
                            } else {
                                $pairNode.text("");
                            }

                        }
                        if (remark) {
                            $pairNode.attr('_remark', remark);
                            $node.attr('_remark', remark);
                        }
                        if (userId) {
                            $pairNode.attr('userid', userId);
                            $node.attr('userid', userId);
                        }

                        if (grade && $gradeNode) {
                            setDataSourceVal($body, $gradeNode, grade);
                        }
                    }
                }
                if (resultInput.val().replace(/\u200B/g, '') == '') {
                    $node.text('\u200B');
                    $pairNode.text('\u200B');
                } else {
                    // 不再提供从数据库获取签名图片功能
                    $node.text(resultInput.val());
                }


                if (evt.currentTarget && evt.currentTarget.id == 'confirmAndgrow' && !editorIns.readOnly) { //自增搜索组件处理
                    doAutoInsertNode($node);
                }
                $div.hide();
                if ($node.text().replace(zeroWidthChar, '').length > 2 && 'hidden' !== $node.css("overflow")) {
                    $node.css('display', 'initial');
                } else {
                    $node.css('display', '');
                }
                if ($pairNode.text().replace(zeroWidthChar, '').length > 2 && 'hidden' !== $pairNode.css("overflow")) {
                    $pairNode.css('display', 'initial');
                } else {
                    $pairNode.css('display', '');
                }
                checkContent($node[0],$node.text().replace(zeroWidthChar,''));
                checkContent($pairNode[0],$pairNode.text().replace(zeroWidthChar,''));
                editor.fire('saveSnapshot', { name: 'searchBoxConfirm' });
                $node.removeClass('bgred');
            });

            var selectOptionFun = function (event) { // 回车响应搜索结果确认事件 addBy lwj
                if (event.keyCode === "13") {
                    $resultbox.find('#confirm').click();
                    document.removeEventListener("keydown", selectOptionFun);
                }
            };
            if (searchOption.indexOf('诊断') != -1) $resultbox.find('select').show();

            var searchParams = $node.attr('data-hm-search-params');
            var paramsObj = {};
            // 处理级联参数
            if (searchParams) {
                try {
                    var $body = $(editorIns.document.getBody().$);
                    // 解析级联参数字符串
                    searchParams.replace(/\{([^}]*)\}/, function(match, p1) {
                        p1.split(',').forEach(function(param) {
                            var parts = param.split('=');
                            var key = parts[0];
                            var value = parts[1];
                            if (key && value) {
                                paramsObj[key.trim()] = $body.find('[data-hm-code="' + value.trim() + '"]').text();
                            }
                        });
                    });

                } catch (e) {
                    console.error('解析级联参数失败:', e);
                }
            }
            var selectable = $selectablebox.find('select').editableSelect({
                filter: false,
                onInput: function (self, that) {
                    // 检查是否有自定义搜索URL
                    var customSearchUrl = $node.attr('data-hm-search-url');

                    if (customSearchUrl) {
                        // 使用自定义搜索URL
                        var searchText = $('#interact-search').val().replace(/\s*/g, '');
                        var url = customSearchUrl;

                        // 准备请求数据和请求头
                        var requestData = { searchText: searchText };
                        var requestHeaders = {};

                        // 使用searchParam获取配置
                        if (editor && editor.HMConfig && editor.HMConfig.customParams) {
                            requestData = Object.assign({}, editor.HMConfig.customParams.data || {});
                            requestData["searchText"] = searchText;
                            requestHeaders = editor.HMConfig.customParams.header;
                        }
                        if (Object.keys(paramsObj).length > 0) {
                            // 合并级联参数到请求数据
                            requestData = Object.assign(requestData, paramsObj);
                        }
                        // 发送AJAX请求 - 固定使用POST和JSON格式
                        $.ajax({
                            url: url,
                            type: 'POST',
                            dataType: 'json',
                            contentType: 'application/json',
                            headers: requestHeaders,
                            data: JSON.stringify(requestData),
                            success: function(data) {
                                var datas = data.data || [];
                                if (datas && datas.length > 0) {
                                    if (datas.length > 100) datas = datas.slice(0, 100);
                                    var li = "";
                                    $.each(datas, function (index, obj) {
                                        // 按照指定格式显示内容
                                        li += "<li class=es-visible code='" + obj.code + "' name='" + obj.name + "'>" + (obj.displayVal || obj.name) + "</li>";
                                    });
                                    $div.find('ul').html(li);
                                    that.highlight(0);
                                } else {
                                    $div.find('ul').html('<li class="no-result-tit">暂未搜索到对应结果!</li>');
                                }
                            },
                            error: function(xhr, status, error) {
                                $div.find('ul').html('<li class="no-result-tit">搜索失败: ' + error + '</li>');
                            }
                        });
                        return;
                    }
                }
            });



            selectable.on('select.editable-select', function (e, li) {
                var isCode = $node.attr('_searchreturn').indexOf('编码') != -1 ? true : false;
                var code = li.attr("code");
                var name = li.attr("name");
                var remark = li.attr("remark") || '';
                var userid = li.attr("userid") || '';
                var grade = li.attr("grade") || '';
                resultInput.attr('code', code);
                resultInput.attr('name', name);
                resultInput.attr('remark', remark);
                resultInput.attr('userid', userid);
                resultInput.attr('grade', grade);
                if (!code && !name) {
                    $("#interact-search").val("");
                }
                if (isCode) {
                    resultInput.val(code);
                } else {
                    resultInput.val(name + (remark ? '(' + remark + ')' : ''));
                }
                if (code == '未填写' && name == '未填写') {
                    $("#interact-search").val("");
                    resultInput.val("");
                }
                if(!freedomValFlag){
                    $selectablebox.find('#confirm').click();
                }

            });

            selectable.on("hidden.editable-select", function () {  //addBy lwj
                document.addEventListener("keydown", selectOptionFun);
            })

        }

        /**
         * 搜索组件回车自动增加搜索控件
         * @param {*} $node
         */
        function doAutoInsertNode($node) {
            if (!$node.parent()) {
                return;
            }
            var nodeName = $node.attr('data-hm-name');
            parentClone = $node.parent().clone(true);
            parentClone.insertAfter($node.parent());
            var contents = parentClone.contents();
            var growNodeIdex = -1; //复制的数据元所在位置
            for (var i = 0; i < contents.length; i++) {
                if (contents[i].nodeName == '#text') {
                    if (growNodeIdex < 0) {
                        var textarr = contents[i].wholeText.replace(/\u200B/g, '').split('');
                        var punctuationCode = /^[\u0000-\u00ff]$/; //匹配英文标点符号
                        textarr = textarr.map(function (item) {
                            if (item == '' || item == '　') {
                                return item;
                            } else if (punctuationCode.test(item)) {
                                return ' ';
                            } else {
                                return '　';
                            }
                        });
                        contents[i].data = textarr.join('');
                    } else if (i == growNodeIdex + 1) {
                        contents[i].data = '\u200B';
                    } else {
                        contents[i].remove();
                    }

                } else if (contents[i].nodeName == 'SPAN') {
                    growNodeIdex = i;
                    var dataSourceName = contents[i].getAttribute('data-hm-name');

                    if (dataSourceName && dataSourceName == nodeName) {
                        contents[i].innerHTML = '\u200B';
                        contents[i].removeAttribute('_code');
                        contents[i].removeAttribute('_name');
                        contents[i].setAttribute('data-hm-id', wrapperUtils.getGUID());
                    } else {
                        contents[i].remove();
                    }
                }
            }
        }

        function interactOnExpressionbox($node) {
            var $div = $('#interactDiv');

            var $interactExpressionbox = $('<div id="expressionWrapper">\
                <textarea id="firstTextarea" style="z-index:999;position:absolute;display:none;width:60px;height:28px"></textarea>\
                <textarea id="lastTextarea" style="z-index:999;position:absolute;display:none;width:60px;height:28px"></textarea>\
                <textarea id="singleTextarea" style="z-index:999;position:absolute;display:none;width:60px;height:28px"></textarea>\
                <textarea id="periodTextarea" style="z-index:999;position:absolute;display:none;width:60px;height:28px"></textarea>\
                <div id="expressionContainer" style="background-color:azure"></div>\
                <a type="button" id="expressionConfirm" style="float:right;right:0;margin:5px" class="btn btn-primary">确认</a>\
                </div>');
            $div.append($interactExpressionbox);

            var expressionoption = $node.attr('_expressionoption');
            var $firstTextarea = $div.find('#firstTextarea');
            var $lastTextarea = $div.find('#lastTextarea');
            var $singleTextarea = $div.find('#singleTextarea');
            var $periodTextarea = $div.find('#periodTextarea');
            var expFontSize = parseInt($node.css('font-size'));
            switch (expressionoption) {
                case '月经':
                    var offset = 25;
                    var width = 200;
                    var height = 50;
                    var firsttextNodeW = 50;
                    var lasttextNodeW = 100;
                    var lineWidth = 40;
                    var textHeight = expFontSize;
                    var textPadding = 2;
                    var $focusNode = null;
                    var textNode_single_val_default = "0-0";
                    var textNode_last_val_default = "1900-00-00";
                    var textNode_period_val_default = "00-00";
                    var textNode_first_val_default = "00";

                    var items = $node.attr('_expressionvalue') ? $node.attr('_expressionvalue') : $node.attr('data-hm-items');//兼容老的命名标准
                    if (items && items.split('#').length == 4) {
                        var item = items.split('#');

                        textNode_single_val_default = item[0];
                        textNode_last_val_default = item[1];
                        textNode_period_val_default = item[2];
                        textNode_first_val_default = item[3];
                    }

                    if (getTextWidth(textNode_single_val_default, expFontSize) > getTextWidth(textNode_period_val_default, expFontSize)) {
                        lineWidth = getTextWidth(textNode_single_val_default, expFontSize);
                    } else {
                        lineWidth = getTextWidth(textNode_period_val_default, expFontSize);
                    }
                    lineWidth = lineWidth > 80 ? 80 : (lineWidth < 30 ? 30 : lineWidth); // 最大值80 最小值 30
                    var stage = new Konva.Stage({
                        container: 'expressionContainer',
                        width: width + offset * 2,
                        height: height + offset * 2
                    });

                    var layer = new Konva.Layer();
                    stage.add(layer);

                    function updateExpression(stage) {
                        var maxW = lineWidth;
                        var singleTextWidth = getTextWidth(textNode_single.text(), expFontSize);
                        var periodTextWidth = getTextWidth(textNode_period.text(), expFontSize);
                        if (singleTextWidth + textNode_single.padding() > periodTextWidth + textNode_period.padding()) {
                            maxW = singleTextWidth + textNode_single.padding();
                        } else {
                            maxW = periodTextWidth + textNode_period.padding();
                        }
                        maxW = maxW > 80 ? 80 : (maxW < 30 ? 30 : maxW); // 最大值80 最小值 30
                        textNode_single.width(maxW);
                        textNode_period.width(maxW);
                        line.points(line.points().slice(0, 2).concat([firsttextNodeW + maxW + offset, height / 2 + offset]));
                        textNode_last.x(firsttextNodeW + maxW + offset);
                    }

                    function commitTextVal() {
                        if (!$focusNode) {
                            return;
                        }
                        switch ($focusNode.attrs._name) {
                            case 'textNode_single':
                                textNode_single.text($singleTextarea.val());
                                $singleTextarea.hide();
                                updateExpression();
                                break;
                            case 'textNode_period':
                                textNode_period.text($periodTextarea.val());
                                $periodTextarea.hide();
                                updateExpression();
                                break;
                            case 'textNode_last':
                                textNode_last.text($lastTextarea.val());
                                $lastTextarea.hide();
                                break;
                            case 'textNode_first':
                                textNode_first.text($firstTextarea.val());
                                $firstTextarea.hide();
                                break;

                        }
                        layer.draw();
                    }

                    stage.on('contentClick', function (evt) {
                        if (!evt.currentTarget.targetShape) {
                            commitTextVal();
                        }
                    });


                    var textNode_single = new Konva.Text({
                        text: textNode_single_val_default,
                        x: offset + firsttextNodeW,
                        y: offset + (height / 2 - (textHeight + textPadding)),
                        width: lineWidth,
                        height: textHeight + textPadding,
                        verticalAlign: 'bottom',
                        align: 'center',
                        fontSize: expFontSize,
                        padding: textPadding,
                        wrap: 'none',
                        ellipsis: true,
                        _name: 'textNode_single'
                    });
                    layer.add(textNode_single);

                    var textNode_last = new Konva.Text({
                        text: textNode_last_val_default,
                        x: firsttextNodeW + lineWidth + offset,
                        y: offset + (height - (textHeight + textPadding)) / 2,
                        width: lasttextNodeW,
                        height: textHeight + textPadding,
                        verticalAlign: 'middle',
                        align: 'left',
                        fontSize: expFontSize,
                        padding: textPadding,
                        wrap: 'none',
                        ellipsis: true,
                        _name: 'textNode_last'
                    });
                    layer.add(textNode_last);

                    var textNode_period = new Konva.Text({
                        text: textNode_period_val_default,
                        x: firsttextNodeW + offset,
                        y: height / 2 + offset,
                        width: lineWidth,
                        height: textHeight + textPadding,
                        verticalAlign: 'top',
                        align: 'center',
                        fontSize: expFontSize,
                        padding: textPadding,
                        wrap: 'none',
                        ellipsis: true,
                        _name: 'textNode_period'
                    });
                    layer.add(textNode_period);

                    var textNode_first = new Konva.Text({
                        text: textNode_first_val_default,
                        x: offset,
                        y: offset + (height - (textHeight + textPadding)) / 2,
                        width: firsttextNodeW,
                        height: textHeight + textPadding,
                        verticalAlign: 'bottom',
                        align: 'right',
                        fontSize: expFontSize,
                        padding: textPadding,
                        wrap: 'none',
                        ellipsis: true,
                        _name: 'textNode_first'
                    });
                    layer.add(textNode_first);

                    var line = new Konva.Line({
                        points: [firsttextNodeW + offset, height / 2 + offset, firsttextNodeW + lineWidth + offset, height / 2 + offset],
                        stroke: 'black',
                        strokeWidth: 1,
                    });
                    layer.add(line);
                    layer.draw();

                    function showTextArea(targetNode) {
                        var textPosition = targetNode.getAbsolutePosition();

                        var areaPosition = {
                            x: textPosition.x,
                            y: textPosition.y
                        };
                        var $textarea = null;
                        var textareaWidth = targetNode.attrs.width;
                        var textareaHeight = targetNode.attrs.height + 10;
                        commitTextVal();
                        switch (targetNode.attrs._name) {
                            case 'textNode_first':
                                $textarea = $firstTextarea;
                                areaPosition.y = textPosition.y - 5;
                                break;
                            case 'textNode_last':
                                $textarea = $lastTextarea;
                                areaPosition.y = textPosition.y - 5;
                                break;
                            case 'textNode_single':
                                $textarea = $singleTextarea;
                                areaPosition.y = textPosition.y - 10;
                                textareaWidth = targetNode.attrs.width + 30; //宽度增加30
                                break;
                            case 'textNode_period':
                                $textarea = $periodTextarea;
                                textareaWidth = targetNode.attrs.width + 30;
                                break;
                        }
                        $textarea.css('top', areaPosition.y + 'px');
                        $textarea.css('left', areaPosition.x + 'px');
                        $textarea.css('width', textareaWidth + 'px');
                        $textarea.css('height', textareaHeight + 'px');
                        $textarea.show();
                        $textarea.val(targetNode.text());
                        $textarea.focus();
                        $focusNode = targetNode;
                    }
                    textNode_single.on('click', function (evt) {
                        showTextArea(textNode_single);
                    });
                    textNode_last.on('click', function (evt) {
                        showTextArea(textNode_last);
                    });
                    textNode_period.on('click', function (evt) {
                        showTextArea(textNode_period);
                    });
                    textNode_first.on('click', function (evt) {
                        showTextArea(textNode_first);
                    });

                    break;
                case '胎心':
                    var offset = 25;
                    var width = 60;
                    var height = 40;
                    var padding = 5;
                    var stage = new Konva.Stage({
                        container: 'expressionContainer',
                        width: width + offset * 2,
                        height: height + offset * 2
                    });

                    var layer = new Konva.Layer();
                    stage.add(layer);

                    var axisX = new Konva.Line({
                        points: [padding + offset, height / 2 + offset, width - padding + offset, height / 2 + offset],
                        stroke: 'black',
                        strokeWidth: 1,
                    });

                    var axisY = new Konva.Line({
                        points: [width / 2 + offset, padding + offset, width / 2 + offset, height - padding + offset],
                        stroke: 'black',
                        strokeWidth: 1,
                    });

                    layer.add(axisX);
                    layer.add(axisY);
                    layer.draw();
                    var centerPoint = [width / 2 + offset, height / 2 + offset]; //坐标十字的中心坐标
                    var crossPadding = 5; // 胎心标志距中心点的间距
                    var crossW = 8;

                    var crossSign1 = new Konva.Line({
                        points: [centerPoint[0] - crossPadding - crossW, centerPoint[1] - crossPadding - crossW, centerPoint[0] - crossPadding, centerPoint[1] - crossPadding],
                        stroke: 'black',
                        strokeWidth: 3,
                    });
                    var crossSign2 = new Konva.Line({
                        points: [centerPoint[0] - crossPadding - crossW, centerPoint[1] - crossPadding, centerPoint[0] - crossPadding, centerPoint[1] - crossPadding - crossW],
                        stroke: 'black',
                        strokeWidth: 3,
                    });

                    layer.add(crossSign1);
                    layer.add(crossSign2);

                    function posCross() {
                        if (pos == 'rightbottom') {
                            crossSign1.x(crossPadding * 2 + crossW);
                            crossSign1.y(crossPadding * 2 + crossW);
                            crossSign2.x(crossPadding * 2 + crossW);
                            crossSign2.y(crossPadding * 2 + crossW);
                        }
                        if (pos == 'righttop') {
                            crossSign1.x(crossPadding * 2 + crossW);
                            crossSign1.y(0);
                            crossSign2.x(crossPadding * 2 + crossW);
                            crossSign2.y(0);
                        }
                        if (pos == 'leftbottom') {
                            crossSign1.x(0);
                            crossSign1.y(crossPadding * 2 + crossW);
                            crossSign2.x(0);
                            crossSign2.y(crossPadding * 2 + crossW);
                        }
                        if (pos == 'lefttop') {
                            crossSign1.x(0);
                            crossSign1.y(0);
                            crossSign2.x(0);
                            crossSign2.y(0);
                        }
                    }

                    var items = $node.attr('_expressionvalue') ? $node.attr('_expressionvalue') : $node.attr('data-hm-items');
                    var pos = items ? items : "";
                    if (pos != "") {
                        posCross();
                        layer.draw();
                    }


                    stage.on('contentClick', function (evt) {
                        pos = '';
                        var posX = evt.currentTarget.pointerPos.x;
                        var posY = evt.currentTarget.pointerPos.y;
                        if (posX > offset + width / 2) {
                            pos += "right";
                        } else {
                            pos += "left";
                        }
                        if (posY > offset + height / 2) {
                            pos += "bottom";
                        } else {
                            pos += "top";
                        }
                        posCross();

                        layer.draw();
                    });

                    break;
                case '牙位':
                    var offset = 25;
                    var width = 200;
                    var height = 50;
                    var textHeight = expFontSize;
                    var textPadding = 4;
                    var $focusNode = null;
                    var textValObj = getInitVal($node);
                    var stage = new Konva.Stage({
                        container: 'expressionContainer',
                        width: width + offset * 2,
                        height: height + offset * 2
                    });

                    var layer = new Konva.Layer();
                    stage.add(layer);

                    function showToothTextArea(targetNode) {
                        var textPosition = targetNode.getAbsolutePosition();
                        var areaPosition = {
                            x: textPosition.x,
                            y: textPosition.y
                        };
                        var textAlign = 'left';
                        var $textarea = null;
                        commitToothTextVal();
                        switch (targetNode.attrs._name) {
                            case 'text_ul':
                                textAlign = 'right';
                                areaPosition.y = offset;
                                $textarea = $firstTextarea;
                                break;
                            case 'text_dl':
                                textAlign = 'right';
                                $textarea = $singleTextarea;
                                break;
                            case 'text_ur':
                                areaPosition.y = offset;
                                textAlign = 'left';
                                $textarea = $periodTextarea;
                                break;
                            case 'text_dr':
                                textAlign = 'left';
                                $textarea = $lastTextarea;
                                break;
                        }
                        $textarea.css({
                            'top': areaPosition.y + 'px',
                            'left': areaPosition.x + 'px',
                            'width': width / 2 + 'px',
                            'height': height / 2 + 'px',
                            'text-align': textAlign
                        })
                        $textarea.show();
                        $textarea.val(targetNode.text());
                        $textarea.focus();
                        $focusNode = targetNode;
                    }
                    var node = {}; //存放四个node节点
                    function initToothText(textName) {
                        var params = getInitParams(textName, offset, width, height, expFontSize, textPadding, textValObj);
                        node[textName] = new Konva.Text(params);
                        layer.add(node[textName]);
                        node[textName].on('click', function (evt) {
                            showToothTextArea(node[textName]);
                        });
                    }

                    function commitToothTextVal(val) {
                        if (!$focusNode) {
                            return;
                        }
                        switch ($focusNode.attrs._name) {
                            case 'text_ul':
                                node.text_ul.text($firstTextarea.val());
                                $firstTextarea.hide();
                                break;
                            case 'text_ur':
                                node.text_ur.text($periodTextarea.val());
                                $periodTextarea.hide();
                                break;
                            case 'text_dl':
                                node.text_dl.text($singleTextarea.val());
                                $singleTextarea.hide();
                                break;
                            case 'text_dr':
                                node.text_dr.text($lastTextarea.val());
                                $lastTextarea.hide();
                                break;
                        }
                        layer.draw();
                    }

                    initToothText('text_ul');
                    initToothText('text_ur');
                    initToothText('text_dl');
                    initToothText('text_dr');

                    var xline = new Konva.Line({
                        points: [offset, height / 2 + offset, width + offset, height / 2 + offset],
                        stroke: 'black',
                        strokeWidth: 1,
                    });
                    var yline = new Konva.Line({
                        points: [width / 2 + offset, offset, width / 2 + offset, height + offset],
                        stroke: 'black',
                        strokeWidth: 1,
                    });
                    layer.add(xline);
                    layer.add(yline);
                    layer.draw();
                    $singleTextarea.css('resize', 'none');
                    $periodTextarea.css('resize', 'none');
                    $firstTextarea.css('resize', 'none');
                    $lastTextarea.css('resize', 'none');

                    stage.on('contentClick', function (evt) {
                        if (!evt.currentTarget.targetShape) {
                            commitToothTextVal();
                        }
                    });
                    break;
            }

            $('#expressionConfirm').on('click', function () {
                var left = offset;
                var top = offset;
                switch (expressionoption) {
                    case '月经':
                        commitTextVal();
                        $node.attr('_expressionvalue', textNode_single.text() + '#' + textNode_last.text() + '#' + textNode_period.text() + '#' + textNode_first.text());
                        var tmpSizeObj = getExpressionSizeAndPosition(stage, textPadding);
                        left = tmpSizeObj.x || offset;
                        top = tmpSizeObj.y || offset;
                        width = tmpSizeObj.width || width;
                        height = tmpSizeObj.height || height;
                        break;
                    case '胎心':
                        $node.attr('_expressionvalue', pos);
                        break;
                    case '牙位':
                        commitToothTextVal();
                        $node.attr('_expressionvalue', node.text_ul.text() + '#' + node.text_ur.text() + '#' + node.text_dl.text() + '#' + node.text_dr.text());
                        var tmpSizeObj = getExpressionToothSizeAndPosition(stage, textPadding, offset);
                        left = tmpSizeObj.x || offset;
                        top = tmpSizeObj.y || offset;
                        width = tmpSizeObj.width || width;
                        height = tmpSizeObj.height || height;
                }

                var src = stage.toDataURL({
                    x: left,
                    y: top,
                    width: width,
                    height: height
                });
                var lineHeight = parseInt($node.parent().css('line-height')) || 24;
                var expHeight = lineHeight;
                var scaleRate = expHeight / height;
                var expWidth = width * scaleRate;
                $node.css({
                    'display': 'inline-table',
                    'vertical-align': 'middle',
                    'width': expWidth + 'px',
                    'height': expHeight + 'px',
                    'background-image': 'url(' + src + ')',
                    'background-size': '100% 100%'
                });
                $div.hide();
                stage.destroy();
            })
        }

        function interactOnText(editor,element,dblclick,autoOpen){
            if(element.attr('_isdisabled') == 'true'){
                // 只读
                return;
            }

            if(!autoOpen){
                if(dblclick){
                    // 双击
                    if(element.attr('_click') == 'true'){
                        // 有单击属性
                        return;
                    }
                    if(element.attr('_doubleclick') != 'true'){
                        // 未勾选必须双击
                        return;
                    }
                }else{
                    if(element.attr('_click') != 'true'){
                        // 有单击属性
                        return;
                    }
                }
            }

            var _texttype = element.attr('_texttype');
            var $div = $('#interactDiv');
            var $iframe = $('iframe');

            $div.css('display', 'none');
            $div.css('width', 'unset');
            $div.css('height', 'unset');
            $div.css('z-index', 'unset');
            $div.empty();
            if (_texttype == '下拉') {
                if (element.hasClass('new-textbox')) {
                    datasource.find('span.new-textbox-content');
                }
                interactOnDropbox1(element);
                //setTimeout(function () {
                    $node = element;
                    var divTop = $node.offset().top - $($node[0].ownerDocument).scrollTop() + $iframe.offset().top;
                    var divLeft = $node.offset().left - $($node[0].ownerDocument).scrollLeft() + $iframe.offset().left;
                    $div.css('top', 0);
                    $div.css('left', 0);
                    $div.css('display', 'block');
                    if ((divTop - $div.height() >= $iframe.offset().top) && ($iframe.height() - $div.height() < divTop - $iframe.offset().top)) { // modify By liwenjuan 处理顶部日期组件确定按钮覆盖问题
                        $div.css('top', divTop - $div.height());
                    } else {
                        $div.css('top', divTop + $node.height());
                    }
                    if ($iframe.width() - $div.width() < divLeft) {
                        $div.css('left', divLeft - $div.width());
                    }
                    else {
                        $div.css('left', divLeft);
                    }
                //}, 100);
            } else {
               // 不再为诊断列表和手术列表提供编辑弹窗
            }
        }

        function interactOnDropbox1($node) {
            var txt = removeZeroWidth($node.text());
            var items = removeZeroWidth($node.attr('data-hm-items')).split('#');
            var name = $node.attr('data-hm-name');
            var selectType = $node.attr('_selectType');
            var jointsymbol = $node.attr('_jointSymbol') || ',';
            var singleSelFlg = selectType == '单选';
            var $div = $('#interactDiv');
            //下拉多选增加确定按钮
            var multiSelectConfirmBtn = '<button style="margin:6px 5px;padding:0 5px;'+(singleSelFlg?'display:none;':'')+'" id="multiSelectConfirm" class="btn btn-primary">确定</button>';
            var $interactDropbox = $('<div><input id="searchInput" type="text" style="margin:5px;"/><button id="searchBtn" style="margin:6px 5px;padding:0 5px;" class="btn btn-primary">搜索</button>' + multiSelectConfirmBtn + '</div><div class="dropdown-menu1"><ul role="menu" style="max-width:300px;"></ul></div>');

            for (var i = 0; i < items.length; i++) {
                $interactDropbox.find('ul').append('<li role="presentation"><a role="menuitem" tabindex="-1" href="#"><input style="vertical-align: middle;margin:0 5px 0 0;" type="checkbox" name=' + name + ' value=' + items[i] + ' />' + items[i] + '</a></li>');
            }
            $div.append($interactDropbox);

            var selectFlag = false;
            //设置选中项
            var nodeText = txt.split(jointsymbol || ',');
            // 判断是否是带编码选项
            var items0 = items[0].match(/(.+)\((.*?)\)\s*$/);
            if (items0 && items0.length == 3) {
                // var itemArr = [];
                for (var i = 0; i < items.length; i++) {
                    itemsArr = items[i].match(/(.+)\((.*?)\)\s*$/);
                    if (nodeText.indexOf(itemsArr[1]) >= 0) {
                        $('input[name="' + name + '"][value="' + itemsArr[0] + '"]').prop('checked', true);
                        selectFlag = true;
                    }
                }
            } else {
                $('input[name="' + name + '"]').each(function () {
                    if (nodeText.indexOf($(this).val()) >= 0) {
                        $(this).prop('checked', true);
                        selectFlag = true;
                    }
                });
            }

            initSelBtn(selectFlag);


            $interactDropbox.on('click', function (evt) {
                var $target = $(evt.target);
                // 选中 a
                if ($target.is('a')) {
                    var curCheck = $target.children('input').is(":checked");
                    if (selectType === '单选') {
                        $interactDropbox.find('ul input').prop('checked', false);
                    }
                    if (curCheck) {
                        $target.children('input').prop('checked', false);
                    } else {
                        $target.children('input').prop('checked', true);
                    }

                    if(singleSelFlg){
                        $div.find('#multiSelectConfirm')[0].click();
                    }else{
                        initSelBtn(null);
                    }
                }
                // 选中 input
                if ($target.is('input') && $target.attr('type') == 'checkbox') {
                    var curCheck = $target.is(":checked")
                    if (selectType === '单选') {
                        $interactDropbox.find('ul input').prop('checked', false);
                    }
                    $target.prop('checked', curCheck);
                    if(singleSelFlg){
                        $div.find('#multiSelectConfirm')[0].click();
                    }else{
                        initSelBtn(null);
                    }
                }

            });

            // 多选的确定
            $('#multiSelectConfirm').on('click', function (evt) {
                var valStr = '';
                var valArr = [];
                $('input[name="' + name + '"]:checked').each(function () {
                    valArr.push($(this).val());
                });
                combine$Nodes(editor, $node);

                // 值(编码)
                var codeArr = [];
                for (var i = 0; i < valArr.length; i++) {
                    var item = valArr[i];
                    var matches = item.match(/\s*(.+)\((.*?)\)\s*$/);
                    var str = '';
                    if (matches && matches.length == 3) {
                        str = matches[1];
                        codeArr.push(matches[2]);
                    } else {
                        str = item;
                    }
                    if (!valStr) {
                        valStr = str;
                    } else {
                        valStr += jointsymbol + str;
                    }
                }

                if (!valStr) {
                    var placeholder = $node.parent('.new-textbox').attr('_placeholder');
                    $node.html(placeholder);
                    $node.attr('_placeholdertext', 'true');
                    $node.removeAttr('code');
                } else {
                    $node.removeAttr('_placeholdertext');
                    $node.html(valStr);
                    if(codeArr.length > 0){
                        $node.attr('code', codeArr.join(jointsymbol));
                    }
                }
                checkContent($node[0],valStr);
                editor.fire('saveSnapshot', { name: 'multiSelectConfirm' });
                _handleCascade($node.context, valStr);
                _handleRelevance($node);
                $div.hide();

                if($node.hasClass('new-textbox-content')){
                    if ($node.parent('.new-textbox').hasClass('bgred')) {
                        $node.parent('.new-textbox').removeClass('bgred');
                    }
                }
            });
            var filter = function(){
                var selectList = $interactDropbox.find('ul li');
                selectList.show();
                var val = $('#searchInput').val();
                for (var i = 0; i < selectList.length; i++) {
                    var ele = $(selectList[i]);
                    if (ele.find('a').text().indexOf(val)>-1) {
                        ele.show();
                    } else {
                        ele.hide();
                    }

                }
            }
            // 多选的确定
            $('#searchBtn').on('click', function (evt) {
                var txt = $(evt.target).attr('text');
                if(txt == '清除'){
                    $interactDropbox.find('input[type=checkbox]').prop('checked',false);
                    initSelBtn(false);
                    return;
                }else if(txt == '全选'){
                    $interactDropbox.find('input[type=checkbox]').prop('checked',true);
                    initSelBtn(true);
                    return;
                }
                filter();

            });

            $('#searchInput').on('keydown', function (event) {
                if (event.keyCode == "13") {
                    //$interactDropbox.find('#searchBtn').click();
                    filter();
                }
            });

            function initSelBtn(selFlag){
                if(!singleSelFlg){
                    if(selFlag == null){
                        selFlag = $('input[name="' + name + '"]:checked').length > 0;
                    }
                    var txt = '全选'
                    // 多选
                    if(selFlag){
                        // 清除
                        txt = '清除';
                    }else{
                        // 全选
                    }
                    $('#searchBtn').attr('text',txt).text(txt);
                }
            }
        }

        /**
         * 获取字符串总宽度;
         * @param {*} val
         */
        function getTextWidth(val, fontSize) {
            if (!val || val.toString().length == 0) {
                return 0;
            }
            $span = $('<span style="font-size: ' + (fontSize || 12) + 'px;"></span>');
            $span.appendTo($('#interactDiv'));
            $('#interactDiv').show();
            var valArr = val.split('');
            var allW = 0;
            for (var i = 0; i < valArr.length; i++) {
                $span.html(valArr[i]);
                allW += $span.width();
            }
            $span.empty();
            $span.remove();
            return allW + 20;
        }

        /**
         * 获取月经史的文本区域大小以及开始位置
         * @param {*} stage
         * @param {*} textPadding
         */
        function getExpressionSizeAndPosition(stage, textPadding) {
            if (!stage || !stage.children || stage.children.length < 1 || !stage.children[0].children || stage.children[0].children.length < 1) {
                return {};
            }
            var canvasObjects = stage.children[0].children;
            var tmpObj = {
                width: 0,
                height: 0,
                x: 0,
                y: 0
            };
            var textNode_first = null;
            for (var i = 0; i < canvasObjects.length; i++) {
                if (canvasObjects[i].className == 'Line' && canvasObjects[i].attrs && canvasObjects[i].attrs.points && canvasObjects[i].attrs.points.length == 4) {
                    var lineWidth = (canvasObjects[i].attrs.points[2] || 0) - (canvasObjects[i].attrs.points[0] || 0);
                    if (lineWidth > 0) {
                        tmpObj.width += lineWidth;
                    }
                } else if (canvasObjects[i].className == 'Text' && (canvasObjects[i].attrs._name == 'textNode_first' || canvasObjects[i].attrs._name == 'textNode_last')) {
                    tmpObj.width += canvasObjects[i].textWidth || 0;
                    if (canvasObjects[i].attrs._name == 'textNode_first') {
                        textNode_first = canvasObjects[i];
                    }
                } else if (canvasObjects[i].className == 'Text' && (canvasObjects[i].attrs._name == 'textNode_single' || canvasObjects[i].attrs._name == 'textNode_period')) {
                    tmpObj.height += canvasObjects[i].textHeight || 0;
                }
            }
            tmpObj.width += textPadding * 4;
            tmpObj.x = textNode_first.attrs.width - textNode_first.textWidth + 25 - textPadding * 2;
            tmpObj.y = (stage.getHeight() - tmpObj.height) / 2;
            return tmpObj;
        }

        /**
         * 获取牙位的医学表达式尺寸和位置
         * @param {*} stage
         * @param {*} textPadding
         */
        function getExpressionToothSizeAndPosition(stage, textPadding, offset) {
            if (!stage || !stage.children || stage.children.length < 1 || !stage.children[0].children || stage.children[0].children.length < 1) {
                return {};
            }
            var canvasObjects = stage.children[0].children;
            var maxObj = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
            var maxWidth = 0;
            var maxHeight = 0;
            for (var i = 0; i < canvasObjects.length; i++) {
                if (canvasObjects[i].className == 'Text') {
                    var txtTmpWidth = canvasObjects[i].textWidth || 0;
                    if (maxWidth < txtTmpWidth) {
                        maxWidth = txtTmpWidth;
                    }
                    if (maxHeight < canvasObjects[i].textHeight) {
                        maxHeight = canvasObjects[i].textHeight;
                    }
                }
            }
            if (maxWidth < 1) {
                maxObj.width = maxWidth;
                maxObj.x = offset;
            } else {
                maxObj.width = maxWidth * 2 + textPadding * 6; // 文本之间的间距再预留文本两边的间距
                maxObj.x = (stage.getWidth() - maxObj.width) / 2;  // 数据两边留白距离
            }
            maxObj.height = maxHeight * 2 + textPadding * 2;
            maxObj.y = (stage.getHeight() - maxObj.height) / 2;
            return maxObj;
        }

        /**
         * 获取初始化文本box参数
         * @param {*} textName
         * @param {*} offset
         * @param {*} width
         * @param {*} height
         * @param {*} textValObj
         */
        function getInitParams(textName, offset, width, height, expFontSize, textPadding, textValObj) {
            var params = {};
            switch (textName) {
                case 'text_ul':
                    params = {
                        text: textValObj.ul_val,
                        x: offset,
                        y: height / 2 - (expFontSize + textPadding) + offset,
                        width: width / 2,
                        height: expFontSize,
                        verticalAlign: 'bottom',
                        align: 'right'
                    };
                    break;
                case 'text_ur':
                    params = {
                        text: textValObj.ur_val,
                        x: offset + width / 2,
                        y: height / 2 - (expFontSize + textPadding) + offset,
                        width: width / 2,
                        height: expFontSize,
                        verticalAlign: 'bottom',
                        align: 'left'
                    };
                    break;
                case 'text_dl':
                    params = {
                        text: textValObj.dl_val,
                        x: offset,
                        y: height / 2 + offset,
                        width: width / 2,
                        height: expFontSize,
                        verticalAlign: 'top',
                        align: 'right'
                    };
                    break;
                case 'text_dr':
                    params = {
                        text: textValObj.dr_val,
                        x: width / 2 + offset,
                        y: height / 2 + offset,
                        width: width / 2,
                        height: expFontSize,
                        verticalAlign: 'top',
                        align: 'left'
                    }
                    break;
            }
            params._name = textName;
            params.padding = textPadding;
            params.fontSize = expFontSize;
            params.wrap = 'none';
            params.ellipsis = true;
            return params;
        }

        /**
         * 获取牙位初始值
         * @param {*} $node
         */
        function getInitVal($node) {
            var textDefaultVal = {
                ul_val: '',
                ur_val: '',
                dl_val: '',
                dr_val: ''
            };

            var items = $node.attr('_expressionvalue') ? $node.attr('_expressionvalue') : '';//兼容老的命名标准
            if (items && items.split('#').length == 4) {
                var item = items.split('#');
                textDefaultVal.ul_val = item[0] || '';
                textDefaultVal.ur_val = item[1] || '';
                textDefaultVal.dl_val = item[2] || '';
                textDefaultVal.dr_val = item[3] || '';
            }
            return textDefaultVal;
        }

        function interactOnLabelbox($node) {
            var txt = $node.text().replace(/\u200B/g, '');

            var $div = $('#interactDiv');

            var $form = $('<form><input data-interactbox style="width: 60%;margin: 2px;height:25px" type=text/></form>');
            $div.append('<a type="button" id="labelConfirm" style="position:absolute;right:0;margin:5px" class="btn btn-primary">确认</a>');
            $div.append($form);

            $form.find('input').val($node.text());

            $div.find('a').on('click', function (evt) {
                var $target = $(evt.target);
                if ($target.is('a')) {
                    var val = $form.find('input').val().replace(/\u200B/g, '').replace(/\u3000/g, '').replace(/\s/g, '');
                    if (val == '') val = '\u3000';
                    $node.text(val);
                    $div.hide();
                }
            })


        }


        editor.addCommand('datasource', new CKEDITOR.dialogCommand('datasourceConfig'));


        function getWidgetByElement(ele) {
            for (var w in editorIns.widgets.instances) {
                if (editorIns.widgets.instances[w].element.getChildren().getItem(0).$ === ele) {
                    return editorIns.widgets.instances[w];
                }
            }
            return null;
        }

        editor.addCommand('nodeDelete', {
            exec: function (editor) {
                var $element = $(editor.contextTargetElement.$);

                if (!$element.attr('data-hm-node') && !$element.is('button')) {
                    $element = $element.parents().filter('[data-hm-node]');
                }
                var td = editor.elementPath().contains('td');
                if (td && td.hasAttribute('data-hm-node')) $element = $(td.$);
                var eleType = $element.attr('data-hm-node');
                switch (eleType) {
                    case 'newtextbox':
                    case 'numbox':
                    case 'timetext':
                        $($element[0]).remove();
                        break;
                    case 'cellbox':
                        $element.removeAttr('data-hm-node');
                        $element.removeAttr('data-hm-name');
                        $element.removeAttr('_association_name');
                        $element.removeAttr('data-hm-id');
                        break;
                    case 'textboxwidget':
                        var _widget = getWidgetByElement($element[0]);
                        editorIns.widgets.destroy(_widget);

                        $element.parent().remove();
                        $element.remove();
                        break;
                    default:
                        $element.remove();
                        break;
                }
            }
        });

        editor.addCommand('nodeProperties', new CKEDITOR.dialogCommand('datasourceConfig'));

        // function insertSearchBox(searchOption) {
        //     editor.fire('paste', {
        //         dataValue: '\u200B<span contenteditable="false" data-hm-node="searchbox"' + ' _searchoption="' + searchOption + '" data-hm-id="' + wrapperUtils.getGUID() + '">\u200B</span>\u200B',
        //         pasteType: 'pasteWithFormat',
        //         dontFilter: true
        //     });
        // }

        function insertExpressionBox(expressionOption) {
            var _datasourceName = '';
            var _expressionboxId = wrapperUtils.getGUID();
            var $boundaryNewtextbox = editor.plugins["datasource"].getRangeBoundaryNewtextbox() || $(editor.contextTargetElement.$);
            if ($boundaryNewtextbox.hasClass('new-textbox')) {
                _datasourceName = $boundaryNewtextbox.attr('data-hm-name') || '';
            }

            editor.fire('paste', {
                dataValue: '\u200B<span contenteditable="false" data-hm-node="expressionbox"' + ' _expressionoption="' + expressionOption + '" _expressionoption_name="' + _datasourceName + '" data-hm-id="' + _expressionboxId + '">\u200B</span>\u200B',
                pasteType: 'pasteWithFormat',
                dontFilter: true
            });
        }

        // editor.addCommand('手术名称', {
        //     exec: function (editor) {
        //         insertSearchBox('手术名称');
        //     }
        // });
        // editor.addCommand('手术编码', {
        //     exec: function (editor) {
        //         insertSearchBox('手术编码');
        //     }
        // });
        // editor.addCommand('诊断名称', {
        //     exec: function (editor) {
        //         insertSearchBox('诊断名称');
        //     }
        // });
        // editor.addCommand('诊断编码', {
        //     exec: function (editor) {
        //         insertSearchBox('诊断编码');
        //     }
        // });
        // editor.addCommand('中医诊断名称', {
        //     exec: function (editor) {
        //         insertSearchBox('中医诊断名称');
        //     }
        // });
        // editor.addCommand('中医诊断编码', {
        //     exec: function (editor) {
        //         insertSearchBox('中医诊断编码');
        //     }
        // });
        // editor.addCommand('医护名称', {
        //     exec: function (editor) {
        //         insertSearchBox('医护名称');
        //     }
        // });

        editor.addCommand('月经', {
            exec: function (editor) {
                insertExpressionBox('月经');
            }
        });

        editor.addCommand('胎心', {
            exec: function (editor) {
                insertExpressionBox('胎心');
            }
        });

        editor.addCommand('牙位', {
            exec: function (editor) {
                insertExpressionBox('牙位');
            }
        });

        editor.addCommand('modifyLabelContent', {
            exec: function (editor) {
                popInteractive({
                    contextTarget: editor.contextTargetElement
                }, editor.document.getBody(), editor);
            }
        });

        editor.addCommand('设为实线', {
            exec: function (editor) {
                var _body = $(editor.document.getBody().$);
                var paperheaders = _body.find('[_paperheader]:visible');
                var paperheader = $(paperheaders[paperheaders.length - 1]);
                paperheader.find('tr:last td').css('border-bottom', '1px solid black');
            }
        });
        editor.addCommand('设为虚线', {
            exec: function (editor) {
                var _body = $(editor.document.getBody().$);
                var paperheaders = _body.find('[_paperheader]:visible');
                var paperheader = $(paperheaders[paperheaders.length - 1]);
                paperheader.find('tr:last td').css('border-bottom', '1px dashed black');
            }
        });
        editor.addCommand('取消设置', {
            exec: function (editor) {
                var _body = $(editor.document.getBody().$);
                var paperheaders = _body.find('[_paperheader]:visible');
                var paperheader = $(paperheaders[paperheaders.length - 1]);
                paperheader.find('tr:last td').css('border-bottom', 'none');
            }
        });

        editor.addCommand('引用页眉',{
			exec: function( editor ) {
                var element = CKEDITOR.dom.element.createFromHtml( sessionStorage.getItem('paperHeader') );
                editor.insertElement( element );
			}
		});
		editor.addCommand('引用页脚',{
			exec: function( editor ) {
				var element = CKEDITOR.dom.element.createFromHtml( sessionStorage.getItem('paperFooter') );
                editor.insertElement( element );
			}
		});

        editor.ui.addButton && editor.ui.addButton('Datasource', {
            label: '数据元',
            command: 'datasource',
            toolbar: 'document',
            allowedContent: 'span[data-hm-*,contenteditable,_*](fa,fa-*)'
        });

        if (editor.contextMenu) {
            editor.addMenuGroup('hm');
            editor.addMenuItem('nodeDelete', {
                label: '删除节点',
                command: 'nodeDelete',
                group: 'hm',
                order: 1
            });
            editor.addMenuItem('nodeProperties', {
                label: '节点属性',
                command: 'nodeProperties',
                group: 'hm',
                order: 2
            });

            // editor.addMenuItem('手术名称', {
            //     label: '手术名称',
            //     command: '手术名称',
            //     group: 'hm',
            //     order: 3
            // });
            // editor.addMenuItem('手术编码', {
            //     label: '手术编码',
            //     command: '手术编码',
            //     group: 'hm',
            //     order: 4
            // });
            // editor.addMenuItem('诊断名称', {
            //     label: '诊断名称',
            //     command: '诊断名称',
            //     group: 'hm',
            //     order: 5
            // });
            // editor.addMenuItem('诊断编码', {
            //     label: '诊断编码',
            //     command: '诊断编码',
            //     group: 'hm',
            //     order: 6
            // });
            // editor.addMenuItem('中医诊断名称', {
            //     label: '中医诊断名称',
            //     command: '中医诊断名称',
            //     group: 'hm',
            //     order: 7
            // });
            // editor.addMenuItem('中医诊断编码', {
            //     label: '中医诊断编码',
            //     command: '中医诊断编码',
            //     group: 'hm',
            //     order: 8
            // });
            // editor.addMenuItem('医护名称', {
            //     label: '医护姓名',
            //     command: '医护名称',
            //     group: 'hm',
            //     order: 9
            // });

            // editor.addMenuItem('insertSearch', {
            //     label: '搜索',
            //     group: 'hm',
            //     getItems: function () {
            //         return {
            //             '手术名称': CKEDITOR.TRISTATE_OFF,
            //             '手术编码': CKEDITOR.TRISTATE_OFF,
            //             '诊断名称': CKEDITOR.TRISTATE_OFF,
            //             '诊断编码': CKEDITOR.TRISTATE_OFF,
            //             '中医诊断名称': CKEDITOR.TRISTATE_OFF,
            //             '中医诊断编码': CKEDITOR.TRISTATE_OFF,
            //             '医护名称': CKEDITOR.TRISTATE_OFF
            //         };
            //     },
            //     order: 3
            // });

            editor.addMenuItem('月经', {
                label: '月经',
                command: '月经',
                group: 'hm',
                order: 10
            });

            editor.addMenuItem('胎心', {
                label: '胎心',
                command: '胎心',
                group: 'hm',
                order: 11
            });

            editor.addMenuItem('牙位', {
                label: '牙位',
                command: '牙位',
                group: 'hm',
                order: 12
            });

            editor.addMenuItem('insertExpression', {
                label: '医学表达式',
                group: 'hm',
                getItems: function () {
                    return {
                        '月经': CKEDITOR.TRISTATE_OFF,
                        '胎心': CKEDITOR.TRISTATE_OFF,
                        '牙位': CKEDITOR.TRISTATE_OFF
                    };
                },
                order: 4
            });
            editor.addMenuItem('modifyLabelContent', {
                label: '修改标题',
                command: 'modifyLabelContent',
                group: 'hm',
                order: 13
            });
            editor.addMenuItem('paperheaderBottomDashed', {
                label: '页眉线设置',
                group: 'hm',
                getItems: function () {
                    return {
                        '设为实线': CKEDITOR.TRISTATE_OFF,
                        '设为虚线': CKEDITOR.TRISTATE_OFF,
                        '取消设置': CKEDITOR.TRISTATE_OFF
                    };
                },
                order: 14
            });
            editor.addMenuItem('设为实线', {
                label: '实线',
                command: '设为实线',
                group: 'hm',
                order: 15
            });
            editor.addMenuItem('设为虚线', {
                label: '虚线',
                command: '设为虚线',
                group: 'hm',
                order: 16
            });
            editor.addMenuItem('取消设置', {
                label: '取消',
                command: '取消设置',
                group: 'hm',
                order: 17
            });

            editor.addMenuItem('引用页眉', {
                label: '引用页眉',
                command: '引用页眉',
                group: 'hm',
                order: 18
            });
            editor.addMenuItem('引用页脚', {
                label: '引用页脚',
                command: '引用页脚',
                group: 'hm',
                order: 19
            });

            editor.contextMenu.addListener(function (element, selection, path) {
                var _element = editor.contextTargetElement;//override
                var td = editor.elementPath().contains('td');
                if (td && td.hasAttribute('data-hm-node')) _element = td;
                var contextItems = {};
                if (checkCurDomReadOnly(editor)) {
                    return contextItems;
                }
                if (!_element.hasAttribute('data-hm-node')) {
                    var filteredElement = $(_element.$).parents().filter('[data-hm-node]');
                    if (filteredElement.length) {
                        _element = new CKEDITOR.dom.element(filteredElement[0]);
                    }
                }
                if (_element.type === CKEDITOR.NODE_ELEMENT && (_element.hasAttribute('data-hm-node') || _element.is('button'))) {
                    var type = _element.getAttribute('data-hm-node');
                    var name = _element.getAttribute('data-hm-name');
                    if (_element.is('button')) {
                        type = 'button';
                        name = _element.innerText;
                    }
                    if (editor.HMConfig.designMode) {
                        contextItems['nodeDelete'] = CKEDITOR.TRISTATE_OFF;
                        switch (type) {
                            case 'labelbox':
                            case 'newtextbox':
                            case 'dropbox':
                            case 'timebox':
                            case 'checkbox':
                            case 'radiobox':
                            case 'cellbox':
                            case 'searchbox':
                            case 'textboxwidget':
                            case 'button':
                                contextItems['nodeProperties'] = CKEDITOR.TRISTATE_OFF;
                                break;
                        }
                    } else {
                        // 可删除
                        if(_element.getAttribute('_deleteable') == 'true' || !name){
                            contextItems['nodeDelete'] = CKEDITOR.TRISTATE_OFF;
                        }else{
                            delete contextItems['nodeDelete'];
                        }
                    }

                }

                var $boundaryNewtextbox = editor.plugins["datasource"].getRangeBoundaryNewtextbox();
                if ($boundaryNewtextbox && $boundaryNewtextbox.length == 1) {
                    contextItems['insertSearch'] = CKEDITOR.TRISTATE_OFF;
                    contextItems['insertExpression'] = CKEDITOR.TRISTATE_OFF;
                }
                if (_element.type == CKEDITOR.NODE_ELEMENT && _element.getAttribute('data-hm-node') == 'labelbox') {
                    contextItems['modifyLabelContent'] = CKEDITOR.TRISTATE_OFF;
                }
                //只在页眉处右键菜单中显示'页眉线设置'
                if (_element.type == CKEDITOR.NODE_ELEMENT && $(_element.$).parents('[_paperheader]').length > 0) {
                    contextItems['paperheaderBottomDashed'] = CKEDITOR.TRISTATE_OFF;
                }

                if( sessionStorage.getItem('paperHeader')){
                    contextItems['引用页眉'] = CKEDITOR.TRISTATE_OFF;
                }
                if( sessionStorage.getItem('paperFooter')){
                    contextItems['引用页脚'] = CKEDITOR.TRISTATE_OFF;
                }
                return contextItems;
            });
        }

        editor.on('beforeCommandExec', function nodePropertiesInvoker1(evt) {
            switch (evt.data.command.name) {
                case 'nodeproperties':
                    editor.invoker = 'nodeproperties';
                    break;
            }
        })

        editor.on('afterCommandExec', function nodePropertiesInvoker2(evt) {
            switch (evt.data.command.name) {
                case 'nodeproperties':
                    setTimeout(function () {
                        editor.invoker = null;
                    }, 1000);
                    break;
            }
        })


        function containFixNode(editor) {
            return editor.elementPath().contains(function (node) {
                return node.type == CKEDITOR.NODE_ELEMENT && node.hasAttribute('data-hm-node')
            });
        }


        function getSelectedCells(selection) {
            var cellNodeRegex = /^(?:td|th)$/;
            if (!selection) {
                return;
            }

            var ranges = selection.getRanges();
            var retval = [];
            var database = {};

            function moveOutOfCellGuard(node) {
                // Apply to the first cell only.
                if (retval.length > 0)
                    return;

                // If we are exiting from the first </td>, then the td should definitely be
                // included.
                if (node.type == CKEDITOR.NODE_ELEMENT && cellNodeRegex.test(node.getName()) && !node.getCustomData('selected_cell')) {
                    CKEDITOR.dom.element.setMarker(database, node, 'selected_cell', true);
                    retval.push(node);
                }
            }

            for (var i = 0; i < ranges.length; i++) {
                var range = ranges[i];

                if (range.collapsed) {
                    // Walker does not handle collapsed ranges yet - fall back to old API.
                    var startNode = range.getCommonAncestor();
                    var nearestCell = startNode.getAscendant({ td: 1, th: 1 }, true);
                    if (nearestCell) {
                        retval.push(nearestCell);
                    }
                } else {
                    var walker = new CKEDITOR.dom.walker(range);
                    var node;
                    walker.guard = moveOutOfCellGuard;

                    while ((node = walker.next())) {
                        // If may be possible for us to have a range like this:
                        // <td>^1</td><td>^2</td>
                        // The 2nd td shouldn't be included.
                        //
                        // So we have to take care to include a td we've entered only when we've
                        // walked into its children.

                        if (node.type != CKEDITOR.NODE_ELEMENT || !node.is(CKEDITOR.dtd.table)) {
                            var parent = node.getAscendant({ td: 1, th: 1 }, true);
                            if (parent && !parent.getCustomData('selected_cell')) {
                                CKEDITOR.dom.element.setMarker(database, parent, 'selected_cell', true);
                                retval.push(parent);
                            }
                        }
                    }
                }
            }

            CKEDITOR.dom.element.clearAllMarkers(database);

            return retval;
        }

        function getIdenticalCellsIndex(cell, direction, table, tableMap) {
            var identicalCellsIndex = [];
            for (var x = 0; x < tableMap.length; x++) {
                for (var y = 0; y < tableMap[0].length; y++) {
                    if (cell.$ === tableMap[x][y]) {
                        switch (direction) {
                            case 'row':
                                identicalCellsIndex.push(x);
                                break;
                            case 'column':
                                identicalCellsIndex.push(y);
                                break;
                        }

                    }
                }
            }
            return identicalCellsIndex;
        }

        function applyStyleToDatasource(ele, style, size) {
            switch (style) {
                case 'bold':
                    if (ele.getStyle('font-weight')) {
                        ele.removeStyle('font-weight');
                    } else {
                        ele.setStyle('font-weight', 'bold');
                    }
                    break;
                case 'italic':
                    if (ele.getStyle('font-style')) {
                        ele.removeStyle('font-style');
                    } else {
                        ele.setStyle('font-style', 'italic');
                    }
                    break;
                case 'underline':
                    if (ele.getStyle('text-decoration')) {
                        ele.removeStyle('text-decoration');
                    } else {
                        ele.setStyle('text-decoration', 'underline');
                    }
                    break;
                case 'strike':
                    if (ele.getStyle('text-decoration')) {
                        ele.removeStyle('text-decoration');
                    } else {
                        ele.setStyle('text-decoration', 'line-through');
                    }
                    break;
                case 'subscript':
                    break;
                case 'superscript':
                    break;
                case 'copyformatting':
                    break;
                case 'removeformat':
                    ele.removeAttribute('style');
                    break;
                case 'font':
                    ele.setStyle('font-size', size + 'px');
                    break;
            }
        }

        editor.on('beforeCommandExec', function resolveData1(evt) {
            var designMode = editor.HMConfig.designMode;
            switch (evt.data.command.name) {
                case 'bold':
                case 'italic':
                case 'underline':
                case 'strike':
                case 'subscript':
                case 'superscript':
                case 'copyformatting':
                case 'removeformat':

                    var selection = editor.getSelection();
                    var ranges = selection.getRanges();
                    var range0 = ranges[0];
                    if (!range0) return false;

                    var fixNode = editor.getFixNodeWalker(range0).lastForward();
                    var parentFixNode = range0.startContainer.getAscendant(function (el) {
                        return el.getAttribute && el.getAttribute('data-hm-node');
                    }, true);
                    if (parentFixNode && parentFixNode.hasClass('new-textbox')) {
                        return true;
                    }
                    var datasource = fixNode ? fixNode : parentFixNode
                    if (datasource) {
                        applyStyleToDatasource(datasource, evt.data.command.name);
                        return false;
                    }

                    return true;
                    break;
                case 'rowdelete':
                    if (designMode == 'true') {
                        return true;
                    }
                    // var selection = editor.getSelection();
                    // var cells = getSelectedCells(selection);
                    // var table = cells[0].getAscendant('table');
                    // var tableMap = CKEDITOR.tools.buildTableMap(table);
                    // for (var c = 0; c < cells.length; c++) {
                    //     var identicalCellsIndex = getIdenticalCellsIndex(cells[c], 'row', table, tableMap);
                    //     for (var x = 0; x < identicalCellsIndex.length; x++) {
                    //         for (var y = 0; y < tableMap[0].length; y++) {
                    //             var $cell = $(tableMap[identicalCellsIndex[x]][y]);
                    //             if ($cell.find('[data-hm-node]').length > 0) {
                    //                 editor.showNotification('请先删除数据元', 'warning', 5000);
                    //                 return false;
                    //             }
                    //         }
                    //     }
                    // }
                    return true;
                    break;
                case 'columndelete':
                    if (designMode == 'true') {
                        return true;
                    }
                    // var selection = editor.getSelection();
                    // var cells = getSelectedCells(selection);
                    // var table = cells[0].getAscendant('table');
                    // var tableMap = CKEDITOR.tools.buildTableMap(table);
                    // for (var c = 0; c < cells.length; c++) {
                    //     var identicalCellsIndex = getIdenticalCellsIndex(cells[c], 'column', table, tableMap);
                    //     for (var y = 0; y < identicalCellsIndex.length; y++) {
                    //         for (var x = 0; x < tableMap.length; x++) {
                    //             var $cell = $(tableMap[x][identicalCellsIndex[y]]);
                    //             if ($cell.find('[data-hm-node]').length > 0) {
                    //                 editor.showNotification('请先删除数据元', 'warning', 5000);
                    //                 return false;
                    //             }
                    //         }
                    //     }
                    // }
                    return true;
                    break;
                case 'tabledelete':
                    if (designMode == 'true') {
                        return true;
                    }
                    // var selection = editor.getSelection();
                    // var cells = getSelectedCells(selection);
                    // var table = cells[0].getAscendant('table');
                    // var $table = $(table.$);
                    // if ($table.find('[data-hm-node]').length > 0) {
                    //     editor.showNotification('请先删除数据元', 'warning', 5000);
                    //     return false;
                    // }
                    return true;
                    break;
                case 'print':
                    var _body = editor.document.getBody();
                    var $body = $(_body.$);

                    if (editor.traceShow) { //  打印前隐藏留痕
                        editor.execCommand('trace');
                    }
                    //remove placeholder firstly
                    $body.find('[_placeholderText]').addClass('print-preview');

                    doPrintHideCascade(editor);
                    doPrintClearData(editor);

                    var datasources = _body.find('[data-hm-node]:not([class*="_paragraphHide"]');
                    for (var i = 0; i < datasources.count(); i++) {
                        var datasource = datasources.getItem(i);
                        var type = datasource.getAttribute('data-hm-node');

                        switch (type) {
                            case 'newtextbox':
                                // if(datasource.$.className.indexOf('print-hold')===-1){
                                //     $(datasource.$).removeClass('new-textbox');
                                // }
                                var $datasource = $(datasource.$).find('span.new-textbox-content');
                                if ($datasource.attr('_placeholderText')) { //有[_placeholderText]属性的span会被删除
                                    $datasource.removeAttr('_placeholderText');
                                    $datasource.html('');
                                }
                                var replacement = datasource.getAttribute('_replacement');
                                if (replacement) {
                                    $datasource.text().replace(/\u200B/g, '').length || $datasource.html(replacement);
                                }
                                var splitment = datasource.getAttribute('_splitment');
                                if (splitment) {
                                    $datasource.text().replace(/\u200B/g, '').length || $datasource.html(splitment);
                                }
                                var _minWidth = datasource.getAttribute('_minWidth');
                                if (_minWidth) {
                                    if (_minWidth.indexOf('px') >= 0) {
                                        var $widthWrapper = $('<span style=display:inline-block;min-width:' + _minWidth + '>' + '</span>');
                                        $widthWrapper.append($datasource.contents());
                                        $datasource.append($widthWrapper);
                                    } else {
                                        _minWidth = parseInt(_minWidth);
                                        var txt = $datasource.text().replace(/\u200B/g, '');
                                        var offsetTxt = "";
                                        if (txt.length < _minWidth) {
                                            var offset = _minWidth - txt.length;
                                            for (var c = 0; c < offset; c++) {
                                                offsetTxt += "\u00a0";
                                            }
                                        }
                                        $datasource.append('<span>' + offsetTxt + '</span>');
                                    }

                                }
                                if (datasource.getAttribute('_underline') == 'true') {
                                    $datasource.wrap('<span _print_underline=true></span>');
                                }
                                if (datasource.getAttribute('_color') == 'red') {
                                    $datasource.wrap('<span _print_color=red></span>');
                                }
                                break;
                            case 'timebox':
                                var $datasource = $(datasource.$);
                                var replacement = datasource.getAttribute('_replacement');
                                var timePrintFormat = datasource.getAttribute('_time_print_format');
                                var txt = $datasource.text().replace(/\u200B/g, '');
                                if (timePrintFormat && txt) {
                                    txt = formatStringDate(txt, timePrintFormat);
                                    $datasource.html(txt);
                                } else if (timePrintFormat && !txt && replacement) {
                                    txt = formatStringDate(replacement, timePrintFormat);
                                    $datasource.append('<span>' + txt + '</span>');
                                } else if (!timePrintFormat && !txt && replacement) {
                                    $datasource.append('<span>' + replacement + '</span>');
                                }
                                var _minWidth = datasource.getAttribute('_minWidth');
                                if (_minWidth) {
                                    if (_minWidth.indexOf('px') >= 0) {
                                        var $widthWrapper = $('<span style=display:inline-block;min-width:' + _minWidth + '>' + '</span>');
                                        $widthWrapper.append($datasource.contents());
                                        $datasource.append($widthWrapper);
                                    } else {
                                        _minWidth = parseInt(_minWidth);
                                        var txt = $datasource.text().replace(/\u200B/g, '');
                                        var offsetTxt = "";
                                        if (txt.length < _minWidth) {
                                            var offset = _minWidth - txt.length;
                                            for (var c = 0; c < offset; c++) {
                                                offsetTxt += "\u00a0";
                                            }
                                        }
                                        $datasource.append('<span>' + offsetTxt + '</span>');
                                    }

                                }

                                if (datasource.getAttribute('_underline') == 'true') {
                                    $datasource.wrap('<span _print_underline=true></span>');
                                }

                                break;
                            case 'dropbox':
                            case 'searchbox':
                            case 'textboxwidget':
                                var $datasource = $(datasource.$);
                                if (datasource.getAttribute('_replacement')) {
                                    var replacement = datasource.getAttribute('_replacement');
                                    var txt = $datasource.text().replace(/\u200B/g, '');

                                    if (txt == '') {
                                        $datasource.append('<span>' + replacement + '</span>');
                                    }
                                }
                                if (datasource.getAttribute('_splitment')) {
                                    var splitment = datasource.getAttribute('_splitment');
                                    var txt = $datasource.text().replace(/\u200B/g, '');
                                    if(txt.includes(splitment)){
                                        txt=txt.substring(0,txt.indexOf(splitment)) ;
                                        $datasource.html(txt);
                                    }
                                }
                                var _minWidth = datasource.getAttribute('_minWidth');
                                if (_minWidth) {
                                    if (_minWidth.indexOf('px') >= 0) {
                                        var $widthWrapper = $('<span style=display:inline-block;min-width:' + _minWidth + '>' + '</span>');
                                        $widthWrapper.append($datasource.contents());
                                        $datasource.append($widthWrapper);
                                    } else {
                                        _minWidth = parseInt(_minWidth);
                                        var txt = $datasource.text().replace(/\u200B/g, '');
                                        var offsetTxt = "";
                                        if (txt.length < _minWidth) {
                                            var offset = _minWidth - txt.length;
                                            for (var c = 0; c < offset; c++) {
                                                offsetTxt += "\u00a0";
                                            }
                                        }
                                        $datasource.append('<span>' + offsetTxt + '</span>');
                                    }

                                }

                                if (datasource.getAttribute('_underline') == 'true') {
                                    $datasource.wrap('<span _print_underline=true></span>');
                                }

                                break;
                        }
                    }

                    break;
            }
        });


        editor.on('afterCommandExec', function resolveData1(evt) {
            switch (evt.data.command.name) {
                case 'print':
                    break;
                case 'enter': //处理新文本换行空的时候，换行之后无法回删的问题
                    var selection = editor.getSelection();
                    var ranges = selection.getRanges();
                    var range0 = ranges[0];
                    if (!range0 || !range0.endPath() || !range0.endPath().lastElement) return false;
                    var ele = range0.endPath().lastElement;
                    if (ele && ele.hasClass("new-textbox-content")) {
                        ele.append(new CKEDITOR.dom.text("\u200B"));
                    }
                    break;
                case 'undo':
                case 'redo': // 撤回以后病程记录内容获焦病历左边的病历树选中状态不更新问题修复

                    break;
            }
        });

        editor.on('font', function (evt) {
            var selection = editor.getSelection();
            var ranges = selection.getRanges();
            var range0 = ranges[0];
            if (!range0) return false;
            var fixNode = editor.getFixNodeWalker(range0).lastForward();
            var parentFixNode = range0.startContainer.getAscendant(function (el) {
                return el.getAttribute && el.getAttribute('data-hm-node');
            }, true);
            if (parentFixNode && parentFixNode.hasClass('new-textbox')) {
                return true;
            }
            var datasource = fixNode ? fixNode : parentFixNode
            if (datasource) {
                applyStyleToDatasource(datasource, 'font', evt.data);
                return false;
            }
            return true;
        });

        editor.on('color', function (evt) {
            var selection = editor.getSelection();
            var ranges = selection.getRanges();
            var range0 = ranges[0];
            if (!range0) return false;
            var fixNode = editor.getFixNodeWalker(range0).lastForward();
            var parentFixNode = range0.startContainer.getAscendant(function (el) {
                return el.getAttribute && el.getAttribute('data-hm-node');
            }, true);
            if (parentFixNode && parentFixNode.hasClass('new-textbox')) {
                return true;
            }
            if (fixNode || parentFixNode) return false;
            return true;
        });

        //从外部复制黏贴时，evt.data.dataValue未被赋值
        editor.on('paste', function (evt) {
            // var orginText = evt.data.dataTransfer.getData('text/html').replace(/[\r\n]/g, '').replace(/(<)(span)(.*?)(>)/g, '$1$2$4').replace(/(<)(\/span)(.*?)(>)/g, '$1$2$4');
            if (!evt.data.dataValue) {
                evt.data.dataValue = evt.data.dataTransfer.getData('text/html').replace(/[\r\n]/g, '');
            }
            // var orginText = evt.data.dataTransfer.getData('text/html').replace(/[\r\n]/g, '');


            // // 处理图片内容, 此处需要在文件夹 %Temp%\msohtmlclip1 中启动http服务才能获取 (微软office中)带图片的富文本 中的 图片信息. 一个简单的方法:
            // // 1. 安装npm, https://nodejs.org/zh-cn/download/
            // // 2. npm install http-server -g
            // // 3. 启动http-server服务：(只对微软 office 剪切板有效)
            // // http-server -p 55555 %Temp%\msohtmlclip1
            // evt.data.dataValue = evt.data.dataValue.replace(/file:\/\/\/(.*)msohtmlclip1/g, 'http://127.0.0.1:55555');

            // 如果粘贴内容中有粗体, 则删除粗体并加上 strong 标签.
            if (/font-weight *: *bold/.exec(evt.data.dataValue.indexOf('font-weight'))) {
                var div = document.createElement('div');
                div.innerHTML = evt.data.dataValue;
                convertBoldToStrong(div);
                evt.data.dataValue = div.innerHTML;
            }

            // 如果是往新文本粘贴内容，将type重置为'text'，如果是html类型会分割新文本标签
            var currentNode = editor.clickTargetElement || (editor.elementPath() && editor.elementPath().lastElement);
            if ($(currentNode.$).hasClass('new-textbox-content') || $(currentNode.$).hasClass('new-textbox')) {
                evt.data.type = 'text';
            }
        }, null, null, 30);
        editor.on('afterInsertHtml', function (evt) {
            // 如果是往新文本插入图片，在afterInsertHtml处理被分割的新文本标签，重新组装该新文本标签
            if (editor.inserImgUuid && ($(editor.clickTargetElement.$).hasClass('new-textbox-content') || $(editor.clickTargetElement.$).hasClass('new-textbox'))) {
                var insertImgBox = $(editor.document.find('.' + editorIns.inserImgUuid).$[0]);
                var id = '';
                if ($(editor.clickTargetElement.$).hasClass('new-textbox-content')) {
                    id = $(editor.clickTargetElement.$).parent('.new-textbox').attr('data-hm-id');
                } else if ($(editor.clickTargetElement.$).hasClass('new-textbox')) {
                    id = $(editor.clickTargetElement.$).attr('data-hm-id');
                }
                var beforeEle = insertImgBox.prev("[data-hm-id=" + id + "]").children('.new-textbox-content');
                var afterEle = insertImgBox.next("[data-hm-id=" + id + "]");
                beforeEle.append(insertImgBox.clone()).append(afterEle.children('.new-textbox-content').html());
                insertImgBox.remove();
                afterEle.remove();
                editor.inserImgUuid = '';
            }

        }, null, null, 30);

        editor.on('drop', function (evt) {
            evt.stop();
        });

        editor.on('afterSetData', function (evt) {

        })

        editor.getFixNodeWalker = function (range) {
            var walker = new CKEDITOR.dom.walker(range);

            walker.evaluator = function (node) {
                return node.type == CKEDITOR.NODE_ELEMENT && (node.hasAttribute('data-hm-node') || node.hasClass('hm_revise_del'));
            };

            return walker;
        }

        function popInteractive(evt, $body, editor) {
            var element = evt.contextTarget ? evt.contextTarget : evt.data.getTarget();
            var $node = $(element.$);

            if($node.hasClass('group-table-btn')){
                // 分组表格操作
                var type = $node.attr('type');

                editor.fire('group-table-op',{type:type,table:$node.prevAll('table')[0]});
                return;
            }

            if($node.hasClass('new-textbox')){
                $node = $node.find('span.new-textbox-content');
            }
            var _texttype = $node.attr('_texttype');
            if ($node.hasClass('new-textbox-content') && (_texttype == '诊断' || _texttype == '手术' || _texttype == '下拉')) {
                if (editor.readOnly) {
                    return
                }
                interactOnText(editor,$node,false);
                return;
            }
            var type = element.getAttribute('data-hm-node');

            var $div = $('#interactDiv');
            var $iframe = $('iframe');

            $div.css('display', 'none');
            $div.css('width', 'unset');
            $div.css('height', 'unset');
            $div.css('z-index', 'unset');
            $div.empty();

            if (element.is('span') && type && (type == 'timebox' || type == 'dropbox' || type == 'searchbox' || type == 'expressionbox' || type == 'labelbox')) {
                var $node = $(element.$);
                switch (type) {
                    case 'timebox':
                        interactOnTimebox($node);
                        break;
                    case 'dropbox':
                        interactOnDropbox($node);
                        break;
                    case 'searchbox':
                        interactOnSearchbox($node);
                        setTimeout(function () {
                            $div.find('#interact-search')[0].focus();
                        }, 500)
                        break;
                    case 'expressionbox':
                        interactOnExpressionbox($node);
                        break;
                    case 'labelbox':
                        interactOnLabelbox($node);
                        break;
                }

                setTimeout(function () {

                    var divTop = $node.offset().top - $($node[0].ownerDocument).scrollTop() + $iframe.offset().top;
                    var divLeft = $node.offset().left - $($node[0].ownerDocument).scrollLeft() + $iframe.offset().left;

                    $div.css('top', 0);
                    $div.css('left', 0);
                    $div.css('display', 'block');

                    if ((divTop - $div.height() >= $iframe.offset().top) && ($iframe.height() - $div.height() < divTop - $iframe.offset().top)) { // modify By liwenjuan 处理顶部日期组件确定按钮覆盖问题
                        $div.css('top', divTop - $div.height());
                    } else {
                        $div.css('top', divTop + $node.height());
                    }
                    if ($iframe.width() - $div.width() < divLeft) {
                        $div.css('left', divLeft - $div.width());
                    }
                    else {
                        $div.css('left', divLeft);
                    }
                }, 100);
            }

        }

        editor.on('contentDom', function () {
            var editable = editor.editable();

            editable.on('cut', function (evt) {
                var selection = editor.getSelection();
                var ranges = selection.getRanges();
                var range0 = ranges[0];
                if (!range0) return;
                var designMode = editor.HMConfig.designMode;
                if (designMode != 'true' && (editor.readOnly || range0.checkReadOnly())) { // 不可编辑区域不支持剪贴
                    editor.showNotification('当前内容不可编辑，不支持剪贴', 'warn');
                    evt.stop();
                    evt.data.preventDefault();
                    return;
                }
                var tags = ['tr', 'td', 'th', 'tbody', 'thead', 'table', 'div'];
                if ((range0.startContainer.$.nodeType === 1 && tags.indexOf(range0.startContainer.getName()) > -1) || (range0.endContainer.$.nodeType === 1 && tags.indexOf(range0.endContainer.getName()) > -1)) {
                    evt.stop();
                    evt.data.preventDefault();
                    return;
                }
                editor.document.$.execCommand('copy', false, null);

                var fixNode = editor.getFixNodeWalker(range0).lastForward();
                if (!fixNode) {
                    range0.deleteContents();
                }

                evt.stop();
                evt.data.preventDefault();
            });

            editable.attachListener(editable, 'keyup', function keyup1(evt) {
                var selection = editor.getSelection();
                var ranges = selection.getRanges();
                var range0 = ranges[0];
                if (!range0) return;
                var keyCode = evt.data.$.code;
                // 选区选到末尾删除时，有可能将零宽删掉，补一个零宽进去
                if ($(evt.data.$.target).hasClass("new-textbox-content") && (keyCode === 'Backspace' || keyCode === 'Delete') && !range0.endContainer.getNext()) {
                    if (range0.endContainer.type === CKEDITOR.NODE_TEXT && range0.endOffset === range0.endContainer.getLength()) {
                        evt.data.$.target.append('\u200b');
                    }
                }
            });

            // 每次 editor 启动的时候会初始化4个 editor, 而且似乎初始化是乱序的, 故不能使用 static 函数.
            // 是我菜了, editor.plugins 是全局指针引用而不是 每次初始化 editor 就 new() 一个.
            editor.plugins.datasource.onKeyDownFunc = function (evt, editor) {
                var selection = editor.getSelection();
                var ranges = selection.getRanges();
                var range0 = ranges[0];
                if (!range0) return;
                var keyCode = evt.data.$.code;
                var functionalKey = false;
                if (evt.data.$.ctrlKey) {
                    functionalKey = true;
                }
                switch (keyCode) {
                    // case 'KeyC':
                    // case 'KeyZ':
                    case 'ArrowLeft':
                    case 'ArrowRight':
                    case 'ArrowUp':
                    case 'ArrowDown':
                    case 'Tab':
                    case 'ControlLeft':
                    case 'ControlRight':
                        functionalKey = true;
                        break;
                    case 'Enter': //处理新文本换行以及内容保存后到数据元 之外，以及多出数据元问题
                    case 'NumpadEnter':
                        var lastElement = range0.endPath().lastElement;
                        if (lastElement.getAscendant("span", true) || lastElement.getAscendant("ins", true)) {
                            editor.setActiveEnterMode(2, 2);
                            CKEDITOR.env.needsBrFiller = false;
                        } else {
                            editor.setActiveEnterMode(1, 2);
                            CKEDITOR.env.needsBrFiller = true;
                        }
                }

                if (keyCode == 'Backspace') {
                    if (editor.readOnly || range0.checkReadOnly()) {
                        //360浏览器选区不可删除情况下backspace禁止网页回退
                        evt.stop();
                        evt.data.preventDefault();
                        return;
                    }
                    //删除的文本如果是小模板内最后一个文字，连span元素一并删除
                    var element = range0.startContainer;
                    if (element && element.type == CKEDITOR.NODE_TEXT) {
                        element = element.getParent();
                    }
                    if (element && element.getAttribute('parttemplate') === 'true' && keyCode === 'Backspace' && element.getText().replace(/\u200B/g, '').length === 1) {
                        element.remove();
                        evt.stop();
                        evt.data.preventDefault();
                        return;
                    }
                    var _fixNode = editor.getFixNodeWalker(range0).lastForward();
                    if (!_fixNode) {
                        var curNode = range0.startContainer;
                        while (curNode && curNode.getText().replace(zeroWidthChar, '').length == 0 && curNode.type === CKEDITOR.NODE_TEXT) {
                            curNode = curNode.getPrevious();
                        }
                        if (curNode && curNode.type == CKEDITOR.NODE_ELEMENT && !curNode.hasClass('new-textbox-content')) {
                            _fixNode = curNode;
                        }
                    }
                    if (_fixNode && ((_fixNode.hasAttribute('_deleteable') && _fixNode.hasAttribute('data-hm-node')) || ($(_fixNode.$).find("[data-hm-node='textboxwidget']").length > 0 && $(_fixNode.$).find("[data-hm-node='textboxwidget']").attr('_deleteable') == 'true'))) {
                        _fixNode.remove();
                        return;
                    }
                }

                var fixNode = editor.getFixNodeWalker(range0).lastForward();
                if (!fixNode && ranges.length >= 1 && ranges[0].startContainer.is && ranges[0].startContainer.is('tr')) {
                    for (var i = ranges.length - 1; i >= 0; i--) {
                        var container = ranges[i].startContainer;
                        var nodes = container.find('[data-hm-node]');
                        if (nodes.count() >= 1) {
                            fixNode = nodes.getItem(0);
                            break;
                        }
                    }
                }
                if (fixNode && !functionalKey) {
                    var cursorNode = new CKEDITOR.dom.text('\u200B');
                    if (fixNode.getAttribute('data-hm-node') !== 'textboxwidget') {
                        cursorNode.insertAfter(fixNode);
                    } else {
                        var fixWidget = fixNode.getAscendant(function (el) {
                            return el.getAttribute && el.getAttribute('data-cke-widget-wrapper');
                        });
                        fixWidget && cursorNode.insertAfter(fixWidget);
                    }
                    range0.moveToPosition(cursorNode, CKEDITOR.POSITION_BEFORE_END);
                    range0.select();
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }

                if (fixNode && keyCode === 'KeyV') {
                    editor.showNotification('禁止跨数据元粘贴', 'error');
                    evt.stop();
                    evt.data.preventDefault();
                    return false;
                }

                //低版本浏览器长按删除键会删除单标签或者生成两个新文本标签
                // ↑ chrome68, 且只能屏蔽短按删除操作. 因为 CKeditor 在未开启输入法时长按任意键到一定次数会触发一个 type 事件, 需要去那边再处理一次.
                if ($(evt.data.$.target).hasClass("new-textbox-content") && range0.collapsed) {
                    // 删除后面的内容
                    // 删除前面的内容
                    if (keyCode === 'Backspace' && !range0.startContainer.getPrevious()) {

                        if (range0.startContainer.type === CKEDITOR.NODE_TEXT && range0.startOffset === 0) {
                            //     evt.stop();
                            //     evt.data.preventDefault();
                            //     var newText = new CKEDITOR.dom.text('\u200B');
                            //     range0.insertNode(newText);
                            //     range0.moveToPosition(newText, CKEDITOR.POSITION_BEFORE_END);
                            //     range0.select();
                            range0.startContainer.setText('\u200B' + range0.startContainer.getText());
                            range0.startOffset = Math.min(range0.startContainer.getLength(), 1 + range0.startOffset);
                            range0.endOffset = Math.max(range0.startOffset, range0.startOffset);
                            range0.select();
                        } else if (range0.startContainer.type === CKEDITOR.NODE_ELEMENT && range0.startOffset === 0) {
                            if (!range0.startContainer.getPrevious()) {
                                evt.stop();
                                evt.data.preventDefault();
                            }
                        }
                    } else if (keyCode === 'Delete' && !range0.startContainer.getNext()) {
                        if ((range0.endContainer.type === CKEDITOR.NODE_TEXT && range0.endOffset === range0.startContainer.getLength()) ||
                            (range0.endContainer.type === CKEDITOR.NODE_ELEMENT && range0.endOffset === range0.startContainer.getChildCount())) {
                            // 找之后有没有字符, 如果没有就必须加一个.
                            var newBox = evt.data.$.target;
                            var parent = range0.endContainer;
                            while (parent.$ !== newBox) {
                                var next = parent.getNext();
                                if (next && (next.type === CKEDITOR.NODE_ELEMENT || (next.type === CKEDITOR.NODE_TEXT && next.getText().length))) {
                                    break;
                                }
                                parent = parent.getParent();
                            }
                            if (parent.$ === newBox) {
                                parent.append(new CKEDITOR.dom.text('\u200B'));
                            }

                            evt.stop();
                            evt.data.preventDefault();
                            // range0.endContainer.getLast().$.data += '\u200B';
                        }
                    }
                }

                var $boundaryNewtextbox = editor.plugins["datasource"].getRangeBoundaryNewtextbox();
                if ($boundaryNewtextbox) {
                    evt.container = new CKEDITOR.dom.element($boundaryNewtextbox[0]).getAscendant({ td: 1, p: 1, div: 1 });
                    editable.fire('togglePlaceHolder', evt);
                    // 如果是数字控件的数据元，则只能输入数字
                    var precision = $boundaryNewtextbox.attr('_precision');
                    if (precision) {
                        var key = evt.data.$.key;
                        if (!isNumber(key) && key != '.' && key != 'Backspace' && key != 'Delete' && key != 'ArrowLeft' && key != 'ArrowRight') {
                            evt.stop();
                            evt.data.preventDefault();
                        }
                    }
                }

                function isNumber(val) {
                    return /^[0-9]+.?[0-9]*$/.test(val);
                }

            };

            editable.attachListener(editable, 'contextmenu', function (evt) {
                var $div = $('#interactDiv');
                if($div){
                    // 右键，有弹框先隐藏
                    $div.hide();
                }
                var _element = evt.data.getTarget();
                var type = _element && _element.getParent() && _element.getParent().getAttribute('data-hm-node');

                if (type === 'checkbox' || type === 'radiobox') {
                    editor.contextTargetElement = _element.getParent();
                }
                else {
                    editor.contextTargetElement = _element;
                }

            }, null, null, -1);

            // editable.attachListener(editable, 'click', function (evt) {
            //     // 点击到 placeholder 中时, 将光标挪到 placeholder 的末尾
            //     evt.data && (evt.data.name = 'click');
            //     editable.fire('togglePlaceHolder', evt.data);
            // }, null, null, 999);

            // 预防某些操作过后选区丢失
            editor.on('selectionCheck', function cacheRanges(evt) {
                var selectionRange = editor.getSelection().getRanges();
                if (selectionRange.length) {
                    editor.cachedSelectionRange = selectionRange;
                }
            }, null, null, 999);

            // 如果选到 placeholder 中, 则把选区挪到 placeholder 的末尾
            editor.on('selectionCheck', function moveToEndOfPlaceholder(evt) {
                var selection = editor.getSelection();
                var range = selection.getRanges();
                if (range.length > 1) {
                    return;
                }
                range = range[0];

                var endOffset = range.startOffset;
                var startContainer = range.startContainer;
                var endContainer = range.endContainer;
                // 有时候选区会选到新文本的 #text 里面.
                if (startContainer.type !== CKEDITOR.NODE_ELEMENT) {
                    startContainer = startContainer.getParent();
                    endOffset = -1;
                }
                if (endContainer.type !== CKEDITOR.NODE_ELEMENT) {
                    endContainer = endContainer.getParent();
                }

                var scf = startContainer.getFirst();
                // 处理选区在 placeholder 中的情况
                if (startContainer.$ === endContainer.$ &&
                    startContainer.getAttribute('_placeholdertext') === 'true' &&
                    (0 !== endOffset && !(scf.$.data[0] === "\u200B" && (1 === range.startOffset))) &&
                    startContainer.getHtml().length) {
                    evt.stop();
                    if (startContainer.getParent().hasClass('new-textbox')) {
                        // 新文本聚焦时在placeholder前面添加零宽占位符
                        if (!zeroWidthChar.test(scf.$.data[0])) {
                            scf.$.data = "\u200B" + scf.$.data;
                        }
                        range.setStart(scf, 1);
                        range.collapse(true);
                        // range.moveToPosition(startContainer.getFirst(), CKEDITOR.POSITION_BEFORE_START);

                    } else {
                        // 老文本
                        cursorNode = startContainer.getPrevious();
                        if (cursorNode.type !== CKEDITOR.NODE_TEXT) {
                            cursorNode = new CKEDITOR.dom.text('\u200B');
                            cursorNode.insertBefore(startContainer);
                        }
                        range.moveToPosition(cursorNode, CKEDITOR.POSITION_BEFORE_START);
                    }
                    // range.setEndAfter(startContainer.getLast());
                    // range.setStartAfter(startContainer.getLast());
                    selection.selectRanges([range]);
                }
                // 部分新文本没有 placeholder 和 new-textbox-content, 给他加上
                else if (startContainer.hasClass('new-textbox') &&
                    !startContainer.$.firstElementChild &&
                    !startContainer.getText().replace(zeroWidthChar, '').length) {
                    if (boundedNodeByPagebreak(editor, startContainer.$).length) {
                        return;
                    }
                    var newtextPlaceholder = new CKEDITOR.dom.element('span');
                    newtextPlaceholder.addClass('new-textbox-content');
                    startContainer.getAttribute('_placeholder') && newtextPlaceholder.setAttribute('_placeholderText', true);
                    newtextPlaceholder.setAttribute('contentEditable', 'true');
                    newtextPlaceholder.setText(startContainer.getAttribute('_placeholder'));
                    startContainer.setHtml('');
                    startContainer.append(newtextPlaceholder);
                    range.moveToPosition(startContainer.getFirst(), CKEDITOR.POSITION_BEFORE_START);
                    selection.selectRanges([range]);
                }
                // 如果非编辑模式点击位置在右括号的右边且右括号右边无内容, 则选进去
                else if (editor.HMConfig.designMode !== 'true' && range.collapsed && range.startContainer.type === CKEDITOR.NODE_TEXT) {
                    var bracket = range.startContainer.getPrevious();
                    var afterBracket = range.startContainer;
                    var strings = '';
                    while (afterBracket && afterBracket.type === CKEDITOR.NODE_TEXT && !strings.length) {
                        strings += afterBracket.getText().replace(zeroWidthChar, '');
                        afterBracket = afterBracket.getNext();
                    }
                    var lastChar;
                    if (!strings.length && bracket && bracket.type === CKEDITOR.NODE_ELEMENT) {
                        if (bracket.hasClass('new-textbox')) {
                            // 新数据元
                            evt.stop();

                            lastChar = bracket.getLast();
                            while (lastChar && lastChar.type !== CKEDITOR.NODE_TEXT) {
                                lastChar = lastChar.getLast();
                            }
                            // 新数据元中, 最后一个字变成 br 会导致最后的换行删不动, 所以要加零宽字符
                            if (!lastChar) {
                                lastChar = new CKEDITOR.dom.text('\u200B');
                                lastChar.appendTo(bracket.getLast());
                                range.moveToPosition(lastChar, CKEDITOR.POSITION_AFTER_START);
                            } else if (lastChar.getText().replace(zeroWidthChar, '').length) {
                                range.moveToPosition(lastChar, CKEDITOR.POSITION_BEFORE_END);
                            } else {
                                range.moveToPosition(lastChar, CKEDITOR.POSITION_AFTER_START);
                            }
                            selection.selectRanges([range]);
                        }
                    }
                }
            }, null, null, -999);

            editable.attachListener(editable, 'togglePlaceHolder', function (evt) {
                // 当 editor 初始化了多个时, 需要重定向 editor.
                var parentEvt = evt;
                while (parentEvt.sender && parentEvt.sender.editor) {
                    editor = parentEvt.sender.editor;
                    parentEvt = parentEvt.data;
                }

                var txt, $boundaryNewtextbox, container, selection, range0, cursorNode, $pairRight, $paireContents,
                    $placeholder, placeholder, $boundaryPairLeft, datasourcePlugin = editor.plugins.datasource, key,
                    keyCode;
                if (editor.readOnly) {
                    return
                }
                if (evt.data.showAllPlaceholder) {
                    container = editor.document.getBody();
                } else if (evt.data.container) {
                    container = evt.data.container;
                } else {
                    var element = (evt.data.getTarget) ? (evt.data.getTarget()) : editable.editor.getSelection().getRanges()[0].startContainer;
                    if (element.type == CKEDITOR.NODE_TEXT) {
                        element = element.getParent();
                    }
                    container = element.getAscendant({ td: 1, p: 1, div: 1 }, true);
                }
                // 删除完所有字符后, 需要恢复占位符.
                var addPlaceHolderFlag = false;
                var composing = false;
                // region 事件溯源
                var eventName = evt.data && evt.data.name;

                keyCode = null;
                key = {};
                switch (eventName) {
                    case 'keydown':
                        keyCode = evt.data.data && evt.data.data.$ && evt.data.data.$.keyCode;
                        key = evt.data.data && evt.data.data.$ || {};
                        // 输入法取消输入
                        if (keyCode === 229) {
                            if (key.code === 'Escape') {
                                addPlaceHolderFlag = true;
                            } else {
                                // 360 浏览器在输入法输入的时候不会在文本中添加拼音字母, 此时不能添加 placeholder.
                                composing = true;
                            }
                        }
                        break;
                    case 'type':
                        keyCode = evt.data.keyCode;
                        break;
                    case 'paste':
                        // 粘贴空文本时不处理; 但是如果有其他什么注释之类的话就不好使了
                        if (!evt.data.data.dataValue.replace(zeroWidthChar, '').length) {
                            addPlaceHolderFlag = true;
                        }
                }

                switch (keyCode) {
                    case 9:
                    case 12:
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20:
                    case 27:
                    case 33:
                    case 34:
                    case 35:
                    case 36:
                    case 37:
                    case 38:
                    case 39:
                    case 40:
                    case 45:
                    case 91:
                    case 92:
                    case 93:
                    case 112:
                    case 113:
                    case 114:
                    case 115:
                    case 116:
                    case 117:
                    case 118:
                    case 119:
                    case 120:
                    case 121:
                    case 122:
                    case 123:
                    case 144:
                    case 145:
                    case 224:
                        console.log('不响应取消数据元占位符的键盘操作: ' + (key.key || 'keyCode:' + keyCode));
                        return;
                }
                if(keyCode == 46||keyCode == 8){//删除 特殊处理
                    if(container.find('.doc-warn-hodler').$.length){
                        container.find('.doc-warn-hodler').remove();
                    }
                }
                if ((key.shiftKey || key.altKey || key.ctrlKey || key.metaKey) &&
                    !(key.ctrlKey && key.key.toLowerCase() === 'v')) {
                    console.log('不响应取消数据元占位符的键盘操作.');
                    return;
                }
                // endregion


                if (evt.data.showAllPlaceholder) {
                    var DEFAULT_PLACEHOLDER = '-';
                    // 初始化所有placeholder（默认-）
                    var showAll = function ($body) {
                        //新文本
                        showNewTextBox($body.find('[data-hm-node=newtextbox]'));
                        //时间文本
                        showTimeBox($body.find('[data-hm-node="newtextbox"][_texttype="时间文本"]'));
                    }

                    var showNewTextBox = function ($eles) {
                        var l = $eles.length;
                        for (var i = 0; i < l; i++) {
                            var $newText = $($eles[i]);
                            var $placeHolder = $($newText.children('span.new-textbox-content')[0]);
                            var placeHolder = $newText.attr('_placeholder');

                            if ($placeHolder) {
                                if (($placeHolder.text() || '').replace(zeroWidthChar, '').length == 0 && $placeHolder.children().length == 0) {
                                    $placeHolder.text(placeHolder || DEFAULT_PLACEHOLDER);
                                    $placeHolder.attr('_placeholdertext', 'true');
                                }
                            }
                            if (!placeHolder) {
                                $newText.attr('_placeholder', DEFAULT_PLACEHOLDER);
                            }

                        }
                    }
                    var showTimeBox = function ($eles) {
                        showNewTextBox($eles);
                    }
                    if (container) {
                        showAll($(container.$));
                    }
                    return;
                }



                // 新文本处理
                var $newtextboxs = container && $(container.$).find('.new-textbox');
                if ($newtextboxs && $newtextboxs.length > 0) {
                    $boundaryNewtextbox = datasourcePlugin.getRangeBoundaryNewtextbox()||evt.data.$boundaryNewtextbox;
                }
                if ($boundaryNewtextbox && $boundaryNewtextbox.length > 0) {
                    $placeholder = $boundaryNewtextbox.first().children(":first");
                    if ($placeholder.hasClass("new-textbox-content")) {
                        if ($placeholder.attr("_placeholdertext") === "true"||$placeholder.find('.r-model-gen-remark').length) {
                            if (!hidePlaceHolder($placeholder, editor.document.getBody())) {
                                return;
                            }
                            var lastPlaceholder = $placeholder[0].lastChild;
                            // 删除 placeholder
                            if (eventName === 'click') {
                                // 点击事件不删除 placeholder
                            } else if ((eventName === 'keydown' || eventName === 'type') &&
                                (keyCode === $.ui.keyCode.DELETE || keyCode === $.ui.keyCode.BACKSPACE)) {
                                if ($boundaryNewtextbox.attr('_deleteable') === 'true') {
                                    $boundaryNewtextbox.remove();
                                    selection = editor.getSelection();
                                    range0 = selection.getRanges()[0];
                                    var newText = new CKEDITOR.dom.text('\u200B');
                                    range0.insertNode(newText);
                                    range0.moveToPosition(newText, CKEDITOR.POSITION_BEFORE_END);
                                    range0.select();
                                    console.log('删除新文本数据元');
                                    return;
                                }
                                console.log('防止删除 placeholder');
                                // 这一句是必要的, 防止删除 placeholder, 虽然我也不知道为啥这样写就行
                                lastPlaceholder &&
                                    lastPlaceholder.nodeType === CKEDITOR.NODE_TEXT &&
                                    (lastPlaceholder.data = $boundaryNewtextbox.attr('_placeholder'));
                            } else {
                                $placeholder.removeAttr('_placeholdertext');
                                if (lastPlaceholder && lastPlaceholder.nodeType === CKEDITOR.NODE_TEXT) {
                                    lastPlaceholder.data = lastPlaceholder.data.replace(zeroWidthChar, '');
                                    lastPlaceholder.data = lastPlaceholder.data.substr(0, lastPlaceholder.data.length - $placeholder.parent().attr('_placeholder').length).replace(zeroWidthChar, '');
                                }else if($(lastPlaceholder).hasClass('r-model-gen-remark')){
                                    $(lastPlaceholder).remove();
                                }
                                if (eventName === 'paste') {
                                    selection = editor.getSelection();
                                    range0 = selection.getRanges()[0];
                                    range0.moveToPosition(new CKEDITOR.dom.element($placeholder[0]), CKEDITOR.POSITION_BEFORE_END);
                                    selection.selectRanges([range0]);
                                }

                                // chrome68 光标会在括号前面
                                $placeholder.append('\u200b');
                            }
                        } else {
                            // 当没有 placeholder 时判断内容是否为空, 为空时加 placeholder
                            addPlaceHolderFlag = true;
                        }
                    }
                    if (addPlaceHolderFlag && !composing) {
                        $newtextboxs.each(function () {
                            var $newtextbox = $(this);
                            placeholder = $newtextbox.attr('_placeholder');
                            var newTextBox = $newtextbox.children('span.new-textbox-content')[0];
                            var placeholdertext = $(newTextBox).attr('_placeholdertext')
                            if (newTextBox) {
                                var len = $newtextbox.find('[data-hm-node="searchbox"]').length + $newtextbox.find('[data-hm-node="expressionbox"]').length;
                                var addPlaceHolderNew = function () {
                                    txt = $(newTextBox).html().replace(zeroWidthChar, '');
                                    if (!txt.length && len === 0 && !placeholdertext) {
                                        if (boundedNodeByPagebreak(editor, newTextBox).length) {
                                            // $(newTextBox).removeClass('has-br');
                                            return;
                                        }
                                        if($(newTextBox).attr('generate')==1 && window.WinDocModelObj && window.WinDocModelObj.generator){
                                            window.WinDocModelObj.generator.generateRemark($(newTextBox));
                                        }else{
                                            placeholder = placeholder || '';
                                            $(newTextBox).text("\u200B" + placeholder);
                                            $(newTextBox).attr('_placeholdertext', 'true');
                                        }

                                    }
                                }
                                addPlaceHolderNew();
                                // chrome 下输入法输入时会在元素上留下字母. 按 esc 之后字母没有第一时间删除, 所以要等会再判断一次
                                if (keyCode === 229 && !composing) {
                                    setTimeout(function () {
                                        addPlaceHolderNew();
                                    }, 0);
                                }
                            }
                        });
                    }
                }
            });

            editable.attachListener(editable, 'click', function switchSelectedStatus(evt) {
                var element = evt.data.getTarget();
                var type = element.getAttribute('data-hm-node');
                var name = element.getAttribute('data-hm-name');
                var selection = editor.getSelection();
                var ranges = selection.getRanges();
                var range0 = ranges[0] || new CKEDITOR.dom.range(editor.document);
                if (editor.HMConfig.designMode) {
                    if($(element.$).hasClass('new-textbox')||$(element.$).hasClass('new-textbox-content')){
                        // 如果是数据元，禁用horizontalrule按钮
                        editor.getCommand('horizontalrule').setState(CKEDITOR.TRISTATE_DISABLED);
                    } else {
                        // 如果不是数据元，启用horizontalrule按钮
                        editor.getCommand('horizontalrule').setState(CKEDITOR.TRISTATE_OFF);
                    }
                }
                // 只读模式下新文本获焦可输入问题修复
                if (editor.readOnly && $(element.$).parents().hasClass('new-textbox')) {
                    // range0.moveToPosition(element, CKEDITOR.POSITION_AFTER_END);
                    // range0.select();
                    $(element.$).attr('contenteditable', 'false');
                    return;
                }
                if (type === 'labelbox' && element.getParent()) {
                    if (element.getParent().getAttribute('data-hm-node') === 'checkbox') {
                        element = element.getPrevious();
                        type = 'checkbox';
                    } else if (element.getParent().getAttribute('data-hm-node') === 'radiobox') {
                        element = element.getPrevious();
                        type = 'radiobox';
                    }
                }
                switch (type) {
                    case 'checkbox':
                        if (element.getHtml().includes('&nbsp;')) {
                            return;
                        }
                        if (editor.readOnly) {
                            return
                        }
                        if (element.hasAttribute('_selected')) {
                            element.removeAttribute('_selected');
                            element.removeClass('fa-check-square-o');
                            element.addClass('fa-square-o');
                        } else {
                            element.setAttribute('_selected', true);
                            element.removeClass('fa-square-o');
                            element.addClass('fa-check-square-o');
                        }
                        _handleRelevance($(element.$).parent());
                        break;
                    case 'radiobox':
                        if (editor.readOnly) {
                            return
                        }
                        if (element.getHtml().includes('&nbsp;')) {
                            return;
                        }
                        var radioContainer = element.getParent();
                        var _radioSelectType = radioContainer.getAttribute('_radio_select_type') || '1'; // 默认必选
                        if ('0' == _radioSelectType && element.getAttribute('_selected')) {
                            element.removeAttribute('_selected');
                            element.removeClass('fa-dot-circle-o');
                            element.addClass('fa-circle-o');
                        } else {
                            var siblings = radioContainer.find('[data-hm-node]');
                            for (var i = 0; i < siblings.count(); i++) {
                                var sibling = siblings.getItem(i);
                                if (sibling.getAttribute('data-hm-node') == type
                                    && sibling.getAttribute('data-hm-name') == name) {
                                    sibling.removeAttribute('_selected');
                                    sibling.removeClass('fa-dot-circle-o');
                                    sibling.addClass('fa-circle-o');
                                }
                            }
                            element.setAttribute('_selected', 'true');
                            element.removeClass('fa-circle-o');
                            element.addClass('fa-dot-circle-o');
                        }
                        _handleRelevance($(element.$).parent());
                        break;
                    default:
                        // 鼠标点到括号上拖动的话不能重置选区 (或者可以把选区更改逻辑挪到 mousedown 事件中)
                        if (element.hasClass('new-textbox') && range0.collapsed) {
                            var newTextBoxContent = element.find('>.new-textbox-content');
                            // 部分新文本没有 placeholder 和 new-textbox-content, 给他加上
                            var newTbCount = newTextBoxContent.count();
                            if (newTbCount) {
                                // 如果 newTextBoxContent 数量大于1, 则将其合并
                                if (newTbCount > 1) {
                                    var firstPlaceholder = newTextBoxContent.getItem(0);
                                    var secondPlaceholder;
                                    for (var i = 1; i < newTbCount; i++) {
                                        secondPlaceholder = newTextBoxContent.getItem(i);
                                        // 先尝试合并这两个元素 (如果有对应的分页连接符的话), 成功合并会删除第二个节点
                                        CKEDITOR.plugins.pagebreakCmd && CKEDITOR.plugins.pagebreakCmd.combineFormat(editor, secondPlaceholder.$, true);
                                        // 若未成功合并, 则复制 html 代码
                                        if (secondPlaceholder.getParent()) {
                                            while (secondPlaceholder.getFirst()) {
                                                firstPlaceholder.append(secondPlaceholder.getFirst());
                                            }
                                            // 合并 class
                                            secondPlaceholder.$.className.split(' ').forEach(function (item) {
                                                firstPlaceholder.addClass(item);
                                            });
                                            // 移除元素
                                            secondPlaceholder.remove();
                                        }
                                    }
                                    debugger
                                }
                                var zeroWidthChild;
                                newTextBoxContent = newTextBoxContent.getItem(0);
                                // 判断选区是在左括号还是右括号
                                if (!range0.startContainer || element.$ === range0.startContainer.getParent().$) {
                                    // 左括号, 挪到第一个零宽字符的后面
                                    zeroWidthChild = newTextBoxContent.getFirst();
                                    if (!zeroWidthChild) {
                                        zeroWidthChild = new CKEDITOR.dom.text('\u200B');
                                        newTextBoxContent.append(zeroWidthChild);
                                    } else if (zeroWidthChild.type !== CKEDITOR.NODE_TEXT) {
                                        zeroWidthChild = new CKEDITOR.dom.text('\u200B').insertBefore(zeroWidthChild);
                                    } else if (!zeroWidthChar.test(zeroWidthChild.$.data[0])) {
                                        zeroWidthChild.$.data = '\u200B' + zeroWidthChild.$.data;
                                    }
                                    range0.setStart(zeroWidthChild, 1);
                                    range0.setEnd(zeroWidthChild, 1);
                                    range0.select();
                                } else if (range0.startContainer.type === CKEDITOR.NODE_TEXT || element.$ === range0.startContainer.getPrevious().$) {
                                    // 右括号, 挪到最后一个零宽字符的前面
                                    zeroWidthChild = newTextBoxContent.getLast();
                                    if (!zeroWidthChild || zeroWidthChild.type !== CKEDITOR.NODE_TEXT) {
                                        zeroWidthChild = new CKEDITOR.dom.text('\u200B');
                                        newTextBoxContent.append(zeroWidthChild);
                                    } else if (!zeroWidthChar.test(zeroWidthChild.$.data[zeroWidthChild.$.data.length - 1])) {
                                        zeroWidthChild.$.data = zeroWidthChild.$.data + '\u200B';
                                    }
                                    range0.setStart(zeroWidthChild, zeroWidthChild.$.data.length - 1);
                                    range0.setEnd(zeroWidthChild, zeroWidthChild.$.data.length - 1);
                                    range0.select();
                                }
                            } else {
                                if (boundedNodeByPagebreak(editor, element.$).length) {
                                    break;
                                }
                                newTextBoxContent = new CKEDITOR.dom.element('span');
                                newTextBoxContent.addClass('new-textbox-content');
                                newTextBoxContent.setAttribute('contentEditable', 'true');
                                if (element.$.firstElementChild || element.getText().replace(zeroWidthChar, '').length) {
                                    newTextBoxContent.setText(element.getText());
                                } else {
                                    if (!element.getAttribute('_placeholder')) {
                                        element.setAttribute('_placeholder', '　');
                                    }
                                    newTextBoxContent.setAttribute('_placeholderText', true);
                                    newTextBoxContent.setText(element.getAttribute('_placeholder'));
                                }
                                element.setHtml('\u200B');
                                element.append(newTextBoxContent);
                                range0.moveToPosition(newTextBoxContent, CKEDITOR.POSITION_AFTER_START);
                                range0.select();
                            }
                        }
                        break;
                }
            });

            // editable.attachListener(editable, 'mousemove', function (evt) {
            //     var node = $(document).find('.tip-box');
            //     if (node && node.length) {
            //         node.remove();
            //     }
            //     var data = evt.data;
            //     var target = data.getTarget();
            //     if (!target.hasClass('new-textbox-content')) {
            //         return;
            //     }
            //     if (target.getAttribute('_placeholdertext') == 'true') {
            //         return;
            //     }
            //     var table = target.$.closest('table');
            //     if (!$(table).hasClass('table3')) {
            //         return;
            //     }
            //     var left = data.$.clientX;
            //     var top = data.$.clientY + 30;
            //     var tip = document.createElement('div');
            //     tip.style.cssText = "position:fixed;z-index:1000;max-width:200px;padding:2px;border-radius:5px;background:white;border:1px solid #bcbcbc;top:" + top + "px;left:" + left + "px";
            //     tip.className = 'tip-box';
            //     tip.textContent = target.getText();
            //     document.body.appendChild(tip);
            // });

            editable.attachListener(editable, 'click', function (evt) {
                if (editor.readOnly) {
                    return
                }
                var element = evt.data.getTarget();
                // 标记点击的当前元素，用于粘贴时区分新文本
                editor.clickTargetElement = element;
                if (element.is('span') && element.getAttribute('data-hm-node') == 'labelbox') {
                    var templatename = element.getAttribute('_templatename');


                    return;//label不支持点击响应
                }            
                popInteractive(evt, $(editable.$), editor);

                checkContentListener(editor,evt,element.$);
                // 文本内容校验
                // if ($(element.$).attr('_precision')) {//如果是数字控件，则给元素绑定失焦判断精度的事件
                //     blurFun(evt, element);
                // }
                // if ($(element.$).attr('_timetype')) {// 日期文本
                //     timeTypeFun(evt, element.$);
                // }
                // //表格内点击日期文本数据元时获焦不准确，可能是外层元素，当获焦是外层元素时，给它所有的timetext子元素绑定校验事件
                // if (element.$.nodeType === 1 && (element.$.nodeName === 'TD' || element.$.nodeName === 'P')) {
                //     var timeTextNodes = element.find('span[data-hm-node="newtextbox"][_texttype="时间文本"]').$;
                //     if (timeTextNodes.length > 0) {
                //         for (var i = 0; i < timeTextNodes.length; i++) {
                //             timeTypeFun(evt, timeTextNodes[i]);
                //         }
                //     }
                // }
                element.$.onblur = function (e) {
                    if ($(e.target).parent('.new-textbox').hasClass('bgred')) {
                        $(e.target).parent('.new-textbox').removeClass('bgred');
                    }
                }
            });
            function blurFun(evt, element) {
                var _element = element.$;
                if ($(element.$).hasClass('new-textbox')){//如果数据元没有占位文本，则获焦的可能是外层span
                    _element = $(element.$).children('.new-textbox-content')[0];
                }
                _element.onblur = function (e) {
                    var precision = $(e.target).attr('_precision');
                    var warningStr = '';
                    var val = e.target.innerText.replace(/\u200B/g, '');;
                    warningStr = wrapperUtils.numCheck(val, precision);
                    if (warningStr) {
                        editorIns.showNotification(warningStr, 'warning');
                    }
                    if (!warningStr && $(e.target).parent('.new-textbox').css('backgroundColor') == 'rgb(255, 0, 0)') {
                        $(e.target).parent('.new-textbox').css("backgroundColor", '');
                    }
                }
                _element.oninput = function (e) {
                    var key = e.inputType;
                    if (key == 'deleteContentBackward' || key == 'deleteContentForward') {
                        evt.stop();
                        evt.data.preventDefault();
                        return;
                    }
                    var precision = $(e.target).attr('_precision');
                    var warningStr = '';
                    var val = e.target.innerText.replace(/\u200B/g, '');
                    warningStr = wrapperUtils.numCheck(val, precision, 'input');
                    if (warningStr) {
                        editorIns.showNotification(warningStr, 'warning');
                    }
                }
            }
            function timeTypeFun(evt, element) {
                var _element = element;
                if ($(element).hasClass('new-textbox')){//如果数据元没有占位文本，则获焦的可能是外层span
                    _element = $(element).children('.new-textbox-content')[0];
                }

                _element.oninput = function (e) {
                    // window['timetextInputFlag'] = true;// 记录input输入（程序获焦导致触发时间校验）
                    var key = e.inputType;
                    if (key == 'deleteContentBackward' || key == 'deleteContentForward') {
                        evt.stop();
                        evt.data.preventDefault();
                        return;
                    }

                    var timetype = $(e.target).attr('_timetype');
                    var val = doTimeFormat(timetype, $(e.target).text().replace(/[^\d]/g, ''));

                    var range0 = editor.getSelection().getRanges()[0];
                    var len1 = 0;
                    var prev = range0.startContainer.getPrevious();
                    while (prev) {
                        len1 += prev.getText().length;
                        prev = prev.getPrevious();
                    }
                    range0.startContainer.remove();
                    e.target.innerHTML = '';
                    e.target.appendChild(range0.startContainer.$);

                    var index = 0; //遇到' '-' ':'三个符号，获焦位置后移一位
                    switch (timetype) {
                        case 'yyyy-MM-dd':
                            if (range0.startOffset == 5 || range0.startOffset == 8) {
                                index = 1;
                            }
                            break;
                        case 'yyyy-MM-dd hh:mm':
                            if (range0.startOffset == 5 || range0.startOffset == 8 || range0.startOffset == 11 || range0.startOffset == 14) {
                                index = 1;
                            }
                            break;
                        case 'hh:mm':
                            if (range0.startOffset == 3) {
                                index = 1;
                            }
                            break;
                        default:
                            break;
                    }
                    //时间文本补零宽，解决360光标在after伪元素之前与实际差半个字符的问题
                    range0.startContainer.$.data = val + '\u200b';
                    range0.startOffset += index;
                    range0.endOffset += index;
                    range0.startOffset += len1;
                    range0.endOffset += len1;
                    range0.startOffset = Math.min(range0.startOffset, val.length);
                    range0.endOffset = Math.min(range0.endOffset, val.length);
                    range0.select();
                }
            }

            editable.attachListener(editable, 'dblclick', function (evt) {
                if (editor.readOnly) {
                    return
                }
                var element = evt.contextTarget ? evt.contextTarget : evt.data.getTarget();
                element = $(element.$);
                if (element.hasClass('new-textbox')) {
                    element = element.find('span.new-textbox-content');
                }
                var _texttype = element.attr('_texttype');
                if (_texttype != '诊断' && _texttype != '手术' && _texttype != '下拉') {
                    return;
                }
                interactOnText(editor,element,true);
            });

            editable.attachListener(editable,'DOMFocusIn',function(evt){
                try{
                    var ele;
                    if (evt.data.container) {
                        ele = evt.data.container;
                    } else {
                        ele = (evt.data.getTarget) ? (evt.data.getTarget()) : editable.editor.getSelection().getRanges()[0].startContainer;
                    }
                    if(ele && ele.$){
                        var $node = $(ele.$);
                        if($node.hasClass('new-textbox')){
                            $node = $node.find('span.new-textbox-content');
                        }
                        var _texttype = $node.attr('_texttype');
                        if ($node.hasClass('new-textbox-content') && (_texttype == '诊断' || _texttype == '手术' || _texttype == '下拉')) {
                            if(window['preFocusNode'] && window['preFocusNode'].attr('focus_record') == $node.attr('focus_record')){
                                return;
                            }else{
                                $node.attr("focus_record",Math.random()+"");
                                window['preFocusNode'] = $node;
                            }

                            if (editor.readOnly) {
                                return
                            }
                            interactOnText(editor,$node,false,true);
                            return;
                        }else{
                            delete window['preFocusNode'];
                            var $div = $('#interactDiv');
                            if($div){
                                $div.hide();
                                $node.find('.bgred').removeClass('bgred');
                            }
                        }
                    }
                }catch(e){
                    console.error('dom focus error:',e);
                }

            })
        });

        CKEDITOR.dialog.add('datasource', this.path + 'dialogs/datasourceConfig.js');

        var _this = this;
        $.getScript(this.path + 'dialogs/datasourceConfig.js', function () {
            $.getScript(_this.path + 'dialogs/datasourceDialog.js')
        });
    }
});


/**
* 处理打印隐藏
* @param {*} editor
*/
function doPrintHideCascade(editor) {
    var _body = editor.document.getBody();
    var printHideDatasources = _body.find('[_print_hide_cascade]');
    if (printHideDatasources.count() > 0) {
        for (var i = 0; i < printHideDatasources.count(); i++) {
            var _datasource = printHideDatasources.getItem(i);
            var printHideCascade = _datasource.getAttribute('_print_hide_cascade');
            var _$body = $(_body.$);
            var cascadeDatasources = _$body.find('[data-hm-name="' + printHideCascade + '"]');
            if (cascadeDatasources.length == 0) {
                continue;
            }
            var printHideCascadeType = _datasource.getAttribute('_print_hide_cascade_value_type');
            var printHideCascadeValue = _datasource.getAttribute('_print_hide_cascade_value') || '';
            printHideCascadeValue = printHideCascadeValue.trim();
            var valueObj = getSourceObject(cascadeDatasources, _$body, null, null, null);
            var cascadeDatasource = cascadeDatasources[0];
            var type = _datasource.getAttribute('data-hm-node');
            var name = cascadeDatasource.getAttribute('data-hm-name');
            var printHideFlag = false;
            if ((printHideCascadeType == 'empty' && !valueObj[name]['值']) || (printHideCascadeType == 'not_empty' && valueObj[name]['值']) || (printHideCascadeType == 'custom' && valueObj[name]['值'] == printHideCascadeValue)) {
                printHideFlag = true;
            }
            if (!printHideFlag) {
                continue;
            }
            switch (type) {
                case 'newtextbox':
                case 'labelbox':
                case 'timebox':
                case 'searchbox':
                case 'cellbox':
                case 'textboxwidget':
                case 'dropbox':
                case 'radiobox':
                case 'checkbox':
                case 'expressionbox':
                    _datasource.addClass('_paragraphHide');
                    break;
            }
        }
    }
}

/**
* 处理打印不显示数据
* @param editor
*/
function doPrintClearData(editor) {
    var _body = editor.document.getBody();
    //清空费用相关数据
    clearFee($(_body.$));
}
// 打印清空费用值
function clearFee(_body) {
    var emptyVal = '-';
    var clearEles = _body.find('._clearData');
    var len = clearEles.length;
    for (var i = 0; i < len; i++) {
        var clearEle = $(clearEles[i]);
        var type = clearEle.attr('data-hm-node') || '';
        if (type) {
            if (type != 'labelbox') {
                setVal(clearEle, emptyVal, true);
            }
        } else {
            var _clearEleChildren = clearEle.find('[data-hm-node]');
            var _len = _clearEleChildren.length;
            for (var j = 0; j < _len; j++) {
                var _clearChild = $(_clearEleChildren[j]);
                setVal(_clearChild, emptyVal);
            }
        }
    }

}
function setVal(datasource, val) {
    var type = datasource.attr('data-hm-node') || '';
    switch (type) {
        case 'newtextbox':
            datasource.removeClass('new-textbox');
            var $datasource = datasource.find('span.new-textbox-content');
            if ($datasource.length == 0) { //有[_placeholderText]属性的span会被删除
                $datasource = $("<span contenteditable='true'></span>");
                datasource.append($datasource);
            }

            $datasource.text(val);
            var _minWidth = datasource.attr('_minWidth');
            if (_minWidth) {
                if (_minWidth.indexOf('px') >= 0) {
                    var $widthWrapper = $('<span style=display:inline-block;min-width:' + _minWidth + '>' + '</span>');
                    $widthWrapper.append($datasource.html());
                    $datasource.html($widthWrapper.prop('outerHTML'));
                } else {
                    _minWidth = parseInt(_minWidth);
                    var txt = $datasource.text().replace(/\u200B/g, '');
                    var offsetTxt = "";
                    if (txt.length < _minWidth) {
                        var offset = _minWidth - txt.length;
                        for (var c = 0; c < offset; c++) {
                            offsetTxt += "\u00a0";
                        }
                    }
                    $datasource.append('<span>' + offsetTxt + '</span>');
                }

            }
            if (datasource.attr('_underline') == 'true') {
                $datasource.wrap('<span _print_underline=true></span>');
            }
            if (datasource.attr('_color') == 'red') {
                $datasource.wrap('<span _print_color=red></span>');
            }
            break;
        case 'timebox':
        case 'dropbox':
        case 'searchbox':
        case 'textboxwidget':
            var $datasource = $(datasource);
            $datasource.text(val);
            var _minWidth = datasource.attr('_minWidth');
            if (_minWidth) {
                if (_minWidth.indexOf('px') >= 0) {
                    var $widthWrapper = $('<span style=display:inline-block;min-width:' + _minWidth + '>' + '</span>');
                    $widthWrapper.append($datasource.html());
                    $datasource.html($widthWrapper.prop('outerHTML'));
                } else {
                    _minWidth = parseInt(_minWidth);
                    var txt = $datasource.text().replace(/\u200B/g, '');
                    var offsetTxt = "";
                    if (txt.length < _minWidth) {
                        var offset = _minWidth - txt.length;
                        for (var c = 0; c < offset; c++) {
                            offsetTxt += "\u00a0";
                        }
                    }
                    $datasource.append('<span>' + offsetTxt + '</span>');
                }

            }

            if (datasource.attr('_underline') == 'true') {
                $datasource.wrap('<span _print_underline=true></span>');
            }


            break;
    }
}
// 病程不可编辑时placeholder是否可自动隐藏
function hidePlaceHolder(place, body) {
    if (body.find("[data-hm-widgetid]:not([contenteditable='false'])").count() == 0) {
        return true;
    }
    var p = place.parent();
    while (p != null) {
        if (p.is('body')) {
            return true;
        }
        if (p.is('div') && p.attr('data-hm-widgetid') && p.attr('contenteditable') == 'false') {
            return false;
        }
        p = p.parent();
    }

    return true;
}
// 时间文本 输入时实时校验
function doTimeFormat(type, data) {
    switch (type) {
        case 'yyyy-MM':
            data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2}).*$/, '$1-$2')
            break;
        case 'yyyy-MM-dd':
            data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2})$/, '$1-$2')
                .replace(/^(\d{4})(\d{2})(\d{1,2}).*$/, '$1-$2-$3');
            break;
        case 'yyyy-MM-dd hh:mm':
            data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2})$/, '$1-$2')
                .replace(/^(\d{4})(\d{2})(\d{1,2})$/, '$1-$2-$3')
                .replace(/^(\d{4})(\d{2})(\d{2})(\d{1,2})$/, '$1-$2-$3 $4')
                .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{1,2}).*$/, '$1-$2-$3 $4:$5');
            break;
        case 'hh:mm':
            data = data.replace(/^(\d{2})(\d{1,2}).*$/, '$1:$2');
            break;
        case 'yyyy-MM-dd hh:mm:ss':
                data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2})$/, '$1-$2')
                    .replace(/^(\d{4})(\d{2})(\d{1,2})$/, '$1-$2-$3')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{1,2})$/, '$1-$2-$3 $4')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{1,2})$/, '$1-$2-$3 $4:$5')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{1,2}).*$/, '$1-$2-$3 $4:$5:$6');
                break;
        case 'yyyy年MM月dd日':
            data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2})$/, '$1年$2月')
                .replace(/^(\d{4})(\d{2})(\d{1,2}).*$/, '$1年$2月$3日');
            break;
        case 'yyyy年MM月dd日HH时mm分':
                data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2})$/, '$1年$2月')
                    .replace(/^(\d{4})(\d{2})(\d{1,2})$/, '$1年$2月$3日')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{1,2})$/, '$1年$2月$3日$4时')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{1,2}).*$/, '$1年$2月$3日$4时$5分');
                break;
        case 'yyyy年MM月dd日hh时mm分':
                data = data.replace(/^[0]+/, '').replace(/^(\d{4})(\d{1,2})$/, '$1年$2月')
                    .replace(/^(\d{4})(\d{2})(\d{1,2})$/, '$1年$2月$3日')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{1,2})$/, '$1年$2月$3日$4时')
                    .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{1,2}).*$/, '$1年$2月$3日$4时$5分');
                break;
        default:
            break;
    }

    return data;
}
// 点击input
function inputClick(type) {
    window.event ? window.event.cancelBubble = true : e.stopPropagation();
    var _input = $(window.event.currentTarget).find('input');
    _input.prop('checked', !_input.prop('checked'));

    if (type === 0) {
        var allChecked = $('#operationList thead input').prop('checked');
        $('#operationList tbody tr input').prop('checked', allChecked);
    } else {
        $('#operationList thead input').prop('checked', $('#operationList tbody input:checked').length === $('#operationList tbody tr').length);
    }
}

/*
 * 内容校验：1、文本  2、时间（timebox）  3、其他类型
 *
 * 1、文本：长度、数值、时间（时间文本）、非空。监听输入、失焦
 * 2、时间（timebox）：非空、时间（时间格式）。 监听确定事件
 * 3、搜索：非空、长度（文本输入选项）。监听确定事件
 *
 */
function checkTextListener(editor,evt,element){
    var _element = element;
    if($(element).hasClass('new-textbox')){
        _element = $(element).children('.new-textbox-content')[0];
    }
    // 需要校验

    // 1、_reg   正则校验
    // 2、_notnull  非空
    // 3、_realtimecheck 实时校验
    // 4、_textflag、_numflag、_dateflag 勾选校验

    // 时间文本默认实时校验

    var texttype = $(_element).attr('_texttype');
    var reg = $(_element).attr('_reg');
    var notnull = $(_element).attr('_notnull');
    var realtimecheck = $(_element).attr('_realtimecheck');

    var textflag = $(_element).attr('_textflag');
    var numflag = $(_element).attr('_numflag');
    var dateflag = $(_element).attr('_dateflag');

    var textmin = $(_element).attr('_text_min');
    var textmax = $(_element).attr('_text_max');



    //var config = {"texttype":texttype,"reg":reg,"notnull":notnull,"realtimecheck":realtimecheck,"textflag":textflag,"numflag":numflag,"dateflag":dateflag,"textmin":textmin,"textmax":textmax};


    if(notnull || textflag || numflag || dateflag){
        _element.onblur = function (e) {
            var precision = $(e.target).attr('_precision');
            var val = e.target.innerText.replace(/\u200B/g, '');
            if($(e.target).hasClass('new-textbox-content') && $(e.target).attr('_placeholdertext') == 'true'){
                val = '';
            }
            check(val);
            }
        }else{
            showCheckResult(_element,null);
        }



    if(texttype == '时间文本' || realtimecheck){
        // 时间和实时校验
        _element.oninput = function (e) {
            var val = e.target.innerText.replace(/\u200B/g, '');
            if($(e.target).hasClass('new-textbox-content') && $(e.target).attr('_placeholdertext') == 'true'){
                val = '';
            }
            if(texttype == '时间文本'){
                var key = e.inputType;
                    if (key == 'deleteContentBackward' || key == 'deleteContentForward') {
                        evt.stop();
                        evt.data.preventDefault();
                        if(dateflag || notnull){
                            check(val);
                        }

                        return;
                    }

                    var timetype = $(e.target).attr('_timetype');
                    val = doTimeFormat(timetype, $(e.target).text().replace(/[^\d]/g, ''));

                    var range0 = editor.getSelection().getRanges()[0];
                    var len1 = 0;
                    var prev = range0.startContainer.getPrevious();
                    while (prev) {
                        len1 += prev.getText().length;
                        prev = prev.getPrevious();
                    }
                    range0.startContainer.remove();
                    e.target.innerHTML = '';
                    e.target.appendChild(range0.startContainer.$);

                    var index = 0; //遇到' '-' ':'三个符号，获焦位置后移一位
                    switch (timetype) {
                        case 'yyyy-MM':
                            if (range0.startOffset == 5) {
                                index = 1;
                            }
                            break;
                        case 'yyyy-MM-dd':
                            if (range0.startOffset == 5 || range0.startOffset == 8) {
                                index = 1;
                            }
                            break;
                        case 'yyyy-MM-dd hh:mm':
                            if (range0.startOffset == 5 || range0.startOffset == 8 || range0.startOffset == 11 || range0.startOffset == 14) {
                                index = 1;
                            }
                            break;
                        case 'hh:mm':
                            if (range0.startOffset == 3) {
                                index = 1;
                            }
                            break;
                            case 'yyyy-MM-dd hh:mm:ss':
                            if (range0.startOffset == 5 || range0.startOffset == 8 || range0.startOffset == 11 || range0.startOffset == 14 || range0.startOffset == 17) {
                                index = 1;
                            }
                                break;
                        case 'yyyy年MM月dd日':
                            if (range0.startOffset == 5 || range0.startOffset == 8) {
                                index = 1;
                            }
                            if (range0.startOffset == 7 || range0.startOffset == 10) {
                                index = 2;
                            }
                            break;
                        case 'yyyy年MM月dd日HH时mm分':
                            if (range0.startOffset == 5 || range0.startOffset == 8 || range0.startOffset == 11 || range0.startOffset == 14) {
                                index = 1;
                            }
                            if (range0.startOffset == 7 || range0.startOffset == 10 || range0.startOffset == 13 || range0.startOffset == 16) {
                                index = 2;
                            }
                                break;
                        default:
                            break;
                    }
                    //时间文本补零宽，解决360光标在after伪元素之前与实际差半个字符的问题
                    range0.startContainer.$.data = val + '\u200b';
                    range0.startOffset += index;
                    range0.endOffset += index;
                    range0.startOffset += len1;
                    range0.endOffset += len1;
                    range0.startOffset = Math.min(range0.startOffset, val.length);
                    range0.endOffset = Math.min(range0.endOffset, val.length);
                    range0.select();
            }
            if(notnull || textflag || numflag || dateflag){
                check(val);
            }

        }
    }

    function check(val){

        if(texttype == '时间文本'){
            var obj = {'type':'时间文本'};
            if(notnull){
                // 非空
                obj['notnull'] = notnull;
            }
            if(dateflag){
                if($(_element).attr('_timetype')){
                    obj['timetype'] = $(_element).attr('_timetype');
                }
                var dateMin = $(_element).attr('_date_min');
                var dateMax = $(_element).attr('_date_max');
                if(dateMin || dateMax){
                    obj['daterange'] = {"datemin":dateMin,"datemax":dateMax,'format':obj['timetype']};
                }
            }


            doCheckText(_element,val,obj);

        }else if(texttype == '数字文本'){
            var obj = {'type':'数字文本'};
            if(reg){
                // 正则
                obj['reg'] = reg;
            }
            if(notnull){
                // 非空
                obj['notnull'] = notnull;
            }
            var precision = $(_element).attr('_precision');
            if(precision){
                obj['precision'] = precision;
            }
            obj['numrange'] = {"min":$(_element).attr('_num_min'),"max":$(_element).attr('_num_max')};
            doCheckText(_element,val,obj);

        }else{
            var obj = {'type':'纯文本'};

            if(notnull){
                // 非空
                obj['notnull'] = notnull;
            }
            if(textflag){
                obj['textlen'] = {'textmin':textmin,'textmax':textmax};
                if(reg){
                    // 正则
                    obj['reg'] = reg;
                }
            }
            doCheckText(_element,val,obj);
        }
    }
}
function checkContentListener(editor,evt,element){
    if(!element){
        return;
    }
    var $ele = $(element);

    if($ele.hasClass('new-textbox-content')){
        checkTextListener(editor,evt,element);
        return;
    }
    if($ele.hasClass('new-textbox')){
        var _element = $ele.children('.new-textbox-content')[0];
        if(_element){
            checkTextListener(editor,evt,_element);
        }
        return;
    }
    if(element.nodeType===1 && (element.nodeName==='TD'||element.nodeName==='P')){
        var timeTextNodes = $ele.find('span[data-hm-node="timetext"]');
        if(timeTextNodes.length>0){
            for(var i=0;i<timeTextNodes.length;i++){
                checkTextListener(editor,evt, timeTextNodes[i]);
            }
        }
    }
    // todo  其他类型
}
function doCheckText(ele,val,options){
    var check = {
        reg:function(val,regText){
            var msg = '';
            try{
                msg = new RegExp(regText).test(val)?'':'不符合表达式格式';
            }catch(e){
                console.log(e);
                msg = '不符合表达式格式';
            }
            return msg;
        },notnull:function(val,notnull){
            return val.length > 0?'':'不能为空';
        },textlen:function(val,lenObj){
            var msg = '';
            var len = val.length;
            var min = lenObj['textmin'];
            var max = lenObj['textmax'];
            if(min){
                if(len < (min * 1)){
                    return '长度不能小于'+min;
                }
            }
            if(max){
                if(len > (max * 1)){
                    return '长度不能大于'+max;
                }
            }
            return msg;
        },timetype:function(val,format){
            if(!format){
                return '';
            }
            var msg = '格式为：'+format;
            if(val.length != format.length){
                return msg;
            }
            if(!new RegExp(format.replace(/[yYmMdDHhSs]/g,'\\d')).test(val)){
                return msg;
            }
            return '';
        },daterange:function(val,objRange){
            function checkDate(dateStr) {
                var date = new Date(dateStr);

                if (!date || 'Invalid Date' == date || 'undefined' == date || 'null' == date) {
                    return false;
                } else {
                    return true;
                }
            }
            function getStrByIndex(stArr,index,defaultVal){

                if(index >= stArr.length){
                    return defaultVal;
                }

                return stArr[index] || defaultVal;

            }
            var msg = '';
            var format = objRange['format'];

            var dateMin = objRange['datemin'];
            var dateMax = objRange['datemax'];

            var trueFormat = '';
            var trueMin = '';
            var trueMax = '';

            var valDateStr = '';
            if(format == 'month_day'){
                // MM-dd
                trueFormat = 'MM-dd';
                valDateStr = '2023-'+val;
                if(dateMin){
                    var stArr = dateMin.split(/-\sT/g);
                    trueMin = getStrByIndex(stArr,1,'01')+"-"+getStrByIndex(stArr,2,'01');
                }
                if(dateMax){
                    var stArr = dateMax.split(/-\sT/g);
                    trueMax = getStrByIndex(stArr,1,'01')+"-"+getStrByIndex(stArr,2,'01');
                }
            }else if(format == 'time' || format == 'hh:mm'){
                // hh:mm
                trueFormat = 'hh:mm';
                valDateStr = '2023-01-01 '+val;
                if(dateMin){
                    var stArr = dateMin.split(/T/g);
                    trueMin = getStrByIndex(stArr,1,'00:00');
                }
                if(dateMax){
                    var stArr = dateMax.split(/T/g);
                    trueMax = getStrByIndex(stArr,1,'23:59');
                }
            }else if(format == 'fullTime'){
                // hh:mm:ss
                trueFormat = 'hh:mm:ss';
                valDateStr = '2023-01-01 '+val;
                if(dateMin){
                    var stArr = dateMin.split(/T/g);
                    trueMin = getStrByIndex(stArr,1,'00:00:00');
                }
                if(dateMax){
                    var stArr = dateMax.split(/T/g);
                    trueMax = getStrByIndex(stArr,1,'23:59:59');
                }
            }else if(format == 'fullDateTime'){
                // yyyy-MM-dd hh:mm:ss
                trueFormat = 'yyyy-MM-dd hh:mm:ss';
                if(dateMin){
                    trueMin = dateMin.replace('T',' ')+":00";
                }
                if(dateMax){
                    trueMax = dateMax.replace('T',' ')+":59";
                }
            }else if(format == 'date' || format == 'date_han' || format == 'yyyy-MM-dd'){
                // yyyy-MM-dd
                trueFormat = 'yyyy-MM-dd';
                if(dateMin){
                    var stArr = dateMin.split(/T/g);
                    trueMin = getStrByIndex(stArr,0,'');
                }
                if(dateMax){
                    var stArr = dateMax.split(/T/g);
                    trueMax = getStrByIndex(stArr,0,'');
                }
            } else if (format == 'year_month') {
                trueFormat = 'yyyy-MM';
                if (dateMin) {
                    var stArr = dateMin.split(/T/g);
                    var str = getStrByIndex(stArr, 0, '');
                    trueMin = str.slice(0, str.length - 3);
                }
                if (dateMax) {
                    var stArr = dateMax.split(/T/g);
                    var str = getStrByIndex(stArr, 0, '');
                    trueMax = str.slice(0, str.length - 3);
                }
            }else{
               // yyyy-MM-dd hh:mm
               trueFormat = 'yyyy-MM-dd hh:mm';
               if(dateMin){
                trueMin = dateMin.replace('T',' ');
               }
                if(dateMax){
                trueMax = dateMax.replace('T',' ');
                }
            }

            var timetypemsg = this.timetype(val,trueFormat);
            if(timetypemsg){
                return timetypemsg;
            }

            if(!valDateStr){
                valDateStr = val;
            }
            if(!checkDate(valDateStr)){
                return "格式应为："+trueFormat;
            }

            var _vs = wrapperUtils.formatDateToStr(trueFormat,new Date(valDateStr));

            if(trueMin){
                if(trueMin.localeCompare(_vs) == 1){
                    return '时间不能在【'+trueMin+'】之前';
                }
            }
            if(trueMax){
                if(trueMax.localeCompare(_vs) == -1){
                    return '时间不能在【'+trueMax+'】之后';
                }
            }
            return msg;
        },precision:function(val,precision){
            return wrapperUtils.numCheck(val,precision);
        },numrange:function(val,obj){

            var min = obj['min'];
            var max = obj['max'];


            var valNum = Number(val);
            if(min){
                if(valNum < Number(min)){
                    return "输入值不能小于【"+min+"】";
                }
            }
            if(max){
                if(valNum > Number(max)){
                    return "输入值不能大于【"+min+"】";
                }
            }

        }
    };

    var type = {
        "纯文本":function(){
            var msg = '';
            var cks = ['notnull','reg','textlen'];
            for(var i=0;i<cks.length;i++){
                if(options[cks[i]]){
                    msg = check[cks[i]](val,options[cks[i]]);
                    if(msg){
                        break;
                    }
                }
            }
            showCheckResult(ele,msg);
        },
        "时间文本":function(){
            var msg = '';
            var cks = ['notnull','daterange'];
            for(var i=0;i<cks.length;i++){
                if(options[cks[i]]){
                    msg = check[cks[i]](val,options[cks[i]]);
                    if(msg){
                        break;
                    }
                }
            }
            showCheckResult(ele,msg);
        },
        "数字文本":function(){
            var msg = '';
            var cks = ['notnull','reg','precision','numrange'];
            for(var i=0;i<cks.length;i++){
                if(options[cks[i]]){
                    msg = check[cks[i]](val,options[cks[i]]);
                    if(msg){
                        break;
                    }
                }
            }
            showCheckResult(ele,msg);
        },"搜索":function(){
            var msg = '';
            var cks = ['notnull'];
            for(var i=0;i<cks.length;i++){
                if(options[cks[i]]){
                    msg = check[cks[i]](val,options[cks[i]]);
                    if(msg){
                        break;
                    }
                }
            }
            showCheckResult(ele,msg);
        },"时间":function(){
            var msg = '';
            var cks = ['notnull','daterange'];
            for(var i=0;i<cks.length;i++){
                if(options[cks[i]]){
                    msg = check[cks[i]](val,options[cks[i]]);
                    if(msg){
                        break;
                    }
                }
            }
            showCheckResult(ele,msg);
        }
    }
    try{
        type[options['type']] && type[options['type']]();
    }catch(e){
        console.log('doCheckContent:',options);
        console.error(e);
    }

}
// 弹框点确定
function checkContent(ele,val){
    var t = $(ele).attr('data-hm-node');
    if(t == 'timebox'){
        var obj = null;
        if($(ele).attr('_notnull')){
            obj = {};
            obj['notnull'] = true;
        }

        if($(ele).attr('_dateflag') && ($(ele).attr('_date_min') || $(ele).attr('_date_max'))){
            if(!obj){
                obj = {};
            }
            obj['daterange'] = {"datemin":$(ele).attr('_date_min'),"datemax":$(ele).attr('_date_max'),"format":$(ele).attr('_timeoption')}
        }

        if(obj){
            obj['type'] = '时间';
            doCheckText(ele,val,obj);
        }else{
            showCheckResult(ele,null);
        }


        return;
    }
    if(t == 'searchbox'){
        if($(ele).attr('_notnull')){
            doCheckText(ele,val,{"notnull":true,"type":"搜索"});
        }else{
            showCheckResult(ele,null);
        }
        return;
    }

        var tt = $(ele).attr('_texttype');
        if(tt == '手术' || tt == '诊断' || tt == '下拉'){
            if($(ele).hasClass('new-textbox-content') && $(ele).attr('_placeholdertext') == 'true'){
                val = '';
            }
            var obj = {'type':'纯文本'};
            if($(ele).attr('_notnull')){
                // 非空
                obj['notnull'] = $(ele).attr('_notnull');
            }
            if($(ele).attr('_textflag')){
                obj['textlen'] = {'textmin':$(ele).attr('_text_min'),'textmax':$(ele).attr('_text_max')};
                if($(ele).attr('_reg')){
                    // 正则
                    obj['reg'] = $(ele).attr('_reg');
                }
            }
            doCheckText(ele,val,obj);
        }

}

function showCheckResult(ele,msg){
    if(msg){
        $(ele).addClass('check-error-backcolor');
        $(ele).attr('title',msg);
    }else{
        $(ele).removeClass('check-error-backcolor');
        $(ele).removeAttr('title');
    }
}
