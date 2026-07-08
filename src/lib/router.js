import { writable } from 'svelte/store';

const screenToHash = {
  home: '#/home',
  typing: '#/typing',
  math: '#/math',
  diary: '#/diary',
  achievements: '#/achievements',
  farmtycoon: '#/farmtycoon'
};

const hashToScreen = {
  '#/home': 'home',
  '#/typing': 'typing',
  '#/math': 'math',
  '#/diary': 'diary',
  '#/achievements': 'achievements',
  '#/farmtycoon': 'farmtycoon'
};

const DEFAULT_SCREEN = 'home';

function getScreenFromHash() {
  if (typeof window === 'undefined') return DEFAULT_SCREEN;
  const hash = window.location.hash;
  return hashToScreen[hash] || DEFAULT_SCREEN;
}

const currentScreenStore = writable(getScreenFromHash());

let lastHash = typeof window !== 'undefined' ? window.location.hash : '';
let isReverting = false;
const guards = new Set();

export const router = {
  subscribe: currentScreenStore.subscribe,
  
  navigate(screen) {
    const hash = screenToHash[screen];
    if (hash && typeof window !== 'undefined') {
      window.location.hash = hash;
    }
  },
  
  back() {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }
};

export function registerGuard(guardFn) {
  guards.add(guardFn);
  return () => {
    guards.delete(guardFn);
  };
}

export function checkGuards() {
  for (const guard of guards) {
    const result = guard();
    if (typeof result === 'string') {
      return result;
    }
  }
  return null;
}

if (typeof window !== 'undefined') {
  // If hash is not set or invalid, redirect to default screen hash
  if (!window.location.hash || !hashToScreen[window.location.hash]) {
    window.location.hash = screenToHash[DEFAULT_SCREEN];
    lastHash = screenToHash[DEFAULT_SCREEN];
  }

  window.addEventListener('hashchange', () => {
    if (isReverting) {
      isReverting = false;
      return;
    }

    const newHash = window.location.hash;
    const newScreen = hashToScreen[newHash] || DEFAULT_SCREEN;

    // Check active navigation guards
    const guardMsg = checkGuards();
    if (guardMsg) {
      const confirmLeave = window.confirm(guardMsg);
      if (!confirmLeave) {
        // User cancelled, revert to the last hash
        isReverting = true;
        window.location.hash = lastHash;
        return;
      }
    }

    // Navigation approved
    lastHash = newHash;
    currentScreenStore.set(newScreen);
  });
}
