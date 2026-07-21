export type BreakpointId = 'phone' | 'tablet' | 'desktop';
export type OrientationId = 'portrait' | 'landscape';

export interface ViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ViewportProfile {
  /** Game canvas / Phaser scale width in CSS pixels. */
  width: number;
  /** Game canvas / Phaser scale height in CSS pixels. */
  height: number;
  breakpoint: BreakpointId;
  orientation: OrientationId;
  /** True when short side is phone-sized or container is narrow. */
  isCompact: boolean;
  /** True for touch-first / coarse pointer environments. */
  isTouch: boolean;
  insets: ViewportInsets;
  /** Shortest side — useful for type/grid scaling. */
  shortSide: number;
  /** Device pixel ratio clamped for layout math. */
  dpr: number;
}

export interface LayoutTokens {
  padX: number;
  padY: number;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  monoSize: number;
  hudSize: number;
  buttonSize: number;
  buttonPadX: number;
  buttonPadY: number;
  overlaySize: number;
  /** Minimum flange hit target in px (GDD ~44css). */
  minTouchTarget: number;
  /** Vessel panel metrics relative to canvas. */
  vessel: {
    widthRatio: number;
    heightRatio: number;
    maxWidth: number;
    maxHeight: number;
    radius: number;
    inset: number;
    showPipes: boolean;
    rivetCount: number;
  };
  /** Play HUD band heights. */
  hud: {
    topBand: number;
    statusY: number;
    gaugeSize: number;
    sideGap: number;
  };
  /** Menu vertical rhythm as fractions of content height. */
  menu: {
    titleY: number;
    subtitleGap: number;
    blurbY: number;
    bestY: number;
    modeY: number;
    startY: number;
    cycleY: number;
    tipsY: number;
  };
  results: {
    titleY: number;
    badgeY: number;
    linesStartY: number;
    lineGap: number;
    playY: number;
    menuY: number;
  };
}
