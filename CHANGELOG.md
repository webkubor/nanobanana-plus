# Changelog

All notable changes to **nanobanana-plus** will be documented here.

Format: [Semantic Versioning](https://semver.org/) | Based on [Keep a Changelog](https://keepachangelog.com/)

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
