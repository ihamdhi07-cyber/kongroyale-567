// Opening Screen, Main Menu & In-Game Pause Menu styled around the Anime Watercolor & Gouache identity.
export class MainMenu {
  constructor(game) {
    this.game = game;
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'main-menu';
    this.el.className = 'screen-overlay title-screen';
    this.el.innerHTML = `
      <div class="title-backdrop" style="background-image: url('./assets/ui/title-bg.jpg')"></div>
      <div class="title-scrim"></div>
      <div class="title-content">
        <div class="title-eyebrow">2.5D OPEN-WORLD EXPLORATION ADVENTURE · 8×8 KM REALM (15×15 KM ARCHITECTURE)</div>
        <h1 class="title-logo">THE UNKNOWN WORLD</h1>
        <p class="title-tagline">A living anime watercolor &amp; gouache continent of ancient forests, highland observatories, sunken archives, and drifting skies.</p>
        <div class="title-actions" id="title-actions">
          <button class="btn btn-primary hidden" id="btn-continue" type="button">Continue Journey</button>
          <button class="btn btn-primary" id="btn-new-game" type="button">Begin Expedition</button>
          <button class="btn btn-secondary" id="btn-load-saves" type="button">Save Slots &amp; Settings</button>
          <button class="btn btn-ghost" id="btn-controls-toggle" type="button">Controls Guide</button>
        </div>
        <div class="controls-card hidden" id="title-controls-card">
          <div class="controls-grid">
            <div><strong>WASD / Joystick</strong><span>Move &amp; Explore</span></div>
            <div><strong>Space (×2 Air)</strong><span>Jump &amp; Spirit Glider</span></div>
            <div><strong>Shift</strong><span>Sprint / Climb</span></div>
            <div><strong>E / Tap Button</strong><span>Interact / Gather / Talk</span></div>
            <div><strong>Left Click / J</strong><span>Staff Strike (Shift+Click: Heavy)</span></div>
            <div><strong>Ctrl / C · R-Click</strong><span>Dodge Roll · Shield Guard</span></div>
            <div><strong>R-Drag / Wheel / Q·X·R·F</strong><span>Adjust 2.5D Camera Angle &amp; Zoom</span></div>
            <div><strong>M · I · T · P · Esc</strong><span>World Map · Bag · Quests · Skills · Menu</span></div>
          </div>
        </div>
        <div class="title-footer">
          <span>Anime Watercolor &amp; Gouache 3D · Stylized PBR</span>
          <span>WebGL2 · Desktop &amp; Mobile Touch Ready</span>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);

    // Pause Overlay
    this.pauseEl = document.createElement('div');
    this.pauseEl.id = 'pause-menu';
    this.pauseEl.className = 'modal-overlay hidden';
    this.pauseEl.innerHTML = `
      <div class="modal-card pause-card">
        <div class="modal-eyebrow">EXPEDITION PAUSED</div>
        <h2 class="modal-title">The Unknown World</h2>
        <div class="pause-actions">
          <button class="btn btn-primary" id="btn-resume" type="button">Resume Exploring</button>
          <button class="btn btn-secondary" id="btn-quick-save" type="button">Quick Save (Slot 1)</button>
          <button class="btn btn-secondary" id="btn-open-map-pause" type="button">World Map [M]</button>
          <button class="btn btn-secondary" id="btn-open-settings-pause" type="button">Settings &amp; Save Slots</button>
          <button class="btn btn-ghost" id="btn-return-title" type="button">Return to Title Screen</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.pauseEl);

    this.continueBtn = this.el.querySelector('#btn-continue');
    this.el.querySelector('#btn-new-game').addEventListener('click', () => this.game.startNewGame());
    this.continueBtn.addEventListener('click', () => this.game.continueLatestSave());
    this.el.querySelector('#btn-load-saves').addEventListener('click', () => this.game.openModal('settings'));
    this.el.querySelector('#btn-controls-toggle').addEventListener('click', () => {
      this.el.querySelector('#title-controls-card').classList.toggle('hidden');
    });

    this.pauseEl.querySelector('#btn-resume').addEventListener('click', () => this.game.closeAllModals());
    this.pauseEl.querySelector('#btn-quick-save').addEventListener('click', () => this.game.saveToSlot('slot1'));
    this.pauseEl.querySelector('#btn-open-map-pause').addEventListener('click', () => this.game.openModal('map'));
    this.pauseEl.querySelector('#btn-open-settings-pause').addEventListener('click', () => this.game.openModal('settings'));
    this.pauseEl.querySelector('#btn-return-title').addEventListener('click', () => this.game.returnToTitle());
  }

  async refreshContinueState() {
    const slots = await this.game.saveManager.listSlots();
    const latest = slots.filter((s) => s.exists).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
    if (latest) {
      this.continueBtn.classList.remove('hidden');
      this.continueBtn.textContent = `Continue — ${latest.regionName || 'Verdant Valley'} (Lv.${latest.level || 1})`;
    } else {
      this.continueBtn.classList.add('hidden');
    }
  }

  showTitle() {
    this.el.classList.remove('hidden');
    this.pauseEl.classList.add('hidden');
    this.refreshContinueState();
  }

  hideTitle() {
    this.el.classList.add('hidden');
  }

  setPauseVisible(show) {
    this.pauseEl.classList.toggle('hidden', !show);
  }
}
