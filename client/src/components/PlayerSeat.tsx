/*
 * PlayerSeat — HOUSE POKER
 * Shows player avatar, name, chips, cards, bet, and turn timer
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
  isWinner?: boolean;
}

export default function PlayerSeat({ player, isCurrentTurn, showCards, isHuman, position, isWinner }: PlayerSeatProps) {
  const avatarUrl = ASSETS.avatars[player.avatar as keyof typeof ASSETS.avatars] || ASSETS.avatars.fox;

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-0.5"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: player.folded ? 0.4 : 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: player.seatIndex * 0.06 }}
    >
      {/* Cards above avatar */}
      {player.holeCards.length > 0 && !player.folded && (
        <div className="flex gap-0.5 mb-0.5">
          {showCards || isHuman ? (
            player.holeCards.map((card, i) => (
              <PlayingCard key={i} card={card} small delay={i * 0.1} />
            ))
          ) : (
            player.holeCards.map((_, i) => (
              <PlayingCard key={i} faceDown small delay={i * 0.1} />
            ))
          )}
        </div>
      )}

      {/* Avatar container */}
      <div className="relative">
        {/* Turn glow ring */}
        {isCurrentTurn && !player.folded && (
          <motion.div
            className="absolute -inset-1.5 rounded-full"
            style={{
              border: '2px solid #00F0FF',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {/* Winner glow */}
        {isWinner && (
          <motion.div
            className="absolute -inset-1.5 rounded-full"
            style={{
              border: '2px solid #D4AF37',
              boxShadow: '0 0 20px rgba(212,175,55,0.7)',
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full overflow-hidden"
          style={{
            border: isWinner ? '2px solid #D4AF37'
              : isCurrentTurn ? '2px solid #00F0FF'
              : '2px solid rgba(255,255,255,0.15)',
            filter: player.folded ? 'grayscale(1)' : 'none',
          }}
        >
          <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        </div>

        {/* D / S / B badge */}
        {(player.isDealer || player.isSB || player.isBB) && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full flex items-center justify-center text-[7px] font-black"
            style={{
              background: player.isDealer ? '#D4AF37' : player.isSB ? '#4CAF50' : '#2196F3',
              color: player.isDealer ? '#1a1a0a' : '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {player.isDealer ? 'D' : player.isSB ? 'S' : 'B'}
          </div>
        )}
      </div>

      {/* Name + chips bar */}
      <div
        className="rounded-lg px-2 py-0.5 text-center mt-0.5 min-w-[56px]"
        style={{
          background: isWinner
            ? 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(184,134,11,0.15) 100%)'
            : 'rgba(10,10,20,0.8)',
          border: isWinner ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="text-[9px] font-medium truncate max-w-[64px]"
          style={{ color: player.folded ? 'rgba(255,255,255,0.3)' : '#ddd' }}>
          {player.name}
        </div>
        <div className="text-[10px] font-bold"
          style={{
            color: isWinner ? '#D4AF37' : '#4CAF50',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
          {player.chips.toFixed(0)}
        </div>
      </div>

      {/* Bet badge */}
      <AnimatePresence>
        {player.bet > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-0.5"
          >
            <div className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#1a1a0a',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              {player.bet.toFixed(0)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action label */}
      <AnimatePresence>
        {player.lastAction && !player.folded && (
          <motion.div
            initial={{ scale: 0, y: 4 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-[8px] font-bold uppercase tracking-wider"
            style={{
              color: player.lastAction === 'fold' ? '#EF5350'
                : player.lastAction === 'raise' || player.lastAction === 'allin' ? '#D4AF37'
                : player.lastAction === 'call' ? '#4CAF50'
                : '#00F0FF',
            }}
          >
            {player.lastAction === 'allin' ? 'ALL IN' : player.lastAction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand result */}
      {player.handResult && !player.folded && (
        <div className="text-[8px] font-medium text-amber-300 whitespace-nowrap">
          {player.handResult.name}
        </div>
      )}
    </motion.div>
  );
}
