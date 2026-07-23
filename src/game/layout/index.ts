/**
 * Adaptive layout subsystem
 * -------------------------
 * `src/game/layout/` owns viewport recognition and UI tokens.
 *
 * Flow:
 * 1. `measureViewport(#game-root)` — container box + safe-area CSS vars (not window)
 * 2. `createViewportProfile` — breakpoint / orientation / compact / touch
 * 3. `createLayoutTokens` — padding, type scale, vessel, HUD, menu/results rhythm
 * 4. `AdaptiveLayoutService` — ResizeObserver + visualViewport; `scale.resize()`;
 *    scenes `subscribe()` and reflow
 *
 * Bootstrap (`main.ts`): create service → register scenes → start BootScene.
 */

export type {
  BreakpointId,
  OrientationId,
  ViewportInsets,
  ViewportProfile,
  LayoutTokens,
} from './types';
export { BREAKPOINTS, classifyBreakpoint } from './breakpoints';
export { measureViewport } from './measureViewport';
export { createViewportProfile, createLayoutTokens } from './createViewportProfile';
export {
  AdaptiveLayoutService,
  createAdaptiveLayout,
  getAdaptiveLayout,
} from './AdaptiveLayoutService';
export type { LayoutListener } from './AdaptiveLayoutService';
