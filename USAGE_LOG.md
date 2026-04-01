# nanobanana-plus 使用记录

> **创建时间**: 2026-03-26 19:39  
> **工具**: nanobanana-plus  
> **服务地址**: http://localhost:3470

---

## 📊 生成记录

| 序号 | 时间 | 提示词 | 比例 | 模型 | 图片文件 | 发送状态 |
|------|------|--------|------|------|----------|----------|
| 1 | 2026-03-26 19:37 | 一位优雅的东方美女，长发飘逸，精致的五官，温柔的眼神，柔和的灯光，电影质感，8K 画质，专业摄影 | 9:16 | gemini-3-pro-image-preview | [g-3-pro]_2026-03-26_19-37-59_[9-16].png | ✅ 已发送到 AIGC 群 |
| 2 | 2026-03-26 19:39 | 一位时尚都市美女，精致的妆容，自信的笑容，现代建筑背景，自然光，高清晰度，专业人像摄影 | 9:16 | gemini-3-pro-image-preview | [g-3-pro]_2026-03-26_19-39-02_[9-16].png | ✅ 已发送到 AIGC 群 |

---

## 📝 命令示例

**生成图片命令**：
```bash
curl -X POST http://localhost:3470/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "提示词",
    "aspectRatio": "9:16",
    "model": "gemini-3-pro-image-preview"
  }'
```

**发送图片到 AIGC 群**：
```bash
~/bin/send-to-aigc.sh /path/to/image.png
```

---

## 🎨 可用模型

| 模型参数 | 对应模型 | 说明 |
|---------|---------|------|
| *(不填)* | gemini-3.1-flash-image-preview | Nano Banana 2，快速省配额 |
| gemini-3-pro-image-preview | Nano Banana Pro | 高质量输出，细节精细 |

---

## 📐 可用比例

| 比例 | 说明 |
|------|------|
| 16:9 | 横屏宽屏 |
| 1:1 | 正方形 |
| 9:16 | 竖屏 |

---

## 📁 图片存储位置

`~/Desktop/AI-tools/nanobanana-plus/banana-plus/`

---

**最后更新**: 2026-03-26 19:39  
**维护者**: 小楠
