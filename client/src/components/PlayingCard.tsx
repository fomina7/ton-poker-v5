/*
 * PlayingCard — Cyber Noir Casino theme
 * Renders a single playing card with suit symbol and rank
 * CSS-rendered with premium design, no external images needed
 */
import { motion } from 'framer-motion';
import { Card, SUIT_SYMBOLS, SUIT_COLORS } from '@/lib/assets';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  small?: boolean;
  highlighted?: boolean;
  delay?: number;
}

export default function PlayingCard({ card, faceDown = false, small = false, highlighted = false, delay = 0 }: PlayingCardProps) {
  const w = small ? 'w-9 h-13' : 'w-[52px] h-[74px]';

  if (faceDown || !card) {
    return (
      <motion.div
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay }}
        className={`${small ? 'w-9 h-[52px]' : 'w-[52px] h-[74px]'} rounded-lg relative overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        <div className="absolute inset-[3px] rounded-md"
          style={{
            background: `
              repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(212,175,55,0.06) 2px, rgba(212,175,55,0.06) 4px),
              repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(212,175,55,0.06) 2px, rgba(212,175,55,0.06) 4px)
            `,
            border: '1px solid rgba(212, 175, 55, 0.12)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 70%)',
            border: '1px solid rgba(212,175,55,0.2)',
          }} />
        </div>
      </motion.div>
    );
  }

  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <motion.div
      initial={{ rotateY: -180, opacity: 0, scale: 0.8 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay, type: 'spring', stiffness: 200 }}
      className={`${small ? 'w-9 h-[52px]' : 'w-[52px] h-[74px]'} rounded-lg relative overflow-hidden flex flex-col justify-between select-none`}
      style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8F8F8 40%, #F0F0F0 100%)',
        border: highlighted ? '2px solid rgba(0, 240, 255, 0.6)' : '1px solid rgba(180, 180, 180, 0.4)',
        boxShadow: highlighted
          ? '0 0 12px rgba(0, 240, 255, 0.3), 0 3px 8px rgba(0,0,0,0.4)'
          : '0 2px 6px rgba(0,0,0,0.35)',
        padding: small ? '2px' : '3px',
      }}
    >
      {/* Top-left rank + suit */}
      <div className="flex flex-col items-start leading-none" style={{ color }}>
        <span className="font-bold" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: small ? '8px' : '12px',
          lineHeight: 1,
        }}>
          {card.rank}
        </span>
        <span style={{ fontSize: small ? '7px' : '10px', lineHeight: 1 }}>{symbol}</span>
      </div>

      {/* Center suit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{
          color,
          fontSize: small ? '14px' : '22px',
          opacity: 0.85,
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
        }}>{symbol}</span>
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div className="flex flex-col items-end leading-none rotate-180" style={{ color }}>
        <span className="font-bold" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: small ? '8px' : '12px',
          lineHeight: 1,
        }}>
          {card.rank}
        </span>
        <span style={{ fontSize: small ? '7px' : '10px', lineHeight: 1 }}>{symbol}</span>
      </div>
    </motion.div>
  );
}
