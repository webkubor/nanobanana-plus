import { access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export type LocalRuntime = 'codex' | 'gemini' | 'openclaw' | 'hermes';

export interface LocalRuntimeStatus {
  ready: boolean;
  codexPath?: string;
  geminiPath?: string;
  openclawPath?: string;
  hermesPath?: string;
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

  if (codexPath) {
    return {
      ready: true,
      codexPath,
      geminiPath,
      openclawPath,
      hermesPath,
      defaultRuntime: 'codex',
      agentRuntimes,
      message:
        geminiPath
          ? `codex and gemini are installed. Default runtime: codex (${codexPath}). Agent runtimes: ${agentRuntimes.length ? agentRuntimes.join(', ') : 'none'}.`
          : `codex is installed. Default runtime: codex (${codexPath}).`,
    };
  }

  if (geminiPath) {
    return {
      ready: true,
      geminiPath,
      openclawPath,
      hermesPath,
      defaultRuntime: 'gemini',
      agentRuntimes,
      message: `gemini is installed. Default runtime: gemini (${geminiPath}). Agent runtimes: ${agentRuntimes.length ? agentRuntimes.join(', ') : 'none'}.`,
    };
  }

  return {
    ready: false,
    openclawPath,
    hermesPath,
    agentRuntimes,
    message:
      'Neither codex nor gemini CLI is installed or visible in PATH. Install at least one runtime before using image-agent-plus. Recommended: install Codex CLI, or install Gemini CLI as fallback.',
  };
}

export async function ensureLocalRuntimeReady(): Promise<LocalRuntimeStatus> {
  const status = await checkLocalRuntime();
  if (!status.ready) {
    throw new Error(status.message);
  }

  return status;
}
