// MCPHandler 及相关逻辑，供 HmEditorIfame.js 调用

(function (window) {
    // 日志控制变量 - 设置为 false 可关闭所有调试日志
    var MCP_DEBUG_ENABLED = false;

    // 日志打印函数
    function mcpLog() {
        if (MCP_DEBUG_ENABLED) {
            console.log.apply(console, arguments);
        }
    }

    // 错误日志打印函数（始终显示）
    function mcpError() {
        console.error.apply(console, arguments);
    }

    // WebSocket连接状态监控器
    var WebSocketMonitor = function() {
        this.mcpHandler = null;
        this.checkInterval = null;
        this.checkIntervalMs = 10000; // 10秒检查一次
        this.isMonitoring = false;
        this.lastCheckTime = 0;
        this.connectionStatus = {
            isConnected: false,
            lastHeartbeat: 0,
            reconnectAttempts: 0,
            lastError: null
        };
    };

    WebSocketMonitor.prototype = {
        /**
         * 开始监控WebSocket连接
         * @param {Object} mcpHandler MCP处理器实例
         */
        startMonitoring: function(mcpHandler) {
            if (this.isMonitoring) {
                console.log('WebSocket监控已在运行中');
                return;
            }

            this.mcpHandler = mcpHandler;
            this.isMonitoring = true;
            console.log('🔍 开始监控WebSocket连接状态');

            // 立即检查一次
            this.checkConnection();

            // 设置定期检查
            this.checkInterval = setInterval(() => {
                this.checkConnection();
            }, this.checkIntervalMs);
        },

        /**
         * 停止监控
         */
        stopMonitoring: function() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            this.isMonitoring = false;
            //console.log('🔍 停止WebSocket连接状态监控');
        },

        /**
         * 检查连接状态
         */
        checkConnection: function() {
            if (!this.mcpHandler) {
                console.warn('MCP处理器未初始化，无法检查连接状态');
                return;
            }

            const now = Date.now();
            this.lastCheckTime = now;

            // 检查WebSocket连接状态
            const ws = this.mcpHandler.ws;
            const isConnected = ws && ws.readyState === WebSocket.OPEN;

            // 如果正在连接中，跳过检查
            if (this.mcpHandler.isConnecting) {
                console.log('🔍 WebSocket正在连接中，跳过状态检查');
                return;
            }

            // 检查心跳状态 - 增加更长的超时时间
            const timeSinceLastHeartbeat = now - this.mcpHandler.lastHeartbeat;
            const heartbeatTimeout = 120000; // 120秒无心跳认为超时

            // 更新连接状态
            this.connectionStatus.isConnected = isConnected;
            this.connectionStatus.lastHeartbeat = this.mcpHandler.lastHeartbeat;
            this.connectionStatus.reconnectAttempts = this.mcpHandler.reconnectAttempts;

            // 检查是否需要重连
            if (!isConnected) {
                console.warn('⚠️ WebSocket连接已断开，尝试重连');
                this.connectionStatus.lastError = '连接断开';
                this.triggerReconnect();
            } else if (timeSinceLastHeartbeat > heartbeatTimeout) {
                console.warn('⚠️ WebSocket心跳超时，尝试重连');
                this.connectionStatus.lastError = '心跳超时';
                this.triggerReconnect();
            } else {
                this.connectionStatus.lastError = null;
                //console.log('✅ WebSocket连接状态正常');
            }
        },

        /**
         * 触发重连
         */
        triggerReconnect: function() {
            if (this.mcpHandler && typeof this.mcpHandler.reconnect === 'function') {
                console.log('🔄 触发WebSocket重连');
                this.mcpHandler.reconnect();
            }
        },

        /**
         * 获取连接状态
         * @returns {Object} 连接状态信息
         */
        getConnectionStatus: function() {
            return {
                ...this.connectionStatus,
                isMonitoring: this.isMonitoring,
                lastCheckTime: this.lastCheckTime,
                sessionId: this.mcpHandler ? this.mcpHandler.sessionId : null
            };
        },

        /**
         * 手动重连
         */
        manualReconnect: function() {
            console.log('🔄 手动触发WebSocket重连');
            this.triggerReconnect();
        },

        /**
         * 重置重连计数
         */
        resetReconnectAttempts: function() {
            if (this.mcpHandler) {
                this.mcpHandler.reconnectAttempts = 0;
                console.log('🔄 重置重连计数');
            }
        }
    };

    var MCPHandler = function() {
        this.ws = null;
        this.sessionId = null;
        this.editorLoader = null;
        this.editors = new Map();
        this.pendingCommands = new Map();
        this.wsUrl = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3秒
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.isConnecting = false;
        this.lastHeartbeat = Date.now();
        this.monitor = new WebSocketMonitor(); // 创建监控器实例
    };

    MCPHandler.prototype = {
        init: function(wsUrl, editorLoader) {
            this.editorLoader = editorLoader;
            this.wsUrl = wsUrl;
            this.connect(wsUrl);

            // 移除这里的监控器启动，改为在连接成功后启动
            // this.monitor.startMonitoring(this);
        },

        connect: function(wsUrl) {
            if (this.isConnecting) {
                mcpLog('🔌 [MCP Debug] 正在连接中，跳过重复连接');
                return;
            }

            this.isConnecting = true;
            mcpLog('🔌 [MCP Debug] 开始连接 WebSocket:', wsUrl);

            try {
                this.ws = new WebSocket(wsUrl);

                // 修改监控器启动时机
                this.ws.onopen = () => {
                    this.isConnecting = false;
                    this.reconnectAttempts = 0; // 重置重连次数
                    mcpLog('✅ [MCP Debug] MCP WebSocket 连接成功');
                    mcpLog('🔍 [MCP Debug] WebSocket 状态:', this.ws.readyState);
                    mcpLog('🔍 [MCP Debug] WebSocket URL:', this.ws.url);

                    // 启动心跳检测
                    this.startHeartbeat();

                    // 延迟启动监控器，等待连接稳定
                    setTimeout(() => {
                        this.monitor.startMonitoring(this);
                    }, 5000); // 延迟5秒启动监控

                    // 连接成功后不再由前端生成sessionId，等待服务端推送
                };

                this.ws.onmessage = (event) => {
                    mcpLog('📨 [MCP Debug] 收到 WebSocket 消息，长度:', event.data.length);
                    this.handleMessage(event.data);
                };

                this.ws.onclose = (event) => {
                    this.isConnecting = false;
                    this.stopHeartbeat();

                    // 停止监控器
                    if (this.monitor) {
                        this.monitor.stopMonitoring();
                    }

                    mcpLog('🔌 [MCP Debug] MCP WebSocket 连接关闭');
                    mcpLog('🔍 [MCP Debug] 关闭代码:', event.code);
                    mcpLog('🔍 [MCP Debug] 关闭原因:', event.reason);
                    mcpLog('🔍 [MCP Debug] 是否正常关闭:', event.wasClean);

                    // 如果不是正常关闭，尝试重连
                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    this.isConnecting = false;
                    mcpError('❌ [MCP Debug] MCP WebSocket 错误:', error);
                    mcpError('🔍 [MCP Debug] 错误详情:', error.message || error);
                };
            } catch (error) {
                this.isConnecting = false;
                mcpError('❌ [MCP Debug] 创建WebSocket连接失败:', error);
                this.scheduleReconnect();
            }
        },

        // 安排重连
        scheduleReconnect: function() {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }

            this.reconnectAttempts++;
            const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // 指数退避

            mcpLog(`🔄 [MCP Debug] 计划 ${delay}ms 后重连 (第 ${this.reconnectAttempts} 次尝试)`);

            this.reconnectTimer = setTimeout(() => {
                if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                    mcpLog(`🔄 [MCP Debug] 开始第 ${this.reconnectAttempts} 次重连`);
                    this.connect(this.wsUrl);
                } else {
                    mcpError('❌ [MCP Debug] 重连次数已达上限，停止重连');
                }
            }, delay);
        },

        // 启动心跳检测
        startHeartbeat: function() {
            this.stopHeartbeat();

            this.heartbeatTimer = setInterval(() => {
                const now = Date.now();
                const timeSinceLastHeartbeat = now - this.lastHeartbeat;

                // 增加心跳超时时间到120秒
                if (timeSinceLastHeartbeat > 120000) {
                    mcpLog('⚠️ [MCP Debug] 心跳超时，尝试重新连接');
                    this.reconnect();
                    return;
                }

                // 发送心跳包
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    try {
                        this.ws.send(JSON.stringify({
                            type: 'heartbeat',
                            timestamp: now
                        }));
                        mcpLog('💓 [MCP Debug] 发送心跳包');
                    } catch (error) {
                        mcpError('❌ [MCP Debug] 发送心跳包失败:', error);
                        this.reconnect();
                    }
                }
            }, 30000); // 30秒发送一次心跳
        },

        // 停止心跳检测
        stopHeartbeat: function() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        },

        // 手动重连
        reconnect: function() {
            mcpLog('🔄 [MCP Debug] 手动重连');
            this.disconnect();
            this.reconnectAttempts = 0; // 重置重连次数
            setTimeout(() => {
                this.connect(this.wsUrl);
            }, 1000);
        },

        handleMessage: function(data) {
            try {
                const message = JSON.parse(data);
                mcpLog('🔍 [MCP Debug] 收到消息:', JSON.stringify(message, null, 2));

                // 处理心跳确认
                if (message.type === 'heartbeat_ack') {
                    this.lastHeartbeat = Date.now();
                    mcpLog('💓 [MCP Debug] 收到心跳确认');
                    return;
                }

                if (message.type === 'mcp_call' || (message.jsonrpc && message.method)) {
                    // 兼容jsonrpc风格
                    const id = message.id || ('ws_' + Date.now() + '_' + Math.random());
                    const method = message.method;
                    let params = message.params;
                    if (typeof params === 'string') {
                        try { params = JSON.parse(params); } catch (e) {}
                    }
                    this.executeCommand({ commandId: id, method, params });
                    return;
                }

                switch (message.type) {
                    case 'session':
                        this.sessionId = message.sessionId;
                        window.MCPHandler.sessionId = this.sessionId;
                        mcpLog('✅ [MCP Debug] 收到会话ID:', this.sessionId);
                        break;
                    case 'command':
                        mcpLog('🚀 [MCP Debug] 开始执行命令:', message.method);
                        mcpLog('📥 [MCP Debug] 命令参数:', JSON.stringify(message.params, null, 2));
                        this.executeCommand(message);
                        break;
                }
            } catch (error) {
                mcpError('❌ [MCP Debug] 处理消息失败:', error);
            }
        },
        executeCommand: function(message) {
            const { commandId, method, params } = message;
            const startTime = Date.now();

            mcpLog(`🎯 [MCP Debug] 执行命令: ${method}`);
            mcpLog(`📋 [MCP Debug] 命令ID: ${commandId}`);
            mcpLog(`📦 [MCP Debug] 参数详情:`, JSON.stringify(params, null, 2));

            const sendResult = (result, success = true) => {
                if (this.ws && commandId) {
                    const response = {
                        type: 'mcp_result',
                        id: commandId,
                        result: {
                            success: success,
                            result: result
                        }
                    };
                    this.ws.send(JSON.stringify(response));
                    mcpLog('✅ [MCP Debug] mcp_result 已发送:', JSON.stringify(response, null, 2));
                }
            };
            try {
                if (method === 'createEditor') {
                    const result = this.editorLoader.createEditor(params);
                    sendResult(result, true);
                } else if (method === 'destroyEditor') {
                    const editorId = this.handleEditorId(params).id;
                    if (!editorId) {
                        sendResult('缺少editorId', false);
                        return;
                    }
                    window.HMEditorLoader.destroyEditor(editorId);
                    sendResult('编辑器销毁成功', true);
                    return;
                } else if ([
                    'setDocData',
                    'getDocContent',
                    'getDocText',
                    'getDocHtml',
                    'getDocData',
                    'setDocReadOnly',
                    'setDocWatermark',
                    'setDocReviseMode',
                    'setPresentIllness',
                    'insertImageAtCursor',
                    'insertDataAtCursor'

                ].includes(method)) {
                    // 通过editorId获取实例并调用方法
                    const editorId = this.handleEditorId(params).id;
                    if (!editorId) {
                        sendResult('缺少editorId', false);
                        return;
                    }
                    window.HMEditorLoader.getEditorInstanceAsync(editorId, 10000)
                        .then(editor => {
                            if (!editor) {
                                sendResult('未找到编辑器实例', false);
                                return;
                            }
                            const handleParams = this.handleEditorCode(editor,params);
                            let callResult;
                            try {
                                if (method === 'setDocData') {
                                    callResult = editor.setDocData(handleParams);
                                } else if (method === 'getDocContent') {
                                    callResult = editor.getDocContent(handleParams && handleParams.code);
                                } else if (method === 'getDocHtml') {
                                    callResult = editor.getDocHtml(handleParams && handleParams.code);
                                }  else if (method === 'getDocText') {
                                    callResult = editor.getDocText(handleParams && handleParams.code);
                                } else if (method === 'getDocData') {
                                    callResult = editor.getDocData(handleParams && handleParams.code, handleParams && handleParams.keyList);
                                } else if (method === 'setDocReadOnly') {
                                    callResult = editor.setDocReadOnly(handleParams && handleParams.code, handleParams && handleParams.flag);
                                } else if (method === 'setDocWatermark') {
                                    const settings = {
                                        watermarkType:1,
                                        watermarkText:handleParams.watermark,
                                        watermarkColumn:handleParams.watermarkColumn||3
                                    }
                                    callResult = editor.setDocWatermark(handleParams && settings);
                                } else if (method === 'setDocReviseMode') {
                                    callResult = editor.setDocReviseMode(handleParams && handleParams.flag);
                                } else if (method === 'setPresentIllness') {
                                    var keyValue = handleParams.presentIllness;
                                    handleParams.data = [{keyName:'现病史',keyValue:keyValue}];
                                    callResult = editor.setDocData(handleParams);
                                } else if (method === 'insertImageAtCursor') {
                                    // 如果有 htmlstr，从中提取 canvas 并转换为 base64
                                    if (handleParams.htmlstr) {
                                        mcpLog('🖼️ [MCP Debug] 处理 htmlstr 中的 canvas');
                                        callResult = this.convertHtmlToCanvasBase64(handleParams.htmlstr).then(function(base64Data) {
                                            var imageData = {
                                                src: base64Data,
                                                width: handleParams.width || 400,
                                                height: handleParams.height || 200
                                            };
                                            mcpLog('🖼️ [MCP Debug] 从 htmlstr 生成的 imageData:', JSON.stringify(imageData, null, 2));
                                            return editor.insertImageAtCursor(imageData);
                                        }).then(r => {
                                            const finalAnswer = "已成功生成患者检验检测试数据表，并将其插入到当前病历的光标处。图表已显示在病历中，您可以继续编辑或保存病历内容。";
                                            return {
                                                success: true,
                                                content: [finalAnswer]
                                            };
                                        }).catch(e => {
                                            return {
                                                success: false,
                                                content: [e.message || '插入图片失败']
                                            };
                                        });
                                    } else {
                                        // 原有的处理逻辑
                                        var imageData = {
                                            src: handleParams.imageUrl,
                                            width: handleParams.width,
                                            height: handleParams.height
                                        };
                                        mcpLog('🖼️ [MCP Debug] insertImageAtCursor 参数:', JSON.stringify(handleParams, null, 2));

                                        const finalAnswer = "已成功生成患者检验检测试数据表，并将其插入到当前病历的光标处。图表已显示在病历中，您可以继续编辑或保存病历内容。";
                                        const wrapResult = (result, success = true) => ({
                                            success,
                                            content: [success ? finalAnswer : (typeof result === 'string' ? result : '插入图片失败')]
                                        });

                                        if (imageData.src && /^data:image\//.test(imageData.src)) {
                                            callResult = Promise.resolve(wrapResult(editor.insertImageAtCursor(imageData), true));
                                        } else if (imageData.src && imageData.src.indexOf('http') > -1) {
                                            var self = this;
                                            callResult = self.fetchImageBase64(imageData.src).then(function(base64Data) {
                                                imageData.src = base64Data;
                                                return editor.insertImageAtCursor(imageData);
                                            }).then(r => wrapResult(r, true)).catch(e => wrapResult(e.message, false));
                                        } else {
                                            callResult = Promise.resolve(wrapResult(editor.insertImageAtCursor(imageData), true));
                                        }
                                    }
                                } else if (method === 'insertDataAtCursor') {
                                    var content = handleParams.content || '';
                                    mcpLog('📝 [MCP Debug] insertDataAtCursor 参数:', JSON.stringify(handleParams, null, 2));

                                    if (!content) {
                                        callResult = { success: false, message: '缺少要插入的内容' };
                                    } else {
                                        // 调用编辑器插入内容方法
                                        callResult = editor.insertDataAtCursor(content);
                                    }
                                }
                                if (callResult instanceof Promise) {
                                    callResult.then(r => sendResult(r, true)).catch(e => sendResult(e.message, false));
                                } else {
                                    sendResult(callResult, true);
                                }
                            } catch (e) {
                                sendResult(e.message, false);
                            }
                        })
                        .catch(e => sendResult(e.message, false));
                    return;
                } else {
                    // 动态调用编辑器实例方法
                    const editorId = this.handleEditorId(params).id;
                    const methodName = params && (params.methodName || method);
                    const args = params && (params.args || params.arguments || []);
                    if (!editorId || !methodName) {
                        sendResult('缺少editorId或methodName', false);
                        return;
                    }
                    window.HMEditorLoader.getEditorInstanceAsync(editorId, 10000)
                        .then(editor => {
                            if (!editor) {
                                sendResult('未找到编辑器实例', false);
                                return;
                            }
                            if (typeof editor[methodName] !== 'function') {
                                sendResult(`方法 ${methodName} 不存在`, false);
                                return;
                            }
                            let callResult;
                            try {
                                callResult = editor[methodName].apply(editor, Array.isArray(args) ? args : [args]);
                                if (callResult instanceof Promise) {
                                    callResult.then(r => sendResult(r, true)).catch(e => sendResult(e.message, false));
                                } else {
                                    sendResult(callResult, true);
                                }
                            } catch (e) {
                                sendResult(e.message, false);
                            }
                        })
                        .catch(e => sendResult(e.message, false));
                    return;
                }
            } catch (error) {
                sendResult(error.message, false);
            }
        },
        /**
         * 获取编辑器ID
         * @param {Object} params 参数对象
         * @description 根据解析到的editorId，获取编辑器ID，获取不到则匹配名称，获取不到则获取激活tab的id
         */
        handleEditorId: function(params) {
            if (!params || (!params.editorId && !params.id)) {
                console.warn('[handleEditorId] 参数缺失: 需要 editorId 或 id');
                params = params || {};
            }
            const inputId = params.editorId || params.id;
            let foundId = null;

            // 1. 通过 id 查找
            if (inputId && $('#' + inputId).length > 0) {
                foundId = inputId;
                mcpLog('[handleEditorId] 通过 id 找到编辑器:', foundId);
            }
            // 2. 通过 data-name 查找
            else if (inputId && $('.tab-content[data-name="' + inputId + '"]').length > 0) {
                foundId = $('.tab-content[data-name="' + inputId + '"]').find('.editor-container').attr('id');
                mcpLog('[handleEditorId] 通过 data-name 找到编辑器:', foundId);
            }
            // 3. 取当前激活 tab
            else {
                foundId = $('.tab-content.active').find('.editor-container').attr('id');
                if (foundId) {
                    mcpLog('[handleEditorId] 通过激活 tab 找到编辑器:', foundId);
                } else {
                    mcpLog('[handleEditorId] 未找到任何编辑器实例');
                }
            }
            params.id = foundId;
            mcpLog('[handleEditorId] 最终获取到的编辑器ID:', foundId);
            return params;
        },
        /**
         * 获取编辑器code
         * @param {*} editor 编辑器实例
         * @param {*} params 参数对象
         * @returns 返回获取到的code
         */
        handleEditorCode: function(editor, params) {
            const $body = $(editor.editor.document.getBody().$);
            let code = params.code;
            let $targetDiv = null;

            // 获取所有含 data-hm-widgetid 的 div
            const $widgetDivs = $body.find('div[data-hm-widgetid]');

            if (!code && $widgetDivs.length > 0) {
                // 未传 code，默认取第一个
                $targetDiv = $widgetDivs.first();
                code = $targetDiv.attr('data-hm-widgetid');
            } else if (code) {
                // 先用 code 匹配 data-hm-widgetid
                $targetDiv = $widgetDivs.filter(`[data-hm-widgetid="${code}"]`).first();
                if ($targetDiv.length === 0) {
                    // 再用 code 匹配 data-hm-widgetname
                    const $byName = $body.find(`div[data-hm-widgetname="${code}"]`);
                    if ($byName.length > 0) {
                        $targetDiv = $byName.first();
                        code = $targetDiv.attr('data-hm-widgetid');
                    } else {
                        // 兜底：code 保持原值
                        $targetDiv = null;
                    }
                } else {
                    code = $targetDiv.attr('data-hm-widgetid');
                }
            }

            params.code = code;
            mcpLog(`[=====获取到编辑器${params.id}中，病历code：======`, code);
            return params;
        },
        notifyEditorReady: function(editorId) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'editorReady',
                    editorId: editorId
                }));
            }
        },
        sendResult: function(commandId, success, result) {
            const response = {
                type: 'result',
                commandId: commandId,
                success: success,
                result: result
            };
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(response));
            }
        },
        disconnect: function() {
            this.stopHeartbeat();
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.editors.clear();
            this.isConnecting = false;

            // 停止监控
            if (this.monitor) {
                this.monitor.stopMonitoring();
            }
        },

        // 将图片URL转换为base64数据
        fetchImageBase64: function(url) {
            mcpLog('🖼️ [MCP Debug] 开始转换图片URL为base64:', url);
            return fetch('/hmEditor/mcp-server/image-to-base64', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            })
            .then(function(res) {
                mcpLog('🖼️ [MCP Debug] 接口响应状态:', res.status);
                if (!res.ok) {
                    throw new Error('HTTP ' + res.status + ': ' + res.statusText);
                }
                return res.json();
            })
            .then(function(data) {
                mcpLog('🖼️ [MCP Debug] 接口响应数据:', data);
                if (data.success) {
                    mcpLog('✅ [MCP Debug] 图片转base64成功，数据长度:', data.data.length);
                    return data.data;
                } else {
                    throw new Error(data.message || '未知错误');
                }
            })
            .catch(function(error) {
                mcpError('❌ [MCP Debug] 图片转base64失败:', error);
                throw error;
            });
        },

        // 将HTML字符串中的canvas转换为base64
        convertHtmlToCanvasBase64: function(htmlStr) {
            mcpLog('🖼️ [MCP Debug] 开始处理HTML字符串中的canvas');
            return new Promise((resolve, reject) => {
                try {
                    // 创建一个临时的iframe来渲染HTML
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'absolute';
                    iframe.style.left = '-9999px';
                    iframe.style.top = '-9999px';
                    iframe.style.width = '200px';
                    iframe.style.height = '100px';
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlStr);
                    iframeDoc.close();

                    // 等待页面加载完成
                    iframe.onload = function() {
                        try {
                            // 查找canvas元素
                            const canvas = iframeDoc.querySelector('canvas');
                            // if (!canvas) {
                                // 如果没有找到canvas，尝试等待ECharts渲染完成
                                setTimeout(() => {
                                    const canvas = iframeDoc.querySelector('canvas');
                                    if (canvas) {
                                        const base64Data = canvas.toDataURL('image/png');
                                        document.body.removeChild(iframe);
                                        mcpLog('222✅ [MCP Debug] Canvas转base64成功，数据长度:', base64Data.length);
                                        resolve(base64Data);
                                    } else {
                                        document.body.removeChild(iframe);
                                        reject(new Error('未找到canvas元素'));
                                    }
                                }, 10000); // 等待2秒让ECharts渲染完成
                            // } else {
                            //     const base64Data = canvas.toDataURL('image/png');
                            //     document.body.removeChild(iframe);
                            //     mcpLog('1111✅ [MCP Debug] Canvas转base64成功，数据长度:', base64Data.length);
                            //     resolve(base64Data);
                            // }
                        } catch (error) {
                            document.body.removeChild(iframe);
                            mcpError('❌ [MCP Debug] Canvas转base64失败:', error);
                            reject(error);
                        }
                    };

                    // 设置超时
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                            reject(new Error('处理HTML超时'));
                        }
                    }, 20000); // 10秒超时

                } catch (error) {
                    mcpError('❌ [MCP Debug] 创建iframe失败:', error);
                    reject(error);
                }
            });
        }
    };

    window.MCPHandler = MCPHandler;

    // 创建全局WebSocketMonitor实例，方便外部访问
    window.WebSocketMonitor = WebSocketMonitor;

    // 页面可见性变化时检查连接
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && window.MCPHandler && window.MCPHandler.monitor && window.MCPHandler.monitor.isMonitoring) {
            console.log('📱 页面变为可见，检查WebSocket连接状态');
            setTimeout(() => {
                window.MCPHandler.monitor.checkConnection();
            }, 1000);
        }
    });

    // 网络状态变化时检查连接
    window.addEventListener('online', function() {
        if (window.MCPHandler && window.MCPHandler.monitor && window.MCPHandler.monitor.isMonitoring) {
            console.log('🌐 网络连接恢复，检查WebSocket连接状态');
            setTimeout(() => {
                window.MCPHandler.monitor.checkConnection();
            }, 2000);
        }
    });

    // 页面卸载前停止监控
    window.addEventListener('beforeunload', function() {
        if (window.MCPHandler && window.MCPHandler.monitor) {
            window.MCPHandler.monitor.stopMonitoring();
        }
    });

})(window);