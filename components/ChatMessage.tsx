import { Message } from '@/types';
import CorrectionCard from './CorrectionCard';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="text-xs text-cyan-600 font-medium mb-1.5 px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            紬
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-br-md'
              : 'bg-white/80 backdrop-blur-sm border border-cyan-100/50 text-gray-800 rounded-bl-md'
          }`}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.correction && (
          <div className="mt-2.5">
            <CorrectionCard correction={message.correction} />
          </div>
        )}
        <div className="text-[11px] text-gray-400 mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
