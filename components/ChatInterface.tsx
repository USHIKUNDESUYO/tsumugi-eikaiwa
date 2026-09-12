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
import { loadState, saveState, addSessionStats, addMistake, getMistakesSortedForReview, updateBusinessSettings, incrementSuccessfulTurns, resetSuccessfulTurns } from '@/lib/storage';
import { businessScenarios, getBusinessSessionTips } from '@/lib/businessScenarios';

type ViewMode = 'chat' | 'review' | 'drill';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const state = loadState();
    setProfile(state.profile);
    setCurrentMode(state.currentMode);
    setVoiceEnabled(state.voiceEnabled);
    setMistakes(getMistakesSortedForReview());
    setBusinessScenario(state.businessScenario);
    setBusinessDifficulty(state.businessDifficulty);
    setSuccessfulTurns(state.successfulTurns);
    
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsSpeaking(false);
    }
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
        try {
          stopSpeaking();
          
          const utterance = new SpeechSynthesisUtterance(content);
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          utterance.volume = 1.0;
          
          utterance.onstart = () => {
            setIsSpeaking(true);
          };
          
          utterance.onend = () => {
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
          };
          
          currentUtteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Failed to speak:', error);
          setIsSpeaking(false);
        }
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
            onListeningChange={handleListeningChange}
            onSpeakingChange={handleSpeakingChange}
          />
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-teal-100">
          {/* Tab Navigation */}
          <div className="flex border-b border-teal-100">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                viewMode === 'chat'
                  ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              💬 会話
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`flex-1 px-6 py-3 font-medium transition-colors relative ${
                viewMode === 'review'
                  ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📚 復習リスト
              {mistakes.length > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {mistakes.length}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          {viewMode === 'chat' && (
            <>
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

        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          <ProgressIndicator profile={profile} />
          <ModeSelector
            currentMode={currentMode}
            onModeChange={handleModeChange}
            disabled={isLoading}
          />
          
          {currentMode === 'business' && businessScenario && (
            <>
              <BusinessScenarioSelector
                currentScenario={businessScenario}
                currentDifficulty={businessDifficulty}
                onScenarioChange={handleBusinessScenarioChange}
                onDifficultyChange={handleBusinessDifficultyChange}
                disabled={isLoading}
              />
              
              <PhraseBank
                phrases={businessScenarios[businessScenario].phrases}
                title="使える表現"
                onPhraseClick={handlePhraseClick}
              />
              
              {showSessionTips && viewMode === 'chat' && (
                <SessionTips
                  tips={getBusinessSessionTips(businessScenario)}
                  onAddToReview={(phrase) => {
                    // Add phrase as a "tip" to review list
                    console.log('Add to review:', phrase);
                  }}
                />
              )}
            </>
          )}
          
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
