// Haptic feedback utilities for gamification
// Uses the Vibration API where supported

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' | 'impact';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20, 50, 30],
  error: [50, 30, 50],
  selection: 5,
  impact: [15, 10, 25],
};

export const triggerHaptic = (pattern: HapticPattern = 'light'): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(patterns[pattern]);
    } catch (e) {
      // Silently fail if vibration not supported
    }
  }
};

// Convenience exports
export const hapticLight = () => triggerHaptic('light');
export const hapticMedium = () => triggerHaptic('medium');
export const hapticHeavy = () => triggerHaptic('heavy');
export const hapticSuccess = () => triggerHaptic('success');
export const hapticError = () => triggerHaptic('error');
export const hapticSelection = () => triggerHaptic('selection');
export const hapticImpact = () => triggerHaptic('impact');
