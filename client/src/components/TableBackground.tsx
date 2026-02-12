/**
 * TableBackground — Premium atmospheric background
 * Uses AI-generated background image + CSS particle overlay
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '@/lib/assets';

export default function TableBackground() {
  /* Floating gold sparkles */
  const sparkles = useMemo(() =>
    Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      dur: 8 + Math.random() * 12,
      delay: Math.random() * 6,
      drift: -20 + Math.random() * 40,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* AI-generated atmospheric background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url(${ASSETS.tableBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0" style={{
        background: 'rgba(0,0,0,0.3)',
      }} />

      {/* Table ambient glow — green reflection from felt */}
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[65%] h-[45%] rounded-[50%]" style={{
        background: 'radial-gradient(ellipse, rgba(22, 120, 55, 0.12) 0%, rgba(15, 80, 40, 0.04) 40%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {/* Floating gold sparkles */}
      {sparkles.map(p => (
        <motion.div
          key={`sp-${p.id}`}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `radial-gradient(circle, rgba(212, 175, 55, 0.7) 0%, rgba(212, 175, 55, 0) 70%)`,
          }}
          animate={{
            y: [0, -50 - Math.random() * 30],
            x: [0, p.drift],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)',
      }} />
    </div>
  );
}
