import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileUpload, TooltipAnchor, AttachmentIcon } from '@librechat/client';
import { useLocalize, useFileHandling, useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

const AttachFile = ({ disabled }: { disabled?: boolean | null }) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isUploadDisabled = disabled ?? false;
  const isLocked = user?.role === 'USER';

  const { handleFileChange } = useFileHandling();

  const handleTriggerClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      setIsUpgradeModalOpen(true);
      return;
    }
    if (!inputRef.current) {
      return;
    }
    inputRef.current.value = '';
    inputRef.current.click();
  };

  return (
    <>
      <FileUpload ref={inputRef} handleFileChange={handleFileChange}>
        <TooltipAnchor
          description={localize('com_sidepanel_attach_files')}
          id="attach-file"
          disabled={disabled ?? false}
          render={
            <button
              type="button"
              aria-label={localize('com_sidepanel_attach_files')}
              disabled={isUploadDisabled}
              className={cn(
                'flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
              )}
              onKeyDownCapture={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTriggerClick(e);
                }
              }}
              onClick={(e) => {
                handleTriggerClick(e);
              }}
            >
              <div className="flex w-full items-center justify-center gap-2">
                <AttachmentIcon />
              </div>
            </button>
          }
        />
      </FileUpload>
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

export default React.memo(AttachFile);
