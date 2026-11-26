// Modular Action Combat System:
// Light Attack, Heavy Arcane Wave, 1.75x Stealth Ambush Strike, Soft Aim-Assist Targeting,
// Shield Guard / Reflect, Hit Detection, Enemy Damage, Sunshard & Item Loot Drops,
// Impact VFX/Shake Events, Boss Tracking, and Safe Respawn at Crossroads Hearth.
import * as THREE from 'three';

export class CombatSystem {
  constructor(player, enemyManager, inventory, progression, eventBus) {
    this.player = player;
    this.enemies = enemyManager;
    this.inventory = inventory;
    this.progression = progression;
    this.events = eventBus;
    this.attackCooldown = 0;
    this.heavyCooldown = 0;
    this.hitStopTimer = 0;
  }

  update(dt, input) {
    if (this.hitStopTimer > 0) this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.heavyCooldown > 0) this.heavyCooldown = Math.max(0, this.heavyCooldown - dt);

    if (this.player.sailing || this.player.swimming || this.player.diving) return;

    if (input.attackPressed && this.attackCooldown <= 0 && !this.player.dodging) {
      this._performAttack(false);
    } else if (
      input.heavyPressed &&
      this.heavyCooldown <= 0 &&
      this.player.stamina >= 22 &&
      !this.player.dodging
    ) {
      this._performAttack(true);
    }
  }

  _performAttack(isHeavy) {
    const p = this.player;
    const wasStealth = Boolean(p.stealth);
    p.stealth = false;

    if (isHeavy) {
      p.stamina = Math.max(0, p.stamina - 22);
      p.heavyTimer = 0.58;
      this.heavyCooldown = 1.05;
    } else {
      p.attackTimer = 0.34;
      this.attackCooldown = 0.42;
    }

    const pos = p.root.position;
    const range = isHeavy ? 5.4 : 3.8;
    const baseDmg = Math.round(p.attackPower * (isHeavy ? p.heavyMultiplier : 1.0));

    // Soft lock-on toward nearest enemy within 7m
    const nearest = this.enemies.findNearestAlive(pos, 7.0);
    if (nearest) {
      p.facingYaw = Math.atan2(nearest.mesh.position.x - pos.x, nearest.mesh.position.z - pos.z);
    }

    const forward = new THREE.Vector3(Math.sin(p.facingYaw), 0, Math.cos(p.facingYaw));
    let hits = 0;

    for (const enemy of this.enemies.enemies) {
      if (!enemy.alive) continue;
      const toE = enemy.mesh.position.clone().sub(pos);
      toE.y = 0;
      const dist = toE.length();
      if (dist > range + enemy.radius) continue;

      if (!isHeavy && dist > 0.5) {
        toE.normalize();
        if (forward.dot(toE) < 0.12) continue;
      }

      // 1.75x Stealth Ambush bonus against unaware patrolling creatures!
      const isAmbush = wasStealth && !enemy.provoked;
      const dmg = isAmbush ? Math.round(baseDmg * 1.75) : baseDmg;

      const killed = this.enemies.damageEnemy(enemy, dmg, pos);
      hits++;
      this.hitStopTimer = isHeavy || isAmbush ? 0.055 : 0.032;

      this.events.emit('combat:hit', {
        pos: enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)),
        dmg,
        isHeavy,
        isAmbush,
        killed,
      });

      if (killed) {
        if (this.progression) {
          this.progression.stats.enemiesDefeated++;
          this.progression.addXP(enemy.def.xp, `Defeated ${enemy.def.name}`);
        }
        if (enemy.def.gold && this.inventory) {
          this.inventory.addGold(enemy.def.gold);
        }
        for (const drop of enemy.def.drops || []) {
          if (Math.random() <= drop.chance) {
            this.inventory.addItem(drop.itemId, drop.qty || 1);
            const itemDef = this.inventory.getDef(drop.itemId);
            if (itemDef) {
              this.events.emit('toast', { title: 'Loot Acquired', text: `${itemDef.name} from ${enemy.def.name}` });
            }
          }
        }
        this.events.emit('enemy:defeat', enemy.def);
        this.events.emit(`enemy:defeat:${enemy.def.id}`, enemy.def);
        if (enemy.def.category === 'boss') {
          this.events.emit('boss:defeat', enemy.def);
          this.events.emit(`boss:defeat:${enemy.def.id}`, enemy.def);
          this.events.emit('discovery:banner', { subtitle: 'Guardian Vanquished', title: enemy.def.name });
        }
      }
    }

    this.events.emit('combat:attack', { isHeavy, hits });
  }

  damagePlayer(rawDamage, sourcePos = null) {
    const p = this.player;
    if (p.invulnTimer > 0) return false;

    let dmg = Math.max(2, rawDamage - Math.round(p.defense * 0.45));
    let blocked = false;
    if (p.guarding && p.stamina >= 10) {
      dmg = Math.max(1, Math.round(dmg * 0.25));
      p.stamina = Math.max(0, p.stamina - 14);
      blocked = true;
    }

    p.hp = Math.max(0, p.hp - dmg);
    p.hurtTimer = 0.28;
    p.invulnTimer = 0.6;
    p.stealth = false;

    if (sourcePos) {
      const dx = p.root.position.x - sourcePos.x;
      const dz = p.root.position.z - sourcePos.z;
      const d = Math.hypot(dx, dz) || 1;
      p.velocity.x += (dx / d) * 6;
      p.velocity.z += (dz / d) * 6;
    }

    this.events.emit('combat:playerHit', { dmg, blocked });

    if (p.hp <= 0) {
      p.hp = p.maxHp;
      p.stamina = p.maxStamina;
      p.warmth = p.maxWarmth;
      this.events.emit('player:respawn');
      this.events.emit('toast', {
        title: 'Returned to the Hearth',
        text: 'Rested safely at The Crossroads Settlement. Your gear and discoveries remain intact.',
      });
    }
    return true;
  }
}
