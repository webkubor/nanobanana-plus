---
name: image
project: nanobanana-plus
for: ai-agent
---

# nanobanana-plus — Agent 调用 SOP

## 前置

```bash
# 确认已全局安装
nanobanana-plus --help

# API Key（已 gemini auth login 则不需要）
export NANOBANANA_GEMINI_API_KEY="your_key"
```

## 核心命令

```bash
# 基本生图
nanobanana-plus generate --prompt "<描述>" --filename ./output.png

# 指定比例
nanobanana-plus generate --prompt "<描述>" --aspect-ratio 16:9

# 指定模型
nanobanana-plus generate --prompt "<描述>" --model gemini-3-pro-image-preview

# 一次出多张
nanobanana-plus generate --prompt "<描述>" --output-count 4

# 固定种子（复现）
nanobanana-plus generate --prompt "<描述>" --seed 42
```

## 模型速查

| 场景 | model 参数 |
|------|-----------|
| 日常快速 | *(不填，默认 Nano Banana 2)* |
| 高质量细节 | `gemini-3-pro-image-preview` |
| 顶级写实 | `imagen-4.0-ultra-generate-001` |
| 快速写实 | `imagen-4.0-fast-generate-001` |

## 比例速查

| 用途 | --aspect-ratio |
|------|----------------|
| 桌面壁纸 / YouTube | `16:9` |
| 手机 / Stories | `9:16` |
| 头像 / 正方 | `1:1` |
| 海报 | `3:4` |

## 红线

- Imagen 4 需要配置拥有 Pro 权限的 API Key，不支持 OAuth 登录态
- `21:9` 仅 Gemini 模型支持，Imagen 4 不支持
- `--output-count` 范围 1-8
