import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('output/web-game');
fs.mkdirSync(outDir, { recursive: true });

const phone = devices['iPhone 12'];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...phone,
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const state = await page.evaluate(() => window.render_game_to_text());
fs.writeFileSync(path.join(outDir, 'mobile-menu.json'), state);
await page.screenshot({ path: path.join(outDir, 'mobile-menu.png') });

// Also test a narrow desktop panel (IDE-like)
await context.close();
const context2 = await browser.newContext({ viewport: { width: 360, height: 720 } });
const page2 = await context2.newPage();
await page2.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page2.waitForTimeout(900);
const state2 = await page2.evaluate(() => window.render_game_to_text());
fs.writeFileSync(path.join(outDir, 'narrow-panel.json'), state2);
await page2.screenshot({ path: path.join(outDir, 'narrow-panel.png') });

console.log('mobile', state);
console.log('narrow', state2);
console.log('errors', errors);
await browser.close();
