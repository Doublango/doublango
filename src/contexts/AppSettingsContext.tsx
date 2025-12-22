import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AvatarType = 'monkey' | 'robot' | 'alien' | 'dragon' | 'owl' | 'cat';

interface AppSettings {
  darkMode: boolean;
  kidsMode: boolean;
  avatar: AvatarType;
}

interface AppSettingsContextType {
  settings: AppSettings;
  setDarkMode: (enabled: boolean) => void;
  setKidsMode: (enabled: boolean) => void;
  setAvatar: (avatar: AvatarType) => void;
  toggleDarkMode: () => void;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  kidsMode: false,
  avatar: 'monkey',
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('doublango-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { ...defaultSettings, darkMode: prefersDark };
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('doublango-settings', JSON.stringify(settings));
  }, [settings]);

  const setDarkMode = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, darkMode: enabled }));
  };

  const setKidsMode = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, kidsMode: enabled }));
  };

  const setAvatar = (avatar: AvatarType) => {
    setSettings(prev => ({ ...prev, avatar }));
  };

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, setDarkMode, setKidsMode, setAvatar, toggleDarkMode }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
