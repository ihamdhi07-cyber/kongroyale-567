// Expansion IV Verification Tests:
//   - GPU-Instanced Wind-Swaying 3D Meadow Grass & Wildflowers (MeadowGrassSystem)
//   - Full HTML5 Standard Gamepad Driver (GamepadControls)
//   - Sculpted Hero Aelira (twin flowing scarf ribbons + rolled scroll + gold hem) & Reduced Motion Accessibility
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { TerrainManager } from '../src/world/TerrainManager.js';
import { MeadowGrassSystem } from '../src/world/MeadowGrassSystem.js';
import { GamepadControls } from '../src/controls/GamepadControls.js';
import { EventBus } from '../src/core/EventBus.js';
import { Player } from '../src/player/Player.js';
import { CameraController } from '../src/camera/CameraController.js';
import { QUALITY_PRESETS } from '../src/core/Renderer.js';
import { WORLD_CONFIG } from '../src/world/WorldSpec.js';

test('Expansion IV: MeadowGrassSystem populates wind-swaying grass & wildflowers and scales cleanly by quality', () => {
  const scene = new THREE.Scene();
  const terrain = new TerrainManager(WORLD_CONFIG.SEED);
  const grass = new MeadowGrassSystem(scene, terrain, QUALITY_PRESETS.high);

  // Place player in lush Emerald Wilds meadow near Emerald Falls
  grass.update(0.016, 1.5, new THREE.Vector3(-880, 28, -80), { nightFactor: 0 }, false);
  assert.ok(grass.grassMesh.count > 500, `Expected >500 instanced grass blades, got ${grass.grassMesh.count}`);
  assert.ok(grass.flowerMesh.count > 10, `Expected meadow wildflowers, got ${grass.flowerMesh.count}`);

  // Quality scaling reduces instance budget cleanly on Low preset
  const highCount = grass.grassMesh.count;
  grass.applyQuality(QUALITY_PRESETS.low);
  grass.update(0.016, 2.0, new THREE.Vector3(-880, 28, -80), { nightFactor: 0 }, false);
  assert.ok(grass.grassMesh.count <= 900 && grass.grassMesh.count < highCount, 'Low preset should reduce grass count');

  // Hides cleanly when player steps indoors
  grass.update(0.016, 2.5, new THREE.Vector3(0, 600, 0), { nightFactor: 0 }, true);
  assert.equal(grass.root.visible, false);
});

test('Expansion IV: GamepadControls maps analog sticks, edge-triggered buttons & canonical EventBus hotkeys', () => {
  const bus = new EventBus();
  const emitted = [];
  bus.on('ui:toggle', (m) => emitted.push(`ui:${m}`));
  bus.on('mount:toggle', () => emitted.push('mount'));
  bus.on('world:guidingWind', () => emitted.push('wind'));
  bus.on('magic:castKey', (idx) => emitted.push(`spell:${idx}`));

  const gp = new GamepadControls(bus);
  const makeButtons = (pressedIndices) =>
    Array.from({ length: 16 }, (_, i) => ({ pressed: pressedIndices.includes(i), value: pressedIndices.includes(i) ? 1 : 0 }));

  const prevNav = globalThis.navigator;
  let mockPad = { connected: true, id: 'Xbox Wireless Controller', axes: [0.8, -0.5, 0.5, 0], buttons: makeButtons([0, 2, 3, 7, 8, 10, 11, 12]) };
  Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [mockPad] }, configurable: true });

  try {
    const s1 = gp.sample(0.016);
    assert.equal(gp.connected, true);
    assert.ok(s1.moveX > 0.7 && s1.moveY > 0.4);
    assert.equal(s1.jump, true);
    assert.equal(s1.sprint, true);
    assert.equal(s1.attackPressed, true);
    assert.equal(s1.interactPressed, true);
    assert.deepEqual(emitted, ['ui:map', 'mount', 'wind', 'spell:0']);

    // Holding the same buttons on frame 2 must NOT re-trigger edge-pressed events!
    emitted.length = 0;
    const s2 = gp.sample(0.016);
    assert.equal(s2.attackPressed, false);
    assert.equal(s2.interactPressed, false);
    assert.deepEqual(emitted, []);
  } finally {
    Object.defineProperty(globalThis, 'navigator', { value: prevNav, configurable: true });
  }
});

test('Expansion IV: Sculpted Aelira & Reduced Motion Accessibility camera shake suppression', () => {
  const scene = new THREE.Scene();
  const player = new Player(scene);
  assert.ok(player.parts.scarfTail, 'Main scarf ribbon exists');
  assert.ok(player.parts.scarfSub, 'Secondary animated scarf ribbon exists');

  const terrain = new TerrainManager(WORLD_CONFIG.SEED);
  const cam = new CameraController(16 / 9, terrain);
  cam.reducedMotion = true;
  cam.addShake(0.6);
  assert.equal(cam._shake, 0, 'Reduced Motion must suppress camera shake');
});
