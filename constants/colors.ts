import type { OviyaMood } from '../contexts/ChatContext';

export const MOOD_THEMES = {
  playful: {
    gradientStart: '#FFC8DD',
    gradientMid: '#FFD6E8',
    gradientEnd: '#F7E8F3',
    accent: '#FF6B9D',
    accentLight: 'rgba(255, 107, 157, 0.1)',
    cardGradientStart: 'rgba(255, 200, 221, 0.4)',
    cardGradientEnd: 'rgba(247, 232, 243, 0.4)',
  },
  reflective: {
    gradientStart: '#D4A5FF',
    gradientMid: '#E8D5FF',
    gradientEnd: '#F3E5F5',
    accent: '#9C27B0',
    accentLight: 'rgba(156, 39, 176, 0.1)',
    cardGradientStart: 'rgba(212, 165, 255, 0.4)',
    cardGradientEnd: 'rgba(243, 229, 245, 0.4)',
  },
  energetic: {
    gradientStart: '#FFA76C',
    gradientMid: '#FFD0A0',
    gradientEnd: '#FFF3E8',
    accent: '#FF9800',
    accentLight: 'rgba(255, 152, 0, 0.1)',
    cardGradientStart: 'rgba(255, 167, 108, 0.4)',
    cardGradientEnd: 'rgba(255, 243, 232, 0.4)',
  },
  cozy: {
    gradientStart: '#FFB4D0',
    gradientMid: '#FFD4E5',
    gradientEnd: '#FCE4EC',
    accent: '#E91E63',
    accentLight: 'rgba(233, 30, 99, 0.1)',
    cardGradientStart: 'rgba(255, 180, 208, 0.4)',
    cardGradientEnd: 'rgba(252, 228, 236, 0.4)',
  },
  caring: {
    gradientStart: '#D4C5F9',
    gradientMid: '#F5E6FF',
    gradientEnd: '#FFF5FC',
    accent: '#A78BFA',
    accentLight: 'rgba(167, 139, 250, 0.1)',
    cardGradientStart: 'rgba(212, 197, 249, 0.4)',
    cardGradientEnd: 'rgba(255, 245, 252, 0.4)',
  },
};

export function getColorsForMood(mood: OviyaMood) {
  return MOOD_THEMES[mood];
}

export default {
  light: {
    background: '#F8F5F2',
    cardBg: 'rgba(255, 255, 255, 0.7)',
    glassCard: 'rgba(255, 255, 255, 0.5)',
    text: '#2C2C2C',
    textSecondary: '#8B8B8B',
    accent: '#FF6B9D',
    accentLight: 'rgba(255, 107, 157, 0.1)',
    border: 'rgba(0, 0, 0, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
};
