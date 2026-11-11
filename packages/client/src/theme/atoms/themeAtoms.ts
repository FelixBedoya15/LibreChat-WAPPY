import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { IThemeRGB } from '../types';

const safeThemeStorage: Storage = {
  get length() {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    try {
      return window.localStorage.length;
    } catch {
      return 0;
    }
  },
  clear() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  },
  getItem(key: string) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  key(index: number) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.key(index);
    } catch {
      return null;
    }
  },
  removeItem(key: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[themeAtoms] Failed to persist "${key}" to localStorage:`, err);
    }
  },
};

/**
 * Atom for storing the theme mode (light/dark/system) in localStorage
 * Key: 'color-theme'
 */
export const themeModeAtom = atomWithStorage<string>(
  'color-theme',
  'system',
  createJSONStorage<string>(() => safeThemeStorage),
  {
    getOnInit: true,
  },
);

/**
 * Atom for storing custom theme colors in localStorage
 * Key: 'theme-colors'
 */
export const themeColorsAtom = atomWithStorage<IThemeRGB | undefined>(
  'theme-colors',
  undefined,
  createJSONStorage<IThemeRGB | undefined>(() => safeThemeStorage),
  {
    getOnInit: true,
  },
);

/**
 * Atom for storing the theme name in localStorage
 * Key: 'theme-name'
 */
export const themeNameAtom = atomWithStorage<string | undefined>(
  'theme-name',
  undefined,
  createJSONStorage<string | undefined>(() => safeThemeStorage),
  {
    getOnInit: true,
  },
);
