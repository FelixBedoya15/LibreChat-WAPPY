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

export interface RegionalVocabOption {
  id: string;
  label: string;
  region: string;
  emoji: string;
  prompt: string;
}

export const TENSHI_AVATAR_PRESETS: TenshiAvatarPreset[] = [
  {
    id: 'gato',
    name: 'Tenshi',
    animal: 'Gato',
    badge: 'Tenshi',
    collection: 'custom',
    src: '/assets/tenshi.png?v=orig20261109',
    accentColor: '#10B981',
    defaultPersonaName: 'Tenshi',
    defaultGender: 'masculino',
    defaultVoice: 'Puck',
    defaultPersonality:
      'Amigable, carismático, servicial y siempre con buena energía para ayudarte.',
    leftLens: { left: '30.7%', top: '31.8%', width: '25.6%', height: '15.4%' },
    rightLens: { left: '68.4%', top: '31.7%', width: '25.6%', height: '15.2%' },
  },
  {
    id: 'suricato',
    name: 'Suri',
    animal: 'Suricato',
    badge: 'Suri',
    collection: 'custom',
    src: '/assets/tenshi_suricato.png?v=uhd4',
    accentColor: '#0D9488',
    defaultPersonaName: 'Suri',
    defaultGender: 'masculino',
    defaultVoice: 'Orus',
    defaultPersonality:
      'Ágil, curioso, chispeante y súper atento a cada detalle con actitud entusiasta.',
    leftLens: {
      left: '31.4%',
      top: '32.3%',
      width: '28.5%',
      height: '16.0%',
      borderRadius: '38% 38% 48% 48%',
    },
    rightLens: {
      left: '68.6%',
      top: '32.3%',
      width: '28.5%',
      height: '16.0%',
      borderRadius: '38% 38% 48% 48%',
    },
  },
  {
    id: 'perro',
    name: 'Max',
    animal: 'Perro',
    badge: 'Max',
    collection: 'custom',
    src: '/assets/tenshi_perro.png?v=uhd4',
    accentColor: '#C7F303',
    defaultPersonaName: 'Max',
    defaultGender: 'masculino',
    defaultVoice: 'Fenrir',
    defaultPersonality:
      'Leal, alegre, cercano y motivador, como tu mejor amigo en cada conversación.',
    leftLens: {
      left: '30.1%',
      top: '31.0%',
      width: '29.5%',
      height: '19.5%',
      borderRadius: '28%',
    },
    rightLens: {
      left: '69.9%',
      top: '31.0%',
      width: '29.5%',
      height: '19.5%',
      borderRadius: '28%',
    },
  },
  {
    id: 'paloma',
    name: 'Paz',
    animal: 'Paloma',
    badge: 'Paz',
    collection: 'custom',
    src: '/assets/tenshi_paloma.png?v=uhd4',
    accentColor: '#6366F1',
    defaultPersonaName: 'Paz',
    defaultGender: 'femenino',
    defaultVoice: 'Aoede',
    defaultPersonality:
      'Serena, amable, elocuente y encantadora, transmite armonía y claridad al hablar.',
    leftLens: {
      left: '28.5%',
      top: '35.8%',
      width: '26.5%',
      height: '17.8%',
      borderRadius: '42%',
    },
    rightLens: {
      left: '71.5%',
      top: '35.8%',
      width: '26.5%',
      height: '17.8%',
      borderRadius: '42%',
    },
  },
  {
    id: 'capibara',
    name: 'Capi',
    animal: 'Capibara',
    badge: 'Capi',
    collection: 'custom',
    src: '/assets/tenshi_capibara.png?v=uhd4',
    accentColor: '#EA580C',
    defaultPersonaName: 'Capi',
    defaultGender: 'masculino',
    defaultVoice: 'Charon',
    defaultPersonality:
      'Tranquilo, relajado, paciente y con buen humor, nada lo estresa.',
    leftLens: { left: '26.8%', top: '28.6%', width: '26.5%', height: '14.5%' },
    rightLens: { left: '73.2%', top: '28.6%', width: '26.5%', height: '14.5%' },
  },
  {
    id: 'suricato_clasico',
    name: 'Suri',
    animal: 'Suricato',
    badge: 'Suri',
    collection: 'classic',
    src: '/assets/tenshi_suricato_clasico.png?v=uhd4',
    accentColor: '#10B981',
    defaultPersonaName: 'Suri',
    defaultGender: 'masculino',
    defaultVoice: 'Orus',
    defaultPersonality:
      'Ágil, curioso, chispeante y súper atento a cada detalle con actitud entusiasta.',
    leftLens: { left: '30.0%', top: '28.2%', width: '25.0%', height: '15.0%' },
    rightLens: { left: '70.0%', top: '28.2%', width: '25.0%', height: '15.0%' },
  },
  {
    id: 'perro_clasico',
    name: 'Max',
    animal: 'Perro',
    badge: 'Max',
    collection: 'classic',
    src: '/assets/tenshi_perro_clasico.png?v=uhd4',
    accentColor: '#10B981',
    defaultPersonaName: 'Max',
    defaultGender: 'masculino',
    defaultVoice: 'Fenrir',
    defaultPersonality:
      'Leal, alegre, cercano y motivador, como tu mejor amigo en cada conversación.',
    leftLens: { left: '31.0%', top: '29.0%', width: '25.5%', height: '15.5%' },
    rightLens: { left: '69.0%', top: '29.0%', width: '25.5%', height: '15.5%' },
  },
  {
    id: 'paloma_clasico',
    name: 'Paz',
    animal: 'Paloma',
    badge: 'Paz',
    collection: 'classic',
    src: '/assets/tenshi_paloma_clasico.png?v=uhd4',
    accentColor: '#10B981',
    defaultPersonaName: 'Paz',
    defaultGender: 'femenino',
    defaultVoice: 'Aoede',
    defaultPersonality:
      'Serena, amable, elocuente y encantadora, transmite armonía y claridad al hablar.',
    leftLens: { left: '29.0%', top: '35.9%', width: '26.0%', height: '13.2%' },
    rightLens: { left: '71.0%', top: '35.9%', width: '26.0%', height: '13.2%' },
  },
  {
    id: 'capibara_clasico',
    name: 'Capi',
    animal: 'Capibara',
    badge: 'Capi',
    collection: 'classic',
    src: '/assets/tenshi_capibara_clasico.png?v=uhd4',
    accentColor: '#10B981',
    defaultPersonaName: 'Capi',
    defaultGender: 'masculino',
    defaultVoice: 'Kore',
    defaultPersonality:
      'Tranquilo, relajado, paciente y con buen humor, nada lo estresa.',
    leftLens: { left: '28.0%', top: '28.9%', width: '27.5%', height: '15.5%' },
    rightLens: { left: '72.0%', top: '28.9%', width: '27.5%', height: '15.5%' },
  },
];

export const TENSHI_VOICES: TenshiVoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Dinámica y Juvenil',
    description: 'Voz ágil, cercana, carismática y llena de energía.',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Segura y Firme',
    description: 'Tono claro, decidido y confiable al conversar.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Profunda y Entusiasta',
    description: 'Tono con gran presencia, entusiasmo y calidez.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'masculino',
    genderLabel: 'Voz Masculina',
    tone: 'Serena y Pausada',
    description: 'Transmite calma absoluta, paciencia y tranquilidad.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Expresiva y Cálida',
    description: 'Fluida, natural, cercana y muy agradable al oído.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Relajada y Suave',
    description: 'Tono dulce, paciente y sereno para el día a día.',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Amable y Sofisticada',
    description: 'Elegante, clara y muy cordial en cada respuesta.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'femenino',
    genderLabel: 'Voz Femenina',
    tone: 'Fresca y Alegre',
    description: 'Moderna, chispeante, espontánea y dinámica.',
  },
];

export const PERSONALITY_ARCHETYPES: PersonalityArchetype[] = [
  {
    id: 'amigable',
    label: 'Amigable y Cercano',
    emoji: '😊',
    prompt: 'Carismático, cálido, conversador, empático y muy cercano.',
  },
  {
    id: 'divertido',
    label: 'Alegre y Divertido',
    emoji: '😄',
    prompt: 'Alegre, con chispa, buen sentido del humor, espontáneo y lleno de buena vibra.',
  },
  {
    id: 'relajado',
    label: 'Tranquilo y Relajado',
    emoji: '🧘',
    prompt: 'Sereno, paciente, pausado y descomplicado; transmite calma y cero estrés.',
  },
  {
    id: 'directo',
    label: 'Directo y Al Grano',
    emoji: '⚡',
    prompt: 'Ágil, práctico y conciso; responde directo al grano y sin rodeos.',
  },
  {
    id: 'formal',
    label: 'Formal y Cortés',
    emoji: '🎩',
    prompt: 'Elegante, muy educado, respetuoso y distinguido en su trato.',
  },
];

export const REGIONAL_VOCAB_OPTIONS: RegionalVocabOption[] = [
  {
    id: 'paisa',
    label: 'Paisa',
    region: 'Antioquia / Eje Cafetero',
    emoji: '☕',
    prompt:
      'Habla con modismos y calidez paisa de Medellín/Antioquia de forma natural ("¡Quiubo pues!", "parcero/a", "vea pues", "¡qué berraquera!", "hágale pues", "con mucho gusto pues").',
  },
  {
    id: 'costeno',
    label: 'Costeño',
    region: 'Caribe Colombiano',
    emoji: '🌴',
    prompt:
      'Habla con la alegría, frescura y dichos del Caribe colombiano ("¡Ajá, mi llave!", "eche", "bacano", "mi hermano/a", "todo firme", "¡qué vaina buena!", "no te preocupes cuadro").',
  },
  {
    id: 'caleno',
    label: 'Caleño / Valluno',
    region: 'Cali / Valle del Cauca',
    emoji: '💃',
    prompt:
      'Habla con el sabor, amabilidad y expresiones de Cali y el Valle ("¡Oí, ve!", "mirá ve", "¿oís?", "¡qué chévere!", "de una", "con toda la actitud").',
  },
  {
    id: 'rolo',
    label: 'Rolo / Bogotano',
    region: 'Bogotá / Sabana',
    emoji: '🏔️',
    prompt:
      'Habla con el estilo bogotano cordial y descomplicado ("¡Qué más, cómo vas!", "chévere", "fresco/a", "de una", "súper bien", "listo, dale").',
  },
  {
    id: 'santandereano',
    label: 'Santandereano',
    region: 'Santander',
    emoji: '🌻',
    prompt:
      'Habla con el carácter franco, directo, enérgico y leal de Santander ("¡Mano, qué más!", "hágale sin miedo", "¡eso sí pa qué!", "al grano mano").',
  },
  {
    id: 'llanero',
    label: 'Llanero',
    region: 'Llanos Orientales',
    emoji: '🐎',
    prompt:
      'Habla con la hospitalidad y modismos de los Llanos Orientales ("¡Buen día, pariente!", "camarita", "pa\'lante es que vamos").',
  },
  {
    id: 'pastuso',
    label: 'Pastuso / Nariñense',
    region: 'Nariño / Sur',
    emoji: '🌋',
    prompt:
      'Habla con la amabilidad, dulzura y cortesía nariñense ("¡Qué fue pues!", "achichay", "con mucho cariño pues", "sí pues").',
  },
  {
    id: 'neutro',
    label: 'Español Neutro',
    region: 'Sin modismos regionales',
    emoji: '🌎',
    prompt: 'Habla en español neutro estándar, claro y natural sin modismos regionales.',
  },
];

export function getAvatarPresetById(id?: string | null): TenshiAvatarPreset {
  if (!id) return TENSHI_AVATAR_PRESETS[0];
  const normalized = String(id).trim().toLowerCase();
  return (
    TENSHI_AVATAR_PRESETS.find((p) => p.id === normalized) || TENSHI_AVATAR_PRESETS[0]
  );
}
