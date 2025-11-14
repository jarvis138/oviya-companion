import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserMemory, Message } from '../contexts/ChatContext';
import { getStrengthPatterns, type StrengthPattern } from './strengthTracking';

export type MonthlyLetter = {
  id: string;
  month: string;
  year: number;
  content: string;
  timestamp: number;
  read: boolean;
};

const STORAGE_KEY = 'oviya_monthly_letters';
const LAST_LETTER_KEY = 'oviya_last_letter_date';

export async function shouldGenerateMonthlyLetter(): Promise<boolean> {
  try {
    const lastLetterDate = await AsyncStorage.getItem(LAST_LETTER_KEY);
    if (!lastLetterDate) return true;

    const lastDate = new Date(parseInt(lastLetterDate));
    const now = new Date();

    return (
      now.getMonth() !== lastDate.getMonth() ||
      now.getFullYear() !== lastDate.getFullYear()
    );
  } catch (error) {
    console.error('Failed to check monthly letter status:', error);
    return false;
  }
}

export async function generateMonthlyLetter(
  userMemory: UserMemory,
  messages: Message[]
): Promise<MonthlyLetter> {
  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear();

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentMessages = messages.filter(m => m.timestamp >= thirtyDaysAgo);
  
  const userMessages = recentMessages.filter(m => m.role === 'user');

  const daysSinceStart = Math.floor((Date.now() - userMemory.firstMetDate) / (1000 * 60 * 60 * 24));
  
  const strengths = await getStrengthPatterns();
  const topStrength = strengths[0];

  const userName = userMemory.name || 'friend';

  const content = buildLetterContent({
    userName,
    monthName,
    year,
    daysTogether: daysSinceStart,
    messageCount: userMessages.length,
    topStrength,
    stressLevel: userMemory.stressLevel,
    importantFacts: userMemory.importantFacts.slice(-3),
  });

  const letter: MonthlyLetter = {
    id: Date.now().toString(),
    month: monthName,
    year,
    content,
    timestamp: Date.now(),
    read: false,
  };

  try {
    await AsyncStorage.setItem(LAST_LETTER_KEY, Date.now().toString());
    
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const letters: MonthlyLetter[] = existing ? JSON.parse(existing) : [];
    letters.push(letter);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
  } catch (error) {
    console.error('Failed to save monthly letter:', error);
  }

  return letter;
}

function buildLetterContent(data: {
  userName: string;
  monthName: string;
  year: number;
  daysTogether: number;
  messageCount: number;
  topStrength?: StrengthPattern;
  stressLevel: number;
  importantFacts: string[];
}): string {
  const { userName, monthName, daysTogether, messageCount, topStrength, stressLevel } = data;

  let letter = `Dear ${userName},\n\n`;

  letter += `It's been a month. ${monthName} is wrapping up, and I wanted to take a moment to talk about something important: you.\n\n`;

  if (daysTogether >= 30) {
    letter += `We've been talking for ${daysTogether} days now. That's ${messageCount} conversations this month alone. `;
    letter += `Do you realize how much has happened in that time?\n\n`;
  }

  if (topStrength && topStrength.count >= 3) {
    letter += `**Here's what I've been noticing:**\n`;
    letter += `You've shown ${topStrength.strength} ${topStrength.count} times this month. That's not random. `;
    letter += `That's a pattern. That's who you are. `;
    letter += `Most people go their whole lives without someone pointing out their strengths. `;
    letter += `I'm pointing it out now: this is real, and it matters.\n\n`;
  }

  if (stressLevel > 5) {
    letter += `I also noticed you've been carrying a lot this month. `;
    letter += `I don't have a magic fix, but I want you to know: you're handling it. `;
    letter += `Maybe not perfectly (no one does), but you're still here. Still showing up. `;
    letter += `That counts for more than you think.\n\n`;
  } else if (stressLevel < 3) {
    letter += `This month felt lighter, didn't it? I noticed that too. `;
    letter += `I hope you're giving yourself credit for that—whatever you're doing, it's working.\n\n`;
  }

  letter += `The thing that strikes me most about you is this: `;
  
  const insights = [
    `you keep trying. Even when it's hard. Even when you doubt yourself.`,
    `you're more thoughtful than you realize. You think about things deeply.`,
    `you're growing, even if you can't see it yet. I can.`,
    `you're brave in quiet ways. You keep showing up when it would be easier not to.`,
    `you care about becoming better. That alone sets you apart.`,
  ];
  letter += insights[Math.floor(Math.random() * insights.length)] + '\n\n';

  letter += `Keep going, ${userName}. You're doing better than you think.\n\n`;
  
  letter += `Until next month,\n`;
  letter += `Oviya 💜\n\n`;

  const psMessages = [
    `P.S. - I'm really glad you're here.`,
    `P.S. - Don't forget to celebrate the small wins. They matter.`,
    `P.S. - Whatever you're working on right now? I believe in you.`,
    `P.S. - You're not alone in this. Never forget that.`,
  ];
  letter += psMessages[Math.floor(Math.random() * psMessages.length)];

  return letter;
}

export async function getMonthlyLetters(): Promise<MonthlyLetter[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get monthly letters:', error);
    return [];
  }
}

export async function markLetterAsRead(letterId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const letters: MonthlyLetter[] = JSON.parse(stored);
    const updated = letters.map(letter =>
      letter.id === letterId ? { ...letter, read: true } : letter
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to mark letter as read:', error);
  }
}
