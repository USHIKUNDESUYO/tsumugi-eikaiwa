"use client";

import { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-tsumugi-primary text-white"
            : "bg-white text-gray-800 shadow-sm"
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-base leading-relaxed">
          {message.content}
        </div>
        {message.corrections && message.corrections.length > 0 && (
          <div className="mt-3 pt-3 border-t border-pink-200 space-y-2">
            {message.corrections.map((correction, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-400">❌</span>
                  <span className="line-through opacity-75">{correction.original}</span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <span className="text-green-400">✅</span>
                  <span className="font-semibold">{correction.corrected}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-xs opacity-60 mt-2">
          {message.timestamp.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
