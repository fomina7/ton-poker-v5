/*
 * ChatPanel — Cyber Noir Casino theme
 * In-game chat panel with quick messages
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

const QUICK_MESSAGES = [
  'Nice hand!', 'Good game', 'Well played', 'Unlucky...',
  'GG', 'LOL', 'NH', 'TY', 'GL', 'WP',
];

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

const SAMPLE_MESSAGES: ChatMessage[] = [
  { id: 1, sender: 'System', text: 'Game started', time: '0:00', isSystem: true },
  { id: 2, sender: 'FoxTrick', text: 'GL everyone!', time: '0:05' },
  { id: 3, sender: 'SharkBite', text: 'Nice hand!', time: '1:23' },
  { id: 4, sender: 'System', text: 'OwlEye wins 340 chips', time: '2:15', isSystem: true },
];

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState('');

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'You',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    }]);
    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed left-2 bottom-20 z-30 w-64 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(10, 10, 20, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '300px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <MessageCircle size={14} className="text-cyan-neon" />
              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Chat</span>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
              <X size={12} className="text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-36 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className={`text-[10px] ${msg.isSystem ? 'text-gray-600 italic' : ''}`}>
                {!msg.isSystem && (
                  <span className={`font-bold ${msg.sender === 'You' ? 'text-gold' : 'text-cyan-neon'}`}>
                    {msg.sender}:&nbsp;
                  </span>
                )}
                <span className={msg.isSystem ? '' : 'text-gray-300'}>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Quick messages */}
          <div className="px-2 py-1.5 border-t border-white/5 flex flex-wrap gap-1">
            {QUICK_MESSAGES.slice(0, 6).map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg)}
                className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-2 border-t border-white/5 flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-gray-600 outline-none focus:bg-white/10"
            />
            <button
              onClick={() => sendMessage(input)}
              className="p-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 transition-colors"
            >
              <Send size={12} className="text-gold" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
