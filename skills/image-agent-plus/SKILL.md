---
name: image-agent-plus
description: "Use image-agent-plus CLI to generate images with local-first Codex/Gemini runtime detection, per-call provider/model switching, and aspect ratio control."
version: 2.0.0
license: Apache-2.0
homepage: https://github.com/webkubor/image-agent-plus
store: https://clawhub.ai/webkubor/image-agent-plus
author: webkubor
compatibility:
  platforms:
    - codex
    - openclaw
    - hermes
metadata:
  openclaw:
    emoji: "🎨"
    requires:
      bins: ["node"]
    install:
      - id: node-brew
        kind: brew
        formula: node
        bins: ["node"]
        label: "Install Node.js (brew)"
---

# image-agent-plus

Direct CLI invocation. No HTTP server required.

## Runtime Rule

Before asking for an API key, run:

```bash
image-agent-plus check
```

If Codex CLI or Gemini CLI is installed, do not ask the user for an API key. API keys are only for direct provider API mode or for machines without both local runtimes.

## Quick Start

```bash
image-agent-plus generate \
  --prompt "一只橘猫坐在雨天窗台上，电影感光线" \
  --aspect-ratio "16:9"
```

## Common Commands

```bash
image-agent-plus check

image-agent-plus generate \
  --prompt "AI 时代，我们应该沉淀下来的是什么，中文社论海报" \
  --provider gemini \
  --aspect-ratio "16:9"
```

## Options

| Flag | Description |
|------|-------------|
| `--prompt` | Image description, required |
| `--provider` | `gemini` or `openai` |
| `--filename` | Output file path |
| `--aspect-ratio` | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9` |
| `--model` | Provider model ID |
| `--output-count` | Number of images, 1-8 |

## Environment

Prefer local runtime. Direct API mode may use:

```bash
export IMAGE_AGENT_GEMINI_API_KEY="your_key"
export IMAGE_AGENT_OPENAI_API_KEY="your_key"
```

Legacy `NANOBANANA_*` variables are accepted as fallbacks only.
