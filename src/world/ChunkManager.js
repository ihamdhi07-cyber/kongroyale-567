// Dynamic Multi-LOD Chunk Streaming Manager for the 8x8 km playable world (inside the 15x15 km coordinate frame).
// Streams 128m x 128m terrain chunks across 3 LOD levels (LOD0: 44x44, LOD1: 18x18, LOD2: 8x8) with anti-crack skirts,
// budgeted per-frame builds (max 2 chunks/frame), and clean GPU disposal when chunks move out of range.
import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldSpec.js';
import { patchWatercolorMaterial } from './WatercolorShader.js';

const LOD_SEGMENTS = [40, 16, 8];

export class ChunkManager {
  constructor(scene, terrain, textures, vegetation, preset) {
    this.scene = scene;
    this.terrain = terrain;
    this.textures = textures;
    this.vegetation = vegetation;
    this.chunkSize = WORLD_CONFIG.CHUNK_SIZE_M;

    this.chunks = new Map();
    this.collectedGatherables = new Set();
    this.root = new THREE.Group();
    this.root.name = 'streamed-terrain-chunks';
    scene.add(this.root);

    this.lod0Radius = preset.lod0Radius;
    this.lod1Radius = preset.lod1Radius;
    this.lod2Radius = preset.lod2Radius;
    this.foliageScale = preset.foliageScale;

    this.terrainMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        map: textures.terrainMap,
        normalMap: textures.terrainNormal,
        normalScale: new THREE.Vector2(0.65, 0.65),
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.0,
      }),
      {
        paperStrength: 0.1,
        rimStrength: 0.18,
        inkEdge: 0.12,
        gouacheSteps: 0.34,
        cloudShadow: 1.0,
      }
    );

    this.gatherMeshGeo = new THREE.OctahedronGeometry(0.45, 1);
    this._lastPlayerCx = Infinity;
    this._lastPlayerCz = Infinity;
    this._buildQueue = [];
  }

  applyQuality(preset) {
    const changed =
      this.lod0Radius !== preset.lod0Radius ||
      this.lod1Radius !== preset.lod1Radius ||
      this.lod2Radius !== preset.lod2Radius ||
      this.foliageScale !== preset.foliageScale;
    this.lod0Radius = preset.lod0Radius;
    this.lod1Radius = preset.lod1Radius;
    this.lod2Radius = preset.lod2Radius;
    this.foliageScale = preset.foliageScale;
    if (changed) {
      this._lastPlayerCx = Infinity;
      this._lastPlayerCz = Infinity;
    }
  }

  key(cx, cz) {
    return `${cx},${cz}`;
  }

  /** Synchronous warm-up of immediate starting ring so frame 1 & fast-travel are complete & lush */
  primeAround(x, z) {
    const pcx = Math.floor(x / this.chunkSize);
    const pcz = Math.floor(z / this.chunkSize);
    this._lastPlayerCx = pcx;
    this._lastPlayerCz = pcz;
    this._unloadFar(pcx, pcz);
    for (let dz = -this.lod0Radius; dz <= this.lod0Radius; dz++) {
      for (let dx = -this.lod0Radius; dx <= this.lod0Radius; dx++) {
        const k = this.key(pcx + dx, pcz + dz);
        const existing = this.chunks.get(k);
        if (!existing || existing.lod !== 0) {
          if (existing) this._disposeChunk(k);
          this._buildChunk(pcx + dx, pcz + dz, 0);
        }
      }
    }
    this._refreshQueue(pcx, pcz);
  }

  update(playerPos) {
    const pcx = Math.floor(playerPos.x / this.chunkSize);
    const pcz = Math.floor(playerPos.z / this.chunkSize);

    if (pcx !== this._lastPlayerCx || pcz !== this._lastPlayerCz) {
      this._lastPlayerCx = pcx;
      this._lastPlayerCz = pcz;
      this._refreshQueue(pcx, pcz);
      this._unloadFar(pcx, pcz);
    }

    // Budgeted builds: max 2 chunks per frame so exploring across 8 km stays silky-smooth
    let built = 0;
    while (this._buildQueue.length > 0 && built < 2) {
      const task = this._buildQueue.shift();
      const k = this.key(task.cx, task.cz);
      const existing = this.chunks.get(k);
      if (existing && existing.lod === task.lod) continue;
      if (existing) this._disposeChunk(k);
      this._buildChunk(task.cx, task.cz, task.lod);
      built++;
    }
  }

  _desiredLod(dx, dz) {
    const d = Math.max(Math.abs(dx), Math.abs(dz));
    if (d <= this.lod0Radius) return 0;
    if (d <= this.lod1Radius) return 1;
    if (d <= this.lod2Radius) return 2;
    return -1;
  }

  _refreshQueue(pcx, pcz) {
    const tasks = [];
    const maxR = this.lod2Radius;
    for (let dz = -maxR; dz <= maxR; dz++) {
      for (let dx = -maxR; dx <= maxR; dx++) {
        const lod = this._desiredLod(dx, dz);
        if (lod < 0) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        const existing = this.chunks.get(this.key(cx, cz));
        if (!existing || existing.lod !== lod) {
          tasks.push({ cx, cz, lod, dist: dx * dx + dz * dz });
        }
      }
    }
    tasks.sort((a, b) => a.dist - b.dist);
    this._buildQueue = tasks;
  }

  _unloadFar(pcx, pcz) {
    const maxR = this.lod2Radius + 1;
    for (const [k, ch] of this.chunks.entries()) {
      if (Math.abs(ch.cx - pcx) > maxR || Math.abs(ch.cz - pcz) > maxR) {
        this._disposeChunk(k);
      }
    }
  }

  _disposeChunk(k) {
    const ch = this.chunks.get(k);
    if (!ch) return;
    this.root.remove(ch.group);
    ch.terrainGeo.dispose();
    for (const gMesh of ch.gatherMeshes) {
      gMesh.material.dispose();
    }
    this.chunks.delete(k);
  }

  _buildChunk(cx, cz, lod) {
    const segs = LOD_SEGMENTS[lod];
    const size = this.chunkSize;
    const x0 = cx * size;
    const z0 = cz * size;
    const vCount = (segs + 1) * (segs + 1);
    const skirtVerts = (segs + 1) * 4;
    const totalVerts = vCount + skirtVerts;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);

    const nTmp = { x: 0, y: 1, z: 0 };
    const step = size / segs;

    // Main heightfield grid
    for (let iz = 0; iz <= segs; iz++) {
      const wz = z0 + iz * step;
      for (let ix = 0; ix <= segs; ix++) {
        const wx = x0 + ix * step;
        const idx = iz * (segs + 1) + ix;
        const h = this.terrain.getHeight(wx, wz);
        this.terrain.getNormal(wx, wz, nTmp);
        const col = this.terrain.getVertexColor(wx, wz, h, nTmp.y);

        positions[idx * 3] = wx;
        positions[idx * 3 + 1] = h;
        positions[idx * 3 + 2] = wz;

        normals[idx * 3] = nTmp.x;
        normals[idx * 3 + 1] = nTmp.y;
        normals[idx * 3 + 2] = nTmp.z;

        uvs[idx * 2] = (ix / segs);
        uvs[idx * 2 + 1] = (iz / segs);

        colors[idx * 3] = col[0];
        colors[idx * 3 + 1] = col[1];
        colors[idx * 3 + 2] = col[2];
      }
    }

    // Downward anti-crack skirts around all 4 chunk borders (hides LOD T-junctions seamlessly)
    const skirtDrop = lod === 2 ? 12 : 6;
    const writeSkirtVert = (dstIdx, srcIdx) => {
      positions[dstIdx * 3] = positions[srcIdx * 3];
      positions[dstIdx * 3 + 1] = positions[srcIdx * 3 + 1] - skirtDrop;
      positions[dstIdx * 3 + 2] = positions[srcIdx * 3 + 2];
      normals[dstIdx * 3] = normals[srcIdx * 3];
      normals[dstIdx * 3 + 1] = normals[srcIdx * 3 + 1];
      normals[dstIdx * 3 + 2] = normals[srcIdx * 3 + 2];
      uvs[dstIdx * 2] = uvs[srcIdx * 2];
      uvs[dstIdx * 2 + 1] = uvs[srcIdx * 2 + 1];
      colors[dstIdx * 3] = colors[srcIdx * 3];
      colors[dstIdx * 3 + 1] = colors[srcIdx * 3 + 1];
      colors[dstIdx * 3 + 2] = colors[srcIdx * 3 + 2];
    };

    const stride = segs + 1;
    const baseNorth = vCount;
    const baseSouth = baseNorth + stride;
    const baseWest = baseSouth + stride;
    const baseEast = baseWest + stride;

    for (let i = 0; i <= segs; i++) {
      writeSkirtVert(baseNorth + i, i);
      writeSkirtVert(baseSouth + i, segs * stride + i);
      writeSkirtVert(baseWest + i, i * stride);
      writeSkirtVert(baseEast + i, i * stride + segs);
    }

    const indices = [];
    for (let iz = 0; iz < segs; iz++) {
      for (let ix = 0; ix < segs; ix++) {
        const a = iz * stride + ix;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const addSkirtTris = (edgeFn, base, flip) => {
      for (let i = 0; i < segs; i++) {
        const a = edgeFn(i);
        const b = edgeFn(i + 1);
        const sa = base + i;
        const sb = base + i + 1;
        if (flip) indices.push(a, sa, b, b, sa, sb);
        else indices.push(a, b, sa, b, sb, sa);
      }
    };
    addSkirtTris((i) => i, baseNorth, false);
    addSkirtTris((i) => segs * stride + i, baseSouth, true);
    addSkirtTris((i) => i * stride, baseWest, true);
    addSkirtTris((i) => i * stride + segs, baseEast, false);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeBoundingSphere();

    const mesh = new THREE.Mesh(geo, this.terrainMat);
    mesh.receiveShadow = true;
    mesh.castShadow = lod === 0;

    const group = new THREE.Group();
    group.add(mesh);

    const { group: vegGroup, colliders, gatherables } = this.vegetation.populateChunk(
      cx,
      cz,
      size,
      lod,
      this.foliageScale
    );
    group.add(vegGroup);

    // Visual luminous nodes for uncollected harvestable resources
    const gatherMeshes = [];
    const activeGatherables = [];
    for (const g of gatherables) {
      if (this.collectedGatherables.has(g.id)) continue;
      const mat = new THREE.MeshStandardMaterial({
        color: g.color,
        emissive: g.color,
        emissiveIntensity: 0.45,
        roughness: 0.35,
      });
      const m = new THREE.Mesh(this.gatherMeshGeo, mat);
      m.position.set(g.x, g.y + 0.55, g.z);
      m.scale.set(0.9, 1.15, 0.9);
      group.add(m);
      g.mesh = m;
      gatherMeshes.push(m);
      activeGatherables.push(g);
    }

    this.root.add(group);
    this.chunks.set(this.key(cx, cz), {
      cx,
      cz,
      lod,
      group,
      terrainGeo: geo,
      colliders,
      gatherables: activeGatherables,
      gatherMeshes,
    });
  }

  /** Marks a chunk gatherable collected and hides its mesh cleanly */
  markGathered(id) {
    this.collectedGatherables.add(id);
    for (const ch of this.chunks.values()) {
      for (const g of ch.gatherables) {
        if (g.id === id && g.mesh) {
          g.mesh.visible = false;
          g.collected = true;
        }
      }
    }
  }

  /** Queries nearby tree/rock cylinder colliders around (x, z) for smooth obstacle deflection */
  getNearbyColliders(x, z, radius = 8) {
    const cx = Math.floor(x / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    const out = [];
    const r2 = radius * radius;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ch = this.chunks.get(this.key(cx + dx, cz + dz));
        if (!ch || ch.lod !== 0) continue;
        for (const c of ch.colliders) {
          const ddx = c.x - x;
          const ddz = c.z - z;
          if (ddx * ddx + ddz * ddz <= r2) out.push(c);
        }
      }
    }
    return out;
  }

  /** Queries nearby active harvestable resources for PlayerInteraction */
  getNearbyGatherables(x, z, radius = 6) {
    const cx = Math.floor(x / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    const out = [];
    const r2 = radius * radius;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ch = this.chunks.get(this.key(cx + dx, cz + dz));
        if (!ch) continue;
        for (const g of ch.gatherables) {
          if (g.collected) continue;
          const ddx = g.x - x;
          const ddz = g.z - z;
          if (ddx * ddx + ddz * ddz <= r2) out.push(g);
        }
      }
    }
    return out;
  }

  getStats() {
    let lod0 = 0, lod1 = 0, lod2 = 0;
    for (const ch of this.chunks.values()) {
      if (ch.lod === 0) lod0++;
      else if (ch.lod === 1) lod1++;
      else lod2++;
    }
    return { total: this.chunks.size, lod0, lod1, lod2, queued: this._buildQueue.length };
  }
}
