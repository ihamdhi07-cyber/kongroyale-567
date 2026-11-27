import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createPhysics } from "../src/physics.js";
import {
  chunkAt,
  wantedChunks,
  createChunkGeometry,
  TerrainChunks,
  SEGMENTS,
} from "../src/world/TerrainChunks.js";
import { heightAt } from "../src/world.js";

test("neighboring chunks share exact boundary heights and normals", () => {
  const left = createChunkGeometry(1, 1),
    right = createChunkGeometry(2, 1),
    a = left.attributes.position,
    b = right.attributes.position;
  for (let row = 0; row <= SEGMENTS; row++) {
    const i = row * (SEGMENTS + 1) + SEGMENTS,
      j = row * (SEGMENTS + 1);
    assert.deepEqual(
      [a.getX(i), a.getY(i), a.getZ(i)],
      [b.getX(j), b.getY(j), b.getZ(j)],
    );
    const n = left.attributes.normal,
      m = right.attributes.normal;
    assert.deepEqual(
      [n.getX(i), n.getY(i), n.getZ(i)],
      [m.getX(j), m.getY(j), m.getZ(j)],
    );
  }
  left.dispose();
  right.dispose();
});
test("chunk selection is bounded and disposes no-longer-needed geometry", () => {
  assert.deepEqual(chunkAt(-250, -250), { x: 0, z: 0 });
  assert.deepEqual(chunkAt(250, 250), { x: 3, z: 3 });
  assert.equal(wantedChunks(0, 0).length, 9);
  assert.equal(wantedChunks(-249, -249).length, 4);
  let created = 0,
    removed = 0;
  const physics = {
    addTerrain() {
      return ++created;
    },
    removeTerrain() {
      removed++;
    },
    sync() {},
  };
  const chunks = new TerrainChunks(new THREE.Scene(), physics);
  assert.equal(chunks.update(-200, -200), true);
  assert.equal(chunks.update(-201, -201), false);
  chunks.update(200, 200);
  assert.ok(removed > 0);
  assert.equal(chunks.chunks.size, 4);
  chunks.dispose();
  assert.equal(removed, created);
  const stable = new TerrainChunks(new THREE.Scene(), physics);
  stable.update(-0.1, -20);
  assert.equal(
    stable.update(0.1, -20),
    false,
    "jitter around a seam must not churn chunks",
  );
  assert.equal(
    stable.update(5, -20),
    true,
    "advance after the hysteresis band",
  );
  stable.dispose();
});
test("player crosses a streamed seam without falling", async () => {
  const physics = await createPhysics(null, {
    x: -4,
    y: heightAt(-4, 0),
    z: 0,
  });
  const chunks = new TerrainChunks(new THREE.Scene(), physics);
  chunks.update(-4, 0);
  let p = { x: -4, z: 0 };
  for (let i = 0; i < 100; i++) {
    chunks.update(p.x, p.z);
    p = physics.move(0.1, 0, 1 / 60, false);
  }
  assert.ok(p.x > 4, `expected crossing, x=${p.x}`);
  assert.ok(Math.abs(p.y - heightAt(p.x, p.z)) < 0.4, `ground y=${p.y}`);
  assert.ok(chunks.chunks.size <= 9);
  chunks.dispose();
  physics.dispose();
});

test("surface sampling matches the actual rendered triangles across chunk seams", async () => {
  const { groundHeightAt } = await import("../src/world.js");
  for (const [cx, cz] of [
    [0, 0],
    [1, 2],
    [2, 2],
    [3, 3],
  ]) {
    const geometry = createChunkGeometry(cx, cz);
    const p = geometry.attributes.position;
    const indices = geometry.index;
    for (let t = 0; t < indices.count; t += 3 * 31) {
      const a = indices.getX(t),
        b = indices.getX(t + 1),
        c = indices.getX(t + 2);
      const x = p.getX(a) * 0.2 + p.getX(b) * 0.3 + p.getX(c) * 0.5;
      const z = p.getZ(a) * 0.2 + p.getZ(b) * 0.3 + p.getZ(c) * 0.5;
      const y = p.getY(a) * 0.2 + p.getY(b) * 0.3 + p.getY(c) * 0.5;
      assert.ok(Math.abs(groundHeightAt(x, z) - y) < 0.00001, `${x},${z}`);
    }
    geometry.dispose();
  }
});
