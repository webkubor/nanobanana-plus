# 🍌 nanobanana-plus（中文文档）

这是一个 Gemini CLI 扩展，支持 Nano Banana 系列模型的“按次切换”。

## 核心能力
- 每次调用独立切换模型，无需重启服务
- 支持宽高比控制（`16:9`、`9:16`、`1:1` 等）
- 支持生图、编辑、修复、图标、图案、故事分镜、流程图
- 生成前强制鉴权预检查
- 支持“运行时输入 Key + 先验证后继续”

## 快速开始

### 方式一：一键配置
```bash
git clone https://github.com/webkubor/nanobanana-plus
bash nanobanana-plus/setup.sh
```

### 方式二：手动配置
```bash
# 安装扩展
gemini extensions install https://github.com/webkubor/nanobanana-plus

# 推荐：扩展专用变量
export NANOBANANA_GEMINI_API_KEY=<your_key>

# 可选：兼容通用变量（需显式开启）
export NANOBANANA_ALLOW_FALLBACK_KEYS=true
export GEMINI_API_KEY=<your_key>
export GOOGLE_API_KEY=<your_key>
```

## 鉴权交互优化（已支持）
任意出图请求前，扩展会执行以下流程：
1. 先检查鉴权状态（`check_auth_status`）
2. 若缺少 key，提示用户输入
3. 调用 `configure_api_key` 验证 key 可用性
4. 验证通过后才继续生成

这样可以避免 MCP 独立进程导致的“配置文件有 key 但工具读不到”的问题。

## 模型切换
`model` 支持：
- `gemini-3.1-flash-image-preview`（默认）
- `gemini-3-pro-image-preview`
- `gemini-2.5-flash-image`

## 宽高比
`aspectRatio` 示例：
- `16:9`
- `9:16`
- `1:1`
- `4:3`
- `3:4`

## 工具列表
- `generate_image`
- `edit_image`
- `restore_image`
- `generate_icon`
- `generate_pattern`
- `generate_story`
- `generate_diagram`
- `check_auth_status`
- `configure_api_key`

## 开发
```bash
cd mcp-server
npm install
npm run typecheck
npm run build
```

## 许可证
Apache License 2.0。
