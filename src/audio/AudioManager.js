// Original synthesized audio; no context or sound is created until a user gesture.
export const DEFAULT_AUDIO = Object.freeze({
  master: 0.35,
  music: 0.18,
  effects: 0.5,
  ambience: 0.3,
  muted: false,
});
export function validAudio(s) {
  return (
    !!s &&
    ["master", "music", "effects", "ambience"].every(
      (k) => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 1,
    ) &&
    typeof s.muted === "boolean"
  );
}
export class AudioManager {
  constructor(settings = DEFAULT_AUDIO) {
    this.settings = { ...settings };
    this.context = null;
  }
  async start() {
    if (this.context) {
      if (this.context.state === "suspended") await this.context.resume();
      return;
    }
    const AudioContextClass =
      globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is unavailable");
    const ctx = new AudioContextClass();
    this.context = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.connect(this.master);
    this.effects = ctx.createGain();
    this.effects.connect(this.master);
    this.ambience = ctx.createGain();
    this.ambience.connect(this.master);
    // Two quiet oscillators make a simple original drone; wind is filtered deterministic noise.
    for (const freq of [110, 164.81]) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.035;
      osc.connect(gain);
      gain.connect(this.music);
      osc.start();
    }
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
      samples = noise.getChannelData(0);
    let seed = 4231;
    for (let i = 0; i < samples.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      samples[i] = ((seed / 4294967296) * 2 - 1) * 0.13;
    }
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter();
    source.buffer = noise;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 420;
    source.connect(filter);
    filter.connect(this.ambience);
    source.start();
    this.apply();
    if (ctx.state === "suspended") await ctx.resume();
  }
  apply() {
    if (!this.context) return;
    const t = this.context.currentTime,
      s = this.settings;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.03);
    for (const key of ["music", "effects", "ambience"])
      this[key].gain.setTargetAtTime(s[key], t, 0.03);
  }
  play(kind) {
    if (!this.context || this.context.state !== "running") return;
    const pitch =
      {
        step: 110,
        gather: 610,
        hit: 155,
        puzzle: 510,
        hurt: 90,
        jump: 260,
        splash: 180,
      }[kind] || 300;
    const ctx = this.context,
      osc = ctx.createOscillator(),
      envelope = ctx.createGain(),
      now = ctx.currentTime;
    osc.type = kind === "step" ? "sine" : "triangle";
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(45, pitch * 0.68),
      now + 0.12,
    );
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(
      kind === "step" ? 0.025 : 0.07,
      now + 0.012,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(envelope);
    envelope.connect(this.effects);
    osc.start(now);
    osc.stop(now + 0.17);
  }
  snapshot() {
    return { ...this.settings };
  }
}
