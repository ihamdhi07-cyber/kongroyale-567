// A small, low-pressure cooking loop: three finite berry bushes and a reusable camp.
export const BUSHES = Object.freeze([
  { id: "berry1", x: 12, z: 13 },
  { id: "berry2", x: 18, z: 16 },
  { id: "berry3", x: 22, z: 10 },
]);
export const CAMP = Object.freeze({ x: 14, z: 5 });
const ids = BUSHES.map((b) => b.id);
export function validSurvival(s) {
  return (
    !!s &&
    Array.isArray(s.picked) &&
    s.picked.length <= ids.length &&
    new Set(s.picked).size === s.picked.length &&
    s.picked.every((id) => ids.includes(id)) &&
    Number.isInteger(s.berries) &&
    s.berries >= 0 &&
    Number.isInteger(s.meals) &&
    s.meals >= 0 &&
    s.berries + s.meals * 2 <= s.picked.length
  );
}
export class Survival {
  constructor(data = {}) {
    this.picked = new Set(data.picked ?? []);
    this.berries = data.berries ?? 0;
    this.meals = data.meals ?? 0;
  }
  gather(id) {
    if (!ids.includes(id) || this.picked.has(id)) return false;
    this.picked.add(id);
    this.berries++;
    return true;
  }
  cook() {
    if (this.berries < 2) return false;
    this.berries -= 2;
    this.meals++;
    return true;
  }
  eat(currentHealth) {
    if (this.meals < 1 || currentHealth >= 100) return null;
    this.meals--;
    return Math.min(100, currentHealth + 35);
  }
  snapshot() {
    return {
      picked: [...this.picked],
      berries: this.berries,
      meals: this.meals,
    };
  }
}
