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
- **Deploy workflow** + host embed hardening for `cadautoscript.com` CSP/iframe:
  - no Google Fonts CDN; system font stacks
  - fill iframe box (not outer 100dvh)
  - disable nested `F` fullscreen when embedded
  - `npm run build:host` → `app.html` for MiniGameShellPage

## TODOs / next agent

- [ ] Ensure GitHub secret `DEPLOY_TOKEN` exists on this repo (PAT write to `YurMil/cadautoscript.com`)
- [ ] Merge to `main` to trigger first production publish (replaces placeholder `app.html` on the site)
- [ ] Optional: self-host Orbitron/ShareTechMono woff2 under `public/fonts` if brand typography is required under CSP
- [ ] AudioManager + mute
- [ ] Tutorial scene
- [ ] i18n en/et/ru
- [ ] Unit tests for layout + domain
- [ ] Platform bridge `postMessage` only if host MiniGameShellPage gains a listener
