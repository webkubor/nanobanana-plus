/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type CommandResult = {
  ok: boolean;
  output: string | null;
};

type RuntimeVersion = {
  name: string;
  command: string;
  version: string | null;
};

type McpServerSummary = {
  name: string;
  source: 'gemini' | 'codex';
  transport: 'stdio' | 'url';
  command?: string;
  url?: string;
  argCount?: number;
  envKeys?: string[];
  trust?: boolean;
};

export class SystemProfileCollector {
  private static readonly HOME_DIR = os.homedir();
  private static readonly GEMINI_DIR = path.join(this.HOME_DIR, '.gemini');
  private static readonly CODEX_DIR = path.join(this.HOME_DIR, '.codex');
  private static readonly AGENTS_DIR = path.join(this.HOME_DIR, '.agents');
  private static readonly GEMINI_SETTINGS_PATH = path.join(
    this.GEMINI_DIR,
    'settings.json',
  );
  private static readonly CODEX_CONFIG_PATH = path.join(
    this.CODEX_DIR,
    'config.toml',
  );

  static async collect() {
    const [
      gitBranch,
      pythonVersion,
      pipVersion,
      nodeVersion,
      npmVersion,
      pnpmVersion,
      uvVersion,
      gitVersion,
      brewVersion,
      hardwareModel,
      chipName,
      geminiExtensions,
      geminiSkills,
      codexSkills,
      agentSkills,
      pythonExecutable,
      pythonSitePackages,
      pipPackageCount,
      brewFormulaeCount,
      brewCasksCount,
      geminiConfiguredMcpServers,
      codexConfiguredMcpServers,
    ] = await Promise.all([
      this.getGitBranch(),
      this.getCommandVersion('python3', ['--version']),
      this.getCommandVersion('pip3', ['--version']),
      this.getCommandVersion('node', ['-v']),
      this.getCommandVersion('npm', ['-v']),
      this.getCommandVersion('pnpm', ['-v']),
      this.getCommandVersion('uv', ['--version']),
      this.getCommandVersion('git', ['--version']),
      this.getCommandVersion('brew', ['--version']),
      this.getCommandOutput('sysctl', ['-n', 'hw.model']),
      this.getChipName(),
      this.listDirectoryNames(path.join(this.GEMINI_DIR, 'extensions')),
      this.listDirectoryNames(path.join(this.GEMINI_DIR, 'skills')),
      this.listDirectoryNames(path.join(this.CODEX_DIR, 'skills')),
      this.listDirectoryNames(path.join(this.AGENTS_DIR, 'skills')),
      this.getPythonExecutable(),
      this.getPythonSitePackages(),
      this.getPipPackageCount(),
      this.countCommandLines('brew', ['list', '--formula']),
      this.countCommandLines('brew', ['list', '--cask']),
      this.readGeminiConfiguredMcpServers(),
      this.readCodexConfiguredMcpServers(),
    ]);

    const cpus = os.cpus();
    const totalMemoryGb = Number((os.totalmem() / 1024 ** 3).toFixed(1));
    const configuredMcpServers = [
      ...geminiConfiguredMcpServers,
      ...codexConfiguredMcpServers,
    ];
    const uniqueMcpNames = [...new Set(configuredMcpServers.map((s) => s.name))]
      .sort((a, b) => a.localeCompare(b));

    return {
      generatedAt: new Date().toISOString(),
      machine: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        osRelease: os.release(),
        osVersion: os.version(),
        shell: process.env.SHELL || null,
        terminal: process.env.TERM_PROGRAM || null,
      },
      hardware: {
        chip: chipName.output || cpus[0]?.model || null,
        model: hardwareModel.output,
        cpuModel: cpus[0]?.model || null,
        cpuCores: cpus.length,
        totalMemoryGb,
      },
      workspace: {
        cwd: process.cwd(),
        gitBranch,
      },
      packageManagers: {
        brew: {
          formulaeCount: brewFormulaeCount,
          casksCount: brewCasksCount,
        },
        pip3: {
          packageCount: pipPackageCount,
          executable: pythonExecutable,
          sitePackages: pythonSitePackages,
        },
      },
      runtimes: [
        this.toRuntimeVersion('python3', 'python3 --version', pythonVersion),
        this.toRuntimeVersion('pip3', 'pip3 --version', pipVersion),
        this.toRuntimeVersion('node', 'node -v', nodeVersion),
        this.toRuntimeVersion('npm', 'npm -v', npmVersion),
        this.toRuntimeVersion('pnpm', 'pnpm -v', pnpmVersion),
        this.toRuntimeVersion('uv', 'uv --version', uvVersion),
        this.toRuntimeVersion('git', 'git --version', gitVersion),
        this.toRuntimeVersion('brew', 'brew --version', brewVersion),
      ],
      mcp: {
        configuredServersCount: configuredMcpServers.length,
        uniqueServerNamesCount: uniqueMcpNames.length,
        uniqueServerNames: uniqueMcpNames,
        geminiConfiguredServersCount: geminiConfiguredMcpServers.length,
        codexConfiguredServersCount: codexConfiguredMcpServers.length,
        configuredServers: configuredMcpServers,
      },
      aiEnvironment: {
        directories: {
          gemini: this.GEMINI_DIR,
          codex: this.CODEX_DIR,
          agents: this.AGENTS_DIR,
        },
        envFlags: {
          hasImageAgentGeminiApiKey: Boolean(
            process.env.IMAGE_AGENT_GEMINI_API_KEY ||
              process.env.NANOBANANA_GEMINI_API_KEY,
          ),
          hasImageAgentGoogleApiKey: Boolean(
            process.env.IMAGE_AGENT_GOOGLE_API_KEY ||
              process.env.NANOBANANA_GOOGLE_API_KEY,
          ),
          hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
          hasGoogleApiKey: Boolean(process.env.GOOGLE_API_KEY),
          codexHome: process.env.CODEX_HOME || null,
        },
        installed: {
          geminiExtensionsCount: geminiExtensions.length,
          geminiExtensions,
          geminiSkillsCount: geminiSkills.length,
          geminiSkills,
          codexSkillsCount: codexSkills.length,
          codexSkills,
          agentSkillsCount: agentSkills.length,
          agentSkills,
        },
      },
    };
  }

  private static async getGitBranch(): Promise<string | null> {
    const result = await this.getCommandOutput('git', [
      'rev-parse',
      '--abbrev-ref',
      'HEAD',
    ]);
    return result.output;
  }

  private static async getChipName(): Promise<CommandResult> {
    const brand = await this.getCommandOutput('sysctl', [
      '-n',
      'machdep.cpu.brand_string',
    ]);
    if (brand.ok && brand.output) {
      return brand;
    }

    return this.getCommandOutput('uname', ['-m']);
  }

  private static async getCommandVersion(
    command: string,
    args: string[],
  ): Promise<CommandResult> {
    return this.getCommandOutput(command, args);
  }

  private static async countCommandLines(
    command: string,
    args: string[],
  ): Promise<number | null> {
    const result = await this.getCommandOutput(command, args);
    if (!result.ok || !result.output) {
      return null;
    }

    return result.output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean).length;
  }

  private static async getPythonExecutable(): Promise<string | null> {
    const result = await this.getCommandOutput('python3', [
      '-c',
      'import sys; print(sys.executable)',
    ]);
    return result.output;
  }

  private static async getPythonSitePackages(): Promise<string[]> {
    const result = await this.getCommandOutput('python3', [
      '-c',
      'import json, site; print(json.dumps(site.getsitepackages()))',
    ]);
    if (!result.ok || !result.output) {
      return [];
    }

    try {
      const parsed = JSON.parse(result.output) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static async getPipPackageCount(): Promise<number | null> {
    const result = await this.getCommandOutput('pip3', ['list', '--format=json']);
    if (!result.ok || !result.output) {
      return null;
    }

    try {
      const parsed = JSON.parse(result.output) as unknown[];
      return parsed.length;
    } catch {
      return null;
    }
  }

  private static async getCommandOutput(
    command: string,
    args: string[],
  ): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        timeout: 5000,
      });
      const output = `${stdout}${stderr}`.trim();
      return { ok: true, output: output || null };
    } catch {
      return { ok: false, output: null };
    }
  }

  private static async listDirectoryNames(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }

  private static toRuntimeVersion(
    name: string,
    command: string,
    result: CommandResult,
  ): RuntimeVersion {
    return {
      name,
      command,
      version: result.output,
    };
  }

  private static async readGeminiConfiguredMcpServers(): Promise<
    McpServerSummary[]
  > {
    try {
      const content = await fs.promises.readFile(
        this.GEMINI_SETTINGS_PATH,
        'utf8',
      );
      const parsed = JSON.parse(content) as {
        mcpServers?: Record<
          string,
          {
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            trust?: boolean;
            url?: string;
          }
        >;
      };
      const servers = parsed.mcpServers || {};

      return Object.entries(servers)
        .map(([name, config]) => ({
          name,
          source: 'gemini' as const,
          transport: config.url ? ('url' as const) : ('stdio' as const),
          command: config.command,
          url: config.url,
          argCount: Array.isArray(config.args) ? config.args.length : 0,
          envKeys: config.env ? Object.keys(config.env).sort() : [],
          trust: config.trust,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  private static async readCodexConfiguredMcpServers(): Promise<
    McpServerSummary[]
  > {
    try {
      const content = await fs.promises.readFile(this.CODEX_CONFIG_PATH, 'utf8');
      const lines = content.split('\n');
      const servers: McpServerSummary[] = [];
      let current: McpServerSummary | null = null;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
          continue;
        }

        const sectionMatch = line.match(/^\[mcp_servers\.([^\]]+)\]$/);
        if (sectionMatch) {
          if (current) {
            servers.push(current);
          }
          current = {
            name: sectionMatch[1],
            source: 'codex',
            transport: 'stdio',
            argCount: 0,
          };
          continue;
        }

        if (!current) {
          continue;
        }

        const commandMatch = line.match(/^command\s*=\s*"([^"]+)"$/);
        if (commandMatch) {
          current.command = commandMatch[1];
          current.transport = 'stdio';
          continue;
        }

        const urlMatch = line.match(/^url\s*=\s*"([^"]+)"$/);
        if (urlMatch) {
          current.url = urlMatch[1];
          current.transport = 'url';
          continue;
        }

        const argsMatch = line.match(/^args\s*=\s*\[(.*)\]$/);
        if (argsMatch) {
          const argCount = [...argsMatch[1].matchAll(/"([^"]*)"/g)].length;
          current.argCount = argCount;
        }
      }

      if (current) {
        servers.push(current);
      }

      return servers.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
}
