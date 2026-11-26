// A coarse local exploration grid; this is not the eventual world map.
export const GRID_SIZE = 10;
export function cellAt(x, z) {
  const col = Math.max(0, Math.min(9, Math.floor((x + 250) / 50)));
  const row = Math.max(0, Math.min(9, Math.floor((z + 250) / 50)));
  return row * GRID_SIZE + col;
}
export class Exploration {
  constructor(explored = [], discoveries = []) {
    this.explored = new Set(explored);
    this.discoveries = new Set(discoveries);
  }
  visit(x, z) {
    const before = this.explored.size;
    this.explored.add(cellAt(x, z));
    return this.explored.size !== before;
  }
  discover(id) {
    const before = this.discoveries.size;
    this.discoveries.add(id);
    return this.discoveries.size !== before;
  }
  snapshot(x, z) {
    return {
      version: 3,
      position: { x, z },
      explored: [...this.explored],
      discoveries: [...this.discoveries],
    };
  }
}
