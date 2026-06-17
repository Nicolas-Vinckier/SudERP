export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const THEME_STORAGE_KEY = 'sud-erp-theme';

export const isSupportedTheme = (theme) => Object.values(THEMES).includes(theme);

export const getPreferredTheme = () => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isSupportedTheme(storedTheme)) return storedTheme;

    return window.matchMedia?.('(prefers-color-scheme: light)').matches
      ? THEMES.LIGHT
      : THEMES.DARK;
  } catch {
    return THEMES.DARK;
  }
};
