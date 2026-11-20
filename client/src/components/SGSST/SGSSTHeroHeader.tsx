import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '~/utils';
import { useAuthContext } from '~/hooks';
import { PHASE_CATEGORIES } from './constants';

const companyNameCache: Record<string, string> = {};
const inflightRequests: Record<string, Promise<string>> = {};

function getActiveCompanyKey(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('wappy_active_company_id') || 'default';
}

async function fetchCompanyNameForKey(key: string, token: string): Promise<string> {
  if (companyNameCache[key]) {
    return companyNameCache[key];
  }
  if (inflightRequests[key]) {
    return inflightRequests[key];
  }
  inflightRequests[key] = fetch('/api/sgsst/company-info', {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(key !== 'default' ? { 'x-company-id': key } : {}),
    },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const name = (
        data?.companyName ||
        data?.razonSocial ||
        data?.name ||
        data?.company?.companyName ||
        ''
      ).trim();
      if (name) {
        companyNameCache[key] = name;
      }
      delete inflightRequests[key];
      return name;
    })
    .catch(() => {
      delete inflightRequests[key];
      return '';
    });

  return inflightRequests[key];
}

export function useActiveCompanyName(overrideName?: string | null): string {
  const { token } = useAuthContext();
  const [companyKey, setCompanyKey] = useState<string>(getActiveCompanyKey);
  const [resolvedName, setResolvedName] = useState<string>(
    () => (overrideName && overrideName.trim()) || companyNameCache[getActiveCompanyKey()] || '',
  );

  useEffect(() => {
    const handleCompanyChange = (e?: any) => {
      const nextKey =
        e?.detail?.companyId || localStorage.getItem('wappy_active_company_id') || 'default';
      const normalized = String(nextKey);
      setCompanyKey(normalized);
      if (companyNameCache[normalized]) {
        setResolvedName(companyNameCache[normalized]);
      }
    };
    window.addEventListener('wappy-empresa-cambiada', handleCompanyChange);
    window.addEventListener('wappy-company-changed', handleCompanyChange);
    window.addEventListener('storage', handleCompanyChange);
    return () => {
      window.removeEventListener('wappy-empresa-cambiada', handleCompanyChange);
      window.removeEventListener('wappy-company-changed', handleCompanyChange);
      window.removeEventListener('storage', handleCompanyChange);
    };
  }, []);

  useEffect(() => {
    if (overrideName && overrideName.trim()) {
      companyNameCache[companyKey] = overrideName.trim();
      setResolvedName(overrideName.trim());
      return;
    }
    if (companyNameCache[companyKey]) {
      setResolvedName(companyNameCache[companyKey]);
      return;
    }
    if (!token) return;
    let active = true;
    fetchCompanyNameForKey(companyKey, token).then((name) => {
      if (active && name) {
        setResolvedName(name);
      }
    });
    return () => {
      active = false;
    };
  }, [companyKey, overrideName, token]);

  return (overrideName && overrideName.trim()) || resolvedName || '';
}

function findFallbackDescription(categoryId?: string, title?: string): string {
  const allCategories = Object.values(PHASE_CATEGORIES).flat() as Array<{
    id: string;
    title: string;
    bioRationale?: string;
  }>;
  if (categoryId) {
    const matchById = allCategories.find((c) => c.id === categoryId);
    if (matchById?.bioRationale) return matchById.bioRationale;
  }
  if (title) {
    const normTitle = title.toLowerCase().trim();
    const matchByTitle = allCategories.find(
      (c) =>
        c.title.toLowerCase().trim() === normTitle ||
        normTitle.includes(c.title.toLowerCase().trim()) ||
        c.title.toLowerCase().trim().includes(normTitle),
    );
    if (matchByTitle?.bioRationale) return matchByTitle.bioRationale;
  }
  return '';
}

export interface SGSSTHeroHeaderProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  titleText?: string;
  categoryId?: string;
  description?: React.ReactNode;
  companyName?: string | null;
  statusLabel?: string;
  titleExtra?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disableToolbarSlot?: boolean;
}

export const SGSSTHeroHeader: React.FC<SGSSTHeroHeaderProps> = ({
  icon,
  title,
  titleText,
  categoryId,
  description,
  companyName,
  statusLabel = 'Operativo con IA',
  titleExtra,
  badges,
  actions,
  children,
  className,
  disableToolbarSlot = false,
}) => {
  const effectiveCompanyName = useActiveCompanyName(companyName);
  const effectiveDescription =
    description ??
    findFallbackDescription(
      categoryId,
      titleText || (typeof title === 'string' ? title : undefined),
    );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* NIVEL 1: Identidad + Descripción a ancho completo */}
        <div className="flex items-start gap-4 min-w-0 w-full">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10">
            {icon}
          </div>

          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
                {title}
              </h2>
              {effectiveCompanyName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  <Building2 className="w-3.5 h-3.5" /> {effectiveCompanyName}
                </span>
              )}
              {statusLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {statusLabel}
                </span>
              )}
              {titleExtra}
            </div>

            {effectiveDescription && (
              <div className="text-xs text-text-secondary w-full leading-relaxed">
                {effectiveDescription}
              </div>
            )}
          </div>
        </div>

        {/* NIVEL 2: BOTONERA PRINCIPAL WAPPY 14-GROUP DESIGN SYSTEM (Riel dedicado anti-salto) */}
        {(actions || !disableToolbarSlot) && (
          <div
            data-sgsst-toolbar-rail
            className={cn(
              'w-full border-t border-teal-500/15 pt-3.5',
              !actions &&
                'hidden has-[button]:block has-[a]:block has-[select]:block has-[input]:block',
            )}
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-start gap-2 min-w-0 sm:overflow-x-auto py-2.5 -my-2.5 px-1.5 -mx-1.5 [scrollbar-width:thin] [&>div]:shrink-0">
              {actions}
              {!disableToolbarSlot && (
                <div data-sgsst-hero-toolbar-slot className="contents [&>div]:shrink-0" />
              )}
            </div>
          </div>
        )}

        {/* NIVEL 3: INSIGNIAS / CONTADORES / CUMPLIMIENTO LEGAL (Riel dedicado inferior) */}
        {badges && (
          <div
            data-sgsst-badges-rail
            className="flex flex-wrap sm:flex-nowrap items-center justify-start gap-2 min-w-0 sm:overflow-x-auto py-2.5 -my-2.5 px-1.5 -mx-1.5 [scrollbar-width:thin]"
          >
            {badges}
          </div>
        )}
      </div>

      {children && <div className="relative z-10 mt-5">{children}</div>}
    </div>
  );
};

export default SGSSTHeroHeader;
