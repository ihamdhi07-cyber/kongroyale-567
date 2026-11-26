// Minimalist Painterly Adventure HUD:
// Vital bars (Health, Stamina, Warmth), Regional Compass, Time & Weather, Tracked Quest,
// Quick Corner Menu Icons, Contextual Interact Prompt, 2.5D Camera Presets, Discovery Banner & Toasts.
export class HUD {
  constructor(game) {
    this.game = game;
    this._bannerTimer = 0;
    this._buildDOM();
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.id = 'game-hud';
    this.root.className = 'hud-root hidden';
    this.root.innerHTML = `
      <!-- Top Left: Wayfarer Vitals -->
      <div class="hud-vitals">
        <div class="hud-level-badge" id="hud-level">Lv.1</div>
        <div class="hud-bars">
          <div class="bar-row"><span class="bar-lbl">HP</span><div class="bar-track"><div class="bar-fill bar-hp" id="bar-hp"></div></div><span class="bar-val" id="val-hp">100</span></div>
          <div class="bar-row"><span class="bar-lbl">SP</span><div class="bar-track"><div class="bar-fill bar-sp" id="bar-sp"></div></div><span class="bar-val" id="val-sp">100</span></div>
          <div class="bar-row"><span class="bar-lbl">Warm</span><div class="bar-track"><div class="bar-fill bar-wm" id="bar-wm"></div></div><span class="bar-val" id="val-wm">100</span></div>
        </div>
      </div>

      <!-- Top Center: Region Compass & Atmospheric Clock -->
      <div class="hud-compass-wrap">
        <div class="hud-region-line">
          <span class="hud-region-name" id="hud-region">Verdant Valley</span>
          <span class="hud-meta-pill" id="hud-time">09:24 · Clear</span>
        </div>
        <div class="hud-compass-bar" id="hud-compass">N · 0m, 332m</div>
      </div>

      <!-- Top Right: Navigation Buttons + Tracked Quest -->
      <div class="hud-right">
        <div class="hud-nav-row">
          <button class="hud-icon-btn" data-modal="map" title="World Map [M]" type="button">Map</button>
          <button class="hud-icon-btn" data-modal="inventory" title="Inventory &amp; Craft [I]" type="button">Bag</button>
          <button class="hud-icon-btn" data-modal="quests" title="Quest Journal [T]" type="button">Quests</button>
          <button class="hud-icon-btn" data-modal="progression" title="Skills &amp; Codex [P]" type="button">Skills</button>
          <button class="hud-icon-btn" data-modal="pause" title="Pause / Save [Esc]" type="button">Menu</button>
        </div>
        <div class="hud-quest-box" id="hud-quest-box">
          <div class="hud-quest-title" id="hud-quest-title">Echoes of the Unknown Gate</div>
          <div class="hud-quest-obj" id="hud-quest-obj">Speak with Elder Maren</div>
        </div>
        <div class="hud-telemetry hidden" id="hud-telemetry">60 FPS · 25 chunks</div>
      </div>

      <!-- Bottom Center: Contextual Interact Prompt + 2.5D Camera Preset Switcher -->
      <div class="hud-bottom">
        <div class="hud-interact-pill hidden" id="hud-interact">
          <span class="keycap">E</span>
          <span id="hud-interact-text">Interact</span>
        </div>
        <div class="hud-cam-strip">
          <button class="cam-pill" data-cam="close" type="button" title="Close Adventure View">Close</button>
          <button class="cam-pill active" data-cam="default" type="button" title="Balanced 2.5D Adventure">2.5D</button>
          <button class="cam-pill" data-cam="isometric" type="button" title="High Isometric 2.5D">Iso</button>
          <button class="cam-pill" id="btn-cam-zoom-in" type="button" title="Zoom In">+</button>
          <button class="cam-pill" id="btn-cam-zoom-out" type="button" title="Zoom Out">−</button>
        </div>
      </div>

      <!-- Discovery Banner -->
      <div class="discovery-banner hidden" id="discovery-banner">
        <div class="discovery-sub" id="discovery-sub">New Location Discovered</div>
        <div class="discovery-title" id="discovery-title">The Ancient Heart Tree</div>
      </div>

      <!-- Toast Stack -->
      <div class="toast-stack" id="toast-stack"></div>

      <!-- Gentle Portrait Hint for narrow phones (dismissible, never breaks game) -->
      <div class="portrait-hint" id="portrait-hint">
        <span>Landscape orientation is recommended for the best 2.5D vista</span>
        <button id="dismiss-portrait" type="button">OK</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.hpBar = this.root.querySelector('#bar-hp');
    this.spBar = this.root.querySelector('#bar-sp');
    this.wmBar = this.root.querySelector('#bar-wm');
    this.hpVal = this.root.querySelector('#val-hp');
    this.spVal = this.root.querySelector('#val-sp');
    this.wmVal = this.root.querySelector('#val-wm');
    this.levelEl = this.root.querySelector('#hud-level');
    this.regionEl = this.root.querySelector('#hud-region');
    this.timeEl = this.root.querySelector('#hud-time');
    this.compassEl = this.root.querySelector('#hud-compass');
    this.questBox = this.root.querySelector('#hud-quest-box');
    this.questTitle = this.root.querySelector('#hud-quest-title');
    this.questObj = this.root.querySelector('#hud-quest-obj');
    this.interactEl = this.root.querySelector('#hud-interact');
    this.interactText = this.root.querySelector('#hud-interact-text');
    this.telemetryEl = this.root.querySelector('#hud-telemetry');
    this.bannerEl = this.root.querySelector('#discovery-banner');
    this.bannerSub = this.root.querySelector('#discovery-sub');
    this.bannerTitle = this.root.querySelector('#discovery-title');
    this.toastStack = this.root.querySelector('#toast-stack');

    for (const btn of this.root.querySelectorAll('.hud-icon-btn')) {
      btn.addEventListener('click', () => this.game.openModal(btn.dataset.modal));
    }
    for (const pill of this.root.querySelectorAll('.cam-pill[data-cam]')) {
      pill.addEventListener('click', () => {
        for (const p of this.root.querySelectorAll('.cam-pill[data-cam]')) p.classList.remove('active');
        pill.classList.add('active');
        this.game.cameraController.setPreset(pill.dataset.cam);
      });
    }
    this.root.querySelector('#btn-cam-zoom-in').addEventListener('click', () => {
      this.game.cameraController.targetDistance = Math.max(8.5, this.game.cameraController.targetDistance - 4);
    });
    this.root.querySelector('#btn-cam-zoom-out').addEventListener('click', () => {
      this.game.cameraController.targetDistance = Math.min(38, this.game.cameraController.targetDistance + 4);
    });
    this.interactEl.addEventListener('click', () => this.game.interaction.interact());
    this.root.querySelector('#dismiss-portrait').addEventListener('click', () => {
      this.root.querySelector('#portrait-hint').style.display = 'none';
    });
  }

  setVisible(show) {
    this.root.classList.toggle('hidden', !show);
  }

  setTelemetryVisible(show) {
    this.telemetryEl.classList.toggle('hidden', !show);
  }

  showDiscovery({ subtitle, title }) {
    this.bannerSub.textContent = subtitle || 'Discovery';
    this.bannerTitle.textContent = title;
    this.bannerEl.classList.remove('hidden');
    this._bannerTimer = 3.8;
  }

  showToast({ title, text }) {
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-text">${text}</div>`;
    this.toastStack.appendChild(el);
    setTimeout(() => el.classList.add('fade-out'), 3600);
    setTimeout(() => el.remove(), 4100);
  }

  update(dt) {
    const p = this.game.player;
    const w = this.game.world;

    this.hpBar.style.width = `${Math.round((p.hp / p.maxHp) * 100)}%`;
    this.spBar.style.width = `${Math.round((p.stamina / p.maxStamina) * 100)}%`;
    this.wmBar.style.width = `${Math.round((p.warmth / p.maxWarmth) * 100)}%`;
    this.hpVal.textContent = Math.round(p.hp);
    this.spVal.textContent = Math.round(p.stamina);
    this.wmVal.textContent = Math.round(p.warmth);
    this.levelEl.textContent = `Lv.${this.game.progression.level}`;

    this.regionEl.textContent = w.currentRegion?.name || 'Verdant Valley';
    const weatherLabel = w.weather.weather.charAt(0).toUpperCase() + w.weather.weather.slice(1);
    this.timeEl.textContent = `${w.weather.getTimeString()} · ${weatherLabel}`;

    // Compass heading + coordinates in metres
    const deg = (((-this.game.cameraController.yaw * 180) / Math.PI) % 360 + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const cardinal = dirs[Math.round(deg / 45) % 8];
    const px = Math.round(p.root.position.x);
    const pz = Math.round(p.root.position.z);
    const alt = Math.round(p.root.position.y);
    const modeTag = p.gliding ? ' · Gliding' : p.swimming ? ' · Swimming' : p.climbing ? ' · Climbing' : '';
    this.compassEl.textContent = `${cardinal} · ${px}m, ${pz}m · Elev ${alt}m${modeTag}`;

    // Active tracked quest summary
    const tracked = this.game.quests.getTrackedQuest();
    if (tracked) {
      this.questBox.classList.remove('hidden');
      this.questTitle.textContent = tracked.title;
      const nextObj = tracked.objectives.find((o) => (tracked.progress[o.id] || 0) < o.target);
      this.questObj.textContent = nextObj
        ? `${nextObj.text} (${tracked.progress[nextObj.id] || 0}/${nextObj.target})`
        : 'Completed!';
    } else {
      this.questBox.classList.add('hidden');
    }

    // Contextual Interact Prompt
    const target = this.game.interaction.currentTarget;
    if (target) {
      this.interactEl.classList.remove('hidden');
      this.interactText.textContent = target.label;
    } else {
      this.interactEl.classList.add('hidden');
    }
    this.game.input.touch.setInteractPrompt(target);

    // Performance & Chunk Streaming Telemetry
    if (!this.telemetryEl.classList.contains('hidden')) {
      const cStats = w.chunks.getStats();
      const rStats = this.game.renderer.getStats();
      this.telemetryEl.textContent = `${this.game.loop.fps} FPS (${this.game.loop.frameMs}ms) · Chunks ${cStats.total} (L0:${cStats.lod0}/L1:${cStats.lod1}/L2:${cStats.lod2}) · Draws ${rStats.calls}`;
    }

    if (this._bannerTimer > 0) {
      this._bannerTimer -= dt;
      if (this._bannerTimer <= 0) {
        this.bannerEl.classList.add('hidden');
      }
    }
  }
}
