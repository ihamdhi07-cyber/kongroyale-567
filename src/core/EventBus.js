// Lightweight typed-style EventBus for decoupled game systems (world, player, combat, quests, UI, audio).
export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    let set = this._listeners.get(event);
    if (!set) {
      set = new Set();
      this._listeners.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this._listeners.delete(event);
    }
  }

  emit(event, payload) {
    const set = this._listeners.get(event);
    if (set) {
      for (const fn of [...set]) {
        fn(payload);
      }
    }
    // Support wildcard prefix listeners e.g. 'landmark:discover' catching 'landmark:discover:ancient-heart-tree'
    const parts = event.split(':');
    if (parts.length > 2) {
      const parent = `${parts[0]}:${parts[1]}`;
      const pSet = this._listeners.get(parent);
      if (pSet) {
        for (const fn of [...pSet]) {
          fn(payload);
        }
      }
    }
  }

  clear() {
    this._listeners.clear();
  }
}
