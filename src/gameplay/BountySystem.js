// Crossroads Guild Bounty Board System:
// Generates rotating regional Guild Contracts (Monster Hunts, Fishing Catches,
// Shrine Trials, Starfall Collection, Elemental Reactions) that auto-track via EventBus
// and reward instant Sunshards, XP, and Regional Faction Trust!

const BOUNTY_POOL = [
  {
    id: 'bounty-stalker-patrol',
    title: 'Clear Woodland Stalkers',
    region: 'Verdant Valley & Emerald Wilds',
    factionId: 'crossroads-guild',
    event: 'enemy:defeat',
    target: 2,
    gold: 65,
    xp: 90,
    rep: 25,
    description: 'Defeat 2 wild creatures roaming outside Crossroads Settlement.',
  },
  {
    id: 'bounty-river-catch',
    title: 'Fresh Catch for the Hearth',
    region: 'Silver River & Azure Coast',
    factionId: 'coastal-navigators',
    event: 'fishing:catch',
    target: 2,
    gold: 70,
    xp: 95,
    rep: 30,
    description: 'Reel in 2 regional fish using your Spirit Fishing Line [G].',
  },
  {
    id: 'bounty-shrine-runner',
    title: 'Resonance Shrine Runner',
    region: 'Any Region',
    factionId: 'emerald-circle',
    event: 'trial:completed',
    target: 1,
    gold: 90,
    xp: 120,
    rep: 35,
    description: 'Complete any Timed Ancient Resonance Shrine Trial.',
  },
  {
    id: 'bounty-elemental-master',
    title: 'Elemental Synergy Demonstration',
    region: 'Any Region',
    factionId: 'highland-watch',
    event: 'combat:reaction',
    target: 1,
    gold: 85,
    xp: 115,
    rep: 30,
    description: 'Trigger Thermal Shatter, Wildfire Gale, or Astral Overload in battle.',
  },
  {
    id: 'bounty-starfall-seeker',
    title: 'Gather Fallen Starlight',
    region: 'Crossroads & Frontier',
    factionId: 'highland-watch',
    event: 'worldevent:complete',
    target: 1,
    gold: 95,
    xp: 130,
    rep: 35,
    description: 'Claim a Starfall Shard or follow a Guiding Spirit Wisp across the wilds.',
  },
  {
    id: 'bounty-sanctuary-scholar',
    title: 'Sanctuary Charter Survey',
    region: 'Any 3D Sanctuary',
    factionId: 'emerald-circle',
    event: 'interior:enter',
    target: 1,
    gold: 60,
    xp: 85,
    rep: 25,
    description: 'Step inside any ancient 3D Sanctuary chamber across the realm.',
  },
];

export class BountySystem {
  constructor(eventBus, inventory, progression, journal = null) {
    this.events = eventBus;
    this.inventory = inventory;
    this.progression = progression;
    this.journal = journal;

    this.completedCount = 0;
    this.rotationOffset = 0;
    this.bounties = [];
    this._generateBoard();
    this._bindEvents();
  }

  _generateBoard() {
    this.bounties = [];
    for (let i = 0; i < 4; i++) {
      const tpl = BOUNTY_POOL[(this.rotationOffset + i) % BOUNTY_POOL.length];
      this.bounties.push({
        ...tpl,
        accepted: i < 2, // First two contracts pre-accepted for seamless instant rewards!
        progress: 0,
        claimed: false,
      });
    }
  }

  _bindEvents() {
    if (!this.events) return;
    const eventsToWatch = [
      'enemy:defeat',
      'fishing:catch',
      'trial:completed',
      'combat:reaction',
      'worldevent:complete',
      'interior:enter',
    ];
    for (const evName of eventsToWatch) {
      this.events.on(evName, () => this._recordEvent(evName));
    }
  }

  _recordEvent(evName) {
    for (const b of this.bounties) {
      if (!b.accepted || b.claimed || b.event !== evName) continue;
      if (b.progress < b.target) {
        b.progress += 1;
        if (b.progress >= b.target) {
          this.events?.emit('toast', {
            title: `✦ Guild Bounty Ready: ${b.title}`,
            text: 'Claim your Sunshards & Regional Trust on the Guild Board [N]!',
          });
        }
      }
    }
  }

  accept(bountyId) {
    const b = this.bounties.find((x) => x.id === bountyId);
    if (!b || b.claimed) return false;
    b.accepted = true;
    this.events?.emit('toast', { title: `Bounty Accepted: ${b.title}`, text: b.description });
    return true;
  }

  claim(bountyId) {
    const b = this.bounties.find((x) => x.id === bountyId);
    if (!b || !b.accepted || b.claimed || b.progress < b.target) return false;
    b.claimed = true;
    this.completedCount += 1;
    this.inventory?.addGold?.(b.gold);
    this.progression?.addXP?.(b.xp, `Guild Bounty: ${b.title}`);
    this.journal?.addReputation?.(b.factionId, b.rep);
    this.events?.emit('bounty:claimed', { bounty: b, completedCount: this.completedCount });
    this.events?.emit('toast', {
      title: `★ Bounty Claimed: ${b.title}`,
      text: `+${b.gold} ✦ Sunshards · +${b.xp} XP · +${b.rep} Trust`,
    });
    return true;
  }

  refreshBoard() {
    this.rotationOffset = (this.rotationOffset + 2) % BOUNTY_POOL.length;
    this._generateBoard();
    this.events?.emit('toast', {
      title: 'Crossroads Bounty Board Refreshed',
      text: 'New regional Guild contracts posted!',
    });
  }

  serialize() {
    return {
      completedCount: this.completedCount,
      rotationOffset: this.rotationOffset,
      bounties: this.bounties.map((b) => ({
        id: b.id,
        accepted: b.accepted,
        progress: b.progress,
        claimed: b.claimed,
      })),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.completedCount = data.completedCount || 0;
    this.rotationOffset = data.rotationOffset || 0;
    this._generateBoard();
    if (Array.isArray(data.bounties)) {
      for (const saved of data.bounties) {
        const b = this.bounties.find((x) => x.id === saved.id);
        if (b) {
          b.accepted = Boolean(saved.accepted);
          b.progress = saved.progress || 0;
          b.claimed = Boolean(saved.claimed);
        }
      }
    }
  }
}
