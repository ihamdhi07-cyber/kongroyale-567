// Minimalist Painterly Adventure HUD:
// Vital bars (Health, Stamina, Warmth, Underwater Breath), Sunshards Purse, Stealth Indicator,
// Boss Health Bar, Regional Compass (+ Custom Waypoint Bearing), Time & Weather, Tracked Quest,
// Quick Corner Menu Icons, Contextual Interact Prompt, 2.5D Camera Presets + Photo Mode,
// 3D-Projected Floating Damage Popups, Discovery Banner & Toasts.
import * as THREE from 'three';

export class HUD {
  constructor(game) {
    this.game = game;
    this._bannerTimer = 0;
    this.photoMode = false;
    this._projTmp = new THREE.Vector3();
    this._buildDOM();
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.id = 'game-hud';
    this.root.className = 'hud-root hidden';
    this.root.innerHTML = `
      <!-- Top Left: Wayfarer Vitals & Status Pills -->
      <div class="hud-left-stack">
        <div class="hud-vitals">
          <div class="hud-level-badge" id="hud-level">Lv.1</div>
          <div class="hud-bars">
            <div class="bar-row"><span class="bar-lbl">HP</span><div class="bar-track"><div class="bar-fill bar-hp" id="bar-hp"></div></div><span class="bar-val" id="val-hp">100</span></div>
            <div class="bar-row"><span class="bar-lbl">SP</span><div class="bar-track"><div class="bar-fill bar-sp" id="bar-sp"></div></div><span class="bar-val" id="val-sp">100</span></div>
            <div class="bar-row"><span class="bar-lbl">Warm</span><div class="bar-track"><div class="bar-fill bar-wm" id="bar-wm"></div></div><span class="bar-val" id="val-wm">100</span></div>
            <div class="bar-row hidden" id="row-breath"><span class="bar-lbl">Air</span><div class="bar-track"><div class="bar-fill bar-air" id="bar-air"></div></div><span class="bar-val" id="val-air">100</span></div>
          </div>
        </div>
        <div class="hud-status-row">
          <span class="hud-gold-pill" id="hud-gold">60 ✦</span>
          <span class="hud-stealth-pill hidden" id="hud-stealth">◉ Stealth · 1.75× Ambush</span>
        </div>
      </div>

      <!-- Top Center: Region Compass, Atmospheric Clock & Boss Bar -->
      <div class="hud-center-stack">
        <div class="hud-compass-wrap">
          <div class="hud-region-line">
            <span class="hud-region-name" id="hud-region">Verdant Valley</span>
            <span class="hud-meta-pill" id="hud-time">09:24 · Clear</span>
          </div>
          <div class="hud-compass-bar" id="hud-compass">N · 0m, 332m</div>
        </div>
        <div class="hud-boss-bar hidden" id="hud-boss-bar">
          <div class="boss-name" id="boss-name">Elder Stone Warden</div>
          <div class="bar-track boss-track"><div class="bar-fill bar-boss" id="bar-boss"></div></div>
        </div>
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
          <button class="cam-pill" id="btn-photo-mode" type="button" title="Toggle Photo Framing [V]">Photo</button>
          <button class="cam-pill" id="btn-cam-zoom-in" type="button" title="Zoom In">+</button>
          <button class="cam-pill" id="btn-cam-zoom-out" type="button" title="Zoom Out">−</button>
        </div>
      </div>

      <!-- Floating Combat Damage Popups Layer -->
      <div class="dmg-layer" id="dmg-layer"></div>

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
    this.airRow = this.root.querySelector('#row-breath');
    this.airBar = this.root.querySelector('#bar-air');
    this.hpVal = this.root.querySelector('#val-hp');
    this.spVal = this.root.querySelector('#val-sp');
    this.wmVal = this.root.querySelector('#val-wm');
    this.airVal = this.root.querySelector('#val-air');
    this.levelEl = this.root.querySelector('#hud-level');
    this.goldEl = this.root.querySelector('#hud-gold');
    this.stealthEl = this.root.querySelector('#hud-stealth');
    this.regionEl = this.root.querySelector('#hud-region');
    this.timeEl = this.root.querySelector('#hud-time');
    this.compassEl = this.root.querySelector('#hud-compass');
    this.bossBarWrap = this.root.querySelector('#hud-boss-bar');
    this.bossNameEl = this.root.querySelector('#boss-name');
    this.bossFillEl = this.root.querySelector('#bar-boss');
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
    this.dmgLayer = this.root.querySelector('#dmg-layer');

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
    this.root.querySelector('#btn-photo-mode').addEventListener('click', () => this.togglePhotoMode());
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

  togglePhotoMode() {
    this.photoMode = !this.photoMode;
    this.root.classList.toggle('photo-mode', this.photoMode);
    if (this.photoMode) {
      this.game.cameraController.setPreset('photo');
      this.showToast({ title: 'Photo Framing Active', text: 'Press [V] or Photo again to restore full HUD.' });
    } else {
      this.game.cameraController.setPreset('default');
    }
  }

  spawnDamagePopup(worldPos, dmg, { isHeavy = false, isAmbush = false } = {}) {
    if (!worldPos || !this.game.cameraController) return;
    this._projTmp.copy(worldPos).project(this.game.cameraController.camera);
    if (this._projTmp.z > 1) return;
    const x = (this._projTmp.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this._projTmp.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `dmg-pop ${isAmbush ? 'dmg-ambush' : isHeavy ? 'dmg-heavy' : ''}`;
    el.textContent = isAmbush ? `AMBUSH ${dmg}!` : isHeavy ? `${dmg}!` : `${dmg}`;
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    this.dmgLayer.appendChild(el);
    setTimeout(() => el.remove(), 850);
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
    this.goldEl.textContent = `${this.game.inventory.gold} ✦`;

    // Underwater breath bar
    const showBreath = p.diving || p.breath < 99;
    this.airRow.classList.toggle('hidden', !showBreath);
    if (showBreath) {
      this.airBar.style.width = `${Math.round((p.breath / p.maxBreath) * 100)}%`;
      this.airVal.textContent = Math.round(p.breath);
    }

    // Stealth indicator
    this.stealthEl.classList.toggle('hidden', !p.stealth);

    // Region / Interior title + time & weather
    const inside = w.interiors?.currentInterior;
    this.regionEl.textContent = inside ? inside.name : w.currentRegion?.name || 'Verdant Valley';
    const weatherLabel = inside ? 'Sanctuary' : w.weather.weather.charAt(0).toUpperCase() + w.weather.weather.slice(1);
    this.timeEl.textContent = `${w.weather.getTimeString()} · ${weatherLabel}`;

    // Compass heading + mode + Custom Waypoint Distance/Bearing
    const deg = (((-this.game.cameraController.yaw * 180) / Math.PI) % 360 + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const cardinal = dirs[Math.round(deg / 45) % 8];
    const px = Math.round(p.root.position.x);
    const pz = Math.round(p.root.position.z);
    const alt = Math.round(p.root.position.y);
    const modeTag = p.sailing
      ? ' · Sailing'
      : p.diving
        ? ' · Diving'
        : p.gliding
          ? ' · Gliding'
          : p.swimming
            ? ' · Swimming'
            : p.climbing
              ? ' · Climbing'
              : p.stealth
                ? ' · Stealth'
                : '';

    let wpTag = '';
    if (this.game.waypoint && !inside) {
      const dx = this.game.waypoint.x - p.root.position.x;
      const dz = this.game.waypoint.z - p.root.position.z;
      const dist = Math.round(Math.hypot(dx, dz));
      const ang = ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
      const wpDir = dirs[Math.round(ang / 45) % 8];
      wpTag = ` · ◎ Pin ${wpDir} ${dist}m`;
    }
    this.compassEl.textContent = `${cardinal} · ${px}m, ${pz}m · Elev ${alt}m${modeTag}${wpTag}`;

    // Active Boss Health Bar
    const boss = !inside ? this.game.enemies.getActiveBoss(p.root.position) : null;
    if (boss) {
      this.bossBarWrap.classList.remove('hidden');
      this.bossNameEl.textContent = `${boss.def.name} (${Math.ceil(boss.hp)}/${boss.def.maxHp})`;
      this.bossFillEl.style.width = `${Math.max(2, Math.round((boss.hp / boss.def.maxHp) * 100))}%`;
    } else {
      this.bossBarWrap.classList.add('hidden');
    }

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
