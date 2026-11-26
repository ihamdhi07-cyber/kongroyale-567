import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';

import { EventBus } from '../src/core/EventBus.js';
import { SceneManager } from '../src/core/SceneManager.js';
import { QUALITY_PRESETS } from '../src/core/Renderer.js';
import { WORLD_CONFIG } from '../src/world/WorldSpec.js';
import { TerrainManager } from '../src/world/TerrainManager.js';
import { WaterSystem } from '../src/world/WaterSystem.js';
import { WeatherSystem } from '../src/world/WeatherSystem.js';
import { VegetationSystem } from '../src/world/VegetationSystem.js';
import { ChunkManager } from '../src/world/ChunkManager.js';
import { LandmarkBuilder } from '../src/world/LandmarkBuilder.js';
import { Player } from '../src/player/Player.js';
import { PlayerAnimation } from '../src/player/PlayerAnimation.js';
import { PlayerController } from '../src/player/PlayerController.js';
import { PlayerInteraction } from '../src/player/PlayerInteraction.js';
import { CameraController } from '../src/camera/CameraController.js';
import { InventorySystem } from '../src/gameplay/InventorySystem.js';
import { ProgressionSystem } from '../src/gameplay/ProgressionSystem.js';
import { ExplorationSystem } from '../src/gameplay/ExplorationSystem.js';
import { CombatSystem } from '../src/gameplay/CombatSystem.js';
import { PuzzleSystem } from '../src/gameplay/PuzzleSystem.js';
import { NPCManager } from '../src/entities/NPCManager.js';
import { WildlifeManager } from '../src/entities/WildlifeManager.js';
import { EnemyManager } from '../src/entities/EnemyManager.js';

const itemsJson = JSON.parse(fs.readFileSync(new URL('../public/data/items/items.json', import.meta.url), 'utf8'));
const creaturesJson = JSON.parse(fs.readFileSync(new URL('../public/data/creatures/creatures.json', import.meta.url), 'utf8'));

test('Full 3D world, chunk streaming, landmarks, player, camera, entities, combat & puzzles simulate cleanly for 30 frames', () => {
  const events = new EventBus();
  const sceneManager = new SceneManager();
  const terrain = new TerrainManager(WORLD_CONFIG.SEED);
  const dummyTex = new THREE.DataTexture(new Uint8Array([180, 180, 180, 255]), 1, 1);
  const textures = {
    paperGrain: dummyTex,
    terrainMap: dummyTex,
    terrainNormal: dummyTex,
    stoneMap: dummyTex,
    woodMap: dummyTex,
    barkMap: dummyTex,
  };

  const vegetation = new VegetationSystem(terrain, textures);
  const chunks = new ChunkManager(sceneManager.scene, terrain, textures, vegetation, QUALITY_PRESETS.medium);
  const water = new WaterSystem(sceneManager.scene);
  const weather = new WeatherSystem(sceneManager);
  const landmarks = new LandmarkBuilder(sceneManager.scene, terrain, textures);
  chunks.primeAround(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);

  // Verify chunks & landmarks populated scene graph
  assert.ok(chunks.getStats().total > 0, 'Chunks must stream around spawn');
  assert.ok(landmarks.waystoneMeshes.size >= 8, 'All 8 regional waystones must exist');
  assert.ok(landmarks.colliders.length > 0, 'Architecture colliders must be registered');

  // Exact same facade shape as WorldManager
  const worldFacade = {
    terrain,
    water,
    weather,
    chunks,
    landmarks,
    textures,
    getNearbyColliders(x, z, radius = 9) {
      const list = chunks.getNearbyColliders(x, z, radius);
      const r2 = (radius + 10) * (radius + 10);
      for (const c of landmarks.colliders) {
        const dx = c.x - x;
        const dz = c.z - z;
        if (dx * dx + dz * dz <= r2) list.push(c);
      }
      return list;
    },
    getUpdraftLiftAt(pos) {
      for (const u of landmarks.updrafts) {
        const d = Math.hypot(pos.x - u.x, pos.z - u.z);
        if (d <= u.radius && pos.y >= u.y - 2 && pos.y <= u.y + u.height) return u.lift;
      }
      return 0;
    },
  };

  const player = new Player(sceneManager.scene);
  const cam = new CameraController(terrain);
  const ctrl = new PlayerController(player, worldFacade, cam, events);
  ctrl.teleport(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);
  const anim = new PlayerAnimation(player);
  const interact = new PlayerInteraction(player, worldFacade, events);

  const inventory = new InventorySystem(itemsJson.items, events);
  const progression = new ProgressionSystem(events);
  const exploration = new ExplorationSystem(events, progression);
  const puzzles = new PuzzleSystem(sceneManager.scene, terrain, textures, inventory, progression, events);
  const npcs = new NPCManager(sceneManager.scene, terrain, events);
  const wildlife = new WildlifeManager(sceneManager.scene, terrain);
  const enemies = new EnemyManager(sceneManager.scene, terrain, creaturesJson.creatures, events);
  const combat = new CombatSystem(player, enemies, inventory, progression, events);

  interact.registerProvider((p) => npcs.getInteractables(p));
  interact.registerProvider((p) => puzzles.getInteractables(p));
  interact.registerProvider((p) => wildlife.getInteractables(p));

  const mockInput = {
    moveX: 0.4,
    moveY: 0.9,
    sprint: true,
    jump: false,
    guard: false,
    dodgePressed: false,
    attackPressed: false,
    heavyPressed: false,
    interactPressed: false,
    camYawDelta: 0.01,
    camPitchDelta: 0,
    camZoomDelta: 0,
  };

  for (let frame = 0; frame < 30; frame++) {
    const dt = 1 / 60;
    const elapsed = frame * dt;
    mockInput.jump = frame === 5 || (frame >= 10 && frame <= 14);
    mockInput.attackPressed = frame === 18;
    mockInput.dodgePressed = frame === 22;

    ctrl.update(dt, mockInput);
    combat.update(dt, mockInput);
    interact.update();
    exploration.update(player.root.position, cam);
    anim.update(dt, elapsed);
    cam.update(dt, player.root.position, mockInput);
    const region = terrain.biomes.getRegionAt(player.root.position.x, player.root.position.z);
    const env = weather.update(dt, elapsed, player.root.position, region, player.root.position.y);
    water.update(dt, elapsed, player.root.position, env);
    chunks.update(player.root.position);
    landmarks.update(dt, elapsed);
    puzzles.update(dt, elapsed);
    npcs.update(dt, elapsed, player.root.position, weather.timeOfDay);
    wildlife.update(dt, elapsed, player.root.position, player.horizontalSpeed);
    enemies.update(dt, elapsed, player.root.position, cam.camera, combat);
  }

  assert.ok(Number.isFinite(player.root.position.x) && Number.isFinite(player.root.position.y));
  assert.ok(Number.isFinite(cam.camera.position.x) && Number.isFinite(cam.camera.position.y));
  assert.ok(Math.hypot(player.root.position.x - WORLD_CONFIG.SPAWN_POS.x, player.root.position.z - WORLD_CONFIG.SPAWN_POS.z) > 1, 'Player must move smoothly across terrain');

  // Verify Silver River Bridge deck keeps player cleanly above water at (80, 361)
  ctrl.teleport(80, 361);
  assert.ok(player.root.position.y >= 2.25, `Bridge deck height must keep player above water, got ${player.root.position.y}`);

  // Verify 8x8 km chunk streaming unloads far chunks cleanly when fast-traveling 2.5 km across continent
  const beforeChunks = chunks.getStats().total;
  ctrl.teleport(1780, -1820);
  chunks.primeAround(1780, -1820);
  chunks.update(player.root.position);
  // Trigger unload by stepping one chunk over
  ctrl.teleport(1780 + 140, -1820);
  chunks.update(player.root.position);
  const afterChunks = chunks.getStats().total;
  assert.ok(afterChunks > 0 && afterChunks <= 85, `Chunk count must remain bounded after teleporting 2.5 km (got ${afterChunks}, before ${beforeChunks})`);

  // Verify 3D Singing Obelisk puzzle solves when activated in harmonic order 0 -> 1 -> 2
  const obeliskTargets = puzzles
    .getInteractables({ x: -115, z: 305 })
    .filter((it) => it.puzzleId === 'crossroads-obelisks')
    .sort((a, b) => a.idx - b.idx);
  assert.equal(obeliskTargets.length, 3, 'All 3 singing obelisk interactables must exist');
  let puzzleSolved = false;
  events.on('puzzle:solve:crossroads-obelisks', () => { puzzleSolved = true; });
  for (const t of obeliskTargets) puzzles.handleInteract(t, player.root.position);
  assert.equal(puzzleSolved, true, 'Singing Obelisks puzzle must solve on order 0->1->2');
  assert.ok(puzzles.solved.has('crossroads-obelisks'));
});
