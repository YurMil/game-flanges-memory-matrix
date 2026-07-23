# Flanges Memory Matrix

Browser memory game with an industrial pressure-vessel theme: memorize which nozzles open, then reproduce the pattern before integrity fails.

## Play

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Controls

| Input | Action |
|---|---|
| Click / tap | Select flange |
| Arrows / WASD | Move focus |
| Enter / Space | Activate focused flange |
| P / Esc | Pause |
| R | Restart run |
| F | Fullscreen |
| M | Cycle mode (menu) |

### Modes

- **Standard** — 3 integrity, balanced preview
- **Relaxed** — longer preview, one free mistake
- **Expert** — short preview, 1 life, score multiplier

## Stack

Vite + TypeScript + Phaser 3. Pure rules live in `src/domain/` (no Phaser imports).

## Deploy to cadautoscript.com

On every push to `main`, GitHub Actions builds the game and publishes it into the website repo:

`YurMil/cadautoscript.com` → `static/mini-games/flanges-memory-matrix/`

Host page (already wired):

- Arcade: `/mini-games/flanges-memory-matrix/`
- Iframe entry: `/mini-games/flanges-memory-matrix/app.html`

### Required secret

In this repository settings → Secrets → Actions, add:

| Name | Value |
|---|---|
| `DEPLOY_TOKEN` | GitHub PAT with `contents:write` on `YurMil/cadautoscript.com` |

Same pattern as PVT (`pressure-vessel-tycoon`).

### Local production build

```bash
npm run build
# optionally rename for host iframe parity:
mv dist/index.html dist/app.html
```

`vite.config.ts` uses `base: './'` so assets resolve under the site subdirectory.

## Documentation

Full product/engineering docs remain in [`docs/`](docs/).

## License

MIT.
