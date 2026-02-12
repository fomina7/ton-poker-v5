import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState, GamePhase, Player, PlayerAction,
  createDeck, evaluateHand, getBotAction, getCallAmount,
  getPlayersInHand, HandRank,
} from '@/lib/pokerEngine';
import { AVATAR_LIST } from '@/lib/assets';
import { Card } from '@/lib/assets';

const BOT_NAMES = ['SharkBite', 'OwlEye', 'FoxTrick', 'BearClaw', 'WolfFang'];

function createBotPlayers(count: number, startChips: number): Player[] {
  const avatarKeys = ['shark', 'owl', 'fox', 'bear', 'wolf'];
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

export function usePokerGame(playerCount: number = 6, blinds: [number, number] = [5, 10]) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showdown, setShowdown] = useState(false);
  const [autoDealing, setAutoDealing] = useState(false);
  const [preAction, setPreAction] = useState<'checkFold' | 'callAny' | 'foldToBet' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDealRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-deal: after showdown, wait 3s then start new hand
  useEffect(() => {
    if (showdown && gameState) {
      autoDealRef.current = setTimeout(() => {
        startNewHand(gameState);
      }, 3000);
      return () => {
        if (autoDealRef.current) clearTimeout(autoDealRef.current);
      };
    }
  }, [showdown]);

  const initGame = useCallback(() => {
    const startChips = 1000;
    const humanPlayer: Player = {
      id: 'human',
      name: 'Pro',
      avatar: 'cat',
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
      seatIndex: 0,
      lastAction: undefined,
    };
    const bots = createBotPlayers(playerCount - 1, startChips);
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
    setPreAction(null);
    const base = prevState || gameState;
    if (!base) return;

    // Remove busted players, rebuy bots
    const players: Player[] = base.players.map(p => {
      if (p.chips <= 0 && p.id !== 'human') {
        return { ...p, chips: 1000 }; // bot rebuy
      }
      if (p.chips <= 0 && p.id === 'human') {
        return { ...p, chips: 1000 }; // human rebuy
      }
      return { ...p };
    });

    const activePlayers = players.filter(p => p.chips > 0);
    if (activePlayers.length < 2) return;

    const deck = createDeck();
    const dealerIdx = (base.dealerIndex + 1) % activePlayers.length;
    const sbIdx = (dealerIdx + 1) % activePlayers.length;
    const bbIdx = (dealerIdx + 2) % activePlayers.length;

    const newPlayers: Player[] = activePlayers.map((p, i) => ({
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
    const sbAmount = Math.min(newPlayers[sbIdx].chips, base.smallBlind);
    newPlayers[sbIdx].chips -= sbAmount;
    newPlayers[sbIdx].bet = sbAmount;
    newPlayers[sbIdx].totalBet = sbAmount;

    const bbAmount = Math.min(newPlayers[bbIdx].chips, base.bigBlind);
    newPlayers[bbIdx].chips -= bbAmount;
    newPlayers[bbIdx].bet = bbAmount;
    newPlayers[bbIdx].totalBet = bbAmount;

    const firstToAct = (bbIdx + 1) % newPlayers.length;

    const newState: GameState = {
      phase: 'preflop',
      players: newPlayers,
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
    
    if (newPlayers[firstToAct].id !== 'human') {
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
        const callFirst = getCallAmount(player, newState);
        const raiseAmt = Math.max(amount, callFirst + newState.minRaise);
        const actualAmount = Math.min(raiseAmt, player.chips);
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

    // Handle pre-actions for human
    if (newState.players[nextIdx].id === 'human' && preAction) {
      const callAmt = getCallAmount(newState.players[nextIdx], newState);
      if (preAction === 'checkFold') {
        if (callAmt === 0) {
          setTimeout(() => executeAction(newState, 'check'), 300);
        } else {
          setTimeout(() => executeAction(newState, 'fold'), 300);
        }
        setPreAction(null);
        return;
      } else if (preAction === 'callAny') {
        setTimeout(() => executeAction(newState, callAmt > 0 ? 'call' : 'check', callAmt), 300);
        setPreAction(null);
        return;
      } else if (preAction === 'foldToBet') {
        if (callAmt > 0) {
          setTimeout(() => executeAction(newState, 'fold'), 300);
          setPreAction(null);
          return;
        }
        // If no bet, wait for player
        setPreAction(null);
      }
    }

    // If next player is bot, trigger bot action
    if (newState.players[nextIdx].id !== 'human' && !newState.players[nextIdx].folded && !newState.players[nextIdx].isAllIn) {
      const delay = 600 + Math.random() * 800;
      timeoutRef.current = setTimeout(() => processBotTurn(newState), delay);
    }
  }, [processBotTurn, preAction]);

  const advancePhase = useCallback((state: GameState) => {
    const newState = { ...state, players: state.players.map(p => ({ ...p })) };
    
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
    
    let firstIdx = (newState.dealerIndex + 1) % newState.players.length;
    let attempts = 0;
    while (attempts < newState.players.length) {
      if (!newState.players[firstIdx].folded && !newState.players[firstIdx].isAllIn) break;
      firstIdx = (firstIdx + 1) % newState.players.length;
      attempts++;
    }

    const activePlayers = newState.players.filter(p => !p.folded && !p.isAllIn);
    if (activePlayers.length <= 1) {
      newState.currentPlayerIndex = firstIdx;
      setGameState(newState);
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
    
    for (const p of playersInHand) {
      p.handResult = evaluateHand(p.holeCards, newState.communityCards);
    }

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
    setPreAction(null);
    executeAction(gameState, action, amount);
  }, [gameState, executeAction]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (autoDealRef.current) clearTimeout(autoDealRef.current);
    };
  }, []);

  return {
    gameState,
    showdown,
    initGame,
    startNewHand,
    playerAction,
    preAction,
    setPreAction,
  };
}
