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
          'group relative flex w-9 h-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400 transition-all duration-200 shadow-2xs mb-1',
        )}
        onClick={() => {
          const toggleBtn = document.querySelector('#nav-toggle-button');
          if (toggleBtn) {
            (toggleBtn as HTMLButtonElement).click();
          }
        }}
      >
        <Search className="h-4.5 w-4.5 text-slate-500 dark:text-zinc-400 group-hover:text-teal-500 transition-colors" />
        <div className="hidden sm:flex absolute left-full ml-3 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-white dark:bg-zinc-800 border border-teal-400/50 px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-[110]">
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{localize('com_ui_search')}</span>
        </div>
      </div>
    );
  }

  // ─── Expanded state ──────────────────────────────────────────────────────────
  return (
    <motion.div
      ref={ref}
      className={cn(
        'group relative flex h-10 w-full items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 px-3 text-xs text-slate-700 dark:text-zinc-300 transition-all duration-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400 cursor-text',
      )}
    >
      {/* Search button — clicking this triggers the search */}
      <button
        type="button"
        aria-label={localize('com_ui_search')}
        className="flex h-4 w-4 shrink-0 items-center justify-center bg-transparent text-slate-500 dark:text-zinc-400 group-hover:text-teal-500 hover:text-teal-500 transition-colors"
        onClick={handleSubmit}
        tabIndex={0}
        title="Buscar (Enter)"
      >
        <Search className="h-4 w-4" />
      </button>

      <input
        type="text"
        ref={inputRef}
        className="m-0 w-full border-none bg-transparent p-0 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-zinc-500 placeholder:font-normal"
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
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-none bg-transparent p-0 transition-all duration-200',
          showClearIcon ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          isSmallScreen === true ? 'mr-0.5' : '',
        )}
        onClick={() => clearText(location.pathname)}
        tabIndex={showClearIcon ? 0 : -1}
        disabled={!showClearIcon}
      >
        <X className="h-3.5 w-3.5 cursor-pointer text-slate-400 hover:text-red-500 transition-colors" />
      </button>
    </motion.div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
