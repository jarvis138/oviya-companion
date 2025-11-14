import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Heart, Send, Smile, Sparkles, Bookmark } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble, { TypingIndicator } from '../components/MessageBubble';
import Colors, { getColorsForMood } from '../constants/colors';
import { ChatProvider, useChat, type Message } from '../contexts/ChatContext';
import { buildSystemPrompt, detectCrisis, getGreetingForMood } from '../services/oviya';
import { generateText } from '@rork-ai/toolkit-sdk';
import { checkAnniversary, generateCarePackage, shouldShowGoodNightRitual, getGoodNightPrompt } from '../utils/carePackages';

const STICKERS = ['❤️', '🎉', '😂', '🤗', '✨', '🔥', '👏', '😊'];

function ChatScreen() {
  const {
    messages,
    userMemory,
    currentMood,
    isTyping,
    setIsTyping,
    addMessage,
    updateMemory,
    addToMemory,
    detectStress,
    updateStressTracking,
    changeMood,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendWelcomeMessageRef = useRef(false);

  useEffect(() => {
    if (messages.length === 0 && !sendWelcomeMessageRef.current) {
      sendWelcomeMessageRef.current = true;
      sendWelcomeMessage();
    }
  }, [messages.length]);

  useEffect(() => {
    const anniversary = checkAnniversary(
      userMemory.firstMetDate,
      userMemory.celebratedMilestones
    );

    if (anniversary.shouldCelebrate && anniversary.message) {
      const anniversaryMessage: Message = {
        id: `anniversary-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: anniversary.message }],
        timestamp: Date.now(),
      };

      setTimeout(() => {
        addMessage(anniversaryMessage);
        if (anniversary.milestone) {
          updateMemory({
            celebratedMilestones: [
              ...userMemory.celebratedMilestones,
              anniversary.milestone,
            ],
          });
        }
      }, 3000);
    }
  }, [userMemory.firstMetDate, userMemory.celebratedMilestones, addMessage, updateMemory]);

  useEffect(() => {
    if (messages.length > 0 && shouldShowGoodNightRitual()) {
      const lastMessage = messages[messages.length - 1];
      const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
      
      if (timeSinceLastMessage > 30 * 60 * 1000) {
        const { question, followUp } = getGoodNightPrompt();
        const goodNightMessage: Message = {
          id: `goodnight-${Date.now()}`,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: `Hey... before you sleep 🌙\n\n${question}\n\n${followUp}`,
            },
          ],
          timestamp: Date.now(),
        };
        
        addMessage(goodNightMessage);
      }
    }
  }, [messages, addMessage]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const sendWelcomeMessage = async () => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const greeting = getGreetingForMood(currentMood);
    const introText = messages.length === 0 && userMemory.importantFacts.length === 0
      ? `\n\nI'm Oviya. Think of me as that friend who actually remembers everything you tell them (in a non-creepy way, promise 😄).\n\nWhat's on your mind today?`
      : '';

    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: greeting + introText,
        },
      ],
      timestamp: Date.now(),
    };

    addMessage(welcomeMessage);
    setIsTyping(false);
  };

  const simulateTypingDelay = (text: string): number => {
    const words = text.split(' ').length;
    const baseDelay = 1000;
    const perWordDelay = 100;
    return Math.min(baseDelay + words * perWordDelay, 4000);
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: inputText.trim() }],
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInputText('');

    setIsTyping(true);

    try {
      const systemPrompt = buildSystemPrompt(userMemory, currentMood);
      
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.parts
          .filter(p => p.type === 'text')
          .map(p => (p.type === 'text' ? p.text : ''))
          .join('\n'),
      }));

      const delay = simulateTypingDelay(inputText);
      await new Promise(resolve => setTimeout(resolve, delay));

      const response = await generateText({
        messages: [
          { role: 'user' as const, content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content: inputText.trim() },
        ],
      });

      const oviyaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts: [{ type: 'text', text: response }],
        timestamp: Date.now(),
      };

      addMessage(oviyaMessage);

      if (inputText.toLowerCase().includes('my name is ')) {
        const nameMatch = inputText.match(/my name is (\w+)/i);
        if (nameMatch) {
          updateMemory({ name: nameMatch[1] });
        }
      }

      const importantPatterns = [
        /i (love|like|enjoy|hate|dislike)/i,
        /i am (studying|working|learning)/i,
        /my (mom|dad|family|friend)/i,
      ];

      if (importantPatterns.some(pattern => pattern.test(inputText))) {
        addToMemory(inputText.trim());
      }

      const isStressed = detectStress(inputText);
      updateStressTracking(isStressed);

      if (userMemory.consecutiveStressDays >= 3) {
        const carePackage = generateCarePackage(
          userMemory.stressLevel,
          userMemory.consecutiveStressDays,
          userMemory.name
        );

        if (carePackage) {
          setTimeout(() => {
            const careMessage: Message = {
              id: `care-${Date.now()}`,
              role: 'assistant',
              parts: [
                {
                  type: 'text',
                  text: `${carePackage.title}\n\n${carePackage.message}\n\n${carePackage.items.map(item => `${item.emoji} ${item.content}`).join('\n\n')}`,
                },
              ],
              timestamp: Date.now(),
            };
            addMessage(careMessage);
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Error getting response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "Arre yaar, something went wrong on my end 😅\n\nCan you try saying that again?",
          },
        ],
        timestamp: Date.now(),
      };

      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, messages, userMemory, currentMood, addMessage, updateMemory, addToMemory, setIsTyping]);

  const sendSticker = useCallback((sticker: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const stickerMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'sticker', emoji: sticker }],
      timestamp: Date.now(),
    };

    addMessage(stickerMessage);
    setShowStickers(false);
  }, [addMessage]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    return <MessageBubble message={item} isLatest={index === messages.length - 1} />;
  }, [messages.length]);

  const moodColors = getColorsForMood(currentMood);

  return (
    <View style={styles.backgroundWrapper}>
      <LinearGradient
        colors={[moodColors.gradientStart, moodColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Heart size={24} color={moodColors.accent} fill={moodColors.accent} />
            <Text style={styles.headerTitle}>Oviya</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push('/moments')}
              style={styles.momentsButton}
            >
              <Bookmark size={20} color={Colors.light.text} />
              {userMemory.savedMoments && userMemory.savedMoments.length > 0 && (
                <View style={styles.momentsBadge}>
                  <Text style={styles.momentsBadgeText}>
                    {userMemory.savedMoments.length}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowMoodPicker(!showMoodPicker)}
              style={[styles.moodIndicator, { backgroundColor: moodColors.accentLight }]}
            >
              <View style={[styles.moodDot, { backgroundColor: moodColors.accent }]} />
              <Text style={styles.moodText}>{currentMood}</Text>
              <Sparkles size={12} color={moodColors.accent} />
            </Pressable>
          </View>
        </View>

        {showMoodPicker && (
          <View style={styles.moodPicker}>
            <Text style={styles.moodPickerTitle}>How should Oviya feel today?</Text>
            <View style={styles.moodOptions}>
              {(['playful', 'reflective', 'energetic', 'cozy', 'caring'] as const).map((mood) => (
                <Pressable
                  key={mood}
                  onPress={() => {
                    changeMood(mood);
                    setShowMoodPicker(false);
                    const moodMessage: Message = {
                      id: `mood-${Date.now()}`,
                      role: 'assistant',
                      parts: [{
                        type: 'text',
                        text: getGreetingForMood(mood),
                      }],
                      timestamp: Date.now(),
                    };
                    setTimeout(() => addMessage(moodMessage), 300);
                  }}
                  style={[
                    styles.moodOption,
                    currentMood === mood && styles.moodOptionActive,
                    { borderColor: getColorsForMood(mood).accent },
                  ]}
                >
                  <Text style={[
                    styles.moodOptionText,
                    currentMood === mood && { color: getColorsForMood(mood).accent, fontWeight: '700' as const },
                  ]}>
                    {mood}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {showStickers && (
            <View style={styles.stickerPicker}>
              {STICKERS.map(sticker => (
                <Pressable
                  key={sticker}
                  onPress={() => sendSticker(sticker)}
                  style={styles.stickerButton}
                >
                  <Text style={styles.stickerEmoji}>{sticker}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Pressable
              onPress={() => setShowStickers(!showStickers)}
              style={styles.iconButton}
            >
              <Smile size={24} color={Colors.light.textSecondary} />
            </Pressable>

            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />

            <Pressable
              onPress={handleSend}
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              disabled={!inputText.trim() || isTyping}
            >
              <Send
                size={20}
                color={inputText.trim() ? '#FFFFFF' : Colors.light.textSecondary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default function Index() {
  return (
    <ChatProvider>
      <ChatScreen />
    </ChatProvider>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 12,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  iconButton: {
    padding: 8,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: Colors.light.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  stickerPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  stickerButton: {
    padding: 8,
  },
  stickerEmoji: {
    fontSize: 32,
  },
  moodPicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  moodPickerTitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  moodOptionActive: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  moodOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    textTransform: 'capitalize' as const,
  },
  momentsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  momentsBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    backgroundColor: Colors.light.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  momentsBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
