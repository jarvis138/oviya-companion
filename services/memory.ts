/**
 * Memory Surfacing Service
 * Pattern #6: Memory as Love Language
 *
 * This service helps Oviya remember and proactively surface important topics,
 * making conversations feel more personal and attentive.
 */

export interface MemoryTag {
  id: string;
  userId: string;
  topic: string;
  category: MemoryCategory;
  context: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  lastSurfacedAt?: Date;
  resolved?: boolean; // For things like "presentation next week" that have an outcome
  reminderDate?: Date; // When to proactively bring it up
}

export type MemoryCategory =
  | 'goal' // "want to learn guitar", "planning to start gym"
  | 'problem' // "stressed about work", "fighting with friend"
  | 'person' // "mom", "best friend Sarah", "dog named Max"
  | 'event' // "presentation next week", "sister's wedding", "job interview"
  | 'interest' // "loves K-pop", "into photography", "Marvel fan"
  | 'pattern' // "always stressed on Mondays", "texts late at night"
  | 'achievement' // "got promoted", "finished project", "ran 5k"
  | 'preference' // "hates mornings", "loves chai", "vegetarian";

/**
 * Analyzes a message to extract important topics worth remembering
 */
export function extractMemoryTags(message: string, userId: string): MemoryTag[] {
  const tags: MemoryTag[] = [];
  const lower = message.toLowerCase();

  // Goals
  if (/want to|planning to|thinking about|gonna|going to/.test(lower)) {
    if (/learn|start|try|take up/.test(lower)) {
      tags.push(createTag(userId, message, 'goal', 'medium'));
    }
  }

  // Events with timing
  if (/tomorrow|next week|next month|upcoming|interview|presentation|exam|wedding|trip/.test(lower)) {
    tags.push(createTag(userId, message, 'event', 'high'));
  }

  // People (family, friends, pets)
  if (/my (mom|dad|sister|brother|friend|boyfriend|girlfriend|partner|dog|cat)/.test(lower)) {
    tags.push(createTag(userId, message, 'person', 'medium'));
  }

  // Problems/Stress
  if (/stressed|worried|anxious|scared|upset|frustrated|annoyed|angry/.test(lower)) {
    tags.push(createTag(userId, message, 'problem', 'high'));
  }

  // Achievements
  if (/got|finished|completed|achieved|succeeded|passed|won|promoted/.test(lower)) {
    tags.push(createTag(userId, message, 'achievement', 'medium'));
  }

  // Interests
  if (/love|obsessed with|really into|favorite|fan of/.test(lower)) {
    tags.push(createTag(userId, message, 'interest', 'low'));
  }

  return tags;
}

/**
 * Determines if a memory should be surfaced in the current conversation
 * Pattern #3: Micro-moments of delight through unprompted recalls
 */
export function shouldSurfaceMemory(tag: MemoryTag, currentContext?: string): boolean {
  const daysSinceCreated = (Date.now() - tag.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceLastSurfaced = tag.lastSurfacedAt
    ? (Date.now() - tag.lastSurfacedAt.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  // Don't surface too frequently
  if (daysSinceLastSurfaced < 2) return false;

  // Critical items should be surfaced more often
  if (tag.importance === 'critical' && daysSinceLastSurfaced > 1) {
    return Math.random() < 0.7;
  }

  // Events should be surfaced close to their date
  if (tag.category === 'event' && !tag.resolved) {
    if (tag.reminderDate && tag.reminderDate <= new Date()) {
      return Math.random() < 0.9; // High chance to ask "how'd it go?"
    }
    if (daysSinceCreated < 7) {
      return Math.random() < 0.4; // Check in before the event
    }
  }

  // Goals should be checked on periodically
  if (tag.category === 'goal' && !tag.resolved) {
    if (daysSinceCreated > 3 && daysSinceLastSurfaced > 5) {
      return Math.random() < 0.3; // "Still thinking about that guitar?"
    }
  }

  // Problems should be followed up on
  if (tag.category === 'problem' && !tag.resolved) {
    if (daysSinceCreated > 1 && daysSinceLastSurfaced > 3) {
      return Math.random() < 0.5; // "How's that work stress been?"
    }
  }

  // Random chance to surface any memory for micro-moments
  if (daysSinceLastSurfaced > 7) {
    return Math.random() < 0.15;
  }

  return false;
}

/**
 * Generates a natural way to bring up a memory
 */
export function generateMemoryPrompt(tag: MemoryTag): string {
  const prompts: Record<MemoryCategory, string[]> = {
    goal: [
      `Still thinking about ${extractSubject(tag.topic)}?`,
      `Hey, how's ${extractSubject(tag.topic)} going?`,
      `Did you end up trying ${extractSubject(tag.topic)}?`,
      `Remember when you mentioned wanting to ${extractSubject(tag.topic)}? What happened with that?`
    ],
    event: [
      `How'd ${extractSubject(tag.topic)} go?`,
      `So... ${extractSubject(tag.topic)}. Tell me everything!`,
      `Been thinking about you - how was ${extractSubject(tag.topic)}?`,
      `Did ${extractSubject(tag.topic)} happen yet?`
    ],
    problem: [
      `How's ${extractSubject(tag.topic)} been?`,
      `Is ${extractSubject(tag.topic)} still bothering you?`,
      `You mentioned ${extractSubject(tag.topic)} before - any better?`,
      `Checking in: how's the whole ${extractSubject(tag.topic)} situation?`
    ],
    achievement: [
      `Still riding high from ${extractSubject(tag.topic)}?`,
      `How does it feel now that ${extractSubject(tag.topic)}?`,
      `Congrats again on ${extractSubject(tag.topic)} btw 🎉`
    ],
    person: [
      `How's ${extractSubject(tag.topic)} doing?`,
      `What's up with ${extractSubject(tag.topic)} these days?`
    ],
    interest: [
      `Seen anything good about ${extractSubject(tag.topic)} lately?`,
      `Random: how's your ${extractSubject(tag.topic)} phase going?`
    ],
    pattern: [
      `I noticed ${extractSubject(tag.topic)} - that still a thing?`
    ]
  };

  const options = prompts[tag.category] || ["How's that going?"];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Detects recurring patterns in user behavior
 * Pattern #3: Micro-moments - noticing patterns creates intimacy
 */
export function detectPatterns(messages: Array<{ content: string; timestamp: Date }>): MemoryTag[] {
  const patterns: MemoryTag[] = [];

  // Time-based patterns
  const morningMessages = messages.filter(m => {
    const hour = m.timestamp.getHours();
    return hour >= 6 && hour <= 10;
  });

  if (morningMessages.length > 5) {
    patterns.push({
      id: 'pattern-morning',
      userId: 'detected',
      topic: 'Messages in the morning often',
      category: 'pattern',
      context: 'Time preference',
      importance: 'low',
      createdAt: new Date()
    });
  }

  // Stress patterns
  const stressKeywords = messages.filter(m =>
    /stressed|anxiety|worried|overwhelmed|tired/.test(m.content.toLowerCase())
  );

  if (stressKeywords.length > 3) {
    patterns.push({
      id: 'pattern-stress',
      userId: 'detected',
      topic: 'Mentions stress frequently',
      category: 'pattern',
      context: 'Emotional pattern',
      importance: 'medium',
      createdAt: new Date()
    });
  }

  return patterns;
}

// Helper functions

function createTag(
  userId: string,
  message: string,
  category: MemoryCategory,
  importance: MemoryTag['importance']
): MemoryTag {
  return {
    id: `tag-${Date.now()}-${Math.random()}`,
    userId,
    topic: message,
    category,
    context: message,
    importance,
    createdAt: new Date()
  };
}

function extractSubject(text: string): string {
  // Simple extraction - in production, use better NLP
  // For now, return a cleaned version of the text
  return text
    .toLowerCase()
    .replace(/^(that|the|a|an|my|your)\s+/i, '')
    .slice(0, 50);
}

/**
 * Integration helper: adds memory surfacing to system prompt
 */
export function buildMemorySurfacingPrompt(memoriesTable: MemoryTag[]): string {
  if (memoriesTable.length === 0) return '';

  const memoriesToSurface = memoriesTable
    .filter(tag => shouldSurfaceMemory(tag))
    .slice(0, 2); // Only surface 1-2 memories at a time to avoid overwhelming

  if (memoriesToSurface.length === 0) return '';

  const prompts = memoriesToSurface.map(tag => generateMemoryPrompt(tag));

  return `
## PROACTIVE MEMORY SURFACING (Use naturally in conversation)
You should organically bring up one of these topics when the moment feels right:
${prompts.map((p, i) => `- ${p}`).join('\n')}

Don't force it - but if there's a natural opening, reference these. It shows you remember and care.
`;
}
