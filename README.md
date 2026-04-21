<div align="center">

# 🍌 nanobanana-plus

**One prompt. Any ratio. Any model. No restart.**

[中文](./README.zh.md) · [Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/webkubor/nanobanana-plus/issues)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](package.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)

</div>

---

> *"The official nanobanana always outputs a cropped 1:1 square.
> To change the model you have to restart the whole server.
> I just wanted a 16:9 wallpaper."*
>
> — Issue [#44](https://github.com/gemini-cli-extensions/nanobanana/issues/44), 89 thumbs up

This fork fixes that. Fork of Google's official [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) — **dynamic model switching + any aspect ratio, per call.**

---

## Install

```bash
npm install -g nanobanana-extension
```

> Already logged in with `gemini auth login`? That's all you need — OAuth is reused automatically.

---

## Real output

```bash
nanobanana-plus generate \
  --prompt "a tabby cat sitting on a rainy windowsill, cinematic lighting" \
  --aspect-ratio 16:9
# ✅ Saved → /Users/you/tabby-cat-rainy-window.png
```

<details>
<summary>📸 Demo output (click to expand)</summary>

**nanobanana-plus** — full 16:9 composition preserved:
![橙色猫咪坐在雨天窗台上](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cat-rainy-window.png)

**original nanobanana** — same prompt, always cropped to 1:1 square:
![CLI 操作截图](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cli-output.png)

</details>

---

## What's different from upstream

| Feature | nanobanana (official) | nanobanana-plus |
|---------|:---:|:---:|
| Aspect ratio | 1:1 only | 16:9 / 9:16 / 4:3 / 3:4 / 21:9 |
| Switch model per call | ❌ restart required | ✅ `--model` flag |
| Imagen 4 Ultra / Fast | ❌ | ✅ |
| Output count (1-8) | ❌ | ✅ `--output-count` |
| Seed control | ❌ | ✅ `--seed` |

---

## Models

No server restart needed — specify per call.

| `--model` | Name | Best for |
|-----------|------|---------|
| *(default)* | Nano Banana 2 (`gemini-3.1-flash-image-preview`) | ⚡ Daily use, quota-friendly |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 High quality, fine detail |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 Legacy compat |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra 💎 | Photorealistic (Pro Key required) |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast 🚀 | Speed + quality (Pro Key required) |

```bash
# Set a global default
export NANOBANANA_MODEL=gemini-3-pro-image-preview
```

---

## All options

| Flag | Required | Description |
|------|:--------:|-------------|
| `--prompt` | ✅ | Describe the image |
| `--model` | — | Model ID (default: Nano Banana 2) |
| `--aspect-ratio` | — | `16:9` / `9:16` / `1:1` / `4:3` / `3:4` / `21:9`* |
| `--output-count` | — | 1–8 images per call (default: 1) |
| `--filename` | — | Output file path |
| `--file-format` | — | `png` (default) or `jpeg` |
| `--seed` | — | Fix random seed for reproducibility |
| `--preview` / `--no-preview` | — | Toggle preview |

> *`21:9` ultra-wide only supported on Gemini models. See [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md).

---

## Gallery

### 💎 Imagen 4 Ultra — photorealistic

```bash
nanobanana-plus generate \
  --prompt "majestic snowy mountain peak under a starry night sky, photorealistic, 8K" \
  --model imagen-4.0-ultra-generate-001 --aspect-ratio 16:9
```
![Ultra 16:9](https://files.catbox.moe/a7sfh2.png)

### ⚡ Nano Banana 2 — fast daily (default)

```bash
nanobanana-plus generate \
  --prompt "cyberpunk city at night, neon lights, rain reflections, cinematic" \
  --model gemini-3.1-flash-image-preview --aspect-ratio 16:9
```
![Nano Banana 16:9](https://files.catbox.moe/kl23ih.png)

---

## API Key setup

```bash
export NANOBANANA_GEMINI_API_KEY="your_key"   # recommended
export GEMINI_API_KEY="your_key"               # fallback
export GOOGLE_API_KEY="your_key"               # fallback
```

> Already logged in with Gemini CLI? OAuth session is reused — no key needed.

---

## Aspect ratio quick reference

| Ratio | Use case |
|-------|---------|
| `16:9` | 🖥️ Desktop wallpaper / YouTube thumbnail / blog header |
| `9:16` | 📱 Phone wallpaper / Reels / Stories |
| `1:1` | ⬜ Avatar / Instagram / WeChat article |
| `4:3` | 🖼️ Classic landscape / presentation |
| `3:4` | 📄 Classic portrait / poster |
| `21:9` | 🎬 Cinematic ultrawide |

---

## Contributing

PRs welcome. Most wanted:

- 🎨 **Style presets** — ink wash, ukiyo-e, cyberpunk as built-in prompt prefixes
- 🔁 **Model comparison** — render same prompt with flash + pro side by side
- 📊 **Quota tracker** — alert when approaching API limits

```bash
git clone https://github.com/webkubor/nanobanana-plus
cd nanobanana-plus && pnpm install && pnpm run dev
```

---

## License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.

---

<div align="center">

**If this saved you a restart, leave a ⭐**

</div>
