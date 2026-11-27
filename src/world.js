// Terrain height is shared by geometry and player ground collision.
export const WORLD_HALF = 250;
// Shared grid contract: rendered and Rapier triangles use the same samples.
export const CHUNK_SIZE = 125;
export const TERRAIN_SEGMENTS = 32;
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
// Sample the same triangles as the streamed mesh, not the smooth source function.
// PlaneGeometry divides each cell along the north-east to south-west diagonal.
export function groundHeightAt(x, z) {
  const step = CHUNK_SIZE / TERRAIN_SEGMENTS;
  const cells = (2 * WORLD_HALF) / step;
  const fx = Math.max(0, Math.min(cells, (x + WORLD_HALF) / step));
  const fz = Math.max(0, Math.min(cells, (z + WORLD_HALF) / step));
  const i = Math.min(cells - 1, Math.floor(fx));
  const j = Math.min(cells - 1, Math.floor(fz));
  const tx = fx - i,
    tz = fz - j;
  const x0 = -WORLD_HALF + i * step,
    z0 = -WORLD_HALF + j * step;
  const a = heightAt(x0, z0),
    b = heightAt(x0 + step, z0);
  const c = heightAt(x0, z0 + step),
    d = heightAt(x0 + step, z0 + step);
  return tx + tz <= 1
    ? a + (b - a) * tx + (c - a) * tz
    : d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
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
