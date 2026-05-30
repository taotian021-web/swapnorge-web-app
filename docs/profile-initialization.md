# Supabase Profile 表结构和初始化指南

## 📋 表结构检查清单

### profiles 表应该包含以下列

```sql
-- 创建profiles表的SQL (参考)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  uid TEXT NOT NULL,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  email TEXT,
  stats JSONB DEFAULT '{"points": 100, "reputation": 5.0, "completedSwaps": 0, "memberSince": null}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 字段说明

| 字段 | 类型 | 说明 | 必需 |
|-----|------|------|-----|
| id | UUID | 用户ID (来自auth.users) | ✅ |
| uid | TEXT | 用户UID标识 | ✅ |
| display_name | TEXT | 显示名称 | ✅ |
| photo_url | TEXT | 头像URL | ❌ |
| email | TEXT | 邮箱地址 | ❌ |
| stats | JSONB | 用户统计数据 | ✅ |
| created_at | TIMESTAMP | 创建时间 | ✅ |
| updated_at | TIMESTAMP | 更新时间 | ✅ |

### stats JSONB 结构

```json
{
  "points": 100,
  "reputation": 5.0,
  "completedSwaps": 0,
  "memberSince": "2026-05-16T00:00:00Z"
}
```

## 🔄 初始化流程

### 1. 游客登录流程
```
用户点击 "开始" → ensureGuestSession() → 检查已存储凭证
  ├─ 有已存储凭证 → 直接登录
  └─ 无已存储凭证 → createGuestCredentials()
      ├─ 生成邮箱: guest-[randomId]@example.com
      ├─ 生成密码: 16位随机密码
      ├─ signUp到Supabase Auth
      └─ 自动创建对应的profile记录
```

### 2. 邮箱格式验证
✅ **正确格式**
- `guest-abc123def456@example.com` ✓
- `user@example.com` ✓

❌ **不支持的格式**
- `guest-2d701c74-f600-4f73-89e5-57ef38962294@guest.swapnorge.app` ✗ (域名不被Supabase认可)
- `guest.abc.def@swapnorge.local` ✗ (`.local`域名不被认可)

### 3. Profile 自动创建
当用户首次登录时，如果profile不存在：
```typescript
createUserProfile(supabase, userId, displayName) {
  // 插入新profile
  stats: {
    points: 100,           // 初始积分
    reputation: 5.0,       // 初始信誉值
    completedSwaps: 0,     // 已完成交换数
    memberSince: now()     // 加入时间
  }
}
```

## ✅ 测试检查清单

- [ ] **邮箱生成**
  - [x] 格式符合标准邮箱
  - [x] 包含@符号
  - [x] 使用example.com域名

- [ ] **Profile创建**
  - [ ] 游客登录后自动创建profile
  - [ ] stats字段初始化正确
  - [ ] display_name生成正确

- [ ] **数据同步**
  - [ ] 修改display_name时同步profile
  - [ ] 绑定邮箱时同步profile中的email

- [ ] **错误处理**
  - [ ] 处理唯一性约束错误（profile已存在）
  - [ ] 处理网络错误

## 🐛 已知问题

### 1. Supabase速率限制
- **症状**: `AuthApiError: email rate limit exceeded`
- **原因**: 过多的注册尝试
- **解决**: 等待2-3分钟，或使用新邮箱地址

### 2. 多个GoTrueClient实例警告
- **症状**: 控制台出现警告信息
- **原因**: 可能有多个Supabase客户端实例
- **解决**: 检查是否在多个地方创建了客户端

## 📝 后续改进方向

1. **更好的错误提示**
   - 显示用户友好的错误信息
   - 区分不同的错误类型

2. **速率限制处理**
   - 实现重试机制
   - 显示剩余等待时间

3. **Profile缓存**
   - 在客户端缓存profile信息
   - 减少数据库查询

4. **邮箱验证**
   - 实现邮箱验证流程
   - 防止虚假邮箱
