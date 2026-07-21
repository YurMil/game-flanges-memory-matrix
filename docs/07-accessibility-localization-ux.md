# Accessibility, Localization, and UX

## Accessibility principles

The game should be playable by mouse, touch, and keyboard. Canvas rendering does not remove the obligation to make surrounding controls and status understandable.

### Keyboard

- Provide a visible logical focus cursor on the grid.
- Arrow keys or WASD move between cells.
- Enter or Space activates the focused cell.
- Escape or P opens pause.
- Focus never becomes trapped outside an intentional modal.
- Menu and settings controls use semantic HTML where practical.

### Touch

- Maintain targets near or above 44×44 CSS pixels.
- Avoid gestures requiring precision or multi-touch.
- Do not place critical controls in mobile safe areas.
- Prevent accidental page scrolling while interacting with the game canvas, without blocking normal navigation outside the game.

### Color and state

Color must not be the only signal:

- preview: yellow plus open aperture/pulse;
- selected: open geometry plus check marker;
- failure: red plus warning icon/shake/outline;
- success: green plus safe icon/steady glow.

### Motion

When reduced motion is requested:

- remove camera shake;
- replace spinning/retracting covers with short fades or state changes;
- avoid continuous pulsing;
- keep timing and gameplay difficulty unchanged unless relaxed mode is selected separately.

### Audio

- Audio is supplemental, never the only feedback.
- Start audio only after user gesture.
- Persist mute setting.
- Do not autoplay music.

## Canvas accessibility approach

Use DOM for menu, settings, pause, and results when this improves semantics. For the grid, provide a hidden or off-canvas semantic representation synchronized with the focused cell and current phase where feasible. At minimum, announce:

- current level;
- preview/recall phase;
- grid coordinates of keyboard focus;
- correct selection count;
- remaining integrity;
- round result.

Do not announce the target pattern during preview in a way that defeats the memory mechanic unless an explicit assistive mode is enabled.

## Localization

Version 1 locales:

- `en` — English;
- `et` — Estonian;
- `ru` — Russian.

All strings use stable keys:

```json
{
  "menu.title": "Flanges Memory Matrix",
  "menu.start": "Start",
  "hud.level": "Pressure level: {level}",
  "round.preview": "Memorize the open nozzles",
  "round.recall": "Open the remembered nozzles"
}
```

Requirements:

- no concatenated sentences;
- plural rules through an i18n library or `Intl.PluralRules`;
- locale-aware number formatting;
- enough layout room for text expansion;
- fallback to English for missing keys in development, but CI must fail on missing production keys;
- host-provided locale validated against supported values.

## UX flow

### First visit

1. Main menu.
2. One-screen explanation.
3. Interactive tutorial.
4. Standard game.
5. Results with replay.

### Returning visit

1. Main menu with best score and last-selected mode.
2. Start in one action.

## Copy style

Use concise operational language but avoid suggesting real engineering instructions. Recommended terminology:

- `Open the remembered nozzles` rather than `Execute safety procedure`.
- `Integrity` or `pressure status` rather than claims about actual vessel safety.
- Include a small notice in About: `This is a fictional memory game, not an engineering operating procedure.`

## Responsive UX

- Desktop landscape: HUD above or beside centered matrix.
- Mobile portrait: compact HUD above matrix; controls below.
- Mobile landscape: HUD at side where space permits.
- Never shrink text or targets to unreadable sizes to preserve an arbitrary grid.
- Pause automatically when the page becomes hidden during preview; restart that round or re-preview on resume to preserve fairness.