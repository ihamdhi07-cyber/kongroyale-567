import { test } from "node:test";
import assert from "node:assert/strict";
import { inventoryItems } from "../src/gameplay/Inventory.js";
import { Journey } from "../src/gameplay/Journey.js";
import { Survival } from "../src/gameplay/Survival.js";
test("inventory follows real gather, craft, cook, consume and restored state", () => {
  const journey = new Journey(),
    survival = new Survival();
  journey.gather("leaf1");
  journey.gather("leaf2");
  journey.gather("leaf3");
  survival.gather("berry1");
  survival.gather("berry2");
  assert.deepEqual(
    inventoryItems(journey, survival, {
      category: "material",
      sort: "quantity",
    }).map((x) => [x.id, x.quantity]),
    [
      ["glowleaf", 3],
      ["berries", 2],
    ],
  );
  assert.equal(journey.craft(), true);
  assert.equal(survival.cook(), true);
  assert.equal(
    inventoryItems(journey, survival, { category: "quest" })[0].quantity,
    1,
  );
  assert.equal(
    inventoryItems(journey, survival, { category: "consumable" })[0].quantity,
    1,
  );
  assert.equal(survival.eat(70), 100);
  const restored = inventoryItems(
    new Journey(journey.snapshot()),
    new Survival(survival.snapshot()),
  );
  assert.deepEqual(
    restored.map((x) => [x.name, x.quantity]),
    [
      ["Berry meal", 0],
      ["Glowleaf", 0],
      ["Wayfarer's light", 1],
      ["Wild berries", 0],
    ],
  );
});
test("unknown inventory categories show no items and quantity ties sort by name", () => {
  const j = new Journey(),
    s = new Survival();
  assert.deepEqual(inventoryItems(j, s, { category: "unknown" }), []);
  assert.deepEqual(
    inventoryItems(j, s, { sort: "quantity" }).map((x) => x.name),
    inventoryItems(j, s).map((x) => x.name),
  );
});
