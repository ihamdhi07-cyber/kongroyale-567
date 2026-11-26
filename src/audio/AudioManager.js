// Procedural Web Audio API Spatial Ambience, Regional Music & SFX Engine.
// Browser-autoplay compliant: unlocks cleanly only after first user interaction.
// Supports Master, Music, SFX, Ambience volumes and Mute toggle.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.muted = false;
    this.volumes = { master: 0.75, music: 0.55, sfx: 0.8, ambient: 0.6 };

    this.currentScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    this._musicTimer = 1.2;
    this._windGain = null;
    this._windFilter = null;
  }

  unlock() {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambientGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambientGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this._startWindBed();
    this._syncGains();
    this.unlocked = true;
  }

  _startWindBed() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 2.8;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.85;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    src.start();

    this._windFilter = filter;
    this._windGain = gain;
  }

  setMixer({ master, music, sfx, ambient, muted }) {
    if (typeof master === 'number') this.volumes.master = master;
    if (typeof music === 'number') this.volumes.music = music;
    if (typeof sfx === 'number') this.volumes.sfx = sfx;
    if (typeof ambient === 'number') this.volumes.ambient = ambient;
    if (typeof muted === 'boolean') this.muted = muted;
    this._syncGains();
  }

  _syncGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volumes.master, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.volumes.music * 0.45, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.volumes.sfx * 0.65, now, 0.04);
    this.ambientGain.gain.setTargetAtTime(this.volumes.ambient * 0.55, now, 0.04);
  }

  _tone(freq, { type = 'sine', dur = 0.35, gain = 0.25, dest = 'sfx', slideTo = null } = {}) {
    if (!this.unlocked || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + dur);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(g);
    g.connect(dest === 'music' ? this.musicGain : this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  playFootstep(surface = 'grass') {
    const map = { grass: 145, dirt: 120, stone: 230, sand: 165, snow: 180, water: 310 };
    const base = map[surface] || 150;
    this._tone(base + Math.random() * 28, {
      type: surface === 'water' ? 'sine' : 'triangle',
      dur: surface === 'water' ? 0.14 : 0.075,
      gain: 0.11,
      slideTo: base * 0.65,
    });
  }

  playAttack(isHeavy = false) {
    this._tone(isHeavy ? 190 : 340, {
      type: isHeavy ? 'sawtooth' : 'triangle',
      dur: isHeavy ? 0.32 : 0.16,
      gain: isHeavy ? 0.24 : 0.18,
      slideTo: isHeavy ? 68 : 130,
    });
  }

  playHit(blocked = false) {
    this._tone(blocked ? 620 : 120, {
      type: blocked ? 'sine' : 'square',
      dur: blocked ? 0.2 : 0.15,
      gain: 0.22,
      slideTo: blocked ? 880 : 55,
    });
  }

  playPickup() {
    this._tone(523.25, { type: 'sine', dur: 0.18, gain: 0.2 });
    setTimeout(() => this._tone(659.25, { type: 'sine', dur: 0.25, gain: 0.2 }), 70);
  }

  playPuzzleNote(freq) {
    this._tone(freq, { type: 'triangle', dur: 0.85, gain: 0.28 });
    this._tone(freq * 1.5, { type: 'sine', dur: 0.7, gain: 0.12 });
  }

  playDiscoveryFanfare() {
    const chord = [392.0, 493.88, 587.33, 783.99];
    chord.forEach((f, i) => {
      setTimeout(() => this._tone(f, { type: 'triangle', dur: 1.1, gain: 0.22, dest: 'music' }), i * 110);
    });
  }

  update(dt, region, weather) {
    if (!this.unlocked || !this.ctx || this.muted) return;

    if (region && region.musicScale) {
      this.currentScale = region.musicScale;
    }

    // Adapt wind/rain ambient filter smoothly
    if (this._windFilter && this._windGain) {
      const now = this.ctx.currentTime;
      const isRain = weather === 'rain';
      this._windFilter.frequency.setTargetAtTime(isRain ? 950 : 340, now, 0.3);
      this._windGain.gain.setTargetAtTime(isRain ? 0.22 : 0.08, now, 0.3);
    }

    // Generative serene anime watercolor harp/flute notes
    this._musicTimer -= dt;
    if (this._musicTimer <= 0) {
      this._musicTimer = 1.6 + Math.random() * 2.4;
      const scale = this.currentScale;
      const note = scale[Math.floor(Math.random() * scale.length)];
      this._tone(note, { type: 'triangle', dur: 1.85, gain: 0.14, dest: 'music' });
      if (Math.random() > 0.55) {
        setTimeout(() => {
          const harm = scale[(scale.indexOf(note) + 2) % scale.length];
          this._tone(harm * 2, { type: 'sine', dur: 1.5, gain: 0.07, dest: 'music' });
        }, 280);
      }
    }
  }
}
