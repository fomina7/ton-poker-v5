import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState, GamePhase, Player, PlayerAction,
  createDeck, evaluateHand, getBotAction, getCallAmount,
  getPlayersInHand, HandRank,
} from '@/lib/pokerEngine';
import { AVATAR_LIST } from '@/lib/assets';
import { Card } from '@/lib/assets';

const BOT_NAMES = ['SharkBite', 'OwlEye', 'FoxTrick', 'BearClaw', 'WolfFang', 'MonkeyKing', 'PenguinAce', 'KoalaChill'];

function createBotPlayers(count: number, startChips: number = 10000): Player[] {
  const avatarKeys = ['shark', 'owl', 'fox', 'bear', 'wolf', 'monkey', 'penguin', 'koala'];
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${i}`,
    name: BOT_NAMES[i % BOT_NAMES.length],
    avatar: avatarKeys[i % avatarKeys.length],
    chips: startChips,
    holeCards: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    isAllIn: false,
    isDealer: false,
    isSB: false,
    isBB: false,
    isActive: true,
    seatIndex: i + 1,
    lastAction: undefined,
  }));
}

export function usePokerGame(playerCount: number = 6, blinds: [number, number] = [10, 20]) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showdown, setShowdown] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initGame = useCallback(() => {
    const humanPlayer: Player = {
      id: 'human',
      name: 'You',
      avatar: 'cat',
      chips: 10000,
      holeCards: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      isAllIn: false,
      isDealer: false,
      isSB: false,
      isBB: false,
      isActive: true,
      seatIndex: 0,
      lastAction: undefined,
    };
    const bots = createBotPlayers(playerCount - 1, 10000);
    const players = [humanPlayer, ...bots];
    
    const state: GameState = {
      phase: 'waiting',
      players,
      communityCards: [],
      pot: 0,
      sidePots: [],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlind: blinds[0],
      bigBlind: blinds[1],
      minRaise: blinds[1],
      deck: [],
      winners: [],
      lastRaise: blinds[1],
    };
    
    setGameState(state);
    setShowdown(false);
    return state;
  }, [playerCount, blinds]);

  const startNewHand = useCallback((prevState?: GameState) => {
    setShowdown(false);
    const base = prevState || gameState;
    if (!base) return;

    const activePlayers = base.players.filter(p => p.chips > 0);
    if (activePlayers.length < 2) return;

    const deck = createDeck();
    const dealerIdx = (base.dealerIndex + 1) % activePlayers.length;
    const sbIdx = (dealerIdx + 1) % activePlayers.length;
    const bbIdx = (dealerIdx + 2) % activePlayers.length;

    const players: Player[] = activePlayers.map((p, i) => ({
      ...p,
      holeCards: [deck.pop()!, deck.pop()!],
      bet: 0,
      totalBet: 0,
      folded: false,
      isAllIn: false,
      isDealer: i === dealerIdx,
      isSB: i === sbIdx,
      isBB: i === bbIdx,
      lastAction: undefined,
      handResult: undefined,
      seatIndex: i,
    }));

    // Post blinds
    const sbAmount = Math.min(players[sbIdx].chips, base.smallBlind);
    players[sbIdx].chips -= sbAmount;
    players[sbIdx].bet = sbAmount;
    players[sbIdx].totalBet = sbAmount;

    const bbAmount = Math.min(players[bbIdx].chips, base.bigBlind);
    players[bbIdx].chips -= bbAmount;
    players[bbIdx].bet = bbAmount;
    players[bbIdx].totalBet = bbAmount;

    const firstToAct = (bbIdx + 1) % players.length;

    const newState: GameState = {
      phase: 'preflop',
      players,
      communityCards: [],
      pot: sbAmount + bbAmount,
      sidePots: [],
      currentPlayerIndex: firstToAct,
      dealerIndex: dealerIdx,
      smallBlind: base.smallBlind,
      bigBlind: base.bigBlind,
      minRaise: base.bigBlind,
      deck,
      winners: [],
      lastRaise: base.bigBlind,
    };

    setGameState(newState);
    
    // If first to act is a bot, trigger bot action
    if (players[firstToAct].id !== 'human') {
      setTimeout(() => processBotTurn(newState), 800);
    }
  }, [gameState]);

  const processBotTurn = useCallback((state: GameState) => {
    const current = state.players[state.currentPlayerIndex];
    if (!current || current.id === 'human' || current.folded || current.isAllIn) {
      advanceToNextPlayer(state);
      return;
    }

    const botDecision = getBotAction(current, state);
    executeAction(state, botDecision.action, botDecision.amount);
  }, []);

  const executeAction = useCallback((state: GameState, action: PlayerAction, amount: number = 0) => {
    const newState = { ...state, players: state.players.map(p => ({ ...p })) };
    const player = newState.players[newState.currentPlayerIndex];

    switch (action) {
      case 'fold':
        player.folded = true;
        player.lastAction = 'fold';
        break;
      case 'check':
        player.lastAction = 'check';
        break;
      case 'call': {
        const callAmt = getCallAmount(player, newState);
        const actualCall = Math.min(callAmt, player.chips);
        player.chips -= actualCall;
        player.bet += actualCall;
        player.totalBet += actualCall;
        newState.pot += actualCall;
        if (player.chips === 0) player.isAllIn = true;
        player.lastAction = player.isAllIn ? 'allin' : 'call';
        break;
      }
      case 'raise': {
        const raiseAmt = Math.min(amount, player.chips);
        const callFirst = getCallAmount(player, newState);
        const totalNeeded = Math.max(raiseAmt, callFirst + newState.minRaise);
        const actualAmount = Math.min(totalNeeded, player.chips);
        player.chips -= actualAmount;
        player.bet += actualAmount;
        player.totalBet += actualAmount;
        newState.pot += actualAmount;
        newState.lastRaise = actualAmount - callFirst;
        newState.minRaise = Math.max(newState.minRaise, newState.lastRaise);
        if (player.chips === 0) player.isAllIn = true;
        player.lastAction = player.isAllIn ? 'allin' : 'raise';
        break;
      }
      case 'allin': {
        const allInAmt = player.chips;
        player.bet += allInAmt;
        player.totalBet += allInAmt;
        newState.pot += allInAmt;
        player.chips = 0;
        player.isAllIn = true;
        player.lastAction = 'allin';
        break;
      }
    }

    // Check if hand is over (only one player left)
    const playersInHand = getPlayersInHand(newState);
    if (playersInHand.length === 1) {
      const winner = playersInHand[0];
      newState.winners = [{ playerId: winner.id, amount: newState.pot }];
      winner.chips += newState.pot;
      newState.phase = 'showdown';
      setGameState(newState);
      setShowdown(true);
      return;
    }

    advanceToNextPlayer(newState);
  }, []);

  const advanceToNextPlayer = useCallback((state: GameState) => {
    const newState = { ...state, players: state.players.map(p => ({ ...p })) };
    let nextIdx = (newState.currentPlayerIndex + 1) % newState.players.length;
    let checked = 0;

    // Find next active player
    while (checked < newState.players.length) {
      const p = newState.players[nextIdx];
      if (!p.folded && !p.isAllIn) break;
      nextIdx = (nextIdx + 1) % newState.players.length;
      checked++;
    }

    // Check if betting round is complete
    const activePlayers = newState.players.filter(p => !p.folded && !p.isAllIn);
    const maxBet = Math.max(...newState.players.filter(p => !p.folded).map(p => p.bet));
    const allMatched = activePlayers.every(p => p.bet === maxBet);
    const allActed = activePlayers.every(p => p.lastAction !== undefined);

    if ((allMatched && allActed) || activePlayers.length === 0) {
      advancePhase(newState);
      return;
    }

    newState.currentPlayerIndex = nextIdx;
    setGameState(newState);

    // If next player is bot, trigger bot action
    if (newState.players[nextIdx].id !== 'human' && !newState.players[nextIdx].folded && !newState.players[nextIdx].isAllIn) {
      const delay = 600 + Math.random() * 800;
      timeoutRef.current = setTimeout(() => processBotTurn(newState), delay);
    }
  }, [processBotTurn]);

  const advancePhase = useCallback((state: GameState) => {
    const newState = { ...state, players: state.players.map(p => ({ ...p })) };
    
    // Reset bets for new round
    for (const p of newState.players) {
      p.bet = 0;
      p.lastAction = undefined;
    }

    const phases: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    const currentIdx = phases.indexOf(newState.phase);
    const nextPhase = phases[currentIdx + 1];

    switch (nextPhase) {
      case 'flop':
        newState.deck.pop(); // burn
        newState.communityCards = [newState.deck.pop()!, newState.deck.pop()!, newState.deck.pop()!];
        break;
      case 'turn':
        newState.deck.pop(); // burn
        newState.communityCards.push(newState.deck.pop()!);
        break;
      case 'river':
        newState.deck.pop(); // burn
        newState.communityCards.push(newState.deck.pop()!);
        break;
      case 'showdown':
        resolveShowdown(newState);
        return;
    }

    newState.phase = nextPhase as GamePhase;
    
    // Find first active player after dealer
    let firstIdx = (newState.dealerIndex + 1) % newState.players.length;
    let attempts = 0;
    while (attempts < newState.players.length) {
      if (!newState.players[firstIdx].folded && !newState.players[firstIdx].isAllIn) break;
      firstIdx = (firstIdx + 1) % newState.players.length;
      attempts++;
    }

    // If all remaining players are all-in, run out the board
    const activePlayers = newState.players.filter(p => !p.folded && !p.isAllIn);
    if (activePlayers.length <= 1) {
      newState.currentPlayerIndex = firstIdx;
      setGameState(newState);
      // Auto-advance to next phase
      setTimeout(() => advancePhase(newState), 1000);
      return;
    }

    newState.currentPlayerIndex = firstIdx;
    setGameState(newState);

    if (newState.players[firstIdx].id !== 'human') {
      setTimeout(() => processBotTurn(newState), 800);
    }
  }, [processBotTurn]);

  const resolveShowdown = useCallback((state: GameState) => {
    const newState = { ...state, players: state.players.map(p => ({ ...p })) };
    newState.phase = 'showdown';

    const playersInHand = newState.players.filter(p => !p.folded);
    
    // Evaluate all hands
    for (const p of playersInHand) {
      p.handResult = evaluateHand(p.holeCards, newState.communityCards);
    }

    // Find winner(s)
    const sorted = [...playersInHand].sort((a, b) => (b.handResult?.score || 0) - (a.handResult?.score || 0));
    const bestScore = sorted[0]?.handResult?.score || 0;
    const winners = sorted.filter(p => p.handResult?.score === bestScore);
    
    const shareAmount = Math.floor(newState.pot / winners.length);
    newState.winners = winners.map(w => ({
      playerId: w.id,
      amount: shareAmount,
      hand: w.handResult?.name,
    }));

    for (const w of winners) {
      const player = newState.players.find(p => p.id === w.id);
      if (player) player.chips += shareAmount;
    }

    setGameState(newState);
    setShowdown(true);
  }, []);

  const playerAction = useCallback((action: PlayerAction, amount: number = 0) => {
    if (!gameState) return;
    const current = gameState.players[gameState.currentPlayerIndex];
    if (current.id !== 'human') return;
    executeAction(gameState, action, amount);
  }, [gameState, executeAction]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    gameState,
    isAnimating,
    showdown,
    initGame,
    startNewHand,
    playerAction,
    setGameState,
  };
}
