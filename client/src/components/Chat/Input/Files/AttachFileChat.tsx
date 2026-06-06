import { memo, useMemo } from 'react';
import {
  Constants,
  supportsFiles,
  EModelEndpoint,
  mergeFileConfig,
  isAgentsEndpoint,
  isAssistantsEndpoint,
  fileConfig as defaultFileConfig,
} from 'librechat-data-provider';
import type { EndpointFileConfig, TConversation } from 'librechat-data-provider';
import { useGetFileConfig, useGetEndpointsQuery } from '~/data-provider';
import { useAuthContext } from '~/hooks';
import { getEndpointField } from '~/utils/endpoints';
import AttachFileMenu from './AttachFileMenu';
import AttachFile from './AttachFile';

function AttachFileChat({
  disableInputs,
  conversation,
}: {
  disableInputs: boolean;
  conversation: TConversation | null;
}) {
  const { user } = useAuthContext();
  const conversationId = conversation?.conversationId ?? Constants.NEW_CONVO;
  const { endpoint } = conversation ?? { endpoint: null };
  const isAgents = useMemo(() => isAgentsEndpoint(endpoint), [endpoint]);
  const isAssistants = useMemo(() => isAssistantsEndpoint(endpoint), [endpoint]);

  const { data: fileConfig = defaultFileConfig } = useGetFileConfig({
    select: (data) => mergeFileConfig(data),
  });

  const { data: endpointsConfig } = useGetEndpointsQuery();

  const endpointType = useMemo(() => {
    return (
      getEndpointField(endpointsConfig, endpoint, 'type') ||
      (endpoint as EModelEndpoint | undefined)
    );
  }, [endpoint, endpointsConfig]);

  const endpointFileConfig = fileConfig.endpoints[endpoint ?? ''] as EndpointFileConfig | undefined;
  const endpointSupportsFiles: boolean = supportsFiles[endpointType ?? endpoint ?? ''] ?? false;
  const isUploadDisabled = (disableInputs || endpointFileConfig?.disabled) ?? false;
  const isLocked = user?.role === 'USER';

  if (isLocked) {
    // Para usuarios locked (Gratis), siempre queremos mostrar el menú de opciones
    // al dar clic al clip, y luego lanzar el modal al seleccionar alguna opción.
    if (isAgents || isAssistants || endpointSupportsFiles) {
      return (
        <AttachFileMenu
          endpoint={endpoint}
          disabled={disableInputs}
          endpointType={endpointType}
          conversationId={conversationId}
          agentId={conversation?.agent_id}
          endpointFileConfig={endpointFileConfig}
        />
      );
    }
    return null;
  }

  if (isAssistants && endpointSupportsFiles && !isUploadDisabled) {
    return <AttachFile disabled={disableInputs} />;
  } else if (isAgents || (endpointSupportsFiles && !isUploadDisabled)) {
    return (
      <AttachFileMenu
        endpoint={endpoint}
        disabled={disableInputs}
        endpointType={endpointType}
        conversationId={conversationId}
        agentId={conversation?.agent_id}
        endpointFileConfig={endpointFileConfig}
      />
    );
  }
  return null;
}

export default memo(AttachFileChat);

