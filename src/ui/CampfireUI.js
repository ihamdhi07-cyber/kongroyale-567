// Cozy Traveling Campfire Hearth UI:
// Rest until Dawn / Midday / Golden Dusk / Starlight (full HP, SP & Warmth restore + Auto-Save),
// plus direct Hearth Cooking & Alchemy right beside the fire!
export class CampfireUI {
  constructor(game) {
    this.game = game;

    this.el = document.createElement('div');
    this.el.id = 'campfire-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">TRAVELING HEARTH</div>
            <h2 class="modal-title">Campfire Rest &amp; Cooking Pot</h2>
            <p class="slot-meta">Warm your hands, pass time smoothly, save progress, and cook hearty meals.</p>
          </div>
          <button class="icon-btn" id="camp-close" type="button">✕</button>
        </div>
        <div class="camp-section">
          <h4>Rest &amp; Pass Time (Restores 100% HP, SP &amp; Warmth)</h4>
          <div class="camp-time-row">
            <button class="btn-mini btn-accent" data-hour="6.6" type="button">☀ Dawn (06:36)</button>
            <button class="btn-mini btn-accent" data-hour="12.5" type="button">☼ Midday (12:30)</button>
            <button class="btn-mini btn-accent" data-hour="17.8" type="button">◐ Dusk (17:48)</button>
            <button class="btn-mini btn-accent" data-hour="22.6" type="button">✦ Starlight (22:36)</button>
          </div>
        </div>
        <div class="camp-section">
          <h4>Hearth Cooking &amp; Elixirs</h4>
          <div class="camp-recipes" id="camp-recipes"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('#camp-close').addEventListener('click', () => this.game.closeAllModals());
    this.el.querySelectorAll('.camp-time-row button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hour = parseFloat(btn.dataset.hour);
        this.game.restAtCampfire(hour);
        this.game.closeAllModals();
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
    const inv = this.game.inventory;
    const list = this.el.querySelector('#camp-recipes');
    const recipes = this.game.crafting
      .listRecipes()
      .filter((r) => r.category === 'cooking' || r.category === 'alchemy');

    list.innerHTML = recipes
      .map((r) => {
        const def = inv.getDef(r.resultId);
        const ingText = r.ingredients
          .map((ing) => {
            const idef = inv.getDef(ing.itemId);
            const have = inv.getCount(ing.itemId);
            return `<span class="${have >= ing.qty ? 'ing-ok' : 'ing-miss'}">${idef?.name || ing.itemId} ${have}/${ing.qty}</span>`;
          })
          .join(' · ');
        return `
          <div class="shop-row">
            <div>
              <strong>${def?.name || r.resultId}</strong>
              <div class="slot-meta">${ingText}</div>
            </div>
            <button class="btn-mini btn-accent" data-recipe="${r.id}" ${r.canCraft ? '' : 'disabled'} type="button">Cook</button>
          </div>`;
      })
      .join('');

    list.querySelectorAll('button[data-recipe]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const recipeId = btn.dataset.recipe;
        const ok = this.game.crafting.craft(recipeId);
        if (ok) {
          const rec = this.game.crafting.listRecipes().find((r) => r.id === recipeId);
          this.game.audio.playPickup();
          this.game.hud.showToast({ title: 'Cooked at Hearth', text: `Prepared ${inv.getDef(rec?.resultId)?.name || 'Meal'}!` });
          this.render();
        }
      });
    });
  }
}
