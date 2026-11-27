import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

import { EventBus } from '../src/core/EventBus.js';
import { TerrainManager } from '../src/world/TerrainManager.js';
import { BOSS_ARENAS } from '../src/world/WorldSpec.js';
import { InventorySystem } from '../src/gameplay/InventorySystem.js';
import { ProgressionSystem } from '../src/gameplay/ProgressionSystem.js';
import { JournalSystem } from '../src/gameplay/JournalSystem.js';
import { EnchantingSystem, WEAPON_RUNES } from '../src/gameplay/EnchantingSystem.js';
import { ShrineTrialSystem, SHRINE_TRIALS } from '../src/world/ShrineTrialSystem.js';
import { HomesteadSystem, HOMESTEAD_UPGRADES } from '../src/world/HomesteadSystem.js';
import { BountySystem } from '../src/gameplay/BountySystem.js';
import { Player } from '../src/player/Player.js';

const ROOT = process.cwd();
const loadJSON = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

test('All 4 Sculpted World Boss Arenas flatten terrain cleanly to their exact pad elevation', () => {
  const terrain = new TerrainManager();
  assert.equal(BOSS_ARENAS.length, 4);
  for (const ba of BOSS_ARENAS) {
    const centerY = terrain.getHeight(ba.x, ba.z);
    const northY = terrain.getHeight(ba.x, ba.z - 10);
    const southY = terrain.getHeight(ba.x, ba.z + 10);
    assert.ok(Math.abs(centerY - ba.padY) < 0.05, `${ba.id} center height matches padY`);
    assert.ok(Math.abs(northY - ba.padY) < 0.05, `${ba.id} north height flat`);
    assert.ok(Math.abs(southY - ba.padY) < 0.05, `${ba.id} south height flat`);
  }
});

test('Elemental Weapon Rune Infusions & 3 Combo Reactions (Shatter, Wildfire, Overload) work cleanly', () => {
  const items = loadJSON('public/data/items/items.json').items;
  const events = new EventBus();
  const inv = new InventorySystem(items, events);
  inv.addGold(500);
  inv.addItem('sunberry', 5, true);
  inv.addItem('crystal-shard', 5, true);
  inv.addItem('moonpetal', 5, true);

  const scene = new THREE.Scene();
  const player = new Player(scene);
  const ench = new EnchantingSystem(inv, events);
  assert.equal(WEAPON_RUNES.length, 4);

  const res = ench.unlockAndEquip('sunfire-rune', player);
  assert.equal(res.ok, true);
  assert.equal(ench.getActiveRune().id, 'sunfire-rune');
  assert.equal(player.infusionAura.visible, true);

  // 1. THERMAL SHATTER: Sunfire hits Frosted enemy -> 2.2x multiplier
  const dummyEnemy = { frostTimer: 3.0, burnTimer: 0, staggerTimer: 0, mesh: { position: new THREE.Vector3() } };
  const rx1 = ench.resolveHit(dummyEnemy, 'sunfire', 30);
  assert.equal(rx1.reactionLabel, 'THERMAL SHATTER!');
  assert.equal(rx1.multiplier, 2.2);

  // 2. WILDFIRE GALE: Wind hits Burning enemy -> 1.8x AoE flame vortex
  dummyEnemy.burnTimer = 3.0;
  const rx2 = ench.resolveHit(dummyEnemy, 'wind', 25);
  assert.equal(rx2.reactionLabel, 'WILDFIRE GALE!');
  assert.equal(rx2.multiplier, 1.8);

  // 3. ASTRAL OVERLOAD: Resonance hits Parried/Staggered enemy -> 2.0x shockwave
  dummyEnemy.staggerTimer = 2.0;
  const rx3 = ench.resolveHit(dummyEnemy, 'resonance', 35);
  assert.equal(rx3.reactionLabel, 'ASTRAL OVERLOAD!');
  assert.equal(rx3.multiplier, 2.0);
  assert.equal(ench.reactionCounts.shatter, 1);
  assert.equal(ench.reactionCounts.wildfire, 1);
  assert.equal(ench.reactionCounts.overload, 1);
});

test('5 Timed Shrine Trials, 8-Upgrade Homestead Sanctuary, Boss Trophies & Guild Bounties integrate cleanly', () => {
  const items = loadJSON('public/data/items/items.json').items;
  const creatures = loadJSON('public/data/creatures/creatures.json').creatures;
  const events = new EventBus();
  const inv = new InventorySystem(items, events);
  const prog = new ProgressionSystem(events);
  const journal = new JournalSystem(events, { creatures }, inv, prog);
  const terrain = new TerrainManager();
  const scene = new THREE.Scene();
  const player = new Player(scene);

  inv.addGold(900);
  inv.addItem('sunberry', 10, true);
  inv.addItem('moonpetal', 10, true);
  inv.addItem('heartwood', 10, true);
  inv.addItem('crystal-shard', 10, true);

  // Shrine Trials: start trial -> clear all 5 rings rapidly -> Gold medal!
  const trials = new ShrineTrialSystem(scene, terrain, events);
  assert.equal(SHRINE_TRIALS.length, 5);
  assert.equal(trials.startTrial('trial-crossroads-dash'), true);
  assert.equal(trials.activeRingMeshes.length, 5);
  for (const r of [...trials.activeRingMeshes]) {
    trials.update(1.5, 1.5, new THREE.Vector3(r.x, r.y - 1.0, r.z), { inventory: inv, progression: prog });
  }
  assert.equal(trials.activeTrial, null);
  assert.equal(trials.records['trial-crossroads-dash'].medal, 'gold');
  assert.equal(trials.getGoldCount(), 1);

  // Homestead: build upgrades, harvest garden, rest for Well-Rested, record Boss Trophy!
  const homestead = new HomesteadSystem(scene, terrain, events);
  assert.equal(HOMESTEAD_UPGRADES.length, 8);
  assert.equal(homestead.buildUpgrade('herb-garden', inv).ok, true);
  assert.equal(homestead.buildUpgrade('starlight-hearth', inv).ok, true);
  assert.equal(homestead.buildUpgrade('trophy-hall', inv).ok, true);
  assert.equal(homestead.harvestGarden(inv), true);
  homestead.restAtHomestead(player);
  assert.equal(homestead.wellRested, true);
  assert.equal(homestead.getBonuses().wellRestedHp, 25);
  homestead.recordBossTrophy('glacier-sovereign');
  assert.equal(homestead.trophyMeshes.get('glacier-sovereign').visible, true);

  // Guild Bounties: auto-track canonical events & claim rewards!
  const bounties = new BountySystem(events, inv, prog, journal);
  assert.equal(bounties.bounties.length, 4);
  const firstBounty = bounties.bounties[0];
  events.emit(firstBounty.event, { id: 'bramble-stalker' });
  events.emit(firstBounty.event, { id: 'bramble-stalker' });
  const goldBefore = inv.gold;
  assert.equal(bounties.claim(firstBounty.id), true);
  assert.ok(inv.gold > goldBefore, 'Claiming Guild Bounty pays Sunshards');
  assert.equal(bounties.completedCount, 1);
});
