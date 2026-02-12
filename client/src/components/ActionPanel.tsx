/*
 * ActionPanel — Cyber Noir Casino theme
 * Bottom panel with fold/check/call/raise/all-in buttons and bet slider
 * All hooks MUST be called before any conditional return.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, getCallAmount, PlayerAction } from '@/lib/pokerEngine';

interface ActionPanelProps {
  gameState: GameState;
  onAction: (action: PlayerAction, amount?: number) => void;
  isPlayerTurn: boolean;
}

export default function ActionPanel({ gameState, onAction, isPlayerTurn }: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const humanPlayer = gameState.players.find(p => p.id === 'human');

  const callAmount = humanPlayer ? getCallAmount(humanPlayer, gameState) : 0;
  const canCheck = callAmount === 0;
  const minRaise = Math.max(gameState.minRaise, gameState.bigBlind);
  const maxRaise = humanPlayer?.chips || 0;

  const presetRaises = useMemo(() => {
    const pot = gameState.pot;
    return [
      { label: '1/2 Pot', amount: Math.max(minRaise, Math.floor(pot * 0.5)) },
      { label: 'Pot', amount: Math.max(minRaise, pot) },
      { label: '2x Pot', amount: Math.max(minRaise, pot * 2) },
    ].filter(r => r.amount <= maxRaise);
  }, [gameState.pot, minRaise, maxRaise]);

  // Now safe to return null after all hooks
  if (!humanPlayer || humanPlayer.folded || humanPlayer.isAllIn) return null;
  if (!isPlayerTurn) return null;

  return (
    <div className="relative z-50">
      {/* Raise slider panel */}
      <AnimatePresence>
        {showRaiseSlider && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{
              background: 'rgba(10, 10, 20, 0.9)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            }}
          >
            <div className="px-4 py-3">
              {/* Preset buttons */}
              <div className="flex gap-2 mb-3">
                {presetRaises.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setRaiseAmount(Math.min(preset.amount, maxRaise))}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors text-gold"
                    style={{
                      background: 'rgba(20, 20, 35, 0.5)',
                      border: '1px solid rgba(212, 175, 55, 0.15)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {minRaise}
                </span>
                <input
                  type="range"
                  min={minRaise}
                  max={maxRaise}
                  value={raiseAmount || minRaise}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((raiseAmount - minRaise) / (maxRaise - minRaise)) * 100}%, #1a1a2e ${((raiseAmount - minRaise) / (maxRaise - minRaise)) * 100}%, #1a1a2e 100%)`,
                  }}
                />
                <span className="text-xs text-gold font-bold w-16 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {(raiseAmount || minRaise).toLocaleString()}
                </span>
              </div>

              {/* Confirm raise */}
              <button
                onClick={() => {
                  onAction('raise', raiseAmount || minRaise);
                  setShowRaiseSlider(false);
                  setRaiseAmount(0);
                }}
                className="w-full mt-3 py-2.5 rounded-xl btn-primary-poker text-sm font-bold"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                RAISE TO {(raiseAmount || minRaise).toLocaleString()}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main action buttons */}
      <div className="px-3 py-3 pb-6" style={{
        background: 'rgba(10, 10, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      }}>
        <div className="flex gap-2">
          {/* Fold */}
          <button
            onClick={() => {
              onAction('fold');
              setShowRaiseSlider(false);
            }}
            className="flex-1 py-3 rounded-xl btn-danger-poker text-sm"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            FOLD
          </button>

          {/* Check / Call */}
          <button
            onClick={() => {
              onAction(canCheck ? 'check' : 'call', callAmount);
              setShowRaiseSlider(false);
            }}
            className="flex-1 py-3 rounded-xl btn-action-poker text-sm"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {canCheck ? 'CHECK' : `CALL ${callAmount.toLocaleString()}`}
          </button>

          {/* Raise */}
          {humanPlayer.chips > callAmount && (
            <button
              onClick={() => {
                setShowRaiseSlider(!showRaiseSlider);
                if (!raiseAmount) setRaiseAmount(minRaise);
              }}
              className="flex-1 py-3 rounded-xl btn-primary-poker text-sm"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              RAISE
            </button>
          )}

          {/* All-in */}
          <button
            onClick={() => {
              onAction('allin');
              setShowRaiseSlider(false);
            }}
            className="py-3 px-4 rounded-xl text-sm font-bold"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #8B0000, #D4AF37)',
              color: '#fff',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
            }}
          >
            ALL IN
          </button>
        </div>
      </div>
    </div>
  );
}
