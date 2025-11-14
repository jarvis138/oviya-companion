import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Settings as SettingsIcon, LogOut, Heart, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors, { getColorsForMood } from '../constants/colors';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const AVATAR_EMOJIS = ['😊', '🤗', '😎', '🥰', '✨', '🌸', '🌟', '💜', '🎨', '🚀', '🦄', '🌈'];

export default function ProfileScreen() {
  const { currentMood, userMemory, messages, updateMemory } = useChat();
  const { userProfile, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userProfile?.name || userMemory.name || '');

  const moodColors = getColorsForMood(currentMood || 'caring');

  useEffect(() => {
    setTempName(userProfile?.name || userMemory.name || '');
  }, [userProfile?.name, userMemory.name]);

  const handleSaveName = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const trimmedName = tempName.trim();
    console.log('[ProfileScreen] Saving display name', trimmedName);
    updateProfile({ name: trimmedName });
    updateMemory({ name: trimmedName || undefined });
    setIsEditing(false);
  };

  const handleAvatarChange = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateProfile({ avatarEmoji: emoji });
  };

  const handleLogout = () => {
    Alert.alert(
      'Reset Oviya?',
      'This will clear all your conversations, memories, and start fresh. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const daysSinceJoined = Math.floor(
    (Date.now() - (userMemory?.firstMetDate || Date.now())) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.backgroundWrapper}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[moodColors.gradientStart, moodColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <User size={24} color={moodColors.accent} />
          <Text style={styles.headerTitle}>Your Profile</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.profileCard}
          >
            <Text style={styles.avatarEmoji}>
              {userProfile?.avatarEmoji || '😊'}
            </Text>

            {isEditing ? (
              <View style={styles.nameEditContainer}>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Your name"
                  style={styles.nameInput}
                  autoFocus
                />
                <Pressable
                  onPress={handleSaveName}
                  style={[styles.saveButton, { backgroundColor: moodColors.accent }]}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={styles.name}>
                  {userProfile?.name || 'Set your name'}
                </Text>
                <Text style={styles.editHint}>Tap to edit</Text>
              </Pressable>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MessageCircle size={20} color={moodColors.accent} />
                <Text style={styles.statValue}>{messages.length}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Heart size={20} color={moodColors.accent} />
                <Text style={styles.statValue}>{daysSinceJoined}</Text>
                <Text style={styles.statLabel}>Days Together</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <SettingsIcon size={20} color={moodColors.accent} />
                <Text style={styles.statValue}>{userMemory?.savedMoments?.length || 0}</Text>
                <Text style={styles.statLabel}>Saved Moments</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleAvatarChange(emoji)}
                  style={[
                    styles.avatarOption,
                    userProfile?.avatarEmoji === emoji && {
                      backgroundColor: moodColors.accentLight,
                      borderColor: moodColors.accent,
                    },
                  ]}
                >
                  <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.preferenceCard}>
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceLeft}>
                  <Text style={styles.preferenceLabel}>Notifications</Text>
                  <Text style={styles.preferenceDescription}>
                    Get notified about care packages and letters
                  </Text>
                </View>
                <Switch
                  value={userProfile?.preferences.notifications ?? true}
                  onValueChange={(value) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    updateProfile({
                      preferences: {
                        ...userProfile!.preferences,
                        notifications: value,
                      },
                    });
                  }}
                  trackColor={{ false: Colors.light.border, true: moodColors.accentLight }}
                  thumbColor={userProfile?.preferences.notifications ? moodColors.accent : '#f4f3f4'}
                />
              </View>

              <View style={styles.preferenceDivider} />

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceLeft}>
                  <Text style={styles.preferenceLabel}>Sound Effects</Text>
                  <Text style={styles.preferenceDescription}>
                    Hear audio feedback during interactions
                  </Text>
                </View>
                <Switch
                  value={userProfile?.preferences.soundEffects ?? true}
                  onValueChange={(value) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    updateProfile({
                      preferences: {
                        ...userProfile!.preferences,
                        soundEffects: value,
                      },
                    });
                  }}
                  trackColor={{ false: Colors.light.border, true: moodColors.accentLight }}
                  thumbColor={userProfile?.preferences.soundEffects ? moodColors.accent : '#f4f3f4'}
                />
              </View>

              <View style={styles.preferenceDivider} />

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceLeft}>
                  <Text style={styles.preferenceLabel}>Haptic Feedback</Text>
                  <Text style={styles.preferenceDescription}>
                    Feel vibrations when tapping
                  </Text>
                </View>
                <Switch
                  value={userProfile?.preferences.hapticFeedback ?? true}
                  onValueChange={(value) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    updateProfile({
                      preferences: {
                        ...userProfile!.preferences,
                        hapticFeedback: value,
                      },
                    });
                  }}
                  trackColor={{ false: Colors.light.border, true: moodColors.accentLight }}
                  thumbColor={userProfile?.preferences.hapticFeedback ? moodColors.accent : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: '#E74C3C' }]}
          >
            <LogOut size={20} color="#E74C3C" />
            <Text style={styles.logoutButtonText}>Reset Everything</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  editHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  nameEditContainer: {
    width: '100%',
    marginBottom: 24,
  },
  nameInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  avatarOptionEmoji: {
    fontSize: 32,
  },
  preferenceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  preferenceLeft: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E74C3C',
  },
});
