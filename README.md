<div align="center">

# 🍌 nanobanana-plus

**一行 prompt，任意比例，多个模型，一张好图。**

Gemini CLI 的 AI 生图扩展，现在支持 **Gemini CLI · Codex CLI · HTTP API · OpenClaw / 小龙虾** 四种调用方式。

[English](./README.en.md) · [Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/webkubor/nanobanana-plus/issues)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.5.0-brightgreen.svg)](gemini-extension.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Extension-4285F4?logo=google)](https://geminicli.com/extensions/)
[![OpenClaw](https://img.shields.io/badge/OpenClaw%20%2F%20小龙虾-Skill-FF6B35)](https://clawhub.ai/webkubor/nanobanana-plus)
[![npm](https://img.shields.io/npm/v/nanobanana-extension?color=CB3837)](https://www.npmjs.com/package/nanobanana-extension)

</div>

---

> 基于 [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)（Google 官方）Fork，
> 实现了社区呼声最高的 [#44](https://github.com/gemini-cli-extensions/nanobanana/issues/44)：
> **无需重启，每次调用动态切换模型 + 任意宽高比。**

---

## 它能做什么

一句话概括：**你描述画面，它生成图片，保存到你电脑上。**

```
你：生成一张赛博朋克风格的夜市街道，16:9 比例，用 Pro 模型
它：✅ Saved to /Users/you/cyberpunk-night-market.png
```

<details>
<summary>📸 真实输出（点击展开）</summary>

![CLI 操作截图](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cli-output.png)

**同样的 prompt**，原版 nanobanana 只输出 1:1 正方形裁切 👇
nanobanana-plus 保留模型原生横版构图：

![橙色猫咪坐在雨天窗台上](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cat-rainy-window.png)

</details>

---

## 快速开始

选一个你平时用的工具，跟着步骤走就行。

### 🧠 Gemini CLI

```bash
# 1. 安装
gemini extensions install https://github.com/webkubor/nanobanana-plus

# 2. 获取 API Key（免费）→ https://aistudio.google.com/apikey

# 3. 配置
export NANOBANANA_GEMINI_API_KEY="你的Key"
echo 'export NANOBANANA_GEMINI_API_KEY="你的Key"' >> ~/.zshrc

# 4. 开用
gemini
# → 然后直接说人话："生成一张赛博朋克风格的夜市街道，16:9，Pro模型"
```

> 💡 已经用 `gemini auth login` 登录过？跳过第 2、3 步，扩展会自动复用你的登录态。

### 🔵 Codex CLI

```bash
# 1. 全局安装
pnpm add -g nanobanana-extension   # 或 npm install -g nanobanana-extension

# 2. 注册到 Codex
codex mcp add nanobanana-plus -- nanobanana-plus

# 3. 配置 Key（同上）
export NANOBANANA_GEMINI_API_KEY="你的Key"

# 4. 开用
codex
```

### 🦞 OpenClaw / 小龙虾

[![安装到 ClawHub](https://img.shields.io/badge/ClawHub-一键安装-FF6B35)](https://clawhub.ai/webkubor/nanobanana-plus)

```bash
# 方式一：ClawHub 一键安装（推荐）
clawhub install webkubor/nanobanana-plus

# 方式二：手动初始化
nanobanana-plus init --base-url http://localhost:3456

# 通过 OpenClaw skill 生成图片
nanobanana-plus generate --prompt "一只橘猫坐在雨天窗台上" --filename cat.png --aspect-ratio 16:9
```

> OpenClaw skill 仍然需要先启动 HTTP API 服务（见下方），因为 skill 会通过 HTTP 调用本地服务生图。

### 💻 本地 CLI 单次生成

适用于终端里直接出图，不想先起端口的场景。

```bash
nanobanana-plus generate \
  --prompt "一只橘猫坐在雨天窗台上" \
  --filename ./output/cat.png \
  --aspect-ratio 16:9
```

> 这个命令会直接进入本地生成逻辑，不经过 `/api/generate`。

### 🌐 HTTP API（通用）

适用于 Claude、Cursor、自定义 GPT、Web 应用——任何能发 HTTP 请求的场景。

```bash
# 1. 启动服务
nanobanana-plus api --port 3456

# 2. 调用（另一个终端）
curl -X POST http://localhost:3456/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "一只橘猫坐在雨天的窗台上", "aspectRatio": "16:9"}'

# 浏览器打开 Swagger 文档
open http://localhost:3456/api/docs
```

**API 接口一览：**

| 接口 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/models` | GET | 可用模型列表 |
| `/api/generate` | POST | ⭐ 生成图片 |
| `/api/edit` | POST | 编辑已有图片 |
| `/api/restore` | POST | 修复/增强老照片 |
| `/api/files` | GET | 列出生成的图片 |
| `/api/docs` | GET | Swagger 文档 |

<details>
<summary><b>生成参数详解</b></summary>

| 参数 | 必填 | 说明 |
|------|:----:|------|
| `prompt` | ✅ | 描述你想要什么画面 |
| `model` | — | 模型（默认 Nano Banana 2） |
| `aspectRatio` | — | 比例：`16:9` / `9:16` / `1:1` / `4:3` / `3:4` |
| `outputCount` | — | 一次出几张（1-4，默认 1） |
| `format` | — | `both`（默认）/ `file` / `base64` |

</details>

---

## 比原版多了什么

| 功能 | nanobanana | 🍌 nanobanana-plus |
|------|:---:|:---:|
| 文字生图 | ✅ | ✅ |
| 图片编辑 / 修复 | ✅ | ✅ |
| 图标 · 图案 · 分镜 · 流程图 | ✅ | ✅ |
| **按次切换模型** | ❌ 需重启 | ✅ 每次调用独立指定 |
| **任意宽高比** | ❌ 只有 1:1 | ✅ 16:9 / 9:16 / 1:1 / 4:3 / 3:4 |
| **HTTP API** | ❌ | ✅ 任何工具都能调 |
| **OpenClaw / 小龙虾** | ❌ | ✅ ClawHub 一键安装 |

---

## 模型选择

不需要重启服务，每次生图直接指定。

| model 参数 | 模型 | 适合场景 |
|-----------|------|---------|
| *(不填)* `gemini-3.1-flash-image-preview` | Nano Banana 2 | ⚡ 日常使用，快速省配额 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 高质量输出，细节精细 |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 旧版兼容 |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra 💎 | 顶级写实度（需 Pro Key） |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast 🚀 | 兼顾速度质量（需 Pro Key） |

> [!TIP]
> - 全局默认模型：`export NANOBANANA_MODEL=gemini-3-pro-image-preview`
> - `21:9` 宽银幕仅 Gemini 模型支持，Imagen 4 不支持。详见 [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md)
> - Imagen 4 需要配置拥有 Pro 权限的 API Key，不支持 OAuth 登录态

---

## 效果图库

### 💎 Imagen 4 Ultra — 顶级写实

```bash
generate_image(prompt="majestic snowy mountain peak under a starry night sky, photorealistic, 8K",
  model="imagen-4.0-ultra-generate-001", aspectRatio="16:9")
```
![Ultra 16:9](https://files.catbox.moe/a7sfh2.png)

### 🚀 Imagen 4 Fast — 速度与质量

```bash
generate_image(prompt="a tranquil Japanese zen garden at dusk, soft mist, lanterns",
  model="imagen-4.0-fast-generate-001", aspectRatio="9:16")
```
![Fast 9:16](https://files.catbox.moe/8tz6ny.png)

### ⚡ Nano Banana 2 — 极速日常（默认）

```bash
generate_image(prompt="cyberpunk city at night, neon lights, rain reflections, cinematic",
  model="gemini-3.1-flash-image-preview", aspectRatio="16:9")
```
![Nano Banana 16:9](https://files.catbox.moe/kl23ih.png)

---

## 宽高比速查

| 比例 | 典型用途 |
|------|---------|
| `16:9` | 🖥️ 桌面壁纸 / YouTube 封面 / 博客头图 |
| `9:16` | 📱 手机壁纸 / 小红书 / 抖音封面 |
| `1:1` | ⬜ 头像 / Instagram / 公众号配图 |
| `4:3` | 🖼️ 传统横版 / PPT 配图 |
| `3:4` | 📄 传统竖版 / 海报 |

> 💡 **Prompt 小技巧**：传了 `aspectRatio` 就别在 prompt 里重复写比例数字，让参数管比例，prompt 专注画面描述。

---

## 全部工具

| 工具 | 说明 |
|------|------|
| `generate_image` | 文字生图，支持模型切换 + 宽高比 |
| `edit_image` | 基于文字编辑已有图片 |
| `restore_image` | 修复/增强老照片 |
| `generate_icon` | App 图标（多尺寸） |
| `generate_pattern` | 无缝平铺图案 |
| `generate_story` | 连贯故事分镜 |
| `generate_diagram` | 流程图/架构图 |
| `get_system_profile` | 返回硬件、运行时、MCP 配置概览 |

---

## 前置条件

- **Node.js** 18+
- **API Key**（三选一）：

```bash
export NANOBANANA_GEMINI_API_KEY="your_key"   # 推荐
export GEMINI_API_KEY="your_key"               # 备选
export GOOGLE_API_KEY="your_key"               # 备选
```

> 已登录 Gemini CLI 的用户可跳过，扩展会自动复用 OAuth 登录态。

---

## 🤝 参与贡献

欢迎 PR！特别需要：

- 🎨 **风格预设** — 水墨、浮世绘、赛博朋克等内置 prompt 前缀
- 🔁 **模型对比** — 同一 prompt 用 flash + pro 并排出图
- 📊 **配额追踪** — 临近 API 限额时自动告警

```bash
git clone https://github.com/webkubor/nanobanana-plus
cd nanobanana-plus && pnpm install && pnpm run dev
```

---

## 📄 License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.

---

<div align="center">

**觉得有用就 ⭐ 一下吧！**

</div>
