#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const DEFAULT_BASE_URL = 'http://localhost:3456';

function usage() {
  console.log(`nanobanana-plus

Usage:
  node nanobanana-plus.mjs init [--base-url http://localhost:3456] [--token your-token]
  node nanobanana-plus.mjs check
  node nanobanana-plus.mjs check [--base-url http://localhost:3456]
  node nanobanana-plus.mjs models [--token your-token]
  node nanobanana-plus.mjs generate --prompt "..." [--filename out.png] [--aspect-ratio 16:9] [--model MODEL] [--output-count 1] [--token your-token]

Options:
  --base-url   Override service URL. Default: ${DEFAULT_BASE_URL}
  --token      Explicit bearer token for private mode (never persisted)
`);
}

function parseArgs(argv) {
  const args = [...argv];
  let command = 'generate';
  if (args[0] && !args[0].startsWith('-')) {
    command = args.shift();
  }

  const options = {};
  while (args.length > 0) {
    const current = args.shift();
    if (!current) {
      continue;
    }

    if (current === '--help' || current === '-h') {
      options.help = true;
      continue;
    }

    if (!current.startsWith('--')) {
      throw new Error(`Unknown argument: ${current}`);
    }

    const key = current.slice(2);
    const value = args.shift();
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    options[key] = value;
  }

  return { command, options };
}

function trimSlash(input) {
  return input.replace(/\/+$/, '');
}

async function promptForSession(seedOptions = {}) {
  const rl = readline.createInterface({ input, output });
  try {
    const baseAnswer = await rl.question(
      `nanobanana-plus service URL [${seedOptions.baseUrl || DEFAULT_BASE_URL}]: `,
    );
    const tokenAnswer = await rl.question('Private token (leave blank if service is public): ');

    const session = {
      baseUrl: trimSlash((baseAnswer || seedOptions.baseUrl || DEFAULT_BASE_URL).trim()),
      privateToken: (tokenAnswer || seedOptions.privateToken || '').trim(),
    };

    return session;
  } finally {
    rl.close();
  }
}

function resolveRuntimeConfig(options) {
  return {
    baseUrl: trimSlash(options['base-url'] || DEFAULT_BASE_URL),
    privateToken: (options.token || '').trim(),
  };
}

function authHeaders(token) {
  if (!token) {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  let data = {};

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    data = { raw: body };
  }

  if (!response.ok) {
    const message = data.error || data.message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return data;
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}

function deriveOutputPaths(filename, imageCount, suggestedNames) {
  const defaultName = filename || `nanobanana-${timestamp()}.png`;
  const resolved = path.resolve(defaultName);
  const dir = path.dirname(resolved);
  const ext = path.extname(resolved) || '.png';
  const base = ext ? path.basename(resolved, ext) : path.basename(resolved);

  if (imageCount <= 1) {
    return [resolved];
  }

  return Array.from({ length: imageCount }, (_, index) => {
    const suggested = suggestedNames[index];
    if (suggested && !filename) {
      return path.resolve(process.cwd(), suggested);
    }
    return path.join(dir, `${base}-${String(index + 1).padStart(2, '0')}${ext}`);
  });
}

function writeImages(data, filename) {
  const images = Array.isArray(data.images) ? data.images : [];
  if (images.length === 0) {
    const files = Array.isArray(data.files) ? data.files : [];
    if (files.length > 0) {
      console.log(files.join('\n'));
      return files;
    }
    throw new Error('No images returned by API');
  }

  const outputPaths = deriveOutputPaths(
    filename,
    images.length,
    images.map((image) => image.filename).filter(Boolean),
  );

  outputPaths.forEach((filePath, index) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(images[index].base64, 'base64'));
    console.log(filePath);
    console.log(`MEDIA:${filePath}`);
  });

  return outputPaths;
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (options.help) {
    usage();
    return;
  }

  if (command === 'init') {
    const session = options['base-url'] || options.token
      ? {
          baseUrl: trimSlash(options['base-url'] || DEFAULT_BASE_URL),
          privateToken: (options.token || '').trim(),
        }
      : await promptForSession({
      baseUrl: options['base-url'],
      privateToken: options.token,
    });

    console.log('Initialization complete. Credentials are not stored on disk.');
    console.log('');
    console.log('Use one of these commands:');
    console.log(`  node nanobanana-plus.mjs check --base-url "${session.baseUrl}"`);
    console.log(`  node nanobanana-plus.mjs models --base-url "${session.baseUrl}"${session.privateToken ? ' --token "<your-token>"' : ''}`);
    console.log(`  node nanobanana-plus.mjs generate --base-url "${session.baseUrl}" --prompt "..." --filename "out.png"${session.privateToken ? ' --token "<your-token>"' : ''}`);
    return;
  }

  const config = resolveRuntimeConfig(options);
  const baseUrl = config.baseUrl;
  const token = config.privateToken;

  if (command === 'check') {
    const data = await fetchJson(`${baseUrl}/health`);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (command === 'models') {
    const data = await fetchJson(`${baseUrl}/api/models`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (command === 'generate') {
    if (!options.prompt) {
      throw new Error('--prompt is required for generate');
    }

    const payload = {
      prompt: options.prompt,
      model: options.model,
      aspectRatio: options['aspect-ratio'],
      outputCount: options['output-count'] ? Number(options['output-count']) : 1,
      customFileName: options.filename ? path.basename(options.filename) : undefined,
      fileFormat: options['file-format'] || inferFileFormat(options.filename),
      format: 'both',
      seed: options.seed ? Number(options.seed) : undefined,
    };

    const data = await fetchJson(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    writeImages(data, options.filename);
    return;
  }

  if (command === 'edit' || command === 'restore') {
    throw new Error(
      `${command} is intentionally omitted from the ClawHub skill to avoid sending local file paths or file contents over HTTP. Use the local nanobanana-plus CLI/API directly for ${command}.`,
    );
  }

  usage();
  throw new Error(`Unknown command: ${command}`);
}

function inferFileFormat(filename) {
  if (!filename) {
    return 'png';
  }
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    return 'jpeg';
  }
  return 'png';
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
