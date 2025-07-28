var express = require('express');
var app = express();
var serveIndex = require('serve-index');
var editor = require('./src/editor.js');
var print = require('./src/print.js');
var mock = require('./src/mock');
var bodyParser = require('body-parser');
const mcpServer = require('./src/mcp-server.js');
const aiChat = require('./src/mcp-client/mcp-chat.js');

app.use(bodyParser.json({ extended: true, limit: '200mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true ,limit: '200mb' } )); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.text({ limit: '200mb' })); // for parsing text/plain

// 日志中间件放在所有路由挂载之前
app.use(function(req, res, next) {
	var url = req.originalUrl;
	if (!/\.(html|js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)(\?|$)/i.test(url)) {
		console.log('[INDEX] 收到请求:', req.method, req.originalUrl);
	}
	next();
});

// dot
var dot = require('dot');
var dotPath;
app.set('view engine', 'dot');  // 设置模板引擎
app.set('views', dotPath);
app.engine('dot',async function (path, options, callback) {
    var fn = dot.template(require('fs').readFileSync(path).toString());
    var html = fn(options);
    callback(null, html);
});

app.use(express.static(__dirname + '/'));
app.use(express.static(__dirname + '/editorDist'));
app.use(express.static(__dirname + '/hmEditor'));
app.use('/emr-editor/public', express.static(__dirname + '/public'));
// app.use('/emr-print/pdf', express.static(__dirname + '/pdf'));

// app.all('*', function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", '*');
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.header("Access-Control-Allow-Headers", "*");
//     res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
//     ////res.header("X-Powered-By",' 3.2.1');
//     next();

// });
app.use('/emr-editor/album',
	serveIndex(__dirname + '/album',{
		template:"./album_public/directory.html"
	}));

app.use('/emr-editor/mock', mock);
app.use('/emr-editor', editor);
app.use('/emr-print', print);
app.use('/mcp-server', mcpServer.router);
app.use('/ai-chat', aiChat);

var server = app.listen(process.env.PORT||3071,'0.0.0.0',function(){
	console.log('ready...');
	console.log('http://127.0.0.1:'+(process.env.PORT||3071)+'/demo/index.html');
});

// 注册MCP WebSocket服务
mcpServer.registerMcpWebSocket(server);
