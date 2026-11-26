import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';

import { EventBus } from '../src/core/EventBus.js';
import { SceneManager } from '../src/core/SceneManager.js';
import { QUALITY_PRESETS } from '../src/core/Renderer.js';
import { LANDMARKS, WORLD_CONFIG } from '../src/world/WorldSpec.js';
import { TerrainManager } from '../src/world/TerrainManager.js';
import { VegetationSystem } from '../src/world/VegetationSystem.js';
import { ChunkManager } from '../src/world/ChunkManager.js';
import { LandmarkBuilder } from '../src/world/LandmarkBuilder.js';
import { ParticleSystem } from '../src/world/ParticleSystem.js';
import { BoatSystem } from '../src/world/BoatSystem.js';
import { InteriorManager } from '../src/world/InteriorManager.js';
import { Player } from '../src/player/Player.js';
import { PlayerController } from '../src/player/PlayerController.js';
import { PlayerInteraction } from '../src/player/PlayerInteraction.js';
import { CameraController } from '../src/camera/CameraController.js';
import { InventorySystem } from '../src/gameplay/InventorySystem.js';
import { CraftingSystem } from '../src/gameplay/CraftingSystem.js';
import { ProgressionSystem } from '../src/gameplay/ProgressionSystem.js';
import { QuestSystem } from '../src/gameplay/QuestSystem.js';
import { CombatSystem } from '../src/gameplay/CombatSystem.js';
import { PuzzleSystem } from '../src/gameplay/PuzzleSystem.js';
import { NPCManager } from '../src/entities/NPCManager.js';
import { WildlifeManager } from '../src/entities/WildlifeManager.js';
import { EnemyManager } from '../src/entities/EnemyManager.js';

const ROOT = path.resolve(import.meta.dirname, '..');

async function loadData() {
  const readJson = async (rel) => JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8'));
  const itemsDoc = await readJson('public/data/items/items.json');
  const questsDoc = await readJson('public/data/quests/quests.json');
  const creaturesDoc = await readJson('public/data/creatures/creatures.json');
  return {
    items: itemsDoc.items,
    recipes: itemsDoc.recipes,
    quests: questsDoc.quests,
    creatures: creaturesDoc.creatures,
  };
}

function makeMockTextures() {
  const mk = () => new THREE.DataTexture(new Uint8Array([200, 200, 200, 255]), 1, 1);
  return {
    paperGrain: mk(),
    terrainMap: mk(),
    terrainNormal: mk(),
    grassMap: mk(),
    grassBump: mk(),
    stoneMap: mk(),
    stoneBump: mk(),
    woodMap: mk(),
    barkMap: mk(),
    waterNormal: mk(),
    foliageCard: mk(),
  };
}

test('Economy, 24 items, 10 recipes, trading (buy/sell) & warmth gear bonuses work cleanly', async () => {
  const data = await loadData();
  assert.equal(data.items.length, 24);
  assert.equal(data.recipes.length, 10);

  const events = new EventBus();
  const inv = new InventorySystem(data.items, events);
  const craft = new CraftingSystem(data.recipes, inv, events);
  const player = {
    maxHp: 100,
    hp: 100,
    maxStamina: 100,
    stamina: 100,
    maxWarmth: 100,
    warmth: 100,
    attackPower: 16,
    defense: 4,
    warmthBonus: 10,
    speedMultiplier: 1.0,
    applyEquipmentVisuals() {},
  };

  assert.equal(inv.gold, 60);
  const stewBefore = inv.getCount('berry-stew');

  // Buying affordable item deducts Sunshards & adds item
  assert.equal(inv.buyItem('berry-stew', 20, 1), true);
  assert.equal(inv.gold, 40);
  assert.equal(inv.getCount('berry-stew'), stewBefore + 1);

  // Buying unaffordable item fails safely
  assert.equal(inv.buyItem('galeblade-staff', 999, 1), false);
  assert.equal(inv.gold, 40);

  // Selling item returns positive Sunshards & removes 1 unit
  inv.addItem('sunken-pearl', 2);
  const payout = inv.sellItem('sunken-pearl', 1);
  assert.ok(payout >= 30, `Expected sunken-pearl payout >= 30, got ${payout}`);
  assert.equal(inv.getCount('sunken-pearl'), 1);

  // Crafting Frostcrest Alpine Coat & equipping applies warmthBonus + defense
  inv.addItem('frostbloom', 2);
  inv.addItem('heartwood', 2);
  inv.addItem('sunken-pearl', 1);
  const crafted = craft.craft('craft-frostward-coat');
  assert.equal(crafted, true);
  inv.equip('frostward-coat', player, {});
  assert.equal(player.warmthBonus, 55);
  assert.equal(player.defense, 14);
});

test('All 8 quests load, gold rewards grant, and Echoes chains into Awakening the Horizon climax', async () => {
  const data = await loadData();
  assert.equal(data.quests.length, 8);

  const events = new EventBus();
  const inv = new InventorySystem(data.items, events);
  const prog = new ProgressionSystem(events);
  const quests = new QuestSystem(data.quests, inv, prog, events);

  const startGold = inv.gold;
  events.emit('npc:talk:elder-maren');
  events.emit('landmark:discover:ancient-heart-tree');
  events.emit('puzzle:solve:crossroads-obelisks');
  events.emit('waystone:activate');
  events.emit('waystone:activate');
  events.emit('waystone:activate');
  events.emit('landmark:discover:unknown-gate');

  assert.ok(quests.completed.has('echoes-of-the-gate'), 'Main quest should complete');
  assert.ok(inv.getCount('resonance-key') >= 1, 'Should grant Key of the Unknown Gate');
  assert.ok(inv.gold > startGold, 'Should award Sunshards gold on quest completion');
  assert.ok(quests.active.has('awakening-the-horizon'), 'Climax quest should auto-activate on Echoes completion');

  // Complete climax quest via Elder Warden defeat + Unknown Gate awakening
  events.emit('enemy:defeat:elder-warden');
  events.emit('gate:awaken');
  assert.ok(quests.completed.has('awakening-the-horizon'), 'Climax quest should complete');

  // Verify Hidden Sanctuaries quest tracks unique sanctuary entries + generic boss defeat
  events.emit('interior:enter');
  events.emit('interior:enter');
  events.emit('boss:defeat');
  assert.ok(quests.completed.has('secrets-of-the-sanctuaries'), 'Hidden Sanctuaries quest should complete');
});

test('All 4 outposts, 10 NPCs + 3 shops, 8 puzzles, 3 boats, 3 interiors, stealth ambush & 2 bosses integrate cleanly', async () => {
  const data = await loadData();
  const itemIds = new Set(data.items.map((i) => i.id));
  const events = new EventBus();
  const sm = new SceneManager();

  const textures = makeMockTextures();
  const terrain = new TerrainManager();
  const vegetation = new VegetationSystem(terrain, textures);
  const particles = new ParticleSystem(sm.scene);
  const chunks = new ChunkManager(sm.scene, terrain, textures, vegetation, QUALITY_PRESETS.medium);
  const landmarks = new LandmarkBuilder(sm.scene, terrain, textures);
  const boats = new BoatSystem(sm.scene, terrain, textures, particles, events);
  const interiors = new InteriorManager(sm.scene, terrain, textures, events);

  const world = {
    terrain,
    chunks,
    landmarks,
    particles,
    boats,
    interiors,
    weather: { weather: 'clear', timeOfDay: 10 },
    currentRegion: terrain.biomes.getRegionAt(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z),
  };

  // 1. Secondary outposts present & harbor ground valid
  for (const id of ['tidehaven-harbor', 'timberwatch-outpost', 'frostcrest-basecamp', 'ashen-caravan']) {
    const lm = LANDMARKS.find((l) => l.id === id);
    assert.ok(lm, `Missing secondary outpost ${id}`);
  }

  // 2. 10 Regional NPCs + 3 valid merchant shops (every shop item exists in items.json)
  const npcs = new NPCManager(sm.scene, terrain, events);
  assert.equal(npcs.npcs.length, 10);
  const merchants = npcs.npcs.filter((n) => Array.isArray(n.def.shop) && n.def.shop.length > 0);
  assert.equal(merchants.length, 3);
  for (const m of merchants) {
    for (const entry of m.def.shop) {
      assert.ok(itemIds.has(entry.itemId), `Merchant ${m.def.id} sells unknown item ${entry.itemId}`);
    }
  }

  // 3. 14 Deer herds & 12 River/Coastal fish
  const wildlife = new WildlifeManager(sm.scene, terrain);
  assert.equal(wildlife.deer.length, 14);
  assert.equal(wildlife.fish.length, 12);

  // 4. All 8 regional environmental puzzles + valid reward items + Azure Coast Tide Sluice valve puzzle
  const inv = new InventorySystem(data.items, events);
  const prog = new ProgressionSystem(events);
  const puzzles = new PuzzleSystem(sm.scene, terrain, textures, inv, prog, events);
  assert.equal(puzzles.puzzles.length, 8);
  for (const pz of puzzles.puzzles) {
    for (const rew of pz.reward?.items || []) {
      assert.ok(itemIds.has(rew.itemId), `Puzzle ${pz.id} references unknown reward item ${rew.itemId}`);
    }
  }
  const sluice = puzzles.puzzles.find((p) => p.id === 'azure-tide-sluice');
  assert.ok(sluice && sluice.kind === 'sluice');
  const goldBefore = inv.gold;
  for (let i = 0; i < 3; i++) {
    puzzles.handleInteract({ puzzleId: 'azure-tide-sluice', idx: i }, new THREE.Vector3(sluice.cx, 2, sluice.cz));
  }
  assert.ok(puzzles.solved.has('azure-tide-sluice'), 'Tide Sluice puzzle should solve after opening 3 valves');
  assert.ok(inv.gold > goldBefore, 'Solving puzzle should grant Sunshards');

  // 5. Sailing & Sunken Seabed Treasures (valid itemIds + smooth water travel)
  const player = new Player(sm.scene);
  const cam = new CameraController(terrain);
  const ctrl = new PlayerController(player, world, cam, events);
  const interaction = new PlayerInteraction(player, world, events);
  interaction.registerProvider((pos) => interiors.getInteractables(pos));
  interaction.registerProvider((pos) => boats.getInteractables(pos));

  assert.equal(boats.boats.length, 3);
  assert.equal(boats.treasures.length, 5);
  for (const b of boats.boats) {
    assert.ok(terrain.getHeight(b.x, b.z) < -0.5, `Boat ${b.id} must spawn on navigable water`);
  }
  for (const t of boats.treasures) {
    assert.ok(itemIds.has(t.itemId), `Sunken treasure ${t.id} references unknown itemId ${t.itemId}`);
    assert.ok(terrain.getHeight(t.x, t.z) < -2.5, `Sunken treasure ${t.id} must rest on underwater seabed`);
  }
  assert.equal(boats.boardBoat('boat-tidehaven', player), true);
  assert.equal(player.sailing, true);
  const startBoatX = boats.activeBoat.group.position.x;
  const startBoatZ = boats.activeBoat.group.position.z;
  for (let i = 0; i < 20; i++) {
    boats.update(1 / 30, i / 30, player, { moveX: 0, moveY: 1, sprint: false });
  }
  const sailedDist = Math.hypot(
    boats.activeBoat.group.position.x - startBoatX,
    boats.activeBoat.group.position.z - startBoatZ
  );
  assert.ok(sailedDist > 1.0, `Expected boat to sail forward across sea, moved ${sailedDist}`);
  assert.equal(boats.disembark(player), true);
  assert.equal(player.sailing, false);

  const recovered = boats.collectTreasure('pearl-archive-north');
  assert.ok(recovered && boats.collectedTreasures.has('pearl-archive-north'));

  // 6. Enterable 3D Sanctuaries + isolated indoor interaction
  assert.equal(interiors.enter('elders-hall', player, cam), true);
  assert.ok(player.root.position.y >= 599, 'Player should move inside elevated 3D sanctuary room');
  assert.equal(cam.indoorMode, true);
  assert.equal(interiors.openChest('elders-hall', inv, prog), true);
  assert.equal(interiors.openChest('elders-hall', inv, prog), false, 'Chest cannot be opened twice');

  // Walk near indoor exit threshold & verify ONLY interior interactables appear
  const room = interiors.currentInterior;
  player.root.position.set(room.roomX, room.roomY, room.roomZ + room.halfD - 1.2);
  const indoorTarget = interaction.update();
  assert.ok(indoorTarget && indoorTarget.type === 'interior-exit');
  assert.equal(interiors.exit(player, cam), true);
  assert.equal(cam.indoorMode, false);

  // 7. Two Guardian Bosses & Stealth 1.75x Ambush Strike + Hit-Stop
  const enemies = new EnemyManager(sm.scene, terrain, data.creatures, events);
  const bossIds = enemies.enemies.filter((e) => e.def.category === 'boss').map((e) => e.def.id);
  assert.ok(bossIds.includes('mossback-colossus'), 'Mossback Colossus boss missing');
  assert.ok(bossIds.includes('elder-warden'), 'Elder Stone Warden boss missing');

  const boss = enemies.enemies.find((e) => e.def.id === 'mossback-colossus');
  assert.ok(enemies.getActiveBoss(boss.mesh.position) === boss);

  const combat = new CombatSystem(player, enemies, inv, prog, events);
  const targetEnemy = enemies.enemies.find((e) => e.def.category !== 'boss' && e.alive);
  targetEnemy.state = 'patrol';
  player.root.position.set(targetEnemy.mesh.position.x, targetEnemy.mesh.position.y, targetEnemy.mesh.position.z + 2.2);
  player.facingYaw = Math.PI;
  player.stealth = true;

  let ambushHit = null;
  events.on('combat:hit', (ev) => {
    ambushHit = ev;
  });
  combat.update(1 / 30, { attackPressed: true, heavyAttackPressed: false, guard: false });
  assert.ok(ambushHit && ambushHit.isAmbush === true, 'Stealth attack on unaware enemy should trigger 1.75x Ambush');
  assert.ok(combat.hitStopTimer > 0, 'Ambush strike should trigger tactile hit-stop timer');

  // 8. Unknown Gate Awakening visual climax runs cleanly
  landmarks.awakenUnknownGate();
  assert.ok(landmarks.unknownGateState?.awakened === true);

  // Verify Tidehaven Harbor pier deck elevation & teleport ground elevation
  assert.ok(ctrl._groundHeightAt(1194, 1170) >= 3.4, 'Tidehaven Harbor pier walkway should stand above sea level');
  ctrl.teleport(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);
  assert.ok(Number.isFinite(player.root.position.y));
});
