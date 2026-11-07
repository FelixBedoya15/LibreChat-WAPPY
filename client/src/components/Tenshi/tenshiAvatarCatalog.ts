export interface LensPosition {
  left: string;
  top: string;
  width: string;
  height: string;
  borderRadius?: string;
}

export interface TenshiAvatarPreset {
  id: string;
  name: string;
  animal: string;
  badge: string;
  collection: 'custom' | 'classic';
  src: string;
  accentColor: string;
  defaultPersonaName: string;
  defaultGender: 'masculino' | 'femenino' | 'neutro';
  defaultVoice: string;
  defaultPersonality: string;
  leftLens: LensPosition;
  rightLens: LensPosition;
}

export interface TenshiVoiceOption {
  id: string;
  name: string;
  gender: 'femenino' | 'masculino';
  genderLabel: string;
  tone: string;
  description: string;
}

export interface PersonalityArchetype {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
}

export const TENSHI_AVATAR_PRESETS: TenshiAvatarPreset[] = [
  {
    id: 'gato',
    name: 'Tenshi Gato (Original HD)',
    animal: 'Gato',
    badge: 'Orquestador Clásico',
    collection: 'custom',
    src: '/assets/tenshi.png',
    accentColor: '#10B981',
    defaultPersonaName: 'Tenshi',
    defaultGender: 'masculino',
    defaultVoice: 'Puck',
    defaultPersonality: 'Amigable, proactivo, experto en SG-SST y cercano con el usuario.',
    leftLens: { left: '31.1%', top: '35.2%', width: '25.5%', height: '15.2%' },
    rightLens: { left: '68.7%', top: '35.2%', width: '25.5%', height: '15.2%' },
  },
  {
    id: 'suricato',
    name: 'Suricato Ingeniero SST',
    animal: 'Suricato',
    badge: 'Centinela de Campo',
    collection: 'custom',
    src: '/assets/tenshi_suricato.png',
    accentColor: '#0D9488',
    defaultPersonaName: 'Suri',
    defaultGender: 'masculino',
    defaultVoice: 'Orus',
    defaultPersonality:
      'Ingeniero preventor alerta, detallista en inspecciones de campo, práctico y enfocado en controlar riesgos SST.',
    leftLens: {
      left: '30.9%',
      top: '31.5%',
      width: '29.0%',
      height: '15.5%',
      borderRadius: '38% 38% 48% 48%',
    },
    rightLens: {
      left: '68.9%',
      top: '31.5%',
      width: '29.0%',
      height: '15.5%',
      borderRadius: '38% 38% 48% 48%',
    },
  },
  {
    id: 'perro',
    name: 'Perro Techwear WAPPY',
    animal: 'Perro',
    badge: 'Guardián Urbano',
    collection: 'custom',
    src: '/assets/tenshi_perro.png',
    accentColor: '#C7F303',
    defaultPersonaName: 'Max',
    defaultGender: 'masculino',
    defaultVoice: 'Fenrir',
    defaultPersonality:
      'Leal, entusiasta, motivador y dinámico. Explica las normas SST con energía positiva y lenguaje claro.',
    leftLens: {
      left: '29.2%',
      top: '31.0%',
      width: '31.0%',
      height: '21.0%',
      borderRadius: '28%',
    },
    rightLens: {
      left: '70.8%',
      top: '31.0%',
      width: '31.0%',
      height: '21.0%',
      borderRadius: '28%',
    },
  },
  {
    id: 'paloma',
    name: 'Paloma Ejecutiva',
    animal: 'Paloma',
    badge: 'Preventora Ejecutiva',
    collection: 'custom',
    src: '/assets/tenshi_paloma.png',
    accentColor: '#6366F1',
    defaultPersonaName: 'Paz',
    defaultGender: 'femenino',
    defaultVoice: 'Aoede',
    defaultPersonality:
      'Ejecutiva, diplomática, estructurada y serena. Especialista en comunicación asertiva, comités y alta dirección.',
    leftLens: {
      left: '29.0%',
      top: '35.5%',
      width: '27.0%',
      height: '19.5%',
      borderRadius: '42%',
    },
    rightLens: {
      left: '71.0%',
      top: '35.5%',
      width: '27.0%',
      height: '19.5%',
      borderRadius: '42%',
    },
  },
  {
    id: 'capibara',
    name: 'Capibara Bienestar',
    animal: 'Capibara',
    badge: 'Especialista Psicosocial',
    collection: 'custom',
    src: '/assets/tenshi_capibara.png',
    accentColor: '#EA580C',
    defaultPersonaName: 'Capi',
    defaultGender: 'masculino',
    defaultVoice: 'Charon',
    defaultPersonality:
      'Sereno, empático, paciente y cálido. Transmite calma ante auditorías o emergencias y cuida el bienestar psicosocial.',
    leftLens: { left: '26.5%', top: '28.4%', width: '28.0%', height: '15.8%' },
    rightLens: { left: '73.5%', top: '28.4%', width: '28.0%', height: '15.8%' },
  },
  {
    id: 'suricato_clasico',
    name: 'Suricato Clásico',
    animal: 'Suricato',
    badge: 'Uniforme Clásico',
    collection: 'classic',
    src: '/assets/tenshi_suricato_clasico.png',
    accentColor: '#10B981',
    defaultPersonaName: 'Suri',
    defaultGender: 'masculino',
    defaultVoice: 'Orus',
    defaultPersonality: 'Centinela atento y servicial del SG-SST.',
    leftLens: { left: '30.2%', top: '28.0%', width: '26.5%', height: '15.2%' },
    rightLens: { left: '69.8%', top: '28.0%', width: '26.5%', height: '15.2%' },
  },
  {
    id: 'perro_clasico',
    name: 'Perro Clásico',
    animal: 'Perro',
    badge: 'Uniforme Clásico',
    collection: 'classic',
    src: '/assets/tenshi_perro_clasico.png',
    accentColor: '#10B981',
    defaultPersonaName: 'Max',
    defaultGender: 'masculino',
    defaultVoice: 'Fenrir',
    defaultPersonality: 'Compañero leal y entusiasta para la gestión SST.',
    leftLens: { left: '28.5%', top: '28.5%', width: '27.5%', height: '16.5%' },
    rightLens: { left: '69.5%', top: '28.5%', width: '27.5%', height: '16.5%' },
  },
  {
    id: 'paloma_clasico',
    name: 'Paloma Clásica',
    animal: 'Paloma',
    badge: 'Uniforme Clásico',
    collection: 'classic',
    src: '/assets/tenshi_paloma_clasico.png',
    accentColor: '#10B981',
    defaultPersonaName: 'Paz',
    defaultGender: 'femenino',
    defaultVoice: 'Aoede',
    defaultPersonality: 'Mensajera ágil y cordial de prevención.',
    leftLens: { left: '28.5%', top: '35.7%', width: '28.5%', height: '14.5%' },
    rightLens: { left: '71.5%', top: '35.7%', width: '28.5%', height: '14.5%' },
  },
  {
    id: 'capibara_clasico',
    name: 'Capibara Clásico',
    animal: 'Capibara',
    badge: 'Uniforme Clásico',
    collection: 'classic',
    src: '/assets/tenshi_capibara_clasico.png',
    accentColor: '#10B981',
    defaultPersonaName: 'Capi',
    defaultGender: 'masculino',
    defaultVoice: 'Kore',
    defaultPersonality: 'Asistente tranquilo, paciente y resolutivo.',
    leftLens: { left: '27.5%', top: '28.6%', width: '29.5%', height: '16.8%' },
    rightLens: { left: '72.5%', top: '28.6%', width: '29.5%', height: '16.8%' },
  },
];

export const TENSHI_VOICES: TenshiVoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Dinámica y Juvenil',
    description: 'Voz original de Tenshi: ágil, cercana y enérgica.',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Técnica y Firme',
    description: 'Ideal para ingeniería de campo, auditorías e instrucciones operativas.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Profunda y Motivadora',
    description: 'Tono con gran presencia, entusiasmo y seguridad.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Serena y Pausada',
    description: 'Transmite calma absoluta, empatía y confianza.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Ejecutiva y Clara',
    description: 'Fluida, profesional y cálida; ideal para presentaciones y alta dirección.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Serena y Empática',
    description: 'Suave, paciente y equilibrada para acompañamiento diario.',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Amable y Didáctica',
    description: 'Excelente para capacitaciones, inducción y explicación normativa.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Fresca y Ágil',
    description: 'Moderna, rápida y expresiva para asistencia ejecutiva.',
  },
];

export const PERSONALITY_ARCHETYPES: PersonalityArchetype[] = [
  {
    id: 'amigable',
    label: 'Amigable y Cercano',
    emoji: '😊',
    prompt:
      'Sé muy cercano, cálido y motivador. Explica cada gestión de SG-SST de forma sencilla, amena y proactiva.',
  },
  {
    id: 'ejecutivo',
    label: 'Ejecutivo Express',
    emoji: '⚡',
    prompt:
      'Háblame de forma ejecutiva y directa al grano. Respuestas concisas de 1 a 2 frases enfocadas en toma de decisiones rápidas.',
  },
  {
    id: 'ingeniero',
    label: 'Ingeniero de Campo SST',
    emoji: '🦺',
    prompt:
      'Actúa como un ingeniero preventor de campo experto en inspecciones, controles operativos, alturas, EPP y prevención práctica.',
  },
  {
    id: 'auditor',
    label: 'Auditor Normativo',
    emoji: '⚖️',
    prompt:
      'Mantén un enfoque técnico y riguroso citando Decreto 1072 de 2015, Resolución 0312 de 2019 y GTC 45 en tus recomendaciones.',
  },
  {
    id: 'bienestar',
    label: 'Bienestar y Empatía',
    emoji: '🌿',
    prompt:
      'Prioriza la calma, la escucha activa, el bienestar psicosocial (Res. 2764) y un trato sereno y empático ante cualquier situación.',
  },
];

export function getAvatarPresetById(id?: string | null): TenshiAvatarPreset {
  if (!id) return TENSHI_AVATAR_PRESETS[0];
  const normalized = String(id).trim().toLowerCase();
  return (
    TENSHI_AVATAR_PRESETS.find((p) => p.id === normalized) || TENSHI_AVATAR_PRESETS[0]
  );
}
