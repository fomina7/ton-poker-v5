/*
 * GameHUD — Cyber Noir Casino theme
 * In-game HUD showing player statistics (VPIP, PFR, AF)
 */
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface HUDStats {
  vpip: number;  // Voluntarily Put $ In Pot %
  pfr: number;   // Pre-Flop Raise %
  af: number;    // Aggression Factor
  hands: number; // Total hands tracked
}

// Simulated stats for each bot
const BOT_STATS: Record<string, HUDStats> = {
  'SharkBite': { vpip: 22, pfr: 18, af: 3.2, hands: 847 },
  'OwlEye': { vpip: 35, pfr: 12, af: 1.8, hands: 623 },
  'FoxTrick': { vpip: 28, pfr: 22, af: 2.5, hands: 1204 },
  'BearClaw': { vpip: 42, pfr: 8, af: 0.9, hands: 456 },
  'WolfFang': { vpip: 18, pfr: 15, af: 4.1, hands: 982 },
  'MonkeyKing': { vpip: 55, pfr: 5, af: 0.5, hands: 321 },
};

function getPlayerType(vpip: number, pfr: number): { label: string; color: string } {
  if (vpip < 20 && pfr > 15) return { label: 'TAG', color: 'text-blue-400' };
  if (vpip < 25 && pfr < 10) return { label: 'Nit', color: 'text-gray-400' };
  if (vpip > 35 && pfr > 20) return { label: 'LAG', color: 'text-red-400' };
  if (vpip > 40 && pfr < 10) return { label: 'Fish', color: 'text-green-400' };
  return { label: 'REG', color: 'text-yellow-400' };
}

interface GameHUDProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameHUD({ isOpen, onClose }: GameHUDProps) {
  const [showHUD, setShowHUD] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 200 }}
          className="fixed right-2 top-14 z-30 w-56 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(10, 10, 20, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <BarChart3 size={14} className="text-gold" />
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider">HUD</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowHUD(!showHUD)} className="p-1 rounded hover:bg-white/10">
                {showHUD ? <Eye size={12} className="text-gray-400" /> : <EyeOff size={12} className="text-gray-400" />}
              </button>
              <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
                <X size={12} className="text-gray-400" />
              </button>
            </div>
          </div>

          {showHUD && (
            <div className="p-2 space-y-1">
              {/* Column headers */}
              <div className="flex items-center text-[8px] text-gray-600 uppercase tracking-wider px-1 mb-1">
                <span className="flex-1">Player</span>
                <span className="w-8 text-center">VPIP</span>
                <span className="w-8 text-center">PFR</span>
                <span className="w-7 text-center">AF</span>
                <span className="w-8 text-center">Type</span>
              </div>

              {Object.entries(BOT_STATS).map(([name, stats]) => {
                const type = getPlayerType(stats.vpip, stats.pfr);
                return (
                  <div key={name} className="flex items-center text-[10px] px-1 py-1 rounded hover:bg-white/5">
                    <span className="flex-1 text-gray-300 truncate">{name}</span>
                    <span className="w-8 text-center text-white font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stats.vpip}
                    </span>
                    <span className="w-8 text-center text-white font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stats.pfr}
                    </span>
                    <span className="w-7 text-center text-white font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stats.af.toFixed(1)}
                    </span>
                    <span className={`w-8 text-center font-bold ${type.color}`}>
                      {type.label}
                    </span>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="pt-1 mt-1 border-t border-white/5 text-[8px] text-gray-600 px-1">
                VPIP = Voluntarily Put $ In Pot · PFR = Pre-Flop Raise · AF = Aggression Factor
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
