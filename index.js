var express = require('express');
var app = express();
var serveIndex = require('serve-index');
var editor = require('./src/editor.js');
var print = require('./src/print.js');
var mock = require('./src/mock');
var bodyParser = require('body-parser');

app.use(bodyParser.json({ extended: true, limit: '200mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true ,limit: '200mb' } )); // for parsing application/x-www-form-urlencoded

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

app.listen(process.env.PORT||3071,'0.0.0.0',function(){
	console.log('ready...');
	console.log('http://127.0.0.1:'+(process.env.PORT||3071)+'/demo/index.html');
});
