import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const candidates = [
  resolve(projectRoot, 'node_modules', '.bin', 'tsc'),
  resolve(projectRoot, 'mcp-server', 'node_modules', '.bin', 'tsc'),
];

const tscPath = candidates.find((candidate) => existsSync(candidate));

if (!tscPath) {
  console.error(
    'TypeScript compiler not found. Run `pnpm install` at the project root before building.',
  );
  process.exit(1);
}

const result = spawnSync(tscPath, process.argv.slice(2), {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
