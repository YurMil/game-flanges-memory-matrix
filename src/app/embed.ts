/**
 * Host embed detection for cadautoscript.com mini-game iframe.
 * Shell: MiniGameShellPage → /mini-games/{slug}/app.html (same-origin, no sandbox).
 */
export function isEmbeddedInHost(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

/** Path-based hint when opened as the site static entry. */
export function isHostStaticEntry(): boolean {
  return /\/mini-games\/[^/]+\/app\.html$/i.test(window.location.pathname);
}
