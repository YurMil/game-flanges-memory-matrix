import type { BreakpointId } from './types';

/** Width thresholds in CSS px (container width, not device). */
export const BREAKPOINTS = {
  phoneMax: 600,
  tabletMax: 1024,
} as const;

export function classifyBreakpoint(width: number, height: number): BreakpointId {
  const shortSide = Math.min(width, height);
  if (width <= BREAKPOINTS.phoneMax || shortSide <= 500) return 'phone';
  if (width <= BREAKPOINTS.tabletMax) return 'tablet';
  return 'desktop';
}
