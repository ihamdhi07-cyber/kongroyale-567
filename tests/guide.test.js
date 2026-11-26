import { test } from "node:test";
import assert from "node:assert/strict";
import { guideMessage } from "../src/world/Guide.js";
test("guide gives progress-sensitive directions", () => {
  assert.match(guideMessage(false, false, false), /waystone/);
  assert.match(guideMessage(true, false, false), /glowleaves/);
  assert.match(guideMessage(true, true, false), /waystone/);
  assert.match(guideMessage(true, true, true), /shining/);
});
