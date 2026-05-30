# Supabase 迁移指南

## 1. 目标
将项目后端从 Firebase 迁移到 Supabase，并保持现有前端逻辑可用。当前项目主要使用：
- Firebase Auth
- Firestore 实时查询
- Firebase 客户端 SDK

迁移到 Supabase 需要完成三个阶段：
1. Supabase 客户端接入
2. Supabase 表结构和数据模型建立
3. 逐页替换 Firebase 查询与认证逻辑

---

## 2. Supabase 环境配置
在 `.env.local` 中新增：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

> `SUPABASE_SERVICE_ROLE_KEY` 仅用于服务端迁移或后台作业，不应在客户端公开。

---

## 3. 建议表结构映射
### Firestore -> Supabase 表映射
- `users` -> `profiles`
- `items` -> `items`
- `reviews` -> `reviews`
- `transactions` -> `transactions`
- `swapRequests` -> `swap_requests`
- `users/{uid}/favorites` -> `favorites`

### 核心字段建议
- `profiles`: `id`, `display_name`, `photo_url`, `points`, `reputation`, `completed_swaps`, `member_since`
- `items`: `id`, `title`, `description`, `points`, `category`, `condition`, `image_url`, `seller_id`, `seller_name`, `seller_rating`, `posted_date`, `is_public`, `location_lat`, `location_lng`, `location_city`, `status`, `views`, `likes`
- `swap_requests`: `id`, `item_id`, `item_title`, `item_image_url`, `message`, `points`, `sender_id`, `sender_name`, `receiver_id`, `receiver_name`, `status`, `created_at`

---

## 4. 迁移方案
### 4.1 建立 Supabase 项目
- 登录 Supabase 控制台
- 创建 `epohhwawaaopxibhslck` 项目
- 在 `Table Editor` 中创建上述表
- 配置 `Auth` 提供者（Email/Password 或 Magic Link）

### 4.2 数据迁移
- 使用 Supabase SQL 或官方命令行导入 Firestore 导出的数据
- 或者手动编写脚本读取 Firestore 内容并写入 Supabase

### 4.3 代码迁移
当前项目大部分后端访问集中在：
- `src/firebase/index.ts`
- `src/firebase/provider.tsx`
- `src/firebase/firestore/*`
- `src/app/**/*.tsx` 中对 Firestore 的 `collection`, `query`, `doc` 等调用

推荐迁移路径：
1. 先接入 Supabase 客户端
2. 按页面逐步替换 `useFirestore`、`useCollection`、`useDoc` 为 `useSupabase` / 直接 `supabase.from(...).select()`
3. 将认证流程从 Firebase Auth 替换为 Supabase Auth

---

## 5. 已添加的 Supabase 支持层
已新增文件：
- `src/supabase/config.ts`
- `src/supabase/client.ts`
- `src/supabase/provider.tsx`
- `src/supabase/hooks.ts`

你可以先在 `src/app/layout.tsx` 将 `FirebaseClientProvider` 替换为 `SupabaseProvider`，并使用 `useSupabase()` 开始查询。

---

## 6. 注意事项
- Supabase 默认不支持 Firebase 风格的匿名登录，需改为 Email/Login 或魔法链接。
- Firestore 的数组/嵌套查询需要重新映射为 Postgres 表结构。
- 若使用实时更新，请改为 Supabase 的 `supabase.channel(...).on(...)` 实时订阅。

---

## 7. 下一步建议
1. 在 Supabase 控制台创建表结构
2. 复制 `.env.local.example` 中的 Supabase 变量并填写
3. 先将 `src/firebase` 依赖保留，建立 `src/supabase` 并逐页替换访问逻辑
4. 完成核心业务后，再一次性移除 `src/firebase` 旧依赖
