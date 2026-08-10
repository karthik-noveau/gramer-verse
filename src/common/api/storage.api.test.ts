import {
  isBoolean,
  isOneOf,
  isString,
  lastStorageFailure,
  read,
  remove,
  write,
} from 'common/api/storage.api';
import { STORAGE_KEYS } from 'common/constants/storage-keys';

const THEME = STORAGE_KEYS.theme;
const isTheme = isOneOf('light', 'dark');

/* Each test that breaks storage puts it back, so one failure cannot cascade. */
const realStorage = window.localStorage;
const restore = (): void => {
  Object.defineProperty(window, 'localStorage', {
    value: realStorage,
    configurable: true,
    writable: true,
  });
};

const replaceStorage = (fake: Partial<Storage>): void => {
  Object.defineProperty(window, 'localStorage', {
    value: fake,
    configurable: true,
    writable: true,
  });
};

beforeEach(() => {
  restore();
  window.localStorage.clear();
});

afterAll(restore);

describe('storage.api', () => {
  it('round-trips a value', () => {
    expect(write(THEME, 'dark')).toBe(true);
    expect(read(THEME, 'light', isTheme)).toBe('dark');
  });

  it('falls back when the key was never written', () => {
    expect(read(THEME, 'light', isTheme)).toBe('light');
  });

  it('falls back when the stored value is not JSON', () => {
    window.localStorage.setItem(THEME, 'dark');

    expect(read(THEME, 'light', isTheme)).toBe('light');
  });

  it('falls back when the stored value is the wrong shape', () => {
    window.localStorage.setItem(THEME, JSON.stringify({ theme: 'dark' }));

    expect(read(THEME, 'light', isTheme)).toBe('light');
  });

  it('falls back when the stored value is a string the app no longer accepts', () => {
    window.localStorage.setItem(THEME, JSON.stringify('sepia'));

    expect(read(THEME, 'light', isTheme)).toBe('light');
  });

  it('removes a key', () => {
    write(THEME, 'dark');
    remove(THEME);

    expect(read(THEME, 'light', isTheme)).toBe('light');
  });

  describe('when storage refuses to work', () => {
    it('does not throw when the whole API is blocked', () => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('The operation is insecure.');
        },
      });

      expect(read(THEME, 'light', isTheme)).toBe('light');
      expect(write(THEME, 'dark')).toBe(false);
      expect(() => remove(THEME)).not.toThrow();
      expect(lastStorageFailure()).toBe('blocked');
    });

    it('does not throw when reading is blocked', () => {
      replaceStorage({
        getItem: () => {
          throw new Error('blocked');
        },
      });

      expect(read(THEME, 'light', isTheme)).toBe('light');
      expect(lastStorageFailure()).toBe('blocked');
    });

    it('reports a quota failure and leaves the previous value intact', () => {
      write(THEME, 'dark');
      const kept = window.localStorage.getItem(THEME);

      replaceStorage({
        getItem: () => kept,
        setItem: () => {
          const error = new Error('exceeded the quota');
          error.name = 'QuotaExceededError';
          throw error;
        },
      });

      expect(write(THEME, 'light')).toBe(false);
      expect(lastStorageFailure()).toBe('quota');
      expect(read(THEME, 'light', isTheme)).toBe('dark');
    });

    it('reports a private-mode refusal as unavailable, not as quota', () => {
      replaceStorage({
        setItem: () => {
          throw new Error('The operation is not supported here.');
        },
      });

      expect(write(THEME, 'dark')).toBe(false);
      expect(lastStorageFailure()).toBe('unavailable');
    });

    it('refuses a value that cannot be serialised, without throwing', () => {
      const cyclic: Record<string, unknown> = {};
      cyclic['self'] = cyclic;

      expect(write(THEME, cyclic)).toBe(false);
    });
  });

  describe('guards', () => {
    it('accepts only what it says it accepts', () => {
      expect(isString('a')).toBe(true);
      expect(isString(1)).toBe(false);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean('false')).toBe(false);
      expect(isTheme('dark')).toBe(true);
      expect(isTheme('sepia')).toBe(false);
      expect(isTheme(null)).toBe(false);
    });
  });
});
