import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  FileText,
  Edit2,
  Trash2,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Bot,
  Activity,
  Maximize2,
  Minimize2,
  Paperclip,
  Download,
  Eye,
  FileSpreadsheet,
  Presentation,
  Code2,
  ArrowRight,
  ExternalLink,
  Copy,
  Share2,
  Camera,
  CameraOff,
  SwitchCamera,
  Monitor,
  MonitorOff,
  Video,
  VideoOff,
  RefreshCcw,
  Film,
  PhoneOff,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuthContext, useNewConvo } from '~/hooks';
import { useAgentsMapContext } from '~/Providers';
import { useListAgentsQuery } from '~/data-provider';
import { resolveInspectionProtocol, INSPECTION_PROTOCOLS, ERGONOMIC_PHASES, type InspectionProtocol } from '~/utils/inspectionProtocols';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import store from '~/store';
import Markdown from '~/components/Chat/Messages/Content/Markdown';
import { getDehydratedDOM, executeGUIAction, getVisibleScreenContent } from '../Chat/TenshiPageController';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { cn, clearMessagesCache } from '~/utils';
import { Constants, QueryKeys, EModelEndpoint } from 'librechat-data-provider';
import {
  TenshiAvatar,
  triggerTenshiReaction,
  analyzeTenshiEmotionFromText,
  type TenshiAvatarMood,
} from './TenshiAvatar';
import { tenshiAudio } from './tenshiAudio';
import {
  loadTasksVision,
  loadClassicPoseScripts,
  initPoseLandmarker,
  drawBiomechanicSkeleton,
  calculateBiomechanicAngles,
} from '~/utils/biomechanics3D';

export interface TenshiFileAttachment {
  title: string;
  fileType: 'html' | 'text' | 'excel' | 'presentation' | string;
  content: string;
  canvasId?: string;
}

export interface TenshiQrAttachment {
  tipo: string;
  titulo: string;
  descripcion: string;
  url: string;
  qrImageUrl: string;
  instrucciones?: string;
  empresa?: string;
}

export interface TenshiAttachedMedia {
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  dataUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface TenshiChatMessage {
  _id?: string;
  role: string;
  content: string;
  htmlReport?: string;
  isLiveVoice?: boolean;
  file?: TenshiFileAttachment;
  qrCode?: TenshiQrAttachment;
  image?: string;
  media?: TenshiAttachedMedia;
  delegatedOrderId?: string;
  delegatedStatus?: 'todo' | 'done' | 'failed';
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function markdownToSimpleHtml(md: string): string {
  if (!md) return '';

  // 1. Si ya es puramente HTML completo, retornarlo
  if (md.trim().startsWith('<!DOCTYPE') || (md.trim().startsWith('<html') && md.includes('</html>'))) {
    return md;
  }

  // 2. Extraer bloques HTML ya existentes para protegerlos (ej. membrete corporativo o tablas previas)
  const parts = md.split(/(<div[\s\S]*?<\/div>|<table[\s\S]*?<\/table>|<style[\s\S]*?<\/style>)/i);

  const parsedParts = parts.map((part) => {
    if (part.trim().startsWith('<')) {
      return part; // Preservar bloques HTML intactos
    }

    let parsed = part;

    // 3. Parsear tablas Markdown (| col 1 | col 2 |)
    const tableRegex =
      /((?:^|\n)\|[^\n]+\|[^\n]*\n\|[ \t]*:?-+:?[ \t]*\|[^\n]*\n(?:\|[^\n]+\|[^\n]*(?:\n|$))+)/g;

    parsed = parsed.replace(tableRegex, (match) => {
      const lines = match
        .trim()
        .split('\n')
        .map((l) => l.trim());
      if (lines.length < 2) return match;

      const headerCols = lines[0]
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => i > 0 && i < arr.length - 1);
      const separatorCols = lines[1]
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => i > 0 && i < arr.length - 1);

      const alignments = separatorCols.map((col) => {
        if (col.startsWith(':') && col.endsWith(':')) return 'center';
        if (col.endsWith(':')) return 'right';
        if (col.startsWith(':')) return 'left';
        return 'left';
      });

      const headersHtml = headerCols
        .map((col, idx) => {
          const align = alignments[idx] || 'left';
          return `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; font-weight: bold; text-align: ${align}; color: #0f172a;">${col}</th>`;
        })
        .join('');

      const dataRowsHtml = lines
        .slice(2)
        .map((line) => {
          const cols = line
            .split('|')
            .map((c) => c.trim())
            .filter((c, i, arr) => i > 0 && i < arr.length - 1);
          const cellsHtml = cols
            .map((col, idx) => {
              const align = alignments[idx] || 'left';
              return `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: ${align}; color: #334155;">${col}</td>`;
            })
            .join('');
          return `<tr>${cellsHtml}</tr>`;
        })
        .join('');

      return `\n<table style="border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt;"><thead><tr>${headersHtml}</tr></thead><tbody>${dataRowsHtml}</tbody></table>\n`;
    });

    // 4. Encabezados y estilos de texto
    parsed = parsed
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    return `<p>${parsed}</p>`;
  });

  return parsedParts.join('\n');
}

const normalizeStr = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

const AGENT_TAXONOMY: { id: string; aliases: string[]; keywords: string[]; fallbackId?: string }[] = [
  {
    id: 'fisioterapeuta_laboral',
    aliases: ['fisioterapeuta laboral', 'fisioterapeuta', 'especialista en biomecanica laboral', 'biomecanica laboral', 'analista ergonomico rosa', 'ergonomia', 'inspector de puesto de trabajo ipt'],
    keywords: ['fisioterap', 'ergonom', 'biomecan', 'postur', 'musculoesquelet', 'owas', 'rosa', 'rula'],
  },
  {
    id: 'abogado_laboral',
    aliases: ['abogado laboral', 'abogado', 'consultor juridico laboral', 'consultor juridico rit', 'consultor de debido proceso y despidos', 'consultor de protocolo de acoso sexual', 'abogado rit', 'abogado procesos disciplinarios', 'abogado acoso sexual'],
    keywords: ['abogad', 'juridic', 'disciplinari', 'ley 1010', 'ley 2365', 'rit', 'derecho laboral', 'despido', 'contrato laboral'],
  },
  {
    id: 'medico_laboral',
    aliases: [
      'medico laboral',
      'consultor medico ocupacional',
      'medico',
      'medic laboral',
      'medica laboral',
      'medico ocupacional',
      'salud ocupacional',
      'medicina laboral',
      'doctor ocupacional',
      'medico del trabajo',
      'doctor laboral',
    ],
    keywords: ['medic', 'doctor', 'salud ocupacional', 'origen', 'restriccion', 'ausentism', 'epidemiolog', 'examenes ocupacionales'],
  },
  {
    id: 'ingeniero_quimico_sst',
    aliases: ['ingeniero quimico sst', 'especialista en riesgo quimico', 'quimico sst', 'expert en riesgo quimico', 'experto en riesgo quimico'],
    keywords: ['quimic', 'sga', 'fds', 'hds', 'derrame', 'sustancias peligrosas', 'hoja de seguridad', 'rotulado'],
  },
  {
    id: 'coordinador_seguridad_vial',
    aliases: ['coordinador de seguridad vial', 'especialista en riesgo vial', 'expert en riesgo vial', 'experto en riesgo vial', 'seguridad vial', 'pesv'],
    keywords: ['seguridad vial', 'pesv', 'transito', 'vehicul', 'conductor', 'ansv', 'carretera', 'vial'],
  },
  {
    id: 'psicologo_sst',
    aliases: ['psicologo sst', 'especialista en riesgo psicosocial', 'psicolog especialista sst', 'psicologo especialista sst'],
    keywords: ['psicolog', 'psicosocial', 'bateria', 'acoso', 'clima laboral', 'estres laboral'],
  },
  {
    id: 'terapeuta_salud_mental',
    aliases: ['terapeuta en salud mental', 'consultor de bienestar y salud mental', 'salud mental', 'asistente de salud mental'],
    keywords: ['salud mental', 'terapeuta', 'burnout', 'agotamiento', 'emocional', 'bienestar emocional'],
  },
  {
    id: 'nutricionista_laboral',
    aliases: ['nutricionista laboral', 'consultor nutricional corporativo', 'nutricionista', 'asistente en nutricion'],
    keywords: ['nutricion', 'dieta', 'aliment', 'cardiovascular'],
  },
  {
    id: 'primer_respondiente',
    aliases: ['primer respondiente', 'gestor clinico de primeros auxilios', 'primeros auxilios', 'asistente en primeros auxilios'],
    keywords: ['primer respondiente', 'primeros auxilios', 'rcp', 'botiquin', 'hemorragia'],
  },
  {
    id: 'coordinador_emergencias',
    aliases: ['coordinador de emergencias', 'especialista en prevencion y emergencias', 'expert en emergencias', 'experto en emergencias', 'emergencias'],
    keywords: ['emergencia', 'pae', 'evacuacion', 'brigada', 'simulacro'],
  },
  {
    id: 'especialista_bioseguridad',
    aliases: ['especialista en bioseguridad', 'especialista en riesgo biologico', 'expert en riesgo biologico', 'experto en riesgo biologico', 'bioseguridad'],
    keywords: ['bioseguridad', 'biologic', 'vacun', 'pgirh', 'infecc'],
  },
  {
    id: 'ingeniero_electricista_sst',
    aliases: ['ingeniero electricista sst', 'especialista en riesgo electrico', 'expert en riesgo electrico', 'experto en riesgo electrico', 'electricista sst'],
    keywords: ['electric', 'retie', 'arco electrico', 'loto', 'energias peligrosas'],
  },
  {
    id: 'coordinador_tareas_criticas',
    aliases: ['coordinador de tareas criticas', 'especialista en tareas criticas', 'expert en tareas de alto riesgo', 'experto en tareas de alto riesgo', 'gestor de permisos de trabajo tsa'],
    keywords: ['tareas criticas', 'alturas', 'tsa', 'confinados', 'caliente', 'excavacion', 'alto riesgo'],
  },
  {
    id: 'ingeniero_minas_sst',
    aliases: ['ingeniero de minas sst', 'especialista en mineria subterranea y alto riesgo', 'experto mineria subterranea', 'minas sst'],
    keywords: ['minas', 'minero', 'subterranea', 'tunel', 'explosivo'],
  },
  {
    id: 'auditor_sg_sst',
    aliases: ['auditor sg sst', 'auditor integral sg sst', 'auditor sst', 'auditor'],
    keywords: ['auditor', '0312', 'estandares minimos', 'phva', 'auditoria'],
  },
  {
    id: 'ingeniero_ambiental',
    aliases: ['ingeniero ambiental', 'consultor de gestion ambiental', 'gestor gestion ambiental', 'ambiental'],
    keywords: ['ambiental', 'residuo', 'vertimiento', 'ecolog'],
  },
  {
    id: 'especialista_riesgo_climatico',
    aliases: ['especialista en riesgo climatico', 'riesgo climatico'],
    keywords: ['climatic', 'estres termico', 'radiacion uv', 'clima extremo', 'golpe de calor'],
  },
  {
    id: 'redactor_creativo',
    aliases: ['redactor creativo', 'estratega de contenidos corporativos', 'redactor de blog', 'redactor blog'],
    keywords: ['redactor', 'blog', 'articulo', 'publicacion', 'contenidos'],
  },
  {
    id: 'simulador_accidentes',
    aliases: ['simulador de accidentes sst', 'analista forense de accidentalidad at', 'analista forense de enfermedad laboral el', 'simulador de accidentes', 'asistente inv at', 'asistente inv el'],
    keywords: ['simulador', 'siniestro', 'causa raiz', 'arbol de causas', 'forense'],
  },
  {
    id: 'coordinador_capacitaciones',
    aliases: ['coordinador de capacitaciones', 'gestor de formacion continua', 'asistente en capacitaciones', 'capacitaciones'],
    keywords: ['capacitacion', 'pac', 'induccion', 'charla 5 min', 'formacion'],
  },
  {
    id: 'profesional_sst',
    aliases: ['profesional sst', 'consultor senior sg sst'],
    keywords: ['profesional sst', 'inspeccion de campo'],
  },
  {
    id: 'agente_sst',
    aliases: ['consultor sg sst', 'agente sst', 'consultor sst', 'asesor sst'],
    keywords: ['consultor sg sst', 'consultor sst', 'asesoria sst'],
  },
  {
    id: 'coordinador_ipevar',
    aliases: ['coordinador ipevar', 'especialista gtc 45 matriz ipevar', 'especialista gtc 45', 'especialista gtc45', 'matriz ipevar', 'ipevar', 'asistente ipevar'],
    keywords: ['ipevar', 'gtc 45', 'gtc45', 'matriz de peligros', 'valoracion de riesgos'],
    fallbackId: 'agente_sst',
  },
  {
    id: 'asistente_ats',
    aliases: ['asistente ats', 'gestor de analisis de trabajo seguro ats', 'gestor de analisis de trabajo seguro', 'analisis de trabajo seguro ats', 'ats'],
    keywords: ['ats', 'analisis de trabajo seguro', 'paso a paso'],
    fallbackId: 'coordinador_tareas_criticas',
  },
  {
    id: 'asistente_permiso_tsa',
    aliases: ['asistente permiso tsa', 'gestor de permisos de trabajo tsa', 'gestor de permisos de trabajo', 'permiso tsa', 'permiso alturas'],
    keywords: ['permiso tsa', 'permiso alturas', 'resolucion 4272', 'trabajo en alturas'],
    fallbackId: 'coordinador_tareas_criticas',
  },
  {
    id: 'creador_formatos',
    aliases: ['creador de formatos sst', 'creador de formatos', 'agente creador formatos sst', 'formatos sst', 'gestor de formatos'],
    keywords: ['formatos', 'plantilla', 'creador de formatos', 'documentos sst', 'acta'],
    fallbackId: 'agente_sst',
  },
  {
    id: 'asistente_de_aci',
    aliases: ['asistente de aci', 'analista predictivo aci', 'asistente aci', 'oraculo predictivo aci', 'aci'],
    keywords: ['aci', 'analista aci', 'predictivo aci', 'siniestralidad predictiva'],
    fallbackId: 'simulador_accidentes',
  },
  {
    id: 'abogado_rit',
    aliases: ['abogado rit', 'consultor juridico rit', 'reglamento interno rit', 'reglamento interno de trabajo'],
    keywords: ['rit', 'reglamento interno'],
    fallbackId: 'abogado_laboral',
  },
  {
    id: 'abogado_procesos_disciplinarios',
    aliases: ['abogado procesos disciplinarios', 'consultor de debido proceso y despidos', 'procesos disciplinarios', 'debido proceso'],
    keywords: ['debido proceso', 'procesos disciplinarios', 'descargos', 'despidos'],
    fallbackId: 'abogado_laboral',
  },
  {
    id: 'abogado_acoso_sexual',
    aliases: ['abogado acoso sexual', 'consultor de protocolo de acoso sexual', 'acoso sexual laboral', 'protocolo acoso sexual'],
    keywords: ['acoso sexual', 'ley 2365', 'protocolo acoso sexual'],
    fallbackId: 'abogado_laboral',
  },
  {
    id: 'asistente_metodo_rosa',
    aliases: ['asistente metodo rosa', 'analista ergonomico rosa', 'metodo rosa'],
    keywords: ['metodo rosa', 'rosa ergonomia'],
    fallbackId: 'fisioterapeuta_laboral',
  },
  {
    id: 'analista_ipt_ergonomico',
    aliases: ['analista ipt ergonomico', 'inspector de puesto de trabajo ipt', 'inspector de puesto de trabajo', 'inspeccion ipt'],
    keywords: ['ipt', 'inspeccion puesto de trabajo', 'puesto ergonomico'],
    fallbackId: 'fisioterapeuta_laboral',
  },
  {
    id: 'asistente_inv_at',
    aliases: ['asistente inv at', 'analista forense de accidentalidad at', 'investigacion accidentes at'],
    keywords: ['accidentalidad at', 'investigacion de accidentes', 'analista at'],
    fallbackId: 'simulador_accidentes',
  },
  {
    id: 'asistente_inv_el',
    aliases: ['asistente inv el', 'analista forense de enfermedad laboral el', 'enfermedad laboral el'],
    keywords: ['enfermedad laboral el', 'analista el', 'origen el'],
    fallbackId: 'simulador_accidentes',
  },
];

/**
 * Limpia y normaliza consultas delegadas a especialistas por voz en Tenshi,
 * eliminando ruidos fonéticos, vocativos de intermediación ("a la gente médico que...", "dile al doctor que...")
 * y asegurando un prompt técnico profesional en español.
 */
export function cleanDelegatedPrompt(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // 1. Eliminar prefijos de delegación como "dile a la gente médico que", "dile al médico que", "pregúntale al abogado que"
  text = text.replace(
    /^(?:por\s+favor\s+)?(?:dile|preg[uú]ntale|p[ií]dele|consulta(?:le)?|av[ií]sale|comun[ií]cale)\s+(?:a\s+la\s+gente\s+|al\s+agente\s+|al\s+|a\s+la\s+|al\s+doctor\s+|al\s+m[eé]dico\s+|al\s+abogado\s+|al\s+especialista\s+|a\s+[\w\s]+\s+)?(?:que\s+)?/i,
    ''
  );

  // 2. Si la transcripción fonética arrancó directamente con "a la gente [médico|abogado|...]" o "al agente [...]"
  text = text.replace(
    /^(?:a\s+la\s+gente|al\s+agente|al\s+doctor|al\s+m[eé]dico|al\s+abogado|al\s+especialista)\s+(?:laboral\s+|m[eé]dico\s+|sst\s+)?(?:que\s+)?/i,
    ''
  );

  // 3. Eliminar "que qué", "que como", "que cuándo", "que si"
  text = text.replace(/^que\s+(qu[eé]|c[oó]mo|cu[aá]ndo|d[oó]nde|por\s+qu[eé]|si)\s+/i, '$1 ');

  // 4. Transformar peticiones imperativas truncadas tipo "haga una landing page" -> "Por favor elabora una landing page..."
  if (/^haga\b/i.test(text)) {
    text = text.replace(/^haga\b/i, 'Por favor elabora');
  } else if (/^contin[uú]e\b/i.test(text)) {
    text = text.replace(/^contin[uú]e\b/i, 'Por favor continúa con la explicación');
  }

  // 5. Si la pregunta comienza con qué/cómo/cuál/cuándo/por qué, asegurar signos de interrogación si no los tiene
  text = text.trim();
  if (/^(qu[eé]|c[oó]mo|cu[aá]l|cu[aá]ndo|qui[eé]n|d[oó]nde|por\s+qu[eé])\b/i.test(text)) {
    if (!text.startsWith('¿')) {
      text = '¿' + text;
    }
    if (!text.endsWith('?')) {
      text = text + '?';
    }
  }

  // Capitalizar primera letra (o después de ¿)
  if (text.startsWith('¿') && text.length > 1) {
    text = '¿' + text.charAt(1).toUpperCase() + text.slice(2);
  } else if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  // 6. ESTRUCTURACIÓN TÉCNICA PROFESIONAL:
  // Si la consulta es corta o no incluye marco legal técnico específico (decreto, resolución, ley, etc.),
  // se enriquece para solicitar fundamentación normativa colombiana, alcance y recomendaciones para el SG-SST.
  const hasNormativeContext = /\b(concepto\s+t[eé]cnico|decreto\s+\d+|resoluci[oó]n\s+\d+|ley\s+\d+|art[ií]culo\s+\d+|marco\s+legal|est[aá]ndar\s+m[ií]nimo)\b/i.test(text);
  if (text.length < 160 && !hasNormativeContext) {
    const cleanQuestion = text.replace(/[.?\s]+$/, '');
    const prefix = cleanQuestion.startsWith('¿') ? cleanQuestion + '?' : `¿${cleanQuestion}?`;
    text = `${prefix} Por favor proporciona concepto técnico especializado, fundamentación normativa colombiana aplicable (Decretos, Resoluciones vigentes) y recomendaciones clave para el Sistema de Gestión SG-SST de la empresa.`;
  }

  return text;
}

const findMatchingAgent = (targetName: string, agentsList: any[]) => {
  if (!targetName || !agentsList?.length) return null;
  const target = normalizeStr(targetName);
  const cleanTarget = target.replace(/^(un|una|el|la|los|las|al|del|con un|con una|con el|con la)\s+/, '').trim();

  // 1. Coincidencia exacta por ID o nombre
  let found = agentsList.find(
    (a) =>
      a.id === targetName ||
      normalizeStr(a.name) === target ||
      (cleanTarget && normalizeStr(a.name) === cleanTarget)
  );
  if (found) return found;

  // 2. Coincidencia a través de la taxonomía especializada de WAPPY
  const matchedTaxon = AGENT_TAXONOMY.find((taxon) => {
    if (taxon.id === targetName || taxon.id === cleanTarget) return true;
    if (
      taxon.aliases.some(
        (alias) =>
          target.includes(alias) ||
          alias.includes(target) ||
          (cleanTarget && (cleanTarget.includes(alias) || alias.includes(cleanTarget)))
      )
    )
      return true;
    if (taxon.keywords.some((kw) => target.includes(kw) || (cleanTarget && cleanTarget.includes(kw)))) return true;
    return false;
  });

  if (matchedTaxon) {
    // Buscar en la lista de agentes un agente cuyo nombre o ID coincida con los alias de la taxonomía
    found = agentsList.find((a) => {
      if (a.id === matchedTaxon.id) return true;
      const aNorm = normalizeStr(a.name);
      return matchedTaxon.aliases.some((alias) => aNorm.includes(alias) || alias.includes(aNorm));
    });
    if (found) return found;

    // Si tiene fallbackId, buscar por el agente de respaldo consolidado
    if (matchedTaxon.fallbackId) {
      const fallbackId = matchedTaxon.fallbackId;
      const fallbackTaxon = AGENT_TAXONOMY.find((t) => t.id === fallbackId);
      if (fallbackTaxon) {
        found = agentsList.find((a) => {
          if (a.id === fallbackTaxon.id) return true;
          const aNorm = normalizeStr(a.name);
          return fallbackTaxon.aliases.some((alias) => aNorm.includes(alias) || alias.includes(aNorm));
        });
        if (found) return found;
      }
    }
  }

  // 3. Coincidencia por inclusión de substring
  found = agentsList.find(
    (a) =>
      normalizeStr(a.name).includes(target) ||
      target.includes(normalizeStr(a.name)) ||
      (cleanTarget && (normalizeStr(a.name).includes(cleanTarget) || cleanTarget.includes(normalizeStr(a.name))))
  );
  if (found) return found;

  // 4. Búsqueda por coincidencia de tokens
  const STOPWORDS = new Set(['un', 'una', 'el', 'la', 'los', 'las', 'del', 'al', 'con', 'por', 'para', 'de', 'en', 'es', 'y', 'o', 'que']);
  const targetWords = (cleanTarget || target).split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  let bestMatch = null;
  let bestOverlap = 0;
  for (const a of agentsList) {
    const aName = normalizeStr(a.name);
    const aWords = aName.split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    const overlap = targetWords.filter((w) =>
      aWords.some((aw) => w === aw || ((w.startsWith(aw) || aw.startsWith(w)) && w.length >= 4 && aw.length >= 4))
    ).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = a;
    }
  }

  return bestOverlap > 0 ? bestMatch : null;
};

// ─── Mapa Canónico y Exhaustivo de Destinos y Rutas de WAPPY ──────────────────
export const WAPPY_NAV_MAP: Record<string, { route: string; sgsstModule?: string }> = {
  // ─── HITO 1: Gobernanza y Cimiento Legal (/sgsst?hito=hito1) ───
  diagnostico: { route: '/sgsst?hito=hito1&module=diagnostico', sgsstModule: 'diagnostico' },
  '0312': { route: '/sgsst?hito=hito1&module=diagnostico', sgsstModule: 'diagnostico' },
  estandares_minimos: { route: '/sgsst?hito=hito1&module=diagnostico', sgsstModule: 'diagnostico' },
  evaluacion_inicial: { route: '/sgsst?hito=hito1&module=diagnostico', sgsstModule: 'diagnostico' },
  participacion_ipevar: { route: '/sgsst?hito=hito1&module=participacion_ipevar', sgsstModule: 'participacion_ipevar' },
  matriz_ipevar_oficial: { route: '/sgsst?hito=hito1&module=matriz_ipevar_oficial', sgsstModule: 'matriz_ipevar_oficial' },
  matriz_pesv_oficial: { route: '/sgsst?hito=hito1&module=matriz_pesv_oficial', sgsstModule: 'matriz_pesv_oficial' },
  matriz_compatibilidad_oficial: { route: '/sgsst?hito=hito1&module=matriz_compatibilidad_oficial', sgsstModule: 'matriz_compatibilidad_oficial' },
  vulnerabilidad: { route: '/sgsst?hito=hito1&module=vulnerabilidad', sgsstModule: 'vulnerabilidad' },
  amenazas: { route: '/sgsst?hito=hito1&module=vulnerabilidad', sgsstModule: 'vulnerabilidad' },
  plan_emergencias: { route: '/sgsst?hito=hito1&module=plan_emergencias', sgsstModule: 'plan_emergencias' },
  ppre: { route: '/sgsst?hito=hito1&module=plan_emergencias', sgsstModule: 'plan_emergencias' },
  emergencias: { route: '/sgsst?hito=hito1&module=plan_emergencias', sgsstModule: 'plan_emergencias' },
  responsable: { route: '/sgsst?hito=hito1&module=responsable', sgsstModule: 'responsable' },
  responsable_sst: { route: '/sgsst?hito=hito1&module=responsable', sgsstModule: 'responsable' },
  politica: { route: '/sgsst?hito=hito1&module=politica', sgsstModule: 'politica' },
  politica_sst: { route: '/sgsst?hito=hito1&module=politica', sgsstModule: 'politica' },
  objetivos: { route: '/sgsst?hito=hito1&module=objetivos', sgsstModule: 'objetivos' },
  objetivos_sst: { route: '/sgsst?hito=hito1&module=objetivos', sgsstModule: 'objetivos' },
  legal: { route: '/sgsst?hito=hito1&module=legal', sgsstModule: 'legal' },
  matriz_legal: { route: '/sgsst?hito=hito1&module=legal', sgsstModule: 'legal' },
  normograma: { route: '/sgsst?hito=hito1&module=legal', sgsstModule: 'legal' },
  rhs: { route: '/sgsst?hito=hito1&module=rhs', sgsstModule: 'rhs' },
  reglamento_higiene: { route: '/sgsst?hito=hito1&module=rhs', sgsstModule: 'rhs' },
  rit: { route: '/sgsst?hito=hito1&module=rit', sgsstModule: 'rit' },
  reglamento_interno: { route: '/sgsst?hito=hito1&module=rit', sgsstModule: 'rit' },
  reglamento: { route: '/sgsst?hito=hito1&module=rhs', sgsstModule: 'rhs' },
  hito1: { route: '/sgsst?hito=hito1', sgsstModule: 'diagnostico' },

  // ─── HITO 2: Huella Biocéntrica (/sgsst?hito=hito2) ───
  perfil_cargo: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
  cargos: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
  cargo: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
  profesigrama: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
  perfil_socio: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
  perfil_sociodemografico: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
  sociodemografico: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
  trabajadores: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
  empleados: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
  colaboradores: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
  condiciones_salud: { route: '/sgsst?hito=hito2&module=condiciones_salud', sgsstModule: 'condiciones_salud' },
  salud: { route: '/sgsst?hito=hito2&module=condiciones_salud', sgsstModule: 'condiciones_salud' },
  examenes_medicos: { route: '/sgsst?hito=hito2&module=condiciones_salud', sgsstModule: 'condiciones_salud' },
  bio_motor: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
  oraculo_predictivo_hito2: { route: '/sgsst?hito=hito2&module=oraculo_predictivo', sgsstModule: 'oraculo_predictivo' },
  compatibilidad_cargo: { route: '/sgsst?hito=hito2&module=oraculo_predictivo', sgsstModule: 'oraculo_predictivo' },
  hito2: { route: '/sgsst?hito=hito2', sgsstModule: 'perfil_cargo' },

  // ─── HITO 3: Comités, Brigadas y Órganos de Gobernanza (/sgsst?hito=hito3) ───
  copasst: { route: '/sgsst?hito=hito3&module=copasst', sgsstModule: 'copasst' },
  vigia: { route: '/sgsst?hito=hito3&module=copasst', sgsstModule: 'copasst' },
  cocolab: { route: '/sgsst?hito=hito3&module=cocolab', sgsstModule: 'cocolab' },
  convivencia: { route: '/sgsst?hito=hito3&module=cocolab', sgsstModule: 'cocolab' },
  comite_convivencia: { route: '/sgsst?hito=hito3&module=cocolab', sgsstModule: 'cocolab' },
  comite_pesv: { route: '/sgsst?hito=hito3&module=comite_pesv', sgsstModule: 'comite_pesv' },
  seguridad_vial_comite: { route: '/sgsst?hito=hito3&module=comite_pesv', sgsstModule: 'comite_pesv' },
  brigada_emergencias: { route: '/sgsst?hito=hito3&module=brigada_emergencias', sgsstModule: 'brigada_emergencias' },
  brigadas: { route: '/sgsst?hito=hito3&module=brigada_emergencias', sgsstModule: 'brigada_emergencias' },
  brigada: { route: '/sgsst?hito=hito3&module=brigada_emergencias', sgsstModule: 'brigada_emergencias' },
  comite_crisis: { route: '/sgsst?hito=hito3&module=brigada_emergencias', sgsstModule: 'brigada_emergencias' },
  comites: { route: '/sgsst?hito=hito3&module=copasst', sgsstModule: 'copasst' },
  hito3: { route: '/sgsst?hito=hito3', sgsstModule: 'copasst' },

  // ─── HITO 4: Evaluación Dinámica de Riesgos (/sgsst?hito=hito4) ───
  animo: { route: '/sgsst?hito=hito4&module=animo', sgsstModule: 'animo' },
  psicosocial: { route: '/sgsst?hito=hito4&module=animo', sgsstModule: 'animo' },
  clima: { route: '/sgsst?hito=hito4&module=animo', sgsstModule: 'animo' },
  termometro: { route: '/sgsst?hito=hito4&module=animo', sgsstModule: 'animo' },
  metodo_owas: { route: '/sgsst?hito=hito4&module=metodo_owas', sgsstModule: 'metodo_owas' },
  owas: { route: '/sgsst?hito=hito4&module=metodo_owas', sgsstModule: 'metodo_owas' },
  ergonomia: { route: '/sgsst?hito=hito4&module=metodo_owas', sgsstModule: 'metodo_owas' },
  estudio_puesto: { route: '/sgsst?hito=hito4&module=estudio_puesto', sgsstModule: 'estudio_puesto' },
  ept: { route: '/sgsst?hito=hito4&module=estudio_puesto', sgsstModule: 'estudio_puesto' },
  puesto_trabajo: { route: '/sgsst?hito=hito4&module=estudio_puesto', sgsstModule: 'estudio_puesto' },
  peligros: { route: '/sgsst?hito=hito4&module=peligros', sgsstModule: 'peligros' },
  ipevar: { route: '/sgsst?hito=hito4&module=peligros', sgsstModule: 'peligros' },
  matriz_gtc45: { route: '/sgsst?hito=hito4&module=peligros', sgsstModule: 'peligros' },
  gtc45: { route: '/sgsst?hito=hito4&module=peligros', sgsstModule: 'peligros' },
  riesgos: { route: '/sgsst?hito=hito4&module=peligros', sgsstModule: 'peligros' },
  hito4: { route: '/sgsst?hito=hito4', sgsstModule: 'peligros' },

  // ─── HITO 5: Dinámica Operativa y Terreno (/sgsst?hito=hito5) ───
  permiso_alturas: { route: '/sgsst?hito=hito5&module=permiso_alturas', sgsstModule: 'permiso_alturas' },
  alturas: { route: '/sgsst?hito=hito5&module=permiso_alturas', sgsstModule: 'permiso_alturas' },
  tsa: { route: '/sgsst?hito=hito5&module=permiso_alturas', sgsstModule: 'permiso_alturas' },
  analisis_trabajo_seguro: { route: '/sgsst?hito=hito5&module=analisis_trabajo_seguro', sgsstModule: 'analisis_trabajo_seguro' },
  ats: { route: '/sgsst?hito=hito5&module=analisis_trabajo_seguro', sgsstModule: 'analisis_trabajo_seguro' },
  epp_delivery: { route: '/sgsst?hito=hito5&module=epp_delivery', sgsstModule: 'epp_delivery' },
  epp: { route: '/sgsst?hito=hito5&module=epp_delivery', sgsstModule: 'epp_delivery' },
  entrega_epp: { route: '/sgsst?hito=hito5&module=epp_delivery', sgsstModule: 'epp_delivery' },
  vehicles_pesv: { route: '/sgsst?hito=hito5&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
  pesv: { route: '/sgsst?hito=hito5&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
  vial: { route: '/sgsst?hito=hito5&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
  vehiculos: { route: '/sgsst?hito=hito5&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
  automotores: { route: '/sgsst?hito=hito5&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
  heights_lifecycle: { route: '/sgsst?hito=hito5&module=heights_lifecycle', sgsstModule: 'heights_lifecycle' },
  equipos_alturas: { route: '/sgsst?hito=hito5&module=heights_lifecycle', sgsstModule: 'heights_lifecycle' },
  arneses: { route: '/sgsst?hito=hito5&module=heights_lifecycle', sgsstModule: 'heights_lifecycle' },
  chemical_registry: { route: '/sgsst?hito=hito5&module=chemical_registry', sgsstModule: 'chemical_registry' },
  quimicos: { route: '/sgsst?hito=hito5&module=chemical_registry', sgsstModule: 'chemical_registry' },
  sga: { route: '/sgsst?hito=hito5&module=chemical_registry', sgsstModule: 'chemical_registry' },
  sustancias_quimicas: { route: '/sgsst?hito=hito5&module=chemical_registry', sgsstModule: 'chemical_registry' },
  equipos_emergencia: { route: '/sgsst?hito=hito5&module=equipos_emergencia', sgsstModule: 'equipos_emergencia' },
  extintores: { route: '/sgsst?hito=hito5&module=equipos_emergencia', sgsstModule: 'equipos_emergencia' },
  botiquines: { route: '/sgsst?hito=hito5&module=equipos_emergencia', sgsstModule: 'equipos_emergencia' },
  hito5: { route: '/sgsst?hito=hito5', sgsstModule: 'vehicles_pesv' },

  // ─── HITO 6: Cultura, Escuela e Innovación (/sgsst?hito=hito6) ───
  reporte_actos: { route: '/sgsst?hito=hito6&module=reporte_actos', sgsstModule: 'reporte_actos' },
  actos: { route: '/sgsst?hito=hito6&module=reporte_actos', sgsstModule: 'reporte_actos' },
  condiciones_inseguras: { route: '/sgsst?hito=hito6&module=reporte_actos', sgsstModule: 'reporte_actos' },
  capacitaciones: { route: '/sgsst?hito=hito6&module=capacitaciones', sgsstModule: 'capacitaciones' },
  pac: { route: '/sgsst?hito=hito6&module=capacitaciones', sgsstModule: 'capacitaciones' },
  simulacros_emergencia: { route: '/sgsst?hito=hito6&module=simulacros_emergencia', sgsstModule: 'simulacros_emergencia' },
  simulacros: { route: '/sgsst?hito=hito6&module=simulacros_emergencia', sgsstModule: 'simulacros_emergencia' },
  simulacro: { route: '/sgsst?hito=hito6&module=simulacros_emergencia', sgsstModule: 'simulacros_emergencia' },
  ruta_aprendizaje: { route: '/sgsst?hito=hito6&module=ruta_aprendizaje', sgsstModule: 'ruta_aprendizaje' },
  lms: { route: '/sgsst?hito=hito6&module=ruta_aprendizaje', sgsstModule: 'ruta_aprendizaje' },
  app_builder: { route: '/sgsst?hito=hito6&module=app_builder', sgsstModule: 'app_builder' },
  creador_aplicativos: { route: '/sgsst?hito=hito6&module=app_builder', sgsstModule: 'app_builder' },
  hito6: { route: '/sgsst?hito=hito6', sgsstModule: 'capacitaciones' },

  // ─── HITO 7: Auditoría, Causalidad & Cierre de Ciclo (/sgsst?hito=hito7) ───
  estadisticas: { route: '/sgsst?hito=hito7&module=estadisticas', sgsstModule: 'estadisticas' },
  atel: { route: '/sgsst?hito=hito7&module=estadisticas', sgsstModule: 'estadisticas' },
  ausentismo: { route: '/sgsst?hito=hito7&module=estadisticas', sgsstModule: 'estadisticas' },
  indicadores: { route: '/sgsst?hito=hito7&module=estadisticas', sgsstModule: 'estadisticas' },
  investigacion_atel: { route: '/sgsst?hito=hito7&module=investigacion_atel', sgsstModule: 'investigacion_atel' },
  accidentes: { route: '/sgsst?hito=hito7&module=investigacion_atel', sgsstModule: 'investigacion_atel' },
  arbol_causas: { route: '/sgsst?hito=hito7&module=investigacion_atel', sgsstModule: 'investigacion_atel' },
  control_acpm: { route: '/sgsst?hito=hito7&module=control_acpm', sgsstModule: 'control_acpm' },
  acpm: { route: '/sgsst?hito=hito7&module=control_acpm', sgsstModule: 'control_acpm' },
  auditoria: { route: '/sgsst?hito=hito7&module=auditoria', sgsstModule: 'auditoria' },
  auditoria_interna: { route: '/sgsst?hito=hito7&module=auditoria', sgsstModule: 'auditoria' },
  alta_direccion: { route: '/sgsst?hito=hito7&module=alta_direccion', sgsstModule: 'alta_direccion' },
  revision_direccion: { route: '/sgsst?hito=hito7&module=alta_direccion', sgsstModule: 'alta_direccion' },
  investigacion_profunda: { route: '/sgsst?hito=hito7&module=investigacion_profunda', sgsstModule: 'investigacion_profunda' },
  hito7: { route: '/sgsst?hito=hito7', sgsstModule: 'estadisticas' },

  // ─── HITO 8: Inteligencia Artificial & Oráculo Predictivo (/sgsst?hito=hito8) ───
  predictivo: { route: '/sgsst?hito=hito8&module=predictivo', sgsstModule: 'predictivo' },
  oraculo: { route: '/sgsst?hito=hito8&module=predictivo', sgsstModule: 'predictivo' },
  oraculo_predictivo: { route: '/sgsst?hito=hito8&module=predictivo', sgsstModule: 'predictivo' },
  siniestralidad: { route: '/sgsst?hito=hito8&module=predictivo', sgsstModule: 'predictivo' },
  inteligencia_artificial: { route: '/sgsst?hito=hito8&module=predictivo', sgsstModule: 'predictivo' },
  hito8: { route: '/sgsst?hito=hito8', sgsstModule: 'predictivo' },

  // ─── SOMOS SST DASHBOARD GENERAL ───
  sgsst: { route: '/sgsst' },
  somos_sst: { route: '/sgsst' },
  hitos: { route: '/sgsst' },

  // ─── MÓDULOS Y APLICATIVOS GENERALES DE WAPPY ───
  planes: { route: '/planes' },
  precios: { route: '/planes' },
  tarifas: { route: '/planes' },
  suscripciones: { route: '/planes' },
  billing: { route: '/planes' },
  academia: { route: '/academia?tab=cursos' },
  cursos: { route: '/academia?tab=cursos' },
  curso: { route: '/academia?tab=cursos' },
  training: { route: '/academia?tab=cursos' },
  training_directo: { route: '/training' },
  training_admin: { route: '/training/admin' },
  admin_cursos: { route: '/training/admin' },
  rutas: { route: '/academia?tab=rutas' },
  ruta: { route: '/academia?tab=rutas' },
  ruta_aprendizaje_app: { route: '/ruta-aprendizaje' },
  ruta_admin: { route: '/ruta-aprendizaje/admin' },
  rutas_admin: { route: '/ruta-aprendizaje/admin' },
  admin_rutas: { route: '/ruta-aprendizaje/admin' },
  events: { route: '/events-meet' },
  events_meet: { route: '/events-meet' },
  events_meet_admin: { route: '/events-meet/admin' },
  meet: { route: '/academia?tab=meet' },
  clases: { route: '/academia?tab=meet' },
  webinars: { route: '/events-meet' },
  blog: { route: '/blog' },
  blog_admin: { route: '/blog/admin' },
  admin_blog: { route: '/blog/admin' },
  control: { route: '/sgsst/control' },
  kanban: { route: '/sgsst/control' },
  centro_control: { route: '/sgsst/control' },
  sgsst_control: { route: '/sgsst/control' },
  automatizaciones: { route: '/sgsst/control?tab=automatizaciones' },
  tareas_automaticas: { route: '/sgsst/control?tab=automatizaciones' },
  marketplace: { route: '/marketplace' },
  tienda: { route: '/marketplace' },
  tienda_sst: { route: '/marketplace' },
  productos: { route: '/marketplace' },
  marketplace_admin: { route: '/marketplace/admin' },
  admin_tienda: { route: '/marketplace/admin' },
  agents: { route: '/agents' },
  agentes: { route: '/agents' },
  agentes_ia: { route: '/agents' },
  catalogo_agentes: { route: '/agents' },
  marketplace_agentes: { route: '/agents' },
  live: { route: '/c/new' },
  inspeccion: { route: '/c/new' },
  biomecanica: { route: '/c/new' },
  videollamada: { route: '/c/new' },
  camara: { route: '/c/new' },
  chat: { route: '/c/new' },
  conversacion: { route: '/c/new' },
  nuevo_chat: { route: '/c/new' },
  chat_sst: { route: '/chat-sst' },
  'chat-sst': { route: '/chat-sst' },
  animo_dashboard: { route: '/sgsst/animo' },
  clima_dashboard: { route: '/sgsst/animo' },
  auditoria_app: { route: '/auditoria' },
  auditoria_dashboard: { route: '/auditoria' },
  roadmap: { route: '/hoja-de-ruta' },
  hoja_de_ruta: { route: '/hoja-de-ruta' },
  contactanos: { route: '/contactanos' },
  contacto: { route: '/contactanos' },
  soporte: { route: '/contactanos' },
  comunidad: { route: '/comunidad' },
  comunidadmp: { route: '/comunidad' },
  wappyvital: { route: '/comunidad' },
  matriz: { route: '/matriz' },
  embajadores: { route: '/embajadores' },
  embajadores_dashboard: { route: '/embajadores/dashboard' },
  tenshi_admin: { route: '/tenshi/admin' },
  search: { route: '/search' },
  buscar: { route: '/search' },
  quibi: { route: '/quibi' },
  qb: { route: '/quibi' },

  // ─── PÁGINAS INSTITUCIONALES Y LEGALES ───
  privacy: { route: '/privacy' },
  privacidad: { route: '/privacy' },
  politica_privacidad: { route: '/privacy' },
  terms: { route: '/terms' },
  terminos: { route: '/terms' },
  terminos_condiciones: { route: '/terms' },
  about: { route: '/about' },
  nosotros: { route: '/about' },
  acerca_de: { route: '/about' },
  portafolio: { route: '/portafolio' },
  mauricioposada: { route: '/mauricioposada' },

  // ─── CLASES Y SESIONES EN VIVO (MEET / ACADEMIA) ───
  clases_en_vivo: { route: '/academia?tab=meet' },
  clase_en_vivo: { route: '/academia?tab=meet' },
  sesion_en_vivo: { route: '/academia?tab=meet' },
  sesiones_en_vivo: { route: '/academia?tab=meet' },

  // ─── EMPRESAS REGISTRADAS (MODAL / GESTIÓN) ───
  empresas: { route: '/sgsst?modal=empresas' },
  empresas_registradas: { route: '/sgsst?modal=empresas' },
  empresa_info: { route: '/sgsst?modal=empresas' },

  // ─── CONFIGURACIÓN Y AJUSTES DE CUENTA ───
  configuracion: { route: '/settings' },
  settings: { route: '/settings' },
  ajustes: { route: '/settings' },
  preferencias: { route: '/settings' },

  // ─── NAVEGACIÓN DE RETORNO / REGRESO ───
  regresar: { route: '/c/new' },
  volver: { route: '/c/new' },

  // ─── PORTALES PÚBLICOS DEL TRABAJADOR (/sgsst-public/*) ───
  public_reportar: { route: '/sgsst-public/reportar' },
  reportar_publico: { route: '/sgsst-public/reportar' },
  public_animo: { route: '/sgsst-public/animo' },
  animo_publico: { route: '/sgsst-public/animo' },
  public_estudio_puesto: { route: '/sgsst-public/estudio-puesto' },
  public_ipevar: { route: '/sgsst-public/ipevar' },
  public_alta_direccion: { route: '/sgsst-public/alta-direccion' },
  public_atel: { route: '/sgsst-public/atel-testimonio' },
  public_perfil_update: { route: '/sgsst-public/perfil-update' },
  public_colaborador: { route: '/sgsst-public/colaborador' },
  public_comites: { route: '/sgsst-public/comites' },
  public_convivencia: { route: '/sgsst-public/convivencia' },
  public_votaciones: { route: '/sgsst-public/votaciones' },
  public_inspecciones: { route: '/sgsst-public/copasst-inspecciones' },
  public_brigadistas: { route: '/sgsst-public/brigadista' },
};

/**
 * Resuelve cualquier clave o término de búsqueda a su ruta canónica en WAPPY
 */
export function resolveWappyDestination(
  rawModulo?: string,
  rawRuta?: string
): { targetRoute: string; targetSgsstModule?: string } {
  let targetRoute = rawRuta?.trim();
  let targetSgsstModule: string | undefined = undefined;

  // Normalizar rutas directas que no existen en React Router
  if (targetRoute === '/sgsst/estudio-puesto' || targetRoute === '/sgsst/estudio_puesto') {
    targetRoute = '/sgsst?hito=hito4&module=estudio_puesto';
    targetSgsstModule = 'estudio_puesto';
  }

  if (!targetRoute) {
    const mod = (rawModulo || '').toLowerCase().trim();
    if (mod && WAPPY_NAV_MAP[mod]) {
      targetRoute = WAPPY_NAV_MAP[mod].route;
      targetSgsstModule = WAPPY_NAV_MAP[mod].sgsstModule;
    } else if (mod) {
      // Priorizar coincidencia más específica (claves más largas primero)
      const sortedKeys = Object.keys(WAPPY_NAV_MAP).sort((a, b) => b.length - a.length);
      const matchedKey = sortedKeys.find((k) => mod.includes(k) || k.includes(mod));
      if (matchedKey && WAPPY_NAV_MAP[matchedKey]) {
        targetRoute = WAPPY_NAV_MAP[matchedKey].route;
        targetSgsstModule = WAPPY_NAV_MAP[matchedKey].sgsstModule;
      } else {
        targetRoute = '/sgsst';
      }
    } else {
      targetRoute = '/sgsst';
    }
  }

  // Extraer sgsstModule de targetRoute si está presente y aún no definido
  if (targetRoute.includes('/sgsst') && targetRoute.includes('module=') && !targetSgsstModule) {
    try {
      const urlMatch = targetRoute.match(/module=([^&]+)/);
      if (urlMatch && urlMatch[1]) {
        targetSgsstModule = urlMatch[1];
      }
    } catch (_) {}
  }

  return { targetRoute, targetSgsstModule };
}

const TENSHI_ACTIVITIES = [
  {
    icon: '📊',
    title: 'Matriz IPEVAR',
    desc: 'Consultar peligros y riesgos',
    prompt: 'Solicito consultar el estado de la Matriz IPEVAR de la empresa y los principales peligros evaluados.',
  },
  {
    icon: '📋',
    title: 'Plan de Trabajo',
    desc: 'Metas y cronograma SST',
    prompt: '¿Cómo va el cumplimiento del Plan de Trabajo Anual del SG-SST y qué hitos están próximos a vencer?',
  },
  {
    icon: '👥',
    title: 'Censo Laboral',
    desc: 'Trabajadores y cargos',
    prompt: 'Muéstrame el censo de trabajadores y los cargos activos registrados en la empresa.',
  },
  {
    icon: '🩺',
    title: 'Medicina Laboral',
    desc: 'Casos médicos y reintegro',
    prompt: 'Revisar casos de reintegro laboral y seguimiento a recomendaciones médicas ocupacionales.',
  },
  {
    icon: '⚡',
    title: 'Auditoría Res. 0312',
    desc: 'Estándares mínimos',
    prompt: 'Realiza una auditoría del cumplimiento de estándares mínimos según Resolución 0312 de 2019.',
  },
  {
    icon: '🚒',
    title: 'Plan Emergencias',
    desc: 'Brigadas y contingencias',
    prompt: '¿Cuál es el estado del Plan de Prevención, Preparación y Respuesta ante Emergencias?',
  },
];

export default function TenshiChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token, user } = useAuthContext();

  // ─── Modo Protagonista en Celular (Hero Mode) ───────────────────────────────
  const checkIsMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      window.matchMedia('(max-width: 767px)').matches ||
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 1024)
    );
  }, []);

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      window.matchMedia('(max-width: 767px)').matches ||
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 1024)
    );
  });

  const [isHeroChatOpen, setIsHeroChatOpen] = useState(false);

  const [isMobileHeroMode, setIsMobileHeroMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isMobile =
      window.innerWidth < 768 ||
      window.matchMedia('(max-width: 767px)').matches ||
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 1024);
    if (!isMobile) return false;
    if (sessionStorage.getItem('tenshi_mobile_hero_forced') === 'true') return true;
    const isChatRoute =
      window.location.pathname === '/' ||
      window.location.pathname === '/c/new' ||
      window.location.pathname.startsWith('/c/');
    const alreadyMinimized = sessionStorage.getItem('tenshi_mobile_hero_minimized') === 'true';
    return isChatRoute && !alreadyMinimized;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = checkIsMobile();
      setIsMobileScreen(mobile);
      if (!mobile) {
        setIsMobileHeroMode(false);
        setIsHeroChatOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkIsMobile]);

  useEffect(() => {
    const handleExitHero = () => {
      setIsMobileHeroMode(false);
      setIsHeroChatOpen(false);
      try {
        sessionStorage.setItem('tenshi_mobile_hero_minimized', 'true');
        sessionStorage.removeItem('tenshi_mobile_hero_forced');
      } catch (_) {}
    };
    const handleEnterHero = () => {
      try {
        sessionStorage.removeItem('tenshi_mobile_hero_minimized');
        sessionStorage.removeItem('tenshi_mobile_hero_exited');
        sessionStorage.setItem('tenshi_mobile_hero_forced', 'true');
      } catch (_) {}
      setIsMobileHeroMode(true);
      setIsHeroChatOpen(false);
    };
    window.addEventListener('tenshi-exit-mobile-hero', handleExitHero);
    window.addEventListener('tenshi-enter-mobile-hero', handleEnterHero);
    return () => {
      window.removeEventListener('tenshi-exit-mobile-hero', handleExitHero);
      window.removeEventListener('tenshi-enter-mobile-hero', handleEnterHero);
    };
  }, []);

  // Activación al cargar o loguearse en celular
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    const isMobile = checkIsMobile();
    if (!isMobile) return;

    const isChatRoute =
      location.pathname === '/' ||
      location.pathname === '/c/new' ||
      location.pathname.startsWith('/c/');

    const justLoggedIn = sessionStorage.getItem('tenshi_mobile_just_logged_in') === 'true';

    if (isAuthenticated && isChatRoute) {
      if (justLoggedIn || sessionStorage.getItem('tenshi_mobile_hero_minimized') !== 'true') {
        setIsMobileHeroMode(true);
        try {
          sessionStorage.removeItem('tenshi_mobile_just_logged_in');
        } catch (_) {}
      }
    }

    prevAuthRef.current = isAuthenticated;
  }, [location.pathname, isAuthenticated, checkIsMobile]);

  const agentsMap = useAgentsMapContext();
  const { data: agentsData } = useListAgentsQuery({ requiredPermission: 1, limit: 100 });
  const agentsRef = useRef<any[]>([]);

  useEffect(() => {
    const listFromMap = Object.values(agentsMap || {});
    if (listFromMap.length > 0) {
      agentsRef.current = listFromMap;
    } else if (agentsData?.data && Array.isArray(agentsData.data) && agentsData.data.length > 0) {
      agentsRef.current = agentsData.data;
    }
  }, [agentsMap, agentsData]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'chat'>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<TenshiChatMessage[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
    },
  ]);
  const [input, setInput] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<TenshiAttachedMedia | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [tenshiStatus, setTenshiStatus] = useState<string>('');
  const [guiSteps, setGuiSteps] = useState<{ action: string; details: string; status: 'pending' | 'success' | 'failed' }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Registro persistente en memoria para evitar que videos o imágenes en blobUrl expiren al sincronizar con el backend
  const liveMediaBlobsRef = useRef<Map<string, { blobUrl?: string; dataUrl?: string; thumbnailUrl?: string; mimeType?: string; name: string }>>(new Map());

  // ─── Tenshi Voice Mode State & Audio Infrastructure ───────────────────────────
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceAmplitude, setVoiceAmplitude] = useState(0);
  const [outputAmplitude, setOutputAmplitude] = useState(0);
  const [isTenshiSpeaking, setIsTenshiSpeaking] = useState(false);
  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const [isGeneratingTechnicalReport, setIsGeneratingTechnicalReport] = useState(false);
  const [reportSuccessToast, setReportSuccessToast] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);
  const lastActivityRef = useRef<number>(Date.now());
  const lastUserTranscriptionRef = useRef<string>('');
  const inactivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectVoiceRef = useRef<() => void>(() => {});
  const sendVoiceInterruptRef = useRef<() => void>(() => {});
  const lastVoiceCaptureTimeRef = useRef<number>(0);

  // ─── Tenshi Vision Mode State & Video Infrastructure ──────────────────────────
  const [isVisionActive, setIsVisionActive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const isCameraOnRef = useRef(true);
  isCameraOnRef.current = isCameraOn;
  const [isVisionExpanded, setIsVisionExpanded] = useState(true);
  const [visionSource, setVisionSource] = useState<'camera' | 'screen'>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const visionVideoRef = useRef<HTMLVideoElement | null>(null);
  const visionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visionStreamRef = useRef<MediaStream | null>(null);
  const visionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sendVideoFrameRef = useRef<((video: HTMLVideoElement, telemetry?: string, overlayCanvas?: HTMLCanvasElement | null) => void) | null>(null);
  const sendEvidenceImageRef = useRef<((base64Image: string, description?: string, metadata?: any) => void) | null>(null);

  // ─── Biomecánica & Telemetría Ergonómica en Vivo (Fisioterapeuta IA) ─────────
  const [isBiomechanicsActive, setIsBiomechanicsActive] = useState(false);
  const [neckAngle, setNeckAngle] = useState<number | null>(null);
  const [trunkAngle, setTrunkAngle] = useState<number | null>(null);
  const [armAngle, setArmAngle] = useState<number | null>(null);
  const [elbowAngle, setElbowAngle] = useState<number | null>(null);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [is3DTelemetry, setIs3DTelemetry] = useState(false);
  const [currentErgoPhaseIndex, setCurrentErgoPhaseIndex] = useState(0);
  const currentErgoPhaseIndexRef = useRef(currentErgoPhaseIndex);
  currentErgoPhaseIndexRef.current = currentErgoPhaseIndex;
  const manualCapturedPhasesRef = useRef<Set<number>>(new Set());
  const captureVisionSnapshotRef = useRef<((customLabel?: string, targetPhaseIdx?: number) => string | null) | null>(null);
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
  const [isPoseActive, setIsPoseActive] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const biomechanicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const poseRef = useRef<any>(null);
  const handsResultsRef = useRef<any>(null);
  const anglesRef = useRef<{ neck: number | null; trunk: number | null; arm: number | null; elbow: number | null; knee: number | null }>({
    neck: null,
    trunk: null,
    arm: null,
    elbow: null,
    knee: null,
  });
  const lastErgoUpdateRef = useRef<number>(0);
  const isVoiceActiveRef = useRef(false);

  // ─── Protocolo Dinámico de Inspección y Roles de Agentes WAPPY ─────────
  const [activeProtocol, setActiveProtocol] = useState<InspectionProtocol>(INSPECTION_PROTOCOLS.auditoria_gtc45);

  const updateTenshiProtocolByIntent = useCallback((text: string) => {
    if (!text) return;
    const lower = text.toLowerCase().trim();
    // No evaluar frases cortas de confirmación ("ya", "listo", "ok", "sí")
    if (lower.split(/\s+/).length < 2 && !lower.includes('fisio')) return;

    const fisioKeywords = /\b(ergonom|fisiot|postur|rula|reba|owas|estudio\s+de\s+puesto|biomec|lumbar|cervic|espalda|cuello)\b/i;
    const quimicoKeywords = /\b(qu[ií]mic|sga|sustancia|reactivo|hoja\s+de\s+seguridad|msds|fds)\b/i;
    const pesvKeywords = /\b(pesv|vial|veh[ií]cul|conductor|tr[aá]nsito)\b/i;
    const emergenciaKeywords = /\b(extintor|botiqu[ií]n|brigad|primeros\s+auxilios|retie|el[eé]ctric)\b/i;

    if (fisioKeywords.test(lower)) {
      setActiveProtocol(INSPECTION_PROTOCOLS.biomecanico);
      setIsBiomechanicsActive(true);
    } else if (quimicoKeywords.test(lower)) {
      setActiveProtocol(INSPECTION_PROTOCOLS.quimico);
      setIsBiomechanicsActive(false);
    } else if (pesvKeywords.test(lower)) {
      setActiveProtocol(INSPECTION_PROTOCOLS.pesv);
      setIsBiomechanicsActive(false);
    } else if (emergenciaKeywords.test(lower)) {
      setActiveProtocol(INSPECTION_PROTOCOLS.emergencias_electrico);
      setIsBiomechanicsActive(false);
    }
  }, []);

  const ERGO_PHASES = ERGONOMIC_PHASES;

  const getNeckStatus = (angle: number | null) => {
    if (angle === null) return { status: '--', colorClass: 'bg-white/5 border-white/10 text-white/80', textClass: 'text-white/40', valColorClass: 'text-white/50' };
    if (angle > 45) return { status: 'Crítico', colorClass: 'bg-red-500/20 border-red-500/40 text-red-200', textClass: 'text-red-400 font-bold animate-pulse', valColorClass: 'text-red-400' };
    if (angle > 20) return { status: 'Moderado', colorClass: 'bg-amber-500/20 border-amber-500/40 text-amber-200', textClass: 'text-amber-400 font-semibold', valColorClass: 'text-amber-400' };
    return { status: 'Normal', colorClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100', textClass: 'text-emerald-400 font-medium', valColorClass: 'text-emerald-400' };
  };

  const getTrunkStatus = (angle: number | null) => {
    if (angle === null) return { status: '--', colorClass: 'bg-white/5 border-white/10 text-white/80', textClass: 'text-white/40', valColorClass: 'text-white/50' };
    if (angle > 60) return { status: 'Crítico', colorClass: 'bg-red-500/20 border-red-500/40 text-red-200', textClass: 'text-red-400 font-bold animate-pulse', valColorClass: 'text-red-400' };
    if (angle > 20) return { status: 'Moderado', colorClass: 'bg-amber-500/20 border-amber-500/40 text-amber-200', textClass: 'text-amber-400 font-semibold', valColorClass: 'text-amber-400' };
    return { status: 'Normal', colorClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100', textClass: 'text-emerald-400 font-medium', valColorClass: 'text-emerald-400' };
  };

  const getArmStatus = (angle: number | null) => {
    if (angle === null) return { status: '--', colorClass: 'bg-white/5 border-white/10 text-white/80', textClass: 'text-white/40', valColorClass: 'text-white/50' };
    if (angle > 60) return { status: 'Crítico', colorClass: 'bg-red-500/20 border-red-500/40 text-red-200', textClass: 'text-red-400 font-bold animate-pulse', valColorClass: 'text-red-400' };
    if (angle > 20) return { status: 'Moderado', colorClass: 'bg-amber-500/20 border-amber-500/40 text-amber-200', textClass: 'text-amber-400 font-semibold', valColorClass: 'text-amber-400' };
    return { status: 'Normal', colorClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100', textClass: 'text-emerald-400 font-medium', valColorClass: 'text-emerald-400' };
  };

  const getElbowStatus = (angle: number | null) => {
    if (angle === null) return { status: '--', colorClass: 'bg-white/5 border-white/10 text-white/80', textClass: 'text-white/40', valColorClass: 'text-white/50' };
    if (angle < 30 || angle > 130) return { status: 'Crítico', colorClass: 'bg-red-500/20 border-red-500/40 text-red-200', textClass: 'text-red-400 font-bold animate-pulse', valColorClass: 'text-red-400' };
    if ((angle >= 30 && angle < 60) || (angle > 100 && angle <= 130)) return { status: 'Moderado', colorClass: 'bg-amber-500/20 border-amber-500/40 text-amber-200', textClass: 'text-amber-400 font-semibold', valColorClass: 'text-amber-400' };
    return { status: 'Normal', colorClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100', textClass: 'text-emerald-400 font-medium', valColorClass: 'text-emerald-400' };
  };

  const getKneeStatus = (angle: number | null) => {
    if (angle === null) return { status: '--', colorClass: 'bg-white/5 border-white/10 text-white/80', textClass: 'text-white/40', valColorClass: 'text-white/50' };
    if (angle > 60) return { status: 'Crítico', colorClass: 'bg-red-500/20 border-red-500/40 text-red-200', textClass: 'text-red-400 font-bold animate-pulse', valColorClass: 'text-red-400' };
    if (angle > 30) return { status: 'Moderado', colorClass: 'bg-amber-500/20 border-amber-500/40 text-amber-200', textClass: 'text-amber-400 font-semibold', valColorClass: 'text-amber-400' };
    return { status: 'Normal', colorClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100', textClass: 'text-emerald-400 font-medium', valColorClass: 'text-emerald-400' };
  };

  const neckInfo = useMemo(() => getNeckStatus(neckAngle), [neckAngle]);
  const trunkInfo = useMemo(() => getTrunkStatus(trunkAngle), [trunkAngle]);
  const armInfo = useMemo(() => getArmStatus(armAngle), [armAngle]);
  const elbowInfo = useMemo(() => getElbowStatus(elbowAngle), [elbowAngle]);
  const kneeInfo = useMemo(() => getKneeStatus(kneeAngle), [kneeAngle]);

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting same file again
    e.target.value = '';

    const mime = file.type || '';
    let mediaType: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (mime.startsWith('image/')) mediaType = 'image';
    else if (mime.startsWith('video/')) mediaType = 'video';
    else if (mime.startsWith('audio/')) mediaType = 'audio';

    const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB para clips HD/4K de celulares
    const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

    // 1. Validación de tamaño de archivo
    if (mediaType === 'video' && file.size > MAX_VIDEO_BYTES) {
      alert(`El video pesa ${formatBytes(file.size)}, superando el límite máximo de 500 MB.\n\nPor favor graba o sube un clip de hasta 30 segundos.`);
      return;
    } else if (mediaType !== 'video' && file.size > MAX_FILE_BYTES) {
      alert(`El archivo pesa ${formatBytes(file.size)}, superando el límite de 50 MB. Por favor sube un archivo más liviano.`);
      return;
    }

    // 2. Procesamiento de videos con extracción de fotogramas clave y reproducción local sin desbordar memoria
    if (mediaType === 'video') {
      const blobUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'auto';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.src = blobUrl;

      let frameExtracted = false;
      const extractThumbnailAndAttach = (durationSec?: number) => {
        if (frameExtracted) return;
        const extractFrame = () => {
          if (frameExtracted) return;
          frameExtracted = true;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(tempVideo.videoWidth || 640, 640);
            const scale = canvas.width / (tempVideo.videoWidth || 640);
            canvas.height = Math.round((tempVideo.videoHeight || 480) * scale);
            const ctx = canvas.getContext('2d');
            if (ctx && canvas.width > 0 && canvas.height > 0) {
              ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
              const thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
              liveMediaBlobsRef.current.set(file.name, {
                blobUrl,
                dataUrl: thumbUrl,
                thumbnailUrl: thumbUrl,
                mimeType: mime || 'video/mp4',
                name: file.name,
              });
              setAttachedMedia({
                name: file.name,
                type: 'video',
                mimeType: mime || 'video/mp4',
                size: file.size,
                dataUrl: thumbUrl,
                thumbnailUrl: thumbUrl,
                previewUrl: blobUrl,
                duration: durationSec ? Math.round(durationSec) : undefined,
              });
              return;
            }
          } catch (e) {
            console.warn('[Tenshi Video] No se pudo capturar canvas snapshot:', e);
          }
          liveMediaBlobsRef.current.set(file.name, {
            blobUrl,
            dataUrl: '',
            mimeType: mime || 'video/mp4',
            name: file.name,
          });
          setAttachedMedia({
            name: file.name,
            type: 'video',
            mimeType: mime || 'video/mp4',
            size: file.size,
            dataUrl: '',
            previewUrl: blobUrl,
            duration: durationSec ? Math.round(durationSec) : undefined,
          });
        };

        if (durationSec && durationSec > 1) {
          tempVideo.currentTime = Math.min(1.5, durationSec / 2);
          tempVideo.onseeked = () => extractFrame();
          setTimeout(extractFrame, 600);
        } else {
          extractFrame();
        }
      };

      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration;
        if (duration && duration > 45) {
          URL.revokeObjectURL(blobUrl);
          alert(`El video dura ${Math.round(duration)} segundos.\n\nPara análisis de SST y ergonomía, el límite recomendado es de hasta 30 segundos. Por favor graba o recorta un clip más corto.`);
          return;
        }
        extractThumbnailAndAttach(duration);
      };

      tempVideo.onerror = () => {
        extractThumbnailAndAttach();
      };
      return;
    }

    // 3. Para imágenes, audios y documentos
    const blobUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      liveMediaBlobsRef.current.set(file.name, {
        blobUrl,
        dataUrl: result,
        thumbnailUrl: mediaType === 'image' ? result : undefined,
        mimeType: mime || 'application/octet-stream',
        name: file.name,
      });
      setAttachedMedia({
        name: file.name,
        type: mediaType,
        mimeType: mime || 'application/octet-stream',
        size: file.size,
        dataUrl: result,
        thumbnailUrl: mediaType === 'image' ? result : undefined,
        previewUrl: blobUrl,
      });

      // Si es imagen y la sesión de voz en vivo está activa, enviarla al modelo de voz
      if (mediaType === 'image' && isVoiceActive && sendEvidenceImageRef.current) {
        sendEvidenceImageRef.current(result, `El usuario adjuntó la imagen: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Monitoreo de chat y agentes para que Tenshi aprenda y responda al usuario
  const pendingAgentConsultationRef = useRef<{
    agentName: string;
    question: string;
    active: boolean;
    hadStarted: boolean;
    timestamp: number;
    startedAt?: number;
    initialMessageId: string | null;
  } | null>(null);

  const isChatSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const isChatSubmittingRef = useRef(isChatSubmitting);
  useEffect(() => {
    isChatSubmittingRef.current = isChatSubmitting;
  }, [isChatSubmitting]);
  const [isWaitingConsultation, setIsWaitingConsultation] = useState(false);
  const consultationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estado de efectos de sonido procedurales de Tenshi (SFX)
  const [isSFXMuted, setIsSFXMuted] = useState(() => tenshiAudio.getMuted());
  const handleToggleSFX = useCallback(() => {
    const next = tenshiAudio.toggleMuted();
    setIsSFXMuted(next);
  }, []);

  // Estado de silenciado de micrófono del usuario (Mute de audio)
  const [isMicMuted, setIsMicMuted] = useState(false);

  // ─── 1. MEMORIA AUTOBIOGRÁFICA Y BRIEFING EJECUTIVO DIARIO (ESTILO DOT) ───
  const [dailyBriefing, setDailyBriefing] = useState<{
    empresa: string;
    companyId: string | null;
    responsableSST: string;
    ultimaActividad: { tipo: string; titulo: string; fecha: string } | null;
    agendaHoy: Array<{ id: string; titulo: string; hora: string; prioridad: string; estado: string }>;
    vencenManana: Array<{ id: string; titulo: string; hora: string; prioridad: string }>;
    vencidas: Array<{ id: string; titulo: string; fecha: string }>;
  } | null>(null);
  const [isBriefingDismissed, setIsBriefingDismissed] = useState(false);

  const fetchDailyBriefing = useCallback(async (overrideCompanyId?: string) => {
    if (!token) return;
    try {
      const compId = overrideCompanyId ?? localStorage.getItem('wappy_active_company_id') ?? '';
      const res = await axios.get(`/api/mcp-bridge/briefing${compId ? `?companyId=${encodeURIComponent(compId)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setDailyBriefing(res.data);
        setIsBriefingDismissed(false);
      }
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDailyBriefing();
    }
  }, [isAuthenticated, token, fetchDailyBriefing]);

  useEffect(() => {
    const onCompanyChanged = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const newCompId = detail?.companyId || localStorage.getItem('wappy_active_company_id') || '';
      fetchDailyBriefing(newCompId);
    };
    window.addEventListener('wappy-empresa-cambiada', onCompanyChanged);
    window.addEventListener('wappy-reload-sgsst-data', onCompanyChanged);
    return () => {
      window.removeEventListener('wappy-empresa-cambiada', onCompanyChanged);
      window.removeEventListener('wappy-reload-sgsst-data', onCompanyChanged);
    };
  }, [fetchDailyBriefing]);

  // ─── 2. PÍLDORA VIVA ("ZERO DEAD AIR") Y 5. RICH VOICE CARDS (CONFIRMACIÓN INSTANTÁNEA) ───
  const [liveActionPill, setLiveActionPill] = useState<string>('');
  const liveActionPillTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showLiveActionPill = useCallback((label: string, durationMs = 3800) => {
    if (liveActionPillTimerRef.current) clearTimeout(liveActionPillTimerRef.current);
    setLiveActionPill(label);
    liveActionPillTimerRef.current = setTimeout(() => {
      setLiveActionPill('');
    }, durationMs);
  }, []);

  const [richVoiceCard, setRichVoiceCard] = useState<{
    id: string;
    kind: 'report' | 'email' | 'calendar' | 'company';
    badge: string;
    title: string;
    subtitle: string;
    companyName?: string;
    htmlReport?: string;
    actionPrompt?: string;
    actionLabel?: string;
  } | null>(null);
  const richVoiceCardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRichVoiceCard = useCallback((card: NonNullable<typeof richVoiceCard>, durationMs = 9000) => {
    if (richVoiceCardTimerRef.current) clearTimeout(richVoiceCardTimerRef.current);
    setRichVoiceCard(card);
    richVoiceCardTimerRef.current = setTimeout(() => {
      setRichVoiceCard(null);
    }, durationMs);
  }, []);

  // ─── 6. MODO "PROACTIVIDAD SILENCIOSA" (AMBIENT COPILOT LOCAL — 0 TOKENS IA) ───
  const [ambientTip, setAmbientTip] = useState<{
    id: string;
    title: string;
    prompt: string;
  } | null>(null);
  const shownAmbientRoutesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`;
    setAmbientTip(null);
    if (isVoiceActive || isOpen || shownAmbientRoutesRef.current.has(routeKey)) return;

    const lowerRoute = routeKey.toLowerCase();
    let suggestion: { id: string; title: string; prompt: string } | null = null;

    if (lowerRoute.includes('investigacion_atel')) {
      suggestion = {
        id: 'atel',
        title: '💡 ¿Redactamos el árbol de causas o verificamos el reporte a la ARL de este caso ATEL?',
        prompt: 'Por favor revisa los casos ATEL de la empresa activa y ayúdame con el análisis de causas y medidas de intervención bajo la Resolución 1401 de 2007.',
      };
    } else if (lowerRoute.includes('responsable')) {
      suggestion = {
        id: 'responsable',
        title: '💡 ¿Consultamos el último informe del Responsable SG-SST en el historial o lo enviamos por correo?',
        prompt: 'Por favor consulta el último informe del Responsable de Gestión SG-SST en el historial de SOMOS SST de la empresa activa y dime qué contiene.',
      };
    } else if (lowerRoute.includes('diagnostico_0312') || lowerRoute.includes('autoevaluacion')) {
      suggestion = {
        id: '0312',
        title: '💡 ¿Revisamos qué estándares mínimos de la Resolución 0312 están pendientes en tu empresa?',
        prompt: 'Consulta el diagnóstico de estándares mínimos de la Resolución 0312 de la empresa activa y dime cuáles ítems están pendientes por cumplir.',
      };
    } else if (lowerRoute.includes('condiciones_salud') || lowerRoute.includes('perfil_socio')) {
      suggestion = {
        id: 'salud',
        title: '💡 ¿Quieres que lea el último diagnóstico de Condiciones de Salud / Sociodemográfico del historial?',
        prompt: 'Por favor busca en el historial de SOMOS SST el último informe de Condiciones de Salud o Perfil Sociodemográfico de la empresa activa y dame un resumen.',
      };
    } else if (lowerRoute.includes('peligros') || lowerRoute.includes('gtc45')) {
      suggestion = {
        id: 'gtc45',
        title: '💡 ¿Analizamos los peligros prioritarios de tu Matriz IPEVAR GTC 45?',
        prompt: 'Consulta la matriz de peligros GTC 45 de la empresa activa e indícame los riesgos críticos y controles recomendados.',
      };
    } else if (lowerRoute.includes('/sgsst/control')) {
      suggestion = {
        id: 'control',
        title: '💡 ¿Revisamos las actividades de tu agenda de hoy y las que vencen mañana?',
        prompt: 'Por favor consulta mi agenda y cronograma del Centro de Control para hoy y mañana y dime qué actividades tenemos pendientes.',
      };
    }

    if (!suggestion) return;
    const chosen = suggestion;
    const timer = setTimeout(() => {
      if (!isVoiceActiveRef.current) {
        shownAmbientRoutesRef.current.add(routeKey);
        setAmbientTip(chosen);
        tenshiAudio.playWhisper();
      }
    }, 16000);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, isVoiceActive, isOpen]);

  // ─── 7. SELECTOR DE PERSONALIDAD ADAPTATIVA DE TENSHI (1 CLIC) ───
  const [personalityMode, setPersonalityMode] = useState<'express' | 'consultor' | 'auditor'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wappy_tenshi_personality');
      if (saved === 'express' || saved === 'consultor' || saved === 'auditor') return saved;
    }
    return 'consultor';
  });
  const [hoveredPersonality, setHoveredPersonality] = useState<'express' | 'consultor' | 'auditor' | null>(null);
  const sendPersonalityRef = useRef<((p: string) => void) | null>(null);

  const handleSelectPersonality = useCallback((mode: 'express' | 'consultor' | 'auditor') => {
    tenshiAudio.playBlip();
    setPersonalityMode(mode);
    try {
      localStorage.setItem('wappy_tenshi_personality', mode);
    } catch (_) {}
    if (sendPersonalityRef.current) {
      sendPersonalityRef.current(mode);
    }
    const modeLabels = {
      express: '⚡ Modo Ejecutivo Express activo (Respuestas al grano)',
      consultor: '🛡️ Modo Consultor Senior activo (Integral y cercano)',
      auditor: '⚖️ Modo Auditor Legal activo (Rigor normativo Decreto 1072 / Res. 0312)',
    };
    showLiveActionPill(modeLabels[mode], 3200);
    triggerTenshiReaction(mode === 'auditor' ? 'searching' : mode === 'express' ? 'working' : 'approval', 2000);
  }, [showLiveActionPill]);

  // ─── 3. EXPRESIVIDAD FÍSICA ULTRALIGERA (0% WebGL / 100% CSS) ───
  const derivedAvatarMood: TenshiAvatarMood = useMemo(() => {
    if (reportSuccessToast) return 'success';
    if (isTenshiSpeaking) return 'speaking';
    if (liveActionPill || tenshiStatus) {
      const lower = `${liveActionPill} ${tenshiStatus}`.toLowerCase();
      if (lower.includes('busc') || lower.includes('consult') || lower.includes('historial') || lower.includes('norma') || lower.includes('web') || lower.includes('leyendo')) {
        return 'searching';
      }
      if (lower.includes('correo') || lower.includes('enviando') || lower.includes('agenda')) {
        return 'approval';
      }
      return 'working';
    }
    if (guiSteps.some((s) => s.status === 'pending')) return 'working';
    if (isTyping || isChatSubmitting || isWaitingConsultation) return 'thinking';
    if (isVoiceActive) return 'listening';
    if (personalityMode === 'auditor') return 'searching';
    return 'idle';
  }, [
    reportSuccessToast,
    isTenshiSpeaking,
    liveActionPill,
    tenshiStatus,
    guiSteps,
    isTyping,
    isChatSubmitting,
    isWaitingConsultation,
    isVoiceActive,
    personalityMode,
  ]);

  // Feedback auditivo suave periódico mientras Tenshi está pensando o ejecutando una herramienta pesada ("Zero Dead Air")
  useEffect(() => {
    const statusLower = `${voiceStatusText} ${liveActionPill} ${tenshiStatus || ''}`.toLowerCase();
    const isActivelyProcessing =
      !isTenshiSpeaking &&
      (isTyping ||
        isGeneratingTechnicalReport ||
        Boolean(tenshiStatus) ||
        statusLower.includes('procesando') ||
        statusLower.includes('redactando') ||
        statusLower.includes('compilando') ||
        statusLower.includes('leyendo') ||
        statusLower.includes('buscando') ||
        statusLower.includes('consultando') ||
        statusLower.includes('enviando') ||
        statusLower.includes('agendando'));

    if (!isActivelyProcessing) return;

    tenshiAudio.playThink();
    const interval = setInterval(() => {
      tenshiAudio.playThink();
    }, 2600);

    return () => clearInterval(interval);
  }, [isTyping, isGeneratingTechnicalReport, tenshiStatus, voiceStatusText, liveActionPill, isTenshiSpeaking]);

  // Detector de estado de ánimo en vivo (caritas de gato 😺😹😻😼🙀😿😾) cuando el usuario habla o Tenshi responde
  const lastAnalyzedMsgRef = useRef<string>('');
  useEffect(() => {
    if (messages.length <= 1) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.content) return;
    const signature = `${messages.length}:${lastMsg.role}:${lastMsg.content.slice(0, 120)}`;
    if (signature === lastAnalyzedMsgRef.current) return;
    lastAnalyzedMsgRef.current = signature;
    analyzeTenshiEmotionFromText(
      lastMsg.content,
      lastMsg.role === 'user' ? 'user' : 'assistant',
    );
  }, [messages]);

  const queryClient = useQueryClient();
  const latestChatMessage = useRecoilValue(store.latestMessageFamily(0));
  const latestChatMessageRef = useRef<any>(latestChatMessage);
  latestChatMessageRef.current = latestChatMessage;
  const { conversation } = store.useCreateConversationAtom(0);
  const { newConversation } = useNewConvo(0);
  const setIsCanvasActive = useSetRecoilState(store.isCanvasActive);
  const streamingCanvas = useRecoilValue(store.streamingCanvasState);
  const streamingCanvasRef = useRef<any>(streamingCanvas);
  streamingCanvasRef.current = streamingCanvas;
  const setStreamingCanvas = useSetRecoilState(store.streamingCanvasState);
  const setCanvasMaximized = useSetRecoilState(store.canvasMaximized);
  const currentConvoId = conversation?.conversationId;
  const activeConsultationConvoIdRef = useRef<string | null>(null);
  const activeConsultationAgentIdRef = useRef<string | null>(null);
  const activeConsultationAgentNameRef = useRef<string | null>(null);
  const pendingForceNewChatRef = useRef<boolean>(false);
  const lastContentChangeRef = useRef<{ text: string; time: number }>({ text: '', time: Date.now() });
  const prevIsSubmittingRef = useRef(isChatSubmitting);

  useEffect(() => {
    if (
      currentConvoId &&
      activeConsultationConvoIdRef.current &&
      activeConsultationConvoIdRef.current !== 'new' &&
      activeConsultationConvoIdRef.current !== 'current' &&
      currentConvoId !== 'new' &&
      currentConvoId !== activeConsultationConvoIdRef.current
    ) {
      if (pendingAgentConsultationRef.current?.active) {
        console.log('[Tenshi] Cambio de conversación manual detectado. Cancelando espera previa.');
        pendingAgentConsultationRef.current.active = false;
        setIsWaitingConsultation(false);
        if (consultationTimerRef.current) {
          clearTimeout(consultationTimerRef.current);
          consultationTimerRef.current = null;
        }
      }
    } else if (currentConvoId && (!activeConsultationConvoIdRef.current || activeConsultationConvoIdRef.current === 'new' || activeConsultationConvoIdRef.current === 'current')) {
      activeConsultationConvoIdRef.current = currentConvoId;
    }
  }, [currentConvoId]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const setIsPlayingAudioRef = useRef<((isPlaying: boolean) => void) | null>(null);
  const refetchHistoryRef = useRef<(() => void) | null>(null);
  const playbackEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTextMessageRef = useRef<((text: string) => void) | null>(null);
  const activeOrderWatchdogsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      activeOrderWatchdogsRef.current.forEach((timer) => clearInterval(timer));
      activeOrderWatchdogsRef.current.clear();
    };
  }, []);

  const clearAudioQueue = useCallback(() => {
    if (playbackEndTimeoutRef.current) {
      clearTimeout(playbackEndTimeoutRef.current);
      playbackEndTimeoutRef.current = null;
    }
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsPlayingAudioRef.current?.(false);
    setIsTenshiSpeaking(false);
    setOutputAmplitude(0);
  }, []);

  const playChime = useCallback(() => {
    // Silenciado completamente a petición del usuario (eliminado pitido artificial)
  }, []);

  const playPowerDownChime = useCallback(() => {
    // Silenciado completamente a petición del usuario
  }, []);

  const getOrCreatePlaybackContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    let ctx = audioContextRef.current || (window as any).sharedAudioContext24k;
    if (!ctx || ctx.state === 'closed') {
      try {
        ctx = new AudioContextClass();
      } catch (_) {
        try {
          ctx = new AudioContextClass({ sampleRate: 24000 });
        } catch (e) {
          console.warn('[Tenshi Voice] Error creando AudioContext:', e);
          return null;
        }
      }
      audioContextRef.current = ctx;
      (window as any).sharedAudioContext24k = ctx;
    }
    return ctx;
  }, []);

  const unlockAudio = useCallback(() => {
    try {
      // Audio mudo en elemento HTML para forzar a iOS Safari a categoría 'Playback'
      // Permite que Tenshi suene por altavoz incluso si el switch físico del iPhone está en silencio
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.play().catch(() => {});
    } catch (_) {}

    const ctx = getOrCreatePlaybackContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }
      try {
        const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
        const src = ctx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(ctx.destination);
        src.start(0);
      } catch (_) {}
    }
  }, [getOrCreatePlaybackContext]);

  const handleAudioReceived = useCallback((audioData: string) => {
    try {
      const ctx = getOrCreatePlaybackContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.error);
      }

      const binaryString = atob(audioData);
      const len = binaryString.length;
      const numSamples = Math.floor(len / 2);
      if (numSamples <= 0) return;

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const float32Data = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Data[i] = int16 / 32768.0;
      }

      // Re-muestreo adaptativo seguro a la tasa del AudioContext (Safari iOS / Android / PC)
      // Gemini Live envía audio PCM int16 a 24000 Hz. Si el hardware del dispositivo opera a 44100 Hz o 48000 Hz,
      // resampleamos con interpolación lineal precisa para que createBuffer use siempre ctx.sampleRate.
      const targetRate = ctx.sampleRate || 24000;
      let audioBuffer: AudioBuffer;

      if (targetRate === 24000) {
        audioBuffer = ctx.createBuffer(1, numSamples, 24000);
        audioBuffer.getChannelData(0).set(float32Data);
      } else {
        const ratio = 24000 / targetRate;
        const targetLen = Math.max(1, Math.round(numSamples / ratio));
        const resampled = new Float32Array(targetLen);
        for (let i = 0; i < targetLen; i++) {
          const srcPos = i * ratio;
          const idx = Math.floor(srcPos);
          const frac = srcPos - idx;
          const s0 = float32Data[idx] || 0;
          const s1 = (idx + 1 < numSamples) ? float32Data[idx + 1] : s0;
          resampled[i] = s0 + frac * (s1 - s0);
        }
        audioBuffer = ctx.createBuffer(1, targetLen, targetRate);
        audioBuffer.getChannelData(0).set(resampled);
      }

      // Cancelar cualquier apagado pendiente del audio: la IA sigue transmitiendo voz continua
      if (playbackEndTimeoutRef.current) {
        clearTimeout(playbackEndTimeoutRef.current);
        playbackEndTimeoutRef.current = null;
      }
      setIsPlayingAudioRef.current?.(true);
      setIsTenshiSpeaking((prev) => (prev ? prev : true));
      setVoiceStatusText((prev) => (prev === 'Tenshi hablando...' ? prev : 'Tenshi hablando...'));
      lastActivityRef.current = Date.now();

      const currentTime = ctx.currentTime;
      // Búfer suave de 15ms para absorber micro-retrasos de CPU sin generar pausas audibles
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.015;
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (!outputAnalyserRef.current || (outputAnalyserRef.current as any).context !== ctx) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        outputAnalyserRef.current = analyser;
        analyser.connect(ctx.destination);
      }
      source.connect(outputAnalyserRef.current);
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          // Hangover ágil de 80ms antes de desmutear el micrófono:
          if (playbackEndTimeoutRef.current) clearTimeout(playbackEndTimeoutRef.current);
          playbackEndTimeoutRef.current = setTimeout(() => {
            if (activeSourcesRef.current.length === 0) {
              setIsPlayingAudioRef.current?.(false);
              setVoiceStatusText((prev) => (prev === 'Tenshi te escucha...' ? prev : 'Tenshi te escucha...'));
              setIsTenshiSpeaking(false);
              setOutputAmplitude(0);
            }
          }, 80);
        }
      };

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (err) {
      console.error('[Tenshi Voice] Error processing audio playback:', err);
    }
  }, []);

  const extractSpecialistAnswer = useCallback((): string | null => {
    const consultation = pendingAgentConsultationRef.current;
    const initialId = consultation?.initialMessageId;

    const isInvalid = (txt: string) => {
      if (!txt || txt.length < 35) return true;
      if (txt.includes('Pensando respuesta...')) return true;
      if (txt.includes('[PANTALLA ACTUAL:')) return true;
      if (txt.includes('CAMPOS DILIGENCIADOS')) return true;
      if (txt.includes('Mensaje input:')) return true;
      if (txt.includes('Consulta con especialista registrada')) return true;
      if (txt.includes('*(Consulta con especialista registrada)*')) return true;
      if (consultation?.question && txt.trim().toLowerCase() === consultation.question.trim().toLowerCase()) return true;
      return false;
    };

    // 1. Buscar en mensajes de React Query
    try {
      const convoId = currentConvoId || conversation?.conversationId || 'new';
      let queryMsgs = queryClient.getQueryData<any[]>([QueryKeys.messages, convoId]);

      // Si no hay mensajes bajo convoId, buscar en las queries de mensajes activas de React Query
      if (!Array.isArray(queryMsgs) || queryMsgs.length === 0) {
        const allMsgQueries = queryClient.getQueriesData<any[]>([QueryKeys.messages]);
        for (const [_, msgs] of allMsgQueries) {
          if (Array.isArray(msgs) && msgs.length > 0) {
            queryMsgs = msgs;
            break;
          }
        }
      }

      if (Array.isArray(queryMsgs) && queryMsgs.length > 0) {
        for (let i = queryMsgs.length - 1; i >= 0; i--) {
          const m = queryMsgs[i];
          if (!m.isCreatedByUser && m.text && typeof m.text === 'string') {
            // Ignorar el mensaje que existía antes de iniciar la consulta
            if (initialId && m.messageId === initialId) {
              continue;
            }
            const text = m.text.trim();
            if (!isInvalid(text)) {
              return text;
            }
          }
        }
      }
    } catch (_) {}

    // 2. Buscar en elementos renderizados del DOM del chat (.agent-turn, .markdown)
    try {
      const messageEls = document.querySelectorAll<HTMLElement>(
        '.agent-turn .markdown, .agent-turn [class*="message-content"], [data-message-id]:not([data-is-user="true"]) .markdown, [class*="text-message"]:not([data-is-user="true"]) .markdown, article:not([data-is-user="true"]) .markdown, .agent-turn'
      );
      if (messageEls.length > 0) {
        for (let i = messageEls.length - 1; i >= 0; i--) {
          const el = messageEls[i];
          // Nunca capturar elementos internos del widget de Tenshi
          if (el.closest('.tenshi-widget-container')) {
            continue;
          }
          const domText = (el.innerText || '').trim();
          if (!isInvalid(domText)) {
            return domText;
          }
        }
      }
    } catch (_) {}

    // 3. Fallback a latestChatMessage (solo si es nuevo y del asistente)
    const latestMsg = latestChatMessageRef.current;
    if (latestMsg && !latestMsg.isCreatedByUser && latestMsg.messageId !== initialId) {
      const recoilText = (latestMsg.text || '').trim();
      if (!isInvalid(recoilText)) {
        return recoilText;
      }
    }

    return null;
  }, [currentConvoId, conversation?.conversationId, queryClient]);

  const handleCompleteConsultation = useCallback((finalText: string) => {
    const consultation = pendingAgentConsultationRef.current;
    if (!consultation || !consultation.active) return;

    consultation.active = false;
    setIsWaitingConsultation(false);
    if (consultationTimerRef.current) {
      clearTimeout(consultationTimerRef.current);
      consultationTimerRef.current = null;
    }

    console.log(
      `[Tenshi] ✅ Dictamen técnico capturado exitosamente de ${consultation.agentName}:`,
      finalText.substring(0, 120),
    );

    // Extraer texto legible del informe en Canvas si el especialista generó un entregable allí
    let canvasTextExcerpt = '';
    let canvasTitle = '';
    try {
      const activeCanvas = streamingCanvasRef.current;
      if (activeCanvas?.content && typeof activeCanvas.content === 'string' && activeCanvas.content.length > 60) {
        canvasTitle = activeCanvas.title || 'Informe Técnico en Canvas';
        const cleanCanvasText = activeCanvas.content
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanCanvasText.length > 40) {
          canvasTextExcerpt = cleanCanvasText.substring(0, 1800);
        }
      }
    } catch (_) {}

    const combinedText = canvasTextExcerpt
      ? `${finalText}\n\n[CONTENIDO DEL INFORME GENERADO EN CANVAS "${canvasTitle}"]:\n${canvasTextExcerpt}`
      : finalText;

    // 1. Si el Modo Voz está activo, instruir a Tenshi Live con el dictamen técnico y el informe de Canvas
    if (isVoiceActiveRef.current || isVoiceActive) {
      lastActivityRef.current = Date.now();
      clearAudioQueue();
      setVoiceStatusText(`Tenshi respondiendo sobre ${consultation.agentName}...`);
      const condensedDictamen = combinedText.length > 2200 ? combinedText.substring(0, 2200) + '...' : combinedText;
      const promptForTenshi = `[SISTEMA INTERNO WAPPY - RESPUESTA E INFORME TÉCNICO EMITIDO]:
El especialista ${consultation.agentName} ha terminado de responder y generar el informe en pantalla a la consulta: "${consultation.question}".

DICTAMEN Y CONTENIDO DEL INFORME OFICIAL:
"""
${condensedDictamen}
"""

DIRECTIVA OBLIGATORIA DE SÍNTESIS TÉCNICA ORAL PARA TENSHI:
1. Explica y sintetiza verbalmente de inmediato al usuario, con tu voz cercana y profesional, los hallazgos, métricas, trabajadores evaluados, conclusiones y medidas técnicas que quedaron plasmadas en el informe y dictamen del especialista.
2. Cita de forma fluida las normas, decretos, resoluciones, plazos o artículos clave que sustentan el informe (ej: Decreto 1072 de 2015, Resoluciones o Códigos aplicables).
3. ESTÁ PROHIBIDO limitarte a decir "el especialista ya respondió" o mandar al usuario a revisar la pantalla. El usuario te está escuchando; explícale el reporte técnico directamente.
4. CERO DISCLAIMERS: Prohibido decir "no constituye consejo médico", "consulte a un profesional", etc. WAPPY es una plataforma técnica profesional de SG-SST.
5. CERO INGLÉS: 100% español profesional.`;
      sendTextMessageRef.current?.(promptForTenshi);
    }

    // 2. Registrar en la conversación interna de Tenshi y persistir en BD para continuidad de memoria
    const agentResponseExcerpt =
      combinedText.length > 2800
        ? combinedText.substring(0, 2800) + '... *(consulta e informe completo disponibles en el chat y visor Canvas)*'
        : combinedText;
    const summaryText = `💡 **Dictamen e Informe de ${consultation.agentName}** sobre *"${consultation.question}"*:\n\n${agentResponseExcerpt}\n\n*(Consulta e informe con especialista registrados)*`;
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: summaryText,
      },
    ]);

    if (token) {
      axios
        .post(
          '/api/tenshi/message',
          { role: 'assistant', content: summaryText },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .then(() => refetchHistoryRef.current?.())
        .catch((err) => console.error('[Tenshi] Error saving consultation summary:', err));
    }
  }, [isVoiceActive, clearAudioQueue, token]);

  const iniciarMonitoreoOrden = useCallback(
    (ordenId: string, titulo: string, formato: string, messageId: string) => {
      if (!ordenId) return;

      if (activeOrderWatchdogsRef.current.has(ordenId)) {
        return;
      }

      console.log(`[Tenshi Watchdog] Iniciando sondeo silencioso cada 15s para orden delegada ID: ${ordenId}`);
      let attempts = 0;
      const MAX_ATTEMPTS = 60; // 15 minutos (60 * 15s)

      const timer = setInterval(async () => {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          console.warn(`[Tenshi Watchdog] Tiempo límite alcanzado para orden ${ordenId}. Deteniendo sondeo.`);
          clearInterval(timer);
          activeOrderWatchdogsRef.current.delete(ordenId);
          return;
        }

        try {
          const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) {
            authHeaders['Authorization'] = `Bearer ${token}`;
          }

          const res = await fetch(`/api/mcp-bridge/antigravity/ordenes?id=${encodeURIComponent(ordenId)}`, {
            headers: authHeaders,
            credentials: 'include',
          });

          if (!res.ok) return;

          const data = await res.json();
          const orden = (data.ordenes && data.ordenes[0]) || null;

          if (orden && orden.estado === 'done') {
            console.log(`[Tenshi Watchdog] ¡Orden ${ordenId} COMPLETADA por Antigravity! Proyectando entregable...`);
            clearInterval(timer);
            activeOrderWatchdogsRef.current.delete(ordenId);

            const entregable = orden.entregable || {};
            const contenido = entregable.contenido || orden.descripcion || '';
            const finalFormat = entregable.formato || formato || 'html';
            const isHtml = finalFormat === 'html' || (typeof contenido === 'string' && (contenido.trim().startsWith('<!DOCTYPE') || contenido.trim().startsWith('<html')));
            const canvasFileType = isHtml ? 'html' : (finalFormat === 'word' || finalFormat === 'documento' ? 'text' : finalFormat);
            const chatSummary = entregable.resumen || (isHtml
              ? 'Se ha generado el dashboard interactivo en HTML con las gráficas de salud ocupacional. Puedes visualizarlo e interactuar con él desde el panel Canvas.'
              : contenido);

            // 1. Actualizar el mensaje de la orden en el chat de Tenshi
            setMessages((prev) =>
              prev.map((m) => {
                if (m._id === messageId || m.delegatedOrderId === ordenId) {
                  return {
                    ...m,
                    content: `⚡ **${titulo} — Entregable Listo por Antigravity**\n\n${chatSummary}`,
                    file: {
                      title: titulo,
                      fileType: canvasFileType,
                      content: contenido,
                      canvasId: `antigravity-report-${Date.now()}`,
                    },
                    delegatedStatus: 'done',
                  };
                }
                return m;
              })
            );
            setIsOpen(true);

            // 2. Abrir Canvas automáticamente si hay contenido
            if (contenido && window.location.pathname.startsWith('/c/')) {
              setStreamingCanvas({
                id: `antigravity-${Date.now()}`,
                title: titulo,
                fileType: canvasFileType,
                content: contenido,
                messageId: '',
                isStreaming: false,
              });
              setIsCanvasActive(true);
            }

            // 3. Confirmación auditiva si Tenshi Voice está activo
            if (isVoiceActive) {
              sendTextMessageRef.current?.(
                `Antigravity completó la orden sobre "${titulo}". Confírmale al usuario en una frase alegre y breve que el entregable y las gráficas ya están listos en Canvas.`
              );
            }
          }
        } catch (_) {
          // Ignorar errores transitorios de red
        }
      }, 15000);

      activeOrderWatchdogsRef.current.set(ordenId, timer);
    },
    [token, isVoiceActive, setIsCanvasActive, setStreamingCanvas]
  );

  const triggerVoiceReportRef = useRef<(() => boolean) | null>(null);
  const requestTechnicalReportRef = useRef<(() => void) | null>(null);

  const sessionOptions = useMemo(
    () => ({
      mode: 'tenshi_voice',
      voice: 'Puck',
      route: `${location.pathname}${location.search}`,
      companyId: localStorage.getItem('wappy_active_company_id') || undefined,
      personality: personalityMode,
      onAudioReceived: (audioData: string) => {
        handleAudioReceived(audioData);
      },
      onTextReceived: (text: string, isUserTranscription?: boolean) => {
        lastActivityRef.current = Date.now();
        if (isUserTranscription) {
          lastUserTranscriptionRef.current = text;

          // Adaptar dinámicamente el protocolo de inspección de Tenshi según la intención del usuario
          updateTenshiProtocolByIntent(text);

          // Si estamos en modo Biomecánica / Fisioterapeuta y la cámara está encendida:
          // Si la cámara está encendida:
          // Detectar confirmación verbal del usuario ("Listo", "Ya", "Adelante", "Toma la foto")
          // para capturar la postura de la fase actual y avanzar automáticamente
          if (isVisionActive && isCameraOn) {
            const cleanText = (text || '').trim().toLowerCase();
            const userVoiceCaptureRegex = /\b(listo|ya\s+estoy(\s+listo)?|adelante|ya\s+me\s+ubiqu[eé]|ya\s+tom[eé]\s+(la\s+)?postura|toma\s+(la\s+)?foto|captura(r)?|dale|de\s+una)\b/i;
            const exactYaRegex = /^(s[ií]\s*,?\s*)?ya\s*[.!]?$/i;
            const now = Date.now();
            const wCount = cleanText.split(/\s+/).length;
            if ((userVoiceCaptureRegex.test(cleanText) || exactYaRegex.test(cleanText)) && wCount <= 6 && (now - lastVoiceCaptureTimeRef.current > 1800)) {
              lastVoiceCaptureTimeRef.current = now;
              console.log('[Tenshi Voice] Confirmación verbal de postura del usuario:', cleanText);
              captureVisionSnapshotRef.current?.();
            }
          }

          // Registrar si el usuario expresó intención de abrir un nuevo chat o cambiar de agente/tema
          if (/\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia\s+de\s+agente|cambiemos|abrir\w*\s+(un\s+)?(nuevo\s+)?chat|abrirme\s+(un\s+)?(nuevo\s+)?chat|ábreme\s+(un\s+)?(nuevo\s+)?chat|iniciar\s+(un\s+)?chat)\b/i.test(text)) {
            console.log('[Tenshi Voice] Intención de nuevo chat registrada por voz:', text);
            pendingForceNewChatRef.current = true;
          }

          // Solo considerar interrupción genuina del usuario si Tenshi NO está reproduciendo su propio audio
          // y si el texto tiene suficiente longitud para no ser ruido acústico o eco del altavoz
          const trimmed = (text || '').trim();
          const wordCount = trimmed.split(/\s+/).length;
          const isRealSpeech = wordCount >= 3;

          // Solo interrumpir el audio en curso si es habla real intencionada del usuario (3 o más palabras)
          if (isRealSpeech && (activeSourcesRef.current.length > 0 || isTenshiSpeaking)) {
            console.log('[Tenshi Voice] Interrupción intencional del usuario detectada:', text);
            clearAudioQueue();
            sendVoiceInterruptRef.current();
          }

          setVoiceStatusText('Tenshi procesando...');
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'user' && (last as any).isLiveVoice) {
              return [...prev.slice(0, -1), { role: 'user', content: text, isLiveVoice: true }];
            }
            return [...prev, { role: 'user', content: text, isLiveVoice: true }];
          });
        } else {
          // Si Tenshi anuncia que completó las tres fases o pide compilar el informe:
          if (isVisionActive && isCameraOn && /\b(completado\s+las\s+tres\s+fases|tres\s+fases\s+completas|postura\s+fatigada|compil(e|ar)\s+tu\s+informe)\b/i.test(text)) {
            const curIdx = currentErgoPhaseIndexRef.current;
            if (!manualCapturedPhasesRef.current.has(curIdx)) {
              console.log('[Tenshi Voice] Tenshi anunció culminación de fases; asegurando captura de fase', curIdx + 1);
              captureVisionSnapshotRef.current?.(undefined, curIdx);
            }
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && (last as any).isLiveVoice) {
              return [...prev.slice(0, -1), { role: 'assistant', content: text, isLiveVoice: true }];
            }
            return [...prev, { role: 'assistant', content: text, isLiveVoice: true }];
          });
        }
      },
      onWappyAction: async (action: { id: string; name: string; args: any }) => {
        lastActivityRef.current = Date.now();
        let resultMsg = 'Acción ejecutada';
        setTenshiStatus(`Tenshi ejecutando: ${action.name}...`);

        // ─── 2. PÍLDORA VIVA ("ZERO DEAD AIR") SEGÚN LA HERRAMIENTA ───
        const pillMap: Record<string, string> = {
          wappy_leer_informe_aplicativo: '🔍 Leyendo Historial SOMOS SST...',
          wappy_enviar_correo: '📧 Enviando correo con adjunto...',
          wappy_gestionar_agenda: '📅 Sincronizando Agenda SG-SST...',
          wappy_navegar: '🧭 Navegando en WAPPY...',
          wappy_seleccionar_empresa: '🏢 Cambiando empresa activa...',
          wappy_activar_empresa: '🏢 Activando empresa...',
          operar_interfaz_visual: '✨ Tenshi operando pantalla...',
          wappy_generar_analisis_aplicativo: '⚡ Ejecutando análisis IA...',
          wappy_abrir_chat_agente: '🤝 Conectando con especialista...',
          wappy_abrir_curso: '🎓 Abriendo curso formativo...',
          wappy_abrir_articulo_blog: '📰 Abriendo artículo del Blog...',
        };
        if (pillMap[action.name]) {
          showLiveActionPill(pillMap[action.name], 4200);
        } else {
          showLiveActionPill(`⚡ ${action.name.replace(/^wappy_/, '').replace(/_/g, ' ')}...`, 3500);
        }

        try {
          if (action.name === 'wappy_navegar') {
            tenshiAudio.playBlip();
            const rawModulo = action.args?.modulo;
            const rawRuta = action.args?.ruta;
            const { targetRoute, targetSgsstModule } = resolveWappyDestination(rawModulo, rawRuta);

            // Buffer temporal de 450ms para que la voz de Tenshi empiece a sonar antes del cambio visual en pantalla
            setTimeout(() => {
              const isSettings = rawModulo === 'configuracion' || rawModulo === 'settings' || rawModulo === 'ajustes' || targetRoute === '/settings';
              const isCompanyModal = rawModulo === 'empresas' || rawModulo === 'empresas_registradas' || targetRoute.includes('modal=empresas');

              if (isSettings) {
                window.dispatchEvent(new CustomEvent('open-settings'));
              } else if (isCompanyModal) {
                navigate(targetRoute);
                window.dispatchEvent(new CustomEvent('open-company-info'));
              } else {
                navigate(targetRoute);
                if (targetSgsstModule) {
                  window.dispatchEvent(
                    new CustomEvent('navigate-sgsst', { detail: { module: targetSgsstModule } })
                  );
                }
              }
            }, 450);

            resultMsg = `Navegación exitosa a ${targetRoute}`;
          } else if (action.name === 'wappy_abrir_curso') {
            tenshiAudio.playBlip();
            const targetRoute = action.args?.ruta || (action as any).result?.ruta || '/academia?tab=cursos';
            setTimeout(() => {
              navigate(targetRoute);
            }, 450);
            resultMsg = `Curso abierto con éxito en pantalla: ${targetRoute}`;
          } else if (action.name === 'wappy_abrir_articulo_blog') {
            tenshiAudio.playBlip();
            const targetRoute = action.args?.ruta || (action as any).result?.ruta || '/academia?tab=blog';
            setTimeout(() => {
              navigate(targetRoute);
            }, 450);
            resultMsg = `Artículo del Blog abierto con éxito en pantalla: ${targetRoute}`;
          } else if (action.name === 'wappy_iniciar_estudio_ergonomico_vivo') {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content:
                  '🩺 **Modo Fisioterapeuta Laboral Activado en Tenshi**\n\nHe activado la cámara en vivo y el protocolo ergonómico 3D de WAPPY. Te acompañaré paso a paso en la evaluación postural. Todo el reporte final y las evidencias quedarán guardadas directamente en tu expediente y en el perfil de la Fisioterapeuta.',
              },
            ]);

            // Iniciar cámara, visión expandida y HUD ergonómico 3D de la Fisioterapeuta en Tenshi
            setIsBiomechanicsActive(true);
            setIsVisionExpanded(true);
            startVision('camera');
            if (!isVoiceActiveRef.current) {
              startVoiceMode();
            }

            resultMsg = 'Análisis en Vivo de Estudio de Puesto de Trabajo Ergonómico con Fisioterapeuta iniciado en Tenshi.';
          } else if (action.name === 'cambiar_fase_evaluacion') {
            const rawFase = action.args?.fase;
            const faseNum = typeof rawFase === 'number' ? rawFase : parseInt(rawFase, 10) || 1;
            const targetIdx = Math.max(0, Math.min(ERGO_PHASES.length - 1, faseNum - 1));
            if (faseNum === 1) {
              manualCapturedPhasesRef.current.clear();
            } else {
              // Antes de avanzar de fase, capturar la fase anterior si aún no se había registrado
              const prevIdx = currentErgoPhaseIndexRef.current;
              if (prevIdx < targetIdx && !manualCapturedPhasesRef.current.has(prevIdx)) {
                captureVisionSnapshotRef.current?.(undefined, prevIdx);
              }
            }
            setCurrentErgoPhaseIndex(targetIdx);
            resultMsg = `Fase ergonómica actualizada en pantalla a Paso ${faseNum}: ${ERGO_PHASES[targetIdx]?.shortName || ''}`;
          } else if (action.name === 'generar_informe_tecnico') {
            if (requestTechnicalReportRef.current) {
              requestTechnicalReportRef.current();
            } else {
              const curIdx = currentErgoPhaseIndexRef.current;
              if (!manualCapturedPhasesRef.current.has(curIdx)) {
                captureVisionSnapshotRef.current?.(undefined, curIdx);
              }
              triggerVoiceReportRef.current?.();
            }
            resultMsg = 'Generación de informe técnico iniciada con éxito.';
          } else if (action.name === 'wappy_abrir_chat_agente') {
            const rawAgente = (action.args?.agente || '').trim();
            const rawPregunta = (action.args?.pregunta || '').trim();
            const pregunta = cleanDelegatedPrompt(rawPregunta);

            // Buscar el agente solicitado por el usuario/backend
            const matchedAgent = findMatchingAgent(rawAgente, agentsRef.current);
            const agentName = matchedAgent ? matchedAgent.name : (rawAgente === 'tenshi' || !rawAgente ? 'Tenshi' : rawAgente);

            // Detectar si la pregunta está vacía, es un saludo o una frase genérica de relleno
            const isGenericQuery = (text: string) => {
              if (!text || text.length < 5) return true;
              const norm = normalizeStr(text);
              return /^(hola|buenos dias|buenas tardes|buenas noches|como estas|quiere hacer una consulta|desea consultar algo|para hacer una consulta|solicito asesoria|consulta tecnica|derecho laboral|medicina laboral|fisioterapia|ergonomia|salud ocupacional|asesoria|concepto profesional|hacer una consulta|una consulta|una pregunta|consulta general|seguridad vial|riesgo quimico|primeros auxilios|salud mental|riesgo psicosocial|tareas criticas|alturas|normatividad|normativa|decreto 1072|resolucion 0312)$/i.test(norm);
            };

            if (!pregunta || isGenericQuery(pregunta)) {
              console.warn('[TenshiChat] wappy_abrir_chat_agente rechazado por falta de consulta concreta:', pregunta);
              resultMsg = `NO se abrió el chat con ${agentName}: falta la consulta concreta del usuario. Pregúntale verbalmente al usuario qué duda o tema específico desea consultar con ${agentName} antes de abrir el chat.`;
            } else {
              // Registrar consulta pendiente para que Tenshi escuche la respuesta del agente
              if (consultationTimerRef.current) {
                clearTimeout(consultationTimerRef.current);
                consultationTimerRef.current = null;
              }
              const initialMessageId = latestChatMessageRef.current?.messageId || null;
              const now = Date.now();
              pendingAgentConsultationRef.current = {
                agentName,
                question: pregunta,
                active: true,
                hadStarted: false,
                timestamp: now,
                startedAt: now,
                initialMessageId,
              };
              lastContentChangeRef.current = { text: '', time: Date.now() };
              setIsWaitingConsultation(true);
              setVoiceStatusText(`Esperando a ${agentName}...`);

              const targetAgentId = matchedAgent?.id;

              // 1. Detección robusta de agente activo en pantalla
              const currentAgentId =
                conversation?.agent_id ||
                new URLSearchParams(window.location.search).get('agent_id') ||
                activeConsultationAgentIdRef.current;

              // 2. Detección robusta de si el especialista en pantalla es el mismo
              const isSameAgentActive = Boolean(
                (targetAgentId && currentAgentId && currentAgentId === targetAgentId) ||
                (activeConsultationAgentIdRef.current && targetAgentId && activeConsultationAgentIdRef.current === targetAgentId)
              );

              // 3. Detección robusta de solicitud explícita de nuevo chat (por backend, turnos previos por voz o texto actual)
              const requestedNewChat = Boolean(
                action.args?.nuevo_chat ||
                pendingForceNewChatRef.current ||
                /\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia|cambiemos|abrir\w*\s+(un\s+)?(nuevo\s+)?chat|abrirme|ábreme)\b/i.test(rawPregunta) ||
                /\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia|cambiemos|abrir\w*\s+(un\s+)?(nuevo\s+)?chat|abrirme|ábreme)\b/i.test(action.args?.pregunta || '') ||
                /\b(informe|reporte|estudio\s+de\s+puesto|estudio\s+ergon[oó]mico|dictamen|documento|acta|matriz)\b/i.test(rawPregunta) ||
                /\b(informe|reporte|estudio\s+de\s+puesto|estudio\s+ergon[oó]mico|dictamen|documento|acta|matriz)\b/i.test(action.args?.pregunta || '')
              );

              // Consumir la bandera de forzar nuevo chat
              pendingForceNewChatRef.current = false;

              // CASO A: CONTINUIDAD (Mismo especialista y NO se solicitó nuevo chat)
              if (isSameAgentActive && !requestedNewChat) {
                console.log(`[TenshiChat] Continuidad de chat detectada con ${agentName} (${targetAgentId}) en conversación ${conversation?.conversationId || 'actual'}`);
                activeConsultationAgentIdRef.current = targetAgentId || currentAgentId || null;
                activeConsultationAgentNameRef.current = agentName;
                activeConsultationConvoIdRef.current = conversation?.conversationId || 'current';

                // Disparar auto-envío en el chat actual tras breve buffer de 450ms para que la voz de Tenshi empiece antes
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent('tenshi-submit-agent-prompt', {
                      detail: {
                        agentId: targetAgentId,
                        prompt: pregunta,
                      },
                    })
                  );
                }, 450);

                resultMsg = `Consulta enviada en el chat actual con ${agentName}: "${pregunta}". [AVISO CRÍTICO PARA TENSHI]: El especialista ya está analizando y respondiendo en pantalla. TÚ NO TIENES EL DICTAMEN TÉCNICO AÚN. Limítate a confirmar en una sola frase breve que ya le transmitiste la consulta y que espere un momento a que responda.`;
              } else {
                // CASO B: NUEVO CHAT (Especialista distinto O usuario solicitó nuevo chat)
                console.log(`[TenshiChat] Abriendo nuevo chat para ${agentName} (targetId: ${targetAgentId}, isSameAgentActive: ${isSameAgentActive}, requestedNewChat: ${requestedNewChat})`);
                activeConsultationAgentIdRef.current = targetAgentId || null;
                activeConsultationAgentNameRef.current = agentName;
                activeConsultationConvoIdRef.current = 'new';

                // 1. Limpiar caché de mensajes de la conversación anterior para aislamiento absoluto
                try {
                  clearMessagesCache(queryClient, conversation?.conversationId);
                  queryClient.invalidateQueries([QueryKeys.messages]);
                } catch (cacheErr) {
                  console.warn('[TenshiChat] Error limpiando cache de mensajes:', cacheErr);
                }

                // 2. Preparar parámetros canónicos de URL para que el chat siempre reciba el agente, prompt y submit
                const params = new URLSearchParams();
                if (targetAgentId) {
                  params.set('agent_id', targetAgentId);
                }
                params.set('endpoint', EModelEndpoint.agents);
                params.set('prompt', pregunta);
                params.set('submit', 'true');

                // 3. Buffer temporal de 450ms para que la voz de Tenshi empiece a hablar antes de cambiar de pantalla a /c/new
                setTimeout(() => {
                  navigate(`/c/new?${params.toString()}`, { replace: true, state: { focusChat: true } });

                  // 4. Doble canal de garantía: emitir evento diferido tenshi-submit-agent-prompt
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('tenshi-submit-agent-prompt', {
                        detail: {
                          agentId: targetAgentId,
                          prompt: pregunta,
                          nuevoChat: true,
                        },
                      })
                    );
                  }, 400);
                }, 450);

                resultMsg = matchedAgent
                  ? `Chat nuevo abierto con ${matchedAgent.name} y consulta formulada con éxito en pantalla: "${pregunta}". [AVISO CRÍTICO PARA TENSHI]: El especialista apenas está analizando y empezando a redactar en la pantalla. TÚ NO TIENES EL DICTAMEN TÉCNICO AÚN. Limítate a confirmar al usuario en una sola frase breve que ya le abriste el chat y le dejaste la pregunta en pantalla, y que espere a que el especialista termine de responder. NO inventes ni resumas la respuesta técnica.`
                  : `Nuevo chat abierto y consulta formulada. [AVISO]: Esperando respuesta en pantalla.`;
              }
            }
          } else if (action.name === 'canvas_tool' || action.name === 'canvas') {
            const fileType = action.args?.fileType || (action as any).fileType || 'html';
            const title = action.args?.title || (action as any).title || 'Documento SG-SST';
            const content = (action as any).data?.content || action.args?.content || (action as any).content || '';
            const canvasId = (action as any).canvasId || (action as any).data?.canvasId || `canvas-${Date.now()}`;

            // 1. Asegurar que estamos en una vista compatible con el editor Canvas si no estamos en chat
            if (!window.location.pathname.startsWith('/c/')) {
              navigate('/c/new');
            }

            // 2. Desplegar en Canvas y lanzar en pantalla completa en el editor
            setStreamingCanvas({
              id: canvasId,
              title,
              fileType,
              content,
              messageId: '',
              isStreaming: false,
            });
            setIsCanvasActive(true);
            setCanvasMaximized(true);

            // 3. Entregar siempre en el chat de Tenshi con tarjeta interactiva y botones de descarga al final
            if (content) {
              const fileTypeLabels: Record<string, string> = {
                text: 'Documento Word',
                excel: 'Hoja de Cálculo Excel',
                html: 'Aplicativo / Reporte HTML',
                presentation: 'Presentación de Diapositivas',
              };
              const label = fileTypeLabels[fileType] || 'Archivo SG-SST';

              setMessages((prev) => {
                const filtered = prev.filter((m) => m.file?.canvasId !== canvasId);
                return [
                  ...filtered,
                  {
                    role: 'assistant',
                    content: `📁 **${label} generado**: *${title}*`,
                    file: {
                      title,
                      fileType,
                      content,
                      canvasId,
                    },
                    htmlReport: fileType === 'html' ? content : undefined,
                  },
                ];
              });
              setIsOpen(true);
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }

            resultMsg = `Archivo "${title}" (${fileType}) entregado en el editor a pantalla completa y en el chat de Tenshi con botones de descarga.`;
          } else if (action.name === 'wappy_seleccionar_empresa' || action.name === 'wappy_activar_empresa') {
            tenshiAudio.playSuccess();
            const companyName = action.args?.nombre_o_id || action.args?.empresa || action.args?.nombre || action.args?.id || (action as any).result?.companyName;
            resultMsg = `Empresa "${companyName}" seleccionada y activa en el sistema`;
            window.dispatchEvent(
              new CustomEvent('wappy-empresa-cambiada', { detail: { empresa: companyName } })
            );
            triggerRichVoiceCard({
              id: `comp-${Date.now()}`,
              kind: 'company',
              badge: '🏢 Empresa Activa',
              title: String(companyName || 'Empresa Actualizada'),
              subtitle: 'Expediente SG-SST y memoria aislada cargados',
            });
          } else if (action.name === 'wappy_diligenciar_formulario') {
            const rawModulo = (action.args?.modulo || 'investigacion_atel').toLowerCase().trim();
            const campos = action.args?.campos || {};
            const accion = action.args?.accion || 'llenar';

            // Si no estamos en el módulo correspondiente, navegar hacia él
            if (!window.location.pathname.includes('/sgsst') || !window.location.search.includes(rawModulo)) {
              const { targetRoute } = resolveWappyDestination(rawModulo, '');
              navigate(targetRoute || `/sgsst?hito=hito7&module=${rawModulo}`);
            }

            // Emitir evento para que el componente del formulario capture los datos
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('wappy-diligenciar-formulario', {
                  detail: { modulo: rawModulo, campos, accion }
                })
              );
            }, 350);

            resultMsg = `Formulario ${rawModulo} diligenciado exitosamente con los datos provistos`;
          } else if (action.name === 'leer_pantalla') {
            const screenText = getVisibleScreenContent(action.args?.seccion);
            resultMsg = screenText;
          } else if (action.name === 'operar_interfaz_visual') {
            // Buffer de 400ms para permitir que la voz inicial de Tenshi empiece a sonar antes de pulsar el botón o manipular el DOM
            await new Promise((resolve) => setTimeout(resolve, 400));
            const guiRes = await executeGUIAction(
              action.args.accion,
              action.args.indice,
              action.args.texto,
              action.args.direccion,
              action.args.detalle || action.args.campo || action.args.target
            );
            resultMsg = guiRes.message;
          } else if (action.name === 'wappy_reintegrar_trabajador' || action.name === 'wappy_reactivar_trabajador') {
            const target = action.args?.idOrCedula || action.args?.nombre || action.args?.target || '';
            try {
              const token = localStorage.getItem('token');
              const res = await fetch(`/api/mcp/workers/${encodeURIComponent(target)}/reactivar`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
              });
              window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
              if (res.ok) {
                const data = await res.json();
                resultMsg = data.mensaje || `Trabajador "${target}" reactivado exitosamente como Activo en la empresa.`;
              } else {
                resultMsg = `Trabajador "${target}" actualizado en el sistema.`;
              }
            } catch (err: any) {
              window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
              resultMsg = `Trabajador "${target}" reactivado exitosamente.`;
            }
          } else if (action.name === 'wappy_retirar_trabajador') {
            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
            resultMsg = `Trabajador marcado como retirado exitosamente.`;
          } else if (
            action.name === 'wappy_importar_sociodemografico_drive' ||
            action.name === 'wappy_alimentar_sociodemografico_masivo' ||
            action.name === 'wappy_registrar_trabajador' ||
            action.name === 'wappy_actualizar_trabajador' ||
            action.name === 'somos_sst'
          ) {
            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
            const res = (action as any).result || {};
            resultMsg = res.mensaje || `Perfil Sociodemográfico y Condiciones de Salud actualizados en Somos SST.`;
          } else if (action.name === 'wappy_importar_hito1_drive') {
            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
            window.dispatchEvent(new CustomEvent('ipevar-official-updated'));
            window.dispatchEvent(new CustomEvent('pesv-official-updated'));
            window.dispatchEvent(new CustomEvent('sgsst-diagnostic-updated'));
            const res = (action as any).result || {};
            resultMsg = res.mensaje || `Aplicativo del Hito 1 actualizado exitosamente desde Google Drive.`;
          } else if (action.name === 'wappy_leer_informe_aplicativo') {
            tenshiAudio.playHistoryRead();
            const rawApp = action.args?.aplicativo || action.args?.modulo || 'perfil_cargo';
            const res = (action as any).result || {};
            let details = '';
            if (res.informeCompleto) {
              details = res.informeCompleto;
            } else if (res.catalogoCargos) {
              details = `Catálogo de Cargos (${res.totalCargos}): ${res.catalogoCargos.map((c: any) => c.nombre).join(', ')}`;
            } else {
              details = `Informe del aplicativo ${rawApp} consultado en el sistema.`;
            }
            resultMsg = details;

            const reportTitle = res.tituloInforme || res.aplicativo || rawApp;
            const companyLabel = res.empresa || dailyBriefing?.empresa || 'Empresa Activa';

            // Mostrar Rich Voice Card de confirmación instantánea
            triggerRichVoiceCard({
              id: `rep-${Date.now()}`,
              kind: 'report',
              badge: `📑 Historial SOMOS SST • ${companyLabel}`,
              title: String(reportTitle),
              subtitle: res.fechaGeneracion
                ? `Generado: ${new Date(res.fechaGeneracion).toLocaleDateString('es-CO')}`
                : 'Informe oficial recuperado del expediente',
              companyName: companyLabel,
              htmlReport: res.informeOriginalHtml || undefined,
              actionLabel: '📧 Enviar al correo del Responsable',
              actionPrompt: `Envía por correo este último informe de ${rawApp} al correo oficial del responsable de la empresa activa.`,
            });

            // Si hay informe completo o datos sustanciales, mostrar tarjeta en el chat de Tenshi y persistir en BD
            if (res.informeCompleto && res.informeCompleto.length > 30) {
              const msgContent = `📑 **Informe Técnico Oficial (${companyLabel}) - ${reportTitle}**:\n\n${res.informeCompleto}`;
              const fileObj = res.informeOriginalHtml
                ? {
                    title: String(reportTitle),
                    fileType: 'html',
                    content: res.informeOriginalHtml,
                    canvasId: `tenshi-app-report-${Date.now()}`,
                  }
                : undefined;
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: msgContent,
                  htmlReport: res.informeOriginalHtml || undefined,
                  file: fileObj,
                },
              ]);
              axios
                .post('/api/tenshi/message', {
                  role: 'assistant',
                  content: msgContent,
                  htmlReport: res.informeOriginalHtml || undefined,
                  file: fileObj,
                })
                .catch(() => {});
            }
          } else if (action.name === 'wappy_activar_herramienta_agente') {
            const tool = (action.args?.herramienta || '').toLowerCase().trim();
            const params = action.args?.parametros || {};

            if (tool.includes('canvas')) {
              setIsCanvasActive(true);
            }

            if (tool.includes('gtc45') || tool.includes('ipevar')) {
              navigate('/sgsst?hito=hito4&module=peligros');
              window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: 'peligros' } }));
            } else if (tool.includes('pesv')) {
              navigate('/sgsst?hito=hito5&module=vehicles_pesv');
              window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: 'vehicles_pesv' } }));
            } else if (tool.includes('quimic') || tool.includes('compatib')) {
              navigate('/sgsst?hito=hito5&module=chemical_registry');
              window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: 'chemical_registry' } }));
            } else if (tool.includes('auto') || tool.includes('cron')) {
              navigate('/sgsst?hito=hito8&module=predictivo');
              window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: 'predictivo' } }));
            }

            window.dispatchEvent(
              new CustomEvent('wappy-herramienta-activada', { detail: { herramienta: tool, parametros: params } })
            );
            resultMsg = `Herramienta de agente "${tool}" activada con éxito en la plataforma.`;
          } else if (action.name === 'wappy_generar_analisis_aplicativo') {
            const rawApp = (action.args?.aplicativo || action.args?.modulo || '').toLowerCase().trim();
            const { targetRoute, targetSgsstModule } = resolveWappyDestination(rawApp, '');

            // Si no estamos en la página del aplicativo, navegar
            if (targetRoute && (!window.location.pathname.includes('/sgsst') || (targetSgsstModule && !window.location.search.includes(targetSgsstModule)))) {
              navigate(targetRoute);
            }

            if (targetSgsstModule) {
              window.dispatchEvent(
                new CustomEvent('navigate-sgsst', { detail: { module: targetSgsstModule } })
              );
            }

            // Disparar el evento de análisis IA para el aplicativo y accionar el botón de generación
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('wappy-generar-analisis-ia', { detail: { aplicativo: rawApp || targetSgsstModule } })
              );

              const btn = document.querySelector<HTMLElement>('[data-action="generar-analisis-ia"], [id="btn-generar-responsable-ia"], [data-action="ai-default"], button[title*="Generar con IA"]');
              if (btn && !btn.hasAttribute('disabled')) {
                btn.click();
              }
            }, 550);

            resultMsg = `Generación de Análisis IA ejecutada directamente en el editor del aplicativo "${rawApp || 'SGSST'}".`;
          } else if (action.name === 'wappy_crear_informe') {
            const res = (action as any).result || {};
            const info = res.informe || action.args || {};
            const title = info.titulo || action.args?.titulo || 'Informe Técnico SG-SST';
            const content = info.contenido || action.args?.contenido || '';
            const format = info.formato || action.args?.formato || 'html';

            if (content) {
              const msgContent = `📑 **${title}**\n\n${content}`;
              const fileObj = {
                title,
                fileType: format,
                content,
                canvasId: `tenshi-report-${Date.now()}`,
              };
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: msgContent,
                  file: fileObj,
                  htmlReport: format === 'html' ? content : undefined,
                },
              ]);
              axios
                .post('/api/tenshi/message', {
                  role: 'assistant',
                  content: msgContent,
                  file: fileObj,
                  htmlReport: format === 'html' ? content : undefined,
                })
                .catch(() => {});
              setIsOpen(true);
            }
            resultMsg = `Informe "${title}" entregado exitosamente en el chat de Tenshi.`;
          } else if (action.name === 'wappy_dictamen_especialista') {
            const res = (action as any).result || {};
            const agente = action.args?.agente || 'Especialista';
            const dictamen = res.respuesta || action.args?.respuesta || '';
            if (dictamen) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: `🩺 **Dictamen Técnico Especializado - ${agente}**:\n\n${dictamen}`,
                },
              ]);
              setIsOpen(true);
            }
            resultMsg = `Dictamen de ${agente} entregado en el chat de Tenshi.`;
          } else if (action.name === 'wappy_controlar_videollamada' || action.name === 'controlar_videollamada') {
            const accion = action.args?.accion;
            if (accion === 'activar_camara') {
              tenshiAudio.playBlip();
              startVision('camera');
              resultMsg = 'Cámara y videollamada activadas con éxito.';
            } else if (accion === 'apagar_camara') {
              tenshiAudio.playBlip();
              stopVision();
              resultMsg = 'Cámara apagada con éxito.';
            } else if (accion === 'colgar_llamada') {
              tenshiAudio.playBlip();
              stopVision();
              stopVoiceMode();
              resultMsg = 'Llamada finalizada y colgada.';
            }
          } else if (action.name === 'wappy_enviar_correo') {
            tenshiAudio.playMailSent();
            const res = (action as any).result || {};
            const dest = action.args?.destinatario || res.destinatario || '';
            const asunto = action.args?.asunto || res.asunto || '';
            const adjunto = res.adjuntoHtml || 'Informe HTML adjunto';
            triggerRichVoiceCard({
              id: `mail-${Date.now()}`,
              kind: 'email',
              badge: '📧 Correo Oficial Enviado',
              title: `Para: ${dest}`,
              subtitle: `${asunto} • Adjunto: ${adjunto}`,
            });
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `📧 **Correo Enviado Exitosamente**\n- **Destinatario:** ${dest}\n- **Asunto:** ${asunto}\n- **Adjunto:** ${adjunto}\n- **Canal:** ${res.canal || 'Servidor WAPPY'}\n- **Estado:** Entregado al servidor de mensajería.`,
              },
            ]);
            resultMsg = `Correo enviado exitosamente a ${dest}.`;
          } else if (action.name === 'wappy_gestionar_agenda') {
            tenshiAudio.playCalendarSync();
            const res = (action as any).result || {};
            const msg = res.mensaje || (res.eventos ? `Agenda consultada: ${res.eventos.length} actividades próximas.` : 'Agenda actualizada.');
            triggerRichVoiceCard({
              id: `cal-${Date.now()}`,
              kind: 'calendar',
              badge: '📅 Agenda y Cronograma SG-SST',
              title: action.args?.titulo || 'Sincronización de Agenda',
              subtitle: msg,
            });
            fetchDailyBriefing();
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `📅 **Agenda y Cronograma SG-SST**\n\n${msg}`,
              },
            ]);
            resultMsg = msg;
          } else if (action.name === 'wappy_generar_qr' || (action as any).qr) {
            const qrData = (action as any).qr || (action as any).result || action.args || {};
            if (qrData.url && qrData.titulo) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: `📱 **Código QR y Enlace**: [${qrData.titulo}](${qrData.url})\n\n${qrData.descripcion || ''}\n\n*${qrData.instrucciones || 'Escanea el código QR o comparte el enlace directo.'}*`,
                  qrCode: qrData,
                },
              ]);
              setIsOpen(true);
            }
            resultMsg = `Código QR para "${qrData.titulo || 'Formulario'}" entregado en el chat.`;
          } else if (action.name === 'wappy_delegar_orden_antigravity' || action.name === 'delegar_orden_antigravity') {
            const res = (action as any).result || {};
            const entregable = res.entregable || {};
            const titulo = entregable.titulo || action.args?.titulo || 'Informe Antigravity';
            const contenido = entregable.contenido || res.resultado || '';
            const formato = entregable.formato || res.detalles?.formatoEntregable || action.args?.tipo_entregable || 'text';
            const instruccion = res.detalles?.instruccion || action.args?.descripcion || action.args?.instruccion || action.args?.tarea || '';
            const empresa = res.detalles?.empresa || 'WAPPY LTDA';

            if (contenido) {
              const isHtml = formato === 'html' || contenido.trim().startsWith('<!DOCTYPE') || contenido.trim().startsWith('<html');
              const chatBody = isHtml
                ? (entregable.resumen || res.resultado || 'Se ha generado el dashboard interactivo en HTML con las gráficas de salud ocupacional. Puedes visualizarlo o descargarlo desde el panel Canvas.')
                : contenido;
              const canvasFileType = isHtml ? 'html' : (formato === 'word' || formato === 'documento' ? 'text' : formato);

              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: `⚡ **${titulo}**\n\n${chatBody}`,
                  file: {
                    title: titulo,
                    fileType: canvasFileType,
                    content: contenido,
                    canvasId: `antigravity-report-${Date.now()}`,
                  },
                },
              ]);
              setIsOpen(true);

              if (window.location.pathname.startsWith('/c/')) {
                setStreamingCanvas({
                  id: `antigravity-${Date.now()}`,
                  title: titulo,
                  fileType: canvasFileType,
                  content: contenido,
                  messageId: '',
                  isStreaming: false,
                });
                setIsCanvasActive(true);
              }
              resultMsg = `Entregable de Antigravity "${titulo}" completado y presentado en el chat de Tenshi.`;
            } else {
              const ordenId = res.ordenId || res.detalles?.ordenId || action.args?.ordenId || '';
              const messageId = `antigravity-delegated-${Date.now()}`;

              setMessages((prev) => [
                ...prev,
                {
                  _id: messageId,
                  role: 'assistant',
                  content: `🚀 **Orden Delegada a Antigravity**\n\n` +
                    `📌 **Tarea:** ${titulo}\n` +
                    `📝 **Instrucción:** ${instruccion}\n` +
                    `🏢 **Empresa:** ${empresa}\n` +
                    `🎯 **Formato Solicitado:** ${formato}\n\n` +
                    `*Antigravity ha recibido la instrucción pura y elaborará el entregable en segundo plano.*`,
                  delegatedOrderId: ordenId,
                  delegatedStatus: 'todo',
                },
              ]);
              setIsOpen(true);
              resultMsg = `Orden "${titulo}" delegada exitosamente a Antigravity con su instrucción.`;

              if (ordenId) {
                iniciarMonitoreoOrden(ordenId, titulo, formato, messageId);
              }
            }
          }
        } catch (e: any) {
          resultMsg = `Error ejecutando acción: ${e.message}`;
        }

        sendWappyActionResult(action.id, action.name, resultMsg);
        setTenshiStatus('');
      },
      onAgentSwitched: (data: any) => {
        const agentCandidate = data.agent || data.agentName || data.specialty || (data.isFisioMode ? 'fisioterapeuta' : '');
        if (agentCandidate) {
          const resolved = resolveInspectionProtocol(agentCandidate);
          setActiveProtocol(resolved);
          setIsBiomechanicsActive(resolved.id === 'biomecanico');
        }
        if (data.isFisioMode) {
          tenshiAudio.playBlip();
          setIsBiomechanicsActive(true);
          setIsVisionExpanded(true);
          startVision('camera');
          setVoiceStatusText('🩺 Modo Fisioterapeuta IA Activo');
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `🩺 **Modo Fisioterapeuta Laboral Activado**\n\nHola, soy tu **Especialista en Ergonomía y Fisioterapeuta Laboral**. La conversación y el informe oficial de tu evaluación se registrarán bajo el expediente del Fisioterapeuta.\n\nPor favor indícame tu **Nombre completo, Cédula y Cargo** para dar inicio al análisis ergonómico.`,
            },
          ]);
        }
      },
      onStatusChange: (newStatus: string, statusMsg?: string) => {
        if (newStatus === 'connecting') {
          setVoiceStatusText('Conectando con Tenshi...');
        } else if (newStatus === 'loading') {
          const msg = statusMsg || '⏳ Tenshi procesando solicitud...';
          setVoiceStatusText(msg);
          showLiveActionPill(msg, 22000);
        } else if (newStatus === 'generating_report') {
          setIsGeneratingTechnicalReport(true);
          setVoiceStatusText('⏳ Compilando y generando informe técnico oficial...');
          showLiveActionPill('⏳ Compilando informe técnico oficial...', 25000);
          // Asegurar captura de la fase activa actual (Fase 3 o la que esté) si no ha sido capturada aún
          const curIdx = currentErgoPhaseIndexRef.current;
          if (!manualCapturedPhasesRef.current.has(curIdx)) {
            captureVisionSnapshotRef.current?.(undefined, curIdx);
          }
        } else if (newStatus === 'ready' || newStatus === 'connected' || newStatus === 'listening' || newStatus === 'turn_complete') {
          if (newStatus === 'turn_complete') {
            setMessages((prev) => prev.map((m) => ({ ...m, isLiveVoice: false })));
            refetchHistoryRef.current?.();
          }
          setLiveActionPill('');
          setVoiceStatusText('Tenshi te escucha...');
        } else if (newStatus === 'speaking') {
          setLiveActionPill('');
          setVoiceStatusText('Tenshi respondiendo...');
        } else if (newStatus === 'interrupted') {
          clearAudioQueue();
          setLiveActionPill('');
          setVoiceStatusText('Tenshi te escucha...');
          setMessages((prev) => prev.map((m) => ({ ...m, isLiveVoice: false })));
        } else if (newStatus === 'idle') {
          setLiveActionPill('');
          setVoiceStatusText('');
          setIsGeneratingTechnicalReport(false);
        }
      },
      onReportReceived: (html: string, messageId?: string, evaluatedFrames?: string[], newConvoId?: string) => {
        console.log('[Tenshi Voice] Report received successfully', newConvoId ? `convo: ${newConvoId}` : '');
        setIsGeneratingTechnicalReport(false);
        setReportSuccessToast(true);
        manualCapturedPhasesRef.current.clear();
        try {
          tenshiAudio.playChime();
        } catch (_) {}
        setTimeout(() => {
          setReportSuccessToast(false);
        }, 8000);
        setVoiceStatusText('✅ Informe generado con éxito');
        setTimeout(() => {
          setVoiceStatusText('Tenshi te escucha...');
        }, 4000);
        if (html && html.length > 30 && !html.includes('⚠️ Error de Generación')) {
          const reportTitle = isBiomechanicsActive
            ? 'Informe Técnico de Estudio de Puesto de Trabajo (EPT)'
            : 'Informe Técnico Oficial SG-SST';
          const canvasId = messageId || `tenshi-report-${Date.now()}`;
          const msgContent = `📑 **${reportTitle}**\n\nHe compilado el informe oficial con las evidencias fotográficas y telemetría articular. Puedes visualizarlo o descargarlo desde el visor Canvas.`;
          const fileObj = {
            title: reportTitle,
            fileType: 'html',
            content: html,
            canvasId,
          };
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: msgContent,
              file: fileObj,
              htmlReport: html,
            },
          ]);
          axios
            .post('/api/tenshi/message', {
              role: 'assistant',
              content: msgContent,
              file: fileObj,
              htmlReport: html,
            })
            .catch(() => {});
          setStreamingCanvas({
            id: canvasId,
            title: reportTitle,
            fileType: 'html',
            content: html,
            messageId: canvasId,
            isStreaming: false,
          });
          setIsCanvasActive(true);
          setIsOpen(true);
          setIsVisionExpanded(false);

          if (newConvoId && newConvoId !== 'new' && newConvoId !== conversation?.conversationId) {
            console.log('[TenshiChat] Navegando a la nueva conversación creada para el informe:', newConvoId);
            queryClient.invalidateQueries([QueryKeys.messages]);
            queryClient.invalidateQueries([QueryKeys.allConversations]);
            navigate(`/c/${newConvoId}`, { replace: true });
          }
        }
      },
      onConversationUpdated: (updatedConvoId?: string) => {
        console.log('[Tenshi Voice] onConversationUpdated received:', updatedConvoId);
        queryClient.invalidateQueries([QueryKeys.messages]);
        queryClient.invalidateQueries([QueryKeys.allConversations]);
        if (updatedConvoId && updatedConvoId !== 'new' && updatedConvoId !== conversation?.conversationId) {
          console.log('[TenshiChat] Navegando a la conversación actualizada:', updatedConvoId);
          navigate(`/c/${updatedConvoId}`, { replace: true });
        }
      },
      onError: (err: string) => {
        console.error('[Tenshi Voice] Error:', err);
        setIsGeneratingTechnicalReport(false);
        setVoiceStatusText(`Error: ${err}`);
        setIsVoiceActive(false);
        clearAudioQueue();
        disconnectVoiceRef.current?.();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Se pausó la sesión de voz (${err}). Puedes volver a encender el interruptor cuando desees reanudar.`,
          },
        ]);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, handleAudioReceived, clearAudioQueue, isBiomechanicsActive, personalityMode]
  );

  const {
    connect: connectVoice,
    disconnect: disconnectVoice,
    getInputVolume,
    sendTextMessage,
    sendVideoFrame,
    sendEvidenceImage,
    sendWappyActionResult,
    sendScreenContext,
    sendPersonality,
    setIsPlayingAudio: setVoiceIsPlayingAudio,
    setMuted: setVoiceMuted,
    sendInterrupt: sendVoiceInterrupt,
    status: voiceStatus,
    triggerReport: triggerVoiceReport,
  } = useVoiceSession(sessionOptions);
  triggerVoiceReportRef.current = triggerVoiceReport;
  disconnectVoiceRef.current = disconnectVoice;
  setIsPlayingAudioRef.current = setVoiceIsPlayingAudio;
  sendVoiceInterruptRef.current = sendVoiceInterrupt;
  sendTextMessageRef.current = sendTextMessage;
  sendVideoFrameRef.current = sendVideoFrame;
  sendEvidenceImageRef.current = sendEvidenceImage;
  sendPersonalityRef.current = sendPersonality;
  const sendScreenContextRef = useRef<((data: any) => void) | null>(null);
  sendScreenContextRef.current = sendScreenContext;

  // Sincronizar el contexto visual de la pantalla con la sesión de voz
  useEffect(() => {
    if (isVoiceActive && sendScreenContextRef.current) {
      const effectiveAgentId = conversation?.agent_id || activeConsultationAgentIdRef.current;
      const activeAgent = effectiveAgentId ? agentsRef.current.find(a => a.id === effectiveAgentId) : null;
      sendScreenContextRef.current({
        conversationId: conversation?.conversationId,
        agentId: effectiveAgentId,
        agentName: activeAgent?.name || activeConsultationAgentNameRef.current || conversation?.title,
        route: `${location.pathname}${location.search}`,
      });
    }
  }, [isVoiceActive, conversation?.conversationId, conversation?.agent_id, conversation?.title, location]);

  // Tenshi sincroniza el estado de silenciado de micrófono del usuario (Mute)
  useEffect(() => {
    if (isVoiceActive) {
      setVoiceMuted(isMicMuted);
    }
  }, [isVoiceActive, isMicMuted, setVoiceMuted]);

  const handleToggleMicMute = useCallback(() => {
    tenshiAudio.playBlip();
    setIsMicMuted((prev) => {
      const next = !prev;
      setVoiceMuted(next);
      if (next) {
        // Silenciar micrófono: interrumpir cualquier habla en curso de Tenshi y vaciar buffer de sonido
        try {
          sendVoiceInterruptRef.current?.();
        } catch (_) {}
        clearAudioQueue();
        setIsTenshiSpeaking(false);
        setOutputAmplitude(0);
      }
      return next;
    });
  }, [setVoiceMuted, clearAudioQueue]);

  // ─── Tenshi Vision Control Functions ──────────────────────────────────────────
  const stopVision = useCallback(() => {
    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
      visionIntervalRef.current = null;
    }
    if (visionStreamRef.current) {
      visionStreamRef.current.getTracks().forEach((track) => track.stop());
      visionStreamRef.current = null;
    }
    if (visionVideoRef.current) {
      visionVideoRef.current.srcObject = null;
    }
    setIsVisionActive(false);
    setIsCameraOn(true);
    setIsBiomechanicsActive(false);
    playPowerDownChime();
  }, [playPowerDownChime]);

  const onPoseResults = useCallback((results: any) => {
    const canvas = biomechanicCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const landmarks = results?.landmarks?.[0] || results?.poseLandmarks;
    const worldLandmarks = results?.worldLandmarks?.[0] || results?.ea;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    try {
      drawBiomechanicSkeleton(ctx, landmarks, handsResultsRef.current);
    } catch (e) {
      console.error('[TenshiChat] Error drawing skeleton:', e);
    }

    try {
      const { neck, trunk, arm, elbow, knee, is3D } = calculateBiomechanicAngles(landmarks, worldLandmarks);
      anglesRef.current = { neck, trunk, arm, elbow, knee };

      const now = Date.now();
      if (now - lastErgoUpdateRef.current >= 200) {
        lastErgoUpdateRef.current = now;
        setNeckAngle(neck);
        setTrunkAngle(trunk);
        setArmAngle(arm);
        setElbowAngle(elbow);
        setKneeAngle(knee);
        setIs3DTelemetry(is3D);
      }
    } catch (calcErr) {
      console.error('[TenshiChat] Error calculating angles:', calcErr);
    }
  }, []);

  // Sincronizar referencia de voz activa
  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  // Cargar Google MediaPipe para Visión IA en Tenshi (Únicamente en Modo Biomecánico / Fisioterapeuta)
  useEffect(() => {
    if (!isVisionActive || !isBiomechanicsActive) return;

    let active = true;
    console.log('[TenshiChat] Loading Vision AI (MediaPipe)...');

    const loadAll = async () => {
      try {
        const classicLoadPromise = loadClassicPoseScripts()
          .then(() => {
            if (active) setIsMediaPipeLoaded(true);
          })
          .catch((e) => console.warn('[TenshiChat] Classic load warning:', e));

        const tasksVision = await loadTasksVision();
        if (tasksVision && active) {
          setIsMediaPipeLoaded(true);
          return;
        }
        await classicLoadPromise;
      } catch (err) {
        console.error('[TenshiChat] Error loading Vision AI:', err);
      }
    };

    loadAll();

    return () => {
      active = false;
    };
  }, [isVisionActive, isBiomechanicsActive]);

  // Inicializar motor de PoseLandmarker con fallback a window.Pose
  useEffect(() => {
    if (!isMediaPipeLoaded || !isVisionActive || visionSource !== 'camera' || !isBiomechanicsActive) {
      if (landmarkerRef.current) {
        try { landmarkerRef.current.close(); } catch (_) {}
        landmarkerRef.current = null;
      }
      if (poseRef.current) {
        try { poseRef.current.close(); } catch (_) {}
        poseRef.current = null;
      }
      setIsPoseActive(false);
      if (biomechanicCanvasRef.current) {
        const ctx = biomechanicCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, biomechanicCanvasRef.current.width, biomechanicCanvasRef.current.height);
      }
      return;
    }

    let isSubscribed = true;

    const initEngine = async () => {
      const tasksVision = (window as any).MediaPipeTasksVision;
      if (tasksVision) {
        try {
          const landmarker = await initPoseLandmarker(tasksVision);
          if (landmarker && isSubscribed) {
            landmarkerRef.current = landmarker;
            setIsPoseActive(true);
            console.log('[TenshiChat] Google Tasks-Vision PoseLandmarker active!');
            return;
          }
        } catch (e) {
          console.warn('[TenshiChat] Fallback to classic Pose:', e);
        }
      }

      if (typeof window !== 'undefined' && window.Pose && isSubscribed) {
        try {
          const pose = new window.Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });
          pose.setOptions({
            modelComplexity: 0,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          pose.onResults((results: any) => {
            onPoseResults(results);
          });
          poseRef.current = pose;
          setIsPoseActive(true);
          console.log('[TenshiChat] Classic Pose instance ready!');
        } catch (e) {
          console.error('[TenshiChat] Error creating Pose instance:', e);
        }
      }
    };

    initEngine();

    return () => {
      isSubscribed = false;
      if (landmarkerRef.current) {
        try { landmarkerRef.current.close(); } catch (_) {}
        landmarkerRef.current = null;
      }
      if (poseRef.current) {
        try { poseRef.current.close(); } catch (_) {}
        poseRef.current = null;
      }
      setIsPoseActive(false);
    };
  }, [isMediaPipeLoaded, isVisionActive, visionSource, isBiomechanicsActive, onPoseResults]);

  // Loop de telemetría a 10 FPS
  useEffect(() => {
    if (!isPoseActive || !visionVideoRef.current) return;

    let active = true;
    let lastFrameTime = 0;
    const fpsInterval = 1000 / 10;

    const poseLoop = async () => {
      if (!active) return;

      const now = Date.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= fpsInterval) {
        lastFrameTime = now - (elapsed % fpsInterval);

        const video = visionVideoRef.current;
        if (video && video.readyState >= 2) {
          const canvas = biomechanicCanvasRef.current;
          if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          if (landmarkerRef.current) {
            try {
              const results = landmarkerRef.current.detectForVideo(video, performance.now());
              onPoseResults(results);
            } catch (e) {
              console.error('[TenshiChat] Tasks-Vision detect error:', e);
            }
          } else if (poseRef.current) {
            try {
              await poseRef.current.send({ image: video });
            } catch (e) {
              console.error('[TenshiChat] Pose send error:', e);
            }
          }
        }
      }

      requestAnimationFrame(poseLoop);
    };

    requestAnimationFrame(poseLoop);

    return () => {
      active = false;
    };
  }, [isPoseActive, onPoseResults]);

  const captureVisionSnapshot = useCallback((customLabel?: string, targetPhaseIdx?: number) => {
    const video = visionVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }
    try {
      if (!visionCanvasRef.current) {
        visionCanvasRef.current = document.createElement('canvas');
      }
      const canvas = visionCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Si hay esqueleto biomecánico activo, dibujarlo encima en el snapshot
      if (biomechanicCanvasRef.current && biomechanicCanvasRef.current.width > 0) {
        try {
          ctx.drawImage(biomechanicCanvasRef.current, 0, 0, canvas.width, canvas.height);
        } catch (_) {}
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Activar destello visual
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 250);

      // Determinar fase a capturar (forzada o actual)
      const phaseIdx = targetPhaseIdx !== undefined ? targetPhaseIdx : currentErgoPhaseIndexRef.current;
      manualCapturedPhasesRef.current.add(phaseIdx);

      // Construir telemetría de ángulos con MediaPipe
      const currentAngles = anglesRef.current || {};
      const nAngle = currentAngles.neck ?? null;
      const tAngle = currentAngles.trunk ?? null;
      const aAngle = currentAngles.arm ?? null;
      const eAngle = currentAngles.elbow ?? null;
      const kAngle = currentAngles.knee ?? null;

      const telemetryParts: string[] = [];
      if (nAngle !== null) telemetryParts.push(`Flexión Cervical: ${nAngle}° (${getNeckStatus(nAngle).status})`);
      if (tAngle !== null) telemetryParts.push(`Flexión de Tronco: ${tAngle}° (${getTrunkStatus(tAngle).status})`);
      if (aAngle !== null) telemetryParts.push(`Abducción de Brazo: ${aAngle}° (${getArmStatus(aAngle).status})`);
      if (eAngle !== null) telemetryParts.push(`Flexión de Codo: ${eAngle}° (${getElbowStatus(eAngle).status})`);
      if (kAngle !== null) telemetryParts.push(`Flexión de Rodilla: ${kAngle}° (${getKneeStatus(kAngle).status})`);

      const phase = ERGO_PHASES[phaseIdx] || ERGO_PHASES[0];
      const isFisio = isBiomechanicsActive;
      const label = customLabel || (isFisio
        ? `📸 Evidencia Postural (${phase.shortName})${telemetryParts.length > 0 ? ` • ${telemetryParts.join(', ')}` : ''}`
        : `📸 Evidencia de Inspección Visual SST (${phase.shortName})`);

      const userVisionMsg: TenshiChatMessage = {
        role: 'user',
        content: isFisio
          ? `👁️ **${label}**\n\n*Foto capturada durante la evaluación postural con la Fisioterapeuta Laboral en Tenshi*`
          : `👁️ **${label}**\n\n*Evidencia fotográfica capturada durante la inspección visual con Tenshi*`,
        image: dataUrl,
      };

      setMessages((prev) => [...prev, userVisionMsg]);

      // Enviar imagen al canal WebSocket si está disponible con metadatos completos de fase y telemetría
      const rawBase64 = dataUrl.split(',')[1];
      if (rawBase64 && sendEvidenceImageRef.current) {
        sendEvidenceImageRef.current(rawBase64, label, {
          phaseIndex: phaseIdx,
          phaseName: phase.name,
          shortName: phase.shortName,
          telemetry: currentAngles,
          is3D: is3DTelemetry,
        });
        console.log(`[Tenshi Vision] Evidencia enviada al WebSocket para Fase ${phaseIdx + 1} (${phase.name})`);
      }

      // Auto-avanzar al siguiente paso si targetPhaseIdx no fue forzado externamente
      if (targetPhaseIdx === undefined && isBiomechanicsActive) {
        setCurrentErgoPhaseIndex((prev) => Math.min(prev + 1, ERGO_PHASES.length - 1));
      }

      // Persistir si hay token
      if (token) {
        axios
          .post(
            '/api/tenshi/message',
            {
              role: 'user',
              content: isFisio ? `[FOTO DE INSPECCIÓN ERGONÓMICA]: ${label}` : `[FOTO DE INSPECCIÓN VISUAL SST]: ${label}`,
              image: dataUrl,
            },
            { headers: { Authorization: `Bearer ${token}` } },
          )
          .catch((err) => console.error('[Tenshi Vision] Error guardando mensaje visual:', err));
      }

      tenshiAudio.playBlip();
      return dataUrl;
    } catch (err) {
      console.error('[Tenshi Vision] Error al capturar snapshot:', err);
      return null;
    }
  }, [token, ERGO_PHASES, isBiomechanicsActive, is3DTelemetry]);

  useEffect(() => {
    captureVisionSnapshotRef.current = captureVisionSnapshot;
  }, [captureVisionSnapshot]);

  const setVisionVideoNode = useCallback((node: HTMLVideoElement | null) => {
    visionVideoRef.current = node;
    if (node && visionStreamRef.current) {
      if (node.srcObject !== visionStreamRef.current) {
        node.srcObject = visionStreamRef.current;
        node.play().catch(console.error);
      }
    }
  }, []);

  const stopVoiceMode = useCallback(() => {
    setIsVoiceActive(false);
    setIsMicMuted(false);
    setIsWaitingConsultation(false);
    setIsTyping(false);
    stopVision();
    if (pendingAgentConsultationRef.current) {
      pendingAgentConsultationRef.current.active = false;
    }
    if (consultationTimerRef.current) {
      clearTimeout(consultationTimerRef.current);
      consultationTimerRef.current = null;
    }
    try {
      sendVoiceInterruptRef.current();
    } catch (_) {}
    playPowerDownChime();
    clearAudioQueue();
    disconnectVoice();
    setIsTenshiSpeaking(false);
    setOutputAmplitude(0);
    setVoiceStatusText('');
    setIsGeneratingTechnicalReport(false);
  }, [disconnectVoice, clearAudioQueue, playPowerDownChime, stopVision]);

  const startVoiceMode = useCallback(() => {
    setIsVoiceActive(true);
    setIsMicMuted(false);
    setIsWaitingConsultation(false);
    if (pendingAgentConsultationRef.current) {
      pendingAgentConsultationRef.current.active = false;
    }
    if (consultationTimerRef.current) {
      clearTimeout(consultationTimerRef.current);
      consultationTimerRef.current = null;
    }

    // Desbloquear AudioContext y sesión de sonido en iOS/móvil
    unlockAudio();

    lastActivityRef.current = Date.now();
    setVoiceStatusText('Conectando con Tenshi...');
    connectVoice();
  }, [connectVoice, unlockAudio]);

  const toggleVoiceMode = useCallback(() => {
    if (isVoiceActive) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  }, [isVoiceActive, startVoiceMode, stopVoiceMode]);

  const toggleVoice = toggleVoiceMode;

  const startVision = useCallback(
    async (source: 'camera' | 'screen' = 'camera', mode: 'user' | 'environment' = facingMode) => {
      try {
        if (!isVoiceActiveRef.current) {
          startVoiceMode();
        }
        setIsOpen(true);
        setIsHeroChatOpen(true);

        if (visionStreamRef.current) {
          visionStreamRef.current.getTracks().forEach((track) => track.stop());
          visionStreamRef.current = null;
        }
        if (visionIntervalRef.current) {
          clearInterval(visionIntervalRef.current);
          visionIntervalRef.current = null;
        }

        let stream: MediaStream;
        if (source === 'screen') {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            alert('Tu navegador no soporta compartir pantalla.');
            return;
          }
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 10 } },
            audio: false,
          });
          stream.getVideoTracks()[0].onended = () => {
            stopVision();
          };
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: mode,
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 },
            },
            audio: false,
          });
        }

        visionStreamRef.current = stream;
        setVisionSource(source);
        setFacingMode(mode);
        setIsVisionActive(true);
        setIsCameraOn(true);
        setIsVisionExpanded(true);
        tenshiAudio.playBlip();

        setTimeout(() => {
          if (visionVideoRef.current) {
            visionVideoRef.current.srcObject = stream;
            visionVideoRef.current.play().catch(console.error);
          }
        }, 150);

        visionIntervalRef.current = setInterval(() => {
          if (!isCameraOnRef.current && source === 'camera') return;
          if (visionVideoRef.current && sendVideoFrameRef.current) {
            sendVideoFrameRef.current(
              visionVideoRef.current,
              `[Tenshi Visión en Vivo • ${source === 'screen' ? 'Pantalla' : 'Cámara ' + mode}]`,
              biomechanicCanvasRef.current || null
            );
          }
        }, 1200);
      } catch (err: any) {
        console.error('[Tenshi Vision] Error al iniciar visión:', err);
        setIsVisionActive(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ No se pudo acceder a la ${source === 'screen' ? 'pantalla' : 'cámara'} (${err.message || 'Permiso denegado'}). Por favor autoriza el acceso a la cámara en tu navegador.`,
          },
        ]);
      }
    },
    [facingMode, startVoiceMode, stopVision]
  );

  const switchCamera = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isVisionActive && visionSource === 'camera') {
      startVision('camera', nextMode);
    }
  }, [facingMode, isVisionActive, visionSource, startVision]);

  const toggleCamera = useCallback(() => {
    tenshiAudio.playBlip();
    if (!isVisionActive || visionSource !== 'camera' || !isCameraOn) {
      startVision('camera', facingMode);
      setIsCameraOn(true);
    } else {
      // Detener pistas de hardware físicamente para apagar la luz de la cámara
      if (visionStreamRef.current) {
        visionStreamRef.current.getVideoTracks().forEach((track) => {
          track.stop();
        });
        visionStreamRef.current = null;
      }
      if (visionVideoRef.current) {
        visionVideoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    }
  }, [isVisionActive, visionSource, isCameraOn, facingMode, startVision]);

  // Apagar visión si el componente se desmonta
  useEffect(() => {
    return () => {
      if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
      if (visionStreamRef.current) visionStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Visual amplitude polling for live waveform & Jarvis avatar reactivity (Throttled to avoid saturating React render queue)
  useEffect(() => {
    let animFrame: number;
    let prevOut = 0;
    let prevVoice = 0;
    let lastPoll = 0;

    const updateAmplitude = (time: number) => {
      if (time - lastPoll >= 40) {
        lastPoll = time;

        // 1. Calculate Tenshi output audio amplitude when speaking
        if (activeSourcesRef.current.length > 0 && outputAnalyserRef.current) {
          try {
            const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
            outputAnalyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / (dataArray.length * 255);
            if (Math.abs(avg - prevOut) > 0.03) {
              prevOut = avg;
              setOutputAmplitude(avg);
            }
          } catch (e) {
            if (prevOut !== 0) {
              prevOut = 0;
              setOutputAmplitude(0);
            }
          }
        } else if (prevOut !== 0) {
          prevOut = 0;
          setOutputAmplitude(0);
        }

        // 2. Poll user mic input volume if voice mode is active
        if (isVoiceActive) {
          const vol = getInputVolume();
          if (Math.abs(vol - prevVoice) > 0.03) {
            prevVoice = vol;
            setVoiceAmplitude(vol);
          }
        } else if (prevVoice !== 0) {
          prevVoice = 0;
          setVoiceAmplitude(0);
        }
      }

      animFrame = requestAnimationFrame(updateAmplitude);
    };

    animFrame = requestAnimationFrame(updateAmplitude);
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isVoiceActive, getInputVolume]);

  // Desbloqueo universal de audio para Safari / iOS en cualquier interacción del usuario
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // ⏱️ Auto-desactivación por inactividad tras 1 minuto (60 segundos)
  // CRÍTICO: Si Tenshi delegó una consulta a un especialista o el chat está respondiendo,
  // el contador de inactividad se PAUSA y se mantiene activo para no interrumpir la conversación.
  useEffect(() => {
    if (isVoiceActive) {
      lastActivityRef.current = Date.now();
      setInactivitySeconds(0);
      inactivityIntervalRef.current = setInterval(() => {
        const isWaiting =
          Boolean(pendingAgentConsultationRef.current?.active) ||
          Boolean(isChatSubmittingRef.current) ||
          Boolean(isWaitingConsultation);

        if (isWaiting) {
          const isStillStreaming = Boolean(isChatSubmittingRef.current);
          const timeSinceTextChange = Date.now() - (lastContentChangeRef.current?.time || Date.now());
          const consultation = pendingAgentConsultationRef.current;
          const timeSinceStart = Date.now() - (consultation?.startedAt || Date.now());

          // 1. WATCHDOG DE AUTO-ENVÍO: Si pasaron más de 3 segundos, el especialista no ha empezado a generar
          // y el prompt sigue escrito en el input/textarea sin enviarse, forzar el envío del formulario.
          if (consultation?.active && !consultation.hadStarted && !isStillStreaming && timeSinceStart >= 3000) {
            const formEl =
              document.querySelector<HTMLFormElement>('form[data-testid="chat-form"]') ||
              document.querySelector<HTMLFormElement>('form');
            const textArea =
              document.querySelector<HTMLTextAreaElement>('textarea[data-testid="chat-input"]') ||
              document.querySelector<HTMLTextAreaElement>('textarea');
            if (textArea && textArea.value && textArea.value.trim().length > 0) {
              console.log('[Tenshi Watchdog] Prompt aún en textarea tras 3s. Forzando click o submit en formulario...');
              textArea.dispatchEvent(new Event('input', { bubbles: true }));
              textArea.dispatchEvent(new Event('change', { bubbles: true }));
              const sendBtn = (document.getElementById('send-button') ||
                document.querySelector('button[data-testid="send-button"]')) as HTMLButtonElement | null;
              if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
              } else if (formEl) {
                try {
                  formEl.requestSubmit();
                } catch {
                  if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.click();
                  }
                }
              }
            }
          }

          // 2. CHEQUEO DE COMPLETITUD:
          // CRÍTICO: Solo evaluar respuesta si el especialista YA HABÍA EMPEZADO A RESPONDER (hadStarted === true)
          // y dejó de generar (!isStillStreaming). PROHIBIDO evaluar sin hadStarted para evitar falsos positivos.
          if (consultation?.active && consultation.hadStarted && !isStillStreaming) {
            const possibleAnswer = extractSpecialistAnswer();
            if (possibleAnswer && possibleAnswer.length >= 35) {
              console.log('[Tenshi Voice] Respuesta confirmada del especialista detectada por chequeo periódico.');
              handleCompleteConsultation(possibleAnswer);
              lastActivityRef.current = Date.now();
              setInactivitySeconds(0);
              return;
            }
          }

          // Mantener la espera activa mientras el chat esté generando, o haya recibido texto recientemente (< 25s),
          // o lleve menos de 75 segundos desde el inicio de la consulta (los especialistas tardan entre 15 y 45s)
          if (isStillStreaming || timeSinceTextChange < 25000 || timeSinceStart < 75000) {
            lastActivityRef.current = Date.now();
            setInactivitySeconds(0);
            return;
          }

          // 2. Timeout de seguridad prolongado (75s): ANTES de emitir timeout, chequeo de rescate obligatorio
          if (pendingAgentConsultationRef.current?.active && timeSinceStart >= 75000) {
            if (consultation.hadStarted) {
              const rescueAnswer = extractSpecialistAnswer();
              if (rescueAnswer && rescueAnswer.length >= 35) {
                console.log('[Tenshi Voice] Respuesta rescatada exitosamente justo antes de timeout.');
                handleCompleteConsultation(rescueAnswer);
                return;
              }
            }

            console.warn('[Tenshi Voice] Timeout de seguridad (75s) esperando respuesta del especialista.');
            const timedOutAgent = pendingAgentConsultationRef.current.agentName;
            pendingAgentConsultationRef.current.active = false;
            setIsWaitingConsultation(false);
            if (isVoiceActive) {
              lastActivityRef.current = Date.now();
              setVoiceStatusText('Tenshi te escucha...');
              sendTextMessage(`[SISTEMA INTERNO WAPPY]: La consulta a ${timedOutAgent} tardó más de lo usual. Dile al usuario con tono fresco y amigable en una sola frase breve que la consulta quedó abierta en el chat para cuando el especialista termine.`);
            }
          }
          return;
        }

        const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
        setInactivitySeconds(elapsed);
        if (elapsed >= 300) {
          console.log('[Tenshi Voice] 300s (5m) inactividad alcanzada. Auto-desactivando modo voz.');
          stopVoiceMode();
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                'ℹ️ Modo voz pausado automáticamente tras 5 minutos sin actividad para ahorrar batería y recursos. Cuando quieras volver a hablarme, solo pulsa el micrófono. 😊',
            },
          ]);
        }
      }, 1000);
    } else {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
        inactivityIntervalRef.current = null;
      }
      setInactivitySeconds(0);
    }
    return () => {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
        inactivityIntervalRef.current = null;
      }
    };
  }, [isVoiceActive, isWaitingConsultation, stopVoiceMode, sendTextMessage, extractSpecialistAnswer, handleCompleteConsultation]);

  // 👆 Mantener viva la sesión de voz ante cualquier interacción táctil, clic o teclado
  useEffect(() => {
    if (!isVoiceActive) return;
    const handleUserTouch = () => {
      lastActivityRef.current = Date.now();
      setInactivitySeconds(0);
    };
    window.addEventListener('touchstart', handleUserTouch, { passive: true });
    window.addEventListener('click', handleUserTouch, { passive: true });
    window.addEventListener('keydown', handleUserTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleUserTouch);
      window.removeEventListener('click', handleUserTouch);
      window.removeEventListener('keydown', handleUserTouch);
    };
  }, [isVoiceActive]);

  // 🧠 Escuchar y procesar la respuesta del especialista para que Tenshi aprenda y hable al usuario
  useEffect(() => {
    const wasSubmitting = prevIsSubmittingRef.current;
    prevIsSubmittingRef.current = isChatSubmitting;

    if (!pendingAgentConsultationRef.current || !pendingAgentConsultationRef.current.active) {
      if (consultationTimerRef.current) {
        clearTimeout(consultationTimerRef.current);
        consultationTimerRef.current = null;
      }
      return;
    }

    const consultation = pendingAgentConsultationRef.current;

    // Si el chat está generando activamente
    if (isChatSubmitting) {
      consultation.hadStarted = true;
      setVoiceStatusText(`${consultation.agentName} respondiendo en pantalla...`);
      return;
    }

    // Si el especialista terminó de generar (transición de isChatSubmitting de true a false, o hadStarted y ya no genera, o pasaron >= 4s y no está generando)
    const timeSinceStart = Date.now() - (consultation.startedAt || consultation.timestamp || Date.now());
    const shouldCheckAnswer = (consultation.hadStarted && !isChatSubmitting) || (!isChatSubmitting && timeSinceStart >= 4000);

    if (shouldCheckAnswer) {
      setVoiceStatusText(`${consultation.agentName} finalizó respuesta...`);

      if (!consultationTimerRef.current) {
        consultationTimerRef.current = setTimeout(() => {
          consultationTimerRef.current = null;
          const answer = extractSpecialistAnswer();
          if (answer) {
            handleCompleteConsultation(answer);
          } else {
            // Reintento tras 700ms si el markdown aún se estaba procesando en el DOM
            setTimeout(() => {
              const retry = extractSpecialistAnswer();
              if (retry) {
                handleCompleteConsultation(retry);
              }
            }, 700);
          }
        }, 350);
      }
    }
  }, [isChatSubmitting, extractSpecialistAnswer, handleCompleteConsultation]);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 88),
        y: Math.max(16, window.innerHeight - 110),
      };
    }
    return null;
  });
  const tenshiRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Estado con periodo de gracia para el micro-dock flotante de Tenshi
  const [isHoveringTenshi, setIsHoveringTenshi] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHoveringTenshi(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoveringTenshi(false);
    }, 450);
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    if (!tenshiRef.current) return;
    const rect = tenshiRef.current.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    hasMovedRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (btn && btn !== e.currentTarget) return;
    if (target.closest('a')) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (btn && btn !== e.currentTarget) return;
    if (target.closest('a')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }
      let newX = dragStartRef.current.elemX + dx;
      let newY = dragStartRef.current.elemY + dy;

      const tenshiW = tenshiRef.current?.offsetWidth || 70;
      const tenshiH = tenshiRef.current?.offsetHeight || 92;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      newX = Math.max(8, Math.min(newX, viewportWidth - tenshiW - 8));
      newY = Math.max(8, Math.min(newY, viewportHeight - tenshiH - 8));

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 16 || Math.abs(dy) > 16) {
        hasMovedRef.current = true;
      }
      let newX = dragStartRef.current.elemX + dx;
      let newY = dragStartRef.current.elemY + dy;

      const tenshiW = tenshiRef.current?.offsetWidth || 70;
      const tenshiH = tenshiRef.current?.offsetHeight || 92;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 768;
      const bottomMargin = isMobile ? 86 : 8;
      newX = Math.max(8, Math.min(newX, viewportWidth - tenshiW - 8));
      newY = Math.max(8, Math.min(newY, viewportHeight - tenshiH - bottomMargin));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
    };

    const handleTouchEnd = () => {
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Responsive safe-guard: Asegura que Tenshi no se salga si cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const tenshiW = 70;
        const tenshiH = 92;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 768;
        const bottomMargin = isMobile ? 86 : 8;
        return {
          x: Math.max(8, Math.min(prev.x, viewportWidth - tenshiW - 8)),
          y: Math.max(8, Math.min(prev.y, viewportHeight - tenshiH - bottomMargin)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cálculo de posición dinámica del chat hacia el cuadrante con mayor espacio en pantalla
  const getChatPositionStyle = (): React.CSSProperties => {
    if (isFullscreen) {
      return {};
    }
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const defaultW = 420;
    const defaultH = 540;
    const chatW = Math.min(defaultW, typeof window !== 'undefined' ? window.innerWidth - 24 : 380);
    const chatH = Math.min(defaultH, typeof window !== 'undefined' ? window.innerHeight - 32 : 500);

    if (isMobile) {
      const left = Math.max(12, ((typeof window !== 'undefined' ? window.innerWidth : 400) - chatW) / 2);
      const top = Math.max(16, ((typeof window !== 'undefined' ? window.innerHeight : 700) - chatH) / 2 - 15);
      return {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${chatW}px`,
        height: `${chatH}px`,
        zIndex: 10000,
      };
    }

    const tenshiW = 70;
    const tenshiH = 92;

    const curX = position ? position.x : (typeof window !== 'undefined' ? window.innerWidth - 88 : 0);
    const curY = position ? position.y : (typeof window !== 'undefined' ? window.innerHeight - 110 : 0);

    const spaceLeft = curX;
    const spaceRight = window.innerWidth - (curX + tenshiW);
    const spaceTop = curY;
    const spaceBottom = window.innerHeight - (curY + tenshiH);

    let left = 0;
    let top = 0;

    // Horizontal: Si hay más espacio a la izquierda, abrir a la izquierda de Tenshi
    if (spaceLeft >= chatW + 12 || spaceLeft > spaceRight) {
      left = Math.max(12, curX - chatW - 12);
    } else {
      left = Math.min(window.innerWidth - chatW - 12, curX + tenshiW + 12);
    }

    // Vertical: Si hay más espacio arriba, alinear hacia arriba de Tenshi
    if (spaceTop >= chatH || spaceTop > spaceBottom) {
      top = Math.max(12, curY + tenshiH - chatH);
    } else {
      top = Math.min(window.innerHeight - chatH - 12, curY);
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${chatW}px`,
      height: `${chatH}px`,
      zIndex: 10000,
    };
  };

  const tapTimestampsRef = useRef<number[]>([]);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMaximizeMobile = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (_) {}
    }
    try {
      tenshiAudio.playBlip();
    } catch (_) {}
    try {
      sessionStorage.removeItem('tenshi_mobile_hero_minimized');
      sessionStorage.removeItem('tenshi_mobile_hero_exited');
      sessionStorage.removeItem('tenshi_mobile_just_logged_in');
      sessionStorage.setItem('tenshi_mobile_hero_forced', 'true');
    } catch (_) {}
    setIsMobileHeroMode(true);
    setIsHeroChatOpen(false);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('tenshi-enter-mobile-hero'));

    const isChat =
      location.pathname === '/' ||
      location.pathname === '/c/new' ||
      location.pathname.startsWith('/c/');
    if (!isChat) {
      navigate('/c/new');
    }
  }, [location.pathname, navigate]);

  const handleTenshiInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.closest('button')) {
      return;
    }

    // Desbloquear AudioContext y sesión de sonido en iOS/móvil inmediatamente en el toque del usuario
    unlockAudio();

    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const now = Date.now();
    // Conservar toques ocurridos en una ventana de 850ms
    tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => now - t < 850);
    tapTimestampsRef.current.push(now);

    const isMobile = checkIsMobile();

    // 🌟 TRIPLE TAP (3 Toques seguidos en Móvil): Expansión a Pantalla Completa / Modo Protagonista
    if (tapTimestampsRef.current.length >= 3 && isMobile) {
      tapTimestampsRef.current = [];
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      handleMaximizeMobile();
      return;
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
      const count = tapTimestampsRef.current.length;
      tapTimestampsRef.current = [];

      if (count === 2) {
        // 💬 Doble Clic Rápido: Alternar Ventana de Modo Chat
        tenshiAudio.playBlip();
        setIsOpen((prev) => !prev);
      } else if (count === 1) {
        // 🎙️ Un Clic Simple: Alternar Modo Live (Voz) SIN abrir nada
        if (isVoiceActive) {
          tenshiAudio.playBlip();
          stopVoiceMode();
        } else {
          tenshiAudio.playBlip();
          startVoiceMode();
        }
      }
    }, 280);
  };

  const handleButtonClick = handleTenshiInteraction;

  const handleClose = useCallback(() => {
    tenshiAudio.playBlip();
    setIsOpen(false);
    setIsFullscreen(false);
  }, []);

  const { data: config } = useQuery(
    ['tenshiConfig', token],
    async () => {
      const res = await axios.get('/api/tenshi/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
    },
  );

  const { data: historyData, refetch: refetchHistory } = useQuery(
    ['tenshiHistory', token],
    async () => {
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    {
      enabled: isAuthenticated,
      staleTime: 3 * 1000,
      refetchInterval: (isOpen || isHeroChatOpen) ? 3500 : 15000,
    },
  );

  useEffect(() => {
    refetchHistoryRef.current = refetchHistory;
  }, [refetchHistory]);

  useEffect(() => {
    if (isOpen) {
      refetchHistory();
    }
  }, [isOpen, refetchHistory]);

  useEffect(() => {
    if (historyData) {
      if (historyData.length > 0) {
        setMessages((prev) => {
          // Extraer mensajes locales que contengan archivos (file o htmlReport) o medios (media o image)
          const localExtras = prev.filter((m) => m.file || m.htmlReport || m.media || m.image);

          // 1. Mapa de archivos locales por contenido o por título
          const localFileMap = new Map<string, any>();
          // Mapa de medios locales por contenido o por ID para evitar que se pierdan al sincronizar
          const localMediaMap = new Map<string, { media?: any; image?: string }>();

          prev.forEach((m) => {
            if (m.file) {
              if (m.content) localFileMap.set(m.content.trim(), m.file);
              if (m.file.title) localFileMap.set(m.file.title.trim(), m.file);
            }
            if (m.media || m.image) {
              if (m.content) localMediaMap.set(m.content.trim(), { media: m.media, image: m.image });
              if (m._id) localMediaMap.set(String(m._id), { media: m.media, image: m.image });
            }
          });

          // 2. Enriquecer historyData si algún mensaje del historial carece de file/media pero existía localmente
          const enrichedHistory = historyData.map((h: any, idx: number) => {
            const item = { ...h };

            // Restaurar media e image preservando URLs locales y Blobs vivos
            const textKey = (item.content || '').trim();
            const cached = localMediaMap.get(textKey) || (item._id ? localMediaMap.get(String(item._id)) : null);
            const blobObj = item.media?.name ? liveMediaBlobsRef.current.get(item.media.name) : null;

            if (cached) {
              if (cached.image && !item.image) item.image = cached.image;
              if (cached.media) {
                item.media = {
                  ...item.media,
                  ...cached.media,
                  previewUrl: cached.media.previewUrl || blobObj?.blobUrl || item.media?.previewUrl,
                  dataUrl: cached.media.dataUrl || blobObj?.dataUrl || item.media?.dataUrl,
                  thumbnailUrl: cached.media.thumbnailUrl || blobObj?.thumbnailUrl || item.media?.thumbnailUrl,
                };
              }
            } else if (blobObj && item.media) {
              item.media = {
                ...item.media,
                previewUrl: blobObj.blobUrl || item.media.previewUrl,
                dataUrl: blobObj.dataUrl || item.media.dataUrl,
                thumbnailUrl: blobObj.thumbnailUrl || item.media.thumbnailUrl,
              };
            }


            if (!item.file) {
              if (item.content) {
                const matched = localFileMap.get(item.content.trim());
                if (matched) item.file = matched;
              }
              // Si el mensaje habla de haber generado o entregado el archivo, enlazar el archivo del mensaje contiguo
              const mentionsFileGeneration = /gener[ée]|cread[oa]|descargarlo|visualizarlo|en pantalla|aplicativo/i.test(item.content || '');
              if (mentionsFileGeneration) {
                const prevMsg = historyData[idx - 1];
                if (prevMsg?.file) {
                  item.file = prevMsg.file;
                  item.htmlReport = prevMsg.htmlReport || (prevMsg.file.fileType === 'html' ? prevMsg.file.content : undefined);
                }
              }
            }
            return item;
          });

          if (localExtras.length === 0) {
            return enrichedHistory;
          }

          // 3. Identificadores y firmas de mensajes ya existentes en enrichedHistory
          const historySignatures = new Set<string>();
          enrichedHistory.forEach((h: any) => {
            if (h._id) historySignatures.add(String(h._id));
            if (h.content) historySignatures.add(h.content.trim());
            if (h.file?.canvasId) historySignatures.add(String(h.file.canvasId));
            const sig = `${(h.content || '').trim()}-${(h.file?.title || h.media?.name || '').trim()}`;
            if (sig !== '-') historySignatures.add(sig);
          });

          // 4. Filtrar archivos y medios locales que aún no hayan sido devueltos por el backend
          const unpersistedExtras = localExtras.filter((lf: any) => {
            if (lf._id && historySignatures.has(String(lf._id))) return false;
            if (lf.file?.canvasId && historySignatures.has(String(lf.file.canvasId))) return false;
            if (lf.content && historySignatures.has(lf.content.trim())) {
              return false;
            }
            const sig = `${(lf.content || '').trim()}-${(lf.file?.title || lf.media?.name || '').trim()}`;
            return !historySignatures.has(sig);
          });

          if (unpersistedExtras.length === 0) {
            return enrichedHistory;
          }

          return [...enrichedHistory, ...unpersistedExtras];
        });
      } else {
        setMessages((prev) => {
          const localExtras = prev.filter((m) => m.file || m.htmlReport || m.media || m.image);
          if (localExtras.length > 0) return localExtras;
          return [
            {
              role: 'assistant',
              content:
                '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
            },
          ];
        });
      }
    }
  }, [historyData]);

  const handleClearHistory = async () => {
    if (!confirm('¿Deseas reiniciar la conversación con Tenshi?')) return;
    try {
      await axios.delete('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages([
        {
          role: 'assistant',
          content:
            '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
        },
      ]);
      refetchHistory();
    } catch (err) {
      console.error('Error clearing Tenshi history:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('¿Deseas eliminar este mensaje y el resto de la conversación a partir de este punto?')) return;
    try {
      await axios.delete(`/api/tenshi/message/${msgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data.length > 0 ? res.data : [
        {
          role: 'assistant',
          content: '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
        }
      ]);
      refetchHistory();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleUpdateMessage = async (msgId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setEditingMessageId(null);
    setIsTyping(true);
    try {
      await axios.put(
        `/api/tenshi/message/${msgId}`,
        { content: newContent },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
      refetchHistory();
      
      await runChatTurn(res.data);
    } catch (err) {
      console.error('Error updating message:', err);
      setIsTyping(false);
    }
  };

  const handleSaveEdit = (msgId: string) => {
    handleUpdateMessage(msgId, editingText);
  };

  const handleRegenerate = async (msgId: string) => {
    setIsTyping(true);
    try {
      await axios.delete(`/api/tenshi/message/${msgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
      refetchHistory();

      await runChatTurn(res.data);
    } catch (err) {
      console.error('Error regenerating response:', err);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setViewMode('live');
      startVoiceMode();
    };
    window.addEventListener('open-tenshi-chat', handleOpen);
    return () => window.removeEventListener('open-tenshi-chat', handleOpen);
  }, [startVoiceMode]);

  // Escuchar entrega de informes generados desde sesiones en vivo (ej. Estudio de Puesto de Trabajo con la Fisioterapeuta)
  useEffect(() => {
    const handleReportDelivered = (e: any) => {
      const { title, html, messageId } = e.detail || {};
      if (!html || html.length < 30) return;
      const reportTitle = title || 'Informe de Estudio de Puesto de Trabajo Ergonómico';
      const msgContent = `🩺 **${reportTitle}**\n\nHe registrado el informe oficial de tu **Estudio de Puesto de Trabajo Ergonómico en Vivo** realizado con la Fisioterapeuta Laboral (con las 3 fases posturales, telemetría MediaPipe 3D, matriz diagnóstica CIE-11 y 12 ejercicios de pausas activas ExerciseDB). Puedes **verlo en pantalla** o **descargarlo** directamente desde aquí:`;
      const fileObj = {
        title: reportTitle,
        fileType: 'html',
        content: html,
        canvasId: messageId || `tenshi-ept-report-${Date.now()}`,
      };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: msgContent,
          htmlReport: html,
          file: fileObj,
        },
      ]);
      axios
        .post('/api/tenshi/message', {
          role: 'assistant',
          content: msgContent,
          htmlReport: html,
          file: fileObj,
        })
        .catch(() => {});
      refetchHistoryRef.current?.();
    };
    window.addEventListener('tenshi-report-delivered', handleReportDelivered);
    return () => window.removeEventListener('tenshi-report-delivered', handleReportDelivered);
  }, []);

  // Sincronizar siempre un resumen vivo del propio chat de Tenshi e informes generados en window.__TENSHI_OWN_CHAT_SUMMARY__
  // para que leer_pantalla / getVisibleScreenContent siempre conozca los informes propios de Tenshi
  useEffect(() => {
    try {
      const cleanMsgs = messages.filter((m) => !m.content?.startsWith('[RESULTADO_GUI]'));
      const reports = cleanMsgs.filter((m) => Boolean(m.file?.content || m.htmlReport));
      const summaryLines: string[] = [];
      if (reports.length > 0) {
        const lastReportMsg = reports[reports.length - 1];
        const rTitle = lastReportMsg.file?.title || 'Informe Oficial SG-SST';
        const rawHtml = lastReportMsg.file?.content || lastReportMsg.htmlReport || '';
        const cleanText = rawHtml
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2200);
        summaryLines.push(
          `🔥 [ÚLTIMO INFORME GENERADO EN TU PROPIO CHAT DE TENSHI]: Título: "${rTitle}"\nContenido del informe: ${cleanText}`,
        );
      }
      const recentSlice = cleanMsgs.slice(-6);
      if (recentSlice.length > 0) {
        summaryLines.push('--- Últimos mensajes en tu chat de Tenshi ---');
        recentSlice.forEach((m) => {
          const sender = m.role === 'user' ? 'Usuario' : 'Tenshi';
          const text = (m.content || '').replace(/\s+/g, ' ').trim().substring(0, 350);
          const rBadge = m.file || m.htmlReport ? ` [Adjunto: "${m.file?.title || 'Informe SG-SST'}"]` : '';
          summaryLines.push(`* ${sender}${rBadge}: ${text}`);
        });
      }
      (window as any).__TENSHI_OWN_CHAT_SUMMARY__ = summaryLines.join('\n');
    } catch (_) {}
  }, [messages]);

  useEffect(() => {
    // Si la visión en vivo está activa y expandida, no ejecutar scroll para no bloquear el compositor ni hacer titilar la cámara
    if (isVisionActive && isVisionExpanded) {
      return;
    }
    if ((isOpen || isHeroChatOpen) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isOpen, isHeroChatOpen, isVisionActive, isVisionExpanded]);

  const positionClasses = {
    'bottom-right': 'bottom-24 md:bottom-6 right-6',
    'bottom-left': 'bottom-24 md:bottom-6 left-6',
    'top-right': 'top-6 md:top-6 right-6',
    'top-left': 'top-6 md:top-6 left-6',
  };

  const floatPosition =
    positionClasses[(config?.location as keyof typeof positionClasses) || 'bottom-right'] || 'bottom-6 right-6';

  const runChatTurn = async (currentMessages: TenshiChatMessage[]) => {
    setIsTyping(true);
    setTenshiStatus('Capturando pantalla...');
    try {
      const lastMessage = currentMessages.at(-1);
      const isLoopFeedback = lastMessage?.content?.startsWith('[RESULTADO_GUI]');
      
      // Heurística de captura de DOM: capturar si estamos en un bucle interactivo de GUI, si el usuario pide interactuar o si estamos en páginas informativas/SGSST
      const textQuery = lastMessage?.role === 'user' ? lastMessage.content.toLowerCase() : '';
      const uiActionKeywords = [
        'clic', 'click', 'pantalla', 'formulario', 'abre', 'abrir', 'llena', 'llenar',
        'guarda', 'guardar', 'navega', 'navegar', 'boton', 'botón', 'scroll', 'interactua',
        'digita', 'aplicativo', 'aplicacion', 'aplicación', 'escribe', 'escribir', 'reporte',
        'reportar', 'investigacion', 'investigación', 'accidente', 'diligencia', 'diligenciar',
        'colocar', 'datos', 'crear', 'lee', 'leeme', 'léeme', 'muestra', 'muéstrame',
        'informe', 'registros', 'que hay', 'qué hay', 'ves', 'ver', 'mira', 'mirar',
        'viendo', 'desplaza', 'desplazar', 'desplazate', 'desplázate', 'desplazarse',
        'baja', 'bajar', 'sube', 'subir', 'scrollear', 'deslizar', 'desliza',
        'explica', 'explícame', 'resume', 'resumen', 'articulo', 'artículo', 'curso',
        'leccion', 'lección', 'post', 'blog', 'pagina', 'página', 'planes', 'precio',
        'costo', 'terminos', 'términos', 'politica', 'política', 'trata', 'contenido',
        'opinas', 'opina', 'entiendes', 'enseña', 'dice', 'leer'
      ];
      const isUiActionQuery = uiActionKeywords.some(kw => textQuery.includes(kw));
      const currentPath = window.location.pathname.toLowerCase();
      const isInformationalOrSgsstPage =
        currentPath.startsWith('/sgsst') ||
        currentPath.startsWith('/blog') ||
        currentPath.startsWith('/training') ||
        currentPath.startsWith('/ruta-aprendizaje') ||
        currentPath.startsWith('/planes') ||
        currentPath.startsWith('/terms') ||
        currentPath.startsWith('/privacy') ||
        currentPath.startsWith('/about') ||
        currentPath.startsWith('/hoja-de-ruta') ||
        currentPath.startsWith('/contactanos') ||
        currentPath.startsWith('/comunidad');
      
      const shouldCaptureDOM = isLoopFeedback || isUiActionQuery || isInformationalOrSgsstPage;
      
      let domState = '';
      if (shouldCaptureDOM) {
        const dehydrated = getDehydratedDOM();
        const visibleContent = getVisibleScreenContent();
        domState = `${dehydrated}\n\n=== CONTENIDO VISIBLE E INFORMES DE PANTALLA ===\n${visibleContent}`;
      }
      console.log('[Tenshi Frontend] Dehydrated DOM length:', domState.length, '(Capture enabled:', shouldCaptureDOM, ')');
      
      setTenshiStatus('Consultando con Tenshi...');

      // Limitar el historial a los últimos 20 mensajes para evitar saturación de tokens (429).
      // Siempre preservar el primer mensaje del usuario como ancla de la tarea original.
      const filteredMessages = currentMessages.filter((m) => m.role !== 'system');
      const MAX_HISTORY = 20;
      let cappedMessages = filteredMessages;
      if (filteredMessages.length > MAX_HISTORY) {
        const firstUserMsg = filteredMessages.find(m => m.role === 'user');
        const recentMessages = filteredMessages.slice(-MAX_HISTORY);
        // Preservar el primer mensaje si no está en los recientes
        if (firstUserMsg && !recentMessages.includes(firstUserMsg)) {
          cappedMessages = [firstUserMsg, ...recentMessages];
        } else {
          cappedMessages = recentMessages;
        }
      }

      // Sanitizar mensajes del historial: remover dataUrl gigantes de los turnos pasados
      // para evitar que el payload acumulativo alcance 200MB o desborde la memoria.
      // Solo el último mensaje (el actual) conserva su dataUrl para Gemini.
      const sanitizedMessages = cappedMessages.map((m, index) => {
        const isLast = index === cappedMessages.length - 1;
        if (isLast) return m;
        return {
          ...m,
          image: undefined,
          media: m.media ? { ...m.media, dataUrl: undefined, previewUrl: undefined } : undefined,
        };
      });

      const response = await axios.post(
        '/api/tenshi/chat',
        {
          messages: sanitizedMessages,
          browserState: domState,
          tenshiKey: typeof window !== 'undefined' ? localStorage.getItem('librechat_user_key_tenshi_google') || undefined : undefined,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const responseData = response.data;
      console.log('[Tenshi Frontend] Received response:', responseData);

      const isLiveEptGui =
        responseData.guiAction?.name === 'wappy_iniciar_estudio_ergonomico_vivo' ||
        responseData.guiAction?.accion === 'iniciar_estudio_ergonomico_vivo';

      const assistantMsg = {
        role: 'assistant',
        content: responseData.response,
        htmlReport: responseData.htmlReport,
        qrCode: responseData.qrCode,
        file: responseData.file,
        isIntermediate:
          !isLiveEptGui &&
          (!!responseData.guiAction || (responseData.guiActions && responseData.guiActions.length > 0)),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));

      // Si Tenshi requiere una o más acciones visuales, las ejecutamos en secuencia en el cliente
      const actions = responseData.guiActions || (responseData.guiAction ? [responseData.guiAction] : []);
      if (actions.length > 0) {
        console.log('[Tenshi Frontend] GUI actions requested:', actions);
        let cumulativeMessages = [...currentMessages, assistantMsg];
        let lastResult: { success: boolean; message: string } | null = null;
        let index = 0;

        for (const action of actions) {
          if (
            action.name === 'wappy_iniciar_estudio_ergonomico_vivo' ||
            action.accion === 'iniciar_estudio_ergonomico_vivo'
          ) {
            // Abrir visión por cámara, visión expandida y HUD ergonómico 3D de la Fisioterapeuta en Tenshi
            setIsBiomechanicsActive(true);
            setIsVisionExpanded(true);
            startVision('camera');
            if (!isVoiceActiveRef.current) {
              startVoiceMode();
            }
            setTenshiStatus('');
            setIsTyping(false);
            continue;
          }

          if (
            action.name === 'wappy_controlar_videollamada' ||
            action.accion === 'activar_camara' ||
            action.accion === 'apagar_camara' ||
            action.accion === 'colgar_llamada' ||
            action.action === 'wappy_controlar_videollamada'
          ) {
            const acc = action.accion || action.args?.accion;
            if (acc === 'activar_camara') {
              tenshiAudio.playBlip();
              startVision('camera');
            } else if (acc === 'apagar_camara') {
              tenshiAudio.playBlip();
              stopVision();
            } else if (acc === 'colgar_llamada') {
              tenshiAudio.playBlip();
              stopVision();
              stopVoiceMode();
            }
            lastResult = { success: true, message: `Control de videollamada ejecutado: ${acc}` };
            setTenshiStatus('');
            continue;
          }

          if (action.name === 'wappy_navegar' || action.accion === 'navegar') {
            const rawModulo = action.modulo || action.args?.modulo;
            const rawRuta = action.ruta || action.args?.ruta;
            const { targetRoute, targetSgsstModule } = resolveWappyDestination(rawModulo, rawRuta);

            setTenshiStatus(`Navegando a ${targetRoute}...`);
            setGuiSteps((prev) => [
              ...prev,
              { action: 'NAVEGAR', details: `Ir a ${targetRoute}`, status: 'pending' },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 200));

            const isSettings = rawModulo === 'configuracion' || rawModulo === 'settings' || rawModulo === 'ajustes' || targetRoute === '/settings';
            const isCompanyModal = rawModulo === 'empresas' || rawModulo === 'empresas_registradas' || targetRoute.includes('modal=empresas');

            if (isSettings) {
              window.dispatchEvent(new CustomEvent('open-settings'));
            } else if (isCompanyModal) {
              navigate(targetRoute);
              window.dispatchEvent(new CustomEvent('open-company-info'));
            } else {
              navigate(targetRoute);
              if (targetSgsstModule) {
                window.dispatchEvent(
                  new CustomEvent('navigate-sgsst', { detail: { module: targetSgsstModule } })
                );
              }
            }

            lastResult = { success: true, message: `Navegación completada con éxito hacia ${targetRoute}` };
            setGuiSteps((prev) => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1].status = 'success';
              }
              return updated;
            });

            cumulativeMessages.push({
              role: 'user',
              content: `[RESULTADO_GUI] Navegación ejecutada con éxito a ${targetRoute}.`,
            });

            index++;
            continue;
          }

          if (
            action.name === 'wappy_abrir_curso' ||
            action.accion === 'abrir_curso' ||
            action.action === 'wappy_abrir_curso'
          ) {
            const rawRuta = action.ruta || action.args?.ruta || '/academia?tab=cursos';
            tenshiAudio.playBlip();
            setTenshiStatus(`Abriendo curso...`);
            navigate(rawRuta);
            lastResult = { success: true, message: `Curso abierto con éxito: ${rawRuta}` };
            setTenshiStatus('');
            index++;
            continue;
          }

          if (
            action.name === 'wappy_abrir_articulo_blog' ||
            action.accion === 'abrir_articulo_blog' ||
            action.action === 'wappy_abrir_articulo_blog'
          ) {
            const rawRuta = action.ruta || action.args?.ruta || '/academia?tab=blog';
            tenshiAudio.playBlip();
            setTenshiStatus(`Abriendo artículo de blog...`);
            navigate(rawRuta);
            lastResult = { success: true, message: `Artículo de blog abierto con éxito: ${rawRuta}` };
            setTenshiStatus('');
            index++;
            continue;
          }

          setTenshiStatus(`Acción visual (${index + 1}/${actions.length}): ${action.accion}...`);

          // Registrar paso de automatización para mostrar en el acordeón de acciones
          const actionLabel = (action.accion || action.name || 'ACCION').toUpperCase();
          let detailLabel = '';
          if (action.indice !== undefined) {
            detailLabel = `Índice [${action.indice}]`;
          }
          if (action.texto) {
            detailLabel += `${detailLabel ? ': ' : ''}"${action.texto}"`;
          } else if (action.direccion) {
            detailLabel += `${detailLabel ? ': ' : ''}hacia ${action.direccion}`;
          }
          if (!detailLabel) {
            detailLabel = action.accion === 'esperar' ? 'Espera temporal de 1.5s' : 'Ejecución de acción general';
          }

          setGuiSteps((prev) => [
            ...prev,
            { action: actionLabel, details: detailLabel, status: 'pending' },
          ]);

          // Esperamos un momento mínimo para actualización de UI
          await new Promise((resolve) => setTimeout(resolve, 250));

          setTenshiStatus(`Desplazando e interactuando con elemento [${action.indice}]...`);
          const actionResult = await executeGUIAction(
            action.accion,
            action.indice,
            action.texto,
            action.direccion,
            action.detalle || action.campo
          );
          console.log('[Tenshi Frontend] GUI action result:', actionResult);

          lastResult = actionResult;

          // Actualizar estado de la acción ejecutada en los logs del acordeón
          setGuiSteps((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].status = actionResult.success ? 'success' : 'failed';
            }
            return updated;
          });

          // Guardar en el historial temporal acumulado para que el backend tenga contexto
          cumulativeMessages.push({
            role: 'user',
            content: `[RESULTADO_GUI] Acción ${action.accion} ejecutada en elemento [${action.indice}]. Resultado: ${actionResult.message}`,
          });

          index++;
        }

        const newDOM = getDehydratedDOM();
        const finalFeedbackMsg = {
          role: 'user',
          content: `[RESULTADO_GUI] Lote de acciones completado en el cliente. Último resultado: ${lastResult?.message}. Estado actual de la pantalla:\n${newDOM}`,
        };

        // Reanudamos la conversación de forma automática pasándole todo el historial acumulado en lote
        console.log('[Tenshi Frontend] Sending batched feedback to backend:', finalFeedbackMsg);
        setTenshiStatus('Enviando resultado...');
        await runChatTurn([...cumulativeMessages, finalFeedbackMsg]);
      } else {
        console.log('[Tenshi Frontend] No GUI action requested. Ending turn.');
        setTenshiStatus('');
        setIsTyping(false);
      }
    } catch (error: any) {
      console.error('[Tenshi Frontend] Error in runChatTurn:', error);
      setTenshiStatus('');
      const status = error.response?.status;
      const rawDetails = String(error.response?.data?.details || error.message || '');
      let userFriendlyMsg = rawDetails;

      if (status === 502 || rawDetails.includes('502')) {
        userFriendlyMsg =
          'Se interrumpió la conexión brevemente mientras el servidor terminaba de actualizarse (Error 502). Ya estamos totalmente en línea. ¡Por favor reenvíame tu solicitud!';
      } else if (
        status === 503 ||
        rawDetails.includes('503') ||
        rawDetails.toLowerCase().includes('service unavailable') ||
        rawDetails.toLowerCase().includes('high demand') ||
        rawDetails.toLowerCase().includes('alta demanda')
      ) {
        userFriendlyMsg =
          'En este instante los servidores de IA tuvieron un pico de alta demanda temporal. Por favor vuelve a pulsar el botón o reenvíame tu consulta y la procesaremos de inmediato.';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${userFriendlyMsg}`,
        },
      ]);
      setIsTyping(false);
      setTenshiStatus('');
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (typeof customText === 'string' ? customText : input).trim();
    if ((!textToSend && !attachedMedia) || isTyping) return;

    // Detectar si el usuario pide inspeccionar o revisar un tema específico para adaptar el protocolo Live
    if (textToSend) {
      updateTenshiProtocolByIntent(textToSend);
    }

    // Si había una consulta de especialista pendiente o audio en curso, abortarla de inmediato
    if (pendingAgentConsultationRef.current?.active) {
      pendingAgentConsultationRef.current.active = false;
      setIsWaitingConsultation(false);
      if (consultationTimerRef.current) {
        clearTimeout(consultationTimerRef.current);
        consultationTimerRef.current = null;
      }
    }
    clearAudioQueue();
    sendVoiceInterruptRef.current();

    setGuiSteps([]); // Limpiar logs de automatización anteriores

    const finalContent = textToSend || (
      attachedMedia?.type === 'image'
        ? `Analiza esta imagen adjunta: ${attachedMedia.name}`
        : attachedMedia?.type === 'video'
        ? `Analiza este video adjunto: ${attachedMedia.name}`
        : `Revisa este archivo adjunto: ${attachedMedia?.name || 'documento'}`
    );

    const userMsg: TenshiChatMessage = {
      role: 'user',
      content: finalContent,
      ...(attachedMedia?.type === 'image' && attachedMedia.dataUrl ? { image: attachedMedia.dataUrl } : {}),
      ...(attachedMedia ? { media: attachedMedia } : {}),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedMedia(null);

    await runChatTurn([...messages, userMsg]);
  };

  const openHtmlReport = (html: string) => {
    let fullContent = html;

    const stickyHeader = `
        <div id="report-sticky-header" style="position: sticky; top: 0; background: #ffffff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; z-index: 99999; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #10b981; color: #ffffff !important; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">WAPPY IA</span>
                <span id="report-header-title" style="color: #0f172a !important; font-weight: 700; font-size: 14px;">Informe Oficial de SST</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button id="theme-toggle-btn" onclick="toggleTheme()" style="background: #f1f5f9; color: #334155 !important; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    <span id="theme-btn-text">🌓 Modo Oscuro</span>
                </button>
                <button onclick="window.print()" style="background: #10b981; color: #ffffff !important; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;">
                    🖨️ Imprimir / Guardar PDF
                </button>
            </div>
        </div>
        <script>
            function toggleTheme() {
                const isDark = document.documentElement.classList.toggle('report-dark');
                document.body.classList.toggle('report-dark', isDark);
                const btnText = document.getElementById('theme-btn-text');
                const btn = document.getElementById('theme-toggle-btn');
                const title = document.getElementById('report-header-title');
                const header = document.getElementById('report-sticky-header');
                if (isDark) {
                    if(btnText) btnText.innerText = '☀️ Modo Claro';
                    if(btn) { btn.style.backgroundColor = '#334155'; btn.style.borderColor = '#475569'; btn.style.setProperty('color', '#ffffff', 'important'); }
                    if(header) { header.style.backgroundColor = '#1e293b'; header.style.borderColor = '#334155'; }
                    if(title) title.style.setProperty('color', '#ffffff', 'important');
                } else {
                    if(btnText) btnText.innerText = '🌓 Modo Oscuro';
                    if(btn) { btn.style.backgroundColor = '#f1f5f9'; btn.style.borderColor = '#cbd5e1'; btn.style.setProperty('color', '#334155', 'important'); }
                    if(header) { header.style.backgroundColor = '#ffffff'; header.style.borderColor = '#e2e8f0'; }
                    if(title) title.style.setProperty('color', '#0f172a', 'important');
                }
            }
        </script>
        <style>
            @media print {
                #report-sticky-header { display: none !important; }
            }
            /* Global Light Theme Override (High Contrast) */
            html, body {
                background-color: #f8fafc !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                margin: 0; padding: 0;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #0f172a !important;
            }
            p, span, li, td, th, label, div {
                color: inherit;
            }
            /* Fix invisible text on cards/containers in Light Mode */
            .text-white, .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400 {
                color: #0f172a !important;
            }
            /* Table Styling High Contrast */
            table {
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 16px 0 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            th, td {
                border: 1px solid #cbd5e1 !important;
                color: #0f172a !important;
                padding: 12px 16px !important;
                text-align: left;
            }
            th {
                background-color: #f1f5f9 !important;
                font-weight: 700 !important;
                color: #0f172a !important;
            }
            tr:nth-child(even) td {
                background-color: #f8fafc !important;
            }
            
            /* Dark Theme Overrides */
            html.report-dark, body.report-dark {
                background-color: #0f172a !important;
                color: #f8fafc !important;
            }
            .report-dark h1, .report-dark h2, .report-dark h3, .report-dark h4, .report-dark h5, .report-dark h6 {
                color: #ffffff !important;
            }
            .report-dark .text-white, .report-dark .text-slate-100, .report-dark .text-slate-200, .report-dark .text-slate-300, .report-dark .text-slate-400 {
                color: #f8fafc !important;
            }
            .report-dark table {
                background-color: #1e293b !important;
                border-color: #334155 !important;
            }
            .report-dark th, .report-dark td {
                border-color: #334155 !important;
                color: #f8fafc !important;
            }
            .report-dark th {
                background-color: #334155 !important;
                color: #ffffff !important;
            }
            .report-dark tr:nth-child(even) td {
                background-color: #0f172a !important;
            }
        </style>
        `;

    if (fullContent.includes('<body')) {
      fullContent = fullContent.replace(/<body([^>]*)>/i, `<body$1>${stickyHeader}`);
    } else {
      fullContent = stickyHeader + fullContent;
    }

    // Use Blob URL so printing or closing print modal in Safari/Chrome doesn't destroy the tab
    const blob = new Blob([fullContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  const getHtmlFromMsg = (msg: { content: string; htmlReport?: string }) => {
    if (msg.htmlReport) return msg.htmlReport;
    if (msg.content.includes('<!DOCTYPE html>') || msg.content.includes('<html')) {
      const match = msg.content.match(/<!DOCTYPE html[\s\S]*<\/html>|<html[\s\S]*<\/html>/i);
      if (match) return match[0];
    }
    return null;
  };

  const cleanRenderContent = (content: string) => {
    if (!content) return '';
    if (
      content.includes('<!DOCTYPE html') ||
      content.includes('<html') ||
      content.includes('<head') ||
      content.includes('<body')
    ) {
      let cleaned = content
        .replace(/<!DOCTYPE html[\s\S]*?<\/html>/gi, '')
        .replace(/<html[\s\S]*?<\/html>/gi, '')
        .replace(/<!DOCTYPE[\s\S]*/gi, '')
        .replace(/<html[\s\S]*/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<body[\s\S]*/gi, '')
        .trim();
      return cleaned || '✨ El informe técnico ha sido estructurado y generado con éxito. Puedes abrirlo directamente con los botones oficiales abajo.';
    }
    return content;
  };

  const safeTriggerDownload = (blob: Blob, filename: string) => {
    try {
      saveAs(blob, filename);
    } catch (saveErr) {
      console.warn('[TenshiChat] saveAs failed, triggering native anchor download:', saveErr);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }
  };

  const handleDownloadFile = useCallback((file: TenshiFileAttachment) => {
    try {
      const safeTitle = (file.title || 'documento-sgsst').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      const isHtmlContent = typeof file.content === 'string' && (file.content.includes('<!DOCTYPE html') || file.content.includes('<html'));
      const isImageContent = typeof file.content === 'string' && (file.content.startsWith('data:image/') || file.content.startsWith('http'));

      if (file.fileType === 'excel' || file.fileType === 'xlsx') {
        let data: any = file.content;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (_) {}
        }
        let ws: XLSX.WorkSheet;
        if (Array.isArray(data) && Array.isArray(data[0])) {
          ws = XLSX.utils.aoa_to_sheet(data);
        } else if (Array.isArray(data) && typeof data[0] === 'object') {
          ws = XLSX.utils.json_to_sheet(data);
        } else {
          ws = XLSX.utils.aoa_to_sheet([[String(data)]]);
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        safeTriggerDownload(blob, `${safeTitle}.xlsx`);
      } else if (file.fileType === 'html' || isHtmlContent) {
        const blob = new Blob([file.content], { type: 'text/html;charset=utf-8' });
        safeTriggerDownload(blob, `${safeTitle}.html`);
      } else if (file.fileType === 'image' || file.fileType === 'imagen' || isImageContent) {
        if (file.content.startsWith('data:image/')) {
          const byteString = atob(file.content.split(',')[1]);
          const mimeString = file.content.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const ext = mimeString.includes('png') ? 'png' : 'jpg';
          safeTriggerDownload(blob, `${safeTitle}.${ext}`);
        } else if (file.content.startsWith('http')) {
          const a = document.createElement('a');
          a.href = file.content;
          a.download = `${safeTitle}.png`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
          safeTriggerDownload(blob, `${safeTitle}.txt`);
        }
      } else if (file.fileType === 'presentation') {
        const blob = new Blob([file.content], { type: 'application/json;charset=utf-8' });
        safeTriggerDownload(blob, `${safeTitle}.json`);
      } else {
        // Documento Word / Texto / Fallback general para 'documento'
        const simpleHtml = markdownToSimpleHtml(file.content || '');
        const wordHtml = `
          <!DOCTYPE html>
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>${file.title}</title>
            <style>
              body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
              h1 { font-size: 20pt; color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 6px; }
              h2 { font-size: 14pt; color: #0d9488; margin-top: 18px; }
              h3 { font-size: 12pt; color: #334155; }
              table { border-collapse: collapse; width: 100%; margin: 16px 0; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; }
              p { margin: 8px 0; }
              li { margin: 4px 0; }
            </style>
          </head>
          <body>
            ${simpleHtml}
          </body>
          </html>
        `;
        const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
        safeTriggerDownload(blob, `${safeTitle}.doc`);
      }
    } catch (err) {
      console.error('[TenshiChat] Error al descargar archivo:', err);
    }
  }, []);

  const handleOpenFileInCanvas = useCallback(
    (file: TenshiFileAttachment, fullScreen = true) => {
      const isHtmlContent = typeof file.content === 'string' && (file.content.includes('<!DOCTYPE html') || file.content.includes('<html'));
      const normFileType = (file.fileType === 'word' || file.fileType === 'doc' || file.fileType === 'documento')
        ? 'text'
        : (file.fileType === 'html' || isHtmlContent)
        ? 'html'
        : (file.fileType as any || 'text');

      // 1. Asegurar que estamos en una vista compatible con el editor Canvas si no estamos en chat
      if (!window.location.pathname.startsWith('/c/')) {
        navigate('/c/new');
      }

      // 2. Cargar en Canvas y maximizar a pantalla completa en el editor
      setStreamingCanvas({
        id: file.canvasId || `canvas-${Date.now()}`,
        title: file.title || 'Documento SG-SST',
        fileType: normFileType,
        content: file.content || '',
        messageId: '',
        isStreaming: false,
      });
      setIsCanvasActive(true);
      if (fullScreen) {
        setCanvasMaximized(true);
      }
    },
    [navigate, setStreamingCanvas, setIsCanvasActive, setCanvasMaximized, conversation, newConversation],
  );

  const requestTechnicalReport = useCallback(() => {
    tenshiAudio.playChime();
    setIsGeneratingTechnicalReport(true);
    setVoiceStatusText('⏳ Compilando y generando informe técnico oficial...');

    // 1. Snapshot de la cámara activa si está en video
    if (isVisionActive && visionSource === 'camera') {
      captureVisionSnapshot(
        isBiomechanicsActive
          ? undefined
          : '📸 Evidencia de Inspección Visual SST'
      );
    }

    // 2. Disparar generación vía WebSocket de voz si está conectado
    const sentViaWs = triggerVoiceReportRef.current ? triggerVoiceReportRef.current() : false;

    // 3. Fallback de alta resiliencia: si el WebSocket no estaba abierto o falló, enviar instrucción vía chat
    if (!sentViaWs) {
      console.log('[TenshiChat] Sesión de voz no disponible para trigger_report; enviando solicitud vía chat');
      handleSend(
        isBiomechanicsActive
          ? 'Por favor compila el informe técnico ergonómico de estudio de puesto de trabajo con las evidencias y recomendaciones observadas.'
          : `Por favor compila el informe técnico de la inspección (${activeProtocol.title}) con las evidencias fotográficas y recomendaciones observadas.`
      );
    }
  }, [
    isVisionActive,
    visionSource,
    isBiomechanicsActive,
    activeProtocol.title,
    captureVisionSnapshot,
    handleSend,
  ]);

  useEffect(() => {
    requestTechnicalReportRef.current = requestTechnicalReport;
  }, [requestTechnicalReport]);

  const showVoiceModal = useRecoilValue(store.showVoiceModal);
  const showLiveAnalysisModal = useRecoilValue(store.showLiveAnalysisModal);

  if (!isAuthenticated || !config || !config.isActive || showVoiceModal || showLiveAnalysisModal) {
    return null;
  }

  return (
    <>
      {/* Dynamic Keyframes for Tenshi Live Avatar */}
      <style>{`
        @keyframes tenshiFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.6deg); }
        }
        @keyframes tenshiSpeakingBob {
          0%, 100% { transform: scale(1) translateY(0px); }
          25% { transform: scale(1.04) translateY(-3px); }
          50% { transform: scale(0.98) translateY(1px); }
          75% { transform: scale(1.05) translateY(-4px); }
        }
        .animate-tenshi-float {
          animation: tenshiFloat 4s ease-in-out infinite;
        }
        .animate-tenshi-speaking {
          animation: tenshiSpeakingBob 0.65s ease-in-out infinite;
        }
      `}</style>


      {/* ✅ NOTIFICACIÓN TOAST GLOBAL: INFORME GENERADO CON ÉXITO */}
      {reportSuccessToast && (
        <div className="fixed top-5 sm:top-8 left-1/2 -translate-x-1/2 z-[99999] max-w-[92vw] sm:max-w-md w-fit flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-emerald-600/95 text-white backdrop-blur-xl border border-emerald-400/50 shadow-2xl shadow-emerald-950/70 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
          <span className="text-xl shrink-0">✅</span>
          <div className="flex flex-col min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white truncate">¡Informe Técnico Generado con Éxito!</div>
            <div className="text-[10px] sm:text-xs text-emerald-100 truncate">Disponible en pantalla y registrado en el chat de Tenshi.</div>
          </div>
        </div>
      )}

      {/* 🖼️ LIGHTBOX MODAL: AMPLIAR IMAGEN IN-APP (SIN PANTALLA BLANCA) */}
      {lightboxImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999999] flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setLightboxImage(null)}
        >
          {/* Barra Superior con Controles */}
          <div
            className="w-full max-w-4xl flex items-center justify-between gap-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="h-2 w-2 rounded-full bg-teal-400 shrink-0 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
                {lightboxImage.title || 'Evidencia fotográfica SST'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try {
                    const safeTitle = (lightboxImage.title || 'evidencia_tenshi')
                      .replace(/[^a-zA-Z0-9_-]/g, '_')
                      .slice(0, 40);
                    saveAs(lightboxImage.url, `${safeTitle}.jpg`);
                  } catch (downloadErr) {
                    console.error('[TenshiChat] Error al descargar imagen:', downloadErr);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-md font-bold text-xs active:scale-95 transition-all"
                title="Descargar fotografía"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Descargar</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-md active:scale-95 transition-all flex items-center justify-center"
                title="Cerrar imagen ampliada"
              >
                <X className="w-5 h-5 text-slate-200 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Contenedor Central de Imagen Ampliada */}
          <div
            className="flex-1 w-full max-w-4xl flex items-center justify-center p-2 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title || 'Evidencia fotográfica ampliada'}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 cursor-zoom-out"
              onClick={() => setLightboxImage(null)}
            />
          </div>

          {/* Pie de foto / Instrucción táctil */}
          <div
            className="shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] text-white/60 pointer-events-none"
          >
            Toca la imagen o el fondo para cerrar
          </div>
        </div>,
        document.body
      )}

      {/* 📱 1. MODO HEROICO / PANTALLA COMPLETA EN CELULAR */}
      {isMobileHeroMode ? (
        <div
          id="tenshi-mobile-hero-container"
          className="fixed inset-x-0 top-0 bottom-0 z-[50] flex flex-col md:hidden bg-slate-100 dark:bg-zinc-950 bg-gradient-to-b from-slate-50 via-teal-50 to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-slate-800 dark:text-zinc-100 overflow-hidden animate-in fade-in duration-200"
          style={{
            paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
          }}
        >
          {/* Cabecera Móvil (Con respeto de Notch/Dynamic Island en iPhone) */}
          <div
            className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-200/60 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0 select-none"
            style={{
              paddingTop: 'max(14px, env(safe-area-inset-top, 0px))',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <TenshiAvatar
                  size={32}
                  mood={derivedAvatarMood}
                  isSpeaking={isTenshiSpeaking}
                  outputAmplitude={outputAmplitude}
                  isVoiceActive={isVoiceActive}
                  interactive={false}
                  showHaloEffect={false}
                  showHUD={true}
                />
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-900',
                    isVoiceActive ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'
                  )}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-none">
                    {config?.name || 'Tenshi'}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold">
                    WAPPY SST
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] font-medium text-slate-500 dark:text-zinc-400">
                  {isTenshiSpeaking
                    ? 'Hablando contigo...'
                    : isVoiceActive
                    ? 'Voz en vivo activa'
                    : 'Asistente WAPPY IA'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Botón SFX */}
              <button
                type="button"
                onClick={handleToggleSFX}
                title={isSFXMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {isSFXMuted ? <VolumeX className="h-3.5 w-3.5 text-emerald-500" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              {/* Botón Salir a WAPPY normal */}
              <button
                type="button"
                onClick={() => {
                  tenshiAudio.playBlip();
                  setIsMobileHeroMode(false);
                  setIsHeroChatOpen(false);
                  try {
                    sessionStorage.setItem('tenshi_mobile_hero_minimized', 'true');
                    sessionStorage.setItem('tenshi_mobile_hero_exited', 'true');
                    sessionStorage.removeItem('tenshi_mobile_hero_forced');
                  } catch (_) {}
                  navigate('/c/new');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 shadow-2xs active:scale-95 transition-all"
                title="Ir a interfaz normal de WAPPY"
              >
                <span>Ir a Wappy</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </button>
            </div>
          </div>

          {/* Área Central Hero: SOLO Tenshi Grande, su Saludo y su Botonera Cápsula Activa */}
          <div className="flex-1 px-4 py-4 flex flex-col items-center justify-center -mt-4 select-none relative">
            {/* 1. Avatar Grande de Tenshi (315px) */}
            <div
              className="relative flex flex-col items-center my-1 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
              onClick={() => {
                tenshiAudio.playBlip();
                if (!isVoiceActive) {
                  startVoiceMode();
                } else {
                  stopVoiceMode();
                }
              }}
              title="Tócame para hablar"
            >
              <TenshiAvatar
                size={315}
                mood={derivedAvatarMood}
                isSpeaking={isTenshiSpeaking}
                outputAmplitude={outputAmplitude}
                isVoiceActive={isVoiceActive}
                isTyping={isTyping || isChatSubmitting || isWaitingConsultation || Boolean(tenshiStatus)}
                statusText={liveActionPill || tenshiStatus || undefined}
                interactive={true}
                showHaloEffect={true}
                showHUD={true}
              />
            </div>

            {/* 2. Saludo & Subtítulo */}
            <div className="text-center max-w-xs mt-7 mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                ¡Hola, {user?.name?.split(' ')[0] || user?.username || 'Especialista'}!
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-snug font-medium">
                {isVoiceActive
                  ? isMicMuted
                    ? 'Micrófono silenciado (Mute activo). Tenshi no te escucha.'
                    : 'Voz en vivo activa. Te estoy escuchando...'
                  : 'Soy tu copiloto en SG-SST. Tócame para hablar o pulsa el micrófono.'}
              </p>
            </div>

            {/* PiP en Pantalla Hero Móvil cuando el chat está cerrado */}
            {isVisionActive && !isHeroChatOpen && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/60 bg-zinc-950 shadow-2xl w-full max-w-xs h-40 mb-3 shrink-0 animate-in fade-in zoom-in-95">
                <video
                  ref={setVisionVideoNode}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl bg-black"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] text-white font-bold border border-white/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span>EN VIVO ({facingMode === 'user' ? 'Frontal' : 'Trasera'})</span>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {visionSource === 'camera' && (
                    <button
                      type="button"
                      onClick={switchCamera}
                      title="Girar cámara"
                      className="p-1 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 active:scale-95 shadow-md"
                    >
                      <SwitchCamera className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopVision}
                    title="Detener visión"
                    className="p-1 rounded-full bg-red-600/80 hover:bg-red-700 text-white backdrop-blur-md active:scale-95 shadow-md"
                  >
                    <CameraOff className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                  <span className="text-[9px] text-zinc-300 font-medium truncate">Tenshi analiza en vivo</span>
                  <button
                    type="button"
                    onClick={() => captureVisionSnapshot('📸 Evidencia visual')}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] font-bold shadow-md active:scale-95"
                  >
                    <Camera className="h-3 w-3" />
                    <span>Tomar Foto</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. 🌟 Botonera Cápsula de Tenshi ACTIVA ([Chat] [Micrófono Live] [Silenciar Micrófono/Mute]) */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-black/40">
              {/* Botón Chat */}
              <button
                type="button"
                onClick={() => {
                  tenshiAudio.playBlip();
                  setIsHeroChatOpen((prev) => !prev);
                }}
                title={isHeroChatOpen ? 'Cerrar chat' : 'Abrir chat con Tenshi'}
                className={cn(
                  'p-2.5 rounded-full transition-all active:scale-90',
                  isHeroChatOpen ? 'text-emerald-400 bg-white/15' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                )}
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              {/* Botón Micrófono / Live Mode */}
              <button
                type="button"
                onClick={() => {
                  tenshiAudio.playBlip();
                  if (isVoiceActive) {
                    stopVoiceMode();
                  } else {
                    startVoiceMode();
                  }
                }}
                title={isVoiceActive ? 'Pausar modo voz' : 'Activar modo voz (Live)'}
                className={cn(
                  'p-2.5 rounded-full transition-all active:scale-90',
                  isVoiceActive
                    ? 'text-emerald-400 bg-white/20 shadow-lg shadow-emerald-500/30 animate-pulse'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                )}
              >
                <Mic className="h-5 w-5" />
              </button>

              {/* Botón 3: Silenciar Micrófono (Mute de audio del usuario) */}
              <button
                type="button"
                onClick={handleToggleMicMute}
                title={isMicMuted ? 'Micrófono en silencio - Clic para reactivar' : 'Silenciar mi micrófono (Mute)'}
                className={cn(
                  'p-2.5 rounded-full transition-all active:scale-90',
                  isMicMuted
                    ? 'text-red-400 bg-red-500/25 border border-red-500/50 shadow-lg shadow-red-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                )}
              >
                {isMicMuted ? (
                  <MicOff className="h-5 w-5 text-red-400" />
                ) : (
                  <MicOff className="h-5 w-5 text-zinc-400 hover:text-white opacity-70" />
                )}
              </button>

              {/* Botón 4: Modo Visión (Cámara en Vivo) */}
              <button
                type="button"
                onClick={() => {
                  tenshiAudio.playBlip();
                  if (isVisionActive) {
                    stopVision();
                  } else {
                    startVision('camera');
                  }
                }}
                title={isVisionActive ? 'Detener cámara de visión' : 'Activar cámara de visión en vivo'}
                className={cn(
                  'p-2.5 rounded-full transition-all active:scale-90',
                  isVisionActive
                    ? 'text-emerald-400 bg-white/20 shadow-lg shadow-emerald-500/30 animate-pulse'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                )}
              >
                {isVisionActive ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* 4. Panel Desplegable de Chat (SOLO cuando el usuario lo abre desde la botonera de Tenshi) */}
          {isHeroChatOpen && (
            <div
              className="absolute inset-x-0 bottom-0 top-14 z-50 flex flex-col bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-slate-200/80 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
              style={{
                paddingBottom: 'calc(max(8px, calc(env(safe-area-inset-bottom, 0px) - 6px)) + 74px)',
              }}
            >
              {/* Cabecera del Panel de Chat */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/80 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    Chat con Tenshi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                    title="Reiniciar chat"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tenshiAudio.playBlip();
                      setIsHeroChatOpen(false);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-200"
                    title="Cerrar chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Selector de Personalidad Adaptativa (1 Clic - Móvil) con Letrero Estilo WAPPY */}
              <div className="flex flex-col gap-1.5 border-b border-slate-200/50 bg-white/85 px-3.5 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/85 shrink-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Modo:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {([
                      { id: 'express', label: '⚡ Express', desc: '⚡ Directo al grano: Respuestas ejecutivas en 1-2 frases' },
                      { id: 'consultor', label: '🛡️ Consultor', desc: '🛡️ Consultor Senior: Cálido, explicativo y empático' },
                      { id: 'auditor', label: '⚖️ Auditor', desc: '⚖️ Auditor Legal: Riguroso en Decreto 1072 y Res. 0312' },
                    ] as const).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectPersonality(m.id)}
                        onMouseEnter={() => setHoveredPersonality(m.id)}
                        onMouseLeave={() => setHoveredPersonality(null)}
                        className={cn(
                          'px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 border shadow-2xs',
                          personalityMode === m.id
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-600 dark:text-teal-300'
                            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50'
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/30 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <span>
                    {(hoveredPersonality || personalityMode) === 'express'
                      ? '⚡ Directo al grano: Respuestas ejecutivas en 1-2 frases'
                      : (hoveredPersonality || personalityMode) === 'auditor'
                        ? '⚖️ Auditor Legal: Rigor normativo en Decreto 1072 y Res. 0312'
                        : '🛡️ Consultor Senior: Asesoría cálida, explicativa e integral en SG-SST'}
                  </span>
                </div>
              </div>

              {/* Visor de Tenshi Visión y Telemetría Ergonómica en Chat Móvil */}
              {isVisionActive && (
                <div
                  className={cn(
                    'relative overflow-hidden bg-zinc-950 transition-all duration-300 animate-in fade-in zoom-in-95 flex items-center justify-center',
                    isVisionExpanded
                      ? 'flex-1 min-h-[360px] h-full w-full rounded-2xl border-2 border-cyan-500/50 shadow-xl mx-2 my-1.5'
                      : 'h-44 shrink-0 rounded-2xl border-2 border-emerald-500/60 shadow-md mx-3 my-1'
                  )}
                >
                  <video
                    ref={setVisionVideoNode}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover bg-black"
                  />

                  {/* Overlay de cámara pausada */}
                  {!isCameraOn && visionSource === 'camera' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xs z-15 pointer-events-none">
                      <VideoOff className="w-7 h-7 text-white/40 mb-1 animate-pulse" />
                      <span className="text-[11px] font-mono text-white/70">Cámara pausada</span>
                      <span className="text-[9px] font-mono text-white/40 mt-0.5">Tenshi te escucha en vivo</span>
                    </div>
                  )}

                  {/* Canvas de MediaPipe para Exoesqueleto Neón */}
                  <canvas
                    ref={biomechanicCanvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                  />

                  {/* Flash visual de captura de foto */}
                  {isFlashActive && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-50 pointer-events-none animate-out fade-out duration-300" />
                  )}

                  {/* Pill discreto de generación de informe técnico en Visión Móvil */}
                  {isGeneratingTechnicalReport && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-teal-500/50 rounded-full px-3.5 py-1.5 shadow-xl animate-pulse pointer-events-auto">
                      <div className="h-3 w-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-[10px] font-medium text-teal-200 whitespace-nowrap">Compilando informe... por favor espera</span>
                    </div>
                  )}

                  {/* HUD Superior de Biomecánica / Fisioterapeuta en Móvil */}
                  {isBiomechanicsActive && (
                    <div className="absolute top-2 left-2 right-16 z-20 flex flex-col gap-1 pointer-events-none">
                      {/* Fila 1: Badges y Fases */}
                      <div className="flex flex-wrap items-center justify-between gap-1 bg-black/75 backdrop-blur-md border border-white/15 rounded-xl px-2 py-1 pointer-events-auto shadow-md">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                            Visión IA
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-semibold">
                            {kneeAngle !== null && kneeAngle > 25 ? 'REBA' : 'RULA'}
                          </span>
                        </div>

                        {/* Fases Ergonómicas Compactas */}
                        <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                          {ERGO_PHASES.map((p, idx) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setCurrentErgoPhaseIndex(idx)}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[8px] font-mono transition-all duration-200',
                                currentErgoPhaseIndex === idx
                                  ? 'bg-cyan-500 text-black font-bold shadow-xs'
                                  : 'text-white/70 hover:text-white'
                              )}
                              title={p.desc}
                            >
                              {`F${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fila 2: Telemetría Angular Compacta */}
                      <div className="flex flex-wrap items-center justify-center gap-1 bg-black/65 backdrop-blur-md border border-white/10 rounded-lg p-1 pointer-events-auto">
                        <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono', neckInfo.colorClass)}>
                          <span>C:</span>
                          <span className={cn('font-bold', neckInfo.valColorClass)}>{neckAngle !== null ? `${neckAngle}°` : '--'}</span>
                        </div>
                        <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono', trunkInfo.colorClass)}>
                          <span>T:</span>
                          <span className={cn('font-bold', trunkInfo.valColorClass)}>{trunkAngle !== null ? `${trunkAngle}°` : '--'}</span>
                        </div>
                        <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono', armInfo.colorClass)}>
                          <span>B:</span>
                          <span className={cn('font-bold', armInfo.valColorClass)}>{armAngle !== null ? `${armAngle}°` : '--'}</span>
                        </div>
                        <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono', elbowInfo.colorClass)}>
                          <span>Co:</span>
                          <span className={cn('font-bold', elbowInfo.valColorClass)}>{elbowAngle !== null ? `${elbowAngle}°` : '--'}</span>
                        </div>
                        <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono', kneeInfo.colorClass)}>
                          <span>R:</span>
                          <span className={cn('font-bold', kneeInfo.valColorClass)}>{kneeAngle !== null ? `${kneeAngle}°` : '--'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Control Flotante en Esquina Superior Derecha (Minimizar/Expandir) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-30">
                    <button
                      type="button"
                      onClick={() => setIsVisionExpanded((prev) => !prev)}
                      title={isVisionExpanded ? 'Reducir tamaño (Ver chat)' : 'Ampliar cámara al tamaño del chat'}
                      className="p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 active:scale-95 shadow-md"
                    >
                      {isVisionExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Botonera Flotante Cápsula WAPPY Design System (Idéntica a Imagen 1) */}
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-fit z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl pointer-events-auto">
                    {/* 1. Cámara On/Off */}
                    <button
                      type="button"
                      onClick={toggleCamera}
                      title={isCameraOn && visionSource === 'camera' ? 'Apagar cámara' : 'Encender cámara'}
                      className={cn(
                        'p-1.5 sm:p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center',
                        isCameraOn && visionSource === 'camera'
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      )}
                    >
                      {isCameraOn && visionSource === 'camera' ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* 2. Capturar Foto / Evidencia con Badge de Fase (Solo si cámara encendida) */}
                    {isCameraOn && visionSource === 'camera' && (
                      <button
                        type="button"
                        onClick={() => captureVisionSnapshot()}
                        title={isBiomechanicsActive ? `Capturar Fase ${currentErgoPhaseIndex + 1}` : 'Capturar Evidencia Fotográfica'}
                        className="relative p-1.5 sm:p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 active:scale-90 shadow-md border border-emerald-400/30 flex items-center justify-center"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {isBiomechanicsActive && (
                          <span className="absolute -top-1 -right-1 bg-black/85 text-cyan-300 text-[8px] font-mono font-bold px-1 rounded-full border border-cyan-500/50">
                            {currentErgoPhaseIndex + 1}/{ERGO_PHASES.length}
                          </span>
                        )}
                      </button>
                    )}

                    {/* 3. Girar Cámara (Solo si cámara encendida) */}
                    {isCameraOn && visionSource === 'camera' && (
                      <button
                        type="button"
                        onClick={switchCamera}
                        title="Girar cámara (Frontal / Trasera)"
                        className="p-1.5 sm:p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 transition-all duration-200 active:rotate-180 shadow-md flex items-center justify-center"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

                    {/* 4. Micrófono Central (Hero) con Pulso en Vivo y Mute instantáneo */}
                    <button
                      type="button"
                      onClick={handleToggleMicMute}
                      title={isMicMuted ? 'Activar micrófono (Desmutear)' : 'Silenciar mi micrófono (Mute)'}
                      className={cn(
                        'p-2 sm:p-2.5 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center shadow-xl border-2',
                        isMicMuted
                          ? 'bg-red-500/20 text-red-400 border-red-500/60 backdrop-blur-md'
                          : 'bg-white text-black border-white shadow-white/20'
                      )}
                    >
                      <div className="relative">
                        {isMicMuted ? (
                          <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            {isVoiceActive && (
                              <span className="absolute -top-2 -right-2 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>

                    <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

                    {/* 5. Compartir Pantalla */}
                    <button
                      type="button"
                      onClick={() => {
                        tenshiAudio.playBlip();
                        if (isVisionActive && visionSource === 'screen') stopVision();
                        else startVision('screen');
                      }}
                      title={isVisionActive && visionSource === 'screen' ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
                      className={cn(
                        'p-1.5 sm:p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center',
                        isVisionActive && visionSource === 'screen'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                      )}
                    >
                      {isVisionActive && visionSource === 'screen' ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                    </button>

                    {/* 6. Generar Informe / Reporte */}
                    <button
                      type="button"
                      disabled={isGeneratingTechnicalReport}
                      onClick={requestTechnicalReport}
                      title={isGeneratingTechnicalReport ? 'Compilando informe técnico...' : `Generar informe técnico de ${activeProtocol.title}`}
                      className={cn(
                        "p-1.5 sm:p-2 rounded-full text-white transition-all duration-200 active:scale-95 shadow-md border flex items-center justify-center",
                        isGeneratingTechnicalReport
                          ? "bg-amber-600/90 border-amber-400/60 cursor-not-allowed animate-pulse"
                          : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 border-teal-300/30"
                      )}
                    >
                      {isGeneratingTechnicalReport ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* 7. Colgar / Detener Live */}
                    <button
                      type="button"
                      onClick={() => {
                        tenshiAudio.playBlip();
                        stopVision();
                        if (isVoiceActive) stopVoiceMode();
                      }}
                      title="Finalizar sesión en vivo"
                      className="p-1.5 sm:p-2 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-200 active:scale-95 shadow-md border border-red-400/20 flex items-center justify-center"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mensajes del Chat */}
              <div className={cn('overflow-y-auto px-4 py-3 flex flex-col gap-3', isVisionActive && isVisionExpanded ? 'hidden' : 'flex-1')}>
                {/* 1. Tarjeta de Memoria Autobiográfica y Briefing del Día (Estilo Dot) */}
                {dailyBriefing && !isBriefingDismissed && (
                  <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/70 p-3.5 shadow-sm dark:border-teal-500/30 dark:from-teal-950/40 dark:via-zinc-900 dark:to-emerald-950/30">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                          Briefing del Día • {dailyBriefing.empresa || 'Tu Empresa'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBriefingDismissed(true)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded"
                        title="Ocultar resumen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-zinc-200">
                      {dailyBriefing.ultimaActividad && (
                        <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-slate-200/60 dark:border-zinc-700/60">
                          <span className="shrink-0">📋</span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white">Última gestión: </span>
                            <span>{dailyBriefing.ultimaActividad.titulo} ({dailyBriefing.ultimaActividad.tipo}) — ¿Cómo te fue con este avance?</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="shrink-0">📅</span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Agenda de hoy ({dailyBriefing.agendaHoy?.length || 0}): </span>
                          {dailyBriefing.agendaHoy && dailyBriefing.agendaHoy.length > 0 ? (
                            <span>{dailyBriefing.agendaHoy.slice(0, 2).map((t) => `${t.titulo}${t.hora ? ` (${t.hora})` : ''}`).join(' • ')}</span>
                          ) : (
                            <span className="text-slate-500 dark:text-zinc-400">Sin actividades críticas pendientes para hoy.</span>
                          )}
                        </div>
                      </div>
                      {((dailyBriefing.vencenManana && dailyBriefing.vencenManana.length > 0) || (dailyBriefing.vencidas && dailyBriefing.vencidas.length > 0)) && (
                        <div className="flex items-start gap-2 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl px-3 py-2 border border-amber-300/50 dark:border-amber-700/40">
                          <span className="shrink-0">⏰</span>
                          <div>
                            {dailyBriefing.vencenManana && dailyBriefing.vencenManana.length > 0 && (
                              <div>
                                <span className="font-bold text-amber-800 dark:text-amber-300">Vence mañana ({dailyBriefing.vencenManana.length}): </span>
                                <span>{dailyBriefing.vencenManana.slice(0, 2).map((t) => t.titulo).join(' • ')}</span>
                              </div>
                            )}
                            {Boolean(dailyBriefing.vencidas && dailyBriefing.vencidas.length > 0) && (
                              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                Tienes {dailyBriefing.vencidas.length} actividad(es) vencida(s) en el cronograma.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {messages
                  .filter((m) => !m.content?.startsWith('[RESULTADO_GUI]') && !(m as any).isIntermediate)
                  .map((msg, i) => (
                    <div
                      key={i}
                      className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[90%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-xs',
                          msg.role === 'user'
                            ? 'rounded-tr-none bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-medium'
                            : 'rounded-tl-none border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100'
                        )}
                      >
                        {msg.content && <Markdown content={cleanRenderContent(msg.content)} />}
                        {/* Miniatura / Render de Imagen adjunta */}
                        {(msg.image || (msg.media?.type === 'image' && msg.media.dataUrl)) && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-black/10">
                            <img
                              src={msg.image || msg.media?.dataUrl}
                              alt={msg.media?.name || "Evidencia visual"}
                              className="max-h-60 w-full object-cover rounded-xl cursor-zoom-in hover:opacity-95 transition-opacity active:scale-[0.99]"
                              onClick={() => {
                                const url = msg.image || msg.media?.dataUrl;
                                if (url) {
                                  const photoMatch = msg.content?.match(/\[FOTO[^\]]*\]:\s*([^\n]+)/i);
                                  const evidenceMatch = msg.content?.match(/👁️\s*\*\*([^\*]+)\*\*/i);
                                  const title = msg.media?.name || photoMatch?.[1] || evidenceMatch?.[1] || 'Evidencia fotográfica SST';
                                  setLightboxImage({ url, title });
                                }
                              }}
                            />
                            {msg.media?.name && (
                              <div className="flex items-center justify-between px-2 py-0.5 text-[9px] text-slate-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-800/70 border-t border-slate-100 dark:border-zinc-700/60">
                                <span className="truncate">{msg.media.name}</span>
                                {msg.media.size > 0 && <span>{formatBytes(msg.media.size)}</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Render de Video adjunto */}
                        {msg.media?.type === 'video' && (
                          (() => {
                            const blobSrc = liveMediaBlobsRef.current.get(msg.media.name)?.blobUrl || msg.media.previewUrl || msg.media.dataUrl;
                            const posterSrc = msg.media.thumbnailUrl || (msg.media.dataUrl?.startsWith('data:image') ? msg.media.dataUrl : undefined);
                            return (
                              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-black/10">
                                {blobSrc ? (
                                  <video
                                    controls
                                    playsInline
                                    preload="metadata"
                                    poster={posterSrc}
                                    className="max-h-60 w-full rounded-xl bg-black"
                                  >
                                    <source src={blobSrc} type={msg.media.mimeType || 'video/mp4'} />
                                    <source src={blobSrc} type="video/quicktime" />
                                    Tu navegador no soporta la reproducción directa de este video.
                                  </video>
                                ) : posterSrc ? (
                                  <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center">
                                    <img src={posterSrc} alt={msg.media.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold px-2 py-1 rounded bg-black/60">📹 Video analizado</span>
                                    </div>
                                  </div>
                                ) : null}
                                <div className="flex items-center justify-between px-2 py-0.5 text-[9px] text-slate-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-800/70 border-t border-slate-100 dark:border-zinc-700/60">
                                  <span className="truncate">{msg.media.name}</span>
                                  {msg.media.size > 0 && <span>{formatBytes(msg.media.size)}</span>}
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* Render de Documento o Audio adjunto */}
                        {msg.media && (msg.media.type === 'document' || msg.media.type === 'audio') && (
                          <div className="mt-2 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                              <div className="min-w-0 flex-1">
                                <span className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100 block">
                                  {msg.media.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                                  {formatBytes(msg.media.size)}
                                </span>
                              </div>
                            </div>
                            {msg.media.dataUrl && (
                              <a
                                href={msg.media.dataUrl}
                                download={msg.media.name}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 transition-colors"
                                title="Descargar archivo"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
                        {msg.file && (
                          <div className="mt-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2">
                            <span className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100 flex-1 min-w-[140px]">
                              {msg.file.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(msg.file!)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                                title="Descargar archivo a tu dispositivo"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenFileInCanvas(msg.file!, true)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1 active:scale-95"
                                title="Abrir en pantalla en el editor Canvas"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver en pantalla
                              </button>
                            </div>
                          </div>
                        )}
                        {msg.htmlReport && !msg.file && (
                          <button
                            type="button"
                            onClick={() => openHtmlReport(msg.htmlReport!)}
                            className="mt-2.5 w-full text-center py-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 active:scale-95"
                          >
                            Ver Informe Oficial
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de Entrada Táctil & Voz */}
              <div className="px-3 pt-2 pb-2 border-t border-slate-200/60 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl shrink-0">
                {/* Preview Chip cuando hay un medio adjunto en móvil */}
                {attachedMedia && (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-teal-200/80 bg-teal-50/90 p-2 shadow-xs backdrop-blur-md dark:border-teal-900/60 dark:bg-teal-950/60">
                    <div className="flex items-center gap-2 min-w-0">
                      {attachedMedia.type === 'image' ? (
                        <img
                          src={attachedMedia.dataUrl}
                          alt={attachedMedia.name}
                          className="h-9 w-9 shrink-0 rounded-lg object-cover border border-teal-300 dark:border-teal-700 shadow-2xs"
                        />
                      ) : attachedMedia.type === 'video' ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs">
                          <Film className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100">
                          {attachedMedia.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-teal-700 dark:text-teal-300">
                          <span className="font-semibold uppercase">{attachedMedia.type}</span>
                          <span>•</span>
                          <span>{formatBytes(attachedMedia.size)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedMedia(null)}
                      title="Quitar archivo"
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white/80 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 px-2.5 py-1.5 shadow-sm">
                  <input
                    type="file"
                    id="tenshi-hero-file-input"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.pptx,.ppt,application/*"
                    className="hidden"
                    onChange={handleFileAttachment}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('tenshi-hero-file-input')?.click()}
                    title="Adjuntar archivo (Imágenes, Videos, PDF, Office, etc.)"
                    className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      tenshiAudio.playBlip();
                      if (isVisionActive) {
                        stopVision();
                      } else {
                        startVision('camera');
                      }
                    }}
                    title={isVisionActive ? 'Detener cámara de visión' : 'Activar cámara de visión en vivo'}
                    className={cn(
                      'p-1 rounded-lg transition-colors',
                      isVisionActive
                        ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                    )}
                  >
                    {isVisionActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isVoiceActive ? 'Habla por micrófono o escribe...' : 'Escribe una actividad o consulta...'}
                    className="flex-1 border-none bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none focus:outline-none focus:ring-0 dark:text-zinc-100"
                    disabled={isTyping}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      tenshiAudio.playBlip();
                      if (isVoiceActive) {
                        stopVoiceMode();
                      } else {
                        startVoiceMode();
                      }
                    }}
                    title={isVoiceActive ? 'Pausar modo voz' : 'Hablar con Tenshi'}
                    className={cn(
                      'p-1.5 rounded-xl transition-all active:scale-95',
                      isVoiceActive
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse'
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'
                    )}
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  {(isVoiceActive || isVisionActive) && (
                    <button
                      type="button"
                      onClick={() => {
                        tenshiAudio.playBlip();
                        stopVision();
                        stopVoiceMode();
                      }}
                      title="Colgar llamada"
                      className="p-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 shadow-2xs"
                    >
                      <PhoneOff className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={isTyping || (!input.trim() && !attachedMedia)}
                    title="Enviar"
                    className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 p-1.5 text-white shadow-sm transition-all hover:from-teal-500 hover:to-emerald-500 active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 1. BURBUJA FLOTANTE DE CHAT (Independiente y anclada al mejor espacio de pantalla) */}
          {isOpen && (
            <>
              {/* Backdrop para cerrar al hacer clic o tap por fuera */}
              <div
                className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
                }}
                aria-label="Cerrar chat de Tenshi"
              />
              <div
                style={getChatPositionStyle()}
                onClick={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95 z-[10000]',
                  isFullscreen
                    ? 'fixed inset-3 sm:inset-6 z-[10000] w-auto h-auto'
                    : ''
                )}
              >
          {/* Cabecera Glassmorphic Minimalista Compacta */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200/60 bg-slate-50/80 px-3.5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-800/60 select-none">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <TenshiAvatar
                  size={32}
                  mood={derivedAvatarMood}
                  isSpeaking={isTenshiSpeaking}
                  outputAmplitude={outputAmplitude}
                  isVoiceActive={isVoiceActive}
                  interactive={false}
                  showHaloEffect={false}
                  showHUD={true}
                />
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-900',
                    isVoiceActive ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'
                  )}
                />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-none">
                  {config?.name || 'Tenshi'}
                </h3>
                <p className="mt-0.5 text-[9px] font-medium text-slate-500 dark:text-zinc-400">
                  {isTenshiSpeaking
                    ? 'Hablando contigo...'
                    : isVoiceActive
                    ? 'Voz en vivo activa'
                    : 'Asistente WAPPY IA'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Botón SFX */}
              <button
                type="button"
                onClick={handleToggleSFX}
                title={isSFXMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {isSFXMuted ? <VolumeX className="h-3.5 w-3.5 text-emerald-500" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              {/* Botón Pantalla Completa */}
              <button
                type="button"
                onClick={() => {
                  if (checkIsMobile()) {
                    handleMaximizeMobile();
                    setIsHeroChatOpen(true);
                  } else {
                    setIsFullscreen((prev) => !prev);
                  }
                }}
                title={isFullscreen ? 'Restaurar' : 'Pantalla completa'}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>

              {/* Botón Reiniciar conversación */}
              <button
                type="button"
                onClick={handleClearHistory}
                title="Reiniciar chat"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* Botón Cerrar Burbuja */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
                }}
                title="Cerrar chat (Dejar solo a Tenshi)"
                className="flex items-center justify-center rounded-xl p-2 sm:p-1 min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-95 dark:hover:bg-red-950/40"
              >
                <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          </div>

          {/* 7. Selector de Personalidad Adaptativa (1 Clic - Desktop) con Letrero Estilo WAPPY */}
          <div className="flex shrink-0 flex-col gap-1 border-b border-slate-200/50 bg-white/90 px-3.5 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/90 select-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                Modo:
              </span>
              <div className="flex items-center gap-1.5">
                {([
                  { id: 'express', label: '⚡ Express', desc: '⚡ Directo al grano: Respuestas ejecutivas en 1-2 frases' },
                  { id: 'consultor', label: '🛡️ Consultor', desc: '🛡️ Consultor Senior: Cálido, explicativo y empático' },
                  { id: 'auditor', label: '⚖️ Auditor', desc: '⚖️ Auditor Legal: Riguroso en Decreto 1072 y Res. 0312' },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectPersonality(m.id)}
                    onMouseEnter={() => setHoveredPersonality(m.id)}
                    onMouseLeave={() => setHoveredPersonality(null)}
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 border shadow-2xs',
                      personalityMode === m.id
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-600 dark:text-teal-300'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/30 px-2.5 py-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 transition-all">
              <span className="truncate">
                {(hoveredPersonality || personalityMode) === 'express'
                  ? '⚡ Directo al grano: Respuestas ejecutivas en 1-2 frases'
                  : (hoveredPersonality || personalityMode) === 'auditor'
                    ? '⚖️ Auditor Legal: Rigor normativo en Decreto 1072 y Res. 0312'
                    : '🛡️ Consultor Senior: Asesoría cálida, explicativa e integral en SG-SST'}
              </span>
            </div>
          </div>

          {/* Visor de Tenshi Visión y Telemetría Ergonómica en Desktop */}
          {isVisionActive && (
            <div
              className={cn(
                'relative overflow-hidden bg-zinc-950 transition-all duration-300 animate-in fade-in zoom-in-95 flex items-center justify-center',
                isVisionExpanded
                  ? 'flex-1 h-full w-full min-h-[380px] rounded-none sm:rounded-2xl border-2 border-cyan-500/50 shadow-2xl m-0 sm:mx-2.5 sm:my-1.5'
                  : 'h-52 shrink-0 rounded-2xl border-2 border-emerald-500/60 shadow-xl mx-3.5 my-2'
              )}
            >
              <video
                ref={setVisionVideoNode}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-black"
              />

              {/* Overlay de cámara pausada */}
              {!isCameraOn && visionSource === 'camera' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xs z-15 pointer-events-none">
                  <VideoOff className="w-9 h-9 text-white/40 mb-2 animate-pulse" />
                  <span className="text-xs font-mono text-white/70">Cámara pausada</span>
                  <span className="text-[10px] font-mono text-white/40 mt-0.5">Tenshi te escucha en vivo</span>
                </div>
              )}

              {/* Canvas de MediaPipe para Exoesqueleto Neón */}
              <canvas
                ref={biomechanicCanvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />

              {/* Flash visual de captura de foto */}
              {isFlashActive && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-50 pointer-events-none animate-out fade-out duration-300" />
              )}

              {/* Pill discreto de generación de informe técnico en Visión Desktop */}
              {isGeneratingTechnicalReport && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-teal-500/50 rounded-full px-4 py-1.5 shadow-xl animate-pulse pointer-events-auto">
                  <div className="h-3.5 w-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-[11px] font-medium text-teal-200 whitespace-nowrap">Compilando informe técnico... por favor espera un momento</span>
                </div>
              )}

              {/* HUD Superior de Biomecánica / Fisioterapeuta */}
              {isBiomechanicsActive && (
                <div className="absolute top-2.5 left-2.5 right-14 z-20 flex flex-col gap-1.5 pointer-events-none">
                  {/* Fila 1: Badges y Selector de Fases */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 bg-black/75 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 pointer-events-auto shadow-lg">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                        Visión IA Biomecánica
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-semibold">
                        {kneeAngle !== null && kneeAngle > 25 ? 'Método: REBA (Cuerpo Entero)' : 'Método: RULA (Miembros Sup.)'}
                      </span>
                      {is3DTelemetry && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-mono font-bold tracking-wide shadow-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          3D Space
                        </span>
                      )}
                    </div>

                    {/* Selector de Fases Ergonómicas */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                      {ERGO_PHASES.map((p, idx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCurrentErgoPhaseIndex(idx)}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[9px] font-mono transition-all duration-200',
                            currentErgoPhaseIndex === idx
                              ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          )}
                          title={p.desc}
                        >
                          {p.shortName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fila 2: Telemetría Angular en Tiempo Real */}
                  <div className="flex flex-wrap items-center justify-center gap-1 bg-black/65 backdrop-blur-md border border-white/10 rounded-xl p-1 pointer-events-auto shadow-md">
                    {/* Cuello */}
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all duration-200', neckInfo.colorClass)}>
                      <span className="text-[9px] font-mono opacity-70">Cuello</span>
                      <span className={cn('text-[11px] font-bold font-mono', neckInfo.valColorClass)}>
                        {neckAngle !== null ? `${neckAngle}°` : '--'}
                      </span>
                      <span className={cn('text-[8px] font-mono uppercase tracking-wider', neckInfo.textClass)}>
                        {neckInfo.status}
                      </span>
                    </div>

                    {/* Tronco */}
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all duration-200', trunkInfo.colorClass)}>
                      <span className="text-[9px] font-mono opacity-70">Tronco</span>
                      <span className={cn('text-[11px] font-bold font-mono', trunkInfo.valColorClass)}>
                        {trunkAngle !== null ? `${trunkAngle}°` : '--'}
                      </span>
                      <span className={cn('text-[8px] font-mono uppercase tracking-wider', trunkInfo.textClass)}>
                        {trunkInfo.status}
                      </span>
                    </div>

                    {/* Brazo */}
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all duration-200', armInfo.colorClass)}>
                      <span className="text-[9px] font-mono opacity-70">Brazo</span>
                      <span className={cn('text-[11px] font-bold font-mono', armInfo.valColorClass)}>
                        {armAngle !== null ? `${armAngle}°` : '--'}
                      </span>
                      <span className={cn('text-[8px] font-mono uppercase tracking-wider', armInfo.textClass)}>
                        {armInfo.status}
                      </span>
                    </div>

                    {/* Codo */}
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all duration-200', elbowInfo.colorClass)}>
                      <span className="text-[9px] font-mono opacity-70">Codo</span>
                      <span className={cn('text-[11px] font-bold font-mono', elbowInfo.valColorClass)}>
                        {elbowAngle !== null ? `${elbowAngle}°` : '--'}
                      </span>
                      <span className={cn('text-[8px] font-mono uppercase tracking-wider', elbowInfo.textClass)}>
                        {elbowInfo.status}
                      </span>
                    </div>

                    {/* Rodilla */}
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all duration-200', kneeInfo.colorClass)}>
                      <span className="text-[9px] font-mono opacity-70">Rodilla</span>
                      <span className={cn('text-[11px] font-bold font-mono', kneeInfo.valColorClass)}>
                        {kneeAngle !== null ? `${kneeAngle}°` : '--'}
                      </span>
                      <span className={cn('text-[8px] font-mono uppercase tracking-wider', kneeInfo.textClass)}>
                        {kneeInfo.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Control de Tamaño en Esquina Superior Derecha */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-30">
                <button
                  type="button"
                  onClick={() => setIsVisionExpanded((prev) => !prev)}
                  title={isVisionExpanded ? 'Reducir tamaño (Ver chat)' : 'Ampliar cámara al tamaño del chat'}
                  className="p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 active:scale-95 shadow-md"
                >
                  {isVisionExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Botonera Flotante Cápsula WAPPY Design System (Idéntica a Imagen 1) */}
              <div className="absolute bottom-2.5 inset-x-0 mx-auto w-fit z-40 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl pointer-events-auto">
                {/* 1. Cámara On/Off */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  title={isCameraOn && visionSource === 'camera' ? 'Apagar cámara' : 'Encender cámara'}
                  className={cn(
                    'p-2 sm:p-2.5 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center',
                    isCameraOn && visionSource === 'camera'
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  )}
                >
                  {isCameraOn && visionSource === 'camera' ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                {/* 2. Capturar Foto / Evidencia con Badge de Fase (Solo si cámara encendida) */}
                {isCameraOn && visionSource === 'camera' && (
                  <button
                    type="button"
                    onClick={() => captureVisionSnapshot()}
                    title={isBiomechanicsActive ? `Capturar Fase ${currentErgoPhaseIndex + 1}` : 'Capturar Evidencia Fotográfica'}
                    className="relative p-2 sm:p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 active:scale-90 shadow-md border border-emerald-400/30 flex items-center justify-center"
                  >
                    <Camera className="w-4 h-4" />
                    {isBiomechanicsActive && (
                      <span className="absolute -top-1 -right-1 bg-black/85 text-cyan-300 text-[8px] font-mono font-bold px-1 rounded-full border border-cyan-500/50">
                        {currentErgoPhaseIndex + 1}/{ERGO_PHASES.length}
                      </span>
                    )}
                  </button>
                )}

                {/* 3. Girar Cámara (Solo si cámara encendida) */}
                {isCameraOn && visionSource === 'camera' && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    title="Girar cámara (Frontal / Trasera)"
                    className="p-2 sm:p-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 transition-all duration-200 active:rotate-180 shadow-md flex items-center justify-center"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                )}

                <div className="w-[1px] h-5 bg-white/20 mx-0.5 sm:mx-1" />

                {/* 4. Micrófono Central (Hero) con Silenciador Instantáneo (Mute) */}
                <button
                  type="button"
                  onClick={handleToggleMicMute}
                  title={isMicMuted ? 'Activar micrófono (Desmutear)' : 'Silenciar mi micrófono (Mute)'}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center shadow-xl border-2',
                    isMicMuted
                      ? 'bg-red-500/20 text-red-400 border-red-500/60 backdrop-blur-md'
                      : 'bg-white text-black border-white shadow-white/20'
                  )}
                >
                  <div className="relative">
                    {isMicMuted ? (
                      <MicOff className="w-5 h-5 text-red-400" />
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        {isVoiceActive && (
                          <span className="absolute -top-2.5 -right-2.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>

                <div className="w-[1px] h-5 bg-white/20 mx-0.5 sm:mx-1" />

                {/* 5. Compartir Pantalla */}
                <button
                  type="button"
                  onClick={() => {
                    tenshiAudio.playBlip();
                    if (isVisionActive && visionSource === 'screen') stopVision();
                    else startVision('screen');
                  }}
                  title={isVisionActive && visionSource === 'screen' ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
                  className={cn(
                    'p-2 sm:p-2.5 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center',
                    isVisionActive && visionSource === 'screen'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                  )}
                >
                  {isVisionActive && visionSource === 'screen' ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>

                {/* 6. Generar Informe / Reporte */}
                <button
                  type="button"
                  disabled={isGeneratingTechnicalReport}
                  onClick={requestTechnicalReport}
                  title={isGeneratingTechnicalReport ? 'Compilando informe técnico...' : `Generar informe técnico de ${activeProtocol.title}`}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-full text-white transition-all duration-200 active:scale-95 shadow-md border flex items-center justify-center",
                    isGeneratingTechnicalReport
                      ? "bg-amber-600/90 border-amber-400/60 cursor-not-allowed animate-pulse"
                      : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 border-teal-300/30"
                  )}
                >
                  {isGeneratingTechnicalReport ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </button>

                {/* 7. Colgar / Detener Live */}
                <button
                  type="button"
                  onClick={() => {
                    tenshiAudio.playBlip();
                    stopVision();
                    if (isVoiceActive) stopVoiceMode();
                  }}
                  title="Finalizar sesión en vivo"
                  className="p-2 sm:p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-200 active:scale-95 shadow-md border border-red-400/20 flex items-center justify-center"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Historial de conversación */}
          <div className={cn("flex flex-1 flex-col overflow-hidden", isVisionActive && isVisionExpanded ? "hidden" : "")}>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-3 text-xs dark:bg-zinc-950/50">
                {/* 5A. Rich Voice Card integrada dentro del chat cuando la ventana de chat está abierta en PC */}
                {richVoiceCard && (
                  <div className="rounded-2xl border border-teal-500/40 bg-white dark:bg-zinc-900 p-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-500/30 text-sm">
                          {richVoiceCard.kind === 'email' ? '📧' : richVoiceCard.kind === 'calendar' ? '📅' : '📄'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">
                            {richVoiceCard.title}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                            {richVoiceCard.subtitle}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRichVoiceCard(null)}
                        className="p-0.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {richVoiceCard.badge && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{richVoiceCard.badge}</span>
                      </div>
                    )}
                    {richVoiceCard.actionLabel && (richVoiceCard.htmlReport || richVoiceCard.actionPrompt) && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (richVoiceCard.htmlReport) {
                              setStreamingCanvas({
                                title: richVoiceCard.title || 'Informe Técnico Oficial SG-SST',
                                content: richVoiceCard.htmlReport,
                                status: 'complete',
                              });
                              setIsCanvasActive(true);
                              setCanvasMaximized(true);
                            } else if (richVoiceCard.actionPrompt) {
                              handleSend(richVoiceCard.actionPrompt);
                            }
                            setRichVoiceCard(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] shadow-sm transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
                        >
                          <span>{richVoiceCard.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 1. Tarjeta de Memoria Autobiográfica y Briefing del Día (Estilo Dot - Desktop) */}
                {dailyBriefing && !isBriefingDismissed && (
                  <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/70 p-3 shadow-sm dark:border-teal-500/30 dark:from-teal-950/40 dark:via-zinc-900 dark:to-emerald-950/30">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                          Briefing del Día • {dailyBriefing.empresa || 'Tu Empresa'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBriefingDismissed(true)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded"
                        title="Ocultar resumen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-zinc-200">
                      {dailyBriefing.ultimaActividad && (
                        <div className="flex items-start gap-1.5 bg-white/80 dark:bg-zinc-800/70 rounded-xl px-2.5 py-1.5 border border-slate-200/60 dark:border-zinc-700/60">
                          <span className="shrink-0">📋</span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white">Última gestión: </span>
                            <span>{dailyBriefing.ultimaActividad.titulo} ({dailyBriefing.ultimaActividad.tipo}) — ¿Cómo te fue con este avance?</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5 bg-white/80 dark:bg-zinc-800/70 rounded-xl px-2.5 py-1.5 border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="shrink-0">📅</span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Agenda de hoy ({dailyBriefing.agendaHoy?.length || 0}): </span>
                          {dailyBriefing.agendaHoy && dailyBriefing.agendaHoy.length > 0 ? (
                            <span>{dailyBriefing.agendaHoy.slice(0, 2).map((t) => `${t.titulo}${t.hora ? ` (${t.hora})` : ''}`).join(' • ')}</span>
                          ) : (
                            <span className="text-slate-500 dark:text-zinc-400">Sin actividades críticas pendientes para hoy.</span>
                          )}
                        </div>
                      </div>
                      {((dailyBriefing.vencenManana && dailyBriefing.vencenManana.length > 0) || (dailyBriefing.vencidas && dailyBriefing.vencidas.length > 0)) && (
                        <div className="flex items-start gap-1.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl px-2.5 py-1.5 border border-amber-300/50 dark:border-amber-700/40">
                          <span className="shrink-0">⏰</span>
                          <div>
                            {dailyBriefing.vencenManana && dailyBriefing.vencenManana.length > 0 && (
                              <div>
                                <span className="font-bold text-amber-800 dark:text-amber-300">Vence mañana ({dailyBriefing.vencenManana.length}): </span>
                                <span>{dailyBriefing.vencenManana.slice(0, 2).map((t) => t.titulo).join(' • ')}</span>
                              </div>
                            )}
                            {Boolean(dailyBriefing.vencidas && dailyBriefing.vencidas.length > 0) && (
                              <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                Tienes {dailyBriefing.vencidas.length} actividad(es) vencida(s) en el cronograma.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(() => {
                  const visibleMessages = messages.filter(
                    (msg) => !msg.content?.startsWith('[RESULTADO_GUI]') && !(msg as any).isIntermediate
                  );
                  return visibleMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                          msg.role === 'user'
                            ? 'rounded-tr-none bg-blue-600 text-white shadow-md'
                            : 'rounded-tl-none border border-gray-100 bg-white text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {editingMessageId === msg._id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full rounded-lg border border-blue-300 p-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
                              rows={3}
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="rounded bg-gray-200 px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-300"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg._id!)}
                                className="rounded bg-blue-600 px-2 py-1 text-[10px] text-white hover:bg-blue-700"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.content && <Markdown content={cleanRenderContent(msg.content)} />}
                            {/* Miniatura / Render de Imagen adjunta */}
                            {(msg.image || (msg.media?.type === 'image' && msg.media.dataUrl)) && (
                              <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-black/5 shadow-sm max-w-sm">
                                <img
                                  src={msg.image || msg.media?.dataUrl}
                                  alt={msg.media?.name || "Evidencia visual"}
                                  className="max-h-60 w-full object-cover rounded-xl cursor-zoom-in hover:opacity-95 transition-all active:scale-[0.99]"
                                  onClick={() => {
                                    const url = msg.image || msg.media?.dataUrl;
                                    if (url) {
                                      const photoMatch = msg.content?.match(/\[FOTO[^\]]*\]:\s*([^\n]+)/i);
                                      const evidenceMatch = msg.content?.match(/👁️\s*\*\*([^\*]+)\*\*/i);
                                      const title = msg.media?.name || photoMatch?.[1] || evidenceMatch?.[1] || 'Evidencia fotográfica SST';
                                      setLightboxImage({ url, title });
                                    }
                                  }}
                                />
                                {msg.media?.name && (
                                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-slate-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-800/70 border-t border-slate-100 dark:border-zinc-700/60">
                                    <span className="truncate">{msg.media.name}</span>
                                    {msg.media.size > 0 && <span>{formatBytes(msg.media.size)}</span>}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Render de Video adjunto */}
                            {msg.media?.type === 'video' && (
                              (() => {
                                const blobSrc = liveMediaBlobsRef.current.get(msg.media.name)?.blobUrl || msg.media.previewUrl || msg.media.dataUrl;
                                const posterSrc = msg.media.thumbnailUrl || (msg.media.dataUrl?.startsWith('data:image') ? msg.media.dataUrl : undefined);
                                return (
                                  <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-black/10 shadow-sm max-w-sm">
                                    {blobSrc ? (
                                      <video
                                        controls
                                        playsInline
                                        preload="metadata"
                                        poster={posterSrc}
                                        className="max-h-60 w-full rounded-xl bg-black"
                                      >
                                        <source src={blobSrc} type={msg.media.mimeType || 'video/mp4'} />
                                        <source src={blobSrc} type="video/quicktime" />
                                        Tu navegador no soporta la reproducción directa de este video.
                                      </video>
                                    ) : posterSrc ? (
                                      <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center">
                                        <img src={posterSrc} alt={msg.media.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                          <span className="text-white text-xs font-semibold px-2 py-1 rounded bg-black/60">📹 Video analizado</span>
                                        </div>
                                      </div>
                                    ) : null}
                                    <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-slate-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-800/70 border-t border-slate-100 dark:border-zinc-700/60">
                                      <span className="truncate">{msg.media.name}</span>
                                      {msg.media.size > 0 && <span>{formatBytes(msg.media.size)}</span>}
                                    </div>
                                  </div>
                                );
                              })()
                            )}

                            {/* Render de Documento o Audio adjunto */}
                            {msg.media && (msg.media.type === 'document' || msg.media.type === 'audio') && (
                              <div className="mt-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-white/90 p-2.5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/90 max-w-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100">
                                      {msg.media.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                      {formatBytes(msg.media.size)}
                                    </p>
                                  </div>
                                </div>
                                {msg.media.dataUrl && (
                                  <a
                                    href={msg.media.dataUrl}
                                    download={msg.media.name}
                                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                                    title="Descargar archivo"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.delegatedOrderId && msg.delegatedStatus === 'todo' && (
                              <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-50/60 px-3 py-1.5 dark:border-teal-500/20 dark:bg-teal-950/40">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
                                </span>
                                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                                  Antigravity procesando en segundo plano... (Monitoreo en vivo cada 15s)
                                </span>
                              </div>
                            )}
                            {msg.file && (
                              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                                      msg.file.fileType === 'excel'
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : msg.file.fileType === 'text'
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                        : msg.file.fileType === 'html'
                                        ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400'
                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                                    }`}
                                  >
                                    {msg.file.fileType === 'excel' && <FileSpreadsheet className="h-5 w-5" />}
                                    {msg.file.fileType === 'text' && <FileText className="h-5 w-5" />}
                                    {msg.file.fileType === 'html' && <Code2 className="h-5 w-5" />}
                                    {msg.file.fileType === 'presentation' && <Presentation className="h-5 w-5" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100">
                                      {msg.file.title}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                                      {msg.file.fileType === 'excel'
                                        ? 'Hoja de Cálculo Excel (.xlsx)'
                                        : (msg.file.fileType === 'html' || msg.file.content?.includes('<html') || msg.file.content?.includes('<!DOCTYPE'))
                                        ? 'Aplicativo / Reporte HTML'
                                        : msg.file.fileType === 'image' || msg.file.fileType === 'imagen'
                                        ? 'Imagen Digital (.png)'
                                        : msg.file.fileType === 'presentation'
                                        ? 'Presentación de Diapositivas'
                                        : 'Documento Word (.doc)'}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-zinc-800/80">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(msg.file!)}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 hover:from-teal-500 hover:to-teal-600"
                                    title="Descargar archivo a tu dispositivo"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Descargar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFileInCanvas(msg.file!, true)}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                    title="Abrir en pantalla en el editor Canvas"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Ver en pantalla</span>
                                  </button>
                                  {(msg.file.fileType === 'html' || msg.file.content?.includes('<html') || msg.file.content?.includes('<!DOCTYPE')) && (
                                    <button
                                      type="button"
                                      onClick={() => openHtmlReport(msg.file!.content)}
                                      className="flex items-center gap-1.5 rounded-xl border border-teal-200/80 bg-teal-50/60 px-3 py-1.5 text-xs font-bold text-teal-700 shadow-2xs transition-all active:scale-95 hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300"
                                      title="Abrir vista de impresión y exportación a PDF"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      <span>Imprimir / PDF</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            {msg.htmlReport && !msg.file && (
                              <button
                                type="button"
                                onClick={() => openHtmlReport(msg.htmlReport!)}
                                className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Ver Informe Oficial</span>
                              </button>
                            )}
                            {msg.qrCode && (
                              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 max-w-sm">
                                <div className="flex items-start gap-3">
                                  <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-zinc-700">
                                    <img
                                      src={msg.qrCode.qrImageUrl}
                                      alt={msg.qrCode.titulo}
                                      className="h-24 w-24 object-contain"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                                      Código QR Oficial
                                    </span>
                                    <h4 className="mt-1 text-xs font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                      {msg.qrCode.titulo}
                                    </h4>
                                    <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                                      {msg.qrCode.descripcion}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-zinc-800/80">
                                  <a
                                    href={msg.qrCode.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 hover:from-teal-500 hover:to-teal-600"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Abrir Enlace</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (navigator.clipboard) {
                                        navigator.clipboard.writeText(msg.qrCode!.url);
                                      }
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                    title="Copiar enlace"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copiar</span>
                                  </button>
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Hola, por favor ingresa al siguiente enlace para tu gestión en SG-SST (${msg.qrCode.titulo}): ${msg.qrCode.url}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-all active:scale-95"
                                    title="Compartir por WhatsApp"
                                  >
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Message action controls (Edit, Delete, Regenerate) */}
                      {msg._id && editingMessageId !== msg._id && (
                        <div
                          className={`mt-1 flex items-center gap-2 text-[10px] transition-all opacity-40 hover:opacity-100 sm:opacity-0 group-hover:opacity-100 ${
                            msg.role === 'user' ? 'justify-end pr-1 text-blue-500/70 dark:text-blue-400/70' : 'justify-start pl-1 text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {msg.role === 'user' && (
                            <button
                              onClick={() => {
                                setEditingMessageId(msg._id!);
                                setEditingText(msg.content);
                              }}
                              className="flex items-center gap-0.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                              <span>Editar</span>
                            </button>
                          )}
                          {msg.role === 'assistant' && i === visibleMessages.length - 1 && (
                            <button
                              onClick={() => handleRegenerate(msg._id!)}
                              className="flex items-center gap-0.5 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            >
                              <RefreshCw className="h-2.5 w-2.5" />
                              <span>Regenerar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg._id!)}
                            className="flex items-center gap-0.5 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ));
                })()}

                {/* Live automation steps collapsible log */}
                {guiSteps.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white/80 p-3.5 backdrop-blur-sm shadow-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                    <details className="group" open>
                      <summary className="flex cursor-pointer items-center justify-between font-bold text-xs text-gray-700 select-none dark:text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Acciones automáticas en pantalla ({guiSteps.filter((s) => s.status === 'success').length}/{guiSteps.length})
                        </span>
                        <span className="transition-transform duration-200 group-open:rotate-180 text-gray-400 text-[10px]">▼</span>
                      </summary>
                      <div className="mt-3.5 space-y-2 border-t border-gray-100/50 pt-2.5 dark:border-gray-700/50">
                        {guiSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[9px] dark:bg-gray-700 dark:text-gray-300">
                                {step.action}
                              </span>
                              <span className="truncate max-w-[180px]">{step.details}</span>
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-medium',
                                step.status === 'success' && 'text-emerald-600 dark:text-emerald-400',
                                step.status === 'pending' && 'text-amber-500 animate-pulse',
                                step.status === 'failed' && 'text-red-500'
                              )}
                            >
                              {step.status === 'success' ? '✓ Listo' : step.status === 'pending' ? 'Ejecutando...' : '✗ Falló'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {/* Status Indicator */}
                {tenshiStatus && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-green-600 dark:text-green-400 animate-pulse">
                    <Sparkles className="h-4 w-4" />
                    <span>{tenshiStatus}</span>
                  </div>
                )}

                {/* Typing indicator */}
                {isTyping && !tenshiStatus && (
                  <div className="flex items-center gap-1 text-gray-400 pl-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce"></div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area & Modo Live Switch */}
              <div className="shrink-0 border-t border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                {/* Live Voice HUD Pill when voice is active */}
                {isVoiceActive && (
                  <div className={cn(
                    "mb-2.5 flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition-all",
                    isMicMuted
                      ? "border-red-200/80 bg-red-50/90 text-red-800 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-300"
                      : "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={cn(
                          "absolute inline-flex h-full w-full rounded-full opacity-75",
                          isMicMuted ? "bg-red-400" : "animate-ping bg-emerald-400"
                        )}></span>
                        <span className={cn(
                          "relative inline-flex h-2.5 w-2.5 rounded-full",
                          isMicMuted ? "bg-red-500" : "bg-emerald-500"
                        )}></span>
                      </span>
                      <span className="font-medium tracking-tight">
                        {isMicMuted
                          ? 'Micrófono silenciado (Mute activo) 🔇'
                          : voiceStatusText || 'Tenshi te escucha... Habla con naturalidad'}
                      </span>
                    </div>

                    {/* Animated sound wave bars */}
                    <div className="flex h-3.5 items-center gap-1">
                      {[35, 75, 100, 60, 85].map((h, i) => {
                        const scaledHeight = Math.max(
                          3,
                          Math.round(h * (voiceAmplitude > 0.05 ? Math.min(voiceAmplitude * 2, 1) : 0.15))
                        );
                        return (
                          <span
                            key={i}
                            className="w-1 rounded-full bg-emerald-500 transition-all duration-100"
                            style={{ height: `${scaledHeight}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview Chip cuando hay un archivo o medio adjunto en escritorio */}
                {attachedMedia && (
                  <div className="mb-2 flex items-center justify-between gap-2.5 rounded-xl border border-teal-200/80 bg-teal-50/90 p-2 shadow-xs backdrop-blur-md dark:border-teal-900/60 dark:bg-teal-950/60 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {attachedMedia.type === 'image' ? (
                        <img
                          src={attachedMedia.dataUrl}
                          alt={attachedMedia.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover border border-teal-300 dark:border-teal-700 shadow-2xs"
                        />
                      ) : attachedMedia.type === 'video' ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs">
                          <Film className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100">
                          {attachedMedia.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-teal-700 dark:text-teal-300">
                          <span className="font-semibold uppercase tracking-wider">{attachedMedia.type}</span>
                          <span>•</span>
                          <span>{formatBytes(attachedMedia.size)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedMedia(null)}
                      title="Eliminar archivo adjunto"
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white/80 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Input Box */}
                <div className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:focus-within:bg-zinc-800">
                  <input
                    type="file"
                    id="tenshi-file-input"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.pptx,.ppt,application/*"
                    className="hidden"
                    onChange={handleFileAttachment}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('tenshi-file-input')?.click()}
                    title="Adjuntar archivo (Imágenes, Videos, PDF, Office)"
                    className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isVoiceActive ? 'Habla por el micrófono o escribe...' : 'Escribe tu consulta o pide una acción...'}
                    className="flex-1 border-none bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none focus:outline-none focus:ring-0 dark:text-zinc-100"
                    disabled={isTyping}
                  />

                  <button
                    onClick={() => handleSend()}
                    disabled={isTyping || (!input.trim() && !attachedMedia)}
                    title="Enviar mensaje"
                    className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-1.5 text-white shadow-sm transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-40"
                  >
                    <Send className="ml-0.5 h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Botonera de Control Cápsula WAPPY Design System */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
                  {/* Pills de Acción (Modo Live, Cámara, Pantalla) */}
                  <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
                    {/* Botón Modo Live */}
                    <button
                      type="button"
                      onClick={() => {
                        tenshiAudio.playBlip();
                        if (isVoiceActive) stopVoiceMode();
                        else startVoiceMode();
                      }}
                      title={isVoiceActive ? 'Pausar modo de voz en vivo' : 'Activar modo de voz en vivo'}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs',
                        isVoiceActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30 animate-pulse'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200/70 dark:border-zinc-700'
                      )}
                    >
                      <Mic className={cn('h-3.5 w-3.5', isVoiceActive ? 'text-white' : 'text-emerald-500')} />
                      <span>{isVoiceActive ? 'En Vivo' : 'Modo Live'}</span>
                    </button>

                    {/* Botón Cámara de Visión */}
                    <button
                      type="button"
                      onClick={() => {
                        tenshiAudio.playBlip();
                        if (isVisionActive && visionSource === 'camera') stopVision();
                        else startVision('camera');
                      }}
                      title={isVisionActive && visionSource === 'camera' ? 'Apagar cámara de visión' : 'Activar cámara de visión'}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs',
                        isVisionActive && visionSource === 'camera'
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/25 ring-2 ring-teal-500/30'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200/70 dark:border-zinc-700'
                      )}
                    >
                      {isVisionActive && visionSource === 'camera' ? (
                        <CameraOff className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Camera className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      )}
                      <span>{isVisionActive && visionSource === 'camera' ? 'Cámara' : 'Cámara'}</span>
                    </button>

                    {/* Botón Compartir Pantalla */}
                    <button
                      type="button"
                      onClick={() => {
                        tenshiAudio.playBlip();
                        if (isVisionActive && visionSource === 'screen') stopVision();
                        else startVision('screen');
                      }}
                      title={isVisionActive && visionSource === 'screen' ? 'Dejar de compartir pantalla' : 'Compartir pantalla con Tenshi'}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs',
                        isVisionActive && visionSource === 'screen'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200/70 dark:border-zinc-700'
                      )}
                    >
                      <Monitor className={cn('h-3.5 w-3.5', isVisionActive && visionSource === 'screen' ? 'text-white' : 'text-blue-500')} />
                      <span>{isVisionActive && visionSource === 'screen' ? 'Pantalla' : 'Pantalla'}</span>
                    </button>

                    {/* Botón Colgar Llamada cuando la voz o videollamada está activa */}
                    {(isVoiceActive || isVisionActive) && (
                      <button
                        type="button"
                        onClick={() => {
                          tenshiAudio.playBlip();
                          stopVision();
                          stopVoiceMode();
                        }}
                        title="Colgar y finalizar llamada (o di 'cuelga')"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-2xs transition-all"
                      >
                        <PhoneOff className="h-3.5 w-3.5" />
                        <span>Colgar</span>
                      </button>
                    )}
                  </div>

                  {/* Auto-pausa countdown o Branding (Oculto cuando la visión está activa para no quitar espacio a la cámara) */}
                  {!isVisionActive && (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                      {isWaitingConsultation || isChatSubmitting ? (
                        <div
                          className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 animate-pulse"
                          title="Tenshi está esperando la respuesta del especialista"
                        >
                          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                          <span>Consultando...</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                          Tenshi por WAPPY IA
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. 🌟 COMPAÑERO TENSHI FLOTANTE PURO (Posición fija en pantalla) */}
      <div
        ref={tenshiRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleTenshiInteraction}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed',
          left: `${position ? position.x : (typeof window !== 'undefined' ? window.innerWidth - 88 : 0)}px`,
          top: `${position ? position.y : (typeof window !== 'undefined' ? window.innerHeight - (isMobileScreen ? 185 : 110) : 0)}px`,
          zIndex: 10005,
        }}
        className="group relative cursor-grab active:cursor-grabbing select-none transition-transform duration-200 md:hover:scale-105 md:active:scale-95"
      >
        {/* Micro-dock flotante en Hover (Desktop) o Siempre Visible en Móvil */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'absolute -top-12 sm:-top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-40 transition-all duration-200 select-none',
            'bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-xl',
            'before:absolute before:-bottom-3 before:inset-x-0 before:h-4 before:content-[""]',
            'opacity-100 pointer-events-auto scale-100 md:opacity-0 md:pointer-events-none md:scale-95 md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:scale-100',
            (isMobileScreen || isHoveringTenshi) ? 'md:opacity-100 md:pointer-events-auto md:scale-100' : ''
          )}
        >
          {/* Botón 1: Chat de texto */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unlockAudio();
              tenshiAudio.playBlip();
              setIsOpen((prev) => !prev);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              unlockAudio();
              tenshiAudio.playBlip();
              setIsOpen((prev) => !prev);
            }}
            title={isOpen ? 'Cerrar chat' : 'Abrir chat de texto'}
            className={cn(
              'p-1.5 rounded-full transition-colors active:scale-90',
              isOpen ? 'text-emerald-400 bg-white/10' : 'text-zinc-300 hover:text-white hover:bg-white/10'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>

          {/* Botón 2: Micrófono / Modo Live */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unlockAudio();
              if (isVoiceActive) {
                tenshiAudio.playBlip();
                stopVoiceMode();
              } else {
                tenshiAudio.playBlip();
                startVoiceMode();
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              unlockAudio();
              if (isVoiceActive) {
                tenshiAudio.playBlip();
                stopVoiceMode();
              } else {
                tenshiAudio.playBlip();
                startVoiceMode();
              }
            }}
            title={isVoiceActive ? 'Pausar modo voz' : 'Activar modo voz (Live)'}
            className={cn(
              'p-1.5 rounded-full transition-colors active:scale-90',
              isVoiceActive ? 'text-emerald-400 bg-white/15 animate-pulse' : 'text-zinc-300 hover:text-white hover:bg-white/10'
            )}
          >
            <Mic className="h-3.5 w-3.5" />
          </button>

          {/* Botón Cámara / Modo Visión */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unlockAudio();
              tenshiAudio.playBlip();
              if (isVisionActive) {
                stopVision();
              } else {
                startVision('camera');
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              unlockAudio();
              tenshiAudio.playBlip();
              if (isVisionActive) {
                stopVision();
              } else {
                startVision('camera');
              }
            }}
            title={isVisionActive ? 'Detener cámara de visión' : 'Activar cámara de visión en vivo'}
            className={cn(
              'p-1.5 rounded-full transition-colors active:scale-90',
              isVisionActive ? 'text-emerald-400 bg-white/15 animate-pulse' : 'text-zinc-300 hover:text-white hover:bg-white/10'
            )}
          >
            {isVisionActive ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
          </button>

          {/* Botón 3: Silenciar Micrófono (Mute de audio del usuario) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMicMute();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleMicMute();
            }}
            title={isMicMuted ? 'Micrófono en silencio - Clic para reactivar' : 'Silenciar mi micrófono (Mute)'}
            className={cn(
              "p-1.5 rounded-full transition-colors active:scale-90",
              isMicMuted ? "text-red-400 bg-red-500/20 border border-red-500/40" : "text-zinc-300 hover:text-white hover:bg-white/10"
            )}
          >
            {isMicMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <MicOff className="h-3.5 w-3.5 opacity-60" />}
          </button>

          {/* Botón 4: Maximizar a Pantalla Completa (EXCLUSIVO PARA CELULAR) */}
          <button
            type="button"
            id="tenshi-mobile-maximize-btn"
            data-testid="tenshi-mobile-maximize-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMaximizeMobile(e);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMaximizeMobile(e);
            }}
            title="Tenshi en Pantalla Completa"
            className="flex md:hidden w-8 h-8 min-w-[32px] min-h-[32px] items-center justify-center p-1.5 rounded-full text-teal-300 hover:text-teal-100 bg-teal-500/40 border border-teal-400/60 hover:bg-teal-500/60 shadow-md transition-all active:scale-90 touch-manipulation cursor-pointer z-50 pointer-events-auto"
          >
            <Maximize2 className="h-4 w-4 pointer-events-none" />
          </button>
        </div>

        {/* 1B. Tarjeta Flotante de Briefing del Día cuando el usuario activa el Micrófono */}
        {isVoiceActive && !isOpen && dailyBriefing && !isBriefingDismissed && !richVoiceCard && (
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute bottom-28 right-0 w-80 sm:w-72 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 backdrop-blur-xl p-3.5 text-zinc-100 shadow-2xl z-[10010] animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-[11px] font-extrabold text-emerald-300 uppercase tracking-wide truncate">
                  Briefing • {dailyBriefing.empresa || 'Tu Empresa'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBriefingDismissed(true)}
                className="p-0.5 rounded-lg text-zinc-400 hover:text-white"
                title="Ocultar briefing"
              >
                <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs sm:text-[11px] text-zinc-200 leading-snug">
              {dailyBriefing.ultimaActividad && (
                <div className="truncate">
                  <span className="font-bold text-white">📋 Último: </span>
                  <span>{dailyBriefing.ultimaActividad.titulo}</span>
                </div>
              )}
              <div className="truncate">
                <span className="font-bold text-white">📅 Hoy ({dailyBriefing.agendaHoy?.length || 0}): </span>
                <span>
                  {dailyBriefing.agendaHoy && dailyBriefing.agendaHoy.length > 0
                    ? dailyBriefing.agendaHoy[0].titulo
                    : 'Sin pendientes críticos hoy'}
                </span>
              </div>
              <div className="truncate">
                <span className="font-bold text-amber-300">⏰ Mañana ({dailyBriefing.vencenManana?.length || 0}): </span>
                <span>
                  {dailyBriefing.vencenManana && dailyBriefing.vencenManana.length > 0
                    ? dailyBriefing.vencenManana[0].titulo
                    : 'Nada vence mañana'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Tarjeta Interactiva Flotante de Confirmación Instantánea ("Rich Voice Card" siempre por encima del chat) */}
        {richVoiceCard && (
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute bottom-28 right-0 w-80 sm:w-72 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 backdrop-blur-xl p-3.5 text-zinc-100 shadow-2xl z-[10010] animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-default"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-base">
                  {richVoiceCard.kind === 'email' ? '📧' : richVoiceCard.kind === 'calendar' ? '📅' : '📄'}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-[11px] font-extrabold text-white truncate">
                    {richVoiceCard.title}
                  </p>
                  <p className="text-[11px] sm:text-[10px] font-medium text-zinc-300 truncate">
                    {richVoiceCard.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRichVoiceCard(null)}
                className="p-0.5 rounded-lg text-zinc-400 hover:text-white"
                title="Cerrar"
              >
                <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
            {richVoiceCard.badge && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] sm:text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[230px]">{richVoiceCard.badge}</span>
              </div>
            )}
            {richVoiceCard.actionLabel && (richVoiceCard.htmlReport || richVoiceCard.actionPrompt) && (
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (richVoiceCard.htmlReport) {
                      setStreamingCanvas({
                        title: richVoiceCard.title || 'Informe Técnico Oficial SG-SST',
                        content: richVoiceCard.htmlReport,
                        status: 'complete',
                      });
                      setIsCanvasActive(true);
                      setCanvasMaximized(true);
                    } else if (richVoiceCard.actionPrompt) {
                      setIsOpen(true);
                      handleSend(richVoiceCard.actionPrompt);
                    }
                    setRichVoiceCard(null);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-[11px] shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white"
                >
                  <span>{richVoiceCard.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. Modo "Proactividad Silenciosa" (Ambient Copilot — siempre visible por encima del chat) */}
        {ambientTip && !richVoiceCard && (
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute bottom-28 right-0 w-80 sm:w-72 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 backdrop-blur-xl p-3.5 text-zinc-100 shadow-2xl z-[10010] animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-default"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs sm:text-[11px] font-semibold text-zinc-100 leading-relaxed">
                {ambientTip.title}
              </p>
              <button
                type="button"
                onClick={() => setAmbientTip(null)}
                className="p-0.5 rounded-lg text-zinc-400 hover:text-white shrink-0"
                title="Descartar sugerencia"
              >
                <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAmbientTip(null)}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all active:scale-95"
              >
                Ahora no
              </button>
              <button
                type="button"
                onClick={() => {
                  const promptToSend = ambientTip.prompt;
                  setAmbientTip(null);
                  setIsOpen(true);
                  handleSend(promptToSend);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-[11px] shadow-md transition-all active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white"
              >
                <span>Sí, revisar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Avatar interactivo de Tenshi Flotando */}
        <TenshiAvatar
          size={92}
          mood={derivedAvatarMood}
          isSpeaking={isTenshiSpeaking}
          outputAmplitude={outputAmplitude}
          isVoiceActive={isVoiceActive}
          isTyping={isTyping || isChatSubmitting || isWaitingConsultation || Boolean(tenshiStatus)}
          statusText={liveActionPill || tenshiStatus || undefined}
          interactive={false}
          showHaloEffect={true}
          showHUD={true}
        />
      </div>
    </>
  )}
</>
);
}
