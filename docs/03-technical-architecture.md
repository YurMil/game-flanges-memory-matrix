# Technical Architecture

## Architecture decision

Use **Phaser 3 + TypeScript + Vite**.

The existing prototype already proves Phaser is suitable. The product is a 2D memory game requiring reliable pointer input, responsive scaling, timers, tweens, camera feedback, scene lifecycle, and optional audio. Phaser provides these capabilities in a mature open-source engine while keeping the bundle and conceptual overhead substantially lower than a 3D engine.

Do not build the entire game directly in React. React is appropriate for an optional outer shell, settings panels, platform navigation, or account UI, but frame-by-frame game rendering and interaction belong in Phaser.

## Alternatives considered

| Option | Decision | Reason |
|---|---|---|
| Phaser 3 | Selected | Existing prototype, mature 2D stack, WebGL/Canvas, strong input and scene APIs |
| PixiJS | Rejected as primary | Excellent renderer, but more game lifecycle, timing, input, and scene infrastructure must be built manually |
| React + DOM/CSS | Rejected | Possible for a small grid, but animation lifecycle and future game extensions become harder to manage |
| Three.js / Babylon.js | Rejected | Excessive complexity and GPU cost for a flat 2D game |
| Godot HTML5 export | Rejected | Larger deployment artifact and weaker fit for direct web/microfrontend integration |

## Layering

```text
Host platform
  └─ Platform bridge (postMessage/custom events)
      └─ App bootstrap and configuration
          ├─ Phaser scenes and presentation
          ├─ Game application services
          └─ Pure domain rules and state
```

### Domain layer

Pure TypeScript with no Phaser imports:

- round configuration;
- seeded pattern generation;
- selection validation;
- score calculation;
- difficulty progression;
- session statistics;
- serializable state types.

This layer receives values and returns values. It is covered by fast unit tests.

### Application layer

Coordinates domain operations and lifecycle:

- `GameSession`;
- state machine;
- pause/resume;
- persistence;
- localization;
- platform event emission;
- configuration parsing.

### Presentation layer

Phaser scenes and game objects:

- boot and asset preparation;
- menu/tutorial/play/results scenes;
- flange tile rendering;
- animations and audio;
- responsive layout;
- pointer and keyboard mapping.

## Proposed source structure

```text
src/
  main.ts
  app/
    bootstrap.ts
    config.ts
    platformBridge.ts
    persistence.ts
  domain/
    gameState.ts
    patternGenerator.ts
    difficulty.ts
    scoring.ts
    statistics.ts
    types.ts
  game/
    phaserConfig.ts
    scenes/
    objects/
    rendering/
    input/
    audio/
  i18n/
    en.json
    et.json
    ru.json
  styles/
```

## State machine

Recommended states:

```ts
type PlayState =
  | 'idle'
  | 'round-intro'
  | 'preview'
  | 'recall'
  | 'success'
  | 'failure'
  | 'paused'
  | 'game-over';
```

Every delayed callback must be scoped to a round/session token. Restarting or leaving a scene invalidates the token and cancels timers/tweens. This prevents callbacks from an earlier round mutating a new session.

## Rendering strategy

Continue using procedural graphics for flange/nozzle geometry. Extract drawing into a pure renderer-facing function:

```ts
function drawFlange(
  graphics: Phaser.GameObjects.Graphics,
  geometry: FlangeGeometry,
  visualState: FlangeVisualState,
  theme: GameTheme,
): void;
```

Cache geometry or generated textures when profiling shows benefit. Avoid redrawing every tile every frame; redraw only on state changes.

## Responsive layout

- Use Phaser Scale Manager with `RESIZE` or a controlled `FIT` design resolution.
- Recalculate HUD and grid positions on resize/orientation events.
- Respect CSS safe-area insets.
- Enforce a minimum target size near 44 CSS pixels.
- On narrow devices, reduce maximum columns before reducing target size.
- Pause on hidden tab and resume only after user confirmation if the preview phase was interrupted.

## Input

Map all input to semantic commands:

- pointer/touch: select tile;
- arrows/WASD: move focus;
- Enter/Space: activate tile;
- Escape/P: pause;
- R: restart where appropriate;
- M: mute.

Do not attach business rules directly to pointer callbacks. Call a common command handler so keyboard, touch, and automated tests behave identically.

## Persistence

Use versioned local storage:

```ts
interface StoredGameDataV1 {
  schemaVersion: 1;
  bestScore: number;
  highestLevel: number;
  tutorialCompleted: boolean;
  settings: GameSettings;
}
```

Validate stored data before use. Corrupted or unknown versions fall back to defaults without blocking startup.

## Configuration

Runtime configuration may come from query parameters, a global bootstrap object, or host message:

```ts
interface GameRuntimeConfig {
  locale?: 'en' | 'et' | 'ru';
  theme?: 'dark' | 'light' | 'system';
  soundEnabled?: boolean;
  mode?: 'standard' | 'relaxed' | 'expert';
  telemetryEnabled?: boolean;
  hostOrigin?: string;
}
```

Treat all external configuration as untrusted and validate it.

## Build setup

Recommended scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "lint": "eslint .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit"
}
```

Use strict TypeScript, ESLint, Prettier, and lockfile-based reproducible installs.

## Dependency policy

- Pin major versions.
- Use automated dependency update PRs.
- Avoid libraries for trivial helpers.
- Review transitive bundle impact.
- Keep the engine behind small internal abstractions where practical, but do not attempt a generic engine-independent framework.

## Performance budget

- JavaScript compressed: target below 1 MB initially.
- Audio: lazy-load after user starts or enables sound.
- No large raster backgrounds; prefer CSS/procedural rendering.
- Avoid per-frame allocations in update loops.
- Cap device pixel ratio where necessary on high-density mobile screens.

## Error handling

- Install global error and rejected-promise handlers at bootstrap.
- Emit a sanitized `game:error` host event.
- Show a recoverable in-game error screen with restart action.
- Never expose stack traces to normal users.
- Include build version in diagnostic events.