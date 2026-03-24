import { useCallback, useEffect, useState, useMemo, memo, lazy, Suspense, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useMediaQuery } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type { ConversationListResponse } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';
import {
  useLocalize,
  useHasAccess,
  useAuthContext,
  useLocalStorage,
  useNavScrolling,
  useLocationSystem,
} from '~/hooks';
import useRolePermissions from '~/hooks/Roles/useRolePermissions';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Conversations } from '~/components/Conversations';
import SearchBar from './SearchBar';
import NewChat from './NewChat';
import NavToggle from './NavToggle';
import { cn } from '~/utils';
import store from '~/store';

const BookmarkNav = lazy(() => import('./Bookmarks/BookmarkNav'));
const AccountSettings = lazy(() => import('./AccountSettings'));
const AgentMarketplaceButton = lazy(() => import('./AgentMarketplaceButton'));
const LiveAnalysisButton = lazy(() => import('./LiveAnalysisButton'));
const SGSSTButton = lazy(() => import('./SGSSTButton'));

const NAV_WIDTH_DESKTOP = '260px';
const NAV_WIDTH_MOBILE = '320px';
const NAV_WIDTH_COLLAPSED = '56px';

const NavMask = memo(
  ({ navVisible, toggleNavVisible }: { navVisible: boolean; toggleNavVisible: () => void }) => (
    <div
      id="mobile-nav-mask-toggle"
      role="button"
      tabIndex={0}
      className={`nav-mask transition-opacity duration-200 ease-in-out ${navVisible ? 'active opacity-100' : 'opacity-0'}`}
      onClick={toggleNavVisible}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleNavVisible();
        }
      }}
      aria-label="Toggle navigation"
    />
  ),
);

const MemoNewChat = memo(NewChat);

const Nav = memo(
  ({
    navVisible,
    setNavVisible,
  }: {
    navVisible: boolean;
    setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const localize = useLocalize();
    const { isAuthenticated } = useAuthContext();
    const [isHovering, setIsHovering] = useState(false);
    const isSmallScreen = useMediaQuery('(max-width: 768px)');
    const [newUser, setNewUser] = useLocalStorage('newUser', true);
    const [showLoading, setShowLoading] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    useLocationSystem();

    const { hasPermission } = useRolePermissions();

    const hasAccessToBookmarks = useHasAccess({
      permissionType: PermissionTypes.BOOKMARKS,
      permission: Permissions.USE,
    }) && hasPermission(PermissionTypes.BOOKMARKS);

    const hasAccessToAgents = hasPermission(PermissionTypes.AGENTS);
    const hasAccessToLiveAnalysis = hasPermission(PermissionTypes.LIVE_ANALYSIS);
    // SG-SST button is always visible for all users so they can input company config.
    // Upgrade limits are handled inside the SGSST module itself.
    const hasAccessToSGSST = true;

    const search = useRecoilValue(store.search);

    const { data, fetchNextPage, isFetchingNextPage, isLoading, isFetching, refetch } =
      useConversationsInfiniteQuery(
        {
          tags: tags.length === 0 ? undefined : tags,
          search: search.debouncedQuery || undefined,
        },
        {
          enabled: isAuthenticated,
          staleTime: 30000,
          cacheTime: 300000,
        },
      );

    const computedHasNextPage = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        const lastPage: ConversationListResponse = data.pages[data.pages.length - 1];
        return lastPage.nextCursor !== null;
      }
      return false;
    }, [data?.pages]);

    const outerContainerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<any>(null);

    const { moveToTop } = useNavScrolling<ConversationListResponse>({
      setShowLoading,
      fetchNextPage: async (options?) => {
        if (computedHasNextPage) {
          return fetchNextPage(options);
        }
        return Promise.resolve(
          {} as InfiniteQueryObserverResult<ConversationListResponse, unknown>,
        );
      },
      isFetchingNext: isFetchingNextPage,
    });

    const conversations = useMemo(() => {
      return data ? data.pages.flatMap((page) => page.conversations) : [];
    }, [data]);

    const [isCollapsed, setIsCollapsed] = useLocalStorage('navCollapsed', false);
    const [navWidth, setNavWidth] = useState(isSmallScreen ? NAV_WIDTH_MOBILE : (isCollapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_DESKTOP));

    const toggleNavVisible = useCallback(() => {
      if (isSmallScreen) {
          setNavVisible((prev: boolean) => !prev);
      } else {
          setIsCollapsed((prev: boolean) => {
              localStorage.setItem('navCollapsed', JSON.stringify(!prev));
              return !prev;
          });
      }
      if (newUser) {
        setNewUser(false);
      }
    }, [newUser, setNewUser, setIsCollapsed, isSmallScreen, setNavVisible]);

    const itemToggleNav = useCallback(() => {
      if (isSmallScreen) {
        toggleNavVisible();
      }
    }, [isSmallScreen, toggleNavVisible]);

    useEffect(() => {
      if (isSmallScreen) {
        setNavWidth(NAV_WIDTH_MOBILE);
      } else {
        setNavWidth(isCollapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_DESKTOP);
      }
    }, [isSmallScreen, isCollapsed]);

    useEffect(() => {
      refetch();
    }, [tags, refetch]);

    const loadMoreConversations = useCallback(() => {
      if (isFetchingNextPage || !computedHasNextPage) {
        return;
      }

      fetchNextPage();
    }, [isFetchingNextPage, computedHasNextPage, fetchNextPage]);

    const isCollapsedState = navWidth === NAV_WIDTH_COLLAPSED;

    const subHeaders = useMemo(
      () => search.enabled === true && <SearchBar isSmallScreen={isSmallScreen} isCollapsed={isCollapsedState} />,
      [search.enabled, isSmallScreen, isCollapsedState],
    );

    const headerButtons = useMemo(
      () => (
        <>
          {hasAccessToAgents && (
            <Suspense fallback={null}>
              <AgentMarketplaceButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={isCollapsedState} />
            </Suspense>
          )}
          {hasAccessToBookmarks && (
            <Suspense fallback={null}>
              <BookmarkNav tags={tags} setTags={setTags} isSmallScreen={isSmallScreen} isCollapsed={isCollapsedState} />
            </Suspense>
          )}
          {hasAccessToLiveAnalysis && (
            <Suspense fallback={null}>
              <LiveAnalysisButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={isCollapsedState} />
            </Suspense>
          )}
          {hasAccessToSGSST && (
            <Suspense fallback={null}>
              <SGSSTButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={isCollapsedState} />
            </Suspense>
          )}
        </>
      ),
      [hasAccessToBookmarks, tags, isSmallScreen, toggleNavVisible, hasAccessToSGSST, hasAccessToLiveAnalysis, hasAccessToAgents],
    );

    const [isSearchLoading, setIsSearchLoading] = useState(
      !!search.query && (search.isTyping || isLoading || isFetching),
    );

    useEffect(() => {
      if (search.isTyping) {
        setIsSearchLoading(true);
      } else if (!isLoading && !isFetching) {
        setIsSearchLoading(false);
      } else if (!!search.query && (isLoading || isFetching)) {
        setIsSearchLoading(true);
      }
    }, [search.query, search.isTyping, isLoading, isFetching]);

    return (
      <>
        <div
          data-testid="nav"
          className={cn(
            'nav active flex-shrink-0 transition-all duration-300 ease-in-out border-r border-border-medium bg-white dark:bg-gray-900',
            navVisible ? 'overflow-visible' : 'overflow-hidden'
          )}
          style={{
            zIndex: 1000,
            width: navVisible ? navWidth : '0px',
            transform: navVisible ? 'translateX(0)' : 'translateX(-100%)',
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className={cn(
            "h-full overflow-visible transition-all duration-300",
            isCollapsedState ? 'w-[56px]' : 'w-[320px] md:w-[260px]'
          )}>
            <div className="flex h-full flex-col overflow-visible">
              <div
                className={`flex h-full flex-col transition-opacity duration-200 ease-in-out overflow-visible ${navVisible ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="flex h-full flex-col overflow-visible">
                  <nav
                    id="chat-history-nav"
                    aria-label={localize('com_ui_chat_history')}
                    className={cn(
                        "flex h-full flex-col px-2 pb-3.5 md:px-3 transition-all duration-300",
                        isCollapsedState ? 'px-1 md:px-1' : ''
                    )}
                  >
                    <div className="flex flex-1 flex-col" ref={outerContainerRef}>
                        <Conversations
                            conversations={conversations}
                            moveToTop={moveToTop}
                            toggleNav={itemToggleNav}
                            containerRef={listRef}
                            loadMoreConversations={loadMoreConversations}
                            isLoading={isFetchingNextPage || showLoading || isLoading}
                            isSearchLoading={isSearchLoading}
                            isCollapsed={isCollapsedState}
                            headerContent={
                                <>
                                    <MemoNewChat
                                        toggleNav={toggleNavVisible}
                                        isSmallScreen={isSmallScreen}
                                        isCollapsed={isCollapsedState}
                                    />
                                    <div className="flex flex-col gap-2 mt-2 mb-4">
                                        {subHeaders}
                                        {headerButtons}
                                    </div>
                                </>
                            }
                        />
                    </div>
                    <Suspense fallback={null}>
                      <AccountSettings isCollapsed={isCollapsedState} />
                    </Suspense>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isSmallScreen && <NavMask navVisible={navVisible} toggleNavVisible={() => setNavVisible(false)} />}
      </>
    );
  },
);

Nav.displayName = 'Nav';

export default Nav;
