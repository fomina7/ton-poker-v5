/*
 * Lobby — Cyber Noir Casino theme
 * Table selection with tabs for Hold'em, Omaha, Fast Fold
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Users, Zap, Crown, Star, Timer, Flame, ChevronRight } from 'lucide-react';
import { ASSETS } from '@/lib/assets';
import BottomNav from '@/components/BottomNav';

type GameMode = 'holdem' | 'omaha' | 'fastfold';

const TABLES: Record<GameMode, Array<{
  id: string; name: string; blinds: string; players: string;
  minBuy: number; maxBuy: number; tier: string; icon: typeof Star; hot: boolean;
}>> = {
  holdem: [
    { id: 'beginner-1', name: 'Starter Table', blinds: '5/10', players: '4/6', minBuy: 500, maxBuy: 2000, tier: 'bronze', icon: Star, hot: false },
    { id: 'regular-1', name: 'Silver Lounge', blinds: '10/20', players: '3/6', minBuy: 1000, maxBuy: 5000, tier: 'silver', icon: Zap, hot: false },
    { id: 'regular-2', name: 'Gold Room', blinds: '25/50', players: '5/6', minBuy: 2500, maxBuy: 10000, tier: 'gold', icon: Crown, hot: true },
    { id: 'high-1', name: 'Diamond VIP', blinds: '50/100', players: '2/6', minBuy: 5000, maxBuy: 25000, tier: 'diamond', icon: Crown, hot: false },
    { id: 'high-2', name: 'Whale Tank', blinds: '100/200', players: '1/6', minBuy: 10000, maxBuy: 50000, tier: 'platinum', icon: Flame, hot: false },
  ],
  omaha: [
    { id: 'omaha-1', name: 'PLO Starter', blinds: '5/10', players: '3/6', minBuy: 500, maxBuy: 2000, tier: 'bronze', icon: Star, hot: false },
    { id: 'omaha-2', name: 'PLO Gold', blinds: '25/50', players: '4/6', minBuy: 2500, maxBuy: 10000, tier: 'gold', icon: Crown, hot: true },
    { id: 'omaha-3', name: 'PLO High Stakes', blinds: '100/200', players: '2/6', minBuy: 10000, maxBuy: 50000, tier: 'platinum', icon: Flame, hot: false },
  ],
  fastfold: [
    { id: 'fast-1', name: 'Turbo Blitz', blinds: '10/20', players: '18/50', minBuy: 1000, maxBuy: 5000, tier: 'turbo', icon: Timer, hot: true },
    { id: 'fast-2', name: 'Lightning', blinds: '25/50', players: '12/50', minBuy: 2500, maxBuy: 10000, tier: 'gold', icon: Zap, hot: false },
    { id: 'fast-3', name: 'Hyper Speed', blinds: '50/100', players: '8/50', minBuy: 5000, maxBuy: 25000, tier: 'diamond', icon: Flame, hot: false },
  ],
};

const MODE_LABELS: Record<GameMode, { name: string; desc: string }> = {
  holdem: { name: "Hold'em", desc: 'Texas Hold\'em NL' },
  omaha: { name: 'Omaha', desc: 'Pot Limit Omaha' },
  fastfold: { name: 'Fast Fold', desc: 'Instant new hand' },
};

const TIER_STYLES: Record<string, { bg: string; border: string; iconBg: string }> = {
  bronze: { bg: 'from-amber-950/30 to-amber-900/10', border: 'border-amber-700/30', iconBg: 'bg-amber-800/40 text-amber-400' },
  silver: { bg: 'from-gray-800/30 to-gray-700/10', border: 'border-gray-500/30', iconBg: 'bg-gray-700/40 text-gray-300' },
  gold: { bg: 'from-yellow-950/30 to-yellow-900/10', border: 'border-yellow-600/30', iconBg: 'bg-yellow-800/40 text-yellow-400' },
  diamond: { bg: 'from-cyan-950/30 to-cyan-900/10', border: 'border-cyan-500/30', iconBg: 'bg-cyan-800/40 text-cyan-300' },
  platinum: { bg: 'from-purple-950/30 to-purple-900/10', border: 'border-purple-500/30', iconBg: 'bg-purple-800/40 text-purple-300' },
  turbo: { bg: 'from-orange-950/30 to-orange-900/10', border: 'border-orange-500/30', iconBg: 'bg-orange-800/40 text-orange-400' },
};

export default function Lobby() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<GameMode>('holdem');

  const tables = TABLES[mode];

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'radial-gradient(ellipse at top, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              TON POKER
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Premium Poker Platform</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full px-3 py-1.5 flex items-center gap-1.5"
              style={{
                background: 'rgba(10, 10, 20, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}>
              <img src={ASSETS.ui.coin} alt="" className="w-4 h-4" />
              <span className="text-sm font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                10,000
              </span>
            </div>
          </div>
        </div>

        {/* Quick play banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <div className="p-4 flex items-center gap-4">
            <motion.img
              src={ASSETS.ui.lootbox}
              alt=""
              className="w-14 h-14"
              animate={{ y: [0, -4, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gold mb-0.5">Quick Play</h3>
              <p className="text-[11px] text-gray-400">Jump into the next available table</p>
            </div>
            <motion.button
              onClick={() => navigate('/game/quick')}
              className="btn-primary-poker px-5 py-2.5 rounded-xl text-sm font-bold tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PLAY
            </motion.button>
          </div>
        </motion.div>

        {/* Game mode tabs */}
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{
          background: 'rgba(10, 10, 20, 0.5)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {(Object.keys(MODE_LABELS) as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === m ? 'btn-primary-poker' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {MODE_LABELS[m].name}
            </button>
          ))}
        </div>
      </div>

      {/* Tables list */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {MODE_LABELS[mode].desc}
          </h2>
          <span className="text-[10px] text-gray-600">{tables.length} tables</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {tables.map((table, i) => {
              const style = TIER_STYLES[table.tier] || TIER_STYLES.bronze;
              const Icon = table.icon;
              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/game/${table.id}`)}
                  className={`rounded-xl p-3.5 border bg-gradient-to-r ${style.bg} ${style.border} cursor-pointer hover:brightness-110 transition-all active:scale-[0.98] relative overflow-hidden`}
                >
                  {table.hot && (
                    <motion.div
                      className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="text-[8px] font-bold text-red-400 uppercase">Hot</span>
                    </motion.div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.iconBg}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{table.name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-gray-400">
                            Blinds: <span className="text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{table.blinds}</span>
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Users size={11} /> {table.players}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[9px] text-gray-500 uppercase">Buy-in</div>
                        <div className="text-sm font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {table.minBuy.toLocaleString()}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-600" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
