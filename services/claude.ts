// services/claude.ts - New service for Claude API via our backend

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  userId: string;
  systemPrompt: string;
  messages: ClaudeMessage[];
}

export interface ChatResponse {
  content: Array<{ type: string; text: string }>;
  role: string;
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
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: ChatResponse = await response.json();

    // Extract text from Claude's response
    const textContent = data.content.find(c => c.type === 'text');
    return textContent?.text || '';
  } catch (error) {
    console.error('[Claude Service] Error:', error);
    throw error;
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
