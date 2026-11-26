// Evaluates smooth organic biome weights across the 8x8 km playable world (and outer 15x15 km frontier).
// Never creates sharp square biome seams: uses domain-warped inverse-distance soft Voronoi weighting.
import { REGIONS } from './WorldSpec.js';
import { Simplex2D } from './Noise.js';

export class BiomeManager {
  constructor(seed = 74209) {
    this.warpNoise = new Simplex2D(seed + 101);
    this.regions = REGIONS;
  }

  /**
   * Returns { primary, weights (Float32Array of length REGIONS.length) } for world position (x, z).
   */
  sample(x, z, outWeights = null) {
    const weights = outWeights || new Float32Array(this.regions.length);
    // Domain warp bends biome borders into organic valleys and coastlines
    const wx = x + this.warpNoise.noise2D(x * 0.00042, z * 0.00042) * 320;
    const wz = z + this.warpNoise.noise2D(x * 0.00042 + 19.7, z * 0.00042 - 11.3) * 320;

    let sum = 0;
    let bestIdx = 0;
    let bestW = -1;

    for (let i = 0; i < this.regions.length; i++) {
      const r = this.regions[i];
      const dx = (wx - r.cx) / r.radius;
      const dz = (wz - r.cz) / r.radius;
      const dist2 = dx * dx + dz * dz;
      // Smooth Gaussian-like radial kernel ensures natural organic transition corridors
      const w = Math.exp(-dist2 * 2.35) + 0.0001;
      weights[i] = w;
      sum += w;
      if (w > bestW) {
        bestW = w;
        bestIdx = i;
      }
    }

    const inv = 1 / sum;
    for (let i = 0; i < weights.length; i++) {
      weights[i] *= inv;
    }

    return {
      primary: this.regions[bestIdx],
      primaryIndex: bestIdx,
      weights,
    };
  }

  getRegionAt(x, z) {
    return this.sample(x, z).primary;
  }
}
