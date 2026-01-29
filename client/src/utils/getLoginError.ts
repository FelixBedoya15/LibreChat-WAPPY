import { TranslationKeys } from '~/hooks';

const getLoginError = (errorText: string): TranslationKeys => {
  const defaultError: TranslationKeys = 'com_auth_error_login';

  if (!errorText) {
    return defaultError;
  }

  switch (true) {
    case errorText.includes('429'):
      return 'com_auth_error_login_rl';
    case errorText.includes('403'):
      return 'com_auth_error_login_ban';
    case errorText.includes('500'):
      return 'com_auth_error_login_server';
    case errorText.includes('Account is inactive'):
      return 'com_auth_error_login_inactive';
    case errorText.includes('Account is not yet active'):
      return 'com_auth_error_login_not_active_yet';
    case errorText.includes('422'):
      return 'com_auth_error_login_unverified';
    default:
      return defaultError;
  }
};

export default getLoginError;
