import { Card, Suit, Rank, SUITS, RANKS } from './assets';

// ─── Deck ───────────────────────────────────────────────
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Hand Rankings ──────────────────────────────────────
export enum HandRank {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export const HAND_NAMES: Record<HandRank, string> = {
  [HandRank.HighCard]: 'High Card',
  [HandRank.OnePair]: 'One Pair',
  [HandRank.TwoPair]: 'Two Pair',
  [HandRank.ThreeOfAKind]: 'Three of a Kind',
  [HandRank.Straight]: 'Straight',
  [HandRank.Flush]: 'Flush',
  [HandRank.FullHouse]: 'Full House',
  [HandRank.FourOfAKind]: 'Four of a Kind',
  [HandRank.StraightFlush]: 'Straight Flush',
  [HandRank.RoyalFlush]: 'Royal Flush',
};

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export interface HandResult {
  rank: HandRank;
  name: string;
  score: number; // higher is better
  bestCards: Card[];
}

function rankValue(r: Rank): number {
  return RANK_VALUES[r];
}

function getCombinations(cards: Card[], k: number): Card[][] {
  const result: Card[][] = [];
  function combine(start: number, combo: Card[]) {
    if (combo.length === k) { result.push([...combo]); return; }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
}

function evaluateFiveCards(cards: Card[]): { rank: HandRank; score: number } {
  const sorted = [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  const values = sorted.map(c => rankValue(c.rank));
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  
  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  
  const uniqueVals = Array.from(new Set(values)).sort((a, b) => b - a);
  if (uniqueVals.length >= 5) {
    for (let i = 0; i <= uniqueVals.length - 5; i++) {
      if (uniqueVals[i] - uniqueVals[i + 4] === 4) {
        isStraight = true;
        straightHigh = uniqueVals[i];
        break;
      }
    }
    // Ace-low straight (A-2-3-4-5)
    if (!isStraight && uniqueVals.includes(14) && uniqueVals.includes(2) && 
        uniqueVals.includes(3) && uniqueVals.includes(4) && uniqueVals.includes(5)) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Count ranks
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([v, c]) => ({ value: Number(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  // Scoring: rank * 10^10 + kickers
  const makeScore = (rank: HandRank, kickers: number[]): number => {
    let score = rank * 1e10;
    for (let i = 0; i < kickers.length && i < 5; i++) {
      score += kickers[i] * Math.pow(15, 4 - i);
    }
    return score;
  };

  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: HandRank.RoyalFlush, score: makeScore(HandRank.RoyalFlush, [14]) };
    return { rank: HandRank.StraightFlush, score: makeScore(HandRank.StraightFlush, [straightHigh]) };
  }
  if (groups[0].count === 4) {
    const kicker = groups.find(g => g.count !== 4)!;
    return { rank: HandRank.FourOfAKind, score: makeScore(HandRank.FourOfAKind, [groups[0].value, kicker.value]) };
  }
  if (groups[0].count === 3 && groups[1]?.count >= 2) {
    return { rank: HandRank.FullHouse, score: makeScore(HandRank.FullHouse, [groups[0].value, groups[1].value]) };
  }
  if (isFlush) {
    return { rank: HandRank.Flush, score: makeScore(HandRank.Flush, values.slice(0, 5)) };
  }
  if (isStraight) {
    return { rank: HandRank.Straight, score: makeScore(HandRank.Straight, [straightHigh]) };
  }
  if (groups[0].count === 3) {
    const kickers = groups.filter(g => g.count !== 3).map(g => g.value);
    return { rank: HandRank.ThreeOfAKind, score: makeScore(HandRank.ThreeOfAKind, [groups[0].value, ...kickers]) };
  }
  if (groups[0].count === 2 && groups[1]?.count === 2) {
    const kicker = groups.find(g => g.count === 1)!;
    const pairs = groups.filter(g => g.count === 2).sort((a, b) => b.value - a.value);
    return { rank: HandRank.TwoPair, score: makeScore(HandRank.TwoPair, [pairs[0].value, pairs[1].value, kicker.value]) };
  }
  if (groups[0].count === 2) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
    return { rank: HandRank.OnePair, score: makeScore(HandRank.OnePair, [groups[0].value, ...kickers]) };
  }
  return { rank: HandRank.HighCard, score: makeScore(HandRank.HighCard, values.slice(0, 5)) };
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  const combos = getCombinations(allCards, 5);
  
  let best = { rank: HandRank.HighCard, score: -1 };
  let bestCombo: Card[] = combos[0] || [];
  
  for (const combo of combos) {
    const result = evaluateFiveCards(combo);
    if (result.score > best.score) {
      best = result;
      bestCombo = combo;
    }
  }
  
  return {
    rank: best.rank,
    name: HAND_NAMES[best.rank],
    score: best.score,
    bestCards: bestCombo,
  };
}

// ─── Game State Types ───────────────────────────────────
export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  holeCards: Card[];
  bet: number;
  totalBet: number;
  folded: boolean;
  isAllIn: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  isActive: boolean;
  seatIndex: number;
  lastAction?: PlayerAction;
  handResult?: HandResult;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  communityCards: Card[];
  pot: number;
  sidePots: { amount: number; eligible: string[] }[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  minRaise: number;
  deck: Card[];
  winners: { playerId: string; amount: number; hand?: string }[];
  lastRaise: number;
}

// ─── AI Bot Logic ───────────────────────────────────────
export function getBotAction(
  player: Player,
  state: GameState
): { action: PlayerAction; amount: number } {
  const callAmount = getCallAmount(player, state);
  const potSize = state.pot;
  const chipRatio = player.chips / (state.bigBlind * 10);
  
  // Simple but effective bot strategy
  const handStrength = player.holeCards.length === 2 
    ? getPreFlopStrength(player.holeCards) 
    : 0.5;
  
  const rand = Math.random();
  
  if (state.phase === 'preflop') {
    if (handStrength > 0.8) {
      // Premium hand — raise big
      if (rand < 0.7) {
        const raiseAmt = Math.min(player.chips, state.bigBlind * (3 + Math.floor(Math.random() * 3)));
        return { action: 'raise', amount: raiseAmt };
      }
      return { action: 'call', amount: callAmount };
    }
    if (handStrength > 0.5) {
      if (callAmount <= state.bigBlind * 3) return { action: 'call', amount: callAmount };
      if (rand < 0.3) return { action: 'call', amount: callAmount };
      return { action: 'fold', amount: 0 };
    }
    if (handStrength > 0.3) {
      if (callAmount <= state.bigBlind) return { action: 'call', amount: callAmount };
      if (rand < 0.15) return { action: 'call', amount: callAmount };
      return { action: 'fold', amount: 0 };
    }
    return { action: 'fold', amount: 0 };
  }
  
  // Post-flop
  if (player.holeCards.length === 2 && state.communityCards.length >= 3) {
    const result = evaluateHand(player.holeCards, state.communityCards);
    
    if (result.rank >= HandRank.ThreeOfAKind) {
      // Strong hand
      if (rand < 0.6) {
        const raiseAmt = Math.min(player.chips, Math.floor(potSize * (0.5 + Math.random() * 0.5)));
        return { action: 'raise', amount: Math.max(raiseAmt, state.minRaise) };
      }
      return { action: 'call', amount: callAmount };
    }
    if (result.rank >= HandRank.OnePair) {
      if (callAmount <= potSize * 0.5) return { action: 'call', amount: callAmount };
      if (rand < 0.3) return { action: 'call', amount: callAmount };
      return { action: 'fold', amount: 0 };
    }
    // Weak hand
    if (callAmount === 0) return { action: 'check', amount: 0 };
    if (callAmount <= state.bigBlind && rand < 0.3) return { action: 'call', amount: callAmount };
    // Occasional bluff
    if (rand < 0.1) {
      const bluffAmt = Math.min(player.chips, Math.floor(potSize * 0.6));
      return { action: 'raise', amount: Math.max(bluffAmt, state.minRaise) };
    }
    return { action: 'fold', amount: 0 };
  }
  
  if (callAmount === 0) return { action: 'check', amount: 0 };
  if (callAmount <= state.bigBlind * 2) return { action: 'call', amount: callAmount };
  return { action: 'fold', amount: 0 };
}

function getPreFlopStrength(cards: Card[]): number {
  if (cards.length < 2) return 0.3;
  const [c1, c2] = cards;
  const v1 = rankValue(c1.rank);
  const v2 = rankValue(c2.rank);
  const high = Math.max(v1, v2);
  const low = Math.min(v1, v2);
  const suited = c1.suit === c2.suit;
  const pair = v1 === v2;
  
  if (pair) {
    if (high >= 10) return 0.95; // TT+
    if (high >= 7) return 0.75;
    return 0.55;
  }
  if (high === 14) { // Ace
    if (low >= 10) return suited ? 0.88 : 0.82;
    if (low >= 7) return suited ? 0.65 : 0.55;
    return suited ? 0.45 : 0.35;
  }
  if (high >= 12 && low >= 10) return suited ? 0.72 : 0.65;
  if (suited && high - low <= 2) return 0.45;
  if (suited) return 0.35;
  return 0.2;
}

export function getCallAmount(player: Player, state: GameState): number {
  const maxBet = Math.max(...state.players.filter(p => !p.folded).map(p => p.bet));
  return Math.min(player.chips, maxBet - player.bet);
}

export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter(p => !p.folded && p.chips > 0);
}

export function getPlayersInHand(state: GameState): Player[] {
  return state.players.filter(p => !p.folded);
}
