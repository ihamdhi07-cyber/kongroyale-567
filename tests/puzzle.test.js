import { test } from "node:test";
import assert from "node:assert/strict";
import { EchoPuzzle, validPuzzle } from "../src/gameplay/EchoPuzzle.js";
import { Progression, validProgress } from "../src/gameplay/Progression.js";
test("inscription gates switches; wrong sequence resets and correct sequence completes", () => {
  const p = new EchoPuzzle();
  assert.equal(p.press("moon"), "locked");
  p.read();
  assert.equal(p.press("moon"), "correct");
  assert.equal(p.press("star"), "reset");
  assert.equal(p.stage, 0);
  assert.equal(p.press("moon"), "correct");
  assert.equal(p.press("sun"), "correct");
  assert.equal(p.press("star"), "solved");
  assert.equal(p.press("moon"), "complete");
  assert.ok(validPuzzle(p.snapshot()));
});
test("discovery XP awards only once and puzzle unlocks fleetfoot", () => {
  const p = new Progression();
  assert.equal(p.award("waystone"), true);
  assert.equal(p.award("waystone"), false);
  assert.equal(p.award("invalid"), false);
  assert.equal(p.xp, 20);
  p.award("puzzle");
  assert.equal(p.xp, 80);
  assert.equal(p.swift, true);
  assert.ok(validProgress(p.snapshot()));
  assert.equal(validProgress({ achievements: ["puzzle", "puzzle"] }), false);
});
