import { test } from "node:test";
import assert from "node:assert/strict";
import { Survival, validSurvival } from "../src/gameplay/Survival.js";
test("gather once, cook, consume only when hurt, and preserve state", () => {
  const s = new Survival();
  assert.equal(s.cook(), false);
  assert.equal(s.gather("berry1"), true);
  assert.equal(s.gather("berry1"), false);
  assert.equal(s.gather("invalid"), false);
  s.gather("berry2");
  assert.equal(s.cook(), true);
  assert.equal(s.eat(100), null);
  assert.equal(s.meals, 1);
  assert.equal(s.eat(80), 100);
  assert.equal(s.meals, 0);
  assert.ok(validSurvival(s.snapshot()));
  assert.deepEqual(new Survival(s.snapshot()).snapshot(), s.snapshot());
});
test("invalid materials cannot be loaded", () => {
  assert.equal(
    validSurvival({ picked: ["berry1", "berry1"], berries: 2, meals: 0 }),
    false,
  );
  assert.equal(
    validSurvival({ picked: ["berry1"], berries: 0, meals: 1 }),
    false,
  );
});
