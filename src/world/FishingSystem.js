import * as THREE from 'three';
import { SEA_LEVEL } from './WorldSpec.js';

export const FISHING_SPOTS = [
  { id: 'spot-silver-bridge', name: 'Silver River Shallows', region: 'verdant-valley', x: 168, z: 336 },
  { id: 'spot-tidehaven-pier', name: 'Tidehaven Harbor Jetty', region: 'azure-coast', x: 1196, z: 1185 },
  { id: 'spot-archive-reef', name: 'Drowned Archive Reef', region: 'azure-coast', x: 1622, z: 1620 },
  { id: 'spot-highland-tarn', name: 'Glacier Mirror Tarn', region: 'highland-reach', x: -1380, z: -1820 },
  { id: 'spot-hollow-grotto', name: 'Crystalline Grotto Pool', region: 'hollow-depths', x: 210, z: -1710 },
  { id: 'spot-frontier-cove', name: 'Autumn Lantern Pool', region: 'hidden-frontier', x: -1480, z: 1520 }
];

const REGION_FISH_TABLE = {
  'verdant-valley': [
    { itemId: 'river-trout', weight: 65, xp: 24 },
    { itemId: 'golden-koi', weight: 35, xp: 45 }
  ],
  'emerald-wilds': [
    { itemId: 'river-trout', weight: 55, xp: 24 },
    { itemId: 'golden-koi', weight: 45, xp: 45 }
  ],
  'highland-reach': [
    { itemId: 'glacier-char', weight: 70, xp: 40 },
    { itemId: 'golden-koi', weight: 30, xp: 48 }
  ],
  'azure-coast': [
    { itemId: 'azure-snapper', weight: 46, xp: 34 },
    { itemId: 'sunscale-marlin', weight: 28, xp: 68 },
    { itemId: 'abyssal-lanternfish', weight: 18, xp: 55 },
    { itemId: 'leviathan-fry', weight: 8, xp: 115 }
  ],
  'hollow-depths': [
    { itemId: 'crystalline-eel', weight: 65, xp: 58 },
    { itemId: 'abyssal-lanternfish', weight: 35, xp: 62 }
  ],
  'shattered-expanse': [
    { itemId: 'crystalline-eel', weight: 65, xp: 64 },
    { itemId: 'leviathan-fry', weight: 35, xp: 120 }
  ],
  'forgotten-kingdom': [
    { itemId: 'river-trout', weight: 60, xp: 28 },
    { itemId: 'crystalline-eel', weight: 40, xp: 56 }
  ],
  'hidden-frontier': [
    { itemId: 'golden-koi', weight: 65, xp: 50 },
    { itemId: 'sunscale-marlin', weight: 35, xp: 72 }
  ]
};

/**
 * Interactive Spirit Line Fishing Mini-Game & 3D Water Ripple Spots.
 */
export class FishingSystem {
  constructor(scene, terrain, biomeManager, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.biome = biomeManager;
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'FishingSystem';
    this.scene.add(this.root);

    this.state = 'idle'; // 'idle' | 'waiting' | 'reeling'
    this.waitTimer = 0;
    this.cursor = 0.5;
    this.cursorDir = 1;
    this.zoneStart = 0.36;
    this.zoneEnd = 0.64;
    this.progress = 0;
    this.currentFish = null;
    this.bobberPos = new THREE.Vector3();
    this.totalCaught = 0;
    this.speciesCaught = new Set();

    // 3D Bobber + glowing spirit line
    this.bobber = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd76b })
    );
    this.bobber.visible = false;
    this.root.add(this.bobber);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0x9ef7ff, transparent: true, opacity: 0.85 })
    );
    this.line.visible = false;
    this.root.add(this.line);

    // Ambient animated ripple rings at named Fishing Spots
    this.spotRings = [];
    for (const spot of FISHING_SPOTS) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.15, 22),
        new THREE.MeshBasicMaterial({ color: 0xaef6ff, transparent: true, opacity: 0.62, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      const y = Math.max(SEA_LEVEL, terrain.getHeight(spot.x, spot.z)) + 0.08;
      ring.position.set(spot.x, y, spot.z);
      this.root.add(ring);
      this.spotRings.push({ spot, mesh: ring });
    }
  }

  findWaterAhead(player, isSailing = false) {
    const pPos = player.root ? player.root.position : player.position;
    if (isSailing) {
      return new THREE.Vector3(
        pPos.x + Math.sin(player.facingYaw) * 5.2,
        SEA_LEVEL + 0.08,
        pPos.z + Math.cos(player.facingYaw) * 5.2
      );
    }
    for (const spot of FISHING_SPOTS) {
      const dist = Math.hypot(pPos.x - spot.x, pPos.z - spot.z);
      if (dist <= 18) {
        return new THREE.Vector3(spot.x, Math.max(SEA_LEVEL, this.terrain.getHeight(spot.x, spot.z)) + 0.08, spot.z);
      }
    }
    for (const dist of [4, 7, 10, 14]) {
      const tx = pPos.x + Math.sin(player.facingYaw) * dist;
      const tz = pPos.z + Math.cos(player.facingYaw) * dist;
      const h = this.terrain.getHeight(tx, tz);
      if (h <= SEA_LEVEL + 0.25) {
        return new THREE.Vector3(tx, SEA_LEVEL + 0.08, tz);
      }
    }
    return null;
  }

  canFish(player, isIndoors = false, isSailing = false) {
    if (isIndoors) return false;
    return this.findWaterAhead(player, isSailing) !== null;
  }

  startCast(player, { isIndoors = false, isSailing = false, audio = null, particles = null } = {}) {
    if (this.state !== 'idle') return this.reelAction(player, { audio, particles });
    if (isIndoors) return { ok: false, message: 'Cannot fish indoors.' };

    const target = this.findWaterAhead(player, isSailing);
    if (!target) {
      return { ok: false, message: 'Face a river, harbor pier, or shoreline to cast your Spirit Line (F).' };
    }

    this.bobberPos.copy(target);
    this.bobber.position.copy(target);
    this.bobber.visible = true;
    this.line.visible = true;

    const region = this.biome.getRegionAt(target.x, target.z);
    this.currentFish = this._rollFish(region.id);
    this.state = 'waiting';
    this.waitTimer = 1.1 + Math.random() * 1.0;
    this.progress = 26;
    this.cursor = 0.2;
    this.cursorDir = 1;
    const width = this.currentFish.itemId === 'leviathan-fry' ? 0.18 : 0.28;
    this.zoneStart = 0.5 - width * 0.5;
    this.zoneEnd = 0.5 + width * 0.5;

    audio?.playSplash?.();
    particles?.emitBurst?.(target, 0x9ef7ff, 12, 3.6, 0.5);
    return { ok: true, state: 'waiting', message: `Spirit Line cast in ${region.name}... Wait for a bite!` };
  }

  _rollFish(regionId) {
    const table = REGION_FISH_TABLE[regionId] || REGION_FISH_TABLE['verdant-valley'];
    const totalW = table.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalW;
    for (const entry of table) {
      r -= entry.weight;
      if (r <= 0) return { ...entry, regionId };
    }
    return { ...table[0], regionId };
  }

  reelAction(player, { inventory = null, progression = null, audio = null, particles = null } = {}) {
    if (this.state === 'waiting') {
      // Early pull cancels cast
      this.cancel();
      return { ok: false, cancelled: true, message: 'Pulled line too early — try waiting for the splash!' };
    }
    if (this.state !== 'reeling') return { ok: false };

    const inSweetSpot = this.cursor >= this.zoneStart && this.cursor <= this.zoneEnd;
    if (inSweetSpot) {
      this.progress = Math.min(100, this.progress + 34);
      audio?.playUiClick?.();
      particles?.emitBurst?.(this.bobberPos, 0xffe47a, 10, 4.2, 0.45);
    } else {
      this.progress = Math.max(0, this.progress - 12);
    }

    if (this.progress >= 100) {
      return this._completeCatch({ inventory, progression, audio, particles });
    }
    return { ok: true, state: 'reeling', inSweetSpot, progress: this.progress };
  }

  _completeCatch({ inventory, progression, audio, particles }) {
    const caught = this.currentFish;
    this.totalCaught += 1;
    this.speciesCaught.add(caught.itemId);
    const bonusGold = Math.random() < 0.3 ? 18 : 0;

    inventory?.addItem?.(caught.itemId, 1);
    if (bonusGold > 0) inventory?.addGold?.(bonusGold);
    progression?.addXp?.(caught.xp);

    audio?.playDiscovery?.();
    particles?.emitBurst?.(this.bobberPos, 0xffe07d, 22, 6.2, 0.8);
    this.events?.emit('fishing:catch', {
      itemId: caught.itemId,
      regionId: caught.regionId,
      totalCaught: this.totalCaught,
      uniqueSpecies: this.speciesCaught.size,
      bonusGold
    });

    this.cancel();
    return {
      ok: true,
      caught: true,
      itemId: caught.itemId,
      xp: caught.xp,
      bonusGold
    };
  }

  cancel() {
    this.state = 'idle';
    this.bobber.visible = false;
    this.line.visible = false;
    this.currentFish = null;
    this.progress = 0;
  }

  getHudState() {
    if (this.state === 'idle') return null;
    return {
      state: this.state,
      cursor: this.cursor,
      zoneStart: this.zoneStart,
      zoneEnd: this.zoneEnd,
      progress: Math.round(this.progress)
    };
  }

  update(dt, elapsed, player, audio = null) {
    // Animate ambient water ripples
    for (let i = 0; i < this.spotRings.length; i++) {
      const r = this.spotRings[i];
      const pulse = 0.8 + ((elapsed * 0.7 + i * 0.3) % 1) * 0.9;
      r.mesh.scale.setScalar(pulse);
      r.mesh.material.opacity = (1.7 - pulse) * 0.6;
    }

    if (this.state === 'idle') return;

    const pPos = player.root ? player.root.position : player.position;
    if (pPos.distanceTo(this.bobberPos) > 22) {
      this.cancel();
      return;
    }

    const handPos = pPos.clone().add(new THREE.Vector3(0, 1.55, 0));
    const bobY = this.bobberPos.y + Math.sin(elapsed * (this.state === 'reeling' ? 14 : 3.5)) * (this.state === 'reeling' ? 0.16 : 0.05);
    this.bobber.position.set(this.bobberPos.x, bobY, this.bobberPos.z);
    this.line.geometry.setFromPoints([handPos, this.bobber.position]);

    if (this.state === 'waiting') {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.state = 'reeling';
        audio?.playSplash?.();
      }
    } else if (this.state === 'reeling') {
      const speed = this.currentFish?.itemId === 'leviathan-fry' ? 1.15 : 0.85;
      this.cursor += this.cursorDir * speed * dt;
      if (this.cursor >= 0.96) {
        this.cursor = 0.96;
        this.cursorDir = -1;
      } else if (this.cursor <= 0.04) {
        this.cursor = 0.04;
        this.cursorDir = 1;
      }
      this.progress = Math.max(8, this.progress - dt * 5.5);
    }
  }

  serialize() {
    return {
      totalCaught: this.totalCaught,
      speciesCaught: [...this.speciesCaught]
    };
  }

  hydrate(data) {
    if (!data) return;
    this.totalCaught = data.totalCaught || 0;
    this.speciesCaught = new Set(data.speciesCaught || []);
  }
}
