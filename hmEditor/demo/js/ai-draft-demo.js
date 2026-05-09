/**
 * @file ai-draft-demo.js
 * @description AI 草稿功能演示页
 *
 * Task 06: 示例与对外说明
 * 文档：docs/03-development/task-06-demo-前端.md
 *
 * 实现要点：
 * - 演示 showAiDraft({ dataList, displayType, casualDraft, onCasualTextClick }) 调用方式
 * - 随手 data 条目含有效 sourceId 示例（见 SAMPLE_AI_DRAFT_DATA）
 * - 支持 AI 草稿/随手病历两种模式切换
 *
 * 验收要点：
 * - 需求 G5；存量调用迁移说明与技术方案 §6 风险表一致
  *
 * 功能说明：
 * - 默认加载 HM 编辑器并渲染「入院记录」模板
 * - AI草稿病历：弹窗输入 dataList（JSON）、displayType、可选「随手病历」，调用 showAiDraft({ dataList, displayType, ... })（随手时 data 条目形态见需求 §3.2）
 * - 保留全部：对指定数据元编码执行 confirmAiDraft，将 AI 草稿确认为正式内容
 * - 弃用全部：对指定数据元编码执行 cancelAiDraft，丢弃 AI 草稿
 * - 获取 HTML/Text/数据元：在排除 AI 草稿状态下导出文档内容，支持弹窗预览与文件下载
 *
 * @requires jQuery
 * @requires HMEditorLoader（全局，用于 createEditorAsync）
 */
(function () {
    'use strict';

    // ==================== 常量配置 ====================

    /** @constant {string} 当前演示使用的文档编码，与模板及 dataList 中的 code 一致 */
    const DOC_CODE = 'DOC_001';

    /** @constant {string} 入院记录模板 HTML 文件路径（相对当前页面） */
    const ADMISSION_RECORD_FILE = 'file/admission_record.html';

    /**
     * 测试用数据元编码数组
     * @constant {string[]}
     */
    const SAMPLE_KEYLIST = ['DE04.01.119.00', 'DE02.10.071.00', 'DE02.10.099.00'];

    /**
     * Task 06 演示数据：随手病历示例（含有效 sourceId）
     * 测试用 AI 草稿数据
     * @constant {Array<{code: string, data: Array<{keyCode: string, keyName: string, keyValue: string}>}>}
     */
    const SAMPLE_AI_DRAFT_DATA = [
        {
            code: DOC_CODE,
            data: [
                { sourceId: '1', keyCode: 'DE04.01.119.00', keyName: '主诉', keyValue: '【AI生成】患者因右上腹痛伴皮肤黄染3天入院。' },
                { sourceId: '2', keyCode: 'DE02.10.071.00', keyName: '现病史', keyValue: '【AI生成】入院前1天患者因右上腹疼痛伴皮肤黄染于当地医院就诊，行上腹部CT检查示：胆总管扩张，内见强回声光团伴声影，考虑"胆总管结石"可能性大，未治疗。患者自发病以来伴有恶心、厌油、尿色深黄。今为进一步明确诊断及治疗，门诊拟以"胆总管结石"收入院。' },
                { sourceId: '3', keyCode: 'DE02.10.099.00', keyName: '既往史', keyValue: '【AI生成】高血压2年余，自服"美托洛尔片"，未规律测量血压。糖尿病4年余，口服二甲双胍规律治疗。否认病毒性肝炎、肺结核病史，否认外伤、输血、手术史，过敏史：否认药物、食物过敏史。' }
            ]
        }
    ];

    /** 主操作按钮选择器，用于统一启用/禁用 */
    const MAIN_BUTTONS = '#btnAiDraft, #btnConfirmAll, #btnCancelAll, #btnGetHtml, #btnGetText, #btnGetData';

    // ==================== 状态 ====================

    /** @type {object|null} 编辑器实例 */
    let editorInstance = null;

    /** 缓存的 jQuery 元素（DOM 就绪后填充） */
    let $cache = {};

    /**
     * 编辑器就绪时执行回调，未就绪则提示并返回
     * @param {function()} fn
     */
    function withEditor(fn) {
        if (!editorInstance) {
            alert('编辑器未就绪');
            return;
        }
        fn();
    }

    /**
     * 显示/隐藏带 class 的弹窗
     */
    function showDialog($dialog) { $dialog.addClass('show'); }
    function hideDialog($dialog) { $dialog.removeClass('show'); }

    /**
     * 从输入框解析 keyList（JSON 数组），空字符串视为 undefined
     * @returns {{ ok: boolean, keyList: string[]|undefined, error: string }}
     */
    function parseKeyList(str) {
        if (str === '') return { ok: true, keyList: undefined, error: '' };
        try {
            var parsed = JSON.parse(str);
            return { ok: true, keyList: Array.isArray(parsed) ? parsed : [parsed], error: '' };
        } catch (e) {
            return { ok: false, keyList: undefined, error: 'keyList 不是有效的 JSON 数组: ' + (e.message || e) };
        }
    }

    /**
     * 将文本保存为文件并触发下载
     * @param {string} content
     * @param {{ mimeType: string, name: string, ext: string }} opts 如 { mimeType: 'text/html', name: 'document', ext: '.html' }
     */
    function downloadContent(content, opts) {
        var blob = new Blob([content], { type: opts.mimeType + ';charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = opts.name + '_' + Date.now() + opts.ext;
        a.click();
        URL.revokeObjectURL(url);
    }

    function setButtonsEnabled(enabled) {
        $(MAIN_BUTTONS).prop('disabled', !enabled);
    }

    // ==================== 内容加载与编辑器初始化 ====================

    /**
     * 加载入院记录模板 HTML，规范化为 setDocContent 所需格式
     * @returns {Promise<{code: string, docTplName: string, docContent: string}>}
     */
    function loadAdmissionRecordHtml() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: ADMISSION_RECORD_FILE,
                dataType: 'html',
                success: function (html) {
                    if (!html || !html.trim()) {
                        reject(new Error('入院记录模板内容为空'));
                        return;
                    }
                    var bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    var docContent = bodyMatch ? bodyMatch[0] : html;
                    resolve({ code: DOC_CODE, docTplName: '入院记录', docContent: docContent });
                },
                error: function (xhr, status, err) {
                    reject(new Error('加载入院记录模板失败: ' + (err || status)));
                }
            });
        });
    }

    /**
     * 初始化 HM 编辑器并加载入院记录模板
     */
    function initEditor() {
        if (!document.getElementById('editorContainer')) { return; }
        setButtonsEnabled(false);
        window.HMEditorLoader.createEditorAsync({
            container: '#editorContainer',
            id: 'aiDraftEditor',
            style: { width: '100%', height: '100%', border: 'none' },
            readOnly: false,
            editorConfig: {},
            editShowPaddingTopBottom: true
        }).then(function (editor) {
            editorInstance = editor;
            return loadAdmissionRecordHtml();
        }).then(function (contentList) {
            editorInstance.setDocContent(contentList);
            setButtonsEnabled(true);
        }).catch(function (e) {
            console.error('初始化编辑器失败:', e);
            alert('初始化失败: ' + (e.message || e));
            setButtonsEnabled(false);
        });
    }

    // ==================== AI 草稿病历（showAiDraft） ====================

    function onAiDraft() {
        withEditor(function () {
            $cache.aiDraftDataListInput.val('');
            $cache.aiDraftDisplayTypeInput.val('');
            showDialog($cache.aiDraftParamDialog);
        });
    }

    /**
     * 确认 AI 草稿参数：dataList 必填 JSON；displayType 可选，默认 1（0=覆盖，1=追加）
     */
    function onAiDraftParamConfirm() {
        var dataListStr = $cache.aiDraftDataListInput.val().trim();
        if (!dataListStr) {
            alert('请输入 dataList（JSON）');
            return;
        }
        var dataList;
        try {
            dataList = JSON.parse(dataListStr);
        } catch (e) {
            alert('dataList 不是有效的 JSON: ' + (e.message || e));
            return;
        }
        var displayType = 1;
        var displayTypeStr = $cache.aiDraftDisplayTypeInput.val().trim();
        if (displayTypeStr !== '') {
            var num = parseInt(displayTypeStr, 10);
            if (num !== 0 && num !== 1) {
                alert('displayType 请填写 0 或 1');
                return;
            }
            displayType = num;
        }
        hideDialog($cache.aiDraftParamDialog);
        var casualDraft = !!document.getElementById('aiDraftCasualDraft').checked;
        try {
            // Task 06：随手病历调用示例（带 onCasualTextClick 回调）
            if (casualDraft) {
                editorInstance.showAiDraft({
                    dataList: dataList,
                    displayType: displayType,
                    casualDraft: true,
                    onCasualTextClick: function (evt, $gen, sourceId) {
                        console.log('随手病历正文点击', { sourceId: sourceId, $gen: $gen });
                    }
                });
            } else {
                editorInstance.showAiDraft({ dataList: dataList, displayType: displayType });
            }
        } catch (e) {
            console.error('showAiDraft 失败:', e);
            alert('展示 AI 草稿失败: ' + (e.message || e));
        }
    }

    // ==================== 保留全部 / 弃用全部（confirmAiDraft / cancelAiDraft） ====================

    /** 通用：从 keyList 弹窗确认并执行 editor 方法 */
    function applyKeyListAction($input, $dialog, methodName, errLabel) {
        var r = parseKeyList($input.val().trim());
        if (!r.ok) {
            alert(r.error);
            return;
        }
        hideDialog($dialog);
        try {
            editorInstance[methodName](r.keyList);
        } catch (e) {
            console.error(methodName + ' 失败:', e);
            alert(errLabel + ': ' + (e.message || e));
        }
    }

    function onConfirmAll() {
        withEditor(function () {
            $cache.confirmAllKeyListInput.val('');
            showDialog($cache.confirmAllParamDialog);
        });
    }

    function onConfirmAllParamConfirm() {
        applyKeyListAction($cache.confirmAllKeyListInput, $cache.confirmAllParamDialog, 'confirmAiDraft', '保留全部');
    }

    function onCancelAll() {
        withEditor(function () {
            $cache.cancelAllKeyListInput.val('');
            showDialog($cache.cancelAllParamDialog);
        });
    }

    function onCancelAllParamConfirm() {
        applyKeyListAction($cache.cancelAllKeyListInput, $cache.cancelAllParamDialog, 'cancelAiDraft', '弃用全部');
    }

    // ==================== 获取内容结果弹窗（HTML/Text/数据元） ====================

    /** 按类型展示结果弹窗，contentType: 'html'|'text'|'data' 控制标题与保存按钮 */
    function showGetContentResult(title, content, contentType) {
        var c = contentType || '';
        $cache.getContentResultTitle.text(title);
        $cache.getContentResultTextarea.val(content || '');
        $cache.getContentResultSaveHtml.toggle(c === 'html');
        $cache.getContentResultSaveText.toggle(c === 'text');
        $cache.getContentResultSaveJson.toggle(c === 'data');
        showDialog($cache.getContentResultDialog);
    }

    /** 按 contentType 将当前结果区内容下载为文件 */
    var DOWNLOAD_OPTS = {
        html: { mimeType: 'text/html', name: 'document', ext: '.html' },
        text: { mimeType: 'text/plain', name: 'document', ext: '.txt' },
        data: { mimeType: 'application/json', name: 'document_data', ext: '.json' }
    };

    function onSaveHtmlResult() {
        downloadContent($cache.getContentResultTextarea.val() || '', DOWNLOAD_OPTS.html);
    }
    function onSaveTextResult() {
        downloadContent($cache.getContentResultTextarea.val() || '', DOWNLOAD_OPTS.text);
    }
    function onSaveJsonResult() {
        downloadContent($cache.getContentResultTextarea.val() || '', DOWNLOAD_OPTS.data);
    }

    /**
     * 通用：获取文档内容并展示在结果弹窗
     * @param {'getDocHtml'|'getDocText'|'getDocData'} method
     * @param {string} key 结果项键名：'html' | 'text'，data 时用 result 直接 JSON.stringify
     * @param {string} title 弹窗标题
     * @param {string} contentType 'html'|'text'|'data'
     * @param {string} errLabel 错误提示前缀
     */
    function fetchAndShowDocContent(method, key, title, contentType, errLabel) {
        // 调用 withEditor 保证在编辑器加载完毕后再执行操作
        withEditor(function () {
            try {
                // 通过传入的方法名（method，如:getDocHtml,getDocText,getDocData）调用 editorInstance 获取对应内容
                var result = editorInstance[method](DOC_CODE);
                // 若是数据类型（即 contentType === 'data'），则设置空值为 '[]'，否则为 ''
                var emptyVal = contentType === 'data' ? '[]' : '';
                // 若未获取到内容或者结果数组为空，则显示空内容的结果弹窗
                if (!result || result.length === 0) {
                    showGetContentResult(title, emptyVal, contentType);
                    return;
                }
                // 根据类型整理要展示的内容：
                //   - data: JSON 格式化后展示
                //   - html/text: 展示第一个项的 key（如 result[0].html 或 result[0].text），若为 null 则显示空串
                var content = (contentType === 'data')
                    ? JSON.stringify(result, null, 2)
                    : (result[0][key] != null ? result[0][key] : '');
                // 调用弹窗展示结果，同时标题加上“（已排除 AI 草稿）”提示
                showGetContentResult(title + '（已排除 AI 草稿）', content, contentType);
            } catch (e) {
                // 捕获错误并输出到控制台，同时弹窗提示用户
                console.error(method + ' 失败:', e);
                alert(errLabel + ': ' + (e.message || e));
            }
        });
    }

    /** 点击「获取 HTML」：导出当前文档 HTML（已排除未确认的 AI 草稿），在弹窗中展示并可保存为 .html 文件 */
    function onGetHtml() {
        fetchAndShowDocContent('getDocHtml', 'html', 'HTML 内容', 'html', '获取 HTML');
    }
    /** 点击「获取 Text」：导出当前文档纯文本（已排除未确认的 AI 草稿），在弹窗中展示并可保存为 .txt 文件 */
    function onGetText() {
        fetchAndShowDocContent('getDocText', 'text', 'Text 内容', 'text', '获取 Text');
    }
    /** 点击「获取数据元」：导出当前文档数据元 JSON（已排除未确认的 AI 草稿），在弹窗中展示并可保存为 .json 文件 */
    function onGetData() {
        fetchAndShowDocContent('getDocData', null, '数据元', 'data', '获取数据元');
    }

    // ==================== DOM 就绪与事件绑定 ====================

    $(function () {
        // 缓存常用 jQuery 对象，避免重复查询
        // 缓存常用 jQuery 对象，便于统一管理和后续使用，避免多次重复查找
        $cache = {
            aiDraftParamDialog: $('#aiDraftParamDialog'),                     // AI 草稿填写参数弹窗
            aiDraftDataListInput: $('#aiDraftDataListInput'),                 // AI 草稿数据元输入框
            aiDraftDisplayTypeInput: $('#aiDraftDisplayTypeInput'),           // AI 草稿展示类型输入框
            confirmAllParamDialog: $('#confirmAllParamDialog'),               // “一键确认”参数弹窗
            confirmAllKeyListInput: $('#confirmAllKeyListInput'),             // “一键确认”数据元 KEY 列表
            cancelAllParamDialog: $('#cancelAllParamDialog'),                 // “一键取消”参数弹窗
            cancelAllKeyListInput: $('#cancelAllKeyListInput'),               // “一键取消”数据元 KEY 列表
            getContentResultDialog: $('#getContentResultDialog'),             // 获取文档内容结果弹窗
            getContentResultTitle: $('#getContentResultTitle'),               // 结果弹窗标题
            getContentResultTextarea: $('#getContentResultTextarea'),         // 结果展示文本框
            getContentResultSaveHtml: $('#getContentResultSaveHtml'),         // 保存结果为 HTML 按钮
            getContentResultSaveText: $('#getContentResultSaveText'),         // 保存结果为文本 按钮
            getContentResultSaveJson: $('#getContentResultSaveJson')          // 保存结果为 JSON 按钮
        };

        // 绑定各主功能按钮的点击事件
        $('#btnAiDraft').on('click', onAiDraft);         // AI 草稿主按钮
        $('#btnConfirmAll').on('click', onConfirmAll);   // 一键确认主按钮
        $('#btnCancelAll').on('click', onCancelAll);     // 一键取消主按钮
        $('#btnGetHtml').on('click', onGetHtml);         // 获取 HTML 内容按钮
        $('#btnGetText').on('click', onGetText);         // 获取 Text 内容按钮
        $('#btnGetData').on('click', onGetData);         // 获取数据元内容按钮

        // 绑定结果弹窗中的保存结果按钮
        $cache.getContentResultSaveHtml.on('click', onSaveHtmlResult);   // 保存为 HTML
        $cache.getContentResultSaveText.on('click', onSaveTextResult);   // 保存为 Text
        $cache.getContentResultSaveJson.on('click', onSaveJsonResult);   // 保存为 JSON

        // 绑定关闭结果弹窗按钮
        $('#getContentResultClose').on('click', function () { hideDialog($cache.getContentResultDialog); });
        // 绑定遮罩点击关闭弹窗
        $cache.getContentResultDialog.find('.ai-draft-dialog-mask').on('click', function () { hideDialog($cache.getContentResultDialog); });

        // AI 草稿参数弹窗按钮事件
        $('#aiDraftParamConfirm').on('click', onAiDraftParamConfirm);          // 确定填写参数
        $('#aiDraftParamCancel, #aiDraftParamDialog .ai-draft-dialog-mask').on('click', function () {
            hideDialog($cache.aiDraftParamDialog);                             // 取消/遮罩关闭
        });

        // 一键确认参数弹窗按钮事件
        $('#confirmAllParamConfirm').on('click', onConfirmAllParamConfirm);    // 确定
        $('#confirmAllParamCancel, #confirmAllParamDialog .ai-draft-dialog-mask').on('click', function () {
            hideDialog($cache.confirmAllParamDialog);                          // 取消/遮罩关闭
        });

        // 一键取消参数弹窗按钮事件
        $('#cancelAllParamConfirm').on('click', onCancelAllParamConfirm);      // 确定
        $('#cancelAllParamCancel, #cancelAllParamDialog .ai-draft-dialog-mask').on('click', function () {
            hideDialog($cache.cancelAllParamDialog);                           // 取消/遮罩关闭
        });

        // 填充演示数据（AI 草稿/SAMPLE_AI_DRAFT_DATA）
        $('#aiDraftFillSample').on('click', function () {
            $cache.aiDraftDataListInput.val(JSON.stringify(SAMPLE_AI_DRAFT_DATA, null, 2));
            $cache.aiDraftDisplayTypeInput.val('1');
            document.getElementById('aiDraftCasualDraft').checked = false;
        });
        // 填充演示 KeyList（确认/取消共用 SAMPLE_KEYLIST）
        $('#confirmAllFillSample').on('click', function () {
            $cache.confirmAllKeyListInput.val(JSON.stringify(SAMPLE_KEYLIST, null, 2));
        });
        $('#cancelAllFillSample').on('click', function () {
            $cache.cancelAllKeyListInput.val(JSON.stringify(SAMPLE_KEYLIST, null, 2));
        });

        // 初始化编辑器
        initEditor();
    });
})();
