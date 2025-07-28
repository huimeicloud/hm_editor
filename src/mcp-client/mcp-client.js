/**
 * MCP客户端实现类
 *
 * 该类负责管理MCP服务器连接、处理工具调用和实现聊天逻辑
 * 基于Model Context Protocol (MCP)，使用DeepSeek API实现对话功能
 */
var Client = require("@modelcontextprotocol/sdk/client/index.js").Client;
var StdioClientTransport = require("@modelcontextprotocol/sdk/client/stdio.js").StdioClientTransport;
var readline = require("readline");
// 导入服务和工具
var LLMService = require("./services/LLMService.js").LLMService;
var ToolService = require("./services/ToolService.js").ToolService;
var defaultConfig = require("./utils/config.js").defaultConfig;
var getApiKey = require("./utils/config.js").getApiKey;
var getModelName = require("./utils/config.js").getModelName;
var getBaseURL = require("./utils/config.js").getBaseURL;
var HttpClientTransport = require("./services/HttpClientTransport.js").HttpClientTransport;
/**
 * MCP客户端类
 * 负责连接服务器、处理查询和工具调用，是应用程序的核心组件
 */
function MCPClient(multiMcpClient, llmConfig) {
    this.transport = null;
    this.tools = [];
    this.messages = [];
    this.multiMcpClient = multiMcpClient || null;
    this.llmConfig = llmConfig || {};
    // 初始化MCP客户端
    this.mcp = new Client({
        name: defaultConfig.clientName,
        version: defaultConfig.clientVersion,
    });
    // 初始化LLM服务
    this.llmService = new LLMService(this.llmConfig);
    // 初始化工具服务
    this.toolService = new ToolService(this.mcp);
}
MCPClient.prototype.getTransportOptionsForScript = function(scriptPath) {
    var isJs = scriptPath.endsWith(".js");
    var isPy = scriptPath.endsWith(".py");
        if (!isJs && !isPy) {
            console.warn("警告: 服务器脚本没有.js或.py扩展名，将尝试使用Node.js运行");
        }
    var command = isPy
        ? (process.platform === "win32" ? "python" : "python3")
            : process.execPath;
        return {
        command: command,
        args: [scriptPath]
        };
};
MCPClient.prototype.connectToServer = function(serverIdentifier, configPath) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var transportOptions;
            var useHttpTransport = false;
            if (configPath) {
                try {
                    var config;
                    if (typeof configPath === 'object') {
                        config = configPath;
                    } else {
                        var fs = require("fs");
                        var configContent = fs.readFileSync(configPath, "utf8");
                        config = JSON.parse(configContent);
                    }
                    // 读取系统提示词（如果有）
                    self.systemPrompt = config.system;
                    self.messages.push({
                        role: "system",
                        content: self.systemPrompt || "",
                    });
                    // 检查服务器标识符是否存在于配置中
                    if (config.mcpServers && config.mcpServers[serverIdentifier]) {
                        var serverConfig = config.mcpServers[serverIdentifier];
                        if (serverConfig.url) {
                            transportOptions = { url: serverConfig.url };
                            useHttpTransport = true;
                            console.log("使用HTTP方式连接服务器: " + serverIdentifier);
                        }
                        else {
                            transportOptions = {
                                command: serverConfig.command,
                                args: serverConfig.args || [],
                                env: serverConfig.env,
                            };
                            console.log("使用配置文件启动服务器: " + serverIdentifier);
                        }
                    }
                    else if (serverIdentifier === "default" &&
                        config.defaultServer &&
                        config.mcpServers[config.defaultServer]) {
                        // 使用默认服务器
                        var defaultServerName = config.defaultServer;
                        var serverConfig2 = config.mcpServers[defaultServerName];
                        if (serverConfig2.url) {
                            transportOptions = { url: serverConfig2.url };
                            useHttpTransport = true;
                            console.log("使用HTTP方式连接默认服务器: " + defaultServerName);
                        }
                        else {
                            transportOptions = {
                                command: serverConfig2.command,
                                args: serverConfig2.args || [],
                                env: serverConfig2.env,
                            };
                            console.log("使用默认服务器: " + defaultServerName);
                        }
                    }
                    else {
                        // 如果指定的服务器不在配置中，打印错误消息
                        throw new Error("在配置文件中未找到服务器 " + serverIdentifier);
                    }
                }
                catch (error) {
                    console.error("读取配置文件错误: " + (error && error.message ? error.message : String(error)));
                    // 如果指定了配置文件但未找到查找未指定的服务器，应直接抛出错误
                    reject(new Error("未能从配置文件 '" + configPath + "' 中加载服务器 '" + serverIdentifier + "'"));
                    return;
                }
            }
            else {
                // 没有提供配置文件，使用传统的脚本路径模式
                transportOptions = self.getTransportOptionsForScript(serverIdentifier);
            }
            // 创建传输层
            if (useHttpTransport && transportOptions.url) {
                // HTTP 传输
                self.transport = new HttpClientTransport({ url: transportOptions.url });
            }
            else {
                // Stdio 传输
                self.transport = new StdioClientTransport(transportOptions);
            }
            // 连接到服务器
            if (self.transport) {
                self.mcp.connect(self.transport);
            }
            // 获取可用工具列表
            self.toolService.getTools().then(function(tools) {
                self.tools = tools;
                resolve();
            }).catch(function(e) {
                reject(e);
            });
        }
        catch (error) {
            console.error("连接到MCP服务器失败: ", error, {
                context: {
                    serverIdentifier: serverIdentifier,
                    configPath: configPath
                }
            });
            reject(new Error("连接失败: " + (error && error.message ? error.message : String(error))));
        }
    });
};
MCPClient.prototype.processQuery = function(query) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            if (!query || typeof query !== 'string' || !query.trim()) {
                return resolve({ reply: "请输入有效的问题内容", toolResults: [] });
            }
            var multiClient = self.multiMcpClient;
            if (!multiClient) {
                return reject(new Error('未注入multiMcpClient实例'));
            }
            multiClient.getAllTools().then(function(allTools) {
                self.tools = allTools.map(function(t) {
                    return {
                        type: 'function',
                        function: {
                            name: t.name,
                            description: t.description || "",
                            parameters: t.inputSchema || {},
                        }
                    };
                });
                var singleMessage = [{ role: "user", content: query }];
                self.llmService.sendMessage(singleMessage, self.tools).then(function(response) {
                    var toolResults = [];
                    var replyText = '';
                    if (!response.choices || !response.choices[0]) {
                        console.log("error", response);
                    }
                    var responseMessage = response.choices[0].message;
                    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                        var toolCall = responseMessage.tool_calls[0];
                        var toolName = toolCall.function.name;
                        var toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                        var toolCallId = toolCall.id || (toolName + '_' + Date.now());
                        var foundTool = allTools.find(function(t) { return t.name === toolName; });
                        var sourceServer = foundTool && foundTool.sourceServer ? foundTool.sourceServer : '';
                        multiClient.callTool(toolName, toolArgs).then(function(toolResult) {
                            // 确保工具结果包含message字段
                            var toolMessage = toolResult.message
                                || (toolResult.result && toolResult.result.message)
                                || (toolResult.result && typeof toolResult.result === 'string' ? toolResult.result : '')
                                || '工具调用完成';

                            toolResults.push({
                                toolName: toolName,
                                toolArgs: toolArgs,
                                result: toolResult,
                                message: toolMessage,
                                sourceServer: toolResult.sourceServer || sourceServer,
                                toolCallId: toolCallId
                            });
                            var replyMsg = toolMessage;
                            if ((toolName === 'generateImage' || toolName === 'generateChart') && toolResult.imageUrl && /插入|粘贴|写入|放到|加到|添加到/.test(query)) {
                                var insertOptions = { targetServer: 'hm-editor' };
                                var editorId = 'editor1';
                                // 解析用户查询中的宽高信息
                                var parsedDimensions = self.parseImageDimensions(query);
                                var insertArgs = { id: editorId, imageUrl: toolResult.imageUrl };
                                if (parsedDimensions.width) insertArgs.width = parsedDimensions.width;
                                if (parsedDimensions.height) insertArgs.height = parsedDimensions.height;
                                // 从查询中提取sessionId并传递给插入工具
                                var sessionIdMatch = query.match(/编辑器MCP会话ID为([^，]+)/);
                                if (sessionIdMatch && sessionIdMatch[1]) {
                                    insertArgs.sessionId = sessionIdMatch[1];
                                }
                                multiClient.callTool('insertImageAtCursor', insertArgs, insertOptions).then(function(insertResult) {
                                    // 确保插入工具结果包含message字段
                                    var insertMessage = insertResult.message
                                        || (insertResult.result && insertResult.result.message)
                                        || (insertResult.result && typeof insertResult.result === 'string' ? insertResult.result : '')
                                        || '图片插入完成';

                                    toolResults.push({
                                        toolName: 'insertImageAtCursor',
                                        toolArgs: insertArgs,
                                        result: insertResult,
                                        message: insertMessage,
                                        sourceServer: insertResult.sourceServer || 'hm-editor',
                                        toolCallId: toolCallId + '_insert'
                                    });
                                    var replyMsg2 = insertMessage;
                                    resolve({ reply: replyMsg2, toolResults: toolResults });
                                }).catch(function(err) {
                                    reject(err);
                                });
                            } else {
                                if (toolResult.imageUrl) {
                                    resolve({ reply: toolResult.imageUrl, toolResults: toolResults });
                                } else {
                                    resolve({ reply: replyMsg, toolResults: toolResults });
                                }
                            }
                        }).catch(function(err) {
                            reject(err);
                        });
                    } else {
                        replyText = responseMessage.content || '';
                        resolve({ reply: replyText, toolResults: [] });
                    }
                }).catch(reject);
            }).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
};

// 解析用户查询中的图片尺寸信息
MCPClient.prototype.parseImageDimensions = function(query) {
    var dimensions = { width: null, height: null };

    // 匹配 "宽40" 或 "宽度40" 或 "width40" 等格式
    var widthMatch = query.match(/(?:宽(?:度)?|width)\s*[：:]*\s*(\d+)/i);
    if (widthMatch) {
        dimensions.width = parseInt(widthMatch[1]);
    }

    // 匹配 "高20" 或 "高度20" 或 "height20" 等格式
    var heightMatch = query.match(/(?:高(?:度)?|height)\s*[：:]*\s*(\d+)/i);
    if (heightMatch) {
        dimensions.height = parseInt(heightMatch[1]);
    }

    return dimensions;
};

MCPClient.prototype.cleanup = function() {
    var self = this;
    return new Promise(function(resolve) {
        // 清空消息历史
        self.messages = [];
        self.messages.push({
            role: "system",
            content: self.systemPrompt || "",
        });
        if (self.mcp) {
            self.mcp.close().then(function() {
                console.log(" 已断开与MCP服务器的连接:");
                resolve();
            }).catch(function(error) {
                console.error("关闭MCP客户端时出错:", error);
                resolve();
            });
        } else {
            resolve();
        }
    });
};

// 新增：流式处理
MCPClient.prototype.processQueryStream = function(query, handlers) {
    var self = this;
    (function() {
        try {
            if (!query || typeof query !== 'string' || !query.trim()) {
                handlers.onDone && handlers.onDone({ reply: "请输入有效的问题内容", toolResults: [] });
                return;
            }
            var multiClient = self.multiMcpClient;
            if (!multiClient) {
                handlers.onError && handlers.onError(new Error('未注入multiMcpClient实例'));
                handlers.onDone && handlers.onDone({ reply: "未注入multiMcpClient实例", toolResults: [] });
                return;
            }
            multiClient.getAllTools().then(function(allTools) {
                self.tools = allTools.map(function(t) {
                    return {
                        type: 'function',
                        function: {
                            name: t.name,
                            description: t.description || "",
                            parameters: t.inputSchema || {},
                        }
                    };
                });
                var singleMessage = [{ role: "user", content: query }];
                self.llmService.sendMessage(singleMessage, self.tools).then(function(response) {
                    var toolResults = [];
                    var replyText = '';
                    if (!response.choices || !response.choices[0]) {
                        handlers.onError && handlers.onError(new Error("LLM无回复"));
                        handlers.onDone && handlers.onDone({ reply: '', toolResults: [] });
                        return;
                    }
                    var responseMessage = response.choices[0].message;
                    if (responseMessage.content) {
                        replyText = responseMessage.content;
                        for (var i = 0; i < replyText.length; i++) {
                            handlers.onToken && handlers.onToken(replyText[i]);
                        }
                    }
                    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                        var toolCall = responseMessage.tool_calls[0];
                        var toolName = toolCall.function.name;
                        var toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                        var toolCallId = toolCall.id || (toolName + '_' + Date.now());
                        handlers.onToolCallPending && handlers.onToolCallPending(toolName, toolArgs, toolCallId);
                        multiClient.callTool(toolName, toolArgs).then(function(toolResult) {
                            var content = typeof toolResult.content === "string" ? toolResult.content : JSON.stringify(toolResult.content);
                            // 确保工具结果包含message字段
                            var toolMessage = toolResult.message
                                || (toolResult.result && toolResult.result.message)
                                || (toolResult.result && typeof toolResult.result === 'string' ? toolResult.result : '')
                                || '工具调用完成';

                            toolResults.push({
                                toolName: toolName,
                                toolArgs: toolArgs,
                                result: toolResult,
                                message: toolMessage,
                                sourceServer: toolResult.sourceServer || '',
                                toolCallId: toolCallId
                            });
                            handlers.onToolCallDone && handlers.onToolCallDone(toolName, toolArgs, toolResult, toolCallId, null);
                            if ((toolName === 'generateImage' || toolName === 'generateChart') && toolResult.imageUrl && /插入|粘贴|写入|放到|加到|添加到/.test(query)) {
                                var insertOptions = { targetServer: 'hm-editor' };
                                var editorId = 'editor1';
                                // 解析用户查询中的宽高信息
                                var parsedDimensions = self.parseImageDimensions(query);
                                var insertArgs = { id: editorId, imageUrl: toolResult.imageUrl };
                                if (parsedDimensions.width) insertArgs.width = parsedDimensions.width;
                                if (parsedDimensions.height) insertArgs.height = parsedDimensions.height;
                                // 从查询中提取sessionId并传递给插入工具
                                var sessionIdMatch = query.match(/编辑器MCP会话ID为([^，]+)/);
                                if (sessionIdMatch && sessionIdMatch[1]) {
                                    insertArgs.sessionId = sessionIdMatch[1];
                                }
                                multiClient.callTool('insertImageAtCursor', insertArgs, insertOptions).then(function(insertResult) {
                                    // 确保插入工具结果包含message字段
                                    var insertMessage = insertResult.message
                                        || (insertResult.result && insertResult.result.message)
                                        || (insertResult.result && typeof insertResult.result === 'string' ? insertResult.result : '')
                                        || '图片插入完成';

                                    toolResults.push({
                                        toolName: 'insertImageAtCursor',
                                        toolArgs: insertArgs,
                                        result: insertResult,
                                        message: insertMessage,
                                        sourceServer: insertResult.sourceServer || 'hm-editor',
                                        toolCallId: toolCallId + '_insert'
                                    });
                                    handlers.onToolCallDone && handlers.onToolCallDone('insertImageAtCursor', insertArgs, insertResult, toolCallId + '_insert', null);
                                    handlers.onDone && handlers.onDone({ reply: insertResult.message || '图片已插入', toolResults: toolResults });
                                }).catch(function(err) {
                                    handlers.onError && handlers.onError(err);
                                    handlers.onDone && handlers.onDone({ reply: '图片插入失败', toolResults: toolResults });
                                });
                            } else {
                                if (toolResult.imageUrl) {
                                    handlers.onDone && handlers.onDone({ reply: toolResult.imageUrl, toolResults: toolResults });
                                } else {
                                    handlers.onDone && handlers.onDone({ reply: toolResult.message || '', toolResults: toolResults });
                                }
                            }
                        }).catch(function(toolError) {
                            handlers.onError && handlers.onError(toolError);
                            handlers.onDone && handlers.onDone({ reply: '工具调用失败', toolResults: toolResults });
                        });
                    } else {
                        handlers.onDone && handlers.onDone({ reply: replyText, toolResults: toolResults });
                    }
                }).catch(function(error) {
                    handlers.onError && handlers.onError(error);
                    handlers.onDone && handlers.onDone({ reply: "处理查询时出错: " + (error && error.message ? error.message : String(error)), toolResults: [] });
                });
            }).catch(function(error) {
                handlers.onError && handlers.onError(error);
                handlers.onDone && handlers.onDone({ reply: "处理查询时出错: " + (error && error.message ? error.message : String(error)), toolResults: [] });
            });
        } catch (error) {
            handlers.onError && handlers.onError(error);
            handlers.onDone && handlers.onDone({ reply: "处理查询时出错: " + (error && error.message ? error.message : String(error)), toolResults: [] });
        }
    })();
};

module.exports = {
    MCPClient: MCPClient
};