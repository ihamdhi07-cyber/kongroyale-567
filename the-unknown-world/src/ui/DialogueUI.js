// NPC Dialogue, Lore Tablet Reader & Campfire Hearth Rest/Cook Interface.
export class DialogueUI {
  constructor(game) {
    this.game = game;
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
        <div class="dlg-options" id="dlg-options"></div>
      </div>
    `;
    document.body.appendChild(this.el);
    this.roleEl = this.el.querySelector('#dlg-role');
    this.nameEl = this.el.querySelector('#dlg-name');
    this.bodyEl = this.el.querySelector('#dlg-body');
    this.optsEl = this.el.querySelector('#dlg-options');
  }

  openNpc(npc) {
    this.roleEl.textContent = npc.role;
    this.nameEl.textContent = npc.name;
    this.bodyEl.textContent = npc.dialogue.greeting;
    this._renderOptions(npc.dialogue.options, () => this.game.closeAllModals());
    this.el.classList.remove('hidden');
  }

  openLore(title, text) {
    this.roleEl.textContent = 'ANCIENT STONE TABLET';
    this.nameEl.textContent = title;
    this.bodyEl.textContent = text;
    this.optsEl.innerHTML = `<button class="btn btn-primary" id="dlg-close-btn" type="button">Record in Chronicle</button>`;
    this.optsEl.querySelector('#dlg-close-btn').addEventListener('click', () => this.game.closeAllModals());
    this.el.classList.remove('hidden');
  }

  openCampfire() {
    this.roleEl.textContent = 'CROSSROADS HEARTH';
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

  _renderOptions(options, onClose) {
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
