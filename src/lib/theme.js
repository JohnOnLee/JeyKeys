import { themes } from './presets.js';

export function applyTheme(themeData) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  if (themeData.type === 'preset') {
    const theme = themes[themeData.key];
    if (theme) {
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--secondary', theme.secondary);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--bg-color', theme.bgStart);
      document.body.style.background = `radial-gradient(circle at center, ${theme.bgStart} 0%, ${theme.bgEnd} 100%)`;
    }
  } else if (themeData.type === 'custom') {
    const hex = themeData.hex;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    const hDeg = Math.round(h * 360);

    const primary = hex;
    const secondary = `hsl(${hDeg}, ${Math.round(s * 100)}%, ${Math.max(Math.round(l * 100) - 10, 15)}%)`;
    const accent = `hsl(${(hDeg + 30) % 360}, 80%, 75%)`;
    const bgStart = `hsl(${hDeg}, ${Math.round(s * 70)}%, ${Math.max(Math.round(l * 40), 10)}%)`;
    const bgEnd = `hsl(${hDeg}, ${Math.round(s * 60)}%, ${Math.max(Math.round(l * 20), 5)}%)`;

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--bg-color', bgStart);
    document.body.style.background = `radial-gradient(circle at center, ${bgStart} 0%, ${bgEnd} 100%)`;
  }
}
