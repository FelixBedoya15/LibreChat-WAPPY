import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import type { FC } from 'react';
import { TooltipAnchor } from '@librechat/client';
import { Menu, MenuButton, MenuItems } from '@headlessui/react';
import { BookmarkFilledIcon, BookmarkIcon } from '@radix-ui/react-icons';
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

  return (
    <Menu as="div" className="group relative">
      {({ open }) => (
        <>
          <MenuButton
            id="bookmark-menu-button"
            aria-label={localize('com_ui_bookmarks')}
            className={cn(
              "group relative flex items-center h-11 px-3 w-full gap-3 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:scale-[1.02] sm:hover:-rotate-1",
              open || tags.length > 0
                ? "bg-amber-50 border-amber-400 text-amber-600 shadow-inner" 
                : "bg-white dark:bg-gray-800 border-border-medium hover:bg-surface-hover text-text-primary",
              isCollapsed && "justify-center px-0"
            )}
            data-testid="bookmark-menu"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="bookmark" size={18} className={cn(open || tags.length > 0 ? "text-amber-600" : "text-text-secondary group-hover:text-teal-500")} />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold leading-tight mt-0.5">{label}</span>}
            {isCollapsed && (
                <div className="hidden sm:flex absolute left-full ml-3 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-amber-600 text-white px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-[110]">
                    <span className="text-xs font-semibold">{label}</span>
                </div>
            )}
          </MenuButton>
          <MenuItems
            anchor="bottom"
            className="absolute left-0 top-full z-[100] mt-1 w-60 translate-y-0 overflow-hidden rounded-lg bg-surface-secondary p-1.5 shadow-lg outline-none"
          >
            {data && (
              <BookmarkContext.Provider value={{ bookmarks: data.filter((tag) => tag.count > 0) }}>
                <BookmarkNavItems
                  // List of selected tags(string)
                  tags={tags}
                  // When a user selects a tag, this `setTags` function is called to refetch the list of conversations for the selected tag
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
