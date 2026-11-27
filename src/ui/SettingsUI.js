// Settings, Graphics Presets (Low/Medium/High/Ultra) + Manual Visual & Camera Fine-Tuning,
// Audio Mixer, Atmosphere Preview, Touch Controls Toggle, and Persistent Multi-Slot IndexedDB Save / Load Manager.
import { QUALITY_PRESETS } from '../core/Renderer.js';

export class SettingsUI {
  constructor(game) {
    this.game = game;
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'settings-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card wide-card">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">SYSTEM &amp; EXPEDITION ARCHIVE</div>
            <h2 class="modal-title">Settings &amp; Save Slots</h2>
          </div>
          <button class="modal-close" type="button">✕</button>
        </div>

        <div class="settings-grid">
          <section class="settings-col">
            <h3>Graphics Presets &amp; Manual Tuning</h3>
            <label class="field-row">
              <span>Graphics Preset</span>
              <select id="set-quality">
                ${Object.entries(QUALITY_PRESETS)
                  .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
                  .join('')}
              </select>
            </label>
            <label class="field-row">
              <span>Render Scale (<span id="lbl-rscale">100%</span>)</span>
              <input type="range" id="set-rscale" min="0.5" max="1.5" step="0.1" />
            </label>
            <label class="field-row">
              <span>Dynamic Shadows</span>
              <select id="set-shadows">
                <option value="preset">Match Preset</option>
                <option value="on">Force On</option>
                <option value="off">Off (Max FPS)</option>
              </select>
            </label>
            <label class="field-row">
              <span>Painterly Selective Bloom (HDR)</span>
              <input type="checkbox" id="set-bloom" />
            </label>
            <label class="field-row">
              <span>Camera FOV (<span id="lbl-fov">42°</span>)</span>
              <input type="range" id="set-fov" min="34" max="62" step="2" />
            </label>
            <label class="field-row">
              <span>Invert Camera Pitch (Y)</span>
              <input type="checkbox" id="set-inverty" />
            </label>
            <label class="field-row">
              <span>Weather Simulation</span>
              <select id="set-weather">
                <option value="auto">Dynamic Auto</option>
                <option value="clear">Clear Sunlight</option>
                <option value="clouds">Drifting Clouds</option>
                <option value="mist">Golden Valley Mist</option>
                <option value="rain">Painterly Rain</option>
                <option value="snow">Highland Snow</option>
              </select>
            </label>
            <label class="field-row">
              <span>Touch Controls</span>
              <select id="set-touch">
                <option value="auto">Auto (Mobile/Tablet)</option>
                <option value="on">Always Show</option>
                <option value="off">Always Hide</option>
              </select>
            </label>
            <label class="field-row">
              <span>Performance Telemetry (FPS &amp; Chunks)</span>
              <input type="checkbox" id="set-fps" />
            </label>

            <h3>Audio Mixer</h3>
            <label class="field-row"><span>Master Volume</span><input type="range" id="vol-master" min="0" max="1" step="0.05" /></label>
            <label class="field-row"><span>Regional Music</span><input type="range" id="vol-music" min="0" max="1" step="0.05" /></label>
            <label class="field-row"><span>Sound Effects</span><input type="range" id="vol-sfx" min="0" max="1" step="0.05" /></label>
            <label class="field-row"><span>Ambience</span><input type="range" id="vol-ambient" min="0" max="1" step="0.05" /></label>
            <label class="field-row"><span>Mute All Audio</span><input type="checkbox" id="vol-mute" /></label>
          </section>

          <section class="settings-col">
            <h3>Local Save Slots (IndexedDB)</h3>
            <p class="map-hint">Save or restore your position across the 8×8 km world, boats, sanctuaries, Sunshards, inventory, skills, quests, all 8 puzzles, and fog-of-war discoveries.</p>
            <div id="save-slot-list" class="save-slot-list"></div>
          </section>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('.modal-close').addEventListener('click', () => this.game.closeAllModals());

    const bind = (id, ev, fn) => this.el.querySelector(id).addEventListener(ev, fn);
    bind('#set-quality', 'change', (e) => this.game.setQuality(e.target.value));
    bind('#set-rscale', 'input', (e) => {
      const val = Number(e.target.value);
      this.el.querySelector('#lbl-rscale').textContent = `${Math.round(val * 100)}%`;
      this.game.setManualVisuals({ renderScale: val });
    });
    bind('#set-shadows', 'change', (e) => this.game.setManualVisuals({ shadowOverride: e.target.value }));
    bind('#set-bloom', 'change', (e) => this.game.setManualVisuals({ bloom: e.target.checked }));
    bind('#set-fov', 'input', (e) => {
      const val = Number(e.target.value);
      this.el.querySelector('#lbl-fov').textContent = `${val}°`;
      this.game.setManualVisuals({ fov: val });
    });
    bind('#set-inverty', 'change', (e) => this.game.setManualVisuals({ invertY: e.target.checked }));
    bind('#set-weather', 'change', (e) => this.game.world.weather.setWeather(e.target.value));
    bind('#set-touch', 'change', (e) => this.game.setTouchMode(e.target.value));
    bind('#set-fps', 'change', (e) => this.game.setTelemetry(e.target.checked));

    const syncAudio = () => {
      this.game.setAudioSettings({
        master: Number(this.el.querySelector('#vol-master').value),
        music: Number(this.el.querySelector('#vol-music').value),
        sfx: Number(this.el.querySelector('#vol-sfx').value),
        ambient: Number(this.el.querySelector('#vol-ambient').value),
        muted: this.el.querySelector('#vol-mute').checked,
      });
    };
    for (const id of ['#vol-master', '#vol-music', '#vol-sfx', '#vol-ambient', '#vol-mute']) {
      bind(id, 'input', syncAudio);
      bind(id, 'change', syncAudio);
    }
  }

  async open() {
    const s = this.game.settings;
    this.el.querySelector('#set-quality').value = this.game.renderer.quality;
    this.el.querySelector('#set-rscale').value = s.renderScale ?? 1.0;
    this.el.querySelector('#lbl-rscale').textContent = `${Math.round((s.renderScale ?? 1.0) * 100)}%`;
    this.el.querySelector('#set-shadows').value = s.shadowOverride || 'preset';
    this.el.querySelector('#set-bloom').checked = s.bloom !== false;
    this.el.querySelector('#set-fov').value = s.fov ?? 42;
    this.el.querySelector('#lbl-fov').textContent = `${s.fov ?? 42}°`;
    this.el.querySelector('#set-inverty').checked = Boolean(s.invertY);
    this.el.querySelector('#set-touch').value = s.touchControls || 'auto';
    this.el.querySelector('#set-fps').checked = Boolean(s.showFps);
    this.el.querySelector('#vol-master').value = s.masterVol;
    this.el.querySelector('#vol-music').value = s.musicVol;
    this.el.querySelector('#vol-sfx').value = s.sfxVol;
    this.el.querySelector('#vol-ambient').value = s.ambientVol;
    this.el.querySelector('#vol-mute').checked = Boolean(s.muted);

    await this.renderSlots();
    this.el.classList.remove('hidden');
  }

  close() {
    this.el.classList.add('hidden');
  }

  async renderSlots() {
    const slots = await this.game.saveManager.listSlots();
    const list = this.el.querySelector('#save-slot-list');
    const inGame = this.game.started;
    list.innerHTML = slots
      .map((sl) => {
        const label = sl.slotId === 'autosave' ? 'Auto-Save' : `Save Slot ${sl.slotId.replace('slot', '')}`;
        const meta = sl.exists
          ? `${sl.regionName || 'Verdant Valley'} · Lv.${sl.level || 1} · ${sl.explorationPct ?? 0}% charted · ${new Date(sl.savedAt).toLocaleString()}`
          : 'Empty Slot';
        return `
          <div class="save-slot-row">
            <div>
              <strong>${label}</strong>
              <div class="slot-meta">${meta}</div>
            </div>
            <div class="slot-btns">
              ${inGame && sl.slotId !== 'autosave' ? `<button class="btn-mini" data-save="${sl.slotId}" type="button">Save</button>` : ''}
              ${sl.exists ? `<button class="btn-mini" data-load="${sl.slotId}" type="button">Load</button>` : ''}
              ${sl.exists ? `<button class="btn-mini danger" data-del="${sl.slotId}" type="button">Del</button>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    for (const btn of list.querySelectorAll('[data-save]')) {
      btn.addEventListener('click', async () => {
        await this.game.saveToSlot(btn.dataset.save);
        await this.renderSlots();
      });
    }
    for (const btn of list.querySelectorAll('[data-load]')) {
      btn.addEventListener('click', async () => {
        await this.game.loadFromSlot(btn.dataset.load);
      });
    }
    for (const btn of list.querySelectorAll('[data-del]')) {
      btn.addEventListener('click', async () => {
        await this.game.saveManager.deleteSlot(btn.dataset.del);
        await this.renderSlots();
      });
    }
  }
}
