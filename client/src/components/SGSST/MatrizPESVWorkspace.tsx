import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import { isVitalUser } from '~/utils/planAccess';
import { useToastContext } from '@librechat/client';
import {
  Truck,
  AlertTriangle,
  Star,
  RefreshCw,
  CheckCircle2,
  BrainCircuit,
  Scale,
  FileSpreadsheet,
  X,
  Loader2,
  MessageSquare,
  Flame,
  Users,
  ShieldCheck,
  Activity,
  Award,
} from 'lucide-react';
import MatrizPESVTable from './MatrizPESVTable';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import SGSSTHeroHeader from './SGSSTHeroHeader';
import { ExpandableButton } from '~/components/Common/ExpandableButton';

interface ChatMatrixItem {
  conversationId: string;
  title: string;
  isOfficial: boolean;
  rowCount: number;
  criticalCount: number;
  sourceConversationId?: string | null;
  promotedAt?: string | null;
  updatedAt: string;
}

interface PesvEcosystemStats {
  totalRisks: number;
  criticalRisks: number;
  vehiclesCount: number;
  preoperacionalesCount: number;
  driversCount: number;
  cargosVialesCount: number;
  programsCoveredCount: number;
  programsDetail: {
    velocidad: boolean;
    fatiga: boolean;
    distraccion: boolean;
    alcoholSpa: boolean;
    actoresVulnerables: boolean;
  };
  gtc45TransitCount: number;
  atelVialCount: number;
  csvMembersCount: number;
  trainingsCount: number;
  acpmCount: number;
  compliance0312: number;
}

export default function MatrizPESVWorkspace() {
  const { token, user } = useAuthContext();
  const isVital = isVitalUser(user);
  const { showToast } = useToastContext();

  const [officialInfo, setOfficialInfo] = useState<{
    hasOfficial: boolean;
    officialTitle: string;
    rowCount: number;
    criticalCount: number;
    sourceConversationId: string | null;
    promotedAt: string | null;
    updatedAt: string | null;
  }>({
    hasOfficial: false,
    officialTitle: 'Matriz PESV SG-SST',
    rowCount: 0,
    criticalCount: 0,
    sourceConversationId: null,
    promotedAt: null,
    updatedAt: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [chatMatrices, setChatMatrices] = useState<ChatMatrixItem[]>([]);
  const [isLoadingMatrices, setIsLoadingMatrices] = useState(false);
  const [isSettingOfficial, setIsSettingOfficial] = useState(false);
  const [isSyncingEcosystem, setIsSyncingEcosystem] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ecosystemStats, setEcosystemStats] = useState<PesvEcosystemStats>({
    totalRisks: 0,
    criticalRisks: 0,
    vehiclesCount: 0,
    preoperacionalesCount: 0,
    driversCount: 0,
    cargosVialesCount: 0,
    programsCoveredCount: 0,
    programsDetail: {
      velocidad: false,
      fatiga: false,
      distraccion: false,
      alcoholSpa: false,
      actoresVulnerables: false,
    },
    gtc45TransitCount: 0,
    atelVialCount: 0,
    csvMembersCount: 0,
    trainingsCount: 0,
    acpmCount: 0,
    compliance0312: 0,
  });

  // Cargar estado de la matriz oficial PESV y radar 360°
  const fetchOfficialStatus = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/sgsst/pesv-workspace/official', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data.matrixRows) ? data.matrixRows : [];
        const critical = rows.filter((r: any) => (Number(r.calificacion) || 0) >= 12).length;
        const cleanTitle = data.officialTitle
          ? String(data.officialTitle).replace(/\bOficial\s*/gi, '').trim()
          : '';
        setOfficialInfo({
          hasOfficial: Boolean(data.hasOfficial || rows.length > 0),
          officialTitle: cleanTitle || 'Matriz PESV SG-SST',
          rowCount: rows.length,
          criticalCount: critical,
          sourceConversationId: data.sourceConversationId || null,
          promotedAt: data.promotedAt || null,
          updatedAt: data.updatedAt || null,
        });

        // Evaluar cobertura local de los 5 programas críticos (Paso 8 ANSV)
        const allText = rows
          .map(
            (r: any) =>
              `${r.programa_paso8 || ''} ${r.peligro_descripcion || ''} ${r.plan_accion_medio || ''} ${r.plan_accion_individuo || ''} ${r.observaciones || ''} ${r.rol_via || ''}`,
          )
          .join(' ')
          .toLowerCase();

        const localDetail = {
          velocidad: /velocidad/i.test(allText),
          fatiga: /(fatiga|sue[ñn]o|microsue[ñn]o|jornada|descanso)/i.test(allText),
          distraccion: /(distracc|celular|whatsapp|m[oó]vil|pantalla)/i.test(allText),
          alcoholSpa: /(alcohol|embriaguez|psicoactiv|spa\b|drogas|cero tolerancia)/i.test(allText),
          actoresVulnerables: /(peat[oó]n|ciclista|motociclista|motocicleta|actor.*vulnerable)/i.test(
            allText,
          ),
        };
        const localCargosCount = new Set(
          rows.map((r: any) => String(r.cargo || '').trim()).filter(Boolean),
        ).size;

        let eco = data.ecosystemStats || null;
        if (!eco) {
          try {
            const ecoRes = await fetch('/api/sgsst/pesv-workspace/ecosystem-summary', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (ecoRes.ok) {
              const ecoJson = await ecoRes.json();
              eco = ecoJson.ecosystemStats || ecoJson;
            }
          } catch {
            // Ignorar silenciosamente si el endpoint secundario no responde
          }
        }

        const detail = {
          velocidad: Boolean(eco?.programsDetail?.velocidad ?? eco?.velocidad ?? localDetail.velocidad),
          fatiga: Boolean(eco?.programsDetail?.fatiga ?? eco?.fatiga ?? localDetail.fatiga),
          distraccion: Boolean(
            eco?.programsDetail?.distraccion ?? eco?.distraccion ?? localDetail.distraccion,
          ),
          alcoholSpa: Boolean(
            eco?.programsDetail?.alcoholSpa ?? eco?.alcoholSpa ?? localDetail.alcoholSpa,
          ),
          actoresVulnerables: Boolean(
            eco?.programsDetail?.actoresVulnerables ??
              eco?.actoresVulnerables ??
              localDetail.actoresVulnerables,
          ),
        };
        const computedProgramsCount = Object.values(detail).filter(Boolean).length;
        const raw0312 = Number(
          eco?.compliance0312 ?? eco?.puntaje0312 ?? eco?.cumplimiento0312 ?? 0,
        );

        setEcosystemStats({
          totalRisks: Number(eco?.totalRisks ?? rows.length) || rows.length,
          criticalRisks: Number(eco?.criticalRisks ?? critical) || critical,
          vehiclesCount: Number(eco?.vehiclesCount ?? eco?.totalVehicles ?? eco?.flotaCount ?? 0),
          preoperacionalesCount: Number(
            eco?.preoperacionalesCount ?? eco?.inspectionsCount ?? eco?.inspeccionesCount ?? 0,
          ),
          driversCount: Number(eco?.driversCount ?? eco?.conductoresCount ?? eco?.workersVialCount ?? 0),
          cargosVialesCount:
            Number(eco?.cargosVialesCount ?? eco?.cargosCount ?? localCargosCount) ||
            localCargosCount,
          programsCoveredCount:
            Number(eco?.programsCoveredCount ?? eco?.programasPaso8Count ?? computedProgramsCount) ||
            computedProgramsCount,
          programsDetail: detail,
          gtc45TransitCount: Number(
            eco?.gtc45TransitCount ?? eco?.peligrosTransitoGtc45 ?? eco?.ipevrVialCount ?? 0,
          ),
          atelVialCount: Number(
            eco?.atelVialCount ?? eco?.siniestrosViales ?? eco?.accidentesVialesCount ?? 0,
          ),
          csvMembersCount: Number(eco?.csvMembersCount ?? eco?.comiteCsvCount ?? 0),
          trainingsCount: Number(eco?.trainingsCount ?? eco?.capacitacionesVialesCount ?? 0),
          acpmCount: Number(eco?.acpmCount ?? eco?.tareasAcpmCount ?? 0),
          compliance0312: Number((Number.isFinite(raw0312) ? raw0312 : 0).toFixed(2)),
        });
      }
    } catch (err) {
      console.error('[MatrizPESVWorkspace] Error loading official PESV matrix:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleSyncEcosystem = async () => {
    if (!token) return;
    try {
      setIsSyncingEcosystem(true);
      const res = await fetch('/api/sgsst/pesv-workspace/sync-ecosystem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast({
          message:
            data.message ||
            '¡Ecosistema Vial 360° sincronizado con Flota (Hito 5), Cargos (Hito 2), GTC 45 y Centro de Control!',
          status: 'success',
        });
        await fetchOfficialStatus();
        setRefreshKey((k) => k + 1);
        window.dispatchEvent(new CustomEvent('pesv-official-updated'));
      } else {
        showToast({
          message: data.error || 'No se pudo sincronizar el ecosistema vial.',
          status: 'error',
        });
      }
    } catch (err) {
      console.error('[MatrizPESVWorkspace] Error syncing PESV ecosystem:', err);
      showToast({
        message: 'Error al conectar con el motor de sincronización 360°.',
        status: 'error',
      });
    } finally {
      setIsSyncingEcosystem(false);
    }
  };

  useEffect(() => {
    fetchOfficialStatus();
  }, [fetchOfficialStatus, refreshKey]);

  // Escuchar eventos globales de sincronización
  useEffect(() => {
    const handleSync = () => {
      fetchOfficialStatus();
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('pesv-official-updated', handleSync);
    return () => window.removeEventListener('pesv-official-updated', handleSync);
  }, [fetchOfficialStatus]);

  // Abrir selector y cargar matrices PESV creadas en los chats
  const handleOpenSelector = async () => {
    setIsSelectorOpen(true);
    if (!token) return;
    try {
      setIsLoadingMatrices(true);
      const res = await fetch('/api/sgsst/pesv-workspace/list-user-matrices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMatrices(data.matrices || []);
      }
    } catch (err) {
      console.error('[MatrizPESVWorkspace] Error listing PESV matrices:', err);
    } finally {
      setIsLoadingMatrices(false);
    }
  };

  // Establecer una matriz de chat como oficial
  const handleSelectOfficial = async (item: ChatMatrixItem) => {
    if (!token) return;
    try {
      setIsSettingOfficial(true);
      const res = await fetch('/api/sgsst/pesv-workspace/set-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceConversationId: item.conversationId,
          officialTitle: item.title,
        }),
      });

      if (res.ok) {
        showToast({
          message: '¡Matriz PESV establecida en el Aplicativo Institucional exitosamente!',
          status: 'success',
        });
        setIsSelectorOpen(false);
        setRefreshKey((k) => k + 1);
        window.dispatchEvent(new CustomEvent('pesv-official-updated'));
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err: any) {
      console.error('[MatrizPESVWorkspace] Error setting official PESV matrix:', err);
      showToast({
        message: 'No se pudo fijar la matriz PESV.',
        status: 'error',
      });
    } finally {
      setIsSettingOfficial(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL HERO GLASSMORPHISM (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <SGSSTHeroHeader
        categoryId="matriz_pesv_oficial"
        icon={<Truck className="h-7 w-7" />}
        title={officialInfo.officialTitle || 'Matriz PESV SG-SST'}
        description="Identificación, evaluación y control de riesgos de seguridad vial por actor vial (Conductor, Peatón, Ciclista, Motociclista) y factores de riesgo (Humano, Vehículo, Infraestructura y Entorno) bajo la Resolución 20223040040595 de 2022 (Paso 6: Caracterización, Evaluación y Control de Riesgos Viales + Paso 8: 5 Programas de Gestión de Riesgos Críticos), ISO 39001 y Res. 0312 Art. 32."
        badges={
          <>
            <div
              title={`${officialInfo.rowCount} Riesgos Viales Evaluados`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                  {officialInfo.rowCount}
                </span>
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {officialInfo.rowCount}{' '}
                  {officialInfo.rowCount === 1
                    ? 'Riesgo Vial Evaluado'
                    : 'Riesgos Viales Evaluados'}
                </span>
              </div>
            </div>

            {officialInfo.criticalCount > 0 && (
              <div
                title={`${officialInfo.criticalCount} Críticos (Calif. 12-15)`}
                className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-rose-500 text-rose-500 shrink-0" />
                  <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                    {officialInfo.criticalCount}
                  </span>
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                  <span className="text-xs font-bold tracking-wide">
                    {officialInfo.criticalCount} Críticos (Calif. 12-15)
                  </span>
                </div>
              </div>
            )}

            <div
              title="Conectada al Acto Predictivo ML y Flota PESV"
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <BrainCircuit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400 shrink-0" />
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  Conectada al Acto Predictivo ML
                </span>
              </div>
            </div>

            <SGSSTLegalBadge
              standardCode="4.1.1"
              label="Res. 20223040040595 (Paso 6 y Paso 8) · ISO 39001 · Res. 0312 Art. 32: CUMPLE"
              tooltip="Resolución 20223040040595 de 2022 (Paso 6: Caracterización, Evaluación y Control de Riesgos Viales + Paso 8: 5 Programas de Gestión de Riesgos Críticos) · ISO 39001 · Res. 0312/2019 Art. 32"
              moduleName="Matriz PESV"
            />
          </>
        }
        actions={
          <>
            <ExpandableButton
              onClick={handleSyncEcosystem}
              disabled={isSyncingEcosystem}
              variant="teal"
              icon={
                isSyncingEcosystem ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              label={isSyncingEcosystem ? 'Sincronizando 360°…' : 'Sincronizar Ecosistema 360°'}
              title="Sincronizar Ecosistema 360° (Flota Hito 5, Perfiles de Cargo Hito 2, GTC 45 Hito 1, Comité CSV Hito 3, Capacitaciones Hito 6 y ACPM Hito 7)"
            />
            <ExpandableButton
              onClick={handleOpenSelector}
              variant="cyan"
              icon={<RefreshCw className="h-4 w-4" />}
              label="Cambiar / Vincular desde Chats"
              title="Cambiar / Vincular desde Chats"
            />
          </>
        }
      />

      {/* ─── RADAR DE ECOSISTEMA VIAL 360° "SOMOS SST" ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
        {/* 1. Riesgos Viales (Paso 6) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 truncate">
              Riesgos Viales (Paso 6)
            </span>
            <Truck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.totalRisks}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {ecosystemStats.criticalRisks} críticos (12-15)
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            Actor vial y 4 factores ANSV
          </p>
        </div>

        {/* 2. Flota Automotor (Hito 5) & Conductores (Hito 2) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 truncate">
              Flota (Hito 5) & Cargos (Hito 2)
            </span>
            <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.vehiclesCount} <span className="text-xs font-bold text-text-secondary">veh.</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
              {ecosystemStats.cargosVialesCount} cargos · {ecosystemStats.driversCount} cond.
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            {ecosystemStats.preoperacionalesCount} insp. preoperacionales (Paso 16)
          </p>
        </div>

        {/* 3. 5 Programas Críticos (Paso 8) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
              5 Programas Críticos (Paso 8)
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.programsCoveredCount}/5
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {Math.round((ecosystemStats.programsCoveredCount / 5) * 100)}% cobertura
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate" title="Velocidad, Fatiga, Distracción, Alcohol/SPA y Actores Vulnerables">
            Vel · Fatiga · Distrac · SPA · Actores
          </p>
        </div>

        {/* 4. Peligros Tránsito GTC 45 (Hito 1) & Siniestros ATEL (Hito 7) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
              Tránsito GTC 45 & ATEL Vial
            </span>
            <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.gtc45TransitCount} <span className="text-xs font-bold text-text-secondary">IPEVR</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {ecosystemStats.atelVialCount} siniestros ATEL
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            Cruce Hito 1 (GTC 45) e Hito 7 (ATEL)
          </p>
        </div>

        {/* 5. Gobernanza Vial: Comité CSV (Hito 3), Capacitaciones (Hito 6), ACPM (Hito 7) & 0312 */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 truncate">
              Gobernanza CSV · Cap · ACPM
            </span>
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {Number(ecosystemStats.compliance0312.toFixed(2))}%
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              {ecosystemStats.acpmCount} ACPM · {ecosystemStats.trainingsCount} Cap.
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            CSV: {ecosystemStats.csvMembersCount} miembros · Res. 0312 Art. 32
          </p>
        </div>
      </div>

      {/* ─── MODAL SELECTOR DE MATRICES PESV DESDE LOS CHATS ─── */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col max-h-[85vh] w-full max-w-2xl rounded-3xl border border-border-medium bg-surface-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border-light px-6 py-4 bg-surface-secondary">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Star className="h-5 w-5 fill-teal-500 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    Seleccionar Matriz PESV para el Aplicativo
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Solo puede existir 1 matriz PESV activa a la vez en el aplicativo institucional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoadingMatrices ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-secondary">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  <span className="text-xs font-semibold">
                    Consultando tus matrices PESV en los chats…
                  </span>
                </div>
              ) : chatMatrices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <FileSpreadsheet className="h-10 w-10 text-text-tertiary" />
                  <p className="text-sm font-bold text-text-secondary">
                    No se encontraron matrices PESV en otros chats
                  </p>
                  <p className="text-xs text-text-tertiary max-w-sm">
                    Puedes interactuar con el Experto en Riesgo Vial en el chat para crear una
                    matriz PESV o editarla directamente en la tabla inferior de este aplicativo.
                  </p>
                </div>
              ) : (
                chatMatrices.map((mat) => (
                  <div
                    key={mat.conversationId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      mat.isOfficial
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                        : 'border-border-medium hover:border-teal-400 bg-surface-secondary/50 hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 mr-4">
                      <div className="mt-1">
                        {mat.isOfficial ? (
                          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-text-tertiary shrink-0" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {mat.title}
                          </p>
                          {mat.isOfficial && (
                            <span className="inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white shrink-0">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                          <span>
                            <strong>{mat.rowCount}</strong> peligros viales
                          </span>
                          {mat.criticalCount > 0 && (
                            <span className="text-rose-500 font-semibold">
                              · {mat.criticalCount} críticos
                            </span>
                          )}
                          <span className="text-text-tertiary">
                            · {new Date(mat.updatedAt).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isVital && (
                      <div>
                        {mat.isOfficial ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4" /> Seleccionada
                          </span>
                        ) : (
                          <ExpandableButton
                            size="sm"
                            variant="purple"
                            onClick={() => handleSelectOfficial(mat)}
                            disabled={isSettingOfficial}
                            icon={
                              isSettingOfficial ? (
                                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )
                            }
                            label="Fijar en Aplicativo"
                            title="Fijar en Aplicativo"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t border-border-light px-6 py-4 bg-surface-secondary flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                Tip: En cualquier momento puedes modificarla en la tabla o pedirle al agente de
                Riesgo Vial que evalúe más riesgos.
              </span>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-text-primary bg-surface-tertiary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLA INTERACTIVA COMPLETA PESV ─── */}
      <div className="w-full">
        <MatrizPESVTable
          key={`official-pesv-table-${refreshKey}`}
          conversationId="official"
          isOfficialApp={true}
          onRefreshOfficialList={fetchOfficialStatus}
        />
      </div>
    </div>
  );
}
