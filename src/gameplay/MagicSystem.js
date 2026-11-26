import * as THREE from 'three';

export const SPELLS = [
  {
    id: 'resonance-bolt',
    key: '1',
    name: 'Resonance Bolt',
    short: 'Bolt',
    element: 'resonance',
    spCost: 14,
    cooldown: 1.35,
    basePower: 28,
    color: '#63ecff',
    icon: '✦',
    description: 'Fires a seeking arcane crystal bolt that pierces shields and hits distant enemies.'
  },
  {
    id: 'gale-updraft',
    key: '2',
    name: 'Gale Updraft',
    short: 'Gale',
    element: 'wind',
    spCost: 20,
    cooldown: 5.0,
    basePower: 20,
    color: '#7ef0a6',
    icon: '≋',
    description: 'Summons an emerald cyclone that launches Aelira straight into Spirit Glider flight and knocks foes back.'
  },
  {
    id: 'sunfire-nova',
    key: '3',
    name: 'Sunfire Nova',
    short: 'Nova',
    element: 'sunfire',
    spCost: 26,
    cooldown: 6.5,
    basePower: 42,
    color: '#ff9d42',
    icon: '☀',
    description: 'Unleashes an expanding golden solar shockwave dealing heavy AoE burn damage and restoring Warmth.'
  },
  {
    id: 'spirit-mend',
    key: '4',
    name: 'Spirit Ward',
    short: 'Mend',
    element: 'spirit',
    spCost: 22,
    cooldown: 9.0,
    basePower: 40,
    color: '#f5df7c',
    icon: '❀',
    description: 'Channels golden sanctuary petals to heal HP and raise a protective Runic Ward (-50% damage for 7s).'
  }
];

export class MagicSystem {
  constructor(scene, terrain, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.events = eventBus;
    this.root = new THREE.Group();
    this.root.name = 'MagicFX';
    this.scene.add(this.root);

    this.cooldowns = new Map();
    for (const s of SPELLS) this.cooldowns.set(s.id, 0);

    this.projectiles = [];
    this.waves = [];
    this.wardTimer = 0;
    this.totalCasts = 0;

    // Reusable Ward Halo attached around player when active
    this.wardMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.055, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffe48a,
        transparent: true,
        opacity: 0.65
      })
    );
    this.wardMesh.rotation.x = Math.PI / 2;
    this.wardMesh.visible = false;
    this.root.add(this.wardMesh);
  }

  getSpells() {
    return SPELLS.map((s) => ({
      ...s,
      remaining: Math.max(0, this.cooldowns.get(s.id) || 0)
    }));
  }

  getSpellPower(player, inventory, progression) {
    const eq = inventory?.getEquipmentBonuses?.() || {};
    const progSpell = progression?.getSpellPowerBonus?.() || 0;
    return (eq.spellBonus || 0) + progSpell + Math.max(0, (player.level || 1) - 1) * 3;
  }

  getCooldownScale(progression) {
    return progression?.getCooldownMultiplier?.() || 1.0;
  }

  hasWard() {
    return this.wardTimer > 0;
  }

  cast(spellId, { player, enemies, inventory, progression, combat, particles, audio, camera }) {
    const spell = SPELLS.find((s) => s.id === spellId);
    if (!spell) return { ok: false, reason: 'Unknown spell' };

    const cd = this.cooldowns.get(spell.id) || 0;
    if (cd > 0.01) return { ok: false, reason: 'Recharging' };
    if (player.stamina < spell.spCost) return { ok: false, reason: 'Not enough SP' };

    player.stamina = Math.max(0, player.stamina - spell.spCost);
    const cdScale = this.getCooldownScale(progression);
    this.cooldowns.set(spell.id, spell.cooldown * cdScale);
    this.totalCasts += 1;

    const spellPower = this.getSpellPower(player, inventory, progression);
    const origin = player.root.position.clone().add(new THREE.Vector3(0, 1.35, 0));

    if (spell.id === 'resonance-bolt') {
      this._castResonanceBolt(origin, player, enemies, spellPower, particles);
    } else if (spell.id === 'gale-updraft') {
      this._castGaleUpdraft(origin, player, enemies, spellPower, combat, particles, camera);
    } else if (spell.id === 'sunfire-nova') {
      this._castSunfireNova(origin, player, enemies, spellPower, combat, particles, camera);
    } else if (spell.id === 'spirit-mend') {
      this._castSpiritMend(origin, player, spellPower, particles);
    }

    audio?.playSpell?.(spell.id);
    this.events?.emit('magic:cast', { spellId: spell.id, element: spell.element, totalCasts: this.totalCasts });
    this.events?.emit(`magic:cast:${spell.id}`, { spellId: spell.id });
    return { ok: true, spell };
  }

  _castResonanceBolt(origin, player, enemies, spellPower, particles) {
    const dir = new THREE.Vector3(Math.sin(player.facingYaw), 0, Math.cos(player.facingYaw)).normalize();
    let targetEnemy = null;
    let bestScore = Infinity;
    for (const e of enemies?.enemies || []) {
      if (!e.alive) continue;
      const ePos = e.mesh.position;
      const toE = ePos.clone().sub(origin);
      const dist = toE.length();
      if (dist > 28) continue;
      const dot = toE.clone().normalize().dot(dir);
      if (dot > 0.25 && dist * (1.4 - dot) < bestScore) {
        bestScore = dist * (1.4 - dot);
        targetEnemy = e;
      }
    }
    if (targetEnemy) {
      dir.copy(targetEnemy.mesh.position).add(new THREE.Vector3(0, 1.1, 0)).sub(origin).normalize();
    }

    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 1),
      new THREE.MeshBasicMaterial({ color: 0x73f2ff })
    );
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe596, transparent: true, opacity: 0.78 })
    );
    orb.add(halo);
    orb.position.copy(origin).addScaledVector(dir, 0.9);
    this.root.add(orb);

    this.projectiles.push({
      mesh: orb,
      velocity: dir.multiplyScalar(27),
      target: targetEnemy,
      damage: 28 + spellPower,
      element: 'resonance',
      life: 1.65,
      radius: 1.6
    });
    particles?.emitBurst?.(orb.position, 0x73f2ff, 10, 4.2, 0.45);
  }

  _castGaleUpdraft(origin, player, enemies, spellPower, combat, particles, camera) {
    player.velocity.y = Math.max(player.velocity.y, 15.2);
    player.grounded = false;
    player.gliding = true;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.14, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0x8ef5b4, transparent: true, opacity: 0.82 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(player.root.position.x, player.root.position.y + 0.5, player.root.position.z);
    this.root.add(ring);
    this.waves.push({ mesh: ring, life: 0.65, maxLife: 0.65, maxScale: 7.4, rise: 6.5 });

    particles?.emitBurst?.(origin, 0x8ef5b4, 22, 7.2, 0.65);
    camera?.addShake?.(0.28);

    const radius = 7.8;
    for (const e of enemies?.enemies || []) {
      if (!e.alive) continue;
      const d = e.mesh.position.distanceTo(player.root.position);
      if (d <= radius) {
        const dmg = Math.round(20 + spellPower * 0.75);
        const killed = enemies.damageEnemy(e, dmg, player.root.position, { element: 'wind', knockback: 11.5 });
        this.events?.emit('combat:hit', { pos: e.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)), dmg, isHeavy: true, killed });
        if (killed) combat?.handleEnemyKill?.(e);
      }
    }
  }

  _castSunfireNova(origin, player, enemies, spellPower, combat, particles, camera) {
    player.warmth = Math.min(player.maxWarmth || 100, (player.warmth || 100) + 45);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.2, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0xffa042, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(player.root.position.x, player.root.position.y + 0.7, player.root.position.z);
    this.root.add(ring);
    this.waves.push({ mesh: ring, life: 0.55, maxLife: 0.55, maxScale: 8.6, rise: 0.6 });

    particles?.emitBurst?.(origin, 0xff9b3d, 30, 8.6, 0.75);
    camera?.addShake?.(0.5);

    const radius = 8.8;
    for (const e of enemies?.enemies || []) {
      if (!e.alive) continue;
      const d = e.mesh.position.distanceTo(player.root.position);
      if (d <= radius) {
        const weaknessMult = e.def?.weakness === 'sunfire' ? 1.45 : 1.0;
        const dmg = Math.round((42 + spellPower * 1.15) * weaknessMult);
        const killed = enemies.damageEnemy(e, dmg, player.root.position, { element: 'sunfire', burn: 4.5, knockback: 9.0 });
        this.events?.emit('combat:hit', { pos: e.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)), dmg, isHeavy: true, killed });
        if (killed) combat?.handleEnemyKill?.(e);
      }
    }
  }

  _castSpiritMend(origin, player, spellPower, particles) {
    const heal = Math.round(40 + spellPower * 0.8);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    this.wardTimer = 7.5;
    this.wardMesh.visible = true;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.09, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xf6e284, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(player.root.position).add(new THREE.Vector3(0, 0.4, 0));
    this.root.add(ring);
    this.waves.push({ mesh: ring, life: 0.7, maxLife: 0.7, maxScale: 3.4, rise: 2.8 });
    particles?.emitBurst?.(origin, 0x9ef7be, 22, 4.5, 0.8);
  }

  update(dt, elapsed, player, enemies, particles, combat = null) {
    for (const [id, cd] of this.cooldowns.entries()) {
      if (cd > 0) this.cooldowns.set(id, Math.max(0, cd - dt));
    }

    if (this.wardTimer > 0) {
      this.wardTimer = Math.max(0, this.wardTimer - dt);
      this.wardMesh.visible = this.wardTimer > 0;
      this.wardMesh.position.set(player.root.position.x, player.root.position.y + 1.05 + Math.sin(elapsed * 4) * 0.14, player.root.position.z);
      this.wardMesh.rotation.z = elapsed * 2.2;
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.target && p.target.alive) {
        const desired = p.target.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(p.mesh.position).normalize().multiplyScalar(27);
        p.velocity.lerp(desired, Math.min(1, dt * 6.5));
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.y += dt * 8;
      p.mesh.rotation.x += dt * 5;

      let hit = false;
      for (const e of enemies?.enemies || []) {
        if (!e.alive) continue;
        const center = e.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0));
        if (center.distanceTo(p.mesh.position) <= p.radius + (e.radius || 0.85)) {
          const weakMult = e.def?.weakness === p.element ? 1.38 : 1.0;
          const dmg = Math.round(p.damage * weakMult);
          const killed = enemies.damageEnemy(e, dmg, p.mesh.position, { element: p.element, knockback: 6.5 });
          this.events?.emit('combat:hit', { pos: center, dmg, isHeavy: false, killed });
          if (killed) combat?.handleEnemyKill?.(e);
          particles?.emitBurst?.(p.mesh.position, 0x73f2ff, 16, 5.5, 0.5);
          hit = true;
          break;
        }
      }

      const groundH = this.terrain.getHeight(p.mesh.position.x, p.mesh.position.z);
      if (hit || p.life <= 0 || p.mesh.position.y < groundH + 0.1) {
        if (!hit && p.mesh.position.y < groundH + 0.1) {
          particles?.emitBurst?.(p.mesh.position, 0x73f2ff, 8, 3.8, 0.35);
        }
        this.root.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Update expanding spell rings
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt;
      const t = 1 - Math.max(0, w.life / w.maxLife);
      const s = 1 + t * (w.maxScale - 1);
      w.mesh.scale.set(s, s, 1);
      w.mesh.position.y += w.rise * dt;
      w.mesh.material.opacity = (1 - t) * 0.85;
      if (w.life <= 0) {
        this.root.remove(w.mesh);
        w.mesh.geometry.dispose();
        w.mesh.material.dispose();
        this.waves.splice(i, 1);
      }
    }
  }

  serialize() {
    return { totalCasts: this.totalCasts };
  }

  hydrate(data) {
    if (!data) return;
    this.totalCasts = data.totalCasts || 0;
  }
}
