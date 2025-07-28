var path = require("path");
var fs = require("fs");
var logsDir = path.join(__dirname, "../../logs");
var index = 0;
var logType = {
    GetTools: "GET-TOOLS",
    GetToolsError: "GET-TOOLS-ERR",
    ConnectToServer: "CONNECT",
    LLMRequest: "LLM-REQ",
    LLMResponse: "LLM-RESP",
    LLMError: "LLM-ERR",
    LLMStream: "LLM-STREAM",
    ToolCall: "TOOL-CALL",
    ToolCallResponse: "TOOL-RESP",
    ToolCallError: "TOOL-ERR"
};
/**
 * 清空日志目录
 */
function clearLogs() {
    // 无操作
}
/**
 * 添加日志
 * @param logData
 */
function addLogs(logData, type) {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, "0");
    var m = String(now.getMinutes()).padStart(2, "0");
    var s = String(now.getSeconds()).padStart(2, "0");
    var prefix = "[" + (type || "LOG") + "][" + h + ":" + m + ":" + s + "] ";
    if (typeof logData === "string") {
        console.log(prefix + logData);
    } else {
        try {
            console.log(prefix + JSON.stringify(logData));
        } catch (e) {
            console.log(prefix + String(logData));
    }
    }
}
module.exports = {
    logType: logType,
    clearLogs: clearLogs,
    addLogs: addLogs
};
