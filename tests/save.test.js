import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager, validateSaveData, SAVE_SCHEMA_VERSION } from '../src/save/SaveManager.js';

test('SaveManager validates schema, persists slots, lists slots, and deletes cleanly', async () => {
  const sm = new SaveManager();

  assert.equal(validateSaveData(null), false);
  assert.equal(validateSaveData({ version: 999, player: { x: 0, z: 0 }, inventory: {} }), false);
  assert.equal(validateSaveData({ version: SAVE_SCHEMA_VERSION, player: { x: NaN, z: 0 }, inventory: {} }), false);

  const payload = {
    regionName: 'Emerald Wilds',
    explorationPct: 14.5,
    timeOfDay: 16.2,
    player: { x: -950, y: 26, z: -140, hp: 92, stamina: 88, warmth: 75 },
    inventory: { items: { sunberry: 4 }, equipped: { weapon: 'wayfarer-staff', armor: 'traveler-cloak' } },
    progression: { level: 3, xp: 40, skillPoints: 1, unlockedSkills: ['gale-glider'] },
    quests: { active: {}, completed: ['herbs-of-the-canopy'] },
    exploration: { discoveredLandmarks: ['crossroads-settlement', 'ancient-heart-tree'], attunedWaystones: ['crossroads-settlement'], fogCells: [10, 11] },
    puzzles: { solved: ['crossroads-obelisks'] },
  };

  await sm.saveSlot('slot1', payload);
  const loaded = await sm.loadSlot('slot1');
  assert.ok(loaded);
  assert.equal(loaded.version, SAVE_SCHEMA_VERSION);
  assert.equal(loaded.regionName, 'Emerald Wilds');
  assert.equal(loaded.player.x, -950);

  const slots = await sm.listSlots();
  const s1 = slots.find((s) => s.slotId === 'slot1');
  assert.equal(s1.exists, true);
  assert.equal(s1.level, 3);

  await sm.deleteSlot('slot1');
  assert.equal(await sm.loadSlot('slot1'), null);
});
