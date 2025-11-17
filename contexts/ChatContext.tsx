import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ConversationGame } from '../utils/conversationGames';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

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
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMemory, setUserMemory] = useState<UserMemory>({
    ...DEFAULT_MEMORY,
    firstMetDate: Date.now(),
  });
  const [currentMood, setCurrentMood] = useState<OviyaMood>('caring');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConversationGame, setActiveConversationGame] = useState<ConversationGame | null>(null);

  const loadData = useCallback(async () => {
    if (!userProfile?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const [messagesData, memoryData] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('timestamp', { ascending: true }),
        supabase
          .from('user_memory')
          .select('*')
          .eq('user_id', userProfile.id)
          .single(),
      ]);

      if (messagesData.data) {
        const loadedMessages: Message[] = messagesData.data.map((msg) => ({
          id: msg.id,
          role: msg.role as MessageRole,
          parts: msg.parts as MessagePart[],
          timestamp: msg.timestamp,
          reactions: msg.reactions as Reaction[] | undefined,
        }));
        setMessages(loadedMessages);
      }

      if (memoryData.data) {
        const mem = memoryData.data;
        setUserMemory({
          name: mem.name || undefined,
          preferences: mem.preferences as Record<string, string>,
          importantFacts: mem.important_facts,
          conversationHistory: [],
          firstMetDate: mem.first_met_date,
          lastActiveDate: mem.last_active_date,
          stressLevel: mem.stress_level,
          consecutiveStressDays: mem.consecutive_stress_days,
          lastStressDate: mem.last_stress_date || undefined,
          celebratedMilestones: mem.celebrated_milestones.map(Number),
          savedMoments: mem.saved_moments,
        });
        setCurrentMood(mem.current_mood as OviyaMood);
      } else {
        const initialMemory = {
          ...DEFAULT_MEMORY,
          firstMetDate: Date.now(),
        };
        setUserMemory(initialMemory);

        const { error } = await supabase.from('user_memory').upsert({
          user_id: userProfile.id,
          name: null,
          preferences: {},
          important_facts: [],
          first_met_date: initialMemory.firstMetDate,
          last_active_date: initialMemory.lastActiveDate,
          stress_level: 0,
          consecutive_stress_days: 0,
          last_stress_date: null,
          celebrated_milestones: [],
          saved_moments: [],
          current_mood: 'caring',
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        });

        if (error) {
          console.error('Failed to create initial memory:', error.message || JSON.stringify(error));
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error instanceof Error ? error.message : JSON.stringify(error));
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveMessages = useCallback(async (newMessages: Message[]) => {
    if (!userProfile?.id) return;

    try {
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage) {
        const { error } = await supabase.from('messages').insert({
          id: lastMessage.id,
          user_id: userProfile.id,
          role: lastMessage.role,
          parts: lastMessage.parts,
          timestamp: lastMessage.timestamp,
          reactions: lastMessage.reactions || null,
        });

        if (error) {
          console.error('Failed to save message:', error.message || JSON.stringify(error));
        }
      }
    } catch (error) {
      console.error('Failed to save messages:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, [userProfile?.id]);

  const saveMemory = useCallback(async (memory: UserMemory) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('user_memory')
        .update({
          name: memory.name || null,
          preferences: memory.preferences,
          important_facts: memory.importantFacts,
          first_met_date: memory.firstMetDate,
          last_active_date: memory.lastActiveDate,
          stress_level: memory.stressLevel,
          consecutive_stress_days: memory.consecutiveStressDays,
          last_stress_date: memory.lastStressDate || null,
          celebrated_milestones: memory.celebratedMilestones,
          saved_moments: memory.savedMoments,
          current_mood: currentMood,
        })
        .eq('user_id', userProfile.id);

      if (error) {
        console.error('Failed to save memory:', error.message || JSON.stringify(error));
      }
    } catch (error) {
      console.error('Failed to save memory:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, [userProfile?.id, currentMood]);

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
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('user_memory')
        .update({ current_mood: mood })
        .eq('user_id', userProfile.id);

      if (error) {
        console.error('Failed to save mood:', error.message || JSON.stringify(error));
      }
    } catch (error) {
      console.error('Failed to save mood:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, [userProfile?.id]);

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

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!userProfile?.id) return;

    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const newReactions = [...reactions, { emoji, timestamp: Date.now() }];
          
          supabase
            .from('messages')
            .update({ reactions: newReactions })
            .eq('id', messageId)
            .eq('user_id', userProfile.id)
            .then(({ error }) => {
              if (error) {
                console.error('Failed to save reaction:', error.message || JSON.stringify(error));
              }
            });

          return {
            ...msg,
            reactions: newReactions,
          };
        }
        return msg;
      });
      return updated;
    });
  }, [userProfile?.id]);

  const activateConversationGame = useCallback((game: ConversationGame | null) => {
    setActiveConversationGame(game);
  }, []);

  const contextValue = useMemo(() => ({
    messages,
    userMemory,
    currentMood,
    isTyping,
    isLoading,
    activeConversationGame,
    setIsTyping,
    addMessage,
    updateMemory,
    addToMemory,
    changeMood,
    detectStress,
    updateStressTracking,
    saveMoment,
    addReaction,
    activateConversationGame,
  }), [
    messages,
    userMemory,
    currentMood,
    isTyping,
    isLoading,
    activeConversationGame,
    addMessage,
    updateMemory,
    addToMemory,
    changeMood,
    detectStress,
    updateStressTracking,
    saveMoment,
    addReaction,
    activateConversationGame,
  ]);

  return contextValue;
});
