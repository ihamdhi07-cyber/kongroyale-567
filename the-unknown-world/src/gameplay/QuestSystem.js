// Event-Driven Quest System supporting Main, Side, Discovery, and Hidden Quests.
export class QuestSystem {
  constructor(questDefs = [], inventory = null, progression = null, eventBus = null) {
    this.defs = new Map();
    for (const q of questDefs) this.defs.set(q.id, q);
    this.inventory = inventory;
    this.progression = progression;
    this.events = eventBus;

    this.active = new Map(); // questId -> { id, progress: { objId: count } }
    this.completed = new Set();
    this.trackedQuestId = null;

    for (const q of questDefs) {
      if (q.autoStart) this.startQuest(q.id, true);
    }
    if (this.active.size > 0) {
      this.trackedQuestId = this.active.keys().next().value;
    }

    if (this.events) {
      this._bindEvents();
    }
  }

  _bindEvents() {
    const eventNames = new Set();
    for (const q of this.defs.values()) {
      for (const obj of q.objectives) {
        eventNames.add(obj.event);
      }
    }
    for (const ev of eventNames) {
      this.events.on(ev, () => this.recordEvent(ev, 1));
    }
  }

  startQuest(questId, silent = false) {
    if (!this.defs.has(questId) || this.active.has(questId) || this.completed.has(questId)) {
      return false;
    }
    const def = this.defs.get(questId);
    const progress = {};
    for (const obj of def.objectives) progress[obj.id] = 0;
    this.active.set(questId, { id: questId, progress });
    if (!this.trackedQuestId) this.trackedQuestId = questId;
    if (!silent && this.events) {
      this.events.emit('quest:started', def);
      this.events.emit('toast', { title: 'Quest Accepted', text: def.title });
    }
    return true;
  }

  recordEvent(eventName, amount = 1) {
    let changed = false;
    for (const [qId, state] of [...this.active.entries()]) {
      const def = this.defs.get(qId);
      if (!def) continue;

      let allDone = true;
      for (const obj of def.objectives) {
        if (obj.event === eventName && state.progress[obj.id] < obj.target) {
          state.progress[obj.id] = Math.min(obj.target, state.progress[obj.id] + amount);
          changed = true;
        }
        if (state.progress[obj.id] < obj.target) allDone = false;
      }

      if (allDone) {
        this._completeQuest(qId);
        changed = true;
      }
    }
    if (changed && this.events) {
      this.events.emit('quest:updated');
    }
  }

  _completeQuest(questId) {
    const def = this.defs.get(questId);
    if (!def) return;
    this.active.delete(questId);
    this.completed.add(questId);
    if (this.trackedQuestId === questId) {
      this.trackedQuestId = this.active.size > 0 ? this.active.keys().next().value : null;
    }
    if (def.rewards) {
      if (def.rewards.xp && this.progression) {
        this.progression.addXP(def.rewards.xp, `Quest: ${def.title}`);
      }
      if (def.rewards.gold && this.inventory) {
        this.inventory.addGold(def.rewards.gold, true);
      }
      if (def.rewards.items && this.inventory) {
        for (const reward of def.rewards.items) {
          this.inventory.addItem(reward.itemId, reward.qty, true);
        }
      }
    }
    if (this.events) {
      this.events.emit('quest:completed', def);
      this.events.emit('toast', {
        title: 'Quest Completed!',
        text: `${def.title} (+${def.rewards?.xp || 0} XP${def.rewards?.gold ? `, +${def.rewards.gold} Sunshards` : ''})`,
      });
    }
    // Seamlessly unlock the climax main quest when Echoes of the Gate finishes
    if (questId === 'echoes-of-the-gate' && this.defs.has('awakening-the-horizon')) {
      this.startQuest('awakening-the-horizon');
    }
  }

  getTrackedQuest() {
    if (!this.trackedQuestId || !this.active.has(this.trackedQuestId)) return null;
    const def = this.defs.get(this.trackedQuestId);
    const state = this.active.get(this.trackedQuestId);
    return { ...def, progress: state.progress };
  }

  listAll() {
    const active = [];
    for (const [id, st] of this.active.entries()) {
      const def = this.defs.get(id);
      if (def) active.push({ ...def, status: 'active', progress: st.progress, tracked: this.trackedQuestId === id });
    }
    const completed = [];
    for (const id of this.completed) {
      const def = this.defs.get(id);
      if (def) completed.push({ ...def, status: 'completed' });
    }
    return { active, completed };
  }

  getSnapshot() {
    return {
      active: Object.fromEntries(this.active.entries()),
      completed: [...this.completed],
      trackedQuestId: this.trackedQuestId,
    };
  }

  loadSnapshot(snap) {
    if (!snap) return;
    this.active.clear();
    this.completed.clear();
    if (snap.active) {
      for (const [id, st] of Object.entries(snap.active)) {
        if (this.defs.has(id)) this.active.set(id, st);
      }
    }
    if (Array.isArray(snap.completed)) {
      for (const id of snap.completed) {
        if (this.defs.has(id)) this.completed.add(id);
      }
    }
    this.trackedQuestId = snap.trackedQuestId || (this.active.size > 0 ? this.active.keys().next().value : null);
    if (this.events) this.events.emit('quest:updated');
  }
}
