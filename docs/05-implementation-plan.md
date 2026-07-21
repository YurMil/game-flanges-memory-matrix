# Implementation Plan

## Delivery strategy

Build the production game in small vertical slices. Each phase must leave the repository runnable and tested.

## Phase 0 — Repository foundation

Deliverables:

- Vite + TypeScript project;
- Phaser dependency and minimal boot scene;
- strict TypeScript configuration;
- ESLint, Prettier, Vitest, Playwright;
- CI workflow for install, typecheck, lint, unit test, build, and e2e smoke test;
- environment and build-version handling;
- contribution and release conventions.

Exit criteria: a blank game boots locally and in CI, and the production bundle is deployable.

## Phase 1 — Prototype migration

Deliverables:

- migrate flange procedural rendering;
- implement responsive grid;
- reproduce preview, recall, success, failure, lives, and restart;
- separate pure pattern generation and difficulty rules from Phaser;
- add deterministic seeded tests;
- remove inline HTML/CSS/JavaScript architecture.

Exit criteria: feature parity with the original prototype on desktop and mobile.

## Phase 2 — Production game loop

Deliverables:

- explicit game state machine;
- menu, tutorial, pause, game-over, and results screens;
- score, streak, timing, and statistics;
- configurable standard, relaxed, and expert modes;
- robust cancellation of timers and tweens;
- local persistence with schema versioning.

Exit criteria: complete replayable session without host integration.

## Phase 3 — UX, audio, and accessibility

Deliverables:

- keyboard navigation and focus indicator;
- touch-target validation;
- reduced-motion mode;
- non-color state indicators;
- sound effects and mute controls;
- English, Estonian, and Russian localization;
- responsive portrait and landscape layouts.

Exit criteria: accessibility and supported-device test matrix passes.

## Phase 4 — Microfrontend integration

Deliverables:

- typed platform bridge;
- origin validation and runtime payload validation;
- ready/init handshake;
- lifecycle, score, error, and navigation events;
- host demo page and embedded Playwright tests;
- standalone fallback.

Exit criteria: game works both directly and within a cross-origin iframe.

## Phase 5 — Release hardening

Deliverables:

- bundle analysis and performance tuning;
- error boundary and recoverable error screen;
- production CSP and security headers;
- immutable asset release structure;
- deployment, smoke-test, and rollback scripts;
- release checklist and changelog.

Exit criteria: release candidate meets acceptance criteria in the PRD.

## Suggested backlog

### Epic A — Foundation

- Initialize Vite/TypeScript/Phaser.
- Configure quality tools.
- Add CI and build metadata.
- Create scene and domain folders.

### Epic B — Core mechanics

- Implement `PatternGenerator`.
- Implement `DifficultySystem`.
- Implement `GameSession` state transitions.
- Implement `FlangeTile` and procedural renderer.
- Implement input command abstraction.

### Epic C — Player experience

- Menu and tutorial.
- HUD and pressure/integrity visualization.
- Score and results.
- Audio and animation feedback.
- Settings and persistence.

### Epic D — Platform

- Message protocol types.
- Host bridge and origin allowlist.
- Embedded development harness.
- Analytics adapter with consent gating.

### Epic E — Quality and release

- Unit tests.
- Scene/component tests where useful.
- Browser and mobile viewport tests.
- Accessibility checks.
- Performance budget checks.
- Deployment and rollback verification.

## Definition of done

A task is done when:

- implementation is typed and reviewed;
- tests cover important behavior and failure cases;
- no user-facing text is hard-coded outside localization files;
- keyboard and touch behavior are considered;
- lifecycle cleanup is verified;
- documentation is updated when contracts change;
- CI passes.

## Branch and release model

- `main` remains releasable.
- Feature branches use short descriptive names.
- Changes enter through pull requests.
- Use semantic version tags.
- Generate a changelog from conventional commits or curated release notes.
- Deploy preview builds for pull requests where available.

## First implementation milestone

The first coding milestone should create:

```text
package.json
vite.config.ts
tsconfig.json
index.html
src/main.ts
src/domain/patternGenerator.ts
src/domain/difficulty.ts
src/game/scenes/PlayScene.ts
src/game/rendering/drawFlange.ts
tests/unit/patternGenerator.test.ts
tests/e2e/smoke.spec.ts
```

It should preserve only the original core loop before adding new features.