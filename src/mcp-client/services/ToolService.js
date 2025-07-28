/**
 * 工具服务模块
 * 负责处理与MCP工具相关的逻辑
 */
var patchSchemaArrays = require("../utils/schema.js").patchSchemaArrays;
var addLogs = require("../utils/log.js").addLogs;
var logType = require("../utils/log.js").logType;
/**
 * 工具服务类
 * 提供工具列表获取和工具调用功能
 */
function ToolService(client) {
        this.client = client;
    }
ToolService.prototype.getTools = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            addLogs("获取工具列表--start", logType.GetTools);
            self.client.listTools().then(function(toolsResult) {
                var logInfo = toolsResult.tools.map(function(tool) {
                    return { name: tool.name, description: tool.description };
                });
                addLogs("获取工具列表logInfo:" + JSON.stringify(logInfo), logType.GetTools);
                // 直接返回{name, description, inputSchema}结构
                var tools = toolsResult.tools.map(function(tool) {
                    return {
                        name: tool.name,
                        description: tool.description || "",
                        inputSchema: patchSchemaArrays(tool.inputSchema) || { type: 'object', properties: {} }
                    };
                });
                resolve(tools);
            }).catch(function(error) {
                addLogs({
                    error: error && error.message ? { name: error.name, message: error.message, stack: error.stack } : error,
                    context: { method: "listTools" }
                }, logType.GetToolsError);
                reject(new Error("获取工具列表失败: " + (error && error.message ? error.message : String(error))));
            });
        } catch (error) {
            addLogs({
                error: error && error.message ? { name: error.name, message: error.message, stack: error.stack } : error,
                context: { method: "listTools" }
            }, logType.GetToolsError);
            reject(new Error("获取工具列表失败: " + (error && error.message ? error.message : String(error))));
        }
    });
};
ToolService.prototype.callTool = function(toolName, toolArgs, options) {
    var self = this;
    options = options || {};
    // 多MCPClient场景
    if (self.client && typeof self.client.getAllTools === 'function' && typeof self.client.servicePool === 'object') {
        return self.client.getAllTools().then(function(allTools) {
            var found = allTools.find(function(t) { return t.name === toolName; });
            var targetServer = options.targetServer;
            if (!targetServer && found && found.sourceServer) {
                targetServer = found.sourceServer;
            }
            if (!targetServer) {
                targetServer = self.client.defaultServer || Array.from(self.client.servicePool.keys())[0];
            }
            // 日志：明确工具路由
            if (typeof console !== 'undefined' && console.log) {
                console.log('[TOOL-ROUTE] 调用工具', toolName, '目标服务:', targetServer);
            }
            var serviceInfo = self.client.servicePool.get(targetServer);
            if (!serviceInfo) {
                return Promise.reject(new Error('未找到工具所属服务: ' + toolName));
            }
            // 递归调用时，options.targetServer 只在第一层有效，后续必须清除
            var nextOptions = {};
            for (var k in options) {
                if (k !== 'targetServer') nextOptions[k] = options[k];
            }
            return serviceInfo.client.toolService.callTool(toolName, toolArgs, nextOptions);
        });
    }
    // 单服务场景
    return new Promise(function(resolve, reject) {
        try {
            addLogs({ name: toolName, arguments: toolArgs }, logType.ToolCall);
            self.client.callTool({ name: toolName, arguments: toolArgs }).then(function(result) {
                addLogs(result, logType.ToolCallResponse);
                resolve(Object.assign({}, result, {
                    content: typeof result.content === "string" ? result.content : JSON.stringify(result.content)
                }));
            }).catch(function(error) {
                addLogs({
                    error: error && error.message ? { name: error.name, message: error.message, stack: error.stack } : error,
                    context: { method: "callTool", toolName: toolName, toolArgs: toolArgs }
                }, logType.ToolCallError);
                reject(new Error("调用工具 " + toolName + " 失败: " + (error && error.message ? error.message : String(error))));
            });
        } catch (error) {
            addLogs({
                error: error && error.message ? { name: error.name, message: error.message, stack: error.stack } : error,
                context: { method: "callTool", toolName: toolName, toolArgs: toolArgs }
            }, logType.ToolCallError);
            reject(new Error("调用工具 " + toolName + " 失败: " + (error && error.message ? error.message : String(error))));
        }
    });
};
module.exports = {
    ToolService: ToolService
};
