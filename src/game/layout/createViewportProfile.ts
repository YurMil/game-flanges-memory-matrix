import { classifyBreakpoint } from './breakpoints';
import type { MeasuredViewport } from './measureViewport';
import type { LayoutTokens, OrientationId, ViewportProfile } from './types';

function orientationOf(width: number, height: number): OrientationId {
  return height >= width ? 'portrait' : 'landscape';
}

function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function createViewportProfile(measured: MeasuredViewport): ViewportProfile {
  const { width, height, insets, dpr } = measured;
  const breakpoint = classifyBreakpoint(width, height);
  const orientation = orientationOf(width, height);
  const shortSide = Math.min(width, height);

  return {
    width,
    height,
    breakpoint,
    orientation,
    isCompact: breakpoint === 'phone' || shortSide < 560,
    isTouch: isTouchDevice(),
    insets,
    shortSide,
    dpr,
  };
}

export function createLayoutTokens(profile: ViewportProfile): LayoutTokens {
  const { breakpoint, orientation, isCompact, width, height, insets } = profile;
  const phone = breakpoint === 'phone';
  const tablet = breakpoint === 'tablet';
  const landscapePhone = phone && orientation === 'landscape';

  const titleSize = phone
    ? Math.round(clamp(width * 0.11, 28, 40))
    : tablet
      ? Math.round(clamp(width * 0.07, 36, 48))
      : Math.round(clamp(width * 0.05, 42, 56));

  return {
    padX: Math.max(12, (phone ? 14 : 28) + insets.left),
    padY: Math.max(10, (phone ? 12 : 18) + insets.top),
    titleSize,
    subtitleSize: Math.round(titleSize * (phone ? 0.48 : 0.52)),
    bodySize: phone ? 13 : 15,
    monoSize: phone ? 12 : 14,
    hudSize: phone ? 12 : 14,
    buttonSize: phone ? 15 : 18,
    buttonPadX: phone ? 20 : 28,
    buttonPadY: phone ? 12 : 14,
    overlaySize: phone ? 22 : 28,
    minTouchTarget: phone || profile.isTouch ? 48 : 44,
    vessel: {
      widthRatio: phone ? 0.96 : tablet ? 0.9 : 0.86,
      heightRatio: landscapePhone ? 0.92 : phone ? 0.88 : 0.78,
      maxWidth: phone ? width - 8 : 920,
      maxHeight: phone ? height - 8 : 720,
      radius: phone ? 16 : 28,
      inset: phone ? 10 : 18,
      showPipes: !isCompact,
      rivetCount: phone ? 8 : 14,
    },
    hud: {
      topBand: (phone ? 56 : 72) + insets.top,
      statusY: (phone ? 64 : 78) + insets.top,
      gaugeSize: phone ? 22 : 28,
      sideGap: phone ? 12 : 24,
    },
    menu: landscapePhone
      ? {
          titleY: 0.08,
          subtitleGap: 28,
          blurbY: 0.28,
          bestY: 0.4,
          modeY: 0.48,
          startY: 0.62,
          cycleY: 0.76,
          tipsY: 0.9,
        }
      : {
          titleY: phone ? 0.1 : 0.16,
          subtitleGap: phone ? 30 : 48,
          blurbY: phone ? 0.26 : 0.32,
          bestY: phone ? 0.36 : 0.42,
          modeY: phone ? 0.43 : 0.5,
          startY: phone ? 0.56 : 0.62,
          cycleY: phone ? 0.68 : 0.72,
          tipsY: phone ? 0.86 : 0.86,
        },
    results: {
      titleY: phone ? 0.12 : 0.16,
      badgeY: phone ? 0.2 : 0.23,
      linesStartY: phone ? 0.3 : 0.34,
      lineGap: phone ? 22 : 28,
      playY: phone ? 0.72 : 0.72,
      menuY: phone ? 0.84 : 0.82,
    },
  };
}
