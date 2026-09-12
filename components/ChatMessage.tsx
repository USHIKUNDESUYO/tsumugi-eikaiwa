import { Message } from '@/types';
import CorrectionCard from './CorrectionCard';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="text-xs text-cyan-600 font-semibold mb-1.5 px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
            紬
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-teal-600 text-white rounded-br-md'
              : 'bg-white border border-gray-200/70 text-gray-800 rounded-bl-md shadow-sm'
          }`}
        >
          <p className="text-base leading-7 whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {message.correction && (
          <div className="mt-2">
            <CorrectionCard correction={message.correction} />
          </div>
        )}
        <div className="text-[10px] text-gray-400 mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
