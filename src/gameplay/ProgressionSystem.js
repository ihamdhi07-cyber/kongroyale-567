// Experience, Leveling & 3-Branch 18-Skill Wayfarer Progression Tree (Wind · Blade · Resonance).
export const SKILL_BRANCHES = [
  { id: 'wind', name: 'Path of the Wind', icon: '≋', color: '#78e8a8' },
  { id: 'blade', name: 'Path of the Blade', icon: '⚔', color: '#f3b766' },
  { id: 'resonance', name: 'Path of Resonance', icon: '✦', color: '#74e6ff' },
];

export const SKILLS = [
  // === PATH OF THE WIND (Exploration, Traversal, Stamina, Mount, Diving) ===
  {
    id: 'wayfarers-stride',
    branch: 'wind',
    tier: 1,
    name: "Wayfarer's Stride",
    cost: 1,
    description: '+15% movement speed & +25 Max Stamina for exploring highland peaks.',
    bonuses: { speedBonus: 0.15, maxStamina: 25 },
  },
  {
    id: 'gale-glider',
    branch: 'wind',
    tier: 1,
    name: 'Gale Glider Mastery',
    cost: 1,
    description: 'Reduces Spirit Glider stamina drain by 45% across canyons and floating islands.',
    bonuses: { glideMult: 0.55 },
  },
  {
    id: 'stag-bond',
    branch: 'wind',
    tier: 2,
    name: 'Spirit Stag Bond',
    cost: 1,
    description: '+20% Wind Stag gallop velocity and +20 Max Stamina.',
    bonuses: { mountBonus: 0.2, maxStamina: 20 },
  },
  {
    id: 'deep-breath',
    branch: 'wind',
    tier: 2,
    name: 'Mariner Lungs',
    cost: 1,
    description: 'Doubles underwater diving breath & increases swim agility by 15%.',
    bonuses: { breathBonus: 0.8, speedBonus: 0.06 },
  },
  {
    id: 'frost-endurance',
    branch: 'wind',
    tier: 3,
    name: 'Alpine Trailblazer',
    cost: 1,
    description: '+35 Warmth resistance against Highland blizzards and +20 Max HP.',
    bonuses: { warmthBonus: 35, maxHp: 20 },
  },
  {
    id: 'horizon-wings',
    branch: 'wind',
    tier: 3,
    name: 'Wings of the Horizon',
    cost: 2,
    description: 'Master traversal: +12% movement speed, +40 Max Stamina & -25% glider drain.',
    bonuses: { speedBonus: 0.12, maxStamina: 40, glideMult: 0.75 },
  },

  // === PATH OF THE BLADE (Combat, Combo, Perfect Parry, Stealth, Boss Slaying) ===
  {
    id: 'arcane-resonance',
    branch: 'blade',
    tier: 1,
    name: 'Arcane Resonance',
    cost: 1,
    description: '+8 Attack Power and stronger Heavy Arcane Slam shockwaves.',
    bonuses: { attack: 8, heavyBonus: 0.35 },
  },
  {
    id: 'stoneward-vitality',
    branch: 'blade',
    tier: 1,
    name: 'Stoneward Vitality',
    cost: 1,
    description: '+40 Max Health and +6 Defense against ancient guardians.',
    bonuses: { maxHp: 40, defense: 6 },
  },
  {
    id: 'golden-parry',
    branch: 'blade',
    tier: 2,
    name: 'Golden Riposte',
    cost: 1,
    description: 'Widens Perfect Parry window (+0.14s) and empowers counter-attacks.',
    bonuses: { parryWindow: 0.14, attack: 5 },
  },
  {
    id: 'shadow-stalker',
    branch: 'blade',
    tier: 2,
    name: 'Whispering Ambush',
    cost: 1,
    description: 'Boosts Stealth Ambush multiplier from 1.75× to 2.25× critical strike damage.',
    bonuses: { ambushBonus: 0.5, speedBonus: 0.05 },
  },
  {
    id: 'titan-breaker',
    branch: 'blade',
    tier: 3,
    name: 'Sovereign Slayer',
    cost: 1,
    description: '+14 Attack Power and +25% bonus damage against World Bosses.',
    bonuses: { attack: 14, bossBonus: 0.25 },
  },
  {
    id: 'aegis-heart',
    branch: 'blade',
    tier: 3,
    name: 'Bastion of the Citadel',
    cost: 2,
    description: '+70 Max Health and +12 Defense for enduring multi-phase boss fights.',
    bonuses: { maxHp: 70, defense: 12 },
  },

  // === PATH OF RESONANCE (Magic Spells, Cooldown Haste, Alchemy, Spirit Power) ===
  {
    id: 'crystal-channeling',
    branch: 'resonance',
    tier: 1,
    name: 'Crystal Channeling',
    cost: 1,
    description: '+14 Spell Power across Bolt, Gale Updraft, Sunfire Nova, and Spirit Ward.',
    bonuses: { spellPower: 14 },
  },
  {
    id: 'harmonic-haste',
    branch: 'resonance',
    tier: 1,
    name: 'Harmonic Haste',
    cost: 1,
    description: 'Reduces all Resonance Spell cooldowns by 20%.',
    bonuses: { cooldownMult: 0.8 },
  },
  {
    id: 'solar-flare',
    branch: 'resonance',
    tier: 2,
    name: 'Ember Nova Mastery',
    cost: 1,
    description: '+18 Spell Power and ignites stronger Sunfire bursts (+4 Attack).',
    bonuses: { spellPower: 18, attack: 4 },
  },
  {
    id: 'sanctuary-bloom',
    branch: 'resonance',
    tier: 2,
    name: 'Sanctuary Bloom',
    cost: 1,
    description: '+30 Max Health and +12 Spell Power for amplified Spirit Ward healing.',
    bonuses: { maxHp: 30, spellPower: 12 },
  },
  {
    id: 'starfall-conduit',
    branch: 'resonance',
    tier: 3,
    name: 'Starfall Conduit',
    cost: 1,
    description: 'Additional -15% Spell Cooldowns and +20 Max Stamina.',
    bonuses: { cooldownMult: 0.85, maxStamina: 20 },
  },
  {
    id: 'arch-wayfarer',
    branch: 'resonance',
    tier: 3,
    name: 'Arch-Wayfarer Harmony',
    cost: 2,
    description: '+30 Spell Power, +10 Attack, and +8 Defense — ultimate Resonance mastery.',
    bonuses: { spellPower: 30, attack: 10, defense: 8 },
  },
];

export class ProgressionSystem {
  constructor(eventBus = null) {
    this.events = eventBus;
    this.level = 1;
    this.xp = 0;
    this.skillPoints = 1; // Start with 1 Wayfarer Insight point so player can test skill unlocks early!
    this.unlockedSkills = new Set();
    this.stats = {
      landmarksDiscovered: 1,
      puzzlesSolved: 0,
      enemiesDefeated: 0,
      itemsCrafted: 0,
    };
  }

  xpForNextLevel(lvl = this.level) {
    return 100 + (lvl - 1) * 75;
  }

  addXp(amount, reason = '') {
    return this.addXP(amount, reason);
  }

  addXP(amount, reason = '') {
    if (amount <= 0) return;
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel();
      this.level++;
      this.skillPoints++;
      leveledUp = true;
    }
    if (this.events) {
      this.events.emit('progression:xp', { amount, reason, level: this.level, xp: this.xp, leveledUp });
      if (leveledUp) {
        this.events.emit('player:levelup', { level: this.level, skillPoints: this.skillPoints });
        this.events.emit('toast', {
          title: `Level ${this.level} Reached!`,
          text: 'You gained +1 Wayfarer Skill Point. Open Character [P] to expand your 3-Branch Skill Tree.',
        });
      }
    }
  }

  unlockSkill(skillId, inventory = null, player = null) {
    const skill = SKILLS.find((s) => s.id === skillId);
    if (!skill || this.unlockedSkills.has(skillId) || this.skillPoints < skill.cost) return false;
    this.skillPoints -= skill.cost;
    this.unlockedSkills.add(skillId);
    if (inventory && player) {
      inventory.applyStatsToPlayer(player, this.getBonuses());
      player.heal(25);
    }
    if (this.events) this.events.emit('progression:updated');
    return true;
  }

  getBonuses() {
    const totals = {
      attack: 0,
      heavyBonus: 0,
      defense: 0,
      maxHp: 0,
      maxStamina: 0,
      speedBonus: 0,
      glideMult: 1.0,
      spellPower: 0,
      cooldownMult: 1.0,
      parryWindow: 0,
      ambushBonus: 0,
      bossBonus: 0,
      mountBonus: 0,
      breathBonus: 0,
      warmthBonus: 0,
    };
    for (const id of this.unlockedSkills) {
      const s = SKILLS.find((sk) => sk.id === id);
      if (!s) continue;
      if (s.bonuses.attack) totals.attack += s.bonuses.attack;
      if (s.bonuses.heavyBonus) totals.heavyBonus += s.bonuses.heavyBonus;
      if (s.bonuses.defense) totals.defense += s.bonuses.defense;
      if (s.bonuses.maxHp) totals.maxHp += s.bonuses.maxHp;
      if (s.bonuses.maxStamina) totals.maxStamina += s.bonuses.maxStamina;
      if (s.bonuses.speedBonus) totals.speedBonus += s.bonuses.speedBonus;
      if (s.bonuses.glideMult) totals.glideMult *= s.bonuses.glideMult;
      if (s.bonuses.spellPower) totals.spellPower += s.bonuses.spellPower;
      if (s.bonuses.cooldownMult) totals.cooldownMult *= s.bonuses.cooldownMult;
      if (s.bonuses.parryWindow) totals.parryWindow += s.bonuses.parryWindow;
      if (s.bonuses.ambushBonus) totals.ambushBonus += s.bonuses.ambushBonus;
      if (s.bonuses.bossBonus) totals.bossBonus += s.bonuses.bossBonus;
      if (s.bonuses.mountBonus) totals.mountBonus += s.bonuses.mountBonus;
      if (s.bonuses.breathBonus) totals.breathBonus += s.bonuses.breathBonus;
      if (s.bonuses.warmthBonus) totals.warmthBonus += s.bonuses.warmthBonus;
    }
    return totals;
  }

  getSpellPowerBonus() {
    return this.getBonuses().spellPower;
  }

  getCooldownMultiplier() {
    return this.getBonuses().cooldownMult;
  }

  getSnapshot() {
    return {
      level: this.level,
      xp: this.xp,
      skillPoints: this.skillPoints,
      unlockedSkills: [...this.unlockedSkills],
      stats: { ...this.stats },
    };
  }

  loadSnapshot(snap, inventory = null, player = null) {
    if (!snap) return;
    this.level = snap.level || 1;
    this.xp = snap.xp || 0;
    this.skillPoints = snap.skillPoints ?? 2;
    this.unlockedSkills = new Set(snap.unlockedSkills || []);
    if (snap.stats) this.stats = { ...this.stats, ...snap.stats };
    if (inventory && player) inventory.applyStatsToPlayer(player, this.getBonuses());
  }
}
