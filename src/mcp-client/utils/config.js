/**
 * 配置工具模块
 * 负责处理环境变量和配置信息
 */
var dotenv = require("dotenv");
// 加载环境变量
dotenv.config();
/**
 * 检查必要的环境变量是否已配置
 * @throws 如果必需的环境变量未设置，则抛出错误
 */
function validateEnv() {
    var DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
        throw new Error("DEEPSEEK_API_KEY 未设置，请在.env文件中配置您的API密钥");
    }
}
/**
 * 获取 Deepseek API 密钥
 * @returns Deepseek API密钥
 */
function getApiKey() {
    return process.env.DEEPSEEK_API_KEY || "";
}
/**
 * 获取配置的LLM模型名称
 * 如果环境变量中未指定，则使用默认值
 * @returns 模型名称
 */
function getModelName() {
    return process.env.MODEL_NAME || "deepseek-chat";
}
function getBaseURL() {
    return process.env.BASE_URL || "https://api.deepseek.com/v1";
}
/**
 * 默认配置
 */
var defaultConfig = {
    clientName: "mcp-client-cli",
    clientVersion: "1.0.0",
    defaultModel: "deepseek-chat"
};
module.exports = {
    validateEnv: validateEnv,
    getApiKey: getApiKey,
    getModelName: getModelName,
    getBaseURL: getBaseURL,
    defaultConfig: defaultConfig
};
