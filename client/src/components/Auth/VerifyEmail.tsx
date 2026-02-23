import { useState, useEffect, useMemo, useCallback } from 'react';
import { Spinner, ThemeSelector } from '@librechat/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVerifyEmailMutation, useResendVerificationEmail } from '~/data-provider';
import { useLocalize } from '~/hooks';

/* ─── Animated Email SVGs ──────────────────────────────────────────── */
const EmailSuccessSVG = () => (
  <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" fill="none">
    <defs>
      <linearGradient id="mailSuccGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    {/* Envelope body */}
    <rect x="15" y="35" width="90" height="60" rx="8" stroke="url(#mailSuccGrad)" strokeWidth="2.5" opacity="0.15" fill="url(#mailSuccGrad)">
      <animate attributeName="opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" />
    </rect>
    <rect x="15" y="35" width="90" height="60" rx="8" stroke="url(#mailSuccGrad)" strokeWidth="2.5" fill="none">
      <animate attributeName="stroke-dasharray" from="0 320" to="320 0" dur="1.5s" fill="freeze" />
    </rect>
    {/* Envelope flap */}
    <path d="M15 35L60 65L105 35" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" fill="none" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="0.8s" dur="0.5s" fill="freeze" />
    </path>
    {/* Check circle */}
    <circle cx="85" cy="35" r="18" fill="#22c55e" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="1.5s" dur="0.3s" fill="freeze" />
    </circle>
    <path d="M77 35L83 41L93 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="1.8s" dur="0.3s" fill="freeze" />
      <animate attributeName="stroke-dasharray" from="0 30" to="30 0" begin="1.8s" dur="0.5s" fill="freeze" />
    </path>
    {/* Sparkles */}
    <circle cx="30" cy="28" r="2" fill="#22c55e" opacity="0">
      <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="2.2s" repeatCount="indefinite" />
    </circle>
    <circle cx="95" cy="85" r="1.5" fill="#10b981" opacity="0">
      <animate attributeName="opacity" values="0;0.6;0" dur="1.8s" begin="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="20" cy="75" r="1" fill="#22c55e" opacity="0">
      <animate attributeName="opacity" values="0;0.7;0" dur="2.2s" begin="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const EmailErrorSVG = () => (
  <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" fill="none">
    <defs>
      <linearGradient id="mailErrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
    </defs>
    <rect x="15" y="35" width="90" height="60" rx="8" stroke="url(#mailErrGrad)" strokeWidth="2.5" opacity="0.15" fill="url(#mailErrGrad)">
      <animate attributeName="opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" />
    </rect>
    <rect x="15" y="35" width="90" height="60" rx="8" stroke="url(#mailErrGrad)" strokeWidth="2.5" fill="none">
      <animate attributeName="stroke-dasharray" from="0 320" to="320 0" dur="1.5s" fill="freeze" />
    </rect>
    <path d="M15 35L60 65L105 35" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" fill="none" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="0.8s" dur="0.5s" fill="freeze" />
    </path>
    {/* X circle */}
    <circle cx="85" cy="35" r="18" fill="#ef4444" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="1.5s" dur="0.3s" fill="freeze" />
    </circle>
    <line x1="79" y1="29" x2="91" y2="41" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="1.8s" dur="0.3s" fill="freeze" />
    </line>
    <line x1="91" y1="29" x2="79" y2="41" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0">
      <animate attributeName="opacity" from="0" to="1" begin="2s" dur="0.3s" fill="freeze" />
    </line>
  </svg>
);

const EmailLoadingSVG = () => (
  <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" fill="none">
    <defs>
      <linearGradient id="mailLoadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
    <rect x="15" y="35" width="90" height="60" rx="8" stroke="url(#mailLoadGrad)" strokeWidth="2.5" fill="none">
      <animate attributeName="stroke-dasharray" values="0 320;160 160;320 0;160 160;0 320" dur="3s" repeatCount="indefinite" />
    </rect>
    <path d="M15 35L60 65L105 35" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" fill="none" opacity="0.5">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
    </path>
    <circle cx="60" cy="20" r="4" fill="#22c55e" opacity="0.4">
      <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ─── Background Particles ─────────────────────────────────────────── */
const VerifyParticles = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg className="absolute h-full w-full">
      <circle cx="20%" cy="25%" r="50" fill="#22c55e" opacity="0.04">
        <animate attributeName="r" values="40;60;40" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="80%" cy="70%" r="35" fill="#10b981" opacity="0.04">
        <animate attributeName="r" values="25;45;25" dur="10s" repeatCount="indefinite" />
      </circle>
      <circle cx="88%" cy="15%" r="2.5" fill="#22c55e" opacity="0.1">
        <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="10%" cy="80%" r="2" fill="#10b981" opacity="0.08">
        <animate attributeName="opacity" values="0.04;0.12;0.04" dur="5s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

function VerifyEmail() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const [params] = useSearchParams();

  const [countdown, setCountdown] = useState<number>(3);
  const [headerText, setHeaderText] = useState<string>('');
  const [showResendLink, setShowResendLink] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const token = useMemo(() => params.get('token') || '', [params]);
  const email = useMemo(() => params.get('email') || '', [params]);

  const countdownRedirect = useCallback(() => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          navigate('/c/new', { replace: true });
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);
  }, [navigate]);

  const verifyEmailMutation = useVerifyEmailMutation({
    onSuccess: () => {
      setHeaderText(localize('com_auth_email_verification_success'));
      setVerificationStatus(true);
      setIsSuccess(true);
      countdownRedirect();
    },
    onError: () => {
      setHeaderText(localize('com_auth_email_verification_failed'));
      setShowResendLink(true);
      setVerificationStatus(true);
      setIsSuccess(false);
    },
  });

  const resendEmailMutation = useResendVerificationEmail({
    onSuccess: () => {
      setHeaderText(localize('com_auth_email_resent_success'));
      setIsSuccess(true);
      countdownRedirect();
    },
    onError: () => {
      setHeaderText(localize('com_auth_email_resent_failed'));
      setIsSuccess(false);
    },
    onMutate: () => setShowResendLink(false),
  });

  const handleResendEmail = () => {
    resendEmailMutation.mutate({ email });
  };

  useEffect(() => {
    if (verificationStatus || verifyEmailMutation.isLoading) {
      return;
    }

    if (token && email) {
      verifyEmailMutation.mutate({ email, token });
    } else {
      if (email) {
        setHeaderText(localize('com_auth_email_verification_failed_token_missing'));
      } else {
        setHeaderText(localize('com_auth_email_verification_invalid'));
      }
      setShowResendLink(true);
      setVerificationStatus(true);
      setIsSuccess(false);
    }
  }, [token, email, verificationStatus, verifyEmailMutation]);

  const VerificationSuccess = () => (
    <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border-medium/30 bg-white/80 p-8 shadow-xl shadow-green-500/[0.03] backdrop-blur-sm dark:bg-gray-900/80">
      {isSuccess ? <EmailSuccessSVG /> : <EmailErrorSVG />}
      <h1 className="mt-6 text-center text-2xl font-bold text-text-primary">
        {headerText}
      </h1>
      {countdown > 0 && isSuccess && (
        <p className="mt-4 text-center text-sm text-text-secondary">
          {localize('com_auth_email_verification_redirecting', { 0: countdown.toString() })}
        </p>
      )}
      {showResendLink && (
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            {localize('com_auth_email_verification_resend_prompt')}
          </p>
          <button
            className="mt-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 transition-all hover:bg-green-500/20 dark:text-green-400"
            onClick={handleResendEmail}
            disabled={resendEmailMutation.isLoading}
          >
            {localize('com_auth_email_resend_link')}
          </button>
        </div>
      )}
    </div>
  );

  const VerificationInProgress = () => (
    <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border-medium/30 bg-white/80 p-8 shadow-xl shadow-green-500/[0.03] backdrop-blur-sm dark:bg-gray-900/80">
      <EmailLoadingSVG />
      <h1 className="mt-6 text-center text-2xl font-bold text-text-primary">
        {localize('com_auth_email_verification_in_progress')}
      </h1>
      <div className="mt-4 flex justify-center">
        <Spinner className="h-8 w-8 text-green-500" />
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-6 dark:bg-gray-900 sm:pt-0">
      <VerifyParticles />
      <div className="absolute bottom-0 left-0 m-4">
        <ThemeSelector />
      </div>
      {verificationStatus ? <VerificationSuccess /> : <VerificationInProgress />}
    </div>
  );
}

export default VerifyEmail;
