# 考研能量站 — LeanCloud 方案 · 3 步搞定

## 为什么这次一定行？

之前的方案都在折腾**自己搭建服务器**。这次用的是 **LeanCloud**（国内版 Firebase），
它替你管所有服务器、网络、实时推送。你只管用。

```
你的手机 ──→ LeanCloud 国内服务器 (标准 HTTPS) ←── 监督者电脑
  4G/5G          ↑ 大厂运维，99.9% 可用率          宽带/WiFi
```

---

## 第一步：注册 LeanCloud（1 分钟）

1. 打开 https://leancloud.cn
2. 注册账号（手机号/邮箱都行）
3. 进入控制台 → 点击「创建应用」
4. 应用名称随便填（比如"考研能量站"），选 **开发版**（免费）

---

## 第二步：复制凭据（30 秒）

1. 进入刚创建的应用 → 左侧菜单「设置」→「应用 Keys」
2. 你会看到三个值：

| 值 | 示例 |
|----|------|
| App ID | `AbCDeFgHiJkLmNoPqRsTuVwX` |
| App Key | `aBcDeFgHiJkLmNoPqRsTuVwX` |
| 服务器地址 | `https://abcdefgh.lncldapi.com` |

---

## 第三步：填入 config.js（10 秒）

编辑项目里的 `public/config.js`，把上面三个值填进去：

```javascript
var LC_APP_ID = 'AbCDeFgHiJkLmNoPqRsTuVwX';        // 你的 App ID
var LC_APP_KEY = 'aBcDeFgHiJkLmNoPqRsTuVwX';        // 你的 App Key
var LC_SERVER_URL = 'https://abcdefgh.lncldapi.com';  // 你的服务器地址
```

---

## 第四步：打开页面，开始用！

填好 `config.js` 后，直接用浏览器打开 `public/index.html`，或者部署到 GitHub Pages：

```
https://zzzmw-akf.github.io/study-buddy/
```

1. 输入房间号
2. 学生选「我是学生」、监督者选「我是监督者」
3. 自动连接！

---

## 费用

完全免费。LeanCloud 开发版提供：
- 每天 3 万次 API 请求（你们两个人用一天撑死几千次）
- 1GB 存储（够存几年的聊天记录）
- 实时推送（LiveQuery）

---

## 如果不能用

LeanCloud 国内版偶尔需要实名认证。如果提示需要认证：
1. 进入控制台 → 你的应用
2. 找「实名认证」入口
3. 身份证拍照即可通过（腾讯投资的，安全可靠）
