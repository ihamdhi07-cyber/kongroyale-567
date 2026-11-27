import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  VegetationChunks,
  scatterChunk,
} from "../src/world/VegetationChunks.js";
import { TerrainChunks } from "../src/world/TerrainChunks.js";
import { LANDMARKS, detectLandmarks } from "../src/gameplay/Landmarks.js";
import { riverCenter } from "../src/world.js";
test("chunk vegetation is deterministic, bounded and clear of river and landmarks", () => {
  for (let x = 0; x < 4; x++)
    for (let z = 0; z < 4; z++) {
      const trees = scatterChunk(x, z);
      assert.deepEqual(trees, scatterChunk(x, z));
      for (const t of trees) {
        assert.ok(t.x >= -250 + x * 125 && t.x < -250 + (x + 1) * 125);
        assert.ok(Math.abs(t.x - riverCenter(t.z)) >= 19);
        for (const s of LANDMARKS)
          assert.ok(Math.hypot(t.x - s.x, t.z - s.z) >= 10);
      }
    }
});
test("chunk lifecycle removes vegetation colliders and instances", () => {
  let id = 0;
  const active = new Set(),
    physics = {
      addTerrain() {
        const v = ++id;
        active.add(v);
        return v;
      },
      addCylinder() {
        const v = ++id;
        active.add(v);
        return v;
      },
      removeTerrain(v) {
        assert.ok(active.delete(v));
      },
      sync() {},
    };
  const scene = new THREE.Scene(),
    veg = new VegetationChunks(scene, physics);
  const terrain = new TerrainChunks(scene, physics, {
    load: (c) => veg.load(c),
    unload: (k) => veg.unload(k),
  });
  terrain.update(-200, -200);
  assert.equal(veg.chunks.size, terrain.chunks.size);
  terrain.update(200, 200);
  assert.equal(veg.chunks.size, terrain.chunks.size);
  terrain.dispose();
  assert.equal(veg.chunks.size, 0);
  assert.equal(active.size, 0);
  veg.dispose();
});
test("landmark detection does not repeat discovered locations", () => {
  const site = LANDMARKS[0];
  assert.equal(detectLandmarks(site.x, site.z, new Set()).length, 1);
  assert.equal(detectLandmarks(site.x, site.z, new Set([site.id])).length, 0);
  assert.equal(detectLandmarks(0, 0, new Set()).length, 0);
});
test("real Rapier colliders are removed when vegetation streams out", async () => {
  const { createPhysics } = await import("../src/physics.js");
  const physics = await createPhysics(null, { x: -200, y: 10, z: -200 });
  const scene = new THREE.Scene();
  const veg = new VegetationChunks(scene, physics);
  const terrain = new TerrainChunks(scene, physics, {
    load: (c) => veg.load(c),
    unload: (k) => veg.unload(k),
  });
  terrain.update(-200, -200);
  const old = [...veg.chunks.values()].flatMap((c) => c.colliders);
  assert.ok(old.length > 0 && old.every((c) => c.isValid()));
  terrain.update(200, 200);
  assert.ok(old.every((c) => !c.isValid()));
  const current = [...veg.chunks.values()].flatMap((c) => c.colliders);
  assert.ok(current.length > 0 && current.every((c) => c.isValid()));
  terrain.dispose();
  assert.ok(current.every((c) => !c.isValid()));
  veg.dispose();
  physics.dispose();
});
