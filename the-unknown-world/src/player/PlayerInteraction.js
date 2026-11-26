// Spatial Interaction Detector: finds the closest contextual interactable
// (NPCs, Campfires, Waystones, Lore Tablets, Ancient Puzzle Switches/Mirrors/Blocks, Harvestables).
export class PlayerInteraction {
  constructor(player, world, eventBus) {
    this.player = player;
    this.world = world;
    this.events = eventBus;
    this.providers = [];
    this.currentTarget = null;
  }

  registerProvider(fn) {
    this.providers.push(fn);
  }

  update() {
    const pos = this.player.root.position;
    let best = null;
    let bestDist = Infinity;

    const consider = (item) => {
      const dx = item.x - pos.x;
      const dz = item.z - pos.z;
      const d = Math.hypot(dx, dz);
      const r = item.radius || 3.4;
      if (d <= r && d < bestDist) {
        bestDist = d;
        best = item;
      }
    };

    // 1. Landmark interactables (Waystones, Campfires, Lore Tablets)
    for (const item of this.world.landmarks.interactables) {
      consider(item);
    }

    // 2. Chunk harvestable resources
    const gatherables = this.world.chunks.getNearbyGatherables(pos.x, pos.z, 4.0);
    for (const g of gatherables) {
      consider({
        id: g.id,
        type: 'gather',
        itemId: g.itemId,
        label: `Gather ${g.label}`,
        x: g.x,
        y: g.y,
        z: g.z,
        radius: 3.3,
      });
    }

    // 3. Dynamic providers (NPCs, Puzzles, Chests)
    for (const provider of this.providers) {
      const items = provider(pos);
      for (const item of items) {
        consider(item);
      }
    }

    this.currentTarget = best;
    return best;
  }

  interact() {
    if (!this.currentTarget) return false;
    this.player.interactTimer = 0.28;
    this.events.emit('player:interact', this.currentTarget);
    return true;
  }
}
