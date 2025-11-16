import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

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

  const createAnonymousUser = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error || !data.user) {
        console.error('Failed to create anonymous user:', error);
        return;
      }

      const newProfile: UserProfile = {
        id: data.user.id,
        avatarEmoji: '😊',
        createdAt: Date.now(),
        preferences: {
          notifications: true,
          soundEffects: true,
          hapticFeedback: true,
        },
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          avatar_emoji: newProfile.avatarEmoji,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferences: newProfile.preferences,
          onboarding_completed: false,
        });

      if (insertError) {
        console.error('Failed to insert user:', insertError);
      } else {
        setUserProfile(newProfile);
        setHasCompletedOnboarding(false);
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Failed to create anonymous user:', error);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Failed to fetch user data:', error);
          await createAnonymousUser();
        } else if (userData) {
          setUserProfile({
            id: userData.id,
            name: userData.name || undefined,
            email: userData.email || undefined,
            avatarEmoji: userData.avatar_emoji,
            createdAt: new Date(userData.created_at).getTime(),
            preferences: userData.preferences as UserProfile['preferences'],
          });
          setHasCompletedOnboarding(userData.onboarding_completed);

          if (!userData.onboarding_completed) {
            router.replace('/onboarding');
          }
        }
      } else {
        await createAnonymousUser();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await createAnonymousUser();
    } finally {
      setIsLoading(false);
    }
  }, [createAnonymousUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);



  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!userProfile) return;

      const updated = { ...userProfile, ...updates };
      setUserProfile(updated);

      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: updated.name || null,
            email: updated.email || null,
            avatar_emoji: updated.avatarEmoji,
            preferences: updated.preferences,
          })
          .eq('id', userProfile.id);

        if (error) {
          console.error('Failed to update profile:', error);
        }
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    },
    [userProfile]
  );

  const completeOnboarding = useCallback(async () => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Failed to complete onboarding:', error);
      } else {
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, [userProfile]);

  const logout = useCallback(async () => {
    try {
      if (userProfile) {
        await supabase.from('messages').delete().eq('user_id', userProfile.id);
        await supabase.from('user_memory').delete().eq('user_id', userProfile.id);
        await supabase.from('detected_strengths').delete().eq('user_id', userProfile.id);
        await supabase.from('users').delete().eq('id', userProfile.id);
      }

      await supabase.auth.signOut();
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
