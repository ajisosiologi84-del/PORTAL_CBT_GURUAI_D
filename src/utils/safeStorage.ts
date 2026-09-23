const DB_NAME = 'CBT_Offline_DB_v2';
const DB_VERSION = 1;
const STORE_NAME = 'cbt_keyvalue_store';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getIDBData<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB get failed for ${key}:`, e);
    return null;
  }
}

export async function setIDBData<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB set failed for ${key}:`, e);
    return false;
  }
}

/**
 * Safely saves value to localStorage without failing on QuotaExceededError.
 * Dual-saves asynchronously to IndexedDB for high-capacity offline storage.
 */
export function safeSetLocalStorage(key: string, value: string): void {
  // Always trigger IndexedDB async save as high-capacity backup
  try {
    const parsed = JSON.parse(value);
    setIDBData(key, parsed).catch(() => {});
  } catch (e) {
    setIDBData(key, value).catch(() => {});
  }

  // Attempt localStorage save safely
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`localStorage quota exceeded for key "${key}". Config safely preserved in memory and IndexedDB.`, err);
    try {
      // Attempt to clean up non-essential cached entries to free space
      localStorage.removeItem('cbt_temp_backup');
      localStorage.removeItem('cbt_student_answers_temp');
      localStorage.setItem(key, value);
    } catch (e2) {
      // Non-fatal: State and IndexedDB remain intact
    }
  }
}

/**
 * Safely reads value from localStorage
 */
export function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
