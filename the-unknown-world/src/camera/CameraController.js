// Adjustable 2.5D Adventure Camera Controller.
// Delivers a rich, painterly 2.5D perspective (default 38° angle, 18.5m distance, 42° FOV)
// with smooth player tracking, zoom in/out (9m..38m), full 360° orbit rotation, adjustable pitch (18°..64°),
// terrain collision avoidance, and smooth cinematic framing sweeps on landmark discovery.
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
    this.minPitch = 0.30; // ~17° heroic angle
    this.maxPitch = 1.12; // ~64° tactical isometric 2.5D

    this.focusPos = new THREE.Vector3();
    this.initialized = false;

    // Optional cinematic discovery swoop
    this.cinematic = null;
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setPreset(mode) {
    if (mode === 'close') {
      this.targetDistance = 12;
      this.targetPitch = 0.42;
    } else if (mode === 'isometric') {
      this.targetDistance = 26;
      this.targetPitch = 0.96;
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
    // Apply player camera controls (mouse drag, Q/E yaw, R/F pitch, wheel/pinch zoom)
    this.targetYaw -= input.camYawDelta;
    this.targetPitch = clamp(this.targetPitch + input.camPitchDelta, this.minPitch, this.maxPitch);
    this.targetDistance = clamp(this.targetDistance + input.camZoomDelta, this.minDistance, this.maxDistance);

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
    const cx = this.focusPos.x + Math.sin(this.yaw) * horiz;
    const cz = this.focusPos.z + Math.cos(this.yaw) * horiz;
    let cy = this.focusPos.y + vert;

    // Terrain collision avoidance so camera never clips beneath mountains or hills
    const groundAtCam = this.terrain.getHeight(cx, cz);
    const minCamY = Math.max(groundAtCam + 2.2, 1.4);
    if (cy < minCamY) cy = minCamY;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.focusPos);
  }
}
