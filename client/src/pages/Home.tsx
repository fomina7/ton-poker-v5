/**
 * Home — HOUSE POKER Landing
 * Premium casino-style landing page
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ASSETS } from '@/lib/assets';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats } = trpc.tables.onlineStats.useQuery();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at center, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
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
            animate={{ y: [0, -60 - Math.random() * 40, 0], opacity: [0.05, 0.4, 0.05] }}
            transition={{ duration: 5 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 4 }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)', top: '20%' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Logo */}
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
          <img src={ASSETS.logo} alt="HOUSE POKER" className="w-20 h-20" style={{ filter: 'drop-shadow(0 4px 16px rgba(212,175,55,0.3))' }} />
        </motion.div>
        <h1 className="text-5xl font-black tracking-wider mb-2 gold-text font-display">
          HOUSE POKER
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase">Premium Texas Hold'em</p>
      </motion.div>

      {/* Floating chips */}
      <div className="relative w-56 h-32 mb-8">
        {[
          { src: ASSETS.chips.gold, cls: 'w-16 h-16 left-0 top-4', dur: 3.5, del: 0 },
          { src: ASSETS.chips.red, cls: 'w-14 h-14 left-20 top-0', dur: 4, del: 0.5 },
          { src: ASSETS.chips.blue, cls: 'w-12 h-12 right-4 top-6', dur: 3, del: 1 },
          { src: ASSETS.chips.black, cls: 'w-13 h-13 left-10 bottom-0', dur: 3.8, del: 0.3 },
          { src: ASSETS.chips.green, cls: 'w-11 h-11 right-8 bottom-2', dur: 3.3, del: 0.7 },
        ].map((chip, i) => (
          <motion.img
            key={i}
            src={chip.src}
            alt=""
            className={`absolute ${chip.cls}`}
            animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
            transition={{ duration: chip.dur, repeat: Infinity, delay: chip.del }}
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
          />
        ))}
      </div>

      {/* Online stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 mb-6"
        >
          <div className="glass-panel px-4 py-2 rounded-xl text-center">
            <div className="text-lg font-bold text-gold font-mono-poker">{stats.onlinePlayers}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Online</div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl text-center">
            <div className="text-lg font-bold text-cyan-neon font-mono-poker">{stats.activeTables}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Tables</div>
          </div>
        </motion.div>
      )}

      {/* Play button */}
      <motion.button
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={() => isAuthenticated ? navigate('/lobby') : window.location.href = getLoginUrl()}
        className="btn-primary-poker px-14 py-4 rounded-2xl text-lg tracking-wider relative z-10 font-display"
        style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 0 80px rgba(212, 175, 55, 0.1)' }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(212, 175, 55, 0.5)' }}
        whileTap={{ scale: 0.95 }}
      >
        {isAuthenticated ? 'PLAY NOW' : 'SIGN IN TO PLAY'}
      </motion.button>

      {/* User info */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-xs text-gray-500"
        >
          Welcome back, <span className="text-gold">{user.name}</span>
        </motion.div>
      )}

      {/* Bottom avatars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-3 mt-10"
      >
        {['fox', 'shark', 'owl', 'wolf', 'bear', 'dragon', 'lion'].map((key, i) => (
          <motion.div
            key={key}
            className="w-10 h-10 rounded-full overflow-hidden"
            style={{ border: '2px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
          >
            <img src={ASSETS.avatars[key as keyof typeof ASSETS.avatars]} alt={key} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-gray-700 text-xs mt-8"
      >
        v2.0 — Play responsibly
      </motion.p>
    </div>
  );
}
