'use client';

import { useState, useRef, useEffect } from 'react';

interface PronunciationRecorderProps {
  lastUserMessage?: string;
  isVisible: boolean;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'error';

export default function PronunciationRecorder({ lastUserMessage, isVisible }: PronunciationRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      if (mediaRecorderRef.current && recordingState === 'recording') {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, [audioURL, recordingState]);

  const startRecording = async () => {
    setHasInteracted(true);
    setErrorMessage('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        
        if (audioURL) {
          URL.revokeObjectURL(audioURL);
        }
        
        setAudioURL(url);
        setRecordingState('recorded');
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMessage('マイクの許可が必要です');
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('マイクが見つかりません');
      } else {
        setErrorMessage('録音を開始できませんでした');
      }
      
      setRecordingState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Failed to stop recording:', e);
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioURL) {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingState('idle');
  };

  if (!isVisible) return null;

  return (
    <div className="border-t border-gray-200/50 bg-gradient-to-b from-teal-50/30 to-white px-3 sm:px-4 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-teal-700">🎙️ 聞き返し</span>
            <span className="text-xs text-gray-500">自分の発音を確認</span>
          </div>
          {recordingState === 'recorded' && (
            <button
              onClick={deleteRecording}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="flex items-center gap-2">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="flex-1 px-3 py-2 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 transition-colors touch-manipulation"
            >
              🎤 録音開始
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={stopRecording}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors animate-pulse touch-manipulation"
              >
                ⏹ 停止
              </button>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-600">録音中</span>
              </div>
            </>
          )}

          {recordingState === 'recorded' && audioURL && (
            <>
              <button
                onClick={playRecording}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors touch-manipulation"
              >
                ▶️ 再生
              </button>
              <button
                onClick={startRecording}
                className="px-3 py-2 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 transition-colors touch-manipulation"
              >
                🔄 もう一度
              </button>
              <audio ref={audioRef} src={audioURL} />
            </>
          )}
        </div>

        {recordingState === 'recorded' && lastUserMessage && (
          <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 mb-1 font-medium">送信した文:</p>
            <p className="text-xs text-gray-700">{lastUserMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
