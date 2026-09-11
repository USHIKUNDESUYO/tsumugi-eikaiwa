'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, ChatMode, LanguageLevel, CorrectionCard } from '@/types';
import { getInitialGreeting } from '@/lib/prompts';
import ChatMessage from './ChatMessage';
import ModeSelector from './ModeSelector';
import ProgressIndicator from './ProgressIndicator';
import VoiceControls from './VoiceControls';
import Avatar from './Avatar';
import { loadState, saveState, addSessionStats } from '@/lib/storage';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('free-chat');
  const [profile, setProfile] = useState(loadState().profile);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [correctionsCount, setCorrectionsCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = loadState();
    setProfile(state.profile);
    setCurrentMode(state.currentMode);
    setVoiceEnabled(state.voiceEnabled);
    
    if (state.messages.length === 0) {
      const greeting = getInitialGreeting(state.currentMode);
      const greetingMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
      setMessages([greetingMessage]);
      saveState({ ...state, messages: [greetingMessage] });
    } else {
      setMessages(state.messages);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModeChange = (mode: ChatMode) => {
    if (messages.length > 1) {
      const confirmChange = confirm('モードを変更すると会話がリセットされます。よろしいですか？');
      if (!confirmChange) return;
    }

    setCurrentMode(mode);
    const greeting = getInitialGreeting(mode);
    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    };
    setMessages([greetingMessage]);
    
    const state = loadState();
    state.currentMode = mode;
    state.messages = [greetingMessage];
    saveState(state);
  };

  const extractCorrection = (text: string): { content: string; correction?: CorrectionCard } => {
    const correctionMatch = text.match(/<correction>\s*({[\s\S]*?})\s*<\/correction>/);
    
    if (!correctionMatch) {
      return { content: text };
    }

    try {
      const correctionJson = JSON.parse(correctionMatch[1]);
      const cleanedContent = text.replace(/<correction>[\s\S]*?<\/correction>/, '').trim();
      
      return {
        content: cleanedContent,
        correction: correctionJson as CorrectionCard,
      };
    } catch (error) {
      console.error('Failed to parse correction:', error);
      return { content: text };
    }
  };

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          mode: currentMode,
          level: profile.currentLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const { content, correction } = extractCorrection(data.response);

      if (correction) {
        setCorrectionsCount(prev => prev + 1);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        correction,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      const state = loadState();
      state.messages = updatedMessages;
      saveState(state);

      if (voiceEnabled && typeof window !== 'undefined') {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'すみません、エラーが発生しました。もう一度試してください。',
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleVoiceResult = (text: string) => {
    setInput(text);
    sendMessage(text);
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    const state = loadState();
    state.voiceEnabled = enabled;
    saveState(state);
  };

  const handleEndSession = () => {
    if (messages.length <= 1) return;

    const duration = Date.now() - sessionStart;
    addSessionStats({
      messagesCount: messages.filter(m => m.role === 'user').length,
      correctionsCount,
      duration,
      mode: currentMode,
      date: new Date().toISOString(),
    });

    alert(`セッション終了！\n\nメッセージ数: ${messages.filter(m => m.role === 'user').length}\n訂正数: ${correctionsCount}\n時間: ${Math.round(duration / 60000)}分`);
    
    const greeting = getInitialGreeting(currentMode);
    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    };
    setMessages([greetingMessage]);
    setCorrectionsCount(0);
    
    const state = loadState();
    state.messages = [greetingMessage];
    setProfile(state.profile);
    saveState(state);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <header className="bg-white border-b border-teal-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar />
            <div>
              <h1 className="text-xl font-bold text-teal-700">紬の英会話レッスン</h1>
              <p className="text-xs text-gray-500">やさしく、楽しく、上達へ</p>
            </div>
          </div>
          <VoiceControls
            enabled={voiceEnabled}
            onEnabledChange={handleVoiceToggle}
            onSpeechResult={handleVoiceResult}
          />
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-teal-100">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-teal-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-teal-100 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message in English..."
                className="flex-1 px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                送信
              </button>
            </form>
          </div>
        </div>

        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          <ProgressIndicator profile={profile} />
          <ModeSelector
            currentMode={currentMode}
            onModeChange={handleModeChange}
            disabled={isLoading}
          />
          
          {messages.length > 1 && (
            <button
              onClick={handleEndSession}
              className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-teal-700 font-medium"
            >
              📝 セッション終了
            </button>
          )}

          <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm text-xs text-gray-500">
            <p className="font-semibold mb-2">⚠️ 免責事項</p>
            <p>このアプリは個人が作成した二次創作の学習ツールです。Key/Visual Artsとは一切関係ありません。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
