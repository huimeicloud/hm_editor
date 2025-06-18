var express = require('express');
var router = express.Router();
var printHref = '../vendor/font-awesome.min.css';

var uuidV1 = require('uuid/v1');


router.get('/health', function (req, res) {
	var status = {
	  "status":"UP"
	};

	res.send(status);
});


var footerJs = "<script>\
  function subst() {\
      var vars = {};\
      var query_strings_from_url = document.location.search.substring(1).split('&');\
      for (var query_string in query_strings_from_url) {\
          if (query_strings_from_url.hasOwnProperty(query_string)) {\
              var temp_var = query_strings_from_url[query_string].split('=', 2);\
              vars[temp_var[0]] = decodeURI(temp_var[1]);\
          }\
      }\
      var css_selector_classes = ['page', 'frompage', 'topage', 'webpage', 'section', 'subsection', 'date', 'isodate', 'time', 'title', 'doctitle', 'sitepage', 'sitepages'];\
      for (var css_class in css_selector_classes) {\
          if (css_selector_classes.hasOwnProperty(css_class)) {\
              var element = document.getElementsByClassName(css_selector_classes[css_class]);\
              for (var j = 0; j < element.length; ++j) {\
                  element[j].textContent = vars[css_selector_classes[css_class]];\
              }\
          }\
      }\
  }\
  </script>";

var headerFollterHtmls = {};

router.post('/dynamicFooter', function (req, res) {
	stageDynamicHtml(res, "<!DOCTYPE html><html>" + "<head><link type='text/css' rel='stylesheet' href='"+ printHref +"'>" + footerJs + "</head>" + '<body style="border:0; margin: 0;" onload="subst()">' + req.body.html + "</body>" + "</html>");
});

router.post('/dynamicHeader', function (req, res) {
	stageDynamicHtml(res, "<!DOCTYPE html><html>" + "<head><link type='text/css' rel='stylesheet' href='"+ printHref +"'></head>" + '<body style="border:0; margin: 0;" >' + req.body.html + "</body>" + "</html>");
});

router.post('/dynamicHtml', function (req, res) {
	stageDynamicHtml(res, req.body.html);
});

function stageDynamicHtml(res, html) {
	var uuid = uuidV1();
	headerFollterHtmls[uuid] = html;

	// 生成页眉页脚的外链之后1分钟内删除页眉页脚, 以防止由于 print 组件异常停止服务而造成 editor 组件内存泄漏的 bug.
	setTimeout(function () {
		headerFollterHtmls[uuid] = null;
		delete headerFollterHtmls[uuid];
	}, 60 * 1000);

	res.send(uuid);
}


router.get('/dynamicHeaderFooter', function (req, res) {
	var uuid = req.query.uuid;

	var html = headerFollterHtmls[uuid];
	setTimeout(function () {
		headerFollterHtmls[uuid] = null;
		delete headerFollterHtmls[uuid];
	}, 5000);

	res.send(html);
});

router.post('/base64', function (req, res) {
	var str = Buffer.from(JSON.stringify(req.body.param)).toString('base64');
	res.send(str);
});

module.exports = router;