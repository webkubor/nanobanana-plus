#!/usr/bin/env node

import type { Dirent } from 'node:fs';
import { copyFile, mkdir, readdir, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { FileHandler } from './fileHandler.js';
import { ImageGenerator } from './imageGenerator.js';
import { ImageGenerationRequest } from './types.js';
import { checkLocalRuntime, ensureLocalRuntimeReady } from './localRuntime.js';
import {
  listProfiles,
  getProfile,
  setDefaultProfile,
  upsertProfile,
  getDefaultProfileName,
  PLATFORM_ASPECT_RATIO,
} from './profileManager.js';
import { expandPrompt, describeProfile } from './promptExpander.js';

type CliOptions = Record<string, string | boolean>;

function usage() {
  console.log(`image-agent-plus

Usage:
  image-agent-plus generate --prompt "..." [options]

Options (generate):
  --aspect-ratio 16:9     Output ratio. Inferred from active profile when omitted.
  --profile <name>        Use a saved profile (overrides default profile).
  --no-expand             Skip automatic prompt expansion.
  --provider codex|gemini|openai
  --model MODEL           Provider model ID.
  --output-count 1        Number of images (1-8).
  --file-format png|jpeg
  --filename out.png      Output file path.
  --seed 123
  --preview | --no-preview

Commands:
  check                     Check local runtime and auth environment
  generate                  Generate images (uses active profile for defaults)
  collect-codex             Copy latest Codex image from ~/.codex/generated_images
  profile list              Show all profiles and the current default
  profile use <name>        Set the default profile
  profile show [name]       Show details of a profile
  profile set               Create or update a profile via guided flags
`);
}

function parseArgs(argv: string[]): { command: string; options: CliOptions } {
  const args = [...argv];
  const first = args[0];
  const command = first && !first.startsWith('-') ? String(args.shift()) : 'help';
  const options: CliOptions = {};

  // Commands that use subcommand/positional syntax — skip flag parsing, let them
  // read directly from process.argv.
  const subcommandOnlyCommands = new Set(['profile']);
  if (subcommandOnlyCommands.has(command)) {
    return { command, options };
  }

  while (args.length > 0) {
    const current = args.shift();
    if (!current) {
      continue;
    }

    if (current === '--help' || current === '-h') {
      options.help = true;
      continue;
    }

    if (current === '--preview' || current === '--no-preview' || current === '--no-expand') {
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
  const requestedExt = path.extname(resolved);
  const fallbackExt = `.${inferFileFormat(filename) === 'jpeg' ? 'jpg' : 'png'}`;
  const ext = requestedExt || path.extname(generatedFiles[0] || '') || fallbackExt;
  const dir = path.dirname(resolved);
  const base = requestedExt
    ? path.basename(resolved, requestedExt)
    : path.basename(resolved);

  if (generatedFiles.length <= 1) {
    return [path.join(dir, `${base}${ext}`)];
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

function codexGeneratedImagesRoot(): string {
  return path.join(
    process.env.CODEX_HOME || path.join(process.env.HOME || '', '.codex'),
    'generated_images',
  );
}

async function listImageFiles(dir: string): Promise<string[]> {
  let entries: Dirent<string>[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listImageFiles(fullPath));
      continue;
    }

    if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findLatestCodexImage(): Promise<string> {
  const imageFiles = await listImageFiles(codexGeneratedImagesRoot());
  const candidates = await Promise.all(
    imageFiles.map(async (file) => ({
      file,
      mtimeMs: (await stat(file)).mtimeMs,
    })),
  );

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const latest = candidates[0]?.file;
  if (!latest) {
    throw new Error('No Codex generated image found under ~/.codex/generated_images');
  }

  return latest;
}

async function runCollectCodex(options: CliOptions) {
  const sourcePath = await findLatestCodexImage();
  const filename = typeof options.filename === 'string' ? options.filename : undefined;
  const targetPath = filename
    ? deriveOutputPaths(filename, [sourcePath])[0]
    : path.join(FileHandler.ensureOutputDirectory(), path.basename(sourcePath));

  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
  console.error(`✓ Copied latest Codex image: ${sourcePath}`);
  printOutputs([targetPath]);
}

async function runGenerate(options: CliOptions) {
  const runtimeStatus = await ensureLocalRuntimeReady();
  console.error(`✓ ${runtimeStatus.message}`);

  const rawPrompt = typeof options.prompt === 'string' ? options.prompt : '';
  if (!rawPrompt) {
    throw new Error('--prompt is required for generate');
  }

  if (options.preview && options['no-preview']) {
    throw new Error('--preview and --no-preview cannot be used together');
  }

  // ── Profile resolution ────────────────────────────────────────────────────
  const profileName = typeof options.profile === 'string' ? options.profile : undefined;
  const profile = getProfile(profileName);
  if (profile) {
    console.error(`✓ Profile: ${profile.name} (${describeProfile(profile)})`);
  }

  // ── Aspect ratio: explicit flag > profile > undefined ────────────────────
  const explicitAspectRatio =
    typeof options['aspect-ratio'] === 'string' ? options['aspect-ratio'] : undefined;
  const aspectRatio = explicitAspectRatio ?? profile?.aspectRatio;

  // ── Prompt expansion ─────────────────────────────────────────────────────
  let finalPrompt = rawPrompt;
  if (!options['no-expand'] && profile) {
    const expansion = expandPrompt(rawPrompt, profile);
    finalPrompt = expansion.expanded;
    if (expansion.appliedTokens.length > 0) {
      console.error(`✓ Prompt expanded (+${expansion.appliedTokens.length} tokens)`);
    }
  }

  const outputCount =
    typeof options['output-count'] === 'string'
      ? Number(options['output-count'])
      : 1;
  if (!Number.isInteger(outputCount) || outputCount < 1 || outputCount > 8) {
    throw new Error('--output-count must be an integer between 1 and 8');
  }

  const providerOverride =
    typeof options.provider === 'string' ? options.provider : profile?.provider;
  const provider =
    providerOverride === 'codex' || providerOverride === 'openai' || providerOverride === 'gemini'
      ? (providerOverride as 'codex' | 'gemini' | 'openai')
      : undefined;
  if (options.provider && !provider) {
    throw new Error('--provider must be "codex", "gemini", or "openai"');
  }

  const authConfig = await ImageGenerator.validateAuthentication(provider);
  const imageGenerator = new ImageGenerator(authConfig);
  const filename = typeof options.filename === 'string' ? options.filename : undefined;

  const request: ImageGenerationRequest = {
    prompt: finalPrompt,
    mode: 'generate',
    provider,
    model: typeof options.model === 'string' ? options.model as ImageGenerationRequest['model'] : undefined,
    aspectRatio,
    outputCount,
    customFileName: filename ? path.parse(filename).name : undefined,
    fileFormat:
      typeof options['file-format'] === 'string'
        ? options['file-format'] as 'png' | 'jpeg'
        : inferFileFormat(filename),
    seed: typeof options.seed === 'string' ? Number(options.seed) : undefined,
    preview: Boolean(options.preview),
    noPreview: Boolean(options['no-preview']),
    profileName: profile?.name,
    noExpand: Boolean(options['no-expand']),
  };

  const result = await imageGenerator.generateTextToImage(request);
  if (!result.success || !result.generatedFiles?.length) {
    throw new Error(result.error || result.message || 'Failed to generate image');
  }

  const finalFiles = await relocateOutputs(result.generatedFiles, filename);
  console.error(result.message);
  printOutputs(finalFiles);
}

async function runProfile(subArgs: string[]) {
  const sub = subArgs[0];

  if (!sub || sub === 'list') {
    const profiles = listProfiles();
    const defaultName = getDefaultProfileName();
    console.log(`Profiles  (default: ${defaultName})`);
    console.log('');
    for (const { name, isDefault, profile } of profiles) {
      const marker = isDefault ? '* ' : '  ';
      console.log(`${marker}${name.padEnd(12)} ${describeProfile(profile)}`);
    }
    console.log('');
    console.log(`Switch default:  image-agent-plus profile use <name>`);
    console.log(`Profile config:  ~/.image-agent-plus/profiles.json`);
    return;
  }

  if (sub === 'use') {
    const name = subArgs[1];
    if (!name) throw new Error('Usage: profile use <name>');
    setDefaultProfile(name);
    console.log(`✓ Default profile set to "${name}".`);
    return;
  }

  if (sub === 'show') {
    const name = subArgs[1];
    const profile = getProfile(name);
    if (!profile) throw new Error(`Profile "${name ?? getDefaultProfileName()}" not found.`);
    console.log(JSON.stringify(profile, null, 2));
    return;
  }

  if (sub === 'set') {
    // image-agent-plus profile set --name myprofile --platform web-blog --aspect-ratio 16:9 --style cinematic
    const args = subArgs.slice(1);
    const opts: Record<string, string> = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]?.replace(/^--/, '');
      const val = args[i + 1];
      if (key && val) opts[key] = val;
    }
    if (!opts.name) throw new Error('--name is required for profile set');
    const platform = opts.platform ?? 'custom';
    const aspectRatio = opts['aspect-ratio'] ?? PLATFORM_ASPECT_RATIO[platform] ?? '1:1';
    const profile = upsertProfile({
      name: opts.name,
      platform,
      aspectRatio,
      style: opts.style,
      provider: opts.provider,
      qualityLevel: opts['quality'] as 'fast' | 'standard' | 'high' | undefined,
      promptSuffix: opts.suffix,
    });
    console.log(`✓ Profile "${profile.name}" saved.`);
    console.log(JSON.stringify(profile, null, 2));
    return;
  }

  throw new Error(`Unknown profile subcommand: ${sub}. Try: list | use <name> | show [name] | set --name ...`);
}

async function runCheck() {
  const runtimeStatus = await checkLocalRuntime();
  console.log('Local runtime');
  console.log(`  ready: ${runtimeStatus.ready ? 'yes' : 'no'}`);
  console.log(`  default: ${runtimeStatus.defaultRuntime || '-'}`);
  console.log(
    `  codex: ${runtimeStatus.codexPath || '-'}${runtimeStatus.codexVersion ? ` (${runtimeStatus.codexVersion})` : ''}${runtimeStatus.codexReady ? '' : ' [not ready]'}`,
  );
  console.log(
    `  gemini: ${runtimeStatus.geminiPath || '-'}${runtimeStatus.geminiVersion ? ` (${runtimeStatus.geminiVersion})` : ''}${runtimeStatus.geminiReady ? '' : ' [not ready]'}`,
  );
  console.log(`  openclaw: ${runtimeStatus.openclawPath || '-'}`);
  console.log(`  hermes: ${runtimeStatus.hermesPath || '-'}`);
  console.log(
    `  agent runtimes: ${runtimeStatus.agentRuntimes.length ? runtimeStatus.agentRuntimes.join(', ') : '-'}`,
  );
  console.log(`  message: ${runtimeStatus.message}`);
  for (const warning of runtimeStatus.warnings) {
    console.log(`  warning: ${warning}`);
  }

  if (!runtimeStatus.ready) {
    console.log('');
    console.log('Getting started');
    if (!runtimeStatus.codexReady && !runtimeStatus.geminiReady) {
      console.log('  No image-generation CLI found. Install one to get started:');
      console.log('');
      console.log('  [Recommended] Codex CLI — native image generation, no API key needed:');
      console.log('    npm install -g @openai/codex');
      console.log('    codex login');
      console.log('');
      console.log('  [Fallback] Gemini CLI — requires a Gemini API key for image output:');
      console.log('    npm install -g @google/gemini-cli');
      console.log('    gemini auth login');
    } else if (!runtimeStatus.codexReady && runtimeStatus.geminiReady) {
      console.log('  Gemini CLI is ready but image generation requires a Gemini API key.');
      console.log('  Get one at: https://aistudio.google.com/apikey');
      console.log('  Then set: export GEMINI_API_KEY=<your-key>');
      console.log('');
      console.log('  Or install Codex CLI for key-free image generation:');
      console.log('    npm install -g @openai/codex && codex login');
    }
    process.exitCode = 1;
  }
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (options.help || command === 'help') {
    usage();
    return;
  }

  if (command === 'check') {
    await runCheck();
    return;
  }

  if (command === 'collect-codex') {
    await runCollectCodex(options);
    return;
  }

  if (command === 'generate') {
    await runGenerate(options);
    return;
  }

  if (command === 'profile') {
    await runProfile(process.argv.slice(3));
    return;
  }

  usage();
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
