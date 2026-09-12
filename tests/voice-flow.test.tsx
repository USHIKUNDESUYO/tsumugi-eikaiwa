import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ChatInterface from '@/components/ChatInterface';
import VoiceControls from '@/components/VoiceControls';
import { speakText } from '@/lib/ttsVoice';

vi.mock('@/lib/ttsVoice', () => ({
  speakText: vi.fn(), stopAllSpeech: vi.fn(), unlockIOSAudio: vi.fn(),
  initializeTTSVoices: vi.fn(), probeCloudTTS: vi.fn().mockResolvedValue(undefined),
  getVoiceStatus: () => 'device',
}));

class Recognition {
  static latest: Recognition;
  onstart?: () => void;
  onend?: () => void;
  onresult?: (event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void;
  onerror?: (event: { error: string }) => void;
  stop = vi.fn();
  abort = vi.fn();
  constructor() { Recognition.latest = this; }
  start() { this.onstart?.(); }
  result(text: string, isFinal = true) {
    this.onresult?.({ results: [{ isFinal, 0: { transcript: text } }] });
  }
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal('SpeechRecognition', Recognition);
  vi.stubGlobal('speechSynthesis', {});
  Element.prototype.scrollTo = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: 'What did you drink?' }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('keeps first-tap recognition alive across renders and speaks after the mic ends', async () => {
  render(<ChatInterface />);
  fireEvent.click(screen.getByRole('button', { name: '🎤 話す' }));
  const recognition = Recognition.latest;
  expect(recognition.abort).not.toHaveBeenCalled();
  expect(recognition.stop).not.toHaveBeenCalled();
  act(() => recognition.result('I went to a cafe', false));
  expect(screen.getByRole('status').textContent).toContain('I went to a cafe');
  expect(fetch).not.toHaveBeenCalled();
  act(() => recognition.result('I went to a cafe yesterday.'));
  expect(fetch).not.toHaveBeenCalled();
  act(() => recognition.onend?.());
  await screen.findByText('What did you drink?');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(speakText).toHaveBeenCalledWith('What did you drink?', expect.any(Object));
  expect(screen.queryByText('🎤 録音開始')).toBeNull();
  act(() => recognition.onend?.());
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('uses current voice preference when a pending chat response arrives', async () => {
  let resolve!: (value: Response) => void;
  vi.mocked(fetch).mockReturnValue(new Promise(done => { resolve = done; }) as Promise<Response>);
  render(<ChatInterface />);
  fireEvent.click(screen.getByRole('button', { name: '🎤 話す' }));
  act(() => { Recognition.latest.result('Hello'); Recognition.latest.onend?.(); });
  fireEvent.click(screen.getByRole('button', { name: '🔊 読み上げON' }));
  await act(async () => resolve({ ok: true, json: async () => ({ response: 'Hello again' }) } as Response));
  expect(speakText).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '▷ もう一度聞く' }));
  expect(speakText).toHaveBeenCalledWith('Hello again', expect.any(Object));
});

it('lets a denied microphone retry and discards results after leaving chat', async () => {
  const onSpeechResult = vi.fn();
  const { unmount } = render(<VoiceControls enabled onEnabledChange={vi.fn()} onSpeechResult={onSpeechResult} />);
  fireEvent.click(screen.getByRole('button', { name: '🎤 話す' }));
  act(() => Recognition.latest.onerror?.({ error: 'not-allowed' }));
  expect(screen.getByRole('alert').textContent).toContain('マイクの許可');
  fireEvent.click(screen.getByRole('button', { name: '🎤 話す' }));
  const recognition = Recognition.latest;
  act(() => recognition.result('Do not send this'));
  unmount();
  expect(recognition.abort).toHaveBeenCalledOnce();
  act(() => recognition.onend?.());
  await waitFor(() => expect(onSpeechResult).not.toHaveBeenCalled());
});

it('stops on request and sends only final recognition results', () => {
  const onSpeechResult = vi.fn();
  render(<VoiceControls enabled onEnabledChange={vi.fn()} onSpeechResult={onSpeechResult} />);
  fireEvent.click(screen.getByRole('button', { name: '🎤 話す' }));
  fireEvent.click(screen.getByRole('button', { name: '■ 話し終わる' }));
  expect(Recognition.latest.stop).toHaveBeenCalledOnce();
  act(() => { Recognition.latest.result('partial', false); Recognition.latest.onend?.(); });
  expect(onSpeechResult).not.toHaveBeenCalled();
});
