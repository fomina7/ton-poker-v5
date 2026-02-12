/*
 * Tournaments — Cyber Noir Casino theme
 * Tournament listing and registration
 */
import { motion } from 'framer-motion';
import { Clock, Users, Trophy, Zap, Crown, Timer, Star, Flame } from 'lucide-react';
import { ASSETS } from '@/lib/assets';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const TOURNAMENTS = [
  {
    id: 't1', name: 'Freeroll Friday', buyIn: 0, prize: '10,000',
    players: '45/100', starts: '15 min', status: 'registering',
    tier: 'free', icon: Zap,
  },
  {
    id: 't2', name: 'Silver Showdown', buyIn: 500, prize: '25,000',
    players: '28/50', starts: '1h 30m', status: 'registering',
    tier: 'silver', icon: Star,
  },
  {
    id: 't3', name: 'Gold Rush', buyIn: 2500, prize: '100,000',
    players: '12/30', starts: '3h', status: 'registering',
    tier: 'gold', icon: Crown,
  },
  {
    id: 't4', name: 'Diamond Championship', buyIn: 10000, prize: '500,000',
    players: '8/20', starts: 'Tomorrow', status: 'upcoming',
    tier: 'diamond', icon: Crown,
  },
  {
    id: 't5', name: 'Turbo Sprint', buyIn: 100, prize: '5,000',
    players: '50/50', starts: 'In Progress', status: 'running',
    tier: 'turbo', icon: Timer,
  },
];

const TIER_COLORS: Record<string, string> = {
  free: 'from-green-950/30 to-green-900/10 border-green-600/25',
  silver: 'from-gray-800/30 to-gray-700/10 border-gray-500/25',
  gold: 'from-yellow-950/30 to-yellow-900/10 border-yellow-600/25',
  diamond: 'from-cyan-950/30 to-cyan-900/10 border-cyan-500/25',
  turbo: 'from-orange-950/30 to-orange-900/10 border-orange-500/25',
};

export default function Tournaments() {
  return (
    <div className="min-h-screen pb-24" style={{
      background: 'radial-gradient(ellipse at top, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold gold-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              TOURNAMENTS
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Compete for massive prizes</p>
          </div>
          <motion.img
            src={ASSETS.ui.trophy}
            alt=""
            className="w-10 h-10"
            animate={{ y: [0, -3, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        {/* Featured tournament */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-5 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(139, 0, 0, 0.06) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          {/* Animated glow */}
          <motion.div
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="p-4 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-gold" />
              <span className="text-xs font-bold text-gold uppercase tracking-wider">Featured</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Weekly Championship</h3>
            <p className="text-xs text-gray-400 mb-3">Sunday 8PM — Top 3 win prizes</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Prize Pool</div>
                  <div className="text-lg font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    1,000,000
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Buy-in</div>
                  <div className="text-sm font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    5,000
                  </div>
                </div>
              </div>
              <motion.button
                onClick={() => toast.success('Registered for Weekly Championship!')}
                className="btn-primary-poker px-5 py-2 rounded-xl text-sm font-bold"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                REGISTER
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tournament list */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Upcoming</h2>
        <div className="space-y-3">
          {TOURNAMENTS.map((t, i) => {
            const Icon = t.icon;
            const tierClass = TIER_COLORS[t.tier] || TIER_COLORS.free;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl p-4 border bg-gradient-to-r ${tierClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-gold" />
                    <span className="text-sm font-bold text-white">{t.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    t.status === 'registering' ? 'text-green-400' :
                    t.status === 'running' ? 'text-orange-400' :
                    'text-gray-400'
                  }`} style={{
                    background: t.status === 'registering' ? 'rgba(0, 200, 0, 0.1)' :
                    t.status === 'running' ? 'rgba(255, 150, 0, 0.1)' : 'rgba(150, 150, 150, 0.1)',
                    border: `1px solid ${t.status === 'registering' ? 'rgba(0, 200, 0, 0.2)' :
                    t.status === 'running' ? 'rgba(255, 150, 0, 0.2)' : 'rgba(150, 150, 150, 0.15)'}`,
                  }}>
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {t.players}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {t.starts}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500">Prize</div>
                    <div className="text-sm font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {t.prize}
                    </div>
                  </div>
                </div>
                {t.status === 'registering' && (
                  <motion.button
                    onClick={() => toast.success(`Registered for ${t.name}!`)}
                    className="w-full mt-3 py-2 rounded-lg btn-action-poker text-xs font-bold"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.buyIn === 0 ? 'JOIN FREE' : `REGISTER — ${t.buyIn.toLocaleString()}`}
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
