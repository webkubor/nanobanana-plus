/**
 * nanobanana-plus HTTP API Server
 *
 * Lightweight REST wrapper over the existing ImageGenerator core.
 * Zero image generation logic — all delegated to mcp-server.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const { resolve, join } = path;
const { readFileSync, existsSync } = fs;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.NANOBANANA_API_PORT || '3210', 10);
const API_KEY = process.env.NANOBANANA_API_KEY; // optional bearer token

// ---------------------------------------------------------------------------
// Init ImageGenerator (reuse existing auth + generation logic, zero duplication)
// ---------------------------------------------------------------------------

const { ImageGenerator } = await import(
  resolve(PROJECT_ROOT, 'mcp-server/dist/imageGenerator.js')
);
const AuthConfig = ImageGenerator.validateAuthentication();
const generator = new ImageGenerator(AuthConfig);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono();
app.use('*', cors());

// Health check + API docs
app.get('/', (c) => c.json({
  name: 'nanobanana-plus API',
  version: '1.0.0',
  auth: generator.getAuthStatus(),
  endpoints: {
    generate: 'POST /api/generate  { prompt, model?, aspectRatio?, count?, format? }',
    edit:     'POST /api/edit      { prompt, inputImage, model?, aspectRatio? }',
    status:   'GET  /api/status',
    image:    'GET  /api/image/:filename',
  },
}));

app.get('/api/status', (c) => c.json(generator.getAuthStatus()));

// ---------------------------------------------------------------------------
// POST /api/generate — text-to-image
// ---------------------------------------------------------------------------

app.post('/api/generate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.prompt) return c.json({ error: 'Missing required field: prompt' }, 400);

  const result = await generator.generateTextToImage({
    prompt: body.prompt,
    model: body.model,
    aspectRatio: body.aspectRatio,
    outputCount: body.count || body.outputCount || 1,
    fileFormat: body.format || 'png',
    customFileName: body.filename,
    styles: body.styles,
    variations: body.variations,
    noPreview: true,
  });

  if (!result.success) {
    return c.json({ success: false, error: result.error, message: result.message }, 500);
  }

  const baseUrl = `http://${process.env.HOST || 'localhost'}:${PORT}`;
  const images = (result.generatedFiles || []).map((f) => ({
    file: f,
    url: `${baseUrl}/api/image/${encodeURIComponent(f.split('/').pop())}`,
  }));

  return c.json({ success: true, message: result.message, images });
});

// ---------------------------------------------------------------------------
// POST /api/edit — edit existing image
// ---------------------------------------------------------------------------

app.post('/api/edit', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.prompt || !body.inputImage) {
    return c.json({ error: 'Missing required fields: prompt, inputImage' }, 400);
  }

  const result = await generator.editImage({
    prompt: body.prompt,
    inputImage: body.inputImage,
    model: body.model,
    aspectRatio: body.aspectRatio,
    fileFormat: body.format || 'png',
    customFileName: body.filename,
    noPreview: true,
  });

  if (!result.success) {
    return c.json({ success: false, error: result.error, message: result.message }, 500);
  }

  const baseUrl = `http://${process.env.HOST || 'localhost'}:${PORT}`;
  const images = (result.generatedFiles || []).map((f) => ({
    file: f,
    url: `${baseUrl}/api/image/${encodeURIComponent(f.split('/').pop())}`,
  }));

  return c.json({ success: true, message: result.message, images });
});

// ---------------------------------------------------------------------------
// GET /api/image/:filename — serve generated images
// ---------------------------------------------------------------------------

app.get('/api/image/:filename', async (c) => {
  const filename = c.req.param('filename');
  const searchDirs = [
    join(PROJECT_ROOT, 'banana-plus'),
  ];

  for (const dir of searchDirs) {
    const filePath = join(dir, filename);
    if (existsSync(filePath)) {
      const data = readFileSync(filePath);
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      return c.newResponse(data, 200, { 'Content-Type': mime });
    }
  }

  return c.json({ error: 'Image not found' }, 404);
});

// ---------------------------------------------------------------------------
// Mount auth then start
// ---------------------------------------------------------------------------

// Wrap entire app with auth
const protectedApp = new Hono();
if (API_KEY) {
  protectedApp.use('*', async (c, next) => {
    const provided = c.req.header('Authorization')?.replace('Bearer ', '');
    if (provided !== API_KEY) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
}
protectedApp.route('/', app);

serve({ fetch: protectedApp.fetch, port: PORT }, (info) => {
  console.error(`\n🍌 nanobanana-plus API running at http://localhost:${info.port}`);
  console.error(`   Auth: ${API_KEY ? 'enabled' : 'disabled — set NANOBANANA_API_KEY'}`);
  console.error(`   Docs: http://localhost:${info.port}/\n`);
});
