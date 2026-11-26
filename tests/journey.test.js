import { test } from "node:test";
import assert from "node:assert/strict";
import { Journey, validJourney } from "../src/gameplay/Journey.js";

test("gather, craft, restore and persist the first journey", () => {
  const j = new Journey();
  assert.equal(j.craft(), false);
  assert.equal(j.restore(), false);
  assert.equal(j.gather("invalid"), false);
  assert.equal(j.gather("leaf1"), true);
  assert.equal(j.gather("leaf1"), false);
  assert.equal(j.gather("leaf2"), true);
  assert.equal(j.gather("leaf3"), true);
  assert.equal(j.craft(), true);
  assert.equal(j.craft(), false);
  assert.equal(j.leaves, 0);
  assert.equal(j.restore(), true);
  assert.equal(j.restore(), false);
  assert.ok(validJourney(j.snapshot()));
  assert.deepEqual(new Journey(j.snapshot()).snapshot(), j.snapshot());
});
test("invalid journey states cannot be loaded", () => {
  assert.equal(
    validJourney({
      gathered: ["leaf1", "leaf1"],
      leaves: 2,
      lantern: false,
      restored: false,
    }),
    false,
  );
  assert.equal(
    validJourney({ gathered: [], leaves: 0, lantern: false, restored: true }),
    false,
  );
  assert.equal(
    validJourney({ gathered: [], leaves: 0, lantern: true, restored: false }),
    false,
  );
});
