import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { SaveManager, validateSave } from "../src/save/SaveManager.js";
import { Exploration, cellAt } from "../src/gameplay/Exploration.js";
import { Journey } from "../src/gameplay/Journey.js";
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
  assert.throws(() => validateSave({ ...good, version: 4 }));
  assert.equal(validateSave(good).version, 3);
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
  assert.throws(() =>
    validateSave({ ...good, position: { x: Infinity, z: 0 } }),
  );
  assert.throws(() => validateSave({ ...good, explored: [100] }));
  assert.throws(() => validateSave({ ...good, discoveries: ["unknown"] }));
});
