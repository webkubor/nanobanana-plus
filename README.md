# 🍌 nanobanana-plus

[中文文档](./README.zh-CN.md)

The first Gemini CLI extension with per-call model switching for Nano Banana image models.

## Highlights
- Per-call model switch without server restart
- Aspect ratio control (`16:9`, `9:16`, `1:1`, etc.)
- Text-to-image, edit, restore, icon, pattern, story, diagram tools
- Authentication preflight before generation
- Runtime API key input + validation

## Quick Start

### Option A: one-command setup
```bash
git clone https://github.com/webkubor/nanobanana-plus
bash nanobanana-plus/setup.sh
```

### Option B: manual setup
```bash
# Install extension
gemini extensions install https://github.com/webkubor/nanobanana-plus

# Preferred key
export NANOBANANA_GEMINI_API_KEY=<your_key>

# Optional fallback to generic env vars
export NANOBANANA_ALLOW_FALLBACK_KEYS=true
export GEMINI_API_KEY=<your_key>
export GOOGLE_API_KEY=<your_key>
```

## Authentication UX (new)
Before any image operation, the extension now follows this flow:
1. Check auth status (`check_auth_status`)
2. If missing key: ask user for API key
3. Validate key (`configure_api_key`)
4. Continue generation only after validation succeeds

This avoids silent key lookup issues across isolated MCP processes.

## Model Switching
Supported `model` values:
- `gemini-3.1-flash-image-preview` (default)
- `gemini-3-pro-image-preview`
- `gemini-2.5-flash-image`

## Aspect Ratio
Use `aspectRatio` (example values):
- `16:9`
- `9:16`
- `1:1`
- `4:3`
- `3:4`

## Tools
- `generate_image`
- `edit_image`
- `restore_image`
- `generate_icon`
- `generate_pattern`
- `generate_story`
- `generate_diagram`
- `check_auth_status`
- `configure_api_key`

## Development
```bash
cd mcp-server
npm install
npm run typecheck
npm run build
```

## License
Apache License 2.0.
