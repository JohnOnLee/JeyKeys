<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import {
    drills,
    adventureLevels,
    simpleWords,
    storyGenres,
    sentenceCategories
  } from '../lib/typingContent.js';
  import { highScore, levelProgress, updateLevelProgress, markGamePlayed, storiesCompleted } from '../lib/state.js';
  import { playSound } from '../lib/audio.js';
  import { showToast } from '../lib/toastStore.js';
  import Keyboard from './Keyboard.svelte';
  import { router, registerGuard } from '../lib/router.js';
  import { addXp, XP_TYPING_CHAR, XP_TYPING_LEVEL, XP_STAR_RUSH_MULTIPLIER } from '../lib/xp.js';
  import { unlockAchievement } from '../lib/achievements.js';
  import { updateChallengeProgress } from '../lib/dailyChallenge.js';

  let view = 'menu'; // 'menu' | 'game'
  let activePage = 0; // 0: Beginner, 1: Middle, 2: Expert
  let unregisterGuard = null;

  // Game Mode variables
  let currentMode = ''; // 'drill' | 'adventure' | 'sentence' | 'story' | 'game'
  let currentLevelIndex = 0;
  let currentLevelName = '';
  let text = '';
  let currentIndex = 0;
  let isPlaying = false;
  let hasErrorAtCurrent = false;

  // Combo system
  let comboCount = 0;
  let comboClass = '';
  let comboPulse = false;
  let totalWordsTyped = 0;

  onMount(() => {
    markGamePlayed('typing');
  });

  let score = 0;
  let timer = 0;
  let timerInterval = null;

  // Modals visibility
  let showGenreModal = false;
  let showStoryModal = false;
  let showResultModal = false;

  let selectedGenre = null;
  let selectedStory = null;

  // Stats for results
  let wpmResult = 0;
  let starsResult = 0;

  // Element reference
  let displayAreaEl;

  // Carousel badge config
  const badges = [
    { text: '🟢 Beginner', color: '#22c55e' },
    { text: '🟡 Middle', color: '#eab308' },
    { text: '🔴 Expert', color: '#ef4444' }
  ];

  // Derive tokens for rendering text with word-wrapping support
  $: tokens = getTokens(text);

  function getTokens(rawText) {
    const res = [];
    let currentWord = [];
    let idx = 0;

    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      if (char === ' ' || char === '\n') {
        if (currentWord.length > 0) {
          res.push({ type: 'word', chars: currentWord });
          currentWord = [];
        }
        res.push({
          type: char === ' ' ? 'space' : 'newline',
          char,
          index: idx++
        });
      } else {
        currentWord.push({ char, index: idx++ });
      }
    }
    if (currentWord.length > 0) {
      res.push({ type: 'word', chars: currentWord });
    }
    return res;
  }

  function navigateMenu(direction) {
    playSound('click');
    const newPage = activePage + direction;
    if (newPage >= 0 && newPage <= 2) {
      activePage = newPage;
    }
  }

  function startDrill(idx) {
    playSound('click');
    currentMode = 'drill';
    currentLevelIndex = idx;
    currentLevelName = drills[idx].name;
    text = generateLessonText(drills[idx].content);
    startGameFlow();
  }

  function startAdventure(idx) {
    playSound('click');
    currentMode = 'adventure';
    currentLevelIndex = idx;
    currentLevelName = adventureLevels[idx].name;
    text = formatWordsToText(adventureLevels[idx].words);
    startGameFlow();
  }

  function startSentence(cat) {
    playSound('click');
    currentMode = 'sentence';
    currentLevelName = cat.name;
    const shuffled = [...cat.sentences].sort(() => Math.random() - 0.5);
    text = shuffled.slice(0, 3).join('\n');
    startGameFlow();
  }

  function startStory(story) {
    playSound('click');
    currentMode = 'story';
    currentLevelName = story.title;
    text = story.content;
    showStoryModal = false;
    showGenreModal = false;
    startGameFlow();
  }

  function startStarRush() {
    playSound('click');
    currentMode = 'game';
    currentLevelIndex = 0;
    currentLevelName = 'Star Rush';
    text = generateRandomWords(50);
    startGameFlow(60); // 60s countdown
  }

  function startGameFlow(countdownTime = 0) {
    view = 'game';
    score = 0;
    currentIndex = 0;
    isPlaying = true;
    hasErrorAtCurrent = false;
    comboCount = 0;
    comboClass = '';
    totalWordsTyped = 0;

    if (!unregisterGuard) {
      unregisterGuard = registerGuard(() => {
        if (isPlaying) {
          return "Are you sure you want to leave the game? Your progress will be lost.";
        }
      });
    }

    if (countdownTime > 0) {
      timer = countdownTime;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timer--;
        if (timer <= 0) {
          endGame();
        }
      }, 1000);
    } else {
      timer = 0;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timer++;
      }, 1000);
    }

    tick().then(() => {
      if (displayAreaEl) displayAreaEl.scrollTop = 0;
    });
  }

  function exitGame() {
    playSound('click');
    isPlaying = false;
    clearInterval(timerInterval);
    view = 'menu';
    if (unregisterGuard) {
      unregisterGuard();
      unregisterGuard = null;
    }
  }

  function retry() {
    playSound('click');
    showResultModal = false;
    if (currentMode === 'drill') startDrill(currentLevelIndex);
    else if (currentMode === 'adventure') startAdventure(currentLevelIndex);
    else if (currentMode === 'sentence') {
      // Re-find category
      const cat = sentenceCategories.find(c => c.name === currentLevelName);
      if (cat) startSentence(cat);
    } else if (currentMode === 'story') {
      startStory({ title: currentLevelName, content: text });
    } else if (currentMode === 'game') {
      startStarRush();
    }
  }

  function nextLevel() {
    playSound('click');
    showResultModal = false;
    if (currentMode === 'adventure' && currentLevelIndex < adventureLevels.length - 1) {
      startAdventure(currentLevelIndex + 1);
    }
  }

  function handleKeyDown(e) {
    if (!isPlaying || view !== 'game') return;
    if (e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Alt' || e.key === 'Control') return;

    e.preventDefault();

    const requiredChar = text[currentIndex];
    const isEnglishChar = /^[ -~]$/.test(e.key);
    const isControlKey = e.key.length > 1;

    if (!isEnglishChar && !isControlKey) {
      showToast("⚠️ Please switch input source to English!");
      return;
    }

    let isCorrect = false;
    if (requiredChar === '\n') {
      if (e.key === 'Enter') isCorrect = true;
    } else {
      if (e.key === requiredChar) isCorrect = true;
    }

    if (isCorrect) {
      playSound('correct');
      hasErrorAtCurrent = false;
      currentIndex++;
      score += 10;
      comboCount++;
      comboPulse = true;
      setTimeout(() => { comboPulse = false; }, 200);

      // Combo milestones
      if (comboCount === 10 || comboCount === 25 || comboCount === 50) {
        playSound('combo-milestone');
        if (comboCount === 25) unlockAchievement('combo-25');
        if (comboCount === 50) unlockAchievement('combo-50');
      } else if (comboCount > 1) {
        playSound('combo');
      }

      // Combo class for styling
      if (comboCount >= 50) comboClass = 'super';
      else if (comboCount >= 25) comboClass = 'fire';
      else comboClass = '';

      // XP for each character
      addXp(XP_TYPING_CHAR);

      // Track words typed
      if (text[currentIndex - 1] === ' ' || text[currentIndex - 1] === '\n' || currentIndex >= text.length) {
        totalWordsTyped++;
        updateChallengeProgress('typing', totalWordsTyped);
      }

      if (currentIndex >= text.length) {
        if (currentMode === 'game') {
          // Endless mode append
          const newWords = "\n" + generateRandomWords(5);
          text += newWords;
          tick().then(() => {
            if (displayAreaEl) displayAreaEl.scrollTop = displayAreaEl.scrollHeight;
          });
        } else {
          endGame();
          return;
        }
      }

      tick().then(() => {
        const activeEl = document.querySelector('.char.current');
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    } else {
      playSound('error');
      hasErrorAtCurrent = true;
      score = Math.max(0, score - 5);
      if (comboCount > 3) playSound('combo-break');
      comboCount = 0;
      comboClass = '';
    }
  }

  function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    playSound('win');
    if (unregisterGuard) {
      unregisterGuard();
      unregisterGuard = null;
    }

    let timeSpent = currentMode === 'game' ? (60 - timer) : timer;
    if (timeSpent < 1) timeSpent = 1;
    const minutes = timeSpent / 60;
    wpmResult = Math.round((currentIndex / 5) / minutes);

    starsResult = 0;
    if (currentMode === 'adventure') {
      starsResult = 3; // Standard adventure level completion award
      const lvlId = adventureLevels[currentLevelIndex].id;
      updateLevelProgress(lvlId, starsResult);
    }

    if (currentMode === 'game' && score > $highScore) {
      highScore.set(score);
    }

    // XP awards
    if (currentMode === 'game') {
      addXp(score * XP_STAR_RUSH_MULTIPLIER);
    } else {
      addXp(XP_TYPING_LEVEL);
    }

    // Achievement checks
    if (currentMode === 'drill') unlockAchievement('first-drill');
    if (wpmResult >= 50) unlockAchievement('speed-50');
    if (currentMode === 'game' && score >= 500) unlockAchievement('star-500');
    if (currentMode === 'story') {
      storiesCompleted.update(n => n + 1);
      
      let unsubscribe = storiesCompleted.subscribe(count => {
        if (count >= 5) {
          unlockAchievement('five-stories');
        }
      });
      unsubscribe();
    }

    // Check all adventure levels complete achievement
    if (currentMode === 'adventure') {
      let allDone = true;
      for (const lvl of adventureLevels) {
        if (($levelProgress[lvl.id] || 0) === 0 && lvl.id !== adventureLevels[currentLevelIndex].id) {
          allDone = false;
          break;
        }
      }
      if (allDone) {
        unlockAchievement('all-adventure');
      }
    }

    // Challenge progress
    updateChallengeProgress('speed', wpmResult);
    updateChallengeProgress('combo', comboCount);

    // Reset combo
    comboCount = 0;
    comboClass = '';

    showResultModal = true;
    triggerConfetti();
  }

  function triggerConfetti() {
    if (typeof window === 'undefined') return;
    for (let i = 0; i < 50; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.top = '0px';
      c.style.animationDuration = Math.random() * 2 + 2 + 's';
      c.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  // --- TEXT GENERATION HELPERS ---
  function generateLessonText(seed) {
    if (seed.includes('\n')) return seed;
    let result = seed;
    while (result.length < 50) result += " " + seed;
    return result.substring(0, 100);
  }

  function formatWordsToText(originalArray) {
    let items = [...originalArray].sort(() => Math.random() - 0.5);
    while (items.length < 30) {
      items = items.concat(items);
    }
    const lines = [];
    let currentLine = [];
    const LINE_LENGTH = 42;

    for (const w of items) {
      if (lines.length >= 3) break;
      if (currentLine.join(' ').length + w.length > LINE_LENGTH) {
        lines.push(currentLine.join(' '));
        currentLine = [];
        if (lines.length >= 3) break;
      }
      currentLine.push(w);
    }

    if (currentLine.length > 0 && lines.length < 3) {
      lines.push(currentLine.join(' '));
    }

    while (lines.length < 3) {
      lines.push(lines[0] || "practice typing");
    }

    return lines.join('\n');
  }

  function generateRandomWords(count) {
    let allWords = [];
    const singleWordLevelCount = 18;
    for (let i = 0; i < singleWordLevelCount; i++) {
      allWords = allWords.concat(adventureLevels[i].words);
    }
    allWords = allWords.concat(simpleWords);

    const res = [];
    for (let i = 0; i < count; i++) {
      res.push(allWords[Math.floor(Math.random() * allWords.length)]);
    }

    const lines = [];
    while (res.length > 0) {
      lines.push(res.splice(0, 6).join(" "));
    }
    return lines.join("\n");
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function openGenreModal() {
    showGenreModal = true;
  }

  function selectGenre(genre) {
    playSound('click');
    selectedGenre = genre;
    showGenreModal = false;
    showStoryModal = true;
  }

  onDestroy(() => {
    clearInterval(timerInterval);
    if (unregisterGuard) {
      unregisterGuard();
    }
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if view === 'menu'}
  <div class="screen active" style="width: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
    <div style="width: 100%; max-width: 850px; display: flex; flex-direction: column; align-items: center; padding-bottom: 30px;">
      <div style="width: 100%; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.5rem; text-align: center;">⌨️ My Typing Game</h2>
      </div>

    <!-- Carousel Container -->
    <div class="carousel-container">
      <div class="level-badge" style="display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%;">
        <!-- Left Arrow -->
        <button 
          class="carousel-nav-btn" 
          style="visibility: {activePage === 0 ? 'hidden' : 'visible'}; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; width: 40px; height: 40px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" 
          on:click={() => navigateMenu(-1)}
        >◀</button>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="level-badge-dot" style="background: {badges[activePage].color}; box-shadow: 0 0 10px {badges[activePage].color}"></span>
          <span>{badges[activePage].text}</span>
        </div>

        <!-- Right Arrow -->
        <button 
          class="carousel-nav-btn" 
          style="visibility: {activePage === 2 ? 'hidden' : 'visible'}; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; width: 40px; height: 40px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" 
          on:click={() => navigateMenu(1)}
        >▶</button>
      </div>

      <!-- Pages -->
      <div class="carousel-pages">
        <!-- Page 0: Beginner -->
        {#if activePage === 0}
          <div class="carousel-page active">
            <div class="section-title">🖐 Finger Drills</div>
            <div class="drills-grid">
              {#each drills as drill, idx}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="drill-card" on:click={() => startDrill(idx)}>
                  <h3>{drill.name}</h3>
                  <p>{drill.chars.substring(0, 10)}...</p>
                </div>
              {/each}
            </div>

            <div class="section-title" style="margin-top: 20px;">🌈 Adventure Levels</div>
            <div class="levels-grid">
              {#each adventureLevels as lvl, idx}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="level-card" on:click={() => startAdventure(idx)}>
                  <div class="level-num">{lvl.id}</div>
                  <div class="level-name">{lvl.icon} {lvl.name}</div>
                  <div class="stars">
                    {#each Array(3) as _, i}
                      <span class="star" class:filled={i < ($levelProgress[lvl.id] || 0)}>★</span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Page 1: Middle -->
        {#if activePage === 1}
          <div class="carousel-page active">
            <div class="section-title">✏️ Sentence Practice</div>
            <div class="levels-grid" style="grid-template-columns: repeat(5, 1fr); gap: 10px;">
              {#each sentenceCategories as cat}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="level-card" style="padding: 12px; min-height: 70px;" on:click={() => startSentence(cat)}>
                  <span style="font-size: 1.8rem;">{cat.icon}</span>
                  <span class="level-name" style="font-size: 0.85rem; margin-top: 4px;">{cat.name}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Page 2: Expert -->
        {#if activePage === 2}
          <div class="carousel-page active">
            <div class="section-title">📖 Type a Story</div>
            <div class="genre-grid" style="grid-template-columns: repeat(4, 1fr); width: 100%;">
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="genre-card"
                style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3)); border: 2px solid #f59e0b;"
                on:click={startStarRush}
              >
                <div class="genre-icon">⭐</div>
                <div class="genre-name" style="color: #fbbf24;">Star Rush</div>
              </div>
              {#each storyGenres as genre}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="genre-card" on:click={() => selectGenre(genre)}>
                  <div class="genre-icon">{genre.icon}</div>
                  <div class="genre-name">{genre.name}</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>



      <!-- Dot Indicators -->
      <div class="page-dots">
        {#each Array(3) as _, i}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <span class="page-dot" class:active={activePage === i} on:click={() => { playSound('click'); activePage = i; }}></span>
        {/each}
      </div>
    </div>
  </div>
</div>

  <!-- Genre Picker Modal -->
  {#if showGenreModal}
    <div class="overlay active">
      <div class="modal" style="max-width: 500px;">
        <h2>📖 Pick a Genre</h2>
        <div class="genre-grid">
          {#each storyGenres as genre}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="genre-card" on:click={() => selectGenre(genre)}>
              <div class="genre-icon">{genre.icon}</div>
              <div class="genre-name">{genre.name}</div>
            </div>
          {/each}
        </div>
        <button class="btn" style="margin-top: 12px;" on:click={() => { playSound('click'); showGenreModal = false; }}>Back</button>
      </div>
    </div>
  {/if}

  <!-- Story List Modal -->
  {#if showStoryModal && selectedGenre}
    <div class="overlay active">
      <div class="modal" style="max-width: 500px;">
        <h2>{selectedGenre.icon} {selectedGenre.name}</h2>
        <div class="story-grid">
          {#each selectedGenre.stories as story}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="story-card" on:click={() => startStory(story)}>
              {story.title}
            </div>
          {/each}
        </div>
        <button
          class="btn"
          style="margin-top: 12px;"
          on:click={() => {
            playSound('click');
            showStoryModal = false;
            showGenreModal = true;
          }}
        >
          Back
        </button>
      </div>
    </div>
  {/if}
{:else if view === 'game'}
  <div class="screen active game-mode" style="position: relative;">
    <button class="btn-nav-back" on:click={exitGame}>↩ Exit</button>

    {#if comboCount > 1}
      <div class="combo-container" class:fire={comboClass === 'fire'} class:super={comboClass === 'super'}>
        <div class="combo-count" class:pulse={comboPulse}>{comboCount}</div>
        <div class="combo-label">combo</div>
      </div>
    {/if}

    <div class="stats-bar" style="margin-left: 110px;">
      <div>Time: <span>{currentMode === 'game' ? timer + 's' : formatTime(timer)}</span></div>
      <div>Score: <span>{score}</span></div>
      <div style="flex: 1; text-align: center; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        Level: <span>{currentLevelName}</span>
      </div>
    </div>

    <div class="typing-progress-container">
      <div class="typing-progress-fill" style="width: {text.length > 0 ? (currentIndex / text.length) * 100 : 0}%"></div>
    </div>

    <!-- Main typing game board displaying text -->
    <div class="display-area" bind:this={displayAreaEl}>{#each tokens as token}{#if token.type === 'word'}<span style="white-space: nowrap; display: inline;">{#each token.chars as c}<span class="char" class:pending={c.index > currentIndex} class:correct={c.index < currentIndex} class:current={c.index === currentIndex} class:incorrect={c.index === currentIndex && hasErrorAtCurrent}>{c.char}</span>{/each}</span>{:else}<span class="char" class:space-char={token.type === 'space'} class:enter-char={token.type === 'newline'} class:pending={token.index > currentIndex} class:correct={token.index < currentIndex} class:current={token.index === currentIndex} class:incorrect={token.index === currentIndex && hasErrorAtCurrent}>{#if token.type === 'space'}&nbsp;{/if}</span>{#if token.type === 'newline'}<br />{/if}{/if}{/each}</div>

    <!-- Active virtual keyboard helper -->
    <Keyboard requiredChar={text[currentIndex]} />
  </div>

  <!-- Results Modal -->
  {#if showResultModal}
    <div class="overlay active">
      <div class="modal">
        <h2>Good Job!</h2>
        <p>Your Score:</p>
        <div class="score-big">{score}</div>
        <p style="font-size: 1.2rem; margin: -10px 0 15px 0; opacity: 0.8">WPM: {wpmResult}</p>
        <div style="font-size: 2rem; margin-bottom: 20px;">
          {#if currentMode === 'adventure'}
            {#each Array(3) as _, i}
              <span style="color: {i < starsResult ? '#fbbf24' : '#ccc'}">★</span>
            {/each}
          {/if}
        </div>
        <p>Keep practicing!</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button class="btn" on:click={() => { playSound('click'); showResultModal = false; view = 'menu'; }}>Menu</button>
          <button class="btn" on:click={retry}>Retry</button>
          {#if currentMode === 'adventure' && currentLevelIndex < adventureLevels.length - 1}
            <button class="btn" style="background: linear-gradient(45deg, #10b981, #059669);" on:click={nextLevel}>Next ➡</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}
