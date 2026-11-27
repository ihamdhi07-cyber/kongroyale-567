import * as THREE from 'three';
import { createWatercolorMaterial } from './WatercolorShader.js';

const CARAVAN_ROUTE = [
  [36, 368],
  [210, 320],
  [480, 210],
  [880, 50],
  [1130, -100],
  [1175, 420],
  [1155, 1080],
  [740, 820],
  [310, 510]
];

const WISP_SPOTS = [
  { id: 'wisp-valley', name: 'Valley Meadow Wisp', start: [-74, 342], goal: [-112, 308], reward: { gold: 45, itemId: 'moonpetal', qty: 2 } },
  { id: 'wisp-emerald', name: 'Emerald Canopy Wisp', start: [-890, -110], goal: [-935, -135], reward: { gold: 65, itemId: 'starfall-shard', qty: 1 } },
  { id: 'wisp-azure', name: 'Coral Breeze Wisp', start: [1260, 1210], goal: [1305, 1248], reward: { gold: 60, itemId: 'sunken-pearl', qty: 1 } },
  { id: 'wisp-frontier', name: 'Lantern Grove Wisp', start: [-1510, 1550], goal: [-1555, 1590], reward: { gold: 85, itemId: 'sun-ore', qty: 2 } }
];

const STARFALL_SITES = [
  { id: 'starfall-1', x: -125, z: 455 },
  { id: 'starfall-2', x: 340, z: 260 },
  { id: 'starfall-3', x: -580, z: 60 },
  { id: 'starfall-4', x: 960, z: 180 }
];

/**
 * Dynamic Living World Events:
 *  - Wandering Covered Merchant Caravan (Caravan Master Kaelen) patrolling road loop
 *  - Collectable Meteoric Starfall Shards with tall golden sky beams
 *  - Playful Spirit Wisps that lead Aelira to hidden treasure bursts
 */
export class WorldEventsManager {
  constructor(scene, terrain, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'WorldEvents';
    this.scene.add(this.root);

    this.completedEvents = new Set();

    // 1. Wandering Merchant Caravan
    this.caravanProgress = 0.03;
    this.caravanPos = new THREE.Vector3();
    this.caravanYaw = 0;
    this.caravanMesh = this._buildCaravanMesh();
    this.root.add(this.caravanMesh);
    this._positionCaravan(0);

    // 2. Guiding Spirit Wisps
    this.wisps = WISP_SPOTS.map((w) => this._buildWisp(w));

    // 3. Meteoric Starfall Site (active golden sky-beam shard!)
    this.activeStarfall = null;
    this._spawnStarfall(0);
  }

  _buildCaravanMesh() {
    const g = new THREE.Group();
    const wood = createWatercolorMaterial({ color: 0x7b4c2d, roughness: 0.85, inkStrength: 0.25 });
    const canopy = createWatercolorMaterial({ color: 0xebe0c4, roughness: 0.9, inkStrength: 0.22 });
    const stripe = createWatercolorMaterial({ color: 0xb9453c, roughness: 0.85 });
    const wheelMat = createWatercolorMaterial({ color: 0x4b311e, roughness: 0.9 });

    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.55, 4.2), wood);
    bed.position.y = 1.05;
    bed.castShadow = true;
    g.add(bed);

    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 4.0, 12, 1, false, 0, Math.PI), canopy);
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.y = 1.3;
    arch.castShadow = true;
    g.add(arch);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.72, 12, 1, false, 0, Math.PI), stripe);
    band.rotation.z = Math.PI / 2;
    band.rotation.y = Math.PI / 2;
    band.position.y = 1.3;
    g.add(band);

    // 4 rotating wheels
    this.caravanWheels = [];
    for (const [wx, wz] of [[-1.32, 1.25], [1.32, 1.25], [-1.32, -1.25], [1.32, -1.25]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.16, 12), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.58, wz);
      wheel.castShadow = true;
      g.add(wheel);
      this.caravanWheels.push(wheel);
    }

    // Warm hanging lantern at front
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshBasicMaterial({ color: 0xffdf7a }));
    lantern.position.set(0, 2.35, 2.15);
    g.add(lantern);

    return g;
  }

  _buildWisp(spec) {
    const startH = this.terrain.getHeight(spec.start[0], spec.start[1]);
    const goalH = this.terrain.getHeight(spec.goal[0], spec.goal[1]);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 1),
      new THREE.MeshBasicMaterial({ color: 0x8ef5ff })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe48a, transparent: true, opacity: 0.32 })
    );
    orb.add(halo);
    const pos = new THREE.Vector3(spec.start[0], startH + 1.5, spec.start[1]);
    orb.position.copy(pos);
    this.root.add(orb);

    return {
      spec,
      mesh: orb,
      pos,
      goal: new THREE.Vector3(spec.goal[0], goalH + 1.4, spec.goal[1]),
      guided: false,
      done: false
    };
  }

  _spawnStarfall(index) {
    if (this.activeStarfall?.group) {
      this.root.remove(this.activeStarfall.group);
    }
    const site = STARFALL_SITES[index % STARFALL_SITES.length];
    const h = this.terrain.getHeight(site.x, site.z);
    const g = new THREE.Group();
    g.position.set(site.x, h, site.z);

    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe27a })
    );
    shard.position.y = 0.85;
    g.add(shard);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.72, 28, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe599, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
    );
    beam.position.y = 14;
    g.add(beam);

    const crater = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.85, 20),
      new THREE.MeshBasicMaterial({ color: 0xffb34d, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 0.08;
    g.add(crater);

    this.root.add(g);
    this.activeStarfall = {
      id: site.id,
      index,
      pos: new THREE.Vector3(site.x, h + 0.85, site.z),
      group: g,
      shard,
      collected: false
    };
  }

  _positionCaravan(dt) {
    this.caravanProgress = (this.caravanProgress + dt * 0.0022) % 1;
    const totalSegs = CARAVAN_ROUTE.length;
    const scaled = this.caravanProgress * totalSegs;
    const idx = Math.floor(scaled) % totalSegs;
    const nextIdx = (idx + 1) % totalSegs;
    const t = scaled - Math.floor(scaled);

    const a = CARAVAN_ROUTE[idx];
    const b = CARAVAN_ROUTE[nextIdx];
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    const y = this.terrain.getHeight(x, z);
    this.caravanPos.set(x, y, z);
    this.caravanYaw = Math.atan2(b[0] - a[0], b[1] - a[1]);

    this.caravanMesh.position.copy(this.caravanPos);
    this.caravanMesh.rotation.y = this.caravanYaw;
    for (const w of this.caravanWheels) w.rotation.x += dt * 3.8;
  }

  getNearbyInteraction(playerPos) {
    if (this.activeStarfall && !this.activeStarfall.collected) {
      if (playerPos.distanceTo(this.activeStarfall.pos) < 3.6) {
        return {
          type: 'starfall',
          label: 'Claim Meteoric Starfall Shard',
          target: this.activeStarfall
        };
      }
    }
    if (playerPos.distanceTo(this.caravanPos) < 5.2) {
      return {
        type: 'caravan',
        label: "Trade with Caravan Master Kaelen",
        target: this.caravanPos
      };
    }
    return null;
  }

  getNearestSecret(playerPos) {
    let best = null;
    let bestDist = Infinity;
    if (this.activeStarfall && !this.activeStarfall.collected) {
      const d = playerPos.distanceTo(this.activeStarfall.pos);
      if (d < bestDist) { bestDist = d; best = this.activeStarfall.pos; }
    }
    for (const w of this.wisps) {
      if (w.done) continue;
      const d = playerPos.distanceTo(w.pos);
      if (d < bestDist) { bestDist = d; best = w.pos; }
    }
    return best;
  }

  claimStarfall(inventory, progression, particles = null, audio = null) {
    if (!this.activeStarfall || this.activeStarfall.collected) return null;
    const sf = this.activeStarfall;
    sf.collected = true;
    this.completedEvents.add(sf.id);
    this.root.remove(sf.group);

    inventory?.addItem?.('starfall-shard', 1);
    inventory?.addGold?.(55);
    progression?.addXp?.(85);
    particles?.emitBurst?.(sf.pos, 0xffe27a, 28, 7.2, 0.85);
    audio?.playDiscovery?.();

    this.events?.emit('worldevent:complete', { type: 'starfall', id: sf.id });
    // Queue next starfall at another site
    this._spawnStarfall(sf.index + 1);
    return { itemId: 'starfall-shard', gold: 55, xp: 85 };
  }

  getCaravanStock() {
    return [
      { itemId: 'starfall-shard', price: 155 },
      { itemId: 'emerald-bowstaff', price: 115 },
      { itemId: 'verdant-shroud', price: 135 },
      { itemId: 'sun-ore', price: 65 },
      { itemId: 'skyfeather', price: 72 },
      { itemId: 'marlin-feast', price: 145 },
      { itemId: 'starlight-draught', price: 165 }
    ];
  }

  update(dt, elapsed, playerPos, { inventory = null, progression = null, particles = null, audio = null } = {}) {
    this._positionCaravan(dt);

    if (this.activeStarfall && !this.activeStarfall.collected) {
      this.activeStarfall.shard.rotation.y = elapsed * 2.2;
      this.activeStarfall.shard.position.y = 0.85 + Math.sin(elapsed * 3) * 0.18;
    }

    for (const w of this.wisps) {
      if (w.done) continue;
      const d = playerPos.distanceTo(w.pos);
      if (!w.guided && d < 9.0) {
        w.guided = true;
      }
      if (w.guided) {
        const toGoal = w.goal.clone().sub(w.pos);
        if (toGoal.length() > 0.7) {
          w.pos.addScaledVector(toGoal.normalize(), dt * 5.2);
          const groundY = this.terrain.getHeight(w.pos.x, w.pos.z);
          w.pos.y = groundY + 1.55 + Math.sin(elapsed * 5) * 0.25;
        } else if (d < 4.8) {
          // Treasure burst!
          w.done = true;
          w.mesh.visible = false;
          this.completedEvents.add(w.spec.id);
          inventory?.addGold?.(w.spec.reward.gold);
          inventory?.addItem?.(w.spec.reward.itemId, w.spec.reward.qty);
          progression?.addXp?.(75);
          particles?.emitBurst?.(w.pos, 0x8ef5ff, 26, 6.8, 0.85);
          audio?.playDiscovery?.();
          this.events?.emit('worldevent:complete', {
            type: 'wisp',
            id: w.spec.id,
            name: w.spec.name,
            reward: w.spec.reward
          });
        }
      } else {
        w.pos.y = this.terrain.getHeight(w.pos.x, w.pos.z) + 1.5 + Math.sin(elapsed * 3.2) * 0.25;
      }
      w.mesh.position.copy(w.pos);
      w.mesh.rotation.y = elapsed * 2.8;
    }
  }

  serialize() {
    return {
      completedEvents: [...this.completedEvents],
      caravanProgress: this.caravanProgress
    };
  }

  hydrate(data) {
    if (!data) return;
    this.completedEvents = new Set(data.completedEvents || []);
    if (typeof data.caravanProgress === 'number') {
      this.caravanProgress = data.caravanProgress;
      this._positionCaravan(0);
    }
    for (const w of this.wisps) {
      if (this.completedEvents.has(w.spec.id)) {
        w.done = true;
        w.mesh.visible = false;
      }
    }
  }
}
