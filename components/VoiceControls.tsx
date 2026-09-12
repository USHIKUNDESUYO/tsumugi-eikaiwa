'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeTTSVoices, getSelectedVoiceName, onVoiceSelected } from '@/lib/ttsVoice';

interface VoiceControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onSpeechResult: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

type SupportState = 'supported' | 'unsupported' | 'permission-denied' | 'checking';
type ErrorState = null | 'not-allowed' | 'no-speech' | 'network' | 'other';

export default function VoiceControls({ 
  enabled, 
  onEnabledChange, 
  onSpeechResult,
  onListeningChange,
  onSpeakingChange 
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
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnableToggle}
          className={`
            px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation
            ${enabled
              ? 'bg-teal-500 text-white'
              : 'bg-gray-200 text-gray-600'
            }
            ${supportState === 'unsupported' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={supportState === 'unsupported'}
        >
          {enabled ? '🎤 音声ON' : '🔇 音声OFF'}
        </button>
        
        {canUseMic && (
          <button
            onClick={startListening}
            disabled={isListening}
            className={`
              px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation min-w-[100px]
              ${isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-teal-100 text-teal-700 hover:bg-teal-200 active:bg-teal-300'
              }
              disabled:opacity-50
            `}
          >
            {isListening ? '🎤 聞いています...' : '🎤 話す'}
          </button>
        )}
      </div>
      
      {/* Show selected voice name when enabled */}
      {enabled && selectedVoiceName && selectedVoiceName !== 'Loading...' && (
        <div className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded">
          声: {selectedVoiceName}
        </div>
      )}
      
      {errorMessage && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md max-w-xs text-right">
          {errorMessage}
        </div>
      )}
      
      {supportState === 'unsupported' && (
        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md max-w-xs text-right">
          テキスト入力でご利用いただけます
        </div>
      )}
    </div>
  );
}
