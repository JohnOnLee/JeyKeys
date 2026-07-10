import { writable, get } from 'svelte/store';
import { addXp, XP_DAILY_CHALLENGE } from './xp.js';

// Challenge types
const challenges = [
  { type: 'typing', description: 'Type 100 words today', target: 100, unit: 'words', icon: '⌨️' },
  { type: 'math', description: 'Get 8 out of 10 math problems correct', target: 8, unit: 'correct', icon: '🔢' },
  { type: 'diary', description: 'Write a diary entry today', target: 1, unit: 'entries', icon: '📔' },
  { type: 'combo', description: 'Get a 20-hit typing combo', target: 20, unit: 'combo', icon: '🔥' },
  { type: 'speed', description: 'Reach 30 WPM in any typing mode', target: 30, unit: 'wpm', icon: '⚡' }
];

// Deterministic selection of 3 daily challenges
export function getDailyChallenges(round) {
  const today = new Date().toISOString().split('T')[0];
  
  if (round === undefined) {
    const current = get(dailyChallengeProgress);
    round = current && current.date === today ? (current.round || 0) : 0;
  }
  
  const availableChallenges = round > 0 
    ? challenges.filter(c => c.type !== 'diary') 
    : challenges;

  const hashSeed = today + (round > 0 ? `-round${round}` : '');
  let hash = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hash += hashSeed.charCodeAt(i);
  }
  
  const indices = [];
  let currentHash = hash;
  while (indices.length < 3) {
    const index = Math.abs(currentHash) % availableChallenges.length;
    if (!indices.includes(index)) {
      indices.push(index);
    }
    currentHash = Math.floor(currentHash / 7) + 13;
  }
  
  return indices.map(idx => ({ 
    ...availableChallenges[idx], 
    date: today, 
    challengeIndex: challenges.indexOf(availableChallenges[idx]) 
  }));
}

// Helper for backward compatibility
export function getDailyChallenge() {
  const list = getDailyChallenges();
  return list[0];
}

// Persistent store for daily challenges progress
const initialProgressMap = typeof window !== 'undefined'
  ? (() => {
    const saved = localStorage.getItem('jkeysDailyChallengesProgress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { date: '', progress: {} };
      }
    }
    return { date: '', progress: {} };
  })()
  : { date: '', progress: {} };

export const dailyChallengeProgress = writable(initialProgressMap);
dailyChallengeProgress.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysDailyChallengesProgress', JSON.stringify(value));
  }
});

// Update progress for all challenges of a given type
export function updateChallengeProgress(type, value) {
  if (typeof window === 'undefined') return { completed: false, wasNew: false };

  const today = new Date().toISOString().split('T')[0];
  const activeChallenges = getDailyChallenges();
  const current = get(dailyChallengeProgress);

  let progressState = current.date === today ? { ...current.progress } : {};
  let newlyCompleted = false;

  for (const ch of activeChallenges) {
    if (ch.type === type) {
      const idx = ch.challengeIndex;
      const chState = progressState[idx] || { progress: 0, completed: false };
      
      if (!chState.completed) {
        const newProg = chState.progress + value;
        const comp = newProg >= ch.target;
        
        progressState[idx] = {
          progress: newProg,
          completed: comp
        };

        if (comp) {
          newlyCompleted = true;
        }
      }
    }
  }

  dailyChallengeProgress.set({
    date: today,
    progress: progressState
  });

  return { completed: newlyCompleted, wasNew: newlyCompleted };
}

export function isChallengeIndexCompleted(index) {
  const today = new Date().toISOString().split('T')[0];
  const current = get(dailyChallengeProgress);
  if (current.date !== today) return false;

  // 1. Handle new map schema: progress: { [index]: { progress: X, completed: Y } }
  if (current.progress && typeof current.progress === 'object') {
    const chState = current.progress[index];
    if (chState && typeof chState === 'object') {
      return !!chState.completed;
    }
    if (typeof chState === 'number') {
      const ch = challenges.find(c => c.challengeIndex === index);
      return ch ? chState >= ch.target : false;
    }
  }

  // 2. Handle old flat schema: challengeIndex: index, completed: boolean
  if (current.challengeIndex === index) {
    return !!current.completed;
  }

  return false;
}

export function getChallengeIndexProgress(index) {
  const today = new Date().toISOString().split('T')[0];
  const current = get(dailyChallengeProgress);
  if (current.date !== today) return 0;

  // 1. Handle new map schema
  if (current.progress && typeof current.progress === 'object') {
    const chState = current.progress[index];
    if (chState && typeof chState === 'object') {
      return typeof chState.progress === 'number' ? chState.progress : 0;
    }
    if (typeof chState === 'number') {
      return chState;
    }
  }

  // 2. Handle old flat schema
  if (current.challengeIndex === index && typeof current.progress === 'number') {
    return current.progress;
  }

  return 0;
}

// Check if all active challenges are completed
export function isChallengeCompleted() {
  const active = getDailyChallenges();
  return active.every(ch => isChallengeIndexCompleted(ch.challengeIndex));
}

// Start next round of daily challenges
export function startNextChallengeRound() {
  if (typeof window === 'undefined') return;

  const today = new Date().toISOString().split('T')[0];
  const current = get(dailyChallengeProgress);
  const round = current.date === today ? (current.round || 0) : 0;
  const nextRound = round + 1;

  // Set store with new round and empty progress
  dailyChallengeProgress.set({
    date: today,
    round: nextRound,
    progress: {}
  });

  // Award bonus XP
  addXp(XP_DAILY_CHALLENGE);
}
