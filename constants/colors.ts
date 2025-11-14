import type { OviyaMood } from '../contexts/ChatContext';

export const MOOD_THEMES = {
  playful: {
    gradientStart: '#F7FAFC',
    gradientEnd: '#EDF2F7',
    accent: '#4A90E2',
    accentLight: '#E8F1FC',
    oviyaBubble: '#FFFFFF',
  },
  reflective: {
    gradientStart: '#F7FAFC',
    gradientEnd: '#E6EDFA',
    accent: '#5B7FDB',
    accentLight: '#E8EEF9',
    oviyaBubble: '#FFFFFF',
  },
  energetic: {
    gradientStart: '#F7FAFC',
    gradientEnd: '#FFF9E6',
    accent: '#3498DB',
    accentLight: '#D6EAF8',
    oviyaBubble: '#FFFFFF',
  },
  cozy: {
    gradientStart: '#F7FAFC',
    gradientEnd: '#F0F4F8',
    accent: '#4A90E2',
    accentLight: '#E8F1FC',
    oviyaBubble: '#FFFFFF',
  },
  caring: {
    gradientStart: '#F7FAFC',
    gradientEnd: '#EDF2F7',
    accent: '#4A90E2',
    accentLight: '#E8F1FC',
    oviyaBubble: '#FFFFFF',
  },
};

export function getColorsForMood(mood: OviyaMood) {
  return {
    background: '#F7FAFC',
    cardBg: '#FFFFFF',
    text: '#1A202C',
    textSecondary: '#718096',
    userBubble: '#4A90E2',
    border: '#E2E8F0',
    ...MOOD_THEMES[mood],
  };
}

export default {
  light: {
    background: '#F7FAFC',
    cardBg: '#FFFFFF',
    text: '#1A202C',
    textSecondary: '#718096',
    accent: '#4A90E2',
    accentLight: '#E8F1FC',
    oviyaBubble: '#FFFFFF',
    userBubble: '#4A90E2',
    border: '#E2E8F0',
    gradientStart: '#F7FAFC',
    gradientEnd: '#EDF2F7',
    
    moodPlayful: '#4A90E2',
    moodReflective: '#5B7FDB',
    moodEnergetic: '#3498DB',
    moodCozy: '#4A90E2',
  },
};
