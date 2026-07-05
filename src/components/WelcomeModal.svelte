<script>
  import { playSound } from '../lib/audio.js';
  import { profiles, switchProfile, createProfile } from '../lib/profiles.js';

  export let show = false;
  export let onComplete = () => {};

  const avatars = ['🦁', '🐼', '🦊', '🐸', '🦋', '🐙', '🦄', '🐲', '🐯', '🐨', '🦜', '🐬'];

  let selectedAvatar = '';
  let nameInput = '';
  let step = 1; // 0: select profile, 1: avatar, 2: name

  $: {
    if (show && $profiles.length > 0 && step === 1 && !selectedAvatar && !nameInput) {
      step = 0;
    }
  }

  function selectProfile(profileId) {
    playSound('welcome');
    switchProfile(profileId);
    show = false;
    onComplete();
  }

  function startNewProfile() {
    playSound('click');
    selectedAvatar = '';
    nameInput = '';
    step = 1;
  }

  function selectAvatar(emoji) {
    playSound('click');
    selectedAvatar = emoji;
  }

  function nextStep() {
    if (!selectedAvatar) return;
    playSound('click');
    step = 2;
  }

  function finish() {
    if (!nameInput.trim()) return;
    createProfile(nameInput.trim(), selectedAvatar);
    show = false;
    onComplete();
  }
</script>

{#if show}
  <div class="welcome-overlay">
    <div class="welcome-modal" style="max-width: {step === 0 ? '550px' : '450px'};">
      {#if step === 0}
        <h2>👋 Who is playing?</h2>
        <p>Choose your profile to load your progress!</p>
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin: 25px 0;">
          {#each $profiles as p}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="profile-bubble-hover"
              style="display: flex; flex-direction: column; align-items: center; cursor: pointer;"
              on:click={() => selectProfile(p.id)}
            >
              <div style="font-size: 3rem; background: rgba(255,255,255,0.1); width: 85px; height: 85px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s;">
                {p.avatar}
              </div>
              <div style="margin-top: 8px; font-weight: bold; font-size: 1rem; color: white;">{p.name}</div>
            </div>
          {/each}
        </div>
        <button class="btn" on:click={startNewProfile} style="background: linear-gradient(45deg, #10b981, #059669)">
          ➕ Add Profile
        </button>
      {:else}
        {#if step === 1}
          <h2>👋 Welcome!</h2>
          <p>Pick your character!</p>
          <div class="avatar-grid">
            {#each avatars as emoji}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="avatar-option"
                class:selected={selectedAvatar === emoji}
                on:click={() => selectAvatar(emoji)}
              >
                {emoji}
              </div>
            {/each}
          </div>
          <div style="display: flex; gap: 10px; justify-content: center;">
            {#if $profiles.length > 0}
              <button class="btn" on:click={() => { playSound('click'); step = 0; }} style="background: rgba(255,255,255,0.15)">Back</button>
            {/if}
            <button class="btn" on:click={nextStep} disabled={!selectedAvatar}>
              Next ➡
            </button>
          </div>
        {:else}
          <h2>{selectedAvatar} What's your name?</h2>
          <p>Type your name below!</p>
          <input
            class="welcome-input"
            type="text"
            bind:value={nameInput}
            placeholder="Your name..."
            maxlength="20"
            on:keydown={(e) => e.key === 'Enter' && finish()}
          />
          <br />
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
            <button class="btn" on:click={() => { playSound('click'); step = 1; }} style="background: rgba(255,255,255,0.15)">Back</button>
            <button class="btn" on:click={finish} disabled={!nameInput.trim()}>
              Let's Go! 🚀
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
