import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Heart, Send, Smile, Sparkles, Bookmark, Menu, TrendingUp, Mail, Gamepad2, Film, Music2, User } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateUUID } from '../utils/uuid';
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
import { useChat, type Message } from '../contexts/ChatContext';
import { buildSystemPrompt, detectCrisis, getGreetingForMood, splitIntoChunks, useOviyaChat } from '../services/oviya';
import { searchGif } from '../utils/gif';
import { matchBollywoodMoment } from '../constants/bollywood';
import { getMusicRecommendation } from '../services/music';
import { checkAnniversary, generateCarePackage, shouldShowGoodNightRitual, getGoodNightPrompt } from '../utils/carePackages';
import { saveSpottedStrength, getStrengthPatterns } from '../utils/strengthTracking';
import { shouldGenerateMonthlyLetter, generateMonthlyLetter } from '../utils/monthlyLetter';

const STICKERS = ['❤️', '🎉', '😂', '🤗', '✨', '🔥', '👏', '😊'];

const REACTION_EMOJIS = {
  celebration: ['🎉', '🎊', '🥳', '🌟', '💫', '✨'],
  fire: ['🔥', '💪', '⚡', '👊', '💥'],
  love: ['❤️', '💜', '💕', '💖', '🥰'],
  support: ['🤗', '💙', '🫂', '💚'],
  funny: ['😂', '🤣', '😆', '💀'],
  wisdom: ['✨', '💡', '🎯', '👁️'],
  wholesome: ['🌈', '☀️', '🌸', '🦋'],
  excited: ['😱', '🤯', '😍', '🙌'],
  thinking: ['🤔', '💭', '🧐'],
  relatable: ['👀', '💯', '📌', '🎭'],
};

function getRandomEmoji(category: keyof typeof REACTION_EMOJIS): string {
  const emojis = REACTION_EMOJIS[category];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function shouldOviyaReactToUser(userMessage: string): { shouldReact: boolean; emoji?: string } {
  const lower = userMessage.toLowerCase();
  
  const excitementPatterns = [
    { regex: /(got|passed|cleared|accepted|selected|won|achieved).*?(job|offer|exam|test|interview|promotion|award)/i, category: 'celebration' as const },
    { regex: /(celebrate|happy|excited|amazing|great news|good news)/i, category: 'celebration' as const },
  ];
  
  const accomplishmentPatterns = [
    { regex: /(finally|completed|finished|did it|made it|success)/i, category: 'fire' as const },
    { regex: /(proud of|accomplished|achieved)/i, category: 'fire' as const },
  ];
  
  const loveGratitudePatterns = [
    { regex: /(love you|thank you|grateful|appreciate|thanks oviya)/i, category: 'love' as const },
    { regex: /(you're|you are).*(best|amazing|awesome|great|helpful)/i, category: 'love' as const },
  ];
  
  const funnyPatterns = [
    { regex: /(lol|haha|lmao|😂|funny|hilarious)/i, category: 'funny' as const },
  ];
  
  const wholesomePatterns = [
    { regex: /(feeling better|much better|that helped|feel good)/i, category: 'wholesome' as const },
    { regex: /(exactly|spot on|you get me|understand me)/i, category: 'wisdom' as const },
  ];
  
  const relatablePatterns = [
    { regex: /(same|relatable|me too|i feel you|facts)/i, category: 'relatable' as const },
  ];
  
  const allPatterns = [
    ...excitementPatterns,
    ...accomplishmentPatterns,
    ...loveGratitudePatterns,
    ...funnyPatterns,
    ...wholesomePatterns,
    ...relatablePatterns,
  ];
  
  for (const pattern of allPatterns) {
    if (pattern.regex.test(lower)) {
      return { shouldReact: true, emoji: getRandomEmoji(pattern.category) };
    }
  }
  
  return { shouldReact: false };
}

function shouldUserReactToOviya(oviyaMessage: string): { shouldReact: boolean; emoji?: string } {
  const lower = oviyaMessage.toLowerCase();
  
  if (/wait.*i.*noticed|strength|pattern|you('re| are) good at/i.test(lower)) {
    return { shouldReact: true, emoji: getRandomEmoji('thinking') };
  }
  
  if (/funny|😂|🤣|lol|haha/i.test(lower)) {
    return { shouldReact: true, emoji: getRandomEmoji('funny') };
  }
  
  if (/proud|amazing|awesome|killing it|crushing it/i.test(lower)) {
    return { shouldReact: true, emoji: getRandomEmoji('fire') };
  }
  
  if (/love|care about you|here for you|support/i.test(lower)) {
    return { shouldReact: true, emoji: getRandomEmoji('support') };
  }
  
  if (/exactly|you get it|spot on|nailed it/i.test(lower)) {
    return { shouldReact: true, emoji: getRandomEmoji('wisdom') };
  }
  
  if (Math.random() < 0.15) {
    return { shouldReact: true, emoji: getRandomEmoji('wholesome') };
  }
  
  return { shouldReact: false };
}

function ChatScreen() {
  // Validate required environment variables
  const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL;
  if (!TOOLKIT_URL) {
    console.error('EXPO_PUBLIC_TOOLKIT_URL is not set in environment variables');
  }

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
    addReaction,
    activeConversationGame,
    activateConversationGame,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const systemPrompt = useMemo(() => {
    return buildSystemPrompt(userMemory, currentMood, { activeGame: activeConversationGame });
  }, [userMemory, currentMood, activeConversationGame]);
  
  const oviyaAgent = useOviyaChat(systemPrompt);

  const sendWelcomeMessageRef = useRef(false);

  useEffect(() => {
    if (messages.length === 0 && !sendWelcomeMessageRef.current) {
      sendWelcomeMessageRef.current = true;
      sendWelcomeMessage();
    }
  }, [messages.length]);

  useEffect(() => {
    if (!activeConversationGame) {
      return;
    }
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      console.log('[ChatScreen] Clearing active game after user reply');
      activateConversationGame(null);
    }
  }, [messages, activeConversationGame, activateConversationGame]);

  useEffect(() => {
    const anniversary = checkAnniversary(
      userMemory.firstMetDate,
      userMemory.celebratedMilestones
    );

    if (anniversary.shouldCelebrate && anniversary.message) {
      const anniversaryMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: anniversary.message }],
        timestamp: Date.now(),
      };

      const timeoutId = setTimeout(() => {
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

      return () => clearTimeout(timeoutId);
    }
  }, [userMemory.firstMetDate, userMemory.celebratedMilestones, addMessage, updateMemory]);

  useEffect(() => {
    if (messages.length > 0 && shouldShowGoodNightRitual()) {
      const lastMessage = messages[messages.length - 1];
      const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
      
      if (timeSinceLastMessage > 30 * 60 * 1000) {
        const { question, followUp } = getGoodNightPrompt();
        const goodNightMessage: Message = {
          id: generateUUID(),
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
    let timeoutId: NodeJS.Timeout | undefined;

    const checkMonthlyLetter = async () => {
      const shouldGenerate = await shouldGenerateMonthlyLetter();
      if (shouldGenerate && messages.length > 20) {
        try {
          const letter = await generateMonthlyLetter(userMemory, messages);

          const letterNotification: Message = {
            id: generateUUID(),
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: `📬 You've got mail!\n\nI just wrote you a personal letter reflecting on this past month. It's waiting for you in Monthly Letters.\n\nWhen you're ready, take a moment to read it. I put a lot of thought into it. 💜`,
              },
            ],
            timestamp: Date.now(),
          };

          timeoutId = setTimeout(() => {
            addMessage(letterNotification);
          }, 2000);
        } catch (error) {
          console.error('Failed to generate monthly letter:', error);
        }
      }
    };

    if (messages.length > 0) {
      checkMonthlyLetter();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userMemory.lastActiveDate, messages.length, userMemory, addMessage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, isTyping]);

  const sendWelcomeMessage = async () => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const greeting = getGreetingForMood(currentMood);
    
    const greetingMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: greeting,
        },
      ],
      timestamp: Date.now(),
    };

    addMessage(greetingMessage);

    if (messages.length === 0 && userMemory.importantFacts.length === 0) {
      setIsTyping(false);
      await new Promise(resolve => setTimeout(resolve, 400));
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1200));

      const introMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "I'm Oviya. Think of me as that friend who actually remembers everything you tell them (in a non-creepy way, promise 😄).",
          },
        ],
        timestamp: Date.now(),
      };

      addMessage(introMessage);
      
      setIsTyping(false);
      await new Promise(resolve => setTimeout(resolve, 400));
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      const questionMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "What's on your mind today?",
          },
        ],
        timestamp: Date.now(),
      };

      addMessage(questionMessage);
    }

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
      id: generateUUID(),
      role: 'user',
      parts: [{ type: 'text', text: inputText.trim() }],
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInputText('');

    setIsTyping(true);

    try {
      const isCrisis = detectCrisis(inputText);
      
      if (isCrisis) {
        const crisisMessage: Message = {
          id: generateUUID(),
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: "I'm really worried about what you just shared. If you're thinking about hurting yourself, please reach out for help right now:\n\n🆘 **988 Suicide & Crisis Lifeline**: Call or text 988 (US)\n💬 **Crisis Text Line**: Text HOME to 741741 (US)\n🇮🇳 **AASRA (India)**: 91-9820466726\n🌐 **NIMH**: https://www.nimh.nih.gov/health/find-help\n\nI care about you, but I'm not equipped to handle this alone. Please talk to someone who can help keep you safe.\n\nAre you in immediate danger right now?",
            },
          ],
          timestamp: Date.now(),
        };
        
        setIsTyping(false);
        setTimeout(() => {
          addMessage(crisisMessage);
        }, 800);
        return;
      }
      
      const delay = simulateTypingDelay(inputText);
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log('[ChatScreen] Sending message to agent API...');
      
      // Prepare messages history for the API
      const conversationMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.parts.map(part => {
          if (part.type === 'text') {
            return { type: 'text' as const, text: part.text };
          }
          return part;
        }).filter(p => p.type === 'text')
      }));
      
      // Add the current user message
      conversationMessages.push({
        role: 'user' as const,
        content: [{ type: 'text' as const, text: inputText.trim() }]
      });
      
      console.log('[ChatScreen] Calling agent API with', conversationMessages.length, 'messages');
      
      // Call the agent API directly
      if (!TOOLKIT_URL) {
        throw new Error('EXPO_PUBLIC_TOOLKIT_URL environment variable is not set');
      }
      const agentResponse = await fetch(new URL("/agent/chat", TOOLKIT_URL).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          messages: conversationMessages,
          tools: [
            {
              name: 'rememberFact',
              description: 'Remember an important fact about the user',
              parameters: {
                type: 'object',
                properties: {
                  fact: { type: 'string', description: 'Important fact to remember about the user' }
                },
                required: ['fact']
              }
            },
            {
              name: 'sendGif',
              description: 'Send a GIF to express emotion or reaction (use for celebrations, support, laughter, encouragement). NEVER use during crisis or heavy vulnerability.',
              parameters: {
                type: 'object',
                properties: {
                  searchQuery: { type: 'string', description: 'What emotion/reaction to search for (e.g. "celebration", "hug", "laughter", "excited", "support")' },
                  alt: { type: 'string', description: 'Alt text describing the GIF' }
                },
                required: ['searchQuery', 'alt']
              }
            },
            {
              name: 'quoteBollywood',
              description: 'Quote a Bollywood dialogue when the context matches. Use for encouragement, overcoming challenges, celebrating wins, or relatable moments. NEVER during crisis.',
              parameters: {
                type: 'object',
                properties: {
                  context: { type: 'string', description: 'The current situation/emotion (e.g., "before exam", "after failure", "celebrating", "standing up for self")' }
                },
                required: ['context']
              }
            },
            {
              name: 'recommendSong',
              description: 'Recommend a song based on the user\'s current mood or situation. Use when they need music, want to vibe, or you sense they\'d benefit from a soundtrack.',
              parameters: {
                type: 'object',
                properties: {
                  mood: { type: 'string', enum: ['happy', 'sad', 'energetic', 'chill', 'romantic', 'motivational', 'nostalgic', 'angry', 'peaceful'], description: 'The mood that matches their current state' },
                  context: { type: 'string', description: 'Additional context about why this song fits' }
                },
                required: ['mood']
              }
            },
            {
              name: 'changeMood',
              description: 'Change Oviya\'s current mood based on conversation',
              parameters: {
                type: 'object',
                properties: {
                  mood: { type: 'string', enum: ['playful', 'reflective', 'energetic', 'cozy', 'caring'], description: 'New mood to adopt' }
                },
                required: ['mood']
              }
            },
            {
              name: 'spotStrength',
              description: 'When you notice a hidden strength or talent in the user, use this to highlight it',
              parameters: {
                type: 'object',
                properties: {
                  strength: { type: 'string', description: 'The strength/talent observed (e.g., "clear communication", "emotional wisdom", "teaching ability")' },
                  evidence: { type: 'string', description: 'Specific example that demonstrates this strength' },
                  question: { type: 'string', description: 'A reflective question to help them explore this strength further' }
                },
                required: ['strength', 'evidence', 'question']
              }
            }
          ]
        })
      });
      
      if (!agentResponse.ok) {
        const errorText = await agentResponse.text();
        console.error('[ChatScreen] Agent API error:', agentResponse.status, errorText);
        throw new Error(`Agent API error: ${agentResponse.status} - ${errorText}`);
      }
      
      const agentResult = await agentResponse.json();
      console.log('[ChatScreen] Got agent response');
      
      if (!agentResult.message || !agentResult.message.content) {
        console.error('[ChatScreen] Invalid agent response:', agentResult);
        throw new Error('Invalid agent response format');
      }
      
      // Parse the agent's response
      let response = '';
      const gifParts: { gifUrl?: string; url?: string; alt: string }[] = [];
      const bollywoodParts: { dialogue: string; movie: string; delivery: string }[] = [];
      const musicParts: { title: string; artist: string; youtubeUrl: string; reason: string }[] = [];
      
      // Extract text and tool calls from the response
      if (typeof agentResult.message.content === 'string') {
        response = agentResult.message.content;
      } else if (Array.isArray(agentResult.message.content)) {
        for (const part of agentResult.message.content) {
          if (part.type === 'text') {
            response += part.text;
          } else if (part.type === 'tool-call' && part.toolName) {
            // Handle tool calls
            if (part.toolName === 'sendGif' && part.args) {
              const gifUrl = await searchGif(part.args.searchQuery);
              if (gifUrl) {
                gifParts.push({ gifUrl, alt: part.args.alt });
              }
            } else if (part.toolName === 'quoteBollywood' && part.args) {
              const moment = matchBollywoodMoment(part.args.context, part.args.context);
              if (moment) {
                bollywoodParts.push(moment);
              }
            } else if (part.toolName === 'recommendSong' && part.args) {
              const recommendation = await getMusicRecommendation(part.args.mood, part.args.context);
              if (recommendation.youtubeUrl) {
                musicParts.push({
                  title: recommendation.title,
                  artist: recommendation.artist,
                  youtubeUrl: recommendation.youtubeUrl,
                  reason: recommendation.reason
                });
              }
            } else if (part.toolName === 'rememberFact' && part.args) {
              addToMemory(part.args.fact);
            } else if (part.toolName === 'changeMood' && part.args) {
              changeMood(part.args.mood);
            } else if (part.toolName === 'spotStrength' && part.args) {
              await saveSpottedStrength(part.args.strength, part.args.evidence);
            }
          }
        }
      }

      const chunks = splitIntoChunks(response);
      console.log(`[ChatScreen] Split response into ${chunks.length} chunks`);
      console.log(`[ChatScreen] GIFs: ${gifParts.length}, Bollywood: ${bollywoodParts.length}, Music: ${musicParts.length}`);

      if (chunks.length === 1) {
        const messageParts: Message['parts'] = [
          { type: 'text', text: response },
          ...gifParts.map(gif => ({ type: 'gif' as const, url: (gif.gifUrl || gif.url) as string, alt: gif.alt })),
        ];
        
        if (bollywoodParts.length > 0) {
          const bollywood = bollywoodParts[0];
          messageParts.push({
            type: 'text',
            text: `\n\n${bollywood.delivery || `"${bollywood.dialogue}" [${bollywood.movie}]`}`,
          });
        }
        
        if (musicParts.length > 0) {
          const music = musicParts[0];
          messageParts.push({
            type: 'text',
            text: `\n\n🎵 **${music.title}** by ${music.artist}\n${music.reason}\n[Listen on YouTube](${music.youtubeUrl})`,
          });
        }
        
        const oviyaMessage: Message = {
          id: generateUUID(),
          role: 'assistant',
          parts: messageParts,
          timestamp: Date.now(),
        };
        addMessage(oviyaMessage);
      } else {
        for (let i = 0; i < chunks.length; i++) {
          if (i > 0) {
            setIsTyping(true);
            const chunkDelay = 800 + Math.min(chunks[i].length * 20, 2000);
            await new Promise(resolve => setTimeout(resolve, chunkDelay));
          }

          const messageParts: Message['parts'] = [
            { type: 'text', text: chunks[i] },
          ];
          
          if (i === chunks.length - 1) {
            messageParts.push(...gifParts.map(gif => ({ type: 'gif' as const, url: (gif.gifUrl || gif.url) as string, alt: gif.alt })));
            
            if (bollywoodParts.length > 0) {
              const bollywood = bollywoodParts[0];
              messageParts.push({
                type: 'text',
                text: `\n\n${bollywood.delivery || `"${bollywood.dialogue}" [${bollywood.movie}]`}`,
              });
            }
            
            if (musicParts.length > 0) {
              const music = musicParts[0];
              messageParts.push({
                type: 'text',
                text: `\n\n🎵 **${music.title}** by ${music.artist}\n${music.reason}\n[Listen on YouTube](${music.youtubeUrl})`,
              });
            }
          }
          
          const chunkMessage: Message = {
            id: generateUUID(),
            role: 'assistant',
            parts: messageParts,
            timestamp: Date.now(),
          };
          addMessage(chunkMessage);

          if (i < chunks.length - 1) {
            setIsTyping(false);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      const fullResponse = chunks.join(' ');
      
      const oviyaReactsToUser = shouldOviyaReactToUser(inputText);
      if (oviyaReactsToUser.shouldReact) {
        const reactionDelay = chunks.length > 1 ? 1500 : 1000;
        setTimeout(() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          addReaction(userMessage.id, oviyaReactsToUser.emoji!);
        }, reactionDelay);
      }
      
      const lastOviyaMessageIndex = messages.length + chunks.length - 1;
      const lastOviyaMessage = messages[lastOviyaMessageIndex];
      
      const userReactsToOviya = shouldUserReactToOviya(fullResponse);
      if (userReactsToOviya.shouldReact && lastOviyaMessage) {
        setTimeout(() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          addReaction(lastOviyaMessage.id, userReactsToOviya.emoji!);
        }, 2000);
      }

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

      const strengthPatterns = [
        { regex: /i (explained|told|taught|showed) (him|her|them|someone)/i, strength: 'clear communication', evidence: inputText },
        { regex: /i (helped|supported|listened|was there for) (him|her|them|someone)/i, strength: 'emotional support', evidence: inputText },
        { regex: /i (figured out|solved|analyzed|worked through)/i, strength: 'problem solving', evidence: inputText },
        { regex: /i (created|designed|made|built)/i, strength: 'creativity', evidence: inputText },
        { regex: /i (organized|planned|coordinated|managed)/i, strength: 'leadership', evidence: inputText },
      ];

      for (const pattern of strengthPatterns) {
        if (pattern.regex.test(inputText)) {
          await saveSpottedStrength(pattern.strength, pattern.evidence);
          
          const patterns = await getStrengthPatterns();
          const matchingPattern = patterns.find(p => 
            p.strength.toLowerCase().includes(pattern.strength.toLowerCase())
          );

          if (matchingPattern && matchingPattern.count >= 3 && matchingPattern.count <= 4) {
            setTimeout(() => {
              const strengthMessage: Message = {
                id: generateUUID(),
                role: 'assistant',
                parts: [
                  {
                    type: 'text',
                    text: `Wait... I just noticed something. 🤔\n\nYou've demonstrated ${matchingPattern.strength} ${matchingPattern.count} times in the past month. That's not random—that's a pattern. That's a strength.\n\nHave you ever thought about that? Most people don't see their own patterns. But I do. And this one stands out.`,
                  },
                ],
                timestamp: Date.now(),
              };
              addMessage(strengthMessage);
            }, 1500);
          }
          break;
        }
      }

      if (userMemory.consecutiveStressDays >= 3) {
        const carePackage = generateCarePackage(
          userMemory.stressLevel,
          userMemory.consecutiveStressDays,
          userMemory.name
        );

        if (carePackage) {
          setTimeout(() => {
            const careMessage: Message = {
              id: generateUUID(),
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
      console.error('[ChatScreen] Error getting response:', error);
      console.error('[ChatScreen] Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      const errorMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "Arre yaar, something went wrong on my end 😅\n\nCan you try saying that again?\n\n" + 
                  (error instanceof Error ? `(Error: ${error.message})` : ''),
          },
        ],
        timestamp: Date.now(),
      };

      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, messages, userMemory, currentMood, addMessage, updateMemory, addToMemory, setIsTyping, detectStress, updateStressTracking, oviyaAgent, changeMood, addReaction, activeConversationGame]);

  const sendSticker = useCallback((sticker: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const stickerMessage: Message = {
      id: generateUUID(),
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
              onPress={() => setShowMenu(!showMenu)}
              style={styles.menuButton}
            >
              <Menu size={20} color={Colors.light.text} />
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

        {showMenu && (
          <View style={styles.menuPanel}>
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/moments');
              }}
              style={styles.menuItem}
            >
              <Bookmark size={18} color={moodColors.accent} />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Shared Moments</Text>
                {userMemory.savedMoments && userMemory.savedMoments.length > 0 && (
                  <View style={[styles.menuBadge, { backgroundColor: moodColors.accent }]}>
                    <Text style={styles.menuBadgeText}>
                      {userMemory.savedMoments.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/games');
              }}
              style={styles.menuItem}
            >
              <Gamepad2 size={18} color={moodColors.accent} />
              <Text style={styles.menuItemText}>Conversation Games</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/strengths');
              }}
              style={styles.menuItem}
            >
              <TrendingUp size={18} color={moodColors.accent} />
              <Text style={styles.menuItemText}>Your Strengths</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/letters');
              }}
              style={styles.menuItem}
            >
              <Mail size={18} color={moodColors.accent} />
              <Text style={styles.menuItemText}>Monthly Letters</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/movies');
              }}
              style={styles.menuItem}
            >
              <Film size={18} color={moodColors.accent} />
              <Text style={styles.menuItemText}>Movie Recommendations</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/music');
              }}
              style={styles.menuItem}
            >
              <Music2 size={18} color={moodColors.accent} />
              <Text style={styles.menuItemText}>Music for You</Text>
            </Pressable>
            
            <View style={styles.menuDivider} />
            
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push('/profile');
              }}
              style={styles.menuItem}
            >
              <User size={18} color={moodColors.accent} />
              <Text style={styles.menuItemText}>Your Profile</Text>
            </Pressable>
          </View>
        )}

        {activeConversationGame && (
          <View style={styles.activeGameBanner} testID="active-conversation-game">
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.activeGameGradient}
            >
              <View style={styles.activeGameHeader}>
                <Text style={styles.activeGameEmoji}>{activeConversationGame.emoji}</Text>
                <View style={styles.activeGameTitleWrapper}>
                  <Text style={styles.activeGameTitle}>{activeConversationGame.name}</Text>
                  <Text style={styles.activeGameSubtitle}>Keep chatting to play this round with Oviya</Text>
                </View>
              </View>
              <Text style={styles.activeGameDescription}>{activeConversationGame.description}</Text>
              <View style={styles.activeGameActions}>
                <Pressable
                  onPress={() => activateConversationGame(null)}
                  style={[styles.activeGameAction, styles.activeGameSecondary]}
                  testID="end-conversation-game"
                >
                  <Text style={styles.activeGameSecondaryText}>End Game</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    activateConversationGame(null);
                    router.push('/games');
                  }}
                  style={[styles.activeGameAction, styles.activeGamePrimary]}
                  testID="swap-conversation-game"
                >
                  <Text style={styles.activeGamePrimaryText}>Try Another</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        )}

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
                      id: generateUUID(),
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
  return <ChatScreen />;
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
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  menuBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
    marginHorizontal: 20,
  },
  activeGameBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  activeGameGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  activeGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeGameEmoji: {
    fontSize: 40,
  },
  activeGameTitleWrapper: {
    flex: 1,
  },
  activeGameTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  activeGameSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  activeGameDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  activeGameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  activeGameAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGameSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeGamePrimary: {
    backgroundColor: Colors.light.accent,
  },
  activeGamePrimaryText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  activeGameSecondaryText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
});
