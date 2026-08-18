import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks/AuthContext';

export default function useAmbassadorAccess() {
  const { user, isAuthenticated } = useAuthContext();
  const [isPartner, setIsPartner] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const isAdmin = user?.role === 'ADMIN' || user?.email?.toLowerCase() === 'felix.bedoya15@gmail.com';
  const hasRoleAccess = isAdmin || user?.role === 'EMBAJADOR' || user?.role === 'EMBAJADOR_LIDER';

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) {
      setIsPartner(false);
      setLoading(false);
      return;
    }

    if (hasRoleAccess) {
      setIsPartner(true);
      setLoading(false);
      return;
    }

    // Check if user is an approved partner in DB
    axios
      .get('/api/referrals/partner/stats')
      .then((res) => {
        if (isMounted) {
          setIsPartner(!!res.data?.isPartner);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsPartner(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, hasRoleAccess]);

  return {
    hasAmbassadorAccess: hasRoleAccess || isPartner,
    isAdmin,
    loading,
  };
}
