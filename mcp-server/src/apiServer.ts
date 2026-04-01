/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ImageGenerator } from './imageGenerator.js';
import { ImageGenerationRequest } from './types.js';

export interface ApiServerOptions {
  port: number;
  outputDir: string;
  cors?: boolean;
  privateToken?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

// ─── Request/Response types ───────────────────────────────────────

interface GenerateBody {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  outputCount?: number;
  customFileName?: string;
  format?: 'base64' | 'file' | 'both';
  styles?: string[];
  variations?: string[];
  fileFormat?: 'png' | 'jpeg';
  seed?: number;
}

interface EditBody {
  prompt: string;
  file: string;
  format?: 'base64' | 'file' | 'both';
}

interface ApiBindings {
  Variables: {
    requestId: string;
    authToken?: string;
  };
}

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// ─── Image response helper ────────────────────────────────────────

function buildImageResponse(
  result: { success: boolean; message: string; generatedFiles?: string[]; error?: string },
  format: string,
  outputDir: string,
  port: number,
  token?: string,
) {
  if (!result.success) {
    return { ok: false, error: result.error || result.message };
  }

  const response: any = {
    ok: true,
    message: result.message,
    files: result.generatedFiles || [],
  };

  if (format === 'base64' || format === 'both') {
    response.images = (result.generatedFiles || [])
      .filter((f) => fs.existsSync(f))
      .map((filePath) => {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        return {
          filename: path.basename(filePath),
          path: filePath,
          url: buildFileUrl(port, path.basename(filePath), token),
          base64: buffer.toString('base64'),
          mimeType: ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png',
          size: buffer.length,
        };
      });
  }

  if (format === 'file' || format === 'both') {
    response.outputDir = outputDir;
  }

  return response;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function buildFileUrl(port: number, filename: string, token?: string) {
  const encodedName = encodeURIComponent(filename);
  const base = `http://localhost:${port}/api/files/${encodedName}`;

  if (!token) {
    return base;
  }

  return `${base}?token=${encodeURIComponent(token)}`;
}

function buildAppHtml(port: number) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>nanobanana-plus Private Studio</title>
  <style>
    :root {
      --bg: #f4efe5;
      --panel: rgba(255, 250, 243, 0.88);
      --panel-strong: #fff8ef;
      --line: rgba(80, 47, 22, 0.12);
      --text: #2b2118;
      --muted: #7a6654;
      --accent: #b85c38;
      --accent-strong: #8d3d1f;
      --accent-soft: rgba(184, 92, 56, 0.12);
      --success: #2f6f4f;
      --shadow: 0 20px 60px rgba(73, 45, 26, 0.12);
      --radius-lg: 24px;
      --radius-md: 16px;
      --radius-sm: 12px;
      font-family: "SF Pro Display", "PingFang SC", "Noto Sans SC", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(255, 214, 170, 0.72), transparent 34%),
        radial-gradient(circle at top right, rgba(255, 189, 142, 0.5), transparent 28%),
        linear-gradient(180deg, #f7f1e7 0%, #efe3d1 100%);
      min-height: 100vh;
    }

    .shell {
      max-width: 1240px;
      margin: 0 auto;
      padding: 40px 20px 56px;
    }

    .hero {
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: 32px;
      background: linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,247,234,0.72));
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }

    .hero h1 {
      margin: 0 0 12px;
      font-size: clamp(32px, 6vw, 58px);
      line-height: 0.95;
      letter-spacing: -0.04em;
    }

    .hero p {
      max-width: 760px;
      margin: 0;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.7;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      gap: 20px;
      margin-top: 20px;
    }

    .panel {
      padding: 22px;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }

    .section-title {
      margin: 0 0 14px;
      font-size: 13px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .field {
      margin-bottom: 14px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      color: var(--muted);
    }

    textarea,
    input,
    select {
      width: 100%;
      border: 1px solid rgba(92, 56, 28, 0.16);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      font: inherit;
      color: var(--text);
      background: rgba(255,255,255,0.92);
      outline: none;
      transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
    }

    textarea:focus,
    input:focus,
    select:focus {
      border-color: rgba(184, 92, 56, 0.7);
      box-shadow: 0 0 0 4px var(--accent-soft);
      transform: translateY(-1px);
    }

    textarea {
      min-height: 156px;
      resize: vertical;
      line-height: 1.6;
    }

    .row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 18px;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
    }

    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.56; cursor: wait; transform: none; }

    .primary {
      color: white;
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      box-shadow: 0 12px 24px rgba(141, 61, 31, 0.22);
    }

    .secondary {
      color: var(--text);
      background: rgba(255,255,255,0.88);
      border: 1px solid var(--line);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }

    .chip {
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      background: rgba(255,255,255,0.85);
      border: 1px solid var(--line);
      color: var(--muted);
    }

    .status {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.82);
      border: 1px solid var(--line);
      color: var(--muted);
      min-height: 56px;
      white-space: pre-wrap;
      line-height: 1.5;
    }

    .status.ok { color: var(--success); }
    .status.error { color: #8c2f39; }

    .gallery-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .gallery-top p {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .card {
      overflow: hidden;
      border-radius: 20px;
      background: var(--panel-strong);
      border: 1px solid var(--line);
      box-shadow: 0 12px 30px rgba(66, 41, 23, 0.08);
    }

    .thumb {
      aspect-ratio: 1 / 1;
      background: linear-gradient(135deg, rgba(184, 92, 56, 0.12), rgba(255,255,255,0.82));
    }

    .thumb img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-body {
      padding: 14px;
    }

    .card-body strong {
      display: block;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-all;
    }

    .card-body span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 12px;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .card-actions a {
      text-decoration: none;
      border-radius: 999px;
      padding: 10px 12px;
      font-size: 12px;
      color: var(--text);
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.9);
    }

    .empty {
      padding: 24px;
      text-align: center;
      color: var(--muted);
      border: 1px dashed rgba(92, 56, 28, 0.16);
      border-radius: 18px;
      background: rgba(255,255,255,0.5);
    }

    @media (max-width: 960px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <h1>nanobanana-plus<br>Private Studio</h1>
      <p>单用户私有版入口。先填你的私有 token，再写 prompt、选模型和比例，就可以直接出图、查看历史和下载结果。</p>
      <div class="meta">
        <div class="chip">API: http://localhost:${port}</div>
        <div class="chip">Mode: single-user private</div>
        <div class="chip">History: /api/files</div>
      </div>
    </section>

    <section class="grid">
      <section class="panel">
        <h2 class="section-title">Create</h2>
        <div class="field">
          <label for="token">Private Token</label>
          <input id="token" type="password" placeholder="输入 NANOBANANA_PRIVATE_TOKEN">
        </div>
        <div class="field">
          <label for="prompt">Prompt</label>
          <textarea id="prompt" placeholder="例如：一只橘猫坐在下雨天的木窗边，电影感，16:9"></textarea>
        </div>
        <div class="row">
          <div class="field">
            <label for="model">Model</label>
            <select id="model">
              <option value="gemini-3.1-flash-image-preview">Nano Banana 2</option>
              <option value="gemini-3-pro-image-preview">Nano Banana Pro</option>
              <option value="gemini-2.5-flash-image">Nano Banana v1</option>
              <option value="imagen-4.0-fast-generate-001">Imagen 4 Fast</option>
              <option value="imagen-4.0-ultra-generate-001">Imagen 4 Ultra</option>
            </select>
          </div>
          <div class="field">
            <label for="aspectRatio">Aspect Ratio</label>
            <select id="aspectRatio">
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="21:9">21:9</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
              <option value="3:2">3:2</option>
              <option value="2:3">2:3</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label for="outputCount">Count</label>
            <select id="outputCount">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div class="field">
            <label for="fileFormat">File Format</label>
            <select id="fileFormat">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>
        </div>
        <div class="actions">
          <button id="generateButton" class="primary">Generate</button>
          <button id="refreshButton" class="secondary">Refresh History</button>
        </div>
        <div id="status" class="status">等待操作。</div>
      </section>

      <section class="panel">
        <div class="gallery-top">
          <div>
            <h2 class="section-title">History</h2>
            <p>最近生成的图片会显示在这里。</p>
          </div>
        </div>
        <div id="gallery" class="gallery">
          <div class="empty">还没有历史图片，先生成一张试试。</div>
        </div>
      </section>
    </section>
  </main>

  <script>
    const tokenInput = document.getElementById('token');
    const promptInput = document.getElementById('prompt');
    const modelInput = document.getElementById('model');
    const aspectRatioInput = document.getElementById('aspectRatio');
    const outputCountInput = document.getElementById('outputCount');
    const fileFormatInput = document.getElementById('fileFormat');
    const generateButton = document.getElementById('generateButton');
    const refreshButton = document.getElementById('refreshButton');
    const statusBox = document.getElementById('status');
    const gallery = document.getElementById('gallery');
    const tokenStorageKey = 'nanobanana-private-token';

    tokenInput.value = localStorage.getItem(tokenStorageKey) || '';

    tokenInput.addEventListener('change', () => {
      localStorage.setItem(tokenStorageKey, tokenInput.value.trim());
    });

    function setStatus(message, type = '') {
      statusBox.textContent = message;
      statusBox.className = 'status' + (type ? ' ' + type : '');
    }

    function requireToken() {
      const token = tokenInput.value.trim();
      if (!token) {
        setStatus('先输入 Private Token，再继续。', 'error');
        tokenInput.focus();
        return null;
      }
      localStorage.setItem(tokenStorageKey, token);
      return token;
    }

    function authHeaders(token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      };
    }

    async function fetchJson(url, options = {}) {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }
      return data;
    }

    function renderGallery(files, token) {
      if (!Array.isArray(files) || files.length === 0) {
        gallery.innerHTML = '<div class="empty">还没有历史图片，先生成一张试试。</div>';
        return;
      }

      gallery.innerHTML = files.map((file) => {
        const imageUrl = '/api/files/' + encodeURIComponent(file.filename) + '?token=' + encodeURIComponent(token);
        const created = file.created ? new Date(file.created).toLocaleString('zh-CN') : 'unknown';
        return '<article class="card">' +
          '<div class="thumb"><img src="' + imageUrl + '" alt="' + file.filename + '" loading="lazy"></div>' +
          '<div class="card-body">' +
            '<strong>' + file.filename + '</strong>' +
            '<span>' + created + ' · ' + Math.round((file.size || 0) / 1024) + ' KB</span>' +
            '<div class="card-actions">' +
              '<a href="' + imageUrl + '" target="_blank" rel="noreferrer">Preview</a>' +
              '<a href="' + imageUrl + '" download="' + file.filename + '">Download</a>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    async function loadHistory() {
      const token = requireToken();
      if (!token) return;

      refreshButton.disabled = true;
      try {
        setStatus('正在刷新历史记录...');
        const data = await fetchJson('/api/files', {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        renderGallery(data.files || [], token);
        setStatus('历史记录已刷新。', 'ok');
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        refreshButton.disabled = false;
      }
    }

    async function generate() {
      const token = requireToken();
      if (!token) return;

      const prompt = promptInput.value.trim();
      if (!prompt) {
        setStatus('先写 prompt，再开始生成。', 'error');
        promptInput.focus();
        return;
      }

      generateButton.disabled = true;
      setStatus('开始生成，请稍等...');

      try {
        const payload = {
          prompt,
          model: modelInput.value,
          aspectRatio: aspectRatioInput.value,
          outputCount: Number(outputCountInput.value),
          fileFormat: fileFormatInput.value,
          format: 'file',
        };

        const data = await fetchJson('/api/generate', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        });

        const message = data.message || '生成完成';
        setStatus(message, 'ok');
        await loadHistory();
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        generateButton.disabled = false;
      }
    }

    generateButton.addEventListener('click', generate);
    refreshButton.addEventListener('click', loadHistory);

    if (tokenInput.value.trim()) {
      loadHistory();
    }
  </script>
</body>
</html>`;
}

// ─── OpenAPI spec ─────────────────────────────────────────────────

function buildOpenAPISpec(port: number) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'nanobanana-plus API',
      description: 'AI 图片生成 REST API，基于 Gemini / Imagen 模型',
      version: '1.5.0',
    },
    servers: [{ url: `http://localhost:${port}` }],
    paths: {
      '/health': {
        get: {
          summary: '健康检查',
          responses: { 200: { description: '服务状态' } },
        },
      },
      '/api/models': {
        get: {
          summary: '支持的模型列表',
          responses: { 200: { description: '模型 + 比例列表' } },
        },
      },
      '/api/generate': {
        post: {
          summary: '文字生图',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['prompt'],
                  properties: {
                    prompt: { type: 'string', description: '图片描述' },
                    model: { type: 'string', enum: [
                      'gemini-3.1-flash-image-preview',
                      'gemini-3-pro-image-preview',
                      'gemini-2.5-flash-image',
                      'imagen-4.0-ultra-generate-001',
                      'imagen-4.0-fast-generate-001',
                    ]},
                    aspectRatio: { type: 'string', enum: ['16:9','9:16','1:1','4:3','3:4','21:9','3:2','2:3'] },
                    outputCount: { type: 'integer', minimum: 1, maximum: 4 },
                    customFileName: { type: 'string' },
                    format: { type: 'string', enum: ['base64','file','both'], default: 'both' },
                    fileFormat: { type: 'string', enum: ['png','jpeg'], default: 'png' },
                    seed: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '生成结果（含 base64 或文件路径）' } },
        },
      },
      '/api/edit': {
        post: {
          summary: '编辑图片',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['prompt', 'file'],
                  properties: {
                    prompt: { type: 'string', description: '编辑指令' },
                    file: { type: 'string', description: '原图路径' },
                    format: { type: 'string', enum: ['base64','file','both'], default: 'both' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '编辑结果' } },
        },
      },
      '/api/restore': {
        post: {
          summary: '修复/增强图片',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', description: '原图路径' },
                    prompt: { type: 'string', description: '可选的修复指令' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '修复结果' } },
        },
      },
      '/api/files': {
        get: {
          summary: '列出已生成图片',
          responses: { 200: { description: '文件列表' } },
        },
      },
      '/api/files/{filename}': {
        get: {
          summary: '下载/预览指定图片',
          parameters: [
            { name: 'filename', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: '图片文件' } },
        },
      },
    },
  };
}

// ─── App factory ──────────────────────────────────────────────────

export function createApp(imageGenerator: ImageGenerator, options: ApiServerOptions) {
  const { outputDir, port, privateToken, rateLimitMax = 30, rateLimitWindowMs = 60_000 } = options;
  const rateLimitStore = new Map<string, RateLimitEntry>();

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const app = new Hono<ApiBindings>();

  // CORS
  if (options.cors !== false) {
    app.use('*', cors());
  }

  app.use('*', async (c, next) => {
    const requestId = randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
  });

  app.onError((error, c) => {
    console.error(`[${c.get('requestId')}] Unhandled API error:`, error);
    return c.json({
      ok: false,
      error: 'Internal server error',
      requestId: c.get('requestId'),
    }, 500);
  });

  app.use('/api/*', async (c, next) => {
    const pathName = new URL(c.req.url).pathname;
    if (pathName === '/health') {
      await next();
      return;
    }

    const tokenFromHeader = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    const tokenFromQuery = c.req.query('token')?.trim();
    const providedToken = tokenFromHeader || tokenFromQuery;

    if (privateToken) {
      if (!providedToken || providedToken !== privateToken) {
        return c.json({
          ok: false,
          error: 'Unauthorized',
          requestId: c.get('requestId'),
        }, 401);
      }
      c.set('authToken', providedToken);
    }

    const skipRateLimit =
      c.req.method === 'GET' &&
      (pathName === '/api/files' || pathName.startsWith('/api/files/'));

    if (rateLimitMax > 0 && !skipRateLimit) {
      const rateLimitKey = providedToken || getClientIp(c.req.raw);
      const now = Date.now();
      const currentEntry = rateLimitStore.get(rateLimitKey);

      if (!currentEntry || currentEntry.resetAt <= now) {
        rateLimitStore.set(rateLimitKey, {
          count: 1,
          resetAt: now + rateLimitWindowMs,
        });
      } else if (currentEntry.count >= rateLimitMax) {
        c.header('Retry-After', String(Math.max(1, Math.ceil((currentEntry.resetAt - now) / 1000))));
        return c.json({
          ok: false,
          error: 'Rate limit exceeded',
          requestId: c.get('requestId'),
        }, 429);
      } else {
        currentEntry.count += 1;
        rateLimitStore.set(rateLimitKey, currentEntry);
      }
    }

    await next();
  });

  app.get('/', (c) => c.redirect('/app'));

  app.get('/app', (c) => c.html(buildAppHtml(port)));

  // ─── GET /health ──────────────────────────────────
  app.get('/health', (c) => {
    const status = imageGenerator.getAuthStatus();
    return c.json({
      ok: true,
      service: 'nanobanana-plus API',
      version: '1.5.0',
      auth: {
        ready: status.ready,
        source: status.source,
        hasApiKey: status.hasApiKey,
      },
      privateMode: Boolean(privateToken),
      requestId: c.get('requestId'),
    });
  });

  // ─── GET /api/openapi.json ────────────────────────
  app.get('/api/openapi.json', (c) => {
    return c.json(buildOpenAPISpec(port));
  });

  // ─── GET /api/docs (Swagger UI) ───────────────────
  app.get('/api/docs', (c) => {
    const html = `<!DOCTYPE html>
<html><head>
  <title>nanobanana-plus API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head><body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
    });
  </script>
</body></html>`;
    return c.html(html);
  });

  // ─── GET /api/models ──────────────────────────────
  app.get('/api/models', (c) => {
    return c.json({
      ok: true,
      models: [
        { id: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2', tier: 'fast', description: '日常快速出图' },
        { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro', tier: 'quality', description: '高质量精细输出' },
        { id: 'gemini-2.5-flash-image', label: 'Nano Banana v1', tier: 'legacy', description: '旧版兼容' },
        { id: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4 Ultra', tier: 'premium', description: '顶级写实度，需 Pro Key' },
        { id: 'imagen-4.0-fast-generate-001', label: 'Imagen 4 Fast', tier: 'premium', description: '速度质量兼顾，需 Pro Key' },
      ],
      aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '3:2', '2:3'],
    });
  });

  // ─── POST /api/generate ───────────────────────────
  app.post('/api/generate', async (c) => {
    const body = await c.req.json<GenerateBody>();
    if (!body.prompt) {
      return c.json({ ok: false, error: 'prompt is required', requestId: c.get('requestId') }, 400);
    }

    const request: ImageGenerationRequest = {
      prompt: body.prompt,
      mode: 'generate',
      outputCount: body.outputCount || 1,
      model: body.model as any,
      aspectRatio: body.aspectRatio,
      customFileName: body.customFileName,
      styles: body.styles,
      variations: body.variations,
      fileFormat: body.fileFormat || 'png',
      seed: body.seed,
      noPreview: true,
    };

    const result = await imageGenerator.generateTextToImage(request);
    return c.json({
      ...buildImageResponse(result, body.format || 'both', outputDir, port, c.get('authToken')),
      requestId: c.get('requestId'),
    });
  });

  // ─── POST /api/edit ───────────────────────────────
  app.post('/api/edit', async (c) => {
    const body = await c.req.json<EditBody>();
    if (!body.prompt || !body.file) {
      return c.json({ ok: false, error: 'prompt and file are required', requestId: c.get('requestId') }, 400);
    }

    const request: ImageGenerationRequest = {
      prompt: body.prompt,
      inputImage: body.file,
      mode: 'edit',
      noPreview: true,
    };

    const result = await imageGenerator.editImage(request);
    return c.json({
      ...buildImageResponse(result, body.format || 'both', outputDir, port, c.get('authToken')),
      requestId: c.get('requestId'),
    });
  });

  // ─── POST /api/restore ────────────────────────────
  app.post('/api/restore', async (c) => {
    const body = await c.req.json<EditBody>();
    if (!body.file) {
      return c.json({ ok: false, error: 'file is required', requestId: c.get('requestId') }, 400);
    }

    const request: ImageGenerationRequest = {
      prompt: body.prompt || 'restore and enhance this image, improve clarity and quality',
      inputImage: body.file,
      mode: 'restore',
      noPreview: true,
    };

    const result = await imageGenerator.editImage(request);
    return c.json({
      ...buildImageResponse(result, 'both', outputDir, port, c.get('authToken')),
      requestId: c.get('requestId'),
    });
  });

  // ─── GET /api/files ───────────────────────────────
  app.get('/api/files', (c) => {
    if (!fs.existsSync(outputDir)) {
      return c.json({ ok: true, count: 0, files: [], requestId: c.get('requestId') });
    }

    const files = fs.readdirSync(outputDir)
      .filter((f) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
      .map((f) => {
        const fp = path.join(outputDir, f);
        const stat = fs.statSync(fp);
        return {
          filename: f,
          url: buildFileUrl(port, f, c.get('authToken')),
          size: stat.size,
          created: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return c.json({ ok: true, count: files.length, files, requestId: c.get('requestId') });
  });

  // ─── GET /api/files/:filename ─────────────────────
  app.get('/api/files/:filename', (c) => {
    const filename = decodeURIComponent(c.req.param('filename'));
    const filePath = path.join(outputDir, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(outputDir)) {
      return c.json({ ok: false, error: 'Forbidden', requestId: c.get('requestId') }, 403);
    }

    if (!fs.existsSync(filePath)) {
      return c.json({ ok: false, error: 'File not found', requestId: c.get('requestId') }, 404);
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${filename}"`,
        'X-Request-Id': c.get('requestId'),
      },
    });
  });

  return app;
}

// ─── Server starter ──────────────────────────────────────────────

export async function startApiServer(
  imageGenerator: ImageGenerator,
  options: ApiServerOptions,
) {
  const app = createApp(imageGenerator, options);

  serve({
    fetch: app.fetch,
    port: options.port,
  });

  console.error(`🚀 nanobanana-plus API running on http://localhost:${options.port}`);
  console.error(`📁 Output: ${options.outputDir}`);
  console.error(`🖥️  Private Studio: http://localhost:${options.port}/app`);
  console.error(`📖 Swagger UI: http://localhost:${options.port}/api/docs`);
  if (options.privateToken) {
    console.error('🔐 Private API token protection is enabled');
  }
}
