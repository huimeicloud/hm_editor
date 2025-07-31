var express = require('express');
var WebSocket = require('ws');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');

var wsClients = new Map(); // sessionId -> { ws, lastHeartbeat, connectTime }
var pendingCommands = new Map(); // commandId -> { resolve, reject, timeout }
var heartbeatInterval = null; // 心跳定时器

// 心跳间隔时间（毫秒）
const HEARTBEAT_INTERVAL = 30000; // 30秒
const CLIENT_TIMEOUT = 120000; // 2分钟无心跳则断开

function getSessionId(req) {
  // 从cookie、header或url参数获取sessionId
  return req.headers['x-session-id'] || req.query.sessionId || (req.cookies && req.cookies.sessionId) || null;
}

function broadcastCommand(method, params, targetSessionId) {
  return new Promise(function(resolve, reject) {
    var commandId = 'ws_' + Date.now() + '_' + Math.random();

    // 设置超时
    var timeout = setTimeout(function() {
      pendingCommands.delete(commandId);
      reject(new Error('WebSocket command timeout'));
    }, 10000);

    pendingCommands.set(commandId, { resolve: resolve, reject: reject, timeout: timeout });

    var message = {
      jsonrpc: '2.0',
      id: commandId,
      method: method,
      params: params
    };

    if (targetSessionId) {
      // 发送给特定客户端
      var clientInfo = wsClients.get(targetSessionId);
      if (clientInfo && clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(JSON.stringify(message));
      } else {
        clearTimeout(timeout);
        pendingCommands.delete(commandId);
        reject(new Error('Target client not connected'));
      }
    } else {
      clearTimeout(timeout);
      pendingCommands.delete(commandId);
      reject(new Error('No sessionId specified'));
    }
  });
}

// 启动心跳机制
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    const disconnectedSessions = [];

    wsClients.forEach((clientInfo, sessionId) => {
      // 检查客户端是否超时 - 增加更长的超时时间
      if (now - clientInfo.lastHeartbeat > CLIENT_TIMEOUT) {
        console.log('客户端心跳超时，断开连接:', sessionId);
        if (clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
          clientInfo.ws.close(1000, 'Heartbeat timeout');
        }
        disconnectedSessions.push(sessionId);
      } else {
        // 发送心跳包 - 添加错误处理
        if (clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
          try {
            clientInfo.ws.send(JSON.stringify({
              type: 'heartbeat',
              timestamp: now
            }));
            //console.log('发送心跳包到客户端:', sessionId);
          } catch (error) {
            console.error('发送心跳包失败:', error);
            disconnectedSessions.push(sessionId);
          }
        }
      }
    });

    // 清理断开的连接
    disconnectedSessions.forEach(sessionId => {
      wsClients.delete(sessionId);
    });

    // 清理超时的pending命令
    pendingCommands.forEach((command, commandId) => {
      if (now - command.createTime > 30000) { // 30秒超时
        clearTimeout(command.timeout);
        pendingCommands.delete(commandId);
        command.reject(new Error('Command timeout'));
      }
    });
  }, HEARTBEAT_INTERVAL);
}

// 停止心跳机制
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function registerMcpWebSocket(server) {
  var wss = new WebSocket.Server({ server: server, path: '/mcp-server/ws' });

  // 启动心跳机制
  startHeartbeat();

  wss.on('connection', function(ws, req) {
    let sessionId = uuidv4();
    const connectTime = Date.now();

    // 存储客户端信息
    wsClients.set(sessionId, {
      ws: ws,
      lastHeartbeat: connectTime,
      connectTime: connectTime
    });

    console.log('WebSocket客户端连接:', sessionId, '当前连接数:', wsClients.size);

    // 主动推送sessionId给前端
    ws.send(JSON.stringify({
      type: 'session',
      sessionId: sessionId,
      timestamp: connectTime
    }));

    ws.on('message', function(msg) {
      try {
        var data = JSON.parse(msg);
        // 处理心跳响应
        if (data.type === 'heartbeat') {
          const clientInfo = wsClients.get(sessionId);
          if (clientInfo) {
            clientInfo.lastHeartbeat = Date.now();
            // 发送心跳确认
            ws.send(JSON.stringify({
              type: 'heartbeat_ack',
              timestamp: Date.now()
            }));
          }
          return;
        }
        console.log('Received WebSocket message:', data);
        // 处理响应
        var pending = pendingCommands.get(data.id);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingCommands.delete(data.id);

          if (data.error) {
            pending.reject(new Error(data.error.message));
          } else {
            pending.resolve(data.result);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', function(code, reason) {
      console.log('WebSocket客户端断开连接:', sessionId, '代码:', code, '原因:', reason);
      wsClients.delete(sessionId);
      console.log('当前连接数:', wsClients.size);
    });

    ws.on('error', function(error) {
      console.error('WebSocket错误:', sessionId, error);
      wsClients.delete(sessionId);
    });
  });

  // 服务器关闭时清理
  wss.on('close', function() {
    stopHeartbeat();
    wsClients.clear();
    pendingCommands.clear();
  });

  return wss;
}

function SimpleMCPServer() {
    this.tools = new Map();
    this.prompts = new Map();
}

SimpleMCPServer.prototype.registerTool = function(name, handler, metadata) {
  if (metadata === void 0) metadata = {};
  this.tools.set(name, { handler: handler, metadata: metadata });
};

SimpleMCPServer.prototype.registerPrompt = function(name, handler, metadata) {
  if (metadata === void 0) metadata = {};
  this.prompts.set(name, { handler: handler, metadata: metadata });
};

SimpleMCPServer.prototype.getToolsCapabilities = function() {
  var self = this;
  return Array.from(this.tools.entries()).reduce(function(acc, entry) {
    var name = entry[0];
    var metadata = entry[1].metadata;
    acc[name] = metadata;
      return acc;
    }, {});
};

SimpleMCPServer.prototype.getPromptsCapabilities = function() {
  var self = this;
  return Array.from(this.prompts.entries()).reduce(function(acc, entry) {
    var name = entry[0];
    var metadata = entry[1].metadata;
    acc[name] = metadata;
      return acc;
    }, {});
};

SimpleMCPServer.prototype.handleRequest = function(req, res) {
  var self = this;

  return new Promise(function(resolve, reject) {
    try {
      var method = req.body.method;
      var params = req.body.params;
      var id = req.body.id;

      console.log('MCP request:', { method: method, params: params, id: id });

      switch (method) {
        case 'initialize':
          var response = {
            jsonrpc: '2.0',
            id: id,
            result: {
              protocolVersion: '2025-06-18',
              capabilities: {
                tools: {},
                prompts: {},
                resources: {}
              },
              serverInfo: {
                name: 'hmEditor-mcp-server',
                version: '1.0.0'
              }
            }
          };
          console.log('MCP response:', response);
          res.json(response);
          break;

        case 'notifications/initialized':
          var response2 = {
            jsonrpc: '2.0',
            id: id,
            result: { success: true }
          };
          console.log('MCP response:', response2);
          res.json(response2);
          break;

        case 'notifications/cancelled':
          var response_cancel = {
            jsonrpc: '2.0',
            id: id,
            result: { success: true }
          };
          console.log('MCP response:', response_cancel);
          res.json(response_cancel);
          break;

        case 'tools/list':
          var response3 = {
            jsonrpc: '2.0',
            id: id,
            result: {
              tools: Array.from(self.tools.entries()).map(function(entry) {
                var name = entry[0];
                var metadata = entry[1].metadata;
                return {
                  name: name,
                description: metadata.description || '',
                inputSchema: metadata.inputSchema || {}
                };
              })
            }
          };
          console.log('MCP response:', response3);
          res.json(response3);
          break;

        case 'tools/call':
          var name = params.name;
          var args = params.arguments;
          var tool = self.tools.get(name);

          if (!tool) {
            var response4 = {
              jsonrpc: '2.0',
              id: id,
              error: {
                code: -32601,
                message: 'Tool not found: ' + name
              }
            };
            console.log('MCP response:', response4);
            res.json(response4);
            return;
          }

          // 从args中获取sessionId
          let sessionId = args.sessionId;
          if (!sessionId) {
            var response4_1 = {
              jsonrpc: '2.0',
              id: id,
              error: {
                code: -32602,
                message: 'Missing required parameter: sessionId'
              }
            };
            console.log('MCP response:', response4_1);
            res.json(response4_1);
            return;
          }

          broadcastCommand(name, args, sessionId).then(function(wsResult) {
            var response5 = {
              jsonrpc: '2.0',
              id: id,
              result: wsResult
            };
            console.log('MCP response:', response5);
            res.json(response5);
          }).catch(function(error) {
            var response6 = {
              jsonrpc: '2.0',
              id: id,
              error: {
                code: -32603,
                message: error.message
              }
            };
            console.log('MCP response:', response6);
            res.json(response6);
            });
          break;

        case 'prompts/list':
          var response7 = {
            jsonrpc: '2.0',
            id: id,
            result: {
              prompts: Array.from(self.prompts.entries()).map(function(entry) {
                var name = entry[0];
                var metadata = entry[1].metadata;
                return {
                  name: name,
                description: metadata.description || '',
                arguments: metadata.arguments || {}
                };
              })
            }
          };
          console.log('MCP response:', response7);
          res.json(response7);
          break;

        default:
          console.log('Unknown method:', method);
          var response8 = {
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32601,
              message: 'Method \'' + method + '\' not found'
            }
          };
          console.log('MCP response:', response8);
          res.json(response8);
      }
    } catch (error) {
      console.error('Error handling MCP request:', error);
      var response9 = {
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: error.message
        }
      };
      console.log('MCP response:', response9);
      res.json(response9);
    }
  });
};

// 创建 MCP 服务器实例
var mcpServer = new SimpleMCPServer();

// 通用WebSocket工具封装
function wsToolWrapper(method, handler) {
  return function(args) {
    return new Promise(function(resolve, reject) {
      try {
        if (typeof wsManager !== 'undefined' && wsManager && wsManager.sendCommandWithAck) {
          wsManager.sendCommandWithAck(method, args, function(result) {
            // 只有明确 result.success === true 才允许自定义 message，否则一律兜底
            let msg = `已调用方法:${method}，请在页面上查看效果`;
            if (result && result.success === true && result.message) {
              msg = result.message;
            }
            resolve({
              success: !!(result && result.success),
              message: msg,
              result: result
            });
          }, function(err) {
            reject(new Error(method + ' WebSocket回调失败: ' + (err && err.message ? err.message : String(err))));
          });
        } else {
          Promise.resolve(handler(args)).then(function(res) {
            resolve({
              success: true,
              message: (res && res.message) || (typeof res === 'string' ? res : '') || `已调用方法:${method}，请在页面上查看效果`,
              result: res
            });
          }).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  };
}

// 工具注册示例
mcpServer.registerTool('destroyEditor', wsToolWrapper('destroyEditor', function(args) {
  return {
    success: true,
    message: '已调用方法:destroyEditor，请在页面上查看效果',
    editorId: args.id
  };
}), {
  description: '【编辑器】销毁指定ID的医学文档/病历/病历文件编辑器实例',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '编辑器实例ID' }
    },
    required: ['sessionId']
  }
});

// 注册 setDocData
mcpServer.registerTool('setDocData', wsToolWrapper('setDocData', function(args) {
  return Promise.resolve({ success: true, message: '文档数据元已设置', args: args });
}), {
  description: '【文档/病历】设置指定编辑器实例的文档/病历/病历文件数据元（如患者信息、结构化数据）',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '编辑器实例ID' },
      code: { type: 'string', description: '文档唯一编号' },
      data: {
        type: 'array',
        description: '数据元数组',
        items: {
          type: 'object',
          properties: {
            keyName: { type: 'string', description: '数据元名称/栏目名称/字段名称' },
            keyValue: { type: 'string', description: '数据元值/栏目值/字段值' }
          },
          required: ['keyName', 'keyValue']
        }
      }
    },
    required: ['sessionId']
  }
});
// 注册 getDocText
mcpServer.registerTool('getDocText', wsToolWrapper('getDocText', function(args) {
    return { success: true, message: '文档纯文本内容已获取', args };
}), {
  description: '获取指定编辑器实例的文档纯文本内容。\n\n用途：用于提取当前文档的全部文本内容，适合做内容分析、全文检索、摘要等场景。\n输入参数需包含编辑器实例ID（id），可选文档唯一编号（code）。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '【必填】编辑器实例ID，用于唯一标识目标编辑器。' },
      code: { type: 'string', description: '【可选】文档唯一编号，便于多文档场景下区分。' }
    },
    required: ['sessionId']
  },
  estimatedTokens: 50, // 预估消耗token数
  timeout: 3000, // 毫秒
  errorCodes: {
    '404': '未找到对应编辑器实例',
    '401': '无权限访问',
    '500': '内部错误'
  }
});
// 注册 getDocContent
mcpServer.registerTool('getDocContent', wsToolWrapper('getDocContent', function(args) {
  return Promise.resolve({ success: true, message: '文档内容已获取', args: args });
}), {
  description: '获取文档内容',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '编辑器实例ID' },
      code: { type: 'string', description: '文档唯一编号（可选）' }
    },
    required: ['sessionId']
  }
});

// 注册 getDocHtml
mcpServer.registerTool('getDocHtml', wsToolWrapper('getDocHtml', function(args) {
  return Promise.resolve({ success: true, message: '文档HTML源码已获取', args: args });
}), {
  description: '获取指定编辑器实例的文档 HTML 源码。\n\n用途：用于导出、存档、富文本渲染等场景，返回完整 HTML 字符串。\n输入参数需包含编辑器实例ID（id），可选文档唯一编号（code）。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '【必填】编辑器实例ID，用于唯一标识目标编辑器。' },
      code: { type: 'string', description: '【可选】文档唯一编号，便于多文档场景下区分。' }
    },
    required: ['sessionId', 'id']
  }
});

// 注册 getDocData
mcpServer.registerTool('getDocData', wsToolWrapper('getDocData', function(args) {
  return Promise.resolve({ success: true, message: '文档数据元信息已获取', args: args });
}), {
  description: '获取指定编辑器实例的文档数据元信息。\n\n用途：用于提取文档内所有结构化数据元（如患者信息、诊断、医嘱等），适合做数据分析、表单填充、自动化处理等场景。\n输入参数需包含编辑器实例ID（id），可选文档唯一编号（code）和数据元编码列表（keyList）。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '【必填】编辑器实例ID，用于唯一标识目标编辑器。' },
      code: { type: 'string', description: '【可选】文档唯一编号，便于多文档场景下区分。' },
      keyList: { type: 'array', description: '【可选】需要获取的数据元编码列表，仅返回指定数据元。', items: { type: 'string' } }
    },
    required: ['sessionId', 'id']
  }
});

// 注册 setDocReadOnly
mcpServer.registerTool('setDocReadOnly', wsToolWrapper('setDocReadOnly', function(args) {
  return Promise.resolve({ success: true, message: '文档只读状态已设置', args: args });
}), {
  description: '设置指定编辑器实例的文档为只读或可编辑状态。\n\n用途：用于控制文档是否允许编辑，适合流程审批、只读浏览、权限管控等场景。\n输入参数需包含编辑器实例ID（id），可选文档唯一编号（code），以及只读标志（flag）。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '【必填】编辑器实例ID，用于唯一标识目标编辑器。' },
      code: { type: 'string', description: '【可选】文档唯一编号，便于多文档场景下区分。' },
      flag: { type: 'boolean', description: '【必填】是否只读，true 表示只读，false 表示可编辑。' }
    },
    required: ['sessionId', 'id', 'flag']
  }
});

// 注册 setDocWatermark
mcpServer.registerTool('setDocWatermark', wsToolWrapper('setDocWatermark', function(args) {
  return { success: true, message: '文档水印已设置', args };
}), {
  description: '设置指定编辑器实例的文档水印内容及样式。\n\n用途：用于在文档中添加防伪标识、版权声明、用户信息等水印，适合敏感信息保护、审计追踪等场景。\n输入参数：\n- id【必填】：编辑器实例ID，用于唯一标识目标编辑器。\n- watermark【必填】：水印内容，支持文本。\n- watermarkColumn【可选】：水印列数，决定水印横向分布数量。\n- watermarkFontColor【可选】：水印字体颜色，字符串，默认黑色。\n- watermarkFontSize【可选】：水印字体大小，数字，单位px，默认12。\n- watermarkAlpha【可选】：水印透明度，数字，0~1，默认0.5。\n- watermarkAngle【可选】：水印倾斜度数，数字，默认15。\n- watermarkHeight【可选】：水印高度，数字，单位px，默认50。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '【必填】编辑器实例ID，用于唯一标识目标编辑器。' },
      watermark: { type: 'string', description: '【必填】水印内容，支持文本。' },
      watermarkColumn: { type: 'number', description: '【可选】水印列数，决定水印横向分布数量。' },
      watermarkFontColor: { type: 'string', description: '【可选】水印字体颜色，默认黑色。' },
      watermarkFontSize: { type: 'number', description: '【可选】水印字体大小，默认12px。' },
      watermarkAlpha: { type: 'number', description: '【可选】水印透明度，默认0.5。' },
      watermarkAngle: { type: 'number', description: '【可选】水印倾斜度数，默认15度。' },
      watermarkHeight: { type: 'number', description: '【可选】水印高度，默认50px。' }
    },
    required: ['sessionId', 'id', 'watermark']
  }
});

// 注册 setDocReviseMode
mcpServer.registerTool('setDocReviseMode', wsToolWrapper('setDocReviseMode', function(args) {
  return Promise.resolve({ success: true, message: '修订模式已设置', args });
}), {
  description: '【文档/病历】设置指定编辑器实例的文档/病历/病历文件修订模式（如开启/关闭修订）',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      id: { type: 'string', description: '【可选】编辑器实例ID，用于唯一标识目标编辑器。' },
      code: { type: 'string', description: '【可选】文档唯一编号，便于多文档场景下区分。' },
      flag: { type: 'boolean', description: '【必填】是否启用修订模式，true表示启用修订跟踪，false表示关闭修订跟踪。' }
    },
    required: ['sessionId', 'flag']
  }
});

// 注册 insertImageAtCursor
mcpServer.registerTool('insertImageAtCursor', wsToolWrapper('insertImageAtCursor', function(args) {
  return Promise.resolve({ success: true, message: '图片已插入到编辑器光标处', args });
}), {
  description: '【插图】插入图片（如检查结果、图表、医学影像）到指定文档/病历/病历文件编辑器实例的光标处，常用于病历插图',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      imageUrl: { type: 'string', description: '图片地址，支持HTTP/HTTPS URL或base64字符串。' },
      htmlstr: { type: 'string', description: 'html字符串' },
      width: { type: 'number', description: '【可选】图片显示宽度，单位像素。如未指定则使用原始宽度。' },
      height: { type: 'number', description: '【可选】图片显示高度，单位像素。如未指定则使用原始高度。' },
    },
    required: ['sessionId']
  }
});

// 注册 insertDataAtCursor
mcpServer.registerTool('insertDataAtCursor', wsToolWrapper('insertDataAtCursor',function(args) {
  return Promise.resolve({ success: true, message: '内容已插入到编辑器光标处', args });
}), {
  description: '在编辑器光标位置插入文本内容，支持纯文本和HTML格式。如果没有指定编辑器ID，将自动使用当前激活的编辑器实例。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: '编辑器MCP会话ID' },
      content: {
        type: 'string',
        description: '要插入的内容，支持纯文本和HTML格式。HTML标签会被正确解析和渲染。例如：普通文本、<p>段落</p>、<strong>粗体</strong>等。'
      }
    },
    required: ['sessionId', 'content']
  }
});


// 根路径
router.get('/', function(req, res) {
  res.json({
    message: '惠每电子病历编辑器接口',
    version: '1.0.0',
    endpoints: {
      '/mcp-http': 'MCP HTTP接口',
      '/mcp-server/ws': 'MCP WebSocket接口',
      '/mcp-server/status': 'WebSocket连接状态'
    }
  });
});

// WebSocket连接状态检查接口
router.get('/mcp-server/status', function(req, res) {
  const sessionId = req.query.sessionId;

  if (sessionId) {
    // 检查特定会话的连接状态
    const clientInfo = wsClients.get(sessionId);
    if (clientInfo) {
      res.json({
        success: true,
        sessionId: sessionId,
        isConnected: clientInfo.ws.readyState === WebSocket.OPEN,
        lastHeartbeat: clientInfo.lastHeartbeat,
        connectTime: clientInfo.connectTime,
        uptime: Date.now() - clientInfo.connectTime
      });
    } else {
      res.json({
        success: false,
        message: '会话不存在或已断开',
        sessionId: sessionId
      });
    }
  } else {
    // 返回所有连接的状态统计
    const connectedClients = Array.from(wsClients.entries()).map(([sessionId, clientInfo]) => ({
      sessionId: sessionId,
      isConnected: clientInfo.ws.readyState === WebSocket.OPEN,
      lastHeartbeat: clientInfo.lastHeartbeat,
      connectTime: clientInfo.connectTime,
      uptime: Date.now() - clientInfo.connectTime
    }));

    res.json({
      success: true,
      totalConnections: wsClients.size,
      connectedClients: connectedClients,
      pendingCommands: pendingCommands.size
    });
  }
});

// MCP HTTP接口
router.post('/mcp-http', function(req, res) {
  mcpServer.handleRequest(req, res);
});

router.get('/mcp-http', function(req, res) {
  res.json({
    jsonrpc: '2.0',
    id: null,
    result: {
      tools: mcpServer.getToolsCapabilities(),
      prompts: mcpServer.getPromptsCapabilities()
    }
  });
});

// 图片转base64接口
router.post('/image-to-base64', function(req, res) {
  var url = req.body.url;
  if (!url) {
    res.status(400).json({ success: false, message: '缺少图片URL' });
    return;
  }

  var https = require('https');
  var http = require('http');
  var URL = require('url');

  try {
    var parsedUrl = URL.parse(url);
    var client = parsedUrl.protocol === 'https:' ? https : http;

    var request = client.get(url, function(response) {
      var chunks = [];
      var contentType = response.headers['content-type'] || 'image/png';

      response.on('data', function(chunk) {
        chunks.push(chunk);
      });

      response.on('end', function() {
        try {
          var buffer = Buffer.concat(chunks);
          var base64 = buffer.toString('base64');
          res.json({
            success: true,
            data: 'data:' + contentType + ';base64,' + base64
          });
        } catch (err) {
          res.status(500).json({ success: false, message: '图片转base64失败: ' + err.message });
        }
      });
    });

    request.on('error', function(err) {
      res.status(500).json({ success: false, message: '图片下载失败: ' + err.message });
    });

    request.setTimeout(10000, function() {
      request.abort();
      res.status(500).json({ success: false, message: '图片下载超时' });
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '图片转base64失败: ' + err.message });
  }
});

module.exports = { router, registerMcpWebSocket};