import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { useAuthContext } from '~/hooks/AuthContext';
import StartupLayout from './Startup';
import store from '~/store';

export default function LoginLayout() {
  const { isAuthenticated } = useAuthContext();
  const [queriesEnabled, setQueriesEnabled] = useRecoilState<boolean>(store.queriesEnabled);
  useEffect(() => {
    setQueriesEnabled(true);
  }, [setQueriesEnabled]);
  return <StartupLayout isAuthenticated={isAuthenticated} />;
}
