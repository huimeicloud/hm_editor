/**
 * API日志记录器
 * 用于监控和记录HMEditor API方法的调用
 */
class ApiLogger {
    constructor() {
        this.isMonitoring = false;
        this.logElement = null;
        this.logContainer = null;
        this.originalFunctions = {};
        this.monitoredModules = ['fn.baseInit.js', 'fn.opeanApi.js'];
        this.autoScroll = true; // 默认自动滚动
    }

    /**
     * 初始化日志记录器
     */
    init() {
        // 创建样式
        const style = document.createElement('style');
        // document.head.appendChild(style);

        // 获取日志元素和容器
        this.logElement = document.getElementById('apiLog');
        this.logContainer = document.getElementById('logContent');

        if (!this.logElement || !this.logContainer) {
            console.error('找不到日志元素或容器');
            return;
        }

        // 绑定按钮事件
        document.getElementById('btnToggleLog').addEventListener('click', this.toggleLogPanel.bind(this));
        document.getElementById('btnClearLog').addEventListener('click', this.clearLog.bind(this));

        // 添加日志指示器
        this.setupLogIndicator();

        // 添加自动滚动指示器
        this.setupAutoScrollIndicator();

        // 初始设置body类
        document.body.classList.add('log-collapsed');

        // 初始状态设置为折叠
        const panel = document.querySelector('.log-panel');
        panel.classList.add('collapsed');

        // 初始添加垂直文本
        const btnToggle = document.getElementById('btnToggleLog');
        btnToggle.textContent = '';
        const verticalText = document.createElement('div');
        verticalText.className = 'vertical-text';
        verticalText.textContent = 'API 调用日志';
        btnToggle.appendChild(verticalText);

        // 设置MutationObserver监控日志内容变化，自动滚动
        this.setupScrollObserver();

        // 不再自动折叠面板
        // 开始监控
        this.startMonitoring();

        // 添加标签页变更监听
        this.setupTabChangeListener();

        // 监控 iframe 资源加载
        this.monitorIframeResources();
    }

    /**
     * 设置滚动观察器，监控日志变化自动滚动
     */
    setupScrollObserver() {
        if (!this.logElement || !this.logContainer) return;

        // 创建MutationObserver监控日志元素变化
        const observer = new MutationObserver(() => {
            if (this.autoScroll) {
                // 使用requestAnimationFrame确保在下一帧渲染前滚动
                requestAnimationFrame(() => {
                    this.logContainer.scrollTop = this.logContainer.scrollHeight;
                });
            }
        });

        // 配置观察选项
        const config = {
            childList: true,  // 观察直接子节点变化
            subtree: true     // 观察所有后代节点变化
        };

        // 开始观察
        observer.observe(this.logElement, config);

        // 保存引用以便可能的清理
        this.scrollObserver = observer;
    }

    /**
     * 设置日志指示器
     */
    setupLogIndicator() {
        // 创建日志指示器元素
        const indicator = document.createElement('div');
        indicator.className = 'recent-log-indicator';
        document.querySelector('.log-panel').appendChild(indicator);

        // 创建提示文本元素
        const tooltip = document.createElement('div');
        tooltip.className = 'log-indicator-tooltip';
        tooltip.textContent = '有新日志';
        tooltip.style.display = 'none';
        document.querySelector('.log-panel').appendChild(tooltip);

        // 鼠标悬停在指示器上显示提示
        indicator.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });

        // 鼠标离开隐藏提示
        indicator.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });

        // 点击指示器展开日志面板
        indicator.addEventListener('click', () => {
            const panel = document.querySelector('.log-panel');
            if (panel.classList.contains('collapsed')) {
                this.toggleLogPanel();
            }
        });

        // 保存引用
        this.logIndicator = indicator;
        this.logIndicatorTooltip = tooltip;
    }

    /**
     * 设置自动滚动指示器
     */
    setupAutoScrollIndicator() {
        // 创建自动滚动指示器
        const indicator = document.createElement('div');
        indicator.className = 'auto-scroll-indicator';
        indicator.textContent = '自动滚动已激活';
        document.querySelector('.log-panel').appendChild(indicator);

        // 保存引用
        this.autoScrollIndicator = indicator;

        // 添加自动滚动切换按钮
        const autoScrollBtn = document.createElement('button');
        autoScrollBtn.className = 'log-button auto-scroll-btn';
        autoScrollBtn.title = '切换自动滚动功能';
        autoScrollBtn.textContent = '滚动:开';
        autoScrollBtn.addEventListener('click', () => {
            // 切换自动滚动状态
            this.autoScroll = !this.autoScroll;
            autoScrollBtn.textContent = `滚动:${this.autoScroll ? '开' : '关'}`;

            // 显示状态变更指示器
            indicator.textContent = this.autoScroll ? '自动滚动已激活' : '自动滚动已关闭';
            indicator.classList.add('show');

            // 如果启用自动滚动，立即滚动到底部
            if (this.autoScroll && this.logContainer) {
                this.logContainer.scrollTop = this.logContainer.scrollHeight;
            }

            // 2秒后隐藏指示器
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        });

        // 添加到头部按钮区域
        const headerBtns = document.querySelector('.log-header-btns');
        if (headerBtns) {
            headerBtns.insertBefore(autoScrollBtn, headerBtns.firstChild);
        }

        // 保存引用
        this.autoScrollBtn = autoScrollBtn;
    }

    /**
     * 设置标签页变更监听
     */
    setupTabChangeListener() {
        const self = this;

        // 监听标签页激活事件
        $(document).on('click', '.tab-item', function() {
            setTimeout(() => {
                if (window.tabManager && window.tabManager.currentTabId) {
                    window.tabManager.getCurrentEditor().then(editor => {
                        if (editor && !editor.__hm_logged) {
                            self.hookEditorInstance(editor);
                        }
                    }).catch(err => {
                        // 这里可能会有错误，但不需要显示给用户
                        console.debug('标签页激活获取编辑器失败:', err);
                    });
                }
            }, 300);
        });

        // 监听createTab事件
        const originalCreateTab = window.tabManager && window.tabManager.createTab;
        if (originalCreateTab && typeof originalCreateTab === 'function') {
            window.tabManager.createTab = async function(...args) {
                try {
                    const result = await originalCreateTab.apply(this, args);

                    // 尝试获取并监控新创建的编辑器实例
                    if (result && result.editor) {
                        setTimeout(() => {
                            if (!result.editor.__hm_logged) {
                                self.hookEditorInstance(result.editor);
                            }
                        }, 100);
                    }

                    return result;
                } catch (error) {
                    console.debug('创建标签页失败:', error);
                    throw error;
                }
            };
        }
    }

    /**
     * 添加日志
     * @param {String} message 日志消息
     * @param {String} type 日志类型（info, error）
     */
    log(message, type = 'info') {
        if (!this.logElement) return;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        // 检查是否包含JSON数据（特别是数据元Data结果）
        const isFormattedJson = message.includes('返回:') && message.includes('{') && message.includes('}');

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        
        // 为info类型的日志添加特殊类名，用于取消悬停边框效果
        if (type === 'info') {
            logEntry.classList.add('log-info-entry');
        }

        // 处理格式化的JSON结果
        if (isFormattedJson) {
            const parts = message.split('返回:');
            const prefix = parts[0] + '返回:';
            let jsonContent = parts[1].trim();

            try {
                // 尝试解析和美化JSON
                const parsedJson = JSON.parse(jsonContent);
                const prettyJson = JSON.stringify(parsedJson, null, 2);

                // 限制只显示10行
                const jsonLines = prettyJson.split('\n');
                let limitedJson;
                let isLimited = false;

                if (jsonLines.length > 11) { // 10行内容 + 1行省略号提示
                    limitedJson = jsonLines.slice(0, 10).join('\n');
                    isLimited = true;
                } else {
                    limitedJson = prettyJson;
                }

                // 创建前缀部分
                const prefixSpan = document.createElement('span');
                prefixSpan.innerHTML = `<span class="log-time">[${timeStr}]</span> ${prefix}`;
                logEntry.appendChild(prefixSpan);

                // 创建JSON显示区域
                const preElement = document.createElement('pre');
                preElement.textContent = limitedJson;

                // 如果需要限制，添加展开/收起按钮
                if (isLimited) {
                    preElement.classList.add('limited');

                    // 添加省略行信息
                    const omittedLines = document.createElement('div');
                    omittedLines.className = 'omitted-lines';
                    omittedLines.textContent = `...（已省略${jsonLines.length - 10}行）`;

                    // 添加展开/收起按钮
                    const toggleButton = document.createElement('button');
                    toggleButton.className = 'toggle-json-btn';
                    toggleButton.textContent = '展开';
                    toggleButton.onclick = function() {
                        if (preElement.classList.contains('limited')) {
                            // 展开
                            preElement.textContent = prettyJson;
                            preElement.classList.remove('limited');
                            this.textContent = '收起';
                            omittedLines.style.display = 'none';
                        } else {
                            // 收起
                            preElement.textContent = limitedJson;
                            preElement.classList.add('limited');
                            this.textContent = '展开';
                            omittedLines.style.display = '';
                        }

                        // 更新滚动位置
                        this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    };

                    logEntry.appendChild(preElement);
                    logEntry.appendChild(omittedLines);
                    logEntry.appendChild(toggleButton);
                } else {
                    logEntry.appendChild(preElement);
                }
            } catch (e) {
                // 如果不是有效的JSON，就使用普通格式
                logEntry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
            }
        } else {
            logEntry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
        }

        // 添加日志条目到容器
        this.logElement.appendChild(logEntry);

        // 如果日志面板折叠，激活日志指示器
        if (document.querySelector('.log-panel').classList.contains('collapsed')) {
            this.activateLogIndicator();
        }

        // 限制日志数量
        while (this.logElement.childNodes.length > 1000) {
            this.logElement.removeChild(this.logElement.firstChild);
        }
    }

    /**
     * 激活日志指示器
     */
    activateLogIndicator() {
        if (!this.logIndicator) return;

        // 添加活跃类
        this.logIndicator.classList.add('active');

        // 5秒后自动隐藏
        clearTimeout(this.indicatorTimeout);
        this.indicatorTimeout = setTimeout(() => {
            this.logIndicator.classList.remove('active');
        }, 5000);
    }

    /**
     * 清空日志
     */
    clearLog() {
        if (this.logElement) {
            this.logElement.innerHTML = '';
        }
    }

    /**
     * 折叠/展开日志面板
     */
    toggleLogPanel() {
        const panel = document.querySelector('.log-panel');
        panel.classList.toggle('collapsed');

        // 同时切换 body 类，用于调整 tab-container 的外边距
        document.body.classList.toggle('log-collapsed', panel.classList.contains('collapsed'));

        const btnToggle = document.getElementById('btnToggleLog');
        btnToggle.textContent = panel.classList.contains('collapsed') ? '' : '折叠';

        // 如果是折叠状态，添加垂直文本
        if (panel.classList.contains('collapsed')) {
            if (!document.querySelector('.vertical-text')) {
                const verticalText = document.createElement('div');
                verticalText.className = 'vertical-text';
                verticalText.textContent = 'API 调用日志';
                btnToggle.appendChild(verticalText);
            }
        } else {
            // 展开状态，移除垂直文本
            const verticalText = btnToggle.querySelector('.vertical-text');
            if (verticalText) {
                verticalText.remove();
            }

            // 如果是展开状态且自动滚动开启，滚动到底部
            if (this.autoScroll && this.logContainer) {
                // 延迟执行，等待过渡动画完成
                setTimeout(() => {
                    this.logContainer.scrollTop = this.logContainer.scrollHeight;
                }, 300);
            }
        }

        // 如果展开面板，隐藏指示器
        if (!panel.classList.contains('collapsed') && this.logIndicator) {
            this.logIndicator.classList.remove('active');
        }
    }

    /**
     * 开始监控API方法
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        this.log('开始监控HMEditor API方法调用...');

        // 监控 HMEditorLoader 方法
        this.hookLoaderMethods();

        // 只监控编辑器APIs，不再监控TabEditorManager
        this.hookEditorApis();
    }

    /**
     * 监控 HMEditorLoader 方法
     */
    hookLoaderMethods() {
        if (!window.HMEditorLoader) {
            console.debug('HMEditorLoader 不存在，无法监控');
            return;
        }

        const self = this;

        // 监控 HMEditorLoader 的常用方法
        const methodsToHook = [
            'createEditorAsync',
            'getEditorInstanceAsync',
            'destroyEditor'
        ];

        methodsToHook.forEach(methodName => {
            const originalMethod = window.HMEditorLoader[methodName];

            if (typeof originalMethod === 'function') {
                window.HMEditorLoader[methodName] = async function(...args) {
                    // 记录调用前
                    self.log(`调用 HMEditorLoader.${methodName}(${self.formatArgs(args)})`);

                    try {
                        // 调用原始方法
                        const result = await originalMethod.apply(this, args);

                        // 记录调用成功
                        self.log(`HMEditorLoader.${methodName} 调用成功`);

                        // 如果是创建编辑器的方法，则监控返回的编辑器实例
                        if (methodName === 'createEditorAsync' && result) {
                            setTimeout(() => {
                                if (!result.__hm_logged) {
                                    self.hookEditorInstance(result);
                                }
                            }, 200);
                        } else if (methodName === 'getEditorInstanceAsync' && result) {
                            setTimeout(() => {
                                if (!result.__hm_logged) {
                                    self.hookEditorInstance(result);
                                }
                            }, 200);
                        }

                        return result;
                    } catch (error) {
                        // 记录调用失败
                        self.log(`HMEditorLoader.${methodName} 调用失败: ${error.message}`, 'error');
                        throw error;
                    }
                };
            }
        });
    }

    /**
     * 挂接编辑器APIs
     */
    hookEditorApis() {
        const self = this;

        // 监控已存在的编辑器实例
        if (window.tabManager && window.tabManager.currentTabId) {
            window.tabManager.getCurrentEditor().then(editor => {
                if (editor) {
                    self.hookEditorInstance(editor);
                    self.log('成功监控编辑器实例');
                }
            }).catch(err => {
                console.debug('获取当前编辑器实例失败:', err);
            });
        }

        // 监控确认文档按钮
        $('#btnConfirmDoc').on('click', function() {
            setTimeout(() => {
                if (window.tabManager && window.tabManager.currentTabId) {
                    window.tabManager.getCurrentEditor().then(editor => {
                        if (editor && !editor.__hm_logged) {
                            self.hookEditorInstance(editor);
                            self.log('监控到新的编辑器实例');
                        }
                    }).catch(err => {
                        console.debug('获取新创建的编辑器实例失败:', err);
                    });
                }
            }, 500);
        });
    }

    /**
     * 挂接单个编辑器实例的方法
     * @param {Object} editorInstance 编辑器实例
     */
    hookEditorInstance(editorInstance) {
        if (!editorInstance) return;

        // 如果已经监控过该实例，则直接返回
        if (editorInstance.__hm_logged) {
            return;
        }

        // 标记该实例已被监控
        editorInstance.__hm_logged = true;

        // 基于fn.baseInit.js和fn.opeanApi.js中的方法
        const methodsToHook = [
            // 从fn.opeanApi.js
            'setDocContent', 'setDocData', 'getDocContent',
            'getDocHtml', 'getDocText', 'getDocData',
            'showWarnInfo', 'execEditorMethod', 'execCommand',
            'addCustomMenu', 'setDocReadOnly', 'setDocReviseMode',
            'setTemplateDatasource','setDocWatermark',

            // 从fn.baseInit.js
            'init', 'initComponent', 'initEditorPanel',
            'initEditorConfig', 'initContextMenuListener',
            'initDefaultConfig', 'registerCustomMenu'
        ];

        const self = this;
        let hookedCount = 0;

        methodsToHook.forEach(methodName => {
            const originalMethod = editorInstance[methodName];

            if (typeof originalMethod === 'function') {
                editorInstance[methodName] = async function(...args) {
                    // 记录调用前
                    self.log(`调用 HMEditor.${methodName}(${self.formatArgs(args)})`);

                    try {
                        // 确保同步方法也能正确记录
                        let result;
                        if (originalMethod.constructor.name === 'AsyncFunction') {
                            // 异步方法
                            result = await originalMethod.apply(this, args);
                        } else {
                            // 同步方法
                            result = originalMethod.apply(this, args);
                        }

                        // 记录调用成功，对于getter方法显示结果摘要
                        if (methodName === 'getDocData') {
                            // 数据元Data结果特殊处理，完整显示格式化后的JSON
                            self.log(`HMEditor.${methodName} 返回: ${JSON.stringify(result)}`);
                        } else if (methodName.startsWith('get')) {
                            // 其他getter方法可能会返回较大数据，显示摘要
                            const jsonResult = JSON.stringify(result);
                            const shortResult = jsonResult.length > 300
                                ? jsonResult.substring(0, 297) + '...'
                                : jsonResult;
                            self.log(`HMEditor.${methodName} 返回: ${shortResult}`);
                        } else {
                            self.log(`HMEditor.${methodName} 调用成功`);
                        }

                        return result;
                    } catch (error) {
                        // 记录调用失败
                        self.log(`HMEditor.${methodName} 调用失败: ${error.message}`, 'error');
                        throw error;
                    }
                };
                hookedCount++;
            } else if (methodName === 'setTemplateDatasource' && typeof editorInstance[methodName] !== 'function') {
                // 特殊处理：如果setTemplateDatasource方法不存在，可能是属性尚未定义或是后期添加的
                self.log(`警告: 编辑器实例上未找到 ${methodName} 方法，将监控属性设置`);

                // 尝试使用Object.defineProperty来监控属性设置
                let originalValue = editorInstance[methodName];
                Object.defineProperty(editorInstance, methodName, {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        return originalValue;
                    },
                    set: function(newValue) {
                        self.log(`设置 HMEditor.${methodName}`);
                        originalValue = newValue;
                        if (typeof newValue === 'function') {
                            // 如果后来被设置为函数，则重新挂钩
                            self.log(`检测到 ${methodName} 被设置为函数，重新挂钩`);
                            const originalFunc = newValue;
                            editorInstance[methodName] = async function(...args) {
                                self.log(`调用 HMEditor.${methodName}(${self.formatArgs(args)})`);
                                try {
                                    const result = originalFunc.apply(this, args);
                                    self.log(`HMEditor.${methodName} 调用成功`);
                                    return result;
                                } catch (error) {
                                    self.log(`HMEditor.${methodName} 调用失败: ${error.message}`, 'error');
                                    throw error;
                                }
                            };
                        }
                    }
                });
            }
        });
    }

    /**
     * 格式化参数为字符串
     * @param {Array} args 参数数组
     * @returns {String} 格式化后的参数字符串
     */
    formatArgs(args) {
        return args.map(arg => {
            if (arg === undefined) return 'undefined';
            if (arg === null) return 'null';

            if (typeof arg === 'object') {
                try {
                    // 特殊处理编辑器配置对象，显示关键配置项
                    if (arg.container && (arg.style || arg.editorConfig)) {
                        const simplifiedArg = {
                            id: arg.id || '未指定',
                            container: arg.container
                        };

                        if (arg.editorConfig) {
                            simplifiedArg.editorConfig = '已指定';
                        }

                        if (arg.style) {
                            simplifiedArg.style = '已指定';
                        }

                        if (arg.sdkHost) {
                            simplifiedArg.sdkHost = arg.sdkHost;
                        }

                        return JSON.stringify(simplifiedArg);
                    }

                    // 对于其他对象，限制长度
                    const json = JSON.stringify(arg);
                    return json.length > 100 ? json.substring(0, 97) + '...' : json;
                } catch (e) {
                    return '[无法序列化的对象]';
                }
            }

            return String(arg);
        }).join(', ');
    }

    /**
     * 监控 iframe 资源加载
     */
    monitorIframeResources() {
        const self = this;

        // 监听 iframe 加载完成事件
        $(document).on('load', 'iframe', function() {
            try {
                const iframe = this;
                const iframeWindow = iframe.contentWindow;

                if (iframeWindow && iframeWindow.HMEditor) {
                    self.log(`检测到 iframe 中的 HMEditor`);

                    // 等待 iframe 内部的 JS 资源加载
                    setTimeout(() => {
                        try {
                            // 记录已加载的扩展
                            if (iframeWindow.commonHM && iframeWindow.commonHM.component) {
                                const components = Object.keys(iframeWindow.commonHM.component);
                                if (components.length > 0) {
                                    self.log(`iframe 已加载组件: ${components.join(', ')}`);
                                }
                            }
                        } catch (e) {
                            console.debug('监控iframe内组件失败:', e);
                        }
                    }, 1000);
                }
            } catch (e) {
                console.debug('监控iframe失败:', e);
            }
        });
    }
}

// 页面加载完成后初始化日志记录器
document.addEventListener('DOMContentLoaded', () => {
    window.apiLogger = new ApiLogger();
    window.apiLogger.init();
});