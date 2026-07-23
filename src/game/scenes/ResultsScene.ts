import Phaser from 'phaser';
import type { GameModeId } from '../../domain/types';
import {
  getAdaptiveLayout,
  type LayoutTokens,
  type ViewportProfile,
} from '../layout';
import { THEME } from '../rendering/theme';
import { drawVesselBackground } from '../rendering/vesselBackground';
import { createAdaptiveButton, type AdaptiveButton } from '../ui/AdaptiveButton';

interface ResultsData {
  score: number;
  level: number;
  streak: number;
  accuracy: number;
  best: number;
  isNewBest: boolean;
  mode: GameModeId;
}

export class ResultsScene extends Phaser.Scene {
  private results!: ResultsData;
  private bg!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private badge!: Phaser.GameObjects.Text;
  private lines: Phaser.GameObjects.Text[] = [];
  private playBtn!: AdaptiveButton;
  private menuBtn!: AdaptiveButton;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super('ResultsScene');
  }

  init(data: ResultsData): void {
    this.results = data;
  }

  create(): void {
    this.bg = this.add.graphics();
    const d = this.results;

    this.title = this.add
      .text(0, 0, 'RUN COMPLETE', {
        fontFamily: THEME.fontDisplay,
        color: THEME.textAmber,
        fontStyle: '800',
      })
      .setOrigin(0.5);

    this.badge = this.add
      .text(0, 0, d.isNewBest ? 'NEW BEST SCORE' : '', {
        fontFamily: THEME.fontMono,
        color: '#3dd68c',
      })
      .setOrigin(0.5)
      .setAlpha(d.isNewBest ? 1 : 0);

    const lineValues = [
      `SCORE          ${d.score}`,
      `BEST           ${d.best}`,
      `HIGHEST LEVEL  ${d.level}`,
      `LONGEST STREAK ${d.streak}`,
      `ACCURACY       ${d.accuracy}%`,
      `MODE           ${d.mode.toUpperCase()}`,
    ];
    this.lines = lineValues.map((line) =>
      this.add
        .text(0, 0, line, {
          fontFamily: THEME.fontMono,
          color: THEME.text,
        })
        .setOrigin(0.5),
    );

    this.playBtn = createAdaptiveButton(this, 'PLAY AGAIN', THEME.textAmber, () => {
      this.scene.start('PlayScene', { mode: d.mode });
    });
    this.menuBtn = createAdaptiveButton(this, 'MAIN MENU', THEME.text, () => {
      this.scene.start('MenuScene');
    });

    const layout = getAdaptiveLayout(this.game);
    if (!layout) {
      throw new Error('AdaptiveLayoutService missing — create it in main.ts before scenes run');
    }
    this.unsubscribe = layout.subscribe((profile, tokens) => {
      this.applyLayout(profile, tokens);
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('PlayScene', { mode: d.mode });
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
    });
  }

  private applyLayout(profile: ViewportProfile, tokens: LayoutTokens): void {
    const { width, height } = profile;
    const cx = width / 2;
    const r = tokens.results;
    const wrapW = Math.max(180, width - tokens.padX * 2);

    drawVesselBackground(this.bg, width, height, {
      timeMs: 0,
      vessel: tokens.vessel,
    });

    this.title
      .setStyle({
        fontFamily: THEME.fontDisplay,
        fontSize: `${tokens.titleSize * 0.7}px`,
        color: THEME.textAmber,
        fontStyle: '800',
      })
      .setPosition(cx, height * r.titleY);

    this.badge
      .setStyle({
        fontFamily: THEME.fontMono,
        fontSize: `${tokens.monoSize}px`,
        color: '#3dd68c',
      })
      .setPosition(cx, height * r.badgeY);

    this.lines.forEach((text, i) => {
      text
        .setStyle({
          fontFamily: THEME.fontMono,
          fontSize: `${tokens.bodySize}px`,
          color: THEME.text,
          wordWrap: { width: wrapW },
          align: 'center',
        })
        .setPosition(cx, height * r.linesStartY + i * r.lineGap);
    });

    this.playBtn.layout(cx, height * r.playY, tokens, THEME.textAmber);
    this.menuBtn.layout(cx, height * r.menuY, tokens, THEME.text);
  }
}
