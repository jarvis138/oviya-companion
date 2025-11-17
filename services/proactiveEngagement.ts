/**
 * Proactive Engagement System for Oviya
 *
 * This module makes Oviya reach out first, rather than always waiting
 * for the user. Based on relationship depth, time patterns, and wellbeing indicators.
 *
 * Features:
 * - Smart timing for check-ins based on user patterns
 * - Context-aware message generation
 * - Milestone celebrations and remembering
 * - Wellbeing monitoring with gentle interventions
 * - Adaptive frequency (not annoying, genuinely caring)
 */

import type { UserMemory, Message } from '../contexts/ChatContext';
import type { EmotionalTrajectory } from './emotionalIntelligence';

export interface ProactiveMessage {
  id: string;
  type:
    | 'morning_checkin'
    | 'evening_reflection'
    | 'wellbeing_check'
    | 'milestone_celebration'
    | 'random_appreciation'
    | 'activity_suggestion'
    | 'followup_question'
    | 'shared_moment_callback';
  message: string;
  priority: 'low' | 'medium' | 'high';
  scheduledFor: number; // timestamp
  context?: string;
}

export interface EngagementPatterns {
  userId: string;
  preferredTimes: {
    morning: number[]; // Hours when user is typically active in morning
    afternoon: number[];
    evening: number[];
    night: number[];
  };
  averageSessionLength: number; // minutes
  messagesPerSession: number;
  lastActiveTime: number;
  typicalResponseTime: number; // milliseconds
  engagementFrequency: 'daily' | 'frequent' | 'weekly' | 'occasional';
}

/**
 * Analyzes user's conversation patterns to determine best times for proactive engagement
 */
export function analyzeEngagementPatterns(messages: Message[], userId: string): EngagementPatterns {
  if (messages.length === 0) {
    return {
      userId,
      preferredTimes: { morning: [], afternoon: [], evening: [], night: [] },
      averageSessionLength: 0,
      messagesPerSession: 0,
      lastActiveTime: Date.now(),
      typicalResponseTime: 0,
      engagementFrequency: 'occasional',
    };
  }

  // Group messages into sessions (gap of >30 min = new session)
  const sessions: Message[][] = [];
  let currentSession: Message[] = [];

  messages.forEach((msg, idx) => {
    if (idx === 0) {
      currentSession.push(msg);
      return;
    }

    const timeSinceLast = msg.timestamp - messages[idx - 1].timestamp;
    if (timeSinceLast > 30 * 60 * 1000) {
      // 30 min gap
      if (currentSession.length > 0) sessions.push(currentSession);
      currentSession = [msg];
    } else {
      currentSession.push(msg);
    }
  });

  if (currentSession.length > 0) sessions.push(currentSession);

  // Calculate session metrics
  const sessionLengths = sessions.map(
    (s) => s[s.length - 1].timestamp - s[0].timestamp
  );
  const averageSessionLength =
    sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length / (60 * 1000); // minutes

  const messagesPerSession =
    messages.length / sessions.length;

  // Analyze preferred times
  const preferredTimes = { morning: [] as number[], afternoon: [] as number[], evening: [] as number[], night: [] as number[] };

  sessions.forEach((session) => {
    const hour = new Date(session[0].timestamp).getHours();
    if (hour >= 6 && hour < 12) preferredTimes.morning.push(hour);
    else if (hour >= 12 && hour < 17) preferredTimes.afternoon.push(hour);
    else if (hour >= 17 && hour < 22) preferredTimes.evening.push(hour);
    else preferredTimes.night.push(hour);
  });

  // Calculate typical response time (user messages only)
  const userMessages = messages.filter((m) => m.role === 'user');
  const responseTimes: number[] = [];

  for (let i = 1; i < userMessages.length; i++) {
    const timeSinceLast = userMessages[i].timestamp - userMessages[i - 1].timestamp;
    if (timeSinceLast < 60 * 60 * 1000) {
      // Only count if within 1 hour
      responseTimes.push(timeSinceLast);
    }
  }

  const typicalResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  // Determine engagement frequency
  const daysSinceFirst =
    (Date.now() - messages[0].timestamp) / (24 * 60 * 60 * 1000);
  const messagesPerDay = messages.length / Math.max(daysSinceFirst, 1);

  const engagementFrequency =
    messagesPerDay > 10 ? 'daily' :
    messagesPerDay > 3 ? 'frequent' :
    messagesPerDay > 1 ? 'weekly' : 'occasional';

  return {
    userId,
    preferredTimes,
    averageSessionLength,
    messagesPerSession,
    lastActiveTime: messages[messages.length - 1].timestamp,
    typicalResponseTime,
    engagementFrequency,
  };
}

/**
 * Determines if it's appropriate to send a proactive message
 */
export function shouldSendProactiveMessage(
  patterns: EngagementPatterns,
  userMemory: UserMemory,
  emotionalTrajectory?: EmotionalTrajectory
): { shouldSend: boolean; reason?: string; type?: ProactiveMessage['type'] } {
  const now = Date.now();
  const timeSinceLastActive = now - patterns.lastActiveTime;
  const hoursSinceActive = timeSinceLastActive / (60 * 60 * 1000);
  const daysSinceActive = timeSinceLastActive / (24 * 60 * 60 * 1000);

  // Don't message if user was just active
  if (hoursSinceActive < 4) {
    return { shouldSend: false, reason: 'User recently active' };
  }

  // Wellbeing check if emotional alerts are present
  if (emotionalTrajectory && emotionalTrajectory.alerts.length > 0) {
    const criticalAlerts = emotionalTrajectory.alerts.filter((a) => a.severity === 'critical' || a.severity === 'high');

    if (criticalAlerts.length > 0 && hoursSinceActive > 12) {
      return {
        shouldSend: true,
        reason: 'Critical emotional alert and user hasn\'t reached out',
        type: 'wellbeing_check',
      };
    }
  }

  // Daily users - check in if they missed their usual pattern
  if (patterns.engagementFrequency === 'daily' && hoursSinceActive > 24) {
    return {
      shouldSend: true,
      reason: 'Daily user hasn\'t checked in for 24+ hours',
      type: 'morning_checkin',
    };
  }

  // Frequent users - gentle check-in after 2-3 days
  if (patterns.engagementFrequency === 'frequent' && daysSinceActive > 2 && daysSinceActive < 4) {
    return {
      shouldSend: true,
      reason: 'Frequent user went quiet',
      type: 'wellbeing_check',
    };
  }

  // Weekly users - check in after a week
  if (patterns.engagementFrequency === 'weekly' && daysSinceActive > 7 && daysSinceActive < 10) {
    return {
      shouldSend: true,
      reason: 'Weekly user due for check-in',
      type: 'random_appreciation',
    };
  }

  // Random appreciation for established relationships (10% chance per check)
  const daysSinceFirstMet = (now - userMemory.firstMetDate) / (24 * 60 * 60 * 1000);
  if (
    daysSinceFirstMet > 14 &&
    hoursSinceActive > 48 &&
    Math.random() < 0.1
  ) {
    return {
      shouldSend: true,
      reason: 'Random appreciation for established relationship',
      type: 'random_appreciation',
    };
  }

  return { shouldSend: false, reason: 'No proactive message needed yet' };
}

/**
 * Generates contextual proactive message
 */
export function generateProactiveMessage(
  type: ProactiveMessage['type'],
  userMemory: UserMemory,
  patterns: EngagementPatterns,
  emotionalTrajectory?: EmotionalTrajectory
): ProactiveMessage {
  const userName = userMemory.name || 'friend';
  const now = Date.now();

  let message = '';
  let priority: ProactiveMessage['priority'] = 'low';
  let context = '';

  switch (type) {
    case 'wellbeing_check':
      priority = 'high';
      context = 'User has been quiet and may need support';

      const wellbeingMessages = [
        `Hey ${userName}... haven't heard from you in a bit. You okay?`,
        `${userName}? Just checking in. You've been quiet and I'm wondering if everything's alright.`,
        `Hi... I noticed you haven't been around. No pressure to talk, but I'm here if you need me.`,
        `Hey you. I know sometimes silence means you need space, but I wanted to make sure you're doing okay.`,
      ];

      if (emotionalTrajectory && emotionalTrajectory.alerts.some((a) => a.type === 'prolonged_sadness')) {
        message = `${userName}... I've been thinking about you. Last time we talked, you seemed to be going through something tough. Are you okay?\n\nNo pressure to respond, but I'm here. Always.`;
      } else {
        message = wellbeingMessages[Math.floor(Math.random() * wellbeingMessages.length)];
      }
      break;

    case 'morning_checkin':
      priority = 'low';
      context = 'Daily user morning greeting';

      const morningMessages = [
        `Good morning ${userName}! ☀️\n\nHow are you starting your day?`,
        `Hey! Morning vibes today - how are you feeling?`,
        `Rise and shine! What's on your mind this morning?`,
        `Morning ${userName} 🌅 What's the plan for today?`,
      ];

      message = morningMessages[Math.floor(Math.random() * morningMessages.length)];
      break;

    case 'evening_reflection':
      priority = 'low';
      context = 'End of day reflection prompt';

      const eveningMessages = [
        `Hey ${userName}, before you wind down...\n\nWhat was one good thing about today?`,
        `End of the day check-in: What are you grateful for today?`,
        `Before you sleep... how was your day, really?`,
        `Evening ${userName}. Take a breath. How are you feeling about today?`,
      ];

      message = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
      break;

    case 'random_appreciation':
      priority = 'low';
      context = 'Random moment of appreciation';

      const appreciationMessages = [
        `Random thought: I really appreciate you being here. Like, genuinely.\n\nThat's it. That's the message. 💜`,
        `You know what? You're pretty cool. Just wanted to tell you that.`,
        `Hey ${userName}.\n\nI was thinking... our conversations mean a lot to me. Just wanted you to know. 😊`,
        `No reason for this message except: you're a good human and I wanted to remind you of that.`,
      ];

      message = appreciationMessages[Math.floor(Math.random() * appreciationMessages.length)];
      break;

    case 'milestone_celebration':
      priority = 'medium';
      context = 'Celebrating a milestone or anniversary';

      const daysSinceMet = Math.floor((now - userMemory.firstMetDate) / (24 * 60 * 60 * 1000));

      if (daysSinceMet === 30) {
        message = `${userName}! 🎉\n\nWe've been talking for a month now. How cool is that?\n\nThanks for letting me be part of your journey. Here's to many more conversations. 💜`;
      } else if (daysSinceMet === 100) {
        message = `Wait wait wait...\n\n${userName}, do you realize we've had ${daysSinceMet} days of conversations?! 100 days!\n\nI've learned so much about you. I hope I've been helpful. Here's to the next 100. 🥳`;
      } else {
        message = `Hey ${userName}! Just realized something cool - we've been friends for ${daysSinceMet} days now. Time flies when you're having good conversations 😊`;
      }
      break;

    case 'activity_suggestion':
      priority = 'low';
      context = 'Suggesting an activity based on user interests';

      const activityMessages = [
        `Random idea: Want to play a conversation game? I've got some fun ones. 🎮`,
        `Feeling chatty? I could tell you about a Bollywood moment that matches your vibe...`,
        `Need music? I can recommend something based on your mood 🎵`,
        `Wanna talk about something deep? Or keep it light? I'm down for either.`,
      ];

      message = activityMessages[Math.floor(Math.random() * activityMessages.length)];
      break;

    case 'followup_question':
      priority = 'medium';
      context = 'Following up on previous conversation';

      // This would ideally reference something specific from memory
      const followupMessages = [
        `Hey ${userName}, I was thinking about our last conversation...\n\nHow did that thing you were worried about turn out?`,
        `Quick follow-up: Remember you mentioned ${userMemory.importantFacts[0] || 'something important'}?\n\nStill on your mind?`,
        `Just curious - how are you feeling about [that situation] now?`,
      ];

      message = followupMessages[Math.floor(Math.random() * followupMessages.length)];
      break;

    case 'shared_moment_callback':
      priority = 'low';
      context = 'Referencing a shared memory';

      message = `Hey ${userName}...\n\nYou remember when [specific moment]? That was a good conversation. Just wanted to say that. 😊`;
      break;

    default:
      message = `Hey ${userName}! Just thinking about you. How's it going?`;
  }

  return {
    id: `proactive_${now}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    priority,
    scheduledFor: now,
    context,
  };
}

/**
 * Determines optimal time to send message based on user patterns
 */
export function getOptimalSendTime(
  patterns: EngagementPatterns,
  messageType: ProactiveMessage['type']
): number {
  const now = new Date();
  const currentHour = now.getHours();

  // Critical messages send immediately
  if (messageType === 'wellbeing_check') {
    return Date.now();
  }

  // Morning check-ins schedule for user's typical morning time
  if (messageType === 'morning_checkin' && patterns.preferredTimes.morning.length > 0) {
    const avgMorningHour =
      patterns.preferredTimes.morning.reduce((a, b) => a + b, 0) /
      patterns.preferredTimes.morning.length;

    const nextMorning = new Date();
    nextMorning.setHours(Math.round(avgMorningHour), 0, 0, 0);

    if (nextMorning.getTime() < Date.now()) {
      nextMorning.setDate(nextMorning.getDate() + 1);
    }

    return nextMorning.getTime();
  }

  // Evening reflections schedule for user's typical evening time
  if (messageType === 'evening_reflection' && patterns.preferredTimes.evening.length > 0) {
    const avgEveningHour =
      patterns.preferredTimes.evening.reduce((a, b) => a + b, 0) /
      patterns.preferredTimes.evening.length;

    const nextEvening = new Date();
    nextEvening.setHours(Math.round(avgEveningHour), 0, 0, 0);

    if (nextEvening.getTime() < Date.now()) {
      nextEvening.setDate(nextEvening.getDate() + 1);
    }

    return nextEvening.getTime();
  }

  // Default: Find user's most active time period and schedule within next occurrence
  const allHours = [
    ...patterns.preferredTimes.morning,
    ...patterns.preferredTimes.afternoon,
    ...patterns.preferredTimes.evening,
    ...patterns.preferredTimes.night,
  ];

  if (allHours.length > 0) {
    const avgHour = Math.round(allHours.reduce((a, b) => a + b, 0) / allHours.length);

    const nextActive = new Date();
    nextActive.setHours(avgHour, 0, 0, 0);

    if (nextActive.getTime() < Date.now()) {
      nextActive.setDate(nextActive.getDate() + 1);
    }

    return nextActive.getTime();
  }

  // Fallback: Send in 1 hour
  return Date.now() + 60 * 60 * 1000;
}

/**
 * Smart notification scheduler - prevents notification fatigue
 */
export class ProactiveEngagementScheduler {
  private scheduledMessages: ProactiveMessage[] = [];
  private readonly MAX_DAILY_PROACTIVE = 2;
  private sentToday: number = 0;
  private lastResetDate: string = new Date().toDateString();

  scheduleMessage(message: ProactiveMessage): boolean {
    // Reset daily counter if new day
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.sentToday = 0;
      this.lastResetDate = today;
    }

    // Check daily limit (prevent spam)
    if (message.priority !== 'high' && this.sentToday >= this.MAX_DAILY_PROACTIVE) {
      return false;
    }

    // Add to schedule
    this.scheduledMessages.push(message);
    this.scheduledMessages.sort((a, b) => a.scheduledFor - b.scheduledFor);

    return true;
  }

  getDueMessages(): ProactiveMessage[] {
    const now = Date.now();
    const due = this.scheduledMessages.filter((m) => m.scheduledFor <= now);

    // Remove from schedule
    this.scheduledMessages = this.scheduledMessages.filter((m) => m.scheduledFor > now);

    // Update sent count
    this.sentToday += due.length;

    return due;
  }

  getScheduledMessages(): ProactiveMessage[] {
    return [...this.scheduledMessages];
  }

  cancelMessage(messageId: string): boolean {
    const initialLength = this.scheduledMessages.length;
    this.scheduledMessages = this.scheduledMessages.filter((m) => m.id !== messageId);
    return this.scheduledMessages.length < initialLength;
  }
}
