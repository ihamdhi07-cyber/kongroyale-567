// WebGL2 Renderer wrapper with 4 scalable graphics presets (Low / Medium / High / Ultra),
// Kong Royale-inspired Painterly Post-Processing (Selective Bloom + OkLab Color Grade),
// adaptive hardware profiling, DPR clamping, and WebGL context-loss resilience.
import * as THREE from 'three';
import { PostPipeline } from './PostPipeline.js';
import { FrameProfiler, detectHardwareProfile } from './GpuBenchmark.js';

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
    postProcess: false,
    bloomStrength: 0.0,
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
    postProcess: true,
    bloomStrength: 0.22,
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
    postProcess: true,
    bloomStrength: 0.30,
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
    postProcess: true,
    bloomStrength: 0.34,
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
    this.renderScale = 1.0;
    this.shadowOverride = 'preset';
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
    this.hardware = detectHardwareProfile(this.webgl.getContext());
    this.profiler = new FrameProfiler(45);
    this.post = new PostPipeline(this.webgl);
    this.bloomEnabled = true;

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
    this._syncShadows();
    this._syncPost();
    this.resize();
    return this.preset;
  }

  setManualOverrides({ renderScale, shadows, bloom } = {}) {
    if (typeof renderScale === 'number' && Number.isFinite(renderScale)) {
      this.renderScale = Math.max(0.5, Math.min(1.5, renderScale));
    }
    if (shadows) {
      this.shadowOverride = shadows;
    }
    if (typeof bloom === 'boolean') {
      this.bloomEnabled = bloom;
    }
    this._syncShadows();
    this._syncPost();
    this.resize();
  }

  _syncPost() {
    if (!this.post) return;
    const enabled = !!this.preset.postProcess;
    const bloomStrength = this.bloomEnabled ? (this.preset.bloomStrength || 0) : 0;
    this.post.configure({
      enabled,
      bloomStrength,
      exposure: this.webgl.toneMappingExposure || 1.08,
    });
  }

  _syncShadows() {
    const enable =
      this.shadowOverride === 'off' ? false : this.shadowOverride === 'on' ? true : this.preset.shadows;
    this.webgl.shadowMap.enabled = enable;
    this.webgl.shadowMap.needsUpdate = true;
  }

  resize() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const baseDpr = Math.min(window.devicePixelRatio || 1, this.preset.maxDpr);
    const dpr = Math.max(0.5, Math.min(2.25, baseDpr * this.renderScale));
    this.webgl.setPixelRatio(dpr);
    this.webgl.setSize(w, h, false);
    if (this.post) this.post.resize(w, h, dpr);
  }

  render(scene, camera, elapsed = 0, dt = 1 / 60) {
    if (this.contextLost) return;
    if (this.profiler && dt > 0) this.profiler.record(dt);
    if (this.post && this.post.enabled) {
      this.post.render(scene, camera, elapsed);
    } else {
      this.webgl.render(scene, camera);
    }
  }

  getStats() {
    const info = this.webgl.info;
    return {
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      fps: this.profiler ? this.profiler.fps : 60,
      frameMs: this.profiler ? Math.round(this.profiler.avgMs * 10) / 10 : 16.6,
      postActive: !!(this.post && this.post.enabled),
      hdr: !!(this.post && this.post.isHDR),
      gpu: this.hardware ? this.hardware.rendererName : 'WebGL2',
    };
  }
}
