#!/usr/bin/env bash
set -euo pipefail

echo "image-agent-plus setup"
echo ""

if command -v image-agent-plus >/dev/null 2>&1; then
  image-agent-plus check
  exit 0
fi

if command -v codex >/dev/null 2>&1 || command -v gemini >/dev/null 2>&1; then
  echo "Local runtime found. Install the package, then run:"
  echo "  npm install -g image-agent-plus"
  echo "  image-agent-plus check"
  exit 0
fi

echo "No Codex CLI or Gemini CLI runtime found in PATH."
echo "Install Codex CLI first, or install Gemini CLI as fallback."
echo "Only use IMAGE_AGENT_* API keys if you explicitly need direct provider API mode."
