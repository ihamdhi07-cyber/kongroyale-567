// Instanced Gouache & Watercolor Vegetation System (Chunk-Streamed).
// Generates region-appropriate instanced flora (layered broadleaf oaks, alpine pines, coastal palms,
// surreal lavender blossom trees, mossy boulders, glowing cavern crystals, swaying meadow grass, and wildflowers)
// with zero draw-call explosion and shared vertex-wind WatercolorShader materials.
import * as THREE from 'three';
import { patchWatercolorMaterial } from './WatercolorShader.js';
import { LANDMARKS, WORLD_CONFIG } from './WorldSpec.js';
import { hash2D, mulberry32 } from './Noise.js';

function mergeSimpleGeos(geos) {
  let totalVerts = 0;
  let totalIdx = 0;
  for (const g of geos) {
    totalVerts += g.attributes.position.count;
    totalIdx += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(totalVerts * 3);
  const norm = new Float32Array(totalVerts * 3);
  const idx = new Uint32Array(totalIdx);
  let vOff = 0;
  let iOff = 0;
  for (const g of geos) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    pos.set(p.array, vOff * 3);
    norm.set(n.array, vOff * 3);
    if (g.index) {
      const a = g.index.array;
      for (let i = 0; i < a.length; i++) idx[iOff + i] = a[i] + vOff;
      iOff += a.length;
    } else {
      for (let i = 0; i < p.count; i++) idx[iOff + i] = vOff + i;
      iOff += p.count;
    }
    vOff += p.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

export class VegetationSystem {
  constructor(terrain, textures) {
    this.terrain = terrain;
    this.textures = textures;
    this._buildSharedAssets();
  }

  _buildSharedAssets() {
    // Broadleaf tree trunk + clustered anime gouache leaf-puff crown
    const trunk = new THREE.CylinderGeometry(0.28, 0.56, 4.4, 7);
    trunk.translate(0, 2.2, 0);
    this.trunkGeo = trunk;

    const puffs = [];
    const puffSpecs = [
      [0, 5.4, 0, 2.35, 1.85, 2.35],
      [1.35, 4.7, 0.8, 1.65, 1.35, 1.65],
      [-1.3, 4.8, 0.65, 1.7, 1.4, 1.65],
      [0.3, 4.6, -1.45, 1.65, 1.3, 1.65],
      [0.15, 6.7, -0.1, 1.55, 1.25, 1.55],
    ];
    for (const [x, y, z, sx, sy, sz] of puffSpecs) {
      const g = new THREE.IcosahedronGeometry(1, 1);
      g.scale(sx, sy, sz);
      g.translate(x, y, z);
      puffs.push(g);
    }
    this.canopyGeo = mergeSimpleGeos(puffs);

    // Alpine Pine (tiered stylized cones)
    const pineParts = [];
    for (let t = 0; t < 3; t++) {
      const cone = new THREE.ConeGeometry(2.3 - t * 0.55, 2.8 - t * 0.35, 7);
      cone.translate(0, 3.0 + t * 1.65, 0);
      pineParts.push(cone);
    }
    this.pineCrownGeo = mergeSimpleGeos(pineParts);

    // Stylized Boulder (faceted low-poly PBR gouache rock)
    const rock = new THREE.DodecahedronGeometry(1.3, 1);
    rock.scale(1.2, 0.78, 1.05);
    rock.translate(0, 0.55, 0);
    this.rockGeo = rock;

    // Glowing Crystal Spire cluster (Hollow Depths & Shattered Expanse)
    const crysParts = [];
    const cSpecs = [
      [0, 1.6, 0, 0.55, 3.2, 0, 0],
      [0.65, 1.1, 0.35, 0.38, 2.2, 0.25, 0.2],
      [-0.55, 0.95, -0.35, 0.35, 1.9, -0.3, -0.25],
    ];
    for (const [x, y, z, r, h, rx, rz] of cSpecs) {
      const c = new THREE.ConeGeometry(r, h, 5);
      c.rotateX(rx);
      c.rotateZ(rz);
      c.translate(x, y, z);
      crysParts.push(c);
    }
    this.crystalGeo = mergeSimpleGeos(crysParts);

    // Wind-swept Meadow Grass tuft (crossed tapering blades)
    const blades = [];
    for (let b = 0; b < 4; b++) {
      const g = new THREE.PlaneGeometry(0.45, 0.95, 1, 2);
      g.translate(0, 0.47, 0);
      g.rotateY((b / 4) * Math.PI);
      g.rotateX(0.12);
      blades.push(g);
    }
    this.grassGeo = mergeSimpleGeos(blades);

    // Materials patched with Anime Watercolor & Gouache 3D shader
    this.barkMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        map: this.textures.barkMap,
        color: 0x8a694e,
        roughness: 0.9,
        metalness: 0.0,
      }),
      { wind: true, windAmp: 0.08, windFreq: 1.2, windHeightScale: 0.14, rimStrength: 0.14 }
    );

    this.canopyMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.78,
        metalness: 0.0,
      }),
      {
        wind: true,
        windAmp: 0.28,
        windFreq: 1.55,
        windHeightScale: 0.14,
        subsurface: 0.48,
        rimStrength: 0.34,
        gouacheSteps: 0.44,
      }
    );

    this.rockMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        map: this.textures.stoneMap,
        color: 0xa9a69d,
        roughness: 0.88,
        metalness: 0.02,
      }),
      { rimStrength: 0.22, inkEdge: 0.24, gouacheSteps: 0.38 }
    );

    this.crystalMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x62e5f5,
        emissive: 0x2692b8,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.15,
      }),
      { rimStrength: 0.52, inkEdge: 0.08, gouacheSteps: 0.2 }
    );

    this.grassMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.82,
        side: THREE.DoubleSide,
      }),
      {
        wind: true,
        windAmp: 0.32,
        windFreq: 2.3,
        windHeightScale: 1.0,
        subsurface: 0.55,
        paperStrength: 0.04,
        rimStrength: 0.24,
      }
    );
  }

  _isNearLandmarkPad(x, z, margin = 4) {
    for (let i = 0; i < LANDMARKS.length; i++) {
      const lm = LANDMARKS[i];
      const r = lm.padRadius + margin;
      const dx = x - lm.x;
      const dz = z - lm.z;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }

  /**
   * Populates instanced vegetation + static trunk/rock colliders + gatherable herbs for one chunk.
   * Only LOD 0 and LOD 1 receive foliage; LOD 2 stays ultra-lightweight distant terrain.
   */
  populateChunk(cx, cz, chunkSize, lod, foliageScale = 1.0) {
    const group = new THREE.Group();
    const colliders = [];
    const gatherables = [];
    if (lod >= 2) return { group, colliders, gatherables };

    const x0 = cx * chunkSize;
    const z0 = cz * chunkSize;
    const seed = Math.floor(hash2D(cx, cz, WORLD_CONFIG.SEED + 505) * 1e9);
    const rng = mulberry32(seed);

    const broadMatrices = [];
    const broadColors = [];
    const pineMatrices = [];
    const pineColors = [];
    const rockMatrices = [];
    const rockColors = [];
    const crystalMatrices = [];
    const crystalColors = [];
    const grassMatrices = [];
    const grassColors = [];

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const normal = { x: 0, y: 1, z: 0 };

    const treeAttempts = Math.round((lod === 0 ? 34 : 16) * foliageScale);
    for (let i = 0; i < treeAttempts; i++) {
      const wx = x0 + rng() * chunkSize;
      const wz = z0 + rng() * chunkSize;
      const h = this.terrain.getHeight(wx, wz);
      if (h < 1.8 || h > 72) continue;
      if (this.terrain.roadDistance(wx, wz) < 8.5) continue;
      if (this._isNearLandmarkPad(wx, wz, 5)) continue;

      this.terrain.getNormal(wx, wz, normal);
      if (normal.y < 0.78) continue;

      const reg = this.terrain.biomes.getRegionAt(wx, wz);
      if (rng() > reg.treeDensity) continue;

      const scale = 0.85 + rng() * 0.78;
      dummy.position.set(wx, h - 0.15, wz);
      dummy.rotation.set((rng() - 0.5) * 0.08, rng() * Math.PI * 2, (rng() - 0.5) * 0.08);
      dummy.scale.set(scale, scale * (0.9 + rng() * 0.25), scale);
      dummy.updateMatrix();

      // Region-tinted gouache foliage color with sunlit variation
      const vShift = (rng() - 0.5) * 0.14;
      color.setRGB(
        Math.min(1, Math.max(0.08, reg.foliageColor[0] + vShift + (rng() > 0.7 ? 0.12 : 0))),
        Math.min(1, Math.max(0.08, reg.foliageColor[1] + vShift * 0.9)),
        Math.min(1, Math.max(0.08, reg.foliageColor[2] + vShift * 0.5))
      );

      if (reg.id === 'highland-reach' || reg.id === 'hidden-frontier') {
        pineMatrices.push(dummy.matrix.clone());
        pineColors.push(color.clone());
      } else {
        broadMatrices.push(dummy.matrix.clone());
        broadColors.push(color.clone());
      }

      if (lod === 0) {
        colliders.push({ x: wx, z: wz, r: 0.65 * scale });
      }
    }

    // Boulders & Crystals
    const rockAttempts = Math.round((lod === 0 ? 16 : 6) * foliageScale);
    for (let i = 0; i < rockAttempts; i++) {
      const wx = x0 + rng() * chunkSize;
      const wz = z0 + rng() * chunkSize;
      const h = this.terrain.getHeight(wx, wz);
      if (h < -0.5) continue;
      if (this.terrain.roadDistance(wx, wz) < 7) continue;
      if (this._isNearLandmarkPad(wx, wz, 2)) continue;

      const reg = this.terrain.biomes.getRegionAt(wx, wz);
      const scale = 0.7 + rng() * 1.45;
      dummy.position.set(wx, h - 0.25, wz);
      dummy.rotation.set(rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3);
      dummy.scale.set(scale, scale * (0.65 + rng() * 0.55), scale);
      dummy.updateMatrix();

      if ((reg.id === 'hollow-depths' || reg.id === 'shattered-expanse') && rng() > 0.35) {
        crystalMatrices.push(dummy.matrix.clone());
        crystalColors.push(
          new THREE.Color(reg.id === 'shattered-expanse' ? 0xd98ef5 : 0x5fe8f7)
        );
      } else {
        rockMatrices.push(dummy.matrix.clone());
        const tint = 0.84 + rng() * 0.26;
        rockColors.push(new THREE.Color(tint, tint * 0.98, tint * 0.95));
      }
      if (lod === 0) {
        colliders.push({ x: wx, z: wz, r: 1.15 * scale });
      }
    }

    // Lush swaying meadow grass & wildflowers (LOD 0 only)
    if (lod === 0) {
      const grassAttempts = Math.round(240 * foliageScale);
      for (let i = 0; i < grassAttempts; i++) {
        const wx = x0 + rng() * chunkSize;
        const wz = z0 + rng() * chunkSize;
        const h = this.terrain.getHeight(wx, wz);
        if (h < 1.5 || h > 58) continue;
        if (this.terrain.roadDistance(wx, wz) < 5.5) continue;
        if (this._isNearLandmarkPad(wx, wz, -6)) continue;

        const reg = this.terrain.biomes.getRegionAt(wx, wz);
        if (rng() > reg.grassDensity) continue;

        const s = 0.7 + rng() * 0.85;
        dummy.position.set(wx, h - 0.05, wz);
        dummy.rotation.set(0, rng() * Math.PI * 2, 0);
        dummy.scale.set(s, s * (0.75 + rng() * 0.5), s);
        dummy.updateMatrix();
        grassMatrices.push(dummy.matrix.clone());

        // 15% sunlit meadow wildflowers (buttercup gold, lavender, coral-pink)
        if (rng() < 0.14) {
          const fl = rng();
          color.setHex(fl < 0.45 ? 0xf6d860 : fl < 0.75 ? 0xd99be8 : 0xf49686);
        } else {
          const v = (rng() - 0.5) * 0.14;
          color.setRGB(
            Math.min(1, Math.max(0.1, reg.groundColor[0] + 0.08 + v)),
            Math.min(1, Math.max(0.1, reg.groundColor[1] + 0.1 + v)),
            Math.min(1, Math.max(0.1, reg.groundColor[2] + v * 0.5))
          );
        }
        grassColors.push(color.clone());
      }

      // Deterministic harvestable world resources per chunk (Sunberries, Moonpetals, Heartwood, Crystal Shards)
      for (let g = 0; g < 3; g++) {
        const wx = x0 + 10 + rng() * (chunkSize - 20);
        const wz = z0 + 10 + rng() * (chunkSize - 20);
        const h = this.terrain.getHeight(wx, wz);
        if (h < 1.2) continue;
        if (this._isNearLandmarkPad(wx, wz, 2)) continue;
        const reg = this.terrain.biomes.getRegionAt(wx, wz);
        let itemId = 'sunberry';
        let label = 'Golden Sunberry Bush';
        let hex = 0xf5b342;
        if (reg.id === 'emerald-wilds' && rng() > 0.35) {
          itemId = 'moonpetal';
          label = 'Silver Moonpetal Blossom';
          hex = 0x9ef0ff;
        } else if (reg.id === 'highland-reach' && rng() > 0.3) {
          itemId = 'frostbloom';
          label = 'Highland Frostbloom';
          hex = 0xbbe8ff;
        } else if (reg.id === 'azure-coast' && rng() > 0.3) {
          itemId = 'sea-glass';
          label = 'Azure Sea Glass';
          hex = 0x5be5dc;
        } else if (reg.id === 'shattered-expanse' && rng() > 0.35) {
          itemId = 'skyfeather';
          label = 'Updraft Skyfeather';
          hex = 0xe9b0ff;
        } else if (reg.id === 'hollow-depths' && rng() > 0.25) {
          itemId = 'crystal-shard';
          label = 'Resonant Crystal Cluster';
          hex = 0x62e5f5;
        } else if (rng() > 0.55) {
          itemId = 'heartwood';
          label = 'Fallen Ancient Heartwood';
          hex = 0x9e6a42;
        }
        gatherables.push({
          id: `res_${cx}_${cz}_${g}`,
          itemId,
          label,
          color: hex,
          x: wx,
          y: h,
          z: wz,
        });
      }
    }

    // Helper to build InstancedMesh cleanly
    const addInstanced = (geo, mat, matrices, colors, castShadow = true) => {
      if (matrices.length === 0) return;
      const im = new THREE.InstancedMesh(geo, mat, matrices.length);
      im.castShadow = castShadow && lod === 0;
      im.receiveShadow = true;
      for (let i = 0; i < matrices.length; i++) {
        im.setMatrixAt(i, matrices[i]);
        if (colors && colors[i]) im.setColorAt(i, colors[i]);
      }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      group.add(im);
    };

    addInstanced(this.trunkGeo, this.barkMat, broadMatrices, null, true);
    addInstanced(this.canopyGeo, this.canopyMat, broadMatrices, broadColors, true);
    addInstanced(this.trunkGeo, this.barkMat, pineMatrices, null, true);
    addInstanced(this.pineCrownGeo, this.canopyMat, pineMatrices, pineColors, true);
    addInstanced(this.rockGeo, this.rockMat, rockMatrices, rockColors, true);
    addInstanced(this.crystalGeo, this.crystalMat, crystalMatrices, crystalColors, false);
    addInstanced(this.grassGeo, this.grassMat, grassMatrices, grassColors, false);

    return { group, colliders, gatherables };
  }
}
