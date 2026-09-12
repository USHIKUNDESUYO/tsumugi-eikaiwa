'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeTTSVoices, getSelectedVoiceName, onVoiceSelected, unlockIOSAudio } from '@/lib/ttsVoice';

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

  const startListening = async () => {
    if (supportState !== 'supported' || isListening) return;

    setHasInteracted(true);
    setErrorState(null);
    
    // Auto-enable voice if not enabled
    if (!enabled) {
      unlockIOSAudio();
      onEnabledChange(true);
    }
    
    stopSpeaking();

    // Prime getUserMedia for permissions (iOS needs this before recognition)
    // But do it non-blocking to keep recognition.start() in gesture context
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Got permission, immediately stop to release mic
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(err => {
          console.warn('getUserMedia permission issue:', err);
          // Continue anyway - recognition will handle permission errors
        });
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = true; // Show interim results for better feedback
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorState(null);
        onListeningChange?.(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim() && event.results[0].isFinal) {
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
      // Start recognition immediately - must be synchronous in gesture handler
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
      // Unlock iOS audio context properly
      unlockIOSAudio();
    } else {
      stopListening();
      stopSpeaking();
    }
    onEnabledChange(!enabled);
  };

  const getErrorMessage = (): string | null => {
    if (supportState === 'permission-denied') {
      return '⚠️ マイクの許可が必要です。設定で許可してください';
    }
    if (supportState === 'unsupported') {
      // Detect Chrome on iOS vs Safari
      const isChromeiOS = /CriOS/i.test(navigator.userAgent);
      if (isChromeiOS) {
        return '⚠️ Chrome iOS版は音声認識非対応。Safariをご利用ください';
      }
      return 'このブラウザは音声認識に対応していません';
    }
    
    switch (errorState) {
      case 'not-allowed':
        return '⚠️ マイクの使用が許可されていません。設定で許可してください';
      case 'no-speech':
        return '音声が検出されませんでした。もう一度お試しください';
      case 'network':
        return '⚠️ ネットワークエラー。接続を確認してください';
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
  const canUseMic = supportState === 'supported';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 justify-center">
        {/* Show mic button prominently on mobile */}
        {canUseMic && (
          <button
            onClick={startListening}
            disabled={isListening}
            className={`
              flex-1 md:flex-initial px-6 py-2 rounded-full text-sm font-medium transition-all touch-manipulation min-h-[44px]
              ${isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg ring-2 ring-red-300'
                : enabled
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:shadow-lg active:scale-95'
                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md hover:shadow-lg active:scale-95'
              }
              disabled:opacity-50
            `}
          >
            {isListening ? '🎤 聞いています...' : '🎤 話す'}
          </button>
        )}
        
        <button
          onClick={handleEnableToggle}
          className={`
            px-4 py-2 rounded-full text-xs font-medium transition-all touch-manipulation min-h-[40px]
            ${enabled
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            }
            ${supportState === 'unsupported' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
          `}
          disabled={supportState === 'unsupported'}
        >
          {enabled ? '🔊 音声ON' : '🔇 音声OFF'}
        </button>
      </div>
      
      {/* Show voice source or error inline */}
      {enabled && voiceSource && !errorMessage && (
        <div className="text-[10px] text-center text-teal-600 bg-teal-50/50 px-2 py-1 rounded-full">
          {voiceSource === 'cloud' ? 'クラウド音声' : selectedVoiceName !== 'Loading...' ? selectedVoiceName : 'デバイス音声'}
        </div>
      )}
      
      {errorMessage && (
        <div className="text-[10px] text-center text-red-600 bg-red-50 px-2 py-1 rounded-full">
          {errorMessage}
        </div>
      )}
      
      {supportState === 'unsupported' && (
        <div className="text-[10px] text-center text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
          テキスト入力でご利用いただけます
        </div>
      )}
    </div>
  );
}
