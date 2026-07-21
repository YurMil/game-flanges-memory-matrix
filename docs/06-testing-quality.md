# Testing and Quality Plan

## Test pyramid

### Unit tests

Use Vitest for pure domain behavior:

- unique pattern generation;
- deterministic seeded output;
- target count bounds;
- difficulty progression;
- score calculation;
- state-machine transitions;
- persistence migration and invalid-data fallback;
- localization key completeness;
- protocol payload validation.

### Integration tests

Test the application layer with a fake clock and fake platform bridge:

- preview to recall transition;
- correct and incorrect selection flows;
- pause/resume behavior;
- restart cancellation;
- game-over statistics;
- host initialization and command handling.

Avoid depending on real animation duration in logic tests.

### End-to-end tests

Use Playwright for:

- standalone boot and start;
- complete known seeded round;
- failure and retry;
- pause and restart;
- persistence after reload;
- keyboard-only play;
- touch/mobile viewport play;
- iframe ready/init handshake;
- locale change from host;
- game-over event payload;
- no uncaught browser errors.

## Browser matrix

Test at minimum:

- Chromium desktop;
- Firefox desktop;
- WebKit desktop;
- Chromium Android-sized viewport with touch;
- Safari iPhone-sized viewport through WebKit emulation;
- portrait and landscape.

Perform periodic real-device checks because emulation does not fully reproduce mobile audio, browser bars, GPU, or touch behavior.

## Accessibility checks

- Automated axe scan for DOM screens.
- Keyboard traversal and activation.
- Visible focus state.
- Screen-reader labels for menu and settings controls.
- Non-color indicators for preview, success, and failure.
- Reduced-motion verification.
- Text contrast review.
- Canvas fallback instructions where semantic gameplay cannot be exposed fully.

## Visual regression

Capture stable screenshots for:

- main menu;
- tutorial;
- 3×3 preview;
- recall state;
- failure reveal;
- success state;
- results screen;
- portrait layout;
- reduced-motion theme.

Disable randomness using fixed seeds and disable nonessential animations for screenshots.

## Performance testing

Track:

- compressed bundle size;
- startup duration;
- frame time during the largest supported grid;
- object count after repeated restarts;
- memory growth after 20 sessions;
- resize/orientation responsiveness;
- mobile high-DPI performance.

The game must not create new event listeners on every round without removing them.

## Static quality gates

Every pull request must run:

1. clean dependency install;
2. formatting check;
3. ESLint;
4. TypeScript strict typecheck;
5. unit/integration tests with coverage report;
6. production build;
7. Playwright smoke test;
8. dependency and secret scanning where available.

## Coverage guidance

Coverage is a signal, not the target. Aim for high branch coverage in domain rules and protocol validation. Phaser rendering code should be covered mainly through focused integration and browser tests rather than brittle line-coverage goals.

## Manual exploratory checklist

- Rapid repeated clicks during transitions.
- Browser tab hidden during preview and recall.
- Resize during every state.
- Orientation change on mobile.
- Restart while a delayed callback is pending.
- Mute/unmute before and after audio starts.
- Corrupted local storage.
- Missing host handshake.
- Unexpected or malicious host messages.
- Very small and very wide viewports.
- Long localized text.

## Defect severity

- **Critical:** game cannot start, data/security issue, host page broken.
- **High:** core loop cannot complete, repeated crash, controls inaccessible.
- **Medium:** scoring/layout/audio defect with workaround.
- **Low:** cosmetic issue not affecting comprehension.

No critical or high defects may remain open at release.