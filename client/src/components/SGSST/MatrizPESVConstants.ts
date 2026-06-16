/**
 * MatrizPESVConstants.ts
 * Constantes y definiciones de tipos para la Matriz PESV (Plan Estratégico de Seguridad Vial)
 */

export interface MatrixRow {
  id?: string;
  proceso: string;
  zona: string;
  actor_vial: string;
  tipo_desplazamiento: 'Misional' | 'In itinere';
  factor_riesgo: 'Factor Humano' | 'Factor Vehicular' | 'Factor Infraestructura' | 'Entorno/Otros';
  peligro_descripcion: string;
  consecuencias: string;
  controles_existentes_persona: string;
  controles_existentes_vehiculo: string;
  controles_existentes_via: string;
  probabilidad: number;
  severidad: number;
  nivel_riesgo?: number;
  interpretacion_nr?: string;
  aceptabilidad?: string;
  medida_eliminacion: string;
  medida_sustitucion: string;
  medida_ingenieria: string;
  medida_administrativa: string;
  medida_eppu: string;
  factores_reduccion?: string;
  responsable: string;
}

export const ACTORES_VIALES = [
  'Peatón',
  'Pasajero',
  'Conductor de motocicleta',
  'Conductor de vehículo liviano',
  'Conductor de vehículo pesado',
  'Ciclista',
  'Otro'
];

export const FACTORES_RIESGO = [
  'Factor Humano',
  'Factor Vehicular',
  'Factor Infraestructura',
  'Entorno/Otros'
];

export const PROBABILIDAD_ESCALA = [
  { value: 4, label: '4 - Frecuente', desc: 'El evento vial ocurre con alta frecuencia o continua exposición.' },
  { value: 3, label: '3 - Ocasional', desc: 'El evento vial ocurre algunas veces en las operaciones.' },
  { value: 2, label: '2 - Remota', desc: 'El evento vial es poco probable pero factible.' },
  { value: 1, label: '1 - Improbable', desc: 'El evento vial prácticamente no ocurre.' }
];

export const SEVERIDAD_ESCALA = [
  { value: 100, label: '100 - Mortal/Catastrófico', desc: 'Muertes o incapacidades totales permanentes.' },
  { value: 60, label: '60 - Muy Grave', desc: 'Lesiones graves con incapacidades permanentes parciales.' },
  { value: 25, label: '25 - Grave', desc: 'Lesiones temporales con incapacidad médica temporal.' },
  { value: 10, label: '10 - Leve', desc: 'Lesiones menores o raspones que no generan incapacidad.' }
];
