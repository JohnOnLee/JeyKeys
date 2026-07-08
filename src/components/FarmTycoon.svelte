<script>
  import { fade, fly } from 'svelte/transition';
  import { points, farmGrid, farmInventory, defaultFarmGrid } from '../lib/state.js';
  import { FARM_ITEMS, CROP_MATURATION, MARKET_PRICES, tickFarmGrowth } from '../lib/farmConfig.js';
  import { playSound } from '../lib/audio.js';
  import { router } from '../lib/router.js';
  import { showToast } from '../lib/toastStore.js';
  import { saveCurrentProfileState } from '../lib/profiles.js';

  // Active Tool: 'plow', 'water', 'bulldozer', or a FARM_ITEMS object
  let selectedTool = null;

  // Sidebar Tab: 'buy', 'barn', 'market'
  let activeTab = 'buy';

  const seedsItems = FARM_ITEMS.filter(item => item.type === 'seed');
  const animalsItems = FARM_ITEMS.filter(item => item.type === 'animal');
  const goodsList = ['wheat', 'carrot', 'corn', 'egg', 'wool', 'milk'];

  const ANIMAL_PRODUCTS = {
    chicken: 'egg',
    sheep: 'wool',
    cow: 'milk'
  };

  const goodsMetadata = {
    wheat: { name: 'Wheat', emoji: '🌾', tile: 'tile_0068' },
    carrot: { name: 'Carrot', emoji: '🥕', tile: 'tile_0008' },
    corn: { name: 'Corn', emoji: '🌽', tile: 'tile_0032' },
    egg: { name: 'Egg', emoji: '🥚', tile: 'tile_0125' },
    wool: { name: 'Wool', emoji: '🧶', tile: 'tile_0074' },
    milk: { name: 'Milk', emoji: '🥛', tile: 'tile_0123' }
  };

  function getItemByInventoryKey(key) {
    return FARM_ITEMS.find(item => (item.cropType === key || item.animalType === key));
  }

  function getCropOrAnimalProductEmoji(cell) {
    if (cell.type === 'crop') {
      if (cell.cropType === 'wheat') return '🌾';
      if (cell.cropType === 'carrot') return '🥕';
      if (cell.cropType === 'corn') return '🌽';
    }
    if (cell.type === 'animal') {
      if (cell.animalType === 'chicken') return '🥚';
      if (cell.animalType === 'sheep') return '🧶';
      if (cell.animalType === 'cow') return '🥛';
    }
    return '📦';
  }

  function selectTool(tool) {
    playSound('click');
    if (selectedTool === tool) {
      selectedTool = null;
    } else {
      selectedTool = tool;
    }
  }

  function buyItem(item) {
    if ($points < item.price) {
      playSound('error');
      showToast(`Not enough points! Need 🪙 ${item.price} pts.`);
      return;
    }

    points.update(p => p - item.price);
    
    const key = item.cropType || item.animalType;
    farmInventory.update(inv => {
      const next = { ...inv };
      if (!next.seeds) next.seeds = {};
      next.seeds[key] = (next.seeds[key] || 0) + 1;
      return next;
    });

    playSound('correct');
    showToast(`Bought ${item.name}! 🪙-${item.price}`);
    saveCurrentProfileState();
  }

  function harvestCrop(idx) {
    const cell = $farmGrid[idx];
    if (cell.type !== 'crop' || cell.cropStage !== 3) return;

    const cropType = cell.cropType;
    farmInventory.update(inv => {
      const next = { ...inv };
      if (!next.goods) next.goods = { wheat: 0, carrot: 0, corn: 0, egg: 0, wool: 0, milk: 0 };
      next.goods[cropType] = (next.goods[cropType] || 0) + 1;
      return next;
    });

    farmGrid.update(grid => {
      const next = [...grid];
      next[idx] = {
        ...next[idx],
        type: 'dirt',
        tileId: 'tile_0000',
        cropType: null,
        cropStage: 0,
        watered: false,
        hasProduct: false
      };
      return next;
    });

    playSound('win');
    showToast(`Harvested ${cropType.charAt(0).toUpperCase() + cropType.slice(1)}! 🌾`);
    saveCurrentProfileState();
  }

  function collectProduct(idx) {
    const cell = $farmGrid[idx];
    if (cell.type !== 'animal' || !cell.hasProduct) return;

    const animalType = cell.animalType;
    const product = ANIMAL_PRODUCTS[animalType];

    farmInventory.update(inv => {
      const next = { ...inv };
      if (!next.goods) next.goods = { wheat: 0, carrot: 0, corn: 0, egg: 0, wool: 0, milk: 0 };
      next.goods[product] = (next.goods[product] || 0) + 1;
      return next;
    });

    farmGrid.update(grid => {
      const next = [...grid];
      next[idx] = {
        ...next[idx],
        hasProduct: false
      };
      return next;
    });

    playSound('win');
    const displayProduct = product.charAt(0).toUpperCase() + product.slice(1);
    const displayEmoji = goodsMetadata[product]?.emoji || '🥛';
    showToast(`Collected ${displayProduct}! ${displayEmoji}`);
    saveCurrentProfileState();
  }

  function handleCellClick(idx) {
    const cell = $farmGrid[idx];

    // Priority 1: Bulldozer tool takes absolute precedence
    if (selectedTool === 'bulldozer') {
      if (cell.type === 'grass') {
        playSound('click');
        return;
      }

      if (cell.type === 'animal') {
        const animalType = cell.animalType;
        farmInventory.update(inv => {
          const next = { ...inv };
          if (!next.seeds) next.seeds = {};
          next.seeds[animalType] = (next.seeds[animalType] || 0) + 1;
          return next;
        });
        showToast(`Returned ${animalType} to inventory! 🚜`);
      } else if (cell.type === 'crop') {
        showToast(`Cleared crop! 🚜`);
      } else {
        showToast(`Cleared cell! 🚜`);
      }

      farmGrid.update(grid => {
        const next = [...grid];
        next[idx] = {
          ...next[idx],
          type: 'grass',
          tileId: null,
          cropType: null,
          cropStage: 0,
          watered: false,
          hasProduct: false
        };
        return next;
      });
      playSound('error');
      saveCurrentProfileState();
      return;
    }

    // Priority 2: Prevent watering animal cells that already have a product ready for collection
    if (selectedTool === 'water' && cell.type === 'animal' && cell.hasProduct) {
      showToast("Collect the product first!");
      playSound('error');
      return;
    }

    // Priority 3: Harvest or Collect if ready
    if (cell.type === 'crop' && cell.cropStage === 3) {
      harvestCrop(idx);
      return;
    }
    if (cell.type === 'animal' && cell.hasProduct) {
      collectProduct(idx);
      return;
    }

    // Plow tool
    if (selectedTool === 'plow') {
      if (cell.type !== 'grass') {
        showToast("Can only plow grass tiles!");
        playSound('error');
        return;
      }
      if ($points < 5) {
        showToast("Not enough points to plow! (Need 🪙 5 pts)");
        playSound('error');
        return;
      }
      points.update(p => p - 5);
      farmGrid.update(grid => {
        const next = [...grid];
        next[idx] = {
          ...next[idx],
          type: 'dirt',
          tileId: 'tile_0000',
          cropType: null,
          cropStage: 0,
          watered: false,
          hasProduct: false
        };
        return next;
      });
      playSound('correct');
      showToast("Plowed grass to soil! 🪙-5");
      saveCurrentProfileState();
      return;
    }

    // Water tool
    if (selectedTool === 'water') {
      if (cell.type !== 'crop' && cell.type !== 'animal') {
        showToast("Can only water crops or animals!");
        playSound('error');
        return;
      }
      if (cell.watered) {
        showToast("Already watered!");
        playSound('click');
        return;
      }
      farmGrid.update(grid => {
        const next = [...grid];
        next[idx] = { ...next[idx], watered: true };
        return next;
      });
      playSound('correct');
      showToast("Watered! 💧");
      saveCurrentProfileState();
      return;
    }

    // Seed planting
    if (selectedTool && typeof selectedTool === 'object' && selectedTool.type === 'seed') {
      const cropType = selectedTool.cropType;
      if (cell.type !== 'dirt') {
        showToast("Can only plant seeds in tilled dirt!");
        playSound('error');
        return;
      }
      const count = $farmInventory.seeds?.[cropType] || 0;
      if (count <= 0) {
        showToast(`No ${selectedTool.name}s left in inventory!`);
        playSound('error');
        return;
      }

      farmInventory.update(inv => {
        const next = { ...inv };
        if (!next.seeds) next.seeds = {};
        next.seeds[cropType] = Math.max(0, (next.seeds[cropType] || 0) - 1);
        return next;
      });

      farmGrid.update(grid => {
        const next = [...grid];
        next[idx] = {
          ...next[idx],
          type: 'crop',
          cropType,
          cropStage: 0,
          tileId: CROP_MATURATION[cropType][0],
          watered: false,
          hasProduct: false
        };
        return next;
      });

      playSound('correct');
      showToast(`Planted ${selectedTool.name}! 🌾`);
      saveCurrentProfileState();
      return;
    }

    // Animal placing
    if (selectedTool && typeof selectedTool === 'object' && selectedTool.type === 'animal') {
      const animalType = selectedTool.animalType;
      if (cell.type !== 'grass' && cell.type !== 'dirt') {
        showToast("Can only place animals on grass or dirt!");
        playSound('error');
        return;
      }
      const count = $farmInventory.seeds?.[animalType] || 0;
      if (count <= 0) {
        showToast(`No ${selectedTool.name}s left in inventory!`);
        playSound('error');
        return;
      }

      farmInventory.update(inv => {
        const next = { ...inv };
        if (!next.seeds) next.seeds = {};
        next.seeds[animalType] = Math.max(0, (next.seeds[animalType] || 0) - 1);
        return next;
      });

      farmGrid.update(grid => {
        const next = [...grid];
        next[idx] = {
          ...next[idx],
          type: 'animal',
          animalType,
          tileId: selectedTool.tileId,
          watered: false,
          hasProduct: false
        };
        return next;
      });

      playSound('correct');
      showToast(`Placed ${selectedTool.name}! 🐾`);
      saveCurrentProfileState();
      return;
    }

    // Default info mode click
    if (cell.type === 'crop') {
      showToast(`Growing ${cell.cropType} (Stage ${cell.cropStage + 1}/4)`);
      playSound('click');
    } else if (cell.type === 'animal') {
      showToast(`A cute ${cell.animalType}!`);
      playSound('click');
    } else if (cell.type === 'dirt') {
      showToast("Tilled soil. Ready for planting!");
      playSound('click');
    } else {
      showToast("Empty grass. Plow it to start planting!");
      playSound('click');
    }
  }

  function sellOne(goodsKey) {
    const qty = $farmInventory.goods?.[goodsKey] || 0;
    if (qty <= 0) {
      showToast(`No ${goodsKey} to sell!`);
      playSound('error');
      return;
    }
    const price = MARKET_PRICES[goodsKey] || 0;
    farmInventory.update(inv => {
      const next = { ...inv };
      if (!next.goods) next.goods = {};
      next.goods[goodsKey] = Math.max(0, (next.goods[goodsKey] || 0) - 1);
      return next;
    });
    points.update(p => p + price);
    playSound('correct');
    showToast(`Sold 1 ${goodsKey} for 🪙${price}!`);
    saveCurrentProfileState();
  }

  function sellAll() {
    let totalEarnings = 0;
    let itemsSold = 0;

    farmInventory.update(inv => {
      const next = { ...inv };
      if (next.goods) {
        for (const [key, qty] of Object.entries(next.goods)) {
          if (qty > 0) {
            const price = MARKET_PRICES[key] || 0;
            totalEarnings += price * qty;
            itemsSold += qty;
            next.goods[key] = 0;
          }
        }
      }
      return next;
    });

    if (itemsSold === 0) {
      showToast("No goods to sell in your Barn!");
      playSound('error');
      return;
    }

    points.update(p => p + totalEarnings);
    playSound('win');
    showToast(`Sold ${itemsSold} goods for 🪙${totalEarnings}! 🎉`);
    saveCurrentProfileState();
  }

  function resetGrid() {
    if (typeof window === 'undefined') return;
    const confirmReset = window.confirm("Are you sure you want to reset your farm? All crops and animals on the grid will be lost!");
    if (!confirmReset) return;

    playSound('error');
    farmGrid.set(JSON.parse(JSON.stringify(defaultFarmGrid)));
    selectedTool = null;
    showToast("Farm grid has been reset! 🚜");
    saveCurrentProfileState();
  }

  function triggerGrowthTick() {
    if ($points < 20) {
      playSound('error');
      showToast("Not enough points to advance time! (Need 🪙 20 pts)");
      return;
    }
    points.update(p => p - 20);
    playSound('correct');
    tickFarmGrowth();
    showToast("Advanced time! ☀️ 🪙-20");
  }

  // Reactively track inventory entries
  $: seedEntries = Object.entries($farmInventory.seeds || {}).filter(([_, qty]) => qty > 0);

  // Compute total elements placed on the grid
  $: activeCrops = $farmGrid.filter(c => c.type === 'crop').length;
  $: activeAnimals = $farmGrid.filter(c => c.type === 'animal').length;
</script>

<div class="shop-container" in:fade={{ duration: 200 }}>
  <!-- Header Section -->
  <div class="shop-header">
    <div style="display: flex; align-items: center; gap: 15px;">
      <button class="btn btn-small" on:click={() => { playSound('click'); router.navigate('home'); }} style="background: rgba(255,255,255,0.15)">
        ⬅ Back
      </button>
      <h2 style="margin: 0; font-size: 1.8rem; text-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px;">
        🚜 Farm Tycoon
      </h2>
    </div>

    <!-- Stats summary -->
    <div style="display: flex; gap: 12px; align-items: center;">
      <div class="stat-badge" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.35);">
        <span class="badge-icon">🌾</span>
        <span class="badge-val">{activeCrops} Crops</span>
      </div>
      <div class="stat-badge" style="background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.35);">
        <span class="badge-icon">🐄</span>
        <span class="badge-val">{activeAnimals} Animals</span>
      </div>
      <button class="btn btn-small" on:click={triggerGrowthTick} style="background: linear-gradient(135deg, #10b981, #059669); padding: 6px 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px;">
        ⏳ Advance Time (🪙20)
      </button>
    </div>
  </div>

  <!-- Main Work Pane -->
  <div class="builder-layout">
    
    <!-- LEFT: The 8x8 Grid -->
    <div class="grid-section">
      <div class="grid-label">My Farm Grid (8x8 Grid)</div>

      <!-- Active Tool Banner -->
      <div class="active-tool-banner {selectedTool ? (selectedTool === 'plow' || selectedTool === 'water' ? 'place-mode' : selectedTool === 'bulldozer' ? 'bulldozer-mode' : 'plant-mode') : 'inactive'}">
        {#if selectedTool === 'plow'}
          <span class="banner-icon">🚜</span>
          <span class="banner-text">Plow tool active - click grass cells to till soil (costs 🪙5)</span>
          <button class="banner-close-btn" on:click={() => selectedTool = null} aria-label="Cancel tool">×</button>
        {:else if selectedTool === 'water'}
          <span class="banner-icon">💧</span>
          <span class="banner-text">Water tool active - click dry crops or animals to water them</span>
          <button class="banner-close-btn" on:click={() => selectedTool = null} aria-label="Cancel tool">×</button>
        {:else if selectedTool === 'bulldozer'}
          <span class="banner-icon">🚜</span>
          <span class="banner-text">Bulldozer active - click cells to clear crops/dirt or return animals</span>
          <button class="banner-close-btn" on:click={() => selectedTool = null} aria-label="Cancel tool">×</button>
        {:else if selectedTool && typeof selectedTool === 'object'}
          <span class="banner-icon">{selectedTool.type === 'seed' ? '🌱' : '🐾'}</span>
          <span class="banner-text">Placing <strong>{selectedTool.name}</strong> (Inventory: {$farmInventory.seeds?.[selectedTool.cropType || selectedTool.animalType] || 0})</span>
          <button class="banner-close-btn" on:click={() => selectedTool = null} aria-label="Cancel tool">×</button>
        {:else}
          <span class="banner-icon">ℹ️</span>
          <span class="banner-text">Info Mode - click crops or animals to inspect. Tap ripe bubbles to harvest!</span>
        {/if}
      </div>

      <!-- The 8x8 Board -->
      <div class="farm-grid">
        {#each $farmGrid as cell, idx}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div 
            class="grid-cell"
            on:click={() => handleCellClick(idx)}
            title="Row {cell.row + 1}, Col {cell.col + 1}"
          >
            <!-- Grass base texturing under every cell -->
            <img src="/assets/tinyTown/Tiles/tile_0000.png" alt="grass" class="cell-bg" />

            <!-- Plowed soil layer for dirt or crop cells -->
            {#if cell.type === 'dirt' || cell.type === 'crop'}
              <img src="/assets/tinyFarm/Tiles/tile_0000.png" alt="dirt" class="tile-image" />
            {/if}

            <!-- Placed Tile (Crops, Animals, etc.) -->
            {#if cell.tileId && cell.tileId !== 'tile_0000'}
              <img src="/assets/tinyFarm/Tiles/{cell.tileId}.png" alt={cell.tileId} class="tile-image" />
            {/if}

            <!-- Placing Ghost Preview -->
            {#if selectedTool && typeof selectedTool === 'object'}
              {#if selectedTool.type === 'seed' && cell.type === 'dirt' && !cell.cropType}
                <img src="/assets/tinyFarm/Tiles/{CROP_MATURATION[selectedTool.cropType][0]}.png" alt="preview" class="tile-image preview-ghost" />
              {:else if selectedTool.type === 'animal' && (cell.type === 'grass' || cell.type === 'dirt')}
                <img src="/assets/tinyFarm/Tiles/{selectedTool.tileId}.png" alt="preview" class="tile-image preview-ghost" />
              {/if}
            {/if}

            <!-- Watered Overlay glow & icon -->
            {#if cell.watered}
              <div class="watered-overlay"></div>
              <span class="watered-drop">💧</span>
            {/if}

            <!-- Floating product collection bubble -->
            {#if cell.type === 'crop' && cell.cropStage === 3}
              <button 
                class="product-bubble" 
                on:click|stopPropagation={() => harvestCrop(idx)}
                aria-label="Harvest crop"
              >
                {getCropOrAnimalProductEmoji(cell)}
              </button>
            {:else if cell.type === 'animal' && cell.hasProduct}
              <button 
                class="product-bubble" 
                on:click|stopPropagation={() => collectProduct(idx)}
                aria-label="Collect animal product"
              >
                {getCropOrAnimalProductEmoji(cell)}
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Horizontal Toolbelt -->
      <div class="toolbelt">
        <button 
          class="toolbelt-btn" 
          class:active={selectedTool === 'plow'}
          on:click={() => selectTool('plow')}
        >
          <span class="tool-icon">🚜</span>
          <span class="tool-label">Plow (🪙5)</span>
        </button>
        <button 
          class="toolbelt-btn" 
          class:active={selectedTool === 'water'}
          on:click={() => selectTool('water')}
        >
          <span class="tool-icon">💧</span>
          <span class="tool-label">Water</span>
        </button>
        <button 
          class="toolbelt-btn" 
          class:active={selectedTool === 'bulldozer'}
          on:click={() => selectTool('bulldozer')}
        >
          <span class="tool-icon">🧹</span>
          <span class="tool-label">Bulldoze</span>
        </button>
        {#if selectedTool}
          <button 
            class="toolbelt-btn cancel-btn"
            on:click={() => selectedTool = null}
          >
            <span class="tool-icon">❌</span>
            <span class="tool-label">Cancel</span>
          </button>
        {/if}
      </div>
    </div>

    <!-- RIGHT: Catalog & Inventory Sidebar -->
    <div class="sidebar-section">
      <!-- Catalog / Inventory Tabs -->
      <div class="catalog-tabs">
        <button class="tab-btn" class:active={activeTab === 'buy'} on:click={() => { playSound('click'); activeTab = 'buy'; }}>🛒 Buy Shop</button>
        <button class="tab-btn" class:active={activeTab === 'barn'} on:click={() => { playSound('click'); activeTab = 'barn'; }}>📦 Barn & Silo</button>
        <button class="tab-btn" class:active={activeTab === 'market'} on:click={() => { playSound('click'); activeTab = 'market'; }}>⚖️ Market</button>
        <button class="tab-btn" class:active={activeTab === 'help'} on:click={() => { playSound('click'); activeTab = 'help'; }}>❓ Help</button>
      </div>

      <!-- Tab Content Panels -->
      {#if activeTab === 'buy'}
        <div class="tab-content" in:fade={{ duration: 150 }}>
          <!-- Seeds Catalog -->
          <div class="section-container" style="margin-bottom: 12px;">
            <div class="section-title">🌱 Purchase Seeds</div>
            <div class="catalog-list">
              {#each seedsItems as item}
                {@const ownedCount = $farmInventory.seeds?.[item.cropType] || 0}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div 
                  class="catalog-row" 
                  class:selected={selectedTool && selectedTool.id === item.id}
                  on:click={() => selectTool(item)}
                >
                  <img src="/assets/tinyFarm/Tiles/{CROP_MATURATION[item.cropType][3]}.png" alt={item.name} class="catalog-tile-image" />
                  <div style="flex: 1; text-align: left;">
                    <div style="font-weight: bold; font-size: 0.85rem; color: white; margin-bottom: 2px;">{item.name}</div>
                    <div class="pill-badge-container">
                      <span class="pill-badge cost-badge">🪙 {item.price} pts</span>
                      {#if ownedCount > 0}
                        <span class="pill-badge owned-badge">🎒 {ownedCount} owned</span>
                      {/if}
                    </div>
                  </div>
                  <div>
                    <button 
                      class="buy-badge-btn" 
                      on:click|stopPropagation={() => buyItem(item)}
                      disabled={$points < item.price}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Animals Catalog -->
          <div class="section-container" style="flex: 1; overflow-y: auto;">
            <div class="section-title">🐄 Purchase Livestock</div>
            <div class="catalog-list">
              {#each animalsItems as item}
                {@const ownedCount = $farmInventory.seeds?.[item.animalType] || 0}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div 
                  class="catalog-row" 
                  class:selected={selectedTool && selectedTool.id === item.id}
                  on:click={() => selectTool(item)}
                >
                  <img src="/assets/tinyFarm/Tiles/{item.tileId}.png" alt={item.name} class="catalog-tile-image" />
                  <div style="flex: 1; text-align: left;">
                    <div style="font-weight: bold; font-size: 0.85rem; color: white; margin-bottom: 2px;">{item.name}</div>
                    <div class="pill-badge-container">
                      <span class="pill-badge cost-badge">🪙 {item.price} pts</span>
                      {#if ownedCount > 0}
                        <span class="pill-badge owned-badge">🎒 {ownedCount} owned</span>
                      {/if}
                    </div>
                  </div>
                  <div>
                    <button 
                      class="buy-badge-btn" 
                      on:click|stopPropagation={() => buyItem(item)}
                      disabled={$points < item.price}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'barn'}
        <div class="tab-content" in:fade={{ duration: 150 }}>
          <!-- Storage Seeds & Animals -->
          <div class="section-container" style="margin-bottom: 12px;">
            <div class="section-title">🎒 Stored Seeds & Animals (Click to select/place)</div>
            <div class="inventory-list">
              {#if seedEntries.length === 0}
                <div class="empty-list-text">Your Silo is empty. Purchase seeds or animals from the Buy Shop!</div>
              {:else}
                <div class="inventory-grid">
                  {#each seedEntries as [key, qty]}
                    {@const item = getItemByInventoryKey(key)}
                    {#if item && qty > 0}
                      <!-- svelte-ignore a11y-click-events-have-key-events -->
                      <!-- svelte-ignore a11y-no-static-element-interactions -->
                      <div 
                        class="inventory-item" 
                        class:selected={selectedTool && selectedTool.id === item.id}
                        on:click={() => selectTool(item)}
                      >
                        {#if item.type === 'seed'}
                          <img src="/assets/tinyFarm/Tiles/{CROP_MATURATION[item.cropType][0]}.png" alt={item.name} class="inventory-tile-image" />
                        {:else}
                          <img src="/assets/tinyFarm/Tiles/{item.tileId}.png" alt={item.name} class="inventory-tile-image" />
                        {/if}
                        <div class="inventory-item-name">{item.name}</div>
                        <span class="qty-badge">{qty}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Harvested Goods -->
          <div class="section-container" style="flex: 1; overflow-y: auto;">
            <div class="section-title">🌾 Harvested Goods (Stored in Barn)</div>
            <div class="goods-list">
              <div class="goods-grid">
                {#each goodsList as key}
                  {@const qty = $farmInventory.goods?.[key] || 0}
                  {@const meta = goodsMetadata[key]}
                  <div class="goods-card">
                    <span class="goods-emoji">{meta.emoji}</span>
                    <div style="text-align: left; flex: 1;">
                      <div class="goods-card-name">{meta.name}</div>
                      <div class="goods-card-qty">Count: <strong>{qty}</strong></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'market'}
        <div class="tab-content" in:fade={{ duration: 150 }}>
          <!-- Sell All Hero Button -->
          <div class="section-container" style="margin-bottom: 12px; align-items: center; text-align: center; background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(217, 119, 6, 0.15)); border-color: rgba(251, 191, 36, 0.25);">
            <div style="font-size: 1.5rem; margin-bottom: 5px;">💰</div>
            <h3 style="margin: 0 0 5px 0; color: #fbbf24; font-size: 1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Wholesale Delivery</h3>
            <p style="font-size: 0.75rem; opacity: 0.8; margin: 0 0 12px 0; max-width: 250px;">Sell all goods currently stored in your Barn for a high valuation payout!</p>
            <button class="sell-all-btn" on:click={sellAll}>
              🎉 Sell All Stored Goods
            </button>
          </div>

          <!-- Market Itemized Price List -->
          <div class="section-container" style="flex: 1; overflow-y: auto;">
            <div class="section-title">⚖️ Commodities Market Board</div>
            <div class="market-list">
              {#each goodsList as key}
                {@const qty = $farmInventory.goods?.[key] || 0}
                {@const meta = goodsMetadata[key]}
                {@const price = MARKET_PRICES[key]}
                <div class="market-row">
                  <span style="font-size: 1.6rem; line-height: 1;">{meta.emoji}</span>
                  <div style="flex: 1; text-align: left;">
                    <div style="font-weight: bold; font-size: 0.85rem; color: white;">{meta.name}</div>
                    <div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.65);">
                      Stored: <strong>{qty}</strong> | Value: <span style="color: #fbbf24; font-weight: bold;">🪙 {price}</span>
                    </div>
                  </div>
                  <div>
                    <button 
                      class="sell-one-btn"
                      disabled={qty <= 0}
                      on:click={() => sellOne(key)}
                    >
                      Sell 1
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else if activeTab === 'help'}
        <div class="tab-content" in:fade={{ duration: 150 }} style="overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 15px;">
          <div class="section-container">
            <div class="section-title" style="color: #fbbf24; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
              <span>❓ How to Play Farm Tycoon</span>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.5; color: #e2e8f0; display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
              <p>🚜 <strong>Tilling Soil:</strong> Select the <strong>Plow 🚜</strong> tool and click any green grass cell to till it into soil. Plowing costs <strong>🪙5 points</strong>.</p>
              <p>🌱 <strong>Planting:</strong> Select an owned seed from your <strong>Barn & Silo</strong> inventory tab, then click any plowed soil cell to plant it.</p>
              <p>💧 <strong>Watering:</strong> Select the <strong>Water 💧</strong> tool and click any crop or animal cell. Watering accelerates plant growth and increases animal production speed.</p>
              <p>🐮 <strong>Raising Animals:</strong> Buy animals (Chicken, Sheep, Cow) from the <strong>Buy Shop</strong>. Select them in your Barn, and click any grass or dirt cell to place them on your farm.</p>
              <p>🥚 <strong>Harvesting:</strong> Ripe crops and productive animals will show a bouncy floating product bubble above their heads. Tap the bubble to harvest the item into your Barn inventory!</p>
              <p>⚖️ <strong>Selling Goods:</strong> Go to the <strong>Market</strong> tab to trade your harvested items for points. You can sell items individually or click the <strong>Sell All Goods 💰</strong> button for a wholesale payout!</p>
            </div>
          </div>

          <div class="section-container" style="border-color: rgba(59, 130, 246, 0.35); background: rgba(59, 130, 246, 0.05); margin-bottom: 10px;">
            <div class="section-title" style="color: #60a5fa; font-size: 0.95rem;">⏳ How to Advance Time</div>
            <div style="font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
              <p>📖 <strong>Study & Grow (Free):</strong> Work on Typing games, Math play, or write in your Daily Diary. Every <strong>20 XP</strong> you earn automatically triggers a time growth tick across your entire farm!</p>
              <p>⚡ <strong>Skip Time (Paid):</strong> Spend <strong>🪙20 points</strong> on the <strong>Advance Time (🪙20)</strong> button in the top bar to advance the farm growth clock instantly.</p>
            </div>
          </div>
        </div>
      {/if}

    </div>
  </div>
</div>

<style>
  .shop-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--glass, rgba(15, 23, 42, 0.4));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    border-radius: 15px;
    padding: 20px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .shop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    padding-bottom: 15px;
    margin-bottom: 15px;
  }

  .stat-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.25);
    border-radius: 10px;
    padding: 5px 12px;
    font-weight: bold;
    font-size: 0.85rem;
    color: white;
  }

  .builder-layout {
    display: flex;
    gap: 20px;
    flex: 1;
    overflow: hidden;
    height: calc(100% - 60px);
  }

  .grid-section {
    flex: 1.2;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 15px;
    padding: 15px;
    overflow: hidden;
  }

  .grid-label {
    font-size: 0.9rem;
    font-weight: bold;
    color: #a78bfa;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Rich Game-Board Styling */
  .farm-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    gap: 4px;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 1 / 1;
    background: #0f172a; /* Dark slate background under the cells */
    border: 14px solid #1e293b; /* Thick, dark slate border */
    border-radius: 24px;
    padding: 6px;
    box-sizing: border-box;
    box-shadow: 
      inset 0 10px 25px rgba(0, 0, 0, 0.7),
      0 0 0 3px #d4af37, /* Gold metallic trim */
      0 12px 32px rgba(0, 0, 0, 0.6);
  }

  /* Grid Cell & Hover Shine Overlay */
  .grid-cell {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: visible; /* Show floating collection bubbles */
  }



  .grid-cell:hover {
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 
      0 0 12px rgba(255, 255, 255, 0.2),
      inset 0 0 8px rgba(255, 255, 255, 0.1);
    transform: scale(1.08);
    z-index: 10;
  }

  .grid-cell:active {
    transform: scale(0.95);
  }

  /* Grass Base Texturing */
  .cell-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    image-rendering: pixelated;
    user-select: none;
    pointer-events: none;
    z-index: 1;
  }

  /* Placed Tile Depth & Spring Animation */
  .tile-image {
    position: absolute;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    object-fit: contain;
    image-rendering: pixelated;
    user-select: none;
    pointer-events: none;
    z-index: 2;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
    animation: tile-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  }
  
  /* Spring Placement Animation */
  @keyframes tile-pop {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    60% {
      transform: scale(1.2);
    }
    80% {
      transform: scale(0.95);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .preview-ghost {
    opacity: 0;
    transition: opacity 0.15s ease;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
    animation: none !important;
  }
  
  .grid-cell:hover .preview-ghost {
    opacity: 0.55;
  }
  
  .watered-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 2px solid rgba(59, 130, 246, 0.8);
    box-shadow: inset 0 0 8px rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.12);
    pointer-events: none;
    z-index: 4;
    border-radius: 4px;
  }

  .watered-drop {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 0.75rem;
    z-index: 5;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
    animation: drop-float 2s infinite ease-in-out;
  }

  @keyframes drop-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }

  .product-bubble {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #fbbf24;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    cursor: pointer;
    z-index: 8;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
    animation: bubble-bounce 1.5s infinite ease-in-out;
  }

  @keyframes bubble-bounce {
    0%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(-6px);
    }
  }

  .toolbelt {
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    max-width: 480px;
    margin-top: 15px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 8px;
    box-sizing: border-box;
  }

  .toolbelt-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 6px 4px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toolbelt-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  .toolbelt-btn.active {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(217, 119, 6, 0.25));
    border-color: #fbbf24;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.3);
  }

  .toolbelt-btn.cancel-btn {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    flex: 0.8;
  }

  .toolbelt-btn.cancel-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
  }

  .tool-icon {
    font-size: 1.2rem;
    margin-bottom: 2px;
  }

  .tool-label {
    font-size: 0.7rem;
    font-weight: 600;
  }



  .sidebar-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow: hidden;
  }

  /* Glassmorphic Sidebar Tabs */
  .catalog-tabs {
    display: flex;
    gap: 4px;
    background: rgba(15, 23, 42, 0.6);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    padding: 8px 6px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .tab-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.03);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #fbbf24, #d97706);
    color: white;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 45px);
    overflow: hidden;
  }

  /* Glassmorphic Container */
  .section-container {
    background: rgba(15, 23, 42, 0.45); /* Darker, sleek slate base */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  }

  .section-title {
    font-size: 0.75rem;
    font-weight: bold;
    color: #fbbf24;
    text-transform: uppercase;
    text-align: left;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }

  .inventory-list {
    max-height: 140px;
    overflow-y: auto;
    padding-bottom: 2px;
  }

  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  /* Glassmorphic Inventory Items */
  .inventory-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }

  .inventory-item:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: #fbbf24;
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
    transform: translateY(-1px);
  }

  .inventory-item.selected {
    border-color: #fbbf24;
    background: rgba(251, 191, 36, 0.12);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.25);
  }

  .qty-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ec4899;
    color: white;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid white;
  }

  .inventory-tile-image {
    width: 32px;
    height: 32px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .catalog-tile-image {
    width: 36px;
    height: 36px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .catalog-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 4px;
  }

  /* Glassmorphic Catalog Rows */
  .catalog-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .catalog-row:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(251, 191, 36, 0.5);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
    transform: translateY(-1px);
  }

  .catalog-row.selected {
    border-color: #fbbf24;
    background: rgba(251, 191, 36, 0.12);
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.25);
  }

  .buy-badge-btn {
    border: none;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    transition: all 0.15s;
  }

  .buy-badge-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(16, 185, 129, 0.3);
  }

  .buy-badge-btn:disabled {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
    box-shadow: none;
  }

  /* Catalog pill info badges styling */
  .pill-badge-container {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  .pill-badge {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 9999px;
    letter-spacing: 0.3px;
    display: inline-flex;
    align-items: center;
  }

  .cost-badge {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.25);
  }

  .owned-badge {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  /* Interactive Placed Tooltips / Banner */
  .active-tool-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 12px;
    padding: 10px 16px;
    margin-bottom: 16px;
    width: 100%;
    max-width: 480px;
    box-sizing: border-box;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    font-size: 0.85rem;
    transition: all 0.3s ease;
  }

  .active-tool-banner.place-mode {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(29, 78, 216, 0.2));
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #93c5fd;
  }

  .active-tool-banner.plant-mode {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #a7f3d0;
  }

  .active-tool-banner.bulldozer-mode {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.2));
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }

  .active-tool-banner.inactive {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
    box-shadow: none;
  }

  .banner-icon {
    font-size: 1.1rem;
    display: flex;
    align-items: center;
  }

  .banner-text {
    flex: 1;
    text-align: left;
  }

  .banner-close-btn {
    background: transparent;
    border: none;
    color: currentColor;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  .banner-close-btn:hover {
    opacity: 1;
  }

  .goods-list {
    flex: 1;
    overflow-y: auto;
    padding-right: 2px;
  }

  .goods-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .goods-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .goods-emoji {
    font-size: 1.8rem;
  }

  .goods-card-name {
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
  }

  .goods-card-qty {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .sell-all-btn {
    border: none;
    background: linear-gradient(135deg, #d4af37, #aa7c11);
    color: white;
    font-weight: bold;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
  }

  .sell-all-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  }

  .sell-all-btn:active {
    transform: translateY(1px);
  }

  .market-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .market-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 10px 12px;
  }

  .sell-one-btn {
    border: none;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    font-size: 0.72rem;
    font-weight: bold;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
    transition: all 0.15s;
  }

  .sell-one-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
  }

  .sell-one-btn:disabled {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.25);
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
