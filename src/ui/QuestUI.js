// Quest Journal Screen (Active & Completed Main/Side/Discovery Quests with Tracking toggle).
export class QuestUI {
  constructor(game) {
    this.game = game;
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'quest-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card wide-card">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">EXPEDITION JOURNAL</div>
            <h2 class="modal-title">Quests &amp; Mysteries</h2>
          </div>
          <button class="modal-close" type="button">✕</button>
        </div>
        <div class="quest-columns">
          <div>
            <h3>Active Quests</h3>
            <div id="quest-active-list" class="quest-list"></div>
          </div>
          <div>
            <h3>Completed Chronicles</h3>
            <div id="quest-done-list" class="quest-list"></div>
          </div>
        </div>
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
    const { active, completed } = this.game.quests.listAll();
    const actEl = this.el.querySelector('#quest-active-list');
    const doneEl = this.el.querySelector('#quest-done-list');

    actEl.innerHTML =
      active.length === 0
        ? `<div class="empty-note">All active quests completed! Speak with villagers or explore uncharted regions.</div>`
        : active
            .map(
              (q) => `
          <div class="quest-entry ${q.tracked ? 'tracked' : ''}">
            <div class="quest-head">
              <div>
                <span class="quest-badge type-${q.type}">${q.type}</span>
                <strong>${q.title}</strong>
              </div>
              <button class="btn-mini" data-track="${q.id}" type="button">${q.tracked ? 'Tracking' : 'Track'}</button>
            </div>
            <p class="quest-summary">${q.summary}</p>
            <ul class="quest-objs">
              ${q.objectives
                .map((o) => {
                  const cur = q.progress[o.id] || 0;
                  const done = cur >= o.target;
                  return `<li class="${done ? 'done' : ''}">${done ? '✓' : '○'} ${o.text} (${cur}/${o.target})</li>`;
                })
                .join('')}
            </ul>
            <div class="quest-reward">Reward: +${q.rewards?.xp || 0} XP</div>
          </div>
        `
            )
            .join('');

    doneEl.innerHTML =
      completed.length === 0
        ? `<div class="empty-note">No completed quests yet.</div>`
        : completed
            .map(
              (q) => `
          <div class="quest-entry completed">
            <div class="quest-head"><strong>✓ ${q.title}</strong><span class="quest-badge">${q.type}</span></div>
            <p class="quest-summary">${q.summary}</p>
          </div>
        `
            )
            .join('');

    for (const btn of actEl.querySelectorAll('[data-track]')) {
      btn.addEventListener('click', () => {
        this.game.quests.trackedQuestId = btn.dataset.track;
        this.render();
      });
    }
  }
}
