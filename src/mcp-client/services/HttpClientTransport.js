var axios = require("axios");
var globalRpcId = 0;
function HttpClientTransport(options) {
        this.url = options.url;
    }
HttpClientTransport.prototype.start = function() {
        // 兼容 SDK，HTTP 传输无需实际启动
    return Promise.resolve();
};
HttpClientTransport.prototype.listTools = function(id) {
    return this._postRaw({ method: 'tools/list', params: {}, id: (typeof id !== 'undefined' ? id : globalRpcId++), jsonrpc: '2.0' });
};
HttpClientTransport.prototype.callTool = function(params, id) {
    return this._postRaw({ method: 'tools/call', params: params, id: (typeof id !== 'undefined' ? id : globalRpcId++), jsonrpc: '2.0' });
};
HttpClientTransport.prototype.close = function() {
        // HTTP 无需特殊关闭操作
    return Promise.resolve();
};
HttpClientTransport.prototype.send = function(payload) {
    var self = this;
        // 打印 notifications/cancelled 的堆栈
        if (payload && typeof payload === 'object' && payload.method === 'notifications/cancelled') {
            console.trace('[HttpClientTransport] send notifications/cancelled stack trace');
        }
        // 1. 字符串类型
        if (typeof payload === 'string') {
            if (payload === 'listTools' || payload === 'tools/list') {
            return self.listTools();
        } else if (payload === 'close') {
            return self.close();
        } else {
            return Promise.resolve();
            }
        }
        // 2. 对象类型，method 字段
        if (payload && typeof payload === 'object') {
            switch (payload.method) {
                case 'initialize':
                case 'notifications/initialized':
                case 'notifications/cancelled':
                case 'prompts/list':
                case 'get_prompt':
                case 'prompts/get':
                case 'resources/list':
                case 'read_resource':
                case 'close':
                return self._postRaw(payload);
                case 'tools/list':
                case 'listTools':
                return self.listTools(payload.id);
                case 'tools/call':
                case 'callTool':
                return self.callTool(payload.params, payload.id);
                default:
                    // 兼容 action 字段
                    if (payload.action === 'listTools') {
                    return self.listTools();
                } else if (payload.action === 'callTool') {
                    return self.callTool(payload.params);
                } else if (payload.action === 'close') {
                    return self.close();
                    }
                    // 其它未知 method 直接转发
                return self._postRaw(payload);
            }
        }
    return Promise.resolve();
};
HttpClientTransport.prototype._postRaw = function(body) {
    var self = this;
    var fullUrl = self.url;
    if (!body.jsonrpc) body.jsonrpc = '2.0';
    console.log('[HTTP] POST ' + fullUrl);
    console.log('[HTTP] POST Body:', body);
    return axios.post(fullUrl, body)
        .then(function(response) {
            console.log('[HTTP] Response (' + fullUrl + ') [' + body.method + ']:', response.data);
            var onmessage = self.onmessage;
            if (onmessage) {
                setTimeout(function() { onmessage(response.data); }, 0);
            }
            return;
        })
        .catch(function(err) {
            var e = err;
            console.error('[HTTP] Error (' + fullUrl + '):', (e && e.response && e.response.data) || e);
            throw err;
        });
};
module.exports = {
    HttpClientTransport: HttpClientTransport
};
