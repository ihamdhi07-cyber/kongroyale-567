// Modular Action Combat System:
// Light Attack, Heavy Arcane Wave, Soft Aim-Assist Targeting, Shield Guard / Reflect,
// Hit Detection, Enemy Damage & Loot Drops, and Safe Respawn at Crossroads Hearth.
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
  }

  update(dt, input) {
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.heavyCooldown > 0) this.heavyCooldown = Math.max(0, this.heavyCooldown - dt);

    if (input.attackPressed && this.attackCooldown <= 0 && !this.player.swimming && !this.player.dodging) {
      this._performAttack(false);
    } else if (
      input.heavyPressed &&
      this.heavyCooldown <= 0 &&
      this.player.stamina >= 22 &&
      !this.player.swimming &&
      !this.player.dodging
    ) {
      this._performAttack(true);
    }
  }

  _performAttack(isHeavy) {
    const p = this.player;
    if (isHeavy) {
      p.stamina = Math.max(0, p.stamina - 22);
      p.heavyTimer = 0.58;
      this.heavyCooldown = 1.05;
    } else {
      p.attackTimer = 0.34;
      this.attackCooldown = 0.42;
    }

    const pos = p.root.position;
    const range = isHeavy ? 5.2 : 3.7;
    const dmg = Math.round(p.attackPower * (isHeavy ? p.heavyMultiplier : 1.0));

    // Soft lock-on: gently snap facing toward nearest enemy within 7m
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
        if (forward.dot(toE) < 0.12) continue; // Forward 165° sweep arc
      }

      const killed = this.enemies.damageEnemy(enemy, dmg, pos);
      hits++;
      if (killed) {
        if (this.progression) {
          this.progression.stats.enemiesDefeated++;
          this.progression.addXP(enemy.def.xp, `Defeated ${enemy.def.name}`);
        }
        // Roll data-driven loot drops
        for (const drop of enemy.def.drops || []) {
          if (Math.random() <= drop.chance) {
            this.inventory.addItem(drop.itemId, 1);
            const itemDef = this.inventory.getDef(drop.itemId);
            if (itemDef) {
              this.events.emit('toast', { title: 'Loot Acquired', text: `${itemDef.name} from ${enemy.def.name}` });
            }
          }
        }
        this.events.emit(`enemy:defeat:${enemy.def.id}`, enemy.def);
      }
    }

    this.events.emit('combat:attack', { isHeavy, hits });
  }

  damagePlayer(rawDamage, sourcePos) {
    const p = this.player;
    if (p.invulnTimer > 0) return 0;

    const mitigated = Math.max(2, Math.round(rawDamage - p.defense * 0.4));
    const finalDmg = p.guarding ? Math.max(1, Math.round(mitigated * 0.25)) : mitigated;
    p.hp = Math.max(0, p.hp - finalDmg);
    p.hurtTimer = 0.28;
    p.invulnTimer = 0.55;

    // Gentle knockback
    if (sourcePos) {
      const dx = p.root.position.x - sourcePos.x;
      const dz = p.root.position.z - sourcePos.z;
      const d = Math.hypot(dx, dz) || 1;
      p.velocity.x += (dx / d) * (p.guarding ? 2.5 : 6.5);
      p.velocity.z += (dz / d) * (p.guarding ? 2.5 : 6.5);
    }

    this.events.emit('combat:playerHit', { damage: finalDmg, blocked: p.guarding });

    // Safe recovery at Crossroads Hearth if HP hits 0 (no frustrating permadeath!)
    if (p.hp <= 0) {
      p.hp = p.maxHp;
      p.stamina = p.maxStamina;
      p.warmth = p.maxWarmth;
      this.events.emit('player:respawn');
      this.events.emit('toast', {
        title: 'Returned to Crossroads Hearth',
        text: 'The spirit lantern guided you safely back to the village hearth.',
      });
    }
    return finalDmg;
  }
}
