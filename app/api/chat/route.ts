import { NextRequest, NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/prompts';
import { ChatMode, LanguageLevel, Message, BusinessScenario, DifficultyLevel } from '@/types';

interface ChatRequest {
  messages: Message[];
  mode: ChatMode;
  level: LanguageLevel;
  businessScenario?: BusinessScenario;
  businessDifficulty?: DifficultyLevel;
  successfulTurns?: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function getAIResponse(
  messages: Message[], 
  mode: ChatMode, 
  level: LanguageLevel,
  businessScenario?: BusinessScenario,
  businessDifficulty?: DifficultyLevel,
  successfulTurns?: number
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return getMockResponse(messages[messages.length - 1]?.content || '', mode, businessScenario);
  }

  try {
    const systemPrompt = getSystemPrompt(mode, level, businessScenario, businessDifficulty, successfulTurns);
    
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
    return getMockResponse(messages[messages.length - 1]?.content || '', mode, businessScenario);
  }
}

function getMockResponse(userMessage: string, mode: ChatMode, businessScenario?: BusinessScenario): string {
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
  
  if (mode === 'business') {
    const businessMockResponses: Record<string, string> = {
      'meeting-basics': "That's a good point. I think we should also consider the timeline. When do you think we can complete this phase?\n\n<correction>\n{\n  \"said\": \"good point\",\n  \"better\": \"That's a good point\" or \"That's an excellent point\",\n  \"why\": \"ビジネス会議では 'That's a...' と完全な文で始めるのがより丁寧です\",\n  \"severity\": \"minor\"\n}\n</correction>",
      'email-tone': "Thank you for your email. I would appreciate it if you could provide more details about the project timeline. Please let me know if you need any additional information.",
      'presentation-qa': "That's a great question. Let me clarify the data from slide 3. Our growth rate increased by 15% year-over-year. Does that answer your question?",
      'small-talk-work': "My weekend was great, thanks for asking! I went hiking. How about yours? By the way, have you had a chance to review the proposal I sent last week?",
      'negotiation': "I appreciate your proposal. However, our timeline is quite tight. Would it be possible to move the deadline to next Friday instead of Monday?",
      'phone-video': "Yes, I can hear you fine now. Thanks for checking! Let's move on to the main agenda. Can everyone see the slide I'm sharing?",
    };
    
    return businessMockResponses[businessScenario || 'meeting-basics'] || businessMockResponses['meeting-basics'];
  }
  
  return "That's interesting! Thank you for sharing. Could you tell me more about that? I'd love to hear your thoughts.";
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, mode, level, businessScenario, businessDifficulty, successfulTurns } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const aiResponse = await getAIResponse(
      messages, 
      mode, 
      level, 
      businessScenario, 
      businessDifficulty, 
      successfulTurns
    );

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
