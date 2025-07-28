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
    customParams: {     // 自定义参数
        header:{},
        data:{
            departmentCode: '0001',
            doctorCode: '0001',
        }
    },
    customToolbar: [    // 自定义工具栏按钮
        {
            name: 'customButton',
            label: '自定义按钮',
            icon: '/path/to/icon.png',
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
    customParams: {     // 自定义参数
        departmentCode: '0001',
        doctorCode: '0001'
    },
    customToolbar: [    // 自定义工具栏按钮
        {
            name: 'customButton',
            label: '自定义按钮',
            icon: '/path/to/icon.png',
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
    var editorId = result.id;
    var editorInstance = result.instance;

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
| onReady | Function | 否 | 编辑器初始化完成回调函数 |
| designMode | Boolean | 否 | 设计模式开关，true开启设计模式，默认false |
| reviseMode | Boolean | 否 | 修订模式开关，true开启修订模式，默认false |
| readOnly | Boolean | 否 | 只读模式开关，true开启只读模式，默认false |
| customParams | Object | 否 | 自定义参数，用于动态数据源接口入参，例：{departmentCode:'0001',doctorCode:'0001'} |
| customToolbar | Array | 否 | 自定义工具栏按钮，例：[{name:'customButton',label:'自定义按钮',icon:'/path/to/icon.png',onExec:function(editor){},onRefresh:function(editor,path){}}] |
| printConfig | Object | 否 | 打印配置参数 |
| printConfig.pageBreakPrintPdf | Boolean | 否 | 分页模式打印是否生成pdf |
| printConfig.pageAnotherTpls | Array | 否 | 另页打印模板名称 |
| printConfig.pageAloneTpls | Array | 否 | 单独一页打印模板名称 |

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
HMEditorLoader.aiAuth(autherEntity)
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

## 常见问题

### 质控提醒功能无法调用

1. 确保已正确初始化认证信息（调用initAutherEntity）
2. 检查质控参数是否完整，必填字段不能为空
3. 确认编辑器实例已正确加载
4. 检查网络连接和AI服务器状态

### 激活指尖大模型功能无响应

1. 确保已正确初始化认证信息
2. 检查recordType和progressGuid参数是否正确
3. 确认AI服务器地址配置正确
4. 检查网络连接稳定性

### 最佳实践

1. 在调用qc和ai功能前，确保已完成认证初始化
2. 总是处理异常情况，特别是在网络不稳定的环境
3. 根据实际业务场景正确设置质控参数
4. 在调用AI功能前，确保编辑器实例已准备就绪
5. 合理设置质控提醒的触发时机，避免频繁调用

