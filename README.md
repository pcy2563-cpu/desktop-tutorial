# 浅显通校园论坛 Vue 主站版

这是当前部署在 `https://qianxian.site/` 的 Vue 测试版校园论坛主站。

本分支只保留当前主站版本，和旧版 PHP/静态论坛分开管理：

- Vue 主站版：`codex/forum-vue-main-20260517`
- 旧版 PHP/静态论坛：`codex/forum-php-legacy-20260517`

## 技术结构

- 前端：Vue 3、Vite、Vue Router、Pinia
- 后端：PHP API
- 数据库：MySQL
- 部署：Nginx、PHP-FPM、宝塔面板

说明：这里的“Vue 版”指前端主站使用 Vue SPA；后端接口仍然是 PHP，因此 `api/` 目录仍然保留。

## 目录说明

```text
.
├── index.html          # Vue SPA 入口
├── assets/             # Vite 打包后的前端资源
├── api/                # PHP 后端接口
├── favicon.svg         # 网站图标
├── icons.svg           # 图标资源
└── README.md
```

## 不提交的内容

以下内容属于服务器私有配置或用户上传数据，不应提交到 GitHub：

- `api/config.php`
- `.env`
- `uploads/`
- `.well-known/`
- 任何备份文件和服务器临时文件

部署时需要根据 `api/config.example.php` 创建 `api/config.php`，填写数据库连接信息。

## 当前功能

- 首页帖子信息流
- 发帖、匿名发布、图片展示
- 评论、点赞、帖子详情
- 我的帖子、收到回复、点赞过、站内通知
- 行为画像与数据分析
- 管理员公告、轮播、用户管理、举报处理
- PHP API 权限校验、敏感词检查、管理员操作日志

## 部署说明

1. 将本分支内容上传到网站根目录。
2. 复制 `api/config.example.php` 为 `api/config.php`。
3. 填写 MySQL 连接信息。
4. 确保 `uploads/` 目录可写。
5. Nginx 根目录指向本项目目录。
6. 访问 `https://qianxian.site/`。

如果使用 Vue Router history 模式，Nginx 需要把前端路由回退到 `index.html`。
