/**
 * SSTMissionEngine.tsx
 * History Intelligence Engine — Generates personalized missions
 * from real accident data, legal compliance, and IPEVAR risk levels.
 */
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '~/hooks';
import './sst-bit.css';

// ─── Mission Types ───────────────────────────────────────────────────────────
interface Mission {
  id: string;
  title: string;
  detail: string;
  xp: number;
  phase: 'plan' | 'do' | 'check' | 'act';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  done: boolean;
}

const PRIORITY_COLOR: Record<Mission['priority'], string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#fbbf24',
  LOW:      '#4ade80',
};

const PHASE_COLOR: Record<Mission['phase'], string> = {
  plan:  '#4ade80',
  do:    '#fbbf24',
  check: '#f87171',
  act:   '#c084fc',
};

const PHASE_LABEL: Record<Mission['phase'], string> = {
  plan:  'PLANEAR',
  do:    'HACER',
  check: 'VERIFICAR',
  act:   'ACTUAR',
};

// ─── Mission Generator (Intelligence Engine) ────────────────────────────────
function generateMissions(data: {
  openAccidents: number;
  totalAccidents: number;
  missingFields: number;
  hp: number;
  visitedPhases: string[];
}): Mission[] {
  const missions: Mission[] = [];

  // CRITICAL: Open accidents
  if (data.openAccidents >= 3) {
    missions.push({
      id: 'close_accidents_urgent',
      title: 'ALERTA ROJA: Accidentes Abiertos',
      detail: `${data.openAccidents} reportes sin cerrar. Tu HP está bajo (${data.hp}/100). Cierra los actos inseguros.`,
      xp: 80,
      phase: 'do',
      priority: 'CRITICAL',
      done: false,
    });
  } else if (data.openAccidents > 0) {
    missions.push({
      id: 'close_accidents',
      title: 'Cerrar Reportes Pendientes',
      detail: `${data.openAccidents} acto(s) inseguro(s) sin resolver. Ve a HACER → Reporte de Actos.`,
      xp: 40,
      phase: 'do',
      priority: 'HIGH',
      done: false,
    });
  }

  // HIGH: Config missing
  if (data.missingFields > 5) {
    missions.push({
      id: 'complete_config',
      title: 'Configurar Organización',
      detail: `Faltan ${data.missingFields} campos obligatorios. Sin datos completos no se pueden generar simulaciones.`,
      xp: 60,
      phase: 'plan',
      priority: 'HIGH',
      done: false,
    });
  } else if (data.missingFields > 0) {
    missions.push({
      id: 'complete_config_minor',
      title: 'Completar Información Empresarial',
      detail: `${data.missingFields} campo(s) pendientes en la configuración.`,
      xp: 20,
      phase: 'plan',
      priority: 'MEDIUM',
      done: false,
    });
  }

  // HIGH: Never visited HACE (most important phase)
  if (!data.visitedPhases.includes('phase_visit_do')) {
    missions.push({
      id: 'visit_hacer',
      title: 'Explorar Sala HACER',
      detail: 'No has visitado la fase operativa. Aquí están las herramientas de control de riesgo.',
      xp: 60,
      phase: 'do',
      priority: 'HIGH',
      done: false,
    });
  }

  // MEDIUM: Never done audit
  if (!data.visitedPhases.includes('phase_visit_check')) {
    missions.push({
      id: 'first_audit',
      title: 'Primera Auditoría SST',
      detail: 'Realiza tu primera evaluación de cumplimiento en VERIFICAR → Auditoría.',
      xp: 50,
      phase: 'check',
      priority: 'MEDIUM',
      done: false,
    });
  }

  // MEDIUM: Never visited PLAN
  if (!data.visitedPhases.includes('phase_visit_plan')) {
    missions.push({
      id: 'visit_plan',
      title: 'Construir la Política SST',
      detail: 'Define la Política y Objetivos SST de tu organización en PLANEAR.',
      xp: 45,
      phase: 'plan',
      priority: 'MEDIUM',
      done: false,
    });
  }

  // LOW: Historical learning — if has many closed accidents
  if (data.totalAccidents - data.openAccidents > 5) {
    missions.push({
      id: 'historical_ipevar',
      title: 'Actualizar Matriz IPEVAR',
      detail: 'Tu historial de accidentes sugiere nuevos peligros. Actualiza el IPEVAR con los hallazgos.',
      xp: 35,
      phase: 'do',
      priority: 'LOW',
      done: false,
    });
  }

  // LOW: Improvement
  if (!data.visitedPhases.includes('phase_visit_act')) {
    missions.push({
      id: 'visit_act',
      title: 'Registrar Acciones de Mejora',
      detail: 'Cierra el ciclo PHVA: registra acciones correctivas en la sala ACTUAR.',
      xp: 40,
      phase: 'act',
      priority: 'LOW',
      done: false,
    });
  }

  // Sort: CRITICAL first, then by XP descending
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  missions.sort((a, b) => order[a.priority] - order[b.priority] || b.xp - a.xp);

  return missions.slice(0, 5); // max 5 active missions
}

// ─── React Component ─────────────────────────────────────────────────────────
interface Props {
  missingFields?: number;
  hp?: number;
  visitedPhases?: string[];
  onNavigate?: (phase: string) => void;
}

const SSTMissionEngine: React.FC<Props> = ({ missingFields = 0, hp = 100, visitedPhases = [], onNavigate }) => {
  const { token } = useAuthContext();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch('/api/sgsst/reporte-actos', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { reportesList: [] })
      .then(data => {
        const list = data?.reportesList ?? [];
        const openAccidents  = list.filter((r: any) => r.estado !== 'Cerrado').length;
        const totalAccidents = list.length;
        const mq = generateMissions({ openAccidents, totalAccidents, missingFields, hp, visitedPhases });
        setMissions(mq);
      })
      .catch(() => setMissions(generateMissions({ openAccidents: 0, totalAccidents: 0, missingFields, hp, visitedPhases })))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="pixel-box p-4 border-yellow-600 flex items-center gap-3">
        <span className="font-pixel text-yellow-400 animate-pulse" style={{ fontSize:'8px' }}>
          &#9632; LOADING MISSIONS...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {missions.map((m, i) => {
        const isOpen = expanded === m.id;
        const pColor = PRIORITY_COLOR[m.priority];
        const phColor = PHASE_COLOR[m.phase];

        return (
          <div key={m.id}
            className="pixel-box overflow-hidden"
            style={{ borderColor: isOpen ? pColor : '#374151', backgroundColor: '#0d0d0d' }}
          >
            {/* Mission row */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition-opacity"
              style={{ backgroundColor: isOpen ? '#1a0a0a' : '#111' }}
              onClick={() => setExpanded(isOpen ? null : m.id)}
            >
              {/* Priority indicator */}
              <span className="font-pixel flex-shrink-0" style={{ fontSize:'8px', color: pColor }}>
                {m.priority === 'CRITICAL' ? '!!!' : m.priority === 'HIGH' ? '!!' : m.priority === 'MEDIUM' ? '!' : '›'}
              </span>
              {/* Number */}
              <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize:'7px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {/* Title */}
              <span className="font-pixel text-white flex-1 uppercase" style={{ fontSize:'7px' }}>
                {m.title}
              </span>
              {/* Phase tag */}
              <span className="font-pixel flex-shrink-0 px-1 border" style={{ fontSize:'5px', color: phColor, borderColor: phColor }}>
                {PHASE_LABEL[m.phase]}
              </span>
              {/* XP */}
              <span className="font-pixel flex-shrink-0 text-yellow-400" style={{ fontSize:'6px' }}>
                +{m.xp}XP
              </span>
              {/* Expand */}
              <span className="font-pixel text-gray-500 flex-shrink-0" style={{ fontSize:'8px' }}>
                {isOpen ? '▼' : '►'}
              </span>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-6 py-3 border-t-2" style={{ borderColor: pColor, backgroundColor: '#060606' }}>
                <p className="font-pixel text-gray-400 mb-4" style={{ fontSize:'7px', lineHeight:'2' }}>
                  {m.detail}
                </p>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(m.phase)}
                    className="pixel-btn font-pixel text-black text-[7px]"
                    style={{ backgroundColor: phColor }}
                  >
                    &#x25BA; IR A {PHASE_LABEL[m.phase]}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {missions.length === 0 && (
        <div className="pixel-box p-6 text-center border-green-800">
          <p className="font-pixel text-green-400" style={{ fontSize:'8px' }}>&#x2713; ALL MISSIONS COMPLETE!</p>
          <p className="font-pixel text-gray-600 mt-2" style={{ fontSize:'6px' }}>Tu sistema SST está al día.</p>
        </div>
      )}
    </div>
  );
};

export default SSTMissionEngine;
