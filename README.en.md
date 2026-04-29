# image-agent-plus

Local-first image workflow for Codex CLI, Gemini CLI, OpenClaw, and Hermes.

Use local runtime first. Do not ask for API keys when Codex CLI or Gemini CLI is installed. API keys are only for direct provider API mode or for machines without both local runtimes.

```bash
npm install -g image-agent-plus
image-agent-plus check

image-agent-plus generate \
  --prompt "Chinese editorial poster about what we should preserve in the AI era" \
  --provider gemini \
  --aspect-ratio 16:9
```

See [README.md](./README.md) and [CHANGELOG.md](./CHANGELOG.md).
