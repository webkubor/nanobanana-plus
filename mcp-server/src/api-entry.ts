#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * nanobanana-plus HTTP API server
 * Usage:
 *   nanobanana-plus api [--port 3456] [--output ~/Desktop/nanobanana-plus/output]
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageGenerator } from './imageGenerator.js';
import { startApiServer } from './apiServer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length) {
      args[argv[i].slice(2)] = argv[++i];
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const port = parseInt(args.port || '3456', 10);
  const outputDir = args.output
    ? path.resolve(args.output)
    : path.resolve(path.join(__dirname, '..', '..', 'output'));
  const privateToken = process.env.NANOBANANA_PRIVATE_TOKEN?.trim();
  const rateLimitMax = parseInt(process.env.NANOBANANA_RATE_LIMIT_MAX || '30', 10);
  const rateLimitWindowMs = parseInt(
    process.env.NANOBANANA_RATE_LIMIT_WINDOW_MS || '60000',
    10,
  );

  console.error('🍌 nanobanana-plus API server starting...');
  console.error(`   Port: ${port}`);
  console.error(`   Output: ${outputDir}`);
  console.error(`   Private mode: ${privateToken ? 'enabled' : 'disabled'}`);
  console.error(`   Rate limit: ${rateLimitMax}/${Math.round(rateLimitWindowMs / 1000)}s`);
  console.error('');

  let authConfig;
  try {
    authConfig = ImageGenerator.validateAuthentication();
  } catch (error: any) {
    console.error(`⚠️  ${error.message}`);
    console.error('   Set NANOBANANA_GEMINI_API_KEY or use `gemini` CLI login.');
    console.error('   Get a free key: https://aistudio.google.com/apikey');
    console.error('');
    authConfig = { apiKey: '', keyType: 'GEMINI_API_KEY' as const, source: 'none' as const };
  }

  const imageGenerator = new ImageGenerator(authConfig);
  await startApiServer(imageGenerator, {
    port,
    outputDir,
    privateToken,
    rateLimitMax,
    rateLimitWindowMs,
  });

  console.error('');
  console.error('📡 Endpoints:');
  console.error(`   GET  http://localhost:${port}/app`);
  console.error(`   GET  http://localhost:${port}/health`);
  console.error(`   GET  http://localhost:${port}/api/models`);
  console.error(`   POST http://localhost:${port}/api/generate`);
  console.error(`   POST http://localhost:${port}/api/edit`);
  console.error(`   POST http://localhost:${port}/api/restore`);
  console.error(`   GET  http://localhost:${port}/api/files`);
  console.error(`   GET  http://localhost:${port}/api/files/:filename`);
  console.error(`   GET  http://localhost:${port}/api/docs  ← Swagger UI`);
  console.error('');
  if (privateToken) {
    console.error(`🔐 Private Token: enabled via NANOBANANA_PRIVATE_TOKEN`);
    console.error('   Open /app in the browser and paste the token once.');
    console.error('');
  }
  console.error('Example:');
  console.error(`   curl -X POST http://localhost:${port}/api/generate \\`);
  if (privateToken) {
    console.error(`     -H "Authorization: Bearer $NANOBANANA_PRIVATE_TOKEN" \\`);
  }
  console.error(`     -H "Content-Type: application/json" \\`);
  console.error(`     -d '{"prompt": "cyberpunk city at night", "aspectRatio": "16:9"}'`);
  console.error('');
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
