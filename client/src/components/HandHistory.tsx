/*
 * HandHistory — Cyber Noir Casino theme
 * Shows a log of recent hands played with details
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { ASSETS, SUIT_SYMBOLS, SUIT_COLORS, Card } from '@/lib/assets';

export interface HandRecord {
  id: number;
  time: string;
  blinds: string;
  result: 'win' | 'loss';
  amount: number;
  hand: string;
  holeCards: Card[];
  communityCards: Card[];
  potSize: number;
}

// Generate some sample hand history
const SAMPLE_HANDS: HandRecord[] = [
  {
    id: 1, time: '2 min ago', blinds: '10/20', result: 'win', amount: 340,
    hand: 'Two Pair', holeCards: [{ suit: 'hearts', rank: 'A' }, { suit: 'diamonds', rank: 'K' }],
    communityCards: [{ suit: 'clubs', rank: 'A' }, { suit: 'spades', rank: 'K' }, { suit: 'hearts', rank: '7' }, { suit: 'diamonds', rank: '3' }, { suit: 'clubs', rank: '9' }],
    potSize: 340,
  },
  {
    id: 2, time: '5 min ago', blinds: '10/20', result: 'loss', amount: -200,
    hand: 'One Pair', holeCards: [{ suit: 'spades', rank: 'Q' }, { suit: 'hearts', rank: 'J' }],
    communityCards: [{ suit: 'diamonds', rank: 'Q' }, { suit: 'clubs', rank: '5' }, { suit: 'hearts', rank: '2' }, { suit: 'spades', rank: '8' }, { suit: 'diamonds', rank: '4' }],
    potSize: 400,
  },
  {
    id: 3, time: '8 min ago', blinds: '10/20', result: 'win', amount: 120,
    hand: 'Flush', holeCards: [{ suit: 'hearts', rank: '9' }, { suit: 'hearts', rank: '6' }],
    communityCards: [{ suit: 'hearts', rank: 'K' }, { suit: 'hearts', rank: '3' }, { suit: 'clubs', rank: 'J' }, { suit: 'hearts', rank: '2' }, { suit: 'spades', rank: '7' }],
    potSize: 120,
  },
  {
    id: 4, time: '12 min ago', blinds: '10/20', result: 'loss', amount: -80,
    hand: 'High Card', holeCards: [{ suit: 'diamonds', rank: '10' }, { suit: 'clubs', rank: '8' }],
    communityCards: [{ suit: 'spades', rank: 'A' }, { suit: 'hearts', rank: '4' }, { suit: 'diamonds', rank: '6' }, { suit: 'clubs', rank: '2' }, { suit: 'spades', rank: '3' }],
    potSize: 160,
  },
  {
    id: 5, time: '18 min ago', blinds: '10/20', result: 'win', amount: 560,
    hand: 'Full House', holeCards: [{ suit: 'spades', rank: 'J' }, { suit: 'hearts', rank: 'J' }],
    communityCards: [{ suit: 'diamonds', rank: 'J' }, { suit: 'clubs', rank: '7' }, { suit: 'hearts', rank: '7' }, { suit: 'spades', rank: '2' }, { suit: 'diamonds', rank: '9' }],
    potSize: 560,
  },
];

function MiniCard({ card }: { card: Card }) {
  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  return (
    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-white/10" style={{ color }}>
      {card.rank}{symbol}
    </span>
  );
}

interface HandHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HandHistory({ isOpen, onClose }: HandHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-lg rounded-t-2xl max-h-[80vh] overflow-y-auto"
            style={{
              background: 'rgba(10, 10, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderBottom: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10"
              style={{ background: 'rgba(10, 10, 20, 0.95)' }}>
              <h2 className="text-lg font-bold gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Hand History
              </h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Hands list */}
            <div className="p-4 space-y-2">
              {SAMPLE_HANDS.map((hand) => (
                <div key={hand.id} className="rounded-xl overflow-hidden" style={{
                  background: 'rgba(20, 20, 35, 0.5)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <button
                    onClick={() => setExpandedId(expandedId === hand.id ? null : hand.id)}
                    className="w-full p-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${hand.result === 'win' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <div className="text-sm font-medium text-white">{hand.hand}</div>
                        <div className="text-[10px] text-gray-500">{hand.time} · {hand.blinds}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold font-mono ${hand.result === 'win' ? 'text-green-400' : 'text-red-400'}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {hand.result === 'win' ? '+' : ''}{hand.amount.toLocaleString()}
                      </span>
                      {expandedId === hand.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === hand.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-white/5">
                          <div className="mb-2">
                            <div className="text-[10px] text-gray-500 mb-1">Your Cards</div>
                            <div className="flex gap-1">
                              {hand.holeCards.map((c, i) => <MiniCard key={i} card={c} />)}
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="text-[10px] text-gray-500 mb-1">Board</div>
                            <div className="flex gap-1">
                              {hand.communityCards.map((c, i) => <MiniCard key={i} card={c} />)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>Pot: <span className="text-gold font-bold">{hand.potSize.toLocaleString()}</span></span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
