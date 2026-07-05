<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { playSound } from '../lib/audio.js';
  import { router, registerGuard } from '../lib/router.js';
  import { mathHighScore, markGamePlayed, markTopicPlayed, mathTopicsPlayed } from '../lib/state.js';
  import { addXp, XP_MATH_CORRECT, XP_MATH_SET } from '../lib/xp.js';
  import { unlockAchievement } from '../lib/achievements.js';
  import { updateChallengeProgress } from '../lib/dailyChallenge.js';

  let currentView = 'topics'; // 'topics' | 'game'
  let showDifficultyModal = false;
  let showResultModal = false;
  let resultsText = '';
  let resultsScore = '';
  let problemTimeout = null;
  let unregisterGuard = null;

  let selectedTopic = '';
  let difficulty = 'medium'; // 'easy' | 'medium' | 'hard'

  let mathStreak = 0;
  let mathStreakClass = '';

  onMount(() => {
    markGamePlayed('math');
  });

  let scoreCorrect = 0;
  let scoreWrong = 0;
  let scoreTotal = 0;
  let maxProblems = 10; // Infinity for Star Rush
  let timerValue = 0;
  let timerInterval = null;

  let problemText = '';
  let correctAnswer = null;
  let userAnswer = '';
  let feedbackText = '';
  let feedbackClass = 'math-feedback';

  let inputEl;
  let isInputDisabled = false;

  const correctMessages = ['🎉 Awesome!', '⭐ Great job!', '🌟 Amazing!', '👏 Well done!', '🏆 Super!'];
  const wrongMessages = ['😅 Oops!', '🤔 Not quite!', '💪 Keep going!'];

  function selectTopic(topic) {
    playSound('click');
    selectedTopic = topic;
    markTopicPlayed(topic);
    showDifficultyModal = true;
  }

  function startNormalGame(diff) {
    playSound('click');
    if (problemTimeout) {
      clearTimeout(problemTimeout);
      problemTimeout = null;
    }
    difficulty = diff;
    showDifficultyModal = false;
    currentView = 'game';

    scoreCorrect = 0;
    scoreWrong = 0;
    scoreTotal = 0;
    maxProblems = 10;
    timerValue = 0;
    feedbackText = '';
    feedbackClass = 'math-feedback';
    isInputDisabled = false;
    userAnswer = '';
    mathStreak = 0;
    mathStreakClass = '';

    if (!unregisterGuard) {
      unregisterGuard = registerGuard(() => {
        if (currentView === 'game') {
          return "Are you sure you want to leave the math playground? Your score will be lost.";
        }
      });
    }

    generateProblem();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerValue++;
    }, 1000);

    setTimeout(focusInput, 50);
  }

  function startStarRush() {
    playSound('click');
    if (problemTimeout) {
      clearTimeout(problemTimeout);
      problemTimeout = null;
    }
    selectedTopic = 'starrush';
    difficulty = 'medium';
    showDifficultyModal = false;
    currentView = 'game';

    scoreCorrect = 0;
    scoreWrong = 0;
    scoreTotal = 0;
    maxProblems = Infinity;
    timerValue = 60; // Countdown
    feedbackText = '';
    feedbackClass = 'math-feedback';
    isInputDisabled = false;
    userAnswer = '';
    mathStreak = 0;
    mathStreakClass = '';

    if (!unregisterGuard) {
      unregisterGuard = registerGuard(() => {
        if (currentView === 'game') {
          return "Are you sure you want to leave the math playground? Your score will be lost.";
        }
      });
    }

    generateProblem();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerValue--;
      if (timerValue <= 0) {
        endStarRush();
      }
    }, 1000);

    setTimeout(focusInput, 50);
  }

  function endStarRush() {
    clearInterval(timerInterval);
    if (problemTimeout) {
      clearTimeout(problemTimeout);
      problemTimeout = null;
    }
    isInputDisabled = true;
    playSound('win');

    if (unregisterGuard) {
      unregisterGuard();
      unregisterGuard = null;
    }

    if (scoreCorrect > $mathHighScore) {
      mathHighScore.set(scoreCorrect);
    }

    addXp(scoreCorrect * 2);
    unlockAchievement('first-math');

    resultsText = "Time's Up!";
    resultsScore = `Final Score: ${scoreCorrect}`;
    showResultModal = true;
  }

  function focusInput() {
    if (inputEl) inputEl.focus();
  }

  function generateProblem() {
    let a, b, answer, display;
    const dist = difficulty;
    let activeTopic = selectedTopic;

    if (activeTopic === 'starrush') {
      const topics = ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'numbers', 'time', 'mental'];
      activeTopic = topics[Math.floor(Math.random() * topics.length)];
    }

    if (activeTopic === 'addition') {
      if (dist === 'easy') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
      } else if (dist === 'medium') {
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
      } else {
        a = Math.floor(Math.random() * 150) + 50;
        b = Math.floor(Math.random() * 150) + 50;
      }
      answer = a + b;
      display = `${a} + ${b} = ?`;
    } else if (activeTopic === 'subtraction') {
      if (dist === 'easy') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
      } else if (dist === 'medium') {
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
      } else {
        a = Math.floor(Math.random() * 150) + 50;
        b = Math.floor(Math.random() * 150) + 50;
      }
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      display = `${a} - ${b} = ?`;
    } else if (activeTopic === 'multiplication') {
      if (dist === 'easy') {
        a = Math.floor(Math.random() * 5) + 1;
        b = Math.floor(Math.random() * 5) + 1;
      } else if (dist === 'medium') {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
      } else {
        a = Math.floor(Math.random() * 16) + 10;
        b = Math.floor(Math.random() * 11) + 2;
      }
      answer = a * b;
      display = `${a} × ${b} = ?`;
    } else if (activeTopic === 'division') {
      let limits = { easy: { div: 5, ans: 5 }, medium: { div: 12, ans: 12 }, hard: { div: 15, ans: 20 } };
      let l = limits[dist];
      b = Math.floor(Math.random() * l.div) + 1;
      answer = Math.floor(Math.random() * l.ans) + 1;
      a = b * answer;
      display = `${a} ÷ ${b} = ?`;
    } else if (activeTopic === 'fractions') {
      let fracs, maxMult;
      if (dist === 'easy') {
        fracs = [[1, 2], [1, 3]];
        maxMult = 5;
      } else if (dist === 'medium') {
        fracs = [[1, 4], [2, 3], [3, 4], [1, 5]];
        maxMult = 8;
      } else {
        fracs = [[2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8]];
        maxMult = 12;
      }
      const frac = fracs[Math.floor(Math.random() * fracs.length)];
      const multiplier = Math.floor(Math.random() * maxMult) + 2;
      const whole = frac[1] * multiplier;
      answer = frac[0] * multiplier;
      display = `${frac[0]}/${frac[1]} of ${whole} = ?`;
    } else if (activeTopic === 'numbers') {
      let step, start;
      if (dist === 'easy') {
        step = Math.floor(Math.random() * 2) + 1;
        start = Math.floor(Math.random() * 20) + 1;
      } else if (dist === 'medium') {
        step = Math.floor(Math.random() * 4) + 2;
        start = Math.floor(Math.random() * 50) + 1;
      } else {
        const steps = [6, 7, 8, 9, 15, 20];
        step = steps[Math.floor(Math.random() * steps.length)];
        start = Math.floor(Math.random() * 150) + 50;
      }
      answer = start + (3 * step);
      display = `${start}, ${start + step}, ${start + 2 * step}, ?`;
    } else if (activeTopic === 'time') {
      let startHour = Math.floor(Math.random() * 12) + 1;
      let startMin = 0;
      let addMins = 0;

      if (dist === 'easy') {
        let addHours = Math.floor(Math.random() * 5) + 1;
        addMins = addHours * 60;
        display = `What is ${addHours} hour(s) after ${startHour}:00? (Just type the hour)`;

        let endHour = startHour + addHours;
        if (endHour > 12) endHour -= 12;
        answer = endHour;
      } else if (dist === 'medium') {
        const mins = [15, 30];
        startMin = mins[Math.floor(Math.random() * mins.length)];
        addMins = mins[Math.floor(Math.random() * mins.length)];
        if (startMin + addMins >= 60) addMins = 15;

        let startStr = startMin === 0 ? "00" : startMin;
        display = `What is ${addMins} mins after ${startHour}:${startStr}? (Type the minutes)`;
        answer = startMin + addMins;
      } else {
        const starts = [30, 45];
        startMin = starts[Math.floor(Math.random() * starts.length)];
        const adds = [20, 30, 45];
        addMins = adds[Math.floor(Math.random() * adds.length)];

        let totalMins = startMin + addMins;
        let endHour = startHour + Math.floor(totalMins / 60);
        if (endHour > 12) endHour -= 12;
        let endMin = totalMins % 60;

        display = `What time is ${addMins} mins after ${startHour}:${startMin}? (e.g. 4:15 -> 415)`;
        answer = parseInt(`${endHour}${endMin.toString().padStart(2, '0')}`);
      }
    } else if (activeTopic === 'mental') {
      if (dist === 'easy') {
        let n1 = Math.floor(Math.random() * 9) + 1;
        let n2 = Math.floor(Math.random() * 5) + 1;
        let n3 = Math.floor(Math.random() * 5) + 1;
        if (Math.random() < 0.5) {
          answer = n1 + n2 - n3;
          display = `${n1} + ${n2} - ${n3} = ?`;
        } else {
          if (n1 - n2 < 1) n1 += 5;
          answer = n1 - n2 + n3;
          display = `${n1} - ${n2} + ${n3} = ?`;
        }
      } else if (dist === 'medium') {
        let n1 = Math.floor(Math.random() * 20) + 10;
        let n2 = Math.floor(Math.random() * 9) + 1;
        let n3 = Math.floor(Math.random() * 20) + 1;
        if (Math.random() < 0.5) {
          answer = n1 + n2 - n3;
          display = `${n1} + ${n2} - ${n3} = ?`;
        } else {
          if (n1 - n2 < 1) n1 += 10;
          answer = n1 - n2 + n3;
          display = `${n1} - ${n2} + ${n3} = ?`;
        }
      } else {
        let n1 = Math.floor(Math.random() * 6) + 2;
        let n2 = Math.floor(Math.random() * 6) + 2;
        let n3 = Math.floor(Math.random() * 20) + 5;
        if (Math.random() < 0.5) {
          answer = (n1 * n2) + n3;
          display = `${n1} × ${n2} + ${n3} = ?`;
        } else {
          answer = (n1 * n2) - n3;
          if (answer < 0) {
            answer = (n1 * n2) + n3;
            display = `${n1} × ${n2} + ${n3} = ?`;
          } else {
            display = `${n1} × ${n2} - ${n3} = ?`;
          }
        }
      }
    }

    correctAnswer = answer;
    problemText = display;
    userAnswer = '';
    setTimeout(focusInput, 50);
  }

  function handleAnswerSubmit() {
    const val = parseInt(userAnswer);
    if (isNaN(val)) return;

    scoreTotal++;

    if (val === correctAnswer) {
      scoreCorrect++;
      playSound('correct');
      feedbackText = correctMessages[Math.floor(Math.random() * correctMessages.length)];
      feedbackClass = 'math-feedback correct';
      mathStreak++;
      mathStreakClass = mathStreak >= 5 ? 'hot' : '';
      addXp(XP_MATH_CORRECT);
      updateChallengeProgress('math', scoreCorrect);
      if (mathStreak >= 10) unlockAchievement('math-streak-10');
    } else {
      scoreWrong++;
      playSound('error');
      feedbackText = `${wrongMessages[Math.floor(Math.random() * wrongMessages.length)]} Answer: ${correctAnswer}`;
      feedbackClass = 'math-feedback wrong';
      mathStreak = 0;
      mathStreakClass = '';
    }

    if (scoreTotal >= maxProblems) {
      clearInterval(timerInterval);
      if (problemTimeout) {
        clearTimeout(problemTimeout);
        problemTimeout = null;
      }
      isInputDisabled = true;
      playSound('win');
      if (unregisterGuard) {
        unregisterGuard();
        unregisterGuard = null;
      }
      addXp(XP_MATH_SET);
      unlockAchievement('first-math');
      if (selectedTopic === 'time' && scoreWrong === 0) {
        unlockAchievement('time-perfect');
      }

      // Check all topics played achievement
      let unsubscribe = mathTopicsPlayed.subscribe(topics => {
        if (topics.length >= 8) {
          unlockAchievement('all-topics');
        }
      });
      unsubscribe();

      const pct = Math.round((scoreCorrect / maxProblems) * 100);
      resultsText = "Good Job!";
      resultsScore = `Solved: ${scoreCorrect} / ${maxProblems} (${pct}%)`;
      showResultModal = true;
    } else {
      problemTimeout = setTimeout(generateProblem, 800);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleAnswerSubmit();
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function quitGame() {
    playSound('click');
    if (problemTimeout) {
      clearTimeout(problemTimeout);
      problemTimeout = null;
    }
    clearInterval(timerInterval);
    currentView = 'topics';
    if (unregisterGuard) {
      unregisterGuard();
      unregisterGuard = null;
    }
  }

  function restartMathGame() {
    showResultModal = false;
    if (selectedTopic === 'starrush') {
      startStarRush();
    } else {
      startNormalGame(difficulty);
    }
  }

  onDestroy(() => {
    clearInterval(timerInterval);
    if (problemTimeout) {
      clearTimeout(problemTimeout);
      problemTimeout = null;
    }
    if (unregisterGuard) {
      unregisterGuard();
    }
  });
</script>

{#if currentView === 'topics'}
  <div class="screen active" style="width: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
    <div style="width: 100%; max-width: 850px; display: flex; flex-direction: column; align-items: center; padding-bottom: 30px;">
      <div style="width: 100%; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.5rem; text-align: center;">🔢 My Math Game</h2>
      </div>

    <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">
      <!-- Section 1: Basic Operations -->
      <div>
        <div style="margin: 0 0 10px 0; text-align: left; font-size: 1.1rem; color: var(--accent); border-bottom: 1px dashed var(--glass-border); padding-bottom: 5px; font-weight: bold; width: 100%;">
          🔢 Arithmetic Operations
        </div>
        <div class="math-topic-grid">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('addition')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">➕</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Addition</span>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('subtraction')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">➖</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Subtraction</span>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('multiplication')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">✖️</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Multiplication</span>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('division')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">➗</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Division</span>
          </div>
        </div>
      </div>

      <!-- Section 2: Brain Training & Logic -->
      <div>
        <div style="margin: 0 0 10px 0; text-align: left; font-size: 1.1rem; color: var(--accent); border-bottom: 1px dashed var(--glass-border); padding-bottom: 5px; font-weight: bold; width: 100%;">
          🧠 Brain Training & Logic
        </div>
        <div class="math-topic-grid">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('fractions')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">🍰</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Fractions</span>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('numbers')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">🔢</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Sequences</span>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('time')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">🕒</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Time Reading</span>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" on:click={() => selectTopic('mental')}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">🧠</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Mental Math</span>
          </div>
        </div>
      </div>

      <!-- Section 3: Special Challenge -->
      <div>
        <div style="margin: 0 0 10px 0; text-align: left; font-size: 1.1rem; color: #fbbf24; border-bottom: 1px dashed rgba(251, 191, 36, 0.4); padding-bottom: 5px; font-weight: bold; width: 100%;">
          ⚡ Speed Challenge
        </div>
        <div class="math-topic-grid" style="grid-template-columns: repeat(4, 1fr);">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="math-topic-card" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2)); border-color: rgba(245, 158, 11, 0.5);" on:click={startStarRush}>
            <span class="topic-icon" style="font-size: 1.8rem; margin: 0; display: block;">✨</span>
            <span class="topic-name" style="font-size: 0.95rem; font-weight: bold;">Star Rush</span>
          </div>
        </div>
      </div>
    </div>

  {#if showDifficultyModal}
    <div class="overlay active" transition:fade>
      <div class="modal" style="max-width: 500px;" transition:scale>
        <h2>Choose Difficulty</h2>
        <div class="genre-grid" style="margin-top: 20px;">
          <button class="genre-card" on:click={() => startNormalGame('easy')} style="padding: 15px; text-align: center; width: 100%; border: none;">
            <div style="font-size: 2rem; margin-bottom: 5px;">🟢</div>
            <div style="font-weight: bold; font-size: 1.2rem; color: white;">Easy</div>
          </button>
          <button class="genre-card" on:click={() => startNormalGame('medium')} style="padding: 15px; text-align: center; width: 100%; border: none;">
            <div style="font-size: 2rem; margin-bottom: 5px;">🟡</div>
            <div style="font-weight: bold; font-size: 1.2rem; color: white;">Medium</div>
          </button>
          <button class="genre-card" on:click={() => startNormalGame('hard')} style="padding: 15px; text-align: center; width: 100%; border: none;">
            <div style="font-size: 2rem; margin-bottom: 5px;">🔴</div>
            <div style="font-weight: bold; font-size: 1.2rem; color: white;">Hard</div>
          </button>
        </div>
        <button
          class="btn btn-small btn-back"
          on:click={() => { playSound('click'); showDifficultyModal = false; }}
          style="margin-top: 20px;"
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
  </div>
</div>
{:else if currentView === 'game'}
  <div class="screen active" style="width: 100%; position: relative;">
    <button class="btn-nav-back" on:click={quitGame}>↩ Exit</button>
    <div style="width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px; min-height: 50px;">
      <h2 style="margin: 0; border: none; padding: 0; text-align: center; font-size: 1.5rem;">
        🔢 {selectedTopic === 'starrush' ? 'Math Challenge' : 'Math Practice'}
      </h2>
    </div>

    <div class="math-game-area active" id="math-game-area">
      <div class="stats-bar" style="margin-bottom: 15px;">
        <div>Correct: <span>{scoreCorrect}</span></div>
        <div>Wrong: <span>{scoreWrong}</span></div>
        <div>
          Progress: <span>{scoreTotal}</span>{#if maxProblems !== Infinity}<span>/{maxProblems}</span>{/if}
        </div>
        <div>Time: <span style="{selectedTopic === 'starrush' && timerValue <= 10 ? 'color: #ef4444; font-weight: 900;' : selectedTopic === 'starrush' && timerValue <= 20 ? 'color: #eab308; font-weight: 900;' : ''}">{formatTime(timerValue)}</span></div>
      </div>

      <div class="math-problem">{problemText}</div>
      <input
        type="text"
        bind:this={inputEl}
        bind:value={userAnswer}
        class="math-answer-input"
        placeholder="?"
        autocomplete="off"
        disabled={isInputDisabled}
        on:keydown={handleKeyDown}
      />
      <div class={feedbackClass}>{feedbackText}</div>
      {#if mathStreak >= 3}
        <div class="math-streak" class:hot={mathStreakClass === 'hot'}>
          🔥 {mathStreak} in a row!
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Results Modal -->
{#if showResultModal}
  <div class="overlay active" transition:fade>
    <div class="modal" transition:scale>
      <h2>{resultsText}</h2>
      <p>Your Results:</p>
      <div class="score-big">{resultsScore}</div>
      <p style="font-size: 1.2rem; margin: -10px 0 15px 0; opacity: 0.8">Correct Answers: {scoreCorrect}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn" on:click={() => { playSound('click'); showResultModal = false; currentView = 'topics'; isInputDisabled = false; }}>Topics Menu</button>
        <button class="btn" on:click={() => { playSound('click'); restartMathGame(); }}>Play Again</button>
      </div>
    </div>
  </div>
{/if}
