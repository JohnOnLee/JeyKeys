<script>
  import { badges, unlockedAchievements } from '../lib/achievements.js';
  import { router } from '../lib/router.js';
  import { playSound } from '../lib/audio.js';

  const categories = [
    { key: 'typing', label: '⌨️ Typing Badges' },
    { key: 'math', label: '🔢 Math Badges' },
    { key: 'diary', label: '📔 Diary Badges' },
    { key: 'meta', label: '🌟 Special Badges' }
  ];

  $: unlocked = $unlockedAchievements;

  function getBadgesByCategory(category) {
    return badges.filter(b => b.category === category);
  }

  function isUnlocked(badgeId) {
    return !!unlocked[badgeId];
  }
</script>

<div class="screen active" style="width: 100%; overflow-y: auto;">
  <div style="width: 100%; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0; font-size: 1.5rem; text-align: center;">🏆 Achievement Gallery</h2>
  </div>

  <div style="text-align: center; margin-bottom: 20px; font-size: 1.1rem; opacity: 0.8;">
    {Object.keys(unlocked).length} / {badges.length} badges earned
  </div>

  <div class="achievement-gallery">
    {#each categories as cat}
      <div class="achievement-category">
        <div class="achievement-category-title">{cat.label}</div>
        <div class="achievement-grid">
          {#each getBadgesByCategory(cat.key) as badge}
            <div class="achievement-card" class:unlocked={isUnlocked(badge.id)} class:locked={!isUnlocked(badge.id)}>
              <span class="achievement-icon">{badge.icon}</span>
              <div class="achievement-name">{isUnlocked(badge.id) ? badge.name : '???'}</div>
              <div class="achievement-desc">{isUnlocked(badge.id) ? badge.description : badge.description}</div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
