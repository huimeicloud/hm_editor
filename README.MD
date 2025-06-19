# 惠每电子病历编辑器 HmEditor

[![License: LGPL v2.1](https://img.shields.io/badge/License-LGPL%20v2.1-blue.svg)](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html)
![Java](https://img.shields.io/badge/Java-1.8-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.6.14-brightgreen)
![MongoDB](https://img.shields.io/badge/MongoDB-4.0%2B-green)

> 集成AI、满足信创、开源的医疗电子病历编辑器

---

## 目录
- [惠每电子病历编辑器 HmEditor](#惠每电子病历编辑器-hmeditor)
  - [目录](#目录)
  - [项目简介](#项目简介)
  - [特性亮点](#特性亮点)
  - [快速开始](#快速开始)
    - [1. Docker 部署（推荐）](#1-docker-部署推荐)
    - [2. 源码编译部署](#2-源码编译部署)
    - [3. 访问页面](#3-访问页面)
  - [示例代码](#示例代码)
  - [在线演示](#在线演示)
  - [文档与二次开发](#文档与二次开发)
  - [开源协议](#开源协议)
  - [反馈与交流](#反馈与交流)

---

## 项目简介

HmEditor 是一款专为医疗行业设计的智能电子病历编辑器插件，结合 CKEditor4 文本编辑功能与自研 AI 技术，为医院信息科和 EMR 厂商提供高效、灵活、智能化的病历编辑解决方案。支持多种病历模板创建与编辑，具备强大的数据绑定能力，并可与医疗信息系统无缝对接。

---

## 特性亮点
- **完全开源**，LGPLv2.1 协议，开箱即用
- 丰富数据元组件：文本、时间、单选、多选、下拉、表格、图片、示意图等
- 原生 JS 开发，纯前端运行，易集成，支持多平台
- 智能病历编辑：修订、只读、水印、AI 服务对接
- 支持信创，兼容国产操作系统

---

## 快速开始

### 1. Docker 部署（推荐）
```bash
# 安装 docker 和 docker-compose
# 下载 docker-compose.yml
# 启动服务
$ docker-compose -f /path/to/docker-compose.prod.yml up -d
```

### 2. 源码编译部署
```bash
# 下载 hm_editor、hm_editor.service、hm_editor.admin.client
# 进入 hm_editor 目录
npm install         # 安装依赖
grunt release       # 编译
nodemon index.js    # 启动
```

### 3. 访问页面
- 编辑器 SDK 演示：[http://127.0.0.1:7070/hmEditor/demo/index.html](http://127.0.0.1:7070/hmEditor/demo/index.html)
- 后台管理演示：[http://127.0.0.1:7070/hmEditor/admin-client](http://127.0.0.1:7070/hmEditor/admin-client)

---

## 示例代码

只需 15 行核心代码即可集成：
```html
<script src="https://editor.huimei.com/hmEditor/iframe/HmEditorIfame.js"></script>
<div id="editorContainer" style="width:850px;height:500px;"></div>
<script>
HMEditorLoader.createEditorAsync({
  container: "#editorContainer",
  sdkHost: "https://editor.huimei.com/hmEditor"
}).then(function(editor) {
  editor.setDocContent({
    code: 'doc001',
    docTplName: '测试病历名称',
    docContent: '...'
  });
});
</script>
```
> 更多 API 及用法详见 [官方文档](https://editor.huimei.com/)

---

## 在线演示
- [编辑器 SDK 演示](https://editor.huimei.com/hmEditor/demo/index.html)
- [后台管理演示](https://editor.huimei.com/hmEditor/admin-client)

---

## 文档与二次开发
- [开发流程介绍](hmEditor/开发流程介绍.md)
- [基础接口说明](hmEditor/extensions/base/README.MD)

---

## 开源协议

本项目遵循 [LGPLv2.1](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html) 协议，允许自由使用、修改和分发。

---

## 反馈与交流
- 问题反馈：GitHub Issue（即将开放）
- 钉钉交流群：81935038067

![钉钉群二维码](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/2M9qP5joJg2VDO01/img/910afe1a-efe9-4296-aedd-f6d3c16aa6da.png)

---

> © 2025-2026 惠每云 HMCLOUD. 保留所有权利。
