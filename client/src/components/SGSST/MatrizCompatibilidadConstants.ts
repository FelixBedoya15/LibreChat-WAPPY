export interface MatrixRow {
  id?: string;
  nombre: string;
  fabricante: string;
  estado_fisico: 'Líquido' | 'Sólido' | 'Gas';
  clasificacion_onu: string;
  pictogramas_sga: string[];
  cantidad_almacenada: string;
  ubicacion: string;
  tiene_fds: 'Sí' | 'No';
  tiene_rotulo: 'Sí' | 'No';
  incompatibilidades: string;
  requisitos_almacenamiento: string;
}

export const CLASES_ONU = [
  "Clase 1: Explosivos",
  "Clase 2.1: Gases Inflamables",
  "Clase 2.2: Gases No Inflamables ni Tóxicos",
  "Clase 2.3: Gases Tóxicos",
  "Clase 3: Líquidos Inflamables",
  "Clase 4.1: Sólidos Inflamables",
  "Clase 4.2: Sustancias de Combustión Espontánea",
  "Clase 4.3: Desprenden gases inflamables con agua",
  "Clase 5.1: Sustancias Comburentes",
  "Clase 5.2: Peróxidos Orgánicos",
  "Clase 6.1: Sustancias Tóxicas",
  "Clase 7: Materiales Radiactivos",
  "Clase 8: Sustancias Corrosivas",
  "Clase 9: Sustancias y Objetos Peligrosos Varios",
  "No Peligroso"
];

export const ESTADO_OPCIONES = ['Líquido', 'Sólido', 'Gas'];

export const SGA_PICTOGRAMS = [
  { key: 'inflamable', name: 'Inflamable', icon: '🔥' },
  { key: 'corrosivo', name: 'Corrosivo', icon: '🧪' },
  { key: 'calavera', name: 'Toxicidad Aguda', icon: '💀' },
  { key: 'peligro_salud', name: 'Peligro Grave para la Salud', icon: '👤' },
  { key: 'signo_exclamacion', name: 'Irritante / Dañino', icon: '⚠️' },
  { key: 'medio_ambiente', name: 'Peligro Ambiental', icon: '🐟' },
  { key: 'comburente', name: 'Comburente', icon: '⭕' },
  { key: 'explosivo', name: 'Explosivo', icon: '💥' },
  { key: 'gas_comprimido', name: 'Gas bajo Presión', icon: '💨' }
];

export interface CompatibilityResult {
  status: 'compatible' | 'caution' | 'incompatible';
  reason: string;
  recommendation: string;
}

export function getChemicalCompatibility(classA: string, classB: string): CompatibilityResult {
  if (!classA || !classB || classA === 'No Peligroso' || classB === 'No Peligroso') {
    return {
      status: 'compatible',
      reason: 'Sustancias no clasificadas como peligrosas bajo el SGA.',
      recommendation: 'Pueden almacenarse juntas. Seguir las recomendaciones generales de orden, limpieza e higiene.'
    };
  }

  const cA = classA.split(':')[0].trim();
  const cB = classB.split(':')[0].trim();

  // Mismos grupos
  if (cA === cB) {
    if (cA === 'Clase 1') {
      return {
        status: 'incompatible',
        reason: 'Explosivos de la misma clase pero potencialmente de diferentes grupos de compatibilidad.',
        recommendation: 'Se requiere segregación física. Solo pueden almacenarse juntos bajo análisis y autorización de expertos.'
      };
    }
    if (cA === 'Clase 7') {
      return {
        status: 'incompatible',
        reason: 'Materiales Radiactivos.',
        recommendation: 'Almacenar en celdas de blindaje específicas separadas de cualquier otro material.'
      };
    }
    if (cA === 'Clase 8') {
      return {
        status: 'caution',
        reason: 'Sustancias corrosivas de naturaleza ácida y alcalina (bases).',
        recommendation: 'Verificar incompatibilidades específicas en FDS. Evitar almacenamiento conjunto de ácidos y bases (pueden neutralizarse violentamente). Utilizar cubetos o diques de contención independientes.'
      };
    }
    return {
      status: 'compatible',
      reason: 'Pertenecen a la misma clase de peligro de la ONU.',
      recommendation: 'Pueden almacenarse juntos de forma segura. Respetar diques de contención en líquidos.'
    };
  }

  // Clase 1 Explosivos y Clase 7 Radiactivos incompatibles con todo
  if (cA === 'Clase 1' || cB === 'Clase 1') {
    return {
      status: 'incompatible',
      reason: 'Sustancias Explosivas (Clase 1) presentan alto riesgo de detonación simpática.',
      recommendation: 'Segregación física absoluta. Almacenar en polvorines autorizados alejados de cualquier otra sustancia.'
    };
  }
  if (cA === 'Clase 7' || cB === 'Clase 7') {
    return {
      status: 'incompatible',
      reason: 'Materiales Radiactivos (Clase 7) emiten radiación ionizante.',
      recommendation: 'Segregación física absoluta. Almacenar en áreas restringidas con blindaje técnico de plomo o concreto.'
    };
  }

  // Clase 3 (Líquidos Inflamables) vs Clase 5 (Comburentes / Peróxidos)
  if ((cA === 'Clase 3' && (cB === 'Clase 5.1' || cB === 'Clase 5.2')) ||
      (cB === 'Clase 3' && (cA === 'Clase 5.1' || cA === 'Clase 5.2'))) {
    return {
      status: 'incompatible',
      reason: 'La combinación de un combustible (Líquido Inflamable) y un comburente (Oxidante) causa incendios de alta intensidad y explosiones aceleradas.',
      recommendation: 'Segregación total. Separar por muros corta-fuego de 2 horas o almacenar en gabinetes ignífugos separados por una distancia mínima de 5 metros.'
    };
  }

  // Clase 3 (Líquidos Inflamables) vs Clase 8 (Corrosivos)
  if ((cA === 'Clase 3' && cB === 'Clase 8') || (cB === 'Clase 3' && cA === 'Clase 8')) {
    return {
      status: 'incompatible',
      reason: 'El contacto de vapores inflamables con sustancias corrosivas ácidas/básicas puede generar reacciones fuertemente exotérmicas y corrosión de contenedores metálicos con derrame secundario.',
      recommendation: 'Segregación técnica. Mantener alejados. Almacenar corrosivos en cubetos específicos y líquidos inflamables en gabinetes certificados de seguridad.'
    };
  }

  // Clase 5.1 (Comburentes) vs Clase 8 (Corrosivos)
  if ((cA === 'Clase 5.1' && cB === 'Clase 8') || (cB === 'Clase 5.1' && cA === 'Clase 8')) {
    return {
      status: 'incompatible',
      reason: 'Las sustancias comburentes reaccionan de manera inestable y violenta con ácidos corrosivos.',
      recommendation: 'Segregación. Almacenar de forma independiente con contención de derrames separada.'
    };
  }

  // Clase 4.3 (Reaccionan con agua) vs Líquidos o Corrosivos
  if (cA === 'Clase 4.3' || cB === 'Clase 4.3') {
    if (cA === 'Clase 3' || cB === 'Clase 3' || cA === 'Clase 8' || cB === 'Clase 8') {
      return {
        status: 'incompatible',
        reason: 'Sustancias que desprenden gases inflamables en contacto con humedad o agua (Clase 4.3) reaccionan exotérmicamente liberando hidrógeno gaseoso altamente explosivo.',
        recommendation: 'Segregación total. Mantener en áreas herméticamente cerradas libres de humedad y alejadas de líquidos inflamables y corrosivos.'
      };
    }
  }

  // Clase 2.1 (Gases Inflamables) vs Clase 5.1 (Comburentes)
  if ((cA === 'Clase 2.1' && cB === 'Clase 5.1') || (cB === 'Clase 2.1' && cA === 'Clase 5.1')) {
    return {
      status: 'incompatible',
      reason: 'Riesgo de ignición súbita y combustión violenta de gases.',
      recommendation: 'Segregación de cilindros. Almacenar a una distancia mínima de 6 metros o usar un muro divisorio cortafuegos no combustible de al menos 1.5 metros de alto.'
    };
  }

  // Clase 6.1 (Tóxicos) o Clase 9 (Misceláneos)
  const toxicOrMisc = (c: string) => ['Clase 6.1', 'Clase 9', 'Clase 2.2', 'Clase 2.3'].includes(c);
  if (toxicOrMisc(cA) || toxicOrMisc(cB)) {
    return {
      status: 'caution',
      reason: 'El almacenamiento conjunto requiere precaución para evitar la contaminación cruzada o propagación de humos tóxicos en caso de incendios.',
      recommendation: 'Revisar las fichas FDS correspondientes. Almacenar por separado en estanterías separadas o usar diques y cubetos para evitar mezclas en caso de goteo.'
    };
  }

  return {
    status: 'caution',
    reason: 'Clases con incompatibilidades potenciales moderadas.',
    recommendation: 'Verificar compatibilidad específica en la Sección 10 de la Ficha de Datos de Seguridad (FDS). Mantener separación física preventiva.'
  };
}
