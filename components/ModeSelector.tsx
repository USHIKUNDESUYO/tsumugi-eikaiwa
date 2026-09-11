"use client";

import { AppMode } from "@/lib/types";

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export default function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const modes: { id: AppMode; label: string; icon: string }[] = [
    { id: "chat", label: "おしゃべり", icon: "💬" },
    { id: "review", label: "復習", icon: "📚" },
    { id: "business", label: "ビジネス", icon: "💼" },
  ];

  return (
    <div className="bg-white border-b px-4 py-2 overflow-x-auto">
      <div className="flex gap-2 max-w-4xl mx-auto">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentMode === mode.id
                ? "bg-tsumugi-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="mr-1">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
