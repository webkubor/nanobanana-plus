#!/usr/bin/env node

import { copyFile, mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { ImageGenerator } from './imageGenerator.js';
import { ImageGenerationRequest } from './types.js';

type CliOptions = Record<string, string | boolean>;

function usage() {
  console.log(`nanobanana-plus

Usage:
  nanobanana-plus generate --prompt "..." [--filename out.png] [--aspect-ratio 16:9]
                     [--model MODEL] [--output-count 1] [--file-format png|jpeg]
                     [--seed 123] [--preview | --no-preview]

Commands:
  generate    Generate one or more images locally
`);
}

function parseArgs(argv: string[]): { command: string; options: CliOptions } {
  const args = [...argv];
  const first = args[0];
  const command = first && !first.startsWith('-') ? String(args.shift()) : 'help';
  const options: CliOptions = {};

  while (args.length > 0) {
    const current = args.shift();
    if (!current) {
      continue;
    }

    if (current === '--help' || current === '-h') {
      options.help = true;
      continue;
    }

    if (current === '--preview' || current === '--no-preview') {
      options[current.slice(2)] = true;
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

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
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

function inferFileFormat(filename?: string): 'png' | 'jpeg' {
  if (!filename) {
    return 'png';
  }

  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    return 'jpeg';
  }

  return 'png';
}

function deriveOutputPaths(
  filename: string | undefined,
  generatedFiles: string[],
): string[] {
  if (!filename) {
    return generatedFiles;
  }

  const resolved = path.resolve(filename);
  const ext = path.extname(resolved) || `.${inferFileFormat(filename) === 'jpeg' ? 'jpg' : 'png'}`;
  const dir = path.dirname(resolved);
  const base = path.basename(resolved, ext);

  if (generatedFiles.length <= 1) {
    return [resolved];
  }

  return generatedFiles.map((_, index) =>
    path.join(dir, `${base}-${String(index + 1).padStart(2, '0')}${ext}`),
  );
}

async function moveFile(sourcePath: string, targetPath: string): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await rename(sourcePath, targetPath);
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : '';
    if (code !== 'EXDEV') {
      throw error;
    }

    await copyFile(sourcePath, targetPath);
    await unlink(sourcePath);
  }
}

async function relocateOutputs(
  generatedFiles: string[],
  filename: string | undefined,
): Promise<string[]> {
  const targetPaths = deriveOutputPaths(filename, generatedFiles);

  await Promise.all(
    generatedFiles.map(async (sourcePath, index) => {
      const targetPath = targetPaths[index];
      if (sourcePath === targetPath) {
        return;
      }
      await moveFile(sourcePath, targetPath);
    }),
  );

  return targetPaths;
}

function printOutputs(files: string[]) {
  for (const file of files) {
    console.log(file);
    console.log(`MEDIA:${file}`);
  }
}

async function runGenerate(options: CliOptions) {
  const prompt = typeof options.prompt === 'string' ? options.prompt : '';
  if (!prompt) {
    throw new Error('--prompt is required for generate');
  }

  if (options.preview && options['no-preview']) {
    throw new Error('--preview and --no-preview cannot be used together');
  }

  const outputCount =
    typeof options['output-count'] === 'string'
      ? Number(options['output-count'])
      : 1;
  if (!Number.isInteger(outputCount) || outputCount < 1 || outputCount > 8) {
    throw new Error('--output-count must be an integer between 1 and 8');
  }

  const authConfig = ImageGenerator.validateAuthentication();
  const imageGenerator = new ImageGenerator(authConfig);
  const filename = typeof options.filename === 'string' ? options.filename : undefined;

  const request: ImageGenerationRequest = {
    prompt,
    mode: 'generate',
    model: typeof options.model === 'string' ? options.model as ImageGenerationRequest['model'] : undefined,
    aspectRatio:
      typeof options['aspect-ratio'] === 'string' ? options['aspect-ratio'] : undefined,
    outputCount,
    customFileName: filename ? path.parse(filename).name : undefined,
    fileFormat:
      typeof options['file-format'] === 'string'
        ? options['file-format'] as 'png' | 'jpeg'
        : inferFileFormat(filename),
    seed: typeof options.seed === 'string' ? Number(options.seed) : undefined,
    preview: Boolean(options.preview),
    noPreview: Boolean(options['no-preview']),
  };

  const result = await imageGenerator.generateTextToImage(request);
  if (!result.success || !result.generatedFiles?.length) {
    throw new Error(result.error || result.message || 'Failed to generate image');
  }

  const finalFiles = await relocateOutputs(result.generatedFiles, filename);
  console.error(result.message);
  printOutputs(finalFiles);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (options.help || command === 'help') {
    usage();
    return;
  }

  if (command === 'generate') {
    await runGenerate(options);
    return;
  }

  usage();
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
