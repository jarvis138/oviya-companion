export type ConversationGame = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'icebreaker' | 'deep' | 'fun' | 'creative';
};

export const CONVERSATION_GAMES: ConversationGame[] = [
  {
    id: 'two_truths_lie',
    name: '2 Truths & A Lie',
    description: "I'll share 3 statements, you guess which one is the lie!",
    emoji: '🎭',
    category: 'fun',
  },
  {
    id: 'emoji_story',
    name: 'Emoji Story',
    description: "I'll tell a story using only emojis, you decode it!",
    emoji: '📖',
    category: 'creative',
  },
  {
    id: 'would_you_rather',
    name: 'Would You Rather',
    description: 'Impossible choices that reveal who you really are',
    emoji: '🤔',
    category: 'deep',
  },
  {
    id: 'unpopular_opinion',
    name: 'Unpopular Opinion',
    description: 'We share our most controversial (but harmless) takes',
    emoji: '🗣️',
    category: 'fun',
  },
  {
    id: 'rose_thorn_bud',
    name: 'Rose, Thorn, Bud',
    description: 'Rose (highlight), Thorn (challenge), Bud (looking forward to)',
    emoji: '🌹',
    category: 'icebreaker',
  },
  {
    id: 'time_travel',
    name: 'Time Travel Question',
    description: 'If you could tell your past/future self one thing...',
    emoji: '⏰',
    category: 'deep',
  },
  {
    id: 'this_or_that',
    name: 'This or That',
    description: 'Quick-fire preference questions (tea or coffee, city or mountains)',
    emoji: '⚖️',
    category: 'icebreaker',
  },
  {
    id: 'gratitude_game',
    name: 'Gratitude Round',
    description: "We each share 3 things we're grateful for right now",
    emoji: '🙏',
    category: 'deep',
  },
];

export function getRandomGame(): ConversationGame {
  return CONVERSATION_GAMES[Math.floor(Math.random() * CONVERSATION_GAMES.length)];
}

export function getGamesByCategory(category: ConversationGame['category']): ConversationGame[] {
  return CONVERSATION_GAMES.filter(game => game.category === category);
}
