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
  numero_onu?: string;
  cas?: string;
  palabra_advertencia?: 'PELIGRO' | 'ATENCIÓN' | string;
  frases_h?: string;
  consejos_p?: string;
  epp_recomendado?: string;
  primeros_auxilios?: string;
  control_derrames?: string;
  pubchem_cid?: number | string;
}

export type ChemicalProductRow = MatrixRow;

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

export interface SgaPictogramMeta {
  key: string;
  name: string;
  ghsCode: string;
  svgUrl: string;
  signalWord: 'PELIGRO' | 'ATENCIÓN';
  icon: string;
  defaultH: string;
  defaultP: string;
}

export const SGA_PICTOGRAMS: SgaPictogramMeta[] = [
  {
    key: 'inflamable',
    name: 'Inflamable',
    ghsCode: 'GHS02',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS02.svg',
    signalWord: 'PELIGRO',
    icon: '🔥',
    defaultH: 'H225: Líquido y vapores muy inflamables.',
    defaultP: 'P210: Mantener alejado del calor, chispas, llamas abiertas y superficies calientes. No fumar.'
  },
  {
    key: 'corrosivo',
    name: 'Corrosivo',
    ghsCode: 'GHS05',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS05.svg',
    signalWord: 'PELIGRO',
    icon: '🧪',
    defaultH: 'H314: Provoca quemaduras graves en la piel y lesiones oculares graves.',
    defaultP: 'P280: Usar guantes, ropa de protección y equipo de protección para los ojos y la cara.'
  },
  {
    key: 'calavera',
    name: 'Toxicidad Aguda',
    ghsCode: 'GHS06',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS06.svg',
    signalWord: 'PELIGRO',
    icon: '💀',
    defaultH: 'H301/H311/H331: Tóxico en caso de ingestión, contacto con la piel o inhalación.',
    defaultP: 'P260: No respirar los vapores o aerosoles. P301+P310: En caso de ingestión, llamar inmediatamente a un centro de toxicología.'
  },
  {
    key: 'peligro_salud',
    name: 'Peligro Grave para la Salud',
    ghsCode: 'GHS08',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS08.svg',
    signalWord: 'PELIGRO',
    icon: '👤',
    defaultH: 'H350/H372: Puede provocar cáncer o daños en los órganos tras exposiciones prolongadas o repetidas.',
    defaultP: 'P201: Procurarse las instrucciones antes del uso. P280: Usar equipo de protección personal obligatorio.'
  },
  {
    key: 'signo_exclamacion',
    name: 'Irritante / Dañino',
    ghsCode: 'GHS07',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS07.svg',
    signalWord: 'ATENCIÓN',
    icon: '⚠️',
    defaultH: 'H315/H319/H335: Provoca irritación cutánea, irritación ocular grave o puede irritar las vías respiratorias.',
    defaultP: 'P264: Lavarse cuidadosamente tras la manipulación. P271: Utilizar únicamente en exteriores o en un lugar bien ventilado.'
  },
  {
    key: 'medio_ambiente',
    name: 'Peligro Ambiental',
    ghsCode: 'GHS09',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS09.svg',
    signalWord: 'ATENCIÓN',
    icon: '🐟',
    defaultH: 'H400/H410: Muy tóxico para los organismos acuáticos, con efectos nocivos duraderos.',
    defaultP: 'P273: No dispersar en el medio ambiente. P391: Recoger los vertidos.'
  },
  {
    key: 'comburente',
    name: 'Comburente',
    ghsCode: 'GHS03',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS03.svg',
    signalWord: 'PELIGRO',
    icon: '⭕',
    defaultH: 'H272: Puede agravar un incendio; comburente.',
    defaultP: 'P220: Mantener alejado de la ropa y otros materiales combustibles.'
  },
  {
    key: 'explosivo',
    name: 'Explosivo',
    ghsCode: 'GHS01',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS01.svg',
    signalWord: 'PELIGRO',
    icon: '💥',
    defaultH: 'H201: Explosivo; peligro de explosión en masa.',
    defaultP: 'P210: Mantener alejado de fuentes de ignición, chispas y fricción. P240: Toma de tierra y enlace equipotencial.'
  },
  {
    key: 'gas_comprimido',
    name: 'Gas bajo Presión',
    ghsCode: 'GHS04',
    svgUrl: 'https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS04.svg',
    signalWord: 'ATENCIÓN',
    icon: '💨',
    defaultH: 'H280: Contiene gas a presión; puede explotar si se calienta.',
    defaultP: 'P410+P403: Proteger de la luz solar. Almacenar en un lugar bien ventilado.'
  }
];

export function findSgaPictogram(keyOrName: string): SgaPictogramMeta | undefined {
  if (!keyOrName) return undefined;
  const clean = keyOrName.trim().toLowerCase();
  return SGA_PICTOGRAMS.find(
    (p) =>
      p.key.toLowerCase() === clean ||
      p.name.toLowerCase() === clean ||
      p.ghsCode.toLowerCase() === clean ||
      (clean.includes('tóxic') && p.key === 'calavera') ||
      (clean.includes('toxic') && p.key === 'calavera') ||
      (clean.includes('ambient') && p.key === 'medio_ambiente') ||
      (clean.includes('salud') && p.key === 'peligro_salud') ||
      (clean.includes('cancer') && p.key === 'peligro_salud') ||
      (clean.includes('mutag') && p.key === 'peligro_salud') ||
      (clean.includes('irrit') && p.key === 'signo_exclamacion') ||
      (clean.includes('gas') && p.key === 'gas_comprimido')
  );
}

export interface CompatibilityResult {
  status: 'compatible' | 'caution' | 'incompatible';
  reason: string;
  recommendation: string;
}

export function getChemicalCompatibility(
  classA: string,
  classB: string,
  nameA?: string,
  nameB?: string,
  incompA?: string,
  incompB?: string,
): CompatibilityResult {
  if (!classA || !classB || classA === 'No Peligroso' || classB === 'No Peligroso') {
    return {
      status: 'compatible',
      reason: 'Sustancias no clasificadas como peligrosas bajo el SGA.',
      recommendation: 'Pueden almacenarse juntas. Seguir las recomendaciones generales de orden, limpieza e higiene.'
    };
  }

  const cA = String(classA || '').split(':')[0].trim();
  const cB = String(classB || '').split(':')[0].trim();
  const nA = String(nameA || '').trim();
  const nB = String(nameB || '').trim();
  const incA = String(incompA || '').trim();
  const incB = String(incompB || '').trim();

  // Verificación crítica Ácido vs Base / Alcalino / Hipoclorito / Amoníaco (especialmente en Clase 8)
  const acidRegex = /(\b[aá]cido\b|muri[aá]tico|clorh[ií]drico|sulf[uú]rico|n[ií]trico|fosf[oó]rico|ac[eé]tico|f[oó]rmico)/i;
  const baseRegex = /(hipoclorito|cloro|blanqueador|l[ií]mpido|hidr[oó]xido|soda|c[aá]ustica|potasa|amon[ií]aco|alcalin|\bbase\b)/i;

  if (cA === 'Clase 8' || cB === 'Clase 8' || (nA && nB)) {
    const aIsAcid = acidRegex.test(nA);
    const bIsAcid = acidRegex.test(nB);
    const aIsBase = baseRegex.test(nA);
    const bIsBase = baseRegex.test(nB);

    if ((aIsAcid && bIsBase) || (aIsBase && bIsAcid)) {
      return {
        status: 'incompatible',
        reason:
          'PELIGRO CRÍTICO ÁCIDO vs BASE / HIPOCLORITO: La mezcla de ácidos (ej. ácido clorhídrico/muriático) con hipocloritos o bases fuertes (ej. soda cáustica) genera liberación inmediata de gas cloro (Cl₂) letal y/o reacción exotérmica violenta con proyecciones corrosivas.',
        recommendation:
          'SEGREGACIÓN FÍSICA ESTRICTA (NTC 3966): Prohibido almacenar en el mismo gabinete o compartir cubeto/dique de contención. Mantener separación mínima de 3 metros en compartimentos anticorrosivos independientes.',
      };
    }

    // Si en las incompatibilidades declaradas de A se menciona explícitamente el producto B (y son productos distintos)
    if (nA && nB && nA.toLowerCase() !== nB.toLowerCase()) {
      if (
        (aIsAcid && /([aá]cido)/i.test(incB)) ||
        (bIsAcid && /([aá]cido)/i.test(incA)) ||
        (aIsBase && /(hipoclorito|base|hidr[oó]xido|soda|alcalin)/i.test(incB)) ||
        (bIsBase && /(hipoclorito|base|hidr[oó]xido|soda|alcalin)/i.test(incA))
      ) {
        return {
          status: 'incompatible',
          reason:
            'PELIGRO CRÍTICO ÁCIDO vs BASE / HIPOCLORITO: La mezcla de ácidos (ej. ácido clorhídrico/muriático) con hipocloritos o bases fuertes (ej. soda cáustica) genera liberación inmediata de gas cloro (Cl₂) letal y/o reacción exotérmica violenta con proyecciones corrosivas.',
          recommendation:
            'SEGREGACIÓN FÍSICA ESTRICTA (NTC 3966): Prohibido almacenar en el mismo gabinete o compartir cubeto/dique de contención. Mantener separación mínima de 3 metros en compartimentos anticorrosivos independientes.',
        };
      }
    }
  }

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

  const isOxidizer = (c: string) => c === 'Clase 5.1' || c === 'Clase 5.2';
  const isFlammableSolid = (c: string) => c === 'Clase 4.1' || c === 'Clase 4.2' || c === 'Clase 4.3';

  // Clase 5.1 / 5.2 (Comburentes / Peróxidos) vs Clase 3, Clase 6.1, Clase 4.1/4.2/4.3, Clase 2.1 o Clase 8
  if (
    (isOxidizer(cA) && (cB === 'Clase 3' || cB === 'Clase 6.1' || isFlammableSolid(cB) || cB === 'Clase 2.1' || cB === 'Clase 8')) ||
    (isOxidizer(cB) && (cA === 'Clase 3' || cA === 'Clase 6.1' || isFlammableSolid(cA) || cA === 'Clase 2.1' || cA === 'Clase 8'))
  ) {
    return {
      status: 'incompatible',
      reason: 'La combinación de comburentes o peróxidos orgánicos (Clase 5.1/5.2) con inflamables, gases, sólidos reactivos, tóxicos o corrosivos desencadena incendios violentos, deflagración o reacciones exotérmicas severas.',
      recommendation: 'Segregación física obligatoria (NTC 3966). Separar por muros cortafuego o almacenar en gabinetes certificados independientes con distancia mínima de 3 a 5 metros.'
    };
  }

  // Clase 2.1 (Gases Inflamables) vs Clase 2.3 (Gases Tóxicos), Clase 3 (Líquidos Inflamables) o Clase 8 (Corrosivos)
  if (
    (cA === 'Clase 2.1' && (cB === 'Clase 2.3' || cB === 'Clase 3' || cB === 'Clase 8')) ||
    (cB === 'Clase 2.1' && (cA === 'Clase 2.3' || cA === 'Clase 3' || cA === 'Clase 8'))
  ) {
    return {
      status: 'incompatible',
      reason: 'Gases inflamables bajo presión (Clase 2.1) presentan riesgo crítico de BLEVE, explosión y dispersión de nubes tóxicas o corrosivas ante fugas o incendios.',
      recommendation: 'Segregación de cilindros (NTC 3966). Almacenar a una distancia mínima de 5 a 6 metros o con muro divisorio cortafuegos alejado de líquidos inflamables, corrosivos y gases tóxicos.'
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
