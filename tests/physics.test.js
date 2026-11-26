import { test } from "node:test";
import assert from "node:assert/strict";
import { PlaneGeometry } from "three";
import { createPhysics } from "../src/physics.js";

test("player grounds, collides with an obstacle, jumps and camera ray hits", async () => {
  const ground = new PlaneGeometry(100, 100, 1, 1);
  ground.rotateX(-Math.PI / 2);
  const physics = await createPhysics(ground, { x: 0, y: 0, z: 0 });
  physics.addCylinder(0, 0, -5, 1, 4);
  physics.sync();
  let p;
  for (let i = 0; i < 60; i++) p = physics.move(0, 0, 1 / 60, false);
  assert.ok(p.grounded, "player should stand on terrain");
  for (let i = 0; i < 120; i++) p = physics.move(0, -0.1, 1 / 60, false);
  assert.ok(p.z > -3.6, `obstacle should block player, z=${p.z}`);
  const jumped = physics.move(0, 0, 1 / 60, true);
  assert.ok(jumped.y > p.y, "jump should lift player");
  const distance = physics.cameraDistance(
    { x: 0, y: 2, z: 0 },
    { x: 0, y: 0, z: -1 },
    10,
  );
  assert.ok(distance < 5, `camera ray should hit obstacle: ${distance}`);
  physics.dispose();
  ground.dispose();
});
