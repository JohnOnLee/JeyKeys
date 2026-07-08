<script>
  import { playerAvatar } from '../lib/state.js';
  import { getAvatarAsset } from '../lib/shop.js';

  // Optional props for previewing (defaults to equipped store values)
  export let petId = null; // Map petId to avatar for compatibility
  export let accessoryIds = null; // Map accessoryIds to frame for compatibility
  export let backgroundId = null; // Map backgroundId to aura for compatibility
  export let size = 'medium'; // 'small', 'medium', 'large'

  // Resolve properties reactively
  $: activeAvatar = petId !== null ? petId : ($playerAvatar || '🦊');
  $: activeFrameId = accessoryIds !== null ? (Array.isArray(accessoryIds) ? (accessoryIds[0] || 'none') : accessoryIds) : 'none';
  $: activeAuraId = backgroundId !== null ? backgroundId : 'none';

  // Generate Frame CSS inline style helper
  function getFrameStyle(fid) {
    if (fid === 'crown') {
      return 'border: 4px solid #fbbf24; box-shadow: 0 0 15px rgba(251, 191, 36, 0.8);';
    }
    if (fid === 'rainbow') {
      return 'border: 4px solid transparent; background: linear-gradient(#1e1b4b, #1e1b4b) padding-box, linear-gradient(135deg, #ff007f, #7f00ff, #00ffff, #ff007f) border-box; background-size: 200% 200%; animation: rotate-rainbow 3s linear infinite;';
    }
    if (fid === 'neon') {
      return 'border: 4px solid #ec4899; box-shadow: 0 0 20px #ec4899, inset 0 0 10px #ec4899; animation: pulse-neon 1.5s ease-in-out infinite alternate;';
    }
    if (fid === 'ice') {
      return 'border: 4px solid #00f2fe; box-shadow: 0 0 15px rgba(0, 242, 254, 0.7); background: rgba(0, 242, 254, 0.05);';
    }
    return 'border: 2px solid rgba(255, 255, 255, 0.1);';
  }

  // Generate Aura CSS inline style helper
  function getAuraStyle(aid) {
    if (aid === 'space') {
      return 'background: radial-gradient(circle, rgba(30,27,75,0.8) 0%, rgba(49,16,66,0.95) 100%); box-shadow: 0 0 25px rgba(139, 92, 246, 0.5);';
    }
    if (aid === 'flame') {
      return 'background: radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(249,115,22,0.95) 100%); box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);';
    }
    if (aid === 'sparkle') {
      return 'background: radial-gradient(circle, rgba(253,224,71,0.7) 0%, rgba(234,179,8,0.95) 100%); box-shadow: 0 0 20px rgba(234, 179, 8, 0.5);';
    }
    if (aid === 'ocean') {
      return 'background: radial-gradient(circle, rgba(56,189,248,0.75) 0%, rgba(14,165,233,0.95) 100%); box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);';
    }
    return 'background: rgba(255, 255, 255, 0.05);';
  }
</script>

<div 
  class="avatar-container size-{size}" 
  style="{getAuraStyle(activeAuraId)} {getFrameStyle(activeFrameId)}"
>
  <!-- Interactive floating layer -->
  <div class="avatar-wrapper">
    <!-- Frame Overlay elements (e.g. Crown emoji floating on top) -->
    {#if activeFrameId === 'crown'}
      <div class="frame-crown-emoji">👑</div>
    {/if}

    <!-- The Base Emoji -->
    <div class="avatar-base">
      <img src={getAvatarAsset(activeAvatar)} alt="Avatar" class="emoji-img" />
    </div>

    <!-- Visual details based on Aura -->
    {#if activeAuraId === 'sparkle'}
      <div class="sparkles-overlay">✨</div>
    {:else if activeAuraId === 'space'}
      <div class="space-overlay">🌌</div>
    {:else if activeAuraId === 'flame'}
      <div class="flame-overlay">🔥</div>
    {:else if activeAuraId === 'ocean'}
      <div class="ocean-overlay">🌊</div>
    {/if}
  </div>

  <!-- Dynamic Shadow -->
  <div class="avatar-shadow"></div>
</div>

<style>
  .avatar-container {
    position: relative;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: visible;
    transition: all 0.3s ease;
  }

  /* Size Presets */
  .size-small {
    width: 60px;
    height: 60px;
  }
  .size-medium {
    width: 120px;
    height: 120px;
  }
  .size-large {
    width: 170px;
    height: 170px;
  }

  /* Unified float animation */
  .avatar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
    height: 80%;
    animation: float 3s ease-in-out infinite;
    z-index: 2;
  }

  .avatar-base {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 75%;
    height: 75%;
    transition: all 0.2s ease;
  }

  .emoji-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }

  /* Crown Overlay position */
  .frame-crown-emoji {
    position: absolute;
    top: -25%;
    left: 50%;
    transform: translateX(-50%) rotate(-5deg);
    font-size: 2.2rem;
    z-index: 5;
  }
  .size-small .frame-crown-emoji { font-size: 1.1rem; top: -30%; }
  .size-large .frame-crown-emoji { font-size: 3.2rem; top: -28%; }

  /* Aura overlays */
  .sparkles-overlay {
    position: absolute;
    top: 5%;
    right: 5%;
    font-size: 1.2rem;
    animation: sparkle-anim 2s infinite alternate;
  }
  .size-small .sparkles-overlay { font-size: 0.6rem; }
  .size-large .sparkles-overlay { font-size: 1.8rem; }

  .space-overlay {
    position: absolute;
    bottom: 5%;
    left: 5%;
    font-size: 1.1rem;
    opacity: 0.7;
    animation: pulse-space 4s infinite alternate;
  }
  .size-small .space-overlay { font-size: 0.5rem; }
  .size-large .space-overlay { font-size: 1.6rem; }

  .flame-overlay {
    position: absolute;
    bottom: -5%;
    right: 15%;
    font-size: 1.3rem;
    animation: float-flame 1.5s infinite ease-out;
  }
  .size-small .flame-overlay { font-size: 0.6rem; }
  .size-large .flame-overlay { font-size: 1.8rem; }

  .ocean-overlay {
    position: absolute;
    top: -5%;
    left: 10%;
    font-size: 1.1rem;
    animation: wave-ocean 3s infinite ease-in-out;
  }
  .size-small .ocean-overlay { font-size: 0.5rem; }
  .size-large .ocean-overlay { font-size: 1.6rem; }

  /* Shadow sizing and animation */
  .avatar-shadow {
    position: absolute;
    bottom: 4%;
    width: 60%;
    height: 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 50%;
    z-index: 1;
    animation: shadow 3s ease-in-out infinite;
  }

  .size-small .avatar-shadow {
    height: 4px;
    bottom: 2%;
  }

  /* Animations */
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
  }

  @keyframes shadow {
    0% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(0.85); opacity: 0.15; }
    100% { transform: scale(1); opacity: 0.4; }
  }

  @keyframes rotate-rainbow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulse-neon {
    from { box-shadow: 0 0 10px #ec4899, inset 0 0 5px #ec4899; }
    to { box-shadow: 0 0 25px #ec4899, inset 0 0 15px #ec4899; }
  }

  @keyframes sparkle-anim {
    0% { transform: scale(0.8) rotate(0deg); opacity: 0.5; }
    100% { transform: scale(1.2) rotate(15deg); opacity: 1; }
  }

  @keyframes pulse-space {
    0% { transform: scale(0.9); opacity: 0.5; }
    100% { transform: scale(1.1); opacity: 0.9; }
  }

  @keyframes float-flame {
    0% { transform: translateY(0) scale(0.8); opacity: 0.8; }
    100% { transform: translateY(-8px) scale(1.1); opacity: 0; }
  }

  @keyframes wave-ocean {
    0%, 100% { transform: translateX(0) scale(0.9); }
    50% { transform: translateX(5px) scale(1.1); }
  }
</style>
