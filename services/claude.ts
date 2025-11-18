// services/claude.ts - New service for Claude API via our backend

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text: string }>;
}

export interface ChatRequest {
  userId: string;
  systemPrompt: string;
  messages: ClaudeMessage[];
}

export interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Call our backend API to get AI response
 */
export async function getChatResponse(
  userId: string,
  systemPrompt: string,
  messages: ClaudeMessage[]
): Promise<string> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL not configured. Please check your .env file.');
  }

  console.log(`[Claude Service] Calling backend: ${apiUrl}/api/chat`);

  try {
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        systemPrompt,
        messages,
      } as ChatRequest),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = error.retryAfter || 60;
          throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
        }
      } catch (parseError) {
        // If error response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: ChatResponse = await response.json();

    console.log(`[Claude Service] Response received (${data.usage?.outputTokens || 0} tokens)`);

    // Extract text from Claude's response
    return data.message.content;
  } catch (error: any) {
    console.error('[Claude Service] Error:', error);

    // Provide user-friendly error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to backend. Please check your internet connection.');
    }

    if (error.message.includes('Rate limit')) {
      throw error; // Pass through rate limit errors
    }

    throw new Error(error.message || 'Failed to get AI response. Please try again.');
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
    });

    return response.ok;
  } catch (error) {
    console.error('[Claude Service] Health check failed:', error);
    return false;
  }
}

/**
 * Stream chat response (for future Tier 1+)
 */
export async function* streamChatResponse(
  userId: string,
  systemPrompt: string,
  messages: ClaudeMessage[]
): AsyncGenerator<string> {
  // TODO: Implement streaming in Tier 1
  const response = await getChatResponse(userId, systemPrompt, messages);
  yield response;
}
