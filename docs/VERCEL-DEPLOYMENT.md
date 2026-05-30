# Vercel 部署指南

## 前置要求
- GitHub 账户和仓库
- Vercel 账户 (https://vercel.com)
- Supabase 项目已配置

## 第 1 步：准备代码库

### 1.1 提交所有更改到 Git
```bash
cd "d:\sunbase\project Swap-supabase-backup"
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 验证环境变量文件
在项目根目录创建 `.env.local.example`（用于文档）：
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**注意：不要提交实际的密钥到 Git**

---

## 第 2 步：在 Vercel 上部署

### 2.1 导入项目
1. 访问 https://vercel.com/dashboard
2. 点击 **Add New...** → **Project**
3. 选择你的 GitHub 仓库 `project-swap` 或相关仓库
4. Vercel 会自动检测为 Next.js 项目

### 2.2 配置环境变量
1. 在 **Environment Variables** 部分：
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** 从 Supabase Settings 复制 Project URL
   
2. 再添加一个环境变量：
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** 从 Supabase Settings 复制 Anon/Public Key

### 2.3 部署设置
- **Framework:** Next.js （自动选择）
- **Build Command:** `npm run build` （自动检测）
- **Output Directory:** `.next` （自动检测）
- **Install Command:** `npm install` （自动检测）

点击 **Deploy** 按钮开始部署

---

## 第 3 步：Supabase 配置

### 3.1 启用 Email 认证
1. 进入 Supabase Studio
2. **Authentication** → **Providers** → **Email**
3. 启用以下选项：
   - ✅ Confirm email
   - ✅ Auto-confirm users （这样验证后会自动登入）
4. 配置邮件发送者 (可选使用自己的 SMTP)

### 3.2 配置 RLS 策略
1. **SQL Editor** → 新建 Query
2. 复制 `docs/supabase-rls-policies.sql` 中的所有 SQL 语句
3. 执行以启用数据安全

### 3.3 配置 CORS (如果需要)
如果从不同域名调用 Supabase API：
1. **Project Settings** → **API**
2. 添加你的 Vercel 部署 URL 到 CORS 允许列表

---

## 第 4 步：验证部署

### 4.1 检查部署状态
1. Vercel 会显示部署进度
2. 成功后会生成 URL，格式如：`https://project-swap.vercel.app`

### 4.2 测试应用
1. 访问部署的 URL
2. 测试完整流程：
   - 注册新账户
   - 接收验证邮件
   - 点击验证链接
   - 登入
   - 完成 onboarding

### 4.3 检查生产日志
1. 在 Vercel 仪表板点击项目
2. **Deployments** → 选择最新部署
3. **Logs** 标签查看实时日志

---

## 常见问题排查

### 问题 1：环境变量未加载
**解决方案：**
- 确保环境变量名以 `NEXT_PUBLIC_` 开头（前端可见）
- 重新部署以应用环境变量更改

### 问题 2：数据库连接失败
**解决方案：**
- 验证 Supabase URL 和 Anon Key 正确
- 确保 Supabase 项目状态为 "Active"
- 检查 CORS 设置

### 问题 3：邮件验证不工作
**解决方案：**
- 在 Supabase 中确认 Email Provider 已启用
- 检查"Auto-confirm users"是否开启
- 查看 Supabase Auth 日志

### 问题 4：部署后出现 404
**解决方案：**
- 确保 `src/app/not-found.tsx` 存在
- Vercel 会自动处理，重新部署

---

## 回滚部署

如果需要回滚到之前的版本：
1. **Deployments** 标签
2. 找到之前的部署
3. 点击 **Promote to Production**

---

## 性能优化建议

### 1. 启用 Vercel Analytics
- 在项目 **Settings** 中启用
- 可以查看 Web Vitals 和用户体验指标

### 2. 配置缓存
- 已在 `next.config.ts` 中配置
- 静态资源 1 年过期
- API 响应不缓存

### 3. 启用 ISR (增量静态再生)
- 在需要的页面导出 `revalidate` 参数
- 例：`export const revalidate = 3600;` （1 小时重新生成）

### 4. 启用 CDN
- Vercel 自动使用全球 CDN
- 无需额外配置

---

## 自定义域名（可选）

1. **Settings** → **Domains**
2. 添加你的域名
3. 按照说明更新 DNS 记录
4. Vercel 会自动配置 SSL 证书

---

## 监控和维护

### 查看实时日志
```bash
# 使用 Vercel CLI（需要安装）
vercel logs [deployment-url]
```

### 设置告警
1. **Settings** → **Alerts**
2. 配置部署失败、性能告警等

### 自动部署
- Vercel 会监听 Git 仓库
- 每次 push 到主分支自动部署
- 其他分支会生成 Preview URL

---

## 部署完成检查清单

- [ ] Git 仓库已同步
- [ ] Vercel 项目已创建
- [ ] 环境变量已配置
- [ ] Supabase 已配置
- [ ] RLS 策略已启用
- [ ] 测试注册流程
- [ ] 测试邮件验证
- [ ] 测试登入
- [ ] 检查浏览器控制台无错误
- [ ] 检查网络标签无 4xx/5xx 错误
- [ ] 性能指标正常

---

有问题？查看 Vercel 文档：https://vercel.com/docs
