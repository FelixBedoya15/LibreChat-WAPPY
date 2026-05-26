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
      <div className="my-2 p-4.5 rounded-2xl border border-amber-200/60 bg-amber-50/40 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/15 dark:text-amber-100 font-sans whitespace-normal break-words shadow-sm max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round">
              <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4c.9.2 1.8.1 2.6-.2L18.4 11c1.2-1.2 1.4-3 .5-4.3l-.3-.4C17.3 4.8 15.1 4.5 13.5 5.5l-1.3 1.3c-.9.9-1.2 2.2-.9 3.4L10 11.6v2.4H7v3H4v-1"/>
              <circle cx="17" cy="8" r="1"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-snug tracking-wide text-amber-950 dark:text-amber-200 mb-1">
              No se encontró ninguna clave API de Google Gemini
            </div>
            <div className="text-xs leading-relaxed opacity-95 text-gray-700 dark:text-gray-300">
              Para chatear con el asistente es obligatorio que conectes tu clave API. Te recomendamos realizar el videotutorial rápido paso a paso en nuestra aula de estudio para activarla en 2 minutos:
            </div>
            
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <a
                href="https://wappy.club/training/69a5efb4780d73647a1961fe/api-key-facil-conecta-google-gemini-a-wappy-ia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-200 bg-amber-600 border-amber-600 hover:bg-amber-700 text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
      <div className="my-2 p-4.5 rounded-2xl border border-red-200/60 bg-red-50/40 text-red-900 dark:border-red-900/40 dark:bg-red-950/15 dark:text-red-100 font-sans whitespace-normal break-words shadow-sm max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-snug tracking-wide text-red-950 dark:text-red-200 mb-1">
              Clave API de Google Gemini no válida
            </div>
            <div className="text-xs leading-relaxed opacity-95 text-gray-700 dark:text-gray-300">
              La clave de API proporcionada no es válida. Por favor, asegúrate de haberla copiado correctamente sin espacios adicionales. Si tienes dudas, te recomendamos realizar el videotutorial paso a paso en nuestra aula de estudio:
            </div>
            
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <a
                href="https://wappy.club/training/69a5efb4780d73647a1961fe/api-key-facil-conecta-google-gemini-a-wappy-ia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-200 bg-red-600 border-red-600 hover:bg-red-700 text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
