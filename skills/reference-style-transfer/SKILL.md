---
name: reference-style-transfer
description: "Create a new image in the same visual style as a user-provided reference image. Extract style traits, preserve only allowed style elements, and ask clarification questions when target content or size is missing."
version: 1.0.0
license: Apache-2.0
author: webkubor
compatibility:
  platforms:
    - codex
    - openclaw
    - hermes
---

# Reference Style Transfer

Use this skill when the user provides a reference image and asks for an image with the same style, vibe, composition language, or visual treatment.

## Goal

Create a new prompt that transfers style, not copyrighted identity or protected characters.

## Required Inputs

Before generation, confirm:

- `reference_image`: path or attached image.
- `target_subject`: what the new image should depict.
- `aspect_ratio`: output ratio or platform.
- `style_scope`: what to copy from the reference: color, lighting, composition, lens, texture, brushwork, layout, mood.
- `must_preserve`: any brand/product/person details that must stay accurate.

## Ask First When Missing

Ask concise questions if any critical input is absent:

```text
需要确认：
1. 新图主体是什么？不要只说“做一张一样风格的”。
2. 输出比例是多少？比如 3:4、9:16、16:9。
3. 要复刻哪些风格点：配色、构图、光影、材质、镜头，还是全部视觉语言？
```

## Style Extraction Checklist

When reading the reference image, describe:

- `color_palette`: dominant colors and contrast.
- `lighting`: hard/soft, natural/studio, direction, highlight/shadow.
- `composition`: centered, rule of thirds, close-up, negative space, poster layout.
- `texture`: film grain, paper, brush, glossy product, 3D render, ink wash.
- `camera`: lens feel, depth of field, angle, crop.
- `mood`: calm, epic, commercial, mysterious, playful.
- `typography_space`: whether the image leaves room for title text.

## Output Format

```text
参考图风格拆解：
新图目标：
比例：
模型建议：
风格迁移提示词：
禁止复制：
生成命令：
```

## Safety / Copyright Boundary

- Do not claim to copy a living artist's exact style.
- Do not recreate copyrighted characters, logos, or identifiable private persons unless the user has rights and asks for allowed transformation.
- Do not promise pixel-identical replication. The goal is "same visual language", not exact duplicate.

## Command Template

If the backend supports image input/editing, use an edit/reference workflow. If current CLI generate path does not support image input, generate from the extracted style brief and explicitly say reference-image conditioning is not active yet.

```bash
image-agent-plus generate \
  --provider openai \
  --prompt "<style-transfer prompt>" \
  --aspect-ratio "16:9" \
  --filename styled-output.png
```

Use OpenAI provider when reference fidelity and instruction following matter. Use Gemini provider when the user wants Gemini aesthetics or already relies on Gemini auth.
