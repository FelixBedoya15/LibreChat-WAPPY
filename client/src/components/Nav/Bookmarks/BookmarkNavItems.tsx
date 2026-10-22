import { type FC } from 'react';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { BookmarkPlusIcon } from 'lucide-react';
import { BookmarkContext, useBookmarkContext } from '~/Providers/BookmarkContext';
import { BookmarkItems, BookmarkItem } from '~/components/Bookmarks';
import { useLocalize } from '~/hooks';

const BookmarkNavItems: FC<{
  tags: string[];
  setTags: (tags: string[]) => void;
  onOpenNewBookmark?: () => void;
}> = ({ tags = [], setTags, onOpenNewBookmark }) => {
  const { bookmarks } = useBookmarkContext();
  const localize = useLocalize();

  const filteredBookmarks = bookmarks.filter((tag) => {
    if (!tag.tag) {
      return false;
    }
    // Filter out system/SGSST bookmarks
    return !tag.tag.startsWith('sgsst-') && !tag.tag.startsWith('company-') && tag.tag !== 'report';
  });

  const getUpdatedSelected = (tag: string) => {
    if (tags.some((selectedTag) => selectedTag === tag)) {
      return tags.filter((selectedTag) => selectedTag !== tag);
    } else {
      return [...tags, tag];
    }
  };

  const handleSubmit = (tag?: string) => {
    if (tag === undefined) {
      return;
    }
    const updatedSelected = getUpdatedSelected(tag);
    setTags(updatedSelected);
    return;
  };

  const clear = () => {
    setTags([]);
    return;
  };

  return (
    <div className="flex flex-col">
      {onOpenNewBookmark && (
        <BookmarkItem
          tag={localize('com_ui_bookmarks_new')}
          data-testid="bookmark-item-new"
          handleSubmit={() => onOpenNewBookmark()}
          selected={false}
          icon={<BookmarkPlusIcon className="size-4 text-teal-600 dark:text-teal-400" />}
        />
      )}
      {tags.length > 0 && (
        <BookmarkItem
          tag={localize('com_ui_clear_all')}
          data-testid="bookmark-item-clear"
          handleSubmit={clear}
          selected={false}
          icon={<CrossCircledIcon className="size-4" />}
        />
      )}
      {filteredBookmarks.length === 0 ? (
        <BookmarkItem
          tag={localize('com_ui_no_bookmarks')}
          data-testid="bookmark-item-no-bookmarks"
          handleSubmit={() => Promise.resolve()}
          selected={false}
          icon={'🤔'}
        />
      ) : (
        <BookmarkContext.Provider value={{ bookmarks: filteredBookmarks }}>
          <BookmarkItems
            tags={tags}
            handleSubmit={handleSubmit}
            header={null}
          />
        </BookmarkContext.Provider>
      )}
    </div>
  );
};

export default BookmarkNavItems;
