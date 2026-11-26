// Interactive Anime-Watercolor Sailboat System & Underwater Sunken Treasures for Azure Coast & Silver River.
// Supports boarding, rudder steering, billowing wind-filled sails, water wake foam, and diving for seabed pearls.
import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldSpec.js';
import { patchWatercolorMaterial } from './WatercolorShader.js';

const BOAT_SPAWNS = [
  { id: 'boat-tidehaven', name: 'Tidehaven Coastal Skiff', x: 1185, z: 1425, yaw: 0.0 },
  { id: 'boat-archive', name: 'Archive Explorer Sailboat', x: 1635, z: 1665, yaw: 0.0 },
  { id: 'boat-azure-east', name: 'Azure Strait Cutwater', x: 1835, z: 1525, yaw: 0.0 },
];

const SUNKEN_TREASURES = [
  { id: 'pearl-archive-north', name: 'Sunken Archive Pearl', itemId: 'sunken-pearl', x: 1660, z: 1740 },
  { id: 'pearl-archive-south', name: 'Tidal Relic Pearl', itemId: 'sunken-pearl', x: 1740, z: 1810 },
  { id: 'pearl-tidehaven-reef', name: 'Reef Pearl Cluster', itemId: 'sunken-pearl', x: 1120, z: 1520 },
  { id: 'pearl-azure-shoal', name: 'Ancient Bronze Seal', itemId: 'archive-tablet', x: 1520, z: 1750 },
  { id: 'seaglass-cove', name: 'Azure Sea Glass Cache', itemId: 'sea-glass', x: 1860, z: 1660 },
];

export class BoatSystem {
  constructor(scene, terrain, textures, particles, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.textures = textures;
    this.particles = particles;
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'boats-and-sunken-treasures';
    scene.add(this.root);

    this.boats = [];
    this.treasures = [];
    this.collectedTreasures = new Set();
    this.activeBoat = null;
    this._wakeTimer = 0;

    this._buildBoats();
    this._buildSunkenTreasures();
  }

  _buildBoats() {
    const hullMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.woodMap, color: 0xa66a3f, roughness: 0.8 }),
      { rimStrength: 0.28, inkEdge: 0.24 }
    );
    const trimMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.72 }),
      { rimStrength: 0.26, inkEdge: 0.2 }
    );
    const sailMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xfbf3df,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
      { rimStrength: 0.32, inkEdge: 0.14, wind: true, windAmp: 0.18, windFreq: 2.2 }
    );
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffdf80,
      emissive: 0xffae3a,
      emissiveIntensity: 1.35,
    });

    for (const def of BOAT_SPAWNS) {
      const g = new THREE.Group();

      // Painted boat hull
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 5.2), hullMat);
      hull.position.y = 0.2;
      hull.castShadow = true;
      hull.receiveShadow = true;
      g.add(hull);

      // Pointed prow & stern
      const prow = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.0, 4), hullMat);
      prow.rotation.x = Math.PI / 2;
      prow.rotation.y = Math.PI / 4;
      prow.position.set(0, 0.25, 3.4);
      g.add(prow);

      // Painted azure trim stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 5.1), trimMat);
      stripe.position.y = 0.56;
      g.add(stripe);

      // Bench & helm tiller
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.7), hullMat);
      bench.position.set(0, 0.65, -0.7);
      g.add(bench);

      // Tall wooden mast + billowing gouache sail
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.4, 7), hullMat);
      mast.position.set(0, 3.1, 0.5);
      mast.castShadow = true;
      g.add(mast);

      const sailPivot = new THREE.Group();
      sailPivot.position.set(0, 3.3, 0.5);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.6, 4, 4), sailMat);
      sail.position.set(0, 0, -0.2);
      sail.rotation.y = Math.PI * 0.5;
      sailPivot.add(sail);
      g.add(sailPivot);

      // Prow brass lantern
      const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), lanternMat);
      lantern.position.set(0, 1.0, 3.5);
      g.add(lantern);

      g.position.set(def.x, WORLD_CONFIG.SEA_LEVEL, def.z);
      g.rotation.y = def.yaw;
      this.root.add(g);

      this.boats.push({
        ...def,
        group: g,
        sailPivot,
        yaw: def.yaw,
        speed: 0,
      });
    }
  }

  _buildSunkenTreasures() {
    const shellMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x748ea2, roughness: 0.72 }),
      { rimStrength: 0.3 }
    );
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xb6fff6,
      emissive: 0x4de6dc,
      emissiveIntensity: 1.5,
      roughness: 0.18,
    });

    for (const t of SUNKEN_TREASURES) {
      const y = Math.min(this.terrain.getHeight(t.x, t.z), WORLD_CONFIG.SEA_LEVEL - 2.6);
      const g = new THREE.Group();
      g.position.set(t.x, y, t.z);

      const clam = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.4, 7), shellMat);
      clam.position.y = 0.2;
      g.add(clam);

      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), pearlMat);
      orb.position.y = 0.72;
      g.add(orb);

      this.root.add(g);
      this.treasures.push({ ...t, y, group: g, orb, collected: false });
    }
  }

  boardBoat(boatId, player) {
    const b = this.boats.find((x) => x.id === boatId);
    if (!b) return false;
    this.activeBoat = b;
    player.sailing = true;
    player.swimming = false;
    player.gliding = false;
    player.grounded = true;
    if (this.events) {
      this.events.emit('boat:board', b);
      this.events.emit('toast', {
        title: `Sailing — ${b.name}`,
        text: 'Use movement keys to steer across Azure Coast. Press E to disembark at any shore.',
      });
    }
    return true;
  }

  disembark(player) {
    if (!this.activeBoat) return false;
    const b = this.activeBoat;
    this.activeBoat = null;
    player.sailing = false;
    const sideX = b.group.position.x + Math.cos(b.yaw) * 2.6;
    const sideZ = b.group.position.z - Math.sin(b.yaw) * 2.6;
    const h = this.terrain.getHeight(sideX, sideZ);
    player.root.position.set(sideX, Math.max(h, WORLD_CONFIG.SEA_LEVEL + 0.3), sideZ);
    player.velocity.set(0, 0, 0);
    if (this.events) {
      this.events.emit('toast', { title: 'Disembarked', text: `${b.name} moored safely nearby.` });
    }
    return true;
  }

  collectTreasure(id) {
    const t = this.treasures.find((x) => x.id === id);
    if (!t || t.collected) return null;
    t.collected = true;
    t.group.visible = false;
    this.collectedTreasures.add(id);
    if (this.particles) {
      this.particles.emitBurst(t.group.position, { count: 20, color: 0x7ef8f0, speed: 4, spreadY: 5, gravity: -1.5 });
    }
    return t;
  }

  getInteractables(playerPos) {
    const out = [];
    if (this.activeBoat) {
      out.push({
        id: `disembark_${this.activeBoat.id}`,
        type: 'boat-exit',
        boatId: this.activeBoat.id,
        label: `Disembark ${this.activeBoat.name}`,
        x: playerPos.x,
        y: playerPos.y,
        z: playerPos.z,
        radius: 6,
      });
      return out;
    }

    for (const b of this.boats) {
      out.push({
        id: b.id,
        type: 'boat-board',
        boatId: b.id,
        label: `Sail ${b.name}`,
        x: b.group.position.x,
        y: b.group.position.y + 0.8,
        z: b.group.position.z,
        radius: 5.0,
      });
    }

    for (const t of this.treasures) {
      if (t.collected) continue;
      out.push({
        id: t.id,
        type: 'sunken-treasure',
        itemId: t.itemId,
        label: `Recover ${t.name}`,
        x: t.x,
        y: t.y + 0.6,
        z: t.z,
        radius: 4.0,
      });
    }
    return out;
  }

  update(dt, elapsed, player, input) {
    // Gentle wave bobbing for all moored boats
    for (const b of this.boats) {
      const bob = Math.sin(elapsed * 1.9 + b.x * 0.05) * 0.14;
      b.group.position.y = WORLD_CONFIG.SEA_LEVEL + bob;
      b.group.rotation.z = Math.sin(elapsed * 1.4 + b.z * 0.04) * 0.045;
      b.group.rotation.x = Math.cos(elapsed * 1.2 + b.x * 0.03) * 0.03;
    }

    // Pulse underwater sunken pearls
    for (const t of this.treasures) {
      if (t.collected) continue;
      t.orb.position.y = 0.72 + Math.sin(elapsed * 2.6 + t.x) * 0.16;
      t.orb.rotation.y = elapsed * 1.2;
    }

    // Steer active boat smoothly across navigable water
    if (this.activeBoat && player && input) {
      const b = this.activeBoat;
      const turnRate = 1.65;
      b.yaw -= input.moveX * turnRate * dt;
      const throttle = input.moveY;
      const maxSpd = input.sprint ? 16.5 : 11.2;
      const targetSpd = throttle > 0.05 ? throttle * maxSpd : throttle < -0.05 ? throttle * 4.5 : 0;
      b.speed += (targetSpd - b.speed) * Math.min(1, dt * 3.2);

      const nextX = b.group.position.x + Math.sin(b.yaw) * b.speed * dt;
      const nextZ = b.group.position.z + Math.cos(b.yaw) * b.speed * dt;
      const bedY = this.terrain.getHeight(nextX, nextZ);
      const limit = WORLD_CONFIG.PLAYABLE_HALF_M - 45;

      // Only glide across water (prevent sailing onto dry mountaintops)
      if (bedY < WORLD_CONFIG.SEA_LEVEL + 0.35 && Math.abs(nextX) < limit && Math.abs(nextZ) < limit) {
        b.group.position.x = nextX;
        b.group.position.z = nextZ;
      } else {
        b.speed *= -0.25;
      }

      b.group.rotation.y = b.yaw;
      b.sailPivot.rotation.y = Math.sin(elapsed * 2.4) * 0.08 + input.moveX * 0.35;

      // Seat protagonist cleanly at helm bench
      player.root.position.set(
        b.group.position.x - Math.sin(b.yaw) * 0.65,
        b.group.position.y + 0.85,
        b.group.position.z - Math.cos(b.yaw) * 0.65
      );
      player.facingYaw = b.yaw;
      player.visual.rotation.y = b.yaw;
      player.horizontalSpeed = Math.abs(b.speed);

      // Watercolor wake foam spray behind stern
      if (Math.abs(b.speed) > 2.2 && this.particles) {
        this._wakeTimer -= dt;
        if (this._wakeTimer <= 0) {
          this._wakeTimer = 0.07;
          this.particles.emitBurst(
            {
              x: b.group.position.x - Math.sin(b.yaw) * 2.5,
              y: WORLD_CONFIG.SEA_LEVEL + 0.15,
              z: b.group.position.z - Math.cos(b.yaw) * 2.5,
            },
            { count: 4, color: 0xe6fbff, speed: 1.8, spreadY: 0.9, life: 0.55, gravity: 2.5 }
          );
        }
      }
    }
  }

  getSnapshot() {
    return {
      boats: this.boats.map((b) => ({ id: b.id, x: b.group.position.x, z: b.group.position.z, yaw: b.yaw })),
      collectedTreasures: [...this.collectedTreasures],
    };
  }

  loadSnapshot(snap) {
    if (!snap) return;
    if (Array.isArray(snap.boats)) {
      for (const saved of snap.boats) {
        const b = this.boats.find((x) => x.id === saved.id);
        if (b && Number.isFinite(saved.x) && Number.isFinite(saved.z)) {
          b.group.position.x = saved.x;
          b.group.position.z = saved.z;
          b.yaw = saved.yaw || 0;
          b.group.rotation.y = b.yaw;
        }
      }
    }
    if (Array.isArray(snap.collectedTreasures)) {
      this.collectedTreasures = new Set(snap.collectedTreasures);
      for (const t of this.treasures) {
        if (this.collectedTreasures.has(t.id)) {
          t.collected = true;
          t.group.visible = false;
        }
      }
    }
  }
}
