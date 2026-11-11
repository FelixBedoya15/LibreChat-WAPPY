import { atom } from 'recoil';
import { safeGetItem, safeSetItem } from '~/utils/safeStorage';

// Improved helper function to create atoms with localStorage
export function atomWithLocalStorage<T>(key: string, defaultValue: T) {
  return atom<T>({
    key,
    default: defaultValue,
    effects_UNSTABLE: [
      ({ setSelf, onSet }) => {
        const savedValue = safeGetItem(key);
        if (savedValue !== null) {
          try {
            const parsedValue = JSON.parse(savedValue);
            setSelf(parsedValue);
          } catch (e) {
            console.error(
              `Error parsing localStorage key "${key}", \`savedValue\`: defaultValue, error:`,
              e,
            );
            safeSetItem(key, JSON.stringify(defaultValue));
            setSelf(defaultValue);
          }
        }

        onSet((newValue: T) => {
          safeSetItem(key, JSON.stringify(newValue));
        });
      },
    ],
  });
}
