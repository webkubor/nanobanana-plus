#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(currentDir, '..');
const cliEntry = resolve(packageRoot, 'mcp-server', 'dist', 'cli-entry.js');
const envFile = resolve(packageRoot, '.env');

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(envFile);

const firstArg = process.argv[2];
if (firstArg === 'generate') {
  if (!existsSync(cliEntry)) {
    console.error(
      'nanobanana-plus CLI build not found. Run `pnpm run build` first.',
    );
    process.exit(1);
  }

  const child = spawn(process.execPath, [cliEntry, ...process.argv.slice(2)], {
    cwd: packageRoot,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`Failed to start nanobanana-plus CLI: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
} else {
  // Default: show help
  if (!existsSync(cliEntry)) {
    console.error(
      'nanobanana-plus CLI build not found. Run `pnpm run build` first.',
    );
    process.exit(1);
  }

  const child = spawn(process.execPath, [cliEntry, '--help'], {
    cwd: packageRoot,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`Failed to start nanobanana-plus: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}
