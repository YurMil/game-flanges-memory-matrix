import Phaser from 'phaser';
import { createGameConfig, registerScenes } from './game/phaserConfig';
import { createAdaptiveLayout } from './game/layout';
import { isEmbeddedInHost, isHostStaticEntry } from './app/embed';
import type { PlayScene } from './game/scenes/PlayScene';

const root = document.getElementById('game-root');
const canvas = document.getElementById('game-canvas');

if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Missing #game-root or #game-canvas');
}

const embedded = isEmbeddedInHost() || isHostStaticEntry();
document.body.dataset.embedded = embedded ? '1' : '0';
document.documentElement.classList.toggle('is-embedded', embedded);

const game = new Phaser.Game(createGameConfig(root, canvas));

// Layout must exist before any scene create() — measures #game-root (iframe box).
const layout = createAdaptiveLayout(game, root);
registerScenes(game);
game.scene.start('BootScene');

(window as unknown as { __LAYOUT__: typeof layout }).__LAYOUT__ = layout;
(window as unknown as { __EMBEDDED__: boolean }).__EMBEDDED__ = embedded;

function toggleFullscreen(): void {
  // On cadautoscript.com the MiniGameShellPage owns fullscreen (CSS stage).
  // Nested browser fullscreen inside the iframe fights the shell — skip when embedded.
  if (embedded) return;

  const el = document.getElementById('game-root');
  if (!(el instanceof HTMLElement)) return;
  if (!document.fullscreenElement) {
    void el.requestFullscreen?.();
  } else {
    void document.exitFullscreen?.();
  }
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'f' || event.key === 'F') {
    if (embedded) return;
    event.preventDefault();
    toggleFullscreen();
  }
});

(window as unknown as { advanceTime: (ms: number) => void }).advanceTime = (ms: number) => {
  const play = game.scene.getScene('PlayScene') as PlayScene | null;
  if (play?.scene.isActive() && typeof play.advance === 'function') {
    play.advance(ms);
    return;
  }
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    game.step(0, 1000 / 60);
  }
};

(window as unknown as { render_game_to_text: () => string }).render_game_to_text = () => {
  const play = game.scene.getScene('PlayScene') as PlayScene | null;
  if (play?.scene.isActive()) {
    return JSON.stringify(play.getDebugSnapshot());
  }

  const menu = game.scene.isActive('MenuScene');
  const boot = game.scene.isActive('BootScene');
  const results = game.scene.isActive('ResultsScene');
  const profile = layout.current;
  return JSON.stringify({
    coordinateSystem: 'origin top-left, x right, y down',
    scene: boot ? 'BootScene' : menu ? 'MenuScene' : results ? 'ResultsScene' : 'unknown',
    embedded,
    layout: {
      breakpoint: profile.breakpoint,
      orientation: profile.orientation,
      width: profile.width,
      height: profile.height,
      isCompact: profile.isCompact,
    },
  });
};

(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;

export {};
