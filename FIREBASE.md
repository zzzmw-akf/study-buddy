# Firebase 配置指南

## 1. 创建 Firebase 项目

1. 打开 [Firebase 控制台](https://console.firebase.google.com)
2. 用 Google 账号登录（没有就注册一个）
3. 点击 **「添加项目」**（Add project），起个名字比如 `study-buddy`
4. Google Analytics 可以关闭（可选），点 **「创建项目」**

## 2. 添加 Web 应用

1. 项目创建完成后，点击中间的 **`</>`** 图标（Web 应用）
2. 注册昵称填 `study-buddy-web`，点击 **「注册应用」**
3. 你会看到一段 `firebaseConfig` 代码，类似：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "study-buddy-xxx.firebaseapp.com",
  projectId: "study-buddy-xxx",
  storageBucket: "study-buddy-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

4. **复制这 6 行**，粘贴到 `public/config.js` 里替换模板

## 3. 创建 Firestore 数据库

1. 左侧菜单 → **「Firestore Database」** → 点击 **「创建数据库」**
2. 选择 **「以测试模式启动」**（Start in test mode）→ 下一步
3. 位置选 `asia-east1`（中国台湾，延迟最低）或默认 → 点击 **「启用」**

## 4. 开启匿名登录

1. 左侧菜单 → **「Authentication」** → 点击 **「开始使用」**
2. 选择 **「登录方式」**（Sign-in method）标签
3. 找到 **「匿名」**（Anonymous）→ 点击启用 → 保存

## 5. 填入配置

把第 2 步复制的 `firebaseConfig` 对象粘贴到 `public/config.js`，替换模板。

## 6. 完成！

推送到 GitHub 后，GitHub Pages 自动部署，即可使用。

---

**总耗时：约 5 分钟，全部免费。**
