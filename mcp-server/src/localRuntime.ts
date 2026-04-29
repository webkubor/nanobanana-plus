import { access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

export type LocalRuntime = 'codex' | 'gemini' | 'openclaw' | 'hermes';

const execFileAsync = promisify(execFile);
const MIN_CODEX_VERSION = '0.125.0';
const MIN_GEMINI_VERSION = '0.36.0';

export interface RuntimeVersionStatus {
  path?: string;
  version?: string;
  ready: boolean;
  message?: string;
}

export interface LocalRuntimeStatus {
  ready: boolean;
  codexPath?: string;
  geminiPath?: string;
  openclawPath?: string;
  hermesPath?: string;
  codexVersion?: string;
  geminiVersion?: string;
  codexReady: boolean;
  geminiReady: boolean;
  warnings: string[];
  defaultRuntime?: LocalRuntime;
  agentRuntimes: LocalRuntime[];
  message: string;
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findCommand(command: string): Promise<string | undefined> {
  const pathValue = process.env.PATH || '';
  const extensions =
    process.platform === 'win32' ? ['', '.cmd', '.exe', '.bat'] : [''];

  for (const dir of pathValue.split(path.delimiter)) {
    if (!dir) {
      continue;
    }

    for (const extension of extensions) {
      const candidate = path.join(dir, `${command}${extension}`);
      if (await isExecutable(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

function parseVersion(output: string): string | undefined {
  return output.match(/\d+\.\d+\.\d+/)?.[0];
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (leftParts[i] || 0) - (rightParts[i] || 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

async function getCommandVersion(
  commandPath: string | undefined,
  minimumVersion: string,
): Promise<RuntimeVersionStatus> {
  if (!commandPath) {
    return { ready: false };
  }

  try {
    const { stdout, stderr } = await execFileAsync(commandPath, ['--version'], {
      timeout: 10_000,
    });
    const version = parseVersion(`${stdout}\n${stderr}`);

    if (!version) {
      return {
        path: commandPath,
        ready: false,
        message: `Cannot parse version from ${commandPath} --version output.`,
      };
    }

    if (compareVersions(version, minimumVersion) < 0) {
      return {
        path: commandPath,
        version,
        ready: false,
        message: `Version ${version} is too old. Please update to >= ${minimumVersion}.`,
      };
    }

    return { path: commandPath, version, ready: true };
  } catch (error: unknown) {
    return {
      path: commandPath,
      ready: false,
      message: `Cannot run ${commandPath} --version: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function checkLocalRuntime(): Promise<LocalRuntimeStatus> {
  const [codexPath, geminiPath, openclawPath, hermesPath] = await Promise.all([
    findCommand('codex'),
    findCommand('gemini'),
    findCommand('openclaw'),
    findCommand('hermes'),
  ]);
  const agentRuntimes: LocalRuntime[] = [];

  if (openclawPath) {
    agentRuntimes.push('openclaw');
  }

  if (hermesPath) {
    agentRuntimes.push('hermes');
  }

  const [codexStatus, geminiStatus] = await Promise.all([
    getCommandVersion(codexPath, MIN_CODEX_VERSION),
    getCommandVersion(geminiPath, MIN_GEMINI_VERSION),
  ]);
  const warnings = [codexStatus.message, geminiStatus.message].filter(
    (message): message is string => Boolean(message),
  );

  if (codexStatus.ready) {
    return {
      ready: true,
      codexPath,
      geminiPath,
      openclawPath,
      hermesPath,
      codexVersion: codexStatus.version,
      geminiVersion: geminiStatus.version,
      codexReady: true,
      geminiReady: geminiStatus.ready,
      warnings,
      defaultRuntime: 'codex',
      agentRuntimes,
      message:
        geminiStatus.ready
          ? `codex ${codexStatus.version} and gemini ${geminiStatus.version} are ready. Default runtime: codex (${codexPath}). Agent runtimes: ${agentRuntimes.length ? agentRuntimes.join(', ') : 'none'}.`
          : `codex ${codexStatus.version} is ready. Default runtime: codex (${codexPath}).`,
    };
  }

  if (geminiStatus.ready) {
    return {
      ready: true,
      geminiPath,
      openclawPath,
      hermesPath,
      codexVersion: codexStatus.version,
      geminiVersion: geminiStatus.version,
      codexReady: false,
      geminiReady: true,
      warnings,
      defaultRuntime: 'gemini',
      agentRuntimes,
      message: `gemini ${geminiStatus.version} is ready. Default runtime: gemini (${geminiPath}). Agent runtimes: ${agentRuntimes.length ? agentRuntimes.join(', ') : 'none'}.`,
    };
  }

  return {
    ready: false,
    openclawPath,
    hermesPath,
    codexVersion: codexStatus.version,
    geminiVersion: geminiStatus.version,
    codexReady: false,
    geminiReady: false,
    warnings,
    agentRuntimes,
    message:
      warnings.length
        ? `No supported Codex/Gemini CLI runtime found. ${warnings.join(' ')}\n` +
          `  → Recommended: npm install -g @openai/codex\n` +
          `  → Fallback:     npm install -g @google/gemini-cli`
        : 'Neither codex nor gemini CLI is installed or visible in PATH.\n' +
          '  → Recommended: npm install -g @openai/codex\n' +
          '  → Fallback:     npm install -g @google/gemini-cli',
  };
}

export async function ensureLocalRuntimeReady(): Promise<LocalRuntimeStatus> {
  const status = await checkLocalRuntime();
  if (!status.ready) {
    throw new Error(status.message);
  }

  return status;
}
