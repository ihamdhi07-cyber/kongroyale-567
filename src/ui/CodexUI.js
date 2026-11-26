// Wayfarer's Codex UI [B]: Bestiary (14 Creatures & 4 World Bosses),
// 24 Achievements, Ancient Lore Archive, 4 Regional Factions (Shop Discounts), and World Completion %.
export class CodexUI {
  constructor(game) {
    this.game = game;
    this.activeTab = 'bestiary';

    this.el = document.createElement('div');
    this.el.id = 'codex-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">CHRONICLES OF THE REALM</div>
            <h2 class="modal-title">Wayfarer's Codex</h2>
            <p class="slot-meta" id="codex-summary">World Completion · 0%</p>
          </div>
          <button class="icon-btn" id="codex-close" type="button">✕</button>
        </div>
        <div class="tab-row" id="codex-tabs">
          <button class="tab-btn active" data-tab="bestiary" type="button">Bestiary (14)</button>
          <button class="tab-btn" data-tab="achievements" type="button">Achievements (24)</button>
          <button class="tab-btn" data-tab="lore" type="button">Lore Archive</button>
          <button class="tab-btn" data-tab="factions" type="button">Regional Trust</button>
        </div>
        <div class="codex-body" id="codex-body"></div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('#codex-close').addEventListener('click', () => this.game.closeAllModals());
    this.el.querySelectorAll('#codex-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.el.querySelectorAll('#codex-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        this.render();
      });
    });
  }

  open(tab = null) {
    if (tab) {
      this.activeTab = tab;
      this.el.querySelectorAll('#codex-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    }
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const j = this.game.journal;
    const pct = j.getCompletionPercent({
      exploration: this.game.exploration,
      puzzles: this.game.puzzles,
      quests: this.game.quests,
    });
    const achList = j.getAchievementsList();
    const unlockedAch = achList.filter((a) => a.unlocked).length;
    this.el.querySelector('#codex-summary').textContent =
      `World Completion: ${pct}% · Achievements: ${unlockedAch}/${achList.length} · Lore Recorded: ${j.unlockedLore.size} · Fish Species: ${this.game.fishing?.speciesCaught?.size || 0}/8`;

    const body = this.el.querySelector('#codex-body');
    if (this.activeTab === 'bestiary') {
      const list = j.getBestiaryList();
      body.innerHTML = `<div class="codex-grid">${list
        .map(
          (c) => `
        <div class="codex-card ${c.category === 'boss' ? 'codex-boss' : ''} ${c.discovered ? 'unlocked' : ''}">
          <div class="codex-card-head">
            <strong>${c.name}</strong>
            <span class="codex-pill">${c.category === 'boss' ? 'BOSS' : c.element || c.category}</span>
          </div>
          ${c.subtitle ? `<div class="codex-sub">${c.subtitle}</div>` : ''}
          <p class="codex-desc">${c.lore || 'Wild inhabitant of the Unknown World.'}</p>
          <div class="codex-meta">
            <span>HP ${c.maxHp} · Weak: <b>${c.weakness || 'none'}</b></span>
            <span>Defeated: <b>${c.kills}</b></span>
          </div>
        </div>`
        )
        .join('')}</div>`;
    } else if (this.activeTab === 'achievements') {
      body.innerHTML = `<div class="codex-grid">${achList
        .map(
          (a) => `
        <div class="codex-card ${a.unlocked ? 'unlocked' : 'locked'}">
          <div class="codex-card-head">
            <strong>${a.unlocked ? '★ ' : '☆ '}${a.title}</strong>
            <span class="codex-pill">${a.unlocked ? 'UNLOCKED' : `+${a.xp} XP · ${a.gold}✦`}</span>
          </div>
          <p class="codex-desc">${a.desc}</p>
        </div>`
        )
        .join('')}</div>`;
    } else if (this.activeTab === 'lore') {
      const lore = j.getLoreList();
      body.innerHTML = `<div class="codex-list">${lore
        .map(
          (l) => `
        <div class="codex-card ${l.unlocked ? 'unlocked' : 'locked'}">
          <div class="codex-card-head">
            <strong>${l.title}</strong>
            <span class="codex-pill">${l.region}</span>
          </div>
          <p class="codex-desc">${l.unlocked ? l.text : 'Explore this region, inspect ancient stone tablets, or enter its 3D sanctuary to uncover this chronicle.'}</p>
        </div>`
        )
        .join('')}</div>`;
    } else {
      const factions = j.getFactionsList();
      body.innerHTML = `<div class="codex-list">${factions
        .map((f) => {
          const barPct = Math.min(100, Math.round((f.rep / 200) * 100));
          return `
        <div class="codex-card unlocked">
          <div class="codex-card-head">
            <strong>${f.name}</strong>
            <span class="codex-pill">${f.rank}</span>
          </div>
          <div class="codex-sub">${f.region}</div>
          <div class="rep-bar"><div class="rep-fill" style="width:${barPct}%"></div></div>
          <div class="codex-meta"><span>Trust: ${f.rep} / 200</span><span>Higher trust lowers regional merchant prices</span></div>
        </div>`;
        })
        .join('')}</div>`;
    }
  }
}
