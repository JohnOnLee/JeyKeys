<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { soundEnabled, activeTheme, playerName, playerAvatar, gamesPlayed, points } from './lib/state.js';
  import { applyTheme } from './lib/theme.js';
  import { playSound } from './lib/audio.js';
  import { router } from './lib/router.js';
  import { totalXp, currentLevel, xpProgress, xpToNextLevel } from './lib/xp.js';
  import { streakCount, checkAndUpdateStreak } from './lib/streak.js';
  import { unlockedAchievements, badges, checkMetaAchievements, unlockAchievement } from './lib/achievements.js';
  import { showToast } from './lib/toastStore.js';
  import { migrateExistingData, activeProfileId } from './lib/profiles.js';
  
  import ThemeSettings from './components/ThemeSettings.svelte';
  import Toast from './components/Toast.svelte';
  import MainPage from './components/MainPage.svelte';
  import TypingGame from './components/TypingGame.svelte';
  import MathGame from './components/MathGame.svelte';
  import Diary from './components/Diary.svelte';
  import FarmTycoon from './components/FarmTycoon.svelte';
  
  // New components
  import WelcomeModal from './components/WelcomeModal.svelte';
  import AchievementPopup from './components/AchievementPopup.svelte';
  import AchievementGallery from './components/AchievementGallery.svelte';

  let showWelcome = false;
  let previousUnlocked = {};
  let previousLevel = 1;
  let showLevelUpGlow = false;
  let achievementPopupEl;

  let currentProfileId = '';

  $: {
    const activeId = $activeProfileId;
    if (activeId !== currentProfileId) {
      previousUnlocked = { ...$unlockedAchievements };
      previousLevel = $currentLevel;
      currentProfileId = activeId;
    }
  }

  // React to unlockedAchievements to trigger the slide-in popup
  $: {
    const currentUnlocked = $unlockedAchievements;
    const currentUnlockedKeys = Object.keys(currentUnlocked);
    const prevUnlockedKeys = Object.keys(previousUnlocked);
    
    if (prevUnlockedKeys.length > 0) {
      for (const id of currentUnlockedKeys) {
        if (!previousUnlocked[id]) {
          const badge = badges.find(b => b.id === id);
          if (badge && achievementPopupEl) {
            achievementPopupEl.showAchievement(badge);
          }
        }
      }
    }
    previousUnlocked = { ...currentUnlocked };
  }

  $: {
    const lvl = $currentLevel;
    if (lvl > previousLevel) {
      playSound('level-up');
      showLevelUpGlow = true;
      setTimeout(() => { showLevelUpGlow = false; }, 2000);
      showToast(`🎉 Level Up! You are now Level ${lvl}! (+1 🎟️ Advance Time Ticket)`);
    }
    previousLevel = lvl;
  }

  // React to general state/streak/level to trigger meta achievements check
  $: {
    const lvl = $currentLevel;
    const streak = $streakCount;
    if (typeof window !== 'undefined') {
      checkMetaAchievements({ level: lvl, streak, hour: new Date().getHours() });
    }
  }

  // Check explorer badge when gamesPlayed changes
  $: {
    const played = $gamesPlayed;
    if (played.typing && played.math && played.diary) {
      unlockAchievement('explorer');
    }
  }

  onMount(() => {
    // Migrate existing single-user data
    migrateExistingData();

    // Load stored theme on start
    applyTheme($activeTheme);

    // Check welcome flow
    if (!$playerName || !$playerAvatar) {
      showWelcome = true;
    } else {
      playSound('welcome');
    }

    // Check streak
    const streakResult = checkAndUpdateStreak();
    if (streakResult && streakResult.usedFreeze) {
      playSound('streak');
      showToast("❄️ Streak freeze used! Streak kept safe.");
    } else if (streakResult && streakResult.streak > 1) {
      playSound('streak');
    }
  });

  function handleHomeClick() {
    playSound('click');
    router.navigate('home');
  }

  function toggleMute() {
    playSound('click');
    soundEnabled.update((val) => !val);
  }

  $: progress = xpProgress($totalXp, $currentLevel);
  $: xpNeeded = xpToNextLevel($totalXp, $currentLevel);
</script>

<div class="container" class:level-up-glow={showLevelUpGlow}>
  <header>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <h1 style="cursor: pointer;" on:click={handleHomeClick}>
      ✨ JKeys - Kids Learning Hub
    </h1>
    
    <!-- XP Bar in header -->
    {#if $playerName}
      <div class="xp-bar-container" style="max-width: 450px; margin: 0 20px; flex: 1; display: flex; align-items: center; gap: 15px;">
        <div style="flex: 1; display: flex; align-items: center; gap: 5px; min-width: 150px;">
          <span class="xp-bar-level">Lv.{$currentLevel}</span>
          <div class="xp-bar-track" style="flex: 1;">
            <div class="xp-bar-fill" style="width: {progress * 100}%"></div>
          </div>
          <span class="xp-bar-xp" style="margin-left: 5px; font-size: 0.75rem;">{xpNeeded} XP to Next</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; font-weight: bold; color: #fbbf24; background: rgba(251, 191, 36, 0.15); padding: 4px 10px; border-radius: 10px; border: 1px solid rgba(251, 191, 36, 0.2); font-size: 0.85rem; white-space: nowrap;">
          <span>🪙</span>
          <span>{$points} pts</span>
        </div>
      </div>
    {/if}

    <div style="display: flex; align-items: center; gap: 15px;">
      <ThemeSettings />

      <button
        id="mute-btn"
        class="btn btn-small"
        style="background: linear-gradient(45deg, #1d4ed8, #1e40af)"
        on:click={toggleMute}
      >
        {$soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
      </button>

      <button
        class="btn btn-small"
        style="background: linear-gradient(45deg, #3b82f6, #1d4ed8)"
        on:click={handleHomeClick}
      >
        🏠 Home
      </button>
    </div>
  </header>

  <!-- Screens Routing -->
  <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;">
    {#if $router === 'home'}
      <div style="width: 100%; height: 100%; position: absolute; left: 0; top: 0;" transition:fade={{ duration: 150 }}>
        <MainPage />
      </div>
    {:else if $router === 'typing'}
      <div style="width: 100%; height: 100%; position: absolute; left: 0; top: 0;" transition:fade={{ duration: 150 }}>
        <TypingGame />
      </div>
    {:else if $router === 'math'}
      <div style="width: 100%; height: 100%; position: absolute; left: 0; top: 0;" transition:fade={{ duration: 150 }}>
        <MathGame />
      </div>
    {:else if $router === 'diary'}
      <div style="width: 100%; height: 100%; position: absolute; left: 0; top: 0;" transition:fade={{ duration: 150 }}>
        <Diary />
      </div>
    {:else if $router === 'achievements'}
      <div style="width: 100%; height: 100%; position: absolute; left: 0; top: 0;" transition:fade={{ duration: 150 }}>
        <AchievementGallery />
      </div>
    {:else if $router === 'farmtycoon'}
      <div style="width: 100%; height: 100%; position: absolute; left: 0; top: 0;" transition:fade={{ duration: 150 }}>
        <FarmTycoon />
      </div>
    {/if}
  </main>

  <!-- Welcome setup modal -->
  <WelcomeModal show={showWelcome} onComplete={() => showWelcome = false} />

  <!-- Global Achievement slide-in popup -->
  <AchievementPopup bind:this={achievementPopupEl} />

  <!-- Global Toast Alerts -->
  <Toast />
</div>
