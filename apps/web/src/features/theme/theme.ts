import { ThemePreferenceEnum } from './theme.types';

const ThemeConstants = {
  STORAGE_KEY: 'weather-activity-planner.theme',
  MEDIA_QUERY: '(prefers-color-scheme: dark)',
};

const ThemeLabels: Record<ThemePreferenceEnum, string> = {
  [ThemePreferenceEnum.SYSTEM]: 'System',
  [ThemePreferenceEnum.LIGHT]: 'Light',
  [ThemePreferenceEnum.DARK]: 'Dark',
};

function parseThemePreference(value: string | null): ThemePreferenceEnum {
  switch (value) {
    case ThemePreferenceEnum.LIGHT:
      return ThemePreferenceEnum.LIGHT;
    case ThemePreferenceEnum.DARK:
      return ThemePreferenceEnum.DARK;
    default:
      return ThemePreferenceEnum.SYSTEM;
  }
}

function readThemePreference(): ThemePreferenceEnum {
  try {
    return parseThemePreference(
      window.localStorage.getItem(ThemeConstants.STORAGE_KEY),
    );
  } catch {
    return ThemePreferenceEnum.SYSTEM;
  }
}

function saveThemePreference(preference: ThemePreferenceEnum): void {
  try {
    window.localStorage.setItem(ThemeConstants.STORAGE_KEY, preference);
  } catch {
    //failsafe
  }
}

function applyTheme(preference: ThemePreferenceEnum): void {
  const dark =
    preference === ThemePreferenceEnum.DARK ||
    (preference === ThemePreferenceEnum.SYSTEM &&
      window.matchMedia(ThemeConstants.MEDIA_QUERY).matches);

  const root = document.documentElement;

  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.dataset.themePreference = preference;
}

export {
  ThemeConstants,
  ThemeLabels,
  parseThemePreference,
  readThemePreference,
  saveThemePreference,
  applyTheme,
};
