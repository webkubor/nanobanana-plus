<div align="center">

# 🍌+ nanobanana-plus

**一句话：AI 生图工具。支持 Gemini CLI、Codex CLI、HTTP API 三种调用方式。**

[English README](./README.en.md)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.5.0-brightgreen.svg)](gemini-extension.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Extension-4285F4?logo=google)](https://geminicli.com/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

> **Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)** — 在原有全部功能基础上，实现了社区呼声最高的 [Issue #44](https://github.com/gemini-cli-extensions/nanobanana/issues/44)：**无需重启，每次调用时动态切换模型**。

---

## 🔗 Related Projects

- [Prompt Lab](https://github.com/webkubor/prompt-lab): 面向设计师与内容团队的 AI 图像工作流与提示词知识库。
- [CortexOS](https://github.com/webkubor/CortexOS): 用于持久化上下文、项目路由与多 Agent 协作的本地控制平面。
- [Selected Private Products](https://github.com/webkubor/webkubor#selected-private-products): DreamFit、Boiling Snow 等私有产品把这些生图能力继续接入真实生产链路。

---

## 🖼️ 实测效果 / Real Output

> 原版 nanobanana **只能生成 1:1 正方形图**，nanobanana-plus 支持任意宽高比。

### 操作界面 / CLI in Action

![CLI 操作截图](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cli-output.png)

> 一句中文指令 → `generate_image (nanobanana-plus MCP Server)` → 成功生成并保存

### 生成结果 / Generated Image

下图由 `nanobanana-plus` 生成，**非 1:1，为模型原生横版宽屏比例**：

![橙色猫咪坐在雨天窗台上](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cat-rainy-window.png)

**对比原版**：同样的 prompt，原版 nanobanana 只会输出 1:1 正方形裁切，nanobanana-plus 保留了模型原生的横版构图，细节更完整，氛围感更强。

---

## ⚡ 快速开始 / Quick Start

nanobanana-plus 就是一个**帮你生成图片的工具**。你告诉它想要什么画面，它就给你生成一张图片，保存在你电脑上。

你**只需要选一个你平时用的 AI 工具**，然后跟着对应的步骤装就行。

---

### 🧠 我用 Gemini CLI

Gemini CLI 是 Google 出的命令行 AI 工具。如果你已经装了它，这是最简单的方式。

**第一步：安装 nanobanana-plus**

```bash
gemini extensions install https://github.com/webkubor/nanobanana-plus
```

**第二步：获取 API Key（免费）**

1. 打开 https://aistudio.google.com/apikey
2. 用 Google 账号登录
3. 点「Create API Key」，复制生成的 Key

**第三步：配置环境变量**

把 Key 告诉系统，这样工具才能调用 Google 的图片生成服务：

```bash
# 临时生效（关掉终端就没了）
export NANOBANANA_GEMINI_API_KEY="粘贴你的Key在这里"

# 永久生效（推荐，执行一次就行）
echo 'export NANOBANANA_GEMINI_API_KEY="粘贴你的Key在这里"' >> ~/.zshrc
```

> 💡 如果你已经用 `gemini` 命令登录过 Google，**可以跳过第二、三步**，扩展会自动用你的登录态。

**第四步：开始生图**

```bash
gemini
```

然后在对话里直接说人话就行：

> 生成一张赛博朋克风格的夜市街道，16:9 比例，用 Pro 模型

就这么简单。AI 会自动调用 nanobanana-plus 生成图片，保存到你电脑上。

---

### 🔵 我用 Codex CLI

Codex CLI 是 OpenAI 出的命令行 AI 工具。你需要先装好 [Codex CLI](https://github.com/openai/codex)。

**第一步：全局安装**

```bash
# 用 pnpm 安装（推荐）
pnpm add -g nanobanana-extension

# 或者用 npm
npm install -g nanobanana-extension
```

**第二步：注册到 Codex**

告诉 Codex 有这个工具可以用：

```bash
codex mcp add nanobanana-plus -- nanobanana-plus
```

**第三步：配置 API Key**

```bash
# 把你的 Google API Key 设置进去（和上面 Gemini 同一个 Key）
export NANOBANANA_GEMINI_API_KEY="粘贴你的Key在这里"
echo 'export NANOBANANA_GEMINI_API_KEY="粘贴你的Key在这里"' >> ~/.zshrc
```

**第四步：开始生图**

```bash
codex
```

然后跟 AI 说：

> 帮我生成一张中国水墨画风格的山水图，9:16 竖版，适合做手机壁纸

---

### 🌐 我用其他 AI / 想通过 HTTP 调用

> 🆕 v1.5.0 新增 — 不需要装 Gemini CLI 或 Codex，只要能发 HTTP 请求就行。

这种方式适合：你在开发 AI 应用、写自动化脚本、或者用了其他 AI 工具（比如 Claude、Cursor 等），想让它们也能调用这个生图服务。

**第一步：启动 HTTP 服务**

```bash
nanobanana-plus api --port 3456
```

你会看到终端输出：

```
🚀 nanobanana-plus API running on http://localhost:3456
📖 Swagger UI: http://localhost:3456/api/docs
```

> 💡 保持这个终端窗口别关，服务会一直跑。关掉就停了。

**第二步：用任何方式调用**

在另一个终端窗口里：

```bash
# 生成一张图
curl -X POST http://localhost:3456/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "一只橘猫坐在雨天的窗台上", "aspectRatio": "16:9"}'

# 看看你生成了哪些图片
curl http://localhost:3456/api/files

# 下载图片到本地
curl -O http://localhost:3456/api/files/文件名.png

# 查看 Swagger 文档（用浏览器打开）
open http://localhost:3456/api/docs
```

如果其他 AI 工具支持调用 HTTP API（比如 Claude、自定义 GPT 等），把 `http://localhost:3456/api/generate` 这个地址告诉它就行。

---

### 📋 API 接口速查

HTTP API 服务启动后，所有接口如下：

| 接口 | 方法 | 干什么的 |
|------|------|---------|
| `/health` | GET | 检查服务是否正常 |
| `/api/models` | GET | 查看支持哪些模型和比例 |
| `/api/generate` | POST | 生成图片 ⭐ |
| `/api/edit` | POST | 编辑已有图片 |
| `/api/restore` | POST | 修复/增强老照片 |
| `/api/files` | GET | 列出所有生成的图片 |
| `/api/files/:name` | GET | 下载/预览某张图片 |
| `/api/docs` | GET | Swagger 文档页面 |

**生成图片的参数：**

| 参数 | 是否必填 | 说明 |
|------|---------|------|
| `prompt` | ✅ 必填 | 描述你想要什么画面 |
| `model` | 可选 | 用哪个模型生成（默认最快的 Nano Banana 2） |
| `aspectRatio` | 可选 | 比例：`16:9` 横屏 / `9:16` 竖屏 / `1:1` 正方形 |
| `outputCount` | 可选 | 一次出几张（1-4，默认 1） |
| `format` | 可选 | 返回方式：`both` 同时给 base64+文件 / `file` 只给文件 / `base64` 只给编码 |

---

## ✨ 比原版多了什么

> nanobanana 是 Google 官方的原版工具，nanobanana-plus 是在它基础上增强的版本。

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

## 🍌 用哪个模型？

> 不同模型生成速度和质量不一样，按需选就行。**不需要重启服务**，每次生图时直接指定。

| model 参数 | 对应模型 | 适合场景 |
|-----------|---------|---------|
| *(不填)* `gemini-3.1-flash-image-preview` | Nano Banana 2 | ⚡ 日常使用，快速省配额 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 高质量输出，细节精细 |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 旧版兼容 |
| `imagen-4.0-ultra-generate-001` | **Imagen 4 Ultra** 💎 | 顶级写实度，需 Pro Key |
| `imagen-4.0-fast-generate-001` | **Imagen 4 Fast** 🚀 | 兼顾速度质量，需 Pro Key |

> [!NOTE]
> Imagen 4 模型使用的是 `predict` REST API 协议，必须配置拥有 Pro 权限的 `NANOBANANA_GEMINI_API_KEY`，不支持通过 OAuth/ADC 登录态自动获取。
>
> `21:9` 实测结论：
> - 支持：`gemini-3.1-flash-image-preview`、`gemini-3-pro-image-preview`、`gemini-2.5-flash-image`
> - 不支持：`imagen-4.0-ultra-generate-001`、`imagen-4.0-fast-generate-001`
> - 详细时间、命令和原始返回见 [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md)

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

### Prompt 小技巧

如果你已经传了 `aspectRatio`，就不要再在 prompt 里重复写 `16:9`、`21:9`、`9:16` 这类比例词。比例控制只放在参数里，prompt 只描述画面内容。

原始命令：

```bash
generate_image(prompt="A cinematic 21:9 ultra-wide background image. A close-up of traditional Han Dynasty dark slate roof tiles under heavily pouring rain at night. Water splashing dramatically off the eaves in slow motion. Deep indigo and pitch black color grading with a very faint, distant warm lantern glow reflecting on the wet stone. 35mm film grain, moody, desaturated. No characters, no text. Perfect for a clean, dark website hero background.", model="gemini-3.1-flash-image-preview", aspectRatio="21:9")
```

优化后命令：

```bash
generate_image(prompt="A cinematic ultra-wide background image. A close-up of traditional Han Dynasty dark slate roof tiles under heavily pouring rain at night. Water splashing dramatically off the eaves in slow motion. Deep indigo and pitch black color grading with a very faint, distant warm lantern glow reflecting on the wet stone. 35mm film grain, moody, desaturated. No characters, no text. Perfect for a clean, dark website hero background.", model="gemini-3.1-flash-image-preview", aspectRatio="21:9")
```

实测出图：

![屋檐夜雨 21:9 示例](https://img.webkubor.online/roof-rain-21-9.png)

---

## 💡 示例图库与指令 / Gallery & Prompts

最新版本支持更直观的比例与模型完全自由组合。以下是实测样例与生成指令：

### 💎 Imagen 4 Ultra（顶级写实体验）

*指定模型：`imagen-4.0-ultra-generate-001`*

**16:9 横版桌面壁纸**

```bash
generate_image(prompt="majestic snowy mountain peak under a starry night sky, photorealistic, 8K", model="imagen-4.0-ultra-generate-001", aspectRatio="16:9")
```

![Ultra 16:9 示例](https://files.catbox.moe/a7sfh2.png)

**1:1 超精细特写头像**

```bash
generate_image(prompt="a hyperrealistic close-up portrait of a snow leopard, golden hour light", model="imagen-4.0-ultra-generate-001", aspectRatio="1:1")
```

![Ultra 1:1 示例](https://files.catbox.moe/xu0lyk.png)

### 🚀 Imagen 4 Fast（极速与质量兼顾）

*指定模型：`imagen-4.0-fast-generate-001`*

**9:16 竖版手机壁纸 / 小红书图**

```bash
generate_image(prompt="a tranquil Japanese zen garden at dusk, soft mist, lanterns", model="imagen-4.0-fast-generate-001", aspectRatio="9:16")
```

![Fast 9:16 示例](https://files.catbox.moe/8tz6ny.png)

**1:1 概念设计草图**

```bash
generate_image(prompt="cute golden retriever puppy on green grass, soft light", model="imagen-4.0-fast-generate-001", aspectRatio="1:1")
```

![Fast 1:1 示例](https://files.catbox.moe/s0nyz0.png)

### ⚡ Nano Banana 2（极速日常使用）

*默认模型：`gemini-3.1-flash-image-preview`*

**16:9 电影感构图**

```bash
generate_image(prompt="cyberpunk city at night, neon lights, rain reflections, cinematic", model="gemini-3.1-flash-image-preview", aspectRatio="16:9")
```

![Nano Banana 16:9 示例](https://files.catbox.moe/kl23ih.png)

**1:1 奇幻艺术设定（一次出 2 张）**

```bash
generate_image(prompt="a magical glowing forest with fireflies, fantasy art style", outputCount=2)
```

![Nano Banana 1:1 示例](https://files.catbox.moe/vomilh.png)

---

### 🛠️ 更多进阶玩法

```text
🖼️ 多风格批量对比（一次出 4 种）
> 生成日落山景，同时出水彩、油画、写实照片、动漫四种风格
```

```
✏️ 编辑已有图片
> 编辑 ~/Desktop/photo.png，把背景换成星空
```

```
🎯 生成 App 图标（多尺寸）
> 生成一个简洁的日历 App 图标，需要 64、128、256、512 尺寸
```

```
📖 故事分镜序列
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
| `get_system_profile` | 返回本机硬件、运行时版本、MCP 配置、skills 安装概览 |
| `generate_image` | 文字生图，支持多风格/多变体/**模型切换/宽高比** |
| `edit_image` | 基于文字编辑已有图片 |
| `restore_image` | 修复/增强老照片 |
| `generate_icon` | 生成 App 图标（多尺寸） |
| `generate_pattern` | 生成无缝平铺图案 |
| `generate_story` | 生成连贯故事分镜图序列 |
| `generate_diagram` | 生成流程图/架构图 |

### `get_system_profile` 返回内容

- 硬件：芯片、机型、CPU 核心数、总内存、系统版本
- 运行时：`python3`、`pip3`、`node`、`npm`、`pnpm`、`uv`、`git`、`brew`
- 包管理器摘要：`brew` formula/cask 数量、`pip3` 包数量与 `site-packages`
- MCP 摘要：Gemini / Codex 两侧已配置 server 名称、来源、传输方式、命令或 URL、env key 名
- Skills 摘要：Gemini / Codex / Agents 三侧已安装 skills 数量和名称

> 安全说明：`get_system_profile` 只返回配置摘要，不会回传 API Key、token 等敏感值原文。

---

---

## 📝 更新日志 / Changelog

### v1.5.0 (2026-03-18)

- **🆕 HTTP API 模式**：新增 `nanobanana-plus api` 命令，启动 HTTP API 服务。任何 AI / 脚本 / Web 应用都可以通过 REST 接口调用生图，无需绑定 Gemini CLI 或 Codex。
- **🆕 OpenAPI 文档**：自动生成 OpenAPI 3.0 规范 + Swagger UI（`/api/docs`），方便集成调试。
- **框架升级**：HTTP 层基于 Hono（~14KB 轻量框架），零额外依赖。
- **复用核心**：HTTP API 完全复用现有 `ImageGenerator` 类，无重复代码。

### v1.4.0 (2026-03-10)

- **新工具**：新增 `get_system_profile`，一次性返回硬件、运行时版本、包管理器摘要、MCP 配置和 skills 安装概览。
- **模型兼容**：当请求 `imagen-4.0-ultra-generate-001` 或 `imagen-4.0-fast-generate-001` 且比例为 `21:9` 时，会自动切换到兼容的 Gemini 图像模型，并在结果里说明原因。
- **输出目录**：默认输出路径改为项目内固定目录 `输出/banana-plus`，不再依赖启动时的工作目录。
- **文档同步**：`README`、`README.en.md`、`GEMINI.md` 已同步记录新工具和行为变更。

### v1.0.12 (2026-03-06)

- **安全增强**：强化 `.gitignore`，防止误传敏感文件（`.env`, `*.key` 等）。
- **结构优化**：将测试脚本移动至 `mcp-server/test` 目录。
- **文档更新**：同步更新 `README` 和 `GEMINI.md`，增加新功能详细说明。

### v1.0.11 (2026-03-05)

- **新功能**：支持通过 `predict` API 调用 Imagen 4 Ultra 和 Fast 模型。
- **功能增强**：提升所有支持模型的宽高比控制精度。
- **新增模型**：加入 `imagen-4.0-ultra-generate-001` 和 `imagen-4.0-fast-generate-001`。

---

## 🤝 Contributing / 共创

**nanobanana-plus 欢迎共创！** / *Contributions welcome!*

我们特别希望得到帮助的方向：

- 🌍 **更多宽高比** — 测试并记录各模型支持的比例
- 🎨 **风格预设** — 内置常用风格的 prompt 前缀（水墨、浮世绘、赛博朋克...）
- 🔁 **模型对比模式** — 同一 prompt 同时用 flash + pro 出图，方便对比
- 🌐 **中文文档完善** — 更好的中文错误提示和使用说明

```bash
git clone https://github.com/webkubor/nanobanana-plus
cd nanobanana-plus
pnpm install
pnpm run dev
```

核心文件：

- `src/index.ts` — MCP Tool 定义（新增参数在这里）
- `src/imageGenerator.ts` — API 调用逻辑（模型/宽高比处理）
- `src/types.ts` — TypeScript 类型定义

> 💬 发现 bug 或有功能建议？[提 Issue](https://github.com/webkubor/nanobanana-plus/issues) 欢迎任何反馈！

---

## 📄 License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.  
原始版权声明已保留，完整遵循 Apache 2.0 协议。

---

<div align="center">

觉得有用就点个 ⭐ 吧！  
*If this helps you, please give it a ⭐!*

</div>
