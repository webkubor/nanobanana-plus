# nanobanana-plus — CLI image generator for Nano Banana models

> Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana), Apache 2.0.
> Adds per-call model switching and aspect ratio control.

## CLI Usage

```bash
nanobanana-plus generate \
  --prompt "..." \
  --aspect-ratio "16:9" \
  --model "gemini-3.1-flash-image-preview"
```

## Model Selection (per call)

| Value | Model | Notes |
|-------|-------|-------|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | **Default**, fast, quota-friendly |
| `gemini-3-pro-image-preview` | Nano Banana Pro | High quality, richer detail |
| `gemini-2.5-flash-image` | Nano Banana v1 | Legacy compatibility |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra | Top realism, requires API Key |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast | Speed+quality, requires API Key |

When `model` is omitted, uses `NANOBANANA_MODEL` env var or the default flash model.

## Aspect Ratio

`--aspect-ratio` supports: `"16:9"` `"9:16"` `"1:1"` `"4:3"` `"3:4"`

## All Options

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
