/*
 * PlayerSeat — Cyber Noir Casino theme
 * Renders a player seat around the poker table with avatar, chips, action badge
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/lib/pokerEngine';
import { ASSETS } from '@/lib/assets';
import PlayingCard from './PlayingCard';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  showCards: boolean;
  isHuman: boolean;
  position: { x: string; y: string };
}

const ACTION_LABELS: Record<string, { text: string; cls: string }> = {
  fold: { text: 'FOLD', cls: 'bg-red-900/70 text-red-300 border-red-700/40' },
  check: { text: 'CHECK', cls: 'bg-cyan-900/70 text-cyan-300 border-cyan-700/40' },
  call: { text: 'CALL', cls: 'bg-green-900/70 text-green-300 border-green-700/40' },
  raise: { text: 'RAISE', cls: 'bg-amber-900/70 text-amber-300 border-amber-700/40' },
  allin: { text: 'ALL IN', cls: 'bg-purple-900/70 text-purple-200 border-purple-600/40' },
};

export default function PlayerSeat({ player, isCurrentTurn, showCards, isHuman, position }: PlayerSeatProps) {
  const avatarUrl = ASSETS.avatars[player.avatar as keyof typeof ASSETS.avatars] || ASSETS.avatars.fox;

  // Don't render the human player seat on the table (they have their own card area below)
  if (isHuman) {
    return (
      <motion.div
        className="absolute flex flex-col items-center"
        style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Avatar */}
        <div className="relative">
          {isCurrentTurn && !player.folded && (
            <motion.div
              className="absolute -inset-1.5 rounded-full"
              style={{
                border: '2px solid #00F0FF',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
            player.folded ? 'opacity-30 grayscale border-gray-700' :
            isCurrentTurn ? 'border-cyan-400' : 'border-gold/40'
          }`}>
            <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          </div>
          {player.isDealer && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] font-black text-black">D</div>
          )}
        </div>
        {/* Name + chips */}
        <div className="rounded-lg px-2 py-0.5 text-center mt-1" style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="text-[9px] text-gray-300 font-medium">{player.name}</div>
          <div className="text-[10px] font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {player.chips.toLocaleString()}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-0.5"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: player.seatIndex * 0.08 }}
    >
      {/* Cards above avatar for bots during showdown */}
      {showCards && player.holeCards.length > 0 && !player.folded && (
        <div className="flex gap-0.5 mb-0.5">
          {player.holeCards.map((card, i) => (
            <PlayingCard key={i} card={card} small delay={i * 0.1} />
          ))}
        </div>
      )}

      {/* Avatar container */}
      <div className="relative">
        {/* Turn indicator */}
        {isCurrentTurn && !player.folded && (
          <motion.div
            className="absolute -inset-1.5 rounded-full"
            style={{
              border: '2px solid #00F0FF',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full overflow-hidden border-2 ${
          player.folded ? 'opacity-30 grayscale border-gray-700' :
          isCurrentTurn ? 'border-cyan-400' : 'border-gold/40'
        }`}>
          <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        </div>

        {/* Dealer / SB / BB badge */}
        {(player.isDealer || player.isSB || player.isBB) && (
          <div className={`absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[7px] font-black ${
            player.isDealer ? 'bg-yellow-500 text-black' :
            player.isSB ? 'bg-blue-500 text-white' :
            'bg-red-500 text-white'
          }`} style={{ width: '18px', height: '18px' }}>
            {player.isDealer ? 'D' : player.isSB ? 'S' : 'B'}
          </div>
        )}
      </div>

      {/* Name + chips */}
      <div className="rounded-lg px-2 py-0.5 text-center min-w-[60px]" style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="text-[9px] text-gray-300 font-medium truncate max-w-[70px]">{player.name}</div>
        <div className="text-[10px] font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {player.chips.toLocaleString()}
        </div>
      </div>

      {/* Bet amount */}
      <AnimatePresence>
        {player.bet > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-0.5"
          >
            <img src={ASSETS.chips.gold} alt="" className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold text-amber-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {player.bet.toLocaleString()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action badge */}
      <AnimatePresence>
        {player.lastAction && (
          <motion.div
            initial={{ scale: 0, y: 5 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold border ${
              ACTION_LABELS[player.lastAction]?.cls || 'bg-gray-800 text-gray-300 border-gray-600'
            }`}
          >
            {ACTION_LABELS[player.lastAction]?.text || player.lastAction.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
