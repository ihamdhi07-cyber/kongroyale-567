import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { SaveManager, validateSave } from "../src/save/SaveManager.js";
import { Exploration, cellAt } from "../src/gameplay/Exploration.js";
import { Journey } from "../src/gameplay/Journey.js";
import { DEFAULT_COMBAT } from "../src/gameplay/CombatSystem.js";
import { EchoPuzzle } from "../src/gameplay/EchoPuzzle.js";
import { Progression } from "../src/gameplay/Progression.js";
import { Survival } from "../src/gameplay/Survival.js";
import { DEFAULT_AUDIO } from "../src/audio/AudioManager.js";
import { DEFAULT_ENVIRONMENT } from "../src/world/Environment.js";

test("exploration grid and discoveries survive IndexedDB round trip", async () => {
  const save = new SaveManager(indexedDB);
  await save.open();
  const exploration = new Exploration();
  exploration.visit(0, 9);
  exploration.visit(51, 9);
  exploration.discover("waystone");
  const snapshot = {
    ...exploration.snapshot(51, 9),
    journey: new Journey().snapshot(),
    environment: { ...DEFAULT_ENVIRONMENT },
    combat: { ...DEFAULT_COMBAT },
    puzzle: new EchoPuzzle().snapshot(),
    progress: new Progression().snapshot(),
    audio: { ...DEFAULT_AUDIO },
    survival: new Survival().snapshot(),
  };
  await save.save(snapshot);
  assert.deepEqual(await save.load(), snapshot);
  assert.notEqual(cellAt(0, 9), cellAt(51, 9));
  save.db.close();
});
test("invalid, out-of-bounds and future saves are rejected", () => {
  const good = {
    version: 1,
    position: { x: 0, z: 0 },
    explored: [0],
    discoveries: [],
  };
  assert.throws(() => validateSave({ ...good, version: 8 }));
  assert.equal(validateSave(good).version, 7);
  assert.throws(() =>
    validateSave({
      ...good,
      version: 2,
      journey: { gathered: [], leaves: 3, lantern: false, restored: false },
    }),
  );
  assert.equal(
    validateSave({ ...good, version: 2, journey: new Journey().snapshot() })
      .environment.weather,
    "clear",
  );
  assert.throws(() =>
    validateSave({
      ...good,
      version: 3,
      journey: new Journey().snapshot(),
      environment: { ...DEFAULT_ENVIRONMENT, weather: "hail" },
    }),
  );
  assert.equal(
    validateSave({
      ...good,
      version: 3,
      journey: new Journey().snapshot(),
      environment: { ...DEFAULT_ENVIRONMENT },
    }).combat.health,
    100,
  );
  assert.throws(() =>
    validateSave({
      ...good,
      version: 4,
      journey: new Journey().snapshot(),
      environment: { ...DEFAULT_ENVIRONMENT },
      combat: { health: 0, guardianHealth: 100 },
    }),
  );
  const legacy = validateSave({
    ...good,
    version: 4,
    discoveries: ["waystone"],
    journey: {
      gathered: ["leaf1", "leaf2", "leaf3"],
      leaves: 0,
      lantern: true,
      restored: true,
    },
    environment: { ...DEFAULT_ENVIRONMENT },
    combat: { health: 75, guardianHealth: 0 },
  });
  assert.equal(legacy.combat.health, 75);
  assert.deepEqual(legacy.progress.achievements, [
    "waystone",
    "restored",
    "guardian",
  ]);
  assert.throws(() =>
    validateSave({
      ...legacy,
      puzzle: { discovered: true, stage: 3 },
      progress: { achievements: [] },
    }),
  );
  const v5 = {
    ...legacy,
    version: 5,
    puzzle: { discovered: true, stage: 3 },
    progress: { achievements: ["puzzle"] },
  };
  const upgraded = validateSave(v5);
  assert.equal(upgraded.puzzle.stage, 3);
  assert.equal(upgraded.audio.muted, false);
  assert.throws(() =>
    validateSave({ ...upgraded, audio: { ...DEFAULT_AUDIO, master: 2 } }),
  );
  const v6 = {
    ...upgraded,
    version: 6,
    audio: { ...DEFAULT_AUDIO, master: 0.1 },
  };
  const v7 = validateSave(v6);
  assert.equal(v7.audio.master, 0.1);
  assert.equal(v7.survival.berries, 0);
  assert.throws(() =>
    validateSave({ ...v7, survival: { picked: [], berries: 4, meals: 0 } }),
  );
  assert.throws(() =>
    validateSave({ ...good, position: { x: Infinity, z: 0 } }),
  );
  assert.throws(() => validateSave({ ...good, explored: [100] }));
  assert.throws(() => validateSave({ ...good, discoveries: ["unknown"] }));
});
