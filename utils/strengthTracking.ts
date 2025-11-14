import AsyncStorage from '@react-native-async-storage/async-storage';

export type SpottedStrength = {
  id: string;
  strength: string;
  evidence: string;
  timestamp: number;
  category: 'communication' | 'emotional' | 'analytical' | 'creative' | 'leadership' | 'other';
};

export type StrengthPattern = {
  strength: string;
  count: number;
  examples: string[];
  category: string;
  firstSpotted: number;
  lastSpotted: number;
};

const STORAGE_KEY = 'oviya_spotted_strengths';

export async function saveSpottedStrength(
  strength: string,
  evidence: string
): Promise<SpottedStrength> {
  const spottedStrength: SpottedStrength = {
    id: Date.now().toString(),
    strength,
    evidence,
    timestamp: Date.now(),
    category: categorizeStrength(strength),
  };

  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const strengths: SpottedStrength[] = existing ? JSON.parse(existing) : [];
    strengths.push(spottedStrength);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(strengths));
    return spottedStrength;
  } catch (error) {
    console.error('Failed to save spotted strength:', error);
    return spottedStrength;
  }
}

export async function getSpottedStrengths(): Promise<SpottedStrength[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get spotted strengths:', error);
    return [];
  }
}

export async function getStrengthPatterns(): Promise<StrengthPattern[]> {
  const strengths = await getSpottedStrengths();
  
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentStrengths = strengths.filter(s => s.timestamp >= thirtyDaysAgo);

  const patterns: Record<string, StrengthPattern> = {};

  recentStrengths.forEach(s => {
    const key = s.strength.toLowerCase();
    if (!patterns[key]) {
      patterns[key] = {
        strength: s.strength,
        count: 0,
        examples: [],
        category: s.category,
        firstSpotted: s.timestamp,
        lastSpotted: s.timestamp,
      };
    }
    patterns[key].count++;
    patterns[key].examples.push(s.evidence);
    patterns[key].lastSpotted = Math.max(patterns[key].lastSpotted, s.timestamp);
  });

  return Object.values(patterns)
    .filter(p => p.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function categorizeStrength(strength: string): SpottedStrength['category'] {
  const lower = strength.toLowerCase();
  
  if (lower.includes('communicat') || lower.includes('explain') || lower.includes('teaching')) {
    return 'communication';
  }
  if (lower.includes('emotion') || lower.includes('empathy') || lower.includes('caring')) {
    return 'emotional';
  }
  if (lower.includes('analyz') || lower.includes('logic') || lower.includes('problem')) {
    return 'analytical';
  }
  if (lower.includes('creativ') || lower.includes('art') || lower.includes('design')) {
    return 'creative';
  }
  if (lower.includes('lead') || lower.includes('organiz') || lower.includes('motivat')) {
    return 'leadership';
  }
  
  return 'other';
}

export function generateStrengthInsight(pattern: StrengthPattern): string {
  const insights = [
    `I've noticed something about you over the past month... You've demonstrated ${pattern.strength} ${pattern.count} times. That's not a coincidence—that's a pattern. That's who you are.`,
    `So here's what I'm seeing: ${pattern.strength} keeps showing up in our conversations (${pattern.count} times this month). This isn't just a skill—it's a strength you naturally lean into.`,
    `Can we talk about something? You've shown ${pattern.strength} ${pattern.count} times in the last 30 days. Most people wouldn't even notice this about themselves. But I do. And I think it matters.`,
  ];

  return insights[Math.floor(Math.random() * insights.length)];
}

export function generateGrowthInvitation(pattern: StrengthPattern): string {
  const invitations: Record<SpottedStrength['category'], string[]> = {
    communication: [
      "Have you ever thought about teaching or mentoring? People with this gift often underestimate how rare it is.",
      "This could be developed further. Would you be interested in exploring public speaking or content creation?",
      "You have a way with words. Have you considered writing or coaching?",
    ],
    emotional: [
      "Have you ever explored counseling or coaching? Your emotional intelligence is genuinely rare.",
      "This level of emotional awareness could help a lot of people. Ever thought about peer counseling?",
      "You have a gift for making people feel heard. That's powerful. Want to explore where that could take you?",
    ],
    analytical: [
      "Your analytical mind is sharp. Have you thought about roles that involve problem-solving or strategy?",
      "This kind of logical thinking is valuable. Ever considered data analysis or research?",
      "You break down complex problems naturally. That's a skill people pay for.",
    ],
    creative: [
      "Your creative thinking stands out. Have you explored any creative projects or hobbies?",
      "This creative lens you have—that's special. Want to explore where it could go?",
      "You see things differently. That's creativity. Ever thought about design or innovation work?",
    ],
    leadership: [
      "You organize and motivate naturally. Have you considered leadership roles?",
      "This is leadership showing up. Even if you don't call yourself a leader, you are one.",
      "You bring people together and make things happen. That's leadership. Want to develop it further?",
    ],
    other: [
      "This strength you have—it's real and it's recurring. Want to explore how to use it more?",
      "You keep showing this ability. Have you thought about how to lean into it more intentionally?",
      "This isn't random. This is a pattern. What would it look like to build on this?",
    ],
  };

  const categoryInvitations = invitations[pattern.category];
  return categoryInvitations[Math.floor(Math.random() * categoryInvitations.length)];
}
