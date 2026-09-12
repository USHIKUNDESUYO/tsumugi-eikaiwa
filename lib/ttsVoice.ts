/**
 * TTS Voice Management for tsumugi-eikaiwa
 * Combines cloud TTS (OpenAI-compatible API) with device TTS fallback
 * Includes soft female English voice selection for device TTS
 */

export interface TTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

type VoiceSelectionResult = {
  voice: SpeechSynthesisVoice | null;
  name: string;
};

let currentAudio: HTMLAudioElement | null = null;
let currentAudioURL: string | null = null;
let speechGeneration = 0;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;
let cachedVoiceName: string = 'Loading...';
let voicesLoaded = false;
let voiceListeners: Array<(result: VoiceSelectionResult) => void> = [];
let cloudTTSEnabled: boolean = false;
let iOSResumeInterval: number | null = null;
let isUnlocked: boolean = false;

/**
 * Female voice name patterns to prioritize
 * Ordered by preference - softer, more natural voices first
 */
const FEMALE_VOICE_PATTERNS = [
  // iOS/macOS voices (highest quality, most natural)
  /samantha/i,
  /karen/i,
  /moira/i,
  /tessa/i,
  /fiona/i,
  /victoria/i,
  /serena/i,
  /ava/i,
  
  // Google voices
  /google.*us.*female/i,
  /google.*uk.*female/i,
  /google.*female/i,
  
  // Microsoft voices
  /zira/i,
  /hazel/i,
  
  // Other female voices
  /allison/i,
  /susan/i,
  /linda/i,
  /heather/i,
  /sara/i,
  /emily/i,
  /emma/i,
  /female/i,
];

/**
 * Male voice patterns to avoid if female voices exist
 */
const MALE_VOICE_PATTERNS = [
  /daniel/i,
  /alex/i,
  /tom/i,
  /james/i,
  /david/i,
  /aaron/i,
  /\bmale\b/i,
];

/**
 * Scores a voice based on how well it matches our criteria
 * Higher score = better match
 */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name;
  const uri = voice.voiceURI;
  const lang = voice.lang;
  
  // Must be English
  if (!lang.startsWith('en')) {
    return -1000;
  }
  
  // Prefer en-US, but accept other English variants
  if (lang === 'en-US') {
    score += 50;
  } else if (lang.startsWith('en-')) {
    score += 30;
  }
  
  // Check for male patterns (penalize)
  for (const pattern of MALE_VOICE_PATTERNS) {
    if (pattern.test(name) || pattern.test(uri)) {
      score -= 100;
      break;
    }
  }
  
  // Check for female patterns (prioritize by order)
  for (let i = 0; i < FEMALE_VOICE_PATTERNS.length; i++) {
    const pattern = FEMALE_VOICE_PATTERNS[i];
    if (pattern.test(name) || pattern.test(uri)) {
      score += 200 - (i * 5);
      break;
    }
  }
  
  // Prefer local voices (usually higher quality)
  if (voice.localService) {
    score += 20;
  }
  
  // Prefer default voices slightly
  if (voice.default) {
    score += 10;
  }
  
  return score;
}

/**
 * Selects the best female English voice from available voices
 */
function selectBestVoice(voices: SpeechSynthesisVoice[]): VoiceSelectionResult {
  if (voices.length === 0) {
    return { voice: null, name: 'Default' };
  }
  
  const scoredVoices = voices.map(voice => ({
    voice,
    score: scoreVoice(voice),
  }));
  
  scoredVoices.sort((a, b) => b.score - a.score);
  
  // Log top 5 voices for debugging
  if (typeof console !== 'undefined') {
    console.log('🎤 Top 5 TTS voices:');
    scoredVoices.slice(0, 5).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.voice.name} (${item.voice.lang}) - Score: ${item.score}`);
    });
  }
  
  const bestVoice = scoredVoices[0];
  
  if (bestVoice.score < 0) {
    // Let lang=en-US choose the browser default instead of forcing a Japanese voice.
    return { voice: null, name: 'English default' };
  }
  
  return {
    voice: bestVoice.voice,
    name: bestVoice.voice.name.split(/[(\s]/)[0] || bestVoice.voice.name,
  };
}

/**
 * Loads and caches the best voice
 */
function loadVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0 && !voicesLoaded) {
    return;
  }
  
  voicesLoaded = true;
  const result = selectBestVoice(voices);
  cachedVoice = result.voice;
  cachedVoiceName = result.name;
  
  voiceListeners.forEach(listener => listener(result));
  voiceListeners = [];
}

/**
 * Gets the currently selected voice
 */
export function getSelectedVoice(): SpeechSynthesisVoice | null {
  if (!voicesLoaded && typeof window !== 'undefined' && window.speechSynthesis) {
    loadVoices();
  }
  return cachedVoice;
}

/**
 * Gets the name of the currently selected voice
 */
export function getSelectedVoiceName(): string {
  if (!voicesLoaded && typeof window !== 'undefined' && window.speechSynthesis) {
    loadVoices();
  }
  return cachedVoiceName;
}

/**
 * Subscribes to voice selection updates
 */
export function onVoiceSelected(callback: (result: VoiceSelectionResult) => void): () => void {
  if (voicesLoaded) {
    callback({ voice: cachedVoice, name: cachedVoiceName });
  } else {
    voiceListeners.push(callback);
  }
  
  return () => {
    voiceListeners = voiceListeners.filter(l => l !== callback);
  };
}

/**
 * Configures a SpeechSynthesisUtterance with optimal settings
 */
export function configureTsumugiUtterance(
  utterance: SpeechSynthesisUtterance,
  content: string
): void {
  utterance.text = content;
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1.08;
  utterance.volume = 1.0;
  
  const voice = getSelectedVoice();
  if (voice) {
    utterance.voice = voice;
  }
}

/**
 * Creates and configures a new utterance
 */
export function createTsumugiUtterance(content: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance();
  configureTsumugiUtterance(utterance, content);
  return utterance;
}

/**
 * Stops all speech (both cloud and device)
 */
export function stopAllSpeech() {
  speechGeneration++;
  if (currentAudio) {
    currentAudio.onplay = currentAudio.onended = currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentAudioURL) {
    URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = null;
  }
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    if (currentUtterance) currentUtterance.onstart = currentUtterance.onend = currentUtterance.onerror = null;
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  
  // Clear iOS resume interval
  if (iOSResumeInterval !== null) {
    clearInterval(iOSResumeInterval);
    iOSResumeInterval = null;
  }
}

/**
 * Checks if cloud TTS is enabled via environment variable (synchronous)
 * Only check NEXT_PUBLIC_TTS_ENABLED to avoid network requests before speech
 */
function isCloudTTSEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if explicitly enabled via environment variable
  return cloudTTSEnabled;
}

/**
 * Probes cloud TTS availability in the background (non-blocking)
 * Call this during app initialization, not before speaking
 */
export async function probeCloudTTS(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const response = await fetch('/api/tts', {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    cloudTTSEnabled = response.ok;
    console.log('🎤 Cloud TTS available:', cloudTTSEnabled);
  } catch {
    cloudTTSEnabled = false;
  }
}

/**
 * Cloud TTS using OpenAI-compatible API
 */
export async function speakWithCloudTTS(
  text: string,
  options: TTSOptions = {}
): Promise<boolean> {
  const generation = speechGeneration;
  let audioUrl: string | null = null;
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
    if (generation !== speechGeneration) return false;
    audioUrl = URL.createObjectURL(audioBlob);
    currentAudioURL = audioUrl;
    const audio = new Audio(audioUrl);

    audio.onplay = () => {
      options.onStart?.();
    };

    audio.onended = () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      currentAudioURL = null;
      currentAudio = null;
      options.onEnd?.();
    };

    audio.onerror = (error) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      currentAudioURL = null;
      currentAudio = null;
      options.onError?.(error);
    };

    currentAudio = audio;
    await audio.play();
    return true;
  } catch (error) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (generation === speechGeneration) {
      currentAudio = null;
      currentAudioURL = null;
    }
    console.error('Cloud TTS failed:', error);
    return false;
  }
}

/**
 * Device TTS with soft female voice selection and iOS safeguards
 */
export function speakWithDeviceTTS(
  text: string,
  options: TTSOptions = {}
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onError?.(new Error('Speech synthesis not supported'));
    return;
  }

  // Ensure voices are loaded before speaking
  if (!voicesLoaded) {
    loadVoices();
  }

  const utterance = createTsumugiUtterance(text);

  utterance.onstart = () => {
    options.onStart?.();
    
    // iOS Safari workaround: resume every 100ms to prevent pausing
    if (iOSResumeInterval !== null) {
      clearInterval(iOSResumeInterval);
    }
    iOSResumeInterval = window.setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100) as unknown as number;
  };

  utterance.onend = () => {
    if (iOSResumeInterval !== null) {
      clearInterval(iOSResumeInterval);
      iOSResumeInterval = null;
    }
    currentUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (event) => {
    if (iOSResumeInterval !== null) {
      clearInterval(iOSResumeInterval);
      iOSResumeInterval = null;
    }
    currentUtterance = null;
    options.onError?.(event);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Unlocks iOS audio context with a proper warm-up utterance
 * Must be called inside a user gesture handler (click, tap)
 */
export function unlockIOSAudio(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  
  if (isUnlocked) {
    return;
  }
  
  // Create a brief warm-up utterance with actual content
  // iOS requires actual speech to unlock, not just an empty utterance
  const warmup = new SpeechSynthesisUtterance('Ready');
  warmup.volume = 0; // Silent but non-empty; never imitate a person's voice.
  warmup.rate = 2.0; // Fast
  
  warmup.onend = () => {
    isUnlocked = true;
    window.speechSynthesis.resume(); // Ensure ready state
    console.log('🎤 iOS audio unlocked');
  };
  
  window.speechSynthesis.speak(warmup);
}

/**
 * Speaks text using device TTS by default (synchronous for iOS compatibility)
 * Cloud TTS only if explicitly configured via probeCloudTTS.
 * NEVER await network checks before calling speechSynthesis.speak on iOS.
 */
export function speakText(
  text: string,
  options: TTSOptions = {}
): void {
  stopAllSpeech();

  // Synchronous check - no network calls before speaking
  if (isCloudTTSEnabled()) {
    const generation = speechGeneration;
    let fellBack = false;
    const fallback = () => {
      if (generation !== speechGeneration || fellBack) return;
      fellBack = true;
      speakWithDeviceTTS(text, options);
    };
    // Cloud TTS is explicitly configured - try it asynchronously
    speakWithCloudTTS(text, {
      ...options,
      onError: fallback,
    }).then(played => { if (!played) fallback(); }).catch(fallback);
    return;
  }
  
  // Use device TTS (default path, synchronous)
  speakWithDeviceTTS(text, options);
}

/**
 * Returns current voice status
 */
export function getVoiceStatus(): 'cloud' | 'device' | 'none' {
  if (currentAudio) return 'cloud';
  if (currentUtterance) return 'device';
  return 'none';
}

/**
 * Initialize voice loading
 */
export function initializeTTSVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  
  loadVoices();
  
  if (!window.speechSynthesis.onvoiceschanged) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeTTSVoices();
}
