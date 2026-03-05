# nanobanana-plus — 首个支持 Nano Banana 2/Pro 按次切换的扩展

> Fork 自 [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)，Apache 2.0 授权。
> 新增功能：per-call 模型切换 + 宽高比控制。

## 核心能力

- `generate_image` — 文本生图，支持动态选择模型和宽高比
- `edit_image` — 基于文字编辑已有图片
- `restore_image` — 图片修复增强

## 模型选择（每次调用独立指定）

| 参数值 | 实际模型 | 特点 |
|--------|---------|------|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | **默认**，快速，省配额 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 高质量，细节更丰富 |
| `gemini-2.5-flash-image` | Nano Banana v1 | 旧版兼容 |

不指定 model 时，使用环境变量 `NANOBANANA_MODEL` 或默认 flash 模型。

## 宽高比

`aspectRatio` 参数支持：`"16:9"` `"9:16"` `"1:1"` `"4:3"` `"3:4"`

## 调用示例

```
生成一张 16:9 的科幻城市夜景，用 Pro 模型
→ generate_image(prompt="...", model="gemini-3-pro-image-preview", aspectRatio="16:9")

快速出 4 张草图
→ generate_image(prompt="...", outputCount=4)  // 默认 flash，省配额
```
