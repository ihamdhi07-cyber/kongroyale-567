// A single versioned local slot; failures are surfaced to the player, not swallowed.
export const SAVE_VERSION = 1;
export function validateSave(value) {
  if (
    !value ||
    value.version !== SAVE_VERSION ||
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
    !value.explored.every((x) => Number.isInteger(x) && x >= 0 && x < 100)
  ) {
    throw new Error("The save is invalid or from an unsupported version.");
  }
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
