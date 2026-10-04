# OVYLOX

**Little eggs. Big beginnings.**

面向 Solana 社区的像素角色孵化与代币创意准备工作室。包含完整官网、原创角色素材、可运行的静态前端，以及单独保留的云端收藏后端源码。

## 直接发布

仓库根目录的 `index.html` 和 `assets/` 已构建，可直接静态托管，不需要环境变量或密钥。

### GitHub Pages

1. 打开仓库 **Settings → Pages**。
2. 在 **Build and deployment** 中选择 **Deploy from a branch**。
3. 选择 **main** 分支、**/ (root)**，点击 **Save**。
4. 等待 GitHub 的 Pages 部署完成。默认地址为 `https://ghostxrun.github.io/OVYLOX/`。
5. 要绑定自己的域名，在同一页填写 **Custom domain**，按 GitHub 的提示配置 DNS；证书就绪后启用 HTTPS。

当前没有写入 CNAME，域名由项目所有者设置。所有前端资源使用相对路径，兼容仓库子路径和独立域名；页面通过 `#/` 路由切换，不依赖服务器重写规则。

其他静态托管商也可以使用根目录成品。若平台需要构建命令，使用 `npm ci && npm run build:pages`，发布目录为仓库根目录。

## 已实现

- 品牌首页、官方项目信息、16 个角色的搜索与分类、使用教程、FAQ、隐私和使用说明。
- 每设备 20 分钟内 5 次随机孵化，也可直接选择任意角色。
- 名称、ticker、故事、社交链接、背景颜色编辑与实时预览。
- 1024×1024 PNG 下载、详情复制、JSON 草稿导出和导入。
- 当前浏览器内的作品保存、编辑、搜索、收藏和确认删除，最多 200 个。
- 响应式布局、手机菜单、明暗主题、键盘焦点和减少动态效果支持。
- 可选 Solana 钱包连接，显示地址；不签名或提交交易。
- 跳转 pump.fun 官方创建页面。图片和详情由用户在该平台手动上传、填写。

**静态版存储边界：** 收藏通过 localStorage 保存在当前浏览器和当前域名下，不跨设备同步。清理网站数据会删除收藏；换域名之前请导出草稿，再在新域名导入。保存角色不会发行代币，也不会占用名称或 ticker。

## 开发与修改

需要 Node.js **22.18+** 和 npm。

```bash
npm ci
npm run build:pages
npm test
```

使用任意静态 HTTP 服务器预览仓库根目录。修改 `src/` 后重新执行 `npm run build:pages`，同时提交更新后的 `index.html` 与 `assets/`。CI 会运行存储测试并检查提交的静态成品是否与源码一致。

项目公开信息统一在 `src/assets/js/config.js` 配置：

| 字段 | 用途 |
| --- | --- |
| `mint` | 官方 Solana 合约地址；当前为空，页面显示尚未公布 |
| `x` | 官方 X 用户名，不带 `@`；当前为空 |
| `telegram` | 官方 Telegram 的完整 HTTPS 链接；当前为空 |
| `pumpCreateUrl` | 默认 `https://pump.fun/create` |

## 云端收藏源码

`worker/api.js`、`db/`、`drizzle/` 和 `npm run build` 保留原有 Worker + D1 版本。GitHub Pages 不运行这个后端，静态版也不会调用 `/api/`。

原平台的认证代理、数据库绑定、迁移和开发说明见 [docs/cloud-backend.md](docs/cloud-backend.md)。迁移后端到其他平台必须接入自己的服务端认证，不能直接信任公网请求中的用户身份头。

## 目录

| 路径 | 内容 |
| --- | --- |
| `index.html`、`assets/` | 可直接发布的静态网站 |
| `src/` | 前端源码、样式、品牌 Logo 和角色素材 |
| `scripts/build-pages.mjs` | GitHub Pages / 静态站构建 |
| `scripts/build.mjs` | 原 Worker + D1 版本构建 |
| `worker/`、`db/`、`drizzle/` | 云端 API、数据库定义和迁移 |
| `scripts/test-*.mjs` | 云端和浏览器存储适配器测试 |

随机孵化是角色创作体验；没有稀有度价值、收益承诺或链上资产生成。
