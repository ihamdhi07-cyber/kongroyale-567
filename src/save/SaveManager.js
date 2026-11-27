// A single versioned local slot; failures are surfaced to the player, not swallowed.
import { validJourney } from "../gameplay/Journey.js";
import { DEFAULT_ENVIRONMENT, validEnvironment } from "../world/Environment.js";
import { DEFAULT_COMBAT, validCombat } from "../gameplay/CombatSystem.js";
import { validPuzzle } from "../gameplay/EchoPuzzle.js";
import { validProgress } from "../gameplay/Progression.js";
import { DEFAULT_AUDIO, validAudio } from "../audio/AudioManager.js";
import { validSurvival } from "../gameplay/Survival.js";
export const SAVE_VERSION = 7;
export function validateSave(value) {
  if (
    !value ||
    ![1, 2, 3, 4, 5, 6, SAVE_VERSION].includes(value.version) ||
    !value.position ||
    !Number.isFinite(value.position.x) ||
    !Number.isFinite(value.position.z) ||
    Math.abs(value.position.x) > 248 ||
    Math.abs(value.position.z) > 248 ||
    !Array.isArray(value.discoveries) ||
    value.discoveries.length > 1 ||
    !value.discoveries.every((x) => x === "waystone") ||
    !Array.isArray(value.explored) ||
    value.explored.length > 100 ||
    !value.explored.every((x) => Number.isInteger(x) && x >= 0 && x < 100) ||
    (value.version >= 2 && !validJourney(value.journey)) ||
    (value.version >= 3 && !validEnvironment(value.environment)) ||
    (value.version >= 4 && !validCombat(value.combat)) ||
    (value.version >= 5 &&
      (!validPuzzle(value.puzzle) ||
        !validProgress(value.progress) ||
        (value.puzzle.stage === 3) !==
          value.progress.achievements.includes("puzzle"))) ||
    (value.version >= 6 && !validAudio(value.audio)) ||
    (value.version === SAVE_VERSION && !validSurvival(value.survival))
  ) {
    throw new Error("The save is invalid or from an unsupported version.");
  }
  if (value.version < SAVE_VERSION)
    return {
      ...value,
      version: SAVE_VERSION,
      journey:
        value.version === 1
          ? { gathered: [], leaves: 0, lantern: false, restored: false }
          : value.journey,
      environment:
        value.version < 3 ? { ...DEFAULT_ENVIRONMENT } : value.environment,
      combat: value.version < 4 ? { ...DEFAULT_COMBAT } : value.combat,
      puzzle:
        value.version < 5 ? { discovered: false, stage: 0 } : value.puzzle,
      audio: value.version < 6 ? { ...DEFAULT_AUDIO } : value.audio,
      survival: { picked: [], berries: 0, meals: 0 },
      progress:
        value.version >= 5
          ? value.progress
          : {
              achievements: [
                ...(value.discoveries.includes("waystone") ? ["waystone"] : []),
                ...(value.version >= 2 && value.journey.restored
                  ? ["restored"]
                  : []),
                ...(value.version >= 4 && value.combat.guardianHealth === 0
                  ? ["guardian"]
                  : []),
              ],
            },
    };
  return value;
}
export class SaveManager {
  constructor(indexedDB = globalThis.indexedDB) {
    this.indexedDB = indexedDB;
    this.db = null;
  }
  async open() {
    if (!this.indexedDB)
      throw new Error("IndexedDB is unavailable in this browser.");
    this.db = await new Promise((resolve, reject) => {
      const request = this.indexedDB.open("unknown-world", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("slots");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Save database is blocked by another tab."));
    });
  }
  async load() {
    const value = await new Promise((resolve, reject) => {
      const tx = this.db.transaction("slots", "readonly");
      const req = tx.objectStore("slots").get("main");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error || new Error("Save read aborted."));
    });
    return value === undefined ? null : validateSave(value);
  }
  async save(value) {
    validateSave(value);
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("slots", "readwrite");
      tx.objectStore("slots").put(value, "main");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Save write aborted."));
    });
  }
}
