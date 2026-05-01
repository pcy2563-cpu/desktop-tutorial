# 浅显简历平台

浅显简历平台是一个在线简历编辑与 AI 辅助优化系统，支持简历填写、模板切换、实时预览、PDF 导出、邀请码注册、管理员 API 配置和小米 Token Plan AI 润色。

## 核心功能

- 在线填写简历信息，覆盖基础信息、教育经历、项目经历、专业技能等内容。
- 多套简历模板，可切换不同排版风格。
- 实时预览简历效果，减少反复导出查看的成本。
- 支持 PDF 导出，方便投递或保存。
- 登录后可使用 AI 润色、语法纠错等功能。
- 管理员可配置 AI API Key、模型 ID、接口地址和邀请码。
- 普通用户使用邀请码注册，账号密码可自行设置。
- 项目适配 `/magic-resume/` 子路径部署，可与其他网站区分开。

## 技术组成

- React + TypeScript
- TanStack Start
- Tailwind CSS + shadcn/ui + Radix UI
- Zustand
- Tiptap
- Framer Motion
- Node.js Server Routes
- 小米 Token Plan 兼容 OpenAI Chat Completions API

## 快速开始

```bash
pnpm install
pnpm dev
```

浏览器访问：

```text
http://localhost:3000
```

## 初始化平台数据

首次部署需要先创建管理员和邀请码：

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password INVITE_CODE=QX-DEMO pnpm init:platform
```

PowerShell 示例：

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="your-password"
$env:INVITE_CODE="QX-DEMO"
pnpm init:platform
```

默认数据文件：

```text
.data/platform.json
```

生产环境建议使用：

```bash
MAGIC_RESUME_DATA_DIR=/home/ubuntu/magic-resume-data
```

## 构建部署

```bash
pnpm build
pnpm start
```

如果部署在 `/magic-resume/`：

```bash
MAGIC_RESUME_BASE_PATH=/magic-resume pnpm build
MAGIC_RESUME_BASE_PATH=/magic-resume pnpm start
```

## 目录说明

```text
src/app          页面入口
src/components   页面与业务组件
src/routes/api   服务端 API
src/lib/server   登录、邀请码、AI 配置等服务端逻辑
src/store        前端状态管理
public           静态资源
scripts          初始化脚本
```

## 安全提醒

- 不要提交 `.data/platform.json`。
- 不要提交真实 API Key、服务器密码、用户密码。
- 管理员 API Key 只保存在服务端，前端只展示脱敏信息。
