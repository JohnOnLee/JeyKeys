import { writable } from 'svelte/store';

// Helper function to safely load items from localStorage
function getLocalStorageItem(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (item === null) return defaultValue;
  try {
    return JSON.parse(item);
  } catch {
    // If it's a raw string (like kidsTypeHighScore might be, or fallback)
    return item;
  }
}

// Helper to subscribe and write to localStorage
function createPersistentStore(key, defaultValue, isJson = true) {
  let initialValue = defaultValue;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      if (isJson) {
        try {
          initialValue = JSON.parse(saved);
        } catch {
          initialValue = defaultValue;
        }
      } else {
        initialValue = saved;
      }
    }
  }

  const store = writable(initialValue);

  store.subscribe((value) => {
    if (typeof window !== 'undefined') {
      const valueToSave = isJson ? JSON.stringify(value) : value;
      localStorage.setItem(key, valueToSave);
    }
  });

  return store;
}

// 1. soundEnabled: boolean store (handles 'true'/'false' default state)
// Note: monolithic code parses it as: localStorage.getItem('jkeysSoundEnabled') !== 'false'
// which means default is true (since null !== 'false' is true).
const initialSound = typeof window !== 'undefined' ? localStorage.getItem('jkeysSoundEnabled') !== 'false' : true;
export const soundEnabled = writable(initialSound);
soundEnabled.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysSoundEnabled', String(value));
  }
});

// 2. highScore: number store (defaults to 0)
const initialHighScore = typeof window !== 'undefined' ? Number(localStorage.getItem('kidsTypeHighScore') || 0) : 0;
export const highScore = writable(initialHighScore);
highScore.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kidsTypeHighScore', String(value));
  }
});

// 2b. mathHighScore: number store (defaults to 0)
const initialMathHighScore = typeof window !== 'undefined' ? Number(localStorage.getItem('kidsMathHighScore') || 0) : 0;
export const mathHighScore = writable(initialMathHighScore);
mathHighScore.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kidsMathHighScore', String(value));
  }
});

// 3. levelProgress: object store (defaults to {})
export const levelProgress = createPersistentStore('kidsTypeProgress', {});

// 4. diaries: array store (defaults to [])
export const diaries = createPersistentStore('kidsDiaries', []);

// 5. activeTheme: theme object (defaults to { type: 'preset', key: 'forest' })
export const activeTheme = createPersistentStore('jkeysTheme', { type: 'preset', key: 'forest' });

// 6. playerName: string store
export const playerName = createPersistentStore('jkeysPlayerName', '', false);

// 7. playerAvatar: string store (emoji)
export const playerAvatar = createPersistentStore('jkeysPlayerAvatar', '', false);

// 8. gamesPlayed tracking: which games have been visited
export const gamesPlayed = createPersistentStore('jkeysGamesPlayed', { typing: false, math: false, diary: false });

// 9. storiesCompleted: count of stories completed
export const storiesCompleted = createPersistentStore('jkeysStoriesCompleted', 0);

// 10. mathTopicsPlayed: set of topics played
export const mathTopicsPlayed = createPersistentStore('jkeysMathTopicsPlayed', []);

// Add helper functions to modify diaries and progress cleanly
export function addDiaryEntry(dateStr, content) {
  diaries.update((currentDiaries) => {
    const existingIndex = currentDiaries.findIndex((d) => d.date === dateStr);
    const updated = [...currentDiaries];
    if (!content || content.trim() === '') {
      if (existingIndex >= 0) {
        updated.splice(existingIndex, 1);
      }
      return updated;
    }
    if (existingIndex >= 0) {
      updated[existingIndex] = { ...updated[existingIndex], content };
    } else {
      updated.unshift({ date: dateStr, content });
    }
    return updated;
  });
}

export function updateLevelProgress(levelId, stars) {
  levelProgress.update((progress) => {
    const oldStars = progress[levelId] || 0;
    if (stars > oldStars) {
      return { ...progress, [levelId]: stars };
    }
    return progress;
  });
}

export function markGamePlayed(game) {
  gamesPlayed.update(current => {
    if (!current[game]) {
      return { ...current, [game]: true };
    }
    return current;
  });
}

export function markTopicPlayed(topic) {
  mathTopicsPlayed.update(current => {
    if (!current.includes(topic)) {
      return [...current, topic];
    }
    return current;
  });
}
