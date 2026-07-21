# Architecture Decision Records

## ADR-001 — Use Phaser 3

**Status:** Accepted

Use Phaser 3 as the game engine. It already powers the prototype and provides the required 2D rendering, interaction, scaling, scene lifecycle, timers, tweens, camera effects, and audio. PixiJS would require more custom game infrastructure; Three.js, Babylon.js, and Godot HTML exports are unnecessarily heavy for this product.

## ADR-002 — Use TypeScript and Vite

**Status:** Accepted

Replace the single-file prototype with strict TypeScript modules built by Vite. This supports fast development, static production output, deterministic builds, code splitting, modern browser targets, and direct integration with testing tools.

## ADR-003 — Keep domain rules independent of Phaser

**Status:** Accepted

Pattern generation, difficulty, scoring, selection validation, statistics, and state transitions must remain pure TypeScript. Phaser scenes consume these rules but do not own them. This makes the core mechanics testable and reduces scene complexity.

## ADR-004 — Use iframe microfrontend integration first

**Status:** Accepted

Publish the game independently and embed it through a sandboxed iframe with a versioned `postMessage` protocol. This gives the strongest style/dependency isolation and simplest independent deployment. Module Federation is deferred until concrete shared-runtime requirements exist.

## ADR-005 — Keep v1 backend-free

**Status:** Accepted

The first release stores scores and settings locally and does not require accounts or a game backend. This minimizes operational cost and allows offline-tolerant gameplay. Global leaderboards and verified scores require a separate security design.

## ADR-006 — Prefer procedural graphics

**Status:** Accepted

Flanges, nozzles, indicators, and most vessel decoration should be drawn procedurally or generated into cached textures. This preserves the prototype’s visual identity, avoids licensing concerns, and keeps asset transfer small.

## ADR-007 — No service worker in v1

**Status:** Accepted

A service worker is not required for a short browser game and can make release propagation and rollback harder. Add one only when installability or true offline use becomes a product requirement.

## ADR process

Create a separate numbered Markdown file when a decision materially affects architecture, deployment, security, data, or public contracts. Include context, options, decision, consequences, and status. Supersede decisions rather than silently rewriting history.