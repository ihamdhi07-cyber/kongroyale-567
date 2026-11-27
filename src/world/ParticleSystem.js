// Pooled 3D Painted Particle VFX System (Combat Sparks, Gather Petals, Landing Dust,
// Boat Wake Foam, Underwater Bubbles, and Puzzle / Unknown Gate Awakening Bursts).
import * as THREE from 'three';

const MAX_PARTICLES = 560;

export class ParticleSystem {
  constructor(scene, spriteMap = null) {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.life = new Float32Array(MAX_PARTICLES);
    this.maxLife = new Float32Array(MAX_PARTICLES);
    this.gravity = new Float32Array(MAX_PARTICLES);
    this.cursor = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.life[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.58,
      map: spriteMap || null,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      alphaTest: 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this._tmpColor = new THREE.Color();
  }

  emitBurst(origin, optsOrColor = {}, countArg, speedArg, lifeArg) {
    let count = 14;
    let color = 0xffe08a;
    let speed = 5;
    let spreadY = 3.5;
    let life = 0.65;
    let gravity = 9;
    if (typeof optsOrColor === 'number') {
      color = optsOrColor;
      if (typeof countArg === 'number') count = countArg;
      if (typeof speedArg === 'number') speed = speedArg;
      if (typeof lifeArg === 'number') life = lifeArg;
    } else if (optsOrColor && typeof optsOrColor === 'object') {
      ({ count = 14, color = 0xffe08a, speed = 5, spreadY = 3.5, life = 0.65, gravity = 9 } = optsOrColor);
    }
    this._tmpColor.setHex(color);
    for (let i = 0; i < count; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
      const i3 = idx * 3;
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.35 + Math.random() * 0.65) * speed;

      this.positions[i3] = origin.x + (Math.random() - 0.5) * 0.45;
      this.positions[i3 + 1] = origin.y + Math.random() * 0.35;
      this.positions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.45;

      this.velocities[i3] = Math.cos(ang) * spd;
      this.velocities[i3 + 1] = (0.25 + Math.random() * 0.75) * spreadY;
      this.velocities[i3 + 2] = Math.sin(ang) * spd;

      this.colors[i3] = this._tmpColor.r;
      this.colors[i3 + 1] = this._tmpColor.g;
      this.colors[i3 + 2] = this._tmpColor.b;

      this.life[idx] = life * (0.65 + Math.random() * 0.55);
      this.maxLife[idx] = this.life[idx];
      this.gravity[idx] = gravity;
    }
  }

  update(dt) {
    let anyAlive = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.life[i] <= 0) continue;
      anyAlive = true;
      this.life[i] -= dt;
      const i3 = i * 3;
      if (this.life[i] <= 0) {
        this.positions[i3 + 1] = -9999;
        continue;
      }
      this.velocities[i3 + 1] -= this.gravity[i] * dt;
      this.positions[i3] += this.velocities[i3] * dt;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * dt;
    }
    if (anyAlive) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.color.needsUpdate = true;
    }
  }
}
