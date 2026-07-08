<script>
  import { router } from '../lib/router.js';
  import { playSound } from '../lib/audio.js';
  import { playerName, playerAvatar, highScore, mathHighScore, levelProgress, diaries, points, farmGrid } from '../lib/state.js';
  import PetAvatar from './PetAvatar.svelte';
  import { getAvatarAsset } from '../lib/shop.js';
  import { totalXp, currentLevel, getLevelTitle, xpProgress, xpToNextLevel } from '../lib/xp.js';
  import { streakCount } from '../lib/streak.js';
  import { getDailyChallenges, dailyChallengeProgress, isChallengeIndexCompleted, getChallengeIndexProgress, startNextChallengeRound, isChallengeCompleted } from '../lib/dailyChallenge.js';
  import { showToast } from '../lib/toastStore.js';
  import { unlockedAchievements, badges } from '../lib/achievements.js';
  import { profiles, activeProfileId, switchProfile, createProfile } from '../lib/profiles.js';

  $: cropsPlanted = $farmGrid.filter(c => c.type === 'crop').length;
  $: animalsPlaced = $farmGrid.filter(c => c.type === 'animal').length;

  function handleNavigate(screen) {
    playSound('click');
    router.navigate(screen);
  }

  let activeChallengeIdx = 0;
  $: challengesList = $dailyChallengeProgress ? getDailyChallenges() : [];
  $: activeChallenge = challengesList[activeChallengeIdx];
  $: activeChallengeCompleted = $dailyChallengeProgress && activeChallenge && isChallengeIndexCompleted(activeChallenge.challengeIndex);
  $: activeChallengeProg = $dailyChallengeProgress && activeChallenge && getChallengeIndexProgress(activeChallenge.challengeIndex);
  $: allChallengesCompleted = $dailyChallengeProgress && isChallengeCompleted();

  function navigateChallenge(dir) {
    playSound('click');
    activeChallengeIdx = (activeChallengeIdx + dir + 3) % 3;
  }

  function triggerNextRound() {
    playSound('welcome');
    startNextChallengeRound();
    showToast("🎉 Bonus Round Started! +50 XP!");
    activeChallengeIdx = 0;
  }

  $: progress = xpProgress($totalXp, $currentLevel);
  $: xpNeeded = xpToNextLevel($totalXp, $currentLevel);
  $: levelTitle = getLevelTitle($currentLevel);
  $: totalStars = Object.values($levelProgress).reduce((sum, s) => sum + s, 0);
  $: badgeCount = Object.keys($unlockedAchievements).length;
  let showProfileManager = false;
  let managerStep = 0; // 0: main profiles list/avatar edit, 1: add avatar selection, 2: add name input
  let newAvatar = '';
  let newName = '';

  const avatars = ['🦁', '🐼', '🦊', '🐸', '🦋', '🐙', '🦄', '🐲', '🐯', '🐨', '🦜', '🐬'];

  function openProfileManager() {
    playSound('click');
    managerStep = 0;
    showProfileManager = true;
  }

  function handleSwitchProfile(profileId) {
    playSound('welcome');
    switchProfile(profileId);
    showProfileManager = false;
  }

  function changeAvatar(emoji) {
    playSound('click');
    playerAvatar.set(emoji);
    
    // Update the profile's avatar inside the profiles array store
    profiles.update(list => list.map(p => p.id === $activeProfileId ? { ...p, avatar: emoji } : p));
  }

  function handleAddNewProfile() {
    playSound('click');
    newAvatar = '';
    newName = '';
    managerStep = 1;
  }

  function selectNewAvatar(emoji) {
    playSound('click');
    newAvatar = emoji;
  }

  function nextNewStep() {
    if (!newAvatar) return;
    playSound('click');
    managerStep = 2;
  }

  function finishNewProfile() {
    if (!newName.trim()) return;
    createProfile(newName.trim(), newAvatar);
    showProfileManager = false;
  }

  function handleChallengeClick(type) {
    if (type === 'typing' || type === 'combo' || type === 'speed') {
      handleNavigate('typing');
    } else if (type === 'math') {
      handleNavigate('math');
    } else if (type === 'diary') {
      handleNavigate('diary');
    }
  }
</script>

<div class="home-screen active">
  <!-- Player Profile -->
  <div class="player-profile">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div style="cursor: pointer;" on:click={openProfileManager} title="Switch profile or change avatar">
      <PetAvatar petId={$playerAvatar} size="medium" />
    </div>
    <div class="player-info">
      <div class="player-name">{$playerName || 'Player'}</div>
      <div class="player-title">{levelTitle}</div>
    </div>
    <div class="player-stats">
      <div class="streak-display">
        <span class="streak-flame">🔥</span>
        <span class="streak-count">{$streakCount}</span>
        <span class="streak-label">streak</span>
      </div>
    </div>
  </div>

  <!-- XP Bar -->
  <div class="xp-bar-container" style="width: 100%; margin-bottom: 20px;">
    <span class="xp-bar-level">Lv.{$currentLevel}</span>
    <div class="xp-bar-track">
      <div class="xp-bar-fill" style="width: {progress * 100}%"></div>
    </div>
    <span class="xp-bar-xp">{xpNeeded} XP to next</span>
  </div>

  <div class="home-subtitle">Choose a game to start learning!</div>

  <div class="game-selector">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="game-card typing-card" on:click={() => handleNavigate('typing')}>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <span class="game-icon">⌨️</span>
        <div class="game-title">Typing Game</div>
        <div class="game-desc">Learn typing with fun level games and stories!</div>
      </div>
      <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.8; font-weight: bold; color: var(--accent);">⭐ {totalStars} stars earned</div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="game-card math-card" on:click={() => handleNavigate('math')}>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <span class="game-icon">🔢</span>
        <div class="game-title">Math Playground</div>
        <div class="game-desc">Addition, subtraction, division & analog clock time!</div>
      </div>
      <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.8; font-weight: bold; color: var(--accent);">🏆 Best: {$mathHighScore}</div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="game-card diary-card" on:click={() => handleNavigate('diary')}>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <span class="game-icon">📔</span>
        <div class="game-title">Daily Diary</div>
        <div class="game-desc">Practice typing by writing in your personal journal!</div>
      </div>
      <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.8; font-weight: bold; color: var(--accent);">📔 {$diaries.length} entries written</div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="game-card pet-card" on:click={() => handleNavigate('farmtycoon')}>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
        <span class="game-icon" style="font-size: 2.8rem; line-height: 1;">🚜</span>
        <div class="game-title">Farm Tycoon</div>
        <div class="game-desc">Plant seeds, water crops, and raise animals to grow your farm and trade goods for points!</div>
      </div>
      <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.8; font-weight: bold; color: var(--accent);">🚜 {cropsPlanted} crops • {animalsPlaced} animals</div>
    </div>
  </div>

  <!-- Bottom Row: Achievements + Daily Challenge -->
  <div style="display: flex; gap: 15px; width: 100%; margin-top: 15px; align-items: stretch;">
    <!-- Achievement Quick Access -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div style="flex: 0 0 auto; background: var(--glass); border: 1px solid var(--glass-border); border-radius: 15px; padding: 15px 20px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s;" on:click={() => handleNavigate('achievements')}>
      <span style="font-size: 1.8rem;">🏆</span>
      <div>
        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6;">Badges</div>
        <div style="font-size: 1.2rem; font-weight: bold;">{badgeCount}/{badges.length}</div>
      </div>
    </div>

    <!-- Daily Challenge -->
    {#if activeChallenge}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div 
        class="daily-challenge" 
        class:completed={activeChallengeCompleted} 
        style="flex: 1; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 15px; margin: 0; box-sizing: border-box;"
        on:click={() => handleChallengeClick(activeChallenge.type)}
        title="Click to play daily challenge"
      >
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; text-align: left;">
          <span class="challenge-icon">{activeChallenge.icon}</span>
          <div class="challenge-info">
            <div class="challenge-title" style="display: flex; align-items: center; gap: 6px;">
              <span>{activeChallengeCompleted ? '✅ Challenge Complete!' : '📋 Daily Challenge'}</span>
              <span style="font-size: 0.65rem; background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 10px; color: white;">{activeChallengeIdx + 1}/3</span>
              {#if $dailyChallengeProgress.round > 0}
                <span style="font-size: 0.65rem; background: #fbbf24; padding: 2px 6px; border-radius: 10px; color: #1e1b4b; font-weight: bold;">Round {$dailyChallengeProgress.round + 1}</span>
              {/if}
            </div>
            <div class="challenge-desc">{activeChallenge.description}</div>
            {#if activeChallengeCompleted}
              <div class="challenge-progress" style="color: #22c55e; font-weight: bold;">Progress: {activeChallenge.target} / {activeChallenge.target} (Done!)</div>
            {:else}
              <div class="challenge-progress">Progress: {activeChallengeProg || 0} / {activeChallenge.target}</div>
            {/if}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          {#if allChallengesCompleted}
            <button 
              style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border: none; color: #1e1b4b; border-radius: 10px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; font-weight: bold; box-shadow: 0 4px 10px rgba(251, 191, 36, 0.4);"
              on:click|stopPropagation={triggerNextRound}
              title="Start next round of challenges for +50 XP!"
            >
              🔄 Bonus Round (+50 XP)
            </button>
          {:else if !activeChallengeCompleted}
            <span style="font-size: 0.8rem; color: #fbbf24; font-weight: bold; white-space: nowrap;">+50 XP</span>
          {/if}
          <!-- Navigation buttons -->
          <div style="display: flex; flex-direction: column; gap: 4px;" on:click|stopPropagation>
            <button 
              style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 2px 6px; font-size: 0.7rem; cursor: pointer; font-weight: bold;"
              on:click={() => navigateChallenge(-1)}
              title="Previous Challenge"
            >▲</button>
            <button 
              style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 2px 6px; font-size: 0.7rem; cursor: pointer; font-weight: bold;"
              on:click={() => navigateChallenge(1)}
              title="Next Challenge"
            >▼</button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Profile Manager Modal -->
  {#if showProfileManager}
    <div class="welcome-overlay" style="z-index: 500;">
      <div class="welcome-modal" style="max-width: {managerStep === 0 ? '480px' : '450px'}; padding: 30px;">
        {#if managerStep === 0}
          <h2>🧒 Profiles & Avatars</h2>
          <p style="margin-bottom: 15px;">Switch profile or edit your character!</p>
          
          <div style="background: rgba(0,0,0,0.2); border-radius: 20px; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1rem; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; text-align: left;">Switch Kid</h3>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              {#each $profiles as p}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div 
                  class="profile-bubble-hover"
                  style="display: flex; flex-direction: column; align-items: center; cursor: pointer; opacity: {p.id === $activeProfileId ? '1' : '0.6'}"
                  on:click={() => handleSwitchProfile(p.id)}
                >
                  <PetAvatar petId={p.avatar} size="small" />
                  <div style="margin-top: 6px; font-weight: bold; font-size: 0.8rem; color: white;">{p.name}</div>
                </div>
              {/each}
            </div>
          </div>

          <div style="background: rgba(0,0,0,0.2); border-radius: 20px; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1rem; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; text-align: left;">Change Current Avatar</h3>
            <div class="avatar-grid" style="grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 10px 0 0 0;">
              {#each avatars as emoji}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                  class="avatar-option"
                  style="padding: 5px; border-radius: 10px; display: flex; align-items: center; justify-content: center;"
                  class:selected={$playerAvatar === emoji}
                  on:click={() => changeAvatar(emoji)}
                >
                  <img src={getAvatarAsset(emoji)} alt={emoji} style="width: 42px; height: 42px; object-fit: contain;" />
                </div>
              {/each}
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-small" on:click={handleAddNewProfile} style="background: linear-gradient(45deg, #10b981, #059669)">
              ➕ Add Kid
            </button>
            <button class="btn btn-small" on:click={() => showProfileManager = false}>
              Done
            </button>
          </div>
        {:else if managerStep === 1}
          <h2>👋 Add New Profile</h2>
          <p>Pick a character for the new kid!</p>
          <div class="avatar-grid" style="margin: 20px 0;">
            {#each avatars as emoji}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="avatar-option"
                style="display: flex; align-items: center; justify-content: center;"
                class:selected={newAvatar === emoji}
                on:click={() => selectNewAvatar(emoji)}
              >
                <img src={getAvatarAsset(emoji)} alt={emoji} style="width: 42px; height: 42px; object-fit: contain;" />
              </div>
            {/each}
          </div>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn" on:click={() => { playSound('click'); managerStep = 0; }} style="background: rgba(255,255,255,0.15)">Back</button>
            <button class="btn" on:click={nextNewStep} disabled={!newAvatar}>
              Next ➡
            </button>
          </div>
        {:else}
          <h2>{newAvatar} What is the name?</h2>
          <p>Type the name below!</p>
          <input
            class="welcome-input"
            type="text"
            bind:value={newName}
            placeholder="Kid name..."
            maxlength="20"
            on:keydown={(e) => e.key === 'Enter' && finishNewProfile()}
          />
          <br />
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
            <button class="btn" on:click={() => { playSound('click'); managerStep = 1; }} style="background: rgba(255,255,255,0.15)">Back</button>
            <button class="btn" on:click={finishNewProfile} disabled={!newName.trim()}>
              Add Kid! 🚀
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
