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
test("guardian telegraphs, can miss or be dodged, and guard reduces damage", () => {
  const c = new CombatSystem();
  assert.equal(c.update(1, player, true).type, "warning");
  assert.equal(c.health, 100);
  assert.equal(c.update(0.8, player, true).damage, 5);
  c.enemyCooldown = 0;
  c.update(0.01, player, false);
  assert.ok(c.dodge());
  assert.equal(c.update(0.2, player, false), null);
  assert.equal(
    c.update(0.61, { x: player.x + 10, z: player.z }, false).type,
    "missed",
  );
  c.enemyCooldown = 0;
  c.update(0.01, player, false);
  c.update(0.5, player, false);
  assert.ok(c.dodge());
  assert.equal(c.update(0.31, player, false).type, "dodged");
  c.dodgeTime = 0;
  c.health = 10;
  c.enemyCooldown = 0;
  c.update(0.01, player, false);
  assert.equal(c.update(0.8, player, false).type, "respawn");
  assert.equal(c.health, 100);
  assert.ok(validCombat(c.snapshot()));
});
test("guardian windup cancels on leaving the encounter or defeat", () => {
  const c = new CombatSystem();
  c.enemyCooldown = 0;
  c.update(0.01, player, false);
  assert.ok(c.enemyWindup > 0);
  c.update(0.1, { x: 0, z: 0 }, false);
  assert.equal(c.enemyWindup, 0);
  c.enemyCooldown = 0;
  c.update(0.01, player, false);
  c.guardianHealth = 0;
  c.update(0.1, player, false);
  assert.equal(c.enemyWindup, 0);
});
test("guardian returns home when the player leaves the encounter", () => {
  const c = new CombatSystem();
  c.enemyX += 8;
  c.update(1, { x: 0, z: 0 }, false);
  assert.ok(c.enemyX < GUARDIAN_HOME.x + 8);
});
