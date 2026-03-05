<div align="center">

# 🍌+ nanobanana-plus

**首个支持 Nano Banana 2 / Pro 按次切换的 Gemini CLI 扩展**

*The first Gemini CLI extension with per-call Nano Banana 2 / Pro switching*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Extension-4285F4?logo=google)](https://geminicli.com/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

> **Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)** — 在原有全部功能基础上，实现了社区呼声最高的 [Issue #44](https://github.com/gemini-cli-extensions/nanobanana/issues/44)：无需重启，每次调用时动态切换模型。

---

## ✨ 相比 nanobanana 新增了什么 / What's New vs nanobanana

| 功能 | nanobanana | nanobanana-plus |
|------|-----------|-----------------|
| 文字生图 / Text-to-Image | ✅ | ✅ |
| 图片编辑 / Image Editing | ✅ | ✅ |
| 图片修复 / Restoration | ✅ | ✅ |
| 图标生成 / Icon Generation | ✅ | ✅ |
| 图案生成 / Pattern Generation | ✅ | ✅ |
| 故事分镜 / Story Sequence | ✅ | ✅ |
| 流程图 / Diagram | ✅ | ✅ |
| **按次切换模型 / Per-call model switch** | ❌ 需重启 | ✅ **每次调用独立指定** |
| **宽高比控制 / Aspect ratio** | ❌ | ✅ **16:9 / 1:1 / 9:16 等** |

---

## 🚀 安装 / Install

```bash
gemini extensions install https://github.com/webkubor/nanobanana-plus
```

---

## 🍌 模型选择 / Model Selection

每次调用时通过 `model` 参数指定，无需重启服务：

| 参数值 | 模型 | 特点 |
|--------|------|------|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | ⚡ **默认** 快速，省配额 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 高质量，细节丰富 |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 旧版兼容 |

不指定时使用默认 Flash 模型，也可通过环境变量设置全局默认：

```bash
export NANOBANANA_MODEL=gemini-3-pro-image-preview
```

---

## 📐 宽高比 / Aspect Ratio

通过 `aspectRatio` 参数控制输出比例：

| 值 | 用途 |
|----|------|
| `16:9` | 横版 / 桌面壁纸 |
| `9:16` | 竖版 / 手机壁纸 / 小红书 |
| `1:1` | 正方形 / 头像 |
| `4:3` | 传统横版 |
| `3:4` | 传统竖版 |

---

## 💡 使用示例 / Examples

```bash
# 高质量竖版图（Pro 模型 + 9:16）
generate_image --prompt "赛博朋克少女，霓虹灯雨夜" \
  --model gemini-3-pro-image-preview \
  --aspectRatio "9:16"

# 快速出 4 张草图（Flash 默认，省配额）
generate_image --prompt "科幻飞船概念图" --count 4

# 同一主题多风格对比
generate_image --prompt "mountain at sunset" \
  --styles "watercolor,oil-painting,photorealistic,anime"

# 编辑已有图片
edit_image --file "~/Desktop/photo.png" \
  --prompt "把背景换成星空"

# 生成 App 图标
generate_icon --prompt "简洁的日历 App 图标" --sizes "64,128,256,512"
```

---

## 📋 前置条件 / Prerequisites

1. **Gemini CLI** 已安装并配置
2. **Node.js 20+**
3. **API Key** — 设置以下任一环境变量：
   - `NANOBANANA_GEMINI_API_KEY`（推荐）
   - `GEMINI_API_KEY`（fallback）
   - `GOOGLE_API_KEY`（fallback）

> 认证配置参考：[Gemini CLI 官方文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/authentication.md)

---

## 📦 完整工具列表 / All Tools

| 工具 | 说明 |
|------|------|
| `generate_image` | 文字生图，支持多风格/多变体/模型切换/宽高比 |
| `edit_image` | 基于文字编辑已有图片 |
| `restore_image` | 修复/增强老照片 |
| `generate_icon` | 生成 App 图标（多尺寸） |
| `generate_pattern` | 生成无缝平铺图案 |
| `generate_story` | 生成连贯故事分镜图序列 |
| `generate_diagram` | 生成流程图 / 架构图 |

---

## 📄 许可证 / License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.

保留原始版权声明，遵循 Apache 2.0 协议。

---

<div align="center">

如果这个扩展对你有帮助，欢迎 ⭐ Star！

*If this extension helps you, please consider giving it a ⭐!*

</div>
