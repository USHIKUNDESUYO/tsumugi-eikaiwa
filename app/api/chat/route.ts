import { NextRequest, NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/prompts';
import { ChatMode, LanguageLevel, Message } from '@/types';

interface ChatRequest {
  messages: Message[];
  mode: ChatMode;
  level: LanguageLevel;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function getAIResponse(messages: Message[], mode: ChatMode, level: LanguageLevel): Promise<string> {
  if (!OPENAI_API_KEY) {
    return getMockResponse(messages[messages.length - 1]?.content || '', mode);
  }

  try {
    const systemPrompt = getSystemPrompt(mode, level);
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, I had trouble responding. Could you try again?';
  } catch (error) {
    console.error('AI API error:', error);
    return getMockResponse(messages[messages.length - 1]?.content || '', mode);
  }
}

function getMockResponse(userMessage: string, mode: ChatMode): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! It's nice to meet you. How are you doing today?";
  }
  
  if (lowerMessage.includes('weather')) {
    return "The weather is a great topic! I hope you're having nice weather where you are. Do you prefer sunny days or rainy days?\n\n<correction>\n{\n  \"said\": \"weather\",\n  \"better\": \"the weather\",\n  \"why\": \"天気について話すときは 'the weather' と定冠詞を付けるのが自然です\",\n  \"severity\": \"minor\"\n}\n</correction>";
  }
  
  if (mode === 'meeting') {
    return "That's an interesting point. From my perspective, clear communication in meetings is essential for team success. What do you think about setting clear agendas before meetings?";
  }
  
  if (mode === 'vocab-drill') {
    return "Let's learn some useful vocabulary! The word 'collaborate' means to work together with others toward a common goal. For example: 'Our team collaborated on the project.' Can you make a sentence using 'collaborate'?";
  }
  
  return "That's interesting! Thank you for sharing. Could you tell me more about that? I'd love to hear your thoughts.";
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, mode, level } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const aiResponse = await getAIResponse(messages, mode, level);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
