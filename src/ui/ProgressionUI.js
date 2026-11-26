// Character Progression & 3-Branch 18-Skill Wayfarer Tree Modal [P].
import { SKILLS, SKILL_BRANCHES } from '../gameplay/ProgressionSystem.js';

export class ProgressionUI {
  constructor(game) {
    this.game = game;
    this.activeBranch = 'all';

    this.el = document.createElement('div');
    this.el.id = 'progression-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">WAYFARER MASTERY · 3-BRANCH SKILL TREE</div>
            <h2 class="modal-title">Character &amp; Skills</h2>
            <p class="slot-meta" id="prog-summary">Level 1 · 2 Skill Points Available</p>
          </div>
          <button class="icon-btn" id="prog-close" type="button">✕</button>
        </div>
        <div class="prog-stats-row" id="prog-stats"></div>
        <div class="tab-row" id="prog-tabs">
          <button class="tab-btn active" data-branch="all" type="button">All 18 Skills</button>
          ${SKILL_BRANCHES.map((b) => `<button class="tab-btn" data-branch="${b.id}" type="button">${b.icon} ${b.name}</button>`).join('')}
        </div>
        <div class="skills-tree-grid" id="prog-skills"></div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('#prog-close').addEventListener('click', () => this.game.closeAllModals());
    this.el.querySelectorAll('#prog-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeBranch = btn.dataset.branch;
        this.el.querySelectorAll('#prog-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        this.render();
      });
    });
  }

  open() {
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const p = this.game.progression;
    const inv = this.game.inventory;
    const player = this.game.player;
    const eq = inv.getEquipmentBonuses ? inv.getEquipmentBonuses() : {};
    const bonuses = p.getBonuses();

    this.el.querySelector('#prog-summary').textContent =
      `Level ${p.level} · XP ${p.xp} / ${p.xpForNextLevel()} · ${p.skillPoints} Skill Point(s) Available · Unlocked ${p.unlockedSkills.size}/${SKILLS.length}`;

    this.el.querySelector('#prog-stats').innerHTML = `
      <div class="stat-chip"><span>Attack</span><strong>${player.attackPower}</strong></div>
      <div class="stat-chip"><span>Spell Power</span><strong>${(eq.spellBonus || 0) + (bonuses.spellPower || 0)}</strong></div>
      <div class="stat-chip"><span>Defense</span><strong>${player.defense}</strong></div>
      <div class="stat-chip"><span>Max HP</span><strong>${player.maxHp}</strong></div>
      <div class="stat-chip"><span>Max SP</span><strong>${player.maxStamina}</strong></div>
      <div class="stat-chip"><span>Warmth</span><strong>+${player.warmthBonus + (bonuses.warmthBonus || 0)}</strong></div>
    `;

    const visibleSkills = this.activeBranch === 'all' ? SKILLS : SKILLS.filter((s) => s.branch === this.activeBranch);
    const grid = this.el.querySelector('#prog-skills');
    grid.innerHTML = visibleSkills
      .map((s) => {
        const unlocked = p.unlockedSkills.has(s.id);
        const canBuy = !unlocked && p.skillPoints >= s.cost;
        const branchMeta = SKILL_BRANCHES.find((b) => b.id === s.branch) || SKILL_BRANCHES[0];
        return `
        <div class="skill-card ${unlocked ? 'skill-unlocked' : ''}">
          <div class="skill-card-head">
            <span class="skill-branch-tag" style="color:${branchMeta.color}">${branchMeta.icon} Tier ${s.tier || 1}</span>
            <span class="skill-cost">${unlocked ? 'ACTIVE' : `${s.cost} pt`}</span>
          </div>
          <h4>${s.name}</h4>
          <p>${s.description}</p>
          ${
            unlocked
              ? '<button class="btn-mini" disabled type="button">Unlocked</button>'
              : `<button class="btn-mini btn-accent" data-skill="${s.id}" ${canBuy ? '' : 'disabled'} type="button">Unlock (${s.cost} pt)</button>`
          }
        </div>`;
      })
      .join('');

    grid.querySelectorAll('button[data-skill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (p.unlockSkill(btn.dataset.skill, inv, player)) {
          this.game.audio.playPickup();
          this.render();
        }
      });
    });
  }
}
