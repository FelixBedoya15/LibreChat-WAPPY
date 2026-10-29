import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import { isVitalUser } from '~/utils/planAccess';
import { useToastContext } from '@librechat/client';
import {
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Star,
  AlertTriangle,
  Flame,
  BrainCircuit,
  Scale,
  X,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Award,
} from 'lucide-react';
import MatrizCompatibilidadTable from './MatrizCompatibilidadTable';
import { getChemicalCompatibility } from './MatrizCompatibilidadConstants';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import SGSSTHeroHeader from './SGSSTHeroHeader';
import { ExpandableButton } from '~/components/Common/ExpandableButton';

interface MatrixSummaryItem {
  conversationId: string;
  isOfficial: boolean;
  officialTitle: string;
  rowCount: number;
  previewUbicaciones: string;
  updatedAt: string;
}

interface ChemicalEcosystemStats {
  totalProducts: number;
  incompatiblePairs: number;
  fdsCompliancePct: number;
  rotuloCompliancePct: number;
  hito5ChemicalsCount: number;
  gtc45ChemicalRisksCount: number;
  eppChemicalCount: number;
  spillKitsPpreCount: number;
  sgaTrainingsCount: number;
  acpmChemicalTasksCount: number;
  compliance0312: number;
}

export default function MatrizCompatibilidadWorkspace() {
  const { token, user } = useAuthContext();
  const isVital = isVitalUser(user);
  const { showToast } = useToastContext();
  const [officialConvId, setOfficialConvId] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [officialMeta, setOfficialMeta] = useState<{
    hasOfficial?: boolean;
    officialTitle?: string;
    sourceConversationId?: string;
    updatedAt?: string;
    rowCount?: number;
    criticalCount?: number;
  }>({
    hasOfficial: false,
    officialTitle: 'Matriz de Compatibilidad Química SG-SST',
    rowCount: 0,
    criticalCount: 0,
  });
  const [userMatrices, setUserMatrices] = useState<MatrixSummaryItem[]>([]);
  const [isLoadingOfficial, setIsLoadingOfficial] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isSyncingEcosystem, setIsSyncingEcosystem] = useState(false);
  const [showMatrixSelector, setShowMatrixSelector] = useState(false);
  const [ecosystemStats, setEcosystemStats] = useState<ChemicalEcosystemStats>({
    totalProducts: 0,
    incompatiblePairs: 0,
    fdsCompliancePct: 0,
    rotuloCompliancePct: 0,
    hito5ChemicalsCount: 0,
    gtc45ChemicalRisksCount: 0,
    eppChemicalCount: 0,
    spillKitsPpreCount: 0,
    sgaTrainingsCount: 0,
    acpmChemicalTasksCount: 0,
    compliance0312: 0,
  });

  const loadOfficialAndList = useCallback(async () => {
    if (!token) return;
    setIsLoadingOfficial(true);
    try {
      const [officialRes, listRes] = await Promise.all([
        fetch('/api/sgsst/chemical-compatibility/official', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/sgsst/chemical-compatibility/list-user-matrices', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (officialRes.ok) {
        const officialData = await officialRes.json();
        const rows = Array.isArray(officialData.matrixRows) ? officialData.matrixRows : [];
        const critical = rows.filter((r: any) => {
          const incomp = String(r.incompatibilidades || '').toLowerCase();
          const hasIncomp =
            incomp.length > 5 &&
            !incomp.includes('ninguna') &&
            !incomp.includes('compatible con todo');
          const isHazardousClase = /clase\s*[1-68]/i.test(String(r.clasificacion_onu || ''));
          const hasPictos = Array.isArray(r.pictogramas_sga) && r.pictogramas_sga.length > 0;
          return hasIncomp || isHazardousClase || hasPictos;
        }).length;

        // Calcular cruces rojos incompatibles (Ácido/Base, Inflamable/Comburente, etc.) y % FDS / Rótulo
        let localIncompatiblePairs = 0;
        for (let i = 0; i < rows.length; i++) {
          for (let j = i + 1; j < rows.length; j++) {
            const pA = rows[i] || {};
            const pB = rows[j] || {};
            const compat = getChemicalCompatibility(
              pA.clasificacion_onu,
              pB.clasificacion_onu,
              pA.nombre,
              pB.nombre,
              pA.incompatibilidades,
              pB.incompatibilidades,
            );
            if (compat.status === 'incompatible') {
              localIncompatiblePairs++;
            }
          }
        }

        let fdsCount = 0;
        let rotuloCount = 0;
        let spillKitsRows = 0;
        rows.forEach((r: any) => {
          const fds = String(r.tiene_fds || '').toLowerCase();
          const rot = String(r.tiene_rotulo || '').toLowerCase();
          if (fds.includes('sí') || fds.includes('si')) fdsCount++;
          if (rot.includes('sí') || rot.includes('si')) rotuloCount++;
          if (String(r.control_derrames || '').trim().length > 3) spillKitsRows++;
        });

        const localFdsPct =
          rows.length > 0 ? Number(((fdsCount / rows.length) * 100).toFixed(2)) : 0;
        const localRotPct =
          rows.length > 0 ? Number(((rotuloCount / rows.length) * 100).toFixed(2)) : 0;

        const cleanTitle = officialData.officialTitle
          ? String(officialData.officialTitle).replace(/\bOficial\s*/gi, '').trim()
          : '';

        setOfficialConvId(officialData.conversationId);
        setActiveConvId((prev) => prev || officialData.conversationId);
        setOfficialMeta({
          hasOfficial: Boolean(officialData.isOfficial || rows.length > 0),
          officialTitle: cleanTitle || 'Matriz de Compatibilidad Química SG-SST',
          sourceConversationId: officialData.sourceConversationId,
          updatedAt: officialData.updatedAt,
          rowCount: rows.length,
          criticalCount: critical,
        });

        const eco = officialData.ecosystemStats || {};
        const rawFdsPct = Number(eco.fdsCompliancePct ?? eco.fdsPct ?? localFdsPct);
        const rawRotPct = Number(eco.rotuloCompliancePct ?? eco.rotuloPct ?? localRotPct);
        const raw0312 = Number(eco.compliance0312 ?? eco.puntaje0312 ?? 0);

        setEcosystemStats({
          totalProducts: Number(eco.totalProducts ?? rows.length) || rows.length,
          incompatiblePairs:
            Number(eco.incompatiblePairs ?? eco.incompatibleCount ?? localIncompatiblePairs) ||
            localIncompatiblePairs,
          fdsCompliancePct: Number((Number.isFinite(rawFdsPct) ? rawFdsPct : localFdsPct).toFixed(2)),
          rotuloCompliancePct: Number(
            (Number.isFinite(rawRotPct) ? rawRotPct : localRotPct).toFixed(2),
          ),
          hito5ChemicalsCount:
            Number(eco.hito5ChemicalsCount ?? eco.chemicalRegistryCount ?? rows.length) ||
            rows.length,
          gtc45ChemicalRisksCount: Number(
            eco.gtc45ChemicalRisksCount ?? eco.peligrosQuimicosGtc45 ?? 0,
          ),
          eppChemicalCount: Number(eco.eppChemicalCount ?? eco.entregasEppQuimico ?? 0),
          spillKitsPpreCount:
            Number(eco.spillKitsPpreCount ?? eco.equiposEmergenciaCount ?? spillKitsRows) ||
            spillKitsRows,
          sgaTrainingsCount: Number(eco.sgaTrainingsCount ?? eco.capacitacionesSgaCount ?? 0),
          acpmChemicalTasksCount: Number(
            eco.acpmChemicalTasksCount ?? eco.tareasAcpmQuimico ?? 0,
          ),
          compliance0312: Number((Number.isFinite(raw0312) ? raw0312 : 0).toFixed(2)),
        });
      }

      if (listRes.ok) {
        const listData = await listRes.json();
        setUserMatrices(Array.isArray(listData.matrices) ? listData.matrices : []);
      }
    } catch (error) {
      console.error('Error loading official chemical compatibility matrix workspace:', error);
    } finally {
      setIsLoadingOfficial(false);
    }
  }, [token]);

  const handleSyncEcosystem = async () => {
    if (!token) return;
    try {
      setIsSyncingEcosystem(true);
      const res = await fetch('/api/sgsst/chemical-compatibility/sync-ecosystem', {
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
            '¡Ecosistema Químico SGA 360° sincronizado con Registro Hito 5, GTC 45, EPP, PPRE y Centro de Control!',
          status: 'success',
        });
        await loadOfficialAndList();
        window.dispatchEvent(new CustomEvent('chemical-official-updated'));
      } else {
        showToast({
          message: data.error || 'No se pudo sincronizar el ecosistema químico SGA.',
          status: 'error',
        });
      }
    } catch (error) {
      console.error('[MatrizCompatibilidadWorkspace] Error syncing ecosystem:', error);
      showToast({
        message: 'Error al conectar con el motor de sincronización química 360°.',
        status: 'error',
      });
    } finally {
      setIsSyncingEcosystem(false);
    }
  };

  useEffect(() => {
    loadOfficialAndList();
  }, [loadOfficialAndList]);

  const handlePromoteSelectedToOfficial = async (sourceConvId: string) => {
    if (!token || !sourceConvId) return;
    setIsPromoting(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/set-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceConversationId: sourceConvId,
          officialTitle: 'Matriz de Compatibilidad Química SG-SST',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOfficialConvId(data.conversationId);
        setActiveConvId(data.conversationId);
        setShowMatrixSelector(false);
        showToast({
          message: '¡Matriz de Compatibilidad fijada en el Sistema exitosamente!',
        });
        await loadOfficialAndList();
      }
    } catch (error) {
      console.error('Error promoting chemical compatibility matrix:', error);
      showToast({
        message: 'No se pudo fijar la matriz química.',
        status: 'error',
      });
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoadingOfficial && !activeConvId) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium">Cargando Matriz Oficial de Compatibilidad Química...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ─── BANNER PRINCIPAL HERO GLASSMORPHISM (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <SGSSTHeroHeader
        categoryId="matriz_compatibilidad_oficial"
        icon={<FlaskConical className="h-7 w-7" />}
        title={officialMeta.officialTitle || 'Matriz de Compatibilidad Química SG-SST'}
        description="Evaluación técnica de compatibilidad, segregación de sustancias químicas, clasificación ONU y auditoría de Fichas de Seguridad (FDS) y rotulado SGA, sincronizada con el Inventario Químico del Hito 5 y el Centro de Control."
        badges={
          <>
            <div
              title={`${officialMeta.rowCount ?? 0} Sustancias Químicas Registradas`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                  {officialMeta.rowCount ?? 0}
                </span>
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {officialMeta.rowCount ?? 0}{' '}
                  {(officialMeta.rowCount ?? 0) === 1
                    ? 'Sustancia Registrada'
                    : 'Sustancias Registradas'}
                </span>
              </div>
            </div>

            {(officialMeta.criticalCount ?? 0) > 0 && (
              <div
                title={`${officialMeta.criticalCount} Sustancias con Segregación / Críticas SGA`}
                className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-rose-500 text-rose-500 shrink-0" />
                  <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                    {officialMeta.criticalCount}
                  </span>
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                  <span className="text-xs font-bold tracking-wide">
                    {officialMeta.criticalCount} Críticos / Segregación
                  </span>
                </div>
              </div>
            )}

            <div
              title="Conectada al Acto Predictivo ML y Registro Químico SGA"
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
              standardCode="4.1.3"
              label="Dec. 1496/2018 · Res. 773/2021 · NTC 3966 · Res. 0312 Est. 4.1.3: CUMPLE"
              tooltip="Decreto 1496 de 2018 y Resolución 773 de 2021 (Sistema Globalmente Armonizado SGA) · NTC 3966 (Segregación y Almacenamiento Seguro) · Res. 0312/2019 Estándar 4.1.3"
              moduleName="Matriz de Compatibilidad Química"
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
              title="Sincronizar Ecosistema Químico 360° (Registro Químico Hito 5, Matriz GTC 45 Hito 1, EPP Hito 5, Emergencias PPRE y Centro de Control ACPM)"
            />
            <ExpandableButton
              onClick={() => setShowMatrixSelector(true)}
              variant="cyan"
              icon={<RefreshCw className="h-4 w-4" />}
              label="Cambiar / Vincular desde Chats"
              title="Cambiar / Vincular desde Chats"
            />
          </>
        }
      />

      {/* ─── RADAR DE ECOSISTEMA QUÍMICO SGA 360° "SOMOS SST" ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
        {/* 1. Sustancias SGA Evaluadas */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 truncate">
              Sustancias SGA Evaluadas
            </span>
            <FlaskConical className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.totalProducts}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {ecosystemStats.incompatiblePairs} cruces rojos
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            Ácido/Base e Inflamable/Comburente
          </p>
        </div>

        {/* 2. Conformidad Legal (Dec. 1496 / Res. 773) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
              Conformidad Dec. 1496 / 773
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {Number(ecosystemStats.fdsCompliancePct.toFixed(2))}% <span className="text-xs font-bold text-text-secondary">FDS</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {Number(ecosystemStats.rotuloCompliancePct.toFixed(2))}% Rótulos SGA
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            FDS 16 Secciones + Pictogramas ONU
          </p>
        </div>

        {/* 3. Sincronización Hito 5 & GTC 45 */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 truncate">
              Sincronización Hito 5 & GTC 45
            </span>
            <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.hito5ChemicalsCount} <span className="text-xs font-bold text-text-secondary">Hito 5</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
              {ecosystemStats.gtc45ChemicalRisksCount} peligros GTC 45
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            Registro Químico + Matriz IPEVR
          </p>
        </div>

        {/* 4. Protección & Emergencias (EPP + PPRE) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
              Protección & Emergencias
            </span>
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.eppChemicalCount} <span className="text-xs font-bold text-text-secondary">EPP</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {ecosystemStats.spillKitsPpreCount} Kits / PPRE
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            Entregas EPP (Hito 5) y Duchas/Kits
          </p>
        </div>

        {/* 5. Capacitaciones SGA (Hito 6) & Control ACPM (Hito 7) */}
        <div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 truncate">
              Capacitación SGA & ACPM
            </span>
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemStats.acpmChemicalTasksCount} <span className="text-xs font-bold text-text-secondary">ACPM</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              {ecosystemStats.sgaTrainingsCount} Cap. SGA
            </span>
          </div>
          <p className="mt-1 text-[10px] text-text-secondary truncate">
            Hito 6 (Formación) e Hito 7 (Kanban)
          </p>
        </div>
      </div>

      {/* ─── MODAL DE SELECCIÓN DE MATRICES DESDE CHATS ─── */}
      {showMatrixSelector && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-surface-primary rounded-3xl border border-border-light shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Star className="h-5 w-5 fill-teal-500 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    Seleccionar Matriz de Compatibilidad Química
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Solo puede existir 1 matriz activa a la vez en el aplicativo institucional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMatrixSelector(false)}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoadingOfficial ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-secondary">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  <span className="text-xs font-semibold">
                    Consultando matrices químicas en los chats…
                  </span>
                </div>
              ) : userMatrices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <FlaskConical className="h-10 w-10 text-text-tertiary" />
                  <p className="text-sm font-bold text-text-secondary">
                    No se encontraron matrices en otros chats
                  </p>
                  <p className="text-xs text-text-tertiary max-w-sm">
                    Puedes interactuar con el agente en el chat para clasificar sustancias SGA o gestionarlas directamente en la tabla inferior.
                  </p>
                </div>
              ) : (
                userMatrices.map((mat) => (
                  <div
                    key={mat.conversationId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      mat.isOfficial || mat.conversationId === officialConvId
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                        : 'border-border-medium hover:border-teal-400 bg-surface-secondary/50 hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 mr-4">
                      <div className="mt-1">
                        {mat.isOfficial || mat.conversationId === officialConvId ? (
                          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-text-tertiary shrink-0" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {mat.officialTitle ||
                              `Matriz Chat (${mat.conversationId.slice(0, 8)}...)`}
                          </p>
                          {(mat.isOfficial || mat.conversationId === officialConvId) && (
                            <span className="inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white shrink-0">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                          <span>
                            <strong>{mat.rowCount}</strong> sustancias
                          </span>
                          {mat.previewUbicaciones && (
                            <span className="text-text-tertiary">
                              · Ubicaciones: {mat.previewUbicaciones}
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
                        {mat.isOfficial || mat.conversationId === officialConvId ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4" /> Seleccionada
                          </span>
                        ) : (
                          <ExpandableButton
                            size="sm"
                            variant="purple"
                            onClick={() => handlePromoteSelectedToOfficial(mat.conversationId)}
                            disabled={isPromoting}
                            icon={
                              isPromoting ? (
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
                Tip: En cualquier momento puedes modificarla en la tabla o pedirle a un agente que clasifique más sustancias SGA.
              </span>
              <button
                onClick={() => setShowMatrixSelector(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-text-primary bg-surface-tertiary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLA INTERACTIVA COMPLETA ─── */}
      <div className="w-full">
        <MatrizCompatibilidadTable
          conversationId={activeConvId}
          isOfficialApp={true}
          onRefreshOfficialList={loadOfficialAndList}
        />
      </div>
    </div>
  );
}
