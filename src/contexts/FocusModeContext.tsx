import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { FocusModeNotifications, canUseNotifications, sendNotification } from "@/lib/notifications";

export interface FocusSchedule {
  enabled: boolean;
  days: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  startTime: string; // "09:00"
  endTime: string; // "21:00"
}

export interface FocusSettings {
  enabled: boolean;
  xpGoal: number; // XP needed to "unlock" a break
  breakDuration: number; // Minutes allowed for break
  reminderInterval: number; // Minutes between reminders
  schedule: FocusSchedule;
  distractingApps: string[]; // List of app names user wants to limit
}

interface FocusSession {
  isActive: boolean;
  startedAt: Date | null;
  xpAtStart: number;
  xpEarned: number;
  isOnBreak: boolean;
  breakStartedAt: Date | null;
}

interface FocusModeContextType {
  settings: FocusSettings;
  session: FocusSession;
  updateSettings: (settings: Partial<FocusSettings>) => void;
  startFocusSession: (currentXp: number) => void;
  endFocusSession: () => void;
  recordXpEarned: (xp: number) => void;
  takeBreak: () => void;
  endBreak: () => void;
  isGoalReached: boolean;
  xpRemaining: number;
  focusTimeElapsed: number; // in seconds
  breakTimeRemaining: number; // in seconds
  isWithinSchedule: boolean;
}

const defaultSettings: FocusSettings = {
  enabled: false,
  xpGoal: 50,
  breakDuration: 10,
  reminderInterval: 15,
  schedule: {
    enabled: false,
    days: [false, true, true, true, true, true, false], // Mon-Fri
    startTime: "09:00",
    endTime: "21:00",
  },
  distractingApps: [],
};

const defaultSession: FocusSession = {
  isActive: false,
  startedAt: null,
  xpAtStart: 0,
  xpEarned: 0,
  isOnBreak: false,
  breakStartedAt: null,
};

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

const STORAGE_KEY = "doublango-focus-settings";
const SESSION_KEY = "doublango-focus-session";

export const FocusModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<FocusSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [session, setSession] = useState<FocusSession>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSession,
          ...parsed,
          startedAt: parsed.startedAt ? new Date(parsed.startedAt) : null,
          breakStartedAt: parsed.breakStartedAt ? new Date(parsed.breakStartedAt) : null,
        };
      } catch {
        return defaultSession;
      }
    }
    return defaultSession;
  });

  const [focusTimeElapsed, setFocusTimeElapsed] = useState(0);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Persist session
  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  // Timer for focus time elapsed
  useEffect(() => {
    if (!session.isActive || session.isOnBreak || !session.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.startedAt!.getTime()) / 1000);
      setFocusTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isActive, session.isOnBreak, session.startedAt]);

  // Timer for break countdown
  useEffect(() => {
    if (!session.isOnBreak || !session.breakStartedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.breakStartedAt!.getTime()) / 1000);
      const remaining = settings.breakDuration * 60 - elapsed;
      setBreakTimeRemaining(Math.max(0, remaining));

      // Break ended
      if (remaining <= 0) {
        const minutesAway = Math.floor(elapsed / 60);
        FocusModeNotifications.breakTimeOver(minutesAway);
        endBreak();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isOnBreak, session.breakStartedAt, settings.breakDuration]);

  // Reminder notifications
  useEffect(() => {
    if (!settings.enabled || !session.isActive || session.isOnBreak) return;
    if (!canUseNotifications()) return;

    const interval = setInterval(() => {
      if (session.xpEarned < settings.xpGoal) {
        FocusModeNotifications.reminderToStudy();
      }
    }, settings.reminderInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.reminderInterval, settings.xpGoal, session.isActive, session.isOnBreak, session.xpEarned]);

  // Schedule checker
  const isWithinSchedule = useCallback(() => {
    if (!settings.schedule.enabled) return true;

    const now = new Date();
    const dayIndex = now.getDay();
    
    if (!settings.schedule.days[dayIndex]) return false;

    const [startHour, startMin] = settings.schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = settings.schedule.endTime.split(':').map(Number);
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }, [settings.schedule]);

  // Scheduled study time notifications
  useEffect(() => {
    if (!settings.enabled || !settings.schedule.enabled) return;
    if (!canUseNotifications()) return;

    const checkSchedule = () => {
      const now = new Date();
      const dayIndex = now.getDay();
      
      if (!settings.schedule.days[dayIndex]) return;

      const [startHour, startMin] = settings.schedule.startTime.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      // Notify at start time (within 1 minute window)
      if (currentHour === startHour && currentMin === startMin) {
        FocusModeNotifications.scheduledStudyTime();
      }
    };

    const interval = setInterval(checkSchedule, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.enabled, settings.schedule]);

  const updateSettings = useCallback((newSettings: Partial<FocusSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const startFocusSession = useCallback((currentXp: number) => {
    setSession({
      isActive: true,
      startedAt: new Date(),
      xpAtStart: currentXp,
      xpEarned: 0,
      isOnBreak: false,
      breakStartedAt: null,
    });
    setFocusTimeElapsed(0);
    FocusModeNotifications.sessionStart(settings.xpGoal);
  }, [settings.xpGoal]);

  const endFocusSession = useCallback(() => {
    setSession(defaultSession);
    setFocusTimeElapsed(0);
    setBreakTimeRemaining(0);
  }, []);

  const recordXpEarned = useCallback((xp: number) => {
    setSession((prev) => {
      const newXpEarned = prev.xpEarned + xp;
      
      // Check for goal completion
      if (prev.xpEarned < settings.xpGoal && newXpEarned >= settings.xpGoal) {
        FocusModeNotifications.sessionComplete(newXpEarned);
      }
      // Check for milestones (every 25% of goal)
      else if (settings.xpGoal > 0) {
        const prevPercent = Math.floor((prev.xpEarned / settings.xpGoal) * 4);
        const newPercent = Math.floor((newXpEarned / settings.xpGoal) * 4);
        if (newPercent > prevPercent && newPercent < 4) {
          const remaining = settings.xpGoal - newXpEarned;
          FocusModeNotifications.xpMilestone(newXpEarned, remaining);
        }
      }

      return { ...prev, xpEarned: newXpEarned };
    });
  }, [settings.xpGoal]);

  const takeBreak = useCallback(() => {
    if (session.xpEarned < settings.xpGoal) {
      sendNotification({
        title: "⚠️ Goal Not Reached Yet",
        body: `Earn ${settings.xpGoal - session.xpEarned} more XP to unlock your break!`,
        tag: "focus-warning",
      });
      return;
    }

    setSession((prev) => ({
      ...prev,
      isOnBreak: true,
      breakStartedAt: new Date(),
    }));
    setBreakTimeRemaining(settings.breakDuration * 60);
  }, [session.xpEarned, settings.xpGoal, settings.breakDuration]);

  const endBreak = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isOnBreak: false,
      breakStartedAt: null,
      xpEarned: 0, // Reset XP for next focus cycle
    }));
    setBreakTimeRemaining(0);
  }, []);

  const isGoalReached = session.xpEarned >= settings.xpGoal;
  const xpRemaining = Math.max(0, settings.xpGoal - session.xpEarned);

  return (
    <FocusModeContext.Provider
      value={{
        settings,
        session,
        updateSettings,
        startFocusSession,
        endFocusSession,
        recordXpEarned,
        takeBreak,
        endBreak,
        isGoalReached,
        xpRemaining,
        focusTimeElapsed,
        breakTimeRemaining,
        isWithinSchedule: isWithinSchedule(),
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within a FocusModeProvider");
  }
  return context;
};
