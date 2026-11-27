// Cooking, Alchemy & Forging Crafting System wired directly to InventorySystem.
export class CraftingSystem {
  constructor(recipes = [], inventory, eventBus = null) {
    this.recipes = recipes;
    this.inventory = inventory;
    this.events = eventBus;
  }

  canCraft(recipeId) {
    const recipe = this.recipes.find((r) => r.id === recipeId);
    if (!recipe) return false;
    for (const ing of recipe.ingredients) {
      if (this.inventory.getCount(ing.itemId) < ing.qty) return false;
    }
    return true;
  }

  craft(recipeId) {
    const recipe = this.recipes.find((r) => r.id === recipeId);
    if (!recipe || !this.canCraft(recipeId)) return false;

    for (const ing of recipe.ingredients) {
      this.inventory.removeItem(ing.itemId, ing.qty);
    }
    this.inventory.addItem(recipe.resultId, recipe.resultQty || 1, true);
    if (this.events) {
      const def = this.inventory.getDef(recipe.resultId);
      this.events.emit('craft:complete', { recipe, result: def });
      this.events.emit('inventory:changed', this.inventory.getSnapshot());
    }
    return true;
  }

  listRecipes() {
    return this.recipes.map((r) => ({
      ...r,
      result: this.inventory.getDef(r.resultId),
      craftable: this.canCraft(r.id),
      ingredientsDetailed: r.ingredients.map((i) => ({
        ...i,
        def: this.inventory.getDef(i.itemId),
        have: this.inventory.getCount(i.itemId),
      })),
    }));
  }
}
