import React from 'react';
import { object, string } from 'zod';
import { Label } from '@librechat/client';
import { AuthKeys } from 'librechat-data-provider';
import type { TConfigProps } from '~/common';
import FileUpload from '~/components/Chat/Input/Files/FileUpload';
import { useLocalize, useMultipleKeys, useAuthContext } from '~/hooks';
import InputWithLabel from './InputWithLabel';

const CredentialsSchema = object({
  client_email: string().email().min(3),
  project_id: string().min(3),
  private_key: string().min(601),
});

const validateCredentials = (credentials: Record<string, unknown>) => {
  const result = CredentialsSchema.safeParse(credentials);
  return result.success;
};

const GoogleConfig = ({ userKey, setUserKey }: Pick<TConfigProps, 'userKey' | 'setUserKey'>) => {
  const localize = useLocalize();
  const { getMultiKey, setMultiKey } = useMultipleKeys(setUserKey);
  const { user } = useAuthContext();

  const [tenshiKeyStr, setTenshiKeyStr] = React.useState(() => {
    try {
      return localStorage.getItem('librechat_user_key_tenshi_google') || '';
    } catch {
      return '';
    }
  });

  const keyLimit = React.useMemo(() => {
    if (!user) return 1;
    switch (user.role) {
      case 'USER': return 1;
      case 'USER_GO': return 4;
      case 'USER_PLUS': return 10;
      case 'USER_PRO': return 10;
      case 'ADMIN': return 10;
      default: return 1;
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor={AuthKeys.GOOGLE_SERVICE_KEY} className="text-left text-xs font-bold text-slate-700 dark:text-zinc-200">
            {localize('com_endpoint_config_google_service_key')}
          </Label>
          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
            {localize('com_endpoint_config_google_cloud_platform')}
          </span>
        </div>
        <FileUpload
          id={AuthKeys.GOOGLE_SERVICE_KEY}
          className="w-full"
          containerClassName="rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 h-10 max-h-10 w-full resize-none py-2 text-xs transition-all"
          text={localize('com_endpoint_config_key_import_json_key')}
          successText={localize('com_endpoint_config_key_import_json_key_success')}
          invalidText={localize('com_endpoint_config_key_import_json_key_invalid')}
          validator={validateCredentials}
          onFileSelected={(data) => {
            setMultiKey(AuthKeys.GOOGLE_SERVICE_KEY, JSON.stringify(data), userKey);
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        {Array.from({ length: keyLimit }).map((_, index) => {
          const currentKeys = (getMultiKey(AuthKeys.GOOGLE_API_KEY, userKey) ?? '').split(',');
          // Ensure we always have elements up to the keyLimit securely, filling with empty strings if needed
          while (currentKeys.length < keyLimit) currentKeys.push('');

          return (
            <InputWithLabel
              key={index}
              id={`${AuthKeys.GOOGLE_API_KEY}-${index}`}
              value={currentKeys[index]?.trim() ?? ''}
              onChange={(e: { target: { value: string } }) => {
                const newKeys = [...currentKeys];
                newKeys[index] = e.target.value;
                // Join all keys with comma, even empty ones, to preserve position
                setMultiKey(AuthKeys.GOOGLE_API_KEY, newKeys.join(','), userKey);
              }}
              label={`${localize('com_endpoint_config_google_api_key')} ${index + 1}`}
              subLabel={index === 0 ? localize('com_endpoint_config_google_gemini_api') : ''}
            />
          );
        })}
      </div>

      <div className="my-2 pt-3 border-t border-slate-200/80 dark:border-zinc-800">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold mb-2">
          Claves API para Tenshi (Exclusivas)
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: 3 }).map((_, index) => {
            const currentTenshiKeys = tenshiKeyStr.split(',');
            while (currentTenshiKeys.length < 3) currentTenshiKeys.push('');

            return (
              <InputWithLabel
                key={`tenshi-${index}`}
                id={`tenshi-key-${index}`}
                value={currentTenshiKeys[index]?.trim() ?? ''}
                onChange={(e: { target: { value: string } }) => {
                  const newKeys = [...currentTenshiKeys];
                  newKeys[index] = e.target.value;
                  const combined = newKeys.join(',');
                  setTenshiKeyStr(combined);
                  localStorage.setItem('librechat_user_key_tenshi_google', combined);
                }}
                label={`Clave API Tenshi ${index + 1}`}
                subLabel={index === 0 ? "Claves Gemini exclusivas para el agente Tenshi" : ""}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GoogleConfig;
