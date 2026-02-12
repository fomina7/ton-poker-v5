/**
 * GameTable — MEGA Premium Poker Table (TON Poker style)
 * AI-generated background + logo, programmatic cards/chips
 * Fixed: positions, buttons visible, white glowing table border
 */
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Clock, Users, Wifi, WifiOff, MessageCircle, Smile } from 'lucide-react';
import { useSocket, ServerPlayer } from '@/hooks/useSocket';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { ASSETS } from '@/lib/assets';
import type { Card } from '@/lib/assets';
import { toast } from 'sonner';
import PokerCard from '@/components/PokerCard';
import { formatChipAmount } from '@/components/PokerChip';
import TableBackground from '@/components/TableBackground';
import { HousePokerLogoCompact } from '@/components/HousePokerLogo';

/* ─── Seat positions — pulled inward, nothing cut off ─── */
const SEATS_6 = [
  { x: 50, y: 84 },   // 0: hero (bottom center)
  { x: 12, y: 64 },   // 1: left-bottom
  { x: 12, y: 26 },   // 2: left-top
  { x: 50, y: 6 },    // 3: top center
  { x: 88, y: 26 },   // 4: right-top
  { x: 88, y: 64 },   // 5: right-bottom
];
const SEATS_9 = [
  { x: 50, y: 88 }, { x: 10, y: 70 }, { x: 8, y: 46 },
  { x: 10, y: 22 }, { x: 34, y: 6 },  { x: 66, y: 6 },
  { x: 90, y: 22 }, { x: 92, y: 46 }, { x: 90, y: 70 },
];
const SEATS_2 = [{ x: 50, y: 88 }, { x: 50, y: 6 }];

function getSeats(n: number) {
  return n <= 2 ? SEATS_2 : n <= 6 ? SEATS_6 : SEATS_9;
}

/* ─── Bet pill positions — closer to center ─── */
function getBetPos(playerPos: { x: number; y: number }) {
  const cx = 50, cy = 44;
  const dx = cx - playerPos.x;
  const dy = cy - playerPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const factor = Math.min(0.45, 18 / dist);
  return { x: playerPos.x + dx * factor, y: playerPos.y + dy * factor };
}

const PHASE_LABELS: Record<string, string> = {
  waiting: 'WAITING', preflop: 'PRE-FLOP', flop: 'FLOP',
  turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN',
};

/* ─── Position Badge (D/SB/BB) ─── */
function PosBadge({ label, bg }: { label: string; bg: string }) {
  return (
    <div className="absolute -top-0.5 -right-0.5 z-10 w-[14px] h-[14px] rounded-full flex items-center justify-center text-[6px] font-black text-white"
      style={{ background: bg, boxShadow: `0 1px 4px rgba(0,0,0,0.5)`, border: '1px solid rgba(255,255,255,0.2)' }}>
      {label}
    </div>
  );
}

/* ─── Player Seat ─── */
function SeatView({
  player, pos, isAction, isDealer, isSB, isBB, isHero, isShowdown, isWinner, timerPct,
}: {
  player: ServerPlayer; pos: { x: number; y: number };
  isAction: boolean; isDealer: boolean; isSB: boolean; isBB: boolean;
  isHero: boolean; isShowdown: boolean; isWinner: boolean; timerPct: number;
}) {
  const avatarUrl = ASSETS.avatars[player.avatar as keyof typeof ASSETS.avatars] || ASSETS.avatars.fox;
  const isTop = pos.y < 20;
  const isBottom = pos.y > 75;
  const isLeft = pos.x < 25;
  const isRight = pos.x > 75;

  // Card placement: cards go ABOVE for top/left/right players, BELOW for bottom (non-hero)
  const showCards = !isHero && player.holeCards.length > 0 && !player.folded;
  const cardsAbove = showCards && (isTop || isLeft || isRight);
  const cardsBelow = showCards && isBottom;

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isAction ? 20 : isHero ? 15 : 10,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      {/* Cards above player */}
      {cardsAbove && (
        <div className="flex gap-0.5 mb-0.5">
          {player.holeCards.map((c, i) => (
            <PokerCard key={i} card={c as Card} faceDown={!isShowdown} size="xs" delay={i * 0.05} />
          ))}
        </div>
      )}

      {/* Player container */}
      <div className={`relative ${player.folded ? 'opacity-30 grayscale' : ''} transition-all duration-300`}>
        {/* Timer ring */}
        {isAction && !player.folded && (
          <svg className="absolute" viewBox="0 0 52 52" style={{ width: '140%', height: '140%', left: '-20%', top: '-20%' }}>
            <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
            <circle cx="26" cy="26" r="23" fill="none"
              stroke={timerPct > 0.5 ? '#D4AF37' : timerPct > 0.25 ? '#f59e0b' : '#ef4444'}
              strokeWidth="2.5"
              strokeDasharray={`${timerPct * 144.5} 144.5`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dasharray 0.5s linear, stroke 0.5s' }}
            />
          </svg>
        )}

        {/* Winner glow */}
        {isWinner && (
          <motion.div
            className="absolute -inset-3 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Avatar */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden" style={{
          border: `2px solid ${
            isWinner ? '#D4AF37'
            : isAction ? 'rgba(212,175,55,0.8)'
            : isHero ? 'rgba(212,175,55,0.4)'
            : 'rgba(255,255,255,0.15)'
          }`,
          boxShadow: isWinner
            ? '0 0 20px rgba(212,175,55,0.6)'
            : isAction
            ? '0 0 12px rgba(212,175,55,0.3)'
            : '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        </div>

        {/* Dealer button */}
        {isDealer && <PosBadge label="D" bg="linear-gradient(135deg, #F5E6A3, #B8941F)" />}
        {isSB && !isDealer && <PosBadge label="S" bg="#3b82f6" />}
        {isBB && !isDealer && !isSB && <PosBadge label="B" bg="#ef4444" />}
      </div>

      {/* Name + stack plate */}
      <div className="mt-0.5 text-center px-2 py-0.5 rounded-md" style={{
        background: isHero
          ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))'
          : 'rgba(0,0,0,0.85)',
        border: isHero ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.06)',
        minWidth: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div className={`text-[8px] font-semibold truncate max-w-[60px] ${isHero ? 'text-gold-light' : 'text-gray-300'}`}>
          {isHero ? '★ YOU' : player.name}
        </div>
        <div className="text-[9px] font-bold text-gold font-mono-poker">
          {formatChipAmount(player.chipStack)}
        </div>
      </div>

      {/* Last action badge */}
      {player.lastAction && (
        <motion.div
          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
          className="mt-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider"
          style={{
            background: player.lastAction.startsWith('WIN')
              ? 'rgba(212,175,55,0.2)' : player.lastAction === 'FOLD'
              ? 'rgba(239,68,68,0.2)' : player.lastAction === 'ALL IN'
              ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.06)',
            color: player.lastAction.startsWith('WIN')
              ? '#D4AF37' : player.lastAction === 'FOLD'
              ? '#f87171' : player.lastAction === 'ALL IN'
              ? '#fb923c' : '#94a3b8',
            border: `1px solid ${player.lastAction.startsWith('WIN') ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {player.lastAction}
        </motion.div>
      )}

      {/* Cards below player */}
      {cardsBelow && (
        <div className="flex gap-0.5 mt-0.5">
          {player.holeCards.map((c, i) => (
            <PokerCard key={i} card={c as Card} faceDown={!isShowdown} size="xs" delay={i * 0.05} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Bet Pill ─── */
function BetPill({ amount, pos }: { amount: number; pos: { x: number; y: number } }) {
  if (amount <= 0) return null;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute z-10 flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))',
        border: '1px solid rgba(212,175,55,0.35)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="4.5" fill="#D4AF37" stroke="#B8941F" strokeWidth="0.5" />
        <circle cx="5" cy="5" r="2.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      </svg>
      <span className="text-[9px] font-bold text-gold font-mono-poker">{formatChipAmount(amount)}</span>
    </motion.div>
  );
}

/* ─── Empty Seat ─── */
function EmptySeat({ pos, seatIndex, onSit }: { pos: { x: number; y: number }; seatIndex: number; onSit: () => void }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 5 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <button onClick={onSit}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1.5px dashed rgba(255,255,255,0.12)',
        }}>
        <span className="text-[8px] font-bold text-gray-500">SIT</span>
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN GAME TABLE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function GameTable() {
  const params = useParams<{ tableId: string }>();
  const tableId = parseInt(params.tableId || '1');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { connected, gameState, mySeatIndex, error, joinTable, leaveTable, sendAction } = useSocket();

  const [turnTimer, setTurnTimer] = useState(30);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaise, setShowRaise] = useState(false);
  const [preAction, setPreAction] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data: tableConfig } = trpc.tables.get.useQuery({ id: tableId });

  // Join table
  useEffect(() => {
    if (connected && user?.id && tableId) joinTable(tableId, user.id);
    return () => { if (tableId) leaveTable(tableId); };
  }, [connected, user?.id, tableId]);

  useEffect(() => { if (error) toast.error(error); }, [error]);

  // Timer
  useEffect(() => {
    if (!gameState || gameState.phase === 'showdown' || gameState.phase === 'waiting') {
      setTurnTimer(30); return;
    }
    if (!gameState.actionDeadline || gameState.actionDeadline <= 0) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((gameState.actionDeadline - Date.now()) / 1000));
      setTurnTimer(remaining);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [gameState?.actionSeat, gameState?.phase, gameState?.actionDeadline]);

  const heroPlayer = useMemo(() => {
    if (!gameState) return null;
    if (mySeatIndex >= 0) {
      const byIndex = gameState.players.find(p => p.seatIndex === mySeatIndex);
      if (byIndex) return byIndex;
    }
    if (user?.id) return gameState.players.find(p => p.userId === user.id) || null;
    return null;
  }, [gameState?.players, mySeatIndex, user?.id]);

  const heroSeat = heroPlayer?.seatIndex ?? mySeatIndex;

  const isMyTurn = useMemo(() => {
    if (!gameState || heroSeat < 0) return false;
    if (gameState.phase === 'showdown' || gameState.phase === 'waiting') return false;
    return gameState.actionSeat === heroSeat;
  }, [gameState?.actionSeat, gameState?.phase, heroSeat]);

  const callAmount = heroPlayer
    ? Math.min(heroPlayer.chipStack, Math.max(0, (gameState?.currentBet ?? 0) - heroPlayer.currentBet))
    : 0;
  const canCheck = callAmount === 0;

  // Auto pre-action
  useEffect(() => {
    if (!isMyTurn || !preAction || !gameState) return;
    if (preAction === 'check_fold') {
      if (canCheck) sendAction(tableId, 'check');
      else sendAction(tableId, 'fold');
    } else if (preAction === 'call_any') {
      if (canCheck) sendAction(tableId, 'check');
      else sendAction(tableId, 'call');
    } else if (preAction === 'fold_to_bet') {
      if (!canCheck) sendAction(tableId, 'fold');
    }
    setPreAction(null);
  }, [isMyTurn, preAction]);

  const minRaise = gameState?.minRaise || 0;
  const maxRaise = heroPlayer?.chipStack || 0;

  useEffect(() => {
    if (gameState && heroPlayer) {
      setRaiseAmount(Math.min(gameState.currentBet + gameState.bigBlind * 2, heroPlayer.chipStack));
    }
  }, [gameState?.currentBet, gameState?.bigBlind]);

  const tableSize = tableConfig ? parseInt(tableConfig.tableSize) : 6;
  const seats = getSeats(tableSize);
  const timerPct = turnTimer / 30;

  const orderedPlayers = useMemo((): (ServerPlayer & { vi: number })[] => {
    if (!gameState) return [];
    const ps = [...gameState.players];
    if (heroSeat < 0) return ps.map((p, i) => ({ ...p, vi: i }));
    return ps.map(p => ({
      ...p,
      vi: (p.seatIndex - heroSeat + tableSize) % tableSize,
    })).sort((a, b) => a.vi - b.vi);
  }, [gameState?.players, heroSeat, tableSize]);

  const potTotal = gameState ? gameState.pots.reduce((s, p) => s + p.amount, 0) : 0;
  const betsOnTable = gameState ? gameState.players.reduce((s, p) => s + p.currentBet, 0) : 0;
  const totalPot = potTotal + betsOnTable;
  const hasMultiplePots = gameState ? gameState.pots.filter(p => p.amount > 0).length > 1 : false;

  const handleAction = useCallback((action: string, amount?: number) => {
    sendAction(tableId, action, amount);
    setShowRaise(false);
    setPreAction(null);
  }, [tableId, sendAction]);

  const raisePresets = useMemo(() => {
    if (!gameState || !heroPlayer) return [];
    const bb = gameState.bigBlind;
    const pot = totalPot;
    const minR = Math.max(gameState.currentBet + minRaise, bb);
    return [
      { label: 'Min', value: Math.max(minR, gameState.currentBet + bb) },
      { label: '3BB', value: Math.min(bb * 3 + gameState.currentBet, maxRaise) },
      { label: '5BB', value: Math.min(bb * 5 + gameState.currentBet, maxRaise) },
      { label: 'All In', value: maxRaise },
    ].filter(p => p.value >= minR && p.value <= maxRaise);
  }, [gameState, heroPlayer, totalPot, minRaise, maxRaise]);

  const occupiedSeats = useMemo(() => {
    if (!gameState) return new Set<number>();
    return new Set(gameState.players.map(p => p.seatIndex));
  }, [gameState?.players]);

  /* ─── Loading State ─── */
  if (!connected || !gameState) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <TableBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#D4AF37" strokeWidth="2"
                strokeDasharray="40 86" strokeLinecap="round" />
            </svg>
          </motion.div>
          <p className="text-gray-400 text-sm font-medium">{!connected ? 'Connecting...' : 'Joining table...'}</p>
          {!user && <p className="text-gold/60 text-xs">Please sign in to play</p>}
          <button onClick={() => navigate('/lobby')} className="text-gray-600 text-xs underline mt-4 hover:text-gray-400">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main Render ─── */
  return (
    <div className="h-[100dvh] grid relative overflow-hidden select-none" style={{ gridTemplateRows: 'auto 1fr auto' }}>
      {/* Atmospheric AI background */}
      <TableBackground />

      {/* ─── Top HUD ─── */}
      <div className="relative z-30 flex items-center justify-between px-2 py-1 shrink-0" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 80%, transparent 100%)',
      }}>
        <div className="flex items-center gap-2">
          <button onClick={() => { leaveTable(tableId); navigate('/lobby'); }}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={13} className="text-gray-400" />
          </button>
          <HousePokerLogoCompact size={24} />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="px-2.5 py-0.5 rounded-md text-center" style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="text-[8px] uppercase tracking-[0.1em] text-gray-500 font-semibold">
              NLH ~ {gameState.smallBlind}/{gameState.bigBlind} {tableSize}MAX
            </div>
            <div className="text-[8px] font-bold text-gray-400 font-mono-poker">
              {PHASE_LABELS[gameState.phase]} #{gameState.handNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {gameState.phase !== 'showdown' && gameState.phase !== 'waiting' && (
            <div className={`px-1.5 py-0.5 rounded-md flex items-center gap-1`}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Clock size={9} className={turnTimer <= 10 ? 'text-red-400' : 'text-gray-500'} />
              <span className={`text-[9px] font-bold font-mono-poker ${turnTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                {turnTimer}s
              </span>
            </div>
          )}
          <div className="px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {connected ? <Wifi size={8} className="text-emerald-400" /> : <WifiOff size={8} className="text-red-400" />}
            <Users size={8} className="text-gray-500" />
            <span className="text-[8px] text-gray-500 font-mono-poker">{gameState.players.length}/{tableSize}</span>
          </div>
        </div>
      </div>

      {/* ─── Table Area — takes most of the screen ─── */}
      <div className="relative z-10 overflow-hidden" style={{ minHeight: 0 }} ref={tableRef}>
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <div className="relative w-full h-full" style={{ maxWidth: 480, maxHeight: '100%' }}>

            {/* ─── Poker Table — Oval with white glowing border (TON Poker style) ─── */}
            <div className="absolute" style={{ left: '16%', right: '16%', top: '12%', bottom: '14%' }}>
              {/* Outer glow */}
              <div className="absolute -inset-1" style={{
                borderRadius: '50%',
                boxShadow: '0 0 40px rgba(255,255,255,0.15), 0 0 80px rgba(255,255,255,0.06), 0 0 120px rgba(255,255,255,0.03)',
              }} />
              {/* Table outer rim — dark wood */}
              <div className="absolute inset-0" style={{
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #2a2420 0%, #1a1614 50%, #0e0c0a 100%)',
                border: '2.5px solid rgba(255,255,255,0.45)',
                boxShadow: `
                  0 0 40px rgba(0,0,0,0.8),
                  0 0 25px rgba(255,255,255,0.12),
                  0 0 60px rgba(255,255,255,0.06),
                  inset 0 0 30px rgba(0,0,0,0.3)
                `,
              }}>
                {/* White glowing inner border */}
                <div className="absolute inset-[3px]" style={{
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.35)',
                  boxShadow: '0 0 25px rgba(255,255,255,0.12), 0 0 50px rgba(255,255,255,0.05)',
                }} />
                {/* Green felt */}
                <div className="absolute" style={{
                  left: '5%', right: '5%', top: '5%', bottom: '5%',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at 50% 35%, #4aad6a 0%, #3a9a58 15%, #2d8a48 35%, #1f7838 60%, #166428 85%, #0e5020 100%)',
                  boxShadow: 'inset 0 0 50px rgba(0,0,0,0.35), inset 0 -8px 25px rgba(0,0,0,0.15)',
                }}>
                  {/* Felt texture overlay */}
                  <div className="absolute inset-0 rounded-[50%] opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 5h1v1H1V5zm2-2h1v1H3V3zm2-2h1v1H5V1z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
                  }} />
                  {/* Light spot */}
                  <div className="absolute inset-0 rounded-[50%]" style={{
                    background: 'radial-gradient(ellipse at 50% 32%, rgba(255,255,255,0.06) 0%, transparent 50%)',
                  }} />
                </div>
              </div>
            </div>

            {/* ─── Table info label (like TON Poker) ─── */}
            <div className="absolute left-1/2 -translate-x-1/2 z-5" style={{ top: '60%' }}>
              <div className="px-3 py-0.5 rounded-full text-[7px] text-white/20 font-mono-poker tracking-wider"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                NLH ~ {gameState.smallBlind}/{gameState.bigBlind} {tableSize}MAX
              </div>
            </div>

            {/* ─── HOUSE POKER watermark on table ─── */}
            <div className="absolute left-1/2 -translate-x-1/2 z-5 opacity-[0.06]" style={{ top: '52%', transform: 'translate(-50%, -50%)' }}>
              <span className="text-lg font-display font-bold tracking-[0.2em] text-white">HOUSE POKER</span>
            </div>

            {/* ─── Pot Display ─── */}
            {totalPot > 0 && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
                style={{ top: '30%' }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{
                  background: 'rgba(0,0,0,0.75)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}>
                  {/* Pot icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <circle cx="7" cy="7" r="6" fill="#D4AF37" stroke="#B8941F" strokeWidth="0.5" />
                    <circle cx="7" cy="7" r="3.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    <circle cx="7" cy="7" r="1.5" fill="rgba(255,255,255,0.15)" />
                  </svg>
                  <span className="text-xs font-bold text-gold font-mono-poker">
                    {totalPot.toLocaleString()}
                  </span>
                </div>
                {hasMultiplePots && (
                  <div className="flex gap-1 mt-0.5">
                    {gameState.pots.filter(p => p.amount > 0).map((pot, i) => (
                      <span key={i} className="text-[6px] px-1 py-0.5 rounded-full text-gray-400 font-mono-poker"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        {i === 0 ? 'Main' : `Side ${i}`}: {pot.amount}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Community Cards ─── */}
            <div className="absolute left-1/2 flex gap-1 sm:gap-1.5 z-10" style={{ top: '44%', transform: 'translate(-50%, -50%)' }}>
              <AnimatePresence>
                {gameState.communityCards.map((card, i) => (
                  <motion.div key={`cc-${i}`}
                    initial={{ y: -12, opacity: 0, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}>
                    <PokerCard card={card as Card} size="sm" delay={i * 0.08} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {gameState.communityCards.length < 5 && gameState.phase !== 'waiting' && (
                Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                  <div key={`e-${i}`} style={{
                    width: 32, height: 46,
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px dashed rgba(255,255,255,0.04)',
                    borderRadius: 4,
                  }} />
                ))
              )}
            </div>

            {/* ─── Bet Pills ─── */}
            {orderedPlayers.map(player => {
              if (player.currentBet <= 0) return null;
              const pos = seats[player.vi] || seats[0];
              const betPos = getBetPos(pos);
              return <BetPill key={`bet-${player.seatIndex}`} amount={player.currentBet} pos={betPos} />;
            })}

            {/* ─── Player Seats ─── */}
            {orderedPlayers.map(player => {
              const pos = seats[player.vi] || seats[0];
              return (
                <SeatView
                  key={player.seatIndex}
                  player={player}
                  pos={pos}
                  isAction={gameState.actionSeat === player.seatIndex && gameState.phase !== 'showdown'}
                  isDealer={gameState.dealerSeat === player.seatIndex}
                  isSB={gameState.smallBlindSeat === player.seatIndex}
                  isBB={gameState.bigBlindSeat === player.seatIndex}
                  isHero={player.seatIndex === heroSeat}
                  isShowdown={gameState.phase === 'showdown'}
                  isWinner={!!player.lastAction?.startsWith('WIN')}
                  timerPct={gameState.actionSeat === player.seatIndex ? timerPct : 0}
                />
              );
            })}

            {/* ─── Empty Seats ─── */}
            {Array.from({ length: tableSize }).map((_, i) => {
              const vi = heroSeat >= 0 ? (i - heroSeat + tableSize) % tableSize : i;
              if (occupiedSeats.has(i)) return null;
              if (vi === 0 && heroSeat >= 0) return null;
              const pos = seats[vi] || seats[0];
              return (
                <EmptySeat key={`empty-${i}`} pos={pos} seatIndex={i}
                  onSit={() => toast.info('Seat selection coming soon')} />
              );
            })}
          </div>
        </div>

        {/* ─── Hero Cards — overlaid at bottom of table area ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex justify-center pb-2">
            {heroPlayer && !heroPlayer.folded && heroPlayer.holeCards && heroPlayer.holeCards.length > 0 ? (
              <div className="flex gap-2 pointer-events-auto">
                {heroPlayer.holeCards.map((card, i) => (
                  <motion.div key={`hero-${i}-${card.rank}-${card.suit}`}
                    whileHover={{ y: -6, scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 300 }}>
                    <PokerCard card={card as Card} size="md" delay={i * 0.1} />
                  </motion.div>
                ))}
              </div>
            ) : heroPlayer?.folded ? (
              <span className="text-[10px] text-gray-500 tracking-wider uppercase bg-black/50 px-3 py-1 rounded-full">Folded</span>
            ) : gameState.phase === 'waiting' ? null : (
              <span className="text-[10px] text-gray-500 bg-black/50 px-3 py-1 rounded-full">Waiting for cards...</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Showdown Winner Overlay ─── */}
      <AnimatePresence>
        {gameState.phase === 'showdown' && gameState.players.some(p => p.lastAction?.startsWith('WIN')) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
              className="rounded-2xl p-5 mx-4 text-center max-w-xs"
              style={{
                background: 'linear-gradient(145deg, rgba(16,16,28,0.95), rgba(8,8,16,0.98))',
                border: '1px solid rgba(212,175,55,0.25)',
                boxShadow: '0 0 60px rgba(212,175,55,0.15)',
              }}
            >
              <img src={ASSETS.ui.trophy} alt="" className="w-12 h-12 mx-auto mb-2" />
              {gameState.players.filter(p => p.lastAction?.startsWith('WIN')).map(w => (
                <div key={w.seatIndex}>
                  <h2 className="text-lg font-bold gold-text font-display">
                    {w.seatIndex === heroSeat ? 'YOU WIN!' : `${w.name} WINS!`}
                  </h2>
                  {w.lastAction && w.lastAction !== 'WIN' && (
                    <div className="text-xs text-gold-light/70 mt-1">{w.lastAction.replace('WIN - ', '')}</div>
                  )}
                </div>
              ))}
              <div className="text-[9px] text-gray-600 mt-3 tracking-wider">Next hand starting...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Action Panel — TON Poker style buttons ─── */}
      <div className="shrink-0 relative z-30" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)', minHeight: 70 }}>
        {gameState.phase === 'waiting' ? (
          <div className="px-3 py-2.5 text-center" style={{
            background: 'rgba(4,4,6,0.95)', borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="text-sm text-gray-400 font-medium">Waiting for players...</div>
            <div className="text-[10px] text-gray-600 mt-0.5 font-mono-poker">{gameState.players.length} / {tableSize} seated</div>
          </div>
        ) : isMyTurn ? (
          <div className="px-3 py-2" style={{
            background: 'linear-gradient(0deg, rgba(4,4,6,0.98) 0%, rgba(4,4,6,0.95) 100%)',
            borderTop: '1px solid rgba(212,175,55,0.2)',
          }}>
            {/* Raise panel */}
            <AnimatePresence>
              {showRaise && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {/* Preset buttons: Min, 3BB, 5BB, All In */}
                  <div className="flex gap-1.5 mb-2 justify-center">
                    {raisePresets.map(p => (
                      <button key={p.label} onClick={() => setRaiseAmount(p.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          raiseAmount === p.value ? 'text-black' : 'text-gray-400 hover:text-gray-200'
                        }`}
                        style={{
                          background: raiseAmount === p.value
                            ? 'linear-gradient(135deg, #D4AF37, #B8941F)'
                            : 'rgba(255,255,255,0.06)',
                          border: raiseAmount === p.value
                            ? '1px solid rgba(212,175,55,0.5)'
                            : '1px solid rgba(255,255,255,0.08)',
                        }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {/* Raise amount + slider + buttons */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-right" style={{ minWidth: 50 }}>
                      <div className="text-[8px] text-gray-500">Raise :</div>
                      <div className="text-xs font-bold text-gold font-mono-poker">{formatChipAmount(raiseAmount)}</div>
                    </div>
                    <input type="range"
                      min={Math.max(gameState.currentBet + minRaise, gameState.bigBlind)}
                      max={maxRaise}
                      value={raiseAmount}
                      onChange={e => setRaiseAmount(parseInt(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((raiseAmount - gameState.bigBlind) / Math.max(maxRaise - gameState.bigBlind, 1)) * 100}%, rgba(255,255,255,0.06) ${((raiseAmount - gameState.bigBlind) / Math.max(maxRaise - gameState.bigBlind, 1)) * 100}%, rgba(255,255,255,0.06) 100%)`,
                      }}
                    />
                    {/* - and + buttons */}
                    <button onClick={() => setRaiseAmount(Math.max(gameState.currentBet + minRaise, raiseAmount - gameState.bigBlind))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      −
                    </button>
                    <button onClick={() => setRaiseAmount(Math.min(maxRaise, raiseAmount + gameState.bigBlind))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      +
                    </button>
                  </div>
                  {/* BACK + RAISE buttons */}
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setShowRaise(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: '#9CA3AF',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>
                      BACK
                    </button>
                    <button onClick={() => handleAction('raise', raiseAmount)}
                      className="flex-[2] py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37, #9A7B1F)',
                        color: '#0a0a0f',
                        boxShadow: '0 2px 12px rgba(212,175,55,0.3)',
                        border: '1px solid rgba(212,175,55,0.4)',
                      }}>
                      RAISE
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Main action buttons — TON Poker style ─── */}
            {!showRaise && (
              <div className="flex gap-2">
                {/* FOLD — red outline */}
                <button onClick={() => handleAction('fold')}
                  className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 tracking-wider text-xs"
                  style={{
                    background: 'transparent',
                    color: '#F87171',
                    border: '2px solid rgba(239,68,68,0.5)',
                    boxShadow: '0 0 12px rgba(239,68,68,0.1)',
                  }}>
                  Fold
                </button>

                {/* CALL / CHECK — white/light */}
                {canCheck ? (
                  <button onClick={() => handleAction('check')}
                    className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 tracking-wider text-xs"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#E5E7EB',
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}>
                    Check
                  </button>
                ) : (
                  <button onClick={() => handleAction('call')}
                    className="flex-[1.5] py-3 rounded-xl font-bold transition-all active:scale-95 tracking-wider text-xs"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#E5E7EB',
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}>
                    Call {formatChipAmount(callAmount)}
                  </button>
                )}

                {/* BET / RAISE — neutral */}
                <button onClick={() => setShowRaise(true)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 tracking-wider text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#9CA3AF',
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}>
                  {canCheck ? 'Bet' : 'Raise'}
                </button>

                {/* CHECK — if can check, show it */}
                {!canCheck && (
                  <button onClick={() => handleAction('check')}
                    className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 tracking-wider text-xs"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: '#6B7280',
                      border: '2px solid rgba(255,255,255,0.06)',
                      display: canCheck ? 'block' : 'none',
                    }}>
                    Check
                  </button>
                )}
              </div>
            )}

            {/* Chat/emoji buttons at bottom */}
            {!showRaise && (
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex gap-1.5">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onClick={() => toast.info('Chat coming soon')}>
                    <MessageCircle size={13} className="text-gray-500" />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onClick={() => toast.info('Emojis coming soon')}>
                    <Smile size={13} className="text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NOT YOUR TURN — pre-action buttons */
          <div className="px-3 py-2" style={{
            background: 'rgba(4,4,6,0.95)', borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            {heroPlayer?.folded ? (
              <div className="text-center py-1">
                <span className="text-[10px] text-gray-600 tracking-wider">Folded — waiting for next hand</span>
              </div>
            ) : gameState.phase === 'showdown' ? (
              <div className="text-center py-1">
                <span className="text-[10px] text-gray-500">Showdown — revealing cards...</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-center text-[9px] text-gray-600">
                  Waiting for {gameState.players.find(p => p.seatIndex === gameState.actionSeat)?.name || 'opponent'}...
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPreAction(preAction === 'check_fold' ? null : 'check_fold')}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all tracking-wider"
                    style={{
                      background: preAction === 'check_fold' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                      color: preAction === 'check_fold' ? '#FEB2B2' : '#6B7280',
                      border: preAction === 'check_fold' ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {preAction === 'check_fold' ? '✓ ' : ''}Check/Fold
                  </button>
                  <button
                    onClick={() => setPreAction(preAction === 'call_any' ? null : 'call_any')}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all tracking-wider"
                    style={{
                      background: preAction === 'call_any' ? 'rgba(72,187,120,0.1)' : 'rgba(255,255,255,0.03)',
                      color: preAction === 'call_any' ? '#9AE6B4' : '#6B7280',
                      border: preAction === 'call_any' ? '1px solid rgba(72,187,120,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {preAction === 'call_any' ? '✓ ' : ''}Call Any
                  </button>
                  <button
                    onClick={() => setPreAction(preAction === 'fold_to_bet' ? null : 'fold_to_bet')}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all tracking-wider"
                    style={{
                      background: preAction === 'fold_to_bet' ? 'rgba(237,137,54,0.1)' : 'rgba(255,255,255,0.03)',
                      color: preAction === 'fold_to_bet' ? '#FEEBC8' : '#6B7280',
                      border: preAction === 'fold_to_bet' ? '1px solid rgba(237,137,54,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {preAction === 'fold_to_bet' ? '✓ ' : ''}Fold to Bet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
