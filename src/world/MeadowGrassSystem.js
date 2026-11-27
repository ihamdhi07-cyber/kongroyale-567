// GPU-Instanced Wind-Swaying 3D Meadow Grass & Wildflower System (Studio Ghibli / BOTW Style).
// Renders up to 4,400 tapered grass blades + 450 pastel wildflowers in just TWO draw calls,
// recentering smoothly around Aelira every 4 m with ZERO runtime allocations:
//   - Organic rolling wind-wave shader + interactive footstep bending around the player
//   - Warm sunlit-tip to mossy-root gradient matching terrain hues by biome
//   - Automatically clears roads, cobblestone plazas, water, and steep cliffs
import * as THREE from 'three';
import { LANDMARKS } from './WorldSpec.js';
import { WATERFALLS } from './BiomeWonders.js';

const GRASS_VERT = /* glsl */ `
uniform float uTime;
uniform vec3 uPlayerPos;
uniform float uWindStrength;

varying float vTip;
varying vec3 vColor;

void main() {
  vTip = uv.y;
  #ifdef USE_INSTANCING_COLOR
    vColor = instanceColor;
  #else
    vColor = vec3(0.45, 0.72, 0.34);
  #endif

  vec3 pos = position;
  vec4 worldBase = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

  // Rolling meadow wind gusts (two layered directional waves)
  float wave1 = sin(worldBase.x * 0.14 + worldBase.z * 0.10 + uTime * 2.15);
  float wave2 = cos(worldBase.x * 0.31 - worldBase.z * 0.24 + uTime * 3.4);
  float bend = (wave1 * 0.68 + wave2 * 0.32) * 0.34 * uWindStrength * vTip * vTip;

  // Interactive soft parting away from Aelira's feet!
  vec2 away = worldBase.xz - uPlayerPos.xz;
  float dist = length(away);
  float push = (1.0 - smoothstep(0.35, 1.85, dist)) * vTip * vTip;
  vec2 pushDir = dist > 0.001 ? away / dist : vec2(1.0, 0.0);

  vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.0);
  wp.x += bend + pushDir.x * push * 0.58;
  wp.z += bend * 0.65 + pushDir.y * push * 0.58;
  wp.y -= push * 0.26;

  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const GRASS_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uSunColor;
uniform vec3 uShadowTint;
uniform float uNightFactor;

varying float vTip;
varying vec3 vColor;

void main() {
  // Root melts smoothly into meadow ground; tips catch warm golden gouache sunlight
  vec3 rootCol = vColor * mix(vec3(0.76, 0.80, 0.76), uShadowTint, 0.35);
  vec3 tipCol = vColor * mix(vec3(1.18, 1.16, 0.96), uSunColor, 0.32);
  vec3 col = mix(rootCol, tipCol, smoothstep(0.0, 1.0, vTip));
  col *= mix(1.0, 0.42, uNightFactor);
  gl_FragColor = vec4(col, 1.0);
}
`;

function hash2D(ix, iz) {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function createCrossedBladeGeometry() {
  // Lush 3-blade organic meadow tuft per instance (soft tapered silhouettes, zero rigid rows!)
  const verts = [];
  const uvs = [];
  const indices = [];
  const blades = [
    { ang: 0.0, ox: 0.0, oz: 0.0, h: 0.72, lean: 0.18 },
    { ang: 2.05, ox: 0.12, oz: 0.08, h: 0.58, lean: 0.16 },
    { ang: 4.18, ox: -0.11, oz: 0.09, h: 0.64, lean: 0.17 },
  ];
  let vOff = 0;

  for (const b of blades) {
    const ca = Math.cos(b.ang);
    const sa = Math.sin(b.ang);
    const rows = [
      { y: 0.0, w: 0.085, z: 0.0, v: 0.0 },
      { y: b.h * 0.44, w: 0.058, z: b.lean * 0.25, v: 0.48 },
      { y: b.h * 0.82, w: 0.022, z: b.lean * 0.72, v: 0.85 },
    ];
    for (const r of rows) {
      verts.push(b.ox - r.w * ca - r.z * sa, r.y, b.oz - r.w * sa + r.z * ca);
      uvs.push(0, r.v);
      verts.push(b.ox + r.w * ca - r.z * sa, r.y, b.oz + r.w * sa + r.z * ca);
      uvs.push(1, r.v);
    }
    verts.push(b.ox - b.lean * sa, b.h, b.oz + b.lean * ca);
    uvs.push(0.5, 1.0);

    indices.push(
      vOff + 0, vOff + 1, vOff + 2, vOff + 1, vOff + 3, vOff + 2,
      vOff + 2, vOff + 3, vOff + 4, vOff + 3, vOff + 5, vOff + 4,
      vOff + 4, vOff + 5, vOff + 6
    );
    vOff += 7;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createWildflowerGeometry() {
  // Tiny sunlit wildflower blossom atop a slender stem
  const verts = [];
  const uvs = [];
  const indices = [];

  // 4 petite star petals sitting at y = 0.54m
  const py = 0.54;
  verts.push(0, py + 0.03, 0);
  uvs.push(0.5, 1.0);
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const r = 0.14;
    verts.push(Math.cos(a) * r, py, Math.sin(a) * r);
    uvs.push(0.5, 0.92);
  }
  for (let i = 0; i < petals; i++) {
    const next = ((i + 1) % petals) + 1;
    indices.push(0, i + 1, next);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const FLOWER_PALETTE = [
  new THREE.Color(0xfff4c8), // Meadow buttercup cream
  new THREE.Color(0xffc2d4), // Sakura petal pink
  new THREE.Color(0xffe178), // Sunlit dandelion gold
  new THREE.Color(0xbce8ff), // Sky forget-me-not
  new THREE.Color(0xe4c6ff), // Soft lavender
];

export class MeadowGrassSystem {
  constructor(scene, terrain, preset = null) {
    this.scene = scene;
    this.terrain = terrain;

    this.maxBlades = 4200;
    this.maxFlowers = 480;
    this.activeBlades = this._countForPreset(preset);
    this.activeFlowers = Math.round(this.activeBlades * 0.11);

    this.lastSnapX = Infinity;
    this.lastSnapZ = Infinity;
    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();

    this.uniforms = {
      uTime: { value: 0 },
      uPlayerPos: { value: new THREE.Vector3() },
      uWindStrength: { value: 0.75 },
      uSunColor: { value: new THREE.Color(1.06, 1.0, 0.86) },
      uShadowTint: { value: new THREE.Color(0.58, 0.72, 0.84) },
      uNightFactor: { value: 0 },
    };

    const matOpts = {
      vertexShader: GRASS_VERT,
      fragmentShader: GRASS_FRAG,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
    };

    this.grassMat = new THREE.ShaderMaterial(matOpts);
    this.grassMesh = new THREE.InstancedMesh(createCrossedBladeGeometry(), this.grassMat, this.maxBlades);
    this.grassMesh.frustumCulled = false;
    this.grassMesh.count = 0;

    this.flowerMat = new THREE.ShaderMaterial(matOpts);
    this.flowerMesh = new THREE.InstancedMesh(createWildflowerGeometry(), this.flowerMat, this.maxFlowers);
    this.flowerMesh.frustumCulled = false;
    this.flowerMesh.count = 0;

    this.root = new THREE.Group();
    this.root.name = 'meadow-grass-field';
    this.root.add(this.grassMesh, this.flowerMesh);
    scene.add(this.root);
  }

  _countForPreset(preset) {
    const scale = preset?.foliageScale ?? 1.0;
    if (scale <= 0.4) return 900;
    if (scale <= 0.75) return 2100;
    if (scale <= 1.05) return 3200;
    return 4200;
  }

  applyQuality(preset) {
    this.activeBlades = this._countForPreset(preset);
    this.activeFlowers = Math.min(this.maxFlowers, Math.round(this.activeBlades * 0.11));
    this.lastSnapX = Infinity;
  }

  _isClearedPlaza(x, z) {
    // Keep Crossroads cobblestone plaza (18.2m exact stone curb!) & major stone terraces tidy
    for (const lm of LANDMARKS) {
      const r = lm.id === 'crossroads-village' ? 18.2 : (lm.padRadius || 16) * 0.78;
      const dx = x - lm.x;
      const dz = z - lm.z;
      if (dx * dx + dz * dz < r * r) return true;
    }
    // Keep waterfall plunge pools clear of grass blades!
    for (const wf of WATERFALLS) {
      const r = wf.width * 1.35;
      const dx = x - wf.x;
      const dz = z - wf.z;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }

  _rebuildAround(cx, cz) {
    const radius = 34;
    const step = Math.max(0.95, Math.sqrt((radius * 2 * radius * 2) / Math.max(400, this.activeBlades)));
    let bIdx = 0;
    let fIdx = 0;

    const minX = Math.floor((cx - radius) / step);
    const maxX = Math.ceil((cx + radius) / step);
    const minZ = Math.floor((cz - radius) / step);
    const maxZ = Math.ceil((cz + radius) / step);

    for (let gz = minZ; gz <= maxZ && bIdx < this.activeBlades; gz++) {
      for (let gx = minX; gx <= maxX && bIdx < this.activeBlades; gx++) {
        const jx = hash2D(gx * 3 + 7, gz * 5 + 11);
        const jz = hash2D(gx * 11 + 3, gz * 7 + 19);
        const wx = (gx + jx) * step;
        const wz = (gz + jz) * step;

        // Circular falloff around player
        const dx = wx - cx;
        const dz = wz - cz;
        if (dx * dx + dz * dz > radius * radius) continue;

        const y = this.terrain.getHeight(wx, wz);
        if (y < 0.45 || y > 72) continue; // No underwater or snowy high summit grass

        // Skip dirt/stone paths and paved landmark plazas
        if (this.terrain.roadDistance(wx, wz) < 5.2 || this._isClearedPlaza(wx, wz)) continue;

        // Gentle terrain slope check
        const hx = this.terrain.getHeight(wx + 1.2, wz);
        const hz = this.terrain.getHeight(wx, wz + 1.2);
        if (Math.abs(hx - y) + Math.abs(hz - y) > 1.15) continue;

        const region = this.terrain.biomes.getRegionAt(wx, wz);
        const rid = region?.id || 'verdant-valley';
        if (rid === 'azure-coast' && y < 3.0) continue; // Keep sandy coastal beaches & shipwreck pristine!
        if (rid === 'highland-reach' && y > 46) continue;
        if (rid === 'hollow-depths' && jx > 0.45) continue;

        // Soft organic clump variation (prevents rigid grid feel)
        const clump = Math.sin(wx * 0.24) * Math.cos(wz * 0.21);
        if (clump < -0.45 && jx > 0.4) continue;

        // Biome-tailored Studio Ghibli gouache meadow tint (blends harmoniously with terrain!)
        if (rid === 'emerald-wilds') this._color.setHex(0x529248);
        else if (rid === 'azure-coast') this._color.setHex(0x889e52);
        else if (rid === 'forgotten-kingdom') this._color.setHex(0x8b924e);
        else if (rid === 'shattered-expanse') this._color.setHex(0x6e8574);
        else if (rid === 'hollow-depths') this._color.setHex(0x4b7874);
        else if (rid === 'hidden-frontier') this._color.setHex(0x588c5c);
        else this._color.setHex(0x6fa14a); // Warm sunlit Verdant Valley meadow

        // Organic patch luminance variation
        const patch = 0.88 + jz * 0.24;
        this._color.multiplyScalar(patch);

        const scaleH = (0.72 + jx * 0.65) * (rid === 'emerald-wilds' ? 1.18 : 1.0);
        const scaleW = 0.85 + jz * 0.45;
        this._dummy.position.set(wx, y - 0.04, wz);
        this._dummy.rotation.set(0, jx * Math.PI * 2, 0);
        this._dummy.scale.set(scaleW, scaleH, scaleW);
        this._dummy.updateMatrix();
        this.grassMesh.setMatrixAt(bIdx, this._dummy.matrix);
        this.grassMesh.setColorAt(bIdx, this._color);
        bIdx++;

        // Sprinkle blooming pastel wildflowers across sunny meadows (~10% of blades)
        if (fIdx < this.activeFlowers && jx > 0.88 && (rid === 'verdant-valley' || rid === 'emerald-wilds' || rid === 'hidden-frontier')) {
          const fCol = FLOWER_PALETTE[Math.floor(jz * FLOWER_PALETTE.length) % FLOWER_PALETTE.length];
          this._dummy.position.set(wx, y - 0.02, wz);
          this._dummy.rotation.set(0, jz * Math.PI * 2, 0);
          const fs = 0.78 + jx * 0.5;
          this._dummy.scale.set(fs, fs * scaleH, fs);
          this._dummy.updateMatrix();
          this.flowerMesh.setMatrixAt(fIdx, this._dummy.matrix);
          this.flowerMesh.setColorAt(fIdx, fCol);
          fIdx++;
        }
      }
    }

    this.grassMesh.count = bIdx;
    this.grassMesh.instanceMatrix.needsUpdate = true;
    if (this.grassMesh.instanceColor) this.grassMesh.instanceColor.needsUpdate = true;

    this.flowerMesh.count = fIdx;
    this.flowerMesh.instanceMatrix.needsUpdate = true;
    if (this.flowerMesh.instanceColor) this.flowerMesh.instanceColor.needsUpdate = true;
  }

  update(dt, elapsed, playerPos, envState = null, isIndoors = false) {
    this.root.visible = !isIndoors;
    if (isIndoors || !playerPos) return;

    this.uniforms.uTime.value = elapsed;
    this.uniforms.uPlayerPos.value.copy(playerPos);
    this.uniforms.uNightFactor.value = envState?.nightFactor ?? 0;

    // Re-center field only when player moves >= 4 m from last snap anchor
    const sx = Math.round(playerPos.x / 4) * 4;
    const sz = Math.round(playerPos.z / 4) * 4;
    if (Math.hypot(sx - this.lastSnapX, sz - this.lastSnapZ) >= 4) {
      this.lastSnapX = sx;
      this.lastSnapZ = sz;
      this._rebuildAround(sx, sz);
    }
  }
}
