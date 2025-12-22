import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AvatarType = "monkey" | "robot" | "alien" | "dragon" | "owl" | "cat";
export type TTSEngine = "proxy" | "webspeech";

interface AppSettings {
  darkMode: boolean;
  kidsMode: boolean;
  avatar: AvatarType;
  /**
   * proxy: uses the backend Google TTS proxy (most reliable)
   * webspeech: uses browser SpeechSynthesis voices (user-selectable)
   */
  ttsEngine: TTSEngine;
  /** Only used for webspeech */
  ttsVoiceURI: string | null;
}

interface AppSettingsContextType {
  settings: AppSettings;
  setDarkMode: (enabled: boolean) => void;
  setKidsMode: (enabled: boolean) => void;
  setAvatar: (avatar: AvatarType) => void;
  setTTSEngine: (engine: TTSEngine) => void;
  setTTSVoiceURI: (voiceURI: string | null) => void;
  toggleDarkMode: () => void;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  kidsMode: false,
  avatar: "monkey",
  ttsEngine: "proxy",
  ttsVoiceURI: null,
};

const kidsSettings: Partial<AppSettings> = {
  avatar: "cat",
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("doublango-settings");
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }

    // Check system preference for dark mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return { ...defaultSettings, darkMode: prefersDark };
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  // Apply kids mode class to document
  useEffect(() => {
    if (settings.kidsMode) {
      document.documentElement.classList.add("kids-mode");
    } else {
      document.documentElement.classList.remove("kids-mode");
    }
  }, [settings.kidsMode]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("doublango-settings", JSON.stringify(settings));
  }, [settings]);

  const setDarkMode = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, darkMode: enabled }));
  };

  const setKidsMode = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      kidsMode: enabled,
      // When enabling kids mode, apply kids-friendly defaults
      ...(enabled ? kidsSettings : {}),
    }));
  };

  const setAvatar = (avatar: AvatarType) => {
    setSettings((prev) => ({ ...prev, avatar }));
  };

  const setTTSEngine = (engine: TTSEngine) => {
    setSettings((prev) => ({ ...prev, ttsEngine: engine }));
  };

  const setTTSVoiceURI = (voiceURI: string | null) => {
    setSettings((prev) => ({ ...prev, ttsVoiceURI: voiceURI }));
  };

  const toggleDarkMode = () => {
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        setDarkMode,
        setKidsMode,
        setAvatar,
        setTTSEngine,
        setTTSVoiceURI,
        toggleDarkMode,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
};
