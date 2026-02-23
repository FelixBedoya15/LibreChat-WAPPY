/* eslint-disable i18next/no-literal-string */
import { Button } from '@librechat/client';
import { useRouteError } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import logger from '~/utils/logger';

interface UserAgentData {
  getHighEntropyValues(hints: string[]): Promise<{ platform: string; platformVersion: string }>;
}

type PlatformInfo = {
  os: string;
  version?: string;
};

const formatStackTrace = (stack: string) => {
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => ({
      number: i + 1,
      content: line,
    }));
};

const getPlatformInfo = async (): Promise<PlatformInfo> => {
  if ('userAgentData' in navigator) {
    try {
      const ua = navigator.userAgentData as UserAgentData;
      const highEntropyValues = await ua.getHighEntropyValues(['platform', 'platformVersion']);
      return {
        os: highEntropyValues.platform,
        version: highEntropyValues.platformVersion,
      };
    } catch (e) {
      logger.warn('Failed to get high entropy values');
      logger.error(e);
    }
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) {
    return { os: 'macOS' };
  }
  if (userAgent.includes('win')) {
    return { os: 'Windows' };
  }
  if (userAgent.includes('linux')) {
    return { os: 'Linux' };
  }
  if (userAgent.includes('android')) {
    return { os: 'Android' };
  }
  if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return { os: 'iOS' };
  }

  return { os: 'Unknown' };
};

const getBrowserInfo = async () => {
  const platformInfo = await getPlatformInfo();
  return {
    userAgent: navigator.userAgent,
    platform: platformInfo.os,
    platformVersion: platformInfo.version,
    language: navigator.language,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
  };
};

/* ─── Animated Error SVG ───────────────────────────────────────────── */
const BrokenShieldSVG = () => (
  <svg viewBox="0 0 120 120" className="mx-auto h-32 w-32" fill="none">
    <defs>
      <linearGradient id="errGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
    </defs>
    {/* Shield outline */}
    <path
      d="M60 10L20 30V55C20 78.5 37.5 100 60 106C82.5 100 100 78.5 100 55V30L60 10Z"
      stroke="url(#errGrad)"
      strokeWidth="2.5"
      opacity="0.2"
      fill="url(#errGrad)"
    >
      <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
    </path>
    <path
      d="M60 10L20 30V55C20 78.5 37.5 100 60 106C82.5 100 100 78.5 100 55V30L60 10Z"
      stroke="url(#errGrad)"
      strokeWidth="2.5"
      fill="none"
    >
      <animate attributeName="stroke-dasharray" from="0 350" to="350 0" dur="2s" fill="freeze" />
    </path>
    {/* Crack line */}
    <path
      d="M50 35L55 52L45 58L55 72L48 85"
      stroke="#ef4444"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0"
    >
      <animate attributeName="opacity" from="0" to="0.8" begin="1.2s" dur="0.5s" fill="freeze" />
      <animate attributeName="stroke-dasharray" from="0 80" to="80 0" begin="1.2s" dur="0.8s" fill="freeze" />
    </path>
    {/* X mark */}
    <line x1="65" y1="50" x2="78" y2="63" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="1.8s" dur="0.3s" fill="freeze" />
    </line>
    <line x1="78" y1="50" x2="65" y2="63" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="2s" dur="0.3s" fill="freeze" />
    </line>
    {/* Sparks */}
    <circle cx="42" cy="40" r="1.5" fill="#f97316" opacity="0">
      <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="80" cy="42" r="1" fill="#ef4444" opacity="0">
      <animate attributeName="opacity" values="0;1;0" dur="2s" begin="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="55" cy="90" r="1.2" fill="#f97316" opacity="0">
      <animate attributeName="opacity" values="0;0.8;0" dur="1.8s" begin="2.8s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ─── Background Particles ─────────────────────────────────────────── */
const ErrorParticles = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg className="absolute h-full w-full">
      <circle cx="15%" cy="20%" r="60" fill="#ef4444" opacity="0.03">
        <animate attributeName="r" values="50;70;50" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="85%" cy="75%" r="45" fill="#f97316" opacity="0.03">
        <animate attributeName="r" values="35;55;35" dur="10s" repeatCount="indefinite" />
      </circle>
      <circle cx="90%" cy="10%" r="3" fill="#ef4444" opacity="0.08">
        <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="8%" cy="85%" r="2" fill="#f97316" opacity="0.08">
        <animate attributeName="opacity" values="0.05;0.12;0.05" dur="5s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

export default function RouteErrorBoundary() {
  const localize = useLocalize();
  const typedError = useRouteError() as {
    message?: string;
    stack?: string;
    status?: number;
    statusText?: string;
    data?: unknown;
  };

  const errorDetails = {
    message: typedError.message ?? 'An unexpected error occurred',
    stack: typedError.stack,
    status: typedError.status,
    statusText: typedError.statusText,
    data: typedError.data,
  };

  const handleDownloadLogs = async () => {
    try {
      const browser = await getBrowserInfo();
      const errorLog = {
        timestamp: new Date().toISOString(),
        browser,
        error: {
          ...errorDetails,
          stack:
            errorDetails.stack != null && errorDetails.stack.trim() !== ''
              ? formatStackTrace(errorDetails.stack)
              : undefined,
        },
      };

      const blob = new Blob([JSON.stringify(errorLog, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-log-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.warn('Failed to download error logs:');
      logger.error(e);
    }
  };

  const handleCopyStack = async () => {
    if (errorDetails.stack != null && errorDetails.stack !== '') {
      await navigator.clipboard.writeText(errorDetails.stack);
    }
  };

  return (
    <div
      role="alert"
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface-primary"
    >
      <ErrorParticles />
      <div className="relative mx-4 w-11/12 max-w-4xl rounded-2xl border border-border-light/50 bg-surface-primary/60 p-8 shadow-2xl shadow-red-500/[0.03] backdrop-blur-xl">
        <BrokenShieldSVG />
        <h2 className="mb-6 mt-4 text-center text-3xl font-medium tracking-tight text-text-primary">
          ¡Algo inesperado ocurrió!
        </h2>

        {/* Error Message */}
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-gray-600 dark:text-gray-200">
          <h3 className="mb-2 font-medium">Error:</h3>
          <pre className="whitespace-pre-wrap text-sm font-light leading-relaxed text-text-primary">
            {errorDetails.message}
          </pre>
        </div>

        {/* Status Information */}
        {(typeof errorDetails.status === 'number' ||
          typeof errorDetails.statusText === 'string') && (
            <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-text-primary">
              <h3 className="mb-2 font-medium">Estado:</h3>
              <p className="text-text-primary">
                {typeof errorDetails.status === 'number' && `${errorDetails.status} `}
                {typeof errorDetails.statusText === 'string' && errorDetails.statusText}
              </p>
            </div>
          )}

        {/* Stack Trace - Collapsible */}
        {errorDetails.stack != null && errorDetails.stack.trim() !== '' && (
          <details className="group mb-4 rounded-xl border border-border-light p-4">
            <summary className="mb-2 flex cursor-pointer items-center justify-between text-sm font-medium text-text-primary">
              <span>Stack Trace</span>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyStack}
                  className="ml-2 px-2 py-1 text-xs"
                  aria-label={localize('com_ui_copy_stack_trace')}
                >
                  Copiar
                </Button>
              </div>
            </summary>
            <div className="overflow-x-auto rounded-lg bg-black/5 p-4 dark:bg-white/5">
              {formatStackTrace(errorDetails.stack).map(({ number, content }) => (
                <div key={number} className="flex">
                  <span className="select-none pr-4 font-mono text-xs text-text-secondary">
                    {String(number).padStart(3, '0')}
                  </span>
                  <pre className="flex-1 font-mono text-xs leading-relaxed text-text-primary">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Additional Error Data */}
        {errorDetails.data != null && (
          <details className="group mb-4 rounded-xl border border-border-light p-4">
            <summary className="mb-2 flex cursor-pointer items-center justify-between text-sm font-medium text-text-primary">
              <span>Detalles adicionales</span>
              <span className="transition-transform group-open:rotate-90">{'>'}</span>
            </summary>
            <pre className="whitespace-pre-wrap text-xs font-light leading-relaxed text-text-primary">
              {JSON.stringify(errorDetails.data, null, 2)}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-4">
          <p className="text-sm font-light text-text-secondary">Por favor intente lo siguiente:</p>
          <ul className="list-inside list-disc text-sm text-text-secondary">
            <li>Refrescar la página</li>
            <li>Limpiar la caché del navegador</li>
            <li>Verificar su conexión a Internet</li>
            <li>Contactar al administrador si el problema persiste</li>
          </ul>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              variant="submit"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
              aria-label={localize('com_ui_refresh_page')}
            >
              {localize('com_ui_refresh_page')}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadLogs}
              className="w-full sm:w-auto"
              aria-label={localize('com_ui_download_error_logs')}
            >
              {localize('com_ui_download_error_logs')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
