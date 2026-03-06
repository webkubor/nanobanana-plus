<div align="center">

# 🍌+ nanobanana-plus

**首个支持 Nano Banana 2 / Pro 按次切换的 Gemini CLI 扩展**

*The first Gemini CLI extension with per-call Nano Banana 2 / Pro switching*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.12-brightgreen.svg)](gemini-extension.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Extension-4285F4?logo=google)](https://geminicli.com/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

> **Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)** — 在原有全部功能基础上，实现了社区呼声最高的 [Issue #44](https://github.com/gemini-cli-extensions/nanobanana/issues/44)：**无需重启，每次调用时动态切换模型**。

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
| `imagen-4.0-ultra-generate-001` | **Imagen 4 Ultra** 💎 | 顶级写实度，需 Pro Key |
| `imagen-4.0-fast-generate-001` | **Imagen 4 Fast** 🚀 | 兼顾速度质量，需 Pro Key |

> [!NOTE]
> Imagen 4 模型使用的是 `predict` REST API 协议，必须配置拥有 Pro 权限的 `NANOBANANA_GEMINI_API_KEY`，不支持通过 OAuth/ADC 登录态自动获取。

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

![屋檐夜雨 21:9 示例](./docs/samples/roof-rain-21-9.png)

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
| `generate_image` | 文字生图，支持多风格/多变体/**模型切换/宽高比** |
| `edit_image` | 基于文字编辑已有图片 |
| `restore_image` | 修复/增强老照片 |
| `generate_icon` | 生成 App 图标（多尺寸） |
| `generate_pattern` | 生成无缝平铺图案 |
| `generate_story` | 生成连贯故事分镜图序列 |
| `generate_diagram` | 生成流程图/架构图 |

---

---

## 📝 更新日志 / Changelog

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
cd nanobanana-plus/mcp-server
npm install && npm run dev
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
