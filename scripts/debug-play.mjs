import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('output/web-game');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

async function dump(label) {
  const state = await page.evaluate(() =>
    typeof window.render_game_to_text === 'function' ? window.render_game_to_text() : 'missing',
  );
  fs.writeFileSync(path.join(outDir, `${label}.json`), state);
  await page.screenshot({ path: path.join(outDir, `${label}.png`), fullPage: true });
  const canvas = await page.$('canvas');
  if (canvas) {
    await canvas.screenshot({ path: path.join(outDir, `${label}-canvas.png`) });
  }
  console.log(label, state);
}

await dump('01-boot-or-menu');
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
await dump('02-after-start');

// Wait through preview (~1800ms) + settle
await page.waitForTimeout(2500);
await dump('03-recall');

// Try to select using game state
const played = await page.evaluate(async () => {
  const raw = window.render_game_to_text?.();
  if (!raw) return { ok: false, reason: 'no state' };
  const state = JSON.parse(raw);
  if (state.state !== 'recall') return { ok: false, reason: 'not recall', state };

  const game = window.__GAME__;
  const play = game.scene.getScene('PlayScene');
  const targets = state.targets || [];
  for (const key of targets) {
    const tile = play.tiles?.find?.((t) => t.key === key);
    // tiles is private - use focus/keyboard via public path
  }
  // Use keyboard: read target coords and navigate
  return { ok: true, targets, focus: state.focusIndex, rows: state.rows, cols: state.columns };
});
console.log('play plan', played);

if (played.ok && played.targets?.length) {
  for (const key of played.targets) {
    const [row, col] = key.split(':').map(Number);
    // Move focus to target
    await page.evaluate(
      ({ row, col }) => {
        const play = window.__GAME__.scene.getScene('PlayScene');
        const idx = row * play.roundConfig.columns + col;
        play.setFocus(idx);
        play.activateFocus();
      },
      { row, col },
    );
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(500);
  await dump('04-after-select');
}

fs.writeFileSync(path.join(outDir, 'console-errors.json'), JSON.stringify(errors, null, 2));
console.log('errors', errors);
await browser.close();
