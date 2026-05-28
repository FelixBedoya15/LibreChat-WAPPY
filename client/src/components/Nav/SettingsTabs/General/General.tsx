import React, { useContext, useCallback, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Dropdown, ThemeContext } from '@librechat/client';
import ArchivedChats from './ArchivedChats';
import ToggleSwitch from '../ToggleSwitch';
import { useLocalize } from '~/hooks';
import store from '~/store';

const toggleSwitchConfigs = [
  {
    stateAtom: store.enableUserMsgMarkdown,
    localizationKey: 'com_nav_user_msg_markdown',
    switchId: 'enableUserMsgMarkdown',
    hoverCardText: undefined,
    key: 'enableUserMsgMarkdown',
  },
  {
    stateAtom: store.autoScroll,
    localizationKey: 'com_nav_auto_scroll',
    switchId: 'autoScroll',
    hoverCardText: undefined,
    key: 'autoScroll',
  },
  {
    stateAtom: store.hideSidePanel,
    localizationKey: 'com_nav_hide_panel',
    switchId: 'hideSidePanel',
    hoverCardText: undefined,
    key: 'hideSidePanel',
  },
  {
    stateAtom: store.enableLocation,
    localizationKey: 'com_nav_enable_location',
    switchId: 'enableLocation',
    hoverCardText: undefined,
    key: 'enableLocation',
  },
];

export const ThemeSelector = ({
  theme,
  onChange,
}: {
  theme: string;
  onChange: (value: string) => void;
}) => {
  const localize = useLocalize();

  const themeOptions = [
    { value: 'system', label: localize('com_nav_theme_system') },
    { value: 'dark', label: localize('com_nav_theme_dark') },
    { value: 'light', label: localize('com_nav_theme_light') },
    { value: 'green', label: localize('com_nav_theme_green') },
  ];

  const labelId = 'theme-selector-label';

  return (
    <div className="flex items-center justify-between">
      <div id={labelId}>{localize('com_nav_theme')}</div>

      <Dropdown
        value={theme}
        onChange={onChange}
        options={themeOptions}
        sizeClasses="w-[180px]"
        testId="theme-selector"
        className="z-50"
        aria-labelledby={labelId}
      />
    </div>
  );
};

export const LangSelector = ({
  langcode,
  onChange,
}: {
  langcode: string;
  onChange: (value: string) => void;
}) => {
  const localize = useLocalize();

  const languageOptions = [
    { value: 'auto', label: localize('com_nav_lang_auto') },
    { value: 'en-US', label: localize('com_nav_lang_english') },
    { value: 'zh-Hans', label: localize('com_nav_lang_chinese') },
    { value: 'zh-Hant', label: localize('com_nav_lang_traditional_chinese') },
    { value: 'ar-EG', label: localize('com_nav_lang_arabic') },
    { value: 'bs', label: localize('com_nav_lang_bosnian') },
    { value: 'da-DK', label: localize('com_nav_lang_danish') },
    { value: 'de-DE', label: localize('com_nav_lang_german') },
    { value: 'es-ES', label: localize('com_nav_lang_spanish') },
    { value: 'ca-ES', label: localize('com_nav_lang_catalan') },
    { value: 'et-EE', label: localize('com_nav_lang_estonian') },
    { value: 'fa-IR', label: localize('com_nav_lang_persian') },
    { value: 'fr-FR', label: localize('com_nav_lang_french') },
    { value: 'he-HE', label: localize('com_nav_lang_hebrew') },
    { value: 'hu-HU', label: localize('com_nav_lang_hungarian') },
    { value: 'hy-AM', label: localize('com_nav_lang_armenian') },
    { value: 'it-IT', label: localize('com_nav_lang_italian') },
    { value: 'nb', label: localize('com_nav_lang_norwegian_bokmal') },
    { value: 'pl-PL', label: localize('com_nav_lang_polish') },
    { value: 'pt-BR', label: localize('com_nav_lang_brazilian_portuguese') },
    { value: 'pt-PT', label: localize('com_nav_lang_portuguese') },
    { value: 'ru-RU', label: localize('com_nav_lang_russian') },
    { value: 'ja-JP', label: localize('com_nav_lang_japanese') },
    { value: 'ka-GE', label: localize('com_nav_lang_georgian') },
    { value: 'cs-CZ', label: localize('com_nav_lang_czech') },
    { value: 'sv-SE', label: localize('com_nav_lang_swedish') },
    { value: 'ko-KR', label: localize('com_nav_lang_korean') },
    { value: 'lv-LV', label: localize('com_nav_lang_latvian') },
    { value: 'vi-VN', label: localize('com_nav_lang_vietnamese') },
    { value: 'th-TH', label: localize('com_nav_lang_thai') },
    { value: 'tr-TR', label: localize('com_nav_lang_turkish') },
    { value: 'ug', label: localize('com_nav_lang_uyghur') },
    { value: 'nl-NL', label: localize('com_nav_lang_dutch') },
    { value: 'id-ID', label: localize('com_nav_lang_indonesia') },
    { value: 'fi-FI', label: localize('com_nav_lang_finnish') },
    { value: 'sl', label: localize('com_nav_lang_slovenian') },
    { value: 'bo', label: localize('com_nav_lang_tibetan') },
    { value: 'uk-UA', label: localize('com_nav_lang_ukrainian') },
  ];

  const labelId = 'language-selector-label';

  return (
    <div className="flex items-center justify-between">
      <div id={labelId}>{localize('com_nav_language')}</div>

      <Dropdown
        value={langcode}
        onChange={onChange}
        sizeClasses="[--anchor-max-height:256px]"
        options={languageOptions}
        className="z-50"
        aria-labelledby={labelId}
      />
    </div>
  );
};


export const FontSelector = () => {
  const localize = useLocalize();
  const [fontFamily, setFontFamily] = useRecoilState(store.fontFamily);

  const fontOptions = [
    { value: 'system', label: localize('com_nav_font_default') },
    { value: '8bit', label: localize('com_nav_font_8bit') },
    { value: 'book-antiqua', label: localize('com_nav_font_book_antiqua') },
    { value: 'menlo', label: localize('com_nav_font_menlo') },
  ];

  const labelId = 'font-selector-label';

  return (
    <div className="flex items-center justify-between">
      <div id={labelId}>{localize('com_nav_font_family')}</div>

      <Dropdown
        value={fontFamily}
        onChange={setFontFamily}
        options={fontOptions}
        sizeClasses="w-[180px]"
        testId="font-selector"
        className="z-50"
        aria-labelledby={labelId}
      />
    </div>
  );
};


const LocationStatus = () => {
  const enableLocation = useRecoilValue(store.enableLocation);
  const userLocation = useRecoilValue(store.userLocation);
  const localize = useLocalize();

  if (!enableLocation) return null;

  return (
    <div className="mb-4 rounded-md border border-border-light bg-surface-secondary p-3 text-xs text-text-secondary">
      <div className="font-bold mb-1">{localize('com_nav_enable_location')}:</div>
      <div>{userLocation || 'Detecting location... (Check browser permissions)'}</div>
    </div>
  );
};

const PWAInstaller = () => {
  const localize = useLocalize();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ua = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (typeof window !== 'undefined' &&
      window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);

  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isAndroid]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>{localize('com_ui_install_pwa') || 'Descargar APP'}</div>
      <button
        onClick={() => {
          if (deferredPrompt) {
            handleInstallClick();
          } else {
            setIsModalOpen(true);
          }
        }}
        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
      >
        {isInstalled ? 'App Instalada' : 'Descargar App'}
      </button>

      {/* Modal de instrucciones de descarga/instalación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="relative flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-gray-700 dark:bg-gray-800 text-text-primary">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Instalar WAPPY IA
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Selector de pestañas por dispositivo */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2.5 text-center text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'ios'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                iPhone / iPad (iOS)
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2.5 text-center text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'android'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Celular / Tablet (Android)
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2.5 text-center text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'desktop'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                PC / Laptop (Escritorio)
              </button>
            </div>

            {/* Contenido según pestaña activa */}
            <div className="py-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              {activeTab === 'ios' && (
                <div className="flex flex-col gap-4">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Sigue estos pasos en tu dispositivo Apple para instalar WAPPY IA:
                  </p>
                  <ol className="flex flex-col gap-3">
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        1
                      </span>
                      <span>
                        Asegúrate de estar navegando desde <strong>Safari</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        2
                      </span>
                      <span>
                        Pulsa el botón de <strong>Compartir</strong>{' '}
                        <svg
                          className="inline-block w-4 h-4 text-blue-600 mx-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.684 10.742l8.947-4.474M8.684 12.258l8.947 4.474M3 9a9 9 0 1118 0 9 9 0 01-18 0z"
                          />
                        </svg>
                        (o el icono{' '}
                        <svg
                          className="inline-block w-4 h-4 text-blue-600 mx-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        ) en la barra de navegación.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        3
                      </span>
                      <span>
                        Selecciona la opción <strong>&quot;Agregar a la pantalla de inicio&quot;</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        4
                      </span>
                      <span>
                        Confirma el nombre y pulsa <strong>&quot;Añadir&quot;</strong> en la esquina
                        superior derecha. ¡Listo!
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="flex flex-col gap-4">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Sigue estos sencillos pasos en tu celular o tablet Android:
                  </p>
                  <ol className="flex flex-col gap-3">
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        1
                      </span>
                      <span>
                        Usa <strong>Google Chrome</strong> para una instalación automática directa.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        2
                      </span>
                      <span>
                        Toca los <strong>tres puntos</strong> en la esquina superior derecha del
                        navegador.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        3
                      </span>
                      <span>
                        Selecciona la opción <strong>&quot;Instalar aplicación&quot;</strong> o{' '}
                        <strong>&quot;Añadir a la pantalla de inicio&quot;</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                        4
                      </span>
                      <span>
                        Confirma e inicia la descarga. La aplicación aparecerá en tu cajón de apps e
                        inicio.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === 'desktop' && (
                <div className="flex flex-col gap-4">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Instala WAPPY IA en tu computador portátil o de mesa:
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/30">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Google Chrome / Microsoft Edge / Brave:
                      </span>
                      <p className="mt-1">
                        1. Haz clic en el <strong>icono de descarga (un monitor con una flecha o un botón &quot;+&quot;)</strong>{' '}
                        ubicado al extremo derecho de la barra de direcciones superior del
                        navegador.
                        <br />
                        2. Alternativamente, abre el menú de tres puntos (Chrome) o tres rayas
                        (Edge) y selecciona <strong>&quot;Instalar WAPPY IA&quot;</strong>.
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/30">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Apple Safari (macOS):
                      </span>
                      <p className="mt-1">
                        1. Haz clic en el botón de <strong>Compartir</strong> o selecciona el menú{' '}
                        <strong>Archivo</strong> en la barra superior.
                        <br />
                        2. Elige <strong>&quot;Añadir al Dock...&quot;</strong>, confirma el nombre
                        y pulsa en &quot;Añadir&quot;. WAPPY IA se abrirá en su propia ventana
                        dedicada.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal / Acciones */}
            <div className="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Instalar Ahora
                </button>
              ) : null}
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function General() {
  const { theme, setTheme } = useContext(ThemeContext);

  const [langcode, setLangcode] = useRecoilState(store.lang);

  const changeTheme = useCallback(
    (value: string) => {
      setTheme(value);
    },
    [setTheme],
  );

  const changeLang = useCallback(
    (value: string) => {
      let userLang = value;
      if (value === 'auto') {
        userLang = navigator.language || navigator.languages[0];
      }

      requestAnimationFrame(() => {
        document.documentElement.lang = userLang;
      });
      setLangcode(userLang);
      Cookies.set('lang', userLang, { expires: 365 });
    },
    [setLangcode],
  );

  return (
    <div className="flex flex-col gap-4 text-sm text-text-primary">
      {/* Tarjeta de Apariencia e Idioma */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-medium text-text-primary">Apariencia</h3>
        <div className="flex flex-col gap-4">
          <ThemeSelector theme={theme} onChange={changeTheme} />
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <LangSelector langcode={langcode} onChange={changeLang} />
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <FontSelector />
        </div>
      </div>

      {/* Tarjeta de Preferencias */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-medium text-text-primary">Preferencias del Sistema</h3>
        <div className="flex flex-col gap-4">
          {toggleSwitchConfigs.map((config, index) => (
            <React.Fragment key={config.key}>
              <ToggleSwitch
                stateAtom={config.stateAtom}
                localizationKey={config.localizationKey}
                hoverCardText={config.hoverCardText}
                switchId={config.switchId}
              />
              {index < toggleSwitchConfigs.length - 1 && (
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Debugging/Verification: Show current location if enabled */}
      <LocationStatus />

      {/* Tarjeta de Aplicación y PWA */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-medium text-text-primary">Aplicación</h3>
        <div className="flex flex-col gap-4">
          <PWAInstaller />
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <ArchivedChats />
        </div>
      </div>
    </div>
  );
}

export default React.memo(General);
