CKEDITOR.dialog.add('datasource', function (editor) {
    return {
        title: '数据元',
        minWidth: 520,
        minHeight: 400,
        contents: [
            {
                id: 'info',
                label: '基础设置',
                elements: [
                    {
                        type: 'radio',
                        id: 'datasourceType',
                        label: '类型<span id="warnInfo" style="color:red;margin-left: 45px;">提示：仅限4.4.00及其以上版本支持</span>',
                        items: [
                            ['标题', 'labelbox'],
                            ['新文本', 'newtextbox'],
                            ['时间', 'timebox'],
                            ['单选', 'radiobox'],
                            ['多选', 'checkbox'],
                            ['下拉', 'dropbox'],
                            ['搜索', 'searchbox'],
                            ['单元', 'cellbox'],
                            ['文本控件', 'textboxwidget'],
                            ['按钮', 'button'],
                        ],
                        setup: function (element) {
                            var type = element.getAttribute('data-hm-node');
                            if(element.is('button')){
                                type = 'button';
                            }
                            this.setValue(type);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'text',
                        id: 'datasourceName',
                        label: '数据元',
                        validate: CKEDITOR.dialog.validate.notEmpty('名称不能为空'),
                        setup: function (element) {
                            var name = element.getAttribute('data-hm-name');
                            if(element.is('button')){
                                name = element.getText();
                            }
                            this.setValue(name);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'text',
                        id: 'datasourceItem',
                        label: '选项',
                        setup: function (element) {
                            var datasourceItem = element.getAttribute('data-hm-items');
                            this.setValue(datasourceItem);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'select',
                        id: 'timeboxOption',
                        label: '日期格式',
                        width: '100%',
                        items: [
                            ['时间', 'time'],
                            ['时:分:秒', 'fullTime'],
                            ['日期', 'date'],
                            ['月-日', 'month_day'],
                            ['日期 时间', 'datetime'],
                            ['年-月-日 时:分:秒', 'fullDateTime'],
                            ['yyyy年MM月dd日', 'date_han'],
                            ['yyyy年MM月dd日HH时mm分', 'datetime_han']
                        ],
                        setup: function (element) {
                            var timeOption = element.getAttribute('_timeOption');
                            timeOption && this.setValue(timeOption);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'text',
                        // width: '180px',
                        id: 'placeholder',
                        label: '占位文本',
                        setup: function (element) {
                            var placeholder = element.getAttribute('_placeholder');
                            placeholder && this.setValue(placeholder);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'select',
                        id: 'searchOption',
                        label: '搜索类型',
                        width: '100%',
                        items: [
                            /*['test', 'test'],*/
                            ['手术名称', '手术名称'],
                            ['手术编码', '手术编码'],
                            ['诊断名称', '诊断名称'],
                            ['诊断编码', '诊断编码'],
                            ['治则治法名称', '治则治法名称'],
                            ['治则治法编码', '治则治法编码'],
                            ['损伤中毒外因名称', '损伤中毒外因名称'],
                            ['损伤中毒外因编码', '损伤中毒外因编码'],
                            ['病理诊断名称', '病理诊断名称'],
                            ['病理诊断编码', '病理诊断编码'],
                            ['中医诊断名称', '中医诊断名称'],
                            ['中医诊断编码', '中医诊断编码'],
                            ['中医诊断主病名称', '中医诊断主病名称'],
                            ['中医诊断主病编码', '中医诊断主病编码'],
                            ['中医诊断主证名称', '中医诊断主证名称'],
                            ['中医诊断主证编码', '中医诊断主证编码'],
                            ['医护名称', '医护名称'],
                            ['医生名称', '医生名称'],
                            ['护士名称', '护士名称'],
                            ['职业资格编码', '职业资格编码'],
                            ['国家标准编码', '国家标准编码'],
                            ['医护名称_国家标准码', '医护名称_国家标准码'],
                            ['医护名称_职业资格码', '医护名称_职业资格码'],
                            ['登陆帐号', '登陆帐号'],
                            ['用户ID', '用户ID'],
                            ['地址', '地址'],
                            ['地址_省', '地址_省'],
                            ['地址_市', '地址_市'],
                            ['地址_县', '地址_县'],
                            ['科室名称', '科室名称'],
                            ['科室代码', '科室代码'],
                            ['地址名称', '地址名称']

                        ],
                        setup: function (element) {
                            var searchOption = element.getAttribute('_searchOption');
                            searchOption && this.setValue(searchOption);
                            if (searchOption=="手术名称"||searchOption=="手术编码") {
                                $( $('[_diag_gradePair]').closest("tr")[0] ).show();
                                $( $('[_diag_diagway_pair]').closest("tr")[0] ).show();
                                // $( $('[_diagway_no_pair]').closest("tr")[0] ).show();

                            }
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },{
                        type: 'text',
                        id: 'searchPair',
                        label: '对应编码/编码名称',
                        setup: function (element) {
                            var searchPair = element.getAttribute('_searchPair');
                            searchPair && this.setValue(searchPair);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },{
                        type: 'text',
                        id: 'gradePair',
                        label: '对应手术级别数据元',
                        setup: function (element) {
                            var gradePair = element.getAttribute('_gradePair');
                            gradePair && this.setValue(gradePair);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },{
                        type: 'text',
                        id: 'diagWayPair',
                        label: '对应诊疗方式名称',
                        setup: function (element) {
                            var diagWayPair = element.getAttribute('_diagway_pair');
                            diagWayPair && this.setValue(diagWayPair);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'select',
                        id: 'selectType',
                        label: '选择方式',
                        width: '100%',
                        items: [
                            ['单选', '单选'],
                            ['多选', '多选'],
                        ],
                        setup: function (element) {
                            var selectType = element.getAttribute('_selectType');
                            selectType && this.setValue(selectType);
                            if (selectType=='多选') {
                                $( $('[_diag_jointSymbol]').closest("tr")[0] ).show();
                            }
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'text',
                        id: 'jointSymbol',
                        label: '多选拼接符号（默认以‘,’拼接）',
                        setup: function (element) {
                            var jointSymbol = element.getAttribute('_jointSymbol');
                            jointSymbol && this.setValue(jointSymbol);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                            // 不是多选则清空该值
                            if ($('select[_diag_selectType]').val() !='多选') {
                                data[this.id] = '';
                            }
                        }
                    },
                    {
                        type: 'select',
                        id: 'precision',
                        label: '数字精度',
                        width: '100%',
                        items: [
                            ['任何', 'all'],
                            ['0', '0'],
                            ['0.0', '0.0'],
                            ['0.00', '0.00'],
                            ['0.000', '0.000'],
                            ['0.0000', '0.0000'],
                        ],
                        setup: function (element) {
                            var precision = element.getAttribute('_precision') || 'all';
                            precision && this.setValue(precision);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue() || 'all';
                            if ($('select[_diag_texttype]').val() !='数字文本') {
                                data[this.id] = '';
                            }
                        }
                    },{
                        type: 'select',
                        id: 'radioStyle',
                        label: '按钮样式',
                        width: '100%',
                        items: [
                            ['O', 'radioStyle_circle'],
                            ['☐', 'radioStyle_square'],
                        ],
                        setup: function (element) {
                            var radioStyle = element.getAttribute('_radioStyle');
                            radioStyle && this.setValue(radioStyle);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },{
                        type: 'select',
                        id: 'radioSelectType',
                        label: '是否必选（默认必选；当选择否时，可以取消选中状态）',
                        width: '100%',
                        items: [
                            ['是', '1'],
                            ['否', '0'],
                        ],
                        setup: function (element) {
                            var radioSelectType = element.getAttribute('_radio_select_type');
                            radioSelectType && this.setValue(radioSelectType);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'select',
                        id: 'isEdit',
                        label: '选中值是否可编辑',
                        width: '100%',
                        items: [
                            ['是', '是'],
                            ['否', '否'],
                        ],
                        setup: function (element) {
                            var isEdit = element.getAttribute('_isEdit');
                            isEdit && this.setValue(isEdit);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'text',
                        id: 'timeWidth',
                        label: '组件宽度(请输入数字)',
                        setup: function (element) {
                            var timeWidth = element.getAttribute('_timeWidth');
                            timeWidth && this.setValue(timeWidth);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'select',
                        id: 'timePrintFormat',
                        label: '日期打印显示格式',
                        width: '100%',
                        items: [
                            ['', ''],
                            ['时间', 'time'],
                            ['时:分:秒', 'fullTime'],
                            ['日期', 'date'],
                            ['月-日', 'month_day'],
                            ['日期 时间', 'datetime'],
                            ['年-月-日 时:分:秒', 'fullDateTime'],
                            ['yyyy年MM月dd日', 'date_han'],
                            ['yyyy年MM月dd日HH时mm分', 'datetime_han']
                        ],
                        setup: function (element) {
                            var timeFormat= element.getAttribute('_time_print_format');
                            timeFormat && this.setValue(timeFormat);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                    {
                        type: 'select',
                        id: 'timetype',
                        label: '日期时间格式',
                        width: '100%',
                        items: [
                            ['yyyy-MM-dd', 'yyyy-MM-dd'],
                            ['yyyy-MM-dd hh:mm', 'yyyy-MM-dd hh:mm'],
                            ['hh:mm', 'hh:mm']
                        ],
                        setup: function (element) {
                            var timetype = element.getAttribute('_timetype');
                            timetype && this.setValue(timetype);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                            if ($('select[_diag_texttype]').val() !='时间文本') {
                                data[this.id] = '';
                            }
                        }
                    },
                    {
                        type: 'select',
                        id: 'texttype',
                        label: '文本类型',
                        width: '100%',
                        items: [
                            ['纯文本', '纯文本'],
                            ['数字文本', '数字文本'],
                            ['时间文本', '时间文本'],
                            ['诊断列表', '诊断'],
                            ['手术列表', '手术'],
                            ['下拉', '下拉']
                        ],
                        setup: function (element) {
                            var texttype = element.getAttribute('_texttype');
                            texttype && this.setValue(texttype);
                            if (texttype=='数字文本') {
                                $( $('[_diag_precision]').closest("tr")[0] ).show();
                            } else if (texttype=='时间文本') {
                                $( $('[_diag_timeType]').closest("tr")[0] ).show();
                            }
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }
                    },
                ]
            },
            {
                id: 'adv-info',
                label: '高级设置',
                elements: [
                    {
                        type: 'hbox',
                        children: [
                            {
                                type: 'checkbox',
                                width: '45px',
                                id: 'autoshowcurtime',
                                label: '是否默认显示当前时间',
                                setup: function (element) {
                                    var typeNode = element.getAttribute('data-hm-node');
                                    if(typeNode == 'timebox'){
                                        $(this).show();
                                        var val = element.getAttribute('_autoshowcurtime');
                                        val && this.setValue(val);
                                    }else {
                                        $(this).hide();
                                    }
                                },
                                commit: function (data) {
                                    if( data['datasourceType'] != 'timebox') {
                                        data[this.id] = false;
                                    }else {
                                        data[this.id] = this.getValue();
                                    }
                                }
                            },{
                                type: 'checkbox',
                                width: '45px',
                                id: 'autoshowsavetime',
                                label: '是否默认显示保存时间',
                                setup: function (element) {
                                    var typeNode = element.getAttribute('data-hm-node');
                                    if(typeNode == 'timebox'){
                                        $(this).show();
                                        var val = element.getAttribute('_autoshowsavetime');
                                        val && this.setValue(val);
                                    }else {
                                        $(this).hide();
                                    }
                                },
                                commit: function (data) {
                                    if( data['datasourceType'] != 'timebox') {
                                        data[this.id] = false;
                                    }else {
                                        data[this.id] = this.getValue();
                                    }
                                }
                            }, {
                                type: 'checkbox',
                                width: '45px',
                                id: 'isdisabled',
                                label: '设置为不可编辑状态',
                                setup: function (element) {
                                    var typeNode = element.getAttribute('data-hm-node');
                                    $(this).show();
                                    var val = element.getAttribute('_isdisabled');
                                    val && this.setValue(val);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        children: [
                            {
                                type: 'checkbox',
                                width: '45px',
                                id: 'noshowicon',
                                label: '不显示图标',
                                setup: function (element) {
                                    var typeNode = element.getAttribute('data-hm-node');
                                    if(typeNode == 'timebox' || typeNode == 'searchbox' || typeNode == 'dropbox'){
                                        $(this).show();
                                        var val = element.getAttribute('_noshowicon');
                                        val && this.setValue(val);
                                    }else {
                                        $(this).hide();
                                    }
                                },
                                commit: function (data) {
                                    if( data['datasourceType'] != 'timebox' && data['datasourceType'] != 'searchbox' && data['datasourceType'] != 'dropbox') {
                                        data[this.id] = false;
                                    }else {
                                        data[this.id] = this.getValue();
                                    }
                                }
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        children: [
                            {
                                type: 'checkbox',
                                width: '45px',
                                id: 'deleteable',
                                label: '可以直接删除',
                                setup: function (element) {
                                    var deleteable = element.getAttribute('_deleteable');
                                    deleteable && this.setValue(deleteable);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            },
                            // {
                            //     type: 'checkbox',
                            //     width: '45px',
                            //     id: 'required',
                            //     label: '是否必填',
                            //     setup: function (element) {
                            //         var required = element.getAttribute('_required');
                            //         required && this.setValue(required);
                            //     },
                            //     commit: function (data) {
                            //         data[this.id] = this.getValue();
                            //     }
                            // }
                        ]
                    },
                    {
                        type: 'text',
                        id: 'cascade',
                        label: '级联(单选，多选，下拉) <span style="color:red;">注：根据此数据元的设定值来确定主数据元是否隐藏</span>',
                        setup: function (element) {
                            var cascade = element.getAttribute('_cascade');
                            cascade && this.setValue(cascade);
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }

                    }, {
                        type: 'text',
                        id: 'print_hide_cascade',
                        label: '打印级联（<span style="color:red;">注：根据此数据元的设定值来确定主数据元打印时是否隐藏</span>）',
                        setup: function (element) {
                            var _printhidecascade = element.getAttribute('_print_hide_cascade');
                            if(_printhidecascade){
                                this.setValue(_printhidecascade);
                            }
                        },
                        commit: function (data) {
                            data[this.id] = this.getValue();
                        }

                    }, {
                        type: 'vbox',
                        children: [{
                            type: 'radio',
                            id: 'print_hide_cascade_value_type',
                            style: 'width:60%',
                            inputStyle: 'width:15px',
                            label: '打印级联数据元对应值设定',
                            items: [
                                ['值为空', 'empty'],
                                ['值不为空', 'not_empty'],
                                ['值自定义', 'custom']
                            ],
                            setup: function (element) {
                                var _printhidecascadetype = element.getAttribute('_print_hide_cascade_value_type');
                                if(_printhidecascadetype){
                                    this.setValue(_printhidecascadetype);
                                }
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }
                        }, {
                            type: 'text',
                            id: 'print_hide_cascade_value',
                            label: '自定义值设置',
                            setup: function (element) {
                                var value = element.getAttribute('_print_hide_cascade_value');
                                value && this.setValue(value);
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }
                        }]
                    },
                    {
                        type: 'vbox',
                        children: [ {
                            type: 'text',
                            id: 'association_datasource_name',
                            label: '自定义标题关联数据元名称 <span style="color:red;">注：根据该属性值指定标题所填写位置（适用于护理表单的自定义标题录入）</span>',
                            setup: function (element) {
                                var cascade = element.getAttribute('_association_name');
                                cascade && this.setValue(cascade);
                            },
                            commit: function (data) {
                                data[this.id] = this.getValue();
                            }

                        }]
                    }
                ]
            },
            {
                id: 'print-info',
                label: '打印设置',
                elements: [
                    {
                        type: 'hbox',
                        children: [
                            {
                                type: 'text',
                                width: '100px',
                                id: 'replacement',
                                label: '打印_默认文本',
                                setup: function (element) {
                                    var replacement = element.getAttribute('_replacement');
                                    replacement && this.setValue(replacement);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            },
                            {
                                type: 'text',
                                width: '100px',
                                id: 'splitment',
                                label: '打印_文本截取',
                                setup: function (element) {
                                    var splitment = element.getAttribute('_splitment');
                                    splitment && this.setValue(splitment);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            },
                            {
                                type: 'text',
                                width: '100px',
                                id: 'minWidth',
                                label: '打印_最小宽度',
                                setup: function (element) {
                                    var minwidth = element.getAttribute('_minwidth');
                                    minwidth && this.setValue(minwidth);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            },
                            {
                                type: 'select',
                                items: [
                                    ['black', 'black'],
                                    ['red', 'red']
                                ],
                                width: '100px',
                                id: 'color',
                                label: '打印_颜色',
                                setup: function (element) {
                                    var color = element.getAttribute('_color');
                                    color && this.setValue(color);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        children: [
                            {
                                type: 'checkbox',
                                width: '45px',
                                id: 'underline',
                                label: '打印_下划线',
                                setup: function (element) {
                                    var underline = element.getAttribute('_underline');
                                    underline && this.setValue(underline);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            },
                            {
                                type: 'checkbox',
                                width: '45px',
                                id: 'border',
                                label: '打印_外边框（下拉菜单）',
                                setup: function (element) {
                                    var _border = element.getAttribute('_border');
                                    _border && this.setValue(_border);
                                },
                                commit: function (data) {
                                    data[this.id] = this.getValue();
                                }
                            }
                        ]
                    }
                ]
            }
        ],

        onLoad: function () {
            var timeboxOption = this.getContentElement('info', 'timeboxOption');
            var timeboxOptionElement = timeboxOption.getInputElement();
            var timeboxOptionElementLabel = timeboxOption.getElement().findOne('[' + 'for=' + timeboxOptionElement.getAttribute('id') + ']');
            timeboxOptionElement.setAttribute('_diag_timeOption', true);
            timeboxOptionElementLabel.setAttribute('_diag_timeOption', true);
            timeboxOptionElement.on('change', timeboxOptionEvent);

            var datasourceItem = this.getContentElement('info', 'datasourceItem');
            var datasourceItemElement = datasourceItem.getInputElement();
            var datasourceItemElementLabel = datasourceItem.getElement().findOne('[' + 'for=' + datasourceItemElement.getAttribute('id') + ']');
            datasourceItemElement.setAttribute('_diag_items', true);
            datasourceItemElementLabel.setAttribute('_diag_items', true);

            var placeholder = this.getContentElement('info', 'placeholder');
            var placeholderElement = placeholder.getInputElement();
            var placeholderElementLabel = placeholder.getElement().findOne('[' + 'for=' + placeholderElement.getAttribute('id') + ']');
            placeholderElement.setAttribute('_diag_placeholder', true);
            placeholderElementLabel.setAttribute('_diag_placeholder', true);

            var cascade = this.getContentElement('adv-info', 'cascade');
            var cascadeElement = cascade.getInputElement();
            cascadeElement.setAttribute('_diag_cascade');

            var printHideCascade = this.getContentElement('adv-info', 'print_hide_cascade');
            var printHideCascadeElement = printHideCascade.getInputElement();
            var printHideCascadeValueCon = this.getContentElement('adv-info', 'print_hide_cascade_value');
            var printHideCascadeValue = printHideCascadeValueCon.getInputElement();
            var printHideCascadeType = this.getContentElement('adv-info', 'print_hide_cascade_value_type').getInputElement();
            $("#"+ printHideCascadeValueCon.domId).hide();
            printHideCascadeElement.setAttribute('_diag_print_hide_cascade');
            $(printHideCascadeType.$).find("input[type='radio']").on("click", function(evt){
                if($(this).val() == 'custom'){
                    $("#"+ printHideCascadeValueCon.domId).show();
                }else {
                    printHideCascadeValue.setValue("");
                    $("#"+ printHideCascadeValueCon.domId).hide();
                }
            });

            var searchOption = this.getContentElement('info', 'searchOption');
            var searchOptionElement = searchOption.getInputElement();
            var searchOptionElementLabel = searchOption.getElement().findOne('[' + 'for=' + searchOptionElement.getAttribute('id') + ']');
            searchOptionElement.setAttribute('_diag_searchOption', true);
            searchOptionElementLabel.setAttribute('_diag_searchOption', true);
            searchOptionElement.on('change', gradePairEvent);

            var searchPair = this.getContentElement('info', 'searchPair');
            var searchPairElement = searchPair.getInputElement();
            var searchPairElementLabel = searchPair.getElement().findOne('[' + 'for=' + searchPairElement.getAttribute('id') + ']');
            searchPairElement.setAttribute('_diag_searchPair', true);
            searchPairElementLabel.setAttribute('_diag_searchPair', true);

            var gradePair = this.getContentElement('info', 'gradePair');
            var gradePairElement = gradePair.getInputElement();
            var gradePairElementLabel = gradePair.getElement().findOne('[' + 'for=' + gradePairElement.getAttribute('id') + ']');
            gradePairElement.setAttribute('_diag_gradePair', true);
            gradePairElementLabel.setAttribute('_diag_gradePair', true);

            // var diagCodePair = this.getContentElement('info', 'diagWayNoPair');
            // var diagCodePairElement = diagCodePair.getInputElement();
            // var diagCodePairElementLabel = diagCodePair.getElement().findOne('[' + 'for=' + diagCodePairElement.getAttribute('id') + ']');
            // diagCodePairElement.setAttribute('_diagway_no_pair', true);
            // diagCodePairElementLabel.setAttribute('_diagway_no_pair', true);
            // 主要针对病案首页诊断列中的治疗方式
            var diagPair = this.getContentElement('info', 'diagWayPair');
            var diagPairElement = diagPair.getInputElement();
            diagPairElement.setAttribute('placeholder', '设置诊疗方式对应名称，例如：治疗方式');
            var diagPairElementLabel = diagPair.getElement().findOne('[' + 'for=' + diagPairElement.getAttribute('id') + ']');
            diagPairElement.setAttribute('_diag_diagway_pair', true);
            diagPairElementLabel.setAttribute('_diag_diagway_pair', true);

            var datasourceType = this.getContentElement('info', 'datasourceType');
            var datasourceTypeElement = datasourceType.getInputElement();

            var autoshowcurtime = this.getContentElement('adv-info', 'autoshowcurtime');
            var autoshowcurtimeElement = autoshowcurtime.getInputElement();
            autoshowcurtimeElement.setAttribute('_diag_autoshowcurtime');

            var autoshowsavetime = this.getContentElement('adv-info', 'autoshowsavetime');
            var autoshowsavetimeElement = autoshowsavetime.getInputElement();
            autoshowsavetimeElement.setAttribute('_diag_autoshowsavetime');

            var isdisabled = this.getContentElement('adv-info', 'isdisabled');
            var isdisabledElement = isdisabled.getInputElement();
            isdisabledElement.setAttribute('_diag_isdisabled');

            var association = this.getContentElement('adv-info', 'association_datasource_name');
            var associationInput = association.getInputElement();
            associationInput.setAttribute('placeholder', '关联数据元名称');
            var selectType = this.getContentElement('info', 'selectType');
            var selectTypeElement = selectType.getInputElement();
            var selectTypeElementLabel = selectType.getElement().findOne('[' + 'for=' + selectTypeElement.getAttribute('id') + ']');
            selectTypeElement.setAttribute('_diag_selectType', true);
            selectTypeElementLabel.setAttribute('_diag_selectType', true);
            selectTypeElement.on('change', selectTypeEvent);
            var jointSymbol = this.getContentElement('info', 'jointSymbol');
            var jointSymbolElement = jointSymbol.getInputElement();
            var jointSymbolElementLabel = jointSymbol.getElement().findOne('[' + 'for=' + jointSymbolElement.getAttribute('id') + ']');
            jointSymbolElement.setAttribute('_diag_jointSymbol', true);
            jointSymbolElementLabel.setAttribute('_diag_jointSymbol', true);

            var noshowicon = this.getContentElement('adv-info', 'noshowicon');
            var noshowiconElement = noshowicon.getInputElement();
            noshowiconElement.setAttribute('_diag_noshowicon');

            function selectTypeEvent(){
                console.log(selectTypeElement.getValue());
                if (selectTypeElement.getValue()=='多选') {
                    $( $('[_diag_jointSymbol]').closest("tr")[0] ).show();
                    //多选拼接符号设置默认值
                    jointSymbolElement.setValue(jointSymbolElement.getValue() || ',');
                } else {
                    $( $('[_diag_jointSymbol]').closest("tr")[0] ).hide();
                }
            }

            function gradePairEvent(){
                console.log(searchOptionElement.getValue());
                if (searchOptionElement.getValue()=='手术名称'||searchOptionElement.getValue()=='手术编码') {
                    $( $('[_diag_gradePair]').closest("tr")[0] ).show();
                    // $( $('[_diagway_no_pair]').closest("tr")[0] ).show();
                    $( $('[_diag_diagway_pair]').closest("tr")[0] ).show();
                } else {
                    $( $('[_diag_gradePair]').closest("tr")[0] ).hide();
                    // $( $('[_diagway_no_pair]').closest("tr")[0] ).hide();
                    $( $('[_diag_diagway_pair]').closest("tr")[0] ).hide();
                }
            }

            var precision = this.getContentElement('info', 'precision');
            var precisionElement = precision.getInputElement();
            var precisionElementLabel = precision.getElement().findOne('[' + 'for=' + precisionElement.getAttribute('id') + ']');
            precisionElement.setAttribute('_diag_precision', true);
            precisionElementLabel.setAttribute('_diag_precision', true);

            var radioStyle = this.getContentElement('info', 'radioStyle');
            var radioStyleElement = radioStyle.getInputElement();
            var radioStyleElementLabel = radioStyle.getElement().findOne('[' + 'for=' + radioStyleElement.getAttribute('id') + ']');
            radioStyleElement.setAttribute('_diag_radioStyle', true);
            radioStyleElementLabel.setAttribute('_diag_radioStyle', true);

            var radioSelectType = this.getContentElement('info', 'radioSelectType');
            var radioSelectTypeElement = radioSelectType.getInputElement();
            var radioSelectTypeElementLabel = radioSelectType.getElement().findOne('[' + 'for=' + radioSelectTypeElement.getAttribute('id') + ']');
            radioSelectTypeElement.setAttribute('_diag_radioSelectType', true);
            radioSelectTypeElementLabel.setAttribute('_diag_radioSelectType', true);

            var isEdit = this.getContentElement('info', 'isEdit');
            var isEditElement = isEdit.getInputElement();
            var isEditElementLabel = isEdit.getElement().findOne('[' + 'for=' + isEditElement.getAttribute('id') + ']');
            isEditElement.setAttribute('_diag_isEdit', true);
            isEditElementLabel.setAttribute('_diag_isEdit', true);

            var timeWidth = this.getContentElement('info', 'timeWidth');
            var timeWidthElement = timeWidth.getInputElement();
            var timeWidthElementLabel = timeWidth.getElement().findOne('[' + 'for=' + timeWidthElement.getAttribute('id') + ']');
            timeWidthElement.setAttribute('_diag_timeWidth', true);
            timeWidthElementLabel.setAttribute('_diag_timeWidth', true);
            function timeboxOptionEvent(){//时间组件的默认宽度
                if (timeboxOptionElement.getValue()=='date') {
                    timeWidthElement.setValue('80');
                } else if (timeboxOptionElement.getValue()=='datetime') {
                    timeWidthElement.setValue('128');
                } else if (timeboxOptionElement.getValue()=='date_han') {
                    timeWidthElement.setValue('112');
                } else if (timeboxOptionElement.getValue()=='datetime_han') {
                    timeWidthElement.setValue('176');
                } else if (timeboxOptionElement.getValue()=='fullDateTime') {
                    timeWidthElement.setValue('180');
                } else if (timeboxOptionElement.getValue()=='fullTime') {
                    timeWidthElement.setValue('70');
                } else {
                    timeWidthElement.setValue('40');
                }
            }

            var timePrintFormat = this.getContentElement('info', 'timePrintFormat');
            var timePrintFormatEle = timePrintFormat.getInputElement();
            var timePrintFormatLabel = timePrintFormat.getElement().findOne('[' + 'for=' + timePrintFormatEle.getAttribute('id') + ']');
            timePrintFormatEle.setAttribute('_diag_timePrintFormat', true);
            timePrintFormatLabel.setAttribute('_diag_timePrintFormat', true);

            var timetype = this.getContentElement('info', 'timetype');
            var timeTypeEle = timetype.getInputElement();
            var timeTypeLabel = timetype.getElement().findOne('[' + 'for=' + timeTypeEle.getAttribute('id') + ']');
            timeTypeEle.setAttribute('_diag_timeType', true);
            timeTypeLabel.setAttribute('_diag_timeType', true);

            $('input[_diag_items]').attr('placeholder', '选项1#选项2#选项3#......');
            $('input[_diag_cascade]').attr('placeholder', '数据元_选项');
            $('input[_diag_print_hide_cascade]').attr('placeholder', '级联数据元');

            var texttype = this.getContentElement('info', 'texttype');
            var texttypeElement = texttype.getInputElement();
            var texttypeElementLabel = texttype.getElement().findOne('[' + 'for=' + texttypeElement.getAttribute('id') + ']');
            texttypeElement.setAttribute('_diag_texttype', true);
            texttypeElementLabel.setAttribute('_diag_texttype', true);
            texttypeElement.on('change', textTypeEvent);
            function textTypeEvent(){
                console.log(texttypeElement.getValue());
                if (texttypeElement.getValue()=='纯文本') {
                    $( $('[_diag_timeType]').closest("tr")[0] ).hide();
                    $( $('[_diag_precision]').closest("tr")[0] ).hide();
                    precisionElement.setValue('');
                    timeTypeEle.setValue('');
                } else if (texttypeElement.getValue()=='时间文本') {
                    $( $('[_diag_timeType]').closest("tr")[0] ).show();
                    $( $('[_diag_precision]').closest("tr")[0] ).hide();
                    //日期时间格式设置默认值
                    precisionElement.setValue('');
                    timeTypeEle.setValue(timeTypeEle.getValue());
                } else if (texttypeElement.getValue()=='数字文本') {
                    $( $('[_diag_timeType]').closest("tr")[0] ).hide();
                    $( $('[_diag_precision]').closest("tr")[0] ).show();
                     //数字精度设置默认值
                     precisionElement.setValue(precisionElement.getValue());
                     timeTypeEle.setValue('');
                }
            }
            var radioMap = {
                '标题': datasourceType._.children[0].domId,
                '新文本': datasourceType._.children[1].domId,
                '时间': datasourceType._.children[2].domId,
                '单选': datasourceType._.children[3].domId,
                '多选': datasourceType._.children[4].domId,
                '下拉': datasourceType._.children[5].domId,
                '搜索': datasourceType._.children[6].domId,
                '单元': datasourceType._.children[7].domId,
                '文本控件': datasourceType._.children[8].domId,
                '按钮': datasourceType._.children[9].domId
            };
            $warnInfo = datasourceType.getElement().findOne("#warnInfo");

            function fireRadioEvent() {
                $( $('[_diag_timeOption]').closest("tr")[0] ).hide();
                $( $('[_diag_items]').closest("tr")[0] ).hide();
                $( $('[_diag_placeholder]').closest("tr")[0] ).hide();
                $( $('[_diag_searchOption]').closest("tr")[0] ).hide();
                $( $('[_diag_searchPair]').closest("tr")[0] ).hide();
                $( $('[_diag_gradePair]').closest("tr")[0] ).hide();
                $( $('[_diag_diagway_pair]').closest("tr")[0] ).hide();
                $( $('[_diag_autoshowcurtime]').closest("tr")[0] ).hide();
                $( $('[_diag_autoshowsavetime]').closest("tr")[0] ).hide();
                $( $('[_diag_isdisabled]').closest("tr")[0] ).hide();
                $( $('[_diag_selectType]').closest("tr")[0] ).hide();
                $( $('[_diag_jointSymbol]').closest("tr")[0] ).hide();
                $( $('[_diag_radioStyle]').closest("tr")[0] ).hide();
                $( $('[_diag_radioSelectType]').closest("tr")[0] ).hide();
                $( $('[_diag_noshowicon]').closest("tr")[0] ).hide();
                $( $('[_diag_precision]').closest("tr")[0] ).hide();
                $( $('[_diag_isEdit]').closest("tr")[0] ).hide();
                $( $('[_diag_timeWidth]').closest("tr")[0] ).hide();
                $( $('[_diag_timePrintFormat]').closest("tr")[0] ).hide();
                $( $('[_diag_timeType]').closest("tr")[0] ).hide();
                $( $('[_diag_texttype]').closest("tr")[0] ).hide();
                $warnInfo.hide();

                switch (this.getAttribute('id')) {
                    case radioMap['标题']:
                        break;
                    case radioMap['新文本']:
                        $( $('[_diag_placeholder]').closest("tr")[0] ).show();
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        $( $('[_diag_texttype]').closest("tr")[0] ).show();
                        $($warnInfo.$).text('提示：仅限4.4.00及其以上版本支持');
                        $warnInfo.show();
                         //选择方式设置默认值
                         $('select[_diag_texttype]').val($('select[_diag_texttype]').val() || '纯文本');
                        break;
                    case radioMap['时间']:
                        $( $('[_diag_timeOption]').closest("tr")[0] ).show();
                        $( $('[_diag_autoshowcurtime]').closest("tr")[0] ).show();
                        $( $('[_diag_autoshowsavetime]').closest("tr")[0] ).show();
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        $( $('[_diag_noshowicon]').closest("tr")[0] ).show();
                        $( $('[_diag_timeWidth]').closest("tr")[0] ).show();
                        $( $('[_diag_timePrintFormat]').closest("tr")[0] ).show();
                        break;
                    case radioMap['单选']:
                        $( $('[_diag_items]').closest("tr")[0] ).show();
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        $( $('[_diag_radioStyle]').closest("tr")[0] ).show();
                        $( $('[_diag_radioSelectType]').closest("tr")[0] ).show();
                        $('select[_diag_radioSelectType]').val($('select[_diag_radioSelectType]').val() || '1');
                        //选择方式设置默认值
                        $('select[_diag_radioStyle]').val($('select[_diag_radioStyle]').val() || 'radioStyle_circle');
                        break;
                    case radioMap['多选']:
                        $( $('[_diag_items]').closest("tr")[0] ).show();
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        break;
                    case radioMap['下拉']:
                        $( $('[_diag_items]').closest("tr")[0] ).show();
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        $( $('[_diag_selectType]').closest("tr")[0] ).show();
                        $( $('[_diag_noshowicon]').closest("tr")[0] ).show();
                        //选择方式设置默认值
                        $('select[_diag_selectType]').val($('select[_diag_selectType]').val() || '单选');
                        break;
                    case radioMap['搜索']:
                        $( $('[_diag_searchOption]').closest("tr")[0] ).show();
                        $( $('[_diag_searchPair]').closest("tr")[0] ).show();
                        $( $('[_diagway_pair]').closest("tr")[0] ).show();
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        $( $('[_diag_noshowicon]').closest("tr")[0] ).show();
                        $( $('[_diag_isEdit]').closest("tr")[0] ).show();
                        //是否可编辑设置默认值
                        $('select[_diag_isEdit]').val($('select[_diag_isEdit]').val() || '否');
                        break;
                    case radioMap['单元']:
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        break;
                    case radioMap['文本控件']:
                        $( $('[_diag_isdisabled]').closest("tr")[0] ).show();
                        break;
                    case radioMap['按钮']:
                        $($warnInfo.$).text('提示：按钮类型数据元放于表格中时，表格不能包含非按钮类型的数据元或其它数据！');
                        $warnInfo.show();
                        break;
                }
            }
            datasourceTypeElement.findOne('#' + radioMap['标题']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['新文本']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['时间']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['单选']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['多选']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['下拉']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['搜索']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['单元']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['文本控件']).on('click', fireRadioEvent);
            datasourceTypeElement.findOne('#' + radioMap['按钮']).on('click', fireRadioEvent);
            // 模糊匹配数据元名称
            var datasourceNameElement = this.getContentElement('info', 'datasourceName').getInputElement();
            var searchParams = new URLSearchParams(location.search);
            var designMode = searchParams.get("designMode");
            var templateName = decodeURIComponent(searchParams.get("templateTrueName"));
            if (designMode === 'true' && templateName !== '') {
                $(datasourceNameElement.$).autocomplete({
                    source: function (request, response) {
                        $.ajax({
                            url: "/emr-console-server/dataSource/editor/autocomplete/search",
                            type: "post",
                            dataType: "json",
                            contentType: "application/json",
                            data: JSON.stringify({
                                searchName: request.term,
                                templateName: templateName
                            }),
                            success: function (data) {
                                if(data && data.code == '10000'){
                                    response(data.data || []);
                                }else {
                                    response([]);
                                }

                            },
                            error: function () {
                                response([]);
                            }
                        });
                    },
                    minLength: 2
                }).autocomplete("widget").css('z-index', 999999999);

                $(printHideCascadeElement.$).autocomplete({
                    source: function (request, response) {
                        $.ajax({
                            url: "/emr-console-server/dataSource/editor/autocomplete/search",
                            type: "post",
                            dataType: "json",
                            contentType: "application/json",
                            data: JSON.stringify({
                                searchName: request.term,
                                templateName: templateName
                            }),
                            success: function (data) {
                                if(data && data.code == '10000'){
                                    response(data.data || []);
                                }else {
                                    response([]);
                                }

                            },
                            error: function () {
                                response([]);
                            }
                        });
                    },
                    minLength: 2
                }).autocomplete("widget").css('z-index', 999999999);
            }
        },

        onShow: function () {
            // 重新获取
            var radios = this.getContentElement('info', 'datasourceType').getElement();
            var firstRadio = radios.findOne('input');
            var _element = editor.contextTargetElement;
            var td;
            if(editor.elementPath()){
                var td = editor.elementPath().contains('td');
            }else{
                editor.focus();
            }
            if (td && td.hasAttribute('data-hm-node')) {
                _element = td;
            } else if (_element && !_element.getAttribute('data-hm-node') && !_element.is('button')) {
                _element = _element.getParent();
            }
            var printHideCascadeValueCon = this.getContentElement('adv-info', 'print_hide_cascade_value');
            if (editorIns.invoker == 'nodeproperties' && _element) {
                this.insertMode = false;
                var type = _element.getAttribute('data-hm-node');
                if(_element.is('button')){
                    type = 'button';
                }
                var selectedRadio = new CKEDITOR.dom.element($('[name=datasourceType_radio]').filter(function () {
                        return $(this).attr('value') == type
                })[0]);
                selectedRadio.fire('click');
                $(radios.$).find('input').attr('disabled', 'disabled');
                var printHideType = _element.getAttribute('_print_hide_cascade_value_type');
                var selected = new CKEDITOR.dom.element($('[name="print_hide_cascade_value_type_radio"]').filter(function () {
                        return $(this).attr('value') == printHideType;
                })[0]);
                if(selected.$){
                    $(selected.$).trigger('click');
                }else {
                    printHideCascadeValueCon.getInputElement().setValue("");
                    $("#"+ printHideCascadeValueCon.domId).hide();
                }
                this.setupContent(_element);
            } else {
                this.insertMode = true;
                firstRadio.$.checked = true;
                $(radios.$).find('input').removeAttr('disabled');
                firstRadio.fire('click');
                printHideCascadeValueCon.getInputElement().setValue("");
                $("#"+ printHideCascadeValueCon.domId).hide();
            }
        },

        onOk: function () {
            var editor = editorIns;
            var data = {};
            this.commitContent(data);

            var sourceData = {};

            sourceData.type = data['datasourceType'];

            sourceData.name = data['datasourceName'].replace(/\s/g, '').replace(/\u200B/g, '');
            sourceData.timeOption = data['timeboxOption'];
            sourceData.searchOption = data['searchOption'];
            sourceData.searchPair = data['searchPair'];
            sourceData.gradePair = data['gradePair'];
            sourceData.diagWayPair = data['diagWayPair'];
            sourceData.diagWayNoPair = data['diagWayNoPair'];
            sourceData.placeholder = data['placeholder'];
            sourceData.selectType = data['selectType'];
            sourceData.jointSymbol = data['jointSymbol'];
            sourceData.precision = data['precision'];
            sourceData.radioStyle = data['radioStyle'];
            sourceData.radioSelectType = data['radioSelectType'];
            sourceData.isEdit = data['isEdit'];
            sourceData.timeWidth = data['timeWidth'];
            sourceData.timePrintFormat = data['timePrintFormat'];

            sourceData.items = data['datasourceItem'].split('#');
            sourceData.datasourceItem = data['datasourceItem'].replace(/（/g, '(').replace(/）/g, ')');

            sourceData.underline = data['underline'];
            sourceData.replacement = data['replacement'];
            sourceData.splitment = data['splitment'];
            sourceData.minWidth = data['minWidth'];
            sourceData.color = data['color'];
            sourceData.border = data['border'];
            sourceData.autoshowcurtime = data['autoshowcurtime'];
            sourceData.autoshowsavetime = data['autoshowsavetime'];
            sourceData.isdisabled = data['isdisabled'];
            sourceData.cascade = data['cascade'];
            if(data['print_hide_cascade'].trim() && !data['print_hide_cascade_value_type'] && !data['print_hide_cascade_value'].trim()){
                editor.showNotification("请选择打印级联数据元对应的值类型");
                return false;
            }
            if(data['print_hide_cascade'].trim() && data['print_hide_cascade_value_type']== 'custom' && !data['print_hide_cascade_value'].trim()){
                editor.showNotification("请填写打印级联数据元对应的值");
                return false;
            }
            sourceData.printHideCascade = data['print_hide_cascade'];
            sourceData.printHideCascadeValueType = data['print_hide_cascade_value_type'];
            sourceData.printHideCascadeValue = data['print_hide_cascade_value'];
            sourceData.noshowicon = data['noshowicon'];
            sourceData.associationName = data['association_datasource_name'];
            sourceData.timetype = data['timetype'];
            sourceData.deleteable = data['deleteable'];
            sourceData.required = data['required'];
            sourceData.texttype = data['texttype'];


            //再次编辑(checkbox radiobox 暂不对应)
            if (!this.insertMode) {
                _handleEdit(editor, sourceData);
                return;
            }
            //首次新建
            _handleCreate(editor, sourceData);
        }
    };
});

function _handleEdit(editor, sourceData) {
    var element = editor.contextTargetElement;
    if (!element.hasAttribute('data-hm-node') && !element.is('button')) {
        element = element.getParent('data-hm-node');
    }
    var td = editor.elementPath().contains('td');
    if (td && td.hasAttribute('data-hm-node')) element = td;

    element.removeAttribute('_placeholder');
    element.removeAttribute('data-hm-items');
    element.removeAttribute('_timeboxOption');
    element.removeAttribute('_searchOption');
    element.removeAttribute('_searchPair');
    element.removeAttribute('_gradePair');
    element.removeAttribute('_diagway_pair');
    // element.removeAttribute('_diagway_no_pair');
    element.removeAttribute('_selectType');
    element.removeAttribute('_jointSymbol');
    element.removeAttribute('_precision');
    element.removeAttribute('_radioStyle');
    element.removeAttribute('_radio_select_type');
    element.removeAttribute('_isEdit');
    element.removeAttribute('_timeWidth');
    element.removeAttribute('_time_print_format');

    element.removeAttribute('_cascade');
    element.removeAttribute('_print_hide_cascade');
    element.removeAttribute('_print_hide_cascade_value');
    element.removeAttribute('_replacement');
    element.removeAttribute('_splitment');
    element.removeAttribute('_minWidth');
    element.removeAttribute('_underline');
    element.removeAttribute('_color');
    element.removeAttribute('_border');
    element.removeAttribute('_autoshowcurtime');
    element.removeAttribute('_autoshowsavetime');
    element.removeAttribute('_isdisabled');
    element.removeAttribute('_noshowicon');
    element.removeAttribute('_association_name');
    element.removeAttribute('_timetype');
    element.removeAttribute('_deleteable');
    element.removeAttribute('_required');
    element.removeAttribute('_texttype');


    sourceData.placeholder && element.setAttribute('_placeholder', sourceData.placeholder);
    sourceData.datasourceItem && element.setAttribute('data-hm-items', sourceData.datasourceItem);
    sourceData.timeOption && element.setAttribute('_timeOption', sourceData.timeOption);
    sourceData.searchOption && element.setAttribute('_searchOption', sourceData.searchOption);
    sourceData.searchPair && element.setAttribute('_searchPair', sourceData.searchPair);
    sourceData.gradePair && element.setAttribute('_gradePair', sourceData.gradePair);
    // sourceData.diagWayNoPair && element.setAttribute('_diagway_no_pair', sourceData.diagWayNoPair);
    sourceData.diagWayPair && element.setAttribute('_diagway_pair', sourceData.diagWayPair);
    sourceData.selectType && element.setAttribute('_selectType', sourceData.selectType);
    sourceData.jointSymbol && element.setAttribute('_jointSymbol', sourceData.jointSymbol);
    sourceData.precision && element.setAttribute('_precision', sourceData.precision);
    sourceData.radioStyle && element.setAttribute('_radioStyle', sourceData.radioStyle);
    sourceData.radioSelectType && element.setAttribute('_radio_select_type', sourceData.radioSelectType);
    sourceData.isEdit && element.setAttribute('_isEdit', sourceData.isEdit);
    if(sourceData.timeWidth){
        element.setAttribute('_timeWidth', sourceData.timeWidth);
        element.setStyle('width',sourceData.timeWidth+'px');
        element.setStyle('min-width',sourceData.timeWidth+'px');
    }else {
        element.removeStyle('width');
        element.removeStyle('min-width');
    }
    // sourceData.timeWidth && element.setAttribute('_timeWidth', sourceData.timeWidth);
    sourceData.timePrintFormat && element.setAttribute('_time_print_format', sourceData.timePrintFormat);


    sourceData.cascade && element.setAttribute('_cascade', sourceData.cascade);
    sourceData.printHideCascade && element.setAttribute('_print_hide_cascade', sourceData.printHideCascade);
    sourceData.printHideCascadeValueType && element.setAttribute('_print_hide_cascade_value_type', sourceData.printHideCascadeValueType);
    sourceData.printHideCascadeValue && element.setAttribute('_print_hide_cascade_value', sourceData.printHideCascadeValue);
    sourceData.replacement && element.setAttribute('_replacement', sourceData.replacement);
    sourceData.splitment && element.setAttribute('_splitment', sourceData.splitment);
    sourceData.minWidth && element.setAttribute('_minWidth', sourceData.minWidth);
    sourceData.underline && element.setAttribute('_underline', sourceData.underline);
    sourceData.color && element.setAttribute('_color', sourceData.color);
    sourceData.border && element.setAttribute('_border', sourceData.border);
    sourceData.autoshowcurtime && element.setAttribute('_autoshowcurtime', sourceData.autoshowcurtime);
    sourceData.autoshowsavetime && element.setAttribute('_autoshowsavetime', sourceData.autoshowsavetime);
    sourceData.isdisabled && element.setAttribute('_isdisabled', sourceData.isdisabled);
    sourceData.noshowicon && element.setAttribute('_noshowicon', sourceData.noshowicon);
    sourceData.associationName && element.setAttribute('_association_name',sourceData.associationName);
    sourceData.timetype && element.setAttribute('_timetype', sourceData.timetype);
    sourceData.deleteable && element.setAttribute('_deleteable', sourceData.deleteable);
    sourceData.required && element.setAttribute('_required', sourceData.required);
    sourceData.texttype && element.setAttribute('_texttype', sourceData.texttype);
    switch (sourceData.type) {
        case 'labelbox':
            element.setText(sourceData.name);
            break;
        case 'timebox':

            break;
        case 'radiobox':
        case 'checkbox':
            element.$.innerHTML = '';

            for (var i = 0; i < sourceData.items.length; i++) {
                var itemNode = new CKEDITOR.dom.element('span');
                itemNode.setText('\u200B');
                itemNode.addClass('fa');
                itemNode.addClass(sourceData.type === 'checkbox' ? 'fa-square-o' : 'fa-circle-o');
                itemNode.setAttribute('data-hm-node', sourceData.type);
                itemNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                $(itemNode.$).on('click', function () {
                    _handleCascade(this);
                });
                element.append(itemNode);

                var descNode = new CKEDITOR.dom.element('span');
                descNode.setText('\u200B');
                descNode.setAttribute('data-hm-node', 'labelbox');
                descNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                descNode.setText(sourceData.items[i]);
                element.append(descNode);
                element.appendText('\u00a0');
            }
            break;
        case 'dropbox':
            break;
        case 'cellbox':

            break;
        case 'textboxwidget':

            break;
        case 'newtextbox':
            var childrenSpan = element.$.children;
            if (childrenSpan) {
                if ($(childrenSpan).attr('_placeholdertext')) {
                    $(childrenSpan).text(sourceData.placeholder);
                }
            }
            var newtextPlaceholder = $(element.$).find('.new-textbox-content');
            var _texttype = $(element).attr('_texttype');
            newtextPlaceholder.attr('_texttype', sourceData.texttype);
            if (_texttype=='纯文本') {
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.removeAttr('_timetype');
            } else if (_texttype=='时间文本') {
                newtextPlaceholder.removeAttr('_precision');
                newtextPlaceholder.attr('_timetype', sourceData.timetype);
            } else if (_texttype=='数字文本') {
                newtextPlaceholder.removeAttr('_timetype');
                newtextPlaceholder.attr('_precision', sourceData.precision);
            }
            break;
        case 'button':
            element.setText(sourceData.name);
            break;
    }
    //名称启主键作用；故最后修改
    if(sourceData.type == 'button'){
        element.removeAttribute('data-hm-name');
        element.removeAttribute('data-hm-node');
        element.setAttribute('contentEditable', 'false');
        return;
    }
    element.setAttribute('data-hm-name', sourceData.name);
}

function _handleCreate(editor, sourceData) {
    var ranges = editor.getSelection().getRanges();
    var legalRange = true;
    if (ranges.length == 1 && ranges[0].collapsed) {
        var eles = ranges[0].startPath().elements;
        for (var r = 0; r < eles.length; r++) {
            if (eles[r].is(CKEDITOR.dtd.$inline)) {
                legalRange = false;
                break;
            }
        }
    } else {
        legalRange = false;
    }
    if (editor.elementPath().contains('span') && editor.elementPath().contains('span').hasClass('new-textbox-content')) {
        legalRange = true;
    }
    var td = editor.elementPath().contains('td');
    if (td && td.hasAttribute('data-hm-node')) legalRange = false;
    if (!legalRange) {
        editor.showNotification('无法插入数据元到[格式化文本]或[选中文本]或[非嵌套类型数据元内]');
    } else {
        var node;// = new CKEDITOR.dom.element('span');
        if(sourceData.type == 'button'){
            var eles = (editor.elementPath() || {}).elements || [];
            if(eles.length > 0){
                var curNode = eles[0].$;
                if(curNode.tagName == 'TD'){
                    var tableNode = curNode.parentNode.parentNode.parentNode;
                    var dataSourceLen = $(tableNode).find('span[data-hm-node]').length;
                    if(dataSourceLen > 0){
                        editor.showNotification('当前表格包含非按钮类型数据元，请添加新表格后再插入按钮类型数据元!');
                        return;
                    }
                }
            }



            node = new CKEDITOR.dom.element('button');
            node.setText(sourceData.name);
        }else{
            node = new CKEDITOR.dom.element('span');
            node.setText('\u200B');
            node.setAttribute('data-hm-node', sourceData.type);
            node.setAttribute('data-hm-name', sourceData.name);
        }
        node.setAttribute('contentEditable', 'false');

        if(sourceData.type != 'labelbox'){
            node.setAttribute('data-hm-id', wrapperUtils.getGUID());
        }

        sourceData.underline && node.setAttribute('_underline', true);
        sourceData.replacement && node.setAttribute('_replacement', sourceData.replacement);
        sourceData.splitment && node.setAttribute('_splitment', sourceData.splitment);
        sourceData.minWidth && node.setAttribute('_minWidth', sourceData.minWidth);
        sourceData.cascade && node.setAttribute('_cascade', sourceData.cascade);
        sourceData.printHideCascade && node.setAttribute('_print_hide_cascade', sourceData.printHideCascade);
        sourceData.printHideCascadeValueType && node.setAttribute('_print_hide_cascade_value_type', sourceData.printHideCascadeValueType);
        sourceData.printHideCascadeValue && node.setAttribute('_print_hide_cascade_value', sourceData.printHideCascadeValue);
        sourceData.color && node.setAttribute('_color', sourceData.color);
        sourceData.border && node.setAttribute('_border', sourceData.border);
        sourceData.autoshowcurtime && node.setAttribute('_autoshowcurtime', sourceData.autoshowcurtime);
        sourceData.autoshowsavetime && node.setAttribute('_autoshowsavetime', sourceData.autoshowsavetime);
        sourceData.isdisabled && node.setAttribute('_isdisabled', sourceData.isdisabled);
        sourceData.noshowicon && node.setAttribute('_noshowicon', sourceData.noshowicon);
        sourceData.associationName && node.setAttribute('_association_name',sourceData.associationName);
        sourceData.deleteable && node.setAttribute('_deleteable', sourceData.deleteable);
        sourceData.required && node.setAttribute('_required', sourceData.required);
        editor.fire('lockSnapshot');
        editor.editable().insertText('\u200B');
        var defaultPlaceholder = '_';
        switch (sourceData.type) {
            case 'labelbox':
                node.setText(sourceData.name);
                editor.editable().insertElement(node);
                break;
            case 'newtextbox':
                var newtextbox = node.clone(true);
                sourceData.placeholder = sourceData.placeholder || defaultPlaceholder;
                newtextbox.addClass('new-textbox');
                newtextbox.setAttribute('_placeholder', sourceData.placeholder);
                var newtextPlaceholder = new CKEDITOR.dom.element('span');
                newtextPlaceholder.addClass('new-textbox-content');
                newtextPlaceholder.setAttribute('_placeholderText', true);
                newtextPlaceholder.setAttribute('contentEditable', 'true');
                newtextPlaceholder.setText(sourceData.placeholder);
                sourceData.cascade && newtextPlaceholder.setAttribute('_cascade', sourceData.cascade);
                sourceData.printHideCascade && newtextPlaceholder.setAttribute('_print_hide_cascade', sourceData.printHideCascade);
                sourceData.printHideCascadeValueType && newtextPlaceholder.setAttribute('_print_hide_cascade_value_type', sourceData.printHideCascadeValueType);
                sourceData.printHideCascadeValue && newtextPlaceholder.setAttribute('_print_hide_cascade_value', sourceData.printHideCascadeValue);
                sourceData.precision && newtextPlaceholder.setAttribute('_precision', sourceData.precision);
                sourceData.timetype && newtextPlaceholder.setAttribute('_timetype', sourceData.timetype);
                sourceData.texttype && newtextPlaceholder.setAttribute('_texttype', sourceData.texttype);
                sourceData.precision && newtextbox.setAttribute('_precision', sourceData.precision);
                sourceData.timetype && newtextbox.setAttribute('_timetype', sourceData.timetype);
                sourceData.texttype && newtextbox.setAttribute('_texttype', sourceData.texttype);

                newtextbox.append(newtextPlaceholder);
                editor.editable().insertElement(newtextbox);

                break;
            case 'timebox':

                node.setAttribute('_timeOption', sourceData.timeOption);
                if(sourceData.timeWidth) {
                    node.setAttribute('_timeWidth', sourceData.timeWidth);
                    node.setStyle('width',sourceData.timeWidth+'px');
                    node.setStyle('min-width',sourceData.timeWidth+'px');
                }
                if(sourceData.timePrintFormat){
                    node.setAttribute('_time_print_format', sourceData.timePrintFormat);
                }
                editor.editable().insertElement(node);
                break;
            case 'radiobox':
                for (var i = 0; i < sourceData.items.length; i++) {
                    var itemNode = new CKEDITOR.dom.element('span');
                    itemNode.setText('\u200B');
                    itemNode.addClass('fa');
                    itemNode.addClass('fa-circle-o');
                    itemNode.setAttribute('data-hm-node', sourceData.type);
                    itemNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    $(itemNode.$).on('click', function () {
                        _handleCascade(this);
                    });
                    node.append(itemNode);

                    var descNode = new CKEDITOR.dom.element('span');
                    descNode.setText('\u200B');
                    descNode.setAttribute('data-hm-node', 'labelbox');
                    descNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    descNode.setText(sourceData.items[i]);
                    node.append(descNode);

                    node.appendText('\u00a0');
                }

                node.setAttribute('data-hm-items', sourceData.datasourceItem);
                sourceData.radioStyle && node.setAttribute('_radioStyle', sourceData.radioStyle);
                sourceData.radioSelectType && node.setAttribute('_radio_select_type', sourceData.radioSelectType);
                editor.editable().insertElement(node);
                break;
            case 'checkbox':
                for (var i = 0; i < sourceData.items.length; i++) {
                    var itemNode = new CKEDITOR.dom.element('span');
                    itemNode.setText('\u200B');
                    itemNode.addClass('fa');
                    itemNode.addClass('fa-square-o');
                    itemNode.setAttribute('data-hm-node', sourceData.type);
                    itemNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    $(itemNode.$).on('click', function () {
                        _handleCascade(this);
                    });
                    node.append(itemNode);

                    var descNode = new CKEDITOR.dom.element('span');
                    descNode.setText('\u200B');
                    descNode.setAttribute('data-hm-node', 'labelbox');
                    descNode.setAttribute('data-hm-itemName', sourceData.items[i]);
                    descNode.setText(sourceData.items[i]);
                    node.append(descNode);
                    node.appendText('\u00a0');
                }

                node.setAttribute('data-hm-items', sourceData.datasourceItem);
                editor.editable().insertElement(node);
                break;
            case 'dropbox':
                node.setAttribute('data-hm-items', sourceData.datasourceItem);
                sourceData.selectType && node.setAttribute('_selectType', sourceData.selectType);
                sourceData.jointSymbol && node.setAttribute('_jointSymbol', sourceData.jointSymbol);
                editor.editable().insertElement(node);
                break;
            case 'cellbox':
                var td = editor.elementPath().contains('td');
                var th = editor.elementPath().contains('th');
                if(!td && th){
                    td = th;
                }
                if (td) {
                    td.setAttribute('data-hm-node', 'cellbox');
                    td.setAttribute('data-hm-name', sourceData.name);
                    td.setAttribute('data-hm-id', node.getAttribute('data-hm-id'));
                    sourceData.associationName && td.setAttribute('_association_name', sourceData.associationName);
                }else {
                    editor.showNotification('单元类型仅限于插入表格中');
                }
                break;
            case 'searchbox':
                node.setAttribute('_searchOption', sourceData.searchOption || '');
                node.setAttribute('_searchPair', sourceData.searchPair || '');
                node.setAttribute('_gradePair', sourceData.gradePair || '');
                node.setAttribute('_diagway_pair', sourceData.diagWayPair || '');
                // node.setAttribute('_diagway_no_pair', sourceData.diagWayNoPair);
                sourceData.isEdit && node.setAttribute('_isEdit', sourceData.isEdit);
                editor.editable().insertElement(node);
                break;
            case 'textboxwidget':
                node.addClass('textboxWidget-content');
                var wrapNode = new CKEDITOR.dom.element('span');
                wrapNode.addClass('textboxWidget');
                wrapNode.append(node);

                editor.insertElement(wrapNode);
                var widget = editor.widgets.initOn(wrapNode, 'textboxWidget');
                //editor.execCommand( 'textboxWidget' );
                break;
            case 'button':
                editor.editable().insertElement(node);
                break;
            default:
                editor.showNotification('请选择一种数据元类型');
                break;
        }

        // 模板制作时, 在最后一行 (无 br 的 p) 末尾添加数据元时如果没有零宽字符就没法聚焦到后面
        editor.editable().insertText('\u200B');
        editor.fire('unlockSnapshot');
    }
}

function _handleCascade(node, target) {
    var i;
    var otherNodes = $(editorIns.document.$)
        .find('[data-hm-name="' + node.getAttribute("data-hm-name") +
            '"][data-hm-node="' + node.getAttribute("data-hm-node") +
            '"][data-hm-itemName!="' + node.getAttribute("data-hm-itemName") + '"]');

    if ( node.getAttribute("data-hm-node") === "radiobox" ) {

        // 非选中的单选节点，隐藏所级联的内容
        for (i = 0; i < otherNodes.length; i++) {
            _cascade(otherNodes[i].getAttribute("data-hm-name"), otherNodes[i].getAttribute("data-hm-itemName"), "true");
        }

        // 选中的单选节点，显示内容
        _cascade(node.getAttribute("data-hm-name"), node.getAttribute("data-hm-itemName"), "false");

    }

    if ( node.getAttribute("data-hm-node") === "checkbox" ) {

        // 非选中的多选节点，保持原状态
        for (i = 0; i < otherNodes.length; i++) {
            _cascade(otherNodes[i].getAttribute("data-hm-name"), otherNodes[i].getAttribute("data-hm-itemName"),
                otherNodes[i].getAttribute("_selected") === "true" ? "false" : "true");
        }

        // 选中的多选节点，改变状态
        _cascade(node.getAttribute("data-hm-name"), node.getAttribute("data-hm-itemName"), node.getAttribute("_selected"));

    }

    if ( node.getAttribute("data-hm-node") === "dropbox" ) {

        if (node.getAttribute("data-hm-items") && node.getAttribute("data-hm-items").length > 0) {

            // 非选中的下拉选项，隐藏所级联的内容
            var items = node.getAttribute("data-hm-items").split("#");
            for (i = 0; i < items.length; i++) {
                if (items[i] !== target) {
                    _cascade(node.getAttribute("data-hm-name"), items[i],  "true");
                }
            }

            // 选中的下拉选项，显示内容
            _cascade(node.getAttribute("data-hm-name"), target, "false");
        }

    }

    function _cascade(nodeName, nodeItem, nodeSelected) {
        var _cascades = $(editorIns.document.$).find('[_cascade="' + nodeName + "_" + nodeItem + '"]');
        if (_cascades.length > 0) {
            for (var i = 0; i < _cascades.length; i++) {
                if ( _cascades[i].getAttribute("_placeholdertext") !== "true" ) {
                    if (nodeSelected === "true") {
                        $( _cascades[i] ).hide();
                    } else {
                        $( _cascades[i] ).show();
                    }
                }

            }
        }
    }
}
