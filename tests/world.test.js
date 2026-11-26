import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_CONFIG, REGIONS, LANDMARKS, EXPANSION_ZONES } from '../src/world/WorldSpec.js';
import { TerrainManager } from '../src/world/TerrainManager.js';

test('World specification satisfies 15x15 km ultimate & 8x8 km playable contract', () => {
  assert.equal(WORLD_CONFIG.ULTIMATE_SIZE_M, 15000);
  assert.equal(WORLD_CONFIG.PLAYABLE_SIZE_M, 8000);
  assert.equal(REGIONS.length, 8);
  const totalPlayableKm2 = REGIONS.reduce((sum, r) => sum + r.areaKm2, 0);
  assert.equal(totalPlayableKm2, 64);
  const totalExpansionKm2 = EXPANSION_ZONES.reduce((sum, z) => sum + z.areaKm2, 0);
  assert.equal(totalExpansionKm2, 161);
  assert.equal(totalPlayableKm2 + totalExpansionKm2, 225);
});

test('TerrainManager is deterministic, finite across 15x15 km, and honours landmark flat pads', () => {
  const t1 = new TerrainManager(WORLD_CONFIG.SEED);
  const t2 = new TerrainManager(WORLD_CONFIG.SEED);

  // Determinism check across sample coordinates including expansion frontier
  const coords = [
    [0, 380],
    [-980, -160],
    [-1580, -1950],
    [1580, 1480],
    [1720, -240],
    [140, -1780],
    [1780, -1820],
    [-1620, 1620],
    [-6500, 6200],
    [7000, -7000],
  ];
  for (const [x, z] of coords) {
    const h1 = t1.getHeight(x, z);
    const h2 = t2.getHeight(x, z);
    assert.equal(h1, h2, `Height mismatch at (${x}, ${z})`);
    assert.ok(Number.isFinite(h1), `Height must be finite at (${x}, ${z})`);
    const n = t1.getNormal(x, z);
    const len = Math.hypot(n.x, n.y, n.z);
    assert.ok(Math.abs(len - 1) < 1e-4, 'Surface normal must be unit length');
  }

  // Every major landmark pad honours its target height
  for (const lm of LANDMARKS) {
    const h = t1.getHeight(lm.x, lm.z);
    assert.ok(Math.abs(h - lm.padY) < 0.05, `Landmark ${lm.id} pad height mismatch: got ${h}, want ${lm.padY}`);
  }
});

test('Organic biome weighting resolves all 8 regions cleanly without NaN or zero weights', () => {
  const terrain = new TerrainManager(WORLD_CONFIG.SEED);
  const seenRegions = new Set();
  for (const reg of REGIONS) {
    const sample = terrain.biomes.sample(reg.cx, reg.cz);
    seenRegions.add(sample.primary.id);
    const sum = sample.weights.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-4, `Weights at ${reg.id} must sum to 1`);
  }
  assert.equal(seenRegions.size, 8, 'All 8 regions must be reachable across the 8x8 km map');
});
