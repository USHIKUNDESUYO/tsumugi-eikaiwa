'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeTTSVoices, getSelectedVoiceName, onVoiceSelected } from '@/lib/ttsVoice';

interface VoiceControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onSpeechResult: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  voiceSource?: 'cloud' | 'device' | null;
}

type SupportState = 'supported' | 'unsupported' | 'permission-denied' | 'checking';
type ErrorState = null | 'not-allowed' | 'no-speech' | 'network' | 'other';

export default function VoiceControls({ 
  enabled, 
  onEnabledChange, 
  onSpeechResult,
  onListeningChange,
  onSpeakingChange,
  voiceSource
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [supportState, setSupportState] = useState<SupportState>('checking');
  const [errorState, setErrorState] = useState<ErrorState>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('Loading...');
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSupportState('unsupported');
      return;
    }

    const hasAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSupportState(hasAPI ? 'supported' : 'unsupported');
    
    // Initialize TTS voices
    initializeTTSVoices();
    setSelectedVoiceName(getSelectedVoiceName());
    
    // Subscribe to voice updates
    const unsubscribe = onVoiceSelected((result) => {
      setSelectedVoiceName(result.name);
    });
    
    return unsubscribe;
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      onSpeakingChange?.(false);
    }
  }, [onSpeakingChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  const startListening = () => {
    if (supportState !== 'supported' || !enabled || isListening) return;

    setHasInteracted(true);
    setErrorState(null);
    
    stopSpeaking();

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorState(null);
        onListeningChange?.(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          onSpeechResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setSupportState('permission-denied');
            setErrorState('not-allowed');
            break;
          case 'no-speech':
            setErrorState('no-speech');
            break;
          case 'network':
            setErrorState('network');
            break;
          default:
            setErrorState('other');
        }
        
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setErrorState('other');
      setIsListening(false);
      onListeningChange?.(false);
    }
  };

  const handleEnableToggle = () => {
    if (!enabled) {
      setHasInteracted(true);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const testUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(testUtterance);
        window.speechSynthesis.cancel();
      }
    } else {
      stopListening();
      stopSpeaking();
    }
    onEnabledChange(!enabled);
  };

  const getErrorMessage = (): string | null => {
    if (supportState === 'permission-denied') {
      return '⚠️ マイクの許可が必要です';
    }
    if (supportState === 'unsupported') {
      return 'このブラウザは音声認識に対応していません';
    }
    
    switch (errorState) {
      case 'not-allowed':
        return '⚠️ マイクの使用が許可されていません';
      case 'no-speech':
        return '音声が検出されませんでした。もう一度お試しください';
      case 'network':
        return 'ネットワークエラー。接続を確認してください';
      case 'other':
        return 'エラーが発生しました。もう一度お試しください';
      default:
        return null;
    }
  };

  if (supportState === 'checking') {
    return null;
  }

  const errorMessage = getErrorMessage();
  const canUseMic = supportState === 'supported' && enabled;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={handleEnableToggle}
          className={`
            px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-medium transition-all touch-manipulation
            ${enabled
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            }
            ${supportState === 'unsupported' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={supportState === 'unsupported'}
          title={enabled ? '音声をOFFにする' : '音声をONにする'}
        >
          {enabled ? '🎤' : '🔇'}
        </button>
        
        {canUseMic && (
          <button
            onClick={startListening}
            disabled={isListening}
            className={`
              px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-medium transition-all touch-manipulation
              ${isListening
                ? 'bg-red-500 text-white animate-pulse shadow-sm'
                : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 active:bg-teal-200'
              }
              disabled:opacity-50
            `}
            title={isListening ? '聞いています' : 'タップして話す'}
          >
            {isListening ? '⏺' : '話す'}
          </button>
        )}
      </div>
      
      {errorMessage && (
        <div className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded max-w-[200px]">
          {errorMessage}
        </div>
      )}
      
      {supportState === 'unsupported' && (
        <div className="text-[10px] text-gray-500 px-2">
          テキスト入力をご利用ください
        </div>
      )}
    </div>
  );
}
