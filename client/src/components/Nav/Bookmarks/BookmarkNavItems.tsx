import { type FC } from 'react';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { BookmarkContext, useBookmarkContext } from '~/Providers/BookmarkContext';
import { BookmarkItems, BookmarkItem } from '~/components/Bookmarks';
import { useLocalize } from '~/hooks';

const BookmarkNavItems: FC<{
  tags: string[];
  setTags: (tags: string[]) => void;
}> = ({ tags = [], setTags }) => {
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

  if (filteredBookmarks.length === 0) {
    return (
      <div className="flex flex-col">
        <BookmarkItem
          tag={localize('com_ui_clear_all')}
          data-testid="bookmark-item-clear"
          handleSubmit={clear}
          selected={false}
          icon={<CrossCircledIcon className="size-4" />}
        />
        <BookmarkItem
          tag={localize('com_ui_no_bookmarks')}
          data-testid="bookmark-item-no-bookmarks"
          handleSubmit={() => Promise.resolve()}
          selected={false}
          icon={'🤔'}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <BookmarkContext.Provider value={{ bookmarks: filteredBookmarks }}>
        <BookmarkItems
          tags={tags}
          handleSubmit={handleSubmit}
          header={
            <BookmarkItem
              tag={localize('com_ui_clear_all')}
              data-testid="bookmark-item-clear"
              handleSubmit={clear}
              selected={false}
              icon={<CrossCircledIcon className="size-4" />}
            />
          }
        />
      </BookmarkContext.Provider>
    </div>
  );
};

export default BookmarkNavItems;
