/*
 * GameTable — HOUSE POKER
 * Premium poker table with auto-dealing, pre-action buttons, epic visibility
 * Design: Cyber Noir Casino — dark bg, green felt, gold/cyan accents
 */
import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Clock, BarChart3, MessageCircle, History } from 'lucide-react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { ASSETS } from '@/lib/assets';
import PlayingCard from '@/components/PlayingCard';
import PlayerSeat from '@/components/PlayerSeat';
import ActionPanel from '@/components/ActionPanel';
import GameHUD from '@/components/GameHUD';
import ChatPanel from '@/components/ChatPanel';
import HandHistory from '@/components/HandHistory';
import WinEffects from '@/components/WinEffects';

// Seat positions — improved for better visibility on all sides
const SEAT_POSITIONS_6 = [
  { x: '50%', y: '88%' },   // 0: bottom center (human)
  { x: '8%',  y: '62%' },   // 1: left-bottom
  { x: '8%',  y: '22%' },   // 2: left-top
  { x: '50%', y: '2%' },    // 3: top center
  { x: '92%', y: '22%' },   // 4: right-top
  { x: '92%', y: '62%' },   // 5: right-bottom
];

const PHASE_LABELS: Record<string, string> = {
  waiting: 'Waiting...',
  preflop: 'Pre-Flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
};

export default function GameTable() {
  const [, navigate] = useLocation();
  const { gameState, showdown, initGame, startNewHand, playerAction, preAction, setPreAction } = usePokerGame(6, [10, 20]);
  const [turnTimer, setTurnTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hudOpen, setHudOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showWinEffects, setShowWinEffects] = useState(false);
  const [autoDealCountdown, setAutoDealCountdown] = useState<number | null>(null);

  // Memoize particles
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    w: 1 + Math.random() * 1.5,
    left: Math.random() * 100,
    top: Math.random() * 100,
    color: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#00F0FF' : '#ffffff',
    yMove: -15 - Math.random() * 25,
    dur: 6 + Math.random() * 6,
    delay: Math.random() * 5,
  })), []);

  // Init game on mount
  useEffect(() => {
    const state = initGame();
    if (state) {
      setTimeout(() => startNewHand(state), 500);
    }
  }, []);

  // Turn timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!gameState || gameState.phase === 'showdown' || gameState.phase === 'waiting') return;

    setTurnTimer(30);
    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          if (gameState.players[gameState.currentPlayerIndex]?.id === 'human') {
            playerAction('fold');
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState?.currentPlayerIndex, gameState?.phase]);

  // Auto-deal countdown on showdown
  useEffect(() => {
    if (showdown && gameState?.winners.length) {
      setShowWinEffects(true);
      setAutoDealCountdown(3);

      const countdownTimer = setInterval(() => {
        setAutoDealCountdown(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(countdownTimer);
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);

      const winTimer = setTimeout(() => setShowWinEffects(false), 4000);
      return () => {
        clearInterval(countdownTimer);
        clearTimeout(winTimer);
      };
    }
  }, [showdown, gameState?.winners]);

  const humanPlayer = gameState?.players.find(p => p.id === 'human');
  const isPlayerTurn = gameState
    ? gameState.players[gameState.currentPlayerIndex]?.id === 'human'
      && gameState.phase !== 'showdown'
      && gameState.phase !== 'waiting'
    : false;

  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(ellipse at center, #0d1117 0%, #080a0f 50%, #050507 100%)',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-t-transparent rounded-full"
          style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden select-none" style={{
      background: 'radial-gradient(ellipse at center, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`, height: `${p.w}px`,
              left: `${p.left}%`, top: `${p.top}%`,
              background: p.color,
            }}
            animate={{ y: [0, p.yMove, 0], opacity: [0.02, 0.15, 0.02] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={() => navigate('/lobby')} className="p-2 rounded-xl transition-colors"
          style={{
            background: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
          <ArrowLeft size={16} className="text-gray-300" />
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl" style={{
            background: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(212, 175, 55, 0.15)',
          }}>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 block text-center">
              {PHASE_LABELS[gameState.phase] || ''}
            </span>
            <span className="text-xs font-bold text-gold block text-center font-mono-poker">
              {gameState.smallBlind}/{gameState.bigBlind}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {gameState.phase !== 'showdown' && gameState.phase !== 'waiting' && (
            <div className="flex items-center gap-1 rounded-xl px-2 py-1.5" style={{
              background: 'rgba(10, 10, 20, 0.7)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${turnTimer <= 10 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <Clock size={11} className={turnTimer <= 10 ? 'text-red-400' : 'text-gray-500'} />
              <span className={`text-[10px] font-bold font-mono-poker ${turnTimer <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
                {turnTimer}s
              </span>
            </div>
          )}
          <button onClick={() => setHudOpen(!hudOpen)}
            className="p-1.5 rounded-xl transition-all"
            style={{
              background: hudOpen ? 'rgba(212, 175, 55, 0.15)' : 'rgba(10, 10, 20, 0.7)',
              border: `1px solid ${hudOpen ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            <BarChart3 size={13} className={hudOpen ? 'text-gold' : 'text-gray-500'} />
          </button>
          <button onClick={() => setChatOpen(!chatOpen)}
            className="p-1.5 rounded-xl transition-all"
            style={{
              background: chatOpen ? 'rgba(0, 240, 255, 0.1)' : 'rgba(10, 10, 20, 0.7)',
              border: `1px solid ${chatOpen ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            <MessageCircle size={13} className={chatOpen ? 'text-cyan-neon' : 'text-gray-500'} />
          </button>
          <button onClick={() => setHistoryOpen(true)}
            className="p-1.5 rounded-xl transition-all"
            style={{
              background: 'rgba(10, 10, 20, 0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
            <History size={13} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Main table area */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: '94%', maxWidth: '600px', aspectRatio: '1.55 / 1' }}>
            {/* Outer glow */}
            <div className="absolute" style={{
              left: '-3%', right: '-3%', top: '-5%', bottom: '-5%',
              borderRadius: '50%',
              boxShadow: '0 0 80px rgba(26, 92, 42, 0.1), 0 0 40px rgba(212, 175, 55, 0.03)',
            }} />

            {/* Table frame */}
            <div className="absolute inset-0" style={{
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(15, 15, 25, 0.95))',
              boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.08), 0 0 0 6px rgba(15, 15, 25, 0.9), 0 8px 32px rgba(0,0,0,0.5)',
              border: '2px solid rgba(212, 175, 55, 0.06)',
            }}>
              {/* Felt surface */}
              <div className="absolute" style={{
                left: '3%', right: '3%', top: '5%', bottom: '5%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, #1a5c2a 0%, #145222 25%, #0d3518 55%, #081f0e 100%)',
                boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(212, 175, 55, 0.04)',
              }}>
                {/* Inner decorative line */}
                <div className="absolute" style={{
                  left: '8%', right: '8%', top: '10%', bottom: '10%',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.02)',
                }} />
                {/* Felt texture overlay */}
                <div className="absolute inset-0 rounded-[50%] opacity-5" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/svg%3E")`,
                }} />
              </div>
            </div>

            {/* HOUSE POKER logo watermark in center */}
            <div className="absolute left-1/2 -translate-x-1/2 z-[5] pointer-events-none" style={{ top: '12%' }}>
              <div className="text-[8px] uppercase tracking-[0.3em] font-bold opacity-15 text-gold font-display">
                HOUSE POKER
              </div>
            </div>

            {/* Pot display */}
            {gameState.pot > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10"
                style={{
                  top: '22%',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
                }}
              >
                <img src={ASSETS.chips.gold} alt="" className="w-4 h-4" />
                <span className="text-xs font-bold text-gold font-mono-poker">
                  POT {gameState.pot.toLocaleString()}
                </span>
              </motion.div>
            )}

            {/* Community cards */}
            <div className="absolute left-1/2 flex gap-1.5 z-10" style={{ top: '42%', transform: 'translate(-50%, -50%)' }}>
              <AnimatePresence>
                {gameState.communityCards.map((card, i) => (
                  <PlayingCard key={`${card.suit}-${card.rank}`} card={card} delay={i * 0.15} />
                ))}
              </AnimatePresence>
              {gameState.communityCards.length < 5 && gameState.phase !== 'waiting' && (
                <>
                  {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-[48px] h-[68px] rounded-lg" style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px dashed rgba(255, 255, 255, 0.03)',
                    }} />
                  ))}
                </>
              )}
            </div>

            {/* Player seats */}
            {gameState.players.map((player, i) => (
              <PlayerSeat
                key={player.id}
                player={player}
                isCurrentTurn={gameState.currentPlayerIndex === i && gameState.phase !== 'showdown'}
                showCards={showdown || player.id === 'human'}
                isHuman={player.id === 'human'}
                position={SEAT_POSITIONS_6[i] || SEAT_POSITIONS_6[0]}
                isWinner={gameState.winners.some(w => w.playerId === player.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Human player cards — large, at bottom above action panel */}
      {humanPlayer && !humanPlayer.folded && humanPlayer.holeCards.length > 0 && (
        <div className="flex justify-center gap-2 py-1.5 relative z-10 shrink-0">
          {humanPlayer.holeCards.map((card, i) => (
            <motion.div
              key={`hole-${i}`}
              whileHover={{ y: -6, scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <PlayingCard card={card} delay={i * 0.15} />
            </motion.div>
          ))}
          {showdown && humanPlayer.handResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00F0FF',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)',
              }}
            >
              {humanPlayer.handResult.name}
            </motion.div>
          )}
        </div>
      )}

      {/* Win Effects */}
      <WinEffects
        show={showWinEffects}
        isHumanWin={gameState.winners[0]?.playerId === 'human'}
        amount={gameState.winners[0]?.amount || 0}
      />

      {/* Showdown overlay — auto-deal countdown, no NEXT HAND button */}
      <AnimatePresence>
        {showdown && gameState.winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="rounded-2xl p-5 mx-4 text-center max-w-xs relative overflow-hidden"
              style={{
                background: 'rgba(10, 10, 20, 0.95)',
                backdropFilter: 'blur(24px)',
                border: '2px solid rgba(212, 175, 55, 0.35)',
                boxShadow: '0 0 50px rgba(212, 175, 55, 0.12)',
              }}
            >
              {/* Pulsing inner glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    'inset 0 0 15px rgba(212, 175, 55, 0.03)',
                    'inset 0 0 30px rgba(212, 175, 55, 0.1)',
                    'inset 0 0 15px rgba(212, 175, 55, 0.03)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <img src={ASSETS.ui.trophy} alt="" className="w-14 h-14 mx-auto mb-2 relative z-10" />

              <h2 className="text-lg font-bold gold-text mb-1 relative z-10 font-display">
                {gameState.winners[0].playerId === 'human'
                  ? 'YOU WIN!'
                  : `${gameState.players.find(p => p.id === gameState.winners[0].playerId)?.name || 'Winner'} WINS!`}
              </h2>

              {gameState.winners[0].hand && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-medium mb-2 relative z-10"
                  style={{ color: '#00F0FF' }}
                >
                  {gameState.winners[0].hand}
                </motion.div>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex items-center justify-center gap-2 mb-3 relative z-10"
              >
                <img src={ASSETS.chips.gold} alt="" className="w-6 h-6" />
                <span className="text-2xl font-bold text-gold font-mono-poker">
                  +{gameState.winners[0].amount.toLocaleString()}
                </span>
              </motion.div>

              {/* Auto-deal countdown */}
              <div className="text-[10px] text-gray-500 relative z-10">
                {autoDealCountdown !== null
                  ? `Next hand in ${autoDealCountdown}...`
                  : 'Dealing...'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Panel */}
      <GameHUD isOpen={hudOpen} onClose={() => setHudOpen(false)} />

      {/* Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Hand History */}
      <HandHistory isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Action panel — at the very bottom */}
      <div className="shrink-0">
        <ActionPanel
          gameState={gameState}
          onAction={playerAction}
          isPlayerTurn={isPlayerTurn}
          preAction={preAction}
          onPreAction={setPreAction}
        />
      </div>
    </div>
  );
}
