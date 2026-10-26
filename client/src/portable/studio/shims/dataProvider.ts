/**
 * Adaptadores mínimos para montar WappyStudioDashboard fuera del aplicativo (landing /wappystudio
 * y archivo HTML portable). Reemplazan los hooks de sesión y de configuración de LibreChat.
 */
import { useSyncExternalStore } from 'react';

/** Lista oficial de modelos (GOOGLE_MODELS del .env de producción). */
export const PORTABLE_GOOGLE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-live',
  'gemini-3.1-flash-live-preview',
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-3.8-flash-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-3.8-flash-lite-tts',
];

let googleModels: string[] = [...PORTABLE_GOOGLE_MODELS];
let snapshot = { google: { models: googleModels } } as any;
const listeners = new Set<() => void>();

/** Permite actualizar la lista si el servidor publica una distinta en /api/studio/catalog. */
export function setPortableGoogleModels(list: string[]) {
  if (!Array.isArray(list) || list.length === 0) return;
  googleModels = list;
  snapshot = { google: { models: googleModels } };
  listeners.forEach((l) => l());
}

export function getPortableGoogleModels() {
  return googleModels;
}

export function useGetEndpointsQuery() {
  const data = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
  );
  return { data, isLoading: false, isError: false };
}
