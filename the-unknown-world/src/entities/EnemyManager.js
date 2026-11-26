// Modular Enemy & Guardian AI Manager:
// Spawns 5 distinct stylized 3D creature archetypes across the 8x8 km world:
//   - Bramble Stalker (territorial woodland predator)
//   - Stone Sentinel (Forgotten Kingdom ancient guardian)
//   - Crystal Wisp (Hollow Depths & Shattered Expanse floating elemental)
//   - Moss Sprite (peaceful unless provoked!)
//   - Elder Stone Warden (rare optional guardian boss)
// Includes clear crimson attack telegraphs, hit flashes, diegetic HP bars, knockback, and fair AI.
import * as THREE from 'three';
import { patchWatercolorMaterial } from '../world/WatercolorShader.js';

const SPAWN_POINTS = [
  // Accessible encounters outside Crossroads Village safety radius (village itself stays safe!)
  { id: 'moss-sprite', x: -64, z: 336 },
  { id: 'bramble-stalker', x: -165, z: 255 },
  { id: 'bramble-stalker', x: -340, z: 140 },
  { id: 'stone-sentinel', x: 225, z: 305 },
  { id: 'stone-sentinel', x: 520, z: 215 },
  { id: 'bramble-stalker', x: -910, z: -130 },
  { id: 'stone-sentinel', x: 1650, z: -210 },
  { id: 'elder-warden', x: 1720, z: -185 },
  { id: 'crystal-wisp', x: 130, z: -1730 },
  { id: 'crystal-wisp', x: 1740, z: -1790 },
  { id: 'stone-sentinel', x: 1540, z: 1450 },
  { id: 'elder-warden', x: -1580, z: 1580 },
];

export class EnemyManager {
  constructor(scene, terrain, creatureDefs, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.defs = new Map();
    for (const c of creatureDefs) this.defs.set(c.id, c);
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'world-enemies';
    scene.add(this.root);

    this.enemies = [];
    this._spawnAll();
  }

  _buildCreatureMesh(def) {
    const g = new THREE.Group();
    let bodyMat;
    let radius = 0.85;

    if (def.id === 'stone-sentinel' || def.id === 'elder-warden') {
      const scale = def.id === 'elder-warden' ? 1.65 : 1.05;
      radius = 1.05 * scale;
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: 0x828794, roughness: 0.86 }),
        { rimStrength: 0.3, inkEdge: 0.28 }
      );
      const coreMat = new THREE.MeshStandardMaterial({
        color: def.id === 'elder-warden' ? 0xff7b42 : 0x5ee6f5,
        emissive: def.id === 'elder-warden' ? 0xe03d14 : 0x249ec0,
        emissiveIntensity: 1.2,
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1 * scale, 1.35 * scale, 0.85 * scale), bodyMat);
      torso.position.y = 1.4 * scale;
      torso.castShadow = true;
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32 * scale, 0), coreMat);
      core.position.set(0, 1.45 * scale, 0.45 * scale);
      const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.45 * scale, 1.15 * scale, 0.45 * scale), bodyMat);
      shoulderL.position.set(-0.82 * scale, 1.3 * scale, 0);
      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 0.82 * scale;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.45 * scale, 0.55 * scale), bodyMat);
      head.position.y = 2.35 * scale;
      g.add(torso, core, shoulderL, shoulderR, head);
    } else if (def.id === 'crystal-wisp') {
      radius = 0.75;
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x88f4ff,
        emissive: 0x38b6dc,
        emissiveIntensity: 1.15,
        roughness: 0.2,
      });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), bodyMat);
      crystal.position.y = 1.65;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 6, 16), bodyMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.65;
      g.add(crystal, halo);
    } else if (def.id === 'moss-sprite') {
      radius = 0.6;
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: 0x5db85a, roughness: 0.78 }),
        { subsurface: 0.4 }
      );
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 1), bodyMat);
      blob.position.y = 0.58;
      blob.castShadow = true;
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 5), bodyMat);
      sprout.position.y = 1.18;
      g.add(blob, sprout);
    } else {
      // Bramble Stalker (horned shadowy woodland beast)
      radius = 0.9;
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: 0x4b3b4e, roughness: 0.82 }),
        { rimStrength: 0.34, inkEdge: 0.3 }
      );
      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 1), bodyMat);
      body.scale.set(1.0, 0.82, 1.35);
      body.position.y = 0.95;
      body.castShadow = true;
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffc852 });
      for (const sx of [-0.22, 0.22]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
        eye.position.set(sx, 1.18, 0.82);
        g.add(eye);
      }
      g.add(body);
    }

    // Telegraph strike warning ring on the ground
    const teleMat = new THREE.MeshBasicMaterial({
      color: 0xff5a42,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const teleRing = new THREE.Mesh(new THREE.RingGeometry(radius * 0.9, radius * 1.45, 20), teleMat);
    teleRing.rotation.x = -Math.PI / 2;
    teleRing.position.y = 0.12;
    g.add(teleRing);

    // Diegetic overhead HP bar (hidden while full HP)
    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x1c202c, side: THREE.DoubleSide })
    );
    const barFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.11),
      new THREE.MeshBasicMaterial({ color: 0xe85a4f, side: THREE.DoubleSide })
    );
    barFill.position.z = 0.01;
    const hpBar = new THREE.Group();
    hpBar.add(barBg, barFill);
    hpBar.position.y = def.id === 'elder-warden' ? 4.4 : 2.75;
    hpBar.visible = false;
    g.add(hpBar);

    return { mesh: g, bodyMat, teleMat, hpBar, barFill, radius };
  }

  _spawnAll() {
    for (let i = 0; i < SPAWN_POINTS.length; i++) {
      const sp = SPAWN_POINTS[i];
      const def = this.defs.get(sp.id);
      if (!def) continue;
      const built = this._buildCreatureMesh(def);
      const y = this.terrain.getHeight(sp.x, sp.z);
      built.mesh.position.set(sp.x, y, sp.z);
      this.root.add(built.mesh);

      this.enemies.push({
        uid: `enemy_${i}`,
        def,
        ...built,
        homeX: sp.x,
        homeZ: sp.z,
        hp: def.maxHp,
        alive: true,
        provoked: false,
        state: 'patrol',
        stateTimer: 0,
        hitFlash: 0,
        respawnTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
      });
    }
  }

  findNearestAlive(pos, maxDist = 10) {
    let best = null;
    let bestD = maxDist;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.mesh.position.x - pos.x, e.mesh.position.z - pos.z);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  damageEnemy(enemy, amount, sourcePos) {
    if (!enemy.alive) return false;
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.provoked = true;
    enemy.hitFlash = 0.22;
    enemy.hpBar.visible = true;
    const ratio = Math.max(0.01, enemy.hp / enemy.def.maxHp);
    enemy.barFill.scale.x = ratio;
    enemy.barFill.position.x = -(1 - ratio) * 0.71;

    // Knockback away from player
    if (sourcePos) {
      const dx = enemy.mesh.position.x - sourcePos.x;
      const dz = enemy.mesh.position.z - sourcePos.z;
      const d = Math.hypot(dx, dz) || 1;
      enemy.mesh.position.x += (dx / d) * 1.15;
      enemy.mesh.position.z += (dz / d) * 1.15;
    }

    if (enemy.hp <= 0) {
      enemy.alive = false;
      enemy.mesh.visible = false;
      enemy.respawnTimer = 65;
      return true;
    }
    return false;
  }

  update(dt, elapsed, playerPos, camera, combatSystem) {
    for (const e of this.enemies) {
      if (!e.alive) {
        e.respawnTimer -= dt;
        if (e.respawnTimer <= 0 && Math.hypot(playerPos.x - e.homeX, playerPos.z - e.homeZ) > 35) {
          e.alive = true;
          e.hp = e.def.maxHp;
          e.provoked = false;
          e.state = 'patrol';
          e.hpBar.visible = false;
          e.barFill.scale.x = 1;
          e.barFill.position.x = 0;
          const hy = this.terrain.getHeight(e.homeX, e.homeZ);
          e.mesh.position.set(e.homeX, hy, e.homeZ);
          e.mesh.visible = true;
        }
        continue;
      }

      const dxP = playerPos.x - e.mesh.position.x;
      const dzP = playerPos.z - e.mesh.position.z;
      const distP = Math.hypot(dxP, dzP);
      if (distP > 135) continue; // Sleep distant AI

      // Billboard overhead HP bar toward camera
      if (e.hpBar.visible) {
        e.hpBar.quaternion.copy(camera.quaternion);
      }

      if (e.hitFlash > 0) {
        e.hitFlash -= dt;
        e.mesh.scale.setScalar(1 + e.hitFlash * 0.4);
      } else {
        e.mesh.scale.setScalar(1);
      }

      const distHome = Math.hypot(e.mesh.position.x - e.homeX, e.mesh.position.z - e.homeZ);
      const aggro = e.provoked ? Math.max(e.def.aggroRange, 18) : e.def.aggroRange;
      const attackReach = e.radius + 1.85;

      e.teleMat.opacity = 0;

      if (e.state === 'telegraph') {
        e.stateTimer -= dt;
        e.teleMat.opacity = 0.45 + Math.sin(elapsed * 26) * 0.25;
        e.mesh.rotation.y = Math.atan2(dxP, dzP);
        if (e.stateTimer <= 0) {
          if (distP <= attackReach + 0.8) {
            combatSystem.damagePlayer(e.def.damage, e.mesh.position);
          }
          e.state = 'recover';
          e.stateTimer = 0.95;
        }
      } else if (e.state === 'recover') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) e.state = 'chase';
      } else if (aggro > 0 && distP < aggro && distHome < 32) {
        e.state = 'chase';
        e.mesh.rotation.y = Math.atan2(dxP, dzP);
        if (distP <= attackReach) {
          e.state = 'telegraph';
          e.stateTimer = 0.62;
        } else {
          const step = e.def.speed * dt;
          e.mesh.position.x += (dxP / distP) * step;
          e.mesh.position.z += (dzP / distP) * step;
        }
      } else {
        // Peaceful patrol loop around home anchor
        e.state = 'patrol';
        e.provoked = false;
        e.patrolAngle += dt * 0.45;
        const tx = e.homeX + Math.cos(e.patrolAngle) * 6.5;
        const tz = e.homeZ + Math.sin(e.patrolAngle) * 6.5;
        const pdx = tx - e.mesh.position.x;
        const pdz = tz - e.mesh.position.z;
        const pd = Math.hypot(pdx, pdz);
        if (pd > 0.2) {
          const step = Math.min(pd, e.def.speed * 0.45 * dt);
          e.mesh.position.x += (pdx / pd) * step;
          e.mesh.position.z += (pdz / pd) * step;
          e.mesh.rotation.y = Math.atan2(pdx, pdz);
        }
      }

      const gy = this.terrain.getHeight(e.mesh.position.x, e.mesh.position.z);
      const bob = e.def.id === 'crystal-wisp' ? Math.sin(elapsed * 3.2) * 0.35 : 0;
      e.mesh.position.y = gy + bob;
    }
  }
}
