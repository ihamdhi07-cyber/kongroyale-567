// Living World Wildlife Simulation (Peaceful by default!):
//   - Grazing Golden Forest Deer (wander meadows, alert & flee gently if player sprints close)
//   - Gliding Watercolor Songbirds (circle above canopies with animated wingbeats)
//   - Fluttering Meadow Butterflies (dance near trails and clearings)
//   - Darting Silver Fish (visible in Silver River & Azure Coast shallows, harvestable!)
import * as THREE from 'three';
import { patchWatercolorMaterial } from '../world/WatercolorShader.js';
import { WORLD_CONFIG } from '../world/WorldSpec.js';

export class WildlifeManager {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.root = new THREE.Group();
    this.root.name = 'world-wildlife';
    scene.add(this.root);

    this.deer = [];
    this.birds = [];
    this.butterflies = [];
    this.fish = [];

    this._spawnWildlife();
  }

  _buildDeer() {
    const g = new THREE.Group();
    const fur = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0xc98f56, roughness: 0.82 }));
    const belly = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0xf4e8d2, roughness: 0.85 }));
    const horn = new THREE.MeshStandardMaterial({ color: 0xd9cfb8, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.56, 1.32), fur);
    body.position.y = 0.92;
    body.castShadow = true;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.55, 7), fur);
    neck.position.set(0, 1.28, 0.54);
    neck.rotation.x = 0.32;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.45), fur);
    head.position.set(0, 1.54, 0.72);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), belly);
    tail.position.set(0, 1.0, -0.68);
    g.add(body, neck, head, tail);

    for (const sx of [-0.1, 0.1]) {
      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.48, 5), horn);
      antler.position.set(sx, 1.82, 0.65);
      antler.rotation.z = -sx * 2.5;
      g.add(antler);
    }

    const legs = [];
    for (const [lx, lz] of [[-0.2, 0.44], [0.2, 0.44], [-0.2, -0.44], [0.2, -0.44]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.75, 6), fur);
      leg.position.set(lx, 0.38, lz);
      g.add(leg);
      legs.push(leg);
    }
    return { group: g, legs };
  }

  _buildBird() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xf6f0de, roughness: 0.75 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.58, 6), mat);
    body.rotation.x = Math.PI / 2;
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.25), mat);
    wingL.position.x = -0.36;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.25), mat);
    wingR.position.x = 0.36;
    g.add(body, wingL, wingR);
    return { group: g, wingL, wingR };
  }

  _spawnWildlife() {
    // 14 Peaceful Wildlife Herds placed across Valley, Emerald Wilds, Highland Reach & Forgotten Kingdom
    const deerSpots = [
      [-42, 330], [-78, 360], [-145, 250], [115, 425], [140, 290],
      [-210, 190], [-28, 445], [55, 260], [-420, 80], [290, 210],
      [-920, -120], [-1070, -1210], [-1140, -1280], [1080, -90],
    ];
    for (const [x, z] of deerSpots) {
      const { group, legs } = this._buildDeer();
      const y = this.terrain.getHeight(x, z);
      group.position.set(x, y, z);
      this.root.add(group);
      this.deer.push({
        group,
        legs,
        homeX: x,
        homeZ: z,
        x,
        z,
        yaw: Math.random() * Math.PI * 2,
        vx: 0,
        vz: 0,
        state: 'graze',
        timer: 2 + Math.random() * 5,
      });
    }

    // 14 Circling Songbirds (stay loosely centered around the player's current valley!)
    for (let i = 0; i < 14; i++) {
      const { group, wingL, wingR } = this._buildBird();
      this.root.add(group);
      this.birds.push({
        group,
        wingL,
        wingR,
        angle: (i / 14) * Math.PI * 2,
        radius: 26 + (i % 5) * 14,
        alt: 18 + (i % 4) * 7,
        speed: 0.24 + (i % 3) * 0.07,
        flapPhase: i * 1.1,
      });
    }

    // 18 Colorful Meadow Butterflies
    const bColors = [0xffdf68, 0x8deaff, 0xf7a4c4, 0xfff5d6];
    for (let i = 0; i < 18; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: bColors[i % bColors.length], side: THREE.DoubleSide });
      const g = new THREE.Group();
      const wL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.14), mat);
      wL.position.x = -0.09;
      const wR = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.14), mat);
      wR.position.x = 0.09;
      g.add(wL, wR);
      this.root.add(g);
      this.butterflies.push({
        group: g,
        wL,
        wR,
        offsetX: (Math.random() - 0.5) * 34,
        offsetZ: (Math.random() - 0.5) * 34,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 12 Silver River & Azure Coast Trout darting visibly in clear shallows (harvestable!)
    const fishMat = new THREE.MeshStandardMaterial({ color: 0xb7e4f2, metalness: 0.35, roughness: 0.25 });
    const fishCoords = [
      [74, 335], [77, 345], [80, 355], [82, 365], [84, 375], [86, 385], [88, 395], [90, 405],
      [1208, 1175], [1222, 1192], [1545, 1465], [1565, 1485],
    ];
    for (let i = 0; i < fishCoords.length; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.68, 6), fishMat);
      m.rotation.x = Math.PI / 2;
      const [fx, fz] = fishCoords[i];
      m.position.set(fx, WORLD_CONFIG.SEA_LEVEL - 0.35, fz);
      this.root.add(m);
      this.fish.push({ mesh: m, cx: fx, cz: fz, phase: i * 0.9, caught: false });
    }
  }

  getInteractables(playerPos) {
    const out = [];
    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      if (f.caught) continue;
      const d = Math.hypot(playerPos.x - f.mesh.position.x, playerPos.z - f.mesh.position.z);
      if (d <= 4.0) {
        out.push({
          id: `fish_${i}`,
          type: 'gather',
          itemId: 'river-trout',
          fishIndex: i,
          label: 'Catch Silver River Trout',
          x: f.mesh.position.x,
          y: f.mesh.position.y,
          z: f.mesh.position.z,
          radius: 4.0,
        });
      }
    }
    return out;
  }

  catchFish(index) {
    const f = this.fish[index];
    if (!f) return;
    f.caught = true;
    f.mesh.visible = false;
  }

  update(dt, elapsed, playerPos, playerSpeed) {
    // Deer peaceful AI: graze -> wander -> gently flee if player sprints close
    for (const d of this.deer) {
      const distP = Math.hypot(playerPos.x - d.x, playerPos.z - d.z);
      if (distP > 140) continue; // Lightweight sleep for distant wildlife

      if (distP < (playerSpeed > 7 ? 13 : 6.5)) {
        d.state = 'flee';
        const dx = d.x - playerPos.x;
        const dz = d.z - playerPos.z;
        const len = Math.hypot(dx, dz) || 1;
        d.vx = (dx / len) * 8.4;
        d.vz = (dz / len) * 8.4;
        d.timer = 2.6;
      } else {
        d.timer -= dt;
        if (d.timer <= 0) {
          if (d.state === 'wander' || d.state === 'flee') {
            d.state = 'graze';
            d.vx = 0;
            d.vz = 0;
            d.timer = 3 + Math.random() * 4;
          } else {
            d.state = 'wander';
            const angle = Math.atan2(d.homeZ - d.z, d.homeX - d.x) + (Math.random() - 0.5) * 2.2;
            d.vx = Math.cos(angle) * 2.1;
            d.vz = Math.sin(angle) * 2.1;
            d.timer = 2.5 + Math.random() * 3;
          }
        }
      }

      const spd = Math.hypot(d.vx, d.vz);
      if (spd > 0.1) {
        const nx = d.x + d.vx * dt;
        const nz = d.z + d.vz * dt;
        const nh = this.terrain.getHeight(nx, nz);
        if (nh > 1.2) {
          d.x = nx;
          d.z = nz;
        }
        d.yaw = Math.atan2(d.vx, d.vz);
        const swing = Math.sin(elapsed * (d.state === 'flee' ? 14 : 7)) * (d.state === 'flee' ? 0.65 : 0.35);
        d.legs[0].rotation.x = swing;
        d.legs[3].rotation.x = swing;
        d.legs[1].rotation.x = -swing;
        d.legs[2].rotation.x = -swing;
      }
      const gy = this.terrain.getHeight(d.x, d.z);
      d.group.position.set(d.x, gy, d.z);
      d.group.rotation.y = d.yaw;
    }

    // Songbirds circling gracefully above player's vicinity
    for (const b of this.birds) {
      b.angle += dt * b.speed;
      const bx = playerPos.x + Math.cos(b.angle) * b.radius;
      const bz = playerPos.z + Math.sin(b.angle) * b.radius;
      const by = Math.max(playerPos.y + b.alt, 22) + Math.sin(elapsed * 1.4 + b.flapPhase) * 2.2;
      b.group.position.set(bx, by, bz);
      b.group.rotation.y = -b.angle;
      const flap = Math.sin(elapsed * 9.5 + b.flapPhase) * 0.52;
      b.wingL.rotation.z = flap;
      b.wingR.rotation.z = -flap;
    }

    // Butterflies dancing around meadows near player
    for (const bf of this.butterflies) {
      const bx = playerPos.x + bf.offsetX + Math.sin(elapsed * 0.9 + bf.phase) * 3.5;
      const bz = playerPos.z + bf.offsetZ + Math.cos(elapsed * 0.7 + bf.phase) * 3.5;
      const gh = this.terrain.getHeight(bx, bz);
      bf.group.visible = gh > 1.5;
      if (bf.group.visible) {
        bf.group.position.set(bx, gh + 1.15 + Math.sin(elapsed * 3.6 + bf.phase) * 0.45, bz);
        bf.group.rotation.y = elapsed * 1.3 + bf.phase;
        const fl = Math.sin(elapsed * 18 + bf.phase) * 0.85;
        bf.wL.rotation.y = fl;
        bf.wR.rotation.y = -fl;
      }
    }

    // Darting River Trout
    for (const f of this.fish) {
      if (f.caught) continue;
      const a = elapsed * 0.9 + f.phase;
      f.mesh.position.x = f.cx + Math.cos(a) * 3.2;
      f.mesh.position.z = f.cz + Math.sin(a) * 4.5;
      f.mesh.rotation.y = -a;
    }
  }
}
