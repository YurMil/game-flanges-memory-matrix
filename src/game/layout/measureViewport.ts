import type { ViewportInsets } from './types';

export interface MeasuredViewport {
  width: number;
  height: number;
  insets: ViewportInsets;
  dpr: number;
}

function readCssInset(style: CSSStyleDeclaration, name: string): number {
  const raw = style.getPropertyValue(name).trim();
  if (!raw) return 0;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Measure the playable area from the game parent element.
 * Prefer container box over window — critical for IDE panels / split views / mobile chrome.
 */
export function measureViewport(container: HTMLElement): MeasuredViewport {
  const rect = container.getBoundingClientRect();
  const style = getComputedStyle(container);

  // Prefer client size (excludes scrollbars); fall back to rect / visualViewport / window.
  const visual = window.visualViewport;
  let width = container.clientWidth || Math.round(rect.width);
  let height = container.clientHeight || Math.round(rect.height);

  if (width < 2 || height < 2) {
    width = Math.round(visual?.width ?? window.innerWidth);
    height = Math.round(visual?.height ?? window.innerHeight);
  }

  // Never trust a stale zero; clamp to usable minimums.
  width = Math.max(240, Math.floor(width));
  height = Math.max(320, Math.floor(height));

  const insets: ViewportInsets = {
    top: readCssInset(style, '--safe-top') || readCssInset(style, 'env(safe-area-inset-top)'),
    right: readCssInset(style, '--safe-right') || readCssInset(style, 'env(safe-area-inset-right)'),
    bottom:
      readCssInset(style, '--safe-bottom') || readCssInset(style, 'env(safe-area-inset-bottom)'),
    left: readCssInset(style, '--safe-left') || readCssInset(style, 'env(safe-area-inset-left)'),
  };

  // env() via getComputedStyle on custom props set in CSS is more reliable — also read from documentElement.
  const rootStyle = getComputedStyle(document.documentElement);
  insets.top = Math.max(insets.top, readCssInset(rootStyle, '--safe-top'));
  insets.right = Math.max(insets.right, readCssInset(rootStyle, '--safe-right'));
  insets.bottom = Math.max(insets.bottom, readCssInset(rootStyle, '--safe-bottom'));
  insets.left = Math.max(insets.left, readCssInset(rootStyle, '--safe-left'));

  const dpr = Math.min(3, window.devicePixelRatio || 1);

  return { width, height, insets, dpr };
}
