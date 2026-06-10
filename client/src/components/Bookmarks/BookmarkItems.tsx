import type { FC } from 'react';
import { useBookmarkContext } from '~/Providers/BookmarkContext';
import BookmarkItem from './BookmarkItem';
interface BookmarkItemsProps {
  tags: string[];
  handleSubmit: (tag?: string) => void;
  header: React.ReactNode;
}

const BookmarkItems: FC<BookmarkItemsProps> = ({ tags, handleSubmit, header }) => {
  const { bookmarks } = useBookmarkContext();

  const filteredBookmarks = bookmarks.filter((tag) => {
    if (!tag.tag) {
      return false;
    }
    // Filter out system/SGSST bookmarks
    return !tag.tag.startsWith('sgsst-') && !tag.tag.startsWith('company-') && tag.tag !== 'report';
  });

  return (
    <>
      {header}
      {filteredBookmarks.length > 0 && <div className="my-1.5 h-px" role="none" />}
      {filteredBookmarks.map((bookmark, i) => (
        <BookmarkItem
          key={`${bookmark._id ?? bookmark.tag}-${i}`}
          tag={bookmark.tag}
          selected={tags.includes(bookmark.tag)}
          handleSubmit={handleSubmit}
        />
      ))}
    </>
  );
};

export default BookmarkItems;
