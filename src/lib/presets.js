// Theme Presets and Keyboard Layout Configurations

export const themes = {
  forest: {
    name: 'Forest',
    primary: '#22c55e',
    secondary: '#10b981',
    accent: '#a3e635',
    bgStart: '#065f46',
    bgEnd: '#022c22'
  },
  ocean: {
    name: 'Ocean',
    primary: '#3b82f6',
    secondary: '#2563eb',
    accent: '#67e8f9',
    bgStart: '#1e3a5f',
    bgEnd: '#0c1929'
  },
  galaxy: {
    name: 'Galaxy',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#c4b5fd',
    bgStart: '#3b1f6e',
    bgEnd: '#1a0a3e'
  },
  lava: {
    name: 'Lava',
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#fca5a5',
    bgStart: '#7f1d1d',
    bgEnd: '#3b0d0d'
  },
  sunset: {
    name: 'Sunset',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#fde68a',
    bgStart: '#7c2d12',
    bgEnd: '#3b1106'
  },
  candy: {
    name: 'Candy',
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#f9a8d4',
    bgStart: '#701a48',
    bgEnd: '#3b0d26'
  }
};

// Keyboard layouts: [key, code, classes, hand]
export const keyLayout = [
  [
    ["`", "Backquote", "f-pinky", "L"],
    ["1", "Digit1", "f-pinky", "L"],
    ["2", "Digit2", "f-ring", "L"],
    ["3", "Digit3", "f-middle", "L"],
    ["4", "Digit4", "f-index", "L"],
    ["5", "Digit5", "f-index", "L"],
    ["6", "Digit6", "f-index", "R"],
    ["7", "Digit7", "f-index", "R"],
    ["8", "Digit8", "f-middle", "R"],
    ["9", "Digit9", "f-ring", "R"],
    ["0", "Digit0", "f-pinky", "R"],
    ["-", "Minus", "f-pinky", "R"],
    ["=", "Equal", "f-pinky", "R"],
    ["Backspace", "Backspace", "k-back f-pinky", "R"]
  ],
  [
    ["Tab", "Tab", "k-tab f-pinky", "L"],
    ["Q", "KeyQ", "f-pinky", "L"],
    ["W", "KeyW", "f-ring", "L"],
    ["E", "KeyE", "f-middle", "L"],
    ["R", "KeyR", "f-index", "L"],
    ["T", "KeyT", "f-index", "L"],
    ["Y", "KeyY", "f-index", "R"],
    ["U", "KeyU", "f-index", "R"],
    ["I", "KeyI", "f-middle", "R"],
    ["O", "KeyO", "f-ring", "R"],
    ["P", "KeyP", "f-pinky", "R"],
    ["[", "BracketLeft", "f-pinky", "R"],
    ["]", "BracketRight", "f-pinky", "R"],
    ["\\", "Backslash", "f-pinky", "R"]
  ],
  [
    ["Caps", "CapsLock", "k-caps f-pinky", "L"],
    ["A", "KeyA", "f-pinky", "L"],
    ["S", "KeyS", "f-ring", "L"],
    ["D", "KeyD", "f-middle", "L"],
    ["F", "KeyF", "f-index", "L"],
    ["G", "KeyG", "f-index", "L"],
    ["H", "KeyH", "f-index", "R"],
    ["J", "KeyJ", "f-index", "R"],
    ["K", "KeyK", "f-middle", "R"],
    ["L", "KeyL", "f-ring", "R"],
    [";", "Semicolon", "f-pinky", "R"],
    ["'", "Quote", "f-pinky", "R"],
    ["Enter", "Enter", "k-enter f-pinky", "R"]
  ],
  [
    ["Shift", "ShiftLeft", "k-shift f-pinky", "L"],
    ["Z", "KeyZ", "f-pinky", "L"],
    ["X", "KeyX", "f-ring", "L"],
    ["C", "KeyC", "f-middle", "L"],
    ["V", "KeyV", "f-index", "L"],
    ["B", "KeyB", "f-index", "L"],
    ["N", "KeyN", "f-index", "R"],
    ["M", "KeyM", "f-index", "R"],
    [",", "Comma", "f-middle", "R"],
    [".", "Period", "f-ring", "R"],
    ["/", "Slash", "f-pinky", "R"],
    ["Shift", "ShiftRight", "k-shift f-pinky", "R"]
  ],
  [
    ["Space", "Space", "k-space f-thumb", ""]
  ]
];
