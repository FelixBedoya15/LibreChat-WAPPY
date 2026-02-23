import { ThemeSelector } from '@librechat/client';
import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { BlinkAnimation } from './BlinkAnimation';
import { Banner } from '../Banners';
import Footer from './Footer';

/* ─── Animated Background Particles ────────────────────────────────── */
const FloatingParticles = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg className="absolute h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="authGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="authGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Large floating circle - top right */}
      <circle cx="85%" cy="15%" r="120" fill="url(#authGrad1)">
        <animate attributeName="cy" values="15%;18%;15%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="cx" values="85%;82%;85%" dur="12s" repeatCount="indefinite" />
      </circle>

      {/* Medium circle - bottom left */}
      <circle cx="10%" cy="80%" r="80" fill="url(#authGrad2)">
        <animate attributeName="cy" values="80%;76%;80%" dur="10s" repeatCount="indefinite" />
        <animate attributeName="cx" values="10%;14%;10%" dur="14s" repeatCount="indefinite" />
      </circle>

      {/* Small pulsing dot - center left */}
      <circle cx="5%" cy="45%" r="4" fill="#22c55e" opacity="0.15">
        <animate attributeName="r" values="3;6;3" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Small pulsing dot - center right */}
      <circle cx="92%" cy="55%" r="3" fill="#10b981" opacity="0.12">
        <animate attributeName="r" values="2;5;2" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="5s" repeatCount="indefinite" />
      </circle>

      {/* Hexagon outline - top left */}
      <polygon
        points="60,20 80,30 80,50 60,60 40,50 40,30"
        fill="none"
        stroke="#22c55e"
        strokeWidth="0.8"
        opacity="0.08"
        transform="translate(40, 120)"
      >
        <animateTransform attributeName="transform" type="rotate" values="0 60 40;360 60 40" dur="30s" repeatCount="indefinite" />
      </polygon>

      {/* Hexagon outline - bottom right */}
      <polygon
        points="60,20 80,30 80,50 60,60 40,50 40,30"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="0.6"
        opacity="0.06"
        transform="translate(700, 500)"
      >
        <animateTransform attributeName="transform" type="rotate" values="360 60 40;0 60 40" dur="25s" repeatCount="indefinite" />
      </polygon>

      {/* Tiny floating dots */}
      <circle cx="30%" cy="25%" r="2" fill="#22c55e" opacity="0.1">
        <animate attributeName="cy" values="25%;22%;25%" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="70%" cy="70%" r="1.5" fill="#10b981" opacity="0.1">
        <animate attributeName="cy" values="70%;73%;70%" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="50%" cy="90%" r="2.5" fill="#0ea5e9" opacity="0.06">
        <animate attributeName="cx" values="50%;53%;50%" dur="9s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold text-green-600 hover:underline" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <FloatingParticles />
      <Banner />
      <BlinkAnimation active={isFetching}>
        <div className="mt-6 h-24 w-full bg-cover sm:h-32 md:h-40">
          <img
            src="assets/logo.svg"
            className="h-full w-full object-contain drop-shadow-sm"
            alt={localize('com_ui_logo', { 0: startupConfig?.appTitle ?? 'LibreChat' })}
          />
        </div>
      </BlinkAnimation>
      <DisplayError />
      <div className="absolute bottom-0 left-0 md:m-4">
        <ThemeSelector />
      </div>

      <div className="flex flex-grow items-center justify-center">
        <div className="relative w-authPageWidth overflow-hidden rounded-2xl border border-border-medium/30 bg-white/80 px-6 py-4 shadow-xl shadow-green-500/[0.03] backdrop-blur-sm transition-all dark:bg-gray-900/80 sm:max-w-md">
          {!hasStartupConfigError && !isFetching && (
            <h1
              className="mb-4 text-center text-3xl font-semibold text-black dark:text-white"
              style={{ userSelect: 'none' }}
            >
              {header}
            </h1>
          )}
          {children}
          {!pathname.includes('2fa') &&
            (pathname.includes('login') || pathname.includes('register')) && (
              <SocialLoginRender startupConfig={startupConfig} />
            )}
        </div>
      </div>
      <Footer startupConfig={startupConfig} />
    </div>
  );
}

export default AuthLayout;
