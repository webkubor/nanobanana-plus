#!/bin/bash
# nanobanana-plus 一键配置脚本
# 用法：bash setup.sh

set -e

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}🍌+ nanobanana-plus 配置向导${RESET}"
echo "────────────────────────────────────"
echo ""

# Step 1: 检查是否已有 key
EXISTING=""
if [ -n "$NANOBANANA_GEMINI_API_KEY" ]; then
  EXISTING="$NANOBANANA_GEMINI_API_KEY"
elif [ -n "$GEMINI_API_KEY" ]; then
  EXISTING="$GEMINI_API_KEY"
fi

if [ -n "$EXISTING" ]; then
  echo -e "${GREEN}✓ 已检测到 GEMINI_API_KEY，无需重新配置${RESET}"
  echo -e "  当前 Key: ${EXISTING:0:8}****"
  echo ""
  echo -e "${CYAN}直接运行 Gemini CLI 即可使用：${RESET}"
  echo -e "  gemini"
  exit 0
fi

# Step 2: 引导申请 key
echo -e "${BOLD}Step 1 — 获取 Gemini API Key${RESET}"
echo ""
echo "  如果你已有 Google AI Studio 的 API Key，跳过此步。"
echo "  否则，请在浏览器中打开以下链接免费申请（需要 Google 账号）："
echo ""
echo -e "  ${CYAN}https://aistudio.google.com/apikey${RESET}"
echo ""
echo -e "${YELLOW}  提示：登录后点击「Create API Key」，复制生成的 Key。${RESET}"
echo ""

# Step 3: 回填 key
read -rp "  请粘贴你的 API Key（输入后回车）: " USER_KEY
echo ""

if [ -z "$USER_KEY" ]; then
  echo "❌ 未输入 Key，已退出。"
  exit 1
fi

# Step 4: 写入 shell 配置文件
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
  SHELL_RC="$HOME/.bash_profile"
fi

if [ -n "$SHELL_RC" ]; then
  # 避免重复写入
  if ! grep -q "NANOBANANA_GEMINI_API_KEY" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# nanobanana-plus API Key" >> "$SHELL_RC"
    echo "export NANOBANANA_GEMINI_API_KEY=\"$USER_KEY\"" >> "$SHELL_RC"
    echo "export GEMINI_API_KEY=\"$USER_KEY\"" >> "$SHELL_RC"
    echo -e "${GREEN}✓ 已写入 $SHELL_RC${RESET}"
  else
    echo -e "${YELLOW}⚠ $SHELL_RC 中已有配置，未重复写入${RESET}"
  fi
else
  echo -e "${YELLOW}⚠ 未找到 shell 配置文件，请手动添加：${RESET}"
  echo "  export NANOBANANA_GEMINI_API_KEY=\"$USER_KEY\""
fi

# Step 5: 当前 session 立即生效
export NANOBANANA_GEMINI_API_KEY="$USER_KEY"
export GEMINI_API_KEY="$USER_KEY"

echo ""
echo -e "${BOLD}Step 2 — 安装扩展${RESET}"
echo ""

# 检查 gemini CLI 是否存在
GEMINI_CMD=$(which gemini 2>/dev/null || echo "")
if [ -z "$GEMINI_CMD" ]; then
  # 尝试 nvm 路径
  GEMINI_CMD=$(ls ~/.nvm/versions/node/*/bin/gemini 2>/dev/null | tail -1)
fi

if [ -n "$GEMINI_CMD" ]; then
  echo "  检测到 Gemini CLI: $GEMINI_CMD"
  echo ""
  echo -e "  ${CYAN}运行以下命令完成安装：${RESET}"
  echo ""
  echo "  gemini extensions install https://github.com/webkubor/nanobanana-plus"
  echo ""
else
  echo -e "${YELLOW}  未检测到 Gemini CLI，请先安装：${RESET}"
  echo "  npm install -g @google/gemini-cli"
  echo ""
  echo -e "  安装后运行："
  echo "  gemini extensions install https://github.com/webkubor/nanobanana-plus"
  echo ""
fi

echo -e "${GREEN}✅ 配置完成！${RESET}"
echo ""
echo "  请重启终端或运行："
echo -e "  ${CYAN}source $SHELL_RC${RESET}"
echo ""
echo "  然后打开 Gemini CLI 试试："
echo -e "  ${CYAN}gemini${RESET}"
echo ""
echo "  示例指令：用 nanobanana-plus 生成一只橙色猫咪坐在窗台上"
echo ""
