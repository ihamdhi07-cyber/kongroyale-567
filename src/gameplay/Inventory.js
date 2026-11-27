// Inventory is a read-only view over the existing quest and survival state.
// These definitions do not duplicate quantities in the save, so crafting and
// consumption always use their owning systems as the source of truth.
export const ITEMS = Object.freeze([
  Object.freeze({
    id: "glowleaf",
    name: "Glowleaf",
    icon: "✿",
    category: "material",
    description:
      "A soft luminous leaf. Three can be made into a wayfarer's light.",
  }),
  Object.freeze({
    id: "berries",
    name: "Wild berries",
    icon: "●",
    category: "material",
    description: "Gathered near the path. Cook two at the campfire.",
  }),
  Object.freeze({
    id: "meal",
    name: "Berry meal",
    icon: "◉",
    category: "consumable",
    description: "A warm meal that restores up to 35 health.",
  }),
  Object.freeze({
    id: "light",
    name: "Wayfarer's light",
    icon: "✧",
    category: "quest",
    description: "A crafted light used to restore the old waystone.",
  }),
]);
export function inventoryItems(
  journey,
  survival,
  { category = "all", sort = "name" } = {},
) {
  const counts = {
    glowleaf: journey.leaves,
    berries: survival.berries,
    meal: survival.meals,
    light: journey.lantern ? 1 : 0,
  };
  const items = ITEMS.filter(
    (item) => category === "all" || item.category === category,
  ).map((item) => ({ ...item, quantity: counts[item.id] }));
  if (sort === "quantity")
    items.sort(
      (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name),
    );
  else items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}
