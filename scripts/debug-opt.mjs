import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('output/web-game');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
const preview = await page.evaluate(() => window.render_game_to_text());
await page.waitForTimeout(2500);
const recall = await page.evaluate(() => window.render_game_to_text());
await page.screenshot({ path: path.join(outDir, 'opt-recall.png') });

const played = await page.evaluate(() => {
  const state = JSON.parse(window.render_game_to_text());
  const play = window.__GAME__.scene.getScene('PlayScene');
  for (const key of state.targets) {
    const [row, col] = key.split(':').map(Number);
    const idx = row * play.roundConfig.columns + col;
    play.setFocus(idx, true);
    play.activateFocus();
  }
  return window.render_game_to_text();
});

fs.writeFileSync(path.join(outDir, 'opt-preview.json'), preview);
fs.writeFileSync(path.join(outDir, 'opt-recall.json'), recall);
fs.writeFileSync(path.join(outDir, 'opt-success.json'), played);
console.log('preview', preview.slice(0, 120));
console.log('recall', recall.slice(0, 120));
console.log('success', played.slice(0, 160));
console.log('errors', errors);
await browser.close();
