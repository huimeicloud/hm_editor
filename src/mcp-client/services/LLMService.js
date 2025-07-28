/**
 * LLM服务模块
 * 负责与deepseek API的交互
 */
var axios = require("axios");
var addLogs = require("../utils/log.js").addLogs;
var logType = require("../utils/log.js").logType;
/**
 * LLM服务类
 * 提供发送消息和处理回复的功能
 */
function LLMService(llmConfig) {
    this.apiKey = llmConfig.apiKey;
    this.model = llmConfig.name || "deepseek-chat";
    this.baseURL = llmConfig.apiUrl || "";
    this.type = llmConfig.type || "";
}
LLMService.prototype.sendMessage = function(messages, tools) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            console.log('[LLMService] 当前baseURL:', self.baseURL);
            if (!self.baseURL) {
                return reject(new Error("LLM服务未配置API地址，请在llmConfig.apiUrl中填写大模型API地址"));
            }
            addLogs({
                model: self.model,
                messages: messages,
                tools: tools && tools.length > 0 ? tools : undefined,
                tool_choice: tools && tools.length > 0 ? "auto" : undefined,
            }, logType.LLMRequest);
            axios.post(self.baseURL + "/chat/completions", {
                model: self.model,
                messages: messages,
                tools: tools && tools.length > 0 ? tools : undefined,
                tool_choice: tools && tools.length > 0 ? "auto" : undefined,
            }, {
                headers: {
                    "Authorization": "Bearer " + self.apiKey,
                    "Content-Type": "application/json",
                },
            }).then(function(response) {
            addLogs(response.data, logType.LLMResponse);
                resolve(response.data);
            }).catch(function(error) {
                addLogs(error, logType.LLMError);
                let errMsg = "发送消息到LLM失败: " + (error && error.message ? error.message : String(error));
                if (error && error.response) {
                    errMsg += `\n[LLM-HTTP] 状态码: ${error.response.status}`;
                    errMsg += `\n[LLM-HTTP] 返回体: ${JSON.stringify(error.response.data)}`;
                }
                if (error && error.config) {
                    errMsg += `\n[LLM-HTTP] 请求配置: ${JSON.stringify({url: error.config.url, method: error.config.method, headers: error.config.headers, data: error.config.data})}`;
                }
                reject(new Error(errMsg));
            });
        } catch (error) {
            addLogs(error, logType.LLMError);
            reject(new Error("发送消息到LLM失败: " + (error && error.message ? error.message : String(error))));
        }
    });
};
LLMService.prototype.getModel = function() {
        return this.model;
};
LLMService.prototype.setModel = function(model) {
        this.model = model;
};
module.exports = {
    LLMService: LLMService
};
