import React, { forwardRef, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRecoilState } from 'recoil';
import { Search, X } from 'lucide-react';
import { QueryKeys } from 'librechat-data-provider';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalize, useNewConvo } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

type SearchBarProps = {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
};

const SearchBar = forwardRef((props: SearchBarProps, ref: React.Ref<HTMLDivElement>) => {
  const localize = useLocalize();
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isSmallScreen, isCollapsed } = props;

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showClearIcon, setShowClearIcon] = useState(false);

  const { newConversation: newConvo } = useNewConvo();
  const [search, setSearchState] = useRecoilState(store.search);

  // Sync local text with the store when component mounts (e.g., revisiting /search)
  useEffect(() => {
    if (search.query && text === '') {
      setText(search.query);
      setShowClearIcon(true);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Navigate away from /search and reset everything */
  const clearSearch = useCallback(
    (pathname?: string) => {
      if (pathname?.includes('/search') || pathname === '/c/new') {
        queryClient.removeQueries([QueryKeys.messages]);
        newConvo({ disableFocus: true });
        navigate('/c/new');
      }
    },
    [newConvo, navigate, queryClient],
  );

  /** Clear the input and the search state completely */
  const clearText = useCallback(
    (pathname?: string) => {
      setShowClearIcon(false);
      setText('');
      setSearchState((prev) => ({
        ...prev,
        query: '',
        debouncedQuery: '',
        isTyping: false,
      }));
      clearSearch(pathname);
      inputRef.current?.focus();
    },
    [setSearchState, clearSearch],
  );

  /**
   * Execute the search — only called on Enter or clicking the search button.
   * Updates debouncedQuery so the Search route fetches results.
   */
  const handleSubmit = useCallback(() => {
    const value = text.trim();
    if (!value) {
      return;
    }
    // Commit query to store
    setSearchState((prev) => ({
      ...prev,
      query: value,
      debouncedQuery: value,
      isTyping: false,
    }));
    // Invalidate cached messages so fresh results are fetched
    queryClient.invalidateQueries([QueryKeys.messages]);
    // Navigate to /search if not already there
    if (location.pathname !== '/search') {
      navigate('/search', { replace: true });
    }
  }, [text, setSearchState, queryClient, location.pathname, navigate]);

  /** Only update the local text — no auto-search */
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowClearIcon(value.length > 0);
    setText(value);
    // Keep query in sync for potential use (e.g. "nothing found" message), but
    // do NOT update debouncedQuery — that only happens on submit.
    setSearchState((prev) => ({ ...prev, query: value }));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Space') {
      e.stopPropagation();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      clearText(location.pathname);
    }
  };

  const onKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement;
      if (e.key === 'Backspace' && value === '') {
        clearText(location.pathname);
      }
    },
    [clearText, location.pathname],
  );

  // ─── Collapsed state: just show the search icon to expand the nav ───────────
  if (isCollapsed) {
    return (
      <div
        className={cn(
          'group relative flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-white dark:bg-gray-800 shadow-sm hover:border-teal-400 transition-all duration-300',
        )}
        onClick={() => {
          const toggleBtn = document.querySelector('#nav-toggle-button');
          if (toggleBtn) {
            (toggleBtn as HTMLButtonElement).click();
          }
        }}
      >
        <Search size={18} className="text-text-secondary group-hover:text-teal-500 transition-colors" />
        <div className="hidden sm:flex absolute left-full ml-3 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-white dark:bg-gray-800 border border-teal-400/50 px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-[110]">
          <span className="text-xs font-semibold text-teal-700">{localize('com_ui_search')}</span>
        </div>
      </div>
    );
  }

  // ─── Expanded state ──────────────────────────────────────────────────────────
  return (
    <motion.div
      ref={ref}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-xl border border-border-medium/30 bg-white dark:bg-surface-primary px-2 py-2 text-sm text-text-secondary transition-all duration-200 shadow-sm hover:border-teal-400 focus-within:border-teal-400 cursor-text',
      )}
    >
      {/* Search button — clicking this triggers the search */}
      <button
        type="button"
        aria-label={localize('com_ui_search')}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-transparent text-text-tertiary hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-150"
        onClick={handleSubmit}
        tabIndex={0}
        title="Buscar (Enter)"
      >
        <Search className="h-4 w-4" />
      </button>

      <input
        type="text"
        ref={inputRef}
        className="m-0 w-full border-none bg-transparent p-0 text-sm font-medium text-text-primary focus:outline-none focus:ring-0 placeholder:text-text-tertiary"
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        aria-label={localize('com_nav_search_placeholder')}
        placeholder={localize('com_nav_search_placeholder')}
        onFocus={() => setSearchState((prev) => ({ ...prev, isSearching: true }))}
        onBlur={() => setSearchState((prev) => ({ ...prev, isSearching: false }))}
        autoComplete="off"
        dir="auto"
      />

      {/* Clear button */}
      <button
        type="button"
        aria-label={`${localize('com_ui_clear')} ${localize('com_ui_search')}`}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-none bg-transparent p-0 transition-all duration-200',
          showClearIcon ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          isSmallScreen === true ? 'mr-1' : '',
        )}
        onClick={() => clearText(location.pathname)}
        tabIndex={showClearIcon ? 0 : -1}
        disabled={!showClearIcon}
      >
        <X className="h-4 w-4 cursor-pointer text-text-tertiary hover:text-red-500 transition-colors" />
      </button>
    </motion.div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
