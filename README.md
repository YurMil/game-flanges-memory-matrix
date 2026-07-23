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

## Documentation

Full product/engineering docs remain in [`docs/`](docs/).

## License

MIT.
