import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const serverRoot = resolve(projectRoot, 'mcp-server');
const serverSourceEntry = resolve(serverRoot, 'src', 'index.ts');
const serverDistEntry = resolve(serverRoot, 'dist', 'index.js');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(serverRoot)) {
  process.exit(0);
}

const hasSource = existsSync(serverSourceEntry);
const hasBuild = existsSync(serverDistEntry);

if (hasSource) {
  run(npmCommand, ['--prefix', serverRoot, 'install', '--ignore-scripts']);
  run(npmCommand, ['--prefix', serverRoot, 'run', 'build']);
  process.exit(0);
}

if (!hasBuild) {
  console.error(
    'nanobanana-plus install is missing both source files and build output. Please reinstall the package.',
  );
  process.exit(1);
}

run(npmCommand, [
  '--prefix',
  serverRoot,
  'install',
  '--omit=dev',
  '--ignore-scripts',
]);
