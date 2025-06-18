var fs = require('fs');
var path = require('path');
var wkhtmltopdf = require('wkhtmltopdf');
var uuidV1 = require('uuid/v1');
var http = require('http');
const url = require('url');
var express = require('express');
var router = express.Router();
// 引入PDF处理相关库
// const { PDFDocument } = require('pdf-lib');
// const pdfjsLib = require('pdfjs-dist');

let options = {
	flags: 'a',     // append模式
	encoding: 'utf8'  // utf8编码
};
let stdout = fs.createWriteStream('./stdout.log', options);
// 创建logger
let logger = new console.Console(stdout);

function log(message, ...optionalParams) {
	logger.log(message, ...optionalParams);
	console.log(message, ...optionalParams);
}

function error(message, ...optionalParams) {
	logger.error(message, ...optionalParams);
	console.error(message, ...optionalParams);
}



// region chromehtml2pdf 中的部分代码
const puppeteer = require('puppeteer');

async function chromeHtmlToPdf(file, config) {
	log('Converting file: ' + file);
	log(config);

	var time = new Date().getTime();
	// Get the page to create the PDF.
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			// '--disable-gpu',
			// '--disable-dev-shm-usage',
			// '--disable-setuid-sandbox',
			// '--no-default-browser-check',
			// '--no-first-run',
			// '--no-pings',
			// '--no-sandbox',
			// '--no-zygote',
			// // '--single-process',

			'--disable-component-update',
			'--disable-default-apps',
			'--disable-dev-shm-usage',
			'--disable-domain-reliability',
			'--disable-extensions',
			'--disable-features=AudioServiceOutOfProcess',
			'--disable-gpu',
			'--disable-hang-monitor',
			'--disable-ipc-flooding-protection',
			'--disable-notifications',
			'--disable-offer-store-unmasked-wallet-cards',
			'--disable-popup-blocking',
			'--disable-print-preview',
			'--disable-prompt-on-repost',
			'--disable-setuid-sandbox',
			'--disable-speech-api',
			'--disable-sync',
			'--hide-scrollbars',
			'--ignore-gpu-blacklist',
			'--metrics-recording-only',
			// '--mute-audio',
			'--no-default-browser-check',
			'--no-first-run',
			'--no-pings',
			'--no-sandbox',
			'--no-zygote',
			'--password-store=basic',
			// '--use-gl=swiftshader',
			'--use-mock-keychain',

		]
	});
	const page = await browser.newPage();

	log('启动 chromium 耗时:' + (new Date().getTime() - time) + 'ms');
	time = new Date().getTime();
	await page.goto(file, {waitUntil: 'networkidle0', timeout: 0});
	log('加载页面耗时:' + (new Date().getTime() - time) + 'ms');
	time = new Date().getTime();
	var pdf;
	pdf = await page.pdf(config);
	log('pdf 耗时:' + (new Date().getTime() - time) + 'ms');
	await browser.close();
	return pdf;
}


router.post('/htmlToPdf', function (req, res) {


	var html = req.body.html;
	try {
		res.setHeader('Content-Type', 'application/octet-stream');
		res.setHeader("Content-Disposition", "attachment;filename=record.pdf");
		var stream = wkhtmltopdf(html);
		stream.on('error', function (r) {
			error(r);
		});
		stream.pipe(res);
	} catch (e) {
		error(e);
		res.send("fail to generate pdf");
	}
});

router.post('/pdf-service', function (req, res) {

	var html = JSON.parse(req.body.html);
	var options = JSON.parse(req.body.options);
	var pdfName = req.body.pdfName;
	try {
		res.setHeader('Content-Type', 'application/pdf;charset=utf-8');
		if (pdfName) {
			log(pdfName);
			res.setHeader("Content-Disposition", "attachment;filename=" + pdfName + ".pdf");
		}
		// options.dpi = 96;
		// options.debug = true;
		console.log(options);
		var stream = wkhtmltopdf(html, options);
		stream.on('error', function (r) {
			error(r);
		});
		if (req.body.isPrintcontinued) { //isPrintcontinued 为1则续打,否则全打印
			var bufs = [];
			stream.on("data", function (chuck) {
				bufs.push(chuck);
			});
			stream.on("end", function () {
				var buf = Buffer.concat(bufs);
				var hospitalParams = JSON.parse(req.body.hospitalParams);
				var printParam = JSON.parse(req.body.printParam);

				dealPrintContinuedPdf(buf, res, hospitalParams, printParam);
			});
		} else {
			stream.pipe(res);
		}
	} catch (e) {
		error(e);
		res.send("fail to generate pdf");
	}
});



/**
 * 通过本地处理pdf文件并保存到文件
 * 取代原来的HTTP请求方式
 */
function dealPrintContinuedPdf1(buffer, res, hospitalParams, printParam, DestinationFolder, fileName) {
	var urlParam = Object.keys(printParam).reduce((prev, ele) => {
		return prev + '&' + ele + '=' + printParam[ele];
	}, '') || '';

	log('处理续打PDF并保存到文件，参数:', printParam);

	// // 调用本地处理函数，不再发送HTTP请求
	// pdfProcessor.acceptPdf(buffer, printParam.start, printParam.header, printParam.footer)
	// 	.then(processedBuffer => {
	// 		fs.writeFile(path.join(DestinationFolder, fileName), processedBuffer, function (err) {
	// 			if (err) throw err;
	// 			res.json({ "path": path.join(DestinationFolder, fileName) });
	// 		});
	// 	})
	// 	.catch(e => {
	// 		error("PDF处理错误：", e);
	// 		res.status(500).send("打印pdf失败！");
	// 	});
}

/**
 * @param {*} res
 * ͨ生成pdf文件，返回地址
 */
router.post('/getPdfPath', function (req, res) {
	log('\n=====================');
	var time = new Date().getTime();
	// var filePath = './tmp/' + uuidV1() + '.pdf';
	var html = req.body.html;//JSON.parse(req.body.html);
	var options = req.body.options;// JSON.parse(req.body.options);
	var pdfName = req.body.pdfName;
	var DestinationFolder = './tmp/';
	var fileName = uuidV1() + '.pdf';
	try {
		log('[' + new Date().toLocaleString() + '] fileName = ' + fileName);
		res.setHeader('Content-Type', 'application/json;charset=utf-8');
		if (fileName) {
			log(fileName);
			//res.setHeader("Content-Disposition", "attachment;filename=" + pdfName + ".pdf");
		}

		// 预处理 HTML 以优化水印显示，特别是倾斜角度
		html = preProcessWatermarkHtml(html);

		// 优化 wkhtmltopdf 配置以支持水印
		var defaultOptions = {
			// 启用 JavaScript 支持
			'enable-javascript': true,
			// 等待 JavaScript 执行完成
			'javascript-delay': 1000,
			// 启用本地文件访问
			'enable-local-file-access': true,
			// 设置页面加载超时
			'load-media-error-handling': 'ignore',
			'load-error-handling': 'ignore',
			// 设置用户样式表支持
			'print-media-type': true,
			// 启用图片支持
			'no-images': false,
			// 设置编码
			'encoding': 'utf-8',
			// 启用智能收缩
			'disable-smart-shrinking': false,
			// 启用 SVG 支持
			'enable-plugins': true,
			// 设置渲染质量
			'image-quality': 100,
			'image-dpi': 300,
			// 等待页面完全加载
			'no-stop-slow-scripts': true,
			// 启用字体子集
			'disable-font-subsetting': false
		};

		// 合并用户选项和默认选项
		options = Object.assign(defaultOptions, options || {});

		// options.dpi = 96;
		// options.debug = true;
		log(options);
		var stream = wkhtmltopdf(html, options);
		stream.on('error', function (r) {
			error('error: ' + r);
		});

		try {
			fs.mkdirSync(DestinationFolder, {recursive: true});
		} catch (e) {
			error('Cannot create folder ', e);
		}
		var bufs;
		bufs = [];
		stream.on("data", function (chuck) {
			bufs.push(chuck);
		});
		stream.on("end", function () {
			var buf = Buffer.concat(bufs);
			log('wkhtmltopdf 耗时: ' + (new Date().getTime() - time) + 'ms');

			fs.writeFile(path.join(DestinationFolder, fileName), buf, (err) => {
                if (err) throw err;
                res.json({"path": path.join(DestinationFolder, fileName)});
            });
		});
	} catch (e) {
		error(e);
		res.send("fail to generate pdf");
	}
});

/**
 * @param {*} res
 * 使用 chromehtml2pdf 生成 pdf 文件，返回地址, 用于自动分页打印
 * 由于没找到添加页眉页脚的方法, 故非分页模式目前仍然走 getPdfPath.
 */
router.post('/getChromeHtml2PdfPath', async function (req, res) {
	log('\n=====================');
	await getPdfChrome(req, res);
});

async function getPdfChrome(req, res) {
	var htmlToken = req.body.htmlToken;
	var options = req.body.options;
	var pdfName = req.body.pdfName;
	var DestinationFolder = './tmp/';
	var tmpName = pdfName ? pdfName + uuidV1() : uuidV1() + ".pdf";
	res.setHeader("Content-Disposition", "attachment;filename=" + tmpName);

	const pdffilePath = path.join(__dirname, DestinationFolder + tmpName);
	log('[' + new Date().toLocaleString() + '] tmpName = ' + tmpName);
	try {
		res.setHeader('Content-Type', 'application/json;charset=utf-8');

		// 建立路径
		try {
			fs.mkdirSync(DestinationFolder, {recursive: true});
		} catch (e) {
			error('Cannot create folder ', e);
		}

		// 转换 pdf
		const c2fCfg = {
			// path: pdffilePath,
			printBackground: true,
			format: options.pageSize,
			margin: {
				top: options.marginTop,
				right: options.marginRight,
				bottom: options.marginBottom,
				left: options.marginLeft
			}
		};
		if (options.orientation === 'landscape') {
			c2fCfg.landscape = true;
		}
		log("--------------------");

		var pdf = await chromeHtmlToPdf(htmlToken, c2fCfg);

		let time = new Date().getTime();
		fs.writeFile(path.join(DestinationFolder, tmpName), pdf, (err) => {
			if (err) throw err;
			log('写文件耗时:' + (new Date().getTime() - time) + 'ms');
			res.json({"path": path.join(DestinationFolder, tmpName)});
		});
	} catch (e) {
		error(e);
		res.send("fail to generate pdf");
	}
}



/**
 * @param {*} res
 * ͨ删除pdf文件
 */
router.post('/deletepdf', function (req, res) {
	res.setHeader('Content-Type', 'application/json;charset=utf-8');
	var filePath = req.body.filePath;
	// 删除产生的 pdf 临时文件
	if (fs.existsSync(filePath)) {
		fs.unlink(filePath, function (err) {
			if (err) {
				error(err);
				throw err;
			}
		});
		// 删除通过 chromehtml2pdf 打印时产生的 html 文件
		filePath = filePath.replace('.pdf', '.html');
		if (fs.existsSync(filePath)) {
			fs.unlink(filePath, function (err) {
				if (err) {
					error(err);
					throw err;
				}
			});
		}
		res.json({ "message": "删除文件成功" });
	} else {
		res.json({ "message": "文件不存在" });
	}
	log('删除文件成功');
});

/**
 * 预处理包含水印的 HTML，确保样式兼容 wkhtmltopdf
 * 特别处理倾斜角度显示问题
 * @param {string} html - 原始 HTML 字符串
 * @returns {string} - 处理后的 HTML 字符串
 */
function preProcessWatermarkHtml(html) {
	// 添加水印兼容样式，专门处理倾斜角度
	var watermarkCompatibleStyles = `
		<style>
		/* 水印容器样式 - 兼容 wkhtmltopdf */
		.mask_box {
			position: absolute !important;
			top: 0 !important;
			left: 0 !important;
			width: 100% !important;
			height: 100% !important;
			overflow: hidden !important;
			pointer-events: none !important;
			z-index: 1000 !important;
		}

		/* 水印元素样式 - 强制内联样式，专门处理旋转兼容性 */
		.mask_div {
			position: absolute !important;
			display: block !important;
			pointer-events: none !important;
			white-space: nowrap !important;
			/* 兼容多种浏览器的 transform */
			-webkit-transform-origin: center center !important;
			-moz-transform-origin: center center !important;
			-ms-transform-origin: center center !important;
			-o-transform-origin: center center !important;
			transform-origin: center center !important;
		}

		/* 图片水印样式 */
		.mask_img {
			width: 100% !important;
			height: 100% !important;
			display: block !important;
		}

		/* 打印媒体查询 */
		@media print {
			.mask_box {
				position: absolute !important;
				top: 0 !important;
				left: 0 !important;
				width: 100% !important;
				height: 100% !important;
				overflow: hidden !important;
				pointer-events: none !important;
				z-index: 1000 !important;
			}

			.mask_div {
				position: absolute !important;
				display: block !important;
				pointer-events: none !important;
				white-space: nowrap !important;
				-webkit-print-color-adjust: exact !important;
				color-adjust: exact !important;
			}
		}
		</style>
	`;

	// 处理水印元素的倾斜角度，将 transform 转换为 wkhtmltopdf 兼容的方式
	html = html.replace(/(<div[^>]*class[^>]*mask_div[^>]*style\s*=\s*["'])([^"']*)(["'])/gi, function(match, prefix, styleContent, suffix) {
		// 提取旋转角度
		var rotateMatch = styleContent.match(/transform\s*:\s*rotate\s*\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/i);
		if (rotateMatch) {
			var angle = parseFloat(rotateMatch[1]);
			var newStyle = styleContent;

			// 移除原有的 transform
			newStyle = newStyle.replace(/transform\s*:\s*rotate\s*\([^)]*\)\s*;?/gi, '');

			// 为 wkhtmltopdf 添加多种兼容方案
			if (angle !== 0) {
				// 方案1: 使用 IE filter 语法 (wkhtmltopdf 基于 webkit，可能支持)
				var rotation = Math.round(angle / 90) % 4;
				if (rotation < 0) rotation += 4;
				var filterValue = `progid:DXImageTransform.Microsoft.BasicImage(rotation=${rotation})`;
				newStyle += `; filter: ${filterValue}; -ms-filter: "${filterValue}"`;

				// 方案2: 计算矩阵变换 (更底层的变换方式)
				var radians = angle * Math.PI / 180;
				var cos = Math.cos(radians).toFixed(6);
				var sin = Math.sin(radians).toFixed(6);
				var matrixValue = `matrix(${cos}, ${sin}, ${-sin}, ${cos}, 0, 0)`;

				// 方案3: 保留所有浏览器前缀的 transform，包括矩阵变换
				var transformValue = `rotate(${angle}deg)`;
				newStyle += `; -webkit-transform: ${transformValue}; -moz-transform: ${transformValue}; -ms-transform: ${transformValue}; -o-transform: ${transformValue}`;
				newStyle += `; -webkit-transform: ${matrixValue}; -moz-transform: ${matrixValue}; -ms-transform: ${matrixValue}; -o-transform: ${matrixValue}`;

				// 方案4: 添加 SVG 变换支持
				if (Math.abs(angle) > 10) { // 只对明显的倾斜角度生效
					// 将文字内容包装在 SVG 中
					var textContent = '';
					var textMatch = match.match(/>([^<]+)</);
					if (textMatch) {
						textContent = textMatch[1];
					}
				}
			}

			return prefix + newStyle + suffix;
		}
		return match;
	});

	// 额外处理：如果还是不行，尝试将倾斜的水印转换为 SVG
	html = html.replace(/(<div[^>]*class[^>]*mask_div[^>]*[^>]*>)([^<]+)(<\/div>)/gi, function(match, openTag, textContent, closeTag) {
		// 如果包含 transform: rotate，尝试用 SVG 替换
		if (openTag.indexOf('transform') !== -1 && openTag.indexOf('rotate') !== -1) {
			var angleMatch = openTag.match(/rotate\s*\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/i);
			if (angleMatch) {
				var angle = parseFloat(angleMatch[1]);
				var colorMatch = openTag.match(/color\s*:\s*([^;]+)/i);
				var fontSizeMatch = openTag.match(/font-size\s*:\s*([^;]+)/i);
				var opacityMatch = openTag.match(/opacity\s*:\s*([^;]+)/i);

				var color = colorMatch ? colorMatch[1].trim() : '#cccccc';
				var fontSize = fontSizeMatch ? fontSizeMatch[1].trim() : '16px';
				var opacity = opacityMatch ? opacityMatch[1].trim() : '0.3';

				// 提取位置和尺寸信息
				var leftMatch = openTag.match(/left\s*:\s*([^;]+)/i);
				var topMatch = openTag.match(/top\s*:\s*([^;]+)/i);
				var widthMatch = openTag.match(/width\s*:\s*([^;]+)/i);
				var heightMatch = openTag.match(/height\s*:\s*([^;]+)/i);

				var left = leftMatch ? leftMatch[1].trim() : '0px';
				var top = topMatch ? topMatch[1].trim() : '0px';
				var width = widthMatch ? widthMatch[1].trim() : '200px';
				var height = heightMatch ? heightMatch[1].trim() : '50px';

				// 创建 SVG 版本的倾斜文字
				var svgContent = `
					<div style="position: absolute; left: ${left}; top: ${top}; width: ${width}; height: ${height}; pointer-events: none; opacity: ${opacity};">
						<svg width="${width}" height="${height}" style="overflow: visible;">
							<text x="50%" y="50%"
								  fill="${color}"
								  font-size="${fontSize}"
								  text-anchor="middle"
								  dominant-baseline="central"
								  transform="rotate(${angle} 50% 50%)">
								${textContent}
							</text>
						</svg>
					</div>
				`;

				log(`将水印转换为 SVG 格式，角度: ${angle}度`);
				return svgContent;
			}
		}
		return match;
	});

	// 检查是否已经包含 head 标签
	if (html.indexOf('<head>') !== -1) {
		// 在 head 标签内插入样式
		html = html.replace('</head>', watermarkCompatibleStyles + '</head>');
	} else if (html.indexOf('<html>') !== -1) {
		// 在 html 标签后插入 head 和样式
		html = html.replace('<html>', '<html><head>' + watermarkCompatibleStyles + '</head>');
	} else {
		// 在 HTML 字符串开头添加样式
		html = watermarkCompatibleStyles + html;
	}

	// 确保 body 具有相对定位
	if (html.indexOf('<body') !== -1) {
		// 检查 body 是否已有 style 属性
		var bodyStyleRegex = /<body([^>]*style\s*=\s*["']([^"']*))["']([^>]*)>/i;
		var bodyMatch = html.match(bodyStyleRegex);

		if (bodyMatch) {
			// 已有 style 属性，添加 position: relative
			var existingStyle = bodyMatch[2];
			if (existingStyle.indexOf('position') === -1) {
				var newStyle = existingStyle + '; position: relative;';
				html = html.replace(bodyStyleRegex, '<body$1' + newStyle + '"$3>');
			}
		} else {
			// 没有 style 属性，添加新的
			html = html.replace(/<body([^>]*)>/i, '<body$1 style="position: relative;">');
		}
	}

	log('预处理水印 HTML 完成，已优化倾斜角度兼容性（包含 SVG 方案）');
	return html;
}

/**
 * 测试水印显示效果的接口
 */
router.post('/testWatermark', function (req, res) {
	log('\n============= 测试水印显示效果 =============');

	// 创建测试用的 HTML，包含不同角度的水印
	var testHtml = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>水印测试</title>
		<style>
			body { font-family: SimSun, Arial; padding: 20px; position: relative; }
			.content { max-width: 600px; margin: 0 auto; }
		</style>
	</head>
	<body>
		<div class="content">
			<h1>水印显示测试页面</h1>
			<p>这是一个测试页面，用于验证不同角度的水印在 PDF 中的显示效果。</p>
			<p>请检查生成的 PDF 文件中是否能看到各种角度的水印。</p>
		</div>

		<!-- 水印容器 -->
		<div class="mask_box" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; z-index: 1000;">
			<!-- -45度倾斜水印 -->
			<div class="mask_div" style="position: absolute; left: 100px; top: 150px; width: 200px; height: 50px; opacity: 0.3; color: #ff6b6b; font-size: 18px; text-align: center; line-height: 50px; transform: rotate(-45deg);">
				-45度水印
			</div>
			<!-- -30度倾斜水印 -->
			<div class="mask_div" style="position: absolute; left: 400px; top: 200px; width: 200px; height: 50px; opacity: 0.3; color: #4ecdc4; font-size: 18px; text-align: center; line-height: 50px; transform: rotate(-30deg);">
				-30度水印
			</div>
			<!-- 15度倾斜水印 -->
			<div class="mask_div" style="position: absolute; left: 150px; top: 350px; width: 200px; height: 50px; opacity: 0.3; color: #45b7d1; font-size: 18px; text-align: center; line-height: 50px; transform: rotate(15deg);">
				15度水印
			</div>
			<!-- 60度倾斜水印 -->
			<div class="mask_div" style="position: absolute; left: 350px; top: 450px; width: 200px; height: 50px; opacity: 0.3; color: #f9ca24; font-size: 18px; text-align: center; line-height: 50px; transform: rotate(60deg);">
				60度水印
			</div>
		</div>
	</body>
	</html>
	`;

	// 使用我们优化后的处理流程
	var html = preProcessWatermarkHtml(testHtml);
	var options = {
		pageSize: 'A4',
		marginTop: '10mm',
		marginRight: '10mm',
		marginBottom: '10mm',
		marginLeft: '10mm'
	};

	var DestinationFolder = './tmp/';
	var fileName = 'watermark_test_' + uuidV1() + '.pdf';

	try {
		fs.mkdirSync(DestinationFolder, {recursive: true});
	} catch (e) {
		error('Cannot create folder ', e);
	}

	// 优化 wkhtmltopdf 配置
	var defaultOptions = {
		'enable-javascript': true,
		'javascript-delay': 1000,
		'print-media-type': true,
		'no-images': false,
		'encoding': 'utf-8',
		'page-size': 'A4'
	};

	options = Object.assign(defaultOptions, options);

	log('开始生成测试 PDF，文件名:', fileName);
	var stream = wkhtmltopdf(html, options);

	stream.on('error', function (err) {
		error('PDF 生成错误:', err);
		res.status(500).send('PDF 生成失败: ' + err.message);
	});

	var bufs = [];
	stream.on("data", function (chunk) {
		bufs.push(chunk);
	});

	stream.on("end", function () {
		var buf = Buffer.concat(bufs);
		fs.writeFile(path.join(DestinationFolder, fileName), buf, (err) => {
			if (err) {
				error('写入文件失败:', err);
				res.status(500).send('写入文件失败');
				return;
			}

			log('测试 PDF 生成成功:', path.join(DestinationFolder, fileName));
			res.json({
				"success": true,
				"message": "测试 PDF 生成成功",
				"path": path.join(DestinationFolder, fileName),
				"note": "请检查 PDF 文件中的水印倾斜角度是否正确显示"
			});
		});
	});
});

module.exports = router;