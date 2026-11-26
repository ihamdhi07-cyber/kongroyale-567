// Action Combat System:
// 3-Hit Light Combo Chain, Heavy Arcane Wave, Plunging Aerial Slam,
// 1.75x–2.25x Stealth Ambush Strike, Golden Perfect Shield Parry (stagger + counter),
// Runic Ward mitigation, Soft Aim-Assist, Unified Kill Rewards, and Safe Hearth Respawn.
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

    // 3-Hit Light Combo State
    this.comboStep = 0;
    this.comboResetTimer = 0;

    // Perfect Parry Guard Window
    this._wasGuarding = false;
    this.parryWindowTimer = 0;
    this.magicSystem = null; // linked optionally by Game
  }

  attachMagic(magicSystem) {
    this.magicSystem = magicSystem;
  }

  update(dt, input) {
    if (this.hitStopTimer > 0) this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.heavyCooldown > 0) this.heavyCooldown = Math.max(0, this.heavyCooldown - dt);
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) this.comboStep = 0;
    }

    // Track fresh guard press for Golden Perfect Parry window!
    const guardingNow = Boolean(this.player.guarding);
    if (guardingNow && !this._wasGuarding) {
      const bonusWin = this.progression?.getBonuses?.().parryWindow || 0;
      this.parryWindowTimer = 0.28 + bonusWin;
    } else if (this.parryWindowTimer > 0) {
      this.parryWindowTimer = Math.max(0, this.parryWindowTimer - dt);
    }
    this._wasGuarding = guardingNow;

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

    const isPlunge = !p.grounded && p.velocity.y < 2.0 && !isHeavy;
    let comboMult = 1.0;
    let comboStep = 1;

    if (isPlunge) {
      p.velocity.y = -24;
      p.gliding = false;
      p.heavyTimer = 0.45;
      this.attackCooldown = 0.52;
      comboMult = 1.55;
    } else if (isHeavy) {
      p.stamina = Math.max(0, p.stamina - 22);
      p.heavyTimer = 0.58;
      this.heavyCooldown = 1.05;
      this.comboStep = 0;
    } else {
      this.comboStep = (this.comboStep % 3) + 1;
      comboStep = this.comboStep;
      this.comboResetTimer = 1.25;
      comboMult = comboStep === 3 ? 1.42 : comboStep === 2 ? 1.15 : 1.0;
      p.attackTimer = comboStep === 3 ? 0.42 : 0.32;
      this.attackCooldown = comboStep === 3 ? 0.48 : 0.34;
    }

    const pos = p.root.position;
    const isFinisher = comboStep === 3 || isPlunge;
    const range = isHeavy || isPlunge ? 5.6 : isFinisher ? 4.5 : 3.9;
    const bonuses = this.progression?.getBonuses?.() || {};
    const baseDmg = Math.round(p.attackPower * (isHeavy ? p.heavyMultiplier : comboMult));

    // Soft lock-on toward nearest enemy within 7.5m
    const nearest = this.enemies.findNearestAlive(pos, 7.5);
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

      if (!isHeavy && !isFinisher && dist > 0.5) {
        toE.normalize();
        if (forward.dot(toE) < 0.12) continue;
      }

      const isAmbush = wasStealth && !enemy.provoked;
      const isRiposte = (enemy.staggerTimer || 0) > 0;
      const ambushMult = 1.75 + (bonuses.ambushBonus || 0);
      const bossMult = enemy.def.category === 'boss' ? 1 + (bonuses.bossBonus || 0) : 1.0;
      let dmg = Math.round(baseDmg * bossMult);
      if (isAmbush) dmg = Math.round(dmg * ambushMult);
      else if (isRiposte) dmg = Math.round(dmg * 1.9);

      const killed = this.enemies.damageEnemy(enemy, dmg, pos);
      hits++;
      this.hitStopTimer = isHeavy || isAmbush || isFinisher || isRiposte ? 0.055 : 0.032;

      if (isAmbush || isRiposte) {
        this.events.emit('combat:style', { type: isAmbush ? 'ambush' : 'riposte', dmg });
      }

      this.events.emit('combat:hit', {
        pos: enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)),
        dmg,
        isHeavy: isHeavy || isFinisher,
        isAmbush: isAmbush || isRiposte,
        comboStep: isHeavy ? 0 : comboStep,
        killed,
      });

      if (killed) {
        this.handleEnemyKill(enemy);
      }
    }

    this.events.emit('combat:attack', { isHeavy, isPlunge, comboStep, hits });
  }

  handleEnemyKill(enemy) {
    if (!enemy || !enemy.def) return;
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

  damagePlayer(rawDamage, sourcePos = null, attackerEnemy = null) {
    const p = this.player;
    if (p.invulnTimer > 0) return false;

    // Golden Perfect Parry!
    if (p.guarding && this.parryWindowTimer > 0) {
      this.parryWindowTimer = 0;
      p.invulnTimer = 0.55;
      p.stamina = Math.min(p.maxStamina, p.stamina + 20);
      this.hitStopTimer = 0.085;
      if (attackerEnemy) {
        attackerEnemy.staggerTimer = 2.4;
        attackerEnemy.state = 'recover';
        attackerEnemy.stateTimer = 2.4;
      }
      this.events.emit('combat:parry', { pos: p.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)) });
      this.events.emit('combat:style', { type: 'parry' });
      this.events.emit('toast', {
        title: '✦ PERFECT PARRY!',
        text: 'Attacker staggered! Counter-attack for massive Riposte damage.',
      });
      return false;
    }

    let dmg = Math.max(2, rawDamage - Math.round(p.defense * 0.45));
    let blocked = false;
    if (p.guarding && p.stamina >= 10) {
      dmg = Math.max(1, Math.round(dmg * 0.25));
      p.stamina = Math.max(0, p.stamina - 14);
      blocked = true;
    }
    if (this.magicSystem?.hasWard?.()) {
      dmg = Math.max(1, Math.round(dmg * 0.5));
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
