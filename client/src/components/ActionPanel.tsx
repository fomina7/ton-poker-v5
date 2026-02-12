/*
 * ActionPanel — HOUSE POKER
 * Premium action buttons with AI-generated icons + pre-action checkboxes
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '@/lib/assets';
import { GameState, getCallAmount, PlayerAction } from '@/lib/pokerEngine';

interface ActionPanelProps {
  gameState: GameState;
  onAction: (action: PlayerAction, amount?: number) => void;
  isPlayerTurn: boolean;
  preAction: 'checkFold' | 'callAny' | 'foldToBet' | null;
  onPreAction: (action: 'checkFold' | 'callAny' | 'foldToBet' | null) => void;
}

export default function ActionPanel({ gameState, onAction, isPlayerTurn, preAction, onPreAction }: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const humanPlayer = gameState.players.find(p => p.id === 'human');
  const callAmount = humanPlayer ? getCallAmount(humanPlayer, gameState) : 0;
  const canCheck = callAmount === 0;
  const minRaise = Math.max(gameState.minRaise, gameState.bigBlind);
  const maxRaise = humanPlayer?.chips || 0;

  const presets = useMemo(() => {
    const p = gameState.pot || 1;
    return [
      { label: '1/3', amount: Math.max(minRaise, Math.floor(p / 3)) },
      { label: '1/2', amount: Math.max(minRaise, Math.floor(p / 2)) },
      { label: '3/4', amount: Math.max(minRaise, Math.floor(p * 0.75)) },
      { label: 'Pot', amount: Math.max(minRaise, p) },
    ].filter(r => r.amount <= maxRaise);
  }, [gameState.pot, minRaise, maxRaise]);

  if (!humanPlayer || humanPlayer.folded || humanPlayer.isAllIn) return null;

  // Pre-action checkboxes when NOT our turn
  if (!isPlayerTurn) {
    return (
      <div className="px-4 py-3" style={{
        background: 'rgba(10, 10, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="flex gap-2 justify-center">
          {[
            { key: 'checkFold' as const, label: 'Check / Fold' },
            { key: 'callAny' as const, label: 'Call Any' },
            { key: 'foldToBet' as const, label: 'Fold to Bet' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPreAction(preAction === key ? null : key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: preAction === key ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255,255,255,0.04)',
                border: preAction === key ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                color: preAction === key ? '#00F0FF' : 'rgba(255,255,255,0.45)',
              }}
            >
              <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center"
                style={{
                  border: preAction === key ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.2)',
                  background: preAction === key ? 'rgba(0,240,255,0.15)' : 'transparent',
                }}>
                {preAction === key && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Raise slider panel
  if (showRaiseSlider) {
    return (
      <div className="px-3 py-3" style={{
        background: 'rgba(10, 10, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Presets */}
        <div className="flex gap-1.5 justify-center mb-2">
          {presets.map(({ label, amount }) => (
            <button
              key={label}
              onClick={() => setRaiseAmount(Math.min(amount, maxRaise))}
              className="px-3 py-1 rounded-md text-[10px] font-bold transition-all"
              style={{
                background: 'rgba(76, 175, 80, 0.12)',
                border: '1px solid rgba(76, 175, 80, 0.25)',
                color: '#4CAF50',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="flex items-center gap-2 px-1 mb-2">
          <span className="text-[10px] text-gray-500 font-mono w-8">{minRaise}</span>
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            value={raiseAmount || minRaise}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #4CAF50 ${(((raiseAmount || minRaise) - minRaise) / Math.max(1, maxRaise - minRaise)) * 100}%, rgba(255,255,255,0.08) ${(((raiseAmount || minRaise) - minRaise) / Math.max(1, maxRaise - minRaise)) * 100}%)`,
            }}
          />
          <span className="text-[10px] text-green-400 font-bold font-mono w-10 text-right">{raiseAmount || minRaise}</span>
        </div>

        {/* Confirm / Cancel */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowRaiseSlider(false)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onAction('raise', raiseAmount || minRaise);
              setShowRaiseSlider(false);
              setRaiseAmount(0);
            }}
            className="flex-[2] py-2.5 rounded-xl text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(76,175,80,0.25)',
            }}
          >
            Raise to {raiseAmount || minRaise}
          </button>
        </div>
      </div>
    );
  }

  // Main action buttons
  return (
    <div className="px-3 py-2 pb-4" style={{
      background: 'rgba(10, 10, 20, 0.9)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="flex gap-2">
        {/* FOLD */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { onAction('fold'); setShowRaiseSlider(false); }}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl font-bold text-xs"
          style={{
            background: 'linear-gradient(135deg, #C62828 0%, #8B0000 100%)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(198,40,40,0.25)',
            border: '1px solid rgba(255,100,100,0.15)',
          }}
        >
          <img src={ASSETS.actions.fold} alt="" className="w-5 h-5 object-contain" />
          <span>Fold</span>
        </motion.button>

        {/* CHECK / CALL */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { onAction(canCheck ? 'check' : 'call', callAmount); setShowRaiseSlider(false); }}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl font-bold text-xs"
          style={{
            background: canCheck
              ? 'linear-gradient(135deg, #00838F 0%, #006064 100%)'
              : 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
            color: '#fff',
            boxShadow: canCheck
              ? '0 4px 12px rgba(0,131,143,0.25)'
              : '0 4px 12px rgba(46,125,50,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <img src={canCheck ? ASSETS.actions.check : ASSETS.actions.call} alt="" className="w-5 h-5 object-contain" />
          <span>{canCheck ? 'Check' : `Call ${callAmount}`}</span>
        </motion.button>

        {/* RAISE */}
        {humanPlayer.chips > callAmount && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowRaiseSlider(true);
              if (!raiseAmount) setRaiseAmount(minRaise);
            }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl font-bold text-xs"
            style={{
              background: 'linear-gradient(135deg, #E65100 0%, #BF360C 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(230,81,0,0.25)',
              border: '1px solid rgba(255,150,50,0.15)',
            }}
          >
            <img src={ASSETS.actions.raise} alt="" className="w-5 h-5 object-contain" />
            <span>Raise</span>
          </motion.button>
        )}

        {/* ALL IN */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { onAction('allin'); setShowRaiseSlider(false); }}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl font-bold text-xs"
          style={{
            background: 'linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(106,27,154,0.25)',
            border: '1px solid rgba(180,100,255,0.15)',
          }}
        >
          <img src={ASSETS.actions.allin} alt="" className="w-5 h-5 object-contain" />
          <span>All In</span>
        </motion.button>
      </div>
    </div>
  );
}
