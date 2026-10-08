import { useCallback, useState, useMemo, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { useRecoilValue } from 'recoil';
import { Link } from 'react-router-dom';
import { TrashIcon, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import { WappyExpandButton } from '../WappyExpandButton';
import type { SharedLinkItem, SharedLinksListParams } from 'librechat-data-provider';
import {
  OGDialog,
  useToastContext,
  OGDialogTemplate,
  OGDialogTrigger,
  OGDialogContent,
  useMediaQuery,
  OGDialogHeader,
  OGDialogTitle,
  DataTable,
  Spinner,
  Button,
  Label,
} from '@librechat/client';
import { useDeleteSharedLinkMutation, useSharedLinksQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';
import { NotificationSeverity } from '~/common';
import { formatDate } from '~/utils';
import store from '~/store';

const PAGE_SIZE = 25;

const DEFAULT_PARAMS: SharedLinksListParams = {
  pageSize: PAGE_SIZE,
  isPublic: true,
  sortBy: 'createdAt',
  sortDirection: 'desc',
  search: '',
};

export default function SharedLinks() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const isSearchEnabled = useRecoilValue(store.search);
  const [queryParams, setQueryParams] = useState<SharedLinksListParams>(DEFAULT_PARAMS);
  const [deleteRow, setDeleteRow] = useState<SharedLinkItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } =
    useSharedLinksQuery(queryParams, {
      enabled: isOpen,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  const handleSort = useCallback((sortField: string, sortOrder: 'asc' | 'desc') => {
    setQueryParams((prev) => ({
      ...prev,
      sortBy: sortField as 'title' | 'createdAt',
      sortDirection: sortOrder,
    }));
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    const encodedValue = encodeURIComponent(value.trim());
    setQueryParams((prev) => ({
      ...prev,
      search: encodedValue,
    }));
  }, []);

  const debouncedFilterChange = useMemo(
    () => debounce(handleFilterChange, 300),
    [handleFilterChange],
  );

  useEffect(() => {
    return () => {
      debouncedFilterChange.cancel();
    };
  }, [debouncedFilterChange]);

  const allLinks = useMemo(() => {
    if (!data?.pages) {
      return [];
    }

    return data.pages.flatMap((page) => page.links.filter(Boolean));
  }, [data?.pages]);

  const deleteMutation = useDeleteSharedLinkMutation({
    onSuccess: async () => {
      setIsDeleteOpen(false);
      setDeleteRow(null);
      await refetch();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      showToast({
        message: localize('com_ui_share_delete_error'),
        severity: NotificationSeverity.ERROR,
      });
    },
  });

  const handleDelete = useCallback(
    async (selectedRows: SharedLinkItem[]) => {
      const validRows = selectedRows.filter(
        (row) => typeof row.shareId === 'string' && row.shareId.length > 0,
      );

      if (validRows.length === 0) {
        showToast({
          message: localize('com_ui_no_valid_items'),
          severity: NotificationSeverity.WARNING,
        });
        return;
      }

      try {
        for (const row of validRows) {
          await deleteMutation.mutateAsync({ shareId: row.shareId });
        }

        showToast({
          message: localize(
            validRows.length === 1
              ? 'com_ui_shared_link_delete_success'
              : 'com_ui_shared_link_bulk_delete_success',
          ),
          severity: NotificationSeverity.SUCCESS,
        });
      } catch (error) {
        console.error('Failed to delete shared links:', error);
        showToast({
          message: localize('com_ui_bulk_delete_error'),
          severity: NotificationSeverity.ERROR,
        });
      }
    },
    [deleteMutation, showToast, localize],
  );

  const handleFetchNextPage = useCallback(async () => {
    if (hasNextPage !== true || isFetchingNextPage) {
      return;
    }
    await fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const confirmDelete = useCallback(() => {
    if (deleteRow) {
      handleDelete([deleteRow]);
    }
    setIsDeleteOpen(false);
  }, [deleteRow, handleDelete]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: () => {
          const isSorted = queryParams.sortBy === 'title';
          const sortDirection = queryParams.sortDirection;
          return (
            <Button
              variant="ghost"
              className="px-2 py-0 text-xs hover:bg-surface-hover sm:px-2 sm:py-2 sm:text-sm"
              onClick={() =>
                handleSort('title', isSorted && sortDirection === 'asc' ? 'desc' : 'asc')
              }
            >
              {localize('com_ui_name')}
              {isSorted && sortDirection === 'asc' && (
                <ArrowUp className="ml-2 h-3 w-4 sm:h-4 sm:w-4" />
              )}
              {isSorted && sortDirection === 'desc' && (
                <ArrowDown className="ml-2 h-3 w-4 sm:h-4 sm:w-4" />
              )}
              {!isSorted && <ArrowUpDown className="ml-2 h-3 w-4 sm:h-4 sm:w-4" />}
            </Button>
          );
        },
        cell: ({ row }) => {
          const { title, shareId } = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                to={`/share/${shareId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-blue-500 hover:underline"
                title={title}
              >
                {title}
              </Link>
            </div>
          );
        },
        meta: {
          size: '35%',
          mobileSize: '50%',
        },
      },
      {
        accessorKey: 'createdAt',
        header: () => {
          const isSorted = queryParams.sortBy === 'createdAt';
          const sortDirection = queryParams.sortDirection;
          return (
            <Button
              variant="ghost"
              className="px-2 py-0 text-xs hover:bg-surface-hover sm:px-2 sm:py-2 sm:text-sm"
              onClick={() =>
                handleSort('createdAt', isSorted && sortDirection === 'asc' ? 'desc' : 'asc')
              }
            >
              {localize('com_ui_date')}
              {isSorted && sortDirection === 'asc' && (
                <ArrowUp className="ml-2 h-3 w-4 sm:h-4 sm:w-4" />
              )}
              {isSorted && sortDirection === 'desc' && (
                <ArrowDown className="ml-2 h-3 w-4 sm:h-4 sm:w-4" />
              )}
              {!isSorted && <ArrowUpDown className="ml-2 h-3 w-4 sm:h-4 sm:w-4" />}
            </Button>
          );
        },
        cell: ({ row }) => formatDate(row.original.createdAt?.toString() ?? '', isSmallScreen),
        meta: {
          size: '10%',
          mobileSize: '20%',
        },
      },
      {
        accessorKey: 'actions',
        header: () => (
          <Label className="px-2 py-0 text-xs hover:bg-surface-hover sm:px-2 sm:py-2 sm:text-sm">
            {localize('com_assistants_actions')}
          </Label>
        ),
        meta: {
          size: '7%',
          mobileSize: '25%',
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                window.open(`/c/${row.original.conversationId}`, '_blank');
              }}
              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 shadow-2xs transition-all duration-300 active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 cursor-pointer"
              aria-label={`${localize('com_ui_view_source')} - ${row.original.title || localize('com_ui_untitled')}`}
              title={localize('com_ui_view_source') || 'Ver chat'}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                <span className="text-[10px] font-bold">{localize('com_ui_view_source') || 'Ver'}</span>
              </div>
            </button>
            <button
              onClick={() => {
                setDeleteRow(row.original);
                setIsDeleteOpen(true);
              }}
              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 shadow-2xs transition-all duration-300 active:scale-95 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 cursor-pointer"
              aria-label={`${localize('com_ui_delete')} - ${row.original.title || localize('com_ui_untitled')}`}
              title={localize('com_ui_delete') || 'Eliminar'}
            >
              <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                <span className="text-[10px] font-bold">{localize('com_ui_delete') || 'Eliminar'}</span>
              </div>
            </button>
          </div>
        ),
      },
    ],
    [isSmallScreen, localize, queryParams, handleSort],
  );

  return (
    <div className="flex items-center justify-between">
      <Label id="shared-links-label">{localize('com_nav_shared_links')}</Label>

      <OGDialog open={isOpen} onOpenChange={setIsOpen}>
        <OGDialogTrigger asChild onClick={() => setIsOpen(true)}>
          <WappyExpandButton
            variant="teal"
            aria-labelledby="shared-links-label"
            icon={<Share2 className="w-4 h-4" />}
            label={localize('com_ui_manage')}
          />
        </OGDialogTrigger>

        <OGDialogContent
          title={localize('com_nav_my_files')}
          className="w-11/12 max-w-5xl bg-background text-text-primary shadow-2xl"
        >
          <OGDialogHeader>
            <OGDialogTitle>{localize('com_nav_shared_links')}</OGDialogTitle>
          </OGDialogHeader>
          <DataTable
            columns={columns}
            data={allLinks}
            onDelete={handleDelete}
            filterColumn="title"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={handleFetchNextPage}
            showCheckboxes={false}
            onFilterChange={debouncedFilterChange}
            filterValue={queryParams.search}
            isLoading={isLoading}
            enableSearch={isSearchEnabled}
          />
        </OGDialogContent>
      </OGDialog>
      <OGDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <OGDialogTemplate
          showCloseButton={false}
          title={localize('com_ui_delete_shared_link')}
          className="max-w-[450px]"
          main={
            <>
              <div className="flex w-full flex-col items-center gap-2">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="dialog-confirm-delete" className="text-left text-sm font-medium">
                    {localize('com_ui_delete_confirm')} <strong>{deleteRow?.title}</strong>
                  </Label>
                </div>
              </div>
            </>
          }
          selection={{
            selectHandler: confirmDelete,
            selectClasses: `bg-red-700 dark:bg-red-600 hover:bg-red-800 dark:hover:bg-red-800 text-white ${
              deleteMutation.isLoading ? 'cursor-not-allowed opacity-80' : ''
            }`,
            selectText: deleteMutation.isLoading ? <Spinner /> : localize('com_ui_delete'),
          }}
        />
      </OGDialog>
    </div>
  );
}
