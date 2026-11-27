// Personal Wayfarer's Homestead Sanctuary & Boss Trophy Hall overlooking Crossroads Village:
// Builds a real customizable 3D cottage at (-31, 376) that visibly transforms as you construct
// 8 upgrades (Herb Garden, Arcane Rune Anvil, Wind Stag Pavilion, Alchemy Bench, Cartographer's Globe,
// Starlight Hearth w/ Well-Rested +25 Max HP & SP buff, Spirit Lantern Porch, and Golden Boss Trophies!).
import * as THREE from 'three';
import { patchWatercolorMaterial } from './WatercolorShader.js';

export const HOMESTEAD_POS = { x: -31, z: 376 };

export const HOMESTEAD_UPGRADES = [
  {
    id: 'herb-garden',
    name: 'Sunberry & Moonpetal Garden',
    icon: '❀',
    goldCost: 50,
    materials: [{ id: 'sunberry', qty: 2 }],
    bonusText: 'Grows fresh Golden Sunberries & Silver Moonpetals outside your cottage (free harvest!).',
  },
  {
    id: 'arcane-forge',
    name: 'Arcane Rune Anvil',
    icon: '⚒',
    goldCost: 75,
    materials: [{ id: 'crystal-shard', qty: 1 }],
    bonusText: '+12% permanent Wayfarer Attack Power & unlocks personal Rune Infusion smithing.',
  },
  {
    id: 'stag-stable',
    name: 'Sylph Wind Stag Pavilion',
    icon: '❖',
    goldCost: 80,
    materials: [{ id: 'heartwood', qty: 2 }],
    bonusText: '+15% Wind Stag gallop speed & instant full stamina restoration when resting home.',
  },
  {
    id: 'alchemy-bench',
    name: "Alchemist's Distillation Bench",
    icon: '⚗',
    goldCost: 70,
    materials: [{ id: 'moonpetal', qty: 2 }],
    bonusText: '+30% potion healing & hearth meal warmth efficiency across all regions.',
  },
  {
    id: 'cartographer-globe',
    name: "Brass Cartographer's Globe",
    icon: '◎',
    goldCost: 90,
    materials: [{ id: 'crystal-shard', qty: 2 }],
    bonusText: '+20% bonus XP on all discoveries, landmarks, and Shrine Trials.',
  },
  {
    id: 'starlight-hearth',
    name: 'Starlight Hearth Sanctuary',
    icon: '✦',
    goldCost: 95,
    materials: [{ id: 'heartwood', qty: 2 }],
    bonusText: 'Resting at your Homestead grants Well-Rested (+25 Max HP & +25 Max SP)!',
  },
  {
    id: 'lantern-porch',
    name: 'Spirit Lantern Porch & Pennants',
    icon: '☀',
    goldCost: 65,
    materials: [{ id: 'sunberry', qty: 1 }],
    bonusText: 'Adorns your Homestead exterior with luminous Spirit Lanterns & golden festival roof pennants.',
  },
  {
    id: 'trophy-hall',
    name: 'Legendary Boss Trophy Pedestals',
    icon: '♛',
    goldCost: 110,
    materials: [{ id: 'crystal-shard', qty: 2 }],
    bonusText: 'Erects 4 golden pedestals beside your cottage displaying sculpted trophies for every defeated World Boss!',
  },
];

export class HomesteadSystem {
  constructor(scene, terrain, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.events = eventBus;

    this.built = new Set();
    this.wellRested = false;
    this.gardenReady = true;
    this.gardenCooldown = 0;
    this.bossTrophies = new Set();

    this.root = new THREE.Group();
    this.root.name = 'wayfarer-homestead';
    const y = terrain.getHeight(HOMESTEAD_POS.x, HOMESTEAD_POS.z);
    this.y = y;
    this.root.position.set(HOMESTEAD_POS.x, y, HOMESTEAD_POS.z);
    scene.add(this.root);

    this.moduleGroups = new Map();
    this.trophyMeshes = new Map();
    this._buildCottageAndModules();
  }

  _buildCottageAndModules() {
    const plasterMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0xf7eed8, roughness: 0.86 }));
    const woodMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0x8f623d, roughness: 0.84 }));
    const roofMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0x3b6e84, roughness: 0.78 }), { rimStrength: 0.3 });
    const stoneMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0xc8c0ae, roughness: 0.88 }));
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffa62e, emissiveIntensity: 0.8, metalness: 0.45, roughness: 0.25 });

    // Base Wayfarer's Homestead Cottage overlooking Crossroads Settlement
    const cottage = new THREE.Group();
    cottage.rotation.y = 0.65;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.75, 6.4), stoneMat);
    plinth.position.y = 0.38;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.8, 5.8), plasterMat);
    walls.position.y = 2.6;
    walls.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.9, 3.5, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 6.2;
    roof.castShadow = true;
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.25, 0.2), woodMat);
    door.position.set(0, 1.85, 2.95);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.12), goldMat);
    sign.position.set(0, 3.45, 3.02);
    cottage.add(plinth, walls, roof, door, sign);
    this.root.add(cottage);

    // 1. Herb Garden raised planter bed
    const garden = new THREE.Group();
    garden.position.set(5.6, 0, 2.6);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 2.1), woodMat);
    bed.position.y = 0.28;
    const soil = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.12, 1.8), new THREE.MeshStandardMaterial({ color: 0x4c3a2a, roughness: 0.95 }));
    soil.position.y = 0.54;
    garden.add(bed, soil);
    const herbColors = [0xffcf45, 0x9cf0ff, 0x52b868, 0xf27d8b];
    for (let i = 0; i < 6; i++) {
      const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({ color: herbColors[i % herbColors.length], roughness: 0.7 })
      );
      bush.position.set(-1.1 + (i % 3) * 1.1, 0.82, i < 3 ? -0.45 : 0.45);
      garden.add(bush);
    }
    garden.visible = false;
    this.root.add(garden);
    this.moduleGroups.set('herb-garden', garden);

    // 2. Arcane Rune Anvil
    const forge = new THREE.Group();
    forge.position.set(-5.2, 0, 2.5);
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 0.7), new THREE.MeshStandardMaterial({ color: 0x495364, metalness: 0.6, roughness: 0.4 }));
    anvil.position.y = 0.45;
    const runeCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      new THREE.MeshStandardMaterial({ color: 0x7ef2ff, emissive: 0x2ec8e8, emissiveIntensity: 1.4 })
    );
    runeCrystal.position.y = 1.55;
    forge.add(anvil, runeCrystal);
    forge.visible = false;
    this.root.add(forge);
    this.moduleGroups.set('arcane-forge', forge);

    // 3. Wind Stag Pavilion
    const stable = new THREE.Group();
    stable.position.set(5.4, 0, -4.4);
    for (const [px, pz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.8, 6), woodMat);
      p.position.set(px, 1.4, pz);
      stable.add(p);
    }
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.2, 3.0), roofMat);
    canopy.position.y = 2.85;
    stable.add(canopy);
    stable.visible = false;
    this.root.add(stable);
    this.moduleGroups.set('stag-stable', stable);

    // 4. Spirit Lantern Porch & Golden Pennant Banner
    const porch = new THREE.Group();
    for (const lx of [-2.4, 2.4]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.0, 6), woodMat);
      pole.position.set(lx + 1.8, 1.5, 4.2 - lx * 0.35);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), goldMat);
      orb.position.set(lx + 1.8, 3.2, 4.2 - lx * 0.35);
      porch.add(pole, orb);
    }
    porch.visible = false;
    this.root.add(porch);
    this.moduleGroups.set('lantern-porch', porch);

    // 5. Boss Trophy Pedestals (4 golden busts — revealed per defeated boss!)
    const trophies = new THREE.Group();
    trophies.position.set(0.8, 0, 5.8);
    const bossIds = ['mossback-colossus', 'glacier-sovereign', 'elder-warden', 'astral-leviathan'];
    bossIds.forEach((bId, idx) => {
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 1.15, 8), stoneMat);
      ped.position.set((idx - 1.5) * 1.65, 0.58, 0);
      trophies.add(ped);

      const bust = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), goldMat);
      bust.position.set((idx - 1.5) * 1.65, 1.6, 0);
      bust.visible = false;
      trophies.add(bust);
      this.trophyMeshes.set(bId, bust);
    });
    trophies.visible = false;
    this.root.add(trophies);
    this.moduleGroups.set('trophy-hall', trophies);
  }

  canBuild(upgradeId, inventory) {
    const def = HOMESTEAD_UPGRADES.find((u) => u.id === upgradeId);
    if (!def || this.built.has(upgradeId)) return false;
    if ((inventory?.gold || 0) < def.goldCost) return false;
    for (const m of def.materials) {
      if ((inventory?.getCount?.(m.id) || 0) < m.qty) return false;
    }
    return true;
  }

  buildUpgrade(upgradeId, inventory) {
    const def = HOMESTEAD_UPGRADES.find((u) => u.id === upgradeId);
    if (!def) return { ok: false, reason: 'Unknown upgrade' };
    if (this.built.has(upgradeId)) return { ok: false, reason: 'Already built' };
    if (!this.canBuild(upgradeId, inventory)) return { ok: false, reason: 'Insufficient Sunshards or materials' };

    inventory.spendGold(def.goldCost);
    for (const m of def.materials) inventory.removeItem(m.id, m.qty);
    this.built.add(upgradeId);
    this._syncVisuals();

    this.events?.emit('homestead:upgraded', { upgrade: def, totalBuilt: this.built.size });
    this.events?.emit('toast', {
      title: `${def.icon} Homestead Built: ${def.name}`,
      text: def.bonusText,
    });
    return { ok: true, upgrade: def };
  }

  recordBossTrophy(bossId) {
    if (!bossId) return;
    this.bossTrophies.add(bossId);
    this._syncVisuals();
  }

  harvestGarden(inventory) {
    if (!this.built.has('herb-garden') || !this.gardenReady) return false;
    inventory?.addItem?.('sunberry', 3, true);
    inventory?.addItem?.('moonpetal', 2, true);
    this.gardenReady = false;
    this.gardenCooldown = 90;
    this.events?.emit('toast', {
      title: '❀ Homestead Garden Harvested',
      text: 'Gathered +3 Golden Sunberries & +2 Silver Moonpetals!',
    });
    return true;
  }

  restAtHomestead(player) {
    if (this.built.has('starlight-hearth')) {
      this.wellRested = true;
    }
    if (player) {
      player.hp = player.maxHp;
      player.stamina = player.maxStamina;
      player.warmth = player.maxWarmth;
    }
    this.events?.emit('toast', {
      title: this.wellRested ? '✦ Well-Rested at Homestead!' : 'Rested at Homestead',
      text: this.wellRested
        ? 'Restored 100% vitals + Well-Rested (+25 Max HP & +25 Max SP)!'
        : 'Restored 100% HP, Stamina & Warmth.',
    });
  }

  getBonuses() {
    return {
      attackMult: this.built.has('arcane-forge') ? 0.12 : 0,
      mountSpeedMult: this.built.has('stag-stable') ? 0.15 : 0,
      potionMult: this.built.has('alchemy-bench') ? 0.3 : 0,
      xpMult: this.built.has('cartographer-globe') ? 0.2 : 0,
      wellRestedHp: this.wellRested ? 25 : 0,
      wellRestedSp: this.wellRested ? 25 : 0,
    };
  }

  getInteractables(playerPos) {
    const d = Math.hypot(playerPos.x - HOMESTEAD_POS.x, playerPos.z - HOMESTEAD_POS.z);
    if (d > 6.5) return [];
    return [
      {
        id: 'homestead-workbench',
        type: 'homestead',
        label: "Open Wayfarer's Homestead & Rune Anvil",
        x: HOMESTEAD_POS.x,
        y: this.y + 1.8,
        z: HOMESTEAD_POS.z,
        radius: 6.5,
      },
    ];
  }

  _syncVisuals() {
    for (const [id, grp] of this.moduleGroups.entries()) {
      grp.visible = this.built.has(id);
    }
    for (const [bId, mesh] of this.trophyMeshes.entries()) {
      mesh.visible = this.bossTrophies.has(bId);
    }
  }

  update(dt, elapsed) {
    if (!this.gardenReady && this.gardenCooldown > 0) {
      this.gardenCooldown = Math.max(0, this.gardenCooldown - dt);
      if (this.gardenCooldown <= 0) this.gardenReady = true;
    }
    for (const mesh of this.trophyMeshes.values()) {
      if (mesh.visible) mesh.rotation.y = elapsed * 1.1;
    }
  }

  serialize() {
    return {
      built: Array.from(this.built),
      wellRested: this.wellRested,
      bossTrophies: Array.from(this.bossTrophies),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.built = new Set(data.built || []);
    this.wellRested = Boolean(data.wellRested);
    this.bossTrophies = new Set(data.bossTrophies || []);
    this._syncVisuals();
  }
}
