# Game Design Document

## Core fantasy

The player is an operator responding to unstable pressure in an industrial vessel. A control sequence briefly reveals the nozzles that must be opened. The operator must remember and reproduce the safe release pattern before the system fails.

The theme is fictionalized. The game is not an operating procedure or engineering training simulator.

## Core loop

1. Enter a level.
2. Observe a pattern of open nozzles.
3. Recall the pattern after all covers close.
4. Select the remembered nozzles.
5. Receive immediate visual and audio feedback.
6. Gain score and advance, or lose integrity and retry/end the run.

A complete loop should normally take 4–12 seconds.

## Game states

- Boot
- Main menu
- Tutorial
- Round introduction
- Pattern preview
- Player recall
- Round success
- Round failure
- Paused
- Game over
- Results

Transitions must be controlled by an explicit finite-state machine. Input handlers must consult the current state rather than relying on loosely coordinated booleans.

## Modes

### Standard

Three integrity points, progressive grid and target count, local high score.

### Relaxed

Longer preview, optional one wrong selection before failure, reduced animation intensity. Suitable for accessibility and first-time players.

### Expert

Shorter preview, larger grids, no lives, score multiplier.

### Daily challenge — post-v1

A deterministic seed creates the same challenge for all players on a given date. The mode remains fully client-side unless global leaderboards are introduced.

## Difficulty model

Use a data-driven table or function returning a `RoundConfig`:

```ts
interface RoundConfig {
  level: number;
  rows: number;
  columns: number;
  targetCount: number;
  previewMs: number;
  settleMs: number;
  successDelayMs: number;
  scoreMultiplier: number;
}
```

Suggested standard curve:

| Levels | Grid | Targets | Preview |
|---|---:|---:|---:|
| 1–2 | 3×3 | 3–4 | 1800–1600 ms |
| 3–5 | 4×4 | 4–6 | 1500–1300 ms |
| 6–9 | 5×5 | 6–9 | 1250–1050 ms |
| 10–14 | 6×6 | 8–12 | 1000–850 ms |
| 15+ | up to 8×8 | capped near 40% | minimum 700 ms |

The curve must be tuned through playtesting. Grid growth should never make touch targets smaller than the minimum usable size; on small screens, scrolling is forbidden, so difficulty may increase through target count and timing instead of grid dimensions.

## Scoring

Recommended deterministic formula:

```text
base = 100 × targetCount × level
speedBonus = max(0, recallLimitMs - recallTimeMs) / 10
streakMultiplier = 1 + min(streak, 10) × 0.05
modeMultiplier = configured mode value
roundScore = round((base + speedBonus) × streakMultiplier × modeMultiplier)
```

Do not reward rapid random tapping. The recall timer starts only when input becomes active, and incorrect input ends the round.

## Feedback design

### Correct selection

- cover rotates or retracts;
- nozzle opens;
- short metallic confirmation sound;
- subtle score pulse;
- no camera shake.

### Incorrect selection

- selected flange turns red;
- correct missing targets are revealed in yellow;
- short camera shake, disabled under reduced motion;
- pressure/integrity indicator decreases;
- distinct warning sound.

### Success

- all correct nozzles receive green rim lighting;
- pressure gauge returns toward safe range;
- score and streak animate once;
- next round starts quickly.

## Visual direction

- Industrial steel vessel background.
- High-contrast flange silhouettes.
- Safety yellow for preview/instruction.
- Green for confirmed safe state.
- Red for failure only.
- Avoid using color as the sole state indicator: also use shape, icon, outline, label, or animation.
- Prefer procedural vectors for flange geometry; optional textures should be lightweight and decorative.

## Audio direction

Optional audio includes cover movement, metallic click, pressure release, warning alarm, success pulse, and menu actions. Audio starts only after user interaction. Provide separate mute controls for effects and music; v1 may omit music.

## Tutorial

The tutorial uses a fixed 2×2 or 3×3 pattern:

1. Explain that yellow/open nozzles must be remembered.
2. Preview two targets.
3. Prompt the player to select them.
4. Demonstrate an incorrect state only through a non-punitive example.
5. Start level 1.

The tutorial can be skipped and is stored as completed locally.

## Session end

The results screen shows:

- score;
- highest level;
- accuracy;
- longest streak;
- previous best and new-best status;
- replay and exit actions.

## Anti-frustration rules

- Never generate duplicate target cells.
- Do not accept input before preview fully ends.
- Do not carry stale selections into a new round.
- Do not punish clicks during transitions.
- Keep the selected state visible.
- Reveal the complete correct solution after failure.
- Ensure restart cancels all prior delayed callbacks and tweens.

## Future extensions

- flange types with distinct silhouettes;
- ordered-sequence mode;
- moving or rotating vessel layouts;
- achievements;
- platform profiles and leaderboards;
- engineering trivia between stages;
- reusable mini-game SDK shared across `cadautoscript.com`.