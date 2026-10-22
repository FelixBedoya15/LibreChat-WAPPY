import { useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import type { FC } from 'react';
import { TooltipAnchor } from '@librechat/client';
import { Menu, MenuButton, MenuItems } from '@headlessui/react';
import { BookmarkContext } from '~/Providers/BookmarkContext';
import { BookmarkEditDialog } from '~/components/Bookmarks';
import { useGetConversationTags } from '~/data-provider';
import BookmarkNavItems from './BookmarkNavItems';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

type BookmarkNavProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
};

const BookmarkNav: FC<BookmarkNavProps> = ({ tags, setTags, isSmallScreen, isCollapsed }: BookmarkNavProps) => {
  const localize = useLocalize();
  const { data } = useGetConversationTags();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const label = useMemo(
    () => (tags.length > 0 ? tags.join(', ') : localize('com_ui_bookmarks')),
    [tags, localize],
  );
  const isActive = tags.length > 0;

  return (
    <>
      <Menu as="div" className={cn("group relative", isCollapsed ? "" : "w-full")}>
        {({ open }) => (
          <>
            {isCollapsed ? (
              <TooltipAnchor
                description={localize('com_ui_bookmarks')}
                side="right"
                render={
                  <MenuButton
                    id="bookmark-menu-button"
                    aria-label={localize('com_ui_bookmarks')}
                    data-testid="bookmark-menu"
                    className={cn(
                      "w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-2xs mb-1 active:scale-95 cursor-pointer",
                      isActive || open
                        ? "bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs"
                        : "border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400"
                    )}
                  >
                    <Bookmark className="h-4.5 w-4.5" />
                  </MenuButton>
                }
              />
            ) : (
              <MenuButton
                id="bookmark-menu-button"
                aria-label={localize('com_ui_bookmarks')}
                data-testid="bookmark-menu"
                className={cn(
                  "group flex h-10 w-full items-center gap-2.5 rounded-xl border px-3 text-xs transition-all duration-200 shadow-2xs cursor-pointer active:scale-98",
                  isActive || open
                    ? "bg-teal-50/90 dark:bg-teal-950/60 border-teal-500/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs"
                    : "bg-white/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-teal-400 text-slate-700 dark:text-zinc-300 hover:text-teal-600"
                )}
              >
                <Bookmark className={cn("h-4 w-4 shrink-0 transition-colors", (isActive || open) ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-zinc-400 group-hover:text-teal-500")} />
                <span className={cn("font-bold text-xs", (isActive || open) ? "text-teal-800 dark:text-teal-200" : "text-slate-800 dark:text-zinc-200")}>{label}</span>
              </MenuButton>
            )}
            <MenuItems
              anchor={isCollapsed ? 'right start' : 'bottom start'}
              style={{ zIndex: 9999 }}
              className="z-[9999] mt-1 w-60 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 shadow-xl outline-none"
            >
              <BookmarkContext.Provider value={{ bookmarks: data ?? [] }}>
                <BookmarkNavItems
                  tags={tags}
                  setTags={setTags}
                  onOpenNewBookmark={() => setIsDialogOpen(true)}
                />
              </BookmarkContext.Provider>
            </MenuItems>
          </>
        )}
      </Menu>
      <BookmarkContext.Provider value={{ bookmarks: data ?? [] }}>
        <BookmarkEditDialog
          context="BookmarkNav"
          open={isDialogOpen}
          setOpen={setIsDialogOpen}
        />
      </BookmarkContext.Provider>
    </>
  );
};

export default BookmarkNav;
