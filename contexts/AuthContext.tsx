import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';

export type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  avatarEmoji: string;
  createdAt: number;
  preferences: {
    notifications: boolean;
    soundEffects: boolean;
    hapticFeedback: boolean;
  };
};

const STORAGE_KEYS = {
  USER_PROFILE: 'oviya_user_profile',
  ONBOARDING_COMPLETED: 'oviya_onboarding_completed',
};

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  avatarEmoji: '😊',
  createdAt: Date.now(),
  preferences: {
    notifications: true,
    soundEffects: true,
    hapticFeedback: true,
  },
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [storedProfile, onboardingStatus] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
      ]);

      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      } else {
        const newProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          id: `user_${Date.now()}`,
          createdAt: Date.now(),
        };
        setUserProfile(newProfile);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(newProfile)
        );
      }

      setHasCompletedOnboarding(onboardingStatus === 'true');

      if (onboardingStatus !== 'true') {
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!userProfile) return;

      const updated = { ...userProfile, ...updates };
      setUserProfile(updated);

      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    },
    [userProfile]
  );

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        'oviya_messages',
        'oviya_memory',
        'oviya_mood',
      ]);
      setUserProfile(null);
      setHasCompletedOnboarding(false);
      router.replace('/onboarding');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return {
    userProfile,
    isLoading,
    hasCompletedOnboarding,
    updateProfile,
    completeOnboarding,
    logout,
  };
});
