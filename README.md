<div align="center">

# 🍌+ nanobanana-plus

**首个支持 Nano Banana 2 / Pro 按次切换的 Gemini CLI 扩展**

*The first Gemini CLI extension with per-call Nano Banana 2 / Pro switching*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](gemini-extension.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Extension-4285F4?logo=google)](https://geminicli.com/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

> **Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)** — 在原有全部功能基础上，实现了社区呼声最高的 [Issue #44](https://github.com/gemini-cli-extensions/nanobanana/issues/44)：**无需重启，每次调用时动态切换模型**。

---

## ⚡ Quick Start

**方式一：一键配置（推荐新用户）**

```bash
# 自动引导申请 API Key、回填、写入环境变量
git clone https://github.com/webkubor/nanobanana-plus
bash nanobanana-plus/setup.sh
```

脚本会帮你：① 检测已有 key → ② 引导去 [Google AI Studio](https://aistudio.google.com/apikey) 申请 → ③ 粘贴回填 → ④ 自动写入 `~/.zshrc`

---

**方式二：手动配置**

```bash
# 1. 安装扩展
gemini extensions install https://github.com/webkubor/nanobanana-plus

# 2. 设置 API Key（在 https://aistudio.google.com/apikey 免费申请）
export NANOBANANA_GEMINI_API_KEY="your_gemini_api_key"
# 写入 ~/.zshrc 永久生效：
echo 'export NANOBANANA_GEMINI_API_KEY="your_key"' >> ~/.zshrc

# 3. 打开 Gemini CLI，直接对话生图
gemini
```

> 💡 **已用 Gemini CLI 登录过 Google 的用户无需配置 Key**，扩展会自动复用登录态。

```
# 在 Gemini CLI 中输入：
生成一张赛博朋克夜市，用 pro 模型，16:9 比例
```

---

## ✨ 相比 nanobanana 新增了什么 / What's New

| 功能 | nanobanana | 🍌+ nanobanana-plus |
|------|:---:|:---:|
| 文字生图 Text-to-Image | ✅ | ✅ |
| 图片编辑 Image Editing | ✅ | ✅ |
| 图片修复 Restoration | ✅ | ✅ |
| 图标生成 Icon Generation | ✅ | ✅ |
| 图案生成 Pattern Generation | ✅ | ✅ |
| 故事分镜 Story Sequence | ✅ | ✅ |
| 流程图 Diagram | ✅ | ✅ |
| **🆕 按次切换模型 Per-call model switch** | ❌ 需重启 | ✅ **每次调用独立指定** |
| **🆕 宽高比控制 Aspect ratio** | ❌ | ✅ **16:9 / 1:1 / 9:16 等** |

---

## 🍌 模型切换 / Model Switching

无需重启服务，每次生图时单独指定模型：

| model 参数 | 对应模型 | 适合场景 |
|-----------|---------|---------|
| *(不填)* `gemini-3.1-flash-image-preview` | Nano Banana 2 | ⚡ 日常使用，快速省配额 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 高质量输出，细节精细 |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 旧版兼容 |

```bash
# 全局默认切换到 Pro（可选）
export NANOBANANA_MODEL=gemini-3-pro-image-preview
```

---

## 📐 宽高比 / Aspect Ratio

| aspectRatio | 用途 |
|-------------|------|
| `16:9` | 🖥️ 横版 / 桌面壁纸 / YouTube 封面 |
| `9:16` | 📱 竖版 / 手机壁纸 / 小红书 / 抖音封面 |
| `1:1` | ⬜ 正方形 / 头像 / Instagram |
| `4:3` | 🖼️ 传统横版 |
| `3:4` | 📄 传统竖版 |

---

## 💡 示例对话 / Examples

在 Gemini CLI 中直接用自然语言：

```
🎨 高质量竖版图（Pro + 9:16）
> 生成一张赛博朋克少女，霓虹灯雨夜，model=gemini-3-pro-image-preview，aspectRatio=9:16
```

```
⚡ 快速出 4 张草图（Flash 省配额）
> 生成 4 张科幻飞船概念图
```

```
🖼️ 多风格批量对比
> 生成日落山景，同时出水彩、油画、写实照片、动漫四种风格
```

```
✏️ 编辑已有图片
> 编辑 ~/Desktop/photo.png，把背景换成星空
```

```
🎯 生成 App 图标
> 生成一个简洁的日历 App 图标，需要 64、128、256、512 尺寸
```

```
📖 故事分镜
> 生成《勇者的旅程》故事分镜，3 幕，赛博朋克风格
```

---

## 📋 前置条件 / Prerequisites

1. [Gemini CLI](https://github.com/google-gemini/gemini-cli) 已安装
2. Node.js 20+
3. API Key（任选一个环境变量）：

```bash
export NANOBANANA_GEMINI_API_KEY="your_key"   # 推荐
export GEMINI_API_KEY="your_key"               # 备选
export GOOGLE_API_KEY="your_key"               # 备选
```

> 📖 [Gemini CLI 认证完整文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/authentication.md)

---

## 📦 完整工具列表 / All Tools

| 工具 | 说明 |
|------|------|
| `generate_image` | 文字生图，支持多风格/多变体/**模型切换/宽高比** |
| `edit_image` | 基于文字编辑已有图片 |
| `restore_image` | 修复/增强老照片 |
| `generate_icon` | 生成 App 图标（多尺寸） |
| `generate_pattern` | 生成无缝平铺图案 |
| `generate_story` | 生成连贯故事分镜图序列 |
| `generate_diagram` | 生成流程图/架构图 |

---

## 📄 License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.  
原始版权声明已保留，完整遵循 Apache 2.0 协议。

---

<div align="center">

觉得有用就点个 ⭐ 吧！  
*If this helps you, please give it a ⭐!*

</div>
