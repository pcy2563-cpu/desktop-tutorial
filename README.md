# 浅显简历平台

浅显简历平台是一个面向个人求职场景的在线简历编辑系统，基于 Magic Resume 二次改造。项目保留了简历模板、实时预览、PDF 导出等核心能力，并新增账号登录、邀请码注册、管理员 API 配置、小米 Token Plan AI 润色/纠错接入和独立部署适配。

线上部署示例：`https://qianxian.site/magic-resume/`

## 功能介绍

- 简历编辑：支持基础信息、教育经历、项目经历、专业技能等模块化填写。
- 实时预览：编辑区与预览区联动，修改内容后可即时查看简历效果。
- 多模板：内置经典、现代、极简、时间线等多种简历模板。
- PDF 导出：支持将当前简历导出为 PDF 文件。
- AI 润色：登录后可使用 AI 对简历内容进行优化、纠错和表达调整。
- 会员/账号基础能力：普通用户可通过邀请码注册，账号密码自定义。
- 管理员能力：管理员可维护 AI API Key、模型 ID、接口地址和邀请码。
- 安全存储：API Key 只保存在服务端本地数据文件中，前端只展示脱敏信息。
- 响应式界面：适配桌面端与移动端，首页采用简洁网格、动效标题和黑黄视觉风格。

## 技术栈

- 前端框架：React、TanStack Start、TypeScript
- 样式与组件：Tailwind CSS、shadcn/ui、Radix UI、Lucide Icons
- 状态管理：Zustand
- 富文本能力：Tiptap
- 动效：Framer Motion、CSS Animation
- AI 接口：兼容 OpenAI Chat Completions 协议的小米 Token Plan
- 服务端：TanStack Start Server Routes、Node.js
- 数据存储：本地 `.data/platform.json`

## 本地运行

请先安装 Node.js 与 pnpm。

```bash
pnpm install
pnpm dev
```

启动后访问：

```text
http://localhost:3000
```

## 初始化管理员和邀请码

新部署时系统没有默认管理员。请使用下面命令生成管理员账号、初始邀请码和本地平台数据文件：

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password INVITE_CODE=QX-DEMO pnpm init:platform
```

Windows PowerShell 示例：

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="your-password"
$env:INVITE_CODE="QX-DEMO"
pnpm init:platform
```

生成的数据默认保存在：

```text
.data/platform.json
```

如果部署到服务器，建议把数据目录放到项目外部，并通过环境变量指定：

```bash
MAGIC_RESUME_DATA_DIR=/home/ubuntu/magic-resume-data
```

## AI 配置方式

管理员登录后进入 AI 配置页面，填写：

```text
API Key：小米 Token Plan 的专属 API Key
接口地址：https://api.xiaomimimo.com/v1
模型 ID：mimo-v2-flash
```

普通用户必须登录后才能使用 AI 润色、AI 纠错等消耗接口的功能；游客仍可使用简历编辑、预览等基础功能。

## 构建部署

生产构建：

```bash
pnpm build
```

启动服务：

```bash
pnpm start
```

如果网站部署在子路径，例如 `/magic-resume/`，构建和启动时需要配置：

```bash
MAGIC_RESUME_BASE_PATH=/magic-resume pnpm build
MAGIC_RESUME_BASE_PATH=/magic-resume pnpm start
```

Nginx 可将 `/magic-resume/` 反向代理到 Node 服务端口。生产环境还建议使用 PM2 守护进程。

## 目录说明

```text
src/app                 页面入口与全局布局
src/components          页面组件、简历编辑组件、首页组件
src/routes/api          登录、注册、AI、管理员等服务端接口
src/lib/server          服务端账号、会话、邀请码、AI 配置逻辑
src/store               前端状态管理
src/i18n                中英文文案
scripts                 项目辅助脚本
public                  静态资源、图标和模板预览图
```

## 注意事项

- 不要把 `.data/platform.json`、真实 API Key、服务器密码提交到 GitHub。
- `.env`、`.data/`、构建产物和测试截图已经加入 `.gitignore`。
- 本项目基于开源项目二次改造，继续遵循仓库中的 `LICENSE` 许可说明。
