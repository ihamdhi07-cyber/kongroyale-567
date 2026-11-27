// The first small discovery loop: gather three unique plants, craft a light, restore the waystone.
export const PLANTS = [
  { id: "leaf1", x: -7, z: -8 },
  { id: "leaf2", x: 7, z: -16 },
  { id: "leaf3", x: -8, z: -29 },
];
export const PLANT_IDS = PLANTS.map((p) => p.id);
export class Journey {
  constructor(data = {}) {
    this.gathered = new Set(data.gathered || []);
    this.leaves = data.leaves || 0;
    this.lantern = data.lantern || false;
    this.restored = data.restored || false;
  }
  gather(id) {
    if (!PLANT_IDS.includes(id) || this.gathered.has(id)) return false;
    this.gathered.add(id);
    this.leaves++;
    return true;
  }
  craft() {
    if (this.lantern || this.leaves < 3) return false;
    this.leaves -= 3;
    this.lantern = true;
    return true;
  }
  restore() {
    if (!this.lantern || this.restored) return false;
    this.restored = true;
    return true;
  }
  snapshot() {
    return {
      gathered: [...this.gathered],
      leaves: this.leaves,
      lantern: this.lantern,
      restored: this.restored,
    };
  }
}
export function validJourney(j) {
  return (
    !!j &&
    Array.isArray(j.gathered) &&
    j.gathered.length <= 3 &&
    new Set(j.gathered).size === j.gathered.length &&
    j.gathered.every((id) => PLANT_IDS.includes(id)) &&
    Number.isInteger(j.leaves) &&
    j.leaves >= 0 &&
    j.leaves <= 3 &&
    typeof j.lantern === "boolean" &&
    typeof j.restored === "boolean" &&
    (!j.restored || j.lantern) &&
    j.leaves === j.gathered.length - (j.lantern ? 3 : 0)
  );
}
