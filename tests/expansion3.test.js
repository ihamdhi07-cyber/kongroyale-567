// Expansion III Verification Tests:
//   - Kong Royale-inspired Painterly Post-Processing & Adaptive FrameProfiler / Hardware Profiler
//   - Biome Wonders (Animated Waterfalls, Azure Coast Shipwreck & Coral Reefs, 3 Subterranean Caves)
//   - 10 Enterable 3D Interiors (7 Sanctuaries + 3 Underground Caves)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FrameProfiler, detectHardwareProfile } from '../src/core/GpuBenchmark.js';
import { QUALITY_PRESETS } from '../src/core/Renderer.js';
import { INTERIORS } from '../src/world/InteriorManager.js';
import { WATERFALLS, SHIPWRECK, CAVE_MOUTHS } from '../src/world/BiomeWonders.js';

test('Expansion III: Quality presets configure Painterly Post-Processing & Selective Bloom cleanly', () => {
  assert.equal(QUALITY_PRESETS.low.postProcess, false, 'Low preset bypasses post for 30+ FPS mobile');
  assert.equal(QUALITY_PRESETS.medium.postProcess, true);
  assert.equal(QUALITY_PRESETS.high.postProcess, true);
  assert.equal(QUALITY_PRESETS.ultra.postProcess, true);
  assert.ok(QUALITY_PRESETS.high.bloomStrength > 0.15 && QUALITY_PRESETS.high.bloomStrength <= 0.45);
});

test('Expansion III: FrameProfiler & Hardware Profiler track rolling FPS and recommend adaptive adjustments', () => {
  const prof = new FrameProfiler(30);
  for (let i = 0; i < 30; i++) prof.record(1 / 75);
  assert.ok(prof.fps >= 72 && prof.fps <= 78, `Expected ~75 FPS, got ${prof.fps}`);
  assert.equal(prof.recommendAdjustment(45), 'up');

  const slowProf = new FrameProfiler(30);
  for (let i = 0; i < 30; i++) slowProf.record(1 / 25);
  assert.ok(slowProf.fps <= 27);
  assert.equal(slowProf.recommendAdjustment(45), 'down');

  const hw = detectHardwareProfile(null);
  assert.ok(['low', 'medium', 'high'].includes(hw.recommendedQuality));
});

test('Expansion III: Biome Wonders (Waterfalls, Shipwreck, 3 Caves) & 10 Total Enterable Interiors', () => {
  assert.ok(WATERFALLS.length >= 2, 'Must include Emerald Falls and Silver-Crest Cascade');
  assert.equal(SHIPWRECK.id, 'star-seeker-wreck');
  assert.equal(CAVE_MOUTHS.length, 3, 'Must include 3 subterranean cave entrances');
  assert.equal(INTERIORS.length, 10, 'Must include 7 regional sanctuaries + 3 subterranean caves');

  const ids = new Set(INTERIORS.map((i) => i.id));
  for (const cm of CAVE_MOUTHS) {
    assert.ok(ids.has(cm.id), `Cave mouth ${cm.id} must link to an enterable 3D cave chamber`);
  }
});
