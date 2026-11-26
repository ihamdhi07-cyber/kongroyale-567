// Exploration, Fog-of-War, Landmark Discovery, Waystone Attunement & Fast-Travel System.
// Tracks a 64x64 fog-of-war exploration grid across the 8x8 km playable continent.
import * as THREE from 'three';
import { LANDMARKS, WORLD_CONFIG } from '../world/WorldSpec.js';

export class ExplorationSystem {
  constructor(eventBus = null, progression = null) {
    this.events = eventBus;
    this.progression = progression;
    this.gridSize = 64;
    this.fogGrid = new Uint8Array(this.gridSize * this.gridSize);

    this.discoveredLandmarks = new Set();
    this.attunedWaystones = new Set();
    this.readLore = new Set();

    for (const lm of LANDMARKS) {
      if (lm.discoveredByDefault) {
        this.discoveredLandmarks.add(lm.id);
        if (lm.hasWaystone) this.attunedWaystones.add(lm.id);
        this.revealRadius(lm.x, lm.z, 340);
      }
    }
  }

  worldToCell(x, z) {
    const half = WORLD_CONFIG.PLAYABLE_HALF_M;
    const fx = (x + half) / (half * 2);
    const fz = (z + half) / (half * 2);
    const cx = Math.max(0, Math.min(this.gridSize - 1, Math.floor(fx * this.gridSize)));
    const cz = Math.max(0, Math.min(this.gridSize - 1, Math.floor(fz * this.gridSize)));
    return [cx, cz];
  }

  revealRadius(x, z, radiusMeters = 220) {
    const cellMeters = WORLD_CONFIG.PLAYABLE_SIZE_M / this.gridSize;
    const radCells = Math.ceil(radiusMeters / cellMeters);
    const [pcx, pcz] = this.worldToCell(x, z);
    let newlyRevealed = 0;

    for (let dz = -radCells; dz <= radCells; dz++) {
      for (let dx = -radCells; dx <= radCells; dx++) {
        if (dx * dx + dz * dz > radCells * radCells) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (cx < 0 || cz < 0 || cx >= this.gridSize || cz >= this.gridSize) continue;
        const idx = cz * this.gridSize + cx;
        if (this.fogGrid[idx] === 0) {
          this.fogGrid[idx] = 1;
          newlyRevealed++;
        }
      }
    }
    return newlyRevealed;
  }

  getExplorationPercent() {
    let seen = 0;
    for (let i = 0; i < this.fogGrid.length; i++) {
      if (this.fogGrid[i]) seen++;
    }
    return +((seen / this.fogGrid.length) * 100).toFixed(1);
  }

  attuneWaystone(landmarkId) {
    const lm = LANDMARKS.find((l) => l.id === landmarkId);
    if (!lm || !lm.hasWaystone) return false;
    const wasNew = !this.attunedWaystones.has(landmarkId);
    this.attunedWaystones.add(landmarkId);
    this.discoveredLandmarks.add(landmarkId);
    this.revealRadius(lm.x, lm.z, 520);
    if (wasNew) {
      if (this.progression) this.progression.addXP(65, `Attuned ${lm.name}`);
      if (this.events) {
        this.events.emit('waystone:activate', lm);
        this.events.emit('discovery:banner', {
          subtitle: 'Waystone Attuned · Fast Travel Unlocked',
          title: lm.name,
        });
      }
    }
    return wasNew;
  }

  update(playerPos, cameraController = null) {
    this.revealRadius(playerPos.x, playerPos.z, 210);

    for (const lm of LANDMARKS) {
      if (this.discoveredLandmarks.has(lm.id)) continue;
      const d = Math.hypot(playerPos.x - lm.x, playerPos.z - lm.z);
      if (d <= lm.discoverRadius) {
        this.discoveredLandmarks.add(lm.id);
        this.revealRadius(lm.x, lm.z, 450);
        if (this.progression) {
          this.progression.stats.landmarksDiscovered = this.discoveredLandmarks.size;
          this.progression.addXP(80, `Discovered ${lm.name}`);
        }
        if (cameraController) {
          cameraController.triggerCinematic(new THREE.Vector3(lm.x, lm.padY + 8, lm.z), 2.4);
        }
        if (this.events) {
          this.events.emit(`landmark:discover:${lm.id}`, lm);
          this.events.emit('discovery:banner', {
            subtitle: 'New Location Discovered',
            title: lm.name,
          });
        }
      }
    }
  }

  getSnapshot() {
    return {
      discoveredLandmarks: [...this.discoveredLandmarks],
      attunedWaystones: [...this.attunedWaystones],
      readLore: [...this.readLore],
      fogCells: Array.from(this.fogGrid).reduce((acc, v, i) => {
        if (v) acc.push(i);
        return acc;
      }, []),
    };
  }

  loadSnapshot(snap) {
    if (!snap) return;
    this.discoveredLandmarks = new Set(snap.discoveredLandmarks || ['crossroads-settlement']);
    this.attunedWaystones = new Set(snap.attunedWaystones || ['crossroads-settlement']);
    this.readLore = new Set(snap.readLore || []);
    this.fogGrid.fill(0);
    if (Array.isArray(snap.fogCells)) {
      for (const idx of snap.fogCells) {
        if (idx >= 0 && idx < this.fogGrid.length) this.fogGrid[idx] = 1;
      }
    }
  }
}
