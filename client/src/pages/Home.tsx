/*
 * Home — Cyber Noir Casino theme
 * Landing / splash screen for HOUSE POKER
 */
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ASSETS } from '@/lib/assets';

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at center, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#00F0FF' : '#fff',
            }}
            animate={{
              y: [0, -60 - Math.random() * 40, 0],
              opacity: [0.05, 0.4, 0.05],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      {/* Radial glow behind logo */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
          top: '20%',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Logo area */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
        className="text-center mb-8 relative z-10"
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-4"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <img src={ASSETS.ui.crown} alt="" className="w-14 h-14" />
        </motion.div>
        <h1 className="text-5xl font-black tracking-wider mb-2 gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          HOUSE POKER
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase">Premium Texas Hold'em</p>
      </motion.div>

      {/* Floating chips decoration */}
      <div className="relative w-56 h-36 mb-8">
        <motion.img
          src={ASSETS.chips.gold}
          alt=""
          className="absolute w-16 h-16 left-0 top-4"
          animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(212, 175, 55, 0.3))' }}
        />
        <motion.img
          src={ASSETS.chips.red}
          alt=""
          className="absolute w-14 h-14 left-20 top-0"
          animate={{ y: [0, -16, 0], rotate: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(200, 50, 50, 0.3))' }}
        />
        <motion.img
          src={ASSETS.chips.blue}
          alt=""
          className="absolute w-12 h-12 right-4 top-6"
          animate={{ y: [0, -14, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(50, 100, 200, 0.3))' }}
        />
        <motion.img
          src={ASSETS.chips.black}
          alt=""
          className="absolute w-13 h-13 left-10 bottom-0"
          animate={{ y: [0, -8, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: 0.3 }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))' }}
        />
        <motion.img
          src={ASSETS.chips.green}
          alt=""
          className="absolute w-11 h-11 right-8 bottom-2"
          animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 3.3, repeat: Infinity, delay: 0.7 }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(50, 200, 50, 0.3))' }}
        />
      </div>

      {/* Play button */}
      <motion.button
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={() => navigate('/lobby')}
        className="btn-primary-poker px-14 py-4 rounded-2xl text-lg tracking-wider relative z-10"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 0 80px rgba(212, 175, 55, 0.1)',
        }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(212, 175, 55, 0.5)' }}
        whileTap={{ scale: 0.95 }}
      >
        PLAY NOW
      </motion.button>

      {/* Bottom avatars showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-3 mt-12"
      >
        {['fox', 'shark', 'owl', 'wolf', 'bear'].map((key, i) => (
          <motion.div
            key={key}
            className="w-11 h-11 rounded-full overflow-hidden"
            style={{
              border: '2px solid rgba(212, 175, 55, 0.25)',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)',
            }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
          >
            <img
              src={ASSETS.avatars[key as keyof typeof ASSETS.avatars]}
              alt={key}
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-gray-700 text-xs mt-8"
      >
        v1.0 — Play responsibly
      </motion.p>
    </div>
  );
}
