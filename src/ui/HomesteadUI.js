// Wayfarer's Homestead Builder, Boss Trophy Hall & Elemental Rune Anvil UI:
// Construct 8 visible 3D Homestead upgrades, harvest fresh herbs, claim Well-Rested buff,
// inspect defeated World Boss golden trophies, and infuse weapons with 4 Elemental Runes!
import { HOMESTEAD_UPGRADES } from '../world/HomesteadSystem.js';
import { WEAPON_RUNES } from '../gameplay/EnchantingSystem.js';

export class HomesteadUI {
  constructor(game) {
    this.game = game;
    this.activeTab = 'homestead';
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'homestead-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">CROSSROADS SANCTUARY &amp; RUNE FORGE</div>
            <h2 class="modal-title">Wayfarer's Homestead &amp; Enchanting</h2>
            <p class="slot-meta" id="home-summary">Upgrades Built: 0 / 8</p>
          </div>
          <button class="icon-btn" id="home-close" type="button">✕</button>
        </div>
        <div class="home-quick-bar" id="home-quick-bar">
          <button class="btn-mini btn-accent" id="btn-home-rest" type="button">✦ Rest at Homestead</button>
          <button class="btn-mini" id="btn-home-harvest" type="button">❀ Harvest Herb Garden</button>
          <span class="home-purse" id="home-purse">Purse: 0 ✦</span>
        </div>
        <div class="tab-row" id="home-tabs">
          <button class="tab-btn active" data-tab="homestead" type="button">Homestead Upgrades (8)</button>
          <button class="tab-btn" data-tab="runes" type="button">Elemental Rune Anvil (4)</button>
          <button class="tab-btn" data-tab="trophies" type="button">World Boss Trophy Hall (4)</button>
        </div>
        <div class="codex-body" id="home-body"></div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('#home-close').addEventListener('click', () => this.game.closeAllModals());
    this.el.querySelector('#btn-home-rest').addEventListener('click', () => {
      this.game.homestead.restAtHomestead(this.game.player);
      this.game.refreshPlayerStats();
      this.render();
    });
    this.el.querySelector('#btn-home-harvest').addEventListener('click', () => {
      this.game.homestead.harvestGarden(this.game.inventory);
      this.render();
    });
    this.el.querySelectorAll('#home-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.el.querySelectorAll('#home-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        this.render();
      });
    });
  }

  open(tab = 'homestead') {
    this.activeTab = tab;
    this.el.querySelectorAll('#home-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const hs = this.game.homestead;
    const inv = this.game.inventory;
    const ench = this.game.enchanting;

    const activeRune = ench.getActiveRune();
    this.el.querySelector('#home-summary').textContent =
      `Upgrades Built: ${hs.built.size}/${HOMESTEAD_UPGRADES.length} · Active Weapon Rune: ${activeRune ? `${activeRune.icon} ${activeRune.name}` : 'None'} · Well-Rested: ${hs.wellRested ? 'Active (+25 HP/SP)' : 'Inactive'}`;
    this.el.querySelector('#home-purse').textContent = `Purse: ${inv.gold} ✦ Sunshards`;

    const harvBtn = this.el.querySelector('#btn-home-harvest');
    harvBtn.disabled = !hs.built.has('herb-garden') || !hs.gardenReady;
    harvBtn.textContent = !hs.built.has('herb-garden')
      ? '❀ Build Garden First'
      : hs.gardenReady
        ? '❀ Harvest Herbs (+5)'
        : `❀ Growing (${Math.ceil(hs.gardenCooldown)}s)`;

    const body = this.el.querySelector('#home-body');

    if (this.activeTab === 'homestead') {
      body.innerHTML = `<div class="codex-grid">${HOMESTEAD_UPGRADES.map((u) => {
        const isBuilt = hs.built.has(u.id);
        const can = hs.canBuild(u.id, inv);
        const matStr = u.materials
          .map((m) => {
            const def = inv.getDef(m.id);
            const have = inv.getCount(m.id);
            return `<span class="${have >= m.qty ? 'ing-ok' : 'ing-miss'}">${def?.name || m.id} ${have}/${m.qty}</span>`;
          })
          .join(' · ');
        return `
          <div class="codex-card ${isBuilt ? 'unlocked' : ''}">
            <div class="codex-card-head">
              <strong>${u.icon} ${u.name}</strong>
              <span class="codex-pill">${isBuilt ? 'BUILT' : `${u.goldCost} ✦`}</span>
            </div>
            <div class="codex-desc">${u.bonusText}</div>
            <div class="codex-foot">
              <span class="slot-meta">${isBuilt ? 'Active on Homestead Grounds' : matStr}</span>
              ${
                isBuilt
                  ? `<span class="badge-ok">✓ Active</span>`
                  : `<button class="btn-mini btn-accent" data-build="${u.id}" ${can ? '' : 'disabled'} type="button">Construct</button>`
              }
            </div>
          </div>
        `;
      }).join('')}</div>`;

      body.querySelectorAll('[data-build]').forEach((btn) => {
        btn.addEventListener('click', () => {
          hs.buildUpgrade(btn.dataset.build, inv);
          this.game.refreshPlayerStats();
          this.render();
        });
      });
    } else if (this.activeTab === 'runes') {
      body.innerHTML = `
        <div class="rune-reaction-guide">
          <strong>Elemental Synergy Combos:</strong>
          <span>☀ Sunfire + ❄ Frost = <b>2.2× THERMAL SHATTER!</b></span>
          <span>≋ Wind + ☀ Burn = <b>1.8× WILDFIRE GALE!</b></span>
          <span>✦ Resonance + Parry Stagger = <b>2.0× ASTRAL OVERLOAD!</b></span>
        </div>
        <div class="codex-grid">${WEAPON_RUNES.map((r) => {
          const owned = ench.unlocked.has(r.id);
          const equipped = ench.activeRuneId === r.id;
          const can = ench.canUnlock(r.id);
          const matStr = r.materials
            .map((m) => {
              const def = inv.getDef(m.id);
              const have = inv.getCount(m.id);
              return `<span class="${have >= m.qty ? 'ing-ok' : 'ing-miss'}">${def?.name || m.id} ${have}/${m.qty}</span>`;
            })
            .join(' · ');
          return `
            <div class="codex-card ${equipped ? 'unlocked' : ''}">
              <div class="codex-card-head">
                <strong>${r.icon} ${r.name}</strong>
                <span class="codex-pill">${equipped ? 'INFUSED' : owned ? 'OWNED' : `${r.goldCost} ✦`}</span>
              </div>
              <div class="codex-desc">${r.description}</div>
              <div class="codex-foot">
                <span class="slot-meta">${owned ? 'Switch freely anytime' : matStr}</span>
                <button class="btn-mini ${equipped ? '' : 'btn-accent'}" data-rune="${r.id}" ${equipped || !can ? 'disabled' : ''} type="button">
                  ${equipped ? 'Active' : owned ? 'Equip Rune' : 'Forge & Infuse'}
                </button>
              </div>
            </div>
          `;
        }).join('')}</div>
      `;

      body.querySelectorAll('[data-rune]').forEach((btn) => {
        btn.addEventListener('click', () => {
          ench.unlockAndEquip(btn.dataset.rune, this.game.player);
          this.game.refreshPlayerStats();
          this.render();
        });
      });
    } else {
      const bosses = [
        { id: 'mossback-colossus', name: 'Mossback Colossus', region: 'Forgotten Kingdom · Silent Citadel', medal: 'Emerald Moss Crown' },
        { id: 'glacier-sovereign', name: 'Glacier Sovereign', region: 'Highland Reach · Borealis Terrace', medal: 'Aurora Antler Crest' },
        { id: 'elder-warden', name: 'Elder Stone Warden', region: 'Hidden Frontier · Unknown Gate Ring', medal: 'Sunstone Sentinel Seal' },
        { id: 'astral-leviathan', name: 'Astral Leviathan', region: 'Shattered Expanse · Astral Dais', medal: 'Celestial Starlight Halo' },
      ];
      body.innerHTML = `<div class="codex-grid">${bosses.map((b) => {
        const won = hs.bossTrophies.has(b.id);
        return `
          <div class="codex-card codex-boss ${won ? 'unlocked' : 'locked'}">
            <div class="codex-card-head">
              <strong>♛ ${b.name}</strong>
              <span class="codex-pill">${won ? 'DISPLAYED' : 'UNDEFEATED'}</span>
            </div>
            <div class="codex-sub">${b.region}</div>
            <div class="codex-desc">${won ? `Golden Trophy "${b.medal}" proudly displayed on your Homestead Pedestal!` : 'Defeat this Multi-Phase World Boss to claim its Golden Trophy.'}</div>
          </div>
        `;
      }).join('')}</div>`;
    }
  }
}
