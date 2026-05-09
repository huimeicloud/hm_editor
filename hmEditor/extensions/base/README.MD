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
 * @param {String} dataList[].code 文档唯一编号(必传)
 * @param {Array} dataList[].data 初始化数据(必传)
 * @param {String} dataList[].data[].keyCode 数据元编码(必传)
 * @param {String} dataList[].data[].keyName 数据元名称
 * @param {String|String[]} dataList[].data[].keyValue 数据元内容，可以是字符串或字符串数组(必传)
 * @param {Array} dataList[].nursingData 护理表单数据(可选，二维数组，每一行代表一条护理记录)
 * @param {String} dataList[].nursingData[][].keyCode 护理数据数据元编码
 * @param {String} dataList[].nursingData[][].keyName 护理数据数据元名称
 * @param {String} dataList[].nursingData[][].keyValue 护理数据数据元值
 */
```

#### 参数详细说明

- `dataList`: 内容列表或单个内容对象，结构如下：
  ```javascript
  {
    code: '文档唯一编号',  // 必传
    data: [  // 必传，基础数据元数据
      {
        keyCode: '数据元编码',  // 必传
        keyName: '数据元名称',  // 可选
        keyValue: '数据元内容或数据元内容数组'  // 必传，可以是字符串或字符串数组
      }
    ],
    nursingData: [  // 可选，护理表单数据（二维数组，每一行代表一条护理记录）
      [
        {
          keyCode: '数据元编码',  // 必传
          keyName: '数据元名称', // 可选
          keyValue: '数据元值'  // 必传
        }
      ]
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

#### 护理表单数据处理

`setDocData` 方法还支持护理表单数据的特殊处理，通过 `nursingData` 字段传入护理记录数据：

```javascript
// 护理表单数据示例
HMEditor.setDocData([
  {
    code: 'NURSING_DOC_001',
    data: [
      // 基础患者信息
      {
        keyCode: 'DE08.10.013.00.012',
        keyName: '医疗机构名称',
        keyValue: 'XX医院'
      },
      {
        keyCode: 'DE02.01.039.00',
        keyName: '姓名',
        keyValue: '张三'
      },
      {
        keyCode: 'DE02.01.040.00',
        keyName: '性别',
        keyValue: '男'
      }
    ],
    nursingData: [
      // 第一条护理记录
      [
        {
          keyCode: 'DE09.00.053.00',
          keyId: 'datetime_001',
          keyName: '记录日期时间',
          keyValue: '2025-08-21 17:51'
        },
        {
          keyCode: 'DE04.10.186.00',
          keyId: 'temperature_001',
          keyName: '体温',
          keyValue: '36.5'
        },
        {
          keyCode: 'DE02.01.039.00.178',
          keyId: 'doctor_001',
          keyName: '医师签名',
          keyValue: '李医生'
        }
      ],
      // 第二条护理记录
      [
        {
          keyCode: 'DE09.00.053.00',
          keyId: 'datetime_002',
          keyName: '记录日期时间',
          keyValue: '2025-08-22 09:30'
        },
        {
          keyCode: 'DE04.10.186.00',
          keyId: 'temperature_002',
          keyName: '体温',
          keyValue: '37.0'
        },
        {
          keyCode: 'DE02.01.039.00.178',
          keyId: 'doctor_002',
          keyName: '医师签名',
          keyValue: '王医生'
        }
      ]
    ]
  }
]);
```

**护理表单数据特殊功能：**

1. **动态行管理**：系统会自动检测护理表格现有行数，根据数据量动态添加表格行
2. **精确绑定**：每行护理数据会精确绑定到对应的表格行位置
3. **顺序渲染**：护理数据按照传入的数组顺序进行渲染

**注意事项：**
- 护理表单必须包含 `is_nursing_form="true"` 属性的表格才会启用护理数据处理
- 如果表格行数不足，系统会自动复制最后一行来扩展表格
- 护理数据将按照传入数组的顺序进行渲染，请确保数据顺序符合业务需求

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
HMEditor.setDocReviseMode(false,retainModify);
```

该方法用于控制文档的修订模式。开启修订模式时，所有的编辑操作（如插入、删除、修改等）都会被标记为修订，并显示修订标记;关闭修订模式时，retainModify传这个参数则不用弹框提示（true：保留修改内容，false：不保留修改内容），不传则系统将弹出对话框，提示用户选择"全部接受修订"或"全部拒绝修订"，关闭修订后历史操作会被去除。

### 16. setDocMultiPartHeader 方法

该方法用于设置文档分段页眉配置：

```javascript
/**
 * 设置文档分段页眉
 * @param {Object} settings 分段页眉设置
 * @param {String} settings.controlElementName 控制元素名称，数据元名称，比如 记录时间
 * @param {Array} settings.headerList 页眉列表
 * @param {String} settings.headerList[].startTime 开始时间
 * @param {String} settings.headerList[].endTime 结束时间
 * @param {Object} settings.headerList[].headerData 页眉数据对象，包含页眉显示的信息
 */
```

#### 参数详细说明

- `settings`: 分段页眉设置对象，结构如下：
  ```javascript
  {
    controlElementName: "记录时间",  // 控制时间的数据元名称（页面中对应元素的data-hm-name属性值）
    headerList: [
      {
        startTime: "2025-08-24",     // 时间段开始时间，格式：yyyy-MM-dd
        endTime: "2025-08-25",       // 时间段结束时间，格式：yyyy-MM-dd
        headerData: {                // 页眉数据对象，键为页面元素的data-hm-name属性值，值为显示内容
          "科室名称": "内科",
          "病区名称": "内科病区",
          "床位号": "001"
        }
      },
      {
        startTime: "2025-08-25",
        endTime: "2025-08-26",
        headerData: {
          "科室名称": "外科",
          "病区名称": "外科病区",
          "床位号": "002"
        }
      }
      // 更多分段页眉配置...
    ]
  }
  ```

#### 使用示例

```javascript
// 设置分段页眉
var multiPartHeaderSettings = {
  controlElementName: "记录时间",
  headerList: [
    {
      startTime: "2025-08-24",
      endTime: "2025-08-25",
      headerData: {
        "科室名称": "内科",
        "病区名称": "内科病区",
        "床位号": "001"
      }
    },
    {
      startTime: "2025-08-25",
      endTime: "2025-08-26",
      headerData: {
        "科室名称": "外科",
        "病区名称": "外科病区",
        "床位号": "002"
      }
    }
  ]
};

HMEditor.setDocMultiPartHeader(multiPartHeaderSettings);
```

#### 功能说明

该方法用于配置聚合病程实时分页时的页眉信息，主要应用于以下场景：

1. **转科换床场景**：患者在住院期间从一个科室转到另一个科室，或者更换床位时，页眉信息需要根据时间段显示不同的科室、病区、床位信息。

2. **时间段匹配**：系统会根据文档中控制元素（如"记录时间"）的值，自动匹配对应的时间段，并在页眉中显示该时间段配置的信息。

3. **动态页眉显示**：在实时分页模式下，不同时间段的内容会显示不同的页眉信息，确保页眉信息与文档内容的时间一致性。

#### 时间匹配逻辑

- 如果同时设置 `startTime` 和 `endTime`：recordTime > startTime 且 recordTime <= endTime
- 如果只设置 `endTime`：recordTime <= endTime  
- 如果只设置 `startTime`：recordTime > startTime

#### 注意事项

1. **时间格式**：确保 `startTime` 和 `endTime` 使用 yyyy-MM-dd 格式（如：2025-08-25）
2. **控制元素匹配**：确保 `controlElementName` 与页面元素的 data-hm-name 属性值完全一致
3. **页眉数据键值匹配**：`headerData` 中的键必须与页眉模板中元素的 data-hm-name 属性值一致
4. **时间范围**：避免多个时间段重叠，系统会使用第一个匹配的记录
5. **页眉模板**：确保页眉模板中存在对应 data-hm-name 属性的元素节点

该方法特别适用于需要根据时间段动态显示不同页眉信息的病历文档场景。

### 17. downloadPdf 方法

该方法用于下载PDF或获取PDF流：

```javascript
/**
 * 下载pdf
 * @param {Function} callback 回调函数（可选），接收生成的PDF Blob对象
 * @param {Blob} callback.pdfBlob PDF文件的Blob对象
 */
```

#### 参数详细说明

- `callback`: 可选的回调函数，如果提供此参数，则不会触发浏览器下载，而是将PDF Blob对象传递给回调函数；如果不提供此参数，则直接触发浏览器下载PDF文件。

#### 使用示例

```javascript
// 方式1：直接下载PDF（不提供回调）
HMEditor.downloadPdf();

// 方式2：获取PDF流并自定义处理（提供回调）
HMEditor.downloadPdf(function(pdfBlob) {
    // pdfBlob 是生成的PDF文件的Blob对象
    console.log('PDF已生成，大小:', pdfBlob.size, 'bytes');
    console.log('PDF类型:', pdfBlob.type); // 'application/pdf'
});
```

#### 功能说明

- **无回调模式**：当不提供 `callback` 参数时，方法会直接触发浏览器的PDF下载功能，用户可以在浏览器中看到下载提示。
- **回调模式**：当提供 `callback` 参数时，PDF会以Blob对象的形式传递给回调函数，不会触发浏览器下载，开发者可以自定义处理逻辑，如上传到服务器、转换为Base64、自定义下载等。

#### 注意事项

1. **Blob对象处理**：在回调函数中获取的PDF Blob对象，可以用于各种文件操作，但需要注意及时释放通过 `URL.createObjectURL()` 创建的URL对象，避免内存泄漏。
2. **文件大小**：可以通过 `pdfBlob.size` 属性获取PDF文件的大小（字节数）。
3. **文件类型**：PDF Blob对象的 `type` 属性值为 `'application/pdf'`。
4. **异步处理**：PDF生成是异步操作，回调函数会在PDF生成完成后被调用。

### 18. focusElement 方法

该方法用于定位到指定的病历或元素位置，支持滚动定位、光标定位和高亮效果；第三个参数支持**文本内容**或 **trace_id**，传 trace_id 时可按节点属性精确定位。

```javascript
/**
 * 定位到病历或元素
 * @param {String} docCode 病历ID（必填）
 * @param {String} eleCode 元素ID（可选）
 * @param {String} eleContent 元素内容或 trace_id（可选）。传文本时在元素内定位到该文本；传 trace_id 时定位到带 [trace_id="xxx"] 的节点
 * @returns {Boolean} 是否成功定位
 */
```

#### 参数详细说明

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| docCode | String | 是 | 病历ID，用于定位目标病历 |
| eleCode | String | 否 | 元素ID（data-hm-code 或 data-hm-name），用于定位病历中的具体元素 |
| eleContent | String | 否 | 元素内容或 trace_id。**文本**：在指定元素内定位到该文本开头；**trace_id**：在病历或元素内查找 `[trace_id="eleContent"]` 并定位到该节点 |

#### 使用示例

```javascript
// 示例1：只定位到病历
HMEditor.focusElement('DOC001');

// 示例2：定位到病历中的元素
HMEditor.focusElement('DOC001', 'ELEMENT001');

// 示例3：按文本内容定位到元素内某段文字
HMEditor.focusElement('DOC001', 'ELEMENT001', '睡眠障碍');

// 示例4：按 trace_id 在病历内定位到对应节点（可不传 eleCode）
HMEditor.focusElement('DOC001', null, 'trace_abc123');

// 示例5：按 trace_id 在指定元素内定位到对应节点
HMEditor.focusElement('DOC001', 'ELEMENT001', 'trace_abc123');
```

#### 功能说明

- **情况1**：只传 `docCode`，滚动条定位到病历位置，并添加高亮效果。
- **情况2**：传 `docCode` + `eleCode`，滚动条定位到元素位置；若为文本元素（newtextbox）则光标定位到元素内容开头，并添加高亮效果。
- **情况3**：传 `docCode` + `eleCode` + `eleContent`  
  - 若 `eleContent` 能按 **trace_id** 在元素内找到节点，则定位到该节点并高亮。  
  - 否则按**文本**在元素内查找，光标定位到该文本开头并高亮；找不到则定位到元素开头。
- **情况4**：传 `docCode` + `eleContent`（不传 `eleCode`），且 `eleContent` 为 **trace_id**：在整份病历内查找 `[trace_id="eleContent"]`，找到则定位到该节点并高亮。

#### 注意事项

1. **高亮效果**：定位成功后会添加高亮效果，3秒后自动消失。
2. **元素查找**：优先通过 `data-hm-code` 查找，找不到再通过 `data-hm-name` 查找。
3. **trace_id 优先**：有 `eleContent` 时先按 trace_id 查找节点，未找到再按文本内容查找。
4. **文本元素**：对于文本元素（newtextbox），会自动定位到内部的 `.new-textbox-content` 子元素。
5. **返回值**：返回 Boolean，表示是否成功定位。

### 19. insertHtml 方法

该方法用于插入HTML内容，支持在光标处插入或在指定元素后插入：

```javascript
/**
 * 插入HTML内容
 * @param {String} htmlContent 要插入的HTML内容
 * @param {String} posTag 定位标记（可选），如果提供，将通过 data-hm-code=posTag 或 data-hm-name=posTag 查找元素，在元素后插入HTML，完成后光标定位到插入HTML之前
 * @returns {Boolean} 是否成功插入
 */
```

#### 参数详细说明

- `htmlContent`: 要插入的HTML内容，必填
- `posTag`: 定位标记，可选。如果提供，将通过 `data-hm-code=posTag` 或 `data-hm-name=posTag` 查找元素，在元素后插入HTML

#### 功能说明

1. **在光标处插入**：当不提供 `posTag` 参数时，HTML内容会插入到当前光标位置
   - 如果光标在数据元内部，HTML会自动转换为纯文本插入
   - 如果光标在数据元外部，正常插入HTML内容

2. **在指定元素后插入**：当提供 `posTag` 参数时，会查找对应的元素并在元素后插入HTML
   - 首先通过 `data-hm-code=posTag` 查找元素
   - 如果未找到，则通过 `data-hm-name=posTag` 查找元素
   - 插入完成后，光标会定位到插入HTML之前（即元素后）

#### 使用示例

```javascript
// 示例1：在光标处插入HTML
HMEditor.insertHtml('<p>这是一段HTML内容</p>');

// 示例2：在指定元素后插入HTML
HMEditor.insertHtml('<p>插入的内容</p>', 'ELEMENT_CODE_001');

// 示例3：插入带样式的HTML
HMEditor.insertHtml('<div style="color: red;">红色文字</div>');

// 示例4：插入复杂HTML结构
HMEditor.insertHtml('<ul><li>项目1</li><li>项目2</li></ul>');
```

#### 注意事项

- 如果光标在数据元（如 `newtextbox`、`timebox` 等）内部，HTML内容会自动转换为纯文本插入，以保持数据元的完整性
- 如果未找到指定的定位元素（`posTag`），方法会返回 `false` 并在控制台输出警告信息
- 插入HTML后会自动触发 `togglePlaceHolder` 事件，确保占位符状态正确更新

### 20. deleteDocContent 方法

该方法用于删除聚合病历中的部分文档。支持传入单个文档编号或文档编号数组。删除时若当前仅剩一个文档则不允许删除；在批量删除过程中，一旦剩余文档数为 1 也会停止继续删除。

```javascript
/**
 * 删除聚合病历中部分文档
 * @param {String|Array} docCode 文档唯一编号，可以是单个值或数组
 * @returns {Boolean} 是否成功删除
 */
```

#### 参数详细说明

- `docCode`: 要删除的文档编号。可为单个字符串或字符串数组。
  - 单个文档：传入字符串，如 `'DOC_001'`
  - 多个文档：传入数组，如 `['DOC_001', 'DOC_002', 'DOC_003']`

#### 返回值

- 成功删除至少一个文档时返回 `true`
- 未删除任何文档（如当前仅剩一个文档、未找到对应文档等）时返回 `false`

#### 使用说明

- 当前聚合文档仅剩一个文档时，不允许删除，直接返回 `false`
- 批量删除时，每删完一个文档会检查剩余数量，若只剩一个文档则停止后续删除
- 非实时分页且删除第一个文档时，会将原文档的页眉移动到下一个文档
- 非实时分页且删除最后一个文档时，会将原文档的页脚移动到上一个文档；若上一个文档已有页脚会先删除再移动

#### 使用示例

```javascript
// 删除单个文档
HMEditor.deleteDocContent('DOC_001');

// 删除多个文档
HMEditor.deleteDocContent(['DOC_001', 'DOC_002', 'DOC_003']);
```

### 21. setShowTools / getShowTools 方法

该方法用于在编辑器已初始化后动态控制工具栏的显示与隐藏（不依赖初始化参数 showTools）。

```javascript
/**
 * 设置编辑器工具栏显示或隐藏
 * @param {Boolean} show 是否显示工具栏，true 显示，false 隐藏
 * @returns {Boolean} 设置是否成功
 */
setShowTools(show)

/**
 * 获取当前工具栏是否显示
 * @returns {Boolean} 当前工具栏是否显示
 */
getShowTools()
```

#### 使用示例

```javascript
// 隐藏工具栏
HMEditor.setShowTools(false);

// 显示工具栏
HMEditor.setShowTools(true);

// 查询当前状态
var visible = HMEditor.getShowTools();
```

初始化时可通过 `options.showTools` 控制工具栏初始是否显示；`setShowTools` / `getShowTools` 用于在运行过程中切换或查询工具栏显示状态。

### 22. setPrintPageBreakConfig 方法

设置打印另页/单独一页配置，支持按模板名称（pageAnotherTpls/pageAloneTpls）或文档编码 doc_code（pageAnotherCodes/pageAloneCodes）控制，仅合并传入的键，未传入的键保留原值。

```javascript
/**
 * @param {Object} options 打印分页配置
 * @param {Array} [options.pageAnotherTpls] 另页打印模板名称数组
 * @param {Array} [options.pageAloneTpls] 单独一页打印模板名称数组
 * @param {Array} [options.pageAnotherCodes] 另页打印文档编码（doc_code）数组
 * @param {Array} [options.pageAloneCodes] 单独一页打印文档编码数组
 */
HMEditor.setPrintPageBreakConfig({ pageAnotherCodes: ['DOC001'], pageAloneCodes: ['DOC002'] });
```

### 23. getSelectedElement / getSelectedContent 方法

用于在**当前选区**上下文获取数据元或选中片段，实现见 `extensions/base/js/fn.openApi.js`。

#### getSelectedElement

从选区起点向上查找最近的、带 `data-hm-code` 的数据元节点（`data-hm-node` 为 `labelbox` 的除外），取值规则与 **文档保存** 一致（内部委托 `documentModel.getDataElementObject`，传入原生 DOM 节点）。

```javascript
/**
 * 获取光标所在（或选区范围内）的数据元
 * @returns {Object|null} 含 keyCode、keyId、keyName、keyValue；无编辑器、无选区或未落在数据元上时返回 null
 */
HMEditor.getSelectedElement();
```

#### getSelectedContent

```javascript
/**
 * 获取当前选中的内容
 * @param {String} [type='html'] 'html' 返回 HTML；'text' 返回纯文本
 * @returns {String} 无选区时返回空字符串
 */
HMEditor.getSelectedContent('html');
HMEditor.getSelectedContent('text');
```

#### 使用示例

```javascript
var meta = HMEditor.getSelectedElement();
if (meta) {
  console.log(meta.keyCode, meta.keyName, meta.keyValue);
}

var html = HMEditor.getSelectedContent('html');
var text = HMEditor.getSelectedContent('text');
```

#### 说明

- `getSelectedElement` 与整份病历的 `getDocData` 不同：前者只反映**当前光标/选区**所落数据元。
- 若在集成页面对编辑器方法做 **AOP/日志挂钩**，请勿用 `async function` 包裹同步 API，否则会返回 `Promise`，与上述同步语义不一致。

### 24. setElementStyle 方法

按数据元编码（`data-hm-code`）在病历文档内查找对应节点并设置内联样式，通过 jQuery `css` 写入；与元素已有内联样式合并，同名属性覆盖。不处理 `data-hm-node="labelbox"` 的节点。

```javascript
/**
 * 按数据元编码设置数据元内联样式
 * @param {String} eleCode 数据元编码（与 DOM 上 data-hm-code 一致）
 * @param {Object} styles 样式对象（普通对象），语义与 jQuery.css(对象) 一致
 * @returns {Boolean} 是否至少更新了一个匹配节点
 */
```

#### 使用示例

```javascript
HMEditor.setElementStyle('DE08.10.013.00.012', { color: 'red', fontWeight: 'bold' });
```