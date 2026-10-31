import {
  format,
  isToday,
  subDays,
  getYear,
  parseISO,
  startOfDay,
  startOfYear,
  isWithinInterval,
} from 'date-fns';
import { QueryClient } from '@tanstack/react-query';
import { EModelEndpoint, LocalStorageKeys, QueryKeys } from 'librechat-data-provider';
import type { TConversation, GroupedConversations } from 'librechat-data-provider';
import type { InfiniteData } from '@tanstack/react-query';

// Date group helpers
export const dateKeys = {
  today: 'com_ui_date_today',
  yesterday: 'com_ui_date_yesterday',
  previous7Days: 'com_ui_date_previous_7_days',
  previous30Days: 'com_ui_date_previous_30_days',
  january: 'com_ui_date_january',
  february: 'com_ui_date_february',
  march: 'com_ui_date_march',
  april: 'com_ui_date_april',
  may: 'com_ui_date_may',
  june: 'com_ui_date_june',
  july: 'com_ui_date_july',
  august: 'com_ui_date_august',
  september: 'com_ui_date_september',
  october: 'com_ui_date_october',
  november: 'com_ui_date_november',
  december: 'com_ui_date_december',
};

const getGroupName = (date: Date) => {
  const now = new Date(Date.now());
  if (isToday(date)) {
    return dateKeys.today;
  }
  if (isWithinInterval(date, { start: startOfDay(subDays(now, 1)), end: now })) {
    return dateKeys.yesterday;
  }
  if (isWithinInterval(date, { start: subDays(now, 7), end: now })) {
    return dateKeys.previous7Days;
  }
  if (isWithinInterval(date, { start: subDays(now, 30), end: now })) {
    return dateKeys.previous30Days;
  }
  if (isWithinInterval(date, { start: startOfYear(now), end: now })) {
    const month = format(date, 'MMMM').toLowerCase();
    return dateKeys[month];
  }
  return ' ' + getYear(date).toString();
};

const monthOrderMap = new Map([
  ['december', 11],
  ['november', 10],
  ['october', 9],
  ['september', 8],
  ['august', 7],
  ['july', 6],
  ['june', 5],
  ['may', 4],
  ['april', 3],
  ['march', 2],
  ['february', 1],
  ['january', 0],
]);
const dateKeysReverse = Object.fromEntries(Object.entries(dateKeys).map(([k, v]) => [v, k]));
const dateGroupsSet = new Set([
  dateKeys.today,
  dateKeys.yesterday,
  dateKeys.previous7Days,
  dateKeys.previous30Days,
]);

export const groupConversationsByDate = (
  conversations: Array<TConversation | null>,
): GroupedConversations => {
  if (!Array.isArray(conversations)) {
    return [];
  }
  const seenConversationIds = new Set();
  const groups = new Map();
  const now = new Date(Date.now());

  conversations.forEach((conversation) => {
    if (!conversation || seenConversationIds.has(conversation.conversationId)) {
      return;
    }
    seenConversationIds.add(conversation.conversationId);

    let date: Date;
    if (conversation.updatedAt) {
      date = parseISO(conversation.updatedAt);
    } else {
      date = now;
    }
    const groupName = getGroupName(date);
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName).push(conversation);
  });

  const sortedGroups = new Map();
  dateGroupsSet.forEach((group) => {
    if (groups.has(group)) {
      sortedGroups.set(group, groups.get(group));
    }
  });

  const yearMonthGroups = Array.from(groups.keys())
    .filter((group) => !dateGroupsSet.has(group))
    .sort((a, b) => {
      const [yearA, yearB] = [parseInt(a.trim()), parseInt(b.trim())];
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      const [monthA, monthB] = [dateKeysReverse[a], dateKeysReverse[b]];
      const bOrder = monthOrderMap.get(monthB) ?? -1,
        aOrder = monthOrderMap.get(monthA) ?? -1;
      return bOrder - aOrder;
    });
  yearMonthGroups.forEach((group) => {
    sortedGroups.set(group, groups.get(group));
  });

  sortedGroups.forEach((conversations) => {
    conversations.sort(
      (a: TConversation, b: TConversation) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  });
  return Array.from(sortedGroups, ([key, value]) => [key, value]);
};

export type ConversationCursorData = {
  conversations: TConversation[];
  nextCursor?: string | null;
};

// === InfiniteData helpers for cursor-based convo queries ===

export function findConversationInInfinite(
  data: InfiniteData<ConversationCursorData> | undefined,
  conversationId: string,
): TConversation | undefined {
  if (!data) {
    return undefined;
  }
  for (const page of data.pages) {
    const found = page.conversations.find((c) => c.conversationId === conversationId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

export function updateInfiniteConvoPage(
  data: InfiniteData<ConversationCursorData> | undefined,
  conversationId: string,
  updater: (c: TConversation) => TConversation,
): InfiniteData<ConversationCursorData> | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      conversations: page.conversations.map((c) =>
        c.conversationId === conversationId ? updater(c) : c,
      ),
    })),
  };
}

export function addConversationToInfinitePages(
  data: InfiniteData<ConversationCursorData> | undefined,
  newConversation: TConversation,
): InfiniteData<ConversationCursorData> {
  if (!data) {
    return {
      pageParams: [undefined],
      pages: [{ conversations: [newConversation], nextCursor: null }],
    };
  }
  return {
    ...data,
    pages: [
      { ...data.pages[0], conversations: [newConversation, ...data.pages[0].conversations] },
      ...data.pages.slice(1),
    ],
  };
}

export function addConversationToAllConversationsQueries(
  queryClient: QueryClient,
  newConversation: TConversation,
) {
  // Find all keys that start with QueryKeys.allConversations
  const queries = queryClient
    .getQueryCache()
    .findAll([QueryKeys.allConversations], { exact: false });

  for (const query of queries) {
    queryClient.setQueryData<InfiniteData<ConversationCursorData>>(query.queryKey, (old) => {
      if (
        !old ||
        old.pages[0].conversations.some((c) => c.conversationId === newConversation.conversationId)
      ) {
        return old;
      }
      return {
        ...old,
        pages: [
          {
            ...old.pages[0],
            conversations: [newConversation, ...old.pages[0].conversations],
          },
          ...old.pages.slice(1),
        ],
      };
    });
  }
}

export function removeConvoFromInfinitePages(
  data: InfiniteData<ConversationCursorData> | undefined,
  conversationId: string,
): InfiniteData<ConversationCursorData> | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages
      .map((page) => ({
        ...page,
        conversations: page.conversations.filter((c) => c.conversationId !== conversationId),
      }))
      .filter((page) => page.conversations.length > 0),
  };
}

// Used for partial update (e.g., title, etc.), updating AND possibly bumping to front of visible convos
export function updateConvoFieldsInfinite(
  data: InfiniteData<ConversationCursorData> | undefined,
  updatedConversation: Partial<TConversation> & { conversationId: string },
  keepPosition = false,
): InfiniteData<ConversationCursorData> | undefined {
  if (!data) {
    return data;
  }
  let found: TConversation | undefined;
  let pageIdx = -1,
    convoIdx = -1;
  for (let i = 0; i < data.pages.length; ++i) {
    const idx = data.pages[i].conversations.findIndex(
      (c) => c.conversationId === updatedConversation.conversationId,
    );
    if (idx !== -1) {
      pageIdx = i;
      convoIdx = idx;
      found = data.pages[i].conversations[idx];
      break;
    }
  }
  if (!found) {
    return data;
  }

  if (keepPosition) {
    return {
      ...data,
      pages: data.pages.map((page, pi) =>
        pi === pageIdx
          ? {
              ...page,
              conversations: page.conversations.map((c, ci) =>
                ci === convoIdx ? { ...c, ...updatedConversation } : c,
              ),
            }
          : page,
      ),
    };
  } else {
    const patched = { ...found, ...updatedConversation, updatedAt: new Date().toISOString() };
    const pages = data.pages.map((page) => ({
      ...page,
      conversations: page.conversations.filter((c) => c.conversationId !== patched.conversationId),
    }));

    pages[0].conversations = [patched, ...pages[0].conversations];

    const finalPages = pages.filter((page) => page.conversations.length > 0);
    return { ...data, pages: finalPages };
  }
}

export function storeEndpointSettings(conversation: TConversation | null) {
  if (!conversation) {
    return;
  }
  const { endpoint, model, agentOptions } = conversation;
  if (!endpoint) {
    return;
  }
  const lastModel = JSON.parse(localStorage.getItem(LocalStorageKeys.LAST_MODEL) ?? '{}');
  lastModel[endpoint] = model;
  if (endpoint === EModelEndpoint.gptPlugins) {
    lastModel.secondaryModel = agentOptions?.model ?? model ?? '';
  }
  localStorage.setItem(LocalStorageKeys.LAST_MODEL, JSON.stringify(lastModel));
}

// Add
export function addConvoToAllQueries(queryClient: QueryClient, newConvo: TConversation) {
  const queries = queryClient
    .getQueryCache()
    .findAll([QueryKeys.allConversations], { exact: false });

  for (const query of queries) {
    queryClient.setQueryData<InfiniteData<ConversationCursorData>>(query.queryKey, (oldData) => {
      if (!oldData) {
        return oldData;
      }
      if (
        oldData.pages.some((p) =>
          p.conversations.some((c) => c.conversationId === newConvo.conversationId),
        )
      ) {
        return oldData;
      }
      return {
        ...oldData,
        pages: [
          {
            ...oldData.pages[0],
            conversations: [newConvo, ...oldData.pages[0].conversations],
          },
          ...oldData.pages.slice(1),
        ],
      };
    });
  }
}

// Update
export function updateConvoInAllQueries(
  queryClient: QueryClient,
  conversationId: string,
  updater: (c: TConversation) => TConversation,
) {
  const queries = queryClient
    .getQueryCache()
    .findAll([QueryKeys.allConversations], { exact: false });

  for (const query of queries) {
    queryClient.setQueryData<InfiniteData<ConversationCursorData>>(query.queryKey, (oldData) => {
      if (!oldData) {
        return oldData;
      }
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          conversations: page.conversations.map((c) =>
            c.conversationId === conversationId ? updater(c) : c,
          ),
        })),
      };
    });
  }
}

// Remove
export function removeConvoFromAllQueries(queryClient: QueryClient, conversationId: string) {
  const queries = queryClient
    .getQueryCache()
    .findAll([QueryKeys.allConversations], { exact: false });

  for (const query of queries) {
    queryClient.setQueryData<InfiniteData<ConversationCursorData>>(query.queryKey, (oldData) => {
      if (!oldData) {
        return oldData;
      }
      return {
        ...oldData,
        pages: oldData.pages
          .map((page) => ({
            ...page,
            conversations: page.conversations.filter((c) => c.conversationId !== conversationId),
          }))
          .filter((page) => page.conversations.length > 0),
      };
    });
  }
}

// === WAPPY Pinned & Inactive Conversation Helpers ===

export const PINNED_CONVOS_STORAGE_KEY = 'wappy_pinned_convos';
const unpinnedInSession = new Set<string>();

export function getPinnedConvoIds(): Set<string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return new Set<string>();
  }
  try {
    const raw = localStorage.getItem(PINNED_CONVOS_STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }
    return new Set(
      parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
    );
  } catch {
    return new Set<string>();
  }
}

export function isConversationPinned(
  convo: TConversation | null | undefined,
  pinnedSet?: Set<string>,
): boolean {
  if (!convo || !convo.conversationId) {
    return false;
  }
  const id = convo.conversationId;
  if (unpinnedInSession.has(id)) {
    return false;
  }
  const activeSet = pinnedSet ?? getPinnedConvoIds();
  if (activeSet.has(id)) {
    return true;
  }
  return Array.isArray(convo.tags) && convo.tags.includes('pinned');
}

export function togglePinnedConvoLocal(conversationId: string, shouldPin: boolean): string[] {
  const cleanId = conversationId?.trim() || '';
  if (!cleanId) {
    return Array.from(getPinnedConvoIds());
  }
  const currentSet = getPinnedConvoIds();
  if (shouldPin) {
    currentSet.add(cleanId);
    unpinnedInSession.delete(cleanId);
  } else {
    currentSet.delete(cleanId);
    unpinnedInSession.add(cleanId);
  }
  const updatedList = Array.from(currentSet);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(PINNED_CONVOS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore storage quota errors
    }
    window.dispatchEvent(
      new CustomEvent('wappy-pinned-updated', {
        detail: { conversationId: cleanId, isPinned: shouldPin, pinnedIds: updatedList },
      }),
    );
  }
  return updatedList;
}

export function partitionConversationsForSidebar(
  conversations: Array<TConversation | null>,
  pinnedIds?: Set<string>,
  inactiveDays = 3,
): {
  pinnedConvos: TConversation[];
  recentGroups: GroupedConversations;
  inactiveGroups: GroupedConversations;
  inactiveConvos: TConversation[];
} {
  if (!Array.isArray(conversations)) {
    return {
      pinnedConvos: [],
      recentGroups: [],
      inactiveGroups: [],
      inactiveConvos: [],
    };
  }

  const effectivePinned = pinnedIds ?? getPinnedConvoIds();
  const cutoffTime = subDays(new Date(Date.now()), inactiveDays).getTime();
  const seenIds = new Set<string>();

  const pinnedConvos: TConversation[] = [];
  const recentRaw: TConversation[] = [];
  const inactiveConvos: TConversation[] = [];

  for (const convo of conversations) {
    if (!convo || !convo.conversationId || seenIds.has(convo.conversationId)) {
      continue;
    }
    seenIds.add(convo.conversationId);

    if (isConversationPinned(convo, effectivePinned)) {
      pinnedConvos.push(convo);
      continue;
    }

    const updatedTime = convo.updatedAt ? new Date(convo.updatedAt).getTime() : Date.now();
    const isRecent = Number.isNaN(updatedTime) ? true : updatedTime >= cutoffTime;

    if (isRecent) {
      recentRaw.push(convo);
    } else {
      inactiveConvos.push(convo);
    }
  }

  pinnedConvos.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
  );
  inactiveConvos.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
  );

  return {
    pinnedConvos,
    recentGroups: groupConversationsByDate(recentRaw),
    inactiveGroups: groupConversationsByDate(inactiveConvos),
    inactiveConvos,
  };
}

