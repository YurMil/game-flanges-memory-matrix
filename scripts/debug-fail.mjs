import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('output/web-game');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(2800); // into recall

// Click a wrong tile intentionally (focus 0, activate if not target)
await page.evaluate(() => {
  const play = window.__GAME__.scene.getScene('PlayScene');
  const state = JSON.parse(window.render_game_to_text());
  const wrong = state.tiles.find((t) => !state.targets.includes(t.key));
  const [row, col] = wrong.key.split(':').map(Number);
  const idx = row * play.roundConfig.columns + col;
  play.setFocus(idx);
  play.activateFocus();
});
await page.waitForTimeout(400);
const state = await page.evaluate(() => window.render_game_to_text());
fs.writeFileSync(path.join(outDir, '05-failure.json'), state);
await page.screenshot({ path: path.join(outDir, '05-failure.png') });
console.log(state);
await browser.close();
