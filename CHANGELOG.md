# Changelog

All notable changes to **nanobanana-plus** will be documented here.

Format: [Semantic Versioning](https://semver.org/) | Based on [Keep a Changelog](https://keepachangelog.com/)

---

## [1.3.0] — 2026-03-06 🍌+ Packaging & Codex CLI Support / 打包支持与 Codex 集成

### 📦 Packaging / 打包

- **NPM Support / NPM 支持**: Added `bin` executable and `files` whitelist for professional NPM distribution. / 增加了 `bin` 可执行配置和 `files` 白名单，支持标准的 NPM 发布。
- **Executable / 可执行命令**: Defined `nanobanana-plus` and `nanobanana-extension` binaries. / 定义了 `nanobanana-plus` 和 `nanobanana-extension` 全局命令。
- **Postinstall / 安装后脚本**: Added automated dependency installation via `postinstall` script. / 增加了安装后自动构建依赖的 `postinstall` 脚本。

### 🧭 Integration / 集成

- **Codex CLI Support / Codex CLI 支持**: Added official support for adding as an MCP tool in Codex CLI via `npx`. / 增加了对 Codex CLI 的官方支持，支持通过 `npx` 直接添加为 MCP 工具。

### 🛠️ Scripts / 脚本

- **Workspace Management / 工作区管理**: Optimized root scripts to use `npm --prefix` for better reliability. / 优化了根目录脚本，使用 `npm --prefix` 提高多包管理可靠性。

### 🧪 Verified Limits / 实测限制

- **21:9 compatibility matrix / 21:9 兼容性矩阵**: Documented a direct no-fallback API test for all current image models. Gemini 3.1 Flash, Gemini 3 Pro, and Gemini 2.5 Flash succeeded; Imagen 4 Ultra and Imagen 4 Fast returned `aspectRatio 21:9 is not supported`. See [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md). / 补充了当前全部图像模型的 `21:9` 直连 API 测试记录：Gemini 3.1 Flash、Gemini 3 Pro、Gemini 2.5 Flash 成功；Imagen 4 Ultra 与 Imagen 4 Fast 返回 `aspectRatio 21:9 is not supported`。详见 [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md)。

---

## [1.2.1] — 2026-03-06 🍌+ Security & Organization / 安全增强与结构优化

### 🔒 Security / 安全

- **Hardened `.gitignore` / 强化忽略规则**: Now blocks `.env*`, `*.key`, `*.pem`, `credentials.json`, and debug logs. / 增加了对 `.env`、秘钥文件及调试日志的自动忽略，防止秘钥泄露。
- **Sanitized Tests / 清理测试脚本**: Removed hardcoded API keys from test scripts. / 从测试脚本中移除了硬编码的 API Key。

### 🏗️ Organization / 结构

- **Test Directory / 测试目录**: Moved test scripts into a dedicated `mcp-server/test/` directory. / 将所有独立测试脚本移动至专用的 `mcp-server/test/` 目录。

### 📝 Documentation / 文档

- Updated `README.md`, `README.zh-CN.md`, and `GEMINI.md` with detailed bilingual usage. / 同步更新了中英文文档，增加了详细的使用说明。

---

## [1.2.0] — 2026-03-05 🍌+ Imagen 4 Upgrade & predict API / Imagen 4 升级

### ✨ Added / 新增

- **Imagen 4 Ultra & Fast**: Full support for next-gen Imagen 4 models via `predict` API. / 通过 `predict` API 全面支持 Imagen 4 Ultra 和 Fast 模型。
- **Output Sample / 效果样例**: Added Imagen 4 Ultra proof-of-work image to documentation. / 在文档中增加了 Imagen 4 Ultra 的实测出图。

---

## [1.1.0] — 2026-03-05 🍌+ First Plus Release — Per-call Model Switching + Aspect Ratio

This is the first release of **nanobanana-plus**, forked from the original [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) (Apache 2.0) with key enhancements the community has been asking for.

### ✨ Added

#### 🔀 Per-call Model Switching (addresses [nanobanana#44](https://github.com/gemini-cli-extensions/nanobanana/issues/44))

The most-requested feature in the nanobanana community. Previously, switching models required restarting the MCP server via environment variable. Now you can specify the model **per call**:

```
# Use Pro for this one image
generate_image --prompt "..." --model gemini-3-pro-image-preview

# Use flash for quick drafts (default, free quota)
generate_image --prompt "..."
```

Supported models:

| `model` value | Name | Best for |
|---|---|---|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | ⚡ Default · Fast · Saves quota |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 High quality · Fine details |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 Legacy compatibility |

#### 📐 Aspect Ratio Control

The original nanobanana only generates **1:1 square images**. nanobanana-plus lets you specify the native aspect ratio per call:

```
generate_image --prompt "..." --aspectRatio "16:9"   # widescreen
generate_image --prompt "..." --aspectRatio "9:16"   # portrait / mobile / Xiaohongshu
generate_image --prompt "..." --aspectRatio "1:1"    # square (original behavior)
```

Supported ratios: `16:9` · `9:16` · `1:1` · `4:3` · `3:4`

#### 🔐 OAuth / ADC Fallback

No API key? No problem. If you're already logged into Gemini CLI (`gemini auth login`), nanobanana-plus will automatically reuse your login credentials. No `NANOBANANA_GEMINI_API_KEY` required.

**Priority order:**

1. `NANOBANANA_GEMINI_API_KEY` env var
2. `GEMINI_API_KEY` env var
3. `GOOGLE_API_KEY` env var
4. **OAuth / Application Default Credentials (ADC)** ← new fallback

#### 🧭 Model Info in Response

Every successful generation now returns which model was used:

```
✅ Successfully generated 1 image(s)
🍌 Model: Nano Banana Pro 🎨 (gemini-3-pro-image-preview)
📐 Aspect ratio: 16:9
📁 Saved to: /Users/.../image.png
```

#### 🛠️ setup.sh — One-click Onboarding

New setup script for first-time users:

```bash
git clone https://github.com/webkubor/nanobanana-plus
bash nanobanana-plus/setup.sh
```

Guides you to [Google AI Studio](https://aistudio.google.com/apikey), pastes the key, writes to `~/.zshrc`. Done.

### 🔧 Changed

- Forked from nanobanana `v1.0.11` (latest at time of fork)
- Extension name: `nanobanana` → `nanobanana-plus`
- All 7 original tools preserved: `generate_image`, `edit_image`, `restore_image`, `generate_icon`, `generate_pattern`, `generate_story`, `generate_diagram`

### 📦 Dependencies

- `fastmcp` / `@modelcontextprotocol/sdk` — unchanged from upstream
- `@google/genai` — unchanged from upstream

---

## Upstream: [1.0.11] — 2026-02-26 (nanobanana)

> Changes inherited from the original nanobanana project

- Set Nano Banana 2 (`gemini-3.1-flash-image-preview`) as the default model.

## Upstream: [1.0.10] — 2025-11-20

- Add support for Nano Banana Pro (`gemini-3-pro-image-preview`).

## Upstream: [1.0.0] — Initial release

- Initial release of nanobanana.

---

## 🤝 Contributing / 共创

**nanobanana-plus is open for contributions!**

We're especially looking for help with:

- 🌍 **More aspect ratios** — test and document which ratios each model supports best
- 🎨 **Style presets** — pre-built prompt prefixes for common styles (anime, photorealistic, watercolor...)
- 🔁 **Batch model comparison** — generate the same prompt with flash + pro side by side
- 📊 **Quota tracking** — detect and warn when approaching API rate limits
- 🌐 **i18n** — improve Chinese documentation and error messages

### How to contribute

```bash
git clone https://github.com/webkubor/nanobanana-plus
cd nanobanana-plus/mcp-server
npm install
npm run dev       # watch mode
npm run build     # compile TypeScript
```

Key files:

- `mcp-server/src/index.ts` — MCP tool definitions (add new params here)
- `mcp-server/src/imageGenerator.ts` — API call logic (model / aspectRatio handling)
- `mcp-server/src/types.ts` — TypeScript interfaces

PRs welcome. Please open an issue first for large changes.

> 💬 Found a bug or have a feature idea? [Open an issue](https://github.com/webkubor/nanobanana-plus/issues) — all feedback welcome!
