// Discovery-based progression: no repeated rewards for the same event.
export const AWARDS = Object.freeze({
  waystone: 20,
  restored: 50,
  guardian: 40,
  puzzle: 60,
  river: 25,
});
export function validProgress(value) {
  return (
    !!value &&
    Array.isArray(value.achievements) &&
    value.achievements.length <= Object.keys(AWARDS).length &&
    new Set(value.achievements).size === value.achievements.length &&
    value.achievements.every((id) => Object.hasOwn(AWARDS, id))
  );
}
export class Progression {
  constructor(data = {}) {
    this.achievements = new Set(data.achievements ?? []);
  }
  award(id) {
    if (!Object.hasOwn(AWARDS, id) || this.achievements.has(id)) return false;
    this.achievements.add(id);
    return true;
  }
  get xp() {
    let xp = 0;
    for (const id of this.achievements) xp += AWARDS[id];
    return xp;
  }
  get swift() {
    return this.achievements.has("puzzle");
  }
  snapshot() {
    return { achievements: [...this.achievements] };
  }
}
