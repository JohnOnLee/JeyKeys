// JeyKeys City Builder Catalog and Configurations

export const CITY_ITEMS = [
  // Infrastructure
  { id: 'tile_0012', name: 'Horizontal Road', price: 10, type: 'road', emoji: '🛣️' },
  { id: 'tile_0013', name: 'Vertical Road', price: 10, type: 'road', emoji: '🛣️' },
  { id: 'tile_0014', name: 'Crossroad', price: 15, type: 'road', emoji: '🛣️' },
  { id: 'tile_0036', name: 'Water Pond', price: 30, type: 'water', emoji: '🌊' },

  // Nature
  { id: 'tile_0018', name: 'Pine Tree', price: 20, type: 'nature', emoji: '🌲' },
  { id: 'tile_0019', name: 'Oak Tree', price: 20, type: 'nature', emoji: '🌳' },
  { id: 'tile_0007', name: 'Flower Patch', price: 15, type: 'nature', emoji: '🌸' },

  // Structures
  { id: 'tile_0048', name: 'Red House', price: 100, type: 'building', pop: 5, emoji: '🏡' },
  { id: 'tile_0049', name: 'Blue House', price: 100, type: 'building', pop: 5, emoji: '🏠' },
  { id: 'tile_0051', name: 'Yellow Shop', price: 150, type: 'building', pop: 10, emoji: '🏪' },
  { id: 'tile_0055', name: 'School', price: 200, type: 'building', pop: 20, emoji: '🏫' },
  { id: 'tile_0060', name: 'Windmill', price: 250, type: 'building', pop: 15, emoji: '⚙️' },
  { id: 'tile_0070', name: 'Skyscraper', price: 400, type: 'building', pop: 60, emoji: '🏢' },
  { id: 'tile_0066', name: 'Royal Castle', price: 600, type: 'building', pop: 120, emoji: '🏰' }
];

// Helper to get city item by ID
export function getCityItemById(id) {
  return CITY_ITEMS.find(item => item.id === id);
}

// Keep standard animal avatar asset resolver for the profile builder compatibility
export function getAvatarAsset(emoji) {
  return getTwemojiUrl(emoji);
}

// Keep Twemoji SVG URL helper for standard emojis compatibility
export function getTwemojiUrl(emoji) {
  if (!emoji) return '';
  const filename = Array.from(emoji)
    .map(c => c.codePointAt(0).toString(16))
    .join('-');
  return `https://cdn.jsdelivr.net/npm/@twemoji/svg@latest/${filename}.svg`;
}
