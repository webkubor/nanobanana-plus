#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(currentDir, '..');
const serverEntry = resolve(packageRoot, 'mcp-server', 'dist', 'index.js');

if (!existsSync(serverEntry)) {
  console.error(
    'nanobanana-plus MCP server build not found. Reinstall the package or run `npm run build`.',
  );
  process.exit(1);
}

const child = spawn(process.execPath, [serverEntry, ...process.argv.slice(2)], {
  cwd: packageRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (error) => {
  console.error(`Failed to start nanobanana-plus MCP server: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
