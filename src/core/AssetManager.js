// Data & asset loader with in-memory caching for JSON definitions (regions, items, quests, creatures).
export class AssetManager {
  constructor() {
    this.cache = new Map();
  }

  async loadJSON(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    this.cache.set(url, data);
    return data;
  }

  async loadGameData() {
    const [regionsData, itemsData, questsData, creaturesData] = await Promise.all([
      this.loadJSON('./data/regions/regions.json'),
      this.loadJSON('./data/items/items.json'),
      this.loadJSON('./data/quests/quests.json'),
      this.loadJSON('./data/creatures/creatures.json'),
    ]);
    return {
      regions: regionsData.regions,
      worldMeta: regionsData.world,
      expansionZones: regionsData.expansionZones,
      items: itemsData.items,
      recipes: itemsData.recipes,
      quests: questsData.quests,
      creatures: creaturesData.creatures,
    };
  }
}
