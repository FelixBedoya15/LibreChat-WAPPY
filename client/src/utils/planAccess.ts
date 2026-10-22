/**
 * planAccess.ts
 * ──────────────
 * Reglas de acceso a la plataforma según los planes activos de WAPPY.
 *
 * REGLAS DE NEGOCIO:
 * 1. Los planes Gratis, Go y Plus están eliminados e inactivos.
 * 2. Cuentas con Plan Vital (antes IPEVAR / USER_IPEVAR): Activas de por vida.
 * 3. Cuentas con Plan Wappy Pro (USER_PRO): Activas mientras inactiveAt no haya expirado.
 * 4. Administradores (ADMIN) y Sub-usuarios (isSubUser): Acceso activo.
 * 5. Cualquier otra cuenta (USER, USER_GO, USER_PLUS, sin plan, o Pro expirado):
 *    No tiene acceso a las herramientas internas y debe ser redirigida a /planes.
 */

export const hasActivePlan = (user: any): boolean => {
  if (!user) return false;

  // Administrador siempre tiene acceso
  if (user.role === 'ADMIN') return true;

  // Sub-usuarios autorizados bajo cuenta corporativa / padre
  if (user.isSubUser) return true;

  // Si el estado de la cuenta está explícitamente inactivo
  if (user.accountStatus === 'inactive') return false;

  // Plan Vital (anteriormente IPEVAR / Vital):
  // - Los usuarios que ya lo tenían de por vida (inactiveAt null) lo conservan infinito.
  // - Las nuevas suscripciones o asignaciones son anuales (1 año) y se controlan por inactiveAt.
  const isVital =
    ['USER_IPEVAR', 'IPEVAR', 'USER_VITAL', 'VITAL'].includes(user.role) ||
    ['ipevar', 'vital'].includes(user.plan);
  if (isVital) {
    if (user.inactiveAt && new Date(user.inactiveAt).getTime() <= Date.now()) {
      return false; // Plan Vital anual expirado
    }
    return true; // Plan Vital activo (o infinito de por vida si inactiveAt es null)
  }

  // Plan Wappy Pro: Activo mientras la fecha inactiveAt no haya vencido
  const isPro = user.role === 'USER_PRO' || user.plan === 'pro';
  if (isPro) {
    if (user.inactiveAt && new Date(user.inactiveAt).getTime() <= Date.now()) {
      return false; // Plan Pro expirado
    }
    return true;
  }

  // Cualquier otro rol o plan eliminado (USER, USER_GO, USER_PLUS, free, go, plus)
  return false;
};

/**
 * Indica si el usuario pertenece al plan Wappy Vital (USER_IPEVAR / IPEVAR / plan 'ipevar').
 * Los administradores NUNCA se consideran Vital (ven todo: Somos SST y Huella Biocéntrica).
 *
 * Alcance del plan Wappy Vital:
 *  - Acceso a toda la plataforma excepto "Somos SST" (los 8 hitos).
 *  - En su lugar ve "Huella Biocéntrica" (Hito 2 + Matriz Bio-IPEVR del Hito 4).
 *  - Sin pestaña "Plan Empresa" en la Academia.
 *  - Sin Automatizaciones IA ni su Historial & Reportes en el Centro de Control.
 *  - Portal público del trabajador: solo formulario QR de Perfil Sociodemográfico.
 */
export const isVitalUser = (user: any): boolean => {
  if (!user) return false;
  if (user.role === 'ADMIN') return false;
  return (
    ['USER_IPEVAR', 'IPEVAR', 'USER_VITAL', 'VITAL'].includes(user.role) ||
    ['ipevar', 'vital'].includes(user.plan)
  );
};

/** Admin de la plataforma (rol ADMIN). */
export const isPlatformAdmin = (user: any): boolean => user?.role === 'ADMIN';

/** Indica si el usuario pertenece al plan Wappy Pro (no Admin ni Vital). */
export const isProUser = (user: any): boolean => {
  if (!user) return false;
  if (user.role === 'ADMIN') return false;
  return user.role === 'USER_PRO' || user.role === 'PRO';
};
