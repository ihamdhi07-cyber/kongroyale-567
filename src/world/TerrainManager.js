// Deterministic world terrain evaluator: height, surface normal, road distance, river carving, landmark pads,
// and painterly vertex color lookup. Pure math (no WebGL/DOM required), shared identically by chunk rendering,
// physics collision, vegetation scatter, map cartography, and automated unit tests.
import { WORLD_CONFIG, REGIONS, LANDMARKS, ROADS, RIVERS, BOSS_ARENAS } from './WorldSpec.js';
import { Simplex2D, clamp, lerp, smoothstep } from './Noise.js';
import { BiomeManager } from './BiomeManager.js';

function distToSegmentSq(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const len2 = vx * vx + vz * vz;
  if (len2 <= 1e-6) return wx * wx + wz * wz;
  const t = clamp((wx * vx + wz * vz) / len2, 0, 1);
  const cx = ax + vx * t;
  const cz = az + vz * t;
  const dx = px - cx;
  const dz = pz - cz;
  return dx * dx + dz * dz;
}

export class TerrainManager {
  constructor(seed = WORLD_CONFIG.SEED) {
    this.seed = seed;
    this.noiseBase = new Simplex2D(seed + 11);
    this.noiseDetail = new Simplex2D(seed + 47);
    this.noiseRidge = new Simplex2D(seed + 93);
    this.noiseColor = new Simplex2D(seed + 157);
    this.biomes = new BiomeManager(seed);
    this._wScratch = new Float32Array(REGIONS.length);
  }

  /** Minimum distance in metres from (x, z) to the road network */
  roadDistance(x, z) {
    let minD2 = Infinity;
    for (let r = 0; r < ROADS.length; r++) {
      const pts = ROADS[r];
      for (let i = 0; i < pts.length - 1; i++) {
        const d2 = distToSegmentSq(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        if (d2 < minD2) minD2 = d2;
      }
    }
    return Math.sqrt(minD2);
  }

  /** Minimum distance in metres from (x, z) to any river centreline */
  riverInfo(x, z) {
    let minD2 = Infinity;
    let width = 18;
    let depth = 5;
    for (let r = 0; r < RIVERS.length; r++) {
      const rv = RIVERS[r];
      const pts = rv.points;
      for (let i = 0; i < pts.length - 1; i++) {
        const d2 = distToSegmentSq(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        if (d2 < minD2) {
          minD2 = d2;
          width = rv.width;
          depth = rv.depth;
        }
      }
    }
    return { dist: Math.sqrt(minD2), width, depth };
  }

  /** Deterministic ground height at any world coordinate (x, z) in [-7500, +7500] */
  getHeight(x, z) {
    const { weights } = this.biomes.sample(x, z, this._wScratch);

    let baseH = 0;
    let relief = 0;
    let ridgeW = 0;
    for (let i = 0; i < REGIONS.length; i++) {
      const w = weights[i];
      if (w < 0.001) continue;
      const r = REGIONS[i];
      baseH += r.baseHeight * w;
      relief += r.relief * w;
      ridgeW += r.ridgeWeight * w;
    }

    const macro = this.noiseBase.fbm(x * 0.00085, z * 0.00085, 4);
    const medium = this.noiseDetail.fbm(x * 0.0034, z * 0.0034, 3);
    const ridged = this.noiseRidge.ridged(x * 0.0011, z * 0.0011, 4);
    const micro = this.noiseDetail.noise2D(x * 0.022, z * 0.022) * 0.45;

    let h = baseH + macro * relief * 0.72 + medium * relief * 0.22 + (ridged - 0.35) * relief * ridgeW + micro;

    // Gentle coastal slope toward southeast Azure Coast and outer sea margin
    const coastDist = Math.hypot(x - 2450, z - 2350);
    if (coastDist < 1200) {
      const t = 1 - smoothstep(180, 1200, coastDist);
      h = lerp(h, -9.5 + medium * 3.0, t * 0.82);
    }

    // Hollow Depths dramatic sunken canyon depression around (140, -1780)
    const hollowDist = Math.hypot(x - 140, z + 1780);
    if (hollowDist < 420) {
      const t = 1 - smoothstep(70, 420, hollowDist);
      h = lerp(h, 5.5 + medium * 3.5, t * 0.85);
    }

    // Shattered Expanse dramatic canyon chasm under floating islands
    const shatterDist = Math.hypot(x - 1780, z + 1820);
    if (shatterDist < 340 && shatterDist > 68) {
      const ring = Math.sin(clamp((shatterDist - 68) / 272, 0, 1) * Math.PI);
      h -= ring * 26;
    }

    // Carve Silver River channel (keeps water flowing cleanly at ~y=-1.2m where river cuts meadows)
    const rv = this.riverInfo(x, z);
    if (rv.dist < rv.width * 2.6) {
      const bankT = 1 - smoothstep(rv.width * 0.45, rv.width * 2.6, rv.dist);
      // Keep Crossroads bridge crossing shallow & scenic while smoothly carving down below sea level
      const riverBedY = Math.min(h - rv.depth, -1.6);
      h = lerp(h, riverBedY, bankT * 0.88);
    }

    // Smoothly grade roads (subtle terraced path cut, never erasing bridges over the river)
    const rd = this.roadDistance(x, z);
    if (rd < 12 && rv.dist > rv.width * 1.1) {
      const roadT = 1 - smoothstep(3.2, 12, rd);
      h = lerp(h, Math.max(2.2, Math.round(h * 0.5) * 2 + (h - Math.round(h * 0.5) * 2) * 0.5), roadT * 0.35);
    }

    // Honour every Landmark's flat architectural pad contract
    for (let i = 0; i < LANDMARKS.length; i++) {
      const lm = LANDMARKS[i];
      const dx = x - lm.x;
      const dz = z - lm.z;
      const maxR = lm.padRadius + lm.blendRadius;
      if (Math.abs(dx) > maxR || Math.abs(dz) > maxR) continue;
      const d = Math.hypot(dx, dz);
      if (d < maxR) {
        const t = 1 - smoothstep(lm.padRadius, maxR, d);
        h = lerp(h, lm.padY, t);
      }
    }

    // Honour the 4 Sculpted Runic World Boss Arena Pads (guarantees flat cinematic combat terraces!)
    for (let i = 0; i < BOSS_ARENAS.length; i++) {
      const ba = BOSS_ARENAS[i];
      const dx = x - ba.x;
      const dz = z - ba.z;
      const maxR = ba.padRadius + ba.blendRadius;
      if (Math.abs(dx) > maxR || Math.abs(dz) > maxR) continue;
      const d = Math.hypot(dx, dz);
      if (d < maxR) {
        const t = 1 - smoothstep(ba.padRadius, maxR, d);
        h = lerp(h, ba.padY, t);
      }
    }

    // Gentle frontier rise / ocean drop past the 8x8 km playable perimeter (reserving 15x15 km seamlessly)
    const edge = Math.max(Math.abs(x), Math.abs(z));
    if (edge > WORLD_CONFIG.PLAYABLE_HALF_M) {
      const t = smoothstep(WORLD_CONFIG.PLAYABLE_HALF_M, WORLD_CONFIG.ULTIMATE_HALF_M, edge);
      h += Math.sin(x * 0.001 + z * 0.001) * 45 * t;
    }

    return h;
  }

  /** Analytic finite-difference surface normal (unit vector) */
  getNormal(x, z, out = { x: 0, y: 1, z: 0 }) {
    const eps = 1.25;
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);
    const nx = hL - hR;
    const ny = 2 * eps;
    const nz = hD - hU;
    const inv = 1 / Math.hypot(nx, ny, nz);
    out.x = nx * inv;
    out.y = ny * inv;
    out.z = nz * inv;
    return out;
  }

  /** Water surface elevation at (x, z): sea level (0) everywhere ocean/river sits below 0 */
  getWaterLevel() {
    return WORLD_CONFIG.SEA_LEVEL;
  }

  isUnderwater(x, z) {
    return this.getHeight(x, z) < WORLD_CONFIG.SEA_LEVEL - 0.15;
  }

  /** Returns surface type string for footsteps & vegetation logic */
  getSurfaceType(x, z) {
    const h = this.getHeight(x, z);
    if (h < WORLD_CONFIG.SEA_LEVEL + 0.35) return 'water';
    if (h < 2.2) return 'sand';
    if (this.roadDistance(x, z) < 4.2) return 'dirt';
    const n = this.getNormal(x, z);
    if (n.y < 0.78) return 'stone';
    if (h > 68) return 'snow';
    return 'grass';
  }

  /**
   * Computes painterly Anime Watercolor & Gouache RGB color [r, g, b] in 0..1 for vertex coloring
   * based on biome blend, elevation, slope, shoreline sand, roads, and gouache pigment variation.
   */
  getVertexColor(x, z, h, ny) {
    const { weights } = this.biomes.sample(x, z, this._wScratch);
    let gr = 0, gg = 0, gb = 0;
    let sr = 0, sg = 0, sb = 0;
    let ar = 0, ag = 0, ab = 0;

    for (let i = 0; i < REGIONS.length; i++) {
      const w = weights[i];
      if (w < 0.001) continue;
      const reg = REGIONS[i];
      gr += reg.groundColor[0] * w;
      gg += reg.groundColor[1] * w;
      gb += reg.groundColor[2] * w;
      sr += reg.slopeColor[0] * w;
      sg += reg.slopeColor[1] * w;
      sb += reg.slopeColor[2] * w;
      ar += reg.accentColor[0] * w;
      ag += reg.accentColor[1] * w;
      ab += reg.accentColor[2] * w;
    }

    // Painterly gouache pigment blotches (warm sunlit meadow patches & cool mossy hollows)
    const patch = this.noiseColor.fbm(x * 0.011, z * 0.011, 3) * 0.5 + 0.5;
    let r = lerp(gr, ar, patch * 0.34);
    let g = lerp(gg, ag, patch * 0.34);
    let b = lerp(gb, ab, patch * 0.34);

    // Steep rock cliff face transition
    const slopeT = smoothstep(0.86, 0.64, ny);
    r = lerp(r, sr, slopeT);
    g = lerp(g, sg, slopeT);
    b = lerp(b, sb, slopeT);

    // Snow-dusted alpine summits above 64 m
    const snowT = smoothstep(62, 82, h) * smoothstep(0.55, 0.82, ny);
    r = lerp(r, 0.92, snowT);
    g = lerp(g, 0.95, snowT);
    b = lerp(b, 0.99, snowT);

    // Warm golden shoreline sand & wet darkened waterline
    const sandT = 1 - smoothstep(0.6, 3.6, h);
    if (sandT > 0.01) {
      const wet = 1 - smoothstep(-0.6, 0.9, h);
      const sandR = lerp(0.88, 0.63, wet);
      const sandG = lerp(0.79, 0.57, wet);
      const sandB = lerp(0.57, 0.44, wet);
      r = lerp(r, sandR, sandT * 0.9);
      g = lerp(g, sandG, sandT * 0.9);
      b = lerp(b, sandB, sandT * 0.9);
    }

    // Warm ochre traveler dirt road tint
    const rd = this.roadDistance(x, z);
    if (rd < 6.5 && h > 0.8) {
      const roadT = (1 - smoothstep(2.4, 6.5, rd)) * 0.82;
      r = lerp(r, 0.78, roadT);
      g = lerp(g, 0.66, roadT);
      b = lerp(b, 0.47, roadT);
    }

    // Slight plaza cobblestone wash at Crossroads Settlement
    const plazaDist = Math.hypot(x - 0, z - 380);
    if (plazaDist < 26) {
      const pt = 1 - smoothstep(14, 26, plazaDist);
      r = lerp(r, 0.78, pt * 0.75);
      g = lerp(g, 0.73, pt * 0.68);
      b = lerp(b, 0.63, pt * 0.65);
    }

    // Lush deeper mossy edge along riverbanks & lake shores
    const bankT = smoothstep(-0.3, 1.4, h) * (1 - smoothstep(1.4, 5.2, h));
    if (bankT > 0.05) {
      r = lerp(r, r * 0.84, bankT * 0.35);
      g = lerp(g, Math.min(1, g * 1.05), bankT * 0.35);
      b = lerp(b, b * 0.88, bankT * 0.25);
    }

    // Convert artistic sRGB biome palette into true Linear RGB for Three.js r175 color management
    // (eliminates washed-out pastel gamma lift and restores rich Studio Ghibli gouache tonal depth)
    const toLin = (c) => {
      const v = clamp(c, 0.02, 1.0);
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.2);
    };
    return [toLin(r), toLin(g), toLin(b)];
  }
}
