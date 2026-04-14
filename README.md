<div align="center">

# 🍌 nanobanana-plus

**一行 prompt，任意比例，多个模型，一张好图。**

[English](./README.en.md) · [Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/webkubor/nanobanana-plus/issues)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](package.json)
[![Stars](https://img.shields.io/github/stars/webkubor/nanobanana-plus?style=flat&color=yellow)](https://github.com/webkubor/nanobanana-plus/stargazers)

</div>

---

> 基于 [nanobanana](https://github.com/gemini-cli-extensions/nanobanana)（Google 官方）Fork，
> 实现了社区呼声最高的 [#44](https://github.com/gemini-cli-extensions/nanobanana/issues/44)：
> **无需重启，每次调用动态切换模型 + 任意宽高比。**

---

## 它能做什么

一句话概括：**你描述画面，它生成图片，保存到你电脑上。**

```
你：生成一张赛博朋克风格的夜市街道，16:9 比例，用 Pro 模型
它：✅ Saved to /Users/you/cyberpunk-night-market.png
```

<details>
<summary>📸 真实输出（点击展开）</summary>

![CLI 操作截图](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cli-output.png)

**同样的 prompt**，原版 nanobanana 只输出 1:1 正方形裁切 👇
nanobanana-plus 保留模型原生横版构图：

![橙色猫咪坐在雨天窗台上](https://raw.githubusercontent.com/webkubor/nanobanana-plus/main/docs/demo-cat-rainy-window.png)

</details>

---

## 快速开始

### 安装

```bash
# 全局安装
pnpm add -g nanobanana-extension
# 或
npm install -g nanobanana-extension
```

### 配置 API Key

```bash
export NANOBANANA_GEMINI_API_KEY="你的Key"
echo 'export NANOBANANA_GEMINI_API_KEY="你的Key"' >> ~/.zshrc
```

> 💡 已经用 `gemini auth login` 登录过？跳过这步，扩展会自动复用你的登录态。

### 生成图片

```bash
nanobanana-plus generate \
  --prompt "一只橘猫坐在雨天窗台上" \
  --filename ./output/cat.png \
  --aspect-ratio 16:9
```

---

## 命令参数

| 参数 | 必填 | 说明 |
|------|:----:|------|
| `--prompt` | ✅ | 描述你想要什么画面 |
| `--model` | — | 模型（默认 Nano Banana 2） |
| `--aspect-ratio` | — | 比例：`16:9` / `9:16` / `1:1` / `4:3` / `3:4` |
| `--output-count` | — | 一次出几张（1–8，默认 1） |
| `--filename` | — | 输出文件路径 |
| `--file-format` | — | `png`（默认）或 `jpeg` |
| `--seed` | — | 固定随机种子 |
| `--preview` / `--no-preview` | — | 控制是否预览 |

---

## 模型选择

不需要重启服务，每次生图直接指定。

| model 参数 | 模型 | 适合场景 |
|-----------|------|---------|
| *(不填)* `gemini-3.1-flash-image-preview` | Nano Banana 2 | ⚡ 日常使用，快速省配额 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 🎨 高质量输出，细节精细 |
| `gemini-2.5-flash-image` | Nano Banana v1 | 🔄 旧版兼容 |
| `imagen-4.0-ultra-generate-001` | Imagen 4 Ultra 💎 | 顶级写实度（需 Pro Key） |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast 🚀 | 兼顾速度质量（需 Pro Key） |

> [!TIP]
> - 全局默认模型：`export NANOBANANA_MODEL=gemini-3-pro-image-preview`
> - `21:9` 宽银幕仅 Gemini 模型支持，Imagen 4 不支持。详见 [`docs/compatibility-21-9-matrix.md`](./docs/compatibility-21-9-matrix.md)
> - Imagen 4 需要配置拥有 Pro 权限的 API Key，不支持 OAuth 登录态

---

## 宽高比速查

| 比例 | 典型用途 |
|------|---------|
| `16:9` | 🖥️ 桌面壁纸 / YouTube 封面 / 博客头图 |
| `9:16` | 📱 手机壁纸 / 小红书 / 抖音封面 |
| `1:1` | ⬜ 头像 / Instagram / 公众号配图 |
| `4:3` | 🖼️ 传统横版 / PPT 配图 |
| `3:4` | 📄 传统竖版 / 海报 |

---

## 效果图库

### 💎 Imagen 4 Ultra — 顶级写实

```bash
nanobanana-plus generate --prompt "majestic snowy mountain peak under a starry night sky, photorealistic, 8K" \
  --model imagen-4.0-ultra-generate-001 --aspect-ratio 16:9
```
![Ultra 16:9](https://files.catbox.moe/a7sfh2.png)

### ⚡ Nano Banana 2 — 极速日常（默认）

```bash
nanobanana-plus generate --prompt "cyberpunk city at night, neon lights, rain reflections, cinematic" \
  --model gemini-3.1-flash-image-preview --aspect-ratio 16:9
```
![Nano Banana 16:9](https://files.catbox.moe/kl23ih.png)

---

## 前置条件

- **Node.js** 18+
- **API Key**（三选一）：

```bash
export NANOBANANA_GEMINI_API_KEY="your_key"   # 推荐
export GEMINI_API_KEY="your_key"               # 备选
export GOOGLE_API_KEY="your_key"               # 备选
```

> 已登录 Gemini CLI 的用户可跳过，扩展会自动复用 OAuth 登录态。

---

## 🤝 参与贡献

欢迎 PR！特别需要：

- 🎨 **风格预设** — 水墨、浮世绘、赛博朋克等内置 prompt 前缀
- 🔁 **模型对比** — 同一 prompt 用 flash + pro 并排出图
- 📊 **配额追踪** — 临近 API 限额时自动告警

```bash
git clone https://github.com/webkubor/nanobanana-plus
cd nanobanana-plus && pnpm install && pnpm run dev
```

---

## 📄 License

Apache License 2.0 — Fork of [nanobanana](https://github.com/gemini-cli-extensions/nanobanana) by Google LLC.

---

<div align="center">

**觉得有用就 ⭐ 一下吧！**

</div>
