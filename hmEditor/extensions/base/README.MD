# HMEditor 基础组件

## API 说明

### 1. setDocContent 方法

该方法用于设置编辑器内容，支持单个对象或对象数组参数：

```javascript
/**
 * 设置文档内容及初始化数据
 * @param {Array|Object} contentlist 内容列表或单个内容对象
 */
```

#### 参数详细说明

- `contentlist`: 内容列表或单个内容对象，结构如下：
  ```javascript
  {
    code: '文档唯一编号',  // 必传
    docTplName:'文档模板名称'//(必传)
    docContent: '文档内容',  // 必传
    data: [
      {
        keyCode: '数据元编码',
        keyValue: '数据元内容或数据元内容数组'  // 可以是字符串或字符串数组
      }
    ]  // 初始化数据
  }
  ```

#### 使用示例

```javascript
// 单个对象形式
HMEditor.setDocContent({
  code: 'DOC_001',
  docTplName:'入院记录',
  docContent: '<p>文档内容示例</p>',
  data: [
    {
      keyCode: 'PATIENT_NAME',
      keyValue: '张三'  // 单值数据元
    },
    {
      keyCode: 'DIAGNOSIS',
      keyValue: ['感冒', '发热']  // 多值数据元使用字符串数组
    }
  ]
});

// 数组形式
HMEditor.setDocContent([
  {
    code: 'DOC_001',
    docTplName:'入院记录',
    docContent: '<p>文档内容示例</p>',
    data: [
      {
        keyCode: 'PATIENT_NAME',
        keyValue: '张三'
      },
      {
        keyCode: 'DIAGNOSIS',
        keyValue: ['感冒', '发热']
      }
    ]
  }
]);
```

### 2. insertDocContent 方法

该方法用于在指定文档后插入新文档：

```javascript
/**
 * 在指定文档后插入新文档
 * @param {Number} insertPosition 目标位置，新文档将插入到该文档之后
 * @param {Array} docs 要插入的文档数组
 * @param {String} docs[].code 要插入的文档的唯一编号
 * @param {String} docs[].docTplName 文档模板名称
 * @param {String} docs[].docContent 要插入的文档内容
 */
```

#### 参数详细说明

- `insertPosition`: 目标位置，新文档将插入到该文档之后
- `docs`: 要插入的文档数组，结构如下：
  ```javascript
  [
    {
      code: '文档唯一编号',  // 必传
      docTplName:'入院记录', // 必传
      docContent: '文档内容'  // 必传
    }
  ]
  ```

#### 使用示例

```javascript
// 在第一个文档后插入新文档
HMEditor.insertDocContent(1, [
  {
    code: 'DOC_001',
    docTplName:'入院记录',
    docContent: '<body><p>第一个新文档</p></body>'
  },
  {
    code: 'DOC_002',
    docTplName:'入院记录',
    docContent: '<body><p>第二个新文档</p></body>'
  }
]);
```

### 3. setDocData 方法

该方法用于设置文档数据元数据，支持单个对象或对象数组参数：

```javascript
/**
 * 设置文档数据元数据
 * @param {Array|Object} dataList 内容列表或单个内容对象
 */
```

#### 参数详细说明

- `dataList`: 内容列表或单个内容对象，结构如下：
  ```javascript
  {
    code: '文档唯一编号',  // 必传
    data: [  // 必传
      {
        keyCode: '数据元编码',  // 必传
        keyName: '数据元名称',  // 可选
        keyValue: '数据元内容或数据元内容数组'  // 必传，可以是字符串或字符串数组
      }
    ]
  }
  ```

#### 使用示例

```javascript
// 单个对象形式
HMEditor.setDocData({
  code: 'DOC_001',
  data: [
    {
      keyCode: 'PATIENT_NAME',
      keyValue: '张三',  // 单值数据元
      keyName: '患者姓名'  // 数据元名称
    },
    {
      keyCode: 'DIAGNOSIS',
      keyValue: ['选项1', '选项2'],  // 多值数据元使用字符串数组
      keyName: '诊断结果'  // 数据元名称
    }
  ]
});

// 数组形式
HMEditor.setDocData([
  {
    code: 'DOC_001',
    data: [
      {
        keyCode: 'PATIENT_NAME',
        keyValue: '张三',
        keyName: '患者姓名'
      },
      {
        keyCode: 'DIAGNOSIS',
        keyValue: ['选项1', '选项2'],
        keyName: '诊断结果'
      }
    ]
  }
]);


```

### 4. getDocContent 方法

该方法用于获取文档完整内容，包括HTML、纯文本和数据元数据：

```javascript
/**
 * 获取文档所有内容
 * @param {String} code 文档唯一编号，为空时获取所有文档内容
 * @returns {Array} 文档内容列表
 */
```

#### 返回值详细说明

返回的是文档内容列表数组，结构如下：
```javascript
[
  {
    code: '文档唯一编号',
    data: [
      {
        keyCode: '数据元编码',
        keyValue: '数据元内容或数据元内容数组'  // 可能是字符串或字符串数组
      }
    ],  // 数据元数据
    html: '文档html文本',
    text: '文档text纯文本'
  }
]
```

#### 使用示例

```javascript
// 获取指定文档内容
const docContent = HMEditor.getDocContent('DOC_001');
// 返回示例：
[{
  code: 'DOC_001',
  data: [
    {keyCode: 'PATIENT_NAME', keyValue: '张三'},
    {keyCode: 'DIAGNOSIS', keyValue: ['选项1', '选项2']}
  ],
  html: '<p>文档内容示例</p>',
  text: '文档内容示例'
}]

// 获取所有文档内容
const allDocContents = HMEditor.getDocContent();
```

### 5. getDocHtml 方法

该方法用于获取文档的HTML文本内容：

```javascript
/**
 * 获取文档html文本
 * @param {String} code 指定文档编号，为空时获取当前文档html文本
 * @returns {Array} 文档html内容列表
 */
```

#### 返回值详细说明

返回的是文档HTML内容列表数组，结构如下：
```javascript
[
  {
    code: '文档唯一编号',
    html: '文档html文本'
  }
]
```

#### 使用示例

```javascript
// 获取指定文档的HTML内容
const docHtml = HMEditor.getDocHtml('DOC_001');

// 获取当前文档的HTML内容
const currentDocHtml = HMEditor.getDocHtml();
```

### 6. getDocText 方法

该方法用于获取文档的纯文本内容：

```javascript
/**
 * 获取文档text文本
 * @param {String} code 指定文档编号，为空时获取当前文档text文本
 * @returns {Array} 文档text内容列表
 */
```

#### 返回值详细说明

返回的是文档纯文本内容列表数组，结构如下：
```javascript
[
  {
    code: '文档唯一编号',
    text: '文档text纯文本'
  }
]
```

#### 使用示例

```javascript
// 获取指定文档的纯文本内容
const docText = HMEditor.getDocText('DOC_001');

// 获取当前文档的纯文本内容
const currentDocText = HMEditor.getDocText();
```

### 7. getDocData 方法

该方法用于获取文档的数据元数据：

```javascript
/**
 * 获取文档数据元数据
 * @param {String} code 文档唯一编号
 * @param {Array} keyList 指定数据元编码列表
 * @returns {Array} 文档数据元内容列表
 */
```

#### 返回值详细说明

返回的是文档数据元内容列表数组，结构如下：
```javascript
[
  {
    code: '文档唯一编号',
    data: [
      {
        keyCode: '数据元编码',
        keyValue: '数据元内容或数据元内容数组',  // 可能是字符串或字符串数组
        keyId: '数据元id',
        keyName: '数据元名称'
      }
    ]  // 数据元数据
  }
]
```

#### 使用示例

```javascript
// 获取指定文档的所有数据元数据
const docData = HMEditor.getDocData('DOC_001');
// 返回示例：
[{
  code: 'DOC_001',
  data: [
    {keyCode: 'PATIENT_NAME', keyValue: '张三', keyId: '001', keyName: '患者姓名'},
    {keyCode: 'DIAGNOSIS', keyValue: ['选项1', '选项2'], keyId: '002', keyName: '诊断'}
  ]
}]

// 获取指定文档的特定数据元数据
const specificDocData = HMEditor.getDocData('DOC_001', ['PATIENT_NAME', 'DIAGNOSIS']);
```

### 8. addCustomMenu 方法

该方法用于添加自定义右键菜单项：

```javascript
/**
 * 添加自定义菜单
 * @param {Array} menuList 菜单列表
 */
```

#### 参数详细说明

- `menuList`: 菜单项数组，每个菜单项的结构如下：
  ```javascript
  {
    name: 'menuItemName',      // 菜单名称，必填，用于生成唯一标识
    label: '菜单显示文本',      // 菜单显示文本，必填
    onExec: function() {       // 菜单执行函数，必填，点击菜单时触发
      // 执行操作
    },
    show: function(element) {  // 控制菜单显示的函数
      // 返回true显示，false不显示
      return true;
    },
    icon: 'icon-class-name'    // 菜单图标CSS类名，可选
  }
  ```

#### 使用示例

```javascript
// 基本用法
HMEditor.addCustomMenu([
  {
    name: 'customMenu1',
    label: '自定义菜单1',
    onExec: function() {
      alert('执行自定义菜单1');
    }
  },
  {
    name: 'customMenu2',
    label: '自定义菜单2',
    onExec: function() {
      alert('执行自定义菜单2');
    }
  }
]);

// 高级用法 - 带条件显示
HMEditor.addCustomMenu([
  {
    name: 'conditionalMenu',
    label: '条件菜单',
    show: function(element) {
      // 只在段落元素上显示此菜单
      return element.is('p');
    },
    onExec: function() {
      console.log('条件菜单被执行');
    }
  }
]);
```

注意：添加自定义菜单时需要特别注意闭包问题，确保`onExec`方法能正确获取到当前菜单项的信息。

### 9. setDocReadOnly 方法

该方法用于设置文档的只读模式：

```javascript
/**
 * 设置文档只读
 * @param {String} code 文档唯一编号
 * @param {Boolean} flag true 只读 false 可编辑
 */
```

#### 使用示例

```javascript
// 获取指定文档的所有数据元数据
HMEditor.setDocReadOnly('DOC_001',true);
```

### 10. setDocWatermark 方法

该方法用于设置文档水印：

```javascript
/**
 * 设置文档水印
 * @param {Object} settings
 * @param {String} settings.watermarkType 水印类型 1 文字水印 2 图片水印
 * @param {String} settings.watermarkImg 水印图片 当水印类型为图片水印时，必传
 * @param {String} settings.watermarkText 水印文字 当水印类型为文字水印时，必传
 * @param {String} settings.watermarkFontColor 水印字体颜色 默认黑色
 * @param {Number} settings.watermarkFontSize 水印字体大小 默认12px
 * @param {Number} settings.watermarkAlpha 水印透明度 默认0.3 值域(0~1)
 * @param {Number} settings.watermarkAngle 水印倾斜度数 默认15度 值域(0~360)
 * @param {Number} settings.watermarkHeight 水印高度 默认50px 值域建议100~300设置水印
 * @param {Number} settings.watermarkColumn 水印列数 默认3列
 * @param {Boolean} settings.watermarkPrint 打印是否显示水印 true开启，false关闭。开启后，目前只在实时分页模式下打印显示水印
 */
```

#### 使用示例

```javascript
// 获取指定文档的所有数据元数据
var settings = {
    watermarkType:1,
    watermarkImg:'',
    watermarkText:'文字水印',
    watermarkFontColor:'#000000',
    watermarkFontSize:'14',
    watermarkAlpha:'0.3',
    watermarkAngle:'15',
    watermarkHeight:'100',
    watermarkColumn:3,
    watermarkPrint:true
}
HMEditor.setDocWatermark(settings);
```

### 11. onToolbarCommandComplete 事件

该事件在工具栏命令执行完成后触发，可用于监听和响应命令执行的结果：

```javascript
/**
 * 工具栏命令执行完成事件
 * @param {String} command 执行的命令名称
 * @param {String} type 命令类型
 * @param {Object} data 命令相关数据
 */
```

#### 事件监听示例

```javascript
// 监听工具栏命令执行完成事件
HMEditor.onToolbarCommandComplete = function(command, type, data) {
  console.log('命令执行完成:', command);
  console.log('命令类型:', type);
  console.log('命令数据:', data);

  // 根据命令类型执行不同操作
  if (command === 'print') {
    console.log('打印命令执行完成');
  } else if (command === 'save') {
    console.log('保存命令执行完成');
  }
};
```

该事件特别适用于需要在异步命令执行完成后执行自定义逻辑的场景，例如打印完成后的回调、保存文档后的提示等。

### 12. insertDataAtCursor 方法

该方法用于在光标位置插入内容：

```javascript
/**
 * 在光标处插入内容
 * @param {String} content 要插入的内容，可以是文本也可以是base64的img标签
 */
```

#### 使用示例

```javascript
// 在光标处插入内容
HMEditor.insertDataAtCursor('要插入的内容');
```

该方法会在当前光标位置插入内容。

### 13. insertImageAtCursor 方法

该方法用于在光标位置插入图片：

```javascript
/**
 * 在光标处插入图片
 * @param {Object} imageData 图片数据
 * @param {String} imageData.src 图片URL
 * @param {Number} imageData.width 图片宽度
 * @param {Number} imageData.height 图片高度
 */
```

#### 参数详细说明

- `src`: base64图片数据
- `width`: 图片宽度，单位为像素(px)
- `height`: 图片高度，单位为像素(px)

#### 使用示例

```javascript

HMEditor.insertImageAtCursor(
  'src':'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  'width': 300,
  'height': 200
  );
```

该方法会在当前光标位置插入图片，并支持设置图片的基本属性。

### 14. setTemplateDatasource 方法

该方法用于设置模板制作时需要的数据元列表和搜索类型：

```javascript
/**
 * 设置模板制作时需要的数据元列表和搜索类型
 * @param {Object} params 数据元参数对象
 * @param {String} params.doc_type 文档类型（可选）
 * @param {Array} params.datasource 数据元数组
 * @param {String} params.datasource[].code 数据元编码
 * @param {String} params.datasource[].dictCode 字典编码
 * @param {String} params.datasource[].name 数据元名称
 * @param {String} params.datasource[].description 数据元描述
 * @param {String} params.datasource[].format 数据元格式
 * @param {String} params.datasource[].type 数据元类型
 * @param {Array} params.datasource[].dictList 字典列表
 * @param {String} params.datasource[].dictList[].code 字典编码
 * @param {String} params.datasource[].dictList[].val 字典值
 * @param {String} params.datasource[].dictList[].remark 字典备注
 * @param {String} params.datasource[].dictList[].description 字典描述
 * @param {String} params.datasource[].dictList[].order 字典排序
 * @param {Array} params.dynamicDict 动态值域数组，用于搜索
 * @param {String} params.dynamicDict[].code 动态值域编码
 * @param {String} params.dynamicDict[].name 动态值域名称
 * @param {String} params.dynamicDict[].url 动态值域请求URL
 */
```

#### 参数详细说明

- `doc_type`: 文档类型，可选
- `datasource`: 数据元数组，每个数据元包含以下属性：
  - `code`: 数据元编码，必填
  - `dictCode`: 字典编码，如果数据元绑定了字典值域，则提供此字段
  - `name`: 数据元名称，必填
  - `description`: 数据元描述
  - `format`: 数据元格式
  - `type`: 数据元类型
  - `dictList`: 字典列表数组，包含该数据元的所有可选值，每个字典项包括：
    - `code`: 字典编码
    - `val`: 字典值，用于显示
    - `remark`: 字典备注
    - `description`: 字典描述
    - `order`: 字典排序

- `dynamicDict`: 动态值域数组，用于搜索类下拉框，每个动态值域包含：
  - `code`: 动态值域编码，必填
  - `name`: 动态值域名称，必填
  - `url`: 动态值域请求URL，必填

#### 字典列表与动态值域说明

1. **字典列表(dictList)**：
   - 静态的预定义选项列表
   - 所有可选值都在前端加载
   - 适用于选项较少、固定不变的场景

2. **动态值域(dynamicDict)**：
   - 基于用户输入动态请求后端服务获取选项
   - 适用于选项数量大、需要搜索筛选的场景
   - 实现远程搜索功能

#### 动态值域URL接口要求

动态值域URL对应的后台服务需满足以下要求：

1. **请求方法**：
   - 使用POST请求

2. **请求头部**：
   - Content-Type: application/json
   - 其他请求头部值来自：`requestHeaders = editor.HMConfig.customParams.header`

3. **请求参数**：
   - 请求体为JSON格式
   - 参数中的`searchText`表示搜索框中用户输入的内容
   - 其他参数来自：`requestData = editor.HMConfig.customParams.data`

4. **返回格式**：
   ```json
   {
     "code": 10000,
     "message": "success",
     "data": [
       {
         "code": "选项编码",
         "name": "选项名称",
         "displayVal": "显示值"
       },
       // 更多选项...
     ]
   }
   ```
   - 返回状态码`code`为10000表示成功
   - `data`是一个数组，包含符合搜索条件的所有选项
   - 每个选项必须包含`code`、`name`和`displayVal`属性

#### 使用示例

```javascript
// 设置模板数据元
HMEditor.setTemplateDatasource({
  doc_type: "入院记录",
  datasource: [
    {
      code: "DE02.01.025.00",
      name: "民族",
      description: "患者所属民族",
      format: "S1",
      type: "S1",
      dictList: [
        { code: "01", val: "汉族", remark: "", description: "", order: 1 },
        { code: "02", val: "蒙古族", remark: "", description: "", order: 2 },
        // 更多选项...
      ]
    },
    {
      code: "DE02.01.060.00",
      name: "疾病诊断编码",
      description: "疾病诊断的ICD编码",
      format: "S1",
      type: "S1",
      dictCode: "ICD10"  // 引用动态值域
    }
  ],
  dynamicDict: [
    {
      code: "ICD10",
      name: "ICD10疾病编码",
      url: "/api/icd/search"
    },
    {
      code: "MEDICINE",
      name: "药品目录",
      url: "/api/medicine/search"
    }
  ]
});
```

在上面的示例中，"民族"使用静态字典列表，"疾病诊断编码"则使用动态值域，允许用户通过远程搜索查找ICD10编码。



### 15. setDocReviseMode 方法

该方法用于设置文档的修订模式：

```javascript
/**
 * 设置文档修订模式
 * @param {Boolean} reviseMode 是否启用修订模式
 */
```

#### 使用示例

```javascript
// 开启修订模式
HMEditor.setDocReviseMode(true);

// 关闭修订模式
HMEditor.setDocReviseMode(false);
```

该方法用于控制文档的修订模式。开启修订模式时，所有的编辑操作（如插入、删除、修改等）都会被标记为修订，并显示修订标记;关闭修订模式时，系统将弹出对话框，提示用户选择"全部接受修订"或"全部拒绝修订"，关闭修订后历史操作会被去除。
