import { writable, get } from 'svelte/store';

// Persistent stores
const initialStreak = typeof window !== 'undefined'
  ? Number(localStorage.getItem('jkeysStreakCount') || 0)
  : 0;
export const streakCount = writable(initialStreak);
streakCount.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysStreakCount', String(value));
  }
});

const initialLastVisit = typeof window !== 'undefined'
  ? (localStorage.getItem('jkeysLastVisitDate') || '')
  : '';
export const lastVisitDate = writable(initialLastVisit);
lastVisitDate.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysLastVisitDate', value);
  }
});

const initialFreezeAvailable = typeof window !== 'undefined'
  ? localStorage.getItem('jkeysStreakFreezeAvailable') !== 'false'
  : true;
export const streakFreezeAvailable = writable(initialFreezeAvailable);
streakFreezeAvailable.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysStreakFreezeAvailable', String(value));
  }
});

const initialFreezeReset = typeof window !== 'undefined'
  ? (localStorage.getItem('jkeysStreakFreezeLastReset') || '')
  : '';
export const streakFreezeLastReset = writable(initialFreezeReset);
streakFreezeLastReset.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysStreakFreezeLastReset', value);
  }
});

// Helpers
export function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getTwoDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().split('T')[0];
}

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// XP bonus based on streak
export function getStreakXpBonus(streak) {
  return streak * 10;
}

// Check and update streak on app mount
export function checkAndUpdateStreak() {
  const today = new Date().toISOString().split('T')[0];
  const lastVisit = get(lastVisitDate);
  let currentStreak = get(streakCount);
  let usedFreeze = false;
  let milestone = null;

  // Reset freeze weekly
  const currentMonday = getMondayOfWeek(today);
  const lastResetMonday = get(streakFreezeLastReset);
  if (currentMonday !== lastResetMonday) {
    streakFreezeAvailable.set(true);
    streakFreezeLastReset.set(currentMonday);
  }

  if (lastVisit === today) {
    return { streak: currentStreak, usedFreeze: false, milestone: null };
  }

  const yesterday = getYesterday();
  const twoDaysAgo = getTwoDaysAgo();

  if (lastVisit === yesterday) {
    currentStreak++;
  } else if (lastVisit === twoDaysAgo && get(streakFreezeAvailable)) {
    streakFreezeAvailable.set(false);
    usedFreeze = true;
    currentStreak++;
  } else {
    currentStreak = 1;
  }

  streakCount.set(currentStreak);
  lastVisitDate.set(today);

  // Check milestones
  const milestones = [3, 7, 14, 30];
  if (milestones.includes(currentStreak)) {
    milestone = currentStreak;
  }

  return { streak: currentStreak, usedFreeze, milestone };
}
