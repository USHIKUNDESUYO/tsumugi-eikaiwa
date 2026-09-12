'use client';

import { useState, useEffect, useRef } from 'react';
import { stopAllSpeech, unlockIOSAudio } from '@/lib/ttsVoice';

interface VoiceControlsProps {
  enabled: boolean;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onSpeechResult: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function recognitionConstructor() {
  const browser = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}

export default function VoiceControls(props: VoiceControlsProps) {
  const { enabled, disabled = false, onEnabledChange } = props;
  const [supported, setSupported] = useState<boolean | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<Recognition | null>(null);
  const callbacks = useRef(props);

  // Recognition outlives renders; always use the latest parent callbacks.
  useEffect(() => { callbacks.current = props; });
  useEffect(() => {
    // Detect browser APIs only after hydration; the server has no speech APIs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(Boolean(recognitionConstructor()));
    setCanSpeak(Boolean(window.speechSynthesis));
    return () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
        recognition.abort();
        callbacks.current.onListeningChange?.(false);
      }
    };
  }, []);

  const cancelListening = () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
    }
    setIsListening(false);
    setTranscript('');
    callbacks.current.onListeningChange?.(false);
  };

  const startListening = () => {
    const Constructor = recognitionConstructor();
    if (!Constructor || disabled || recognitionRef.current) return;
    setError('');
    setTranscript('');
    // Cancel previous speech BEFORE warming up, and start STT in this tap.
    stopAllSpeech();
    callbacks.current.onSpeakingChange?.(false);
    unlockIOSAudio();
    if (!enabled) onEnabledChange(true);

    const recognition = new Constructor();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    let finalText = '';
    setIsListening(true);
    callbacks.current.onListeningChange?.(true);

    recognition.onstart = () => setError('');
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const results = Array.from(event.results);
      setTranscript(results.map(result => result[0].transcript).join(' '));
      finalText = results.filter(result => result.isFinal).map(result => result[0].transcript).join(' ').trim();
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('マイクの許可を確認して、もう一度「話す」を押してください。');
      } else if (event.error === 'no-speech') {
        setError('声を聞き取れませんでした。もう一度話してください。');
      } else if (event.error === 'network') {
        setError('音声認識に接続できません。通信を確認してください。');
      } else {
        setError('音声入力を開始できませんでした。もう一度お試しください。');
      }
      cancelListening();
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setIsListening(false);
      callbacks.current.onListeningChange?.(false);
      setTranscript('');
      // Submit once, after STT releases the microphone, so TTS can answer.
      if (finalText) callbacks.current.onSpeechResult(finalText);
      else setError('声を聞き取れませんでした。もう一度話してください。');
    };
    try {
      recognition.start();
    } catch {
      cancelListening();
      setError('音声入力を開始できませんでした。もう一度お試しください。');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 sm:max-w-sm">
        {supported && (
          <button type="button" onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
            disabled={disabled && !isListening} aria-pressed={isListening}
            className={`min-h-11 flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${isListening ? 'bg-rose-600' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {isListening ? '■ 話し終わる' : '🎤 話す'}
          </button>
        )}
        <button type="button" disabled={!canSpeak} aria-pressed={enabled}
          onClick={() => {
            if (enabled) { cancelListening(); stopAllSpeech(); }
            else unlockIOSAudio();
            onEnabledChange(!enabled);
          }}
          className="min-h-11 rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600 disabled:opacity-50">
          {enabled ? '🔊 読み上げON' : '🔇 読み上げOFF'}
        </button>
      </div>
      {isListening && <p role="status" className="max-h-16 overflow-y-auto text-sm text-teal-800">{transcript || '聞いています。英語で話してください…'}</p>}
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      {supported === false && <p className="text-xs text-gray-500">音声入力に対応していません。キーボードのマイク、または文字入力をお使いください。</p>}
    </div>
  );
}
