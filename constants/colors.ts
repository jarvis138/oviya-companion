import type { OviyaMood } from '../contexts/ChatContext';

export const MOOD_THEMES = {
  playful: {
    gradientStart: '#FFF5E1',
    gradientEnd: '#FFE4E1',
    accent: '#FF6B9D',
    accentLight: '#FFE5EF',
    oviyaBubble: '#FFF9E6',
  },
  reflective: {
    gradientStart: '#E8EAF6',
    gradientEnd: '#F3E5F5',
    accent: '#9C27B0',
    accentLight: '#E1BEE7',
    oviyaBubble: '#F3E5F5',
  },
  energetic: {
    gradientStart: '#FFF9C4',
    gradientEnd: '#FFECB3',
    accent: '#FF9800',
    accentLight: '#FFE0B2',
    oviyaBubble: '#FFF8E1',
  },
  cozy: {
    gradientStart: '#FFEBEE',
    gradientEnd: '#FCE4EC',
    accent: '#E91E63',
    accentLight: '#F8BBD0',
    oviyaBubble: '#FCE4EC',
  },
  caring: {
    gradientStart: '#FFE5ED',
    gradientEnd: '#FFF9F5',
    accent: '#FF6B9D',
    accentLight: '#FFE5ED',
    oviyaBubble: '#FFF0F6',
  },
};

export function getColorsForMood(mood: OviyaMood) {
  return {
    background: '#FFF9F5',
    cardBg: '#FFFFFF',
    text: '#2C1810',
    textSecondary: '#8B7355',
    userBubble: '#4A90E2',
    border: '#F5E6DC',
    ...MOOD_THEMES[mood],
  };
}

export default {
  light: {
    background: '#FFF9F5',
    cardBg: '#FFFFFF',
    text: '#2C1810',
    textSecondary: '#8B7355',
    accent: '#FF6B9D',
    accentLight: '#FFE5ED',
    oviyaBubble: '#FFF0F6',
    userBubble: '#4A90E2',
    border: '#F5E6DC',
    gradientStart: '#FFE5ED',
    gradientEnd: '#FFF9F5',
    
    moodPlayful: '#FFB7D5',
    moodReflective: '#A8B5FF',
    moodEnergetic: '#FFD93D',
    moodCozy: '#FFD4B8',
  },
};
