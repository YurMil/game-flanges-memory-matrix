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
- **Performance pass:**
  - FlangeTile: preview pulse via container scale (no per-frame `drawFlange`); open tweens throttled
  - drawFlange: bolt position cache, hex scratch buffer, fewer brush rings
  - Menu: static vessel + separate shimmer layer
  - FocusCursor / pressure gauge: dirty-flag redraws
  - Layout: ignore visualViewport scroll, round size diff, skip no-op refreshes
  - Keyboard listeners cleaned on scene shutdown; `preserveDrawingBuffer` only in automation

## TODOs / next agent

- [ ] AudioManager + mute
- [ ] Tutorial scene
- [ ] i18n en/et/ru
- [ ] On phone, optionally cap grid columns (GDD) via difficulty + layout.shortSide
- [ ] Unit tests for `classifyBreakpoint` / `createLayoutTokens`
- [ ] Platform bridge
