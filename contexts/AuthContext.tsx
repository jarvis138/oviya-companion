import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    const nodeCrypto = require('crypto');
    (globalThis as any).crypto = {
      getRandomValues: (arr: Uint8Array) => nodeCrypto.randomFillSync(arr),
    };
  }
}

import { v4 as uuidv4 } from 'uuid';

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

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const createLocalUser = useCallback(async () => {
    try {
      console.log('Creating new local user...');
      
      const userId = uuidv4();
      const newProfile: UserProfile = {
        id: userId,
        avatarEmoji: '😊',
        createdAt: Date.now(),
        preferences: {
          notifications: true,
          soundEffects: true,
          hapticFeedback: true,
        },
      };

      await AsyncStorage.setItem('oviya_user_id', userId);
      await AsyncStorage.setItem('oviya_user_profile', JSON.stringify(newProfile));
      
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            avatar_emoji: newProfile.avatarEmoji,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            preferences: newProfile.preferences,
            onboarding_completed: false,
          });

        if (insertError) {
          console.error('Failed to insert user to Supabase (will continue with local):', insertError);
        } else {
          console.log('User synced to Supabase successfully');
        }
      } catch (supabaseError) {
        console.error('Supabase sync failed (continuing with local storage):', supabaseError);
      }

      setUserProfile(newProfile);
      setHasCompletedOnboarding(false);
      router.replace('/onboarding');
    } catch (error) {
      console.error('Failed to create local user:', error);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      console.log('Initializing auth...');
      
      const storedUserId = await AsyncStorage.getItem('oviya_user_id');
      const storedProfile = await AsyncStorage.getItem('oviya_user_profile');
      const onboardingCompleted = await AsyncStorage.getItem('oviya_onboarding_completed');

      if (storedUserId && storedProfile) {
        console.log('Found stored user profile');
        const profile: UserProfile = JSON.parse(storedProfile);
        setUserProfile(profile);
        setHasCompletedOnboarding(onboardingCompleted === 'true');

        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', storedUserId)
            .maybeSingle();

          if (userData) {
            console.log('Syncing profile with Supabase data');
            const syncedProfile: UserProfile = {
              id: userData.id,
              name: userData.name || undefined,
              email: userData.email || undefined,
              avatarEmoji: userData.avatar_emoji,
              createdAt: new Date(userData.created_at).getTime(),
              preferences: userData.preferences as UserProfile['preferences'],
            };
            setUserProfile(syncedProfile);
            await AsyncStorage.setItem('oviya_user_profile', JSON.stringify(syncedProfile));
            setHasCompletedOnboarding(userData.onboarding_completed);
            
            if (!userData.onboarding_completed && onboardingCompleted !== 'true') {
              router.replace('/onboarding');
            }
          } else if (error) {
            console.log('User not found in Supabase, continuing with local profile');
          }
        } catch (supabaseError) {
          console.error('Supabase sync failed (continuing with local profile):', supabaseError);
        }

        if (onboardingCompleted !== 'true') {
          router.replace('/onboarding');
        }
      } else {
        console.log('No stored user found, creating new user');
        await createLocalUser();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await createLocalUser();
    } finally {
      setIsLoading(false);
    }
  }, [createLocalUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);



  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!userProfile) return;

      const updated = { ...userProfile, ...updates };
      setUserProfile(updated);
      
      await AsyncStorage.setItem('oviya_user_profile', JSON.stringify(updated));

      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: updated.name || null,
            email: updated.email || null,
            avatar_emoji: updated.avatarEmoji,
            preferences: updated.preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userProfile.id);

        if (error) {
          console.log('Failed to sync profile update to Supabase:', error);
        }
      } catch (error) {
        console.log('Supabase sync failed (profile saved locally):', error);
      }
    },
    [userProfile]
  );

  const completeOnboarding = useCallback(async () => {
    if (!userProfile) return;

    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('oviya_onboarding_completed', 'true');

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id);

      if (error) {
        console.log('Failed to sync onboarding status to Supabase:', error);
      }
    } catch (error) {
      console.log('Supabase sync failed (onboarding saved locally):', error);
    }
  }, [userProfile]);

  const logout = useCallback(async () => {
    try {
      if (userProfile) {
        try {
          await supabase.from('messages').delete().eq('user_id', userProfile.id);
          await supabase.from('user_memory').delete().eq('user_id', userProfile.id);
          await supabase.from('detected_strengths').delete().eq('user_id', userProfile.id);
          await supabase.from('users').delete().eq('id', userProfile.id);
          console.log('User data deleted from Supabase');
        } catch (supabaseError) {
          console.log('Failed to delete Supabase data (continuing with local cleanup):', supabaseError);
        }
      }

      await AsyncStorage.removeItem('oviya_user_id');
      await AsyncStorage.removeItem('oviya_user_profile');
      await AsyncStorage.removeItem('oviya_onboarding_completed');
      
      setUserProfile(null);
      setHasCompletedOnboarding(false);
      router.replace('/onboarding');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, [userProfile]);

  return useMemo(() => ({
    userProfile,
    isLoading,
    hasCompletedOnboarding,
    updateProfile,
    completeOnboarding,
    logout,
  }), [
    userProfile,
    isLoading,
    hasCompletedOnboarding,
    updateProfile,
    completeOnboarding,
    logout,
  ]);
});
