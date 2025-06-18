# 开源编辑器说明文档

# 1、简介

## 1.1 HmEditor是什么

HmEditor是一款专为医疗行业设计的智能电子病历编辑器插件，结合CKeditor4文本编辑功能与自研人工智能技术，旨在为医院信息科和电子病历系统（EMR）厂商提供高效、灵活且智能化的病历编辑解决方案。它不仅支持多种病历模板的创建与编辑，还通过AI技术提升了病历生成的效率和准确性，同时具备强大的数据绑定能力以及与医疗信息系统无缝对接的特性。

## 1.2 为什么开源HmEditor

AI时代已到来，医疗行业急需智能化工具提升效率。然而，市面上多数编辑器闭源，数据标准不一，交互不规范，功能扩展受限，导致AI对接成本较大，且缺乏社区支持。开源HmEditor旨在打破这些局限，提供标准化数据元、统一接口和灵活定制能力，提供AI服务标准接口，降低开发成本。通过开源，我们希望汇聚开发者力量，共同推动医疗信息化发展，打造更高效、智能的病历编辑解决方案。

## 1.3 HmEditor特性

- 开源生态，遵循 LGPLv2.1，完全开源，开箱即用
- 丰富数据元组件：文本、时间、单选、多选、下拉、表格、图片、示意图等
- 原生JS开发，纯前端运行，易集成，支持多平台
- 智能病历编辑：修订、只读、水印、AI服务对接
- 支持信创，兼容国产操作系统

# 2、快速开始

## 2.1 部署

### 2.1.1 docker部署（建议方案）

1、安装docker和docker-compose

2、下载 docker-compose.yml

3、执行命令：docker-compose -f /path/to/docker-compose.prod.yml up -d

### 2.1.2 源码编译部署

1、下载hm_editor、hm_editor.service、hm_editor.admin.client

2、部署编辑器

进入hm_editor目录下执行一下命令：

-- 安装依赖包

npm install

-- 编译

grunt release

-- 启动

nodemon index.js

（如果不使用自带的数据元管理和模板制作功能，可跳过后续步骤）

3、安装mongodb4.0，并导入脚本。

4、安装后台管理后台部分

（确保已安装Java环境，本系统使用Java1.8）

进入hm_editor.service目录下执行以下命令：

-- 编译

mvn clean compile

-- 启动

-- 修改配置文件application.yml中的数据库地址

cd admin-service

mvn spring-boot:run

5、安装后台管理前端

（确保已安装node环境，本系统使用node14.18）

进入hm_editor.admin.client目录执行以下命令：

-- 安装依赖包

npm install

-- 启动

npm start

6、安装Nginx，统一端口来转发服务

修改配置文件nginx.conf，启动nginx。

## 2.2 页面

部署完成后可以打开以下两个页面试用系统。

1、编辑器SDK演示：http://127.0.0.1:7070/hmEditor/demo/index.html

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/2M9qP5joJg2VDO01/img/48c0c6d1-cdba-4afc-a281-ec6f0604fac3.png)

2、后台管理演示：https://127.0.0.1:7070/hmEditor/admin-client

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/2M9qP5joJg2VDO01/img/25739da6-d9ba-4235-aa72-c6fc17c2dc8c.png)

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/2M9qP5joJg2VDO01/img/0ecb5b26-c43d-4f44-9622-9a62e3cc330f.png)

## 2.3 对接

#### 1. 引入SDK核心文件

在HTML页面头部引入HMEditor的iframe加载器：

```html
<script src="http://ip:port/hmEditor/iframe/HmEditorIfame.js"></script>
```

#### 2. 创建编辑器实例

```javascript
HMEditorLoader.createEditorAsync({
    container: "#editorContainer",
    sdkHost: "https://your-domain.com/static",
    // 模式设置
    designMode: false,  // 是否启用设计模式
    reviseMode: false,  // 是否启用修订模式
    readOnly: true,     // 是否启用只读模式
})
.then(function(result) {
    // 编辑器初始化完成
    var editorId = result.id;
    var editorInstance = result.instance;

    // 执行编辑器操作
    // 调用editorInstance方法完成文档操作
    // 例如：editorInstance.setContent("<p>编辑器内容</p>");
})
.catch(function(error) {
    console.error("编辑器初始化失败:", error);
});
```

#### 3. 实例获取与操作

```javascript
HMEditorLoader.getEditorInstanceAsync(editorId)
    .then(editor => {
        // 基础操作
        editor.setDocContent({ /* 文档内容对象 */ });

        // 高级操作示例
        editor.execCommand("bold");               // 执行加粗命令
        editor.insertDataAtCursor("新插入内容");  // 光标位置插入文本
        editor.downloadPdf();                     // 导出PDF
    })
    .catch(error => console.error(error));
```

#### 4. 核心功能实现

##### 4.1 文档内容管理

```javascript
// 设置完整文档内容
editor.setDocContent({
    code: 'doc001',
    docTplName: '病历模板',
    docContent: '<p>患者姓名：<span data-key="name">张三</span></p>',
    data: [
        { keyCode: 'name', keyValue: '李四' }
    ]
});

// 在指定位置插入新文档
editor.insertDocContent(1, [
    {
        code: 'doc002',
        docTplName: '检查报告',
        docContent: '<p>体温：36.5℃</p>'
    }
]);
```

##### 4.2 功能扩展(水印、只读)

```javascript
// 添加自定义菜单
editor.addCustomMenu([
    {
        label: '插入签名',
        onClick: () => editor.insertImageAtCursor({ src: '/signature.png' })
    }
]);

// 设置文档水印
editor.setDocWatermark({
    text: '张三-XX人民医院',
    color: '#999',
    opacity: 0.3
});
```

##### 4.3 获取病历内容

##### 4.3.1获取文档HTML

**方法名**：`getDocHtml(code)`

**参数**：

*   `code`：字符串类型，文档唯一编号。


**功能**：根据文档编号获取对应文档的HTML内容。

**示例**：

```javascript
var docHtml = editorInstance.getDocHtml('doc001');
```

**返回格式**：
返回一个数组，包含一个对象，对象结构如下：

```javascript
[
  {
    code: '文档唯一编号',  // 文档编号
    html: '文档html文本'   // 文档的HTML内容
  }
]
```

##### 4.3.2 获取文档数据元值

**方法名**：`getDocData(code, keyList)`

**参数**：

*   `code`：字符串类型，文档唯一编号。

*   `keyList`：数组类型，指定需要获取的数据元键（如`['name', 'age']`）。


**功能**：根据文档编号和指定的数据元键列表，获取对应文档的结构化数据元信息。

**示例**：

```javascript
var docData = editorInstance.getDocData('doc001', ['name', 'age']);
```

**返回格式**：
返回一个数组，包含一个对象，对象结构如下：

```javascript
[
  {
    code: '文档唯一编号',  // 文档编号
    data: [
      {
        keyCode: '数据元编码',    // 数据元唯一编码
        keyValue: '数据元内容或数据元内容数组', // 数据元内容（可能为字符串或数组）
        keyId: '数据元id',       // 数据元标识符
        keyName: '数据元名称'     // 数据元显示名称
      },
      ... // 其他数据元对象
    ]
  }
]
```

**说明**：

*   `keyValue`字段的值类型取决于数据元定义，可能为字符串或数组。

*   若`keyList`未指定或为空，可能返回所有数据元（需根据实际实现逻辑确认）。


##### 4.4 其他常用方法

|  操作类型  |  方法名  |  主要用途  |
| --- | --- | --- |
|  内容操作  |  `setDocContent`  |  初始化或更新文档内容  |
|   |  `insertDocContent`  |  在指定位置插入新文档  |
|   |  `getDocHtml`  |  获取文档HTML内容  |
|   |  `getDocData`  |  或去病历数据元值  |
|  功能控制  |  `setDocReadOnly`  |  设置文档只读状态  |
|   |  `downloadPdf`  |  导出PDF文件  |
|  扩展功能  |  `addCustomMenu`  |  添加自定义菜单项  |
|   |  `execCommand`  |  执行编辑器原生命令  |

全部方法请参考API文档(https://editor.huimei.com/)

# 4、演示环境

暂时无法自行部署的，请移步演示环境：

编辑器SDK演示：https://editor.huimei.com/hmEditor/demo/index.html

后台管理演示：https://editor.huimei.com/hmEditor/admin-clint

# 5、二次开发

- 开发流程介绍详见：[开发流程介绍](hmEditor/开发流程介绍.md)
- 编辑器基础接口说明详见：[接口说明](hmEditor/extensions/base/README.MD)

# 6、开源协议

惠每电子病历编辑器遵循 LGPLv2.1 开源许可协议，该协议以其宽松特性著称。基于此协议，EMR（电子病历系统）厂商与医疗机构信息科技术人员可便捷地通过软件接口对接方式自由使用该编辑器；同时，我们诚挚欢迎广大开发者积极参与代码贡献，共同推动产品迭代升级。

## 6.1 License声明

Copyright (c) 2025-2026 惠每云 HMCLOUD, All rights reserved.

This software is licensed under The GNU Lesser General Public License version 2.1 (LGPLv2.1) (the "License"). You may not use this file except in compliance with the License. You may obtain a copy of the License at

[https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Important Note:

The above is a brief reference statement. In practice, when using the GNU Lesser General Public License (LGPL), you should include the full text of the LGPLv3 license in your software distribution. The LGPL is designed to allow linking with non-GPL (and non-LGPL) software under certain conditions, which is different from the GPL. Always consult the official LGPL documentation and legal advice if you have specific licensing questions or needs.

# 7、bug反馈

开源平台自带issue平台（https://github.com/huimeicloud/issue） 【待开放】

# 8、使用交流

钉钉群号： 81935038067

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/2M9qP5joJg2VDO01/img/910afe1a-efe9-4296-aedd-f6d3c16aa6da.png)
