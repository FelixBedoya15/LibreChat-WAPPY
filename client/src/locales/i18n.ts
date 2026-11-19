import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only bundle Spanish and English eagerly (99%+ of WAPPY users) to cut ~2.15 MB from initial load
import translationEn from './en/translation.json';
import translationEs from './es/translation.json';

export const defaultNS = 'translation';

export const resources = {
  en: { translation: translationEn },
  es: { translation: translationEs },
} as const;

// All secondary languages are code-split into tiny ~60KB chunks and loaded on demand
const lazyLocaleLoaders: Record<string, () => Promise<{ default: Record<string, any> }>> = {
  ar: () => import('./ar/translation.json'),
  bo: () => import('./bo/translation.json'),
  bs: () => import('./bs/translation.json'),
  ca: () => import('./ca/translation.json'),
  cs: () => import('./cs/translation.json'),
  da: () => import('./da/translation.json'),
  de: () => import('./de/translation.json'),
  et: () => import('./et/translation.json'),
  fa: () => import('./fa/translation.json'),
  fi: () => import('./fi/translation.json'),
  fr: () => import('./fr/translation.json'),
  he: () => import('./he/translation.json'),
  hu: () => import('./hu/translation.json'),
  hy: () => import('./hy/translation.json'),
  id: () => import('./id/translation.json'),
  it: () => import('./it/translation.json'),
  ja: () => import('./ja/translation.json'),
  ka: () => import('./ka/translation.json'),
  ko: () => import('./ko/translation.json'),
  lv: () => import('./lv/translation.json'),
  nb: () => import('./nb/translation.json'),
  nl: () => import('./nl/translation.json'),
  pl: () => import('./pl/translation.json'),
  'pt-BR': () => import('./pt-BR/translation.json'),
  'pt-PT': () => import('./pt-PT/translation.json'),
  ru: () => import('./ru/translation.json'),
  sl: () => import('./sl/translation.json'),
  sv: () => import('./sv/translation.json'),
  th: () => import('./th/translation.json'),
  tr: () => import('./tr/translation.json'),
  ug: () => import('./ug/translation.json'),
  uk: () => import('./uk/translation.json'),
  vi: () => import('./vi/translation.json'),
  'zh-Hans': () => import('./zh-Hans/translation.json'),
  'zh-Hant': () => import('./zh-Hant/translation.json'),
};

const lazyLocaleBackend = {
  type: 'backend' as const,
  init() {
    /* noop */
  },
  read(language: string, _namespace: string, callback: (err: unknown, data?: unknown) => void) {
    const loader = lazyLocaleLoaders[language] || lazyLocaleLoaders[language.split('-')[0]];
    if (!loader) {
      callback(null, {});
      return;
    }
    loader()
      .then((mod) => callback(null, mod.default || mod))
      .catch((err) => callback(err));
  },
};

i18n
  .use(lazyLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      'zh-TW': ['zh-Hant', 'en'],
      'zh-HK': ['zh-Hant', 'en'],
      zh: ['zh-Hans', 'en'],
      default: ['en'],
    },
    fallbackNS: 'translation',
    ns: ['translation'],
    debug: false,
    defaultNS,
    resources,
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
  });

export default i18n;
