import React from 'react';
import { EarthIcon, GripVertical } from 'lucide-react';
import { isAgentsEndpoint, isAssistantsEndpoint } from 'librechat-data-provider';
import type { Endpoint } from '~/common';
import { useModelSelectorContext } from '../ModelSelectorContext';
import { CustomMenuItem as MenuItem } from '../CustomMenu';
import { cn } from '~/utils';

interface EndpointModelItemProps extends React.HTMLAttributes<HTMLDivElement> {
  modelId: string | null;
  endpoint: Endpoint;
  isSelected: boolean;
  dragRef?: React.Ref<HTMLDivElement>;
}

export const EndpointModelItem = React.forwardRef<HTMLDivElement, EndpointModelItemProps>(
  ({ modelId, endpoint, isSelected, dragRef, ...props }, ref) => {
    const { handleSelectModel } = useModelSelectorContext();
    let isGlobal = false;
    let modelName = modelId;
    const avatarUrl = endpoint?.modelIcons?.[modelId ?? ''] || null;

    // Use custom names if available
    if (endpoint && modelId && isAgentsEndpoint(endpoint.value) && endpoint.agentNames?.[modelId]) {
      modelName = endpoint.agentNames[modelId];

      const modelInfo = endpoint?.models?.find((m) => m.name === modelId);
      isGlobal = modelInfo?.isGlobal ?? false;
    } else if (
      endpoint &&
      modelId &&
      isAssistantsEndpoint(endpoint.value) &&
      endpoint.assistantNames?.[modelId]
    ) {
      modelName = endpoint.assistantNames[modelId];
    }

    return (
      <MenuItem
        ref={ref}
        key={modelId}
        onClick={() => handleSelectModel(endpoint, modelId ?? '')}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between rounded-lg px-2 text-sm',
          props.className,
        )}
        {...props}
      >
        <div className="flex w-full min-w-0 items-center gap-2 px-1 py-1">
          {dragRef && (
            <div
              ref={dragRef as React.Ref<HTMLDivElement>}
              className="mr-1 flex cursor-grab select-none items-center justify-center text-text-secondary hover:text-text-primary active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          {avatarUrl ? (
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
              <img src={avatarUrl} alt={modelName ?? ''} className="h-full w-full object-cover" />
            </div>
          ) : (isAgentsEndpoint(endpoint.value) || isAssistantsEndpoint(endpoint.value)) &&
            endpoint.icon ? (
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
              {endpoint.icon}
            </div>
          ) : null}
          <span className="truncate text-left">{modelName}</span>
          {isGlobal && (
            <EarthIcon className="ml-auto size-4 flex-shrink-0 self-center text-green-400" />
          )}
        </div>
        {isSelected && (
          <div className="flex-shrink-0 self-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM16.0755 7.93219C16.5272 8.25003 16.6356 8.87383 16.3178 9.32549L11.5678 16.0755C11.3931 16.3237 11.1152 16.4792 10.8123 16.4981C10.5093 16.517 10.2142 16.3973 10.0101 16.1727L7.51006 13.4227C7.13855 13.014 7.16867 12.3816 7.57733 12.0101C7.98598 11.6386 8.61843 11.6687 8.98994 12.0773L10.6504 13.9039L14.6822 8.17451C15 7.72284 15.6238 7.61436 16.0755 7.93219Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </MenuItem>
    );
  }
);

export function renderEndpointModels(
  endpoint: Endpoint | null,
  models: Array<{ name: string; isGlobal?: boolean; category?: string }>,
  selectedModel: string | null,
  filteredModels?: string[],
) {
  const modelsToRender = models.filter((m) => !filteredModels || filteredModels.includes(m.name));

  const CATEGORY_MAP = {
    'gestion_consultoria_sg_sst': 'Gestión y Consultoría del SG-SST',
    'legal_cumplimiento': 'Legal y Cumplimiento',
    'especialistas_riesgos_especificos': 'Especialistas en Riesgos Específicos',
    'investigacion_inspeccion': 'Investigación e Inspección',
    'ergonomia_salud_bienestar': 'Ergonomía, Salud y Bienestar',
    'operaciones_campo_capacitacion': 'Operaciones de Campo y Capacitación',
    'gestion_ambiental': 'Gestión Ambiental',
    'general': 'General',
  };

  const grouped = modelsToRender.reduce((acc, model) => {
    const cat = CATEGORY_MAP[model.category || ''] ? (model.category || '') : 'general';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  return (
    <div>
      {Object.entries(CATEGORY_MAP).map(([catValue, catLabel]) => {
        const groupItems = grouped[catValue] || [];
        if (groupItems.length === 0) {
          return null;
        }
        return (
          <div key={catValue} className="mb-2">
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary bg-surface-secondary/50 rounded-md my-1 select-none">
              {catLabel}
            </div>
            {groupItems.map(
              (model) =>
                endpoint && (
                  <EndpointModelItem
                    key={model.name}
                    modelId={model.name}
                    endpoint={endpoint}
                    isSelected={selectedModel === model.name}
                  />
                ),
            )}
          </div>
        );
      })}
    </div>
  );
}
