<script>
  import { onMount } from 'svelte';
  import { themes } from '../lib/presets.js';
  import { activeTheme } from '../lib/state.js';
  import { applyTheme } from '../lib/theme.js';
  import { playSound } from '../lib/audio.js';

  let isOpen = false;
  let customColor = '#22c55e';

  // React to store changes and apply theme automatically
  $: {
    applyTheme($activeTheme);
    if ($activeTheme.type === 'custom') {
      customColor = $activeTheme.hex;
    } else {
      const theme = themes[$activeTheme.key];
      if (theme) customColor = theme.primary;
    }
  }

  function togglePanel(e) {
    e.stopPropagation();
    playSound('click');
    isOpen = !isOpen;
  }

  function selectPreset(key) {
    playSound('click');
    activeTheme.set({ type: 'preset', key });
  }

  function handleCustomColorInput(e) {
    const hex = e.target.value;
    activeTheme.set({ type: 'custom', hex });
  }

  function closePanel() {
    isOpen = false;
  }
</script>

<svelte:window on:click={closePanel} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="theme-wrapper" on:click|stopPropagation>
  <button
    id="theme-btn"
    class="btn btn-small"
    style="background: linear-gradient(45deg, #ec4899, #8b5cf6)"
    on:click={togglePanel}
  >
    🎨 Theme
  </button>

  <div id="theme-panel" class="theme-panel" class:open={isOpen}>
    <div class="theme-panel-title">Choose Theme</div>
    <div class="theme-grid">
      {#each Object.entries(themes) as [key, theme]}
        <button
          type="button"
          class="theme-swatch"
          class:active={$activeTheme.type === 'preset' && $activeTheme.key === key}
          style="background: linear-gradient(135deg, {theme.primary}, {theme.bgStart});"
          on:click={() => selectPreset(key)}
        >
          <span class="swatch-label">{theme.name}</span>
        </button>
      {/each}
    </div>
    <div class="theme-custom-row">
      <label for="theme-custom-color">✨ Custom</label>
      <input
        type="color"
        id="theme-custom-color"
        class="theme-color-input"
        value={customColor}
        on:input={handleCustomColorInput}
      />
    </div>
  </div>
</div>
