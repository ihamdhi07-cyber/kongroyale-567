// Responsive Inventory, Equipment, Cooking & Crafting Screen.
export class InventoryUI {
  constructor(game) {
    this.game = game;
    this.activeTab = 'bag';
    this.category = 'all';
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'inventory-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card wide-card">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">WAYFARER SATCHEL &amp; HEARTH</div>
            <h2 class="modal-title">Inventory &amp; Crafting</h2>
          </div>
          <button class="modal-close" type="button">✕</button>
        </div>
        <div class="tab-bar">
          <button class="tab-btn active" data-tab="bag" type="button">Satchel</button>
          <button class="tab-btn" data-tab="craft" type="button">Cooking &amp; Crafting</button>
        </div>
        <div id="inv-bag-pane">
          <div class="filter-row">
            <button class="pill-btn active" data-cat="all" type="button">All</button>
            <button class="pill-btn" data-cat="equipment" type="button">Equipment</button>
            <button class="pill-btn" data-cat="consumable" type="button">Consumables</button>
            <button class="pill-btn" data-cat="material" type="button">Materials</button>
            <button class="pill-btn" data-cat="quest" type="button">Relics</button>
          </div>
          <div class="item-grid" id="inv-item-grid"></div>
        </div>
        <div id="inv-craft-pane" class="hidden">
          <div class="recipe-list" id="inv-recipe-list"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('.modal-close').addEventListener('click', () => this.game.closeAllModals());
    for (const tb of this.el.querySelectorAll('.tab-btn')) {
      tb.addEventListener('click', () => {
        this.activeTab = tb.dataset.tab;
        for (const b of this.el.querySelectorAll('.tab-btn')) b.classList.toggle('active', b === tb);
        this.render();
      });
    }
    for (const fb of this.el.querySelectorAll('.pill-btn')) {
      fb.addEventListener('click', () => {
        this.category = fb.dataset.cat;
        for (const b of this.el.querySelectorAll('.pill-btn')) b.classList.toggle('active', b === fb);
        this.render();
      });
    }
  }

  open(tab = 'bag') {
    this.activeTab = tab;
    for (const b of this.el.querySelectorAll('.tab-btn')) b.classList.toggle('active', b.dataset.tab === tab);
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const bagPane = this.el.querySelector('#inv-bag-pane');
    const craftPane = this.el.querySelector('#inv-craft-pane');
    bagPane.classList.toggle('hidden', this.activeTab !== 'bag');
    craftPane.classList.toggle('hidden', this.activeTab !== 'craft');

    if (this.activeTab === 'bag') {
      const grid = this.el.querySelector('#inv-item-grid');
      const items = this.game.inventory.list({ category: this.category });
      if (items.length === 0) {
        grid.innerHTML = `<div class="empty-note">No items in this category yet. Gather resources across the continent!</div>`;
        return;
      }
      grid.innerHTML = items
        .map(
          (item) => `
          <div class="item-card rarity-${item.rarity}">
            <div class="item-head">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">×${item.qty}</span>
            </div>
            <div class="item-cat">${item.category}${item.isEquipped ? ' · Equipped' : ''}</div>
            <p class="item-desc">${item.description}</p>
            <div class="item-actions">
              ${
                item.category === 'equipment' && !item.isEquipped
                  ? `<button class="btn-mini" data-equip="${item.id}" type="button">Equip</button>`
                  : ''
              }
              ${
                item.effects
                  ? `<button class="btn-mini" data-use="${item.id}" type="button">Eat / Drink</button>`
                  : ''
              }
            </div>
          </div>
        `
        )
        .join('');

      for (const btn of grid.querySelectorAll('[data-equip]')) {
        btn.addEventListener('click', () => {
          this.game.inventory.equip(btn.dataset.equip, this.game.player);
          this.game.inventory.applyStatsToPlayer(this.game.player, this.game.progression.getBonuses());
          this.game.audio.playPickup();
          this.render();
        });
      }
      for (const btn of grid.querySelectorAll('[data-use]')) {
        btn.addEventListener('click', () => {
          this.game.inventory.useConsumable(btn.dataset.use, this.game.player);
          this.game.audio.playPickup();
          this.render();
        });
      }
    } else {
      const list = this.el.querySelector('#inv-recipe-list');
      const recipes = this.game.crafting.listRecipes();
      list.innerHTML = recipes
        .map(
          (r) => `
          <div class="recipe-row ${r.craftable ? 'ready' : 'locked'}">
            <div class="recipe-info">
              <div class="recipe-title">${r.result?.name || r.resultId} <span class="recipe-cat">${r.category}</span></div>
              <p class="recipe-desc">${r.result?.description || ''}</p>
              <div class="recipe-ings">
                ${r.ingredientsDetailed
                  .map(
                    (i) =>
                      `<span class="${i.have >= i.qty ? 'ing-ok' : 'ing-miss'}">${i.def?.name || i.itemId}: ${i.have}/${i.qty}</span>`
                  )
                  .join('')}
              </div>
            </div>
            <button class="btn-mini" data-craft="${r.id}" ${r.craftable ? '' : 'disabled'} type="button">Craft</button>
          </div>
        `
        )
        .join('');

      for (const btn of list.querySelectorAll('[data-craft]')) {
        btn.addEventListener('click', () => {
          if (this.game.crafting.craft(btn.dataset.craft)) {
            this.game.progression.stats.itemsCrafted++;
            this.game.audio.playDiscoveryFanfare();
            this.render();
          }
        });
      }
    }
  }
}
