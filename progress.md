# Progress

Original prompt: А теперь прочти документацию и разработай прототип игры - все по документации максимально залипательная графика должна быть - что бы играмть прямо хотелось в неё

## Status

Playable prototype is running (`npm run dev` → http://localhost:5173).

## Done

- Vite + TypeScript + Phaser 3 scaffold
- Domain layer + playable loop + industrial visuals
- **Adaptive layout subsystem** in `src/game/layout/`:
  - measures `#game-root` (not `window`) — fixes IDE/narrow panel clipping
  - breakpoints phone/tablet/desktop + orientation + safe-area tokens
  - Menu / Play / Results subscribe and reflow
- Verified mobile 390×844 and narrow 360×720: no horizontal crop
- Metallic flange redraw (brushed rings, hex bolts, bevels, shadows)
- Floating `FocusCursor` follows pointer/touch with magnet-to-flange; keyboard moves between cells
- **Performance pass** (pulse via scale, dirty gauge/cursor, vessel shimmer layer, layout debounce)
- **Deploy workflow** (mirror PVT): push `main` → build → rename `app.html` → publish to `cadautoscript.com/static/mini-games/flanges-memory-matrix`

## TODOs / next agent

- [ ] Ensure GitHub secret `DEPLOY_TOKEN` exists on this repo (PAT write to `YurMil/cadautoscript.com`)
- [ ] Merge to `main` to trigger first production publish (replaces placeholder `app.html` on the site)
- [ ] AudioManager + mute
- [ ] Tutorial scene
- [ ] i18n en/et/ru
- [ ] On phone, optionally cap grid columns (GDD) via difficulty + layout.shortSide
- [ ] Unit tests for `classifyBreakpoint` / `createLayoutTokens`
- [ ] Platform bridge `postMessage` (docs/04) — host already uses same-origin iframe
