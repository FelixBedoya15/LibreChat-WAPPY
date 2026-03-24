import React, { forwardRef, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import debounce from 'lodash/debounce';
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

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement;
      if (e.key === 'Backspace' && value === '') {
        clearText(location.pathname);
      }
    },
    [clearText, location.pathname],
  );

  const sendRequest = useCallback(
    (value: string) => {
      if (!value) {
        return;
      }
      queryClient.invalidateQueries([QueryKeys.messages]);
    },
    [queryClient],
  );

  const debouncedSetDebouncedQuery = useMemo(
    () =>
      debounce((value: string) => {
        setSearchState((prev) => ({ ...prev, debouncedQuery: value, isTyping: false }));
        sendRequest(value);
      }, 500),
    [setSearchState, sendRequest],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowClearIcon(value.length > 0);
    setText(value);
    setSearchState((prev) => ({
      ...prev,
      query: value,
      isTyping: true,
    }));
    debouncedSetDebouncedQuery(value);
    if (value.length > 0 && location.pathname !== '/search') {
      navigate('/search', { replace: true });
    }
  };

  useEffect(() => {
    if (search.isTyping && !search.isSearching && search.debouncedQuery === search.query) {
      setSearchState((prev) => ({ ...prev, isTyping: false }));
    }
  }, [search.isTyping, search.isSearching, search.debouncedQuery, search.query, setSearchState]);

  if (isCollapsed) {
    return (
      <div
        className={cn(
          'group relative flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-white dark:bg-gray-800 shadow-sm hover:border-teal-400 transition-all duration-300'
        )}
        onClick={() => {
            const toggleBtn = document.querySelector('#nav-toggle-button');
            if (toggleBtn) {
                (toggleBtn as HTMLButtonElement).click();
            }
        }}
      >
        <AnimatedIcon name="search" size={18} className="text-text-secondary group-hover:text-teal-500 transition-colors" />
        <div className="hidden sm:flex absolute left-full ml-3 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-white dark:bg-gray-800 border border-teal-400/50 px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-[110]">
          <span className="text-xs font-semibold text-teal-700">{localize('com_ui_search')}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border border-border-medium/30 bg-white dark:bg-surface-primary p-3 text-sm text-text-secondary transition-all duration-300 shadow-sm hover:border-teal-400 hover:text-teal-600 cursor-text'
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-medium/50 bg-surface-secondary group-hover:border-teal-200 text-text-tertiary group-hover:text-teal-500 transition-colors">
        <Search className="h-5 w-5" />
      </div>
      <input
        type="text"
        ref={inputRef}
        className="m-0 w-full border-none bg-transparent p-0 text-sm font-medium focus:outline-none focus:ring-0 placeholder:text-text-tertiary"
        value={text}
        onChange={onChange}
        onKeyDown={(e) => {
          e.code === 'Space' ? e.stopPropagation() : null;
        }}
        aria-label={localize('com_nav_search_placeholder')}
        placeholder={localize('com_nav_search_placeholder')}
        onKeyUp={handleKeyUp}
        onFocus={() => setSearchState((prev) => ({ ...prev, isSearching: true }))}
        onBlur={() => setSearchState((prev) => ({ ...prev, isSearching: false }))}
        autoComplete="off"
        dir="auto"
      />
      <button
        type="button"
        aria-label={`${localize('com_ui_clear')} ${localize('com_ui_search')}`}
        className={cn(
          'absolute right-[7px] flex h-5 w-5 items-center justify-center rounded-full border-none bg-transparent p-0 transition-opacity duration-200',
          showClearIcon ? 'opacity-100' : 'opacity-0',
          isSmallScreen === true ? 'right-[16px]' : '',
        )}
        onClick={() => clearText(location.pathname)}
        tabIndex={showClearIcon ? 0 : -1}
        disabled={!showClearIcon}
      >
        <X className="h-5 w-5 cursor-pointer text-text-secondary hover:text-red-500 transition-colors" />
      </button>
    </motion.div>
  );
});

export default SearchBar;
