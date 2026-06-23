import { useMemo } from 'react';
import { OGDialog, DialogTemplate, useToastContext } from '@librechat/client';
import type { TTermsOfService } from 'librechat-data-provider';
import MarkdownLite from '~/components/Chat/Messages/Content/MarkdownLite';
import { useAcceptTermsMutation } from '~/data-provider';
import { useLocalize } from '~/hooks';

const TermsAndConditionsModal = ({
  open,
  onOpenChange,
  onAccept,
  onDecline,
  title,
  modalContent,
}: {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
  title?: string;
  contentUrl?: string;
  modalContent?: TTermsOfService['modalContent'];
}) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const acceptTermsMutation = useAcceptTermsMutation({
    onSuccess: () => {
      onAccept();
      onOpenChange(false);
    },
    onError: () => {
      showToast({ message: 'Failed to accept terms' });
    },
  });

  const handleAccept = () => {
    acceptTermsMutation.mutate();
  };

  const handleDecline = () => {
    onDecline();
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (open && !isOpen) {
      return;
    }
    onOpenChange(isOpen);
  };

  const content = useMemo(() => {
    let str = '';
    if (typeof modalContent === 'string') {
      str = modalContent;
    } else if (Array.isArray(modalContent)) {
      str = modalContent.join('\n');
    }

    if (str === 'com_ui_terms_content') {
      str = localize('com_ui_terms_content');
    }

    // Remove duplicate title header at the beginning of the terms text
    str = str.replace(/^#\s+.*\n+/, '');

    return str;
  }, [modalContent, localize]);

  const displayTitle = useMemo(() => {
    if (title === 'com_ui_terms_title') {
      return localize('com_ui_terms_title');
    }
    return title ?? localize('com_ui_terms_and_conditions');
  }, [title, localize]);

  return (
    <OGDialog open={open} onOpenChange={handleOpenChange}>
      <DialogTemplate
        title={displayTitle}
        className="w-11/12 max-w-2xl overflow-hidden rounded-3xl border border-border-light bg-surface-primary shadow-2xl dark:border-border-heavy dark:shadow-black/40 sm:w-3/4 md:w-1/2 lg:w-2/5"
        headerClassName="border-b border-border-light dark:border-border-heavy bg-surface-secondary/40 py-5 px-6"
        footerClassName="border-t border-border-light dark:border-border-heavy bg-surface-secondary/20 py-4 px-6"
        showCloseButton={false}
        showCancelButton={false}
        main={
          <section
            tabIndex={0}
            className="bg-surface-secondary/50 dark:bg-surface-secondary/30 scrollbar-thin scrollbar-thumb-border-medium max-h-[50vh] overflow-y-auto rounded-2xl border border-border-light p-5 shadow-inner focus:outline-none dark:border-border-heavy"
            aria-label={localize('com_ui_terms_and_conditions')}
          >
            <div className="prose prose-sm dark:prose-invert w-full max-w-none !text-text-primary">
              {content !== '' ? (
                <MarkdownLite content={content} />
              ) : (
                <p>{localize('com_ui_no_terms_content')}</p>
              )}
            </div>
          </section>
        }
        buttons={
          <>
            <button
              onClick={handleDecline}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border-light bg-surface-primary px-5 py-2 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-border-medium active:scale-[0.98] dark:border-border-medium"
            >
              {localize('com_ui_decline')}
            </button>
            <button
              onClick={handleAccept}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-green-500/15 transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] dark:focus:ring-offset-zinc-900"
            >
              {localize('com_ui_accept')}
            </button>
          </>
        }
      />
    </OGDialog>
  );
};

export default TermsAndConditionsModal;
