'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, ChatMode, LanguageLevel, CorrectionCard, MistakeRecord, BusinessScenario, DifficultyLevel } from '@/types';
import { getInitialGreeting } from '@/lib/prompts';
import ChatMessage from './ChatMessage';
import ModeSelector from './ModeSelector';
import ProgressIndicator from './ProgressIndicator';
import VoiceControls from './VoiceControls';
import Avatar from './Avatar';
import ReviewList from './ReviewList';
import DrillMode from './DrillMode';
import BusinessScenarioSelector from './BusinessScenarioSelector';
import PhraseBank from './PhraseBank';
import SessionTips from './SessionTips';
import SessionSummary from './SessionSummary';
import { loadState, saveState, addSessionStats, addMistake, getMistakesSortedForReview, updateBusinessSettings, incrementSuccessfulTurns, resetSuccessfulTurns } from '@/lib/storage';
import { businessScenarios, getBusinessSessionTips } from '@/lib/businessScenarios';
import { speakText, stopAllSpeech, initializeTTSVoices } from '@/lib/ttsVoice';

type ViewMode = 'chat' | 'review' | 'drill';

const modes: { value: ChatMode; label: string; emoji: string }[] = [
  { value: 'free-chat', label: 'フリートーク', emoji: '💬' },
  { value: 'daily-life', label: '日常会話', emoji: '🏡' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'workplace-small-talk', label: '職場雑談', emoji: '☕' },
  { value: 'business', label: 'ビジネス英語', emoji: '💼' },
  { value: 'vocab-drill', label: '語彙練習', emoji: '📚' },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('free-chat');
  const [profile, setProfile] = useState(loadState().profile);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [correctionsCount, setCorrectionsCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [drillMistakes, setDrillMistakes] = useState<MistakeRecord[]>([]);
  const [businessScenario, setBusinessScenario] = useState<BusinessScenario | undefined>();
  const [businessDifficulty, setBusinessDifficulty] = useState<DifficultyLevel>('beginner');
  const [successfulTurns, setSuccessfulTurns] = useState(0);
  const [showSessionTips, setShowSessionTips] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [voiceSource, setVoiceSource] = useState<'cloud' | 'device' | null>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState({
    messagesCount: 0,
    correctionsCount: 0,
    durationMinutes: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = loadState();
    setProfile(state.profile);
    setCurrentMode(state.currentMode);
    setVoiceEnabled(state.voiceEnabled);
    setMistakes(getMistakesSortedForReview());
    setBusinessScenario(state.businessScenario);
    setBusinessDifficulty(state.businessDifficulty);
    setSuccessfulTurns(state.successfulTurns);
    
    // Initialize TTS voices
    initializeTTSVoices();
    
    if (state.messages.length === 0) {
      const greeting = getInitialGreeting(state.currentMode, state.businessScenario);
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

  const stopSpeaking = () => {
    stopAllSpeech();
    setIsSpeaking(false);
    setVoiceSource(null);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleModeChange = (mode: ChatMode) => {
    if (messages.length > 1) {
      const confirmChange = confirm('モードを変更すると会話がリセットされます。よろしいですか？');
      if (!confirmChange) return;
    }

    setCurrentMode(mode);
    resetSuccessfulTurns();
    setSuccessfulTurns(0);
    
    // Set default business scenario if switching to business mode
    let newScenario = businessScenario;
    if (mode === 'business' && !businessScenario) {
      newScenario = 'meeting-basics';
      setBusinessScenario(newScenario);
      updateBusinessSettings(newScenario, businessDifficulty);
      setShowSessionTips(true);
    }
    
    const greeting = getInitialGreeting(mode, newScenario);
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
    if (mode === 'business') {
      state.businessScenario = newScenario;
    }
    saveState(state);
  };

  const handleBusinessScenarioChange = (scenario: BusinessScenario) => {
    if (messages.length > 1) {
      const confirmChange = confirm('シナリオを変更すると会話がリセットされます。よろしいですか？');
      if (!confirmChange) return;
    }

    setBusinessScenario(scenario);
    updateBusinessSettings(scenario, businessDifficulty);
    resetSuccessfulTurns();
    setSuccessfulTurns(0);
    setShowSessionTips(true);

    const greeting = getInitialGreeting('business', scenario);
    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    };
    setMessages([greetingMessage]);

    const state = loadState();
    state.messages = [greetingMessage];
    state.businessScenario = scenario;
    saveState(state);
  };

  const handleBusinessDifficultyChange = (difficulty: DifficultyLevel) => {
    setBusinessDifficulty(difficulty);
    updateBusinessSettings(businessScenario, difficulty);
    resetSuccessfulTurns();
    setSuccessfulTurns(0);
  };

  const handlePhraseClick = (phrase: string) => {
    setInput(prev => prev ? `${prev} ${phrase}` : phrase);
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
          businessScenario,
          businessDifficulty,
          successfulTurns,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const { content, correction } = extractCorrection(data.response);

      if (correction) {
        setCorrectionsCount(prev => prev + 1);
        // Save mistake to review list
        addMistake(correction, currentMode);
        setMistakes(getMistakesSortedForReview());
      } else {
        // No correction means successful turn for scaffolding
        if (currentMode === 'business') {
          incrementSuccessfulTurns();
          setSuccessfulTurns(prev => prev + 1);
        }
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

      if (voiceEnabled && typeof window !== 'undefined' && !isListening) {
        stopSpeaking();
        
        speakText(content, {
          onStart: () => {
            setIsSpeaking(true);
            const isCloud = fetch('/api/tts', { method: 'HEAD' })
              .then(r => r.ok)
              .catch(() => false);
            isCloud.then(cloud => setVoiceSource(cloud ? 'cloud' : 'device'));
          },
          onEnd: () => {
            setIsSpeaking(false);
            setVoiceSource(null);
          },
          onError: (error) => {
            console.error('Speech synthesis error:', error);
            setIsSpeaking(false);
            setVoiceSource(null);
          },
        });
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
    if (!enabled) {
      stopSpeaking();
    }
    const state = loadState();
    state.voiceEnabled = enabled;
    saveState(state);
  };

  const handleListeningChange = (listening: boolean) => {
    setIsListening(listening);
    if (listening) {
      stopSpeaking();
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
  };

  const handleEndSession = () => {
    if (messages.length <= 1) return;

    const duration = Date.now() - sessionStart;
    const userMessagesCount = messages.filter(m => m.role === 'user').length;
    
    addSessionStats({
      messagesCount: userMessagesCount,
      correctionsCount,
      duration,
      mode: currentMode,
      date: new Date().toISOString(),
    });

    setSessionSummaryData({
      messagesCount: userMessagesCount,
      correctionsCount,
      durationMinutes: Math.round(duration / 60000),
    });
    setShowSessionSummary(true);
  };

  const handleCloseSummary = () => {
    setShowSessionSummary(false);
    
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

  const handleReviewUpdate = () => {
    setMistakes(getMistakesSortedForReview());
  };

  const handleStartDrill = (mistakesToDrill: MistakeRecord[]) => {
    setDrillMistakes(mistakesToDrill);
    setViewMode('drill');
  };

  const handleDrillComplete = () => {
    setMistakes(getMistakesSortedForReview());
    setViewMode('review');
  };

  const handleDrillExit = () => {
    setViewMode('review');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-cyan-50/30 via-white to-teal-50/20">
      {/* Clean header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-cyan-100/30 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">紬の英会話</h1>
              <p className="text-xs text-gray-500 hidden sm:block">やさしく、楽しく</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6 lg:px-6 lg:py-6 overflow-hidden">
        {/* Main chat panel */}
        <div className="flex-1 flex flex-col bg-white lg:rounded-2xl lg:shadow-xl overflow-hidden lg:border lg:border-gray-200/50 min-w-0">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200/60 bg-white">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${
                viewMode === 'chat'
                  ? 'text-cyan-600 bg-cyan-50/50 border-b-2 border-cyan-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              💬 会話
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all relative ${
                viewMode === 'review'
                  ? 'text-cyan-600 bg-cyan-50/50 border-b-2 border-cyan-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              📚 復習
              {mistakes.length > 0 && (
                <span className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                  {mistakes.length}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          {viewMode === 'chat' && (
            <>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gradient-to-b from-gray-50/20 to-transparent">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white/90 backdrop-blur-sm border border-cyan-100/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer with integrated voice controls */}
              <div className="border-t border-gray-200/60 bg-white/95 backdrop-blur-sm p-3 sm:p-4 pb-safe">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <div className="flex-shrink-0">
                    <VoiceControls
                      enabled={voiceEnabled}
                      onEnabledChange={handleVoiceToggle}
                      onSpeechResult={handleVoiceResult}
                      onListeningChange={handleListeningChange}
                      onSpeakingChange={handleSpeakingChange}
                      voiceSource={voiceSource}
                    />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type in English..."
                    className="flex-1 px-4 py-2.5 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 text-gray-800 placeholder:text-gray-400 bg-white transition-all min-w-0"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 touch-manipulation flex-shrink-0"
                  >
                    送信
                  </button>
                </form>
              </div>
            </>
          )}

          {viewMode === 'review' && (
            <div className="flex-1 overflow-y-auto p-6">
              <ReviewList
                mistakes={mistakes}
                onUpdate={handleReviewUpdate}
                onStartDrill={handleStartDrill}
              />
            </div>
          )}

          {viewMode === 'drill' && (
            <DrillMode
              mistakes={drillMistakes}
              onComplete={handleDrillComplete}
              onExit={handleDrillExit}
            />
          )}
        </div>

        {/* Mobile Settings Bottom Sheet */}
        {showMobileControls && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setShowMobileControls(false)}
          >
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="sticky top-0 bg-white pt-3 pb-3 px-4 border-b border-gray-200/50">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">設定</h3>
                  <button
                    onClick={() => setShowMobileControls(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 -mr-2 touch-manipulation"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4 pb-safe">
                <ModeSelector
                  currentMode={currentMode}
                  onModeChange={handleModeChange}
                  disabled={isLoading}
                />
                
                {currentMode === 'business' && businessScenario && (
                  <BusinessScenarioSelector
                    currentScenario={businessScenario}
                    currentDifficulty={businessDifficulty}
                    onScenarioChange={handleBusinessScenarioChange}
                    onDifficultyChange={handleBusinessDifficultyChange}
                    disabled={isLoading}
                  />
                )}
                
                <ProgressIndicator profile={profile} />
                
                {messages.length > 1 && (
                  <button
                    onClick={handleEndSession}
                    className="w-full bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-3.5 shadow-sm text-rose-700 font-semibold hover:shadow-md transition-all touch-manipulation"
                  >
                    📝 セッション終了
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile FAB - Settings button */}
        <button
          onClick={() => setShowMobileControls(true)}
          className="lg:hidden fixed bottom-6 right-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full p-3.5 shadow-xl hover:shadow-2xl transition-all z-30 active:scale-95 touch-manipulation"
          title="設定"
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl">{modes.find(m => m.value === currentMode)?.emoji}</span>
            <span className="text-[9px] font-semibold">設定</span>
          </div>
        </button>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col gap-4 overflow-y-auto pb-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
            <ProgressIndicator profile={profile} />
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
            <ModeSelector
              currentMode={currentMode}
              onModeChange={handleModeChange}
              disabled={isLoading}
            />
          </div>
          
          {currentMode === 'business' && businessScenario && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                <BusinessScenarioSelector
                  currentScenario={businessScenario}
                  currentDifficulty={businessDifficulty}
                  onScenarioChange={handleBusinessScenarioChange}
                  onDifficultyChange={handleBusinessDifficultyChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                <PhraseBank
                  phrases={businessScenarios[businessScenario].phrases}
                  title="使える表現"
                  onPhraseClick={handlePhraseClick}
                />
              </div>
              
              {showSessionTips && viewMode === 'chat' && (
                <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                  <SessionTips
                    tips={getBusinessSessionTips(businessScenario)}
                    onAddToReview={(phrase) => {
                      console.log('Add to review:', phrase);
                    }}
                  />
                </div>
              )}
            </>
          )}
          
          {messages.length > 1 && (
            <button
              onClick={handleEndSession}
              className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-3.5 shadow-sm text-rose-700 font-semibold hover:shadow-md transition-all"
            >
              📝 セッション終了
            </button>
          )}

          <div className="bg-gradient-to-br from-gray-50 to-slate-50/50 border border-gray-200 rounded-xl p-3.5 shadow-sm text-xs text-gray-600">
            <p className="font-bold mb-1.5 text-gray-800 text-[11px]">⚠️ 免責事項</p>
            <p className="leading-relaxed text-[11px]">このアプリは個人が作成した二次創作の学習ツールです。Key/Visual Artsとは一切関係ありません。</p>
          </div>
        </div>
      </div>

      <SessionSummary
        show={showSessionSummary}
        messagesCount={sessionSummaryData.messagesCount}
        correctionsCount={sessionSummaryData.correctionsCount}
        durationMinutes={sessionSummaryData.durationMinutes}
        mode={currentMode}
        onClose={handleCloseSummary}
      />
    </div>
  );
}
