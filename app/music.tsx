import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Music2, Play, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors, { getColorsForMood } from '../constants/colors';
import { useChat } from '../contexts/ChatContext';
import {
  getRecommendationHistory,
  getMusicRecommendation,
  getMoodEmoji,
  type SongRecommendation,
  type MusicMood,
} from '../services/music';

export default function MusicScreen() {
  const { currentMood, addMessage } = useChat();
  const [recommendations, setRecommendations] = useState<SongRecommendation[]>([]);
  const [selectedMood, setSelectedMood] = useState<MusicMood>('chill');
  const [highlightedRecommendation, setHighlightedRecommendation] = useState<SongRecommendation | null>(null);

  const moodColors = getColorsForMood(currentMood || 'caring');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const history = await getRecommendationHistory();
    setRecommendations(history);
    setHighlightedRecommendation(history.length > 0 ? history[0] : null);
  };

  const moods: { key: MusicMood; label: string }[] = [
    { key: 'happy', label: 'Happy' },
    { key: 'sad', label: 'Sad' },
    { key: 'energetic', label: 'Energetic' },
    { key: 'chill', label: 'Chill' },
    { key: 'romantic', label: 'Romantic' },
    { key: 'motivational', label: 'Motivational' },
    { key: 'nostalgic', label: 'Nostalgic' },
    { key: 'angry', label: 'Angry' },
    { key: 'peaceful', label: 'Peaceful' },
  ];

  const getRecommendationForMood = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    console.log('[MusicScreen] Generating recommendation for mood', selectedMood);
    const recommendation = getMusicRecommendation(selectedMood);

    setRecommendations(prev => [recommendation, ...prev.filter(item => item.id !== recommendation.id)]);
    setHighlightedRecommendation(recommendation);

    const musicMessage = {
      id: `music-${Date.now()}`,
      role: 'assistant' as const,
      parts: [
        {
          type: 'text' as const,
          text: `🎧 ${recommendation.title}\n${recommendation.artist}${recommendation.album ? ` – ${recommendation.album}` : ''}\n\n${recommendation.reason}\n\n${recommendation.youtubeUrl ? `Listen now: ${recommendation.youtubeUrl}` : ''}`,
        },
      ],
      timestamp: Date.now(),
    };

    addMessage(musicMessage);
  };

  const openLink = (url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  };

  const renderRecommendation = ({ item }: { item: SongRecommendation }) => {
    return (
      <View style={styles.songCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={styles.songCardGradient}
        >
          <View style={styles.songHeader}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood as MusicMood)}</Text>
            <View style={[styles.moodBadge, { backgroundColor: moodColors.accentLight }]}>
              <Text style={[styles.moodText, { color: moodColors.accent }]}>
                {item.mood}
              </Text>
            </View>
          </View>

          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.songArtist}>{item.artist}</Text>
          {item.album && (
            <Text style={styles.songAlbum}>{item.album}</Text>
          )}
          <Text style={styles.songReason}>{item.reason}</Text>

          {item.youtubeUrl && (
            <Pressable
              onPress={() => openLink(item.youtubeUrl!)}
              style={[styles.playButton, { backgroundColor: moodColors.accent }]}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playButtonText}>Play on YouTube</Text>
              <ExternalLink size={14} color="#FFFFFF" />
            </Pressable>
          )}

          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </LinearGradient>
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <Music2 size={24} color={moodColors.accent} />
          <Text style={styles.headerTitle}>Music for You</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.recommendSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.recommendCard}
          >
            <Text style={styles.recommendTitle}>
              How are you feeling right now?
            </Text>

            <View style={styles.moodSelector}>
              {moods.map((mood) => (
                <Pressable
                  key={mood.key}
                  onPress={() => {
                    setSelectedMood(mood.key);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  style={[
                    styles.moodChip,
                    selectedMood === mood.key && {
                      backgroundColor: moodColors.accent,
                      borderColor: moodColors.accent,
                    },
                  ]}
                >
                  <Text style={styles.moodChipEmoji}>
                    {getMoodEmoji(mood.key)}
                  </Text>
                  <Text
                    style={[
                      styles.moodChipText,
                      selectedMood === mood.key && styles.moodChipTextActive,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={getRecommendationForMood}
              style={[styles.getRecommendButton, { backgroundColor: moodColors.accent }]}
              testID="music-get-recommendation"
            >
              <Music2 size={20} color="#FFFFFF" />
              <Text style={styles.getRecommendButtonText}>
                Get Song Recommendation
              </Text>
            </Pressable>
          </LinearGradient>
        </View>

        {highlightedRecommendation && (
          <View style={styles.highlightCard} testID="music-highlight">
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.88)']}
              style={styles.highlightGradient}
            >
              <View style={styles.highlightHeader}>
                <View style={[styles.highlightBadge, { backgroundColor: moodColors.accentLight }]}
                >
                  <Text style={[styles.highlightBadgeText, { color: moodColors.accent }]}>{getMoodEmoji(highlightedRecommendation.mood as MusicMood)} {highlightedRecommendation.mood}</Text>
                </View>
                <Pressable
                  onPress={() => setHighlightedRecommendation(null)}
                  style={styles.highlightDismiss}
                  hitSlop={8}
                >
                  <Text style={styles.highlightDismissText}>Hide</Text>
                </Pressable>
              </View>

              <Text style={styles.highlightTitle}>{highlightedRecommendation.title}</Text>
              <Text style={styles.highlightArtist}>{highlightedRecommendation.artist}{highlightedRecommendation.album ? ` • ${highlightedRecommendation.album}` : ''}</Text>
              <Text style={styles.highlightReason}>{highlightedRecommendation.reason}</Text>

              {highlightedRecommendation.youtubeUrl && (
                <Pressable
                  onPress={() => openLink(highlightedRecommendation.youtubeUrl!)}
                  style={[styles.highlightAction, { backgroundColor: moodColors.accent }]}
                  testID="music-highlight-play"
                >
                  <Play size={16} color="#FFFFFF" />
                  <Text style={styles.highlightActionText}>Play now</Text>
                  <ExternalLink size={14} color="#FFFFFF" />
                </Pressable>
              )}
            </LinearGradient>
          </View>
        )}

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Your Music History</Text>
          <Text style={styles.historySubtitle}>
            {recommendations.length} songs recommended
          </Text>
        </View>

        <FlatList
          data={recommendations}
          renderItem={renderRecommendation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.songsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Music2 size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>
                No music recommendations yet!
              </Text>
              <Text style={styles.emptySubtext}>
                Select a mood above to get your first song recommendation
              </Text>
            </View>
          }
        />
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
  recommendSection: {
    padding: 20,
    paddingBottom: 16,
  },
  recommendCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  moodChipEmoji: {
    fontSize: 16,
  },
  moodChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  moodChipTextActive: {
    color: '#FFFFFF',
  },
  getRecommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  getRecommendButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  highlightCard: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  highlightGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  highlightBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  highlightBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  highlightDismiss: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  highlightDismissText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  highlightTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  highlightArtist: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  highlightReason: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  highlightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  highlightActionText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  historyHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  songsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  songCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  songCardGradient: {
    padding: 16,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  songAlbum: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  songReason: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
