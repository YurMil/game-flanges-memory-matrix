import fs from 'node:fs';
import path from 'node:path';

/**
 * Rename Vite entry to the host iframe contract used by MiniGameShellPage:
 * /mini-games/flanges-memory-matrix/app.html
 */
const dist = path.resolve('dist');
const from = path.join(dist, 'index.html');
const to = path.join(dist, 'app.html');

if (!fs.existsSync(from)) {
  console.error('Missing dist/index.html — run vite build first');
  process.exit(1);
}

if (fs.existsSync(to)) fs.unlinkSync(to);
fs.renameSync(from, to);
console.log('Prepared host entry:', path.relative(process.cwd(), to));
