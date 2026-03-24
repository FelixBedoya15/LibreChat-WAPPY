import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import type { FC } from 'react';
import { TooltipAnchor } from '@librechat/client';
import { Menu, MenuButton, MenuItems } from '@headlessui/react';
import { BookmarkContext } from '~/Providers/BookmarkContext';
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
  const label = useMemo(
    () => (tags.length > 0 ? tags.join(', ') : localize('com_ui_bookmarks')),
    [tags, localize],
  );
  const isActive = tags.length > 0;

  return (
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
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-sm",
                    isActive || open
                      ? "bg-teal-100/50 border-teal-400 text-teal-600"
                      : "bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-teal-400 text-text-primary"
                  )}
                >
                  <Bookmark className="h-5 w-5" />
                </MenuButton>
              }
            />
          ) : (
            <MenuButton
              id="bookmark-menu-button"
              aria-label={localize('com_ui_bookmarks')}
              data-testid="bookmark-menu"
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 shadow-sm",
                isActive || open
                  ? "bg-teal-50/50 border-teal-400/50 text-teal-700"
                  : "bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-teal-400 text-text-secondary hover:text-teal-600"
              )}
            >
              <Bookmark className="h-4 w-4 shrink-0" />
              <span className="font-semibold text-text-primary text-[13px]">{label}</span>
            </MenuButton>
          )}
          <MenuItems
            anchor="bottom"
            className="absolute left-0 top-full z-[100] mt-1 w-60 translate-y-0 overflow-hidden rounded-lg bg-surface-secondary p-1.5 shadow-lg outline-none"
          >
            {data && (
              <BookmarkContext.Provider value={{ bookmarks: data.filter((tag) => tag.count > 0) }}>
                <BookmarkNavItems
                  tags={tags}
                  setTags={setTags}
                />
              </BookmarkContext.Provider>
            )}
          </MenuItems>
        </>
      )}
    </Menu>
  );
};

export default BookmarkNav;
