import Phaser from 'phaser';
import { MODES, type GameModeId } from '../../domain/types';
import { loadPersistence, savePersistence } from '../../app/persistence';
import {
  getAdaptiveLayout,
  type LayoutTokens,
  type ViewportProfile,
} from '../layout';
import { THEME } from '../rendering/theme';
import { drawShimmerScanline, drawVesselBackground } from '../rendering/vesselBackground';
import { createAdaptiveButton, type AdaptiveButton } from '../ui/AdaptiveButton';

export class MenuScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics;
  private shimmer!: Phaser.GameObjects.Graphics;
  private mode: GameModeId = 'standard';
  private best = 0;

  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private blurb!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private tips!: Phaser.GameObjects.Text;
  private startBtn!: AdaptiveButton;
  private modeBtn!: AdaptiveButton;
  private unsubscribe: (() => void) | null = null;
  private shimmerEvent: Phaser.Time.TimerEvent | null = null;
  private onCycleMode = (): void => this.cycleMode();
  private lastVesselKey = '';

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const data = loadPersistence();
    this.mode = data.mode;
    this.best = data.bestScore;

    this.bg = this.add.graphics().setDepth(-2);
    this.shimmer = this.add.graphics().setDepth(-1);

    this.title = this.add.text(0, 0, 'FLANGES', {
      fontFamily: THEME.fontDisplay,
      color: THEME.textAmber,
      fontStyle: '800',
    }).setOrigin(0.5);

    this.subtitle = this.add.text(0, 0, 'MEMORY MATRIX', {
      fontFamily: THEME.fontDisplay,
      color: THEME.text,
      fontStyle: '700',
    }).setOrigin(0.5);

    this.blurb = this.add
      .text(0, 0, 'Memorize open nozzles.\nRelease pressure before integrity fails.', {
        fontFamily: THEME.fontMono,
        color: THEME.textDim,
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    this.bestText = this.add
      .text(0, 0, `BEST  ${this.best}`, {
        fontFamily: THEME.fontDisplay,
        color: THEME.text,
        fontStyle: '700',
      })
      .setOrigin(0.5);

    this.modeText = this.add
      .text(0, 0, this.modeLabel(), {
        fontFamily: THEME.fontMono,
        color: THEME.textDim,
      })
      .setOrigin(0.5);

    this.startBtn = createAdaptiveButton(this, 'START RUN', THEME.textAmber, () => {
      this.startGame();
    });
    this.modeBtn = createAdaptiveButton(this, 'CYCLE MODE', THEME.text, () => {
      this.cycleMode();
    });

    this.tips = this.add
      .text(0, 0, '', {
        fontFamily: THEME.fontMono,
        color: THEME.textDim,
        align: 'center',
        wordWrap: { width: 280 },
      })
      .setOrigin(0.5);

    const layout = getAdaptiveLayout(this.game);
    if (!layout) {
      throw new Error('AdaptiveLayoutService missing — create it in main.ts before scenes run');
    }
    this.unsubscribe = layout.subscribe((profile, tokens) => {
      this.applyLayout(profile, tokens);
    });

    this.shimmerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        drawShimmerScanline(
          this.shimmer,
          this.scale.width,
          this.scale.height,
          this.time.now,
        );
      },
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-M', this.onCycleMode);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.shimmerEvent?.remove(false);
      this.shimmerEvent = null;
      this.input.keyboard?.off('keydown-M', this.onCycleMode);
    });
  }

  private applyLayout(profile: ViewportProfile, tokens: LayoutTokens): void {
    const { width, height, isCompact } = profile;
    const cx = width / 2;
    const m = tokens.menu;

    const vesselKey = `${width}x${height}:${tokens.vessel.widthRatio}:${tokens.vessel.showPipes}`;
    if (vesselKey !== this.lastVesselKey) {
      this.lastVesselKey = vesselKey;
      drawVesselBackground(this.bg, width, height, {
        vessel: tokens.vessel,
        shimmer: false,
      });
    }
    this.title.setStyle({
      fontFamily: THEME.fontDisplay,
      fontSize: `${tokens.titleSize}px`,
      color: THEME.textAmber,
      fontStyle: '800',
    });
    this.title.setPosition(cx, height * m.titleY);

    this.subtitle.setStyle({
      fontFamily: THEME.fontDisplay,
      fontSize: `${tokens.subtitleSize}px`,
      color: THEME.text,
      fontStyle: '700',
    });
    this.subtitle.setPosition(cx, height * m.titleY + m.subtitleGap);

    const wrapW = Math.max(180, width - tokens.padX * 2);
    this.blurb.setStyle({
      fontFamily: THEME.fontMono,
      fontSize: `${tokens.bodySize}px`,
      color: THEME.textDim,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: wrapW },
    });
    this.blurb.setPosition(cx, height * m.blurbY);

    this.bestText.setStyle({
      fontFamily: THEME.fontDisplay,
      fontSize: `${tokens.buttonSize}px`,
      color: THEME.text,
      fontStyle: '700',
    });
    this.bestText.setPosition(cx, height * m.bestY);

    this.modeText.setStyle({
      fontFamily: THEME.fontMono,
      fontSize: `${tokens.monoSize}px`,
      color: THEME.textDim,
      wordWrap: { width: wrapW },
      align: 'center',
    });
    this.modeText.setText(this.modeLabel());
    this.modeText.setPosition(cx, height * m.modeY);

    this.startBtn.layout(cx, height * m.startY, tokens, THEME.textAmber);
    this.modeBtn.layout(cx, height * m.cycleY, tokens, THEME.text);

    this.tips.setText(
      isCompact
        ? 'Tap flanges  ·  P pause  ·  F fullscreen'
        : 'Click / tap flanges  ·  Arrows + Enter  ·  P pause  ·  F fullscreen',
    );
    this.tips.setStyle({
      fontFamily: THEME.fontMono,
      fontSize: `${Math.max(10, tokens.monoSize - 1)}px`,
      color: THEME.textDim,
      align: 'center',
      wordWrap: { width: wrapW },
    });
    this.tips.setPosition(cx, height * m.tipsY - profile.insets.bottom * 0.25);
  }

  private modeLabel(): string {
    const m = MODES[this.mode];
    return `MODE  ${m.label}   ·   LIVES ${m.lives}`;
  }

  private cycleMode(): void {
    const order: GameModeId[] = ['standard', 'relaxed', 'expert'];
    const idx = order.indexOf(this.mode);
    this.mode = order[(idx + 1) % order.length];
    const data = loadPersistence();
    data.mode = this.mode;
    savePersistence(data);
    this.modeText.setText(this.modeLabel());
  }

  private startGame(): void {
    this.scene.start('PlayScene', { mode: this.mode });
  }
}
