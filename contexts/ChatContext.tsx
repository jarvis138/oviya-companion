import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';

export type MessageRole = 'user' | 'assistant';

export type TextPart = {
  type: 'text';
  text: string;
};

export type GifPart = {
  type: 'gif';
  url: string;
  alt: string;
};

export type StickerPart = {
  type: 'sticker';
  emoji: string;
};

export type MessagePart = TextPart | GifPart | StickerPart;

export type Reaction = {
  emoji: string;
  timestamp: number;
};

export type Message = {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  timestamp: number;
  reactions?: Reaction[];
};

export type UserMemory = {
  name?: string;
  preferences: Record<string, string>;
  importantFacts: string[];
  conversationHistory: Message[];
  firstMetDate: number;
  lastActiveDate: number;
  stressLevel: number;
  consecutiveStressDays: number;
  lastStressDate?: number;
  celebratedMilestones: number[];
  savedMoments: string[];
};

export type OviyaMood = 'playful' | 'reflective' | 'energetic' | 'cozy' | 'caring';

const STORAGE_KEYS = {
  MESSAGES: 'oviya_messages',
  MEMORY: 'oviya_memory',
  MOOD: 'oviya_mood',
};

const DEFAULT_MEMORY: UserMemory = {
  preferences: {},
  importantFacts: [],
  conversationHistory: [],
  firstMetDate: Date.now(),
  lastActiveDate: Date.now(),
  stressLevel: 0,
  consecutiveStressDays: 0,
  celebratedMilestones: [],
  savedMoments: [],
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMemory, setUserMemory] = useState<UserMemory>({
    ...DEFAULT_MEMORY,
    firstMetDate: Date.now(),
  });
  const [currentMood, setCurrentMood] = useState<OviyaMood>('caring');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedMessages, storedMemory, storedMood] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.MEMORY),
        AsyncStorage.getItem(STORAGE_KEYS.MOOD),
      ]);

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      if (storedMemory) {
        setUserMemory(JSON.parse(storedMemory));
      } else {
        const initialMemory = {
          ...DEFAULT_MEMORY,
          firstMetDate: Date.now(),
        };
        setUserMemory(initialMemory);
        await AsyncStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(initialMemory));
      }

      if (storedMood) {
        setCurrentMood(storedMood as OviyaMood);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessages = useCallback(async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }, []);

  const saveMemory = useCallback(async (memory: UserMemory) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(memory));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const updated = [...prev, message];
      saveMessages(updated);
      return updated;
    });
  }, [saveMessages]);

  const updateMemory = useCallback((updates: Partial<UserMemory>) => {
    setUserMemory(prev => {
      const updated = { ...prev, ...updates, lastActiveDate: Date.now() };
      saveMemory(updated);
      return updated;
    });
  }, [saveMemory]);

  const addToMemory = useCallback((fact: string) => {
    setUserMemory(prev => {
      if (prev.importantFacts.includes(fact)) return prev;
      const updated = {
        ...prev,
        importantFacts: [...prev.importantFacts, fact],
        lastActiveDate: Date.now(),
      };
      saveMemory(updated);
      return updated;
    });
  }, [saveMemory]);

  const changeMood = useCallback(async (mood: OviyaMood) => {
    setCurrentMood(mood);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD, mood);
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  }, []);

  const detectStress = useCallback((message: string): boolean => {
    const stressKeywords = [
      'stressed', 'overwhelmed', 'anxious', 'worried', 'tired',
      'exhausted', 'can\'t handle', 'too much', 'pressure'
    ];
    return stressKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }, []);

  const updateStressTracking = useCallback((isStressed: boolean) => {
    setUserMemory(prev => {
      const today = new Date().toDateString();
      const lastStressDay = prev.lastStressDate ? new Date(prev.lastStressDate).toDateString() : null;
      
      let consecutiveDays = prev.consecutiveStressDays;
      if (isStressed) {
        if (lastStressDay && lastStressDay !== today) {
          consecutiveDays += 1;
        } else if (!lastStressDay) {
          consecutiveDays = 1;
        }
      }

      const updated = {
        ...prev,
        stressLevel: isStressed ? Math.min(prev.stressLevel + 1, 10) : Math.max(prev.stressLevel - 1, 0),
        consecutiveStressDays: consecutiveDays,
        lastStressDate: isStressed ? Date.now() : prev.lastStressDate,
        lastActiveDate: Date.now(),
      };
      saveMemory(updated);
      return updated;
    });
  }, [saveMemory]);

  const saveMoment = useCallback((messageId: string) => {
    setUserMemory(prev => {
      if (prev.savedMoments.includes(messageId)) {
        const updated = {
          ...prev,
          savedMoments: prev.savedMoments.filter(id => id !== messageId),
        };
        saveMemory(updated);
        return updated;
      }
      const updated = {
        ...prev,
        savedMoments: [...prev.savedMoments, messageId],
      };
      saveMemory(updated);
      return updated;
    });
  }, [saveMemory]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          return {
            ...msg,
            reactions: [...reactions, { emoji, timestamp: Date.now() }],
          };
        }
        return msg;
      });
      saveMessages(updated);
      return updated;
    });
  }, [saveMessages]);

  return {
    messages,
    userMemory,
    currentMood,
    isTyping,
    isLoading,
    setIsTyping,
    addMessage,
    updateMemory,
    addToMemory,
    changeMood,
    detectStress,
    updateStressTracking,
    saveMoment,
    addReaction,
  };
});
