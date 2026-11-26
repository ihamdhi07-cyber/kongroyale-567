// RequestAnimationFrame loop with clamped delta time, pause support, and rolling FPS/frame-time telemetry.
export class GameLoop {
  constructor(onTick) {
    this.onTick = onTick;
    this.running = false;
    this.paused = false;
    this.rafId = null;
    this.lastTime = 0;
    this.elapsed = 0;
    this.fps = 60;
    this.frameMs = 16.67;
    this._accumFrames = 0;
    this._accumTime = 0;
    this._boundFrame = this._frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this._boundFrame);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (!this.paused) {
      this.lastTime = performance.now();
    }
  }

  _frame(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this._boundFrame);
    const rawMs = Math.max(0.1, now - this.lastTime);
    this.lastTime = now;
    // Clamp dt to 50ms so tab switches or mobile stalls never tunnel physics
    const dt = Math.min(rawMs / 1000, 0.05);

    this._accumFrames++;
    this._accumTime += rawMs;
    if (this._accumTime >= 500) {
      this.fps = Math.round((this._accumFrames * 1000) / this._accumTime);
      this.frameMs = +(this._accumTime / this._accumFrames).toFixed(1);
      this._accumFrames = 0;
      this._accumTime = 0;
    }

    if (!this.paused) {
      this.elapsed += dt;
    }
    this.onTick(this.paused ? 0 : dt, this.elapsed, this.paused);
  }
}
