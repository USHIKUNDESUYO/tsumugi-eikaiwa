export interface TTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopAllSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export async function speakWithCloudTTS(
  text: string,
  options: TTSOptions = {}
): Promise<boolean> {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return false;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onplay = () => {
      options.onStart?.();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options.onEnd?.();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options.onError?.(error);
    };

    currentAudio = audio;
    await audio.play();
    return true;
  } catch (error) {
    console.error('Cloud TTS failed:', error);
    return false;
  }
}

export function speakWithDeviceTTS(
  text: string,
  options: TTSOptions = {}
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onError?.(new Error('Speech synthesis not supported'));
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    v => v.lang.startsWith('en') && (
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('victoria') ||
      v.name.toLowerCase().includes('karen') ||
      v.name.toLowerCase().includes('zira')
    )
  );
  
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (event) => {
    currentUtterance = null;
    options.onError?.(event);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export async function speakText(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  stopAllSpeech();

  const cloudSuccess = await speakWithCloudTTS(text, options);
  
  if (!cloudSuccess) {
    speakWithDeviceTTS(text, options);
  }
}

export function getVoiceStatus(): 'cloud' | 'device' | 'none' {
  if (currentAudio) return 'cloud';
  if (currentUtterance) return 'device';
  return 'none';
}
