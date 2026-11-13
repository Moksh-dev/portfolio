import type { PublicEntry, Point3 } from "../content/portfolio";

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function smoothRange(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

/** Deterministic geometry keeps hydration, fallback, and future edits predictable. */
export function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function constellationEdges(entries: readonly PublicEntry[]) {
  const ids = new Set(entries.map((entry) => entry.id));
  const seen = new Set<string>();
  return entries.flatMap((entry) => entry.relatedIds.flatMap((relatedId) => {
    if (!ids.has(relatedId) || relatedId === entry.id) return [];
    const key = [entry.id, relatedId].sort().join(":");
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: key, from: entry.id, to: relatedId }];
  }));
}

export function displayPosition(position: Point3, compact: boolean): [number, number, number] {
  return compact ? [position[0] * 0.55, position[1] * 1.25, position[2] * 0.6] : [...position];
}
