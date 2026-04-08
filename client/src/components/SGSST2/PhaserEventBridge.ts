/**
 * PhaserEventBridge.ts
 * Puente de comunicación bidireccional entre el mundo Phaser y el estado React.
 * Phaser emite eventos globales en window, React los escucha con addEventListener.
 */

export type SSTModule = 'plan' | 'do' | 'check' | 'act';

export interface PhaserNavigateEvent {
  module: SSTModule;
}

/** Phaser → React: solicitar navegación a un módulo SST */
export function emitNavigateToModule(module: SSTModule) {
  window.dispatchEvent(
    new CustomEvent<PhaserNavigateEvent>('sst-map-navigate', { detail: { module } })
  );
}

/** React → Phaser: notificar que el HP del avatar cambia */
export function emitHPUpdate(hp: number) {
  window.dispatchEvent(new CustomEvent('sst-map-hp', { detail: { hp } }));
}

/** React hook para escuchar eventos de navegación desde Phaser */
export function onNavigateToModule(cb: (module: SSTModule) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<PhaserNavigateEvent>).detail.module);
  window.addEventListener('sst-map-navigate', handler);
  return () => window.removeEventListener('sst-map-navigate', handler);
}
