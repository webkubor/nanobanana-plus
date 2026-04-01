---
name: nanobanana-plus
description: "Use nanobanana-plus over HTTP to generate images with per-call model switching and aspect ratio control. Best for OpenClaw / 小龙虾 users who have a running nanobanana-plus service. Run init for a guided setup, then use: node {baseDir}/scripts/nanobanana-plus.mjs generate --prompt 'desc' --filename 'out.png' [--aspect-ratio 16:9] [--model gemini-3.1-flash-image-preview]. Also supports check and models."
version: 1.5.2
license: Apache-2.0
homepage: https://github.com/webkubor/nanobanana-plus
author: webkubor
compatibility:
  platforms:
    - openclaw
metadata:
  openclaw:
    emoji: "🍌"
    requires:
      bins: ["node"]
    install:
      - id: node-brew
        kind: brew
        formula: node
        bins: ["node"]
        label: "Install Node.js (brew)"
---

# nanobanana-plus for OpenClaw

Use the bundled script to call a running `nanobanana-plus` HTTP service.

Initialize once with a guided prompt:

```bash
node {baseDir}/scripts/nanobanana-plus.mjs init
```

Or pass the values explicitly:

```bash
node {baseDir}/scripts/nanobanana-plus.mjs init \
  --base-url "http://localhost:3456" \
  --token "your-private-token"
```

Default service URL:

```bash
http://localhost:3456
```

`init` does not store credentials on disk. It only prints the exact commands to run next.

Health check:

```bash
node {baseDir}/scripts/nanobanana-plus.mjs check --base-url "http://localhost:3456"
```

List models:

```bash
node {baseDir}/scripts/nanobanana-plus.mjs models \
  --base-url "http://localhost:3456" \
  --token "your-private-token"
```

Generate one image:

```bash
node {baseDir}/scripts/nanobanana-plus.mjs generate \
  --base-url "http://localhost:3456" \
  --prompt "一只橘猫坐在雨天窗台上" \
  --filename "cat-window.png" \
  --aspect-ratio "16:9" \
  --token "your-private-token"
```

Generate multiple images:

```bash
node {baseDir}/scripts/nanobanana-plus.mjs generate \
  --base-url "http://localhost:3456" \
  --prompt "cinematic sci-fi alley at night" \
  --filename "alley.png" \
  --output-count 2 \
  --model "gemini-3-pro-image-preview" \
  --token "your-private-token"
```

Notes:

- `generate` works with local or remote nanobanana-plus services.
- This skill intentionally requires explicit `--token` for private services instead of reading environment variables or local config files.
- `edit` and `restore` are intentionally omitted from the ClawHub skill so it does not send local file paths or local file contents over HTTP.
- The script writes image files locally and prints `MEDIA:` lines so supported chat providers can auto-attach the outputs.
- The script no longer reads tokens from environment variables and no longer stores credentials on disk.
- Use `init`, `--token`, or `--base-url` to control credentials and endpoint.
- If the service is not running, start it separately with `nanobanana-plus api --port 3456`.
