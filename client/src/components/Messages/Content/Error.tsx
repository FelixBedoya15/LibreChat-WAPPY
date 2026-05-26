// file deepcode ignore HardcodedNonCryptoSecret: No hardcoded secrets
import { ViolationTypes, ErrorTypes, alternateName } from 'librechat-data-provider';
import { useState, useEffect } from 'react';
import type { LocalizeFunction } from '~/common';
import { formatJSON, extractJson, isJson } from '~/utils/json';
import { useLocalize } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';
import CodeBlock from './CodeBlock';
import ApiKeyErrorModal from './ApiKeyErrorModal';

const localizedErrorPrefix = 'com_error';

type TConcurrent = {
  limit: number;
};

type TMessageLimit = {
  max: number;
  windowInMinutes: number;
};

type TTokenBalance = {
  type: ViolationTypes | ErrorTypes;
  balance: number;
  tokenCost: number;
  promptTokens: number;
  prev_count: number;
  violation_count: number;
  date: Date;
  generations?: unknown[];
};

type TExpiredKey = {
  expiredAt: string;
  endpoint: string;
};

type TGenericError = {
  info: string;
};

const errorMessages = {
  [ErrorTypes.MODERATION]: 'com_error_moderation',
  [ErrorTypes.NO_USER_KEY]: (json: any, localize: LocalizeFunction) => {
    return (
      <div className="w-full my-3 p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent text-amber-900 dark:text-amber-100 font-sans whitespace-normal break-words shadow-md shadow-amber-500/5 backdrop-blur-[2px] animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0 shadow-sm shadow-amber-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key">
              <circle cx="7.5" cy="16.5" r="4.5" />
              <path d="m21 3-10.7 10.7" />
              <path d="m14 6 3 3" />
              <path d="M11 9h2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-base leading-snug tracking-wide text-amber-950 dark:text-amber-100 mb-1.5">
              No se encontró ninguna clave API de Google Gemini
            </div>
            <div className="text-xs leading-relaxed opacity-95 text-gray-700 dark:text-gray-300 max-w-4xl">
              Para conversar con el asistente es obligatorio que conectes tu clave API. Te recomendamos realizar el videotutorial rápido paso a paso en nuestra aula de estudio para activarla de forma sencilla en 2 minutos:
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a
                href="https://wappy.club/training/69a5efb4780d73647a1961fe/api-key-facil-conecta-google-gemini-a-wappy-ia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 cursor-pointer"
              >
                <span>Activar Clave (Videotutorial Aula de Estudio)</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right">
                  <path d="M7 7h10v10"/>
                  <path d="M7 17 17 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  },
  [ErrorTypes.INVALID_USER_KEY]: (json: any, localize: LocalizeFunction) => {
    return (
      <div className="w-full my-3 p-5 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent text-rose-900 dark:text-rose-100 font-sans whitespace-normal break-words shadow-md shadow-rose-500/5 backdrop-blur-[2px] animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 shrink-0 shadow-sm shadow-rose-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-base leading-snug tracking-wide text-rose-950 dark:text-rose-100 mb-1.5">
              Clave API de Google Gemini no válida
            </div>
            <div className="text-xs leading-relaxed opacity-95 text-gray-700 dark:text-gray-300 max-w-4xl">
              La clave de API proporcionada no es válida. Por favor, asegúrate de haberla copiado correctamente sin espacios adicionales. Si tienes dudas, te recomendamos realizar el videotutorial paso a paso en nuestra aula de estudio:
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a
                href="https://wappy.club/training/69a5efb4780d73647a1961fe/api-key-facil-conecta-google-gemini-a-wappy-ia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 cursor-pointer"
              >
                <span>Ver Videotutorial en Aula de Estudio</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right">
                  <path d="M7 7h10v10"/>
                  <path d="M7 17 17 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  },
  [ErrorTypes.NO_BASE_URL]: 'com_error_no_base_url',
  [ErrorTypes.INVALID_ACTION]: `com_error_${ErrorTypes.INVALID_ACTION}`,
  [ErrorTypes.INVALID_REQUEST]: `com_error_${ErrorTypes.INVALID_REQUEST}`,
  [ErrorTypes.MISSING_MODEL]: (json: TGenericError, localize: LocalizeFunction) => {
    const { info: endpoint } = json;
    const provider = (alternateName[endpoint ?? ''] as string | undefined) ?? endpoint ?? 'unknown';
    return localize('com_error_missing_model', { 0: provider });
  },
  [ErrorTypes.MODELS_NOT_LOADED]: 'com_error_models_not_loaded',
  [ErrorTypes.ENDPOINT_MODELS_NOT_LOADED]: (json: TGenericError, localize: LocalizeFunction) => {
    const { info: endpoint } = json;
    const provider = (alternateName[endpoint ?? ''] as string | undefined) ?? endpoint ?? 'unknown';
    return localize('com_error_endpoint_models_not_loaded', { 0: provider });
  },
  [ErrorTypes.NO_SYSTEM_MESSAGES]: `com_error_${ErrorTypes.NO_SYSTEM_MESSAGES}`,
  [ErrorTypes.EXPIRED_USER_KEY]: (json: TExpiredKey, localize: LocalizeFunction) => {
    const { expiredAt, endpoint } = json;
    return localize('com_error_expired_user_key', { 0: endpoint, 1: expiredAt });
  },
  [ErrorTypes.INPUT_LENGTH]: (json: TGenericError, localize: LocalizeFunction) => {
    const { info } = json;
    return localize('com_error_input_length', { 0: info });
  },
  [ErrorTypes.INVALID_AGENT_PROVIDER]: (json: TGenericError, localize: LocalizeFunction) => {
    const { info } = json;
    const provider = (alternateName[info] as string | undefined) ?? info;
    return localize('com_error_invalid_agent_provider', { 0: provider });
  },
  [ErrorTypes.GOOGLE_ERROR]: (json: TGenericError) => {
    const { info } = json;
    return info;
  },
  [ErrorTypes.GOOGLE_TOOL_CONFLICT]: 'com_error_google_tool_conflict',
  [ViolationTypes.BAN]:
    'Your account has been temporarily banned due to violations of our service.',
  [ViolationTypes.ILLEGAL_MODEL_REQUEST]: (json: TGenericError, localize: LocalizeFunction) => {
    const { info } = json;
    const [endpoint, model = 'unknown'] = info?.split('|') ?? [];
    const provider = (alternateName[endpoint ?? ''] as string | undefined) ?? endpoint ?? 'unknown';
    return localize('com_error_illegal_model_request', { 0: model, 1: provider });
  },
  invalid_api_key:
    'Invalid API key. Please check your API key and try again. You can do this by clicking on the model logo in the left corner of the textbox and selecting "Set Token" for the current selected endpoint. Thank you for your understanding.',
  insufficient_quota:
    'We apologize for any inconvenience caused. The default API key has reached its limit. To continue using this service, please set up your own API key. You can do this by clicking on the model logo in the left corner of the textbox and selecting "Set Token" for the current selected endpoint. Thank you for your understanding.',
  concurrent: (json: TConcurrent) => {
    const { limit } = json;
    const plural = limit > 1 ? 's' : '';
    return `Only ${limit} message${plural} at a time. Please allow any other responses to complete before sending another message, or wait one minute.`;
  },
  message_limit: (json: TMessageLimit) => {
    const { max, windowInMinutes } = json;
    const plural = max > 1 ? 's' : '';
    return `You hit the message limit. You have a cap of ${max} message${plural} per ${windowInMinutes > 1 ? `${windowInMinutes} minutes` : 'minute'
      }.`;
  },
  token_balance: (json: TTokenBalance) => {
    const { balance, tokenCost, promptTokens, generations } = json;
    const message = `Insufficient Funds! Balance: ${balance}. Prompt tokens: ${promptTokens}. Cost: ${tokenCost}.`;
    return (
      <>
        {message}
        {generations && (
          <>
            <br />
            <br />
          </>
        )}
        {generations && (
          <CodeBlock
            lang="Generations"
            error={true}
            codeChildren={formatJSON(JSON.stringify(generations))}
          />
        )}
      </>
    );
  },
  convo_limit: (json: any) => {
    return (
      <div className="mt-4 w-full flex justify-center">
        <UpgradeWall
          isCompact
          title="Adquirir Plan Pro"
          description={json.message || 'Has alcanzado el límite de conversaciones de tu plan. Adquiere el Plan Pro para disfrutar de conversaciones ilimitadas y todas las herramientas de WAPPY IA.'}
        />
      </div>
    );
  },
};

const Error = ({ text }: { text: string }) => {
  const localize = useLocalize();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  useEffect(() => {
    if (text && (text.includes('API_KEY_INVALID') || text.includes('API key not valid') || text.includes('invalid_api_key'))) {
      setShowApiKeyModal(true);
    }
  }, [text]);

  const jsonString = extractJson(text);
  const errorMessage = text.length > 512 && !jsonString ? text.slice(0, 512) + '...' : text;
  const defaultResponse = `Algo salió mal. Este es el mensaje de error específico que encontramos: ${errorMessage}`;

  const renderContent = () => {
    if (!isJson(jsonString)) {
      return defaultResponse;
    }

    const json = JSON.parse(jsonString);
    const errorKey = json.code || json.type;
    const keyExists = errorKey && errorMessages[errorKey];

    if (keyExists && typeof errorMessages[errorKey] === 'function') {
      return errorMessages[errorKey](json, localize);
    } else if (keyExists && keyExists.startsWith(localizedErrorPrefix)) {
      return localize(errorMessages[errorKey]);
    } else if (keyExists) {
      return errorMessages[errorKey];
    } else {
      return defaultResponse;
    }
  };

  return (
    <>
      {renderContent()}
      <ApiKeyErrorModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
    </>
  );
};

export default Error;
