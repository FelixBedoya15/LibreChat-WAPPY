/** Sesión anónima para la versión portable: sin token; las llamadas usan las Claves IA del usuario. */
export function useAuthContext() {
  return {
    user: { name: 'WAPPY Studio', role: 'PORTABLE' } as any,
    token: '',
    isAuthenticated: false,
  };
}
