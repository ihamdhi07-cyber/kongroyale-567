// Character Progression, Unlockable Wayfarer Skills & Discovered Lore Codex Screen.
import { SKILLS } from '../gameplay/ProgressionSystem.js';
import { LANDMARKS } from '../world/WorldSpec.js';

export class ProgressionUI {
  constructor(game) {
    this.game = game;
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'progression-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card wide-card">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">WAYFARER CHRONICLE</div>
            <h2 class="modal-title">Character, Skills &amp; Discoveries</h2>
          </div>
          <button class="modal-close" type="button">✕</button>
        </div>
        <div class="prog-summary" id="prog-summary"></div>
        <h3>Wayfarer Skills</h3>
        <div class="skill-grid" id="skill-grid"></div>
        <h3>Discovered Landmarks &amp; Lore</h3>
        <div class="lore-list" id="lore-list"></div>
      </div>
    `;
    document.body.appendChild(this.el);
    this.el.querySelector('.modal-close').addEventListener('click', () => this.game.closeAllModals());
  }

  open() {
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const pr = this.game.progression;
    const p = this.game.player;
    const nextXp = pr.xpForNextLevel();

    this.el.querySelector('#prog-summary').innerHTML = `
      <div class="stat-pill"><span>Level</span><strong>${pr.level}</strong></div>
      <div class="stat-pill"><span>Experience</span><strong>${pr.xp} / ${nextXp}</strong></div>
      <div class="stat-pill highlight"><span>Skill Points</span><strong>${pr.skillPoints}</strong></div>
      <div class="stat-pill"><span>Attack / Def</span><strong>${p.attackPower} / ${p.defense}</strong></div>
      <div class="stat-pill"><span>Explored</span><strong>${this.game.exploration.getExplorationPercent()}%</strong></div>
      <div class="stat-pill"><span>Puzzles Solved</span><strong>${pr.stats.puzzlesSolved} / 3</strong></div>
    `;

    const sGrid = this.el.querySelector('#skill-grid');
    sGrid.innerHTML = SKILLS.map((s) => {
      const unlocked = pr.unlockedSkills.has(s.id);
      const canBuy = !unlocked && pr.skillPoints >= s.cost;
      return `
        <div class="skill-card ${unlocked ? 'unlocked' : ''}">
          <div class="skill-head">
            <strong>${s.name}</strong>
            <span class="skill-tag">${unlocked ? 'Unlocked' : `${s.cost} pt`}</span>
          </div>
          <p>${s.description}</p>
          ${
            unlocked
              ? ''
              : `<button class="btn-mini" data-skill="${s.id}" ${canBuy ? '' : 'disabled'} type="button">Unlock Skill</button>`
          }
        </div>
      `;
    }).join('');

    for (const btn of sGrid.querySelectorAll('[data-skill]')) {
      btn.addEventListener('click', () => {
        if (pr.unlockSkill(btn.dataset.skill, this.game.inventory, this.game.player)) {
          this.game.audio.playDiscoveryFanfare();
          this.render();
        }
      });
    }

    const lEl = this.el.querySelector('#lore-list');
    const discovered = LANDMARKS.filter((lm) => this.game.exploration.discoveredLandmarks.has(lm.id));
    lEl.innerHTML = discovered
      .map(
        (lm) => `
      <div class="lore-card">
        <strong>◆ ${lm.name}</strong>
        <p>${lm.lore}</p>
      </div>
    `
      )
      .join('');
  }
}
