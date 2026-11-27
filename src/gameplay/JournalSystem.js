export const ACHIEVEMENTS = [
  { id: 'ach-first-steps', title: 'Wayfarer Awakened', desc: 'Speak with Elder Maren at Crossroads Settlement.', xp: 40, gold: 25 },
  { id: 'ach-first-landmark', title: 'Horizon Seeker', desc: 'Discover your first major regional landmark.', xp: 50, gold: 30 },
  { id: 'ach-cartographer', title: 'Master Cartographer', desc: 'Discover all 8 major regional landmarks across the realm.', xp: 300, gold: 200 },
  { id: 'ach-waystone-3', title: 'Resonance Network', desc: 'Attune 3 Fast-Travel Waystones.', xp: 90, gold: 60 },
  { id: 'ach-puzzle-1', title: 'Ancient Mind', desc: 'Solve your first regional environmental puzzle.', xp: 60, gold: 40 },
  { id: 'ach-puzzle-5', title: 'Grand Artificer', desc: 'Solve 5 ancient environmental puzzles.', xp: 200, gold: 130 },
  { id: 'ach-sanctuary-1', title: 'Sanctuary Explorer', desc: 'Enter an enclosed 3D Sanctuary chamber.', xp: 65, gold: 40 },
  { id: 'ach-sanctuary-4', title: 'Keeper of Vaults', desc: 'Explore 4 unique 3D Sanctuaries across the continent.', xp: 220, gold: 150 },
  { id: 'ach-angler-1', title: 'First Catch', desc: 'Land your first fish using the Spirit Line.', xp: 50, gold: 30 },
  { id: 'ach-angler-4', title: 'Master Angler', desc: 'Catch 4 different regional fish species.', xp: 180, gold: 120 },
  { id: 'ach-sailor', title: 'Azure Navigator', desc: 'Set sail aboard a coastal skiff.', xp: 65, gold: 40 },
  { id: 'ach-wind-stag', title: 'Rider of the Wind', desc: 'Summon and ride Sylph the Spirit Wind Stag.', xp: 65, gold: 40 },
  { id: 'ach-arcanist', title: 'Voice of Resonance', desc: 'Cast 5 Ancient Resonance Spells.', xp: 85, gold: 50 },
  { id: 'ach-parry', title: 'Golden Riposte', desc: 'Land a Perfect Parry or Stealth Ambush strike.', xp: 95, gold: 65 },
  { id: 'ach-hunter', title: 'Wilds Defender', desc: 'Defeat 5 hostile guardians or wild beasts.', xp: 100, gold: 70 },
  { id: 'ach-boss-1', title: 'Titan Vanquisher', desc: 'Defeat your first Legendary World Boss.', xp: 180, gold: 120 },
  { id: 'ach-boss-4', title: 'Sovereign Slayer', desc: 'Defeat all 4 Legendary World Bosses.', xp: 450, gold: 320 },
  { id: 'ach-chef', title: 'Hearth Trail-Chef', desc: 'Craft or cook 3 items or meals.', xp: 75, gold: 45 },
  { id: 'ach-campfire', title: 'Rest Beneath the Stars', desc: 'Rest beside a traveling campfire.', xp: 50, gold: 30 },
  { id: 'ach-starfall', title: 'Starfall Chaser', desc: 'Complete a Meteoric Starfall or Spirit Wisp event.', xp: 110, gold: 80 },
  { id: 'ach-lore-3', title: 'Chronicler of Echoes', desc: 'Record 3 Ancient Lore Entries.', xp: 100, gold: 65 },
  { id: 'ach-wealth', title: 'Golden Ledger', desc: 'Accumulate 300+ Sunshards in your pouch.', xp: 90, gold: 50 },
  { id: 'ach-gate', title: 'Awakener of the Gate', desc: 'Awaken The Unknown Gate in Hidden Frontier.', xp: 350, gold: 250 },
  { id: 'ach-level-5', title: 'Seasoned Wayfarer', desc: 'Reach Wayfarer Level 5.', xp: 150, gold: 100 }
];

export const FACTIONS = [
  { id: 'crossroads-guild', name: 'Crossroads Guild', region: 'Verdant Valley & Emerald Wilds' },
  { id: 'tidehaven-mariners', name: 'Tidehaven Mariners', region: 'Azure Coast' },
  { id: 'highland-wardens', name: 'Highland Wardens', region: 'Highland Reach & Hidden Frontier' },
  { id: 'arcane-scholars', name: 'Arcane Scholars', region: 'Forgotten Kingdom, Hollow Depths & Shattered Expanse' }
];

export const LORE_LIBRARY = [
  {
    id: 'lore-shattered-resonance',
    title: 'Chronicle of the Shattered Resonance',
    region: 'Verdant Valley',
    text: 'Long before the timber cottages of Crossroads were raised, eight harmonic towers sang across the continent. When the eastern spire over-resonated, the sky fractured into the floating islands of the Shattered Expanse.'
  },
  {
    id: 'lore-unknown-gate',
    title: 'Seal of The Unknown Gate',
    region: 'Hidden Frontier',
    text: 'The Gatekeepers forged a harmonic lock in the autumn groves so no restless titan could cross beyond the 8 km frontier until a Cartographer of clear heart reunited the Resonance Key.'
  },
  {
    id: 'lore-heart-tree',
    title: 'Roots of the Ancient Heart Tree',
    region: 'Emerald Wilds',
    text: 'Beneath the luminous golden canopy, the Heart Tree drinks directly from subterranean crystal veins. Every Moonpetal in the realm blooms in quiet rhythm with its pulse.'
  },
  {
    id: 'lore-drowned-archive',
    title: 'Tide Charter of the Drowned Archive',
    region: 'Azure Coast',
    text: 'When the eastern shelf sank beneath turquoise waters, Tidehaven mariners salvaged bronze seals by lantern-light, leaving the sunken library intact beneath the reef.'
  },
  {
    id: 'lore-skywatch-astrolabe',
    title: 'Astrolabe Notes of Highland Reach',
    region: 'Highland Reach',
    text: 'From the wind-carved peak of Skywatch Observatory, ancient star-watchers predicted Meteoric Starfalls decades in advance using three concentric brass rings.'
  },
  {
    id: 'lore-silent-citadel',
    title: 'Vigil of the Silent Citadel',
    region: 'Forgotten Kingdom',
    text: 'The limestone knights of the Citadel were never built for conquest—they stood watch over the imperial roads and vaulted royal crypt until time eroded their masters.'
  },
  {
    id: 'lore-crystal-cathedral',
    title: 'Songs of the Hollow Depths',
    region: 'Hollow Depths',
    text: 'Strike a cyan prism inside the Crystal Cathedral and its note lingers for a full minute, echoing down flooded grottoes where luminous eels glide in darkness.'
  },
  {
    id: 'lore-broken-horizon',
    title: 'Memoir of the Broken Horizon',
    region: 'Shattered Expanse',
    text: 'Gravity itself grows forgetful beyond the eastern chasm. Only the thermal wind-streams—and the soaring wings of a Spirit Glider—bind the floating monoliths together.'
  }
];

/**
 * Wayfarer's Codex: Bestiary, Lore Archive, 24 Achievements, 4 Regional Factions & Completion %.
 */
export class JournalSystem {
  constructor(eventBus, creaturesData, inventory, progression) {
    this.events = eventBus;
    this.creatures = creaturesData?.creatures || [];
    this.inventory = inventory;
    this.progression = progression;

    this.bestiary = {}; // creatureId -> { kills, firstSeen }
    this.unlockedLore = new Set(['lore-shattered-resonance']);
    this.achievements = new Set();
    this.reputation = {
      'crossroads-guild': 25,
      'tidehaven-mariners': 10,
      'highland-wardens': 10,
      'arcane-scholars': 10
    };
    this.stats = {
      kills: 0,
      bossesDefeated: new Set(),
      sanctuaries: new Set(),
      puzzles: 0,
      waystones: 0,
      landmarks: 0,
      fishSpecies: new Set(),
      crafts: 0,
      spells: 0
    };

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.events) return;

    this.events.on('npc:talk:elder-maren', () => {
      this._grant('ach-first-steps');
      this.addReputation('crossroads-guild', 15);
    });

    this.events.on('landmark:discover', (data) => {
      this.stats.landmarks += 1;
      this._grant('ach-first-landmark');
      if (this.stats.landmarks >= 8) this._grant('ach-cartographer');
      if (data?.id === 'ancient-heart-tree') this.unlockLore('lore-heart-tree');
      if (data?.id === 'drowned-archive') this.unlockLore('lore-drowned-archive');
      if (data?.id === 'skywatch-observatory') this.unlockLore('lore-skywatch-astrolabe');
      if (data?.id === 'silent-citadel') this.unlockLore('lore-silent-citadel');
      if (data?.id === 'crystal-cathedral') this.unlockLore('lore-crystal-cathedral');
      if (data?.id === 'broken-horizon') this.unlockLore('lore-broken-horizon');
      if (data?.id === 'unknown-gate') this.unlockLore('lore-unknown-gate');
    });

    this.events.on('waystone:activate', () => {
      this.stats.waystones += 1;
      this.addReputation('crossroads-guild', 10);
      if (this.stats.waystones >= 3) this._grant('ach-waystone-3');
    });

    this.events.on('puzzle:solve', () => {
      this.stats.puzzles += 1;
      this.addReputation('arcane-scholars', 20);
      this._grant('ach-puzzle-1');
      if (this.stats.puzzles >= 5) this._grant('ach-puzzle-5');
    });

    this.events.on('interior:enter', (data) => {
      if (data?.id) this.stats.sanctuaries.add(data.id);
      this._grant('ach-sanctuary-1');
      this.addReputation('arcane-scholars', 15);
      if (this.stats.sanctuaries.size >= 4) this._grant('ach-sanctuary-4');
    });

    this.events.on('fishing:catch', (data) => {
      if (data?.itemId) this.stats.fishSpecies.add(data.itemId);
      this._grant('ach-angler-1');
      this.addReputation('tidehaven-mariners', 12);
      if (this.stats.fishSpecies.size >= 4) this._grant('ach-angler-4');
    });

    this.events.on('boat:board', () => {
      this._grant('ach-sailor');
      this.addReputation('tidehaven-mariners', 15);
    });

    this.events.on('mount:summon', () => this._grant('ach-wind-stag'));

    this.events.on('magic:cast', () => {
      this.stats.spells += 1;
      if (this.stats.spells >= 5) this._grant('ach-arcanist');
    });

    this.events.on('combat:style', () => this._grant('ach-parry'));

    this.events.on('enemy:defeat', (data) => {
      this.stats.kills += 1;
      if (data?.id) {
        const entry = this.bestiary[data.id] || { kills: 0 };
        entry.kills += 1;
        this.bestiary[data.id] = entry;
      }
      if (this.stats.kills >= 5) this._grant('ach-hunter');
    });

    this.events.on('boss:defeat', (data) => {
      if (data?.id) this.stats.bossesDefeated.add(data.id);
      this._grant('ach-boss-1');
      this.addReputation('highland-wardens', 35);
      this.addReputation('arcane-scholars', 35);
      if (this.stats.bossesDefeated.size >= 4) this._grant('ach-boss-4');
    });

    this.events.on('craft:complete', () => {
      this.stats.crafts += 1;
      this.addReputation('crossroads-guild', 8);
      if (this.stats.crafts >= 3) this._grant('ach-chef');
    });

    this.events.on('campfire:rest', () => this._grant('ach-campfire'));

    this.events.on('worldevent:complete', () => {
      this._grant('ach-starfall');
      this.addReputation('crossroads-guild', 20);
    });

    this.events.on('gate:awaken', () => {
      this._grant('ach-gate');
      this.addReputation('highland-wardens', 50);
    });

    this.events.on('player:levelup', (data) => {
      if ((data?.level || 1) >= 5) this._grant('ach-level-5');
    });

    this.events.on('inventory:gold', (data) => {
      if ((data?.gold || 0) >= 300) this._grant('ach-wealth');
    });
  }

  unlockLore(loreId) {
    if (this.unlockedLore.has(loreId)) return false;
    this.unlockedLore.add(loreId);
    this.events?.emit('lore:discover', { id: loreId, count: this.unlockedLore.size });
    if (this.unlockedLore.size >= 3) this._grant('ach-lore-3');
    return true;
  }

  addReputation(factionId, amount) {
    if (!(factionId in this.reputation)) return;
    this.reputation[factionId] = Math.min(200, (this.reputation[factionId] || 0) + amount);
  }

  getMerchantDiscount(factionId = 'crossroads-guild') {
    const rep = this.reputation[factionId] || 0;
    if (rep >= 150) return 0.25;
    if (rep >= 90) return 0.15;
    if (rep >= 45) return 0.08;
    return 0;
  }

  getFactionRank(rep) {
    if (rep >= 150) return 'Champion (-25% Shop)';
    if (rep >= 90) return 'Honored (-15% Shop)';
    if (rep >= 45) return 'Trusted (-8% Shop)';
    return 'Wayfarer';
  }

  _grant(achId) {
    if (this.achievements.has(achId)) return false;
    const def = ACHIEVEMENTS.find((a) => a.id === achId);
    if (!def) return false;
    this.achievements.add(achId);
    this.inventory?.addGold?.(def.gold);
    this.progression?.addXp?.(def.xp);
    this.events?.emit('achievement:unlock', def);
    return true;
  }

  getBestiaryList() {
    return this.creatures.map((c) => ({
      ...c,
      kills: this.bestiary[c.id]?.kills || 0,
      discovered: (this.bestiary[c.id]?.kills || 0) > 0
    }));
  }

  getLoreList() {
    return LORE_LIBRARY.map((l) => ({
      ...l,
      unlocked: this.unlockedLore.has(l.id)
    }));
  }

  getAchievementsList() {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: this.achievements.has(a.id)
    }));
  }

  getFactionsList() {
    return FACTIONS.map((f) => ({
      ...f,
      rep: this.reputation[f.id] || 0,
      rank: this.getFactionRank(this.reputation[f.id] || 0)
    }));
  }

  getCompletionPercent({ exploration = null, puzzles = null, quests = null } = {}) {
    const parts = [
      (exploration?.discoveredLandmarks?.size || 0) / 8,
      (puzzles?.solved?.size || 0) / 8,
      this.achievements.size / ACHIEVEMENTS.length,
      this.unlockedLore.size / LORE_LIBRARY.length,
      (quests?.completed?.size || 0) / 18
    ];
    const avg = parts.reduce((a, b) => a + Math.min(1, b), 0) / parts.length;
    return Math.round(avg * 100);
  }

  serialize() {
    return {
      bestiary: this.bestiary,
      unlockedLore: [...this.unlockedLore],
      achievements: [...this.achievements],
      reputation: this.reputation,
      stats: {
        kills: this.stats.kills,
        bossesDefeated: [...this.stats.bossesDefeated],
        sanctuaries: [...this.stats.sanctuaries],
        puzzles: this.stats.puzzles,
        waystones: this.stats.waystones,
        landmarks: this.stats.landmarks,
        fishSpecies: [...this.stats.fishSpecies],
        crafts: this.stats.crafts,
        spells: this.stats.spells
      }
    };
  }

  hydrate(data) {
    if (!data) return;
    this.bestiary = data.bestiary || {};
    this.unlockedLore = new Set(data.unlockedLore || ['lore-shattered-resonance']);
    this.achievements = new Set(data.achievements || []);
    if (data.reputation) Object.assign(this.reputation, data.reputation);
    if (data.stats) {
      this.stats.kills = data.stats.kills || 0;
      this.stats.bossesDefeated = new Set(data.stats.bossesDefeated || []);
      this.stats.sanctuaries = new Set(data.stats.sanctuaries || []);
      this.stats.puzzles = data.stats.puzzles || 0;
      this.stats.waystones = data.stats.waystones || 0;
      this.stats.landmarks = data.stats.landmarks || 0;
      this.stats.fishSpecies = new Set(data.stats.fishSpecies || []);
      this.stats.crafts = data.stats.crafts || 0;
      this.stats.spells = data.stats.spells || 0;
    }
  }
}
