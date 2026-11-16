import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = { 'ui.js': 'ui/components.js', 'ui-actions.js': 'ui/actions.js', 'scroll-rail.js': 'ui/scroll-rail.js' };
const outputs = new Map();
for (const file of await readdir(path.join(root, 'mods'), { recursive: true })) {
  if (!file.endsWith('.js')) continue;
  const source = await readFile(path.join(root, 'mods', file), 'utf8');
  for (const match of source.matchAll(/from ["'](?:\.\.\/|\.\/)((?:ui(?:-actions)?|scroll-rail)\.js)["']/g)) {
    outputs.set(path.join('mods', file.split(path.sep)[0], match[1]), modules[match[1]]);
  }
}
let stale = false;
for (const [file, origin] of outputs) {
  const expected = `// Generated from ${origin}. Edit that source, then run npm run sync-ui.\n${await readFile(path.join(root, origin), 'utf8')}`;
  const current = await readFile(path.join(root, file), 'utf8').catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (current === expected) continue;
  if (process.argv.includes('--check')) {
    console.error(`Shared UI out of date: ${file}. Run npm run sync-ui.`);
    stale = true;
  } else await writeFile(path.join(root, file), expected);
}
if (stale) process.exitCode = 1;
