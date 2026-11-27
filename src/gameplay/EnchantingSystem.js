// Elemental Weapon Rune Infusion & Synergy Reaction Engine:
// Lets the Wayfarer forge & swap 4 Elemental Runes onto any equipped staff/blade,
// unlocking glowing 3D weapon auras, on-hit elemental statuses (Burn / Frost), and
// 3 explosive Elemental Combo Reactions:
//   - THERMAL SHATTER (Sunfire on Frosted foe -> 2.2x burst explosion)
//   - WILDFIRE GALE   (Gale / Tempest on Burning foe -> 1.8x AoE flame vortex)
//   - ASTRAL OVERLOAD (Resonance / Astral on Staggered foe -> 2.0x shockwave crit)

export const WEAPON_RUNES = [
  {
    id: 'sunfire-rune',
    name: 'Sunfire Ember Rune',
    shortName: 'Sunfire',
    icon: '☀',
    element: 'sunfire',
    color: 0xff8a30,
    atkBonus: 4,
    speedBonus: 0,
    bossBonus: 0,
    goldCost: 55,
    materials: [{ id: 'sunberry', qty: 2 }],
    description: '+4 ATK & ignites foes for Burn DoT. Detonates Frosted enemies for 2.2× THERMAL SHATTER!',
  },
  {
    id: 'frostbite-rune',
    name: 'Frostbite Glacier Rune',
    shortName: 'Frostbite',
    icon: '❄',
    element: 'frost',
    color: 0x72e8ff,
    atkBonus: 3,
    speedBonus: 0,
    bossBonus: 0,
    goldCost: 60,
    materials: [{ id: 'crystal-shard', qty: 1 }],
    description: '+3 ATK & chills foes (-45% move speed for 4s). Prime targets for Sunfire THERMAL SHATTER!',
  },
  {
    id: 'tempest-rune',
    name: 'Tempest Gale Rune',
    shortName: 'Tempest',
    icon: '≋',
    element: 'wind',
    color: 0x6ef2a8,
    atkBonus: 3,
    speedBonus: 0.22,
    bossBonus: 0,
    goldCost: 65,
    materials: [{ id: 'moonpetal', qty: 2 }],
    description: '+22% strike cadence & +1.2m cleave arc. Sweeps Burning foes into an AoE WILDFIRE GALE!',
  },
  {
    id: 'astral-rune',
    name: 'Astral Resonance Rune',
    shortName: 'Astral',
    icon: '✦',
    element: 'resonance',
    color: 0xd194ff,
    atkBonus: 5,
    speedBonus: 0.08,
    bossBonus: 0.28,
    goldCost: 85,
    materials: [{ id: 'crystal-shard', qty: 2 }],
    description: '+5 ATK & +28% damage vs World Bosses. Triggers 2.0× ASTRAL OVERLOAD on Parried/Staggered foes!',
  },
];

export class EnchantingSystem {
  constructor(inventory, eventBus) {
    this.inventory = inventory;
    this.events = eventBus;
    this.unlocked = new Set();
    this.activeRuneId = null;
    this.reactionCounts = { shatter: 0, wildfire: 0, overload: 0 };
  }

  getRuneDef(id) {
    return WEAPON_RUNES.find((r) => r.id === id) || null;
  }

  getActiveRune() {
    return this.activeRuneId ? this.getRuneDef(this.activeRuneId) : null;
  }

  canUnlock(runeId) {
    const def = this.getRuneDef(runeId);
    if (!def) return false;
    if (this.unlocked.has(runeId)) return true;
    if ((this.inventory?.gold || 0) < def.goldCost) return false;
    for (const mat of def.materials) {
      if ((this.inventory?.getCount?.(mat.id) || 0) < mat.qty) return false;
    }
    return true;
  }

  unlockAndEquip(runeId, player = null) {
    const def = this.getRuneDef(runeId);
    if (!def) return { ok: false, reason: 'Unknown rune' };

    if (!this.unlocked.has(runeId)) {
      if (!this.canUnlock(runeId)) return { ok: false, reason: 'Insufficient Sunshards or materials' };
      this.inventory.spendGold(def.goldCost);
      for (const mat of def.materials) {
        this.inventory.removeItem(mat.id, mat.qty);
      }
      this.unlocked.add(runeId);
    }

    this.activeRuneId = runeId;
    if (player?.setElementalInfusion) player.setElementalInfusion(def);
    this.events?.emit('rune:infused', { rune: def });
    this.events?.emit('toast', {
      title: `${def.icon} Weapon Infused: ${def.name}`,
      text: def.description,
    });
    return { ok: true, rune: def };
  }

  clearInfusion(player = null) {
    this.activeRuneId = null;
    if (player?.setElementalInfusion) player.setElementalInfusion(null);
  }

  /**
   * Evaluates elemental status application & combo reactions on hit.
   * Returns { multiplier, reactionLabel, reactionColor, aoeRadius, aoeDamage }
   */
  resolveHit(enemy, incomingElement, baseDamage) {
    const out = {
      multiplier: 1.0,
      reactionLabel: null,
      reactionColor: null,
      aoeRadius: 0,
      aoeDamage: 0,
    };
    if (!enemy || !incomingElement) return out;

    const el = incomingElement;
    // 1. THERMAL SHATTER: Sunfire hits a Frosted enemy -> 2.2x burst!
    if (el === 'sunfire' && (enemy.frostTimer || 0) > 0) {
      enemy.frostTimer = 0;
      enemy.burnTimer = Math.max(enemy.burnTimer || 0, 3.0);
      out.multiplier = 2.2;
      out.reactionLabel = 'THERMAL SHATTER!';
      out.reactionColor = 0x7ef5ff;
      out.aoeRadius = 5.5;
      out.aoeDamage = Math.round(baseDamage * 0.75);
      this.reactionCounts.shatter += 1;
      this.events?.emit('combat:reaction', { type: 'shatter', label: out.reactionLabel, pos: enemy.mesh?.position });
      return out;
    }

    // 2. WILDFIRE GALE: Wind hits a Burning enemy -> 1.8x flame vortex spreading burn!
    if (el === 'wind' && (enemy.burnTimer || 0) > 0) {
      enemy.burnTimer = 4.5;
      out.multiplier = 1.8;
      out.reactionLabel = 'WILDFIRE GALE!';
      out.reactionColor = 0xff9a3c;
      out.aoeRadius = 7.5;
      out.aoeDamage = Math.round(baseDamage * 0.85);
      this.reactionCounts.wildfire += 1;
      this.events?.emit('combat:reaction', { type: 'wildfire', label: out.reactionLabel, pos: enemy.mesh?.position });
      return out;
    }

    // 3. ASTRAL OVERLOAD: Resonance hits a Parried/Staggered enemy -> 2.0x shockwave!
    if (el === 'resonance' && (enemy.staggerTimer || 0) > 0) {
      out.multiplier = 2.0;
      out.reactionLabel = 'ASTRAL OVERLOAD!';
      out.reactionColor = 0xd99cff;
      out.aoeRadius = 6.2;
      out.aoeDamage = Math.round(baseDamage * 0.65);
      this.reactionCounts.overload += 1;
      this.events?.emit('combat:reaction', { type: 'overload', label: out.reactionLabel, pos: enemy.mesh?.position });
      return out;
    }

    // Standard elemental status priming
    if (el === 'sunfire') enemy.burnTimer = Math.max(enemy.burnTimer || 0, 3.5);
    if (el === 'frost') enemy.frostTimer = Math.max(enemy.frostTimer || 0, 4.2);

    return out;
  }

  getCombatBonuses() {
    const active = this.getActiveRune();
    if (!active) return { atkBonus: 0, speedBonus: 0, bossBonus: 0, element: null };
    return {
      atkBonus: active.atkBonus,
      speedBonus: active.speedBonus,
      bossBonus: active.bossBonus,
      element: active.element,
    };
  }

  serialize() {
    return {
      unlocked: Array.from(this.unlocked),
      activeRuneId: this.activeRuneId,
      reactionCounts: { ...this.reactionCounts },
    };
  }

  deserialize(data, player = null) {
    if (!data) return;
    this.unlocked = new Set(data.unlocked || []);
    this.activeRuneId = data.activeRuneId || null;
    this.reactionCounts = {
      shatter: data.reactionCounts?.shatter || 0,
      wildfire: data.reactionCounts?.wildfire || 0,
      overload: data.reactionCounts?.overload || 0,
    };
    const active = this.getActiveRune();
    if (player?.setElementalInfusion) player.setElementalInfusion(active);
  }
}
