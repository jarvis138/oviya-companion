import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Heart, Send, Mic, Bookmark, LayoutDashboard, Clock, Users, Download, Crown, Share2, Star, LogOut, Search, Bell, User, Sparkles } from 'lucide-react-native';
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
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble, { TypingIndicator } from '../components/MessageBubble';
import Colors, { getColorsForMood } from '../constants/colors';
import { ChatProvider, useChat, type Message } from '../contexts/ChatContext';
import { buildSystemPrompt, detectCrisis, getGreetingForMood } from '../services/oviya';
import { generateText } from '@rork-ai/toolkit-sdk';
import { checkAnniversary, generateCarePackage, shouldShowGoodNightRitual, getGoodNightPrompt } from '../utils/carePackages';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const SIDEBAR_WIDTH = 240;

const QUICK_ACTIONS = [
  { id: 'meditate', title: 'Talk It Out', gradient: ['#C5A9E8', '#F0D9FF'], emoji: '🧘‍♀️' },
  { id: 'sleep', title: 'Need Sleep Advice', gradient: ['#B8E5D3', '#E8F8F1'], emoji: '😴' },
  { id: 'music', title: 'Song Recommendation', gradient: ['#FFD4A3', '#FFF5E8'], emoji: '🎵' },
  { id: 'move', title: 'Get Motivated', gradient: ['#D4A5E8', '#F0D9FF'], emoji: '💪' },
];

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
  const [showSidebar, setShowSidebar] = useState(isWeb && width > 768);
  const [searchText, setSearchText] = useState('');
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



  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    return <MessageBubble message={item} isLatest={index === messages.length - 1} />;
  }, [messages.length]);

  const moodColors = getColorsForMood(currentMood);

  return (
    <View style={styles.backgroundWrapper}>
      <LinearGradient
        colors={[moodColors.gradientStart, moodColors.gradientMid, moodColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.mainContainer}>
          {showSidebar && (
            <View style={styles.sidebar}>
              <BlurView intensity={20} tint="light" style={styles.sidebarBlur}>
                <View style={styles.sidebarContent}>
                  <View style={styles.logo}>
                    <View style={[styles.logoOrb, { backgroundColor: moodColors.accent }]} />
                    <Text style={styles.logoText}>Oviya</Text>
                  </View>

                  <View style={styles.navSection}>
                    <Text style={styles.navLabel}>GENERAL</Text>
                    <Pressable style={[styles.navItem, styles.navItemActive]}>
                      <LayoutDashboard size={18} color={moodColors.accent} />
                      <Text style={[styles.navItemText, { color: moodColors.accent }]}>Dashboard</Text>
                    </Pressable>
                    <Pressable style={styles.navItem}>
                      <Clock size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>My Sessions</Text>
                    </Pressable>
                    <Pressable style={styles.navItem}>
                      <Star size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Popular Sessions</Text>
                    </Pressable>
                    <Pressable style={styles.navItem}>
                      <Users size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Community</Text>
                    </Pressable>
                    <Pressable style={styles.navItem}>
                      <Download size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Download</Text>
                    </Pressable>
                  </View>

                  <View style={styles.navSection}>
                    <Text style={styles.navLabel}>OTHERS</Text>
                    <Pressable style={styles.navItem}>
                      <Crown size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Premium Access</Text>
                    </Pressable>
                    <Pressable style={styles.navItem}>
                      <Share2 size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Shared Sessions</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.navItem}
                      onPress={() => router.push('/moments')}
                    >
                      <Bookmark size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Saved Moments</Text>
                      {userMemory.savedMoments && userMemory.savedMoments.length > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{userMemory.savedMoments.length}</Text>
                        </View>
                      )}
                    </Pressable>
                    <Pressable style={styles.navItem}>
                      <LogOut size={18} color={Colors.light.text} />
                      <Text style={styles.navItemText}>Logout</Text>
                    </Pressable>
                  </View>
                </View>
              </BlurView>
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.topBar}>
              <View style={styles.searchContainer}>
                <Search size={18} color={Colors.light.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <Pressable style={styles.iconBtn}>
                <Bell size={20} color={Colors.light.text} />
              </Pressable>
              <Pressable style={styles.iconBtn}>
                <User size={20} color={Colors.light.text} />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <>
                  <View style={styles.heroSection}>
                    <BlurView intensity={30} tint="light" style={styles.heroCard}>
                      <View style={[styles.heroOrb, { backgroundColor: moodColors.accent }]} />
                      <Text style={styles.heroTitle}>Good Morning</Text>
                      <Text style={styles.heroSubtitle}>{userMemory.name || 'Friend'}, What&apos;s on your mind?</Text>
                    </BlurView>
                  </View>

                  <View style={styles.quickActions}>
                    {QUICK_ACTIONS.map((action) => (
                      <Pressable
                        key={action.id}
                        style={styles.actionCard}
                        onPress={() => {
                          setInputText(`I ${action.title.toLowerCase()}`);
                        }}
                      >
                        <LinearGradient
                          colors={action.gradient}
                          style={styles.actionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <BlurView intensity={20} tint="light" style={styles.actionBlur}>
                            <Text style={styles.actionEmoji}>{action.emoji}</Text>
                            <Text style={styles.actionTitle}>{action.title}</Text>
                          </BlurView>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.chatSection}>
                  <BlurView intensity={30} tint="light" style={styles.chatCard}>
                    <View style={styles.chatHeader}>
                      <View style={styles.chatHeaderLeft}>
                        <View style={[styles.avatarOrb, { backgroundColor: moodColors.accent }]} />
                        <View>
                          <Text style={styles.chatName}>Oviya</Text>
                          <View style={styles.moodBadge}>
                            <View style={[styles.moodDot, { backgroundColor: moodColors.accent }]} />
                            <Text style={styles.moodLabel}>{currentMood}</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable style={styles.iconBtn}>
                        <Sparkles size={20} color={moodColors.accent} />
                      </Pressable>
                    </View>

                    <FlatList
                      ref={flatListRef}
                      data={messages}
                      renderItem={renderMessage}
                      keyExtractor={item => item.id}
                      contentContainerStyle={styles.messageList}
                      onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                      ListFooterComponent={isTyping ? <TypingIndicator /> : null}
                      scrollEnabled={false}
                    />
                  </BlurView>
                </View>
              )}
            </ScrollView>

            <BlurView intensity={30} tint="light" style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Anything..."
                  placeholderTextColor={Colors.light.textSecondary}
                  multiline
                  maxLength={1000}
                  onSubmitEditing={handleSend}
                />
                <View style={styles.inputActions}>
                  <Pressable style={styles.inputIcon}>
                    <Mic size={20} color={Colors.light.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={handleSend}
                    style={styles.inputIcon}
                    disabled={!inputText.trim() || isTyping}
                  >
                    <Send 
                      size={20} 
                      color={inputText.trim() ? moodColors.accent : Colors.light.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
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
  mainContainer: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
  },
  sidebarBlur: {
    flex: 1,
    backgroundColor: Colors.light.glassCard,
    overflow: 'hidden' as const,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  logo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 40,
  },
  logoOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  navSection: {
    marginBottom: 24,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  navItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  navItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  badge: {
    backgroundColor: Colors.light.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: Colors.light.glassCard,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  heroOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  quickActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  actionCard: {
    width: isWeb ? '48%' : '100%',
    aspectRatio: 2,
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  actionGradient: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  actionBlur: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  chatSection: {
    flex: 1,
  },
  chatCard: {
    backgroundColor: Colors.light.glassCard,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  chatHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  chatHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatarOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  moodBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 2,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize' as const,
  },
  messageList: {
    paddingVertical: 12,
  },
  inputWrapper: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.glassCard,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden' as const,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  inputActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
