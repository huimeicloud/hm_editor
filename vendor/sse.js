/**
 * SSE构造函数
 * @param {String} url 请求地址
 * @param {Object} options 配置选项
 *   - headers: 请求头
 *   - payload: 请求体
 *   - method: 请求方法，默认POST
 *   - withCredentials: 是否携带凭证
 */
function SSE(url, options) {
	this.INITIALIZING = -1;
	this.CONNECTING = 0;
	this.OPEN = 1;
	this.CLOSED = 2;

	this.url = url;

	options = options || {};
	this.headers = options.headers || {};
	this.payload = options.payload !== undefined ? options.payload : '';
	this.method = options.method || (this.payload && 'POST') || 'GET';
	this.withCredentials = !!options.withCredentials;

	this.FIELD_SEPARATOR = ':';
	this.listeners = {};

	this.xhr = null;
	this.readyState = this.INITIALIZING;
	this.progress = 0;
	this.chunk = '';

	/**
	 * 添加事件监听器
	 * @param {String} type 事件类型
	 * @param {Function} listener 监听函数
	 */
	this.addEventListener = function (type, listener) {
	  if (this.listeners[type] === undefined) {
		this.listeners[type] = [];
	  }

	  if (this.listeners[type].indexOf(listener) === -1) {
		this.listeners[type].push(listener);
	  }
	};

	/**
	 * 移除事件监听器
	 * @param {String} type 事件类型
	 * @param {Function} listener 监听函数
	 */
	this.removeEventListener = function (type, listener) {
	  if (this.listeners[type] === undefined) {
		return;
	  }

	  var filtered = [];
	  this.listeners[type].forEach(function (element) {
		if (element !== listener) {
		  filtered.push(element);
		}
	  });
	  if (filtered.length === 0) {
		delete this.listeners[type];
	  } else {
		this.listeners[type] = filtered;
	  }
	};

	/**
	 * 分发事件
	 * @param {Event} e 事件对象
	 */
	this.dispatchEvent = function (e) {
	  if (!e) {
		return true;
	  }

	  e.source = this;

	  var onHandler = 'on' + e.type;
	  if (this.hasOwnProperty(onHandler)) {
		this[onHandler].call(this, e);
		if (e.defaultPrevented) {
		  return false;
		}
	  }

	  if (this.listeners[e.type]) {
		return this.listeners[e.type].every(function (callback) {
		  callback(e);
		  return !e.defaultPrevented;
		});
	  }

	  return true;
	};

	/**
	 * 设置连接状态
	 * @param {Number} state 状态值
	 */
	this._setReadyState = function (state) {
	  var event = createCustomEvent('readystatechange');
	  event.readyState = state;
	  this.readyState = state;
	  this.dispatchEvent(event);
	};

	/**
	 * 流失败处理
	 * @param {Event} e 事件对象
	 */
	this._onStreamFailure = function (e) {
	  var event = createCustomEvent('error');
	  event.data = e.currentTarget.response;
	  this.dispatchEvent(event);
	  this.close();
	};

	/**
	 * 流中止处理
	 * @param {Event} e 事件对象
	 */
	this._onStreamAbort = function () {
	  this.dispatchEvent(createCustomEvent('abort'));
	  this.close();
	};

	/**
	 * 流进度处理
	 * @param {Event} e 事件对象
	 */
	this._onStreamProgress = function (e) {
	  if (!this.xhr) {
		return;
	  }

	  if (this.xhr.status !== 200) {
		this._onStreamFailure(e);
		return;
	  }

	if (this.readyState == this.CONNECTING) {
		this.dispatchEvent(createCustomEvent('open'));
		this._setReadyState(this.OPEN);
	  }
	  var data = this.xhr.responseText.substring(this.progress);
	  this.progress += data.length;
	  data.split(/(\r\n|\r|\n){2}/g).forEach(
		function (part) {
		  if (part.trim().length === 0) {
			this.dispatchEvent(this._parseEventChunk(this.chunk.trim()));
			this.chunk = '';
		  } else {
			this.chunk += part;
		  }
		}.bind(this)
	  );
	};

	/**
	 * 流加载完成处理
	 * @param {Event} e 事件对象
	 */
	this._onStreamLoaded = function (e) {
	  this._onStreamProgress(e);

	  // 解析最后一个数据块
	  this.dispatchEvent(this._parseEventChunk(this.chunk));
	  this.chunk = '';
	};

	/**
	 * 解析SSE事件数据块
	 * @param {String} chunk 数据块
	 * @returns {Event} 事件对象
	 */
	this._parseEventChunk = function (chunk) {
	  if (!chunk || chunk.length === 0) {
		return null;
	  }

	  var e = { id: null, retry: null, data: '', event: 'message' };
	  var self = this;
	  chunk.split(/\n|\r\n|\r/).forEach(
		function (line) {
		  line = trimRight(line);
		  var index = line.indexOf(self.FIELD_SEPARATOR);
		  if (index <= 0) {
			// 行为空或以分隔符开头，视为注释，忽略
			return;
		  }

		  var field = line.substring(0, index);
		  if (!(field in e)) {
			return;
		  }

		  var value = trimLeft(line.substring(index + 1));
		  if (field === 'data') {
			e[field] += value;
		  } else {
			e[field] = value;
		  }
		}
	  );

	  var event = createCustomEvent(e.event);
	  event.data = e.data;
	  event.id = e.id;
	  return event;
	};

	/**
	 * 检查流是否已关闭
	 */
	this._checkStreamClosed = function () {
	  if (!this.xhr) {
		return;
	  }

	  // XMLHttpRequest.DONE 的值为 4，直接使用数字以兼容旧版浏览器
	  if (this.xhr.readyState === 4) {
		this._setReadyState(this.CLOSED);
	    var event = createCustomEvent('end');
      	event.data = this.xhr.responseText;
      	this.dispatchEvent(event);
	  }
	};

	/**
	 * 开始流式传输
	 */
	this.stream = function () {
	  this._setReadyState(this.CONNECTING);

	  this.xhr = new XMLHttpRequest();
	  this.xhr.addEventListener('progress', this._onStreamProgress.bind(this));
	  this.xhr.addEventListener('load', this._onStreamLoaded.bind(this));
	  this.xhr.addEventListener('readystatechange', this._checkStreamClosed.bind(this));
	  this.xhr.addEventListener('error', this._onStreamFailure.bind(this));
	  this.xhr.addEventListener('abort', this._onStreamAbort.bind(this));
	  this.xhr.open(this.method, this.url);
	  for (var header in this.headers) {
		this.xhr.setRequestHeader(header, this.headers[header]);
	  }
	  this.xhr.withCredentials = this.withCredentials;
	  this.xhr.send(this.payload);
	};

	/**
	 * 关闭连接
	 */
	this.close = function () {
	  if (this.readyState === this.CLOSED) {
		return;
	  }

	  this.xhr.abort();
	  this.xhr = null;
	  this._setReadyState(this.CLOSED);
	};

	/**
	 * 创建自定义事件（兼容IE11）
	 * @param {String} type 事件类型
	 * @param {Object} params 事件参数
	 * @returns {Event} 事件对象
	 */
	function createCustomEvent(type, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt;
		if (typeof window.CustomEvent === 'function') {
			// 现代浏览器
			evt = new CustomEvent(type, params);
		} else {
			// IE11 兼容方案
			evt = document.createEvent('CustomEvent');
			evt.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
		}
		return evt;
	}

	/**
	 * 字符串去除右侧空白（兼容IE11）
	 * @param {String} str 字符串
	 * @returns {String} 处理后的字符串
	 */
	function trimRight(str) {
		if (String.prototype.trimEnd) {
			return str.trimEnd();
		} else if (String.prototype.trimRight) {
			return str.trimRight();
		}
		// IE11 兼容方案
		return str.replace(/\s+$/, '');
	}

	/**
	 * 字符串去除左侧空白（兼容IE11）
	 * @param {String} str 字符串
	 * @returns {String} 处理后的字符串
	 */
	function trimLeft(str) {
		if (String.prototype.trimStart) {
			return str.trimStart();
		} else if (String.prototype.trimLeft) {
			return str.trimLeft();
		}
		// IE11 兼容方案
		return str.replace(/^\s+/, '');
	}
}

window.SSE = SSE;

/*
使用示例：

var url = 'https://example.com/stream';
var source = new SSE(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
    },
    payload: JSON.stringify({ prompt: 'Hello AI' }),
});

source.onopen = function(event) {
    console.log('SSE连接已打开');
};

source.onmessage = function (event) {
    console.log('收到消息:', event.data);
};

source.onend = function (event) {
    console.log('SSE连接结束');
};

source.onerror = function (err) {
    console.error('SSE错误:', err);
};

source.stream();
*/

