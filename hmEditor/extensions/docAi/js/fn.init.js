commonHM.component['hmAi'].fn({
    init: function (editor) {
        var _t = this;
        _t.editor = editor;
        _t.editable = _t.editor.editable();
        _t.$body = $(_t.editor.document.getBody().$);
        _t.cachWarn = {}; //缓存警告信息
        _t.patientRecord = {};
        _t.hasTask = false; //是否存在任务 

        _t.patientRecord = {};
        _t.awekenAiWidget={}; // 唤醒AI的widget
        _t.bindWarnAcion();
    },
    initWarnInfo: function (data) {
        var _t = this;
        _t.cleanMark();
        var maysonBean = data; //_t.getQcData(_t.config.patientData.progressGuid);
        var _pWindow = parent.window;
        var aiServer = _pWindow.HMEditorLoader && _pWindow.HMEditorLoader.autherEntity && _pWindow.HMEditorLoader.autherEntity.aiServer;
        //获取警告信息
        _t.utils.request({
            url: aiServer+'/cdss/api/outer/wagon/emr/problems',
            data: maysonBean,
            success: function (result) {
                //缓存警告信息
                _t.cacheWarnInfo(result);
                _t.intWarnPanel(result);
                // 初始化提醒端消息功能
                _t.initReminder(result.messageList || []);
            }
        });
    },
    /**
     * 检查数据是否可生成
     */
    checkDataSource: function () {
        var _t = this;
        _t.$widget = _t.$body.find('div[data-hm-widgetid="' + _t.emrId + '"]');
        if (!_t.editorTool) {
            console.warn('editorTool is not available');
            return;
        }
        _t.editorTool.callCommand('checkDataSource', function (list) {
            console.log('ai返回的测试助手参数', list);
            list.forEach(function (item) {
                var el = _t.$widget.find('span[data-hm-code="' + item.nodeCode + '"]').children('.new-textbox-content').attr('generate', 1);
                if (el.attr('_placeholdertext')) {
                    var el = _t.$widget.find('span[data-hm-code="' + item.nodeCode + '"]').children('.new-textbox-content').attr('_placeholder', 'ctrl+/ 唤醒AI');
                    el.removeAttr('_placeholdertext').html('<span class="r-model-gen-remark">ctrl+/ 唤醒AI</span>');
                }
            });
            _t.awekenAiWidget[_t.emrId] = true;
            console.log('awekenAiWidget已唤醒的widget', _t.awekenAiWidget);
        })
    },
    /**
     * 初始化警告信息面板
     * @param {*} data
     */
    intWarnPanel: function (data) {
        var _t = this;
        // _t.editor.getUndoManager().lock(); // 锁定撤销管理器
        _t.editor.fire('lockSnapshot');

        (data.progerssProblemList || []).forEach(function (progress) {
            var progressGuid = progress.emrProgressNumber;
            //病程记录有多个，需要根据progressGuid找到对应的病程记录
            var $progreeContent = _t.getProgressContent(progressGuid);
            if ($progreeContent.length == 0) {
                return;
            }
            (progress.problemList || []).forEach(function (problem) {
                problem.sources.forEach(function (item) {
                    if (problem.type == 1) { //错误
                        _t.utils.findAndStyle($progreeContent, item.emrAttributeCode, item.surroundingText, {
                            'class': 'doc-warn-txt doc-warn-level-' + (problem.severityLevel || 1),
                            'uucode': item.uucode,
                            'rule-code': problem.ruleInfo && (problem.ruleInfo.code || ''),
                            'progress-guid': progressGuid,
                            'attr-code': item.emrAttributeCode
                        });
                    } else if (problem.type == 2) { //缺失
                        var el = $progreeContent.find('span[data-hm-code="' + item.emrAttributeCode + '"]').closest('p');
                        var ruleContent = $progreeContent.find('p[attr-code="' + item.emrAttributeCode + '"]');
                        // var currSource = '<span class="doc-warn-lack"><span class="doc-warn-title">'+problem.detailsInfo+'</span></span>';
                        var index = ruleContent.children().length + 1;
                        var lackHtml = $.getTpl($docAi_tpl['docAi/tpl/lack'], {
                            problem: problem,
                            item: item,
                            index: index + '.'
                        });
                        if (ruleContent.length) {
                            ruleContent.append(lackHtml);
                        } else {
                            var warnP = $('<p attr-code="' + item.emrAttributeCode + '"  contenteditable="false"></p>');
                            warnP.addClass('doc-warn-p');
                            warnP.append(lackHtml);
                            warnP.insertAfter(el);
                        }

                    } else if (problem.type == 3) { //没写
                        // var el =_t.$body.find('span[data-hm-code="'+item.emrAttributeCode+'"]');
                        // el.children('.new-textbox-content').attr('mc-type',3).removeClass('check-error-backcolor')
                        // .html('<span class="doc-warn-hodler">alt+/自动生成文本</span>');
                        // _t.editable.fire('togglePlaceHolder',  {
                        //         // showAllPlaceholder: true,
                        //         // // 或者
                        //         container: new CKEDITOR.dom.element(el.closest('p')[0]),
                        //         // 或者
                        //         $boundaryNewtextbox: el.children('.new-textbox-content')
                        //     }
                        // );
                    }
                })

            });


        });
        _t.editor.fire('unlockSnapshot');
        // _t.editor.getUndoManager().unlock(); // 解锁撤销管理器
        _t.editor.resetUndo();
    },
    /**
     * 绑定警告信息事件
     */
    bindWarnAcion: function () {
        var _t = this;

        _t.$body.on('keydown', '.new-textbox-content', function (e) {
            if (!$(this).attr('generate')) {
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '/') { //ctrl + /
                _t.generator.generateMessage(this, 1);
            }
            if (e.key === 'Control' && e.timeStamp - _t.lastCtrlPress < 500) { //双击ctrl
                _t.lastCtrlPress = 0;
                 _t.generator.generateMessage(this, 2);
            } else if (e.key === 'Control') {
                _t.lastCtrlPress = e.timeStamp;
                return; 
            }
        }).on('click', '.doc-warn-txt', function (event) {
            var ele = $(this);
            var warnData = _t.cachWarn[ele.attr('uucode')];
            var patientInfo = _t.cachWarn['patientInfo'];
            var offset = ele.offset(),
                elLeft = ele[0].offsetLeft,
                height;
            var offsetLeft, offsetTop;
            if (elLeft - offset.left > 100) {
                if (event.offsetY > 20) {
                    offsetLeft = offset.left;
                } else {
                    offsetLeft = elLeft - 10;
                    height = 20;
                }

            }
            _t.composer.showComposer(ele[0], {
                type: 1,
                data: warnData,
                qcPatient: patientInfo
            });
        }).on('click', '.doc-warn-lack-title', function () {
            var ele = $(this);
            var warnData = _t.cachWarn[ele.attr('uucode')];
            var patientInfo = _t.cachWarn['patientInfo'];
            _t.composer.showComposer(ele[0], {
                type: 2,
                data: warnData,
                qcPatient: patientInfo
            });
        }).on('click', '.doc-warn-lack-ignore', function () {
            var ele = $(this);
            _t.composer.ignoreWarn(ele.attr('uucode'), 2);
        }).on('click', '.r-model-gen-remark', function () {
            _t.utils.focusInputFirst(this);
        }).on('click', '.r-model-gen-text', function () {
            _t.generator.reOpenPopupProgress(this);
        }).on('click', function (e) {
            _t.editorTool && _t.editorTool.callCommand('destoryGenPopup');
            if (_t.generator.progressFlag != 1) {
                var jTar = $(e.target).closest('p');
                // 获取所有子元素
                var $children = jTar.find('.r-model-gen-text');
                var targetEl = null;
                var x = e.clientX;
                var y = e.clientY;

                // 遍历所有子元素，找到最接近点击位置的元素
                $children.each(function () {
                    var rect = this.getBoundingClientRect();
                    var rects = this.getClientRects();
                    // 第一行的位置信息
                    var firstLineRect = rects[0];
                    if (y >= firstLineRect.top && y <= firstLineRect.bottom) {
                        if (x > firstLineRect.left) {
                            targetEl = this;
                            return false; // 跳出循环
                        }
                    } else if (y >= rect.top && y <= rect.bottom) {
                        // 如果点击位置在元素左侧
                        if (x <= rect.right) {
                            targetEl = this;
                            return false; // 跳出循环
                        }
                    }
                });
                if (targetEl) {
                    _t.generator.reOpenPopupProgress(targetEl);
                } else {
                    _t.generator.closePopup();
                }

            }
        });
        _t.editor.document.$.body.onscroll = function (e) {
            _t.generator.setPosition();
        }
    },
    /**
     * 缓存警告信息
     */
    cacheWarnInfo: function (data) {
        var _t = this;
        //文书problem
        (data.progerssProblemList || []).forEach(function (item) {
            var progress = {
                "emrProgressNumber": item.emrProgressNumber,
                'emrProgressName': item.emrProgressName,
            }

            item.problemList.forEach(function (p) {
                var problem = {
                    "ruleCode": p.ruleCode,
                    "name": p.name,
                    "type": p.type,
                    "severityLevel": p.severityLevel,
                    "detailsInfo": p.detailsInfo,
                    "reason": p.reason,
                    "ruleInfo": p.ruleInfo,
                    "supportAi": p.supportAi, //是否支持AI：1.支持 2.不支持
                    "supportBackfill": p.supportBackfill, //是否支持回填：1.支持 2.不支持
                    "aiAgentInfo": p.aiAgentInfo
                }
                problem.progress = progress;
                p.sources.forEach(function (s, i) {
                    var uucode = s.uucode = _t.utils.getUUId(i);
                    _t.cachWarn[uucode] = {
                        "cdssProgressId": s.cdssProgressId,
                        "cdssProgressType": s.cdssProgressType,
                        "cdssAttributeId": s.cdssAttributeId,
                        "emrProgressNumber": s.emrProgressNumber,
                        "emrProgressName": s.emrProgressName,
                        "emrAttributeCode": s.emrAttributeCode,
                        "emrAttributeName": s.emrAttributeName,
                        "surroundingText": s.surroundingText,
                        "backfillContents": s.backfillContents,
                        uucode: uucode
                    }
                    _t.cachWarn[uucode].problem = problem;
                });
            });
        });
        // header 消息
        (data.messageList || []).forEach(function (item, i) {
            var uucode = item.uucode = _t.utils.getUUId(i) + '_h';
            _t.cachWarn[uucode] = item;
        });
        _t.cachWarn['patientInfo'] = data.patientInfo; //qc 患者基本信息
    },
    getProgressContent: function (emrId) {
        var _t = this;
        var $progreeContent;
        if (emrId) {
            $progreeContent = _t.$body.find('div[data-hm-widgetid="' + emrId + '"]');
        } else {
            $progreeContent = _t.$body;
        }
        return $progreeContent;
    },
    cleanMark: function (emrId) {
        var _t = this;

        _t.cachWarn = {};
        var $progreeContent = _t.getProgressContent(); //清空所有

        $progreeContent.find('.doc-warn-p').remove();
        //错误提示
        $progreeContent.find('.doc-warn-txt').each(function (i, item) {
            _t.utils.removeHighlights(item, true); // 保留旧的
        });
        $progreeContent.find('.mc-auto-text').remove();

        $progreeContent.find('.r-model-gen-text,.r-model-gen-remark').each(function (i, item) {
            var $item = $(item);
            var inputArea = $item.closest('.new-textbox-content').removeAttr('generate').attr('_placeholdertext', true);
            $(item).remove();
            _t.generator.restoreBlankContent(inputArea);
        });
        //header 消息
        $progreeContent.find('.doc-reminder').remove();

        if (_t.composer) {
            _t.composer.removePopup();
        }

    },
    getQcData: function (emrId) {
        var _t = this;
        // var emrId = emrId||_t.$body.find('div[data-hm-widgetid]').first().attr('data-hm-widgetid');
        // _t.currQcEmrId = emrId;//当前质控病历ID
        var patient = _t.patientRecord;
        var progressNoteList = [];
        _t.$body.find('div[data-hm-widgetid]').each(function (i, item) {
            var $widget = $(item);
            var emrId = $widget.attr('data-hm-widgetid');
            var progress = _t.getProgress(emrId, $widget.text());
            progressNoteList.push(progress);
        });

        var age, ageType;
        if (patient['年龄']) {
            age = patient['年龄'].replace(/岁|月|天/, function (p1) {
                ageType = p1;
                return '';
            });
        }
        var maysonBean = {
            userGuid: patient['患者ID'],
            serialNumber: patient['住院号'],
            caseNo: patient['病案号'],
            currentBedCode: patient['床位号'],
            patientName: patient['姓名'],
            doctorGuid: patient['主治医生ID'],
            doctorName: patient['主治医生姓名'],
            admissionTime: _t.utils.formatDate(patient['入院时间'], 'yyyy-MM-dd HH:mm:ss'),
            // admissionTime:patient['入院时间'],
            inpatientDepartment: patient['科室名称'],
            inpatientArea: patient['病区名称'],
            inpatientDepartmentId: patient['科室ID'],
            divisionId: patient['院区编码'],
            pageSource: '2', // 病历文书
            openInterdict: 0,
            triggerSource: 1,
            patientInfo: {
                gender: patient['性别'],
                birthDate: _t.utils.formatDate(patient['出生日期'], 'yyyy-MM-dd'),
                age: age,
                ageType: ageType,
                maritalStatus: patient['婚姻状况'] == '已婚' ? 1 : 0,
                pregnancyStatus: patient['孕周'] ? 1 : 0

            },
            progressNoteList: progressNoteList
        }
        return maysonBean;
    },
    /**
     * 获取病历文书
     * @param {*} emrId
     * @param {*} text
     * @returns
     */
    getProgress: function (emrId, text) {
        var _t = this;
        var progress;
        _t.patientRecord.children.forEach(function (dir) {
            dir.children.forEach(function (child) {
                var record = child.chooseEmrRecord;
                if (record['病历ID'] == emrId) {
                    progress = {
                        progressGuid: record['病历ID'],
                        progressType: (_t.RecordType[record['模板ID']] || {}).cdssRecordType,
                        progressTypeName: record['模板别名'],
                        progressTitleName: record['病历名称'],
                        // recordTime:_t.utils.formatDate(record['创建时间'],'yyyy-MM-dd HH:mm:ss'),  //时间戳
                        recordTime: record['创建时间'], //时间戳
                        doctorGuid: record['创建人ID'],
                        doctorName: record['创建人姓名'],
                        msgType: 0,
                        progressMessage: text
                    };
                }
            });
        });
        return progress;
    },
    /**
     * 清除AI生成标记，恢复默认提示
     */
    clearGenerateRemark: function () {
        var _t = this;
        var $body = $(_t.editor.document.getBody().$);
        _t.awekenAiWidget = {}; // 清空唤醒AI的widget
        $body.find('.new-textbox-content').each(function (i,ele) {
            if ($(ele).attr('generate') == '1' && $(ele).find('.r-model-gen-remark').length > 0) {
                $(ele).find('.r-model-gen-remark').remove();
                var _placeholder = $(ele).parent().attr('_placeholder');
                $(ele).attr('_placeholder', _placeholder);
                $(ele).attr('_placeholdertext', true);
                if (_placeholder) {
                    $(ele).html(_placeholder);
                }
            }
        });
    }
})