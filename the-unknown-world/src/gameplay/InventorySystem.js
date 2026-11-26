// Data-Driven Inventory & Equipment System (categorized, filterable, sortable, serializable).
export class InventorySystem {
  constructor(itemDefs = [], eventBus = null) {
    this.defs = new Map();
    for (const def of itemDefs) {
      this.defs.set(def.id, def);
    }
    this.events = eventBus;
    this.items = new Map(); // itemId -> qty
    this.equipped = {
      weapon: 'wayfarer-staff',
      armor: 'traveler-cloak',
    };

    // Starting Wayfarer supplies
    this.addItem('wayfarer-staff', 1, true);
    this.addItem('traveler-cloak', 1, true);
    this.addItem('sunberry', 3, true);
    this.addItem('berry-stew', 1, true);
  }

  getDef(itemId) {
    return this.defs.get(itemId) || null;
  }

  getCount(itemId) {
    return this.items.get(itemId) || 0;
  }

  addItem(itemId, qty = 1, silent = false) {
    if (!this.defs.has(itemId) || qty <= 0) return false;
    const prev = this.items.get(itemId) || 0;
    this.items.set(itemId, prev + qty);
    if (!silent && this.events) {
      this.events.emit(`item:gather:${itemId}`, { itemId, qty, def: this.defs.get(itemId) });
      this.events.emit('inventory:changed', this.getSnapshot());
    }
    return true;
  }

  removeItem(itemId, qty = 1) {
    const prev = this.items.get(itemId) || 0;
    if (prev < qty) return false;
    const next = prev - qty;
    if (next <= 0) this.items.delete(itemId);
    else this.items.set(itemId, next);
    if (this.events) this.events.emit('inventory:changed', this.getSnapshot());
    return true;
  }

  list({ category = 'all', sortBy = 'name' } = {}) {
    const out = [];
    for (const [id, qty] of this.items.entries()) {
      const def = this.defs.get(id);
      if (!def) continue;
      if (category !== 'all' && def.category !== category) continue;
      out.push({
        ...def,
        qty,
        isEquipped: this.equipped.weapon === id || this.equipped.armor === id,
      });
    }
    if (sortBy === 'qty') out.sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
    else if (sortBy === 'category') out.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    else out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }

  equip(itemId, player = null) {
    const def = this.defs.get(itemId);
    if (!def || def.category !== 'equipment' || this.getCount(itemId) <= 0) return false;
    if (def.slot === 'weapon' || def.slot === 'armor') {
      this.equipped[def.slot] = itemId;
      if (player) this.applyStatsToPlayer(player);
      if (this.events) this.events.emit('inventory:changed', this.getSnapshot());
      return true;
    }
    return false;
  }

  useConsumable(itemId, player) {
    const def = this.defs.get(itemId);
    if (!def || !def.effects || this.getCount(itemId) <= 0) return false;
    if (def.effects.heal) player.heal(def.effects.heal);
    if (def.effects.stamina) player.restoreStamina(def.effects.stamina);
    if (def.effects.warmth) player.restoreWarmth(def.effects.warmth);
    this.removeItem(itemId, 1);
    if (this.events) this.events.emit('item:used', { itemId, def });
    return true;
  }

  applyStatsToPlayer(player, skillBonuses = {}) {
    const wDef = this.defs.get(this.equipped.weapon);
    const aDef = this.defs.get(this.equipped.armor);
    player.attackPower = (wDef?.stats?.attack || 16) + (skillBonuses.attack || 0);
    player.heavyMultiplier = (wDef?.stats?.heavyMultiplier || 1.85) + (skillBonuses.heavyBonus || 0);
    player.defense = (aDef?.stats?.defense || 5) + (skillBonuses.defense || 0);
    player.maxHp = 100 + (skillBonuses.maxHp || 0);
    player.maxStamina = (aDef?.stats?.maxStamina || 100) + (skillBonuses.maxStamina || 0);
    player.glideEfficiency = (aDef?.stats?.glideEfficiency || 1.0) * (skillBonuses.glideMult || 1.0);
    player.speedMultiplier = 1.0 + (skillBonuses.speedBonus || 0);
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    if (player.stamina > player.maxStamina) player.stamina = player.maxStamina;
    if (player.applyEquipmentVisuals) player.applyEquipmentVisuals(this.equipped);
  }

  getSnapshot() {
    return {
      items: Object.fromEntries(this.items.entries()),
      equipped: { ...this.equipped },
    };
  }

  loadSnapshot(snap, player = null, skillBonuses = {}) {
    if (!snap) return;
    this.items.clear();
    if (snap.items) {
      for (const [id, qty] of Object.entries(snap.items)) {
        if (this.defs.has(id) && qty > 0) this.items.set(id, qty);
      }
    }
    if (snap.equipped) {
      this.equipped.weapon = snap.equipped.weapon || 'wayfarer-staff';
      this.equipped.armor = snap.equipped.armor || 'traveler-cloak';
    }
    if (player) this.applyStatsToPlayer(player, skillBonuses);
    if (this.events) this.events.emit('inventory:changed', this.getSnapshot());
  }
}
