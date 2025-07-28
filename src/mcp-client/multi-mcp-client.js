// MultiMCPClient - 多MCP服务池管理器
const { MCPClient } = require('./mcp-client.js');
const fs = require('fs');
const path = require('path');

function MultiMCPClient(config) {
    this.servicePool = new Map(); // serverId -> { client, config, status, lastUsed }
    this.config = config || null;
    this.defaultServer = null;
    this.routingRules = null;
    this.serviceStatus = new Map();
}

MultiMCPClient.prototype.loadConfig = function(configPathOrObj) {
    if (typeof configPathOrObj === 'object') return configPathOrObj;
    var absPath = path.isAbsolute(configPathOrObj) ? configPathOrObj : path.join(__dirname, configPathOrObj);
    var content = fs.readFileSync(absPath, 'utf8');
    return JSON.parse(content);
};

MultiMCPClient.prototype.initializeAll = function(configPathOrObj) {
    var self = this;
    if (configPathOrObj) self.config = self.loadConfig(configPathOrObj);
    self.defaultServer = self.config.defaultServer;
    self.routingRules = (self.config.routing && self.config.routing.keywords) || {};
    var promises = [];
    Object.keys(self.config.mcpServers).forEach(function(serverId) {
        promises.push(self.connectService(serverId, self.config));
    });
    return Promise.allSettled(promises);
};

MultiMCPClient.prototype.connectService = function(serverId, configObj) {
    var self = this;
    return new Promise(function(resolve) {
        var client = new MCPClient();
        client.connectToServer(serverId, configObj).then(function() {
            self.servicePool.set(serverId, {
                client: client,
                config: self.config.mcpServers[serverId],
                status: 'connected',
                lastUsed: Date.now()
            });
            self.serviceStatus.set(serverId, { status: 'connected', lastAttempt: Date.now() });
            resolve();
        }).catch(function(error) {
            self.serviceStatus.set(serverId, { status: 'failed', error: error.message, lastAttempt: Date.now() });
            resolve();
        });
    });
};

MultiMCPClient.prototype.routeQuery = function(query) {
    var self = this;
    if (!self.routingRules) return self.defaultServer;
    var queryLower = query.toLowerCase();
    var bestServer = self.defaultServer;
    var bestScore = 0;
    Object.keys(self.config.mcpServers).forEach(function(serverId) {
        var serverConfig = self.config.mcpServers[serverId];
        var score = 0;
        Object.keys(self.routingRules).forEach(function(category) {
            var keywordList = self.routingRules[category];
            if (serverConfig.capabilities && serverConfig.capabilities.indexOf(category) !== -1) {
                keywordList.forEach(function(keyword) {
                    if (queryLower.indexOf(keyword.toLowerCase()) !== -1) {
                        score += 1;
                    }
                });
            }
        });
        score += (serverConfig.priority || 0);
        if (score > bestScore && self.servicePool.has(serverId)) {
            bestScore = score;
            bestServer = serverId;
        }
    });
    return bestServer;
};

MultiMCPClient.prototype.processQuery = function(query, options) {
    var self = this;
    options = options || {};
    var targetService = options.targetServer;
    if (!targetService && options.autoRoute !== false) {
        targetService = self.routeQuery(query);
    }
    if (!targetService) targetService = self.defaultServer;
    var serviceInfo = self.servicePool.get(targetService);
    if (!serviceInfo) {
        if (options.fallback !== false && targetService !== self.defaultServer) {
            return self.processQuery(query, { targetServer: self.defaultServer, autoRoute: false, fallback: false });
        }
        return Promise.reject(new Error('服务 ' + targetService + ' 不可用'));
    }
    return serviceInfo.client.processQuery(query).then(function(result) {
        serviceInfo.lastUsed = Date.now();
        return Object.assign({}, result, { sourceServer: targetService, timestamp: Date.now() });
    });
};

MultiMCPClient.prototype.refreshAllTools = function() {
    var self = this;
    var promises = [];
    self.servicePool.forEach(function(serviceInfo, serverId) {
        if (serviceInfo.client && serviceInfo.client.toolService && serviceInfo.client.toolService.getTools) {
            var p = serviceInfo.client.toolService.getTools().then(function(tools) {
                serviceInfo.client.tools = tools.map(function(t) {
                    var copy = {};
                    for (var k in t) copy[k] = t[k];
                    copy.sourceServer = serverId;
                    return copy;
                });
            }).catch(function() {});
            promises.push(p);
        }
    });
    return Promise.all(promises);
};

MultiMCPClient.prototype.getAllTools = function() {
    var self = this;
    return self.refreshAllTools().then(function() {
        var allTools = [];
        self.servicePool.forEach(function(serviceInfo, serverId) {
            var tools = serviceInfo.client.tools || [];
            tools.forEach(function(tool) {
                var copy = {};
                for (var k in tool) copy[k] = tool[k];
                copy.sourceServer = serverId;
                allTools.push(copy);
            });
        });
        return allTools;
    });
};

MultiMCPClient.prototype.healthCheck = function() {
    var self = this;
    var healthStatus = {};
    var promises = [];
    self.servicePool.forEach(function(serviceInfo, serverId) {
        var p = serviceInfo.client.processQuery('ping').then(function() {
            healthStatus[serverId] = { status: 'healthy', lastCheck: Date.now() };
        }).catch(function(error) {
            healthStatus[serverId] = { status: 'unhealthy', error: error.message, lastCheck: Date.now() };
        });
        promises.push(p);
    });
    return Promise.all(promises).then(function() { return healthStatus; });
};

MultiMCPClient.prototype.cleanup = function() {
    var self = this;
    var cleanupPromises = [];
    self.servicePool.forEach(function(serviceInfo) {
        if (serviceInfo.client.cleanup) {
            cleanupPromises.push(serviceInfo.client.cleanup());
        }
    });
    return Promise.allSettled(cleanupPromises).then(function() {
        self.servicePool.clear();
    });
};

// 新增：统一多服务工具调用
MultiMCPClient.prototype.callTool = function(toolName, toolArgs, options) {
    var self = this;
    options = options || {};
    return self.getAllTools().then(function(allTools) {
        var found = allTools.find(function(t) { return t.name === toolName; });
        var targetServer = options.targetServer;
        if (!targetServer && found && found.sourceServer) {
            targetServer = found.sourceServer;
        }
        if (!targetServer) {
            targetServer = self.defaultServer || Array.from(self.servicePool.keys())[0];
        }
        if (typeof console !== 'undefined' && console.log) {
            console.log('[MCP-MULTI-TOOL] 调用工具', toolName, '目标服务:', targetServer);
        }
        var serviceInfo = self.servicePool.get(targetServer);
        if (!serviceInfo) {
            return Promise.reject(new Error('未找到工具所属服务: ' + toolName));
        }
        // 只做本地服务调用，不再递归多服务
        return serviceInfo.client.toolService.callTool(toolName, toolArgs, {});
    });
};

module.exports = { MultiMCPClient: MultiMCPClient };