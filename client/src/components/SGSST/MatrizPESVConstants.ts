/**
 * MatrizPESVConstants.ts
 * Constantes y definiciones de tipos para la Matriz PESV (Plan Estratégico de Seguridad Vial)
 * Alineada con la Guía Metodológica ANSV 2022 (Paso 6) & NTC ISO 31000.
 */

export interface MatrixRow {
  id?: string;
  // Ubicación y Cargo
  grupo_trabajo: string; // Clasificación Grupos de trabajo
  cargo: string; // Cargos individuales
  tipo_desplazamiento: 'Misional' | 'In itinere';
  rol_via: string; // Rol en la vía (e.g., Conductor, Peatón, etc.)
  
  // Identificación del Riesgo
  factor_riesgo: 'Factor Humano' | 'Factor Vehicular' | 'Factor Infraestructura' | 'Entorno/Otros';
  peligro_descripcion: string; // Peligros

  // Valoración del Riesgo (ANSV Guía 2022)
  np_cualitativo: 'MUY PROBABLE' | 'MEDIANAMENTE PROBABLE' | 'MEDIANAMENTE' | 'PROBABLE' | 'POCO PROBABLE' | 'NO ES PROBABLE';
  np_cuantitativo: number; // 1 a 5
  ne_cualitativo: 'CONSTANTE' | 'FRECUENTE' | 'OCASIONAL' | 'ESPORADICO' | 'ESPORÁDICO' | 'MINIMA' | 'MÍNIMA';
  ne_cuantitativo: number; // 1 a 5
  nc_cualitativo: 'CRITICO' | 'CRÍTICO' | 'PELIGROSO' | 'MODERADO' | 'MARGINAL' | 'INSIGNIFICANTE';
  nc_cuantitativo: number; // 1 a 5
  
  // Análisis y Calificación
  calificacion: number; // Suma de NP + NE + NC (rango 3 a 15)
  nivel_riesgo?: string; // NIVEL DE RIESGO BAJO, NIVEL DE RIESGO MEDIO o MODERADO, NIVEL DE RIESGO ALTO o CRITICO
  aceptabilidad?: string; // ACEPTABLE, ACEPTABLE CON CONTROL ESPECIFICO, NO ACEPTABLE

  // Controles Existentes (Tratamiento)
  controles_existentes_descripcion?: string; // Interpretación de controles
  controles_existentes_tipo?: string; // Controles (persona, medio, etc.)
  tratamiento_accion?: string; // Acciones (Evitarlo, Aceptarlo, etc.)

  // Plan de Acción
  plan_accion_medio?: string; // Controles - MEDIO
  plan_accion_individuo?: string; // Controles - INDIVIDUO
  responsable: string;
  fecha_programacion?: string; // Fecha programación
  estado?: 'PLANEADA' | 'CERRADA' | 'EN PROCESO' | 'VENCIDA' | '';
  observaciones?: string;
}

export const ACTORES_VIALES = [
  'Conductor de vehículo pesado',
  'Conductor de vehículo liviano',
  'Conductor de motocicleta',
  'Peatón',
  'Pasajero',
  'Ciclista',
  'Otro'
];

export const FACTORES_RIESGO = [
  'Factor Humano',
  'Factor Vehicular',
  'Factor Infraestructura',
  'Entorno/Otros'
];

export const NP_CUALITATIVO_OPCIONES = [
  { value: 5, label: 'MUY PROBABLE', desc: 'El evento vial es altamente probable que ocurra (frecuente o recurrente).' },
  { value: 4, label: 'MEDIANAMENTE PROBABLE', desc: 'El evento vial es moderadamente probable que ocurra.' },
  { value: 3, label: 'PROBABLE', desc: 'El evento vial es probable que ocurra bajo ciertas circunstancias.' },
  { value: 2, label: 'POCO PROBABLE', desc: 'El evento vial es poco factible que ocurra.' },
  { value: 1, label: 'NO ES PROBABLE', desc: 'El evento vial es extremadamente improbable que ocurra.' }
];

export const NE_CUALITATIVO_OPCIONES = [
  { value: 5, label: 'CONSTANTE', desc: 'Exposición diaria o continua durante la jornada.' },
  { value: 4, label: 'FRECUENTE', desc: 'Exposición regular varias veces a la semana.' },
  { value: 3, label: 'OCASIONAL', desc: 'Exposición esporádica o algunas veces en las operaciones.' },
  { value: 2, label: 'ESPORADICO', desc: 'Exposición muy baja o eventual.' },
  { value: 1, label: 'MINIMA', desc: 'Exposición mínima o casi inexistente.' }
];

export const NC_CUALITATIVO_OPCIONES = [
  { value: 5, label: 'CRITICO', desc: 'Fatalidades o incapacidades totales permanentes.' },
  { value: 4, label: 'PELIGROSO', desc: 'Lesiones muy graves con incapacidades permanentes parciales.' },
  { value: 3, label: 'MODERADO', desc: 'Lesiones con incapacidades temporales significativas.' },
  { value: 2, label: 'MARGINAL', desc: 'Lesiones menores con incapacidades breves.' },
  { value: 1, label: 'INSIGNIFICANTE', desc: 'Lesiones muy leves sin incapacidad o daños menores.' }
];

export const ESTADO_OPCIONES = ['PLANEADA', 'CERRADA', 'EN PROCESO', 'VENCIDA', ''];

export const TRATAMIENTO_ACCION_OPCIONES = [
  'ACEPTARLO',
  'EVITARLO',
  'ELIMINAR LA FUENTE QUE OCACIONA',
  'MODIFICAR LOS FACTORES DE EXPOSICION',
  'Ninguno'
];

export const CONTROLES_TIPO_OPCIONES = [
  'INDIVIDUO',
  'MEDIO',
  'MEDIO-INDIVIDUO',
  'VEHICULO',
  'INFRAESTRUCTURA',
  'Persona',
  'Vehículo',
  'Vía / Entorno',
  'Ninguno'
];

// Helper functions for conversions
export const mapNPCualitativoToNum = (lbl: string): number => {
  const normalized = (lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('MUY PROBABLE')) return 5;
  if (normalized.includes('MEDIANAMENTE') || normalized.includes('MEDIA')) return 4;
  if (normalized.includes('POCO PROBABLE')) return 2;
  if (normalized.includes('NO ES PROBABLE') || normalized.includes('NO PROBABLE')) return 1;
  if (normalized.includes('PROBABLE')) return 3;
  return 3; // default
};

export const mapNECualitativoToNum = (lbl: string): number => {
  const normalized = (lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('CONSTANTE')) return 5;
  if (normalized.includes('FRECUENTE')) return 4;
  if (normalized.includes('OCASIONAL')) return 3;
  if (normalized.includes('ESPORADICO')) return 2;
  if (normalized.includes('MINIMA')) return 1;
  return 3; // default
};

export const mapNCCualitativoToNum = (lbl: string): number => {
  const normalized = (lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('CRITICO')) return 5;
  if (normalized.includes('PELIGROSO')) return 4;
  if (normalized.includes('MODERADO')) return 3;
  if (normalized.includes('MARGINAL')) return 2;
  if (normalized.includes('INSIGNIFICANTE')) return 1;
  return 3; // default
};

export const getNPCualitativoLabel = (val: number): string => {
  const found = NP_CUALITATIVO_OPCIONES.find(o => o.value === val);
  return found ? found.label : 'PROBABLE';
};

export const getNECualitativoLabel = (val: number): string => {
  const found = NE_CUALITATIVO_OPCIONES.find(o => o.value === val);
  return found ? found.label : 'OCASIONAL';
};

export const getNCCualitativoLabel = (val: number): string => {
  const found = NC_CUALITATIVO_OPCIONES.find(o => o.value === val);
  return found ? found.label : 'MODERADO';
};

export const getInterpretacionPESV = (calificacion: number): { nivel: string; aceptabilidad: string } => {
  if (calificacion >= 12) {
    return {
      nivel: 'NIVEL DE RIESGO ALTO o CRITICO',
      aceptabilidad: 'NO ACEPTABLE'
    };
  }
  if (calificacion >= 8) {
    return {
      nivel: 'NIVEL DE RIESGO MEDIO o MODERADO',
      aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO'
    };
  }
  return {
    nivel: 'NIVEL DE RIESGO BAJO',
    aceptabilidad: 'ACEPTABLE'
  };
};
