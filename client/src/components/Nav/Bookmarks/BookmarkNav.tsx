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
  isSmallScreen: boolean;
};

const BookmarkNav: FC<BookmarkNavProps> = ({ tags, setTags, isSmallScreen }: BookmarkNavProps) => {
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
              "group relative flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:scale-105 sm:hover:-rotate-3",
              open || tags.length > 0
                ? "bg-amber-100/50 border-amber-400 text-amber-600 shadow-inner" 
                : "bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-teal-400 text-text-primary"
            )}
            data-testid="bookmark-menu"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="bookmark" size={20} />
            </div>
            <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-surface-primary/95 backdrop-blur-md border border-teal-400/50 px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-[110]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">{label}</span>
            </div>
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
