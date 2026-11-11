/* `useLocalStorage`
 *
 * Features:
 *  - JSON Serializing
 *  - Also value will be updated everywhere, when value updated (via `storage` event)
 */

import { useEffect, useState, useCallback } from 'react';
import { safeGetItem, safeSetItem } from '~/utils/safeStorage';

export default function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  globalSetState?: (value: T) => void,
  storageCondition?: (value: T, rawCurrentValue?: string | null) => boolean,
): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const item = safeGetItem(key);

    if (!item && !storageCondition) {
      safeSetItem(key, JSON.stringify(defaultValue));
    } else if (!item && storageCondition && storageCondition(defaultValue)) {
      safeSetItem(key, JSON.stringify(defaultValue));
    }

    let initialValue = defaultValue;
    if (item && item !== 'undefined') {
      try {
        initialValue = JSON.parse(item);
      } catch {
        initialValue = defaultValue;
      }
    }
    setValue(initialValue);
    if (globalSetState) {
      globalSetState(initialValue);
    }

    function handler(e: StorageEvent) {
      if (e.key !== key) {
        return;
      }

      const lsi = safeGetItem(key);
      if (lsi) {
        try {
          setValue(JSON.parse(lsi));
        } catch {
          setValue(defaultValue);
        }
      }
    }

    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('storage', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, globalSetState]);

  const setValueWrap = useCallback(
    (value: T) => {
      try {
        setValue(value);
        const storeLocal = () => {
          safeSetItem(key, JSON.stringify(value));
          window?.dispatchEvent(new StorageEvent('storage', { key }));
        };
        if (!storageCondition) {
          storeLocal();
        } else if (storageCondition(value, safeGetItem(key))) {
          storeLocal();
        }
        globalSetState?.(value);
      } catch (e) {
        console.error(e);
      }
    },
    [key, globalSetState, storageCondition],
  );

  return [value, setValueWrap];
}
