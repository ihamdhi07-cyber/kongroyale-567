// Spatial Interaction Detector: finds the closest contextual interactable
// across outdoor landmarks (Waystones, Campfires, Lore Tablets, The Unknown Gate Altar),
// harvestables, sailboats, sunken underwater treasures, enterable sanctuaries, NPCs, puzzles & fish.
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

    const consider = (item, maxDy = 12) => {
      const dx = item.x - pos.x;
      const dz = item.z - pos.z;
      const d = Math.hypot(dx, dz);
      const r = item.radius || 3.4;
      if (d > r) return;
      if (typeof item.y === 'number' && Math.abs(item.y - pos.y) > maxDy) return;
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    };

    // Inside a 3D Sanctuary room (y = 600): only surface indoor interactables
    if (this.world.interiors?.currentInterior) {
      for (const item of this.world.interiors.getInteractables(pos)) {
        consider(item, 8);
      }
      this.currentTarget = best;
      return best;
    }

    // While sailing: prioritize boat disembark so pressing E exits cleanly
    if (this.player.sailing && this.world.boats) {
      for (const item of this.world.boats.getInteractables(pos)) {
        consider(item, 10);
      }
      this.currentTarget = best;
      return best;
    }

    // 1. Landmark interactables (Waystones, Campfires, Lore Tablets, Unknown Gate Altar)
    for (const item of this.world.landmarks.interactables) {
      consider(item, 14);
    }

    // 2. Chunk harvestable resources
    const gatherables = this.world.chunks.getNearbyGatherables(pos.x, pos.z, 4.0);
    for (const g of gatherables) {
      consider(
        {
          id: g.id,
          type: 'gather',
          itemId: g.itemId,
          label: `Gather ${g.label}`,
          x: g.x,
          y: g.y,
          z: g.z,
          radius: 3.3,
        },
        6
      );
    }

    // 3. Dynamic providers (Sanctuary doors, Sailboats & Sunken Treasures, NPCs, 8 Puzzles, Fish)
    for (const provider of this.providers) {
      const items = provider(pos);
      for (const item of items) {
        const dyLimit = item.type === 'sunken-treasure' ? 3.8 : 10;
        consider(item, dyLimit);
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
