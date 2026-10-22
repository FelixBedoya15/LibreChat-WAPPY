import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks/AuthContext';

export default function useAmbassadorAccess() {
  const { user, isAuthenticated } = useAuthContext();

  const isAdmin = user?.role === 'ADMIN';
  const hasRoleAccess =
    Boolean(isAuthenticated) &&
    (isAdmin || user?.role === 'EMBAJADOR' || user?.role === 'EMBAJADOR_LIDER');

  return {
    hasAmbassadorAccess: hasRoleAccess,
    isAdmin,
    loading: false,
  };
}
