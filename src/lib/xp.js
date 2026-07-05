import { writable, get } from 'svelte/store';

// XP award constants
export const XP_TYPING_CHAR = 1;
export const XP_TYPING_LEVEL = 50;
export const XP_STAR_RUSH_MULTIPLIER = 2;
export const XP_MATH_CORRECT = 10;
export const XP_MATH_SET = 30;
export const XP_DIARY_ENTRY = 20;
export const XP_DAILY_CHALLENGE = 50;
export const XP_STREAK_MULTIPLIER = 10;

// Level titles
export const levelTitles = [
  'Keyboard Newbie',
  'Letter Learner',
  'Word Builder',
  'Sentence Starter',
  'Paragraph Pro',
  'Speed Typer',
  'Word Wizard',
  'Typing Champion',
  'Keyboard Ninja',
  'Typing Legend',
  'Grand Master',
  'Ultimate Genius'
];

// Persistent XP store
const initialXp = typeof window !== 'undefined'
  ? Number(localStorage.getItem('jkeysTotalXp') || 0)
  : 0;
export const totalXp = writable(initialXp);
totalXp.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysTotalXp', String(value));
  }
});

// Persistent level store
const initialLevel = typeof window !== 'undefined'
  ? Number(localStorage.getItem('jkeysCurrentLevel') || 1)
  : 1;
export const currentLevel = writable(initialLevel);
currentLevel.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysCurrentLevel', String(value));
  }
});

// Cumulative XP needed to reach a given level
// Level N requires N*100 cumulative XP to advance from that level
// Total XP for level L = sum(1..L-1) * 100 = L*(L-1)*50
export function totalXpForLevel(level) {
  return level * (level - 1) * 50;
}

// Remaining XP needed to reach next level
export function xpToNextLevel(currentXp, level) {
  return totalXpForLevel(level + 1) - currentXp;
}

// Progress toward next level as 0-1 float
export function xpProgress(currentXp, level) {
  const currentLevelXp = totalXpForLevel(level);
  const nextLevelXp = totalXpForLevel(level + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 1;
  const progress = (currentXp - currentLevelXp) / range;
  return Math.max(0, Math.min(1, progress));
}

// Get title for a given level
export function getLevelTitle(level) {
  const index = Math.min(level - 1, levelTitles.length - 1);
  return levelTitles[index];
}

// Add XP and check for level-up
export function addXp(amount) {
  const oldXp = get(totalXp);
  const newTotal = oldXp + amount;
  let level = get(currentLevel);
  let leveledUp = false;

  totalXp.set(newTotal);

  while (newTotal >= totalXpForLevel(level + 1)) {
    level++;
    leveledUp = true;
  }

  if (leveledUp) {
    currentLevel.set(level);
  }

  return { newTotal, leveledUp, newLevel: level };
}
