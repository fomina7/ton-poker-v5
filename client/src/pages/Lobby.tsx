/**
 * Lobby — HOUSE POKER
 * Premium table selection with real data from DB
 */
import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Users, Zap, Crown, Star, Flame, ChevronRight, Wifi } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ASSETS } from '@/lib/assets';
import { getLoginUrl } from '@/const';
import BottomNav from '@/components/BottomNav';

type GameMode = 'holdem' | 'omaha';

const TIER_STYLES: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
  micro: { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', iconBg: 'bg-green-900/40', text: '#22c55e' },
  low: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', iconBg: 'bg-blue-900/40', text: '#3b82f6' },
  medium: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.15)', iconBg: 'bg-purple-900/40', text: '#a855f7' },
  high: { bg: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.15)', iconBg: 'bg-amber-900/40', text: '#D4AF37' },
  vip: { bg: 'rgba(236,72,153,0.06)', border: 'rgba(236,72,153,0.15)', iconBg: 'bg-pink-900/40', text: '#ec4899' },
};

function getTier(bb: number): string {
  if (bb <= 2) return 'micro';
  if (bb <= 10) return 'low';
  if (bb <= 50) return 'medium';
  if (bb <= 200) return 'high';
  return 'vip';
}

function getTierIcon(bb: number) {
  if (bb <= 2) return Star;
  if (bb <= 10) return Zap;
  if (bb <= 50) return Crown;
  if (bb <= 200) return Flame;
  return Crown;
}

export default function Lobby() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<GameMode>('holdem');

  const { data: tables, isLoading } = trpc.tables.list.useQuery();
  const { data: stats } = trpc.tables.onlineStats.useQuery();
  const { data: balance } = trpc.balance.get.useQuery(undefined, { retry: false, enabled: isAuthenticated });

  const filteredTables = tables?.filter(t => t.gameType === mode) || [];

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'radial-gradient(ellipse at top, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={ASSETS.logo} alt="" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-black gold-text font-display">HOUSE POKER</h1>
              <div className="flex items-center gap-1.5">
                <Wifi size={8} className="text-green-400" />
                <span className="text-[9px] text-green-400">{stats?.onlinePlayers ?? 0} online</span>
              </div>
            </div>
          </div>
          {isAuthenticated && balance ? (
            <button onClick={() => navigate('/cashier')} className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform">
              <img src={ASSETS.chips.gold} alt="" className="w-4 h-4" />
              <span className="text-sm font-bold text-gold font-mono-poker">{balance.balanceReal.toLocaleString()}</span>
            </button>
          ) : (
            <button onClick={() => window.location.href = getLoginUrl()} className="btn-primary-poker px-4 py-2 rounded-xl text-xs font-bold">
              Sign In
            </button>
          )}
        </div>

        {/* Quick play banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(0,240,255,0.04) 100%)',
            border: '1px solid rgba(212,175,55,0.15)',
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
              onClick={() => {
                if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                const first = filteredTables[0];
                if (first) navigate(`/game/${first.id}`);
              }}
              className="btn-primary-poker px-5 py-2.5 rounded-xl text-sm font-bold tracking-wider font-display"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PLAY
            </motion.button>
          </div>
        </motion.div>

        {/* Game mode tabs */}
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{
          background: 'rgba(10,10,20,0.5)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {(['holdem', 'omaha'] as GameMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === m ? 'btn-primary-poker' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {m === 'holdem' ? "Hold'em" : 'Omaha'}
            </button>
          ))}
        </div>
      </div>

      {/* Tables */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {mode === 'holdem' ? "Texas Hold'em NL" : 'Pot Limit Omaha'}
          </h2>
          <span className="text-[10px] text-gray-600">{filteredTables.length} tables</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              {filteredTables.map((table, i) => {
                const tier = getTier(table.bigBlind);
                const style = TIER_STYLES[tier] || TIER_STYLES.micro;
                const Icon = getTierIcon(table.bigBlind);
                return (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => {
                      if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                      navigate(`/game/${table.id}`);
                    }}
                    className="rounded-xl p-3.5 cursor-pointer transition-all active:scale-[0.98]"
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.iconBg}`}>
                          <Icon size={18} style={{ color: style.text }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{table.name}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-gray-400">
                              Blinds: <span className="text-gold font-mono-poker">{table.smallBlind}/{table.bigBlind}</span>
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Users size={11} /> {table.playerCount ?? 0}/{table.tableSize}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[9px] text-gray-500 uppercase">Buy-in</div>
                          <div className="text-sm font-bold text-gold font-mono-poker">
                            {table.minBuyIn.toLocaleString()}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-600" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredTables.length === 0 && (
                <div className="text-center py-12">
                  <img src={ASSETS.ui.crown} alt="" className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 text-sm">No tables available</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
