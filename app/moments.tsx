import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble from '../components/MessageBubble';
import Colors, { getColorsForMood } from '../constants/colors';
import { useChat } from '../contexts/ChatContext';

export default function MomentsScreen() {
  const { messages, userMemory, currentMood } = useChat();

  const savedMomentMessages = useMemo(() => {
    if (!messages || !userMemory) return [];
    return messages.filter(msg => userMemory.savedMoments?.includes(msg.id));
  }, [messages, userMemory]);

  const moodColors = getColorsForMood(currentMood || 'caring');

  const renderMoment = ({ item, index }: { item: typeof messages[0]; index: number }) => {
    return (
      <View style={styles.momentCard}>
        <View style={styles.momentHeader}>
          <Sparkles size={16} color={moodColors.accent} />
          <Text style={styles.momentDate}>
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <MessageBubble message={item} isLatest={false} />
      </View>
    );
  };

  return (
    <View style={styles.backgroundWrapper}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={[moodColors.gradientStart, moodColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <Heart size={24} color={moodColors.accent} fill={moodColors.accent} />
          <Text style={styles.headerTitle}>Shared Moments</Text>
          <View style={styles.backButton} />
        </View>

        {savedMomentMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={48} color={moodColors.accent} />
            <Text style={styles.emptyTitle}>No moments saved yet</Text>
            <Text style={styles.emptyDescription}>
              Long press on any message to save it as a special moment you can revisit anytime 💜
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedMomentMessages}
            renderItem={renderMoment}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.momentsList}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {savedMomentMessages.length} {savedMomentMessages.length === 1 ? 'moment' : 'moments'} saved
                </Text>
              </View>
            }
          />
        )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  momentsList: {
    paddingVertical: 16,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listHeaderText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600' as const,
  },
  momentCard: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  momentDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600' as const,
  },
});
