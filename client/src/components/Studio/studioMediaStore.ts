/**
 * Almacén persistente de medios de WAPPY Studio en IndexedDB.
 *
 * localStorage solo admite ~5 MB, por lo que los audios WAV en Base64 (1-10 MB c/u)
 * excedían la cuota y la biblioteca no se guardaba. Además, los audios largos solo vivían
 * en la RAM del servidor (se perdían al reiniciar el contenedor).
 * Aquí guardamos los binarios (WAV, MP4, cápsulas HTML) como Blobs en IndexedDB del navegador,
 * y en localStorage solo queda la metadata ligera.
 */

const DB_NAME = 'wappy-studio-media';
const DB_VERSION = 1;
const STORE = 'blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible en este navegador.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function putMediaBlob(key: string, blob: Blob): Promise<void> {
  await run('readwrite', (s) => s.put(blob, key));
}

export async function getMediaBlob(key: string): Promise<Blob | null> {
  try {
    const result = await run<Blob | undefined>('readonly', (s) => s.get(key));
    return result ?? null;
  } catch {
    return null;
  }
}

export async function deleteMediaBlob(key: string): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(key));
  } catch {
    /* ignore */
  }
}

export async function clearMediaBlobs(): Promise<void> {
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
}

export function base64ToBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const bin = window.atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
