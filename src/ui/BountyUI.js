// Crossroads Guild Bounty Board & Ancient Shrine Trials Leaderboard UI:
// Accept & claim rotating Regional Contracts + inspect & launch all 5 Timed Shrine Trials!
import { SHRINE_TRIALS } from '../world/ShrineTrialSystem.js';

export class BountyUI {
  constructor(game) {
    this.game = game;
    this.activeTab = 'bounties';
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'bounty-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">CROSSROADS WAYFARER GUILD</div>
            <h2 class="modal-title">Guild Bounties &amp; Shrine Trials</h2>
            <p class="slot-meta" id="bounty-summary">Contracts Completed: 0</p>
          </div>
          <button class="icon-btn" id="bounty-close" type="button">✕</button>
        </div>
        <div class="tab-row" id="bounty-tabs">
          <button class="tab-btn active" data-tab="bounties" type="button">Guild Bounties (4)</button>
          <button class="tab-btn" data-tab="trials" type="button">Shrine Trials &amp; Medals (5)</button>
          <button class="btn-mini" id="btn-bounty-refresh" type="button" style="margin-left:auto">↻ Refresh Contracts</button>
        </div>
        <div class="codex-body" id="bounty-body"></div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('#bounty-close').addEventListener('click', () => this.game.closeAllModals());
    this.el.querySelector('#btn-bounty-refresh').addEventListener('click', () => {
      this.game.bounties.refreshBoard();
      this.render();
    });
    this.el.querySelectorAll('#bounty-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.el.querySelectorAll('#bounty-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        this.render();
      });
    });
  }

  open(tab = 'bounties') {
    this.activeTab = tab;
    this.el.querySelectorAll('#bounty-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const bs = this.game.bounties;
    const trials = this.game.shrineTrials;
    this.el.querySelector('#bounty-summary').textContent =
      `Contracts Claimed: ${bs.completedCount} · Shrine Trials Cleared: ${trials.getCompletedCount()}/5 · Gold Medals: ${trials.getGoldCount()}/5`;

    const body = this.el.querySelector('#bounty-body');
    if (this.activeTab === 'bounties') {
      body.innerHTML = `<div class="codex-grid">${bs.bounties.map((b) => {
        const done = b.progress >= b.target;
        return `
          <div class="codex-card ${b.claimed ? 'locked' : done ? 'unlocked' : ''}">
            <div class="codex-card-head">
              <strong>${b.title}</strong>
              <span class="codex-pill">${b.claimed ? 'CLAIMED' : `${b.progress}/${b.target}`}</span>
            </div>
            <div class="codex-sub">${b.region} · +${b.gold} ✦ · +${b.xp} XP · +${b.rep} Trust</div>
            <div class="codex-desc">${b.description}</div>
            <div class="codex-foot">
              <span class="slot-meta">${b.accepted ? 'Contract Active' : 'Available on Board'}</span>
              ${
                b.claimed
                  ? `<span class="badge-ok">✓ Paid</span>`
                  : done && b.accepted
                    ? `<button class="btn-mini btn-accent" data-claim="${b.id}" type="button">Claim Reward</button>`
                    : !b.accepted
                      ? `<button class="btn-mini" data-accept="${b.id}" type="button">Accept</button>`
                      : `<span class="slot-meta">In Progress</span>`
              }
            </div>
          </div>
        `;
      }).join('')}</div>`;

      body.querySelectorAll('[data-accept]').forEach((btn) => {
        btn.addEventListener('click', () => {
          bs.accept(btn.dataset.accept);
          this.render();
        });
      });
      body.querySelectorAll('[data-claim]').forEach((btn) => {
        btn.addEventListener('click', () => {
          bs.claim(btn.dataset.claim);
          this.render();
        });
      });
    } else {
      body.innerHTML = `<div class="codex-grid">${SHRINE_TRIALS.map((t) => {
        const rec = trials.records[t.id];
        return `
          <div class="codex-card ${rec ? 'unlocked' : ''}">
            <div class="codex-card-head">
              <strong>◎ ${t.name}</strong>
              <span class="codex-pill">${rec ? `${rec.medal.toUpperCase()} ${rec.bestTime.toFixed(1)}s` : `${t.rings.length} RINGS`}</span>
            </div>
            <div class="codex-sub">${t.mode} · Gold ≤ ${t.goldTime}s · Limit ${t.timeLimit}s</div>
            <div class="codex-desc">Reward: up to ${Math.round(t.rewardGold * 1.5)} ✦ Sunshards &amp; ${Math.round(t.rewardXp * 1.5)} XP.</div>
            <div class="codex-foot">
              <button class="btn-mini" data-pin-trial="${t.id}" type="button">◎ Pin on Map</button>
              <button class="btn-mini btn-accent" data-travel-trial="${t.id}" type="button">Fast Travel &amp; Start</button>
            </div>
          </div>
        `;
      }).join('')}</div>`;

      body.querySelectorAll('[data-pin-trial]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const def = SHRINE_TRIALS.find((x) => x.id === btn.dataset.pinTrial);
          if (def) {
            this.game.setWaypoint({ x: def.startX, z: def.startZ, regionName: def.name });
            this.game.closeAllModals();
          }
        });
      });
      body.querySelectorAll('[data-travel-trial]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const def = SHRINE_TRIALS.find((x) => x.id === btn.dataset.travelTrial);
          if (def) {
            this.game.closeAllModals();
            this.game.teleportAndStartTrial(def.id);
          }
        });
      });
    }
  }
}
