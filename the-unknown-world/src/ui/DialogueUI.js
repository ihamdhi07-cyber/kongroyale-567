// NPC Dialogue, Caravan Trading Post (Buy & Sell with Sunshards), Lore Tablet Reader,
// Campfire Hearth Rest/Cook Interface, and Unknown Gate Awakening Climax Celebration.
export class DialogueUI {
  constructor(game) {
    this.game = game;
    this._currentNpc = null;
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'dialogue-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card dialogue-card">
        <div class="modal-eyebrow" id="dlg-role">NPC</div>
        <h2 class="modal-title" id="dlg-name">Elder Maren</h2>
        <p class="dlg-body" id="dlg-body"></p>
        <div id="dlg-shop" class="shop-pane hidden"></div>
        <div class="dlg-options" id="dlg-options"></div>
      </div>
    `;
    document.body.appendChild(this.el);
    this.roleEl = this.el.querySelector('#dlg-role');
    this.nameEl = this.el.querySelector('#dlg-name');
    this.bodyEl = this.el.querySelector('#dlg-body');
    this.shopEl = this.el.querySelector('#dlg-shop');
    this.optsEl = this.el.querySelector('#dlg-options');
  }

  openNpc(npc) {
    this._currentNpc = npc;
    this.shopEl.classList.add('hidden');
    this.roleEl.textContent = npc.role;
    this.nameEl.textContent = npc.name;
    this.bodyEl.textContent = npc.dialogue.greeting;
    this._renderOptions(npc, npc.dialogue.options, () => this.game.closeAllModals());
    this.el.classList.remove('hidden');
  }

  openShop(npc) {
    const inv = this.game.inventory;
    this.shopEl.classList.remove('hidden');

    const buyHtml = (npc.shop || [])
      .map((entry) => {
        const def = inv.getDef(entry.itemId);
        if (!def) return '';
        const canAfford = inv.gold >= entry.price;
        return `
          <div class="shop-row">
            <div>
              <strong>${def.name}</strong>
              <div class="slot-meta">${def.description}</div>
            </div>
            <button class="btn-mini" data-buy="${entry.itemId}" data-price="${entry.price}" ${canAfford ? '' : 'disabled'} type="button">
              Buy · ${entry.price} ✦
            </button>
          </div>
        `;
      })
      .join('');

    const sellable = inv
      .list({ category: 'all' })
      .filter((it) => it.value > 0 && !(it.isEquipped && it.qty <= 1));

    const sellHtml =
      sellable.length === 0
        ? `<div class="empty-note">No surplus items to sell. Gather materials or hunt relics!</div>`
        : sellable
            .slice(0, 8)
            .map((it) => {
              const payout = Math.max(1, Math.round(it.value * 0.6));
              return `
                <div class="shop-row">
                  <div><strong>${it.name}</strong> <span class="slot-meta">(×${it.qty})</span></div>
                  <button class="btn-mini" data-sell="${it.id}" type="button">Sell +${payout} ✦</button>
                </div>
              `;
            })
            .join('');

    this.shopEl.innerHTML = `
      <div class="shop-balance">Your Purse: <strong>${inv.gold} ✦ Sunshards</strong></div>
      <h4>Wares for Purchase</h4>
      <div class="shop-list">${buyHtml}</div>
      <h4>Sell Surplus Forage &amp; Relics</h4>
      <div class="shop-list">${sellHtml}</div>
    `;

    for (const btn of this.shopEl.querySelectorAll('[data-buy]')) {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buy;
        const price = Number(btn.dataset.price);
        if (inv.buyItem(id, price, 1)) {
          this.game.audio.playPickup();
          this.game.hud.showToast({ title: 'Purchased', text: `${inv.getDef(id)?.name || id} (-${price} Sunshards)` });
          this.openShop(npc);
        }
      });
    }
    for (const btn of this.shopEl.querySelectorAll('[data-sell]')) {
      btn.addEventListener('click', () => {
        const id = btn.dataset.sell;
        const payout = inv.sellItem(id, 1);
        if (payout) {
          this.game.audio.playPickup();
          this.game.hud.showToast({ title: 'Sold', text: `+${payout} Sunshards earned` });
          this.openShop(npc);
        }
      });
    }
  }

  openLore(title, text) {
    this.shopEl.classList.add('hidden');
    this.roleEl.textContent = 'ANCIENT STONE TABLET';
    this.nameEl.textContent = title;
    this.bodyEl.textContent = text;
    this.optsEl.innerHTML = `<button class="btn btn-primary" id="dlg-close-btn" type="button">Record in Chronicle</button>`;
    this.optsEl.querySelector('#dlg-close-btn').addEventListener('click', () => this.game.closeAllModals());
    this.el.classList.remove('hidden');
  }

  openGateClimax() {
    this.shopEl.classList.add('hidden');
    this.roleEl.textContent = 'THE UNKNOWN WORLD · EXPEDITION CHRONICLE';
    this.nameEl.textContent = 'The Unknown Gate Awakens!';
    this.bodyEl.textContent =
      'Harmonic gold and turquoise aurora spiral across the sky as the monumental stones of the Hidden Frontier awaken. Beyond the shimmering arch stretch 161 km² of uncharted Frostpeaks, Sunlit Archipelagos, and Whispering Wilds—ready for future expeditions. You may continue exploring every peak, harbor, sanctuary, and puzzle across the 8×8 km realm!';
    this.optsEl.innerHTML = `<button class="btn btn-primary" id="dlg-climax-btn" type="button">Continue Exploring the Realm</button>`;
    this.optsEl.querySelector('#dlg-climax-btn').addEventListener('click', () => this.game.closeAllModals());
    this.el.classList.remove('hidden');
  }

  openCampfire() {
    this.shopEl.classList.add('hidden');
    this.roleEl.textContent = 'EXPEDITION HEARTH';
    this.nameEl.textContent = 'Rest, Cook & Warm Up';
    this.bodyEl.textContent = `Current Time: ${this.game.world.weather.getTimeString()} · Resting restores full Health, Stamina, and Warmth and autosaves your journey.`;
    this.optsEl.innerHTML = `
      <button class="btn btn-primary" id="cf-rest" type="button">Rest Until Dawn / Recover Full Vitals</button>
      <button class="btn btn-secondary" id="cf-advance" type="button">Pass 6 Hours (See Golden Hour / Starlight)</button>
      <button class="btn btn-secondary" id="cf-cook" type="button">Open Cooking &amp; Crafting</button>
      <button class="btn btn-ghost" id="cf-leave" type="button">Step Away</button>
    `;
    this.optsEl.querySelector('#cf-rest').addEventListener('click', () => {
      this.game.player.heal(999);
      this.game.player.restoreStamina(999);
      this.game.player.restoreWarmth(999);
      this.game.world.weather.timeOfDay = 7.5;
      this.game.saveToSlot('autosave', true);
      this.game.audio.playDiscoveryFanfare();
      this.game.hud.showToast({ title: 'Rested by the Hearth', text: 'Vitals fully restored & expedition autosaved.' });
      this.game.closeAllModals();
    });
    this.optsEl.querySelector('#cf-advance').addEventListener('click', () => {
      this.game.world.weather.advanceTime(6);
      this.game.player.restoreWarmth(100);
      this.game.hud.showToast({
        title: 'Time Passed',
        text: `The sky shifts to ${this.game.world.weather.getTimeString()}.`,
      });
      this.game.closeAllModals();
    });
    this.optsEl.querySelector('#cf-cook').addEventListener('click', () => {
      this.game.closeAllModals();
      this.game.openModal('inventory', 'craft');
    });
    this.optsEl.querySelector('#cf-leave').addEventListener('click', () => this.game.closeAllModals());
    this.el.classList.remove('hidden');
  }

  _renderOptions(npc, options, onClose) {
    this.optsEl.innerHTML = '';
    for (const opt of options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary dlg-choice';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        if (opt.acceptQuest) {
          this.game.quests.startQuest(opt.acceptQuest);
        }
        if (opt.openShop && npc.shop) {
          this.openShop(npc);
        }
        this.bodyEl.textContent = opt.reply;
      });
      this.optsEl.appendChild(btn);
    }
    const bye = document.createElement('button');
    bye.type = 'button';
    bye.className = 'btn btn-ghost';
    bye.textContent = 'Farewell';
    bye.addEventListener('click', onClose);
    this.optsEl.appendChild(bye);
  }

  close() {
    this.el.classList.add('hidden');
  }
}
