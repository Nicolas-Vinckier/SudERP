import { useCallback, useEffect, useState } from 'react';
import { getPreferredTheme, THEME_STORAGE_KEY, THEMES } from '../theme/theme';

export default function useTheme() {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (
      currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    ));
  }, []);

  return {
    theme,
    isLightTheme: theme === THEMES.LIGHT,
    toggleTheme
  };
}
