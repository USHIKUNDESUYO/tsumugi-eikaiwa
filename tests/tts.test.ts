import { afterEach, beforeEach, expect, it, vi } from 'vitest';

class Utterance {
  text = '';
  constructor(text = '') { this.text = text; }
}
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  vi.stubGlobal('speechSynthesis', { getVoices: () => [], cancel: vi.fn(), speak: vi.fn(), resume: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

it('does not force a Japanese voice onto English when no English voice is installed', async () => {
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [{ name: 'Japanese voice', lang: 'ja-JP', voiceURI: 'ja', default: true }],
    cancel: vi.fn(), speak: vi.fn(),
  });
  const { getSelectedVoice } = await import('@/lib/ttsVoice');
  expect(getSelectedVoice()).toBeNull();
});

it('falls back to device speech when cloud returns an HTTP error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false }));
  const { probeCloudTTS, speakText } = await import('@/lib/ttsVoice');
  await probeCloudTTS();
  speakText('A device reply');
  await vi.waitFor(() => expect(speechSynthesis.speak).toHaveBeenCalledOnce());
  expect(vi.mocked(speechSynthesis.speak).mock.calls[0][0].text).toBe('A device reply');
});

it('does not play delayed cloud speech after the user stops it', async () => {
  let resolve!: (value: unknown) => void;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true }).mockImplementationOnce(() => new Promise(done => { resolve = done; })));
  const { probeCloudTTS, speakText, stopAllSpeech } = await import('@/lib/ttsVoice');
  await probeCloudTTS();
  speakText('Stale reply');
  stopAllSpeech();
  resolve({ ok: false });
  await new Promise(done => setTimeout(done, 0));
  expect(speechSynthesis.speak).not.toHaveBeenCalled();
});

it('device-only speech needs no API and suppresses callbacks from cancelled utterances', async () => {
  vi.stubGlobal('fetch', vi.fn());
  const { speakText, stopAllSpeech } = await import('@/lib/ttsVoice');
  const onEnd = vi.fn();
  speakText('Local voice', { onEnd });
  const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0];
  stopAllSpeech();
  expect(utterance.onend).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
