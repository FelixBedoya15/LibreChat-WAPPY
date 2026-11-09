import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Globe,
  HeartPulse,
  Palette,
  UserCheck,
  Cpu,
  ShieldAlert,
  Car,
  FlaskConical,
  FileEdit,
  Scale,
  Heart,
  Activity,
  CloudSun,
  MapPin,
  GitFork,
  Clapperboard,
  Bot,
  Brain,
  Bell,
  Sparkles,
  Plus,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Wand2,
  Check,
  Zap,
  ShieldCheck,
  HardHat,
  Users,
  Stethoscope,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  AlertTriangle,
  QrCode,
  FileText,
  Clock,
  Hand,
  MousePointer2,
  Move,
  Sliders,
  Repeat,
  GitMerge,
  Lock,
  Hammer,
  Terminal,
  Puzzle,
  Search,
  Play,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
  Database,
  Calendar,
  Send,
  RefreshCw,
  Briefcase,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  Settings2,
  Table2,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import WappyNodeCustomEditor from './WappyNodeCustomEditors';
import WappyWorkflowSandboxPanel, {
  type SandboxSimulationResponse,
  type SandboxNodeTraceStep,
  type ScraperCapturedEvidence,
  collectUniqueScraperEvidences,
  extractEvidenceFromRow,
  normalizeEvidenceUrlForBrowser,
  renderWorkflowMarkdownToInteractiveHtml,
  handleEvidenceContainerClick,
} from './WappyWorkflowSandboxPanel';
export type { SandboxNodeTraceStep, ScraperCapturedEvidence };
import {
  TRIGGER_NODES,
  EXTRACTOR_NODES,
  INPUT_CONNECTOR_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  SKILL_RULE_SUBAGENT_NODES,
  AI_ENGINE_MODELS,
  MEMORY_NODES,
  HITOS_8_FILTER_TABS,
  TOOL_SUBGROUP_TABS,
  DEFAULT_CONSTRUCTION_APP_IDS,
  isWorkflowNodeUnderConstruction,
  getNodeDefById,
  getNodeModuleMetadata,
  getPresetFieldsForNode,
  buildNodeConfigSummary,
  MODULE_METADATA_MAP,
  normalizeTriggersList,
  normalizeExtractorsList,
  normalizeMemoriesList,
  WAPPY_AGENT_AVATAR_ROTATION,
  getRotatedAgentAvatar,
  doesNodeRequireAntigravity,
  type WorkflowNodesConfig,
  type CanvasNodePosition,
  type CanvasWireEdge,
  type CanvasNodeConfig,
  type CanvasCustomUserNode,
} from './workflowNodesCatalog';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LOGOS SVG OFICIALES Y ICONOS DE HERRAMIENTAS WAPPY (Imagen 1 y 3)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderOfficialNodeSvg(nodeId: string, sizeClass = 'w-7 h-7'): React.ReactNode {
  const id = (nodeId || '').toLowerCase();

  // Sub-Agentes WAPPY con Rotación Automática de Avatares 3D (Tenshi, Suri Suricato, Max Perro, Paz Paloma, Capi Capibara)
  if (id.includes('subagent')) {
    const subAvatars = [
      '/assets/tenshi_suricato.png?v=20261108',
      '/assets/tenshi_perro.png?v=20261108',
      '/assets/tenshi_paloma.png?v=20261108',
      '/assets/tenshi_capibara.png?v=20261108',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    const avatarUrl =
      id.includes('subagent_chat_tenshi')
        ? '/assets/tenshi.png?v=orig20261109'
        : id.includes('research') || id.includes('investigador') || id.includes('editable')
          ? '/assets/tenshi_suricato.png?v=20261108'
          : id.includes('scraper') || id.includes('perro') || id.includes('alturas') || id.includes('vial')
            ? '/assets/tenshi_perro.png?v=20261108'
            : id.includes('auditor') || id.includes('redactor') || id.includes('paloma') || id.includes('instructor')
              ? '/assets/tenshi_paloma.png?v=20261108'
              : id.includes('medico') || id.includes('legal') || id.includes('capibara') || id.includes('psicolog')
                ? '/assets/tenshi_capibara.png?v=20261108'
                : subAvatars[hash % subAvatars.length];
    return (
      <img
        src={avatarUrl}
        alt="Sub-Agente WAPPY"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.retried) {
            img.dataset.retried = '1';
            img.src = `${avatarUrl.split('?')[0]}?t=${Date.now()}`;
          } else {
            img.src = '/assets/tenshi.png';
          }
        }}
        className={`${sizeClass} object-contain drop-shadow-sm select-none pointer-events-none scale-125`}
      />
    );
  }

  // Google Drive / Extraer de Drive (Logo Oficial Tricolor/Cuatricolor)
  if (id.includes('google_drive') || id.includes('drive_folder') || id.includes('extract_drive')) {
    return (
      <svg viewBox="0 0 87.3 78" className={sizeClass}>
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
      </svg>
    );
  }

  // Google Sheets (Logo Oficial Verde con Celdas)
  if (id.includes('google_sheets')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#0F9D58" d="M29,6H14c-2.2,0-4,1.8-4,4v28c0,2.2,1.8,4,4,4h20c2.2,0,4-1.8,4-4V15L29,6z" />
        <path fill="#87CEAC" d="M29,6v9h9L29,6z" />
        <path fill="#FFFFFF" d="M16,21v14h16V21H16z M23,33h-5v-3h5V33z M23,28h-5v-3h5V28z M30,33h-5v-3h5V33z M30,28h-5v-3h5V28z" />
      </svg>
    );
  }

  // Google Docs (Logo Oficial Azul)
  if (id.includes('google_docs')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#4285F4" d="M29,6H14c-2.2,0-4,1.8-4,4v28c0,2.2,1.8,4,4,4h20c2.2,0,4-1.8,4-4V15L29,6z" />
        <path fill="#A0C2F9" d="M29,6v9h9L29,6z" />
        <path fill="#FFFFFF" d="M16,23h16v2H16V23z M16,28h16v2H16V28z M16,33h11v2H16V33z" />
      </svg>
    );
  }

  // Google Slides (Logo Oficial Ámbar)
  if (id.includes('google_slides')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#F4B400" d="M29,6H14c-2.2,0-4,1.8-4,4v28c0,2.2,1.8,4,4,4h20c2.2,0,4-1.8,4-4V15L29,6z" />
        <path fill="#F9D978" d="M29,6v9h9L29,6z" />
        <rect x="15" y="21" width="18" height="12" rx="1.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // Google Gmail / Correo Entrante / Email Report (Logo Oficial M Cuatricolor)
  if (id.includes('gmail') || id.includes('email_report') || id.includes('trigger_email')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
        <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
        <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
        <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
        <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z" />
      </svg>
    );
  }

  // Tenshi IA / Notificación Directa WAPPY + Tenshi (Avatar 3D Oficial de Tenshi en WAPPY)
  if (id.includes('trigger_tenshi') || id.includes('tenshi') || id.includes('wappy_notification')) {
    return (
      <img
        src="/assets/tenshi.png"
        alt="Tenshi IA"
        className={`${sizeClass} object-contain drop-shadow-sm select-none pointer-events-none scale-125`}
      />
    );
  }

  // Google Calendar (Logo Oficial Calendario 31)
  if (id.includes('google_calendar')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#4285F4" />
        <rect x="13" y="13" width="22" height="22" rx="2" fill="#FFFFFF" />
        <path fill="#EA4335" d="M35,42h-6v-7h7v6C36,41.6,35.6,42,35,42z" />
        <path fill="#34A853" d="M13,35h22v7H13V35z" />
        <path fill="#FBBC04" d="M35,13h7v22h-7V13z" />
        <text x="24" y="28.5" textAnchor="middle" fill="#1a73e8" fontSize="12" fontWeight="900" fontFamily="sans-serif">31</text>
      </svg>
    );
  }

  // Microsoft OneDrive / Extraer OneDrive
  if (id.includes('onedrive') || id.includes('one_drive')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#0078D4" d="M38.5,24.2c-0.7-5.8-5.6-10.2-11.6-10.2c-4.6,0-8.6,2.6-10.5,6.5c-0.7-0.2-1.5-0.3-2.3-0.3 c-4.9,0-8.9,3.9-9.1,8.8C2.7,30.2,1,32.6,1,35.4C1,39.1,4,42,7.7,42h29.8c4.7,0,8.5-3.8,8.5-8.5C46,28.8,42.7,24.9,38.5,24.2z" />
      </svg>
    );
  }

  // WhatsApp Bot (En Construcción)
  if (id.includes('whatsapp')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path
          fill="#25D366"
          d="M24,4C13,4,4,13,4,24c0,3.6,1,7,2.7,9.9L4,44l10.4-2.7C17.2,43,20.5,44,24,44c11,0,20-9,20-20S35,4,24,4z"
        />
        <path
          fill="#FFFFFF"
          d="M34.6,28.7c-0.6-0.3-3.4-1.7-3.9-1.9c-0.5-0.2-0.9-0.3-1.3,0.3c-0.4,0.6-1.5,1.9-1.8,2.3c-0.3,0.4-0.7,0.4-1.3,0.1c-0.6-0.3-2.5-0.9-4.7-2.9c-1.7-1.5-2.9-3.4-3.2-4c-0.3-0.6,0-0.9,0.3-1.2c0.3-0.3,0.6-0.7,0.9-1c0.3-0.3,0.4-0.6,0.6-1c0.2-0.4,0.1-0.7-0.1-1c-0.2-0.3-1.3-3.1-1.8-4.3c-0.5-1.1-0.9-1-1.3-1c-0.3,0-0.7,0-1.1,0c-0.4,0-1,0.1-1.6,0.7c-0.5,0.6-2.1,2-2.1,4.9s2.1,5.7,2.4,6.1c0.3,0.4,4.2,6.4,10.1,9c1.4,0.6,2.5,1,3.4,1.2c1.4,0.5,2.7,0.4,3.7,0.2c1.1-0.2,3.4-1.4,3.9-2.7c0.5-1.3,0.5-2.5,0.3-2.7C35.5,29.1,35.1,29,34.6,28.7z"
        />
      </svg>
    );
  }

  // Google NotebookLM / RAG Documental
  if (id.includes('notebooklm') || id.includes('rag_documental')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <rect x="6" y="6" width="36" height="36" rx="10" fill="#0F172A" />
        <path d="M14 31C14 21 24 15 34 19" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M14 35C16 26 25 21 34 25" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M16 38C19 31 26 28 34 31" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // Google Antigravity Cloud 24/7 (antigravity.google.com + Nube)
  if (id.includes('antigravity_cloud')) {
    return (
      <svg viewBox="0 0 28 28" fill="none" className={sizeClass}>
        <path
          d="M11.5 4 4.5 19l3-1.3L11.5 9.2l4 8.5 3 1.3L11.5 4z"
          stroke="#0284c7"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.3 15h6.4" stroke="#0284c7" strokeWidth="2.1" strokeLinecap="round" />
        <path
          d="M17.5 23.5h5.2a2.8 2.8 0 0 0 .4-5.57 3.8 3.8 0 0 0-7.2-1.18A2.5 2.5 0 0 0 17.5 23.5z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  // Carpeta en mi PC / Extractor de Archivos Locales vía Antigravity (Icono Carpeta + Terminal >_)
  if (id.includes('extract_pc_folder') || id.includes('pc_folder')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={sizeClass}>
        <path
          d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.9a2 2 0 0 1 1.6.8l1.2 1.6a1 1 0 0 0 .8.4h5.5A2.5 2.5 0 0 1 21 9.3v8.2a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z"
          fill="#F59E0B"
          fillOpacity="0.18"
          stroke="#D97706"
          strokeWidth="1.9"
        />
        <path
          d="m8 11 2.5 2L8 15M12.5 15H16"
          stroke="#B45309"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Skills (SKILL.md) y Reglas (Rules) — evaluar ANTES de scrapers/antigravity/auditoria
  if (id.startsWith('skill_') || id.startsWith('custom_skill_')) {
    return <Puzzle className={`${sizeClass} text-violet-600 dark:text-violet-400`} />;
  }
  if (id.startsWith('rule_') || id.startsWith('custom_rule_')) {
    return <Scale className={`${sizeClass} text-emerald-600 dark:text-emerald-400`} />;
  }

  // ── 6 Scrapers Oficiales por Cédula/Placa vía Antigravity (Evaluar ANTES de id.includes('antigravity')) ──
  if (id.includes('scraper_agy_alto_riesgo')) {
    return <HardHat className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('scraper_agy_arl_directo')) {
    return <ShieldCheck className={`${sizeClass} text-emerald-500`} />;
  }
  if (id.includes('scraper_agy_pensiones_directo')) {
    return <BarChart3 className={`${sizeClass} text-teal-500`} />;
  }
  if (id.includes('scraper_agy_salud_rethus')) {
    return <Stethoscope className={`${sizeClass} text-rose-500`} />;
  }
  if (id.includes('scraper_agy_vial_pesv')) {
    return <Car className={`${sizeClass} text-orange-500`} />;
  }
  if (id.includes('scraper_agy_antecedentes')) {
    return <Scale className={`${sizeClass} text-rose-500`} />;
  }
  if (id.includes('scraping') || id.includes('web_scraper') || id.includes('scraper_agy_') || id.includes('scraper_node')) {
    return <Terminal className={`${sizeClass} text-orange-500`} />;
  }

  // Google Antigravity Local (Mac/PC) + MCP
  if (id.includes('antigravity')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClass} text-orange-500`}
      >
        <path d="M12 3 4 20l3.5-1.5L12 9l4.5 9.5L20 20 12 3z" />
        <path d="M8.5 15.5h7" />
      </svg>
    );
  }

  // Modelos WAPPY Cloud IA / Google Gemini
  if (id.includes('wappy_gemini') || id.includes('gemini')) {
    return (
      <svg viewBox="0 0 24 24" className={sizeClass}>
        <defs>
          <linearGradient id="wappyGeminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <path
          fill="url(#wappyGeminiGrad)"
          d="M12 2C12.6 7.2 16.8 11.4 22 12C16.8 12.6 12.6 16.8 12 22C11.4 16.8 7.2 12.6 2 12C7.2 11.4 11.4 7.2 12 2Z"
        />
      </svg>
    );
  }

  // Google Flow (Veo / Imagen)
  if (id.includes('google_flow')) {
    return <Clapperboard className={`${sizeClass} text-purple-500`} />;
  }

  // ── Iconos Exactos de los 10 Equipos de Nodos, Herramientas WAPPY y los 50 Aplicativos SST ──
  if (id.includes('trigger_qr_worker') || id.includes('qr')) {
    return <QrCode className={`${sizeClass} text-fuchsia-600 dark:text-fuchsia-400`} />;
  }
  if (id.includes('trigger_webhook') || id.includes('webhook_api') || id.includes('webhook')) {
    return <Zap className={`${sizeClass} text-amber-500 fill-amber-500/20`} />;
  }
  if (id.includes('schedule_cron')) {
    return <Clock className={`${sizeClass} text-orange-500`} />;
  }
  if (id.includes('consultar_agente') || id.includes('especialista') || id.includes('trigger_agent')) {
    return <UserCheck className={`${sizeClass} text-violet-500`} />;
  }

  // Memorias (Grupo 4)
  if (id.includes('memory_company')) {
    return <Building2 className={`${sizeClass} text-pink-500`} />;
  }
  if (id.includes('memory_antiduplicate')) {
    return <Clock className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('memory_procedural')) {
    return <Scale className={`${sizeClass} text-teal-600`} />;
  }

  // Herramientas WAPPY y Extractores Específicos (Evaluar ANTES de cualquier comodín general)
  if (id.includes('extract_sst_app')) {
    return <Database className={`${sizeClass} text-purple-600 dark:text-purple-400`} />;
  }
  if (
    id.includes('extract_sst_workers') ||
    id.includes('somos_sst_trabajadores') ||
    id.includes('sociodemografico') ||
    id.includes('perfil_socio')
  ) {
    return <Users className={`${sizeClass} text-teal-600`} />;
  }
  if (id.includes('somos_sst_perfiles_cargo') || id.includes('perfiles_cargo')) {
    return <Briefcase className={`${sizeClass} text-cyan-600 dark:text-cyan-400`} />;
  }
  if (id.includes('somos_sst_epp') || id.includes('hito3_epp') || id.includes('epp')) {
    return <HardHat className={`${sizeClass} text-amber-600`} />;
  }
  if (
    id.includes('somos_sst_examenes') ||
    id.includes('condiciones_salud') ||
    id.includes('examenes_medicos') ||
    id.includes('profesiograma') ||
    id.includes('medlineplus') ||
    id.includes('rehabilitacion')
  ) {
    return <Stethoscope className={`${sizeClass} text-rose-500`} />;
  }
  if (id.includes('somos_sst_empresa')) {
    return <Building2 className={`${sizeClass} text-teal-600 dark:text-teal-400`} />;
  }
  if (id.includes('somos_sst_update')) {
    return <ShieldCheck className={`${sizeClass} text-teal-600 dark:text-teal-400`} />;
  }
  if (id.includes('acpm_task') || id.includes('hito7_acpm') || id.includes('acpm') || id.includes('mejora_continua')) {
    return <ClipboardCheck className={`${sizeClass} text-emerald-600 dark:text-emerald-400`} />;
  }
  if (id.includes('canvas_doc') || id.includes('canvas') || id.includes('dictamen')) {
    return <Palette className={`${sizeClass} text-fuchsia-500`} />;
  }

  // Los 50 Aplicativos de los 8 Hitos de Somos SST (con Iconos Distintivos por Función)
  if (id.includes('hito8_predictivo') || id.includes('predictivo') || id.includes('oraculo')) {
    return <Brain className={`${sizeClass} text-indigo-600 dark:text-indigo-400`} />;
  }
  if (id.includes('hito1_responsable')) {
    return <UserCheck className={`${sizeClass} text-teal-600`} />;
  }
  if (id.includes('hito1_objetivos')) {
    return <BarChart3 className={`${sizeClass} text-indigo-600`} />;
  }
  if (id.includes('hito1_rhs') || id.includes('hito1_rit') || id.includes('editor_rit') || id.includes('matriz_legal')) {
    return <Scale className={`${sizeClass} text-indigo-500`} />;
  }
  if (id.includes('hito1_participacion_ipevar')) {
    return <Users className={`${sizeClass} text-amber-600`} />;
  }
  if (id.includes('hito1_oportunidades_sst')) {
    return <Sparkles className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('compatibilidad_laboral') || id.includes('bio_ipevar')) {
    return <HeartPulse className={`${sizeClass} text-rose-500`} />;
  }
  if (id.includes('matriz_ipevar') || id.includes('gtc45') || id.includes('vulnerabilidad')) {
    return <ShieldAlert className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('pesv') || id.includes('parque_automotor') || id.includes('vehicul')) {
    return <Car className={`${sizeClass} text-orange-500`} />;
  }
  if (id.includes('compatibilidad') || id.includes('quimico') || id.includes('pubchem')) {
    return <FlaskConical className={`${sizeClass} text-lime-500`} />;
  }
  if (id.includes('editor_live') || id.includes('documentos_vivo') || id.includes('politica')) {
    return <FileEdit className={`${sizeClass} text-blue-500`} />;
  }
  if (id.includes('psicosocial')) {
    return <Heart className={`${sizeClass} text-pink-500`} />;
  }
  if (id.includes('convivencia') || id.includes('cocolab') || id.includes('comites') || id.includes('contratistas')) {
    return <Users className={`${sizeClass} text-teal-600`} />;
  }
  if (
    id.includes('actos') ||
    id.includes('owas') ||
    id.includes('ergonomia') ||
    id.includes('estudios_puesto') ||
    id.includes('estudio_puesto')
  ) {
    return <Activity className={`${sizeClass} text-cyan-500`} />;
  }
  if (id.includes('openweather') || id.includes('clima')) {
    return <CloudSun className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('emergencia') || id.includes('osm') || id.includes('brigada') || id.includes('simulacro')) {
    return <MapPin className={`${sizeClass} text-red-500`} />;
  }
  if (
    id.includes('alturas') ||
    id.includes('ats') ||
    id.includes('confinados') ||
    id.includes('loto') ||
    id.includes('caliente') ||
    (id.includes('izaje') && !id.includes('aprendizaje'))
  ) {
    return <HardHat className={`${sizeClass} text-amber-600`} />;
  }
  if (id.includes('plan_trabajo')) {
    return <Calendar className={`${sizeClass} text-teal-600`} />;
  }
  if (id.includes('induccion')) {
    return <UserCheck className={`${sizeClass} text-emerald-600`} />;
  }
  if (id.includes('compras_sst')) {
    return <Briefcase className={`${sizeClass} text-blue-600`} />;
  }
  if (id.includes('gestion_cambio')) {
    return <RefreshCw className={`${sizeClass} text-purple-600`} />;
  }
  if (id.includes('comunicaciones_sst')) {
    return <Send className={`${sizeClass} text-sky-500`} />;
  }
  if (id.includes('app_builder') || id.includes('automatizaciones')) {
    return <Cpu className={`${sizeClass} text-purple-500`} />;
  }
  if (id.includes('investigacion_profunda')) {
    return <Search className={`${sizeClass} text-violet-600`} />;
  }
  if (id.includes('diagnostico_0312') || id.includes('auditoria') || id.includes('inspeccion')) {
    return <ClipboardCheck className={`${sizeClass} text-emerald-600`} />;
  }
  if (id.includes('academia') || id.includes('capacitacion') || id.includes('cursos_lms') || id.includes('ruta_aprendizaje')) {
    return <BookOpen className={`${sizeClass} text-indigo-500`} />;
  }
  if (id.includes('estadisticas_atel') || id.includes('alta_direccion') || id.includes('dofa') || id.includes('presupuesto') || id.includes('indicadores')) {
    return <BarChart3 className={`${sizeClass} text-purple-600`} />;
  }
  if (id.includes('atel') || id.includes('accidente') || id.includes('incidente')) {
    return <AlertTriangle className={`${sizeClass} text-rose-600`} />;
  }
  if (id.includes('if_node') || id.includes('if_router')) {
    return <GitFork className={`${sizeClass} text-emerald-600`} />;
  }
  if (id.includes('memory') || id.includes('rag')) {
    return <Brain className={`${sizeClass} text-pink-500`} />;
  }
  if (id.includes('bell') || id.includes('notificacion')) {
    return <Bell className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('skill')) {
    return <Puzzle className={`${sizeClass} text-violet-600 dark:text-violet-400`} />;
  }
  if (id.includes('rule') || id.includes('regla')) {
    return <Scale className={`${sizeClass} text-emerald-600 dark:text-emerald-400`} />;
  }
  if (id.includes('web_search') || id.includes('busqueda') || id.includes('search') || id === 'google') {
    return <Globe className={`${sizeClass} text-blue-500`} />;
  }

  return <ShieldCheck className={`${sizeClass} text-teal-600`} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LIENZO INTERACTIVO DE FLUJOS WAPPY (DRAG & DROP + CABLES BEZIER)
   ═══════════════════════════════════════════════════════════════════════════ */

interface WappyWorkflowCanvasProps {
  workflowNodes: WorkflowNodesConfig;
  onChange?: (next: WorkflowNodesConfig) => void;
  agentId?: string;
  agentName: string;
  agents?: Array<{ id: string; name: string }>;
  onSelectAgent?: (agentId: string) => void;
  prompt?: string;
  onChangePrompt?: (nextPrompt: string) => void;
  onAutoBuildPrompt?: () => void;
  scheduleType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  onChangeScheduleType?: (type: 'hourly' | 'daily' | 'weekly' | 'monthly') => void;
  hour?: number;
  onChangeHour?: (hour: number) => void;
  minute?: number;
  onChangeMinute?: (minute: number) => void;
  daysOfWeek?: number[];
  onChangeDaysOfWeek?: (days: number[]) => void;
  dayOfMonth?: number;
  onChangeDayOfMonth?: (day: number) => void;
  intervalHours?: number;
  onChangeIntervalHours?: (hours: number) => void;
  emailsStr?: string;
  onChangeEmailsStr?: (emails: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

interface VisualNodeInstance {
  key: string;
  nodeId: string;
  shape:
    | 'trigger'
    | 'square_extractor'
    | 'agent'
    | 'if'
    | 'logic'
    | 'square_hito'
    | 'square_output'
    | 'circle_model'
    | 'circle_memory'
    | 'circle_tool'
    | 'custom_node';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  removable?: boolean;
  group?: 'triggers' | 'extractors' | 'memories' | 'inputs' | 'hitos' | 'outputs';
  customNodeType?: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
}

export default function WappyWorkflowCanvas({
  workflowNodes,
  onChange,
  agentId,
  agentName,
  agents = [],
  onSelectAgent,
  prompt = '',
  onChangePrompt,
  onAutoBuildPrompt,
  scheduleType = 'daily',
  onChangeScheduleType,
  hour = 8,
  onChangeHour,
  minute = 0,
  onChangeMinute,
  daysOfWeek = [1],
  onChangeDaysOfWeek,
  dayOfMonth = 1,
  onChangeDayOfMonth,
  intervalHours = 1,
  onChangeIntervalHours,
  emailsStr = '',
  onChangeEmailsStr,
  readOnly = false,
  compact = false,
}: WappyWorkflowCanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [paletteTab, setPaletteTab] = useState<
    | 'triggers'
    | 'extractors'
    | 'ai_engine'
    | 'memories'
    | 'connectors'
    | 'skills_rules'
    | 'subagents'
    | 'scraping'
    | 'hitos'
    | 'outputs'
  >('triggers');
  const [selectedToolSubgroup, setSelectedToolSubgroup] = useState<
    'all_tools' | 'wappy_tools' | 'google_tools' | 'api_tools' | 'mcp_tools'
  >('all_tools');
  const [zoom, setZoom] = useState<number>(compact ? 0.68 : 0.9);

  // Nodo actualmente abierto en el Inspector de Configuración por Nodo de 3 Columnas estilo n8n (al hacer clic sobre cualquier nodo)
  const [activeConfigNodeKey, setActiveConfigNodeKey] = useState<string | null>(null);
  const [ndvCenterTab, setNdvCenterTab] = useState<'parameters' | 'settings'>('parameters');
  const [ndvInputView, setNdvInputView] = useState<'schema' | 'table' | 'json'>('table');
  const [ndvOutputTab, setNdvOutputTab] = useState<'output' | 'logs'>('output');
  const [ndvOutputView, setNdvOutputView] = useState<'table' | 'json' | 'schema' | 'markdown'>(
    'table',
  );
  const [ndvInputSearch, setNdvInputSearch] = useState<string>('');
  const [ndvOutputSearch, setNdvOutputSearch] = useState<string>('');
  const [ndvSelectedUpstreamKey, setNdvSelectedUpstreamKey] = useState<string>('auto');
  const [ndvExpandedInputItems, setNdvExpandedInputItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });
  const [ndvExpandedOutputItems, setNdvExpandedOutputItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });
  const [ndvExpandedSchemaGroup, setNdvExpandedSchemaGroup] = useState<boolean>(true);
  const [ndvExpandedOutputSchemaGroup, setNdvExpandedOutputSchemaGroup] = useState<boolean>(true);
  const [ndvExpandedLogItems, setNdvExpandedLogItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });
  const [ndvExpandedSettingsSections, setNdvExpandedSettingsSections] = useState<
    Record<string, boolean>
  >({
    antigravity: true,
    context: true,
    instruction: true,
    technical: false,
  });
  const [ndvCopiedExpr, setNdvCopiedExpr] = useState<string | null>(null);
  const [ndvEvidenceStripOpen, setNdvEvidenceStripOpen] = useState<boolean>(true);
  const [previewEvidence, setPreviewEvidence] = useState<{
    title: string;
    workerName?: string;
    cedula?: string;
    cargo?: string;
    portal?: string;
    imageUrl?: string | null;
    imageDownloadUrl?: string | null;
    imageFileName?: string | null;
    pdfUrl?: string | null;
    pdfDownloadUrl?: string | null;
    pdfFileName?: string | null;
  } | null>(null);
  const [previewEvidenceMode, setPreviewEvidenceMode] = useState<'image' | 'pdf'>('image');

  const handleOpenEvidencePreview = useCallback(
    (ev: ScraperCapturedEvidence, preferredMode?: 'image' | 'pdf') => {
      const normImg = normalizeEvidenceUrlForBrowser(ev.imageUrl);
      const normImgDl =
        normalizeEvidenceUrlForBrowser(ev.imageDownloadUrl) ||
        (normImg ? (normImg.includes('?') ? `${normImg}&download=1` : `${normImg}?download=1`) : null);
      const normPdf = normalizeEvidenceUrlForBrowser(ev.pdfUrl);
      const normPdfDl =
        normalizeEvidenceUrlForBrowser(ev.pdfDownloadUrl) ||
        (normPdf ? (normPdf.includes('?') ? `${normPdf}&download=1` : `${normPdf}?download=1`) : null);

      const mode: 'image' | 'pdf' =
        preferredMode === 'pdf' && normPdf
          ? 'pdf'
          : preferredMode === 'image' && normImg
            ? 'image'
            : normImg
              ? 'image'
              : 'pdf';

      setPreviewEvidenceMode(mode);
      setPreviewEvidence({
        title: ev.title?.trim() || 'Certificado Oficial Capturado',
        workerName: ev.workerName?.trim() || '',
        cedula: ev.cedula?.trim() || '',
        cargo: ev.cargo?.trim() || '',
        portal: ev.portal?.trim() || '',
        imageUrl: normImg,
        imageDownloadUrl: normImgDl,
        imageFileName: ev.imageFileName || null,
        pdfUrl: normPdf,
        pdfDownloadUrl: normPdfDl,
        pdfFileName: ev.pdfFileName || null,
      });
    },
    [],
  );
  const [upstreamLiveRecordsCache, setUpstreamLiveRecordsCache] = useState<
    Record<
      string,
      {
        loading: boolean;
        nodeId: string;
        companyName: string;
        sourceCollection: string;
        totalRecords: number;
        records: Array<Record<string, any>>;
      }
    >
  >({});
  const [customFieldInput, setCustomFieldInput] = useState<string>('');
  const [fieldSearchQuery, setFieldSearchQuery] = useState<string>('');
  const [nodeReportHistory, setNodeReportHistory] = useState<{
    loading: boolean;
    conversations: Array<{
      conversationId: string;
      title: string;
      updatedAt: string;
      tags?: string[];
    }>;
    previewConvId: string | null;
    previewTitle: string | null;
    previewText: string | null;
    previewLoading: boolean;
  }>({
    loading: false,
    conversations: [],
    previewConvId: null,
    previewTitle: null,
    previewText: null,
    previewLoading: false,
  });
  const [liveRecordSearch, setLiveRecordSearch] = useState<string>('');
  const [nodeLiveInspectorData, setNodeLiveInspectorData] = useState<{
    loading: boolean;
    supported: boolean;
    nodeId: string | null;
    companyName: string;
    sourceCollection: string;
    totalRecords: number;
    criticalCount: number;
    kpis: Array<{
      label: string;
      value: string | number;
      status?: 'ok' | 'warn' | 'critical' | 'info' | string;
    }>;
    records: Array<{
      id: string;
      label: string;
      sublabel?: string;
      badge?: string;
      isCritical?: boolean;
      fields?: Record<string, any>;
      values?: Record<string, any>;
      data?: Record<string, any>;
      [key: string]: any;
    }>;
  }>({
    loading: false,
    supported: false,
    nodeId: null,
    companyName: '',
    sourceCollection: '',
    totalRecords: 0,
    criticalCount: 0,
    kpis: [],
    records: [],
  });
  const pointerDownClientRef = useRef<{ x: number; y: number } | null>(null);

  // Estado sincronizado con Somos SST (/api/sgsst/config) de qué aplicativos están "En Construcción"
  const [disabledSgsstApps, setDisabledSgsstApps] = useState<string[]>(DEFAULT_CONSTRUCTION_APP_IDS);
  const [selectedHitoFilter, setSelectedHitoFilter] = useState<string>('all');
  const [constructionNotice, setConstructionNotice] = useState<string | null>(null);

  // Estado en tiempo real de la instancia Google Antigravity del usuario (necesaria para Web Scraping con Script y Carpetas PC)
  const [antigravityStatus, setAntigravityStatus] = useState<{
    connected: boolean;
    localConnected: boolean;
    cloudConnected: boolean;
    activeMode: string;
  }>({
    connected: false,
    localConnected: false,
    cloudConnected: false,
    activeMode: 'none',
  });

  // Creador de Nodos Personalizados del Usuario (Skills, Sub-Agentes, Reglas, Web Scraping AGY, Búsqueda Web)
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<
    'all' | 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search' | 'my_created'
  >('all');
  const [showCustomNodeBuilder, setShowCustomNodeBuilder] = useState<boolean>(false);
  const [newCustomNodeForm, setNewCustomNodeForm] = useState<{
    nodeType: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
    title: string;
    subtitle: string;
    content: string;
    targetUrl: string;
    scriptEngine: 'python_bs4' | 'node_cheerio' | 'chrome_mcp' | 'custom_script';
    scriptCode: string;
  }>({
    nodeType: 'skill',
    title: '',
    subtitle: '',
    content: '',
    targetUrl: '',
    scriptEngine: 'python_bs4',
    scriptCode: '',
  });
  const [savedUserLibraryNodes, setSavedUserLibraryNodes] = useState<CanvasCustomUserNode[]>(() => {
    try {
      const raw = localStorage.getItem('wappy_custom_workflow_nodes_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  // Estado en tiempo real de la Empresa Activa en Somos SST (/api/sgsst/company-info)
  const [activeCompanyInfo, setActiveCompanyInfo] = useState<{
    companyName: string;
    nit: string;
    arl: string;
    riskLevel: string;
    ciiu: string;
    economicActivity: string;
    workerCount: number;
    city: string;
    address: string;
    legalRepresentative: string;
    responsibleSST: string;
    licenseNumber: string;
    email: string;
    sedesCount: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadActiveCompany = () => {
      const token =
        (typeof window !== 'undefined' && (window as any).platformUserToken) ||
        localStorage.getItem('token') ||
        '';
      axios
        .get(
          '/api/sgsst/company-info',
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
        )
        .then((res) => {
          if (!mounted || !res.data || !res.data.companyName) return;
          const d = res.data;
          setActiveCompanyInfo({
            companyName: String(d.companyName || '').trim(),
            nit: String(d.nit || '').trim(),
            arl: String(d.arl || '').trim(),
            riskLevel: String(d.riskLevel || '').trim(),
            ciiu: String(d.ciiu || '').trim(),
            economicActivity: String(d.economicActivity || '').trim(),
            workerCount: Number(d.workerCount || 0),
            city: String(d.city || '').trim(),
            address: String(d.address || '').trim(),
            legalRepresentative: String(d.legalRepresentative || '').trim(),
            responsibleSST: String(d.responsibleSST || '').trim(),
            licenseNumber: String(d.licenseNumber || '').trim(),
            email: String(d.email || '').trim(),
            sedesCount: Array.isArray(d.sedes) ? Math.max(1, d.sedes.length) : 1,
          });
        })
        .catch(() => {});
    };

    loadActiveCompany();
    if (typeof window !== 'undefined') {
      window.addEventListener('company-switched', loadActiveCompany);
      window.addEventListener('close-company-info', loadActiveCompany);
    }

    axios
      .get('/api/sgsst/config')
      .then((res) => {
        if (mounted && Array.isArray(res.data?.disabledApps)) {
          setDisabledSgsstApps(res.data.disabledApps);
        }
      })
      .catch(() => {});
    axios
      .get('/api/mcp-bridge/antigravity/status')
      .then((res) => {
        if (mounted && res.data) {
          setAntigravityStatus({
            connected: Boolean(res.data.connected),
            localConnected: Boolean(res.data.localConnected),
            cloudConnected: Boolean(res.data.cloudConnected),
            activeMode: res.data.activeMode || 'none',
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('company-switched', loadActiveCompany);
        window.removeEventListener('close-company-info', loadActiveCompany);
      }
    };
  }, []);

  // Lista de agentes accesibles por el usuario + Tenshi Avatar (Orquestador 3D de Voz y Gestión) diferenciado de Tenshi Agente de texto
  const availableAgentsWithTenshiAvatar = useMemo(() => {
    const list: Array<{ id: string; name: string; isTenshiAvatar?: boolean }> = [
      {
        id: 'tenshi_avatar_orchestrator',
        name: '🐱 Tenshi Avatar (Voz y Orquestador 3D)',
        isTenshiAvatar: true,
      },
    ];
    agents.forEach((ag) => {
      if (!ag?.id) return;
      const cleanName =
        ag.name?.trim().toLowerCase() === 'tenshi'
          ? 'Tenshi (Agente de Chat)'
          : ag.name;
      list.push({ id: ag.id, name: cleanName });
    });
    return list;
  }, [agents]);

  // Herramienta activa en el área de trabajo: 'pan' (Manita para desplazarse) | 'select' (Caja para seleccionar varios/parte)
  const [canvasTool, setCanvasTool] = useState<'pan' | 'select'>('pan');
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{
    clientX: number;
    clientY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  // Selección múltiple de nodos (para mover todo el flujo o solo una parte a la vez)
  const [selectedNodeKeys, setSelectedNodeKeys] = useState<string[]>([]);
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);
  const [groupDragStart, setGroupDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // Estado de arrastre de nodos en el lienzo
  const [draggingNodeKey, setDraggingNodeKey] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Estado para unir nodos con el mouse (drag wire from port to port)
  const [wiringFrom, setWiringFrom] = useState<{
    sourceKey: string;
    portType: 'main_out' | 'diamond_model' | 'diamond_memory' | 'diamond_tool' | 'if_true' | 'if_false';
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);

  const activeTriggers = useMemo(() => normalizeTriggersList(workflowNodes), [workflowNodes]);
  const activeExtractors = useMemo(() => normalizeExtractorsList(workflowNodes), [workflowNodes]);
  const activeMemories = useMemo(() => normalizeMemoriesList(workflowNodes), [workflowNodes]);
  const aiEngine = workflowNodes?.aiEngine || 'wappy';
  const aiModel = workflowNodes?.aiModel || 'gemini-3.6-flash';
  const includeIfNode = workflowNodes?.includeIfNode !== false;

  const currentModelDef = useMemo(() => {
    if (aiEngine === 'antigravity_cloud') {
      return AI_ENGINE_MODELS.find((m) => m.engine === 'antigravity_cloud') || AI_ENGINE_MODELS[4] || AI_ENGINE_MODELS[3];
    }
    if (aiEngine === 'antigravity') {
      return AI_ENGINE_MODELS.find((m) => m.engine === 'antigravity') || AI_ENGINE_MODELS[3];
    }
    return (
      AI_ENGINE_MODELS.find((m) => m.engine === 'wappy' && m.model === aiModel) || AI_ENGINE_MODELS[0]
    );
  }, [aiEngine, aiModel]);

  const customPositions = workflowNodes?.canvasLayout?.positions || {};

  // Construir todos los nodos de las 5 Etapas del Flujo Visual WAPPY
  const visualNodes = useMemo<VisualNodeInstance[]>(() => {
    const list: VisualNodeInstance[] = [];

    // ETAPA 1. NODOS DISPARADORES / ENTRADAS (Forma en "D" con rayo ⚡)
    activeTriggers.forEach((trigId, idx) => {
      const triggerDef = getNodeDefById(trigId) || TRIGGER_NODES[0];
      const key = idx === 0 ? 'trigger_root' : `trigger_${triggerDef.id}`;
      const defaultY =
        activeTriggers.length === 1
          ? 76
          : activeTriggers.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const trigPos = customPositions[key] || { x: 24, y: defaultY };
      list.push({
        key,
        nodeId: triggerDef.id,
        shape: 'trigger',
        title: triggerDef.shortLabel,
        subtitle: triggerDef.badge || '1. Disparador',
        x: trigPos.x,
        y: trigPos.y,
        width: 70,
        height: 70,
        removable: activeTriggers.length > 1,
        group: 'triggers',
      });
    });

    // ETAPA 2. NODOS DE EXTRACCIÓN DE DATOS / LECTURA PREVIA (Entre el Disparador y el Agente IA)
    activeExtractors.forEach((extId, idx) => {
      const extDef = getNodeDefById(extId) || EXTRACTOR_NODES[0];
      const key = `extractor_${extDef.id}`;
      const defaultY =
        activeExtractors.length === 1
          ? 76
          : activeExtractors.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const extPos = customPositions[key] || { x: 146, y: defaultY };
      const dynamicExtSubtitle =
        extDef.id === 'extract_sst_workers' && activeCompanyInfo?.companyName
          ? `${activeCompanyInfo.workerCount ? `${activeCompanyInfo.workerCount} Trab. · ` : ''}${activeCompanyInfo.companyName}`
          : extDef.badge || '2. Extraer Datos';
      list.push({
        key,
        nodeId: extDef.id,
        shape: 'square_extractor',
        title: extDef.shortLabel,
        subtitle: dynamicExtSubtitle,
        x: extPos.x,
        y: extPos.y,
        width: 70,
        height: 70,
        removable: true,
        group: 'extractors',
      });
    });

    // ETAPA 3. AGENTE IA PRINCIPAL (Rectángulo ancho central con 3 rombos abajo: Modelo IA *, Memoria ◆, Herramienta +)
    const agentPos = customPositions['agent_root'] || { x: 274, y: 68 };
    list.push({
      key: 'agent_root',
      nodeId: agentId || 'ai_agent_root',
      shape: 'agent',
      title: 'Agente IA',
      subtitle:
        agentId === 'tenshi_avatar_orchestrator'
          ? '🐱 Tenshi Avatar (Voz 3D)'
          : agentName || 'Consultor SG-SST',
      x: agentPos.x,
      y: agentPos.y,
      width: 232,
      height: 88,
    });

    // 3A. SUB-NODO CIRCULAR: MODELO IA * (WAPPY Rotación de Claves vs Antigravity Local vs Antigravity Cloud 24/7)
    const modelPos = customPositions['sub_model'] || { x: 165, y: 228 };
    list.push({
      key: 'sub_model',
      nodeId: currentModelDef.id,
      shape: 'circle_model',
      title: currentModelDef.shortLabel,
      subtitle:
        aiEngine === 'antigravity_cloud'
          ? 'Cloud 24/7 + MCP'
          : aiEngine === 'antigravity'
            ? 'Local Mac/PC + MCP'
            : 'Rotación Claves WAPPY',
      x: modelPos.x,
      y: modelPos.y,
      width: 62,
      height: 62,
    });

    // 3B. SUB-NODOS CIRCULARES: MEMORIAS DEL AGENTE (Separación de 106px para que los textos inferiores jamás se pisen)
    activeMemories.forEach((memId, idx) => {
      const memDef = MEMORY_NODES.find((m) => m.id === memId) || MEMORY_NODES[0];
      const key = idx === 0 ? 'sub_memory' : `sub_memory_${memDef.id}`;
      const defaultX = 274 + idx * 106;
      const defaultY = 228;
      const memPos = customPositions[key] || { x: defaultX, y: defaultY };
      const isCompanyMem = memDef.id === 'wappy_memory_company';
      const dynamicMemTitle =
        isCompanyMem && activeCompanyInfo?.companyName
          ? `Memoria: ${activeCompanyInfo.companyName}`
          : memDef.shortLabel;
      const dynamicMemSubtitle =
        isCompanyMem && activeCompanyInfo?.nit
          ? `NIT ${activeCompanyInfo.nit}${activeCompanyInfo.arl ? ` · ${activeCompanyInfo.arl}` : ''}`
          : memDef.badge || 'Memoria Activa';
      list.push({
        key,
        nodeId: memDef.id,
        shape: 'circle_memory',
        title: dynamicMemTitle,
        subtitle: dynamicMemSubtitle,
        x: memPos.x,
        y: memPos.y,
        width: 62,
        height: 62,
        removable: true,
        group: 'memories',
      });
    });

    // 3C. SUB-NODOS CIRCULARES: HERRAMIENTAS DEL AGENTE (Separación limpia de 106px)
    const toolInputs = workflowNodes?.inputs || [];
    const memoryRightEdge = 274 + Math.max(1, activeMemories.length) * 106;
    toolInputs.forEach((toolId, idx) => {
      const def = getNodeDefById(toolId);
      if (!def) return;
      const key = `tool_inputs_${toolId}`;
      const defaultX = Math.max(380, memoryRightEdge) + idx * 106;
      const defaultY = 228;
      const pos = customPositions[key] || { x: defaultX, y: defaultY };
      const dynamicToolTitle =
        toolId === 'somos_sst_empresa' && activeCompanyInfo?.companyName
          ? activeCompanyInfo.companyName
          : def.shortLabel;
      const dynamicToolSubtitle =
        toolId === 'somos_sst_empresa' && activeCompanyInfo?.nit
          ? `NIT ${activeCompanyInfo.nit} · R.${activeCompanyInfo.riskLevel || 'I'}`
          : toolId === 'somos_sst_trabajadores' && activeCompanyInfo?.companyName
            ? `${activeCompanyInfo.workerCount ? `${activeCompanyInfo.workerCount} Trab. · ` : ''}${activeCompanyInfo.companyName}`
            : (toolId === 'pronostico_clima_sst' || toolId === 'buscar_centros_emergencia') &&
                activeCompanyInfo?.city
              ? `Sede: ${activeCompanyInfo.city}`
              : 'Herramienta IA';
      list.push({
        key,
        nodeId: toolId,
        shape: 'circle_tool',
        title: dynamicToolTitle,
        subtitle: dynamicToolSubtitle,
        x: pos.x,
        y: pos.y,
        width: 62,
        height: 62,
        removable: true,
        group: 'inputs',
      });
    });

    // ETAPA 4A. NODO CONDICIONAL SI / NO (Cuadrado con icono de bifurcación y salidas sí / no)
    if (includeIfNode) {
      const ifPos = customPositions['if_router'] || { x: 548, y: 76 };
      list.push({
        key: 'if_router',
        nodeId: 'if_node_router',
        shape: 'if',
        title: 'Condición Si/No',
        subtitle: 'Hallazgos / Alerta',
        x: ifPos.x,
        y: ifPos.y,
        width: 72,
        height: 72,
        removable: true,
      });
    }

    // NODOS LÓGICOS ADICIONALES (Loop, Merge, Aprobación Humana)
    const logicNodes = workflowNodes?.canvasLayout?.logicNodes || [];
    logicNodes.forEach((ln, idx) => {
      const pos = customPositions[ln.key] || { x: 548 + idx * 115, y: 185 };
      list.push({
        key: ln.key,
        nodeId: `logic_${ln.logicType}`,
        shape: 'logic',
        title: ln.title,
        subtitle: ln.subtitle,
        x: pos.x,
        y: pos.y,
        width: 72,
        height: 72,
        removable: true,
      });
    });

    // ETAPA 4B. NODOS DE ACCIÓN EN HITOS / APLICATIVOS SOMOS SST (Cambiar / Alimentar Hitos 1–7)
    const hitosList = workflowNodes?.hitos || [];
    const hitoBaseX = includeIfNode ? 662 : 556;
    hitosList.forEach((hitoId, idx) => {
      const def = getNodeDefById(hitoId);
      if (!def) return;
      const key = `tool_hitos_${hitoId}`;
      const defaultY =
        hitosList.length === 1
          ? 76
          : hitosList.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const pos = customPositions[key] || { x: hitoBaseX, y: defaultY };
      list.push({
        key,
        nodeId: hitoId,
        shape: 'square_hito',
        title: def.shortLabel,
        subtitle: def.badge || '9. Hitos Somos SST',
        x: pos.x,
        y: pos.y,
        width: 72,
        height: 72,
        removable: true,
        group: 'hitos',
      });
    });

    // ETAPA 5. NODOS DE BITÁCORA Y NOTIFICACIÓN FINAL (Gmail, WAPPY Notification, Antigravity PC/Cloud)
    const outputs = Array.isArray(workflowNodes?.outputs)
      ? workflowNodes.outputs
      : ['email_report'];
    const outBaseX = hitosList.length > 0 ? hitoBaseX + 128 : includeIfNode ? 674 : 566;
    outputs.forEach((outId, idx) => {
      const def = getNodeDefById(outId);
      if (!def) return;
      const key = `out_${outId}`;
      const baseY =
        outputs.length === 1
          ? 76
          : outputs.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const pos = customPositions[key] || { x: outBaseX, y: baseY };
      list.push({
        key,
        nodeId: outId,
        shape: 'square_output',
        title: def.shortLabel,
        subtitle: def.badge || '10. Bitácora & Salida',
        x: pos.x,
        y: pos.y,
        width: 72,
        height: 72,
        removable: true,
        group: 'outputs',
      });
    });

    // AGENTES IA ADICIONALES / REVISORES EN EL MISMO LIENZO (Orquestación Multi-IA con Segundo Prompt propio)
    const extraAgents = workflowNodes?.canvasLayout?.extraAgents || [];
    extraAgents.forEach((ea, idx) => {
      const pos = customPositions[ea.key] || { x: 540 + idx * 255, y: 188 };
      list.push({
        key: ea.key,
        nodeId: ea.agentId || 'ai_agent_extra',
        shape: 'agent',
        title: `Agente IA #${idx + 2}`,
        subtitle:
          ea.agentId === 'tenshi_avatar_orchestrator'
            ? '🐱 Tenshi Avatar (Voz 3D)'
            : ea.agentName || 'IA Revisora / Auditora',
        x: pos.x,
        y: pos.y,
        width: 232,
        height: 88,
        removable: true,
      });
    });

    // NODOS PERSONALIZADOS DE SKILLS, SUB-AGENTES, REGLAS, WEB SCRAPING (ANTIGRAVITY SCRIPT) Y BÚSQUEDA WEB
    const customNodesList = workflowNodes?.canvasLayout?.customNodes || [];
    customNodesList.forEach((cn, idx) => {
      const defaultCustomX = Math.max(380, memoryRightEdge) + (toolInputs.length + idx) * 106;
      const pos = customPositions[cn.key] || { x: defaultCustomX, y: 228 };
      list.push({
        key: cn.key,
        nodeId: cn.key,
        shape: 'custom_node',
        customNodeType: cn.nodeType,
        title: cn.title,
        subtitle: cn.subtitle,
        x: pos.x,
        y: pos.y,
        width: 62,
        height: 62,
        removable: true,
      });
    });

    return list;
  }, [
    workflowNodes,
    activeTriggers,
    activeExtractors,
    activeMemories,
    agentId,
    agentName,
    currentModelDef,
    aiEngine,
    includeIfNode,
    customPositions,
    activeCompanyInfo,
  ]);

  // Calcular los cables curvos Bezier entre los módulos (con soporte para borrar cables automáticos y conectar libremente)
  const wires = useMemo(() => {
    const map = new Map<string, VisualNodeInstance>();
    visualNodes.forEach((n) => map.set(n.key, n));

    const removedSet = new Set(workflowNodes?.canvasLayout?.removedWires || []);
    const allAutoMainRemoved = removedSet.has('__ALL_AUTO_MAIN__');
    const triggerNodes = visualNodes.filter((n) => n.shape === 'trigger');
    const extractorNodes = visualNodes.filter((n) => n.shape === 'square_extractor');
    const agentNode = map.get('agent_root');
    const ifNode = map.get('if_router');
    const hitoNodes = visualNodes.filter((n) => n.shape === 'square_hito');
    const modelNode = map.get('sub_model');
    const memNodes = visualNodes.filter((n) => n.shape === 'circle_memory');
    const toolNodes = visualNodes.filter((n) => n.shape === 'circle_tool');
    const outputNodes = visualNodes.filter((n) => n.shape === 'square_output');
    const customUserNodes = visualNodes.filter((n) => n.shape === 'custom_node');

    const paths: Array<{
      id: string;
      sourceKey: string;
      targetKey: string;
      isSub: boolean;
      d: string;
      dashed: boolean;
      color: string;
      midX: number;
      midY: number;
      label?: string;
      labelX?: number;
      labelY?: number;
    }> = [];

    const pushWire = (w: {
      id: string;
      sourceKey: string;
      targetKey: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      dashed: boolean;
      color: string;
      isSub?: boolean;
      label?: string;
      labelX?: number;
      labelY?: number;
    }) => {
      if (removedSet.has(w.id)) return;
      if (!w.isSub && !w.id.startsWith('custom_') && allAutoMainRemoved) return;
      const d = w.isSub
        ? (() => {
            const dy = Math.max(38, Math.abs(w.y2 - w.y1) * 0.52);
            return `M ${w.x1} ${w.y1} C ${w.x1} ${w.y1 + dy}, ${w.x2} ${w.y2 - dy}, ${w.x2} ${w.y2}`;
          })()
        : (() => {
            const dx = Math.max(36, Math.abs(w.x2 - w.x1) * 0.48);
            return `M ${w.x1} ${w.y1} C ${w.x1 + dx} ${w.y1}, ${w.x2 - dx} ${w.y2}, ${w.x2} ${w.y2}`;
          })();
      paths.push({
        id: w.id,
        sourceKey: w.sourceKey,
        targetKey: w.targetKey,
        isSub: Boolean(w.isSub),
        d,
        dashed: w.dashed,
        color: w.color,
        midX: Math.round((w.x1 + w.x2) / 2),
        midY: Math.round((w.y1 + w.y2) / 2),
        label: w.label,
        labelX: w.labelX,
        labelY: w.labelY,
      });
    };

    // 1. Etapa 1 (Disparadores) ● ──> ● Etapa 2 (Extraer Datos) ● ──> ● Etapa 3 (Agente IA)
    if (extractorNodes.length > 0 && agentNode) {
      triggerNodes.forEach((trigNode) => {
        extractorNodes.forEach((extNode) => {
          pushWire({
            id: `wire_trig_ext_${trigNode.key}_${extNode.key}`,
            sourceKey: trigNode.key,
            targetKey: extNode.key,
            x1: trigNode.x + trigNode.width,
            y1: trigNode.y + trigNode.height / 2,
            x2: extNode.x,
            y2: extNode.y + extNode.height / 2,
            dashed: false,
            color: '#94a3b8',
          });
        });
      });

      extractorNodes.forEach((extNode) => {
        pushWire({
          id: `wire_ext_agent_${extNode.key}`,
          sourceKey: extNode.key,
          targetKey: agentNode.key,
          x1: extNode.x + extNode.width,
          y1: extNode.y + extNode.height / 2,
          x2: agentNode.x,
          y2: agentNode.y + agentNode.height / 2,
          dashed: false,
          color: '#0ea5e9',
        });
      });
    } else if (agentNode) {
      triggerNodes.forEach((trigNode) => {
        pushWire({
          id: `wire_trigger_agent_${trigNode.key}`,
          sourceKey: trigNode.key,
          targetKey: agentNode.key,
          x1: trigNode.x + trigNode.width,
          y1: trigNode.y + trigNode.height / 2,
          x2: agentNode.x,
          y2: agentNode.y + agentNode.height / 2,
          dashed: false,
          color: '#94a3b8',
        });
      });
    }

    // 2. Etapa 3 (Agente IA) ● ──> ● Condición Si/No ──> ● Etapa 4 (Hitos/Apps) ──> ● Etapa 5 (Bitácora Final)
    const stageAfterAgent = ifNode ? [ifNode] : hitoNodes.length > 0 ? hitoNodes : outputNodes;
    if (agentNode) {
      stageAfterAgent.forEach((target) => {
        pushWire({
          id: `wire_agent_${target.key}`,
          sourceKey: agentNode.key,
          targetKey: target.key,
          x1: agentNode.x + agentNode.width,
          y1: agentNode.y + agentNode.height / 2,
          x2: target.x,
          y2: target.y + target.height / 2,
          dashed: false,
          color: '#94a3b8',
        });
      });
    }

    if (ifNode) {
      const nextTargets = hitoNodes.length > 0 ? hitoNodes : outputNodes;
      nextTargets.forEach((target, idx) => {
        const isTrueBranch = idx === 0;
        const x1Port = ifNode.x + ifNode.width;
        const y1Port = ifNode.y + (isTrueBranch ? 24 : 50);
        pushWire({
          id: `wire_if_${target.key}`,
          sourceKey: ifNode.key,
          targetKey: target.key,
          x1: x1Port,
          y1: y1Port,
          x2: target.x,
          y2: target.y + target.height / 2,
          dashed: false,
          color: isTrueBranch ? '#10b981' : '#94a3b8',
          label: isTrueBranch ? 'sí' : 'no',
          labelX: x1Port + 16,
          labelY: y1Port - 5,
        });
      });
    }

    if (hitoNodes.length > 0 && outputNodes.length > 0) {
      hitoNodes.forEach((hNode) => {
        outputNodes.forEach((outNode) => {
          pushWire({
            id: `wire_hito_out_${hNode.key}_${outNode.key}`,
            sourceKey: hNode.key,
            targetKey: outNode.key,
            x1: hNode.x + hNode.width,
            y1: hNode.y + hNode.height / 2,
            x2: outNode.x,
            y2: outNode.y + outNode.height / 2,
            dashed: false,
            color: '#10b981',
          });
        });
      });
    }

    // 3A. Agente IA ◆ (Modelo IA *) ── - - ──> ◆ Sub-Nodo Circular Modelo
    if (agentNode && modelNode) {
      pushWire({
        id: 'wire_sub_model',
        sourceKey: agentNode.key,
        targetKey: modelNode.key,
        x1: agentNode.x + 44,
        y1: agentNode.y + agentNode.height,
        x2: modelNode.x + modelNode.width / 2,
        y2: modelNode.y,
        dashed: true,
        isSub: true,
        color: '#818cf8',
      });
    }

    // 3B. Agente IA ◆ (Memoria) ── - - ──> ◆ Sub-Nodos Circulares de Memoria
    if (agentNode) {
      memNodes.forEach((mNode) => {
        pushWire({
          id: `wire_sub_memory_${mNode.key}`,
          sourceKey: agentNode.key,
          targetKey: mNode.key,
          x1: agentNode.x + 114,
          y1: agentNode.y + agentNode.height,
          x2: mNode.x + mNode.width / 2,
          y2: mNode.y,
          dashed: true,
          isSub: true,
          color: '#ec4899',
        });
      });
    }

    // 3C. Agente IA ◆ (Herramienta +) ── - - ──> ◆ Sub-Nodos Circulares de Herramientas del Agente
    if (agentNode) {
      toolNodes.forEach((tNode) => {
        pushWire({
          id: `wire_sub_tool_${tNode.key}`,
          sourceKey: agentNode.key,
          targetKey: tNode.key,
          x1: agentNode.x + 184,
          y1: agentNode.y + agentNode.height,
          x2: tNode.x + tNode.width / 2,
          y2: tNode.y,
          dashed: true,
          isSub: true,
          color: '#818cf8',
        });
      });
    }

    // 6. Cables personalizados creados por el usuario
    const customEdges = workflowNodes?.canvasLayout?.edges || [];
    customEdges.forEach((edge) => {
      const fromNode = map.get(edge.from);
      const toNode = map.get(edge.to);
      if (!fromNode || !toNode) return;

      const isFromSubCircle =
        fromNode.shape.startsWith('circle_') ||
        (fromNode.shape === 'custom_node' && edge.kind === 'sub');
      const isToSubCircle =
        toNode.shape.startsWith('circle_') ||
        (toNode.shape === 'custom_node' && edge.kind === 'sub');

      if (isFromSubCircle || isToSubCircle) {
        const agNode = fromNode.shape === 'agent' ? fromNode : toNode.shape === 'agent' ? toNode : null;
        const subCircle = isFromSubCircle ? fromNode : isToSubCircle ? toNode : null;
        if (!agNode || !subCircle) return;
        const portOffsetX =
          subCircle.shape === 'circle_model'
            ? 44
            : subCircle.shape === 'circle_memory'
              ? 114
              : 184;
        pushWire({
          id: edge.id,
          sourceKey: agNode.key,
          targetKey: subCircle.key,
          x1: agNode.x + portOffsetX,
          y1: agNode.y + agNode.height,
          x2: subCircle.x + subCircle.width / 2,
          y2: subCircle.y,
          dashed: true,
          isSub: true,
          color: subCircle.shape === 'circle_memory' ? '#ec4899' : '#818cf8',
        });
        return;
      }

      pushWire({
        id: edge.id,
        sourceKey: fromNode.key,
        targetKey: toNode.key,
        x1: fromNode.x + fromNode.width,
        y1: fromNode.y + fromNode.height / 2,
        x2: toNode.x,
        y2: toNode.y + toNode.height / 2,
        dashed: false,
        color: '#14b8a6',
      });
    });

    // Si hay nodos custom_node que aún no tienen cable propio ni fueron desconectados, conectarlos como sub-nodo de agent_root
    if (agentNode && !allAutoMainRemoved) {
      customUserNodes.forEach((cnNode) => {
        const hasAnyEdge = paths.some((p) => p.sourceKey === cnNode.key || p.targetKey === cnNode.key);
        const autoCustomWireId = `wire_sub_custom_${cnNode.key}`;
        if (!hasAnyEdge && !removedSet.has(autoCustomWireId)) {
          pushWire({
            id: autoCustomWireId,
            sourceKey: agentNode.key,
            targetKey: cnNode.key,
            x1: agentNode.x + 184,
            y1: agentNode.y + agentNode.height,
            x2: cnNode.x + cnNode.width / 2,
            y2: cnNode.y,
            dashed: true,
            isSub: true,
            color: '#a855f7',
          });
        }
      });
    }

    return paths;
  }, [visualNodes, workflowNodes?.canvasLayout?.edges, workflowNodes?.canvasLayout?.removedWires]);

  // ─── PLAN DE EJECUCIÓN CONSECUTIVO DEL GRAFO CONECTADO (`Paso #1 ➔ Paso #2 ➔ Paso #3...`) ───
  // Calcula en tiempo real qué nodos están REALMENTE conectados mediante cables activos desde los Disparadores
  // y en qué orden consecutivo exacto deben ejecutarse (respetando tanto las flechas de los cables como el orden visual X/Y).
  const connectedExecutionPlan = useMemo(() => {
    const nodeByKey = new Map<string, VisualNodeInstance>();
    visualNodes.forEach((n) => nodeByKey.set(n.key, n));

    const mapShapeToCategory = (
      shape: VisualNodeInstance['shape'],
    ):
      | 'trigger'
      | 'extractor'
      | 'model'
      | 'memory'
      | 'tool'
      | 'agent'
      | 'condition'
      | 'logic'
      | 'hito'
      | 'output'
      | 'custom_node' => {
      switch (shape) {
        case 'trigger':
          return 'trigger';
        case 'square_extractor':
          return 'extractor';
        case 'circle_model':
          return 'model';
        case 'circle_memory':
          return 'memory';
        case 'circle_tool':
          return 'tool';
        case 'agent':
          return 'agent';
        case 'if':
          return 'condition';
        case 'logic':
          return 'logic';
        case 'square_hito':
          return 'hito';
        case 'square_output':
          return 'output';
        default:
          return 'custom_node';
      }
    };

    const mainWires = wires.filter((w) => !w.isSub);
    const subWires = wires.filter((w) => w.isSub);

    const outgoingMain = new Map<string, string[]>();
    const incomingMain = new Map<string, string[]>();
    mainWires.forEach((w) => {
      if (!outgoingMain.has(w.sourceKey)) outgoingMain.set(w.sourceKey, []);
      outgoingMain.get(w.sourceKey)!.push(w.targetKey);
      if (!incomingMain.has(w.targetKey)) incomingMain.set(w.targetKey, []);
      incomingMain.get(w.targetKey)!.push(w.sourceKey);
    });

    // Sub-nodos conectados a cada Agente IA
    const agentSubNodes = new Map<string, VisualNodeInstance[]>();
    subWires.forEach((w) => {
      const sNode = nodeByKey.get(w.sourceKey);
      const tNode = nodeByKey.get(w.targetKey);
      if (!sNode || !tNode) return;
      const agKey = sNode.shape === 'agent' ? sNode.key : tNode.shape === 'agent' ? tNode.key : null;
      const subNode = sNode.shape === 'agent' ? tNode : sNode;
      if (!agKey || !subNode) return;
      if (!agentSubNodes.has(agKey)) agentSubNodes.set(agKey, []);
      const list = agentSubNodes.get(agKey)!;
      if (!list.some((item) => item.key === subNode.key)) {
        list.push(subNode);
      }
    });

    // 1. Identificar los disparadores activos conectados al flujo
    const allTriggers = visualNodes
      .filter((n) => n.shape === 'trigger')
      .sort((a, b) => a.y - b.y || a.x - b.x);
    const triggersWithOutgoing = allTriggers.filter(
      (t) => (outgoingMain.get(t.key) || []).length > 0,
    );
    const startTriggers =
      triggersWithOutgoing.length > 0
        ? triggersWithOutgoing
        : mainWires.length === 0
          ? allTriggers
          : [];

    // 2. Recorrer el grafo dirigido desde los disparadores para hallar ÚNICAMENTE los nodos alcanzables (conectados)
    const reachableMainKeys = new Set<string>();
    const bfsQueue: string[] = startTriggers.map((t) => t.key);
    bfsQueue.forEach((k) => reachableMainKeys.add(k));

    while (bfsQueue.length > 0) {
      const curr = bfsQueue.shift()!;
      const neighbors = outgoingMain.get(curr) || [];
      neighbors.forEach((nxt) => {
        if (!reachableMainKeys.has(nxt) && nodeByKey.has(nxt)) {
          reachableMainKeys.add(nxt);
          bfsQueue.push(nxt);
        }
      });
    }

    // 3. Ordenar los nodos principales alcanzables respetando las flechas del grafo (orden topológico) y la posición visual (X, luego Y)
    const hasCustomMainEdges = (workflowNodes?.canvasLayout?.edges || []).some(
      (e) => e.kind !== 'sub',
    );
    const orderedMainNodes: VisualNodeInstance[] = [];

    if (hasCustomMainEdges) {
      // Orden topológico de Kahn sobre el subgrafo alcanzable, desempatando por coordenada X y luego Y
      const inDegree = new Map<string, number>();
      reachableMainKeys.forEach((k) => inDegree.set(k, 0));
      mainWires.forEach((w) => {
        if (reachableMainKeys.has(w.sourceKey) && reachableMainKeys.has(w.targetKey)) {
          inDegree.set(w.targetKey, (inDegree.get(w.targetKey) || 0) + 1);
        }
      });

      const ready: VisualNodeInstance[] = Array.from(reachableMainKeys)
        .filter((k) => (inDegree.get(k) || 0) === 0)
        .map((k) => nodeByKey.get(k)!)
        .filter(Boolean);

      const visited = new Set<string>();
      while (ready.length > 0) {
        ready.sort((a, b) => {
          const aIsTrig = a.shape === 'trigger' ? 0 : 1;
          const bIsTrig = b.shape === 'trigger' ? 0 : 1;
          if (aIsTrig !== bIsTrig) return aIsTrig - bIsTrig;
          return a.x - b.x || a.y - b.y;
        });
        const currNode = ready.shift()!;
        if (visited.has(currNode.key)) continue;
        visited.add(currNode.key);
        orderedMainNodes.push(currNode);

        const nextKeys = outgoingMain.get(currNode.key) || [];
        nextKeys.forEach((nk) => {
          if (!reachableMainKeys.has(nk) || visited.has(nk)) return;
          const deg = (inDegree.get(nk) || 1) - 1;
          inDegree.set(nk, deg);
          if (deg <= 0) {
            const nObj = nodeByKey.get(nk);
            if (nObj) ready.push(nObj);
          }
        });
      }

      // Si quedó algún ciclo en cables personalizados, añadir los restantes por coordenada X/Y
      Array.from(reachableMainKeys).forEach((k) => {
        if (!visited.has(k) && nodeByKey.has(k)) {
          orderedMainNodes.push(nodeByKey.get(k)!);
        }
      });
    } else {
      // En modo de cables automáticos, ordenar primero los Disparadores conectados y luego el resto de nodos conectados de izquierda a derecha (coordenada X, luego Y)
      const connectedList = Array.from(reachableMainKeys)
        .map((k) => nodeByKey.get(k)!)
        .filter(Boolean);
      connectedList.sort((a, b) => {
        const aIsTrig = a.shape === 'trigger' ? 0 : 1;
        const bIsTrig = b.shape === 'trigger' ? 0 : 1;
        if (aIsTrig !== bIsTrig) return aIsTrig - bIsTrig;
        return a.x - b.x || a.y - b.y;
      });
      orderedMainNodes.push(...connectedList);
    }

    // 4. Construir la secuencia final paso a paso insertando los sub-nodos conectados (Modelo IA, Memorias, Herramientas) justo antes de su Agente IA
    const plan: Array<{
      stepNumber: number;
      nodeKey: string;
      nodeId: string;
      category:
        | 'trigger'
        | 'extractor'
        | 'model'
        | 'memory'
        | 'tool'
        | 'agent'
        | 'condition'
        | 'logic'
        | 'hito'
        | 'output'
        | 'custom_node';
      title: string;
      isConnected: boolean;
    }> = [];
    const emittedKeys = new Set<string>();

    orderedMainNodes.forEach((mNode) => {
      if (mNode.shape === 'agent') {
        const subs = (agentSubNodes.get(mNode.key) || [])
          .slice()
          .sort((a, b) => a.x - b.x || a.y - b.y);
        subs.forEach((sub) => {
          if (emittedKeys.has(sub.key)) return;
          emittedKeys.add(sub.key);
          plan.push({
            stepNumber: plan.length + 1,
            nodeKey: sub.key,
            nodeId: sub.nodeId,
            category: mapShapeToCategory(sub.shape),
            title: sub.title,
            isConnected: true,
          });
        });
      }
      if (!emittedKeys.has(mNode.key)) {
        emittedKeys.add(mNode.key);
        plan.push({
          stepNumber: plan.length + 1,
          nodeKey: mNode.key,
          nodeId: mNode.key === 'if_router' ? 'if_condition' : mNode.nodeId,
          category: mapShapeToCategory(mNode.shape),
          title: mNode.title,
          isConnected: true,
        });
      }
    });

    return plan;
  }, [visualNodes, wires, workflowNodes?.canvasLayout?.edges]);

  // Mapa rápido `nodeKey -> stepNumber` (1, 2, 3...) para mostrar la insignia `Paso #N` en cada nodo conectado o `⚪ Sin conectar` en los desconectados
  const stepNumberByNodeKey = useMemo(() => {
    const map = new Map<string, number>();
    connectedExecutionPlan.forEach((item) => {
      map.set(item.nodeKey, item.stepNumber);
    });
    return map;
  }, [connectedExecutionPlan]);

  // Eliminar un cable individual (ya sea automático o creado por el usuario) para reconectar libremente
  const handleRemoveWire = (wireId: string) => {
    if (!onChange || readOnly) return;
    if (wireId.startsWith('custom_')) {
      const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter((e) => e.id !== wireId);
      onChange({
        ...workflowNodes,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          edges: nextEdges,
        },
      });
    } else {
      const prevRemoved = workflowNodes?.canvasLayout?.removedWires || [];
      if (!prevRemoved.includes(wireId)) {
        onChange({
          ...workflowNodes,
          canvasLayout: {
            ...(workflowNodes?.canvasLayout || {}),
            removedWires: [...prevRemoved, wireId],
          },
        });
      }
    }
  };

  // Cortar todos los cables principales automáticos para conectar desde cero en modo 100% libre
  const handleDisconnectAllMainWires = () => {
    if (!onChange || readOnly) return;
    const mainAutoIds = wires
      .filter((w) => !w.dashed && !w.id.startsWith('custom_'))
      .map((w) => w.id);
    const prevRemoved = workflowNodes?.canvasLayout?.removedWires || [];
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        removedWires: Array.from(new Set([...prevRemoved, '__ALL_AUTO_MAIN__', ...mainAutoIds])),
      },
    });
  };

  // Actualizar la configuración individual de cualquier nodo del lienzo (campos, contexto entrada/salida, segundo prompt, modelo IA, scraping, skills, reglas)
  const handleUpdateNodeConfig = (nodeKey: string, partial: Partial<CanvasNodeConfig>) => {
    if (!onChange || readOnly) return;
    const prevConfigs = workflowNodes?.canvasLayout?.nodeConfigs || {};
    const nextConfig: CanvasNodeConfig = {
      ...(prevConfigs[nodeKey] || {}),
      ...partial,
    };

    // Si es un Agente IA Adicional (#2, #3), sincronizar también en extraAgents
    let nextExtra = workflowNodes?.canvasLayout?.extraAgents;
    if (nodeKey.startsWith('agent_extra_') && Array.isArray(nextExtra)) {
      nextExtra = nextExtra.map((ea) =>
        ea.key === nodeKey
          ? {
              ...ea,
              ...(partial.aiEngine ? { aiEngine: partial.aiEngine } : {}),
              ...(partial.aiModel ? { aiModel: partial.aiModel } : {}),
              ...(partial.antigravityMode ? { antigravityMode: partial.antigravityMode } : {}),
              ...(partial.prompt !== undefined ? { prompt: partial.prompt } : {}),
              ...(partial.inputContext !== undefined ? { inputContext: partial.inputContext } : {}),
              ...(partial.outputContext !== undefined ? { outputContext: partial.outputContext } : {}),
            }
          : ea,
      );
    }

    // Si es un Nodo Personalizado (Skill, Sub-Agente, Regla, Web Scraper, Búsqueda Web), sincronizar también en customNodes
    let nextCustomNodes = workflowNodes?.canvasLayout?.customNodes;
    if (Array.isArray(nextCustomNodes) && nextCustomNodes.some((cn) => cn.key === nodeKey)) {
      nextCustomNodes = nextCustomNodes.map((cn) =>
        cn.key === nodeKey
          ? {
              ...cn,
              ...(partial.customTitle !== undefined ? { title: partial.customTitle } : {}),
              ...(partial.customSubtitle !== undefined ? { subtitle: partial.customSubtitle } : {}),
              ...(partial.aiEngine ? { aiEngine: partial.aiEngine } : {}),
              ...(partial.aiModel ? { aiModel: partial.aiModel } : {}),
              ...(partial.antigravityMode ? { antigravityMode: partial.antigravityMode } : {}),
              ...(partial.linkedAgentId !== undefined ? { agentId: partial.linkedAgentId } : {}),
              ...(partial.targetUrl !== undefined ? { targetUrl: partial.targetUrl } : {}),
              ...(partial.scriptEngine ? { scriptEngine: partial.scriptEngine } : {}),
              ...(partial.scriptCode !== undefined ? { scriptCode: partial.scriptCode } : {}),
              ...(partial.skillContent !== undefined ? { content: partial.skillContent } : {}),
              ...(partial.ruleText !== undefined ? { content: partial.ruleText } : {}),
              ...(partial.prompt !== undefined ? { content: partial.prompt } : {}),
            }
          : cn,
      );
    }

    onChange({
      ...workflowNodes,
      ...((nodeKey === 'agent_root' || nodeKey === 'sub_model') && partial.antigravityMode
        ? { antigravityMode: partial.antigravityMode }
        : {}),
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        ...(nextExtra ? { extraAgents: nextExtra } : {}),
        ...(nextCustomNodes ? { customNodes: nextCustomNodes } : {}),
        nodeConfigs: {
          ...prevConfigs,
          [nodeKey]: nextConfig,
        },
      },
    });
  };

  // Agregar un nodo de Skill, Sub-Agente, Regla, Web Scraping con Antigravity o Búsqueda Web al lienzo
  const handleAddCustomNodeToCanvas = (
    nodeData: Omit<CanvasCustomUserNode, 'key'> & { key?: string },
    dropPos?: { x: number; y: number },
  ) => {
    if (!onChange || readOnly) return;
    const prevCustom = workflowNodes?.canvasLayout?.customNodes || [];
    const baseKey = nodeData.key || `custom_${nodeData.nodeType}_${Date.now()}`;
    const alreadyExists = prevCustom.find((c) => c.key === baseKey);
    if (alreadyExists) {
      setActiveConfigNodeKey(alreadyExists.key);
      return;
    }
    const newCustomNode: CanvasCustomUserNode = {
      ...nodeData,
      key: baseKey,
    };
    const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
    if (dropPos) {
      nextPositions[baseKey] = {
        x: Math.max(20, Math.round(dropPos.x - 31)),
        y: Math.max(20, Math.round(dropPos.y - 31)),
      };
    }
    const prevConfigs = workflowNodes?.canvasLayout?.nodeConfigs || {};
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        customNodes: [...prevCustom, newCustomNode],
        positions: nextPositions,
        nodeConfigs: {
          ...prevConfigs,
          [baseKey]: {
            ...(prevConfigs[baseKey] || {}),
            ...(newCustomNode.targetUrl ? { targetUrl: newCustomNode.targetUrl } : {}),
            ...(newCustomNode.scriptEngine ? { scriptEngine: newCustomNode.scriptEngine } : {}),
            ...(newCustomNode.scriptCode ? { scriptCode: newCustomNode.scriptCode } : {}),
            ...(newCustomNode.nodeType === 'skill' && newCustomNode.content
              ? { skillContent: newCustomNode.content }
              : {}),
            ...(newCustomNode.nodeType === 'rule' && newCustomNode.content
              ? { ruleText: newCustomNode.content }
              : {}),
            ...(newCustomNode.nodeType === 'subagent' && newCustomNode.content
              ? { prompt: newCustomNode.content }
              : {}),
          },
        },
      },
    });
    setActiveConfigNodeKey(baseKey);
  };

  // Crear un nodo propio desde el formulario "+ Crear Mi Propio Nodo", guardarlo en la librería local del usuario y añadirlo al lienzo
  const handleCreateAndSaveCustomNode = () => {
    if (!onChange || readOnly) return;
    const cleanTitle = newCustomNodeForm.title.trim();
    if (!cleanTitle) return;

    const defaultSubtitles: Record<CanvasCustomUserNode['nodeType'], string> = {
      skill: 'Skill Procedural',
      subagent: 'Sub-Agente IA',
      rule: 'Regla Obligatoria',
      web_scraper: 'Script Antigravity',
      web_search: 'Búsqueda en Vivo',
    };
    const createdNode: CanvasCustomUserNode = {
      key: `user_${newCustomNodeForm.nodeType}_${Date.now()}`,
      nodeType: newCustomNodeForm.nodeType,
      title: cleanTitle,
      subtitle: newCustomNodeForm.subtitle.trim() || defaultSubtitles[newCustomNodeForm.nodeType],
      content: newCustomNodeForm.content.trim() || `Ejecutar ${cleanTitle} dentro del flujo.`,
      ...(newCustomNodeForm.targetUrl.trim()
        ? { targetUrl: newCustomNodeForm.targetUrl.trim() }
        : {}),
      ...(newCustomNodeForm.nodeType === 'web_scraper'
        ? {
            scriptEngine: newCustomNodeForm.scriptEngine,
            scriptCode:
              newCustomNodeForm.scriptCode.trim() ||
              `# Script Web Scraping en Google Antigravity (${newCustomNodeForm.scriptEngine})\n# Extraer contenido estructurado y tablas de: ${newCustomNodeForm.targetUrl.trim() || 'https://...'}`,
          }
        : {}),
    };

    const nextLibrary = [createdNode, ...savedUserLibraryNodes];
    setSavedUserLibraryNodes(nextLibrary);
    try {
      localStorage.setItem('wappy_custom_workflow_nodes_v1', JSON.stringify(nextLibrary));
    } catch (_) {}

    handleAddCustomNodeToCanvas(createdNode);
    setNewCustomNodeForm({
      nodeType: newCustomNodeForm.nodeType,
      title: '',
      subtitle: '',
      content: '',
      targetUrl: '',
      scriptEngine: 'python_bs4',
      scriptCode: '',
    });
    setShowCustomNodeBuilder(false);
  };

  const handleRemoveCustomNode = (key: string) => {
    if (!onChange || readOnly) return;
    const nextCustom = (workflowNodes?.canvasLayout?.customNodes || []).filter((c) => c.key !== key);
    const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
      (ed) => ed.from !== key && ed.to !== key,
    );
    if (activeConfigNodeKey === key) setActiveConfigNodeKey(null);
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        customNodes: nextCustom,
        edges: nextEdges,
      },
    });
  };

  // Agregar un Nodo Lógico (Loop, Merge, Aprobación Humana)
  const handleAddLogicNode = (logicType: 'loop' | 'merge' | 'human_approval') => {
    if (!onChange || readOnly) return;
    const prevLogic = workflowNodes?.canvasLayout?.logicNodes || [];
    const newKey = `logic_${logicType}_${Date.now()}`;
    const meta =
      logicType === 'loop'
        ? { title: 'Iterar (Loop)', subtitle: 'Por cada Registro' }
        : logicType === 'merge'
          ? { title: 'Unir Ramas', subtitle: 'Combinar Flujos' }
          : { title: 'Aprobación', subtitle: 'Visto Bueno Humano' };
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        logicNodes: [...prevLogic, { key: newKey, logicType, ...meta }],
      },
    });
    setActiveConfigNodeKey(newKey);
  };

  const handleRemoveLogicNode = (key: string) => {
    if (!onChange || readOnly) return;
    const nextLogic = (workflowNodes?.canvasLayout?.logicNodes || []).filter((ln) => ln.key !== key);
    const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
      (ed) => ed.from !== key && ed.to !== key,
    );
    if (activeConfigNodeKey === key) setActiveConfigNodeKey(null);
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        logicNodes: nextLogic,
        edges: nextEdges,
      },
    });
  };

  // Agregar un Agente IA adicional (ej. Segunda IA Revisora / Auditora en el mismo flujo con su propio Segundo Prompt)
  const handleAddExtraAgent = () => {
    if (!onChange || readOnly) return;
    const prevExtra = workflowNodes?.canvasLayout?.extraAgents || [];
    const newKey = `agent_extra_${Date.now()}`;
    const defaultAgent = availableAgentsWithTenshiAvatar[1] || availableAgentsWithTenshiAvatar[0];
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: [
          ...prevExtra,
          {
            key: newKey,
            agentId: defaultAgent?.id || 'tenshi_avatar_orchestrator',
            agentName: defaultAgent?.name || 'IA Revisora / Auditora SST',
            aiEngine: 'wappy',
            aiModel: 'gemini-3.6-flash',
            prompt: '',
          },
        ],
      },
    });
    setActiveConfigNodeKey(newKey);
  };

  // Actualizar o quitar un Agente IA adicional
  const handleUpdateExtraAgent = (key: string, newAgentId: string) => {
    if (!onChange || readOnly) return;
    const found = availableAgentsWithTenshiAvatar.find((a) => a.id === newAgentId);
    const nextExtra = (workflowNodes?.canvasLayout?.extraAgents || []).map((ea) =>
      ea.key === key
        ? { ...ea, agentId: newAgentId, agentName: found?.name || ea.agentName }
        : ea,
    );
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: nextExtra,
      },
    });
  };

  const handleRemoveExtraAgent = (key: string) => {
    if (!onChange || readOnly) return;
    const nextExtra = (workflowNodes?.canvasLayout?.extraAgents || []).filter((ea) => ea.key !== key);
    const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
      (ed) => ed.from !== key && ed.to !== key,
    );
    if (activeConfigNodeKey === key) setActiveConfigNodeKey(null);
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: nextExtra,
        edges: nextEdges,
      },
    });
  };

  // Actualizar posición de un nodo al arrastrarlo
  const updateNodePosition = useCallback(
    (nodeKey: string, x: number, y: number) => {
      if (!onChange || readOnly) return;
      const nextPositions: Record<string, CanvasNodePosition> = {
        ...(workflowNodes?.canvasLayout?.positions || {}),
        [nodeKey]: { x: Math.max(12, Math.round(x)), y: Math.max(12, Math.round(y)) },
      };
      onChange({
        ...workflowNodes,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
    },
    [onChange, readOnly, workflowNodes],
  );

  // Actualizar posiciones de múltiples nodos a la vez (mover una parte seleccionada o todo el flujo)
  const updateMultipleNodePositions = useCallback(
    (updates: Record<string, CanvasNodePosition>) => {
      if (!onChange || readOnly) return;
      const nextPositions: Record<string, CanvasNodePosition> = {
        ...(workflowNodes?.canvasLayout?.positions || {}),
        ...updates,
      };
      onChange({
        ...workflowNodes,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
    },
    [onChange, readOnly, workflowNodes],
  );

  // Seleccionar todo el flujo (o deseleccionar si ya están todos marcados)
  const handleSelectAllNodes = () => {
    const allKeys = visualNodes.map((n) => n.key);
    if (selectedNodeKeys.length === allKeys.length && allKeys.length > 0) {
      setSelectedNodeKeys([]);
    } else {
      setSelectedNodeKeys(allKeys);
    }
  };

  // Cargar automáticamente el Historial de Informes en vivo (/api/sgsst/diagnostico/report-history) cuando se selecciona un nodo de Aplicativo SST
  useEffect(() => {
    setFieldSearchQuery('');
    if (!activeConfigNodeKey || readOnly) {
      setNodeReportHistory({
        loading: false,
        conversations: [],
        previewConvId: null,
        previewTitle: null,
        previewText: null,
        previewLoading: false,
      });
      return;
    }

    const activeNode = visualNodes.find((n) => n.key === activeConfigNodeKey);
    if (!activeNode) return;

    const meta = getNodeModuleMetadata(activeNode.nodeId, activeNode.shape);
    if (!meta.reportTags || meta.reportTags.length === 0) {
      setNodeReportHistory({
        loading: false,
        conversations: [],
        previewConvId: null,
        previewTitle: null,
        previewText: null,
        previewLoading: false,
      });
      return;
    }

    let cancelled = false;
    setNodeReportHistory((prev) => ({
      ...prev,
      loading: true,
      previewConvId: null,
      previewTitle: null,
      previewText: null,
    }));

    const queryString = meta.reportTags.map((t) => `tags=${encodeURIComponent(t)}`).join('&');
    axios
      .get(`/api/sgsst/diagnostico/report-history?${queryString}`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data?.conversations) ? res.data.conversations : [];
        setNodeReportHistory((prev) => ({
          ...prev,
          loading: false,
          conversations: list,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setNodeReportHistory((prev) => ({
          ...prev,
          loading: false,
          conversations: [],
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [activeConfigNodeKey, readOnly, visualNodes]);

  // Seleccionar un nodo en el inspector inferior y desplazar suavemente al panel de configuración
  const openNodeConfigInspector = useCallback((targetKey: string) => {
    setActiveConfigNodeKey(targetKey);
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('wappy-node-config-inspector');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 60);
    }
  }, []);

  // Cargar automáticamente el Inspector de Datos y Resultados Reales en Vivo (/api/sgsst/automatizaciones/node-live-inspector)
  useEffect(() => {
    setLiveRecordSearch('');
    setNdvSelectedUpstreamKey('auto');
    setNdvInputSearch('');
    setNdvOutputSearch('');
    if (!activeConfigNodeKey || readOnly) {
      setNodeLiveInspectorData({
        loading: false,
        supported: false,
        nodeId: null,
        companyName: '',
        sourceCollection: '',
        totalRecords: 0,
        criticalCount: 0,
        kpis: [],
        records: [],
      });
      return;
    }

    const activeNode = visualNodes.find((n) => n.key === activeConfigNodeKey);
    if (!activeNode) return;

    const rawId = (activeNode.nodeId || '').trim();
    const cleanId = rawId.replace(
      /^(trigger_|extractor_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_|custom_)/,
      '',
    );

    const isPureLogicNode =
      activeNode.key === 'if_router' ||
      activeNode.shape === 'if' ||
      activeNode.shape === 'logic' ||
      rawId === 'if_node_router' ||
      rawId.startsWith('logic_');

    // Todos los nodos de los 8 Equipos (Disparadores, Extractores, Motores IA, las 4 Memorias,
    // las 25 Herramientas del Agente, los 50 Aplicativos de los 8 Hitos, las 11 Salidas de Bitácora
    // y los nodos de Skills/Sub-Agentes/Reglas/Scraping) son inspeccionables en vivo,
    // excepto únicamente los nodos lógicos puros (if_router, logic_*).
    const isLiveInspectable = Boolean(rawId) && !isPureLogicNode;

    if (!isLiveInspectable) {
      setNodeLiveInspectorData({
        loading: false,
        supported: false,
        nodeId: cleanId,
        companyName: '',
        sourceCollection: '',
        totalRecords: 0,
        criticalCount: 0,
        kpis: [],
        records: [],
      });
    } else {
      setNodeLiveInspectorData((prev) => ({
        ...prev,
        loading: true,
        supported: true,
        nodeId: cleanId,
      }));
    }

    let cancelled = false;
    const token =
      (typeof window !== 'undefined' && (window as any).platformUserToken) ||
      localStorage.getItem('token') ||
      '';

    if (isLiveInspectable) {
      const inspectQueryNodeId =
        activeNode.shape === 'custom_node'
          ? rawId.startsWith('custom_')
            ? rawId.replace(/^custom_/, '')
            : activeNode.customNodeType || rawId
          : rawId;

      axios
        .get(
          `/api/sgsst/automatizaciones/node-live-inspector?nodeId=${encodeURIComponent(inspectQueryNodeId)}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
        )
        .then((res) => {
          if (cancelled) return;
          const data = res.data || {};
          const recordsList = Array.isArray(data.records) ? data.records : [];
          const kpisList = Array.isArray(data.kpis) ? data.kpis : [];
          const computedCrit =
            typeof data.criticalCount === 'number'
              ? data.criticalCount
              : recordsList.filter((r: any) => Boolean(r?.isCritical)).length;
          const totalRec =
            typeof data.totalRecords === 'number' ? data.totalRecords : recordsList.length;
          setNodeLiveInspectorData({
            loading: false,
            supported: true,
            nodeId: cleanId,
            companyName: data.companyName || 'Empresa Activa',
            sourceCollection: data.sourceCollection || '',
            totalRecords: totalRec,
            criticalCount: computedCrit,
            kpis: kpisList,
            records: recordsList,
          });
          setUpstreamLiveRecordsCache((prev) => ({
            ...prev,
            [activeNode.key]: {
              loading: false,
              nodeId: cleanId,
              companyName: data.companyName || 'Empresa Activa',
              sourceCollection: data.sourceCollection || '',
              totalRecords: totalRec,
              records: recordsList,
            },
          }));
        })
        .catch(() => {
          if (cancelled) return;
          setNodeLiveInspectorData({
            loading: false,
            supported: true,
            nodeId: cleanId,
            companyName: 'Empresa Activa',
            sourceCollection: '',
            totalRecords: 0,
            criticalCount: 0,
            kpis: [],
            records: [],
          });
        });
    }

    // Pre-cargar datos en vivo de los nodos anteriores (Upstream) para nutrir la columna izquierda `📥 INPUT` estilo n8n
    const activePlanIdx = connectedExecutionPlan.findIndex((p) => p.nodeKey === activeNode.key);
    const upstreamKeys = new Set<string>();
    wires.forEach((w) => {
      if (!w.isSub && w.targetKey === activeNode.key) upstreamKeys.add(w.sourceKey);
      if (w.isSub && w.sourceKey === activeNode.key) upstreamKeys.add(w.targetKey);
      if (w.isSub && w.targetKey === activeNode.key) {
        upstreamKeys.add(w.sourceKey);
        wires.forEach((mw) => {
          if (!mw.isSub && mw.targetKey === w.sourceKey) {
            upstreamKeys.add(mw.sourceKey);
          }
        });
      }
    });
    if (activePlanIdx > 0) {
      connectedExecutionPlan.slice(0, activePlanIdx).forEach((st) => upstreamKeys.add(st.nodeKey));
    }
    if (activeNode.shape !== 'trigger') {
      visualNodes
        .filter((vn) => vn.shape === 'square_extractor')
        .forEach((extNode) => upstreamKeys.add(extNode.key));
    }
    upstreamKeys.forEach((uKey) => {
      const uNode = visualNodes.find((n) => n.key === uKey);
      if (!uNode || uNode.shape === 'trigger' || uNode.shape === 'if' || uNode.shape === 'logic') {
        return;
      }
      const uRawId = (uNode.nodeId || '').trim();
      if (!uRawId) return;
      const uInspectId =
        uNode.shape === 'custom_node'
          ? uRawId.startsWith('custom_')
            ? uRawId.replace(/^custom_/, '')
            : uNode.customNodeType || uRawId
          : uRawId;
      axios
        .get(
          `/api/sgsst/automatizaciones/node-live-inspector?nodeId=${encodeURIComponent(uInspectId)}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
        )
        .then((res) => {
          if (cancelled) return;
          const d = res.data || {};
          const recs = Array.isArray(d.records) ? d.records : [];
          setUpstreamLiveRecordsCache((prev) => ({
            ...prev,
            [uNode.key]: {
              loading: false,
              nodeId: uInspectId,
              companyName: d.companyName || 'Empresa Activa',
              sourceCollection: d.sourceCollection || '',
              totalRecords: typeof d.totalRecords === 'number' ? d.totalRecords : recs.length,
              records: recs,
            },
          }));
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [activeConfigNodeKey, readOnly, visualNodes, connectedExecutionPlan, wires]);

  // Extrae los pares { field, value } reales de un registro de MongoDB para la Vista Previa Quirúrgica en Vivo
  const resolveRecordSurgicalPreview = useCallback(
    (
      rec: {
        id: string;
        label: string;
        sublabel?: string;
        badge?: string;
        fields?: Record<string, any>;
        values?: Record<string, any>;
        data?: Record<string, any>;
        [key: string]: any;
      },
      chosenFields: string[],
    ): Array<{ field: string; value: string }> => {
      const bag: Record<string, any> = {
        ...(rec.data && typeof rec.data === 'object' ? rec.data : {}),
        ...(rec.values && typeof rec.values === 'object' ? rec.values : {}),
        ...(rec.fields && typeof rec.fields === 'object' ? rec.fields : {}),
      };
      // Si el registro tiene propiedades planas adicionales, incorporarlas sin pisar bag
      Object.entries(rec || {}).forEach(([k, v]) => {
        if (
          !['id', '_id', 'label', 'sublabel', 'badge', 'isCritical', 'fields', 'values', 'data'].includes(
            k,
          ) &&
          bag[k] === undefined &&
          v !== undefined &&
          v !== null &&
          typeof v !== 'object'
        ) {
          bag[k] = v;
        }
      });

      const normalizeStr = (s: string) =>
        String(s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');

      const bagEntries = Object.entries(bag);
      if (bagEntries.length === 0) return [];

      if (!Array.isArray(chosenFields) || chosenFields.length === 0) {
        return bagEntries
          .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
          .slice(0, 4)
          .map(([k, v]) => ({
            field: k,
            value: Array.isArray(v) ? v.join(', ') : String(v),
          }));
      }

      const result: Array<{ field: string; value: string }> = [];
      chosenFields.forEach((targetField) => {
        // 1. Coincidencia exacta
        if (bag[targetField] !== undefined && bag[targetField] !== null && String(bag[targetField]).trim() !== '') {
          result.push({
            field: targetField,
            value: Array.isArray(bag[targetField]) ? bag[targetField].join(', ') : String(bag[targetField]),
          });
          return;
        }
        // 2. Coincidencia normalizada o por palabras clave
        const normTarget = normalizeStr(targetField);
        const targetTokens = String(targetField || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length >= 3 && !['del', 'las', 'los', 'por', 'con', 'para', 'una'].includes(t));

        const matched = bagEntries.find(([k]) => {
          const normKey = normalizeStr(k);
          if (!normKey) return false;
          if (normKey === normTarget || normKey.includes(normTarget) || normTarget.includes(normKey)) {
            return true;
          }
          return targetTokens.some((tok) => normKey.includes(tok));
        });

        if (matched && matched[1] !== undefined && matched[1] !== null && String(matched[1]).trim() !== '') {
          result.push({
            field: targetField,
            value: Array.isArray(matched[1]) ? matched[1].join(', ') : String(matched[1]),
          });
        }
      });

      return result;
    },
    [],
  );

  // Previsualizar el contenido de un informe guardado directamente desde la configuración del nodo
  const handlePreviewNodeReport = async (convId: string, title: string) => {
    if (nodeReportHistory.previewConvId === convId) {
      setNodeReportHistory((prev) => ({
        ...prev,
        previewConvId: null,
        previewTitle: null,
        previewText: null,
      }));
      return;
    }
    setNodeReportHistory((prev) => ({
      ...prev,
      previewConvId: convId,
      previewTitle: title,
      previewText: null,
      previewLoading: true,
    }));
    try {
      const res = await axios.get(`/api/messages/${encodeURIComponent(convId)}`);
      const msgs = Array.isArray(res.data) ? res.data : res.data?.messages || [];
      const assistantMsg =
        [...msgs].reverse().find((m: any) => !m.isCreatedByUser && (m.text || m.content)) ||
        msgs[msgs.length - 1];
      let rawText = assistantMsg?.text || '';
      if (!rawText && Array.isArray(assistantMsg?.content)) {
        rawText = assistantMsg.content.map((p: any) => p?.text || '').join('\n');
      }
      const cleanText = String(rawText || 'Informe sin texto visible.')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      setNodeReportHistory((prev) => ({
        ...prev,
        previewLoading: false,
        previewText: cleanText.slice(0, 900) + (cleanText.length > 900 ? '…' : ''),
      }));
    } catch (_) {
      setNodeReportHistory((prev) => ({
        ...prev,
        previewLoading: false,
        previewText: 'No se pudo cargar la vista previa de este informe.',
      }));
    }
  };

  // Iniciar arrastre en el fondo del lienzo: Manita (desplazar vista) o Recuadro de Selección (Seleccionar Parte)
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-canvas-toolbar="true"]')) return;

    if (!readOnly && (canvasTool === 'select' || e.shiftKey)) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pointerX = (e.clientX - rect.left) / zoom;
      const pointerY = (e.clientY - rect.top) / zoom;
      setMarqueeBox({ startX: pointerX, startY: pointerY, currX: pointerX, currY: pointerY });
      if (!e.shiftKey) {
        setSelectedNodeKeys([]);
      }
      return;
    }

    if (scrollContainerRef.current) {
      setIsPanning(true);
      setPanStart({
        clientX: e.clientX,
        clientY: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      });
    }
  };

  // Iniciar arrastre de un nodo (individual o de todo el grupo seleccionado) y registrar posición para detectar clic de edición
  const handleNodePointerDown = (e: React.PointerEvent, node: VisualNodeInstance) => {
    if (readOnly) return;
    e.stopPropagation();
    pointerDownClientRef.current = { x: e.clientX, y: e.clientY };

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / zoom;
    const pointerY = (e.clientY - rect.top) / zoom;

    if (e.shiftKey) {
      setSelectedNodeKeys((prev) =>
        prev.includes(node.key) ? prev.filter((k) => k !== node.key) : [...prev, node.key],
      );
      return;
    }

    if (selectedNodeKeys.includes(node.key) && selectedNodeKeys.length > 1) {
      const initialPositions: Record<string, CanvasNodePosition> = {};
      visualNodes.forEach((vn) => {
        if (selectedNodeKeys.includes(vn.key)) {
          initialPositions[vn.key] = { x: vn.x, y: vn.y };
        }
      });
      setGroupDragStart({ pointerX, pointerY, initialPositions });
      return;
    }

    setDraggingNodeKey(node.key);
    setDragOffset({ dx: pointerX - node.x, dy: pointerY - node.y });
  };

  // Iniciar trazado de cable desde un puerto (● o ◆)
  const handlePortPointerDown = (
    e: React.PointerEvent,
    sourceKey: string,
    portType: 'main_out' | 'diamond_model' | 'diamond_memory' | 'diamond_tool' | 'if_true' | 'if_false',
    startX: number,
    startY: number,
  ) => {
    if (readOnly) return;
    e.stopPropagation();
    setWiringFrom({
      sourceKey,
      portType,
      startX,
      startY,
      currX: startX,
      currY: startY,
    });
  };

  // Estado de Pantalla Completa y Papelera de Reciclaje para arrastrar nodos no deseados
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState<boolean>(false);
  const [isOverTrash, setIsOverTrash] = useState<boolean>(false);
  const trashDropZoneRef = useRef<HTMLDivElement | null>(null);

  // Eliminar uno o varios nodos del área de trabajo (al arrastrarlos a la Papelera 🗑️, pulsar Suprimir o hacer clic en Eliminar)
  const handleDeleteNodesByKeys = useCallback(
    (keysToDelete: string[]) => {
      if (!onChange || readOnly || !Array.isArray(keysToDelete) || keysToDelete.length === 0) {
        return;
      }
      // Filtrar agent_root y sub_model para no borrar el núcleo del agente principal por accidente
      const removableKeys = keysToDelete.filter(
        (k) => k && k !== 'agent_root' && k !== 'sub_model',
      );
      if (removableKeys.length === 0) return;

      const keySet = new Set(removableKeys);
      let nextTriggers = [...activeTriggers];
      let nextExtractors = [...activeExtractors];
      let nextMemories = [...activeMemories];
      let nextInputs = [...(workflowNodes.inputs || [])];
      let nextHitos = [...(workflowNodes.hitos || [])];
      let nextOutputs = Array.isArray(workflowNodes.outputs)
        ? [...workflowNodes.outputs]
        : ['email_report'];
      let nextIncludeIf = includeIfNode;
      let nextLogic = [...(workflowNodes?.canvasLayout?.logicNodes || [])];
      let nextExtraAgents = [...(workflowNodes?.canvasLayout?.extraAgents || [])];
      let nextCustomNodes = [...(workflowNodes?.canvasLayout?.customNodes || [])];
      const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
      const nextNodeConfigs = { ...(workflowNodes?.canvasLayout?.nodeConfigs || {}) };

      visualNodes.forEach((vn) => {
        if (!keySet.has(vn.key)) return;
        delete nextPositions[vn.key];
        delete nextNodeConfigs[vn.key];

        if (vn.shape === 'trigger') {
          if (nextTriggers.length > 1) {
            nextTriggers = nextTriggers.filter((id) => id !== vn.nodeId);
          }
        } else if (vn.shape === 'square_extractor') {
          nextExtractors = nextExtractors.filter((id) => id !== vn.nodeId);
        } else if (vn.shape === 'circle_memory') {
          nextMemories = nextMemories.filter((id) => id !== vn.nodeId);
        } else if (vn.shape === 'circle_tool') {
          nextInputs = nextInputs.filter((id) => id !== vn.nodeId);
        } else if (vn.shape === 'square_hito') {
          nextHitos = nextHitos.filter((id) => id !== vn.nodeId);
        } else if (vn.shape === 'square_output') {
          nextOutputs = nextOutputs.filter((id) => id !== vn.nodeId);
        } else if (vn.shape === 'if' || vn.key === 'if_router') {
          nextIncludeIf = false;
        } else if (vn.shape === 'logic') {
          nextLogic = nextLogic.filter((ln) => ln.key !== vn.key);
        } else if (vn.shape === 'agent' && vn.key.startsWith('agent_extra_')) {
          nextExtraAgents = nextExtraAgents.filter((ea) => ea.key !== vn.key);
        } else if (vn.shape === 'custom_node') {
          nextCustomNodes = nextCustomNodes.filter((cn) => cn.key !== vn.key);
        }
      });

      const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
        (ed) => !keySet.has(ed.from) && !keySet.has(ed.to),
      );

      setSelectedNodeKeys((prev) => prev.filter((k) => !keySet.has(k)));
      if (activeConfigNodeKey && keySet.has(activeConfigNodeKey)) {
        setActiveConfigNodeKey(null);
      }

      onChange({
        ...workflowNodes,
        trigger: nextTriggers[0] || 'schedule_cron',
        triggers: nextTriggers,
        extractors: nextExtractors,
        memoryNode: nextMemories[0] || '',
        memories: nextMemories,
        inputs: nextInputs,
        hitos: nextHitos,
        outputs: nextOutputs,
        includeIfNode: nextIncludeIf,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
          nodeConfigs: nextNodeConfigs,
          edges: nextEdges,
          logicNodes: nextLogic,
          extraAgents: nextExtraAgents,
          customNodes: nextCustomNodes,
        },
      });
    },
    [
      onChange,
      readOnly,
      activeTriggers,
      activeExtractors,
      activeMemories,
      workflowNodes,
      includeIfNode,
      visualNodes,
      activeConfigNodeKey,
    ],
  );

  // Atajos de teclado: Esc para salir de Pantalla Completa, y Delete/Backspace para eliminar nodos seleccionados en la Papelera
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        Boolean((ev.target as HTMLElement)?.isContentEditable);

      if (ev.key === 'Escape' && previewEvidence) {
        setPreviewEvidence(null);
        return;
      }
      if (ev.key === 'Escape' && activeConfigNodeKey) {
        setActiveConfigNodeKey(null);
        return;
      }
      if (ev.key === 'Escape' && isCanvasFullscreen) {
        setIsCanvasFullscreen(false);
        return;
      }
      if (!isTyping && !readOnly && (ev.key === 'Delete' || ev.key === 'Backspace')) {
        if (selectedNodeKeys.length > 0) {
          ev.preventDefault();
          handleDeleteNodesByKeys(selectedNodeKeys);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    previewEvidence,
    activeConfigNodeKey,
    isCanvasFullscreen,
    readOnly,
    selectedNodeKeys,
    handleDeleteNodesByKeys,
  ]);

  // Movimiento del puntero sobre el lienzo
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning && panStart && scrollContainerRef.current) {
      const dx = e.clientX - panStart.clientX;
      const dy = e.clientY - panStart.clientY;
      scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
      return;
    }

    if (readOnly) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / zoom;
    const pointerY = (e.clientY - rect.top) / zoom;

    if (groupDragStart || draggingNodeKey) {
      const trashRect = trashDropZoneRef.current?.getBoundingClientRect();
      if (trashRect) {
        const insideTrash =
          e.clientX >= trashRect.left - 14 &&
          e.clientX <= trashRect.right + 14 &&
          e.clientY >= trashRect.top - 14 &&
          e.clientY <= trashRect.bottom + 14;
        setIsOverTrash(insideTrash);
      } else {
        setIsOverTrash(false);
      }
    }

    if (groupDragStart) {
      const dx = pointerX - groupDragStart.pointerX;
      const dy = pointerY - groupDragStart.pointerY;
      const batchUpdates: Record<string, CanvasNodePosition> = {};
      Object.entries(groupDragStart.initialPositions).forEach(([key, initPos]) => {
        batchUpdates[key] = {
          x: Math.max(12, Math.round(initPos.x + dx)),
          y: Math.max(12, Math.round(initPos.y + dy)),
        };
      });
      updateMultipleNodePositions(batchUpdates);
    } else if (draggingNodeKey) {
      updateNodePosition(draggingNodeKey, pointerX - dragOffset.dx, pointerY - dragOffset.dy);
    } else if (marqueeBox) {
      const nextBox = { ...marqueeBox, currX: pointerX, currY: pointerY };
      setMarqueeBox(nextBox);
      const minX = Math.min(nextBox.startX, nextBox.currX);
      const maxX = Math.max(nextBox.startX, nextBox.currX);
      const minY = Math.min(nextBox.startY, nextBox.currY);
      const maxY = Math.max(nextBox.startY, nextBox.currY);
      const hits = visualNodes
        .filter((vn) => vn.x + vn.width >= minX && vn.x <= maxX && vn.y + vn.height >= minY && vn.y <= maxY)
        .map((vn) => vn.key);
      setSelectedNodeKeys(hits);
    } else if (wiringFrom) {
      setWiringFrom((prev) => (prev ? { ...prev, currX: pointerX, currY: pointerY } : null));
    }
  };

  // Soltar manita, selección, grupo, nodo (o soltar en la Papelera 🗑️ para eliminarlo) o finalizar conexión de cable
  const handleCanvasPointerUp = (targetNodeKey?: string, e?: React.PointerEvent) => {
    // Verificar si se soltó el nodo o grupo de nodos sobre la Papelera 🗑️
    if (groupDragStart || draggingNodeKey) {
      let droppedInTrash = isOverTrash;
      if (!droppedInTrash && e && trashDropZoneRef.current) {
        const trashRect = trashDropZoneRef.current.getBoundingClientRect();
        droppedInTrash =
          e.clientX >= trashRect.left - 14 &&
          e.clientX <= trashRect.right + 14 &&
          e.clientY >= trashRect.top - 14 &&
          e.clientY <= trashRect.bottom + 14;
      }
      if (droppedInTrash) {
        const keysToTrash = groupDragStart
          ? Object.keys(groupDragStart.initialPositions)
          : draggingNodeKey
            ? [draggingNodeKey]
            : [];
        setIsOverTrash(false);
        setGroupDragStart(null);
        setDraggingNodeKey(null);
        pointerDownClientRef.current = null;
        handleDeleteNodesByKeys(keysToTrash);
        return;
      }
    }
    setIsOverTrash(false);

    if (
      targetNodeKey &&
      !wiringFrom &&
      pointerDownClientRef.current &&
      e &&
      Math.hypot(e.clientX - pointerDownClientRef.current.x, e.clientY - pointerDownClientRef.current.y) < 6
    ) {
      setActiveConfigNodeKey(targetNodeKey);
    }
    pointerDownClientRef.current = null;

    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }
    if (groupDragStart) {
      setGroupDragStart(null);
    }
    if (marqueeBox) {
      setMarqueeBox(null);
    }
    if (draggingNodeKey) {
      setDraggingNodeKey(null);
    }
    if (wiringFrom) {
      if (targetNodeKey && targetNodeKey !== wiringFrom.sourceKey && onChange) {
        const sourceNode = visualNodes.find((n) => n.key === wiringFrom.sourceKey);
        const targetNode = visualNodes.find((n) => n.key === targetNodeKey);
        const isDiamondWire = wiringFrom.portType.startsWith('diamond');
        const isTargetSubCircle = Boolean(
          targetNode?.shape.startsWith('circle_') || targetNode?.shape === 'custom_node',
        );
        const isSourceSubCircle = Boolean(sourceNode?.shape.startsWith('circle_'));

        const isValidConnection = isDiamondWire
          ? isTargetSubCircle
          : !isSourceSubCircle && !isTargetSubCircle;

        if (isValidConnection) {
          const existingEdges = workflowNodes?.canvasLayout?.edges || [];
          const edgeId = `custom_${wiringFrom.sourceKey}_${targetNodeKey}`;
          if (!existingEdges.some((ed) => ed.id === edgeId)) {
            onChange({
              ...workflowNodes,
              canvasLayout: {
                ...(workflowNodes?.canvasLayout || {}),
                edges: [
                  ...existingEdges,
                  {
                    id: edgeId,
                    from: wiringFrom.sourceKey,
                    to: targetNodeKey,
                    kind: isDiamondWire ? 'sub' : 'main',
                  },
                ],
              },
            });
          }
        }
      }
      setWiringFrom(null);
    }
  };

  // Agregar o quitar un disparador/extractor/memoria/herramienta/hito/salida o cambiar motor IA
  const toggleOrAddCatalogNode = (
    group: 'trigger' | 'extractors' | 'memories' | 'inputs' | 'hitos' | 'outputs',
    nodeId: string,
    dropPos?: { x: number; y: number },
  ) => {
    if (!onChange || readOnly) return;

    const candidateNode = getNodeDefById(nodeId);
    if (isWorkflowNodeUnderConstruction(candidateNode, disabledSgsstApps)) {
      setConstructionNotice(
        `🚧 «${candidateNode?.label || nodeId}» se encuentra en modo Construcción en Somos SST: el nodo aparece en su Hito pero aún no se puede seleccionar.`,
      );
      return;
    }
    setConstructionNotice(null);

    if (group === 'trigger') {
      const exists = activeTriggers.includes(nodeId);
      let nextTriggers: string[];
      if (exists) {
        nextTriggers =
          activeTriggers.length > 1
            ? activeTriggers.filter((id) => id !== nodeId)
            : activeTriggers;
      } else {
        nextTriggers = [...activeTriggers, nodeId];
      }
      const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
      const targetTriggerKey =
        nextTriggers.indexOf(nodeId) === 0 ? 'trigger_root' : `trigger_${nodeId}`;
      if (!exists && dropPos) {
        nextPositions[targetTriggerKey] = {
          x: Math.max(20, Math.round(dropPos.x - 36)),
          y: Math.max(16, Math.round(dropPos.y - 36)),
        };
      }
      onChange({
        ...workflowNodes,
        trigger: nextTriggers[0] || 'schedule_cron',
        triggers: nextTriggers,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
      if (!exists) {
        setActiveConfigNodeKey(targetTriggerKey);
      }
      return;
    }

    if (group === 'memories') {
      const exists = activeMemories.includes(nodeId);
      const nextMemories = exists
        ? activeMemories.filter((id) => id !== nodeId)
        : [...activeMemories, nodeId];
      const targetMemKey =
        nextMemories.indexOf(nodeId) === 0 ? 'sub_memory' : `sub_memory_${nodeId}`;
      const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
      if (!exists && dropPos) {
        nextPositions[targetMemKey] = {
          x: Math.max(20, Math.round(dropPos.x - 31)),
          y: Math.max(20, Math.round(dropPos.y - 31)),
        };
      }
      onChange({
        ...workflowNodes,
        memoryNode: nextMemories[0] || '',
        memories: nextMemories,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
      if (!exists) {
        setActiveConfigNodeKey(targetMemKey);
      }
      return;
    }

    const currentList =
      group === 'extractors'
        ? activeExtractors
        : group === 'outputs'
          ? Array.isArray(workflowNodes.outputs)
            ? workflowNodes.outputs
            : ['email_report']
          : workflowNodes[group] || [];
    const exists = currentList.includes(nodeId);
    const nextList = exists
      ? currentList.filter((id) => id !== nodeId)
      : [...currentList, nodeId];

    const key =
      group === 'extractors'
        ? `extractor_${nodeId}`
        : group === 'hitos'
          ? `tool_hitos_${nodeId}`
          : group === 'outputs'
            ? `out_${nodeId}`
            : `tool_${group}_${nodeId}`;
    const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
    if (!exists && dropPos) {
      nextPositions[key] = {
        x: Math.max(20, Math.round(dropPos.x - 32)),
        y: Math.max(20, Math.round(dropPos.y - 32)),
      };
    }

    onChange({
      ...workflowNodes,
      [group]: nextList,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        positions: nextPositions,
      },
    });
    if (!exists) {
      setActiveConfigNodeKey(key);
    }
  };

  // Cambiar Motor IA (WAPPY Rotación de Claves vs Antigravity Local vs Antigravity Cloud 24/7) y Modelo
  const handleSelectAiEngineModel = (
    engine: 'wappy' | 'antigravity' | 'antigravity_cloud',
    model: string,
  ) => {
    if (!onChange || readOnly) return;
    const nextInputs = [...(workflowNodes.inputs || [])];
    if (engine === 'antigravity' && !nextInputs.includes('google_antigravity')) {
      nextInputs.push('google_antigravity');
    } else if (engine === 'antigravity_cloud' && !nextInputs.includes('google_antigravity_cloud')) {
      nextInputs.push('google_antigravity_cloud');
    }
    onChange({
      ...workflowNodes,
      aiEngine: engine,
      aiModel: model,
      inputs: nextInputs,
    });
    setActiveConfigNodeKey('sub_model');
  };

  // Soltar un cuadrito arrastrado desde la paleta sobre el lienzo de flujo
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !onChange) return;
    const raw = e.dataTransfer.getData('application/wappy-flow-node');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const rect = canvasRef.current?.getBoundingClientRect();
      const dropPos = rect
        ? {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom,
          }
        : undefined;

      if (parsed.kind === 'ai_engine') {
        handleSelectAiEngineModel(parsed.engine, parsed.model);
      } else if (parsed.kind === 'custom_node' && parsed.customNode) {
        handleAddCustomNodeToCanvas(parsed.customNode, dropPos);
      } else if (parsed.group && parsed.nodeId) {
        if (parsed.group === 'trigger') {
          if (!activeTriggers.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode('trigger', parsed.nodeId, dropPos);
          } else if (dropPos) {
            const idx = activeTriggers.indexOf(parsed.nodeId);
            const key = idx === 0 ? 'trigger_root' : `trigger_${parsed.nodeId}`;
            updateNodePosition(key, dropPos.x - 36, dropPos.y - 36);
          }
        } else if (parsed.group === 'memories') {
          if (!activeMemories.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode('memories', parsed.nodeId, dropPos);
          } else if (dropPos) {
            updateNodePosition(`sub_memory_${parsed.nodeId}`, dropPos.x - 31, dropPos.y - 31);
          }
        } else {
          const arr =
            parsed.group === 'extractors'
              ? activeExtractors
              : workflowNodes[parsed.group as 'inputs' | 'hitos' | 'outputs'] || [];
          if (!arr.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode(parsed.group, parsed.nodeId, dropPos);
          } else if (dropPos) {
            const key =
              parsed.group === 'extractors'
                ? `extractor_${parsed.nodeId}`
                : parsed.group === 'hitos'
                  ? `tool_hitos_${parsed.nodeId}`
                  : parsed.group === 'outputs'
                    ? `out_${parsed.nodeId}`
                    : `tool_${parsed.group}_${parsed.nodeId}`;
            updateNodePosition(key, dropPos.x - 32, dropPos.y - 32);
          }
        }
      }
    } catch (_) {}
  };

  // Restablecer posiciones automáticas limpias en el lienzo
  const handleResetLayout = () => {
    if (!onChange || readOnly) return;
    setSelectedNodeKeys([]);
    onChange({
      ...workflowNodes,
      canvasLayout: null,
    });
  };

  // ─── ESTADO DEL ESCENARIO DE DESARROLLO (SANDBOX DRY-RUN SIN ENVIAR SALIDAS) ───
  const [sandboxOpen, setSandboxOpen] = useState<boolean>(false);
  const [sandboxRunning, setSandboxRunning] = useState<boolean>(false);
  const [sandboxActiveStepNodeId, setSandboxActiveStepNodeId] = useState<string | null>(null);
  const [sandboxCompletedNodeKeys, setSandboxCompletedNodeKeys] = useState<string[]>([]);
  const [sandboxBlockedNodeKeys, setSandboxBlockedNodeKeys] = useState<string[]>([]);
  const [sandboxLiveSteps, setSandboxLiveSteps] = useState<SandboxNodeTraceStep[]>([]);
  const [sandboxResult, setSandboxResult] = useState<SandboxSimulationResponse | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [mockTriggerInput, setMockTriggerInput] = useState<string>('');

  // Ejecutar simulación en Modo Desarrollo UNO A UNO en tiempo real (POST /api/sgsst/automatizaciones/test-sandbox?stream=1)
  const handleRunSandboxSimulation = useCallback(async () => {
    if (sandboxRunning) return;
    setSandboxOpen(true);
    setSandboxRunning(true);
    setSandboxError(null);
    setSandboxResult(null);
    setSandboxCompletedNodeKeys([]);
    setSandboxBlockedNodeKeys([]);
    setSandboxLiveSteps([]);
    setSandboxActiveStepNodeId(connectedExecutionPlan[0]?.nodeKey || null);

    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const panelEl = document.getElementById('wappy-workflow-sandbox-panel');
        if (panelEl) {
          panelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 90);
    }

    try {
      const response = await fetch('/api/sgsst/automatizaciones/test-sandbox?stream=1', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream: true,
          name: 'Simulación en Escenario de Desarrollo',
          agentId,
          agentName,
          prompt,
          scheduleType,
          scheduleConfig: {
            hour,
            minute,
            dayOfWeek: daysOfWeek,
            dayOfMonth,
            intervalHours,
          },
          emails: emailsStr
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
          workflowNodes,
          mockTriggerInput,
          executionPlan: connectedExecutionPlan,
        }),
      });

      if (!response.ok) {
        let errMsg = `Error ${response.status} al ejecutar la simulación en el Escenario de Desarrollo.`;
        try {
          const errJson = await response.json();
          errMsg = errJson?.error || errJson?.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.type === 'step_start' && evt.nodeKey) {
                setSandboxActiveStepNodeId(evt.nodeKey);
              } else if (evt.type === 'step_done' && evt.nodeKey) {
                const canonicalKey =
                  evt.nodeKey === 'if_condition' ? 'if_router' : String(evt.nodeKey);
                if (evt.step?.status === 'simulated_blocked') {
                  setSandboxBlockedNodeKeys((prev) =>
                    prev.includes(canonicalKey) ? prev : [...prev, canonicalKey],
                  );
                } else {
                  setSandboxCompletedNodeKeys((prev) =>
                    prev.includes(canonicalKey) ? prev : [...prev, canonicalKey],
                  );
                }
                if (evt.step) {
                  setSandboxLiveSteps((prev) => [...prev, evt.step]);
                }
              } else if (evt.type === 'complete' && evt.result) {
                setSandboxResult(evt.result);
                setSandboxActiveStepNodeId(null);
              } else if (evt.type === 'error') {
                throw new Error(evt.error || 'Error en la simulación del flujo.');
              }
            } catch (parseErr: any) {
              if (parseErr?.message && !parseErr.message.includes('JSON')) {
                throw parseErr;
              }
            }
          }
        }
      } else {
        const data = await response.json();
        setSandboxResult(data || null);
        setSandboxActiveStepNodeId(null);
      }
    } catch (err: any) {
      const msg =
        err?.message || 'No se pudo completar la simulación en el Escenario de Desarrollo.';
      setSandboxError(String(msg));
      setSandboxActiveStepNodeId(null);
    } finally {
      setSandboxRunning(false);
    }
  }, [
    sandboxRunning,
    connectedExecutionPlan,
    agentId,
    agentName,
    prompt,
    scheduleType,
    hour,
    minute,
    daysOfWeek,
    dayOfMonth,
    intervalHours,
    emailsStr,
    workflowNodes,
    mockTriggerInput,
  ]);

  // Verificar si un nodo del lienzo corresponde al paso activo o seleccionado en el Escenario de Desarrollo
  const isNodeSandboxHighlighted = useCallback(
    (node: VisualNodeInstance): boolean => {
      if (!sandboxActiveStepNodeId) return false;
      if (sandboxActiveStepNodeId === node.key || sandboxActiveStepNodeId === node.nodeId) {
        return true;
      }
      if (
        node.key === 'agent_root' &&
        (sandboxActiveStepNodeId === 'ai_agent_root' || sandboxActiveStepNodeId === 'agent_primary')
      ) {
        return true;
      }
      if (
        node.key === 'if_router' &&
        (sandboxActiveStepNodeId === 'if_condition' || sandboxActiveStepNodeId === 'if_node_router')
      ) {
        return true;
      }
      return false;
    },
    [sandboxActiveStepNodeId],
  );

  // Renderizar insignia de Orden Consecutivo (`Paso #1`, `Paso #2`... o `⚪ Sin conectar`) y Estado en Vivo UNO A UNO sobre cada nodo
  const renderSandboxNodeOverlay = useCallback(
    (node: VisualNodeInstance): React.ReactNode => {
      const stepNum = stepNumberByNodeKey.get(node.key);
      const isConnected = stepNum !== undefined;
      const isHighlighted = isNodeSandboxHighlighted(node);

      // 1. Si el nodo NO tiene cables conectados al flujo, mostrar insignia clara de desconectado (jamás se ejecuta)
      if (!isConnected) {
        return (
          <span
            title="Nodo desconectado del flujo — No se ejecutará al dar Play. Conéctalo con un cable o arrástralo a la Papelera 🗑️ para eliminarlo."
            className="pointer-events-none absolute -top-3 -left-2 px-1.5 py-0.2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-dashed border-slate-400 dark:border-slate-600 text-[7.5px] font-extrabold shadow-2xs z-30 whitespace-nowrap"
          >
            ⚪ Sin conectar
          </span>
        );
      }

      // 2. Si este paso exacto se está ejecutando ahora mismo en Dar Play
      if (sandboxRunning && isHighlighted) {
        return (
          <>
            <span className="pointer-events-none absolute -top-3 -left-2 px-1.5 py-0.2 rounded-lg bg-emerald-600 text-white border border-white dark:border-slate-900 text-[8px] font-black shadow-md z-30 whitespace-nowrap">
              Paso #{stepNum}
            </span>
            <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider shadow-md z-30 whitespace-nowrap flex items-center gap-1 animate-bounce">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Ejecutando Paso #{stepNum}...
            </span>
          </>
        );
      }

      // 3. Si este paso YA terminó durante la corrida actual o en el resultado final (SOLO para nodos que realmente corrieron)
      const isStepDoneLive = sandboxCompletedNodeKeys.includes(node.key);
      const isStepBlockedLive = sandboxBlockedNodeKeys.includes(node.key);
      const traceList = Array.isArray(sandboxResult?.nodeTrace) ? sandboxResult!.nodeTrace : [];
      const matchedStep = traceList.find(
        (st) =>
          st.nodeKey === node.key ||
          (node.key === 'if_router' && st.nodeKey === 'if_condition'),
      );

      if (isStepBlockedLive || (!sandboxRunning && matchedStep?.status === 'simulated_blocked')) {
        return (
          <span
            title={`Paso #${stepNum}: Salida interceptada en Modo Desarrollo — Cero envíos externos`}
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-lg bg-amber-500 text-white border border-white dark:border-slate-900 text-[7.5px] font-black uppercase tracking-tight shadow-sm z-30 whitespace-nowrap"
          >
            🛡️ Paso #{stepNum} · Simulado
          </span>
        );
      }

      if (isStepDoneLive || (!sandboxRunning && matchedStep)) {
        const durationLabel = matchedStep?.durationMs ? ` (${matchedStep.durationMs} ms)` : '';
        return (
          <span
            title={`Paso #${stepNum} completado en orden consecutivo${durationLabel}`}
            className="pointer-events-none absolute -top-3 -left-2 px-1.5 py-0.2 rounded-lg bg-emerald-600 text-white border border-white dark:border-slate-900 text-[7.5px] font-black shadow-sm z-30 whitespace-nowrap"
          >
            ✓ Paso #{stepNum} · Listo
          </span>
        );
      }

      // 4. En reposo (o esperando su turno durante Dar Play), mostrar siempre el número de paso consecutivo del flujo
      return (
        <span
          title={`Orden consecutivo en el flujo: Paso #${stepNum}`}
          className="pointer-events-none absolute -top-3 -left-2 px-1.5 py-0.2 rounded-lg bg-slate-900 dark:bg-[#C7F303] text-[#C7F303] dark:text-[#0E1300] border border-white/40 dark:border-slate-900 text-[7.5px] font-black shadow-xs z-30 whitespace-nowrap"
        >
          Paso #{stepNum}
        </span>
      );
    },
    [
      stepNumberByNodeKey,
      isNodeSandboxHighlighted,
      sandboxRunning,
      sandboxCompletedNodeKeys,
      sandboxBlockedNodeKeys,
      sandboxResult,
    ],
  );

  // Calcular ancho y alto dinámicos del área de trabajo con margen amplio para desplazarse y mover el flujo a un lado
  const canvasMinWidth = useMemo(() => {
    const maxRight = visualNodes.reduce((acc, n) => Math.max(acc, n.x + n.width + 260), 1180);
    return Math.max(1180, maxRight);
  }, [visualNodes]);

  const canvasMinHeight = useMemo(() => {
    const maxBottom = visualNodes.reduce((acc, n) => Math.max(acc, n.y + n.height + 135), 470);
    return Math.max(470, maxBottom);
  }, [visualNodes]);

  const canvasContent = (
    <div
      className={
        isCanvasFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-[#F6F5EF] dark:bg-[#0C192E] p-4 sm:p-6 overflow-y-auto flex flex-col gap-3'
          : 'flex flex-col gap-3'
      }
    >
      {isCanvasFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-[#0C192E] text-white border border-teal-500/40 shadow-lg shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C7F303] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-[#C7F303]">
              LIENZO DE FLUJOS & NODOS WAPPY — MODO PANTALLA COMPLETA
            </span>
            <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">
              · Orden Consecutivo Activo ({connectedExecutionPlan.length} pasos conectados) · Arrastra nodos a la papelera para eliminarlos · Pulsa Esc para volver
            </span>
          </div>
          <ExpandableButton
            size="sm"
            variant="amber"
            icon={<Minimize2 className="w-3.5 h-3.5" />}
            label="Salir de Pantalla Completa (Esc)"
            title="Salir de Pantalla Completa (Esc)"
            onClick={() => setIsCanvasFullscreen(false)}
          />
        </div>
      )}

      {/* ─── BARRA DE PALETA DE CUADRITOS CON LOGOS SVG ORIGINALES (Solo en modo editor) ─── */}
      {!readOnly && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          {/* Pestañas de las 10 Etapas Consecutivas del Flujo (Estilo Oficial WAPPY ExpandableButton con Espacio Amplio) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5 py-1 px-1">
              {[
                {
                  id: 'triggers',
                  label: '1. Disparador',
                  badge: `1 · ${activeTriggers.length}`,
                  variant: 'amber' as const,
                  icon: <Zap className="w-3.5 h-3.5" />,
                },
                {
                  id: 'extractors',
                  label: '2. Extraer Datos',
                  badge: `2 · ${activeExtractors.length}`,
                  variant: 'blue' as const,
                  icon: <FileText className="w-3.5 h-3.5" />,
                },
                {
                  id: 'ai_engine',
                  label: '3. Motor IA',
                  badge: `3 · ${
                    aiEngine === 'antigravity_cloud'
                      ? 'AGY Cloud'
                      : aiEngine === 'antigravity'
                        ? 'AGY Local'
                        : aiModel.replace('gemini-', '')
                  }`,
                  variant: 'purple' as const,
                  icon: <Brain className="w-3.5 h-3.5" />,
                },
                {
                  id: 'memories',
                  label: '4. Memorias',
                  badge: `4 · ${activeMemories.length}`,
                  variant: 'fuchsia' as const,
                  icon: <HeartPulse className="w-3.5 h-3.5" />,
                },
                {
                  id: 'connectors',
                  label: '5. Herramientas (WAPPY · Google · APIs · MCP)',
                  badge: `5 · ${(workflowNodes.inputs || []).length}`,
                  variant: 'cyan' as const,
                  icon: <Sliders className="w-3.5 h-3.5" />,
                },
                {
                  id: 'skills_rules',
                  label: '6. Skills & Reglas',
                  badge: `6 · ${
                    (workflowNodes?.canvasLayout?.customNodes || []).filter(
                      (c) => c.nodeType === 'skill' || c.nodeType === 'rule',
                    ).length
                  }`,
                  variant: 'violet' as const,
                  icon: <Puzzle className="w-3.5 h-3.5" />,
                },
                {
                  id: 'subagents',
                  label: '7. Sub-Agentes (30)',
                  badge: `7 · ${
                    (workflowNodes?.canvasLayout?.customNodes || []).filter(
                      (c) => c.nodeType === 'subagent',
                    ).length
                  }`,
                  variant: 'indigo' as const,
                  icon: <Bot className="w-3.5 h-3.5" />,
                },
                {
                  id: 'scraping',
                  label: '8. Scraping & Web',
                  badge: `8 · ${
                    (workflowNodes?.canvasLayout?.customNodes || []).filter(
                      (c) => c.nodeType === 'web_scraper' || c.nodeType === 'web_search',
                    ).length
                  }`,
                  variant: 'amber' as const,
                  icon: <Terminal className="w-3.5 h-3.5" />,
                },
                {
                  id: 'hitos',
                  label: '9. Los 8 Hitos / 50 Apps SST',
                  badge: `9 · ${(workflowNodes.hitos || []).length}`,
                  variant: 'teal' as const,
                  icon: <ShieldCheck className="w-3.5 h-3.5" />,
                },
                {
                  id: 'outputs',
                  label: '10. Bitácora & Salida',
                  badge: `10 · ${(workflowNodes.outputs || []).length}`,
                  variant: 'emerald' as const,
                  icon: <Bell className="w-3.5 h-3.5" />,
                },
              ].map((tab) => (
                <ExpandableButton
                  key={tab.id}
                  type="button"
                  size="sm"
                  variant={tab.variant}
                  isActive={paletteTab === tab.id}
                  icon={tab.icon}
                  badge={tab.badge.split('·')[1]?.trim() || tab.badge}
                  label={tab.label}
                  title={`Etapa ${tab.label} (${tab.badge.split('·')[1]?.trim() || tab.badge})`}
                  onClick={() => {
                    setPaletteTab(tab.id as any);
                    setConstructionNotice(null);
                    if (tab.id === 'skills_rules') {
                      setSelectedSkillFilter('all');
                      setNewCustomNodeForm((prev) => ({ ...prev, nodeType: 'skill' }));
                    } else if (tab.id === 'subagents') {
                      setSelectedSkillFilter('subagent');
                      setNewCustomNodeForm((prev) => ({ ...prev, nodeType: 'subagent' }));
                    } else if (tab.id === 'scraping') {
                      setSelectedSkillFilter('web_scraper');
                      setNewCustomNodeForm((prev) => ({ ...prev, nodeType: 'web_scraper' }));
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Instrucción rápida de uso según la etapa activa */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2 px-1">
            {paletteTab === 'triggers' ? (
              <span>
                ⚡ <strong>Etapa 1 — Disparador:</strong> Elige quién o qué inicia la tarea (<strong>Cron Programado</strong>, <strong>Tenshi IA</strong>, <strong>Antigravity Local/Cloud</strong>, <strong>Correo Entrante</strong>, <strong>Agente IA</strong>, <strong>Reporte QR</strong>, <strong>Webhook API</strong> o <strong>WhatsApp Bot 🚧</strong>). Puedes activar varios a la vez.
              </span>
            ) : paletteTab === 'extractors' ? (
              <span>
                📥 <strong>Etapa 2 — Extracción / Lectura Previa:</strong> Antes de que el Agente IA piense, extrae información de <strong>Gmail</strong>, <strong>Google Drive</strong>, una <strong>Carpeta en tu Computador (vía Antigravity)</strong>, <strong>Web Scraping con Antigravity (Script)</strong>, <strong>Búsqueda en la Web</strong> o cualquier <strong>Aplicativo de Somos SST</strong> (OneDrive 🚧 En Construcción).
              </span>
            ) : paletteTab === 'memories' ? (
              <span>
                💾 <strong>Rombo Memory (◆) — Las 4 Memorias del Agente:</strong> Define qué recuerda el Agente antes de analizar los datos (datos de la <strong>Empresa Activa</strong>, <strong>Bitácora Anti-Duplicados</strong>, <strong>Cuadernos RAG NotebookLM</strong> o <strong>Reglas Normativas SST</strong>).
              </span>
            ) : paletteTab === 'connectors' ? (
              <span>
                🔧 <strong>Etapa 5 — Herramientas del Agente discriminadas por grupo:</strong> Filtra entre <strong>🟢 Herramientas WAPPY</strong>, <strong>🔵 Google Workspace</strong>, <strong>🟠 APIs Externas</strong> y <strong>🟣 Conectores MCP</strong> (OneDrive 🚧 En Construcción).
              </span>
            ) : paletteTab === 'skills_rules' ? (
              <span>
                🧩 <strong>Etapa 6 — Skills Procedurales (<code>SKILL.md</code>) y Reglas Obligatorias (<code>Rules</code>):</strong> Conecta protocolos paso a paso y guardrails normativos que el Agente jamás debe romper, o crea tu propia Skill/Regla.
              </span>
            ) : paletteTab === 'subagents' ? (
              <span>
                🤖 <strong>Etapa 7 — Sub-Agentes de Chat y Especialistas (30 disponibles + ✏️ Sub-Agente Editable):</strong> Delega pasos del flujo a cualquiera de los <strong>23 Agentes de Chat de WAPPY</strong>, a los <strong>6 Especialistas Técnicos</strong> o al <strong>✏️ Sub-Agente Editable</strong> (configura su nombre, avatar 3D, modelo y prompt).
              </span>
            ) : paletteTab === 'scraping' ? (
              <span>
                🕷️ <strong>Etapa 8 — Web Scraping con Google Antigravity y Búsqueda Web Viva:</strong> Ejecuta scripts reales de <strong>Python / Playwright / Chrome DevTools MCP</strong> en tu instancia de Antigravity (Alturas, ARL, Pensiones, ReTHUS, RUNT/SIMIT, Antecedentes) o consulta la web en vivo.
              </span>
            ) : paletteTab === 'hitos' ? (
              <span>
                🛡️ <strong>Etapa 9 — Todos los 50 Aplicativos de los 8 Hitos de Somos SST:</strong> Elige en qué aplicativo de los <strong>8 Hitos</strong> el Agente debe guardar o modificar registros. Los aplicativos en modo <strong>🚧 En Construcción</strong> aparecen visibles pero bloqueados hasta que se activen.
              </span>
            ) : paletteTab === 'outputs' ? (
              <span>
                📤 <strong>Etapa 10 — Bitácora Final y Notificación:</strong> Al terminar todo el flujo, envía el informe detallado de la bitácora a <strong>Gmail</strong>, como <strong>Notificación Directa en WAPPY + Tenshi</strong> o de regreso a <strong>Google Antigravity (PC o Cloud)</strong>.
              </span>
            ) : (
              <span>
                💡 <strong>Arrastra cualquier cuadrito al lienzo punteado</strong> (o haz clic sobre él) para conectarlo al flujo. Dentro del lienzo puedes mover los nodos y estirar los cables desde los puertos.
              </span>
            )}
          </div>

          {/* CUADRITOS ARRASTRABLES CON LOGOS SVG ORIGINALES */}
          {paletteTab === 'skills_rules' || paletteTab === 'subagents' || paletteTab === 'scraping' ? (
            <div className="flex flex-col gap-2.5">
              {/* Barra superior de sub-filtros según el grupo activo (Skills & Reglas vs Sub-Agentes vs Scraping & Web) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                  {(paletteTab === 'skills_rules'
                    ? [
                        {
                          id: 'all',
                          count:
                            SKILL_RULE_SUBAGENT_NODES.filter(
                              (n) => n.id.startsWith('skill_') || n.id.startsWith('rule_'),
                            ).length +
                            savedUserLibraryNodes.filter(
                              (n) => n.nodeType === 'skill' || n.nodeType === 'rule',
                            ).length,
                          label: 'Skills y Reglas (Todos)',
                          variant: 'violet' as const,
                          icon: <Puzzle className="w-3.5 h-3.5" />,
                        },
                        {
                          id: 'skill',
                          count:
                            SKILL_RULE_SUBAGENT_NODES.filter((n) => n.id.startsWith('skill_'))
                              .length +
                            savedUserLibraryNodes.filter((n) => n.nodeType === 'skill').length,
                          label: 'Skills Procedurales (SKILL.md)',
                          variant: 'purple' as const,
                          icon: <Puzzle className="w-3.5 h-3.5" />,
                        },
                        {
                          id: 'rule',
                          count:
                            SKILL_RULE_SUBAGENT_NODES.filter((n) => n.id.startsWith('rule_'))
                              .length +
                            savedUserLibraryNodes.filter((n) => n.nodeType === 'rule').length,
                          label: 'Reglas Obligatorias (Guardrails)',
                          variant: 'emerald' as const,
                          icon: <Scale className="w-3.5 h-3.5" />,
                        },
                        {
                          id: 'my_created',
                          count: savedUserLibraryNodes.filter(
                            (n) => n.nodeType === 'skill' || n.nodeType === 'rule',
                          ).length,
                          label: 'Mis Nodos Personalizados',
                          variant: 'teal' as const,
                          icon: <Sparkles className="w-3.5 h-3.5" />,
                        },
                      ]
                    : paletteTab === 'subagents'
                      ? [
                          {
                            id: 'subagent',
                            count: 30,
                            label: 'Todos los Sub-Agentes de Chat y Especialistas',
                            variant: 'indigo' as const,
                            icon: <Bot className="w-3.5 h-3.5" />,
                          },
                          {
                            id: 'my_created',
                            count: savedUserLibraryNodes.filter((n) => n.nodeType === 'subagent')
                              .length,
                            label: 'Mis Sub-Agentes Creados',
                            variant: 'teal' as const,
                            icon: <Sparkles className="w-3.5 h-3.5" />,
                          },
                        ]
                      : [
                          {
                            id: 'all',
                            count: 8,
                            label: 'Todos los Scrapers AGY y Búsqueda Web',
                            variant: 'amber' as const,
                            icon: <Terminal className="w-3.5 h-3.5" />,
                          },
                          {
                            id: 'web_scraper',
                            count: 7,
                            label: 'Web Scraping AGY con Script Real',
                            variant: 'orange' as const,
                            icon: <Terminal className="w-3.5 h-3.5" />,
                          },
                          {
                            id: 'web_search',
                            count: 1,
                            label: 'Búsqueda Web Oficial en Tiempo Real',
                            variant: 'cyan' as const,
                            icon: <Search className="w-3.5 h-3.5" />,
                          },
                        ]
                  ).map((fTab) => (
                    <ExpandableButton
                      key={fTab.id}
                      type="button"
                      size="sm"
                      variant={fTab.variant}
                      isActive={selectedSkillFilter === fTab.id}
                      icon={fTab.icon}
                      badge={fTab.count}
                      label={fTab.label}
                      onClick={() => setSelectedSkillFilter(fTab.id as any)}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 py-1 px-1">
                  {/* Indicador en vivo de si la instancia de Google Antigravity del usuario está configurada/conectada */}
                  {paletteTab === 'scraping' && (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 border ${
                        antigravityStatus.connected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      }`}
                      title="El nodo de Web Scraping con Script se ejecuta en tu instancia configurada de Google Antigravity (Local PC o Cloud 24/7)"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          antigravityStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      {antigravityStatus.connected
                        ? `Instancia Antigravity Activa (${antigravityStatus.localConnected ? 'Local PC' : 'Cloud 24/7'})`
                        : 'Web Scraping AGY: Requiere tu instancia Antigravity configurada'}
                    </span>
                  )}

                  <ExpandableButton
                    type="button"
                    size="sm"
                    variant="emerald"
                    isActive={showCustomNodeBuilder}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    label={
                      showCustomNodeBuilder
                        ? 'Cerrar Creador de Nodos'
                        : paletteTab === 'subagents'
                          ? '+ Crear Nuevo Sub-Agente Personalizado'
                          : paletteTab === 'scraping'
                            ? '+ Crear Nuevo Nodo de Web Scraping AGY'
                            : '+ Crear Nueva Skill o Regla Personalizada'
                    }
                    onClick={() => {
                      if (!showCustomNodeBuilder) {
                        setNewCustomNodeForm((prev) => ({
                          ...prev,
                          nodeType:
                            paletteTab === 'subagents'
                              ? 'subagent'
                              : paletteTab === 'scraping'
                                ? 'web_scraper'
                                : 'skill',
                        }));
                      }
                      setShowCustomNodeBuilder((v) => !v);
                    }}
                  />
                </div>
              </div>

              {/* Formulario desplegable para que el usuario cree su propio Nodo de Skill, Sub-Agente, Regla, Web Scraping con Script o Búsqueda Web */}
              {showCustomNodeBuilder && (
                <div className="p-3 rounded-2xl border-2 border-purple-400/80 dark:border-[#C7F303]/80 bg-purple-50/40 dark:bg-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-[#C7F303] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Crear Mi Propio Nodo Reutilizable para el Lienzo WAPPY
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Se guardará en tu catálogo «⭐ Mis Nodos» y se agregará al flujo actual
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        1. Tipo de Nodo a Crear
                      </label>
                      <select
                        value={newCustomNodeForm.nodeType}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({
                            ...prev,
                            nodeType: e.target.value as any,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                      >
                        <option value="skill">🧩 Skill (Habilidad / SKILL.md)</option>
                        <option value="subagent">🤖 Sub-Agente Especialista</option>
                        <option value="rule">📏 Regla Obligatoria (Rule / Guardrail)</option>
                        <option value="web_scraper">🕷️ Web Scraping con Antigravity (Script)</option>
                        <option value="web_search">🌐 Búsqueda en la Web (Web Search)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        2. Nombre del Nodo *
                      </label>
                      <input
                        type="text"
                        value={newCustomNodeForm.title}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder={
                          newCustomNodeForm.nodeType === 'web_scraper'
                            ? 'Ej: Scraper Circulares MinTrabajo'
                            : newCustomNodeForm.nodeType === 'skill'
                              ? 'Ej: Skill Acta COPASST Pro'
                              : newCustomNodeForm.nodeType === 'subagent'
                                ? 'Ej: Sub-Agente Médico Revisor'
                                : newCustomNodeForm.nodeType === 'rule'
                                  ? 'Ej: Regla Solo Mayores de 50 Años'
                                  : 'Ej: Buscar Jurisprudencia ARL'
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        3. Subtítulo / Etiqueta Corta
                      </label>
                      <input
                        type="text"
                        value={newCustomNodeForm.subtitle}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({ ...prev, subtitle: e.target.value }))
                        }
                        placeholder="Ej: Script Python / Regla SST / Sub-Agente"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Campos adicionales cuando el usuario crea un nodo de Web Scraping con Antigravity o Búsqueda Web */}
                  {(newCustomNodeForm.nodeType === 'web_scraper' ||
                    newCustomNodeForm.nodeType === 'web_search') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 mb-1">
                          🔗 URL(s) Objetivo o Dominios Web a Consultar / Scrapear
                        </label>
                        <input
                          type="text"
                          value={newCustomNodeForm.targetUrl}
                          onChange={(e) =>
                            setNewCustomNodeForm((prev) => ({ ...prev, targetUrl: e.target.value }))
                          }
                          placeholder="Ej: https://www.mintrabajo.gov.co/... o consulta de búsqueda..."
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      {newCustomNodeForm.nodeType === 'web_scraper' && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 mb-1">
                            🐍 Motor de Script en tu Instancia de Google Antigravity
                          </label>
                          <select
                            value={newCustomNodeForm.scriptEngine}
                            onChange={(e) =>
                              setNewCustomNodeForm((prev) => ({
                                ...prev,
                                scriptEngine: e.target.value as any,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                          >
                            <option value="python_bs4">
                              🐍 Python (BeautifulSoup4 + Playwright en Antigravity)
                            </option>
                            <option value="node_cheerio">
                              🟢 Node.js (Cheerio + Puppeteer en Antigravity)
                            </option>
                            <option value="chrome_mcp">
                              🌐 Chrome DevTools MCP (Navegador Real Conectado)
                            </option>
                            <option value="custom_script">
                              💻 Script / Comando Personalizado en Antigravity
                            </option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {newCustomNodeForm.nodeType === 'web_scraper' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
                          💻 Script de Web Scraping o Selectores CSS que ejecutará Antigravity
                        </label>
                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="purple"
                          icon={<Wand2 className="w-3.5 h-3.5" />}
                          label="⚡ Autogenerar Script Base de Scraping"
                          onClick={() => {
                            const urlSample =
                              newCustomNodeForm.targetUrl.trim() || 'https://ejemplo.gov.co';
                            const generated =
                              newCustomNodeForm.scriptEngine === 'python_bs4'
                                ? `import requests\nfrom bs4 import BeautifulSoup\n\nurl = "${urlSample}"\nresp = requests.get(url, timeout=20)\nsoup = BeautifulSoup(resp.text, "html.parser")\nfor row in soup.select("table tr, h1, h2, a[href$='.pdf']"):\n    print(row.get_text(strip=True))`
                                : newCustomNodeForm.scriptEngine === 'node_cheerio'
                                  ? `const axios = require('axios');\nconst cheerio = require('cheerio');\n(async () => {\n  const { data } = await axios.get('${urlSample}');\n  const $ = cheerio.load(data);\n  $('table tr, h1, h2').each((_, el) => console.log($(el).text().trim()));\n})();`
                                  : `Abrir ${urlSample} con Chrome DevTools MCP, extraer todas las tablas, titulares y enlaces PDF y devolverlos en Markdown limpio.`;
                            setNewCustomNodeForm((prev) => ({ ...prev, scriptCode: generated }));
                          }}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={newCustomNodeForm.scriptCode}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({ ...prev, scriptCode: e.target.value }))
                        }
                        placeholder="Escribe o autogenera el script Python / Node.js o los selectores CSS que tu instancia de Google Antigravity ejecutará..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      4. Contenido de la Skill (SKILL.md), Prompt del Sub-Agente, Regla o Instrucción de Extracción
                    </label>
                    <textarea
                      rows={2}
                      value={newCustomNodeForm.content}
                      onChange={(e) =>
                        setNewCustomNodeForm((prev) => ({ ...prev, content: e.target.value }))
                      }
                      placeholder="Describe qué hace este nodo cuando se conecta al flujo (ej. pasos de la Skill, rol del Sub-Agente, regla que jamás debe romperse o qué datos extraer del sitio web)..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 py-1 px-1">
                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="neutral"
                      icon={<X className="w-3.5 h-3.5" />}
                      label="Cancelar"
                      onClick={() => setShowCustomNodeBuilder(false)}
                    />
                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="purple"
                      disabled={!newCustomNodeForm.title.trim()}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      label="Crear Nodo y Agregar al Lienzo"
                      onClick={handleCreateAndSaveCustomNode}
                    />
                  </div>
                </div>
              )}

              {/* Catálogo horizontal de Nodos de Skills, Sub-Agentes, Reglas, Web Scraping AGY y Nodos creados por el usuario */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1">
                {[
                  ...savedUserLibraryNodes.map((uNode) => ({
                    id: uNode.key,
                    shortLabel: uNode.title,
                    label: uNode.title,
                    badge: uNode.subtitle,
                    toolHint: uNode.content,
                    promptHint: uNode.content,
                    customNodePayload: uNode,
                    isUserCreated: true,
                  })),
                  ...SKILL_RULE_SUBAGENT_NODES.map((catNode) => {
                    const inferredType: CanvasCustomUserNode['nodeType'] = catNode.id.startsWith('skill_')
                      ? 'skill'
                      : catNode.id.startsWith('subagent_')
                        ? 'subagent'
                        : catNode.id.startsWith('rule_')
                          ? 'rule'
                          : catNode.id.includes('scraper') || catNode.id.includes('scraping')
                            ? 'web_scraper'
                            : 'web_search';
                    const mappedEngine =
                      catNode.scriptEngine === 'chrome_devtools_mcp'
                        ? ('chrome_mcp' as const)
                        : catNode.scriptEngine === 'node_cheerio_puppeteer'
                          ? ('node_cheerio' as const)
                          : ('python_bs4' as const);
                    return {
                      ...catNode,
                      badge: catNode.subtitle || (catNode as any).badge || 'Nodo Especial',
                      promptHint: catNode.content || (catNode as any).promptHint || '',
                      customNodePayload: {
                        key: `custom_${catNode.id}`,
                        nodeType: inferredType,
                        title: catNode.shortLabel,
                        subtitle: catNode.subtitle || (catNode as any).badge || 'Nodo Especial',
                        content: catNode.content || (catNode as any).promptHint || '',
                        ...(catNode.targetUrl ? { targetUrl: catNode.targetUrl } : {}),
                        ...(catNode.scriptCode ? { scriptCode: catNode.scriptCode } : {}),
                        ...(inferredType === 'web_scraper'
                          ? { scriptEngine: mappedEngine }
                          : {}),
                      },
                      isUserCreated: false,
                    };
                  }),
                  // También incluir cualquier agente de chat dinámico adicional que no esté ya en el catálogo
                  ...(agents || [])
                    .filter((ag) => {
                      const norm = ag.name.trim().toLowerCase();
                      return !SKILL_RULE_SUBAGENT_NODES.some(
                        (cn) =>
                          cn.id.startsWith('subagent_') &&
                          (cn.shortLabel.toLowerCase().includes(norm) ||
                            cn.label.toLowerCase().includes(norm)),
                      );
                    })
                    .map((ag) => ({
                      id: `subagent_dyn_${ag.id}`,
                      shortLabel: ag.name,
                      label: `🤖 Sub-Agente Chat: ${ag.name}`,
                      badge: 'Agente Chat WAPPY',
                      toolHint: `wappy_consultar_agente_especialista (${ag.name})`,
                      promptHint: `Delega al Agente de Chat «${ag.name}» el análisis especializado de su área y consolida su dictamen en el flujo.`,
                      customNodePayload: {
                        key: `custom_subagent_dyn_${ag.id}`,
                        nodeType: 'subagent' as const,
                        title: ag.name,
                        subtitle: 'Agente Chat WAPPY',
                        content: `Delega al Agente de Chat «${ag.name}» el análisis especializado de su área y consolida su dictamen en el flujo.`,
                        agentId: ag.id,
                      },
                      isUserCreated: false,
                    })),
                ]
                  .filter((item) => {
                    const nType = item.customNodePayload.nodeType;
                    if (paletteTab === 'skills_rules') {
                      if (selectedSkillFilter === 'my_created') {
                        return item.isUserCreated && (nType === 'skill' || nType === 'rule');
                      }
                      if (selectedSkillFilter === 'all') {
                        return nType === 'skill' || nType === 'rule';
                      }
                      return nType === selectedSkillFilter;
                    }
                    if (paletteTab === 'subagents') {
                      if (selectedSkillFilter === 'my_created') {
                        return item.isUserCreated && nType === 'subagent';
                      }
                      return nType === 'subagent';
                    }
                    if (paletteTab === 'scraping') {
                      if (selectedSkillFilter === 'all') {
                        return nType === 'web_scraper' || nType === 'web_search';
                      }
                      return nType === selectedSkillFilter;
                    }
                    if (selectedSkillFilter === 'all') return true;
                    if (selectedSkillFilter === 'my_created') return item.isUserCreated;
                    return nType === selectedSkillFilter;
                  })
                  .map((item) => {
                    const isAlreadyOnCanvas = (workflowNodes?.canvasLayout?.customNodes || []).some(
                      (c) => c.key === item.customNodePayload.key,
                    );
                    const isInspectingThisCustom =
                      activeConfigNodeKey === item.customNodePayload.key;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'application/wappy-flow-node',
                            JSON.stringify({
                              kind: 'custom_node',
                              customNode: item.customNodePayload,
                            }),
                          );
                        }}
                        onClick={() => {
                          if (isAlreadyOnCanvas) {
                            handleRemoveCustomNode(item.customNodePayload.key);
                          } else {
                            handleAddCustomNodeToCanvas(item.customNodePayload);
                          }
                        }}
                        title={`${item.label} — Haz clic o arrastra al lienzo (${item.promptHint})`}
                        className="group/tile cursor-grab active:cursor-grabbing flex flex-col items-center w-[96px] shrink-0 select-none"
                      >
                        <div
                          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-150 shadow-sm ${
                            isAlreadyOnCanvas
                              ? 'bg-white dark:bg-slate-800 border-purple-600 dark:border-[#C7F303] ring-2 ring-purple-500/25 dark:ring-[#C7F303]/25'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400 group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md'
                          }`}
                        >
                          {renderOfficialNodeSvg(
                            item.id.includes('scraper_agy_')
                              ? item.id
                              : item.customNodePayload.nodeType === 'web_scraper'
                                ? 'web_scraper'
                                : item.customNodePayload.nodeType === 'skill'
                                  ? 'skill'
                                  : item.customNodePayload.nodeType === 'subagent'
                                    ? item.id
                                    : item.customNodePayload.nodeType === 'rule'
                                      ? 'rule'
                                      : 'web_search',
                            'w-7 h-7',
                          )}
                          {isAlreadyOnCanvas && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="mt-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-2">
                          {item.shortLabel}
                        </span>
                        <span className="mt-0.5 text-[8.5px] font-extrabold text-purple-600 dark:text-purple-400 truncate max-w-full">
                          {item.badge}
                        </span>
                        {isAlreadyOnCanvas && (
                          <div className="mt-1 py-0.5 px-1" onClick={(e) => e.stopPropagation()}>
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="purple"
                              isActive={isInspectingThisCustom}
                              icon={<Sliders className="w-3 h-3" />}
                              label="Configurar"
                              title="Configurar este nodo y ver su Estado en Vivo"
                              onClick={() => openNodeConfigInspector(item.customNodePayload.key)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : paletteTab === 'ai_engine' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {AI_ENGINE_MODELS.map((m) => {
                const isSelected =
                  (m.engine === 'antigravity_cloud' && aiEngine === 'antigravity_cloud') ||
                  (m.engine === 'antigravity' && aiEngine === 'antigravity') ||
                  (m.engine === 'wappy' && aiEngine === 'wappy' && aiModel === m.model);
                const isInspectingModel = isSelected && activeConfigNodeKey === 'sub_model';
                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/wappy-flow-node',
                        JSON.stringify({ kind: 'ai_engine', engine: m.engine, model: m.model }),
                      );
                    }}
                    onClick={() => handleSelectAiEngineModel(m.engine, m.model)}
                    className={`cursor-grab active:cursor-grabbing p-3 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {/* Cuadrito / Círculo con Logo Oficial */}
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 relative">
                      {renderOfficialNodeSvg(m.id, 'w-7 h-7')}
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {m.shortLabel}
                      </div>
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        {m.subtitle}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                        {m.description}
                      </p>
                      {isSelected && (
                        <div className="mt-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                          <ExpandableButton
                            type="button"
                            size="sm"
                            variant="purple"
                            isActive={isInspectingModel}
                            icon={<Sliders className="w-3 h-3" />}
                            label="Configurar"
                            title="Configurar Motor IA y ver su Estado en Vivo"
                            onClick={() => openNodeConfigInspector('sub_model')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : paletteTab === 'memories' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {MEMORY_NODES.map((mem) => {
                const isSelected = activeMemories.includes(mem.id);
                const memIdx = activeMemories.indexOf(mem.id);
                const memCanvasKey = memIdx === 0 ? 'sub_memory' : `sub_memory_${mem.id}`;
                const isInspectingMem = isSelected && activeConfigNodeKey === memCanvasKey;
                const isCompanyMem = mem.id === 'wappy_memory_company';
                const memDisplayLabel =
                  isCompanyMem && activeCompanyInfo?.companyName
                    ? `Memoria: ${activeCompanyInfo.companyName}${activeCompanyInfo.nit ? ` (NIT ${activeCompanyInfo.nit})` : ''}`
                    : mem.label;
                const memDisplaySubtitle =
                  isCompanyMem && activeCompanyInfo?.companyName
                    ? `ARL ${activeCompanyInfo.arl || 'N/A'} · Riesgo ${activeCompanyInfo.riskLevel || 'I'} · ${activeCompanyInfo.workerCount || 0} Trab. · ${activeCompanyInfo.city || 'Sede Principal'}`
                    : (mem as any).subtitle || mem.badge;
                return (
                  <div
                    key={mem.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/wappy-flow-node',
                        JSON.stringify({ kind: 'node', group: 'memories', nodeId: mem.id }),
                      );
                    }}
                    onClick={() => toggleOrAddCatalogNode('memories', mem.id)}
                    className={`cursor-grab active:cursor-grabbing p-3 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-pink-50/90 dark:bg-pink-950/30 border-pink-500 ring-2 ring-pink-500/30 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-pink-400'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-pink-300 dark:border-pink-700 shadow-sm flex items-center justify-center shrink-0 relative">
                      {renderOfficialNodeSvg(mem.id, 'w-7 h-7')}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {memDisplayLabel}
                      </div>
                      <div className="text-[10px] font-bold text-pink-600 dark:text-pink-400 mt-0.5">
                        {memDisplaySubtitle}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {(mem as any).promptHint || mem.toolHint}
                      </p>
                      {isSelected && (
                        <div className="mt-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                          <ExpandableButton
                            type="button"
                            size="sm"
                            variant="fuchsia"
                            isActive={isInspectingMem}
                            icon={<Sliders className="w-3 h-3" />}
                            label="Configurar"
                            title="Configurar esta Memoria y ver sus Registros Reales en Vivo"
                            onClick={() => openNodeConfigInspector(memCanvasKey)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Barra de sub-grupos discriminados para 5. Herramientas (WAPPY · Google · APIs · MCP) */}
              {paletteTab === 'connectors' && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2.5 py-1 px-1">
                    {TOOL_SUBGROUP_TABS.map((tTab) => {
                      const isActive = selectedToolSubgroup === tTab.id;
                      const toolsInSubgroup =
                        tTab.id === 'all_tools'
                          ? INPUT_CONNECTOR_NODES
                          : INPUT_CONNECTOR_NODES.filter((n) => n.category === tTab.id);
                      const activeInputs = workflowNodes.inputs || [];
                      const activeCountInSubgroup = toolsInSubgroup.filter(
                        (n) =>
                          !isWorkflowNodeUnderConstruction(n, disabledSgsstApps) &&
                          activeInputs.includes(n.id),
                      ).length;
                      const variantMap: Record<string, any> = {
                        all_tools: 'cyan',
                        wappy_tools: 'teal',
                        google_tools: 'blue',
                        api_tools: 'amber',
                        mcp_tools: 'purple',
                      };
                      const iconMap: Record<string, React.ReactNode> = {
                        all_tools: <Sparkles className="w-3.5 h-3.5" />,
                        wappy_tools: <ShieldCheck className="w-3.5 h-3.5" />,
                        google_tools: <Globe className="w-3.5 h-3.5" />,
                        api_tools: <CloudSun className="w-3.5 h-3.5" />,
                        mcp_tools: <Cpu className="w-3.5 h-3.5" />,
                      };
                      return (
                        <ExpandableButton
                          key={tTab.id}
                          type="button"
                          size="sm"
                          variant={variantMap[tTab.id] || 'cyan'}
                          isActive={isActive}
                          icon={iconMap[tTab.id]}
                          badge={
                            activeCountInSubgroup > 0
                              ? `${toolsInSubgroup.length} · ✓${activeCountInSubgroup}`
                              : toolsInSubgroup.length
                          }
                          label={tTab.label}
                          title={`${tTab.label} — ${toolsInSubgroup.length} herramientas disponibles · ${activeCountInSubgroup} conectada(s)`}
                          onClick={() => {
                            setSelectedToolSubgroup(tTab.id as any);
                            setConstructionNotice(null);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Barra de filtro por los 8 Hitos de Somos SST (para 2. Extraer Datos y 9. Los 8 Hitos / 50 Apps SST) */}
              {(paletteTab === 'hitos' || paletteTab === 'extractors') && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                    {paletteTab !== 'hitos' && (
                      <ExpandableButton
                        type="button"
                        size="sm"
                        variant="teal"
                        isActive={selectedHitoFilter === 'external'}
                        icon={<Globe className="w-3.5 h-3.5" />}
                        badge={EXTRACTOR_NODES.length}
                        label="Conectores / Fuentes"
                        onClick={() => {
                          setSelectedHitoFilter('external');
                          setConstructionNotice(null);
                        }}
                      />
                    )}
                    {HITOS_8_FILTER_TABS.map((hTab, hIdx) => {
                      const isActive =
                        selectedHitoFilter === hTab.id ||
                        (paletteTab === 'hitos' && selectedHitoFilter === 'external' && hTab.id === 'all');
                      const hitoNodesForTab =
                        hTab.id === 'all'
                          ? HITO_APP_NODES
                          : HITO_APP_NODES.filter((n) => n.hitoId === hTab.id);
                      const activeListForCurrentPalette =
                        paletteTab === 'extractors' ? activeExtractors : workflowNodes.hitos || [];
                      const activeInTabCount = hitoNodesForTab.filter(
                        (n) =>
                          !isWorkflowNodeUnderConstruction(n, disabledSgsstApps) &&
                          activeListForCurrentPalette.includes(n.id),
                      ).length;
                      const constructionInTabCount = hitoNodesForTab.filter((n) =>
                        isWorkflowNodeUnderConstruction(n, disabledSgsstApps),
                      ).length;
                      const hitoVariants = [
                        'purple',
                        'teal',
                        'cyan',
                        'amber',
                        'emerald',
                        'indigo',
                        'fuchsia',
                        'blue',
                        'orange',
                      ] as const;
                      return (
                        <ExpandableButton
                          key={hTab.id}
                          type="button"
                          size="sm"
                          variant={hitoVariants[hIdx % hitoVariants.length]}
                          isActive={isActive}
                          icon={<ShieldCheck className="w-3.5 h-3.5" />}
                          badge={
                            activeInTabCount > 0
                              ? `${hitoNodesForTab.length} · ✓${activeInTabCount}`
                              : hitoNodesForTab.length
                          }
                          label={hTab.label.replace(/\s*\(\d+\)\s*$/, '')}
                          title={`${hTab.label} — ${activeInTabCount} activo(s) en el flujo · ${constructionInTabCount} en Construcción`}
                          onClick={() => {
                            setSelectedHitoFilter(hTab.id);
                            setConstructionNotice(null);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aviso cuando el usuario hace clic sobre un aplicativo en modo Construcción */}
              {constructionNotice && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex items-center justify-between gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    {constructionNotice}
                  </span>
                  <ExpandableButton
                    type="button"
                    size="sm"
                    variant="amber"
                    icon={<X className="w-3 h-3" />}
                    label="Cerrar"
                    onClick={() => setConstructionNotice(null)}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1">
                {(paletteTab === 'extractors'
                  ? selectedHitoFilter === 'external'
                    ? EXTRACTOR_NODES
                    : selectedHitoFilter === 'all'
                      ? [...EXTRACTOR_NODES, ...HITO_APP_NODES]
                      : HITO_APP_NODES.filter((h) => h.hitoId === selectedHitoFilter)
                  : paletteTab === 'connectors'
                    ? selectedToolSubgroup === 'all_tools'
                      ? INPUT_CONNECTOR_NODES
                      : INPUT_CONNECTOR_NODES.filter((n) => n.category === selectedToolSubgroup)
                    : paletteTab === 'hitos'
                      ? selectedHitoFilter === 'all' || selectedHitoFilter === 'external'
                        ? HITO_APP_NODES
                        : HITO_APP_NODES.filter((h) => h.hitoId === selectedHitoFilter)
                      : paletteTab === 'triggers'
                        ? TRIGGER_NODES
                        : OUTPUT_ACTION_NODES
                ).map((node) => {
                  const groupKey =
                    paletteTab === 'extractors'
                      ? 'extractors'
                      : paletteTab === 'connectors'
                        ? 'inputs'
                        : paletteTab === 'hitos'
                          ? 'hitos'
                          : paletteTab === 'triggers'
                            ? 'trigger'
                            : 'outputs';
                  const isUnderConstruction = isWorkflowNodeUnderConstruction(node, disabledSgsstApps);
                  const isSelected =
                    !isUnderConstruction &&
                    (groupKey === 'trigger'
                      ? activeTriggers.includes(node.id)
                      : groupKey === 'extractors'
                        ? activeExtractors.includes(node.id)
                        : (workflowNodes[groupKey] || []).includes(node.id));
                  const canvasKeyForTile =
                    groupKey === 'trigger'
                      ? activeTriggers.indexOf(node.id) === 0
                        ? 'trigger_root'
                        : `trigger_${node.id}`
                      : groupKey === 'extractors'
                        ? `extractor_${node.id}`
                        : groupKey === 'hitos'
                          ? `tool_hitos_${node.id}`
                          : groupKey === 'outputs'
                            ? `out_${node.id}`
                            : `tool_inputs_${node.id}`;
                  const isInspectingTile = isSelected && activeConfigNodeKey === canvasKeyForTile;

                  return (
                    <div
                      key={`${groupKey}_${node.id}`}
                      draggable={!isUnderConstruction}
                      onDragStart={(e) => {
                        if (isUnderConstruction) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData(
                          'application/wappy-flow-node',
                          JSON.stringify({ kind: 'node', group: groupKey, nodeId: node.id }),
                        );
                      }}
                      onClick={() => toggleOrAddCatalogNode(groupKey, node.id)}
                      title={
                        isUnderConstruction
                          ? `🚧 ${node.label} — Aplicativo en Construcción en Somos SST (No seleccionable)`
                          : `${node.label} — Arrastra al lienzo o haz clic para ${isSelected ? 'quitar' : 'conectar'}`
                      }
                      className={`group/tile flex flex-col items-center w-[92px] shrink-0 select-none ${
                        isUnderConstruction
                          ? 'cursor-not-allowed opacity-65'
                          : 'cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      {/* Cuadrito con Logo SVG Original */}
                      <div
                        className={`relative w-14 h-14 flex items-center justify-center border-2 transition-all duration-150 shadow-sm ${
                          groupKey === 'trigger'
                            ? 'rounded-l-[22px] rounded-r-[10px]'
                            : 'rounded-2xl'
                        } ${
                          isUnderConstruction
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-dashed border-amber-400/90 dark:border-amber-600/80'
                            : isSelected
                              ? 'bg-white dark:bg-slate-800 border-purple-600 dark:border-[#C7F303] ring-2 ring-purple-500/25 dark:ring-[#C7F303]/25 group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400 group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md'
                        }`}
                      >
                        {renderOfficialNodeSvg(node.id, 'w-7 h-7')}

                        {/* Insignia de En Construcción (Candado) o de Conectado (Check) */}
                        {isUnderConstruction ? (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow"
                            title="Aplicativo en Construcción (No seleccionable)"
                          >
                            <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                          </span>
                        ) : (
                          isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )
                        )}
                      </div>
                      <span className="mt-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-2">
                        {node.id === 'somos_sst_empresa' && activeCompanyInfo?.companyName
                          ? activeCompanyInfo.companyName
                          : node.shortLabel}
                      </span>
                      {node.id === 'somos_sst_empresa' && activeCompanyInfo?.nit && !isUnderConstruction && (
                        <span className="mt-0.5 text-[8.5px] font-extrabold text-teal-600 dark:text-teal-400 truncate max-w-full">
                          NIT {activeCompanyInfo.nit}
                        </span>
                      )}
                      {isUnderConstruction ? (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[8px] font-extrabold uppercase tracking-tight">
                          🚧 En Constr.
                        </span>
                      ) : (
                        isSelected && (
                          <div className="mt-1 py-0.5 px-1" onClick={(e) => e.stopPropagation()}>
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="purple"
                              isActive={isInspectingTile}
                              icon={<Sliders className="w-3 h-3" />}
                              label="Configurar"
                              title={`Configurar «${node.shortLabel}» y ver su Estado en Vivo`}
                              onClick={() => openNodeConfigInspector(canvasKeyForTile)}
                            />
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── LIENZO VISUAL INTERACTIVO WAPPY (FONDO PUNTEADO + MANITA + SELECCIÓN + NODOS + CABLES SVG) ─── */}
      <div className="relative w-full">
        <div
          ref={scrollContainerRef}
          onPointerDown={handleBackgroundPointerDown}
          className={`relative w-full overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0b1120] shadow-inner select-none ${
            compact
              ? 'h-[265px]'
              : isCanvasFullscreen
                ? 'h-[62vh] min-h-[520px]'
                : 'h-[430px]'
          } ${
            isPanning
              ? 'cursor-grabbing'
              : canvasTool === 'select'
                ? 'cursor-crosshair'
                : 'cursor-grab'
          }`}
          style={{
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.42) 1.35px, transparent 1.35px)',
            backgroundSize: '18px 18px',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={() => handleCanvasPointerUp()}
        >
          {/* Barra superior limpia y unificada del Lienzo WAPPY (1 sola línea, estilo oficial ExpandableButton con Espacio Amplio) */}
          {!compact && (
            <div
              data-canvas-toolbar="true"
              onPointerDown={(e) => e.stopPropagation()}
              className="sticky left-3 top-3 z-30 inline-flex flex-wrap items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-md m-2.5 cursor-default"
            >
              <span className="text-[10.5px] font-black uppercase tracking-wider text-teal-700 dark:text-[#C7F303] mr-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Lienzo WAPPY
              </span>

              {/* ─── 1. NAVEGACIÓN Y ZOOM (ESTILO OFICIAL EXPANDABLEBUTTON) ─── */}
              <ExpandableButton
                type="button"
                size="sm"
                variant={canvasTool === 'pan' ? 'teal' : 'purple'}
                isActive={canvasTool === 'select'}
                icon={
                  canvasTool === 'pan' ? (
                    <Hand className="w-3.5 h-3.5" />
                  ) : (
                    <MousePointer2 className="w-3.5 h-3.5" />
                  )
                }
                label={canvasTool === 'pan' ? 'Manita (Mover Lienzo)' : 'Seleccionar Nodos'}
                title={
                  canvasTool === 'pan'
                    ? 'Modo Manita activo (clic para cambiar a Selección por recuadro)'
                    : 'Modo Selección activo (clic para volver a Manita)'
                }
                onClick={() => setCanvasTool(canvasTool === 'select' ? 'pan' : 'select')}
              />

              {!readOnly && onChange && (
                <ExpandableButton
                  type="button"
                  size="sm"
                  variant="indigo"
                  isActive={
                    selectedNodeKeys.length === visualNodes.length && visualNodes.length > 0
                  }
                  icon={<Move className="w-3.5 h-3.5" />}
                  badge={selectedNodeKeys.length > 0 ? selectedNodeKeys.length : visualNodes.length}
                  label="Seleccionar Todo el Flujo"
                  title="Seleccionar todo el flujo para moverlo junto"
                  onClick={handleSelectAllNodes}
                />
              )}

              <ExpandableButton
                type="button"
                size="sm"
                variant="neutral"
                icon={<ZoomOut className="w-3.5 h-3.5" />}
                label="Alejar (-)"
                title="Alejar vista del lienzo"
                onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
              />
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200 min-w-[34px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <ExpandableButton
                type="button"
                size="sm"
                variant="neutral"
                icon={<ZoomIn className="w-3.5 h-3.5" />}
                label="Acercar (+)"
                title="Acercar vista del lienzo"
                onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
              />

              {/* ─── 2. NODOS DE LÓGICA Y SUB-AGENTES (ESTILO OFICIAL WAPPY EXPANDABLEBUTTON) ─── */}
              {!readOnly && onChange && (
                <>
                  <ExpandableButton
                    size="sm"
                    variant="purple"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    label="+ Otra IA / Agente"
                    title="Agregar un Sub-Agente IA adicional (rota avatares Suri, Max, Paz, Capi)"
                    onClick={handleAddExtraAgent}
                  />
                  <ExpandableButton
                    size="sm"
                    variant="emerald"
                    isActive={includeIfNode}
                    icon={<GitFork className="w-3.5 h-3.5" />}
                    label="Condición Sí/No"
                    title="Activar o quitar nodo de Condición Sí/No"
                    onClick={() =>
                      onChange({
                        ...workflowNodes,
                        includeIfNode: !includeIfNode,
                      })
                    }
                  />
                  <ExpandableButton
                    size="sm"
                    variant="sky"
                    icon={<Repeat className="w-3.5 h-3.5" />}
                    label="Iterar (Loop)"
                    title="Agregar nodo Iterar (Loop) registro por registro"
                    onClick={() => handleAddLogicNode('loop')}
                  />
                  <ExpandableButton
                    size="sm"
                    variant="teal"
                    icon={<GitMerge className="w-3.5 h-3.5" />}
                    label="Unir Ramas"
                    title="Agregar nodo Unir Ramas (Merge)"
                    onClick={() => handleAddLogicNode('merge')}
                  />
                  <ExpandableButton
                    size="sm"
                    variant="rose"
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                    label="Aprobación"
                    title="Agregar nodo de Aprobación Humana"
                    onClick={() => handleAddLogicNode('human_approval')}
                  />
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    label="Auto-Organizar"
                    title="Alinear y organizar automáticamente el flujo en orden consecutivo"
                    onClick={handleResetLayout}
                  />
                </>
              )}

              <ExpandableButton
                size="sm"
                variant={isCanvasFullscreen ? 'amber' : 'indigo'}
                isActive={isCanvasFullscreen}
                icon={
                  isCanvasFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )
                }
                label={isCanvasFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                title={
                  isCanvasFullscreen
                    ? 'Salir de Pantalla Completa (Esc)'
                    : 'Expandir a Pantalla Completa real (100% navegador)'
                }
                onClick={() => setIsCanvasFullscreen((v) => !v)}
              />
            </div>
          )}

          {/* Contenedor escalable del lienzo */}
          <div
            ref={canvasRef}
            className="relative origin-top-left"
            style={{
              width: `${canvasMinWidth}px`,
              height: `${canvasMinHeight}px`,
              transform: `scale(${zoom})`,
            }}
          >
            {/* Recuadro visual de selección parcial (Seleccionar Parte) */}
            {marqueeBox && (
              <div
                style={{
                  left: Math.min(marqueeBox.startX, marqueeBox.currX),
                  top: Math.min(marqueeBox.startY, marqueeBox.currY),
                  width: Math.abs(marqueeBox.currX - marqueeBox.startX),
                  height: Math.abs(marqueeBox.currY - marqueeBox.startY),
                }}
                className="absolute z-40 rounded-xl border-2 border-dashed border-purple-500 bg-purple-500/10 pointer-events-none"
              />
            )}
            {/* ─── CAPA SVG DE CABLES CURVOS Y FLECHAS (CON BOTÓN × PARA CORTAR CUALQUIER CABLE) ─── */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="wappy-arrow"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
                </marker>
                <marker
                  id="wappy-arrow-true"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>
              </defs>

              {wires.map((w) => (
                <g key={w.id} className="group/wire">
                  <path
                    d={w.d}
                    fill="none"
                    stroke={w.color}
                    strokeWidth={w.dashed ? 2 : 2.2}
                    strokeDasharray={w.dashed ? '5 4' : undefined}
                    markerEnd={
                      w.dashed
                        ? undefined
                        : w.color === '#10b981'
                          ? 'url(#wappy-arrow-true)'
                          : 'url(#wappy-arrow)'
                    }
                  />
                  {!readOnly && (
                    <>
                      <path
                        d={w.d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="14"
                        className="pointer-events-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWire(w.id);
                        }}
                      >
                        <title>Haz clic para desconectar este cable y reconectar a tu gusto</title>
                      </path>
                      <g
                        transform={`translate(${w.midX}, ${w.midY})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWire(w.id);
                        }}
                        className="pointer-events-auto cursor-pointer opacity-0 group-hover/wire:opacity-100 transition-opacity"
                      >
                        <circle r="7.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                        <path
                          d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5"
                          stroke="#ffffff"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </g>
                    </>
                  )}
                  {w.label && w.labelX !== undefined && w.labelY !== undefined && (
                    <text
                      x={w.labelX}
                      y={w.labelY}
                      fill={w.label === 'sí' ? '#059669' : '#64748b'}
                      fontSize="10"
                      fontWeight="700"
                    >
                      {w.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Cable interactivo en vivo mientras el usuario arrastra desde un puerto */}
              {wiringFrom && (
                <path
                  d={`M ${wiringFrom.startX} ${wiringFrom.startY} C ${wiringFrom.startX + 45} ${wiringFrom.startY}, ${wiringFrom.currX - 45} ${wiringFrom.currY}, ${wiringFrom.currX} ${wiringFrom.currY}`}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              )}
            </svg>

            {/* ─── CAPA DE NODOS DE LAS 5 ETAPAS DEL FLUJO WAPPY ─── */}
            {visualNodes.map((node) => {
              const isNodeSelected =
                selectedNodeKeys.includes(node.key) || activeConfigNodeKey === node.key;
              const isSandboxHighlighted = isNodeSandboxHighlighted(node);
              const nodeCfg = workflowNodes?.canvasLayout?.nodeConfigs?.[node.key];
              const hasCustomConfig = Boolean(
                (nodeCfg?.fields && nodeCfg.fields.length > 0) ||
                  nodeCfg?.antigravityMode ||
                  nodeCfg?.inputContext?.trim() ||
                  nodeCfg?.outputContext?.trim() ||
                  nodeCfg?.customInstruction?.trim() ||
                  nodeCfg?.prompt?.trim(),
              );
              const nodeEffectiveAiEngine =
                nodeCfg?.aiEngine ||
                (node.key.startsWith('agent_extra_')
                  ? (workflowNodes?.canvasLayout?.extraAgents || []).find(
                      (ea) => ea.key === node.key,
                    )?.aiEngine
                  : aiEngine);
              const isNodeAntigravity = doesNodeRequireAntigravity(
                node.nodeId,
                node.key,
                node.customNodeType,
                nodeEffectiveAiEngine,
              );
              const showAntigravityBadge =
                node.key !== 'agent_root' &&
                node.key !== 'sub_model' &&
                !node.key.startsWith('agent_extra_')
                  ? isNodeAntigravity
                  : Boolean(
                      nodeCfg?.antigravityMode ||
                        nodeEffectiveAiEngine === 'antigravity' ||
                        nodeEffectiveAiEngine === 'antigravity_cloud',
                    );
              const resolvedAgyMode: 'auto' | 'local' | 'cloud' =
                nodeCfg?.antigravityMode ||
                (nodeEffectiveAiEngine === 'antigravity'
                  ? 'local'
                  : nodeEffectiveAiEngine === 'antigravity_cloud'
                    ? 'cloud'
                    : 'auto');
              const agyModeBadgeLabel =
                resolvedAgyMode === 'local'
                  ? 'AGY Local'
                  : resolvedAgyMode === 'cloud'
                    ? 'AGY Cloud'
                    : 'AGY Auto';
              const agyModePillClass =
                resolvedAgyMode === 'local'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : resolvedAgyMode === 'cloud'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300';

              const selectedRingClass = isSandboxHighlighted
                ? 'ring-4 ring-emerald-500 dark:ring-[#C7F303] ring-offset-2 dark:ring-offset-slate-900 shadow-lg shadow-emerald-500/25'
                : isNodeSelected
                  ? 'ring-3 ring-purple-500 dark:ring-[#C7F303] ring-offset-2 dark:ring-offset-slate-900'
                  : hasCustomConfig
                    ? 'ring-2 ring-teal-500/60'
                    : '';

              // 1. ETAPA 1: FIGURA TRIGGER NODE (Forma en "D" con rayo ⚡ a la izquierda y puerto circular derecho)
              if (node.shape === 'trigger') {
                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic sobre este nodo para editar su configuración"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    {/* Rayo naranja de Trigger a la izquierda */}
                    <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-orange-500 drop-shadow-sm">
                      <Zap className="w-4 h-4 fill-orange-500" />
                    </div>

                    {/* Caja en forma de D (redondeada a la izquierda, recta a la derecha) */}
                    <div className={`w-full h-full rounded-l-[28px] rounded-r-[12px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-orange-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                      {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                      {!readOnly && node.removable && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrAddCatalogNode('trigger', node.nodeId);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar disparador"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Puerto circular de salida derecho (●) */}
                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(
                          e,
                          node.key,
                          'main_out',
                          node.x + node.width,
                          node.y + node.height / 2,
                        )
                      }
                      title="Arrastra desde este puerto para conectar"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-400 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    />

                    {/* Etiqueta inferior */}
                    <div className="mt-1.5 w-[120px] -ml-[22px] text-center pointer-events-none">
                      <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                        {node.title}
                      </div>
                      <div className="text-[9.5px] font-medium text-slate-400">
                        {node.subtitle}
                      </div>
                      {showAntigravityBadge && (
                        <div className="mt-0.5 flex justify-center">
                          <span
                            className={`px-1.5 py-0.2 rounded-full border text-[8px] font-extrabold uppercase tracking-tight ${agyModePillClass}`}
                          >
                            {agyModeBadgeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 1B. ETAPA 2: FIGURA NODO DE EXTRACCIÓN / LECTURA PREVIA (Haz clic para elegir campos: ej. Nombre, Cédula y Edad)
              if (node.shape === 'square_extractor') {
                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic sobre este nodo para configurar qué campos extraer (ej. Nombre, Cédula y Edad) y su contexto"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-slate-900" />

                    <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-600 group-hover/node:border-sky-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                      {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                      {!readOnly && node.removable && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrAddCatalogNode('extractors', node.nodeId);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar nodo de extracción"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(
                          e,
                          node.key,
                          'main_out',
                          node.x + node.width,
                          node.y + node.height / 2,
                        )
                      }
                      title="Arrastra desde este puerto para conectar a cualquier módulo o Agente IA"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-sky-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    />

                    <div className="mt-1.5 w-[116px] -ml-[23px] text-center pointer-events-none">
                      <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {node.title}
                      </div>
                      <div className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold truncate">
                        {buildNodeConfigSummary(nodeCfg) || node.subtitle}
                      </div>
                      {showAntigravityBadge && (
                        <div className="mt-0.5 flex justify-center">
                          <span
                            className={`px-1.5 py-0.2 rounded-full border text-[8px] font-extrabold uppercase tracking-tight ${agyModePillClass}`}
                          >
                            {agyModeBadgeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 2. ETAPA 3: FIGURA AGENTE IA (Principal con Tenshi 3D + Sub-Agentes #2/#3/#4 rotando Avatares Suri, Max, Paz, Capi)
              if (node.shape === 'agent') {
                const isExtraAgent = node.key.startsWith('agent_extra_');
                const extraAgentsArr = workflowNodes?.canvasLayout?.extraAgents || [];
                const extraIdx = isExtraAgent
                  ? Math.max(0, extraAgentsArr.findIndex((ea) => ea.key === node.key))
                  : -1;
                const extraConfig = isExtraAgent ? extraAgentsArr[extraIdx] || null : null;
                const currentSelectedAgentId = isExtraAgent
                  ? extraConfig?.agentId || ''
                  : agentId || '';
                // Rotación automática de Avatares 3D: Principal = Tenshi (Gato), #2 = Suri (Suricato), #3 = Max (Perro), #4 = Paz (Paloma), #5 = Capi (Capibara)
                const rotatedAvatar = getRotatedAgentAvatar(
                  isExtraAgent ? extraIdx + 1 : 0,
                  nodeCfg?.avatarSrc,
                );

                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic sobre este Agente IA para editar su Prompt, Modelo de IA, Avatar 3D y Contexto de Entrada/Salida"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    {/* Puerto izquierdo de entrada (●) */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-lg bg-slate-400 border-2 border-white dark:border-slate-900" />

                    {/* Cuerpo rectangular del Agente IA */}
                    <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md px-3 pb-2.5 pt-1.5 flex items-center gap-2.5 relative transition-colors ${selectedRingClass}`}>
                      {!readOnly && isExtraAgent && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveExtraAgent(node.key);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar este Agente IA adicional"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {/* Icono del Agente: Avatar 3D Oficial de Tenshi en el Principal y Rotación Automática en los Sub-Agentes */}
                      <div
                        title={`Avatar 3D: ${rotatedAvatar.name}`}
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-purple-950/90 border border-emerald-200/80 dark:border-purple-800/70 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                      >
                        <img
                          src={rotatedAvatar.src}
                          alt={rotatedAvatar.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/tenshi.png';
                          }}
                          className="w-10 h-10 object-contain drop-shadow-sm select-none pointer-events-none scale-115"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11.5px] font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                            {node.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {showAntigravityBadge && (
                              <span
                                className={`px-1 py-0.2 rounded border text-[7.5px] font-extrabold whitespace-nowrap ${agyModePillClass}`}
                              >
                                {agyModeBadgeLabel}
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 whitespace-nowrap">
                              {isExtraAgent ? `${rotatedAvatar.animal} · #${extraIdx + 2}` : 'Principal'}
                            </span>
                          </div>
                        </div>

                        {/* Selector directo de Agente Especialista (según permisos del usuario) + Tenshi Avatar */}
                        {!readOnly && availableAgentsWithTenshiAvatar.length > 0 && (onSelectAgent || isExtraAgent) ? (
                          <select
                            value={currentSelectedAgentId}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (isExtraAgent) {
                                handleUpdateExtraAgent(node.key, e.target.value);
                              } else if (onSelectAgent) {
                                onSelectAgent(e.target.value);
                              }
                            }}
                            className="mt-1 w-full text-[10.5px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer truncate"
                          >
                            {availableAgentsWithTenshiAvatar.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 truncate mt-0.5">
                            {node.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Puerto circular de salida derecho (●) */}
                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(
                          e,
                          node.key,
                          'main_out',
                          node.x + node.width,
                          node.y + node.height / 2,
                        )
                      }
                      title="Arrastra para conectar la salida de este Agente IA hacia otro módulo, correo, acta u otro Agente IA"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-400 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    />

                    {/* ─── LOS 3 PUERTOS EN ROMBO (◆) INFERIORES EN ESPAÑOL ─── */}
                    {/* Rombo 1: Modelo IA * */}
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) {
                          setPaletteTab('ai_engine');
                          setActiveConfigNodeKey(isExtraAgent ? node.key : 'sub_model');
                        }
                      }}
                      style={{ left: 32 }}
                      className="absolute -bottom-2.5 flex flex-col items-center cursor-pointer group/modport"
                      title="Configurar Modelo de IA de este Agente (WAPPY Cloud / Antigravity Local / Antigravity Cloud 24/7)"
                    >
                      <div className="w-3 h-3 rotate-45 bg-indigo-500 group-hover/modport:scale-125 border-2 border-white dark:border-slate-900 shadow-sm transition-transform" />
                      <span className="mt-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        Modelo IA <span className="text-rose-500">*</span>
                      </span>
                    </div>

                    {/* Rombo 2: Memoria [+] */}
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) {
                          setPaletteTab('memories');
                          setActiveConfigNodeKey('sub_memory');
                        }
                      }}
                      style={{ left: 102 }}
                      className="absolute -bottom-2.5 flex flex-col items-center cursor-pointer group/memport"
                      title="Configurar las 4 Memorias del Agente (Empresa Activa, Bitácora Anti-Duplicados, RAG NotebookLM, Reglas Normativas SST)"
                    >
                      <div className="w-3 h-3 rotate-45 bg-pink-500 group-hover/memport:bg-pink-600 border-2 border-white dark:border-slate-900 shadow-sm" />
                      <span className="mt-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-0.5">
                        Memoria
                        {!readOnly && (
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[9px] font-black text-pink-600">
                            +
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Rombo 3: Herramienta [+] */}
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) {
                          setPaletteTab('connectors');
                          setActiveConfigNodeKey(node.key);
                        }
                      }}
                      style={{ left: 168 }}
                      className="absolute -bottom-2.5 flex flex-col items-center cursor-pointer group/toolport"
                      title="Conectar Herramientas al Agente IA"
                    >
                      <div className="w-3 h-3 rotate-45 bg-indigo-500 group-hover/toolport:bg-purple-600 border-2 border-white dark:border-slate-900 shadow-sm" />
                      <span className="mt-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-0.5">
                        Herramienta
                        {!readOnly && (
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[9px] font-black text-purple-600">
                            +
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              }

              // 3. FIGURA CONDICIÓN SI/NO (Cuadrado con icono de bifurcación verde y 2 salidas sí/no)
              if (node.shape === 'if') {
                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic para configurar qué evalúa la Condición Si/No"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />

                    <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-emerald-500 shadow-md flex items-center justify-center transition-colors ${selectedRingClass}`}>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <GitFork className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Puerto de salida superior: SÍ */}
                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(e, node.key, 'if_true', node.x + node.width, node.y + 24)
                      }
                      style={{ top: 20 }}
                      className="absolute -right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 cursor-crosshair"
                      title="Rama SÍ (Si se cumple la condición / hay hallazgos)"
                    />

                    {/* Puerto de salida inferior: NO */}
                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(e, node.key, 'if_false', node.x + node.width, node.y + 52)
                      }
                      style={{ top: 48 }}
                      className="absolute -right-2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 cursor-crosshair"
                      title="Rama NO (Si no hay hallazgos / caso contrario)"
                    />

                    <div className="mt-1.5 w-[112px] -ml-[20px] text-center pointer-events-none">
                      <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                        {node.title}
                      </div>
                      <div className="text-[9px] text-slate-400">{node.subtitle}</div>
                    </div>
                  </div>
                );
              }

              // 3A-BIS. NODOS LÓGICOS ADICIONALES (Iterar Loop, Unir Ramas Merge, Aprobación Humana)
              if (node.shape === 'logic') {
                const isLoop = node.nodeId.includes('loop');
                const isMerge = node.nodeId.includes('merge');
                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic para configurar este nodo de control de flujo"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />

                    <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 group-hover/node:border-amber-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        {isLoop ? (
                          <Repeat className="w-6 h-6" />
                        ) : isMerge ? (
                          <GitMerge className="w-6 h-6" />
                        ) : (
                          <UserCheck className="w-6 h-6" />
                        )}
                      </div>

                      {!readOnly && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLogicNode(node.key);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar nodo de control"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(
                          e,
                          node.key,
                          'main_out',
                          node.x + node.width,
                          node.y + node.height / 2,
                        )
                      }
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                      title="Arrastra desde este puerto para conectar al siguiente paso"
                    />

                    <div className="mt-1.5 w-[112px] -ml-[20px] text-center pointer-events-none">
                      <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {node.title}
                      </div>
                      <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                        {node.subtitle}
                      </div>
                    </div>
                  </div>
                );
              }

              // 3B. ETAPA 4: FIGURA NODO DE ACCIÓN EN HITO / APLICATIVO SOMOS SST (Conectable en cualquier orden)
              if (node.shape === 'square_hito') {
                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic sobre este nodo para configurar qué campos o acciones realizar en el Hito/Aplicativo"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />

                    <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-teal-400 dark:border-teal-600 group-hover/node:border-teal-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                      {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                      {!readOnly && node.removable && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrAddCatalogNode('hitos', node.nodeId);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar acción en Hito / App"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(
                          e,
                          node.key,
                          'main_out',
                          node.x + node.width,
                          node.y + node.height / 2,
                        )
                      }
                      title="Arrastra desde este puerto para conectar a un correo, otra IA revisora o cualquier módulo"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-teal-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    />

                    <div className="mt-1.5 w-[116px] -ml-[23px] text-center pointer-events-none">
                      <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {node.title}
                      </div>
                      <div className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                        {buildNodeConfigSummary(nodeCfg) || node.subtitle}
                      </div>
                    </div>
                  </div>
                );
              }

              // 4. ETAPA 5: FIGURA NODOS CUADRADOS DE BITÁCORA Y SALIDA (Con puerto de salida ● y botón [+])
              if (node.shape === 'square_output') {
                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic sobre este nodo para configurar el formato de salida de la bitácora"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />

                    <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                      {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                      {!readOnly && node.removable && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrAddCatalogNode('outputs', node.nodeId);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar nodo de salida"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center">
                      <div
                        onPointerDown={(e) =>
                          handlePortPointerDown(
                            e,
                            node.key,
                            'main_out',
                            node.x + node.width,
                            node.y + node.height / 2,
                          )
                        }
                        title="Arrastra desde este puerto para continuar el flujo hacia otra IA o módulo"
                        className="w-3.5 h-3.5 rounded-full bg-purple-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                      />
                      <div className="w-2.5 h-[1.5px] bg-slate-300 dark:bg-slate-600" />
                      {!readOnly && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setPaletteTab('outputs')}
                          className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 hover:text-purple-600 hover:border-purple-400 flex items-center justify-center text-[10px] font-bold shadow-xs"
                          title="Añadir otro destino o acción en el flujo"
                        >
                          +
                        </button>
                      )}
                    </div>

                    <div className="mt-1.5 w-[116px] -ml-[21px] text-center pointer-events-none">
                      <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {node.title}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {node.subtitle}
                      </div>
                      {showAntigravityBadge && (
                        <div className="mt-0.5 flex justify-center">
                          <span
                            className={`px-1.5 py-0.2 rounded-full border text-[8px] font-extrabold uppercase tracking-tight ${agyModePillClass}`}
                          >
                            {agyModeBadgeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 4-BIS. FIGURA NODOS PERSONALIZADOS DE SKILLS, SUB-AGENTES, REGLAS, WEB SCRAPING (ANTIGRAVITY SCRIPT) Y BÚSQUEDA WEB
              // Siempre que estén conectados debajo del Agente IA (como sub-nodos del rombo inferior), se transforman en CÍRCULOS con rombo superior (◆)
              if (node.shape === 'custom_node') {
                const isMainWired = wires.some(
                  (w) => !w.isSub && (w.sourceKey === node.key || w.targetKey === node.key),
                );
                const renderAsSubCircle = !isMainWired;
                const borderColor =
                  node.customNodeType === 'skill'
                    ? 'border-violet-400 dark:border-violet-600 hover:border-violet-500'
                    : node.customNodeType === 'subagent'
                      ? 'border-indigo-400 dark:border-indigo-600 hover:border-indigo-500'
                      : node.customNodeType === 'rule'
                        ? 'border-emerald-400 dark:border-emerald-600 hover:border-emerald-500'
                        : node.customNodeType === 'web_scraper'
                          ? 'border-orange-400 dark:border-orange-600 hover:border-orange-500'
                          : 'border-sky-400 dark:border-sky-600 hover:border-sky-500';
                const iconId = node.nodeId.includes('scraper_agy_')
                  ? node.nodeId
                  : node.customNodeType === 'web_scraper'
                    ? 'web_scraper'
                    : node.customNodeType === 'skill'
                      ? 'skill'
                      : node.customNodeType === 'subagent'
                        ? node.nodeId
                        : node.customNodeType === 'rule'
                          ? 'rule'
                          : 'web_search';

                return (
                  <div
                    key={node.key}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    title="Haz clic sobre este sub-nodo para configurar su Skill, Prompt de Sub-Agente, Regla o Script de Web Scraping en Antigravity"
                    className={`absolute z-20 group/node select-none ${
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {renderSandboxNodeOverlay(node)}

                    {renderAsSubCircle ? (
                      /* Puerto superior en forma de Rombo (◆) igual que los demás sub-nodos debajo del Agente IA */
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-purple-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                    ) : (
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900" />
                    )}

                    <div
                      className={`w-full h-full ${
                        renderAsSubCircle ? 'rounded-full group-hover/node:scale-105' : 'rounded-2xl'
                      } bg-white dark:bg-slate-800 border-2 ${borderColor} shadow-md flex items-center justify-center relative transition-transform ${selectedRingClass}`}
                    >
                      {node.customNodeType === 'subagent' && nodeCfg?.avatarSrc ? (
                        <img
                          src={nodeCfg.avatarSrc}
                          alt={node.title}
                          className="w-8 h-8 object-contain drop-shadow-sm select-none pointer-events-none scale-115"
                        />
                      ) : (
                        renderOfficialNodeSvg(iconId, 'w-7 h-7')
                      )}

                      {!readOnly && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomNode(node.key);
                          }}
                          className="opacity-0 group-hover/node:opacity-100 absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                          title="Quitar este nodo del lienzo"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {!renderAsSubCircle && (
                      <div
                        onPointerDown={(e) =>
                          handlePortPointerDown(
                            e,
                            node.key,
                            'main_out',
                            node.x + node.width,
                            node.y + node.height / 2,
                          )
                        }
                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-purple-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                        title="Arrastra desde este puerto para conectarlo con el Agente IA o cualquier otro módulo del flujo"
                      />
                    )}

                    <div className="mt-1.5 w-[108px] -ml-[23px] text-center pointer-events-none">
                      <div className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {node.title}
                      </div>
                      <div className="text-[8.5px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                        {node.subtitle}
                      </div>
                      {showAntigravityBadge && (
                        <div className="mt-0.5 flex justify-center">
                          <span
                            className={`px-1.5 py-0.2 rounded-full border text-[8px] font-extrabold uppercase tracking-tight ${agyModePillClass}`}
                          >
                            {agyModeBadgeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 5. FIGURA SUB-NODOS CIRCULARES (Modelo IA *, Memoria y Herramienta con Rombo superior ◆)
              const isModelCircle = node.shape === 'circle_model';
              const isMemoryCircle = node.shape === 'circle_memory';

              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este sub-nodo para configurar sus parámetros, campos y contexto"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {renderSandboxNodeOverlay(node)}

                  {/* Puerto superior en forma de Rombo (◆) que conecta exclusivamente al Agente IA */}
                  <div
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-2 border-white dark:border-slate-900 shadow-xs ${
                      isMemoryCircle ? 'bg-pink-500' : 'bg-indigo-500'
                    }`}
                  />

                  {/* Círculo perfecto de Sub-Nodo */}
                  <div
                    onClick={() => {
                      if (readOnly) return;
                      if (isModelCircle) {
                        setPaletteTab('ai_engine');
                      } else if (isMemoryCircle) {
                        setPaletteTab('memories');
                      }
                    }}
                    className={`w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 shadow-md flex items-center justify-center relative transition-transform group-hover/node:scale-105 ${selectedRingClass} ${
                      isModelCircle
                        ? aiEngine === 'antigravity_cloud'
                          ? 'border-sky-500 ring-2 ring-sky-500/20'
                          : aiEngine === 'antigravity'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : isMemoryCircle
                          ? 'border-pink-400 dark:border-pink-700 hover:border-pink-500'
                          : 'border-slate-300 dark:border-slate-600 hover:border-purple-500'
                    }`}
                  >
                    {renderOfficialNodeSvg(node.nodeId, 'w-7 h-7')}

                    {!readOnly && node.removable && node.group && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrAddCatalogNode(
                            node.group === 'triggers' ? 'trigger' : node.group!,
                            node.nodeId,
                          );
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Desconectar del Agente IA"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 w-[108px] -ml-[23px] text-center">
                    <div className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[8.5px] font-semibold text-slate-400 truncate">
                      {buildNodeConfigSummary(nodeCfg) || node.subtitle}
                    </div>
                    {showAntigravityBadge && (
                      <div className="mt-0.5 flex justify-center">
                        <span
                          className={`px-1.5 py-0.2 rounded-full border text-[8px] font-extrabold uppercase tracking-tight ${agyModePillClass}`}
                        >
                          {agyModeBadgeLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── PAPELERA INTERACTIVA EN EL ÁREA DE TRABAJO (SOLO ICONO SIN TEXTO) ─── */}
        {!compact && !readOnly && onChange && (
          <div
            ref={trashDropZoneRef}
            data-canvas-toolbar="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (selectedNodeKeys.length > 0) {
                handleDeleteNodesByKeys(selectedNodeKeys);
              }
            }}
            title={
              selectedNodeKeys.length > 0
                ? `Eliminar ${selectedNodeKeys.length} nodo(s) seleccionado(s)`
                : 'Papelera: Arrastra aquí cualquier nodo para quitarlo del flujo'
            }
            className={`absolute bottom-3 right-3 z-30 w-11 h-11 rounded-2xl border-2 flex items-center justify-center transition-all select-none ${
              isOverTrash
                ? 'bg-rose-600 text-white border-rose-300 scale-125 shadow-xl ring-4 ring-rose-500/40'
                : draggingNodeKey
                  ? 'bg-rose-50/95 dark:bg-rose-950/90 text-rose-600 dark:text-rose-300 border-dashed border-rose-400 dark:border-rose-600 scale-110 shadow-md animate-pulse'
                  : selectedNodeKeys.length > 0
                    ? 'bg-rose-50/95 hover:bg-rose-600 hover:text-white dark:bg-rose-950/90 text-rose-600 dark:text-rose-300 border-rose-400 dark:border-rose-600 cursor-pointer shadow-md'
                    : 'bg-white/95 dark:bg-slate-900/95 text-rose-500 dark:text-rose-400 border-rose-300/90 dark:border-rose-700/80 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 shadow-md'
            }`}
          >
            <Trash2 className={`w-5 h-5 ${isOverTrash ? 'animate-bounce' : ''}`} />
          </div>
        )}

        {/* ─── BOTÓN ÚNICO DE DAR PLAY (MODO DESARROLLO SIN ENVIAR SALIDAS) ─── */}
        {!compact && (
          <div
            data-canvas-toolbar="true"
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 inline-flex items-center p-1 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 dark:border-[#C7F303]/50 shadow-lg"
          >
            <ExpandableButton
              size="sm"
              variant="emerald"
              disabled={sandboxRunning}
              icon={
                sandboxRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )
              }
              label={
                sandboxRunning
                  ? `Probando Paso ${sandboxLiveSteps.length + 1}/${connectedExecutionPlan.length}...`
                  : 'Dar Play (Probar sin Enviar Salidas)'
              }
              title="Dar Play al Flujo en Modo Desarrollo (Probar sin Enviar Salidas)"
              onClick={handleRunSandboxSimulation}
            />
          </div>
        )}
      </div>

      {/* ─── ESCENARIO DE DESARROLLO & SIMULACIÓN EN VIVO (MODO SANDBOX SIN ENVIAR A LAS SALIDAS) ─── */}
      {!compact && (
        <div className="space-y-2">
          {visualNodes.some(
            (n) =>
              n.shape === 'circle_tool' ||
              n.shape === 'custom_node' ||
              n.shape === 'square_extractor' ||
              doesNodeRequireAntigravity(n.nodeId, n.key, n.customNodeType, aiEngine),
          ) && (
            <div className="rounded-xl border border-emerald-500/30 dark:border-[#C7F303]/40 bg-gradient-to-r from-emerald-500/10 via-purple-500/5 to-cyan-500/10 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-black uppercase tracking-wider text-emerald-800 dark:text-[#C7F303]">
                🛰️ Ciclo de Ejecución Agente IA ⇄ Herramienta Antigravity:
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                📥 Recibe Datos ➔ 🧠 Agente IA analiza Prompt (Gemini / Antigravity) ➔ 🛰️ Invoca Herramienta en Antigravity ➔ 🔄 Antigravity devuelve respuesta al Agente IA ➔ 📤 Continúa a Salidas
              </span>
            </div>
          )}

          <WappyWorkflowSandboxPanel
            open={sandboxOpen}
            running={sandboxRunning}
            result={sandboxResult}
            error={sandboxError}
            mockTriggerInput={mockTriggerInput}
            onChangeMockTriggerInput={setMockTriggerInput}
            onRunSimulation={handleRunSandboxSimulation}
            onClearSimulation={() => {
              setSandboxResult(null);
              setSandboxError(null);
              setSandboxActiveStepNodeId(null);
              setSandboxCompletedNodeKeys([]);
              setSandboxBlockedNodeKeys([]);
              setSandboxLiveSteps([]);
            }}
            onClose={() => setSandboxOpen(false)}
            activeStepNodeId={sandboxActiveStepNodeId}
            onSelectStepNode={setSandboxActiveStepNodeId}
            emailsStr={emailsStr}
            liveSteps={sandboxLiveSteps}
            totalPlannedSteps={connectedExecutionPlan.length}
            activeStepTitle={
              visualNodes.find((n) => n.key === sandboxActiveStepNodeId)?.title || null
            }
            onOpenEvidence={handleOpenEvidencePreview}
          />
        </div>
      )}

      {/* ─── INSPECTOR DE NODOS DE 3 COLUMNAS ESTILO n8n (INPUT | CONFIGURACIÓN DEL NODO | OUTPUT + LOGS) ─── */}
      {!readOnly && !compact && (() => {
        const activeNode = visualNodes.find((n) => n.key === activeConfigNodeKey);

        // Barra rápida inferior en el lienzo para abrir cualquier paso conectado en el Modal de 3 Columnas estilo n8n
        const quickInspectorBar = (
          <div
            id="wappy-node-config-inspector"
            className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-800/70 bg-purple-50/40 dark:bg-purple-950/20 px-3.5 py-2.5 flex flex-col gap-2 text-[11px] text-slate-600 dark:text-slate-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-[#C7F303] shrink-0" />
                <span>
                  💡 <strong>Inspector de Nodos Estilo n8n (3 Columnas):</strong> Haz clic sobre{' '}
                  <strong>cualquier nodo del lienzo</strong> o elige un paso aquí abajo para abrir el
                  popup con <strong>📥 INPUT (Lo que entró)</strong> a la izquierda,{' '}
                  <strong>⚙️ Configuración</strong> en el centro y{' '}
                  <strong>📤 OUTPUT (Lo que envió) + 📜 Logs/Errores</strong> a la derecha.
                </span>
              </span>
              <div className="shrink-0 py-0.5 px-1">
                <ExpandableButton
                  type="button"
                  size="sm"
                  variant="purple"
                  icon={<Sliders className="w-3.5 h-3.5" />}
                  label="Abrir Inspector n8n"
                  title="Abrir Inspector de 3 Columnas del nodo principal"
                  onClick={() =>
                    setActiveConfigNodeKey(
                      visualNodes.find((n) => n.shape === 'square_extractor')?.key ||
                        connectedExecutionPlan[0]?.nodeKey ||
                        'agent_root',
                    )
                  }
                />
              </div>
            </div>

            {connectedExecutionPlan.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-200/50 dark:border-purple-800/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-[#C7F303] mr-1">
                  Pasos del Flujo:
                </span>
                {connectedExecutionPlan.map((step) => (
                  <ExpandableButton
                    key={`quick_step_${step.nodeKey}`}
                    type="button"
                    size="sm"
                    variant={
                      step.category === 'trigger'
                        ? 'amber'
                        : step.category === 'extractor'
                          ? 'blue'
                          : step.category === 'agent'
                            ? 'purple'
                            : step.category === 'hito'
                              ? 'teal'
                              : step.category === 'output'
                                ? 'emerald'
                                : 'indigo'
                    }
                    isActive={activeConfigNodeKey === step.nodeKey}
                    icon={renderOfficialNodeSvg(step.nodeId, 'w-3.5 h-3.5')}
                    badge={`#${step.stepNumber}`}
                    label={`Paso #${step.stepNumber}: ${step.title}`}
                    title={`Abrir Inspector de 3 Columnas para Paso #${step.stepNumber}: ${step.title}`}
                    onClick={() => setActiveConfigNodeKey(step.nodeKey)}
                  />
                ))}
              </div>
            )}
          </div>
        );

        if (!activeNode) {
          return quickInspectorBar;
        }

        const currentCfg: CanvasNodeConfig =
          workflowNodes?.canvasLayout?.nodeConfigs?.[activeNode.key] || {};
        const isExtraAgent = activeNode.key.startsWith('agent_extra_');
        const extraAgentObj = isExtraAgent
          ? (workflowNodes?.canvasLayout?.extraAgents || []).find((ea) => ea.key === activeNode.key)
          : null;
        const customNodeObj =
          activeNode.shape === 'custom_node'
            ? (workflowNodes?.canvasLayout?.customNodes || []).find((cn) => cn.key === activeNode.key)
            : null;

        const activeStepNum = stepNumberByNodeKey.get(activeNode.key);
        const activePlanIdx = connectedExecutionPlan.findIndex(
          (p) => p.nodeKey === activeNode.key,
        );

        // ─── Helper para proyectar registros de MongoDB con el filtro quirúrgico `fields` y `recordFilterMode` de cualquier nodo ───
        const projectRecordsForNode = (
          rawRecords: Array<any>,
          nodeCfg?: CanvasNodeConfig,
        ): Array<Record<string, any>> => {
          const safeList = Array.isArray(rawRecords) ? rawRecords : [];
          if (safeList.length === 0) return [];

          let filtered = safeList;
          const filterMode = String(nodeCfg?.recordFilterMode || '');
          if (filterMode === 'critical' || filterMode === 'critical_only') {
            filtered = safeList.filter((r) => Boolean(r?.isCritical));
          } else if (
            nodeCfg?.recordFilterMode === 'selected' &&
            Array.isArray(nodeCfg?.selectedRecordIds) &&
            nodeCfg.selectedRecordIds.length > 0
          ) {
            const idSet = new Set(nodeCfg.selectedRecordIds);
            filtered = safeList.filter((r) => idSet.has(r?.id));
          }

          const rawMaxRecords = (nodeCfg as Record<string, any> | undefined)?.maxRecords;
          const limit =
            typeof rawMaxRecords === 'number' && rawMaxRecords > 0 ? rawMaxRecords : 30;
          const sliced = filtered.slice(0, limit);
          const chosenFields = Array.isArray(nodeCfg?.fields)
            ? nodeCfg!.fields.filter(Boolean)
            : [];

          return sliced.map((rec, idx) => {
            if (chosenFields.length > 0) {
              const pairs = resolveRecordSurgicalPreview(rec, chosenFields);
              const row: Record<string, any> = {};
              if (pairs.length > 0) {
                pairs.forEach((p) => {
                  row[p.field] = p.value;
                });
              }
              chosenFields.forEach((f) => {
                if (row[f] === undefined) {
                  const fallbackVal =
                    rec?.fields?.[f] ?? rec?.values?.[f] ?? rec?.data?.[f] ?? undefined;
                  if (fallbackVal !== undefined && fallbackVal !== null && String(fallbackVal).trim() !== '') {
                    row[f] = fallbackVal;
                  }
                }
              });
              if (Object.keys(row).length > 0) {
                return row;
              }
            }

            const bag: Record<string, any> = {
              ...(rec?.data && typeof rec.data === 'object' ? rec.data : {}),
              ...(rec?.values && typeof rec.values === 'object' ? rec.values : {}),
              ...(rec?.fields && typeof rec.fields === 'object' ? rec.fields : {}),
            };
            const bagKeys = Object.keys(bag).filter(
              (k) => bag[k] !== undefined && bag[k] !== null && String(bag[k]).trim() !== '',
            );
            if (bagKeys.length > 0) {
              const cleanObj: Record<string, any> = {};
              bagKeys.slice(0, 10).forEach((k) => {
                cleanObj[k] = Array.isArray(bag[k]) ? bag[k].join(', ') : bag[k];
              });
              return cleanObj;
            }

            return {
              '#': idx + 1,
              Registro: rec?.label || rec?.id || `Item #${idx + 1}`,
              Detalle: rec?.sublabel || '—',
              Estado: rec?.badge || (rec?.isCritical ? 'Crítico' : 'Activo'),
            };
          });
        };

        // ─── 1. Buscar paso ejecutado en Sandbox (`traceStep`) ───
        const allTraceSteps: SandboxNodeTraceStep[] =
          Array.isArray(sandboxResult?.nodeTrace) && sandboxResult!.nodeTrace.length > 0
            ? sandboxResult!.nodeTrace
            : sandboxLiveSteps;

        const findTraceForNode = (n: VisualNodeInstance): SandboxNodeTraceStep | undefined =>
          allTraceSteps.find(
            (s) =>
              s.nodeKey === n.key ||
              s.nodeId === n.nodeId ||
              (n.key === 'if_router' &&
                (s.nodeKey === 'if_condition' || s.nodeId === 'if_condition')) ||
              (n.key === 'agent_root' &&
                (s.nodeKey === 'agent_root' ||
                  s.nodeId === 'ai_agent_root' ||
                  s.nodeKey === 'agent_primary')),
          );

        const traceStep = findTraceForNode(activeNode);

        // ─── 2. Nodos Upstream (qué nodos le entregan datos a `activeNode`) ───
        const upstreamNodeMap = new Map<string, VisualNodeInstance>();
        // A) Cables principales entrantes (`w.targetKey === activeNode.key`)
        wires.forEach((w) => {
          if (!w.isSub && w.targetKey === activeNode.key) {
            const srcNode = visualNodes.find((vn) => vn.key === w.sourceKey);
            if (srcNode) upstreamNodeMap.set(srcNode.key, srcNode);
          }
          // B) Si `activeNode` es el Agente IA, añadir sus sub-nodos conectados por debajo (`w.isSub && w.sourceKey === activeNode.key`)
          if (w.isSub && w.sourceKey === activeNode.key) {
            const subNode = visualNodes.find((vn) => vn.key === w.targetKey);
            if (subNode) upstreamNodeMap.set(subNode.key, subNode);
          }
          // C) Si `activeNode` es un Sub-Nodo (`circle_tool`, `custom_node`, `circle_memory`, `circle_model`) conectado debajo de un Agente IA:
          // incluir automáticamente los Extractores (y nodos entrantes) conectados a su Agente IA padre, además del propio Agente IA
          if (w.isSub && w.targetKey === activeNode.key) {
            const parentAgent = visualNodes.find((vn) => vn.key === w.sourceKey);
            if (parentAgent) {
              wires.forEach((aw) => {
                if (!aw.isSub && aw.targetKey === parentAgent.key) {
                  const extNode = visualNodes.find((vn) => vn.key === aw.sourceKey);
                  if (extNode) upstreamNodeMap.set(extNode.key, extNode);
                }
              });
              upstreamNodeMap.set(parentAgent.key, parentAgent);
            }
          }
        });
        // D) Pasos anteriores en `connectedExecutionPlan`
        if (activePlanIdx > 0) {
          for (let i = activePlanIdx - 1; i >= 0; i--) {
            const prevStep = connectedExecutionPlan[i];
            const prevNode = visualNodes.find((vn) => vn.key === prevStep.nodeKey);
            if (prevNode && !upstreamNodeMap.has(prevNode.key)) {
              upstreamNodeMap.set(prevNode.key, prevNode);
            }
          }
        }
        // E) Si es un Sub-Nodo o Agente IA y existen Extractores en el lienzo que aún no están en el mapa, incluirlos primero
        if (
          activeNode.shape === 'custom_node' ||
          activeNode.shape === 'circle_tool' ||
          activeNode.shape === 'circle_memory' ||
          activeNode.shape === 'circle_model' ||
          activeNode.shape === 'agent'
        ) {
          visualNodes
            .filter((vn) => vn.shape === 'square_extractor' && vn.key !== activeNode.key)
            .forEach((ext) => {
              if (!upstreamNodeMap.has(ext.key)) {
                upstreamNodeMap.set(ext.key, ext);
              }
            });
        }
        const upstreamCandidates = Array.from(upstreamNodeMap.values());

        // Elegir el nodo upstream activo por defecto (`auto`):
        // Para Sub-Nodos (`Alto Riesgo & SENA`, `circle_tool`, `custom_node`, `circle_memory`) y para el `Agente IA`,
        // priorizar siempre el Extractor de datos (`square_extractor`, ej. `Extraer Trabajadores`) conectado al Agente IA
        // por encima de `circle_model` (`sub_model`) para que en `📥 INPUT` aparezca la tabla real de trabajadores con su filtro quirúrgico
        const defaultUpstreamNode: VisualNodeInstance | null = (() => {
          const isSubOrAgent =
            activeNode.shape === 'custom_node' ||
            activeNode.shape === 'circle_tool' ||
            activeNode.shape === 'circle_memory' ||
            activeNode.shape === 'circle_model' ||
            activeNode.shape === 'agent';

          if (traceStep?.sourceNodeKey) {
            const byTrace = visualNodes.find((vn) => vn.key === traceStep.sourceNodeKey);
            // Si es un sub-nodo y `byTrace` cayó en `circle_model` (`Gemini 3.6 Flash`), preferir el Extractor conectado si existe
            if (byTrace && !(isSubOrAgent && byTrace.shape === 'circle_model')) {
              return byTrace;
            }
          }

          // Si es un sub-nodo conectado a un Agente IA, buscar el Extractor conectado al Agente IA padre
          const parentSubWire = wires.find((w) => w.isSub && w.targetKey === activeNode.key);
          if (parentSubWire) {
            const agentIncomingExtractor = wires
              .filter((w) => !w.isSub && w.targetKey === parentSubWire.sourceKey)
              .map((w) => visualNodes.find((vn) => vn.key === w.sourceKey))
              .find((vn) => vn && vn.shape === 'square_extractor');
            if (agentIncomingExtractor) return agentIncomingExtractor;
          }

          const mainIncomingExtractor = wires
            .filter((w) => !w.isSub && w.targetKey === activeNode.key)
            .map((w) => visualNodes.find((vn) => vn.key === w.sourceKey))
            .find((vn) => vn && vn.shape !== 'trigger');
          if (mainIncomingExtractor) return mainIncomingExtractor;

          if (activePlanIdx > 0) {
            // Priorizar cualquier Extractor (`square_extractor`), Hito o Agente previo sobre un `circle_model`
            const priorExtractorStep = [...connectedExecutionPlan.slice(0, activePlanIdx)]
              .reverse()
              .find(
                (st) =>
                  st.category === 'extractor' ||
                  st.category === 'hito' ||
                  st.category === 'agent',
              );
            if (priorExtractorStep) {
              const found = visualNodes.find((vn) => vn.key === priorExtractorStep.nodeKey);
              if (found) return found;
            }
            const prevStep = connectedExecutionPlan[activePlanIdx - 1];
            const foundPrev = visualNodes.find((vn) => vn.key === prevStep.nodeKey);
            if (foundPrev) return foundPrev;
          }

          const anyExtractorCandidate = upstreamCandidates.find(
            (vn) => vn.shape === 'square_extractor',
          );
          if (anyExtractorCandidate) return anyExtractorCandidate;

          return upstreamCandidates[0] || null;
        })();

        const selectedUpstreamNode: VisualNodeInstance | null =
          ndvSelectedUpstreamKey !== 'auto' && ndvSelectedUpstreamKey !== 'all_connected'
            ? visualNodes.find((vn) => vn.key === ndvSelectedUpstreamKey) || defaultUpstreamNode
            : defaultUpstreamNode;

        const isTriggerNode =
          activeNode.shape === 'trigger' ||
          (activeStepNum === 1 && upstreamCandidates.length === 0);

        // ─── 3. Construir `resolvedInputItems` y `resolvedInputSourceTitle` ───
        const buildNodeLiveOutputItems = (targetNode: VisualNodeInstance): Array<Record<string, any>> => {
          const targetCfg = workflowNodes?.canvasLayout?.nodeConfigs?.[targetNode.key] || {};
          const targetTrace = findTraceForNode(targetNode);

          // 1) Para nodos de tabla de datos de MongoDB (`square_extractor`, `square_hito`, `circle_memory` y `circle_tool` de datos SST),
          // proyectar sus registros reales en vivo con el filtro quirúrgico `targetCfg.fields` y `targetCfg.recordFilterMode`
          const isDataInspectorShape =
            targetNode.shape === 'square_extractor' ||
            targetNode.shape === 'square_hito' ||
            targetNode.shape === 'circle_memory' ||
            targetNode.shape === 'circle_tool';

          if (isDataInspectorShape) {
            const liveRecs =
              targetNode.key === activeNode.key && nodeLiveInspectorData.records.length > 0
                ? nodeLiveInspectorData.records
                : upstreamLiveRecordsCache[targetNode.key]?.records || [];

            if (liveRecs.length > 0) {
              const projected = projectRecordsForNode(liveRecs, targetCfg);
              if (projected.length > 0) return projected;
            }
          }

          // 2) Si el nodo ya se ejecutó en Sandbox (`Play`) y tiene `outputItems` trazados, usarlos
          if (targetTrace?.outputItems && targetTrace.outputItems.length > 0) {
            return targetTrace.outputItems;
          }

          // 3) Si es un Sub-Nodo (`custom_node` como `Alto Riesgo & SENA`, `Antigravity Scraper`, `Skill`, `Sub-Agente`, `Regla`)
          // o `circle_tool` sin registros propios de MongoDB: construir vista previa enriquecida cruzando los registros del Extractor entrante
          if (targetNode.shape === 'custom_node' || targetNode.shape === 'circle_tool') {
            const chosenCols = Array.isArray(targetCfg.fields)
              ? targetCfg.fields.filter(Boolean)
              : [];
            // Buscar registros del Extractor conectado al Agente IA
            const extNode =
              visualNodes.find((vn) => vn.shape === 'square_extractor') || defaultUpstreamNode;
            const extRecs =
              extNode && upstreamLiveRecordsCache[extNode.key]?.records?.length
                ? projectRecordsForNode(
                    upstreamLiveRecordsCache[extNode.key].records,
                    workflowNodes?.canvasLayout?.nodeConfigs?.[extNode.key],
                  )
                : [];

            if (extRecs.length > 0) {
              return extRecs.slice(0, 15).map((row, idx) => {
                const enriched: Record<string, any> = {
                  '#': idx + 1,
                  ...row,
                  SubNodo: targetNode.title,
                  ColumnasConsultadas:
                    chosenCols.length > 0
                      ? chosenCols.join(' · ')
                      : targetNode.subtitle || 'Verificación automática',
                  EstadoCruces: '⚡ Listo para consultar al dar Play',
                };
                return enriched;
              });
            }

            return [
              {
                SubNodo: targetNode.title,
                Categoria: targetNode.subtitle,
                PortalObjetivo: targetCfg.targetUrl || 'Portales Oficiales / Motor WAPPY',
                ModoEjecucion:
                  (targetCfg as Record<string, any>).executionMode === 'local_pc' ||
                  targetCfg.antigravityMode === 'local'
                    ? 'PC Local (Antigravity Daemon)'
                    : 'Servidor Cloud 24/7 (Headless)',
                ColumnasSeleccionadas:
                  chosenCols.length > 0
                    ? chosenCols.join(', ')
                    : 'Todas las columnas del módulo',
                Estado: 'Listo para entregar hallazgos al Agente IA',
              },
            ];
          }

          if (targetNode.shape === 'trigger') {
            return [
              {
                Disparador: targetNode.title,
                Modalidad:
                  scheduleType === 'hourly'
                    ? `Cada ${intervalHours} hora(s)`
                    : scheduleType === 'daily'
                      ? `Diario a las ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                      : scheduleType === 'weekly'
                        ? `Semanal (${(daysOfWeek || []).join(', ')})`
                        : `Mensual (Día ${dayOfMonth})`,
                EmpresaActiva: activeCompanyInfo?.companyName || 'Empresa Activa',
                NIT: activeCompanyInfo?.nit || '—',
                ARL: activeCompanyInfo?.arl || '—',
                NivelRiesgo: activeCompanyInfo?.riskLevel || '—',
                PayloadPrueba: mockTriggerInput?.trim() || 'Disparo automático programado',
              },
            ];
          }

          if (targetNode.shape === 'agent') {
            const agOut = (sandboxResult?.agentOutputs || []).find(
              (ao) => ao.agentKey === targetNode.key || ao.agentId === targetNode.nodeId,
            );
            return [
              {
                AgenteIA: targetNode.title,
                Rol: targetNode.subtitle,
                MotorIA: targetCfg.aiEngine || aiEngine,
                Modelo: targetCfg.aiModel || aiModel,
                SubNodosConectados: wires.filter(
                  (w) => w.isSub && w.sourceKey === targetNode.key,
                ).length,
                Estado: agOut ? 'Ejecutado en Sandbox' : 'Configurado y listo',
                ResumenRespuesta: agOut?.responseMarkdown
                  ? `${agOut.responseMarkdown.slice(0, 180)}...`
                  : targetTrace?.outputPreview ||
                    prompt?.slice(0, 160) ||
                    'Procesa los registros recibidos del Extractor y los Sub-Nodos para emitir dictamen SST.',
              },
            ];
          }

          if (targetNode.shape === 'if' || targetNode.shape === 'logic') {
            return [
              {
                NodoControl: targetNode.title,
                Regla: targetCfg.customInstruction || targetNode.subtitle || 'Evaluación condicional Si/No',
                RamaTomada: sandboxResult?.ifEvaluation?.branchTaken || 'SÍ (En espera de Play)',
                Motivo:
                  sandboxResult?.ifEvaluation?.reason ||
                  'Evalúa si existen hallazgos o registros críticos en la entrada.',
              },
            ];
          }

          if (targetNode.shape === 'circle_model') {
            return [
              {
                MotorIA:
                  aiEngine === 'antigravity_cloud'
                    ? 'Google Antigravity Cloud 24/7'
                    : aiEngine === 'antigravity'
                      ? 'Google Antigravity Local PC'
                      : 'WAPPY Cloud (Rotación de Claves)',
                ModeloActivo: aiModel,
                ModoAntigravity: targetCfg.antigravityMode || 'auto',
              },
            ];
          }

          if (targetNode.shape === 'square_output') {
            const ep = sandboxResult?.interceptedOutputs?.emailPreview;
            return [
              {
                CanalSalida: targetNode.title,
                TipoEntrega: targetNode.subtitle,
                Destinatarios:
                  (ep?.recipients && ep.recipients.join(', ')) ||
                  targetCfg.emailRecipientsOverride?.trim() ||
                  emailsStr?.trim() ||
                  'Destinatarios configurados en el nodo',
                Asunto:
                  ep?.subject ||
                  targetCfg.emailSubject?.trim() ||
                  `Reporte Automático SG-SST · ${activeCompanyInfo?.companyName || 'Empresa'}`,
                FormatosAdjuntos:
                  Array.isArray(targetCfg.fields) && targetCfg.fields.length > 0
                    ? targetCfg.fields.join(', ')
                    : 'Cuerpo HTML + Resumen Ejecutivo',
                Estado: ep
                  ? '🛡️ Interceptado en Sandbox (Listo para envío real)'
                  : 'Listo para despachar salida del Agente IA',
              },
            ];
          }

          return [
            {
              Nodo: targetNode.title,
              Tipo: targetNode.subtitle,
              Empresa: activeCompanyInfo?.companyName || 'Empresa Activa',
              CamposQuirurgicos:
                Array.isArray(targetCfg.fields) && targetCfg.fields.length > 0
                  ? targetCfg.fields.join(', ')
                  : 'Todos los campos del módulo',
              ContextoSalida:
                targetCfg.outputContext ||
                targetTrace?.outputPreview ||
                'Listo para enviar datos al siguiente nodo conectado.',
            },
          ];
        };

        const resolvedInputSourceTitle: string = isTriggerNode
          ? 'Inicio del Flujo (Disparador)'
          : ndvSelectedUpstreamKey === 'all_connected'
            ? `Todos los nodos conectados (${upstreamCandidates.length})`
            : selectedUpstreamNode
              ? `${
                  stepNumberByNodeKey.get(selectedUpstreamNode.key)
                    ? `Paso #${stepNumberByNodeKey.get(selectedUpstreamNode.key)} · `
                    : ''
                }${selectedUpstreamNode.title}`
              : traceStep?.sourceNodeTitle || 'Paso Anterior del Flujo';

        const resolvedInputItems: Array<Record<string, any>> = (() => {
          if (isTriggerNode) return [];

          // Opción "Todos los nodos conectados": combina los ítems de todos los `upstreamCandidates` (Extractores + Sub-Nodos)
          if (ndvSelectedUpstreamKey === 'all_connected') {
            const combined: Array<Record<string, any>> = [];
            upstreamCandidates.forEach((upNode) => {
              const stepNum = stepNumberByNodeKey.get(upNode.key);
              const sourceLabel = `${stepNum ? `#${stepNum} ` : ''}${upNode.title}`;
              const items = buildNodeLiveOutputItems(upNode);
              items.forEach((it) => {
                combined.push({
                  _NodoOrigen: sourceLabel,
                  ...it,
                });
              });
            });
            return combined;
          }

          // Si el usuario o el modo automático seleccionó un nodo upstream (ej. `Extraer Trabajadores` con su filtro quirúrgico),
          // proyectar primero desde `upstreamLiveRecordsCache` con la configuración actual de ese nodo para que siempre refleje sus campos quirúrgicos
          if (
            selectedUpstreamNode &&
            upstreamLiveRecordsCache[selectedUpstreamNode.key]?.records?.length &&
            (selectedUpstreamNode.shape === 'square_extractor' ||
              selectedUpstreamNode.shape === 'square_hito' ||
              selectedUpstreamNode.shape === 'circle_memory' ||
              selectedUpstreamNode.shape === 'circle_tool')
          ) {
            const upCfg = workflowNodes?.canvasLayout?.nodeConfigs?.[selectedUpstreamNode.key];
            const projected = projectRecordsForNode(
              upstreamLiveRecordsCache[selectedUpstreamNode.key].records,
              upCfg,
            );
            if (projected.length > 0) return projected;
          }

          if (
            ndvSelectedUpstreamKey === 'auto' &&
            traceStep?.inputItems &&
            traceStep.inputItems.length > 0
          ) {
            return traceStep.inputItems;
          }

          if (selectedUpstreamNode) {
            return buildNodeLiveOutputItems(selectedUpstreamNode);
          }
          return [];
        })();

        // ─── 4. Construir `resolvedOutputItems` y `resolvedOutputPreview` (Reactivos en Tiempo Real) ───
        const resolvedOutputItems: Array<Record<string, any>> = (() => {
          const isDataInspectorShape =
            activeNode.shape === 'square_extractor' ||
            activeNode.shape === 'square_hito' ||
            activeNode.shape === 'circle_memory' ||
            activeNode.shape === 'circle_tool';

          // 1) Para Extractores, Hitos, Memorias y Herramientas de datos SST: proyectar en vivo con `currentCfg.fields` y `currentCfg.recordFilterMode`
          // para que cuando el usuario marque/desmarque campos o cambie el filtro en el panel central, la tabla derecha `OUTPUT` reaccione al instante
          if (isDataInspectorShape && nodeLiveInspectorData.records.length > 0) {
            return projectRecordsForNode(nodeLiveInspectorData.records, currentCfg);
          }

          // 2) Si ya corrió Play y existe `traceStep.outputItems`, mostrar los ítems reales generados en la ejecución
          if (traceStep?.outputItems && traceStep.outputItems.length > 0) {
            // Si es un sub-nodo con columnas quirúrgicas seleccionadas, asegurar que se reflejen también al conmutar checkboxes en vivo
            if (
              activeNode.shape === 'custom_node' &&
              Array.isArray(currentCfg.fields) &&
              currentCfg.fields.length > 0
            ) {
              return traceStep.outputItems.map((it) => ({
                ...it,
                ColumnasActivas: currentCfg.fields!.join(' · '),
              }));
            }
            return traceStep.outputItems;
          }

          // 3) Si es un Sub-Nodo (`custom_node` como `Alto Riesgo & SENA`) antes de dar Play:
          // cruzar en vivo los trabajadores entrantes (`resolvedInputItems`) con las columnas marcadas en el panel central (`currentCfg.fields`)
          if (activeNode.shape === 'custom_node' && resolvedInputItems.length > 0) {
            const chosenCols = Array.isArray(currentCfg.fields)
              ? currentCfg.fields.filter(Boolean)
              : [];
            return resolvedInputItems.slice(0, 20).map((inRow, idx) => ({
              '#': idx + 1,
              ...inRow,
              SubNodo: activeNode.title,
              ColumnasExtraer:
                chosenCols.length > 0
                  ? chosenCols.join(' · ')
                  : activeNode.subtitle || 'Todas las columnas del scraper',
              Estado: '⚡ Vista previa (Pulsa Probar paso para consultar en vivo)',
            }));
          }

          return buildNodeLiveOutputItems(activeNode);
        })();

        const resolvedOutputPreview: string = (() => {
          if (traceStep?.outputPreview && traceStep.outputPreview.trim()) {
            return traceStep.outputPreview;
          }
          if (activeNode.shape === 'agent' && sandboxResult?.finalResponseMarkdown) {
            return sandboxResult.finalResponseMarkdown;
          }
          if (activeNode.shape === 'square_output' && sandboxResult?.interceptedOutputs?.emailPreview) {
            const ep = sandboxResult.interceptedOutputs.emailPreview;
            return `Asunto: ${ep.subject}\nPara: ${(ep.recipients || []).join(', ')}\n\n${ep.textBody || sandboxResult.finalResponseMarkdown || ''}`;
          }
          if (resolvedOutputItems.length > 0) {
            const cols = Object.keys(resolvedOutputItems[0] || {});
            const previewRows = resolvedOutputItems
              .slice(0, 8)
              .map(
                (item, i) =>
                  `${i + 1}. ` +
                  cols.map((c) => `${c}: ${String(item[c] ?? '—')}`).join(' | '),
              )
              .join('\n');
            return `📤 Vista Previa de Salida de «${activeNode.title}» (${resolvedOutputItems.length} registro(s), ${cols.length} campo(s)):\n\n${previewRows}`;
          }
          return 'Sin vista previa de salida todavía. Haz clic en «Probar paso» para ejecutar este nodo.';
        })();

        // ─── 5. Construir `resolvedNodeLogs` y `hasNodeErrors` ───
        const resolvedNodeLogs: Array<{
          timestamp?: string;
          level: 'info' | 'success' | 'warn' | 'error';
          message: string;
          detail?: string;
        }> = (() => {
          const logsList: Array<{
            timestamp?: string;
            level: 'info' | 'success' | 'warn' | 'error';
            message: string;
            detail?: string;
          }> = [];

          const nowTime = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          if (traceStep?.error || sandboxError) {
            logsList.push({
              timestamp: nowTime,
              level: 'error',
              message: `Error detectado en «${activeNode.title}»`,
              detail:
                traceStep?.error ||
                sandboxError ||
                'Se produjo una excepción durante la ejecución del paso.',
            });
          }

          if (traceStep?.logs && traceStep.logs.length > 0) {
            traceStep.logs.forEach((lg) => {
              logsList.push({
                timestamp: lg.timestamp || nowTime,
                level: lg.level || 'info',
                message: lg.message,
                detail: lg.detail,
              });
            });
            return logsList;
          }

          if (traceStep) {
            logsList.push({
              timestamp: nowTime,
              level: 'info',
              message: `📥 Entrada recibida desde «${resolvedInputSourceTitle}»`,
              detail:
                traceStep.inputSummary ||
                traceStep.inputContext ||
                `${resolvedInputItems.length} registro(s) entregados al nodo.`,
            });
            if (Array.isArray(currentCfg.fields) && currentCfg.fields.length > 0) {
              logsList.push({
                timestamp: nowTime,
                level: 'info',
                message: `🎯 Filtro quirúrgico aplicado (${currentCfg.fields.length} campos)`,
                detail: `Campos activos: ${currentCfg.fields.join(', ')}`,
              });
            }
            logsList.push({
              timestamp: nowTime,
              level:
                traceStep.status === 'error'
                  ? 'error'
                  : traceStep.status === 'simulated_blocked'
                    ? 'warn'
                    : 'success',
              message:
                traceStep.status === 'error'
                  ? `❌ Falló la ejecución de «${activeNode.title}»`
                  : traceStep.status === 'simulated_blocked'
                    ? `🛡️ Salida interceptada en Modo Desarrollo (${traceStep.durationMs || 0} ms)`
                    : `✅ Ejecución completada con éxito en ${traceStep.durationMs || 0} ms`,
              detail:
                traceStep.details ||
                traceStep.outputPreview ||
                `El nodo procesó y emitió ${resolvedOutputItems.length} registro(s) hacia el siguiente paso.`,
            });
            return logsList;
          }

          // Estado antes de ejecutar Play
          logsList.push({
            timestamp: nowTime,
            level: 'info',
            message: `⏳ Nodo «${activeNode.title}» listo para probar`,
            detail: `Pulsa el botón «Probar paso» en la barra superior para ejecutar el flujo en Modo Sandbox y registrar las trazas de ejecución.`,
          });
          if (nodeLiveInspectorData.supported) {
            logsList.push({
              timestamp: nowTime,
              level: nodeLiveInspectorData.totalRecords > 0 ? 'success' : 'warn',
              message: `📊 Inspector en Vivo conectado: ${nodeLiveInspectorData.totalRecords} registro(s) en MongoDB`,
              detail: `Fuente: ${nodeLiveInspectorData.sourceCollection || activeNode.nodeId} · Empresa: ${activeCompanyInfo?.companyName || nodeLiveInspectorData.companyName || 'Activa'} (${nodeLiveInspectorData.criticalCount} crítico(s)).`,
            });
          }
          if (Array.isArray(currentCfg.fields) && currentCfg.fields.length > 0) {
            logsList.push({
              timestamp: nowTime,
              level: 'success',
              message: `🎯 Selección Quirúrgica configurada (${currentCfg.fields.length} campo(s))`,
              detail: `Este nodo filtrará y enviará únicamente: ${currentCfg.fields.join(', ')}.`,
            });
          }
          return logsList;
        })();

        const hasNodeErrors = Boolean(
          traceStep?.error ||
            sandboxError ||
            traceStep?.status === 'error' ||
            resolvedNodeLogs.some((l) => l.level === 'error'),
        );

        // ─── 6. Filtrado por buscador para `INPUT` y `OUTPUT` y construcción de `Schema` ───
        const filterItemsByQuery = (
          items: Array<Record<string, any>>,
          query: string,
        ): Array<Record<string, any>> => {
          const q = (query || '').trim().toLowerCase();
          if (!q) return items;
          return items.filter((item) =>
            Object.entries(item || {}).some(
              ([k, v]) =>
                k.toLowerCase().includes(q) ||
                String(v ?? '')
                  .toLowerCase()
                  .includes(q),
            ),
          );
        };

        const filteredInputItems = filterItemsByQuery(resolvedInputItems, ndvInputSearch);
        const filteredOutputItems = filterItemsByQuery(resolvedOutputItems, ndvOutputSearch);

        // ─── Certificados / Evidencias capturadas en el nodo activo y en el flujo ───
        const allKnownEvidences = collectUniqueScraperEvidences(
          [...(sandboxResult?.nodeTrace || []), ...sandboxLiveSteps],
          sandboxResult?.evidences,
        );
        const rowExtractedNodeEvidences = resolvedOutputItems
          .map((r) => extractEvidenceFromRow(r, activeNode.title))
          .filter((ev): ev is ScraperCapturedEvidence => Boolean(ev));
        const activeNodeEvidences = collectUniqueScraperEvidences(
          traceStep ? [traceStep] : [],
          rowExtractedNodeEvidences,
        );

        const getCleanTableColumns = (rows: Array<Record<string, any>>): string[] => {
          const allCols: string[] = [];
          const colSet = new Set<string>();
          (Array.isArray(rows) ? rows : []).forEach((r) => {
            Object.keys(r || {}).forEach((k) => {
              if (!colSet.has(k)) {
                colSet.add(k);
                allCols.push(k);
              }
            });
          });
          const hasPrimaryEvidenceCol =
            colSet.has('pdfUrl') ||
            colSet.has('imageUrl') ||
            colSet.has('certificado') ||
            colSet.has('Certificado / Soporte') ||
            colSet.has('Certificado');
          const redundantAuxCols = new Set([
            'pdfDownloadUrl',
            'imageDownloadUrl',
            'pdfFileName',
            'imageFileName',
            'pdfLocalPath',
            'imageLocalPath',
            'pdfAbsoluteUrl',
            'imageAbsoluteUrl',
          ]);
          return allCols.filter((c) => !(hasPrimaryEvidenceCol && redundantAuxCols.has(c)));
        };

        const inputTableCols = getCleanTableColumns(filteredInputItems);
        const outputTableCols = getCleanTableColumns(filteredOutputItems);

        const isSmartEvidenceCell = (row: Record<string, any>, col: string): boolean => {
          const lowerCol = col.toLowerCase();
          if (
            lowerCol === 'pdfurl' ||
            lowerCol === 'pdfdownloadurl' ||
            lowerCol === 'imageurl' ||
            lowerCol === 'imagedownloadurl' ||
            lowerCol === 'certificado' ||
            lowerCol === 'certificado / soporte' ||
            lowerCol === 'soporte'
          ) {
            const v = row?.[col];
            if (typeof v === 'string' && v.trim()) {
              if (
                v.includes('/api/sgsst/automatizaciones/evidencias/') ||
                /\.(pdf|png|jpe?g|webp)(\?|$)/i.test(v.trim()) ||
                lowerCol === 'pdfurl' ||
                lowerCol === 'imageurl' ||
                lowerCol === 'pdfdownloadurl' ||
                lowerCol === 'imagedownloadurl'
              ) {
                return true;
              }
            }
            if (
              (lowerCol === 'certificado' || lowerCol === 'certificado / soporte') &&
              (row?.pdfUrl || row?.imageUrl || row?.pdfDownloadUrl || row?.imageDownloadUrl)
            ) {
              return true;
            }
          }
          const rawStr = typeof row?.[col] === 'string' ? row[col].trim() : '';
          return rawStr.includes('/api/sgsst/automatizaciones/evidencias/');
        };

        const renderNdvSmartCell = (row: Record<string, any>, col: string): React.ReactNode => {
          const cellVal = row?.[col];
          const lowerCol = col.toLowerCase();
          const rowEv = extractEvidenceFromRow(row, activeNode.title);

          // 1. Columna específica de Imagen (`imageUrl` / `imageDownloadUrl`)
          if (lowerCol === 'imageurl' || lowerCol === 'imagedownloadurl') {
            const normImg = normalizeEvidenceUrlForBrowser(
              typeof cellVal === 'string' ? cellVal : rowEv?.imageUrl,
            );
            if (!normImg) {
              return <span className="text-slate-400">—</span>;
            }
            const cleanImgSrc = normImg.replace(/([?&])download=1(&|$)/i, '$1').replace(/[?&]+$/, '');
            const evPayload: ScraperCapturedEvidence = rowEv || {
              title: activeNode.title,
              imageUrl: cleanImgSrc,
              imageDownloadUrl: normImg,
            };
            return (
              <button
                type="button"
                onClick={() => handleOpenEvidencePreview(evPayload, 'image')}
                title="Ampliar imagen del certificado oficial en WAPPY"
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 text-[10.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer"
              >
                <img
                  src={cleanImgSrc}
                  alt="Miniatura certificado"
                  loading="lazy"
                  className="h-7 w-7 rounded object-cover border border-teal-500/30 bg-white shrink-0"
                />
                <span>🖼️ Ver Imagen</span>
              </button>
            );
          }

          // 2. Columna específica de PDF (`pdfUrl` / `pdfDownloadUrl`)
          if (lowerCol === 'pdfurl' || lowerCol === 'pdfdownloadurl') {
            const normPdf = normalizeEvidenceUrlForBrowser(
              typeof cellVal === 'string' ? cellVal : rowEv?.pdfUrl,
            );
            if (!normPdf) {
              return <span className="text-slate-400">—</span>;
            }
            const cleanPdfUrl = normPdf.replace(/([?&])download=1(&|$)/i, '$1').replace(/[?&]+$/, '');
            const dlPdfUrl =
              rowEv?.pdfDownloadUrl ||
              (cleanPdfUrl.includes('?') ? `${cleanPdfUrl}&download=1` : `${cleanPdfUrl}?download=1`);
            const evPayload: ScraperCapturedEvidence = rowEv || {
              title: activeNode.title,
              pdfUrl: cleanPdfUrl,
              pdfDownloadUrl: dlPdfUrl,
            };
            return (
              <div className="inline-flex items-center gap-1 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleOpenEvidencePreview(evPayload, 'pdf')}
                  title="Ver PDF oficial dentro del visor WAPPY"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[10.5px] font-extrabold transition-all cursor-pointer"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>📄 PDF</span>
                </button>
                <a
                  href={dlPdfUrl}
                  download={rowEv?.pdfFileName || true}
                  title="Descargar PDF oficial"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 text-[10.5px] font-extrabold no-underline transition-all"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span>Descargar</span>
                </a>
              </div>
            );
          }

          // 3. Columna combinada `certificado` / `soporte` o cualquier celda con URL `/evidencias/`
          if (isSmartEvidenceCell(row, col) && rowEv && (rowEv.imageUrl || rowEv.pdfUrl)) {
            const rawText = typeof cellVal === 'string' ? cellVal.trim() : '';
            const humanLabel = rawText
              .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
              .replace(/\[[^\]]*\]\([^)]+\)/g, '')
              .replace(/(?:https?:\/\/[^\s|]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^\s|]+/gi, '')
              .replace(/[|·]+/g, ' ')
              .trim();

            return (
              <div className="inline-flex items-center gap-1.5 flex-wrap">
                {humanLabel && (
                  <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 max-w-[150px] truncate" title={humanLabel}>
                    {humanLabel}
                  </span>
                )}
                {rowEv.imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleOpenEvidencePreview(rowEv, 'image')}
                    title="Ver imagen HD del certificado"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 text-[10.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer"
                  >
                    <img
                      src={rowEv.imageUrl}
                      alt="Certificado"
                      loading="lazy"
                      className="h-7 w-7 rounded object-cover border border-teal-500/30 bg-white shrink-0"
                    />
                    <span>🖼️ Ver Imagen</span>
                  </button>
                )}
                {rowEv.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => handleOpenEvidencePreview(rowEv, 'pdf')}
                    title="Abrir PDF en el visor WAPPY"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[10.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer"
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>📄 PDF</span>
                  </button>
                )}
                {(rowEv.pdfDownloadUrl || rowEv.pdfUrl) && (
                  <a
                    href={rowEv.pdfDownloadUrl || rowEv.pdfUrl || '#'}
                    download={rowEv.pdfFileName || true}
                    title="Descargar PDF oficial"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 text-[10.5px] font-extrabold no-underline transition-all whitespace-nowrap"
                  >
                    <Download className="w-3 h-3 shrink-0" />
                    <span>PDF</span>
                  </a>
                )}
              </div>
            );
          }

          // 4. Celda normal de texto/JSON
          const displayVal =
            cellVal === undefined || cellVal === null
              ? '—'
              : typeof cellVal === 'object'
                ? JSON.stringify(cellVal)
                : String(cellVal);
          return displayVal;
        };

        const buildSchemaFromItems = (
          items: Array<Record<string, any>>,
          query: string,
        ): Array<{
          key: string;
          typeLabel: string;
          badgeClass: string;
          sampleValue: string;
          exprToken: string;
        }> => {
          const keyOrder: string[] = [];
          const seen = new Set<string>();
          items.forEach((it) => {
            Object.keys(it || {}).forEach((k) => {
              if (!seen.has(k)) {
                seen.add(k);
                keyOrder.push(k);
              }
            });
          });
          const q = (query || '').trim().toLowerCase();
          return keyOrder
            .filter((k) => {
              if (!q) return true;
              const sample = items.find((it) => it?.[k] !== undefined && it?.[k] !== null)?.[k];
              return (
                k.toLowerCase().includes(q) ||
                String(sample ?? '')
                  .toLowerCase()
                  .includes(q)
              );
            })
            .map((key) => {
              const sampleRaw = items.find(
                (it) => it?.[key] !== undefined && it?.[key] !== null && String(it[key]).trim() !== '',
              )?.[key];
              let typeLabel = 'TEXTO';
              let badgeClass =
                'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300';
              if (typeof sampleRaw === 'number') {
                typeLabel = 'NÚMERO';
                badgeClass =
                  'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300';
              } else if (typeof sampleRaw === 'boolean') {
                typeLabel = 'BOOLEANO';
                badgeClass =
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
              } else if (Array.isArray(sampleRaw)) {
                typeLabel = 'LISTA';
                badgeClass =
                  'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300';
              } else if (sampleRaw && typeof sampleRaw === 'object') {
                typeLabel = 'OBJETO';
                badgeClass =
                  'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300';
              } else if (
                typeof sampleRaw === 'string' &&
                /^\d{4}-\d{2}-\d{2}/.test(sampleRaw.trim())
              ) {
                typeLabel = 'FECHA';
                badgeClass =
                  'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300';
              }
              const sampleValue =
                sampleRaw === undefined || sampleRaw === null
                  ? '—'
                  : typeof sampleRaw === 'object'
                    ? JSON.stringify(sampleRaw)
                    : String(sampleRaw);
              const exprToken = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
                ? `{{ $json.${key} }}`
                : `{{ $json["${key}"] }}`;
              return { key, typeLabel, badgeClass, sampleValue, exprToken };
            });
        };

        const inputSchemaFields = buildSchemaFromItems(resolvedInputItems, ndvInputSearch);
        const outputSchemaFields = buildSchemaFromItems(resolvedOutputItems, ndvOutputSearch);

        const handleCopyOrInsertExpression = (expr: string, fieldName: string) => {
          try {
            navigator.clipboard?.writeText(expr);
          } catch (_) {}
          setNdvCopiedExpr(expr);
          setTimeout(() => {
            setNdvCopiedExpr((prev) => (prev === expr ? null : prev));
          }, 2000);

          // Si es el Agente IA Principal o un Sub-Agente o tiene inputContext, permitir insertar el campo
          if (activeNode.key === 'agent_root' && onChangePrompt) {
            if (!prompt.includes(expr)) {
              onChangePrompt(`${prompt ? `${prompt.trim()}\n` : ''}Analizar campo ${fieldName}: ${expr}`);
            }
          } else {
            const prevInputCtx = currentCfg.inputContext || '';
            if (!prevInputCtx.includes(expr)) {
              handleUpdateNodeConfig(activeNode.key, {
                inputContext: `${prevInputCtx ? `${prevInputCtx.trim()} · ` : ''}Usar ${fieldName} (${expr})`,
              });
            }
          }
        };

        // ─── Modal Popup de 3 Columnas estilo n8n renderizado vía Portal ───
        const ndvModalPortal =
          typeof document !== 'undefined'
            ? createPortal(
                <div
                  className="fixed inset-0 z-[10020] bg-slate-950/75 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-150"
                  onClick={() => setActiveConfigNodeKey(null)}
                >
                  <div
                    className="flex flex-col flex-1 min-h-0 w-full max-w-[1920px] mx-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* ─── BARRA SUPERIOR DEL MODAL (`← Volver al Lienzo` + Breadcrumb de Pasos + `▶ Probar paso` + `✕ Cerrar`) ─── */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-lg shrink-0">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="emerald"
                          icon={<ArrowLeft className="w-3.5 h-3.5" />}
                          label="Volver al Lienzo"
                          title="Cerrar popup y volver al lienzo de flujo (Esc)"
                          onClick={() => setActiveConfigNodeKey(null)}
                        />

                        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        {/* Tira horizontal de pasos conectados estilo breadcrumb n8n con ExpandableButtons */}
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 max-w-[62vw]">
                          {connectedExecutionPlan.map((step) => {
                            const isCurrent = step.nodeKey === activeNode.key;
                            const stepDone = sandboxCompletedNodeKeys.includes(step.nodeKey);
                            return (
                              <ExpandableButton
                                key={`ndv_step_${step.nodeKey}`}
                                type="button"
                                size="sm"
                                variant={
                                  isCurrent
                                    ? 'purple'
                                    : stepDone
                                      ? 'emerald'
                                      : step.category === 'trigger'
                                        ? 'amber'
                                        : step.category === 'extractor'
                                          ? 'blue'
                                          : 'teal'
                                }
                                isActive={isCurrent}
                                icon={renderOfficialNodeSvg(step.nodeId, 'w-3.5 h-3.5')}
                                badge={`#${step.stepNumber}`}
                                label={`Paso #${step.stepNumber}: ${step.title}`}
                                title={`Saltar a Paso #${step.stepNumber}: ${step.title}`}
                                onClick={() => setActiveConfigNodeKey(step.nodeKey)}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {activeCompanyInfo?.companyName && (
                          <span className="hidden xl:inline-flex px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-[#C7F303] border border-emerald-500/30 items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {activeCompanyInfo.companyName}
                              {activeCompanyInfo.nit ? ` · NIT ${activeCompanyInfo.nit}` : ''}
                            </span>
                          </span>
                        )}

                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="emerald"
                          disabled={sandboxRunning}
                          icon={
                            sandboxRunning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )
                          }
                          label={
                            sandboxRunning ? 'Ejecutando...' : 'Probar paso (Test step)'
                          }
                          title="Ejecutar simulación y actualizar INPUT, OUTPUT y LOGS de este nodo en vivo"
                          onClick={handleRunSandboxSimulation}
                        />

                        <ExpandableButton
                          type="button"
                          size="sm"
                          variant="rose"
                          icon={<X className="w-3.5 h-3.5" />}
                          label="Cerrar"
                          title="Cerrar Inspector de Nodo (Esc)"
                          onClick={() => setActiveConfigNodeKey(null)}
                        />
                      </div>
                    </div>

                    {/* ─── CUERPO PRINCIPAL EN 3 COLUMNAS ESTILO n8n (`INPUT` | `CONFIGURACIÓN` | `OUTPUT / LOGS`) ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden mt-2.5">
                      {/* ════════════════════════════════════════════════════════════════════════
                          COLUMNA 1 (IZQUIERDA - lg:col-span-4): `📥 INPUT · LO QUE ENTRÓ AL NODO`
                         ════════════════════════════════════════════════════════════════════════ */}
                      <div className="lg:col-span-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-lg">
                        {/* Cabecera INPUT */}
                        <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 truncate">
                              📥 INPUT (ENTRADA AL NODO)
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                              {resolvedInputItems.length} ítems
                            </span>
                          </div>

                          {/* Botonera WAPPY de vistas de Entrada (`Schema` | `Tabla` | `JSON`) */}
                          <div className="flex items-center gap-1.5 py-0.5 px-0.5">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="violet"
                              isActive={ndvInputView === 'schema'}
                              icon={<Layers className="w-3.5 h-3.5" />}
                              badge={inputSchemaFields.length}
                              label="Schema"
                              title="Ver estructura de campos entrantes y variables {{ $json }}"
                              onClick={() => setNdvInputView('schema')}
                            />
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="sky"
                              isActive={ndvInputView === 'table'}
                              icon={<Table2 className="w-3.5 h-3.5" />}
                              badge={resolvedInputItems.length}
                              label="Tabla"
                              title="Ver datos que entraron al nodo en formato Tabla"
                              onClick={() => setNdvInputView('table')}
                            />
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="amber"
                              isActive={ndvInputView === 'json'}
                              icon={<Code2 className="w-3.5 h-3.5" />}
                              badge={resolvedInputItems.length}
                              label="JSON"
                              title="Ver payload JSON que entró al nodo"
                              onClick={() => setNdvInputView('json')}
                            />
                          </div>
                        </div>

                        {/* Sub-barra: Selector de Nodo Origen + Buscador */}
                        {!isTriggerNode && (
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-1.5 shrink-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 shrink-0">
                                📥 Viene de:
                              </span>
                              <select
                                value={ndvSelectedUpstreamKey}
                                onChange={(e) => setNdvSelectedUpstreamKey(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                              >
                                <option value="auto">
                                  ⚡ Automático (
                                  {defaultUpstreamNode
                                    ? `${
                                        stepNumberByNodeKey.get(defaultUpstreamNode.key)
                                          ? `Paso #${stepNumberByNodeKey.get(defaultUpstreamNode.key)} · `
                                          : ''
                                      }${defaultUpstreamNode.title}`
                                    : resolvedInputSourceTitle}
                                  )
                                </option>
                                {upstreamCandidates.length > 1 && (
                                  <option value="all_connected">
                                    🔗 Todos los nodos conectados ({upstreamCandidates.length} nodos)
                                  </option>
                                )}
                                {upstreamCandidates.map((upNode) => {
                                  const stNum = stepNumberByNodeKey.get(upNode.key);
                                  return (
                                    <option key={`up_opt_${upNode.key}`} value={upNode.key}>
                                      {stNum ? `Paso #${stNum} · ` : ''}
                                      {upNode.title} ({upNode.subtitle})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={ndvInputSearch}
                                onChange={(e) => setNdvInputSearch(e.target.value)}
                                placeholder="🔍 Filtrar campos o valores de entrada..."
                                className="w-full pl-8 pr-7 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                              />
                              {ndvInputSearch && (
                                <button
                                  type="button"
                                  onClick={() => setNdvInputSearch('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Contenido con scroll de INPUT */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                          {isTriggerNode ? (
                            <div className="rounded-2xl border border-dashed border-amber-400/70 dark:border-amber-600/60 bg-amber-500/5 p-4 text-center space-y-3 my-2">
                              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                                <Zap className="w-5 h-5 fill-current" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  ⚡ Este nodo es un Disparador (inicio del flujo): no recibe datos de entrada previos.
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Al ejecutarse, este nodo inicia la cadena y entrega su contexto al{' '}
                                  <strong>Paso #2</strong> en el panel derecho (<strong>OUTPUT</strong>).
                                </p>
                              </div>

                              {/* Pestaña desplegable con el payload inicial del Disparador */}
                              <div className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setNdvExpandedSchemaGroup((v) => !v)}
                                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60"
                                >
                                  <span className="flex items-center gap-1.5">
                                    {ndvExpandedSchemaGroup ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                                    )}
                                    Contexto de Disparo Inicial
                                  </span>
                                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                                    Paso #1
                                  </span>
                                </button>
                                {ndvExpandedSchemaGroup && (
                                  <div className="p-2.5 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                                    <div>
                                      <strong>Disparador:</strong> {activeNode.title} ({activeNode.subtitle})
                                    </div>
                                    <div>
                                      <strong>Empresa Activa:</strong>{' '}
                                      {activeCompanyInfo?.companyName || 'Empresa Activa'}{' '}
                                      {activeCompanyInfo?.nit ? `(NIT ${activeCompanyInfo.nit})` : ''}
                                    </div>
                                    <div>
                                      <strong>Entrada simulada:</strong>{' '}
                                      {mockTriggerInput?.trim() || 'Ejecución automática por programación'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : filteredInputItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-center space-y-2.5 my-2">
                              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                                📭 Sin registros de entrada para mostrar
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Haz clic en <strong>«Probar paso»</strong> arriba a la derecha para ejecutar el flujo y ver exactamente qué datos entran desde{' '}
                                <strong>{resolvedInputSourceTitle}</strong>.
                              </p>
                            </div>
                          ) : ndvInputView === 'schema' ? (
                            /* ─── VISTA 1 DE INPUT: SCHEMA (Pestaña desplegable estilo n8n con píldoras {{ $json.campo }}) ─── */
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setNdvExpandedSchemaGroup((v) => !v)}
                                className="w-full px-3 py-2 flex items-center justify-between bg-slate-100/80 dark:bg-slate-800/80 text-left"
                              >
                                <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 dark:text-slate-100">
                                  {ndvExpandedSchemaGroup ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-purple-600 dark:text-[#C7F303]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-purple-600 dark:text-[#C7F303]" />
                                  )}
                                  📥 {resolvedInputSourceTitle}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                                  {inputSchemaFields.length} campos · {resolvedInputItems.length} ítems
                                </span>
                              </button>

                              {ndvExpandedSchemaGroup && (
                                <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80 p-2 space-y-1.5">
                                  {inputSchemaFields.map((field) => {
                                    const isCopied = ndvCopiedExpr === field.exprToken;
                                    return (
                                      <div
                                        key={`in_schema_${field.key}`}
                                        className="pt-1.5 first:pt-0 flex flex-col gap-1 rounded-lg p-1.5 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                                      >
                                        <div className="flex items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span
                                              className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase shrink-0 ${field.badgeClass}`}
                                            >
                                              {field.typeLabel}
                                            </span>
                                            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                              {field.key}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCopyOrInsertExpression(field.exprToken, field.key)
                                            }
                                            title="Haz clic para copiar e insertar esta variable de entrada en el nodo"
                                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all shrink-0 flex items-center gap-1 ${
                                              isCopied
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20'
                                            }`}
                                          >
                                            <Copy className="w-2.5 h-2.5" />
                                            {isCopied ? '¡Copiado!' : field.exprToken}
                                          </button>
                                        </div>
                                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate pl-1">
                                          Ej: <span className="font-semibold text-slate-700 dark:text-slate-300">{field.sampleValue}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : ndvInputView === 'table' ? (
                            /* ─── VISTA 2 DE INPUT: TABLA LIMPIA CON BORDES REDONDEADOS ─── */
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                                      <th className="py-2 px-2.5 font-black text-[10px] uppercase tracking-wider w-9">
                                        #
                                      </th>
                                      {inputTableCols.map((col) => (
                                        <th
                                          key={`in_th_${col}`}
                                          className="py-2 px-2.5 font-black text-[10px] uppercase tracking-wider whitespace-nowrap"
                                        >
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredInputItems.map((row, rIdx) => (
                                      <tr
                                        key={`in_tr_${rIdx}`}
                                        className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors"
                                      >
                                        <td className="py-1.5 px-2.5 font-black text-slate-400 align-middle">
                                          {rIdx + 1}
                                        </td>
                                        {inputTableCols.map((col) => {
                                          const isEvCell = isSmartEvidenceCell(row, col);
                                          const cellVal = row?.[col];
                                          const rawTitle =
                                            isEvCell || cellVal === undefined || cellVal === null
                                              ? undefined
                                              : typeof cellVal === 'object'
                                                ? JSON.stringify(cellVal)
                                                : String(cellVal);
                                          return (
                                            <td
                                              key={`in_td_${rIdx}_${col}`}
                                              className={
                                                isEvCell
                                                  ? 'py-1.5 px-2.5 align-middle whitespace-nowrap'
                                                  : 'py-1.5 px-2.5 text-slate-700 dark:text-slate-200 font-medium max-w-[220px] truncate align-middle'
                                              }
                                              title={rawTitle}
                                            >
                                              {renderNdvSmartCell(row, col)}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            /* ─── VISTA 3 DE INPUT: JSON CON PESTAÑAS DESPLEGABLES POR ITEM (`▼ Item #1`...) ─── */
                            <div className="space-y-2">
                              {filteredInputItems.map((item, idx) => {
                                const isExpanded = Boolean(ndvExpandedInputItems[idx]);
                                const itemTitle =
                                  item['Nombre Completo'] ||
                                  item['Registro'] ||
                                  item['Disparador'] ||
                                  item['AgenteIA'] ||
                                  item['Nodo'] ||
                                  Object.values(item)[0] ||
                                  `Item #${idx + 1}`;
                                return (
                                  <div
                                    key={`in_json_item_${idx}`}
                                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setNdvExpandedInputItems((prev) => ({
                                          ...prev,
                                          [idx]: !prev[idx],
                                        }))
                                      }
                                      className="w-full px-3 py-1.5 flex items-center justify-between text-left bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                        {isExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        )}
                                        <span className="text-amber-600 dark:text-amber-400">
                                          Item #{idx + 1}:
                                        </span>
                                        <span className="truncate">{String(itemTitle)}</span>
                                      </span>
                                      <span className="text-[9.5px] font-bold text-slate-400 shrink-0 ml-2">
                                        {Object.keys(item || {}).length} claves
                                      </span>
                                    </button>
                                    {isExpanded && (
                                      <pre className="p-2.5 text-[10.5px] font-mono text-slate-700 dark:text-slate-200 overflow-x-auto leading-relaxed">
                                        {JSON.stringify(item, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ════════════════════════════════════════════════════════════════════════
                          COLUMNA 2 (CENTRO ELEVADO - lg:col-span-4): `⚙️ CONFIGURACIÓN DEL NODO`
                         ════════════════════════════════════════════════════════════════════════ */}
                      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-2 border-purple-500 dark:border-[#C7F303] rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-2xl ring-4 ring-purple-500/10 dark:ring-[#C7F303]/10">
                        {/* Cabecera del Nodo Activo estilo Popup Central n8n */}
                        <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-transparent to-emerald-500/10 flex items-center justify-between gap-2 shrink-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                              {renderOfficialNodeSvg(activeNode.nodeId, 'w-6 h-6')}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-[#C7F303] truncate">
                                  {activeNode.title}
                                </span>
                                {activeStepNum !== undefined ? (
                                  <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-slate-900 dark:bg-[#C7F303] text-[#C7F303] dark:text-[#0E1300]">
                                    Paso #{activeStepNum}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    ⚪ Sin conectar
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                {activeNode.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 py-0.5 px-0.5">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="orange"
                              disabled={sandboxRunning}
                              icon={
                                sandboxRunning ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                )
                              }
                              label="Probar paso"
                              title="Probar este paso y refrescar INPUT / OUTPUT / LOGS"
                              onClick={handleRunSandboxSimulation}
                            />
                          </div>
                        </div>

                        {/* Sub-barra de pestañas del Nodo Central (`Parámetros` | `Ajustes`) con ExpandableButtons */}
                        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-2 shrink-0">
                          <div className="flex items-center gap-2 py-0.5 px-0.5">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="purple"
                              isActive={ndvCenterTab === 'parameters'}
                              icon={<Sliders className="w-3.5 h-3.5" />}
                              badge={
                                Array.isArray(currentCfg.fields) && currentCfg.fields.length > 0
                                  ? currentCfg.fields.length
                                  : undefined
                              }
                              label="Parámetros"
                              title="Editar campos quirúrgicos, prompts, filtros y parámetros operativos del nodo"
                              onClick={() => setNdvCenterTab('parameters')}
                            />
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="teal"
                              isActive={ndvCenterTab === 'settings'}
                              icon={<Settings2 className="w-3.5 h-3.5" />}
                              label="Ajustes"
                              title="Configurar Modo Antigravity, Contexto de Entrada/Salida e Instrucciones técnicas"
                              onClick={() => setNdvCenterTab('settings')}
                            />
                          </div>

                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">
                            {ndvCenterTab === 'parameters'
                              ? 'Edición en vivo → actualiza OUTPUT'
                              : 'Ajustes avanzados del nodo'}
                          </span>
                        </div>

                        {/* Cuerpo con scroll de CONFIGURACIÓN DEL NODO */}
                        <div className="flex-1 overflow-y-auto p-3.5">
                          {ndvCenterTab === 'parameters' ? (
                            <WappyNodeCustomEditor
                              activeNode={activeNode}
                              currentCfg={currentCfg}
                              onUpdateNodeConfig={handleUpdateNodeConfig}
                              activeCompanyInfo={activeCompanyInfo}
                              agentId={agentId}
                              onSelectAgent={onSelectAgent}
                              availableAgentsWithTenshiAvatar={availableAgentsWithTenshiAvatar}
                              aiEngine={aiEngine}
                              aiModel={aiModel}
                              onSelectAiEngineModel={handleSelectAiEngineModel}
                              prompt={prompt}
                              onChangePrompt={onChangePrompt}
                              onAutoBuildPrompt={onAutoBuildPrompt}
                              extraAgentObj={extraAgentObj}
                              onUpdateExtraAgent={handleUpdateExtraAgent}
                              customNodeObj={customNodeObj}
                              scheduleType={scheduleType}
                              onChangeScheduleType={onChangeScheduleType}
                              hour={hour}
                              onChangeHour={onChangeHour}
                              minute={minute}
                              onChangeMinute={onChangeMinute}
                              daysOfWeek={daysOfWeek}
                              onChangeDaysOfWeek={onChangeDaysOfWeek}
                              dayOfMonth={dayOfMonth}
                              onChangeDayOfMonth={onChangeDayOfMonth}
                              intervalHours={intervalHours}
                              onChangeIntervalHours={onChangeIntervalHours}
                              emailsStr={emailsStr}
                              onChangeEmailsStr={onChangeEmailsStr}
                              antigravityStatus={antigravityStatus}
                              nodeLiveInspectorData={nodeLiveInspectorData}
                              nodeReportHistory={nodeReportHistory}
                              onPreviewNodeReport={handlePreviewNodeReport}
                              onCloseReportPreview={() =>
                                setNodeReportHistory((prev) => ({
                                  ...prev,
                                  previewConvId: null,
                                  previewTitle: null,
                                  previewText: null,
                                }))
                              }
                              resolveRecordSurgicalPreview={resolveRecordSurgicalPreview}
                            />
                          ) : (
                            /* ─── PESTAÑA `AJUSTES` CON SECCIONES DESPLEGABLES (ACCORDIONS) ─── */
                            <div className="space-y-3">
                              {/* Accordion 1: Modo de Ejecución Google Antigravity */}
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNdvExpandedSettingsSections((prev) => ({
                                      ...prev,
                                      antigravity: !prev.antigravity,
                                    }))
                                  }
                                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left bg-slate-100/80 dark:bg-slate-800/80"
                                >
                                  <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                                    {ndvExpandedSettingsSections.antigravity ? (
                                      <ChevronDown className="w-4 h-4 text-teal-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-teal-500" />
                                    )}
                                    🛰️ Modo de Ejecución Google Antigravity
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-teal-500/15 text-teal-700 dark:text-teal-300">
                                    {currentCfg.antigravityMode || 'auto'}
                                  </span>
                                </button>
                                {ndvExpandedSettingsSections.antigravity && (
                                  <div className="p-3 space-y-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Elige cómo debe ejecutarse este nodo cuando requiera herramientas de Google Antigravity:
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 py-0.5">
                                      {[
                                        {
                                          id: 'auto' as const,
                                          label: 'Automático (Smart)',
                                          variant: 'emerald' as const,
                                        },
                                        {
                                          id: 'local' as const,
                                          label: 'AGY Local (Mac/PC)',
                                          variant: 'amber' as const,
                                        },
                                        {
                                          id: 'cloud' as const,
                                          label: 'AGY Cloud 24/7',
                                          variant: 'cyan' as const,
                                        },
                                      ].map((modeOpt) => (
                                        <ExpandableButton
                                          key={`agy_mode_${modeOpt.id}`}
                                          type="button"
                                          size="sm"
                                          variant={modeOpt.variant}
                                          isActive={
                                            (currentCfg.antigravityMode || 'auto') === modeOpt.id
                                          }
                                          icon={<Cpu className="w-3.5 h-3.5" />}
                                          label={modeOpt.label}
                                          onClick={() =>
                                            handleUpdateNodeConfig(activeNode.key, {
                                              antigravityMode: modeOpt.id,
                                            })
                                          }
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Accordion 2: Contexto de Entrada y Salida del Nodo */}
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNdvExpandedSettingsSections((prev) => ({
                                      ...prev,
                                      context: !prev.context,
                                    }))
                                  }
                                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left bg-slate-100/80 dark:bg-slate-800/80"
                                >
                                  <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                                    {ndvExpandedSettingsSections.context ? (
                                      <ChevronDown className="w-4 h-4 text-purple-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-purple-500" />
                                    )}
                                    🔄 Contexto de Entrada y Salida entre Nodos
                                  </span>
                                </button>
                                {ndvExpandedSettingsSections.context && (
                                  <div className="p-3 space-y-2.5">
                                    <div>
                                      <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                                        📥 Contexto de Entrada (`inputContext`)
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={currentCfg.inputContext || ''}
                                        onChange={(e) =>
                                          handleUpdateNodeConfig(activeNode.key, {
                                            inputContext: e.target.value,
                                          })
                                        }
                                        placeholder="Describe cómo debe interpretar este nodo los datos que le entran del paso anterior..."
                                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                                        📤 Contexto de Salida (`outputContext`)
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={currentCfg.outputContext || ''}
                                        onChange={(e) =>
                                          handleUpdateNodeConfig(activeNode.key, {
                                            outputContext: e.target.value,
                                          })
                                        }
                                        placeholder="Describe qué estructura o resumen debe entregar este nodo al siguiente paso..."
                                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Accordion 3: Instrucción Personalizada */}
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNdvExpandedSettingsSections((prev) => ({
                                      ...prev,
                                      instruction: !prev.instruction,
                                    }))
                                  }
                                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left bg-slate-100/80 dark:bg-slate-800/80"
                                >
                                  <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                                    {ndvExpandedSettingsSections.instruction ? (
                                      <ChevronDown className="w-4 h-4 text-amber-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-amber-500" />
                                    )}
                                    ⚡ Instrucción / Regla Específica del Nodo (`customInstruction`)
                                  </span>
                                </button>
                                {ndvExpandedSettingsSections.instruction && (
                                  <div className="p-3">
                                    <textarea
                                      rows={3}
                                      value={currentCfg.customInstruction || ''}
                                      onChange={(e) =>
                                        handleUpdateNodeConfig(activeNode.key, {
                                          customInstruction: e.target.value,
                                        })
                                      }
                                      placeholder="Instrucción adicional o guardrail exclusivo para este paso..."
                                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Accordion 4: Identificadores Técnicos */}
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNdvExpandedSettingsSections((prev) => ({
                                      ...prev,
                                      technical: !prev.technical,
                                    }))
                                  }
                                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left bg-slate-100/80 dark:bg-slate-800/80"
                                >
                                  <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                                    {ndvExpandedSettingsSections.technical ? (
                                      <ChevronDown className="w-4 h-4 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-500" />
                                    )}
                                    🔧 Metadatos Técnicos del Nodo
                                  </span>
                                </button>
                                {ndvExpandedSettingsSections.technical && (
                                  <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
                                    <div>nodeKey: {activeNode.key}</div>
                                    <div>nodeId: {activeNode.nodeId}</div>
                                    <div>shape: {activeNode.shape}</div>
                                    <div>
                                      stepNumber:{' '}
                                      {activeStepNum !== undefined ? `#${activeStepNum}` : 'Desconectado'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ════════════════════════════════════════════════════════════════════════
                          COLUMNA 3 (DERECHA - lg:col-span-4): `📤 OUTPUT (LO QUE ENVIÓ)` + `📜 LOGS / ERRORES`
                         ════════════════════════════════════════════════════════════════════════ */}
                      <div className="lg:col-span-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-lg">
                        {/* Cabecera Principal con las 2 Pestañas solicitadas por el usuario (`📤 Salida` | `📜 Logs / Errores`) */}
                        <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
                          <div className="flex items-center gap-2 py-0.5 px-0.5">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="emerald"
                              isActive={ndvOutputTab === 'output'}
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              badge={resolvedOutputItems.length}
                              label="📤 Salida (Lo que envió)"
                              title="Ver los registros y campos exactos que este nodo envía al siguiente paso"
                              onClick={() => setNdvOutputTab('output')}
                            />
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant={hasNodeErrors ? 'rose' : 'amber'}
                              isActive={ndvOutputTab === 'logs'}
                              icon={<AlertTriangle className="w-3.5 h-3.5" />}
                              badge={resolvedNodeLogs.length}
                              label="📜 Logs / Errores"
                              title="Ver la bitácora técnica paso a paso y posibles errores del nodo"
                              onClick={() => setNdvOutputTab('logs')}
                            />
                          </div>

                          {/* Indicador de estado rápido */}
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                              hasNodeErrors
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                                : traceStep
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
                            }`}
                          >
                            {hasNodeErrors
                              ? '❌ Error'
                              : traceStep
                                ? `✓ ${traceStep.durationMs || 0} ms`
                                : '⚡ En Vivo'}
                          </span>
                        </div>

                        {ndvOutputTab === 'output' ? (
                          <>
                            {/* Sub-barra de vista de Salida (`Tabla` | `JSON` | `Schema` | `Informe`) + Buscador */}
                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-1.5 shrink-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 py-0.5 px-0.5">
                                  <ExpandableButton
                                    type="button"
                                    size="sm"
                                    variant="emerald"
                                    isActive={ndvOutputView === 'table'}
                                    icon={<Table2 className="w-3.5 h-3.5" />}
                                    badge={resolvedOutputItems.length}
                                    label="Tabla"
                                    title="Ver salida enviada en formato Tabla"
                                    onClick={() => setNdvOutputView('table')}
                                  />
                                  <ExpandableButton
                                    type="button"
                                    size="sm"
                                    variant="amber"
                                    isActive={ndvOutputView === 'json'}
                                    icon={<Code2 className="w-3.5 h-3.5" />}
                                    badge={resolvedOutputItems.length}
                                    label="JSON"
                                    title="Ver salida enviada en formato JSON desplegable"
                                    onClick={() => setNdvOutputView('json')}
                                  />
                                  <ExpandableButton
                                    type="button"
                                    size="sm"
                                    variant="violet"
                                    isActive={ndvOutputView === 'schema'}
                                    icon={<Layers className="w-3.5 h-3.5" />}
                                    badge={outputSchemaFields.length}
                                    label="Schema"
                                    title="Ver esquema de campos enviados por este nodo"
                                    onClick={() => setNdvOutputView('schema')}
                                  />
                                  <ExpandableButton
                                    type="button"
                                    size="sm"
                                    variant="cyan"
                                    isActive={ndvOutputView === 'markdown'}
                                    icon={<FileText className="w-3.5 h-3.5" />}
                                    label="Informe"
                                    title="Ver vista previa textual / Markdown de la salida"
                                    onClick={() => setNdvOutputView('markdown')}
                                  />
                                </div>

                                {Array.isArray(currentCfg.fields) && currentCfg.fields.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[9.5px] font-extrabold text-purple-700 dark:text-[#C7F303]">
                                    🎯 {currentCfg.fields.length} campo(s) quirúrgico(s)
                                  </span>
                                )}
                              </div>

                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  value={ndvOutputSearch}
                                  onChange={(e) => setNdvOutputSearch(e.target.value)}
                                  placeholder="🔍 Filtrar salida enviada..."
                                  className="w-full pl-8 pr-7 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                                />
                                {ndvOutputSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setNdvOutputSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Contenido con scroll de OUTPUT */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                              {/* Franja superior desplegable con los certificados/evidencias capturados por este nodo */}
                              {activeNodeEvidences.length > 0 && (
                                <div className="rounded-xl border border-teal-500/35 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setNdvEvidenceStripOpen((v) => !v)}
                                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-teal-500/10 transition-colors"
                                  >
                                    <span className="flex items-center gap-1.5 text-[11px] font-black text-teal-800 dark:text-teal-200 min-w-0 truncate">
                                      {ndvEvidenceStripOpen ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300 shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300 shrink-0" />
                                      )}
                                      <span className="truncate">
                                        📎 Certificados y Evidencias Capturadas ({activeNodeEvidences.length})
                                      </span>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shrink-0">
                                      PDF / Imagen HD
                                    </span>
                                  </button>

                                  {ndvEvidenceStripOpen && (
                                    <div className="p-2.5 pt-1 grid grid-cols-1 gap-2 border-t border-teal-500/20">
                                      {activeNodeEvidences.map((ev, evIdx) => {
                                        const workerLabel =
                                          ev.workerName?.trim() ||
                                          ev.title?.trim() ||
                                          `Certificado #${evIdx + 1}`;
                                        return (
                                          <div
                                            key={`ndv_ev_${evIdx}_${ev.pdfUrl || ev.imageUrl || evIdx}`}
                                            className="rounded-xl border border-teal-500/25 bg-white/90 dark:bg-slate-900/90 p-2 flex items-center justify-between gap-2.5 min-w-0"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              {ev.imageUrl ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenEvidencePreview(ev, 'image')
                                                  }
                                                  title="Ampliar certificado HD"
                                                  className="shrink-0 rounded-lg overflow-hidden border border-teal-500/30 bg-white hover:ring-2 hover:ring-teal-500/40 transition-all cursor-zoom-in"
                                                >
                                                  <img
                                                    src={ev.imageUrl}
                                                    alt={workerLabel}
                                                    loading="lazy"
                                                    className="h-10 w-14 object-cover"
                                                  />
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenEvidencePreview(ev, 'pdf')
                                                  }
                                                  title="Abrir visor PDF"
                                                  className="h-10 w-12 shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center cursor-pointer hover:bg-cyan-500/20 transition-all"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                </button>
                                              )}
                                              <div className="min-w-0">
                                                <div className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                                                  {workerLabel}
                                                </div>
                                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                                  {[
                                                    ev.cedula ? `CC ${ev.cedula}` : '',
                                                    ev.portal || '',
                                                  ]
                                                    .filter(Boolean)
                                                    .join(' · ') || ev.title || 'Soporte oficial'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOpenEvidencePreview(
                                                    ev,
                                                    ev.imageUrl ? 'image' : 'pdf',
                                                  )
                                                }
                                                title="Abrir Certificado en Lightbox"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 text-[10px] font-extrabold transition-all cursor-pointer"
                                              >
                                                <Eye className="w-3 h-3 shrink-0" />
                                                <span>Ver</span>
                                              </button>
                                              {ev.pdfUrl && (
                                                <a
                                                  href={ev.pdfUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title="Abrir PDF en pestaña nueva"
                                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[10px] font-extrabold no-underline transition-all"
                                                >
                                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                                  <span>PDF</span>
                                                </a>
                                              )}
                                              {(ev.pdfDownloadUrl || ev.pdfUrl) && (
                                                <a
                                                  href={ev.pdfDownloadUrl || ev.pdfUrl || '#'}
                                                  download={ev.pdfFileName || true}
                                                  title="Descargar PDF Oficial"
                                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 text-[10px] font-extrabold no-underline transition-all"
                                                >
                                                  <Download className="w-3 h-3 shrink-0" />
                                                  <span>Descargar</span>
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {ndvOutputView === 'markdown' ? (
                                <div
                                  onClick={(e) =>
                                    handleEvidenceContainerClick(
                                      e,
                                      [...activeNodeEvidences, ...allKnownEvidences],
                                      handleOpenEvidencePreview,
                                    )
                                  }
                                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium overflow-x-auto break-words"
                                  dangerouslySetInnerHTML={{
                                    __html: renderWorkflowMarkdownToInteractiveHtml(
                                      resolvedOutputPreview || '',
                                    ),
                                  }}
                                />
                              ) : filteredOutputItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-center space-y-2 my-2">
                                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                                    📭 Sin registros de salida con el filtro actual
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Ajusta los campos seleccionados en el panel central o haz clic en{' '}
                                    <strong>«Probar paso»</strong>.
                                  </p>
                                </div>
                              ) : ndvOutputView === 'table' ? (
                                /* ─── VISTA 1 DE OUTPUT: TABLA EN TIEMPO REAL ─── */
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-[11px]">
                                      <thead>
                                        <tr className="bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                                          <th className="py-2 px-2.5 font-black text-[10px] uppercase tracking-wider w-9">
                                            #
                                          </th>
                                          {outputTableCols.map((col) => (
                                            <th
                                              key={`out_th_${col}`}
                                              className="py-2 px-2.5 font-black text-[10px] uppercase tracking-wider whitespace-nowrap"
                                            >
                                              {col}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredOutputItems.map((row, rIdx) => (
                                          <tr
                                            key={`out_tr_${rIdx}`}
                                            className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                                          >
                                            <td className="py-1.5 px-2.5 font-black text-slate-400 align-middle">
                                              {rIdx + 1}
                                            </td>
                                            {outputTableCols.map((col) => {
                                              const isEvCell = isSmartEvidenceCell(row, col);
                                              const cellVal = row?.[col];
                                              const rawTitle =
                                                isEvCell || cellVal === undefined || cellVal === null
                                                  ? undefined
                                                  : typeof cellVal === 'object'
                                                    ? JSON.stringify(cellVal)
                                                    : String(cellVal);
                                              return (
                                                <td
                                                  key={`out_td_${rIdx}_${col}`}
                                                  className={
                                                    isEvCell
                                                      ? 'py-1.5 px-2.5 align-middle whitespace-nowrap'
                                                      : 'py-1.5 px-2.5 text-slate-700 dark:text-slate-200 font-medium max-w-[220px] truncate align-middle'
                                                  }
                                                  title={rawTitle}
                                                >
                                                  {renderNdvSmartCell(row, col)}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : ndvOutputView === 'schema' ? (
                                /* ─── VISTA 2 DE OUTPUT: SCHEMA DESPLEGABLE ─── */
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setNdvExpandedOutputSchemaGroup((v) => !v)}
                                    className="w-full px-3 py-2 flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/40 text-left"
                                  >
                                    <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-900 dark:text-emerald-200">
                                      {ndvExpandedOutputSchemaGroup ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                                      )}
                                      📤 Esquema Enviado por «{activeNode.title}»
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                                      {outputSchemaFields.length} campos
                                    </span>
                                  </button>

                                  {ndvExpandedOutputSchemaGroup && (
                                    <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80 p-2 space-y-1.5">
                                      {outputSchemaFields.map((field) => {
                                        const isCopied = ndvCopiedExpr === field.exprToken;
                                        return (
                                          <div
                                            key={`out_schema_${field.key}`}
                                            className="pt-1.5 first:pt-0 flex flex-col gap-1 rounded-lg p-1.5 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                                          >
                                            <div className="flex items-center justify-between gap-1.5">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                  className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase shrink-0 ${field.badgeClass}`}
                                                >
                                                  {field.typeLabel}
                                                </span>
                                                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                                  {field.key}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  try {
                                                    navigator.clipboard?.writeText(field.exprToken);
                                                  } catch (_) {}
                                                  setNdvCopiedExpr(field.exprToken);
                                                  setTimeout(() => setNdvCopiedExpr(null), 2000);
                                                }}
                                                className="px-2 py-0.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-500/20 flex items-center gap-1"
                                              >
                                                <Copy className="w-2.5 h-2.5" />
                                                {isCopied ? '¡Copiado!' : field.exprToken}
                                              </button>
                                            </div>
                                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate pl-1">
                                              Valor enviado:{' '}
                                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {field.sampleValue}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* ─── VISTA 3 DE OUTPUT: JSON CON PESTAÑAS DESPLEGABLES POR ITEM ─── */
                                <div className="space-y-2">
                                  {filteredOutputItems.map((item, idx) => {
                                    const isExpanded = Boolean(ndvExpandedOutputItems[idx]);
                                    const itemTitle =
                                      item['Nombre Completo'] ||
                                      item['Registro'] ||
                                      item['Disparador'] ||
                                      item['AgenteIA'] ||
                                      item['Nodo'] ||
                                      Object.values(item)[0] ||
                                      `Item #${idx + 1}`;
                                    return (
                                      <div
                                        key={`out_json_item_${idx}`}
                                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setNdvExpandedOutputItems((prev) => ({
                                              ...prev,
                                              [idx]: !prev[idx],
                                            }))
                                          }
                                          className="w-full px-3 py-1.5 flex items-center justify-between text-left bg-emerald-500/10 dark:bg-emerald-950/30 hover:bg-emerald-500/20 transition-colors"
                                        >
                                          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                            {isExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            )}
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                              Salida #{idx + 1}:
                                            </span>
                                            <span className="truncate">{String(itemTitle)}</span>
                                          </span>
                                          <span className="text-[9.5px] font-bold text-slate-400 shrink-0 ml-2">
                                            {Object.keys(item || {}).length} campos
                                          </span>
                                        </button>
                                        {isExpanded && (
                                          <pre className="p-2.5 text-[10.5px] font-mono text-slate-700 dark:text-slate-200 overflow-x-auto leading-relaxed">
                                            {JSON.stringify(item, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          /* ─── PESTAÑA 2 DE COLUMNA DERECHA: `📜 LOGS / ERRORES` (Con Pestañas Desplegables) ─── */
                          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                            {/* Tarjeta Resumen de Estado del Nodo */}
                            <div
                              className={`rounded-2xl border p-3 space-y-1.5 ${
                                hasNodeErrors
                                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
                                  : traceStep
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                  {hasNodeErrors ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                      ❌ Error Detectado en el Nodo
                                    </>
                                  ) : traceStep ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      ✅ Ejecución Exitosa del Nodo
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                      ⏳ Listo para Ejecutar Prueba
                                    </>
                                  )}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-black/10 dark:bg-white/10">
                                  {traceStep ? `${traceStep.durationMs || 0} ms` : 'Modo Inspector'}
                                </span>
                              </div>
                              <div className="text-[11px] opacity-90 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  <strong>Motor:</strong>{' '}
                                  {currentCfg.antigravityMode
                                    ? `Antigravity (${currentCfg.antigravityMode})`
                                    : aiEngine === 'antigravity_cloud'
                                      ? 'AGY Cloud 24/7'
                                      : aiEngine === 'antigravity'
                                        ? 'AGY Local PC'
                                        : `WAPPY (${aiModel})`}
                                </span>
                                <span>
                                  <strong>Entrada:</strong> {resolvedInputItems.length} ítem(s)
                                </span>
                                <span>
                                  <strong>Salida:</strong> {resolvedOutputItems.length} ítem(s)
                                </span>
                              </div>
                            </div>

                            {/* Lista de Pestañas Desplegables (Accordions) por cada evento de Log / Error */}
                            <div className="space-y-2">
                              {resolvedNodeLogs.map((logItem, lIdx) => {
                                const isLogOpen =
                                  ndvExpandedLogItems[lIdx] !== undefined
                                    ? ndvExpandedLogItems[lIdx]
                                    : true;
                                const levelStyles =
                                  logItem.level === 'error'
                                    ? {
                                        card: 'border-rose-500/40 bg-rose-500/5',
                                        header:
                                          'bg-rose-500/15 text-rose-800 dark:text-rose-200 hover:bg-rose-500/20',
                                        badge:
                                          'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300',
                                        label: 'ERROR',
                                      }
                                    : logItem.level === 'warn'
                                      ? {
                                          card: 'border-amber-500/40 bg-amber-500/5',
                                          header:
                                            'bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20',
                                          badge:
                                            'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300',
                                          label: 'AVISO',
                                        }
                                      : logItem.level === 'success'
                                        ? {
                                            card: 'border-emerald-500/30 bg-emerald-500/5',
                                            header:
                                              'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20',
                                            badge:
                                              'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
                                            label: 'OK',
                                          }
                                        : {
                                            card: 'border-sky-500/30 bg-sky-500/5',
                                            header:
                                              'bg-sky-500/10 text-sky-800 dark:text-sky-200 hover:bg-sky-500/20',
                                            badge:
                                              'bg-sky-500/20 border-sky-500/40 text-sky-700 dark:text-sky-300',
                                            label: 'INFO',
                                          };

                                return (
                                  <div
                                    key={`node_log_${lIdx}`}
                                    className={`rounded-xl border overflow-hidden transition-colors ${levelStyles.card}`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setNdvExpandedLogItems((prev) => ({
                                          ...prev,
                                          [lIdx]: !isLogOpen,
                                        }))
                                      }
                                      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors ${levelStyles.header}`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isLogOpen ? (
                                          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                                        )}
                                        <span
                                          className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase shrink-0 ${levelStyles.badge}`}
                                        >
                                          {levelStyles.label}
                                        </span>
                                        <span className="text-[11px] font-extrabold truncate">
                                          {logItem.message}
                                        </span>
                                      </div>
                                      {logItem.timestamp && (
                                        <span className="text-[9.5px] font-mono opacity-75 shrink-0">
                                          {logItem.timestamp}
                                        </span>
                                      )}
                                    </button>
                                    {isLogOpen && logItem.detail && (
                                      <div className="p-2.5 text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border-t border-slate-200/50 dark:border-slate-800/60">
                                        {logItem.detail}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null;

        return (
          <>
            {quickInspectorBar}
            {ndvModalPortal}
          </>
        );
      })()}

      {/* ─── VISOR LIGHTBOX MODAL DE CERTIFICADO / EVIDENCIA OFICIAL (IMAGEN HD + VISOR PDF EMBEBIDO) ─── */}
      {previewEvidence &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="wappy-evidence-lightbox-modal"
            role="dialog"
            aria-modal="true"
            aria-label={previewEvidence.title || 'Visor de Certificado Oficial'}
            className="fixed inset-0 z-[10060] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewEvidence(null)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl border border-teal-500/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glows ambientales sutiles estilo WAPPY */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />

              {/* Encabezado del Visor con datos del trabajador, portal y acciones */}
              <div className="relative px-3.5 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-full">
                        {previewEvidence.workerName?.trim() || previewEvidence.title}
                      </h3>
                      {previewEvidence.cedula?.trim() && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                          CC {previewEvidence.cedula}
                        </span>
                      )}
                      {previewEvidence.portal?.trim() && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          🌐 {previewEvidence.portal}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {[
                        previewEvidence.workerName?.trim() ? previewEvidence.title : '',
                        previewEvidence.cargo?.trim() || '',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Soporte oficial verificado por Web Scraping WAPPY IA'}
                    </p>
                  </div>
                </div>

                {/* Selector de vista (Imagen HD vs PDF) + Botones Descargar / Pestaña nueva / Cerrar */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {previewEvidence.imageUrl && previewEvidence.pdfUrl && (
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 mr-1">
                      <button
                        type="button"
                        onClick={() => setPreviewEvidenceMode('image')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                          previewEvidenceMode === 'image'
                            ? 'bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Imagen HD</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewEvidenceMode('pdf')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                          previewEvidenceMode === 'pdf'
                            ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Visor PDF</span>
                      </button>
                    </div>
                  )}

                  {(previewEvidence.pdfDownloadUrl || previewEvidence.pdfUrl) ? (
                    <a
                      href={previewEvidence.pdfDownloadUrl || previewEvidence.pdfUrl || '#'}
                      download={previewEvidence.pdfFileName || true}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-green-500/35 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 text-xs font-bold tracking-wide no-underline transition-all active:scale-95"
                      title="Descargar documento PDF oficial del certificado"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>⬇️ Descargar PDF Oficial</span>
                    </a>
                  ) : previewEvidence.imageDownloadUrl || previewEvidence.imageUrl ? (
                    <a
                      href={previewEvidence.imageDownloadUrl || previewEvidence.imageUrl || '#'}
                      download={previewEvidence.imageFileName || true}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-green-500/35 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 text-xs font-bold tracking-wide no-underline transition-all active:scale-95"
                      title="Descargar imagen HD del certificado"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>⬇️ Descargar Certificado</span>
                    </a>
                  ) : null}

                  {(previewEvidence.pdfUrl || previewEvidence.imageUrl) && (
                    <a
                      href={
                        (previewEvidenceMode === 'pdf' && previewEvidence.pdfUrl
                          ? previewEvidence.pdfUrl
                          : previewEvidence.pdfUrl || previewEvidence.imageUrl) || '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold tracking-wide no-underline transition-all active:scale-95"
                      title="Abrir certificado oficial en una pestaña nueva"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">🔗 Abrir en pestaña nueva</span>
                      <span className="sm:hidden">Abrir</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewEvidence(null)}
                    aria-label="Cerrar visor de certificado"
                    title="Cerrar visor (Esc)"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cuerpo del Visor (Imagen HD y/o Iframe PDF) */}
              <div className="relative flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 bg-slate-50/70 dark:bg-slate-950/60">
                {previewEvidence.imageUrl &&
                (previewEvidenceMode === 'image' || !previewEvidence.pdfUrl) ? (
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <img
                      src={previewEvidence.imageUrl}
                      alt={
                        previewEvidence.workerName
                          ? `Certificado de ${previewEvidence.workerName}`
                          : previewEvidence.title
                      }
                      className="max-h-[72vh] w-auto max-w-full mx-auto rounded-xl border border-teal-500/30 shadow-xl object-contain bg-white"
                    />
                    {previewEvidence.imageDownloadUrl && previewEvidence.pdfUrl && (
                      <a
                        href={previewEvidence.imageDownloadUrl}
                        download={previewEvidence.imageFileName || true}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 text-[11px] font-bold no-underline transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Descargar captura HD en PNG</span>
                      </a>
                    )}
                  </div>
                ) : previewEvidence.pdfUrl ? (
                  <iframe
                    src={previewEvidence.pdfUrl}
                    title={previewEvidence.title || 'Visor PDF Certificado Oficial'}
                    className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-inner"
                  />
                ) : (
                  <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    No se encontró archivo visual adjunto para esta evidencia.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );

  if (isCanvasFullscreen && typeof document !== 'undefined') {
    return createPortal(canvasContent, document.body);
  }
  return canvasContent;
}
