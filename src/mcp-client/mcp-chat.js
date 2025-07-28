var express = require('express');
var router = express.Router();

// 引入MultiMCPClient
var MultiMCPClient = require('./multi-mcp-client.js').MultiMCPClient;
var MCPClient = require('./mcp-client.js').MCPClient;

// ========== 多客户端MCP/LLM配置管理 ==========
const clientMap = {}; // id -> { mcpClient, multiMcpClient, mcpReady, config, llmConfig }

function initMcpClient(config) {
    const { id, mcpServers, llmConfig, ...rest } = config;
    if (!id) throw new Error('缺少id');
    const multiMcpClient = new MultiMCPClient();
    multiMcpClient.config = { mcpServers, ...rest };
    const mcpClient = new MCPClient(multiMcpClient, llmConfig);
    return multiMcpClient.initializeAll(multiMcpClient.config)
        .then(() => {
            clientMap[id] = {
                mcpClient,
                multiMcpClient,
                mcpReady: true,
                config,
                llmConfig
            };
        })
        .catch(err => {
            clientMap[id] = { mcpReady: false };
            throw err;
        });
}
function getClient(id) {
    return clientMap[id];
}

function now() {
    var d = new Date();
    return d.toISOString();
}

// ========== 路由 ==========
router.post('/init', async function(req, res) {
    console.log('[ai-chat/init] 入参:', JSON.stringify(req.body, null, 2));
    try {
        await initMcpClient(req.body);
        res.json({ code: 0, message: '初始化成功' });
    } catch (e) {
        res.status(500).json({ code: 500, message: '初始化失败', error: e.message });
    }
});

router.post('/chat', function(req, res) {
    const { id, message, options, sessionId } = req.body || {};
    const client = getClient(id);
    if (!client) {
        return res.status(400).json({ code: 400, message: '未找到该会话配置，请先初始化AI对话设置' });
    }
    console.log('[ai-chat/chat] 当前client配置:', JSON.stringify(client, null, 2));
    if (!client.mcpReady) {
        return res.status(500).json({ code: 500, message: 'MCP未初始化，请先设置并初始化' });
    }

    // 在message前面拼接sessionId信息
    let enhancedMessage = message;
    if (sessionId) {
        enhancedMessage = `编辑器MCP会话ID为${sessionId}，${message}`;
    }

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    client.mcpClient.processQuery(enhancedMessage, options)
        .then(function(result) {
            var reply = (typeof result.reply === 'string') ? result.reply : (result.reply == null ? '' : String(result.reply));
            var toolResults = Array.isArray(result.toolResults) ? result.toolResults : [];
            var i = 0;
            function sendChar() {
                if (i < reply.length) {
                    res.write('data: ' + JSON.stringify({ token: reply[i] }) + '\n\n');
                    i++;
                    setTimeout(sendChar, 30);
                } else {
                    res.write('data: ' + JSON.stringify({ done: true, reply: reply, toolResults: toolResults, sourceServer: result.sourceServer }) + '\n\n');
                    res.end();
                }
            }
            sendChar();
        })
        .catch(function(err) {
            var errorMsg = err && err.message ? err.message : String(err);
            res.write('data: ' + JSON.stringify({ error: errorMsg }) + '\n\n');
            res.end();
        });
});

module.exports = router;