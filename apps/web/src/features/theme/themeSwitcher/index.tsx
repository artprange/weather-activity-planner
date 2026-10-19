import { useEffect, useId, useState } from 'react';

import { SunMoon } from 'lucide-react';

import {
  ThemeConstants,
  ThemeLabels,
  applyTheme,
  parseThemePreference,
  readThemePreference,
  saveThemePreference,
} from '@/features/theme/theme';
import { ThemePreferenceEnum } from '@/features/theme/theme.types';

function ThemeSwitcher() {
  const selectId = useId();
  const [preference, setPreference] = useState(readThemePreference);

  useEffect(() => {
    applyTheme(preference);

    const media = window.matchMedia(ThemeConstants.MEDIA_QUERY);

    function handleSystemChange() {
      applyTheme(preference);
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key === ThemeConstants.STORAGE_KEY || event.key === null) {
        setPreference(readThemePreference());
      }
    }

    media.addEventListener('change', handleSystemChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      media.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [preference]);

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={selectId}
        className="flex items-center gap-2 text-sm font-medium"
      >
        <SunMoon aria-hidden="true" className="size-4" />
        Theme
      </label>

      <select
        id={selectId}
        name="theme"
        value={preference}
        onChange={(event) => {
          const nextPreference = parseThemePreference(event.target.value);

          applyTheme(nextPreference);
          setPreference(nextPreference);
          saveThemePreference(nextPreference);
        }}
        className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {Object.values(ThemePreferenceEnum).map((value) => (
          <option key={value} value={value}>
            {ThemeLabels[value]}
          </option>
        ))}
      </select>
    </div>
  );
}

export { ThemeSwitcher };
