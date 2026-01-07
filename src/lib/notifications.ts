/**
 * Local notifications utility for Focus Mode
 * Uses browser Notification API with fallback to toasts
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
  onClick?: () => void;
}

// Check if notifications are supported and permitted
export const canUseNotifications = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Send a local notification
export const sendNotification = (options: NotificationOptions): Notification | null => {
  if (!canUseNotifications()) {
    console.log('Notifications not available, skipping:', options.title);
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return null;
  }
};

// Schedule a notification for later
export const scheduleNotification = (
  options: NotificationOptions,
  delayMs: number
): NodeJS.Timeout => {
  return setTimeout(() => {
    sendNotification(options);
  }, delayMs);
};

// Focus Mode specific notifications
export const FocusModeNotifications = {
  sessionStart: (xpGoal: number) => sendNotification({
    title: '🎯 Focus Session Started!',
    body: `Earn ${xpGoal} XP to complete your focus goal. You've got this!`,
    tag: 'focus-start',
  }),

  sessionComplete: (xpEarned: number) => sendNotification({
    title: '🎉 Focus Goal Achieved!',
    body: `Amazing! You earned ${xpEarned} XP. Keep the momentum going?`,
    tag: 'focus-complete',
    requireInteraction: true,
  }),

  reminderToStudy: () => sendNotification({
    title: '🍌 Time to Learn!',
    body: "Your focus session is waiting. Let's earn some XP!",
    tag: 'focus-reminder',
  }),

  breakTimeOver: (minutesAway: number) => sendNotification({
    title: '⏰ Break Time Over!',
    body: `You've been away for ${minutesAway} minutes. Ready to continue learning?`,
    tag: 'focus-break',
    requireInteraction: true,
  }),

  streakReminder: (streak: number) => sendNotification({
    title: `🔥 Protect Your ${streak}-Day Streak!`,
    body: "Don't forget to practice today to keep your streak alive!",
    tag: 'streak-reminder',
  }),

  scheduledStudyTime: () => sendNotification({
    title: '📚 Scheduled Study Time!',
    body: "It's your planned learning time. Start a focus session now!",
    tag: 'scheduled-study',
    requireInteraction: true,
  }),

  xpMilestone: (xp: number, remaining: number) => sendNotification({
    title: '⭐ Great Progress!',
    body: `You've earned ${xp} XP! Just ${remaining} more to reach your goal.`,
    tag: 'xp-milestone',
  }),
};
