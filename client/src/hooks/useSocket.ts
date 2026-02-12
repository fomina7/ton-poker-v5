/**
 * useSocket — WebSocket hook for real-time poker game
 * Connects to the server via socket.io for live game state updates
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ServerPlayer {
  seatIndex: number;
  name: string;
  avatar: string;
  chipStack: number;
  currentBet: number;
  folded: boolean;
  allIn: boolean;
  isBot: boolean;
  lastAction?: string;
  disconnected: boolean;
  sittingOut: boolean;
  holeCards: { suit: string; rank: string }[];
  userId: number | null;
}

export interface ServerGameState {
  tableId: number;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  communityCards: { suit: string; rank: string }[];
  currentBet: number;
  minRaise: number;
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  actionSeat: number;
  smallBlind: number;
  bigBlind: number;
  handNumber: number;
  actionDeadline: number;
  pots: { amount: number; eligiblePlayerIds: number[] }[];
  players: ServerPlayer[];
  mySeatIndex: number; // Server tells us which seat is ours
  serverTime: number;  // Server timestamp for timer sync
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ServerGameState | null>(null);
  const [mySeatIndex, setMySeatIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ socketId: string; message: string; timestamp: number }[]>([]);
  // Track server-client time offset for accurate timer
  const timeOffsetRef = useRef<number>(0);

  useEffect(() => {
    const socket = io({
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Server confirms our seat assignment
    socket.on('seat_assigned', (data: { seatIndex: number }) => {
      console.log('[WS] Seat assigned:', data.seatIndex);
      setMySeatIndex(data.seatIndex);
    });

    // Personalized game state (includes our hole cards)
    socket.on('game_state', (state: ServerGameState) => {
      // Calculate time offset between server and client
      if (state.serverTime) {
        timeOffsetRef.current = Date.now() - state.serverTime;
      }
      // Use mySeatIndex from server
      if (state.mySeatIndex !== undefined && state.mySeatIndex >= 0) {
        setMySeatIndex(state.mySeatIndex);
      }
      setGameState(state);
    });

    // Spectator state — only used if we're not seated
    socket.on('spectator_state', (state: ServerGameState) => {
      setGameState(prev => {
        if (prev && prev.mySeatIndex >= 0) return prev; // keep personalized state
        return state;
      });
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    socket.on('chat_message', (msg: { socketId: string; message: string; timestamp: number }) => {
      setChatMessages(prev => [...prev.slice(-50), msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinTable = useCallback((tableId: number, userId: number, seatIndex?: number) => {
    if (socketRef.current) {
      socketRef.current.emit('join_table', { tableId, userId, seatIndex });
      // Don't set mySeatIndex here — wait for server's seat_assigned event
    }
  }, []);

  const leaveTable = useCallback((tableId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_table', { tableId });
      setGameState(null);
      setMySeatIndex(-1);
    }
  }, []);

  const sendAction = useCallback((tableId: number, action: string, amount?: number) => {
    if (socketRef.current) {
      socketRef.current.emit('player_action', { tableId, action, amount });
    }
  }, []);

  const sendChat = useCallback((tableId: number, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit('chat_message', { tableId, message });
    }
  }, []);

  return {
    connected,
    gameState,
    mySeatIndex,
    error,
    chatMessages,
    timeOffset: timeOffsetRef.current,
    joinTable,
    leaveTable,
    sendAction,
    sendChat,
  };
}
