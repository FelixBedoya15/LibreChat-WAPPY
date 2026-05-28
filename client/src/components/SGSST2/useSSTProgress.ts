/**
 * useSSTProgress.ts
 * Tracks XP and module completion for the Somos SST gamification system.
 * XP is persisted to localStorage per user.
 */
import { useCallback, useEffect, useState } from 'react';

export interface SSTProgress {
  xp: number;
  level: number;
  levelName: string;
  completedModules: string[];
  totalModules: number;
  pct: number;
}

const TOTAL_MODULES = 18; // approximate total across all 4 phases

const LEVELS = [
  { xp: 0,    name: 'Aprendiz SST',   color: '#94a3b8' },
  { xp: 100,  name: 'Inspector Jr.',  color: '#4ade80' },
  { xp: 300,  name: 'Inspector SST',  color: '#60a5fa' },
  { xp: 600,  name: 'Experto SST',    color: '#fbbf24' },
  { xp: 1000, name: 'Maestro SST',    color: '#c084fc' },
  { xp: 1500, name: 'Capitán SST',    color: '#f87171' },
];

function getLevelInfo(xp: number) {
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { level = i; break; }
  }
  return { level, levelName: LEVELS[level].name, color: LEVELS[level].color };
}

export function useSSTProgress(userId?: string) {
  const key = `sst_progress_${userId ?? 'guest'}`;

  const load = (): { xp: number; completedModules: string[] } => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { xp: 0, completedModules: [] };
      return JSON.parse(raw);
    } catch { return { xp: 0, completedModules: [] }; }
  };

  const [data, setData] = useState(load);

  useEffect(() => { setData(load()); }, [key]);

  const addXP = useCallback((amount: number, moduleId?: string) => {
    setData(prev => {
      const already = moduleId && prev.completedModules.includes(moduleId);
      // First completion gives full XP, revisit gives 10%
      const awarded = already ? Math.round(amount * 0.1) : amount;
      const newXp = prev.xp + awarded;
      const newModules = moduleId && !already
        ? [...prev.completedModules, moduleId]
        : prev.completedModules;
      const next = { xp: newXp, completedModules: newModules };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const progress: SSTProgress = {
    xp: data.xp,
    completedModules: data.completedModules,
    totalModules: TOTAL_MODULES,
    pct: Math.min(100, Math.round((data.completedModules.length / TOTAL_MODULES) * 100)),
    ...getLevelInfo(data.xp),
  };

  return { progress, addXP };
}

export { LEVELS };
