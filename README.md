# 邻里交换 (SwapNorge) - 发布指南

您的应用已经开发完成，现在可以按照以下步骤发布到线上：

## 方式一：Firebase App Hosting (推荐)
这是部署 Next.js 15 的最佳方式，支持自动构建。

1. **将代码推送到 GitHub**：将此项目上传到您的 GitHub 仓库。
2. **在控制台创建**：前往 [Firebase 控制台](https://console.firebase.google.com/)。
3. **选择 App Hosting**：在左侧菜单点击“构建” -> “App Hosting”。
4. **关联仓库**：点击“开始使用”，关联您的 GitHub 仓库，选择分支。
5. **自动部署**：每次您推送代码到 GitHub，Firebase 都会自动重新部署您的网站。

## 方式二：命令行手动部署 (传统 Hosting)
如果您想直接从本地部署：

1. **安装工具**：确保安装了 `npm install -g firebase-tools`。
2. **登录**：执行 `firebase login`。
3. **初始化**：执行 `firebase init hosting` (如果尚未初始化)。
4. **部署**：执行 `firebase deploy`。

## 检查清单
- [ ] 确保在控制台开启了 **Authentication** (启用匿名登录和邮箱登录)。
- [ ] 确保在控制台开启了 **Cloud Firestore**。
- [ ] 确保安全规则已通过部署更新。

---
祝您的邻里社区蓬勃发展！