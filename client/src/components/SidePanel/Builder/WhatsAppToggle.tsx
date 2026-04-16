import { useFormContext, Controller } from 'react-hook-form';
import {
  Checkbox,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  CircleHelpIcon,
} from '@librechat/client';
import type { AssistantForm } from '~/common';
import { ESide } from '~/common';
import { cn } from '~/utils';

export default function WhatsAppToggle() {
  const methods = useFormContext<AssistantForm>();
  const { control, setValue, getValues } = methods;
  
  // Custom name that maps exactly to our TypeScript schema and Backend Inject
  const fieldName = 'is_whatsapp_enabled';

  return (
    <>
      <HoverCard openDelay={50}>
        <div className="flex items-center mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                checked={field.value || false}
                onCheckedChange={field.onChange}
                className="relative float-left mr-2 inline-flex h-4 w-4 cursor-pointer text-green-600"
                value={field.value?.toString()}
                aria-labelledby={fieldName}
              />
            )}
          />
          <button
            type="button"
            className="flex items-center space-x-2"
            onClick={() =>
              setValue(fieldName, !getValues(fieldName), {
                shouldDirty: true,
              })
            }
          >
            <label
              id={fieldName}
              className="form-check-label text-green-700 dark:text-green-400 font-bold w-full cursor-pointer"
              htmlFor={fieldName}
            >
              Habilitar acceso desde WhatsApp
            </label>
            <HoverCardTrigger>
              <CircleHelpIcon className="h-5 w-5 text-green-500/70" />
            </HoverCardTrigger>
          </button>
          <HoverCardPortal>
            <HoverCardContent side={ESide.Top} className="w-80">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Activa esta casilla si deseas que este Agente Especialista pueda ser consultado directamente mediante WhatsApp por parte del Recepcionista Automático.
                </p>
              </div>
            </HoverCardContent>
          </HoverCardPortal>
        </div>
      </HoverCard>
    </>
  );
}
