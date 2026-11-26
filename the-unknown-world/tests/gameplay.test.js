import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EventBus } from '../src/core/EventBus.js';
import { InventorySystem } from '../src/gameplay/InventorySystem.js';
import { ProgressionSystem } from '../src/gameplay/ProgressionSystem.js';
import { QuestSystem } from '../src/gameplay/QuestSystem.js';
import { ExplorationSystem } from '../src/gameplay/ExplorationSystem.js';

const itemsData = JSON.parse(fs.readFileSync(new URL('../public/data/items/items.json', import.meta.url), 'utf8'));
const questsData = JSON.parse(fs.readFileSync(new URL('../public/data/quests/quests.json', import.meta.url), 'utf8'));

test('Progression levels up, grants skill points, and unlocks Wayfarer skills', () => {
  const bus = new EventBus();
  const prog = new ProgressionSystem(bus);
  const inv = new InventorySystem(itemsData.items, bus);
  const mockPlayer = { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, heal() {} };

  assert.equal(prog.level, 1);
  assert.equal(prog.skillPoints, 1);

  assert.equal(prog.unlockSkill('arcane-resonance', inv, mockPlayer), true);
  assert.equal(mockPlayer.attackPower, 24); // 16 base + 8 skill
  assert.equal(prog.skillPoints, 0);

  prog.addXP(120, 'Discovery');
  assert.equal(prog.level, 2);
  assert.equal(prog.skillPoints, 1);
});

test('QuestSystem advances via EventBus and completes with XP & item rewards', () => {
  const bus = new EventBus();
  const inv = new InventorySystem(itemsData.items, bus);
  const prog = new ProgressionSystem(bus);
  const quests = new QuestSystem(questsData.quests, inv, prog, bus);

  assert.equal(quests.startQuest('herbs-of-the-canopy'), true);
  inv.addItem('sunberry', 1);
  inv.addItem('sunberry', 1);
  inv.addItem('sunberry', 1);
  inv.addItem('moonpetal', 1);
  inv.addItem('moonpetal', 1);
  bus.emit('npc:talk:herbalist-lyra');

  assert.equal(quests.completed.has('herbs-of-the-canopy'), true);
  assert.ok(inv.getCount('spirit-tonic') >= 2);
  assert.ok(prog.level >= 2);
});

test('ExplorationSystem tracks 8x8 km fog-of-war, landmark discovery & waystone fast travel', () => {
  const bus = new EventBus();
  const prog = new ProgressionSystem(bus);
  const exp = new ExplorationSystem(bus, prog);

  assert.ok(exp.discoveredLandmarks.has('crossroads-settlement'));
  const beforePct = exp.getExplorationPercent();
  assert.ok(beforePct > 0);

  // Walk directly to The Ancient Heart Tree (-980, -160)
  exp.update({ x: -980, y: 26, z: -160 });
  assert.ok(exp.discoveredLandmarks.has('ancient-heart-tree'));
  assert.ok(exp.getExplorationPercent() > beforePct);

  assert.equal(exp.attuneWaystone('ancient-heart-tree'), true);
  assert.ok(exp.attunedWaystones.has('ancient-heart-tree'));
});
