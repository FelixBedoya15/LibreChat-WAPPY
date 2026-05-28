/**
 * useAutoLoadReport — DESACTIVADO PERMANENTEMENTE
 *
 * Este hook fue deshabilitado porque causaba que informes de una empresa
 * aparecieran automáticamente al cambiar a otra empresa (cross-company bleeding).
 *
 * La carga de informes ahora es 100% manual a través del botón "Historial".
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAutoLoadReport(_params: {
    token?: string | null;
    tags?: string[];
    generatedReport?: string | null;
    handleSelectReport?: (conversationId: string) => Promise<void> | void;
}) {
    // No-op: auto-load disabled to prevent cross-company report bleeding.
}
