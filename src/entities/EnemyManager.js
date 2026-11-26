// Modular Enemy & Multi-Phase World Boss AI Manager:
// Spawns 14 distinct stylized 3D creature archetypes across all 8 regions, including
// 4 Multi-Phase Legendary World Bosses:
//   1. Mossback Colossus (Forgotten Kingdom)
//   2. Glacier Sovereign (Highland Reach)
//   3. Elder Stone Warden (Hidden Frontier)
//   4. Astral Leviathan (Shattered Expanse)
// Includes clear crimson/gold ground telegraph rings, Phase II enrage shockwaves,
// Perfect Parry stagger state, Sunfire burn DoT, diegetic HP bars, and contact shadows.
import * as THREE from 'three';
import { patchWatercolorMaterial } from '../world/WatercolorShader.js';
import { createContactShadowTexture } from '../world/ArtTextures.js';

const SPAWN_POINTS = [
  // Verdant Valley & Emerald Wilds frontier (Crossroads village center stays safe)
  { id: 'moss-sprite', x: -64, z: 336 },
  { id: 'bramble-stalker', x: -165, z: 255 },
  { id: 'bramble-stalker', x: -340, z: 140 },
  { id: 'canopy-prowler', x: -860, z: -70 },
  { id: 'bramble-stalker', x: -910, z: -130 },
  { id: 'canopy-prowler', x: -1120, z: -260 },

  // Forgotten Kingdom & Roads
  { id: 'stone-sentinel', x: 225, z: 305 },
  { id: 'stone-sentinel', x: 520, z: 215 },
  { id: 'citadel-knight', x: 1420, z: -160 },
  { id: 'stone-sentinel', x: 1650, z: -210 },
  { id: 'citadel-knight', x: 1755, z: -290 },
  { id: 'mossback-colossus', x: 1695, z: -185 }, // BOSS 1

  // Azure Coast
  { id: 'coral-guardian', x: 1320, z: 1290 },
  { id: 'stone-sentinel', x: 1540, z: 1450 },
  { id: 'coral-guardian', x: 1675, z: 1510 },

  // Highland Reach
  { id: 'frost-wolf', x: -1240, z: -1450 },
  { id: 'frost-wolf', x: -1480, z: -1790 },
  { id: 'glacier-sovereign', x: -1525, z: -1895 }, // BOSS 2

  // Hollow Depths
  { id: 'crystal-wisp', x: 130, z: -1730 },
  { id: 'crystal-wisp', x: 195, z: -1840 },

  // Shattered Expanse
  { id: 'crystal-wisp', x: 1740, z: -1790 },
  { id: 'void-shade', x: 1850, z: -1740 },
  { id: 'astral-leviathan', x: 1815, z: -1855 }, // BOSS 3

  // Hidden Frontier
  { id: 'ember-hound', x: -1460, z: 1490 },
  { id: 'ember-hound', x: -1540, z: 1670 },
  { id: 'elder-warden', x: -1585, z: 1585 }, // BOSS 4
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

    this.shadowTex = createContactShadowTexture();
    this.enemies = [];
    this._spawnAll();
  }

  _buildCreatureMesh(def) {
    const g = new THREE.Group();
    let bodyMat;
    let radius = 0.85;
    let barY = 2.75;

    if (def.id === 'astral-leviathan') {
      // Floating Multi-Ring Celestial Boss
      radius = 2.1;
      barY = 5.4;
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0xb982ff,
        emissive: 0x6734d4,
        emissiveIntensity: 1.2,
        roughness: 0.25,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffdf7e,
        emissive: 0xd99b2a,
        emissiveIntensity: 0.9,
        metalness: 0.5,
        roughness: 0.3,
      });
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.35, 1), bodyMat);
      core.position.y = 2.9;
      const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.16, 8, 28), goldMat);
      ringA.position.y = 2.9;
      const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.12, 8, 28), bodyMat);
      ringB.rotation.x = Math.PI / 2.4;
      ringB.position.y = 2.9;
      g.add(core, ringA, ringB);
      g.userData.orbitRings = [ringA, ringB];
    } else if (def.id === 'glacier-sovereign') {
      // Borealis Stag-Wyrm Boss
      radius = 1.85;
      barY = 4.6;
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: 0xb7e4f8, roughness: 0.55 }),
        { rimStrength: 0.45, inkEdge: 0.25 }
      );
      const auroraMat = new THREE.MeshStandardMaterial({
        color: 0x79f7d6,
        emissive: 0x2ecba8,
        emissiveIntensity: 1.35,
      });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 1.8, 6, 12), bodyMat);
      torso.rotation.x = Math.PI / 2;
      torso.position.y = 1.85;
      torso.castShadow = true;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.65, 8), bodyMat);
      neck.position.set(0, 2.75, 1.15);
      neck.rotation.x = 0.45;
      const crownL = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.55, 6), auroraMat);
      crownL.position.set(-0.65, 3.85, 1.35);
      crownL.rotation.z = 0.45;
      const crownR = crownL.clone();
      crownR.position.x = 0.65;
      crownR.rotation.z = -0.45;
      g.add(torso, neck, crownL, crownR);
    } else if (
      def.id === 'stone-sentinel' ||
      def.id === 'citadel-knight' ||
      def.id === 'elder-warden' ||
      def.id === 'mossback-colossus'
    ) {
      const isBoss = def.category === 'boss';
      const scale =
        def.id === 'elder-warden'
          ? 1.75
          : def.id === 'mossback-colossus'
          ? 1.58
          : def.id === 'citadel-knight'
          ? 1.24
          : 1.05;
      radius = 1.05 * scale;
      barY = isBoss ? 4.4 : 3.0;
      const tint =
        def.id === 'mossback-colossus'
          ? 0x5c7558
          : def.id === 'citadel-knight'
          ? 0xa4947a
          : 0x828794;
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: tint, roughness: 0.86 }),
        { rimStrength: 0.3, inkEdge: 0.28 }
      );
      const coreMat = new THREE.MeshStandardMaterial({
        color: isBoss ? 0xff7b42 : def.id === 'citadel-knight' ? 0xf3ca68 : 0x5ee6f5,
        emissive: isBoss ? 0xe03d14 : def.id === 'citadel-knight' ? 0xc28a24 : 0x249ec0,
        emissiveIntensity: 1.25,
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
    } else if (def.id === 'crystal-wisp' || def.id === 'void-shade') {
      radius = 0.8;
      const isVoid = def.id === 'void-shade';
      bodyMat = new THREE.MeshStandardMaterial({
        color: isVoid ? 0xba78ff : 0x88f4ff,
        emissive: isVoid ? 0x6224b8 : 0x38b6dc,
        emissiveIntensity: 1.2,
        roughness: 0.2,
      });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(isVoid ? 0.82 : 0.68, 0), bodyMat);
      crystal.position.y = 1.75;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 6, 16), bodyMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.75;
      g.add(crystal, halo);
    } else if (def.id === 'coral-guardian') {
      radius = 1.05;
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: 0x3da8ae, roughness: 0.72 }),
        { rimStrength: 0.35 }
      );
      const shell = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88, 1), bodyMat);
      shell.scale.set(1.25, 0.68, 1.1);
      shell.position.y = 0.82;
      shell.castShadow = true;
      const coral = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.72, 6),
        new THREE.MeshStandardMaterial({ color: 0xef8578, roughness: 0.75 })
      );
      coral.position.set(0.25, 1.48, -0.1);
      g.add(shell, coral);
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
      // Quadruped predators: Bramble Stalker, Frost Wolf, Ember Hound, Canopy Prowler
      radius = 0.92;
      const colorMap = {
        'frost-wolf': 0xc8deed,
        'ember-hound': 0xb85e32,
        'canopy-prowler': 0x2f7454,
        'bramble-stalker': 0x4b3b4e,
      };
      bodyMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ color: colorMap[def.id] || 0x4b3b4e, roughness: 0.82 }),
        { rimStrength: 0.34, inkEdge: 0.3 }
      );
      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 1), bodyMat);
      body.scale.set(1.0, 0.82, 1.38);
      body.position.y = 0.95;
      body.castShadow = true;
      const eyeColor = def.id === 'frost-wolf' ? 0x80f2ff : 0xffc852;
      const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
      for (const sx of [-0.22, 0.22]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
        eye.position.set(sx, 1.18, 0.85);
        g.add(eye);
      }
      g.add(body);
    }

    // Grounded Contact Shadow
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2.3, radius * 2.3),
      new THREE.MeshBasicMaterial({
        map: this.shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);

    // Telegraph strike warning ring on the ground
    const teleMat = new THREE.MeshBasicMaterial({
      color: 0xff5a42,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const teleRing = new THREE.Mesh(new THREE.RingGeometry(radius * 0.9, radius * 1.65, 24), teleMat);
    teleRing.rotation.x = -Math.PI / 2;
    teleRing.position.y = 0.14;
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
    hpBar.position.y = barY;
    hpBar.visible = false;
    g.add(hpBar);

    return { mesh: g, bodyMat, teleMat, teleRing, hpBar, barFill, radius };
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
        position: built.mesh.position,
        scale: def.category === 'boss' ? 1.65 : 1.0,
        homeX: sp.x,
        homeZ: sp.z,
        hp: def.maxHp,
        alive: true,
        provoked: false,
        phase: 1,
        staggerTimer: 0,
        burnTimer: 0,
        burnTick: 0,
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

  damageEnemy(enemy, amount, sourcePos, opts = null) {
    if (!enemy.alive) return false;
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.provoked = true;
    enemy.hitFlash = 0.22;
    enemy.hpBar.visible = true;
    const ratio = Math.max(0.01, enemy.hp / enemy.def.maxHp);
    enemy.barFill.scale.x = ratio;
    enemy.barFill.position.x = -(1 - ratio) * 0.71;

    // Trigger Boss Phase 2 enrage below 50% HP!
    if (enemy.def.category === 'boss' && enemy.phase === 1 && enemy.hp > 0 && enemy.hp <= enemy.def.maxHp * 0.5) {
      enemy.phase = 2;
      enemy.teleMat.color.setHex(0xffb833);
      if (this.events) {
        this.events.emit('toast', {
          title: `${enemy.def.name} — PHASE II!`,
          text: 'The guardian unleashes intensified shockwave strikes!',
        });
      }
    }

    if (opts?.burn) {
      enemy.burnTimer = Math.max(enemy.burnTimer || 0, opts.burn);
    }

    if (sourcePos) {
      const dx = enemy.mesh.position.x - sourcePos.x;
      const dz = enemy.mesh.position.z - sourcePos.z;
      const d = Math.hypot(dx, dz) || 1;
      const kb = opts?.knockback ? Math.min(2.6, opts.knockback * 0.22) : 1.15;
      enemy.mesh.position.x += (dx / d) * kb;
      enemy.mesh.position.z += (dz / d) * kb;
    }

    if (enemy.hp <= 0) {
      enemy.alive = false;
      enemy.mesh.visible = false;
      enemy.respawnTimer = 65;
      return true;
    }
    return false;
  }

  getActiveBoss(playerPos) {
    for (const e of this.enemies) {
      if (!e.alive || e.def.category !== 'boss') continue;
      const d = Math.hypot(e.mesh.position.x - playerPos.x, e.mesh.position.z - playerPos.z);
      if (d <= 38 || (d <= 52 && (e.provoked || e.state === 'chase' || e.state === 'telegraph'))) {
        return e;
      }
    }
    return null;
  }

  update(dt, elapsed, playerPos, camera, combatSystem, playerStealth = false) {
    for (const e of this.enemies) {
      if (!e.alive) {
        e.respawnTimer -= dt;
        if (e.respawnTimer <= 0 && Math.hypot(playerPos.x - e.homeX, playerPos.z - e.homeZ) > 35) {
          e.alive = true;
          e.hp = e.def.maxHp;
          e.phase = 1;
          e.provoked = false;
          e.staggerTimer = 0;
          e.burnTimer = 0;
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
      if (distP > 145) continue;

      if (e.hpBar.visible) e.hpBar.quaternion.copy(camera.quaternion);

      // Animate Astral Leviathan orbiting rings
      if (e.mesh.userData.orbitRings) {
        e.mesh.userData.orbitRings[0].rotation.y = elapsed * (e.phase === 2 ? 2.4 : 1.1);
        e.mesh.userData.orbitRings[0].rotation.z = elapsed * 0.7;
        e.mesh.userData.orbitRings[1].rotation.z = -elapsed * (e.phase === 2 ? 2.0 : 0.9);
      }

      // Burn DoT tick from Sunfire Nova
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.burnTick += dt;
        if (e.burnTick >= 0.75) {
          e.burnTick = 0;
          const killed = this.damageEnemy(e, 6, null);
          if (killed && combatSystem?.handleEnemyKill) {
            combatSystem.handleEnemyKill(e);
            continue;
          }
        }
      }

      if (e.staggerTimer > 0) e.staggerTimer = Math.max(0, e.staggerTimer - dt);

      if (e.hitFlash > 0) {
        e.hitFlash -= dt;
        e.mesh.scale.setScalar(1 + e.hitFlash * 0.4);
      } else {
        e.mesh.scale.setScalar(1);
      }

      const distHome = Math.hypot(e.mesh.position.x - e.homeX, e.mesh.position.z - e.homeZ);
      const stealthMult = playerStealth ? 0.38 : 1.0;
      const aggro = e.provoked ? Math.max(e.def.aggroRange, 20) : e.def.aggroRange * stealthMult;
      const phaseScale = e.phase === 2 ? 1.35 : 1.0;
      const attackReach = (e.radius + 1.85) * (e.phase === 2 ? 1.3 : 1.0);

      e.teleMat.opacity = 0;
      e.teleRing.scale.setScalar(e.phase === 2 ? 1.38 : 1.0);

      if (e.state === 'telegraph') {
        e.stateTimer -= dt;
        e.teleMat.opacity = 0.5 + Math.sin(elapsed * 26) * 0.25;
        e.mesh.rotation.y = Math.atan2(dxP, dzP);
        if (e.stateTimer <= 0) {
          if (distP <= attackReach + 0.9) {
            const dmg = Math.round(e.def.damage * (e.phase === 2 ? 1.2 : 1.0));
            combatSystem.damagePlayer(dmg, e.mesh.position, e);
          }
          e.state = 'recover';
          e.stateTimer = e.phase === 2 ? 0.72 : 0.95;
        }
      } else if (e.state === 'recover') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) e.state = 'chase';
      } else if (aggro > 0 && distP < aggro && distHome < 38) {
        e.state = 'chase';
        e.mesh.rotation.y = Math.atan2(dxP, dzP);
        if (distP <= attackReach) {
          e.state = 'telegraph';
          e.stateTimer = e.phase === 2 ? 0.52 : 0.64;
        } else {
          const step = e.def.speed * phaseScale * dt;
          e.mesh.position.x += (dxP / distP) * step;
          e.mesh.position.z += (dzP / distP) * step;
        }
      } else {
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
      const bob =
        e.def.id === 'crystal-wisp' || e.def.id === 'void-shade' || e.def.id === 'astral-leviathan'
          ? Math.sin(elapsed * 3.0) * 0.38
          : 0;
      e.mesh.position.y = gy + bob;
    }
  }
}
