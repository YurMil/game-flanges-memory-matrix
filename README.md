# Flanges Memory Matrix

A browser-based engineering memory game derived from the original `cadautoscript.com` prototype. The player memorizes which vessel nozzles are open, then safely reproduces the pattern before pressure reaches a critical state.

This repository currently contains the product and engineering documentation package for converting the prototype into a maintainable, production-ready microfrontend game.

## Recommended implementation

- **Language:** TypeScript
- **Build tool:** Vite
- **Game engine:** Phaser 3
- **UI shell:** lightweight DOM/CSS or React only for platform-level UI outside the canvas
- **Testing:** Vitest + Playwright
- **Deployment:** static assets hosted independently and embedded into `cadautoscript.com`
- **Primary integration:** route-mounted microfrontend or sandboxed iframe with a typed `postMessage` contract

Phaser is retained because the prototype already uses it effectively, the game is 2D and interaction-heavy, procedural graphics eliminate the need for a large asset pipeline, and Phaser provides mature input, scaling, timing, scene, animation, camera, and audio systems without the overhead of a 3D engine.

## Documentation

- [Product requirements](docs/01-product-requirements.md)
- [Game design document](docs/02-game-design-document.md)
- [Technical architecture](docs/03-technical-architecture.md)
- [Microfrontend integration](docs/04-microfrontend-integration.md)
- [Implementation plan](docs/05-implementation-plan.md)
- [Testing and quality plan](docs/06-testing-quality.md)
- [Accessibility, localization, and UX](docs/07-accessibility-localization-ux.md)
- [Deployment and operations](docs/08-deployment-operations.md)
- [Security and privacy](docs/09-security-privacy.md)
- [Decision records](docs/adr/README.md)

## Prototype source

The reference prototype is located in:

`YurMil/cadautoscript.com/static/mini-games/flanges-memory-matrix/app.html`

Its core mechanics are retained:

1. Show a matrix of blind flanges.
2. Temporarily reveal a random subset as open nozzles.
3. Hide the pattern.
4. Let the player select the remembered nozzles.
5. Complete the level on a correct pattern or lose pressure integrity on an incorrect selection.
6. Increase matrix size and memory load as levels progress.

## Target repository structure

```text
src/
  app/
    bootstrap.ts
    platformBridge.ts
  game/
    config.ts
    scenes/
      BootScene.ts
      MenuScene.ts
      PlayScene.ts
      ResultsScene.ts
    systems/
      DifficultySystem.ts
      PatternGenerator.ts
      ScoreSystem.ts
      SessionState.ts
    objects/
      FlangeTile.ts
    rendering/
      drawFlange.ts
    audio/
      AudioManager.ts
  domain/
    types.ts
    rules.ts
  i18n/
  styles/
  main.ts
public/
tests/
  unit/
  e2e/
docs/
```

## Initial delivery scope

The first production release should include:

- responsive desktop and mobile play;
- keyboard, mouse, and touch input;
- deterministic difficulty progression;
- score, streak, accuracy, and best-score persistence;
- pause/restart controls;
- sound and reduced-motion settings;
- English, Estonian, and Russian localization;
- integration events for the host platform;
- automated unit and end-to-end tests;
- static deployment with immutable assets and rollback support.

## License

MIT.