import { NextRequest, NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/prompts';
import { festivalScenarios } from '@/lib/festivalScenarios';
import { corsHeaders, preflight } from '@/app/api/cors';
import type {
  ChatMode,
  LanguageLevel,
  Message,
  BusinessScenario,
  DifficultyLevel,
  FestivalScenarioId,
} from '@/types';

interface ChatRequest {
  messages: Message[];
  mode: ChatMode;
  level: LanguageLevel;
  businessScenario?: BusinessScenario;
  festivalScenario?: FestivalScenarioId;
  businessDifficulty?: DifficultyLevel;
  successfulTurns?: number;
  bondLevel?: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-flash';
/** 思考モードを切るパラメータは DeepSeek 独自。ほかの OpenAI 互換 API には送らない。 */
const IS_DEEPSEEK = (() => {
  try {
    return /(^|\.)deepseek\.com$/.test(new URL(OPENAI_BASE_URL).hostname);
  } catch {
    return false;
  }
})();

/** 直近のやり取りだけ送ってトークンと遅延を抑える */
const MAX_HISTORY = 16;

/** live: false のときは reason に理由を入れる（定型文に落ちた原因を外から測るため） */
interface AIResult {
  text: string;
  live: boolean;
  reason?: string;
  usage?: unknown;
}

async function getAIResponse(body: ChatRequest): Promise<AIResult> {
  const {
    messages,
    mode,
    level,
    businessScenario,
    festivalScenario,
    businessDifficulty,
    successfulTurns,
    bondLevel,
  } = body;

  if (!OPENAI_API_KEY) {
    return { text: getMockResponse(body), live: false, reason: 'no-api-key' };
  }

  try {
    const systemPrompt = getSystemPrompt(
      mode,
      level,
      businessScenario,
      businessDifficulty,
      successfulTurns,
      festivalScenario,
      bondLevel
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.9,
        max_tokens: 400,
        // deepseek-v4-flash は既定で「考えてから答える」（effort: high）。考えた分も
        // max_tokens に数えられるため、考えるだけで使い切って本文が空になったり、
        // 途中で切れたりしていた。会話は返事の速さが命で、思考モードでは
        // temperature も効かないので、思考は切る。
        ...(IS_DEEPSEEK ? { thinking: { type: 'disabled' } } : {}),
      }),
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 200);
      throw new Error(`API error: ${response.status} ${detail}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content;
    if (!text) {
      throw new Error(
        `Empty completion (finish_reason=${choice?.finish_reason}, usage=${JSON.stringify(data.usage)})`
      );
    }
    return { text, live: true, usage: data.usage };
  } catch (error) {
    console.error('AI API error:', error);
    const reason = error instanceof Error ? error.message : String(error);
    return { text: getMockResponse(body), live: false, reason };
  }
}

/* ------------------------------------------------------------------ */
/*  APIキーが無くても「会話している感じ」が壊れないようにするフォールバック  */
/* ------------------------------------------------------------------ */

const FESTIVAL_FALLBACKS: Record<FestivalScenarioId, string[]> = {
  'arrival-checkin': [
    "Perfect, you're all set! Your wristband goes on the left. Your tent site is number 34 — head past the big tree and turn right. Need help with your bags?",
    "Got it. Re-entry is fine, just keep the wristband on. Anything else you want to know before you head in?",
  ],
  'first-hello': [
    "Nice to meet you! I'm Leo, from Berlin. This is my second time in Japan but my first Synapse. What about you?",
    "Oh really? That's cool. So what brought you all the way out here?",
  ],
  'about-your-work': [
    "An app! Okay, now I'm curious. What does it actually do?",
    "That's honestly impressive. How long have you been working on it?",
  ],
  'music-talk': [
    "Right?! The way he layered that bassline — unreal. Are you more into house or techno?",
    "You should check out this artist I saw last year. Do you want me to write it down?",
  ],
  'camping-tent': [
    "Ha, no worries — take one of my spare pegs. It gets windy here by the bay at night.",
    "I'm heading to the main stage around eleven. Want to walk over together?",
  ],
  'sauna-totonou': [
    "Wait, so you wash BEFORE going in? Okay, okay. And how long do I stay in there?",
    "Totonou… I love that there's a word for it. We definitely don't have that in English.",
  ],
  'food-drinks': [
    "One of those coming up! Do you want it spicy or mild?",
    "Oh that looks amazing. What is it? I have no idea what I'm looking at.",
  ],
  'workshop-art': [
    "Of course you can join — we just started. It takes about forty minutes. Have you done anything like this before?",
    "This piece is about connection, actually. Everyone adds one thread and it becomes a net.",
  ],
  'bonfire-deeptalk': [
    "Mm. I think most people never really ask themselves that. … What would you do if it worked?",
    "That's honest. Thanks for saying it. I think I'm scared of the same thing.",
  ],
  'swap-contacts': [
    "Perfect, I'll scan your code. Done — I just followed you. Are you in the Discord too?",
    "Definitely message me when the app is live. I want to try it.",
  ],
  'fukuoka-guide': [
    "Yatai! Okay, I'm writing that down. How do I get there from Hakata station?",
    "Motsunabe… is that the hotpot thing? Is it very spicy?",
  ],
  'rescue-phrases': [
    "Ah sorry — I talk way too fast. Let me try again, slower. Is the second stage better than the main one?",
    "Good, that's exactly how to ask. Okay, faster this time: what're you up to after this set?",
  ],
  'see-you-again': [
    "Same. Three days and it already feels like I've known you way longer.",
    "Okay — same time next year. Promise. Take care, alright?",
  ],
};

function getMockResponse(body: ChatRequest): string {
  const { mode, festivalScenario, messages } = body;
  const last = messages[messages.length - 1]?.content ?? '';
  const turn = messages.filter((m) => m.role === 'user').length;

  if (mode === 'festival' && festivalScenario && FESTIVAL_FALLBACKS[festivalScenario]) {
    const pool = FESTIVAL_FALLBACKS[festivalScenario];
    const base = pool[Math.min(turn - 1, pool.length - 1)] ?? pool[pool.length - 1];
    const scenario = festivalScenarios[festivalScenario];
    const hint = scenario.phrases.find((p) => p.star);

    // ごく簡単な検出だけして、学びのある返しにする
    if (/^i am |^i'm a /i.test(last.trim()) && /\bstudent|developer|designer\b/i.test(last)) {
      return base;
    }
    if (turn <= 1 && hint) {
      return `${base}\n\n<correction>\n{\n  "said": "${escapeJson(last.slice(0, 80))}",\n  "better": "${escapeJson(hint.en)}",\n  "why": "${escapeJson(hint.ja)} — この場面ではこの言い方がいちばん自然です。",\n  "severity": "minor"\n}\n</correction>`;
    }
    return base;
  }

  const lower = last.toLowerCase();
  if (/\b(hello|hi|hey)\b/.test(lower)) {
    return "Hey! Good to see you. How's it going today?";
  }
  if (lower.includes('weather')) {
    return "The weather's been really nice, actually. Do you prefer sunny days or rainy ones?";
  }
  if (mode === 'business') {
    return "That's a fair point. What timeline do you have in mind for it?";
  }
  return "That's interesting — tell me a bit more about that.";
}

function escapeJson(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);
  try {
    const body: ChatRequest = await request.json();

    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400, headers });
    }

    const { text, live, reason, usage } = await getAIResponse(body);
    return NextResponse.json({ response: text, live, reason, usage }, { headers });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}

/** クライアントが「AIが本当に繋がっているか」を確認するため */
export async function GET(request: NextRequest) {
  return NextResponse.json({ configured: Boolean(OPENAI_API_KEY) }, { headers: corsHeaders(request) });
}

/** アプリ版（Capacitor）からのプリフライト */
export function OPTIONS(request: NextRequest) {
  return preflight(request);
}
