// Terrain height is shared by geometry and player ground collision.
export const WORLD_HALF = 250;
export const RIVER_LEVEL = 0.6;
export const RIVER_HALF_WIDTH = 11;
export function riverCenter(z) {
  return 65 + 12 * Math.sin(z * 0.014);
}
export function inRiver(x, z) {
  return (
    Math.abs(x - riverCenter(z)) < RIVER_HALF_WIDTH - 0.35 &&
    Math.abs(z) <= WORLD_HALF
  );
}
export function heightAt(x, z) {
  const base =
    2.5 * Math.sin(x * 0.023) * Math.cos(z * 0.019) +
    1.2 * Math.sin(x * 0.049 + z * 0.026) +
    0.45 * Math.cos(z * 0.08);
  // Carve a deep central channel, blending to unmodified terrain at the banks.
  const distance = Math.abs(x - riverCenter(z));
  const t = Math.max(0, Math.min(1, (32 - distance) / 22));
  const blend = t * t * (3 - 2 * t);
  return base + (Math.min(base, -4) - base) * blend;
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
