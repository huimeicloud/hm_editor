/**
 * 文档生成器 (病历质控)
 */
commonHM.component['hmAi'].fnSub("composer", {
    init: function () {
        var _t = this;
        _t.qcAgentCode = 'N0MCMZL4J7362B'; // 病历质控大模型code
        _t.Url = _t.parent.Url;
        _t.winHeight = $('body').height();
    },
    /**
     *
     * @param {*} el
     * @param {
     *  type:1 错误
     *  type:2 缺失
     *  type:3 没写
     * } opts
     */
    showComposer: function (el, opts, offset) {
        var _t = this,
            editor = this.parent.editor;
        _t.opts = opts;
        if (_t.popupComposer || _t.parent.hasTask) {
            return;
        } else {
            _t.uucode = $(el).attr('uucode');
        }

        var $body = _t.$body = $(editor.document.getBody().$);
        _t.removePopup();
        _t.process = 1; // 1: 生成中 2: 生成完成
        _t.parent.hasTask = true;
        _t.popupComposer = $(el).popupMessage({
            message: '',
            // inside:true,
            type: 2,
            theam: 1,
            width: "380px",
            container: $body,
            inline: true
        });
        _t.popupComposer.container.attr('contenteditable', false).find('.sk-popup-container').renderTpl($docAi_tpl['docAi/tpl/compose'], opts);
        _t.popupComposer.setPostion(2, null, offset);
        _t.manageLableShow(opts.type == 3 ? 1 : 2);

        _t.composerAction();
    },


    /**
     * think content
     * flag: 1: 大模型解读+生成(到病历) 2: 大模型解读,3: 大模型解读+生成(到composer)
     * @param {*} content
     */
    markContent: function (onResultMessage) {
        var _t = this;
        var utils = _t.parent.utils;

        var thinkIndex = 0,
            resultIndex = 0;
        var converter = new showdown.Converter({
            tables: true,
            tasklists: true,
            strikethrough: true,
            ghCodeBlocks: true,
            smartIndentationFix: true,
            parseImgDimensions: true,
            simplifiedAutoLink: true,
            literalMidWordUnderscores: true,
            emoji: true
        });
        var thinkDiv = _t.popupComposer.container.find('.doc-composer-think'),
            thinkPanel = _t.popupComposer.container.find('.doc-composer-content').hide(),
            resultPanel = _t.popupComposer.container.find('.doc-composer-result').hide();
        var qcPatient = _t.opts.qcPatient || {},
            caseData = _t.opts.data || {};
        var agentInfo = caseData.problem.aiAgentInfo || {};
        var agentInfoParams = agentInfo.agentInputParams || {};
        var params = {
            agent_code: agentInfo.agentCode || _t.qcAgentCode,
            agent_id: agentInfo.agentId || 19,
            agent_name: agentInfo.agentName || "病历质控点-病历生成",
            new_chat: 0,
            dialogue_code: utils.getUUId(),
            stream_code: utils.getUUId(),
            record_id: qcPatient.recordId,
            problemId: caseData.problem.ruleInfo.code,
            ruleName: caseData.problem.name,
            remark: caseData.problem.detailsInfo,
            projecttype: caseData.problem.type + '',
            ruleLogic: caseData.problem.reason,
            record_type: caseData.cdssProgressType + '',
            customer_id: qcPatient.customerId,
            user_code: qcPatient.doctorGuid
        };
        for (var i in agentInfoParams) {
            params[i] = agentInfoParams[i];
        }
        utils.fetchData({
            data: params,
            onmessage: function (data, complate) {
                if (data) {
                    var thinkContent = '',
                        resultContent = '',
                        resultSuccess = false;

                    if (_t.opts.type == 1) {
                        if (/^<th(ink)*/i.test(data.trim())) {
                            var dataArr = data.split('</think>');
                            thinkContent = dataArr[0].replace('<think>', '');
                            resultContent = dataArr[1];
                            thinkPanel.show();
                        } else {
                            resultContent = data;
                            resultPanel.show();
                        }
                    } else if (_t.opts.type == 2) {
                        resultContent = data;
                    }
                    _t.clearAnswerInterId();
                    var rate = 50;
                    if (thinkContent && thinkIndex < thinkContent.length && resultContent) {
                        rate = 10;
                    }
                    _t.thinkInterId = setInterval(function () {
                        if (thinkContent && thinkIndex <= thinkContent.length) {
                            var thinkMessage = thinkContent.slice(0, thinkIndex++);
                            var html = converter.makeHtml(thinkMessage);
                            thinkDiv.html(html);
                            thinkPanel[0].scrollTo({
                                top: thinkPanel[0].scrollHeight,
                                // behavior: 'smooth'
                            });
                        } else if (resultContent) {
                            resultPanel.show();
                            var resMessage = resultContent.slice(0, resultIndex++);
                            var messageHtml = converter.makeHtml(resMessage);
                            if (resultIndex > resultContent.length) {
                                _t.clearAnswerInterId();
                                if (complate) {
                                    _t.chatComplate(1);
                                    resultSuccess = true;
                                }
                            }
                            //病历质控
                            if (params.agent_code == _t.qcAgentCode && caseData.problem.supportBackfill == 1) {
                                if (_t.opts.type == 1) {
                                    resultPanel.find('.doc-r-rec-rec').html($(messageHtml).html());
                                    onResultMessage && onResultMessage(messageHtml, resultSuccess);
                                } else {
                                    resultPanel.find('.doc-composer-result-detail').addClass('type-2').html(messageHtml);
                                    var recomend = _t.parent.utils.parseAIMarker(resMessage, 'recommend');
                                    onResultMessage && onResultMessage(recomend.content, recomend.isComplete);
                                }
                            } else {
                                resultPanel.find('.doc-composer-result-detail').html(messageHtml);
                            }
                        } else {
                            _t.clearAnswerInterId();
                            _t.chatComplate(1);
                        }
                    }, rate);
                }
            }
        });

    },
    /**
     * 清除定时器
     * @param {*} onlyThink:true 只结束思考
     */
    clearAnswerInterId: function (onlyThink) {
        var _t = this;
        if (_t.thinkInterId) {
            clearInterval(_t.thinkInterId);
            _t.thinkInterId = null;
        }

        if (_t.resultInterId && !onlyThink) {
            clearInterval(_t.resultInterId);
            _t.resultInterId = null;
        }
    },
    /**
     * 管理标签显示
     * model: 1: 大模型，2: 机器质控
     */
    manageLableShow: function (model) {
        var _t = this;
        var container = _t.popupComposer.container;
        var relEl = _t.popupComposer.relEl;
        var editContent = _t.getEditPanel();
        if (model == 1) { //大模型自动生成
            container.find('.btn-stop').addClass('popu-active');
            container.find('.doc-composer-chat').show();
            container.find('.doc-composer-qc').hide();
            if (_t.opts.type == 1) {
                // container.find('.doc-composer-result-detail').show();
                container.find('.doc-r-rec-od').text(_t.opts.data.surroundingText);
                _t.markContent(function (messageHtml, complate) {
                    if (complate) {
                        var jDom = $('<div>').html(messageHtml);
                        var currText = jDom.text();
                        var autoPanel = $('<span>').html(currText).attr({
                            'class': 'mc-auto-text',
                            'uucode': _t.uucode
                        })
                        autoPanel.insertAfter(relEl);
                        relEl.addClass('doc-warn-txt-del');
                    }
                });
            } else if (_t.opts.type == 2) { //缺失
                var currRecomend = '';
                _t.markContent(function (messageHtml, complate) {
                    if (messageHtml && currRecomend.length < messageHtml.length) {
                        currRecomend = messageHtml;
                        editContent.find('.doc-warn-hodler').remove();
                        _t.generateAutoText(editContent, messageHtml);
                    }
                });
            } else if (_t.opts.type == 3) { //没写
                // 删除病历质控大模型生成，改由mayson 通用接口 见generateMessage
                // _t.markContent(function(messageHtml){
                //     if(messageHtml){
                //         editContent.find('.doc-warn-hodler').remove();
                //         _t.generateAutoText(editContent,messageHtml);
                //     }

                // });
            }
        } else if (model == 2) { //机器质控
            container.find('.doc-composer-chat').hide();
            container.find('.doc-composer-qc').show();
        }
    },
    /**
     * 获取编辑内容区域
     * @returns
     */
    getEditPanel: function () {
        var _t = this;
        var relEl = _t.popupComposer.relEl; // 关联的dom元素
        var keyCode = relEl.attr('key-code');
        var progressGuid = relEl.attr('progress-guid');
        var $body = $(_t.parent.editor.document.getBody().$);
        var editPanel;
        if (_t.opts.type == 3) {
            editPanel = relEl;
        } else if (_t.opts.type == 2) {
            var widget = $body.find('div[data-hm-widgetid="' + progressGuid + '"]');
            var progressBody = widget.length ? widget : $body;
            editPanel = progressBody.find('span[data-hm-code="' + keyCode + '"]').children('.new-textbox-content');
        } else if (_t.opts.type == 1) {
            editPanel = relEl.closest('.new-textbox-content');
        }
        return editPanel;
    },
    /**
     * 生成自动文本
     * @param {*} editContent
     * @param {*} message
     */
    generateAutoText: function (editContent, message) {
        var _t = this;
        var uucode = _t.popupComposer.relEl.attr('uucode');

        var jDom = $('<div>').html(message);
        var currText = jDom.text();
        if (editContent.length) {
            var autoLabel = editContent.find('.mc-auto-text');
            if (autoLabel.length) {
                autoLabel.html(currText);
            } else {
                autoLabel = $('<span class="mc-auto-text" uucode="' + uucode + '"></span>');
                autoLabel.html(currText);
                editContent.removeAttr('_placeholdertext').append(autoLabel);
            }
            if (currText.length % 5 == 0) {
                var offset = _t.$body.offset();
                // _t.popupComposer.setPostion(2,null,{left:offset.left});
                _t.popupComposer.setPostion(2, null);

            }
            _t.documentScroll();
        }

    },
    documentScroll: function () {
        var _t = this;
        var $body = this.parent.editor.document.$.documentElement;
        var $container = _t.popupComposer.container;
        var pos = $container.offset(),
            containerHeight = $container.height();
        if (pos.top + containerHeight - $body.scrollTop + 150 > _t.winHeight) {
            $body.scrollTop = pos.top + containerHeight - _t.winHeight + 150;
        }
    },
    /**
     * 绑定事件
     */
    composerAction: function () {
        var _t = this;
        var utils = _t.parent.utils,
            container = _t.popupComposer.container,
            relEl = _t.popupComposer.relEl,
            editContent = _t.getEditPanel(),
            editor = this.parent.editor;
        //停止
        container.on('click', '.btn-stop', function () {
            var autoPanel = _t.getAutoPanel(editContent);
            utils.removeHighlights(autoPanel, false);
            utils.clearFetchData();
            _t.clearAnswerInterId();
            _t.chatComplate(2);
            _t.removePopup();
            _t.removeAiCorrectActive();
        }).on('click', '.icon-down', function () {
            if ($(this).hasClass('icon-show')) {
                container.find('.doc-composer-chat-body').hide();
            } else {
                var offset = _t.$body.offset();
                container.find('.doc-composer-chat-body').show();
                // container.css({
                //     width: _t.$body.outerWidth()-10,
                //     left:offset.left
                // }).find('.doc-composer-chat-body').show();
                _t.documentScroll();
            }
            $(this).toggleClass('icon-show');
        }).on('click', '.btn-confirm', function () { //保留
            var autoPanel = _t.getAutoPanel(editContent);
            if (_t.opts.type == 1) { //错误替换
                utils.removeHighlights(relEl[0]); // 删除旧的;
            } else if (_t.opts.type == 2) {
                _t.removeCurrWarnCase(_t.uucode); //移除当前问题点
            }
            utils.removeHighlights(autoPanel, true); // 新的保留内容;
            _t.removePopup();
        }).on('click', '.btn-cancel', function () { //弃用
            var autoPanel = _t.getAutoPanel(editContent);
            if (_t.opts.type == 1) { //错误替换
                relEl.removeClass('doc-warn-txt-del');
                // utils.removeHighlights(relEl[0],true); // 保留旧的
            }
            utils.removeHighlights(autoPanel, false);
            _t.removePopup();
            editor.editable().fire('togglePlaceHolder', {
                // showAllPlaceholder: true,
                // // 或者
                container: new CKEDITOR.dom.element(editContent.closest('p')[0]),
                // 或者
                $boundaryNewtextbox: editContent
            });
            _t.removeAiCorrectActive();
        }).on('click', '.d-btt-ignore', function () { //忽略
            _t.ignoreWarn($(this).attr('uucode'), _t.opts.type);

        }).on('click', '.d-btt-ai', function () { //大模型 
            _t.manageLableShow(1);
        }).on('click', '.doc-composer-qc-close,.btn-close', function () {
            _t.removeAiCorrectActive();
            _t.clearAnswerInterId();
            _t.removePopup();
        }).on('click', '.d-btt-backfill', function () { //质控推荐回写
            _t.qcWriteback();
        });
    },
    /**
     * 质控推荐回写
     */
    qcWriteback: function () {
        var _t = this;
        var relEl = _t.popupComposer.relEl;
        if (_t.opts.type == 1) {
            relEl.after(_t.opts.data.backfillContents);
            _t.parent.utils.removeHighlights(relEl[0]);
        } else if (_t.opts.type == 2) {
            var editContent = _t.getEditPanel();
            editContent.removeAttr('_placeholdertext').append(_t.opts.data.backfillContents);
            _t.removeCurrWarnCase(_t.uucode);
        }
        _t.removePopup();
    },
    getAutoPanel: function (editContent) {
        var _t = this;
        return editContent.find('.mc-auto-text[uucode="' + _t.uucode + '"]')[0];
    },
    /**
     * 忽略警告
     */
    ignoreWarn: function (uucode, type) {
        var _t = this;
        var utils = _t.parent.utils;
        var cachWarn = _t.parent.cachWarn;
        var warnData = cachWarn[uucode],
            qcPatient = cachWarn['patientInfo'];
        var _pWindow = parent.window;
        var aiServer = _pWindow.HMEditorLoader && _pWindow.HMEditorLoader.autherEntity && _pWindow.HMEditorLoader.autherEntity.aiServer;
        utils.request({
            url: aiServer+'/cdss/api/outer/mc/reminder/completed',
            data: {
                "customerId": qcPatient.customerId,
                "recordId": qcPatient.recordId,
                "ruleResult": "2",
                "recommendType": "1",
                "remark": warnData.problem.detailsInfo,
                "doctorGuid": "",
                "doctorName": "",
                "logicId": "",
                "problemId": warnData.problem.ruleInfo.code,
                "ruleCode": warnData.problem.ruleInfo.code
            },
            success: function () {
                if (type == 1) { //错误
                    utils.removeHighlights(_t.popupComposer.relEl[0], true);
                    _t.removePopup();
                } else if (type == 2) { //缺失
                    _t.removeCurrWarnCase(uucode);
                }
            }
        });
    },
    /**
     * 移除当前问题点
     * @param {*} uucode
     */
    removeCurrWarnCase: function (uucode) {
        var _t = this;
        var warnP = $(_t.parent.editor.document.getBody().$).find('.doc-warn-p');
        var el = warnP.find('.doc-warn-lack-title[uucode=' + uucode + ']');
        var pUnit = el.closest('p');
        el.closest('.doc-warn-lack').remove();
        if (pUnit.find('.doc-warn-lack').length == 0) {
            pUnit.remove();
        } else {
            pUnit.find('em').each(function (i, item) {
                $(item).html((i + 1) + '.');
            });
        }
    },
    /**
     * 对话完成
     */
    chatComplate: function (type) {
        var _t = this;
        var container = _t.popupComposer.container;
        container.find('.doc-composer-loading').hide();
        if (type == 1) { //完成
            container.find('.doc-composer-title').text('大模型思考完成');
            container.find('.btn-confirm').addClass('popu-active');
            container.find('.btn-cancel').addClass('popu-active');
            container.find('.btn-close').addClass('popu-active');
            container.find('.btn-stop').removeClass('popu-active');
        } else if (type == 2) { //终止
            container.find('.doc-composer-title').text('大模型思考终止');
            container.find('.btn-confirm').removeClass('popu-active');
            container.find('.btn-cancel').removeClass('popu-active');
            container.find('.btn-close').removeClass('popu-active');
            container.find('.btn-stop').removeClass('popu-active');
        }
    },
    removePopup: function () {
        var _t = this;
        if (_t.popupComposer) {
            _t.popupComposer.remove();
            _t.popupComposer = null;
        }
        _t.process = 2;
        _t.parent.hasTask = false;
    },
    removeAiCorrectActive: function () {
        var _t = this;
        _t.$body.find('.doc-ai-correct-active').removeClass('doc-ai-correct-active');
    }
});