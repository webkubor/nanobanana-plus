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
import { ImageGenerator } from './imageGenerator.js';
import { ImageGenerationRequest } from './types.js';

export interface ApiServerOptions {
  port: number;
  outputDir: string;
  cors?: boolean;
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

// ─── Image response helper ────────────────────────────────────────

function buildImageResponse(
  result: { success: boolean; message: string; generatedFiles?: string[]; error?: string },
  format: string,
  outputDir: string,
  port: number,
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
          url: `http://localhost:${port}/api/files/${encodeURIComponent(path.basename(filePath))}`,
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
  const { outputDir, port } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const app = new Hono();

  // CORS
  if (options.cors !== false) {
    app.use('*', cors());
  }

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
      return c.json({ ok: false, error: 'prompt is required' }, 400);
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
    return c.json(buildImageResponse(result, body.format || 'both', outputDir, port));
  });

  // ─── POST /api/edit ───────────────────────────────
  app.post('/api/edit', async (c) => {
    const body = await c.req.json<EditBody>();
    if (!body.prompt || !body.file) {
      return c.json({ ok: false, error: 'prompt and file are required' }, 400);
    }

    const request: ImageGenerationRequest = {
      prompt: body.prompt,
      inputImage: body.file,
      mode: 'edit',
      noPreview: true,
    };

    const result = await imageGenerator.editImage(request);
    return c.json(buildImageResponse(result, body.format || 'both', outputDir, port));
  });

  // ─── POST /api/restore ────────────────────────────
  app.post('/api/restore', async (c) => {
    const body = await c.req.json<EditBody>();
    if (!body.file) {
      return c.json({ ok: false, error: 'file is required' }, 400);
    }

    const request: ImageGenerationRequest = {
      prompt: body.prompt || 'restore and enhance this image, improve clarity and quality',
      inputImage: body.file,
      mode: 'restore',
      noPreview: true,
    };

    const result = await imageGenerator.editImage(request);
    return c.json(buildImageResponse(result, 'both', outputDir, port));
  });

  // ─── GET /api/files ───────────────────────────────
  app.get('/api/files', (c) => {
    if (!fs.existsSync(outputDir)) {
      return c.json({ ok: true, count: 0, files: [] });
    }

    const files = fs.readdirSync(outputDir)
      .filter((f) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
      .map((f) => {
        const fp = path.join(outputDir, f);
        const stat = fs.statSync(fp);
        return {
          filename: f,
          url: `http://localhost:${port}/api/files/${encodeURIComponent(f)}`,
          size: stat.size,
          created: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return c.json({ ok: true, count: files.length, files });
  });

  // ─── GET /api/files/:filename ─────────────────────
  app.get('/api/files/:filename', (c) => {
    const filename = decodeURIComponent(c.req.param('filename'));
    const filePath = path.join(outputDir, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(outputDir)) {
      return c.json({ ok: false, error: 'Forbidden' }, 403);
    }

    if (!fs.existsSync(filePath)) {
      return c.json({ ok: false, error: 'File not found' }, 404);
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
  console.error(`📖 Swagger UI: http://localhost:${options.port}/api/docs`);
}
