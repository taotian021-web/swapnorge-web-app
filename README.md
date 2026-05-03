
# 邻里交换 (SwapNorge) - 发布与测试指南

您的应用已经开发完成，可以立即部署到 Firebase 后端和 Vercel 前端。

## 推荐部署架构
- 后端：Firebase
  - Firestore
  - Authentication
  - Storage
- 前端：Vercel
  - 原生支持 Next.js
  - 自动部署与分支预览
  - 与 Firebase 兼容良好

## 1. 本地验证
1. 进入项目目录：
   - `cd "d:\二手交易平台\project Swap"`
2. 安装依赖：
   - `npm install`
3. 启动本地开发：
   - `npm run dev`
4. 测试构建：
   - `npm run build`

## 2. Firebase 后端部署
1. 登录 Firebase：
   - `npx firebase login`
2. 如果还没有初始化 Firebase：
   - `npx firebase init`
   - 选择 Firestore、Authentication、Storage（如需要）
3. 部署后端配置：
   - `npx firebase deploy --only firestore:rules,storage:rules`
   - 如果使用 Firebase Hosting：`npx firebase deploy --only hosting`
4. 确认 Firebase 控制台：
   - Firestore 数据库已创建
   - Authentication 已启用
   - Storage 已部署（如果需要上传图片/文件）

## 3. Vercel 前端部署
1. 登录 Vercel：
   - 打开 `https://vercel.com`
2. 连接 GitHub 仓库并导入项目 `project Swap`
3. 构建设置：
   - Build Command: `npm run build`
   - 输出目录：Vercel 会自动识别 Next.js
4. 配置环境变量（推荐）
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
5. 部署并访问生成的网址

## 4. 关键检查点
- 本地构建通过：`npm run build`
- Firebase 后端已正常部署
- Vercel 上的前端能正常加载并连接 Firebase
- 数据读写、认证和存储功能正常

## 5. 运行时环境
本项目已经支持从环境变量读取 Firebase 配置。您可以复制 `.env.local.example` 为 `.env.local`，用于本地开发。

---
祝您的邻里社区上线顺利！
