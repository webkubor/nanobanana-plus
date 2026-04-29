---
name: image-prompt-refiner
description: "Smart prompt intake and expansion for image-agent-plus. Checks active profile first, asks only the questions the profile doesn't answer, then produces an expanded ready-to-run command."
version: 2.0.0
license: Apache-2.0
author: webkubor
compatibility:
  platforms:
    - codex
    - openclaw
    - hermes
---

# Image Prompt Refiner

Turn any short user request into a production-ready generate command, without asking unnecessary questions.

## Decision tree

```
User says something
       │
       ▼
Load active profile  ←── image-agent-plus profile list
       │
  Profile found?
  ┌────┴────┐
 YES       NO
  │         │
  │    Ask: purpose/platform (1 question)
  │         │
  │    Map to profile, save it
  │         │
  └────┬────┘
       │
  Aspect ratio missing?  ──YES──► Ask (use platform as hint)
       │NO
  Style missing and prompt has no style signal?  ──YES──► Ask
       │NO
       │
  Expand prompt (profile + rules)
       │
  Produce generate command
```

## Profile-aware expansion rules

When expanding, inject tokens the profile defines — never re-ask what the profile already specifies.

| Profile field   | Expansion action                                           |
|-----------------|------------------------------------------------------------|
| `aspectRatio`   | Add composition hint (vertical/horizontal/square framing) |
| `platform`      | Add platform aesthetic tokens                              |
| `style`         | Append style description                                   |
| `qualityLevel`  | Append quality tokens (fast / standard / high detail)     |
| `promptSuffix`  | Append verbatim to end of prompt                          |

## Ask at most 3 questions, in this priority order

1. **Purpose** — only if no active profile
   > 这张图用在哪？(小红书 / 博客 / 壁纸 / 海报 / 其他)

2. **Aspect ratio** — only if profile has none AND purpose doesn't imply it
   > 横版(16:9)、竖版(9:16)、方形(1:1)，还是其他比例？

3. **Style** — only if prompt has zero style signal AND profile has no style
   > 写实照片、插画、赛博朋克，还是保持默认？

Never ask all three at once. Ask one, read the answer, proceed.

## Output format

When ready to generate:

```
用途：[platform]
比例：[ratio]
风格：[style]
扩写后提示词：[expanded prompt]

生成命令：
image-agent-plus generate \
  --profile [name] \
  --prompt "[expanded prompt]" \
  --aspect-ratio [ratio]
```

If the active profile already covers ratio and style, skip those lines and just show the command.

## Prompt expansion rules

**Composition by ratio:**
- `9:16` → "vertical composition, subject centered, safe zones at top and bottom"
- `3:4` → "portrait composition, subject in upper-center, breathing room"
- `1:1` → "square composition, centered subject, balanced negative space"
- `16:9` → "wide landscape, rule of thirds, cinematic depth"
- `21:9` → "ultra-wide cinematic, panoramic sweep"

**Short prompt padding** (< 40 chars):
Add: `subject sharp and detailed, soft ambient light, minimal noise`

**Chinese text in image warning:**
If user mentions 文字/字体/标题, add a note:
> 建议图内不放精确文字，留出文字区后期排版；如需图内文字，推荐 OpenAI provider（--provider openai）文字渲染更稳定。

## Safety boundary

- Never invent content the user didn't ask for (people, brands, text)
- Don't promise pixel-exact reproduction from reference images unless edit mode is confirmed
- Don't claim to copy a named artist's style verbatim — use "visual style inspired by [aesthetic]"

## Command template

```bash
image-agent-plus generate \
  --profile [name] \
  --prompt "[expanded prompt]" \
  --aspect-ratio [ratio] \
  --provider [provider]
```

For Codex (default when installed):
```bash
image-agent-plus generate \
  --profile social \
  --prompt "一只橘猫坐在雨天窗台上"
```

For Gemini with API key:
```bash
IMAGE_AGENT_PROVIDER=gemini \
image-agent-plus generate \
  --profile blog \
  --prompt "a futuristic city skyline at dusk"
```
