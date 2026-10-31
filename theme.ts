export type Theme = {
  id: string;
  name: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  accentDark: string;
  bg: string;
  surface: string;
  surfaceDeep: string;
  surfaceHover: string;
  border: string;
  borderHover: string;
  text: string;
  textMuted: string;
  textDim: string;
};

export const themes: Theme[] = [
  {
    id: 'mint', name: 'Мята',
    accent: '#a8e6ca', accentSoft: '#9fe5c2', accentGlow: '#8de4bc29', accentDark: '#102019',
    bg: '#0d1117', surface: '#141d22', surfaceDeep: '#0d1419', surfaceHover: '#19252a',
    border: '#26343b', borderHover: '#608473',
    text: '#eff4f2', textMuted: '#788a8c', textDim: '#657476',
  },
  {
    id: 'ocean', name: 'Океан',
    accent: '#84c6ef', accentSoft: '#7cb8e8', accentGlow: '#6ba8df29', accentDark: '#0a1929',
    bg: '#0a1220', surface: '#121e2e', surfaceDeep: '#08111e', surfaceHover: '#18243a',
    border: '#1e3048', borderHover: '#3a6a98',
    text: '#e8f1fa', textMuted: '#6a82a0', textDim: '#5a6e88',
  },
  {
    id: 'sunset', name: 'Закат',
    accent: '#f7ae73', accentSoft: '#f0a060', accentGlow: '#e89a5029', accentDark: '#291608',
    bg: '#120d0a', surface: '#1d1611', surfaceDeep: '#120d09', surfaceHover: '#25201a',
    border: '#3a2a1e', borderHover: '#8a5a38',
    text: '#fdf0e4', textMuted: '#9a8270', textDim: '#7a6450',
  },
  {
    id: 'forest', name: 'Лес',
    accent: '#9de4bf', accentSoft: '#8ad4a8', accentGlow: '#7ac89829', accentDark: '#0a2014',
    bg: '#0a120e', surface: '#112019', surfaceDeep: '#081410', surfaceHover: '#182820',
    border: '#1c3a2c', borderHover: '#4a8868',
    text: '#e8f4ea', textMuted: '#6a8a78', textDim: '#5a7868',
  },
  {
    id: 'rose', name: 'Роза',
    accent: '#f09eb6', accentSoft: '#e88aa8', accentGlow: '#df789829', accentDark: '#290a18',
    bg: '#120a12', surface: '#1c1119', surfaceDeep: '#120a10', surfaceHover: '#241820',
    border: '#382030', borderHover: '#884868',
    text: '#fae8f0', textMuted: '#9a7088', textDim: '#7a5868',
  },
  {
    id: 'amber', name: 'Янтарь',
    accent: '#e8d180', accentSoft: '#dcc068', accentGlow: '#d0b05029', accentDark: '#292008',
    bg: '#100e08', surface: '#1c180e', surfaceDeep: '#0e0c06', surfaceHover: '#24201a',
    border: '#3a3018', borderHover: '#887838',
    text: '#faf4e0', textMuted: '#9a8868', textDim: '#7a6850',
  },
  {
    id: 'light', name: 'Светлый',
    accent: '#0d9e6f', accentSoft: '#0d9e6f', accentGlow: '#0d9e6f18', accentDark: '#ffffff',
    bg: '#f5f7f6', surface: '#ffffff', surfaceDeep: '#eef2f0', surfaceHover: '#f0f5f3',
    border: '#dde4e0', borderHover: '#0d9e6f',
    text: '#1a2820', textMuted: '#5a6e64', textDim: '#788a82',
  },
];

const THEME_KEY = 'fintrack-theme';

export const getTheme = (): Theme => {
  try {
    const id = localStorage.getItem(THEME_KEY) || 'mint';
    return themes.find((t) => t.id === id) ?? themes[0];
  } catch {
    return themes[0];
  }
};

export const saveTheme = (theme: Theme): void => {
  localStorage.setItem(THEME_KEY, theme.id);
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-soft', theme.accentSoft);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  root.style.setProperty('--accent-dark', theme.accentDark);
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--surface-deep', theme.surfaceDeep);
  root.style.setProperty('--surface-hover', theme.surfaceHover);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--border-hover', theme.borderHover);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--text-dim', theme.textDim);
};
