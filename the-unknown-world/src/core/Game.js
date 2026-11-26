// Main Game Orchestrator wiring every subsystem of THE UNKNOWN WORLD together cleanly.
import { EventBus } from './EventBus.js';
import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { AssetManager } from './AssetManager.js';

import { WORLD_CONFIG, getLandmarkById } from '../world/WorldSpec.js';
import { WorldManager } from '../world/WorldManager.js';

import { Player } from '../player/Player.js';
import { PlayerAnimation } from '../player/PlayerAnimation.js';
import { PlayerController } from '../player/PlayerController.js';
import { PlayerInteraction } from '../player/PlayerInteraction.js';
import { CameraController } from '../camera/CameraController.js';

import { InventorySystem } from '../gameplay/InventorySystem.js';
import { CraftingSystem } from '../gameplay/CraftingSystem.js';
import { ProgressionSystem } from '../gameplay/ProgressionSystem.js';
import { ExplorationSystem } from '../gameplay/ExplorationSystem.js';
import { QuestSystem } from '../gameplay/QuestSystem.js';
import { CombatSystem } from '../gameplay/CombatSystem.js';
import { PuzzleSystem } from '../gameplay/PuzzleSystem.js';

import { NPCManager } from '../entities/NPCManager.js';
import { WildlifeManager } from '../entities/WildlifeManager.js';
import { EnemyManager } from '../entities/EnemyManager.js';

import { InputManager } from '../controls/InputManager.js';
import { SaveManager } from '../save/SaveManager.js';
import { AudioManager } from '../audio/AudioManager.js';

import { MainMenu } from '../ui/MainMenu.js';
import { HUD } from '../ui/HUD.js';
import { MapUI } from '../ui/MapUI.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { QuestUI } from '../ui/QuestUI.js';
import { ProgressionUI } from '../ui/ProgressionUI.js';
import { DialogueUI } from '../ui/DialogueUI.js';
import { SettingsUI } from '../ui/SettingsUI.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.events = new EventBus();
    this.assets = new AssetManager();
    this.saveManager = new SaveManager();
    this.settings = this.saveManager.loadSettings();

    this.renderer = new Renderer(canvas, this.settings.quality);
    this.sceneManager = new SceneManager();
    this.audio = new AudioManager();

    this.started = false;
    this.activeModal = null;
    this._autoSaveTimer = 90;
  }

  async init() {
    this.data = await this.assets.loadGameData();

    // 1. World & Streaming Architecture
    this.world = new WorldManager(this.sceneManager, this.renderer.preset);
    this.world.prime(WORLD_CONFIG.SPAWN_POS);

    // 2. Protagonist, Camera & All-Device Controls
    this.player = new Player(this.sceneManager.scene);
    this.cameraController = new CameraController(this.world.terrain);
    this.playerController = new PlayerController(this.player, this.world, this.cameraController, this.events);
    this.playerController.teleport(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);
    this.playerAnim = new PlayerAnimation(this.player);
    this.interaction = new PlayerInteraction(this.player, this.world, this.events);
    this.input = new InputManager(this.canvas, this.events);

    // 3. Gameplay Systems
    this.inventory = new InventorySystem(this.data.items, this.events);
    this.crafting = new CraftingSystem(this.data.recipes, this.inventory, this.events);
    this.progression = new ProgressionSystem(this.events);
    this.exploration = new ExplorationSystem(this.events, this.progression);
    this.quests = new QuestSystem(this.data.quests, this.inventory, this.progression, this.events);
    this.puzzles = new PuzzleSystem(
      this.sceneManager.scene,
      this.world.terrain,
      this.world.textures,
      this.inventory,
      this.progression,
      this.events
    );

    // 4. Living World Entities
    this.npcs = new NPCManager(this.sceneManager.scene, this.world.terrain, this.events);
    this.wildlife = new WildlifeManager(this.sceneManager.scene, this.world.terrain);
    this.enemies = new EnemyManager(this.sceneManager.scene, this.world.terrain, this.data.creatures, this.events);
    this.combat = new CombatSystem(this.player, this.enemies, this.inventory, this.progression, this.events);

    this.inventory.applyStatsToPlayer(this.player, this.progression.getBonuses());

    // Register dynamic interaction providers
    this.interaction.registerProvider((pos) => this.npcs.getInteractables(pos));
    this.interaction.registerProvider((pos) => this.puzzles.getInteractables(pos));
    this.interaction.registerProvider((pos) => this.wildlife.getInteractables(pos));

    // 5. Studio UI Screens
    this.mainMenu = new MainMenu(this);
    this.hud = new HUD(this);
    this.mapUI = new MapUI(this);
    this.inventoryUI = new InventoryUI(this);
    this.questUI = new QuestUI(this);
    this.progressionUI = new ProgressionUI(this);
    this.dialogueUI = new DialogueUI(this);
    this.settingsUI = new SettingsUI(this);

    this._applySettings();
    this._bindEvents();

    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.cameraController.resize((window.innerWidth || 1280) / (window.innerHeight || 720));
    });

    // Unlock Web Audio cleanly on first interaction
    const unlockAudio = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Start live 3D loop (softly orbits Crossroads Settlement behind Title Screen)
    this.loop = new GameLoop((dt, elapsed) => this._tick(dt, elapsed));
    this.loop.start();
    this.mainMenu.showTitle();

    // Expose safe diagnostic hook for verification
    window.__tuw = {
      ready: true,
      worldConfig: WORLD_CONFIG,
      game: this,
    };
  }

  _applySettings() {
    this.audio.setMixer({
      master: this.settings.masterVol,
      music: this.settings.musicVol,
      sfx: this.settings.sfxVol,
      ambient: this.settings.ambientVol,
      muted: this.settings.muted,
    });
    this.hud.setTelemetryVisible(Boolean(this.settings.showFps));
    this._syncTouchVisibility();
  }

  _syncTouchVisibility() {
    const mode = this.settings.touchControls || 'auto';
    const wantTouch = mode === 'on' ? true : mode === 'off' ? false : this.input.touch.isTouchDevice;
    this.input.setTouchVisible(this.started && !this.activeModal && wantTouch);
  }

  _bindEvents() {
    this.events.on('toast', (t) => this.hud.showToast(t));
    this.events.on('discovery:banner', (b) => {
      this.hud.showDiscovery(b);
      this.audio.playDiscoveryFanfare();
    });
    this.events.on('player:step', ({ surface }) => this.audio.playFootstep(surface));
    this.events.on('player:jump', () => this.audio.playFootstep('grass'));
    this.events.on('combat:attack', ({ isHeavy }) => this.audio.playAttack(isHeavy));
    this.events.on('combat:playerHit', ({ blocked }) => this.audio.playHit(blocked));
    this.events.on('puzzle:note', ({ freq }) => this.audio.playPuzzleNote(freq));
    this.events.on('player:respawn', () => {
      this.playerController.teleport(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);
    });

    this.events.on('ui:toggle', (modal) => {
      if (!this.started) return;
      if (this.activeModal === modal) this.closeAllModals();
      else this.openModal(modal);
    });

    this.events.on('ui:escape', () => {
      if (!this.started) {
        if (this.activeModal) this.closeAllModals();
        return;
      }
      if (this.activeModal) this.closeAllModals();
      else this.openModal('pause');
    });

    this.events.on('player:interact', (target) => this._handleInteraction(target));
  }

  _handleInteraction(target) {
    if (target.type === 'gather') {
      if (typeof target.fishIndex === 'number') {
        this.wildlife.catchFish(target.fishIndex);
      } else {
        this.world.chunks.markGathered(target.id);
      }
      this.inventory.addItem(target.itemId, 1);
      const def = this.inventory.getDef(target.itemId);
      this.audio.playPickup();
      this.hud.showToast({ title: 'Gathered', text: `${def?.name || target.itemId} added to satchel` });
    } else if (target.type === 'waystone') {
      const wasNew = this.exploration.attuneWaystone(target.landmarkId);
      this.world.landmarks.setWaystoneAttuned(target.landmarkId);
      if (!wasNew) {
        this.openModal('map');
      }
    } else if (target.type === 'lore') {
      this.exploration.readLore.add(target.landmarkId);
      this.openModal('lore', target);
    } else if (target.type === 'campfire') {
      this.openModal('campfire');
    } else if (target.type === 'npc') {
      this.events.emit(`npc:talk:${target.npc.id}`, target.npc);
      this.openModal('dialogue', target.npc);
    } else if (target.type === 'puzzle') {
      this.puzzles.handleInteract(target, this.player.root.position);
    }
  }

  startNewGame() {
    this.audio.unlock();
    this.started = true;
    this.mainMenu.hideTitle();
    this.hud.setVisible(true);
    this.closeAllModals();
    this.playerController.teleport(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);
    this.hud.showDiscovery({
      subtitle: 'Verdant Valley · 8×8 km Open World',
      title: 'The Crossroads Settlement',
    });
  }

  async continueLatestSave() {
    const slots = await this.saveManager.listSlots();
    const latest = slots.filter((s) => s.exists).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
    if (latest) {
      await this.loadFromSlot(latest.slotId);
    } else {
      this.startNewGame();
    }
  }

  returnToTitle() {
    this.closeAllModals();
    this.started = false;
    this.hud.setVisible(false);
    this.input.setGameplayEnabled(false);
    this._syncTouchVisibility();
    this.mainMenu.showTitle();
  }

  openModal(name, payload = null) {
    this._hideModalPanels();
    this.activeModal = name;
    this.input.setGameplayEnabled(false);
    this._syncTouchVisibility();

    if (name === 'pause') this.mainMenu.setPauseVisible(true);
    else if (name === 'map') this.mapUI.open();
    else if (name === 'inventory') this.inventoryUI.open(payload || 'bag');
    else if (name === 'quests') this.questUI.open();
    else if (name === 'progression') this.progressionUI.open();
    else if (name === 'settings') this.settingsUI.open();
    else if (name === 'dialogue') this.dialogueUI.openNpc(payload);
    else if (name === 'lore') this.dialogueUI.openLore(payload.title, payload.lore);
    else if (name === 'campfire') this.dialogueUI.openCampfire();
  }

  _hideModalPanels() {
    this.mainMenu.setPauseVisible(false);
    this.mapUI.close();
    this.inventoryUI.close();
    this.questUI.close();
    this.progressionUI.close();
    this.dialogueUI.close();
    this.settingsUI.close();
  }

  closeAllModals() {
    this._hideModalPanels();
    this.activeModal = null;
    this.input.setGameplayEnabled(this.started);
    this._syncTouchVisibility();
  }

  fastTravelTo(landmarkId) {
    const lm = getLandmarkById(landmarkId);
    if (!lm) return;
    this.closeAllModals();
    this.playerController.teleport(lm.x + 12, lm.z + 10);
    this.world.chunks.primeAround(lm.x, lm.z);
    this.audio.playDiscoveryFanfare();
    this.hud.showDiscovery({ subtitle: 'Waystone Fast Travel', title: lm.name });
  }

  setQuality(level) {
    const preset = this.renderer.applyQuality(level);
    this.world.applyQuality(preset);
    this.settings.quality = level;
    this.saveManager.saveSettings(this.settings);
  }

  setTouchMode(mode) {
    this.settings.touchControls = mode;
    this.saveManager.saveSettings(this.settings);
    this._syncTouchVisibility();
  }

  setTelemetry(show) {
    this.settings.showFps = show;
    this.hud.setTelemetryVisible(show);
    this.saveManager.saveSettings(this.settings);
  }

  setAudioSettings({ master, music, sfx, ambient, muted }) {
    this.settings.masterVol = master;
    this.settings.musicVol = music;
    this.settings.sfxVol = sfx;
    this.settings.ambientVol = ambient;
    this.settings.muted = muted;
    this.audio.setMixer({ master, music, sfx, ambient, muted });
    this.saveManager.saveSettings(this.settings);
  }

  async saveToSlot(slotId, silent = false) {
    const pos = this.player.root.position;
    const payload = {
      regionName: this.world.currentRegion?.name || 'Verdant Valley',
      explorationPct: this.exploration.getExplorationPercent(),
      timeOfDay: this.world.weather.timeOfDay,
      player: {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        hp: this.player.hp,
        stamina: this.player.stamina,
        warmth: this.player.warmth,
      },
      inventory: this.inventory.getSnapshot(),
      progression: this.progression.getSnapshot(),
      quests: this.quests.getSnapshot(),
      exploration: this.exploration.getSnapshot(),
      puzzles: this.puzzles.getSnapshot(),
      gathered: [...this.world.chunks.collectedGatherables],
    };
    await this.saveManager.saveSlot(slotId, payload);
    if (!silent) {
      this.hud.showToast({ title: 'Expedition Saved', text: `Saved progress to ${slotId}` });
    }
  }

  async loadFromSlot(slotId) {
    const data = await this.saveManager.loadSlot(slotId);
    if (!data) return false;
    this.audio.unlock();
    this.started = true;
    this.mainMenu.hideTitle();
    this.hud.setVisible(true);

    this.world.chunks.collectedGatherables = new Set(data.gathered || []);
    this.playerController.teleport(data.player.x, data.player.z);
    this.world.chunks.primeAround(data.player.x, data.player.z);

    this.progression.loadSnapshot(data.progression);
    this.inventory.loadSnapshot(data.inventory, this.player, this.progression.getBonuses());
    this.player.hp = Math.min(this.player.maxHp, data.player.hp || this.player.maxHp);
    this.player.stamina = Math.min(this.player.maxStamina, data.player.stamina || this.player.maxStamina);
    this.player.warmth = Math.min(this.player.maxWarmth, data.player.warmth || this.player.maxWarmth);

    this.quests.loadSnapshot(data.quests);
    this.exploration.loadSnapshot(data.exploration);
    for (const wsId of this.exploration.attunedWaystones) {
      this.world.landmarks.setWaystoneAttuned(wsId);
    }
    this.puzzles.loadSnapshot(data.puzzles);
    if (typeof data.timeOfDay === 'number') {
      this.world.weather.timeOfDay = data.timeOfDay;
    }

    this.closeAllModals();
    this.hud.showDiscovery({ subtitle: 'Journey Restored', title: data.regionName || 'Verdant Valley' });
    return true;
  }

  _tick(dt, elapsed) {
    const livePlaying = this.started && !this.activeModal;
    const input = this.input.sample(dt);

    if (livePlaying) {
      this.playerController.update(dt, input);
      this.combat.update(dt, input);
      this.interaction.update();
      if (input.interactPressed) {
        this.interaction.interact();
      }
      this.exploration.update(this.player.root.position, this.cameraController);
      this.enemies.update(dt, elapsed, this.player.root.position, this.cameraController.camera, this.combat);

      // Periodic autosave every 90s while actively exploring
      this._autoSaveTimer -= dt;
      if (this._autoSaveTimer <= 0) {
        this._autoSaveTimer = 90;
        this.saveToSlot('autosave', true);
      }
    } else if (!this.started) {
      // Gentle scenic camera orbit over Crossroads Settlement behind Title Screen
      input.camYawDelta = -dt * 0.1;
    }

    this.playerAnim.update(dt, elapsed);
    this.cameraController.update(dt, this.player.root.position, input);
    this.world.update(dt, elapsed, this.player.root.position);
    this.puzzles.update(dt, elapsed);
    this.npcs.update(dt, elapsed, this.player.root.position, this.world.weather.timeOfDay);
    this.wildlife.update(dt, elapsed, this.player.root.position, this.player.horizontalSpeed);
    this.audio.update(dt, this.world.currentRegion, this.world.weather.weather);

    if (this.started) {
      this.hud.update(dt);
    }

    this.renderer.render(this.sceneManager.scene, this.cameraController.camera);
  }
}
