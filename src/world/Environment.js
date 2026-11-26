// Small-scale environment simulation. Time is normalized: 0 midnight, .5 noon.
import * as THREE from "three";
import { seeded } from "../world.js";

export const DAY_SECONDS = 480;
export const DEFAULT_ENVIRONMENT = Object.freeze({
  time: 0.31,
  weather: "clear",
  quality: "medium",
});
export const QUALITIES = ["low", "medium", "high", "ultra"];
export function validEnvironment(e) {
  return (
    !!e &&
    Number.isFinite(e.time) &&
    e.time >= 0 &&
    e.time < 1 &&
    ["clear", "rain"].includes(e.weather) &&
    QUALITIES.includes(e.quality)
  );
}
export function advanceTime(time, seconds) {
  return (time + seconds / DAY_SECONDS) % 1;
}
export function daylight(time) {
  return Math.max(0, Math.sin((time - 0.25) * 2 * Math.PI));
}
export function timeLabel(time) {
  if (time < 0.21 || time >= 0.82) return "NIGHT";
  if (time < 0.3) return "DAWN";
  if (time < 0.48) return "MORNING";
  if (time < 0.68) return "AFTERNOON";
  return "EVENING";
}
export class Environment {
  constructor(scene, renderer, sun, ambient, config = DEFAULT_ENVIRONMENT) {
    this.scene = scene;
    this.renderer = renderer;
    this.sun = sun;
    this.ambient = ambient;
    this.time = config.time;
    this.weather = config.weather;
    this.quality = config.quality;
    const rand = seeded(9102);
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 60;
      positions[i * 3 + 1] = rand() * 30;
      positions[i * 3 + 2] = (rand() - 0.5) * 60;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: "#cbdedb",
      size: 0.16,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    this.rain = new THREE.Points(geometry, material);
    this.rain.frustumCulled = false;
    scene.add(this.rain);
    this.nightColor = new THREE.Color("#243744");
    this.dayColor = new THREE.Color("#bbcbb9");
    this.rainColor = new THREE.Color("#7d9690");
    this.sky = new THREE.Color();
    this.applyQuality();
  }
  applyQuality() {
    const configs = {
      low: [1, false, 80],
      medium: [1.25, true, 160],
      high: [1.5, true, 240],
      ultra: [2, true, 300],
    };
    const [ratio, shadows, count] = configs[this.quality];
    this.renderer.setPixelRatio(
      Math.min(globalThis.devicePixelRatio || 1, ratio),
    );
    this.renderer.shadowMap.enabled = shadows;
    this.rain.geometry.setDrawRange(0, count);
  }
  update(dt, player, running = true) {
    if (running) this.time = advanceTime(this.time, dt);
    const light = daylight(this.time),
      angle = (this.time - 0.25) * 2 * Math.PI;
    this.sky
      .copy(this.nightColor)
      .lerp(this.dayColor, Math.min(1, light * 1.8));
    if (this.weather === "rain") this.sky.lerp(this.rainColor, 0.38);
    this.scene.background.copy(this.sky);
    this.scene.fog.color.copy(this.sky);
    this.ambient.intensity = 0.45 + light * 1.85;
    this.sun.intensity = (this.weather === "rain" ? 2 : 3) * light;
    this.sun.position.set(
      player.x + Math.cos(angle) * 70,
      player.y + Math.max(5, Math.sin(angle) * 80),
      player.z + 35,
    );
    this.sun.target.position.set(player.x, player.y, player.z);
    this.rain.visible = this.weather === "rain";
    if (this.rain.visible) {
      this.rain.position.set(player.x, player.y, player.z);
      if (running) {
        const pos = this.rain.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) - dt * 16;
          if (y < 0) y += 30;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }
    }
    return timeLabel(this.time);
  }
  snapshot() {
    return { time: this.time, weather: this.weather, quality: this.quality };
  }
}
