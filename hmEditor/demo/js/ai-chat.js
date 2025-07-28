// AI对话助手逻辑
var chatHistory = [];
var editingMsgDiv = null;
var editingMsgIdx = null;

// 支持的模型
var ALL_MODELS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'qianwen', label: '千问' }
];

function getAllowedModels() {
  return JSON.parse(localStorage.getItem('ai_allowed_models') || '["deepseek"]');
}
function setAllowedModels(arr) {
  localStorage.setItem('ai_allowed_models', JSON.stringify(arr));
}

function getTimeStr() {
  var d = new Date();
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}
function renderMarkdown(text) {
  if (!text) return '';
  var html = text
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n- (.+)/g, '<li>$1</li>')
    .replace(/\n/g, '<br>');
  html = html.replace(/(<li>.+<\/li>)/g, '<ul>$1</ul>');
  return html;
}
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
function removeLoading() {
  var loading = document.querySelector('.msg.loading');
  if (loading) loading.remove();
}
function scrollToBottom() {
  var $msgs = document.getElementById('chatMessages');
  if ($msgs) $msgs.scrollTop = $msgs.scrollHeight;
}
function appendMessage(role, text, idx) {
  var $msgs = $('#chatMessages');
  var div = document.createElement('div');
  div.className = 'msg ' + role + (role === 'loading' ? ' loading' : '');
  div.tabIndex = 0;
  // 头像+昵称+时间
  if (role === 'ai') {
    var topBar = document.createElement('div');
    topBar.className = 'msg-topbar ai';
    topBar.innerHTML =
      '<img src="img/logo.png" alt="AI" width="16px" class="ai-avatar-img">' +
      '<span class="msg-bot-time">' + getTimeStr() + '</span>';
    div.appendChild(topBar);
  } else if (role === 'user') {
    var topBar = document.createElement('div');
    topBar.className = 'msg-topbar user';
    topBar.innerHTML =
      '<span class="msg-user-time">' + getTimeStr() + '</span>' +
      '<span class="msg-user-avatar"><i class="fa fa-user-o"></i></span>';
    div.appendChild(topBar);
  } else if (role === 'loading') {
    var topBar = document.createElement('div');
    topBar.className = 'msg-topbar';
    topBar.innerHTML = '<span class="msg-bot-nick">AI</span>';
    div.appendChild(topBar);
  }
  // 内容
  var contentBox = document.createElement('div');
  contentBox.className = 'msg-content';
  contentBox.innerHTML = renderMarkdown(text);
  div.appendChild(contentBox);
  // 按钮区
  var btnBox = document.createElement('div');
  btnBox.className = 'msg-btn-box';
  if (role != 'loading') {
    var copyBtn = document.createElement('i');
    // copyBtn.textContent = '复制';
    copyBtn.className = 'copy-btn fa fa-clone';
    copyBtn.onclick = function() { copyToClipboard(text); };
    btnBox.appendChild(copyBtn);
  }


  // if (role === 'user') {
  //   var editBtn = document.createElement('i');
  //   // editBtn.textContent = '编辑';
  //   editBtn.className = 'edit-btn fa fa-edit';
  //   editBtn.onclick = function() { startEditMessage(div, text, idx); };
  //   btnBox.appendChild(editBtn);
  // }
  div.appendChild(btnBox);
  $msgs.append(div);
  scrollToBottom();
}
function appendToolCard(toolResult) {
  var $msgs = $('#chatMessages');
  var div = document.createElement('div');
  div.className = 'msg tool-card';
  var statusHtml = toolResult.error ? "<span class='status error'>✖ 失败</span>" : "<span class='status'>✔ 完成</span>";
  var mcpName = toolResult.mcpName;
  var toolName = toolResult.toolName || '工具调用';
  var collapsed = true;
  var header = document.createElement('div');
  header.className = 'tool-header collapsed';
  header.innerHTML =
    '<span class="tool-folder-icon">📁</span>' +
    '<span class="tool-title">' + mcpName + ' · ' + toolName + '</span>' +
    '<span class="tool-status">' + statusHtml + '</span>' +
    '<span class="tool-time">' + getTimeStr() + '</span>' +
    '<span class="arrow">▶</span>';
  var copyBtn = document.createElement('i');
  copyBtn.className = 'copy-btn fa fa-clone';
  copyBtn.onclick = function(e) {
    e.stopPropagation();
    copyToClipboard(JSON.stringify({args: toolResult.toolArgs, result: toolResult.result}, null, 2));
  };
  header.onclick = function() {
    collapsed = !collapsed;
    if (collapsed) {
      body.style.maxHeight = '0';
      body.style.opacity = '0';
      body.style.padding = '0 18px';
      header.classList.add('collapsed');
      header.querySelector('.arrow').style.transform = 'rotate(-90deg)';
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.style.opacity = '1';
      body.style.padding = '12px 18px';
      header.classList.remove('collapsed');
      header.querySelector('.arrow').style.transform = 'rotate(0deg)';
    }
  };
  div.appendChild(header);
  var body = document.createElement('div');
  body.className = 'tool-body';
  body.style.maxHeight = '0';
  body.style.opacity = '0';
  body.style.overflow = 'hidden';
  body.style.transition = 'max-height 0.25s, opacity 0.25s, border 0.2s, padding 0.2s, background 0.3s';
  body.style.border = '1.5px solid #d1f2e6';
  body.style.borderRadius = '0 0 12px 12px';
  body.style.background = 'linear-gradient(180deg, #f8fefb 80%, #e8f9f1 100%)';
  body.style.marginTop = '2px';
  // 优化出参展示
  var html = "<div style='margin-bottom:4px;'><b>入参：</b><pre style='white-space:pre-wrap;word-break:break-all;'>" + escapeHtml(JSON.stringify(toolResult.toolArgs, null, 2)) + "</pre></div>";
  var msg = '';
  if (toolResult.message) {
    msg += toolResult.message + '\n';
  }
  if (toolResult.result) {
    if (typeof toolResult.result.message === 'string' && toolResult.result.message) {
      msg += toolResult.result.message + '\n';
    }
    if (typeof toolResult.result.result === 'string' && toolResult.result.result) {
      msg += toolResult.result.result + '\n';
    }
    if (typeof toolResult.result === 'string') {
      msg += toolResult.result + '\n';
    } else if (typeof toolResult.result === 'object') {
      msg += JSON.stringify(toolResult.result, null, 2);
    }
  }
  if (toolResult.content) {
    msg += '\n' + JSON.stringify(toolResult.content, null, 2);
  }
  html += "<div><b>出参：</b><pre style='white-space:pre-wrap;word-break:break-all;'>" + escapeHtml(msg) + "</pre></div>";
  if (toolResult.error) html += "<div class='error'>错误：" + escapeHtml(toolResult.error) + "</div>";
  body.innerHTML = html;
  div.appendChild(body);
  var btnBox = document.createElement('div');
  btnBox.className = 'msg-btn-box';
  btnBox.appendChild(copyBtn);
  div.appendChild(btnBox);
  setTimeout(function() { if (!collapsed) { body.style.maxHeight = body.scrollHeight + 'px'; body.style.opacity = '1'; body.style.padding = '12px 18px'; header.classList.remove('collapsed'); header.querySelector('.arrow').style.transform = 'rotate(0deg)'; } else { header.querySelector('.arrow').style.transform = 'rotate(-90deg)'; } }, 10);
  $msgs.append(div);
  scrollToBottom();
}
function startEditMessage(div, oldText, idx) {
  if (editingMsgDiv) return;
  editingMsgDiv = div;
  editingMsgIdx = idx;

  // 构建结构
  div.innerHTML = `
    <div class="edit-message-box">
      <textarea class="edit-area">${oldText}</textarea>
    </div>
    <div class="edit-btn-group">
        <button class="edit-cancel-btn">取消</button>
        <button class="edit-confirm-btn">发送</button>
      </div>
  `;

  // 事件绑定
  const cancelBtn = div.querySelector('.edit-cancel-btn');
  const confirmBtn = div.querySelector('.edit-confirm-btn');
  cancelBtn.onclick = function() { cancelEditMessage(div, oldText, idx); };
  confirmBtn.onclick = function() { confirmEditMessage(div, idx); };
}
function confirmEditMessage(div, idx) {
  var newText = div.querySelector('.edit-area').value;
  editingMsgDiv = null;
  editingMsgIdx = null;
  chatHistory[idx].content = newText;
  renderChat();
  appendMessage('loading', '思考中...');
  var config = getAiChatConfig();
  var id = config && config.id ? config.id : '';
  var sessionId = getSessionId();
  fetch('../ai-chat/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id, message: newText, sessionId: sessionId })
  }).then(function(resp) { return resp.json(); })
    .then(function(data) {
      removeLoading();
      if (data.toolResults && Array.isArray(data.toolResults) && data.toolResults.length > 0) {
        data.toolResults.forEach(function(tr) { appendToolCard(tr); });
      }
      appendMessage('ai', data.reply);
      chatHistory.push({ role: 'ai', content: data.reply });
    }).catch(function() {
      removeLoading();
      appendMessage('ai', '（请求失败）');
    });
}
function cancelEditMessage(div, oldText, idx) {
  editingMsgDiv = null;
  editingMsgIdx = null;
  renderChat();
}
function renderChat() {
  var $msgs = $('#chatMessages');
  $msgs.empty();
  if (chatHistory.length === 0) {
    var placeholder = document.createElement('div');
    placeholder.className = 'chat-placeholder';
    placeholder.textContent = '欢迎使用惠每AI，您可以通过对话的方式写病历';
    placeholder.style.color = '#94a3b8';
    placeholder.style.fontSize = '15px';
    placeholder.style.textAlign = 'center';
    placeholder.style.margin = '48px 0 0 0';
    $msgs.append(placeholder);
    return;
  }
  chatHistory.forEach(function(msg, i) {
    appendMessage(msg.role, msg.content, i);
  });
}

// 工具卡片流式插入支持
function appendOrUpdateToolCard(toolResult, status) {
  // status: 'pending' | 'done'
  var $msgs = $('#chatMessages');
  var cardId = 'tool-card-' + (toolResult.toolCallId || toolResult.toolName || Math.random());
  var div = document.getElementById(cardId);
  var isNew = false;
  if (!div) {
    div = document.createElement('div');
    div.className = 'msg tool-card';
    div.id = cardId;
    isNew = true;
  }
  // 优先显示sourceServer和toolName
  var mcpName = toolResult.sourceServer || toolResult.mcpName || '未知服务';
  var toolName = toolResult.toolName || '未知工具';
  var statusHtml = status === 'pending'
    ? "<span class='status loading'>⏳ 调用中</span>"
    : (toolResult.error ? "<span class='status error'>✖ 失败</span>" : "<span class='status'>✔ 完成</span>");
  var header = document.createElement('div');
  header.className = 'tool-header' + (status === 'pending' ? ' collapsed' : '');
  header.innerHTML =
    '<span class="tool-folder-icon">📁</span>' +
    '<span class="tool-title">' + mcpName + ' · ' + toolName + '</span>' +
    '<span class="tool-status">' + statusHtml + '</span>' +
    '<span class="tool-time">' + getTimeStr() + '</span>' +
    '<span class="arrow">▶</span>';
  var copyBtn = document.createElement('i');
  copyBtn.className = 'copy-btn fa fa-clone';
  copyBtn.onclick = function(e) {
    e.stopPropagation();
    copyToClipboard(JSON.stringify({args: toolResult.toolArgs, result: toolResult.result}, null, 2));
  };
  header.onclick = function() {
    collapsed = !collapsed;
    if (collapsed) {
      body.style.maxHeight = '0';
      body.style.opacity = '0';
      body.style.padding = '0 18px';
      header.classList.add('collapsed');
      header.querySelector('.arrow').style.transform = 'rotate(-90deg)';
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.style.opacity = '1';
      body.style.padding = '12px 18px';
      header.classList.remove('collapsed');
      header.querySelector('.arrow').style.transform = 'rotate(0deg)';
    }
  };
  var collapsed = true;
  div.innerHTML = '';
  div.appendChild(header);
  var body = document.createElement('div');
  body.className = 'tool-body';
  body.style.maxHeight = collapsed ? '0' : (body.scrollHeight + 'px');
  body.style.opacity = collapsed ? '0' : '1';
  body.style.overflow = 'hidden';
  body.style.transition = 'max-height 0.25s, opacity 0.25s, border 0.2s, padding 0.2s, background 0.3s';
  body.style.border = '1.5px solid #d1f2e6';
  body.style.borderRadius = '0 0 12px 12px';
  body.style.background = 'linear-gradient(180deg, #f8fefb 80%, #e8f9f1 100%)';
  body.style.marginTop = '2px';
  // 优化出参展示
  var html = "<div style='margin-bottom:4px;'><b>入参：</b><pre style='white-space:pre-wrap;word-break:break-all;'>" + escapeHtml(JSON.stringify(toolResult.toolArgs, null, 2)) + "</pre></div>";
  if (status === 'done') {
    var msg = '';
    if (toolResult.message) {
      msg += toolResult.message + '\n';
    }
    if (toolResult.result) {
      if (typeof toolResult.result.message === 'string' && toolResult.result.message) {
        msg += toolResult.result.message + '\n';
      }
      if (typeof toolResult.result.result === 'string' && toolResult.result.result) {
        msg += toolResult.result.result + '\n';
      }
      if (typeof toolResult.result === 'string') {
        msg += toolResult.result + '\n';
      } else if (typeof toolResult.result === 'object') {
        msg += JSON.stringify(toolResult.result, null, 2);
      }
    }
    if (toolResult.content) {
      msg += '\n' + JSON.stringify(toolResult.content, null, 2);
    }
    html += "<div><b>出参：</b><pre style='white-space:pre-wrap;word-break:break-all;'>" + escapeHtml(msg) + "</pre></div>";
    if (toolResult.error) html += "<div class='error'>错误：" + escapeHtml(toolResult.error) + "</div>";
  } else {
    html += "<div class='tool-loading'>MCP工具调用中...</div>";
  }
  body.innerHTML = html;
  div.appendChild(body);
  var btnBox = document.createElement('div');
  btnBox.className = 'msg-btn-box';
  btnBox.appendChild(copyBtn);
  div.appendChild(btnBox);
  setTimeout(function() { if (!collapsed) { body.style.maxHeight = body.scrollHeight + 'px'; body.style.opacity = '1'; body.style.padding = '12px 18px'; header.classList.remove('collapsed'); header.querySelector('.arrow').style.transform = 'rotate(0deg)'; } else { header.querySelector('.arrow').style.transform = 'rotate(-90deg)'; } }, 10);
  if (isNew) $msgs.append(div);
  scrollToBottom();
}

// 修改streamAiReply，支持工具卡片流式插入
function streamAiReply(input) {
  chatHistory.push({ role: 'user', content: input });
  appendMessage('user', input, chatHistory.length - 1);
  appendMessage('loading', '思考中...');
  var loadingMsg = document.querySelector('.msg.loading .msg-content');
  var reply = '';
  var pendingToolCards = {};
  var config = getAiChatConfig();
  var id = config && config.id ? config.id : '';
  var sessionId = getSessionId();
  fetch('../ai-chat/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id, message: input, sessionId: sessionId })
  }).then(function(resp) {
    if (!resp.body || !window.ReadableStream) {
      resp.json().then(function(data) {
        removeLoading();
        appendMessage('ai', data.reply);
        chatHistory.push({ role: 'ai', content: data.reply });
        if (data.toolResults && Array.isArray(data.toolResults)) {
          data.toolResults.forEach(function(tr) { appendOrUpdateToolCard(tr, 'done'); });
        }
      });
      return;
    }
    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var hasInserted = false; // 新增标志位，防止重复插入
    function read() {
      reader.read().then(function({ done, value }) {
        if (done) {
          if (!hasInserted) { // 只插入一次
            removeLoading();
            appendMessage('ai', reply);
            chatHistory.push({ role: 'ai', content: reply });
            hasInserted = true;
          }
          // 所有pending卡片如未done，补done
          Object.keys(pendingToolCards).forEach(function(key) {
            var tr = pendingToolCards[key];
            if (tr && tr.status === 'pending') {
              appendOrUpdateToolCard(tr, 'done');
              tr.status = 'done';
            }
          });
          return;
        }
        var chunk = decoder.decode(value, { stream: true });
        chunk.split('\n\n').forEach(function(line) {
          if (line.startsWith('data: ')) {
            try {
              var data = JSON.parse(line.slice(6));
              if (data.token) {
                reply += data.token;
                if (loadingMsg) loadingMsg.innerHTML = renderMarkdown(reply);
                scrollToBottom();
              }
              // 工具卡片流式插入
              if (data.toolCallPending) {
                // data.toolCallPending: { toolName, toolArgs, toolCallId }
                var tr = {
                  toolName: data.toolCallPending.toolName,
                  toolArgs: data.toolCallPending.toolArgs,
                  toolCallId: data.toolCallPending.toolCallId
                };
                pendingToolCards[tr.toolCallId] = { ...tr, status: 'pending' };
                appendOrUpdateToolCard(tr, 'pending');
              }
              if (data.toolResults && Array.isArray(data.toolResults)) {
                data.toolResults.forEach(function(tr) {
                  appendOrUpdateToolCard(tr, 'done');
                  if (tr.toolCallId) pendingToolCards[tr.toolCallId] = { ...tr, status: 'done' };
                });
              }
              if (data.done) {
                if (!hasInserted) { // 只插入一次
                  removeLoading();
                  appendMessage('ai', reply);
                  chatHistory.push({ role: 'ai', content: reply });
                  hasInserted = true;
                }
              }
              if (data.error) {
                removeLoading();
                appendMessage('ai', '请求失败，错误信息:'+data.error);
              }
            } catch (e) {}
          }
        });
        read();
      });
    }
    read();
  });
}

// 替换AI对话发送事件，使用流式
$(document).off('click.sendChat').on('click.sendChat', '#sendChatBtn', function() {
  var input = $('#chatInput').val().trim();
  if (!input) return;
  $('#chatInput').val('');
  autoResizeInput();
  streamAiReply(input);
});

// 展开助手块/AI浮动tab按钮事件委托
$(document).off('click.assistantTab').on('click.assistantTab', '.assistant-float-tab-btn', function() {
  var tab = $(this).data('tab');
  $('.assistant-float-tab-btn').removeClass('active');
  $(this).addClass('active');
  $('.assistant-block').show();
  $('#assistantLogPanel').toggle(tab === 'log');
  $('#assistantAiPanel').toggle(tab === 'ai');
  $('#assistantSmartPanel').toggle(tab === 'smart');
  $('#btnScroll').toggle(tab === 'log');
  $('#aiModelName').toggle(tab === 'ai');
  $('#assistantFloatTabCol').hide();
  $('body').addClass('shrink-main');
  if(tab === 'smart'){
    $('body').addClass('smart-panel');
  }
});

// 收起助手块按钮事件委托
$(document).off('click.btnExpand').on('click.btnExpand', '#btnExpand', function() {
  $('.assistant-block').hide();
  $('#assistantFloatTabCol').show();
  $('body').removeClass('shrink-main').removeClass('smart-panel');
});

// 顶部按钮
$(document).off('click.btnClear').on('click.btnClear', '#btnClear', function() {
  if ($('#assistantLogPanel').is(':visible')) {
    $('#apiLog').empty();
  } else {
    $('#chatMessages').empty();
    chatHistory = [];
    renderChat();
    autoResizeInput();
  }
});

$(document).off('click.aiChatScroll').on('click.aiChatScroll', '#btnScroll', function() {
  var logContent = document.getElementById('logContent');
  logContent.scrollTop = logContent.scrollHeight;
});

// AI对话设置弹窗取消按钮（使用事件委托）
$(document).off('click.aiChatClose').on('click.aiChatClose', '#closeAiSettingsBtn', function() {
  $('#chatSettingsModal').hide();
});

// 输入框自适应高度，最多6行
function autoResizeInput() {
  var input = document.getElementById('chatInput');
  if (!input) return;
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  input.style.overflowY = '';
}
$(document).off('input.aiChatInput').on('input.aiChatInput', '#chatInput', function() {
  autoResizeInput();
});
$(function(){ autoResizeInput(); });

// 设置相关函数（这些函数暂时不需要，因为对应的HTML元素不存在）
function updateModelName() {
  // 简化版本，设置默认显示文本
  $('#aiModelName').text('DeepSeek');
}

// 初始化：助手块隐藏，仅显示竖直tab
$(function() {
  $('.assistant-block').hide();
  $('#assistantFloatTabCol').show();
  $('body').removeClass('shrink-main');
  // 默认显示API日志
  $('#assistantLogPanel').show();
  $('#assistantAiPanel').hide();
  $('#assistantTitle').text('API日志');
  $('#btnScroll').show();
  $('#aiModelName').hide();
  updateModelName && updateModelName();

  // 保证设置按钮存在
  if ($('#aiChatSettingsBtn').length === 0) {
    var $btns = $('.chat-buttons');
    if ($btns.length) {
      $btns.prepend('<button id="aiChatSettingsBtn" class="chat-btn settings-btn" title="设置"><i class="fa fa-cog"></i></button>');
    }
  }
  // 设置按钮事件 - 更新原有的事件处理，添加配置逻辑
  $(document).off('click.aiChatSettings').on('click.aiChatSettings', '#aiChatSettingsBtn', function() {
    let config = getAiChatConfig();
    let id = '';
    if (!config) {
      id = genUUID();
      config = {
        "mcpServers": {
          "hm-editor": {
            "url": "https://editor.huimei.com/hmEditor/mcp-server/mcp-http",
            "capabilities": ["editor", "patient", "document"],
            "priority": 1
          },
          "hm-image-mock": {
            "url": "https://editor.huimei.com/hmEditor/emr-editor/mock/mcp-http",
            "capabilities": ["chart", "image", "testchart"],
            "priority": 2
          }
        },
        "llmConfig": {"type": "deepseek", "name": "deepseek-chat", "apiUrl": "https://api.deepseek.com/v1", "apiKey": ""},
        "defaultServer": "hm-editor",
        "system": "你是一位电子病历书写AI助理，可以根据用户输入的指令来回答问题和辅助书写病历文书。",
        "routing": {
          "autoRoute": true,
          "fallbackServer": "hm-editor",
          "keywords": {
            "chart": ["图表", "chart", "测试图表", "生成测试图表"],
            "image": ["图片", "image"],
            "testchart": ["生成测试图表"]
          }
        }
      };
    } else {
      id = config.id || genUUID();
      // 不把id放到输入框内容里
      delete config.id;
    }
    // 在弹窗上方显示id
    if ($('#chatSettingsIdRow').length === 0) {
      $('#chatSettingsJsonInput').before('<div id="chatSettingsIdRow" style="margin-bottom:8px;font-size:13px;color:#1976d2;">配置ID：<span id="chatSettingsIdVal"></span></div>');
    }
    $('#chatSettingsIdVal').text(id);
    $('#chatSettingsJsonInput').val(JSON.stringify(config, null, 2));
    $('#chatSettingsModal').show();
  });

  $('#chatInput').off('keydown').on('keydown', function(e) {
    // 只有"单独回车"才发送
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      $('#sendChatBtn').click();
    }
    // Ctrl+Enter 或 Shift+Enter 允许换行（不阻止默认行为）
  });

  $('#chatSettingsModal').hide(); // 保证弹窗初始隐藏
});

// ========== MCP/LLM配置相关 ========== //
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getAiChatConfig() {
  var config = localStorage.getItem('aiChatConfig');
  if (config) return JSON.parse(config);
  return null;
}
function setAiChatConfig(obj) {
  localStorage.setItem('aiChatConfig', JSON.stringify(obj, null, 2));
}

function enableChatInput(enable) {
  $('#chatInput').prop('disabled', !enable);
  $('#sendChatBtn').prop('disabled', !enable);
}

// ========== 设置弹窗逻辑 ========== //
$(document).off('click.aiChatConfirm').on('click.aiChatConfirm', '#chatSettingsOkBtn', function() {
  let configStr = $('#chatSettingsJsonInput').val();
  let id = $('#chatSettingsIdVal').text();
  try {
    let obj = JSON.parse(configStr);
    obj.id = id;
    setAiChatConfig(obj);
    // 调用后端 /ai-chat/init
    $.ajax({
      url: '../ai-chat/init',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(obj),
      success: function() {
        $('#chatSettingsModal').hide();
        enableChatInput(true);
      },
      error: function() {
        alert('初始化失败');
        enableChatInput(false);
      }
    });
  } catch (e) {
    alert('配置格式错误');
  }
});

// ========== sessionId 相关 ========== //
function getSessionId() {
  return window.MCPHandler && window.MCPHandler.sessionId ? window.MCPHandler.sessionId : '';
}

// WebSocket连接注册sessionId
function registerSessionIdToWs(ws) {
  try {
    ws.send(JSON.stringify({ sessionId: sessionId }));
  } catch (e) {}
}

// 假设有全局ws对象，连接后注册
if (window.ws && window.ws.readyState === 1) {
  registerSessionIdToWs(window.ws);
} else if (window.ws) {
  window.ws.addEventListener('open', function() { registerSessionIdToWs(window.ws); });
}