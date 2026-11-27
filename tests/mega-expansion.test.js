// Full Mega-Expansion Verification Suite covering every deep RPG & open-world system:
//  - 52+ Items, 24 Recipes, 14 Creatures (4 Multi-Phase Bosses), 18 Quests
//  - 4-Spell Resonance Magic (Bolt projectile, Gale Updraft launch, Sunfire Nova burn, Spirit Ward heal)
//  - Rideable Wind Stag Mount (Sylph), Spirit Fishing Mini-Game (8 regional species)
//  - 7 Enterable 3D Sanctuaries (incl. Skywatch Astrolabe, Citadel Crypt, Heart Tree Hollow, Astral Spire)
//  - Dynamic World Events (Wandering Merchant Caravan, Meteoric Starfall Shard, Spirit Wisps)
//  - Companion Luma Familiar, 3-Branch 18-Skill Tree, Golden Perfect Parry & 3-Hit Combo
//  - Wayfarer's Codex (Bestiary, Lore Archive, 24 Achievements, 4 Regional Factions & Shop Discounts)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';

import { EventBus } from '../src/core/EventBus.js';
import { TerrainManager } from '../src/world/TerrainManager.js';
import { BiomeManager } from '../src/world/BiomeManager.js';
import { InteriorManager, INTERIORS } from '../src/world/InteriorManager.js';
import { MountSystem } from '../src/world/MountSystem.js';
import { FishingSystem, FISHING_SPOTS } from '../src/world/FishingSystem.js';
import { WorldEventsManager } from '../src/world/WorldEventsManager.js';
import { ParticleSystem } from '../src/world/ParticleSystem.js';

import { Player } from '../src/player/Player.js';
import { InventorySystem } from '../src/gameplay/InventorySystem.js';
import { CraftingSystem } from '../src/gameplay/CraftingSystem.js';
import { ProgressionSystem, SKILLS, SKILL_BRANCHES } from '../src/gameplay/ProgressionSystem.js';
import { QuestSystem } from '../src/gameplay/QuestSystem.js';
import { CombatSystem } from '../src/gameplay/CombatSystem.js';
import { MagicSystem, SPELLS } from '../src/gameplay/MagicSystem.js';
import { JournalSystem, ACHIEVEMENTS, FACTIONS } from '../src/gameplay/JournalSystem.js';

import { EnemyManager } from '../src/entities/EnemyManager.js';
import { CompanionSystem } from '../src/entities/CompanionSystem.js';

const itemsJson = JSON.parse(fs.readFileSync(new URL('../public/data/items/items.json', import.meta.url), 'utf8'));
const questsJson = JSON.parse(fs.readFileSync(new URL('../public/data/quests/quests.json', import.meta.url), 'utf8'));
const creaturesJson = JSON.parse(fs.readFileSync(new URL('../public/data/creatures/creatures.json', import.meta.url), 'utf8'));

test('Expanded catalogs deliver 50+ items, 24 recipes, 14 creatures (4 bosses), 18 quests & 18-skill 3-branch tree', () => {
  assert.ok(itemsJson.items.length >= 52, `Expected >=52 items, got ${itemsJson.items.length}`);
  assert.equal(itemsJson.recipes.length, 24);
  assert.equal(creaturesJson.creatures.length, 14);
  const bosses = creaturesJson.creatures.filter((c) => c.category === 'boss');
  assert.equal(bosses.length, 4);
  assert.equal(questsJson.quests.length, 18);
  assert.equal(SKILLS.length, 18);
  assert.equal(SKILL_BRANCHES.length, 3);
  assert.ok(INTERIORS.length >= 7, `Expected >=7 enterable sanctuaries/caves, got ${INTERIORS.length}`);
  assert.equal(SPELLS.length, 4);
  assert.equal(ACHIEVEMENTS.length, 24);
  assert.equal(FACTIONS.length, 4);
  assert.equal(FISHING_SPOTS.length, 6);

  // Verify every recipe's ingredients & result exist in items.json
  const idSet = new Set(itemsJson.items.map((i) => i.id));
  for (const r of itemsJson.recipes) {
    assert.ok(idSet.has(r.resultId), `Missing recipe result ${r.resultId}`);
    for (const ing of r.ingredients) {
      assert.ok(idSet.has(ing.itemId), `Missing ingredient ${ing.itemId} in ${r.id}`);
    }
  }
});

test('4-Spell Resonance Magic, 3-Hit Combo, Perfect Parry stagger & 4 Multi-Phase World Bosses work cleanly', () => {
  const scene = new THREE.Scene();
  const events = new EventBus();
  const terrain = new TerrainManager();
  const particles = new ParticleSystem(scene);
  const player = new Player(scene);
  const inv = new InventorySystem(itemsJson.items, events);
  const prog = new ProgressionSystem(events);
  const enemies = new EnemyManager(scene, terrain, creaturesJson.creatures, events);
  const combat = new CombatSystem(player, enemies, inv, prog, events);
  const magic = new MagicSystem(scene, terrain, events);
  combat.attachMagic(magic);

  // Confirm all 4 World Bosses spawned
  const spawnedBosses = enemies.enemies.filter((e) => e.def.category === 'boss');
  assert.equal(spawnedBosses.length, 4);

  // Place player near Glacier Sovereign boss and verify Phase II trigger below 50% HP
  const glacierBoss = spawnedBosses.find((e) => e.def.id === 'glacier-sovereign');
  assert.ok(glacierBoss);
  player.root.position.set(glacierBoss.homeX, terrain.getHeight(glacierBoss.homeX, glacierBoss.homeZ), glacierBoss.homeZ + 3.5);
  player.facingYaw = Math.PI;
  assert.equal(enemies.getActiveBoss(player.root.position)?.def.id, 'glacier-sovereign');

  // Cast Resonance Bolt [1]
  const boltRes = magic.cast('resonance-bolt', { player, enemies, inventory: inv, progression: prog, combat, particles });
  assert.equal(boltRes.ok, true);
  assert.equal(magic.projectiles.length, 1);

  // Cast Sunfire Nova [3] — damages Glacier Sovereign (weak to sunfire 1.45x!) and applies burn
  player.stamina = 100;
  const hpBefore = glacierBoss.hp;
  const novaRes = magic.cast('sunfire-nova', { player, enemies, inventory: inv, progression: prog, combat, particles });
  assert.equal(novaRes.ok, true);
  assert.ok(glacierBoss.hp < hpBefore);
  assert.ok(glacierBoss.burnTimer > 0);

  // Push boss under 50% HP to verify Phase II enrage
  enemies.damageEnemy(glacierBoss, glacierBoss.hp - Math.floor(glacierBoss.def.maxHp * 0.4), player.root.position);
  assert.equal(glacierBoss.phase, 2);

  // Cast Spirit Ward [4] — restores HP and raises 50% damage ward
  player.hp = 50;
  player.stamina = 100;
  const mendRes = magic.cast('spirit-mend', { player, enemies, inventory: inv, progression: prog, combat, particles });
  assert.equal(mendRes.ok, true);
  assert.ok(player.hp > 50);
  assert.equal(magic.hasWard(), true);

  // Cast Gale Updraft [2] — launches Aelira skyward into glide
  player.stamina = 100;
  const galeRes = magic.cast('gale-updraft', { player, enemies, inventory: inv, progression: prog, combat, particles });
  assert.equal(galeRes.ok, true);
  assert.equal(player.gliding, true);
  assert.ok(player.velocity.y >= 14);

  // Verify Golden Perfect Parry staggers attacker and takes 0 damage
  player.guarding = true;
  combat.update(0.016, {});
  const hpPreParry = player.hp;
  let parried = false;
  events.on('combat:parry', () => { parried = true; });
  combat.damagePlayer(30, glacierBoss.mesh.position, glacierBoss);
  assert.equal(parried, true);
  assert.equal(player.hp, hpPreParry);
  assert.ok(glacierBoss.staggerTimer >= 2.0);
});

test('Wind Stag Mount, Spirit Fishing Mini-Game, Companion Luma, 7 Sanctuaries, World Events & Codex integrate end-to-end', () => {
  const scene = new THREE.Scene();
  const events = new EventBus();
  const terrain = new TerrainManager();
  const biomes = new BiomeManager();
  const particles = new ParticleSystem(scene);
  const player = new Player(scene);
  const inv = new InventorySystem(itemsJson.items, events);
  const prog = new ProgressionSystem(events);
  const quests = new QuestSystem(questsJson.quests, inv, prog, events);
  const journal = new JournalSystem(events, creaturesJson, inv, prog);
  const mount = new MountSystem(scene, terrain, events);
  const fishing = new FishingSystem(scene, terrain, biomes, events);
  const companion = new CompanionSystem(scene);
  const worldEvents = new WorldEventsManager(scene, terrain, events);
  const dummyTex = { stoneMap: null, woodMap: null };
  const interiors = new InteriorManager(scene, terrain, dummyTex, events);

  // 1. Summon Sylph the Wind Stag at Crossroads
  player.root.position.set(4, terrain.getHeight(4, 398), 398);
  const mOn = mount.toggleMount(player, { particles });
  assert.equal(mOn.mounted, true);
  mount.update(0.05, 1.0, player, particles);
  assert.ok(journal.achievements.has('ach-wind-stag'));
  mount.dismount(player);

  // 2. Spirit Fishing Mini-Game at Tidehaven Pier
  player.root.position.set(1196, terrain.getHeight(1196, 1185), 1185);
  const castRes = fishing.startCast(player, { particles });
  assert.equal(castRes.ok, true);
  // Advance past wait timer into reeling
  fishing.update(2.5, 2.5, player);
  assert.equal(fishing.state, 'reeling');
  // Place cursor squarely in golden sweet spot and reel to 100%
  fishing.cursor = 0.5;
  let caughtRes = null;
  for (let i = 0; i < 4; i++) {
    fishing.cursor = 0.5;
    caughtRes = fishing.reelAction(player, { inventory: inv, progression: prog, particles });
    if (caughtRes.caught) break;
  }
  assert.equal(caughtRes?.caught, true);
  assert.equal(fishing.totalCaught, 1);
  assert.ok(journal.achievements.has('ach-angler-1'));

  // 3. Enter Skywatch Astrolabe Sanctum (new 3D interior #4)
  assert.equal(interiors.enter('skywatch-sanctum', player, null), true);
  assert.equal(interiors.currentInterior.id, 'skywatch-sanctum');
  assert.ok(journal.achievements.has('ach-sanctuary-1'));
  assert.equal(interiors.openChest('skywatch-sanctum', inv, prog), true);
  assert.ok(inv.getCount('starfall-shard') >= 1);
  interiors.exit(player, null);

  // 4. Claim Meteoric Starfall Shard + Companion Luma secret detection
  const sfPos = worldEvents.activeStarfall.pos.clone();
  player.root.position.set(sfPos.x, sfPos.y, sfPos.z + 5);
  companion.update(0.1, 1.0, player, { secretTarget: sfPos });
  assert.equal(companion.alertSecret, true);
  const sfClaim = worldEvents.claimStarfall(inv, prog, particles);
  assert.ok(sfClaim);
  assert.ok(journal.achievements.has('ach-starfall'));

  // 5. Verify Faction Reputation discount & 3-branch skill unlock
  journal.addReputation('crossroads-guild', 140);
  assert.equal(journal.getMerchantDiscount('crossroads-guild'), 0.25);
  assert.equal(prog.unlockSkill('crystal-channeling', inv, player), true);
  assert.equal(prog.getSpellPowerBonus(), 14);
  assert.ok(quests.listAll().active.length >= 4);
});
