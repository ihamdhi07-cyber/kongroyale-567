// 5 Timed Ancient Resonance Shrine Trials across the 8x8 km Realm:
// Glowing golden 3D sky/land/sea checkpoint rings challenging Wind Stag riding,
// Spirit Gliding, Azure Sailing, and Mountain Traversal — with Bronze / Silver / Gold medals!
import * as THREE from 'three';

export const SHRINE_TRIALS = [
  {
    id: 'trial-crossroads-dash',
    name: 'Meadow Wind-Stag Dash',
    regionId: 'verdant-valley',
    mode: 'Mount / Sprint',
    startX: 34,
    startZ: 368,
    timeLimit: 45,
    goldTime: 22,
    silverTime: 32,
    rewardGold: 80,
    rewardXp: 140,
    rings: [
      [52, 355, 1.8],
      [74, 352, 2.2],
      [104, 352, 2.0],
      [134, 344, 2.2],
      [158, 336, 2.2],
    ],
  },
  {
    id: 'trial-canopy-glide',
    name: 'Emerald Canopy Glider Run',
    regionId: 'emerald-wilds',
    mode: 'Spirit Glider',
    startX: -945,
    startZ: -125,
    timeLimit: 55,
    goldTime: 26,
    silverTime: 38,
    rewardGold: 110,
    rewardXp: 190,
    rings: [
      [-910, -100, 6.0],
      [-865, -75, 5.5],
      [-820, -45, 5.0],
      [-775, -15, 4.5],
      [-730, 15, 3.5],
    ],
  },
  {
    id: 'trial-azure-regatta',
    name: 'Azure Coast Sailing Regatta',
    regionId: 'azure-coast',
    mode: 'Sailboat',
    startX: 1215,
    startZ: 1215,
    timeLimit: 65,
    goldTime: 34,
    silverTime: 48,
    rewardGold: 125,
    rewardXp: 210,
    rings: [
      [1265, 1265, 2.2],
      [1330, 1315, 2.2],
      [1405, 1365, 2.2],
      [1470, 1410, 2.2],
      [1535, 1455, 2.2],
    ],
  },
  {
    id: 'trial-frost-ascent',
    name: 'Skywatch Alpine Ridge Run',
    regionId: 'highland-reach',
    mode: 'Mount / Glider',
    startX: -1540,
    startZ: -1835,
    timeLimit: 55,
    goldTime: 26,
    silverTime: 40,
    rewardGold: 140,
    rewardXp: 240,
    rings: [
      [-1520, -1855, 2.5],
      [-1505, -1878, 2.5],
      [-1525, -1905, 2.8],
      [-1555, -1910, 2.5],
      [-1575, -1880, 2.5],
    ],
  },
  {
    id: 'trial-astral-soar',
    name: 'Shattered Horizon Sky-Rings',
    regionId: 'shattered-expanse',
    mode: 'Glider + Gale Updraft',
    startX: 1765,
    startZ: -1800,
    timeLimit: 60,
    goldTime: 28,
    silverTime: 42,
    rewardGold: 165,
    rewardXp: 290,
    rings: [
      [1795, -1815, 7.0],
      [1825, -1835, 8.5],
      [1850, -1865, 7.5],
      [1815, -1885, 6.5],
      [1785, -1855, 5.5],
    ],
  },
];

export class ShrineTrialSystem {
  constructor(scene, terrain, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'shrine-trials';
    scene.add(this.root);

    this.ringGroup = new THREE.Group();
    this.root.add(this.ringGroup);

    this.obeliskMeshes = [];
    this.activeTrial = null;
    this.activeRingMeshes = [];
    this.nextRingIndex = 0;
    this.elapsed = 0;

    // Best records: { [trialId]: { medal: 'bronze'|'silver'|'gold', bestTime: number } }
    this.records = {};

    this._buildObelisks();
  }

  _buildObelisks() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x626b7a, roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd766,
      emissive: 0xffa629,
      emissiveIntensity: 1.25,
      roughness: 0.25,
    });

    for (const trial of SHRINE_TRIALS) {
      const y = Math.max(0.2, this.terrain.getHeight(trial.startX, trial.startZ));
      const g = new THREE.Group();
      g.position.set(trial.startX, y, trial.startZ);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.45, 0.5, 8), stoneMat);
      base.position.y = 0.25;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 2.8, 6), stoneMat);
      shaft.position.y = 1.65;
      shaft.castShadow = true;

      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 20), goldMat);
      halo.position.y = 3.6;

      g.add(base, shaft, halo);
      this.root.add(g);
      this.obeliskMeshes.push({ trial, group: g, halo, y });
    }
  }

  getInteractables(playerPos) {
    if (this.activeTrial) return [];
    const out = [];
    for (const ob of this.obeliskMeshes) {
      const d = Math.hypot(playerPos.x - ob.trial.startX, playerPos.z - ob.trial.startZ);
      if (d <= 5.2) {
        const best = this.records[ob.trial.id];
        const tag = best ? ` (Best: ${best.medal.toUpperCase()} ${best.bestTime.toFixed(1)}s)` : '';
        out.push({
          id: `trial_${ob.trial.id}`,
          type: 'shrine-trial',
          trialId: ob.trial.id,
          label: `Begin Trial: ${ob.trial.name}${tag}`,
          x: ob.trial.startX,
          y: ob.y + 1.5,
          z: ob.trial.startZ,
          radius: 5.2,
        });
      }
    }
    return out;
  }

  startTrial(trialId) {
    const def = SHRINE_TRIALS.find((t) => t.id === trialId);
    if (!def) return false;
    this.cancelTrial(false);

    this.activeTrial = def;
    this.nextRingIndex = 0;
    this.elapsed = 0;
    this.activeRingMeshes = [];

    for (let i = 0; i < def.rings.length; i++) {
      const [rx, rz, hOff] = def.rings[i];
      const groundY = Math.max(0.0, this.terrain.getHeight(rx, rz));
      const ry = groundY + hOff;

      const isCurrent = i === 0;
      const mat = new THREE.MeshStandardMaterial({
        color: isCurrent ? 0xffe47c : 0x7ef2ff,
        emissive: isCurrent ? 0xffa829 : 0x26b9d4,
        emissiveIntensity: isCurrent ? 1.5 : 0.75,
        roughness: 0.2,
        transparent: true,
        opacity: isCurrent ? 0.96 : 0.52,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 10, 28), mat);
      ring.position.set(rx, ry, rz);

      // Face the ring cleanly along the path direction
      if (i + 1 < def.rings.length) {
        const nx = def.rings[i + 1][0];
        const nz = def.rings[i + 1][1];
        ring.rotation.y = Math.atan2(nx - rx, nz - rz);
      }

      const innerGlow = new THREE.Mesh(
        new THREE.CircleGeometry(2.35, 22),
        new THREE.MeshBasicMaterial({
          color: isCurrent ? 0xffdf7a : 0x7ef2ff,
          transparent: true,
          opacity: isCurrent ? 0.22 : 0.08,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      ring.add(innerGlow);
      this.ringGroup.add(ring);
      this.activeRingMeshes.push({ mesh: ring, innerGlow, mat, x: rx, y: ry, z: rz, cleared: false });
    }

    this.events?.emit('trial:started', { trial: def });
    this.events?.emit('toast', {
      title: `✦ Trial Started: ${def.name}`,
      text: `Pass through all ${def.rings.length} Golden Sky Rings within ${def.timeLimit}s! (Gold <= ${def.goldTime}s)`,
    });
    return true;
  }

  cancelTrial(notify = true) {
    if (!this.activeTrial) return;
    for (const r of this.activeRingMeshes) {
      this.ringGroup.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mat.dispose();
    }
    this.activeRingMeshes = [];
    const name = this.activeTrial.name;
    this.activeTrial = null;
    this.nextRingIndex = 0;
    this.elapsed = 0;
    if (notify) {
      this.events?.emit('toast', { title: 'Trial Cancelled', text: `${name} ended.` });
    }
  }

  update(dt, worldElapsed, playerPos, { inventory = null, progression = null, particles = null, audio = null } = {}) {
    for (const ob of this.obeliskMeshes) {
      ob.halo.rotation.y = worldElapsed * 1.4;
      ob.halo.position.y = 3.6 + Math.sin(worldElapsed * 2.2) * 0.2;
    }

    if (!this.activeTrial) return;
    this.elapsed += dt;

    if (this.elapsed >= this.activeTrial.timeLimit) {
      const name = this.activeTrial.name;
      this.cancelTrial(false);
      this.events?.emit('toast', { title: '⏱ Trial Time Expired', text: `Try ${name} again for a Bronze, Silver, or Gold medal!` });
      return;
    }

    // Animate remaining rings & check pass-through on the current target ring
    for (let i = this.nextRingIndex; i < this.activeRingMeshes.length; i++) {
      const r = this.activeRingMeshes[i];
      r.mesh.rotation.z = Math.sin(worldElapsed * 2.4 + i) * 0.12;
      if (i === this.nextRingIndex) {
        r.mesh.scale.setScalar(1.04 + Math.sin(worldElapsed * 6) * 0.05);
      }
    }

    const cur = this.activeRingMeshes[this.nextRingIndex];
    if (cur && playerPos) {
      const distXZ = Math.hypot(playerPos.x - cur.x, playerPos.z - cur.z);
      const distY = Math.abs((playerPos.y + 1.0) - cur.y);
      if (distXZ <= 4.4 && distY <= 4.6) {
        this._clearCurrentRing(particles, audio, inventory, progression);
      }
    }
  }

  _clearCurrentRing(particles, audio, inventory, progression) {
    const cur = this.activeRingMeshes[this.nextRingIndex];
    if (!cur) return;
    cur.cleared = true;
    cur.mesh.visible = false;
    particles?.emitBurst?.(cur.mesh.position, { count: 24, color: 0xffe47c, speed: 6.5, spreadY: 4 });
    audio?.playDiscoveryFanfare?.();

    this.nextRingIndex += 1;
    if (this.nextRingIndex >= this.activeRingMeshes.length) {
      this._completeTrial(inventory, progression);
    } else {
      const next = this.activeRingMeshes[this.nextRingIndex];
      next.mat.color.setHex(0xffe47c);
      next.mat.emissive.setHex(0xffa829);
      next.mat.emissiveIntensity = 1.5;
      next.mat.opacity = 0.96;
      next.innerGlow.material.color.setHex(0xffdf7a);
      next.innerGlow.material.opacity = 0.22;
    }
  }

  _completeTrial(inventory, progression) {
    const def = this.activeTrial;
    const finalTime = this.elapsed;
    const medal = finalTime <= def.goldTime ? 'gold' : finalTime <= def.silverTime ? 'silver' : 'bronze';
    const mult = medal === 'gold' ? 1.5 : medal === 'silver' ? 1.2 : 1.0;

    const prev = this.records[def.id];
    const rankOrder = { bronze: 1, silver: 2, gold: 3 };
    if (!prev || finalTime < prev.bestTime || rankOrder[medal] > rankOrder[prev.medal]) {
      this.records[def.id] = {
        medal: prev && rankOrder[prev.medal] > rankOrder[medal] ? prev.medal : medal,
        bestTime: prev ? Math.min(prev.bestTime, finalTime) : finalTime,
      };
    }

    const goldPayout = Math.round(def.rewardGold * mult);
    const xpPayout = Math.round(def.rewardXp * mult);
    inventory?.addGold?.(goldPayout);
    progression?.addXP?.(xpPayout, `Shrine Trial: ${def.name}`);

    this.cancelTrial(false);
    this.events?.emit('trial:completed', { trial: def, medal, time: finalTime, goldPayout, xpPayout });
    this.events?.emit('discovery:banner', {
      subtitle: `${medal.toUpperCase()} MEDAL · ${finalTime.toFixed(1)}s`,
      title: `${def.name} Complete!`,
    });
    this.events?.emit('toast', {
      title: `★ ${medal.toUpperCase()} Shrine Trial Medal!`,
      text: `+${goldPayout} ✦ Sunshards · +${xpPayout} XP`,
    });
  }

  getHudState() {
    if (!this.activeTrial) return null;
    return {
      name: this.activeTrial.name,
      cleared: this.nextRingIndex,
      total: this.activeRingMeshes.length,
      remaining: Math.max(0, this.activeTrial.timeLimit - this.elapsed),
      goldTime: this.activeTrial.goldTime,
      elapsed: this.elapsed,
    };
  }

  getGoldCount() {
    return Object.values(this.records).filter((r) => r.medal === 'gold').length;
  }

  getCompletedCount() {
    return Object.keys(this.records).length;
  }

  serialize() {
    return { records: { ...this.records } };
  }

  deserialize(data) {
    if (data?.records) this.records = { ...data.records };
  }
}
