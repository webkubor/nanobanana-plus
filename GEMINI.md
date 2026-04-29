# image-agent-plus

Local-first image agent workflow for Codex CLI, Gemini CLI, OpenClaw, and Hermes.

## CLI Usage

```bash
image-agent-plus check

image-agent-plus generate \
  --prompt "..." \
  --provider codex \
  --aspect-ratio "16:9"
```

For Codex image generation, do not nest `codex exec`. Generate the image in the active Codex session, then collect the latest generated file:

```bash
image-agent-plus collect-codex
image-agent-plus collect-codex --filename ~/Desktop/output.png
```

## Auth Policy

- Prefer installed local runtime: Codex CLI first, Gemini CLI second.
- Do not ask users for API keys when Codex CLI or Gemini CLI is available.
- Only ask for API keys when neither local runtime is available, or when the user explicitly chooses direct provider API mode.

## Model Selection

| Value | Notes |
|-------|-------|
| Codex default | Codex CLI image flow; no `--model` needed |
| `gemini-3.1-flash-image-preview` | Default fast Gemini image model |
| `gemini-3-pro-image-preview` | Higher-detail Gemini image model |
| `gemini-2.5-flash-image` | Legacy Gemini image compatibility |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra direct API mode |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast direct API mode |
| `gpt-image-1.5` | OpenAI image direct API mode |
| `gpt-image-1` | OpenAI image direct API mode |

When `model` is omitted, Codex provider does not pass `-m` and lets Codex CLI choose its own image flow. Gemini provider uses `IMAGE_AGENT_MODEL`, then legacy `NANOBANANA_MODEL`, then the default Gemini image model.
