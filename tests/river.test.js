import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { heightAt, inRiver, riverCenter, RIVER_LEVEL } from "../src/world.js";
import { createPhysics } from "../src/physics.js";
import { TerrainChunks } from "../src/world/TerrainChunks.js";
test("river has a deep navigable channel and dry banks", () => {
  for (const z of [-200, 0, 180]) {
    const x = riverCenter(z);
    assert.equal(inRiver(x, z), true);
    assert.ok(heightAt(x, z) < RIVER_LEVEL - 3);
    assert.equal(inRiver(x + 25, z), false);
  }
});
test("swimmer floats and can leave onto the bank", async () => {
  const x = riverCenter(0),
    scene = new THREE.Scene();
  const physics = await createPhysics(null, { x, y: -0.5, z: 0 });
  const terrain = new TerrainChunks(scene, physics);
  terrain.update(x, 0);
  let p = { x, y: -0.5, z: 0 };
  for (let i = 0; i < 60; i++)
    p = physics.move(0, 0, 1 / 60, false, RIVER_LEVEL - 1.1);
  assert.ok(Math.abs(p.y - (RIVER_LEVEL - 1.1)) < 0.25, `float y=${p.y}`);
  for (let i = 0; i < 300; i++) {
    terrain.update(p.x, p.z);
    const swimming = inRiver(p.x, p.z) && p.y < RIVER_LEVEL + 1.3;
    p = physics.move(
      -0.12,
      0,
      1 / 60,
      false,
      swimming ? RIVER_LEVEL - 1.1 : null,
    );
  }
  assert.ok(p.x < x - 16, `left river x=${p.x}`);
  assert.equal(inRiver(p.x, p.z), false);
  terrain.dispose();
  physics.dispose();
});
