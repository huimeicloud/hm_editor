var express = require('express');
var path = require('path');
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

// 路由前缀
var HM = '/hmEditor';

// 显式挂载 demo 目录：本地/完整部署用 hmEditor/demo，Docker 构建用 editorDist/demo（grunt copy:demo 产出）
var fs = require('fs');
var demoDir = path.join(__dirname, 'hmEditor', 'demo');
if (!fs.existsSync(demoDir)) {
	demoDir = path.join(__dirname, 'editorDist', 'demo');
}
if (fs.existsSync(demoDir)) {
	var demoStatic = express.static(demoDir, { index: ['index.html'] });
	app.use('/demo', demoStatic);
	app.use(HM + '/demo', demoStatic);
}

// 允许跨域请求
// app.all('*', function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", '*');
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.header("Access-Control-Allow-Headers", "*");
//     res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
//     next();
// });

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

// 静态资源
var staticStack = express.Router();
staticStack.use(express.static(__dirname + '/hmEditor'));
staticStack.use(express.static(__dirname + '/editorDist'));
staticStack.use(express.static(__dirname + '/'));

// emr-editor 路由
var emrEditorRouter = express.Router();
emrEditorRouter.use('/public', express.static(__dirname + '/public'));
emrEditorRouter.use('/album', serveIndex(__dirname + '/album', { template: './album_public/directory.html' }));
emrEditorRouter.use('/mock', mock);
emrEditorRouter.use('/', editor);

// 以下路由同时挂载在 path 与 HM + path
[
	['/', staticStack],
	['/emr-editor', emrEditorRouter],
	['/hmEditor/emr-print', print],
	['/mcp-server', mcpServer.router],
	['/ai-chat', aiChat]
].forEach(function (r) {
	app.use(r[0], r[1]);
	app.use(HM + r[0], r[1]);
});

var server = app.listen(process.env.PORT||3071,'0.0.0.0',function(){
	var port = process.env.PORT||3071;
	var baseUrl = 'http://127.0.0.1:' + port;
	
	console.log('\n========================================');
	console.log('欢迎使用 惠每智能电子病历编辑器');
	console.log('官网地址：https://editor.huimei.com/');
	console.log('========================================\n');
	
	console.log('📄 Demo 页面地址（本地）：');
	console.log('   ' + baseUrl + HM + '/demo/index.html');
	console.log('   ' + baseUrl + HM + '/demo/ai-draft-demo.html');
	console.log('');
	
	console.log('📦 JS 引用方式：');
	console.log('   <script src="' + baseUrl + HM + '/iframe/HmEditorIfame.js"></script>');
	console.log('');
	
	console.log('🔗 SDK Host 地址：');
	console.log('   ' + baseUrl + HM);
	console.log('\n========================================\n');

});

// 注册MCP WebSocket服务
mcpServer.registerMcpWebSocket(server);
