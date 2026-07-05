# Supabase 配置指南 (5 分钟，全免费)

Supabase 是 Firebase 的开源替代品，**无需 Google 账号**，用 GitHub 就能登录。
完全免费，安全域名不收费，匿名免登录。

---

## 第一步：创建 Supabase 项目

1. 打开 https://supabase.com
2. 点右上角 **Sign In** → **Continue with GitHub**
3. 登录后点 **New project**
4. 填写：
   - Organization: 默认即可
   - Name: `study-buddy`
   - Database Password: 设一个密码（记下来，后面不用）
   - Region: **Northeast Asia (Tokyo)** — 离国内最近
5. 点 **Create project**，等 2 分钟初始化

---

## 第二步：创建数据库表

1. 左侧菜单进入 **SQL Editor**
2. 点 **New query**
3. 粘贴以下 SQL，点 **Run**：

```sql
-- 创建 messages 表
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  sender TEXT NOT NULL,
  timestamp BIGINT NOT NULL
);

-- 开启 RLS（行级安全）
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 允许任何人读写（匿名免登录）
CREATE POLICY "Allow all operations"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 第三步：开启 Realtime（实时推送）

1. 左侧菜单 **Database** → **Replication**
2. 找到 `messages` 表
3. 把它**打开**（点击开关）
4. 如果有确认弹窗，确认即可

---

## 第四步：获取 API 密钥

1. 左侧菜单 **Settings** → **API**
2. 你会看到：
   - **Project URL**：类似 `https://xxxxx.supabase.co`
   - **anon public key**：以 `eyJ` 开头的一长串
3. 把这两个值复制到 `public/config.js`：
   - `SUPABASE_URL` → Project URL
   - `SUPABASE_ANON_KEY` → anon public key

---

## 第五步：告诉我配置好了

把填好的配置内容发给我，或者直接截图 Settings → API 页面，我帮你推送代码到 GitHub。

---

## 常见问题

**Q: 免费额度够用吗？**
A: 完全够。Supabase 免费版：500MB 数据库、每月 200 万 API 请求、200 个实时连接。考研监督每天最多几百条消息，完全用不完。

**Q: 需要配置安全域名吗？**
A: **不需要！** 这是 Supabase 比 CloudBase 和 Firebase 都好的地方——anon key 本身就能从任何域名调用。

**Q: 国内速度怎么样？**
A: 选 Tokyo 节点后速度很快，WebSocket 延迟 100-200ms，完全够用。

**Q: 需要登录吗？**
A: **不需要！** 用的是 anon public key（公钥），谁都可以读写——但只有知道监督码的人才知道房间号，不会被别人看到。
