import { writable, get } from 'svelte/store';

// Badge definitions
export const badges = [
  // Typing
  { id: 'first-drill', name: 'First Steps', icon: '🎯', description: 'Complete your first drill', category: 'typing' },
  { id: 'all-adventure', name: 'Word Smith', icon: '📖', description: 'Complete all adventure levels', category: 'typing' },
  { id: 'speed-50', name: 'Speed Demon', icon: '⚡', description: 'Reach 50 WPM', category: 'typing' },
  { id: 'five-stories', name: 'Story Lover', icon: '📚', description: 'Complete 5 stories', category: 'typing' },
  { id: 'star-500', name: 'Star Collector', icon: '⭐', description: 'Score 500+ in Star Rush', category: 'typing' },
  { id: 'combo-25', name: 'Combo King', icon: '🔥', description: 'Get a 25-hit combo', category: 'typing' },
  { id: 'combo-50', name: 'Combo Legend', icon: '💥', description: 'Get a 50-hit combo', category: 'typing' },
  // Math
  { id: 'first-math', name: 'Number Cruncher', icon: '🔢', description: 'Complete your first math set', category: 'math' },
  { id: 'math-streak-10', name: 'Mental Giant', icon: '🧠', description: '10 correct in a row', category: 'math' },
  { id: 'time-perfect', name: 'Time Lord', icon: '🕐', description: 'Perfect score in Time Reading', category: 'math' },
  { id: 'all-topics', name: 'Math Master', icon: '🏆', description: 'Try all math topics', category: 'math' },
  // Diary
  { id: 'first-diary', name: 'Dear Diary', icon: '📔', description: 'Write your first diary entry', category: 'diary' },
  { id: 'week-writer', name: 'Week Writer', icon: '✏️', description: 'Write 7 diary entries', category: 'diary' },
  { id: 'long-entry', name: 'Story Teller', icon: '📝', description: 'Write an entry over 200 words', category: 'diary' },
  // Meta
  { id: 'explorer', name: 'Explorer', icon: '🗺️', description: 'Try all 3 games', category: 'meta' },
  { id: 'streak-7', name: 'Streak Star', icon: '🌟', description: 'Reach a 7-day streak', category: 'meta' },
  { id: 'streak-30', name: 'Streak Legend', icon: '👑', description: 'Reach a 30-day streak', category: 'meta' },
  { id: 'level-5', name: 'Rising Star', icon: '🌅', description: 'Reach level 5', category: 'meta' },
  { id: 'level-10', name: 'Shining Star', icon: '✨', description: 'Reach level 10', category: 'meta' },
  { id: 'night-owl', name: 'Night Owl', icon: '🦉', description: 'Play after 8pm', category: 'meta' },
  { id: 'early-bird', name: 'Early Bird', icon: '🐦', description: 'Play before 8am', category: 'meta' }
];

// Persistent store for unlocked achievements
const initialAchievements = typeof window !== 'undefined'
  ? (() => {
    const saved = localStorage.getItem('jkeysAchievements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  })()
  : {};

export const unlockedAchievements = writable(initialAchievements);
unlockedAchievements.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysAchievements', JSON.stringify(value));
  }
});

// Unlock a badge — returns badge object if newly unlocked, null if already had it
export function unlockAchievement(badgeId) {
  const current = get(unlockedAchievements);
  if (current[badgeId]) {
    return null;
  }
  unlockedAchievements.update((achievements) => ({
    ...achievements,
    [badgeId]: Date.now()
  }));
  return badges.find((b) => b.id === badgeId) || null;
}

// Check if a badge is unlocked
export function isUnlocked(badgeId) {
  const current = get(unlockedAchievements);
  return !!current[badgeId];
}

// Get count of unlocked achievements
export function getUnlockedCount() {
  const current = get(unlockedAchievements);
  return Object.keys(current).length;
}

// Check and unlock meta achievements based on context
export function checkMetaAchievements(context) {
  const { level, streak, hour } = context;
  const newlyUnlocked = [];

  if (level >= 5) {
    const badge = unlockAchievement('level-5');
    if (badge) newlyUnlocked.push(badge);
  }
  if (level >= 10) {
    const badge = unlockAchievement('level-10');
    if (badge) newlyUnlocked.push(badge);
  }
  if (streak >= 7) {
    const badge = unlockAchievement('streak-7');
    if (badge) newlyUnlocked.push(badge);
  }
  if (streak >= 30) {
    const badge = unlockAchievement('streak-30');
    if (badge) newlyUnlocked.push(badge);
  }
  if (hour >= 20) {
    const badge = unlockAchievement('night-owl');
    if (badge) newlyUnlocked.push(badge);
  }
  if (hour < 8) {
    const badge = unlockAchievement('early-bird');
    if (badge) newlyUnlocked.push(badge);
  }

  return newlyUnlocked;
}
