"use client";

import { useState, useEffect, useRef } from "react";
import { Message, AppMode, ReviewItem } from "@/lib/types";
import { generateTsumugiResponse, getBusinessScenario } from "@/lib/api";
import ChatMessage from "./ChatMessage";
import VoiceButton from "./VoiceButton";
import ModeSelector from "./ModeSelector";
import ReviewPanel from "./ReviewPanel";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "こんにちは！つむぎです 🌸\n\nWelcome! I'm here to help you practice English conversation. Feel free to speak naturally - I'll gently help you improve! 💕\n\n📱 **スマホの方**: マイクボタンをタップして話しかけてください！",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>("chat");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakMessage = (text: string) => {
    if (isMuted || typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    const voices = synth.getVoices();
    const femaleVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    synth.speak(utterance);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { content: responseContent, corrections } = await generateTsumugiResponse(
        content,
        messages
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        corrections,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (corrections.length > 0) {
        setReviewItems((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            word: corrections[0].original,
            meaning: corrections[0].corrected,
            example: corrections[0].explanation,
            reviewCount: 0,
          },
        ]);
      }

      speakMessage(responseContent.split("\n")[0]);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    handleSendMessage(transcript);
  };

  const handleModeChange = async (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === "business") {
      setMessages([]);
      setIsLoading(true);
      const scenario = await getBusinessScenario("meeting");
      setMessages(scenario);
      speakMessage(scenario[0].content);
      setIsLoading(false);
    } else if (newMode === "chat") {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Let's chat! What would you like to talk about? 🌸",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  if (mode === "review") {
    return (
      <div className="flex flex-col h-screen">
        <div className="safe-area-top bg-gradient-to-r from-tsumugi-primary to-pink-400 px-4 py-3 shadow-md">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <h1 className="text-white font-bold text-lg">復習モード 📚</h1>
            <button
              onClick={() => setMode("chat")}
              className="text-white text-sm px-3 py-1 bg-white/20 rounded-full"
            >
              チャットに戻る
            </button>
          </div>
        </div>
        <ReviewPanel items={reviewItems} onUpdateItems={setReviewItems} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Compact for mobile */}
      <div className="safe-area-top bg-gradient-to-r from-tsumugi-primary to-pink-400 px-4 py-3 shadow-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-white font-bold text-lg">つむぎ英会話 🌸</h1>
            <p className="text-white/90 text-xs">Speak naturally!</p>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-white/20 rounded-full text-white text-xl"
            aria-label={isMuted ? "音声ON" : "音声OFF"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector currentMode={mode} onModeChange={handleModeChange} />

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-tsumugi-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-tsumugi-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-tsumugi-primary rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Sticky bottom with safe area */}
      <div className="border-t bg-white/80 backdrop-blur-sm safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type or speak your message..."
              className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tsumugi-primary max-h-32 text-base"
              rows={1}
              style={{
                minHeight: "44px",
              }}
            />

            {/* Voice Button */}
            <VoiceButton
              onTranscript={handleVoiceInput}
              disabled={isLoading}
              className="flex-shrink-0"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 bg-tsumugi-primary text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
