import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogFooter,
  Dropdown,
  useToastContext,
  Button,
  Label,
  OGDialogTrigger,
  Spinner,
} from '@librechat/client';
import { KeyRound, Clock, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import { EModelEndpoint, alternateName, isAssistantsEndpoint } from 'librechat-data-provider';
import {
  useRevokeAllUserKeysMutation,
  useRevokeUserKeyMutation,
} from 'librechat-data-provider/react-query';
import type { TDialogProps } from '~/common';
import { useGetEndpointsQuery } from '~/data-provider';
import { useUserKey, useLocalize } from '~/hooks';
import { NotificationSeverity } from '~/common';
import CustomConfig from './CustomEndpoint';
import GoogleConfig from './GoogleConfig';
import OpenAIConfig from './OpenAIConfig';
import OtherConfig from './OtherConfig';
import HelpText from './HelpText';
import { logger, cn } from '~/utils';

const endpointComponents = {
  [EModelEndpoint.google]: GoogleConfig,
  [EModelEndpoint.openAI]: OpenAIConfig,
  [EModelEndpoint.custom]: CustomConfig,
  [EModelEndpoint.azureOpenAI]: OpenAIConfig,
  [EModelEndpoint.gptPlugins]: OpenAIConfig,
  [EModelEndpoint.assistants]: OpenAIConfig,
  [EModelEndpoint.azureAssistants]: OpenAIConfig,
  default: OtherConfig,
};

const formSet: Set<string> = new Set([
  EModelEndpoint.openAI,
  EModelEndpoint.custom,
  EModelEndpoint.azureOpenAI,
  EModelEndpoint.gptPlugins,
  EModelEndpoint.assistants,
  EModelEndpoint.azureAssistants,
]);

const EXPIRY = {
  THIRTY_MINUTES: { label: 'en 30 minutos', value: 30 * 60 * 1000 },
  TWO_HOURS: { label: 'en 2 horas', value: 2 * 60 * 60 * 1000 },
  TWELVE_HOURS: { label: 'en 12 horas', value: 12 * 60 * 60 * 1000 },
  ONE_DAY: { label: 'en 1 día', value: 24 * 60 * 60 * 1000 },
  ONE_WEEK: { label: 'en 7 días', value: 7 * 24 * 60 * 60 * 1000 },
  ONE_MONTH: { label: 'en 30 días', value: 30 * 24 * 60 * 60 * 1000 },
  NEVER: { label: 'nunca', value: 0 },
};

const RevokeKeysButton = ({
  endpoint,
  disabled,
  setDialogOpen,
}: {
  endpoint: string;
  disabled: boolean;
  setDialogOpen: (open: boolean) => void;
}) => {
  const localize = useLocalize();
  const [open, setOpen] = useState(false);
  const { showToast } = useToastContext();
  const revokeKeyMutation = useRevokeUserKeyMutation(endpoint);
  const revokeKeysMutation = useRevokeAllUserKeysMutation();

  const handleSuccess = () => {
    showToast({
      message: localize('com_ui_revoke_key_success'),
      status: NotificationSeverity.SUCCESS,
    });

    if (!setDialogOpen) {
      return;
    }

    localStorage.removeItem(`librechat_user_key_${endpoint}`);
    setDialogOpen(false);
  };

  const handleError = () => {
    showToast({
      message: localize('com_ui_revoke_key_error'),
      status: NotificationSeverity.ERROR,
    });
  };

  const onClick = () => {
    revokeKeyMutation.mutate(
      {},
      {
        onSuccess: handleSuccess,
        onError: handleError,
      },
    );
  };

  const isLoading = revokeKeyMutation.isLoading || revokeKeysMutation.isLoading;

  return (
    <div className="flex items-center justify-between">
      <OGDialog open={open} onOpenChange={setOpen}>
        <OGDialogTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 shadow-2xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            <Trash2 size={14} />
            <span>{localize('com_ui_revoke')}</span>
          </button>
        </OGDialogTrigger>
        <OGDialogContent className="max-w-[450px] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl">
          <OGDialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={18} />
              </div>
              <OGDialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {localize('com_ui_revoke_key_endpoint', { 0: endpoint })}
              </OGDialogTitle>
            </div>
          </OGDialogHeader>
          <div className="py-3">
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {localize('com_ui_revoke_key_confirm')}
            </p>
          </div>
          <OGDialogFooter className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95"
              onClick={() => setOpen(false)}
            >
              {localize('com_ui_cancel')}
            </button>
            <button
              type="button"
              onClick={onClick}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-600/20 hover:from-red-500 hover:to-rose-500 active:scale-95 transition-all"
            >
              {isLoading ? <Spinner className="w-4 h-4" /> : localize('com_ui_revoke')}
            </button>
          </OGDialogFooter>
        </OGDialogContent>
      </OGDialog>
    </div>
  );
};

const SetKeyDialog = ({
  open,
  onOpenChange,
  endpoint,
  endpointType,
  userProvideURL,
}: Pick<TDialogProps, 'open' | 'onOpenChange'> & {
  endpoint: EModelEndpoint | string;
  endpointType?: EModelEndpoint;
  userProvideURL?: boolean | null;
}) => {
  const methods = useForm({
    defaultValues: {
      apiKey: (() => {
        try {
          return localStorage.getItem(`librechat_user_key_${endpoint}`) || '';
        } catch (e) {
          return '';
        }
      })(),
      baseURL: '',
      azureOpenAIApiKey: '',
      azureOpenAIApiInstanceName: '',
      azureOpenAIApiDeploymentName: '',
      azureOpenAIApiVersion: '',
      // TODO: allow endpoint definitions from user
      // name: '',
      // TODO: add custom endpoint models defined by user
      // models: '',
    },
  });

  const [userKey, setUserKey] = useState(() => {
    try {
      return localStorage.getItem(`librechat_user_key_${endpoint}`) || '';
    } catch (e) {
      return '';
    }
  });
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const [expiresAtLabel, setExpiresAtLabel] = useState(EXPIRY.NEVER.label);
  const { getExpiry, saveUserKey } = useUserKey(endpoint);
  const { saveUserKey: saveTenshiKey } = useUserKey('tenshi_google');
  const { showToast } = useToastContext();
  const localize = useLocalize();

  // Re-read keys from localStorage every time the dialog opens
  useEffect(() => {
    if (open) {
      try {
        const stored = localStorage.getItem(`librechat_user_key_${endpoint}`) || '';
        setUserKey(stored);
      } catch {
        setUserKey('');
      }
    }
  }, [open, endpoint]);

  const expirationOptions = Object.values(EXPIRY);

  const handleExpirationChange = (label: string) => {
    setExpiresAtLabel(label);
  };

  const submit = () => {
    const selectedOption = expirationOptions.find((option) => option.label === expiresAtLabel);
    let expiresAt: number | null;

    if (selectedOption?.value === 0) {
      expiresAt = null;
    } else {
      expiresAt = Date.now() + (selectedOption ? selectedOption.value : 0);
    }

    const saveKey = (key: string) => {
      saveUserKey(key, expiresAt, {
        onSuccess: () => {
          localStorage.setItem(`librechat_user_key_${endpoint}`, key);
          if (endpoint === EModelEndpoint.google) {
            try {
              const tenshiKey = localStorage.getItem('librechat_user_key_tenshi_google') || '';
              saveTenshiKey(tenshiKey, expiresAt);
            } catch (err) {
              logger.error('Error saving Tenshi key:', err);
            }
          }
          showToast({
            message: localize('com_ui_save_key_success'),
            status: NotificationSeverity.SUCCESS,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          logger.error('Error saving user key:', error);
          const message = error?.response?.data?.error || error?.response?.data?.message || localize('com_ui_save_key_error');
          showToast({
            message,
            status: NotificationSeverity.ERROR,
          });
        },
      });
    };

    if (formSet.has(endpoint) || formSet.has(endpointType ?? '')) {
      // TODO: handle other user provided options besides baseURL and apiKey
      methods.handleSubmit((data) => {
        const isAzure = endpoint === EModelEndpoint.azureOpenAI;
        const isOpenAIBase =
          isAzure ||
          endpoint === EModelEndpoint.openAI ||
          endpoint === EModelEndpoint.gptPlugins ||
          isAssistantsEndpoint(endpoint);
        if (isAzure) {
          data.apiKey = 'n/a';
        }

        const emptyValues = Object.keys(data).filter((key) => {
          if (!isAzure && key.startsWith('azure')) {
            return false;
          }
          if (isOpenAIBase && key === 'baseURL') {
            return false;
          }
          if (key === 'baseURL' && !(userProvideURL ?? false)) {
            return false;
          }
          return data[key] === '';
        });

        if (emptyValues.length > 0) {
          showToast({
            message: 'The following fields are required: ' + emptyValues.join(', '),
            status: 'error',
          });
          onOpenChange(true);
          return;
        }

        const { apiKey, baseURL, ...azureOptions } = data;
        const userProvidedData = { apiKey, baseURL };
        if (isAzure) {
          userProvidedData.apiKey = JSON.stringify({
            azureOpenAIApiKey: azureOptions.azureOpenAIApiKey,
            azureOpenAIApiInstanceName: azureOptions.azureOpenAIApiInstanceName,
            azureOpenAIApiDeploymentName: azureOptions.azureOpenAIApiDeploymentName,
            azureOpenAIApiVersion: azureOptions.azureOpenAIApiVersion,
          });
        }

        saveKey(JSON.stringify(userProvidedData));
        methods.reset();
      })();
      return;
    }

    if (!userKey.trim()) {
      showToast({
        message: localize('com_ui_key_required'),
        status: NotificationSeverity.ERROR,
      });
      return;
    }

    saveKey(userKey);
    setUserKey('');
  };

  const EndpointComponent =
    endpointComponents[endpointType ?? endpoint] ?? endpointComponents['default'];
  const expiryTime = getExpiry();
  const config = endpointsConfig?.[endpoint];

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="w-11/12 max-w-2xl rounded-3xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 shadow-2xl backdrop-blur-2xl p-0 overflow-hidden flex flex-col">
        {/* Header estilo Somos SST / WAPPY */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              <KeyRound size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                {`${localize('com_endpoint_config_key_for')} ${alternateName[endpoint] ?? endpoint}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                Configura tus credenciales seguras para acceder a este modelo
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs shrink-0"
            onClick={() => onOpenChange(false)}
            title={localize('com_ui_close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido / Inputs */}
        <div className="flex flex-col gap-3 px-6 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs">
              <Clock size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                {expiryTime === 'never'
                  ? localize('com_endpoint_config_key_never_expires')
                  : `${localize('com_endpoint_config_key_encryption')} ${new Date(
                    expiryTime ?? 0,
                  ).toLocaleString()}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dropdown
                label="Expira "
                value={expiresAtLabel}
                onChange={handleExpirationChange}
                options={expirationOptions.map((option) => option.label)}
                sizeClasses="w-[170px]"
                portal={false}
              />
            </div>
          </div>

          <FormProvider {...methods}>
            <EndpointComponent
              userKey={userKey}
              setUserKey={setUserKey}
              endpoint={
                endpoint === EModelEndpoint.gptPlugins && (config?.azure ?? false)
                  ? EModelEndpoint.azureOpenAI
                  : endpoint
              }
              userProvideURL={userProvideURL}
            />
          </FormProvider>
          <HelpText endpoint={endpoint} />
        </div>

        {/* Footer con botones WAPPY */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
          <RevokeKeysButton
            endpoint={endpoint}
            disabled={!(expiryTime ?? '')}
            setDialogOpen={onOpenChange}
          />
          <button
            type="button"
            onClick={submit}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Check size={16} />
            <span>{localize('com_ui_submit')}</span>
          </button>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
};

export default SetKeyDialog;
