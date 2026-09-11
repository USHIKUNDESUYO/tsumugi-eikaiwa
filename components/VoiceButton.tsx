"use client";

import { useState, useEffect, useRef } from "react";

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceButton({ onTranscript, disabled, className }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "prompt">("prompt");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setPermissionState("granted");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setPermissionState("denied");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const handleClick = () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={className}>
        <div className="text-xs text-gray-500 text-center max-w-[44px]">
          音声非対応
        </div>
      </div>
    );
  }

  if (permissionState === "denied") {
    return (
      <div className={className}>
        <button
          disabled
          className="bg-gray-300 text-gray-600 rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="マイクの許可が必要です"
        >
          🎤🚫
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${className} ${
        isListening
          ? "bg-red-500 animate-pulse"
          : "bg-gradient-to-r from-purple-500 to-pink-500"
      } text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center`}
      aria-label={isListening ? "録音中..." : "おしゃべり"}
      title={isListening ? "タップして停止" : "タップして話す"}
    >
      {isListening ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M8 5a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V8a3 3 0 00-3-3H8z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
        </svg>
      )}
    </button>
  );
}
