import { Message } from '@/types';
import CorrectionCard from './CorrectionCard';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[82%] sm:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="text-xs text-cyan-600 font-medium mb-2 px-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            紬
          </div>
        )}
        <div
          className={`rounded-3xl px-4 py-3.5 shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-br-sm'
              : 'bg-white/90 backdrop-blur-sm border border-cyan-100/50 text-gray-800 rounded-bl-sm'
          }`}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.correction && (
          <div className="mt-3">
            <CorrectionCard correction={message.correction} />
          </div>
        )}
        <div className="text-[10px] text-gray-400 mt-2 px-2">
          {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
