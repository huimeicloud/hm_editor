# HMEditor - 编辑器SDK

此SDK提供了惠每电子病历编辑器的接入方式，支持异步加载和多种调用方式。

## 基本用法

### 创建编辑器（回调方式）

```javascript
// 创建编辑器
HMEditorLoader.createEditor({
    container: "#editorContainer",
    sdkHost: "https://your-domain.com/static",
    editorConfig: {
        // 编辑器配置项
    },
    // 模式设置
    designMode: false,  // 是否启用设计模式
    reviseMode: true,   // 是否启用修订模式
    readOnly: false,    // 是否启用只读模式
    editShowPaddingTopBottom: false, // 编辑时纸张设置里面的上下边距是否有效，默认为false
    allowModifyDatasource: false,    // 允许修改数据元名称和编码
    customParams: {     // 自定义参数
        header:{},
        data:{
            departmentCode: '0001',
            doctorCode: '0001',
        }
    },
    // 转科换床页眉信息配置
    multiPartHeader: {
        controlElementName: "记录日期",  // 控制时间的数据元名称（页面中对应元素的data-hm-name属性值）
        headerList: [
            {
                startTime: "2025-08-20",      // 开始时间（格式：yyyy-MM-dd）
                endTime: "2025-08-25",        // 结束时间（格式：yyyy-MM-dd）
                headerData: {                 // 在此时间段内显示的页眉数据
                    "病区名称": "外科病区",     // 键为data-hm-name属性值
                    "科室名称": "外科",        // 值为要显示的内容
                    "床位号": "001"               
                }
            },
            {
                startTime: "2025-08-26",      // 下一个时间段
                endTime: null,                // 结束时间为空表示从startTime开始的所有时间
                headerData: {
                    "病区名称": "内科病区",
                    "科室名称": "内科", 
                    "床位号": "002"
                }
            },
            {
                startTime: null,               // 下一个时间段
                endTime: "2025-08-27",         // 开始时间为空表示endTime以前的所有时间
                headerData: {
                    "病区名称": "儿科病区",
                    "科室名称": "儿科", 
                    "床位号": "003"
                }
            }
        ]
    },
    customToolbar: [    // 自定义工具栏按钮（可选 position 控制插入位置，见下方参数表）
        {
            name: 'customButton',
            label: '自定义按钮',
            icon: '/path/to/icon.png',
            // position: { groupIndex: 0, itemIndex: 1, createNewGroup: false }, // 插入到第 0 组内第 1 个按钮位置
            // position: { groupIndex: 2, createNewGroup: true },                  // 在第 2 组前新建一组并放入按钮（默认 createNewGroup 为 true 时可省略）
            onExec: function(editor) {
                // 点击按钮时执行的代码
                console.log('自定义按钮被点击了');
            }
        }
    ],
    printConfig: {      // 打印配置
        pageBreakPrintPdf: true,
        pageAnotherTpls: ['模板一', '模板二'],
        pageAloneTpls: ['单页模板']
    },
    onReady: function(editorInstance) {
        // 编辑器初始化完成后的回调
        console.log("编辑器初始化完成");
        // 执行编辑器操作
        editorInstance.setContent("<p>编辑器内容</p>");
    }
});
```

### 创建编辑器（Promise方式 - 推荐）

```javascript
// 使用Promise方式创建编辑器
HMEditorLoader.createEditorAsync({
    container: "#editorContainer",
    sdkHost: "https://your-domain.com/static",
    editorConfig: {
        // 编辑器配置项

    },
    // 模式设置
    designMode: false,  // 是否启用设计模式
    reviseMode: false,  // 是否启用修订模式
    readOnly: true,     // 是否启用只读模式
    editShowPaddingTopBottom: false, // 编辑时纸张设置里面的上下边距是否有效，默认为false
    allowModifyDatasource: false,    // 允许修改数据元名称和编码
    customParams: {     // 自定义参数
        departmentCode: '0001',
        doctorCode: '0001'
    },
    customToolbar: [    // 自定义工具栏按钮（可选 position 控制插入位置，见下方参数表）
        {
            name: 'customButton',
            label: '自定义按钮',
            icon: '/path/to/icon.png',
            // position: { groupIndex: 0, itemIndex: 1, createNewGroup: false }, // 插入到第 0 组内第 1 个按钮位置
            // position: { groupIndex: 2, createNewGroup: true },                  // 在第 2 组前新建一组并放入按钮（默认 createNewGroup 为 true 时可省略）
            onExec: function(editor) {
                // 点击按钮时执行的代码
                console.log('自定义按钮被点击了');
            }
        }
    ],
    printConfig: {      // 打印配置
        pageBreakPrintPdf: true,
        pageAnotherTpls: ['模板一', '模板二'],
        pageAloneTpls: ['单页模板']
    }
})
.then(function(result) {
    // 编辑器初始化完成
    var editorInstance = result;

    // 执行编辑器操作
    editorInstance.setContent("<p>编辑器内容</p>");
})
.catch(function(error) {
    console.error("编辑器初始化失败:", error);
});
```

## 获取编辑器实例

### 直接获取已加载的编辑器实例

```javascript
// 直接获取编辑器实例（如果尚未加载完成，将返回null）
var editorInstance = HMEditorLoader.getInstance(editorId);
if (editorInstance) {
    // 执行编辑器操作
    editorInstance.setContent("<p>更新内容</p>");
} else {
    console.log("编辑器尚未加载完成，请使用异步方法获取");
}
```

### 异步获取编辑器实例（Promise方式 - 推荐）

```javascript
// 通过ID异步获取编辑器实例，自动等待直到编辑器加载完成
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        // 编辑器实例已准备好
        editorInstance.setContent("<p>更新内容</p>");
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });


```

### 异步获取编辑器实例（回调方式）

```javascript
// 通过回调方式获取编辑器实例，自动重试
HMEditorLoader.getEditorInstance(editorId, function(editorInstance, error) {
    if (error) {
        console.error("获取编辑器实例失败:", error);
        return;
    }

    // 编辑器实例已准备好
    editorInstance.setContent("<p>更新内容</p>");
});
```

## 销毁编辑器

```javascript
// 销毁编辑器实例
HMEditorLoader.destroyEditor(editorId);
```

## API 参考表

| 方法 | 参数 | 返回值 | 描述 |
| --- | --- | --- | --- |
| createEditor | options:Object | void | 创建编辑器实例 |
| createEditorAsync | options:Object | Promise | 创建编辑器，返回Promise |
| getInstance | id:String | Object\|null | 直接获取编辑器实例，可能为null |
| getEditorInstance | id:String, callback:Function | void | 通过回调获取编辑器实例 |
| getEditorInstanceAsync | id:String, [timeout:Number] | Promise | 返回Promise，自动等待编辑器加载 |
| destroyEditor | id:String | void | 销毁编辑器实例 |

### options参数说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| container | String\|Element | 是 | 容器选择器或DOM元素 |
| sdkHost | String | 是 | 加载sdk的基础URL地址 |
| id | String | 否 | iframe唯一标识，不填会自动生成 |
| style | Object | 否 | iframe样式对象 |
| editorConfig | Object | 否 | 编辑器配置参数 |
| editorConfig.contentCss | Array | 否 | 编辑器配置的样式参数 |
| onReady | Function | 否 | 编辑器初始化完成回调函数 |
| designMode | Boolean | 否 | 设计模式开关，true开启设计模式，默认false |
| reviseMode | Boolean | 否 | 修订模式开关，true开启修订模式，默认false |
| allowModifyDatasource | Boolean | 否 | 允许修改数据元名称和编码，true允许，默认false |
| readOnly | Boolean | 否 | 只读模式开关，true开启只读模式，默认false |
| editShowPaddingTopBottom | Boolean | 否 | 编辑时纸张设置里面的上下边距是否有效，默认为false |
| allowModifyDatasource | Boolean | 否 | 允许修改数据元名称和编码，true允许，默认false |
| customParams | Object | 否 | 自定义参数，用于动态数据源接口入参，例：{departmentCode:'0001',doctorCode:'0001'} |
| customToolbar | Array | 否 | 自定义工具栏按钮数组；每项含 name、label、onExec，可选 icon、onRefresh、**position**（见下） |
| customToolbar[].position | Object | 否 | 按钮在工具栏上的位置；不传则在工具栏**末尾追加一个新组** |
| customToolbar[].position.groupIndex | Number | 否 | 工具栏**组**下标，从 0 开始。与 createNewGroup、itemIndex 配合使用 |
| customToolbar[].position.itemIndex | Number | 否 | 仅当 **createNewGroup 为 false** 时有效：插入到该组 `items` 内的下标（从 0 开始）；未传或无效则追加到该组末尾 |
| customToolbar[].position.createNewGroup | Boolean | 否 | 是否新建独立工具栏组，**默认 true**。为 true 时在 `groupIndex` 处插入**新组**（仅含当前按钮）；为 false 时将按钮**插入已有**第 `groupIndex` 组 |
| printConfig | Object | 否 | 打印配置参数 |
| printConfig.pageBreakPrintPdf | Boolean | 否 | 分页模式打印是否生成pdf |
| printConfig.pageAnotherTpls | Array | 否 | 另页打印模板名称 |
| printConfig.pageAloneTpls | Array | 否 | 单独一页打印模板名称 |
| printConfig.pageAnotherCodes | Array | 否 | 另页打印文档编码（doc_code，对应 data-hm-widgetid） |
| printConfig.pageAloneCodes | Array | 否 | 单独一页打印文档编码（doc_code） |
| multiPartHeader | Object | 否 | 转科换床页眉信息配置 |
| multiPartHeader.controlElementName | String | 是 | 控制时间的数据元名称（页面中对应元素的data-hm-name属性值） |
| multiPartHeader.headerList | Array | 是 | 页眉信息列表，包含不同时间段的页眉数据配置 |
| multiPartHeader.headerList[].startTime | String | 否 | 时间段开始时间，格式：yyyy-MM-dd |
| multiPartHeader.headerList[].endTime | String | 否 | 时间段结束时间，格式：yyyy-MM-dd，为空表示从startTime开始的所有时间 |
| multiPartHeader.headerList[].headerData | Object | 是 | 页眉数据对象，键为页面元素的data-hm-name属性值，值为显示内容 |

### 默认工具栏组（与 `customToolbar.position.groupIndex` 对照）

内置工具栏定义在仓库根目录的 [`config.js`](../config.js) 中 `config.toolbar`（按从左到右顺序）。`position.groupIndex` 即下表中的 **组下标**；若集成方通过 `editorConfig` 等方式覆盖了 `toolbar`，以下顺序以运行时的 `editor.config.toolbar` 为准。

| 组下标 | `name` | 组内按钮（`items`，`-` 为分隔符） |
| --- | --- | --- |
| 0 | document | Save、Print、PagebreakByHand、Sync、Paper、Datasource、Document、Revise、Album、Image |
| 1 | clipboard | Copy、Undo、Redo |
| 2 | indent | Outdent、Indent |
| 3 | paragraph | JustifyLeft、JustifyCenter、JustifyRight、JustifyBlock |
| 4 | list | NumberedList、BulletedList |
| 5 | insert | Table、HorizontalRule、SpecialChar |
| 6 | styles | Containerstyle、Font、FontSize |
| 7 | basicstyles | Bold、Italic、Underline、Strike、Subscript、Superscript、RemoveFormat |
| 8 | colors | TextColor、BGColor |
| 9 | clear | Clear |
| 10 | pagebreak | PageBreak |
| 11 | switchmodel | SwitchModel |
| 12 | find | Find、Replace |
| 13 | documenttree | DocumentTree |

共 **14** 组（下标 **0～13**）。未配置 `position` 的自定义按钮会在末尾**再追加一组**（实现见 `hmEditor/extensions/base/js/fn.baseInit.js` 的 `registerToolbar`）。

## 常见问题

### 编辑器加载慢或者无法加载

1. 检查网络连接和资源加载情况
2. 确保sdkHost配置正确，资源文件可以正常访问
3. 使用浏览器开发者工具查看是否有资源加载错误

### 编辑器初始化后无法获取实例

1. 使用`getEditorInstanceAsync`或`getEditorInstance`方法替代直接获取
2. 确保在`onReady`回调中或Promise解析后再进行操作

### 获取实例时出现超时

1. 检查编辑器是否正确初始化
2. 确保sdkHost指向正确的地址
3. 可能是资源加载问题导致编辑器初始化失败

### 编辑器资源冲突

1. 确保页面中没有多个版本的jQuery或其他库冲突
2. 避免在全局作用域中修改jQuery或其他库

### 转科换床页眉配置问题

1. **时间格式错误**：确保 startTime 和 endTime 使用 yyyy-MM-dd 格式（如：2025-08-25）
2. **data-hm-name属性值错误**：确保 controlElementName 和 headerData 中的键与页面元素的 data-hm-name 属性值完全一致
3. **时间范围重叠**：避免多个时间段重叠，系统会使用第一个匹配的记录
4. **页眉数据不生效**：检查页眉模板中是否存在对应 data-hm-name 属性的元素节点
5. **时间匹配逻辑**：
   - 如果同时设置 startTime 和 endTime：recordTime > startTime 且 recordTime <= endTime
   - 如果只设置 endTime：recordTime <= endTime  
   - 如果只设置 startTime：recordTime > startTime

## 最佳实践

1. 优先使用Promise方式（createEditorAsync、getEditorInstanceAsync）
2. 总是处理异常情况，特别是在网络不稳定的环境
3. 在单页应用中切换页面时，记得销毁不再使用的编辑器实例
4. 使用editorConfig参数定制编辑器功能
5. 在页面初始化时就创建编辑器，而不是等到用户交互时
6. 根据实际业务场景合理配置customParams参数，确保动态数据源接口能获取到正确的上下文信息


# HMEditor - 编辑器助手
## 初始化认证信息
### 基本用法
```javascript
// 初始化认证信息并加载CDSS SDK
var autherEntity = {
    authToken: 'your-auth-token',
    aiServer: 'https://ai-server.com',
    userGuid: 'patient-001',
    userName: '张三',
    doctorGuid: 'doctor-001',
    doctorName: '李医生',
    serialNumber: 'HN20231201001',
    department: '内科',
    hospitalGuid: 'hospital-001',
    hospitalName: '某某医院',
    flag: 'm', // m:住院 c:门诊
    customEnv: 1
};
// 映射编辑器支持的病历类型
var recordMapData = [{
    "recordName": "出院记录",
    "recordType": 10,
}];
HMEditorLoader.aiAuth(autherEntity, recordMap, cusMayson)
.then(function(mayson) {
    console.log('认证初始化成功，编辑器助手已加载');
    // mayson 是编辑器助手实例，可用于AI辅助功能
    // 接下来可以创建编辑器
})
.catch(function(error) {
    console.error('初始化失败:', error);
}); 
```
## API 参考表

| 方法 | 参数 | 返回值 | 描述 |
| --- | --- | --- | --- |
| aiAuth | autherEntity:Object | Promise | 初始化认证信息并加载CDSS SDK，返回编辑器助手实例 |

### options参数说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| authToken | String | 是 | AI令牌 |
| aiServer | String | 是 | AI服务器地址 |
| userGuid | String | 是 | 患者唯一标识ID |
| userName | String | 是 | 患者姓名 |
| doctorGuid | String |	是 | 医生唯一标识ID |
| doctorName | String |	是 | 医生姓名 |
| serialNumber | String | 是 | 住院号或门诊号 |
| department | String |	是 | 科室名称 |
| hospitalGuid | String | 否 | 医院唯一标识ID（非必要字段） |
| hospitalName | String | 否 | 医院名称（非必要字段） |
| flag | String | 是 | 就诊类型标识，'m'表示住院，'c'表示门诊 |
| customEnv | Object | 否 | 自定义环境参数 |
| recordMap | Array | 否 | 病历类型映射数据 |
| cusMayson | Boolean | 否 | 客户端是否已对接mayson，true:已对接；false:未对接 |

## 常见问题

### CDSS SDK加载失败

1. 检查网络连接和aiServer地址配置
2. 确保authToken认证密钥有效
3. 使用浏览器开发者工具查看是否有脚本加载错误

### 认证超时
1. 检查网络连接稳定性
2. 确认AI服务器响应正常
3. 默认超时时间为10秒，可能需要优化网络环境

### 参数配置错误
1. 确保必填参数都已正确填写
2. flag参数只能是'm'或'c'
3. 检查userGuid和doctorGuid等ID参数格式

### 最佳实践
1. 在创建编辑器之前先调用此方法进行认证
2. 总是处理Promise的异常情况
3. 保存mayson实例以供后续AI功能使用
4. 根据实际业务场景正确设置flag参数（住院/门诊）
5. 在单页应用中避免重复初始化认证信息

## 质控提醒功能
### 基本用法
```javascript
// 调用质控提醒功能
var qcParams = {
    userGuid: 'patient-001',
    serialNumber: 'HN20231201001',
    caseNo: 'CASE20231201001',
    currentBedCode: 'B001',
    patientName: '张三',
    doctorGuid: 'doctor-001',
    doctorName: '李医生',
    admissionTime: '2023-12-01 10:00:00',
    inpatientDepartment: '内科',
    inpatientArea: '内科病区',
    inpatientDepartmentId: 'DEPT001',
    divisionId: 'DIV001',
    pageSource: 'emr',
    openInterdict: 1,
    triggerSource: 1,
    patientInfo: {
        gender: 0, // 0:男,1:女
        birthDate: '1980-01-01',
        age: '43',
        ageType: '岁',
        maritalStatus: 1,
        pregnancyStatus: 0
    },
    progressNoteList: [
        {
            progressGuid: 'PROG001',
            progressTypeName: '入院记录',
            progressType: 1,
            doctorGuid: 'doctor-001',
            doctorName: '李医生',
            progressMessage: '患者入院情况...',
            msgType: 1
        }
    ]
};

// 获取编辑器实例后调用质控功能
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.qc(qcParams);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### qc方法参数说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| userGuid | String | 是 | 用户唯一标识 |
| serialNumber | String | 是 | 序列号（住院号或门诊号） |
| caseNo | String | 是 | 病历号 |
| currentBedCode | String | 是 | 床位号 |
| patientName | String | 是 | 患者姓名 |
| doctorGuid | String | 是 | 医生唯一标识 |
| doctorName | String | 是 | 医生姓名 |
| admissionTime | String | 是 | 入院时间 |
| inpatientDepartment | String | 是 | 住院科室 |
| inpatientArea | String | 是 | 病区 |
| inpatientDepartmentId | String | 是 | 科室ID |
| divisionId | String | 是 | 病区ID |
| pageSource | String | 是 | 页面来源 |
| openInterdict | Number | 是 | 是否开启拦截（0:否,1:是） |
| triggerSource | Number | 是 | 触发来源 |
| patientInfo | Object | 是 | 患者信息对象 |
| patientInfo.gender | Number | 是 | 性别（0:男,1:女） |
| patientInfo.birthDate | String | 是 | 出生日期 |
| patientInfo.age | String | 是 | 年龄 |
| patientInfo.ageType | String | 是 | 年龄单位 |
| patientInfo.maritalStatus | Number | 是 | 婚姻状况 |
| patientInfo.pregnancyStatus | Number | 是 | 妊娠状态 |
| progressNoteList | Array | 是 | 病历列表 |
| progressNoteList[].progressGuid | String | 是 | 病历唯一标识 |
| progressNoteList[].progressTypeName | String | 是 | 病历类型名称 |
| progressNoteList[].progressType | Number | 是 | 病历类型 |
| progressNoteList[].doctorGuid | String | 是 | 医生唯一标识 |
| progressNoteList[].doctorName | String | 是 | 医生姓名 |
| progressNoteList[].progressMessage | String | 是 | 病历内容 |
| progressNoteList[].msgType | Number | 是 | 消息类型 |

## 激活指尖大模型
### 基本用法
```javascript
// 调用AI助手功能
var aiParams = {
    recordType: '入院记录', // 病历类型
    progressGuid: 'PROG001' // 病历唯一编号
};

// 获取编辑器实例后调用AI助手功能
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.aiActive(aiParams);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### ai方法参数说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| recordType | String | 是 | 病历类型（如：入院记录、病程记录等） |
| progressGuid | String | 是 | 病历唯一编号 |

## 病历生成功能
### 基本用法
```javascript
// 调用病历生成功能，获取当前widget中可AI生成的数据元节点并进行批量生成
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.generateDocument();
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### generateDocument方法说明

| 方法名 | 参数 | 返回值 | 描述 |
| --- | --- | --- | --- |
| generateDocument | 无 | void | 获取当前widget中可AI生成的数据元节点并进行批量生成 |

**功能说明：**
- 此方法会自动扫描当前文档中所有可进行AI生成的数据元节点
- 对扫描到的数据元节点进行批量AI生成处理
- 无需传入参数，方法会自动处理当前文档内容
- 适用于需要批量生成病历内容的场景

## 病历段落生成功能
### 基本用法
```javascript
// 调用病历段落生成功能，根据目标节点生成病历段落 
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var selection = editorInstance.editor.getSelection().getRanges()[0]; // 获取鼠标焦点
        var targetNode = selection.startContainer.$; // 目标节点
        editorInstance.generateSection(targetNode);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### generateSection方法说明

| 方法名 | 参数 | 类型 | 必填 | 返回值 | 描述 |
| --- | --- | --- | --- | --- | --- |
| generateSection | targetNode | Object | 是 | void | 根据目标节点生成病历段落 |

**功能说明：**
- 此方法针对指定的目标节点进行AI段落生成
- 支持对文档中的特定区域或节点进行精确的段落生成
- 适用于需要针对特定内容区域进行AI生成的场景
- 相比generateDocument的批量处理，此方法更加精确和针对性

**参数说明：**
- `targetNode`: 目标节点对象，指定需要进行AI段落生成的DOM节点

## 自定义属性管理功能

自定义属性管理功能允许开发者为病历文档中的特定节点设置、获取和删除自定义属性，实现业务数据的扩展存储和管理。

### 功能特点

- **灵活存储**：支持为任意节点设置键值对形式的自定义属性
- **精确定位**：通过病历编码和节点标识精确定位目标节点
- **批量操作**：支持批量设置、获取和删除多个属性
- **持久化存储**：自定义属性与文档内容一起保存，确保数据持久性
- **业务扩展**：为第三方业务系统提供数据扩展能力

### 应用场景

1. **业务标识存储**：存储业务系统中的唯一标识、状态码等
2. **元数据管理**：保存文档的创建时间、修改者、版本信息等
3. **工作流状态**：记录文档的审批状态、流转信息等
4. **集成数据**：存储与外部系统集成的相关数据
5. **自定义标记**：添加业务相关的标记和分类信息

### 基本用法

```javascript
// 设置自定义属性
var customProps = [
    {
        name: 'businessId',      // 业务系统ID
        value: 'BIZ20231201001'
    },
    {
        name: 'approvalStatus',  // 审批状态
        value: 'pending'
    },
    {
        name: 'createTime',      // 创建时间
        value: '2023-12-01 10:30:00'
    },
    {
        name: 'departmentCode', // 科室编码
        value: 'DEPT001'
    }
];

HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setCustomProperties({
            code: 'DOC001',              // 病历唯一编码
            section: 'SECTION001',        // 节点标识（节点ID）
            customProperty: customProps   // 自定义属性数组
        });
        console.log('自定义属性设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 获取自定义属性
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var result = editorInstance.getCustomProperties({
            code: 'DOC001',
            section: 'SECTION001',
            propertyNames: ['businessId', 'approvalStatus', 'createTime']  // 属性名数组
        });
        console.log('获取到的属性:', result);
        // 输出: {businessId: 'BIZ20231201001', approvalStatus: 'pending', createTime: '2023-12-01 10:30:00'}
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 删除自定义属性
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.deleteCustomProperties({
            code: 'DOC001',
            section: 'SECTION001',
            propertyNames: ['createTime']  // 要删除的属性名数组
        });
        console.log('自定义属性删除成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### setCustomProperties - 设置自定义属性

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| params | Object | 是 | 参数对象 |
| params.code | String | 是 | 病历唯一编码，用于标识具体的病历文档 |
| params.section | String | 是 | 节点标识，可理解为节点ID |
| params.customProperty | Array | 是 | 自定义属性数组 |
| params.customProperty[].name | String | 是 | 属性名，建议使用有意义的命名 |
| params.customProperty[].value | String | 是 | 属性值，支持任意字符串内容 |

**返回值：** 无

**使用说明：**
- 如果属性已存在，将覆盖原有值
- 支持同时设置多个属性
- 属性名建议使用驼峰命名法或下划线命名法
- 属性值支持JSON字符串格式，便于存储复杂数据结构

#### getCustomProperties - 获取自定义属性

| 参数名 | 类型 | 必填 | 返回值 | 描述 |
| --- | --- | --- | --- | --- |
| params | Object | 是 | Object | 参数对象 |
| params.code | String | 是 | - | 病历唯一编码 |
| params.section | String | 是 | - | 节点标识（可理解为节点ID） |
| params.propertyNames | Array | 是 | - | 属性名数组，指定要获取的属性 |
| - | - | - | Object | 返回属性名值对对象，格式：{属性名: 属性值} |

**返回值说明：**
- 成功时返回包含指定属性的对象
- 如果某个属性不存在，该属性不会出现在返回对象中
- 如果所有属性都不存在，返回空对象 `{}`

#### deleteCustomProperties - 删除自定义属性

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| params | Object | 是 | 参数对象 |
| params.code | String | 是 | 病历唯一编码 |
| params.section | String | 是 | 节点标识（可理解为节点ID） |
| params.propertyNames | Array | 是 | 要删除的属性名数组 |

**返回值：** 无

**使用说明：**
- 支持批量删除多个属性
- 如果属性不存在，不会报错
- 删除操作不可逆，请谨慎使用

## 文档数据获取功能

文档数据获取功能提供了获取病历文档和表格数据的能力，支持获取文档的完整结构信息和表格的详细数据内容。

### 功能特点

- **完整数据获取**：支持获取文档的完整结构和内容信息
- **表格数据提取**：专门针对表格元素提供数据提取功能
- **结构化输出**：返回结构化的JSON数据，便于后续处理
- **实时数据**：获取当前编辑器中的实时数据状态
- **多格式支持**：支持获取不同格式的数据信息

### getDocData - 获取文档数据

获取当前文档的完整数据信息，包括文档数据元的详细信息。

#### 基本用法

```javascript
// 获取文档数据
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docData = editorInstance.getDocData();
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

#### getDocData方法说明

| 参数 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 是 | 文档唯一编号 |
| keyList | Array | 否 | 指定数据元编码列表 |

**返回值结构：**
```javascript
[
  {
    code: 'DOC_001',
    data: [
      { keyCode: 'PATIENT_NAME', keyValue: '李四', keyId: '001', keyName: '患者姓名' }
    ]
  }
]
// 下拉、单选、多选
[
  {
    code: "DOC_001",
    data: [
      {
        keyCode: "PROVINCE_CODE",
        keyId: "010",
        keyName: "出生地_省",
        keyValue: {
          code: "110000",
          value: "北京市"
        }
      }
    ]
  }
]
```

### getTableData - 获取表格数据

获取文档中指定表格的详细数据信息，包括表格结构、单元格内容、样式等。

#### 基本用法

```javascript
// 获取指定表格的数据
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var tableId = 'TABLE_001'; // 表格ID
        var tableData = editorInstance.getTableData(tableId); 
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

#### getTableData方法说明

| 参数 | 类型 | 必填 | 描述 |
| --- | --- | ---  | --- |
| params | Object | 是 | 列表类表格参数 |
| params.tableCode | String | 是 | 表格编码 |
| params.keyList | Array | 否 | 获取列的keyCode数据 |
| params.rowIndex | Number | 否 | 获取索引（竖向：行索引；横向：列索引） |

**参数说明：**
- `tableCode`: 表格的唯一标识符，用于定位具体的表格元素

**返回值结构：**
```javascript
{
  keyCode: "TABLE_一般护理记录单",
  keyName: "一般护理记录单",
  keyId: "e82d6aeca9c0139d9f4098f1d61c2f511",
  keyValue: [
    [
      {
        keyCode: "", // 数据元编码
        keyId: "", // 数据元ID
        keyName: "", // 数据元名称
        keyValue: "" // 数据元返回值
      },
      {
        keyCode: "", // 数据元编码
        keyId: "", // 数据元ID
        keyName: "", // 数据元名称
        keyValue: { // 下拉、单选、多选 数据元返回值
            code:"",
            value:""
        } 
      } 
    ]
  ]
}
```

**返回值说明：**
- 成功时返回包含表格详细信息的对象
- 如果表格不存在或tableCode无效，返回null 

## AI辅助修正功能
### 基本用法
```javascript
// 调用AI辅助修正功能，对指定规则进行AI辅助修正
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var ruleId = 'RULE001'; // 规则ID
        editorInstance.aiAssistCorrect(ruleId);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### aiAssistCorrect方法说明

| 方法名 | 参数 | 类型 | 必填 | 返回值 | 描述 |
| --- | --- | --- | --- | --- | --- |
| aiAssistCorrect | ruleId | String | 是 | void | 对指定规则进行AI辅助修正 |

**功能说明：**
- 此方法用于触发AI辅助修正功能，针对特定的质控规则进行自动修正
- 通过传入规则ID，系统会根据该规则对当前文档内容进行智能分析和修正建议
- 适用于质控规则触发后，需要进行AI辅助修正的场景
- 可以帮助医生快速修正文档中不符合质控规则的内容

**参数说明：**
- `ruleId`: 规则ID，指定需要进行AI辅助修正的质控规则标识

**使用场景：**
- 质控系统发现文档中存在不符合规范的内容时
- 需要对特定的医疗文书规则进行智能修正时
- 提高文档质量和规范性的辅助工具

## 常见问题

### 质控提醒功能无法调用

1. 确保已正确初始化认证信息（调用aiAuth方法）
2. 检查质控参数是否完整，必填字段不能为空
3. 确认编辑器实例已正确加载
4. 检查网络连接和AI服务器状态

### 激活指尖大模型功能无响应

1. 确保已正确初始化认证信息
2. 检查recordType和progressGuid参数是否正确
3. 确认AI服务器地址配置正确
4. 检查网络连接稳定性

### AI辅助修正功能异常

1. 确保已正确初始化认证信息和AI服务
2. 检查传入的ruleId参数是否有效
3. 确认质控规则存在且配置正确
4. 检查AI服务器响应和网络连接状态
5. 确保编辑器实例已正确加载且处于可编辑状态

### 最佳实践

#### 通用最佳实践
1. 在调用qc、ai和aiAssistCorrect功能前，确保已完成认证初始化
2. 总是处理异常情况，特别是在网络不稳定的环境
3. 根据实际业务场景正确设置质控参数
4. 在调用AI功能前，确保编辑器实例已准备就绪
5. 合理设置质控提醒的触发时机，避免频繁调用
6. 使用aiAssistCorrect时，确保ruleId对应的质控规则已正确配置
7. 建议在质控规则触发后立即调用aiAssistCorrect，以提供最佳的用户体验


## 文档修改用户信息功能

文档修改用户信息功能允许开发者为编辑器设置当前操作用户信息，用于文档修订模式下的用户身份标识和修改记录追踪。

### 基本用法

```javascript
// 设置文档修改用户
var userInfo = {
    userId: 'USER001',        // 用户唯一标识
    userName: '张医生'        // 用户显示名称
};

HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var result = editorInstance.setDocModifyUser(userInfo);
        if (result) {
            console.log('用户信息设置成功');
        } else {
            console.error('用户信息设置失败');
        }
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

```

### 方法参数说明

#### setDocModifyUser - 设置文档修改用户

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| userInfo | Object | 是 | 用户信息对象 |
| userInfo.userId | String | 是 | 用户唯一标识ID |
| userInfo.userName | String | 是 | 用户显示名称 |

**返回值：** Boolean
- `true`: 设置成功
- `false`: 设置失败（参数格式错误或缺少必填字段）

**使用说明：**
- 用户信息会被存储到编辑器的配置中，供后续修改操作使用
- 在修订模式下，每次修改都会记录当前用户信息
- 建议在编辑器初始化完成后立即设置用户信息

### 修订模式下的用户追踪

在修订模式下，编辑器会自动使用当前设置的用户信息来标记修改内容：

```javascript
// 设置用户信息
editorInstance.setDocModifyUser({
    userId: 'DOC001',
    userName: '李医生'
});

// 在修订模式下进行修改，系统会自动记录修改者信息
// 修改的内容会被标记为：
// <ins hm-modify-userId="DOC001" hm-modify-userName="李医生">修改内容</ins>
```


## 文档只读状态控制功能

文档只读状态控制功能允许开发者动态设置文档的只读状态，用于控制文档是否允许编辑，适用于流程审批、只读浏览、权限管控等场景。

### 基本用法

```javascript
// 设置指定文档为只读状态
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docCode = 'DOC001';  // 文档唯一编号
        var isReadOnly = true;   // true:只读 false:可编辑
        
        editorInstance.setDocReadOnly(docCode, isReadOnly);
        console.log('文档只读状态设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 设置所有文档为只读状态
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setDocReadOnly(null, true);  // code为null表示所有文档
        console.log('所有文档已设置为只读状态');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 恢复文档为可编辑状态
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setDocReadOnly('DOC001', false);
        console.log('文档已恢复为可编辑状态');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### setDocReadOnly - 设置文档只读状态

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 否 | 文档唯一编号，为null时表示设置所有文档 |
| flag | Boolean | 是 | 是否只读，true表示只读，false表示可编辑 |

**返回值：** 无

**使用说明：**
- 当 `code` 参数为 `null` 或空字符串时，会设置所有文档的只读状态
- 当 `code` 参数指定具体文档编号时，只设置该文档的只读状态
- 只读状态下，文档内容会显示特殊的背景颜色
- 只读状态下，各种交互组件（下拉框、时间选择器等）会被禁用
- 只读状态下，图片调整控件会被隐藏
- 只读状态下，相关编辑工具栏按钮会被禁用

### 常见问题

#### 只读状态设置不生效

1. **文档编号错误**：检查传入的 `code` 参数是否正确
2. **文档未加载**：确保目标文档已经正确加载到编辑器中
3. **参数类型错误**：确保 `flag` 参数是布尔类型（true/false）
4. **编辑器状态**：确认编辑器已正确初始化

#### 只读状态下仍可编辑

1. **设置时机问题**：确保在文档完全加载后再设置只读状态
2. **权限冲突**：检查是否有其他权限设置覆盖了只读状态
3. **组件状态**：确认各种交互组件是否正确禁用

#### 只读状态无法恢复

1. **参数设置错误**：确保恢复时传入 `false` 参数
2. **文档状态检查**：检查文档是否处于特殊状态（如锁定状态）
3. **权限验证**：确认当前用户有权限修改文档状态

### 最佳实践

1. **设置时机**：在文档加载完成后设置只读状态，避免设置过早导致不生效
2. **状态管理**：建立文档状态管理系统，统一管理文档的只读/可编辑状态
3. **用户提示**：在只读状态下为用户提供明确的状态提示信息
4. **权限控制**：结合用户权限系统，确保只有有权限的用户才能修改文档状态
5. **状态同步**：在多用户协作场景中，及时同步文档状态变化
6. **错误处理**：设置只读状态时进行错误处理，确保操作的可靠性
7. **性能优化**：对于大量文档的场景，考虑批量设置以提高性能

#### setElementReadOnly - 设置元素只读状态

该方法用于设置指定文档中指定数据元元素的只读状态，可以针对文档中的特定数据元进行只读控制，而不是整个文档。

**方法签名：**
```javascript
setElementReadOnly(code, elementList, flag)
```

**参数说明：**

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 否 | 文档唯一编号，为空字符串时表示对所有文档进行处理 |
| elementList | Array | 是 | 数据元code数组，包含需要设置只读状态的数据元编码列表 |
| flag | Boolean | 是 | 是否只读，true表示只读，false表示可编辑 |

**返回值：** 无

**使用示例：**
```javascript
// 设置指定文档中特定数据元为只读状态
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docCode = 'DOC001';  // 文档唯一编号
        var elementList = ['ELEMENT001', 'ELEMENT002'];  // 数据元code数组
        var isReadOnly = true;   // true:只读 false:可编辑
        
        editorInstance.setElementReadOnly(docCode, elementList, isReadOnly);
        console.log('元素只读状态设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

**使用说明：**
- 当 `code` 参数为空字符串时，会对所有文档中的指定数据元进行处理
- `elementList` 必须是包含数据元code的数组，不能为空
- 该方法只会影响指定的数据元元素，不会影响文档中的其他元素
- 已被禁用的元素（`_isdisabled` 为 `true`）不会被处理

#### setElementStyle - 按数据元编码设置数据元内联样式

根据 `data-hm-code` 在文档内查找对应数据元节点并设置 CSS（通过 jQuery 的 `css` 写入），适用于按编码高亮、调整单个字段样式等。不会处理 `data-hm-node="labelbox"` 的节点。

**方法签名：**
```javascript
setElementStyle(eleCode, styles)
```

**参数说明：**

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| eleCode | String | 是 | 数据元编码，与 DOM 上 `data-hm-code` 一致 |
| styles | Object | 是 | 样式对象（普通对象），键名为 CSS 属性名（驼峰或含连字符均可），语义与 jQuery `.css(样式对象)` 一致；与元素已有**内联样式**合并，同名属性覆盖 |

**返回值：** Boolean，至少更新了一个匹配节点为 `true`，未找到节点为 `false`。

**使用示例：**
```javascript
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setElementStyle('DE08.10.013.00.012', { color: 'red', fontWeight: 'bold' });
    })
    .catch(function(error) {
        console.error('获取编辑器实例失败:', error);
    });
```

**使用说明：**
- 仅在带有 `[data-hm-widgetid]` 的病历区域内查找；按 `data-hm-code` 匹配，并排除 labelbox。
- 第二参数必须为**普通对象**，不支持 CSS 字符串。


## 文档修订模式控制功能

文档修订模式控制功能允许开发者动态设置文档的修订模式，用于跟踪和管理文档的修改历史，适用于文档协作、版本控制、审批流程等场景。

### 基本用法

```javascript
// 启用修订模式
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setDocReviseMode(true);
        console.log('修订模式已启用');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 关闭修订模式
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setDocReviseMode(false,true);
        console.log('修订模式已关闭');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### setDocReviseMode - 设置文档修订模式

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| reviseMode | Boolean | 是 | 是否启用修订模式，true表示启用，false表示关闭 |
| retainModify | Boolean | 否 | 是否保留修改，true表示保留，false表示不保留，不用弹框选择了 |
**返回值：** 无

**使用说明：**
- 启用修订模式后，所有修改操作都会被跟踪和标记
- 关闭修订模式时，会弹出确认对话框询问如何处理现有修订内容
- 修订模式状态会保存到编辑器配置中
- 修订模式会影响工具栏中修订相关按钮的可用性

### 修订模式下的功能特性

#### 修改跟踪
- **新增内容**：新增的文本会被标记为 `<ins>` 标签，显示为绿色背景
- **删除内容**：删除的文本会被标记为 `<del>` 标签，显示为删除线
- **修改内容**：修改的文本会同时显示删除和新增标记

#### 用户信息记录
- **修改者标识**：记录每次修改的用户ID和用户名
- **修改时间**：记录每次修改的时间戳
- **修改类型**：区分不同类型的修改操作

#### 修订标记样式
- **新增标记**：`hm_revise_ins` 类，绿色背景显示
- **删除标记**：`hm_revise_del` 类，红色删除线显示 

### 修订内容管理

#### 关闭修订模式时的处理
当关闭修订模式时，系统会弹出确认对话框，提供以下选项：

1. **全部接受修订**：接受所有修订内容，将修订标记转换为正常内容
2. **全部拒绝修订**：拒绝所有修订内容，恢复到修订前的状态
3. **取消操作**：保持修订模式开启状态

#### 修订状态控制
- **显示修订**：`hm-revise-show` 类，显示所有修订标记
- **隐藏修订**：`hm-revise-hide` 类，隐藏修订标记但保留内容

### 工具栏集成

#### 修订模式启用时
- **修订按钮**：修订相关按钮被启用
- **修订命令**：可以执行修订相关命令
- **状态显示**：工具栏显示"显示修订"状态

#### 修订模式关闭时
- **修订按钮**：修订相关按钮被禁用
- **修订命令**：无法执行修订相关命令
- **状态隐藏**：工具栏隐藏修订状态

### 打印支持

#### 修订模式打印
- **修订标记**：打印时可以选择是否显示修订标记
- **黑白打印**：支持黑白打印时的修订标记样式
- **状态保持**：打印后恢复修订模式的原始状态

#### 打印选项
- **显示修订**：打印包含修订标记的完整内容
- **隐藏修订**：打印不包含修订标记的最终内容
- **仅修订**：仅打印修订标记部分

### 常见问题

#### 修订模式无法启用

1. **权限问题**：检查当前用户是否有启用修订模式的权限
2. **编辑器状态**：确认编辑器已正确初始化并处于可编辑状态
3. **配置冲突**：检查是否有其他配置阻止修订模式启用

#### 修订标记不显示

1. **CSS样式问题**：检查修订标记的CSS样式是否正确加载
2. **状态设置**：确认修订模式已正确启用
3. **内容类型**：检查修改的内容是否支持修订标记

#### 关闭修订模式时无响应

1. **对话框阻塞**：检查是否有其他对话框或弹窗阻塞了确认对话框
2. **事件绑定**：确认确认对话框的事件绑定是否正确
3. **浏览器兼容性**：检查浏览器是否支持相关功能

#### 修订内容丢失

1. **操作顺序**：确保在正确的时机进行修订操作
2. **状态同步**：检查修订状态是否正确同步
3. **数据保存**：确认修订内容已正确保存到文档中

### 最佳实践

1. **启用时机**：在开始协作编辑前启用修订模式
2. **用户培训**：为用户提供修订模式的使用培训
3. **状态管理**：建立修订状态的管理机制
4. **内容审核**：定期审核和清理修订内容
5. **权限控制**：根据用户角色控制修订模式的启用权限
6. **性能考虑**：在大量修订内容时注意性能影响
7. **备份策略**：在重要操作前备份文档内容
8. **打印设置**：根据需求合理设置打印时的修订显示选项


## 文档修订记录获取功能

文档修订记录获取功能允许开发者获取文档的修订历史记录。

### 基本用法

```javascript
// 获取指定文档的修订记录
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docCode = 'DOC001';  // 文档唯一编号
        
        var revisionHistory = editorInstance.getDocRevisionHistory(docCode);
        console.log('修订记录:', revisionHistory);
        
        // 处理修订记录
        revisionHistory.forEach(function(revision) {
            console.log('修改者:', revision.modifier);
            console.log('修改时间:', revision.modifyTime);
            console.log('修改类型:', revision.modifyType);
            console.log('修改内容:', revision.content);
        });
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 获取所有文档的修订记录
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var allRevisionHistory = editorInstance.getDocRevisionHistory();
        console.log('所有修订记录:', allRevisionHistory);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### getDocRevisionHistory - 获取文档修订记录

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 否 | 文档唯一编号，为空时获取所有文档的修订记录 |

**返回值：** Array

**返回值结构：**
```javascript
[
    {
        traceId: 'TRACE001',           // 修订记录ID
        modifier: '张医生',             // 修改者姓名
        modifyTime: '2023-12-01 10:30:00', // 修改时间
        modifyType: '新增',             // 修改类型：新增/删除
        content: '修改的内容',          // 修改的具体内容
        docCode: 'DOC001',             // 文档编码
        eleCode: 'ELE001',             // 数据元编码
        eleName: '患者姓名'            // 数据元名称
    },
    {
        traceId: 'TRACE002',
        modifier: '李医生',
        modifyTime: '2023-12-01 09:15:00',
        modifyType: '删除',
        content: '删除的内容',
        docCode: 'DOC001',
        eleCode: 'ELE002',
        eleName: '诊断信息'
    }
]
```

**使用说明：**
- 当 `code` 参数为空时，会获取所有文档的修订记录
- 当 `code` 参数指定具体文档编号时，只获取该文档的修订记录
- 修订记录按修改时间倒序排列（最新的在前）
- 只返回有实际文本内容的修订记录，空内容会被过滤

### 修订记录字段说明

#### 基本信息字段
- **traceId**：修订记录的唯一标识符，用于追踪特定修订
- **modifier**：修改者的显示名称，来自修订标记的 `hm-modify-userName` 属性
- **modifyTime**：修改时间，来自修订标记的 `hm-modify-time` 属性
- **modifyType**：修改类型，值为"新增"或"删除"

#### 内容字段
- **content**：修订的具体文本内容，不包含HTML标签
- **docCode**：修订内容所属的文档编码
- **eleCode**：修订内容所属的数据元编码
- **eleName**：修订内容所属的数据元名称

### 修订类型说明

#### 新增修订
- **标记类型**：`hm_revise_ins` 类的元素
- **修改类型**：`modifyType` 为 "新增"
- **内容说明**：表示在文档中新增的内容
- **显示样式**：通常显示为绿色背景

#### 删除修订
- **标记类型**：`hm_revise_del` 类的元素
- **修改类型**：`modifyType` 为 "删除"
- **内容说明**：表示从文档中删除的内容
- **显示样式**：通常显示为删除线

### 数据元关联

#### 数据元信息获取
- **eleCode**：通过向上查找带有 `data-hm-code` 属性的父元素获取
- **eleName**：通过向上查找带有 `data-hm-name` 属性的父元素获取
- **关联范围**：从修订元素开始向上查找，直到找到包含数据元信息的父元素

#### 数据元层级
- **直接关联**：修订内容直接属于某个数据元
- **间接关联**：修订内容属于数据元的子元素
- **容器关联**：修订内容属于包含数据元的容器元素

### 常见问题

#### 获取不到修订记录

1. **文档编码错误**：检查传入的 `code` 参数是否正确
2. **修订模式未启用**：确认文档是否在修订模式下进行过修改
3. **修订内容为空**：检查修订标记是否包含有效的文本内容
4. **文档未加载**：确保目标文档已经正确加载到编辑器中

#### 修订记录不完整

1. **过滤规则**：系统会过滤掉空的修订内容，确保记录的有效性
2. **时间范围**：检查是否在指定的时间范围内进行过修改
3. **用户权限**：确认当前用户是否有权限查看修订记录
4. **数据元关联**：检查修订内容是否正确关联到数据元

#### 修订记录格式异常

1. **属性缺失**：检查修订标记是否包含必要的属性信息
2. **时间格式**：确认修改时间的格式是否正确
3. **用户信息**：检查修改者信息是否正确设置
4. **内容编码**：确认修订内容的编码格式是否正确

### 最佳实践

1. **定期获取**：定期获取修订记录，及时了解文档修改情况
2. **权限控制**：根据用户权限控制修订记录的访问范围
3. **数据备份**：重要修订记录建议进行数据备份
4. **性能优化**：大量修订记录时考虑分页或限制数量
5. **错误处理**：获取修订记录时进行适当的错误处理
6. **数据验证**：对获取的修订记录进行数据有效性验证
7. **日志记录**：记录修订记录的获取操作，便于审计追踪
8. **缓存策略**：对于频繁访问的修订记录考虑缓存策略


## 文档水印设置功能

文档水印设置功能允许开发者为文档添加水印，用于防伪标识、版权声明、用户信息等场景。

### 基本用法

```javascript
// 设置文字水印
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var watermarkSettings = {
            watermarkType: 1,                    // 水印类型：1-文字水印，2-图片水印
            watermarkText: '机密文档',             // 水印文字内容
            watermarkFontColor: '#FF0000',        // 水印字体颜色
            watermarkFontSize: 16,                // 水印字体大小（px）
            watermarkAlpha: 0.3,                  // 水印透明度（0-1）
            watermarkAngle: 15,                   // 水印倾斜度数
            watermarkHeight: 60,                  // 水印高度（px）
            watermarkColumn: 3                    // 水印列数
        };
        
        editorInstance.setDocWatermark(watermarkSettings);
        console.log('文字水印设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 设置图片水印
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var watermarkSettings = {
            watermarkType: 2,                    // 水印类型：2-图片水印
            watermarkImg: '/path/to/watermark.png', // 水印图片路径
            watermarkAlpha: 0.2,                // 水印透明度
            watermarkAngle: 0,                   // 水印倾斜度数
            watermarkHeight: 80,                 // 水印高度
            watermarkColumn: 2                   // 水印列数
        };
        
        editorInstance.setDocWatermark(watermarkSettings);
        console.log('图片水印设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### setDocWatermark - 设置文档水印

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| settings | Object | 是 | 水印设置对象 |
| settings.watermarkType | Number | 是 | 水印类型：1-文字水印，2-图片水印 |
| settings.watermarkText | String | 否 | 水印文字内容（文字水印时必填） |
| settings.watermarkImg | String | 否 | 水印图片路径（图片水印时必填） |
| settings.watermarkFontColor | String | 否 | 水印字体颜色，默认黑色 |
| settings.watermarkFontSize | Number | 否 | 水印字体大小（px），默认12 |
| settings.watermarkAlpha | Number | 否 | 水印透明度（0-1），默认0.3 |
| settings.watermarkAngle | Number | 否 | 水印倾斜度数，默认15 |
| settings.watermarkHeight | Number | 否 | 水印高度（px），默认50 |
| settings.watermarkColumn | Number | 否 | 水印列数，默认3 |

**返回值：** 无

**使用说明：**
- 水印设置会保存到编辑器配置中，并在文档中立即生效
- 支持分页和非分页两种模式的水印显示
- 水印不会影响文档的编辑和交互功能
- 水印会自动适应不同的纸张尺寸

### 水印类型说明

#### 文字水印
- **类型值**：`watermarkType: 1`
- **必填参数**：`watermarkText`（水印文字内容）
- **可选参数**：字体颜色、字体大小、透明度、倾斜角度等
- **适用场景**：版权声明、用户信息、文档状态标识

#### 图片水印
- **类型值**：`watermarkType: 2`
- **必填参数**：`watermarkImg`（水印图片路径）
- **可选参数**：透明度、倾斜角度、高度、列数等
- **适用场景**：公司Logo、防伪标识、品牌标识

### 水印样式配置

#### 字体样式
- **字体颜色**：支持十六进制颜色值（如：#FF0000）
- **字体大小**：数值类型，单位为像素
- **透明度**：0-1之间的数值，0为完全透明，1为完全不透明

#### 布局样式
- **倾斜角度**：支持0-360度的旋转角度
- **水印高度**：控制单个水印元素的高度
- **水印列数**：控制水印在水平方向的分布数量

#### 自动布局
- **行数计算**：根据文档高度和水印高度自动计算行数
- **列数分布**：根据文档宽度和列数设置自动分布
- **位置调整**：水印会自动居中显示

### 常见问题

#### 水印不显示

1. **参数设置错误**：检查 `watermarkType` 和对应的必填参数是否正确
2. **图片路径错误**：确认图片水印的路径是否正确且可访问
3. **透明度设置**：检查透明度是否设置过低导致水印不可见
4. **文档状态**：确认文档已正确加载并处于可显示状态

#### 水印显示异常

1. **字体大小**：检查字体大小是否设置合理
2. **倾斜角度**：确认倾斜角度设置是否在有效范围内
3. **列数设置**：检查列数设置是否与文档宽度匹配
4. **高度设置**：确认水印高度设置是否合理

#### 水印影响编辑

1. **交互设置**：水印已设置 `pointer-events: none`，不应影响编辑
2. **层级问题**：检查是否有其他元素覆盖了水印设置
3. **浏览器兼容性**：确认浏览器是否支持相关CSS属性

### 最佳实践

1. **参数验证**：设置水印前验证所有参数的有效性
2. **性能考虑**：避免设置过多列数导致性能问题
3. **用户体验**：合理设置透明度，确保不影响文档阅读
4. **兼容性测试**：在不同浏览器中测试水印显示效果
5. **图片优化**：使用适当大小的图片水印，避免影响加载速度
6. **动态调整**：根据文档内容动态调整水印参数
7. **错误处理**：设置水印时进行适当的错误处理
8. **用户反馈**：为用户提供水印预览和调整功能


## 文档内容获取功能

文档内容获取功能提供了多种方式获取文档内容，包括完整内容、HTML文本和纯文本，适用于文档导出、内容分析、数据提取等场景。

### 基本用法

```javascript
// 获取文档完整内容（包含HTML、文本和数据元）
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docCode = 'DOC001';  // 文档唯一编号，为空时获取所有文档
        
        var docContent = editorInstance.getDocContent(docCode);
        console.log('文档完整内容:', docContent);
        
        // 处理文档内容
        docContent.forEach(function(doc) {
            console.log('文档编号:', doc.code);
            console.log('HTML内容:', doc.html);
            console.log('纯文本内容:', doc.text);
            console.log('数据元数据:', doc.data);
        });
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 获取文档HTML文本
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docHtml = editorInstance.getDocHtml('DOC001');
        console.log('文档HTML内容:', docHtml);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 获取文档纯文本
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var docText = editorInstance.getDocText('DOC001');
        console.log('文档纯文本内容:', docText);
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### getDocContent - 获取文档完整内容

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 否 | 文档唯一编号，为空时获取所有文档内容 |

**返回值：** Array

**返回值结构：**
```javascript
[
    {
        code: 'DOC001',                    // 文档唯一编号
        data: [                            // 数据元数据
            {
                keyCode: 'PATIENT_NAME',   // 数据元编码
                keyValue: '张三',           // 数据元内容
                keyId: '001',              // 数据元ID
                keyName: '患者姓名'         // 数据元名称
            }
        ],
        html: '<p>文档HTML内容</p>',        // 文档HTML文本
        text: '文档纯文本内容'              // 文档纯文本
    }
]
```

#### getDocHtml - 获取文档HTML文本

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 否 | 文档唯一编号，为空时获取当前文档HTML文本 |

**返回值：** Array

**返回值结构：**
```javascript
[
    {
        code: 'DOC001',                    // 文档唯一编号
        html: '<p>文档HTML内容</p>'         // 文档HTML文本
    }
]
```

#### getDocText - 获取文档纯文本

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| code | String | 否 | 文档唯一编号，为空时获取当前文档纯文本 |

**返回值：** Array

**返回值结构：**
```javascript
[
    {
        code: 'DOC001',                    // 文档唯一编号
        text: '文档纯文本内容'              // 文档纯文本
    }
]
```

### 功能特点

#### getDocContent 功能特点
- **完整内容**：同时获取HTML、纯文本和数据元数据
- **多文档支持**：可以获取指定文档或所有文档的完整内容
- **结构化数据**：返回结构化的文档内容，便于后续处理
- **数据元信息**：包含完整的数据元编码、内容、ID和名称

#### getDocHtml 功能特点
- **HTML格式**：获取文档的完整HTML格式内容
- **样式保留**：保留文档的格式和样式信息
- **标签完整**：包含所有HTML标签和属性
- **导出友好**：适合用于文档导出和格式转换

#### getDocText 功能特点
- **纯文本**：获取文档的纯文本内容，去除所有HTML标签
- **内容提取**：提取文档中的实际文本内容
- **搜索友好**：适合用于文本搜索和内容分析
- **轻量级**：文本内容体积小，处理速度快

### 使用场景

#### getDocContent 使用场景
1. **文档导出**：导出包含完整信息的文档内容
2. **数据备份**：备份文档的所有数据（HTML、文本、数据元）
3. **内容分析**：分析文档的完整结构和内容
4. **系统集成**：与其他系统进行数据交换

#### getDocHtml 使用场景
1. **格式保持**：需要保持文档格式的场景
2. **网页显示**：在网页中显示文档内容
3. **打印输出**：用于打印或PDF生成
4. **格式转换**：转换为其他格式文档

#### getDocText 使用场景
1. **文本搜索**：在文档中进行文本搜索
2. **内容统计**：统计文档的字数、段落数等
3. **数据分析**：对文档内容进行文本分析
4. **轻量级处理**：不需要格式信息的场景

### 数据元数据处理

#### 数据元结构说明
- **keyCode**：数据元的唯一编码标识
- **keyValue**：数据元的具体内容值
- **keyId**：数据元的唯一ID标识
- **keyName**：数据元的显示名称

#### 数据元类型支持
- **文本类型**：普通文本数据元
- **选择类型**：下拉框、单选框、复选框等选择类数据元
- **复合类型**：包含多个子项的数据元
- **数组类型**：多选数据元返回数组格式

### 常见问题

#### 获取不到文档内容

1. **文档编号错误**：检查传入的 `code` 参数是否正确
2. **文档未加载**：确保目标文档已经正确加载到编辑器中
3. **权限问题**：确认当前用户有权限访问文档内容
4. **编辑器状态**：确认编辑器已正确初始化

#### 返回内容为空

1. **文档为空**：检查文档是否包含实际内容
2. **参数设置**：确认参数设置是否正确
3. **过滤规则**：检查是否有内容过滤规则影响结果
4. **数据格式**：确认文档数据格式是否正确

#### HTML内容格式异常

1. **编码问题**：检查文档的字符编码设置
2. **标签处理**：确认HTML标签的处理是否正确
3. **样式丢失**：检查CSS样式是否被正确保留
4. **特殊字符**：处理特殊字符的转义问题

### 最佳实践

1. **参数验证**：获取内容前验证参数的有效性
2. **错误处理**：对获取操作进行适当的错误处理
3. **性能考虑**：大量文档时考虑分批获取
4. **内容过滤**：根据需要过滤敏感或无用内容
5. **格式处理**：根据使用场景选择合适的获取方法
6. **缓存策略**：对频繁获取的内容考虑缓存
7. **数据验证**：对获取的内容进行有效性验证
8. **安全考虑**：注意内容获取的安全性和隐私保护


## 文档数据元设置功能

文档数据元设置功能允许开发者设置文档中的数据元内容，包括普通数据元和列表类表格数据，适用于数据初始化、内容更新、批量设置等场景。

### 基本用法

```javascript
// 设置普通数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var dataList = [
            {
                code: 'DOC001',                    // 文档唯一编号
                data: [                            // 数据元数据
                    {
                        keyCode: 'PATIENT_NAME',   // 数据元编码
                        keyName: '患者姓名',        // 数据元名称
                        keyValue: '张三'           // 数据元内容
                    },
                    {
                        keyCode: 'DIAGNOSIS',      // 数据元编码
                        keyName: '诊断信息',        // 数据元名称
                        keyValue: ['感冒', '发热']  // 多值数据元使用数组
                    }
                ]
            }
        ];
        
        editorInstance.setDocData(dataList);
        console.log('数据元设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 设置列表类表格数据
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var tableDataList = [{
            "code": "md2j4of7k3",
            "data": [
            {
                "keyCode": "TABLE_表单名称",
                "keyId": "e82d6aeca9c0139d9f4098f1d61c2f511",
                "keyName": "表单名称",
                "keyValue": [
                [
                    {
                    "keyCode": "DE09.00.053.00",
                    "keyId": "cbcffcf9783b9975362c375bbe406f31",
                    "keyName": "记录日期时间",
                    "keyValue": "2025-10-23 09:38"
                    },
                    {
                    "keyCode": "DE04.10.186.00",
                    "keyId": "ef0a19662136ab1dd9485b9dfbce7617",
                    "keyName": "体温",
                    "keyValue": "36.7"
                    },
                    {
                    "keyCode": "DE04.10.265.00",
                    "keyId": "e2cd4a15bcf63d6d0637e97c2566979e",
                    "keyName": "宫口情况",
                    "keyValue": "良好"
                    },
                    {
                    "keyCode": "DE06.00.183.00",
                    "keyId": "cb3eee8d59d4cb2fca162dfe887efb16",
                    "keyName": "病情概括及主要抢救措施",
                    "keyValue": ""
                    },
                    {
                    "keyCode": "DE02.01.039.00.178",
                    "keyId": "deb6c0d14dda22724eb3456f9a5cf5b6",
                    "keyName": "医师签名",
                    "keyValue": ""
                    }
                ]
                ]
            }]
        }];
        
        editorInstance.setDocData(tableDataList);
        console.log('列表类表格数据设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### setDocData - 设置文档数据元数据

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| dataList | Array\|Object | 是 | 数据列表或单个数据对象 |

**返回值：** 无

**使用说明：**
- 支持传入单个对象或对象数组
- 如果传入单个对象，系统会自动包装成数组
- 数据元设置会立即在文档中生效
- 支持普通数据元和列表类表格数据两种类型

### 数据结构说明

#### 普通数据元结构

```javascript
{
    code: 'DOC001',                    // 文档唯一编号（必填）
    data: [                            // 数据元数据（必填）
        {
            keyCode: 'PATIENT_NAME',   // 数据元编码（必填）
            keyName: '患者姓名',        // 数据元名称（可选）
            keyValue: '张三'           // 数据元内容（必填）
        }
    ]
}
```

#### 表单数据结构

```javascript
[
  {
    "code": "md2j4of7k3",
    "data": [
      {
        "keyCode": "TABLE_表单名称",
        "keyId": "e82d6aeca9c0139d9f4098f1d61c2f511",
        "keyName": "表单名称",
        "keyValue": [
          [
            {
              "keyCode": "DE09.00.053.00",
              "keyId": "cbcffcf9783b9975362c375bbe406f31",
              "keyName": "记录日期时间",
              "keyValue": "2025-10-23 09:38"
            },
            {
              "keyCode": "DE04.10.186.00",
              "keyId": "ef0a19662136ab1dd9485b9dfbce7617",
              "keyName": "体温",
              "keyValue": "36.7"
            },
            {
              "keyCode": "DE04.10.265.00",
              "keyId": "e2cd4a15bcf63d6d0637e97c2566979e",
              "keyName": "宫口情况",
              "keyValue": "良好"
            },
            {
              "keyCode": "DE06.00.183.00",
              "keyId": "cb3eee8d59d4cb2fca162dfe887efb16",
              "keyName": "病情概括及主要抢救措施",
              "keyValue": ""
            },
            {
              "keyCode": "DE02.01.039.00.178",
              "keyId": "deb6c0d14dda22724eb3456f9a5cf5b6",
              "keyName": "医师签名",
              "keyValue": ""
            }
          ]
        ]
      }
    ]
  }
]
```

### 数据元类型支持

#### 文本类型数据元
- **单值文本**：`keyValue: '文本内容'`
- **多值文本**：`keyValue: ['值1', '值2', '值3']`
- **空值处理**：`keyValue: ''` 或 `keyValue: null`

#### 选择类型数据元
- **单选**：`keyValue: {code:'',value:''}`
- **多选**：`keyValue: {code:['01','02','03','04'],value:['汉族','蒙古族','回族','藏族']}`
- **下拉框**：keyValue: {code:'',value:''}

#### 日期时间类型数据元
- **日期格式**：`keyValue: '2023-12-01'`
- **时间格式**：`keyValue: '08:00'`
- **日期时间格式**：`keyValue: '2023-12-01 08:00'`

### 表单特殊功能

#### 动态行管理
- **自动扩展**：系统会根据数据量自动扩展表格行数
- **行数检测**：自动检测现有表格行数，不足时自动添加
- **行复制**：通过复制最后一行来扩展表格

#### 精确绑定
- **位置绑定**：每行数据精确绑定到对应的表格行位置
- **顺序渲染**：按照传入数组的顺序进行数据渲染
- **ID匹配**：通过 `keyId` 进行精确的数据元匹配

#### 表单标识
- **表格标识**：表单必须包含列表类表格 `data-hm-table-type="list"` 属性
- **类型检测**：系统自动检测表单表格类型
- **特殊处理**：表单享受特殊的数据处理逻辑

### 使用场景

#### 数据初始化
1. **文档加载**：在文档加载时设置初始数据
2. **模板填充**：使用模板数据填充文档
3. **默认值设置**：为文档设置默认的数据元值

#### 内容更新
1. **实时更新**：根据用户操作实时更新数据元
2. **批量更新**：批量更新多个数据元的值
3. **条件更新**：根据条件动态更新特定数据元

#### 列表类表格管理
1. **列表类表格**：管理记录列表类表格数据
2. **时间序列**：按时间顺序管理数据记录
3. **数据统计**：统计和分析数据

### 常见问题

#### 数据元设置不生效

1. **数据元编码错误**：检查 `keyCode` 是否与模板中的数据元编码一致
2. **文档未加载**：确保目标文档已经正确加载
3. **权限问题**：确认当前用户有权限修改文档数据
4. **格式错误**：检查数据格式是否符合要求

#### 列表类表格数据异常

1. **表格标识缺失**：确认表格包含 `data-hm-table-type="list"` 属性
2. **数据结构错误**：检查数组结构是否正确
3. **行数不足**：确认表格有足够的行数容纳表格数据
4. **ID匹配问题**：检查 `keyId` 是否与表格中的数据元ID匹配

#### 多值数据元处理

1. **数组格式**：多值数据元必须使用数组格式
2. **空值处理**：空数组 `[]` 表示清空多值数据元
3. **类型一致**：数组中的所有值类型应保持一致
4. **顺序保持**：数组顺序会影响多值数据元的显示顺序

### 最佳实践

1. **数据验证**：设置数据前验证数据格式和内容
2. **批量操作**：尽量使用批量设置减少API调用次数
3. **错误处理**：对数据设置操作进行适当的错误处理
4. **性能优化**：大量数据时考虑分批设置
5. **数据备份**：重要数据设置前进行备份
6. **用户反馈**：为用户提供数据设置的反馈信息
7. **权限控制**：根据用户权限控制数据设置范围
8. **数据同步**：确保数据设置与业务逻辑保持同步


## 数据元插入功能

数据元插入功能允许开发者通过API方式在编辑器当前光标位置插入数据元元素，支持多种数据元类型，适用于动态构建文档。

### 基本用法

```javascript
// 插入纯文本数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '患者姓名',           // 数据元名称
            code: 'DE02.01.039.00',    // 数据元编码
            nodeName: '纯文本',         // 节点类型
            autoLable: true            // 是否自动添加数据元标题
        };
        
        editorInstance.insertDataSource(datasource);
        console.log('数据元插入成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 插入时间数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '记录时间',
            code: 'DE09.00.053.00',
            nodeName: '时间',
            autoLable: true
        };
        
        editorInstance.insertDataSource(datasource);
    });

// 插入下拉（单选）数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '民族',
            code: 'DE02.01.015.00',
            nodeName: '下拉',
            autoLable: true,
            dictList: [
                { code: '01', val: '汉族' },
                { code: '02', val: '蒙古族' },
                { code: '03', val: '回族' }
            ]
        };
        
        editorInstance.insertDataSource(datasource);
    });

// 插入下拉多选数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '过敏药物',
            code: 'DE04.01.100.00',
            nodeName: '下拉多选',
            autoLable: true,
            dictList: [
                { code: '1', val: '青霉素' },
                { code: '2', val: '头孢类' },
                { code: '3', val: '磺胺类' }
            ]
        };
        
        editorInstance.insertDataSource(datasource);
    });

// 插入单选（radiobox）数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '性别',
            code: 'DE02.01.040.00',
            nodeName: '单选',
            autoLable: true,
            dictList: [
                { code: '1', val: '男' },
                { code: '2', val: '女' }
            ]
        };
        
        editorInstance.insertDataSource(datasource);
    });

// 插入多选（checkbox）数据元
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '症状',
            code: 'DE04.01.117.00',
            nodeName: '多选',
            autoLable: true,
            dictList: [
                { code: '1', val: '发热' },
                { code: '2', val: '咳嗽' },
                { code: '3', val: '头痛' },
                { code: '4', val: '乏力' }
            ]
        };
        
        editorInstance.insertDataSource(datasource);
    });

// 使用 items 字符串格式插入单选/多选
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var datasource = {
            name: '血型',
            code: 'DE04.50.001.00',
            nodeName: '单选',
            items: 'A型#B型#O型#AB型',  // 选项用#分隔
            autoLable: true
        };
        
        editorInstance.insertDataSource(datasource);
    });
```

### 方法参数说明

#### insertDataSource - 插入数据元

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| datasource | Object | 是 | 数据元配置对象 |

**返回值：** 无

**datasource 对象属性说明：**

| 属性名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| name | String | 是 | 数据元名称，将作为 `data-hm-name` 属性存储 |
| code | String | 是 | 数据元编码，将作为 `data-hm-code` 属性存储 |
| nodeName | String | 否 | 节点类型名称，可选值见下表 |
| autoLable | Boolean | 否 | 是否自动添加数据元标题，默认 false |
| dictList | Array | 否 | 选项列表，用于下拉、单选、多选类型 |
| dictList[].code | String | 否 | 选项编码 |
| dictList[].val | String | 否 | 选项显示值 |
| items | String | 否 | 选项字符串，多个选项用 `#` 分隔，用于单选、多选类型 |
| selectMode | String | 否 | 选择模式，用于自动推断类型，可选值：单选/radio、多选/checkbox、下拉多选/dropdownMultiple |

**使用说明：**
- 数据元将插入到编辑器当前光标位置
- `nodeName` 和 `nodeType` 二选一，`nodeType` 优先级更高
- 选项数据支持两种格式：`dictList` 数组或 `items` 字符串

### 节点类型说明

#### 通过 nodeName 指定（推荐）

| nodeName 值 | 对应 nodeType | 描述 | 显示形式 |
| --- | --- | --- | --- |
| 时间 | timebox | 时间选择器，默认日期格式 | 日期选择框 |
| 纯文本 | newtextbox | 普通文本输入框 | 文本框 |
| 数字文本 | newtextbox | 数字输入框，带数字格式验证 | 数字文本框 |
| 下拉 | newtextbox | 下拉单选，点击弹出下拉框 | 下拉选择框 |
| 下拉多选 | newtextbox | 下拉多选，点击弹出下拉框可多选 | 下拉多选框 |
| 单选 | radiobox | 单选框，显示圆形图标 | ○ 选项1 ○ 选项2 |
| 多选 | checkbox | 多选框，显示方形勾选框 | □ 选项1 □ 选项2 |
| 搜索 | searchbox | 搜索框，支持模糊搜索 | 搜索输入框 |
| 单元 | cellbox | 单元格框 | 单元格 |

#### 选择类型对比

| 类型 | nodeName | 显示形式 | 选择方式 | 适用场景 |
| --- | --- | --- | --- | --- |
| 单选框 | 单选 | 圆形图标排列 | 点击图标选择 | 选项少，需直观展示 |
| 多选框 | 多选 | 方形图标排列 | 点击图标选择 | 选项少，需直观展示 |
| 下拉单选 | 下拉 | 文本框+下拉箭头 | 点击弹出下拉框单选 | 选项多，节省空间 |
| 下拉多选 | 下拉多选 | 文本框+下拉箭头 | 点击弹出下拉框多选 | 选项多，节省空间 |

### 使用场景

#### 动态文档构建
1. **模板生成**：根据业务需求动态生成文档模板
2. **批量插入**：批量向文档中插入多个数据元
3. **条件插入**：根据条件动态插入不同类型的数据元

#### 交互式编辑
1. **用户选择**：用户从数据元列表中选择后插入
2. **拖放插入**：配合拖放功能实现数据元插入
3. **快捷操作**：通过快捷键或工具栏按钮快速插入

### 常见问题

#### 数据元插入失败

1. **光标位置**：确保编辑器已聚焦且光标位于有效位置
2. **参数格式**：检查 datasource 对象的属性是否正确
3. **编辑器状态**：确保编辑器不处于只读模式

#### 选项不显示

1. **dictList 格式**：确保 dictList 数组中每项包含 code 和 val 属性
2. **items 格式**：确保 items 字符串中选项用 `#` 正确分隔
3. **nodeName 设置**：确保 nodeName 设置正确（下拉/下拉多选/单选/多选）

#### 单选多选显示异常

1. **选项为空**：检查 dictList 或 items 是否有数据
2. **类型混淆**：注意区分"下拉"（弹出框）和"单选"（图标），"下拉多选"（弹出框）和"多选"（图标）

### 最佳实践

1. **参数验证**：插入前验证 datasource 参数的完整性
2. **类型选择**：选项少于5个时优先使用单选/多选（图标形式），选项多时使用下拉/下拉多选
3. **标题控制**：合理使用 autoLable 控制标题显示
4. **错误处理**：对插入操作进行适当的错误处理
5. **用户反馈**：为用户提供插入成功或失败的反馈信息
6. **选项格式**：优先使用 dictList 格式，便于存储选项编码


## 脚本设置功能

脚本设置功能允许开发者在文档模板中配置事件处理函数，用于监听文档加载、元素变化、元素点击等事件，实现自定义的业务逻辑处理。

### 事件方法说明

#### onDocumentLoad - 文档加载事件

**功能说明：**
- 文档加载完成时自动触发
- 适用于文档初始化、数据预加载等场景

**方法签名：**
```javascript
function onDocumentLoad() {
    // 在这里添加文档加载完成时需要执行的代码
}
```

**使用示例：**
```javascript
function onDocumentLoad() {
    console.log('文档已加载');
    // 执行初始化操作
}
```

#### onElementChange - 元素变化事件

**功能说明：**
- 当文档中的数据元元素内容发生变化时触发
- 适用于实时数据校验、联动更新等场景

**方法签名：**
```javascript
function onElementChange(element) {
    // 在这里添加元素变化时需要执行的代码
}
```

**参数说明：**
- `element`: DOM元素对象，表示发生变化的元素节点

**使用示例：**
```javascript
function onElementChange(element) {
    console.log('元素发生变化:', element);
    // 执行数据校验或联动更新
}
```

#### onElementClick - 元素点击事件

**功能说明：**
- 当用户单击文档中的数据元元素时触发
- 使用延迟机制（300ms）避免与双击事件冲突
- 适用于元素点击交互、弹窗显示等场景

**方法签名：**
```javascript
function onElementClick(element) {
    // 在这里添加元素点击时需要执行的代码
}
```

**参数说明：**
- `element`: DOM元素对象，表示被点击的元素节点

**使用示例：**
```javascript
function onElementClick(element) {
    console.log('元素被点击:', element);
    // 执行点击交互逻辑
}
```

#### onElementDbclick - 元素双击事件

**功能说明：**
- 当用户双击文档中的数据元元素时触发
- 双击时会自动取消对应的单击事件
- 适用于快速编辑、详情查看等场景

**方法签名：**
```javascript
function onElementDbclick(element) {
    // 在这里添加元素双击时需要执行的代码
}
```

**参数说明：**
- `element`: DOM元素对象，表示被双击的元素节点

**使用示例：**
```javascript
function onElementDbclick(element) {
    console.log('元素被双击:', element);
    // 执行双击交互逻辑
}
```

### 配置方式

这些事件方法需要在文档模板的脚本配置中进行设置，通过文档设计器的"脚本配置"功能进行配置和管理。

### 注意事项

1. **方法定义**：确保方法名称与事件名称完全一致
2. **错误处理**：建议在方法内部添加错误处理逻辑，避免脚本错误影响编辑器使用
3. **性能考虑**：避免在事件处理方法中执行耗时操作
4. **元素参数**：element参数为DOM元素对象，可通过jQuery包装后使用：`$(element)`


#### focusElement - 定位到病历或元素

该方法用于定位到指定的病历或元素位置，支持滚动定位、光标定位和高亮效果。

**方法签名：**
```javascript
focusElement(docCode, eleCode, eleContent)
```

**参数说明：**

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| docCode | String | 是 | 病历ID，用于定位目标病历 |
| eleCode | String | 否 | 元素ID（data-hm-code 或 data-hm-name），用于定位病历中的具体元素 |
| eleContent | String | 否 | 元素内容，用于在元素内容中定位到指定文本位置 |

**返回值：** Boolean - 是否成功定位

**使用示例：**
```javascript
// 示例1：只定位到病历
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.focusElement('DOC001');
        console.log('已定位到病历');
    });

// 示例2：定位到病历中的元素
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.focusElement('DOC001', 'ELEMENT001');
        console.log('已定位到元素');
    });

// 示例3：定位到元素内容中的指定文本
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.focusElement('DOC001', 'ELEMENT001', '睡眠障碍');
        console.log('已定位到指定文本');
    });
```

**使用说明：**
- **情况1**：只传 `docCode`，滚动条定位到病历位置，并添加高亮效果
- **情况2**：传 `docCode` + `eleCode`，滚动条定位到元素位置，如果是文本元素（newtextbox）则光标定位到元素内容的开头，并添加高亮效果
- **情况3**：传 `docCode` + `eleCode` + `eleContent`，光标定位到元素内容中指定文本的开头位置，并添加高亮效果
- 高亮效果会在 3 秒后自动消失
- 元素查找优先通过 `data-hm-code` 属性，如果找不到则通过 `data-hm-name` 属性查找
- 对于文本元素（newtextbox），会自动定位到内部的 `.new-textbox-content` 子元素

**常见问题：**

1. **定位失败返回 false**：检查 `docCode` 是否正确，确保目标病历已加载到编辑器中
2. **元素找不到**：检查 `eleCode` 是否正确，确保元素的 `data-hm-code` 或 `data-hm-name` 属性值匹配
3. **光标不显示**：确保目标元素是可编辑的文本元素（newtextbox 类型）
4. **文本定位失败**：如果指定的 `eleContent` 在元素中找不到，会自动定位到元素开头

**最佳实践：**

1. **文档加载后调用**：确保在文档完全加载后再调用定位方法
2. **错误处理**：检查返回值判断是否定位成功
3. **用户体验**：配合高亮效果帮助用户快速找到目标位置
4. **精确定位**：需要精确定位时，使用 `eleContent` 参数指定目标文本

#### insertHtml - 插入HTML内容

该方法用于插入HTML内容，支持在光标处插入或在指定元素后插入。

**方法签名：**
```javascript
insertHtml(htmlContent, posTag)
```

**参数说明：**

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| htmlContent | String | 是 | 要插入的HTML内容 |
| posTag | String | 否 | 定位标记，如果提供，将通过 data-hm-code=posTag 或 data-hm-name=posTag 查找元素，在元素后插入HTML，完成后光标定位到插入HTML之前 |

**返回值：** Boolean - 是否成功插入

**使用示例：**
```javascript
// 示例1：在光标处插入HTML
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.insertHtml('<p>这是一段HTML内容</p>');
        console.log('HTML插入成功');
    });

// 示例2：在指定元素后插入HTML
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.insertHtml('<p>插入的内容</p>', 'ELEMENT_CODE_001');
        console.log('HTML插入成功');
    });

// 示例3：插入带样式的HTML
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.insertHtml('<div style="color: red;">红色文字</div>');
    });

// 示例4：插入复杂HTML结构
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.insertHtml('<ul><li>项目1</li><li>项目2</li></ul>');
    });
```

**功能说明：**

1. **在光标处插入**：当不提供 `posTag` 参数时，HTML内容会插入到当前光标位置
   - 如果光标在数据元内部，HTML会自动转换为纯文本插入，以保持数据元的完整性
   - 如果光标在数据元外部，正常插入HTML内容

2. **在指定元素后插入**：当提供 `posTag` 参数时，会查找对应的元素并在元素后插入HTML
   - 首先通过 `data-hm-code=posTag` 查找元素
   - 如果未找到，则通过 `data-hm-name=posTag` 查找元素
   - 插入完成后，光标会定位到插入HTML之前（即元素后）

**注意事项：**

- 如果光标在数据元（如 `newtextbox`、`timebox` 等）内部，HTML内容会自动转换为纯文本插入，以保持数据元的完整性
- 如果未找到指定的定位元素（`posTag`），方法会返回 `false` 并在控制台输出警告信息
- 插入HTML后会自动触发 `togglePlaceHolder` 事件，确保占位符状态正确更新

**常见问题：**

1. **插入失败返回 false**：检查 `htmlContent` 是否为空，或 `posTag` 对应的元素是否存在
2. **HTML被转换为文本**：这是因为光标在数据元内部，这是正常行为，用于保护数据元结构
3. **元素找不到**：检查 `posTag` 是否正确，确保元素的 `data-hm-code` 或 `data-hm-name` 属性值匹配
4. **光标位置不正确**：使用 `posTag` 时，插入后光标会定位到插入HTML之前，这是预期行为

**最佳实践：**

1. **参数验证**：插入前验证 `htmlContent` 参数的有效性
2. **错误处理**：检查返回值判断是否插入成功
3. **数据元保护**：理解数据元内部自动转换文本的机制，这是为了保护数据元结构
4. **元素定位**：使用 `posTag` 时，确保目标元素已正确加载到编辑器中


## 表格控制权限功能

表格控制权限功能允许开发者对列表类表格的行进行权限控制，包括设置行的只读状态、删除权限和新增权限，适用于流程审批、权限管控、数据保护等场景。

### 功能特点

- **灵活的行索引支持**：支持单个行索引、数组、区间字符串等多种格式
- **多种权限类型**：支持只读、删除、新增三种权限控制
- **表格类型兼容**：支持竖向表格（col模式）和横向表格（row模式）
- **批量操作**：支持一次性设置多行的权限
- **实时生效**：权限设置立即在表格中生效

### 基本用法

```javascript
// 设置表格行只读
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var tableCode = 'TABLE_001';  // 表格编码
        var rowIndex = 0;              // 行索引（从0开始）
        var isReadOnly = true;         // true:只读 false:可编辑
        
        editorInstance.setTableRowReadonly(tableCode, rowIndex, isReadOnly);
        console.log('表格行只读状态设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 设置表格行删除权限
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var tableCode = 'TABLE_001';
        var rowIndex = [0, 1, 2];      // 支持数组格式，批量设置多行
        var isDeletable = false;       // true:可删除 false:不可删除
        
        editorInstance.setTableRowDeletable(tableCode, rowIndex, isDeletable);
        console.log('表格行删除权限设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 设置表格行新增权限
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var tableCode = 'TABLE_001';
        var rowIndex = '0-5,8,10-12';  // 支持区间字符串格式：0-5表示0到5行，8表示第8行，10-12表示10到12行
        var isAddable = false;         // true:可新增 false:不可新增
        
        editorInstance.setTableRowAddable(tableCode, rowIndex, isAddable);
        console.log('表格行新增权限设置成功');
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### setTableRowReadonly - 设置表格行只读

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| tableCode | String | 是 | 表格唯一编号（表格的 data-hm-table-code 或 data-hm-datatable 属性值） |
| rowIndex | Number\|Array\|String | 是 | 行索引，支持：单个数字、数组、区间字符串（如"0-5,8,10-12"） |
| flag | Boolean | 是 | 是否只读，true表示只读，false表示可编辑 |

**返回值：** 无

**使用说明：**
- 只读状态下，该行的所有单元格将无法编辑
- 只读状态下，单元格内的数据元（如时间选择器、下拉框等）将被禁用
- 只读状态下，表格行会启用简洁模式，隐藏部分非必要元素
- 只读权限会设置单元格的 `contenteditable` 属性为 `false`

#### setTableRowDeletable - 设置表格行删除权限

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| tableCode | String | 是 | 表格唯一编号 |
| rowIndex | Number\|Array\|String | 是 | 行索引，支持：单个数字、数组、区间字符串 |
| flag | Boolean | 是 | 是否可删除，true表示可删除，false表示不可删除 |

**返回值：** 无

**使用说明：**
- 删除权限控制该行是否允许被删除
- 不可删除时，该行的删除按钮或删除操作将被禁用
- 删除权限通过设置行的 `_row_deletable` 属性来控制

#### setTableRowAddable - 设置表格行新增权限

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| tableCode | String | 是 | 表格唯一编号 |
| rowIndex | Number\|Array\|String | 是 | 行索引，支持：单个数字、数组、区间字符串 |
| flag | Boolean | 是 | 是否可新增，true表示可新增，false表示不可新增 |

**返回值：** 无

**使用说明：**
- 新增权限控制该行是否允许在其后新增行
- 不可新增时，该行的新增按钮或新增操作将被禁用
- 新增权限通过设置行的 `_row_addable` 属性来控制

### 行索引格式说明

#### 单个数字
```javascript
editorInstance.setTableRowReadonly('TABLE_001', 0, true);  // 设置第0行
```

#### 数组格式
```javascript
editorInstance.setTableRowReadonly('TABLE_001', [0, 1, 2, 5], true);  // 设置第0、1、2、5行
```

#### 区间字符串格式
```javascript
// 支持多种格式组合，用逗号分隔
editorInstance.setTableRowReadonly('TABLE_001', '0-5', true);        // 设置第0到5行
editorInstance.setTableRowReadonly('TABLE_001', '0-5,8', true);     // 设置第0到5行和第8行
editorInstance.setTableRowReadonly('TABLE_001', '0-5,8,10-12', true); // 设置第0到5行、第8行、第10到12行
```

### 表格类型说明

#### 竖向表格（col模式）
- **默认模式**：表格按列方向评估，行索引对应表格的 `<tr>` 行
- **行索引含义**：直接对应表格的数据行索引（从0开始）
- **适用场景**：常见的列表类表格，数据按行展示

#### 横向表格（row模式）
- **特殊模式**：表格按行方向评估，行索引对应表格的列索引
- **行索引含义**：对应表格中每行的数据单元格索引（从0开始）
- **识别方式**：表格具有 `evaluate-type="row"` 属性
- **适用场景**：横向展示的表格，数据按列展示

### 权限控制效果

#### 只读权限（readonly）
- **单元格编辑**：设置 `contenteditable="false"`，禁止直接编辑
- **数据元禁用**：禁用单元格内的所有数据元控件（时间选择器、下拉框、单选框等）
- **简洁模式**：隐藏打印标记、段落标记、占位符等非必要元素
- **视觉反馈**：只读行会有明显的视觉区分

#### 删除权限（deletable）
- **删除按钮**：控制删除按钮的可用性
- **删除操作**：阻止通过API或用户操作删除该行
- **属性标记**：通过 `_row_deletable` 属性标记删除权限状态

#### 新增权限（addable）
- **新增按钮**：控制新增按钮的可用性
- **新增操作**：阻止在该行后新增行
- **属性标记**：通过 `_row_addable` 属性标记新增权限状态

### 使用场景

#### 流程审批
1. **审批中**：设置已提交的行为只读，防止误修改
2. **已审批**：设置已审批的行为只读且不可删除
3. **待审批**：允许编辑和删除待审批的行

#### 权限管控
1. **角色权限**：根据用户角色设置不同行的权限
2. **时间限制**：根据时间设置历史记录的只读状态
3. **数据保护**：保护重要数据行不被修改或删除

#### 数据保护
1. **历史记录**：保护历史记录不被修改
2. **关键数据**：保护关键数据行不被删除
3. **审核数据**：保护已审核的数据不被修改

### 常见问题

#### 权限设置不生效

1. **表格编码错误**：检查 `tableCode` 是否正确，确保与表格的 `data-hm-table-code` 或 `data-hm-datatable` 属性值一致
2. **表格类型错误**：确认表格是列表类表格（`data-hm-table-type="list"`）
3. **行索引超出范围**：检查行索引是否在有效范围内（从0开始，小于表格总行数）
4. **表格未加载**：确保目标表格已经正确加载到编辑器中

#### 行索引格式错误

1. **区间格式错误**：区间字符串格式应为 "start-end"，如 "0-5"
2. **数组格式错误**：数组应包含有效的数字索引
3. **混合格式**：区间字符串中可以用逗号分隔多个区间或单个数字

#### 只读状态异常

1. **单元格仍可编辑**：检查是否所有单元格都已正确设置 `contenteditable` 属性
2. **数据元未禁用**：确认数据元控件是否已正确禁用
3. **简洁模式未生效**：检查简洁模式的CSS类是否正确应用

#### 横向表格权限异常

1. **索引理解错误**：横向表格中，行索引实际对应列索引
2. **表格模式识别**：确认表格是否设置了 `evaluate-type="row"` 属性
3. **列索引计算**：横向表格的列索引需要排除表头列

### 最佳实践

1. **参数验证**：设置权限前验证 `tableCode` 和 `rowIndex` 参数的有效性
2. **批量操作**：尽量使用数组或区间字符串格式批量设置，减少API调用次数
3. **错误处理**：对权限设置操作进行适当的错误处理
4. **权限同步**：确保权限设置与业务逻辑保持同步
5. **用户反馈**：为用户提供权限设置的反馈信息
6. **权限恢复**：提供权限恢复机制，允许在必要时恢复权限
7. **性能优化**：大量行时考虑分批设置权限
8. **权限记录**：记录权限变更历史，便于审计和追踪
9. **表格类型识别**：在设置权限前确认表格类型（col/row模式）
10. **索引计算**：注意行索引从0开始，确保索引计算正确


## 删除文档功能

删除文档功能用于从聚合病历中删除部分文档，支持按文档编号删除单个或多个文档。适用于聚合病历的文档管理、内容精简等场景。

### 基本用法

```javascript
// 删除单个文档
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var result = editorInstance.deleteDocContent('DOC_001');
        if (result) {
            console.log('文档删除成功');
        } else {
            console.warn('删除失败或当前仅剩一个文档不允许删除');
        }
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });

// 删除多个文档
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        var result = editorInstance.deleteDocContent(['DOC_001', 'DOC_002', 'DOC_003']);
        if (result) {
            console.log('文档删除成功');
        }
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

### 方法参数说明

#### deleteDocContent - 删除聚合病历中部分文档

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| docCode | String \| Array | 是 | 文档唯一编号，可为单个字符串或字符串数组 |

**返回值：** Boolean

- 成功删除至少一个文档时返回 `true`
- 未删除任何文档（如当前仅剩一个文档、未找到对应文档等）时返回 `false`

**使用说明：**

- 当前聚合文档仅剩一个文档时，不允许删除，直接返回 `false`
- 批量删除时，每删完一个文档会检查剩余数量，若只剩一个文档则停止后续删除
- 非实时分页且删除第一个文档时，会将原文档的页眉移动到下一个文档
- 非实时分页且删除最后一个文档时，会将原文档的页脚移动到上一个文档；若上一个文档已有页脚会先删除再移动
- 删除时会移除整个文档对应的 widget 外层结构（含 `data-cke-widget-wrapper` 的 div）

### 常见问题

#### 删除后无反应

1. **仅剩一个文档**：聚合病历中只剩一个文档时不允许删除，需至少保留一个文档
2. **文档编号错误**：检查传入的 `docCode` 是否与编辑器中文档的 `data-hm-widgetid` 或 `doc_code` 一致
3. **编辑器未就绪**：确保在编辑器加载完成后再调用


## AI 草稿功能

AI 草稿功能允许开发者将 AI 生成的内容以草稿形式展示在编辑器中，用户可逐项或批量确认采纳或弃用，适用于 AI 辅助书写、预填内容审核等场景。

### generateDocumentDirect - 直接生成整份病历草稿

请求大模型直接生成整份病历，并在生成完成后自动调用 `showAiDraft` 以 AI 草稿形式回填到对应文书中。

#### 基本用法

```javascript
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.generateDocumentDirect({
            agent_code: 'admission_record_generate',
            docCode: 'DOC001',
            agent_name: '入院记录生成',
            agent_id: 'agent_001',
            agent_query: '请结合患者主诉、现病史生成入院记录',
            agent_type: 'document',
            progress_type: 'admission'
        });
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

#### generateDocumentDirect 方法说明

| 字段 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| agent_code | String | 是 | 智能体编码，不能为空 |
| docCode | String | 是 | 病历文书编码，不能为空 |
| agent_name | String | 否 | 智能体名称，按接口约定透传 |
| agent_id | String | 否 | 智能体 ID，按接口约定透传 |
| agent_query | String | 否 | 用户补充问题或上下文 |
| agent_type | String\|Number | 否 | 智能体类型 |
| progress_type | String\|Number | 否 | 诊疗阶段或进度类型 |

**返回值：** 无

**使用说明：**

1. `generateDocumentDirect` 只接收单个 `params` 对象，不支持位置参数。
2. 调用前需确保编辑器已完成初始化，且 `documentModel.generateDocumentLLM` 可用。
3. 方法内部会校验 `agent_code`、`docCode` 和编辑器就绪状态；校验不通过时会直接返回，并输出对应错误日志。
4. 生成成功后会自动调用 `showAiDraft` 展示整份病历草稿，供用户确认采纳或弃用。

---

### showAiDraft - 显示 AI 草稿

将数据以 AI 草稿形式填入对应数据元，界面会展示草稿内容供用户确认采纳或取消。参数格式与 `setDocData` 一致。

#### 基本用法

```javascript
// 显示 AI 草稿（支持多份病历）
var dataList = [
    {
        code: 'DOC001',
        data: [
            { keyCode: 'PATIENT_NAME', keyName: '患者姓名', keyValue: '张三' },
            { keyCode: 'DIAGNOSIS', keyName: '诊断信息', keyValue: '感冒' }
        ]
    }
];
// 随手病历：dataList 形态见产品需求 §3.2；每条 data 可含 sourceId，供正文点击回调第三参
var dataListCasual = [
    {
        code: 'DOC001',
        data: [
            { sourceId: '1', keyCode: 'PATIENT_NAME', keyName: '患者姓名', keyValue: '张三' },
            { sourceId: '2', keyCode: 'DIAGNOSIS', keyName: '诊断信息', keyValue: '感冒' }
        ]
    }
];

HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        // 必须传入含 dataList 的 options（单文档写 { dataList: { code, data } }）
        editorInstance.showAiDraft({ dataList: dataList });
        editorInstance.showAiDraft({ dataList: dataList, displayType: 1 });
        // 随手：点正文回调第三参与对应 data 条目的 sourceId 一致
        editorInstance.showAiDraft({
            dataList: dataListCasual,
            displayType: 1,
            casualDraft: true,
            onCasualTextClick: function (evt, $gen, sourceId) {
                console.log('随手正文点击', sourceId, $gen);
            }
        });
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

#### showAiDraft 方法说明

**入参：** 单个 `options` 对象，且 **必须** 包含自有属性 `dataList`。不支持 `showAiDraft(dataList)` 等位置参数写法；单份病历须使用 `showAiDraft({ dataList: { code, data } })`。

| 字段 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| dataList | Array\|Object | 是 | 内容列表或单个内容对象；与 `setDocData` 一致，随手场景下单条 `data` 结构见需求文档 `dataList` 参考 |
| displayType | Number | 否 | 展示方式：0-覆盖（先清空原内容再展示），1-追加（默认） |
| casualDraft | Boolean | 否 | 是否为随手病历。`true` 时使用 `r-model-gen-casual` 样式与小喇叭图标，确认条为「随手记录，请确认」；点击正文触发 `onCasualTextClick`，点击确认条打开保留/弃用弹框。默认 `false`（AI 草稿，类名含 `r-model-gen-normal`） |
| onCasualTextClick | Function | 否 | 仅当 `casualDraft === true` 时有效：`(event, $rModelGen, sourceId) => void`，点击 `.r-model-gen-text` 时调用；`sourceId` 对应当前块对应 **data 条目** 上的 `sourceId` |

**返回值：** 无

**使用说明：** 将 `dataList` 中的内容以草稿形式填入对应数据元。AI 草稿下用户点击整块草稿即可打开保留/弃用弹框；随手病历下需点击确认条打开弹框，点击正文触发 `onCasualTextClick`（第三参与对应 `data` 条目约定字段一致，见需求 `dataList` 参考）。

---

### confirmAiDraft - 确认 AI 草稿

对已展示的 AI 草稿执行“采纳”：将草稿内容写入对应数据元并移除草稿标记。支持全部确认或按数据元编码批量确认。

#### 基本用法

```javascript
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.confirmAiDraft();                      // 确认全部 AI 草稿
        editorInstance.confirmAiDraft(['KEY_01', 'KEY_02']); // 仅确认指定数据元的草稿
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

#### confirmAiDraft 方法说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| keyList | Array\|String | 否 | 数据元编码数组或单个编码，不传则确认全部 |

**返回值：** 无

---

### cancelAiDraft - 弃用 AI 草稿

对已展示的 AI 草稿执行“弃用”：移除草稿内容及草稿标记，不写入数据元。支持全部弃用或按数据元编码批量弃用。

#### 基本用法

```javascript
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.cancelAiDraft();                      // 弃用全部 AI 草稿
        editorInstance.cancelAiDraft(['KEY_01', 'KEY_02']); // 仅弃用指定数据元的草稿
    })
    .catch(function(error) {
        console.error("获取编辑器实例失败:", error);
    });
```

#### cancelAiDraft 方法说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| keyList | Array\|String | 否 | 数据元编码数组或单个编码，不传则弃用全部 |

**返回值：** 无

---

### API 参考摘要

| 方法 | 参数 | 返回值 | 描述 |
| --- | --- | --- | --- |
| generateDocumentDirect | params:{agent_code, docCode, [agent_name], [agent_id], [agent_query], [agent_type], [progress_type]} | void | 请求大模型直接生成整份病历，并在成功后自动展示 AI 草稿 |
| showAiDraft | options:{dataList, [displayType], [casualDraft], [onCasualTextClick]} | void | 显示 AI/随手草稿；必须传入含 `dataList` 的 options |
| confirmAiDraft | [keyList:Array\|String] | void | 确认（采纳）全部或指定数据元的 AI 草稿 |
| cancelAiDraft | [keyList:Array\|String] | void | 弃用全部或指定数据元的 AI 草稿 |


## 工具栏显示/隐藏控制功能

工具栏显示/隐藏控制功能允许开发者在编辑器已初始化后动态控制工具栏的显示与隐藏，不依赖初始化参数 `showTools`，适用于需要运行时切换编辑界面简洁模式的场景。

### 基本用法

```javascript
// 隐藏工具栏
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(function(editorInstance) {
        editorInstance.setShowTools(false);
        console.log('工具栏已隐藏');
    });

// 显示工具栏
editorInstance.setShowTools(true);

// 查询当前工具栏是否显示
var visible = editorInstance.getShowTools();
```

### 方法说明

#### setShowTools - 设置工具栏显示/隐藏

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| show | Boolean | 是 | 是否显示工具栏，true 显示，false 隐藏 |

**返回值：** Boolean，设置成功返回 true，参数非法返回 false。

**使用说明：**
- 初始化时可通过 `createEditorAsync` 的 `options.showTools` 控制初始状态；本接口用于初始化后的运行时切换。
- 隐藏时工具栏区域不占位且不显示，显示时恢复为默认高度。

#### getShowTools - 获取工具栏是否显示

**返回值：** Boolean，当前工具栏是否显示。

#### setPrintPageBreakConfig - 设置打印另页/单独一页配置

支持按模板名称（原有参数）或文档编码（doc_code）控制另页打印与单独一页打印，仅合并传入的键，未传入的键保留原值。

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| options | Object | 否 | 打印分页配置对象，不传则不改动现有配置 |
| options.pageAnotherTpls | Array | 否 | 另页打印模板名称数组 |
| options.pageAloneTpls | Array | 否 | 单独一页打印模板名称数组 |
| options.pageAnotherCodes | Array | 否 | 另页打印文档编码（doc_code，对应 data-hm-widgetid）数组 |
| options.pageAloneCodes | Array | 否 | 单独一页打印文档编码（doc_code）数组 |

**返回值：** 无

**使用示例：**
```javascript
// 仅按文档编码设置另页打印与单独一页
editorInstance.setPrintPageBreakConfig({
    pageAnotherCodes: ['DOC001', 'DOC002'],
    pageAloneCodes: ['DOC003']
});
```
