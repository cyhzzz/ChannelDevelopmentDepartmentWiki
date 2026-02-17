# 渠道建设部导航站 - 双皮肤系统

## 🎨 新增 MONO 极简皮肤

本项目现在支持两套界面风格，用户可以自由选择：

### 1. 经典版（Classic）
- **特点**: 保留原有 Webstack Hugo 布局
- **适合**: 习惯传统侧边栏导航的用户
- **入口**: `index.html`

### 2. MONO 极简版（New）
- **特点**: 
  - 单色主义 + 蓝色系设计
  - 现代极简美学
  - 深色/浅色主题切换
  - 响应式布局
- **适合**: 追求效率和简洁的用户
- **入口**: `mono.html`

---

## 🚀 快速开始

### 方法一：通过切换页选择

访问 `switcher.html`，点击选择您喜欢的界面风格：

```
https://your-domain.com/switcher.html
```

### 方法二：直接访问

- 经典版: `https://your-domain.com/index.html`
- MONO 版: `https://your-domain.com/mono.html`

---

## 📁 文件结构

```
/
├── index.html              # 经典版主页
├── mono.html               # MONO 极简版主页 ⭐ 新增
├── switcher.html           # 皮肤切换选择页 ⭐ 新增
├── assets/                 # 静态资源
│   ├── css/
│   ├── js/
│   └── images/
└── README_SKIN.md         # 本文件
```

---

## ✨ MONO 皮肤特性

### 设计系统
- **色彩**: 灰阶 + 蓝色系（#2563eb）
- **字体**: 系统字体栈（Inter, SF Pro, Roboto）
- **圆角**: 4px / 8px
- **阴影**: 极简，用于悬停状态

### 功能
- ✅ 深色/浅色主题切换（自动保存偏好）
- ✅ 分类筛选（全部、数据与汇报、素材创作等）
- ✅ 实时搜索（支持快捷键 ⌘K / Ctrl+K）
- ✅ 响应式布局（桌面、平板、手机）
- ✅ 优雅动画和过渡效果

---

## 🛠 技术栈

### 经典版
- Hugo 静态生成器
- Bootstrap 3
- Xenon 主题
- jQuery

### MONO 版
- 纯 HTML5 + CSS3
- 原生 JavaScript（无框架）
- CSS 变量（自定义属性）
- CSS Grid + Flexbox

---

## 📝 更新日志

### 2025-02-17
- ✨ 新增 MONO 极简皮肤
- ✨ 新增皮肤切换选择页
- ✅ 支持深色/浅色主题
- ✅ 支持分类筛选和搜索
- ✅ 响应式设计

---

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进皮肤系统。

---

## 📄 许可证

MIT License
