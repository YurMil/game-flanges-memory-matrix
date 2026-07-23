import Phaser from 'phaser';
import { getRoundConfig } from '../../domain/difficulty';
import { generatePattern } from '../../domain/patternGenerator';
import { accuracyPercent, scoreRound } from '../../domain/scoring';
import {
  MODES,
  type GameModeId,
  type PlayState,
  type RoundConfig,
} from '../../domain/types';
import { loadPersistence, updateBestScore } from '../../app/persistence';
import { getAdaptiveLayout, type LayoutTokens } from '../layout';
import { FlangeTile } from '../objects/FlangeTile';
import { FocusCursor } from '../objects/FocusCursor';
import { THEME } from '../rendering/theme';
import {
  drawPressureGauge,
  drawVesselBackground,
} from '../rendering/vesselBackground';

interface PlaySceneData {
  mode?: GameModeId;
}

export class PlayScene extends Phaser.Scene {
  private mode: GameModeId = 'standard';
  private state: PlayState = 'idle';
  private level = 1;
  private score = 0;
  private streak = 0;
  private longestStreak = 0;
  private lives = 3;
  private correctSelections = 0;
  private totalSelections = 0;
  private mistakeForgiven = false;

  private roundToken = 0;
  private roundConfig!: RoundConfig;
  private targets = new Set<string>();
  private selected = new Set<string>();
  private tiles: FlangeTile[] = [];
  private focusIndex = 0;
  private recallStartedAt = 0;

  private bg!: Phaser.GameObjects.Graphics;
  private gaugeGfx!: Phaser.GameObjects.Graphics;
  private hudLevel!: Phaser.GameObjects.Text;
  private hudScore!: Phaser.GameObjects.Text;
  private hudStreak!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private focusCursor!: FocusCursor;
  private pressure = 0.35;
  private lastDrawnPressure = -1;
  private gaugeDirty = true;
  private unsubscribeLayout: (() => void) | null = null;

  constructor() {
    super('PlayScene');
  }

  init(data: PlaySceneData): void {
    this.mode = data.mode ?? loadPersistence().mode ?? 'standard';
    this.lives = MODES[this.mode].lives;
    this.level = 1;
    this.score = 0;
    this.streak = 0;
    this.longestStreak = 0;
    this.correctSelections = 0;
    this.totalSelections = 0;
    this.mistakeForgiven = false;
    this.state = 'idle';
    this.roundToken += 1;
  }

  create(): void {
    this.bg = this.add.graphics();
    this.gaugeGfx = this.add.graphics();
    this.focusCursor = new FocusCursor(this);
    this.focusCursor.hide();

    this.hudLevel = this.makeHud(0, 0, 'LVL 1');
    this.hudScore = this.makeHud(0, 0, 'SCORE 0').setOrigin(0.5, 0);
    this.hudStreak = this.makeHud(0, 0, 'STREAK 0').setOrigin(1, 0);
    this.hudLives = this.makeHud(0, 0, this.livesLabel());
    this.statusText = this.add
      .text(0, 0, '', {
        fontFamily: THEME.fontMono,
        fontSize: '14px',
        color: THEME.textAmber,
      })
      .setOrigin(0.5, 0);

    this.overlayText = this.add
      .text(0, 0, '', {
        fontFamily: THEME.fontDisplay,
        fontSize: '28px',
        color: THEME.textAmber,
        fontStyle: '800',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);

    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    this.input.keyboard?.on('keydown-P', this.togglePause, this);
    this.input.keyboard?.on('keydown-R', this.restartRun, this);
    this.input.keyboard?.on('keydown-LEFT', this.onKeyLeft, this);
    this.input.keyboard?.on('keydown-RIGHT', this.onKeyRight, this);
    this.input.keyboard?.on('keydown-UP', this.onKeyUp, this);
    this.input.keyboard?.on('keydown-DOWN', this.onKeyDown, this);
    this.input.keyboard?.on('keydown-A', this.onKeyLeft, this);
    this.input.keyboard?.on('keydown-D', this.onKeyRight, this);
    this.input.keyboard?.on('keydown-W', this.onKeyUp, this);
    this.input.keyboard?.on('keydown-S', this.onKeyDown, this);
    this.input.keyboard?.on('keydown-ENTER', this.activateFocus, this);
    this.input.keyboard?.on('keydown-SPACE', this.activateFocus, this);

    // Continuous pointer / finger tracking across the playfield
    this.input.on('pointermove', this.onPointerMove, this);

    const adaptive = getAdaptiveLayout(this.game);
    if (!adaptive) {
      throw new Error('AdaptiveLayoutService missing — create it in main.ts before scenes run');
    }
    this.unsubscribeLayout = adaptive.subscribe(() => this.reflow());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', this.onPointerMove, this);
      this.input.keyboard?.off('keydown-ESC', this.togglePause, this);
      this.input.keyboard?.off('keydown-P', this.togglePause, this);
      this.input.keyboard?.off('keydown-R', this.restartRun, this);
      this.input.keyboard?.off('keydown-LEFT', this.onKeyLeft, this);
      this.input.keyboard?.off('keydown-RIGHT', this.onKeyRight, this);
      this.input.keyboard?.off('keydown-UP', this.onKeyUp, this);
      this.input.keyboard?.off('keydown-DOWN', this.onKeyDown, this);
      this.input.keyboard?.off('keydown-A', this.onKeyLeft, this);
      this.input.keyboard?.off('keydown-D', this.onKeyRight, this);
      this.input.keyboard?.off('keydown-W', this.onKeyUp, this);
      this.input.keyboard?.off('keydown-S', this.onKeyDown, this);
      this.input.keyboard?.off('keydown-ENTER', this.activateFocus, this);
      this.input.keyboard?.off('keydown-SPACE', this.activateFocus, this);
      this.unsubscribeLayout?.();
      this.unsubscribeLayout = null;
      this.focusCursor.destroy();
      this.clearTiles();
    });

    this.startRound();
  }

  private onKeyLeft = (): void => this.moveFocus(-1, 0);
  private onKeyRight = (): void => this.moveFocus(1, 0);
  private onKeyUp = (): void => this.moveFocus(0, -1);
  private onKeyDown = (): void => this.moveFocus(0, 1);

  update(_time: number, delta: number): void {
    this.focusCursor.update(delta);
    if (this.state === 'preview' || this.state === 'recall') {
      const drift = this.state === 'preview' ? 0.00004 : 0.00009;
      const next = Phaser.Math.Clamp(this.pressure + drift * delta, 0.2, 0.92);
      if (Math.abs(next - this.pressure) > 0.0005) {
        this.pressure = next;
        this.gaugeDirty = true;
      }
      this.drawGauge();
    }
  }

  /** Deterministic step for automated tests. */
  advance(ms: number): void {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) {
      this.game.step(0, 1000 / 60);
    }
  }

  getDebugSnapshot(): Record<string, unknown> {
    const layout = getAdaptiveLayout(this.game)?.current;
    return {
      coordinateSystem: 'origin top-left, x right, y down, tile keys row:col',
      mode: this.mode,
      state: this.state,
      level: this.level,
      score: this.score,
      streak: this.streak,
      lives: this.lives,
      pressure: Number(this.pressure.toFixed(3)),
      focusIndex: this.focusIndex,
      focusCursor: this.focusCursor.position,
      rows: this.roundConfig?.rows ?? 0,
      columns: this.roundConfig?.columns ?? 0,
      targets: [...this.targets],
      selected: [...this.selected],
      tiles: this.tiles.map((t) => ({ key: t.key, state: t.state })),
      layout: layout
        ? {
            breakpoint: layout.breakpoint,
            orientation: layout.orientation,
            width: layout.width,
            height: layout.height,
            isCompact: layout.isCompact,
          }
        : null,
    };
  }

  private makeHud(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      fontFamily: THEME.fontDisplay,
      fontSize: '14px',
      color: THEME.text,
      fontStyle: '700',
    });
  }

  private livesLabel(): string {
    return `INTEGRITY  ${'●'.repeat(this.lives)}${'○'.repeat(Math.max(0, MODES[this.mode].lives - this.lives))}`;
  }

  private startRound(): void {
    this.roundToken += 1;
    const token = this.roundToken;
    this.selected.clear();
    this.mistakeForgiven = false;
    this.roundConfig = getRoundConfig(this.level, this.mode);
    const seed = (Date.now() ^ (this.level * 9973) ^ (this.score * 13)) >>> 0;
    this.targets = new Set(
      generatePattern(
        this.roundConfig.rows,
        this.roundConfig.columns,
        this.roundConfig.targetCount,
        seed,
      ),
    );

    this.state = 'round-intro';
    this.pressure = 0.28 + Math.min(0.25, this.level * 0.015);
    this.gaugeDirty = true;
    this.refreshHud();
    this.buildGrid();
    this.showOverlay(`LEVEL ${this.level}`, 450);

    this.time.delayedCall(500, () => {
      if (token !== this.roundToken) return;
      this.beginPreview(token);
    });
  }

  private beginPreview(token: number): void {
    if (token !== this.roundToken) return;
    this.state = 'preview';
    this.focusCursor.hide();
    this.statusText.setText('MEMORIZE OPEN NOZZLES');
    this.statusText.setColor(THEME.textAmber);

    for (const tile of this.tiles) {
      if (this.targets.has(tile.key)) tile.setVisualState('preview', true);
      else tile.setVisualState('closed', false);
    }

    this.time.delayedCall(this.roundConfig.previewMs, () => {
      if (token !== this.roundToken) return;
      this.beginSettle(token);
    });
  }

  private beginSettle(token: number): void {
    if (token !== this.roundToken) return;
    this.state = 'idle';
    this.statusText.setText('CLOSING COVERS…');
    for (const tile of this.tiles) tile.setVisualState('closed', true);

    this.time.delayedCall(this.roundConfig.settleMs, () => {
      if (token !== this.roundToken) return;
      this.beginRecall(token);
    });
  }

  private beginRecall(token: number): void {
    if (token !== this.roundToken) return;
    this.state = 'recall';
    this.recallStartedAt = this.time.now;
    this.statusText.setText('SELECT THE OPENED NOZZLES');
    this.statusText.setColor(THEME.text);
    this.focusCursor.show();
    this.setFocus(0, true);
  }

  private onTileHover(tile: FlangeTile): void {
    if (this.state !== 'recall') return;
    const idx = this.tiles.indexOf(tile);
    if (idx >= 0 && idx !== this.focusIndex) this.setFocus(idx, false);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.state !== 'recall' || this.tiles.length === 0) return;

    let best = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.tiles.length; i += 1) {
      const tile = this.tiles[i];
      const dx = pointer.x - tile.cx;
      const dy = pointer.y - tile.cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const magnet = tile.radius * 1.15;
      if (d < magnet && d < bestDist) {
        bestDist = d;
        best = i;
      }
    }

    if (best >= 0) {
      if (best !== this.focusIndex) this.setFocus(best, false);
      return;
    }

    const approxR = this.tiles[this.focusIndex]?.radius ?? 28;
    this.focusCursor.followPointer(pointer.x, pointer.y, approxR);
  }

  private onTileSelect(tile: FlangeTile): void {
    if (this.state !== 'recall') return;
    // Snap reticle onto the pressed flange
    const idx = this.tiles.indexOf(tile);
    if (idx >= 0) this.setFocus(idx, false);
    if (this.selected.has(tile.key)) return;

    this.totalSelections += 1;
    const isTarget = this.targets.has(tile.key);

    if (isTarget) {
      this.selected.add(tile.key);
      this.correctSelections += 1;
      tile.setVisualState('selected', true);
      this.pulseScore();
      this.pressure = Math.max(0.18, this.pressure - 0.04);
      this.gaugeDirty = true;
      this.drawGauge();

      if (this.selected.size === this.targets.size) {
        this.onSuccess();
      }
      return;
    }

    // Wrong selection
    if (MODES[this.mode].allowOneMistake && !this.mistakeForgiven) {
      this.mistakeForgiven = true;
      tile.setVisualState('wrong', true);
      this.statusText.setText('WARNING — ONE MISTAKE ALLOWED');
      this.statusText.setColor('#ff8a8a');
      this.cameras.main.shake(80, 0.004);
      this.time.delayedCall(350, () => {
        if (this.state === 'recall') tile.setVisualState('closed', true);
      });
      return;
    }

    this.onFailure(tile);
  }

  private onSuccess(): void {
    const token = this.roundToken;
    this.state = 'success';
    this.focusCursor.hide();
    const recallTimeMs = this.time.now - this.recallStartedAt;
    this.streak += 1;
    this.longestStreak = Math.max(this.longestStreak, this.streak);

    const result = scoreRound({
      level: this.level,
      targetCount: this.targets.size,
      recallTimeMs,
      recallLimitMs: this.roundConfig.recallLimitMs,
      streak: this.streak,
      modeMultiplier: this.roundConfig.scoreMultiplier,
    });
    this.score += result.roundScore;
    this.pressure = 0.2;
    this.gaugeDirty = true;
    this.refreshHud();

    for (const tile of this.tiles) {
      if (this.targets.has(tile.key)) tile.setVisualState('correct', true);
    }

    this.statusText.setText(`STABLE  +${result.roundScore}`);
    this.statusText.setColor('#3dd68c');
    this.showOverlay('PRESSURE RELEASED', 550);
    this.cameras.main.flash(180, 61, 214, 140, false, undefined, this);
    this.burstSparks(0x3dd68c);

    this.time.delayedCall(this.roundConfig.successDelayMs, () => {
      if (token !== this.roundToken) return;
      this.level += 1;
      this.startRound();
    });
  }

  private onFailure(wrongTile?: FlangeTile): void {
    const token = this.roundToken;
    this.state = 'failure';
    this.focusCursor.hide();
    this.streak = 0;
    this.lives -= 1;
    this.pressure = 0.95;
    this.gaugeDirty = true;
    this.refreshHud();
    this.cameras.main.shake(160, 0.01);

    if (wrongTile) wrongTile.setVisualState('wrong', true);

    for (const tile of this.tiles) {
      if (this.targets.has(tile.key) && !this.selected.has(tile.key)) {
        tile.setVisualState('missed', true);
      }
    }

    this.statusText.setText('INTEGRITY LOSS');
    this.statusText.setColor('#ff4d4d');
    this.showOverlay(this.lives > 0 ? 'PATTERN FAILED' : 'SYSTEM FAILURE', 700);
    this.burstSparks(0xff4d4d);

    this.time.delayedCall(1200, () => {
      if (token !== this.roundToken) return;
      if (this.lives <= 0) {
        this.endRun();
      } else {
        this.startRound();
      }
    });
  }

  private endRun(): void {
    this.state = 'game-over';
    const best = updateBestScore(this.score);
    this.scene.start('ResultsScene', {
      score: this.score,
      level: this.level,
      streak: this.longestStreak,
      accuracy: accuracyPercent(this.correctSelections, this.totalSelections),
      best,
      isNewBest: this.score >= best && this.score > 0,
      mode: this.mode,
    });
  }

  private buildGrid(): void {
    this.clearTiles();
    const { rows, columns } = this.roundConfig;
    const layout = this.gridLayout(rows, columns);

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const x = layout.originX + c * layout.stride;
        const y = layout.originY + r * layout.stride;
        const tile = new FlangeTile(
          this,
          r,
          c,
          x,
          y,
          layout.radius,
          (t) => this.onTileSelect(t),
          (t) => this.onTileHover(t),
        );
        this.tiles.push(tile);
      }
    }
    this.focusIndex = 0;
    this.focusCursor.hide();
    this.gaugeDirty = true;
    this.drawGauge(true);
  }

  private gridLayout(rows: number, columns: number): {
    originX: number;
    originY: number;
    stride: number;
    radius: number;
  } {
    const tokens = this.tokens();
    const { width, height } = this.scale;
    const top = tokens.hud.statusY + 28;
    const bottom = 20 + (getAdaptiveLayout(this.game)?.current.insets.bottom ?? 0);
    const side = tokens.padX;
    const availableW = Math.max(120, width - side * 2);
    const availableH = Math.max(120, height - top - bottom);
    const stride = Math.min(availableW / columns, availableH / rows);
    const minR = tokens.minTouchTarget * 0.42;
    const radius = Math.max(minR, Math.min(stride * 0.38, availableW / (columns * 2.2)));
    const gridW = stride * (columns - 1);
    const gridH = stride * (rows - 1);
    return {
      originX: width / 2 - gridW / 2,
      originY: top + (availableH - gridH) / 2,
      stride,
      radius,
    };
  }

  private clearTiles(): void {
    for (const tile of this.tiles) tile.destroy();
    this.tiles = [];
  }

  private tokens(): LayoutTokens {
    const adaptive = getAdaptiveLayout(this.game);
    if (!adaptive) {
      throw new Error('AdaptiveLayoutService missing');
    }
    return adaptive.layout;
  }

  private reflow = (): void => {
    this.redrawBg();
    this.layoutHud();

    if (!this.roundConfig) return;
    const { rows, columns } = this.roundConfig;
    const layout = this.gridLayout(rows, columns);
    let i = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const tile = this.tiles[i++];
        if (!tile) continue;
        tile.setPosition(
          layout.originX + c * layout.stride,
          layout.originY + r * layout.stride,
          layout.radius,
        );
      }
    }
    // Keep reticle on the focused flange after resize
    if (this.state === 'recall') this.setFocus(this.focusIndex, true);
    this.gaugeDirty = true;
    this.drawGauge(true);
  };

  private layoutHud(): void {
    const tokens = this.tokens();
    const profile = getAdaptiveLayout(this.game)!.current;
    const { width, height } = profile;
    const gap = tokens.hud.sideGap;
    const top = tokens.padY;

    const hudStyle = {
      fontFamily: THEME.fontDisplay,
      fontSize: `${tokens.hudSize}px`,
      color: THEME.text,
      fontStyle: '700',
    };

    this.hudLevel.setStyle(hudStyle).setPosition(gap, top);
    this.hudScore.setStyle(hudStyle).setPosition(width / 2, top);
    this.hudStreak.setStyle(hudStyle).setPosition(width - gap, top);
    this.hudLives
      .setStyle({
        fontFamily: THEME.fontMono,
        fontSize: `${tokens.monoSize}px`,
        color: THEME.text,
      })
      .setPosition(gap, top + tokens.hudSize + 8);

    this.statusText
      .setStyle({
        fontFamily: THEME.fontMono,
        fontSize: `${tokens.monoSize}px`,
        color: this.statusText.style.color ?? THEME.textAmber,
        wordWrap: { width: Math.max(160, width - gap * 2) },
        align: 'center',
      })
      .setPosition(width / 2, tokens.hud.statusY);

    this.overlayText
      .setStyle({
        fontFamily: THEME.fontDisplay,
        fontSize: `${tokens.overlaySize}px`,
        color: THEME.textAmber,
        fontStyle: '800',
        align: 'center',
        wordWrap: { width: Math.max(160, width - gap * 2) },
      })
      .setPosition(width / 2, height * 0.5);
  }

  private moveFocus(dx: number, dy: number): void {
    if (this.state !== 'recall' || !this.roundConfig) return;
    const cols = this.roundConfig.columns;
    const rows = this.roundConfig.rows;
    const row = Math.floor(this.focusIndex / cols);
    const col = this.focusIndex % cols;
    const nr = Phaser.Math.Clamp(row + dy, 0, rows - 1);
    const nc = Phaser.Math.Clamp(col + dx, 0, cols - 1);
    this.setFocus(nr * cols + nc, false);
  }

  private setFocus(index: number, snap: boolean): void {
    this.focusIndex = Phaser.Math.Clamp(index, 0, Math.max(0, this.tiles.length - 1));
    const tile = this.tiles[this.focusIndex];
    if (!tile) return;
    if (snap) this.focusCursor.place(tile.cx, tile.cy, tile.radius);
    else this.focusCursor.moveTo(tile.cx, tile.cy, tile.radius);
    this.focusCursor.show();
  }

  private activateFocus = (): void => {
    if (this.state === 'paused') {
      this.togglePause();
      return;
    }
    const tile = this.tiles[this.focusIndex];
    if (tile) this.onTileSelect(tile);
  };

  private togglePause = (): void => {
    if (this.state === 'game-over') return;
    if (this.state === 'paused') {
      this.state = 'recall';
      this.statusText.setText('SELECT THE OPENED NOZZLES');
      this.overlayText.setAlpha(0);
      this.focusCursor.show();
      return;
    }
    if (this.state !== 'recall' && this.state !== 'preview') return;
    this.state = 'paused';
    this.focusCursor.hide();
    this.showOverlay('PAUSED\nP / ESC to resume', 999999);
  };

  private restartRun = (): void => {
    this.roundToken += 1;
    this.scene.restart({ mode: this.mode });
  };

  private refreshHud(): void {
    this.hudLevel.setText(`LVL ${this.level}`);
    this.hudScore.setText(`SCORE ${this.score}`);
    this.hudStreak.setText(`STREAK ${this.streak}`);
    this.hudLives.setText(this.livesLabel());
    this.gaugeDirty = true;
    this.drawGauge(true);
  }

  private pulseScore(): void {
    this.tweens.add({
      targets: this.hudScore,
      scale: 1.12,
      duration: 90,
      yoyo: true,
    });
  }

  private showOverlay(text: string, holdMs: number): void {
    this.overlayText.setText(text);
    this.overlayText.setAlpha(1);
    this.tweens.killTweensOf(this.overlayText);
    if (holdMs < 900000) {
      this.tweens.add({
        targets: this.overlayText,
        alpha: 0,
        delay: Math.min(holdMs, 700),
        duration: 280,
      });
    }
  }

  private burstSparks(color: number): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height * 0.52;
    for (let i = 0; i < 12; i += 1) {
      const spark = this.add.circle(cx, cy, 2 + Math.random() * 3, color, 0.95);
      spark.setDepth(30);
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 120;
      this.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 420 + Math.random() * 280,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private redrawBg(): void {
    const tokens = getAdaptiveLayout(this.game)?.layout;
    drawVesselBackground(this.bg, this.scale.width, this.scale.height, {
      vessel: tokens?.vessel,
      shimmer: false,
    });
  }

  private drawGauge(force = false): void {
    if (
      !force &&
      !this.gaugeDirty &&
      Math.abs(this.pressure - this.lastDrawnPressure) < 0.008
    ) {
      return;
    }
    this.gaugeDirty = false;
    this.lastDrawnPressure = this.pressure;

    const tokens = this.tokens();
    const profile = getAdaptiveLayout(this.game)!.current;
    const x = profile.width - tokens.hud.sideGap - tokens.hud.gaugeSize;
    const y = tokens.padY + tokens.hudSize + tokens.hud.gaugeSize + 4;
    drawPressureGauge(
      this.gaugeGfx,
      x,
      y,
      tokens.hud.gaugeSize,
      this.pressure,
      this.pressure < 0.72,
    );
  }
}
