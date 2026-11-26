// Three environmental switches: read the tablet, then repeat its sequence.
export const ORDER = Object.freeze(["moon", "sun", "star"]);
export const TABLET = Object.freeze({ x: -30, z: 8 });
export const SWITCHES = Object.freeze([
  { id: "moon", x: -38, z: 4 },
  { id: "sun", x: -38, z: 8 },
  { id: "star", x: -38, z: 12 },
]);
export function validPuzzle(p) {
  return (
    !!p &&
    typeof p.discovered === "boolean" &&
    Number.isInteger(p.stage) &&
    p.stage >= 0 &&
    p.stage <= 3 &&
    (p.discovered || p.stage === 0)
  );
}
export class EchoPuzzle {
  constructor(data = {}) {
    this.discovered = data.discovered ?? false;
    this.stage = data.stage ?? 0;
  }
  read() {
    const fresh = !this.discovered;
    this.discovered = true;
    return fresh;
  }
  press(id) {
    if (!this.discovered) return "locked";
    if (this.stage === ORDER.length) return "complete";
    if (id !== ORDER[this.stage]) {
      this.stage = 0;
      return "reset";
    }
    this.stage++;
    return this.stage === ORDER.length ? "solved" : "correct";
  }
  snapshot() {
    return { discovered: this.discovered, stage: this.stage };
  }
}
