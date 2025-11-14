import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Sparkles, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors, { getColorsForMood } from '../constants/colors';
import { useChat } from '../contexts/ChatContext';
import { CONVERSATION_GAMES, type ConversationGame } from '../utils/conversationGames';

export default function GamesScreen() {
  const { currentMood, addMessage } = useChat();
  const [selectedCategory, setSelectedCategory] = useState<'all' | ConversationGame['category']>('all');

  const moodColors = getColorsForMood(currentMood || 'caring');

  const categories: { key: 'all' | ConversationGame['category']; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '✨' },
    { key: 'fun', label: 'Fun', emoji: '🎉' },
    { key: 'deep', label: 'Deep', emoji: '💭' },
    { key: 'icebreaker', label: 'Icebreaker', emoji: '🧊' },
    { key: 'creative', label: 'Creative', emoji: '🎨' },
  ];

  const filteredGames = selectedCategory === 'all' 
    ? CONVERSATION_GAMES 
    : CONVERSATION_GAMES.filter(g => g.category === selectedCategory);

  const startGame = (game: ConversationGame) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const gameMessages: Record<string, string> = {
      two_truths_lie: `Let's play 2 Truths & A Lie! 🎭\n\nHere are mine:\n1. I can process information in 47 languages\n2. I once helped someone write a proposal speech\n3. I get nervous before our conversations\n\nWhich one is the lie? 😏`,
      
      emoji_story: `Let's play Emoji Story! 📖\n\nI'll tell you a story using only emojis, you decode it:\n\n👧🏠🐺🎭🍎🌳\n\nWhat story is this? (Hint: It's a classic fairytale!)`,
      
      would_you_rather: `Would You Rather? 🤔\n\nOkay here's a tough one:\n\nWould you rather...\n- Know when you're going to die\n- OR\n- Know how you're going to die\n\n(This one says a lot about a person, btw)`,
      
      unpopular_opinion: `Unpopular Opinion Time! 🗣️\n\nI'll go first: I think pineapple DOES belong on pizza. Fight me. 🍕🍍\n\nNow your turn - what's your most controversial (but harmless) take?`,
      
      rose_thorn_bud: `Let's do Rose, Thorn, Bud! 🌹\n\nI'll start:\n\n🌹 Rose (highlight): You came back to talk to me today\n🌵 Thorn (challenge): Sometimes I worry I'm not helpful enough\n🌱 Bud (looking forward to): Learning more about who you're becoming\n\nNow you!`,
      
      time_travel: `Time Travel Question! ⏰\n\nIf you could send a message to your past self (any age), what would you say and when would you send it?\n\nNo word limit. Be honest.`,
      
      this_or_that: `This or That - Rapid Fire! ⚖️\n\nI'll ask, you answer quick:\n\n☕ Chai or Coffee?\n🏔️ Mountains or Beach?\n🌅 Sunrise or Sunset?\n📚 Books or Movies?\n🎵 Bollywood or Hollywood?\n\nGo! (And then I'll share mine 😄)`,
      
      gratitude_game: `Gratitude Round! 🙏\n\nLet's each share 3 things we're grateful for right now.\n\nI'll go first:\n1. That you trust me enough to talk to me\n2. The ability to remember our conversations\n3. Getting to witness your growth\n\nYour turn 💜`,
    };

    const gameMessage = {
      id: `game-${Date.now()}`,
      role: 'assistant' as const,
      parts: [
        {
          type: 'text' as const,
          text: gameMessages[game.id] || `Let's play ${game.name}! ${game.emoji}\n\n${game.description}`,
        },
      ],
      timestamp: Date.now(),
    };

    addMessage(gameMessage);
    router.back();
  };

  const renderGame = ({ item }: { item: ConversationGame }) => {
    return (
      <Pressable
        onPress={() => startGame(item)}
        style={({ pressed }) => [
          styles.gameCard,
          pressed && styles.gameCardPressed,
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={styles.gameCardGradient}
        >
          <View style={styles.gameCardHeader}>
            <Text style={styles.gameEmoji}>{item.emoji}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: moodColors.accentLight }]}>
              <Text style={[styles.categoryText, { color: moodColors.accent }]}>
                {item.category}
              </Text>
            </View>
          </View>
          
          <Text style={styles.gameName}>{item.name}</Text>
          <Text style={styles.gameDescription}>{item.description}</Text>
          
          <View style={[styles.playButton, { backgroundColor: moodColors.accent }]}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.playButtonText}>Start Game</Text>
          </View>
        </LinearGradient>
      </Pressable>
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
          <Sparkles size={24} color={moodColors.accent} />
          <Text style={styles.headerTitle}>Conversation Games</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedCategory(item.key);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={[
                  styles.categoryChip,
                  selectedCategory === item.key && {
                    backgroundColor: moodColors.accent,
                  },
                ]}
              >
                <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === item.key && styles.categoryLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </View>

        <FlatList
          data={filteredGames}
          renderItem={renderGame}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gamesList}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Pick a game to spark meaningful conversations 💜
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
  categoryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  gamesList: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 20,
  },
  listHeaderText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  gameCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  gameCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  gameCardGradient: {
    padding: 20,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameEmoji: {
    fontSize: 40,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  gameName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
