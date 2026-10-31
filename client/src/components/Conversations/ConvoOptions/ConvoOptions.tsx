import { useState, useId, useRef, memo, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as Menu from '@ariakit/react/menu';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { request } from 'librechat-data-provider';
import { DropdownPopup, Spinner, useToastContext } from '@librechat/client';
import { Ellipsis, Share2, Copy, Archive, Pen, Trash, Pin, PinOff } from 'lucide-react';
import type { MouseEvent } from 'react';
import {
  useDuplicateConversationMutation,
  useGetStartupConfig,
  useArchiveConvoMutation,
} from '~/data-provider';
import { useLocalize, useNavigateToConvo, useNewConvo, useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';
import { NotificationSeverity } from '~/common';
import { useChatContext } from '~/Providers';
import DeleteButton from './DeleteButton';
import ShareButton from './ShareButton';
import {
  cn,
  getPinnedConvoIds,
  togglePinnedConvoLocal,
  updateConvoInAllQueries,
} from '~/utils';

function ConvoOptions({
  conversationId,
  title,
  retainView,
  renameHandler,
  isPopoverActive,
  setIsPopoverActive,
  isActiveConvo,
  tags,
  isPinned,
}: {
  conversationId: string | null;
  title: string | null;
  retainView: () => void;
  renameHandler: (e: MouseEvent) => void;
  isPopoverActive: boolean;
  setIsPopoverActive: React.Dispatch<React.SetStateAction<boolean>>;
  isActiveConvo: boolean;
  tags?: string[];
  isPinned?: boolean;
}) {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const { index } = useChatContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { navigateToConvo } = useNavigateToConvo(index);
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const { conversationId: currentConvoId } = useParams();
  const { newConversation } = useNewConvo();
  const { user } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || user?.role === 'USER_IPEVAR' || user?.role === 'IPEVAR';
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState('');
  const [upgradeModalDesc, setUpgradeModalDesc] = useState('');

  const currentlyPinned = useMemo(
    () =>
      Boolean(
        isPinned ||
          (Array.isArray(tags) && tags.includes('pinned')) ||
          (conversationId && getPinnedConvoIds().has(conversationId)),
      ),
    [isPinned, tags, conversationId],
  );

  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const archiveConvoMutation = useArchiveConvoMutation();

  const handlePinClick = useCallback(async () => {
    const convoId = conversationId ?? '';
    if (!convoId) {
      return;
    }
    const nextPinned = !currentlyPinned;
    togglePinnedConvoLocal(convoId, nextPinned);
    updateConvoInAllQueries(queryClient, convoId, (c) => ({
      ...c,
      tags: nextPinned
        ? Array.from(new Set([...(Array.isArray(c.tags) ? c.tags : []), 'pinned']))
        : (Array.isArray(c.tags) ? c.tags : []).filter((t) => t !== 'pinned'),
    }));
    setIsPopoverActive(false);
    showToast({
      message: nextPinned ? '📌 Chat anclado arriba' : 'Chat desanclado',
      status: 'success',
    });
    try {
      await request.post('/api/convos/pin', {
        conversationId: convoId,
        isPinned: nextPinned,
      });
    } catch {
      // Keep optimistic pin state in localStorage & query cache
    }
  }, [conversationId, currentlyPinned, queryClient, setIsPopoverActive, showToast]);

  const duplicateConversation = useDuplicateConversationMutation({
    onSuccess: (data) => {
      navigateToConvo(data.conversation);
      showToast({
        message: localize('com_ui_duplication_success'),
        status: 'success',
      });
      setIsPopoverActive(false);
    },
    onMutate: () => {
      showToast({
        message: localize('com_ui_duplication_processing'),
        status: 'info',
      });
    },
    onError: () => {
      showToast({
        message: localize('com_ui_duplication_error'),
        status: 'error',
      });
    },
  });

  const isDuplicateLoading = duplicateConversation.isLoading;
  const isArchiveLoading = archiveConvoMutation.isLoading;

  const handleShareClick = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleArchiveClick = useCallback(async () => {
    if (!isPro) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setUpgradeModalTitle("Archivado de Chats Bloqueado");
      setUpgradeModalDesc("El archivado de chats en tu cuenta gratuita está restringido para evitar el reinicio artificial del límite de conversaciones. Adquiere el Plan Pro para gestionar y archivar historiales de forma ilimitada.");
      setIsUpgradeModalOpen(true);
      setIsPopoverActive(false);
      return;
    }
    const convoId = conversationId ?? '';
    if (!convoId) {
      return;
    }

    archiveConvoMutation.mutate(
      { conversationId: convoId, isArchived: true },
      {
        onSuccess: () => {
          if (currentConvoId === convoId || currentConvoId === 'new') {
            newConversation();
            navigate('/c/new', { replace: true });
          }
          retainView();
          setIsPopoverActive(false);
        },
        onError: () => {
          showToast({
            message: localize('com_ui_archive_error'),
            severity: NotificationSeverity.ERROR,
            showIcon: true,
          });
        },
      },
    );
  }, [
    conversationId,
    currentConvoId,
    archiveConvoMutation,
    navigate,
    newConversation,
    retainView,
    setIsPopoverActive,
    showToast,
    localize,
    isPro,
  ]);

  const handleDuplicateClick = useCallback(() => {
    if (!isPro) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setUpgradeModalTitle("Duplicación de Chats Bloqueada");
      setUpgradeModalDesc("La duplicación de chats está reservada exclusivamente para cuentas PREMIUM del Plan Pro.");
      setIsUpgradeModalOpen(true);
      setIsPopoverActive(false);
      return;
    }
    duplicateConversation.mutate({
      conversationId: conversationId ?? '',
    });
  }, [conversationId, duplicateConversation, isPro, setIsPopoverActive]);

  const dropdownItems = useMemo(
    () => [
      {
        label: currentlyPinned ? 'Desanclar chat' : 'Anclar chat',
        onClick: handlePinClick,
        icon: currentlyPinned ? (
          <PinOff className="icon-sm mr-2 text-[#0D9488] dark:text-teal-400" />
        ) : (
          <Pin className="icon-sm mr-2 text-[#0D9488] dark:text-teal-400" />
        ),
      },
      {
        label: localize('com_ui_share'),
        onClick: handleShareClick,
        icon: <Share2 className="icon-sm mr-2 text-text-primary" />,
        show: startupConfig && startupConfig.sharedLinksEnabled,
        hideOnClick: false,
        ref: shareButtonRef,
        render: (props) => <button {...props} />,
      },
      {
        label: localize('com_ui_rename'),
        onClick: renameHandler,
        icon: <Pen className="icon-sm mr-2 text-text-primary" />,
      },
      {
        label: localize('com_ui_duplicate'),
        onClick: handleDuplicateClick,
        hideOnClick: false,
        icon: isDuplicateLoading ? (
          <Spinner className="size-4" />
        ) : (
          <Copy className="icon-sm mr-2 text-text-primary" />
        ),
      },
      {
        label: localize('com_ui_archive'),
        onClick: handleArchiveClick,
        hideOnClick: false,
        icon: isArchiveLoading ? (
          <Spinner className="size-4" />
        ) : (
          <Archive className="icon-sm mr-2 text-text-primary" />
        ),
      },
      {
        label: localize('com_ui_delete'),
        onClick: handleDeleteClick,
        icon: <Trash className="icon-sm mr-2 text-text-primary" />,
        hideOnClick: false,
        ref: deleteButtonRef,
        render: (props) => <button {...props} />,
      },
    ],
    [
      currentlyPinned,
      handlePinClick,
      localize,
      handleShareClick,
      startupConfig,
      renameHandler,
      handleDuplicateClick,
      isDuplicateLoading,
      handleArchiveClick,
      isArchiveLoading,
      handleDeleteClick,
    ],
  );

  const menuId = useId();

  return (
    <>
      <DropdownPopup
        portal={true}
        mountByState={true}
        unmountOnHide={true}
        preserveTabOrder={true}
        isOpen={isPopoverActive}
        setIsOpen={setIsPopoverActive}
        trigger={
          <Menu.MenuButton
            id={`conversation-menu-${conversationId}`}
            aria-label={localize('com_nav_convo_menu_options')}
            aria-readonly={undefined}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center gap-2 rounded-md border-none p-0 text-sm font-medium ring-ring-primary transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 bg-transparent hover:bg-surface-hover',
              isActiveConvo === true || isPopoverActive
                ? 'opacity-100'
                : 'opacity-0 focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 data-[open]:opacity-100',
            )}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
          >
            <Ellipsis className="icon-md text-text-secondary" aria-hidden={true} />
          </Menu.MenuButton>
        }
        items={dropdownItems}
        menuId={menuId}
        className="z-30"
      />
      {showShareDialog && (
        <ShareButton
          conversationId={conversationId ?? ''}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          triggerRef={shareButtonRef}
        />
      )}
      {showDeleteDialog && (
        <DeleteButton
          title={title ?? ''}
          retainView={retainView}
          triggerRef={deleteButtonRef}
          setMenuOpen={setIsPopoverActive}
          showDeleteDialog={showDeleteDialog}
          conversationId={conversationId ?? ''}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
      {isUpgradeModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm z-50"
            >
              Cerrar ✕
            </button>
            <UpgradeWall
              title={upgradeModalTitle}
              description={upgradeModalDesc}
              plan="USER_IPEVAR"
              isPopup={true}
              hideFeatures={true}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default memo(ConvoOptions, (prevProps, nextProps) => {
  return (
    prevProps.conversationId === nextProps.conversationId &&
    prevProps.title === nextProps.title &&
    prevProps.isPopoverActive === nextProps.isPopoverActive &&
    prevProps.isActiveConvo === nextProps.isActiveConvo &&
    prevProps.isPinned === nextProps.isPinned &&
    prevProps.tags === nextProps.tags
  );
});
