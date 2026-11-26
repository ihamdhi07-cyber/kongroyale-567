// Terrain height is shared by geometry and player ground collision.
export const WORLD_HALF = 250;
export function heightAt(x, z) {
  return (
    2.5 * Math.sin(x * 0.023) * Math.cos(z * 0.019) +
    1.2 * Math.sin(x * 0.049 + z * 0.026) +
    0.45 * Math.cos(z * 0.08)
  );
}
export function clampWorld(v) {
  return Math.max(-WORLD_HALF + 2, Math.min(WORLD_HALF - 2, v));
}
export function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
