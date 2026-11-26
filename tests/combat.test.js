import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CombatSystem,
  GUARDIAN_HOME,
  validCombat,
} from "../src/gameplay/CombatSystem.js";
const player = { x: GUARDIAN_HOME.x, z: GUARDIAN_HOME.z + 2 };
test("attacks require range, facing, stamina and cooldown", () => {
  const c = new CombatSystem();
  assert.equal(c.attack("light", player, 0).hit, false);
  assert.equal(c.attack("heavy", player, Math.PI), null);
  c.update(0.6, player, false);
  assert.equal(c.attack("heavy", player, Math.PI).hit, true);
  assert.equal(c.guardianHealth, 50);
  c.update(1, player, false);
  assert.equal(c.attack("heavy", player, Math.PI).defeated, true);
  assert.equal(c.snapshot().guardianHealth, 0);
});
test("guard, dodge and respawn respond to enemy hits", () => {
  const c = new CombatSystem();
  c.update(1, player, true);
  assert.equal(c.health, 95);
  c.enemyCooldown = 0;
  assert.ok(c.dodge());
  assert.equal(c.update(0.01, player, false).type, "dodged");
  assert.equal(c.health, 95);
  c.dodgeTime = 0;
  c.health = 10;
  c.enemyCooldown = 0;
  assert.equal(c.update(0.01, player, false).type, "respawn");
  assert.equal(c.health, 100);
  assert.ok(validCombat(c.snapshot()));
});
test("guardian returns home when the player leaves the encounter", () => {
  const c = new CombatSystem();
  c.enemyX += 8;
  c.update(1, { x: 0, z: 0 }, false);
  assert.ok(c.enemyX < GUARDIAN_HOME.x + 8);
});
