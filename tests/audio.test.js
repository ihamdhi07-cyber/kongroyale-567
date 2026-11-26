import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AudioManager,
  validAudio,
  DEFAULT_AUDIO,
} from "../src/audio/AudioManager.js";
test("audio is lazy and settings validate independently of browser", () => {
  const a = new AudioManager();
  assert.equal(a.context, null);
  assert.ok(validAudio(a.snapshot()));
  assert.equal(validAudio({ ...DEFAULT_AUDIO, master: -1 }), false);
  assert.equal(validAudio({ ...DEFAULT_AUDIO, muted: "no" }), false);
});
test("gain controls and event sound use a context only after start", async () => {
  let made = 0,
    started = 0;
  const param = () => ({
    value: 0,
    setTargetAtTime(v) {
      this.value = v;
    },
    setValueAtTime(v) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v) {
      this.value = v;
    },
  });
  const node = () => ({
    gain: param(),
    frequency: param(),
    connect() {},
    start() {
      started++;
    },
    stop() {},
  });
  class FakeContext {
    constructor() {
      made++;
      this.currentTime = 0;
      this.sampleRate = 100;
      this.state = "running";
      this.destination = {};
    }
    createGain() {
      return node();
    }
    createOscillator() {
      return node();
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(200) };
    }
    createBufferSource() {
      return node();
    }
    createBiquadFilter() {
      return node();
    }
  }
  const previous = globalThis.AudioContext;
  globalThis.AudioContext = FakeContext;
  try {
    const a = new AudioManager();
    assert.equal(made, 0);
    await a.start();
    assert.equal(made, 1);
    a.settings.muted = true;
    a.apply();
    assert.equal(a.master.gain.value, 0);
    a.settings.effects = 0.2;
    a.apply();
    assert.equal(a.effects.gain.value, 0.2);
    a.play("gather");
    assert.equal(started, 4);
  } finally {
    globalThis.AudioContext = previous;
  }
});
