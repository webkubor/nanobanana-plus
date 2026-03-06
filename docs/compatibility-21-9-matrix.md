# 21:9 Compatibility Test Log / 21:9 支持测试记录

## Summary / 结论

**Supported / 支持 `21:9`**

- `gemini-3.1-flash-image-preview`
- `gemini-3-pro-image-preview`
- `gemini-2.5-flash-image`

**Not supported / 不支持 `21:9`**

- `imagen-4.0-ultra-generate-001`
- `imagen-4.0-fast-generate-001`

## Test Time / 测试时间

- `2026-03-06 14:06:31 CST`

## Test Mode / 测试方式

- Direct API call with model fallback disabled
- 直连 API，并显式关闭模型自动回退

Environment used:

- `NANOBANANA_GEMINI_API_KEY=[REDACTED]`
- `NANOBANANA_DISABLE_MODEL_FALLBACK=true`

## Prompt / 测试 Prompt

```text
A hyper-realistic cinematic 21:9 wide-angle shot of traditional Han Dynasty dark slate roof tiles under heavily pouring rain at night. Water splashing dramatically off the eaves in slow motion. Deep indigo and pitch black color grading with a very faint, distant warm lantern glow reflecting on the wet stone. 35mm film aesthetic, grainy texture, high dynamic range, tense Wuxia atmosphere. No characters, no CGI look, no text.
```

## Command / 执行命令

```bash
env -u GEMINI_API_KEY -u GOOGLE_API_KEY \
NANOBANANA_GEMINI_API_KEY='[REDACTED]' \
NANOBANANA_DISABLE_MODEL_FALLBACK=true \
node --input-type=module -e "
import { ImageGenerator } from './mcp-server/dist/imageGenerator.js';
const prompt = 'A hyper-realistic cinematic 21:9 wide-angle shot of traditional Han Dynasty dark slate roof tiles under heavily pouring rain at night. Water splashing dramatically off the eaves in slow motion. Deep indigo and pitch black color grading with a very faint, distant warm lantern glow reflecting on the wet stone. 35mm film aesthetic, grainy texture, high dynamic range, tense Wuxia atmosphere. No characters, no CGI look, no text.';
const models = [
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-fast-generate-001'
];
const authConfig = ImageGenerator.validateAuthentication();
const generator = new ImageGenerator(authConfig);
const results = [];
for (const model of models) {
  const result = await generator.generateTextToImage({
    prompt,
    aspectRatio: '21:9',
    model
  });
  results.push({
    model,
    success: result.success,
    error: result.error ?? null,
    generatedFiles: result.generatedFiles ?? []
  });
}
console.log(JSON.stringify(results, null, 2));
"
```

## Result Matrix / 结果矩阵

| Model | 21:9 | Result |
| --- | --- | --- |
| `gemini-3.1-flash-image-preview` | ✅ | Generated successfully: `banana-plus/[g-3.1-flash]_2026-03-06_14-07-14_[21-9].png` |
| `gemini-3-pro-image-preview` | ✅ | Generated successfully: `banana-plus/[g-3-pro]_2026-03-06_14-07-38_[21-9].png` |
| `gemini-2.5-flash-image` | ✅ | Generated successfully: `banana-plus/[g-2.5-flash-image]_2026-03-06_14-07-45_[21-9].png` |
| `imagen-4.0-ultra-generate-001` | ❌ | API error: `aspectRatio 21:9 is not supported. Supported values are 1:1, 9:16, 16:9, 4:3, 3:4.` |
| `imagen-4.0-fast-generate-001` | ❌ | API error: `aspectRatio 21:9 is not supported. Supported values are 1:1, 9:16, 16:9, 4:3, 3:4.` |

## Raw Return / 原始返回

```json
[
  {
    "model": "gemini-3.1-flash-image-preview",
    "success": true,
    "error": null,
    "generatedFiles": [
      "/Users/webkubor/Desktop/skills/nanobanana-plus/banana-plus/[g-3.1-flash]_2026-03-06_14-07-14_[21-9].png"
    ]
  },
  {
    "model": "gemini-3-pro-image-preview",
    "success": true,
    "error": null,
    "generatedFiles": [
      "/Users/webkubor/Desktop/skills/nanobanana-plus/banana-plus/[g-3-pro]_2026-03-06_14-07-38_[21-9].png"
    ]
  },
  {
    "model": "gemini-2.5-flash-image",
    "success": true,
    "error": null,
    "generatedFiles": [
      "/Users/webkubor/Desktop/skills/nanobanana-plus/banana-plus/[g-2.5-flash-image]_2026-03-06_14-07-45_[21-9].png"
    ]
  },
  {
    "model": "imagen-4.0-ultra-generate-001",
    "success": false,
    "error": "An unexpected error occurred: aspectRatio 21:9 is not supported. Supported values are 1:1, 9:16, 16:9, 4:3, 3:4.",
    "generatedFiles": []
  },
  {
    "model": "imagen-4.0-fast-generate-001",
    "success": false,
    "error": "An unexpected error occurred: aspectRatio 21:9 is not supported. Supported values are 1:1, 9:16, 16:9, 4:3, 3:4.",
    "generatedFiles": []
  }
]
```
