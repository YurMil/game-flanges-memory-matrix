/** Mulberry32 seeded PRNG for deterministic patterns. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePattern(
  rows: number,
  columns: number,
  targetCount: number,
  seed: number,
): string[] {
  const total = rows * columns;
  const count = Math.max(1, Math.min(targetCount, total));
  const rng = createRng(seed);
  const indices = Array.from({ length: total }, (_, i) => i);

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, count).map((index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return `${row}:${col}`;
  });
}
