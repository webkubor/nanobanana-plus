<div align="center">

# 🍌+ nanobanana-plus

**CLI image generator — one prompt, any aspect ratio, multiple models.**

[中文文档](./README.md) · [Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/webkubor/nanobanana-plus/issues)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](package.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

> **Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)** — adds the most requested feature from [Issue #44](https://github.com/gemini-cli-extensions/nanobanana/issues/44): **per-call model switching without restart**.

---

## Related Projects

- [Prompt Lab](https://github.com/webkubor/prompt-lab): a creative workflow library for AI image prompting, scene references, and production-ready guidance.
- [CortexOS](https://github.com/webkubor/CortexOS): a local-first control plane for persistent context, project routing, and multi-agent collaboration.

---

## Real Output

> Original nanobanana outputs only 1:1 square images. nanobanana-plus supports arbitrary aspect ratios.

![CLI 操作截图](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cli-output.png)

![橙色猫咪坐在雨天窗台上](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cat-rainy-window.png)

---

## Quick Start

**Install**

```bash
pnpm add -g nanobanana-extension
# or
npm install -g nanobanana-extension
```

**Configure API key**

```bash
export NANOBANANA_GEMINI_API_KEY=<your_gemini_api_key>
echo 'export NANOBANANA_GEMINI_API_KEY=<your_key>' >> ~/.zshrc
```

> If you have already logged in with `gemini auth login`, the extension reuses your auth context automatically.

**Generate an image**

```bash
nanobanana-plus generate \
  --prompt "A ginger cat sitting on a rainy windowsill" \
  --filename ./output/cat.png \
  --aspect-ratio 16:9
```

---

## Options

| Option | Required | Default | Description |
|--------|:--------:|---------|-------------|
| `--prompt` | yes | — | Image description |
| `--model` | no | flash | Model to use |
| `--aspect-ratio` | no | `1:1` | Output aspect ratio |
| `--output-count` | no | `1` | Number of images (1–8) |
| `--filename` | no | auto | Output file path |
| `--file-format` | no | `png` | `png` or `jpeg` |
| `--seed` | no | — | Deterministic seed |
| `--preview` / `--no-preview` | no | — | Toggle preview |

---

## Model Switching

No restart required. Choose model per request:

| `model` value | Model | Best for |
|-----------|---------|---------|
| *(default)* `gemini-3.1-flash-image-preview` | Nano Banana 2 | fast daily generation |
| `gemini-3-pro-image-preview` | Nano Banana Pro | higher quality details |
| `gemini-2.5-flash-image` | Nano Banana v1 | legacy compatibility |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra | top realism (Pro Key required) |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast | speed+quality (Pro Key required) |

```bash
# Optional: set global default model
export NANOBANANA_MODEL=gemini-3-pro-image-preview
```

> 21:9 is supported by Gemini models only. Imagen 4 returns an unsupported error.
> Full compatibility matrix: [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md)

---

## Aspect Ratio

| `--aspect-ratio` | Typical usage |
|-------------|------|
| `16:9` | desktop wallpaper / YouTube thumbnail |
| `9:16` | mobile wallpaper / short-video cover |
| `1:1` | avatar / square social post |
| `4:3` | classic landscape |
| `3:4` | classic portrait |

**Prompt tip:** when you pass `--aspect-ratio`, do not repeat the ratio inside the prompt. Keep ratio control in the flag, keep the prompt focused on content.

---

## What's New vs nanobanana

| Feature | nanobanana | nanobanana-plus |
|------|:---:|:---:|
| Text-to-Image | ✅ | ✅ |
| Image Editing | ✅ | ✅ |
| Restoration | ✅ | ✅ |
| Per-call model switch | ❌ restart required | ✅ per request |
| Aspect ratio control | ❌ 1:1 only | ✅ `16:9 / 1:1 / 9:16` etc. |

---

## Prerequisites

- Node.js 18+
- API key:

```bash
export NANOBANANA_GEMINI_API_KEY=<your_key>   # recommended
export GEMINI_API_KEY=<your_key>               # fallback
export GOOGLE_API_KEY=<your_key>               # fallback
```

---

## Contributing

Contributions are welcome.

Focus areas:
- More verified aspect ratios across model versions
- Built-in style presets
- Side-by-side flash vs pro comparison mode

```bash
git clone https://github.com/webkubor/nanobanana-plus
cd nanobanana-plus
pnpm install
pnpm run dev
```

> Found a bug or want a feature? Open an issue: <https://github.com/webkubor/nanobanana-plus/issues>

---

## License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.

---

<div align="center">

If this helps you, please give it a ⭐

</div>
