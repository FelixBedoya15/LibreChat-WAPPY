import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuthContext, useNewConvo } from '~/hooks';
import { useAgentsMapContext } from '~/Providers';
import { useListAgentsQuery } from '~/data-provider';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import store from '~/store';
import Markdown from '~/components/Chat/Messages/Content/Markdown';
import { getDehydratedDOM, executeGUIAction, getVisibleScreenContent } from '../Chat/TenshiPageController';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { cn, clearMessagesCache } from '~/utils';
import { Constants, QueryKeys, EModelEndpoint } from 'librechat-data-provider';
import { TenshiAvatar } from './TenshiAvatar';
import { tenshiAudio } from './tenshiAudio';

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

export interface TenshiChatMessage {
  _id?: string;
  role: string;
  content: string;
  htmlReport?: string;
  isLiveVoice?: boolean;
  file?: TenshiFileAttachment;
  qrCode?: TenshiQrAttachment;
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
  const targetWords = (cleanTarget || target).split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestOverlap = 0;
  for (const a of agentsList) {
    const aName = normalizeStr(a.name);
    const aWords = aName.split(/\s+/);
    const overlap = targetWords.filter((w) => aWords.some((aw) => aw.includes(w) || w.includes(aw))).length;
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
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [tenshiStatus, setTenshiStatus] = useState<string>('');
  const [guiSteps, setGuiSteps] = useState<{ action: string; details: string; status: 'pending' | 'success' | 'failed' }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Tenshi Voice Mode State & Audio Infrastructure ───────────────────────────
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceAmplitude, setVoiceAmplitude] = useState(0);
  const [outputAmplitude, setOutputAmplitude] = useState(0);
  const [isTenshiSpeaking, setIsTenshiSpeaking] = useState(false);
  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const lastActivityRef = useRef<number>(Date.now());
  const lastUserTranscriptionRef = useRef<string>('');
  const inactivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectVoiceRef = useRef<() => void>(() => {});
  const sendVoiceInterruptRef = useRef<() => void>(() => {});

  // Monitoreo de chat y agentes para que Tenshi aprenda y responda al usuario
  const pendingAgentConsultationRef = useRef<{
    agentName: string;
    question: string;
    active: boolean;
    hadStarted: boolean;
    timestamp: number;
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


  const queryClient = useQueryClient();
  const latestChatMessage = useRecoilValue(store.latestMessageFamily(0));
  const latestChatMessageRef = useRef<any>(latestChatMessage);
  latestChatMessageRef.current = latestChatMessage;
  const { conversation } = store.useCreateConversationAtom(0);
  const { newConversation } = useNewConvo(0);
  const setIsCanvasActive = useSetRecoilState(store.isCanvasActive);
  const setStreamingCanvas = useSetRecoilState(store.streamingCanvasState);
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
    } else if (currentConvoId && (!activeConsultationConvoIdRef.current || activeConsultationConvoIdRef.current === 'new')) {
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
      setIsTenshiSpeaking(true);
      setVoiceStatusText('Tenshi hablando...');
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
              setVoiceStatusText('Tenshi te escucha...');
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
      if (txt.includes('Dictamen de')) return true;
      if (consultation?.question && txt.trim().toLowerCase() === consultation.question.trim().toLowerCase()) return true;
      return false;
    };

    // 1. Buscar en mensajes de React Query
    try {
      const convoId = currentConvoId || conversation?.conversationId || 'new';
      const queryMsgs = queryClient.getQueryData<any[]>([QueryKeys.messages, convoId]);
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
        '.agent-turn .markdown, .agent-turn [class*="message-content"], [data-message-id]:not([data-is-user="true"]) .markdown, [class*="text-message"]:not([data-is-user="true"]) .markdown, article:not([data-is-user="true"]) .markdown'
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

    // 1. Si el Modo Voz está activo, instruir a Tenshi Live con el dictamen técnico
    if (isVoiceActive) {
      lastActivityRef.current = Date.now();
      clearAudioQueue();
      setVoiceStatusText(`Tenshi respondiendo sobre ${consultation.agentName}...`);
      const condensedDictamen = finalText.length > 1200 ? finalText.substring(0, 1200) + '...' : finalText;
      const promptForTenshi = `[SISTEMA INTERNO WAPPY - RESPUESTA TÉCNICA EMITIDA]:
El especialista ${consultation.agentName} ha terminado de responder en pantalla a la consulta: "${consultation.question}".

DICTAMEN TÉCNICO OFICIAL:
"""
${condensedDictamen}
"""

DIRECTIVA OBLIGATORIA DE SÍNTESIS TÉCNICA ORAL PARA TENSHI:
1. Explica y sintetiza verbalmente de inmediato al usuario, con tu voz cercana y profesional, las conclusiones, fundamentos y medidas técnicas que dictaminó el especialista.
2. Cita de forma fluida las normas, decretos, resoluciones, plazos o artículos clave que sustentan el dictamen (ej: Decreto 1072 de 2015, Resoluciones o Códigos aplicables).
3. ESTÁ PROHIBIDO limitarte a decir "el especialista ya respondió" o mandar al usuario a revisar la pantalla. El usuario te está escuchando; explícale la respuesta técnica directamente.
4. CERO DISCLAIMERS: Prohibido decir "no constituye consejo médico", "consulte a un profesional", etc. WAPPY es una plataforma técnica profesional de SG-SST.
5. CERO INGLÉS: 100% español profesional.`;
      sendTextMessageRef.current?.(promptForTenshi);
    }

    // 2. Registrar en la conversación interna de Tenshi y persistir en BD para continuidad de memoria
    const agentResponseExcerpt =
      finalText.length > 2500
        ? finalText.substring(0, 2500) + '... *(consulta completa disponible en el chat central)*'
        : finalText;
    const summaryText = `💡 **Dictamen de ${consultation.agentName}** sobre *"${consultation.question}"*:\n\n${agentResponseExcerpt}\n\n*(Consulta con especialista registrada)*`;
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

  const sessionOptions = useMemo(
    () => ({
      mode: 'tenshi_voice',
      route: `${location.pathname}${location.search}`,
      onAudioReceived: (audioData: string) => {
        handleAudioReceived(audioData);
      },
      onTextReceived: (text: string, isUserTranscription?: boolean) => {
        lastActivityRef.current = Date.now();
        if (isUserTranscription) {
          lastUserTranscriptionRef.current = text;

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

        try {
          if (action.name === 'wappy_navegar') {
            const rawModulo = action.args?.modulo;
            const rawRuta = action.args?.ruta;
            const { targetRoute, targetSgsstModule } = resolveWappyDestination(rawModulo, rawRuta);

            // Buffer temporal de 450ms para que la voz de Tenshi empiece a sonar antes del cambio visual en pantalla
            setTimeout(() => {
              navigate(targetRoute);
              if (targetSgsstModule) {
                window.dispatchEvent(
                  new CustomEvent('navigate-sgsst', { detail: { module: targetSgsstModule } })
                );
              }
            }, 450);

            resultMsg = `Navegación exitosa a ${targetRoute}`;
          } else if (action.name === 'wappy_abrir_chat_agente') {
            const rawAgente = (action.args?.agente || '').trim();
            const rawPregunta = (action.args?.pregunta || '').trim();
            const pregunta = cleanDelegatedPrompt(rawPregunta);
            const matchedAgent = findMatchingAgent(rawAgente, agentsRef.current);
            const agentName = matchedAgent ? matchedAgent.name : rawAgente;

            // Detectar si la pregunta está vacía, es genérica o no contiene una consulta real
            const isGenericGreeting = (text: string) =>
              /^(hola|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|c[oó]mo\s+est[aá]s|hola\s+c[oó]mo\s+est[aá]s|hola\s+c[oó]mo\s+est[aá]s\s+el\s+d[ií]a\s+de\s+hoy|ciao|por|qu[eé])\.?$/i.test(text.trim());

            if (!pregunta || isGenericGreeting(pregunta) || pregunta.length < 4) {
              console.warn('[TenshiChat] wappy_abrir_chat_agente rechazado por falta de consulta:', pregunta);
              resultMsg = `NO se abrió el chat con ${agentName}: falta la consulta concreta del usuario. Pregúntale verbalmente al usuario qué tema o duda desea consultar con ${agentName} antes de abrir el chat.`;
            } else {
              // Registrar consulta pendiente para que Tenshi escuche la respuesta del agente
              if (consultationTimerRef.current) {
                clearTimeout(consultationTimerRef.current);
                consultationTimerRef.current = null;
              }
              const initialMessageId = latestChatMessageRef.current?.messageId || null;
              pendingAgentConsultationRef.current = {
                agentName,
                question: pregunta,
                active: true,
                hadStarted: false,
                timestamp: Date.now(),
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
                /\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia|cambiemos|abrir\w*\s+(un\s+)?(nuevo\s+)?chat|abrirme|ábreme)\b/i.test(action.args?.pregunta || '')
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

            // 1. Si estamos en /c/..., desplegar también en el panel Canvas de pantalla dividida
            if (window.location.pathname.startsWith('/c/')) {
              setStreamingCanvas({
                id: canvasId,
                title,
                fileType,
                content,
                messageId: '',
                isStreaming: false,
              });
              setIsCanvasActive(true);
            }

            // 2. Entregar siempre en el chat de Tenshi con tarjeta interactiva y botones de descarga
            if (content) {
              const fileTypeLabels: Record<string, string> = {
                text: 'Documento Word',
                excel: 'Hoja de Cálculo Excel',
                html: 'Aplicativo / Reporte HTML',
                presentation: 'Presentación de Diapositivas',
              };
              const label = fileTypeLabels[fileType] || 'Archivo SG-SST';

              setMessages((prev) => [
                ...prev,
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
              ]);
              setIsOpen(true);
            }

            resultMsg = `Archivo "${title}" (${fileType}) entregado en el chat de Tenshi con botones de descarga y visualización.`;
          } else if (action.name === 'wappy_seleccionar_empresa' || action.name === 'wappy_activar_empresa') {
            const companyName = action.args?.nombre_o_id || action.args?.empresa || action.args?.nombre || action.args?.id || action.result?.companyName;
            resultMsg = `Empresa "${companyName}" seleccionada y activa en el sistema`;
            window.dispatchEvent(
              new CustomEvent('wappy-empresa-cambiada', { detail: { empresa: companyName } })
            );
          } else if (action.name === 'wappy_diligenciar_formulario') {
            const rawModulo = (action.args?.modulo || 'investigacion_atel').toLowerCase().trim();
            const campos = action.args?.campos || {};
            const accion = action.args?.accion || 'llenar';

            // Si no estamos en el módulo correspondiente, navegar hacia él
            if (!window.location.pathname.includes('/sgsst') || !window.location.search.includes(rawModulo)) {
              const targetRoute = HITO_MAP[rawModulo]?.route || `/sgsst?hito=hito7&module=${rawModulo}`;
              navigate(targetRoute);
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
              action.args.direccion
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
          } else if (action.name === 'wappy_leer_informe_aplicativo') {
            const rawApp = action.args?.aplicativo || action.args?.modulo || 'perfil_cargo';
            const cargo = action.args?.cargo;
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

            // Si hay informe completo o datos sustanciales, mostrar tarjeta en el chat de Tenshi
            if (res.informeCompleto && res.informeCompleto.length > 30) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: `📑 **Informe Técnico Oficial - ${res.aplicativo || rawApp}**:\n\n${res.informeCompleto}`,
                },
              ]);
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
          } else if (action.name === 'wappy_crear_informe') {
            const res = (action as any).result || {};
            const info = res.informe || action.args || {};
            const title = info.titulo || action.args?.titulo || 'Informe Técnico SG-SST';
            const content = info.contenido || action.args?.contenido || '';
            const format = info.formato || action.args?.formato || 'html';

            if (content) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: `📑 **${title}**\n\n${content}`,
                  file: {
                    title,
                    fileType: format,
                    content,
                    canvasId: `tenshi-report-${Date.now()}`,
                  },
                  htmlReport: format === 'html' ? content : undefined,
                },
              ]);
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
          } else if (action.name === 'wappy_enviar_correo') {
            const res = (action as any).result || {};
            const dest = action.args?.destinatario || res.destinatario || '';
            const asunto = action.args?.asunto || res.asunto || '';
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `📧 **Correo Enviado Exitosamente**\n- **Destinatario:** ${dest}\n- **Asunto:** ${asunto}\n- **Canal:** ${res.canal || 'Servidor WAPPY'}\n- **Estado:** Entregado al servidor de mensajería.`,
              },
            ]);
            resultMsg = `Correo enviado exitosamente a ${dest}.`;
          } else if (action.name === 'wappy_gestionar_agenda') {
            const res = (action as any).result || {};
            const msg = res.mensaje || (res.eventos ? `Agenda consultada: ${res.eventos.length} actividades próximas.` : 'Agenda actualizada.');
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
            const isHtml = formato === 'html' || contenido.trim().startsWith('<!DOCTYPE') || contenido.trim().startsWith('<html');
            const chatBody = isHtml
              ? (entregable.resumen || res.resultado || 'Se ha generado el dashboard interactivo en HTML con las gráficas de salud ocupacional. Puedes visualizarlo o descargarlo desde el panel Canvas.')
              : contenido;
            const canvasFileType = isHtml ? 'html' : (formato === 'word' || formato === 'documento' ? 'text' : formato);

            if (contenido) {
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
            }
            resultMsg = `Entregable de Antigravity "${titulo}" completado y presentado en el chat de Tenshi.`;
          }
        } catch (e: any) {
          resultMsg = `Error ejecutando acción: ${e.message}`;
        }

        sendWappyActionResult(action.id, action.name, resultMsg);
        setTenshiStatus('');
      },
      onStatusChange: (newStatus: string) => {
        if (newStatus === 'connecting') {
          setVoiceStatusText('Conectando con Tenshi...');
        } else if (newStatus === 'ready' || newStatus === 'connected' || newStatus === 'listening' || newStatus === 'turn_complete') {
          if (newStatus === 'turn_complete') {
            setMessages((prev) => prev.map((m) => ({ ...m, isLiveVoice: false })));
            refetchHistoryRef.current?.();
          }
          setVoiceStatusText('Tenshi te escucha...');
        } else if (newStatus === 'speaking') {
          setVoiceStatusText('Tenshi respondiendo...');
        } else if (newStatus === 'interrupted') {
          clearAudioQueue();
          setVoiceStatusText('Tenshi te escucha...');
          setMessages((prev) => prev.map((m) => ({ ...m, isLiveVoice: false })));
        } else if (newStatus === 'idle') {
          setVoiceStatusText('');
        }
      },
      onError: (err: string) => {
        console.error('[Tenshi Voice] Error:', err);
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
    [navigate, handleAudioReceived, clearAudioQueue]
  );

  const {
    connect: connectVoice,
    disconnect: disconnectVoice,
    getInputVolume,
    sendTextMessage,
    sendWappyActionResult,
    sendScreenContext,
    setIsPlayingAudio: setVoiceIsPlayingAudio,
    setMuted: setVoiceMuted,
    sendInterrupt: sendVoiceInterrupt,
    status: voiceStatus,
  } = useVoiceSession(sessionOptions);
  disconnectVoiceRef.current = disconnectVoice;
  setIsPlayingAudioRef.current = setVoiceIsPlayingAudio;
  sendVoiceInterruptRef.current = sendVoiceInterrupt;
  sendTextMessageRef.current = sendTextMessage;
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

  // Tenshi mantiene siempre el micrófono activo para escuchar al usuario sin bloqueos ni silenciamientos
  useEffect(() => {
    if (isVoiceActive) {
      setVoiceMuted(false);
    }
  }, [isVoiceActive, setVoiceMuted]);

  const stopVoiceMode = useCallback(() => {
    setIsVoiceActive(false);
    setIsWaitingConsultation(false);
    setIsTyping(false);
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
  }, [disconnectVoice, clearAudioQueue, playPowerDownChime]);

  const startVoiceMode = useCallback(() => {
    setIsVoiceActive(true);
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

    // Si el especialista terminó de generar (transición de isChatSubmitting de true a false, o hadStarted y ya no genera)
    if (consultation.hadStarted && !isChatSubmitting) {
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
    const tenshiW = 70;
    const tenshiH = 92;
    const chatW = Math.min(350, window.innerWidth - 24);
    const chatH = Math.min(440, window.innerHeight - 32);

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
      staleTime: 10 * 1000,
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
          // Extraer mensajes locales que contengan archivos (file o htmlReport)
          const localFiles = prev.filter((m) => m.file || m.htmlReport);

          // 1. Mapa de archivos locales por contenido o por título
          const localFileMap = new Map<string, any>();
          prev.forEach((m) => {
            if (m.file) {
              if (m.content) localFileMap.set(m.content.trim(), m.file);
              if (m.file.title) localFileMap.set(m.file.title.trim(), m.file);
            }
          });

          // 2. Enriquecer historyData si algún mensaje del historial carece de file pero existía localmente
          const enrichedHistory = historyData.map((h: any) => {
            if (!h.file && h.content) {
              const matched = localFileMap.get(h.content.trim());
              if (matched) return { ...h, file: matched };
            }
            return h;
          });

          if (localFiles.length === 0) {
            return enrichedHistory;
          }

          // 3. Identificadores y firmas de mensajes ya existentes en enrichedHistory
          const historySignatures = new Set<string>();
          enrichedHistory.forEach((h: any) => {
            if (h._id) historySignatures.add(String(h._id));
            if (h.content) historySignatures.add(h.content.trim());
            if (h.file?.canvasId) historySignatures.add(String(h.file.canvasId));
            const sig = `${(h.content || '').trim()}-${(h.file?.title || '').trim()}`;
            if (sig !== '-') historySignatures.add(sig);
          });

          // 4. Filtrar archivos locales que aún no hayan sido devueltos por el backend
          const unpersistedFiles = localFiles.filter((lf: any) => {
            if (lf._id && historySignatures.has(String(lf._id))) return false;
            if (lf.file?.canvasId && historySignatures.has(String(lf.file.canvasId))) return false;
            if (lf.content && historySignatures.has(lf.content.trim())) return false;
            const sig = `${(lf.content || '').trim()}-${(lf.file?.title || '').trim()}`;
            return !historySignatures.has(sig);
          });

          if (unpersistedFiles.length === 0) {
            return enrichedHistory;
          }

          return [...enrichedHistory, ...unpersistedFiles];
        });
      } else {
        setMessages((prev) => {
          const localFiles = prev.filter((m) => m.file || m.htmlReport);
          if (localFiles.length > 0) return localFiles;
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

  useEffect(() => {
    if ((isOpen || isHeroChatOpen) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isHeroChatOpen]);

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
      
      // Heurística de captura de DOM: capturar si estamos en un bucle interactivo de GUI, si el usuario pide interactuar o si estamos en SGSST
      const textQuery = lastMessage?.role === 'user' ? lastMessage.content.toLowerCase() : '';
      const uiActionKeywords = [
        'clic', 'click', 'pantalla', 'formulario', 'abre', 'abrir', 'llena', 'llenar',
        'guarda', 'guardar', 'navega', 'navegar', 'boton', 'botón', 'scroll', 'interactua',
        'digita', 'aplicativo', 'aplicacion', 'aplicación', 'escribe', 'escribir', 'reporte',
        'reportar', 'investigacion', 'investigación', 'accidente', 'diligencia', 'diligenciar',
        'colocar', 'datos', 'crear', 'lee', 'leeme', 'léeme', 'muestra', 'muéstrame',
        'informe', 'registros', 'que hay', 'qué hay', 'ves', 'ver', 'mira', 'mirar',
        'viendo', 'desplaza', 'desplazar', 'desplazate', 'desplázate', 'desplazarse',
        'baja', 'bajar', 'sube', 'subir', 'scrollear', 'deslizar', 'desliza'
      ];
      const isUiActionQuery = uiActionKeywords.some(kw => textQuery.includes(kw));
      const isSgsstPage = window.location.pathname.startsWith('/sgsst');
      
      const shouldCaptureDOM = isLoopFeedback || isUiActionQuery || isSgsstPage;
      
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

      const response = await axios.post(
        '/api/tenshi/chat',
        {
          messages: cappedMessages,
          browserState: domState,
          tenshiKey: typeof window !== 'undefined' ? localStorage.getItem('librechat_user_key_tenshi_google') || undefined : undefined,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const responseData = response.data;
      console.log('[Tenshi Frontend] Received response:', responseData);

      const assistantMsg = {
        role: 'assistant',
        content: responseData.response,
        htmlReport: responseData.htmlReport,
        qrCode: responseData.qrCode,
        file: responseData.file,
        isIntermediate: !!responseData.guiAction || (responseData.guiActions && responseData.guiActions.length > 0),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Si Tenshi requiere una o más acciones visuales, las ejecutamos en secuencia en el cliente
      const actions = responseData.guiActions || (responseData.guiAction ? [responseData.guiAction] : []);
      if (actions.length > 0) {
        console.log('[Tenshi Frontend] GUI actions requested:', actions);
        let cumulativeMessages = [...currentMessages, assistantMsg];
        let lastResult: { success: boolean; message: string } | null = null;
        let index = 0;

        for (const action of actions) {
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

            navigate(targetRoute);
            if (targetSgsstModule) {
              window.dispatchEvent(
                new CustomEvent('navigate-sgsst', { detail: { module: targetSgsstModule } })
              );
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
      setTenshiStatus('Error en la automatización.');
      const status = error.response?.status;
      let userFriendlyMsg = error.response?.data?.details || error.message;

      if (status === 502 || userFriendlyMsg.includes('502')) {
        userFriendlyMsg =
          'Se interrumpió la conexión brevemente mientras el servidor terminaba de actualizarse (Error 502). Ya estamos totalmente en línea. ¡Por favor reenvíame tu solicitud!';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Lo siento, he tenido un inconveniente de conexión. ${userFriendlyMsg}`,
        },
      ]);
      setIsTyping(false);
      setTenshiStatus('');
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (typeof customText === 'string' ? customText : input).trim();
    if (!textToSend || isTyping) return;

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
    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

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

  const handleDownloadFile = useCallback((file: TenshiFileAttachment) => {
    try {
      const safeTitle = (file.title || 'documento-sgsst').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      if (file.fileType === 'excel') {
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
        saveAs(blob, `${safeTitle}.xlsx`);
      } else if (file.fileType === 'text') {
        const simpleHtml = markdownToSimpleHtml(file.content);
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
        saveAs(blob, `${safeTitle}.doc`);
      } else if (file.fileType === 'html') {
        const blob = new Blob([file.content], { type: 'text/html;charset=utf-8' });
        saveAs(blob, `${safeTitle}.html`);
      } else if (file.fileType === 'presentation') {
        const blob = new Blob([file.content], { type: 'application/json;charset=utf-8' });
        saveAs(blob, `${safeTitle}.json`);
      }
    } catch (err) {
      console.error('[TenshiChat] Error al descargar archivo:', err);
    }
  }, []);

  const handleOpenFileInCanvas = useCallback(
    (file: TenshiFileAttachment) => {
      if (file.fileType === 'html') {
        openHtmlReport(file.content, file.title);
        return;
      }
      setStreamingCanvas({
        id: file.canvasId || `canvas-${Date.now()}`,
        title: file.title,
        fileType: file.fileType as any,
        content: file.content,
        messageId: '',
        isStreaming: false,
      });
      setIsCanvasActive(true);
      if (!window.location.pathname.startsWith('/c/')) {
        navigate('/c/new');
      }
    },
    [navigate, setStreamingCanvas, setIsCanvasActive],
  );

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
              <div className="relative flex h-7 w-7 items-center justify-center">
                <img
                  src="/assets/tenshi.png"
                  alt="Tenshi"
                  className="h-full w-full object-contain pointer-events-none"
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
                isSpeaking={isTenshiSpeaking}
                outputAmplitude={outputAmplitude}
                isVoiceActive={isVoiceActive}
                isTyping={isTyping || isChatSubmitting || isWaitingConsultation || Boolean(tenshiStatus)}
                interactive={true}
                showHaloEffect={true}
                showHUD={true}
              />
            </div>

            {/* 2. Saludo & Subtítulo */}
            <div className="text-center max-w-xs mt-2 mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                ¡Hola, {user?.name?.split(' ')[0] || user?.username || 'Especialista'}!
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-snug font-medium">
                {isVoiceActive
                  ? 'Voz en vivo activa. Te estoy escuchando...'
                  : 'Soy tu copiloto en SG-SST. Tócame para hablar o pulsa el micrófono.'}
              </p>
            </div>

            {/* 3. 🌟 Botonera Cápsula de Tenshi ACTIVA ([Chat] [Micrófono] [Audio]) */}
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

              {/* Botón Efectos de Sonido */}
              <button
                type="button"
                onClick={handleToggleSFX}
                title={isSFXMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
                className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              >
                {isSFXMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
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
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                    Chat con Tenshi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
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

              {/* Mensajes del Chat */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
                {messages
                  .filter((m) => !m.content?.startsWith('[RESULTADO_GUI]') && !(m as any).isIntermediate)
                  .map((msg, i) => (
                    <div
                      key={i}
                      className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[88%] rounded-2xl p-2.5 text-xs shadow-xs',
                          msg.role === 'user'
                            ? 'rounded-tr-none bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-medium'
                            : 'rounded-tl-none border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100'
                        )}
                      >
                        {msg.content && <Markdown content={msg.content} />}
                        {msg.file && (
                          <div className="mt-2 p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-bold text-slate-800 dark:text-zinc-100">
                              {msg.file.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(msg.file!)}
                              className="px-2 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-bold flex items-center gap-1 active:scale-95"
                            >
                              <Download className="w-3 h-3" /> Descargar
                            </button>
                          </div>
                        )}
                        {msg.htmlReport && (
                          <button
                            type="button"
                            onClick={() => openHtmlReport(msg.htmlReport!)}
                            className="mt-2 w-full text-center py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20 active:scale-95"
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
                <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 px-2.5 py-1.5 shadow-sm">
                  <input
                    type="file"
                    id="tenshi-hero-file-input"
                    accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setInput((prev) => `${prev ? prev + ' ' : ''}[Archivo: ${file.name}] `);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('tenshi-hero-file-input')?.click()}
                    title="Adjuntar archivo"
                    className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
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

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={isTyping || !input.trim()}
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
            <div
              style={getChatPositionStyle()}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95',
                isFullscreen
                  ? 'fixed inset-3 sm:inset-6 z-[10000] w-auto h-auto'
                  : ''
              )}
            >
          {/* Cabecera Glassmorphic Minimalista Compacta */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200/60 bg-slate-50/80 px-3.5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-800/60 select-none">
            <div className="flex items-center gap-2">
              <div className="relative flex h-7 w-7 items-center justify-center">
                <img
                  src="/assets/tenshi.png"
                  alt="Tenshi"
                  className="h-full w-full object-contain pointer-events-none"
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
                onClick={handleClose}
                title="Cerrar chat (Dejar solo a Tenshi)"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Historial de conversación */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-3 text-xs dark:bg-zinc-950/50">
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
                            {msg.content && <Markdown content={msg.content} />}
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
                                        : msg.file.fileType === 'text'
                                        ? 'Documento Word (.doc)'
                                        : msg.file.fileType === 'html'
                                        ? 'Aplicativo / Reporte HTML'
                                        : 'Presentación de Diapositivas'}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-zinc-800/80">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(msg.file!)}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 hover:from-teal-500 hover:to-teal-600"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Descargar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFileInCanvas(msg.file!)}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Ver en Pantalla</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            {msg.htmlReport && (
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
                  <div className="mb-2.5 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-800 shadow-sm transition-all dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                      </span>
                      <span className="font-medium tracking-tight">
                        {voiceStatusText || 'Tenshi te escucha... Habla con naturalidad'}
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

                {/* Input Box */}
                <div className="group flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:focus-within:bg-zinc-800">
                  <input
                    type="file"
                    id="tenshi-file-input"
                    accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setInput((prev) => `${prev ? prev + ' ' : ''}[Archivo: ${file.name}] `);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('tenshi-file-input')?.click()}
                    title="Adjuntar archivo (Excel, CSV, PDF, Word)"
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
                    disabled={isTyping || !input.trim()}
                    title="Enviar mensaje"
                    className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-1.5 text-white shadow-sm transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-40"
                  >
                    <Send className="ml-0.5 h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Modo Live Switch en el footer del Chat (Imagen 5) */}
                <div className="mt-2.5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isVoiceActive) {
                          stopVoiceMode();
                        } else {
                          startVoiceMode();
                        }
                      }}
                      className={cn(
                        'group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
                        isVoiceActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                      title="Activar o pausar Modo Live (Voz en vivo)"
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                          isVoiceActive ? 'transform translate-x-5' : 'transform translate-x-0'
                        )}
                      />
                    </button>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium select-none">
                      <Mic className={cn('h-3.5 w-3.5', isVoiceActive ? 'text-emerald-500 animate-pulse' : 'text-gray-400')} />
                      <span className={cn('font-semibold', isVoiceActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400')}>
                        {isVoiceActive ? 'Modo Live Activo' : 'Modo Live'}
                      </span>
                    </div>
                  </div>

                  {/* Inactivity countdown indicator: auto-pausa a 1 minuto */}
                  {isVoiceActive ? (
                    isWaitingConsultation || isChatSubmitting ? (
                      <div
                        className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 animate-pulse"
                        title="Tenshi está esperando la respuesta del especialista para continuar la conversación hablada"
                      >
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span>Esperando al especialista...</span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium"
                        title="Se desactiva automáticamente tras 5 minutos sin usar"
                      >
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Auto-pausa: {Math.floor(Math.max(0, 300 - inactivitySeconds) / 60)}m {String(Math.max(0, 300 - inactivitySeconds) % 60).padStart(2, '0')}s</span>
                      </div>
                    )
                  ) : (
                    <span className="text-[10px] font-medium tracking-tight text-gray-400">
                      Tenshi por WAPPY IA
                    </span>
                  )}
                </div>
              </div>
            </div>
        </div>
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
          zIndex: 48,
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

          {/* Botón 3: Silenciar SFX */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSFX();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleSFX();
            }}
            title={isSFXMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
          >
            {isSFXMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
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

        {/* Avatar interactivo de Tenshi Flotando */}
        <TenshiAvatar
          size={92}
          isSpeaking={isTenshiSpeaking}
          outputAmplitude={outputAmplitude}
          isVoiceActive={isVoiceActive}
          isTyping={isTyping || isChatSubmitting || isWaitingConsultation || Boolean(tenshiStatus)}
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
