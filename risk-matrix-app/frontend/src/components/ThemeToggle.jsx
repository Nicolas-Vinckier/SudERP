export default function ThemeToggle({ isLightTheme, onToggle }) {
  const nextThemeLabel = isLightTheme ? 'sombre' : 'clair';
  const currentThemeLabel = isLightTheme ? 'Clair' : 'Sombre';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={isLightTheme}
      aria-label={`Activer le theme ${nextThemeLabel}`}
      title={`Activer le theme ${nextThemeLabel}`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-knob" />
      </span>
      <span className="theme-toggle-text">Theme {currentThemeLabel}</span>
    </button>
  );
}
