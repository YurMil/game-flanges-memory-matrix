import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { PlayScene } from './scenes/PlayScene';
import { ResultsScene } from './scenes/ResultsScene';
import { measureViewport } from './layout';

export function createGameConfig(
  parent: HTMLElement,
  canvas: HTMLCanvasElement,
): Phaser.Types.Core.GameConfig {
  const automated = Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver);
  const measured = measureViewport(parent);

  return {
    type: automated ? Phaser.CANVAS : Phaser.WEBGL,
    parent,
    canvas,
    backgroundColor: '#070b10',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: measured.width,
      height: measured.height,
      expandParent: false,
    },
    render: {
      antialias: true,
      roundPixels: true,
      powerPreference: 'high-performance',
      // preserveDrawingBuffer helps Playwright canvas capture; costs GPU memory on devices
      preserveDrawingBuffer: automated,
    },
    // Scenes registered after AdaptiveLayoutService is created (see main.ts).
    scene: [],
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
    },
    audio: {
      noAudio: true,
    },
    banner: false,
  };
}

export function registerScenes(game: Phaser.Game): void {
  game.scene.add('BootScene', BootScene, false);
  game.scene.add('MenuScene', MenuScene, false);
  game.scene.add('PlayScene', PlayScene, false);
  game.scene.add('ResultsScene', ResultsScene, false);
}
