// Instanced Gouache & Watercolor Vegetation System (Chunk-Streamed).
// Generates sculpted 3D multi-puff broadleaf oaks, tiered alpine pines, leafy shrubs, mossy boulders,
// glowing cavern crystals, sculpted 5-blade curved tapering grass tufts, and 3D wildflower blooms —
// with accurate SRGB-to-Linear painterly color management and shared vertex-wind WatercolorShader materials.
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

/** Builds a lush 3-blade curving tapered 3D grass tuft (crisp silhouette, low GPU triangle cost) */
function buildSculptedGrassTuftGeo() {
  const blades = [];
  const bladeCount = 3;
  for (let b = 0; b < bladeCount; b++) {
    const angle = (b / bladeCount) * Math.PI * 2 + 0.35;
    const h = 0.68 + (b % 2) * 0.2;
    const w = 0.16;
    const lean = 0.22 + (b % 2) * 0.1;
    const ox = Math.cos(angle) * 0.1;
    const oz = Math.sin(angle) * 0.1;

    const g = new THREE.BufferGeometry();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const px = -sin;
    const pz = cos;

    // 5-vertex pointed curving blade: baseL, baseR, midL, midR, tip (3 triangles per blade = 9 tris/tuft)
    const verts = new Float32Array([
      ox - px * w, 0, oz - pz * w,
      ox + px * w, 0, oz + pz * w,
      ox + cos * (lean * 0.45) - px * (w * 0.6), h * 0.52, oz + sin * (lean * 0.45) - pz * (w * 0.6),
      ox + cos * (lean * 0.45) + px * (w * 0.6), h * 0.52, oz + sin * (lean * 0.45) + pz * (w * 0.6),
      ox + cos * lean, h, oz + sin * lean,
    ]);
    const indices = [0, 1, 2, 2, 1, 3, 2, 3, 4];
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    blades.push(g);
  }
  return mergeSimpleGeos(blades);
}

/** Builds a charming 3-blossom sculpted wildflower spray */
function buildWildflowerGeo() {
  const parts = [];
  const offsets = [
    [0, 0.55, 0, 0.16],
    [0.24, 0.44, 0.14, 0.13],
    [-0.2, 0.48, -0.16, 0.14],
  ];
  for (const [x, y, z, r] of offsets) {
    const head = new THREE.IcosahedronGeometry(r, 0);
    head.scale(1.1, 0.62, 1.1);
    head.translate(x, y, z);
    parts.push(head);
  }
  return mergeSimpleGeos(parts);
}

export class VegetationSystem {
  constructor(terrain, textures) {
    this.terrain = terrain;
    this.textures = textures;
    this._buildSharedAssets();
  }

  _buildSharedAssets() {
    // Broadleaf tree trunk with flared roots + lush 7-puff Studio Ghibli crown
    const trunkMain = new THREE.CylinderGeometry(0.28, 0.64, 4.6, 7);
    trunkMain.translate(0, 2.3, 0);
    const branchL = new THREE.CylinderGeometry(0.14, 0.24, 2.2, 6);
    branchL.rotateZ(0.55);
    branchL.translate(-0.75, 4.1, 0.2);
    const branchR = new THREE.CylinderGeometry(0.14, 0.24, 2.0, 6);
    branchR.rotateZ(-0.52);
    branchR.translate(0.7, 3.9, -0.2);
    this.trunkGeo = mergeSimpleGeos([trunkMain, branchL, branchR]);

    const puffs = [];
    const puffSpecs = [
      [0, 5.5, 0, 2.45, 1.9, 2.45],
      [1.55, 4.75, 0.85, 1.8, 1.45, 1.75],
      [-1.45, 4.85, 0.7, 1.85, 1.45, 1.75],
      [0.35, 4.65, -1.55, 1.75, 1.38, 1.75],
      [-0.85, 5.2, -1.15, 1.55, 1.3, 1.55],
      [0.2, 6.9, -0.1, 1.7, 1.35, 1.7],
      [1.0, 6.1, -0.65, 1.4, 1.15, 1.4],
    ];
    for (const [x, y, z, sx, sy, sz] of puffSpecs) {
      const g = new THREE.IcosahedronGeometry(1, 1);
      g.scale(sx, sy, sz);
      g.translate(x, y, z);
      puffs.push(g);
    }
    this.canopyGeo = mergeSimpleGeos(puffs);

    // Leafy meadow shrub / hedgerow bush
    const bushPuffs = [];
    for (const [x, y, z, r] of [
      [0, 0.65, 0, 0.92],
      [0.62, 0.5, 0.35, 0.68],
      [-0.58, 0.52, -0.28, 0.72],
    ]) {
      const b = new THREE.IcosahedronGeometry(r, 1);
      b.scale(1.1, 0.82, 1.1);
      b.translate(x, y, z);
      bushPuffs.push(b);
    }
    this.shrubGeo = mergeSimpleGeos(bushPuffs);

    // Alpine Pine (4-tiered stylized spruce)
    const pineParts = [];
    for (let t = 0; t < 4; t++) {
      const cone = new THREE.ConeGeometry(2.55 - t * 0.48, 2.6 - t * 0.28, 7);
      cone.translate(0, 2.6 + t * 1.48, 0);
      pineParts.push(cone);
    }
    this.pineCrownGeo = mergeSimpleGeos(pineParts);

    // Stylized Boulder (faceted gouache rock)
    const rock = new THREE.DodecahedronGeometry(1.3, 1);
    rock.scale(1.22, 0.76, 1.08);
    rock.translate(0, 0.52, 0);
    this.rockGeo = rock;

    // Glowing Crystal Spire cluster
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

    // Sculpted 5-blade curved tapering grass tuft & 3D wildflower spray
    this.grassGeo = buildSculptedGrassTuftGeo();
    this.flowerGeo = buildWildflowerGeo();

    // Materials patched with Anime Watercolor & Gouache 3D shader
    this.barkMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        map: this.textures.barkMap,
        color: 0x73523b,
        roughness: 0.92,
        metalness: 0.0,
      }),
      { wind: true, windAmp: 0.07, windFreq: 1.2, windHeightScale: 0.14, rimStrength: 0.16 }
    );

    this.canopyMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.76,
        metalness: 0.0,
      }),
      {
        wind: true,
        windAmp: 0.26,
        windFreq: 1.5,
        windHeightScale: 0.14,
        subsurface: 0.52,
        rimStrength: 0.36,
        inkEdge: 0.24,
        gouacheSteps: 0.45,
      }
    );

    this.rockMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        map: this.textures.stoneMap,
        color: 0x8f8e88,
        roughness: 0.88,
        metalness: 0.02,
      }),
      { rimStrength: 0.22, inkEdge: 0.26, gouacheSteps: 0.4 }
    );

    this.crystalMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x62e5f5,
        emissive: 0x2692b8,
        emissiveIntensity: 0.72,
        roughness: 0.2,
        metalness: 0.15,
      }),
      { rimStrength: 0.55, inkEdge: 0.08, gouacheSteps: 0.2 }
    );

    this.grassMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        side: THREE.DoubleSide,
      }),
      {
        wind: true,
        windAmp: 0.28,
        windFreq: 2.4,
        windHeightScale: 1.15,
        subsurface: 0.5,
        paperStrength: 0.04,
        rimStrength: 0.22,
        gouacheSteps: 0.28,
      }
    );

    this.flowerMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.65,
      }),
      {
        wind: true,
        windAmp: 0.25,
        windFreq: 2.5,
        windHeightScale: 1.2,
        rimStrength: 0.35,
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
    const shrubMatrices = [];
    const shrubColors = [];
    const rockMatrices = [];
    const rockColors = [];
    const crystalMatrices = [];
    const crystalColors = [];
    const grassMatrices = [];
    const grassColors = [];
    const flowerMatrices = [];
    const flowerColors = [];

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const normal = { x: 0, y: 1, z: 0 };

    // 1. Lush Trees (more abundant & sRGB-accurate deep painterly greens)
    const treeAttempts = Math.round((lod === 0 ? 48 : 22) * foliageScale);
    for (let i = 0; i < treeAttempts; i++) {
      const wx = x0 + rng() * chunkSize;
      const wz = z0 + rng() * chunkSize;
      const h = this.terrain.getHeight(wx, wz);
      if (h < 1.8 || h > 74) continue;
      if (this.terrain.roadDistance(wx, wz) < 7.5) continue;
      if (this._isNearLandmarkPad(wx, wz, 2)) continue;

      this.terrain.getNormal(wx, wz, normal);
      if (normal.y < 0.76) continue;

      const reg = this.terrain.biomes.getRegionAt(wx, wz);
      if (rng() > Math.min(1, reg.treeDensity * 1.18)) continue;

      const scale = 0.85 + rng() * 0.85;
      dummy.position.set(wx, h - 0.15, wz);
      dummy.rotation.set((rng() - 0.5) * 0.08, rng() * Math.PI * 2, (rng() - 0.5) * 0.08);
      dummy.scale.set(scale, scale * (0.92 + rng() * 0.28), scale);
      dummy.updateMatrix();

      // Convert artistic sRGB foliage tint properly into linear color space!
      const vShift = (rng() - 0.5) * 0.14;
      const goldenCrown = rng() > 0.76 ? 0.14 : 0;
      color.setRGB(
        Math.min(0.95, Math.max(0.08, reg.foliageColor[0] + vShift + goldenCrown)),
        Math.min(0.95, Math.max(0.12, reg.foliageColor[1] + vShift * 0.9 + goldenCrown * 0.5)),
        Math.min(0.95, Math.max(0.08, reg.foliageColor[2] + vShift * 0.5)),
        THREE.SRGBColorSpace
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

    // 2. Leafy Shrubs & Boulders & Crystals
    const shrubAttempts = Math.round((lod === 0 ? 18 : 6) * foliageScale);
    for (let i = 0; i < shrubAttempts; i++) {
      const wx = x0 + rng() * chunkSize;
      const wz = z0 + rng() * chunkSize;
      const h = this.terrain.getHeight(wx, wz);
      if (h < 1.5 || h > 62) continue;
      if (this.terrain.roadDistance(wx, wz) < 5.2) continue;
      if (this._isNearLandmarkPad(wx, wz, -8)) continue;

      const reg = this.terrain.biomes.getRegionAt(wx, wz);
      if (rng() > Math.max(0.35, reg.grassDensity)) continue;
      const s = 0.72 + rng() * 0.75;
      dummy.position.set(wx, h - 0.1, wz);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.scale.set(s, s * (0.8 + rng() * 0.3), s);
      dummy.updateMatrix();
      shrubMatrices.push(dummy.matrix.clone());

      const v = (rng() - 0.5) * 0.1;
      color.setRGB(
        Math.min(0.9, Math.max(0.08, reg.foliageColor[0] + 0.06 + v)),
        Math.min(0.9, Math.max(0.12, reg.foliageColor[1] + 0.08 + v)),
        Math.min(0.9, Math.max(0.08, reg.foliageColor[2] + v * 0.4)),
        THREE.SRGBColorSpace
      );
      shrubColors.push(color.clone());
    }

    const rockAttempts = Math.round((lod === 0 ? 18 : 6) * foliageScale);
    for (let i = 0; i < rockAttempts; i++) {
      const wx = x0 + rng() * chunkSize;
      const wz = z0 + rng() * chunkSize;
      const h = this.terrain.getHeight(wx, wz);
      if (h < -0.5) continue;
      if (this.terrain.roadDistance(wx, wz) < 6.8) continue;
      if (this._isNearLandmarkPad(wx, wz, 1)) continue;

      const reg = this.terrain.biomes.getRegionAt(wx, wz);
      const scale = 0.65 + rng() * 1.45;
      dummy.position.set(wx, h - 0.25, wz);
      dummy.rotation.set(rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3);
      dummy.scale.set(scale, scale * (0.65 + rng() * 0.55), scale);
      dummy.updateMatrix();

      if ((reg.id === 'hollow-depths' || reg.id === 'shattered-expanse') && rng() > 0.35) {
        crystalMatrices.push(dummy.matrix.clone());
        crystalColors.push(new THREE.Color(reg.id === 'shattered-expanse' ? 0xd98ef5 : 0x5fe8f7));
      } else {
        rockMatrices.push(dummy.matrix.clone());
        const tint = 0.68 + rng() * 0.24;
        rockColors.push(new THREE.Color().setRGB(tint, tint * 0.99, tint * 0.96, THREE.SRGBColorSpace));
      }
      if (lod === 0) {
        colliders.push({ x: wx, z: wz, r: 1.1 * scale });
      }
    }

    // 3. Sculpted 3D Meadow Grass Tufts & Wildflower Clusters (LOD 0)
    if (lod === 0) {
      const grassAttempts = Math.round(340 * foliageScale);
      for (let i = 0; i < grassAttempts; i++) {
        const wx = x0 + rng() * chunkSize;
        const wz = z0 + rng() * chunkSize;
        const h = this.terrain.getHeight(wx, wz);
        if (h < 1.3 || h > 58) continue;
        if (this.terrain.roadDistance(wx, wz) < 4.4) continue;
        if (this._isNearLandmarkPad(wx, wz, -16)) continue;

        const reg = this.terrain.biomes.getRegionAt(wx, wz);
        if (rng() > reg.grassDensity) continue;

        const s = 0.78 + rng() * 0.85;
        dummy.position.set(wx, h - 0.04, wz);
        dummy.rotation.set(0, rng() * Math.PI * 2, 0);
        dummy.scale.set(s, s * (0.72 + rng() * 0.58), s);
        dummy.updateMatrix();
        grassMatrices.push(dummy.matrix.clone());

        const v = (rng() - 0.5) * 0.14;
        color.setRGB(
          Math.min(0.95, Math.max(0.1, reg.groundColor[0] + 0.05 + v)),
          Math.min(0.95, Math.max(0.14, reg.groundColor[1] + 0.08 + v)),
          Math.min(0.95, Math.max(0.08, reg.groundColor[2] + v * 0.45)),
          THREE.SRGBColorSpace
        );
        grassColors.push(color.clone());
      }

      const flowerAttempts = Math.round(72 * foliageScale);
      const palette = [0xffe066, 0xfff8e2, 0xd99ef7, 0xff9482, 0x8be2ff];
      for (let i = 0; i < flowerAttempts; i++) {
        const wx = x0 + rng() * chunkSize;
        const wz = z0 + rng() * chunkSize;
        const h = this.terrain.getHeight(wx, wz);
        if (h < 1.5 || h > 52) continue;
        if (this.terrain.roadDistance(wx, wz) < 4.5) continue;
        if (this._isNearLandmarkPad(wx, wz, -16)) continue;
        const reg = this.terrain.biomes.getRegionAt(wx, wz);
        if (rng() > reg.grassDensity) continue;

        const s = 0.8 + rng() * 0.7;
        dummy.position.set(wx, h - 0.02, wz);
        dummy.rotation.set(0, rng() * Math.PI * 2, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        flowerMatrices.push(dummy.matrix.clone());
        flowerColors.push(new THREE.Color(palette[Math.floor(rng() * palette.length)]));
      }

      // Deterministic harvestable world resources per chunk
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
    addInstanced(this.shrubGeo, this.canopyMat, shrubMatrices, shrubColors, true);
    addInstanced(this.rockGeo, this.rockMat, rockMatrices, rockColors, true);
    addInstanced(this.crystalGeo, this.crystalMat, crystalMatrices, crystalColors, false);
    addInstanced(this.grassGeo, this.grassMat, grassMatrices, grassColors, false);
    addInstanced(this.flowerGeo, this.flowerMat, flowerMatrices, flowerColors, false);

    return { group, colliders, gatherables };
  }
}
