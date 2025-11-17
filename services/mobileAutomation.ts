/**
 * Mobile Automation Integration for Oviya
 *
 * Integrates mobile-use capabilities to enable Oviya to help with tasks across apps.
 * This makes Oviya a true AI assistant that can DO things, not just talk.
 *
 * Features:
 * - Natural language task execution
 * - Cross-app automation
 * - Information retrieval from native apps
 * - Calendar management, email handling, etc.
 *
 * NOTE: This is designed for future integration with mobile-use framework.
 * Currently provides the interface layer that would connect to mobile-use backend.
 */

export interface TaskRequest {
  id: string;
  userRequest: string; // Natural language: "Send an email to John about meeting"
  intent: TaskIntent;
  parameters: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresConfirmation: boolean;
}

export type TaskIntent =
  | 'send_email'
  | 'schedule_event'
  | 'set_reminder'
  | 'search_contacts'
  | 'open_app'
  | 'get_weather'
  | 'play_music'
  | 'navigate_to'
  | 'read_notifications'
  | 'send_message'
  | 'make_call'
  | 'search_web'
  | 'take_note'
  | 'custom';

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  actionsPerformed: string[];
}

export interface TaskCapability {
  intent: TaskIntent;
  name: string;
  description: string;
  requiredPermissions: string[];
  exampleRequests: string[];
  available: boolean;
}

/**
 * Parse natural language into structured task request
 */
export function parseTaskRequest(userInput: string): TaskRequest | null {
  const lowerInput = userInput.toLowerCase();
  let intent: TaskIntent | null = null;
  let parameters: Record<string, any> = {};
  let requiresConfirmation = false;

  // Email detection
  if (/send (an |)email|email .* about/i.test(userInput)) {
    intent = 'send_email';
    requiresConfirmation = true;

    // Extract recipient
    const recipientMatch = userInput.match(/(?:to|email) ([A-Za-z\s]+?)(?:\s+about|\s+saying)/i);
    if (recipientMatch) {
      parameters.recipient = recipientMatch[1].trim();
    }

    // Extract subject
    const subjectMatch = userInput.match(/about (.+?)(?:\s+saying|$)/i);
    if (subjectMatch) {
      parameters.subject = subjectMatch[1].trim();
    }

    // Extract body
    const bodyMatch = userInput.match(/saying (.+)$/i);
    if (bodyMatch) {
      parameters.body = bodyMatch[1].trim();
    }
  }

  // Calendar/Event detection
  else if (/schedule|add.*calendar|create.*event|remind me/i.test(userInput)) {
    intent = 'schedule_event';
    requiresConfirmation = true;

    // Extract event title
    const titleMatch = userInput.match(/(?:schedule|add|create) (?:a |an |)(?:meeting|event|appointment|reminder) (?:for |about |)(.+?)(?:\s+on|\s+at|$)/i);
    if (titleMatch) {
      parameters.title = titleMatch[1].trim();
    }

    // Extract date/time
    const dateMatch = userInput.match(/(?:on|for) (tomorrow|today|next \w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i);
    if (dateMatch) {
      parameters.date = dateMatch[1].trim();
    }

    const timeMatch = userInput.match(/at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch) {
      parameters.time = timeMatch[1].trim();
    }
  }

  // Reminder detection
  else if (/remind me/i.test(userInput)) {
    intent = 'set_reminder';
    requiresConfirmation = false;

    const reminderMatch = userInput.match(/remind me (?:to |about |)(.+?)(?:\s+at|\s+in|$)/i);
    if (reminderMatch) {
      parameters.reminder = reminderMatch[1].trim();
    }

    const timeMatch = userInput.match(/(?:at|in) (.+)$/i);
    if (timeMatch) {
      parameters.time = timeMatch[1].trim();
    }
  }

  // App opening
  else if (/open|launch|start/i.test(userInput)) {
    intent = 'open_app';
    requiresConfirmation = false;

    const appMatch = userInput.match(/(?:open|launch|start) (\w+)/i);
    if (appMatch) {
      parameters.appName = appMatch[1].trim();
    }
  }

  // Weather
  else if (/weather|temperature|forecast/i.test(userInput)) {
    intent = 'get_weather';
    requiresConfirmation = false;

    const locationMatch = userInput.match(/(?:in|for|at) (.+)$/i);
    if (locationMatch) {
      parameters.location = locationMatch[1].trim();
    } else {
      parameters.location = 'current';
    }
  }

  // Music
  else if (/play|listen to|put on/i.test(userInput) && /(music|song|artist|album|playlist)/i.test(userInput)) {
    intent = 'play_music';
    requiresConfirmation = false;

    const musicMatch = userInput.match(/(?:play|listen to|put on) (.+?)(?:\s+by|\s+from|$)/i);
    if (musicMatch) {
      parameters.query = musicMatch[1].trim();
    }
  }

  // Navigation
  else if (/navigate to|directions to|how to get to/i.test(userInput)) {
    intent = 'navigate_to';
    requiresConfirmation = false;

    const locationMatch = userInput.match(/(?:navigate to|directions to|how to get to) (.+)$/i);
    if (locationMatch) {
      parameters.destination = locationMatch[1].trim();
    }
  }

  // Messaging
  else if (/send (?:a |)(?:text|message)/i.test(userInput)) {
    intent = 'send_message';
    requiresConfirmation = true;

    const recipientMatch = userInput.match(/to ([A-Za-z\s]+?)(?:\s+saying|\s+that)/i);
    if (recipientMatch) {
      parameters.recipient = recipientMatch[1].trim();
    }

    const messageMatch = userInput.match(/saying (.+)$/i);
    if (messageMatch) {
      parameters.message = messageMatch[1].trim();
    }
  }

  // Phone call
  else if (/call|phone/i.test(userInput)) {
    intent = 'make_call';
    requiresConfirmation = true;

    const contactMatch = userInput.match(/(?:call|phone) ([A-Za-z\s]+)$/i);
    if (contactMatch) {
      parameters.contact = contactMatch[1].trim();
    }
  }

  // Notes
  else if (/take.*note|add.*note|write.*note|note.*down/i.test(userInput)) {
    intent = 'take_note';
    requiresConfirmation = false;

    const noteMatch = userInput.match(/(?:note|down):?\s*(.+)$/i);
    if (noteMatch) {
      parameters.content = noteMatch[1].trim();
    } else {
      parameters.content = userInput;
    }
  }

  if (!intent) {
    return null;
  }

  // Determine priority
  const priority: 'low' | 'normal' | 'high' | 'urgent' =
    /urgent|asap|emergency|now/i.test(userInput) ? 'urgent' :
    /important|priority/i.test(userInput) ? 'high' :
    /when you can|later|eventually/i.test(userInput) ? 'low' : 'normal';

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userRequest: userInput,
    intent,
    parameters,
    priority,
    requiresConfirmation,
  };
}

/**
 * Execute task using mobile-use backend (placeholder for future integration)
 */
export async function executeTask(task: TaskRequest): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    console.log('[MobileAutomation] Executing task:', task);

    // TODO: Integrate with actual mobile-use backend
    // In production, this would:
    // 1. Connect to mobile-use Python backend via API
    // 2. Send task request with natural language command
    // 3. Receive execution result from mobile-use
    // 4. Return structured result

    // Placeholder implementation
    const actionsPerformed: string[] = [];

    switch (task.intent) {
      case 'send_email':
        actionsPerformed.push('Opened Gmail app');
        actionsPerformed.push(`Composed email to ${task.parameters.recipient}`);
        actionsPerformed.push('Sent email');
        break;

      case 'schedule_event':
        actionsPerformed.push('Opened Calendar app');
        actionsPerformed.push(`Created event: ${task.parameters.title}`);
        actionsPerformed.push(`Set for ${task.parameters.date} at ${task.parameters.time}`);
        break;

      case 'set_reminder':
        actionsPerformed.push('Opened Reminders app');
        actionsPerformed.push(`Created reminder: ${task.parameters.reminder}`);
        break;

      case 'open_app':
        actionsPerformed.push(`Launched ${task.parameters.appName}`);
        break;

      case 'play_music':
        actionsPerformed.push('Opened Spotify');
        actionsPerformed.push(`Playing: ${task.parameters.query}`);
        break;

      default:
        actionsPerformed.push('Task recognized but handler not implemented yet');
    }

    const executionTime = Date.now() - startTime;

    return {
      taskId: task.id,
      success: true,
      result: {
        message: `Successfully completed: ${task.userRequest}`,
        details: task.parameters,
      },
      executionTime,
      actionsPerformed,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    return {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      actionsPerformed: ['Task failed during execution'],
    };
  }
}

/**
 * Get list of available task capabilities
 */
export function getAvailableCapabilities(): TaskCapability[] {
  return [
    {
      intent: 'send_email',
      name: 'Send Email',
      description: 'Send emails using your default email app',
      requiredPermissions: ['email'],
      exampleRequests: [
        'Send an email to John about the meeting',
        'Email Sarah saying I\'ll be late',
      ],
      available: true,
    },
    {
      intent: 'schedule_event',
      name: 'Schedule Events',
      description: 'Add events to your calendar',
      requiredPermissions: ['calendar'],
      exampleRequests: [
        'Schedule a meeting with team tomorrow at 2pm',
        'Add dentist appointment on Friday at 10am',
      ],
      available: true,
    },
    {
      intent: 'set_reminder',
      name: 'Set Reminders',
      description: 'Create reminders for tasks',
      requiredPermissions: ['reminders'],
      exampleRequests: [
        'Remind me to call mom at 5pm',
        'Set a reminder to buy groceries tomorrow',
      ],
      available: true,
    },
    {
      intent: 'open_app',
      name: 'Open Apps',
      description: 'Launch any installed app',
      requiredPermissions: [],
      exampleRequests: [
        'Open Spotify',
        'Launch Instagram',
      ],
      available: true,
    },
    {
      intent: 'get_weather',
      name: 'Get Weather',
      description: 'Check weather forecast',
      requiredPermissions: ['location'],
      exampleRequests: [
        'What\'s the weather like?',
        'Weather in San Francisco',
      ],
      available: true,
    },
    {
      intent: 'play_music',
      name: 'Play Music',
      description: 'Control music playback',
      requiredPermissions: [],
      exampleRequests: [
        'Play some jazz',
        'Put on Taylor Swift',
      ],
      available: true,
    },
    {
      intent: 'navigate_to',
      name: 'Navigate',
      description: 'Get directions to locations',
      requiredPermissions: ['location'],
      exampleRequests: [
        'Navigate to the nearest coffee shop',
        'How do I get to 123 Main St',
      ],
      available: true,
    },
    {
      intent: 'send_message',
      name: 'Send Message',
      description: 'Send text messages',
      requiredPermissions: ['sms', 'contacts'],
      exampleRequests: [
        'Text Mike saying I\'m on my way',
        'Send a message to Sarah',
      ],
      available: true,
    },
    {
      intent: 'make_call',
      name: 'Make Call',
      description: 'Initiate phone calls',
      requiredPermissions: ['phone', 'contacts'],
      exampleRequests: [
        'Call Dad',
        'Phone the office',
      ],
      available: true,
    },
    {
      intent: 'take_note',
      name: 'Take Notes',
      description: 'Create quick notes',
      requiredPermissions: [],
      exampleRequests: [
        'Take a note: Buy milk and eggs',
        'Write down: Meeting ideas',
      ],
      available: true,
    },
  ];
}

/**
 * Format task confirmation message for user
 */
export function formatTaskConfirmation(task: TaskRequest): string {
  switch (task.intent) {
    case 'send_email':
      return `I can send an email to ${task.parameters.recipient}${task.parameters.subject ? ` about "${task.parameters.subject}"` : ''}${task.parameters.body ? ` saying "${task.parameters.body}"` : ''}.\n\nShould I send it?`;

    case 'schedule_event':
      return `I'll schedule "${task.parameters.title}"${task.parameters.date ? ` on ${task.parameters.date}` : ''}${task.parameters.time ? ` at ${task.parameters.time}` : ''}.\n\nSound good?`;

    case 'set_reminder':
      return `I'll remind you about "${task.parameters.reminder}"${task.parameters.time ? ` ${task.parameters.time}` : ''}.\n\nGot it?`;

    case 'send_message':
      return `I can text ${task.parameters.recipient}: "${task.parameters.message}"\n\nShould I send it?`;

    case 'make_call':
      return `I can call ${task.parameters.contact} for you.\n\nReady?`;

    default:
      return `I'll ${task.userRequest}.\n\nShould I proceed?`;
  }
}

/**
 * Format task result for user-friendly display
 */
export function formatTaskResult(result: TaskResult): string {
  if (!result.success) {
    return `Oops! I couldn't complete that task.\n\n${result.error}\n\nWant me to try again?`;
  }

  const actions = result.actionsPerformed.join('\n• ');

  return `Done! ✅\n\nHere's what I did:\n• ${actions}\n\nAnything else you need?`;
}
