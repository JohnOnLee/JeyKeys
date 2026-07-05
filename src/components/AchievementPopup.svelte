<script>
  import { onDestroy } from 'svelte';
  import { playSound } from '../lib/audio.js';

  let queue = [];
  let current = null;
  let visible = false;
  let dismissTimeout = null;

  export function showAchievement(badge) {
    queue.push(badge);
    if (!current) {
      showNext();
    }
  }

  function showNext() {
    if (queue.length === 0) {
      current = null;
      visible = false;
      return;
    }

    current = queue.shift();
    visible = false;

    // Small delay then animate in
    setTimeout(() => {
      visible = true;
      playSound('achievement');
    }, 50);

    // Auto dismiss after 3.5s
    clearTimeout(dismissTimeout);
    dismissTimeout = setTimeout(() => {
      visible = false;
      setTimeout(showNext, 500);
    }, 3500);
  }

  onDestroy(() => {
    clearTimeout(dismissTimeout);
  });
</script>

{#if current}
  <div class="achievement-popup" class:show={visible}>
    <span class="badge-icon">{current.icon}</span>
    <div class="badge-info">
      <span class="badge-title">Achievement Unlocked!</span>
      <span class="badge-name">{current.name}</span>
      <span class="badge-desc">{current.description}</span>
    </div>
  </div>
{/if}
