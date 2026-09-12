import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PronunciationRecorder from '@/components/PronunciationRecorder';

const stopTrack = vi.fn();
class Recorder {
  static latest: Recorder;
  static isTypeSupported = () => false;
  state = 'inactive';
  mimeType = 'audio/mp4';
  onstop?: () => void;
  ondataavailable?: (event: { data: Blob }) => void;
  start = vi.fn(() => { this.state = 'recording'; });
  stop = vi.fn(() => { this.state = 'inactive'; this.onstop?.(); });
  constructor() { Recorder.latest = this; }
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('MediaRecorder', Recorder);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
    getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
  } });
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('finishes a recording, preserves playback through the state update and releases resources on unmount', async () => {
  const { unmount } = render(<PronunciationRecorder isVisible />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '🎤 録音開始' })));
  expect(Recorder.latest.stop).not.toHaveBeenCalled();
  act(() => Recorder.latest.ondataavailable?.({ data: new Blob(['sample']) }));
  fireEvent.click(screen.getByRole('button', { name: '⏹ 停止' }));
  expect(screen.getByRole('button', { name: '▶️ 再生' })).toBeTruthy();
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  expect(stopTrack).toHaveBeenCalledOnce();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
});

it('releases a microphone permission request that finishes after closing the recorder', async () => {
  let resolve!: (stream: MediaStream) => void;
  vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValue(new Promise(done => { resolve = done; }));
  const { unmount } = render(<PronunciationRecorder isVisible />);
  fireEvent.click(screen.getByRole('button', { name: '🎤 録音開始' }));
  unmount();
  await act(async () => resolve({ getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream));
  expect(stopTrack).toHaveBeenCalledOnce();
});
