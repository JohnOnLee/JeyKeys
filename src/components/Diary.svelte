<script>
  import { onMount, onDestroy } from 'svelte';
  import { diaries, addDiaryEntry, markGamePlayed, playerName } from '../lib/state.js';
  import { showToast } from '../lib/toastStore.js';
  import Keyboard from './Keyboard.svelte';
  import { playSound } from '../lib/audio.js';
  import { router } from '../lib/router.js';
  import { addXp, XP_DIARY_ENTRY } from '../lib/xp.js';
  import { unlockAchievement } from '../lib/achievements.js';
  import { updateChallengeProgress } from '../lib/dailyChallenge.js';
  import { getCaretCoordinates } from '../lib/caret.js';
  import { simpleWords, adventureLevels } from '../lib/typingContent.js';
  import { commonEnglishWords } from '../lib/dictionary.js';

  let calendarYear = new Date().getFullYear();
  let calendarMonth = new Date().getMonth();
  let selectedDate = new Date().toISOString().split('T')[0];

  let isEditing = false;
  let showParentControls = false;
  let entryContent = '';
  let xpAwarded = false;
  let wordCount = 0;

  // Spelling helper variables
  let textareaEl;
  let screenEl;
  let showSpellingHelper = false;
  let spellingSuggestions = [];
  let helperPosition = { top: 0, left: 0 };
  let activeCaret = null;
  let popupHeight = 40; // default fallback

  const diaryWords = [
    'today', 'yesterday', 'tomorrow', 'happy', 'sad', 'went', 'was', 'diary', 'journal', 'wrote',
    'day', 'school', 'play', 'friend', 'friends', 'fun', 'game', 'games', 'family', 'home',
    'love', 'good', 'bad', 'great', 'awesome', 'cool', 'nice', 'little', 'big', 'small',
    'dog', 'cat', 'mom', 'dad', 'brother', 'sister', 'mother', 'father', 'grandma', 'grandpa',
    'house', 'school', 'teacher', 'class', 'lunch', 'dinner', 'breakfast', 'eat', 'ate', 'food',
    'pizza', 'cookie', 'cookies', 'ice', 'cream', 'toy', 'toys', 'played', 'playing', 'run',
    'ran', 'running', 'walk', 'walked', 'walking', 'swim', 'swam', 'swimming', 'jump', 'jumped',
    'sleep', 'slept', 'sleeping', 'night', 'morning', 'afternoon', 'evening', 'bed', 'time',
    'week', 'weekend', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december', 'sunny', 'rainy', 'snowy', 'cloudy',
    'hot', 'cold', 'warm', 'cool', 'weather', 'park', 'zoo', 'beach', 'pool', 'movie', 'book',
    'books', 'read', 'reading', 'write', 'writing', 'draw', 'drawing', 'paint', 'painting',
    'song', 'music', 'dance', 'dancing', 'sing', 'singing', 'help', 'helped', 'helping',
    'happy', 'excited', 'tired', 'sleepy', 'hungry', 'thirsty', 'scared', 'angry', 'surprised',
    'about', 'after', 'again', 'all', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'because',
    'been', 'before', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'down', 'for', 'from',
    'get', 'got', 'had', 'has', 'have', 'he', 'her', 'him', 'his', 'how', 'i', 'if', 'in',
    'into', 'is', 'it', 'its', 'like', 'liked', 'make', 'made', 'me', 'my', 'no', 'not', 'of',
    'on', 'one', 'or', 'our', 'out', 'over', 'said', 'saw', 'she', 'so', 'some', 'that', 'the',
    'their', 'them', 'then', 'there', 'they', 'this', 'to', 'too', 'up', 'us', 'very', 'want',
    'wanted', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'will', 'with', 'would',
    'you', 'your', 'yes'
  ];

  const rawWords = new Set();
  simpleWords.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean) rawWords.add(clean);
  });
  adventureLevels.forEach(lvl => {
    lvl.words.forEach(w => {
      const parts = w.toLowerCase().split(/[\s_-]+/);
      parts.forEach(part => {
        const clean = part.replace(/[^a-z]/g, '');
        if (clean) rawWords.add(clean);
      });
    });
  });
  diaryWords.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean) rawWords.add(clean);
  });
  commonEnglishWords.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean) rawWords.add(clean);
  });
  const spellingDictionary = Array.from(rawWords);

  function levenshtein(a, b) {
    const tmp = [];
    let i, j;
    for (i = 0; i <= a.length; i++) tmp[i] = [i];
    for (j = 0; j <= b.length; j++) tmp[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return tmp[a.length][b.length];
  }

  function getWordBeforeCursor(text, cursorPosition) {
    if (cursorPosition <= 0) return '';
    const textBefore = text.slice(0, cursorPosition);
    const match = textBefore.match(/[a-zA-Z]+$/);
    return match ? match[0] : '';
  }

  function checkSpelling() {
    if (!textareaEl || !screenEl) return;
    const cursorPosition = textareaEl.selectionStart;
    const text = entryContent;
    const word = getWordBeforeCursor(text, cursorPosition);

    if (!word) {
      showSpellingHelper = false;
      activeCaret = null;
      return;
    }

    const lowerWord = word.toLowerCase();

    const matches = [];
    spellingDictionary.forEach(dictWord => {
      if (dictWord === lowerWord) return;
      const isPrefix = dictWord.startsWith(lowerWord);
      const dist = levenshtein(lowerWord, dictWord);
      if (isPrefix || dist <= 2) {
        matches.push({
          word: dictWord,
          dist: isPrefix ? 0.5 : dist // Prioritize prefix matches
        });
      }
    });

    if (matches.length === 0) {
      showSpellingHelper = false;
      activeCaret = null;
      return;
    }

    matches.sort((a, b) => {
      if (a.dist !== b.dist) {
        return a.dist - b.dist;
      }
      return a.word.localeCompare(b.word);
    });

    spellingSuggestions = matches.slice(0, 3).map(m => m.word);

    const wordStartPos = cursorPosition - word.length;
    const rect = textareaEl.getBoundingClientRect();
    const parentRect = screenEl.getBoundingClientRect();
    const offsetLeft = rect.left - parentRect.left;

    activeCaret = getCaretCoordinates(textareaEl, wordStartPos);
    const left = Math.max(8, Math.min(offsetLeft + activeCaret.left, parentRect.width - 220));
    helperPosition.left = left;
    showSpellingHelper = true;
  }

  $: if (showSpellingHelper && activeCaret && screenEl && textareaEl) {
    const rect = textareaEl.getBoundingClientRect();
    const parentRect = screenEl.getBoundingClientRect();
    const offsetTop = rect.top - parentRect.top;

    let top = offsetTop + activeCaret.top - popupHeight - 12; // 12px gap above the line
    if (top < 0) {
      top = offsetTop + activeCaret.top + activeCaret.height + 8; // float below if off top of screenEl
    }
    helperPosition.top = top;
  }

  const writingPrompts = [
    '🌟 What made you smile today?',
    '🚀 If you could go anywhere in the universe, where would you go?',
    '🍔 What was the yummiest thing you ate today?',
    '🎮 What game did you play today, and who won?',
    '📚 What is the coolest fact you learned recently?',
    '🌈 If you had a superpower, what would it be and why?',
    '🐾 If you could turn into any animal for a day, which one would you pick?',
    '🎂 Tell a story about your favorite birthday party!',
    '🌞 What was the best and worst part of today?',
    '🤔 What is one exciting thing you want to do tomorrow?',
    '🎨 If you could paint your room any color, what would it be?',
    '🦕 If dinosaurs were alive today, which one would you want as a pet?',
    '🛸 If an alien landed in your backyard, what would you show them first?',
    '🍕 Invent a new pizza topping! What ingredients would you put on it?',
    '🧙‍♂️ If you found a magic wand, what is the first spell you would cast?',
    '🏰 If you lived in a castle, what would your throne room look like?',
    '🌳 Describe a secret clubhouse! Where is it and what is inside?',
    '🐬 If you could talk to sea animals, what would you ask a dolphin?',
    '❄️ What is your favorite thing to do on a rainy or snowy day?',
    '🎁 What is the best gift you have ever given to someone else?',
    '🤖 If you built a robot friend, what chores would you make them do?',
    '🦁 If you were the leader of a jungle, what rules would you make?',
    '🎸 If you were a rockstar, what would your band name be?',
    '🧸 What is your favorite toy and what adventures do you go on together?',
    '🍨 If you could open an ice cream shop, what crazy flavors would you sell?',
    '🚲 Where is your favorite place to ride a bike or scooter?',
    '🦸‍♂️ What would your superhero name and outfit look like?',
    '🕵️‍♂️ Solve a mystery! What is something lost that you want to find?',
    '🎈 If you could float away on a giant balloon, where would you land?',
    '🍪 What is your absolute favorite cookie and how do you eat it?',
    '🌳 If you could build the ultimate treehouse, what cool rooms would it have?',
    '🎵 What is your favorite song to dance or sing along to?',
    '🎭 If you were in a movie, would you play a hero, a wizard, or an explorer?',
    '🍁 What is your favorite season (Spring, Summer, Autumn, Winter) and why?',
    '🤝 Who is someone who helped you today, and how did they help?'
  ];

  let currentPrompt = writingPrompts[Math.floor(Math.random() * writingPrompts.length)];

  onMount(() => {
    markGamePlayed('diary');
    showSpellingHelper = false;
    activeCaret = null;
    screenEl = null;
  });

  $: wordCount = entryContent.trim() ? entryContent.trim().split(/\s+/).length : 0;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  $: entriesMap = $diaries.reduce((acc, curr) => {
    acc[curr.date] = curr.content;
    return acc;
  }, {});

  $: daysArray = getDaysInMonthArray(calendarYear, calendarMonth, entriesMap);

  function getDaysInMonthArray(year, month, currentEntries) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();

    const arr = [];
    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      arr.push({ empty: true });
    }
    // Days
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      arr.push({
        empty: false,
        day,
        dateStr,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
        hasEntry: !!currentEntries[dateStr]
      });
    }
    return arr;
  }

  function prevMonth() {
    playSound('click');
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
  }

  function nextMonth() {
    playSound('click');
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
  }

  function goToToday() {
    playSound('click');
    calendarYear = new Date().getFullYear();
    calendarMonth = new Date().getMonth();
    selectedDate = todayStr;
  }

  function selectDate(dateStr, isFuture) {
    if (isFuture) return;
    playSound('click');
    selectedDate = dateStr;
    const existing = entriesMap[dateStr] || '';
    entryContent = existing;
    isEditing = true;
    xpAwarded = false;
    currentPrompt = writingPrompts[Math.floor(Math.random() * writingPrompts.length)];
    showSpellingHelper = false;
    activeCaret = null;
    screenEl = null;
  }

  function saveEntry() {
    if (!entryContent.trim()) {
      addDiaryEntry(selectedDate, '');
      return;
    }
    playSound('click');
    addDiaryEntry(selectedDate, entryContent);
    showToast("Diary saved! 🎉");

    if (!xpAwarded) {
      addXp(XP_DIARY_ENTRY);
      xpAwarded = true;
      unlockAchievement('first-diary');
      updateChallengeProgress('diary', 1);

      // Check word count achievement
      if (wordCount >= 200) {
        unlockAchievement('long-entry');
      }

      // Check 7 entries achievement
      let unsubscribe = diaries.subscribe(list => {
        if (list.length >= 7) {
          unlockAchievement('week-writer');
        }
      });
      unsubscribe();
    }
  }

  function goBackToCalendar() {
    saveEntry();
    isEditing = false;
    showSpellingHelper = false;
    activeCaret = null;
    screenEl = null;
  }

  function handleEditorKeyDown(e) {
    // Play typewriter sound for text entry keys
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key !== 'Shift' && e.key !== 'CapsLock' && e.key !== 'Control') {
      playSound('typewriter');
    }

    if (e.key === 'Escape') {
      goBackToCalendar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveEntry();
    }
  }

  onDestroy(() => {
    if (isEditing) {
      addDiaryEntry(selectedDate, entryContent.trim() ? entryContent : '');
    }
    showSpellingHelper = false;
    activeCaret = null;
    screenEl = null;
  });

  function formatDateLong(dateStr) {
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  function exportDiaryBackup() {
    playSound('click');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($diaries, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `jeykeys_diary_backup_${$playerName || 'kid'}_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Diary backup downloaded! 💾");
  }

  function handleImportBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          diaries.update(current => {
            const merged = [...current];
            for (const item of importedData) {
              if (item.date && item.content) {
                const idx = merged.findIndex(m => m.date === item.date);
                if (idx !== -1) {
                  merged[idx].content = item.content;
                } else {
                  merged.push(item);
                }
              }
            }
            return merged;
          });
          playSound('welcome');
          showToast("Diary entries imported successfully! 🎉");
        } else {
          showToast("⚠️ Invalid backup file format!");
        }
      } catch (err) {
        showToast("⚠️ Error parsing backup file!");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
</script>

{#if !isEditing}
  <div class="screen active" style="width: 100%; height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; box-sizing: border-box;">
    <div style="width: 100%; max-width: 850px; display: flex; flex-direction: column; align-items: center; padding-bottom: 30px;">
      <div style="width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; border-bottom: 2px solid var(--glass-border); padding-bottom: 8px;">
        <h2 style="margin: 0; font-size: 1.4rem; text-align: center;">📔 My Daily Diary</h2>
      </div>

    <div class="diary-date" style="margin-bottom: 10px;">
      {formatDateLong(selectedDate)}
    </div>

    <div class="diary-calendar">
      <div class="calendar-header">
        <button class="calendar-nav" on:click={prevMonth}>◀</button>
        <button class="calendar-today-btn" on:click={goToToday}>Today</button>
        <div class="calendar-month">{monthNames[calendarMonth]} {calendarYear}</div>
        <button class="calendar-nav" on:click={nextMonth}>▶</button>
      </div>
      <div class="calendar-weekdays">
        <div class="calendar-weekday">Sun</div>
        <div class="calendar-weekday">Mon</div>
        <div class="calendar-weekday">Tue</div>
        <div class="calendar-weekday">Wed</div>
        <div class="calendar-weekday">Thu</div>
        <div class="calendar-weekday">Fri</div>
        <div class="calendar-weekday">Sat</div>
      </div>
      <div class="calendar-days">
        {#each daysArray as cell}
          {#if cell.empty}
            <div class="calendar-day" style="background: transparent; opacity: 0;"></div>
          {:else}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="calendar-day"
              class:future={cell.isFuture}
              class:today={cell.isToday}
              class:selected={cell.dateStr === selectedDate}
              class:has-entry={cell.hasEntry}
              on:click={() => selectDate(cell.dateStr, cell.isFuture)}
            >
              {cell.day}
            </div>
          {/if}
        {/each}
      </div>
      </div>

      <!-- Collapsible Parent Settings for Backups -->
      <div style="width: 100%; margin-top: 30px; border-top: 1px dashed var(--glass-border); padding-top: 15px; display: flex; flex-direction: column; align-items: center;">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
          on:click={() => { playSound('click'); showParentControls = !showParentControls; }}
          style="cursor: pointer; font-size: 0.8rem; opacity: 0.5; display: flex; align-items: center; gap: 5px; user-select: none;"
        >
          <span>⚙️ Parent Settings (Backup & Restore)</span>
          <span>{showParentControls ? '▼' : '▶'}</span>
        </div>

        {#if showParentControls}
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; animation: fadeIn 0.3s ease;">
            <button class="btn btn-small" on:click={exportDiaryBackup} style="background: rgba(255, 255, 255, 0.15)">
              📤 Export Backup
            </button>
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="btn btn-small" style="background: rgba(255, 255, 255, 0.15); margin: 0; cursor: pointer;">
              📥 Import Backup
              <input type="file" accept=".json" on:change={handleImportBackup} style="display: none;" />
            </label>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- Journal Entry Texteditor View inside the standard game screen layout or styling -->
  <div 
    bind:this={screenEl}
    class="screen active" 
    style="flex: 1; display: flex; flex-direction: column; width: 100%; position: relative;"
  >
    <button class="btn-nav-back" on:click={goBackToCalendar}>↩ Back</button>
    <div style="width: 100%; display: flex; align-items: center; justify-content: flex-end; margin-bottom: 15px; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px; min-height: 50px;">
      <h2 style="margin: 0; font-size: 1.3rem; position: absolute; left: 110px;">📔 {formatDateLong(selectedDate)}</h2>
      <button class="btn btn-small" on:click={saveEntry} style="background: linear-gradient(45deg, #10b981, #059669)">💾 Save</button>
    </div>

    <!-- Writing prompt and word count display -->
    <div class="writing-prompt">
      <span class="prompt-icon">💡</span>
      <span>{currentPrompt}</span>
    </div>

    <div class="word-count-bar">
      <span>Words: <span class="count">{wordCount}</span></span>
      {#if wordCount >= 200}
        <span style="color: #22c55e;">🏆 Amazing writer!</span>
      {:else if wordCount >= 100}
        <span style="color: #fbbf24;">⭐ Keep going!</span>
      {:else if wordCount >= 50}
        <span style="color: #60a5fa;">📝 Nice progress!</span>
      {/if}
    </div>

    <!-- Textarea and visual keyboard layout -->
    <div class="display-area" style="flex: 1; min-height: 200px; display: flex; flex-direction: column; position: relative;">
      <textarea
        class="diary-game-textarea"
        bind:this={textareaEl}
        bind:value={entryContent}
        placeholder="Write about your day..."
        on:keydown={handleEditorKeyDown}
        on:keyup={checkSpelling}
        on:click={checkSpelling}
      ></textarea>
    </div>

    {#if showSpellingHelper}
      <div 
        class="spelling-helper-popup" 
        bind:clientHeight={popupHeight}
        style="left: {helperPosition.left}px; top: {helperPosition.top}px;"
      >
        <span class="spelling-helper-title">Spelling hint:</span>
        {#each spellingSuggestions as sug}
          <span class="spelling-helper-suggestion">{sug}</span>
        {/each}
      </div>
    {/if}

    <div style="margin-top: auto; width: 100%; display: flex; flex-direction: column; align-items: center;">
      <!-- Show interactive keyboard for visual typing guide -->
      <Keyboard requiredChar="" />
    </div>
  </div>
{/if}
