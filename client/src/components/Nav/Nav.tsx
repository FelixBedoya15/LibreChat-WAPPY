import { useCallback, useEffect, useState, useMemo, memo, lazy, Suspense, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useMediaQuery, TooltipAnchor } from '@librechat/client';
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
import { Search } from 'lucide-react';

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
          setIsCollapsed(!isCollapsed);
          localStorage.setItem('navCollapsed', JSON.stringify(!isCollapsed));
      }
      if (newUser) {
        setNewUser(false);
      }
    }, [newUser, setNewUser, isCollapsed, setIsCollapsed, isSmallScreen, setNavVisible]);

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
      [hasAccessToBookmarks, tags, isSmallScreen, toggleNavVisible, hasAccessToSGSST, hasAccessToLiveAnalysis, hasAccessToAgents, isCollapsedState],
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
            "h-full overflow-hidden",
            isCollapsedState ? 'w-[56px]' : 'w-[320px] md:w-[260px]'
          )}>
            <div className="flex h-full flex-col">
              <div
                className={`flex h-full flex-col overflow-hidden ${navVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
              >
                <div className="flex h-full flex-col">
                  <nav
                    id="chat-history-nav"
                    aria-label={localize('com_ui_chat_history')}
                    className={cn(
                      "flex h-full flex-col pb-3.5",
                      isCollapsedState ? 'px-2 items-center' : 'px-2 md:px-3'
                    )}
                  >
                    {/* Collapsed: icon-only column */}
                    {isCollapsedState ? (
                      <div className="flex flex-col gap-1.5 pt-2 w-full items-center">
                        {/* New Chat icon */}
                        <TooltipAnchor
                          description="Nuevo Chat"
                          side="right"
                          render={
                            <MemoNewChat
                              toggleNav={toggleNavVisible}
                              isSmallScreen={isSmallScreen}
                              isCollapsed={true}
                            />
                          }
                        />
                        {/* Search icon */}
                        <TooltipAnchor
                          description="Buscar mensajes"
                          side="right"
                          render={
                            <button
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-medium/50 bg-surface-primary hover:bg-surface-hover hover:border-teal-400 text-text-primary transition-all duration-300 shadow-sm mb-1 sm:hover:scale-105 sm:hover:-rotate-3"
                              onClick={() => {}}
                            >
                              <Search className="h-5 w-5" />
                            </button>
                          }
                        />
                        {/* Bookmarks icon */}
                        {hasAccessToBookmarks && (
                          <Suspense fallback={null}>
                            <BookmarkNav tags={tags} setTags={setTags} isSmallScreen={isSmallScreen} isCollapsed={true} />
                          </Suspense>
                        )}
                        {/* Camera icon */}
                        {hasAccessToLiveAnalysis && (
                          <Suspense fallback={null}>
                            <LiveAnalysisButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={true} />
                          </Suspense>
                        )}
                        {/* SG-SST icon */}
                        {hasAccessToSGSST && (
                          <Suspense fallback={null}>
                            <SGSSTButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={true} />
                          </Suspense>
                        )}
                        <div className="mt-auto">
                          <Suspense fallback={null}>
                            <AccountSettings isCollapsed={true} />
                          </Suspense>
                        </div>
                      </div>
                    ) : (
                      /* Expanded: full width with chat history */
                      <div className="flex flex-1 flex-col" ref={outerContainerRef}>
                        <Conversations
                          conversations={conversations}
                          moveToTop={moveToTop}
                          toggleNav={itemToggleNav}
                          containerRef={listRef}
                          loadMoreConversations={loadMoreConversations}
                          isLoading={isFetchingNextPage || showLoading || isLoading}
                          isSearchLoading={isSearchLoading}
                          isCollapsed={false}
                          headerContent={
                            <>
                              <MemoNewChat
                                toggleNav={toggleNavVisible}
                                isSmallScreen={isSmallScreen}
                                isCollapsed={false}
                              />
                              <div className="flex flex-col gap-1.5 mt-1 mb-3">
                                {search.enabled && <SearchBar isSmallScreen={isSmallScreen} isCollapsed={false} />}
                                {hasAccessToAgents && (
                                  <Suspense fallback={null}>
                                    <AgentMarketplaceButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={false} />
                                  </Suspense>
                                )}
                                {hasAccessToBookmarks && (
                                  <Suspense fallback={null}>
                                    <BookmarkNav tags={tags} setTags={setTags} isSmallScreen={isSmallScreen} isCollapsed={false} />
                                  </Suspense>
                                )}
                                {hasAccessToLiveAnalysis && (
                                  <Suspense fallback={null}>
                                    <LiveAnalysisButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={false} />
                                  </Suspense>
                                )}
                                {hasAccessToSGSST && (
                                  <Suspense fallback={null}>
                                    <SGSSTButton isSmallScreen={isSmallScreen} toggleNav={toggleNavVisible} isCollapsed={false} />
                                  </Suspense>
                                )}
                              </div>
                            </>
                          }
                        />
                        <Suspense fallback={null}>
                          <AccountSettings isCollapsed={false} />
                        </Suspense>
                      </div>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative flex w-px items-center justify-center"
          style={{ zIndex: 2000 }}
        >
          <NavToggle
            navVisible={isSmallScreen ? navVisible : !isCollapsedState}
            isHovering={isHovering}
            onToggle={toggleNavVisible}
            setIsHovering={setIsHovering}
            className="fixed top-1/2"
            translateX={false}
            side="left"
          />
        </div>
        {isSmallScreen && <NavMask navVisible={navVisible} toggleNavVisible={() => setNavVisible(false)} />}
      </>
    );
  },
);

Nav.displayName = 'Nav';

export default Nav;
