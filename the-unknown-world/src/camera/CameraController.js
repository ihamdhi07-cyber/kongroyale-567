// Adjustable 2.5D Adventure Camera Controller.
// Delivers a rich, painterly 2.5D perspective (default 37° angle, 18.5m distance, 42° FOV)
// with smooth player tracking, zoom in/out (8.5m..38m), full 360° orbit rotation, adjustable pitch (17°..64°),
// terrain collision avoidance, indoor/outdoor sanctuary transitions, photo framing, and impact camera shake.
import * as THREE from 'three';
import { clamp, lerp } from '../world/Noise.js';

export class CameraController {
  constructor(terrain) {
    this.terrain = terrain;
    const aspect = typeof window !== 'undefined' && window.innerHeight ? window.innerWidth / window.innerHeight : 16 / 9;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.3, 3400);

    this.yaw = 0.32;
    this.targetYaw = 0.32;
    this.pitch = 0.64; // ~37 degrees — iconic 2.5D adventure vantage
    this.targetPitch = 0.64;
    this.distance = 18.5;
    this.targetDistance = 18.5;

    this.minDistance = 8.5;
    this.maxDistance = 38.0;
    this.minPitch = 0.28; // ~16° heroic angle
    this.maxPitch = 1.12; // ~64° tactical isometric 2.5D

    this.invertY = false;
    this.indoorMode = false;
    this._savedOutdoor = null;

    this.focusPos = new THREE.Vector3();
    this.initialized = false;
    this.cinematic = null;
    this._shake = 0;
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFov(fov) {
    this.camera.fov = clamp(fov, 32, 68);
    this.camera.updateProjectionMatrix();
  }

  addShake(intensity = 0.35) {
    this._shake = Math.min(0.85, this._shake + intensity);
  }

  setIndoorMode(active) {
    if (active === this.indoorMode) return;
    this.indoorMode = active;
    if (active) {
      this._savedOutdoor = {
        distance: this.targetDistance,
        pitch: this.targetPitch,
        yaw: this.targetYaw,
      };
      this.targetDistance = 12.2;
      this.targetPitch = 0.72;
      this.targetYaw = 0.0;
    } else if (this._savedOutdoor) {
      this.targetDistance = this._savedOutdoor.distance;
      this.targetPitch = this._savedOutdoor.pitch;
      this.targetYaw = this._savedOutdoor.yaw;
      this._savedOutdoor = null;
    }
  }

  setPreset(mode) {
    if (mode === 'close') {
      this.targetDistance = 12;
      this.targetPitch = 0.42;
    } else if (mode === 'isometric') {
      this.targetDistance = 26;
      this.targetPitch = 0.96;
    } else if (mode === 'photo') {
      this.targetDistance = 15.5;
      this.targetPitch = 0.34;
    } else {
      // Default balanced 2.5D
      this.targetDistance = 18.5;
      this.targetPitch = 0.64;
    }
  }

  triggerCinematic(lookTarget, duration = 2.6) {
    this.cinematic = {
      target: lookTarget.clone(),
      timer: duration,
      duration,
      startYaw: this.targetYaw,
    };
  }

  update(dt, playerPos, input) {
    const pitchSign = this.invertY ? -1 : 1;
    this.targetYaw -= input.camYawDelta || 0;
    this.targetPitch = clamp(this.targetPitch + (input.camPitchDelta || 0) * pitchSign, this.minPitch, this.maxPitch);
    this.targetDistance = clamp(this.targetDistance + (input.camZoomDelta || 0), this.minDistance, this.maxDistance);

    if (this.cinematic) {
      this.cinematic.timer -= dt;
      this.targetYaw += dt * 0.32;
      if (this.cinematic.timer <= 0) {
        this.cinematic = null;
      }
    }

    const smooth = Math.min(1, dt * 10);
    this.yaw = lerp(this.yaw, this.targetYaw, smooth);
    this.pitch = lerp(this.pitch, this.targetPitch, smooth);
    this.distance = lerp(this.distance, this.targetDistance, smooth);

    const desiredFocus = this.cinematic
      ? playerPos.clone().lerp(this.cinematic.target, 0.45)
      : playerPos.clone().add(new THREE.Vector3(0, 1.55, 0));

    if (!this.initialized) {
      this.focusPos.copy(desiredFocus);
      this.initialized = true;
    } else {
      this.focusPos.lerp(desiredFocus, Math.min(1, dt * 9.5));
    }

    // Compute spherical offset around focus point
    const horiz = Math.cos(this.pitch) * this.distance;
    const vert = Math.sin(this.pitch) * this.distance;
    let cx = this.focusPos.x + Math.sin(this.yaw) * horiz;
    let cz = this.focusPos.z + Math.cos(this.yaw) * horiz;
    let cy = this.focusPos.y + vert;

    // Terrain collision avoidance outdoors (disabled inside enclosed sanctuary rooms at y=600)
    if (!this.indoorMode) {
      const groundAtCam = this.terrain.getHeight(cx, cz);
      const minCamY = Math.max(groundAtCam + 2.2, playerPos.y < -0.5 ? groundAtCam + 1.2 : 1.4);
      if (cy < minCamY) cy = minCamY;
    }

    // Crisp micro-shake decay on combat hits / boss slams
    if (this._shake > 0.001) {
      cx += (Math.random() - 0.5) * this._shake;
      cy += (Math.random() - 0.5) * this._shake * 0.7;
      cz += (Math.random() - 0.5) * this._shake;
      this._shake = Math.max(0, this._shake - dt * 2.4);
    }

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.focusPos);
  }
}
