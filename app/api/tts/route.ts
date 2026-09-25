import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, preflight } from '@/app/api/cors';

// Only use explicit TTS_API_KEY - do NOT fallback to OPENAI_API_KEY
// (which may be a DeepSeek chat key, not a TTS key)
const TTS_API_KEY = process.env.TTS_API_KEY;
const TTS_BASE_URL = process.env.TTS_BASE_URL || 'https://api.openai.com/v1';
const TTS_MODEL = process.env.TTS_MODEL || 'tts-1';
const TTS_VOICE = process.env.TTS_VOICE || 'nova';

interface TTSRequest {
  text: string;
}

export async function HEAD(request: NextRequest) {
  const headers = corsHeaders(request);
  if (!TTS_API_KEY) {
    return new NextResponse(null, { status: 503, headers });
  }
  return new NextResponse(null, { status: 200, headers });
}

/** アプリ版（Capacitor）からのプリフライト */
export function OPTIONS(request: NextRequest) {
  return preflight(request);
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);
  try {
    const body: TTSRequest = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text format' },
        { status: 400, headers }
      );
    }

    if (!TTS_API_KEY) {
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503, headers }
      );
    }

    const response = await fetch(`${TTS_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TTS_API_KEY}`,
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: TTS_VOICE,
        input: text,
      }),
    });

    if (!response.ok) {
      console.error('TTS API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'TTS service failed' },
        { status: response.status, headers }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
