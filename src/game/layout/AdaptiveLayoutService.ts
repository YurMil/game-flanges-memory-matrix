import type Phaser from 'phaser';
import { createLayoutTokens, createViewportProfile } from './createViewportProfile';
import { measureViewport } from './measureViewport';
import type { LayoutTokens, ViewportProfile } from './types';

export type LayoutListener = (profile: ViewportProfile, tokens: LayoutTokens) => void;

const SERVICE_KEY = 'adaptiveLayout';

/**
 * Owns viewport measurement + breakpoint tokens.
 * Syncs Phaser Scale to the real container size (fixes narrow-panel clipping).
 */
export class AdaptiveLayoutService {
  readonly container: HTMLElement;
  private readonly game: Phaser.Game;
  private profile!: ViewportProfile;
  private tokens!: LayoutTokens;
  private readonly listeners = new Set<LayoutListener>();
  private observer: ResizeObserver | null = null;
  private raf = 0;

  constructor(game: Phaser.Game, container: HTMLElement) {
    this.game = game;
    this.container = container;
    this.refresh(true);
    this.bind();
  }

  get current(): ViewportProfile {
    return this.profile;
  }

  get layout(): LayoutTokens {
    return this.tokens;
  }

  subscribe(listener: LayoutListener): () => void {
    this.listeners.add(listener);
    listener(this.profile, this.tokens);
    return () => this.listeners.delete(listener);
  }

  /** Force remeasure (orientation / visualViewport / safe-area changes). */
  refresh(forceNotify = false): void {
    const measured = measureViewport(this.container);
    const next = createViewportProfile(measured);
    const changed =
      forceNotify ||
      !this.profile ||
      Math.round(next.width) !== Math.round(this.profile.width) ||
      Math.round(next.height) !== Math.round(this.profile.height) ||
      next.breakpoint !== this.profile.breakpoint ||
      next.orientation !== this.profile.orientation ||
      next.insets.top !== this.profile.insets.top ||
      next.insets.bottom !== this.profile.insets.bottom;

    // Skip token rebuild + notify when nothing meaningful changed
    if (!changed && this.profile) {
      return;
    }

    this.profile = next;
    this.tokens = createLayoutTokens(next);

    // Keep Phaser's internal size equal to the container box.
    const scale = this.game.scale;
    if (
      Math.abs(scale.width - next.width) > 0.5 ||
      Math.abs(scale.height - next.height) > 0.5
    ) {
      scale.resize(next.width, next.height);
    }

    if (changed) {
      this.container.dataset.breakpoint = next.breakpoint;
      this.container.dataset.orientation = next.orientation;
      this.container.dataset.compact = next.isCompact ? '1' : '0';
      for (const listener of this.listeners) listener(this.profile, this.tokens);
    }
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    window.visualViewport?.removeEventListener('resize', this.schedule);
    window.removeEventListener('orientationchange', this.schedule);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.listeners.clear();
  }

  private bind(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.schedule());
      this.observer.observe(this.container);
    }
    window.visualViewport?.addEventListener('resize', this.schedule);
    // Ignore visualViewport scroll — it fires often on mobile and rarely changes layout size
    window.addEventListener('orientationchange', this.schedule);
  }

  private schedule = (): void => {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.refresh();
    });
  };
}

let singleton: AdaptiveLayoutService | null = null;

export function createAdaptiveLayout(
  game: Phaser.Game,
  container: HTMLElement,
): AdaptiveLayoutService {
  singleton?.destroy();
  singleton = new AdaptiveLayoutService(game, container);
  (game.registry).set(SERVICE_KEY, singleton);
  return singleton;
}

export function getAdaptiveLayout(game: Phaser.Game): AdaptiveLayoutService | null {
  return (
    (game.registry.get(SERVICE_KEY) as AdaptiveLayoutService | undefined) ?? singleton
  );
}
