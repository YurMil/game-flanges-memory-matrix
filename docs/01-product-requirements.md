# Product Requirements Document

## 1. Product summary

**Flanges Memory Matrix** is a short-session browser game with an industrial pressure-vessel theme. It converts a simple memory-matrix prototype into a polished game that can run independently and as a microfrontend within `cadautoscript.com`.

The player observes a matrix of closed flange covers. A subset briefly opens. After the covers close, the player must select exactly the previously opened nozzles. Correct choices stabilize the vessel; incorrect choices increase the failure state and consume a life.

## 2. Product goals

1. Deliver a complete, replayable game with sessions lasting 2–10 minutes.
2. Preserve the prototype’s engineering identity while improving clarity, progression, responsiveness, and feedback.
3. Support modern desktop and mobile browsers without installation.
4. Integrate into the host platform without coupling the game release cycle to the main application.
5. Keep the core game fully client-side and inexpensive to host.
6. Provide a maintainable foundation for additional engineering-themed mini-games.

## 3. Non-goals for version 1

- Real pressure-vessel simulation or engineering calculation.
- Multiplayer synchronization.
- User-generated levels.
- Native mobile applications.
- Mandatory account registration.
- Advertising, payments, or purchasable content.
- Heavy 3D rendering.

## 4. Target users

### Primary

- Engineers, CAD users, students, and visitors of `cadautoscript.com`.
- Players who prefer short, skill-based browser games.

### Secondary

- Training or marketing audiences using the game as an engineering-themed engagement tool.
- Internal platform developers who will reuse its microfrontend conventions.

## 5. Core user stories

- As a visitor, I can start playing immediately without registration.
- As a player, I can clearly understand which flanges I must memorize.
- As a mobile player, I can select every tile reliably with touch.
- As a keyboard user, I can play without a mouse.
- As a returning player, I can see my local best score and settings.
- As a platform host, I can receive game lifecycle and score events.
- As a platform administrator, I can deploy or roll back the game independently.
- As a developer, I can test the game rules without rendering Phaser scenes.

## 6. Functional requirements

### FR-01 Game start

The game shall provide a start screen with a concise explanation, start action, settings, and best score.

### FR-02 Pattern generation

The game shall generate a unique set of target cells for each round. Pattern generation shall support a seeded random source for testing and future daily challenges.

### FR-03 Preview phase

Target flanges shall be visibly opened or highlighted for a configured period. Input shall be disabled during preview.

### FR-04 Recall phase

After preview, all flanges shall return to a neutral closed state and input shall become active.

### FR-05 Selection rules

A correct selection shall open the selected flange and remain selected. Duplicate selection shall be ignored. An incorrect selection shall end the current attempt immediately unless an alternative forgiving mode is enabled later.

### FR-06 Round completion

Selecting all target cells without error shall complete the round, update score and streak, and begin the next round.

### FR-07 Failure and lives

A failed round shall reveal the correct pattern, reduce remaining integrity/lives, and either retry at the current level or end the run.

### FR-08 Difficulty

Difficulty shall increase using explicit configuration rather than scattered modulo conditions. It may adjust:

- grid dimensions;
- target count;
- preview duration;
- distraction effects;
- allowed errors;
- transition speed.

### FR-09 Scoring

The score shall account for level, target count, speed, accuracy, streak, and optional difficulty modifiers. The exact formula shall be deterministic and documented.

### FR-10 Pause and restart

The player shall be able to pause, resume, restart, mute, and return to the menu.

### FR-11 Persistence

The browser shall store best score, settings, completed tutorial state, and optional statistics using versioned local storage.

### FR-12 Localization

All user-facing text shall be externalized. Version 1 shall support English, Estonian, and Russian.

### FR-13 Host integration

The game shall emit typed events for ready, started, paused, resumed, level completed, game over, score changed, error, and navigation request.

### FR-14 Standalone mode

The game shall operate correctly when opened directly, without a host platform.

### FR-15 Responsive behavior

The matrix and HUD shall adapt to portrait and landscape viewports, including browser UI and safe-area insets.

## 7. Non-functional requirements

### Performance

- Initial compressed transfer target: below 1.5 MB excluding optional audio.
- First interactive target on a typical broadband connection: under 3 seconds.
- Stable 60 FPS on mainstream desktop hardware and 30–60 FPS on supported mobile devices.
- No unbounded timers, listeners, tweens, or scene objects after restart.

### Compatibility

Support the current and previous major versions of Chrome, Edge, Firefox, and Safari. Graceful degradation is required when WebGL is unavailable; Phaser canvas rendering may be used.

### Reliability

- A gameplay session shall not depend on a backend connection.
- Invalid stored data shall be discarded safely.
- Host communication failures shall not stop standalone gameplay.

### Maintainability

- TypeScript strict mode.
- Domain rules independent of Phaser.
- Automated formatting, linting, unit tests, and browser tests.
- Documented public integration contract.

### Observability

Production builds shall expose a build version and optionally report anonymized technical events through the host. Telemetry shall be disabled by default unless the platform provides consent and configuration.

## 8. Success metrics

- At least 80% of started sessions reach level 3 during usability testing.
- Fewer than 2% of sessions produce an uncaught error.
- Median restart-to-play time under 2 seconds.
- No critical accessibility violations in automated scans.
- Lighthouse performance score target of 90 or above for the standalone page.

## 9. Release acceptance criteria

Version 1 is releasable when:

1. All mandatory functional requirements pass automated or manual acceptance tests.
2. Desktop and mobile layouts pass the supported-browser matrix.
3. Host events are validated in both embedded and standalone modes.
4. Keyboard-only play is complete.
5. Localization contains no missing keys.
6. Production build contains source maps according to the selected error-reporting policy.
7. Deployment and rollback are documented and tested.