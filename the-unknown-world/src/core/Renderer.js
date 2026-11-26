// WebGL2 Renderer wrapper with 4 scalable graphics presets (Low / Medium / High / Ultra),
// adaptive DPR clamping for mobile & 4K desktop displays, and WebGL context-loss resilience.
import * as THREE from 'three';

export const QUALITY_PRESETS = {
  low: {
    label: 'Low (720p Mobile)',
    maxDpr: 1.0,
    shadows: false,
    shadowMapSize: 512,
    lod0Radius: 1,
    lod1Radius: 2,
    lod2Radius: 4,
    foliageScale: 0.35,
    particleScale: 0.3,
    waterDetail: 0,
  },
  medium: {
    label: 'Medium (1080p Balanced)',
    maxDpr: 1.25,
    shadows: true,
    shadowMapSize: 1024,
    lod0Radius: 2,
    lod1Radius: 3,
    lod2Radius: 5,
    foliageScale: 0.65,
    particleScale: 0.65,
    waterDetail: 1,
  },
  high: {
    label: 'High (1440p Painterly)',
    maxDpr: 1.5,
    shadows: true,
    shadowMapSize: 2048,
    lod0Radius: 2,
    lod1Radius: 4,
    lod2Radius: 6,
    foliageScale: 1.0,
    particleScale: 1.0,
    waterDetail: 2,
  },
  ultra: {
    label: 'Ultra (4K HD+)',
    maxDpr: 2.0,
    shadows: true,
    shadowMapSize: 2048,
    lod0Radius: 3,
    lod1Radius: 5,
    lod2Radius: 7,
    foliageScale: 1.25,
    particleScale: 1.25,
    waterDetail: 2,
  },
};

export function detectDefaultQuality() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const cores = navigator.hardwareConcurrency || 4;
  if (isTouch && cores <= 4) return 'low';
  if (isTouch) return 'medium';
  return cores >= 8 ? 'high' : 'medium';
}

export class Renderer {
  constructor(canvas, initialQuality = null) {
    this.canvas = canvas;
    this.quality = initialQuality || detectDefaultQuality();
    this.preset = QUALITY_PRESETS[this.quality] || QUALITY_PRESETS.high;
    this.contextLost = false;

    this.webgl = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.webgl.outputColorSpace = THREE.SRGBColorSpace;
    this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.08;
    this.webgl.shadowMap.type = THREE.PCFSoftShadowMap;

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
      this.resize();
    });

    this.applyQuality(this.quality);
    this.resize();
  }

  applyQuality(level) {
    const key = QUALITY_PRESETS[level] ? level : 'high';
    this.quality = key;
    this.preset = QUALITY_PRESETS[key];
    this.webgl.shadowMap.enabled = this.preset.shadows;
    this.webgl.shadowMap.needsUpdate = true;
    this.resize();
    return this.preset;
  }

  resize() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const dpr = Math.min(window.devicePixelRatio || 1, this.preset.maxDpr);
    this.webgl.setPixelRatio(dpr);
    this.webgl.setSize(w, h, false);
  }

  render(scene, camera) {
    if (this.contextLost) return;
    this.webgl.render(scene, camera);
  }

  getStats() {
    const info = this.webgl.info;
    return {
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    };
  }
}
