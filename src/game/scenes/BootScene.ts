import Phaser from 'phaser';
import { THEME } from '../rendering/theme';
import { loadPersistence } from '../../app/persistence';
import { getAdaptiveLayout } from '../layout';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const layout = getAdaptiveLayout(this.game);
    const width = layout?.current.width ?? this.scale.width;
    const height = layout?.current.height ?? this.scale.height;
    const titleSize = layout?.layout.titleSize ?? 28;

    this.cameras.main.setBackgroundColor(THEME.bgDeep);

    this.add
      .text(width / 2, height / 2 - 20, 'FLANGES MEMORY MATRIX', {
        fontFamily: THEME.fontDisplay,
        fontSize: `${Math.round(titleSize * 0.65)}px`,
        color: THEME.textAmber,
        fontStyle: '800',
        align: 'center',
        wordWrap: { width: Math.max(200, width - 32) },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 28, 'PRESSURIZING SYSTEMS…', {
        fontFamily: THEME.fontMono,
        fontSize: `${layout?.layout.monoSize ?? 14}px`,
        color: THEME.textDim,
      })
      .setOrigin(0.5);

    loadPersistence();
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene');
    });
  }
}
