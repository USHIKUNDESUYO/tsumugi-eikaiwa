/**
 * TTS Voice Selection for the tsumugi-eikaiwa app
 * Selects a soft female English voice from available system voices
 */

type VoiceSelectionResult = {
  voice: SpeechSynthesisVoice | null;
  name: string;
};

let cachedVoice: SpeechSynthesisVoice | null = null;
let cachedVoiceName: string = 'Loading...';
let voicesLoaded = false;
let voiceListeners: Array<(result: VoiceSelectionResult) => void> = [];

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
  /alex/i,  // Can be male or female, but often male
  /tom/i,
  /james/i,
  /david/i,
  /aaron/i,
  /male/i,
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
      // Earlier patterns get higher scores
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
  
  // Score all voices
  const scoredVoices = voices.map(voice => ({
    voice,
    score: scoreVoice(voice),
  }));
  
  // Sort by score (highest first)
  scoredVoices.sort((a, b) => b.score - a.score);
  
  // Log top 5 voices for debugging
  if (typeof console !== 'undefined') {
    console.log('🎤 Top 5 TTS voices:');
    scoredVoices.slice(0, 5).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.voice.name} (${item.voice.lang}) - Score: ${item.score}`);
    });
  }
  
  // Select the best voice
  const bestVoice = scoredVoices[0];
  
  if (bestVoice.score < 0) {
    // No good match, use default
    const defaultVoice = voices.find(v => v.default) || voices[0];
    return {
      voice: defaultVoice,
      name: defaultVoice.name.split(/[(\s]/)[ 0] || 'Default',
    };
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
    // Voices not loaded yet, will be called again by voiceschanged event
    return;
  }
  
  voicesLoaded = true;
  const result = selectBestVoice(voices);
  cachedVoice = result.voice;
  cachedVoiceName = result.name;
  
  // Notify listeners
  voiceListeners.forEach(listener => listener(result));
  voiceListeners = [];
}

/**
 * Gets the currently selected voice (returns null if voices not loaded yet)
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
 * Returns an unsubscribe function
 */
export function onVoiceSelected(callback: (result: VoiceSelectionResult) => void): () => void {
  if (voicesLoaded) {
    // Already loaded, call immediately
    callback({ voice: cachedVoice, name: cachedVoiceName });
  } else {
    // Add to listeners
    voiceListeners.push(callback);
  }
  
  return () => {
    voiceListeners = voiceListeners.filter(l => l !== callback);
  };
}

/**
 * Configures a SpeechSynthesisUtterance with optimal settings for Tsumugi
 */
export function configureTsumugiUtterance(
  utterance: SpeechSynthesisUtterance,
  content: string
): void {
  utterance.text = content;
  utterance.lang = 'en-US';
  
  // Soft, gentle voice settings
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.08; // Slightly higher for a softer female tone (if supported)
  utterance.volume = 1.0;
  
  // Use selected voice if available
  const voice = getSelectedVoice();
  if (voice) {
    utterance.voice = voice;
  }
}

/**
 * Creates and configures a new utterance ready to speak
 */
export function createTsumugiUtterance(content: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance();
  configureTsumugiUtterance(utterance, content);
  return utterance;
}

/**
 * Initialize voice loading
 * Call this once when the app starts
 */
export function initializeTTSVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  
  // Try to load voices immediately
  loadVoices();
  
  // Also listen for the voiceschanged event (important for iOS/Safari)
  if (!window.speechSynthesis.onvoiceschanged) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initializeTTSVoices();
}
