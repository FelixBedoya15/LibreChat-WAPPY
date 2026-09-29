import { Link } from 'react-router-dom';
import { ThemeSelector } from '@librechat/client';
import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { Banner } from '../Banners';
import Footer from './Footer';

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
  const isRegister = pathname.includes('register');
  const isLogin = pathname.includes('login');

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm mb-4">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm mb-4">
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
        <div className="mx-auto sm:max-w-sm mb-4">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-gradient-to-b from-[#E6F3FA] via-[#D8ECF7] to-[#C8E4F3] dark:from-[#0B111E] dark:via-[#0F172A] dark:to-[#080C14] transition-colors duration-300">
      {/* Soft Landing-style decorative clouds */}
      <div
        className="pointer-events-none absolute -top-12 -left-16 w-80 h-36 rounded-full bg-white/70 dark:bg-white/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-48 -right-12 w-96 h-40 rounded-full bg-white/60 dark:bg-white/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-24 left-1/4 w-[420px] h-44 rounded-full bg-white/50 dark:bg-white/5 blur-3xl opacity-70"
        aria-hidden="true"
      />

      <Banner />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-5 pb-2 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 hover:text-black dark:hover:text-white px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700/80 shadow-sm transition-all active:scale-95"
        >
          <span className="text-base leading-none">←</span>
          <span>Volver a WAPPY</span>
        </Link>

        <div className="flex items-center gap-2">
          {isLogin ? (
            <Link
              to="/register"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0E1300] bg-[#C7F303] hover:bg-[#b5dc02] px-3.5 py-1.5 rounded-full shadow-sm shadow-[#c7f303]/30 transition-all active:scale-95"
            >
              <span>Prueba gratis</span>
              <span className="text-xs">→</span>
            </Link>
          ) : isRegister ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-sm transition-all active:scale-95"
            >
              <span>Iniciar sesión</span>
              <span className="text-xs">→</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-sm transition-all active:scale-95"
            >
              <span>Ingresar</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Form Center Card */}
      <div className="flex flex-grow items-center justify-center py-6 px-4 z-10">
        <div className="relative w-authPageWidth overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 px-6 sm:px-8 py-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 backdrop-blur-md transition-all sm:max-w-md">
          {/* Landing Eyebrow */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-lime-400/20 text-lime-900 dark:text-lime-300 border border-lime-400/40">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
              {isRegister
                ? 'Comienza tu Prueba Gratis · 7 Días'
                : 'Acceso Seguro · Ecosistema SST'}
            </span>
          </div>

          {/* WAPPY Brand Logo inside Card */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <img
              src="/assets/Logos WAPPY/Wlogo.svg"
              className="h-9 w-auto object-contain"
              alt="WAPPY IA"
            />
            <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white flex items-center">
              WAPPY<span className="text-[#10b981] ml-0.5 text-base font-black">IA</span>
            </span>
          </div>

          {!hasStartupConfigError && !isFetching && (
            <h1
              className="mb-1 text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white"
              style={{ userSelect: 'none' }}
            >
              {header}
            </h1>
          )}

          <p className="text-center text-xs text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
            {isRegister
              ? 'Activa tu empresa en 2 minutos y accede a +20 Agentes IA especializados'
              : 'Orquestación de seguridad y salud en el trabajo con Tenshi IA'}
          </p>

          <DisplayError />

          {children}

          {!pathname.includes('2fa') && (isLogin || isRegister) && (
            <SocialLoginRender startupConfig={startupConfig} />
          )}

          {/* Quick Switch Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-center text-xs text-slate-500 dark:text-zinc-400">
            {isLogin ? (
              <p>
                ¿Aún no tienes cuenta?{' '}
                <Link to="/register" className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                  Comienza tu prueba gratis de 7 días
                </Link>
              </p>
            ) : isRegister ? (
              <p>
                ¿Ya tienes una cuenta registrada?{' '}
                <Link to="/login" className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Floating Theme Selector */}
      <div className="fixed bottom-3 left-3 z-20">
        <ThemeSelector />
      </div>

      {/* Footer */}
      <div className="z-10 pb-4">
        <Footer startupConfig={startupConfig} />
        <p className="text-center text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
          WAPPY LTDA · Ecosistema de Inteligencia Artificial para el SG-SST en Colombia
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
