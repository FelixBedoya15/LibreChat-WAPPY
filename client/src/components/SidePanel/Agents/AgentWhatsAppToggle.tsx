import { useFormContext, Controller } from 'react-hook-form';
import {
  Checkbox,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  CircleHelpIcon,
} from '@librechat/client';
import type { AgentForm } from '~/common';
import { ESide } from '~/common';

/**
 * Toggle to mark an Agent as a WhatsApp-accessible Specialist.
 * Persists `is_whatsapp_enabled: true` to MongoDB via AgentPanel's onSubmit.
 */
export default function AgentWhatsAppToggle() {
  const methods = useFormContext<AgentForm>();
  const { control, setValue, getValues } = methods;

  const fieldName = 'is_whatsapp_enabled';

  return (
    <HoverCard openDelay={50}>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-500/25 bg-green-500/8 p-3 transition-all">
        <Controller
          name={fieldName}
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              checked={field.value || false}
              onCheckedChange={field.onChange}
              className="h-4 w-4 cursor-pointer"
              value={String(field.value ?? false)}
              aria-labelledby="whatsapp-specialist-label"
            />
          )}
        />
        <div className="flex flex-1 items-center gap-2">
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => setValue(fieldName, !getValues(fieldName), { shouldDirty: true })}
          >
            <span className="text-2xl">🔗</span>
            <label
              id="whatsapp-specialist-label"
              className="cursor-pointer font-semibold text-green-700 dark:text-green-400"
              htmlFor={fieldName}
            >
              Habilitar como Especialista de WhatsApp
            </label>
          </button>
          <HoverCardTrigger>
            <CircleHelpIcon className="h-4 w-4 text-green-500/60 hover:text-green-500 transition-colors" />
          </HoverCardTrigger>
        </div>
        <HoverCardPortal>
          <HoverCardContent side={ESide.Top} className="w-80">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-green-700 dark:text-green-400">🔗 Agente Especialista WhatsApp</p>
              <p className="text-gray-600 dark:text-gray-300">
                Al activar esta opción, el Agente Recepcionista (<strong>Profesional SST</strong>) podrá
                derivar consultas a este Agente directamente desde WhatsApp mediante la herramienta
                <strong> Consultar Agente Especializado</strong>.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                ⚠️ Solo actívalo en Agentes que estén completamente configurados y probados.
              </p>
            </div>
          </HoverCardContent>
        </HoverCardPortal>
      </div>
    </HoverCard>
  );
}
