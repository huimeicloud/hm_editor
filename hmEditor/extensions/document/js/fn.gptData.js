/* global $document_tpl */
commonHM.component['documentModel'].fn({
    /**
     * 整份病历生成主流程
     * @param {Object} params 生成参数
     */
    generateDocumentLLM: function (params) {
        var _t = this;
        var prevTask = _t.generateDocumentTaskState;

        // 同一时刻只允许存在一个整份病历生成任务，避免弹层、请求和状态相互覆盖。
        if (prevTask && prevTask.running) {
            console.error('generateDocumentLLM: 当前已有进行中的整份病历生成任务');
            return;
        }

        // 若残留旧弹层但任务已结束，先做一次兜底清理，保证本次流程从干净状态开始。
        if (prevTask && prevTask.overlay) {
            _t._destroyGenDocOverlay(prevTask);
            _t._cleanupGenDocTask(prevTask);
        }

        var taskState = _t._createGenDocTask(params);
        _t.generateDocumentTaskState = taskState;
        _t._openGenDocOverlay(taskState);
        _t._renderGenDocLoading(taskState);

        var authContext = _t._getGenDocAuth();
        if (!authContext || !authContext.aiServer) {
            _t._failGenDoc(taskState, 'generateDocumentLLM: 未获取到 AI 服务地址');
            return;
        }

        var headers = _t._buildGenDocHeaders(authContext.autherEntity);
        if (!headers) {
            _t._failGenDoc(taskState, 'generateDocumentLLM: 缺少鉴权信息');
            return;
        }

        taskState.authContext = authContext;
        taskState.headers = headers;

        // 接口 1 负责生成后续流式生成所需的上下文信息。
        var agentPayload = _t._buildAgentChatPayload(taskState);
        if (!agentPayload) {
            _t._failGenDoc(taskState, 'generateDocumentLLM: 无法组装接口 1 请求参数');
            return;
        }

        taskState.agentPayload = agentPayload;
        _t._requestGenDocAgent(taskState);
    },

    /**
     * 初始化整份病历生成任务状态对象
     * @param {Object} params 生成参数
     * @returns {Object}
     */
    _createGenDocTask: function (params) {
        return {
            running: true,
            cancelledByUser: false,
            stoppedByUser: false,
            streamStarted: false,
            streamCompleted: false,
            state: 'loading',
            docCode: params.docCode,
            dialogueCode: this._genDocUUID(10, 36),
            streamCode: this._genDocUUID(10, 36),
            streamContent: '',
            typedContent: '',
            autoApply: this._getGenDocAutoApplyPref(),
            agentResult: null,
            agentPayload: null,
            agentRequest: null,
            bodyData: null,
            draftDataList: null,
            sseSource: null,
            overlay: null,
            mask: null,
            typingTimer: null,
            autoScrollPaused: false,
            authContext: null,
            headers: null,
            mountContainer: null,
            containerPositionPatched: false,
            originalContainerPosition: '',
            params: $.extend({}, params)
        };
    },

    /**
     * 生成用于会话和流式请求的随机标识
     * @param {number} min 最小随机长度
     * @param {number} max 最大随机长度
     * @returns {string}
     */
    _genDocUUID: function (min, max) {
        var returnStr = "",
            range = (max ? Math.round(Math.random() * (max - min)) + min : min),
            charStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < range; i++) {
            var index = Math.round(Math.random() * (charStr.length - 1));
            returnStr += charStr.substring(index, index + 1);
        }
        return returnStr + new Date().getTime();
    },

    /**
     * 获取自动回填开关的本地存储 key
     * @returns {string}
     */
    _getGenDocAutoApplyStorageKey: function () {
        return 'hmEditor.generateDocument.autoApply';
    },

    /**
     * 读取自动回填开关的上次选择
     * @returns {boolean}
     */
    _getGenDocAutoApplyPref: function () {
        var storage;
        var rawValue;

        try {
            storage = window.localStorage;
            rawValue = storage && storage.getItem(this._getGenDocAutoApplyStorageKey());
        } catch (error) {
            rawValue = null;
        }

        if (rawValue == null || rawValue === '') {
            return false;
        }

        return rawValue === '1' || rawValue === 'true';
    },

    /**
     * 持久化自动回填开关选择
     * @param {boolean} enabled 是否开启自动回填
     */
    _saveGenDocAutoApplyPref: function (enabled) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(this._getGenDocAutoApplyStorageKey(), enabled ? '1' : '0');
            }
        } catch (error) {}
    },

    /**
     * 更新当前任务的自动回填状态并同步到界面
     * @param {Object} taskState 当前任务状态
     * @param {boolean} enabled 是否开启自动回填
     */
    _setGenDocAutoApply: function (taskState, enabled) {
        if (!taskState) {
            return;
        }

        taskState.autoApply = !!enabled;
        this._saveGenDocAutoApplyPref(taskState.autoApply);
        this._syncGenDocFooter(taskState);
    },


    /**
     * 从父窗口获取 AI 服务地址与鉴权信息
     * @returns {{autherEntity: Object|null, aiServer: string|undefined}}
     */
    _getGenDocAuth: function () {
        var _pWindow = parent.window;
        var autherEntity = _pWindow.HMEditorLoader && _pWindow.HMEditorLoader.autherEntity;
        return {
            autherEntity: autherEntity || null,
            aiServer: autherEntity && autherEntity.aiServer
        };
    },

    /**
     * 组装整份病历生成请求头
     * @param {Object} autherEntity 鉴权实体
     * @returns {Object|null}
     */
    _buildGenDocHeaders: function (autherEntity) {
        var headers = {
            'Content-Type': 'application/json'
        };

        if (autherEntity && autherEntity.authToken) {
            headers.Authorization = 'Bearer ' + autherEntity.authToken;
            return headers;
        }

        if (autherEntity && autherEntity.huimei_id) {
            headers.huimei_id = autherEntity.huimei_id;
            return headers;
        }

        return null;
    },

    /**
     * 组装接口 1 的请求参数
     * @param {Object} taskState 当前任务状态
     * @returns {Object|null}
     */
    _buildAgentChatPayload: function (taskState) {
        var autherEntity = taskState && taskState.authContext && taskState.authContext.autherEntity;
        if (!autherEntity) {
            return null;
        }

        return $.extend({}, taskState.params, {
            dialogue_code: taskState.dialogueCode,
            stream_code: taskState.streamCode,
            docCode: taskState.docCode,
            v: new Date().getTime()
        });
    },

    /**
     * 清洗接口返回的 prompt 文本首尾换行
     * @param {string} agentQuery 智能体返回的查询内容
     * @returns {string}
     */
    _normalizeAgentQuery: function (agentQuery) {
        if (agentQuery == null) {
            return '';
        }
        return agentQuery.replace(/^[\n\r]+|[\n\r]+$/g, '');

    },

    /**
     * 基于接口 1 返回值组装接口 2 的流式请求参数
     * @param {Object} taskState 当前任务状态
     * @returns {Object|null}
     */
    _buildStreamPayload: function (taskState) {
        if (!taskState || !taskState.agentPayload) {
            return null;
        }

        var agentResult = taskState.agentResult;
        var agentBody = agentResult && agentResult.body && typeof agentResult.body === 'object' ? agentResult.body : null;
        var payload = $.extend({}, taskState.agentPayload);

        payload.dialogue_code = taskState.dialogueCode;
        payload.stream_code = taskState.streamCode;
        payload.docCode = taskState.docCode;
        payload.prompt = this._normalizeAgentQuery(agentBody && agentBody.agent_query);
        delete payload.agent_query;

        return payload;
    },

    /**
     * 发起整份病历生成的首个同步请求
     * @param {Object} taskState 当前任务状态
     */
    _requestGenDocAgent: function (taskState) {
        var _t = this;
        var url = taskState.authContext.aiServer + '/aigc/recommend/cdss_agent_chat';

        taskState.agentRequest = $.ajax({
            type: 'POST',
            url: url,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(taskState.agentPayload),
            headers: taskState.headers,
            success: function (res) {
                if (taskState.cancelledByUser) {
                    return;
                }

                if (!_t._isGenDocAjaxSuccess(res)) {
                    _t._failGenDoc(taskState, _t._getGenDocErrMsg(res) || 'generateDocumentLLM: 接口 1 请求失败');
                    return;
                }

                taskState.agentResult = res;

                // 接口 1 成功后，立刻基于返回上下文拼出接口 2 的 SSE 请求参数。
                var streamPayload = _t._buildStreamPayload(taskState);
                if (!streamPayload) {
                    _t._failGenDoc(taskState, 'generateDocumentLLM: 无法组装接口 2 请求参数');
                    return;
                }

                _t._startGenDocStream(taskState, streamPayload);
            },
            error: function (xhr, textStatus) {
                if (taskState.cancelledByUser || textStatus === 'abort') {
                    return;
                }
                _t._failGenDoc(taskState, _t._getGenDocErrMsg(xhr) || 'generateDocumentLLM: 接口 1 请求失败');
            },
            complete: function () {
                taskState.agentRequest = null;
            }
        });
    },

    /**
     * 判断普通 Ajax 响应是否成功
     * @param {Object} res 接口响应
     * @returns {boolean}
     */
    _isGenDocAjaxSuccess: function (res) {
        if (!res || typeof res !== 'object') {
            return true;
        }
        if (res.body && typeof res.body === 'object' && res.body.dialogue_error_flag) {
            return false;
        }
        if (res.code !== undefined) {
            return String(res.code) === '200' || String(res.code) === '0';
        }
        if (res.head && res.head.error !== undefined) {
            return String(res.head.error) === '0';
        }
        if (res.success !== undefined) {
            return !!res.success;
        }
        return true;
    },

    /**
     * 启动整份病历流式生成请求
     * @param {Object} taskState 当前任务状态
     * @param {Object} streamPayload 流式请求参数
     */
    _startGenDocStream: function (taskState, streamPayload) {
        var _t = this;

        if (typeof window.SSE !== 'function') {
            _t._failGenDoc(taskState, 'generateDocumentLLM: SSE 不可用');
            return;
        }

        var source = new SSE(taskState.authContext.aiServer + '/aigc/recommend/cdss_stream_chat_v2', {
            method: 'POST',
            headers: taskState.headers,
            payload: JSON.stringify(streamPayload)
        });

        taskState.sseSource = source;

        source.onmessage = function (event) {
            if (taskState.cancelledByUser || taskState.stoppedByUser) {
                return;
            }

            var messageData = _t._parseGenDocStreamMsg(event && event.data);
            if (!messageData) {
                return;
            }

            if (messageData.body !== undefined) {
                // 保留最近一次 body，用于 onend 后抽取最终业务结果。
                taskState.bodyData = messageData.body;
            }

            if (messageData.dialogueCode) {
                // 部分场景下后端会回写新的会话号，这里同步到任务状态。
                taskState.dialogueCode = messageData.dialogueCode;
            }

            if (messageData.content) {
                // streamContent 存完整文本，typedContent 只负责“渐显”显示。
                taskState.streamContent += messageData.content;
                if (!taskState.streamStarted) {
                    taskState.streamStarted = true;
                    taskState.state = 'streaming';
                }
                _t._renderGenDocStream(taskState);
                _t._ensureGenDocTyping(taskState);
            }
        };

        source.onend = function () {
            if (taskState.cancelledByUser) {
                _t._cleanupGenDocTask(taskState);
                return;
            }
            if (taskState.stoppedByUser) {
                return;
            }
            // 部分运行环境（如 SDK 子 iframe 内与 vendor/sse 事件分片顺序差异）onmessage 未实际触发，但 XHR 已能读全量 responseText。
            // 在 onend 前从 xhr 回退解析 `data: {...}`，与 onmessage 共用 _parseGenDocStreamMsg，避免无 body/无流式 UI 时整轮失败。
            _t._applyGenDocSseXhrFallbackIfNeeded(taskState, source);
            taskState.streamCompleted = true;
            _t._finishGenDoc(taskState);
        };

        source.onerror = function (err) {
            if (taskState.cancelledByUser || taskState.stoppedByUser) {
                return;
            }
            _t._failGenDoc(taskState, _t._getGenDocErrMsg(err) || 'generateDocumentLLM: 流式生成失败');
        };

        source.stream();
    },

    /**
     * 当 onmessage 未将业务数据注入 taskState 时，从已完成的 XHR 文本中解析 SSE 的 `data: {json}`（与 onmessage 路径一致）
     * @param {{ bodyData?: Object, streamContent: string, streamStarted?: boolean, state: string, overlay?: * }} taskState
     * @param {{ xhr?: XMLHttpRequest }} source vendor/sse 实例
     */
    _applyGenDocSseXhrFallbackIfNeeded: function (taskState, source) {
        var _t = this;
        if (!taskState || taskState.bodyData) {
            return;
        }
        if (!source || !source.xhr) {
            return;
        }
        var raw = source.xhr.responseText;
        if (!raw || typeof raw !== 'string' || raw.length < 2) {
            return;
        }
        var dataLines = _t._splitGenDocSseDataJsonStrings(raw);
        for (var i = 0; i < dataLines.length; i++) {
            var messageData = _t._parseGenDocStreamMsg(dataLines[i]);
            if (!messageData) {
                continue;
            }
            if (messageData.body !== undefined) {
                taskState.bodyData = messageData.body;
            }
            if (messageData.dialogueCode) {
                taskState.dialogueCode = messageData.dialogueCode;
            }
            if (messageData.content && !String(taskState.streamContent || '').length) {
                taskState.streamContent = messageData.content;
                if (!taskState.streamStarted) {
                    taskState.streamStarted = true;
                    taskState.state = 'streaming';
                }
                _t._renderGenDocStream(taskState);
                _t._ensureGenDocTyping(taskState);
            }
        }
    },

    /**
     * 从 SSE 全文中抽取每条 `data:` 后首个 `{...}` JSON 子串（\r\n\r\n 为 event 分隔；单行 `data: {json}` 常见）
     * @param {string} text
     * @returns {string[]}
     */
    _splitGenDocSseDataJsonStrings: function (text) {
        var out = [];
        if (!text) {
            return out;
        }
        var parts = String(text).split(/\r\n\r\n|\n\n/);
        for (var p = 0; p < parts.length; p++) {
            var part = (parts[p] || '').replace(/^\s+|\s+$/g, '');
            if (!part) {
                continue;
            }
            var lines = part.split(/\r\n|\n/);
            for (var L = 0; L < lines.length; L++) {
                var line = lines[L];
                var m = /^\s*data:\s*(.*)$/.exec(line);
                if (m) {
                    var after = m[1];
                    if (after && after.indexOf('{') >= 0) {
                        var j = this._genDocBalanceJsonFrom(after);
                        if (j) {
                            out.push(j);
                        }
                    }
                }
            }
        }
        return out;
    },

    _genDocBalanceJsonFrom: function (s) {
        if (!s || s.indexOf('{') < 0) {
            return null;
        }
        var from = s.indexOf('{');
        var depth = 0;
        for (var k = from; k < s.length; k++) {
            var c = s.charAt(k);
            if (c === '{') { depth++; }
            else if (c === '}') { depth--; if (depth === 0) { return s.substring(from, k + 1); } }
        }
        return null;
    },

    _parseGenDocStreamMsg: function (rawData) {
        if (!rawData) {
            return null;
        }
        var messageData;
        try {
            messageData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch (error) {
            console.error('generateDocumentLLM: 解析流式消息失败', error,rawData);
            return null;
        }

        return {
            contentType: messageData.content_type,
            content: messageData.content || '',
            body: messageData.body,
            dialogueCode: messageData.dialogue_code || (messageData.body && messageData.body.dialogue_code)
        };
    },

    /**
     * 确保逐字输出定时器已启动
     * @param {Object} taskState 当前任务状态
     */
    _ensureGenDocTyping: function (taskState) {
        var _t = this;
        if (taskState.typingTimer) {
            return;
        }
        taskState.typingTimer = setInterval(function () {
            _t._flushGenDocTyping(taskState, false);
        }, 24);
    },

    /**
     * 按节奏刷新流式文本的打字机展示
     * @param {Object} taskState 当前任务状态
     * @param {boolean} flushAll 是否立即输出全部内容
     */
    _flushGenDocTyping: function (taskState, flushAll) {
        if (!taskState || taskState.cancelledByUser) {
            this._stopGenDocTyping(taskState);
            return;
        }

        if (flushAll) {
            taskState.typedContent = taskState.streamContent;
        } else {
            var remaining = taskState.streamContent.length - taskState.typedContent.length;
            if (remaining > 0) {
                // 用小步长追赶真实流式内容，兼顾“打字感”和渲染开销。
                var step = Math.min(Math.max(remaining, 1), 8);
                taskState.typedContent += taskState.streamContent.slice(taskState.typedContent.length, taskState.typedContent.length + step);
            }
        }

        this._renderGenDocStream(taskState);

        if (taskState.typedContent.length >= taskState.streamContent.length) {
            this._stopGenDocTyping(taskState);
        }
    },

    /**
     * 停止打字机效果定时器
     * @param {Object} taskState 当前任务状态
     */
    _stopGenDocTyping: function (taskState) {
        if (taskState && taskState.typingTimer) {
            clearInterval(taskState.typingTimer);
            taskState.typingTimer = null;
        }
    },

    /**
     * 获取 Markdown 转 HTML 转换器实例
     * @returns {Object|null}
     */
    _getGenDocMdConverter: function () {
        if (this._generateDocumentMarkdownConverter) {
            return this._generateDocumentMarkdownConverter;
        }

        if (typeof window.showdown === 'undefined' || typeof window.showdown.Converter !== 'function') {
            return null;
        }

        this._generateDocumentMarkdownConverter = new window.showdown.Converter({
            tables: true,
            tasklists: true,
            strikethrough: true,
            ghCodeBlocks: true,
            smartIndentationFix: true,
            parseImgDimensions: true,
            simplifiedAutoLink: true,
            literalMidWordUnderscores: true,
            emoji: true,
            simpleLineBreaks: true,
            smartLists: true,
            openLinksInNewWindow: true
        });

        return this._generateDocumentMarkdownConverter;
    },

    /**
     * 对纯文本做 HTML 转义
     * @param {string} text 原始文本
     * @returns {string}
     */
    _escapeGenDocHtml: function (text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * 将流式返回内容编译为预览 HTML
     * @param {string} text 原始 Markdown 文本
     * @returns {string}
     */
    _compileGenDocMd: function (text) {
        if (text == null || text === '') {
            return '';
        }

        var sourceText = String(text)
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // 只收敛模型文本里的字面量 \n\n，避免误伤真实段落换行。
            .replace(/(?:\\n){2,}/g, '\\n')
            .replace(/\\n/g, '\n');
        var fenceMatches = sourceText.match(/```/g);
        var converter = this._getGenDocMdConverter();
        var renderText;

        sourceText = sourceText
            .replace(/<think>/g, '\n> 思考过程\n>\n')
            .replace(/<\/think>/g, '\n');
        // 预览流式代码块时，临时补齐未闭合围栏，避免中途整段渲染失真。
        if (fenceMatches && fenceMatches.length % 2 === 1) {
            sourceText += '\n```';
        }

        if (!converter) {
            return this._stripGenDocCodeSpans(this._escapeGenDocHtml(sourceText).replace(/\n/g, '<br>'));
        }

        renderText = this._escapeGenDocListSyntax(sourceText);

        try {
            return this._stripGenDocCodeSpans(converter.makeHtml(renderText));
        } catch (error) {
            console.error('generateDocumentLLM: Markdown 转换失败', error);
            return this._stripGenDocCodeSpans(this._escapeGenDocHtml(sourceText).replace(/\n/g, '<br>'));
        }
    },

    /**
     * 清理渲染结果中的冗余代码标记
     * @param {string} html 渲染后的 HTML
     * @returns {string}
     */
    _stripGenDocCodeSpans: function (html) {
        if (!html) {
            return '';
        }

        var $container = $('<div></div>').html(String(html));
        $container.find('span.n-r-code').remove();
        return $container.html();
    },

    /**
     * 转义 Markdown 列表语法，避免被渲染为 ol/ul，同时保留原始编号和符号
     * @param {string} text 原始 Markdown 文本
     * @returns {string}
     */
    _escapeGenDocListSyntax: function (text) {
        var inFence = false;

        return String(text || '').split('\n').map(function (line) {
            if (/^\s*```/.test(line)) {
                inFence = !inFence;
                return line;
            }

            if (inFence) {
                return line;
            }

            return line
                .replace(/^(\s*(?:>\s*)*)(\d+)\.\s+/g, '$1$2\\. ')
                .replace(/^(\s*(?:>\s*)*)([-+*])\s+/g, '$1\\$2 ');
        }).join('\n');
    },

    /**
     * 在流式生成结束后校验并回填 AI 草稿
     * @param {Object} taskState 当前任务状态
     */
    _finishGenDoc: function (taskState) {
        var finalBody = this._extractGenDocFinalBody(taskState.bodyData);

        taskState.streamCompleted = true;
        taskState.running = false;
        taskState.agentRequest = null;
        taskState.sseSource = null;
        // 结束时直接冲刷剩余内容，避免最后几字符仍停留在打字机缓冲区。
        this._flushGenDocTyping(taskState, true);

        if (finalBody === null) {
            this._settleGenDocEmpty(taskState);
            return;
        }

        if (!this._isGenDocBizSuccess(finalBody, taskState.bodyData)) {
            this._failGenDoc(taskState, this._getGenDocErrMsg(finalBody) || 'generateDocumentLLM: 生成结果校验失败');
            return;
        }

        // 将大模型返回结构转换为现有 showAiDraft 约定的 dataList 结构。
        var dataList = this._buildDraftDataList(finalBody, taskState);
        if (!dataList) {
            this._failGenDoc(taskState, 'generateDocumentLLM: 最终结果无法映射为合法 dataList');
            return;
        }

        taskState.draftDataList = dataList;
        taskState.state = 'completed';
        this._renderGenDocContent(taskState, false);
        this._syncGenDocFooter(taskState);

        if (taskState.autoApply) {
            this._applyGenDocDraft(taskState);
        }
    },

    /**
     * 提取最终可用的业务响应体
     * @param {Object} bodyData 流式接口返回的 body
     * @returns {*}
     */
    _extractGenDocFinalBody: function (bodyData) {
        return bodyData && typeof bodyData === 'object' && bodyData.body && typeof bodyData.body === 'object' ? bodyData.body : bodyData;
    },

    /**
     * 判断业务层返回结果是否成功
     * @param {Object} finalBody 最终业务数据
     * @param {Object} bodyData 原始 body 数据
     * @returns {boolean}
     */
    _isGenDocBizSuccess: function (finalBody, bodyData) {
        var candidates = [bodyData, finalBody];
        for (var i = 0; i < candidates.length; i++) {
            var item = candidates[i];
            var hasDataList;
            if (!item || typeof item !== 'object') {
                continue;
            }
            if (item.dialogue_error_flag || item.error_flag || item.errorFlag) {
                return false;
            }
            if (item.success !== undefined && !item.success) {
                return false;
            }
            hasDataList = Array.isArray(item.data) || Array.isArray(item.dataList) || Array.isArray(item.data_list);
            if (
                item.code !== undefined &&
                !hasDataList &&
                String(item.code) !== '200' &&
                String(item.code) !== '0'
            ) {
                return false;
            }
        }
        return true;
    },

    /**
     * 将接口返回结果映射为 showAiDraft 所需的 dataList
     * @param {Object} finalBody 最终业务数据
     * @param {Object} taskState 当前任务状态
     * @returns {Array|null}
     */
    _buildDraftDataList: function (finalBody, taskState) {
        var docs = this._extractGenDocDocs(finalBody);
        var dataList = [];

        if (!docs.length) {
            return null;
        }

        $.each(docs, function (_, doc) {
            var mappedList = [];
            var docCode = '';

            if (doc && doc.code) {
                docCode = doc.code;
            } else if (doc && doc.docCode) {
                docCode = doc.docCode;
            } else if (doc && doc.doc_code) {
                docCode = doc.doc_code;
            } else {
                docCode = taskState && taskState.docCode ? taskState.docCode : '';
            }

            $.each(doc && Array.isArray(doc.list) ? doc.list : [], function (_, item) {
                mappedList.push({
                    keyCode: item && item.item_code ? item.item_code : '',
                    keyName: item && item.item_name ? item.item_name : '',
                    keyValue: this._normalizeGenDocItemValue(item && Object.prototype.hasOwnProperty.call(item, 'value') ? item.value : '')
                });
            }.bind(this));

            if (mappedList.length) {
                dataList.push({
                    code: docCode,
                    data: mappedList
                });
            }
        }.bind(this));

        return dataList.length ? dataList : null;
    },

    /**
     * 提取结构化 docs 列表，统一归一化文档编码和字段值
     * @param {Object} finalBody 最终业务数据
     * @returns {Array}
     */
    _extractGenDocDocs: function (finalBody) {
        var docs = finalBody && typeof finalBody === 'object' ? finalBody.docs : null;
        return Array.isArray(docs) ? docs : [];
    },

    /**
     * 规范化单条字段值，统一为可展示文本
     * @param {*} value 接口返回的原始值
     * @returns {string}
     */
    _normalizeGenDocItemValue: function (value) {
        if (Array.isArray(value)) {
            value = value.join('');
        } else if (value == null) {
            value = '';
        } else {
            value = String(value);
        }

        return value.replace(/^\n+|\n+$/g, '');
    },

    /**
     * 从任务状态解析浮窗结构化展示所需的 docs（与成功收口时的 finalBody.docs 一致）
     * @param {Object} taskState 当前任务状态
     * @returns {Array|null}
     */
    _getGenDocStructuredDocs: function (taskState) {
        if (!taskState || taskState.state !== 'completed') {
            return null;
        }
        var finalBody = this._extractGenDocFinalBody(taskState.bodyData);
        var docs = this._extractGenDocDocs(finalBody);
        return docs.length ? docs : null;
    },

    /**
     * 过滤出可在浮窗中以结构化列表展示的 docs（需含非空 list；与 _buildDraftDataList 可映射范围一致）
     * @param {Object} taskState 当前任务状态
     * @returns {Array|null}
     */
    _getGenDocStructuredRenderDocs: function (taskState) {
        var docs = this._getGenDocStructuredDocs(taskState);
        if (!docs || !docs.length) {
            return null;
        }
        var out = [];
        var i;
        var doc;
        var list;
        for (i = 0; i < docs.length; i++) {
            doc = docs[i];
            list = doc && Array.isArray(doc.list) ? doc.list : [];
            if (!list.length) {
                continue;
            }
            out.push(doc);
        }
        return out.length ? out : null;
    },

    /**
     * 处理接口返回空 body 的场景，不再执行回填
     * @param {Object} taskState 当前任务状态
     */
    _settleGenDocEmpty: function (taskState) {
        if (!taskState) {
            return;
        }
        taskState.state = 'empty';
        taskState.running = false;
        taskState.streamCompleted = true;
        taskState.agentRequest = null;
        taskState.sseSource = null;
        this._renderGenDocContent(taskState, false);
        this._syncGenDocFooter(taskState);
    },

    /**
     * 处理整份病历生成失败场景
     * @param {Object} taskState 当前任务状态
     * @param {string} message 错误提示
     */
    _failGenDoc: function (taskState, message) {
        this._settleGenDocFail(taskState, message, 'failed');
    },

    /**
     * 处理 AI 草稿回填失败场景
     * @param {Object} taskState 当前任务状态
     * @param {string} message 错误提示
     */
    _handleGenDocDraftFail: function (taskState, message) {
        this._settleGenDocFail(taskState, message, 'draftApplyFailed');
    },

    /**
     * 收口失败态并更新界面提示
     * @param {Object} taskState 当前任务状态
     * @param {string} message 错误提示
     * @param {string} failState 失败状态标识
     */
    _settleGenDocFail: function (taskState, message, failState) {
        var errorMessage = $.trim(message || '') || 'generateDocumentLLM: AI 草稿回填失败';

        if (!taskState) {
            this._showGenDocToast(errorMessage);
            return;
        }

        taskState.state = failState || 'failed';
        taskState.failMessage = errorMessage;
        taskState.running = false;
        taskState.streamCompleted = true;
        this._stopGenDocTyping(taskState);
        this._abortGenDocReq(taskState);
        this._closeGenDocStream(taskState);
        taskState.agentRequest = null;
        taskState.sseSource = null;
        if (taskState.overlay) {
            // 失败时如果已有部分流式内容，继续保留给用户查看，而不是直接清空。
            if (taskState.streamContent || taskState.typedContent) {
                this._renderGenDocStream(taskState);
            } else {
                this._renderGenDocContent(taskState, false);
            }
        }
        this._syncGenDocFooter(taskState);
        this._showGenDocToast(errorMessage);
    },

    /**
     * 执行 AI 草稿回填，可复用于整份回填和单条字段回填
     * @param {Object} taskState 当前任务状态
     * @param {Array} dataList 待回填的草稿数据
     * @param {Object} [options] 附加配置
     * @returns {boolean}
     */
    _applyGenDocDraftDataList: function (taskState, dataList, options) {
        var applyOptions = options || {};
        var successMessage = $.trim(applyOptions.successMessage || '') || '生成内容已回填到病历中';
        var failMessage = $.trim(applyOptions.failMessage || '') || 'generateDocumentLLM: AI 草稿回填失败';
        var closeOnSuccess = applyOptions.closeOnSuccess !== false;

        if (!dataList || !dataList.length) {
            return false;
        }

        try {
            this.$parent.showAiDraft({
                dataList: dataList,
                casualDraft: false
            });
        } catch (error) {
            if (typeof applyOptions.onError === 'function') {
                applyOptions.onError.call(this, taskState, failMessage, error);
            } else {
                this._handleGenDocDraftFail(taskState, failMessage);
            }
            return false;
        }

        this._showGenDocSuccessToast(successMessage);

        if (closeOnSuccess) {
            taskState.state = 'closed';
            this._destroyGenDocOverlay(taskState);
            this._cleanupGenDocTask(taskState);
        }

        return true;
    },

    /**
     * 将生成结果以 AI 草稿方式回填到编辑器中
     * @param {Object} taskState 当前任务状态
     */
    _applyGenDocDraft: function (taskState) {
        if (!taskState || !taskState.draftDataList) {
            return;
        }

        this._applyGenDocDraftDataList(taskState, taskState.draftDataList, {
            successMessage: '生成内容已回填到病历中',
            failMessage: 'generateDocumentLLM: AI 草稿回填失败'
        });
    },

    /**
     * 根据结构化结果中的单条预览项组装 AI 草稿回填参数
     * @param {Object} taskState 当前任务状态
     * @param {Object} $trigger 当前触发节点
     * @returns {Array|null}
     */
    _buildGenDocSingleDraftDataList: function (taskState, $trigger) {
        var $itemContent;
        var $doc;
        var $textbox;
        var docIndex;
        var itemIndex;
        var docDraft;
        var $textboxContent;
        var keyCode;
        var keyName;
        var keyValue;
        var docCode;

        if (!taskState || !taskState.draftDataList || !$trigger || !$trigger.length) {
            return null;
        }

        $itemContent = $trigger.closest('.hm-generate-document-draft-item-content');
        $doc = $trigger.closest('.hm-generate-document-draft-doc');
        $textbox = $itemContent.children('[data-hm-node="newtextbox"]').first();
        if (!$textbox.length) {
            $textbox = $itemContent.find('[data-hm-node="newtextbox"]').first();
        }
        if (!$itemContent.length || !$doc.length || !$textbox.length) {
            return null;
        }

        docIndex = $doc.prevAll('.hm-generate-document-draft-doc').length;
        itemIndex = $doc.find('.hm-generate-document-draft-item-content').index($itemContent);
        docDraft = taskState.draftDataList[docIndex];
        if (!docDraft || !docDraft.data || !docDraft.data[itemIndex]) {
            return null;
        }

        $textboxContent = $textbox.find('.new-textbox-content').first();
        keyCode = $.trim($textbox.attr('data-hm-code') || '');
        keyName = $.trim($textbox.attr('data-hm-name') || '');
        keyValue = this._normalizeGenDocItemValue(
            (($textboxContent.length ? $textboxContent.text() : $textbox.text()) || '')
                .replace(/\u200B/g, '')
                .replace(/\uFEFF/g, '')
        );
        docCode = $.trim((docDraft && docDraft.code) || (taskState && taskState.docCode) || '');

        if (!docCode || (!keyCode && !keyName)) {
            return null;
        }

        return [{
            code: docCode,
            data: [{
                keyCode: keyCode,
                keyName: keyName,
                keyValue: keyValue
            }]
        }];
    },

    /**
     * 处理结构化结果中单条字段的回填点击
     * @param {Object} taskState 当前任务状态
     * @param {Object} $trigger 当前触发节点
     */
    _applyGenDocSingleDraft: function (taskState, $trigger) {
        var dataList;

        if (!taskState || taskState.cancelledByUser || taskState.state === 'closed') {
            return;
        }

        dataList = this._buildGenDocSingleDraftDataList(taskState, $trigger);
        if (!dataList) {
            this._showGenDocToast('generateDocumentLLM: 当前草稿项无法组装回填参数');
            return;
        }

        this._applyGenDocDraftDataList(taskState, dataList, {
            successMessage: '当前节点内容已回填到病历中',
            failMessage: 'generateDocumentLLM: 当前草稿项回填失败',
            closeOnSuccess: false,
            onError: function (_taskState, message) {
                this._showGenDocToast(message);
            }
        });
    },

    /**
     * 响应用户主动关闭生成弹层
     * @param {Object} taskState 当前任务状态
     */
    _cancelGenDoc: function (taskState) {
        if (!taskState) {
            return;
        }
        taskState.cancelledByUser = true;
        taskState.state = 'closed';
        this._destroyGenDocOverlay(taskState);
        this._cleanupGenDocTask(taskState);
    },

    /**
     * 清理任务相关的请求、定时器与引用
     * @param {Object} taskState 当前任务状态
     */
    _cleanupGenDocTask: function (taskState) {
        this._stopGenDocTyping(taskState);
        this._abortGenDocReq(taskState);
        this._closeGenDocStream(taskState);
        if (taskState) {
            taskState.running = false;
            taskState.agentRequest = null;
            taskState.sseSource = null;
        }
        if (this.generateDocumentTaskState === taskState) {
            this.generateDocumentTaskState = null;
        }
    },

    /**
     * 中止尚未完成的同步请求
     * @param {Object} taskState 当前任务状态
     */
    _abortGenDocReq: function (taskState) {
        if (taskState && taskState.agentRequest && typeof taskState.agentRequest.abort === 'function') {
            taskState.agentRequest.abort();
            taskState.agentRequest = null;
        }
    },

    /**
     * 关闭流式生成连接
     * @param {Object} taskState 当前任务状态
     */
    _closeGenDocStream: function (taskState) {
        if (taskState && taskState.sseSource && typeof taskState.sseSource.close === 'function') {
            taskState.sseSource.close();
            taskState.sseSource = null;
        }
    },

    /**
     * 创建并挂载整份病历生成弹层
     * @param {Object} taskState 当前任务状态
     */
    _openGenDocOverlay: function (taskState) {
        var _t = this;
        var $mountContainer = _t._getGenDocMount(taskState);
        var $layer = $($.getTpl($document_tpl['document/tpl/generateDocumentOverlay'], {}));
        var $overlay = $layer.find('.hm-generate-document-overlay');
        var $content = $overlay.find('.hm-generate-document-content');
        var $streamPlaceholder = $content.find('.hm-generate-document-stream-placeholder');
        var $streamPlaceholderText = $streamPlaceholder.find('.hm-generate-document-placeholder-text');
        var $streamPlaceholderImage = $streamPlaceholder.find('.hm-generate-document-placeholder-image');
        var $streamContent = $content.find('.hm-generate-document-stream-content');
        var $loading = $content.find('.hm-generate-document-loading');
        var $autoApplyLabel = $overlay.find('.hm-generate-document-auto-apply');
        var $autoApplySwitch = $autoApplyLabel.find('.hm-generate-document-auto-apply-switch');
        var $applyBtn = $overlay.find('.hm-generate-document-apply');
        var $stopBtn = $overlay.find('.hm-generate-document-stop');
        var $cancelBtn = $overlay.find('.hm-generate-document-cancel');

        $overlay.find('.hm-generate-document-close').on('click', function () {
            _t._cancelGenDoc(taskState);
        });
        $layer.find('.hm-generate-document-mask').on('click', function () {
            _t._cancelGenDoc(taskState);
        });
        $autoApplySwitch.on('change', function () {
            _t._setGenDocAutoApply(taskState, $(this).prop('checked'));
        });
        $applyBtn.on('click', function () {
            if ($(this).prop('disabled')) {
                return;
            }
            _t._applyGenDocDraft(taskState);
        });
        $stopBtn.on('click', function () {
            if ($(this).prop('disabled')) {
                return;
            }
            _t._stopGenDoc(taskState);
        });
        $streamContent.on('click', '.ai-draft-back', function (event) {
            event.preventDefault();
            event.stopPropagation();
            _t._applyGenDocSingleDraft(taskState, $(this));
        });
        $overlay.find('.hm-generate-document-body').on('wheel', function (event) {
            var originalEvent = event && event.originalEvent;
            if (!taskState || taskState.cancelledByUser || taskState.streamCompleted) {
                return;
            }
            if (originalEvent && originalEvent.deltaY < 0) {
                taskState.autoScrollPaused = true;
            }
        });
        $cancelBtn.on('click', function () {
            _t._cancelGenDoc(taskState);
        });
        $streamPlaceholderImage.attr('src', _t._getGenDocEmptyImg());
        $loading.find('.hm-generate-document-loading-image').attr('src', _t._getGenDocLoadingImg());

        $mountContainer.append($layer);
        taskState.overlay = {
            layer: $layer,
            container: $overlay,
            content: $content,
            streamPlaceholder: $streamPlaceholder,
            streamPlaceholderText: $streamPlaceholderText,
            streamPlaceholderImage: $streamPlaceholderImage,
            streamContent: $streamContent,
            loading: $loading,
            autoApplyLabel: $autoApplyLabel,
            autoApplySwitch: $autoApplySwitch,
            applyBtn: $applyBtn,
            stopBtn: $stopBtn,
            cancelBtn: $cancelBtn
        };
        taskState.mask = $layer.find('.hm-generate-document-mask');
        this._syncGenDocFooter(taskState);
    },

    /**
     * 同步底部工具栏按钮与开关状态
     * @param {Object} taskState 当前任务状态
     */
    _syncGenDocFooter: function (taskState) {
        var overlay = taskState && taskState.overlay;
        var canToggleAutoApply;
        var canApplyDraft;
        var canStopGen;

        if (!overlay) {
            return;
        }

        canToggleAutoApply = !!(taskState && !taskState.cancelledByUser && !taskState.streamCompleted && taskState.state !== 'closed');
        canApplyDraft = !!(taskState && taskState.draftDataList && taskState.state !== 'closed' && !taskState.cancelledByUser);
        canStopGen = !!(taskState && taskState.running && !taskState.cancelledByUser && !taskState.streamCompleted && taskState.state !== 'closed');

        if (overlay.autoApplySwitch && overlay.autoApplySwitch.length) {
            overlay.autoApplySwitch.prop('checked', !!taskState.autoApply);
            overlay.autoApplySwitch.prop('disabled', !canToggleAutoApply);
        }
        if (overlay.autoApplyLabel && overlay.autoApplyLabel.length) {
            overlay.autoApplyLabel.toggleClass('is-disabled', !canToggleAutoApply);
        }
        if (overlay.applyBtn && overlay.applyBtn.length) {
            overlay.applyBtn.prop('disabled', !canApplyDraft);
        }
        if (overlay.stopBtn && overlay.stopBtn.length) {
            overlay.stopBtn.prop('disabled', !canStopGen);
        }
        if (overlay.cancelBtn && overlay.cancelBtn.length) {
            overlay.cancelBtn.prop('disabled', taskState && taskState.state === 'closed');
        }
    },

    /**
     * 获取加载动画图片地址
     * @returns {string}
     */
    _getGenDocLoadingImg: function () {
        var sdkHost = this.editor && this.editor.HMConfig && this.editor.HMConfig.sdkHost;
        if (sdkHost) {
            return String(sdkHost).replace(/\/$/, '') + '/img/gptLoading.gif';
        }
        return 'img/gptLoading.gif';
    },

    /**
     * 获取空结果占位图地址
     * @returns {string}
     */
    _getGenDocEmptyImg: function () {
        var sdkHost = this.editor && this.editor.HMConfig && this.editor.HMConfig.sdkHost;
        if (sdkHost) {
            return String(sdkHost).replace(/\/$/, '') + '/img/generateDocumentEmpty.svg';
        }
        return 'img/generateDocumentEmpty.svg';
    },

    /**
     * 获取生成中占位图地址
     * @returns {string}
     */
    _getGenDocLoadingPlaceholderImg: function () {
        var sdkHost = this.editor && this.editor.HMConfig && this.editor.HMConfig.sdkHost;
        if (sdkHost) {
            return String(sdkHost).replace(/\/$/, '') + '/img/generateDocumentLoading.svg';
        }
        return 'img/generateDocumentLoading.svg';
    },

    /**
     * 获取弹层挂载容器，并在必要时修正定位上下文
     * @param {Object} taskState 当前任务状态
     * @returns {Object}
     */
    _getGenDocMount: function (taskState) {
        var $container = this.editor && this.editor.container && this.editor.container.$ ? $(this.editor.container.$) : null;
        var containerEl;
        if (!$container || !$container.length) {
            $container = $('body');
        }

        taskState.mountContainer = $container;
        containerEl = $container[0];

        // 弹层使用绝对定位时，需要确保挂载容器本身能提供定位上下文。
        if (window.getComputedStyle(containerEl).position === 'static') {
            taskState.containerPositionPatched = true;
            taskState.originalContainerPosition = containerEl.style.position || '';
            $container.css('position', 'relative');
        }

        return $container;
    },

    /**
     * 渲染加载中状态
     * @param {Object} taskState 当前任务状态
     */
    _renderGenDocLoading: function (taskState) {
        this._renderGenDocContent(taskState, this._shouldShowGenDocLoading(taskState));
    },

    /**
     * 渲染流式内容并保持滚动条在底部
     * @param {Object} taskState 当前任务状态
     */
    _renderGenDocStream: function (taskState) {
        var overlay = taskState && taskState.overlay;
        if (!overlay || !overlay.container) {
            return;
        }
        this._renderGenDocContent(taskState, this._shouldShowGenDocLoading(taskState));
        var bodyEl = overlay.container.find('.hm-generate-document-body')[0];
        if (bodyEl && !(taskState && taskState.autoScrollPaused)) {
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }
    },

    /**
     * 停止当前生成流程，保留已生成内容供用户继续查看
     * @param {Object} taskState 当前任务状态
     */
    _stopGenDoc: function (taskState) {
        if (!taskState || taskState.cancelledByUser || taskState.state === 'closed' || taskState.streamCompleted) {
            return;
        }
        taskState.stoppedByUser = true;
        taskState.running = false;
        taskState.streamCompleted = true;
        taskState.state = 'stopped';
        this._flushGenDocTyping(taskState, true);
        this._stopGenDocTyping(taskState);
        this._abortGenDocReq(taskState);
        this._closeGenDocStream(taskState);
        taskState.agentRequest = null;
        taskState.sseSource = null;
        this._renderGenDocContent(taskState, false);
        this._syncGenDocFooter(taskState);
    },

    /**
     * 统一更新弹层中的正文、占位文案与 loading
     * @param {Object} taskState 当前任务状态
     * @param {boolean} showLoading 是否显示 loading
     */
    _renderGenDocContent: function (taskState, showLoading) {
        var overlay = taskState && taskState.overlay;
        var contentHtml = this._getGenDocContentHtml(taskState);
        var hasContent = !!$.trim(contentHtml);
        var placeholderMode = this._getGenDocPlaceholderMode(taskState, hasContent);
        var shouldShowPlaceholder = !!placeholderMode;

        if (!overlay || !overlay.content) {
            return;
        }

        overlay.content.show();
        if (overlay.streamContent) {
            overlay.streamContent.html(contentHtml);
            overlay.streamContent.toggle(!shouldShowPlaceholder);
        }
        if (overlay.streamPlaceholder) {
            overlay.streamPlaceholder
                .toggleClass('is-loading', placeholderMode === 'loading')
                .toggleClass('is-empty', placeholderMode === 'empty')
                .toggleClass('is-failed', placeholderMode === 'failed')
                .toggle(shouldShowPlaceholder);
        }
        if (overlay.streamPlaceholderText && overlay.streamPlaceholderText.length) {
            overlay.streamPlaceholderText.text(this._getGenDocPlaceholderText(taskState, placeholderMode));
        }
        if (overlay.streamPlaceholderImage && overlay.streamPlaceholderImage.length) {
            overlay.streamPlaceholderImage.attr('src', this._getGenDocPlaceholderImg(taskState, placeholderMode));
        } else if (overlay.streamPlaceholder) {
            overlay.streamPlaceholder.text(this._getGenDocPlaceholderText(taskState, placeholderMode));
        }
        if (overlay.loading) {
            overlay.loading.toggle(!!showLoading && this._shouldShowGenDocLoading(taskState));
        }
    },

    /**
     * 获取当前应展示的 HTML 内容
     * @param {Object} taskState 当前任务状态
     * @returns {string}
     */
    _getGenDocContentHtml: function (taskState) {
        if (this._shouldRenderGenDocStructuredResult(taskState)) {
            return this._getGenDocStructuredHtml(taskState);
        }
        var contentText = taskState ? (taskState.typedContent || taskState.streamContent || '') : '';
        return this._compileGenDocMd(contentText);
    },

    /**
     * 判断当前是否展示结构化结果列表
     * @param {Object} taskState 当前任务状态
     * @returns {boolean}
     */
    _shouldRenderGenDocStructuredResult: function (taskState) {
        var docs = this._getGenDocStructuredRenderDocs(taskState);
        return !!(
            taskState &&
            taskState.streamCompleted &&
            docs &&
            docs.length
        );
    },

    /**
     * 生成结构化结果列表 HTML
     * @param {Object} taskState 当前任务状态
     * @returns {string}
     */
    _getGenDocStructuredHtml: function (taskState) {
        var tpl = $document_tpl['document/tpl/generateDocumentDraftList'];
        var renderDocs = this._getGenDocStructuredRenderDocs(taskState);
        if (!tpl || !renderDocs || !renderDocs.length) {
            return '';
        }
        return $.getTpl(tpl, {
            docs: renderDocs,
            getUUId: this._genDocUUID
        });
    },

    /**
     * 获取当前弹层占位文案
     * @param {Object} taskState 当前任务状态
     * @returns {string}
     */
    _getGenDocPlaceholderText: function (taskState, placeholderMode) {
        placeholderMode = placeholderMode || this._getGenDocPlaceholderMode(taskState, false);
        if (placeholderMode === 'empty') {
            return '未生成对应病历内容';
        }
        if (placeholderMode === 'failed') {
            return '病历生成失败，' + $.trim(taskState && taskState.failMessage || '');
        }
        return '病历正在生成...';
    },

    /**
     * 判断当前是否为空结果态
     * @param {Object} taskState 当前任务状态
     * @returns {boolean}
     */
    _isGenDocEmptyState: function (taskState) {
        return !!(taskState && taskState.state === 'empty');
    },

    /**
     * 判断当前是否为失败态
     * @param {Object} taskState 当前任务状态
     * @returns {boolean}
     */
    _isGenDocFailedState: function (taskState) {
        return !!(taskState && (taskState.state === 'failed' || taskState.state === 'draftApplyFailed'));
    },

    /**
     * 获取当前占位态模式
     * @param {Object} taskState 当前任务状态
     * @param {boolean} hasContent 当前是否已有正文内容
     * @returns {string}
     */
    _getGenDocPlaceholderMode: function (taskState, hasContent) {
        if (this._isGenDocEmptyState(taskState)) {
            return 'empty';
        }
        if (this._isGenDocFailedState(taskState) && !hasContent) {
            return 'failed';
        }
        if (!hasContent) {
            return 'loading';
        }
        return '';
    },

    /**
     * 获取当前占位态图片
     * @param {Object} taskState 当前任务状态
     * @param {string} placeholderMode 占位态模式
     * @returns {string}
     */
    _getGenDocPlaceholderImg: function (taskState, placeholderMode) {
        placeholderMode = placeholderMode || this._getGenDocPlaceholderMode(taskState, false);
        if (placeholderMode === 'empty' || placeholderMode === 'failed') {
            return this._getGenDocEmptyImg();
        }
        return this._getGenDocLoadingPlaceholderImg();
    },

    /**
     * 判断当前阶段是否仍需展示 loading
     * @param {Object} taskState 当前任务状态
     * @returns {boolean}
     */
    _shouldShowGenDocLoading: function (taskState) {
        var state;
        if (!taskState || taskState.cancelledByUser) {
            return false;
        }
        state = taskState.state;
        if (state === 'closed' || state === 'stopped' || state === 'failed' || state === 'draftApplyFailed') {
            return false;
        }
        if (!taskState.streamStarted) {
            return false;
        }
        return !taskState.streamCompleted || taskState.typedContent.length < taskState.streamContent.length;
    },

    /**
     * 显示成功提示
     * @param {string} message 提示文案
     */
    _showGenDocSuccessToast: function (message) {
        this._showGenDocToast(message, 'success');
    },

    /**
     * 通过编辑器通知组件显示提示
     * @param {string} message 提示文案
     * @param {string} type 提示类型
     */
    _showGenDocToast: function (message, type) {
        var text = $.trim(message || '');
        var editor = this.editor;
        var noticeType = type || 'error';
        if (text && editor && typeof editor.showNotification === 'function') {
            editor.showNotification(text, noticeType, 3000);
        }
    },

    /**
     * 销毁弹层并恢复挂载容器样式
     * @param {Object} taskState 当前任务状态
     */
    _destroyGenDocOverlay: function (taskState) {
        if (!taskState) {
            return;
        }
        if (taskState.overlay && taskState.overlay.layer) {
            taskState.overlay.layer.remove();
        }
        taskState.overlay = null;
        taskState.mask = null;

        if (taskState.containerPositionPatched && taskState.mountContainer && taskState.mountContainer.length) {
            taskState.mountContainer[0].style.position = taskState.originalContainerPosition;
            taskState.containerPositionPatched = false;
        }
    },

    /**
     * 从多种响应结构中提取可展示的错误信息
     * @param {*} obj 错误对象或响应对象
     * @returns {string}
     */
    _getGenDocErrMsg: function (obj) {
        var bizBody = obj && typeof obj === 'object' && obj.body && typeof obj.body === 'object' ? obj.body : null;
        var nestedKeys = ['responseJSON', 'responseText', 'body', 'data', 'result'];
        var messageKeys = ['message', 'msg', 'error_message', 'errorMsg'];
        if (obj == null || obj === '') {
            return '';
        }

        if (bizBody && bizBody.dialogue_error_flag) {
            return $.trim(bizBody.agent_query || bizBody.content || '') || '';
        }

        var queue = [obj];
        while (queue.length) {
            var item = queue.shift();
            var j;
            if (item == null || item === '') {
                continue;
            }
            if (typeof item === 'string') {
                var trimmed = $.trim(item);
                if (trimmed) {
                    return trimmed;
                }
                continue;
            }
            for (j = 0; j < nestedKeys.length; j++) {
                if (item[nestedKeys[j]]) {
                    queue.push(item[nestedKeys[j]]);
                }
            }
            for (j = 0; j < messageKeys.length; j++) {
                if (item[messageKeys[j]]) {
                    return item[messageKeys[j]];
                }
            }
        }

        return '';
    }
});