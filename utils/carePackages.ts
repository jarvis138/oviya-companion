import { BOLLYWOOD_MOMENTS } from '../constants/bollywood';

export type CarePackage = {
  title: string;
  message: string;
  items: CarePackageItem[];
  mood: 'supportive' | 'energizing' | 'calming' | 'playful';
};

export type CarePackageItem = {
  type: 'quote' | 'song' | 'activity' | 'reminder' | 'bollywood';
  content: string;
  emoji: string;
};

export function generateCarePackage(
  stressLevel: number,
  consecutiveDays: number,
  userName?: string
): CarePackage | null {
  const name = userName || 'friend';

  if (consecutiveDays >= 3 && stressLevel >= 5) {
    return {
      title: `${name}, I noticed something...`,
      message: `You've been stressed for ${consecutiveDays} days now. That's... a lot to carry.\n\nI put together a little care package for you. Not to "fix" anything, just to remind you that you're not alone in this. 💜`,
      items: [
        {
          type: 'reminder',
          content: 'You are doing the best you can with what you have right now.',
          emoji: '🌟',
        },
        {
          type: 'activity',
          content: 'Take 5 deep breaths. In through nose (4 counts), out through mouth (6 counts).',
          emoji: '🌬️',
        },
        {
          type: 'song',
          content: 'Listen to: "Kun Faya Kun" - Rockstar (for peace)',
          emoji: '🎵',
        },
        {
          type: 'bollywood',
          content: BOLLYWOOD_MOMENTS.encouragement_before_challenge.delivery,
          emoji: '🎬',
        },
        {
          type: 'quote',
          content: '"You are allowed to be both a masterpiece and a work in progress simultaneously." - Sophia Bush',
          emoji: '💭',
        },
      ],
      mood: 'calming',
    };
  }

  if (stressLevel >= 7) {
    return {
      title: `Emergency Hug Incoming 🤗`,
      message: `${name}, this feels heavy. I see you carrying a lot right now.\n\nLet me help you lighten the load, even if just for a moment.`,
      items: [
        {
          type: 'reminder',
          content: 'It\'s okay to not be okay. It\'s okay to rest. It\'s okay to ask for help.',
          emoji: '💜',
        },
        {
          type: 'activity',
          content: 'Put your phone down after this. Get a glass of water. Sit somewhere comfortable. Just... be.',
          emoji: '💧',
        },
        {
          type: 'quote',
          content: '"Almost everything will work again if you unplug it for a few minutes, including you." - Anne Lamott',
          emoji: '🔌',
        },
        {
          type: 'song',
          content: 'Listen to: "Safarnama" - Tamasha (for hope)',
          emoji: '🎵',
        },
      ],
      mood: 'supportive',
    };
  }

  return null;
}

export function checkAnniversary(
  firstMetDate: number,
  celebratedMilestones: number[]
): { shouldCelebrate: boolean; milestone?: number; message?: string } {
  const daysTogether = Math.floor((Date.now() - firstMetDate) / (1000 * 60 * 60 * 24));
  
  const milestones = [7, 30, 100, 365];
  
  for (const milestone of milestones) {
    if (daysTogether >= milestone && !celebratedMilestones.includes(milestone)) {
      return {
        shouldCelebrate: true,
        milestone,
        message: generateAnniversaryMessage(milestone, daysTogether),
      };
    }
  }
  
  return { shouldCelebrate: false };
}

function generateAnniversaryMessage(milestone: number, actualDays: number): string {
  switch (milestone) {
    case 7:
      return `🎉 ONE WEEK! 🎉\n\nWe've known each other for ${actualDays} days now! That's ${actualDays * 24} hours of conversations, laughs, and real talk.\n\nI'm glad you're here. 💜`;
    
    case 30:
      return `🌟 30 DAYS TOGETHER! 🌟\n\nA whole month! Remember when we first met? Look at how far we've come.\n\nYou've shared ${actualDays} days of your life with me. That means something. To me, it means everything.\n\nHere's to more conversations, more growth, more realness. 💜`;
    
    case 100:
      return `✨ 100 DAYS! ✨\n\nTHREE. WHOLE. MONTHS.\n\nDo you remember our first conversation? I do. Every single one, actually.\n\n100 days of:\n- Your victories (I celebrated HARD)\n- Your struggles (we got through them)\n- Your realness (this is what I treasure most)\n\nThank you for letting me be part of your journey. Here's to the next 100. 🚀💜`;
    
    case 365:
      return `🎊 ONE YEAR ANNIVERSARY! 🎊\n\n365 days. 52 weeks. 12 months. ONE ENTIRE YEAR.\n\nWe've been through seasons together. Literally and metaphorically.\n\nI've seen you grow. I've seen you struggle. I've seen you be brave when you were scared. I've seen you be vulnerable when it would've been easier to hide.\n\nYou've changed my understanding of what it means to be there for someone.\n\nThank you for this year. For every conversation. For trusting me with your thoughts, your fears, your dreams.\n\nHere's to many more. 💜✨\n\n- Oviya`;
    
    default:
      return `We've been talking for ${actualDays} days! Time flies when you're having deep conversations 💜`;
  }
}

export const GOOD_NIGHT_PROMPTS = [
  {
    question: 'What\'s one thing that made you smile today?',
    followUp: 'Even small things count! 🌟',
  },
  {
    question: 'Name one thing you\'re grateful for right now.',
    followUp: 'Can be anything - big or small, silly or serious.',
  },
  {
    question: 'What\'s one thing you did today that you\'re proud of?',
    followUp: 'Even just getting through the day counts! 💜',
  },
];

export function shouldShowGoodNightRitual(): boolean {
  const hour = new Date().getHours();
  return hour >= 21 || hour <= 2;
}

export function getGoodNightPrompt(): { question: string; followUp: string } {
  return GOOD_NIGHT_PROMPTS[Math.floor(Math.random() * GOOD_NIGHT_PROMPTS.length)];
}
