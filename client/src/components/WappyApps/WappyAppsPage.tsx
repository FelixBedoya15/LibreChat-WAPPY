import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowUpRight, Clock, LayoutGrid, Megaphone, Search, CheckCircle2, Lock } from 'lucide-react';
import { useMediaQuery } from '@librechat/client';
import type { ContextType } from '~/common';
import { useDocumentTitle } from '~/hooks';
import { OpenSidebar } from '~/components/Chat/Menus';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { cn } from '~/utils';
import {
  WAPPY_APPS_CATALOG,
  resolveWappyAppUrl,
  type WappyAppCatalogItem,
} from './wappyAppsCatalog';
import InstagramFollowGateModal, {
  useInstagramFollowGate,
  appendIgPassToUrl,
} from './InstagramFollowGateModal';

type AppsFilter = 'all' | 'active' | 'soon';

const FILTERS: { id: AppsFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Disponibles' },
  { id: 'soon', label: 'Próximamente' },
];

/** Cabecera visual de cada tarjeta (imagen real o composición con el ícono de la app). */
function AppCardVisual({ app }: { app: WappyAppCatalogItem }) {
  if (app.image) {
    return (
      <img
        src={app.image}
        alt={app.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }

  if (app.visualType === 'wappy-podcast') {
    return (
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#070d18] via-[#0c192e] to-[#0e1300] p-2.5 sm:p-3">
        {/* Glows ambientales */}
        <div className="pointer-events-none absolute -left-4 -top-4 h-24 w-24 rounded-full bg-[#c7f303]/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 rounded-full bg-teal-500/30 blur-2xl" />

        {/* Header Superior: Apple Podcasts × Walkman */}
        <div className="z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span className="text-[10px] font-black tracking-wider text-[#c7f303]">
              APPLE PODCASTS × WAPPY WALKMAN
            </span>
          </div>
          <span className="rounded-md border border-teal-400/40 bg-teal-500/20 px-1.5 py-0.5 text-[8.5px] font-black text-teal-200">
            24kHz MASTER WAV
          </span>
        </div>

        {/* Composición Central: Walkman Cassette WAPPY (Izq) + Portadas Apple Podcasts (Der) */}
        <div className="z-10 grid grid-cols-[1.15fr_0.85fr] items-center gap-2">
          {/* Walkman Cassette WAPPY 24kHz */}
          <div className="flex flex-col gap-1 rounded-xl border border-[#c7f303]/45 bg-gradient-to-b from-[#18240f] via-[#0e1300] to-[#080d04] p-1.5 shadow-lg">
            {/* Etiqueta Vintage C-60 */}
            <div className="flex items-center justify-between rounded bg-gradient-to-r from-[#c7f303] to-lime-400 px-1.5 py-0.5 text-[#0e1300]">
              <span className="text-[7.5px] font-black tracking-tight">WAPPY C-60 • 24kHz</span>
              <span className="rounded bg-[#0e1300] px-1 py-0.2 text-[6.5px] font-bold text-[#c7f303]">TYPE II</span>
            </div>

            {/* Ventana de Cassette con carretes SVG giratorios */}
            <div className="relative flex h-9 items-center justify-between overflow-hidden rounded-md border border-white/10 bg-[#090e05] px-2">
              {/* Cinta Magnética */}
              <div className="absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 border-y border-[#3d2a17] bg-[#261a0d]" />

              {/* Carrete Izquierdo con SVG animado */}
              <svg width="24" height="24" viewBox="0 0 100 100" className="relative z-10 shrink-0">
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="360 50 50"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                  <circle cx="50" cy="50" r="46" fill="#1f2937" stroke="#9ca3af" strokeWidth="3" />
                  <circle cx="50" cy="50" r="28" fill="#111827" stroke="#4b5563" strokeWidth="2" />
                  <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#111827" strokeWidth="4" />
                  <rect x="47" y="24" width="6" height="8" rx="2" fill="#c7f303" />
                  <rect x="47" y="68" width="6" height="8" rx="2" fill="#c7f303" />
                  <rect x="24" y="47" width="8" height="6" rx="2" fill="#c7f303" />
                  <rect x="68" y="47" width="8" height="6" rx="2" fill="#c7f303" />
                </g>
              </svg>

              {/* Display de Minutos y VU Meter */}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <span className="rounded bg-black/80 px-1 py-0.2 font-mono text-[7px] font-black text-[#c7f303]">
                  04:20
                </span>
                <div className="flex h-2 items-end gap-0.5">
                  <span className="h-[70%] w-0.5 rounded-xs bg-emerald-400" />
                  <span className="h-[90%] w-0.5 rounded-xs bg-[#c7f303]" />
                  <span className="h-[40%] w-0.5 rounded-xs bg-amber-400" />
                  <span className="h-full w-0.5 rounded-xs bg-red-500" />
                </div>
              </div>

              {/* Carrete Derecho con SVG animado */}
              <svg width="24" height="24" viewBox="0 0 100 100" className="relative z-10 shrink-0">
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="360 50 50"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                  <circle cx="50" cy="50" r="46" fill="#1f2937" stroke="#9ca3af" strokeWidth="3" />
                  <circle cx="50" cy="50" r="28" fill="#111827" stroke="#4b5563" strokeWidth="2" />
                  <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#111827" strokeWidth="4" />
                  <rect x="47" y="24" width="6" height="8" rx="2" fill="#c7f303" />
                  <rect x="47" y="68" width="6" height="8" rx="2" fill="#c7f303" />
                  <rect x="24" y="47" width="8" height="6" rx="2" fill="#c7f303" />
                  <rect x="68" y="47" width="8" height="6" rx="2" fill="#c7f303" />
                </g>
              </svg>
            </div>

            {/* Mini Botonera Walkman */}
            <div className="flex justify-between gap-1 text-[6.5px] font-black">
              <span className="flex-1 rounded bg-slate-800 py-0.5 text-center text-slate-300">REW</span>
              <span className="flex-[1.4] rounded bg-[#c7f303] py-0.5 text-center text-[#0e1300]">PLAY ▶</span>
              <span className="flex-1 rounded bg-rose-600 py-0.5 text-center text-white">REC ●</span>
              <span className="flex-1 rounded bg-slate-800 py-0.5 text-center text-slate-300">FF</span>
            </div>
          </div>

          {/* Abanico de Portadas Estilo Apple Podcasts */}
          <div className="relative flex h-18 items-center justify-center">
            {/* Portada 3 (Atrás - Crónicas ATEL) */}
            <div className="absolute right-1 flex h-13 w-13 -rotate-6 scale-90 flex-col justify-between rounded-lg border border-purple-500/40 bg-gradient-to-br from-[#3b0764] to-[#1e1b4b] p-1 shadow-md">
              <span className="text-[6px] font-black text-purple-300">ATEL</span>
              <span className="self-center text-[10px]">🔍</span>
            </div>

            {/* Portada 2 (Medio - Cero Accidentes) */}
            <div className="absolute right-3.5 flex h-14 w-14 rotate-3 scale-95 flex-col justify-between rounded-lg border border-white/60 bg-gradient-to-br from-[#c7f303] to-lime-500 p-1 shadow-lg">
              <span className="text-[6px] font-black text-[#0e1300]">CERO ACC</span>
              <span className="self-center text-[11px]">🛡️</span>
            </div>

            {/* Portada 1 (Frontal - Somos SST Daily) */}
            <div className="relative z-10 flex h-16 w-16 flex-col justify-between rounded-xl border-1.5 border-[#c7f303] bg-gradient-to-br from-[#0d9488] to-[#064e3b] p-1.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#0e1300] px-1 py-0.2 text-[5.5px] font-black text-[#c7f303]">NEW</span>
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#c7f303] text-[6.5px] font-black text-[#0e1300]">
                  ▶
                </span>
              </div>
              <div>
                <div className="text-[6.5px] font-black leading-tight text-white">SOMOS SST</div>
                <div className="text-[5px] font-bold text-emerald-200">Daily 24kHz</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Inferior */}
        <div className="z-10 inline-flex items-center justify-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/20 px-2.5 py-0.5 text-[9px] font-bold text-teal-200">
          <span>🎙️ Voces Neuronales · Dual Host 1 &amp; 2 · Show Notes IA</span>
        </div>
      </div>
    );
  }

  const isSoon = app.badgeTone === 'soon';
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        isSoon
          ? 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800'
          : 'bg-gradient-to-br from-[#0e1300] via-[#14290f] to-[#0d4f48]',
      )}
    >
      {!isSoon && (
        <>
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#c7f303]/20 blur-3xl" />
          <div className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-teal-400/25 blur-3xl" />
        </>
      )}
      <span
        className={cn(
          'relative text-6xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110',
          isSoon && 'opacity-60 grayscale',
        )}
        aria-hidden="true"
      >
        {app.icon}
      </span>
    </div>
  );
}

function AppCard({ app, onOpen }: { app: WappyAppCatalogItem; onOpen: (app: WappyAppCatalogItem) => void }) {
  const isActive = app.badgeTone === 'active' && Boolean(app.path);

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-300 dark:bg-zinc-900',
        isActive
          ? 'cursor-pointer border-slate-200/80 hover:-translate-y-1 hover:border-teal-400/60 hover:shadow-lg dark:border-zinc-800 dark:hover:border-teal-500/50'
          : 'border-slate-200/60 opacity-90 dark:border-zinc-800/70',
      )}
      onClick={isActive ? () => onOpen(app) : undefined}
      role={isActive ? 'button' : undefined}
      tabIndex={isActive ? 0 : undefined}
      onKeyDown={
        isActive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(app);
              }
            }
          : undefined
      }
      aria-label={isActive ? `${app.ctaLabel} (se abre en una pestaña nueva)` : undefined}
    >
      {/* Franja de estado y norma (fuera de la imagen para no tapar el banner) */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10px] font-black tracking-wide',
            isActive
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-300/60 bg-slate-500/10 text-slate-600 dark:border-zinc-700 dark:text-zinc-400',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              isActive ? 'animate-pulse bg-emerald-500' : 'bg-slate-400',
            )}
          />
          {app.badge}
        </span>
        <span className="truncate text-[10px] font-bold text-slate-500 dark:text-zinc-400">{app.normative}</span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden">
        <AppCardVisual app={app} />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="flex items-center gap-2 text-base font-extrabold leading-tight text-slate-900 dark:text-zinc-100 sm:text-lg">
          <span aria-hidden="true">{app.icon}</span>
          <span>{app.title}</span>
        </h3>
        <p className="mt-1 text-xs font-semibold text-teal-700 dark:text-teal-300">{app.subtitle}</p>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-[13px]">
          {app.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Array.isArray(app.tags) ? app.tags : []).map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          {isActive ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(app);
              }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-sm font-bold tracking-wide text-teal-700 transition-all duration-300 ease-in-out hover:bg-teal-500/20 active:scale-95 dark:text-teal-300"
            >
              {app.ctaLabel}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300/60 bg-slate-500/10 text-sm font-bold tracking-wide text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
              <Clock className="h-4 w-4" />
              {app.ctaLabel}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * WAPPY APPs (vista interna).
 * Acceso directo para usuarios autenticados desde el menú lateral, con la apariencia de WAPPY.
 * Reutiliza el catálogo compartido con el portal público (`wappyAppsCatalog.ts`).
 */
export default function WappyAppsPage() {
  useDocumentTitle('WAPPY APPs | WAPPY IA');
  const navigate = useNavigate();
  const outletContext = useOutletContext<ContextType | undefined>();
  const navVisible = outletContext?.navVisible ?? true;
  const setNavVisible = outletContext?.setNavVisible;
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AppsFilter>('all');

  const apps = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    return WAPPY_APPS_CATALOG.filter((app) => {
      if (filter === 'active' && app.badgeTone !== 'active') {
        return false;
      }
      if (filter === 'soon' && app.badgeTone !== 'soon') {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [app.title, app.subtitle, app.description, app.normative, ...(app.tags || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, filter]);

  const activeCount = WAPPY_APPS_CATALOG.filter((a) => a.badgeTone === 'active').length;

  const {
    isVerified,
    verifiedUsername,
    pendingApp,
    isGateOpen,
    setIsGateOpen,
    requireFollowBeforeOpen,
    handleGateVerified,
  } = useInstagramFollowGate();

  useEffect(() => {
    if (!isVerified) {
      setIsGateOpen(true);
    }
  }, [isVerified, setIsGateOpen]);

  const executeOpenApp = (app: WappyAppCatalogItem) => {
    if (!app.path) {
      return;
    }
    const url = appendIgPassToUrl(resolveWappyAppUrl(app.path));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /**
   * Todas las WAPPY APPs (actuales y futuras) requieren verificación de seguidor en @wappy_ia (Opción 1: a todos).
   */
  const handleOpenApp = (app: WappyAppCatalogItem) => {
    requireFollowBeforeOpen(app, executeOpenApp);
  };

  return (
    <div className="relative flex w-full grow overflow-hidden bg-presentation">
      <InstagramFollowGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        targetApp={pendingApp}
        onVerified={(passToken, username) =>
          handleGateVerified(passToken, username, executeOpenApp)
        }
      />
      <main className="flex h-full w-full flex-col overflow-hidden" role="main">
        <div className="scrollbar-gutter-stable relative flex h-full flex-col overflow-y-auto overflow-x-hidden">
          {/* Barra superior: abrir menú lateral + accesos */}
          <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200/60 bg-white/80 px-4 py-2 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80 md:h-14">
            <div className="flex items-center gap-2">
              {!navVisible && setNavVisible && <OpenSidebar setNavVisible={setNavVisible} />}
              <span className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                <LayoutGrid className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                WAPPY APPs
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>@wappy_ia Verificado{verifiedUsername ? ` · @${verifiedUsername}` : ''}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGateOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-0.5 text-[11px] font-bold text-fuchsia-700 hover:bg-fuchsia-500/20 dark:text-fuchsia-300"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Desbloquear con @wappy_ia</span>
                </button>
              )}
            </div>
            <ExpandableButton
              variant="orange"
              icon={<Megaphone />}
              label="Ver novedades de WAPPY"
              onClick={() => navigate('/')}
            />
          </div>

          {/* Encabezado */}
          <div className="container mx-auto max-w-5xl px-4">
            <div className={cn('mb-6 text-center', isSmallScreen ? 'mt-6' : 'mt-8 sm:mt-10')}>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 shadow-2xs dark:bg-teal-950/50 dark:text-teal-300">
                <span>🚀 SUITE DE APLICACIONES ESPECIALIZADAS</span>
              </div>
              <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100 sm:text-5xl">
                WAPPY APPS
              </h1>
              <p className="mx-auto max-w-2xl text-xs font-medium text-slate-500 dark:text-zinc-400 sm:text-sm">
                Herramientas prácticas diseñadas para multiplicar tu velocidad en Seguridad y Salud en el Trabajo.
                {activeCount > 0 && ` ${activeCount} apps disponibles hoy.`}
              </p>
            </div>
          </div>

          {/* Buscador + filtros */}
          <div className="sticky top-0 z-10 bg-presentation pb-4 md:top-14">
            <div className="container mx-auto max-w-5xl px-4">
              <div className="mx-auto max-w-2xl pb-4">
                <label className="relative block">
                  <span className="sr-only">Buscar aplicaciones</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar aplicaciones..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 shadow-2xs outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Filtrar aplicaciones">
                {FILTERS.map((f) => {
                  const selected = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        'h-8 rounded-xl border px-3 text-xs font-bold transition-all active:scale-95',
                        selected
                          ? 'border-teal-500/50 bg-teal-500/20 text-teal-700 ring-1 ring-teal-500/30 dark:text-teal-300'
                          : 'border-slate-300/60 bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300',
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid de tarjetas */}
          <div className="container mx-auto max-w-5xl px-4 pb-10">
            {apps.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} onOpen={handleOpenApp} />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                No encontramos aplicaciones para “{query}”.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
