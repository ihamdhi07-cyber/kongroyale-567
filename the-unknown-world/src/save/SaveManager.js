// Persistent Local Save System using IndexedDB (with automatic localStorage / memory fallback),
// schema versioning, integrity validation, error recovery, 3 manual slots + autosave.

export const SAVE_SCHEMA_VERSION = 1;
const DB_NAME = 'TheUnknownWorldDB';
const STORE_NAME = 'saves';
const SETTINGS_KEY = 'tuw_settings_v1';

export function validateSaveData(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== SAVE_SCHEMA_VERSION) return false;
  if (!data.player || typeof data.player.x !== 'number' || typeof data.player.z !== 'number') return false;
  if (!Number.isFinite(data.player.x) || !Number.isFinite(data.player.z)) return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;
  return true;
}

export class SaveManager {
  constructor() {
    this._dbPromise = null;
    this._memStore = new Map();
  }

  _hasIndexedDB() {
    return typeof indexedDB !== 'undefined';
  }

  _openDB() {
    if (!this._hasIndexedDB()) return Promise.resolve(null);
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return this._dbPromise;
  }

  async saveSlot(slotId, payload) {
    const record = {
      slotId,
      version: SAVE_SCHEMA_VERSION,
      savedAt: Date.now(),
      ...payload,
    };
    if (!validateSaveData(record)) {
      throw new Error('Save payload failed schema validation');
    }

    this._memStore.set(slotId, record);

    const db = await this._openDB();
    if (db) {
      await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(record);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`tuw_save_${slotId}`, JSON.stringify(record));
      } catch {
        // Ignore storage quota errors cleanly
      }
    }
    return record;
  }

  async loadSlot(slotId) {
    const db = await this._openDB();
    if (db) {
      const fromDb = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).get(slotId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
      if (validateSaveData(fromDb)) return fromDb;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`tuw_save_${slotId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (validateSaveData(parsed)) return parsed;
        }
      } catch {
        // Corrupt slot recovered cleanly by falling through
      }
    }

    const mem = this._memStore.get(slotId);
    return validateSaveData(mem) ? mem : null;
  }

  async listSlots() {
    const ids = ['autosave', 'slot1', 'slot2', 'slot3'];
    const out = [];
    for (const id of ids) {
      const data = await this.loadSlot(id);
      out.push({
        slotId: id,
        exists: Boolean(data),
        savedAt: data?.savedAt || null,
        regionName: data?.regionName || null,
        level: data?.progression?.level || null,
        explorationPct: data?.explorationPct ?? null,
      });
    }
    return out;
  }

  async deleteSlot(slotId) {
    this._memStore.delete(slotId);
    const db = await this._openDB();
    if (db) {
      await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).delete(slotId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`tuw_save_${slotId}`);
      } catch {
        // ignore
      }
    }
  }

  saveSettings(settings) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  loadSettings() {
    const defaults = {
      quality: null,
      renderScale: 1.0,
      shadowOverride: 'preset',
      fov: 42,
      invertY: false,
      masterVol: 0.75,
      musicVol: 0.55,
      sfxVol: 0.8,
      ambientVol: 0.6,
      muted: false,
      touchControls: 'auto',
      showFps: false,
    };
    if (typeof localStorage === 'undefined') return defaults;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  }
}
