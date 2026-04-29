<div align="center">

# image-agent-plus

**Local-first image workflow for Codex CLI, Gemini CLI, OpenClaw, and Hermes.**

[Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/webkubor/image-agent-plus/issues)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](package.json)
[![Stars](https://img.shields.io/github/stars/webkubor/image-agent-plus?style=flat&color=yellow)](https://github.com/webkubor/image-agent-plus/stargazers)

</div>

---

`image-agent-plus` is no longer a Nano Banana-only wrapper. It is a local image-agent toolkit that prefers installed CLI runtimes first:

- Codex CLI users do not need to provide an API key.
- Gemini CLI users do not need to provide an API key.
- OpenClaw and Hermes are detected as agent runtimes.
- API keys are only for direct provider API mode, or for machines without Codex/Gemini local runtime.

The project still supports Gemini/Nano Banana-compatible model IDs and OpenAI image models as direct provider backends.

---

## Install

```bash
npm install -g image-agent-plus
```

## Runtime Check

```bash
image-agent-plus check
# codex and gemini are installed. Default runtime: codex.
# Agent runtimes: openclaw, hermes.
```

Runtime selection:

| Local CLI state | Default runtime |
|-----------------|-----------------|
| `codex` and `gemini` installed | `codex` |
| only `codex` installed | `codex` |
| only `gemini` installed | `gemini` |
| `openclaw` installed | exposed as agent runtime |
| `hermes` installed | exposed as agent runtime |
| neither `codex` nor `gemini` installed | fail with explicit install/API-mode guidance |

`generate` runs the same runtime check before image generation.

---

## Generate

```bash
image-agent-plus generate \
  --prompt "a tabby cat sitting on a rainy windowsill, cinematic lighting" \
  --provider gemini \
  --aspect-ratio 16:9
```

## Providers and Models

No server restart is needed. Provider/model can be selected per call.

| `--provider` | Backend | Default auth path |
|--------------|---------|-------------------|
| `gemini` *(default)* | Gemini / Nano Banana-compatible / Imagen models | Gemini CLI OAuth/ADC or optional API key |
| `openai` | OpenAI GPT Image models | Codex CLI for agent workflow, optional API key for direct HTTP API mode |

| `--model` | Name | Best for |
|-----------|------|----------|
| *(default)* | `gemini-3.1-flash-image-preview` | Fast daily generation |
| `gemini-3-pro-image-preview` | Gemini Pro image | Higher detail |
| `gemini-2.5-flash-image` | Gemini legacy image | Compatibility |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra | Photorealistic direct API mode |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast | Fast direct API mode |
| `gpt-image-1.5` | OpenAI GPT Image | Text rendering and instruction following |
| `gpt-image-1` | OpenAI GPT Image 1 | Stable OpenAI image generation |

Optional direct API env vars:

```bash
export IMAGE_AGENT_MODEL=gemini-3-pro-image-preview
export IMAGE_AGENT_PROVIDER=openai
export IMAGE_AGENT_OPENAI_MODEL=gpt-image-1.5
export IMAGE_AGENT_GEMINI_API_KEY="your_key"      # optional direct Gemini API mode
export IMAGE_AGENT_OPENAI_API_KEY="your_key"      # optional direct OpenAI API mode
```

Legacy `NANOBANANA_*` env vars are still read as fallbacks, but new installs should use `IMAGE_AGENT_*`.

---

## Agent Skills

This package includes agent-facing skills for Codex, OpenClaw, and Hermes:

| Skill | Purpose |
|-------|---------|
| `skills/image-prompt-refiner/SKILL.md` | Optimizes a short image request into a production prompt and asks targeted questions when key constraints are missing, especially size/aspect ratio. |
| `skills/reference-style-transfer/SKILL.md` | Converts a reference image into a style-transfer brief for generating a new image with the same visual language. |
| `skills/image-agent-plus/SKILL.md` | Calls the local `image-agent-plus` CLI. |

---

## Options

| Flag | Required | Description |
|------|:--------:|-------------|
| `--prompt` | yes | Describe the image |
| `--provider` | no | `gemini` or `openai` |
| `--model` | no | Provider model ID |
| `--aspect-ratio` | no | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9` |
| `--output-count` | no | 1-8 images per call |
| `--filename` | no | Output file path |
| `--file-format` | no | `png` or `jpeg` |
| `--seed` | no | Fix random seed for reproducibility |
| `--preview` / `--no-preview` | no | Toggle preview |

---

## Development

```bash
git clone https://github.com/webkubor/image-agent-plus
cd image-agent-plus
pnpm install
pnpm run build
```

## License

Apache License 2.0. Fork lineage includes Google's original [nanobanana](https://github.com/gemini-cli-extensions/nanobanana).
