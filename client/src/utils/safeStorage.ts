/**
 * WAPPY IA — Safe Storage & Client-Side Image Compression Utility
 * Prevents QuotaExceededError crashes across React state updaters, hooks, Jotai stores, and SG-SST workspaces.
 */

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) {
    return false;
  }
  if (typeof err === 'string') {
    return /quota|QuotaExceededError|NS_ERROR_DOM_QUOTA_REACHED/i.test(err);
  }
  if (typeof err === 'object') {
    const anyErr = err as { name?: string; message?: string; code?: number; stack?: string };
    if (anyErr.code === 22 || anyErr.code === 1014) {
      return true;
    }
    if (
      anyErr.name === 'QuotaExceededError' ||
      anyErr.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      anyErr.name === 'W3CException_DOM_QUOTA_EXCEEDED_ERR'
    ) {
      return true;
    }
    if (typeof anyErr.message === 'string' && /quota/i.test(anyErr.message)) {
      return true;
    }
    if (
      typeof anyErr.stack === 'string' &&
      /QuotaExceededError|exceeded the quota|NS_ERROR_DOM_QUOTA_REACHED/i.test(anyErr.stack)
    ) {
      return true;
    }
  }
  return false;
}

function isProtectedStorageKey(key: string, preserveKey?: string): boolean {
  if (!key) {
    return true;
  }
  if (preserveKey && key === preserveKey) {
    return true;
  }
  if (
    key === 'token' ||
    key === 'refreshToken' ||
    key === 'accessToken' ||
    key === 'wappy_active_company_id' ||
    key === 'wappy_active_company_name' ||
    key === 'wappy_active_company_nit' ||
    key === 'wappy_active_company_arl' ||
    key === 'wappy_active_company_workers' ||
    key === 'wappy_active_company_risk' ||
    key === 'wappy_active_company_workspace' ||
    key === 'color-theme' ||
    key === 'wappy_theme_mode' ||
    key === 'wappy_shared_theme' ||
    key === 'wappy_light_default_v2' ||
    key === 'wappy_api_key' ||
    key === 'wappy_studio_api_key'
  ) {
    return true;
  }
  if (
    key.startsWith('GEMINI_KEYS') ||
    key.startsWith('wpy_live_') ||
    key.startsWith('wpy_guest_') ||
    /^(auth|jwt|session_token|refresh_token)/i.test(key)
  ) {
    return true;
  }
  return false;
}

function getLocalStorageTotalChars(storage: Storage): number {
  let total = 0;
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k) continue;
      const v = storage.getItem(k);
      total += k.length + (v ? v.length : 0);
    }
  } catch {
    // ignore
  }
  return total;
}

function pruneCompanyBinaryFields(entry: unknown, maxFieldChars = 40_000): boolean {
  if (!entry || typeof entry !== 'object') {
    return false;
  }
  const obj = entry as Record<string, unknown>;
  let mutated = false;
  const binaryFields = ['logoBase64', 'legalRepSignature', 'sstRespSignature'];
  for (const field of binaryFields) {
    const val = obj[field];
    if (typeof val === 'string' && val.length > maxFieldChars) {
      delete obj[field];
      mutated = true;
    }
  }
  return mutated;
}

/**
 * Evicts regenerable WAPPY caches and oversized duplicate Base64 blobs from localStorage
 * without ever touching auth tokens, active company ID, theme, Gemini keys, or wpy_live/wpy_guest keys.
 */
export function evictWappyStorageBloat(preserveKey?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const ls = window.localStorage;

  try {
    const allKeys: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k) {
        allKeys.push(k);
      }
    }

    const activeCompanyId = ls.getItem('wappy_active_company_id') || 'default';

    // ─── Nivel 1: Cachés regenerables ─────────────────────────────────────────
    const directLegacyKeys = [
      'sgsst_signatures',
      'wappy_gtc45_history',
      'wappy_gtc45_matrix_rows',
    ];
    for (const legacyKey of directLegacyKeys) {
      if (!isProtectedStorageKey(legacyKey, preserveKey)) {
        try {
          ls.removeItem(legacyKey);
        } catch {
          // ignore
        }
      }
    }

    const reportItems: Array<{ key: string; updatedAt: number }> = [];
    const ephemeralKeys: string[] = [];
    const textDraftKeys: string[] = [];

    for (const k of allKeys) {
      if (isProtectedStorageKey(k, preserveKey)) {
        continue;
      }
      // Check if value holds a wpy_live_ or wpy_guest_ key
      let rawVal: string | null = null;
      try {
        rawVal = ls.getItem(k);
      } catch {
        rawVal = null;
      }
      if (rawVal && (rawVal.startsWith('wpy_live_') || rawVal.startsWith('wpy_guest_'))) {
        continue;
      }

      if (k.startsWith('wappy_company_draft_')) {
        try {
          ls.removeItem(k);
        } catch {
          // ignore
        }
      } else if (k.startsWith('ephemeralAgent__')) {
        ephemeralKeys.push(k);
      } else if (k.startsWith('textDraft_') || k.startsWith('filesDraft_')) {
        textDraftKeys.push(k);
      } else if (k.startsWith('wappy_sgsst_report_')) {
        let updatedAt = 0;
        if (rawVal) {
          try {
            const parsed = JSON.parse(rawVal);
            updatedAt = Number(parsed?.updatedAt) || 0;
          } catch {
            updatedAt = 0;
          }
        }
        reportItems.push({ key: k, updatedAt });
      }
    }

    // Remove old ephemeralAgent__* entries (keep at most 10 newest if timestamped, else remove)
    if (ephemeralKeys.length > 0) {
      const sortedEph = ephemeralKeys
        .filter((k) => !k.endsWith('_TIMESTAMP'))
        .map((k) => {
          let ts = 0;
          try {
            ts = Number(ls.getItem(`${k}_TIMESTAMP`)) || 0;
          } catch {
            ts = 0;
          }
          return { key: k, ts };
        })
        .sort((a, b) => a.ts - b.ts);

      const toRemoveCount = Math.max(0, sortedEph.length - 5);
      const victims = toRemoveCount > 0 ? sortedEph.slice(0, toRemoveCount) : sortedEph;
      for (const item of victims) {
        try {
          ls.removeItem(item.key);
          ls.removeItem(`${item.key}_TIMESTAMP`);
        } catch {
          // ignore
        }
      }
    }

    // Remove old textDraft_* / filesDraft_* entries
    if (textDraftKeys.length > 0) {
      const sortedDrafts = textDraftKeys
        .filter((k) => !k.endsWith('_TIMESTAMP'))
        .map((k) => {
          let ts = 0;
          try {
            ts = Number(ls.getItem(`${k}_TIMESTAMP`)) || 0;
          } catch {
            ts = 0;
          }
          return { key: k, ts };
        })
        .sort((a, b) => a.ts - b.ts);

      for (const item of sortedDrafts) {
        try {
          ls.removeItem(item.key);
          ls.removeItem(`${item.key}_TIMESTAMP`);
        } catch {
          // ignore
        }
      }
    }

    // Evict wappy_sgsst_report_* ordered by updatedAt ascending (oldest first)
    if (reportItems.length > 0) {
      reportItems.sort((a, b) => a.updatedAt - b.updatedAt);
      // First evict oldest leaving up to 3, then if storage still > 2.2M chars evict all
      const keepNewest = 3;
      const firstWave =
        reportItems.length > keepNewest
          ? reportItems.slice(0, reportItems.length - keepNewest)
          : reportItems;
      for (const item of firstWave) {
        try {
          ls.removeItem(item.key);
        } catch {
          // ignore
        }
      }
      if (getLocalStorageTotalChars(ls) > 2_200_000) {
        for (const item of reportItems) {
          try {
            ls.removeItem(item.key);
          } catch {
            // ignore
          }
        }
      }
    }

    // ─── Nivel 2: Binarios duplicados en localStorage ─────────────────────────
    if (!isProtectedStorageKey('wappy_sst_global_logo', preserveKey)) {
      try {
        const globalLogo = ls.getItem('wappy_sst_global_logo');
        if (globalLogo && globalLogo.length > 60_000) {
          ls.removeItem('wappy_sst_global_logo');
        }
      } catch {
        // ignore
      }
    }

    // Prune > 40_000 chars binary fields inside wappy_sgsst_companies & wappy_gtc45_company
    for (const compKey of ['wappy_sgsst_companies', 'wappy_gtc45_company']) {
      if (isProtectedStorageKey(compKey, preserveKey)) {
        continue;
      }
      try {
        const raw = ls.getItem(compKey);
        if (raw && raw.length > 40_000) {
          const parsed = JSON.parse(raw);
          let changed = false;
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (pruneCompanyBinaryFields(item, 40_000)) {
                changed = true;
              }
            }
          } else if (parsed && typeof parsed === 'object') {
            if (pruneCompanyBinaryFields(parsed, 40_000)) {
              changed = true;
            }
            for (const subVal of Object.values(parsed)) {
              if (pruneCompanyBinaryFields(subVal, 40_000)) {
                changed = true;
              }
            }
          }
          if (changed) {
            ls.setItem(compKey, JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore
      }
    }

    // Remove legacy global 'wappy_signatures' and signatures from inactive companies
    if (!isProtectedStorageKey('wappy_signatures', preserveKey)) {
      try {
        ls.removeItem('wappy_signatures');
      } catch {
        // ignore
      }
    }

    const activeSigKey = `wappy_signatures_${activeCompanyId}`;
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (!k || isProtectedStorageKey(k, preserveKey)) {
        continue;
      }
      if (k.startsWith('wappy_signatures_') && k !== activeSigKey) {
        try {
          ls.removeItem(k);
        } catch {
          // ignore
        }
      } else if (k === activeSigKey && k !== preserveKey) {
        try {
          const sigRaw = ls.getItem(k);
          if (sigRaw && sigRaw.length > 150_000) {
            const parsedSigs = JSON.parse(sigRaw);
            const compacted = compactSignaturesForStorage(parsedSigs, 20, 100_000);
            ls.setItem(k, JSON.stringify(compacted));
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('[safeStorage] Error during evictWappyStorageBloat:', err);
  }
}

export function safeSetItem(
  key: string,
  value: string,
  storage: Storage = typeof window !== 'undefined'
    ? window.localStorage
    : (undefined as unknown as Storage),
): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      if (typeof window !== 'undefined' && storage === window.localStorage) {
        evictWappyStorageBloat(key);
        try {
          storage.setItem(key, value);
          return true;
        } catch (retryErr) {
          console.warn(
            `[safeStorage] localStorage quota exceeded even after eviction for key "${key}" (${value.length} chars).`,
            retryErr,
          );
          return false;
        }
      }
      if (typeof window !== 'undefined' && storage === window.sessionStorage) {
        try {
          for (let i = storage.length - 1; i >= 0; i--) {
            const k = storage.key(i);
            if (
              k &&
              k !== key &&
              k !== 'auto_reload_chunk_error' &&
              k !== 'auto_reload_quota_error' &&
              !k.includes('token')
            ) {
              storage.removeItem(k);
            }
          }
          storage.setItem(key, value);
          return true;
        } catch (retryErr) {
          console.warn(
            `[safeStorage] sessionStorage quota exceeded for key "${key}".`,
            retryErr,
          );
          return false;
        }
      }
    }
    console.warn(`[safeStorage] Failed to setItem for key "${key}":`, err);
    return false;
  }
}

export function safeGetItem(
  key: string,
  storage: Storage = typeof window !== 'undefined'
    ? window.localStorage
    : (undefined as unknown as Storage),
): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(
  key: string,
  storage: Storage = typeof window !== 'undefined'
    ? window.localStorage
    : (undefined as unknown as Storage),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Storage adapter compatible with Jotai `createJSONStorage(() => safeLocalStorageAdapter)`.
 */
export const safeLocalStorageAdapter: Storage = {
  get length() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 0;
    }
    try {
      return window.localStorage.length;
    } catch {
      return 0;
    }
  },
  clear() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  },
  getItem(key: string) {
    return safeGetItem(key);
  },
  key(index: number) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      return window.localStorage.key(index);
    } catch {
      return null;
    }
  },
  removeItem(key: string) {
    safeRemoveItem(key);
  },
  setItem(key: string, value: string) {
    safeSetItem(key, value);
  },
};

export function compactSignaturesForStorage(
  sigs: Record<string, string>,
  maxEntries = 25,
  maxCharsPerSig = 120_000,
): Record<string, string> {
  if (!sigs || typeof sigs !== 'object') {
    return {};
  }
  const validEntries = Object.entries(sigs).filter(([k, v]) => {
    if (!k || typeof k !== 'string' || !k.trim()) {
      return false;
    }
    if (!v || typeof v !== 'string' || v.length > maxCharsPerSig) {
      return false;
    }
    const trimmed = v.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed.startsWith('data:') && !trimmed.includes(';base64,')) {
      return false;
    }
    return true;
  });

  const limited =
    validEntries.length > maxEntries
      ? validEntries.slice(validEntries.length - maxEntries)
      : validEntries;

  return Object.fromEntries(limited);
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  mimeType?: 'image/png' | 'image/webp' | 'image/jpeg';
  quality?: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Resizes and compresses a File or Base64 dataURL using an offscreen <canvas>
 * while preserving aspect ratio (never upscaling). If the input is already small (< 35 KB)
 * and the canvas output is larger, preserves the lighter original.
 */
export async function compressImageToDataUrl(
  input: File | string,
  options?: CompressImageOptions,
): Promise<string> {
  const maxWidth = options?.maxWidth ?? 1000;
  const maxHeight = options?.maxHeight ?? 1000;
  const mimeType = options?.mimeType ?? 'image/webp';
  const quality = options?.quality ?? 0.85;

  const originalDataUrl = typeof input === 'string' ? input : await readFileAsDataUrl(input);
  if (!originalDataUrl || typeof document === 'undefined') {
    return originalDataUrl;
  }

  // Keep tiny SVGs untouched
  if (originalDataUrl.startsWith('data:image/svg+xml') && originalDataUrl.length < 48_000) {
    return originalDataUrl;
  }

  try {
    const img = await loadImageElement(originalDataUrl);
    const srcW = img.naturalWidth || img.width || 1;
    const srcH = img.naturalHeight || img.height || 1;

    const scale = Math.min(1, maxWidth / srcW, maxHeight / srcH);
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return originalDataUrl;
    }

    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    let resultDataUrl = canvas.toDataURL(mimeType, quality);
    if (
      mimeType === 'image/webp' &&
      (!resultDataUrl || !resultDataUrl.startsWith('data:image/webp'))
    ) {
      resultDataUrl = canvas.toDataURL('image/png');
    }

    // ~35 KB binary ≈ 47,800 Base64 chars; keep original if already small and lighter
    const approxOriginalBytes = Math.floor((originalDataUrl.length * 3) / 4);
    if (approxOriginalBytes < 35 * 1024 && resultDataUrl.length >= originalDataUrl.length) {
      return originalDataUrl;
    }

    return resultDataUrl || originalDataUrl;
  } catch (err) {
    console.warn('[safeStorage] Image compression fallback to original:', err);
    return originalDataUrl;
  }
}

/**
 * Signature preset: maxWidth 500, maxHeight 200, crisp PNG (falls back to WebP 0.85 if PNG > 60 KB).
 * Turns 4–6 MB camera photos into ~10–25 KB signatures.
 */
export async function compressSignatureDataUrl(input: File | string): Promise<string> {
  const pngUrl = await compressImageToDataUrl(input, {
    maxWidth: 500,
    maxHeight: 200,
    mimeType: 'image/png',
  });
  const approxPngBytes = Math.floor((pngUrl.length * 3) / 4);
  if (approxPngBytes > 60 * 1024) {
    const webpUrl = await compressImageToDataUrl(pngUrl, {
      maxWidth: 500,
      maxHeight: 200,
      mimeType: 'image/webp',
      quality: 0.85,
    });
    if (webpUrl && webpUrl.length < pngUrl.length) {
      return webpUrl;
    }
  }
  return pngUrl;
}

/**
 * Logo preset: maxWidth 420, maxHeight 420, WebP 0.85 (with PNG fallback).
 */
export async function compressLogoDataUrl(input: File | string): Promise<string> {
  return compressImageToDataUrl(input, {
    maxWidth: 420,
    maxHeight: 420,
    mimeType: 'image/webp',
    quality: 0.85,
  });
}

/**
 * Photo preset: maxWidth 1000, maxHeight 1000, JPEG 0.78.
 */
export async function compressPhotoDataUrl(input: File | string): Promise<string> {
  return compressImageToDataUrl(input, {
    maxWidth: 1000,
    maxHeight: 1000,
    mimeType: 'image/jpeg',
    quality: 0.78,
  });
}
