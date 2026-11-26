// Experience, Leveling & Unlockable Wayfarer Skill Progression System.
export const SKILLS = [
  {
    id: 'wayfarers-stride',
    name: "Wayfarer's Stride",
    cost: 1,
    description: '+15% movement speed & +25 Max Stamina for exploring highland peaks.',
    bonuses: { speedBonus: 0.15, maxStamina: 25 },
  },
  {
    id: 'gale-glider',
    name: 'Gale Glider Mastery',
    cost: 1,
    description: 'Reduces Spirit Glider stamina drain by 45% across canyons and floating islands.',
    bonuses: { glideMult: 0.55 },
  },
  {
    id: 'arcane-resonance',
    name: 'Arcane Resonance',
    cost: 1,
    description: '+8 Attack Power and stronger Heavy Arcane Slam shockwaves.',
    bonuses: { attack: 8, heavyBonus: 0.35 },
  },
  {
    id: 'stoneward-vitality',
    name: 'Stoneward Vitality',
    cost: 1,
    description: '+40 Max Health and +6 Defense against ancient guardians.',
    bonuses: { maxHp: 40, defense: 6 },
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
        this.events.emit('toast', {
          title: `Level ${this.level} Reached!`,
          text: 'You gained +1 Wayfarer Skill Point. Open Character [P] to unlock a skill.',
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
    const totals = { attack: 0, heavyBonus: 0, defense: 0, maxHp: 0, maxStamina: 0, speedBonus: 0, glideMult: 1.0 };
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
    }
    return totals;
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
    this.skillPoints = snap.skillPoints ?? 1;
    this.unlockedSkills = new Set(snap.unlockedSkills || []);
    if (snap.stats) this.stats = { ...this.stats, ...snap.stats };
    if (inventory && player) inventory.applyStatsToPlayer(player, this.getBonuses());
  }
}
