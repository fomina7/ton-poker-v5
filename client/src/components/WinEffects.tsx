/*
 * WinEffects — Cyber Noir Casino theme
 * Dramatic win animations: confetti, chip rain, golden burst
 */
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '@/lib/assets';

interface WinEffectsProps {
  show: boolean;
  isHumanWin: boolean;
  amount: number;
}

export default function WinEffects({ show, isHumanWin, amount }: WinEffectsProps) {
  if (!show) return null;

  const isBigWin = amount > 500;
  const isJackpot = amount > 2000;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Golden burst from center */}
          {isHumanWin && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.5 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.5) 0%, transparent 70%)',
              }}
            />
          )}

          {/* Chip rain */}
          {isHumanWin && isBigWin && Array.from({ length: 12 }).map((_, i) => (
            <motion.img
              key={`chip-${i}`}
              src={[ASSETS.chips.gold, ASSETS.chips.red, ASSETS.chips.blue][i % 3]}
              alt=""
              className="absolute w-6 h-6"
              style={{ left: `${8 + Math.random() * 84}%`, top: '-5%' }}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{
                y: ['0vh', '110vh'],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360 + Math.random() * 360],
                x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100],
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                delay: Math.random() * 0.8,
                ease: 'easeIn',
              }}
            />
          ))}

          {/* Confetti particles */}
          {isHumanWin && Array.from({ length: isJackpot ? 40 : 20 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute"
              style={{
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: ['#D4AF37', '#00F0FF', '#FF3B3B', '#4CAF50', '#F5E6A3', '#9C27B0'][i % 6],
                left: `${Math.random() * 100}%`,
                top: '-3%',
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                rotate: [0, 720 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'easeIn',
              }}
            />
          ))}

          {/* Light rays for jackpot */}
          {isJackpot && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`ray-${i}`}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                width: '2px',
                height: '200px',
                background: `linear-gradient(to top, transparent, rgba(212, 175, 55, 0.4))`,
                transform: `rotate(${i * 45}deg)`,
                transformOrigin: 'bottom center',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1, 0], opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.5, delay: 0.2 + i * 0.05 }}
            />
          ))}

          {/* Sparkle particles */}
          {isHumanWin && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-gold"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                scale: [0, 2, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: 0.5 + Math.random() * 1,
                repeat: 2,
                repeatDelay: 0.3,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
