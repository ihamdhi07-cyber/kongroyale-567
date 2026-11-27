// Lightweight Hardware WebGL2 GPU Tier Scorer & Rolling Frame Profiler
// (adapted from Kong Royale engine/gpu-score.ts for adaptive mobile/desktop tuning).

export class FrameProfiler {
  constructor(sampleWindow = 45) {
    this.windowSize = sampleWindow;
    this.samples = [];
    this.fps = 60;
    this.avgMs = 16.6;
    this.p95Ms = 16.6;
  }

  record(dtSeconds) {
    const ms = Math.max(0.5, Math.min(200, dtSeconds * 1000));
    this.samples.push(ms);
    if (this.samples.length > this.windowSize) this.samples.shift();

    let sum = 0;
    for (let i = 0; i < this.samples.length; i++) sum += this.samples[i];
    this.avgMs = sum / this.samples.length;
    this.fps = Math.round(1000 / Math.max(1, this.avgMs));

    const sorted = [...this.samples].sort((a, b) => a - b);
    this.p95Ms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  }

  /** Returns recommended preset delta ('down', 'up', or null) for adaptive quality tuning */
  recommendAdjustment(targetFps = 45) {
    if (this.samples.length < this.windowSize) return null;
    if (this.fps < targetFps - 10 && this.p95Ms > 28) return 'down';
    if (this.fps > targetFps + 12 && this.p95Ms < 15) return 'up';
    return null;
  }
}

export function detectHardwareProfile(gl = null) {
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const memGb = typeof navigator !== 'undefined' ? navigator.deviceMemory || 4 : 4;
  let rendererName = 'WebGL2';
  let isSoftware = false;

  if (gl) {
    try {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      rendererName = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      isSoftware = /SwiftShader|llvmpipe|Software/i.test(String(rendererName));
    } catch {
      // Ignore restricted privacy browsers
    }
  }

  const tier = isSoftware
    ? 'medium'
    : isTouch
      ? cores <= 4 || memGb <= 3
        ? 'low'
        : 'medium'
      : cores >= 8 && memGb >= 8
        ? 'high'
        : 'medium';

  return { isTouch, cores, memGb, rendererName, isSoftware, recommendedQuality: tier };
}
