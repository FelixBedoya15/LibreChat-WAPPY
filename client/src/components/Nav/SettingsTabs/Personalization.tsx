import { useState, useEffect, useMemo } from 'react';
import { Switch, useToastContext, Dropdown } from '@librechat/client';
import { useGetUserQuery, useUpdateMemoryPreferencesMutation, useGetEndpointsQuery } from '~/data-provider';
// import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import { EModelEndpoint } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

interface PersonalizationProps {
  hasMemoryOptOut: boolean;
  hasAnyPersonalizationFeature: boolean;
}

export default function Personalization({
  hasMemoryOptOut,
  hasAnyPersonalizationFeature,
}: PersonalizationProps) {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data: user } = useGetUserQuery();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const [referenceSavedMemories, setReferenceSavedMemories] = useState(true);

  // Estado para los modelos Gemini
  const [geminiModels, setGeminiModels] = useState({
    generalChat: '',
    agents: '',
    sstManagement: '',
    liveAnalysis: '',
    textCorrection: '',
    reportGeneration: '',
  });

  const updateMemoryPreferencesMutation = useUpdateMemoryPreferencesMutation({
    onSuccess: () => {
      showToast({
        message: localize('com_ui_preferences_updated', { defaultValue: 'Preferencias actualizadas' }),
        status: 'success',
      });
    },
    onError: () => {
      showToast({
        message: localize('com_ui_error_updating_preferences', { defaultValue: 'Error al actualizar preferencias' }),
        status: 'error',
      });
      // Revert the toggle on error
      if (user?.personalization?.memories !== undefined) {
        setReferenceSavedMemories(user.personalization.memories);
      }
      if (user?.personalization?.geminiModels !== undefined) {
        setGeminiModels({
          generalChat: user.personalization.geminiModels.generalChat || '',
          agents: user.personalization.geminiModels.agents || '',
          sstManagement: user.personalization.geminiModels.sstManagement || '',
          liveAnalysis: user.personalization.geminiModels.liveAnalysis || '',
          textCorrection: user.personalization.geminiModels.textCorrection || '',
          reportGeneration: user.personalization.geminiModels.reportGeneration || '',
        });
      }
    },
  });

  // Initialize state from user data
  useEffect(() => {
    if (user?.personalization?.memories !== undefined) {
      setReferenceSavedMemories(user.personalization.memories);
    }
  }, [user?.personalization?.memories]);

  useEffect(() => {
    if (user?.personalization?.geminiModels) {
      setGeminiModels({
        generalChat: user.personalization.geminiModels.generalChat || 'gemini-3.1-flash-lite-preview',
        agents: user.personalization.geminiModels.agents || 'gemini-3.1-flash-lite-preview',
        sstManagement: user.personalization.geminiModels.sstManagement || 'gemini-3.1-flash-lite-preview',
        liveAnalysis: user.personalization.geminiModels.liveAnalysis || 'gemini-2.5-flash-native-audio-preview-09-2025',
        textCorrection: user.personalization.geminiModels.textCorrection || 'gemini-2.5-flash',
        reportGeneration: user.personalization.geminiModels.reportGeneration || 'gemini-3.1-flash-lite-preview',
      });
    } else {
      // Set defaults if no data exists
      setGeminiModels({
        generalChat: 'gemini-3.1-flash-lite-preview',
        agents: 'gemini-3.1-flash-lite-preview',
        sstManagement: 'gemini-3.1-flash-lite-preview',
        liveAnalysis: 'gemini-2.5-flash-native-audio-preview-09-2025',
        textCorrection: 'gemini-2.5-flash',
        reportGeneration: 'gemini-3.1-flash-lite-preview',
      });
    }
  }, [user?.personalization?.geminiModels]);

  const handleMemoryToggle = (checked: boolean) => {
    setReferenceSavedMemories(checked);
    updateMemoryPreferencesMutation.mutate({ memories: checked, geminiModels });
  };

  const handleModelChange = (key: string) => (value: string) => {
    const newModels = { ...geminiModels, [key]: value };
    setGeminiModels(newModels);
    updateMemoryPreferencesMutation.mutate({ memories: referenceSavedMemories, geminiModels: newModels });
  };

  const modelOptions = useMemo(() => {
    const googleEndpoint = endpointsConfig?.[EModelEndpoint.google];
    let googleModels = googleEndpoint?.models || [];
    
    // Fallback to explicitly defined GOOGLE_MODELS if backend omits them
    if (googleModels.length === 0) {
      googleModels = [
        'gemini-3.1-flash-lite-preview',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash-native-audio-preview-12-2025',
        'gemini-2.5-flash-native-audio-preview-09-2025'
      ];
    }

    const options = [
      { value: '', label: 'Predeterminado del sistema' },
    ];

    googleModels.forEach((model) => {
      const modelId = typeof model === 'string' ? model : (model as any).id || (model as any).value;
      const modelLabel = typeof model === 'string' ? model : (model as any).name || (model as any).label || modelId;
      if (modelId) {
        options.push({ value: modelId, label: modelLabel });
      }
    });

    return options;
  }, [endpointsConfig]);

  if (!hasAnyPersonalizationFeature) {
    return (
      <div className="flex flex-col gap-4 text-sm text-text-primary">
        <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
          <div className="text-text-secondary">No hay funciones de personalización disponibles por el momento.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-sm text-text-primary">
      {/* Tarjeta de Configuración de Memoria */}
      {hasMemoryOptOut && (
        <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
          <h3 className="mb-4 text-lg font-medium text-text-primary">Memoria Personal</h3>

          <div className="flex items-center justify-between">
            <div>
              <div id="reference-saved-memories-label" className="flex items-center gap-2 font-medium">
                Hacer referencia a detalles anteriores
              </div>
              <div
                id="reference-saved-memories-description"
                className="mt-1 text-xs text-text-secondary"
              >
                La IA recordará detalles y preferencias de tus conversaciones anteriores para darte respuestas más personalizadas.
              </div>
            </div>
            <Switch
              checked={referenceSavedMemories}
              onCheckedChange={handleMemoryToggle}
              disabled={updateMemoryPreferencesMutation.isLoading}
              aria-labelledby="reference-saved-memories-label"
              aria-describedby="reference-saved-memories-description"
              className="ml-4"
            />
          </div>
        </div>
      )}

      {/* Tarjeta de Modelos Gemini IA */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <h3 className="mb-2 text-lg font-medium text-text-primary">
          {localize('com_ui_gemini_models_title', { defaultValue: 'Modelos Gemini IA' })}
        </h3>
        <p className="mb-6 text-xs text-text-secondary">
          {localize('com_ui_gemini_models_desc', { defaultValue: 'Gestiona los modelos de Gemini predeterminados para cada aplicativo del sistema.' })}
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div id="gemini-chat-label" className="font-medium">
              {localize('com_ui_gemini_chat', { defaultValue: 'Chat General' })}
            </div>
            <Dropdown
              value={geminiModels.generalChat || ''}
              onChange={handleModelChange('generalChat')}
              options={modelOptions}
              sizeClasses="w-[280px] z-[100]"
              aria-labelledby="gemini-chat-label"
            />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          
          <div className="flex items-center justify-between">
            <div id="gemini-agents-label" className="font-medium">
              {localize('com_ui_gemini_agents', { defaultValue: 'Agentes' })}
            </div>
            <Dropdown
              value={geminiModels.agents || ''}
              onChange={handleModelChange('agents')}
              options={modelOptions}
              sizeClasses="w-[280px] z-[100]"
              aria-labelledby="gemini-agents-label"
            />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          
          <div className="flex items-center justify-between">
            <div id="gemini-sst-label" className="font-medium">
              {localize('com_ui_gemini_sst', { defaultValue: 'Somos SST' })}
            </div>
            <Dropdown
              value={geminiModels.sstManagement || ''}
              onChange={handleModelChange('sstManagement')}
              options={modelOptions}
              sizeClasses="w-[280px] z-[100]"
              aria-labelledby="gemini-sst-label"
            />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center justify-between">
            <div id="gemini-live-label" className="font-medium">
              {localize('com_ui_gemini_live', { defaultValue: 'Análisis y Chat en Vivo (Live)' })}
            </div>
            <Dropdown
              value={geminiModels.liveAnalysis || ''}
              onChange={handleModelChange('liveAnalysis')}
              options={modelOptions}
              sizeClasses="w-[280px] z-[100]"
              aria-labelledby="gemini-live-label"
            />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center justify-between">
            <div id="gemini-correction-label" className="font-medium">
              {localize('com_ui_gemini_correction', { defaultValue: 'Corrección de Texto (Voz)' })}
            </div>
            <Dropdown
              value={geminiModels.textCorrection || ''}
              onChange={handleModelChange('textCorrection')}
              options={modelOptions}
              sizeClasses="w-[280px] z-[100]"
              aria-labelledby="gemini-correction-label"
            />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center justify-between">
            <div id="gemini-report-label" className="font-medium">
              {localize('com_ui_gemini_report', { defaultValue: 'Generación de Informe SST' })}
            </div>
            <Dropdown
              value={geminiModels.reportGeneration || ''}
              onChange={handleModelChange('reportGeneration')}
              options={modelOptions}
              sizeClasses="w-[280px] z-[100]"
              aria-labelledby="gemini-report-label"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
