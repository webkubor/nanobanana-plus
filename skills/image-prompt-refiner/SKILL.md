---
name: image-prompt-refiner
description: "Optimize a short user image request into a production-ready prompt. Ask targeted clarification questions when key generation constraints are missing, especially image size/aspect ratio."
version: 1.0.0
license: Apache-2.0
author: webkubor
compatibility:
  platforms:
    - codex
    - openclaw
    - hermes
---

# Image Prompt Refiner

Use this skill when the user gives a short or vague image request and wants a better prompt before generation.

## Goal

Turn one sentence into a usable image-generation brief without inventing critical constraints.

## Required Checks

Before generating or calling `image-agent-plus`, check whether the user specified:

- `purpose`: where the image will be used, such as poster, cover, product shot, wallpaper, social post, UI illustration.
- `aspect_ratio` or `size`: such as `1:1`, `3:4`, `9:16`, `16:9`, `21:9`.
- `subject`: main object/person/scene.
- `style`: realistic, editorial, Chinese ink, cyberpunk, product photography, anime, 3D, etc.
- `text_policy`: whether the image should contain text. If Chinese text must be accurate, recommend post-layout instead of asking the image model to render important text.

## Ask First When Missing

Ask a concise clarification question before generation when any of these are missing:

- Image aspect ratio or platform size.
- Whether the output is for public/commercial use.
- Whether the user expects exact text inside the image.
- Whether a person, brand, or IP must be preserved accurately.

Do not ask broad questions. Ask 1-3 specific questions.

Good:

```text
需要先确认两个参数：
1. 用在哪个平台/比例？比如小红书 3:4、抖音 9:16、README 16:9。
2. 图片里是否需要准确中文文字？如果需要，建议图像只留文字区，文字后期排版。
```

Bad:

```text
你想要什么风格？
```

## Prompt Output Format

When enough information is available, output:

```text
用途：
比例：
模型建议：
优化后提示词：
负面约束：
生成命令：
```

## Prompt Rules

- Prefer Chinese prompt wording for Chinese cultural/new-media use cases.
- Include composition, lighting, texture, camera/lens, color direction, and empty text space when relevant.
- Keep prompts concrete. Avoid empty words like "高级感" unless translated into visible decisions.
- If exact Chinese typography matters, ask the model for layout space only.

## Command Template

```bash
image-agent-plus generate \
  --provider gemini \
  --prompt "<optimized prompt>" \
  --aspect-ratio "16:9" \
  --filename output.png
```

Use `--provider openai` when the user needs stronger text rendering or instruction following and an OpenAI key is configured.
