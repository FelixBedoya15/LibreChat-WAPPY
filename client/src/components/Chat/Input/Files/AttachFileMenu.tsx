import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRecoilState } from 'recoil';
import * as Ariakit from '@ariakit/react';
import {
  FileSearch,
  ImageUpIcon,
  FileType2Icon,
  FileImageIcon,
  FileScan,
  TerminalSquareIcon,
} from 'lucide-react';
import {
  EToolResources,
  EModelEndpoint,
  defaultAgentCapabilities,
  isDocumentSupportedProvider,
} from 'librechat-data-provider';
import {
  FileUpload,
  TooltipAnchor,
  DropdownPopup,
  AttachmentIcon,
  SharePointIcon,
} from '@librechat/client';
import type { EndpointFileConfig } from 'librechat-data-provider';
import {
  useAgentToolPermissions,
  useAgentCapabilities,
  useGetAgentsConfig,
  useFileHandling,
  useLocalize,
  useAuthContext,
} from '~/hooks';
import useSharePointFileHandling from '~/hooks/Files/useSharePointFileHandling';
import { SharePointPickerDialog } from '~/components/SharePoint';
import { useGetStartupConfig } from '~/data-provider';
import { ephemeralAgentByConvoId } from '~/store';
import { MenuItemProps } from '~/common';
import { cn } from '~/utils';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

interface AttachFileMenuProps {
  agentId?: string | null;
  endpoint?: string | null;
  disabled?: boolean | null;
  conversationId: string;
  endpointType?: EModelEndpoint;
  endpointFileConfig?: EndpointFileConfig;
}

const AttachFileMenu = ({
  agentId,
  endpoint,
  disabled,
  endpointType,
  conversationId,
  endpointFileConfig,
}: AttachFileMenuProps) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const isUploadDisabled = disabled ?? false;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPopoverActive, setIsPopoverActive] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [ephemeralAgent, setEphemeralAgent] = useRecoilState(
    ephemeralAgentByConvoId(conversationId),
  );
  const [toolResource, setToolResource] = useState<EToolResources | undefined>();
  const { handleFileChange } = useFileHandling({
    overrideEndpoint: EModelEndpoint.agents,
    overrideEndpointFileConfig: endpointFileConfig,
  });
  const { handleSharePointFiles, isProcessing, downloadProgress } = useSharePointFileHandling({
    overrideEndpoint: EModelEndpoint.agents,
    overrideEndpointFileConfig: endpointFileConfig,
    toolResource,
  });

  const { agentsConfig } = useGetAgentsConfig();
  const { data: startupConfig } = useGetStartupConfig();
  const sharePointEnabled = startupConfig?.sharePointFilePickerEnabled;

  const [isSharePointDialogOpen, setIsSharePointDialogOpen] = useState(false);

  /** TODO: Ephemeral Agent Capabilities
   * Allow defining agent capabilities on a per-endpoint basis
   * Use definition for agents endpoint for ephemeral agents
   * */
  const capabilities = useAgentCapabilities(agentsConfig?.capabilities ?? defaultAgentCapabilities);

  const { fileSearchAllowedByAgent, codeAllowedByAgent, provider } = useAgentToolPermissions(
    agentId,
    ephemeralAgent,
  );

  const handleUploadClick = (
    fileType?: 'image' | 'image_video' | 'document' | 'multimodal' | 'google_multimodal',
  ) => {
    if (!inputRef.current) {
      return;
    }
    inputRef.current.value = '';
    if (fileType === 'image') {
      inputRef.current.accept = 'image/*';
    } else if (fileType === 'image_video') {
      inputRef.current.accept = 'image/*,video/*';
    } else if (fileType === 'document') {
      inputRef.current.accept = '.pdf,application/pdf';
    } else if (fileType === 'multimodal') {
      inputRef.current.accept =
        'image/*,.pdf,application/pdf,.csv,text/csv,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,application/msword,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,text/plain';
    } else if (fileType === 'google_multimodal') {
      inputRef.current.accept =
        'image/*,.pdf,application/pdf,video/*,audio/*,.csv,text/csv,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,application/msword,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,text/plain';
    } else {
      inputRef.current.accept = '';
    }
    inputRef.current.click();
    inputRef.current.accept = '';
  };

  const dropdownItems = useMemo(() => {
    const wrapClick = (originalClick: () => void) => {
      if (user?.role === 'USER') {
        return (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          setIsPopoverActive(false);
          setIsUpgradeModalOpen(true);
        };
      }
      return originalClick;
    };

    const createMenuItems = (
      onAction: (fileType?: 'image' | 'image_video' | 'document' | 'multimodal' | 'google_multimodal') => void,
    ) => {
      const items: MenuItemProps[] = [];

      const currentProvider = provider || endpoint;
      const isGoogle = (provider || endpoint) === EModelEndpoint.google;

      if (
        isDocumentSupportedProvider(endpointType) ||
        isDocumentSupportedProvider(currentProvider)
      ) {
        if (isGoogle) {
          // Google/Gemini: imágenes y videos en adjunto directo
          items.push({
            label: '📷 Imagen / Video',
            onClick: wrapClick(() => {
              setToolResource(undefined);
              onAction('image_video');
            }),
            icon: <FileImageIcon className="icon-md" />,
          });
          // Documentos: extraer texto automáticamente para que el modelo pueda leer el contenido
          if (capabilities.contextEnabled) {
            items.push({
              label: '📄 Documento',
              onClick: wrapClick(() => {
                setToolResource(EToolResources.context);
                onAction();
              }),
              icon: <FileScan className="icon-md" />,
            });
          } else {
            items.push({
              label: '📎 Adjunto directo',
              onClick: wrapClick(() => {
                setToolResource(undefined);
                onAction('google_multimodal');
              }),
              icon: <FileImageIcon className="icon-md" />,
            });
          }
        } else {
          items.push({
            label: '📎 Adjunto directo',
            onClick: wrapClick(() => {
              setToolResource(undefined);
              onAction('multimodal');
            }),
            icon: <FileImageIcon className="icon-md" />,
          });
        }
      } else {
        items.push({
          label: localize('com_ui_upload_image_input') + ' (Solo imagen)',
          onClick: wrapClick(() => {
            setToolResource(undefined);
            onAction('image');
          }),
          icon: <ImageUpIcon className="icon-md" />,
        });
      }

      // Para Google, 'Documento' ya cubre OCR — no duplicar
      if (capabilities.contextEnabled && !isGoogle) {
        items.push({
          label: '📝 Leer texto',
          onClick: wrapClick(() => {
            setToolResource(EToolResources.context);
            onAction();
          }),
          icon: <FileType2Icon className="icon-md" />,
        });
      }

      if (capabilities.fileSearchEnabled && fileSearchAllowedByAgent) {
        items.push({
          label: '🔍 Buscar en archivos',
          onClick: wrapClick(() => {
            setToolResource(EToolResources.file_search);
            setEphemeralAgent((prev) => ({
              ...prev,
              [EToolResources.file_search]: true,
            }));
            onAction();
          }),
          icon: <FileSearch className="icon-md" />,
        });
      }

      if (capabilities.codeEnabled && codeAllowedByAgent) {
        items.push({
          label: '💻 Ejecutar código',
          onClick: wrapClick(() => {
            setToolResource(EToolResources.execute_code);
            setEphemeralAgent((prev) => ({
              ...prev,
              [EToolResources.execute_code]: true,
            }));
            onAction();
          }),
          icon: <TerminalSquareIcon className="icon-md" />,
        });
      }

      return items;
    };

    const localItems = createMenuItems(handleUploadClick);

    if (sharePointEnabled) {
      const sharePointItems = createMenuItems(() => {
        setIsSharePointDialogOpen(true);
        // Note: toolResource will be set by the specific item clicked
      });
      localItems.push({
        label: localize('com_files_upload_sharepoint'),
        onClick: wrapClick(() => {}),
        icon: <SharePointIcon className="icon-md" />,
        subItems: sharePointItems,
      });
      return localItems;
    }

    return localItems;
  }, [
    localize,
    endpoint,
    provider,
    endpointType,
    capabilities,
    setToolResource,
    setEphemeralAgent,
    sharePointEnabled,
    codeAllowedByAgent,
    fileSearchAllowedByAgent,
    setIsSharePointDialogOpen,
    user?.role,
  ]);

  const menuTrigger = (
    <TooltipAnchor
      render={
        <Ariakit.MenuButton
          disabled={isUploadDisabled}
          id="attach-file-menu-button"
          aria-label="Attach File Options"
          className={cn(
            'flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
          )}
        >
          <div className="flex w-full items-center justify-center gap-2">
            <AttachmentIcon />
          </div>
        </Ariakit.MenuButton>
      }
      id="attach-file-menu-button"
      description={localize('com_sidepanel_attach_files')}
      disabled={disabled ?? false}
    />
  );

  const handleSharePointFilesSelected = async (sharePointFiles: any[]) => {
    try {
      await handleSharePointFiles(sharePointFiles);
      setIsSharePointDialogOpen(false);
    } catch (error) {
      console.error('SharePoint file processing error:', error);
    }
  };

  return (
    <>
      <FileUpload
        ref={inputRef}
        handleFileChange={(e) => {
          handleFileChange(e, toolResource);
        }}
      >
        <DropdownPopup
          menuId="attach-file-menu"
          className="overflow-visible"
          isOpen={isPopoverActive}
          setIsOpen={setIsPopoverActive}
          modal={true}
          unmountOnHide={true}
          trigger={menuTrigger}
          items={dropdownItems}
          iconClassName="mr-0"
        />
      </FileUpload>
      <SharePointPickerDialog
        isOpen={isSharePointDialogOpen}
        onOpenChange={setIsSharePointDialogOpen}
        onFilesSelected={handleSharePointFilesSelected}
        isDownloading={isProcessing}
        downloadProgress={downloadProgress}
        maxSelectionCount={endpointFileConfig?.fileLimit}
      />
      {isUpgradeModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm duration-300 animate-in zoom-in-95">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute -top-10 right-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300"
            >
              Cerrar ✕
            </button>
            <div className="overflow-hidden rounded-3xl bg-surface-primary shadow-2xl">
              <UpgradeWall
                title="Carga de Archivos Exclusiva"
                description="La carga de archivos y herramientas de análisis avanzadas en el chat están reservadas para usuarios de los planes Wappy Vital y Wappy Pro."
                plan="USER"
                isPopup={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default React.memo(AttachFileMenu);
