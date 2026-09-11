'use client';

import { useState, useEffect } from 'react';

interface VoiceControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onSpeechResult: (text: string) => void;
}

export default function VoiceControls({ enabled, onEnabledChange, onSpeechResult }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    }
  }, []);

  const startListening = () => {
    if (!isSupported || !enabled) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSpeechResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const speakText = (text: string) => {
    if (!enabled || typeof window === 'undefined') return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onEnabledChange(!enabled)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${enabled
            ? 'bg-teal-500 text-white'
            : 'bg-gray-200 text-gray-600'
          }
        `}
      >
        {enabled ? '🎤 音声ON' : '🔇 音声OFF'}
      </button>
      
      {enabled && (
        <button
          onClick={startListening}
          disabled={isListening}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
            }
          `}
        >
          {isListening ? '🎤 聞いています...' : '🎤 話す'}
        </button>
      )}
    </div>
  );
}
