/**
 * GameTable — HOUSE POKER
 * Premium casino-quality poker table with WebSocket multiplayer
 * Fixed: player positioning, hero cards, pre-action buttons
 */
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Clock, Users, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import { useSocket, ServerPlayer } from '@/hooks/useSocket';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { ASSETS, SUIT_SYMBOLS, CHIP_VALUES } from '@/lib/assets';
import type { Card } from '@/lib/assets';
import { toast } from 'sonner';

/* ─── Seat positions (percentage-based for responsive) ─── */
// Seats are arranged around the oval table. Index 0 = hero (always bottom center).
// Other seats are evenly distributed clockwise.
const SEATS_6 = [
  { x: 50, y: 90 },   // 0: hero (bottom center)
  { x: 6,  y: 65 },   // 1: left-bottom
  { x: 6,  y: 25 },   // 2: left-top
  { x: 50, y: 4 },    // 3: top center
  { x: 94, y: 25 },   // 4: right-top
  { x: 94, y: 65 },   // 5: right-bottom
];
const SEATS_9 = [
  { x: 50, y: 90 }, { x: 10, y: 76 }, { x: 3, y: 48 },
  { x: 10, y: 18 }, { x: 34, y: 4 },  { x: 66, y: 4 },
  { x: 90, y: 18 }, { x: 97, y: 48 }, { x: 90, y: 76 },
];
const SEATS_2 = [{ x: 50, y: 90 }, { x: 50, y: 4 }];

function getSeats(n: number) {
  return n <= 2 ? SEATS_2 : n <= 6 ? SEATS_6 : SEATS_9;
}

const PHASE_LABELS: Record<string, string> = {
  waiting: 'WAITING', preflop: 'PRE-FLOP', flop: 'FLOP',
  turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN',
};

/* ─── Chip stack visual ─── */
function ChipStack({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  const chips: typeof CHIP_VALUES[number][] = [];
  let remaining = amount;
  for (let i = CHIP_VALUES.length - 1; i >= 0; i--) {
    const cv = CHIP_VALUES[i];
    while (remaining >= cv.value && chips.length < 5) {
      chips.push(cv);
      remaining -= cv.value;
    }
  }
  if (chips.length === 0) chips.push(CHIP_VALUES[0]);

  return (
    <div className="flex items-center gap-0.5">
      <div className="relative" style={{ width: 16, height: 16 + chips.length * 2 }}>
        {chips.slice(0, 4).map((c, i) => (
          <img key={i} src={c.img} alt="" className="absolute w-4 h-4 rounded-full"
            style={{ bottom: i * 2, left: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
        ))}
      </div>
      <span className="text-[10px] font-bold text-gold ml-1 font-mono-poker">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}

/* ─── Playing Card ─── */
function CardView({ card, faceDown = false, size = 'md' }: {
  card: Card; faceDown?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const dims = { sm: { w: 30, h: 44 }, md: { w: 42, h: 60 }, lg: { w: 54, h: 78 }, xl: { w: 68, h: 96 } };
  const { w, h } = dims[size];
  const fs = {
    sm: { rank: 9, suit: 7, center: 13 },
    md: { rank: 11, suit: 9, center: 17 },
    lg: { rank: 14, suit: 11, center: 22 },
    xl: { rank: 18, suit: 14, center: 28 },
  };

  if (faceDown) {
    return (
      <div className="rounded-lg overflow-hidden flex-shrink-0" style={{
        width: w, height: h,
        background: `url(${ASSETS.cardBack}) center/cover`,
        border: '1px solid rgba(212, 175, 55, 0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      }} />
    );
  }

  const suitStr = String(card.suit);
  const isRed = suitStr === 'hearts' || suitStr === 'diamonds' || suitStr === 'h' || suitStr === 'd';
  const color = isRed ? '#dc2626' : '#1a1a2e';
  const symbol = SUIT_SYMBOLS[card.suit] || '?';
  const rankStr = String(card.rank);
  const rank = rankStr === 'T' ? '10' : rankStr;

  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      className="rounded-lg flex-shrink-0 relative overflow-hidden"
      style={{
        width: w, height: h,
        background: 'linear-gradient(160deg, #ffffff 0%, #f8f8f8 50%, #efefef 100%)',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div className="absolute flex flex-col items-center leading-none" style={{ top: 2, left: 3 }}>
        <span className="font-black" style={{ fontSize: fs[size].rank, color, lineHeight: 1 }}>{rank}</span>
        <span style={{ fontSize: fs[size].suit, color, lineHeight: 1 }}>{symbol}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: fs[size].center, color, opacity: 0.85 }}>{symbol}</span>
      </div>
      <div className="absolute flex flex-col items-center leading-none rotate-180" style={{ bottom: 2, right: 3 }}>
        <span className="font-black" style={{ fontSize: fs[size].rank, color, lineHeight: 1 }}>{rank}</span>
        <span style={{ fontSize: fs[size].suit, color, lineHeight: 1 }}>{symbol}</span>
      </div>
    </motion.div>
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
  const isTop = pos.y < 35;

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
      {/* Hole cards — show above for top players, skip for hero (shown separately) */}
      {!isHero && isTop && player.holeCards.length > 0 && !player.folded && (
        <div className="flex gap-0.5 mb-1">
          {player.holeCards.map((c, i) => (
            <CardView key={i} card={c as Card} faceDown={!isShowdown} size="sm" />
          ))}
        </div>
      )}

      {/* Player container */}
      <div className={`relative ${player.folded ? 'opacity-30 grayscale' : ''} transition-all duration-300`}>
        {/* Timer ring for active player */}
        {isAction && !player.folded && (
          <svg className="absolute" viewBox="0 0 52 52" style={{ width: 56, height: 56, left: -6, top: -6 }}>
            <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="2" />
            <circle cx="26" cy="26" r="24" fill="none"
              stroke={timerPct > 0.5 ? '#D4AF37' : timerPct > 0.25 ? '#f59e0b' : '#ef4444'}
              strokeWidth="2.5"
              strokeDasharray={`${timerPct * 150.8} 150.8`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dasharray 0.5s linear, stroke 0.5s' }}
            />
          </svg>
        )}

        {/* Winner glow */}
        {isWinner && (
          <motion.div
            className="absolute -inset-4 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden" style={{
          border: `2.5px solid ${isWinner ? '#D4AF37' : isAction ? '#D4AF37' : isHero ? 'rgba(0,240,255,0.6)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isWinner
            ? '0 0 24px rgba(212,175,55,0.6)'
            : isAction
            ? '0 0 16px rgba(212,175,55,0.4)'
            : '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        </div>

        {/* Position badges (D, SB, BB) */}
        {isDealer && (
          <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black"
            style={{ background: '#D4AF37', color: '#000', boxShadow: '0 2px 6px rgba(212,175,55,0.5)' }}>D</div>
        )}
        {isSB && !isDealer && (
          <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black"
            style={{ background: '#3b82f6', color: '#fff', boxShadow: '0 2px 6px rgba(59,130,246,0.4)' }}>SB</div>
        )}
        {isBB && !isDealer && !isSB && (
          <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black"
            style={{ background: '#ef4444', color: '#fff', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>BB</div>
        )}
      </div>

      {/* Name + stack */}
      <div className="mt-1 text-center px-2 py-0.5 rounded-lg" style={{
        background: isHero ? 'rgba(0,240,255,0.08)' : 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        border: isHero ? '1px solid rgba(0,240,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
        minWidth: 64,
      }}>
        <div className={`text-[9px] font-semibold truncate max-w-[72px] ${isHero ? 'text-cyan-neon' : 'text-white'}`}>
          {isHero ? '★ YOU' : player.name}
        </div>
        <div className="text-[9px] font-bold text-gold font-mono-poker">
          {player.chipStack.toLocaleString()}
        </div>
      </div>

      {/* Current bet chip stack */}
      {player.currentBet > 0 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-0.5">
          <ChipStack amount={player.currentBet} />
        </motion.div>
      )}

      {/* Last action badge */}
      {player.lastAction && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="mt-0.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider"
          style={{
            background: player.lastAction.startsWith('WIN')
              ? 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.15))'
              : player.lastAction === 'fold' ? 'rgba(139,0,0,0.3)'
              : player.lastAction === 'allin' ? 'rgba(255,107,0,0.3)'
              : 'rgba(0,240,255,0.12)',
            color: player.lastAction.startsWith('WIN') ? '#D4AF37'
              : player.lastAction === 'fold' ? '#ff6b6b'
              : player.lastAction === 'allin' ? '#ff8c00'
              : '#00F0FF',
            border: `1px solid ${player.lastAction.startsWith('WIN') ? 'rgba(212,175,55,0.3)' : 'transparent'}`,
          }}
        >
          {player.lastAction}
        </motion.div>
      )}

      {/* Hole cards — below for non-top, non-hero players */}
      {!isHero && !isTop && player.holeCards.length > 0 && !player.folded && (
        <div className="flex gap-0.5 mt-1">
          {player.holeCards.map((c, i) => (
            <CardView key={i} card={c as Card} faceDown={!isShowdown} size="sm" />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main GameTable ─── */
export default function GameTable() {
  const params = useParams<{ tableId: string }>();
  const tableId = parseInt(params.tableId || '1');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { connected, gameState, error, joinTable, leaveTable, sendAction } = useSocket();

  const [turnTimer, setTurnTimer] = useState(30);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaise, setShowRaise] = useState(false);
  const [preAction, setPreAction] = useState<string | null>(null); // 'check_fold' | 'call_any' | 'fold_to_bet'
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: tableConfig } = trpc.tables.get.useQuery({ id: tableId });

  // Join table
  useEffect(() => {
    if (connected && user?.id && tableId) joinTable(tableId, user.id);
    return () => { if (tableId) leaveTable(tableId); };
  }, [connected, user?.id, tableId]);

  // Errors
  useEffect(() => { if (error) toast.error(error); }, [error]);

  // Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!gameState || gameState.phase === 'showdown' || gameState.phase === 'waiting') return;
    if (gameState.actionDeadline > 0) {
      const tick = () => setTurnTimer(Math.max(0, Math.ceil((gameState.actionDeadline - Date.now()) / 1000)));
      tick();
      timerRef.current = setInterval(tick, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState?.actionSeat, gameState?.phase, gameState?.actionDeadline]);

  // Execute pre-action when it becomes our turn
  const heroPlayer = gameState?.players.find(p => p.userId === user?.id);
  const heroSeat = heroPlayer?.seatIndex ?? -1;
  const isMyTurn = gameState
    ? gameState.actionSeat === heroSeat && gameState.phase !== 'showdown' && gameState.phase !== 'waiting'
    : false;

  const callAmount = heroPlayer
    ? Math.min(heroPlayer.chipStack, (gameState?.currentBet ?? 0) - heroPlayer.currentBet)
    : 0;
  const canCheck = callAmount === 0;

  // Auto-execute pre-action
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
      // If can check, don't auto-fold — let player decide
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

  // Order players so hero is always at seat position 0 (bottom center)
  const orderedPlayers = useMemo((): (ServerPlayer & { vi: number })[] => {
    if (!gameState) return [];
    const ps = [...gameState.players];
    if (heroSeat === -1) return ps.map((p, i) => ({ ...p, vi: i }));

    // Map each player to a visual index relative to hero
    // Hero = vi 0, then clockwise around the table
    return ps.map(p => ({
      ...p,
      vi: (p.seatIndex - heroSeat + tableSize) % tableSize,
    })).sort((a, b) => a.vi - b.vi);
  }, [gameState?.players, heroSeat, tableSize]);

  const totalPot = gameState
    ? gameState.pots.reduce((s, p) => s + p.amount, 0) + gameState.players.reduce((s, p) => s + p.currentBet, 0)
    : 0;

  const handleAction = useCallback((action: string, amount?: number) => {
    sendAction(tableId, action, amount);
    setShowRaise(false);
    setPreAction(null);
  }, [tableId, sendAction]);

  // Raise presets
  const raisePresets = useMemo(() => {
    if (!gameState || !heroPlayer) return [];
    const bb = gameState.bigBlind;
    const pot = totalPot;
    const minR = Math.max(gameState.currentBet + minRaise, bb);
    return [
      { label: '2BB', value: Math.min(bb * 2 + gameState.currentBet, maxRaise) },
      { label: '3BB', value: Math.min(bb * 3 + gameState.currentBet, maxRaise) },
      { label: '½ Pot', value: Math.min(Math.floor(pot / 2) + gameState.currentBet, maxRaise) },
      { label: 'Pot', value: Math.min(pot + gameState.currentBet, maxRaise) },
    ].filter(p => p.value >= minR && p.value <= maxRaise);
  }, [gameState, heroPlayer, totalPot, minRaise, maxRaise]);

  // Loading
  if (!connected || !gameState) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{
        background: 'radial-gradient(ellipse at center, #0d1117 0%, #050507 100%)',
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <img src={ASSETS.ui.crown} alt="" className="w-14 h-14" />
        </motion.div>
        <p className="text-gray-400 text-sm font-medium">{!connected ? 'Connecting to server...' : 'Joining table...'}</p>
        {!user && <p className="text-yellow-400 text-xs">Please log in to play</p>}
        <button onClick={() => navigate('/lobby')} className="text-gray-500 text-xs underline mt-4 hover:text-gray-300 transition-colors">
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden select-none" style={{
      background: `url(${ASSETS.gameBg}) center/cover no-repeat`,
      backgroundColor: '#050507',
    }}>
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0" style={{ background: 'rgba(5,5,7,0.55)' }} />

      {/* ─── Top HUD ─── */}
      <div className="relative z-30 flex items-center justify-between px-3 py-2 shrink-0" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
      }}>
        <button onClick={() => { leaveTable(tableId); navigate('/lobby'); }}
          className="w-9 h-9 rounded-full flex items-center justify-center glass-panel-light active:scale-90 transition-transform">
          <ArrowLeft size={16} className="text-gray-300" />
        </button>

        <div className="flex items-center gap-2">
          <div className="glass-panel px-3 py-1.5 rounded-xl text-center">
            <div className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold">
              {PHASE_LABELS[gameState.phase]} #{gameState.handNumber}
            </div>
            <div className="text-xs font-bold text-gold font-mono-poker">
              {gameState.smallBlind}/{gameState.bigBlind}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {gameState.phase !== 'showdown' && gameState.phase !== 'waiting' && (
            <div className={`glass-panel px-2 py-1.5 rounded-xl flex items-center gap-1 ${turnTimer <= 10 ? 'border-red-500/30' : ''}`}>
              <Clock size={10} className={turnTimer <= 10 ? 'text-red-400' : 'text-gray-500'} />
              <span className={`text-[10px] font-bold font-mono-poker ${turnTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                {turnTimer}s
              </span>
            </div>
          )}
          <div className="glass-panel-light px-2 py-1.5 rounded-xl flex items-center gap-1">
            {connected ? <Wifi size={10} className="text-green-400" /> : <WifiOff size={10} className="text-red-400" />}
            <Users size={10} className="text-gray-500" />
            <span className="text-[9px] text-gray-400">{gameState.players.length}</span>
          </div>
        </div>
      </div>

      {/* ─── Table Area ─── */}
      <div className="flex-1 relative z-10" style={{ minHeight: 0 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: '96%', maxWidth: 640, aspectRatio: '1.55 / 1' }}>

            {/* Poker table (CSS rendered) */}
            <div className="absolute inset-0" style={{
              borderRadius: '50%',
              background: 'linear-gradient(180deg, rgba(30,30,50,0.97) 0%, rgba(15,15,28,0.99) 100%)',
              boxShadow: '0 0 0 5px rgba(212,175,55,0.05), 0 0 0 10px rgba(8,8,16,0.95), 0 0 80px rgba(0,0,0,0.7)',
              border: '2px solid rgba(212,175,55,0.06)',
            }}>
              {/* Green felt */}
              <div className="absolute" style={{
                left: '3%', right: '3%', top: '5%', bottom: '5%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at 50% 40%, #1e7a3a 0%, #166b30 20%, #0f5424 45%, #093d18 70%, #052810 100%)',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5), inset 0 -20px 50px rgba(0,0,0,0.25)',
                border: '1px solid rgba(212,175,55,0.03)',
              }}>
                {/* Felt texture */}
                <div className="absolute inset-0 rounded-[50%] opacity-[0.03]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 5h1v1H1V5zm2-2h1v1H3V3zm2-2h1v1H5V1z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E")`,
                }} />
                {/* Inner decorative line */}
                <div className="absolute" style={{
                  left: '10%', right: '10%', top: '12%', bottom: '12%',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.02)',
                }} />
              </div>
            </div>

            {/* Logo watermark */}
            <div className="absolute left-1/2 -translate-x-1/2 z-[5] pointer-events-none" style={{ top: '14%' }}>
              <img src={ASSETS.logo} alt="" className="w-14 h-14 opacity-[0.05]" />
            </div>

            {/* ─── Pot Display ─── */}
            {totalPot > 0 && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-2"
                style={{
                  top: '22%',
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 20,
                  padding: '5px 16px',
                  border: '1px solid rgba(212,175,55,0.3)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
              >
                <img src={ASSETS.chips.gold} alt="" className="w-5 h-5" style={{ filter: 'drop-shadow(0 2px 4px rgba(212,175,55,0.4))' }} />
                <span className="text-sm font-black text-gold font-mono-poker">
                  {totalPot.toLocaleString()}
                </span>
              </motion.div>
            )}

            {/* ─── Community Cards ─── */}
            <div className="absolute left-1/2 flex gap-1.5 z-10" style={{ top: '42%', transform: 'translate(-50%, -50%)' }}>
              <AnimatePresence>
                {gameState.communityCards.map((card, i) => (
                  <motion.div key={`cc-${i}`} initial={{ y: -20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 }}>
                    <CardView card={card as Card} size="md" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* Empty card slots */}
              {gameState.communityCards.length < 5 && gameState.phase !== 'waiting' && (
                Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                  <div key={`e-${i}`} className="rounded-lg" style={{
                    width: 42, height: 60,
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px dashed rgba(255,255,255,0.04)',
                  }} />
                ))
              )}
            </div>

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
                  isHero={player.userId === user?.id}
                  isShowdown={gameState.phase === 'showdown'}
                  isWinner={!!player.lastAction?.startsWith('WIN')}
                  timerPct={gameState.actionSeat === player.seatIndex ? timerPct : 0}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Hero Cards (large, bottom center) ─── */}
      {heroPlayer && !heroPlayer.folded && heroPlayer.holeCards.length > 0 && (
        <div className="flex justify-center gap-3 py-2 relative z-20 shrink-0" style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}>
          {heroPlayer.holeCards.map((card, i) => (
            <motion.div
              key={`hero-${i}`}
              whileHover={{ y: -10, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <CardView card={card as Card} size="xl" />
            </motion.div>
          ))}
        </div>
      )}

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
              className="glass-panel rounded-2xl p-6 mx-4 text-center max-w-xs gold-glow"
            >
              <img src={ASSETS.ui.trophy} alt="" className="w-16 h-16 mx-auto mb-3" />
              {gameState.players.filter(p => p.lastAction?.startsWith('WIN')).map(w => (
                <div key={w.seatIndex}>
                  <h2 className="text-xl font-black gold-text mb-1 font-display">
                    {w.userId === user?.id ? 'YOU WIN!' : `${w.name} WINS!`}
                  </h2>
                  {w.lastAction && w.lastAction !== 'WIN' && (
                    <div className="text-sm text-cyan-neon mb-1">{w.lastAction.replace('WIN - ', '')}</div>
                  )}
                </div>
              ))}
              <div className="text-[10px] text-gray-500 mt-3">Next hand starting...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Action Panel ─── */}
      <div className="shrink-0 relative z-30">
        {gameState.phase === 'waiting' ? (
          /* Waiting state */
          <div className="px-4 py-4 text-center" style={{
            background: 'rgba(5,5,10,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="text-sm text-gray-300 font-medium">Waiting for players...</div>
            <div className="text-xs text-gray-500 mt-1">{gameState.players.length} / {tableSize} seated</div>
          </div>
        ) : isMyTurn ? (
          /* YOUR TURN — full action panel */
          <div className="px-3 py-3 space-y-2" style={{
            background: 'rgba(5,5,10,0.95)',
            backdropFilter: 'blur(24px)',
            borderTop: '2px solid rgba(212,175,55,0.25)',
          }}>
            {/* Raise slider (expandable) */}
            <AnimatePresence>
              {showRaise && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {/* Presets */}
                  <div className="flex gap-1.5 mb-2">
                    {raisePresets.map(p => (
                      <button key={p.label} onClick={() => setRaiseAmount(p.value)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          raiseAmount === p.value ? 'bg-gold/20 text-gold border border-gold/40' : 'glass-panel-light text-gray-400 hover:text-gray-200'
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {/* Slider + confirm */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-gold font-mono-poker w-16 text-right">
                      {raiseAmount.toLocaleString()}
                    </span>
                    <input
                      type="range"
                      min={Math.max(gameState.currentBet + minRaise, gameState.bigBlind)}
                      max={maxRaise}
                      value={raiseAmount}
                      onChange={e => setRaiseAmount(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((raiseAmount - gameState.bigBlind) / Math.max(maxRaise - gameState.bigBlind, 1)) * 100}%, rgba(255,255,255,0.1) ${((raiseAmount - gameState.bigBlind) / Math.max(maxRaise - gameState.bigBlind, 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                        accentColor: '#D4AF37',
                      }}
                    />
                    <button onClick={() => handleAction('raise', raiseAmount)}
                      className="btn-primary-poker px-5 py-2 rounded-xl text-xs font-black">
                      RAISE
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main action buttons */}
            <div className="flex gap-2">
              {/* FOLD */}
              <button onClick={() => handleAction('fold')}
                className="flex-1 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, #8B0000, #5C0000)',
                  color: '#fff',
                  border: '1px solid rgba(255,0,0,0.3)',
                  boxShadow: '0 4px 12px rgba(139,0,0,0.3)',
                }}>
                FOLD
              </button>

              {/* CHECK / CALL */}
              {canCheck ? (
                <button onClick={() => handleAction('check')}
                  className="flex-1 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 btn-action-poker">
                  CHECK
                </button>
              ) : (
                <button onClick={() => handleAction('call')}
                  className="flex-1 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 btn-action-poker">
                  CALL {callAmount.toLocaleString()}
                </button>
              )}

              {/* RAISE toggle */}
              <button onClick={() => setShowRaise(!showRaise)}
                className="flex-1 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1.5"
                style={{
                  background: showRaise ? 'rgba(212,175,55,0.15)' : 'linear-gradient(135deg, #D4AF37, #B8941F)',
                  color: showRaise ? '#D4AF37' : '#000',
                  border: showRaise ? '1px solid rgba(212,175,55,0.3)' : 'none',
                  boxShadow: showRaise ? 'none' : '0 4px 12px rgba(212,175,55,0.3)',
                }}>
                RAISE
              </button>

              {/* ALL IN */}
              {heroPlayer && heroPlayer.chipStack > 0 && (
                <button onClick={() => handleAction('allin')}
                  className="py-3.5 px-3 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b00, #cc5500)',
                    color: '#fff',
                    border: '1px solid rgba(255,107,0,0.5)',
                    boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
                  }}>
                  ALL IN
                </button>
              )}
            </div>
          </div>
        ) : (
          /* NOT YOUR TURN — pre-action buttons */
          <div className="px-3 py-3" style={{
            background: 'rgba(5,5,10,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            {heroPlayer?.folded ? (
              <div className="text-center">
                <span className="text-xs text-gray-500">Folded — waiting for next hand</span>
              </div>
            ) : gameState.phase === 'showdown' ? (
              <div className="text-center">
                <span className="text-xs text-gray-400">Showdown — revealing cards...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-center text-[10px] text-gray-500 mb-1">
                  Waiting for {gameState.players.find(p => p.seatIndex === gameState.actionSeat)?.name || 'opponent'}...
                </div>
                {/* Pre-action checkboxes */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreAction(preAction === 'check_fold' ? null : 'check_fold')}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      preAction === 'check_fold'
                        ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                        : 'glass-panel-light text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {preAction === 'check_fold' ? '✓ ' : ''}Check / Fold
                  </button>
                  <button
                    onClick={() => setPreAction(preAction === 'call_any' ? null : 'call_any')}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      preAction === 'call_any'
                        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30'
                        : 'glass-panel-light text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {preAction === 'call_any' ? '✓ ' : ''}Call Any
                  </button>
                  <button
                    onClick={() => setPreAction(preAction === 'fold_to_bet' ? null : 'fold_to_bet')}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      preAction === 'fold_to_bet'
                        ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                        : 'glass-panel-light text-gray-400 hover:text-gray-200'
                    }`}
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
