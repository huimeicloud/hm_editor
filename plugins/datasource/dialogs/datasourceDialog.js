//# sourceURL=plugins/datasource/dialogs/datasourceDialog.js
$(function () {
    var DatasourceDialogApp = function (editor) {
        this.editor = editor;
        this.dataSourceTypeMap = {
            'newtextbox': { name: '新文本输入框', code: 'newtextbox', parentCode: 'newtextbox', hasItems: false, placeHolder: '' },
            'textboxwidget': {
                name: '文本控件',
                code: 'textboxwidget',
                parentCode: 'textboxwidget',
                hasItems: false,
                placeHolder: ''
            },
            'radiobox': { name: '单选', code: 'radiobox', parentCode: 'radiobox', hasItems: true, placeHolder: '选项1#选项2' },
            'checkbox': { name: '多选', code: 'checkbox', parentCode: 'checkbox', hasItems: true, placeHolder: '选项1#选项2' },
            'dropbox': {
                name: '下拉菜单',
                code: 'dropbox',
                parentCode: 'dropbox',
                hasItems: true,
                placeHolder: '显示1(内容1)#显示2(内容2)'
            },
            'cellbox': { name: '单元', code: 'cellbox', parentCode: 'cellbox', hasItems: false, placeHolder: '' },
            'searchbox': { name: '搜索', code: 'searchbox', parentCode: 'searchbox', hasItems: false, placeHolder: '' },
            'time': { name: '时间', code: 'time', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'date': { name: '日期', code: 'date', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'month_day': { name: '月/日', code: 'month_day', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'datetime': { name: '日期 时间', code: 'datetime', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'date_han': { name: 'yyyy年MM月dd日', code: 'date_han', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'datetime_han': { name: 'yyyy年MM月dd日HH时mm分', code: 'datetime_han', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'fullTime': { name: '时分秒', code: 'fullTime', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'fullDateTime': { name: '年-月-日 时:分:秒', code: 'fullDateTime', parentCode: 'timebox', hasItems: false, placeHolder: '' },
            'button': { name: '按钮', code: 'button', parentCode: 'button', hasItems: false, placeHolder: '' }
        };
        this.emrDataSourceList = [];
        this.searchDataElementParams = {
            key: ''
        };
        this.init();

        // 存储实例到编辑器对象中，便于其他地方调用
        if (editor) {
            editor._datasourceDialogApp = this;
        }
    };
    $.extend(DatasourceDialogApp.prototype, {
        init: function () {
            var _this = this;
            var searchParams = new URLSearchParams(location.search);
            _this.editorMode = searchParams.get("editorMode");
            _this.consoleCanEdit = searchParams.get("consoleCanEdit");
            _this.designMode = searchParams.get("designMode");
            _this.templateTrueName = decodeURIComponent(searchParams.get("templateTrueName"));

            // 只打印调试信息，不改变全局变量
            console.log('初始化数据元对话框，当前global_ds_list状态:', window.global_ds_list ? '已存在' : '不存在');
            if (window.global_ds_list) {
                console.log('当前global_ds_list数据元数量:', window.global_ds_list.length);
            }

            if (_this.editor.HMConfig.designMode) {
                _this.insertDialogTemplate();

                _this.editor.hideDatasourceDialog = function () {
                    _this.$container.hide();
                };

                _this.editor.showDatasourceDialog = function () {
                    _this.$container.show();
                };
            }
        },

        insertDialogTemplate: function () {
            var _this = this;
            console.log('insertDialogTemplate', _this);

            var $templateDiv = $('<div id="templateDiv" style="display:none"></div>');
            $('body').append($templateDiv).css('overflow-x', 'hidden');
            var sdkHost = _this.editor.HMConfig.sdkHost||'';
            $templateDiv.load(sdkHost+'/plugins/datasource/dialogs/datasourceDialog.html', function () {
                _this.containerTemplate = $("#datasource_containerTemplate").html();
                _this.dataSourceContentTemplate = $("#dataSource_contentTemplate").html();
                _this.pageTemplate = $("#pageTemplate").html();
                _this.$container = $(_this.containerTemplate).appendTo($("body"));

                // 强制顶格显示
                _this.$container.css({
                    'top': '0',
                    'height': '100%'
                });

                // 设置数据元列表区域的样式，确保可以滚动显示所有内容
                _this.$container.find('.datasource-item-list').css({
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden',
                    'flex': '1',
                    'max-height': 'none'
                });

                // 隐藏分页区域
                _this.$container.find('#dsd_pager').hide();

                _this.$container.find("#dataElement_name").on("keyup", function (evt) {
                    _this.searchDataElementParams.key = $(evt.target).val().trim();
                    _this.searchDataSourceListByParams();
                });
                _this.$container.find('.si-swicth').click(function () {
                    var that = $(this);
                    if (that.find('span').hasClass('glyphicon-menu-right')) {
                        that.parent().css('left', 0);
                        that.find('span').removeClass('glyphicon-menu-right').addClass('glyphicon-menu-left');
                        _this.updateCkeContentsPostion(210); // 插入数据元的数据元面板容器宽度
                    } else {
                        that.parent().css('left', '-210px');
                        that.find('span').removeClass('glyphicon-menu-left').addClass('glyphicon-menu-right')
                        _this.updateCkeContentsPostion(0);
                    }
                });

                // 初始搜索一次
                _this.searchDataSourceListByParams();
            });
        },
        dsType:function(ds){
            var nodeType = '纯文本';

            if(!ds || !ds['name']){
                ds['nodeName'] = nodeType;
                return;
            }
            if(ds['name'].indexOf('[$日期_时间$]') > 0){
                ds['nodeName'] = '单元';
                return;
            }
            if ((ds['dictList'] && ds['dictList'].length > 0) || ds['type'] == 'L') {
                nodeType = '下拉';
            } else {
                var type = ds['type'] || '';
                if(type.indexOf('D') == 0){
                    nodeType = '时间';
                }else if(type.replace(/\d+/g,'') == 'N'){
                    nodeType = '数字';
                }else if(ds['name'].indexOf('手术') > -1 || ds['name'].indexOf('诊断') > -1){
                    nodeType = '搜索';
                }
            }
            ds['nodeName'] = nodeType;
        },
        searchDataSourceListByParams: function () {
            var _this = this;
            // 检查是否已初始化界面
            if (!_this.$container) {
                console.log('界面尚未初始化，暂不执行搜索');
                return;
            }

            console.log('获取数据元数据');

            // 使用已有的global_ds_list
            var allDs = window.global_ds_list || [];
            console.log('数据元总数量:', allDs.length);

            if(!window.global_ds_group){
                var dsObj = {};
                for (var i = 0; i < allDs.length; i++) {
                    var _d = allDs[i];
                    _this.dsType(_d);
                    dsObj[_d['name']] = _d;
                }
            }

            var filteredDs = [];
            var fk = _this.searchDataElementParams.key || '';

            // 过滤符合条件的数据，不进行分页
            for (var i = 0; i < allDs.length; i++) {
                var _d = allDs[i];
                if (!fk || (_d.name && (_d.name.indexOf(fk) > -1 || (_d.code && _d.code.indexOf(fk) > -1)))) {
                    filteredDs.push(_d);
                }
            }

            console.log('过滤后数据元数量:', filteredDs.length);
            console.log('显示所有数据元，不分页');

            _this.emrDataSourceList = filteredDs;
            _this.templateContent(_this.emrDataSourceList, _this.$container.find('#dataElement'));

            // 不再调用分页模板
            // _this.templateDataElementPage();
        },
        templateContent: function (data, container) {
            var _this = this;

            try {
                var template = _.template(_this.dataSourceContentTemplate);
                var html = template({ emrDataSourceList: data });
                container.find('.datasource-item-list').html(html);

                // 检查是否渲染成功
                var count = container.find('.datasource-item-list li').length;
                console.log('渲染的数据元项数量:', count);

                container.find('[name="insert"]').each(function () {
                    var that = $(this);
                    that.on('dblclick', function () {
                        var datasource = data[parseInt(that.attr('index'), 10)];
                        _this.insertDataSource(datasource);
                    });
                });
            } catch (e) {
                console.error('渲染数据元列表出错:', e);
                // 降级处理，直接构建HTML
                var html = '';
                if (!data || data.length === 0) {
                    html += '<li>未查询到数据元信息！</li>';
                } else {
                    for (var i = 0; i < data.length; i++) {
                        var ds = data[i];
                        html += '<li class="datasource-item" name="insert" index="' + i + '" title="数据元类型：' + (ds.nodeName || '') + '">' + ds.name + '</li>';
                    }
                }
                container.find('.datasource-item-list').html(html);
            }
        },
        getVisibleNumberRegion: function (currentPage, totalPage) {
            var numberArray = [];
            if (totalPage <= 5) {
                numberArray = _.range(1, totalPage + 1);
            } else {
                var maxNumber = currentPage + 2;
                var minNumber = currentPage - 2;
                if (minNumber < 1) {
                    maxNumber = maxNumber + (1 - minNumber);
                    minNumber = 1
                }
                if (maxNumber > totalPage) {
                    maxNumber = totalPage;
                    minNumber = Math.max(1, maxNumber - 4);
                }
                numberArray = _.range(minNumber, maxNumber + 1);
            }
            return numberArray;
        },
        templateDataElementPage: function () {
            var _this = this;
            var template = _.template(_this.pageTemplate);
            var page = _this.searchDataElementParams.page;

            // 计算可见页码范围
            page.numberArray = _this.getVisibleNumberRegion(page.currentPage, page.totalPage);

            // 渲染分页
            _this.$container.find('#dataElement .dsd_pager_container').html(template({ page: page }));
            _this.$container.find('#dataElement .dsd_pager_container').find('a[name="pageA"]').each(function () {
                var _that = $(this);
                _that.click(function () {
                    var pageNumber = parseInt(_that.attr('pageNumber'), 10);
                    if (pageNumber == page.currentPage) {
                        return;
                    }
                    if (pageNumber < 1) {
                        pageNumber = 1;
                    } else if (pageNumber > page.totalPage) {
                        pageNumber = page.totalPage;
                    }
                    page.currentPage = pageNumber;
                    _this.searchDataSourceListByParams();
                })
            });
        },
        updateCkeContentsPostion: function (marginLeft) {
            $("#cke_1_contents").css({
                'margin-left': marginLeft + 'px',
                'transition': 'all .7s'
            });
        },
        insertDataSource: function (datasource) { //插入数据元
            var _this = this;
            var data = {};
            data['data-hm-name'] = datasource['name'];
            data['data-hm-code'] = datasource['code'];

            if(!datasource['nodeType']){
                this.dsType(datasource);
                var nodeType = datasource['nodeName'];

                if(nodeType == '时间'){
                    data['data-hm-node'] = 'timebox';
                    data['_timeoption'] = 'date';
                }else if(nodeType == '数字'){
                    data['data-hm-node'] = 'newtextbox';
                    data['_texttype'] = '数字';
                }else if(nodeType == '下拉'){
                    function c(ds){
                        var itemsStr = "";
                        if (ds['dictList'] && ds['dictList'].length > 0) {
                            var items = [];
                            for (var i = 0; i < ds['dictList'].length; i++) {
                                items.push(ds['dictList'][i]['description'] + '(' + ds['dictList'][i]['val'] + ')');
                            }
                            itemsStr = items.join('#');
                        } else if (ds['type'] == 'L') {
                            itemsStr = "是#否";
                        }
                        return itemsStr;
                    }
                    data['data-hm-node'] = 'newtextbox';
                    data['_texttype'] = '下拉';
                    data['data-hm-items'] = c(datasource);
                    data['_click'] = 'true';
                    data['_jointsymbol'] = ',';
                    data['_selecttype'] = '单选';
                }else if(nodeType == '搜索'){
                    data['data-hm-node'] = 'searchbox';
                    var n = datasource['data-hm-name'];

                    var so = '';
                    if(n.indexOf('手术') > -1){
                        if(n.indexOf('编码')){
                            so = '手术编码';
                        }else{
                            so = '手术名称';
                        }
                    }else if(n.indexOf('诊断') > -1){
                        if(n.indexOf('编码')){
                            so = '诊断编码';
                        }else{
                            so = '诊断名称';
                        }
                    }
                    if(so){
                        data._searchoption = datasource.searchOption;
                    }


                }else if(nodeType == '单元'){
                    data['data-hm-node'] = 'cellbox';
                }else{
                    data['data-hm-node'] = 'newtextbox';
                    data['_texttype'] = '纯文本';
                }
            }else{
                data['data-hm-node'] = datasource['nodeType'];
                Object.assign(data,datasource);
            }

            if(data['data-hm-node'] == 'newtextbox'){
                data['_placeholder'] = data['data-hm-name'];
            }
            delete data['nodeName'];
            delete data['nodeType'];
            _handleCreate(_this.editor, data);
        }
    });

    // 创建实例
    new DatasourceDialogApp(window.editorIns);
});