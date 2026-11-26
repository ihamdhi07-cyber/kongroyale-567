import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceTime,
  daylight,
  timeLabel,
  validEnvironment,
  DEFAULT_ENVIRONMENT,
  DAY_SECONDS,
} from "../src/world/Environment.js";
import { stepCreature } from "../src/world/Wildlife.js";
test("day clock wraps and daylight follows the sun", () => {
  assert.ok(Math.abs(advanceTime(0.9, DAY_SECONDS * 0.2) - 0.1) < 1e-9);
  assert.ok(daylight(0.5) > 0.99);
  assert.equal(daylight(0), 0);
  assert.equal(timeLabel(0), "NIGHT");
  assert.equal(timeLabel(0.5), "AFTERNOON");
  assert.ok(validEnvironment(DEFAULT_ENVIRONMENT));
  assert.equal(validEnvironment({ ...DEFAULT_ENVIRONMENT, time: 1 }), false);
});
test("wildlife flees the player and remains in bounds", () => {
  const animal = { x: 1, z: 0, homeX: 1, homeZ: 0, heading: 0, fleeing: false };
  stepCreature(animal, { x: 0, z: 0 }, 1);
  assert.equal(animal.fleeing, true);
  assert.ok(animal.x > 1);
  animal.x = 244;
  animal.z = 244;
  stepCreature(animal, { x: 243, z: 243 }, 5);
  assert.ok(animal.x <= 245 && animal.z <= 245);
});
