// A single versioned local slot; failures are surfaced to the player, not swallowed.
import { validJourney } from "../gameplay/Journey.js";
import { DEFAULT_ENVIRONMENT, validEnvironment } from "../world/Environment.js";
import { DEFAULT_COMBAT, validCombat } from "../gameplay/CombatSystem.js";
export const SAVE_VERSION = 4;
export function validateSave(value) {
  if (
    !value ||
    ![1, 2, 3, SAVE_VERSION].includes(value.version) ||
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
    (value.version === SAVE_VERSION && !validCombat(value.combat))
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
      combat: { ...DEFAULT_COMBAT },
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
