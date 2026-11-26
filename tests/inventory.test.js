import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EventBus } from '../src/core/EventBus.js';
import { InventorySystem } from '../src/gameplay/InventorySystem.js';
import { CraftingSystem } from '../src/gameplay/CraftingSystem.js';

const itemsData = JSON.parse(fs.readFileSync(new URL('../public/data/items/items.json', import.meta.url), 'utf8'));

test('Inventory adds, filters, equips gear, and applies consumables cleanly', () => {
  const bus = new EventBus();
  const inv = new InventorySystem(itemsData.items, bus);

  assert.equal(inv.getCount('wayfarer-staff'), 1);
  assert.equal(inv.getCount('sunberry'), 3);

  inv.addItem('moonpetal', 2);
  assert.equal(inv.getCount('moonpetal'), 2);

  const materials = inv.list({ category: 'material' });
  assert.ok(materials.some((m) => m.id === 'moonpetal'));
  assert.ok(materials.every((m) => m.category === 'material'));

  const mockPlayer = {
    hp: 50,
    maxHp: 100,
    stamina: 40,
    maxStamina: 100,
    warmth: 40,
    maxWarmth: 100,
    heal(v) { this.hp = Math.min(this.maxHp, this.hp + v); },
    restoreStamina(v) { this.stamina = Math.min(this.maxStamina, this.stamina + v); },
    restoreWarmth(v) { this.warmth = Math.min(this.maxWarmth, this.warmth + v); },
  };

  assert.equal(inv.useConsumable('berry-stew', mockPlayer), true);
  assert.equal(mockPlayer.hp, 92);
  assert.equal(inv.getCount('berry-stew'), 0);
});

test('Crafting deducts ingredients, crafts Runeblade Staff, and updates player attack stats', () => {
  const bus = new EventBus();
  const inv = new InventorySystem(itemsData.items, bus);
  const craft = new CraftingSystem(itemsData.recipes, inv, bus);

  assert.equal(craft.canCraft('craft-runeblade-staff'), false);
  inv.addItem('heartwood', 3);
  inv.addItem('crystal-shard', 2);
  inv.addItem('ancient-core', 1);
  assert.equal(craft.canCraft('craft-runeblade-staff'), true);

  let craftEventFired = false;
  bus.on('craft:complete', () => { craftEventFired = true; });
  assert.equal(craft.craft('craft-runeblade-staff'), true);
  assert.equal(craftEventFired, true);
  assert.equal(inv.getCount('runeblade-staff'), 1);
  assert.equal(inv.getCount('ancient-core'), 0);

  const mockPlayer = { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 };
  assert.equal(inv.equip('runeblade-staff', mockPlayer), true);
  assert.equal(mockPlayer.attackPower, 28);
});
