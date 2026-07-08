import { writable, get } from 'svelte/store';
import {
  playerName,
  playerAvatar,
  highScore,
  mathHighScore,
  levelProgress,
  gamesPlayed,
  storiesCompleted,
  mathTopicsPlayed,
  diaries,
  points,
  farmGrid,
  farmInventory,
  defaultFarmGrid,
  cityGrid,
  cityInventory,
  defaultGrid,
  farmXpPool
} from './state.js';
import { totalXp, currentLevel } from './xp.js';
import { streakCount, lastVisitDate } from './streak.js';
import { unlockedAchievements } from './achievements.js';
import { dailyChallengeProgress } from './dailyChallenge.js';

// Persistent store for profiles list
const initialProfiles = typeof window !== 'undefined'
  ? (() => {
      const saved = localStorage.getItem('jkeysProfiles');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
      return [];
    })()
  : [];

export const profiles = writable(initialProfiles);
profiles.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysProfiles', JSON.stringify(value));
  }
});

// Persistent store for active profile ID
const initialActiveId = typeof window !== 'undefined'
  ? (localStorage.getItem('jkeysActiveProfileId') || '')
  : '';

export const activeProfileId = writable(initialActiveId);
activeProfileId.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jkeysActiveProfileId', value);
  }
});

let saveTimeout = null;

// Direct synchronous save function
export function saveCurrentProfileStateDirect() {
  const currentId = get(activeProfileId);
  if (!currentId) return;

  const currentData = {
    playerName: get(playerName),
    playerAvatar: get(playerAvatar),
    totalXp: get(totalXp),
    currentLevel: get(currentLevel),
    highScore: get(highScore),
    mathHighScore: get(mathHighScore),
    streakCount: get(streakCount),
    lastVisitDate: get(lastVisitDate),
    levelProgress: get(levelProgress),
    unlockedAchievements: get(unlockedAchievements),
    gamesPlayed: get(gamesPlayed),
    storiesCompleted: get(storiesCompleted),
    mathTopicsPlayed: get(mathTopicsPlayed),
    dailyChallengeProgress: get(dailyChallengeProgress),
    diaries: get(diaries),
    points: get(points),
    farmGrid: get(farmGrid),
    farmInventory: get(farmInventory),
    cityGrid: get(cityGrid),
    cityInventory: get(cityInventory),
    farmXpPool: get(farmXpPool)
  };

  localStorage.setItem(`jkeysProfileData_${currentId}`, JSON.stringify(currentData));
}

// Debounced save helper to prevent I/O stutters
export function saveCurrentProfileState() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    saveCurrentProfileStateDirect();
  }, 250);
}

// Register beforeunload listener to flush pending saves before page close/reload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    saveCurrentProfileStateDirect();
  });
}


// Function to switch profiles
export function switchProfile(newProfileId) {
  if (typeof window === 'undefined') return;

  // Flush any pending save before switching profile
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  saveCurrentProfileStateDirect();

  const newData = JSON.parse(localStorage.getItem(`jkeysProfileData_${newProfileId}`) || 'null');
  if (newData) {
    playerName.set(newData.playerName || '');
    playerAvatar.set(newData.playerAvatar || '🎮');
    totalXp.set(newData.totalXp || 0);
    currentLevel.set(newData.currentLevel || 1);
    highScore.set(newData.highScore || 0);
    mathHighScore.set(newData.mathHighScore || 0);
    streakCount.set(newData.streakCount || 0);
    lastVisitDate.set(newData.lastVisitDate || '');
    levelProgress.set(newData.levelProgress || {});
    unlockedAchievements.set(newData.unlockedAchievements || {});
    gamesPlayed.set(newData.gamesPlayed || { typing: false, math: false, diary: false });
    storiesCompleted.set(newData.storiesCompleted || 0);
    mathTopicsPlayed.set(newData.mathTopicsPlayed || []);
    dailyChallengeProgress.set(newData.dailyChallengeProgress || { date: '', round: 0, progress: {} });
    diaries.set(newData.diaries || []);
    points.set(newData.points !== undefined ? newData.points : 0);
    farmGrid.set(JSON.parse(JSON.stringify(newData.farmGrid || defaultFarmGrid)));
    farmInventory.set(newData.farmInventory || {
      seeds: { wheat: 0, carrot: 0, corn: 0 },
      goods: { wheat: 0, carrot: 0, corn: 0, egg: 0, wool: 0, milk: 0 }
    });
    cityGrid.set(newData.cityGrid || defaultGrid);
    cityInventory.set(newData.cityInventory || {});
    farmXpPool.set(newData.farmXpPool || 0);
  }

  activeProfileId.set(newProfileId);
}

// Function to create a new profile and switch to it
export function createProfile(name, avatar) {
  if (typeof window === 'undefined') return;

  const newId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Create profile data block
  const freshData = {
    playerName: name,
    playerAvatar: avatar,
    totalXp: 0,
    currentLevel: 1,
    highScore: 0,
    mathHighScore: 0,
    streakCount: 0,
    lastVisitDate: '',
    levelProgress: {},
    unlockedAchievements: {},
    gamesPlayed: { typing: false, math: false, diary: false },
    storiesCompleted: 0,
    mathTopicsPlayed: [],
    dailyChallengeProgress: { date: '', round: 0, progress: {} },
    diaries: [],
    points: 0,
    farmGrid: JSON.parse(JSON.stringify(defaultFarmGrid)),
    farmInventory: {
      seeds: { wheat: 0, carrot: 0, corn: 0 },
      goods: { wheat: 0, carrot: 0, corn: 0, egg: 0, wool: 0, milk: 0 }
    },
    cityGrid: defaultGrid,
    cityInventory: {},
    farmXpPool: 0
  };

  localStorage.setItem(`jkeysProfileData_${newId}`, JSON.stringify(freshData));

  // Add to profiles list
  profiles.update(list => [...list, { id: newId, name, avatar }]);

  // Switch
  switchProfile(newId);
}

// Function to delete a profile
export function deleteProfile(profileId) {
  if (typeof window === 'undefined') return;

  profiles.update(list => list.filter(p => p.id !== profileId));
  localStorage.removeItem(`jkeysProfileData_${profileId}`);

  const activeId = get(activeProfileId);
  if (activeId === profileId) {
    const list = get(profiles);
    if (list.length > 0) {
      switchProfile(list[0].id);
    } else {
      activeProfileId.set('');
      playerName.set('');
      playerAvatar.set('');
    }
  }
}

// Migration logic to preserve existing single-user data
export function migrateExistingData() {
  if (typeof window === 'undefined') return;

  const currentList = get(profiles);
  if (currentList.length === 0) {
    const existingName = get(playerName);
    if (existingName) {
      // Create migration profile
      const defaultId = 'profile_default';
      const existingAvatar = get(playerAvatar) || '🦊';
      const existingXp = get(totalXp);
      
      const migratedData = {
        playerName: existingName,
        playerAvatar: existingAvatar,
        totalXp: existingXp,
        currentLevel: get(currentLevel),
        highScore: get(highScore),
        mathHighScore: get(mathHighScore),
        streakCount: get(streakCount),
        lastVisitDate: get(lastVisitDate),
        levelProgress: get(levelProgress),
        unlockedAchievements: get(unlockedAchievements),
        gamesPlayed: get(gamesPlayed),
        storiesCompleted: get(storiesCompleted),
        mathTopicsPlayed: get(mathTopicsPlayed),
        dailyChallengeProgress: get(dailyChallengeProgress),
        diaries: get(diaries),
        points: existingXp,
        farmGrid: JSON.parse(JSON.stringify(defaultFarmGrid)),
        farmInventory: {
          seeds: { wheat: 0, carrot: 0, corn: 0 },
          goods: { wheat: 0, carrot: 0, corn: 0, egg: 0, wool: 0, milk: 0 }
        },
        cityGrid: defaultGrid,
        cityInventory: {},
        farmXpPool: 0
      };

      localStorage.setItem(`jkeysProfileData_${defaultId}`, JSON.stringify(migratedData));
      
      // Update profiles list
      profiles.set([{ id: defaultId, name: existingName, avatar: existingAvatar }]);
      activeProfileId.set(defaultId);

      // Set the active stores as well
      points.set(existingXp);
      farmGrid.set(JSON.parse(JSON.stringify(defaultFarmGrid)));
      farmInventory.set({
        seeds: { wheat: 0, carrot: 0, corn: 0 },
        goods: { wheat: 0, carrot: 0, corn: 0, egg: 0, wool: 0, milk: 0 }
      });
      cityGrid.set(defaultGrid);
      cityInventory.set({});
      farmXpPool.set(0);
    }
  }
}
