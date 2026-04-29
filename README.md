<div align="center">

# image-agent-plus

**One sentence → great image. No API key needed.**

Smart AI image generator powered by Codex CLI or Gemini CLI —  
auto prompt expansion, reusable profiles, zero configuration.

[Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/webkubor/image-agent-plus/issues) · [npm](https://www.npmjs.com/package/image-agent-plus)

[![npm version](https://img.shields.io/npm/v/image-agent-plus?color=blue)](https://www.npmjs.com/package/image-agent-plus)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/webkubor/image-agent-plus?style=flat&color=yellow)](https://github.com/webkubor/image-agent-plus/stargazers)

</div>

---

![AI 时代，我们应该沉淀下来的是什么](https://raw.githubusercontent.com/webkubor/image-agent-plus/main/skills/image-agent-plus/assets/ai-era-editorial-poster.png)

---

## What it does

```bash
npm install -g image-agent-plus
image-agent-plus generate --prompt "a tabby cat on a rainy windowsill"
```

That's it. No API key. No config. Just install [Codex CLI](https://github.com/openai/codex), and you're generating.

**Key features:**

- 🚫 **No API key required** — uses your local Codex CLI login
- 🧠 **Smart prompt expansion** — short prompts auto-enriched from your profile
- 🎯 **Reusable profiles** — set once, generate forever (social / blog / wallpaper / poster …)
- 🤖 **Agent-native** — skills for Codex, OpenClaw, and Hermes included
- 🔀 **Multi-provider** — Codex · Gemini · OpenAI, switchable per call

---

## Quick start

```bash
# 1. Install Codex CLI (one-time setup, no API key needed)
npm install -g @openai/codex
codex login

# 2. Install image-agent-plus
npm install -g image-agent-plus

# 3. Generate
image-agent-plus generate --prompt "neon Tokyo street at night, rain"
```

---

## Profiles — set once, skip forever

Profiles save your default platform, aspect ratio, and style so you never repeat yourself.

```bash
# See all profiles (* = active default)
image-agent-plus profile list

# Switch default
image-agent-plus profile use story      # 9:16  stories/reels
image-agent-plus profile use social     # 3:4   instagram / 小红书
image-agent-plus profile use blog       # 16:9  web blog
image-agent-plus profile use wallpaper  # 16:9  desktop
image-agent-plus profile use avatar     # 1:1   profile photo

# Create your own
image-agent-plus profile set \
  --name youtube \
  --platform youtube-thumbnail \
  --aspect-ratio 16:9 \
  --style "bold colorful"
```

Built-in profiles:

| Name        | Platform              | Ratio | Style                |
|-------------|-----------------------|-------|----------------------|
| `social`    | instagram/xiaohongshu | 3:4   | photorealistic       |
| `story`     | stories/reels         | 9:16  | photorealistic       |
| `blog`      | web-blog              | 16:9  | modern illustration  |
| `hero`      | web-hero              | 21:9  | cinematic            |
| `wallpaper` | desktop-wallpaper     | 16:9  | artistic             |
| `avatar`    | profile-photo         | 1:1   | photorealistic       |
| `poster`    | print-poster          | 3:4   | editorial            |

Profiles saved to `~/.image-agent-plus/profiles.json`.

---

## Smart prompt expansion

Short prompts are automatically enriched when a profile is active:

```
Input:   "一只橘猫"
Profile: social (3:4, photorealistic, instagram/xiaohongshu)

Output:  "一只橘猫, portrait composition, subject in upper-center,
          lifestyle aesthetic, warm tones, soft bokeh, shareable,
          photorealistic, high detail, professional quality, sharp focus,
          subject sharp and detailed, soft ambient light, minimal noise"
```

Pass `--no-expand` to use the raw prompt as-is.

---

## Generate

```bash
# Uses active profile — aspect ratio, style, provider auto-applied
image-agent-plus generate --prompt "cherry blossoms at dusk"

# Override aspect ratio for this call
image-agent-plus generate --prompt "wide city skyline" --aspect-ratio 16:9

# Use a specific profile for this call
image-agent-plus generate --prompt "product shot" --profile avatar

# Multiple images
image-agent-plus generate --prompt "abstract art" --output-count 4
```

---

## Runtime check

```bash
image-agent-plus check
```

| State | Default provider |
|-------|-----------------|
| Codex CLI installed | `codex` — no API key ever needed |
| Only Gemini CLI | `gemini` — needs `GEMINI_API_KEY` for image output |
| Neither installed | guided install message |

Override per call: `--provider codex|gemini|openai`

Optional env vars for direct API mode:

```bash
export IMAGE_AGENT_GEMINI_API_KEY="your_key"
export IMAGE_AGENT_OPENAI_API_KEY="your_key"
```

---

## Agent skills

| Skill | What it does |
|-------|-------------|
| [`image-prompt-refiner`](./skills/image-prompt-refiner/SKILL.md) | Checks profile, asks only missing questions, expands prompt |
| [`reference-style-transfer`](./skills/reference-style-transfer/SKILL.md) | Extracts style from a reference image and builds a transfer prompt |
| [`image-agent-plus`](./skills/image-agent-plus/SKILL.md) | Direct CLI invocation skill |

Agent commands (`.toml`): `smart` · `profile` · `generate` · `image-agent`

---

## CLI reference

| Flag | Default | Description |
|------|---------|-------------|
| `--prompt` | required | Image description |
| `--profile` | active default | Profile to apply |
| `--no-expand` | false | Skip prompt expansion |
| `--aspect-ratio` | from profile | `16:9` `9:16` `1:1` `3:4` `21:9` |
| `--provider` | auto | `codex` `gemini` `openai` |
| `--output-count` | 1 | 1–8 images |
| `--filename` | `~/Desktop/image-agent-plus-output/` | Output path |
| `--seed` | — | Fix seed for reproducibility |
| `--preview` / `--no-preview` | — | Open after generation |

---

## Development

```bash
git clone https://github.com/webkubor/image-agent-plus
cd image-agent-plus
pnpm install && pnpm run build
node bin/image-agent-plus.js check
```

---

## License

Apache License 2.0. Fork lineage includes Google's original [nanobanana](https://github.com/gemini-cli-extensions/nanobanana).
