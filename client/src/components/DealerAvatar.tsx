/*
 * DealerAvatar — Cyber Noir Casino theme
 * Animated dealer indicator on the table
 */
import { motion } from 'framer-motion';

interface DealerAvatarProps {
  phase: string;
}

export default function DealerAvatar({ phase }: DealerAvatarProps) {
  const isDealing = phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river';

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-5"
      style={{ top: '18%' }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Dealer chip */}
      <motion.div
        className="w-8 h-8 rounded-full flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)',
        }}
        animate={isDealing ? {
          boxShadow: [
            '0 0 12px rgba(212, 175, 55, 0.2)',
            '0 0 20px rgba(212, 175, 55, 0.5)',
            '0 0 12px rgba(212, 175, 55, 0.2)',
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[9px] font-black text-gold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          D
        </span>
      </motion.div>
    </motion.div>
  );
}
